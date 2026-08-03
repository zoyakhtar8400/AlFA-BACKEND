const { ipcMain } = require('electron');
const { Printer } = require('../../js/database');
const {
  ADD_PRINTER,
  ADD_PRINTER_REPLY,
  PRINTERS_IPC,
} = require('../../util/IPC_Messages');
const { getTables } = require('../../main_controllers/Order');

ipcMain.on('update-printer', async (event, content) => {
  if (content) {
    try {
      const printerData = JSON.parse(content);

      const result = await Printer.update(
        printerData.updateData,
        printerData.whereData,
      );
      event.reply('update-printer-reply', JSON.stringify(result));
    } catch (error) {
      console.log(error);
    }
  }
});

ipcMain.on(ADD_PRINTER, async (event, content) => {
  if (content) {
    try {
      const data = content.printerInfo;
      if (data) {
        const result = await Printer.create(data);
        event.reply(ADD_PRINTER_REPLY, {
          printerInfo: result.get({ plain: true }),
          for: content.for,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }
});

async function getPrinters() {
  let printers = [];
  try {
    printers = await Printer.findAll({
      raw: true,
      order: [['id', 'ASC']],
    });
  } catch (error) {
    printers = [];
  }
  return printers;
}

/**
 * Fetch printers
 */
ipcMain.on('get-printers', async (event) => {
  const printers = await getPrinters();
  event.reply('get-printers-reply', JSON.stringify(printers));
});

ipcMain.on(PRINTERS_IPC.DELETE_PRINTER, async (event, content) => {
  if (content.id) {
    await Printer.destroy({
      where: { id: content.id },
    });
    const printers = await getPrinters();
    event.reply('get-printers-reply', JSON.stringify(printers));
  }
});

global.betteripcMain.answerRenderer(PRINTERS_IPC.GET_TABLES, async (params) => {
  const tables = await getTables(params.store_id);
  return { tables };
});
