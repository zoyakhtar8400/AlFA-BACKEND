/* eslint-disable prefer-destructuring */
/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
const { forEach } = require('lodash');
const { ORDER_SOURCE_FOR_PRINT } = require('../../constant');
const {
  autoReduceInventoryRequest,
} = require('../../renderer/helper/Inventory.helper');
const {
  ZOMATO_BILLING_FLAG,
  SWIGGY_BILLING_FLAG,
  MAGICPIN_BILLING_FLAG,
  PRINTER_ACTION_TYPES,
  DIGITAL_BILLING_FLAG,
} = require('../../util/Constants');
const {
  OnlineBillingTypeByNumber,
  OnlineBillingTypeByName,
  ONLINEPLATFORM_PAYMENTMODES,
  OrderState,
} = require('../../util/DBUtil');
const {
  CHECK_IF_ORDER_IS_PULLED,
  PRINTERS_IPC,
  ORDER_IPC,
  FETCH_KOTBILL_NUMBER,
  PULL_DIGITALORDER,
} = require('../../util/IPC_Messages');
const { sleep } = require('../../util/MiscUtil');
const { ORDERSTATEFOR_REDUCEINVENTORY } = require('../../util/OrderStates');
const { safeParse, addPadding } = require('../../util/RendererUtils');
const {
  PULLORDER_ONACCEPT,
  PRINTKOT_ONORDER_ACCEPT,
  PRINTBILL_ONORDER_ACCEPT,
  PRINT_ALL_IN_ONE_KOT,
  PRINT_KD_WISE_FOR_OL_ORDER,
  SHOW_STORENAME_ONKOT,
  PRINTERS,
  SHOW_ONLINEORDER_OTP_ON_KOT,
  SHOW_ADDONS_SEPERATELY_FOR_ONLINE_OREDERS,
  AUTO_OUTOF_STOCK,
  SHOW_COMPLETE_ONLINE_ORDER_ID,
  SEPERATE_BILLING_FOR_OL_ORDER,
  COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY,
  PRINTER_58_CONFIG,
  PRINTER_80_CONFIG,
  FETCH_REPORT_AS_PER_CLOSE_DAY,
} = require('../../util/SettingIDs');
const { sendBillsettledevent } = require('../ClientrequestHandler');
const {
  getPrinterbykitchendepartment,
  getPrinterbyordertype,
} = require('../Printer/Helper');
const { PRINTER_SIZES_REFID } = require('../../util/PrintersUtil');
const {
  removeDigitalOrderFromLocalStorage,
  getDigitalOrdersFromLocalStorage,
} = require('./checkPullOrder');

const LABELPRINTER_FOR_ONLINE = [1, 3];
let bill_number_length = 0;
window.digiScreenloaded = true;
let printolOrderKdWise = false;
window.isDigitalBillSaveisinprocess = false;
let showAddonsSeperately = true;
let reduceStock = false;
let isCallCenterEnabled = false;
let fetchReportAsPerCloseDay;

/**
 * Set the margins to the preview if there are any
 */
async function setPageconfigifany() {
  let currentPrinter = 2;

  if (
    window.printersList != undefined &&
    window.printersList.length >= PRINTERS.DINEIN_BILL
  ) {
    const size = window.printersList[PRINTERS.DINEIN_BILL - 1].printer_size;
    currentPrinter = Number(size);
  }
  if (currentPrinter && window.settingsConfig) {
    let margins;
    $('#preview-footer-actionsid').attr('size', currentPrinter);
    let currentSize = '80mm';
    switch (currentPrinter) {
      case PRINTER_SIZES_REFID.PRINTER_58MM.ID:
        margins = window.settingsConfig[PRINTER_58_CONFIG - 1].value;
        currentSize = PRINTER_SIZES_REFID.PRINTER_58MM.SIZE;
        $('#previewContainerid').css({
          width: PRINTER_SIZES_REFID.PRINTER_58MM.SIZE,
        });
        break;
      case PRINTER_SIZES_REFID.PRINTER_80MM.ID:
        currentSize = PRINTER_SIZES_REFID.PRINTER_80MM.SIZE;
        margins = window.settingsConfig[PRINTER_80_CONFIG - 1].value;
        $('#previewContainerid').css({
          width: PRINTER_SIZES_REFID.PRINTER_80MM.SIZE,
        });
        break;
      default:
        break;
    }

    if (margins) {
      try {
        // $('#previewContainerid').css({ 'margin': margins });
        const rawmargins = String(margins).split(' ');
        if (rawmargins && rawmargins.length == 2) {
          $('#currentleftMarginlabel').html(rawmargins[0].replace('px', ''));

          if (rawmargins[1]) {
            const currentWidth = Number(rawmargins[1].replace('mm', ''));
            currentSize = Number(currentSize.replace('mm', ''));
            if (currentSize > currentWidth) {
              const widthDecrementcounter = currentSize - currentWidth;
              if (widthDecrementcounter > 0) {
                $('#currentrightMarginlabel').html(widthDecrementcounter);
              } else {
                $('#currentrightMarginlabel').html(0);
              }
            }
          }
        }
      } catch (error) {
        margins = undefined;
      }
    } else {
      $('#currentleftMarginlabel').html('0');
      $('#currentrightMarginlabel').html('0');
    }
    const pageConfig = {
      margins,
    };
    return pageConfig;
  }
}
/**
 * Generates the KOT Preview
 * @param {Parameters} params
 */
async function generateKOTPreview(params, printers) {
  const previewDetails = {
    items: params.items,
    tableName: params.tableName,
    tax_name: '',
    istax_dividable: '',
    kot_type: 'KOT',
    username: params.username,
    isLabelprinter: params.isLabelprinter,
    more_info: params.more_info,
    note: params.kotNote,
    order_id: params.order_id,
    billingType: params.billing_type,
    kitchenDepartment: params.kitchenDepartment,
    showOnlineOrderOtpOnKot: params.showOnlineOrderOtpOnKot,
    otp: params.otp,
    delivery_id: params.delivery_id,
    isOnlinebill: true,
    extra_details: params.extra_details,
    orderTime: params.orderTime,
    order_type_mode: params.order_type_mode,
  };

  if (params.order_state === 'cancelled') {
    Object.assign(previewDetails, {
      kot_type: 'Cancelle KOT',
    });
  }
  // Check if the store name is to be printed
  // on KOT or not
  if (params.showStorenamonkot != undefined) {
    previewDetails.showStorenamonkot = params.showStorenamonkot;
  }

  if (params.customer) {
    Object.assign(previewDetails, { customer: params.customer });
  }
  if (
    window.tablestatusTagonkotsettings &&
    window.tablestatusTagonkotsettings.showNewordertag &&
    window.tablestatusTagonkotsettings.newOrdertaglabel
  ) {
    previewDetails.tablestatuskotprintTag =
      window.tablestatusTagonkotsettings.newOrdertaglabel;
  }

  // if (window.kotpreviewscriptLoaded == true) {
  //   $('#kotpreviewBodyid').data('data', previewDetails);
  //   await showkotPreview();
  // } else {
  //   $('#kotpreviewBodyid').data('data', previewDetails);
  // }
  await window.printKotfromqueue({
    previewDetails,
    printers,
  });
}
/**
 * Prints KOT
 * @param {*} silentPrint
 */
async function generateOnlinekot(silentPrint, orderData) {
  const selectedBill = $(
    '#digitalorderslistID li.selected-order button.order-details',
  );
  if (selectedBill.length > 0 || orderData) {
    let order_data;
    if (orderData) {
      order_data = orderData;
    } else {
      order_data = $(selectedBill).attr('order_data');
    }
    if (order_data !== undefined) {
      try {
        order_data = safeParse(order_data);
      } catch (error) {
        console.log(error);
      }
    }
    if (!order_data) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:digitalOrderController.invalidDetails'),
      );
      return;
    }
    const { order_state } = order_data;
    if (
      !silentPrint &&
      order_state &&
      String(order_state).toLowerCase() == 'placed'
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:digitalOrderController.acceptTheOrderFirst'),
      );
      return;
    }

    const note = order_data.instructions;
    let { billing_type } = order_data;
    if (billing_type === 8 && order_data.delivery_type) {
      switch (order_data.delivery_type) {
        case 'dinein':
          billing_type = 1;
          break;
        case 'pickup':
          billing_type = 2;
          break;
        case 'delivery':
          billing_type = 3;
          break;
        default:
          break;
      }
    }

    const app_source = order_data.app_source;

    // Get the storename
    // Check if the store name is to be printed
    // on KOT or not
    let showStorenamonkot;
    let printAllInOneKot = false;
    let showOnlineOrderOtpOnKot = false;
    if (window.settingsConfig[SHOW_STORENAME_ONKOT - 1] != undefined) {
      const status =
        window.settingsConfig[SHOW_STORENAME_ONKOT - 1].value == '1';
      if (status) {
        showStorenamonkot = window.storeDetails.store_name;
      }
      if (
        status &&
        order_data &&
        order_data.extra_details &&
        order_data.extra_details.channel_restaurant_name
      ) {
        showStorenamonkot = order_data.extra_details.channel_restaurant_name;
      }
    }

    if (window.settingsConfig[PRINT_ALL_IN_ONE_KOT - 1] != undefined) {
      printAllInOneKot =
        window.settingsConfig[PRINT_ALL_IN_ONE_KOT - 1].value === '1';
    }
    if (window.settingsConfig[PRINT_KD_WISE_FOR_OL_ORDER - 1] != undefined) {
      printolOrderKdWise =
        window.settingsConfig[PRINT_KD_WISE_FOR_OL_ORDER - 1].value === '1';
    }
    if (
      order_data &&
      order_data.extra_details &&
      order_data.extra_details.otp &&
      window.settingsConfig[SHOW_ONLINEORDER_OTP_ON_KOT - 1] != undefined
    ) {
      showOnlineOrderOtpOnKot =
        window.settingsConfig[SHOW_ONLINEORDER_OTP_ON_KOT - 1].value == '1';
    }

    // let tableName = 'Digital Order'
    // let tableName = `Digital order (${order_data?.delivery_type})`;
    let tableName = `${order_data?.delivery_type}`;
    if (order_data.table_no) {
      tableName = order_data.table_no;
    }

    if (
      [...Object.values(OnlineBillingTypeByName)].includes(
        order_data.billing_type,
      )
    ) {
      tableName = `${OnlineBillingTypeByNumber[order_data.billing_type]} Order`;
    }

    const currentItems = [...order_data.tmpos_order_child];
    currentItems.forEach((item) => {
      if (item && item.extra_details && item.extra_details.alternative_title) {
        Object.assign(item, {
          alternative_title: item.extra_details.alternative_title,
        });
      }

      if (item & item.extra_details) {
        item.extra_details.printOnKOTAndBill = {};
      }

      item.amount = item.total;

      if (item && item.item_note) {
        Object.assign(item, {
          note: item.item_note,
        });
      }
      if (item && item.extra_details && item.extra_details.item_note) {
        Object.assign(item, {
          note: item.extra_details.item_note,
        });
      }
      if (
        showAddonsSeperately &&
        item.order_child_options &&
        item.order_child_options.length
      ) {
        item.addons = item.order_child_options;
        item.addons.forEach((addon) => {
          if (
            addon &&
            addon.extra_details &&
            addon.extra_details.alternative_title
          ) {
            Object.assign(addon, {
              alternative_title: addon.extra_details.alternative_title,
            });
          }
        });
      }
    });

    if (
      // order_data.billing_type === 107 &&
      ![
        ZOMATO_BILLING_FLAG,
        SWIGGY_BILLING_FLAG,
        MAGICPIN_BILLING_FLAG,
      ].includes(order_data.billing_type) &&
      order_data.external_order_id &&
      order_data.external_order_id !== '0'
    ) {
      Object.assign(order_data.extra_details, {
        external_order_id: order_data.external_order_id,
      });
    }
    if (currentItems && currentItems.length > 0) {
      if (currentItems && currentItems.length > 0) {
        try {
          const isLabelprinter = false;
          const more_info = {};
          const params = {
            items: currentItems,
            tableName,
            order_id: order_data.order_id,
            // username: `Order ID:${order_data.order_id}`,
            kotNote: note,
            forQuickbill: false,
            isLabelprinter,
            more_info,
            showStorenamonkot,
            showOnlineOrderOtpOnKot,
            billing_type: order_data.billing_type,
            otp: order_data?.extra_details?.otp || '',
            delivery_id: order_data?.dunzo_task_json?.external_order_id || 0,
            isOnlinebill: true,
            extra_details: order_data.extra_details,
            orderTime: order_data.orderDateTime,
            order_type_mode: order_data.delivery_type,
            order_state: order_data.order_state,
          };

          if (order_data.table_no) {
            Object.assign(params, {
              tableName: `Table:${order_data.table_no}`,
              // username: order_data.order_id
            });
          }

          if (order_data.room_no) {
            Object.assign(params, {
              tableName: order_data.room_no,
            });
          }
          if (order_data.phone && order_data.cust_name) {
            Object.assign(params, {
              customer: {
                name: order_data.cust_name,
                phone: order_data.phone,
              },
            });

            if (order_data.extra_details && order_data.extra_details.segments) {
              params.customer.segments = order_data.extra_details.segments;
            }
          }
          if (!showAddonsSeperately) {
            currentItems.map((item) => {
              delete item.extra_details;
            });
          }

          if (Number(printolOrderKdWise)) {
            // items mapping for kitchen department
            currentItems.map((item) => {
              let posItem = allItemsList.find(
                (o) => o.item_refid == item.item_id,
              );
              if (!posItem && window.platformCatalogueitems) {
                posItem = window.platformCatalogueitems.find(
                  (o) => o.item_id == Number(item.item_id),
                );
              }
              if (posItem && !item.kitchen_dept) {
                Object.assign(item, { kitchen_dept: posItem.kitchen_dept });
              }
            });

            $('#kitchenDepartmentDiv').addClass('kitchendept');
            const filteredList = window.groupItemsbyDepsforremote(currentItems);
            window.addKitchenprinterifnotadded_fromremote();
            // eslint-disable-next-line no-restricted-syntax
            for (const element of window.kitchenDepartments) {
              const groupFilter = _.find(filteredList, [
                'kitchen_dept',
                element.id,
              ]);
              if (groupFilter) {
                await sleep(500);
                const data = {
                  items: groupFilter.items,
                  kitchenDepartment:
                    window.kitchenDepartmentsidsmap[element.id],
                  tableName,
                  order_id: order_data.order_id,
                  // username: `Order ID:${order_data.order_id}`,
                  kotNote: note,
                  forQuickbill: false,
                  isLabelprinter,
                  more_info,
                  showStorenamonkot,
                  billing_type: order_data.billing_type,
                  showOnlineOrderOtpOnKot,
                  otp: order_data?.extra_details?.otp || '',
                  isOnlinebill: true,
                  extra_details: order_data.extra_details,
                  orderTime: order_data.orderDateTime,
                  order_state: order_data.order_state,
                };
                if (order_data.room_no) {
                  Object.assign(data, {
                    tableName: order_data.room_no,
                  });
                }
                let getPrinters;
                if (app_source === 'kiosk') {
                  getPrinters = await getPrinterbykitchendepartment({
                    action_type: PRINTER_ACTION_TYPES.KD_KOT_PRINTER,
                    app_source: ORDER_SOURCE_FOR_PRINT.KIOSK,
                    billing_type: String(billing_type),
                    department_name: element.kitchen_dept_name,
                  });
                } else {
                  getPrinters = await getPrinterbykitchendepartment({
                    action_type: PRINTER_ACTION_TYPES.KD_KOT_PRINTER,
                    app_source: ORDER_SOURCE_FOR_PRINT.DIGITAL,
                    billing_type: String(billing_type),
                    department_name: element.kitchen_dept_name,
                  });
                }

                await generateKOTPreview(data, getPrinters);
                // await window.printKotfromqueue({
                //   previewDetails: data,
                //   printers: getPrinters,
                // });
                // }

                // Check if label printer is on
                if ([1, 2].includes(window.printtoLabelprinter)) {
                  await renderkotViewforLabel(previewDetails);
                }
              }
            }

            if (printAllInOneKot) {
              $('#kitchenDepartmentDiv').removeClass('kitchendept');
              await sleep(500);
              // await generateKOTPreview(params);
              let getPrinters = [];
              let PRINTERNAME = PRINTERS.ONLINE_KOT;
              if (!isLabelprinter) {
                if (app_source === 'kiosk') {
                  getPrinters = await getPrinterbyordertype({
                    action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
                    app_source: ORDER_SOURCE_FOR_PRINT.KIOSK,
                    billing_type: String(billing_type),
                  });
                  // PRINTERNAME = getPrinters[0]?.printerIndex;
                  // if (getPrinters && getPrinters.length) {
                  //   for (let i = 0; i < getPrinters.length; i++) {
                  //     await sendPrintKOT(
                  //       isLabelprinter,
                  //       getPrinters[i].printerIndex,
                  //     );
                  //     await sleep(100);
                  //   }
                  // }
                } else {
                  getPrinters = await getPrinterbyordertype({
                    action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
                    app_source: ORDER_SOURCE_FOR_PRINT.DIGITAL,
                    billing_type: String(billing_type),
                  });
                  // PRINTERNAME = getPrinters[0]?.printerIndex;
                  // if (getPrinters && getPrinters.length) {
                  //   for (let i = 0; i < getPrinters.length; i++) {
                  //     await sendPrintKOT(
                  //       isLabelprinter,
                  //       getPrinters[i].printerIndex,
                  //     );
                  //     await sleep(100);
                  //   }
                  // }
                }
                await generateKOTPreview(params, getPrinters);

                // await window.printKotfromqueue({
                //   previewDetails: params,
                //   printers: getPrinters,
                // });
              }
              // sendPrintKOT(isLabelprinter, PRINTERNAME);
              if (LABELPRINTER_FOR_ONLINE.includes(printtoLabelprinter)) {
                printkottoLabelprinter(params);
              }
            }
          } else if (window.printCategorywiseKot) {
            let PRINTERNAME = PRINTERS.ONLINE_KOT;
            const filteredList = mapItemstocategory(params.items);
            // Now Print KOT by filtering the above filtered
            // list of departments along with their items
            for (const [key, value] of Object.entries(filteredList)) {
              if (value) {
                let content = { ...params };
                content.items = value;
                // await generateKOTPreview(content);

                if (app_source === 'kiosk') {
                  const getPrinters = await getPrinterbyordertype({
                    action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
                    app_source: ORDER_SOURCE_FOR_PRINT.KIOSK,
                    billing_type: String(billing_type),
                  });
                  await generateKOTPreview(content, getPrinters);
                } else {
                  const getPrinters = await getPrinterbyordertype({
                    action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
                    app_source: ORDER_SOURCE_FOR_PRINT.DIGITAL,
                    billing_type: String(billing_type),
                  });
                  await generateKOTPreview(content, getPrinters);
                }

                // sendPrintKOT(isLabelprinter, PRINTERNAME);
              }
            }
            if (printAllInOneKot) {
              $('#kitchenDepartmentDiv').removeClass('kitchendept');
              // await generateKOTPreview(params);
              let PRINTERNAME = PRINTERS.ONLINE_KOT;
              if (!isLabelprinter) {
                if (app_source === 'kiosk') {
                  const getPrinters = await getPrinterbyordertype({
                    action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
                    app_source: ORDER_SOURCE_FOR_PRINT.KIOSK,
                    billing_type: String(billing_type),
                  });
                  await generateKOTPreview(params, getPrinters);
                } else {
                  const getPrinters = await getPrinterbyordertype({
                    action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
                    app_source: ORDER_SOURCE_FOR_PRINT.DIGITAL,
                    billing_type: String(billing_type),
                  });
                  // PRINTERNAME = getPrinters[0]?.printerIndex;
                  await generateKOTPreview(params, getPrinters);
                }
              }
              // sendPrintKOT(isLabelprinter, PRINTERNAME);
              if (LABELPRINTER_FOR_ONLINE.includes(printtoLabelprinter)) {
                printkottoLabelprinter(params);
              }
            }
          } else {
            $('#kitchenDepartmentDiv').removeClass('kitchendept');
            // await generateKOTPreview(params);
            let PRINTERNAME = PRINTERS.ONLINE_KOT;
            if (!isLabelprinter) {
              if (app_source === 'kiosk') {
                const getPrinters = await getPrinterbyordertype({
                  action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
                  app_source: ORDER_SOURCE_FOR_PRINT.KIOSK,
                  billing_type: String(billing_type),
                });
                // PRINTERNAME = getPrinters[0]?.printerIndex;
                await generateKOTPreview(params, getPrinters);
              } else {
                const getPrinters = await getPrinterbyordertype({
                  action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
                  app_source: ORDER_SOURCE_FOR_PRINT.DIGITAL,
                  billing_type: String(billing_type),
                });
                await generateKOTPreview(params, getPrinters);
              }
            }
            // sendPrintKOT(isLabelprinter, PRINTERNAME);
            if (LABELPRINTER_FOR_ONLINE.includes(printtoLabelprinter)) {
              printkottoLabelprinter(params);
            }
          }
          // await generateKOTPreview(params);
          // sendPrintKOT(isLabelprinter);
          // if (LABELPRINTER_FOR_ONLINE.includes(printtoLabelprinter)) {
          //     printkottoLabelprinter(params);
          // }
        } catch (error) {
          console.log(error);
        }
      }
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:digitalOrderController.noItems'),
      );
    }
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:digitalOrderController.pleaseSelectOrder'),
    );
  }
}

/**
 *  Prints the bill
 * @param {*} silentPrint
 */
async function printonelineBill(silentPrint, orderData) {
  const selectedBill = $(
    '#digitalorderslistID li.selected-order button.order-details',
  );
  if (selectedBill.length > 0 || orderData) {
    let order_data;
    if (orderData) {
      order_data = orderData;
    } else {
      order_data = $(selectedBill).attr('order_data');
    }

    if (order_data !== undefined) {
      try {
        order_data = safeParse(order_data);
      } catch (error) {
        console.log(error);
      }
    }

    if (!order_data) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:digitalOrderController.pleaseSelectOrder'),
      );
      return;
    }
    const { order_state } = order_data;
    if (
      !silentPrint &&
      order_state &&
      String(order_state).toLowerCase() === 'placed'
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:digitalOrderController.acceptTheOrderFirst'),
      );
      return;
    }

    const items = [];
    if (order_data !== undefined && order_data.constructor === Object) {
      let bill_number;
      // const customDate = $('#digitalorderslistID li.selected-order')
      //   .find('#list-order-item-date-label-id')
      //   .html();

      const customDate = window
        .moment(order_data.orderDateTime)
        .utc()
        .format('DD MMMM YYYY hh:mm A');

      if (
        order_data.tmpos_order_child != undefined &&
        order_data.tmpos_order_child.length > 0
      ) {
        bill_number = order_data.order_id;
        const istax_dividable = 0;
        const taxName = window.currentTaxname;

        // Get bill number
        let savedBillnumber = await window.betteripcRenderer.callMain(
          ORDER_IPC.GET_BILL_NUMBER,
          { order_id: bill_number },
        );

        if (bill_number_length && savedBillnumber) {
          savedBillnumber = addPadding(savedBillnumber, bill_number_length);
        }

        order_data.tmpos_order_child.forEach((element) => {
          const tempItem = { ...element };
          if (
            tempItem &&
            tempItem.extra_details &&
            tempItem.extra_details.alternative_title
          ) {
            Object.assign(tempItem, {
              alternative_title: tempItem.extra_details.alternative_title,
            });
          }
          if (
            element &&
            element.extra_details &&
            element.extra_details.item_note
          ) {
            Object.assign(tempItem, {
              item_note: element.extra_details.item_note,
            });
          }
          tempItem.item_price = element.price;
          tempItem.title = element.title;
          tempItem.amount = element.total;
          tempItem.quantity = element.quantity;
          if (
            showAddonsSeperately &&
            element.order_child_options &&
            element.order_child_options.length
          ) {
            tempItem.addons = element.order_child_options;
            tempItem.addons.forEach((addon) => {
              if (
                addon &&
                addon.extra_details &&
                addon.extra_details.alternative_title
              ) {
                Object.assign(addon, {
                  alternative_title: addon.extra_details.alternative_title,
                });
              }
            });
          }
          if (!showAddonsSeperately) {
            delete tempItem.extra_details;
          }

          if (element.price == 0) {
            tempItem.item_price = '-';
          } else {
            tempItem.item_price = element.price;
          }
          // Add default option group
          // if (window.defaultparentGroup) {
          //   tempItem.product_group_id = window.defaultparentGroup.id;
          //   tempItem.product_group_name =
          //     window.defaultparentGroup.product_group_name;
          // }

          let posItem = window.allItemsList.find(
            (o) => Number(o.item_refid) === Number(element.item_id),
          );
          if (!posItem && window.platformCatalogueitems) {
            posItem = window.platformCatalogueitems.find(
              (o) => Number(o.item_id) === Number(element.item_id),
            );
          }
          if (posItem && !element.product_group_id) {
            Object.assign(tempItem, {
              product_group_id: posItem.product_group_id,
            });
          }
          if (
            posItem &&
            posItem.product_group_name &&
            !element.product_group_name
          ) {
            Object.assign(tempItem, {
              product_group_name: posItem.product_group_name,
            });
          }

          const product_group = window.globalproductGroups.find(
            (e) => e.id === tempItem.product_group_id,
          );
          if (product_group && product_group.product_group_name) {
            tempItem.product_group_name = product_group.product_group_name;
          }
          Object.assign(tempItem, {
            item_tax_per: element.tax_per,
            item_tax_value: element.tax_value,
            item_tax_method: element.tax_method,
            item_is_devidable: element.is_devidable,
            tax_name: element.tax_name,
          });

          if (
            element.order_child_charges &&
            element.order_child_charges.length
          ) {
            const itemlevelCharges = [];
            for (const currentCharge of element.order_child_charges) {
              let chargeAmount = currentCharge.charge_amount;

              // for zomato order order level charges coming on item level
              // and on item getting charges of all qty but we expect charge of one qty
              if (
                order_data.billing_type !== 8 &&
                order_data.billing_type !== 5 &&
                currentCharge.per_fixed === 0
              ) {
                chargeAmount = chargeAmount / element.quantity;
              }

              // if (
              //   order_data.billing_type == 4 &&
              //   currentCharge.per_fixed === 0
              // ) {
              //   chargeAmount =
              //     currentCharge.calculated_charge / element.quantity;
              // }
              itemlevelCharges.push({
                title: currentCharge.charge_title,
                per_or_fixed: currentCharge.per_fixed,
                calculated_charge: currentCharge.calculated_charge,
                calculated_tax: currentCharge.calculated_tax,
                amount: chargeAmount,
                // amount: currentCharge.calculated_charge,
                calculate_tax_for_item_charges:
                  currentCharge.calculated_tax > 0 ? 1 : 0,
                is_tax_applicable: currentCharge.is_tax_applicable,
                tax_amount: currentCharge.tax_amount,
                is_tax_included: currentCharge.is_tax_included,
              });
            }
            Object.assign(tempItem, {
              itemlevelCharges,
            });
          }
          items.push(tempItem);
        });

        const deliveryBy = undefined;
        let payMode = '';
        if (
          order_data.tmpos_order_payment != undefined &&
          order_data.tmpos_order_payment.length > 0
        ) {
          if (order_data.tmpos_order_payment.length > 1) {
            payMode = 'Split';
          } else if (
            order_data.tmpos_order_payment[0] != undefined &&
            order_data.tmpos_order_payment[0].payment_option != undefined
          ) {
            payMode = order_data.tmpos_order_payment[0].payment_option;
          }
        }

        let customer;
        const showotponBill = '';
        if (order_data.phone) {
          customer = {
            name: order_data.cust_name,
            phone: order_data.phone,
          };
          if (order_data.line_1) {
            customer.address_line1 = order_data.line_1;
          }
          if (order_data.line_2) {
            customer.address_line2 = order_data.line_2;
          }

          if (order_data.extra_details && order_data.extra_details.segments) {
            customer.segments = order_data.extra_details.segments;
          }
        }
        let extdeliveryBoy;

        if (
          order_data.delivery_boy_name &&
          order_data.delivery_boy_phone &&
          order_data.delivery_boy_phone !== '0'
        ) {
          extdeliveryBoy = {};
          extdeliveryBoy.name = order_data.delivery_boy_name;
          extdeliveryBoy.phone = order_data.delivery_boy_phone;
        }
        let tableName = 'Digital Order';
        if (order_data.table_no) {
          tableName += ` Table -${order_data.table_no}`;
        }

        if (order_data.room_no) {
          tableName = order_data.room_no;
        }

        if (
          [...Object.values(OnlineBillingTypeByName)].includes(
            order_data.billing_type,
          )
        ) {
          // tableName = String(
          //   BillingTypes[order_data.billing_type] || '',
          // ).toLowerCase();
          tableName = String(
            window.orderTypes[Number(order_data.billing_type)].order_type || '',
          ).toLowerCase();
          if (payMode == 'ONLINE') {
            payMode = 'Online Paid';
          }
        }

        if (order_data.billing_type == 104) {
          payMode = 'Online Paid';
        }
        if (
          // order_data.billing_type === 107 &&
          ![
            ZOMATO_BILLING_FLAG,
            SWIGGY_BILLING_FLAG,
            MAGICPIN_BILLING_FLAG,
          ].includes(order_data.billing_type) &&
          order_data.external_order_id &&
          order_data.external_order_id !== '0'
        ) {
          Object.assign(order_data.extra_details, {
            external_order_id: order_data.external_order_id,
          });
        }
        const previewDetails = {
          bill_number,
          tableName,
          // discount: Number(order_data.order_level_discount.toFixed(2)),
          discount_type: 0,
          tax_name: taxName || window.currentTaxname,
          istax_dividable,
          items,
          discounttoApply:
            order_data.order_level_discount &&
            Number(order_data.order_level_discount.toFixed(ROUNDOFF_UPTO)),
          isOnlinebill: true,
          onlinechargesTotal:
            order_data.order_level_total_charges &&
            Number(order_data.order_level_total_charges.toFixed(ROUNDOFF_UPTO)),
          showCustomerinfo: true,
          payment_mode: payMode,
          onlinetaxesTotal:
            order_data.order_level_total_taxes &&
            Number(order_data.order_level_total_taxes.toFixed(ROUNDOFF_UPTO)),
          customer,
          showotponBill,
          extdeliveryBoy,
          deliveryBy,
          customDate,
          paymentAdded: payMode,
          order_type_flag: order_data.delivery_type,
          coupon: order_data.coupan_code,
          couponDisounttype: order_data.coupan_type,
          couponDisounttotal: order_data.coupan_calculated_amt,
          couponDisount: order_data.coupan_value,
          couponDisountamt: order_data.coupan_value,
          billType: order_data.billing_type,
          extra_details: order_data.extra_details,
          order_note: order_data.instructions || '',
        };
        if (previewDetails.coupon && previewDetails.couponDisount) {
          previewDetails.discount -= previewDetails.couponDisount;
          if (previewDetails.discount < 0) {
            previewDetails.discount = 0;
          }
        }

        if (savedBillnumber) {
          Object.assign(previewDetails, { order_id: savedBillnumber });
        }

        if (
          order_data.tmpos_order_charges &&
          order_data.tmpos_order_charges.length
        ) {
          // charges: order_data.tmpos_order_charges
          const tempCharges = [];
          forEach(order_data.tmpos_order_charges, (charge) => {
            const tempCharge = {
              amount: Number(charge.charge_amount),
              title: charge.title,
              is_tax_included: charge.is_tax_included,
              calculated_tax: charge.calculated_tax,
              per_or_fixed: charge.per_or_fixed,
              billing_flag: 8,
              tax_amount: charge.tax_amount,
              is_tax_applicable: charge.calculated_tax,
              tax_amount: charge.tax_amount,
              is_tax_included: charge.is_tax_included,
              value: charge.value,
            };
            if (!charge.charge_amount) {
              Object.assign(tempCharge, { per_or_fixed: 0 });
            } else {
              Object.assign(tempCharge, {
                amount: Number(charge.charge_amount),
              });
            }
            tempCharges.push(tempCharge);
          });
          Object.assign(previewDetails, { charges: tempCharges });
        }

        if (
          order_data.delivery_boy_name &&
          order_data.delivery_boy_name !== '0'
        ) {
          Object.assign(previewDetails, {
            deliveryboyName: order_data.delivery_boy_name,
          });
        }

        const pageConfig = await setPageconfigifany();
        if (pageConfig && pageConfig.margins) {
          previewDetails.pageConfig = pageConfig;
          pageconfigProvided = true;
        } else {
          pageconfigProvided = false;
        }
        previewDetails.pageConfig = pageConfig;
        // if (window.previewscriptLoaded) {
        //   $('#previewBodyid').data('data', previewDetails);
        //   await showPreview();
        // } else {
        //   $('#previewBodyid').data('data', previewDetails);
        // }
        let billing_type = order_data.billing_type;
        const app_source = order_data.app_source;
        if (billing_type === 8 && order_data.delivery_type) {
          switch (order_data.delivery_type) {
            case 'dinein':
              billing_type = 1;
              break;
            case 'pickup':
              billing_type = 2;
              break;
            case 'delivery':
              billing_type = 3;
              break;
            default:
              break;
          }
        }
        let getPrinters;
        if (
          window.printersList !== undefined &&
          window.printersList.length >= PRINTERS.DINEIN_BILL
        ) {
          // let deviceName;
          // let copies;
          // let size;

          if (app_source && app_source === 'kiosk') {
            getPrinters = await getPrinterbyordertype({
              action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
              app_source: ORDER_SOURCE_FOR_PRINT.KIOSK,
              billing_type: String(billing_type),
            });
          } else {
            getPrinters = await getPrinterbyordertype({
              action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
              app_source: ORDER_SOURCE_FOR_PRINT.DIGITAL,
              billing_type: String(billing_type),
            });
          }

          // let activate = window.printersList[PRINTERS.DINEIN_BILL - 1].activate;
        }
        window.printBillfromqueue({
          previewDetails,
          billing_type: order_data.billing_type,
          printers: getPrinters,
        });
      }
    }
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:digitalOrderController.pleaseSelectOrder'),
    );
  }
}

async function initAutoReduceInventory() {
  await autoReduceInventoryRequest();
}

async function checkPullPendingOrder() {
  const pendingDigitalOrders = getDigitalOrdersFromLocalStorage();
  if (
    pendingDigitalOrders &&
    pendingDigitalOrders.length &&
    window.settingsConfig[PULLORDER_ONACCEPT - 1] &&
    window.settingsConfig[PULLORDER_ONACCEPT - 1].value === '1'
  ) {
    for (let i = 0; i < pendingDigitalOrders.length; i++) {
      const order_id = pendingDigitalOrders[i];
      const isOrderPulled = await window.betteripcRenderer.callMain(
        CHECK_IF_ORDER_IS_PULLED,
        { order_id },
      );
      if (isOrderPulled && isOrderPulled.order_id) {
        removeDigitalOrderFromLocalStorage(order_id);
      } else {
        window.pullPendingDigitalOrders(order_id);
      }
    }
  }
}

async function pullOrder(order_data) {
  if (order_data && order_data.tmpos_order_child) {
    console.log(
      `Message="Prepare the order to pull from digital order" OrderID="${order_data?.order_id}"`,
    );
    order_data.tmpos_order_child.map((item) => {
      if (item && item.extra_details && item.extra_details.alternative_title) {
        Object.assign(item, {
          alternative_title: item.extra_details.alternative_title,
        });
      }
      let posItem = window.allItemsList.find(
        (o) => Number(o.item_refid) === Number(item.item_id),
      );
      if (!posItem && window.platformCatalogueitems) {
        posItem = window.platformCatalogueitems.find(
          (o) => Number(o.item_id) === Number(item.item_id),
        );
      }
      if (posItem && !item.product_group_id) {
        Object.assign(item, {
          product_group_id: posItem.product_group_id,
          product_group_name: posItem.product_group_name,
        });
      }

      if (posItem && posItem.product_group_name && !item.product_group_name) {
        Object.assign(item, {
          product_group_name: posItem.product_group_name,
        });
      }
      if (posItem && !item.kitchen_dept) {
        Object.assign(item, { kitchen_dept: posItem.kitchen_dept });
      }
      if (posItem && !item.short_code) {
        Object.assign(item, { short_code: posItem.short_code });
      }
      if (posItem && !item.category_name) {
        Object.assign(item, {
          category_name: posItem['mpos_category.category_name'],
          alternative_category_name:
            posItem['mpos_category.alternative_category_name'],
        });
      }

      if (!item.category_name && posItem && posItem.category_ref_ids) {
        const category = window.platformCatalogueCategories.find(
          (c) => Number(c.category_refid) === Number(posItem.category_ref_ids),
        );
        if (category && category.category_name) {
          Object.assign(item, {
            category_name: category.category_name,
            alternative_category_name: category.alternative_category_name,
          });
        }
      }
      if (item.order_child_options) {
        Object.assign(item, {
          has_options: 1,
        });
      }
    });
  }

  if (
    [OrderState.CANCELLED].includes(
      String(order_data?.order_state).toLowerCase(),
    )
  ) {
    Object.assign(order_data, {
      order_state: OrderState.CANCELLED,
    });
  } else {
    Object.assign(order_data, {
      order_state: OrderState.FULFILLED,
    });
  }

  // check midnight sale count
  let countMidnightSale = false;
  if (
    window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1] != undefined
  ) {
    countMidnightSale =
      window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1].value ==
      '1';
  }

  // seperate bill number for online orders
  let seperateBillNumber = false;
  if (window.settingsConfig[SEPERATE_BILLING_FOR_OL_ORDER - 1] != undefined) {
    seperateBillNumber =
      window.settingsConfig[SEPERATE_BILLING_FOR_OL_ORDER - 1].value == '1';
  }

  if (
    [...Object.values(OnlineBillingTypeByName)].includes(
      order_data.billing_type,
    )
  ) {
    Object.assign(order_data, { seperateBillNumber });
  }

  let item_level_discount = 0;
  order_data.tmpos_order_child.forEach((item) => {
    if (item.discount) {
      item_level_discount += item.discount;
    }

    if (item && item.extra_details && item.extra_details.item_note) {
      Object.assign(item, {
        item_note: item.extra_details.item_note,
      });
    }

    // if (item.order_child_charges && item.order_child_charges.length) {
    //   const itemlevelCharges = [];
    //   for (const currentCharge of item.order_child_charges) {
    //     let chargeAmount = currentCharge.charge_amount;

    //     // for zomato order order level charges coming on item level
    //     // and on item getting charges of all qty but we expect charge of one qty
    //     if (order_data.billing_type !== 8 && currentCharge.per_fixed === 0) {
    //       chargeAmount = chargeAmount / item.quantity;
    //     }

    //     if (order_data.billing_type == 4 && currentCharge.per_fixed === 0) {
    //       chargeAmount = currentCharge.calculated_charge / item.quantity;
    //     }

    //     currentCharge.chargeAmount = chargeAmount;
    //     currentCharge.charge_amount = chargeAmount;
    //     currentCharge.amount = chargeAmount;
    //     itemlevelCharges.push({
    //       title: currentCharge.charge_title,
    //       per_or_fixed: currentCharge.per_fixed,
    //       calculated_charge: currentCharge.calculated_charge,
    //       calculated_tax: currentCharge.calculated_tax,
    //       amount: chargeAmount,
    //       // amount: currentCharge.calculated_charge,
    //       calculate_tax_for_item_charges:
    //         currentCharge.calculated_tax > 0 ? 1 : 0,
    //       is_tax_applicable: currentCharge.is_tax_applicable,
    //       tax_amount: currentCharge.tax_amount,
    //       is_tax_included: currentCharge.is_tax_included,
    //     });
    //   }
    //   Object.assign(item, {
    //     itemlevelCharges,
    //   });
    // }
  });

  if (
    order_data &&
    order_data.extra_details &&
    order_data.extra_details.start_preparing_at
  ) {
    Object.assign(order_data.extra_details, {
      delivery_at: order_data.extra_details.start_preparing_at,
    });
  }

  // console.log('order data:', order_data);
  if (order_data.extra_details) {
    Object.assign(order_data.extra_details, {
      // exlusive_tax: order_data.order_level_total_taxes,
      total_merchant_taxes: order_data.order_level_total_taxes,
      merchant_order_total: order_data.order_total,
      item_level_discount,
    });
  }

  if (
    // order_data.billing_type === 107 &&
    order_data.external_order_id &&
    order_data.external_order_id !== '0'
  ) {
    Object.assign(order_data.extra_details, {
      external_order_id: order_data.external_order_id,
    });
  }
  if (order_data.extra_details) {
    Object.assign(order_data.extra_details, { invoiceType: 'B2C' });
  }

  if (order_data.extra_details) {
    Object.assign(order_data.extra_details, {
      isOrderPulled: true,
    });
  }

  // console.log(order_data);
  Object.assign(order_data, {
    user_id: window.storeDetails.username,
    createdBy: window.storeDetails.username,
    discount: order_data.order_level_discount,
    coupon: order_data.coupan_code,
    couponDisounttype: order_data.coupan_type,
    couponDisounttotal: order_data.coupan_calculated_amt,
    couponDisount: order_data.coupan_value,
    couponDisountamt: order_data.coupan_value,
    extra_details: order_data.extra_details,
    countMidnightSale,
    delivery_boy_phone: Number(order_data.delivery_boy_phone) || null,
  });
  let tableName;
  let table_name;
  if (
    [...Object.values(OnlineBillingTypeByName)].includes(
      order_data.billing_type,
    )
  ) {
    // const billingTypename = String(
    //   BillingTypes[order_data.billing_type].toLowerCase(),
    // );
    const billingTypename =
      window.orderTypes[
        Number(order_data.billing_type)
      ].order_type?.toLowerCase();
    tableName = `${billingTypename}:${order_data.order_id}`;
    Object.assign(order_data, {
      table_name: tableName,
    });
  } else if (order_data.billing_type == OnlineBillingTypeByName.SWIGGY) {
    tableName = `swiggy:${order_data.order_id}`;
    Object.assign(order_data, {
      table_name: `swiggy:${order_data.order_id}`,
    });
  } else if (order_data.table_no) {
    Object.assign(order_data, {
      table_name: order_data.table_no,
    });
  } else {
    table_name = `Digital:${order_data.order_id}`;
    Object.assign(order_data, {
      table_name,
    });
  }

  if (order_data.room_no) {
    table_name = order_data.room_no;
    Object.assign(order_data, {
      table_name,
    });
  }

  let paymentisAvailable = false;
  if (
    order_data.tmpos_order_payment &&
    Array.isArray(order_data.tmpos_order_payment) &&
    order_data.tmpos_order_payment.length
  ) {
    const payment = order_data.tmpos_order_payment[0];
    if (order_data.billing_type == 104) {
      payment.payment_option = 'Online Paid';
    }
    Object.assign(order_data, {
      payment: payment.payment_option,
    });

    if (
      payment &&
      payment.payment_option &&
      ONLINEPLATFORM_PAYMENTMODES.includes(
        String(payment.payment_option).toLowerCase(),
      )
    ) {
      paymentisAvailable = true;
    }
  }

  if (
    [...Object.values(OnlineBillingTypeByName)].includes(
      order_data.billing_type,
    ) &&
    !paymentisAvailable
  ) {
    console.log(
      `Message="Changing online order payment mode" OrderID="${order_data.order_id}"`,
    );
    let paymentOptionname = OnlineBillingTypeByNumber[order_data.billing_type];

    if (order_data.billing_type == 104) {
      paymentOptionname = 'Online Paid';
    }

    Object.assign(order_data, {
      tmpos_order_payment: [
        {
          payment_option: paymentOptionname,
          amount: order_data.order_total,
          order_id: order_data.order_id,
          status_flag: 0,
          store_id: order_data.store_id,
        },
      ],
      payment: paymentOptionname,
    });
  }

  if (
    ![ZOMATO_BILLING_FLAG, SWIGGY_BILLING_FLAG, MAGICPIN_BILLING_FLAG].includes(
      order_data.billing_type,
    ) &&
    order_data.orderDateTime
  ) {
    // const orderDateTime = order_data.orderDateTime;
    // const date = new Date(orderDateTime);
    // const timestampInLocalTimezone = date.getTime();

    console.log(
      `Message="Order date time=${order_data.orderDateTime} for order_id=${order_data.order_id}"`,
    );
    const extractedDateTime = order_data.orderDateTime.split('.')[0]; // '2025-03-03T11:13:24'
    const date = new Date(extractedDateTime);
    const timestampInLocalTimezone = date.getTime();
    console.log(
      `Message="Order date time in local timestamp=${timestampInLocalTimezone} for order_id=${order_data.order_id}"`,
    );
    Object.assign(order_data, {
      created_time: timestampInLocalTimezone,
      actual_created_time: timestampInLocalTimezone,
    });
  }
  if (reduceStock) {
    let proceed = true;
    let errorMessage = 'Items not available';
    order_data.tmpos_order_child.forEach((item) => {
      const getItem = window.allItemsList.find(
        (i) => Number(i.item_refid) === Number(item.item_id),
      );

      if (getItem && getItem.current_stock < item.quantity) {
        errorMessage = `Only ${getItem.current_stock} items available of ${item.title} `;
        proceed = false;
        // window.notifyUser.showMessage(
        //   'error',
        //   `Only ${getItem.current_stock} items available of ${item.title} `,
        // );
      }
    });

    if (!proceed) {
      console.log(`Message="${errorMessage}" OrderID="${order_data.order_id}"`);
      // return;
    }
  }

  isDigitalBillSaveisinprocess = true;
  console.log('Message=Digital order pull data', JSON.stringify(order_data));
  if (
    order_data &&
    order_data.app_source === 'Call Center' &&
    !isCallCenterEnabled
  ) {
    return;
  }
  const pullresponse = await betteripcRenderer.callMain(
    PULL_DIGITALORDER,
    order_data,
  );

  if (pullresponse && pullresponse.type == 'success') {
    isDigitalBillSaveisinprocess = false;
    removeDigitalOrderFromLocalStorage(pullresponse.order_id);
    if (
      window.reduceInventorystatus &&
      !ORDERSTATEFOR_REDUCEINVENTORY.includes(order_data.order_state)
    ) {
      // betteripcRenderer.callMain(MISC_IPC.AUTO_REDUCE_INVENTORY);
      initAutoReduceInventory();
    }
    sendBillsettledevent(pullresponse);
    ipcRenderer.send(FETCH_KOTBILL_NUMBER, undefined);
    if (
      window.settingsConfig[PULLORDER_ONACCEPT - 1] &&
      window.settingsConfig[PULLORDER_ONACCEPT - 1].value === '1'
    ) {
      checkPullPendingOrder();
    }
    window.notifyUser.showMessage(pullresponse.type, pullresponse.msg);
    window.refreshDashboard = true;
    if ($('#closeDayAndShiftModal').is(':visible')) {
      $('#closeDayAndShiftModal').modal('hide');
    }
  } else {
    isDigitalBillSaveisinprocess = false;
    window.notifyUser.showMessage(pullresponse.type, pullresponse.msg);
  }
}

// if order pull is disabled then multiple kot and bills are printing
const kotPrintOrderIds = new Set();
const billPrintOrderIds = new Set();

window.pullDigitalOrderFromRemote = async function (order_data, order_id) {
  if (window.digitalOrderAccessEnabled) {
    const isOrderPulled = await window.betteripcRenderer.callMain(
      CHECK_IF_ORDER_IS_PULLED,
      { order_id },
    );

    console.log('Pull digital order from remote::', order_data);
    // if (fetchReportAsPerCloseDay && !window.start_day_date) {
    //   console.log(
    //     `Message="Day is not started yet so can't pull order"`,
    //     order_id,
    //   );
    //   return;
    // }
    if (isOrderPulled) {
      console.log('Message="Order pulled already"', order_id);
      return;
    }
    if (
      window.settingsConfig[PULLORDER_ONACCEPT - 1] &&
      window.settingsConfig[PULLORDER_ONACCEPT - 1].value === '1'
    ) {
      if (isDigitalBillSaveisinprocess) {
        await sleep(400);
      }
      console.log(`Message="start order pulling"`);
      await pullOrder(order_data, order_id);
    }

    if (
      window.settingsConfig[PRINTKOT_ONORDER_ACCEPT - 1] &&
      window.settingsConfig[PRINTKOT_ONORDER_ACCEPT - 1].value === '1'
    ) {
      if (kotPrintOrderIds.has(order_id)) {
        return;
      }
      kotPrintOrderIds.add(order_id);
      await generateOnlinekot(true, JSON.stringify(order_data));
      await sleep(100);
    }

    if (
      window.settingsConfig[PRINTBILL_ONORDER_ACCEPT - 1] &&
      window.settingsConfig[PRINTBILL_ONORDER_ACCEPT - 1].value === '1'
    ) {
      if (billPrintOrderIds.has(order_id)) {
        return;
      }
      billPrintOrderIds.add(order_id);
      await printonelineBill(true, JSON.stringify(order_data));
      await sleep(100);
    }
  }
};

window.printCancelledOrderKOT = async function name(order_data) {
  await generateOnlinekot(true, JSON.stringify(order_data));
  await sleep(100);
};

function initialize() {
  if (global.storeDetails && global.storeDetails.extra_info) {
    const extra_info = safeParse(global.storeDetails.extra_info);
    bill_number_length = Number(extra_info.bill_number_length);
    if (extra_info.call_center) {
      isCallCenterEnabled = true;
    }
  }

  if (window.settingsConfig[PRINT_KD_WISE_FOR_OL_ORDER - 1] !== undefined) {
    printolOrderKdWise =
      window.settingsConfig[PRINT_KD_WISE_FOR_OL_ORDER - 1].value;
  }

  if (window.settingsConfig[AUTO_OUTOF_STOCK - 1]) {
    reduceStock = window.settingsConfig[AUTO_OUTOF_STOCK - 1].value === '1';
  }

  if (
    window.settingsConfig[SHOW_ADDONS_SEPERATELY_FOR_ONLINE_OREDERS - 1] !==
    undefined
  ) {
    showAddonsSeperately =
      window.settingsConfig[SHOW_ADDONS_SEPERATELY_FOR_ONLINE_OREDERS - 1]
        .value === '1';
  }
  if (window.settingsConfig && window.settingsConfig.length > 0) {
    fetchReportAsPerCloseDay =
      window.settingsConfig[FETCH_REPORT_AS_PER_CLOSE_DAY - 1].value === '1';
  }
  if (
    window.settingsConfig[PULLORDER_ONACCEPT - 1] &&
    window.settingsConfig[PULLORDER_ONACCEPT - 1].value === '1'
  ) {
    checkPullPendingOrder();
  }
}

window.checkPullPendingOrdersFromRemote = () => {
  checkPullPendingOrder();
};

setTimeout(() => {
  initialize();
}, 5000);
