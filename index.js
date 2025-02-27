require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBEX_BASE_URL = 'https://webexapis.com/v1';
const MAX_RETRIES = 2;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Helper function to make API requests with retry capability
 * @param {string} endpoint - API endpoint path
 * @param {Object} params - Query parameters
 * @param {number} retries - Number of retries remaining
 * @returns {Promise<Object>} - API response data
 */
async function makeWebexApiRequest(endpoint, params, retries = MAX_RETRIES) {
  try {
    const url = `${WEBEX_BASE_URL}${endpoint}`;
    console.log(`Making API request to: ${url}`);
    console.log('Parameters:', JSON.stringify(params, null, 2));
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${process.env.WEBEX_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params
    });
    
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    console.error(`API Error (${status}):`, JSON.stringify(errorData, null, 2));
    
    // Retry on 429 (rate limit) or 5xx (server error) responses
    if (retries > 0 && (status === 429 || (status >= 500 && status < 600))) {
      console.log(`Retrying request (${retries} retries left)...`);
      const delay = status === 429 ? 2000 : 1000; // Longer delay for rate limits
      await new Promise(resolve => setTimeout(resolve, delay));
      return makeWebexApiRequest(endpoint, params, retries - 1);
    }
    
    throw {
      status,
      message: errorData?.message || error.message,
      details: errorData,
      originalError: error
    };
  }
}

// API endpoint to fetch call history
app.get('/api/calls', async (req, res) => {
  try {
    const { startDate, endDate, userId, limit } = req.query;
    
    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: 'Start date and end date are required' 
      });
    }

    // Prepare request parameters for telephony API
    const params = {
      startTime: startDate, // ISO format
      endTime: endDate,     // ISO format
      max: limit || 100
    };
    
    // Add user ID if provided
    if (userId) {
      params.personId = userId;
    }
    
    // Make request to Webex API with retry capability
    const data = await makeWebexApiRequest('/telephony/calls/history', params);
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching call history:', error.message);
    
    res.status(error.status || 500).json({
      error: error.message || 'Failed to fetch call history',
      details: error.details
    });
  }
});

// API endpoint to fetch users
app.get('/api/users', async (req, res) => {
  try {
    const limit = req.query.limit || 100;
    
    // Make request to Webex API with retry capability
    const data = await makeWebexApiRequest('/people', { max: limit });
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching users:', error.message);
    
    res.status(error.status || 500).json({
      error: error.message || 'Failed to fetch users',
      details: error.details
    });
  }
});

// API endpoint to get API health status
app.get('/api/health', async (req, res) => {
  try {
    // Test connection to Webex API
    const data = await makeWebexApiRequest('/people/me', {});
    
    res.json({
      status: 'healthy',
      api: {
        version: '1.0.0',
        webexConnection: 'connected',
        user: data.displayName || data.emails[0]
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      details: error.details
    });
  }
});

// Find an available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    // Ensure port is a number and within valid range (1-65535)
    const portNum = parseInt(startPort, 10);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      return reject(new Error(`Invalid port number: ${startPort}. Must be between 1 and 65535.`));
    }
    
    // If we've tried too many ports, default to a random port (0)
    if (portNum > 65000) {
      console.log('Too many ports in use, using a random available port...');
      return resolve(0); // Let the OS assign a random available port
    }
    
    const server = require('net').createServer();
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${portNum} is in use, trying next port...`);
        resolve(findAvailablePort(portNum + 1));
      } else {
        reject(err);
      }
    });
    
    server.listen(portNum, () => {
      const foundPort = server.address().port;
      server.close(() => {
        resolve(foundPort);
      });
    });
  });
};

// Start server with available port
(async () => {
  try {
    // Try to find an available port, starting with PORT from env or default
    console.log(`Attempting to start server on port ${PORT}...`);
    const availablePort = await findAvailablePort(PORT);
    
    // Start the server with the available port
    app.listen(availablePort, () => {
      console.log(`✅ Server running on http://localhost:${availablePort}`);
      console.log(`🔍 API health check: http://localhost:${availablePort}/api/health`);
      console.log(`📞 View call history at http://localhost:${availablePort}`);
    });
  } catch (error) {
    console.error(`❌ Failed to start server: ${error.message}`);
    console.error('Please try again with a different port number or free up ports on your system.');
    console.error('You can use the following command to set a custom port:');
    console.error('PORT=8000 npm start');
    process.exit(1); // Exit with error code
  }
})();