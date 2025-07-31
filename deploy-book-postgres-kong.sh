#!/bin/bash

set -e
NAMESPACE=book-app

echo "🚀 Deploying Complete Book Service Stack"
echo "======================================="

# Set context to Docker Desktop
kubectl config use-context docker-desktop

# 1. Create namespace
echo "\n=== [1/8] Creating Namespace ==="
kubectl get namespace $NAMESPACE >/dev/null 2>&1 || kubectl create namespace $NAMESPACE

# 2. Deploy All Databases
echo "\n=== [2/8] Deploying Databases ==="
# PostgreSQL for book service
kubectl apply -n $NAMESPACE -f k8s/postgres-deployment.yaml
# MongoDB for book service
kubectl apply -n $NAMESPACE -f k8s/book-mongo-secret.yaml
kubectl apply -n $NAMESPACE -f k8s/book-mongo-service.yaml
kubectl apply -n $NAMESPACE -f k8s/book-mongo-statefulset.yaml
# Redis for caching
kubectl apply -n $NAMESPACE -f k8s/redis-deployment.yaml
# Service Registry MongoDB
kubectl apply -n $NAMESPACE -f k8s/service-registry-mongo-secret.yaml
kubectl apply -n $NAMESPACE -f k8s/service-registry-mongo-service.yaml
kubectl apply -n $NAMESPACE -f k8s/service-registry-mongo-statefulset.yaml

echo "Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=ready pod -l app=book-mongo -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=ready pod -l app=service-registry-mongo -n $NAMESPACE --timeout=300s

# 3. Deploy Service Registry
echo "\n=== [3/8] Deploying Service Registry ==="
kubectl apply -n $NAMESPACE -f k8s/service-registry-deployment.yaml
kubectl apply -n $NAMESPACE -f k8s/service-registry-service.yaml

echo "Waiting for service registry to be ready..."
kubectl wait --for=condition=ready pod -l app=service-registry -n $NAMESPACE --timeout=300s

# 4. Deploy Book Service
echo "\n=== [4/8] Deploying Book Service ==="
kubectl apply -n $NAMESPACE -f k8s/book-service-deployment.yaml
kubectl apply -n $NAMESPACE -f k8s/book-service-service.yaml
kubectl apply -n $NAMESPACE -f k8s/book-service-hpa.yaml

echo "Waiting for book service to be ready..."
kubectl wait --for=condition=ready pod -l app=book-service -n $NAMESPACE --timeout=300s

# 5. Deploy Kong Postgres
echo "\n=== [5/8] Deploying Kong Database ==="
kubectl apply -n $NAMESPACE -f k8s/kong-postgres-deployment.yaml
kubectl apply -n $NAMESPACE -f k8s/kong-postgres-service.yaml
kubectl wait --for=condition=ready pod -l app=kong-postgres -n $NAMESPACE --timeout=300s

# 6. Run Kong migrations
echo "\n=== [6/8] Running Kong Migrations ==="
kubectl apply -n $NAMESPACE -f k8s/kong-migration-job.yaml
kubectl wait --for=condition=complete job/kong-migrations -n $NAMESPACE --timeout=180s
kubectl delete -n $NAMESPACE job/kong-migrations || true

# 7. Deploy Kong
echo "\n=== [7/8] Deploying Kong Gateway ==="
kubectl apply -n $NAMESPACE -f k8s/kong-deployment.yaml
kubectl apply -n $NAMESPACE -f k8s/kong-service.yaml
kubectl wait --for=condition=ready pod -l app=kong -n $NAMESPACE --timeout=300s

# Get service endpoints
KUBE_HOST=localhost
KONG_NODEPORT=$(kubectl get svc kong -n $NAMESPACE -o jsonpath='{.spec.ports[?(@.name=="proxy")].nodePort}')
KONG_ADMIN_NODEPORT=$(kubectl get svc kong -n $NAMESPACE -o jsonpath='{.spec.ports[?(@.name=="admin")].nodePort}')

echo "\n=== Deployment Complete ==="
echo "Kong Proxy:     http://$KUBE_HOST:$KONG_NODEPORT"
echo "Kong Admin API: http://$KUBE_HOST:$KONG_ADMIN_NODEPORT"

# 8. Populate databases and register routes
echo "\n=== [8/8] Setting Up Data and Routes ==="

# Populate MongoDB with books
echo "Populating MongoDB with sample books..."
kubectl port-forward -n $NAMESPACE svc/book-service 5000:5000 &
PORT_FORWARD_PID=$!
sleep 5

# Create sample books in MongoDB
for i in {1..10}; do
  curl -s -X POST http://localhost:5000/books \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"Sample Book $i\",
      \"author\": \"Author $i\",
      \"isbn\": \"978-123456789$i\",
      \"publisher\": \"Publisher $i\",
      \"publishDate\": \"2024-01-0$i\",
      \"genre\": \"Fiction\",
      \"description\": \"A sample book for testing\",
      \"price\": $((10 + i)),
      \"pages\": $((100 + i * 10))
    }" > /dev/null
done

# Create sample books in PostgreSQL
for i in {1..10}; do
  curl -s -X POST http://localhost:5000/booksql \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"PostgreSQL Book $i\",
      \"author\": \"PG Author $i\",
      \"isbn\": \"978-987654321$i\",
      \"publisher\": \"PG Publisher $i\",
      \"publishDate\": \"2024-02-0$i\",
      \"genre\": \"Technology\",
      \"description\": \"A PostgreSQL sample book\",
      \"price\": $((15 + i)),
      \"pages\": $((150 + i * 15))
    }" > /dev/null
done

kill $PORT_FORWARD_PID 2>/dev/null || true
echo "Sample books created in both databases!"

# Register book service in Kong
export KONG_ADMIN_URL="http://$KUBE_HOST:$KONG_ADMIN_NODEPORT"

# Wait for Kong Admin API
for i in {1..30}; do
  if curl -s $KONG_ADMIN_URL/status > /dev/null; then
    break
  fi
  echo "Waiting for Kong Admin API..."
  sleep 5
done

# Register book-service
curl -s -X POST $KONG_ADMIN_URL/services \
  --data name=book-service \
  --data url='http://book-service.book-app.svc.cluster.local:5000'

curl -s -X POST $KONG_ADMIN_URL/routes \
  --data service.name=book-service \
  --data paths[]='/books' \
  --data paths[]='/booksql'

echo "\n✅ Complete Book Service Stack Deployed!"
echo ""
echo "🔗 API Endpoints:"
echo "  MongoDB Books:    http://$KUBE_HOST:$KONG_NODEPORT/books"
echo "  PostgreSQL Books: http://$KUBE_HOST:$KONG_NODEPORT/booksql"
echo "  Health Check:     http://$KUBE_HOST:$KONG_NODEPORT/books/health"
echo "  Service Registry: http://$KUBE_HOST:5007 (port-forward required)"
echo ""
echo "📊 Management:"
echo "  Kong Admin:       http://$KUBE_HOST:$KONG_ADMIN_NODEPORT"
echo "  Check Pods:       kubectl get pods -n $NAMESPACE"
echo "  Check Services:   kubectl get svc -n $NAMESPACE"
echo ""
echo "🧪 Test Commands:"
echo "  curl http://$KUBE_HOST:$KONG_NODEPORT/books"
echo "  curl http://$KUBE_HOST:$KONG_NODEPORT/booksql"
echo ""
echo "📈 Performance Test:"
echo "  ab -n 1000 -c 50 http://$KUBE_HOST:$KONG_NODEPORT/booksql"