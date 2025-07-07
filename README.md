# Book Publishing SaaS Backend (Microservices)

This project is a microservice-based backend for a book publishing SaaS application. It allows users to search for publishers, browse and buy books, add to cart, and place orders. Each service is containerized and communicates via REST APIs with automatic service discovery.

## Microservices
- **user-service**: User registration, authentication, and profiles
- **publisher-service**: Publisher management
- **book-service**: Book management
- **search-service**: Search for publishers and books
- **cart-service**: User cart management
- **order-service**: Order processing
- **api-gateway**: Routes requests to the appropriate service
- **service-registry**: Service discovery and health monitoring

## Tech Stack
- Node.js (Express)
- MongoDB (one per service)
- Docker & docker-compose
- Service Discovery (custom implementation)

## Service Discovery System

### How It Works
1. **Service Registration**: Each service automatically registers itself with the service registry on startup
2. **Health Monitoring**: The registry continuously monitors service health via periodic health checks
3. **Dynamic Routing**: The API Gateway uses service discovery to route requests to healthy services
4. **Fallback**: If service discovery fails, the gateway falls back to static service URLs

### Service Registry Dashboard
Access the service registry dashboard at: `http://localhost:5007`
- View all registered services
- Monitor service health status
- See last heartbeat timestamps
- Auto-refreshes every 30 seconds

### API Endpoints
- **Service Registry**: `http://localhost:5007`
  - `GET /services` - List all healthy services
  - `GET /services/:name` - Get specific service info
  - `POST /register` - Register a new service
  - `POST /heartbeat/:name` - Send heartbeat

- **API Gateway**: `http://localhost:8080`
  - `GET /registry/services` - View services from gateway
  - All other routes proxy to appropriate services

## Getting Started
1. Clone the repo
2. Run `docker-compose up --build` to start all services
3. Access the service registry dashboard at `http://localhost:5007`
4. Use the API Gateway at `http://localhost:8080` for all API calls

## Service Communication
Services can discover each other using the shared `ServiceDiscovery` class:

```javascript
const ServiceDiscovery = require('../shared/service-discovery');
const serviceDiscovery = new ServiceDiscovery();

// Discover a service
const bookServiceUrl = await serviceDiscovery.getServiceUrl('book-service');
if (bookServiceUrl) {
  // Make API call to book service
  const response = await axios.get(`${bookServiceUrl}/books`);
}
```

## Folder Structure
```
/book-publishing-saas/
  /user-service/
  /publisher-service/
  /book-service/
  /search-service/
  /cart-service/
  /order-service/
  /api-gateway/
  /service-registry/
  /shared/
    service-discovery.js
  docker-compose.yml
  README.md
```

## Notes
- No frontend included (backend only)
- Each service is isolated and can be scaled independently
- Service discovery provides automatic failover and load balancing capabilities
- Health checks run every 30 seconds
- Services send heartbeats every 30 seconds 