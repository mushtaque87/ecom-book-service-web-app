const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5010;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/analyticsdb';

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

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Analytics Service MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

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

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track event' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'Analytics Service healthy' });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(PORT, () => {
  console.log(`Analytics Service running on port ${PORT}`);
}); 