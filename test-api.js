/**
 * Webex API Test Script
 * 
 * This script tests connectivity to the Webex API endpoints used by the application.
 * It verifies that the token has the necessary permissions and that data can be retrieved.
 */

require('dotenv').config();
const axios = require('axios');

const WEBEX_BASE_URL = 'https://webexapis.com/v1';
const TOKEN = process.env.WEBEX_TOKEN;

// Format date for testing
const now = new Date();
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

const startTime = oneWeekAgo.toISOString();
const endTime = now.toISOString();

console.log('==================================================');
console.log('Webex API Test Script');
console.log('==================================================');
console.log('Testing with:');
console.log('- Token (first 10 chars):', TOKEN.substring(0, 10) + '...');
console.log('- Start time:', startTime);
console.log('- End time:', endTime);
console.log('==================================================\n');

/**
 * Make a request to a Webex API endpoint
 * @param {string} endpoint - API endpoint
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} - API response
 */
async function makeApiRequest(endpoint, params = {}) {
  try {
    console.log(`Making request to: ${WEBEX_BASE_URL}${endpoint}`);
    console.log('Parameters:', JSON.stringify(params, null, 2));
    
    const response = await axios.get(`${WEBEX_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      params
    });
    
    console.log(`Success! Status: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error(`Error (${error.response?.status || 'Unknown'}):`, 
      error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Test the /people/me endpoint to verify token validity
 */
async function testTokenValidity() {
  console.log('\n🔑 TEST 1: Verifying token validity...');
  try {
    const data = await makeApiRequest('/people/me');
    console.log('✅ Token is valid!');
    console.log(`Authenticated as: ${data.displayName} (${data.emails[0]})`);
    return true;
  } catch (error) {
    console.error('❌ Token validation failed');
    return false;
  }
}

/**
 * Test the /people endpoint to fetch users
 */
async function testPeopleEndpoint() {
  console.log('\n👥 TEST 2: Testing /people endpoint...');
  try {
    const data = await makeApiRequest('/people', { max: 5 });
    console.log(`✅ Successfully fetched ${data.items.length} users`);
    console.log('Sample user:', JSON.stringify({
      id: data.items[0].id,
      name: data.items[0].displayName,
      email: data.items[0].emails?.[0]
    }, null, 2));
    return data.items[0].id;
  } catch (error) {
    console.error('❌ Failed to fetch users');
    return null;
  }
}

/**
 * Test the /telephony/calls/history endpoint
 * @param {string} userId - User ID for filtering calls
 */
async function testCallHistoryEndpoint(userId) {
  console.log('\n📞 TEST 3: Testing /telephony/calls/history endpoint...');
  
  // Test without user ID
  try {
    console.log('Testing without user ID filter...');
    const params = {
      startTime: startTime,
      endTime: endTime,
      max: 5
    };
    
    const data = await makeApiRequest('/telephony/calls/history', params);
    console.log(`✅ Success! Found ${data.items?.length || 0} call records`);
    
    if (data.items && data.items.length > 0) {
      console.log('Sample call record:', JSON.stringify(data.items[0], null, 2));
    } else {
      console.log('No call records found in the date range');
    }
  } catch (error) {
    console.error('❌ Failed to fetch call history');
  }
  
  // Test with user ID if available
  if (userId) {
    try {
      console.log('\nTesting with user ID filter...');
      const params = {
        startTime: startTime,
        endTime: endTime,
        personId: userId,
        max: 5
      };
      
      const data = await makeApiRequest('/telephony/calls/history', params);
      console.log(`✅ Success! Found ${data.items?.length || 0} call records for user`);
      
      if (data.items && data.items.length > 0) {
        console.log('Sample call record:', JSON.stringify(data.items[0], null, 2));
      } else {
        console.log('No call records found for this user in the date range');
      }
    } catch (error) {
      console.error('❌ Failed to fetch call history for specific user');
    }
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    // Test 1: Verify token validity
    const tokenValid = await testTokenValidity();
    if (!tokenValid) {
      console.error('\n❌ Token validation failed. Aborting further tests.');
      process.exit(1);
    }
    
    // Test 2: Test People API
    const userId = await testPeopleEndpoint();
    
    // Test 3: Test Call History API
    await testCallHistoryEndpoint(userId);
    
    console.log('\n==================================================');
    console.log('✅ Testing complete!');
    console.log('==================================================');
  } catch (error) {
    console.error('\n==================================================');
    console.error('❌ Testing failed with error:', error.message);
    console.error('==================================================');
    process.exit(1);
  }
}

// Run the tests
runTests();