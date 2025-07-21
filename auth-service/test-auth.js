const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'User',
  role: 'user'
};

let accessToken = '';
let refreshToken = '';

async function testAuthService() {
  console.log('🧪 Testing Authentication Service\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Register User
    console.log('2. Testing User Registration...');
    const registerResponse = await axios.post(`${BASE_URL}/register`, testUser);
    console.log('✅ User Registered:', {
      id: registerResponse.data.user.id,
      username: registerResponse.data.user.username,
      email: registerResponse.data.user.email
    });
    accessToken = registerResponse.data.tokens.accessToken;
    refreshToken = registerResponse.data.tokens.refreshToken;
    console.log('');

    // Test 3: Login User
    console.log('3. Testing User Login...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      username: testUser.username,
      password: testUser.password
    });
    console.log('✅ Login Successful:', {
      username: loginResponse.data.user.username,
      role: loginResponse.data.user.role
    });
    accessToken = loginResponse.data.tokens.accessToken;
    refreshToken = loginResponse.data.tokens.refreshToken;
    console.log('');

    // Test 4: Get Profile
    console.log('4. Testing Get Profile...');
    const profileResponse = await axios.get(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ Profile Retrieved:', {
      username: profileResponse.data.user.username,
      email: profileResponse.data.user.email,
      role: profileResponse.data.user.role
    });
    console.log('');

    // Test 5: Verify Token
    console.log('5. Testing Token Verification...');
    const verifyResponse = await axios.post(`${BASE_URL}/verify`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ Token Verified:', verifyResponse.data);
    console.log('');

    // Test 6: Refresh Token
    console.log('6. Testing Token Refresh...');
    const refreshResponse = await axios.post(`${BASE_URL}/refresh`, {
      refreshToken: refreshToken
    });
    console.log('✅ Token Refreshed:', {
      newAccessToken: refreshResponse.data.tokens.accessToken ? 'Generated' : 'Failed',
      newRefreshToken: refreshResponse.data.tokens.refreshToken ? 'Generated' : 'Failed'
    });
    accessToken = refreshResponse.data.tokens.accessToken;
    refreshToken = refreshResponse.data.tokens.refreshToken;
    console.log('');

    // Test 7: Update Profile
    console.log('7. Testing Profile Update...');
    const updateResponse = await axios.put(`${BASE_URL}/profile/1`, {
      firstName: 'Updated',
      lastName: 'Name',
      email: 'updated@example.com'
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ Profile Updated:', updateResponse.data);
    console.log('');

    // Test 8: Logout
    console.log('8. Testing Logout...');
    const logoutResponse = await axios.post(`${BASE_URL}/logout`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('✅ Logout Successful:', logoutResponse.data);
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Test error cases
async function testErrorCases() {
  console.log('\n🧪 Testing Error Cases\n');

  try {
    // Test 1: Invalid Login
    console.log('1. Testing Invalid Login...');
    try {
      await axios.post(`${BASE_URL}/login`, {
        username: 'nonexistent',
        password: 'wrongpassword'
      });
    } catch (error) {
      console.log('✅ Invalid Login Handled:', error.response.data.error);
    }
    console.log('');

    // Test 2: Invalid Token
    console.log('2. Testing Invalid Token...');
    try {
      await axios.get(`${BASE_URL}/profile`, {
        headers: { Authorization: 'Bearer invalid-token' }
      });
    } catch (error) {
      console.log('✅ Invalid Token Handled:', error.response.data.error);
    }
    console.log('');

    // Test 3: Missing Required Fields
    console.log('3. Testing Missing Required Fields...');
    try {
      await axios.post(`${BASE_URL}/register`, {
        username: 'testuser2'
        // Missing email, password, etc.
      });
    } catch (error) {
      console.log('✅ Validation Error Handled:', error.response.data.error);
    }
    console.log('');

    console.log('🎉 Error case tests completed!');

  } catch (error) {
    console.error('❌ Error case test failed:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  await testAuthService();
  await testErrorCases();
}

// Check if service is running
async function checkService() {
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('🚀 Authentication service is running!');
    await runTests();
  } catch (error) {
    console.error('❌ Authentication service is not running. Please start it first:');
    console.error('   cd auth-service && npm start');
  }
}

checkService(); 