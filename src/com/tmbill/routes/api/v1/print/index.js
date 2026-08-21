const express = require('express');

const printRouter = express.Router();

async function printHandler(req, res) {
  const { id, html, type } = req.body || {};
  console.log(`[Print API] Received: id=${id}, type=${type}`);

  if (!html) {
    return res.status(400).json({ success: false, message: 'No HTML content provided' });
  }

  try {
    const puppeteer = require('puppeteer');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    let pdfBuffer;
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      pdfBuffer = await page.pdf({
        printBackground: true,
        format: 'A4',
        margin: { top: '5mm', bottom: '5mm', left: '5mm', right: '5mm' },
      });
      console.log(`✅ [Print API] PDF generated in memory (${pdfBuffer.length} bytes)`);
    } finally {
      await browser.close();
    }

    // Send PDF as binary response — browser will trigger "Save As" dialog
    const fileName = `${type || 'print'}-${id || Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (err) {
    console.error('[Print API] PDF generation failed:', err.message);
    return res.status(500).json({ success: false, message: err.message || 'PDF generation failed' });
  }
}


// Forward print request to local WebSocket print server
printRouter.post('/send-print-request', (req, res) => {
  try {
    const WebSocket = require('ws');
    const data = req.body;
    const ws = new WebSocket('ws://localhost:8989');

    ws.on('open', () => {
      const payload = {
        ...data,
        id: 'print-test',
        type: 'print'
      };
      ws.send(JSON.stringify(payload));
    });

    ws.on('message', (message) => {
      try {
        const response = JSON.parse(message);
        ws.close();
        if (!res.headersSent) res.json(response);
      } catch (e) {
        ws.close();
        if (!res.headersSent) res.json({ success: false, error: 'Invalid response from print server' });
      }
    });

    ws.on('error', (error) => {
      console.error("WebSocket Print Error:", error);
      if (!res.headersSent) res.json({ success: false, error: 'Failed to connect to print server' });
    });

    // Timeout in case no response
    setTimeout(() => {
      if (ws.readyState !== WebSocket.CLOSED) {
        ws.close();
        if (!res.headersSent) res.json({ success: false, error: 'Print request timed out' });
      }
    }, 5000);

  } catch (err) {
    console.error('[Print API] WebSocket request failed:', err.message);
    if (!res.headersSent) res.json({ success: false, error: err.message });
  }
});

printRouter.post('/', printHandler);

module.exports = printRouter;
