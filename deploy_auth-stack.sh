#!/bin/bash

set -e
NAMESPACE=book-app

# Set context to Docker Desktop
kubectl config use-context docker-desktop

# 1. Create namespace if it doesn't exist
kubectl get namespace $NAMESPACE >/dev/null 2>&1 || kubectl create namespace $NAMESPACE

echo "\n=== [1/7] Deploying Databases ==="
# MySQL for auth-service
echo "Deploying MySQL for auth-service..."
kubectl apply -n $NAMESPACE -f k8s/auth-mysql-secret.yaml
kubectl apply -n $NAMESPACE -f k8s/auth-mysql-service.yaml
kubectl apply -n $NAMESPACE -f k8s/auth-mysql-statefulset.yaml
# MongoDB for book-service
echo "Deploying MongoDB for book-service..."
kubectl apply -n $NAMESPACE -f k8s/book-mongo-secret.yaml
kubectl apply -n $NAMESPACE -f k8s/book-mongo-service.yaml
kubectl apply -n $NAMESPACE -f k8s/book-mongo-statefulset.yaml

# 2. Wait for databases to be ready
echo "\nWaiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=auth-mysql -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=ready pod -l app=book-mongo -n $NAMESPACE --timeout=300s

# 3. Deploy services
echo "\n=== [2/7] Deploying Services ==="
kubectl apply -n $NAMESPACE -f k8s/auth-service-secret.yaml
kubectl apply -n $NAMESPACE -f k8s/auth-service-deployment.yaml
kubectl apply -n $NAMESPACE -f k8s/auth-service-service.yaml
kubectl apply -n $NAMESPACE -f k8s/book-service-deployment.yaml
kubectl apply -n $NAMESPACE -f k8s/book-service-service.yaml

# 4. Wait for services to be ready
echo "\nWaiting for service pods to be ready..."
kubectl wait --for=condition=ready pod -l app=auth-service -n $NAMESPACE --timeout=300s
kubectl wait --for=condition=ready pod -l app=book-service -n $NAMESPACE --timeout=300s

# 5. Deploy Kong and Postgres
echo "\n=== [3/7] Deploying Kong and Postgres ==="
kubectl apply -n $NAMESPACE -f k8s/kong-postgres-deployment.yaml
kubectl apply -n $NAMESPACE -f k8s/kong-postgres-service.yaml
kubectl wait --for=condition=ready pod -l app=kong-postgres -n $NAMESPACE --timeout=300s

# 6. Run Kong migrations
echo "\nRunning Kong migrations..."
kubectl apply -n $NAMESPACE -f k8s/kong-migration-job.yaml
kubectl wait --for=condition=complete job/kong-migrations -n $NAMESPACE --timeout=180s
kubectl delete -n $NAMESPACE job/kong-migrations || true

# 7. Deploy Kong
echo "\nDeploying Kong..."
kubectl apply -n $NAMESPACE -f k8s/kong-deployment.yaml
kubectl apply -n $NAMESPACE -f k8s/kong-service.yaml
kubectl wait --for=condition=ready pod -l app=kong -n $NAMESPACE --timeout=300s

# 8. Print endpoints
KUBE_HOST=localhost

KONG_NODEPORT=$(kubectl get svc kong -n $NAMESPACE -o jsonpath='{.spec.ports[?(@.name=="proxy")].nodePort}')
KONG_ADMIN_NODEPORT=$(kubectl get svc kong -n $NAMESPACE -o jsonpath='{.spec.ports[?(@.name=="admin")].nodePort}')
#MINIKUBE_IP=$(minikube ip 2>/dev/null || echo "<your-cluster-ip>")


echo "\n=== Deployment Complete ==="
echo "Kong Proxy:     http://$KUBE_HOST:$KONG_NODEPORT"
echo "Kong Admin API: http://$KUBE_HOST:$KONG_ADMIN_NODEPORT"
echo "Auth Service:   http://<cluster-ip>:5001 (via Kong)"
echo "Book Service:   http://<cluster-ip>:5000 (via Kong)"
echo "\nCheck pod status: kubectl get pods -n $NAMESPACE"
echo "Check services:  kubectl get svc -n $NAMESPACE"

# 9. Register services and routes in Kong
echo "\nRegistering services and routes in Kong..."
export KONG_ADMIN_URL="http://$KUBE_HOST:$KONG_ADMIN_NODEPORT"

# Wait for Kong Admin API to be ready
for i in {1..30}; do
  if curl -s $KONG_ADMIN_URL/status > /dev/null; then
    break
  fi
  echo "Waiting for Kong Admin API..."
  sleep 5
done

# Register auth-service
curl -s -o /dev/null -w "%{http_code}\n" -X POST $KONG_ADMIN_URL/services \
  --data name=auth-service \
  --data url='http://auth-service.book-app.svc.cluster.local:5001'

curl -s -o /dev/null -w "%{http_code}\n" -X POST $KONG_ADMIN_URL/routes \
  --data service.name=auth-service \
  --data paths[]='/auth'

# Register book-service
curl -s -o /dev/null -w "%{http_code}\n" -X POST $KONG_ADMIN_URL/services \
  --data name=book-service \
  --data url='http://book-service.book-app.svc.cluster.local:5000'

curl -s -o /dev/null -w "%{http_code}\n" -X POST $KONG_ADMIN_URL/routes \
  --data service.name=book-service \
  --data paths[]='/books'

echo "\n=== Kong Routes Registered ==="
echo "Test your APIs via Kong:"
echo "  http://$KUBE_HOST:$KONG_NODEPORT/auth/health"
echo "  http://$KUBE_HOST:$KONG_NODEPORT/books/health" 