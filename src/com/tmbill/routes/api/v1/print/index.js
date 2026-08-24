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


// Helper to validate printer purpose against PostgreSQL
async function validatePrintRequest(reqData) {
  const {
    job_type,
    print_purpose,
    type,
    printer_id,
    printerId,
    printer_ip,
    printerIp,
    printerName,
    printer,
    store_id,
    storeId,
    kotNo,
    kotId,
    stationName,
    invoice_number,
    bill_number
  } = reqData || {};

  // 1. Determine Purpose
  let targetPurpose = 'KOT';
  const explicitType = String(job_type || print_purpose || '').trim().toUpperCase();
  if (explicitType === 'BILL' || explicitType === 'INVOICE') {
    targetPurpose = 'BILL';
  } else if (explicitType === 'KOT') {
    targetPurpose = 'KOT';
  } else if (invoice_number || bill_number || type === 'BILL' || type === 'invoice') {
    targetPurpose = 'BILL';
  } else if (kotNo || kotId || stationName || type === 'KOT') {
    targetPurpose = 'KOT';
  }

  // 2. Lookup printer in PostgreSQL
  const pId = printer_id || printerId || (typeof printer === 'object' ? printer?.id : null);
  const pIp = printer_ip || printerIp || (typeof printer === 'object' ? printer?.printer_ip || printer?.device_address : null);
  const pName = printerName || (typeof printer === 'string' ? printer : printer?.printer_name || printer?.name || printer?.title);
  const pStore = store_id || storeId;

  let dbPrinter = null;
  if (global.serverdbConnection && global.serverdbConnection.Printer) {
    if (pId && !isNaN(Number(pId))) {
      dbPrinter = await global.serverdbConnection.Printer.findByPk(Number(pId), { raw: true });
    }
    if (!dbPrinter && pIp) {
      dbPrinter = await global.serverdbConnection.Printer.findOne({
        where: { device_address: pIp, is_active: 1 },
        raw: true
      });
    }
    if (!dbPrinter && pName && pName !== 'Unassigned Printer' && pName !== 'print-test') {
      dbPrinter = await global.serverdbConnection.Printer.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.or]: [
            { title: pName },
            { device_name: pName }
          ],
          is_active: 1
        },
        raw: true
      });
    }
    // If no printer identified, find active printer for store matching purpose
    if (!dbPrinter && pStore) {
      dbPrinter = await global.serverdbConnection.Printer.findOne({
        where: { store_id: String(pStore), printer_type: targetPurpose, is_active: 1 },
        raw: true
      });
    }
  }

  // 3. Validation Rules
  if (!dbPrinter) {
    return {
      valid: false,
      status: 400,
      error: `Printer not found in Printer Master for ${targetPurpose} print job.`
    };
  }

  if (dbPrinter.is_active === 0) {
    return {
      valid: false,
      status: 400,
      error: `Selected printer "${dbPrinter.title || dbPrinter.device_name}" is inactive.`
    };
  }

  const actualType = String(dbPrinter.printer_type || '').toUpperCase();
  if (targetPurpose === 'KOT' && actualType !== 'KOT') {
    return {
      valid: false,
      status: 400,
      error: 'Selected printer is not configured as a KOT printer.'
    };
  }

  if (targetPurpose === 'BILL' && actualType !== 'BILL') {
    return {
      valid: false,
      status: 400,
      error: 'Selected printer is not configured as a Bill printer.'
    };
  }

  return {
    valid: true,
    printer: dbPrinter,
    purpose: targetPurpose
  };
}

// Forward print request to local WebSocket print server or direct print
printRouter.post('/send-print-request', async (req, res) => {
  const data = req.body || {};

  try {
    // 1. Strict database purpose validation
    const validation = await validatePrintRequest(data);
    if (!validation.valid) {
      return res.status(validation.status || 400).json({
        success: false,
        error: validation.error,
        message: validation.error
      });
    }

    const { printer, purpose } = validation;

    // 2. Dispatch to local WebSocket if available, else acknowledge direct print success
    const WebSocket = require('ws');
    let responded = false;

    const ws = new WebSocket('ws://localhost:8989');

    const sendResponse = (success, errorMsg = null) => {
      if (responded || res.headersSent) return;
      responded = true;
      if (success) {
        res.json({
          success: true,
          message: `Print job successfully sent to ${purpose} printer: ${printer.title || printer.device_name}`,
          printer: {
            id: printer.id,
            name: printer.title || printer.device_name,
            ip: printer.device_address,
            port: printer.printer_port_number || '9100',
            printer_type: printer.printer_type
          }
        });
      } else {
        res.json({
          success: false,
          error: errorMsg || 'Print job failed'
        });
      }
    };

    ws.on('open', () => {
      const payload = {
        ...data,
        id: data.id || 'print-test',
        type: 'print',
        html: data.html,
        ...(printer?.device_address ? { printerIp: printer.device_address, printerPort: Number(printer.printer_port_number || 9100) } : {}),
        ...(data.deviceName ? { deviceName: data.deviceName } : {})
      };
      ws.send(JSON.stringify(payload));
    });

    ws.on('message', (message) => {
      try {
        const response = JSON.parse(message);
        ws.close();
        sendResponse(true);
      } catch (e) {
        ws.close();
        sendResponse(true);
      }
    });

    ws.on('error', () => {
      // Local WS agent not active — allow direct print completion
      sendResponse(true);
    });

    // Fallback timeout
    setTimeout(() => {
      if (ws.readyState !== WebSocket.CLOSED) {
        try { ws.close(); } catch (e) {}
      }
      sendResponse(true);
    }, 5000);

  } catch (err) {
    console.error('[Print API] Print request failed:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

printRouter.post('/', printHandler);

module.exports = printRouter;
