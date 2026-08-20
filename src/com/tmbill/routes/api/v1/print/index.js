const express = require('express');
const { PRINT } = require('../../../../server/SocketEvents');

const printRouter = express.Router();

async function printHandler(req, res) {
  console.log("Print Job Received:", req.body);
  try {
    if (global.mainWindow && global.mainWindow.webContents) {
      // Forward the KOT HTML payload to the existing Electron desktop print bridge
      global.mainWindow.webContents.send(PRINT.KOT, req.body);
      return res.json({ success: true, message: "Sent to desktop print bridge" });
    } else {
      // Fallback: If not running in Electron wrapper (pure web), return false so frontend uses browser preview
      return res.json({ success: false, message: "Desktop print bridge not found" });
    }
  } catch (err) {
    console.error("Print API Error:", err);
    return res.status(500).json({ success: false, message: err.message || "Print failure" });
  }
}

printRouter.post('/', printHandler);

module.exports = printRouter;
