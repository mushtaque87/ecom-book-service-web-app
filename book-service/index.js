const express = require('express');
const compression = require('compression');
const cluster = require('cluster');
const os = require('os');
const mongoose = require('mongoose');
const ServiceDiscovery = require('./shared/service-discovery');
require('dotenv').config();
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const redis = require('redis');
const { Pool } = require('pg');
const Book = require('./models/Book');

// Ultra-high performance PostgreSQL connection
const pgPool = new Pool({
  host: 'postgres',
  port: 5432,
  database: 'bookdb',
  user: 'postgres',
  password: 'postgres123',
  max: 100,              // Increased for high concurrency
  min: 10,               // Keep connections warm
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 1000,
  acquireTimeoutMillis: 2000,
  createTimeoutMillis: 2000,
  destroyTimeoutMillis: 1000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200
});

pgPool.on('connect', () => console.log('✅ PostgreSQL connected'));
pgPool.on('error', (err) => console.log('❌ PostgreSQL error:', err.message));

// Initialize PostgreSQL table
const initPostgres = async () => {
  try {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        isbn VARCHAR(20) UNIQUE NOT NULL,
        publisher VARCHAR(255),
        publish_date DATE,
        genre VARCHAR(100),
        description TEXT,
        price DECIMAL(10,2),
        pages INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pgPool.query(`
      CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
      CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
      CREATE INDEX IF NOT EXISTS idx_books_genre ON books(genre);
    `);
    
    console.log('✅ PostgreSQL table initialized');
  } catch (error) {
    console.error('❌ PostgreSQL init error:', error.message);
  }
};

initPostgres();

// Ultra-high performance Redis client
const redisClient = redis.createClient({
  host: 'redis',
  port: 6379,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.log('Redis connection refused, retrying...');
    }
    return Math.min(options.attempt * 50, 1000);
  },
  max_attempts: 10,
  connect_timeout: 1000,
  lazyConnect: true,
  keepAlive: true,
  family: 4
});

// Pre-warm cache on startup
const preWarmCache = async () => {
  try {
    console.log('🔥 Pre-warming cache...');
    const allBooks = await pgPool.query('SELECT * FROM books ORDER BY created_at DESC');
    const countResult = await pgPool.query('SELECT COUNT(*) FROM books');
    
    const result = {
      books: allBooks.rows,
      pagination: {
        page: 1,
        limit: allBooks.rows.length,
        total: parseInt(countResult.rows[0].count),
        pages: 1
      },
      source: 'postgresql-prewarmed'
    };
    
    await redisClient.setex('pg:books:{}', 600, JSON.stringify(result));
    console.log('✅ Cache pre-warmed with', allBooks.rows.length, 'books');
  } catch (error) {
    console.log('⚠️ Cache pre-warming failed:', error.message);
  }
};

// Pre-warm cache after connections are established
setTimeout(preWarmCache, 3000);

redisClient.on('connect', () => console.log('✅ Redis connected'));
redisClient.on('error', (err) => console.log('❌ Redis error:', err.message));

const app = express();

// Ultra-high performance middleware
app.use(compression({ level: 6, threshold: 1024 })); // Compress responses
app.use(express.json({ limit: '1mb' }));
app.disable('x-powered-by'); // Remove unnecessary header
app.set('trust proxy', 1); // Trust first proxy

// Response time optimization
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'public, max-age=300'); // 5min browser cache
  res.setHeader('Connection', 'keep-alive');
  next();
});

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/bookdb';

// MongoDB connection options for better performance
const mongoOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 50,        // Maximum number of connections
  minPoolSize: 5,         // Minimum number of connections
  maxIdleTimeMS: 30000,   // Close connections after 30 seconds of inactivity
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  bufferMaxEntries: 0     // Disable mongoose buffering
};

const serviceDiscovery = new ServiceDiscovery();

// Swagger configuration for Book Service
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Book Service API',
      version: '1.0.0',
      description: 'API for managing books in the E-commerce Book Service',
      contact: {
        name: 'Book Service Support',
        email: 'books@bookservice.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Book Service Development Server'
      }
    ],
    components: {
      schemas: {
        Book: {
          type: 'object',
          required: ['title', 'author', 'isbn', 'publisher', 'publishDate', 'genre', 'description', 'price', 'pages'],
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
            price: { type: 'number', minimum: 0, example: 19.99 },
            pages: { type: 'number', minimum: 1, example: 180 },
            language: { type: 'string', default: 'English', example: 'English' },
            coverImage: { type: 'string', example: 'https://example.com/cover.jpg' },
            rating: { type: 'number', minimum: 0, maximum: 5, default: 0, example: 4.5 },
            stock: { type: 'number', minimum: 0, default: 0, example: 50 },
            isAvailable: { type: 'boolean', default: true, example: true },
            reviews: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  userId: { type: 'string', example: '507f1f77bcf86cd799439012' },
                  rating: { type: 'number', minimum: 1, maximum: 5, example: 5 },
                  comment: { type: 'string', example: 'Excellent book!' },
                  date: { type: 'string', format: 'date-time', example: '2024-01-15T10:30:00Z' }
                }
              }
            }
          }
        },
        BookList: {
          type: 'object',
          properties: {
            books: {
              type: 'array',
              items: { $ref: '#/components/schemas/Book' }
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                total: { type: 'number', example: 100 },
                pages: { type: 'number', example: 10 }
              }
            }
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
      { name: 'Health', description: 'Health check endpoints' }
    ]
  },
  apis: ['./index.js']
};

const specs = swaggerJsdoc(swaggerOptions);

mongoose.connect(MONGO_URL, mongoOptions)
  .then(() => console.log('Book Service MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const registerService = async () => {
  try {
    await serviceDiscovery.register(
      'book-service',
      `http://book-service:${PORT}`,
      PORT,
      { version: '1.0.0', description: 'Book management service' }
    );
  } catch (error) {
    console.error('Failed to register service:', error.message);
    setTimeout(registerService, 5000);
  }
};

// Swagger UI
app.use('/books/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Book Service API Documentation',
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
 *     summary: Book Service Health Check
 *     description: Check if the Book Service is healthy
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Book Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Book Service healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: string
 *                   example: "connected"
 */

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Book Service healthy',
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
 *                     example: "user-service"
 *                   url:
 *                     type: string
 *                     example: "http://user-service:5000"
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

// Get all services (service discovery)
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
 * /books:
 *   get:
 *     summary: Get All Books
 *     description: Retrieve a paginated list of books with optional filtering
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of books per page
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *           enum: ['Fiction', 'Non-Fiction', 'Science Fiction', 'Mystery', 'Romance', 'Thriller', 'Biography', 'History', 'Self-Help', 'Business', 'Technology', 'Science', 'Philosophy', 'Poetry', 'Drama']
 *         description: Filter books by genre
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter books by author name
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in title, author, and description
 *     responses:
 *       200:
 *         description: List of books with pagination
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookList'
 *       500:
 *         description: Failed to fetch books
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Get all books with Redis cache
app.get('/books', async (req, res) => {
  try {
    const { genre, author, search } = req.query;
    
    // Create cache key
    const cacheKey = `books:${JSON.stringify({ genre, author, search })}`;
    
    // Try Redis cache first
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log('✅ Cache HIT for:', cacheKey);
        return res.json(JSON.parse(cached));
      }
    } catch (redisError) {
      console.log('⚠️ Redis error, falling back to MongoDB:', redisError.message);
    }
    
    console.log('❌ Cache MISS - Querying MongoDB for:', cacheKey);
    
    let query = {};
    
    // Filter by genre
    if (genre) {
      query.genre = genre;
    }
    
    // Filter by author
    if (author) {
      query.author = { $regex: author, $options: 'i' };
    }
    
    // Search in title, author, and description
    if (search) {
      query.$text = { $search: search };
    }
    
    const [books, total] = await Promise.all([
      Book.find(query).sort({ createdAt: -1 }).lean(),
      Book.countDocuments(query)
    ]);

    const result = {
      books,
      pagination: {
        page: 1,
        limit: total,
        total,
        pages: 1
      }
    };
    
    // Cache result for 5 minutes
    try {
      await redisClient.setex(cacheKey, 300, JSON.stringify(result));
      console.log('✅ Cached result for:', cacheKey);
    } catch (redisError) {
      console.log('⚠️ Failed to cache result:', redisError.message);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

/**
 * @swagger
 * /books/{bookId}:
 *   get:
 *     summary: Get Book by ID
 *     description: Retrieve a specific book by its ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: The book ID
 *     responses:
 *       200:
 *         description: Book details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch book
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Get book by ID
app.get('/books/:bookId', async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    // Track analytics event
    try {
      await axios.post('http://analytics-service:5010/track', {
        type: 'book_viewed',
        payload: { bookId: req.params.bookId }
      });
    } catch (analyticsError) {
      console.log('Analytics service not available, skipping tracking');
    }
    
    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Failed to fetch book details' });
  }
});

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Create a New Book
 *     description: Create a new book in the system
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: ['title', 'author', 'isbn', 'publisher', 'publishDate', 'genre', 'description', 'price', 'pages']
 *             properties:
 *               title:
 *                 type: string
 *                 example: "The Great Gatsby"
 *               author:
 *                 type: string
 *                 example: "F. Scott Fitzgerald"
 *               isbn:
 *                 type: string
 *                 example: "978-0743273565"
 *               publisher:
 *                 type: string
 *                 example: "Scribner"
 *               publishDate:
 *                 type: string
 *                 format: date
 *                 example: "1925-04-10"
 *               genre:
 *                 type: string
 *                 enum: ['Fiction', 'Non-Fiction', 'Science Fiction', 'Mystery', 'Romance', 'Thriller', 'Biography', 'History', 'Self-Help', 'Business', 'Technology', 'Science', 'Philosophy', 'Poetry', 'Drama']
 *                 example: "Fiction"
 *               description:
 *                 type: string
 *                 example: "A story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan."
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 example: 19.99
 *               pages:
 *                 type: number
 *                 minimum: 1
 *                 example: 180
 *               language:
 *                 type: string
 *                 example: "English"
 *               coverImage:
 *                 type: string
 *                 example: "https://example.com/cover.jpg"
 *               stock:
 *                 type: number
 *                 minimum: 0
 *                 example: 50
 *               isAvailable:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Book created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to create book
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Create a new book with cache invalidation
app.post('/books', async (req, res) => {
  try {
    const book = new Book(req.body);
    const savedBook = await book.save();
    
    // Invalidate cache
    try {
      const keys = await redisClient.keys('books:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log('🗑️ Cache invalidated:', keys.length, 'keys');
      }
    } catch (redisError) {
      console.log('⚠️ Failed to invalidate cache:', redisError.message);
    }
    
    res.status(201).json(savedBook);
  } catch (error) {
    console.error('Error creating book:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create book' });
  }
});

/**
 * @swagger
 * /books/{bookId}:
 *   put:
 *     summary: Update a Book
 *     description: Update an existing book by ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: The book ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Book Title"
 *               price:
 *                 type: number
 *                 example: 24.99
 *               stock:
 *                 type: number
 *                 example: 75
 *     responses:
 *       200:
 *         description: Book updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Book'
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to update book
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Update a book
app.put('/books/:bookId', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.bookId,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json(book);
  } catch (error) {
    console.error('Error updating book:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update book' });
  }
});

/**
 * @swagger
 * /books/{bookId}:
 *   delete:
 *     summary: Delete a Book
 *     description: Delete a book by ID
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: bookId
 *         required: true
 *         schema:
 *           type: string
 *         description: The book ID
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Book deleted successfully"
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to delete book
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Delete a book
app.delete('/books/:bookId', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.bookId);
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

/**
 * @swagger
 * /books/genre/{genre}:
 *   get:
 *     summary: Get Books by Genre
 *     description: Retrieve all books of a specific genre
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: genre
 *         required: true
 *         schema:
 *           type: string
 *           enum: ['Fiction', 'Non-Fiction', 'Science Fiction', 'Mystery', 'Romance', 'Thriller', 'Biography', 'History', 'Self-Help', 'Business', 'Technology', 'Science', 'Philosophy', 'Poetry', 'Drama']
 *         description: The genre to filter by
 *     responses:
 *       200:
 *         description: List of books in the specified genre
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       500:
 *         description: Failed to fetch books by genre
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Get books by genre
app.get('/books/genre/:genre', async (req, res) => {
  try {
    const books = await Book.find({ genre: req.params.genre });
    res.json(books);
  } catch (error) {
    console.error('Error fetching books by genre:', error);
    res.status(500).json({ error: 'Failed to fetch books by genre' });
  }
});

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search Books
 *     description: Search books by text query in title, author, and description
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Book'
 *       400:
 *         description: Search query is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to search books
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Search books
app.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const books = await Book.find(
      { $text: { $search: q } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
    
    res.json(books);
  } catch (error) {
    console.error('Error searching books:', error);
    res.status(500).json({ error: 'Failed to search books' });
  }
});

/**
 * @swagger
 * /booksql:
 *   get:
 *     summary: Get All Books from PostgreSQL
 *     description: Retrieve books from PostgreSQL database for performance comparison
 *     tags: [Books]
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Filter books by genre
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter books by author name
 *     responses:
 *       200:
 *         description: List of books from PostgreSQL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 books:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                 source:
 *                   type: string
 *                   example: "postgresql"
 *       500:
 *         description: Failed to fetch books from PostgreSQL
 */

// Ultra-high performance PostgreSQL with Redis cache
app.get('/booksql', async (req, res) => {
  try {
    const { genre, author } = req.query;
    
    // Create cache key for PostgreSQL
    const cacheKey = `pg:books:${JSON.stringify({ genre, author })}`;
    
    // Try Redis cache first
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        console.log('✅ PostgreSQL Cache HIT:', cacheKey);
        return res.json(JSON.parse(cached));
      }
    } catch (redisError) {
      console.log('⚠️ Redis error for PostgreSQL:', redisError.message);
    }
    
    console.log('❌ PostgreSQL Cache MISS:', cacheKey);
    
    let query = 'SELECT * FROM books';
    let params = [];
    let whereConditions = [];
    
    if (genre) {
      whereConditions.push('genre = $' + (params.length + 1));
      params.push(genre);
    }
    
    if (author) {
      whereConditions.push('author ILIKE $' + (params.length + 1));
      params.push('%' + author + '%');
    }
    
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [booksResult, countResult] = await Promise.all([
      pgPool.query(query, params),
      pgPool.query('SELECT COUNT(*) FROM books' + (whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : ''), params)
    ]);
    
    const books = booksResult.rows;
    const total = parseInt(countResult.rows[0].count);
    
    const result = {
      books,
      pagination: {
        page: 1,
        limit: total,
        total,
        pages: 1
      },
      source: 'postgresql-cached'
    };
    
    // Cache result for 10 minutes
    try {
      await redisClient.setex(cacheKey, 600, JSON.stringify(result));
      console.log('✅ PostgreSQL result cached:', cacheKey);
    } catch (redisError) {
      console.log('⚠️ Failed to cache PostgreSQL result:', redisError.message);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching books from PostgreSQL:', error);
    res.status(500).json({ error: 'Failed to fetch books from PostgreSQL' });
  }
});

// Create a new book in PostgreSQL with cache invalidation
app.post('/booksql', async (req, res) => {
  try {
    const { title, author, isbn, publisher, publishDate, genre, description, price, pages } = req.body;
    
    const query = `
      INSERT INTO books (title, author, isbn, publisher, publish_date, genre, description, price, pages)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const result = await pgPool.query(query, [
      title, author, isbn, publisher, publishDate, genre, description, price, pages
    ]);
    
    // Invalidate PostgreSQL cache
    try {
      const keys = await redisClient.keys('pg:books:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
        console.log('🗑️ PostgreSQL cache invalidated:', keys.length, 'keys');
      }
    } catch (redisError) {
      console.log('⚠️ Failed to invalidate PostgreSQL cache:', redisError.message);
    }
    
    res.status(201).json({
      book: result.rows[0],
      source: 'postgresql'
    });
  } catch (error) {
    console.error('Error creating book in PostgreSQL:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Book with this ISBN already exists' });
    }
    res.status(500).json({ error: 'Failed to create book in PostgreSQL' });
  }
});

app.listen(PORT, () => {
  console.log(`Book Service running on port ${PORT}`);
  console.log(`Book Service Swagger docs available at: http://localhost:${PORT}/api-docs`);
  setTimeout(registerService, 2000);
}); 