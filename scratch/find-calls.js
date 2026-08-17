const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../ALFA FRONTEND/src/pages/Restaurant/pages/POSBillingPage.jsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log('Searching for KOT / order creation calls in POSBillingPage.jsx:');
lines.forEach((line, idx) => {
  if (line.includes('createKOT') || line.includes('kotService') || line.includes('orderService') || line.includes('createOrder')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
