#!/bin/bash

set -e
NAMESPACE=book-app

echo "🚀 Deploying Book Service + PostgreSQL + Kong (Fixed Configuration)"
echo "=================================================================="

# Set context to Docker Desktop
kubectl config use-context docker-desktop

# 1. Create namespace
echo "\n=== [1/6] Creating Namespace ==="
kubectl get namespace $NAMESPACE >/dev/null 2>&1 || kubectl create namespace $NAMESPACE

# 2. Deploy PostgreSQL and Redis
echo "\n=== [2/6] Deploying Databases ==="
kubectl apply -n $NAMESPACE -f k8s/postgres-deployment.yaml
kubectl apply -n $NAMESPACE -f k8s/redis-deployment.yaml

echo "Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=300s

# 3. Deploy Book Service
echo "\n=== [3/6] Deploying Book Service ==="
kubectl apply -n $NAMESPACE -f k8s/book-service-deployment.yaml
kubectl apply -n $NAMESPACE -f k8s/book-service-service.yaml

echo "Waiting for book service to be ready..."
kubectl wait --for=condition=ready pod -l app=book-service -n $NAMESPACE --timeout=300s

# 4. Deploy Kong Infrastructure
echo "\n=== [4/6] Deploying Kong Infrastructure ==="
kubectl apply -n $NAMESPACE -f k8s/kong-postgres-deployment.yaml
kubectl apply -n $NAMESPACE -f k8s/kong-postgres-service.yaml
kubectl wait --for=condition=ready pod -l app=kong-postgres -n $NAMESPACE --timeout=300s

# Run Kong migrations
kubectl apply -n $NAMESPACE -f k8s/kong-migration-job.yaml
kubectl wait --for=condition=complete job/kong-migrations -n $NAMESPACE --timeout=180s
kubectl delete -n $NAMESPACE job/kong-migrations || true

# Deploy Kong Gateway
kubectl apply -n $NAMESPACE -f k8s/kong-deployment.yaml
kubectl apply -n $NAMESPACE -f k8s/kong-service.yaml
kubectl wait --for=condition=ready pod -l app=kong -n $NAMESPACE --timeout=300s

# 5. Get Kong endpoints
KUBE_HOST=localhost
KONG_NODEPORT=$(kubectl get svc kong -n $NAMESPACE -o jsonpath='{.spec.ports[?(@.name=="proxy")].nodePort}')
KONG_ADMIN_NODEPORT=$(kubectl get svc kong -n $NAMESPACE -o jsonpath='{.spec.ports[?(@.name=="admin")].nodePort}')

echo "\n=== [5/6] Configuring Kong Routes ==="
export KONG_ADMIN_URL="http://$KUBE_HOST:$KONG_ADMIN_NODEPORT"

# Wait for Kong Admin API
for i in {1..30}; do
  if curl -s $KONG_ADMIN_URL/status > /dev/null; then
    echo "Kong Admin API ready"
    break
  fi
  echo "Waiting for Kong Admin API..."
  sleep 5
done

# Clean up existing configurations (ignore errors)
curl -s -X DELETE $KONG_ADMIN_URL/services/book-service 2>/dev/null || true

# Create Kong service with correct configuration
echo "Creating Kong service..."
curl -s -X POST $KONG_ADMIN_URL/services \
  --data name=book-service \
  --data protocol=http \
  --data host=book-service.book-app.svc.cluster.local \
  --data port=5000 \
  --data path=/

# Create routes with strip_path=false
echo "Creating Kong routes..."
curl -s -X POST $KONG_ADMIN_URL/routes \
  --data service.name=book-service \
  --data paths[]=/booksql \
  --data strip_path=false

curl -s -X POST $KONG_ADMIN_URL/routes \
  --data service.name=book-service \
  --data paths[]=/health \
  --data strip_path=false

# 6. Populate database with sample data
echo "\n=== [6/6] Populating Database ==="
kubectl port-forward -n $NAMESPACE svc/book-service 5000:5000 &
PORT_FORWARD_PID=$!
sleep 5

# Create sample books
for i in {1..5}; do
  curl -s -X POST http://localhost:5000/booksql \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"Sample Book $i\",
      \"author\": \"Author $i\",
      \"isbn\": \"978-123456789$i\",
      \"publisher\": \"Publisher $i\",
      \"publishDate\": \"2024-01-0$i\",
      \"genre\": \"Fiction\",
      \"description\": \"Sample book for testing\",
      \"price\": $((10 + i)),
      \"pages\": $((100 + i * 10))
    }" > /dev/null
done

kill $PORT_FORWARD_PID 2>/dev/null || true
echo "Sample books created!"

echo "\n✅ Deployment Complete!"
echo ""
echo "🔗 Kong API Gateway Endpoints:"
echo "  Proxy:     http://$KUBE_HOST:$KONG_NODEPORT"
echo "  Admin:     http://$KUBE_HOST:$KONG_ADMIN_NODEPORT"
echo ""
echo "📚 Book Service Endpoints:"
echo "  Get Books: http://$KUBE_HOST:$KONG_NODEPORT/booksql"
echo "  Health:    http://$KUBE_HOST:$KONG_NODEPORT/health"
echo ""
echo "🧪 Test Commands:"
echo "  curl http://$KUBE_HOST:$KONG_NODEPORT/booksql"
echo "  curl http://$KUBE_HOST:$KONG_NODEPORT/health"
echo ""
echo "📈 Performance Test:"
echo "  ab -n 1000 -c 50 http://$KUBE_HOST:$KONG_NODEPORT/booksql"
echo ""
echo "📊 Management:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl get svc -n $NAMESPACE"