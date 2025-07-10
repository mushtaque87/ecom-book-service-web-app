#!/bin/bash
set -e

# 1. Build Docker images for all services
SERVICES=(user-service publisher-service book-service search-service cart-service order-service analytics-service api-gateway service-registry)
echo "Building Docker images..."
for SERVICE in "${SERVICES[@]}"; do
  echo "Building $SERVICE..."
  docker build -t $SERVICE:latest -f $SERVICE/Dockerfile .
done

echo "All images built."

# 2. Ensure Docker Desktop's Kubernetes is enabled
if ! kubectl config current-context | grep -q 'docker-desktop'; then
  echo "Please switch your kubectl context to Docker Desktop's Kubernetes and try again."
  exit 1
fi

echo "Kubernetes context: $(kubectl config current-context)"

# 3. Create namespace first
kubectl apply -f k8s/namespace.yaml

# 4. Deploy all manifests
kubectl apply -f k8s/

echo "Deployment started. Check status with: kubectl get pods -n book-app"
echo "To access the API Gateway, use your Ingress controller's IP (see README-k8s.md)." 