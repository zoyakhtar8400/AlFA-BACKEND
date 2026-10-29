// Standalone Entry Point for ALFA SOFTWARE Backend
const { execSync } = require('child_process');

// Auto-clean port 8000 if an orphaned process is holding it
try {
  if (process.platform === 'win32') {
    const netstatOutput = execSync('netstat -ano | findstr /R ":8000\\>"', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    const lines = netstatOutput.trim().split(/\r?\n/);
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== String(process.pid) && parseInt(pid, 10) > 0) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`[ALFA Server] Freed Port 8000 from old PID ${pid}`);
        } catch (killErr) {}
      }
    }
  }
} catch (e) {
  // Port 8000 is already completely free
}

require('./src/com/tmbill/server/Server.js');


