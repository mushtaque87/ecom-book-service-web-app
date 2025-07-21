# Authentication Service - Kubernetes Deployment

This guide will help you deploy and test the JWT Authentication Service on Kubernetes.

## Prerequisites

### Required Tools

- **kubectl** - Kubernetes command-line tool
- **Docker** - Container runtime
- **minikube** (for local development) - Local Kubernetes cluster

### Installation

#### macOS

```bash
# Install kubectl
brew install kubectl

# Install minikube
brew install minikube

# Install Docker Desktop
brew install --cask docker
```

#### Linux

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Install Docker
sudo apt-get update
sudo apt-get install docker.io
```

#### Windows

```bash
# Install kubectl
winget install -e --id Kubernetes.kubectl

# Install minikube
winget install -e --id Kubernetes.minikube

# Install Docker Desktop
winget install -e --id Docker.DockerDesktop
```

## Quick Start

### 1. Start Local Kubernetes Cluster

```bash
# Start minikube with sufficient resources
minikube start --cpus=4 --memory=8192 --disk-size=20g

# Verify cluster is running
kubectl cluster-info
```

### 2. Deploy Authentication Service

```bash
# Make scripts executable
chmod +x deploy-auth-k8s.sh
chmod +x test-auth-k8s.sh
chmod +x cleanup-auth-k8s.sh

# Deploy the service
./deploy-auth-k8s.sh
```

### 3. Test the Service

```bash
# Run tests
./test-auth-k8s.sh
```

### 4. Clean Up

```bash
# Remove the deployment
./cleanup-auth-k8s.sh
```

## Manual Deployment

If you prefer to deploy manually, follow these steps:

### 1. Build Docker Image

```bash
cd auth-service
docker build -t auth-service:latest .
cd ..
```

### 2. Apply Kubernetes Manifests

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets
kubectl apply -f k8s/auth-mysql-secret.yaml
kubectl apply -f k8s/auth-service-secret.yaml

# Deploy MySQL
kubectl apply -f k8s/auth-mysql-statefulset.yaml
kubectl apply -f k8s/auth-mysql-service.yaml

# Wait for MySQL to be ready
kubectl wait --for=condition=ready pod -l app=auth-mysql -n book-service --timeout=300s

# Deploy auth service
kubectl apply -f k8s/auth-service-deployment.yaml
kubectl apply -f k8s/auth-service-service.yaml

# Wait for auth service to be ready
kubectl wait --for=condition=ready pod -l app=auth-service -n book-service --timeout=300s
```

### 3. Access the Service

```bash
# Port forward to access the service locally
kubectl port-forward service/auth-service 5001:5001 -n book-service

# In another terminal, test the service
cd auth-service
node test-auth.js
```

## Kubernetes Resources

### Secrets

#### auth-mysql-secret.yaml

Contains MySQL database credentials:

- `mysql-root-password`: Root password for MySQL
- `mysql-database`: Database name
- `mysql-user`: Database user
- `mysql-password`: Database user password

#### auth-service-secret.yaml

Contains authentication service configuration:

- `JWT_SECRET`: Secret key for JWT token signing
- `DB_PASSWORD`: Database password

### StatefulSet

#### auth-mysql-statefulset.yaml

- MySQL 8.0 database
- Persistent storage (1Gi)
- Health checks (liveness and readiness probes)
- Resource limits and requests

### Deployment

#### auth-service-deployment.yaml

- Authentication service with 2 replicas
- Health checks (liveness, readiness, and startup probes)
- Resource limits and requests
- Environment variables from secrets

### Services

#### auth-mysql-service.yaml

- ClusterIP service for MySQL
- Port 3306

#### auth-service-service.yaml

- ClusterIP service for auth service
- Port 5001

## Monitoring and Debugging

### View Pod Status

```bash
# Check all pods in the namespace
kubectl get pods -n book-service

# Check specific service pods
kubectl get pods -n book-service -l app=auth-service
kubectl get pods -n book-service -l app=auth-mysql
```

### View Logs

```bash
# View auth service logs
kubectl logs -f deployment/auth-service -n book-service

# View MySQL logs
kubectl logs -f statefulset/auth-mysql -n book-service

# View logs from a specific pod
kubectl logs -f <pod-name> -n book-service
```

### Access Pod Shell

```bash
# Access auth service pod
kubectl exec -it <auth-service-pod-name> -n book-service -- /bin/sh

# Access MySQL pod
kubectl exec -it <mysql-pod-name> -n book-service -- mysql -u root -p
```

### Check Services

```bash
# List all services
kubectl get services -n book-service

# Get service details
kubectl describe service auth-service -n book-service
```

### Check Events

```bash
# View events in the namespace
kubectl get events -n book-service --sort-by='.lastTimestamp'
```

## Troubleshooting

### Common Issues

#### 1. Pod Stuck in Pending State

```bash
# Check pod events
kubectl describe pod <pod-name> -n book-service

# Check if there are resource constraints
kubectl describe nodes
```

#### 2. Pod Stuck in CrashLoopBackOff

```bash
# Check pod logs
kubectl logs <pod-name> -n book-service

# Check pod events
kubectl describe pod <pod-name> -n book-service
```

#### 3. Service Not Accessible

```bash
# Check if service exists
kubectl get service auth-service -n book-service

# Check if endpoints exist
kubectl get endpoints auth-service -n book-service

# Check if pods are ready
kubectl get pods -n book-service -l app=auth-service
```

#### 4. Database Connection Issues

```bash
# Check if MySQL is running
kubectl get pods -n book-service -l app=auth-mysql

# Check MySQL logs
kubectl logs statefulset/auth-mysql -n book-service

# Test database connection
kubectl exec -it <mysql-pod-name> -n book-service -- mysql -u root -p
```

### Performance Tuning

#### Resource Limits

Adjust resource limits in the deployment files based on your needs:

```yaml
resources:
  requests:
    memory: '128Mi'
    cpu: '100m'
  limits:
    memory: '256Mi'
    cpu: '200m'
```

#### Scaling

```bash
# Scale auth service to 3 replicas
kubectl scale deployment auth-service --replicas=3 -n book-service

# Check scaling status
kubectl get pods -n book-service -l app=auth-service
```

## Security Considerations

### Secrets Management

- Never commit real secrets to version control
- Use Kubernetes secrets or external secret management tools
- Rotate secrets regularly

### Network Policies

Consider implementing network policies to restrict pod-to-pod communication:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: auth-service-network-policy
  namespace: book-service
spec:
  podSelector:
    matchLabels:
      app: auth-service
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
      ports:
        - protocol: TCP
          port: 5001
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: auth-mysql
      ports:
        - protocol: TCP
          port: 3306
```

### RBAC

Consider implementing Role-Based Access Control for production deployments.

## Production Deployment

For production deployment, consider:

1. **Use a proper container registry** instead of local images
2. **Implement proper monitoring** with Prometheus and Grafana
3. **Set up logging** with ELK stack or similar
4. **Use ingress controllers** for external access
5. **Implement backup strategies** for the database
6. **Use managed Kubernetes services** (EKS, GKE, AKS)
7. **Implement proper CI/CD pipelines**

## Cleanup

To completely remove the authentication service:

```bash
# Delete all resources
kubectl delete -f k8s/ -n book-service

# Delete persistent volumes
kubectl delete pvc -l app=auth-mysql -n book-service

# Or use the cleanup script
./cleanup-auth-k8s.sh
```

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review pod logs and events
3. Verify all prerequisites are installed
4. Ensure sufficient cluster resources
5. Check network connectivity between pods
