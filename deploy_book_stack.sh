#!/bin/bash

set -e

NAMESPACE=book-app

# Create namespace if it doesn't exist
kubectl get namespace $NAMESPACE >/dev/null 2>&1 || kubectl create namespace $NAMESPACE

echo "Applying MongoDB secrets, services, and statefulsets for book-service..."
kubectl apply -n $NAMESPACE -f k8s/book-mongo-secret.yaml
kubectl apply -n $NAMESPACE -f k8s/book-mongo-service.yaml
kubectl apply -n $NAMESPACE -f k8s/book-mongo-statefulset.yaml

echo "Applying MongoDB secrets, services, and statefulsets for service-registry..."
kubectl apply -n $NAMESPACE -f k8s/service-registry-mongo-secret.yaml
kubectl apply -n $NAMESPACE -f k8s/service-registry-mongo-service.yaml
kubectl apply -n $NAMESPACE -f k8s/service-registry-mongo-statefulset.yaml

echo "Applying deployments and services for book-service, service-registry, and api-gateway..."


kubectl apply -n $NAMESPACE -f k8s/service-registry-deployment.yaml
kubectl apply -n $NAMESPACE -f k8s/service-registry-service.yaml

kubectl apply -n $NAMESPACE -f k8s/api-gateway-deployment.yaml
kubectl apply -n $NAMESPACE -f k8s/api-gateway-service.yaml

kubectl apply -n $NAMESPACE -f k8s/book-service-deployment.yaml
kubectl apply -n $NAMESPACE -f k8s/book-service-service.yaml

echo "Applying ingress..."
kubectl apply -n $NAMESPACE -f k8s/all-services-ingress.yaml

echo "Book service stack (book-service, service-registry, api-gateway) has been deployed to namespace $NAMESPACE." 