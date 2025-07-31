#!/bin/bash

echo "🚀 Deploying Ultra-High Performance Configuration"
echo "==============================================="

# Build and update image
echo "📦 Building optimized image..."
docker build -f book-service/Dockerfile -t mushtaque87/book-service:ultra .

# Deploy infrastructure upgrades
echo "🔧 Deploying infrastructure upgrades..."
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/postgres-read-replica.yaml
kubectl apply -f k8s/redis-cluster.yaml

# Update book service with new image
echo "🚀 Updating book service..."
kubectl set image deployment/book-service book-service=mushtaque87/book-service:ultra -n book-app
kubectl apply -f k8s/book-service-deployment.yaml
kubectl apply -f k8s/book-service-hpa.yaml

# Wait for deployment
echo "⏳ Waiting for deployment to complete..."
kubectl rollout status deployment/book-service -n book-app
kubectl rollout status deployment/postgres -n book-app
kubectl rollout status deployment/redis -n book-app

echo "✅ Ultra-performance deployment complete!"
echo ""
echo "📊 Current Configuration:"
echo "- Book Service: 10 replicas, 2CPU/4GB each"
echo "- PostgreSQL: 2CPU/4GB, optimized settings"
echo "- Redis: 1CPU/2GB, optimized caching"
echo "- HPA: 10-50 replicas based on load"
echo ""
echo "🎯 Performance Targets:"
echo "- Ultra-high throughput: 2000+ RPS"
echo "- Ultra-low latency: <50ms"
echo "- Very high concurrent load: 1000+ users"