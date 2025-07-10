const express = require('express');
const mongoose = require('mongoose');
const ServiceDiscovery = require('./shared/service-discovery');
require('dotenv').config();
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/userdb';

// Initialize service discovery
const serviceDiscovery = new ServiceDiscovery();

// Swagger configuration for User Service
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'User Service API',
      version: '1.0.0',
      description: 'API for managing users in the E-commerce Book Service',
      contact: {
        name: 'User Service Support',
        email: 'users@bookservice.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'User Service Development Server'
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
        User: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439012' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', example: 'hashedPassword123' },
            role: { 
              type: 'string', 
              enum: ['user', 'admin', 'publisher'], 
              default: 'user',
              example: 'user'
            },
            profile: {
              type: 'object',
              properties: {
                avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
                bio: { type: 'string', example: 'Book lover and avid reader' },
                preferences: {
                  type: 'object',
                  properties: {
                    favoriteGenres: {
                      type: 'array',
                      items: { type: 'string' },
                      example: ['Fiction', 'Mystery']
                    },
                    notifications: { type: 'boolean', default: true, example: true }
                  }
                }
              }
            },
            createdAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' },
            updatedAt: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
          }
        },
        UserProfile: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '507f1f77bcf86cd799439012' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', example: 'user' },
            bookServiceAvailable: { type: 'boolean', example: true }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            password: { type: 'string', example: 'password123' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' }
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
      { name: 'Users', description: 'User management operations' },
      { name: 'Authentication', description: 'Authentication operations' },
      { name: 'Health', description: 'Health check endpoints' }
    ]
  },
  apis: ['./index.js']
};

const specs = swaggerJsdoc(swaggerOptions);

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('User Service MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Register service on startup
const registerService = async () => {
  try {
    await serviceDiscovery.register(
      'user-service',
      `http://user-service:${PORT}`,
      PORT,
      { version: '1.0.0', description: 'User management service' }
    );
  } catch (error) {
    console.error('Failed to register service:', error.message);
    // Retry after 5 seconds
    setTimeout(registerService, 5000);
  }
};

// Swagger UI
app.use('/users/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'User Service API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true
  }
}));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: User Service Health Check
 *     description: Check if the User Service is healthy
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: User Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "User Service healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: string
 *                   example: "connected"
 */

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'User Service healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

/**
 * @swagger
 * /services:
 *   get:
 *     summary: Get All Available Services
 *     description: Retrieve all services registered with the service discovery
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: List of all available services
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
 *                     example: "healthy"
 *       500:
 *         description: Failed to get services
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Get all available services (for debugging)
app.get('/services', async (req, res) => {
  try {
    const services = await serviceDiscovery.getAllServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get services' });
  }
});

/**
 * @swagger
 * /profile/{userId}:
 *   get:
 *     summary: Get User Profile
 *     description: Retrieve user profile information with service discovery demonstration
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User profile information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       500:
 *         description: Failed to get profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Example: Get user profile (demonstrates service discovery)
app.get('/profile/:userId', async (req, res) => {
  try {
    // Track analytics event
    try {
      await axios.post('http://analytics-service:5010/track', {
        type: 'profile_fetched',
        payload: { userId: req.params.userId }
      });
    } catch (analyticsError) {
      console.log('Analytics service not available, skipping tracking');
    }

    // Example: Discover book service to get user's favorite books
    const bookServiceUrl = await serviceDiscovery.getServiceUrl('book-service');
    
    if (bookServiceUrl) {
      // This would be a real API call to book service
      console.log(`Would call book service at: ${bookServiceUrl}/users/${req.params.userId}/favorites`);
    }
    
    res.json({ 
      userId: req.params.userId,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      bookServiceAvailable: !!bookServiceUrl
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register New User
 *     description: Create a new user account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['name', 'email', 'password']
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *               role:
 *                 type: string
 *                 enum: ['user', 'admin', 'publisher']
 *                 default: "user"
 *                 example: "user"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

app.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user' } = req.body;
    
    // Check if user already exists
    // const existingUser = await User.findOne({ email });
    // if (existingUser) {
    //   return res.status(409).json({ error: 'User already exists' });
    // }
    
    // Hash password and create user
    // const hashedPassword = await bcrypt.hash(password, 10);
    // const user = new User({ name, email, password: hashedPassword, role });
    // const savedUser = await user.save();
    
    // For demo purposes, return mock data
    const mockUser = {
      _id: '507f1f77bcf86cd799439012',
      name,
      email,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    res.status(201).json(mockUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User Login
 *     description: Authenticate user and return JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate credentials
    // const user = await User.findOne({ email });
    // if (!user || !(await bcrypt.compare(password, user.password))) {
    //   return res.status(401).json({ error: 'Invalid credentials' });
    // }
    
    // Generate JWT token
    // const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    // For demo purposes, return mock data
    const mockResponse = {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTIiLCJyb2xlIjoidXNlciIsImlhdCI6MTcwNTQ5NzIwMCwiZXhwIjoxNzA1NTgzNjAwfQ.example',
      user: {
        _id: '507f1f77bcf86cd799439012',
        name: 'John Doe',
        email,
        role: 'user'
      }
    };
    
    res.json(mockResponse);
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
  console.log(`User Service Swagger docs available at: http://localhost:${PORT}/api-docs`);
  // Register service after server starts
  setTimeout(registerService, 2000);
}); 