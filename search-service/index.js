const express = require('express');
const mongoose = require('mongoose');
const ServiceDiscovery = require('./shared/service-discovery');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/searchdb';

const serviceDiscovery = new ServiceDiscovery();

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Search Service MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const registerService = async () => {
  try {
    await serviceDiscovery.register(
      'search-service',
      `http://search-service:${PORT}`,
      PORT,
      { version: '1.0.0', description: 'Search service' }
    );
  } catch (error) {
    console.error('Failed to register service:', error.message);
    setTimeout(registerService, 5000);
  }
};

app.get('/health', (req, res) => {
  res.json({ status: 'Search Service healthy' });
});

app.get('/services', async (req, res) => {
  try {
    const services = await serviceDiscovery.getAllServices();
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get services' });
  }
});

app.listen(PORT, () => {
  console.log(`Search Service running on port ${PORT}`);
  setTimeout(registerService, 2000);
}); 