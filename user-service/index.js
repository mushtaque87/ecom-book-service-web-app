const express = require('express');
const mongoose = require('mongoose');
const ServiceDiscovery = require('./shared/service-discovery');
require('dotenv').config();
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/userdb';

// Initialize service discovery
const serviceDiscovery = new ServiceDiscovery();

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

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'User Service healthy' });
});

// Example: Get user profile (demonstrates service discovery)
app.get('/profile/:userId', async (req, res) => {
  try {
    // Track analytics event
    await axios.post('http://analytics-service:5010/track', {
      type: 'profile_fetched',
      payload: { userId: req.params.userId }
    });
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
      bookServiceAvailable: !!bookServiceUrl
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Get all available services (for debugging)
app.get('/services', async (req, res) => {
  try {
    const services = await serviceDiscovery.getAllServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get services' });
  }
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
  // Register service after server starts
  setTimeout(registerService, 2000);
}); 