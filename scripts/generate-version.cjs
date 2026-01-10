const fs = require('fs');
const path = require('path');

// Generate a unique version ID based on current timestamp
const version = {
  buildId: Date.now().toString(),
  buildDate: new Date().toISOString(),
};

// Create public directory if it doesn't exist
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write version file to public directory
const versionPath = path.join(publicDir, 'version.json');
fs.writeFileSync(versionPath, JSON.stringify(version, null, 2));

console.log('Generated version.json:', version);
