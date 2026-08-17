const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../../ALFA FRONTEND/src');

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(f => {
    const fullPath = path.join(dir, f);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (f.toLowerCase().includes('dashboard') && (f.endsWith('.js') || f.endsWith('.jsx'))) {
      console.log(`Found file: ${fullPath}`);
    }
  });
}

walk(srcDir);
