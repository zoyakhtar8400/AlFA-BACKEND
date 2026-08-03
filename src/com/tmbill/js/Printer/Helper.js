const { PRINTER_ACTION_TYPES } = require('../../util/Constants');
const { safeParse } = require('../../util/RendererUtils');

/**
 * Return the printers assigned to the table based on
 * parameters
 * @param {Object}- {table_name, action_type, app_source} as params
 * @returns {Array} printers array
 */
function getPrinterbytable(params) {
  console.log('params:', params);
  const printer = [];
  try {
    // console.log('params:', params);
    const currentprintersList = window.printersList;
    if (
      params.table_id &&
      currentprintersList &&
      Array.isArray(currentprintersList) &&
      currentprintersList.length
    ) {
      let defaultPrinter;
      let printerIndex;
      let defaultPrinterIndex;
      let defaultPrinters = [];
      const assignedPrinters = currentprintersList.filter((p, index) => {
        // Find the Printersby action type
        // and further filter based on table name
        const moreInfo = safeParse(p.more_info || {});
        let found = 0;
        if (
          // p.title === params.table_name &&
          moreInfo?.table?.includes(params.table_id) &&
          p.action_type === params.action_type &&
          [
            PRINTER_ACTION_TYPES.TABLEWISE_BILL_PRINTER,
            PRINTER_ACTION_TYPES.TABLEWISE_KOT_PRINTER,
          ].includes(params.action_type) &&
          [moreInfo.app_source].includes(params.app_source)
        ) {
          found += 1;
          // printerIndex = index + 1;
          defaultPrinter = p;
          defaultPrinterIndex = index + 1;
          Object.assign(defaultPrinter, {
            printerIndex: defaultPrinterIndex,
          });
          defaultPrinters.push(defaultPrinter);
        }

        if (
          // p.title === params.table_name &&
          moreInfo?.table?.includes(params.table_id) &&
          p.action_type === params.action_type &&
          [
            PRINTER_ACTION_TYPES.TABLEWISE_BILL_PRINTER,
            PRINTER_ACTION_TYPES.TABLEWISE_KOT_PRINTER,
          ].includes(params.action_type) &&
          ['all'].includes(moreInfo.app_source)
        ) {
          defaultPrinter = p;
          defaultPrinterIndex = index + 1;
          Object.assign(defaultPrinter, {
            printerIndex: defaultPrinterIndex,
          });
          defaultPrinters.push(defaultPrinter);
        }
        return found > 0;
      });

      if (assignedPrinters) {
        // if (
        //   defaultPrinter &&
        //   assignedPrinters &&
        //   assignedPrinters.length === 0
        // ) {
        //   assignedPrinters.push(defaultPrinter);
        //   printerIndex = defaultPrinter.printerIndex;
        // }
        assignedPrinters.push(...defaultPrinters);
        // Filter the items by table name
        assignedPrinters.forEach((a) => {
          printer.push({
            deviceName: a.device_name,
            silent: true,
            copies: a.no_of_prints,
            size: a.printer_size,
            printerIndex: a.printerIndex,
            activate: a.activate,
          });
        });
      }
      const uniquePrinters = [];
      const seenPrinterNames = new Set();
      printer.forEach((device) => {
        if (!seenPrinterNames.has(device.deviceName)) {
          uniquePrinters.push(device);
          seenPrinterNames.add(device.deviceName);
        }
      });
      return uniquePrinters;
    }
  } catch (error) {
    console.error();
  }
  return printer;
}

/**
 * Return the printers assigned to the order type based on
 * parameters
 * @param {Object}- {billing_type, action_type, app_source} as params
 * @returns {Array} printers array
 */
async function getPrinterbyordertype(params) {
  const printer = [];
  try {
    const currentprintersList = window.printersList;
    if (
      // params.table_name &&
      currentprintersList &&
      Array.isArray(currentprintersList) &&
      currentprintersList.length
    ) {
      let defaultPrinter;
      let printerIndex;
      let defaultPrinterIndex;
      let defaultPrinters = [];
      const assignedPrinters = currentprintersList.filter((p, index) => {
        // Find the Printersby action type
        // and further filter based on table name
        let found = 0;
        const moreInfo = safeParse(p.more_info || {});

        if (
          p.action_type === params.action_type &&
          [
            PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
            PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
          ].includes(params.action_type) &&
          [params.app_source].includes(moreInfo.app_source) &&
          [params.billing_type].includes(moreInfo.billing_type)
        ) {
          found += 1;
          // p.printerIndex = index + 1;
          defaultPrinter = p;
          defaultPrinterIndex = index + 1;
          Object.assign(defaultPrinter, {
            printerIndex: defaultPrinterIndex,
          });
          defaultPrinters.push(defaultPrinter);
        }

        if (
          p.action_type === params.action_type &&
          [
            PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
            PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
          ].includes(params.action_type) &&
          ['all'].includes(moreInfo.app_source) &&
          [params.billing_type].includes(moreInfo.billing_type)
          // (['all'].includes(moreInfo.app_source) ||
          //   ['all'].includes(moreInfo.billing_type))
        ) {
          defaultPrinter = p;
          defaultPrinterIndex = index + 1;
          Object.assign(defaultPrinter, {
            printerIndex: defaultPrinterIndex,
          });
          defaultPrinters.push(defaultPrinter);
        }

        // if app souce is set and order type set to default then it is not working as expected. If we set source captain and pos then two prints are coming
        // if (
        //   p.action_type === params.action_type &&
        //   [
        //     PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
        //     PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
        //   ].includes(params.action_type) &&
        //   ['all'].includes(moreInfo.billing_type)
        //   // (['all'].includes(moreInfo.app_source) ||
        //   //   ['all'].includes(moreInfo.billing_type))
        // ) {
        //   defaultPrinter = p;
        //   defaultPrinterIndex = index + 1;
        //   Object.assign(defaultPrinter, {
        //     printerIndex: defaultPrinterIndex,
        //   });
        //   defaultPrinters.push(defaultPrinter);
        // }

        if (
          p.action_type === params.action_type &&
          [
            PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
            PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
          ].includes(params.action_type) &&
          [params.app_source].includes(moreInfo.app_source) &&
          ['all'].includes(moreInfo.billing_type)
          // (['all'].includes(moreInfo.app_source) ||
          //   ['all'].includes(moreInfo.billing_type))
        ) {
          defaultPrinter = p;
          defaultPrinterIndex = index + 1;
          Object.assign(defaultPrinter, {
            printerIndex: defaultPrinterIndex,
          });
          defaultPrinters.push(defaultPrinter);
        }

        if (
          p.action_type === params.action_type &&
          [
            PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
            PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
          ].includes(params.action_type) &&
          ['all'].includes(moreInfo.app_source) &&
          ['all'].includes(moreInfo.billing_type)
        ) {
          defaultPrinter = p;
          defaultPrinterIndex = index + 1;
          Object.assign(defaultPrinter, {
            printerIndex: defaultPrinterIndex,
          });
          defaultPrinters.push(defaultPrinter);
        }

        return found > 0;
      });

      if (assignedPrinters) {
        // Filter the items by table name
        // if (
        //   defaultPrinter &&
        //   assignedPrinters &&
        //   assignedPrinters.length === 0
        // ) {
        //   assignedPrinters.push(defaultPrinter);
        //   printerIndex = defaultPrinter.printerIndex;
        // }
        assignedPrinters.push(...defaultPrinters);
        assignedPrinters.forEach((a) => {
          printer.push({
            deviceName: a.device_name,
            silent: true,
            copies: a.no_of_prints,
            size: a.printer_size,
            printerIndex: a.printerIndex,
            activate: a.activate,
          });
        });
      }
    }
  } catch (error) {
    console.error();
  }
  const uniquePrinters = [];
  const seenPrinterNames = new Set();
  printer.forEach((device) => {
    if (!seenPrinterNames.has(device.deviceName)) {
      uniquePrinters.push(device);
      seenPrinterNames.add(device.deviceName);
    }
  });
  return uniquePrinters;
}
/**
 * Return the printers assigned to the kitchen department on
 * parameters
 * @param {Object}- { department_name, action_type, app_source, billing_type } as params
 * @returns {Array} printers array
 */
async function getPrinterbykitchendepartment(params) {
  const printer = [];
  try {
    const currentprintersList = window.printersList;
    if (
      // params.table_name &&
      currentprintersList &&
      Array.isArray(currentprintersList) &&
      currentprintersList.length
    ) {
      let defaultPrinter;
      let printerIndex;
      let defaultPrinterIndex;
      let defaultPrinters = [];
      const assignedPrinters = currentprintersList.filter((p, index) => {
        // Find the Printersby action type
        // and further filter based on table name
        const moreInfo = safeParse(p.more_info || {});
        let found = 0;
        if (
          p.title === params.department_name &&
          p.action_type === params.action_type &&
          [PRINTER_ACTION_TYPES.KD_KOT_PRINTER].includes(params.action_type) &&
          [moreInfo.app_source].includes(params.app_source) &&
          [moreInfo.billing_type].includes(params.billing_type)
        ) {
          found += 1;
          // printerIndex = index + 1;
          // defaultPrinterIndex = index + 1;
          defaultPrinter = p;
          defaultPrinterIndex = index + 1;
          Object.assign(defaultPrinter, {
            printerIndex: defaultPrinterIndex,
          });
          defaultPrinters.push(defaultPrinter);
        }

        if (
          p.title === params.department_name &&
          p.action_type === params.action_type &&
          [PRINTER_ACTION_TYPES.KD_KOT_PRINTER].includes(params.action_type) &&
          ['all'].includes(moreInfo.app_source) &&
          [params.billing_type].includes(moreInfo.billing_type)
        ) {
          defaultPrinter = p;
          defaultPrinterIndex = index + 1;
          Object.assign(defaultPrinter, {
            printerIndex: defaultPrinterIndex,
          });
          defaultPrinters.push(defaultPrinter);
        }

        if (
          p.title === params.department_name &&
          p.action_type === params.action_type &&
          [PRINTER_ACTION_TYPES.KD_KOT_PRINTER].includes(params.action_type) &&
          [params.app_source].includes(moreInfo.app_source) &&
          ['all'].includes(moreInfo.billing_type)
        ) {
          defaultPrinter = p;
          defaultPrinterIndex = index + 1;
          Object.assign(defaultPrinter, {
            printerIndex: defaultPrinterIndex,
          });
          defaultPrinters.push(defaultPrinter);
        }
        if (
          p.title === params.department_name &&
          p.action_type === params.action_type &&
          [PRINTER_ACTION_TYPES.KD_KOT_PRINTER].includes(params.action_type) &&
          ['all'].includes(moreInfo.app_source) &&
          [params.billing_type].includes(moreInfo.billing_type)
          // ['all'].includes(moreInfo.billing_type)
        ) {
          defaultPrinter = p;
          defaultPrinterIndex = index + 1;
          Object.assign(defaultPrinter, {
            printerIndex: defaultPrinterIndex,
          });
          defaultPrinters.push(defaultPrinter);
        }

        if (
          p.title === params.department_name &&
          p.action_type === params.action_type &&
          [PRINTER_ACTION_TYPES.KD_KOT_PRINTER].includes(params.action_type) &&
          ['all'].includes(moreInfo.app_source) &&
          ['all'].includes(moreInfo.billing_type)
        ) {
          defaultPrinter = p;
          defaultPrinterIndex = index + 1;
          Object.assign(defaultPrinter, {
            printerIndex: defaultPrinterIndex,
          });
          defaultPrinters.push(defaultPrinter);
        }
        return found > 0;
      });

      if (assignedPrinters) {
        // Filter the items by table name
        // if (
        //   defaultPrinter &&
        //   assignedPrinters &&
        //   assignedPrinters.length === 0
        // ) {
        //   assignedPrinters.push(defaultPrinter);
        //   printerIndex = defaultPrinter.printerIndex;
        // }
        assignedPrinters.push(...defaultPrinters);
        assignedPrinters.forEach((a) => {
          printer.push({
            deviceName: a.device_name,
            silent: true,
            copies: a.no_of_prints,
            size: a.printer_size,
            printerIndex: a.printerIndex,
          });
        });
      }
    }
  } catch (error) {
    console.error();
  }
  // return printer;
  const uniquePrinters = [];
  const seenPrinterNames = new Set();
  printer.forEach((device) => {
    if (!seenPrinterNames.has(device.deviceName)) {
      uniquePrinters.push(device);
      seenPrinterNames.add(device.deviceName);
    }
  });
  return uniquePrinters;
}

/**
 * Return the printers assigned to the category on
 * parameters
 * @param {Object}- { category names, action_type, app_source, billing_type } as params
 * @returns {Array} printers array
 */
function getPrinterbyCategory(params) {
  const printer = [];
  try {
    const currentprintersList = window.printersList;
    if (
      // params.table_name &&
      currentprintersList &&
      Array.isArray(currentprintersList) &&
      currentprintersList.length
    ) {
      let defaultPrinter;
      let printerIndex;
      let defaultPrinterIndex;
      const assignedPrinters = currentprintersList.filter((p, index) => {
        // Find the Printersby action type
        // and further filter based on table name
        const moreInfo = safeParse(p.more_info || {});
        let found = 0;
        if (
          // p.title.includes(params.category_name) &&
          p.action_type === params.action_type &&
          moreInfo?.category?.includes(params.category_name) &&
          [PRINTER_ACTION_TYPES.CATEGORYWISE_KOT_PRINTER].includes(
            params.action_type,
          ) &&
          [moreInfo.app_source].includes(params.app_source) &&
          [moreInfo.billing_type].includes(params.billing_type)
        ) {
          found += 1;
          printerIndex = index + 1;
          defaultPrinter = p;
          defaultPrinterIndex = index + 1;
          Object.assign(defaultPrinter, {
            printerIndex: defaultPrinterIndex,
          });
        }

        // if app souce is set and order type set to default then it is not working as expected. If we set source captain and pos then two prints are coming

        // if (
        //   // p.title.includes(params.category_name) &&
        //   p.action_type === params.action_type &&
        //   moreInfo?.category?.includes(params.category_name) &&
        //   [PRINTER_ACTION_TYPES.CATEGORYWISE_KOT_PRINTER].includes(
        //     params.action_type,
        //   ) &&
        //   ['all'].includes(moreInfo.billing_type)
        // ) {
        //   defaultPrinter = p;
        //   defaultPrinterIndex = index + 1;
        //   Object.assign(defaultPrinter, {
        //     printerIndex: defaultPrinterIndex,
        //   });
        // }

        if (
          // p.title.includes(params.category_name) &&
          p.action_type === params.action_type &&
          moreInfo?.category?.includes(params.category_name) &&
          [PRINTER_ACTION_TYPES.CATEGORYWISE_KOT_PRINTER].includes(
            params.action_type,
          ) &&
          [params.app_source].includes(moreInfo.app_source) &&
          ['all'].includes(moreInfo.billing_type)
        ) {
          defaultPrinter = p;
          defaultPrinterIndex = index + 1;
          Object.assign(defaultPrinter, {
            printerIndex: defaultPrinterIndex,
          });
        }

        if (
          // p.title.includes(params.category_name) &&
          p.action_type === params.action_type &&
          moreInfo?.category?.includes(params.category_name) &&
          [PRINTER_ACTION_TYPES.CATEGORYWISE_KOT_PRINTER].includes(
            params.action_type,
          ) &&
          ['all'].includes(moreInfo.app_source)
        ) {
          defaultPrinter = p;
          defaultPrinterIndex = index + 1;
          Object.assign(defaultPrinter, {
            printerIndex: defaultPrinterIndex,
          });
        }

        if (
          // p.title.includes(params.category_name) &&
          p.action_type === params.action_type &&
          moreInfo?.category?.includes(params.category_name) &&
          [PRINTER_ACTION_TYPES.CATEGORYWISE_KOT_PRINTER].includes(
            params.action_type,
          ) &&
          ['all'].includes(moreInfo.app_source) &&
          ['all'].includes(moreInfo.billing_type)
        ) {
          defaultPrinter = p;
          defaultPrinterIndex = index + 1;
          Object.assign(defaultPrinter, {
            printerIndex: defaultPrinterIndex,
          });
        }
        return found > 0;
      });

      if (assignedPrinters) {
        // Filter the items by table name
        if (
          defaultPrinter &&
          assignedPrinters &&
          assignedPrinters.length === 0
        ) {
          assignedPrinters.push(defaultPrinter);
          printerIndex = defaultPrinter.printerIndex;
        }
        assignedPrinters.forEach((a) => {
          printer.push({
            deviceName: a.device_name,
            silent: true,
            copies: a.no_of_prints,
            size: a.printer_size,
            printerIndex,
          });
        });
      }
    }
  } catch (error) {
    console.error();
  }
  return printer;
}
module.exports = {
  getPrinterbytable,
  getPrinterbykitchendepartment,
  getPrinterbyordertype,
  getPrinterbyCategory,
};
