const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ALFA FRONTEND/src/components/layout/Sidebar.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Searching for logout in Sidebar.jsx:');
lines.forEach((line, idx) => {
  if (line.toLowerCase().includes('logout') || line.includes('SignOut')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
