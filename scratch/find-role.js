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
    } else if (f.endsWith('.js') || f.endsWith('.jsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('localStorage.getItem') && (content.includes('user') || content.includes('role') || content.includes('type'))) {
        console.log(`Found in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          if (l.includes('localStorage.getItem') && (l.includes('user') || l.includes('role') || l.includes('type'))) {
            console.log(`  Line ${idx + 1}: ${l.trim()}`);
          }
        });
      }
    }
  });
}

walk(srcDir);
