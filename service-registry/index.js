const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');
const path = require('path');
const Service = require('./models/Service');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5007;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://service-registry-mongo:27017/registrydb';

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Service Registry MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Serve dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

// Service Registration
app.post('/register', async (req, res) => {
  try {
    const { name, url, port, metadata = {} } = req.body;
    
    const service = await Service.findOneAndUpdate(
      { name },
      { 
        name, 
        url, 
        port, 
        metadata,
        lastHeartbeat: new Date(),
        health: 'unknown'
      },
      { upsert: true, new: true }
    );
    
    console.log(`Service registered: ${name} at ${url}:${port}`);
    res.json({ success: true, service });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Service Discovery
app.get('/services', async (req, res) => {
  try {
    const services = await Service.find({ health: { $ne: 'unhealthy' } });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.get('/services/:name', async (req, res) => {
  try {
    const service = await Service.findOne({ name: req.params.name });
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'Service Registry healthy' });
});

// Heartbeat endpoint
app.post('/heartbeat/:name', async (req, res) => {
  try {
    const service = await Service.findOneAndUpdate(
      { name: req.params.name },
      { 
        lastHeartbeat: new Date(),
        health: 'healthy'
      },
      { new: true }
    );
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Heartbeat failed' });
  }
});

// Health monitoring cron job (every 30 seconds)
cron.schedule('*/30 * * * * *', async () => {
  try {
    const services = await Service.find();
    
    for (const service of services) {
      try {
        const response = await axios.get(`${service.url}/health`, { timeout: 5000 });
        if (response.status === 200) {
          await Service.findByIdAndUpdate(service._id, { 
            health: 'healthy',
            lastHeartbeat: new Date()
          });
        } else {
          await Service.findByIdAndUpdate(service._id, { health: 'unhealthy' });
        }
      } catch (error) {
        console.log(`Service ${service.name} is unhealthy: ${error.message}`);
        await Service.findByIdAndUpdate(service._id, { health: 'unhealthy' });
      }
    }
  } catch (error) {
    console.error('Health check error:', error);
  }
});

app.listen(PORT, () => {
  console.log(`Service Registry running on port ${PORT}`);
}); 