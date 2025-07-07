const express = require('express');
const mongoose = require('mongoose');
const ServiceDiscovery = require('./shared/service-discovery');
require('dotenv').config();
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/cartdb';

const serviceDiscovery = new ServiceDiscovery();

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Cart Service MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const registerService = async () => {
  try {
    await serviceDiscovery.register(
      'cart-service',
      `http://cart-service:${PORT}`,
      PORT,
      { version: '1.0.0', description: 'Cart management service' }
    );
  } catch (error) {
    console.error('Failed to register service:', error.message);
    setTimeout(registerService, 5000);
  }
};

app.get('/health', (req, res) => {
  res.json({ status: 'Cart Service healthy' });
});

app.get('/services', async (req, res) => {
  try {
    const services = await serviceDiscovery.getAllServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get services' });
  }
});

// Example: Get book details from book-service using service discovery
app.get('/book/:bookId', async (req, res) => {
  try {
    const bookServiceUrl = await serviceDiscovery.getServiceUrl('book-service');
    if (!bookServiceUrl) {
      return res.status(503).json({ error: 'Book service unavailable' });
    }
    // Call book-service for book details
    const response = await axios.get(`${bookServiceUrl}/books/${req.params.bookId}`);
    res.json({ book: response.data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch book details', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Cart Service running on port ${PORT}`);
  setTimeout(registerService, 2000);
}); 