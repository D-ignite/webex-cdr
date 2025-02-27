#!/usr/bin/env node
const { execSync } = require('child_process');
const os = require('os');

try {
  console.log('Attempting to find and kill processes using port 3000...');

  if (os.platform() === 'win32') {
    // Windows
    const result = execSync('netstat -ano | findstr :3000', { encoding: 'utf8' });
    
    const lines = result.split('\n');
    for (const line of lines) {
      const match = line.match(/(\d+)$/);
      if (match && match[1]) {
        const pid = match[1];
        console.log(`Killing process with PID: ${pid}`);
        try {
          execSync(`taskkill /F /PID ${pid}`);
          console.log(`Successfully killed process ${pid}`);
        } catch (err) {
          console.error(`Failed to kill process ${pid}: ${err.message}`);
        }
      }
    }
  } else {
    // macOS/Linux
    try {
      const result = execSync('lsof -i :3000 | grep LISTEN', { encoding: 'utf8' });
      const lines = result.split('\n');
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length > 1) {
          const pid = parts[1];
          if (pid && /^\d+$/.test(pid)) {
            console.log(`Killing process with PID: ${pid}`);
            try {
              execSync(`kill -9 ${pid}`);
              console.log(`Successfully killed process ${pid}`);
            } catch (err) {
              console.error(`Failed to kill process ${pid}: ${err.message}`);
            }
          }
        }
      }
    } catch (err) {
      if (!err.stdout && !err.stderr) {
        console.log('No processes found using port 3000.');
      } else {
        throw err;
      }
    }
  }

  console.log('Port 3000 should now be available.');
} catch (error) {
  console.error('Error:', error.message);
  if (error.stderr) {
    console.error('Error details:', error.stderr.toString());
  }
}