/* eslint-disable no-await-in-loop */
/* eslint-disable no-lone-blocks */
/* eslint-disable prefer-destructuring */
/* eslint-disable default-case */
/* eslint-disable camelcase */
const {
  TAKEAWAY_FLAG_ID,
  DINEIN_FLAG_ID,
  HOMED_FLAG_ID,
  DINEIN_TAB_ID,
  VIRTUALTABLE_FLAG_ID,
  TAKEAWAY_TAB_ID,
  QUICK_TAB_ID,
  DINEIN_BILLING_FLAG,
  TAKEAWAY_BILLING_FLAG,
  HOMED_BILLING_FLAG,
  ITEM_TAX_TYPES,
  PRINTER_ACTION_TYPES,
  CUSTOMISED_DISCOUNT_ORDERTYPE,
  COMMON_STATE,
  SYNC_STATUS_FLAG,
  QUICKBILL_BILLING_FLAG,
  QUICKBILL_FLAG_ID,
  DELIVERY_TAB_ID,
} = require('../util/Constants');

const {
  SAVE_BILL_FOR_CSK,
  SAVE_BILL_FOR_CSK_REPLY,
  FETCH_BILL_DATA_FOR_CSK_REPLY,
  ORDER_IPC,
  GET_ORDER_TOTAL,
  FETCH_BILL_DATA_FOR_CSK,
  SEND_ORDER_TOTAL,
  SETTLE_BILL_IN_BACKGROUND,
  SETTLE_BILL_IN_BACKGROUND_REPLY,
  DELETE_TABLE,
  SEND_BACKGROUND_SETTLEMENT_REQUEST,
} = require('../util/IPC_Messages');
const {
  TABLE_COVERS_REQUIRED,
  DEFAULT_SENDEBILL_CHECK,
  PRINTERS,
  SHOW_CUSTOMERON_BILL_CHECK,
  SHOW_DEFAULT_PAYMENT,
  PRINTER_58_CONFIG,
  PRINTER_80_CONFIG,
  ASK_PAYMODE_ON_SAVEBILL,
  SHOW_KOTNOS_ONTABLE,
  DISPLAYTIME_ON_TABLES,
  COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY,
  SHOW_ORDERSTATE_DETAILS,
  USE_SEPERATE_VIEWS,
  SEND_CUSTOMERDETAILSTODBOY_CHECK,
  MAKE_DELIVERY_BOY_COMPULSORY,
} = require('../util/SettingIDs');
const TableUtils = require('../util/TableUtils');
const { OrderState, OrderTypes, BillingTypes } = require('../util/DBUtil');

let billstatusReason;
let orderStatusReason;
const {
  showLoader,
  sendCustomersinfotodboy,
  sendEbill,
} = require('./CommonUtils');
const { PRINTER_SIZES_REFID } = require('../util/PrintersUtil');
const isObject = require('lodash/isObject');
const {
  addtabletowatchList,
  removetablefromwathersList,
} = require('./Tableobserver');
const { sendPointruleactionifexists } = require('./LoyaltyController');
const { ORDERSTATEFOR_REDUCEINVENTORY } = require('../util/OrderStates');
const { sendBillsettledevent } = require('./ClientrequestHandler');
const {
  makeUpdateTableColorRequest,
  makeFetchTableDataRequest,
} = require('../renderer/helper/Table.helper');
const {
  checkBillPrintedRequest,
  sendCouponHistoryRequest,
  updateOrderDataRequest,
} = require('../renderer/helper/Order.helper');
const {
  autoReduceInventoryRequest,
} = require('../renderer/helper/Inventory.helper');
const { sortBy, cloneDeep } = require('lodash');
const {
  getPrinterbytable,
  getPrinterbyordertype,
} = require('./Printer/Helper');
const { ORDER_SOURCE_FOR_PRINT } = require('../constant');
const { sleep } = require('../util/MiscUtil');
const { TAX_CALCULATION_ON } = require('../constant/tax');
const { safeParse } = require('../util/RendererUtils');
const { applyItemLevelDiscount } = require('./ApplyDiscount/itemlevelDiscount');
const { ORDER } = require('../server/SocketEvents');
const { roundToStep } = require('./calculations');
const {
  OrderHubSaveBillTaskQueue,
} = require('../renderer/Queue/OrderHub.SaveBill');

let calculationDone = false;
window.savebillisinProgress = false;
let askfordinecoversFirst = false;
let showkotnosonTable = false;
let askforpaymodeonSavebill = false;
let showdefaultPayment = false;
let defaultebillCheck = false;
let showcustomeronbillCheck = false;
let istakeawaywindowSelected = true;
let displaytimeonTables = false;
let countMidnightSale = true;
let showOrderstatusontable = false;
let isSendCustomerDetailsToDBoyEnabled = false;
let deliveryBoyMandatory = true;
let settlebilltableButton;
let MULTI_TAX = true;
let savebillLockStartedAt = null;
let saveAndPrintbillRequestLockStartedAt = null;
let isProcessingSavePrint = false;

const MAX_SAVEBILL_TIME = 10000; // 10 seconds

// Functions
let sendBillsavedevent;
let preshowPaymentWindow;
let sendDiscountupdate;

// update table color
async function initUpdateTableColor(data) {
  try {
    await makeUpdateTableColorRequest(data);
  } catch (error) {
    console.error(`Message="Error while updating table color" `, error);
  }
}

// auto reduce inventory
async function initAutoReduceInventory() {
  await autoReduceInventoryRequest();
}

// send coupon history
async function initSendCouponHistory() {
  await sendCouponHistoryRequest();
}

// check bill printed
async function initCheckBillPrinted(data) {
  try {
    const response = await checkBillPrintedRequest(data);
    return response;
  } catch (error) {
    console.error(`Message="Error while checking bill print" `, error);
  }
  return undefined;
}
function roundOffLastDigit(num) {
  // let temp = num * 1000;
  // temp = Math.floor(temp / 10) * 10;
  // return temp / 1000;
  let temp = num * 1000;
  const lastDigit = temp % 10;
  if (lastDigit >= 5) {
    temp = Math.ceil(temp / 10) * 10;
  } else {
    temp = Math.floor(temp / 10) * 10;
  }
  return temp / 1000;
}
function resetItemtax(item) {
  if (item) {
    Object.assign(item, {
      item_tax_value: 0,
      total: item.recalculatedAmount || 0,
      tax_value: 0,
      item_tax_method: undefined,
      item_tax_name: undefined,
      item_tax_per: 0,
    });
  }
}

function calculateTax({ tax_percent, inclusive, amount, is_devidable }) {
  let taxTotal = 0;
  let taxPerct = 0;

  // const TEMP_ROUNDOFF_UPTO = Number(window.ROUNDOFF_UPTO || 1) + 1;

  if (inclusive) {
    taxTotal = Number(
      taxTotal + ((amount || 0) / (100 + tax_percent)) * tax_percent,
    );
  } else {
    // Check for exclusive case
    // eslint-disable-next-line no-lonely-if
    if (is_devidable) {
      taxPerct = Number((tax_percent / 2 / 100) * (amount || 0));
      taxPerct = roundAmountUptoDecimals(taxPerct, ROUNDOFF_UPTO);
      taxTotal = Number(taxTotal + taxPerct * 2);
    } else {
      taxTotal = Number(taxTotal + ((amount || 0) * tax_percent) / 100);
    }
  }
  return roundAmountUptoDecimals(taxTotal, ROUNDOFF_UPTO);
}

function initialiseCSKPrinthandler({
  passedsendBillsavedevent,
  passedpreshowPaymentWindow,
  passedsendDiscountupdate,
}) {
  sendBillsavedevent = passedsendBillsavedevent;
  preshowPaymentWindow = passedpreshowPaymentWindow;
  sendDiscountupdate = passedsendDiscountupdate;

  if (window.settingsConfig[TABLE_COVERS_REQUIRED - 1] != undefined) {
    try {
      let rawcoversSettings;
      const { value } = window.settingsConfig[TABLE_COVERS_REQUIRED - 1];
      if (value.constructor === 'test'.constructor) {
        rawcoversSettings = safeParse(
          window.settingsConfig[TABLE_COVERS_REQUIRED - 1].value,
        );
      } else {
        rawcoversSettings = value;
      }
      if (rawcoversSettings && isObject(rawcoversSettings)) {
        askfordinecoversFirst = rawcoversSettings.dinein;
        askforquickbillcoversFirst = rawcoversSettings.quick;
        askfortahdcoversFirst = rawcoversSettings.takeaway;
      }
    } catch (error) {
      console.log(error);
    }
  }
  if (window.settingsConfig[SHOW_KOTNOS_ONTABLE - 1] !== undefined) {
    showkotnosonTable =
      window.settingsConfig[SHOW_KOTNOS_ONTABLE - 1].value === '1';
  }

  if (window.settingsConfig[ASK_PAYMODE_ON_SAVEBILL - 1] !== undefined) {
    askforpaymodeonSavebill =
      window.settingsConfig[ASK_PAYMODE_ON_SAVEBILL - 1].value === '1';
  }

  if (window.settingsConfig[SHOW_DEFAULT_PAYMENT - 1] !== undefined) {
    showdefaultPayment =
      window.settingsConfig[SHOW_DEFAULT_PAYMENT - 1].value === '1';
  }

  if (window.settingsConfig[DEFAULT_SENDEBILL_CHECK - 1] !== undefined) {
    defaultebillCheck =
      window.settingsConfig[DEFAULT_SENDEBILL_CHECK - 1].value === '1';
  }

  if (window.settingsConfig[SHOW_CUSTOMERON_BILL_CHECK - 1] !== undefined) {
    showcustomeronbillCheck =
      window.settingsConfig[SHOW_CUSTOMERON_BILL_CHECK - 1].value === '1';
  }
  if (window.settingsConfig[DISPLAYTIME_ON_TABLES - 1] !== undefined) {
    displaytimeonTables =
      window.settingsConfig[DISPLAYTIME_ON_TABLES - 1].value === '1';
  }
  if (
    window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1] !== undefined
  ) {
    countMidnightSale =
      window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1].value ===
      '1';
  }

  if (window.settingsConfig[SHOW_ORDERSTATE_DETAILS - 1] !== undefined) {
    showOrderstatusontable =
      window.settingsConfig[SHOW_ORDERSTATE_DETAILS - 1].value === '1';
  }

  if (
    window.settingsConfig[SEND_CUSTOMERDETAILSTODBOY_CHECK - 1] !== undefined
  ) {
    isSendCustomerDetailsToDBoyEnabled =
      window.settingsConfig[SEND_CUSTOMERDETAILSTODBOY_CHECK - 1].value === '1';
  }

  if (window.settingsConfig[MAKE_DELIVERY_BOY_COMPULSORY - 1] !== undefined) {
    deliveryBoyMandatory =
      window.settingsConfig[MAKE_DELIVERY_BOY_COMPULSORY - 1].value === '1';
  }
}
// let defaultebillCheck = false;
let currenttableButton; // kept for backward compat with non-CSK flows
const saveBillContextMap = new Map(); // table_id → tableButton element for concurrent request isolation

window.busyTableData = {};

async function savebilldata(currenttableData, tableButton) {
  if (tableButton === undefined) {
    return;
  }
  if (currenttableData) {
    const table_id = tableButton.id.replace('table_', '');
    if (currenttableData.table_id == table_id) {
      const tabledetails = {
        KOT_Number: currenttableData?.kot_numbers?.join(','),
        Table_Name: currenttableData.table_name,
        Bill_Number: currenttableData.order_id,
        Customer_Mobile: currenttableData.customerMobile,
        Customer_Name: currenttableData.customerName,
      };

      const extraDetails = safeParse(currenttableData?.extra_details);
      if (extraDetails && extraDetails.order_number) {
        Object.assign(tabledetails, {
          Order_Number: extraDetails.order_number,
        });
      }

      window.busyTableData[currenttableData.table_id] = tabledetails;
      // if (currenttableData.table_id) {
      tableButton.data.details.instructions = undefined;
      tableButton.data.details.draftprint_status = 0;
      if (currenttableData.tableState) {
        tableButton.data.details.color =
          currenttableData.tableState.table_color;

        if (!currenttableData.isTerminalTable) {
          $(`#${tableButton.id}`).css(
            'background-color',
            currenttableData.tableState.table_color,
          );
        }
      }

      if (currenttableData.status == 200) {
        const { bill_number } = currenttableData;
        const { payid } = currenttableData;
        const { kot_id } = currenttableData;
        const { order_id } = currenttableData;
        const { billDetails } = currenttableData;
        const { kotcreatedAt } = currenttableData;

        if (bill_number != 0) {
          if (window.showbillDetails && order_id != 0) {
            //    try {
            //       $('#' + tableButton.id)
            //          .find('#tablebillnumberlabel')
            //          .text('Bill No: ' + order_id);
            //    } catch (error) {
            //    }
          }

          const { tableState } = currenttableData;
          if (tableState && !currenttableData.isTerminalTable) {
            $(`#${tableButton.id}`).css(
              'background-color',
              tableState.table_color,
            );
            tableButton.data.details.color = tableState.table_color;
            tableButton.data.table_action_flag = tableState.table_action_flag;
          } else {
            if (!currenttableData.isTerminalTable) {
              $(`#${tableButton.id}`).css(
                'background-color',
                TableUtils.Colors.BILL_SAVED,
              );
            }

            tableButton.data.details.color = TableUtils.Colors.BILL_SAVED;
            tableButton.data.table_action_flag = TableUtils.State.BILL_SAVED;
          }

          tableButton.data.details.payment_mode = currenttableData.payment_mode;
        } else if (currenttableData.draftprint_status) {
          tableButton.data.details.color =
            currenttableData.tableState.table_color;

          if (!currenttableData.isTerminalTable) {
            $(`#${tableButton.id}`).css(
              'background-color',
              currenttableData.tableState.table_color,
            );
          }

          tableButton.data.table_action_flag =
            TableUtils.State.DRAFT_BILL_PRINTED;
        } else {
          // tableButton.data.details.color = TableUtils.Colors.KOT_SAVED;
          // $('#' + tableButton.id).css("background-color", TableUtils.Colors.KOT_SAVED);
          // tableButton.data.table_action_flag = TableUtils.State.KOT_SAVED;
          tableButton.data.details.color =
            currenttableData.tableState.table_color;

          if (!currenttableData.isTerminalTable) {
            $(`#${tableButton.id}`).css(
              'background-color',
              currenttableData.tableState.table_color,
            );
          }

          tableButton.data.table_action_flag =
            currenttableData.tableState.table_action_flag;
        }

        const kot_numbers = currenttableData.kot_numbers.join(',');
        if (showkotnosonTable) {
          $(`#${tableButton.id}`)
            .find('#tablekotnosLabelid')
            .text(`KOT : ${kot_numbers}`)
            .prop('title', `${kot_numbers}`);
        }

        if (currenttableData && currenttableData.extra_details) {
          const eDetails = safeParse(currenttableData.extra_details);
          if (eDetails && eDetails.order_number) {
            $(`#${tableButton.id}`)
              .find('#tableOrdernoLabelid')
              .text(`# ${eDetails.order_number}`)
              .prop('title', `Order Number${eDetails.order_number}`);
          }
        }

        if (currenttableData.customerName) {
          $(`#${tableButton.id}`)
            .find('#tablecustomernameLabelid')
            .html(currenttableData.customerName);
        } else {
          $(`#${tableButton.id}`).find('#tablecustomernameLabelid').html('');
        }

        if (window.showCaptainNameOnTable) {
          $(`#${tableButton.id}`)
            .find('#tableCreatedByLabelid')
            .text(`${currenttableData.createdBy}`)
            .prop('title', `Captain: ${currenttableData.createdBy}`);
        }
        if (window.showWaiterNameOnTable && currenttableData.waiter) {
          $(`#${tableButton.id}`)
            .find('#tablewaiterLabelid')
            .html(currenttableData.waiter);
        }

        tableButton.data.details.kot_numbers = currenttableData.kot_numbers;

        tableButton.data.details.charges = currenttableData.charges;
        if (payid != undefined && payid != 0) {
          tableButton.data.details.paymentAdded = true;
        }

        let noofPersons = 1;
        if (currenttableData.noofPersons)
          noofPersons = currenttableData.noofPersons;
        const { customerName } = currenttableData;
        const { customerMobile } = currenttableData;
        const { ebillCheckstat } = currenttableData;
        const { showonBillstat } = currenttableData;
        const { deliveryboy_id } = currenttableData;
        if (customerName && customerMobile) {
          const customer = getCustomer(false, customerMobile);
          if (customer) {
            tableButton.data.details.customer = customer;
          } else {
            tableButton.data.details.customer = {
              name: customerName,
              phone: customerMobile,
              address_line1: '',
              address_line2: '',
            };
          }
        }

        const { discount_type } = currenttableData;
        const { discount } = currenttableData;

        //  if (currenttableData.billItems != undefined && currenttableData.billItems.length > 0) {
        //     currenttableData.billItems.forEach(element => {
        //     //    addBillRow(currentbillTable, element);
        //     });
        //  }
        let { order_type_flag } = currenttableData;
        let applyDefaultcharges =
          currenttableData.charges == undefined ||
          (currenttableData.charges &&
            Array.isArray(currenttableData.charges) &&
            currenttableData.charges.length == 0);

        // Check if previously default charges were removed or not
        if (
          currenttableData.field2 &&
          Number(currenttableData.field2) &&
          [COMMON_STATE.ACTIVE, COMMON_STATE.INACTIVE].includes(
            Number(currenttableData.field2),
          )
        ) {
          applyDefaultcharges =
            Number(currenttableData.field2) == COMMON_STATE.INACTIVE;
          tableButton.data.details.defaultchargesRemoved = true;
        }

        // check for waiter
        tableButton.data.details.waiter = currenttableData.waiter || undefined;
        tableButton.data.details.waiter_id =
          currenttableData.waiter_id || undefined;
        tableButton.data.details.createdBy =
          currenttableData.createdBy || undefined;
        tableButton.data.details.draftprint_status =
          currenttableData.draftprint_status;
        tableButton.data.details.bill_id = currenttableData.bill_id;
        tableButton.data.details.deliveryboy_id =
          currenttableData.deliveryboy_id || undefined;

        if (order_type_flag) {
          switch (order_type_flag) {
            case 0:
              order_type_flag = QUICKBILL_FLAG_ID;
              break;

            case 1:
              order_type_flag = DINEIN_FLAG_ID;
              break;

            case 2:
              order_type_flag = TAKEAWAY_FLAG_ID;
              break;

            case 3:
              order_type_flag = HOMED_FLAG_ID;
              break;
          }
        }
        // tableButton.data.order_type_flag = order_type_flag;
        tableButton.data.details.order_type_flag = order_type_flag;
        // checkifduePayavailable(customerMobile);

        switch (order_type_flag) {
          case TAKEAWAY_FLAG_ID:
          case HOMED_FLAG_ID:
            // Add Default charges if any
            // Newly added
            if (applyDefaultcharges) {
              if (order_type_flag === HOMED_FLAG_ID) {
                if (
                  window.defaulthomedOrdercharges != undefined &&
                  window.defaulthomedOrdercharges.length > 0
                ) {
                  tableButton.data.details.charges =
                    window.defaulthomedOrdercharges;
                }
              } else if (
                window.defaulttakeawayOrdercharges != undefined &&
                window.defaulttakeawayOrdercharges.length > 0
              ) {
                tableButton.data.details.charges =
                  window.defaulttakeawayOrdercharges;
              }
            }
            break;
          case DINEIN_FLAG_ID:
          case VIRTUALTABLE_FLAG_ID:
            if (
              applyDefaultcharges &&
              window.defaultdineinOrdercharges != undefined &&
              window.defaultdineinOrdercharges.length > 0
            ) {
              if (tableButton?.data['mpos_department.section'] == 1) {
                // check if bar section charges is present and remove it
                const filteredCharges = window.defaultdineinOrdercharges.filter(
                  (charge) => {
                    const extraDetails = safeParse(charge.extra_details);
                    return extraDetails.bar_section_billing !== 1;
                  },
                );
                tableButton.data.details.charges = filteredCharges;
              } else {
                tableButton.data.details.charges =
                  window.defaultdineinOrdercharges;
              }
            }

            break;
          default:
            break;
        }

        tableButton.data.details.bill_number = bill_number;
        tableButton.data.details.order_id = order_id;
        tableButton.data.details.items = currenttableData.billItems;
        tableButton.data.details.printBillItems =
          currenttableData.printBillItems;
        tableButton.data.details.persons = noofPersons;
        tableButton.data.details.field2 = currenttableData?.billDetails?.field2;
        tableButton.data.details.order_note = currenttableData?.order_note;
        tableButton.data.details.reservation_id =
          currenttableData?.tableState?.reservation_id;

        tableButton.data.details.tableReservationDetails =
          currenttableData?.tableReservationDetails;

        applyDiscounttotable(tableButton, {
          rate: discount,
          discount_type,
          discount_name: currenttableData.discountTitle || '',
          product_groups: currenttableData.discounted_product_groups,
        });

        tableButton.data.details.couponDisountamt =
          currenttableData.couponDisount;
        tableButton.data.details.couponDisounttype =
          currenttableData.couponDisounttype;
        tableButton.data.details.coupon = currenttableData.coupon;
        tableButton.data.details.kotcreatedAt = kotcreatedAt;

        tableButton.data.details.remoteKot = currenttableData.remoteKot;
        tableButton.data.details.remoteOrder_id =
          currenttableData.remote_order_id;

        if (currenttableData.is_pre_order) {
          tableButton.data.details.preorderInfo =
            currenttableData.preorderInfo || undefined;
          tableButton.data.details.is_pre_order = currenttableData.is_pre_order;
        } else {
          tableButton.data.details.preorderInfo = undefined;
          tableButton.data.details.is_pre_order = 0;
        }
        tableButton.data.details.custom_bill_number =
          currenttableData.custom_bill_number || undefined;

        //  if (displaytimeonTables) {
        //     addtabletowatchList(tableButton.id, kotcreatedAt);
        //  }

        billstatusReason = currenttableData.discountInstruction;
        if (billDetails) {
          tableButton.data.details.due_payment = billDetails.due_payment;
          // tableButton.data.details.cust_paid_amount =
          //   billDetails.cust_paid_amount || undefined;
          tableButton.data.details.isBillModified =
            billDetails.isBillModified || undefined;
          tableButton.data.details.print_status =
            billDetails.print_status || undefined;
          if (billDetails.extra_details) {
            tableButton.data.details.extra_details = safeParse(
              billDetails.extra_details,
            );
          }
          tableButton.data.details.payment_modes = billDetails.payment_modes;
          tableButton.data.details.instructions =
            billDetails.instructions || '';
          billstatusReason = billDetails.instructions || '';
          orderStatusReason = billDetails.field1 || '';
        }

        //  activateTab(tabtoSwitch);
        precalculateDetailsCheck(tableButton);
        if (
          tableButton.data.details.extra_details &&
          currenttableData.autoSettled
        ) {
          Object.assign(tableButton.data.details.extra_details, {
            autoSettled: currenttableData.autoSettled,
          });
        } else if (
          !tableButton.data.details.extra_details &&
          currenttableData.autoSettled
        ) {
          const extra_details = {
            autoSettled: currenttableData.autoSettled,
          };
          Object.assign(tableButton.data.details, {
            extra_details,
          });
        }
      } else {
        tableButton.data.details.kotcreatedAt = undefined;
      }
      $('#takeawayebillBillcheckid').prop('checked', defaultebillCheck);
      $('#ebillBillcheckid').prop('checked', defaultebillCheck);
    }

    return 'success';
  }
}

function applyDiscounttotable(tableInstance, discountData) {
  if (tableInstance && discountData) {
    tableInstance.data.details.discount = discountData.rate;
    tableInstance.data.details.discount_type = discountData.discount_type;
    tableInstance.data.details.discounted_product_groups =
      discountData.product_groups;
    tableInstance.data.details.discount_title =
      discountData.discount_name || '';
    tableInstance.data.details.instructions = discountData.instructions || '';
  }
}

async function makesaveBillrequest({
  shouldprintBill,
  isRequestFromCsk,
  cust_paid_amount,
  return_amount,
  printBillOnBothSide,
  sendImageToCSK,
  socketUserId,
  cskPrintEvent,
  printWidth,
  username,
  tableButton,
}) {
  if (tableButton == undefined) {
    window.savebillisinProgress = false;

    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.pleaseSelectTheTable'),
    );
    return 'failure';
  }

  if (
    tableButton.data.details.bill_number !== undefined &&
    tableButton.data.details.bill_number !== 0
  ) {
    const isBillPrinted = await initCheckBillPrinted({
      order_id: tableButton.data.details.bill_number,
      store_id: window.storeDetails.store_id,
    });
    if (
      shouldprintBill &&
      window.reprintBill &&
      isBillPrinted.length > 0 &&
      isBillPrinted[0].print_status !== 0
    ) {
      window.window.savebillisinProgress = false;

      window.notifyUser.showMessage(
        'error',
        'Bill is printed already. You cannot reprint same bill',
      );
      return 'failure';
    }
    window.notifyUser.showMessage('success', 'Bill already saved');
    // return;
  }
  window.savebillisinProgress = true;

  if (
    (!window.allowModifyBill &&
      tableButton.data.details.bill_number != undefined &&
      tableButton.data.details.bill_number != 0) ||
    (window.allowModifyBill &&
      tableButton.data.details.bill_number != undefined &&
      tableButton.data.details.bill_number != 0 &&
      tableButton.data.details.isBillModified == 1)
  ) {
    if (shouldprintBill) {
      await printBill({
        isdraftBill: false,
        forQuickbill: false,
        currenttable: tableButton,
        isRequestFromCsk,
        printBillOnBothSide,
        sendImageToCSK,
        socketUserId,
        cskPrintEvent,
        printWidth,
        currenttablebuttonData: cloneDeep(tableButton.data),
      });
      updatetableStatusrequest({
        table_id: tableButton.data.id,
        table_action_flag: TableUtils.State.BILL_PRINTED,
        table_color: TableUtils.Colors.BILL_PRINTED,
      });
    }
    return true;
  }

  // showLoader({
  //   title: 'Saving Bill',
  //   text: $.i18n.t('controller:orderController.pleaseWait'),
  // });
  if (
    tableButton.data.details.items != undefined &&
    tableButton.data.details.items.length > 0
  ) {
    let billTotal = tableButton.data.details.order_total;
    let customer_name;
    let customer_mobile;
    const table_id = tableButton.id.replace('table_', '');
    let persons = 1;
    const { items } = tableButton.data.details;
    let deliveryboy_id = 0;
    let delivery_boy_name;
    let delivery_boy_phone;
    let askcoversCheck = false;
    let isPreorder = false;

    console.log(
      `Message="Should print bill=${shouldprintBill} for table_id=${table_id}"`,
    );
    /**
     * Check for default charges
     */
    istakeawaywindowSelected = $('#switchcheckId').is(':checked');
    let { charges } = tableButton.data.details;
    const { defaultchargesRemoved } = tableButton.data.details;
    let billing_type = DINEIN_BILLING_FLAG;
    switch (tableButton.data.order_type_flag) {
      case TAKEAWAY_FLAG_ID:
        {
          if (
            (charges == undefined || charges.length == 0) &&
            !defaultchargesRemoved
          ) {
            calculateAgain = true;
            charges = window.defaulttakeawayOrdercharges;
            tableButton.data.details.charges = charges;
            await precalculateDetailsCheck(tableButton);
          }

          if (!billTotal) billTotal = $('#takeawaybillGrandtotal').text();
          // customer_name = $('#takeawaykotcustomernameField').val();
          // customer_mobile = $('#takeawaykotcustomermobileField').val();
          // persons = $('#takeawaynoofpersonsField').val();
          billing_type = TAKEAWAY_BILLING_FLAG;

          askcoversCheck = askfortahdcoversFirst;
          // $('#tatable-actions-divid *').prop('disabled', true);
          // $('#tablesContainer *').prop('disabled', true);
          isPreorder = $('#takeawayPreordercheckid').is(':checked');
        }
        break;
      case HOMED_FLAG_ID:
        {
          if (
            (charges == undefined || charges.length == 0) &&
            !defaultchargesRemoved
          ) {
            calculateAgain = true;
            charges = window.defaulthomedOrdercharges;
            tableButton.data.details.charges = charges;
            await precalculateDetailsCheck(tableButton);
          }

          if (!billTotal) billTotal = $('#deliverybillGrandtotal').text();
          // customer_name = $('#deliverykotcustomernameField').val();
          // customer_mobile = $('#deliverykotcustomermobileField').val();
          // persons = $('#takeawaynoofpersonsField').val();

          billing_type = HOMED_BILLING_FLAG;
          // const selection = $(
          //   '#dboyselectionId option:selected:not([disabled])',
          // );
          if (tableButton.data.details.deliveryboy_id) {
            const selection = window.deliveryBoys.find(
              (b) => b.id === tableButton.data.details.deliveryboy_id,
            );
            deliveryboy_id = selection.id;
            delivery_boy_phone = selection.phone;
            delivery_boy_name = selection.name;
          }
          askcoversCheck = askfortahdcoversFirst;
          // $('#tatable-actions-divid *').prop('disabled', true);
          // $('#tablesContainer *').prop('disabled', true);
          isPreorder = $('#takeawayPreordercheckid').is(':checked');
        }
        break;
      case DINEIN_FLAG_ID:
      case VIRTUALTABLE_FLAG_ID:
        {
          if (
            (charges == undefined || charges.length == 0) &&
            !defaultchargesRemoved
          ) {
            calculateAgain = true;
            // charges = window.defaultdineinOrdercharges;
            // tableButton.data.details.charges = charges;
            if (tableButton?.data['mpos_department.section'] == 1) {
              // check if bar section charges is present and remove it
              const filteredCharges = window.defaultdineinOrdercharges.filter(
                (charge) => {
                  const extraDetails = safeParse(charge.extra_details);
                  return extraDetails.bar_section_billing !== 1;
                },
              );
              tableButton.data.details.charges = filteredCharges;
            } else {
              tableButton.data.details.charges =
                window.defaultdineinOrdercharges;
            }
            await precalculateDetailsCheck(tableButton);
          }

          if (!billTotal) billTotal = $('#billGrandtotal').text();
          // customer_name = $('#kotcustomernameField').val();
          // customer_mobile = $('#kotcustomermobileField').val();
          // persons = $('#noofpersonsField').val();
          billing_type = DINEIN_BILLING_FLAG;
          askcoversCheck = askfordinecoversFirst;
          // $('#table-actions-divid *').prop('disabled', true);
          // $('#tablesContainer *').prop('disabled', true);
        }
        break;
      default:
        break;
    }

    if (!persons && askcoversCheck) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:orderController.invalidCovers'),
      );
      return;
    }
    // const customer = getCustomer(false, customer_mobile);
    const customer = tableButton.data.details.customer;
    // let order_id = uniqid();
    // let order_id
    // if (tableButton.data.details.remoteKot) {
    //    order_id = tableButton.data.details.remoteOrder_id
    //    billing_type = tableButton.data.details.billing_type
    // } else {
    //    order_id = window.generateId();
    // }
    if (tableButton?.data?.details?.persons) {
      persons = tableButton.data.details.persons;
    }
    let payment_mode = defaultPaymentoption;
    if (
      tableButton.data &&
      tableButton.data.details &&
      tableButton.data.details.payment_mode
    ) {
      payment_mode = tableButton.data.details.payment_mode;
    }
    if (defaultPaymentoption === 'None') {
      payment_mode = undefined;
    }
    const order_id = window.generateId();
    let paymentDetails;
    if (defaultPaymentoption !== 'None') {
      paymentDetails = {
        order_id,
        payment_option: payment_mode,
        amount: billTotal,
      };
      tableButton.data.details.payment_mode = paymentDetails.payment_option;
    }

    const { waiter } = tableButton.data.details;
    const { waiter_id } = tableButton.data.details;

    const { extra_details } = tableButton.data.details;

    // added remote kot order id in extra_details;
    if (
      tableButton.data.details.remoteKot ||
      tableButton.data.details.remoteOrder_id !== '0'
    ) {
      Object.assign(extra_details, {
        upsale_order_id: tableButton.data.details.remoteOrder_id,
      });
      Object.assign(extra_details, { appSource: 'UpSale' });
    }

    if (tableButton.data['mpos_department.section'] == 2) {
      Object.assign(extra_details, { isBarSection: 'true' });
    }
    if (tableButton.data.details && tableButton.data.details.is_pre_order) {
      Object.assign(extra_details, { is_pre_order: 1 });

      if (tableButton.data.details.preorderInfo) {
        Object.assign(extra_details, {
          delivery_at: tableButton.data.details.preorderInfo.delivery_at,
        });
      }
    }
    // tableButton.data.details.cust_paid_amount =
    //   tableButton.data.details.cust_paid_amount || billTotal;

    // if (!customer_name && !customer_mobile) {
    //   customer_name = 'POS User';
    //   customer_mobile = '9090909090';
    // }

    Object.assign(extra_details, { invoiceType: 'B2C' });

    const billDetails = {
      order_total: billTotal,
      table_name: tableButton.content,
      table_id,
      cust_name: customer != undefined ? customer.name : customer_name,
      phone: customer != undefined ? customer.phone : customer_mobile,
      email: customer != undefined ? customer.email : '',
      line_1: customer != undefined ? customer.address_line1 : '',
      line_2: customer != undefined ? customer.address_line2 : '',
      persons,
      order_state: OrderState.PENDING,
      // discount: tableButton.data.details.discounttoApply,
      discount_title: tableButton.data.details.discount_title,
      discount:
        Number(tableButton.data.details.discounttoApply) +
        Number(tableButton.data.details.coupondiscounttoApply),
      order_level_total_taxes: tableButton.data.details.taxtoApply,
      order_id,
      order_subtotal: tableButton.data.details.order_subtotal,
      order_level_total_charges:
        tableButton.data.details.order_level_total_charges,
      charges_level_total_tax: tableButton.data.details.charges_level_total_tax,
      store_id: window.storeDetails.store_id,
      billing_type,
      deliveryboy_id,
      user_id: window.storeDetails.username,
      delivery_boy_phone,
      delivery_boy_name,
      createdBy:
        tableButton.data.details.createdBy || window.storeDetails.username,
      payment:
        defaultPaymentoption !== 'Cash' ? defaultPaymentoption : undefined,
      waiter,
      waiter_id,
      issectionwisebilling: tableButton.data.details.issectionwisebilling,
      // cust_paid_amount:
      //   tableButton.data.details.cust_paid_amount || billTotal,
      instructions: billstatusReason || '',
      field1: orderStatusReason || '',
      extra_details: extra_details || {},
      charges: tableButton.data.details.totalCharges,
      item_level_total_charges:
        tableButton.data.details.item_level_total_charges,
      draftprint_status: tableButton.data.details.draftprint_status || 0,
      isBarSection: tableButton.data['mpos_department.section'],
      discounted_product_groups: tableButton.data.details
        .discounted_product_groups
        ? tableButton.data.details.discounted_product_groups
        : '',
      order_note: tableButton.data.details.order_note || null,
    };

    if (username) {
      Object.assign(billDetails, {
        createdBy: username,
      });
    }
    if (cust_paid_amount) {
      Object.assign(billDetails, {
        cust_paid_amount,
      });
    }
    if (isPreorder && !billDetails.phone) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:orderController.pleaseSelectCustomer'),
      );
      return;
    }

    if (shouldprintBill) {
      Object.assign(billDetails, {
        print_status: Number(tableButton.data.details.print_status) + 1 || 1,
      });
    } else {
      Object.assign(billDetails, {
        print_status: Number(tableButton.data.details.print_status) || 0,
      });
    }

    if (isPreorder) {
      Object.assign(billDetails, { is_pre_order: isPreorder });
    }

    let couponDisountavailable = false;
    if (
      tableButton.data.details.coupon &&
      tableButton.data.details.couponDisountamt > 0
    ) {
      billDetails.couponDisount = tableButton.data.details.couponDisountamt;
      billDetails.couponDisounttype =
        tableButton.data.details.couponDisounttype;
      billDetails.coupon = tableButton.data.details.coupon;
      billDetails.couponDisounttotal = Number(
        tableButton.data.details.coupondiscounttoApply,
      );
      couponDisountavailable = true;
    }

    window.savebillisinProgress = true;

    const billData = {
      paymentDetails,
      billDetails,
      items,
      charges,
      table_color: TableUtils.Colors.BILL_SAVED,
      table_action_flag: TableUtils.State.BILL_SAVED,
      printBill: shouldprintBill,
      order_type_flag: tableButton.data.order_type_flag,
      isRequestFromCsk,
      printBillOnBothSide,
      sendImageToCSK,
      socketUserId,
      cskPrintEvent,
      printWidth,
    };
    if (couponDisountavailable) {
      const couponDisounthistorydata = {
        store_id: window.storeDetails.store_id,
        tmpos_id: window.storeDetails.tmpos_id,
        logedin_user: window.storeDetails.username,
        coupon_code: String(tableButton.data.details.coupon).toUpperCase(),
        customer_name: billDetails.cust_name,
        customer_phone: billDetails.phone,
        coupon_code_amt: tableButton.data.details.coupondiscounttoApply,
        order_id,
      };
      billData.couponDisounthistorydata = couponDisounthistorydata;
    }
    // Store tableButton in context map so the reply handler can find it
    const _ctxTableId = tableButton.id.replace('table_', '');
    saveBillContextMap.set(_ctxTableId, tableButton);

    // Include table_id at top level so it comes back in the reply
    billData._ctx_table_id = _ctxTableId;
    // ipcRenderer.send(SAVE_BILL_FOR_CSK, JSON.stringify(billData));
    const content = await window.ipcRenderer.invoke(
      SAVE_BILL_FOR_CSK,
      JSON.stringify(billData),
    );
    if (content) {
      let _replyTableId; // for cleanup in finally
      if (content) {
        try {
          const response = safeParse(content);

          // Look up the correct tableButton from the context map
          _replyTableId = response?._ctx_table_id;
          const tableButton = _replyTableId
            ? saveBillContextMap.get(_replyTableId)
            : currenttableButton;
          //   ipcRenderer.send(FETCH_KOTBILL_NUMBER, undefined);

          if (response && response.status === 'success') {
            if (tableButton != undefined) {
              tableButton.data.details.color = TableUtils.Colors.BILL_SAVED;

              tableButton.data.table_action_flag = TableUtils.State.BILL_SAVED;

              if (response.order_id) {
                tableButton.data.details.bill_number = response.order_id;
                tableButton.data.details.order_id = response.id;
                tableButton.data.details.custom_bill_number =
                  response.custom_bill_number;
              }

              if (
                window.defaultCustomizeddiscount != undefined &&
                window.defaultCustomizeddiscount.length
              ) {
                try {
                  // setTimeout(async () => {
                  await applyCustomizediscount(
                    window.defaultCustomizeddiscount,
                    true,
                    response.billing_type,
                    tableButton,
                  );
                  // }, 80);
                  // await new Promise(r => setTimeout(r, 60))
                } catch (error) {
                  console.error(error);
                }
              }

              // if (window.itemLevleDiscount && window.itemLevleDiscount.length) {
              //   await applyItemDiscount(
              //     window.itemLevleDiscount[0],
              //     response.billing_type,
              //     tableButton.data.id,
              //   );
              // }
              if (response.nextOrderNumber && tableButton.data.details) {
                Object.assign(tableButton.data.details.extra_details, {
                  ...tableButton.data.details.extra_details,
                  order_number: response.nextOrderNumber,
                });
              }
              if (response.printBill) {
                // setTimeout(() => {
                $(`#table_${tableButton?.data?.id}`).css(
                  'background-color',
                  TableUtils.Colors.BILL_PRINTED,
                );
                // }, 100);
                tableButton.data.details.color = TableUtils.Colors.BILL_PRINTED;
                tableButton.data.table_action_flag =
                  TableUtils.State.BILL_PRINTED;
                const isRequestFromCsk = response.isRequestFromCsk;
                const printBillOnBothSide = response.printBillOnBothSide;
                const sendImageToCSK = response.sendImageToCSK;
                const socketUserId = response.socketUserId;
                const cskPrintEvent = response.cskPrintEvent;
                const printWidth = response.printWidth;
                const currenttablebuttonData = cloneDeep(tableButton.data);
                if (
                  window.defaultCustomizeddiscount != undefined &&
                  window.defaultCustomizeddiscount.length
                ) {
                  // setTimeout(async () => {
                  // await printBill(false, false, tableButton);
                  const printedTableid = tableButton.data.id;

                  await updatetableStatusrequest({
                    table_id: printedTableid,
                    table_action_flag: TableUtils.State.BILL_PRINTED,
                    table_color: TableUtils.Colors.BILL_PRINTED,
                  });
                  await printBill({
                    isdraftBill: false,
                    forQuickbill: false,
                    currenttable: tableButton,
                    isRequestFromCsk,
                    printBillOnBothSide,
                    sendImageToCSK,
                    socketUserId,
                    cskPrintEvent,
                    printWidth,
                    currenttablebuttonData,
                  });

                  // }, 150);
                } else {
                  const printedTableid = currenttablebuttonData.id;
                  await updatetableStatusrequest({
                    table_id: printedTableid,
                    table_action_flag: TableUtils.State.BILL_PRINTED,
                    table_color: TableUtils.Colors.BILL_PRINTED,
                  });
                  await printBill({
                    isdraftBill: false,
                    forQuickbill: false,
                    currenttable: tableButton,
                    isRequestFromCsk,
                    printBillOnBothSide,
                    sendImageToCSK,
                    socketUserId,
                    cskPrintEvent,
                    printWidth,
                    currenttablebuttonData,
                  });
                }

                // await printBill(false, false);
                // let printedTableid = tableButton.data.id;
                //    updatetableStatusrequest({
                //       table_id: printedTableid,
                //       table_action_flag: TableUtils.State.BILL_PRINTED,
                //       table_color: TableUtils.Colors.BILL_PRINTED
                //    });
              }

              if (response.order_id) {
                if (window.showbillDetails && response.id != 0) {
                  try {
                    $(`#${tableButton.id}`)
                      .find('#tablebillnumberlabel')
                      .text(`Bill No: ${response.id}`);
                  } catch (error) {}
                }
              }
            }
            // sendsyncRequet()
            sendsilentSyncrequestfromremote();
            //  fetchBilldata();
            sendBillsavedevent({
              bill_number: response.order_id,
              order_id: response.id,
              table_id: tableButton.data.id,
              message: 'Bill saved',
              isBillPrinted: response.printBill,
            });
            // if (askforpaymodeonSavebill && preshowPaymentWindow) {
            //   preshowPaymentWindow(false);
            // }
            // $(`#${tableButton.id}`).css(
            //   'background-color',
            //   TableUtils.Colors.BILL_PRINTED,
            // );
            if ($('#orderSettlemetWindowParentDivID').is(':visible')) {
              window.fetchBillsFromRemote();
            }
            // await sleep(2000);
            if (!response.printBill) {
              window.savebillisinProgress = false;
            }
          } else if (response && response.message) {
            window.notifyUser.showMessage('error', response.message);
            window.savebillisinProgress = false;
          } else {
            window.savebillisinProgress = false;
          }
        } catch (error) {
          window.savebillisinProgress = false;
          console.error(error);
        } finally {
          window.savebillisinProgress = false;
          // Clean up context map entry
          if (_replyTableId) {
            saveBillContextMap.delete(_replyTableId);
          }
        }
      }
      if (window.Swal.isVisible()) window.Swal.close();
    }
    return 'success';
  }
  window.notifyUser.showMessage(
    'error',
    $.i18n.t('controller:orderController.noItems'),
  );
  return 'failure';
}

ipcRenderer.on(SAVE_BILL_FOR_CSK_REPLY, async (_event, content) => {
  // window.savebillisinProgress = false;
  // await sleep(1000); // 1200
  let _replyTableId; // for cleanup in finally
  if (content) {
    try {
      const response = safeParse(content);

      // Look up the correct tableButton from the context map
      _replyTableId = response?._ctx_table_id;
      const tableButton = _replyTableId
        ? saveBillContextMap.get(_replyTableId)
        : currenttableButton;

      if (response && response.status === 'success') {
        if (tableButton != undefined) {
          tableButton.data.details.color = TableUtils.Colors.BILL_SAVED;

          tableButton.data.table_action_flag = TableUtils.State.BILL_SAVED;

          if (response.order_id) {
            tableButton.data.details.bill_number = response.order_id;
            tableButton.data.details.order_id = response.id;
            tableButton.data.details.custom_bill_number =
              response.custom_bill_number;
          }

          if (
            window.defaultCustomizeddiscount != undefined &&
            window.defaultCustomizeddiscount.length
          ) {
            try {
              // setTimeout(async () => {
              await applyCustomizediscount(
                window.defaultCustomizeddiscount,
                true,
                response.billing_type,
                tableButton,
              );
              // }, 80);
              // await new Promise(r => setTimeout(r, 60))
            } catch (error) {
              console.error(error);
            }
          }

          // if (window.itemLevleDiscount && window.itemLevleDiscount.length) {
          //   await applyItemDiscount(
          //     window.itemLevleDiscount[0],
          //     response.billing_type,
          //     tableButton.data.id,
          //   );
          // }
          if (response.nextOrderNumber && tableButton.data.details) {
            Object.assign(tableButton.data.details.extra_details, {
              ...tableButton.data.details.extra_details,
              order_number: response.nextOrderNumber,
            });
          }
          if (response.printBill) {
            // setTimeout(() => {
            $(`#table_${tableButton?.data?.id}`).css(
              'background-color',
              TableUtils.Colors.BILL_PRINTED,
            );
            // }, 100);
            tableButton.data.details.color = TableUtils.Colors.BILL_PRINTED;
            tableButton.data.table_action_flag = TableUtils.State.BILL_PRINTED;
            const isRequestFromCsk = response.isRequestFromCsk;
            const printBillOnBothSide = response.printBillOnBothSide;
            const sendImageToCSK = response.sendImageToCSK;
            const socketUserId = response.socketUserId;
            const cskPrintEvent = response.cskPrintEvent;
            const printWidth = response.printWidth;
            const currenttablebuttonData = cloneDeep(tableButton.data);
            if (
              window.defaultCustomizeddiscount != undefined &&
              window.defaultCustomizeddiscount.length
            ) {
              // setTimeout(async () => {
              // await printBill(false, false, tableButton);
              const printedTableid = tableButton.data.id;

              await updatetableStatusrequest({
                table_id: printedTableid,
                table_action_flag: TableUtils.State.BILL_PRINTED,
                table_color: TableUtils.Colors.BILL_PRINTED,
              });
              await printBill({
                isdraftBill: false,
                forQuickbill: false,
                currenttable: tableButton,
                isRequestFromCsk,
                printBillOnBothSide,
                sendImageToCSK,
                socketUserId,
                cskPrintEvent,
                printWidth,
                currenttablebuttonData,
              });

              // }, 150);
            } else {
              const printedTableid = currenttablebuttonData.id;
              await updatetableStatusrequest({
                table_id: printedTableid,
                table_action_flag: TableUtils.State.BILL_PRINTED,
                table_color: TableUtils.Colors.BILL_PRINTED,
              });
              await printBill({
                isdraftBill: false,
                forQuickbill: false,
                currenttable: tableButton,
                isRequestFromCsk,
                printBillOnBothSide,
                sendImageToCSK,
                socketUserId,
                cskPrintEvent,
                printWidth,
                currenttablebuttonData,
              });
            }

            // await printBill(false, false);
            // let printedTableid = tableButton.data.id;
            //    updatetableStatusrequest({
            //       table_id: printedTableid,
            //       table_action_flag: TableUtils.State.BILL_PRINTED,
            //       table_color: TableUtils.Colors.BILL_PRINTED
            //    });
          }

          if (response.order_id) {
            if (window.showbillDetails && response.id != 0) {
              try {
                $(`#${tableButton.id}`)
                  .find('#tablebillnumberlabel')
                  .text(`Bill No: ${response.id}`);
              } catch (error) {}
            }
          }
        }
        // sendsyncRequet()
        sendsilentSyncrequestfromremote();
        //  fetchBilldata();
        sendBillsavedevent({
          bill_number: response.order_id,
          order_id: response.id,
          table_id: tableButton.data.id,
          message: 'Bill saved',
          isBillPrinted: response.printBill,
        });
        // if (askforpaymodeonSavebill && preshowPaymentWindow) {
        //   preshowPaymentWindow(false);
        // }
        // $(`#${tableButton.id}`).css(
        //   'background-color',
        //   TableUtils.Colors.BILL_PRINTED,
        // );
        if ($('#orderSettlemetWindowParentDivID').is(':visible')) {
          window.fetchBillsFromRemote();
        }
        // await sleep(2000);
        if (!response.printBill) {
          window.savebillisinProgress = false;
        }
      } else if (response && response.message) {
        window.notifyUser.showMessage('error', response.message);
        window.savebillisinProgress = false;
      } else {
        window.savebillisinProgress = false;
      }
    } catch (error) {
      window.savebillisinProgress = false;
      console.error(error);
    } finally {
      window.savebillisinProgress = false;
      // Clean up context map entry
      if (_replyTableId) {
        saveBillContextMap.delete(_replyTableId);
      }
    }
  }
  if (window.Swal.isVisible()) window.Swal.close();
});

function ensureSaveBillLockIsHealthy() {
  if (
    window.savebillisinProgress &&
    savebillLockStartedAt &&
    Date.now() - savebillLockStartedAt > MAX_SAVEBILL_TIME
  ) {
    console.warn('⚠ savebill lock stuck. Auto-releasing...');
    window.savebillisinProgress = false;
    savebillLockStartedAt = null;
  }
}
const MAX_SAVEANDPRINTBILL_TIME = 10000;

function ensureSaveAndPrintBillRequestLockIsHealthy() {
  if (
    isProcessingSavePrint &&
    saveAndPrintbillRequestLockStartedAt &&
    Date.now() - saveAndPrintbillRequestLockStartedAt >
      MAX_SAVEANDPRINTBILL_TIME
  ) {
    console.warn('⚠ savebill lock stuck. Auto-releasing...');
    isProcessingSavePrint = false;
    saveAndPrintbillRequestLockStartedAt = null;
  }
}

// Singleton queue instance – shared across all save/settle flows

async function processSaveBill(responseData) {
  console.log(
    `Message="Save bill process started" JobId="${responseData?.job_id}"`,
  );
  try {
    // await sleep(1500);
    let tableButton; // local per-request context (no global!)
    if (responseData.status === 404) {
      window.savebillisinProgress = false;
      return;
    }
    if (responseData.table_id) {
      const currenttable = $(`#table_${responseData.table_id}`);

      // if order is of pickup or delivery and table is not fetched then wait for some time to render table on UI
      if (
        !currenttable[0] &&
        responseData &&
        responseData.order_type_flag !== 1
      ) {
        // await sleep(1000);
        const currenttableRetry = $(`#table_${responseData.table_id}`);
        if (currenttableRetry[0]) {
          tableButton = currenttableRetry[0];
        }
      } else if (currenttable[0]) {
        tableButton = currenttable[0];
      } else if (responseData.table_id && responseData.settleBill) {
        await createCurrentTableForSettleBill(responseData);
        tableButton = settlebilltableButton;
        Object.assign(responseData, { isTerminalTable: true });
      }
    } else if (responseData.table_id && responseData.settleBill) {
      await createCurrentTableForSettleBill(responseData);
      tableButton = settlebilltableButton;
    }

    if (tableButton) {
      const result = await savebilldata(responseData, tableButton);
      // const parsedResponse = safeParse(reply);
      const parsedResponse = responseData;
      if (result === 'success' && !parsedResponse.settleBill) {
        await makesaveBillrequest({
          shouldprintBill: parsedResponse.printBill,
          isRequestFromCsk: parsedResponse?.isRequestFromCsk,
          cust_paid_amount: parsedResponse.cust_paid_amount,
          return_amount: parsedResponse.return_amount,
          printBillOnBothSide: parsedResponse.printBillOnBothSide,
          sendImageToCSK: parsedResponse.sendImageToCSK,
          socketUserId: parsedResponse.socketUserId,
          cskPrintEvent: parsedResponse.cskPrintEvent,
          printWidth: parsedResponse.printWidth,
          username: parsedResponse.username,
          tableButton,
        });
      } else {
        // make settle bill request
        await makesettleBillrequest({
          shouldprintBill: parsedResponse.printBill,
          payment_mode: parsedResponse.payment_mode,
          username: parsedResponse.username,
          cust_paid_amount: parsedResponse.cust_paid_amount,
          return_amount: parsedResponse.return_amount,
          printBillOnBothSide: parsedResponse.printBillOnBothSide,
          sendImageToCSK: parsedResponse.sendImageToCSK,
          socketUserId: parsedResponse.socketUserId,
          cskPrintEvent: parsedResponse.cskPrintEvent,
          printWidth: parsedResponse.printWidth,
          isRequestFromCsk: parsedResponse?.isRequestFromCsk,
          tableButton,
        });
      }
    }
  } catch (error) {
    console.error(
      `Message="Error while saving/settling bill" JobId="${responseData?.job_id}"`,
    );
  } finally {
    console.log(
      `Message="Save bill process completed" JobId="${responseData?.job_id}"`,
    );
  }
}

ipcRenderer.on(FETCH_BILL_DATA_FOR_CSK_REPLY, async (_event, reply) => {
  try {
    const responseData = safeParse(reply);
    const job_id = window.generateId(10);
    console.log(
      `Message="Dispatch Save and Print bill job for OrderHub" JobId="${job_id}" TableId="${responseData?.table_id}"`,
    );
    OrderHubSaveBillTaskQueue.addTask({
      table_id: responseData.table_id,
      response: responseData,
      handlerFn: processSaveBill,
      job_id,
      conext: 'SaveBillFromCsk',
    });
  } catch (error) {
    console.log(error);
  }
});

const savePrintQueue = [];

async function handleSavenprintBill(content) {
  console.log(`Message="Save and print bill process started"`);
  content = safeParse(content);

  if (content.settleBill) {
    await sleep(500);
  }

  const result = await window.ipcRenderer.invoke(
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

  if (result) {
    const responseData = safeParse(result);

    OrderHubSaveBillTaskQueue.addTask({
      table_id: responseData.table_id,
      response: responseData,
      handlerFn: processSaveBill,
      job_id: window.generateId(10),
      context: 'SaveBillFromCsk',
    });
  }
}

async function processSavePrintQueue() {
  console.log(
    `Message="Process Save Print Queue" isProcessingSavePrint="${isProcessingSavePrint}" savePrintQueue_length="${savePrintQueue.length}"`,
  );
  if (isProcessingSavePrint) return;
  if (savePrintQueue.length === 0) return;

  isProcessingSavePrint = true;
  saveAndPrintbillRequestLockStartedAt = Date.now();

  while (savePrintQueue.length > 0) {
    ensureSaveAndPrintBillRequestLockIsHealthy();
    ensureSaveBillLockIsHealthy();

    const content = savePrintQueue.shift();

    try {
      await handleSavenprintBill(content);
    } catch (error) {
      console.error('Queue error processing item:', error);
    }

    await sleep(500);
  }

  isProcessingSavePrint = false;
}

window.ipcRenderer.on(ORDER.SAVE_AND_PRINT_BILL, async (event, content) => {
  console.log(`Message="Save and print job added in queue"`);
  savePrintQueue.push(content);
  processSavePrintQueue();
});

async function makesettleBillrequest({
  shouldprintBill,
  payment_mode,
  username,
  cust_paid_amount,
  return_amount,
  printBillOnBothSide,
  sendImageToCSK,
  socketUserId,
  cskPrintEvent,
  printWidth,
  isRequestFromCsk,
  tableButton,
}) {
  // if (!calculationDone) {
  //   return;
  // }
  let order_state;
  if (tableButton?.data?.details?.isBillModified == 2) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderWindowNotifications.Pleasesavebillfirst'),
    );
    return;
  }

  if (window.settlebillisinProgress) {
    return;
  }
  let sendCustomerinfotodboy = false;
  if (tableButton == undefined) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.pleaseSelectTheTable'),
    );
    return;
  }

  if (
    tableButton.data.details.bill_number != undefined &&
    tableButton.data.details.bill_number == 0
  ) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.saveTheBillFirst'),
    );
    return;
  }

  if (
    tableButton.data.details.items == undefined ||
    tableButton.data.details.items.length == 0
  ) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderWindowNotifications.NoItems'),
      0,
    );
    return;
  }

  if (
    tableButton.data.order_type_flag === 0 &&
    window.waiterMandatoryInDinein &&
    !tableButton.data.details.waiter_id
  ) {
    window.notifyUser.showMessage(
      'error',
      `Waiter not seleced for ${tableButton?.data?.table_name}. Please select waiter first`,
    );
    return;
  }

  if (
    tableButton.data.order_type_flag === 1 &&
    window.waiterMandatoryInPickup &&
    !tableButton.data.details.waiter_id
  ) {
    window.notifyUser.showMessage(
      'error',
      `Waiter not seleced for ${tableButton?.data?.table_name}. Please select waiter first`,
    );
    return;
  }

  if (
    !tableButton.data.details.payment_mode &&
    !tableButton.data.details.addasdueChecked
  ) {
    window.notifyUser.showMessage('error', 'Please select payment mode');
    return;
  }

  if (
    tableButton.data.order_type_flag === 2 &&
    window.waiterMandatoryInDelivery &&
    !tableButton.data.details.waiter_id
  ) {
    window.notifyUser.showMessage(
      'error',
      `Waiter not seleced for ${tableButton?.data?.table_name}. Please select waiter first`,
    );
    return;
  }

  if (tableButton.data.order_type_flag === HOMED_FLAG_ID) {
    if (isSendCustomerDetailsToDBoyEnabled) {
      if (tableButton.data.details.customer == undefined) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:orderController.pleaseSelectCustomer'),
        );
        // $('#tatable-actions-divid *').prop('disabled', false);
        // $('#tablesContainer *').prop('disabled', false);
        return;
      }
      // const selection = $(
      //   '#dboyselectionfordeliveryId option:selected:not([disabled])',
      // );
      // const selection = $(
      //   "input:radio[name='deliveryBoyButton']:checked",
      // ).val();
      const selection = tableButton.data.details.deliveryboy_id;
      if (!selection) {
        // window.notifyUser.showMessage(
        //   'error',
        //   $.i18n.t('controller:orderController.pleaseSelectDeliveryBoy'),
        // );
        // $('#tatable-actions-divid *').prop('disabled', false);
        // $('#tablesContainer *').prop('disabled', false);
        return;
      }
      sendCustomerinfotodboy = true;
    }

    if (deliveryBoyMandatory) {
      // const selection = $(
      //   "input:radio[name='deliveryBoyButton']:checked",
      // ).val();
      const selection = tableButton.data.details.deliveryboy_id;
      if (!selection) {
        // $('#tatable-actions-divid *').prop('disabled', false);
        // $('#tablesContainer *').prop('disabled', false);
        return;
      }
    }
  }

  // showLoader({
  //   title: $.i18n.t('controller:orderController.settlingBill'),
  //   text: $.i18n.t('controller:orderController.pleaseWait'),
  // });
  await precalculateDetailsCheck(tableButton);

  if (order_state === undefined) {
    order_state = OrderState.FULFILLED;
  }
  let billTotal = Number(
    tableButton.data.details.order_total.toFixed(ROUNDOFF_UPTO),
  );
  let isPreorder;
  // let table_id = tableButton.id.replace('table_', '');
  const table_id = tableButton.id.replace('table_', '');
  const { extra_details } = tableButton.data.details;
  istakeawaywindowSelected = $('#switchcheckId').is(':checked');

  switch (tableButton.data.order_type_flag) {
    case TAKEAWAY_FLAG_ID:
      {
        // $('#tatable-actions-divid *').prop('disabled', true);
        // $('#tablesContainer *').prop('disabled', true);
        isPreorder = $('#takeawayPreordercheckid').is(':checked');
        if (!billTotal) billTotal = $('#takeawaybillGrandtotal').text();

        if ($('#takeawaytransferordercheckid').is(':checked')) {
          Object.assign(extra_details, { is_transfer_order: 1 });
        }
      }
      break;
    case HOMED_FLAG_ID:
      {
        // $('#tatable-actions-divid *').prop('disabled', true);
        // $('#tablesContainer *').prop('disabled', true);
        isPreorder = $('#deliveryPreordercheckid').is(':checked');
        if (!billTotal) billTotal = $('#deliverybillGrandtotal').text();
        if (
          !istakeawaywindowSelected &&
          $('#senddeliverycustomerdetailstodboyCheckid').is(':checked')
        ) {
          if (tableButton.data.details.customer == undefined) {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t('controller:orderController.pleaseSelectCustomer'),
            );
            // $('#tatable-actions-divid *').prop('disabled', false);
            // $('#tablesContainer *').prop('disabled', false);
            return;
          }
          const selection = $(
            '#dboyselectionId option:selected:not([disabled])',
          );
          if (selection.length == 0) {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t('controller:orderController.pleaseSelectDeliveryBoy'),
            );
            // $('#tatable-actions-divid *').prop('disabled', false);
            // $('#tablesContainer *').prop('disabled', false);
            return;
          }
          sendCustomerinfotodboy = true;
        }
        if ($('#takeawaytransferordercheckid').is(':checked')) {
          Object.assign(extra_details, { is_transfer_order: 1 });
        }
      }
      break;
    case DINEIN_FLAG_ID:
    case VIRTUALTABLE_FLAG_ID:
      {
        // $('#table-actions-divid *').prop('disabled', true);
        // $('#tablesContainer *').prop('disabled', true);
        if (!billTotal) billTotal = $('#billGrandtotal').text();
        if ($('#transferordercheckid').is(':checked')) {
          Object.assign(extra_details, { is_transfer_order: 1 });
        }
      }
      break;
    default:
      break;
  }

  if (tableButton.data.details && tableButton.data.details.is_pre_order) {
    Object.assign(extra_details, { is_pre_order: 1 });

    if (tableButton.data.details.preorderInfo) {
      Object.assign(extra_details, {
        delivery_at: tableButton.data.details.preorderInfo.delivery_at,
      });
    }
  }

  if (return_amount) {
    Object.assign(extra_details, { return_amount });
  }
  if (!billstatusReason) {
    billstatusReason = '';
  }

  if (!orderStatusReason) {
    orderStatusReason = '';
  }

  // let extra_details = tableButton.data.details.extra_details;
  const { items } = tableButton.data.details;

  const billupdateData = {
    order_state,
    order_total: billTotal,
    store_id:
      window.storeDetails && window.storeDetails.store_id
        ? window.storeDetails.store_id
        : '',
    user_id: window.storeDetails.username, // window.storeDetails.username,
    order_level_total_charges:
      tableButton.data.details.order_level_total_charges,
    charges_level_total_tax: tableButton.data.details.charges_level_total_tax,
    order_subtotal: tableButton.data.details.order_subtotal,
    // discount:
    //   Number(tableButton.data.details.discounttoApply) +
    //   Number(tableButton.data.details.coupondiscounttoApply),
    discount: Number(tableButton.data.details.discounttoApply),
    order_level_total_taxes: tableButton.data.details.taxtoApply,
    instructions: billstatusReason,
    field1: orderStatusReason,
    couponDisounttotal: Number(tableButton.data.details.coupondiscounttoApply),
    issectionwisebilling: tableButton.data.details.issectionwisebilling,
    // cust_paid_amount: tableButton.data.details.cust_paid_amount !== undefined
    //    ? tableButton.data.details.cust_paid_amount
    //    : billTotal,
    // cust_paid_amount:
    //   tableButton.data.details.cust_paid_amount &&
    //   tableButton.data.details.cust_paid_amount,
    extra_details: extra_details || {},
    charges: tableButton.data.details.totalCharges,
    item_level_total_charges: tableButton.data.details.item_level_total_charges,
    sync_status: SYNC_STATUS_FLAG.NOT_SYNCED,
    countMidnightSale,
    orderItems: items,
    app_source: 'atlantic_pos',
  };

  // if bill is auto settled then don't update userid (this is for terminal bills)
  if (
    tableButton.data.details.extra_details &&
    tableButton.data.details.extra_details.autoSettled
  ) {
    delete billupdateData.user_id;
  }

  if (tableButton.data.details.due_payment) {
    Object.assign(billupdateData, { payment: '' });
    // tableButton.data.details.payment_mode = "Due"
  }
  // if(!fastsettlePopupisopen){
  //    billupdateData.cust_paid_amount = billTotal
  // }
  // return

  if (cust_paid_amount) {
    Object.assign(billupdateData, {
      cust_paid_amount,
    });
    tableButton.data.details.cust_paid_amount = cust_paid_amount;
  }

  const billData = {
    billupdateData,
    order_id: tableButton.data.details.bill_number,
    table_id,
    table_color: TableUtils.Colors.FREE_TABLE,
    table_action_flag: TableUtils.State.FREE_TABLE,
    order_state,
    order_type_flag: tableButton.data.order_type_flag,
    printBill: shouldprintBill,
    printBillOnBothSide,
    sendImageToCSK,
    socketUserId,
    cskPrintEvent,
    printWidth,
    isRequestFromCsk,
  };

  if (isPreorder && tableButton.data.details.preorderInfo) {
    Object.assign(billData, {
      is_pre_order: isPreorder,
    });
  }
  if (
    tableButton.data.details.payment_mode == undefined &&
    !tableButton.data.details.due_payment
  ) {
    let payMode = window.defaultPaymentoption;
    if (payment_mode) {
      payMode = payment_mode;
    }
    const paymentDetails = {
      order_id: tableButton.data.details.bill_number,
      payment_option: payMode,
      store_id: window.storeDetails.store_id,
      amount: billTotal,
      isSplitpayment: false,
    };
    billData.paymentDetails = paymentDetails;
  }

  // if payment mode gets from csk then set that payment mode
  if (payment_mode) {
    let payMode = window.defaultPaymentoption;
    if (payment_mode) {
      payMode = payment_mode;
    }
    const paymentDetails = {
      order_id: tableButton.data.details.bill_number,
      payment_option: payMode,
      store_id: window.storeDetails.store_id,
      amount: billTotal,
      isSplitpayment: false,
    };
    billData.paymentDetails = paymentDetails;

    Object.assign(billData.billupdateData, {
      payment: payMode,
    });
  }

  if (
    tableButton.data.details.discountHistory &&
    Array.isArray(tableButton.data.details.discountHistory) &&
    tableButton.data.details.discountHistory.length > 0
  ) {
    billData.discountHistory = tableButton.data.details.discountHistory;
  }

  billstatusReason = undefined;
  orderStatusReason = undefined;
  if (sendCustomerinfotodboy) {
    // const selection = $('#dboyselectionId option:selected:not([disabled])');
    if (tableButton.data.details.deliveryboy_id) {
      // const delivery_boy_phone = $(selection).attr('phone');
      const selection = window.deliveryBoys.find(
        (b) => b.id === tableButton.data.details.deliveryboy_id,
      );
      const delivery_boy_phone = selection.phone;
      sendCustomersinfotodboy({
        customer: tableButton.data.details.customer,
        delivery_boy_phone,
        bill_amount: billTotal,
        order_id: billData.order_id,
      });
    }
  }
  window.settlebillisinProgress = true;
  // Store tableButton in context map for the reply handler
  const _settleTableId = String(table_id);
  saveBillContextMap.set(_settleTableId, tableButton);
  await new Promise((r) => setTimeout(r, 900));
  ipcRenderer.send(SETTLE_BILL_IN_BACKGROUND, JSON.stringify(billData));
  if (showOrderstatusontable) {
    $('#orderstateSelectid').val($('#orderstateSelectid option:first').val());
  }
  $('#neworderpaymentModalid').modal('hide');
}

ipcRenderer.on(SETTLE_BILL_IN_BACKGROUND_REPLY, async (event, status) => {
  if (status) {
    const responseData = safeParse(status);
    try {
      window.settlebillisinProgress = false;
      window.savebillisinProgress = false;
      // Look up the correct tableButton from context map
      const _settleTableId = responseData.table_id
        ? String(responseData.table_id)
        : undefined;
      let tableButton = _settleTableId
        ? saveBillContextMap.get(_settleTableId)
        : currenttableButton;
      if (responseData.table_id) {
        window.busyTableData[responseData.table_id] = {};
      }
      if (responseData.printBill) {
        await printBill({
          isdraftBill: false,
          forQuickbill: false,
          currenttable: tableButton,
          printBillOnBothSide: responseData.printBillOnBothSide,
          sendImageToCSK: responseData.sendImageToCSK,
          socketUserId: responseData.socketUserId,
          cskPrintEvent: responseData.cskPrintEvent,
          printWidth: responseData.printWidth,
          isRequestFromCsk: responseData.isRequestFromCsk,
          currenttablebuttonData: cloneDeep(tableButton.data),
        });
        await sleep(200);
      }
      window.savebillisinProgress = false;
      window.refreshDashboard = true;
      window.refreshReceipt = true;
      window.refreshOrderSettlementWindow = true;
      fastsettlePopupisopen = false;
      showDuepayavaiablemark({ hideall: true });
      if (allowModifyBill && window.askPasscodeForModifyBillAfterSave) {
        $('#saveBilloldkotButton').hide();
        $('#saveBilltakeawayoldkotButton').hide();
        $('#oldkotButton').show();
        $('#takeawayoldkotButton').show();
        if (window.askPasscodeForModifyBillAfterSave) {
          $('#itemviewContainer')
            .find(
              '.menuItemButtoncontentwrapper, .inneritembuttonDiv, img, div, label, i',
            )
            .each(function () {
              $(this).removeAttr('passcode-protected');
            });
          $('#itemviewContainer').removeAttr('passcode-protected');
        }
      }
      if (responseData.status != undefined) {
        if (responseData.status == 'success') {
          if ($("input:radio[name='paymentModebutton']").is(':checked')) {
            const paymode = $("input:radio[name='paymentModebutton']");
            $(paymode).prop('checked', false);
          }
          const activeTab = $('.mainsectionTabs li a.active').attr('id');
          const tableId = `table_${responseData.table_id}`;
          if (activeTab) {
            switch (activeTab) {
              case TAKEAWAY_TAB_ID:
                if (
                  responseData.order_type_flag === TAKEAWAY_FLAG_ID &&
                  window.globalcurrenttableId === tableId
                ) {
                  $('#takeawayneworderButtonid').click();
                }
                break;
              case DELIVERY_TAB_ID:
                if (
                  responseData.order_type_flag === HOMED_FLAG_ID &&
                  window.globalcurrenttableId === tableId
                ) {
                  $('#deliveryneworderButtonid').click();
                }
                break;
              default:
                break;
            }
          }
          switch (responseData.order_type_flag) {
            case TAKEAWAY_FLAG_ID:
              {
                // Check if ebill is to be sent
                if (
                  $('#takeawayebillBillcheckid').is(':checked') &&
                  tableButton.data.details.customer &&
                  tableButton.data.details.customer.phone
                ) {
                  const amount = $('#takeawaybillGrandtotal').text();
                  const { phone } = tableButton.data.details.customer;
                  const { name } = tableButton.data.details.customer;
                  sendEbill({
                    phone,
                    name,
                    amount,
                    order_id: tableButton.data.details.bill_number,
                    delivery_type: 'takeaway',
                    for_payment_link: 0,
                  });
                }
                resettaHddata();
                if (displaytimeonTables) {
                  removetablefromwathersList(tableButton.id);
                }
                const table_index = tableName_suggestions.indexOf(
                  tableButton.data.table_name,
                );
                if (table_index > -1) {
                  tableName_suggestions.splice(table_index, 1);
                }
                $(`#${tableButton.id}`).remove();
                // remove table from all tables list
                const target_id = tableButton.id.replace('table_', '');
                const table_to_delete_index = allTableslist.findIndex(
                  (item) => item.id == target_id,
                );

                if (table_to_delete_index > -1) {
                  allTableslist.splice(table_to_delete_index, 1);
                }
                ipcRenderer.send(DELETE_TABLE, `${responseData.table_id}`);
                isnewtakeawayOrder = true;
                tableButton = undefined;
                globalcurrenttableId = undefined;
                // $('#tatable-actions-divid *').prop('disabled', false);
                // $('#tablesContainer *').prop('disabled', false);
                if ($('#takeawaytransferordercheckid').is(':checked')) {
                  $('#takeawaytransferordercheckid').prop('checked', false);
                }
              }

              break;
            case HOMED_FLAG_ID:
              {
                // Check if ebill is to be sent
                if (
                  $('#deliveryebillBillcheckid').is(':checked') &&
                  tableButton.data.details.customer &&
                  tableButton.data.details.customer.phone
                ) {
                  const amount = $('#deliverybillGrandtotal').text();
                  const { phone } = tableButton.data.details.customer;
                  const { name } = tableButton.data.details.customer;
                  sendEbill({
                    phone,
                    name,
                    amount,
                    order_id: tableButton.data.details.bill_number,
                    delivery_type: 'delivery',
                    for_payment_link: 0,
                  });
                }
                resetDeliverydata();
                if (displaytimeonTables) {
                  removetablefromwathersList(tableButton.id);
                }
                const table_index = tableName_suggestions.indexOf(
                  tableButton.data.table_name,
                );
                if (table_index > -1) {
                  tableName_suggestions.splice(table_index, 1);
                }
                $(`#${tableButton.id}`).remove();
                // remove table from all tables list
                const target_id = tableButton.id.replace('table_', '');
                const table_to_delete_index = allTableslist.findIndex(
                  (item) => item.id == target_id,
                );

                if (table_to_delete_index > -1) {
                  allTableslist.splice(table_to_delete_index, 1);
                }
                ipcRenderer.send(DELETE_TABLE, `${responseData.table_id}`);
                isnewtakeawayOrder = true;
                tableButton = undefined;
                globalcurrenttableId = undefined;
                // $('#tatable-actions-divid *').prop('disabled', false);
                // $('#tablesContainer *').prop('disabled', false);
                if ($('#takeawaytransferordercheckid').is(':checked')) {
                  $('#deliverytransferordercheckid').prop('checked', false);
                }
              }

              break;
            case DINEIN_FLAG_ID:
            case VIRTUALTABLE_FLAG_ID:
              {
                if (displaytimeonTables) {
                  removetablefromwathersList(tableButton.id);
                }
                if (
                  $('#ebillBillcheckid').is(':checked') &&
                  tableButton.data.details.customer &&
                  tableButton.data.details.customer.phone
                ) {
                  const amount = $('#billGrandtotal').text();
                  const { phone } = tableButton.data.details.customer;
                  const { name } = tableButton.data.details.customer;

                  sendEbill({
                    phone,
                    name,
                    amount,
                    order_id: tableButton.data.details.bill_number,
                    delivery_type: 'dine-in',
                    for_payment_link: 0,
                  });
                }

                $(`#${tableButton.id}`).css(
                  'background-color',
                  TableUtils.Colors.FREE_TABLE,
                );
                tableButton.data.details.color = TableUtils.Colors.FREE_TABLE;
                tableButton.data.table_action_flag =
                  TableUtils.State.FREE_TABLE;
                resetdineinData(tableButton);
                resetBilldetails(tableButton);
                $('#currentTablename').html('');
                $('#dineinbillcurrentTablename').html('');
                resetCurrentabledata(tableButton);
                if (VIRTUALTABLE_FLAG_ID == responseData.order_type_flag) {
                  const index = tableName_suggestions.indexOf(
                    tableButton.data.table_name,
                  );
                  if (index > -1) {
                    tableName_suggestions.splice(index, 1);
                  }
                  $(`#${tableButton.id}`).remove();
                  ipcRenderer.send(DELETE_TABLE, `${responseData.table_id}`);
                }
                // $('#table-actions-divid *').prop('disabled', false);
                // $('#tablesContainer *').prop('disabled', false);
                if ($('#transferordercheckid').is(':checked')) {
                  $('#transferordercheckid').prop('checked', false);
                }
              }

              break;
            default:
              break;
          }

          if (responseData.order_state != undefined) {
            switch (responseData.order_state) {
              case OrderState.FREE:
                window.notifyUser.showMessage(
                  'success',
                  $.i18n.t('controller:orderController.billSavedAsFree'),
                );
                break;
              case OrderState.CANCELLED:
                window.notifyUser.showMessage(
                  'success',
                  $.i18n.t('controller:orderController.billCancelled'),
                );
                break;
              default:
                if (window.showCskAndTerminalNotifications) {
                  window.notifyUser.showMessage(
                    'success',
                    $.i18n.t('controller:orderController.billSettled'),
                  );
                }
                break;
            }
          }
          postSettleprocessing(responseData.order_id, responseData.order_state);
          sendBillsettledevent(responseData);
          // toggleitemtableView();
          if (tableButton)
            // $('#' + tableButton.id).css('border', 'none');
            $(`#${tableButton.id}`).removeClass('selected-table-border');

          tableButton = undefined;
        } else if (responseData.message) {
          if (
            responseData.errorMessage &&
            responseData.errorMessage == 'PaymentNotMatch'
          ) {
            preshowPaymentWindow(false);
          }
          window.notifyUser.showMessage('error', responseData.message);
          // $('#table-actions-divid *').prop('disabled', false);
          // $('#tatable-actions-divid *').prop('disabled', false);
          // $('#tablesContainer *').prop('disabled', false);
        } else {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:orderController.billSettledFailedTryAgain'),
          );
          // $('#table-actions-divid *').prop('disabled', false);
          // $('#tatable-actions-divid *').prop('disabled', false);
          // $('#tablesContainer *').prop('disabled', false);
        }
      }
      OrderHubSaveBillTaskQueue.run();
    } catch (error) {
      window.savebillisinProgress = false;
      console.log(error);
    } finally {
      // Clean up context map entry
      window.savebillisinProgress = false;
      if (responseData?.table_id) {
        saveBillContextMap.delete(String(responseData.table_id));
      }
    }
  }
});

function resetCurrentabledata(tableBtn) {
  const btn = tableBtn || currenttableButton;
  btn.data.details.bill_number = 0;
  btn.data.details.order_id = 0;
  btn.data.details.items = [];
  btn.data.details.printBillItems = [];
  btn.data.details.payment_mode = defaultPaymentoption;
  btn.data.details.paymentAdded = false;
  btn.data.details.charges = window.defaultdineinOrdercharges || [];
  btn.data.details.order_state = '';
  btn.data.table_action_flag = TableUtils.State.FREE_TABLE;
  btn.data.details.discount = 0;
  btn.data.details.discount_type = undefined;
  btn.data.details.customer = undefined;
  btn.data.details.discounttoApply = 0;

  btn.data.details.couponDisountamt = 0;
  btn.data.details.couponDisounttype = 0;
  btn.data.details.coupon = undefined;
  btn.data.details.issectionwisebilling = ISBILLINGBYSECTION_ON;
  btn.data.details.discountHistory = undefined;
  btn.data.details.kotcreatedAt = undefined;
  btn.data.details.cust_paid_amount = undefined;

  btn.data.details.preorderInfo = undefined;
  btn.data.details.is_pre_order = 0;
  btn.data.details.custom_bill_number = undefined;
  btn.data.details.extra_details = {};
  btn.data.details.order_total = 0;
  btn.data.details.order_subtotal = 0;
  btn.data.details.payment_modes = undefined;
  btn.data.details.totalCharges = 0;
  btn.data.details.item_level_total_charges = 0;
  btn.data.details.persons = 0;
  btn.data.details.instructions = undefined;
  btn.data.details.isBillModified = undefined;
  btn.data.details.draftprint_status = 0;
  btn.data.details.field2 = undefined;
  btn.data.details.print_status = 0;
  btn.data.details.deliveryboy_id = undefined;

  if (btn.data.details.firstKOTPrinted != undefined) {
    delete btn.data.details.firstKOTPrinted;
  }

  if (btn.data.details.covers) delete btn.data.details.covers;

  if (btn.data.details.waiter) {
    delete btn.data.details.waiter;
    delete btn.data.details.waiter_id;
  }
  if (btn.data.details.hasactivePreviouskot) {
    delete btn.data.details.hasactivePreviouskot;
  }
  delete btn.data.details.defaultchargesRemoved;
  delete btn.data.details.field2;
}

function resetdineinData() {
  $('#billTable').find('tr:not(:first)').remove();
  $('#billGrandtotal').html('');
  $('#kotnoteField').val('');
  $('#noofpersonsField').val('');
  $('#kotcustomernameField').val('');
  // $('#kotcustomermobileField').val('');
  // $('#kotcustomeraddressField').val('');
  $('#showOnBillcheckid').prop('checked', showcustomeronbillCheck);
  $('#ebillBillcheckid').prop('checked', false);
}

function resettaHddata() {
  $('#takeawaybillGrandtotal').html('');
  $('#takeawaykottotalLabel').html('');
  $('#takeawaykotnoteField').val('');
  $('#takeawaynoofpersonsField').val('');
  $('#takeawaykotcustomernameField').val('');
  $('#takeawaykotcustomermobileField').val('');
  $('#takotcustomeraddressField').val('');
  $('#showOntakeawayBillcheckid').prop('checked', showcustomeronbillCheck);
  $('#takeawayebillBillcheckid').prop('checked', false);
  $('#takeawayPreordercheckid').prop('checked', false);
  $('#takeawaycurrentTablename').html('');
  $('#takeawaybillcurrentTablename').html('');
  $('#dboyselectionId').prop('selectedIndex', 0);
  $('#takebillTable').find('tr:not(:first)').remove();
}

function resetDeliverydata() {
  $('#deliverbillGrandtotal').html('');
  $('#deliverykottotalLabel').html('');
  $('#deliverykottotalLabel').html('');
  $('#deliverykotnoteField').val('');
  $('#deliverynoofpersonsField').val('');
  $('#deliverykotcustomernameField').val('');
  $('#deliverykotcustomermobileField').val('');
  $('#deliverykotcustomeraddressField').val('');
  $('#showOndeliveryBillcheckid').prop('checked', showcustomeronbillCheck);
  $('#deliveryebillBillcheckid').prop('checked', false);
  $('#deliveryPreordercheckid').prop('checked', false);
  $('#deliverycurrentTablename').html('');
  $('#deliverybillcurrentTablename').html('');
  $('#dboyselectionId').prop('selectedIndex', 0);
  $('#deliverybillTable').find('tr:not(:first)').remove();
}

async function resetBilldetails(tableButton) {
  const targetTable = tableButton || currenttableButton;
  if (window.showbillDetails && targetTable) {
    try {
      $(`#${targetTable.id}`).find('#tablebillnumberlabel').html('&nbsp');
      $(`#${targetTable.id}`).find('#tableamountlabel').html('&nbsp');
      $(`#${targetTable.id}`).find('#tableorderstatusLabel').html('&nbsp');
      if (showkotnosonTable) {
        $(`#${targetTable.id}`).find('#tablekotnosLabelid').html('&nbsp');
      }
      $(`#${targetTable.id}`).find('#tableCreatedByLabelid').html('&nbsp');
      $(`#${targetTable.id}`).find('#tableOrdernoLabelid').html('&nbsp');
      $(`#${targetTable.id}`)
        .find('#tablekottimelabelId')
        .attr('title', '')
        .html('&nbsp');
      $(`#${targetTable.id}`)
        .find('#tablecustomernameLabelid')
        .attr('title', '')
        .html('&nbsp');

      $(`#${targetTable.id}`)
        .find('#tablewaiterLabelid')
        .attr('title', '')
        .html('&nbsp');
    } catch (error) {
      console.error(error);
    }
  }
}

/**
 * Called after the bill is settled.
 */
async function postSettleprocessing(order_id, orderState) {
  // If silent sync is turned on the the order will
  // be synced.
  sendsilentSyncrequestfromremote();
  if (
    window.reduceInventorystatus &&
    !ORDERSTATEFOR_REDUCEINVENTORY.includes(orderState)
  ) {
    // betteripcRenderer.callMain(MISC_IPC.AUTO_REDUCE_INVENTORY);
    initAutoReduceInventory();
  }
  if (window.storeDetails.loyalty_enabled) {
    setTimeout(() => {
      sendPointruleactionifexists({
        order_id,
        store_id: window.storeDetails.store_id,
        tmpos_id: window.storeDetails.tmpos_id,
      });
    }, 3000);
  }
  if ($('#orderSettlemetWindowParentDivID').is(':visible')) {
    window.fetchBillsFromRemote();
  }

  ipcRenderer.send(ORDER_IPC.CHECK_SYNC_STATUS, undefined);
  // ipcRenderer.send(ORDER_IPC.SEND_COUPON_HISTORY, undefined);
  initSendCouponHistory();
}

async function showDuepayavaiablemark({ visible, hideall }) {
  // customerhistoryButton
  if (hideall) {
    $(
      `#customerhistoryButton span,#quickcustomerhistoryButton span,#takeawaycustomerhistoryButton span`,
    ).hide();
    return;
  }
  const activeTab = $('.mainsectionTabs li a.active').attr('id');
  if (activeTab) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
        $(`#customerhistoryButton span`).css('display', visible ? '' : 'none');
        break;
      case TAKEAWAY_TAB_ID:
        $(`#takeawaycustomerhistoryButton span`).css(
          'display',
          visible ? '' : 'none',
        );
        break;
      case QUICK_TAB_ID:
        $(`#quickcustomerhistoryButton span`).css(
          'display',
          visible ? '' : 'none',
        );
        break;
      default:
        break;
    }
  }
}

function getCustomer(byName, filter) {
  let selectedCustomer;
  if (filter) {
    selectedCustomer = _.find(
      customersList,
      byName ? { name: filter } : { phone: filter },
    );
  }
  return selectedCustomer;
}
const findIndexById = (arr, id) => arr.findIndex((obj) => obj.id === id);
/**
 * Check and apply the customized discount to the
 * current window.
 * @param {Discount info} data
 */
async function applyCustomizediscount(
  customizedDiscountList,
  checkSilently,
  billing_type,
  tableButton,
) {
  let discountAmount = 0;
  const customizeDiscounts = [...customizedDiscountList];
  if (customizedDiscountList && customizedDiscountList.length) {
    // get day wise discount
    customizedDiscountList.forEach((discount, i) => {
      if (discount.discount_day !== 0) {
        const currentDate = moment();
        let currentDay = currentDate.day();
        currentDay += 1;
        const valid_day = discount.discount_day;
        if (currentDay != valid_day) {
          // customizedDiscount = discount;
          const index = findIndexById(customizeDiscounts, discount.id);
          customizeDiscounts.splice(index, 1);
        }
      }
    });
  }
  let customizedDiscount = customizeDiscounts[0];
  let customiseddiscountType = customizedDiscount.type;
  if (customizedDiscount && customizedDiscount.amount) {
    discountAmount = customizedDiscount.amount;
    // Check if disount has specific active period
    if (customizedDiscount.from_date_time && customizedDiscount.to_date_time) {
      try {
        const applicabletoday = moment().isBetween(
          customizedDiscount.from_date_time,
          customizedDiscount.to_date_time,
        );
        if (!applicabletoday) {
          if (!checkSilently)
            window.notifyUser.showMessage(
              'error',
              `${$.i18n.t(
                'controller:orderController.discountIsValid.discountIsValidBetween',
              )} ${customizedDiscount.from_date_time} ${$.i18n.t(
                'controller:orderController.discountIsValid.to',
              )} ${customizedDiscount.to_date_time}`,
              0,
            );
          return;
        }
      } catch (error) {
        console.log(error);
      }
    }

    let billTotal = 0;
    let billsubTotal = 0;
    let currenttable;
    // const activeTab = $('.mainsectionTabs li a.active').attr('id');
    const activeTab = DINEIN_TAB_ID;

    const discountorderTypes = String(customizedDiscount.order_type).split(',');
    if (activeTab) {
      // order_type 0=All ,1=Quick Bill, 2=Dine In, 3= TA
      switch (billing_type) {
        case DINEIN_BILLING_FLAG:
          {
            currenttable = tableButton || currenttableButton;
            if (
              !discountorderTypes.includes(CUSTOMISED_DISCOUNT_ORDERTYPE.ALL) &&
              !discountorderTypes.includes(
                CUSTOMISED_DISCOUNT_ORDERTYPE.DINE_IN,
              )
            ) {
              if (!checkSilently)
                window.notifyUser.showMessage(
                  'error',
                  $.i18n.t(
                    'controller:orderController.notApplicableToThisSection',
                  ),
                );
              return;
            }
            resetCurrentdiscount(currenttable);
            await precalculateDetailsCheck(currenttable);

            billTotal = currenttable?.data?.details.order_total;
            if (!billTotal) {
              billTotal = $('#billGrandtotal').text();
            }
            billsubTotal = currenttable.data.details.order_subtotal;
          }
          break;
        case TAKEAWAY_BILLING_FLAG:
          // case TAKEAWAY_TAB_ID:
          {
            if (
              !discountorderTypes.includes(CUSTOMISED_DISCOUNT_ORDERTYPE.ALL) &&
              !discountorderTypes.includes(
                CUSTOMISED_DISCOUNT_ORDERTYPE.TAKEAWAY,
              )
            ) {
              if (!checkSilently)
                window.notifyUser.showMessage(
                  'error',
                  $.i18n.t(
                    'controller:orderController.notApplicableToThisSection',
                  ),
                );
              return;
            }

            currenttable = tableButton || currenttableButton;
            resetCurrentdiscount(currenttable);
            await precalculateDetailsCheck(currenttable);

            billTotal = currenttable.data.details.order_total;
            if (!billTotal) {
              billTotal = $('#takeawaybillGrandtotal').text();
            }
            billsubTotal = currenttable.data.details.order_subtotal;
          }
          break;

        case HOMED_BILLING_FLAG:
          {
            // HD Type
            if (
              !discountorderTypes.includes(CUSTOMISED_DISCOUNT_ORDERTYPE.ALL) &&
              !discountorderTypes.includes(
                CUSTOMISED_DISCOUNT_ORDERTYPE.HOME_DELIVERY,
              )
            ) {
              if (!checkSilently)
                window.notifyUser.showMessage(
                  'error',
                  $.i18n.t(
                    'controller:orderController.notApplicableToThisSection',
                  ),
                );
              return;
            }

            currenttable = tableButton || currenttableButton;
            resetCurrentdiscount(currenttable);
            await precalculateDetailsCheck(currenttable);

            billTotal = currenttable.data.details.order_total;
            if (!billTotal) {
              billTotal = $('#deliverybillGrandtotal').text();
            }
            billsubTotal = currenttable.data.details.order_subtotal;
          }
          break;
        case QUICK_TAB_ID:
          {
            currenttable = quickbilltableButton;
            if (
              !discountorderTypes.includes(CUSTOMISED_DISCOUNT_ORDERTYPE.ALL) &&
              !discountorderTypes.includes(
                CUSTOMISED_DISCOUNT_ORDERTYPE.QUICK_BILL,
              )
            ) {
              if (!checkSilently)
                window.notifyUser.showMessage(
                  'error',
                  $.i18n.t(
                    'controller:orderController.notApplicableToThisSection',
                  ),
                );
              return;
            }
            resetCurrentdiscount(currenttable);
            await precalculateDetailsCheck(currenttable);
            billTotal = currenttable.data.details.order_total;
            if (!billTotal) billTotal = $('#quickbillGrandtotal').text();
            billsubTotal = currenttable.data.details.order_subtotal;
          }
          break;
        default:
          break;
      }
      if (currenttable == undefined) {
        if (!checkSilently)
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:orderController.pleaseSelectTheTable'),
          );
        return;
      }

      try {
        billTotal = Number(billTotal);
      } catch (error) {
        billTotal = 0;
      }
      if (billTotal == 0) {
        return;
      }
      if (billsubTotal && billTotal !== billsubTotal) {
        billTotal = billsubTotal;
      }
      if (customizedDiscount.discount_day != 0) {
        // 7 For All day'ck
        let daytoCheck = customizedDiscount.discount_day;
        const currentDate = moment();
        let currentDay = currentDate.day();
        currentDay++;
        daytoCheck -= 1;
        if (daytoCheck != currentDay) {
          if (!checkSilently)
            window.notifyUser.showMessage(
              'error',
              `${$.i18n.t(
                'controller:orderController.discountIsOnlyApplicableOn',
              )} ${currentDate.day(daytoCheck).format('dddd')}`,
            );
          return;
        }
      }

      if (
        customizedDiscount.amount_lower_limit == 0 &&
        customizedDiscount.amount_upper_limit == 0 &&
        customizedDiscount.applicable_on_amount > billTotal
      ) {
        if (!checkSilently)
          window.notifyUser.showMessage(
            'error',
            `${$.i18n.t(
              'controller:orderController.minimumTotal.minimumTotalIs',
            )} ${window.currency} ${
              customizedDiscount.applicable_on_amount
            } ${$.i18n.t(
              'controller:orderController.minimumTotal.toApplyThisDiscount',
            )}`,
          );
        return;
      }
      // Check if their is a lower limit for bill amount
      if (
        customizedDiscount.amount_lower_limit &&
        customizedDiscount.amount_lower_limit > billTotal
      ) {
        if (!checkSilently)
          window.notifyUser.showMessage(
            'error',
            `${$.i18n.t(
              'controller:orderController.minimumTotal.minimumTotalIs',
            )} ${window.currency} ${
              customizedDiscount.amount_lower_limit
            } ${$.i18n.t(
              'controller:orderController.minimumTotal.toApplyThisDiscount',
            )}`,
          );
        return;
      }
      // Check if their is a max limit for bill amount
      if (
        customizedDiscount.amount_upper_limit &&
        customizedDiscount.amount_upper_limit < billTotal
      ) {
        if (!checkSilently)
          window.notifyUser.showMessage(
            'error',
            `${$.i18n.t(
              'controller:orderController.maximumTotal.minimumTotalIs',
            )} ${window.currency} ${
              customizedDiscount.amount_upper_limit
            } ${$.i18n.t(
              'controller:orderController.maximumTotal.toApplyThisDiscount',
            )}`,
          );
        return;
      }

      // Verify if discount amount is valid 0 Fixed 1 Percent
      if (customiseddiscountType == 2 && discountAmount >= billTotal) {
        if (!checkSilently)
          window.notifyUser.showMessage(
            'error',
            $.i18n.t(
              'controller:orderController.discountAmountCannotBeGreaterThanBillAmount',
            ),
          );
        return;
      }
      if (customiseddiscountType == 1 && discountAmount >= 100) {
        if (!checkSilently)
          window.notifyUser.showMessage(
            'error',
            $.i18n.t(
              'controller:orderController.discountAmountCannotBeGreaterThanBillAmount',
            ),
          );
        return;
      }
      // Check if disount is after a amount
      if (
        customizedDiscount.discount_after_amount &&
        customizedDiscount.discount_after_amount > 0 &&
        billTotal > customizedDiscount.discount_after_amount
      ) {
        billTotal -= customizedDiscount.discount_after_amount;
      }

      // Check if discount value is in percent
      // If yes then convert it
      if (customiseddiscountType == 1) {
        discountAmount = (billTotal / 100) * customizedDiscount.amount;
        // discountAmount = Number(((billTotal * customizedDiscount.amount) / 100).toFixed(ROUNDOFF_UPTO));
      }
      // Check if the maximum discount limit is given
      // If yes then apply only maximum amount
      if (
        customizedDiscount.max_applicable_discount &&
        discountAmount > customizedDiscount.max_applicable_discount
      ) {
        discountAmount = customizedDiscount.max_applicable_discount;
        customiseddiscountType = '0';
        customizedDiscount.amount = discountAmount;
        if (!checkSilently)
          window.notifyUser.showMessage(
            'success',
            `${$.i18n.t(
              'controller:orderController.maximumApplicableDiscountAmountIs',
            )} ${window.currency} ${
              customizedDiscount.max_applicable_discount
            }`,
            0,
          );
      }
      applyDiscounttotable(currenttable, {
        rate: customizedDiscount.amount,
        discount_type: customiseddiscountType == 1 ? '1' : '0',
        discount_name: customizedDiscount.title || '',
        product_groups: customizedDiscount.product_groups,
      });

      const reason = $('#discountreasonInputid').val();
      if (reason) {
        if (reason.length > 100) {
          window.notifyUser.showMessage(
            'error',
            'Reason length should be less than 100',
          );
          return;
        }

        if (window.allspecialCharRegex.test(reason)) {
          window.notifyUser.showMessage(
            'error',
            'Special characters are not allowed in reason',
          );
          return;
        }
      }
      if (reason) {
        billstatusReason = addOrderlevelinstructions(
          billstatusReason,
          reason,
          'Discount',
        );
      }

      if (window.ISBILLINGBYSECTION_ON && !customizedDiscount.product_groups) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:orderController.discountDoesntHaveAnyProductGroups',
          ),
        );
      }
      await precalculateDetailsCheck(currenttable);
      switch (billing_type) {
        case DINEIN_BILLING_FLAG:
        case TAKEAWAY_BILLING_FLAG:
        case HOMED_BILLING_FLAG:
          {
            const table_id = currenttable.id.replace('table_', '');
            const paymentData = {
              table_id,
              data: {
                // discount_type: '0',
                // rate: discountAmount,
                product_groups: customizedDiscount.product_groups
                  ? customizedDiscount.product_groups
                  : undefined,
                discount_type: customiseddiscountType === 1 ? '1' : '0',
                rate: customizedDiscount.amount,
                title: customizedDiscount.title || '',
              },
              order_id: currenttable.data.details.bill_number,
            };
            sendDiscountupdate &&
              sendDiscountupdate(currenttable, activeTab, paymentData);
          }
          break;
        case QUICK_TAB_ID:
          {
            applyDiscounttotable(currenttable, {
              rate: customizedDiscount.amount,
              discount_type: customiseddiscountType == 1 ? '1' : '0',
              discount_name: customizedDiscount.title || '',
              product_groups: customizedDiscount.product_groups,
            });
            precalculateDetailsCheck(quickbilltableButton);
            window.notifyUser.showMessage('success', 'Discount applied');
          }
          break;
        default:
          break;
      }
    }
  }
}

async function applyItemDiscount(data, billing_type, table_id) {
  if (data) {
    let forQuickbill = false;
    let currenttablebuttoninstance = currenttableButton;
    let current_order_type;
    const activeTab = DINEIN_TAB_ID;
    if (activeTab) {
      switch (billing_type) {
        case DINEIN_TAB_ID:
          current_order_type = 2;
          currenttablebuttoninstance = currenttableButton;
          break;
        case TAKEAWAY_TAB_ID:
          currenttablebuttoninstance = currenttableButton;
          current_order_type = 3;
          break;
        case DELIVERY_TAB_ID:
          currenttablebuttoninstance = currenttableButton;
          current_order_type = 4;
          break;
        default:
          break;
      }
    }
    let discountOrderTypes = [];
    if (data.order_type.length && data.order_type.includes(',')) {
      discountOrderTypes = data?.order_type?.split(',');
    } else {
      discountOrderTypes.push(String(data.order_type));
    }
    let checkOrderType = false;
    if (discountOrderTypes.includes(String(current_order_type))) {
      checkOrderType = true;
    }
    if (discountOrderTypes.includes('0')) {
      checkOrderType = true;
    }

    if (!checkOrderType) {
      return;
    }
    const response = await applyItemLevelDiscount(
      safeParse(data),
      currenttablebuttoninstance,
      forQuickbill,
    );

    if (table_id) {
      const tableId = `table_${table_id}`;
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
  }
}
function resetCurrentdiscount(tableInstance) {
  if (tableInstance) {
    tableInstance.data.details.discount = 0;
    tableInstance.data.details.discount_type = '0';
    tableInstance.data.details.discounted_product_groups = undefined;
    tableInstance.data.details.discount_title = '';
  }
}

async function updatetableStatusrequest(params) {
  // ipcRenderer.send(ORDER_IPC.UPDATE_TABLESTATUS, params);
  window.initUpdateTableStatus(params);
}

function setPrinterfortablewise(printerInfo, currentTableButton) {
  let activeTab = $('.mainsectionTabs li a.active').attr('id');
  let targetTable;
  if (currentTableButton) {
    targetTable = currentTableButton[0];
    activeTab = 'dineintabId';
  } else {
    targetTable = currenttableButton;
  }
  if (activeTab) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
        if (targetTable && targetTable.data.order_type_flag == DINEIN_FLAG_ID) {
          const tablePrinter = _.find(
            window.printersList,
            {
              title: targetTable.content,
              action_type: PRINTER_ACTION_TYPES.TABLEWISE_PRINTER,
            },
            7,
          );
          if (tablePrinter) {
            printerInfo.deviceName = tablePrinter.device_name;
            printerInfo.copies = tablePrinter.no_of_prints;
            printerInfo.size = tablePrinter.printer_size;
            printerInfo.activate = tablePrinter.activate;
            printerInfo.title = tablePrinter.title;
          }
        }
        break;
      default:
        break;
    }
  }
}

async function printBill({
  isdraftBill,
  forQuickbill,
  currenttable,
  isRequestFromCsk,
  printBillOnBothSide,
  sendImageToCSK,
  socketUserId,
  cskPrintEvent,
  printWidth,
  currenttablebuttonData,
}) {
  try {
    if (
      window.allowModifyBill &&
      isdraftBill &&
      !forQuickbill &&
      currenttablebuttonData &&
      currenttablebuttonData.details.isBillModified == 2
    ) {
      window.notifyUser.showMessage('error', 'Please save the bill first');
      return;
    }

    let billing_type = 1;
    const targetTable =
      currenttable ||
      (forQuickbill ? quickbilltableButton : currenttableButton);

    if (!targetTable) {
      return;
    }
    const table_id = targetTable.id.replace('table_', '');

    const currentTableButton = $(`#table_${table_id}`);
    if (currenttablebuttonData) {
      switch (currenttablebuttonData.order_type_flag) {
        case 0:
          billing_type = 1;
          break;

        case 1:
          billing_type = 2;
          break;

        case 2:
          billing_type = 3;
          break;
      }
    }

    let getPrinters;
    let customPrinter;
    if (currenttable) {
      customPrinter = 'dineintabId';
    }
    let data = getcurrentwindowPrinter(customPrinter);
    if (window.printtablewiseBills && currenttablebuttonData) {
      if (isRequestFromCsk) {
        getPrinters = getPrinterbytable({
          action_type: PRINTER_ACTION_TYPES.TABLEWISE_BILL_PRINTER,
          app_source: ORDER_SOURCE_FOR_PRINT.CAPTAIN,
          billing_type: String(billing_type),
          table_name: currenttablebuttonData.table_nae,
          table_id: currenttablebuttonData.parent || currenttablebuttonData.id,
        });
      } else {
        getPrinters = getPrinterbytable({
          action_type: PRINTER_ACTION_TYPES.TABLEWISE_BILL_PRINTER,
          app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
          billing_type: String(billing_type),
          table_name: currenttablebuttonData.table_name,
          table_id: currenttablebuttonData.parent || currenttablebuttonData.id,
        });
      }
      const tablePrinter = getPrinters[0];

      if (tablePrinter && tablePrinter.length > 1) {
        let timer = 0;
        tablePrinter.forEach((printer) => {
          timer += 1000;
          setTimeout(() => {
            setMultiplePrinterfortablewise(
              data,
              currentTableButton,
              printer,
              customPrinter,
            );
          }, timer);
        });
        return;
      }
      setPrinterfortablewise(data, currentTableButton);
      // return;
    } else if (isRequestFromCsk) {
      getPrinters = await getPrinterbyordertype({
        action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
        app_source: ORDER_SOURCE_FOR_PRINT.CAPTAIN,
        billing_type: String(billing_type),
      });
    } else {
      getPrinters = await getPrinterbyordertype({
        action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
        app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
        billing_type: String(billing_type),
      });
    }
    await printPreview({
      showPopup: false,
      isdraftBill,
      forQuickbill,
      currenttable: targetTable,
      printers: getPrinters,
      printBillOnBothSide,
      sendImageToCSK,
      socketUserId,
      cskPrintEvent,
      printWidth,
      currenttablebuttonData,
    });

    if (isdraftBill) {
      if (targetTable != undefined) {
        const table_id = targetTable.id.replace('table_', '');
        const updateColordetails = {
          table_id,
          table_color: TableUtils.Colors.DRAFT_BILL_PRINTED,
          table_action_flag: TableUtils.State.DRAFT_BILL_PRINTED,
          order_id: currenttablebuttonData.details.bill_number,
        };

        // ipcRenderer.send(UPDATE_TABLECOLOR, JSON.stringify(updateColordetails));
        initUpdateTableColor(updateColordetails);
        targetTable.data.details.color = TableUtils.Colors.DRAFT_BILL_PRINTED;
        targetTable.data.table_action_flag =
          TableUtils.State.DRAFT_BILL_PRINTED;
        $(`#${currenttablebuttonData.id}`).css(
          'background-color',
          TableUtils.Colors.DRAFT_BILL_PRINTED,
        );

        const currentCount = targetTable.data.details.draftprint_status || 0;
        targetTable.data.details.draftprint_status = currentCount + 1;
      }
    } else {
      $(`#table_${table_id}`).css(
        'background-color',
        TableUtils.Colors.BILL_PRINTED,
      );
    }

    // Check if bill is saved if yes then update print_status count
    const table = forQuickbill ? quickbilltableButton : currenttableButton;
    if (
      table &&
      table.data.details.bill_number != undefined &&
      table.data.details.bill_number != 0
    ) {
      const updateprintCountdata = {
        order_id: currenttablebuttonData.details.bill_number,
        updatePrintcount: !isdraftBill,
        draftprintRequested: isdraftBill,
      };
      updateOrderDataRequest(updateprintCountdata);
    }
  } catch (error) {
    console.error(error);
  }
}

async function printPreview({
  showPopup,
  isdraftBill,
  forQuickbill,
  currenttable,
  printers,
  printBillOnBothSide,
  sendImageToCSK,
  socketUserId,
  cskPrintEvent,
  printWidth,
  currenttablebuttonData,
}) {
  // Get the current table
  let currentTable;
  if (currenttable) {
    currentTable = currenttable;
  } else {
    currentTable = forQuickbill ? quickbilltableButton : currenttableButton;
  }
  if (!currentTable) {
    return 'failure';
  }
  // let currentTable = forQuickbill ? quickbilltableButton : currenttableButton;
  const { defaultchargesRemoved } = currenttablebuttonData.details;
  // Check if the current table has some items in it.
  if (
    currenttablebuttonData.details !== undefined &&
    currenttablebuttonData.details.items.length > 0
  ) {
    let showonBill = false;
    let orderType;
    let recalculate = false;
    let custombilltitle;
    let customKOTTitle;
    const deliveryboyName = undefined;

    if (!forQuickbill) {
      let { charges } = currenttablebuttonData.details;
      if (charges == undefined || charges.length == 0) {
        if (
          window.defaultdineinOrdercharges != undefined &&
          window.defaultdineinOrdercharges.length > 0 &&
          currenttablebuttonData.details.order_type_flag === 0 &&
          !defaultchargesRemoved
        ) {
          // charges = window.defaultdineinOrdercharges;
          if (currentTable?.data['mpos_department.section'] == 1) {
            // check if bar section charges is present and remove it
            const filteredCharges = window.defaultdineinOrdercharges.filter(
              (charge) => {
                const extraDetails = safeParse(charge.extra_details);
                return extraDetails.bar_section_billing !== 1;
              },
            );
            charges = filteredCharges;
          } else {
            charges = window.defaultdineinOrdercharges;
          }
          recalculate = true;
        }
      }
      showonBill = $('#showOnBillcheckid').is(':checked');

      switch (currenttablebuttonData.order_type_flag) {
        case 0:
          orderType = 'Dine In';
          break;

        case 1:
          orderType = 'PickUp';
          break;

        case 2:
          orderType = 'Delivery';
          break;
      }
      // orderType = OrderTypes[currentTable.data.order_type_flag];
      if (
        currenttablebuttonData?.order_type_flag == 0 &&
        window.customBilltitlesettings &&
        window.customBilltitlesettings.dinein
      ) {
        custombilltitle = window.customBilltitlesettings.dinein;
      }
      if (
        currenttablebuttonData?.order_type_flag == 1 &&
        window.customBilltitlesettings &&
        window.customBilltitlesettings.takeaway
      ) {
        custombilltitle = window.customBilltitlesettings.takeaway;
      }

      if (
        currenttablebuttonData?.order_type_flag == 0 &&
        window.customKOTtitlesettings &&
        window.customKOTtitlesettings.dinein
      ) {
        customKOTTitle = window.customKOTtitlesettings.dinein;
      }

      if (
        currenttablebuttonData?.order_type_flag == 1 &&
        window.customKOTtitlesettings &&
        window.customKOTtitlesettings.takeaway
      ) {
        customKOTTitle = window.customKOTtitlesettings.takeaway;
      }
      //    break;
      // default:
      //    break;
      // }
      if (recalculate) {
        currenttablebuttonData.details.charges = charges;
        await precalculateDetailsCheck(currentTable);
      }
    } else {
      showonBill = $('#showOnquickbillBillcheckid').is(':checked');
      orderType =
        window.orderTypes[Number(window.defaultcustomerQuickordertype)]
          ?.order_type || 'Quick Bill'; // BillingTypes[defaultcustomerQuickordertype]
      const customer_name = $('#quickbillkotcustomernameField').val();
      const customer_mobile = $('#quickbillkotcustomermobileField').val();
      let customer = getCustomer(false, customer_mobile);
      if (!customer) {
        if (customer_name && customer_mobile) {
          customer = {
            name: customer_name,
            phone: customer_mobile,
            email: '',
            store_id: window.storeDetails.store_id,
            address_line1: dynamiccustomerAddressforquickbill,
            address_line2: '',
            city: '',
          };
        }
      }

      quickbilltableButton.data.details.customer = customer;

      const persons = $('#quickbillnoofpersonsField').val();
      quickbilltableButton.data.details.persons = persons;
    }

    // if remote kot and showcustomeronbill is true then show customer on bill
    if (
      currenttablebuttonData &&
      currenttablebuttonData.details &&
      currenttablebuttonData.details.remoteKot
    ) {
      showonBill = showcustomeronbillCheck;
    }

    const previewDetails = cloneDeep(currenttablebuttonData.details);
    if (
      currenttablebuttonData.details.printBillItems &&
      currenttablebuttonData.details.printBillItems.length
    ) {
      Object.assign(previewDetails, {
        items: currenttablebuttonData.details.printBillItems,
      });
    }
    const pageConfig = await setPageconfigifany();
    previewDetails.tableName = currenttablebuttonData.table_name;
    previewDetails.table_id = currenttablebuttonData?.id;
    previewDetails.tax_name = window.currentTaxname;
    previewDetails.showCustomerinfo = showonBill;
    previewDetails.isdraftBill = isdraftBill;
    previewDetails.order_type_flag = orderType;
    previewDetails.custombilltitle = custombilltitle;
    previewDetails.customKotTitle = customKOTTitle;
    if (pageConfig && pageConfig.margins) {
      previewDetails.pageConfig = pageConfig;
      window.pageconfigProvided = true;
    } else {
      window.pageconfigProvided = false;
    }

    if (showdefaultPayment) {
      previewDetails.paymentAdded = true;
    }

    if (previewDetails.draftprint_status) {
      Object.assign(previewDetails, {
        printCount: previewDetails.draftprint_status + 1,
      });
    }

    if (deliveryboyName) {
      previewDetails.deliveryboyName = deliveryboyName;
    }
    if (forQuickbill) {
      const customBillname = $('#quickbillprintChecklabel').html();
      if (customBillname) {
        previewDetails.customBillname = customBillname;
      }
    }

    // Check for loyalty reward discount
    if (window.storeDetails.loyalty_enabled) {
      const extraDetails = currenttablebuttonData.details.extra_details;
      if (extraDetails && extraDetails.rewardDiscount) {
        Object.assign(previewDetails, {
          isloyaltyrewardDiscount: true,
          pointsRedeemed: extraDetails.rewardDiscount.points_redeemed,
        });
      } else {
        Object.assign(previewDetails, {
          isloyaltyrewardDiscount: false,
          pointsRedeemed: undefined,
        });
      }
    }
    const extra_info = safeParse(window.storeDetails.extra_info);
    if (extra_info && extra_info.isReeloIntegrate) {
      const extraDetails = currenttablebuttonData.details.extra_details;
      if (
        extraDetails &&
        extraDetails.reelo &&
        extraDetails.reelo_redeemed_amount
      ) {
        Object.assign(previewDetails, {
          // reeloRedeemAmount: extraDetails.reelo.redeemed_amount
          reelo_redeemed_amount: extraDetails.reelo_redeemed_amount,
        });
      }
    }
    Object.assign(previewDetails, {
      job_id: window.generateId(10),
    });

    console.log(
      `[SaveAndPrintFromCSK] Message="Add Bill print job in queue" JobId="${previewDetails?.job_id}" order_id="${previewDetails?.bill_number}" bill_number="${previewDetails.order_id}" billing_type="${previewDetails.order_type_flag}" orderType="${previewDetails.orderType}"`,
    );
    await window.printBillfromqueue({
      previewDetails,
      is_Draft_bill: isdraftBill,
      currenttable,
      printers,
      printBillOnBothSide,
      sendImageToCSK,
      socketUserId,
      cskPrintEvent,
      printWidth,
    });
    // await sleep(500);
    window.savebillisinProgress = false;
    return 'success';
  }
  window.notifyUser.showMessage(
    'error',
    $.i18n.t('controller:orderController.noItems'),
  );
  return 'failure';
}

async function setPageconfigifany(istabidProvided) {
  const currentPrinter = getcurrentwindowPrinter(istabidProvided);
  if (currentPrinter && currentPrinter.size && window.settingsConfig) {
    let margins;
    $('#preview-footer-actionsid').attr('size', currentPrinter.size);
    let currentSize = '80mm';
    switch (currentPrinter.size) {
      case PRINTER_SIZES_REFID.PRINTER_58MM.ID:
        margins = window.settingsConfig[PRINTER_58_CONFIG - 1].value;
        currentSize = PRINTER_SIZES_REFID.PRINTER_58MM.SIZE;
        $('#previewContainerid').css({
          width: PRINTER_SIZES_REFID.PRINTER_58MM.SIZE,
        });
        break;
      case PRINTER_SIZES_REFID.PRINTER_80MM.ID:
        currentSize = PRINTER_SIZES_REFID.PRINTER_80MM.SIZE;
        $('#previewContainerid').css({
          width: PRINTER_SIZES_REFID.PRINTER_80MM.SIZE,
        });
        margins = window.settingsConfig[PRINTER_80_CONFIG - 1].value;
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
            $('#previewContainerid').css({
              width: rawmargins[1],
            });
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

function getcurrentwindowPrinter(istabidProvided) {
  let deviceName;
  let copies = 1;
  let size = 2;
  let activate = true;
  let activeTab = $('.mainsectionTabs li a.active').attr('id');
  if (istabidProvided) {
    activeTab = istabidProvided;
  }
  switch (activeTab) {
    case DINEIN_TAB_ID:
      deviceName = window.printersList[PRINTERS.DINEIN_BILL - 1].device_name
        ? window.printersList[PRINTERS.DINEIN_BILL - 1].device_name
        : '';
      copies = window.printersList[PRINTERS.DINEIN_BILL - 1].no_of_prints;
      size = window.printersList[PRINTERS.DINEIN_BILL - 1].printer_size;
      activate = window.printersList[PRINTERS.DINEIN_BILL - 1].activate;

      break;
    case TAKEAWAY_TAB_ID:
      if (istakeawaywindowSelected) {
        deviceName = window.printersList[PRINTERS.TAKEAWAY_BILL - 1].device_name
          ? window.printersList[PRINTERS.TAKEAWAY_BILL - 1].device_name
          : '';
        copies = window.printersList[PRINTERS.TAKEAWAY_BILL - 1].no_of_prints;
        size = window.printersList[PRINTERS.TAKEAWAY_BILL - 1].printer_size;
        activate = window.printersList[PRINTERS.TAKEAWAY_BILL - 1].activate;
      } else {
        deviceName = window.printersList[PRINTERS.HOMED_BILL - 1].device_name
          ? window.printersList[PRINTERS.HOMED_BILL - 1].device_name
          : '';
        copies = window.printersList[PRINTERS.HOMED_BILL - 1].no_of_prints;
        size = window.printersList[PRINTERS.HOMED_BILL - 1].printer_size;
        activate = window.printersList[PRINTERS.HOMED_BILL - 1].activate;
      }
      break;
    case QUICK_TAB_ID:
      deviceName = window.printersList[PRINTERS.QUICK_BILL - 1].device_name
        ? window.printersList[PRINTERS.QUICK_BILL - 1].device_name
        : '';
      copies = window.printersList[PRINTERS.QUICK_BILL - 1].no_of_prints;
      size = window.printersList[PRINTERS.QUICK_BILL - 1].printer_size;
      activate = window.printersList[PRINTERS.QUICK_BILL - 1].activate;

      break;
    default:
      deviceName = undefined;
      copies = 1;
      size = 2;
      break;
  }
  const data = {
    deviceName,
    copies,
    size,
    activate,
  };
  return data;
}

async function precalculateDetailsCheck(currenttableButton) {
  if (window.ISBILLINGBYSECTION_ON) {
    await calculateDetailsbysection(currenttableButton);
  } else {
    await calculateDetails(currenttableButton);
  }
}

async function calculateDetailsbysection(currenttableButton) {
  if (
    currenttableButton != undefined &&
    currenttableButton.data != undefined &&
    currenttableButton.data.details != undefined
  ) {
    calculationDone = false;
    const { discount } = currenttableButton.data.details;
    const { discount_type } = currenttableButton.data.details;
    const raw_discounted_product_groups =
      currenttableButton.data.details.discounted_product_groups;

    const discounted_product_groups = raw_discounted_product_groups
      ? String(raw_discounted_product_groups).split(',')
      : [];

    const { couponDisountamt } = currenttableButton.data.details;
    const { couponDisounttype } = currenttableButton.data.details;
    let billItems = currenttableButton.data.details.items;
    const kotnoSet = new Set();

    currenttableButton.data.details.order_total = 0;
    currenttableButton.data.details.totalCharges = 0;
    currenttableButton.data.details.item_level_total_charges = 0;

    const { bill_number } = currenttableButton.data.details;
    const extra_details = currenttableButton.data.details.extra_details || {};
    if (extra_details) {
      if (extra_details.exlusive_tax) extra_details.exlusive_tax = 0;
      if (extra_details.inclusive_tax) extra_details.inclusive_tax = 0;
      if (extra_details.tax) extra_details.tax = [];
    }

    const discountHistory = [];
    let finalGrandtotal = 0;
    let baseamounTotal = 0;
    let finaltaxTotal = 0;
    let finaldiscounttoApply = 0;
    let finalcoupondiscounttoApply = 0;
    let finalorder_subtotal = 0;
    let finaltotalCharges = 0;
    let finalitemlevelChargestotal = 0;
    let finalchargesamounttoExludefromtax = 0;
    let order_level_discount = 0;

    // eslint-disable-next-line no-restricted-syntax
    for (const group of window.globalproductGroups) {
      let grandTotal = 0;
      let taxTotal = 0;
      let taxInclusive = false;
      let taxDivided = false;
      let taxPercent = 0;
      let taxMethod;
      let sectionhasItems = false;
      let order_subtotal = 0;
      let chargesamounttoExludefromtax = 0;
      let recalculateTax = false;
      let sectionOrderDiscount = 0;
      const taxedProductgrps = {};
      let sectionhasDiscount =
        Number(discount || 0) > 0 || Number(couponDisountamt || 0) > 0;

      if (
        sectionhasDiscount &&
        discounted_product_groups.length > 0 &&
        discounted_product_groups.includes(String(group.id))
      ) {
        sectionhasDiscount = true;
      } else {
        sectionhasDiscount = false;
      }
      MULTI_TAX = false;

      // eslint-disable-next-line no-loop-func
      billItems.forEach((item) => {
        if (item.product_group_id == group.id) {
          sectionhasItems = true;
          item.quantity = Number(item.quantity);
          item.amount = Number(item.amount);
          item.recalculatedAmount = Number(item.amount);
          grandTotal += item.amount;
          order_subtotal += item.amount;
          recalculateTax = true;
          if (
            item.product_group_id &&
            window.taxGroupMapping[item.product_group_id]
          ) {
            Object.assign(item, {
              productGrptaxes: window.taxGroupMapping[item.product_group_id],
            });
          }

          if (
            item.productGrptaxes &&
            item.product_group_id &&
            !taxedProductgrps[item.product_group_id]
          ) {
            taxedProductgrps[item.product_group_id] = sortBy(
              item.productGrptaxes,
              'sort',
            );
          }

          if (item.productGrptaxes && item.productGrptaxes.length > 1) {
            MULTI_TAX = true;
          }

          if (MULTI_TAX) {
            resetItemtax(item);
          }
          calculateTaxForItem(item);
          if (item.amount !== 0) {
            taxTotal +=
              (item.isitemwithOption
                ? item.new_item_tax_value
                : item.item_tax_value) * item.quantity;
          }

          if (item.item_tax_per !== 0 && taxPercent === 0) {
            taxPercent = item.item_tax_per;
            taxMethod = item.item_tax_name;
            taxDivided = item.item_is_devidable == 1;
            taxInclusive = item.item_tax_method == ITEM_TAX_TYPES.INCLUSIVE;
          }

          if (
            item.itemlevelCharges &&
            Array.isArray(item.itemlevelCharges) &&
            item.itemlevelCharges.length > 0
          ) {
            let itemlevelchargesTotal = 0;
            // eslint-disable-next-line no-restricted-syntax
            for (const charge of item.itemlevelCharges) {
              // 1-percentage 0-fix
              let chargeTaxpercentage = taxPercent;
              if (charge.tax_amount) {
                chargeTaxpercentage = charge.tax_amount;
              }

              recalculateTax = true;
              let chargeAmount = charge.amount;
              if (charge.per_or_fixed == 1) {
                chargeAmount = ((item.amount * chargeAmount) / 100).toFixed(
                  ROUNDOFF_UPTO,
                );
              } else {
                chargeAmount = Number(chargeAmount) * Number(item.quantity);
              }
              chargeAmount = Number(chargeAmount).toFixed(ROUNDOFF_UPTO);
              charge.calculated_charge = chargeAmount;
              itemlevelchargesTotal += Number(chargeAmount);
              if (charge.calculate_tax_for_item_charges == 0) {
                chargesamounttoExludefromtax += Number(chargeAmount);
                finalchargesamounttoExludefromtax += Number(chargeAmount);
              } else {
                charge.calculated_tax = (
                  (chargeTaxpercentage * chargeAmount) /
                  100
                ).toFixed(ROUNDOFF_UPTO);
                Object.assign(item, {
                  recalculatedAmount:
                    item.recalculatedAmount + Number(chargeAmount),
                });
              }
            }
            finaltotalCharges += itemlevelchargesTotal;
            grandTotal += itemlevelchargesTotal;
            // order_subtotal += itemlevelchargesTotal;
            finalitemlevelChargestotal += itemlevelchargesTotal;
          }
        }
        // add kot_id to set
        if (!kotnoSet.has(item.kot_id)) kotnoSet.add(item.kot_id);
      });
      if (sectionhasItems) {
        let discounttoApply = 0;
        let coupondiscounttoApply = 0;
        finalorder_subtotal += order_subtotal;
        let discountApplied = false;
        let coupondiscountApplied = false;

        baseamounTotal += order_subtotal;
        if (sectionhasDiscount && discount_type != undefined && discount != 0) {
          discounttoApply = discount;
          // Check if discount type is in percent
          if (discount_type == '1') {
            // discounttoApply = ((grandTotal * discount) / 100).toFixed(ROUNDOFF_UPTO);
            discounttoApply = ((order_subtotal * discount) / 100).toFixed(
              ROUNDOFF_UPTO,
            );
          }

          const DiscountTotalbeforeDistribution = discounttoApply;
          let itemSubtotalBeforeDiscountApply = 0;
          let itemSubtotalAfterDiscountApply = 0;
          if (grandTotal >= discounttoApply) {
            const splittedDiscountamount = Number(
              discounttoApply / order_subtotal,
            );
            billItems.map((item) => {
              if (item.product_group_id == group.id) {
                itemSubtotalBeforeDiscountApply += Number(
                  item.recalculatedAmount,
                );
                let discountAmounttominus =
                  Number(item.recalculatedAmount) * splittedDiscountamount;
                // discountAmounttominus = Number(
                //   discountAmounttominus.toFixed(ROUNDOFF_UPTO),
                // );
                // order_level_discount += Number(
                //   discountAmounttominus.toFixed(ROUNDOFF_UPTO),
                // );
                sectionOrderDiscount += Number(discountAmounttominus);
                let recalculatedAmount = item.recalculatedAmount
                  ? item.recalculatedAmount - discountAmounttominus
                  : discountAmounttominus;
                recalculatedAmount = Number(
                  recalculatedAmount.toFixed(ROUNDOFF_UPTO),
                );
                item.recalculatedAmount
                  ? (item.recalculatedAmount = recalculatedAmount)
                  : Object.assign(item, recalculatedAmount);
                itemSubtotalAfterDiscountApply += Number(
                  item.recalculatedAmount,
                );
              }
            });
            const DiscountTotalAfterDistribution = sectionOrderDiscount;
            discounttoApply = sectionOrderDiscount;
            discounttoApply = discounttoApply.toFixed(window.ROUNDOFF_UPTO);

            grandTotal -= discounttoApply;
            // currenttableButton.data.details.discounttoApply = discounttoApply;
            finaldiscounttoApply += Number(discounttoApply);
            discountApplied = true;
            const before = parseFloat(DiscountTotalbeforeDistribution) || 0;
            const after = parseFloat(DiscountTotalAfterDistribution) || 0;

            const discountDiff =
              Number(before.toFixed(7)) - Number(after.toFixed(7));

            if (discountDiff) {
              const matchedItem = billItems.find(
                (item) => item.product_group_id === group.id,
              );
              // billItems.map((item) => {
              const amountAfterDiscountDiff =
                Number(matchedItem.recalculatedAmount) + discountDiff;
              if (amountAfterDiscountDiff > 0) {
                matchedItem.recalculatedAmount = amountAfterDiscountDiff;
                currenttableButton.data.details.discounttoApply = Number(
                  DiscountTotalbeforeDistribution,
                );
                discounttoApply = Number(DiscountTotalbeforeDistribution);
                return;
              }
              // });
            }

            // check discount on order subtotal if there is any diff then adjust this amount
            const itemSubtotalIfDiscountAppliedOnItemSubtotal =
              itemSubtotalBeforeDiscountApply - discounttoApply;

            if (
              itemSubtotalIfDiscountAppliedOnItemSubtotal !==
              itemSubtotalAfterDiscountApply
            ) {
              const subTotalDifference =
                itemSubtotalAfterDiscountApply -
                itemSubtotalIfDiscountAppliedOnItemSubtotal;
              const matchedItem = billItems.find(
                (item) => item.product_group_id === group.id,
              );
              matchedItem.recalculatedAmount =
                Number(matchedItem.recalculatedAmount) -
                Number(subTotalDifference);
            }
          }
        }

        if (
          sectionhasDiscount &&
          couponDisountamt != undefined &&
          couponDisountamt > 0
        ) {
          coupondiscounttoApply = couponDisountamt;
          // couponDisounttype 1=percentage 0=fixed
          if (Number(couponDisounttype) == 1) {
            coupondiscounttoApply = (
              (order_subtotal * coupondiscounttoApply) /
              100
            ).toFixed(ROUNDOFF_UPTO);
          }
          if (grandTotal >= coupondiscounttoApply) {
            const splittedDiscountamount = Number(
              coupondiscounttoApply / (order_subtotal - finaldiscounttoApply),
            );

            billItems.map((item) => {
              let discountAmounttominus =
                Number(item.recalculatedAmount) * splittedDiscountamount;
              discountAmounttominus = Number(
                discountAmounttominus.toFixed(ROUNDOFF_UPTO),
              );
              // order_level_discount += Number(
              //   discountAmounttominus.toFixed(ROUNDOFF_UPTO),
              // );
              let recalculatedAmount = item.recalculatedAmount
                ? item.recalculatedAmount - discountAmounttominus
                : discountAmounttominus;
              recalculatedAmount = Number(
                recalculatedAmount.toFixed(ROUNDOFF_UPTO),
              );
              item.recalculatedAmount
                ? (item.recalculatedAmount = recalculatedAmount)
                : Object.assign(item, recalculatedAmount);
            });
            grandTotal -= coupondiscounttoApply;
            finalcoupondiscounttoApply += Number(coupondiscounttoApply);
            // currenttableButton.data.details.coupondiscounttoApply = coupondiscounttoApply;
            coupondiscountApplied = true;
          }
        }

        if (discountApplied || coupondiscountApplied || recalculateTax) {
          let taxtocalculateonAmount = grandTotal;
          if (chargesamounttoExludefromtax > 0) {
            taxtocalculateonAmount -= chargesamounttoExludefromtax;
          }
          taxTotal = 0;
          if (MULTI_TAX) {
            let taxapplicableAmount = taxtocalculateonAmount;

            // check if taxes are inclusive and has calculations on subtotal + prev tax totals
            if (taxedProductgrps && !_.isEmpty(taxedProductgrps)) {
              Object.values(taxedProductgrps).forEach((ptaxes) => {
                if (ptaxes && ptaxes.length) {
                  let divisionFactorforcurrentgrp = 0;
                  let inclusiveTaxrates = 0;
                  ptaxes.forEach((currentptax) => {
                    // Check if tax type is inclusive
                    // If the tax type is inclusive we
                    let isTaxontax = false;
                    if (
                      currentptax?.extra_details?.isTaxOnTax &&
                      currentptax?.extra_details?.applicableOnIds &&
                      currentptax?.extra_details?.applicableOnIds.length
                    ) {
                      isTaxontax = true;
                    }

                    if (isTaxontax) {
                      // Skip the tax if it is tax on tax
                      // return;
                    }

                    if (currentptax.tax_method === 1) {
                      if (
                        currentptax.cal_method ===
                          TAX_CALCULATION_ON.SUBTOTAL &&
                        currentptax?.extra_details?.inclusiveDivfactor
                      ) {
                        divisionFactorforcurrentgrp =
                          currentptax?.extra_details?.inclusiveDivfactor;
                      } else {
                        inclusiveTaxrates += currentptax.tax_perct * 0.01;
                      }
                    }
                  });
                  if (divisionFactorforcurrentgrp > 0) {
                    // recalculate the subtotal
                    taxapplicableAmount /= divisionFactorforcurrentgrp;
                  } else if (inclusiveTaxrates > 0) {
                    taxapplicableAmount /= 1 + inclusiveTaxrates;
                  }
                }
              });
            }

            totalwithoutTax = taxapplicableAmount;

            const previousTaxtotal = [];
            const previousTaxesmap = {};
            const taxlistTomaintain = [];
            let inclusiveTotal = 0;
            let exclusiveTotal = 0;

            // Check if there are multiple taxes present and apply
            if (taxedProductgrps && !_.isEmpty(taxedProductgrps)) {
              Object.keys(taxedProductgrps).forEach((currentpg) => {
                const taxList = taxedProductgrps[currentpg];
                if (taxList && taxList.length) {
                  taxList.forEach((currentTax) => {
                    if (currentTax && !currentTax.applied) {
                      const isInclusive = currentTax.tax_method === 1;

                      let applyTaxon = taxapplicableAmount;
                      if (
                        currentTax.cal_method ===
                        TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX
                      ) {
                        // Add the previous tax totals as well
                        applyTaxon =
                          taxapplicableAmount +
                          previousTaxtotal.reduce((a, b) => a + b, 0);
                      } else if (
                        currentTax.cal_method === TAX_CALCULATION_ON.PREVIOUSTAX
                      ) {
                        // Add the previous tax totals as well
                        applyTaxon = previousTaxtotal.reduce(
                          (a, b) => a + b,
                          0,
                        );
                      }

                      // check the tax is on tax
                      if (
                        currentTax?.extra_details?.isTaxOnTax &&
                        currentTax?.extra_details?.applicableOnIds &&
                        currentTax?.extra_details?.applicableOnIds.length &&
                        (currentTax.cal_method ===
                          TAX_CALCULATION_ON.PREVIOUSTAX ||
                          currentTax.cal_method ===
                            TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX)
                      ) {
                        let previoustotalforcurrent = 0;
                        currentTax?.extra_details?.applicableOnIds.forEach(
                          (grpid) => {
                            previoustotalforcurrent +=
                              previousTaxesmap[grpid] || 0;
                          },
                        );

                        if (previoustotalforcurrent > 0) {
                          // applyTaxon = previoustotalforcurrent;
                          if (
                            currentTax.cal_method ===
                            TAX_CALCULATION_ON.PREVIOUSTAX
                          ) {
                            applyTaxon = previoustotalforcurrent;
                          } else {
                            applyTaxon =
                              taxapplicableAmount + previoustotalforcurrent;
                          }
                        } else {
                          // If the taxes total is 0 then do not apply
                          return;
                        }
                      }

                      const currentTaxtotal = calculateTax({
                        amount: applyTaxon,
                        inclusive: false,
                        tax_percent: currentTax.tax_perct,
                        is_devidable: Boolean(currentTax.is_devidable),
                      });

                      previousTaxtotal.push(currentTaxtotal);

                      Object.assign(previousTaxesmap, {
                        [currentTax.tax_id]: currentTaxtotal,
                      });

                      taxlistTomaintain.push({
                        name: currentTax.tax_name,
                        tax_percent: currentTax.tax_perct,
                        amount: currentTaxtotal,
                        tax_inclusive: isInclusive,
                        taxDivided: Boolean(currentTax.is_devidable),
                        section: group.product_group_name,
                      });

                      if (isInclusive) {
                        inclusiveTotal += currentTaxtotal;
                      } else {
                        exclusiveTotal += currentTaxtotal;
                      }
                      billItems.map((item) => {
                        calculateMultiTaxForItemLevel(item);
                      });
                      // previousTaxtotal=currentTax.TaxValue;
                    }
                  });
                }
              });
            }

            // add the tax details to the extra details object
            let taxDetails = extra_details.tax;
            if (taxDetails) {
              taxDetails.push(...taxlistTomaintain);
            } else {
              taxDetails = taxlistTomaintain;
            }

            Object.assign(extra_details, {
              ...(inclusiveTotal && {
                inclusive_tax: inclusiveTotal,
              }),
              ...(exclusiveTotal && {
                exlusive_tax: exclusiveTotal,
              }),
              tax: taxDetails,
            });

            // Now add the exclusive tax total to order total
            if (exclusiveTotal > 0) {
              grandTotal += exclusiveTotal;
            }

            taxTotal = Number(
              Number(inclusiveTotal + exclusiveTotal).toFixed(
                window.ROUNDOFF_UPTO,
              ),
            );
            finaltaxTotal += Number(taxTotal.toFixed(window.ROUNDOFF_UPTO));

            currenttableButton.data.details.taxtoApply =
              taxTotal.toFixed(ROUNDOFF_UPTO);
            finalGrandtotal += grandTotal;
          } else {
            taxTotal = 0;
            billItems.map((item) => {
              if (item.product_group_id == group.id) {
                taxTotal += calculateTaxForItem(item);
              }
            });

            finaltaxTotal += Number(taxTotal.toFixed(window.ROUNDOFF_UPTO));
            let taxDetails = extra_details.tax;
            if (taxDetails) {
              taxDetails.push({
                name: taxMethod,
                tax_percent: taxPercent,
                amount: taxTotal,
                tax_inclusive: taxInclusive,
                section: group.product_group_name,
                taxDivided,
              });
            } else {
              taxDetails = [
                {
                  name: taxMethod,
                  tax_percent: taxPercent,
                  amount: taxTotal,
                  tax_inclusive: taxInclusive,
                  section: group.product_group_name,
                  taxDivided,
                },
              ];
            }

            if (!taxInclusive) {
              grandTotal += taxTotal;
              Object.assign(extra_details, {
                exlusive_tax: (extra_details.exlusive_tax || 0) + taxTotal,
                tax: taxDetails,
              });
            } else {
              Object.assign(extra_details, {
                inclusive_tax: (extra_details.inclusive_tax || 0) + taxTotal,
                tax: taxDetails,
              });
            }
            finalGrandtotal += grandTotal;
          }

          if (taxTotal === 0) {
            const sale_exempt_total =
              order_subtotal - discounttoApply - coupondiscounttoApply;
            Object.assign(extra_details, {
              sale_exempt_total,
            });
          }
        }

        if (
          bill_number != 0 &&
          (discounttoApply != 0 || coupondiscounttoApply != 0)
        ) {
          discountHistory.push({
            product_group_id: group.id,
            order_id: bill_number,
            discounted_amt: discounttoApply,
            discount_type,
            discount_rate: discount,
            coupon_code_type: couponDisounttype,
            coupon_code_rate: couponDisountamt,
            coupon_code_amt: coupondiscounttoApply,
            coupon_code_name: currenttableButton.data.details.coupon,
          });
        }

        // for quick bill because bill number is not generated
        if (
          currenttableButton.data.table_name == 'Quick Bill' &&
          (discounttoApply != 0 || coupondiscounttoApply != 0)
        ) {
          discountHistory.push({
            product_group_id: group.id,
            order_id: bill_number,
            discounted_amt: discounttoApply,
            discount_type,
            discount_rate: discount,
            coupon_code_type: couponDisounttype,
            coupon_code_rate: couponDisountamt,
            coupon_code_amt: coupondiscounttoApply,
            coupon_code_name: currenttableButton.data.details.coupon,
          });
        }
      }
    }

    if (finalorder_subtotal && discount && !discounted_product_groups.length) {
      let discounttoApply = discount;

      if (discount_type == '1') {
        // discounttoApply = ((grandTotal * discount) / 100).toFixed(ROUNDOFF_UPTO);
        discounttoApply = ((finalorder_subtotal * discount) / 100).toFixed(
          ROUNDOFF_UPTO,
        );
      }

      finalGrandtotal = Number(finalGrandtotal.toFixed(window.ROUNDOFF_UPTO));

      if (finalGrandtotal >= discounttoApply) {
        discounttoApply = Number(discounttoApply);
        const DiscountTotalbeforeDistribution = discounttoApply;
        // if (!details.isOldbill) {
        //   grandTotal = grandTotal - discounttoApply;
        // }
        discountApplied = true;
        const splittedDiscountamount = Number(
          discounttoApply / finalorder_subtotal,
        );

        billItems.map((item) => {
          const discountAmounttominus = Number(
            Number(item.recalculatedAmount) * splittedDiscountamount,
          );
          order_level_discount += Number(discountAmounttominus);
          // order_level_discount = Number(order_level_discount.toFixed(3));
          // order_level_discount = Number(order_level_discount.toFixed(3));

          let recalculatedAmount = item.recalculatedAmount
            ? Number(item.recalculatedAmount - discountAmounttominus).toFixed(
                ROUNDOFF_UPTO,
              )
            : discountAmounttominus;
          recalculatedAmount =
            Number(recalculatedAmount).toFixed(ROUNDOFF_UPTO);
          // if (!details.isOldbill || (details.isOldbill && details.billType == 0)) {
          item.recalculatedAmount
            ? (item.recalculatedAmount = recalculatedAmount)
            : Object.assign(item, recalculatedAmount);
          // }
        });
        const DiscountTotalAfterDistribution = order_level_discount;
        // details.discounttoApply = order_level_discount;
        // details.discounttoApply = discounttoApply;
        discounttoApply = order_level_discount;
        // if (!details.isOldbill) {
        finalGrandtotal -= discounttoApply;
        discounttoApply = discounttoApply.toFixed(window.ROUNDOFF_UPTO);
        finaldiscounttoApply = Number(discounttoApply);
        // check if there is any difference after discount distribution on item level
        const before = parseFloat(DiscountTotalbeforeDistribution) || 0;
        const after = parseFloat(DiscountTotalAfterDistribution) || 0;

        const discountDiff =
          Number(before.toFixed(7)) - Number(after.toFixed(7));
        if (discountDiff) {
          billItems.map((item) => {
            const amountAfterDiscountDiff =
              Number(item.recalculatedAmount) + discountDiff;
            if (amountAfterDiscountDiff > 0) {
              item.recalculatedAmount = amountAfterDiscountDiff;
              // details.discounttoApply = Number(DiscountTotalbeforeDistribution);
              discounttoApply = Number(DiscountTotalbeforeDistribution);
            }
          });
        }
      }
    }
    currenttableButton.data.details.extra_details = extra_details;
    currenttableButton.data.details.discounttoApply =
      finaldiscounttoApply.toFixed(ROUNDOFF_UPTO);
    currenttableButton.data.details.taxtoApply =
      finaltaxTotal.toFixed(ROUNDOFF_UPTO);
    currenttableButton.data.details.coupondiscounttoApply =
      finalcoupondiscounttoApply.toFixed(ROUNDOFF_UPTO);
    currenttableButton.data.details.order_subtotal =
      finalorder_subtotal.toFixed(ROUNDOFF_UPTO);
    currenttableButton.data.details.item_level_total_charges =
      finalitemlevelChargestotal;

    currenttableButton.data.details.issectionwisebilling =
      ISBILLINGBYSECTION_ON;
    if (discountHistory.length > 0) {
      currenttableButton.data.details.discountHistory = discountHistory;
    }

    if (
      discount &&
      extra_details &&
      extra_details.reelo &&
      extra_details.reelo_redeemed_amount
    ) {
      finalGrandtotal -= extra_details.reelo_redeemed_amount;
    }

    if (window.orderCharges) {
      currenttableButton.data.details.order_level_total_charges = 0;
      currenttableButton.data.details.charges_level_total_tax = 0;
      const { charges } = currenttableButton.data.details;
      if (charges && charges.length > 0) {
        let chargesTotal = 0;
        let chargesTotaltax = 0;
        charges.forEach((charge) => {
          let chargeAmount = charge.amount;
          if (charge.per_or_fixed == 1) {
            // chargeAmount = Number(((baseamounTotal * chargeAmount) / 100).toFixed(ROUNDOFF_UPTO));
            if (charge.extra_details) {
              const extra_details = safeParse(charge.extra_details);
              switch (extra_details.applicable_on_amount) {
                case 0:
                  chargeAmount = Number(
                    (
                      ((baseamounTotal -
                        currenttableButton.data.details.discounttoApply || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;

                case 1:
                  chargeAmount = Number(
                    ((baseamounTotal * chargeAmount) / 100).toFixed(
                      ROUNDOFF_UPTO,
                    ),
                  );
                  break;

                case 2:
                  chargeAmount = Number(
                    (
                      ((baseamounTotal - finaltaxTotal || 0) * chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;

                default:
                  chargeAmount = Number(
                    (
                      ((baseamounTotal -
                        currenttableButton.data.details.discounttoApply || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;
              }
              // if (extra_details.applicable_on_amount == '1') {
              //   chargeAmount = Number(
              //     ((baseamounTotal * chargeAmount) / 100).toFixed(
              //       ROUNDOFF_UPTO,
              //     ),
              //   );
              // } else {
              //   chargeAmount = Number(
              //     (
              //       ((baseamounTotal -
              //         currenttableButton.data.details.discounttoApply || 0) *
              //         chargeAmount) /
              //       100
              //     ).toFixed(ROUNDOFF_UPTO),
              //   );
              // }
            } else {
              chargeAmount = Number(
                (
                  ((baseamounTotal -
                    currenttableButton.data.details.discounttoApply || 0) *
                    chargeAmount) /
                  100
                ).toFixed(ROUNDOFF_UPTO),
              );
            }
          }
          // check if the tax is available
          if (charge.is_tax_applicable && charge.tax_amount) {
            // let calculatedChargestax = chargeAmount * (charge.tax_amount / 100);
            // calculatedChargestax = Number(Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO));
            let calculatedChargestax = 0;
            if (charge.is_tax_included) {
              let taxPerct;
              if (charge.tax_divided) {
                calculatedChargestax = Number(
                  Number(
                    (chargeAmount / (100 + charge.tax_amount)) *
                      charge.tax_amount,
                  ).toFixed(ROUNDOFF_UPTO),
                );
                // taxPerct = roundAmountUptoDecimals(Number((chargeAmount / (100 + (charge.tax_amount/2))) * (charge.tax_amount/2)), ROUNDOFF_UPTO);
                // calculatedChargestax = taxPerct * 2;
                calculatedChargestax = Number(
                  Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                );
                // calculatedChargestax = roundAmountUptoDecimals(Number(calculatedChargestax), ROUNDOFF_UPTO);
              } else {
                calculatedChargestax =
                  (chargeAmount / (100 + charge.tax_amount)) *
                  charge.tax_amount;
                calculatedChargestax = Number(
                  Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                );
                // calculatedChargestax = roundAmountUptoDecimals(Number(calculatedChargestax), ROUNDOFF_UPTO);
              }
            } else {
              let taxPerct;
              if (charge.tax_divided) {
                // taxPerct = Number(
                //   chargeAmount * (charge.tax_amount / 2 / 100),
                // ).toFixed(ROUNDOFF_UPTO);
                taxPerct = Number(
                  ((charge.tax_amount / 2) * chargeAmount) / 100,
                ).toFixed(ROUNDOFF_UPTO);
                // taxPerct = roundAmountUptoDecimals(Number(chargeAmount * ((charge.tax_amount / 2) / 100)), ROUNDOFF_UPTO)
                calculatedChargestax = taxPerct * 2;
                calculatedChargestax = Number(
                  Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                );
                // calculatedChargestax = roundAmountUptoDecimals(Number(calculatedChargestax), ROUNDOFF_UPTO);
              } else {
                calculatedChargestax = chargeAmount * (charge.tax_amount / 100);
                calculatedChargestax = Number(
                  Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                );
                // calculatedChargestax = roundAmountUptoDecimals(Number(calculatedChargestax), ROUNDOFF_UPTO);
              }
            }

            if (charge.is_tax_included === 0) {
              // Check if tax is exlcusive
              chargeAmount += calculatedChargestax;
              chargeAmount = Number(
                Number(chargeAmount).toFixed(ROUNDOFF_UPTO),
              );
            }
            Object.assign(charge, {
              is_tax_included: charge.is_tax_included,
              calculated_tax: calculatedChargestax,
            });
            chargesTotaltax += calculatedChargestax;
          }
          chargesTotal += Number(chargeAmount);
          charge.amounttoAdd = Number(chargeAmount);
        });
        if (chargesTotal >= 0) {
          finalGrandtotal += chargesTotal;
          finaltotalCharges += chargesTotal;
          currenttableButton.data.details.order_level_total_charges =
            chargesTotal;
          currenttableButton.data.details.charges_level_total_tax = Number(
            Number(chargesTotaltax).toFixed(ROUNDOFF_UPTO),
          );
        }
      }
    }

    if (DO_BILL_ROUNDOFF) {
      try {
        finalGrandtotal = Number(finalGrandtotal.toFixed(ROUNDOFF_UPTO));

        const previousTotal = finalGrandtotal;
        // finalGrandtotal = Math.round(finalGrandtotal);
        if (window.ROUNDING_INCREMENT) {
          finalGrandtotal = roundToStep(
            finalGrandtotal,
            window.ROUNDING_INCREMENT,
            window.ROUNDOFF_UPTO,
          );
        } else if (window.ROUNDOFF_UPTO === '3') {
          finalGrandtotal = roundOffLastDigit(finalGrandtotal);
        } else {
          finalGrandtotal = Math.round(finalGrandtotal);
        }
        if (previousTotal !== finalGrandtotal) {
          Object.assign(currenttableButton.data.details.extra_details, {
            roundedAmount: Number(
              (finalGrandtotal - previousTotal).toFixed(ROUNDOFF_UPTO),
            ),
          });
        } else {
          Object.assign(currenttableButton.data.details.extra_details, {
            roundedAmount: 0,
          });
        }
      } catch (error) {}
    } else {
      Object.assign(currenttableButton.data.details.extra_details, {
        roundedAmount: 0,
      });
    }

    // add bill total to current table
    currenttableButton.data.details.order_total = finalGrandtotal;
    currenttableButton.data.details.totalCharges = finaltotalCharges;

    Object.assign(extra_details, {
      totalCharges: finaltotalCharges,
    });

    if (window.showbillDetails) {
      try {
        $(`#${currenttableButton.id}`)
          .find('#tableamountlabel')
          .text(currency + finalGrandtotal.toFixed(ROUNDOFF_UPTO));
        // if (showkotnosonTable) {
        //    $('#' + currenttableButton.id)
        //       .find('#tablekotnosLabelid')
        //       .text(`KOT : ${[...kotnoSet].join(",")}`);
        // }
      } catch (error) {}
    }
  }
  calculationDone = true;
}

async function calculateDetails(currenttableButton) {
  if (
    currenttableButton != undefined &&
    currenttableButton.data != undefined &&
    currenttableButton.data.details != undefined
  ) {
    calculationDone = false;
    const { discount } = currenttableButton.data.details;
    const { discount_type } = currenttableButton.data.details;

    const { couponDisountamt } = currenttableButton.data.details;
    const { couponDisounttype } = currenttableButton.data.details;
    let billItems = currenttableButton.data.details.items;

    currenttableButton.data.details.order_total = 0;
    currenttableButton.data.details.totalCharges = 0;
    currenttableButton.data.details.item_level_total_charges = 0;

    const kotnoSet = new Set();
    const extra_details = currenttableButton.data.details.extra_details || {};
    if (extra_details) {
      if (extra_details.exlusive_tax) extra_details.exlusive_tax = 0;
      if (extra_details.inclusive_tax) extra_details.inclusive_tax = 0;
      if (extra_details.tax) extra_details.tax = [];
    }
    let grandTotal = 0;
    let taxTotal = 0;
    let taxInclusive = false;
    let taxPercent = 0;
    let totalCharges = 0;
    let itemleveltotalCharges = 0;
    let chargesamounttoExludefromtax = 0;
    let recalculateTax = false;
    let order_subtotal = 0;
    let taxMethod;
    let tax_id;
    const discountHistory = [];
    let taxDivided = false;
    const { bill_number } = currenttableButton.data.details;
    let order_level_discount = 0;
    let order_level_coupon_discount = 0;
    const taxedProductgrps = {};
    MULTI_TAX = false;
    billItems.forEach((item) => {
      if (
        item.product_group_id &&
        window.taxGroupMapping[item.product_group_id]
      ) {
        Object.assign(item, {
          productGrptaxes: window.taxGroupMapping[item.product_group_id],
        });
      }

      if (
        item.productGrptaxes &&
        item.product_group_id &&
        !taxedProductgrps[item.product_group_id]
      ) {
        taxedProductgrps[item.product_group_id] = sortBy(
          item.productGrptaxes,
          'sort',
        );
      }

      if (item.productGrptaxes && item.productGrptaxes.length > 1) {
        MULTI_TAX = true;
      }

      // if (MULTI_TAX) {
      //   resetItemtax(item);
      // }
      item.amount = Number(item.amount);
      grandTotal += Number(item.amount);
      order_subtotal += Number(item.amount);
      item.quantity = Number(item.quantity);

      recalculateTax = true;
      Object.assign(item, { recalculatedAmount: item.amount });
      // item.item_tax_value = calculateTaxForItem(item)
      if (item.amount !== 0) {
        taxTotal +=
          (item.isitemwithOption
            ? item.new_item_tax_value
            : item.item_tax_value) * item.quantity;
      }
      if (item.item_tax_per !== 0 && taxPercent === 0) {
        taxPercent = item.item_tax_per;
        taxMethod = item.item_tax_name;
        taxDivided = item.item_is_devidable == 1;
        taxInclusive = item.item_tax_method == ITEM_TAX_TYPES.INCLUSIVE;
        tax_id = item.productGrptaxes?.[0]?.tax_id;
      }

      if (MULTI_TAX) {
        resetItemtax(item);
      }
      if (
        // item.amount &&
        item.itemlevelCharges &&
        Array.isArray(item.itemlevelCharges) &&
        item.itemlevelCharges.length > 0
      ) {
        let itemlevelchargesTotal = 0;
        // eslint-disable-next-line no-restricted-syntax
        for (const charge of item.itemlevelCharges) {
          // 1-percentage 0-fix
          let chargeTaxpercentage = 0;
          if (charge.tax_amount) {
            chargeTaxpercentage = charge.tax_amount;
          }
          recalculateTax = true;
          let chargeAmount = charge.amount;
          if (charge.per_or_fixed == 1) {
            // chargeAmount = ((item.amount * chargeAmount) / 100).toFixed(ROUNDOFF_UPTO);
            if (charge.extra_details) {
              const extra_details = safeParse(charge.extra_details);
              // extra_details = safeParse(extra_details)
              if (extra_details.applicable_on_amount == '1') {
                chargeAmount = (
                  ((item.pricebeforeDiscount
                    ? item.pricebeforeDiscount
                    : item.item_price) *
                    item.quantity *
                    chargeAmount) /
                  100
                ).toFixed(ROUNDOFF_UPTO);
              } else {
                chargeAmount = ((item.amount * chargeAmount) / 100).toFixed(
                  ROUNDOFF_UPTO,
                );
              }
            } else {
              chargeAmount = ((item.amount * chargeAmount) / 100).toFixed(
                ROUNDOFF_UPTO,
              );
            }
          } else {
            chargeAmount = Number(chargeAmount) * Number(item.quantity);
          }

          chargeAmount = Number(chargeAmount).toFixed(ROUNDOFF_UPTO);
          charge.calculated_charge = chargeAmount;
          itemlevelchargesTotal += Number(chargeAmount);
          if (charge.calculate_tax_for_item_charges == 0) {
            chargesamounttoExludefromtax += Number(chargeAmount);
          } else {
            charge.calculated_tax = (
              (chargeTaxpercentage * chargeAmount) /
              100
            ).toFixed(ROUNDOFF_UPTO);
            Object.assign(item, {
              recalculatedAmount: Number(item.amount) + Number(chargeAmount),
            });
          }
        }

        totalCharges += itemlevelchargesTotal;
        grandTotal += itemlevelchargesTotal;
        order_subtotal += itemlevelchargesTotal;
        itemleveltotalCharges += itemlevelchargesTotal;
      }

      // add kot_id to set
      if (!kotnoSet.has(item.kot_id)) kotnoSet.add(item.kot_id);
    });

    currenttableButton.data.details.order_subtotal = order_subtotal;

    let discountApplied = false;
    let coupondiscountApplied = false;
    if (order_subtotal && discount_type != undefined && discount != 0) {
      let discounttoApply = discount;

      // Check if discount type is in percent
      if (discount_type == '1') {
        // discounttoApply = ((grandTotal * discount) / 100).toFixed(ROUNDOFF_UPTO);
        discounttoApply = ((order_subtotal * discount) / 100).toFixed(
          ROUNDOFF_UPTO,
        );
      }
      grandTotal = Number(grandTotal.toFixed(window.ROUNDOFF_UPTO));
      if (grandTotal >= discounttoApply) {
        // grandTotal = grandTotal - discounttoApply;
        currenttableButton.data.details.discounttoApply = discounttoApply;
        discountApplied = true;
        const DiscountTotalbeforeDistribution = discounttoApply;

        // calculate fraction of discount based on order subtotal to calculate discount for one item
        const splittedDiscountamount = Number(
          discounttoApply / (order_subtotal - chargesamounttoExludefromtax),
        );
        billItems.map((item) => {
          const discountAmounttominus =
            Number(item.recalculatedAmount) * splittedDiscountamount;
          // discountAmountt  ominus = Number((discountAmounttominus).toFixed(ROUNDOFF_UPTO))
          // order_level_discount += Number(
          //   discountAmounttominus.toFixed(ROUNDOFF_UPTO),
          // );
          order_level_discount += Number(discountAmounttominus);
          // order_level_discount = Number(order_level_discount.toFixed(2));
          let recalculatedAmount = item.recalculatedAmount
            ? item.recalculatedAmount - discountAmounttominus
            : discountAmounttominus;
          recalculatedAmount = Number(
            recalculatedAmount.toFixed(ROUNDOFF_UPTO),
          );
          item.recalculatedAmount
            ? (item.recalculatedAmount = recalculatedAmount)
            : Object.assign(item, recalculatedAmount);
        });
        const DiscountTotalAfterDistribution = order_level_discount;
        discounttoApply = order_level_discount;
        discounttoApply = discounttoApply.toFixed(window.ROUNDOFF_UPTO);
        grandTotal -= discounttoApply;
        currenttableButton.data.details.discounttoApply = order_level_discount;

        const discountDiff =
          Number(DiscountTotalbeforeDistribution) -
          Number(DiscountTotalAfterDistribution);
        if (discountDiff) {
          billItems.map((item) => {
            const amountAfterDiscountDiff =
              Number(item.recalculatedAmount) + discountDiff;
            if (amountAfterDiscountDiff > 0) {
              item.recalculatedAmount = amountAfterDiscountDiff;
              currenttableButton.data.details.discounttoApply = Number(
                DiscountTotalbeforeDistribution,
              );
              discounttoApply = Number(DiscountTotalbeforeDistribution);
            }
          });
        }
      }
      Object.assign(extra_details, {
        discount: {
          discount_type,
          discount_rate: discount,
          amount: discounttoApply,
        },
      });
    } else {
      currenttableButton.data.details.discounttoApply = 0;
      Object.assign(extra_details, { discount: undefined });
    }

    if (couponDisountamt != undefined && couponDisountamt > 0) {
      let coupondiscounttoApply = couponDisountamt;
      // couponDisounttype 1=percentage 0=fixed
      if (Number(couponDisounttype) == 1) {
        coupondiscounttoApply = (
          (order_subtotal * coupondiscounttoApply) /
          100
        ).toFixed(ROUNDOFF_UPTO);
      }
      if (grandTotal >= coupondiscounttoApply) {
        // grandTotal = grandTotal - coupondiscounttoApply;
        // currenttableButton.data.details.coupondiscounttoApply =
        //   coupondiscounttoApply;
        coupondiscountApplied = true;

        const splittedCouponDiscountamount = Number(
          coupondiscounttoApply /
            (order_subtotal - chargesamounttoExludefromtax),
        );
        billItems.map((item) => {
          const discountAmounttominus =
            Number(item.recalculatedAmount) * splittedCouponDiscountamount;

          order_level_coupon_discount += Number(
            discountAmounttominus.toFixed(ROUNDOFF_UPTO),
          );
          let recalculatedAmount = item.recalculatedAmount
            ? item.recalculatedAmount - discountAmounttominus
            : discountAmounttominus;
          recalculatedAmount = Number(
            recalculatedAmount.toFixed(ROUNDOFF_UPTO),
          );
          item.recalculatedAmount
            ? (item.recalculatedAmount = recalculatedAmount)
            : Object.assign(item, recalculatedAmount);
        });
        // coupondiscounttoApply = order_level_coupon_discount;
        grandTotal -= coupondiscounttoApply;
        currenttableButton.data.details.coupondiscounttoApply =
          coupondiscounttoApply;
      }
    } else {
      currenttableButton.data.details.coupondiscounttoApply = 0;
    }

    // New Recalculate
    if (discountApplied || coupondiscountApplied || recalculateTax) {
      let taxtocalculateonAmount = grandTotal;
      if (chargesamounttoExludefromtax > 0) {
        taxtocalculateonAmount -= chargesamounttoExludefromtax;
      }

      taxTotal = 0;
      if (MULTI_TAX) {
        let taxapplicableAmount =
          order_subtotal -
          currenttableButton.data.details.discounttoApply -
          currenttableButton.data.details.coupondiscounttoApply -
          chargesamounttoExludefromtax;

        // - chargesamounttoExludefromtax;
        // check if taxes are inclusive and has calculations on subtotal + prev tax totals
        if (taxedProductgrps && !_.isEmpty(taxedProductgrps)) {
          Object.values(taxedProductgrps).forEach((ptaxes) => {
            if (ptaxes && ptaxes.length) {
              let divisionFactorforcurrentgrp = 0;
              let inclusiveTaxrates = 0;
              ptaxes.forEach((currentptax) => {
                // Check if tax type is inclusive
                // If the tax type is inclusive we
                let isTaxontax = false;
                if (
                  currentptax?.extra_details?.isTaxOnTax &&
                  currentptax?.extra_details?.applicableOnIds &&
                  currentptax?.extra_details?.applicableOnIds.length
                ) {
                  isTaxontax = true;
                }

                if (isTaxontax) {
                  // Skip the tax if it is tax on tax
                  // return;
                }

                if (currentptax.tax_method === 1) {
                  if (
                    currentptax.cal_method ===
                      TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX &&
                    currentptax?.extra_details?.inclusiveDivfactor
                  ) {
                    divisionFactorforcurrentgrp =
                      currentptax?.extra_details?.inclusiveDivfactor;
                  } else {
                    inclusiveTaxrates += currentptax.tax_perct * 0.01;
                  }
                }
              });
              if (divisionFactorforcurrentgrp > 0) {
                // recalculate the subtotal
                taxapplicableAmount /= divisionFactorforcurrentgrp;
              } else if (inclusiveTaxrates > 0) {
                taxapplicableAmount /= 1 + inclusiveTaxrates;
              }
            }
          });
        }

        totalwithoutTax = taxapplicableAmount;

        const previousTaxtotal = [];
        const previousTaxesmap = {};
        const taxlistTomaintain = [];
        let inclusiveTotal = 0;
        let exclusiveTotal = 0;

        // Check if there are multiple taxes present and apply
        if (taxedProductgrps && !_.isEmpty(taxedProductgrps)) {
          Object.keys(taxedProductgrps).forEach((currentpg) => {
            const taxList = taxedProductgrps[currentpg];
            if (taxList && taxList.length) {
              taxList.forEach((currentTax) => {
                if (currentTax && !currentTax.applied) {
                  const isInclusive = currentTax.tax_method === 1;

                  let applyTaxon = taxapplicableAmount;
                  if (
                    currentTax.cal_method ===
                    TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX
                  ) {
                    // Add the previous tax totals as well
                    applyTaxon =
                      taxapplicableAmount +
                      previousTaxtotal.reduce((a, b) => a + b, 0);
                  } else if (
                    currentTax.cal_method === TAX_CALCULATION_ON.PREVIOUSTAX
                  ) {
                    // Add the previous tax totals as well
                    applyTaxon = previousTaxtotal.reduce((a, b) => a + b, 0);
                  }

                  // check the tax is on tax
                  if (
                    currentTax?.extra_details?.isTaxOnTax &&
                    currentTax?.extra_details?.applicableOnIds &&
                    currentTax?.extra_details?.applicableOnIds.length &&
                    (currentTax.cal_method === TAX_CALCULATION_ON.PREVIOUSTAX ||
                      currentTax.cal_method ===
                        TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX)
                  ) {
                    let previoustotalforcurrent = 0;
                    currentTax?.extra_details?.applicableOnIds.forEach(
                      (grpid) => {
                        previoustotalforcurrent += previousTaxesmap[grpid] || 0;
                      },
                    );

                    if (previoustotalforcurrent > 0) {
                      // applyTaxon = previoustotalforcurrent;
                      if (
                        currentTax.cal_method === TAX_CALCULATION_ON.PREVIOUSTAX
                      ) {
                        applyTaxon = previoustotalforcurrent;
                      } else {
                        applyTaxon =
                          taxapplicableAmount + previoustotalforcurrent;
                      }
                    } else {
                      // If the taxes total is 0 then do not apply
                      return;
                    }
                  }

                  const currentTaxtotal = calculateTax({
                    amount: applyTaxon,
                    inclusive: false,
                    tax_percent: currentTax.tax_perct,
                    is_devidable: Boolean(currentTax.is_devidable),
                  });

                  previousTaxtotal.push(currentTaxtotal);

                  Object.assign(previousTaxesmap, {
                    [currentTax.tax_id]: currentTaxtotal,
                  });

                  const taxObj = {
                    name: currentTax.tax_name,
                    tax_percent: currentTax.tax_perct,
                    amount: currentTaxtotal,
                    tax_inclusive: isInclusive,
                    taxDivided: Boolean(currentTax.is_devidable),
                    tax_id: currentTax.tax_id,
                  };
                  if (taxObj.taxDivided) {
                    const cgst = taxObj.amount / 2;
                    Object.assign(taxObj, {
                      sgst: cgst.toFixed(window.ROUNDOFF_UPTO),
                      cgst: cgst.toFixed(window.ROUNDOFF_UPTO),
                    });
                  }
                  taxlistTomaintain.push(taxObj);

                  if (isInclusive) {
                    inclusiveTotal += currentTaxtotal;
                  } else {
                    exclusiveTotal += currentTaxtotal;
                  }
                  // previousTaxtotal=currentTax.TaxValue;
                }
              });
            }
          });
        }

        // add the tax details to the extra details object
        Object.assign(extra_details, {
          ...(inclusiveTotal && {
            inclusive_tax: inclusiveTotal,
          }),
          ...(exclusiveTotal && {
            exlusive_tax: exclusiveTotal,
          }),
          tax: taxlistTomaintain,
        });

        // Now add the exclusive tax total to order total
        if (exclusiveTotal > 0) {
          grandTotal += exclusiveTotal;
        }

        taxTotal = Number(
          Number(inclusiveTotal + exclusiveTotal).toFixed(ROUNDOFF_UPTO),
        );
        currenttableButton.data.details.taxtoApply =
          taxTotal.toFixed(ROUNDOFF_UPTO);

        billItems.map((item) => {
          calculateMultiTaxForItemLevel(item);
        });
      } else {
        billItems.map((item) => {
          taxTotal += calculateTaxForItem(item);
        });

        currenttableButton.data.details.taxtoApply =
          taxTotal.toFixed(ROUNDOFF_UPTO);
        if (!taxInclusive) {
          grandTotal += taxTotal;
          Object.assign(extra_details, {
            exlusive_tax: (extra_details.exlusive_tax || 0) + taxTotal,
            tax: [
              {
                name: taxMethod,
                tax_percent: taxPercent,
                amount: taxTotal,
                tax_inclusive: taxInclusive,
                taxDivided,
                tax_id,
              },
            ],
          });

          if (
            extra_details.tax &&
            extra_details.tax.length &&
            extra_details.tax[0].taxDivided
          ) {
            const cgst = extra_details.tax[0].amount / 2;
            Object.assign(extra_details.tax[0], {
              sgst: cgst.toFixed(window.ROUNDOFF_UPTO),
              cgst: cgst.toFixed(window.ROUNDOFF_UPTO),
            });
          }
        } else {
          Object.assign(extra_details, {
            inclusive_tax: (extra_details.inclusive_tax || 0) + taxTotal,
            tax: [
              {
                name: taxMethod,
                tax_percent: taxPercent,
                amount: taxTotal,
                tax_inclusive: taxInclusive,
                taxDivided,
                tax_id,
              },
            ],
          });
          if (
            extra_details.tax &&
            extra_details.tax.length &&
            extra_details.tax[0].taxDivided
          ) {
            const cgst = extra_details.tax[0].amount / 2;
            Object.assign(extra_details.tax[0], {
              sgst: cgst.toFixed(window.ROUNDOFF_UPTO),
              cgst: cgst.toFixed(window.ROUNDOFF_UPTO),
            });
          }
        }
      }
    }
    currenttableButton.data.details.extra_details = extra_details;
    if (window.orderCharges) {
      currenttableButton.data.details.order_level_total_charges = 0;
      currenttableButton.data.details.charges_level_total_tax = 0;
      const { charges } = currenttableButton.data.details;
      if (charges && charges.length > 0) {
        let chargesTotal = 0;
        let chargesTotaltax = 0;
        charges.forEach((charge) => {
          let chargeAmount = Number(charge.amount);
          if (charge.per_or_fixed == 1) {
            if (charge.extra_details) {
              const extra_details = safeParse(charge.extra_details);
              switch (Number(extra_details.applicable_on_amount)) {
                case 0:
                  chargeAmount = Number(
                    (
                      ((order_subtotal -
                        itemleveltotalCharges -
                        Number(
                          currenttableButton.data.details.discounttoApply,
                        ) || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;

                case 1:
                  chargeAmount = Number(
                    (
                      ((order_subtotal - itemleveltotalCharges || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;

                case 2:
                  chargeAmount = Number(
                    (
                      ((order_subtotal -
                        itemleveltotalCharges -
                        Number(taxTotal) || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;

                default:
                  chargeAmount = Number(
                    (
                      ((order_subtotal -
                        itemleveltotalCharges -
                        Number(
                          currenttableButton.data.details.discounttoApply,
                        ) || 0) *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  break;
              }
              // if (extra_details.applicable_on_amount == '1') {
              //   chargeAmount = Number(
              //     (
              //       ((order_subtotal - itemleveltotalCharges || 0) *
              //         chargeAmount) /
              //       100
              //     ).toFixed(ROUNDOFF_UPTO),
              //   );
              // } else {
              //   chargeAmount = Number(
              //     (
              //       ((order_subtotal -
              //         itemleveltotalCharges -
              //         Number(currenttableButton.data.details.discounttoApply) ||
              //         0) *
              //         chargeAmount) /
              //       100
              //     ).toFixed(ROUNDOFF_UPTO),
              //   );
              // }
            } else {
              chargeAmount = Number(
                (
                  ((order_subtotal -
                    itemleveltotalCharges -
                    Number(currenttableButton.data.details.discounttoApply) ||
                    0) *
                    chargeAmount) /
                  100
                ).toFixed(ROUNDOFF_UPTO),
              );
            }
            // chargeAmount = Number(((totalBeforeTax * chargeAmount) / 100).toFixed(ROUNDOFF_UPTO));
          }
          // check if the tax is available
          if (charge.is_tax_applicable && charge.tax_amount) {
            let calculatedChargestax = 0;
            if (charge.is_tax_included) {
              let taxPerct;
              if (charge.tax_divided) {
                calculatedChargestax = roundAmountUptoDecimals(
                  Number(
                    (chargeAmount / (100 + charge.tax_amount)) *
                      charge.tax_amount,
                  ),
                  ROUNDOFF_UPTO,
                );
                // calculatedChargestax = taxPerct * 2;
                // calculatedChargestax = Number(Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO));
                calculatedChargestax = roundAmountUptoDecimals(
                  Number(calculatedChargestax),
                  ROUNDOFF_UPTO,
                );
              } else {
                calculatedChargestax =
                  (chargeAmount / (100 + charge.tax_amount)) *
                  charge.tax_amount;
                // calculatedChargestax = Number(Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO));
                calculatedChargestax = roundAmountUptoDecimals(
                  Number(calculatedChargestax),
                  ROUNDOFF_UPTO,
                );
              }
            } else {
              let taxPerct;
              if (charge.tax_divided) {
                // taxPerct = chargeAmount * ((charge.tax_amount / 2) / 100);
                // taxPerct = Number((chargeAmount * (charge.tax_amount / 2)) / 100).toFixed(ROUNDOFF_UPTO);
                taxPerct = roundAmountUptoDecimals(
                  Number((chargeAmount * (charge.tax_amount / 2)) / 100),
                  ROUNDOFF_UPTO,
                );

                calculatedChargestax = taxPerct * 2;
                // calculatedChargestax = Number(Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO));
                calculatedChargestax = roundAmountUptoDecimals(
                  Number(calculatedChargestax),
                  ROUNDOFF_UPTO,
                );
              } else {
                calculatedChargestax = Number(
                  chargeAmount * (charge.tax_amount / 100),
                ).toFixed(ROUNDOFF_UPTO);
                // calculatedChargestax = roundAmountUptoDecimals(Number(chargeAmount * (charge.tax_amount / 100)), ROUNDOFF_UPTO);
                calculatedChargestax = Number(
                  Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                );

                // calculatedChargestax = roundAmountUptoDecimals(Number(calculatedChargestax), ROUNDOFF_UPTO);
              }
            }
            if (charge.is_tax_included === 0) {
              // Check if tax is exlcusive
              chargeAmount += Number(calculatedChargestax);
              chargeAmount = Number(
                Number(chargeAmount).toFixed(ROUNDOFF_UPTO),
              );
            }
            Object.assign(charge, {
              is_tax_included: charge.is_tax_included,
              calculated_tax: calculatedChargestax,
            });
            chargesTotaltax += calculatedChargestax;
          }
          chargesTotal += Number(chargeAmount);
          charge.amounttoAdd = Number(chargeAmount);
        });

        if (chargesTotal >= 0) {
          grandTotal += chargesTotal;
          totalCharges += chargesTotal;
          currenttableButton.data.details.order_level_total_charges =
            chargesTotal;
          currenttableButton.data.details.charges_level_total_tax = Number(
            Number(chargesTotaltax).toFixed(ROUNDOFF_UPTO),
          );
        }
      }
    }

    if (
      bill_number != 0 &&
      (currenttableButton.data.details.discounttoApply != 0 ||
        currenttableButton.data.details.coupondiscounttoApply != 0)
    ) {
      discountHistory.push({
        product_group_id: 0,
        order_id: bill_number,
        discounted_amt: currenttableButton.data.details.discounttoApply,
        discount_type,
        discount_rate: discount,
        coupon_code_type: couponDisounttype,
        coupon_code_rate: couponDisountamt,
        coupon_code_amt: currenttableButton.data.details.coupondiscounttoApply,
        coupon_code_name: currenttableButton.data.details.coupon,
      });
      if (discountHistory.length > 0) {
        currenttableButton.data.details.discountHistory = discountHistory;
      }
    }

    if (DO_BILL_ROUNDOFF) {
      try {
        // grandTotal = Number(grandTotal.toFixed(ROUNDOFF_UPTO));

        const previousTotal = grandTotal;
        // grandTotal = Math.round(grandTotal);
        if (window.ROUNDING_INCREMENT) {
          grandTotal = roundToStep(
            grandTotal,
            window.ROUNDING_INCREMENT,
            window.ROUNDOFF_UPTO,
          );
        } else if (window.ROUNDOFF_UPTO === '3') {
          grandTotal = roundOffLastDigit(grandTotal);
        } else {
          grandTotal = Math.round(grandTotal);
        }
        if (previousTotal !== grandTotal) {
          Object.assign(currenttableButton.data.details.extra_details, {
            roundedAmount: Number(
              (grandTotal - previousTotal).toFixed(ROUNDOFF_UPTO),
            ),
          });
        } else {
          Object.assign(currenttableButton.data.details.extra_details, {
            roundedAmount: 0,
          });
        }
      } catch (error) {}
    } else {
      Object.assign(currenttableButton.data.details.extra_details, {
        roundedAmount: 0,
      });
    }

    // add bill total to current table
    currenttableButton.data.details.order_total = grandTotal;
    currenttableButton.data.details.totalCharges = totalCharges;
    currenttableButton.data.details.item_level_total_charges =
      itemleveltotalCharges;

    Object.assign(extra_details, {
      totalCharges,
    });

    if (window.showbillDetails) {
      try {
        $(`#${currenttableButton.id}`)
          .find('#tableamountlabel')
          .text(currency + grandTotal.toFixed(ROUNDOFF_UPTO));
        // if (showkotnosonTable) {
        //    $('#' + currenttableButton.id)
        //       .find('#tablekotnosLabelid')
        //       .text(`KOT : ${[...kotnoSet].join(",")}`);
        // }
      } catch (error) {}
    }
  }
  calculationDone = true;
}

function resetCurrentdiscount(tableInstance) {
  if (tableInstance) {
    tableInstance.data.details.discount = 0;
    tableInstance.data.details.discount_type = '0';
    tableInstance.data.details.discounted_product_groups = undefined;
    tableInstance.data.details.discount_title = '';
  }
}

function calculateTaxForItem(item) {
  if (Number(item.item_tax_method)) {
    taxTotal = 0;
    taxTotal = Number(
      (
        taxTotal +
        (item.recalculatedAmount / (100 + item.item_tax_per)) *
          item.item_tax_per
      ).toFixed(ROUNDOFF_UPTO),
    );
    const singleQtyTax = Number((taxTotal / item.quantity).toFixed(3));
    Object.assign(item, {
      item_tax_value: singleQtyTax,
      total: item.recalculatedAmount,
    });
    return taxTotal;
  }
  taxTotal = 0;
  let taxPerct;
  if (item.item_is_devidable) {
    taxPerct = Number(
      ((item.item_tax_per / 2) * item.recalculatedAmount) / 100,
    );
    taxPerct = roundAmountUptoDecimals(taxPerct, ROUNDOFF_UPTO);
    taxTotal = Number((taxTotal + taxPerct * 2).toFixed(ROUNDOFF_UPTO));
  } else {
    taxTotal = Number(
      (taxTotal + (item.recalculatedAmount * item.item_tax_per) / 100).toFixed(
        ROUNDOFF_UPTO,
      ),
    );
  }
  const singleQtyTax = Number((taxTotal / item.quantity).toFixed(3));
  Object.assign(item, {
    item_tax_value: singleQtyTax,
    total: item.recalculatedAmount,
  });
  return taxTotal;
}
function calculateMultiTaxForItemLevel(item) {
  const extra_details = item.extra_details || {};
  const taxedProductgrps = {};
  if (
    item.productGrptaxes &&
    item.product_group_id &&
    !taxedProductgrps[item.product_group_id]
  ) {
    taxedProductgrps[item.product_group_id] = sortBy(
      item.productGrptaxes,
      'sort',
    );
  }
  if (taxedProductgrps && !_.isEmpty(taxedProductgrps)) {
    const taxes = [];
    let inclusiveTaxrates = 0;
    let divisionFactorforcurrentgrp = 0;
    let taxapplicableAmount = item.recalculatedAmount;
    let applyTaxon;
    Object.values(taxedProductgrps)[0]?.forEach((currentptax) => {
      if (currentptax.tax_method === 1) {
        if (
          currentptax.cal_method === 2 &&
          currentptax?.extra_details?.inclusiveDivfactor
        ) {
          divisionFactorforcurrentgrp =
            currentptax?.extra_details?.inclusiveDivfactor;
        } else {
          inclusiveTaxrates += currentptax.tax_perct * 0.01;
        }
      }
    });
    if (divisionFactorforcurrentgrp > 0) {
      // recalculate the subtotal
      taxapplicableAmount /= divisionFactorforcurrentgrp;
    } else if (inclusiveTaxrates > 0) {
      taxapplicableAmount /= 1 + inclusiveTaxrates;
    }
    const previousTaxtotal = [];
    const previousTaxesmap = {};
    Object.values(taxedProductgrps)[0]?.forEach((currentTax) => {
      if (currentTax && !currentTax.applied) {
        const isInclusive = currentTax.tax_method === 1;

        applyTaxon = taxapplicableAmount;
        if (
          currentTax.cal_method === TAX_CALCULATION_ON.SUBTOTAL_AND_PREVIOUSTAX
        ) {
          // Add the previous tax totals as well
          applyTaxon =
            taxapplicableAmount + previousTaxtotal.reduce((a, b) => a + b, 0);
        } else if (currentTax.cal_method === TAX_CALCULATION_ON.PREVIOUSTAX) {
          // Add the previous tax totals as well
          applyTaxon = previousTaxtotal.reduce((a, b) => a + b, 0);
        }

        // check the tax is on tax
        if (
          currentTax?.extra_details?.isTaxOnTax &&
          currentTax?.extra_details?.applicableOnIds &&
          currentTax?.extra_details?.applicableOnIds.length &&
          currentTax.cal_method === TAX_CALCULATION_ON.PREVIOUSTAX
        ) {
          let previoustotalforcurrent = 0;
          currentTax?.extra_details?.applicableOnIds.forEach((grpid) => {
            previoustotalforcurrent += previousTaxesmap[grpid] || 0;
          });

          if (previoustotalforcurrent > 0) {
            applyTaxon = previoustotalforcurrent;
          } else {
            // If the taxes total is 0 then do not apply
            return;
          }
        }

        const currentTaxtotal = Number(
          ((applyTaxon * currentTax.tax_perct) / 100).toFixed(ROUNDOFF_UPTO),
        );

        previousTaxtotal.push(currentTaxtotal);

        Object.assign(previousTaxesmap, {
          [currentTax.tax_id]: currentTaxtotal,
        });

        const taxDetails = {
          taxAmount: roundAmountUptoDecimals(currentTaxtotal, ROUNDOFF_UPTO),
          tax_name: currentTax.tax_name,
          tax_perct: currentTax.tax_perct,
          tax_method: currentTax.tax_method,
        };
        taxes.push(taxDetails);
      }
    });

    Object.assign(extra_details, {
      tax: taxes,
      total_without_tax: Number(applyTaxon.toFixed(ROUNDOFF_UPTO)),
    });
    Object.assign(item, { extra_details });
  }
}

function roundAmountUptoDecimals(numb, roundUpto) {
  roundUpto = Number(roundUpto);
  numb = Number(numb);
  const value = Intl.NumberFormat('en-US', {
    minimumFractionDigits: roundUpto,
    maximumFractionDigits: roundUpto,
    useGrouping: false,
  }).format(numb);
  return Number(value);
}

ipcRenderer.on(SEND_BACKGROUND_SETTLEMENT_REQUEST, async (event, content) => {
  ipcRenderer.send(FETCH_BILL_DATA_FOR_CSK, JSON.stringify(content));
});

window.remotefetchBillDataForCskOrderTotal = (args) => {
  fetchBillDataForCskOrderTotal(args);
};

async function fetchBillDataForCskOrderTotal({ table_id }) {
  try {
    const responseData = await makeFetchTableDataRequest({
      table_id,
    });
    let tableButton;
    if (responseData.table_id) {
      const currenttable = $(`#table_${responseData.table_id}`);
      if (currenttable[0]) {
        tableButton = currenttable[0];
      }
    }

    let order_total = 0;
    if (tableButton && responseData.status != 404) {
      const result = await savebilldata(responseData, tableButton);
      if (result == 'success') {
        order_total = tableButton?.data?.details?.order_total;
        if (order_total) {
          window.ipcRenderer.send(SEND_ORDER_TOTAL, {
            order_total,
            table_id: responseData.table_id,
          });
          // set order state
          if (responseData.kot_status) {
            const { kot_status } = responseData;
            const allEqual = (arr) => arr.every((v) => v == arr[0]);
            const isAllEqual = allEqual(kot_status);
            if (isAllEqual) {
              const orderState = [
                'Placed',
                'Bumped',
                'Preparing',
                'Ready',
                'Served',
              ];
              const tableId = `table_${responseData.table_id}`;
              const orderStateToShow = kot_status[0] - 1;
              if (
                tableButton.data.details.order_state &&
                tableButton.data.details.order_state !== 'Placed'
              ) {
                $(`#${tableButton.id}`)
                  .find('#tableorderstatusLabel')
                  .html(tableButton.data.details.order_state);
              } else {
                $(`#${tableId}`)
                  .find('#tableorderstatusLabel')
                  .html(orderState[orderStateToShow]);
              }
            }
          }
          $(`#${tableButton.id}`)
            .find('#tableamountlabel')
            .text(currency + order_total.toFixed(ROUNDOFF_UPTO));
        }
        if (displaytimeonTables) {
          addtabletowatchList(tableButton.id, responseData?.kotcreatedAt);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}

window.ipcRenderer.on(GET_ORDER_TOTAL, (event, content) => {
  fetchBillDataForCskOrderTotal({ table_id: content });
});

async function createCurrentTableForSettleBill(responseData) {
  const btn = document.createElement('button');
  btn.content = responseData.table_name;
  btn.id = responseData.table_id;
  btn.data = {
    order_type_flag: responseData.tableState.order_type_flag,
    table_name: responseData.table_name,
  };
  btn.data.details = {
    bill_number: 0,
    items: [],
    order_id: 0,
    paymentAdded: false,
    payment_mode: defaultPaymentoption,
    discount: 0,
    discount_type: '', // 2=Fixed 1=Per
    discounttoApply: 0,
    taxtoApply: 0,
    color: null,
    // kotchargesAdded: false,
    charges: [],
    order_subtotal: 0,
    order_level_total_charges: 0,
    charges_level_total_tax: 0,
  };

  settlebilltableButton = btn;
}

// function InitializeSaveAndPrintFromCSk() {
//   settlebilltableButton = undefined;
//   createCurrentTableForSettleBill();
// }

// InitializeSaveAndPrintFromCSk();

module.exports = {
  savebilldata,
  initialiseCSKPrinthandler,
  fetchBillDataForCskOrderTotal,
};
