// Auto-load environment variables for all scripts
// Usage: require('./load-env.js') at the top of any script

const fs = require('fs');
const path = require('path');

const envFile = path.join(__dirname, 'env.sh');

if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^export\s+(\w+)="(.*)"/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  });
}

// Also try workspace .env
const dotenvFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(dotenvFile)) {
  const content = fs.readFileSync(dotenvFile, 'utf8');
  content.split('\n').forEach(line => {
    if (line.startsWith('#') || !line.includes('=')) return;
    const [key, ...rest] = line.split('=');
    const val = rest.join('=').trim();
    if (key && val && !process.env[key.trim()]) {
      process.env[key.trim()] = val;
    }
  });
}
