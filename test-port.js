/**
 * Test the port validation and availability checking
 * This script verifies that the findAvailablePort function
 * correctly handles port validation and edge cases
 */

// Copy of the findAvailablePort function from index.js
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

async function runTests() {
  console.log('=== Testing port validation ===');
  
  // Test 1: Valid port
  try {
    console.log('Test 1: Valid port (3000)');
    const port = await findAvailablePort(3000);
    console.log(`✅ Success: Found available port: ${port}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
  
  // Test 2: String that's a valid number
  try {
    console.log('\nTest 2: String port that parses to valid number ("8080")');
    const port = await findAvailablePort("8080");
    console.log(`✅ Success: Found available port: ${port}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
  
  // Test 3: Invalid port (too high)
  try {
    console.log('\nTest 3: Invalid port (too high: 70000)');
    const port = await findAvailablePort(70000);
    console.error(`❌ Failed: Should have rejected port 70000 but got ${port}`);
  } catch (error) {
    console.log(`✅ Success: Correctly rejected invalid port: ${error.message}`);
  }
  
  // Test 4: Invalid port (negative)
  try {
    console.log('\nTest 4: Invalid port (negative: -1)');
    const port = await findAvailablePort(-1);
    console.error(`❌ Failed: Should have rejected port -1 but got ${port}`);
  } catch (error) {
    console.log(`✅ Success: Correctly rejected invalid port: ${error.message}`);
  }
  
  // Test 5: Invalid port (non-numeric)
  try {
    console.log('\nTest 5: Invalid port (non-numeric: "abc")');
    const port = await findAvailablePort("abc");
    console.error(`❌ Failed: Should have rejected port "abc" but got ${port}`);
  } catch (error) {
    console.log(`✅ Success: Correctly rejected invalid port: ${error.message}`);
  }
  
  // Test 6: Edge case - port 65000
  try {
    console.log('\nTest 6: Edge case - Testing near max ports (65000)');
    const port = await findAvailablePort(65000);
    console.log(`✅ Success: Found available port: ${port}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }

  console.log('\n=== Tests complete ===');
}

runTests();