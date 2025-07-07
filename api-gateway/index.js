const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

const app = express();

const REGISTRY_URL = 'http://service-registry:5007';

// Service mapping for fallback
const serviceMapping = {
  'users': 'http://user-service:5000',
  'publishers': 'http://publisher-service:5000',
  'books': 'http://book-service:5000',
  'search': 'http://search-service:5000',
  'cart': 'http://cart-service:5000',
  'orders': 'http://order-service:5000'
};

// Dynamic proxy middleware
const createDynamicProxy = (serviceName) => {
  return async (req, res, next) => {
    try {
      // Try to get service URL from registry
      const response = await axios.get(`${REGISTRY_URL}/services/${serviceName}`);
      const service = response.data;
      
      if (service && service.health === 'healthy') {
        console.log(`Routing to ${serviceName} at ${service.url}`);
        return createProxyMiddleware({ 
          target: service.url, 
          changeOrigin: true 
        })(req, res, next);
      } else {
        throw new Error('Service unhealthy');
      }
    } catch (error) {
      console.log(`Service discovery failed for ${serviceName}, using fallback`);
      // Fallback to static mapping
      const fallbackUrl = serviceMapping[serviceName];
      if (fallbackUrl) {
        return createProxyMiddleware({ 
          target: fallbackUrl, 
          changeOrigin: true 
        })(req, res, next);
      } else {
        res.status(503).json({ error: `Service ${serviceName} not available` });
      }
    }
  };
};

// Dynamic routes
app.use('/users', createDynamicProxy('user-service'));
app.use('/publishers', createDynamicProxy('publisher-service'));
app.use('/books', createDynamicProxy('book-service'));
app.use('/search', createDynamicProxy('search-service'));
app.use('/cart', createDynamicProxy('cart-service'));
app.use('/orders', createDynamicProxy('order-service'));

// Service registry endpoints
app.get('/registry/services', async (req, res) => {
  try {
    const response = await axios.get(`${REGISTRY_URL}/services`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get services from registry' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway healthy' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
}); 