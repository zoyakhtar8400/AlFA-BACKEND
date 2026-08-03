/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
/* eslint-disable func-names */
const CryptoJS = require('crypto-js');
const {
  addOrderlevelinstructions,
  showPopupMessage,
  sleep,
  formatAMPM,
} = require('../util/MiscUtil');
const {
  BillingTypes,
  OFFLINE_ORDER_TYPES,
  OrderState,
} = require('../util/DBUtil');
const { OTP_TYPES } = require('../util/Constants');
const {
  PRINTERS,
  SHOW_EXPENSE_REPORT,
  AUTO_SYNC,
  SHOW_WAITER_SUMMARY_REPORT,
  SHOW_DELIVERYBOY_SUMMARY_REPORT,
  MAKE_PAYMENT_REFERENCE_NUMBER_MANDATORY,
  SEND_BASE64_REPORT_FROM_RECEIPT_SECTION,
  SHOW_CANCELITEMS_IN_REPORT,
  SHOW_DISCOUNT_SUMMARY_REPORT,
  OPEN_CASH_DRAWER_ON_PRINT_FROM_RECEIPT_SECTION,
  OPEN_CASH_DRAWER_FOR_ALL,
  MAKE_DELIVERY_BOY_COMPULSORY,
  FETCH_REPORT_AS_PER_CLOSE_DAY,
  SEND_CUSTOMERDETAILSTODBOY_CHECK,
  SHOW_DEU_PAYEMENT_SUMMARY_REPORT,
  SHOW_DUE_PAYMENTS_RECEIVABLE_SUMMARY,
  SHOW_WALLET_SUMMARY_REPORT,
  SHOW_KDWISE_SUMMARY_REPORT,
  PRINT_REPORT_WHILE_SENDING_ON_MAIL_FROM_RECEIPT_SECTION,
} = require('../util/SettingIDs');
const { initializei18nforReceiptwindowui } = require('./i18nController');
const { initializeReceiptpermissions } = require('./PasscodeController');
const { ORDERSTATEFOR_REDUCEINVENTORY } = require('../util/OrderStates');
const { PRINTERS_IPC, REFRESH_TABLES_EVENT } = require('../util/IPC_Messages');
const { PRINTER_SIZES_REFID } = require('../util/PrintersUtil');
const {
  PRINTER_58_CONFIG,
  PRINTER_80_CONFIG,
  COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY,
  CUSTOMIZE_ORDER_NUMBER_NAME,
  MAKE_CANCEL_BILL_REASON_MANDATORY,
  SHOW_SOLDITEMS_IN_REPORT,
  SHOW_CATEGORYWISE_ITEM_REPORT,
} = require('../util/SettingIDs');
const { setDateForgettingMidnightReport } = require('../util/MiscUtil');
const { askforOTP, showLoader } = require('./CommonUtils');
const { initAccesslevelsforreceipts } = require('./AccesslevelManager');
const {
  DINEIN_BILLING_FLAG,
  TAKEAWAY_BILLING_FLAG,
  HOMED_BILLING_FLAG,
  ONLINE_PLATFORMS,
  INVENTORY_STATUS,
  DINEIN_FLAG_ID,
  PRINTER_ACTION_TYPES,
  VOID_REASONS,
  QUICKBILL_BILLING_FLAG,
} = require('../util/Constants');
const { createXmlForOrder } = require('../util/createXMLForTally');
const {
  autoReduceInventoryRequest,
} = require('../renderer/helper/Inventory.helper');
const {
  makegetBilldetailsrequest,
  makegetBillsrequest,
  makegetPrintcountrequest,
  makeupdatePrintcountrequest,
  makeReduceinventoryrequest,
  makeReverseinventoryrequest,
  makeUpdatebillandpaymentrequest,
  makeGetduepaytransactionsrequest,
  makeResyncbillrequest,
} = require('../renderer/helper/Receipt.helper');
const {
  sendSyncrequest,
  openCashDrawerRequest,
} = require('../renderer/helper/Common.helper');
const e = require('cors');
const { getPrinterbyordertype } = require('./Printer/Helper');
const { ORDER_SOURCE_FOR_PRINT } = require('../constant');
const { removetablefromwathersList } = require('./Tableobserver');
const {
  sendsettledBillPrintRequestToMaster,
  sendTableRefreshevent,
} = require('./ClientrequestHandler');
const { getFromAndToDateForReportsAsPerCloseDay } = require('./RendererUtils');
const { aggregatePayments } = require('./UIutils/MiscUtils');
const { sendRewardhistory } = require('./OrderMisc');
const { safeParse } = require('../util/RendererUtils');
const { roundToStep } = require('./calculations');

window.receiptsWindowloaded = true;
window.refreshReceipt = false;
const useJQuerytable = true;
let customOrderNumberName = '';
let fromDate;
let toDate;
let selectedCharges = [];
let discountHistory = [];
let countMidnightSale = true;
let selectedBillpreorderinfo;
const stringConstructor = 'test'.constructor;
let makereasoncompulsory = false;
let showCategoryData = false;
let showSolditems = false;
let showCancelleditems = false;
let showExpenseData = true;
let autoSyncmode = false;
let showWaiterData = false;
let showDiscountData = false;
let showDeliveryBoyData = false;
let showDuePaymentData = false;
let showWalletData = false;
let showKDWiseItemsData = false;
let showDuePaymentReceivableData = false;
let makePaymentrefmandatory = false;
let sendBase64String = false;
let printReportWhileSendingOnMail = false;
let openCashDrawerOnPrintBillFromReceiptSection = false;
let openCashDrawerOnForAll = false;
let deliveryBoyMandatory = false;
let isSendCustomerDetailsToDBoyEnabled = false;
let fetchReportAsPerCloseDay = true;

function onSelectrowchange() {
  const selectedBills = $('#receiptTable')
    .DataTable()
    .rows('.selectedbillRow')
    .data();
  // selectedBills = $("#receiptTable").DataTable().rows({ selected: true }).data();
  if (selectedBills.length === 0) {
    $('#receiptitemsTable').find('tr:not(:first)').remove();
  }
  if (selectedBills && selectedBills.length) {
    if (selectedBills.length > 1) {
      $(
        '#previewreceiptbillButton,#receiptprintButton,#generateIRNButtonId, #modifybillButton',
      ).hide();
    } else {
      $(
        '#previewreceiptbillButton,#receiptprintButton,#generateIRNButtonId',
      ).show();
      if (window.editBillFromReciptSectionAllowed) {
        $('#modifybillButton').show();
      }
      initAccesslevelsforreceipts();
    }

    let selectedbillstotal = 0;
    let duepaytotal = 0;
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < selectedBills.length; index++) {
      const order = selectedBills[index];
      selectedbillstotal += Number(order.order_total);
      // eslint-disable-next-line no-unused-vars
      duepaytotal += Number(order.due_payment);
    }

    // selectedbillstotal = selectedbillstotal - duepaytotal;
    if (window.showSelectedBillAmount) {
      $($('#receiptTable').DataTable().column(3).footer()).html(
        `${$.i18n.t('controller:receiptsController.selectedBills')} (${
          selectedBills.length
        }) : ${Number(selectedbillstotal).toFixed(window.ROUNDOFF_UPTO)}`,
      );
    }
  } else {
    $($('#receiptTable').DataTable().column(3).footer()).html(``);
    $('#previewreceiptbillButton,#receiptprintButton').show();
    initAccesslevelsforreceipts();
  }
}

/**
 * Clears the selections
 */
function clearSelection() {
  $('#receiptTable tr').removeClass('selectedbillRow');
  selectedCharges = [];
  discountHistory = [];
  const receiptsTable = $('#receiptTable').DataTable();
  receiptsTable.rows().deselect();
  onSelectrowchange();
}

window.clearSelectionFromRemote = () => {
  // clearSelection();
  $('#receipt_fetchbillsButton').click();
};

// auto reduce inventory
async function initAutoReduceInventory() {
  await autoReduceInventoryRequest();
}

/**
 * Find the selected bill in table
 */
function getSelectedBill() {
  const billDetails = $('#receiptTable')
    .DataTable()
    .rows('.selectedbillRow')
    .data();
  const { length } = $('#receiptTable')
    .DataTable()
    .rows('.selectedbillRow')
    .data();
  const selectedRow = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < length; i++) {
    selectedRow.push(billDetails[i]);
  }
  return selectedRow;
}

function checkIfonlineorder(previewDetails) {
  const selectedRow = $('#receiptTable tr.selectedbillRow');
  if (selectedRow && selectedRow.length > 0) {
    let order_details = selectedRow.attr('order_details');
    if (order_details) {
      try {
        order_details = JSON.parse(order_details);
        previewDetails.isOnlinebill = true;
        previewDetails.discounttoApply = order_details.discounttoApply || 0;
        previewDetails.onlinechargesTotal =
          order_details.onlinechargesTotal || 0;
        previewDetails.onlinetaxesTotal = order_details.onlinetaxesTotal || 0;
        previewDetails.total_external_discount =
          order_details.total_external_discount || 0;
        previewDetails.onlinediscounttoApply =
          order_details.discounttoApply || 0;
      } catch (error) {
        console.log(error);
      }
    }
  }
}

/**
 * Set the margins to the preview if there are any
 */
async function setPageconfigifany() {
  let currentPrinter = 2;

  if (
    window.printersList !== undefined &&
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
        if (rawmargins && rawmargins.length === 2) {
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

/**
 * Receipt Preview
 * @param {*} showPopup
 */
async function showReceiptpreview(showPopup) {
  const receiptsTable = $('#receiptTable').DataTable();
  const billDetails = receiptsTable.row('.selectedbillRow').data();
  // console.log('billDetails::', billDetails);
  if (billDetails === undefined) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:receiptsController.selectBill'),
      0,
    );
    return undefined;
  }

  let extraDetails = billDetails.extra_details;
  if (extraDetails && extraDetails.constructor === stringConstructor) {
    extraDetails = JSON.parse(extraDetails);
  }

  if (
    window.ISBILLINGBYSECTION_ON &&
    !OFFLINE_ORDER_TYPES.includes(billDetails.billType) &&
    !extraDetails.customQuickbilltype
  ) {
    window.notifyUser.showMessage(
      'error',
      'In section wise billing online order bill preview is not allowed',
    );
    return undefined;
  }
  const table = $('#receiptitemsTable').DataTable();
  if (table.rows().count() > 0 && billDetails) {
    const data = table.rows().data();

    const items = [];
    let istax_dividable = 0;
    const d = new Date(parseInt(billDetails.created_time, 10));
    const customDate = window.moment(d).format('DD MMMM YYYY hh:mm A');
    if (
      data[0].bill_id !== billDetails.id ||
      data[0].orderMasterId !== billDetails.order_id
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:receiptsController.pleaseSelectBillAgain'),
      );
      return undefined;
    }
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < data.length; index++) {
      const element = data[index];
      element.item_price = element.price;
      element.amount = element.total;
      element.item_tax_value = element.tax_value ? element.tax_value : 0;
      element.item_is_devidable = element.is_devidable;
      element.item_tax_method = element.tax_method;
      element.item_tax_per = element.tax_per;
      element.item_tax_name = element.tax_name;
      element.addons = element.options;
      istax_dividable = element.is_devidable === 1;
      items.push(element);
    }

    const customerName = billDetails.phone;
    let showCustomerinfo = false;
    let customer;
    if (customerName) {
      try {
        customer = window.getCustomerforremote(false, customerName);
        if (customer) {
          showCustomerinfo = true;
        }
      } catch (error) {
        console.error(error);
      }
    }
    let discount = 0;
    if (billDetails.discount) {
      try {
        discount = Number(billDetails.discount);
      } catch (error) {
        discount = 0;
      }
    }

    let kot_numbers = [];
    let kotcreatedAt;
    console.log('billDetails:', billDetails);
    if (billDetails && billDetails.extra_details) {
      kot_numbers = billDetails.extra_details.kot_numbers;
    }
    if (billDetails && billDetails.extra_details) {
      kotcreatedAt = billDetails.extra_details.kotcreatedAt;
    }
    const previewDetails = {
      tableName: billDetails.table_name,
      // discount,
      // discount_type: '0',
      tax_name: window.currentTaxname,
      istax_dividable,
      items,
      // discounttoApply: discount,
      isOldbill: true,
      // showCustomerinfo: false,
      charges: selectedCharges,
      payment_mode: billDetails.payment,
      order_id: billDetails.bill_number,
      bill_number:
        billDetails.extra_details && billDetails.extra_details.customOrderId
          ? billDetails.extra_details.customOrderId
          : billDetails.order_id,
      showCustomerinfo,
      customer,
      customDate,
      couponDisountamt: billDetails.couponDisount,
      couponDisounttype: billDetails.couponDisounttype,
      coupon: billDetails.coupon,
      cust_paid_amount: billDetails.cust_paid_amount,
      discounted_product_groups: billDetails.discounted_product_groups,
      preorderInfo: selectedBillpreorderinfo || undefined,
      custom_bill_number: billDetails.custom_bill_number,
      is_pre_order: billDetails.is_pre_order,
      payment_modes: billDetails.tmpos_order_payment,
      waiter: billDetails.waiter || undefined,
      bill_status: billDetails.order_state || '',
      irnSignedQr:
        billDetails.mpos_irn_history &&
        billDetails.mpos_irn_history.irn_response.respObj.signedQRCode,
      irnNumber:
        billDetails.mpos_irn_history && billDetails.mpos_irn_history.irn_no,
      billType: billDetails.billType,
      kot_numbers,
      print_status: billDetails.print_status,
      instructions: billDetails.instructions,
      persons: billDetails.persons,
      createdBy: billDetails.createdBy,
      customOrderNumberName,
      extra_details: billDetails.extra_details,
      due_payment: billDetails.due_payment,
      discount_title: billDetails.discount_title || '',
      discount_rate: billDetails?.extra_details?.discount?.discount_rate,
      discount_per_or_fixed:
        billDetails?.extra_details?.discount?.discount_type,
      deliveryboyName: billDetails.delivery_boy_name,
      kotcreatedAt,
      order_note: billDetails.order_note || null,
      zatca_status: billDetails.zatca_status || 0,
      mpos_zatca_status: billDetails.mpos_zatca_status,
    };
    if (billDetails.billType !== 8) {
      Object.assign(previewDetails, { discounttoApply: discount });
    }

    if (
      billDetails &&
      billDetails.extra_details &&
      billDetails.extra_details.rewardDiscount
    ) {
      Object.assign(previewDetails, {
        isloyaltyrewardDiscount: true,
        rewardTitle: billDetails.extra_details.rewardDiscount.title,
        pointsRedeemed:
          billDetails.extra_details.rewardDiscount.points_redeemed,
      });
    }

    let printCount = await makegetPrintcountrequest({
      order_id: billDetails.order_id,
    });

    if (!showPopup) printCount += 1;
    Object.assign(previewDetails, {
      printCount,
    });

    if (discountHistory.length > 0) {
      const discountDetails = discountHistory[0];
      if (discountDetails) {
        // Check if discount is provided
        if (discountDetails.discounted_amt > 0) {
          previewDetails.discount = discountDetails.discount_rate;
          previewDetails.discount_type = String(discountDetails.discount_type);
        }

        // CHeck for coupon discount
        if (discountDetails.coupon_code_amt > 0) {
          previewDetails.couponDisountamt = discountDetails.coupon_code_rate;
          previewDetails.couponDisounttype = discountDetails.coupon_code_type;
          previewDetails.coupon = discountDetails.coupon_code_name;
        }
      }
    }
    const { issectionwisebilling } = billDetails;

    if (
      window.ISBILLINGBYSECTION_ON &&
      !issectionwisebilling &&
      billDetails.billType !== 8
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:receiptsController.setionWiseBillIsOnThisIsANormalBill',
        ),
        0,
      );
      return undefined;
    }
    if (!window.ISBILLINGBYSECTION_ON && issectionwisebilling) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:receiptsController.setionWiseBillIsOffThisIsASectionWiseBill',
        ),
      );
      return undefined;
    }
    if (!window.ISBILLINGBYSECTION_ON) {
      if (
        previewDetails.discounttoApply > 0 &&
        billDetails.coupon &&
        billDetails.couponDisounttotal > 0
      ) {
        // previewDetails.discounttoApply -= billDetails.couponDisounttotal;
      }
      if (discount > 0) {
        previewDetails.discount_type = '0';
        // previewDetails.discount_type = previewDetails.discount_per_or_fixed;
        previewDetails.discount = previewDetails.discounttoApply;
      }
    } else if (
      discountHistory.length === 0 &&
      previewDetails.discounttoApply > 0
    ) {
      if (
        previewDetails.discounttoApply > 0 &&
        billDetails.coupon &&
        billDetails.couponDisounttotal > 0
      ) {
        previewDetails.discounttoApply -= billDetails.couponDisounttotal;
      }
      previewDetails.discount_type = '0';
      // previewDetails.discount_type = previewDetails.discount_per_or_fixed;
      previewDetails.discount = previewDetails.discounttoApply;
    }

    const pageConfig = await setPageconfigifany();

    if (pageConfig && pageConfig.margins) {
      previewDetails.pageConfig = pageConfig;
      window.pageconfigProvided = true;
    } else {
      window.pageconfigProvided = false;
    }

    checkIfonlineorder(previewDetails);

    if (window.customBilltitlesettings) {
      let orderType;
      let customKotTitle;
      switch (billDetails.billType) {
        case QUICKBILL_BILLING_FLAG:
          orderType = window.customBilltitlesettings?.quick;
          customKotTitle = window.customKOTtitlesettings?.quick;
          break;
        case DINEIN_BILLING_FLAG:
          orderType = window.customBilltitlesettings?.dinein;
          customKotTitle = window.customKOTtitlesettings?.dinein;
          break;
        case TAKEAWAY_BILLING_FLAG:
          orderType = window.customBilltitlesettings?.takeaway;
          customKotTitle = window.customKOTtitlesettings?.takeaway;
          break;
        case HOMED_BILLING_FLAG:
          orderType = window.customBilltitlesettings?.delivery;
          customKotTitle = window.customKOTtitlesettings?.delivery;
          break;
        default:
          break;
      }
      if (
        billDetails &&
        billDetails.extra_details &&
        billDetails.extra_details.customQuickbilltype
      ) {
        orderType = window.customBilltitlesettings?.quick;
        customKotTitle = window.customKOTtitlesettings?.quick;
      }
      if (orderType) {
        Object.assign(previewDetails, {
          custombilltitle: orderType,
          customKotTitle,
        });
      }
    }

    console.log('kot_numbers:', kot_numbers);

    if (extraDetails && extraDetails.customQuickbilltype) {
      Object.assign(previewDetails, {
        isOnlinebill: false,
      });
    }
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

    // if (window.previewscriptLoaded) {
    //   $('#previewBodyid').data('data', previewDetails);
    //   await window.showPreview();
    // } else {
    //   $('#previewBodyid').data('data', previewDetails);
    // }

    if (showPopup) {
      $('#previewModal').modal('show');
    }
    let getPrinters = await getPrinterbyordertype({
      action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
      app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
      billing_type: String(billDetails.billType),
    });

    let currenttabId;
    switch (billDetails.billType) {
      case 1:
        currenttabId = 'dineintabId';
        break;
      case 2:
        currenttabId = 'takeawaytabID';
        break;
      case 3:
        currenttabId = 'deliverytabID';
        break;
      default:
        currenttabId = 'quickbilltabID';
        break;
    }
    if (showPopup) {
      console.log(
        `bill preview opened from receipt section for order_id=${previewDetails.bill_number}, bill_number=${previewDetails.order_id}, billing_type=${previewDetails.billing_type}, order_type_flag=${previewDetails.order_type_flag}`,
      );
    }
    if (!showPopup && getPrinters.length === 0 && !window.__IS_MASTER_POS__) {
      sendsettledBillPrintRequestToMaster({
        order_id: billDetails.order_id,
        currenttabId,
        table_id: billDetails.table_id,
        table_name: billDetails.table_name,
        isOldbill: true,
      });
      return;
    }

    // on check preview print should not come
    if (showPopup) {
      getPrinters = [];
    }
    if (previewDetails) {
      console.log(
        `bill print from receipt section for order_id=${previewDetails.bill_number}, bill_number=${previewDetails.order_id}, billing_type=${previewDetails.billing_type}, order_type_flag=${previewDetails.order_type_flag}`,
      );
    }
    await window.printBillfromqueue({
      previewDetails,
      is_Draft_bill: false,
      billing_type: billDetails.billType,
      printers: getPrinters,
      showPopup,
    });
    return 'success';
  }
  window.notifyUser.showMessage(
    'error',
    $.i18n.t('controller:receiptsController.selectBill'),
    0,
  );

  return 'failure';
}

function setPrinterfortablewise(printerInfo, currenttableButton, billing_type) {
  if (billing_type && billing_type === 'Dine-In') {
    if (
      currenttableButton &&
      currenttableButton.data.order_type_flag === DINEIN_FLAG_ID
    ) {
      const tablePrinter = window._.find(
        window.printersList,
        {
          title: currenttableButton.content,
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
  }
}

/**
 * Prints the selected receipt
 */
async function printReceipt() {
  const result = await showReceiptpreview(false);

  const receiptsTable = $('#receiptTable').DataTable();
  const billDetail = receiptsTable.row('.selectedbillRow').data();
  if (billDetail === undefined) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:receiptsController.selectBill'),
      0,
    );
    return;
  }

  if (!result) {
    return;
  }

  const billDetails = $('#receiptTable')
    .DataTable()
    .row('.selectedbillRow')
    .data();

  if (billDetails) {
    makeupdatePrintcountrequest({
      order_id: billDetails.order_id,
    });

    // send sync Request
    // if auto sync is on || live tracking is enabled || loyalty is enabled
    if (
      autoSyncmode ||
      window.storeDetails.live_tracking_enabled ||
      window.storeDetails.loyalty_enabled
    ) {
      setTimeout(() => {
        sendSyncrequest({ silentSync: true, logout: false });
      }, 1000);
    }
  }
}

async function exportTallyReport() {
  const receiptsTable = $('#receiptTable').DataTable();
  const billDetails = receiptsTable.row('.selectedbillRow').data();
  const table = $('#receiptitemsTable').DataTable();
  const data = table.rows().data();
  const items = [];
  if (data) {
    // eslint-disable-next-line array-callback-return
    data.map((item) => {
      items.push(item);
    });
  }

  // billDetails.quantity = billDetails.tmpos_order_child.length;
  billDetails.orderchildList = items;
  billDetails.orderPaymentList = billDetails.tmpos_order_payment;
  billDetails.all_charge_order_list = billDetails.tmpos_order_charges;

  const xmlContent = await createXmlForOrder(billDetails);
  if (xmlContent) {
    // Export
  }
}

function generateIRN() {
  const receiptsTable = $('#receiptTable').DataTable();
  const billDetails = receiptsTable.row('.selectedbillRow').data();
  const table = $('#receiptitemsTable').DataTable();
  const data = table.rows().data();
  const items = [];
  if (data) {
    // eslint-disable-next-line array-callback-return
    data.map((item) => {
      items.push(item);
    });
  }

  if (billDetails === undefined) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:receiptsController.selectBill'),
      0,
    );
    return;
  }

  Object.assign(billDetails, { items });

  if (window.irnscriptLoaded) {
    $('#IRNmodalBodyid').attr('data', JSON.stringify(billDetails));
    $('#IRNmodal').modal('show');
  } else {
    $('#IRNgeneratemodalBodyid').load('generateIRN.html', async () => {
      $('#IRNmodalBodyid').attr('data', JSON.stringify(billDetails));
      $('#IRNmodal').modal('show');
    });
  }
}

function addSelectedfilterindicator(element) {
  $(`#reciptsparentdivID .searchreceiptDivclass input.get-filter`).removeClass(
    'selected-filter',
  );
  $(element).addClass('selected-filter');
}

function reduceMultipleinventory() {
  const selectedBills = $('#receiptTable').DataTable().rows('.selected').data();
  const ordersList = [];
  // eslint-disable-next-line no-plusplus
  for (let index = 0; index < selectedBills.length; index++) {
    const element = selectedBills[index];
    if (
      (element.inventoryReduced === 0 || element.inventoryReduced === 3) &&
      element.inventoryReduced !== 2 &&
      element.order_state !== 'pending'
    ) {
      ordersList.push(element.order_id);
    }
  }
  makeReduceinventoryrequest({ orders: ordersList });
  window.notifyUser.showMessage(
    'success',
    $.i18n.t('controller:receiptsController.taskQueued'),
  );
}

/**
 * Send's the reverse stock for current order id request
 * @param {Parameters} params
 */
async function sendinventoryupdateRequest(params) {
  if (window.Swal.isVisible()) {
    window.Swal.close();
  }
  const result = await window.Swal.fire({
    title: $.i18n.t('controller:receiptsController.Inventory'),
    text: $.i18n.t(
      'controller:receiptsController.doYouWantToReverseStockForThisOrder',
    ),
    showCancelButton: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    width: '23em',
    confirmButtonText: $.i18n.t('controller:receiptsController.Reverse'),
    customClass: {
      popup: 'tmbill-swal-pop-up',
    },
  });

  if (result.value) {
    makeReverseinventoryrequest(params);
  }
}

/**
 * Called after the payment/status is updated.
 * @param {Updated data} updatedData
 */
async function updatePayandstatus(updatedData) {
  if (updatedData) {
    const currentBilldetails = getSelectedBill();
    if (!currentBilldetails) {
      return;
    }
    if (currentBilldetails !== undefined && updatedData.updateData) {
      const data = updatedData.updateData;
      if (data) {
        const table = $('#receiptTable').DataTable();
        // const currnetrowIndex = $("#receiptTable").DataTable().row(".selectedbillRow").index();
        const currnetrowIndex = $('#receiptTable')
          .DataTable()
          .rows('.selectedbillRow')[0];
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < currnetrowIndex.length; i++) {
          if (data.instructions) {
            let instruction = String(data.instructions).replace(
              'Bill Status::',
              '',
            );
            instruction = String(instruction).replace('|', '');

            table
              .cell({ row: currnetrowIndex[i], column: 27 })
              .data(instruction);
          }

          if (data.payment && currentBilldetails[i].id) {
            $(`#${currentBilldetails[i].id}`).text(data.payment);
            table
              .cell({ row: currnetrowIndex[i], column: 8 })
              .data(data.payment);
          }
          if (data.order_state) {
            const statusLabel = $('<label>', {
              html: data.order_state,
              class: `statusLabel ${data.order_state}`,
              id: `td-billstat-${data.bill_number}`,
            });
            table
              .cell({ row: currnetrowIndex[i], column: 5 })
              .data(data.order_state)
              .draw();
            const paymentCol = $(
              `#receiptTable tr#${currentBilldetails[i].order_id} td:nth-child(6)`,
            );
            $(paymentCol)
              .attr('value', data.order_state)
              .empty()
              .append(statusLabel);

            const reduce_inventory = currentBilldetails[i].inventoryreduced;
            // check if reduce inventory in on if yes then reverse stock
            if (
              window.reduceInventorystatus &&
              !ORDERSTATEFOR_REDUCEINVENTORY.includes(data.order_state)
            ) {
              initAutoReduceInventory();
            }
            if (
              updatedData.order_id &&
              ORDERSTATEFOR_REDUCEINVENTORY.includes(data.order_state) &&
              window.reduceInventorystatus &&
              reduce_inventory &&
              reduce_inventory !== 2
            ) {
              setTimeout(() => {
                sendinventoryupdateRequest({
                  order_state: data.order_state,
                  order_id: updatedData.order_id,
                  store_id: window.storeDetails.store_id,
                  tmpos_id: window.storeDetails.tmpos_id,
                });
              }, 1400);
            }
          }
        }
      }
    }
  }
}

async function sendupdateBillnpaymentrequest(params) {
  const content = await makeUpdatebillandpaymentrequest(params);
  if (content) {
    window.refreshDashboard = true;
    window.refreshOrderSettlementWindow = true;
    window.notifyUser.showMessage(
      'success',
      $.i18n.t('controller:receiptsController.billUpdated'),
    );

    if (
      content &&
      content.updateData &&
      content.updateData.order_state &&
      content.updateData.order_state === 'fulfilled'
    ) {
      if (window.displaytimeonTables) {
        removetablefromwathersList(`table_${content.table_id}`);
      }
    }
    if (
      content &&
      content.updateData &&
      content.updateData.order_state &&
      content.updateData.order_state === 'cancelled' &&
      content.extra_details &&
      content.extra_details.rewardDiscount
    ) {
      sendRewardhistory({
        reward: '',
        order_id: content.order_id,
        phone: content.phone,
        customer_name: content.name,
        isQuickbill: 0,
        action: 'delete',
      });
    }
    if (content) {
      updatePayandstatus(content);
      setTimeout(() => {
        $('#receipt_fetchbillsButton').click();
      }, 100);
      if (content && content.result && content.result.refreshTables) {
        // makeGetTablesRequest
        window.remotegetTables({
          store_id: window.storeDetails.store_id,
        });
        // Broadcast the refresh event
        sendTableRefreshevent();
      }
    }
  }
}

/**
 * Verifies user password.
 */
async function verifyUser() {
  if (window.storeDetails) {
    const bytes = CryptoJS.AES.decrypt(
      window.storeDetails.password,
      window.Config.cipherKey,
    );
    const plaintext = bytes.toString(CryptoJS.enc.Utf8);
    const { value: password } = await window.Swal.fire({
      title: $.i18n.t('controller:receiptsController.enterYourPassword'),
      input: 'password',
      inputPlaceholder: $.i18n.t(
        'controller:receiptsController.enterYourPassword',
      ),
      customClass: {
        popup: 'tmbill-swal-pop-up',
        title: 'tmbill-swal-title-class',
        content: 'tmbill-swal-title-class',
        input: 'tmbill-swal-input2',
      },
      preConfirm: (value) => {
        if (value === '' || value !== plaintext) {
          window.Swal.showValidationMessage(
            $.i18n.t('controller:receiptsController.invalidPassword'),
          );
          return false;
        }
        return value;
      },
    });
    if (password && plaintext === password) {
      return true;
    }
    return false;
  }
  return true;
}

async function updatereceiptPayment() {
  // $("#receiptactionsModal").modal("hide");
  // let payradioValue = $("input[name='receiptpayGroup']:checked").val();
  const selectedPaywrapper = $('#receiptpaymentList div.selectedPayment');
  const payradioValue = $(selectedPaywrapper).attr('payment_title');
  const billstateradioValue = $("input[name='billStat']:checked").val();
  const ispaymentSplit = $('#receiptsplitCheckid').is(':checked');
  const comment = $('#receiptCommentid').val();
  let tipAmount = $('#receipttipAmountid').val();
  const tipPaymentMode = $(
    '#receiptTipPaymentid option:selected:not([disabled])',
  ).text();
  const payment_ref_number = $('#receiptPaymentReferencenumberid').val();

  const customer_paid_amount = $('#receiptpaymentCustomerPaidamtid').val();

  if (
    makePaymentrefmandatory &&
    payradioValue === 'Card' &&
    !payment_ref_number
  ) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:receiptnotifications.Pleaseaddpaymentreferencenumber',
      ),
    );
    return;
  }

  if (payment_ref_number && payment_ref_number.length > 30) {
    window.notifyUser.showMessage(
      'error',
      'Payment reference number should be less than 30 characters',
    );
    return;
  }

  if (Number(tipAmount) && Number(tipAmount) < 0) {
    window.notifyUser.showMessage(
      'error',
      'Tip amount should not be in negative number',
    );
    return;
  }

  if (tipAmount.length > 10) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:orderWindowNotifications.Tipamountshouldbelessthantendigit',
      ),
    );
    return;
  }

  if (ispaymentSplit && makePaymentrefmandatory) {
    const splitpaymentmodeList = $('#receiptsplitpaylistId li');
    const splitPaylist = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const li of splitpaymentmodeList) {
      const product = $(li).get(0);
      const tempPaydata = {
        payment_option: product.id,
      };
      splitPaylist.push(tempPaydata);
    }
    const uniquePaymentOptions = [
      ...new Set(splitPaylist.map((item) => item.payment_option)),
    ];
    if (uniquePaymentOptions.includes('Card') && !payment_ref_number) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:receiptnotifications.Pleaseaddpaymentreferencenumber',
        ),
      );
      return;
    }
  }

  const selectedBill = getSelectedBill();
  const remainingAmount = $('#receiptremainingPayableamount').text();
  if (ispaymentSplit && Number(remainingAmount)) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:receiptnotifications.Incompletepaymentinfo'),
    );
    return;
  }
  if (
    (billstateradioValue && billstateradioValue === 'cancelled') ||
    payradioValue
  ) {
    if (makereasoncompulsory && !comment) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:receiptnotifications.Pleaseaddcomment'),
      );
      return;
    }
    if (makereasoncompulsory && !comment.trim().length) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:receiptnotifications.Pleaseaddcomment'),
      );
      return;
    }
  }

  if (comment && comment.length > 100) {
    window.notifyUser.showMessage(
      'error',
      'comment length should be less than 100 characters',
    );
    return;
  }

  let deliveryboyId;
  let deliveryBoyPhone;
  let deliveryBoyName;
  let isDeliveryBoyUpdated = false;
  const selection = $(
    '#receiptdeliveryBoylistId option:selected:not([disabled])',
  );
  if (selection.length > 0) {
    deliveryboyId = $(selection).attr('value');
    deliveryBoyPhone = $(selection).attr('phone');
    deliveryBoyName = $(selection).html();
    selectedBill[0].deliveryboy_id = deliveryboyId;
  }

  if (
    deliveryboyId &&
    Number(deliveryboyId) !== selectedBill[0].deliveryboy_id
  ) {
    isDeliveryBoyUpdated = true;
  }

  if (
    selectedBill[0].billType === 3 &&
    (!selectedBill[0].deliveryboy_id || !isDeliveryBoyUpdated) &&
    (deliveryBoyMandatory || isSendCustomerDetailsToDBoyEnabled)
  ) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.pleaseSelectDeliveryBoy'),
    );
    return;
  }

  if (
    billstateradioValue &&
    selectedBill[0].order_state === OrderState.FREE &&
    !['free', 'cancelled', 'deleted'].includes(billstateradioValue) &&
    !payradioValue
  ) {
    window.notifyUser.showMessage('error', 'Pleasew select payment mode');
    return;
  }

  if (
    (!billstateradioValue ||
      !['cancelled', 'deleted'].includes(billstateradioValue)) &&
    !selectedBill[0].payment &&
    !payradioValue
  ) {
    window.notifyUser.showMessage('error', 'Please select payment mode');
    return;
  }

  $('#receiptactionsModal').modal('hide');
  if (
    billstateradioValue ||
    payradioValue ||
    tipAmount ||
    payment_ref_number ||
    isDeliveryBoyUpdated ||
    tipPaymentMode
  ) {
    if (
      payradioValue &&
      selectedBill[0] &&
      selectedBill[0].hasDuepayment &&
      selectedBill[0].due_payment > 0
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:receiptnotifications.Billhasduepaymentsocantupdatepaymentmode',
        ),
      );
      return;
    }

    if (payradioValue && selectedBill && selectedBill.length > 1) {
      selectedBill.forEach((bill) => {
        if (bill.hasDuepayment && bill.due_payment > 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t(
              'controller:receiptnotifications.Billhasduepaymentsocantupdatepaymentmode',
            ),
          );
        }
      });
    }
    const userVerified = await verifyUser();

    if (userVerified) {
      const updateData = {};
      updateData.user_id = window.storeDetails.username;
      if (billstateradioValue) {
        updateData.order_state = billstateradioValue;
        if (
          ['free', 'deleted', 'cancelled'].includes(billstateradioValue) &&
          window.sendotpforReceipt
        ) {
          const isotpValid = await askforOTP(
            billstateradioValue,
            selectedBill[0].order_id,
            OTP_TYPES.ORDER_STATUS_UPDATE_RECEIPT,
          );
          if (!isotpValid) return;
        }
      }

      updateData.order_status = selectedBill[0].order_state;

      if (payradioValue) {
        if (ispaymentSplit) {
          updateData.payment_id = 0;
          updateData.payment = 'Split';
        } else {
          const payid = $("input[name='receiptpayGroup']:checked").attr(
            'payid',
          );
          updateData.payment_id = payid;
          updateData.payment = payradioValue;
        }
      }

      if (customer_paid_amount) {
        updateData.cust_paid_amount = customer_paid_amount;
      }

      if (updateData.order_status == 'cancelled') {
        updateData.due_payment = '0';
      }
      if (
        ['free', 'deleted', 'cancelled'].includes(selectedBill[0].order_state)
      ) {
        // updateData.instructions = addOrderlevelinstructions(
        //   selectedBill.instructions,
        //   comment,
        //   'Bill Status',
        // );
        updateData.field1 = comment;
      } else if (comment)
        // updateData.instructions = addOrderlevelinstructions(
        //   selectedBill.instructions,
        //   comment,
        //   'Bill Status',
        // );
        updateData.field1 = comment;

      // eslint-disable-next-line array-callback-return
      selectedBill.map((bill) => {
        if (bill.instructions) {
          updateData.instructions = bill.instructions + updateData.instructions;
        }
      });

      // update delivery boy
      if (deliveryboyId) {
        updateData.deliveryboy_id = deliveryboyId;
        updateData.delivery_boy_name = deliveryBoyName;
        updateData.delivery_boy_phone = deliveryBoyPhone;
      }

      const tipAmountData = {};
      if (!tipAmount && tipPaymentMode) {
        let extra_details = selectedBill[0].extra_details;
        if (extra_details.total_tip) {
          tipAmount = extra_details.total_tip;
        }
      }
      if (tipAmount) {
        Object.assign(tipAmountData, {
          amount: tipAmount,
          payment_option: tipPaymentMode,
          order_id: selectedBill[0].order_id,
          waiter: selectedBill[0].waiter,
          waiter_id: selectedBill[0].waiter_id,
          store_id: selectedBill[0].store_id,
          sync_status: 0,
        });
        // Object.assign(updateData, {orderTipData: tipAmountData})
      }

      const swalOptions = {
        title: 'Are you sure?',
        text: 'Bill Modification',
        customClass: {
          popup: 'tmbill-swal-pop-up',
          title: 'tmbill-swal-title-class',
          content: 'tmbill-swal-title-class',
        },
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, Modify it!',
        width: '23em',
      };
      if (
        selectedBill &&
        selectedBill.hasDuepayment &&
        selectedBill.due_payment > 0
      ) {
        Object.assign(swalOptions, {
          text: `Are you sure to change the bill status of the bill, because it will be removed from due payement report and bills will be settled as cash?`,
        });
      }

      window.Swal.fire(swalOptions).then(async (result) => {
        if (result.value) {
          const currentBilldetails = getSelectedBill();
          // eslint-disable-next-line no-plusplus
          for (let i = 0; i < currentBilldetails.length; i++) {
            if (currentBilldetails !== undefined) {
              const whereData = {
                order_id: currentBilldetails[i].order_id,
              };

              let payList = [];
              const splitpaymentList = $('#receiptsplitpaylistId li');
              // eslint-disable-next-line no-restricted-syntax
              for (const li of splitpaymentList) {
                const product = $(li).get(0);
                const individualAmt = product.getAttribute('amount');
                const tempPaydata = {
                  order_id: currentBilldetails[i].order_id,
                  payment_option: product.id,
                  amount: individualAmt,
                  status_flag: 1,
                };
                payList.push(tempPaydata);
              }

              payList = aggregatePayments(payList);

              const params = {
                updateData,
              };
              if (tipAmountData) {
                Object.assign(params, { orderTipData: tipAmountData });
              }
              if (payment_ref_number) {
                Object.assign(params, {
                  payment_refernce_number: payment_ref_number,
                });
              }
              const selectedBills = $('#receiptTable')
                .DataTable()
                .rows({ selected: true })
                .data();
              const multipleBillsselected =
                selectedBills && selectedBills.length > 1;
              if (multipleBillsselected) {
                const selectedOrderid = [];
                const mutltiplePaylist = [];
                // eslint-disable-next-line no-plusplus
                for (let index = 0; index < selectedBills.length; index++) {
                  const element = selectedBills[index];
                  selectedOrderid.push(element.order_id);
                  if (updateData.payment) {
                    mutltiplePaylist.push({
                      order_id: element.order_id,
                      payment_option: updateData.payment,
                      amount: element.order_total,
                    });
                  }
                }
                if (selectedOrderid.length) {
                  Object.assign(params, {
                    selectedOrderid,
                    multipleBillsselected,
                    mutltiplePaylist:
                      updateData.payment && mutltiplePaylist.length > 0
                        ? mutltiplePaylist
                        : undefined,
                  });
                }
              }

              Object.assign(params, {
                where: whereData,
                order_id: currentBilldetails[i].order_id,
                amount: currentBilldetails[i].order_total,
                ispaymentSplit,
                hasDuepayment: currentBilldetails[i].hasDuepayment,
                table_id: currentBilldetails[i].table_id,
                extra_details: currentBilldetails[i].extra_details,
                phone: currentBilldetails[i].phone,
                name: currentBilldetails[i].cust_name,
              });

              if (payList && payList.length) {
                Object.assign(params, {
                  payList,
                });
              }
              sendupdateBillnpaymentrequest(params);
            }
          }
        }
      });
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:receiptsController.invalidPassword'),
      );
    }
  }

  $("input[name='receiptpayGroup']:checked").prop('checked', false);
  $("input[name='billStat']:checked").prop('checked', false);
  $('#receipttipAmountid').val('');
  $('#receiptCommentid').val('');
  $('#receiptPaymentReferencenumberid').val('');
  $('#receiptdeliveryBoylistId').val('0');
  $('#receiptCommentid').prop('selectedIndex', 0);
  $('#receiptTipPaymentid').prop('selectedIndex', 0);
}

/**
 * Show's edit payment and status window
 */
function showEditwindow() {
  const currentBilldetails = getSelectedBill();
  if (currentBilldetails === undefined) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:receiptsController.selectBill'),
      0,
    );
    return;
  }
  if (
    currentBilldetails.sync_status !== undefined &&
    currentBilldetails.sync_status === 1
  ) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:receiptsController.cannotModifySyncedBills'),
    );
    return;
  }
  // if (currentBilldetails.due_payment > 0) {
  //   window.notifyUser.showMessage("error", "Please settle all dues first",);
  //   return;
  // }

  $('#receiptpaymentcustomerpaidamtcontainer').hide();
  $('#receiptpaymentreturnamtcontainer').hide();
  $('#receiptpaymentList div').removeClass('selectedPayment');
  $(`#receiptsplitpaylistId`).empty();
  $('#receiptPaymentReferencenumberid').val('');
  $('#receipttipAmountid').val('');
  $('#receiptCommentid').val('');
  $('#receiptdeliveryBoylistId').val('0');
  $('#receiptCommentid').prop('selectedIndex', 0);
  $('#receiptTipPaymentid').prop('selectedIndex', 0);

  if (currentBilldetails !== undefined) {
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < currentBilldetails.length; i++) {
      const billNumber = currentBilldetails[i].id;
      const selectedBills = $('#receiptTable')
        .DataTable()
        .rows({ selected: true })
        .data();
      if (billNumber) {
        // if (billNumber && billStatus && String(billStatus).toLowerCase() === 'pending') {
        $('#receiptsplitCheckid').prop('checked', false);
        $('#receiptpaysplistselectwrapperId').css('display', 'none');
        $('#receiptaddpayMethodbutton').css('display', 'none');
        $('.newremainingsplitWrapper').css('display', 'none');
        $('.receiptpaymentGrandtotalclass').css('display', 'none');
        $('#receiptsplitpayAmount').css('display', 'none');
        $('#receiptpaymentTotalid').html($('#receiptGrandlabelid').text());
        $('#receiptremainingPayableamount').html('');

        if (selectedBills && selectedBills.length > 1) {
          $('.splitSectiondiv').hide();
        } else {
          if (currentBilldetails[0].billType === 3) {
            setTimeout(() => {
              $('#receiptdeliveryBoyContainerId').show();
              $('#receiptdeliveryBoylistId').show();
              $('#receiptdeliveryBoylistId').val(
                currentBilldetails[0].deliveryboy_id || 0,
              );
            }, 50);
          } else {
            setTimeout(() => {
              $('#receiptdeliveryBoylistId').hide();
              $('#receiptdeliveryBoyContainerId').hide(); // deliveryBoyslist
            }, 50);
          }

          $('.splitSectiondiv').show();
        }

        $('#receiptactionsModal').modal('show');
      } else {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:receiptsController.cannotModifyPendingBills'),
          0,
        );
      }
    }
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:receiptsController.selectBill'),
      0,
    );
  }
}

function showModifyBillwindow() {
  const receiptsTable = $('#receiptTable').DataTable();
  const billDetails = receiptsTable.row('.selectedbillRow').data();
  const table = $('#receiptitemsTable').DataTable();
  const data = table.rows().data();
  const items = [];
  if (data) {
    // eslint-disable-next-line array-callback-return
    data.map((item) => {
      items.push(item);
    });
  }

  if (billDetails === undefined) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:receiptsController.selectBill'),
      0,
    );
    return;
  }

  // if (window.ISBILLINGBYSECTION_ON) {
  //   window.notifyUser.showMessage(
  //     'error',
  //     'Section wise billing not allowed',
  //     0,
  //   );
  //   return;
  // }

  Object.assign(billDetails, { tmpos_order_charges: selectedCharges });
  Object.assign(billDetails, { items });
  if (window.modifyBillScriptLoaded) {
    $('#billModifyModal').modal('show');
    $('#billModifyModalbodyid').attr('data', JSON.stringify(billDetails));
  } else {
    $('#billModifyModalbodyid').load('modifyBill.html', async () => {
      $('#billModifyModalbodyid').attr('data', JSON.stringify(billDetails));
      $('#billModifyModal').modal('show');
    });
  }
}

function showReverseInventorywindow() {
  const receiptsTable = $('#receiptTable').DataTable();
  const billDetails = receiptsTable.row('.selectedbillRow').data();
  const table = $('#receiptitemsTable').DataTable();
  const data = table.rows().data();
  const items = [];
  if (data) {
    // eslint-disable-next-line array-callback-return
    data.map((item) => {
      items.push(item);
    });
  }

  if (billDetails === undefined) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:receiptsController.selectBill'),
      0,
    );
    return;
  }

  Object.assign(billDetails, { tmpos_order_charges: selectedCharges });
  Object.assign(billDetails, { items });
  if (window.reverseItemInventoryScriptLoaded) {
    $('#reverseItemInventoryModal').modal('show');
    $('#reverseItemInventoryModalbodyid').attr(
      'data',
      JSON.stringify(billDetails),
    );
  } else {
    $('#reverseItemInventoryModalbodyid').load(
      'ReverseItemInventory.html',
      async () => {
        $('#reverseItemInventoryModalbodyid').attr(
          'data',
          JSON.stringify(billDetails),
        );
        $('#reverseItemInventoryModal').modal('show');
      },
    );
  }
}

/**
 *
 * @param {*} data
 * @param {*} rowNumber
 */
function addreceiptRow(data, rowNumber) {
  const table = $('#receiptTable');
  table.append(
    `<tr><td >${rowNumber}</td><td>${data.bill_number}</td><td>${
      data.table_name
    }</td><td class='receipt_date'>${data.created_date}</td><td>${
      !data.order_total
        ? data.order_total
        : data.order_subtotal + data.order_level_total_taxes - data.discount
    }</td><td>${data.discount}</td><td>${
      data.order_level_total_taxes
    }</td><td>${data.billing_type}</td><td>${data.billing_type}</td><td>${
      data.payment ? data.payment : '-'
    }</td><td>${data.cust_name ? data.cust_name : '-'}</td><td>${
      data.order_state
    }</td>`,
  );
  // $('#receiptTable').trigger('rowAddOrRemove');
}
/**
 *
 * @param {*} bills
 */
function showBills(bills) {
  const bill = [];
  // eslint-disable-next-line array-callback-return
  bills.map((ele) => {
    if (
      ele.order_state === 'pending' &&
      /-Per-|-Por-|-Part/.test(ele.table_name)
    ) {
      // unused
    } else {
      bill.push(ele);
    }
  });
  if (!useJQuerytable) {
    if (bill !== undefined && bill.length > 0) {
      let i = 0;
      bill.forEach((element) => {
        // eslint-disable-next-line no-plusplus
        i++;
        addreceiptRow(element, i);
      });
    }
  } else {
    $('#selectallreceiptBillcheck').prop('checked', false);
    $('#receiptTable').DataTable().clear().draw();
    $('#receiptTable').DataTable().rows.add(bill); // Add new data
    $('#receiptTable').DataTable().columns.adjust().draw(); // Redraw the DataTable
  }
}
/**
 * Genereates Report
 */
async function generateReport(reportData) {
  if (reportData && reportData.bills && reportData.bills.length > 0) {
    const result = setDateForgettingMidnightReport();
    if (countMidnightSale && result) {
      Object.assign(reportData, { isMidnightSale: true });
    }

    if (
      reportData.params &&
      reportData.params.fromDate &&
      reportData.params.toDate
    ) {
      const date1 = new Date(Number(reportData.params.fromDate));
      let formattedDate = formatAMPM(date1, false);
      let date2 = new Date(parseInt(reportData.params.toDate));
      let formattedDate2 = formatAMPM(date2, false);
      // const formattedDate = moment(date1).format('dd/mm/yyyy');
      // const date2 = new Date(Number(reportData.params.toDate));
      // const formattedDate2 = moment(date2).format('dd/mm/yyyy');
      reportData.customDatetitle = `${$.i18n.t(
        'report.between',
      )} ${formattedDate} ${$.i18n.t('report.to')} ${formattedDate2}`;
    }
    const previewDetails = {
      data: reportData,
      report_type: "Today's Report",
      storeDetails: window.storeDetails,
      sendBase64String,
      printReportWhileSendingOnMail,
      showLoader: true,
    };

    if (window.reportsscriptLoaded) {
      $('#reportprintBodyid').data('data', previewDetails);
      await window.redrawReportview();
    } else {
      $('#reportprintBodyid').data('data', previewDetails);
      $('#reportprintBodyid').load('Report.html', () => {
        window.redrawReportview();
      });
    }
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:receiptsController.UhOhhNoBillsGenerated'),
      0,
    );
  }
}

/**
 * Listen to get bill's reply event to get bill's requested through
 */
async function renderBills(data) {
  if (!data) {
    return;
  }
  if (window.Swal.isVisible()) {
    window.Swal.close();
  }
  if (data.params) {
    if (data.params.report) {
      generateReport(data);
      return;
    }
  }
  if (data && data.bills !== undefined && data.bills.length > 0) {
    showBills(data.bills);
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:receiptsController.UhOhhNoBillsGenerated'),
    );
  }
}

async function fetchBillby(type) {
  const billsList = await makegetBillsrequest(type);
  renderBills(billsList);
}

function setCharges(charges) {
  if (charges && charges.length > 0) {
    selectedCharges = [];
    charges.forEach((element) => {
      const tempCharge = {
        billing_flag: element.order_billing_flag,
        per_or_fixed: element.per_or_fixed,
        amount: element.value,
        chargeAmount: element.amount,
        title: element.title,
        is_tax_applicable: element.calculated_tax > 0 ? 1 : 0,
        // tax_amount: element.amount,
        is_tax_included: element.is_tax_included,
        calculated_tax: element.calculated_tax,
        tax_divided: element.tax_divided,
        tax_title: element.tax_title,
        tax_amount: element.tax_amount,
        order_id: element.order_id,
        extra_details: element.extra_details,
      };
      selectedCharges.push(tempCharge);
    });
  } else {
    selectedCharges = [];
  }
}

/**
 *
 * @param {*} data
 */
function addreceiptitemRow(data) {
  const table = $('#receiptitemsTable');
  let { title } = data;
  if (window.selectedLanguage !== 'en' && data.alternative_title) {
    title = data.alternative_title;
  }
  const total = data.quantity * data.price;
  table.append(
    `<tr><td >${title}</td><td>${data.quantity}</td><td>${data.price}</td><td class='receipt_date'>${total}</td>`,
  );
  // $('#receiptTable').trigger('rowAddOrRemove');
}

async function getBillitemdetails(params) {
  const billdata = await makegetBilldetailsrequest(params);
  if (billdata && billdata.items) {
    const billItems = billdata.items;
    if (billdata.charges && billdata.charges.length > 0) {
      setCharges(billdata.charges);
    } else {
      selectedCharges = [];
    }
    if (billdata.discountHistory && billdata.discountHistory.length > 0) {
      discountHistory = billdata.discountHistory;
    } else {
      discountHistory = [];
    }

    if (billdata.preorderInfo) {
      selectedBillpreorderinfo = billdata.preorderInfo;
    } else {
      selectedBillpreorderinfo = undefined;
    }
    if (useJQuerytable) {
      $('#receiptitemsTable').DataTable().clear().draw();
      $('#receiptitemsTable').DataTable().rows.add(billItems); // Add new data
      $('#receiptitemsTable').DataTable().columns.adjust().draw(); // Redraw the DataTable
    } else {
      $('#receiptitemsTable').find('tr:not(:first)').remove();
      billItems.forEach((element) => {
        addreceiptitemRow(element);
      });
    }
  }
}

function selectallBills(selectAll) {
  const receiptsTable = $('#receiptTable').DataTable();
  if (selectAll) {
    const isFiltered = $('#searchreceiptField').val();
    if (isFiltered) receiptsTable.rows({ search: 'applied' }).select();
    else {
      receiptsTable.rows().select();
    }
    $('#receiptTable tbody tr').addClass('selectedbillRow selected checked');
  } else {
    receiptsTable.$('tr.selected').removeClass('selectedbillRow');
    receiptsTable.rows().deselect();
    // $('#receiptTable tbody tr').removeClass('selectedbillRow selected');
  }
  onSelectrowchange();
}

/**
 * SHow current due payments
 * @param {Current order data} data
 */
async function viewDuepaytransactions(data) {
  if (data && data.order_id) {
    const dueData = await makeGetduepaytransactionsrequest({
      order_id: data.order_id,
      store_id: data.store_id,
    });
    if (dueData && dueData.transactions) {
      const { transactions } = dueData;
      if (
        transactions &&
        Array.isArray(transactions) &&
        transactions.length > 0
      ) {
        $('#orderduepaytransModal').modal('toggle');
        $('#orderduepaytransactionstableID').DataTable().clear().draw();
        $('#orderduepaytransactionstableID').DataTable().rows.add(transactions); // Add new data
        $('#orderduepaytransactionstableID')
          .DataTable()
          .columns.adjust()
          .draw();
      } else {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:receiptsController.historyNotFound'),
          0,
        );
      }
    }
  }
}

async function reduceInventory(data, clickedElement) {
  if (data.order_state === 'pending') {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:receiptnotifications.CantreduceinventoryofpendingbillPleasesettlebillfirsts',
      ),
    );
    return;
  }
  const result = await window.Swal.fire({
    title: $.i18n.t('controller:receiptsController.doYouWantToReduceInventory'),
    confirmButtonText: $.i18n.t('controller:receiptsController.Yes'),
    cancelButtonText: $.i18n.t('controller:receiptsController.No'),
    showCancelButton: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
  });
  if (result && result.value) {
    if (window.reduceInventorystatus) {
      const orderListId = [data.order_id];
      makeReduceinventoryrequest({ orders: orderListId });
      $(clickedElement).removeClass();
      $(clickedElement).html('reduced');
      $(clickedElement).unbind('click');
      $(clickedElement).addClass('statusLabel reduced-label');
    }
  }
}
function getRandomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

/**
 * Called upon everytime a bill row is created
 * @param {Current row} row
 * @param {JSON Data } data
 * @param {*} index
 */
function onrowCreatelistener(row, data, _index) {
  if (data && data.bill_number !== '0') {
    // Check instruction
    if (data.instructions) {
      $('td', row).last().empty();

      if (data.instructions.includes('Bill Status::')) {
        let instruction = String(data.instructions)
          .split('|')
          .filter((x) => x && x.includes(`Bill Status::`));
        instruction =
          instruction && instruction.length ? instruction[0] : undefined;
        if (instruction) {
          instruction = String(instruction).replace('Bill Status::', '');
          $('td', row).eq(27).html(instruction);
        }
      }

      if (data.instructions.includes('Discount::')) {
        let instruction = String(data.instructions)
          .split('|')
          .filter((x) => x && x.includes(`Discount::`));
        instruction =
          instruction && instruction.length ? instruction[0] : undefined;
        if (instruction) {
          instruction = String(instruction).replace('Discount::', '');
          $('td', row).eq(27).html(instruction);
        }
      }
    }

    if (
      [0, 1, 2, 3, 8, 40].includes(Number(data.billing_type)) &&
      ((data.extra_details && !data.extra_details.isBarSection) ||
        data.extra_details == null)
    ) {
      $('td', row).eq(16).html(data.custom_bill_number);
      $('td', row).eq(17).html('');
      $('td', row).eq(18).html('');
    } else if (data.extra_details && data.extra_details.isBarSection) {
      $('td', row).eq(18).html(data.custom_bill_number);
      $('td', row).eq(16).html('');
      $('td', row).eq(17).html('');
    } else {
      $('td', row).eq(17).html(data.custom_bill_number);
      $('td', row).eq(16).html('');
      $('td', row).eq(18).html('');
    }
    $(row).addClass('order-row');
    $('td', row).eq(11).attr('id', `td-pay-${data.bill_number}`);

    // Add the billing type
    const statusLabel = $('<label>', {
      html: $.i18n.t(`common:billStatus.${data.order_state}`), // data.order_state,
      class: `statusLabel ${String(data.order_state).toLowerCase()}`,
      id: `td-billstat-${data.bill_number}`,
    });
    $('td', row)
      .eq(5)
      .attr('value', data.order_state)
      .empty()
      .append(statusLabel);

    if (data.created_time) {
      try {
        const formattedDate = window
          .moment(data.created_time)
          .format('DD MMM YYYY hh:mm A');
        $('td', row).eq(11).html(formattedDate);
      } catch (error) {
        console.error(error);
      }
    }
    // const billingType = BillingTypes[data.billing_type];
    let billingType = window.orderTypes[Number(data.billing_type)].order_type;
    const englishBillingType =
      window.orderTypes[Number(data.billing_type)].order_type;
    if (
      window.selectedLanguage !== 'en' &&
      window.orderTypes[Number(data.billing_type)].altenative_title
    ) {
      billingType =
        window.orderTypes[Number(data.billing_type)].altenative_title;
    }

    const color = getRandomColor();
    if (billingType) {
      const billTypelabel = $('<label>', {
        html: billingType,
        class: `statusLabel ${englishBillingType.replace(/[0-9\s&]/g, '').toLowerCase()}`,
      }).css({
        'background-color': `${color}26`,
        color,
      });
      data.billType = data.billing_type;
      data.billing_type = billingType;

      $('td', row).eq(4).empty().append(billTypelabel);
    }
  }
  $(row).attr('id', data.order_id);
  $(row).attr('sync_status', data.sync_status);

  // BIlling types greater than 4 are for online orders
  if (ONLINE_PLATFORMS.includes(data.billType)) {
    const onlinetaxesTotal = Number(data.order_level_total_taxes || 0);
    const onlineorderchargesTotal = Number(data.order_level_total_charges || 0);
    // onlinetaxesTotal = extraDetails.merchant_and_aggregator_tax_total || 0;

    $(row).attr(
      'order_details',
      JSON.stringify({
        billing_type: data.billType,
        onlinetaxesTotal,
        discounttoApply: Number(data.discount || 0),
        onlinechargesTotal: onlineorderchargesTotal,
        total_external_discount: Number(data.total_external_discount || 0),
      }),
    );
  }

  // Add actions
  if (window.reduceInventorystatus) {
    switch (data.inventoryReduced) {
      case INVENTORY_STATUS.NOT_REDUCED:
      case INVENTORY_STATUS.DO_NOT_REDUCE:
        {
          const reduceInventoryaction = $('<label>', {
            class: 'statusLabel reduce-label',
            html: $.i18n.t('controller:receiptsController.Reduce'),
          }).on('click', (event) => {
            event.stopPropagation();
            reduceInventory(data, reduceInventoryaction);
          });

          $('td', row)
            .eq(19)
            .empty()
            .attr('inventoryReduced', data.inventoryReduced)
            .append(reduceInventoryaction);
        }
        break;
      case INVENTORY_STATUS.REDUCED:
        {
          const reduceInventoryaction = $('<label>', {
            class: `statusLabel reduced-label`,
            html: 'reduced',
          });
          $('td', row)
            .eq(19)
            .empty()
            .on('click', (event) => {
              event.stopPropagation();
              sendinventoryupdateRequest({
                order_state: data.order_state,
                order_id: data.order_id,
                store_id: window.storeDetails.store_id,
                tmpos_id: window.storeDetails.tmpos_id,
              });
            })
            .attr('inventoryReduced', data.inventoryReduced)
            .append(reduceInventoryaction);
        }
        break;
      case INVENTORY_STATUS.REVERSED:
        {
          const reduceInventoryaction = $('<label>', {
            class: `statusLabel reversed-label`,
            html: $.i18n.t('controller:receiptsController.reversed'),
          });
          $('td', row)
            .eq(19)
            .empty()
            .attr('inventoryReduced', data.inventoryReduced)
            .append(reduceInventoryaction);
        }
        break;
      default:
        $('td', row).eq(19).empty().append('-');
        break;
    }
  } else {
    $('td', row).eq(19).empty().append('-');
  }

  if (data.coupon && data.couponDisounttotal > 0) {
    const couponLabel = `${data.coupon} : ${data.couponDisounttotal}`;
    $('td', row).eq(20).empty().append(couponLabel);
  } else {
    $('td', row).eq(20).empty().append('-');
  }

  if (
    data.mpos_irn_histories &&
    data.mpos_irn_histories.length &&
    data.mpos_irn_histories[0].irn_no
  ) {
    const isGenerated = $('<label>', {
      class: 'statusLabel irnhistory-label',
      html: $.i18n.t('controller:receiptsController.Generated'),
    });
    $('td', row).eq(27).empty().append(isGenerated);
  } else {
    $('td', row).eq(27).empty().append('-');
  }

  if (data.hasDuepayment && data.order_state === 'fulfilled') {
    $('td', row).eq(21).empty();
    const dueHistory = $('<label>', {
      class: 'statusLabel reduce-label2',
      html: $.i18n.t('controller:receiptsController.View'),
    })
      .attr('title', `View due transactions`)
      .on('click', (event) => {
        event.stopPropagation();
        viewDuepaytransactions(data);
      });
    if (data.due_payment === 0) {
      const paidLabel = $('<label>', {
        html: $.i18n.t('controller:receiptsController.Paid'),
        class: 'statusLabel paid',
      });
      $('td', row).eq(21).append(paidLabel);
    }

    $('td', row).eq(21).append(dueHistory);
  } else {
    // $('td', row).eq(20).empty().append('-');
  }

  if (data.order_total === 0) {
    let newAmount =
      data.order_subtotal +
      data.order_level_total_charges +
      data.order_level_total_taxes;
    newAmount -= data.discount;

    $('td', row).eq(12).empty().append(newAmount);
  }

  // REMOVE PAYMENT IF DUE IS AVAIBLE WITH NO PAYMENT
  if (
    data.tmpos_order_payment &&
    Array.isArray(data.tmpos_order_payment) &&
    data.tmpos_order_payment.length === 0 &&
    data.due_payment > 0
  ) {
    $('td', row).eq(9).empty().append('-');
  }

  if (data && data.payment && data.payment === 'Split') {
    const formattedString = `${data.tmpos_order_payment
      .map((p) => `${p.payment_option}(${p.amount})`)
      .join(', ')}`;
    $('td', row).eq(9).empty().append(formattedString);
  }

  if (
    data &&
    data.extra_details &&
    data.extra_details.currencyConversionDetails
  ) {
    $('td', row)
      .eq(28)
      .empty()
      .append(data.extra_details.currencyConversionDetails.currency);
    $('td', row)
      .eq(29)
      .empty()
      .append(data.extra_details.currencyConversionDetails.amountAfterConvert);
  }

  if (data.mpos_order_tip && data.mpos_order_tip.payment_option) {
    $('td', row).eq(24).empty().append(data.mpos_order_tip.amount);
    $('td', row).eq(25).empty().append(data.mpos_order_tip.payment_option);
    Object.assign(data, {
      tipPaymentMode: data.mpos_order_tip.payment_option,
      tipAmount: Number(data.mpos_order_tip.amount).toFixed(
        global.ROUNDOFF_UPTO,
      ),
    });
  }
  Object.assign(data, {
    kot_numbers: data.extra_details?.kot_numbers,
    kotcreatedAt: data.extra_details.kotcreatedAt,
  });

  if (data.tmpos_order_charges && data.tmpos_order_charges.length) {
    let order_level_total_charges_without_tax = 0;
    data.tmpos_order_charges.forEach((charge) => {
      if (charge.status_flag === 0) {
        if (charge.calculated_tax && charge.is_tax_included === 0) {
          order_level_total_charges_without_tax +=
            charge.value - charge.calculated_tax;
        } else {
          order_level_total_charges_without_tax += charge.value;
        }
      }
    });
    Object.assign(data, {
      order_level_total_charges_without_tax,
    });
  } else if (Number(data.charges)) {
    Object.assign(data, {
      order_level_total_charges_without_tax: Number(data.charges),
    });
  }
}

/**
 * Initializes the datatable
 * @param {Bill list} bills
 */
function initializeDataTable(bills) {
  $('#receiptTable').DataTable({
    data: bills,
    scrollY: '39vh',
    scrollX: true,
    bPaginate: false,
    bLengthChange: false,
    bFilter: true,
    bInfo: false,
    bAutoWidth: false,
    ordering: false,
    paging: true,
    autoWidth: false,
    fixedColumns: true,
    pageLength: 30,
    language: {
      url: `../locales/${$.i18n.language}/datatable.json`,
    },
    columns: [
      {
        title: $.i18n.t('tables:receiptTableHeadings.Select'),
        data: 'bill_number',
      },
      { title: $.i18n.t('tables:receiptTableHeadings.SrNo'), data: 'srno' },
      {
        title: $.i18n.t('tables:receiptTableHeadings.billNo'),
        data: 'bill_number',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.table'),
        data: 'table_name',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.Type'),
        data: 'billing_type',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.Status'),
        data: 'order_state',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.Customer'),
        data: 'cust_name',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.Phone'),
        data: 'phone',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.DBoy'),
        data: 'delivery_boy_name',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.Payment'),
        data: 'payment',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.Amount'),
        data: 'order_total',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.Date'),
        data: 'my_order_date',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.Discount'),
        data: 'discount',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.Tax'),
        data: 'order_level_total_taxes',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.Charges'),
        data: 'order_level_total_charges_without_tax',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.taxOnCharge'),
        data: 'charges_level_total_tax',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.newBillNumber'),
        data: 'custom_bill_number',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.NewEcommbillNo'),
        data: 'custom_bill_number',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.barbillNo'),
        data: 'custom_bill_number',
      }, // 17
      {
        title: $.i18n.t('tables:receiptTableHeadings.Inventory'),
        data: 'inventoryReduced',
      },
      { title: $.i18n.t('tables:receiptTableHeadings.Coupon'), data: 'coupon' }, // 19
      {
        title: $.i18n.t('tables:receiptTableHeadings.Due'),
        data: 'due_payment',
      }, // 20
      {
        title: $.i18n.t('tables:receiptTableHeadings.orderID'),
        data: 'order_id',
      }, // 21
      {
        title: $.i18n.t('tables:receiptTableHeadings.dueAmt'),
        data: 'due_payment',
      }, // 22
      {
        title: $.i18n.t('tables:receiptTableHeadings.TipAmount'),
        data: null,
        defaultContent: '',
      }, // 24
      {
        title: $.i18n.t('tables:receiptTableHeadings.TIPPAYMENTMODE'),
        data: null,
        defaultContent: '',
      }, // 26
      {
        title: $.i18n.t('tables:receiptTableHeadings.Note'),
        data: 'instructions',
      }, // 27
      {
        title: $.i18n.t('tables:receiptTableHeadings.IRN'),
        data: 'mpos_irn_histories',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.FOREIGNCURRENCY'),
        data: '',
        defaultContent: '',
      },
      {
        title: $.i18n.t('tables:receiptTableHeadings.CONVERTEDAMOUNT'),
        data: '',
        defaultContent: '',
      },
    ],
    columnDefs: [
      {
        width: '60px',
        targets: 0,
        className: 'select-checkbox custom-check ',
        // visible: false,
        render: () => '',
      },
      {
        targets: [1, 2],
        width: '50px',
      },
      {
        targets: [3, 4, 6, 10, 11, 12, 19, 20, 21, 22, 23, 24, 25, 26],
        width: '170px',
      },
      {
        targets: [5, 7, 8, 13, 14, 15, 16, 17, 18, 28, 29],
        width: '90px',
      },
      {
        targets: [9],
        width: '90px',
        createdCell: function (td) {
          $(td).css({
            'white-space': 'normal',
            'word-break': 'break-word',
          });
        },
      },

      {
        render(_data, _type, _full, meta) {
          if (meta.row < bills.length) {
            bills[meta.row].srno = meta.row + 1; // adds id to dataset
          }
          return meta.row + 1; // adds id to serial no
        },
        targets: 1,
        className: 'custom-check',
      },
      {
        // targets: [20],
        // visible: false,
      },
    ],
    select: {
      style: 'single',
      selector: 'td:first-child',
    },
    createdRow: onrowCreatelistener,
    footerCallback(_row, data, _start, _end, _display) {
      const api = this.api();
      // Remove the formatting to get integer data for summation
      const intVal = function (i) {
        // eslint-disable-next-line no-nested-ternary
        return typeof i === 'string'
          ? // eslint-disable-next-line no-useless-escape
            i.replace(/[\$,]/g, '') * 1
          : typeof i === 'number'
            ? i
            : 0;
      };
      // Total over all pages
      let allPagerows = 0;
      const allbillstotal = api
        .column(10)
        .data()
        .reduce((a, b) => {
          allPagerows += 1;
          return intVal(a) + intVal(b);
        }, 0);

      // Total over this page
      let currentPagerows = 0;
      const pageTotal = api
        .column(10, { page: 'current' })
        .data()
        .reduce((a, b) => {
          currentPagerows += 1;
          return intVal(a) + intVal(b);
        }, 0);

      const allDueTotal = api
        .column(22)
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      const totalFullfill = data.filter(
        (ele) => ele.order_state === 'fulfilled',
      );
      let fulfilledOrderTotal = 0;
      // eslint-disable-next-line array-callback-return
      totalFullfill.map((ele) => {
        fulfilledOrderTotal = Number(ele.order_total) + fulfilledOrderTotal;
      });

      let order_level_total_taxes = 0;
      let charges_level_total_taxes = 0;
      let totalRoundedAmt = 0;
      // eslint-disable-next-line array-callback-return
      totalFullfill.map((ele) => {
        order_level_total_taxes =
          Number(ele.order_level_total_taxes) + order_level_total_taxes;
      });
      // eslint-disable-next-line array-callback-return
      totalFullfill.map((ele) => {
        charges_level_total_taxes =
          Number(ele.charges_level_total_tax) + charges_level_total_taxes;
      });

      totalFullfill.forEach((bill) => {
        if (bill.extra_details) {
          let { extra_details } = bill;
          if (extra_details.constructor === 'test'.constructor) {
            extra_details = JSON.parse(bill.extra_details);
          }
          if (extra_details.roundedAmount) {
            totalRoundedAmt += extra_details.roundedAmount;
          }
        }
      });
      const net_sale =
        fulfilledOrderTotal -
        (order_level_total_taxes + charges_level_total_taxes) -
        totalRoundedAmt;

      // Update footer
      // let noofRows = !$("#searchreceiptField").val()
      //   ? api.rows({ page: 'current' }).count()
      //   : api.rows(':visible').count();
      // pageTotal = pageTotal - duetotalforPage;
      // allbillstotal = allbillstotal - allDueTotal;
      // fulfilledOrderTotal = fulfilledOrderTotal - allDueTotal;

      if (window.showAllShownBillAmount) {
        $(api.column(0).footer()).html(
          `${$.i18n.t(
            'controller:receiptsController.shownBillsAmount',
          )} (${currentPagerows}) : ${window.currency} ${Number(
            pageTotal,
          ).toFixed(window.ROUNDOFF_UPTO)}`,
        );
      }

      if (window.showNetSaleAmount) {
        $(api.column(1).footer()).html(
          `${$.i18n.t('controller:receiptsController.netSaleAmount')} : ${
            window.currency
          } ${Number(net_sale).toFixed(window.ROUNDOFF_UPTO)}`,
        );
      }

      if (window.showTotalFulfilledAmount) {
        $(api.column(2).footer()).html(
          `${$.i18n.t('controller:receiptsController.totalFulfilledAmount')} ${
            window.currency
          } ${Number(fulfilledOrderTotal).toFixed(window.ROUNDOFF_UPTO)}`,
        );
      }

      if (window.showAllBillAmount) {
        $(api.column(3).footer()).html(
          `${$.i18n.t(
            'controller:receiptsController.allBillsAmount',
          )} (${allPagerows}) : ${window.currency} ${Number(
            allbillstotal,
          ).toFixed(window.ROUNDOFF_UPTO)}`,
        );
      }

      if (allDueTotal > 0) {
        $(api.column(4).footer()).html(
          `Total due amount : ${window.currency} ${Number(allDueTotal).toFixed(
            window.ROUNDOFF_UPTO,
          )}`,
        );
      } else {
        $(api.column(4).footer()).html('');
      }
    },
  });

  $('#receiptitemsTable').DataTable({
    ordering: false,
    scrollY: 175,
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: false,
    order: [[1, 'asc']],
    language: {
      url: `../locales/${$.i18n.language}/datatable.json`,
    },
    columns: [
      {
        title: $.i18n.t('tables:receiptTableHeadings.itemName'),
        data: 'title',
      },
      { title: $.i18n.t('tables:receiptTableHeadings.QTY'), data: 'quantity' },
      { title: $.i18n.t('tables:receiptTableHeadings.Price'), data: 'price' },
      { title: $.i18n.t('tables:receiptTableHeadings.Amount'), data: 'total' },
    ],
    createdRow(row, data, _index) {
      if (data && data.total === 0) {
        $('td', row).eq(3).html('Complementary');
      }
      const total = data.quantity * data.price;

      $('td', row)
        .eq(2)
        .html(data.pricebeforeDiscount.toFixed(window.ROUNDOFF_UPTO));
      $('td', row).eq(3).html(total.toFixed(window.ROUNDOFF_UPTO));
      let itemTitle = data.title;
      if (data.extra_details && data.extra_details.baseTitle) {
        itemTitle = data.extra_details.baseTitle;
      }
      if (window.selectedLanguage !== 'en' && data.alternative_title) {
        itemTitle = data.alternative_title;
      }
      if (data.options && data.options.length) {
        data.options.forEach((addon) => {
          let addonTitle = addon.title;
          if (
            window.selectedLanguage !== 'en' &&
            addon.extra_details &&
            addon.extra_details.alternative_title
          ) {
            addonTitle = addon.extra_details.alternative_title;
          }
          itemTitle = itemTitle + '<br>' + `${addon.qty} x ${addonTitle} `;
        });
      }
      $('td', row).eq(0).html(itemTitle);
    },
  });
}

async function syncBills() {
  // showLoader({
  //   title: 'Syncing bills',
  //   text: $.i18n.t('controller:orderController.pleaseWait'),
  // });
  showPopupMessage({
    title: $.i18n.t('controller:orderController.Billsync'),
    text: $.i18n.t('controller:orderController.Syncinprogress'),
  });

  const data = { silentSync: false, logout: false, showPrompt: true };
  sendSyncrequest(data);
  $('#receiptTable tbody tr').attr('sync_status', '1');
}

async function resyncBills() {
  if (fromDate === undefined || toDate === undefined) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:receiptsController.pleaseSelectDate'),
    );
    return;
  }
  const result = await makeResyncbillrequest({
    fromDate,
    toDate,
  });
  if (result && result.status === 200) {
    syncBills();
  }
}

function refreshReceiptwindow() {
  if (window.refreshReceipt) {
    $('#todaysbillsButton').click();
  }
  window.refreshReceipt = false;
}

/**
 * Window initialization
 */
function Initialize() {
  $('#searchreceiptField').keyup(function () {
    $('#receiptTable').DataTable().search($(this).val()).draw();
  });

  if (
    window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1] !== undefined
  ) {
    countMidnightSale =
      window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1].value ===
      '1';
  }

  if (window.settingsConfig[CUSTOMIZE_ORDER_NUMBER_NAME - 1] !== undefined) {
    customOrderNumberName =
      window.settingsConfig[CUSTOMIZE_ORDER_NUMBER_NAME - 1].value;
  }

  if (
    window.settingsConfig[MAKE_CANCEL_BILL_REASON_MANDATORY - 1] !== undefined
  ) {
    makereasoncompulsory =
      window.settingsConfig[MAKE_CANCEL_BILL_REASON_MANDATORY - 1].value ===
      '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showCategoryData =
      window.settingsConfig[SHOW_CATEGORYWISE_ITEM_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showSolditems =
      window.settingsConfig[SHOW_SOLDITEMS_IN_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showCancelleditems =
      window.settingsConfig[SHOW_CANCELITEMS_IN_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showWaiterData =
      window.settingsConfig[SHOW_WAITER_SUMMARY_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showDeliveryBoyData =
      window.settingsConfig[SHOW_DELIVERYBOY_SUMMARY_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showDiscountData =
      window.settingsConfig[SHOW_DISCOUNT_SUMMARY_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showExpenseData =
      window.settingsConfig[SHOW_EXPENSE_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showDuePaymentData =
      window.settingsConfig[SHOW_DEU_PAYEMENT_SUMMARY_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showWalletData =
      window.settingsConfig[SHOW_WALLET_SUMMARY_REPORT - 1].value === '1';
  }
  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showKDWiseItemsData =
      window.settingsConfig[SHOW_KDWISE_SUMMARY_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showDuePaymentReceivableData =
      window.settingsConfig[SHOW_DUE_PAYMENTS_RECEIVABLE_SUMMARY - 1].value ===
      '1';
  }

  if (window.settingsConfig[AUTO_SYNC - 1] !== undefined) {
    autoSyncmode = window.settingsConfig[AUTO_SYNC - 1].value === '1';
  }

  if (window.settingsConfig[MAKE_DELIVERY_BOY_COMPULSORY - 1] !== undefined) {
    deliveryBoyMandatory =
      window.settingsConfig[MAKE_DELIVERY_BOY_COMPULSORY - 1].value === '1';
  }

  if (
    window.settingsConfig[SEND_CUSTOMERDETAILSTODBOY_CHECK - 1] !== undefined
  ) {
    isSendCustomerDetailsToDBoyEnabled =
      window.settingsConfig[SEND_CUSTOMERDETAILSTODBOY_CHECK - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    fetchReportAsPerCloseDay =
      window.settingsConfig[FETCH_REPORT_AS_PER_CLOSE_DAY - 1].value === '1';

    $('#fetchReceiptDataasperclosedayCheckid').prop(
      'checked',
      fetchReportAsPerCloseDay,
    );

    if (!fetchReportAsPerCloseDay) {
      $('#fetchReceiptDataasperclosedayCheckid').hide();
    }
  }

  if (
    window.settingsConfig[MAKE_PAYMENT_REFERENCE_NUMBER_MANDATORY - 1] !==
    undefined
  ) {
    makePaymentrefmandatory =
      window.settingsConfig[MAKE_PAYMENT_REFERENCE_NUMBER_MANDATORY - 1]
        .value === '1';
  }

  if (
    window.settingsConfig[SEND_BASE64_REPORT_FROM_RECEIPT_SECTION - 1] !==
    undefined
  ) {
    sendBase64String =
      window.settingsConfig[SEND_BASE64_REPORT_FROM_RECEIPT_SECTION - 1]
        .value === '1';
  }

  if (
    window.settingsConfig[
      PRINT_REPORT_WHILE_SENDING_ON_MAIL_FROM_RECEIPT_SECTION - 1
    ] !== undefined
  ) {
    printReportWhileSendingOnMail =
      window.settingsConfig[
        PRINT_REPORT_WHILE_SENDING_ON_MAIL_FROM_RECEIPT_SECTION - 1
      ].value === '1';
  }

  if (
    window.settingsConfig[
      OPEN_CASH_DRAWER_ON_PRINT_FROM_RECEIPT_SECTION - 1
    ] !== undefined
  ) {
    openCashDrawerOnPrintBillFromReceiptSection =
      window.settingsConfig[OPEN_CASH_DRAWER_ON_PRINT_FROM_RECEIPT_SECTION - 1]
        .value === '1';
  }

  if (window.settingsConfig[OPEN_CASH_DRAWER_FOR_ALL - 1] !== undefined) {
    openCashDrawerOnForAll =
      window.settingsConfig[OPEN_CASH_DRAWER_FOR_ALL - 1].value === '1';
  }
  $('#receiptactionsModal').on('hidden.bs.modal', () => {
    $('input[name="receiptpayGroup"]').prop('checked', false);
    $('input[name="billStat"]').prop('checked', false);
  });

  const result = setDateForgettingMidnightReport();

  if (countMidnightSale && result) {
    $('#receipt_fromdateButton').daterangepicker({
      timePicker: true,
      timePickerSeconds: true,

      maxDate: window.moment().subtract(1, 'days').startOf('day').endOf('day'),
      startDate: window.moment().subtract(1, 'days').startOf('day'),
      endDate: window
        .moment()
        .subtract(1, 'days')
        .startOf('day')
        .add(23, 'hour')
        .add(59, 'minutes')
        .add(59, 'second'),
      locale: {
        // format: "YYYY/MM/DD hh:mm A",
        format: 'DD MMM YYYY hh:mm:ss A',
        customRangeLabel: $.i18n.t('common:timeRange.customRange'),
      },
      ranges: {
        [$.i18n.t('common:timeRange.Today')]: [
          window.moment().startOf('day').subtract(1, 'days'),
          window.moment().subtract(1, 'days').endOf('day'),
        ],
        [$.i18n.t('common:timeRange.Yesterday')]: [
          window.moment().subtract(2, 'days').startOf('day'),
          window.moment().subtract(2, 'days').endOf('day'),
        ],
        [$.i18n.t('common:timeRange.lastSevenDays')]: [
          window.moment().subtract(6, 'days').startOf('day'),
          window.moment().endOf('day'),
        ],
        [$.i18n.t('common:timeRange.lastThirtyDays')]: [
          window.moment().subtract(29, 'days').startOf('day'),
          window.moment().endOf('day'),
        ],
        [$.i18n.t('common:timeRange.thisMonth')]: [
          window.moment().startOf('month'),
          window.moment().endOf('month'),
        ],
        [$.i18n.t('common:timeRange.lastMonth')]: [
          window.moment().subtract(1, 'month').startOf('month'),
          window.moment().subtract(1, 'month').endOf('month'),
        ],
      },
    });
  } else {
    $('#receipt_fromdateButton').daterangepicker({
      timePicker: true,
      timePickerSeconds: true,
      maxDate: window.moment().endOf('day'),
      startDate: window.moment().startOf('day'),
      endDate: window
        .moment()
        .startOf('day')
        .add(23, 'hour')
        .add(59, 'minutes')
        .add(59, 'second'),
      locale: {
        // format: "YYYY/MM/DD hh:mm A",
        format: 'DD MMM YYYY hh:mm:ss A',
        customRangeLabel: $.i18n.t('common:timeRange.customRange'),
      },
      ranges: {
        [$.i18n.t('common:timeRange.Today')]: [
          window.moment().startOf('day'),
          window.moment().endOf('day'),
        ],
        [$.i18n.t('common:timeRange.Yesterday')]: [
          window.moment().subtract(1, 'days').startOf('day'),
          window.moment().subtract(1, 'days').endOf('day'),
        ],
        [$.i18n.t('common:timeRange.lastSevenDays')]: [
          window.moment().subtract(6, 'days').startOf('day'),
          window.moment().endOf('day'),
        ],
        [$.i18n.t('common:timeRange.lastThirtyDays')]: [
          window.moment().subtract(29, 'days').startOf('day'),
          window.moment().endOf('day'),
        ],
        [$.i18n.t('common:timeRange.thisMonth')]: [
          window.moment().startOf('month'),
          window.moment().endOf('month'),
        ],
        [$.i18n.t('common:timeRange.lastMonth')]: [
          window.moment().subtract(1, 'month').startOf('month'),
          window.moment().subtract(1, 'month').endOf('month'),
        ],
      },
    });
  }
  $('#receipt_fromdateButton').on('apply.daterangepicker', (ev, picker) => {
    // fromDate = picker.startDate.format('YYYY-MM-DD');
    // toDate = picker.endDate.format('YYYY-MM-DD');
    fromDate = window.moment(picker.startDate).format('x');
    toDate = window.moment(picker.endDate).format('x');
    const isStartDaycheckChecked = $(
      '#fetchReceiptDataasperclosedayCheckid',
    ).is(':checked');
    if (fetchReportAsPerCloseDay && isStartDaycheckChecked) {
      const fromToDateresult = getFromAndToDateForReportsAsPerCloseDay({
        fromDate,
        toDate,
      });
      if (fromToDateresult.fromDate) {
        fromDate = fromToDateresult.fromDate;
      }

      if (fromToDateresult.toDate) {
        toDate = fromToDateresult.toDate;
      }
    }
  });

  $('#previewreceiptbillButton').on('click', () => {
    showReceiptpreview(true);
  });

  $('#clearSelectionbutton').on('click', () => {
    clearSelection();
  });

  $('#receiptprintButton').on('click', () => {
    printReceipt();
  });

  $('#allbillsButton').on('click', function () {
    selectedCharges = [];
    discountHistory = [];
    const type = {
      fromDate: undefined,
      toDate: undefined,
      showoldbillFirst: $('#receiptshowoldbillfirstCheckid').is(':checked'),
    };
    if (!window.__IS_MASTER_POS__) {
      Object.assign(type, {
        user_id: window.storeDetails.username,
      });
      if (window.showAllUserReport) {
        delete type.user_id;
      }
    }
    fetchBillby(type);
    addSelectedfilterindicator(this);
  });

  $('#todaysbillsButton').on('click', function () {
    selectedCharges = [];
    discountHistory = [];
    const cresult = setDateForgettingMidnightReport();

    const isStartDaycheckChecked = $(
      '#fetchReceiptDataasperclosedayCheckid',
    ).is(':checked');
    if (countMidnightSale && cresult) {
      fromDate = window.moment().subtract(1, 'days').startOf('day').format('x');
      toDate = window.moment().subtract(1, 'days').endOf('day').format('x');
    } else if (fetchReportAsPerCloseDay && isStartDaycheckChecked) {
      const fromToDateresult = getFromAndToDateForReportsAsPerCloseDay({
        fromDate,
        toDate,
      });
      if (fromToDateresult.fromDate) {
        fromDate = fromToDateresult.fromDate;
      }
      if (fromToDateresult.toDate) {
        toDate = fromToDateresult.toDate;
      }
    } else {
      fromDate = window.moment().startOf('day').format('x');
      toDate = window.moment().endOf('day').format('x');
    }

    const type = {
      fromDate,
      toDate,
      showoldbillFirst: $('#receiptshowoldbillfirstCheckid').is(':checked'),
    };
    if (!window.__IS_MASTER_POS__) {
      Object.assign(type, {
        user_id: window.storeDetails.username,
      });
      if (window.showAllUserReport) {
        delete type.user_id;
      }
    }
    fetchBillby(type);
    addSelectedfilterindicator(this);
  });

  $('#syncBillbutton').on('click', () => {
    syncBills();
  });

  $('#resyncBillbuttonid').on('click', () => {
    resyncBills();
  });

  $('#editbillButton').on('click', () => {
    showEditwindow();
  });

  $('#modifybillButton').on('click', () => {
    showModifyBillwindow();
  });

  $('#reverseInventoryButton').on('click', () => {
    showReverseInventorywindow();
  });

  $('#todaysreportbutton').on('click', () => {
    selectedCharges = [];
    discountHistory = [];
    $(`#receiptTable tr.order-row`).removeClass('selectedbillRow selected');

    const cresult = setDateForgettingMidnightReport();
    const isStartDaycheckChecked = $(
      '#fetchReceiptDataasperclosedayCheckid',
    ).is(':checked');
    if (countMidnightSale && cresult) {
      fromDate = window.moment().subtract(1, 'days').startOf('day').format('x');
      toDate = window.moment().subtract(1, 'days').endOf('day').format('x');
    } else if (fetchReportAsPerCloseDay && isStartDaycheckChecked) {
      const fromToDateresult = getFromAndToDateForReportsAsPerCloseDay({
        fromDate,
        toDate,
      });
      if (fromToDateresult.fromDate) {
        fromDate = fromToDateresult.fromDate;
      }
      if (fromToDateresult.toDate) {
        toDate = fromToDateresult.toDate;
      }
    } else if (!fromDate) {
      fromDate = window.moment().startOf('day').format('x');
      toDate = window.moment().endOf('day').format('x');
    }

    const type = {
      report: true,
      // showSolditems: true,
      showPendingbills: true,
      fromDate,
      toDate,
      showCategoryData,
      showSolditems,
      showExpenseData,
      showWaiterData,
      showDiscountData,
      showDeliveryBoyData,
      showCancelleditems,
      showDuePaymentData,
      showWalletData,
      showKDWiseItemsData,
      showDuePaymentReceivableData,
      // showoldbillFirst: $('#receiptshowoldbillfirstCheckid').is(':checked')
    };
    if (!window.__IS_MASTER_POS__) {
      Object.assign(type, {
        user_id: window.storeDetails.username,
      });
      if (window.showAllUserReport) {
        delete type.user_id;
      }
    }
    fetchBillby(type);
  });

  $('#receipt_fetchbillsButton').on('click', () => {
    if (!fromDate) {
      const cresult = setDateForgettingMidnightReport();
      const isStartDaycheckChecked = $(
        '#fetchReceiptDataasperclosedayCheckid',
      ).is(':checked');
      if (countMidnightSale && cresult) {
        fromDate = window
          .moment()
          .subtract(1, 'days')
          .startOf('day')
          .format('x');
        toDate = window.moment().subtract(1, 'days').endOf('day').format('x');
      } else if (fetchReportAsPerCloseDay && isStartDaycheckChecked) {
        const fromToDateresult = getFromAndToDateForReportsAsPerCloseDay({
          fromDate,
          toDate,
        });

        if (fromToDateresult.fromDate) {
          fromDate = fromToDateresult.fromDate;
        }
        if (fromToDateresult.toDate) {
          toDate = fromToDateresult.toDate;
        }
      } else {
        fromDate = window.moment().startOf('day').format('x');
        toDate = window.moment().endOf('day').format('x');
      }
    }

    const type = {
      fromDate,
      toDate,
      showoldbillFirst: $('#receiptshowoldbillfirstCheckid').is(':checked'),
    };
    if (!window.__IS_MASTER_POS__) {
      Object.assign(type, {
        user_id: window.storeDetails.username,
      });
      if (window.showAllUserReport) {
        delete type.user_id;
      }
    }
    selectedCharges = [];
    discountHistory = [];
    showLoader({
      title: $.i18n.t('controller:orderController.Fetchingbills'),
      text: $.i18n.t('controller:orderController.pleaseWait'),
    });
    fetchBillby(type);
  });

  $('#receiptTable').on('click', 'tr.order-row', function (e) {
    e.stopPropagation();
    // const selectedBills = $('#receiptTable')
    //   .DataTable()
    //   .rows('.selected')
    //   .data();
    $(`#receiptTable tr.order-row`).removeClass('selectedbillRow selected');

    if (!$(this).hasClass('selectedbillRow')) {
      $(this).addClass('selectedbillRow selected');
      // initAccesslevelsforreceipts()
      const hasBillid = $(this).attr('id');
      let currentBilldetails = getSelectedBill();
      // eslint-disable-next-line prefer-destructuring
      currentBilldetails = currentBilldetails[0];
      if (currentBilldetails && hasBillid) {
        let currentBillamount = currentBilldetails.order_total;
        // let currentBillamount = $(this).find("td:nth-child(10)").html();
        if (currentBillamount !== undefined) {
          if (window.DO_BILL_ROUNDOFF) {
            try {
              // currentBillamount = Math.round(Number(currentBillamount));
              if (currentBilldetails?.extra_details?.roundedAmount) {
                // currentBillamount = Math.round(Number(currentBillamount));
                if (window.ROUNDING_INCREMENT) {
                  currentBillamount = roundToStep(
                    currentBillamount,
                    window.ROUNDING_INCREMENT,
                    window.ROUNDOFF_UPTO,
                  );
                } else if (window.ROUNDOFF_UPTO === '3') {
                  currentBillamount = roundOffLastDigit(
                    Number(currentBillamount),
                  );
                } else {
                  currentBillamount = Math.round(Number(currentBillamount));
                }
              }
            } catch (error) {
              console.error(error);
            }
          }
          $('#receiptGrandlabelid').html(
            Number(currentBillamount).toFixed(window.ROUNDOFF_UPTO),
          );
        }
        getBillitemdetails({
          order_id: hasBillid,
          is_pre_order: currentBilldetails.is_pre_order,
        });
      }
    } else {
      $(this).removeClass('selectedbillRow selected');
    }
    onSelectrowchange();
  });

  $('#receiptapplypaymentButton').on('click', () => {
    updatereceiptPayment();
  });

  initializeDataTable([]);

  let type;
  if (countMidnightSale && result) {
    type = {
      fromDate: window.moment().subtract(1, 'days').startOf('day').format('x'),
      toDate: window.moment().subtract(1, 'days').endOf('day').format('x'),
      showoldbillFirst: $('#receiptshowoldbillfirstCheckid').is(':checked'),
    };
    if (!window.__IS_MASTER_POS__) {
      Object.assign(type, {
        user_id: window.storeDetails.username,
      });
      if (window.showAllUserReport) {
        delete type.user_id;
      }
    }
  } else {
    fromDate = window.moment().startOf('day').format('x');
    toDate = window.moment().endOf('day').format('x');
    const isStartDaycheckChecked = $(
      '#fetchReceiptDataasperclosedayCheckid',
    ).is(':checked');
    if (fetchReportAsPerCloseDay && isStartDaycheckChecked) {
      const fromToDateresult = getFromAndToDateForReportsAsPerCloseDay({
        fromDate,
        toDate,
      });
      if (fromToDateresult.fromDate) {
        fromDate = Number(fromToDateresult.fromDate);
      }
      if (fromToDateresult.toDate) {
        toDate = Number(fromToDateresult.toDate);
      }
    }
    type = {
      fromDate,
      toDate,
      showoldbillFirst: $('#receiptshowoldbillfirstCheckid').is(':checked'),
    };
    if (!window.__IS_MASTER_POS__) {
      Object.assign(type, {
        user_id: window.storeDetails.username,
      });
      if (window.showAllUserReport) {
        delete type.user_id;
      }
    }
  }
  $('#receipt_searchBill').keyup(function () {
    $('#receiptTable').DataTable().search($(this).val()).draw();
  });

  fetchBillby(type);
  // $('#receiptactionsModalbodyid').load('PaymentnstatusModal.html', () => {
  //   initAccesslevelsforreceipts();
  // });

  $('#receiptactionsModalbodyid').load('NewPaymentStatusModal.html', () => {
    initAccesslevelsforreceipts();
  });

  // Add check
  $('#selectallreceiptBillcheck').on('click', function () {
    selectallBills($(this).is(':checked'));
  });
  $('#receiptshowoldbillfirstCheckid').on('click', function () {
    let fromDate = window.moment().startOf('day').format('x');
    let toDate = window.moment().endOf('day').format('x');
    const isStartDaycheckChecked = $(
      '#fetchReceiptDataasperclosedayCheckid',
    ).is(':checked');
    if (fetchReportAsPerCloseDay && isStartDaycheckChecked) {
      const fromToDateresult = getFromAndToDateForReportsAsPerCloseDay({
        fromDate,
        toDate,
      });
      if (fromToDateresult.fromDate) {
        fromDate = fromToDateresult.fromDate;
      }
      if (fromToDateresult.toDate) {
        toDate = fromToDateresult.toDate;
      }
    }
    const params = {
      fromDate,
      toDate,
      showoldbillFirst: $(this).is(':checked'),
    };
    if (!window.__IS_MASTER_POS__) {
      Object.assign(params, {
        user_id: window.storeDetails.username,
      });
    }
    fetchBillby(params);
  });
  $('#reduceinvreportbutton').on('click', () => {
    reduceMultipleinventory();
  });

  $('#exportTallyReportbutton').on('click', () => {
    exportTallyReport();
  });

  $('#generateIRNButtonId').on('click', () => {
    generateIRN();
  });

  const extra_info = safeParse(window.storeDetails?.extra_info);
  if (extra_info?.isHBIntegrate) {
    $('#generateIRNButtonId').show();
  } else {
    $('#generateIRNButtonId').hide();
  }
  initializeReceiptpermissions();
  if ($.i18n) {
    initializei18nforReceiptwindowui();
  } else {
    setTimeout(initializei18nforReceiptwindowui, 400);
  }

  $('#receiptTable').on('page.dt', () => {
    clearSelection();
  });
}

window.refreshReceiptwindowfromremote = refreshReceiptwindow;
Initialize();
