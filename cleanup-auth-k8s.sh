#!/bin/bash

echo "🧹 Cleaning up Authentication Service from Kubernetes"
echo "====================================================="

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

echo "🗑️  Deleting auth-service deployment..."
kubectl delete -f k8s/auth-service-deployment.yaml --ignore-not-found=true
kubectl delete -f k8s/auth-service-service.yaml --ignore-not-found=true

echo "🗑️  Deleting MySQL deployment..."
kubectl delete -f k8s/auth-mysql-statefulset.yaml --ignore-not-found=true
kubectl delete -f k8s/auth-mysql-service.yaml --ignore-not-found=true

echo "🗑️  Deleting secrets..."
kubectl delete -f k8s/auth-service-secret.yaml --ignore-not-found=true
kubectl delete -f k8s/auth-mysql-secret.yaml --ignore-not-found=true

echo "🗑️  Deleting persistent volume claims..."
kubectl delete pvc -l app=auth-mysql -n book-service --ignore-not-found=true

echo ""
echo "✅ Cleanup completed!"
echo ""
echo "📋 Remaining resources in book-service namespace:"
kubectl get all -n book-service 