# Kubernetes Deployment for Book App Microservices

## Prerequisites

- Kubernetes cluster (minikube, kind, GKE, EKS, etc.)
- kubectl configured
- (Recommended) NGINX Ingress Controller installed

## Deploy All Resources

```sh
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
```

## Notes

- All resources are deployed in the `book-app` namespace.
- Each microservice has its own MongoDB instance (StatefulSet + PVC).
- API Gateway is exposed via Ingress at `/` (see `ingress.yaml`).
- Update Ingress TLS section for your domain and SSL certs.
- For production, use an external/managed MongoDB or a production-ready operator.
- Kafka is not included; see `kafka-placeholder.yaml` for future integration.
- NetworkPolicy restricts traffic for security.

## Build & Push Images

You must build and push Docker images for each service to a registry accessible by your cluster, or use local images with minikube/kind:

```sh
docker build -t <your-repo>/user-service:latest user-service/
docker build -t <your-repo>/publisher-service:latest publisher-service/
# ...repeat for all services
```

## Accessing the App

- API Gateway: via Ingress (see your Ingress controller's external IP)
- Swagger docs: `/api-docs` on the gateway

## Clean Up

```sh
kubectl delete -f k8s/
```
