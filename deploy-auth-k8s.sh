#!/bin/bash

echo "🔐 Deploying Authentication Service to Kubernetes"
echo "=================================================="

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if minikube is running (for local development)
if command -v minikube &> /dev/null; then
    if ! minikube status | grep -q "Running"; then
        echo "🚀 Starting minikube..."
        minikube start --cpus=4 --memory=8192 --disk-size=20g
    else
        echo "✅ minikube is already running"
    fi
    
    # Enable minikube docker daemon
    eval $(minikube docker-env)
fi

echo ""
echo "📦 Building Docker image for auth-service..."

# Build the Docker image
cd auth-service
docker build -t auth-service:latest .
cd ..

echo ""
echo "🚀 Deploying to Kubernetes..."

# Apply namespace if it doesn't exist
kubectl apply -f k8s/namespace.yaml

# Apply secrets
echo "📝 Creating secrets..."
kubectl apply -f k8s/auth-mysql-secret.yaml
kubectl apply -f k8s/auth-service-secret.yaml

# Apply MySQL
echo "🗄️  Deploying MySQL..."
kubectl apply -f k8s/auth-mysql-statefulset.yaml
kubectl apply -f k8s/auth-mysql-service.yaml

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
kubectl wait --for=condition=ready pod -l app=auth-mysql -n book-service --timeout=300s

# Apply auth service
echo "🔐 Deploying Authentication Service..."
kubectl apply -f k8s/auth-service-deployment.yaml
kubectl apply -f k8s/auth-service-service.yaml

# Wait for auth service to be ready
echo "⏳ Waiting for Authentication Service to be ready..."
kubectl wait --for=condition=ready pod -l app=auth-service -n book-service --timeout=300s

echo ""
echo "🔍 Checking deployment status..."

# Check pods
echo "📋 Pod Status:"
kubectl get pods -n book-service -l app=auth-service
kubectl get pods -n book-service -l app=auth-mysql

# Check services
echo ""
echo "🌐 Service Status:"
kubectl get services -n book-service | grep auth

# Get service URL
if command -v minikube &> /dev/null; then
    echo ""
    echo "🔗 Service URLs:"
    echo "   Auth Service: $(minikube service auth-service -n book-service --url)"
    echo "   MySQL: $(minikube ip):$(kubectl get service auth-mysql -n book-service -o jsonpath='{.spec.ports[0].nodePort}')"
fi

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Test the service: ./test-auth-k8s.sh"
echo "   2. View logs: kubectl logs -f deployment/auth-service -n book-service"
echo "   3. Access service: kubectl port-forward service/auth-service 5001:5001 -n book-service"
echo "   4. Delete deployment: kubectl delete -f k8s/ -n book-service" 