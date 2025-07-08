const express = require('express');
const mongoose = require('mongoose');
const ServiceDiscovery = require('./shared/service-discovery');
require('dotenv').config();
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const Book = require('./models/Book');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/bookdb';

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

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
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

// Get all books
app.get('/books', async (req, res) => {
  try {
    const { page = 1, limit = 10, genre, author, search } = req.query;
    
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
    
    const skip = (page - 1) * limit;
    
    const books = await Book.find(query)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });
    
    const total = await Book.countDocuments(query);
    
    res.json({
      books,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
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

// Create a new book
app.post('/books', async (req, res) => {
  try {
    const book = new Book(req.body);
    const savedBook = await book.save();
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

app.listen(PORT, () => {
  console.log(`Book Service running on port ${PORT}`);
  console.log(`Book Service Swagger docs available at: http://localhost:${PORT}/api-docs`);
  // Register service after server starts
  setTimeout(registerService, 2000);
}); 