require('dotenv').config();
const axios = require('axios');

// Format date to ISO string with just the date part (YYYY-MM-DD)
const now = new Date();
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

const startDate = oneWeekAgo.toISOString().split('T')[0];  // YYYY-MM-DD
const endDate = now.toISOString().split('T')[0];  // YYYY-MM-DD

console.log('Testing Webex API with:');
console.log('Token:', process.env.WEBEX_TOKEN.substring(0, 10) + '...');
console.log('Start date:', startDate);
console.log('End date:', endDate);

// Step 1: Test people API
async function testPeopleAPI() {
  try {
    console.log('\n=== Testing People API ===');
    const response = await axios.get('https://webexapis.com/v1/people', {
      headers: {
        'Authorization': `Bearer ${process.env.WEBEX_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: {
        max: 10
      }
    });
    
    console.log('Status:', response.status);
    console.log('Success! Found', response.data.items.length, 'users');
    
    if (response.data.items.length > 0) {
      const firstUser = response.data.items[0];
      console.log('First user:', {
        id: firstUser.id,
        name: firstUser.displayName || `${firstUser.firstName} ${firstUser.lastName}`,
        email: firstUser.emails?.[0]
      });
      
      // Return first user for CDR testing
      return firstUser.id;
    }
    return null;
  } catch (error) {
    console.error('Error testing people API:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    return null;
  }
}

// Step 2: Test detailed call history API (based on docs)
async function testCallHistoryAPI(userId) {
  try {
    console.log('\n=== Testing Call History API ===');
    // Based on https://developer.webex.com/docs/api/v1/reports-detailed-call-history/get-detailed-call-history
    
    const params = {
      from: startDate,  // YYYY-MM-DD
      to: endDate       // YYYY-MM-DD
    };
    
    // Add user ID if provided
    if (userId) {
      console.log('Adding userId:', userId);
      params.userId = userId;
    }
    
    console.log('Request parameters:', params);
    
    const response = await axios.get('https://webexapis.com/v1/admin/calls/history/details', {
      headers: {
        'Authorization': `Bearer ${process.env.WEBEX_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params
    });
    
    console.log('Status:', response.status);
    console.log('Success! Found', response.data.items?.length || 0, 'call records');
    
    if (response.data.items && response.data.items.length > 0) {
      console.log('First call record:', JSON.stringify(response.data.items[0], null, 2));
    } else {
      console.log('No call records found. API response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('Error testing call history API:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
    
    // Try one more approach
    await tryAlternateEndpoint(userId);
  }
}

// Try an alternate endpoint as a fallback
async function tryAlternateEndpoint(userId) {
  try {
    console.log('\n=== Trying Alternate Endpoint ===');
    
    // Format dates for ISO 8601
    const startTimeISO = oneWeekAgo.toISOString();
    const endTimeISO = now.toISOString();
    
    const params = {
      startTime: startTimeISO,
      endTime: endTimeISO,
      max: 10
    };
    
    if (userId) {
      params.personId = userId;
    }
    
    console.log('Request parameters:', params);
    console.log('Testing telephony API endpoint');
    
    const response = await axios.get('https://webexapis.com/v1/telephony/calls/history', {
      headers: {
        'Authorization': `Bearer ${process.env.WEBEX_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params
    });
    
    console.log('Status:', response.status);
    console.log('Success! Found', response.data.items?.length || 0, 'call records');
    
    if (response.data.items && response.data.items.length > 0) {
      console.log('First call record:', JSON.stringify(response.data.items[0], null, 2));
    } else {
      console.log('No call records found. API response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('Error trying alternate endpoint:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

// Run tests
async function runTests() {
  const userId = await testPeopleAPI();
  
  console.log('\n--- Testing without user ID ---');
  await testCallHistoryAPI();
  
  if (userId) {
    console.log('\n--- Testing with user ID ---');
    await testCallHistoryAPI(userId);
  }
  
  console.log('\nTesting complete');
}

runTests();