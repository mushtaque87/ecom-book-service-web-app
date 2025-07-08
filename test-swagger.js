#!/usr/bin/env node

/**
 * Test script to verify Swagger documentation implementation
 * Run this script after starting all services to test the API documentation
 */

const axios = require('axios');

const services = [
  { name: 'API Gateway', url: 'http://localhost:8080', docsPath: '/api-docs' },
  { name: 'Book Service', url: 'http://localhost:5003', docsPath: '/api-docs' },
  { name: 'User Service', url: 'http://localhost:5001', docsPath: '/api-docs' },
  { name: 'Analytics Service', url: 'http://localhost:5010', docsPath: '/api-docs' }
];

const testEndpoints = [
  { service: 'API Gateway', path: '/health', method: 'GET' },
  { service: 'API Gateway', path: '/registry/services', method: 'GET' },
  { service: 'Book Service', path: '/health', method: 'GET' },
  { service: 'Book Service', path: '/books', method: 'GET' },
  { service: 'User Service', path: '/health', method: 'GET' },
  { service: 'User Service', path: '/profile/test-user', method: 'GET' },
  { service: 'Analytics Service', path: '/health', method: 'GET' },
  { service: 'Analytics Service', path: '/metrics', method: 'GET' }
];

async function testServiceHealth(service) {
  try {
    const response = await axios.get(`${service.url}/health`, { timeout: 5000 });
    console.log(`✅ ${service.name} is healthy:`, response.data.status);
    return true;
  } catch (error) {
    console.log(`❌ ${service.name} is not responding:`, error.message);
    return false;
  }
}

async function testSwaggerDocs(service) {
  try {
    const response = await axios.get(`${service.url}${service.docsPath}`, { timeout: 5000 });
    if (response.status === 200) {
      console.log(`✅ ${service.name} Swagger docs available at: ${service.url}${service.docsPath}`);
      return true;
    }
  } catch (error) {
    console.log(`❌ ${service.name} Swagger docs not available:`, error.message);
    return false;
  }
  return false;
}

async function testEndpoint(endpoint) {
  try {
    const service = services.find(s => s.name === endpoint.service);
    if (!service) {
      console.log(`❌ Service not found: ${endpoint.service}`);
      return false;
    }

    const response = await axios({
      method: endpoint.method,
      url: `${service.url}${endpoint.path}`,
      timeout: 5000
    });

    console.log(`✅ ${endpoint.service} ${endpoint.path}: ${response.status}`);
    return true;
  } catch (error) {
    console.log(`❌ ${endpoint.service} ${endpoint.path}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing Swagger Documentation Implementation\n');

  // Test service health
  console.log('📊 Testing Service Health:');
  const healthResults = [];
  for (const service of services) {
    const isHealthy = await testServiceHealth(service);
    healthResults.push({ service: service.name, healthy: isHealthy });
  }

  console.log('\n📖 Testing Swagger Documentation:');
  const docsResults = [];
  for (const service of services) {
    const hasDocs = await testSwaggerDocs(service);
    docsResults.push({ service: service.name, hasDocs });
  }

  console.log('\n🔍 Testing API Endpoints:');
  const endpointResults = [];
  for (const endpoint of testEndpoints) {
    const isWorking = await testEndpoint(endpoint);
    endpointResults.push({ endpoint: `${endpoint.service} ${endpoint.path}`, working: isWorking });
  }

  // Summary
  console.log('\n📋 Test Summary:');
  console.log('================');
  
  const healthyServices = healthResults.filter(r => r.healthy).length;
  const servicesWithDocs = docsResults.filter(r => r.hasDocs).length;
  const workingEndpoints = endpointResults.filter(r => r.working).length;

  console.log(`Services Healthy: ${healthyServices}/${services.length}`);
  console.log(`Services with Swagger Docs: ${servicesWithDocs}/${services.length}`);
  console.log(`Working Endpoints: ${workingEndpoints}/${testEndpoints.length}`);

  if (healthyServices === services.length && servicesWithDocs === services.length) {
    console.log('\n🎉 All tests passed! Swagger documentation is working correctly.');
    console.log('\n📚 Access your API documentation at:');
    services.forEach(service => {
      console.log(`   ${service.name}: ${service.url}${service.docsPath}`);
    });
  } else {
    console.log('\n⚠️  Some tests failed. Please check the service status and try again.');
  }

  console.log('\n💡 Tips:');
  console.log('   - Make sure all services are running with: docker-compose up --build');
  console.log('   - Check service logs if any tests fail');
  console.log('   - Verify ports are not being used by other applications');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, services, testEndpoints }; 