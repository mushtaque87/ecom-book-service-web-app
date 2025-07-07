const express = require('express');
const mongoose = require('mongoose');
const ServiceDiscovery = require('./shared/service-discovery');
require('dotenv').config();
const axios = require('axios');
const Book = require('./models/Book');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/bookdb';

const serviceDiscovery = new ServiceDiscovery();

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Book Service healthy' });
});

// Get all services (service discovery)
app.get('/services', async (req, res) => {
  try {
    const services = await serviceDiscovery.getAllServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get services' });
  }
});

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
  setTimeout(registerService, 2000);
}); 