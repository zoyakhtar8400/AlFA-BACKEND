/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
const { ORDER, PRINT, KDS, GLOBAL_EVENT } = require('../server/SocketEvents');
const {
  ORDER_IPC,
  FETCH_BILL_DATA_FOR_CSK,
  SEND_ORDER_TOTAL,
  UPDATE_TABLE_COLOR,
  RELOAD_APP,
  UPDATE_STOCK_QTY,
  PRINT_CSK_KOT,
  REFRESH_TABLES_EVENT,
  CLOSE_NOTIFICATION_VIEW,
  LOGOUT_USER,
  FETCH_BILL_DATA_FOR_CSK_ORDER_TOTAL,
  SET_STOREDETAILS,
  CUSTOMER_UPDATED,
  SET_BUSY_TABLE_DATA,
} = require('../util/IPC_Messages');

const stringConstructor = 'test'.constructor;
const TableUtils = require('../util/TableUtils');
const { pushNotification } = require('./NotificationController');
const {
  TAKEAWAY_FLAG_ID,
  HOMED_FLAG_ID,
  DINEIN_TAB_ID,
  PRINTER_ACTION_TYPES,
  QUICKBILL_BILLING_FLAG,
  DINEIN_BILLING_FLAG,
  TAKEAWAY_BILLING_FLAG,
  HOMED_BILLING_FLAG,
  TAKEAWAY_TAB_ID,
  DELIVERY_TAB_ID,
} = require('../util/Constants');
const {
  PRINT_ALL_IN_ONE_KOT,
  SHOW_STORENAME_ONKOT,
  SHOW_CUSTOMERON_KOT_CHECK,
  CUSTOMIZE_ORDER_NUMBER_NAME,
  UPDATE_FOOD_READY_STATUS_FROM_KDS,
  DISPLAY_WAITER_NAME_ON_TABLE,
} = require('../util/SettingIDs');
const {
  removetablefromwathersList,
  addtabletowatchList,
} = require('./Tableobserver');
const { Swal } = require('../util/Notification');
const {
  showSystemnotification,
} = require('../notifications/RendereNotification');
const { sleep } = require('../util/MiscUtil');
const { safeParse } = require('../util/RendererUtils');
const { setupSocketforrenderer } = require('../renderer/SocketClient');
const {
  makeUpdateTableColorRequest,
  makeChangeTableColorRequest,
} = require('../renderer/helper/Table.helper');
const {
  makeUpdateTransferItemKotNumberRequest,
  makeGetKotStatusByTableRequest,
  makeCheckActiveKotRequest,
} = require('../renderer/helper/Kot.helper');
const {
  getPrinterbykitchendepartment,
  getPrinterbytable,
  getPrinterbyCategory,
  getPrinterbyordertype,
} = require('./Printer/Helper');
const { ORDER_SOURCE_FOR_PRINT } = require('../constant');
const { mapItemstocategory } = require('./UIutils/ItemCategoryMapping');
const { OnlineBillingTypeByName } = require('../util/DBUtil');
const { apiCall } = require('../services/APIService');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const { OrderHubKOTTaskQueue } = require('../renderer/Queue/OrderHub.KOT');

let currentsocketInstance;
let getLivestatusdataevent;
let inheritedresettaHddata;
let inheritedresetdineinData;
let inheritedresetCurrentabledata;
let printAllInOneKot = false;
let showStoreNameOnKot = false;
window.isKOTPrintInprogessforcsk = false;
let updateFoodReadyStatusFromKds = false;
let showWaiterNameOnTable = true;

function clientrequestInitialize(params) {
  if (params.getLivestatusdata) {
    getLivestatusdataevent = params.getLivestatusdata;
  }
}

function orderListenersforsocketevents(params) {
  inheritedresettaHddata = params.resettaHddata;
  inheritedresetdineinData = params.resetdineinData;
  inheritedresetCurrentabledata = params.resetCurrentabledata;
}

function shownotificationtoPOS({ type, title, message }) {
  try {
    if (!Swal.isVisible()) {
      if (window.showCskAndTerminalNotifications) {
        window.notifyUser.showMessage(type, message);
      }
    } else {
      showSystemnotification({
        title: title || 'TMBill Atlantic POS',
        body: {
          msg: message,
        },
      });
    }

    pushNotification({
      title,
      data: message,
      date: window.moment(),
    });
  } catch (error) {
    console.error(`Error While Showing notification`);
  }
}

async function handleBillsavedorsettledevent(
  content,
  table_color,
  settled,
  table_state,
) {
  if (content && content.table_id) {
    const tableId = `table_${content.table_id}`;
    const table = $(`#${tableId}`);

    if (table && table.length > 0) {
      const tableDetails = table[0].data;
      const tableName = table[0].content;
      table.css({
        'background-color': table_color,
      });
      table[0].data.table_action_flag = table_state;
      if (content.order_state === 'fulfilled') {
        shownotificationtoPOS({
          type: 'success',
          title: tableName || 'TMBill Atlantic POS',
          message: `Bill settled for ${tableName}`,
        });
      } else {
        shownotificationtoPOS({
          type: 'success',
          title: tableName || 'TMBill Atlantic POS',
          message: `Bill saved for ${tableName}`,
        });
      }

      if (window.busyTableData[content.table_id]) {
        window.busyTableData[content.table_id] = {
          ...window.busyTableData[content.table_id],
          Bill_Number: content.order_id,
        };
      } else {
        window.busyTableData[content.table_id] = {
          Bill_Number: content.order_id,
        };
      }

      // If the table order type is TA/HD then remove that table
      if (settled && [1, 2, 5].includes(tableDetails.order_type_flag)) {
        $(`#table_${content.table_id}`).remove();
      }

      if (settled) {
        table[0].data.details.order_state = '';
        if (content.table_id) {
          window.busyTableData[content.table_id] = {};
        }
      }

      if (settled && window.showbillDetails) {
        try {
          $(`#table_${content.table_id}`)
            .find('#tablebillnumberlabel')
            .html('&nbsp');
          $(`#table_${content.table_id}`)
            .find('#tableamountlabel')
            .html('&nbsp');
          $(`#table_${content.table_id}`)
            .find('#tableorderstatusLabel')
            .html('&nbsp');
          $(`#table_${content.table_id}`)
            .find('#tablekotnosLabelid')
            .html('&nbsp');
          $(`#table_${content.table_id}`)
            .find('#tableCreatedByLabelid')
            .html('&nbsp');
          $(`#table_${content.table_id}`)
            .find('#tablekottimelabelId')
            .attr('title', '')
            .html('&nbsp');
          $(`#table_${content.table_id}`)
            .find('#tablecustomernameLabelid')
            .attr('title', '')
            .html('&nbsp');
          $(`#table_${content.table_id}`)
            .find('#tableOrdernoLabelid')
            .attr('title', '')
            .html('&nbsp');
          $(`#table_${content.table_id}`)
            .find('#tablewaiterLabelid')
            .attr('title', '')
            .html('&nbsp');

          removetablefromwathersList(`table_${content.table_id}`);

          // table dept is running then remove table from running orders
          const activeTableDept = $(
            '.activeTableDepartment .menuItemButtoncontentwrapper .department-title-container',
          ).attr('value');
          if (activeTableDept === 'Running Orders') {
            $(`#table_${content.table_id}`).hide();
          }
        } catch (error) {
          console.error(error);
        }
      }

      // clear table details if currenttable is same
      if (
        window.globalcurrenttableId &&
        window.globalcurrenttableId === tableId
      ) {
        if (settled) {
          switch (tableDetails.order_type_flag) {
            case TAKEAWAY_FLAG_ID:
            case HOMED_FLAG_ID:
              if (inheritedresettaHddata) inheritedresettaHddata();
              break;
            case DINEIN_TAB_ID:
              if (inheritedresetdineinData) inheritedresetdineinData();
              if (inheritedresetCurrentabledata)
                inheritedresetCurrentabledata();
              break;
            default:
              break;
          }

          $(table).click();
          const activeTab = $('.mainsectionTabs li a.active').attr('id');
          if (activeTab) {
            switch (activeTab) {
              case TAKEAWAY_TAB_ID:
                if (
                  tableDetails.order_type_flag === TAKEAWAY_FLAG_ID &&
                  window.globalcurrenttableId === tableId
                ) {
                  $('#takeawayneworderButtonid').click();
                }
                break;
              case DELIVERY_TAB_ID:
                if (
                  tableDetails.order_type_flag === HOMED_FLAG_ID &&
                  window.globalcurrenttableId === tableId
                ) {
                  $('#deliveryneworderButtonid').click();
                }
                break;
              default:
                break;
            }
          }
        }
        if (
          window.currentoldkotDetails &&
          window.currentoldkotDetails.table_id === content.table_id
        ) {
          $('#oldkotModal').modal('hide');
        }
      }
    }
  }
  window.refreshDashboard = true;
  window.refreshReceipt = true;
  window.refreshOrderSettlementWindow = true;
}

/**
 * Writes the details to the document to render
 * the data
 * @param {KOT Preview details} previewDetails
 */
async function renderkotView(previewDetails, printers) {
  try {
    const pageConfig = await window.setPageconfigifany_fromremote(
      previewDetails.tabId,
    );
    if (pageConfig && pageConfig.margins) {
      previewDetails.pageConfig = pageConfig;
      window.pageconfigProvided = true;
    } else {
      window.pageconfigProvided = false;
    }

    if (previewDetails.isQuickbillkot) {
      previewDetails.billingType = QUICKBILL_BILLING_FLAG;
      if (
        window.customKOTtitlesettings &&
        window.customKOTtitlesettings.quick
      ) {
        previewDetails.customKOTTitle = window.customKOTtitlesettings.quick;
      }

      if (
        window.tablestatusTagonkotsettings &&
        window.tablestatusTagonkotsettings.showNewordertag &&
        window.tablestatusTagonkotsettings.newOrdertaglabel
      ) {
        previewDetails.tablestatuskotprintTag =
          window.tablestatusTagonkotsettings.newOrdertaglabel;
      }
    }
    if (previewDetails) {
      console.log(
        `[ClientRequest] Message="Add KOT print job in queue" JobId="${previewDetails?.job_id}" kot_number="${previewDetails?.kot_number}" billing_type="${previewDetails?.billingType}" table_name="${previewDetails?.table_name}"`,
      );
    }

    await window.printKotfromqueue({ previewDetails, printers });

    // eslint-disable-next-line no-use-before-define
    sendKotprintedevent({
      table: previewDetails.tableName,
      message: $.i18n.t('controller:ClinetRequestHandler.KOTPrinted'),
    });
  } catch (error) {
    console.log(error);
  }
}

/**
 * Writes the details to the document to render
 * the data
 * @param {KOT Preview details} previewDetails
 */
async function renderkotViewforLabel(previewDetails) {
  previewDetails.isLabelprinter = true;
  if (window.kotpreviewscriptLoaded) {
    $('#kotpreviewBodyid').data('data', previewDetails);
    await window.showkotPreview();
  } else {
    $('#kotpreviewBodyid').data('data', previewDetails);
  }
  await window.sendPrintKOTfromremote(6); // label printer index
}

function filterByKitchenDept(data, kitchenDeptName) {
  // Filter by kitchen_dept_name first
  const filtered = data.filter(
    (entry) => entry.kitchen_dept_name === kitchenDeptName,
  );

  // Check if any entry has app_source === "captain"
  const captainEntries = filtered.filter(
    (entry) => entry.more_info?.app_source === 'captain',
  );

  // Return captain entries if found, otherwise return all filtered entries
  return captainEntries.length > 0 ? captainEntries : filtered;
}

/**
 * Called when the main process sends the
 * KOT print request it received from Captain
 * @param {KOT print details} content
 */
async function kotprintHandler(content) {
  window.isKOTPrintInprogessforcsk = true;
  if (window.settingsConfig[SHOW_CUSTOMERON_KOT_CHECK - 1]) {
    const { value } = window.settingsConfig[SHOW_CUSTOMERON_KOT_CHECK - 1];
    let showcustomeronKOTCheckfordinein = false;
    try {
      if (value) {
        const valuesList = String(value).split(',');
        showcustomeronKOTCheckfordinein = valuesList[0] === '1';
      }
    } catch (error) {
      console.error(error);
      window.isKOTPrintInprogessforcsk = false;
    }

    if (!showcustomeronKOTCheckfordinein) {
      delete content.customer;
    }
  }

  if (!String(content.billingType)) {
    Object.assign(content, { billingType: 1 });
  }

  if (window.settingsConfig[SHOW_STORENAME_ONKOT - 1]) {
    showStoreNameOnKot =
      window.settingsConfig[SHOW_STORENAME_ONKOT - 1].value === '1';
  }

  if (!showStoreNameOnKot) {
    content.showStorenamonkot = '';
  } else {
    content.showStorenamonkot = window.storeDetails?.store_name;
  }

  // if captains language is arabic and pos language is english then show kot type in english
  if (content.kot_type === 'تحويل' && window.selectedLanguage === 'en') {
    content.kot_type = 'Transferred';
  }

  if (content.kot_type === 'تم إلغاء' && window.selectedLanguage === 'en') {
    content.kot_type = 'Cancelled';
  }

  if (content.kot_type === 'قديم' && window.selectedLanguage === 'en') {
    content.kot_type = 'Old';
  }

  // add custom kot title if any
  if (
    window.customKOTtitlesettings &&
    content.actionType !== 3 &&
    !['تحويل', 'Transfer KOT'].includes(content.kot_type)
    // content.kot_type !== 'Transfer KOT'
  ) {
    switch (content.billingType) {
      case 1:
        if (content)
          content.customKOTTitle = `${content.kot_type ?? ''} ${window.customKOTtitlesettings.dinein ? window.customKOTtitlesettings.dinein : ''}`;
        break;

      case 2:
        if (content)
          content.customKOTTitle = `${content.kot_type ?? ''} ${window.customKOTtitlesettings.takeaway ? window.customKOTtitlesettings.takeaway : ''}`;
        break;

      case 3:
        if (content)
          content.customKOTTitle = `${content.kot_type ?? ''} ${window.customKOTtitlesettings.delivery ? window.customKOTtitlesettings.delivery : ''}`;
        break;
      default:
        content.customKOTTitle = content.kot_type;
        break;
    }
  }
  // get kot number if print is for transfer kot
  if (content.kot_type === 'Transfer KOT') {
    const transferItemKotNumber = await makeUpdateTransferItemKotNumberRequest({
      table_id: content.destinationtable,
    });
    if (transferItemKotNumber)
      Object.assign(content, {
        kot_number: transferItemKotNumber[0].kot_number,
      });
  }

  if (!content.items) {
    Object.assign(content, { items: content.Items });
  }
  const originalContent = { ...content };

  if (
    content.table_id &&
    window.tablestatusTagonkotsettings &&
    (window.tablestatusTagonkotsettings.showNewordertag ||
      window.tablestatusTagonkotsettings.showrunningOrdertag)
  ) {
    if (
      content.isNewKot &&
      window.tablestatusTagonkotsettings.showNewordertag &&
      window.tablestatusTagonkotsettings.newOrdertaglabel
    ) {
      content.tablestatuskotprintTag =
        window.tablestatusTagonkotsettings.newOrdertaglabel;
    }

    if (
      !content.isNewKot &&
      window.tablestatusTagonkotsettings.showrunningOrdertag &&
      window.tablestatusTagonkotsettings.runningOrdertaglabel
    ) {
      content.tablestatuskotprintTag =
        window.tablestatusTagonkotsettings.runningOrdertaglabel;
    }
  }

  if (content.customer_mobile) {
    const customer = window.customersList.find(
      (c) => Number(c.phone) === Number(content.customer_mobile),
    );
    if (customer) {
      if (content.billingType == 1 && window.showcustomeronKOTCheckfordinein) {
        content.customer = customer;
        originalContent.customer = customer;
      } else if (
        content.billingType == 2 &&
        window.showcustomeronKOTCheckforta
      ) {
        content.customer = customer;
        originalContent.customer = customer;
      } else if (
        content.billingType == 3 &&
        window.showcustomeronKOTCheckfordelivery
      ) {
        content.customer = customer;
        originalContent.customer = customer;
      }
      // content.customer = customer;
    }
  }
  if (window.settingsConfig[PRINT_ALL_IN_ONE_KOT - 1]) {
    printAllInOneKot =
      window.settingsConfig[PRINT_ALL_IN_ONE_KOT - 1].value === '1';
  }

  let isterminalAllInOneKot = false;
  if (content.isTerminalPrint && content.allInOneKot) {
    isterminalAllInOneKot = true;
  }

  // console.log('content:', content);
  // if all in one kot from terminal then skip kd wise
  try {
    if (
      (window.printkdwiseKot || window.printKDWiseAndTableWiseKOT) &&
      // !content.isTerminalPrint &&
      !isterminalAllInOneKot &&
      content.items &&
      content.items.length > 0
    ) {
      const filteredList = window.groupItemsbyDepsforremote(content.items);
      window.addKitchenprinterifnotadded_fromremote();
      // Now Print KOT by filtering the above filtered
      // list of departments along with their items
      // eslint-disable-next-line no-restricted-syntax
      if (window.printkdwiseKottosamePrinteriffound) {
        const groupResult = window.groupDepartmentsbyprinterFromRemote(
          window.kitchenDepartments,
          content.items,
          'captain',
        );
        // eslint-disable-next-line no-restricted-syntax
        let getPrinters;
        for (const element of groupResult) {
          // await sleep(1200);
          content.items = element.items;
          Object.assign(content, {
            job_id: window.generateId(10),
          });
          console.log(
            `[ClientRequest]Message="Printing Kitchen Dept KOT if same printers found"  JobId="${content?.job_id}"`,
          );
          // await renderkotView(content);
          // await window.sendPrintKOTfromremote(element.printer || 1);
          const getPrinter = window.printersList[element.printer];

          const printer = {
            deviceName: getPrinter.device_name,
            silent: true,
            copies: getPrinter.no_of_prints,
            size: getPrinter.printer_size,
            printerIndex: element.printer + 1,
          };
          getPrinters = [printer];
          if (getPrinters && getPrinters.length) {
            await renderkotView({ ...content }, getPrinters);
          }
        }
      } else {
        // window.kitchenDepartments.forEach(async (element) => {
        for (let i = 0; i < window.kitchenDepartments.length; i++) {
          const element = window.kitchenDepartments[i];
          const groupFilter = window._.find(filteredList, [
            'kitchen_dept',
            element.id,
          ]);
          if (groupFilter) {
            // await sleep(1200);
            content.items = groupFilter.items;
            Object.assign(content, {
              job_id: window.generateId(10),
            });
            // const kitchen_dept = window.kitchenDepartments.filter(
            //   (dept) => dept.id === element.id,
            // );

            if (window.kitchenDepartmentsidsmap[element.id]) {
              if (!content.isTerminalPrint && !content.allInOneKot) {
                content.kitchenDepartment =
                  window.kitchenDepartmentsidsmap[element.id];
              }
            }

            console.log(
              `[ClientRequest] Message="Printing Kitchen Dept KOT" KitchenDept="${content?.kitchenDepartment}" JobId="${content?.job_id}"`,
            );

            if (content.items && content.items.length) {
              let getPrinters = [];
              if (content.isTerminalPrint) {
                getPrinters = await getPrinterbykitchendepartment({
                  action_type: PRINTER_ACTION_TYPES.KD_KOT_PRINTER,
                  app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
                  billing_type: String(content.billingType),
                  department_name: window.kitchenDepartmentsidsmap[element.id],
                });
              } else {
                getPrinters = await getPrinterbykitchendepartment({
                  action_type: PRINTER_ACTION_TYPES.KD_KOT_PRINTER,
                  app_source: ORDER_SOURCE_FOR_PRINT.CAPTAIN,
                  billing_type: String(content.billingType),
                  department_name: window.kitchenDepartmentsidsmap[element.id],
                });
              }
              if (getPrinters && getPrinters.length) {
                await renderkotView({ ...content }, getPrinters);
              }
            }

            // Check if label printer is on
            if ([1, 2].includes(window.printtoLabelprinter)) {
              // eslint-disable-next-line no-undef
              await renderkotViewforLabel(previewDetails);
            }
          }
        }
      }

      if (printAllInOneKot && !content.isTerminalPrint) {
        // await sleep(1300);
        Object.assign(originalContent, {
          job_id: window.generateId(10),
        });
        console.log(
          `[ClientRequest]Message="Printing Kitchen Dept all in one KOT"  JobId="${originalContent?.job_id}"`,
        );
        let getPrinters = [];
        if (content.isTerminalPrint && !content.doNotPrintAllInOneKot) {
          getPrinters = await getPrinterbyordertype({
            action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
            app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
            billing_type: String(content.billingType),
          });
          if (getPrinters && getPrinters.length) {
            await renderkotView(originalContent, getPrinters);
          }
        } else {
          getPrinters = await getPrinterbyordertype({
            action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
            app_source: ORDER_SOURCE_FOR_PRINT.CAPTAIN,
            billing_type: String(content.billingType),
          });
          if (getPrinters && getPrinters.length) {
            await renderkotView(originalContent, getPrinters);
          }
        }
        // await window.sendPrintKOTfromremote(1);
      }

      if (window.printKDWiseAndTableWiseKOT && content.billingType == 1) {
        // await sleep(1200);
        let { table_id } = content;
        const table_name = content.tableName || content.table_name;
        // for splitted table get parent table id
        if (table_name.includes(':')) {
          const table = window.allTableslist?.find(
            (t) => t.id === content.table_id,
          );

          if (table && table.parent) {
            table_id = table.parent;
          }
        }

        if (table_name && !table_id) {
          const table = window.allTableslist?.find(
            (t) => t.table_name === table_name,
          );

          if (table && table.parent) {
            table_id = table.parent;
          } else {
            table_id = table.id;
          }
        }

        Object.assign(content, {
          job_id: window.generateId(10),
        });
        console.log(
          `[ClientRequest]Message="Printing Kitchen Dept KOT And Table Wise KOT" TableName="${content?.tableName || content.table_name}" JobId="${content?.job_id}"`,
        );
        if (content.isTerminalPrint) {
          const getPrinters = getPrinterbytable({
            action_type: PRINTER_ACTION_TYPES.TABLEWISE_KOT_PRINTER,
            app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
            table_name: content.tableName || content.table_name,
            table_id,
          });
          // await window.sendPrintKOTfromremote(getPrinters[0]?.printerIndex);
          await renderkotView(originalContent, getPrinters);
        } else {
          const getPrinters = getPrinterbytable({
            action_type: PRINTER_ACTION_TYPES.TABLEWISE_KOT_PRINTER,
            app_source: ORDER_SOURCE_FOR_PRINT.CAPTAIN,
            table_name: content.tableName || content.table_name,
            table_id,
          });
          // await window.sendPrintKOTfromremote(getPrinters[0]?.printerIndex);
          if (getPrinters && getPrinters.length) {
            await renderkotView(originalContent, getPrinters);
          }
        }
      }
    } else if (window.printCategorywiseKot && !isterminalAllInOneKot) {
      if (content.isTerminalPrint) {
        const filteredList = mapItemstocategory(content.items);
        // Now Print KOT by filtering the above filtered
        // list of departments along with their items
        for (const [key, value] of Object.entries(filteredList)) {
          if (value) {
            content.items = value;
            // await renderkotView(content);
            Object.assign(content, {
              job_id: window.generateId(10),
            });

            console.log(
              `[ClientRequest]Message="Printing CategoryWiseKOT KOT" CategoryName="${key}" JobId="${content?.job_id}"`,
            );

            const getPrinters = getPrinterbyCategory({
              action_type: PRINTER_ACTION_TYPES.CATEGORYWISE_KOT_PRINTER,
              app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
              billing_type: String(content.billingType),
              category_name: key,
            });
            if (getPrinters && getPrinters.length) {
              await renderkotView(content, getPrinters);
            }
          }
        }
      } else {
        const filteredList = mapItemstocategory(content.items);
        // Now Print KOT by filtering the above filtered
        // list of departments along with their items
        for (const [key, value] of Object.entries(filteredList)) {
          if (value) {
            content.items = value;
            Object.assign(content, {
              job_id: window.generateId(10),
            });
            console.log(
              `[ClientRequest]Message="Printing CategoryWiseKOT" CategoryName="${key}" JobId="${content?.job_id}"`,
            );
            // await renderkotView(content);

            const getPrinters = getPrinterbyCategory({
              action_type: PRINTER_ACTION_TYPES.CATEGORYWISE_KOT_PRINTER,
              app_source: ORDER_SOURCE_FOR_PRINT.CAPTAIN,
              billing_type: String(content.billingType),
              category_name: key,
            });

            console.log('else terminal print::', getPrinters);
            // await window.sendPrintKOTfromremote(getPrinters[0]?.printerIndex);
            if (getPrinters && getPrinters.length) {
              await renderkotView(content, getPrinters);
            }
          }
        }
      }
      if (printAllInOneKot && !content.isTerminalPrint) {
        Object.assign(originalContent, {
          job_id: window.generateId(10),
        });
        console.log(
          `[ClientRequest]Message="Printing CategoryWise all in one KOT"  JobId="${originalContent?.job_id}"`,
        );
        if (content.isTerminalPrint && !content.doNotPrintAllInOneKot) {
          const getPrinters = await getPrinterbyordertype({
            action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
            app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
            billing_type: String(content.billingType),
          });
          // await window.sendPrintKOTfromremote(getPrinters[0]?.printerIndex);
          if (getPrinters && getPrinters.length) {
            await renderkotView(originalContent, getPrinters);
          }
        } else {
          const getPrinters = await getPrinterbyordertype({
            action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
            app_source: ORDER_SOURCE_FOR_PRINT.CAPTAIN,
            billing_type: String(content.billingType),
          });
          // await window.sendPrintKOTfromremote(getPrinters[0]?.printerIndex);
          Object.assign(originalContent, {
            job_id: window.generateId(10),
          });
          if (getPrinters && getPrinters.length) {
            await renderkotView(originalContent, getPrinters);
          }
        }
      }
    } else if (window.printTablewiseKot && content.billingType == 1) {
      let { table_id } = content;
      const table_name = content.tableName || content.table_name;
      // for splitted table get parent table id
      if (table_name.includes(':')) {
        const table = window.allTableslist?.find(
          (t) => t.id === content.table_id,
        );

        if (table && table.parent) {
          table_id = table.parent;
        }
      }

      if (table_name && !table_id) {
        const table = window.allTableslist?.find(
          (t) => t.table_name === table_name,
        );

        if (table && table.parent) {
          table_id = table.parent;
        } else {
          table_id = table.id;
        }
      }

      Object.assign(content, {
        job_id: window.generateId(10),
      });
      console.log(
        `[ClientRequest]Message="Printing TableWise KOT"  JobId="${content?.job_id}"`,
      );
      // await renderkotView(content);
      if (content.isTerminalPrint) {
        const getPrinters = getPrinterbytable({
          action_type: PRINTER_ACTION_TYPES.TABLEWISE_KOT_PRINTER,
          app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
          table_name: content.tableName || content.table_name,
          table_id: Number(table_id),
        });
        // await window.sendPrintKOTfromremote(getPrinters[0]?.printerIndex);

        if (getPrinters && getPrinters.length) {
          await renderkotView(content, getPrinters);
        }
      } else {
        const getPrinters = getPrinterbytable({
          action_type: PRINTER_ACTION_TYPES.TABLEWISE_KOT_PRINTER,
          app_source: ORDER_SOURCE_FOR_PRINT.CAPTAIN,
          table_name: content.tableName || content.table_name,
          table_id: Number(table_id),
        });
        // await window.sendPrintKOTfromremote(getPrinters[0]?.printerIndex);
        if (getPrinters && getPrinters.length) {
          await renderkotView(content, getPrinters);
        }
      }
    } else {
      Object.assign(content, {
        job_id: window.generateId(10),
      });
      console.log(
        `[ClientRequest]Message="Printing  KOT"  JobId="${content?.job_id}"`,
      );
      if (content.isTerminalPrint) {
        const getPrinters = await getPrinterbyordertype({
          action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
          app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
          billing_type: String(content.billingType),
        });
        // await window.sendPrintKOTfromremote(getPrinters[0]?.printerIndex);
        if (getPrinters && getPrinters.length) {
          await renderkotView(content, getPrinters);
        }
      } else {
        const getPrinters = await getPrinterbyordertype({
          action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
          app_source: ORDER_SOURCE_FOR_PRINT.CAPTAIN,
          billing_type: String(content.billingType),
        });
        // await window.sendPrintKOTfromremote(getPrinters[0]?.printerIndex);
        if (getPrinters && getPrinters.length) {
          await renderkotView(content, getPrinters);
        }
      }
      // Check if label printer is on
      if ([1, 2].includes(window.printtoLabelprinter)) {
        // eslint-disable-next-line no-undef
        await renderkotViewforLabel(content);
      }
    }
    window.isKOTPrintInprogessforcsk = false;
  } catch (error) {
    window.isKOTPrintInprogessforcsk = false;
    console.error(error);
  } finally {
    window.isKOTPrintInprogessforcsk = false;
  }

  return true;
}

async function billprintHandler(previewDetails) {
  try {
    const pageConfig = await window.setPageconfigifany_fromremote(
      previewDetails.currenttabId,
    );
    if (pageConfig && pageConfig.margins) {
      previewDetails.pageConfig = pageConfig;
      window.pageconfigProvided = true;
    } else {
      window.pageconfigProvided = false;
    }
    let customOrderNumberName = '';
    if (window.settingsConfig[CUSTOMIZE_ORDER_NUMBER_NAME - 1]) {
      customOrderNumberName =
        window.settingsConfig[CUSTOMIZE_ORDER_NUMBER_NAME - 1].value;
    }
    if (customOrderNumberName) {
      Object.assign(previewDetails, { customOrderNumberName });
    }
    if (!previewDetails.order_type_flag) {
      Object.assign(previewDetails, {
        order_type_flag: previewDetails.tableName,
      });
    }
    let custombilltitle;
    let customKotTitle;
    if (String(previewDetails.billType)) {
      switch (previewDetails.billType) {
        case QUICKBILL_BILLING_FLAG:
          if (
            window.customKOTtitlesettings &&
            window.customKOTtitlesettings.quick
          ) {
            customKotTitle = window.customKOTtitlesettings.quick;
          }
          break;
        case DINEIN_BILLING_FLAG:
          if (
            window.customBilltitlesettings &&
            window.customBilltitlesettings.dinein
          ) {
            custombilltitle = window.customBilltitlesettings.dinein;
          }
          if (
            window.customKOTtitlesettings &&
            window.customKOTtitlesettings.delivery
          ) {
            customKotTitle = window.customKOTtitlesettings.dinein;
          }
          previewDetails.order_type_flag = 'Dine In';
          break;
        case TAKEAWAY_BILLING_FLAG:
          if (
            window.customBilltitlesettings &&
            window.customBilltitlesettings.takeaway
          ) {
            custombilltitle = window.customBilltitlesettings.takeaway;
          }
          if (
            window.customKOTtitlesettings &&
            window.customKOTtitlesettings.takeaway
          ) {
            customKotTitle = window.customKOTtitlesettings.takeaway;
          }
          previewDetails.order_type_flag = 'PickUp';

          break;
        case HOMED_BILLING_FLAG:
          if (
            window.customBilltitlesettings &&
            window.customBilltitlesettings.delivery
          ) {
            custombilltitle = window.customBilltitlesettings.delivery;
          }
          if (
            window.customKOTtitlesettings &&
            window.customKOTtitlesettings.delivery
          ) {
            customKotTitle = window.customKOTtitlesettings.delivery;
          }
          previewDetails.order_type_flag = 'Delivery';

          break;
        default:
          break;
      }
      previewDetails.customKotTitle = customKotTitle;
      previewDetails.custombilltitle = custombilltitle;
    }
    const currentTableButton = $(`#table_${previewDetails.table_id}`);

    const currenttableButton = currentTableButton[0];
    let getPrinters;
    if (window.printtablewiseBills && currentTableButton) {
      let tablePrinter;
      if (currentTableButton) {
        if (previewDetails.printFromCsk) {
          getPrinters = getPrinterbytable({
            action_type: PRINTER_ACTION_TYPES.TABLEWISE_BILL_PRINTER,
            app_source: ORDER_SOURCE_FOR_PRINT.CAPTAIN,
            billing_type: String(previewDetails.billType),
            table_name: currentTableButton[0].content,
            table_id:
              currentTableButton[0].data.parent ||
              currentTableButton[0].data.id,
          });
          tablePrinter = getPrinters[0];
        } else {
          getPrinters = getPrinterbytable({
            action_type: PRINTER_ACTION_TYPES.TABLEWISE_BILL_PRINTER,
            app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
            billing_type: String(previewDetails.billType),
            table_name: currentTableButton[0].content,
            table_id:
              currentTableButton[9].data.parent ||
              currentTableButton[0].data.id,
          });
          tablePrinter = getPrinters[0];
        }
      } else if (previewDetails.printFromCsk) {
        getPrinters = getPrinterbytable({
          action_type: PRINTER_ACTION_TYPES.TABLEWISE_BILL_PRINTER,
          app_source: ORDER_SOURCE_FOR_PRINT.CAPTAIN,
          billing_type: String(previewDetails.billType),
          table_name: currenttableButton.content,
          table_id:
            currenttableButton.data.parent || currenttableButton.data.id,
        });
        tablePrinter = getPrinters[0];
      } else {
        getPrinters = getPrinterbytable({
          action_type: PRINTER_ACTION_TYPES.TABLEWISE_BILL_PRINTER,
          app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
          billing_type: String(previewDetails.billType),
          table_name: currenttableButton.content,
          table_id:
            currenttableButton.data.parent || currenttableButton.data.id,
        });
        tablePrinter = getPrinters[0];
      }
      // for takeaway and delivery check order type wise printer
      if (!tablePrinter && [2, 3].includes(previewDetails.billType)) {
        getPrinters = await getPrinterbyordertype({
          action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
          app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
          billing_type: String(previewDetails.billType),
        });
      }

      // let tablePrinter = window.printersList.filter(o => o.title == currenttableButton.content && o.action_type == PRINTER_ACTION_TYPES.TABLEWISE_PRINTER);
      // return;
    } else if (previewDetails.printFromCsk) {
      getPrinters = await getPrinterbyordertype({
        action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
        app_source: ORDER_SOURCE_FOR_PRINT.CAPTAIN,
        billing_type: String(previewDetails.billType),
      });
    } else {
      getPrinters = await getPrinterbyordertype({
        action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
        app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
        billing_type: String(previewDetails.billType),
      });
    }
    Object.assign(previewDetails, {
      job_id: window.generateId(10),
    });
    console.log(
      `[ClientRequest] Message="Add Bill print job in queue" JobId="${previewDetails?.job_id}"`,
    );
    if (!previewDetails.doNotPrintBill) {
      await window.printBillfromqueue({
        previewDetails,
        printerId: previewDetails.currenttabId,
        currentTableButton,
        // quickBillPrintContent: '',
        billing_type: previewDetails.billType,
        printFromCsk: previewDetails.printFromCsk,
        sendImageToCSK: previewDetails.sendImageToCSK,
        printBillOnBothSide: previewDetails.printBillOnBothSide,
        socketUserId: previewDetails.socketUserId,
        cskPrintEvent: previewDetails.cskPrintEvent,
        printWidth: previewDetails.printWidth,
        printers: getPrinters,
      });
    }

    let isdraftBill = true;
    if (
      previewDetails.cskPrintEvent &&
      previewDetails.cskPrintEvent === 'BILL_PREVIEW'
    ) {
      isdraftBill = false;
    }
    if (previewDetails.isdraftBill && isdraftBill) {
      const updateColordetails = {
        table_id: previewDetails.table_id,
        table_color: TableUtils.Colors.DRAFT_BILL_PRINTED,
        table_action_flag: TableUtils.State.DRAFT_BILL_PRINTED,
      };
      makeUpdateTableColorRequest(updateColordetails);
      sendUpdateTableColorevent(updateColordetails);

      const table = $(`#table_${previewDetails.table_id}`);
      table.css({
        'background-color': TableUtils.Colors.DRAFT_BILL_PRINTED,
      });
      if (table && table.length) {
        table[0].data.table_action_flag = TableUtils.State.DRAFT_BILL_PRINTED;
      }
    }

    if (previewDetails && previewDetails.table_id) {
      const tableId = `table_${previewDetails.table_id}`;
      const table = $(`#${tableId}`);
      if (table && table.length > 0) {
        if (
          window.globalcurrenttableId &&
          window.globalcurrenttableId === tableId
        ) {
          $(table).click();
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}

async function quickBillPrintHandler(previewDetails) {
  try {
    const getPrinters = await getPrinterbyordertype({
      action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
      app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
      billing_type: String(previewDetails.billing_type),
    });
    window.sendBillprintfromremote({
      printerId: previewDetails.currenttabId,
      // currentTableButton:'',
      quickBillPrintContent: previewDetails.printContent,
      billing_type: previewDetails.billing_type,
      printers: getPrinters,
    });
  } catch (error) {
    console.error('Message="Quick bill print error"', error);
  }
}

async function messageReceived(params) {
  if (params.message) {
    shownotificationtoPOS({
      type: 'success',
      title: `Message From ${params.user_name ? params.user_name : ''}`,
      message: params.message,
    });

    bs4Toast.show(
      `Message From ${params.user_name ? params.user_name : ''}`,
      params.message,
      {},
      {
        buttons: [
          {
            text: 'Close',
            class:
              'btn viweMessgaeFromCskNotification viweNotification checkLaterButton',
            callback: (id) => {
              $(`#${id}`).hide();
            },
          },
        ],
      },
    );
  }
}

async function sendBillsavedevent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(ORDER.BILL_SAVED, JSON.stringify(params));
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(ORDER.BILL_SAVED, JSON.stringify(params));
  }
}

async function sendCloseNotificationevent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(CLOSE_NOTIFICATION_VIEW, JSON.stringify(params));
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(
      ORDER.CLOSE_NOTIFICATION_VIEW,
      JSON.stringify(params),
    );
  }
}

async function sendStockUpdatedevent(incrementQtyItems) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send('call-update-stock-event', {
      incrementQtyItems,
    });
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(GLOBAL_EVENT.UPDATE_STOCK, {
      incrementQtyItems,
    });
  }
}

async function sendDraftBillPrintedevent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(ORDER.DRAFT_BILL_PRINTED, JSON.stringify(params));
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(
      ORDER.DRAFT_BILL_PRINTED,
      JSON.stringify(params),
    );
  }
}

async function sendUpdateTableColorevent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(ORDER.UPDATE_TABLE_COLOR, JSON.stringify(params));
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(
      ORDER.UPDATE_TABLE_COLOR,
      JSON.stringify(params),
    );
  }
}

async function sendBillPrintRequestToMaster(params) {
  if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(PRINT.BILL, JSON.stringify(params));
  }
}

async function sendsettledBillPrintRequestToMaster(params) {
  if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(
      PRINT.PRINT_SETTELED_BILL,
      JSON.stringify(params),
    );
  }
}

async function sendKOTPrintRequestToMaster(params) {
  if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(PRINT.KOT, JSON.stringify(params));
  }
}

async function sendKotsavedevent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(ORDER.KOT_SAVED, JSON.stringify(params));
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(ORDER.KOT_SAVED, JSON.stringify(params));
  }
}

async function sendKotprintedevent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(PRINT.KOT_PRINTED, JSON.stringify(params));
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(PRINT.KOT_PRINTED, JSON.stringify(params));
  }
}
async function sendBillsettledevent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(ORDER.BILL_SETTLED, JSON.stringify(params));
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(ORDER.BILL_SETTLED, JSON.stringify(params));
  }
}

async function sendKotupdateddevent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(ORDER.KOT_UPDATED, JSON.stringify(params));
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(ORDER.KOT_UPDATED, JSON.stringify(params));
  }
}

async function sendItemTransferredevent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(ORDER.KOTITEM_TRANSFERRED, JSON.stringify(params));
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(
      ORDER.KOTITEM_TRANSFERRED,
      JSON.stringify(params),
    );
  }
}

async function sendkotitemStatuschanged(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(KDS.ITEM_STATUS_CHANGED, params);
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(KDS.ITEM_STATUS_CHANGED, params);
  }
}

async function sendChargesUpdatedevent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(ORDER.CHARGES_UPDATED, params);
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(ORDER.CHARGES_UPDATED, params);
  }
}

async function sendTableClickEvent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(ORDER.TABLE_CLICKED, params);
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(ORDER.TABLE_CLICKED, params);
  }
}

async function sendUpdateTableDetailsEvent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(ORDER.UPDATE_TABLE_DETAILS, params);
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(ORDER.UPDATE_TABLE_DETAILS, params);
  }
}

async function sendOrderUpdatedFromOrderSettlementWindowEvent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(ORDER.ORDER_UPDATED_FROM_SETTLMENT_WINDOW, params);
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(
      ORDER.ORDER_UPDATED_FROM_SETTLMENT_WINDOW,
      params,
    );
  }
}

async function sendLogoutUserEvent(data) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(LOGOUT_USER, data);
  }
}

async function sendQuickBillPlacedEvent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(ORDER.QUICK_BILL_PLACED, params);
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(ORDER.QUICK_BILL_PLACED, params);
  }
}

async function sendTableSplittedevent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(ORDER.TABLE_SPLITTED, JSON.stringify(params));
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(ORDER.TABLE_SPLITTED, JSON.stringify(params));
  }
}

async function sendTableMergedevent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(ORDER.TABLE_MERGED, JSON.stringify(params));
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(ORDER.TABLE_MERGED, JSON.stringify(params));
  }
}

async function sendTableChangedevent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(ORDER.TABLE_CHANGED, JSON.stringify(params));
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(ORDER.TABLE_CHANGED, JSON.stringify(params));
  }
}

async function sendNotificationEvent(params) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(GLOBAL_EVENT.SEND_NOTIFICATION, params);
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    // currentsocketInstance.emit(GLOBAL_EVENT.SEND_NOTIFICATION, params);
  }
}

async function sendTableRefreshevent() {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(REFRESH_TABLES_EVENT, {
      store_id: window.storeDetails.store_id,
    });
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(ORDER.REFRESH_TABLES, {
      store_id: window.storeDetails.store_id,
    });
  }
}

async function sendCustomerUpdatedEvent(customerData) {
  if (window.__IS_MASTER_POS__) {
    window.ipcRenderer.send(GLOBAL_EVENT.CUSTOMER_UPDATED, customerData);
  } else if (currentsocketInstance && currentsocketInstance.connected) {
    currentsocketInstance.emit(GLOBAL_EVENT.CUSTOMER_UPDATED, customerData);
  }
}

async function sendSettleBillEvent(params) {
  if (
    !window.__IS_MASTER_POS__ &&
    currentsocketInstance &&
    currentsocketInstance.connected
  ) {
    currentsocketInstance.emit(ORDER.BACKGROUND_BILL_SETTLEMENT, params);
  }
}

async function kotplacedfromRemote(params) {
  if (params && params.table_id) {
    const table = $(`#table_${params.table_id}`);
    if (table && table.length > 0) {
      const tableName = table[0].content;
      table.css({
        'background-color': TableUtils.Colors.KOT_SAVED,
      });

      table[0].data.table_action_flag = TableUtils.State.KOT_SAVED;

      shownotificationtoPOS({
        type: 'success',
        title: `KOT Placed`,
        message: `${$.i18n.t(
          'controller:ClinetRequestHandler.KOTPlacedFor',
        )} ${tableName}`,
      });
    }

    let KOT_Number = params?.insertedKOTid;
    if (
      window.busyTableData[params.table_id] &&
      window.busyTableData[params.table_id].kot_number
    ) {
      KOT_Number = `${window.busyTableData[params.table_id].kot_number}, ${params?.insertedKOTid} `;
    }
    const tabledetails = {
      KOT_Number,
    };

    window.busyTableData[params.table_id] = tabledetails;
  }
  if (params.createTable && params.tableDetails) {
    let { tableDetails } = params;
    tableDetails = safeParse(tableDetails);
    window.allTableslist.push(tableDetails);

    if (tableDetails && tableDetails.tableName) {
      Object.assign(tableDetails, { table_name: tableDetails.tableName });
    }
    if (tableDetails && tableDetails.table_name) {
      window.addtabletoViewfromremote(tableDetails);
      const message = `${$.i18n.t(
        'controller:ClinetRequestHandler.KOTPlacedFor',
      )} ${tableDetails.table_name}`;

      shownotificationtoPOS({
        type: 'success',
        title: tableDetails.table_name || 'TMBill Atlantic POS',
        message,
      });
    }
  }
}

// update table color
async function initUpdateTableColor(data) {
  try {
    await makeUpdateTableColorRequest(data);
    const content = safeParse(data);
    if (content.tableReservation) {
      const table = $(`#table_${content.table_id}`);
      if (table && table.length > 0) {
        table.css({
          'background-color': content.table_color,
        });

        $(`#table_${content.table_id}`)
          .find('#tablecustomernameLabelid')
          .html(content.customer_name);
      }
    }
  } catch (error) {
    console.error(`Message="Error while updating table color" `, error);
  }
}

async function handleTablecolorupdate(data) {
  try {
    initUpdateTableColor(data);
    $(`#table_${data.table_id}`).css('background', data.table_color);
    const table = $(`#table_${data.table_id}`);
    if (
      table &&
      table.length &&
      data.table_action_flag === TableUtils.State.DRAFT_BILL_PRINTED
    ) {
      table[0].data.table_action_flag = TableUtils.State.DRAFT_BILL_PRINTED;
    }
  } catch (error) {
    console.error(error);
  }
}

function handleBillsaved(content) {
  try {
    if (content.constructor === stringConstructor) {
      content = safeParse(content);
    }
    if (content?.isBillPrinted) {
      handleBillsavedorsettledevent(
        content,
        TableUtils.Colors.BILL_PRINTED,
        false,
        TableUtils.State.BILL_PRINTED,
      );
    } else {
      handleBillsavedorsettledevent(
        content,
        TableUtils.Colors.BILL_SAVED,
        false,
        TableUtils.State.BILL_SAVED,
      );
    }
    if ($('#orderSettlemetWindowParentDivID').is(':visible')) {
      window.fetchBillsFromRemote();
    }
  } catch (error) {
    console.error(error);
  }
}

async function handleSavenprintBill(content) {
  try {
    if (content.constructor === stringConstructor) {
      content = safeParse(content);
    }

    // becuase of quque in save bill
    // if we try to settle bill direct after save kot then its giving error save bill first
    if (content.settleBill) {
      await sleep(500);
    }
    window.ipcRenderer.send(
      FETCH_BILL_DATA_FOR_CSK,
      JSON.stringify({
        table_id: content.table_id,
        isRequestFromCsk: true,
        printBill: content.print || content.printBill,
        settleBill: content.settleBill,
        payment_mode: content.payment_mode,
        cust_paid_amount: content.cust_paid_amount,
        return_amount: content.return_amount,
        printBillOnBothSide: content.printBillOnBothSide,
        sendImageToCSK: content.sendImageToCSK,
        socketUserId: content.socketUserId,
        cskPrintEvent: content.cskPrintEvent,
        printWidth: content.printWidth,
        username: content.username,
      }),
    );
  } catch (error) {
    console.error(error);
  }
}

function handleBillsettled(content) {
  try {
    if (content.constructor === stringConstructor) {
      content = safeParse(content);
    }
    if (content && content.table_id) {
      const tableId = `table_${content.table_id}`;
      const table = $(`#${tableId}`);
      if (table && table.length > 0) {
        if (
          window.globalcurrenttableId &&
          window.globalcurrenttableId === tableId
        ) {
          $(table[0]).click();
          window.resetCurrenttableDataFromRemot();
        }
      }
    }
    handleBillsavedorsettledevent(content, TableUtils.Colors.FREE_TABLE, true);
    if ($('#orderSettlemetWindowParentDivID').is(':visible')) {
      window.fetchBillsFromRemote();
    }
  } catch (error) {
    console.error(error);
  }
}

function handleMessagereceived(content) {
  if (content) {
    try {
      if (content.constructor === stringConstructor) {
        content = safeParse(content);
      }
      messageReceived(content);
    } catch (error) {
      console.error(error);
    }
  }
}

function handleShownotification(content) {
  if (content) {
    try {
      if (content.constructor === stringConstructor) {
        content = safeParse(content);
      }
      pushNotification({
        title: content.title,
        data: content.data,
        date: window.moment(),
      });
    } catch (error) {
      console.error(error);
    }
  }
}

function handleSavekot(content) {
  try {
    if (content.constructor === stringConstructor) {
      content = safeParse(content);
    }

    if (content && content.table_id) {
      const tableId = `table_${content.table_id}`;
      const table = $(`#${tableId}`);
      if (table && table.length > 0) {
        table[0].data.details.order_state = 'Placed';
        if (
          window.globalcurrenttableId &&
          window.globalcurrenttableId === tableId
        ) {
          if (!Swal.isVisible()) $(table).click();
        }
      }
    }
    kotplacedfromRemote(content);
    if ($('#orderSettlemetWindowParentDivID').is(':visible')) {
      window.fetchBillsFromRemote();
    }

    // let tableDetails;
    // if (content.tableDetails) {
    //   tableDetails = safeParse(content.tableDetails);
    // }
  } catch (error) {
    console.error(error);
  }
}

async function handleOrderStatusUpdate(params) {
  try {
    const { billing_type } = params;

    if (
      [...Object.values(OnlineBillingTypeByName)].includes(
        Number(billing_type),
      ) &&
      billing_type !== OnlineBillingTypeByName.UPSALE &&
      billing_type !== OnlineBillingTypeByName.ONDC
    ) {
      const payload = {
        order_state: 'Food Ready',
        prev_order_state: 'Acknowledged',
        message: '',
        store_id: window.storeDetails.store_id,
        order_id: params.order_id,
        external_order_id: params.order_id,
        phone: params.customer_phone,
        source: 'atlantic_pos',
        username: window.storeDetails.username,
      };
      const { data } = await apiCall.post(
        window.Config.links.updateChannelOrderStatus,
        payload,
        {
          headers: getHeadersformposforrender(),
        },
      );
    } else {
      const payload = {
        new_order_state: 'food ready',
        message: '',
        store_id: window.storeDetails.store_id,
        order_id: params.order_id,
        phone: params.customer_phone,
        upsale_order:
          Number(params.billingType) === OnlineBillingTypeByName.UPSALE ? 1 : 0,
        source: 'atlantic_pos',
        username: window.storeDetails.username,
      };
      const { data } = await apiCall.put(
        window.Config.links.updatedigitalOrder,
        payload,
        {
          headers: getHeadersformposforrender(),
        },
      );
    }
  } catch (error) {
    console.log(error);
  }
}

async function handleUpdatekot(content) {
  try {
    if (content.constructor === stringConstructor) {
      content = safeParse(content);
    }

    const kot_status = await makeGetKotStatusByTableRequest(content);
    if (kot_status) {
      const allEqual = (arr) => arr.every((v) => v === arr[0]);
      const isAllEqual = allEqual(kot_status);
      if (isAllEqual) {
        const orderState = ['Placed', 'Bumped', 'Preparing', 'Ready', 'Served'];
        const tableId = `table_${content.table_id}`;
        const orderStateToShow = kot_status[0] - 1;
        $(`#${tableId}`)
          .find('#tableorderstatusLabel')
          .html(orderState[orderStateToShow]);
      }
    }
    if (content && (content['table_id '] || content.table_id)) {
      let tableId = `table_${content['table_id ']}`;
      if (content['table_id ']) {
        tableId = `table_${content['table_id ']}`;
      } else {
        tableId = `table_${content.table_id}`;
      }
      const table = $(`#${tableId}`);
      if (table && table.length > 0) {
        if (
          window.globalcurrenttableId &&
          window.globalcurrenttableId === tableId
        ) {
          $(table).click();
        }
      }
    }
    if (content && content.table_id) {
      const tableId = `table_${content.table_id}`;
      const table = $(`#${tableId}`);
      if (table && table.length > 0) {
        if (
          window.globalcurrenttableId &&
          window.globalcurrenttableId === tableId
        ) {
          $(table).click();
        }
      }
    }

    if (
      updateFoodReadyStatusFromKds &&
      ((content.app_source !== 'atlantic_pos' &&
        [...Object.values(OnlineBillingTypeByName)].includes(
          Number(content.billing_type),
        )) ||
        content.billing_type === 8) &&
      content.status === 5
    ) {
      handleOrderStatusUpdate(content);
    }
  } catch (error) {
    console.error(error);
  }
}

async function handlePrintKOT(content) {
  try {
    if (content) {
      content = safeParse(content);
      if (content.billing_type) {
        Object.assign(content, {
          billingType: content.billing_type,
        });
      }
      await kotprintHandler(content);

      shownotificationtoPOS({
        type: 'success',
        title: $.i18n.t('controller:ClinetRequestHandler.KOTPrintRequested'),
        message: $.i18n.t('controller:ClinetRequestHandler.KOTPrintRequested'),
      });
    }
  } catch (error) {
    console.log(error);
  }
}

async function handleSetBusyTableData(params) {
  try {
    if (params) {
      if (params.constructor === stringConstructor) {
        params = safeParse(params);
      }
      // console.log('params:', params);
      let KOT_Number = params?.insertedKOTid;
      if (
        window.busyTableData[params.table_id] &&
        window.busyTableData[params.table_id].kot_number
      ) {
        KOT_Number = `${window.busyTableData[params.table_id].kot_number}, ${params?.insertedKOTid} `;
      }
      // const tabledetails = {
      //   KOT_Number,
      // };

      // window.busyTableData[params.table_id] = tabledetails;
      if (window.busyTableData[params.table_id]) {
        window.busyTableData[params.table_id] = {
          ...window.busyTableData[params.table_id],
          KOT_Number,
        };
      } else {
        window.busyTableData[params.table_id] = {
          KOT_Number,
        };
      }

      if (window.busyTableData[params.table_id] && params.order_number) {
        window.busyTableData[params.table_id] = {
          ...window.busyTableData[params.table_id],
          Order_Number: params.order_number,
        };
      }
      if (window.busyTableData[params.table_id] && params.customer_mobile) {
        window.busyTableData[params.table_id] = {
          ...window.busyTableData[params.table_id],
          Customer_Mobile: params.customer_mobile,
        };
      }

      if (window.busyTableData[params.table_id] && params.customer_name) {
        window.busyTableData[params.table_id] = {
          ...window.busyTableData[params.table_id],
          Customer_Name: params.customer_name,
        };
      }
      if (window.busyTableData[params.table_id] && params.table_name) {
        window.busyTableData[params.table_id] = {
          ...window.busyTableData[params.table_id],
          Table_Name: params.table_name,
        };
      }
    }
  } catch (error) {
    console.log(error);
  }
}
function handlePrintBill(content) {
  try {
    if (content) {
      content = safeParse(content);

      if (
        content.applyDefaultcharges &&
        content.billType === 1 &&
        window.defaultdineinOrdercharges &&
        !content.charges.length &&
        !content.settledBillPrint
      ) {
        let charges = window.defaultdineinOrdercharges;
        if (content.tableDepartmentSection === 1) {
          // check if bar section charges is present and remove it
          const filteredCharges = window.defaultdineinOrdercharges.filter(
            (charge) => {
              const extraDetails = safeParse(charge.extra_details);
              return extraDetails.bar_section_billing !== 1;
            },
          );
          charges = filteredCharges;
        }
        Object.assign(content, { charges });
      }

      if (
        content.applyDefaultcharges &&
        content.billType === 2 &&
        window.defaulttakeawayOrdercharges &&
        !content.charges.length &&
        !content.settledBillPrint
      ) {
        Object.assign(content, { charges: window.defaulttakeawayOrdercharges });
      }

      if (
        content.applyDefaultcharges &&
        content.billType === 3 &&
        window.defaulthomedOrdercharges &&
        !content.charges.length &&
        !content.settledBillPrint
      ) {
        Object.assign(content, { charges: window.defaulthomedOrdercharges });
      }

      if (content && content.table_id) {
        const tableId = `table_${content.table_id}`;
        const table = $(`#${tableId}`);
        if (table && table.length > 0) {
          // if we are doing takeaway bill then by clicking table button it it switching to the dine in tab that's why it is commented
          // $(table).click();
        }
      }
      if (content.currenttabId) {
        // from terminal for draft print two prints are coming one from draft bill printed event and one from sendbillprint event
        // so from darftbillprinted event do not print and only table color should change
        // if (!content.doNotPrintBill) {
        billprintHandler(content);
        // }
        if (content.isdraftBill) {
          sendDraftBillPrintedevent({
            table_id: content.table_id,
            message: 'Draft bill printed',
            is_Draft_bill: true,
          });
          shownotificationtoPOS({
            type: 'success',
            title: $.i18n.t(
              'controller:ClinetRequestHandler.draftBillPrintRequested',
            ),
            message: $.i18n.t(
              'controller:ClinetRequestHandler.draftBillPrintRequested',
            ),
          });
        } else {
          shownotificationtoPOS({
            type: 'success',
            title: $.i18n.t('controller:ClinetRequestHandler.billSaved'),
            message: $.i18n.t('controller:ClinetRequestHandler.billSaved'),
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}

function handleQuickbillPrint(content) {
  // handlePrintBill
  try {
    if (content.currenttabId && content.printContent) {
      quickBillPrintHandler(content);
    }
  } catch (error) {
    console.error('Message="Error while printing quick bill" Error=', error);
  }
}
function handleKOTItemstatusupdated(content) {
  if (content) {
    if (getLivestatusdataevent && window.LiveStatusModalOpened)
      getLivestatusdataevent();
  }
}

function handleKotUpdatedRequest(data) {
  try {
    const content = safeParse(data);
    if (content.transferItem) {
      $(`#table_${content.destinationtable}`).css({
        'background-color': TableUtils.Colors.KOT_SAVED,
      });
    }
    if (content.allitemsRemoved) {
      $(`#table_${content.table_id}`).css({
        'background-color': TableUtils.Colors.FREE_TABLE,
      });

      const tableId = `table_${content.table_id}`;
      if (window.showbillDetails) {
        $(`#${tableId}`).find('#tablebillnumberlabel').html('&nbsp');
        $(`#${tableId}`).find('#tableamountlabel').html('&nbsp');
        $(`#${tableId}`).find('#tableorderstatusLabel').html('&nbsp');
        $(`#${tableId}`).find('#tablekotnosLabelid').html('&nbsp');
        $(`#${tableId}`).find('#tableCreatedByLabelid').html('&nbsp');
        $(`#${tableId}`).find('#tablecustomernameLabelid').html('&nbsp');
        $(`#${tableId}`).find('#tableOrdernoLabelid').html('&nbsp');
        $(`#${tableId}`).find('#tablewaiterLabelid').html('&nbsp');

        $(`#${tableId}`)
          .find('#tablekottimelabelId')
          .attr('title', '')
          .html('&nbsp');
      }

      const currenttable = $(`#${tableId}`);
      if (currenttable && currenttable[0])
        currenttable[0].data.details.order_state = '';

      if (
        window.globalcurrenttableId &&
        window.globalcurrenttableId === tableId
      ) {
        window.resetCurrenttableDataFromRemot();
      }

      const table = $(`#${tableId}`);

      if (table && table.length > 0) {
        const tableDetails = table[0].data;

        // If the table order type is TA/HD then remove that table
        if ([1, 2, 5].includes(tableDetails.order_type_flag)) {
          $(`#table_${content.table_id}`).remove();
          removetablefromwathersList(tableId);
          const table_index = window.tableName_suggestions.indexOf(
            content.tableName,
          );
          if (table_index > -1) {
            window.tableName_suggestions.splice(table_index, 1);
          }
        }
      }
    }

    if (content && (content['table_id '] || content.table_id)) {
      let tableId = `table_${content['table_id ']}`;
      if (content['table_id ']) {
        tableId = `table_${content['table_id ']}`;
      } else {
        tableId = `table_${content.table_id}`;
      }
      const table = $(`#${tableId}`);
      if (table && table.length > 0) {
        if (
          window.globalcurrenttableId &&
          window.globalcurrenttableId === tableId
        ) {
          $(table).click();
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}
function handleKOTItemtransferred(params) {
  if (params) {
    if (params.constructor === stringConstructor) {
      params = safeParse(params);
    }

    if (params.transferredallItems && params.table_id) {
      const tableId = `table_${params.table_id}`;
      const table = $(`#${tableId}`);
      removetablefromwathersList(tableId);
      if (table && table.length > 0) {
        table.css({
          'background-color': TableUtils.Colors.FREE_TABLE,
        });
        table.css({
          background: TableUtils.Colors.FREE_TABLE,
        });
        makeChangeTableColorRequest({
          table_color: TableUtils.Colors.FREE_TABLE,
          order_state: null,
          table_action_flag: 0,
          table_id: params.table_id,
        });
        const activeTableDept = $(
          '.activeTableDepartment .menuItemButtoncontentwrapper .department-title-container',
        ).attr('value');
        if (activeTableDept === 'Running Orders') {
          $(`#table_${params.table_id}`).hide();
        }
        const currenttable = $(`#table_${params.table_id}`);
        currenttable[0].data.details.order_state = '';
        currenttable[0].data.details.color = TableUtils.Colors.FREE_TABLE;

        const desttable = $(`#table_${params.destination_table}`);
        desttable[0].data.details.order_state = 'Placed';
        if (window.showbillDetails) {
          try {
            $(`#${tableId}`).find('#tablebillnumberlabel').html('&nbsp');
            $(`#${tableId}`).find('#tableamountlabel').html('&nbsp');
            $(`#${tableId}`).find('#tableorderstatusLabel').html('&nbsp');
            $(`#${tableId}`).find('#tablekotnosLabelid').html('&nbsp');
            $(`#${tableId}`).find('#tableCreatedByLabelid').html('&nbsp');
            $(`#${tableId}`).find('#tablecustomernameLabelid').html('&nbsp');
            $(`#${tableId}`).find('#tableOrdernoLabelid').html('&nbsp');
            $(`#${tableId}`).find('#tablewaiterLabelid').html('&nbsp');

            $(`#${tableId}`)
              .find('#tablekottimelabelId')
              .attr('title', '')
              .html('&nbsp');
          } catch (error) {
            console.error(error);
          }
        }
        if (
          window.globalcurrenttableId &&
          window.globalcurrenttableId === tableId
        ) {
          window.resetCurrenttableDataFromRemot();
        }
        window.remotefetchBillDataForCskOrderTotal({
          table_id: Number(params.destination_table),
        });

        if (
          window.globalcurrenttableId &&
          window.globalcurrenttableId === tableId
        ) {
          $(table).click();
        }

        // if (params.order_type && [2, 3].includes(params.order_type)) {
        //   $(`#table_${params.table_id}`).remove();
        // }
        if ([TAKEAWAY_FLAG_ID, HOMED_FLAG_ID].includes(params.order_type)) {
          $(`#table_${params.table_id}`).remove();
        }
      }

      const currenttable = $(`#${tableId}`);
      currenttable[0].data.details.order_state = '';
    }
    if (
      params.transferredallItems &&
      params.destinationtable &&
      window.displaytimeonTables
    ) {
      addtabletowatchList(
        `table_${params.destinationtable}`,
        new Date().getTime(),
      );
    }
    if (params.destination_table) {
      const desttableId = `table_${params.destination_table}`;
      const table = $(`#${desttableId}`);
      if (table && table.length > 0) {
        table.css({
          'background-color': TableUtils.Colors.KOT_SAVED,
        });
        if (
          window.globalcurrenttableId &&
          window.globalcurrenttableId === desttableId
        ) {
          $(table).click();
        }
      }
    }
  }
}

function handleKOTCancelled(params) {
  if (params.constructor === stringConstructor) {
    params = safeParse(params);
  }
  if (params && params.table_id) {
    const tableId = `table_${params.table_id}`;
    const table = $(`#${tableId}`);
    let hasItems = false;
    let currenttableButton;
    if (params.cancelledAllItems) {
      const currenttable = $(`#${tableId}`);
      // eslint-disable-next-line prefer-destructuring, no-unused-vars
      currenttableButton = currenttable[0];
      currenttable[0].data.details.order_state = '';

      if (window.showbillDetails) {
        try {
          setTimeout(() => {
            $(`#${tableId}`)
              .find(
                '#tableamountlabel, #tableorderstatusLabel, #tablekottimelabelId, #tablekotnosLabelid, #tableCreatedByLabelid',
                '#tableOrdernoLabelid',
                '#tablewaiterLabelid',
              )
              .text('');
          }, 100);
        } catch (error) {
          console.error(error);
        }
      }
      setTimeout(() => {
        window.ipcRenderer.send(SEND_ORDER_TOTAL, { order_total: 0 });
      }, 100);
      removetablefromwathersList(tableId);
      // check kot is active for this table
      setTimeout(async () => {
        const result = await makeCheckActiveKotRequest({
          table_id: params.table_id,
        });

        if (result && result.length > 0) {
          hasItems = true;
        }
      }, 100);
    }
    if (params.cancelledAllItems && !hasItems && table && table.length > 0) {
      const tableName = table[0].content;
      table.css({
        'background-color': TableUtils.Colors.FREE_TABLE,
      });

      makeChangeTableColorRequest({
        table_color: TableUtils.Colors.FREE_TABLE,
        order_state: null,
        table_action_flag: 0,
        table_id: params.table_id,
      });

      if (params.order_type && [2, 3].includes(params.order_type)) {
        $(`#table_${params.table_id}`).remove();
      }
      shownotificationtoPOS({
        type: 'success',
        message: `${$.i18n.t(
          'controller:ClinetRequestHandler.KOTCancelledFor',
        )} ${tableName}`,
        title: $.i18n.t('controller:ClinetRequestHandler.KOTCancelledFor'),
      });

      if (window.showbillDetails) {
        // $(table).click();
        $('#tableamountlabel').html('');
        $('#tableorderstatusLabel').html('');
        $('#tableOrdernoLabelid').html('');
        $('#tablekottimelabelId').html('');
        $('#tablekotnosLabelid').html('');
        $('#tableCreatedByLabelid').html('');
        $('#tablewaiterLabelid').html('');
      }

      if (
        window.globalcurrenttableId &&
        window.globalcurrenttableId === tableId
      ) {
        $(table).click();
      }
    }
    if (
      window.globalcurrenttableId &&
      window.globalcurrenttableId === tableId
    ) {
      $(table).click();
    }
  }
}

function handleOrderchargesupdated(content) {
  try {
    if (content.constructor === stringConstructor) {
      content = safeParse(content);
    }
    if (content && content.table_id) {
      const tableId = `table_${content.table_id}`;
      const table = $(`#${tableId}`);
      if (table && table.length > 0) {
        if (
          window.globalcurrenttableId &&
          window.globalcurrenttableId === tableId
        ) {
          $(table).click();
        }
      }
      if (window.showCskAndTerminalNotifications) {
        if (content?.charges) {
          window.notifyUser.showMessage('success', 'Charges applied');
        }

        if (content?.discount) {
          window.notifyUser.showMessage('success', 'Discount applied');
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function handleTableSplittedRequest(params) {
  params = safeParse(params);
  if (params.tableDetails) {
    const { tableDetails } = params;

    if (
      window.depstoinclude &&
      window.depstoinclude.length &&
      !window.depstoinclude.includes(String(tableDetails.department))
    ) {
      return;
    }
    if (tableDetails && tableDetails.tableName) {
      Object.assign(tableDetails, { table_name: tableDetails.tableName });
    }
    if (tableDetails && tableDetails.table_name) {
      await sleep(100);
      window.allTableslist.push(tableDetails);
      window.addtabletoViewfromremote(tableDetails);
      const message = `${$.i18n.t(
        'controller:ClinetRequestHandler.KOTPlacedFor',
      )} ${tableDetails.table_name}`;

      shownotificationtoPOS({
        type: 'success',
        title: tableDetails.table_name || 'TMBill Atlantic POS',
        message,
      });
    }
  }
}

async function handlePSOMenuUpdated() {
  try {
    // request getOrderwindowDetails
    $('#refreshButton').click();
  } catch (error) {
    console.error(error);
  }
}

async function handleDraftBillPrintedRequest(content) {
  const data = safeParse(content);
  const updateColordetails = {
    table_id: data.table_id,
    table_color: TableUtils.Colors.DRAFT_BILL_PRINTED,
    table_action_flag: TableUtils.State.DRAFT_BILL_PRINTED,
  };
  makeUpdateTableColorRequest(updateColordetails);
  sendUpdateTableColorevent(updateColordetails);

  const table = $(`#table_${data.table_id}`);
  table.css({
    'background-color': TableUtils.Colors.DRAFT_BILL_PRINTED,
  });
  if (table && table.length) {
    table[0].data.table_action_flag = TableUtils.State.DRAFT_BILL_PRINTED;
  }
}
function resetTableDetails(table_id) {
  if (window.showbillDetails) {
    try {
      $(`#table_${table_id}`).find('#tablebillnumberlabel').html('&nbsp');
      $(`#table_${table_id}`).find('#tableamountlabel').html('&nbsp');
      $(`#table_${table_id}`).find('#tableorderstatusLabel').html('&nbsp');
      $(`#table_${table_id}`).find('#tablekotnosLabelid').html('&nbsp');
      $(`#table_${table_id}`).find('#tableCreatedByLabelid').html('&nbsp');
      $(`#table_${table_id}`).find('#tablecustomernameLabelid').html('&nbsp');
      $(`#table_${table_id}`).find('#tableOrdernoLabelid').html('&nbsp');
      $(`#table_${table_id}`).find('#tablewaiterLabelid').html('&nbsp');
      $(`#table_${table_id}`)
        .find('#tablekottimelabelId')
        .attr('title', '')
        .html('&nbsp');
    } catch (error) {
      console.error(error);
    }
  }
}

async function handleTableChangeEvent(params) {
  try {
    const content = safeParse(params);
    $(`#table_${content.data.desttable_id}`).css({
      'background-color': TableUtils.Colors.KOT_SAVED,
    });
    $(`#table_${content.data.table_id}`).css({
      'background-color': TableUtils.Colors.FREE_TABLE,
    });
    $(`#table_${content.data.table_id}`).css({
      background: TableUtils.Colors.FREE_TABLE,
    });
    makeChangeTableColorRequest({
      table_color: TableUtils.Colors.FREE_TABLE,
      order_state: null,
      table_action_flag: 0,
      table_id: content.data.table_id,
    });
    if (
      window.globalcurrenttableId &&
      window.globalcurrenttableId === `table_${content.data.table_id}`
    ) {
      $(`#table_${content.data.table_id}`).click();
    }
    setTimeout(() => {
      if (content && content.data.table_id) {
        const tableId = `table_${content.data.table_id}`;
        if (
          window.globalcurrenttableId &&
          window.globalcurrenttableId === tableId
        ) {
          // $(table[0]).click();
          window.resetCurrenttableDataFromRemot();
        }
      }
      resetTableDetails(content.data.table_id);
    }, 300);
    const activeTableDept = $(
      '.activeTableDepartment .menuItemButtoncontentwrapper .department-title-container',
    ).attr('value');
    if (activeTableDept === 'Running Orders') {
      $(`#table_${content.data.table_id}`).hide();
    }
    const table = $(`#table_${content.data.table_id}`);
    table[0].data.details.order_state = '';

    const desttable = $(`#table_${content.data.desttable_id}`);
    if (desttable && desttable[0]) {
      desttable[0].data.details.order_state = 'Placed';
    }
    addtabletowatchList(
      `table_${content.data.desttable_id}`,
      content.data.kotcreatedAt || new Date().getTime(),
    );
    removetablefromwathersList(`table_${content.data.table_id}`);

    // If the table order type is TA/HD then remove that table
    if ([1, 2, 5].includes(content.data.order_type_flag)) {
      $(`#table_${content.data.table_id}`).remove();
    }
  } catch (error) {
    console.error(error);
  }
}

async function handleQtyUpdateEvent(params) {
  try {
    if (params.decrementQtyItems || params.incrementQtyItems) {
      const items = [];
      if (params.decrementQtyItems && params.decrementQtyItems.length) {
        items.push(...params.decrementQtyItems);
      }
      if (params.incrementQtyItems && params.incrementQtyItems.length) {
        items.push(...params.incrementQtyItems);
      }
      if (items.length) {
        items.forEach((item) => {
          const getItem = window.allItemsList.find(
            (i) => i.item_refid === item.item_refid,
          );
          if (getItem) {
            getItem.current_stock = item.current_stock;
          }
          if (item.current_stock === 0) {
            $(`#item_${item.short_code} .itemstockLabel`).html(
              `<span class='outofstocktag'>Out Of Stock</span>`,
            );
          } else {
            $(`#item_${item.short_code} .itemstockLabel`).text(
              `(${item.current_stock})`,
            );
          }
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
}

async function handleCustomerUpdatedEvent(content) {
  const { customer, table_id } = safeParse(content);
  const customerUpdateIndex = window.customersList.findIndex(
    (c) =>
      Number(c.phone) === Number(customer.phone) &&
      Number(c.store_id) === Number(window.storeDetails.store_id),
  );
  if (customerUpdateIndex && customerUpdateIndex !== -1) {
    window.customersList[customerUpdateIndex] = {
      ...window.customersList[customerUpdateIndex],
      ...customer,
    };
  } else {
    window.customersList.push(customer);
  }

  if (table_id) {
    const table = $(`#${table_id}`);
    if (table && table.length > 0) {
      if (
        window.globalcurrenttableId &&
        window.globalcurrenttableId === table_id
      ) {
        $(table).click();
      }
    }
  }
}

async function handleLogoutUserEvent() {
  if (!window.__IS_MASTER_POS__) {
    // if (params && params.username) {
    //   if (params.username === window.storeDetails.username) {
    //     window.ipcRenderer.send('logout', undefined);
    //   }
    // } else {
    //   window.ipcRenderer.send('logout', undefined);
    // }
  }
}
async function handleTableClickEvent(content) {
  try {
    $(`#table_${content.table_id}`)
      .find('#tablebillnumberlabel')
      .html(content.bill_number ? `Bill No:${content.bill_number}` : '');

    if (content.order_total) {
      $(`#table_${content.table_id}`)
        .find('#tableamountlabel')
        .html(
          `${window.storeDetails?.currency} ${content?.order_total.toFixed(window.ROUNDOFF_UPTO)}`,
        );
    }
    $(`#table_${content.table_id}`)
      .find('#tableorderstatusLabel')
      .html(content.order_state);
    $(`#table_${content.table_id}`)
      .find('#tablekotnosLabelid')
      .html(
        content?.kot_numbers?.length > 0
          ? `KOT :${content?.kot_numbers?.join(',')}`
          : '',
      );

    if (content.delivery_boy_name) {
      $(`#table_${content.table_id}`)
        .find('#tabledeliveryboyLabelid')
        .html(content.delivery_boy_name);
    }

    if (content.customer_name) {
      $(`#table_${content.table_id}`)
        .find('#tablecustomernameLabelid')
        .html(content.customer_name);
    }

    if (content.order_number) {
      $(`#table_${content.table_id}`)
        .find('#tableOrdernoLabelid')
        .html(`# ${content.order_number}`);
    }

    if (content.delivery_boy_name || content.order_note) {
      const tableId = `table_${content.table_id}`;
      const table = $(`#${tableId}`);
      if (table && table.length > 0) {
        if (
          window.globalcurrenttableId &&
          window.globalcurrenttableId === tableId
        ) {
          $(table).click();
        }
      }
    }

    const tableTime = $(`#table_${content.table_id}`)
      .find('#tablekottimelabelId')
      .text();

    // !tableTime.length &&
    if (
      tableTime.length === 1 &&
      content.order_state !== '' &&
      content.order_state !== null
    ) {
      addtabletowatchList(`table_${content.table_id}`, new Date().getTime());
    }
  } catch (error) {
    console.error(error);
  }
}

async function handleUpdateTableDetailsEvent(content) {
  try {
    content = safeParse(content);
    if (content.delivery_boy_name) {
      $(`#table_${content.table_id}`)
        .find('#tabledeliveryboyLabelid')
        .html(content.delivery_boy_name);
    }
    if (content.delivery_boy_name || content.order_note) {
      const tableId = `table_${content.table_id}`;
      const table = $(`#${tableId}`);
      if (table && table.length > 0) {
        if (
          window.globalcurrenttableId &&
          window.globalcurrenttableId === tableId
        ) {
          $(table).click();
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

function handleOrderUpdatedFromSettlementWindowEvent(data) {
  if ($('#orderSettlemetWindowParentDivID').is(':visible')) {
    window.fetchBillsFromRemote();
  }
  if (window.settingsConfig[DISPLAY_WAITER_NAME_ON_TABLE - 1] !== undefined) {
    showWaiterNameOnTable =
      window.settingsConfig[DISPLAY_WAITER_NAME_ON_TABLE - 1].value === '1';
  }
  data.forEach((response) => {
    if (response.deliveryBoyChanged) {
      $(`#table_${response.table_id}`)
        .find('#tabledeliveryboyLabelid')
        .html(response.delivery_boy_name);
    }
    if (response.waiterChanged && showWaiterNameOnTable) {
      $(`#table_${response.table_id}`)
        .find('#tablewaiterLabelid')
        .html(response.waiter);
    }
    if (response.billing_type === TAKEAWAY_BILLING_FLAG) {
      $('#takeawayneworderButtonid').click();
    }
    if (response.billing_type === HOMED_BILLING_FLAG) {
      $('#deliveryneworderButtonid').click();
    }
  });
}

async function handleAssistnaceRequiredEvent(content) {
  try {
    window.pushnotificationListener('', content);
  } catch (error) {
    console.error(error);
  }
}

async function handlePOSSettingsUpdated() {
  try {
    window.initGetSettings();
    const result = await Swal.fire({
      title: $.i18n.t('common:reloadMessage.Settings'),
      text: $.i18n.t('common:reloadMessage.pleaseRefreshTheWindow'),
      width: '23em',
      confirmButtonText: $.i18n.t('common:reloadMessage.reloadNow'),
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: true,
      cancelButtonText: $.i18n.t('common:reloadMessage.noIWillDoItLater'),
      customClass: {
        popup: 'tmbill-swal-pop-up',
      },
    });
    if (result.value && window.remote) {
      window.ipcRenderer.send(RELOAD_APP, { name: 'main' });
    }
    // window.ipcRenderer.send(RELOAD_APP, { name: 'main' });
  } catch (error) {
    console.error(error);
  }
}

async function handleTableMergedRequest(params) {
  params = safeParse(params);
  if (params.table_id) {
    $(`#table_${params.table_id}`).remove();
  }

  if (params.is_kot_placed) {
    $(`#table_${params.parent_table_id}`).css({
      'background-color': TableUtils.Colors.KOT_SAVED,
    });

    if (params && params.parent_table_id) {
      const tableId = `table_${params.parent_table_id}`;
      const table = $(`#${tableId}`);
      if (table && table.length > 0) {
        table[0].data.details.order_state = 'Placed';
        if (
          window.globalcurrenttableId &&
          window.globalcurrenttableId === tableId
        ) {
          if (!Swal.isVisible()) $(table).click();
        }
      }
    }

    window.ipcRenderer.send(FETCH_BILL_DATA_FOR_CSK_ORDER_TOTAL, {
      table_id: params.parent_table_id,
    });
  }
}

function handleClosenotification(content) {
  content = safeParse(content);
  if (content && content.target) {
    const notificationView = document.getElementsByClassName(content.target);
    if (notificationView) {
      notificationView[0].style.display = 'none';
      window.stopHowler();
    }
  }
}

function handleAcceptRemoteKot(content) {
  content = safeParse(content);
  if (content && content.remote_kot_id) {
    const target = `remoteKotClass${content.remote_kot_id}`;
    const notificationView = document.getElementsByClassName(target);
    if (notificationView && notificationView.length) {
      notificationView[0].style.display = 'none';
      window.stopHowler();
    }

    window.autoAcceptRemotKotFromRemote(content);
  }
}

window.ipcRenderer.on(UPDATE_TABLE_COLOR, (event, data) => {
  handleTablecolorupdate(data);
});

window.ipcRenderer.on(ORDER.BILL_SAVED, async (event, content) => {
  handleBillsaved(content);
});
const savePrintQueue = [];
const isProcessingSavePrint = false;
// async function processSavePrintQueue() {
//   if (isProcessingSavePrint) return;
//   if (savePrintQueue.length === 0) return;

//   isProcessingSavePrint = true;

//   const content = savePrintQueue.shift();
//   console.log('queue content', content);

//   try {
//     await handleSavenprintBill(content);
//   } catch (error) {
//     console.error('Queue error:', error);
//   }

//   await sleep(2000);
//   isProcessingSavePrint = false;

//   // Process next item
//   processSavePrintQueue();
// }

// window.ipcRenderer.on(ORDER.SAVE_AND_PRINT_BILL, async (event, content) => {
//   handleSavenprintBill(content);
//   // console.log('pused in quere');
//   // savePrintQueue.push(content);
//   // processSavePrintQueue();
// });

window.ipcRenderer.on(ORDER.BILL_SETTLED, async (event, content) => {
  handleBillsettled(content);
});

window.ipcRenderer.on(ORDER.MESSAGE, async (event, content) => {
  handleMessagereceived(content);
});

window.ipcRenderer.on(
  ORDER_IPC.SHOW_PUSH_NOTIFICATION,
  async (event, content) => {
    handleShownotification(content);
  },
);

window.ipcRenderer.on(ORDER.KOT_SAVED, async (event, content) => {
  handleSavekot(content);
});

window.ipcRenderer.on(KDS.KOT_UPDATED, async (event, content) => {
  // get kot details of that table_id
  handleUpdatekot(content);
});

window.ipcRenderer.on(ORDER.KOT_UPDATED, async (event, content) => {
  // get kot details of that table_id
  handleKotUpdatedRequest(content);
});

window.ipcRenderer.on(PRINT.KOT, async (_event, content) => {
  // first kot preference is for csk kot
  // await sleep(500);
  handlePrintKOT(content);
});

window.ipcRenderer.on(PRINT.BILL, async (event, content) => {
  handlePrintBill(content);
});

window.ipcRenderer.on(PRINT.QUICK_BILL_PRINT, async (event, content) => {
  handleQuickbillPrint(content);
});

window.ipcRenderer.on(KDS.ITEM_STATUS_CHANGED, async (_event, content) => {
  handleKOTItemstatusupdated(content);
});

window.ipcRenderer.on(ORDER.KOTITEM_TRANSFERRED, async (_event, params) => {
  handleKOTItemtransferred(params);
});

window.ipcRenderer.on(ORDER.KOT_CANCELLED, async (event, params) => {
  handleKOTCancelled(params);
});

window.ipcRenderer.on(ORDER.CHARGES_UPDATED, async (event, content) => {
  handleOrderchargesupdated(content);
});

window.ipcRenderer.on(ORDER.TABLE_SPLITTED, async (event, content) => {
  handleTableSplittedRequest(content);
});

window.ipcRenderer.on(ORDER.TABLE_MERGED, async (event, content) => {
  handleTableMergedRequest(content);
});

window.ipcRenderer.on(ORDER.TABLE_CHANGED, async (event, content) => {
  handleTableChangeEvent(content);
});

window.ipcRenderer.on(ORDER.TABLE_CLICKED, async (event, content) => {
  handleTableClickEvent(content);
});

window.ipcRenderer.on(ORDER.UPDATE_TABLE_DETAILS, async (event, content) => {
  handleUpdateTableDetailsEvent(content);
});

window.ipcRenderer.on(
  ORDER.ORDER_UPDATED_FROM_SETTLMENT_WINDOW,
  async (event, content) => {
    handleOrderUpdatedFromSettlementWindowEvent(content);
  },
);

window.ipcRenderer.on(UPDATE_STOCK_QTY, async (event, content) => {
  console.log('update stock qty event');
  handleQtyUpdateEvent(content);
});

window.ipcRenderer.on(
  ORDER.CLOSE_NOTIFICATION_VIEW,
  async (_event, content) => {
    handleClosenotification(content);
  },
);

window.ipcRenderer.on(ORDER.ACCEPT_REMOTE_KOT, async (_event, content) => {
  handleAcceptRemoteKot(content);
});

// implement only print kot
window.ipcRenderer.on(PRINT_CSK_KOT, async (event, data) => {
  if (data.insertedKOTid) {
    data.kot_number = data.insertedKOTid;
  }
  if (data.persons) {
    data.showCovers = data.persons;
  }

  OrderHubKOTTaskQueue.addTask({
    table_id: data.table_id,
    response: data,
    handlerFn: handlePrintKOT,
    job_id: window.generateId(10),
    context: 'ClientRequestHandler',
  });
  // handlePrintKOT(data);
});

window.ipcRenderer.on(SET_BUSY_TABLE_DATA, async (event, data) => {
  handleSetBusyTableData(data);
});

window.ipcRenderer.on(LOGOUT_USER, async (event, content) => {
  sendLogoutUserEvent();
});

window.ipcRenderer.on(GLOBAL_EVENT.CUSTOMER_UPDATED, async (event, content) => {
  handleCustomerUpdatedEvent(content);
});

window.ipcRenderer.on(CUSTOMER_UPDATED, async (event, content) => {
  if (content && content.miscData && content.miscData.table_id) {
    const tableId = `table_${content.miscData.table_id}`;
    const table = $(`#${tableId}`);
    if (table && table.length > 0) {
      if (
        window.globalcurrenttableId &&
        window.globalcurrenttableId === tableId
      ) {
        $(table).click();
      }
    }
  }
});

// implement only print kot
window.ipcRenderer.on(ORDER.REFRESH_TABLES, async (event, data) => {
  window.remotegetTables({ store_id: window.storeDetails?.store_id });
});
function setupSocketlistners() {
  try {
    if (currentsocketInstance) {
      currentsocketInstance.removeAllListeners();

      currentsocketInstance.on(ORDER.KOTITEM_TRANSFERRED, (params) => {
        handleKOTItemtransferred(params);
      });
      currentsocketInstance.on(ORDER.KOT_SAVED, (content) => {
        handleSavekot(content);
      });
      currentsocketInstance.on(ORDER.TABLE_MERGED, () => {});
      currentsocketInstance.on(ORDER.TABLE_CHANGED, (content) => {
        handleTableChangeEvent(content);
      });
      currentsocketInstance.on(KDS.KOT_UPDATED, (content) => {
        handleUpdatekot(content);
      });
      currentsocketInstance.on(ORDER.KOT_UPDATED, (content) => {
        handleKotUpdatedRequest(content);
      });
      currentsocketInstance.on(ORDER.CHARGES_UPDATED, (content) => {
        handleOrderchargesupdated(content);
      });
      currentsocketInstance.on(ORDER.DRAFT_BILL_PRINTED, (content) => {
        handleDraftBillPrintedRequest(content);
      });
      // currentsocketInstance.on(GLOBAL_EVENT.POS_SETTINGS_UPDATED, () => {
      //   handlePOSSettingsUpdated();
      // });
      currentsocketInstance.on(GLOBAL_EVENT.POS_MENU_UPDATED, () => {
        handlePSOMenuUpdated();
      });
      currentsocketInstance.on(ORDER.BILL_SAVED, (content) => {
        handleBillsaved(content);
      });
      currentsocketInstance.on(ORDER.BILL_SETTLED, (content) => {
        handleBillsettled(content);
      });

      currentsocketInstance.on(ORDER.TABLE_SPLITTED, (content) => {
        handleTableSplittedRequest(content);
      });
      currentsocketInstance.on(ORDER.TABLE_CLICKED, (content) => {
        handleTableClickEvent(content);
      });
      currentsocketInstance.on(ORDER.UPDATE_TABLE_DETAILS, (content) => {
        handleUpdateTableDetailsEvent(content);
      });

      currentsocketInstance.on(
        ORDER.ORDER_UPDATED_FROM_SETTLMENT_WINDOW,
        (content) => {
          handleOrderUpdatedFromSettlementWindowEvent(content);
        },
      );
      currentsocketInstance.on(ORDER.REFRESH_TABLES, () => {
        window.remotegetTables({ store_id: window.storeDetails?.store_id });
      });
      currentsocketInstance.on(ORDER.PAYMENT_RECEIVED, () => {});
      currentsocketInstance.on(ORDER.ASSISTANCE_REQUIRED, () => {});

      currentsocketInstance.on(GLOBAL_EVENT.SEND_NOTIFICATION, (content) => {
        handleAssistnaceRequiredEvent(content);
      });

      currentsocketInstance.on(ORDER.CLOSE_NOTIFICATION_VIEW, (content) => {
        handleClosenotification(content);
      });
      currentsocketInstance.on(ORDER.UPDATE_TABLE_COLOR, (content) => {
        handleTablecolorupdate(content);
      });
      currentsocketInstance.on(GLOBAL_EVENT.UPDATE_STOCK, (content) => {
        handleQtyUpdateEvent(content);
      });
      currentsocketInstance.on(GLOBAL_EVENT.CUSTOMER_UPDATED, (content) => {
        handleCustomerUpdatedEvent(content);
      });
      currentsocketInstance.on(GLOBAL_EVENT.LOGOUT_USER, (content) => {
        handleLogoutUserEvent(content);
      });
      currentsocketInstance.on('bill-print-url', (content) => {
        console.log(content);
      });

      currentsocketInstance.on(SET_STOREDETAILS, (content) => {
        if (content && content.storeDetails) {
          window.storeDetails = content.storeDetails;
        }
      });
    }
  } catch (error) {
    console.error(error);
  }
}

function getSocketinstance() {
  if (!window.__IS_MASTER_POS__) {
    currentsocketInstance = setupSocketforrenderer();
    if (!currentsocketInstance) {
      sleep(1000).then(() => {
        currentsocketInstance = setupSocketforrenderer();
        setupSocketlistners();
      });
    } else {
      setupSocketlistners();
    }
  }
  if (
    window.settingsConfig[UPDATE_FOOD_READY_STATUS_FROM_KDS - 1] != undefined
  ) {
    updateFoodReadyStatusFromKds =
      window.settingsConfig[UPDATE_FOOD_READY_STATUS_FROM_KDS - 1].value ===
      '1';
  }
}

setTimeout(() => {
  getSocketinstance();
}, 3000);

module.exports = {
  sendTableClickEvent,
  sendChargesUpdatedevent,
  sendBillsettledevent,
  sendBillsavedevent,
  sendKotsavedevent,
  clientrequestInitialize,
  sendKotupdateddevent,
  sendkotitemStatuschanged,
  orderListenersforsocketevents,
  sendQuickBillPlacedEvent,
  sendTableSplittedevent,
  sendTableMergedevent,
  sendDraftBillPrintedevent,
  sendBillPrintRequestToMaster,
  sendKOTPrintRequestToMaster,
  sendUpdateTableColorevent,
  sendTableChangedevent,
  sendItemTransferredevent,
  sendNotificationEvent,
  sendStockUpdatedevent,
  sendSettleBillEvent,
  sendsettledBillPrintRequestToMaster,
  sendCustomerUpdatedEvent,
  sendTableRefreshevent,
  sendCloseNotificationevent,
  sendLogoutUserEvent,
  handleBillsettled,
  sendOrderUpdatedFromOrderSettlementWindowEvent,
  sendUpdateTableDetailsEvent,
};
