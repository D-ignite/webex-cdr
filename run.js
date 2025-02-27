#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('Starting Webex CDR Viewer...');

try {
  // Start the server
  const serverProcess = require('child_process').spawn('npm', ['start'], {
    cwd: __dirname,
    stdio: ['inherit', 'pipe', 'inherit'] // Pipe stdout so we can read it
  });

  let serverUrl = null;
  
  // Listen for server output to get the actual port
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    // Extract URL from server output
    const match = output.match(/Server running on (http:\/\/localhost:\d+)/);
    if (match && match[1] && !serverUrl) {
      serverUrl = match[1];
      console.log(`Server started on ${serverUrl}`);
      
      // Open browser with the correct URL
      try {
        const openCommand = process.platform === 'win32' ? 'start' :
                           process.platform === 'darwin' ? 'open' : 'xdg-open';
        
        execSync(`${openCommand} ${serverUrl}`);
        console.log('Browser opened automatically');
      } catch (e) {
        console.log(`Could not open browser automatically. Please navigate to ${serverUrl}`);
      }
    }
  });

  // Handle server process events
  serverProcess.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });

  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    serverProcess.kill();
    process.exit(0);
  });

} catch (error) {
  console.error('Error starting server:', error);
  process.exit(1);
}