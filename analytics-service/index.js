const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const client = require('prom-client');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5010;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/analyticsdb';

// Swagger configuration for Analytics Service
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Analytics Service API',
      version: '1.0.0',
      description: 'API for tracking analytics and metrics in the E-commerce Book Service',
      contact: {
        name: 'Analytics Service Support',
        email: 'analytics@bookservice.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Analytics Service Development Server'
      }
    ],
    components: {
      schemas: {
        Event: {
          type: 'object',
          required: ['type'],
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439015' },
            type: { 
              type: 'string', 
              enum: ['book_viewed', 'book_added_to_cart', 'profile_fetched', 'order_placed', 'user_registered'],
              example: 'book_viewed'
            },
            payload: { 
              type: 'object',
              example: { bookId: '507f1f77bcf86cd799439011', userId: '507f1f77bcf86cd799439012' }
            },
            timestamp: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
          }
        },
        TrackEventRequest: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { 
              type: 'string', 
              enum: ['book_viewed', 'book_added_to_cart', 'profile_fetched', 'order_placed', 'user_registered'],
              example: 'book_viewed'
            },
            payload: { 
              type: 'object',
              example: { bookId: '507f1f77bcf86cd799439011' }
            }
          }
        },
        TrackEventResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            eventId: { type: 'string', example: '507f1f77bcf86cd799439015' }
          }
        },
        Metrics: {
          type: 'object',
          properties: {
            bookViewedTotal: { type: 'number', example: 1250 },
            bookAddedToCartTotal: { type: 'number', example: 450 },
            profileFetchedTotal: { type: 'number', example: 890 },
            orderPlacedTotal: { type: 'number', example: 320 },
            userRegisteredTotal: { type: 'number', example: 150 }
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
      { name: 'Analytics', description: 'Analytics tracking operations' },
      { name: 'Metrics', description: 'Metrics and monitoring endpoints' },
      { name: 'Health', description: 'Health check endpoints' }
    ]
  },
  apis: ['./index.js']
};

const specs = swaggerJsdoc(swaggerOptions);

const eventSchema = new mongoose.Schema({
  type: String,
  payload: Object,
  timestamp: { type: Date, default: Date.now }
});
const Event = mongoose.model('Event', eventSchema);

// Define counters for each event type
const bookViewedCounter = new client.Counter({
  name: 'book_viewed_total',
  help: 'Total number of books viewed',
});
const bookAddedToCartCounter = new client.Counter({
  name: 'book_added_to_cart_total',
  help: 'Total number of books added to cart',
});
const profileFetchedCounter = new client.Counter({
  name: 'profile_fetched_total',
  help: 'Total number of profiles fetched',
});
const orderPlacedCounter = new client.Counter({
  name: 'order_placed_total',
  help: 'Total number of orders placed',
});
const userRegisteredCounter = new client.Counter({
  name: 'user_registered_total',
  help: 'Total number of users registered',
});

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Analytics Service MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Swagger UI
app.use('/analytics/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Analytics Service API Documentation',
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
 *     summary: Analytics Service Health Check
 *     description: Check if the Analytics Service is healthy
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Analytics Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Analytics Service healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: string
 *                   example: "connected"
 *                 prometheus:
 *                   type: string
 *                   example: "enabled"
 */

app.get('/health', (req, res) => {
  res.json({ 
    status: 'Analytics Service healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    prometheus: 'enabled'
  });
});

/**
 * @swagger
 * /track:
 *   post:
 *     summary: Track Analytics Event
 *     description: Track an analytics event with optional payload data
 *     tags: [Analytics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrackEventRequest'
 *     responses:
 *       200:
 *         description: Event tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TrackEventResponse'
 *       400:
 *         description: Event type required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to track event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

app.post('/track', async (req, res) => {
  try {
    const { type, payload } = req.body;
    if (!type) return res.status(400).json({ error: 'Event type required' });
    
    const event = new Event({ type, payload });
    await event.save();

    // Increment Prometheus counters
    if (type === 'book_viewed') bookViewedCounter.inc();
    if (type === 'book_added_to_cart') bookAddedToCartCounter.inc();
    if (type === 'profile_fetched') profileFetchedCounter.inc();
    if (type === 'order_placed') orderPlacedCounter.inc();
    if (type === 'user_registered') userRegisteredCounter.inc();

    res.json({ success: true, eventId: event._id });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get Analytics Events
 *     description: Retrieve analytics events with optional filtering
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: ['book_viewed', 'book_added_to_cart', 'profile_fetched', 'order_placed', 'user_registered']
 *         description: Filter events by type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of events to return
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of analytics events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: Failed to fetch events
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

app.get('/events', async (req, res) => {
  try {
    const { type, limit = 50, startDate, endDate } = req.query;
    
    let query = {};
    
    if (type) {
      query.type = type;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    const events = await Event.find(query)
      .limit(parseInt(limit))
      .sort({ timestamp: -1 });
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Get Analytics Metrics
 *     description: Retrieve current analytics metrics and counters
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Current analytics metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Metrics'
 *       500:
 *         description: Failed to fetch metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

app.get('/metrics', async (req, res) => {
  try {
    const metrics = {
      bookViewedTotal: await Event.countDocuments({ type: 'book_viewed' }),
      bookAddedToCartTotal: await Event.countDocuments({ type: 'book_added_to_cart' }),
      profileFetchedTotal: await Event.countDocuments({ type: 'profile_fetched' }),
      orderPlacedTotal: await Event.countDocuments({ type: 'order_placed' }),
      userRegisteredTotal: await Event.countDocuments({ type: 'user_registered' })
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * @swagger
 * /metrics/prometheus:
 *   get:
 *     summary: Get Prometheus Metrics
 *     description: Retrieve Prometheus-formatted metrics for monitoring
 *     tags: [Metrics]
 *     responses:
 *       200:
 *         description: Prometheus metrics
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: |
 *                 # HELP book_viewed_total Total number of books viewed
 *                 # TYPE book_viewed_total counter
 *                 book_viewed_total 1250
 *                 # HELP book_added_to_cart_total Total number of books added to cart
 *                 # TYPE book_added_to_cart_total counter
 *                 book_added_to_cart_total 450
 *       500:
 *         description: Failed to fetch Prometheus metrics
 */

// Prometheus metrics endpoint
app.get('/metrics/prometheus', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (error) {
    console.error('Error fetching Prometheus metrics:', error);
    res.status(500).json({ error: 'Failed to fetch Prometheus metrics' });
  }
});

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get Analytics Dashboard Data
 *     description: Retrieve aggregated analytics data for dashboard display
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: ['day', 'week', 'month']
 *           default: 'day'
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: Dashboard analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 period:
 *                   type: string
 *                   example: "day"
 *                 events:
 *                   type: object
 *                   properties:
 *                     book_viewed: { type: 'number', example: 1250 },
 *                     book_added_to_cart: { type: 'number', example: 450 },
 *                     profile_fetched: { type: 'number', example: 890 },
 *                     order_placed: { type: 'number', example: 320 },
 *                     user_registered: { type: 'number', example: 150 }
 *                 trends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date: { type: 'string', format: 'date', example: '2024-01-15' },
 *                       book_viewed: { type: 'number', example: 45 },
 *                       book_added_to_cart: { type: 'number', example: 12 },
 *                       order_placed: { type: 'number', example: 8 }
 *       500:
 *         description: Failed to fetch dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

app.get('/analytics/dashboard', async (req, res) => {
  try {
    const { period = 'day' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
    
    // Get event counts for the period
    const events = {
      book_viewed: await Event.countDocuments({ 
        type: 'book_viewed', 
        timestamp: { $gte: startDate } 
      }),
      book_added_to_cart: await Event.countDocuments({ 
        type: 'book_added_to_cart', 
        timestamp: { $gte: startDate } 
      }),
      profile_fetched: await Event.countDocuments({ 
        type: 'profile_fetched', 
        timestamp: { $gte: startDate } 
      }),
      order_placed: await Event.countDocuments({ 
        type: 'order_placed', 
        timestamp: { $gte: startDate } 
      }),
      user_registered: await Event.countDocuments({ 
        type: 'user_registered', 
        timestamp: { $gte: startDate } 
      })
    };
    
    // Mock trends data (in a real implementation, you'd aggregate by date)
    const trends = [
      {
        date: new Date().toISOString().split('T')[0],
        book_viewed: events.book_viewed,
        book_added_to_cart: events.book_added_to_cart,
        order_placed: events.order_placed
      }
    ];
    
    res.json({
      period,
      events,
      trends
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

app.listen(PORT, () => {
  console.log(`Analytics Service running on port ${PORT}`);
  console.log(`Analytics Service Swagger docs available at: http://localhost:${PORT}/api-docs`);
  console.log(`Prometheus metrics available at: http://localhost:${PORT}/metrics/prometheus`);
}); 