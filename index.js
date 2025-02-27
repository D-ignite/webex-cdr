require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to fetch CDR data
app.get('/api/cdr', async (req, res) => {
  try {
    const { startDate, endDate, userId, limit } = req.query;
    
    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Prepare request parameters
    // Using parameter names for telephony API
    const params = {
      startTime: startDate, // ISO format
      endTime: endDate     // ISO format
    };
    
    // Add optional parameters if provided
    if (userId) params.personId = userId; // Using personId for telephony API
    if (limit) params.max = limit;
    
    console.log('Making API request with params:', JSON.stringify(params, null, 2));
    console.log('URL: https://webexapis.com/v1/telephony/calls/history');
    console.log('Token (first 10 chars):', process.env.WEBEX_TOKEN.substring(0, 10) + '...');
    
    // Make request to Webex API
    try {
      // Use the working endpoint from our tests
      const response = await axios.get('https://webexapis.com/v1/telephony/calls/history', {
        headers: {
          'Authorization': `Bearer ${process.env.WEBEX_TOKEN}`,
          'Content-Type': 'application/json'
        },
        params
      });
      
      console.log('API response status:', response.status);
      console.log('API response headers:', JSON.stringify(response.headers, null, 2));
      console.log('API response data (preview):', JSON.stringify(response.data).substring(0, 300) + '...');
      
      res.json(response.data);
    } catch (axiosError) {
      console.error('Axios error:', axiosError.message);
      console.error('Response status:', axiosError.response?.status);
      console.error('Response data:', JSON.stringify(axiosError.response?.data, null, 2));
      
      throw axiosError;
    }
  } catch (error) {
    console.error('Error fetching CDR data:', error.response?.data || error.message);
    console.error('Full error:', JSON.stringify(error.response?.data || error.message, null, 2));
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || error.message || 'Failed to fetch CDR data'
    });
  }
});

// API endpoint to fetch users
app.get('/api/users', async (req, res) => {
  try {
    console.log('Fetching users...');
    console.log('API URL: https://webexapis.com/v1/people');
    
    const response = await axios.get('https://webexapis.com/v1/people', {
      headers: {
        'Authorization': `Bearer ${process.env.WEBEX_TOKEN}`,
        'Content-Type': 'application/json'
      },
      params: {
        max: 100 // Adjust as needed
      }
    });
    
    console.log(`Successfully fetched ${response.data.items?.length || 0} users`);
    
    if (response.data.items && response.data.items.length > 0) {
      console.log('First user sample:', JSON.stringify(response.data.items[0], null, 2));
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching users:', error.response?.data || error.message);
    console.error('Error status:', error.response?.status);
    console.error('Error details:', JSON.stringify(error.response?.data, null, 2));
    
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.message || error.message || 'Failed to fetch users'
    });
  }
});

// Find an available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const server = require('net').createServer();
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
    
    server.listen(startPort, () => {
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
    const availablePort = await findAvailablePort(PORT);
    app.listen(availablePort, () => {
      console.log(`Server running on http://localhost:${availablePort}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
  }
})();