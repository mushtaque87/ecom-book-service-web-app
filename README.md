# Book Publishing SaaS Backend (Microservices)

This project is a microservice-based backend for a book publishing SaaS application. It allows users to search for publishers, browse and buy books, add to cart, and place orders. Each service is containerized and communicates via REST APIs with automatic service discovery.

## 🚀 Features

- **Microservices Architecture**: 8 independent services with clear boundaries
- **Service Discovery**: Automatic service registration and health monitoring
- **API Gateway**: Centralized routing with dynamic service discovery
- **Comprehensive API Documentation**: Swagger/OpenAPI documentation for all services
- **Analytics & Monitoring**: Prometheus metrics and event tracking
- **Containerized Deployment**: Docker-based deployment with docker-compose
- **Database Per Service**: Each service has its own MongoDB instance

## 📚 Microservices

- **user-service** (Port 5001): User registration, authentication, and profiles
- **publisher-service** (Port 5002): Publisher management
- **book-service** (Port 5003): Book management with comprehensive CRUD operations
- **search-service** (Port 5004): Search for publishers and books
- **cart-service** (Port 5005): User cart management
- **order-service** (Port 5006): Order processing
- **api-gateway** (Port 8080): Routes requests to the appropriate service
- **service-registry** (Port 5007): Service discovery and health monitoring
- **analytics-service** (Port 5010): Analytics tracking and metrics

## 🛠 Tech Stack

- **Backend**: Node.js (Express)
- **Database**: MongoDB (one per service)
- **Containerization**: Docker & docker-compose
- **Service Discovery**: Custom implementation
- **API Documentation**: Swagger/OpenAPI 3.0
- **Monitoring**: Prometheus metrics
- **Health Checks**: Automated health monitoring

## 📖 API Documentation

### Swagger UI Access

All services now include comprehensive Swagger documentation:

- **API Gateway**: http://localhost:8080/api-docs
- **Book Service**: http://localhost:5003/api-docs
- **User Service**: http://localhost:5001/api-docs
- **Analytics Service**: http://localhost:5010/api-docs

### Documentation Features

- **Interactive API Testing**: Test endpoints directly from the browser
- **Request/Response Examples**: Detailed examples for all endpoints
- **Schema Definitions**: Complete data models and validation rules
- **Authentication**: JWT bearer token support documented
- **Error Handling**: Comprehensive error response documentation
- **Filtering & Pagination**: Documented query parameters

### API Categories

#### 📚 Book Service APIs

- `GET /books` - Get all books with pagination and filtering
- `GET /books/{bookId}` - Get book by ID
- `POST /books` - Create a new book
- `PUT /books/{bookId}` - Update a book
- `DELETE /books/{bookId}` - Delete a book
- `GET /books/genre/{genre}` - Get books by genre
- `GET /search?q={query}` - Search books

#### 👤 User Service APIs

- `GET /profile/{userId}` - Get user profile
- `POST /register` - Register new user
- `POST /login` - User authentication
- `GET /services` - Get available services

#### 📊 Analytics Service APIs

- `POST /track` - Track analytics events
- `GET /events` - Get analytics events with filtering
- `GET /metrics` - Get current metrics
- `GET /metrics/prometheus` - Prometheus-formatted metrics
- `GET /analytics/dashboard` - Dashboard analytics data

#### 🔍 API Gateway APIs

- `GET /health` - Gateway health check
- `GET /registry/services` - Get all registered services
- All service endpoints are proxied through the gateway

## 🔧 Service Discovery System

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

## 🚀 Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 16+ (for local development)
- MongoDB (handled by Docker)

### Quick Start

1. Clone the repository

```bash
git clone <repository-url>
cd ecom-book-service-web-app
```

2. Start all services

```bash
docker-compose up --build
```

3. Access the services

- **API Gateway**: http://localhost:8080
- **API Documentation**: http://localhost:8080/api-docs
- **Service Registry Dashboard**: http://localhost:5007
- **Analytics Dashboard**: http://localhost:5010/api-docs

### Development Setup

1. Install dependencies for each service

```bash
cd book-service && npm install
cd ../user-service && npm install
cd ../analytics-service && npm install
# ... repeat for other services
```

2. Start services individually

```bash
# Terminal 1 - Service Registry
cd service-registry && npm start

# Terminal 2 - API Gateway
cd api-gateway && npm start

# Terminal 3 - Book Service
cd book-service && npm start

# ... continue for other services
```

## 📊 Monitoring & Analytics

### Prometheus Metrics

- **Metrics Endpoint**: http://localhost:5010/metrics/prometheus
- **Custom Counters**: Book views, cart additions, profile fetches, orders, registrations
- **System Metrics**: CPU, memory, HTTP request duration

### Health Checks

All services provide health check endpoints:

- `GET /health` - Returns service status and database connectivity

### Analytics Events

Tracked events include:

- `book_viewed` - When a book is viewed
- `book_added_to_cart` - When a book is added to cart
- `profile_fetched` - When a user profile is accessed
- `order_placed` - When an order is placed
- `user_registered` - When a new user registers

## 🔐 Security Features

### Authentication (Planned)

- JWT-based authentication
- Role-based access control (user, admin, publisher)
- API rate limiting
- Request/response encryption

### Current Security

- Service isolation with separate databases
- Health check validation
- Input validation and sanitization
- Error handling without sensitive data exposure

## 📁 Project Structure

```
/ecom-book-service-web-app/
├── api-gateway/           # API Gateway with Swagger docs
├── user-service/          # User management with auth
├── book-service/          # Book CRUD operations
├── cart-service/          # Shopping cart management
├── order-service/         # Order processing
├── search-service/        # Search functionality
├── publisher-service/     # Publisher management
├── analytics-service/     # Analytics and metrics
├── service-registry/      # Service discovery
├── shared/               # Shared utilities
│   └── service-discovery.js
├── docker-compose.yml    # Container orchestration
├── BookPublishing.postman_collection.json
└── README.md
```

## 🧪 Testing

### API Testing

1. **Swagger UI**: Use the interactive documentation at each service's `/api-docs` endpoint
2. **Postman**: Import the provided Postman collection
3. **cURL**: Use the documented endpoints with examples

### Example API Calls

#### Create a Book

```bash
curl -X POST http://localhost:8080/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0743273565",
    "publisher": "Scribner",
    "publishDate": "1925-04-10",
    "genre": "Fiction",
    "description": "A story of the fabulously wealthy Jay Gatsby",
    "price": 19.99,
    "pages": 180
  }'
```

#### Track Analytics Event

```bash
curl -X POST http://localhost:8080/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "type": "book_viewed",
    "payload": {"bookId": "507f1f77bcf86cd799439011"}
  }'
```

## 🔄 Service Communication

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

## 📈 Scaling Considerations

### Horizontal Scaling

- Each service can be scaled independently
- Load balancing through API Gateway
- Database sharding per service

### Performance Optimization

- Redis caching (planned)
- CDN for static content (planned)
- Database indexing and query optimization

## 🚧 Future Enhancements

### Phase 1: Security & Reliability

- [ ] JWT authentication implementation
- [ ] API rate limiting
- [ ] Circuit breaker pattern
- [ ] Comprehensive error handling

### Phase 2: Event-Driven Architecture

- [ ] RabbitMQ integration
- [ ] Event sourcing
- [ ] Saga pattern for distributed transactions
- [ ] CQRS implementation

### Phase 3: Observability

- [ ] ELK Stack integration
- [ ] Distributed tracing (Jaeger)
- [ ] Advanced metrics and alerting
- [ ] Centralized logging

### Phase 4: Scalability

- [ ] Kubernetes deployment
- [ ] Auto-scaling
- [ ] Load balancing
- [ ] Database optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **API Documentation**: Access Swagger UI at each service's `/api-docs` endpoint
- **Service Registry**: Monitor services at http://localhost:5007
- **Issues**: Create an issue in the repository
- **Email**: support@bookservice.com

## 📝 Notes

- No frontend included (backend only)
- Each service is isolated and can be scaled independently
- Service discovery provides automatic failover and load balancing capabilities
- Health checks run every 30 seconds
- Services send heartbeats every 30 seconds
- All APIs are documented with Swagger/OpenAPI 3.0
- Prometheus metrics are available for monitoring

## ☁️ Deploying to Linode Kubernetes

### Environment Variables in Kubernetes

When deploying to Linode Kubernetes (or any Kubernetes cluster), you must set environment variables in your deployment YAML files. If these are not set, your services will use fallback/default values (e.g., default ports, localhost MongoDB URLs), which will cause connectivity issues.

**Example (in your deployment YAML):**

```yaml
env:
  - name: PORT
    value: '5000'
  - name: MONGO_URL
    value: mongodb://mongo:mongo123@book-mongo:27017/bookdb?authSource=admin
```

- The variable names must match what your code expects (e.g., `PORT`, `MONGO_URL`).
- The values must be quoted if they are numbers (e.g., `"5000"`).

### Applying Changes

After editing your deployment YAML, apply it with:

```sh
kubectl apply -f k8s/<your-deployment-file>.yaml
```

If you change environment variables, restart the pod to pick up the new values:

```sh
kubectl delete pod <pod-name> -n <namespace>
```

### Verifying Environment Variables in a Pod

To check if your environment variables are set correctly in a running pod:

```sh
kubectl exec -it <pod-name> -n <namespace> -- printenv | grep <VAR_NAME>
```

Example:

```sh
kubectl exec -it book-service-xxxx -n book-app -- printenv | grep MONGO_URL
```

### Troubleshooting Fallback Values

- If your app is using fallback ports or MongoDB URLs, it means the environment variable is not set or is misspelled in the deployment YAML.
- Double-check the `env` section and redeploy.
