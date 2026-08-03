const {
  generateTallyXML,
  exportTallyReport,
} = require('../../main_controllers/TallyReport');
require('../../main_controllers/WaiterNotification');

async function requestexportTallyReport(data) {
  try {
    if (data && data.store_id) {
      const response = await exportTallyReport(data);

      return response;
    }
    console.warn(
      `Message="Invalid Export Tally Report Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Exporting Tally Report." Payload="${JSON.stringify(data)}"`,
    );
    console.error(error);
  }
  return undefined;
}

async function requestgenerateTallyXML(data) {
  try {
    if (data) {
      const response = await generateTallyXML(data);
      return response;
    }
    console.warn(
      `Message="Invalid Generate Tally XML Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(
      `Message="Error While Generating Tally XML." Payload="${JSON.stringify(data)}"`,
    );
    console.error(error);
  }
  return undefined;
}

module.exports = {
  requestexportTallyReport,
  requestgenerateTallyXML,
};
