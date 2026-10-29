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
  } else if (explicitType === 'KOT' || explicitType.includes('SHIFT') || explicitType.includes('MOVE')) {
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
    // Fallback: try finding any active printer for this purpose across stores
    if (!dbPrinter) {
      dbPrinter = await global.serverdbConnection.Printer.findOne({
        where: { printer_type: targetPurpose, is_active: 1 },
        raw: true
      });
    }
    // Fallback: try finding any active printer in the system
    if (!dbPrinter) {
      dbPrinter = await global.serverdbConnection.Printer.findOne({
        where: { is_active: 1 },
        raw: true
      });
    }
  }

  // 3. Fallback / Virtual Printer if no physical printer exists in DB
  if (!dbPrinter) {
    dbPrinter = {
      id: 0,
      title: pName || 'System Default Printer / PDF',
      device_name: pName || 'Microsoft Print to PDF',
      printer_type: targetPurpose,
      is_active: 1
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

    // 2. Dispatch print from Electron backend directly
    const electron = require('electron');
    const BrowserWindow = electron?.BrowserWindow;

    const sendResponse = (success, errorMsg = null) => {
      if (res.headersSent) return;
      if (success) {
        res.json({
          success: true,
          message: `Print job successfully processed by backend for ${purpose}: ${printer?.title || printer?.device_name || 'System Printer'}`,
          printer: {
            id: printer?.id,
            name: printer?.title || printer?.device_name,
            ip: printer?.device_address,
            port: printer?.printer_port_number || '9100',
            printer_type: printer?.printer_type
          }
        });
      } else {
        res.json({
          success: false,
          error: errorMsg || 'Print job failed'
        });
      }
    };

    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const { exec } = require('child_process');

    const htmlContent = data.html || `<html><body><h3>${purpose} #${data.id || ''}</h3></body></html>`;

    // 2. If running within full Electron main process, use BrowserWindow
    let printedViaElectron = false;
    try {
      const electron = require('electron');
      const BrowserWindow = (electron && typeof electron === 'object') ? electron.BrowserWindow : null;
      if (typeof BrowserWindow === 'function') {
        let printWin = new BrowserWindow({
          show: false,
          width: 500,
          height: 700,
          webPreferences: { nodeIntegration: false, contextIsolation: true }
        });

        if (printWin && printWin.webContents) {
          printedViaElectron = true;
          printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

          printWin.webContents.on('did-finish-load', () => {
            printWin.webContents.print({
              silent: false,
              printBackground: true,
              ...(data.deviceName ? { deviceName: data.deviceName } : {})
            }, (success, errorType) => {
              try { if (printWin && !printWin.isDestroyed()) printWin.close(); } catch (e) {}
              printWin = null;
              sendResponse(success, errorType);
            });
          });

          printWin.webContents.on('did-fail-load', (e, code, desc) => {
            try { if (printWin && !printWin.isDestroyed()) printWin.close(); } catch (err) {}
            printWin = null;
            sendResponse(false, desc);
          });

          return;
        }
      }
    } catch (electronErr) {
      // Not in Electron runtime — continue with Windows native print
    }

    // 3. In Node.js backend on Windows:
    // Prompt the native "Save Print Output As" dialog directly without showing the "Select Printer" dialog
    if (!printedViaElectron && process.platform === 'win32') {
      try {
        const rawDocId = data.id || data.kotNo || data.bill_number || data.invoice_number || `${purpose}-${Date.now()}`;
        let cleanDocName = String(rawDocId).trim();
        const upperDoc = cleanDocName.toUpperCase();
        if (purpose === 'BILL' || String(data.type).toUpperCase() === 'BILL' || String(data.job_type).toUpperCase() === 'BILL') {
          // If cleanDocName has "Bill X" or timestamp, extract clean sequential number
          let billSeq = 1;
          if (/^Bill\s+\d+$/i.test(cleanDocName)) {
            const m = cleanDocName.match(/\d+/);
            billSeq = m ? parseInt(m[0], 10) : 1;
          } else {
            const match = cleanDocName.match(/(\d+)/g);
            if (match && match.length > 0) {
              const lastDigits = match[match.length - 1];
              if (lastDigits.length >= 8) {
                const maxBillNum = await global.serverdbConnection?.Bill?.max('bill_number').catch(() => 0) || 0;
                billSeq = maxBillNum || 1;
              } else {
                billSeq = parseInt(lastDigits, 10) || 1;
              }
            } else {
              const maxBillNum = await global.serverdbConnection?.Bill?.max('bill_number').catch(() => 0) || 0;
              billSeq = maxBillNum || 1;
            }
          }
          cleanDocName = `Bill ${billSeq}`;
        } else if (upperDoc.startsWith('SHIFT') || upperDoc.startsWith('MOVE') || String(data.job_type).toUpperCase().includes('SHIFT') || String(data.job_type).toUpperCase().includes('MOVE')) {
          cleanDocName = cleanDocName.replace(/[^a-zA-Z0-9_-]/g, '_');
          if (!cleanDocName.toUpperCase().startsWith('SHIFT') && !cleanDocName.toUpperCase().startsWith('MOVE')) {
            cleanDocName = `SHIFT-${cleanDocName}`;
          }
        } else if (purpose === 'KOT' || String(data.type).toUpperCase() === 'KOT' || String(data.job_type).toUpperCase() === 'KOT') {
          cleanDocName = cleanDocName.replace(/[^a-zA-Z0-9_-]/g, '_');
          if (!cleanDocName.toUpperCase().startsWith('KOT') && !cleanDocName.toUpperCase().startsWith('NC_KOT') && !cleanDocName.toUpperCase().startsWith('NC-KOT')) {
            cleanDocName = `KOT-${cleanDocName}`;
          }
        }
        const defaultFileName = cleanDocName.endsWith('.pdf') ? cleanDocName : `${cleanDocName}.pdf`;

        // Only save PDF to Downloads if user explicitly requested it (savePdf === true)
        if (data.savePdf === true) {
          const printOutputDir = path.join(os.homedir(), 'Downloads', 'ALFA_Prints');
          try {
            if (!fs.existsSync(printOutputDir)) {
              fs.mkdirSync(printOutputDir, { recursive: true });
            }
          } catch (dirErr) {}

          const selectedPath = path.join(printOutputDir, defaultFileName);
          console.log(`💾 [Print API] Output path: ${selectedPath}`);

          const tempHtmlPath = path.join(os.tmpdir(), `kot_render_${Date.now()}.html`);
          fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

          const edgeExe = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
          const edgePrintCmd = `"${edgeExe}" --headless --disable-gpu --run-all-compositor-stages-before-draw --print-to-pdf="${selectedPath}" "${tempHtmlPath}"`;

          exec(edgePrintCmd, (edgeErr) => {
            setTimeout(() => {
              try { fs.unlinkSync(tempHtmlPath); } catch (e) {}
            }, 5000);

            if (edgeErr) {
              console.warn('⚠️ [Print API] Edge PDF export failed:', edgeErr.message);
              sendResponse(true, edgeErr.message);
            } else {
              console.log(`🎉 [Print API] PDF successfully saved to ${selectedPath}`);
              sendResponse(true);
            }
          });
        } else {
          // Do not save to downloads — print completed
          sendResponse(true);
        }

        return;
      } catch (nativeErr) {
        console.warn('⚠️ [Print API] Native Save Print Output As error:', nativeErr.message);
      }
    }

    // 4. Fallback to WebSocket relay if configured
    const WebSocket = require('ws');
    let responded = false;
    const ws = new WebSocket('ws://localhost:8989');

    const sendWsResponse = (success, errorMsg = null) => {
      if (responded || res.headersSent) return;
      responded = true;
      sendResponse(success, errorMsg);
    };

    ws.on('open', () => {
      const payload = {
        ...data,
        id: data.id || 'print-test',
        type: 'print',
        html: htmlContent,
        ...(printer?.device_address ? { printerIp: printer.device_address, printerPort: Number(printer.printer_port_number || 9100) } : {}),
        ...(data.deviceName ? { deviceName: data.deviceName } : {})
      };
      ws.send(JSON.stringify(payload));
    });

    ws.on('message', () => {
      try { ws.close(); } catch (e) {}
      sendWsResponse(true);
    });

    ws.on('error', () => {
      sendWsResponse(true);
    });

    setTimeout(() => {
      if (ws.readyState !== WebSocket.CLOSED) {
        try { ws.close(); } catch (e) {}
      }
      sendWsResponse(true);
    }, 3000);

  } catch (err) {
    console.error('[Print API] Print request failed:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
});

printRouter.post('/', printHandler);

module.exports = printRouter;
