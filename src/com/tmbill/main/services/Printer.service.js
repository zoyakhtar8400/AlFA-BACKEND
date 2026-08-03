const { Printer } = require('../../js/database');

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

module.exports = {
  getPrinters,
};
