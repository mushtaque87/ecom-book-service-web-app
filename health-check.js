const axios = require('axios');

const services = [
  { name: 'User Service', url: 'http://localhost:5001/health' },
  { name: 'Publisher Service', url: 'http://localhost:5002/health' },
  { name: 'Book Service', url: 'http://localhost:5003/health' },
  { name: 'Search Service', url: 'http://localhost:5004/health' },
  { name: 'Cart Service', url: 'http://localhost:5005/health' },
  { name: 'Order Service', url: 'http://localhost:5006/health' },
  { name: 'API Gateway', url: 'http://localhost:8080/health' },
  { name: 'Service Registry', url: 'http://localhost:5007' }
];

async function checkServiceHealth() {
  console.log('🔍 Checking Service Health...\n');
  
  for (const service of services) {
    try {
      const response = await axios.get(service.url, { timeout: 5000 });
      console.log(`✅ ${service.name}: HEALTHY`);
      console.log(`   Response: ${JSON.stringify(response.data)}`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${service.name}: NOT RUNNING (Connection refused)`);
      } else if (error.response) {
        console.log(`⚠️  ${service.name}: RESPONDING BUT ERROR (${error.response.status})`);
        console.log(`   Response: ${JSON.stringify(error.response.data)}`);
      } else {
        console.log(`❌ ${service.name}: ERROR (${error.message})`);
      }
    }
    console.log('');
  }
  
  console.log('📊 Summary:');
  console.log('- ✅ = Service is healthy and responding');
  console.log('- ⚠️  = Service is running but has issues');
  console.log('- ❌ = Service is not running or unreachable');
}

checkServiceHealth().catch(console.error); 