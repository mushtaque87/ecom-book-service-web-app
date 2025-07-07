const axios = require('axios');

class ServiceDiscovery {
  constructor(registryUrl = 'http://service-registry:5007') {
    this.registryUrl = registryUrl;
    this.serviceName = null;
    this.serviceUrl = null;
    this.servicePort = null;
  }

  // Register this service with the registry
  async register(serviceName, serviceUrl, servicePort, metadata = {}) {
    try {
      this.serviceName = serviceName;
      this.serviceUrl = serviceUrl;
      this.servicePort = servicePort;

      const response = await axios.post(`${this.registryUrl}/register`, {
        name: serviceName,
        url: serviceUrl,
        port: servicePort,
        metadata
      });

      console.log(`Service ${serviceName} registered successfully`);
      
      // Start heartbeat
      this.startHeartbeat();
      
      return response.data;
    } catch (error) {
      console.error('Service registration failed:', error.message);
      throw error;
    }
  }

  // Send heartbeat to registry
  async sendHeartbeat() {
    if (!this.serviceName) return;
    
    try {
      await axios.post(`${this.registryUrl}/heartbeat/${this.serviceName}`);
    } catch (error) {
      console.error('Heartbeat failed:', error.message);
    }
  }

  // Start periodic heartbeat
  startHeartbeat() {
    setInterval(() => {
      this.sendHeartbeat();
    }, 30000); // Every 30 seconds
  }

  // Discover a specific service
  async discoverService(serviceName) {
    try {
      const response = await axios.get(`${this.registryUrl}/services/${serviceName}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to discover service ${serviceName}:`, error.message);
      return null;
    }
  }

  // Get all healthy services
  async getAllServices() {
    try {
      const response = await axios.get(`${this.registryUrl}/services`);
      return response.data;
    } catch (error) {
      console.error('Failed to get services:', error.message);
      return [];
    }
  }

  // Get service URL for making requests
  async getServiceUrl(serviceName) {
    const service = await this.discoverService(serviceName);
    if (service && service.health === 'healthy') {
      return service.url;
    }
    return null;
  }
}

module.exports = ServiceDiscovery; 