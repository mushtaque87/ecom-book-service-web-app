const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();

const REGISTRY_URL = 'http://service-registry:5007';

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-commerce Book Service API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the E-commerce Book Service microservices architecture',
      contact: {
        name: 'API Support',
        email: 'support@bookservice.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server'
      },
      {
        url: 'https://api.bookservice.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Book: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'The Great Gatsby' },
            author: { type: 'string', example: 'F. Scott Fitzgerald' },
            isbn: { type: 'string', example: '978-0743273565' },
            publisher: { type: 'string', example: 'Scribner' },
            publishDate: { type: 'string', format: 'date', example: '1925-04-10' },
            genre: { 
              type: 'string', 
              enum: ['Fiction', 'Non-Fiction', 'Science Fiction', 'Mystery', 'Romance', 'Thriller', 'Biography', 'History', 'Self-Help', 'Business', 'Technology', 'Science', 'Philosophy', 'Poetry', 'Drama'],
              example: 'Fiction'
            },
            description: { type: 'string', example: 'A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.' },
            price: { type: 'number', example: 19.99 },
            pages: { type: 'number', example: 180 },
            language: { type: 'string', example: 'English' },
            coverImage: { type: 'string', example: 'https://example.com/cover.jpg' },
            rating: { type: 'number', minimum: 0, maximum: 5, example: 4.5 },
            stock: { type: 'number', example: 50 },
            isAvailable: { type: 'boolean', example: true }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['user', 'admin', 'publisher'], example: 'user' }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439013' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  bookId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                  quantity: { type: 'number', example: 2 },
                  price: { type: 'number', example: 19.99 }
                }
              }
            },
            total: { type: 'number', example: 39.98 }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439014' },
            userId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  bookId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                  quantity: { type: 'number', example: 2 },
                  price: { type: 'number', example: 19.99 }
                }
              }
            },
            total: { type: 'number', example: 39.98 },
            status: { 
              type: 'string', 
              enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
              example: 'pending'
            },
            shippingAddress: { type: 'string', example: '123 Main St, City, State 12345' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' },
            code: { type: 'string', example: 'VALIDATION_ERROR' }
          }
        }
      }
    },
    tags: [
      { name: 'Books', description: 'Book management operations' },
      { name: 'Users', description: 'User management operations' },
      { name: 'Cart', description: 'Shopping cart operations' },
      { name: 'Orders', description: 'Order management operations' },
      { name: 'Search', description: 'Search operations' },
      { name: 'Publishers', description: 'Publisher management operations' },
      { name: 'Analytics', description: 'Analytics and metrics' },
      { name: 'Health', description: 'Health check endpoints' }
    ]
  },
  apis: ['./index.js'] // Path to the API docs
};

const specs = swaggerJsdoc(swaggerOptions);

// Service mapping for fallback
const serviceMapping = {
  'users': 'http://user-service:5000',
  'publishers': 'http://publisher-service:5000',
  'books': 'http://book-service:5000',
  'search': 'http://search-service:5000',
  'cart': 'http://cart-service:5000',
  'orders': 'http://order-service:5000'
};

// Dynamic proxy middleware
const createDynamicProxy = (serviceName) => {
  return async (req, res, next) => {
    try {
      // Try to get service URL from registry
      const response = await axios.get(`${REGISTRY_URL}/services/${serviceName}`);
      const service = response.data;
      
      if (service && service.health === 'healthy') {
        console.log(`Routing to ${serviceName} at ${service.url}`);
        return createProxyMiddleware({ 
          target: service.url, 
          changeOrigin: true 
        })(req, res, next);
      } else {
        throw new Error('Service unhealthy');
      }
    } catch (error) {
      console.log(`Service discovery failed for ${serviceName}, using fallback`);
      // Fallback to static mapping
      const fallbackUrl = serviceMapping[serviceName];
      if (fallbackUrl) {
        return createProxyMiddleware({ 
          target: fallbackUrl, 
          changeOrigin: true 
        })(req, res, next);
      } else {
        res.status(503).json({ error: `Service ${serviceName} not available` });
      }
    }
  };
};

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'E-commerce Book Service API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    deepLinking: true
  }
}));

// API Documentation endpoints
/**
 * @swagger
 * /api-docs:
 *   get:
 *     summary: API Documentation
 *     description: Interactive API documentation using Swagger UI
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Swagger UI interface
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: API Gateway Health Check
 *     description: Check if the API Gateway is healthy
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API Gateway is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "API Gateway healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: API Gateway is unhealthy
 */

/**
 * @swagger
 * /registry/services:
 *   get:
 *     summary: Get All Registered Services
 *     description: Retrieve all services registered with the service registry
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: List of all registered services
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "book-service"
 *                   url:
 *                     type: string
 *                     example: "http://book-service:5000"
 *                   health:
 *                     type: string
 *                     enum: ["healthy", "unhealthy", "unknown"]
 *                     example: "healthy"
 *                   lastHeartbeat:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Failed to get services from registry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Dynamic routes
app.use('/users', createDynamicProxy('user-service'));
app.use('/publishers', createDynamicProxy('publisher-service'));
app.use('/books', createDynamicProxy('book-service'));
app.use('/search', createDynamicProxy('search-service'));
app.use('/cart', createDynamicProxy('cart-service'));
app.use('/orders', createDynamicProxy('order-service'));

// Service registry endpoints
app.get('/registry/services', async (req, res) => {
  try {
    const response = await axios.get(`${REGISTRY_URL}/services`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get services from registry' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'API Gateway healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Swagger documentation available at: http://localhost:${PORT}/api-docs`);
}); 