/* eslint-disable no-loop-func */
/* eslint-disable no-unused-expressions */
/* eslint-disable eqeqeq */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-plusplus */
/* eslint-disable array-callback-return */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable no-undef */
/* eslint-disable camelcase */
const QRCodenew = require('qrcode');
const JsBarcode = require('jsbarcode');
// const NepaliDate = require('nepali-date-converter');
const { default: NepaliDate } = require('nepali-date-converter');
const isObject = require('lodash/isObject');
const { sortBy, cloneDeep } = require('lodash');
const { Tag } = require('../zatca/tags');
const { numberTowords, sleep } = require('../util/MiscUtil');
const { maskString, getOrderlevelinstructions } = require('../util/MiscUtil');
const {
  TABLEFOR_PREVIEW,
  TABLEFOR_PREVIEW_IN_BOTH_LANG,
} = require('./RawButtons');

window.previewscriptLoaded = true;
const {
  SHOWNOTE_ON_BILLPRINT,
  SHOW_CUSTOMERGST_ON_BILL_CHECK,
  SHOW_CUSTOMERAMTPAID_ONBILL,
  SHOW_WAITER_ONBILL,
  SHOW_DATEANDTIME_ONBILL,
  SHOW_USERNAMEON_BILL,
  SHOW_ITEMHSNCODE_ON_BILL,
  SHOW_CUSTOM_BILL_NUMBER,
  SHOW_CAPTAIN_ON_BILL,
  SHOW_BILL_PRINT_COUNT_ONRECEIPT,
  SHOW_INVOICE_QR_ONBILL,
  SHOW_CUSTOM_QRS_ONBILL,
  SHOW_ZATCA_INVOICEQR,
  SHOW_CHARGESTAX_ONBILL,
  SHOW_DISCOUNTREASON_ONBILL,
  SEPERATE_BILLING_FOR_OL_ORDER,
  SHOW_BRAND_NAME_ON_BILL,
  SHOW_KOT_NUMBER_ON_BILL,
  SHOW_PAYMENT_MODE_ON,
  SHOW_TABLE_NAME_ON,
  SHOW_ORDER_TYPE_ON,
  SHOW_ITEM_CHARGES_SEPERATELY,
  SHOW_COVERS_ON_BILL,
  SHOW_ALTERNATE_TITLE_ON_BILL_PRINT,
  SHOW_TRANSLATIONS_IN_BOTH_LANGUAGES,
  SHOW_OUTLET_NAME_ON_BILL,
  SHOW_ALTERNATIVE_OUTLET_NAME_ON_BILL,
  SHOW_ITEM_SERIAL_NUMBER_ON_BILL_PRINT,
  SHOW_DEFAULT_ITEMTITLE_ONLY_FOR_MODIFIER_ITEM_ON_BILL,
  SHOW_BASE_ITEM_ONLY_ON_BILL_PRINT,
  SHOW_CUSTOMER_ADDRESS_ON_PICKUP_BILL,
  SHOW_ORDER_PLACED_TIME_ON_BILL,
  BILL_PRINT_ITEM_DETAIL_COLUMNS,
  HIDE_TOTAL_WHITOUT_TAX_ON_BILL_PRINT,
  DRAFT_BILL_SHOW_PAYMENT_MODE,
  DRAFT_BILL_SHOW_BILL_NUMBER,
  DRAFT_BILL_SHOW_ZATCA_QR,
  DRAFT_BILL_SHOW_ORDER_NUMBER,
  DRAFT_BILL_SHOW_ORDER_ID,
  DRAFT_BILL_SHOW_BRAND_NAME,
  DRAFT_BILL_SHOW_OUTLTE_NAME,
  DRAFT_BILL_SHOW_ALTERNATIVE_OUTLET_NAME,
  DRAFT_BILL_SHOW_LOGO,
  DRAFT_BILL_TAX_NUMNER,
  SHOW_ORDER_ID_BARCODE_ON_BILL_PRINT,
  SHOW_CHANNEL_RESTAURANT_NAME_ON_BILL_PRINT,
  SHOW_JORDAN_E_INVOIC_QR,
} = require('../util/SettingIDs');
const { tagsToBase64, ZATCA_TAGS } = require('../zatca/utils');
const {
  ITEM_TAX_TYPES,
  SALUTATIONS_VALUES,
  KEETA_BILLING_FLAG,
} = require('../util/Constants');
const {
  orderCalculations,
  calculateTaxForItem,
  roundToStep,
} = require('./calculations');

const {
  BillingTypes,
  ARABIC_BIILING_TYPES_BYNAME,
  ARABIC_PAYMENT_MODES,
  ARABIC_BIILING_TYPES_BYID,
  OnlineOrderBillingTypesByNumber,
  BILLINGTYPES_MAP,
  OrderTypes,
  OnlineBillingTypeByName,
} = require('../util/DBUtil');
const { generateBharatpeQR, generatePhonepeQR } = require('./BharatPe');
const { initalizei18nforpreviewWindow } = require('./i18nController');
const { safeParse } = require('../util/RendererUtils');
const { TAX_CALCULATION_ON } = require('../constant/tax');
const { generateZatcaQR, generateJoranEInvoiceQR } = require('./Zatca');
const { waitForRender } = require('../renderer/utils');

let isbharatpeConfigured = false;
let isPhonePeConfigured = false;

const stringConstructor = 'test'.constructor;
let showbillprintCount = false;
let showCustomergstonbill = false;
let showcustomerpaidAmount = false;
let showWaiternameonbill = false;
let showCaptainnameonbill = false;
let showdatentimeonBill = true;
let showusernameonBill = true;
let showitemhsncodeonBill = false;
let showcustombillnumber = false;
let showinvoiceqronBill = false;
let showcustomqsronBill = false;
let showzatcaeinvoiceQrcode = true;
let showJordanEinvoiceQrcode = false;
let arabqrcodeinfoObject = {};
const maskSize = 4;
let billlabelTitle = $.i18n.t('controller:previewController.billNo');
let kotLabelTitle = $.i18n.t('controller:previewController.KOTNo');
let showtaxOnChargeOnBill = false;
let showDiscountreasonifapplied = false;
// paymodeId payment_mode
let showitemnoteonBill = false;
let seperateBillNumber = false;
let showBrandName = false;
let showAlternativeOutletTitleonBill = false;
let showOutletName = false;
let showKotNumbers = false;
let showPaymentModeOnDine = false;
let showPaymentModeOnTakeaway = false;
let showPaymentModeOnDelivery = false;
let showPaymentModeOnQuickBill = false;
let showTableNameOnDine = false;
let showTableNameOnTakeaway = false;
let showTableNameOnDelivery = false;
let showTableNameOnQuickBill = false;
let showOrderTypeOnDine = false;
let showOrderTypeOnTakeaway = false;
let showOrderTypeOnDelivery = false;
let showOrderTypeOnQuickBill = false;
let showItemlevelchargesSeperately = false;
let showAlternatetitleonbill = false;
let showSRNumberOnBillPrint = false;
let showDefaltItemTitleForModifierItem = false;
let showBaseItemOnlyForModifierItems = false;
let showCustomerAddressOnPickupBill = true;
let showOrderTimeOnBill = false;
let itemDetailsColumns = {};
const useoldprintPreviewmethod = true;
let showCoversonbill = false;
let showTranslationInBothLanguage = false;
let bill_number_length = 0;
window.isPrintingInprogress = false;
let MULTI_TAX = false;
let hideTotalWithoutTax = false;
let showOrderIdBarcode = false;

// draft bill print settings

let showPaymentModeOnDraftBillPrint = false;
let showBillNumberOnDraftBillPrint = false;
let showZatcaQrOnDraftBillPrint = false;
let showOrderNumberOnDraftBillPrint = false;
let showOrderIdOnDraftBillPrint = false;
let showBrandNameOnDraftBillPrint = false;
let showOutletNameOnDraftBillPrint = false;
let showChannelRestaurantName = false;
let showAlternateOutletNameOnDraftBillPrint = false;
let showLogoOnDraftBillPrint = false;
let showTaxNumberOnDraftBillPrint = false;

let printBillLockStartedAt = null;
const MAX_PRINTBILL_TIME = 10000; // 10 seconds

function isNumeric(value) {
  return !isNaN(value) && value !== null && value !== '';
}

function ensurePrintBillLockIsHealthy() {
  if (
    window.isPrintingInprogress &&
    printBillLockStartedAt &&
    Date.now() - printBillLockStartedAt > MAX_PRINTBILL_TIME
  ) {
    console.warn('⚠ print bill lock stuck. Auto-releasing...');
    window.isPrintingInprogress = false;
    printBillLockStartedAt = null;
  }
}

function getBharatpeStatus() {
  if (window.storeDetails && window.storeDetails.extra_info) {
    try {
      const extra_info = safeParse(window.storeDetails.extra_info);
      isbharatpeConfigured = extra_info && extra_info.bharatpe_integration;
      isPhonePeConfigured = extra_info && extra_info.phonepe_integration;
      // isbharatpeConfigured = true;
    } catch (error) {
      console.error(error);
    }
  }
}

async function setStoredetails(details) {
  if (window.storeDetails) {
    let showBrandNameOnPrint = false;
    if (showBrandName) {
      showBrandNameOnPrint = true;
    }

    if (details.isdraftBill && !showBrandNameOnDraftBillPrint) {
      showBrandNameOnPrint = false;
    }
    $('#brandnameID').hide();

    if (showBrandNameOnPrint) {
      const brandName = window.storeDetails?.brand_name || '';
      const outletName = window.storeDetails?.store_name || '';

      if (brandName && brandName.trim() !== outletName.trim()) {
        $('#brandnameID').show();
        $('#brandnameID').html(brandName);
      }
    }
    const english = /^[~`!@#$%^&*()_+=[\]\\{}|;':",.\/<>?a-zA-Z0-9- \n]+$/;
    let outletName = window.storeDetails.store_name;
    if (outletName) {
      const titleArray = outletName.split('');
      let foundFields = 0;
      for (let i = 0; i < titleArray.length; i++) {
        if (!english.test(titleArray[i])) {
          foundFields = i;
          break;
        }
      }

      if (foundFields) {
        const b = '\n';
        outletName = [
          outletName.slice(0, foundFields),
          b,
          outletName.slice(foundFields),
        ].join('');
      }
    }

    let showOutletNameOnPrint = false;
    if (showOutletName) {
      showOutletNameOnPrint = true;
    }

    if (details.isdraftBill && !showOutletNameOnDraftBillPrint) {
      showOutletNameOnPrint = false;
    }
    if (details.isdraftBill && showOutletNameOnDraftBillPrint) {
      showOutletNameOnPrint = true;
    }
    $('#hotelnameID').hide();
    if (showOutletNameOnPrint && outletName) {
      $('#hotelnameID').show();
      $('#hotelnameID').html(outletName);
    }

    let showAltetnativeOutletNameOnPrint = false;
    if (showAlternativeOutletTitleonBill) {
      showAltetnativeOutletNameOnPrint = true;
    }

    if (details.isdraftBill && !showAlternateOutletNameOnDraftBillPrint) {
      showAltetnativeOutletNameOnPrint = false;
    }

    if (details.isdraftBill && showAlternateOutletNameOnDraftBillPrint) {
      showAltetnativeOutletNameOnPrint = true;
    }
    $('#previewlternatehotelnameID').hide();
    if (
      showAltetnativeOutletNameOnPrint &&
      window.storeDetails.alternative_outlet_name
    ) {
      $('#previewlternatehotelnameID').show();
      $('#previewlternatehotelnameID').html(
        window.storeDetails.alternative_outlet_name
          ? window.storeDetails.alternative_outlet_name
          : '',
      );
    }

    if (showChannelRestaurantName && details.isOnlinebill) {
      if (
        details &&
        details.extra_details &&
        details.extra_details.channel_restaurant_name
      ) {
        $('#previewChannelRestaurantNameID').html(
          details.extra_details.channel_restaurant_name,
        );
      } else {
        $('#previewChannelRestaurantNameID').hide();
      }
    } else {
      $('#previewChannelRestaurantNameID').hide();
    }

    if (window.storeDetails.user_line_1) {
      $('#addressdivID').html(
        window.storeDetails.user_line_1 +
        (window.storeDetails.user_line_2
          ? window.storeDetails.user_line_2
          : ''),
      );
    }
    if (showusernameonBill && window.storeDetails.username) {
      $('#usernameLabelid').show();
      $('#usernameLabelid').html(
        `${$.i18n.t('controller:previewController.User')}  ${window.storeDetails.username
        }`,
      );
    } else {
      $('#usernameLabelid').hide();
    }

    if (window.storeDetails.footer_note && !window.billPrintFooters?.footer2) {
      $('#footerDivid').html(window.storeDetails.footer_note);
    } else {
      $('#footerDivid').html('');
    }

    if (window.storeDetails.show_phone_on_bill) {
      $('#storeContactlabelId').html(
        `${$.i18n.t('controller:previewController.contactNo')}  ${window.storeDetails.show_phone_on_bill
        }`,
      );
      $('#storeContactlabelId').show();
    } else {
      $('#storeContactlabelId').hide();
    }

    if (window.storeDetails.store_email) {
      $('#storeemailLabelid').html(
        `${$.i18n.t('controller:previewController.Email')} ${window.storeDetails.store_email
        }`,
      );
      $('#storeemailLabelid').show();
    } else {
      $('#storeemailLabelid').hide();
    }

    if (window.storeDetails.website) {
      $('#storewebsiteLabelid').html(
        `${$.i18n.t('controller:previewController.Website')}${window.storeDetails.website
        }`,
      );
      $('#storewebsiteLabelid').show();
    } else {
      $('#storewebsiteLabelid').hide();
    }

    if (window.storeDetails.note) {
      $('#storeinfonoteField').html(window.storeDetails.note);
      $('#storeinfonoteField').show();
    } else {
      $('#storeinfonoteField').hide();
    }
    let showHeader1 = true;
    let showHeader2 = true;
    let showHeader3 = true;
    let showHeader4 = true;
    let showHeader5 = true;
    let showHeader6 = true;

    if (
      window.darftBillHeaderSettings &&
      window.darftBillHeaderSettings.length
    ) {
      if (details.isdraftBill && !window.darftBillHeaderSettings.includes(1)) {
        showHeader1 = false;
      }
      if (details.isdraftBill && !window.darftBillHeaderSettings.includes(2)) {
        showHeader2 = false;
      }
      if (details.isdraftBill && !window.darftBillHeaderSettings.includes(3)) {
        showHeader3 = false;
      }
      if (details.isdraftBill && !window.darftBillHeaderSettings.includes(4)) {
        showHeader4 = false;
      }
      if (details.isdraftBill && !window.darftBillHeaderSettings.includes(5)) {
        showHeader5 = false;
      }
      if (details.isdraftBill && !window.darftBillHeaderSettings.includes(6)) {
        showHeader6 = false;
      }
    }

    if (
      showHeader1 &&
      window.billPrintHeaders &&
      window.billPrintHeaders?.header1
    ) {
      // window.storeDetails.field1
      $('#storeinfoField1').html(window.billPrintHeaders?.header1);
      $('#storeinfoField1').show();
    } else {
      $('#storeinfoField1').hide();
      if (showHeader1 && window.storeDetails.field1) {
        $('#storeinfoField1').html(window.storeDetails.field1);
        $('#storeinfoField1').show();
      } else {
        $('#storeinfoField1').hide();
      }
    }

    if (
      showHeader2 &&
      window.billPrintHeaders &&
      window.billPrintHeaders?.header2
    ) {
      $('#storeinfoField2').html(window.billPrintHeaders?.header2);
      $('#storeinfoField2').show();
    } else {
      $('#storeinfoField2').hide();
    }
    if (
      showHeader3 &&
      window.billPrintHeaders &&
      window.billPrintHeaders?.header3
    ) {
      $('#storeinfoField3').html(window.billPrintHeaders?.header3);
      $('#storeinfoField3').show();
    } else {
      $('#storeinfoField3').hide();
    }
    if (window.storeDetails.field4 && !window.billPrintHeaders?.header4) {
      $('#storeinfoField4').html(window.storeDetails.field4);
      $('#storeinfoField4').show();
    } else {
      $('#storeinfoField4').hide();
    }

    if (
      showHeader4 &&
      window.billPrintHeaders &&
      window.billPrintHeaders?.header4
    ) {
      $('#storeinfoHeaderField4').html(window.billPrintHeaders?.header4);
      $('#storeinfoHeaderField4').show();
    } else {
      $('#storeinfoHeaderField4').hide();
    }

    if (
      showHeader5 &&
      window.billPrintHeaders &&
      window.billPrintHeaders?.header5
    ) {
      $('#storeinfoField5').html(window.billPrintHeaders?.header5);
      $('#storeinfoField5').show();
    } else {
      $('#storeinfoField5').hide();
    }
    if (
      showHeader6 &&
      window.billPrintHeaders &&
      window.billPrintHeaders?.header6
    ) {
      $('#storeinfoField6').html(window.billPrintHeaders?.header6);
      $('#storeinfoField6').show();
    } else {
      $('#storeinfoField6').hide();
    }
    if (window.storeDetails.field5) {
      $('#storeinfoField7').html(
        `${$.i18n.t('controller:previewController.FSSAINo')}${window.storeDetails.field5
        }`,
      );
      $('#storeinfoField7').show();
    } else {
      $('#storeinfoField7').hide();
    }

    // set footers
    let showFooter1 = true;
    let showFooter2 = true;
    let showFooter3 = true;
    let showFooter4 = true;
    let showFooter5 = true;
    let showFooter6 = true;

    if (
      window.draftBillFooterSettings &&
      window.draftBillFooterSettings.length
    ) {
      if (details.isdraftBill && !window.draftBillFooterSettings.includes(1)) {
        showFooter1 = false;
      }
      if (details.isdraftBill && !window.draftBillFooterSettings.includes(2)) {
        showFooter2 = false;
      }
      if (details.isdraftBill && !window.draftBillFooterSettings.includes(3)) {
        showFooter3 = false;
      }
      if (details.isdraftBill && !window.draftBillFooterSettings.includes(4)) {
        showFooter4 = false;
      }
      if (details.isdraftBill && !window.draftBillFooterSettings.includes(5)) {
        showFooter5 = false;
      }
      if (details.isdraftBill && !window.draftBillFooterSettings.includes(6)) {
        showFooter6 = false;
      }
    }
    if (showFooter1 && window.billPrintFooters?.footer1) {
      // window.storeDetails.field1
      $('#billprintFooter1').html(window.billPrintFooters?.footer1);
      $('#billprintFooter1').show();
      $('#storeinfoField4').hide();
    } else {
      $('#billprintFooter1').hide();
    }

    if (
      showFooter2 &&
      window.billPrintFooters &&
      window.billPrintFooters?.footer2
    ) {
      // window.storeDetails.field1
      $('#billprintFooter2').html(window.billPrintFooters?.footer2);
      $('#billprintFooter2').show();
      $('#footerDivid').hide();
    } else {
      $('#billprintFooter2').hide();
    }

    if (
      showFooter3 &&
      window.billPrintFooters &&
      window.billPrintFooters?.footer3
    ) {
      // window.storeDetails.field1
      $('#billprintFooter3').html(window.billPrintFooters?.footer3);
      $('#billprintFooter3').show();
    } else {
      $('#billprintFooter3').hide();
    }

    if (
      showFooter4 &&
      window.billPrintFooters &&
      window.billPrintFooters?.footer4
    ) {
      // window.storeDetails.field1
      $('#billprintFooter4').html(window.billPrintFooters?.footer4);
      $('#billprintFooter4').show();
    } else {
      $('#billprintFooter4').hide();
    }

    if (
      showFooter5 &&
      window.billPrintFooters &&
      window.billPrintFooters?.footer5
    ) {
      // window.storeDetails.field1
      $('#billprintFooter5').html(window.billPrintFooters?.footer5);
      $('#billprintFooter5').show();
    } else {
      $('#billprintFooter5').hide();
    }

    if (
      showFooter6 &&
      window.billPrintFooters &&
      window.billPrintFooters?.footer6
    ) {
      // window.storeDetails.field1
      $('#billprintFooter6').html(window.billPrintFooters?.footer6);
      $('#billprintFooter6').show();
    } else {
      $('#billprintFooter6').hide();
    }
    await addCustomqrcodes();
  }
}

async function showinvoiceQrcode(order_id) {
  $('#invoiceebillQrcodeCanvascontainer').hide();
  if (showinvoiceqronBill && order_id) {
    $('#invoiceebillQrcodeCanvascontainer').show();
    const code = `https://backoffice.tmbill.com/ebill/${order_id}`;
    try {
      const dataimageUrl = await QRCodenew.toDataURL(code);
      $(`#invoiceebillQrcodeCanvasid`).attr('src', dataimageUrl);
    } catch (error) {
      console.log(error);
    }
  }
}

async function showirnQrcode(irnToken) {
  // $("#invoiceebillQrcodeCanvascontainer").hide();
  // if (showinvoiceqronBill && order_id) {
  $('#irnQrcodeCanvascontainer').show();
  // let code = `https://backoffice.tmbill.in/ebill/${order_id}`;
  try {
    const dataimageUrl = await QRCodenew.toDataURL(irnToken);
    $(`#irnQrcodeCanvasid`).attr('src', dataimageUrl);
  } catch (error) {
    console.log(error);
  }
  // }
}

async function showUpiqrcode(orderAmount, orderid) {
  console.log('generating UPI Qr orderid::', orderid);
  console.time('generating UPI Qr');
  $('#paymentQrcodeCanvascontainerid').hide();
  if (orderAmount) {
    // $('#paymentQrcodeCanvascontainerid').show();

    if (isbharatpeConfigured && orderAmount && orderid) {
      const bharatPeQRCode = await generateBharatpeQR({
        order_id: orderid,
        amount: orderAmount,
      });
      if (bharatPeQRCode) {
        const code = bharatPeQRCode;
        await addPaymentQRCOde(code);
      }
    } else if (isPhonePeConfigured && orderAmount && orderid) {
      const phonePeQRCode = await generatePhonepeQR({
        order_id: orderid,
        amount: orderAmount,
      });
      if (phonePeQRCode) {
        const code = phonePeQRCode;
        await addPaymentQRCOde(code);
      }
    } else if (window.storeDetails.upi_id) {
      let code = `upi://pay?pa=${window.storeDetails.upi_id}&pn=${window.storeDetails.store_name
        }&cu=${window.storeDetails.currency_code}&am=${orderAmount.toFixed(
          ROUNDOFF_UPTO,
        )}`;
      if (orderid) {
        code += `&tr=${orderid}`;
        // await addPaymentQRCOde(code);
      }
      await addPaymentQRCOde(code);
    }
    console.timeEnd('generating UPI Qr');
    // await addPaymentQRCOde(code);
  }
}

async function addPaymentQRCOde(code) {
  try {
    $('#paymentQrcodeCanvascontainerid').show();

    const dataimageUrl = await QRCodenew.toDataURL(code);
    $(`#paymentQrcodeCanvasid`).attr('src', dataimageUrl);
  } catch (error) {
    console.log(error);
  }
}

async function addZatcaQRCode(code) {
  try {
    $('#zatcaQrcodeCanvascontainer').show();

    const dataimageUrl = await QRCodenew.toDataURL(code);
    $(`#zatcaQrcodeCanvasid`).attr('src', dataimageUrl);
  } catch (error) {
    console.log(error);
  }
}

async function showZatcaQRCode({
  order_id,
  store_id,
  isOldbill,
  zatca_status,
  mpos_zatca_status,
}) {
  $('#zatcaQrcodeCanvascontainer').hide();

  if (isOldbill && zatca_status === 0 && order_id) {
    const zatcaQrCode = await generateZatcaQR({
      order_id,
      store_id,
    });
    if (zatcaQrCode) {
      $('#zatcaQrcodeCanvascontainer').hide();
      const code = zatcaQrCode;
      await addZatcaQRCode(code);
      window.clearSelectionFromRemote();
    }
  } else if (mpos_zatca_status && mpos_zatca_status.qr) {
    await addZatcaQRCode(mpos_zatca_status.qr);
  }
}

async function showJordanEinvoicingQRCode({
  order_id,
  store_id,
  isOldbill,
  zatca_status,
  mpos_zatca_status,
}) {
  $('#zatcaQrcodeCanvascontainer').hide();

  if (isOldbill && zatca_status === 0 && order_id) {
    const zatcaQrCode = await generateJoranEInvoiceQR({
      order_id,
      store_id,
    });
    if (zatcaQrCode) {
      $('#zatcaQrcodeCanvascontainer').hide();
      const code = zatcaQrCode;
      await addZatcaQRCode(code);
      window.clearSelectionFromRemote();
    }
  } else if (mpos_zatca_status && mpos_zatca_status.qr) {
    await addZatcaQRCode(mpos_zatca_status.qr);
  }
}
async function showOrderIdBarcodeOnBill({ id }) {
  $('#orderIdBarcodeCanvascontainer').show();

  if (id) {
    // const formattedOrderId = order_id.slice(-5);
    const code = `TM_${id}`;
    // const code = 'TM';

    JsBarcode('#orderidBarcodeCanvasid', code, {
      format: 'CODE128',
      width: 1, // adjust based on printer width
      height: 50,
      displayValue: false,
      margin: 0,
      fontSize: 5,
    });
  }
}

async function addCustomqrcodes() {
  $('#customqrcodeContainerid').empty();
  if (showcustomqsronBill && window.storeDetails.custom_qr_codes) {
    let customQrcodes = window.storeDetails.custom_qr_codes;
    if (customQrcodes.constructor === stringConstructor) {
      customQrcodes = JSON.parse(customQrcodes);
    }
    if (
      customQrcodes &&
      customQrcodes.qrcodes &&
      customQrcodes.qrcodes.length
    ) {
      try {
        for (code of customQrcodes.qrcodes) {
          const qrImagetitle = $('<label>', {
            html: code.title,
            class: 'scanqrTitle',
          });
          const dataimageUrl = await QRCodenew.toDataURL(code.content);
          const qrImageContent = $('<img>', { src: dataimageUrl });
          const customqrcontainer = $('<div>', { class: 'qrcodeContainer' })
            .append(qrImagetitle)
            .append(qrImageContent);
          $('#customqrcodeContainerid').append(customqrcontainer);
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
}

/**
 * Generates E-Invoice compatible QR for ZATCA,Tax authority
 */
async function showArabtaxinfoQrcode() {
  let formattedDate;
  if ($('#datelabelID').html()) {
    try {
      formattedDate = moment($('#datelabelID').html(), 'DD MMMM YYYY hh:mm A');
      formattedDate = formattedDate.format('YYYY-MM-DD hh:mm');
    } catch (error) {
      formattedDate = moment().format('YYYY-MM-DD hh:mm');
    }
  }
  if (showzatcaeinvoiceQrcode) {
    let gstNo;
    if (window.storeDetails && window.storeDetails.extra_info) {
      const extra_info = safeParse(window.storeDetails.extra_info);
      gstNo = extra_info && extra_info.gstNo;
    }
    const tags = [
      new Tag(ZATCA_TAGS.SELLER_NAME, window.storeDetails.store_name || ''),
      new Tag(ZATCA_TAGS.SELLER_TRN, gstNo || ''),
      new Tag(ZATCA_TAGS.INVOICE_DATE, formattedDate || ''),
      new Tag(
        ZATCA_TAGS.INVOICE_TOTAL,
        Number(arabqrcodeinfoObject.grandTotal || 0).toFixed(2),
      ),
      new Tag(
        ZATCA_TAGS.VAT_TOTAL,
        Number(arabqrcodeinfoObject.taxTotal || 0).toFixed(2),
      ),
    ];

    const qrcodeInfostring = tagsToBase64(tags);
    const dataimageUrl = await QRCodenew.toDataURL(qrcodeInfostring);
    const qrImageContent = $('<img>', { src: dataimageUrl });
    const qrImagetitle = $('<label>', {
      html: 'E-Invoicing QR',
      class: 'scanqrTitle',
    });
    const customqrcontainer = $('<div>', { class: 'qrcodeContainer' })
      .append(qrImagetitle)
      .append(qrImageContent);
    $('#customqrcodeContainerid').append(customqrcontainer);
  }
}

async function addPaymentmode(payment_modes) {
  if (payment_modes && Array.isArray(payment_modes) && payment_modes.length) {
    const paymentmodeContainerdiv = $('<div>');
    $('<div>', {
      html: `Split Payment Info :`,
    }).appendTo(paymentmodeContainerdiv);

    for (currentPaymode of payment_modes) {
      const currentPaymodecontainer = $('<div>', {
        class: 'pl-2 w-75',
        html: `${currentPaymode.payment_option} - ${currency} ${Number(currentPaymode.amount).toFixed(window.ROUNDOFF_UPTO)}`,
      });
      $(paymentmodeContainerdiv).append(currentPaymodecontainer);
    }
    $(`#previewmiscContainerid`).append(paymentmodeContainerdiv);
    $('#billpreviewcustomerpaidContainer').css('border', 'none');
  }
}

async function setCommonbilldetails(details) {
  // Set the pageConfig if provided
  if (details.pageConfig) {
    const rawmargins = String(details.pageConfig.margins).split(' ');
    $('#previewContainerid').css({
      'margin-left': rawmargins[0],
      width: rawmargins[1],
    });
  }

  let showLogoOnPrint = false;
  if (window.showhotelLogoonbill) {
    showLogoOnPrint = true;
  }

  if (details.isdraftBill && !showLogoOnDraftBillPrint) {
    showLogoOnPrint = false;
  }

  $('#hotellogoDivid').hide();
  if (window.hotelogoFilepath && showLogoOnPrint) {
    $('#hotellogoDivid').show();
    $('#hotellogoImage').attr('src', window.hotelogoFilepath);
  } else {
    $('#hotellogoDivid').hide();
  }

  if (window.selectedLanguage == 'ar') {
    if (details.payment_mode) {
      const arabic_paymode = ARABIC_PAYMENT_MODES[details.payment_mode];
      if (arabic_paymode) details.arabic_payment_mode = arabic_paymode;
    }

    if (details.tableName == 'Quick Bill') {
      details.arabic_quick_table_name = 'فاتورة سريعة';
    }
  }

  if (window.selectedLanguage == 'ar' || showTranslationInBothLanguage) {
    if (details.isOldbill) {
      details.arabic_order_type_flag =
        window.orderTypes[Number(details.billType)].altenative_title || '';
      // ARABIC_BIILING_TYPES_BYID[details.billType];
    } else {
      // details.arabic_order_type_flag =
      //   ARABIC_BIILING_TYPES_BYNAME[details.order_type_flag];
      const orderType = Object.values(window.orderTypes).find(
        (item) => item.order_type === details.order_type_flag,
      );
      const arabic_Order_type = orderType?.alternative_title;
      details.arabic_order_type_flag = arabic_Order_type;
      /// ARABIC_BIILING_TYPES_BYNAME[details.order_type_flag];
    }
    if (details.payment_mode) {
      const arabic_paymode = ARABIC_PAYMENT_MODES[details.payment_mode];
      if (arabic_paymode) details.arabic_payment_mode = arabic_paymode;
    }
  }

  // let formattedCurrentdate = moment(new Date()).format('DD MMMM YYYY hh:mm A');
  // $("#datelabelID").html(formattedCurrentdate);
  if (window.storeDetails.country === 'Nepal') {
    const formattedCurrentdate = window
      .moment(new Date())
      .format('DD MMMM YYYY hh:mm A');
    const date = new NepaliDate(new Date()).format('DD MMMM YYYY');
    const time = window.moment(new Date()).format('hh:mm A');
    const mitiDate = `${date} ${time}`;
    $('#datelabelID').html(`Date: ${formattedCurrentdate}`);
    $('#mitiDatelabelID').html(`MITI: ${mitiDate}`);
  } else {
    const formattedCurrentdate = window
      .moment(new Date())
      .format('DD MMMM YYYY hh:mm A');
    $('#datelabelID').html(formattedCurrentdate);
  }

  $('#oldbilllabelid').hide();
  console.log('details::', details);
  if (details.isOldbill && window.storeDetails.country == 'Nepal') {
    $('#oldbilllabelid').show();
    if (details.bill_status == 'cancelled') {
      $('#oldbilllabelid').html('Sales Return');
    } else {
      $('#oldbilllabelid').html(
        `Copy of Original ${details.print_status && details.print_status > 1
          ? details.print_status
          : ''
        }`,
      );
    }
  } else if (details.isOldbill) {
    $('#oldbilllabelid').show();
    $('#oldbilllabelid').html('Reprinted Bill');
  }

  if ((details.isOldbill || details.isOnlinebill) && details.customDate) {
    if (window.storeDetails.country == 'Nepal') {
      const formatdate = moment(details.customDate).format('YYYY MM DD');
      const time = moment(details.customDate).format('hh:mm A');
      const date = new NepaliDate(new Date(formatdate)).format('DD MMMM YYYY');
      const dateTime = `${date} ${time}`;
      $('#datelabelID').html(`Date: ${details.customDate}`);
      $('#mitiDatelabelID').html(`MITI: ${dateTime}`);
    } else {
      $('#datelabelID').html(details.customDate);
    }
  }
  // if ((details.isOldbill || details.isOnlinebill) && details.customDate) {
  //   $("#datelabelID").html(details.customDate);
  // }
  $('#datelabelID').css('display', showdatentimeonBill ? '' : 'none');

  await setStoredetails(details);

  if (showusernameonBill && details.createdBy && window.storeDetails.username) {
    $('#usernameLabelid').show();
    $('#usernameLabelid').html(
      `${$.i18n.t('controller:previewController.User')}  ${details.createdBy || window.storeDetails.username
      }`,
    );
  } else {
    $('#usernameLabelid').hide();
  }

  // if (
  //   (details.tableName &&
  //     (details.order_type_flag == 'Dine In' ||
  //       details.order_type_flag == 'Dine in') &&
  //     showTableNameOnDine) ||
  //   (details.isOldbill && details.billType == 1 && showTableNameOnDine)
  // ) {
  //   showTableName();
  // }

  // if (
  //   (details.order_type_flag == 'PickUp' && showTableNameOnTakeaway) ||
  //   (details.order_type_flag == 'Delivery' && showTableNameOnTakeaway) ||
  //   (details.isOldbill &&
  //     (details.billType == 2 || details.billType == 3) &&
  //     showTableNameOnTakeaway)
  // ) {
  //   showTableName();
  // }

  // if (
  //   (details.tableName == 'Quick Bill' && showTableNameOnQuickBill) ||
  //   (details.isOldbill && showTableNameOnQuickBill)
  // ) {
  //   showTableName();
  // }

  // if (details.tableName.includes('Digital') || details.isOnlinebill) {
  //   showTableName();
  // }

  // function showTableName() {
  //   $('#tablenameLabelid').show();
  //   $('#tablenameLabelid').html(
  //     `${$.i18n.t('controller:previewController.Table')}: ${details.tableName}`,
  //   );
  // }

  if (
    (details.tableName &&
      (details.order_type_flag == 'Dine In' ||
        details.order_type_flag == 'Dine in') &&
      showTableNameOnDine) ||
    (details.isOldbill && details.billType == 1 && showTableNameOnDine) ||
    ((details.order_type_flag == 'PickUp' ||
      details.order_type_flag == 'Pickup') &&
      showTableNameOnTakeaway) ||
    (details.order_type_flag == 'Delivery' && showTableNameOnDelivery) ||
    (details.isOldbill && details.billType == 2 && showTableNameOnTakeaway) ||
    (details.isOldbill && details.billType == 3 && showTableNameOnDelivery) ||
    (details.tableName == 'Quick Bill' && showTableNameOnQuickBill) ||
    (details.isOldbill && showTableNameOnQuickBill) ||
    // details.tableName == 'Digital Order' ||
    details.tableName?.includes('Digital') ||
    details.isOnlinebill
  ) {
    $('#tablenameLabelid').show();
    $('#tablenameLabelid').html(
      `${$.i18n.t('controller:previewController.Table')} ${details.tableName}`,
    );
  } else {
    $('#tablenameLabelid').hide();
  }

  // Check if the table name is same as the customer name
  if (
    (details.tableName &&
      details.customer &&
      details.customer.name &&
      details.customer.name === details.tableName &&
      (details.order_type_flag == 'Dine In' ||
        details.order_type_flag == 'Dine in') &&
      showTableNameOnDine) ||
    (details.isOldBill && details.billType == 1 && showTableNameOnDine) ||
    ((details.order_type_flag == 'PickUp' ||
      details.order_type_flag == 'Pickup') &&
      showTableNameOnTakeaway) ||
    (details.order_type_flag == 'Delivery' && showTableNameOnDelivery) ||
    (details.isOldbill && details.billType == 2 && showTableNameOnTakeaway) ||
    (details.isOldbill && details.billType == 3 && showTableNameOnDelivery) ||
    (details.tableName == 'Quick Bill' && showTableNameOnQuickBill) ||
    (details.isOldbill && showTableNameOnQuickBill) ||
    // details.tableName == 'Digital Order' ||
    details.tableName?.includes('Digital') ||
    details.isOnlinebill
  ) {
    if (
      selectedLanguage == 'ar' &&
      details.tableName == 'Quick Bill' &&
      details.arabic_quick_table_name
    ) {
      $('#tablenameLabelid').html(details.arabic_quick_table_name);
    } else {
      $('#tablenameLabelid').html(details.tableName);
    }
  }

  let showPaymentModeOnPrint = false;
  if (
    ((details.order_type_flag === 'Dine In' ||
      details.order_type_flag === 'Dine in') &&
      showPaymentModeOnDine) ||
    (details.isOldBill && details.billType == 1 && showPaymentModeOnDine)
  ) {
    showPaymentModeOnPrint = true;
  }

  if (
    ((details.order_type_flag === 'PickUp' ||
      details.order_type_flag === 'Pickup') &&
      showPaymentModeOnTakeaway) ||
    (details.order_type_flag === 'Delivery' && showPaymentModeOnDelivery) ||
    (details.isOldbill && details.billType == 2 && showPaymentModeOnTakeaway) ||
    (details.billType == 3 && showPaymentModeOnDelivery)
  ) {
    showPaymentModeOnPrint = true;
  }

  if (
    (details.tableName === 'Quick Bill' && showPaymentModeOnQuickBill) ||
    (details.isOldbill && showPaymentModeOnQuickBill)
  ) {
    showPaymentModeOnPrint = true;
  }

  if (details.tableName?.includes('Digital') || details.isOnlinebill) {
    showPaymentModeOnPrint = true;
  }

  if (details.isdraftBill && !showPaymentModeOnDraftBillPrint) {
    showPaymentModeOnPrint = false;
  }
  if (details.payment_mode === 'None') {
    showPaymentModeOnPrint = false;
  }

  if (
    details.paymentAdded &&
    details.payment_mode != undefined &&
    String(details.payment_mode).toLowerCase() !== 'split' &&
    showPaymentModeOnPrint
  ) {
    if (window.selectedLanguage == 'ar') {
      if (details.arabic_payment_mode) {
        $('#paymodeId').html(
          `${$.i18n.t('controller:previewController.payMode')} ${details.arabic_payment_mode
          }`,
        );
      } else {
        $('#paymodeId').html(
          `${$.i18n.t('controller:previewController.payMode')} ${details.payment_mode
          }`,
        );
      }
    } else {
      $('#paymodeId').html(
        `${$.i18n.t('controller:previewController.payMode')} ${details.payment_mode
        }`,
      );
    }
    $('#paymodeId').show();
    $('#draftBilllabelid').hide();
  } else {
    $('#paymodeId').hide();
  }

  function showPaymentMode() {
    if (window.selectedLanguage == 'ar') {
      if (details.arabic_payment_mode) {
        $('#paymodeId').html(
          `${$.i18n.t('controller:previewController.payMode')} ${details.arabic_payment_mode
          }`,
        );
      } else {
        $('#paymodeId').html(
          `${$.i18n.t('controller:previewController.payMode')} ${details.payment_mode
          }`,
        );
      }
    } else {
      $('#paymodeId').html(
        `${$.i18n.t('controller:previewController.payMode')} ${details.payment_mode
        }`,
      );
    }
    $('#paymodeId').show();
    $('#draftBilllabelid').hide();
  }

  // set order time
  if (showOrderTimeOnBill && details && details.kotcreatedAt) {
    $('#orderTimelabelid').show();
    const timeString = moment(details.kotcreatedAt).format('hh:mm A');
    $('#orderTimelabelid').html(`Order Placed Time: ${timeString}`);
  } else {
    $('#orderTimelabelid').hide();
  }
  if (details.isdraftBill) {
    // $("#draftBilllabelid").html($.i18n.t('controller:previewController.draftBill'));
    $('#draftBilllabelid').html('Customer Copy');
    $('#draftBilllabelid').show();
    if (details.paymentAdded && !showPaymentModeOnDraftBillPrint) {
      $('#paymodeId').hide();
    }
  } else {
    $('#draftBilllabelid').hide();
  }

  if (details.isOnlinebill) {
    $('#draftBilllabelid').hide();
  }

  if (
    details.isOldbill &&
    String(details.payment_mode).toLowerCase() !== 'split'
  ) {
    if (
      details.payment_mode &&
      ((details.billType == 1 && showPaymentModeOnDine) ||
        (details.billType == 2 && showPaymentModeOnTakeaway) ||
        (details.billType == 3 && showPaymentModeOnDelivery) ||
        (details.billType == 0 && showPaymentModeOnQuickBill) ||
        details.billType > 3)
    ) {
      $('#paymodeId').show();
      if (selectedLanguage == 'ar') {
        if (details.arabic_payment_mode) {
          $('#paymodeId').html(
            `${$.i18n.t('controller:previewController.payMode')} ${details.arabic_payment_mode
            }`,
          );
        } else {
          $('#paymodeId').html(
            `${$.i18n.t('controller:previewController.payMode')} ${details.payment_mode
            }`,
          );
        }
      } else {
        $('#paymodeId').html(
          `${$.i18n.t('controller:previewController.payMode')} ${details.payment_mode
          }`,
        );
      }
    } else {
      $('#paymodeId').hide();
    }

    // $('#oldbilllabelid').show();
    // $('#billstatuslabelid').html(`Bill Status: ${details.bill_status}`);
    // $('#draftBilllabelid').hide();
  } else {
    // $('#oldbilllabelid').hide();
    // $('#billstatuslabelid').hide();
  }

  if (details.isOldbill) {
    $('#oldbilllabelid').show();
    $('#billstatuslabelid').html(`Bill Status: ${details.bill_status}`);
    $('#draftBilllabelid').hide();
  } else {
    $('#oldbilllabelid').hide();
    $('#billstatuslabelid').hide();
  }
  if (!details.order_type_flag && details.billType) {
    // details.order_type_flag = OrderTypes[details.billType];
    details.order_type_flag =
      window.orderTypes[Number(details.billType)].order_type;
  }
  if (
    details.order_type_flag &&
    (details.order_type_flag == 'Dine In' ||
      details.order_type_flag == 'Dine in')
  ) {
    if (
      (details.order_type_flag &&
        (details.order_type_flag == 'Dine In' ||
          details.order_type_flag == 'Dine in') &&
        showOrderTypeOnDine) ||
      (details.isOldbill && details.billType == 1 && showOrderTypeOnDine)
    ) {
      showOrderType();
    } else {
      $('#ordertypeLabel').css('display', 'none');
    }
  }

  if (
    details.order_type_flag == 'PickUp' ||
    details.order_type_flag == 'Pickup'
  ) {
    if (
      ((details.order_type_flag == 'PickUp' ||
        details.order_type_flag == 'Pickup') &&
        showOrderTypeOnTakeaway) ||
      (details.isOldbill && details.billType == 2 && showOrderTypeOnTakeaway)
    ) {
      showOrderType();
    } else {
      $('#ordertypeLabel').css('display', 'none');
    }
  }

  if (details.order_type_flag == 'Delivery') {
    if (
      (details.order_type_flag == 'Delivery' && showOrderTypeOnDelivery) ||
      (details.isOldbill && details.billType == 3 && showOrderTypeOnDelivery)
    ) {
      showOrderType();
    } else {
      $('#ordertypeLabel').css('display', 'none');
    }
  }

  if (details.tableName == 'Quick Bill') {
    if (
      (details.tableName == 'Quick Bill' && showOrderTypeOnQuickBill) ||
      (details.isOldbill && showOrderTypeOnQuickBill)
    ) {
      showOrderType();
    } else {
      $('#ordertypeLabel').css('display', 'none');
    }
  }

  if (details.tableName?.includes('Digital') || details.isOnlinebill) {
    showOrderType();
  }
  if (details.isOnlinebill && details.billType === 104) {
    $('#ordertypeLabel').html('TMBill | ONDC');
  }

  if (details.billType && ![0, 1, 2, 3].includes(details.billType)) {
    showOrderType();
  }

  function showOrderType() {
    $('#ordertypeLabel').css('display', '');
    if (showTranslationInBothLanguage) {
      if (details.isOldbill) {
        $('#ordertypeLabel').html(
          `${window.orderTypes[Number(details.billType)].order_type} ${details.arabic_order_type_flag ? `| ${details.arabic_order_type_flag}` : ''}`, // BillingTypes[details.billType]
        );
      } else {
        $('#ordertypeLabel').html(
          `${details.order_type_flag} ${details.arabic_order_type_flag ? `| ${details.arabic_order_type_flag}` : ''}`,
        );
      }
    } else if (selectedLanguage == 'ar') {
      $('#ordertypeLabel').html(
        details.arabic_order_type_flag ? details.arabic_order_type_flag : '',
      );
    } else if (details.isOldbill) {
      $('#ordertypeLabel').html(
        window.orderTypes[Number(details.billType)].order_type,
      ); // BillingTypes[details.billType]
    } else {
      $('#ordertypeLabel').html(details.order_type_flag);
    }
  }

  // if (
  //   (details.order_type_flag &&
  //     (details.order_type_flag == 'Dine In' ||
  //       details.order_type_flag == 'Dine in') &&
  //     showOrderTypeOnDine) ||
  //   (details.isOldbill && details.billType == 1 && showOrderTypeOnDine) ||
  //   ((details.order_type_flag == 'PickUp' ||
  //     details.order_type_flag == 'Delivery') &&
  //     showOrderTypeOnTakeaway) ||
  //   (details.isOldbill &&
  //     (details.billType == 2 || details.billType == 3) &&
  //     showOrderTypeOnTakeaway) ||
  //   (details.tableName == 'Quick Bill' && showOrderTypeOnQuickBill) ||
  //   (details.isOldbill && showOrderTypeOnQuickBill) ||
  //   // details.tableName == 'Digital Order' ||
  //   details.tableName.includes('Digital') ||
  //   details.isOnlinebill
  // ) {
  //   $('#ordertypeLabel').css('display', '');

  //   if (selectedLanguage == 'ar') {
  //     $('#ordertypeLabel').html(details.arabic_order_type_flag);
  //   } else {
  //     if (details.isOldbill) {
  //       $('#ordertypeLabel').html(BillingTypes[details.billType]);
  //     } else {
  //       $('#ordertypeLabel').html(details.order_type_flag);
  //     }
  //   }
  // } else {
  //   $('#ordertypeLabel').css('display', 'none');
  // }

  if (details.delivery_boy_name) {
    $('#deliveryboyLabelid').show();

    let text = `DBoy: ${details.delivery_boy_name}`;

    if (details.deliveryboy_phone) {
      text += ` (${details.deliveryboy_phone})`;
    }

    $('#deliveryboyLabelid').html(text);
  } else {
    $('#deliveryboyLabelid').hide();
  }

  if (showWaiternameonbill && details.waiter) {
    $('#billprintWaiterlabelid').show();
    $('#billprintWaiterlabelid').html(
      `${$.i18n.t('controller:previewController.Waiter')} ${details.waiter}`,
    );
  } else {
    $('#billprintWaiterlabelid').hide();
  }
  if (showCoversonbill && details.persons) {
    $('#guestsonbilllabelid').show();
    $('#guestsonbilllabelid').html(
      `${$.i18n.t('controller:previewController.Guests')}: ${details.persons}`,
    );
  } else {
    $('#guestsonbilllabelid').hide();
  }

  if (
    showCaptainnameonbill &&
    details.createdBy &&
    window.storeDetails.username !== details.createdBy
  ) {
    $('#billprintCaptainlabelid').show();
    let captainName = details.createdBy;
    const captain = window.users.find((c) => c.username === details.createdBy);
    if (captain && captain.name) {
      captainName = captain.name;
    }
    $('#billprintCaptainlabelid').html(
      `${$.i18n.t('controller:previewController.Captain')} ${captainName}`,
    );
  } else {
    $('#billprintCaptainlabelid').hide();
  }

  if (details.showotponBill) {
    $('#orderOtplabelid').show();
    $('#orderOtplabelid').html(details.showotponBill);
  } else {
    $('#orderOtplabelid').hide();
  }

  if (details.deliveryBy) {
    $('#deliverybylabelId').show();
    $('#deliverybylabelId').html(details.deliveryBy);
  } else {
    $('#deliverybylabelId').hide();
  }

  if (details.showOnlineOrderOtpOnBill && details.otp) {
    $('#onlineOrderOTPidlabel').show();
    $('#onlineOrderOTPidlabel').html(`OTP: ${details.otp}`);
  } else {
    $('#onlineOrderOTPidlabel').hide();
  }

  // Check if store name is to be overriden
  if (details.overrideStorename) {
    $('#hotelnameID').html(details.overrideStorename);
  }

  // CHeck if pre-order
  $(`.preview-preorderinfo`).remove();
  $(`.preview-preorderdateinfo`).remove();
  if (details.customer && details.is_pre_order) {
    const preorderLabel = $('<div>', {
      html: $.i18n.t('controller:previewController.preOrder'),
      class: 'titleDiv preview-preorderinfo',
    });
    $(`#orderidlabel`).after(preorderLabel);
    const formattedPreDate = moment(details.pre_order_datetime).format(
      'DD MMMM YYYY hh:mm A',
    );
    const preorderDateLabel = $('<label>', {
      html: `Pre Order Date: ${formattedPreDate}`,
      class: 'titleDiv dateLabel preview-preorderdateinfo',
    });
    $(preorderLabel).after(preorderDateLabel);
    details.showCustomerinfo = true;
  }

  // show print count if provided
  $('#printcountLabelId').remove();
  if (showbillprintCount && details.printCount) {
    const printcountLabel = $('<div>', {
      html: `${$.i18n.t('controller:previewController.billCopyPrintCount')} ${details.printCount
        }`,
      class: 'grandtotalwordclass',
      id: 'printcountLabelId',
    });
    $(`#footerDivid`).after(printcountLabel);
  } else {
    $('#printcountLabelId').hide();
  }
}

function calculateTax({ tax_percent, inclusive, amount, is_devidable }) {
  let taxTotal = 0;
  let taxPerct = 0;

  const TEMP_ROUNDOFF_UPTO = Number(window.ROUNDOFF_UPTO || 1) + 1;

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

function renderTaxforNormalBilling(taxList) {
  if (taxList && taxList.length) {
    $('#taxlistContainerid').empty();

    taxList.forEach((tax) => {
      if (!tax.hideTaxOnBill) {
        if (!tax.taxDivided) {
          const taxlable = tax.tax_inclusive
            ? `${tax.name}(${tax.tax_percent} % Incl.): ${tax.amount.toFixed(window.ROUNDOFF_UPTO)}`
            : `${tax.name}(${tax.tax_percent} %): ${tax.amount.toFixed(window.ROUNDOFF_UPTO)}`;
          const mainTax = $('<div>', {
            text: taxlable,
          });
          $('#taxlistContainerid').append(mainTax);
        } else {
          const taxlable = tax.tax_inclusive
            ? `${tax.name}(${tax.tax_percent} % Incl.): ${tax.amount.toFixed(window.ROUNDOFF_UPTO)}`
            : `${tax.name}(${tax.tax_percent} %): ${tax.amount.toFixed(window.ROUNDOFF_UPTO)}`;
          const mainTax = $('<div>', {
            text: taxlable,
          });
          $('#taxlistContainerid').append(mainTax);
          if (window.storeDetails.country === 'India') {
            const splittax = tax.amount.toFixed(window.ROUNDOFF_UPTO) / 2;
            const splitPercent = Number(
              tax.tax_percent.toFixed(window.ROUNDOFF_UPTO) / 2,
            );
            const cgstlable = `CGST(${splitPercent}%): ${window.storeDetails.currency} ${splittax.toFixed(window.ROUNDOFF_UPTO)}`;
            const sgstlable = `SGST(${splitPercent}%): ${window.storeDetails.currency} ${splittax.toFixed(window.ROUNDOFF_UPTO)}`;

            const cgst = $('<div>', {
              text: cgstlable,
            });
            const sgst = $('<div>', {
              text: sgstlable,
            });
            $('#taxlistContainerid').append(cgst);
            $('#taxlistContainerid').append(sgst);
          }
        }
      }
    });
  }
}

function renderTaxforSectionwiseBilling(taxList) {
  if (taxList && taxList.length) {
    taxList.forEach((tax) => {
      if (!tax.hideTaxOnBill) {
        if (tax.taxDivided) {
          const label = tax.tax_inclusive
            ? `${tax.name} (${tax.tax_percent}% Incl.):  ${window.storeDetails.currency} ${tax.amount.toFixed(
              window.ROUNDOFF_UPTO,
            )} `
            : `${tax.name} (${tax.tax_percent}%):  ${window.storeDetails.currency} ${tax.amount.toFixed(
              window.ROUNDOFF_UPTO,
            )} `;
          const taxLabel = $('<label>', {
            html: label,
            class: 'preview-label-for-total',
          });
          $('#sectionsWrapperid').append(taxLabel);
          if (window.storeDetails.country === 'India') {
            const splittax =
              Number(tax.amount.toFixed(window.ROUNDOFF_UPTO)) / 2;
            const splitPercent =
              Number(tax.tax_percent.toFixed(window.ROUNDOFF_UPTO)) / 2;
            const cgstlabel = $('<label>', {
              html: `${$.i18n.t('controller:previewController.CGST')}
                      (${splitPercent} % ) : ${window.storeDetails.currency} ${splittax.toFixed(window.ROUNDOFF_UPTO)} `,
              class: 'preview-label-for-total',
            });
            const sgstlabel = $('<label>', {
              html: `${$.i18n.t(
                'controller:previewController.SGST',
              )} (${splitPercent} % ) : ${window.storeDetails.currency} ${splittax.toFixed(
                window.ROUNDOFF_UPTO,
              )} `,
              class: 'preview-label-for-total',
            });
            $('#sectionsWrapperid').append(cgstlabel);
            $('#sectionsWrapperid').append(sgstlabel);
          }
        } else {
          const label = tax.tax_inclusive
            ? `${tax.name} (${tax.tax_percent}% Incl.):  ${window.storeDetails.currency} ${tax.amount.toFixed(
              window.ROUNDOFF_UPTO,
            )} `
            : `${tax.name} (${tax.tax_percent}%):  ${window.storeDetails.currency} ${tax.amount.toFixed(
              window.ROUNDOFF_UPTO,
            )} `;
          const taxLabel = $('<label>', {
            html: label,
            class: 'preview-label-for-total',
          });
          $('#sectionsWrapperid').append(taxLabel);
        }
      }
    });
  }
}
/**
 * Show's preview of bill
 */
async function printPreviewold(details) {
  try {
    if (details) {
      console.log(
        `bill print for order_id=${details.bill_number}, bill_number=${details.order_id}, billing_type=${details.order_type_flag}`,
      );
    }
    window.isPrintingInprogress = true;

    const isbodyEmpty = $('body').hasClass('#previewContainer');
    if (!details || isbodyEmpty) {
      return;
    }
    await setCommonbilldetails(details);
    billlabelTitle = $.i18n.t('controller:previewController.billNo');
    if (details.custombilltitle) {
      billlabelTitle = details.custombilltitle;
    }
    if (details.customKotTitle) {
      kotLabelTitle = details.customKotTitle;
    }
    arabqrcodeinfoObject = {};
    let grandTotal = 0;
    let taxTotal = 0;
    const { discount } = details;
    const { discount_type } = details;
    const { couponDisountamt } = details;
    const { couponDisounttype } = details;
    let taxDivided = false;
    let taxInclusive = false;
    let taxMethod = details.tax_name;
    let istax_dividable = false;
    let hideTaxOnBill = false;
    let order_id = details.bill_number;
    const backuporder_id = details.bill_number;
    const bill_number = details.order_id;
    const kot_numbers = details.kot_numbers
      ? details.kot_numbers.join(', ')
      : '';

    const taxedProductgrps = {};
    if (details?.extra_details?.customOrderId) {
      order_id = details.extra_details.customOrderId;
    }
    const { currency } = window.storeDetails;

    // if(bill_number_length){
    //   bill_number = pad(bill_number, bill_number_length);
    // }

    let taxPercent = 0;
    let chargesamounttoExludefromtax = 0;
    let order_subtotal = 0;
    let recalculateTax = false;

    const allItemlevelcharges = [];
    let allitemsItemlevelchargesTotal = 0;
    let totalItemQuantity = 0;
    let totalTaxableAmount = 0;
    let order_level_discount = 0;
    let discountDiff;
    MULTI_TAX = false;

    $('#previewTable').find('tr:not(:first)').remove();
    $('#onlinetaxDivid').hide();
    $('#taxlistContainerid').empty();
    let index = 1;
    // details.items.forEach((item) => {
    for (let i = 0; i < details.items.length; i++) {
      const item = details.items[i];
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

      if (!MULTI_TAX && item.productGrptaxes && item.productGrptaxes.length) {
        const tax = item.productGrptaxes[0];
        if (tax && tax.extra_details) {
          hideTaxOnBill = tax?.extra_details?.hideTaxOnBill;
        }
      }

      item.amount = Number(item.amount);
      if (details.isOldbill && !details.isOnlinebill && item.total !== 0) {
        item.amount = Number(
          Number(item.price * item.quantity).toFixed(ROUNDOFF_UPTO),
        );
      }
      grandTotal += Number(item.amount);
      order_subtotal += Number(item.amount);
      recalculateTax = true;
      item.quantity = Number(item.quantity);
      totalItemQuantity += item.quantity;
      Object.assign(item, { recalculatedAmount: item.amount });
      if (item.amount !== 0) {
        taxTotal +=
          (item.isitemwithOption
            ? item.new_item_tax_value
            : item.item_tax_value) * item.quantity;
      }
      if (item.item_tax_per !== 0 && taxPercent === 0) {
        taxPercent = item.item_tax_per;
        taxMethod = item.item_tax_name || item.tax_name;
        taxDivided = item.item_is_devidable == 1;
        taxInclusive = item.item_tax_method == 1 || item.tax_method == 1;
      }

      let itemchargesTitles = '';
      if (
        // item.amount &&
        item.itemlevelCharges &&
        Array.isArray(item.itemlevelCharges) &&
        item.itemlevelCharges.length > 0
      ) {
        let itemlevelchargesTotal = 0;
        // eslint-disable-next-line no-restricted-syntax
        for (const charge of item.itemlevelCharges) {
          recalculateTax = true;
          let chargeAmount = charge.amount;
          charge.amount = Number(
            Number(charge.amount).toFixed(window.ROUNDOFF_UPTO),
          );
          const calculateChargeonamount = item.amount;

          if (charge.per_or_fixed == 1) {
            // chargeAmount = Number(((calculateChargeonamount * chargeAmount) / 100).toFixed(
            //   ROUNDOFF_UPTO
            // ));
            if (charge.extra_details) {
              const extra_details = JSON.parse(charge.extra_details);
              // extra_details = JSON.parse(extra_details);

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
                chargeAmount = Number(
                  ((calculateChargeonamount * chargeAmount) / 100).toFixed(
                    ROUNDOFF_UPTO,
                  ),
                );
              }
            } else {
              chargeAmount = Number(
                ((calculateChargeonamount * chargeAmount) / 100).toFixed(
                  ROUNDOFF_UPTO,
                ),
              );
            }
          } else {
            // if (details.isOnlinebill) {
            //   // chargeAmount = Number(chargeAmount);
            //   chargeAmount = Number(chargeAmount) * Number(item.quantity);
            // } else {
            chargeAmount = Number(chargeAmount) * Number(item.quantity);
            // }
          }
          chargeAmount = Number(Number(chargeAmount).toFixed(ROUNDOFF_UPTO));

          itemlevelchargesTotal += Number(chargeAmount);
          allitemsItemlevelchargesTotal += Number(chargeAmount);
          if (charge.calculate_tax_for_item_charges == 0) {
            chargesamounttoExludefromtax += Number(chargeAmount);
          } else {
            Object.assign(item, {
              recalculatedAmount: Number(item.amount) + Number(chargeAmount),
            });
          }
          let chargeName;
          if (charge.per_or_fixed == 1) {
            chargeName = `${charge.title} (${charge.amount}%)-${chargeAmount}`;
          } else {
            chargeName = `${charge.title}-${chargeAmount}`;
          }
          itemchargesTitles += `${chargeName}, \n`;

          let charge_Name = charge.title;

          // if bill type is not online order then add charge amount in bracket
          if ([0, 1, 2, 3, 8].includes(details.billType)) {
            charge_Name =
              charge.title +
              (charge.per_or_fixed == 1
                ? `(${charge.amount}%)`
                : `(${charge.amount})`);
          }
          const chargeDetail = {
            chargeName: charge_Name,
            chargeAmount: Number(chargeAmount),
          };
          allItemlevelcharges.push(chargeDetail);
        }
        grandTotal += itemlevelchargesTotal;
        order_subtotal += itemlevelchargesTotal;
      }
      addItem(
        item,
        index,
        itemchargesTitles,
        showitemnoteonBill,
        details.isOnlinebill,
      );
      index++;
    }

    // });

    const amountTotal = order_subtotal;
    istax_dividable = taxDivided;

    // $('<p style="page-break-before: always">').insertAfter("#previewTable");

    let showBillNumberOnPrint = false;
    if (window.showBillnoonbill) {
      showBillNumberOnPrint = true;
    }

    if (details.isdraftBill && !showBillNumberOnDraftBillPrint) {
      showBillNumberOnPrint = false;
    }

    $('#billnumberlabelid').html(``);
    if (bill_number && bill_number != 0 && showBillNumberOnPrint) {
      $('#billnumberlabelid').css('display', '');
      let bill_number_text = bill_number;
      if (showcustombillnumber) {
        if (seperateBillNumber) {
          if (details.custom_bill_number) {
            bill_number_text = details.custom_bill_number;
          } else if (details.isOnlinebill) {
            bill_number_text = `${global.storeDetails.secondary_bill_prefix || ''
              }${bill_number}`;
          }
        } else if (details.custom_bill_number) {
          bill_number_text = details.custom_bill_number;
        } else {
          bill_number_text = `${global.storeDetails.bill_number_prefix || ''
            }${bill_number}`;
        }
      }
      if (details.customBillname) {
        $('#billnumberlabelid').html(
          `${details.customBillname}:${bill_number_text}`,
        );
      } else {
        $('#billnumberlabelid').html(`${billlabelTitle} : ${bill_number_text}`);
      }
      Object.assign(arabqrcodeinfoObject, {
        bill_number: bill_number_text,
      });
    } else {
      $('#billnumberlabelid').css('display', 'none');
    }

    let showOrderNumberOnPrint = false;
    if (window.showOrdernoonbill) {
      showOrderNumberOnPrint = true;
    }

    if (details.isdraftBill && !showOrderNumberOnDraftBillPrint) {
      showOrderNumberOnPrint = false;
    }

    if (
      details.extra_details &&
      details.extra_details.order_number &&
      showOrderNumberOnPrint
    ) {
      $('#ordernumberlabelid').css('display', '');
      if (details.customOrderNumberName) {
        $('#ordernumberlabelid').html(
          `${details.customOrderNumberName}: ${details.extra_details.order_number}`,
        );
      } else {
        $('#ordernumberlabelid').html(
          `Order No: ${details.extra_details.order_number || ''}`,
        );
      }
    } else {
      $('#ordernumberlabelid').css('display', 'none');
    }

    if (kot_numbers && showKotNumbers) {
      $('#kotnumberlabelid').css('display', '');
      if (kot_numbers) {
        $('#kotnumberlabelid').html(`${kotLabelTitle}: ${kot_numbers}`);
      }
    } else {
      $('#kotnumberlabelid').css('display', 'none');
    }

    if (details.irnSignedQr) {
      showirnQrcode(details.irnSignedQr);
    } else {
      $('#irnQrcodeCanvascontainer').hide();
    }

    if (order_id) {
      await showinvoiceQrcode(order_id);
    }

    let showOrderIdOnPrint = false;
    if (window.showOrderidonbill) {
      showOrderIdOnPrint = true;
    }

    if (details.isdraftBill && !showOrderIdOnDraftBillPrint) {
      showOrderIdOnPrint = false;
    }

    if (order_id && showOrderIdOnPrint) {
      if (
        window.globalmaskOrderidinpreview &&
        String(order_id).length - maskSize > 0
      ) {
        const maskedResult = maskString(
          order_id,
          0,
          String(order_id).length - maskSize,
          '*',
        );
        if (maskedResult) {
          order_id = `${maskedResult.maskedString} ${maskedResult.remianingString}`;
        }
      }
      $('#orderidlabel').css('display', '');
      $('#orderidlabel').html(
        `${$.i18n.t('controller:previewController.OrderId')}: ${order_id}`,
      );

      if (details.irnNumber) {
        $('#irnNumberidlabel').css('display', '');
        $('#irnNumberidlabel').html(`IRN: ${details.irnNumber}`);
      } else {
        $('#irnNumberidlabel').css('display', 'none');
      }

      Object.assign(arabqrcodeinfoObject, {
        order_id,
      });
    } else {
      $('#orderidlabel').css('display', 'none');
      $('#invoiceebillQrcodeCanvascontainer').hide();
    }

    if (details.extra_details && details.extra_details.external_order_id) {
      $('#externalorderidlabel').css('display', '');
      $('#externalorderidlabel').html(
        `${$.i18n.t('controller:previewController.EXTERNAL_ORDER_ID')} ${details.extra_details.external_order_id}`,
      );
    } else {
      $('#externalorderidlabel').css('display', 'none');
    }

    if (details.extra_details && details.extra_details.picked_up_at) {
      $('#orderPickupedAtIdlabel').css('display', '');
      const formattedDate = window
        .moment(details.extra_details.picked_up_at)
        .format('DD MM yyyy hh:mm A');
      $('#orderPickupedAtIdlabel').html(`Pickuped At:  ${formattedDate}`);
    } else {
      $('#orderPickupedAtIdlabel').css('display', 'none');
    }

    // if (details.extra_details && details.extra_details.delivered_at) {
    //   $('#orderDeliveredAtIdlabel').css('display', '');
    //   const formattedDate = window
    //     .moment(details.extra_details.delivered_at)
    //     .format('DD MM yyyy hh:mm A');

    //   $('#orderDeliveredAtIdlabel').html(`Delivered At: ${formattedDate}`);
    // } else {
    //   $('#orderDeliveredAtIdlabel').css('display', 'none');
    // }
    if (details.extra_details && details.extra_details.parent_order_id) {
      $('#parentorderidlabel').css('display', '');
      $('#parentorderidlabel').html(
        `Parent Order ID: ${details.extra_details.parent_order_id}`,
      );
    } else {
      $('#parentorderidlabel').css('display', 'none');
    }

    if (
      details.extra_details &&
      details.extra_details.order_tags &&
      details.extra_details.order_tags.length
    ) {
      $('#onlineorderTagsContainerid').show();
      $('#onlineorderTagsContainerid').empty();
      details.extra_details.order_tags.forEach((tag) => {
        const tagLabel = $('<label>', {
          class: 'online-order-tags',
          html: tag.content,
        });
        $('#onlineorderTagsContainerid').append(tagLabel);
      });
    } else {
      $('#onlineorderTagsContainerid').hide();
    }

    // onlineorderTagsContainerid

    if (details.extdeliveryBoy) {
      $('#deliveryboyInfodivid').show();
      $('#deliveryboyInfolabelid').html(
        `${details.extdeliveryBoy.name} (${details.extdeliveryBoy.phone})`,
      );
    } else {
      $('#deliveryboyInfodivid').hide();
    }
    // if (grandTotal == 0) {
    //   $('#totaldivid').css('display', 'none');
    // } else {
    $('#totalAmountlabel').html(
      `${currency}  ${grandTotal.toFixed(ROUNDOFF_UPTO)}`,
    );
    $('#totaldivid').css('display', '');
    // }

    if (totalItemQuantity == 0) {
      $('#totalQtyDIvid').css('display', 'none');
    } else {
      $('#totalQtylabel').html(
        Number(totalItemQuantity.toFixed(window.ROUNDOFF_UPTO)),
      );
      $('#totalQtyDIvid').css('display', '');
    }

    let discountApplied = false;
    let coupondiscountApplied = false;

    if (!details.isOnlinebill && discount_type !== undefined && discount) {
      let discounttoApply = discount;
      if (discount_type == '1') {
        // discounttoApply = ((grandTotal * discount) / 100).toFixed(ROUNDOFF_UPTO);
        discounttoApply = ((order_subtotal * discount) / 100).toFixed(
          ROUNDOFF_UPTO,
        );
      }
      grandTotal = Number(grandTotal.toFixed(window.ROUNDOFF_UPTO));
      if (grandTotal >= discounttoApply) {
        discounttoApply = Number(discounttoApply);
        const DiscountTotalbeforeDistribution = discounttoApply;
        // if (!details.isOldbill) {
        //   grandTotal = grandTotal - discounttoApply;
        // }
        discountApplied = true;
        details.discounttoApply = discounttoApply;

        const splittedDiscountamount = Number(
          discounttoApply / (order_subtotal - chargesamounttoExludefromtax),
        );
        details.items.map((item) => {
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
        details.discounttoApply = order_level_discount;
        // details.discounttoApply = discounttoApply;
        discounttoApply = order_level_discount;
        // if (!details.isOldbill) {
        grandTotal -= discounttoApply;
        discounttoApply = discounttoApply.toFixed(window.ROUNDOFF_UPTO);

        // check if there is any difference after discount distribution on item level
        discountDiff =
          Number(DiscountTotalbeforeDistribution) -
          Number(DiscountTotalAfterDistribution);
        if (discountDiff) {
          details.items.map((item) => {
            const amountAfterDiscountDiff =
              Number(item.recalculatedAmount) + discountDiff;
            if (amountAfterDiscountDiff > 0) {
              item.recalculatedAmount = amountAfterDiscountDiff;
              details.discounttoApply = Number(DiscountTotalbeforeDistribution);
              discounttoApply = Number(DiscountTotalbeforeDistribution);
            }
          });
        }

        // }
      } else {
        details.discounttoApply = 0;
      }
    } else {
      // details.discounttoApply = 0;
    }

    if (!details.isOnlinebill && couponDisountamt && couponDisountamt != 0) {
      let coupondiscounttoApply = couponDisountamt;
      if (Number(couponDisounttype) == 1) {
        coupondiscounttoApply = (
          (order_subtotal * couponDisountamt) /
          100
        ).toFixed(ROUNDOFF_UPTO);
      }
      if (grandTotal >= coupondiscounttoApply) {
        // if (!details.isOldbill) {
        grandTotal -= coupondiscounttoApply;
        // }
        coupondiscountApplied = true;
        details.coupondiscounttoApply = coupondiscounttoApply;

        const splittedCouponDiscountamount = Number(
          coupondiscounttoApply /
          (order_subtotal - chargesamounttoExludefromtax),
        );
        details.items.map((item) => {
          const discountAmounttominus =
            Number(item.recalculatedAmount) * splittedCouponDiscountamount;
          let recalculatedAmount = item.recalculatedAmount
            ? item.recalculatedAmount - discountAmounttominus
            : discountAmounttominus;
          recalculatedAmount =
            Number(recalculatedAmount).toFixed(ROUNDOFF_UPTO);
          // if (!details.isOldbill) {
          item.recalculatedAmount
            ? (item.recalculatedAmount = recalculatedAmount)
            : Object.assign(item, recalculatedAmount);
          // }
        });
      } else {
        details.coupondiscounttoApply = 0;
      }
    } else {
      details.coupondiscounttoApply = 0;
    }

    if (
      !details.isOnlinebill &&
      details.discounttoApply != undefined &&
      details.discounttoApply > 0
    ) {
      let discountTitle = $.i18n.t('controller:previewController.Discount');
      if (details.isloyaltyrewardDiscount) {
        discountTitle = details.rewardTitle
          ? `Loyalty Discount(${details.rewardTitle})`
          : 'Loyalty Discount'; // || 'Loyalty Discount :';
      }
      if (details.discount_title) {
        // discountTitle = discountTitle + `(${details.discount_title})`;
        discountTitle = `${details.discount_title}`;
      }

      $(`#previewDiscountreasonlabelid`).html('');
      $('#discountAmountlabel').empty();
      let discountRate = details.discount;
      if (details.discount_rate) {
        discountRate = details.discount_rate;
      }
      if (Number(details.discount_type) == 1) {
        const nameLabel = `<label class='' >${discountTitle} (${discountRate}%):</label>`;
        const amountLabel = `<label class='' >${currency} ${details.discounttoApply.toFixed(ROUNDOFF_UPTO)}</label>`;

        $('#discountAmountlabel').append(
          `<li class="billSummaryPrint"> ${nameLabel}${amountLabel}</li>`,
        );
        // $('#discountAmountlabel').html(
        //   `${discountTitle} (${discountRate}%) : ${currency} ${details.discounttoApply.toFixed(ROUNDOFF_UPTO)}`,
        // );
      } else if (Number(details.discount_per_or_fixed) == 1) {
        // $('#discountAmountlabel').html(
        //   `${discountTitle} (${discountRate}%) : ${currency} ${details.discounttoApply.toFixed(ROUNDOFF_UPTO)}`,
        // );
        const nameLabel = `<label class='' >${discountTitle} (${discountRate}%):</label>`;
        const amountLabel = `<label class='' >${currency} ${details.discounttoApply.toFixed(ROUNDOFF_UPTO)}</label>`;

        $('#discountAmountlabel').append(
          `<li class="billSummaryPrint"> ${nameLabel}${amountLabel}</li>`,
        );
      } else {
        // $('#discountAmountlabel').html(
        //   `${discountTitle} : ${currency} ${details.discounttoApply.toFixed(
        //     ROUNDOFF_UPTO,
        //   )}`,
        // );

        const nameLabel = `<label class='' >${discountTitle}:</label>`;
        const amountLabel = `<label class='' >${currency} ${details.discounttoApply.toFixed(ROUNDOFF_UPTO)}</label>`;

        $('#discountAmountlabel').append(
          `<li class="billSummaryPrint"> ${nameLabel}${amountLabel}</li>`,
        );
      }

      $('#discountDivid').show();

      if (showDiscountreasonifapplied && details.instructions) {
        const response = getOrderlevelinstructions(details.instructions);
        if (response.discount) {
          // $('#previewDiscountreasonlabelid').html(
          //   `${$.i18n.t('controller:previewController.discountReason')}${
          //     response.discount || ''
          //   }`,
          // );

          const reasonLabel = `<label class='' >${$.i18n.t('controller:previewController.discountReason')}</label>`;
          const reasonValueLael = `<label class='' >${response.discount || ''}</label>`;

          $('#previewDiscountreasonlabelid').append(
            `<li class="billSummaryPrint"> ${reasonLabel}${reasonValueLael}</li>`,
          );
        }
      }
    } else {
      $('#discountDivid').hide();
    }

    $('#cpdiscountAmountlabel').empty();
    if (
      !details.isOnlinebill &&
      details.coupondiscounttoApply != undefined &&
      details.coupondiscounttoApply > 0
    ) {
      const cpdiscountTitle = $.i18n.t('previewScreen.couponDiscount');
      // $('#cpdiscountAmountlabel').html(
      //   `${cpdiscountTitle} (${details.coupon} ${couponDisountamt} ${
      //     Number(couponDisounttype) == 1 ? '%' : ''
      //   } ) : ${currency} ${details.coupondiscounttoApply} `,
      // );

      const nameLabel = `<label class='' >${cpdiscountTitle} (${details.coupon} ${couponDisountamt} ${Number(couponDisounttype) == 1 ? '%' : ''
        }):</label>`;
      const amountLabel = `<label class='' >${currency} ${details.coupondiscounttoApply}</label>`;

      $('#cpdiscountAmountlabel').append(
        `<li class="billSummaryPrint"> ${nameLabel}${amountLabel}</li>`,
      );
      $('#coupondiscountDivid').show();
    } else {
      $('#coupondiscountDivid').hide();
    }

    if (!details.isOnlinebill) {
      if (MULTI_TAX) {
        $('#tax_divided_div1_id').hide();
        $('#tax_divided_div2_id').hide();

        let taxapplicableAmount =
          order_subtotal -
          (details.discounttoApply || 0) -
          (details.coupondiscounttoApply || 0) -
          chargesamounttoExludefromtax;

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
                    !currentTax?.extra_details?.isTaxOnTax &&
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

                  taxlistTomaintain.push({
                    name: currentTax.tax_display_name,
                    tax_percent: currentTax.tax_perct,
                    amount: currentTaxtotal,
                    tax_inclusive: isInclusive,
                    taxDivided: Boolean(currentTax.is_devidable),
                    hideTaxOnBill: currentTax?.extra_details?.hideTaxOnBill,
                  });

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

        // // add the tax details to the extra details object
        // Object.assign(extra_details, {
        //   ...(inclusiveTotal && {
        //     inclusive_tax: inclusiveTotal,
        //   }),
        //   ...(exclusiveTotal && {
        //     exlusive_tax: exclusiveTotal,
        //   }),
        //   tax: taxlistTomaintain,
        // });

        // Now add the exclusive tax total to order total
        if (exclusiveTotal > 0) {
          grandTotal += exclusiveTotal;
        }

        taxTotal = Number(
          Number(inclusiveTotal + exclusiveTotal).toFixed(ROUNDOFF_UPTO),
        );

        // const taxDetails = {
        //   taxTotal,
        // };

        // render tax on UI
        renderTaxforNormalBilling(taxlistTomaintain);
        if (
          (!hideTotalWithoutTax &&
            Number(totalwithoutTax) &&
            !taxInclusive &&
            totalwithoutTax !== order_subtotal) ||
          (!hideTotalWithoutTax && totalwithoutTax && taxInclusive)
        ) {
          $('#totalwithouttaxDivid').css('display', '');
          $('#totalWithouttaxid').html(
            currency + Number(totalwithoutTax).toFixed(window.ROUNDOFF_UPTO),
          );
          $('#totalwithouttaxDivid').css('display', '');
        } else {
          $('#totalwithouttaxDivid').css('display', 'none');
        }
      } else {
        if (discountApplied || coupondiscountApplied || recalculateTax) {
          let taxtocalculateonAmount = grandTotal;
          if (chargesamounttoExludefromtax > 0) {
            taxtocalculateonAmount -= chargesamounttoExludefromtax;
          }

          taxTotal = 0;
          details.items.map((item) => {
            if (Number(item.item_tax_method)) {
              taxTotal = Number(
                Number(
                  (
                    taxTotal +
                    (item.recalculatedAmount / (100 + item.item_tax_per)) *
                    item.item_tax_per
                  ).toFixed(ROUNDOFF_UPTO),
                ),
              );
              const singleItemTax = Number(
                Number(
                  (
                    (item.recalculatedAmount / (100 + item.item_tax_per)) *
                    item.item_tax_per
                  ).toFixed(ROUNDOFF_UPTO),
                ),
              );
              totalTaxableAmount +=
                Number(item.recalculatedAmount) - Number(singleItemTax);
            } else {
              let taxPerct;
              if (item.item_is_devidable) {
                taxPerct = Number(
                  ((item.item_tax_per / 2) * item.recalculatedAmount) / 100,
                );
                taxPerct = roundAmountUptoDecimals(taxPerct, ROUNDOFF_UPTO);
                taxTotal = Number(
                  (taxTotal + taxPerct * 2).toFixed(ROUNDOFF_UPTO),
                );
              } else {
                // taxTotal = Number(
                //   (
                //     taxTotal +
                //     (item.recalculatedAmount * item.item_tax_per) / 100
                //   ).toFixed(ROUNDOFF_UPTO),
                // );
                const totalTax = Number(
                  (item.recalculatedAmount * item.item_tax_per) / 100,
                );
                taxTotal += roundAmountUptoDecimals(
                  totalTax,
                  window.ROUNDOFF_UPTO,
                );
              }
              totalTaxableAmount += Number(item.recalculatedAmount);
            }
          });
        }
        // }

        if (
          (!hideTotalWithoutTax &&
            taxTotal &&
            Number(totalTaxableAmount) &&
            !taxInclusive &&
            totalTaxableAmount !== order_subtotal) ||
          (!hideTotalWithoutTax && totalTaxableAmount && taxInclusive)
        ) {
          $('#totalwithouttaxDivid').css('display', '');
          $('#totalWithouttaxid').html(
            currency + Number(totalTaxableAmount).toFixed(ROUNDOFF_UPTO),
          );
          $('#totalwithouttaxDivid').css('display', '');
        } else {
          $('#totalwithouttaxDivid').css('display', 'none');
        }
        if (!taxInclusive) {
          grandTotal += taxTotal;
        }
        const tax_type = taxInclusive
          ? `(${taxPercent ? `${taxPercent}%` : ''} Incl.)`
          : `(${taxPercent ? `${taxPercent}%` : ''})`;

        if (!taxMethod) {
          taxMethod = '';
        }
        $('#taxnameDiv_id').hide();

        // id hide tax setting is enabled then don't show it
        if (!hideTaxOnBill) {
          if (istax_dividable && window.storeDetails.country === 'India') {
            $('#taxDivid').hide();
            const splittax = taxTotal.toFixed(ROUNDOFF_UPTO) / 2;
            const splitPercent = Number(taxPercent.toFixed(ROUNDOFF_UPTO) / 2);
            $('#tax_divided_div1_id').show();
            $('#tax_divided_div2_id').show();
            $('#cgstLabel').html(
              `${$.i18n.t(
                'controller:previewController.CGST',
              )} (${splitPercent}%) : `,
            );
            $('#cgstAmount').html(
              `${currency + splittax.toFixed(ROUNDOFF_UPTO)} `,
            );

            $('#sgstLabel').html(
              `${$.i18n.t(
                'controller:previewController.SGST',
              )} (${splitPercent}%) : `,
            );
            $('#sgstAmount').html(
              `${currency + splittax.toFixed(ROUNDOFF_UPTO)} `,
            );
          } else if (taxTotal > 0) {
            // $('#taxDivid').show();
            $('#taxDivid').css('display', 'flex');
            $('#tax_divided_div1_id').hide();
            $('#tax_divided_div2_id').hide();
            if (showTranslationInBothLanguage) {
              $('#taxAmountlabeltitle').html(
                `${$.i18n.t('bothLanguage.Total')} ${taxMethod || ''}: `,
              );
            } else {
              $('#taxAmountlabeltitle').html(
                `${$.i18n.t('controller:previewController.Total')} ${taxMethod || ''
                }: `,
              );
            }

            $('#taxAmountlabel').html(
              `${tax_type} ${currency} ${taxTotal.toFixed(ROUNDOFF_UPTO)}`,
            );
          } else {
            $('#taxDivid').hide();
          }
        } else {
          $('#taxDivid').hide();
        }
      }
    } else {
      $(
        '#taxDivid,#taxnameDiv_id,#tax_divided_div1_id,#tax_divided_div2_id,#totalwithouttaxDivid',
      ).css('display', 'none');
    }

    $('#previewchargesListid').empty();
    if (
      details.charges &&
      Array.isArray(details.charges) &&
      !details.isOnlinebill
    ) {
      const { charges } = details;
      const isOldBill = !!(details.isOldbill != undefined && details.isOldbill);
      if (charges && charges.length > 0) {
        let chargesTotal = 0;

        charges.forEach((charge) => {
          let chargeAmount = Number(charge.amount);
          let chargeAmountbeforeTax = chargeAmount;
          const previewchargeTitle = charge.title;
          if (isOldBill) {
            let calculatedChargeamount = chargeAmount;
            if (charge.calculated_tax && !charge.is_tax_included) {
              calculatedChargeamount -= charge.calculated_tax;
            }
            const nameLabel = `<label class='chargename' >${previewchargeTitle}:</label>`;
            const amountLabel = `<label class='amountLabel' >${currency}${calculatedChargeamount.toFixed(
              ROUNDOFF_UPTO,
            )}</label>`;

            $('#previewchargesListid').append(
              `<li class="billSummaryPrint"> ${nameLabel}${amountLabel}</li>`,
            );
            // Check if the tax is available
            if (charge.calculated_tax && showtaxOnChargeOnBill) {
              const chargetaxContainer = $('<li>');
              if (
                charge.tax_divided &&
                charge.tax_amount &&
                window.storeDetails.country === 'India'
              ) {
                splitChargestaxandappendtoview({
                  taxTotal: charge.calculated_tax,
                  element: `#previewchargesListid`,
                  tax_amount: charge.tax_amount,
                });
              } else {
                // const chargetaxName =
                //   charge.tax_title ||
                //   $.i18n.t('controller:previewController.Tax');
                // $('<label>', {
                //   html: `${chargetaxName} (${
                //     charge.tax_amount || ''
                //   }%) - ${currency} ${charge.calculated_tax.toFixed(window.ROUNDOFF_UPTO)}`,
                // }).appendTo(chargetaxContainer);
                const chargetaxName =
                  charge.tax_title ||
                  $.i18n.t('controller:previewController.Tax');

                // Wrapper div
                const taxDiv = $('<div>', {
                  class: 'preview-chargetax-wrapper billSummaryPrint',
                });

                // Label 1 → tax name + percent + "-"
                const taxTitleLabel = $('<label>', {
                  text: `${chargetaxName} (${charge.tax_amount || ''}%) -`,
                  class: 'preview-chargetax-title',
                });

                // Label 2 → tax amount
                const taxAmountLabel = $('<label>', {
                  text: `${currency} ${charge.calculated_tax.toFixed(window.ROUNDOFF_UPTO)}`,
                  class: '',
                });

                // Append both labels into wrapper
                taxDiv.append(taxTitleLabel);
                taxDiv.append(taxAmountLabel);

                // Append wrapper to container
                $(chargetaxContainer).append(taxDiv);
              }
              $('#previewchargesListid').append(chargetaxContainer);
            }
          } else {
            const postFix = charge.per_or_fixed == '1' ? ' % ):' : ' ):';
            if (charge.per_or_fixed == 1) {
              if (charge.extra_details) {
                const extra_details = JSON.parse(charge.extra_details);
                switch (Number(extra_details.applicable_on_amount)) {
                  case 0:
                    chargeAmount = Number(
                      (
                        ((order_subtotal -
                          allitemsItemlevelchargesTotal -
                          Number(
                            details.discounttoApply
                              ? details.discounttoApply
                              : 0,
                          )) *
                          chargeAmount) /
                        100
                      ).toFixed(ROUNDOFF_UPTO),
                    );
                    break;
                  case 1:
                    chargeAmount = Number(
                      (
                        ((order_subtotal - allitemsItemlevelchargesTotal) *
                          chargeAmount) /
                        100
                      ).toFixed(ROUNDOFF_UPTO),
                    );
                    break;
                  case 2:
                    chargeAmount = Number(
                      (
                        ((order_subtotal -
                          allitemsItemlevelchargesTotal -
                          Number(taxTotal || 0)) *
                          chargeAmount) /
                        100
                      ).toFixed(ROUNDOFF_UPTO),
                    );
                    break;
                  default:
                    chargeAmount = Number(
                      (
                        ((order_subtotal -
                          allitemsItemlevelchargesTotal -
                          Number(
                            details.discounttoApply
                              ? details.discounttoApply
                              : 0,
                          )) *
                          chargeAmount) /
                        100
                      ).toFixed(ROUNDOFF_UPTO),
                    );
                    break;
                }
                // if (extra_details.applicable_on_amount == '1') {
                //   chargeAmount = Number(
                //     (
                //       ((order_subtotal - allitemsItemlevelchargesTotal) *
                //         chargeAmount) /
                //       100
                //     ).toFixed(ROUNDOFF_UPTO),
                //   );
                // } else {
                //   chargeAmount = Number(
                //     (
                //       ((order_subtotal -
                //         allitemsItemlevelchargesTotal -
                //         Number(
                //           details.discounttoApply ? details.discounttoApply : 0,
                //         )) *
                //         chargeAmount) /
                //       100
                //     ).toFixed(ROUNDOFF_UPTO),
                //   );
                // }
              } else {
                chargeAmount = Number(
                  (
                    ((order_subtotal -
                      allitemsItemlevelchargesTotal -
                      Number(details.discounttoApply)) *
                      chargeAmount) /
                    100
                  ).toFixed(ROUNDOFF_UPTO),
                );
              }
            }
            chargeAmountbeforeTax = chargeAmount;
            // check if the tax is available
            if (charge.is_tax_applicable && charge.tax_amount) {
              // let calculatedChargestax = Number(chargeAmount * (charge.tax_amount / 100));
              // calculatedChargestax = Number(Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO));
              let calculatedChargestax = 0;
              if (charge.is_tax_included) {
                //    //    taxPerct = Number(((chargeAmount / (100 + charge.tax_amount)) * (charge.tax_amount/2)).toFixed(ROUNDOFF_UPTO));
                let taxPerct;
                if (charge.tax_divided) {
                  calculatedChargestax = Number(
                    (
                      (chargeAmount / (100 + charge.tax_amount)) *
                      charge.tax_amount
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  // taxPerct = roundAmountUptoDecimals(Number(((chargeAmount / (100 + (charge.tax_amount / 2))) * (charge.tax_amount / 2)), ROUNDOFF_UPTO));

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
                }
              } else {
                let taxPerct;
                if (charge.tax_divided) {
                  taxPerct = Number(
                    (chargeAmount * (charge.tax_amount / 2)) / 100,
                  ).toFixed(ROUNDOFF_UPTO);
                  taxPerct = roundAmountUptoDecimals(
                    Number((chargeAmount * (charge.tax_amount / 2)) / 100),
                    ROUNDOFF_UPTO,
                  );
                  // taxPerct = roundAmountUptoDecimals(Number(taxPerct), Number(ROUNDOFF_UPTO));
                  calculatedChargestax = taxPerct * 2;
                  calculatedChargestax = Number(
                    Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                  );
                  // calculatedChargestax = Number(roundAmountUptoDecimals(Number(calculatedChargestax),ROUNDOFF_UPTO));
                } else {
                  calculatedChargestax =
                    chargeAmount * (charge.tax_amount / 100);
                  calculatedChargestax = Number(
                    Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                  );
                }
              }

              if (charge.is_tax_included === 0) {
                // Check if tax is exlcusive
                chargeAmount += calculatedChargestax;
                chargeAmount = Number(
                  Number(chargeAmount).toFixed(ROUNDOFF_UPTO),
                );
              }
              // previewchargeTitle += `-Tax(${charge.tax_amount}%)`;
              Object.assign(charge, {
                is_tax_included: charge.is_tax_included,
                calculated_tax: calculatedChargestax,
              });
            }

            const nameLabel = `<label class='chargename' >${previewchargeTitle}:</label>`;
            const amountLabel = `<label class='amountLabel' >${currency}${Number(
              chargeAmountbeforeTax,
            ).toFixed(ROUNDOFF_UPTO)}</label>`;

            $('#previewchargesListid').append(
              `<li class="billSummaryPrint"> ${nameLabel}${amountLabel}</li>`,
            );

            // Check if the tax is available
            if (charge.calculated_tax && showtaxOnChargeOnBill) {
              // const chargetaxContainer = $('<li>');
              if (
                charge.tax_divided &&
                charge.tax_amount &&
                window.storeDetails.country === 'India'
              ) {
                splitChargestaxandappendtoview({
                  taxTotal: charge.calculated_tax,
                  element: `#previewchargesListid`,
                  tax_amount: charge.tax_amount,
                });
              } else {
                // const chargetaxName =
                //   charge.tax_title ||
                //   $.i18n.t('controller:previewController.Tax');
                // $('<label>', {
                //   html: `${chargetaxName}: (${charge.tax_amount}%)  ${currency} ${charge.calculated_tax.toFixed(window.ROUNDOFF_UPTO)}`,
                // }).appendTo(chargetaxContainer);
                const chargetaxName =
                  charge.tax_title ||
                  $.i18n.t('controller:previewController.Tax');

                // Wrapper div
                const chargeTaxDiv = $('<li>', {
                  class: 'preview-chargetax-wrapper billSummaryPrint',
                });

                // Label 1 → Name + percent
                const chargeTaxTitleLabel = $('<label>', {
                  text: `${chargetaxName}: (${charge.tax_amount}%)`,
                  class: 'preview-chargetax-title',
                });

                // Label 2 → tax amount
                const chargeTaxAmountLabel = $('<label>', {
                  text: `${currency} ${charge.calculated_tax.toFixed(window.ROUNDOFF_UPTO)}`,
                  class: 'preview-chargetax-amount',
                });

                // Append labels into wrapper
                chargeTaxDiv.append(chargeTaxTitleLabel);
                chargeTaxDiv.append(chargeTaxAmountLabel);

                // Append wrapper to target container
                // $(chargetaxContainer).append(chargeTaxDiv);
                $('#previewchargesListid').append(chargeTaxDiv);
              }
            }
          }
          chargesTotal += Number(chargeAmount);
        });

        if (chargesTotal >= 0) {
          grandTotal += chargesTotal;
          $('#previewchargesWrapperid').css('display', '');
        }
      } else {
        $('#previewchargesWrapperid').css('display', 'none');
      }
    } else {
      $('#previewchargesWrapperid').css('display', 'none');
    }

    $('#previewitemchargesListid').empty();

    if (
      !showItemlevelchargesSeperately &&
      allItemlevelcharges &&
      Array.isArray(allItemlevelcharges)
    ) {
      const groupedCharges = _.chain(allItemlevelcharges)
        .groupBy('chargeName')
        .map((platform, id) => ({
          chargeName: id,
          totalAmount: _.sumBy(platform, 'chargeAmount'),
        }))
        .value();

      $('#itemlevelChargestotaldivID').css('display', ' ');
      if (groupedCharges) {
        groupedCharges.map((charge) => {
          $('#previewitemchargesListid').append(
            `<li> ${charge.chargeName} : ${currency} ${charge.totalAmount.toFixed(ROUNDOFF_UPTO)}  </li>`,
          );
        });
      }
    } else {
      $('#itemlevelChargestotaldivID').css('display', 'none');
    }

    if (details.isOnlinebill) {
      if (details.onlinediscounttoApply)
        details.discounttoApply = details.onlinediscounttoApply;

      if (
        details.billType == 8 &&
        details.extra_details &&
        details.extra_details.tax &&
        details.extra_details.tax.length > 1
      ) {
        renderTaxforNormalBilling(details.extra_details.tax);
      } else if (details.onlinetaxesTotal) {
        const taxtoshowonBill = details.onlinetaxesTotal;
        let onlinetaxsplitPercent = Number(taxtoshowonBill) / 2;
        onlinetaxsplitPercent = Number(onlinetaxsplitPercent).toFixed(
          window.ROUNDOFF_UPTO,
        );
        let taxableAmount =
          order_subtotal -
          details.onlinetaxesTotal -
          details.discounttoApply -
          details.coupondiscounttoApply;

        if (details.billType === KEETA_BILLING_FLAG) {
          taxableAmount = order_subtotal - details.onlinetaxesTotal;
        }
        $('#tax_divided_div1_id,#tax_divided_div2_id').show();
        if (istax_dividable && window.storeDetails.country === 'India') {
          $('#cgstLabel').html(
            `${$.i18n.t('controller:previewController.CGST')} `,
          );
          $('#sgstLabel').html(
            `${$.i18n.t('controller:previewController.SGST')} `,
          );
          $('#cgstAmount').html(`${currency} ${onlinetaxsplitPercent}`);
          $('#sgstAmount').html(`${currency} ${onlinetaxsplitPercent}`);

          if (
            (!hideTotalWithoutTax &&
              Number(taxableAmount) &&
              taxInclusive &&
              taxableAmount !== order_subtotal) ||
            (!hideTotalWithoutTax && taxableAmount && taxInclusive)
          ) {
            const totalTaxToshow =
              order_subtotal -
              (Number(onlinetaxsplitPercent) + Number(onlinetaxsplitPercent));
            $('#totalwithouttaxDivid').css('display', '');
            $('#totalWithouttaxid').html(
              currency + Number(totalTaxToshow).toFixed(ROUNDOFF_UPTO),
            );
            $('#totalwithouttaxDivid').css('display', '');
          }
        } else if (
          (!hideTotalWithoutTax &&
            Number(taxableAmount) &&
            !taxInclusive &&
            taxableAmount !== order_subtotal) ||
          (!hideTotalWithoutTax && taxableAmount && taxInclusive)
        ) {
          $('#totalwithouttaxDivid').css('display', '');
          $('#totalWithouttaxid').html(
            currency + Number(taxableAmount).toFixed(ROUNDOFF_UPTO),
          );
          $('#totalwithouttaxDivid').css('display', '');
        } else {
          $('#totalwithouttaxDivid').css('display', 'none');
        }
        if (window.selectedLanguage !== 'en') {
          $('#taxAmountlabeltitleforonline').html(
            `${$.i18n.t('controller:previewController.Total')} ${taxMethod} (${taxInclusive ? $.i18n.t('controller:previewController.Inclusive') : ''} \u202A${taxPercent}%)\u202C`,
          );
        } else {
          $('#taxAmountlabeltitleforonline').html(
            `Total ${taxMethod} (${taxInclusive ? 'Incl.' : ''} ${taxPercent}%)`,
          );
        }
        $('#onlinetaxAmountlabel').html(
          currency + Number(taxtoshowonBill).toFixed(window.ROUNDOFF_UPTO),
        );

        $('#onlinetaxDivid').css('display', '');

        // add the tax to grand total
        if (!taxInclusive) {
          grandTotal += Number(Number(taxtoshowonBill).toFixed(ROUNDOFF_UPTO));
        }
      } else {
        $('#onlinetaxDivid').css('display', 'none');
      }

      if (details.onlinechargesTotal) {
        grandTotal += Number(
          Number(details.onlinechargesTotal).toFixed(ROUNDOFF_UPTO),
        );

        details.charges.forEach((charge) => {
          // $('#previewchargesListid').append(
          //   `<li> ${charge.title}: ${Number(
          //     charge.amount || charge.value,
          //   ).toFixed(ROUNDOFF_UPTO)}</li>`,
          // );

          // Create <li>
          const li = $('<li>', { class: 'preview-charge-item ' });

          // Wrapper div
          const chargeDiv = $('<div>', {
            class: 'preview-charge-wrapper billSummaryPrint',
          });

          // Title label
          const chargeTitleLabel = $('<label>', {
            text: `${charge.title}:`,
            class: 'preview-charge-title',
          });

          // Amount label
          const chargeAmountLabel = $('<label>', {
            text: Number(charge.value || charge.amount).toFixed(ROUNDOFF_UPTO),
            class: 'preview-charge-amount',
          });

          // Append labels
          chargeDiv.append(chargeTitleLabel);
          chargeDiv.append(chargeAmountLabel);

          // Append wrapper inside <li>
          li.append(chargeDiv);

          // Append to list
          $('#previewchargesListid').append(li);
        });
        // $('#previewchargesListid').append(
        //   `<li> Charges:${Number(details.onlinechargesTotal).toFixed(
        //     ROUNDOFF_UPTO,
        //   )}</li>`,
        // );

        $('#previewchargesWrapperid').css('display', '');
      } else {
        $('#previewchargesWrapperid').css('display', 'none');
      }

      if (details.discounttoApply != undefined && details.discounttoApply > 0) {
        $(`#discountAmountlabel`).html('');
        $(`#previewDiscountreasonlabelid`).html('');
        let iswithExternaldiscount = '';
        if (
          details.total_external_discount &&
          details.total_external_discount != 0
        ) {
          details.discounttoApply =
            Number(details.discounttoApply) +
            Number(details.total_external_discount);
          iswithExternaldiscount = ' (with Ext. disc) ';
        }

        grandTotal = Number(grandTotal.toFixed(window.ROUNDOFF_UPTO));
        if (grandTotal >= details.discounttoApply) {
          grandTotal -= details.discounttoApply;
          if (iswithExternaldiscount && details.total_external_discount) {
            grandTotal += Number(details.total_external_discount);
          }
        }
        let discountTitle = $.i18n.t('controller:previewController.Discount');
        if (details.discount_title) {
          discountTitle += `(${details.discount_title})`;
        }

        const olDiscountDiv = $('<div>', {
          class: 'preview-charge-wrapper billSummaryPrint',
        });

        // Title label
        const olDiscountTitleLabel = $('<label>', {
          text: `${discountTitle} ${iswithExternaldiscount}`,
          class: 'preview-charge-title',
        });

        // Amount label
        const olDiscountAmountLabel = $('<label>', {
          text: `${currency} ${details.discounttoApply}`,
          class: 'preview-charge-amount',
        });

        // Append labels
        olDiscountDiv.append(olDiscountTitleLabel);
        olDiscountDiv.append(olDiscountAmountLabel);

        $('#discountAmountlabel').append(olDiscountDiv);
        $('#discountDivid').css('display', '');
      } else {
        details.discounttoApply = 0;
        $('#discountDivid').css('display', 'none');
      }
    }

    $('#previewroundedTotallabelid').html('');

    if (DO_BILL_ROUNDOFF) {
      try {
        grandTotal = Number(grandTotal.toFixed(ROUNDOFF_UPTO));
        const previousTotal = grandTotal;
        if (
          (details.isOldbill || details.isOnlinebill) &&
          !details?.extra_details?.roundedAmount
        ) {
        } else {
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
            $('#previewroundedTotallabelid').show();
            const roundedAmount = grandTotal - previousTotal;
            // $('#previewroundedTotallabelid').html(
            //   `${$.i18n.t('controller:previewController.roundedAmt')}
            // ${roundedAmount > 0 ? '+' : ''} ${Number(
            //   roundedAmount.toFixed(window.ROUNDOFF_UPTO),
            // )}`,
            // );

            const roundedLabel = `<label class='' >${$.i18n.t('controller:previewController.roundedAmt')}</label>`;
            const roundedValueLael = `<label class='' >${roundedAmount > 0 ? '+' : ''} ${Number(
              roundedAmount.toFixed(window.ROUNDOFF_UPTO),
            )}</label>`;

            $('#previewroundedTotallabelid').append(
              `<li class="billSummaryPrint"> ${roundedLabel}${roundedValueLael}</li>`,
            );
          } else {
            $('#previewroundedTotallabelid').hide();
          }
        }
      } catch (error) { }
    }

    $('#grandtotallabelID').html(
      `${currency} ${grandTotal.toFixed(ROUNDOFF_UPTO)}`,
    );

    if (
      details &&
      details.extra_details &&
      details.extra_details.currencyConversionDetails
    ) {
      $('#grandtotalInForeignCurrencylabelID').show();
      const { amountAfterConvert, currency } =
        details.extra_details.currencyConversionDetails;
      const label = `${amountAfterConvert} ${currency} Received`;
      $('#grandtotalInForeignCurrencylabelID').html(label);
    } else {
      $('#grandtotalInForeignCurrencylabelID').hide();
    }
    Object.assign(arabqrcodeinfoObject, {
      grandTotal,
      taxTotal,
    });
    let showZatcaInvoiceOnPrint = false;
    if (showzatcaeinvoiceQrcode) {
      showZatcaInvoiceOnPrint = true;
    }

    if (details.isdraftBill && !showZatcaQrOnDraftBillPrint) {
      showZatcaInvoiceOnPrint = false;
    }
    if (showZatcaInvoiceOnPrint) {
      await showArabtaxinfoQrcode();
    }
    if (details && details.order_note) {
      $('#orderNoteDivId').show();
      $('#orderNoteDivId').html(`Order Note: ${details.order_note}`);
    } else {
      $('#orderNoteDivId').hide();
    }
    if (
      window.storeDetails &&
      window.storeDetails.show_poweredby &&
      $('#appversionDivid').is(':empty')
    ) {
      console.log('APP_VERSION::', APP_VERSION);
      $('#appversionDivid').html(
        `${$.i18n.t(
          'controller:previewController.poweredByTMBillV',
        )} ${APP_VERSION}`,
      );
    }

    if (grandTotal && window.showbillamountinWords) {
      const words = numberTowords(
        // Number(grandTotal.toFixed(ROUNDOFF_UPTO)),
        grandTotal.toFixed(ROUNDOFF_UPTO),
        window.storeDetails.currency_name,
        window.storeDetails.sub_currency_name,
      );
      if (words) {
        $('#grandtotalwordid').html(words);
        $('#grandtotalwordid').css('display', '');
      } else {
        $('#grandtotalwordid').css('display', 'none');
      }
    } else {
      $('#grandtotalwordid').css('display', 'none');
    }

    $('#paymentQrcodeCanvascontainerid').hide();
    if (
      Number(window.storeDetails.show_upi)
      // &&
      // window.storeDetails.upi_id &&
      // !details.field2
    ) {
      let showUpi = true;
      // don't show upi on bill print for online orders
      if (OnlineOrderBillingTypesByNumber.indexOf(details.billType) >= 0) {
        showUpi = false;
      }

      if (
        details.billType === OnlineBillingTypeByName.SWIGGY &&
        details.payment_qr_url
      ) {
        showUpi = true;
      }
      if (showUpi) {
        // OnlineOrderBillingTypesByNumber.indexOf(details.billType) === -1
        // if details having qr code generated then no need to generate again
        let upiString;
        if (details.field2 && details.field2.length) {
          upiString = details.field2;
        }

        if (details.payment_qr_url && details.payment_qr_url.length) {
          upiString = details.payment_qr_url;
        }
        if (upiString) {
          await addPaymentQRCOde(upiString);
        } else {
          await showUpiqrcode(grandTotal, backuporder_id);
        }
      }
    }

    if (showOrderIdBarcode && details.order_id) {
      showOrderIdBarcodeOnBill({
        id: details.order_id,
      });
    } else {
      $('#orderIdBarcodeCanvascontainer').hide();
    }

    if (showZatcaInvoiceOnPrint) {
      showZatcaQRCode({
        order_id: details.bill_number,
        store_id: window.storeDetails.store_id,
        isOldbill: details.isOldbill,
        zatca_status: details.zatca_status,
        mpos_zatca_status: details.mpos_zatca_status,
      });
    }

    if (showJordanEinvoiceQrcode) {
      showJordanEinvoicingQRCode({
        order_id: details.bill_number,
        store_id: window.storeDetails.store_id,
        isOldbill: details.isOldbill,
        zatca_status: details.zatca_status,
        mpos_zatca_status: details.mpos_zatca_status,
      });
    }
    // else if (
    //   Number(window.storeDetails.show_upi)
    // ) {
    //   await addPaymentQRCOde(details.field2);
    // }

    $('#customerInfodivid').empty();
    if (
      details.showCustomerinfo &&
      details.customer &&
      Object.keys(details.customer).length > 0
    ) {
      let customerInfo = '';
      if (details.customer.name) {
        let { name } = details.customer;
        if (details.customer.salutation) {
          if (/^\d+$/.test(details.customer.salutation)) {
            const salutation =
              SALUTATIONS_VALUES[Number(details.customer.salutation)];
            if (salutation) {
              name = `${salutation} ${name}`;
            }
          } else {
            name = `${details.customer.salutation} ${name}`;
          }
        }
        customerInfo = `${$.i18n.t('controller:previewController.Customer')}<b> ${name
          }</b>`;
      }
      if (details.customer.phone) {
        let dial_code = '';
        if (details.customer.dial_code) {
          dial_code = `+${details.customer.dial_code}`;
        }
        customerInfo = `${customerInfo} <b> \u202A(${dial_code} ${details.customer.phone})\u202C </b>`;
      }

      if (details.customer.alternate_phone) {
        let alternate_dial_code = '';
        if (details.customer.alternate_dial_code) {
          alternate_dial_code = `+${details.customer.alternate_dial_code}`;
        }
        customerInfo = `${customerInfo} <b> \u202A(${alternate_dial_code} ${details.customer.alternate_phone})\u202C </b>`;
      }

      if (details.customer && details.customer.extra_details) {
        const extra_details = safeParse(details.customer.extra_details);
        if (
          extra_details &&
          extra_details.extraPhones &&
          extra_details.extraPhones.length
        ) {
          extra_details.extraPhones.forEach((contact) => {
            customerInfo = `${customerInfo} <b> \u202A(+${contact.alternate_dial_code} ${contact.alternate_phone})\u202C </b>`;
          });
        }
      }
      if (details.customer && details.customer.segments) {
        let segmentContent = '';
        details.customer.segments.forEach((segment) => {
          segmentContent = `${segmentContent} <br> ${segment.en} ${segment.ar}`;
        });
        customerInfo = `${customerInfo} ${segmentContent}`;
      }
      const customerNamelabel = $('<label>', {
        class: 'preview-preorderinfo',
        html: customerInfo,
      });
      $(`#customerInfodivid`).append(customerNamelabel);

      let showAddress = true;
      if (
        (details.order_type_flag === 'PickUp' ||
          details.order_type_flag == 'Pickup') &&
        !showCustomerAddressOnPickupBill
      ) {
        showAddress = false;
      }

      if (showAddress) {
        // Location:
        if (details.customer.location) {
          const customeLocationlabel = $('<label>', {
            html: `Location:<b> ${details.customer.location}</b>`,
          });
          $(`#customerInfodivid`).append(customeLocationlabel);
        }

        // Area:
        if (details.customer.area) {
          const customearealabel = $('<label>', {
            html: `Area:<b> ${details.customer.area}</b>`,
          });
          $(`#customerInfodivid`).append(customearealabel);
        }

        // Block:
        if (details.customer.block) {
          const customeBlocklabel = $('<label>', {
            html: `Block:<b> ${details.customer.block}</b>`,
          });
          $(`#customerInfodivid`).append(customeBlocklabel);
        }

        // Street:
        if (details.customer.street) {
          const customeStreetlabel = $('<label>', {
            html: `Street:<b> ${details.customer.street}</b>`,
          });
          $(`#customerInfodivid`).append(customeStreetlabel);
        }

        // Lane:
        if (details.customer.lane) {
          const customeLanelabel = $('<label>', {
            html: `Lane:<b> ${details.customer.lane}</b>`,
          });
          $(`#customerInfodivid`).append(customeLanelabel);
        }

        // Building/Tower:
        if (details.customer.building) {
          const customerBuildinglabel = $('<label>', {
            html: `Building/Tower:<b> ${details.customer.building}</b>`,
          });
          $(`#customerInfodivid`).append(customerBuildinglabel);
        }

        // Flat/House No:
        if (details.customer.flat) {
          const customeFlatlabel = $('<label>', {
            html: `Flat/House No:<b> ${details.customer.flat}</b>`,
          });
          $(`#customerInfodivid`).append(customeFlatlabel);
        }

        // Floor No:
        if (details.customer.floor) {
          const customeFloorlabel = $('<label>', {
            html: `Floor No:<b> ${details.customer.floor}</b>`,
          });
          $(`#customerInfodivid`).append(customeFloorlabel);
        }

        // Landmark:
        if (details.customer.landmark) {
          const customeLandmarklabel = $('<label>', {
            html: `Landmark:<b> ${details.customer.landmark}</b>`,
          });
          $(`#customerInfodivid`).append(customeLandmarklabel);
        }

        // Complete Address:

        // Location Label:
        if (details.customer.label) {
          const customeLocationLabellabel = $('<label>', {
            html: `Location Label:<b> ${details.customer.label}</b>`,
          });
          $(`#customerInfodivid`).append(customeLocationLabellabel);
        }

        if (details.customer.address_line1) {
          const address = details.customer.address_line1
            ? details.customer.address_line1
            : '';
          const customeaddresslabel = $('<label>', {
            html: `<b>${address}</b>`,
          });
          $(`#customerInfodivid`).append(customeaddresslabel);
        }
      }
      if (showCustomergstonbill && details.customer.gstno) {
        let taxTitle = $.i18n.t('controller:previewController.GSTNo');
        if (window.storeDetails.country !== 'India') {
          taxTitle = $.i18n.t('controller:previewController.TaxNo');
        }
        const customergstnolabel = $('<label>', {
          html: `${taxTitle} ${details.customer.gstno}`,
        });
        $(`#customerInfodivid`).append(customergstnolabel);
      }

      try {
        const { due_payment } = details;
        if (
          window.showduePaymentonbill &&
          due_payment &&
          Number(due_payment) > 0
        ) {
          const customerDuepaylabel = $('<label>', {
            html: `${$.i18n.t(
              'controller:previewController.duePayment',
            )}${currency} ${Number(due_payment).toFixed(window.ROUNDOFF_UPTO)}`,
            class: 'top-dashed duePaymentContainer',
          });
          $(`#customerInfodivid`).append(customerDuepaylabel);
        }
      } catch (error) { }

      // check pre-order
      if (details.preorderInfo) {
        if (details.preorderInfo.delivery_at) {
          const delivery_at = moment(details.preorderInfo.delivery_at).format(
            'DD MMMM YYYY hh:mm A',
          );
          const preorderdeliverydateLabel = $('<label>', {
            html: `${$.i18n.t(
              'controller:previewController.deliveryDate',
            )} : ${delivery_at}`,
            class: 'preview-preorderinfo',
          });
          $(`#customerInfodivid`).append(preorderdeliverydateLabel);
        }
        if (details.preorderInfo.instructions) {
          const preorderinstructionsLabel = $('<label>', {
            html: `${$.i18n.t('controller:previewController.Instructions')} : ${details.preorderInfo.instructions
              }`,
            class: 'preview-preorderinfo',
          });
          $(`#customerInfodivid`).append(preorderinstructionsLabel);
        }
      }
      // show redeemed points if reward is given
      if (
        details.discounttoApply &&
        details.isloyaltyrewardDiscount &&
        details.pointsRedeemed
      ) {
        const customerredeemedpointslabel = $('<label>', {
          html: `Points Redeemed: ${details.pointsRedeemed}`,
        });
        $(`#customerInfodivid`).append(customerredeemedpointslabel);
      }

      $('#customerInfodivid').show();
    } else {
      $('#customerInfodivid').hide();
    }

    if (
      details.showCustomerinfo &&
      !details.customer &&
      details.customer_name
    ) {
      $('#customerInfodivid').show();
      let customerInfo = '';
      let customerName = details.customer_name;
      if (details.customer.salutation) {
        customerName = `${details.customer?.salutation} ${details.customer_name}`;
      }
      customerInfo = `${$.i18n.t('controller:previewController.Customer')} ${customerName
        }`;
      const customerNamelabel = $('<label>', {
        class: 'preview-preorderinfo',

        html: customerInfo,
      });
      $(`#customerInfodivid`).append(customerNamelabel);
    }
    // return;
    if (
      showcustomerpaidAmount &&
      Number(details.cust_paid_amount) &&
      !Number(details.due_payment)
    ) {
      let amountInCash = Number(grandTotal);
      if (
        details.payment_mode &&
        String(details.payment_mode).toLowerCase() === 'split'
      ) {
        const cashPayment = details.payment_modes.find(
          (item) => item.payment_option === 'Cash',
        );
        const cashAmount = cashPayment ? cashPayment.amount : 0;
        if (cashAmount) {
          amountInCash = cashAmount;
        }
      }

      let returnAmount = Number(
        Number(details.cust_paid_amount) - Number(amountInCash),
      ).toFixed(ROUNDOFF_UPTO);
      returnAmount = Number(returnAmount);
      if (details?.extra_details?.total_tip) {
        returnAmount -= Number(details.extra_details.total_tip);
      }
      $('#billpreviewcustomerpaidContainer').show();
      $('#billpreviewcustomerpaidAmountlabelid').html(
        `${$.i18n.t('controller:previewController.paidAmt')} ${currency} ${Number(
          details.cust_paid_amount,
        ).toFixed(ROUNDOFF_UPTO)}`,
      );
      if (returnAmount > 0) {
        $('#billpreviewcustomerreturnAmountlabelid').html(
          `${$.i18n.t(
            'controller:previewController.returnAmt',
          )} ${currency} ${returnAmount.toFixed(ROUNDOFF_UPTO)}`,
        );
      } else {
        $('#billpreviewcustomerreturnAmountlabelid').html('');
      }
    } else {
      $('#billpreviewcustomerpaidAmountlabelid').html('');
      $('#billpreviewcustomerpaidContainer').hide();
    }

    if (details?.extra_details?.total_tip) {
      $('#billpreviewtipAmountlabelid').show();
      $('#billpreviewtipAmountlabelid').html(
        `Waiter Tip Amount : ${currency} ${Number(
          details?.extra_details?.total_tip,
        ).toFixed(ROUNDOFF_UPTO)}`,
      );
    } else {
      $('#billpreviewtipAmountlabelid').hide();
    }

    $(`#previewmiscContainerid`).empty();
    $(`#previewmiscContainerid`).removeClass('botton-dashed');
    $(`#previewmiscContainerid`).addClass('botton-dashed');
    if (
      details.payment_mode &&
      String(details.payment_mode).toLowerCase() === 'split'
    ) {
      addPaymentmode(details.payment_modes);
      if (!$('#customerInfodivid').is(':empty')) {
        $(`#previewmiscContainerid`).removeClass('botton-dashed');
      } else {
        $(`#previewmiscContainerid`).addClass('botton-dashed');
      }
    } else {
      $('#billpreviewcustomerpaidContainer').css(
        'border-top',
        '0.113rem dashed',
      );
    }

    if (details.extra_details && details.extra_details.zomatoPay_AuthCode) {
      const paymentmodeContainerdiv = $('<div>', {
        html: `${details.extra_details.zomatoPay_amount_receivable} ${window.storeDetails.currency} Received through Zomato Pay | ${details.extra_details.zomatoPay_AuthCode}`,
      });
      $(`#previewmiscContainerid`).append(paymentmodeContainerdiv);
    }
    // await sleep(1000);
    // window.isPrintingInprogress = false;
    return 'success';
  } catch (error) {
    console.error('Message="Error While Printing', error);
  } finally {
    window.isPrintingInprogress = false;
  }
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
 * Show's preview of bill
 */
async function newprintPreview() {
  const details = $('#previewBodyid').data('data');
  const isbodyEmpty = $('body').hasClass('#previewContainer');
  if (details == undefined || isbodyEmpty) {
    return;
  }
  await setCommonbilldetails(details);

  const calculatedOrderdetails = orderCalculations(details, {
    showitemnoteonBill,
    showitemhsncodeonBill,
    showcustombillnumber,
    showDiscountreasonifapplied,
    showtaxOnChargeOnBill,
    showcustomerpaidAmount,
  });

  const order_id = details.bill_number;
  const backuporder_id = details.bill_number;
  arabqrcodeinfoObject = {};
  $('#previewTable').find('tr:not(:first)').remove();
  addComputeditemstopreview(calculatedOrderdetails.computedorderItems);

  $('#billnumberlabelid').html(calculatedOrderdetails.billnumberlabelid || '');

  $('#orderidlabel').html(calculatedOrderdetails.orderidlabel || '');

  if (details.irnSignedQr) {
    showirnQrcode(details.irnSignedQr);
  } else {
    $('#irnQrcodeCanvascontainer').hide();
  }
  if (calculatedOrderdetails.orderidlabel) {
    await showinvoiceQrcode(order_id);
    Object.assign(arabqrcodeinfoObject, {
      order_id,
    });
  } else {
    $('#orderidlabel').css('display', 'none');
    $('#invoiceebillQrcodeCanvascontainer').hide();
  }

  $('#deliveryboyInfolabelid').html('');
  if (calculatedOrderdetails.deliveryboyInfolabelid) {
    $('#deliveryboyInfodivid').show();
    $('#deliveryboyInfolabelid').html(
      calculatedOrderdetails.deliveryboyInfolabelid,
    );
  } else {
    $('#deliveryboyInfodivid').hide();
  }

  $('#totalAmountlabel').html(calculatedOrderdetails.totalAmountlabel);
  $('#discountAmountlabel').html(
    calculatedOrderdetails.discountAmountlabel || '',
  );
  $('#previewDiscountreasonlabelid').html(
    calculatedOrderdetails.previewDiscountreasonlabelid || '',
  );

  $('#cpdiscountAmountlabel').html(
    calculatedOrderdetails.cpdiscountAmountlabel || '',
  );

  if (calculatedOrderdetails.taxTotal > 0) {
    $('#taxnameDiv_id').hide();
    if (
      calculatedOrderdetails.istax_dividable &&
      window.storeDetails.country === 'India'
    ) {
      $('#taxDivid').hide();
      $('#tax_divided_div1_id,#tax_divided_div2_id').show();
      $('#cgstLabel').html(calculatedOrderdetails.cgsttaxLabel || '');
      $('#sgstLabel').html(calculatedOrderdetails.sgsttaxLabel || '');
      $('#cgstAmount').html(calculatedOrderdetails.splittedtaxAmount || '');
      $('#sgstAmount').html(calculatedOrderdetails.splittedtaxAmount || '');
    } else {
      // $('#taxDivid').show();
      $('#tax_divided_div1_id,#tax_divided_div2_id').hide();
      $('#taxAmountlabeltitle').html(
        calculatedOrderdetails.taxAmountlabeltitle || '',
      );
      $('#taxAmountlabel').html(calculatedOrderdetails.taxAmountlabel || '');
    }
  } else {
    $(
      '#taxDivid,#taxnameDiv_id,#tax_divided_div1_id,#tax_divided_div2_id',
    ).hide();
  }

  $('#previewchargesListid').empty();
  if (
    calculatedOrderdetails.computedOrderchargeslist &&
    Array.isArray(calculatedOrderdetails.computedOrderchargeslist) &&
    !details.isOnlinebill
  ) {
    for (const charge of calculatedOrderdetails.computedOrderchargeslist) {
      const nameLabel = $(`<label>`, {
        html: charge.nameLabel,
      });
      const amountLabel = $(`<label>`, {
        html: charge.amountLabel,
      });
      $(`<li>`)
        .append(nameLabel)
        .append(amountLabel)
        .appendTo(`#previewchargesListid`);

      if (charge.calculated_tax && showtaxOnChargeOnBill) {
        if (
          charge.tax_divided &&
          charge.tax_amount &&
          window.storeDetails.country === 'India'
        ) {
          splitChargestaxandappendtoview({
            taxTotal: charge.calculated_tax,
            element: `#previewchargesListid`,
            tax_amount: charge.tax_amount,
          });
        } else {
          $(`<li>`).append(charge.taxLabel).appendTo(`#previewchargesListid`);
        }
      }
    }
  }

  if (details.isOnlinebill) {
    $('#discountAmountlabel').html(
      calculatedOrderdetails.onlinediscountAmountlabel || '',
    );
    if (details.onlinetaxesTotal) {
      $('#tax_divided_div1_id,#tax_divided_div2_id').show();
      $('#cgstLabel').html(calculatedOrderdetails.onlinecgsttaxLabel);
      $('#sgstLabel').html(calculatedOrderdetails.onlinesgsttaxLabel);
      $('#cgstAmount').html(
        calculatedOrderdetails.onlinesplittedtaxAmountlabel,
      );
      $('#sgstAmount').html(
        calculatedOrderdetails.onlinesplittedtaxAmountlabel,
      );
      $('#taxAmountlabel').html(calculatedOrderdetails.taxAmountlabel);
      $('#taxDivid').show();
    } else {
      $('#taxDivid').hide();
    }
    if (details.onlinechargesTotal) {
      $('#previewchargesListid').append(
        `<li> Charges:${calculatedOrderdetails.onlinechargesTotallable}</li>`,
      );
    }
  }

  $('#previewroundedTotallabelid').html(
    calculatedOrderdetails.previewroundedTotallabelid || '',
  );
  $('#grandtotallabelID').html(
    `${currency} ${calculatedOrderdetails.grandTotal.toFixed(ROUNDOFF_UPTO)}`,
  );
  Object.assign(arabqrcodeinfoObject, {
    grandTotal: calculatedOrderdetails.grandTotal,
    taxTotal: calculatedOrderdetails.taxTotal,
  });
  await showArabtaxinfoQrcode();

  $('#grandtotalwordid').html('');
  if (calculatedOrderdetails.grandTotal && window.showbillamountinWords) {
    $('#grandtotalwordid').html(calculatedOrderdetails.words);
  }

  $('#paymentQrcodeCanvascontainerid').hide();
  if (
    Number(window.storeDetails.show_upi) &&
    // window.storeDetails.upi_id &&
    !details.field2
  ) {
    if (OnlineOrderBillingTypesByNumber.indexOf(details.billType) === -1) {
      await showUpiqrcode(calculatedOrderdetails.grandTotal, backuporder_id);
    }
  } else if (
    Number(window.storeDetails.show_upi)
    // &&
    // window.storeDetails.upi_id
  ) {
    await addPaymentQRCOde(details.field2);
  }

  $('#customerInfodivid').empty();

  if (
    details.showCustomerinfo &&
    details.customer &&
    Object.keys(details.customer).length > 0
  ) {
    let customerInfo = '';
    if (details.customer.name) {
      customerInfo = `${$.i18n.t('controller:previewController.Customer')} ${details.customer.name
        }`;
    }
    if (details.customer.phone) {
      customerInfo = `${customerInfo} (${details.customer.phone})`;
    }
    const customerNamelabel = $('<label>', {
      class: 'preview-preorderinfo',

      html: `Customer: <strong>${[details.customer?.salutation, details.customer?.name].filter(Boolean).join(' ')} (${details.customer?.phone || ''})</strong>`,
    });
    $(`#customerInfodivid`).append(customerNamelabel);

    if (details.customer.address_line1) {
      const address = details.customer.address_line1
        ? details.customer.address_line1
        : '';
      const customeaddresslabel = $('<label>', {
        html: address,
      });
      $(`#customerInfodivid`).append(customeaddresslabel);
    }

    if (showCustomergstonbill && details.customer.gstno) {
      const customergstnolabel = $('<label>', {
        html: `${$.i18n.t('controller:previewController.GSTNo')} ${details.customer.gstno
          }`,
      });
      $(`#customerInfodivid`).append(customergstnolabel);
    }

    try {
      const { due_payment } = details;
      if (
        window.showduePaymentonbill &&
        due_payment &&
        Number(due_payment) > 0
      ) {
        const customerDuepaylabel = $('<label>', {
          html: `${$.i18n.t(
            'controller:previewController.duePayment',
          )}${currency} ${Number(due_payment).toFixed(ROUNDOFF_UPTO)}`,
        });
        $(`#customerInfodivid`).append(customerDuepaylabel);
      }
    } catch (error) { }

    // check pre-order
    if (details.preorderInfo) {
      if (details.preorderInfo.delivery_at) {
        const delivery_at = moment(details.preorderInfo.delivery_at).format(
          'DD MMMM YYYY hh:mm A',
        );
        const preorderdeliverydateLabel = $('<label>', {
          html: `${$.i18n.t(
            'controller:previewController.deliveryDate',
          )} : ${delivery_at}`,
          class: 'preview-preorderinfo',
        });
        $(`#customerInfodivid`).append(preorderdeliverydateLabel);
      }
      if (details.preorderInfo.instructions) {
        const preorderinstructionsLabel = $('<label>', {
          html: `${$.i18n.t('controller:previewController.Instructions')} : ${details.preorderInfo.instructions
            }`,
          class: 'preview-preorderinfo',
        });
        $(`#customerInfodivid`).append(preorderinstructionsLabel);
      }
    }
    // show redeemed points if reward is given
    if (
      details.discounttoApply &&
      details.isloyaltyrewardDiscount &&
      details.pointsRedeemed
    ) {
      const customerredeemedpointslabel = $('<label>', {
        html: `Points Redeemed: ${details.pointsRedeemed}`,
      });
      $(`#customerInfodivid`).append(customerredeemedpointslabel);
    }

    $('#customerInfodivid').show();
  } else {
    $('#customerInfodivid').hide();
  }

  if (showcustomerpaidAmount && Number(details.cust_paid_amount)) {
    $('#billpreviewcustomerpaidContainer').show();
    $('#billpreviewcustomerpaidAmountlabelid').html(
      calculatedOrderdetails.billpreviewcustomerpaidAmountlabelid,
    );
    $('#billpreviewcustomerreturnAmountlabelid').html(
      calculatedOrderdetails.billpreviewcustomerreturnAmountlabelid || '',
    );
  } else {
    $('#billpreviewcustomerpaidContainer').hide();
  }

  $(`#previewmiscContainerid`).empty();
  $(`#previewmiscContainerid`).removeClass('botton-dashed');
  $(`#previewmiscContainerid`).addClass('botton-dashed');
  if (
    details.payment_mode &&
    String(details.payment_mode).toLowerCase() === 'split'
  ) {
    addPaymentmode(details.payment_modes);
    if (!$('#customerInfodivid').is(':empty')) {
      $(`#previewmiscContainerid`).removeClass('botton-dashed');
    } else {
      $(`#previewmiscContainerid`).addClass('botton-dashed');
    }
  }
}

/**
 * Split and add the divided charges to the given element
 * @param {} param
 */
async function splitChargestaxandappendtoview({
  taxTotal,
  element,
  tax_amount,
}) {
  const splittedTax = Number((taxTotal / 2).toFixed(ROUNDOFF_UPTO));
  // let splittedTax = roundAmountUptoDecimals(Number(taxTotal/2), ROUNDOFF_UPTO);
  const splittedPercentage = Number((tax_amount / 2).toFixed(ROUNDOFF_UPTO));
  // let splittedPercentage = roundAmountUptoDecimals((tax_amount / 2),  ROUNDOFF_UPTO);

  const cgstlabelContainer = $('<li class="billSummaryPrint">');
  const cgstLabel = $('<label>', {
    html: `${$.i18n.t(
      'controller:previewController.CGST',
    )} (${splittedPercentage}%)`,
  });
  const cgstLabelvalue = $('<label>', {
    html: ` ${currency} ${splittedTax.toFixed(ROUNDOFF_UPTO)}`,
  });
  $(cgstlabelContainer).append(cgstLabel);
  $(cgstlabelContainer).append(cgstLabelvalue);

  const sgstlabelContainer = $('<li class="billSummaryPrint">');
  const sgstLabel = $('<label>', {
    html: `${$.i18n.t(
      'controller:previewController.SGST',
    )} (${splittedPercentage}%)`,
  });
  const sgstLabelvalue = $('<label>', {
    html: ` ${currency} ${splittedTax.toFixed(ROUNDOFF_UPTO)}`,
  });
  $(sgstlabelContainer).append(sgstLabel);
  $(sgstlabelContainer).append(sgstLabelvalue);

  $(element).append(cgstlabelContainer);
  $(element).append(sgstlabelContainer);
}

async function printPreviewbysection(details) {
  try {
    window.isPrintingInprogress = true;
    // const details = $('#previewBodyid').data('data');
    const isbodyEmpty = $('body').hasClass('#previewContainer');
    if (details == undefined || isbodyEmpty) {
      return;
    }
    // Set the pageConfig if provided
    if (details.pageConfig) {
      const rawmargins = String(details.pageConfig.margins).split(' ');
      $('#previewContainerid').css({
        'margin-left': rawmargins[0],
        width: rawmargins[1],
      });
    }
    let showLogoOnPrint = false;
    if (window.showhotelLogoonbill) {
      showLogoOnPrint = true;
    }

    if (details.isdraftBill && !showLogoOnDraftBillPrint) {
      showLogoOnPrint = false;
    }

    $('#hotellogoDivid').hide();
    if (window.hotelogoFilepath && showLogoOnPrint) {
      $('#hotellogoDivid').show();
      $('#hotellogoImage').attr('src', window.hotelogoFilepath);
    } else {
      $('#hotellogoDivid').hide();
    }

    // let formattedCurrentdate = moment(new Date()).format('DD MMMM YYYY hh:mm A');
    // $("#datelabelID").html(formattedCurrentdate);
    // if ((details.isOldbill || details.isOnlinebill) && details.customDate) {
    //   $("#datelabelID").html(details.customDate);
    // }
    if (window.storeDetails.country == 'Nepal') {
      const formattedCurrentdate = moment(new Date()).format(
        'DD MMMM YYYY hh:mm A',
      );
      const date = new NepaliDate(new Date()).format('DD MMMM YYYY');
      const time = moment(new Date()).format('hh:mm A');
      const mitiDate = `${date} ${time}`;
      $('#datelabelID').html(`Date: ${formattedCurrentdate}`);
      $('#mitiDatelabelID').html(`MITI: ${mitiDate}`);
    } else {
      const formattedCurrentdate = moment(new Date()).format(
        'DD MMMM YYYY hh:mm A',
      );
      $('#datelabelID').html(formattedCurrentdate);
    }
    if ((details.isOldbill || details.isOnlinebill) && details.customDate) {
      if (window.storeDetails.country == 'Nepal') {
        const formatdate = moment(details.customDate).format('YYYY MM DD');
        const time = moment(details.customDate).format('hh:mm A');
        const date = new NepaliDate(new Date(formatdate)).format(
          'DD MMMM YYYY',
        );
        const dateTime = `${date} ${time}`;
        $('#datelabelID').html(`Date: ${details.customDate}`);
        $('#mitiDatelabelID').html(`MITI: ${dateTime}`);
      } else {
        $('#datelabelID').html(details.customDate);
      }
    }

    $('#oldbilllabelid').hide();
    if (details.isOldbill && window.storeDetails.country == 'Nepal') {
      $('#oldbilllabelid').show();
      if (details.bill_status == 'cancelled') {
        $('#oldbilllabelid').html('Sales Return');
      } else {
        $('#oldbilllabelid').html(
          `Copy of Original ${details.print_status && details.print_status > 1
            ? details.print_status
            : ''
          }`,
        );
      }
    } else if (details.isOldbill) {
      $('#oldbilllabelid').show();
      $('#oldbilllabelid').html('Reprinted Bill');
    }

    $('#datelabelID').css('display', showdatentimeonBill ? '' : 'none');

    await setStoredetails(details);
    // if (details.tableName == 'Quick Bill') {
    //   details.arabic_quick_table_name = 'فاتورة سريعة';
    // }
    if (window.selectedLanguage !== 'en') {
      if (details.tableName == 'Quick Bill' && !details.isOldbill) {
        const orderType = Object.values(window.orderTypes).find(
          (item) => item.order_type === details.order_type_flag,
        );
        const arabic_Order_type = orderType?.alternative_title;
        details.arabic_quick_table_name = arabic_Order_type;
        // ARABIC_BIILING_TYPES_BYNAME[details.order_type_flag];
      }
      if (details.isOldbill) {
        details.arabic_quick_table_name =
          window.orderTypes[Number(details.billType)].altenative_title || '';
        // ARABIC_BIILING_TYPES_BYID[details.billType];
      }
    }
    if (window.selectedLanguage == 'ar') {
      if (details.payment_mode) {
        const arabic_paymode = ARABIC_PAYMENT_MODES[details.payment_mode];
        if (arabic_paymode) details.arabic_payment_mode = arabic_paymode;
      }
    }
    if (
      (details.tableName &&
        (details.order_type_flag == 'Dine In' ||
          details.order_type_flag == 'Dine in') &&
        showTableNameOnDine) ||
      (details.isOldbill && details.billType == 1 && showTableNameOnDine) ||
      ((details.order_type_flag == 'PickUp' ||
        details.order_type_flag == 'Pickup') &&
        showTableNameOnTakeaway) ||
      (details.order_type_flag == 'Delivery' && showTableNameOnDelivery) ||
      (details.isOldbill && details.billType == 2 && showTableNameOnTakeaway) ||
      (details.isOldbill && details.billType == 3 && showTableNameOnDelivery) ||
      (details.tableName == 'Quick Bill' && showTableNameOnQuickBill) ||
      (details.isOldbill && showTableNameOnQuickBill) ||
      // details.tableName == 'Digital Order' ||
      details.tableName?.includes('Digital') ||
      details.isOnlinebill
    ) {
      if (
        selectedLanguage == 'ar' &&
        details.tableName == 'Quick Bill' &&
        details.arabic_quick_table_name
      ) {
        $('#tablenameLabelid').html(details.arabic_quick_table_name);
      } else {
        $('#tablenameLabelid').html(details.tableName);
      }
    } else {
      $('#tablenameLabelid').html(``);
    }

    if (
      (details.tableName &&
        details.customer &&
        details.customer.name &&
        details.customer.name === details.tableName &&
        (details.order_type_flag == 'Dine In' ||
          details.order_type_flag == 'Dine in') &&
        showTableNameOnDine) ||
      ((details.order_type_flag == 'PickUp' ||
        details.order_type_flag == 'Pickup') &&
        showTableNameOnTakeaway) ||
      (details.order_type_flag == 'Delivery' && showTableNameOnDelivery) ||
      (details.tableName == 'Quick Bill' && showTableNameOnQuickBill) ||
      // details.tableName == 'Digital Order' ||
      details.tableName?.includes('Digital') ||
      details.isOnlinebill
    ) {
      if (
        selectedLanguage == 'ar' &&
        details.tableName == 'Quick Bill' &&
        details.arabic_quick_table_name
      ) {
        $('#tablenameLabelid').html(details.arabic_quick_table_name);
      } else {
        $('#tablenameLabelid').html(details.tableName);
      }
    } else {
      // $('#tablenameLabelid').html(``);
    }

    if (window.selectedLanguage !== 'en' || showTranslationInBothLanguage) {
      if (details.isOldbill) {
        details.arabic_order_type_flag =
          window.orderTypes[Number(details.billType)].altenative_title || '';
        // ARABIC_BIILING_TYPES_BYID[details.billType];
      } else {
        const orderType = Object.values(window.orderTypes).find(
          (item) => item.order_type === details.order_type_flag,
        );
        const arabicOrderType = orderType?.alternative_title;
        details.arabic_order_type_flag = arabicOrderType;
        // ARABIC_BIILING_TYPES_BYNAME[details.order_type_flag];
      }
    }

    if (
      (details.paymentAdded &&
        details.payment_mode &&
        String(details.payment_mode).toLowerCase() !== 'split' &&
        (details.order_type_flag == 'Dine In' ||
          details.order_type_flag == 'Dine in') &&
        showPaymentModeOnDine) ||
      (details.paymentAdded &&
        (details.order_type_flag == 'PickUp' ||
          details.order_type_flag == 'Pickup') &&
        showPaymentModeOnTakeaway) ||
      (details.paymentAdded &&
        details.order_type_flag == 'Delivery' &&
        showPaymentModeOnDelivery) ||
      (details.paymentAdded &&
        details.tableName == 'Quick Bill' &&
        showPaymentModeOnQuickBill) ||
      // details.tableName == 'Digital Order' ||
      details.tableName?.includes('Digital') ||
      details.isOnlinebill
    ) {
      if (selectedLanguage == 'ar') {
        if (details.arabic_payment_mode) {
          $('#paymodeId').html(
            `${$.i18n.t('controller:previewController.payMode')} ${details.arabic_payment_mode
            }`,
          );
        } else {
          $('#paymodeId').html(
            `${$.i18n.t('controller:previewController.payMode')} ${details.payment_mode
            }`,
          );
        }
      } else {
        $('#paymodeId').html(
          `${$.i18n.t('controller:previewController.payMode')} ${details.payment_mode
          }`,
        );
      }
      $('#paymodeId').show();
      if (details.payment_mode === 'None') {
        $('#paymodeId').hide();
      }
      $('#draftBilllabelid').hide();
    } else {
      $('#paymodeId').hide();
    }

    // set order time
    if (showOrderTimeOnBill && details && details.kotcreatedAt) {
      $('#orderTimelabelid').show();
      const timeString = moment(details.kotcreatedAt).format('hh:mm A');
      $('#orderTimelabelid').html(`Order Placed Time: ${timeString}`);
    } else {
      $('#orderTimelabelid').hide();
    }
    if (details.isdraftBill) {
      $('#draftBilllabelid').html('Customer Copy');
      $('#draftBilllabelid').show();
      if (details.paymentAdded) {
        $('#paymodeId').hide();
      }
    } else {
      $('#draftBilllabelid').hide();
    }

    if (details.isOnlinebill) {
      $('#draftBilllabelid').hide();
    }

    if (details.isOldbill) {
      // $("#paymodeId").html(`${$.i18n.t('controller:previewController.payMode')} ${details.payment_mode}`);
      if (
        (details.billType == 1 && showPaymentModeOnDine) ||
        (details.billType == 2 && showPaymentModeOnTakeaway) ||
        (details.billType == 3 && showPaymentModeOnDelivery) ||
        (details.billType == 0 && showPaymentModeOnQuickBill) ||
        details.billType > 3
      ) {
        $('#paymodeId').show();
        if (selectedLanguage == 'ar') {
          if (details.arabic_payment_mode) {
            $('#paymodeId').html(
              `${$.i18n.t('controller:previewController.payMode')} ${details.arabic_payment_mode
              }`,
            );
          } else {
            $('#paymodeId').html(
              `${$.i18n.t('controller:previewController.payMode')} ${details.payment_mode
              }`,
            );
          }
        } else {
          $('#paymodeId').html(
            `${$.i18n.t('controller:previewController.payMode')} ${details.payment_mode
            }`,
          );
        }
        if (details.payment_mode === 'None') {
          $('#paymodeId').hide();
        }
      } else {
        $('#paymodeId').hide();
      }

      $('#oldbilllabelid').show();
      $('#billstatuslabelid').html(`Bill Status: ${details.bill_status}`);
      $('#draftBilllabelid').hide();
      // $('#paymodeId').show();
    } else {
      $('#oldbilllabelid').hide();
      $('#billstatuslabelid').hide();
    }

    if (
      (details.order_type_flag &&
        (details.order_type_flag == 'Dine In' ||
          details.order_type_flag == 'Dine in') &&
        showOrderTypeOnDine) ||
      (details.isOldbill && details.billType == 1 && showOrderTypeOnDine) ||
      ((details.order_type_flag == 'PickUp' ||
        details.order_type_flag == 'Pickup') &&
        showOrderTypeOnTakeaway) ||
      (details.order_type_flag == 'Delivery' && showOrderTypeOnDelivery) ||
      (details.isOldbill && details.billType == 2 && showOrderTypeOnTakeaway) ||
      (details.isOldbill && details.billType == 3 && showOrderTypeOnDelivery) ||
      (details.order_type_flag == 'Quick Bill' && showOrderTypeOnQuickBill) ||
      (details.tableName == 'Quick Bill' && showOrderTypeOnQuickBill) ||
      (details.isOldbill &&
        details.billType == 0 &&
        showOrderTypeOnQuickBill) ||
      // details.tableName == 'Digital Order' ||
      details.tableName?.includes('Digital') ||
      details.isOnlinebill
    ) {
      $('#ordertypeLabel').css('display', '');
      if (showTranslationInBothLanguage) {
        if (details.isOldbill) {
          $('#ordertypeLabel').html(
            `${window.orderTypes[Number(details.billType)].order_type}  ${details.arabic_order_type_flag ? `| ${details.arabic_order_type_flag}` : ''}`, // BillingTypes[details.billType]
          );
        } else {
          $('#ordertypeLabel').html(
            `${details.order_type_flag} ${details.arabic_order_type_flag ? `| ${details.arabic_order_type_flag}` : ''}`,
          );
        }
      } else if (selectedLanguage == 'ar') {
        $('#ordertypeLabel').html(
          details.arabic_order_type_flag ? details.arabic_order_type_flag : '',
        );
      } else if (details.isOldbill) {
        $('#ordertypeLabel').html(
          window.orderTypes[Number(details.billType)].order_type,
        ); // BillingTypes[details.billType]
      } else {
        $('#ordertypeLabel').html(details.order_type_flag);
      }
    } else {
      $('#ordertypeLabel').css('display', 'none');
    }

    billlabelTitle = $.i18n.t('controller:previewController.billNo');
    if (details.custombilltitle) {
      billlabelTitle = details.custombilltitle;
    }

    if (details.customKotTitle) {
      kotLabelTitle = details.customKotTitle;
    }

    if (details.deliveryboyName) {
      $('#deliveryboyLabelid').show();
      $('#deliveryboyLabelid').html(
        `${$.i18n.t('controller:previewController.DBoy')} ${details.deliveryboyName
        }`,
      );
    } else {
      $('#deliveryboyLabelid').hide();
    }

    if (showWaiternameonbill && details.waiter) {
      $('#billprintWaiterlabelid').show();
      $('#billprintWaiterlabelid').html(
        `${$.i18n.t('controller:previewController.Waiter')} ${details.waiter}`,
      );
    } else {
      $('#billprintWaiterlabelid').hide();
    }

    if (showCoversonbill && details.persons) {
      $('#guestsonbilllabelid').show();
      $('#guestsonbilllabelid').html(
        `${$.i18n.t('controller:previewController.Guests')}: ${details.persons}`,
      );
    } else {
      $('#guestsonbilllabelid').hide();
    }
    if (
      showCaptainnameonbill &&
      details.createdBy &&
      window.storeDetails.username !== details.createdBy
    ) {
      let captainName = details.createdBy;
      const captain = window.users.find(
        (c) => c.username === details.createdBy,
      );
      if (captain && captain.name) {
        captainName = captain.name;
      }
      $('#billprintCaptainlabelid').show();
      $('#billprintCaptainlabelid').html(
        `${$.i18n.t('controller:previewController.Captain')} ${captainName}`,
      );
    } else {
      $('#billprintCaptainlabelid').hide();
    }

    if (details.showotponBill) {
      $('#orderOtplabelid').show();
      $('#orderOtplabelid').html(details.showotponBill);
    } else {
      $('#orderOtplabelid').hide();
    }

    if (details.deliveryBy) {
      $('#deliverybylabelId').show();
      $('#deliverybylabelId').html(details.deliveryBy);
    } else {
      $('#deliverybylabelId').hide();
    }

    // Check if store name is to be overriden
    if (details.overrideStorename) {
      $('#hotelnameID').html(details.overrideStorename);
    }
    arabqrcodeinfoObject = {};
    let order_id = details.bill_number;
    if (details?.extra_details?.customOrderId) {
      order_id = details.extra_details.customOrderId;
    }
    const backuporder_id = details.bill_number;
    const bill_number = details.order_id;

    const { discount } = details;
    const { discount_type } = details;
    const raw_discounted_product_groups = details.discounted_product_groups;
    const discounted_product_groups = raw_discounted_product_groups
      ? String(raw_discounted_product_groups).split(',')
      : [];

    const { couponDisountamt } = details;
    const { couponDisounttype } = details;
    let taxDivided = false;

    let taxInclusive = false;
    let taxMethod = details.tax_name;
    let istax_dividable = false;

    const kot_numbers = details.kot_numbers
      ? details.kot_numbers.join(', ')
      : '';

    $(`.preview-preorderinfo`).remove();
    if (details.customer && details.is_pre_order) {
      const preorderLabel = $('<div>', {
        html: $.i18n.t('controller:previewController.preOrder'),
        class: 'titleDiv preview-preorderinfo',
      });
      $(`#orderidlabel`).after(preorderLabel);
      details.showCustomerinfo = true;
    }

    let showBillNumberOnPrint = false;
    if (window.showBillnoonbill) {
      showBillNumberOnPrint = true;
    }

    if (details.isdraftBill && !showBillNumberOnDraftBillPrint) {
      showBillNumberOnPrint = false;
    }

    $('#billnumberlabelid').html(``);
    if (bill_number && bill_number != 0 && showBillNumberOnPrint) {
      $('#billnumberlabelid').show();
      let bill_number_text = bill_number;
      if (showcustombillnumber) {
        if (seperateBillNumber) {
          if (details.custom_bill_number) {
            bill_number_text = details.custom_bill_number;
          } else if (details.billType == 8 || details.billType == 40) {
            bill_number_text = `${global.storeDetails.bill_number_prefix || ''
              }${bill_number}`;
          } else if (details.isOnlinebill) {
            bill_number_text = `${global.storeDetails.secondary_bill_prefix || ''
              }${bill_number}`;
          }
        } else if (details.custom_bill_number) {
          bill_number_text = details.custom_bill_number;
        } else {
          bill_number_text = `${global.storeDetails.bill_number_prefix || ''
            }${bill_number}`;
        }
      }
      if (details.customBillname) {
        $('#billnumberlabelid').html(
          `${details.customBillname}:${bill_number_text} `,
        );
      } else {
        $('#billnumberlabelid').html(
          `${billlabelTitle} : ${bill_number_text} `,
        );
      }
      Object.assign(arabqrcodeinfoObject, {
        bill_number: bill_number_text,
      });
    } else {
      $('#billnumberlabelid').hide();
    }

    let showOrderNumberOnPrint = false;
    if (window.showOrdernoonbill) {
      showOrderNumberOnPrint = true;
    }

    if (details.isdraftBill && !showOrderNumberOnDraftBillPrint) {
      showOrderNumberOnPrint = false;
    }

    if (
      details.extra_details &&
      details.extra_details.order_number &&
      showOrderNumberOnPrint
    ) {
      $('#ordernumberlabelid').css('display', '');
      if (details.customOrderNumberName) {
        $('#ordernumberlabelid').html(
          `${details.customOrderNumberName}: ${details.extra_details.order_number}`,
        );
      } else {
        $('#ordernumberlabelid').html(
          `Order No: ${details.extra_details.order_number || ''}`,
        );
      }
    } else {
      $('#ordernumberlabelid').css('display', 'none');
    }

    if (kot_numbers && showKotNumbers) {
      $('#kotnumberlabelid').show();
      if (kot_numbers) {
        $('#kotnumberlabelid').html(`${kotLabelTitle}: ${kot_numbers}`);
      }
    } else {
      $('#kotnumberlabelid').css('display', 'none');
    }

    if (details.irnSignedQr) {
      showirnQrcode(details.irnSignedQr);
    } else {
      $('#irnQrcodeCanvascontainer').hide();
    }
    let showOrderIdOnPrint = false;
    if (window.showOrderidonbill) {
      showOrderIdOnPrint = true;
    }

    if (details.isdraftBill && !showOrderIdOnDraftBillPrint) {
      showOrderIdOnPrint = false;
    }
    if (order_id) {
      await showinvoiceQrcode(order_id);
    }
    if (order_id && showOrderIdOnPrint) {
      if (
        window.globalmaskOrderidinpreview &&
        String(order_id).length - maskSize > 0
      ) {
        const maskedResult = maskString(
          order_id,
          0,
          String(order_id).length - maskSize,
          '*',
        );
        if (maskedResult) {
          order_id = `${maskedResult.maskedString} <h6>${maskedResult.remianingString}</h6>`;
        }
      }
      $('#orderidlabel').show();
      $('#orderidlabel').html(
        `${$.i18n.t('controller:previewController.OrderId')}: ${order_id} `,
      );
      if (details.irnNumber) {
        $('#irnNumberidlabel').css('display', '');
        $('#irnNumberidlabel').html(`IRN: ${details.irnNumber}`);
      } else {
        $('#irnNumberidlabel').css('display', 'none');
      }
      Object.assign(arabqrcodeinfoObject, {
        order_id,
      });
    } else {
      $('#orderidlabel').hide();
      $('#invoiceebillQrcodeCanvascontainer').hide();
    }

    if (details.extra_details && details.extra_details.parent_order_id) {
      $('#parentorderidlabel').css('display', '');
      $('#parentorderidlabel').html(
        `Parent Order ID: ${details.extra_details.parent_order_id}`,
      );
    } else {
      $('#parentorderidlabel').css('display', 'none');
    }

    if (details.extra_details && details.extra_details.external_order_id) {
      $('#externalorderidlabel').css('display', '');
      $('#externalorderidlabel').html(
        `${$.i18n.t('controller:previewController.EXTERNAL_ORDER_ID')} ${details.extra_details.external_order_id}`,
      );
    } else {
      $('#externalorderidlabel').css('display', 'none');
    }

    if (details.extdeliveryBoy) {
      $('#deliveryboyInfodivid').show();
      $('#deliveryboyInfolabelid').html(
        `${details.extdeliveryBoy.name} (${details.extdeliveryBoy.phone})`,
      );
    } else {
      $('#deliveryboyInfodivid').hide();
    }

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

    // show print count if provided
    $('#printcountLabelId').remove();
    if (showbillprintCount && details.printCount) {
      const printcountLabel = $('<div>', {
        html: `${$.i18n.t('controller:previewController.billCopyPrintCount')}${details.printCount
          } `,
        class: 'grandtotalwordclass',
        id: 'printcountLabelId',
      });
      $(`#footerDivid`).after(printcountLabel);
    }

    $('#sectionsWrapperid').empty();
    // eslint-disable-next-line no-restricted-syntax
    for (const group of window.globalproductGroups) {
      let grandTotal = 0;
      let taxTotal = 0;
      let taxPercent = 0;
      let index = 1;
      let order_subtotal = 0;
      let sectionhasItems = false;
      let chargesamounttoExludefromtax = 0;
      let recalculateTax = false;
      const taxedProductgrps = {};
      const sectionDiscount = 0;
      const sectionCouponDiscount = 0;
      let sectionOrderDiscount = 0;
      let hideTaxOnBill = false;
      MULTI_TAX = false;

      let currenttable = $(TABLEFOR_PREVIEW, {
        id: `tableid_${group.id}`,
      });

      if (showTranslationInBothLanguage) {
        currenttable = $(TABLEFOR_PREVIEW_IN_BOTH_LANG, {
          id: `tableid_${group.id}`,
        });
      }

      const allItemlevelcharges = [];
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

      let sectionItemQty = 0;
      let totalwithouttax = 0;
      // eslint-disable-next-line no-loop-func
      details.items.forEach((item) => {
        if (item.product_group_id == group.id) {
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

          if (
            !MULTI_TAX &&
            item.productGrptaxes &&
            item.productGrptaxes.length
          ) {
            const tax = item.productGrptaxes[0];
            if (tax && tax.extra_details) {
              hideTaxOnBill = tax?.extra_details?.hideTaxOnBill;
            }
          }
          sectionhasItems = true;
          recalculateTax = true;
          item.amount = Number(item.amount);
          if (details.isOldbill && !details.isOnlinebill && item.total !== 0) {
            item.amount = Number(
              Number(item.price * item.quantity).toFixed(ROUNDOFF_UPTO),
            );
          }

          grandTotal += Number(item.amount);
          order_subtotal += Number(item.amount);
          finalorder_subtotal += Number(item.amount);
          item.recalculatedAmount = Number(item.amount);
          item.quantity = Number(item.quantity);
          sectionItemQty += Number(item.quantity);
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

          let itemchargesTitles = '';
          if (
            item.itemlevelCharges &&
            Array.isArray(item.itemlevelCharges) &&
            item.itemlevelCharges.length > 0
          ) {
            let itemlevelchargesTotal = 0;
            // eslint-disable-next-line no-restricted-syntax
            for (const charge of item.itemlevelCharges) {
              recalculateTax = true;
              const chargeTaxpercentage = 0;
              let chargeAmount = charge.amount;
              const calculateChargeonamount = item.amount;
              // if (item.discount_rate > 0 && item.pricebeforeDiscount) {
              //   calculateChargeonamount = item.pricebeforeDiscount;
              // }
              if (charge.per_or_fixed == 1) {
                chargeAmount = Number(
                  ((calculateChargeonamount * chargeAmount) / 100).toFixed(
                    ROUNDOFF_UPTO,
                  ),
                );
              } else if (details.isOnlinebill) {
                chargeAmount = Number(chargeAmount);
              } else {
                chargeAmount = Number(chargeAmount) * Number(item.quantity);
              }

              chargeAmount = Number(chargeAmount.toFixed(ROUNDOFF_UPTO));

              itemlevelchargesTotal += Number(chargeAmount);
              if (charge.calculate_tax_for_item_charges == 0) {
                chargesamounttoExludefromtax += Number(chargeAmount);
                finalchargesamounttoExludefromtax += Number(chargeAmount);
              } else {
                // order_subtotal += Number(chargeAmount);
                charge.calculated_tax = (
                  (chargeTaxpercentage * chargeAmount) /
                  100
                ).toFixed(ROUNDOFF_UPTO);
                Object.assign(item, {
                  recalculatedAmount:
                    item.recalculatedAmount + Number(chargeAmount),
                });
                // item.recalculatedAmount =
                //   item.recalculatedAmount + chargeAmount;
              }
              let chargeName;
              if (charge.per_or_fixed == 1) {
                chargeName = `${charge.title} (${charge.amount}%) -${chargeAmount} `;
              } else {
                chargeName = `${charge.title} -${chargeAmount} `;
              }
              itemchargesTitles += `${chargeName} \n`;
              const chargeDetail = {
                chargeName:
                  charge.title +
                  (charge.per_or_fixed == 1
                    ? `(${charge.amount}%)`
                    : `(${charge.amount})`),
                chargeAmount: Number(chargeAmount),
              };
              allItemlevelcharges.push(chargeDetail);
            }
            finaltotalCharges += itemlevelchargesTotal;
            finalitemlevelChargestotal += itemlevelchargesTotal;
            grandTotal += itemlevelchargesTotal;
            // order_subtotal += itemlevelchargesTotal;
          }
          // eslint-disable-next-line no-use-before-define
          addSectionitem(
            item,
            index,
            currenttable,
            itemchargesTitles,
            showitemnoteonBill,
            details.isOnlinebill,
          );
          index++;
        }
      });
      if (taxMethod == undefined) {
        taxMethod = details.tax_name;
      }
      istax_dividable = taxDivided;

      if (sectionhasItems) {
        const sectionNamelabel = $('<label>', {
          html: group.product_group_name,
          class: 'titleDiv',
        });
        $('#sectionsWrapperid').append(sectionNamelabel);
        $('#sectionsWrapperid').append(currenttable);
        if (itemDetailsColumns && itemDetailsColumns.qty === 1) {
          $('.previewItemQtyClass').hide();
        }

        if (itemDetailsColumns && itemDetailsColumns.rate === 1) {
          $('.previewItemRateClass').hide();
        }

        if (itemDetailsColumns && itemDetailsColumns.total === 1) {
          $('.previewItemTotalClass').hide();
        }
        if (grandTotal > 0) {
          // let totalLabel = $('<label>', {
          //   html: `${$.i18n.t(
          //     'controller:previewController.Amount',
          //   )}: ${currency} ${grandTotal.toFixed(ROUNDOFF_UPTO)} `,
          //   class: 'preview-label-for-total',
          // });

          const totalLabel = $('<div>', {
            class: 'total-container billSummaryPrint',
          });

          // Create label for Amount text
          const amountLabel = $('<label>', {
            text: $.i18n.t('controller:previewController.Amount'),
            class: 'amount-label',
          });

          // Create label for Grand Total
          const grandTotalLabel = $('<label>', {
            text: `${currency} ${grandTotal.toFixed(ROUNDOFF_UPTO)}`,
            class: 'grand-total-label',
          });

          if (showTranslationInBothLanguage) {
            // totalLabel = $('<label>', {
            //   html: `${$.i18n.t(
            //     'bothLanguage.Amount',
            //   )}: ${currency} ${grandTotal.toFixed(ROUNDOFF_UPTO)} `,
            //   class: 'preview-label-for-total',
            // });
            const amountLabel = $('<label>', {
              text: `${$.i18n.t('bothLanguage.Amount')}:`,
              class: 'preview-label-for-total preview-amount-label',
            });

            // Create label for grand total value
            const grandTotalLabel = $('<label>', {
              text: `${currency} ${grandTotal.toFixed(ROUNDOFF_UPTO)}`,
              class: 'preview-label-for-total preview-grandtotal-label',
            });
          }
          // Append both labels into the div
          totalLabel.append(amountLabel);
          totalLabel.append(grandTotalLabel);
          $('#sectionsWrapperid').append(totalLabel);
        }

        baseamounTotal += order_subtotal;
        totalwithouttax = order_subtotal;
        let discountApplied = false;
        let coupondiscountApplied = false;
        let discounttoApply = 0;
        let coupondiscounttoApply = 0;
        if (
          sectionhasDiscount &&
          !details.isOnlinebill &&
          String(discount_type) &&
          discount
        ) {
          discounttoApply = discount;
          finalorder_subtotal += order_subtotal;

          order_subtotal = Number(order_subtotal.toFixed(window.ROUNDOFF_UPTO));
          grandTotal = Number(grandTotal.toFixed(window.ROUNDOFF_UPTO));

          // baseamounTotal += order_subtotal;
          if (discount_type == '1') {
            // discounttoApply = ((grandTotal * discount) / 100).toFixed(
            //   ROUNDOFF_UPTO
            // );
            discounttoApply = Number(
              ((order_subtotal * discount) / 100).toFixed(ROUNDOFF_UPTO),
            );
          }
          const DiscountTotalbeforeDistribution = discounttoApply;
          let itemSubtotalBeforeDiscountApply = 0;
          let itemSubtotalAfterDiscountApply = 0;
          if (
            Number(grandTotal.toFixed(window.ROUNDOFF_UPTO)) >= discounttoApply
          ) {
            const splittedDiscountamount = Number(
              discounttoApply / order_subtotal,
            );
            details.items.map((item) => {
              if (item.product_group_id == group.id) {
                itemSubtotalBeforeDiscountApply += Number(
                  item.recalculatedAmount,
                );
                const discountAmounttominus =
                  Number(item.recalculatedAmount) * splittedDiscountamount;
                // discountAmounttominus = Number(
                //   discountAmounttominus.toFixed(ROUNDOFF_UPTO),
                // );
                // order_level_discount += Number(
                //   discountAmounttominus.toFixed(ROUNDOFF_UPTO),
                // );
                sectionOrderDiscount += Number(discountAmounttominus);
                order_level_discount += Number(
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
                  : Object.assign(item, { recalculatedAmount });
                itemSubtotalAfterDiscountApply += Number(
                  item.recalculatedAmount,
                );
              }
            });
            const DiscountTotalAfterDistribution = sectionOrderDiscount;
            discounttoApply = sectionOrderDiscount;
            discounttoApply = discounttoApply.toFixed(window.ROUNDOFF_UPTO);
            grandTotal -= discounttoApply;
            discountApplied = true;
            finaldiscounttoApply += discounttoApply;

            const before = parseFloat(DiscountTotalbeforeDistribution) || 0;
            const after = parseFloat(DiscountTotalAfterDistribution) || 0;

            const discountDiff =
              Number(before.toFixed(7)) - Number(after.toFixed(7));
            if (discountDiff) {
              const matchedItem = details.items.find(
                (item) => item.product_group_id === group.id,
              );
              // billItems.map((item) => {
              const amountAfterDiscountDiff =
                Number(matchedItem.recalculatedAmount) + discountDiff;
              if (amountAfterDiscountDiff > 0) {
                matchedItem.recalculatedAmount = amountAfterDiscountDiff;
                discounttoApply = Number(DiscountTotalbeforeDistribution);
                // return;
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
              const matchedItem = details.items.find(
                (item) => item.product_group_id === group.id,
              );
              matchedItem.recalculatedAmount =
                Number(matchedItem.recalculatedAmount) -
                Number(subTotalDifference);
            }

            let discountTitle = $.i18n.t(
              'controller:previewController.Discount',
            );
            if (details.discount_title) {
              discountTitle = `${details.discount_title}`;
            }
            if (details.isloyaltyrewardDiscount) {
              discountTitle = details?.rewardTitle
                ? `Loyalty Discount(${details.rewardTitle})`
                : 'Loyalty Discount'; // || 'Loyalty Discount :';
            }

            totalwithouttax -= discounttoApply;
            const discountLabel = $('<div>', {
              class: 'preview-discount-wrapper billSummaryPrint',
            });
            if (details.discount_type == '1') {
              // discountLabel = $('<label>', {
              //   html: `${discountTitle} (${details.discount}%): ${currency} ${Number(
              //     discounttoApply,
              //   ).toFixed(ROUNDOFF_UPTO)} `,
              //   class: 'preview-label-for-total',
              // });

              // Label for discount title + percent
              const discountTitleLabel = $('<label>', {
                text: `${discountTitle} (${details.discount}%):`,
                class: '',
              });

              // Label for discount applied amount
              const discountAmountLabel = $('<label>', {
                text: `${currency} ${Number(discounttoApply).toFixed(ROUNDOFF_UPTO)}`,
                class: '',
              });

              // Append labels inside wrapper
              discountLabel.append(discountTitleLabel);
              discountLabel.append(discountAmountLabel);
            } else if (Number(details.discount_per_or_fixed) == 1) {
              // discountLabel = $('<label>', {
              //   html: `${discountTitle} (${details.discount}%): ${currency} ${Number(
              //     discounttoApply,
              //   ).toFixed(ROUNDOFF_UPTO)} `,
              //   class: 'preview-label-for-total',
              // });
              // Label for discount title + percent
              const discountTitleLabel = $('<label>', {
                text: `${discountTitle} (${details.discount}%):`,
                class: '',
              });

              // Label for discount applied amount
              const discountAmountLabel = $('<label>', {
                text: `${currency} ${Number(discounttoApply).toFixed(ROUNDOFF_UPTO)}`,
                class: '',
              });

              // Append labels inside wrapper
              discountLabel.append(discountTitleLabel);
              discountLabel.append(discountAmountLabel);
            } else {
              // discountLabel = $('<label>', {
              //   html: `${discountTitle}: ${currency} ${Number(
              //     discounttoApply,
              //   ).toFixed(ROUNDOFF_UPTO)} `,
              //   class: 'preview-label-for-total',
              // });
              // Label for discount title + percent
              const discountTitleLabel = $('<label>', {
                text: `${discountTitle}:`,
                class: '',
              });

              // Label for discount applied amount
              const discountAmountLabel = $('<label>', {
                text: `${currency} ${Number(discounttoApply).toFixed(ROUNDOFF_UPTO)}`,
                class: '',
              });

              // Append labels inside wrapper
              discountLabel.append(discountTitleLabel);
              discountLabel.append(discountAmountLabel);
            }
            $('#sectionsWrapperid').append(discountLabel);
            if (showDiscountreasonifapplied && details.instructions) {
              const response = getOrderlevelinstructions(details.instructions);
              // const discountreasonLabel = $('<label>', {
              //   html: `${$.i18n.t(
              //     'controller:previewController.discountReason',
              //   )}${response.discount || ''}`,
              //   class: 'preview-label-for-total',
              // });
              // $('#sectionsWrapperid').append(discountreasonLabel);

              const reasonLabel = `<label class='' >${$.i18n.t('controller:previewController.discountReason')}</label>`;
              const reasonValueLael = `<label class='' >${response.discount || ''}</label>`;

              $('#sectionsWrapperid').append(
                `<li class="billSummaryPrint"> ${reasonLabel}${reasonValueLael}</li>`,
              );
            }
          }
        }

        if (
          sectionhasDiscount &&
          !details.isOnlinebill &&
          couponDisountamt &&
          couponDisountamt != 0
        ) {
          coupondiscounttoApply = couponDisountamt;
          if (Number(couponDisounttype) == 1) {
            coupondiscounttoApply = Number(
              ((order_subtotal * couponDisountamt) / 100).toFixed(
                ROUNDOFF_UPTO,
              ),
            );
          }
          if (grandTotal >= coupondiscounttoApply) {
            const splittedDiscountamount = Number(
              coupondiscounttoApply / (order_subtotal - finaldiscounttoApply),
            );

            // eslint-disable-next-line array-callback-return
            details.items.map((item) => {
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
            coupondiscountApplied = true;
            finalcoupondiscounttoApply += coupondiscounttoApply;

            totalwithouttax -= coupondiscounttoApply;

            // const cpdiscountLabel = $('<label>', {
            //   html: `Coupon Discount : ${currency} ${Number(
            //     coupondiscounttoApply,
            //   ).toFixed(ROUNDOFF_UPTO)} `,
            //   class: 'preview-label-for-total',
            // });
            const cpdiscountLabel = $('<div>', {
              class: 'preview-cpdiscount-wrapper billSummaryPrint',
            });

            // Label for title
            const cpDiscountTitleLabel = $('<label>', {
              text: 'Coupon Discount :',
              class: '',
            });

            // Label for amount
            const cpDiscountAmountLabel = $('<label>', {
              text: `${currency} ${Number(coupondiscounttoApply).toFixed(ROUNDOFF_UPTO)}`,
              class: '',
            });

            // Append labels inside the div
            cpdiscountLabel.append(cpDiscountTitleLabel);
            cpdiscountLabel.append(cpDiscountAmountLabel);
            $('#sectionsWrapperid').append(cpdiscountLabel);
          }
        }

        if (!details.isOnlinebill) {
          if (discountApplied || coupondiscountApplied || recalculateTax) {
            let taxtocalculateonAmount = grandTotal;
            if (chargesamounttoExludefromtax > 0) {
              taxtocalculateonAmount -= chargesamounttoExludefromtax;
            }

            // new item wise
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

              const previousTaxtotal = [taxTotal];
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
                          currentTax.cal_method ===
                          TAX_CALCULATION_ON.PREVIOUSTAX
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
                          // currentTax.cal_method ===
                          //   TAX_CALCULATION_ON.PREVIOUSTAX
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

                        if (currentTax) {
                          taxlistTomaintain.push({
                            name: currentTax.tax_name,
                            tax_percent: currentTax.tax_perct,
                            amount: currentTaxtotal,
                            tax_inclusive: isInclusive,
                            taxDivided: Boolean(currentTax.is_devidable),
                            hideTaxOnBill:
                              currentTax?.extra_details?.hideTaxOnBill,
                          });
                        }

                        if (isInclusive) {
                          inclusiveTotal += currentTaxtotal;
                        } else {
                          exclusiveTotal += currentTaxtotal;
                        }
                        // previousTaxtotal=currentTax.TaxValue;
                        totalwithoutTax = applyTaxon;
                      }
                    });
                  }
                });
              }

              // add the tax details to the extra details object
              // Object.assign(extra_details, {
              //   ...(inclusiveTotal && {
              //     inclusive_tax: inclusiveTotal,
              //   }),
              //   ...(exclusiveTotal && {
              //     exlusive_tax: exclusiveTotal,
              //   }),
              //   tax: taxlistTomaintain,
              // });

              // Now add the exclusive tax total to order total
              if (exclusiveTotal > 0) {
                grandTotal += exclusiveTotal;
              }

              taxTotal = Number(
                Number(inclusiveTotal + exclusiveTotal).toFixed(ROUNDOFF_UPTO),
              );
              finalGrandtotal += grandTotal;
              if (
                !hideTotalWithoutTax &&
                taxapplicableAmount > 0 &&
                taxapplicableAmount !== order_subtotal
              ) {
                // let totalwithoutLabel = $('<label>', {
                //   html: `${$.i18n.t(
                //     'controller:previewController.Totalwithouttax',
                //   )}: ${currency} ${taxapplicableAmount.toFixed(ROUNDOFF_UPTO)} `,
                //   class: 'preview-label-for-total',
                // });
                // Wrapper div for total without tax
                const totalwithoutLabel = $('<div>', {
                  class: 'preview-totalwithouttax-wrapper billSummaryPrint',
                });

                // Label for title
                let totalWithoutTaxTitleLabel = $('<label>', {
                  text: `${$.i18n.t(
                    'controller:previewController.Totalwithouttax',
                  )}:`,
                  class: '',
                });

                // Label for amount
                let totalWithoutTaxAmountLabel = $('<label>', {
                  text: `${currency} ${taxapplicableAmount.toFixed(ROUNDOFF_UPTO)}`,
                  class: '',
                });

                if (showTranslationInBothLanguage) {
                  // totalwithoutLabel = $('<label>', {
                  //   html: `${$.i18n.t(
                  //     'bothLanguage.Totalwithouttax',
                  //   )}: ${currency} ${taxapplicableAmount.toFixed(ROUNDOFF_UPTO)} `,
                  //   class: 'preview-label-for-total',
                  // });

                  totalWithoutTaxTitleLabel = $('<label>', {
                    text: $.i18n.t('bothLanguage.Totalwithouttax'),
                    class: '',
                  });

                  // Label for amount
                  totalWithoutTaxAmountLabel = $('<label>', {
                    text: `${currency} ${taxapplicableAmount.toFixed(ROUNDOFF_UPTO)}`,
                    class: '',
                  });
                }

                // Append both labels into the wrapper
                totalwithoutLabel.append(totalWithoutTaxTitleLabel);
                totalwithoutLabel.append(totalWithoutTaxAmountLabel);
                $('#sectionsWrapperid').append(totalwithoutLabel);
              }
              renderTaxforSectionwiseBilling(taxlistTomaintain);
            } else {
              taxTotal = 0;
              details.items.forEach((item) => {
                if (item.product_group_id == group.id) {
                  taxTotal += calculateTaxForItem(item);
                }
              });
              // totalwithouttax = totalwithouttax +  taxtocalculateonAmount;
              // totalwithouttax = taxtocalculateonAmount - taxTotal;
              if (!taxInclusive) {
                grandTotal += taxTotal;
                // finalGrandtotal += grandTotal;
              } else {
                totalwithouttax =
                  order_subtotal -
                  discounttoApply -
                  coupondiscounttoApply -
                  taxTotal;
              }

              finalGrandtotal += grandTotal;
              if (
                !hideTotalWithoutTax &&
                totalwithouttax > 0 &&
                totalwithouttax !== order_subtotal
              ) {
                // let totalwithoutLabel = $('<label>', {
                //   html: `${$.i18n.t(
                //     'controller:previewController.Totalwithouttax',
                //   )}: ${currency} ${totalwithouttax.toFixed(ROUNDOFF_UPTO)} `,
                //   class: 'preview-label-for-total',
                // });

                // Wrapper div
                const totalwithoutLabel = $('<div>', {
                  class: 'preview-totalwithouttax-wrapper billSummaryPrint',
                });

                // Label for title
                let totalWithoutTaxTitleLabel = $('<label>', {
                  text: $.i18n.t(
                    'controller:previewController.Totalwithouttax',
                  ),
                });

                // Label for amount
                let totalWithoutTaxAmountLabel = $('<label>', {
                  text: `${currency} ${totalwithouttax.toFixed(ROUNDOFF_UPTO)}`,
                });

                if (showTranslationInBothLanguage) {
                  // totalwithoutLabel = $('<label>', {
                  //   html: `${$.i18n.t(
                  //     'bothLanguage.Totalwithouttax',
                  //   )}: ${currency} ${totalwithouttax.toFixed(ROUNDOFF_UPTO)} `,
                  //   class: 'preview-label-for-total',
                  // });

                  totalWithoutTaxTitleLabel = $('<label>', {
                    text: `${$.i18n.t('bothLanguage.Totalwithouttax')}:`,
                  });

                  // Label for amount
                  totalWithoutTaxAmountLabel = $('<label>', {
                    text: `${currency} ${totalwithouttax.toFixed(ROUNDOFF_UPTO)}`,
                  });
                }

                // Append both labels to wrapper
                totalwithoutLabel.append(totalWithoutTaxTitleLabel);
                totalwithoutLabel.append(totalWithoutTaxAmountLabel);
                $('#sectionsWrapperid').append(totalwithoutLabel);
              }

              const tax_type = taxInclusive
                ? `(${taxPercent ? `${taxPercent}%` : ''} Incl.)`
                : `(${taxPercent ? `${taxPercent}%` : ''})`;
              if (!taxMethod) {
                taxMethod = '';
              }
              if (!hideTaxOnBill && taxPercent) {
                if (
                  istax_dividable &&
                  window.storeDetails.country === 'India'
                ) {
                  const splittax = Number(taxTotal.toFixed(ROUNDOFF_UPTO)) / 2;
                  const splitPercent =
                    Number(taxPercent.toFixed(ROUNDOFF_UPTO)) / 2;
                  //           const cgstlabel = $('<label>', {
                  //             html: `${$.i18n.t('controller:previewController.CGST')}
                  // (${splitPercent} % ) : ${currency} ${splittax.toFixed(ROUNDOFF_UPTO)} `,
                  //             class: 'preview-label-for-total',
                  //           });
                  // Wrapper div for CGST
                  const cgstlabel = $('<div>', {
                    class: 'preview-cgst-wrapper billSummaryPrint',
                  });

                  // Label for CGST title + percent
                  const cgstTitleLabel = $('<label>', {
                    text: `${$.i18n.t('controller:previewController.CGST')} (${splitPercent} % ) :`,
                    class: '',
                  });

                  // Label for CGST amount
                  const cgstAmountLabel = $('<label>', {
                    text: `${currency} ${splittax.toFixed(ROUNDOFF_UPTO)}`,
                    class: '',
                  });

                  cgstlabel.append(cgstTitleLabel);
                  cgstlabel.append(cgstAmountLabel);
                  // const sgstlabel = $('<label>', {
                  //   html: `${$.i18n.t(
                  //     'controller:previewController.SGST',
                  //   )} (${splitPercent} % ) : ${currency} ${splittax.toFixed(
                  //     ROUNDOFF_UPTO,
                  //   )} `,
                  //   class: 'preview-label-for-total',
                  // });

                  const sgstlabel = $('<div>', {
                    class: 'preview-sgst-wrapper billSummaryPrint',
                  });

                  // Label for SGST title + percent
                  const sgstTitleLabel = $('<label>', {
                    text: `${$.i18n.t('controller:previewController.SGST')} (${splitPercent} % ) :`,
                    class: '',
                  });

                  // Label for SGST amount
                  const sgstAmountLabel = $('<label>', {
                    text: `${currency} ${splittax.toFixed(ROUNDOFF_UPTO)}`,
                    class: '',
                  });

                  // Append labels into wrapper div
                  sgstlabel.append(sgstTitleLabel);
                  sgstlabel.append(sgstAmountLabel);
                  $('#sectionsWrapperid').append(cgstlabel);
                  $('#sectionsWrapperid').append(sgstlabel);
                } else if (taxTotal) {
                  // const taxLabel = $('<label>', {
                  //   html: `${$.i18n.t('controller:previewController.Total')} ${
                  //     taxMethod || ''
                  //   }: ${tax_type} ${currency} ${taxTotal.toFixed(
                  //     ROUNDOFF_UPTO,
                  //   )} `,
                  //   class: 'preview-label-for-total',
                  // });
                  const taxlabelContainer = $('<div>', {
                    class: 'preview-cgst-wrapper billSummaryPrint',
                  });
                  const label1 = $('<label>', {
                    html: `${$.i18n.t('controller:previewController.Total')} ${taxMethod || ''} ${tax_type}:`,
                  });

                  const label2 = $('<label>', {
                    html: `${currency} ${taxTotal.toFixed(ROUNDOFF_UPTO)}`,
                  });
                  taxlabelContainer.append(label1);
                  taxlabelContainer.append(label2);

                  $('#sectionsWrapperid').append(taxlabelContainer);
                }
              }
            }
          }
        }

        if (details.isOnlinebill) {
          finalGrandtotal += grandTotal;
        }
        // $("#previewitemchargesListid").empty();
        if (
          !showItemlevelchargesSeperately &&
          allItemlevelcharges &&
          Array.isArray(allItemlevelcharges)
        ) {
          const groupedCharges = _.chain(allItemlevelcharges)
            .groupBy('chargeName')
            .map((platform, id) => ({
              chargeName: id,
              totalAmount: _.sumBy(platform, 'chargeAmount'),
            }))
            .value();
          const itemcharge = $('<ul>', {
            id: 'previewitemchargesListid',
            class: 'preview-label-for-total',
          });
          if (groupedCharges) {
            $('#itemlevelChargestotaldivID').css('display', ' ');
            if (groupedCharges) {
              // eslint-disable-next-line array-callback-return
              groupedCharges.map((charge) => {
                itemcharge.append(
                  `<li> ${charge.chargeName} : ${currency} ${charge.totalAmount.toFixed(ROUNDOFF_UPTO)}  </li>`,
                );
              });
            }
            $('#sectionsWrapperid').append(itemcharge);
          }
        } else {
          $('#itemlevelChargestotaldivID').css('display', 'none');
        }

        const qtyAndTotalconatiner = $('<div>', {
          class: 'bold-label bottom-dash qtyAndTotalSection',
        });
        let sectionTotalQtylabel = $('<label>', {
          html: `${$.i18n.t(
            'controller:previewController.TotalQty',
          )} ${sectionItemQty.toFixed(window.ROUNDOFF_UPTO)} `,
          class: 'has-i18n',
        });

        if (showTranslationInBothLanguage) {
          sectionTotalQtylabel = $('<label>', {
            html: `${$.i18n.t('bothLanguage.TotalQty')} ${sectionItemQty.toFixed(window.ROUNDOFF_UPTO)}`,
            class: 'has-i18n bothlangelem',
          });
        }
        // preview-label-for-total
        let sectionTotallabel = $('<label>', {
          html: `${$.i18n.t(
            'controller:previewController.totalAmount',
          )} ${currency} ${grandTotal.toFixed(ROUNDOFF_UPTO)} `,
          class: 'section-total-items',
        });

        if (showTranslationInBothLanguage) {
          sectionTotallabel = $('<label>', {
            html: `${$.i18n.t(
              'bothLanguage.totalAmount',
              // eslint-disable-next-line no-undef
            )} ${currency} ${grandTotal.toFixed(ROUNDOFF_UPTO)} `,
            class: 'section-total-items bothlangelem',
          });
        }
        $(qtyAndTotalconatiner).append(sectionTotalQtylabel);
        $(qtyAndTotalconatiner).append(sectionTotallabel);
        $('#sectionsWrapperid').append(qtyAndTotalconatiner);

        // $("#sectionsWrapperid").append(sectionTotallabel);
        // finalGrandtotal += grandTotal;
        finaltaxTotal += taxTotal;
      }
    }
    if ($.i18n && $.i18n.language !== 'en') {
      $('#sectionsWrapperid .has-i18n').localize();
    }
    if (details.isOnlinebill) {
      if (details.discounttoApply != undefined && details.discounttoApply > 0) {
        let iswithExternaldiscount = '';
        if (
          details.total_external_discount &&
          details.total_external_discount != 0
        ) {
          details.discounttoApply =
            Number(details.discounttoApply) +
            Number(details.total_external_discount);
          iswithExternaldiscount = ' (with Ext. disc) ';
        }

        if (finalGrandtotal > details.discounttoApply) {
          finalGrandtotal -= details.discounttoApply;
          if (iswithExternaldiscount) {
            finalGrandtotal += Number(details.total_external_discount);
          }
        }
        let discountTitle = $.i18n.t('controller:previewController.Discount');
        if (details.discount_title) {
          if (details.discount_type) {
            discountTitle += `(${details.discount_title}) (${details.discount}%)`;
          } else {
            discountTitle += `(${details.discount_title})`;
          }
        }

        const onlinediscLabel = $('<label>', {
          html: `${discountTitle} ${iswithExternaldiscount} ${currency} ${details.discounttoApply} `,
          class: 'preview-label-for-total',
        });

        const onlinediscountLabel = $('<div>', {
          class: 'preview-discount-wrapper billSummaryPrint',
        });

        // Label for discount title + percent
        const onlinediscountTitleLabel = $('<label>', {
          text: `${discountTitle} ${iswithExternaldiscount}`,
          class: '',
        });

        // Label for discount applied amount
        const onlinediscountAmountLabel = $('<label>', {
          text: `${currency} ${details.discounttoApply}`,
          class: '',
        });

        // Append labels inside wrapper
        onlinediscountLabel.append(onlinediscountTitleLabel);
        onlinediscountLabel.append(onlinediscountAmountLabel);
        $('#sectionsWrapperid').append(onlinediscountLabel);
      }

      if (details.onlinetaxesTotal) {
        const taxtoshowonBill = details.onlinetaxesTotal;
        let onlinetaxsplitPercent = Number(taxtoshowonBill) / 2;
        onlinetaxsplitPercent = Number(
          onlinetaxsplitPercent.toFixed(ROUNDOFF_UPTO),
        );
        const cgstlabel = $('<label>', {
          html: `${$.i18n.t(
            'controller:previewController.CGST',
          )} ${currency} ${onlinetaxsplitPercent.toFixed(window.ROUNDOFF_UPTO)} `,
          class: 'preview-label-for-total',
        });
        const sgstlabel = $('<label>', {
          html: `${$.i18n.t(
            'controller:previewController.SGST',
          )} ${currency} ${onlinetaxsplitPercent.toFixed(window.ROUNDOFF_UPTO)} `,
          class: 'preview-label-for-total',
        });

        if (istax_dividable && window.storeDetails.country === 'India') {
          $('#sectionsWrapperid').append(cgstlabel);
          $('#sectionsWrapperid').append(sgstlabel);
        }
        // const onlinetaxLabel = $('<label>', {
        //   html: `${$.i18n.t('controller:previewController.Total')} ${$.i18n.t(
        //     'controller:previewController.Tax',
        //   )} ${currency} ${Number(taxtoshowonBill.toFixed(ROUNDOFF_UPTO))} `,
        //   class: 'preview-label-for-total',
        // });
        const onlinetaxLabel = $('<div>', {
          class: 'preview-onlinetax-wrapper billSummaryPrint',
        });

        // Label for "Total Tax:"
        const onlineTaxTitleLabel = $('<label>', {
          text: `${$.i18n.t('controller:previewController.Total')} ${$.i18n.t('controller:previewController.Tax')}:`,
          class: '',
        });

        // Label for amount
        const onlineTaxAmountLabel = $('<label>', {
          text: `${currency} ${Number(taxtoshowonBill.toFixed(ROUNDOFF_UPTO))}`,
          class: '',
        });

        // Append labels into wrapper
        onlinetaxLabel.append(onlineTaxTitleLabel);
        onlinetaxLabel.append(onlineTaxAmountLabel);
        $('#sectionsWrapperid').append(onlinetaxLabel);

        // add the tax to grand total
        if (!taxInclusive) {
          finalGrandtotal += Number(
            Number(taxtoshowonBill).toFixed(ROUNDOFF_UPTO),
          );
        }

        let taxableAmount =
          finalorder_subtotal -
          details.onlinetaxesTotal -
          details.discounttoApply;

        if (details.billType === KEETA_BILLING_FLAG) {
          taxableAmount = finalorder_subtotal - details.onlinetaxesTotal;
        }

        if (
          (!hideTotalWithoutTax &&
            Number(taxableAmount) &&
            taxInclusive &&
            taxableAmount !== finalorder_subtotal) ||
          (!hideTotalWithoutTax && taxableAmount && taxInclusive)
        ) {
          const totalTaxToshow =
            finalorder_subtotal -
            (Number(onlinetaxsplitPercent) + Number(onlinetaxsplitPercent));

          const totalwithoutLabel = $('<div>', {
            class: 'preview-totalwithouttax-wrapper billSummaryPrint',
          });

          // Label for title
          let totalWithoutTaxTitleLabel = $('<label>', {
            text: $.i18n.t('controller:previewController.Totalwithouttax'),
          });

          // Label for amount
          let totalWithoutTaxAmountLabel = $('<label>', {
            text: `${currency} ${totalTaxToshow.toFixed(ROUNDOFF_UPTO)}`,
          });

          if (showTranslationInBothLanguage) {
            // totalwithoutLabel = $('<label>', {
            //   html: `${$.i18n.t(
            //     'bothLanguage.Totalwithouttax',
            //   )}: ${currency} ${totalwithouttax.toFixed(ROUNDOFF_UPTO)} `,
            //   class: 'preview-label-for-total',
            // });

            totalWithoutTaxTitleLabel = $('<label>', {
              text: `${$.i18n.t('bothLanguage.Totalwithouttax')}:`,
            });

            // Label for amount
            totalWithoutTaxAmountLabel = $('<label>', {
              text: `${currency} ${totalTaxToshow.toFixed(ROUNDOFF_UPTO)}`,
            });
          }

          // Append both labels to wrapper
          totalwithoutLabel.append(totalWithoutTaxTitleLabel);
          totalwithoutLabel.append(totalWithoutTaxAmountLabel);
          $('#sectionsWrapperid').append(totalwithoutLabel);
        } else if (
          (!hideTotalWithoutTax &&
            Number(taxableAmount) &&
            !taxInclusive &&
            taxableAmount !== finalorder_subtotal) ||
          (!hideTotalWithoutTax && taxableAmount && taxInclusive)
        ) {
          const totalwithoutLabel = $('<div>', {
            class: 'preview-totalwithouttax-wrapper billSummaryPrint',
          });

          // Label for title
          let totalWithoutTaxTitleLabel = $('<label>', {
            text: $.i18n.t('controller:previewController.Totalwithouttax'),
          });

          // Label for amount
          let totalWithoutTaxAmountLabel = $('<label>', {
            text: `${currency} ${taxableAmount.toFixed(ROUNDOFF_UPTO)}`,
          });

          if (showTranslationInBothLanguage) {
            // totalwithoutLabel = $('<label>', {
            //   html: `${$.i18n.t(
            //     'bothLanguage.Totalwithouttax',
            //   )}: ${currency} ${totalwithouttax.toFixed(ROUNDOFF_UPTO)} `,
            //   class: 'preview-label-for-total',
            // });

            totalWithoutTaxTitleLabel = $('<label>', {
              text: `${$.i18n.t('bothLanguage.Totalwithouttax')}:`,
            });

            // Label for amount
            totalWithoutTaxAmountLabel = $('<label>', {
              text: `${currency} ${taxableAmount.toFixed(ROUNDOFF_UPTO)}`,
            });
          }

          // Append both labels to wrapper
          totalwithoutLabel.append(totalWithoutTaxTitleLabel);
          totalwithoutLabel.append(totalWithoutTaxAmountLabel);
          $('#sectionsWrapperid').append(totalwithoutLabel);
        }
      }

      // if (details.onlinechargesTotal) {
      //   finalGrandtotal += Number(
      //     Number(details.onlinechargesTotal).toFixed(ROUNDOFF_UPTO),
      //   );
      //   $('#previewchargesListid').append(
      //     `<li> Charges:${Number(details.onlinechargesTotal).toFixed(
      //       ROUNDOFF_UPTO,
      //     )}</li>`,
      //   );
      //   $('#previewchargesWrapperid').css('display', '');
      // } else {
      //   $('#previewchargesWrapperid').css('display', 'none');
      // }
    }
    if (details.isOldbill) {
      if (
        details.extra_details &&
        details.extra_details.reelo &&
        details.extra_details.reelo_redeemed_amount
      ) {
        finalGrandtotal -= Number(details.extra_details.reelo_redeemed_amount);
        const discountTitle = 'Loyalty Discount';
        // $('#reelodiscountAmountlabel').html(
        //   `${discountTitle} ${currency} ${details.extra_details.reelo_redeemed_amount}`,
        // );

        const reeloDiscDiv = $('<div>', {
          class: 'orderlevel-discount-wrapper billSummaryPrint',
        });

        // Label for title
        const reeloDiscTitleLabel = $('<label>', {
          text: `${discountTitle}:`,
          class: '',
        });

        // Label for amount
        const reeloDisclAmountLabel = $('<label>', {
          text: `${currency} ${details.extra_details.reelo_redeemed_amount}`,
          class: '',
        });

        // Append them to wrapper
        reeloDiscDiv.append(reeloDiscTitleLabel);
        reeloDiscDiv.append(reeloDisclAmountLabel);

        // Render inside the target element
        $('#reelodiscountAmountlabel').html(reeloDiscDiv);
        $('#reelodiscountDivid').show();
      } else {
        $('#reelodiscountDivid').hide();
      }
    } else if (
      !raw_discounted_product_groups &&
      // discount &&
      details.reelo_redeemed_amount
    ) {
      finalGrandtotal -= Number(details.reelo_redeemed_amount);
      const discountTitle = 'Loyalty Discount';
      // $('#reelodiscountAmountlabel').html(
      //   `${discountTitle} ${currency} ${details.reelo_redeemed_amount}`,
      // );
      const reeloDiscDiv = $('<div>', {
        class: 'orderlevel-discount-wrapper billSummaryPrint',
      });

      // Label for title
      const reeloDiscTitleLabel = $('<label>', {
        text: `${discountTitle}:`,
        class: '',
      });

      // Label for amount
      const reeloDisclAmountLabel = $('<label>', {
        text: `${currency} ${details.reelo_redeemed_amount}`,
        class: '',
      });

      // Append them to wrapper
      reeloDiscDiv.append(reeloDiscTitleLabel);
      reeloDiscDiv.append(reeloDisclAmountLabel);

      // Render inside the target element
      $('#reelodiscountAmountlabel').html(reeloDiscDiv);

      $('#reelodiscountDivid').show();
    } else {
      $('#reelodiscountDivid').hide();
    }

    let isLoyaltyDiscount = false;
    if (details.extra_details) {
      const extDetails = safeParse(details.extra_details);
      if (extDetails && extDetails.reelo_redeemed_amount) {
        isLoyaltyDiscount = true;
      }
    }

    if (discount && !isLoyaltyDiscount && !discounted_product_groups.length) {
      $('#orderLeveldiscountDivid').show();

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
        details.discounttoApply = discounttoApply;

        const splittedDiscountamount = Number(
          discounttoApply / finalorder_subtotal,
        );
        details.items.map((item) => {
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
        details.discounttoApply = order_level_discount;
        // details.discounttoApply = discounttoApply;
        discounttoApply = order_level_discount;
        // if (!details.isOldbill) {
        finalGrandtotal -= discounttoApply;
        discounttoApply = discounttoApply.toFixed(window.ROUNDOFF_UPTO);

        // check if there is any difference after discount distribution on item level
        discountDiff =
          Number(DiscountTotalbeforeDistribution) -
          Number(DiscountTotalAfterDistribution);
        if (discountDiff) {
          details.items.map((item) => {
            const amountAfterDiscountDiff =
              Number(item.recalculatedAmount) + discountDiff;
            if (amountAfterDiscountDiff > 0) {
              item.recalculatedAmount = amountAfterDiscountDiff;
              details.discounttoApply = Number(DiscountTotalbeforeDistribution);
              discounttoApply = Number(DiscountTotalbeforeDistribution);
            }
          });
        }
        // const discountTitle = details.discount_title;
        let discountTitle = $.i18n.t('controller:previewController.Discount');
        if (details.discount_title) {
          if (details.discount_type) {
            discountTitle = `${details.discount_title} (${details.discount}%)`;
          } else {
            discountTitle = `${details.discount_title}`;
          }
        }
        // $('#orderLeveldiscountAmountlabel').html(
        //   `${discountTitle}: ${currency} ${discounttoApply}`,
        // );
        const orderLevelDiv = $('<div>', {
          class: 'orderlevel-discount-wrapper billSummaryPrint',
        });

        // Label for title
        const orderLevelTitleLabel = $('<label>', {
          text: `${discountTitle}:`,
          class: '',
        });

        // Label for amount
        const orderLevelAmountLabel = $('<label>', {
          text: `${currency} ${discounttoApply}`,
          class: '',
        });

        // Append them to wrapper
        orderLevelDiv.append(orderLevelTitleLabel);
        orderLevelDiv.append(orderLevelAmountLabel);

        // Render inside the target element
        $('#orderLeveldiscountDivid').html(orderLevelDiv);

        if (showDiscountreasonifapplied && details.instructions) {
          const response = getOrderlevelinstructions(details.instructions);
          if (response.discount) {
            $('#orderLeveldiscountReasonlabel').html(
              `${$.i18n.t('controller:previewController.discountReason')}${response.discount || ''
              }`,
            );
          } else {
            $('#orderLeveldiscountReasonlabel').hide();
          }
        } else {
          $('#orderLeveldiscountReasonlabel').hide();
        }

        // }
      } else {
        details.discounttoApply = 0;
        $('#orderLeveldiscountDivid').hide();
      }
    } else {
      $('#orderLeveldiscountDivid').hide();
    }

    $('#previewchargesListid').empty();
    if (
      details.charges &&
      Array.isArray(details.charges) &&
      !details.isOnlinebill
    ) {
      const { charges } = details;
      const isOldBill = !!(details.isOldbill != undefined && details.isOldbill);
      if (charges && charges.length > 0) {
        $('#previewchargesListid').show();
        let chargesTotal = 0;
        charges.forEach((charge) => {
          let chargeAmount = Number(charge.amount);
          let calculatedChargeamount = chargeAmount;
          let chargeAmountbeforeTax = chargeAmount;
          if (charge.calculated_tax && !charge.is_tax_included) {
            calculatedChargeamount -= Number(charge.calculated_tax);
          }

          const previewchargeTitle = charge.title;
          if (isOldBill) {
            // let chargesamounttoShowforoldbill = Number(charge.amount);
            const chargesamounttoShowforoldbill = Number(
              calculatedChargeamount,
            );

            const nameLabel = `<label class='chargename' >${previewchargeTitle}:</label>`;
            const amountLabel = `<label class='amountLabel' >${currency}${chargesamounttoShowforoldbill.toFixed(ROUNDOFF_UPTO)} </label>`;

            $('#previewchargesListid').append(
              `<li class="billSummaryPrint"> ${nameLabel}${amountLabel}</li>`,
            );
          } else {
            const postFix = charge.per_or_fixed == '1' ? ' % ):' : ' ):';
            if (charge.per_or_fixed == 1) {
              // chargeAmount = Number((((baseamounTotal - Number(details.discounttoApply)) * chargeAmount) / 100).toFixed(
              //   ROUNDOFF_UPTO
              // ));
              const discountToapply = details.discounttoApply
                ? Number(details.discounttoApply)
                : 0;
              if (charge.extra_details) {
                const extra_details = safeParse(charge.extra_details);
                switch (Number(extra_details.applicable_on_amount)) {
                  case 0:
                    chargeAmount = Number(
                      (
                        ((baseamounTotal - details.discounttoApply || 0) *
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
                        ((baseamounTotal - discounttoApply || 0) *
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
                //       ((baseamounTotal - discountToapply) * chargeAmount) /
                //       100
                //     ).toFixed(ROUNDOFF_UPTO),
                //   );
                // }
              } else {
                chargeAmount = Number(
                  (
                    ((baseamounTotal - discountToapply) * chargeAmount) /
                    100
                  ).toFixed(ROUNDOFF_UPTO),
                );
              }
            }
            chargeAmountbeforeTax = chargeAmount;
            // check if the tax is available
            if (charge.is_tax_applicable && charge.tax_amount) {
              // let calculatedChargestax = chargeAmount * (charge.tax_amount / 100);
              // calculatedChargestax = Number(Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO));
              let calculatedChargestax = 0;
              if (charge.is_tax_included) {
                //    //    taxPerct = Number(((chargeAmount / (100 + charge.tax_amount)) * (charge.tax_amount/2)).toFixed(ROUNDOFF_UPTO));
                // let taxPerct;
                if (charge.tax_divided) {
                  calculatedChargestax = Number(
                    (
                      (chargeAmount / (100 + charge.tax_amount)) *
                      charge.tax_amount
                    ).toFixed(ROUNDOFF_UPTO),
                  );
                  // taxPerct = roundAmountUptoDecimals(Number(((chargeAmount / (100 + (charge.tax_amount / 2))) * (charge.tax_amount / 2)), ROUNDOFF_UPTO));
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
                  taxPerct = Number(
                    (chargeAmount * (charge.tax_amount / 2)) / 100,
                  ).toFixed(ROUNDOFF_UPTO);
                  // taxPerct = roundAmountUptoDecimals(Number((chargeAmount * (charge.tax_amount / 2)) / 100), ROUNDOFF_UPTO);
                  calculatedChargestax = taxPerct * 2;
                  calculatedChargestax = Number(
                    Number(calculatedChargestax).toFixed(ROUNDOFF_UPTO),
                  );
                  // calculatedChargestax = roundAmountUptoDecimals(Number(calculatedChargestax), ROUNDOFF_UPTO);
                } else {
                  calculatedChargestax =
                    chargeAmount * (charge.tax_amount / 100);
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
              // previewchargeTitle += `- Tax(${ charge.tax_amount } %)`;
              Object.assign(charge, {
                is_tax_included: charge.is_tax_included,
                calculated_tax: calculatedChargestax,
              });
            }
            // const nameLabel = `<label class='chargename' >${previewchargeTitle}(${charge.amount}${postFix}</label>`;
            const nameLabel = `<label class='chargename' >${previewchargeTitle}:</label>`;
            const amountLabel = `<label class='amountLabel' >${currency}${Number(
              chargeAmountbeforeTax,
            ).toFixed(ROUNDOFF_UPTO)}</label>`;

            $('#previewchargesListid').append(
              `<li class="billSummaryPrint"> ${nameLabel}${amountLabel}</li>`,
            );
            $('#previewchargesListid').show();
          }

          if (charge.calculated_tax && showtaxOnChargeOnBill) {
            const chargetaxContainer = $('<li>');
            if (
              charge.tax_divided &&
              charge.tax_amount &&
              window.storeDetails.country === 'India'
            ) {
              splitChargestaxandappendtoview({
                taxTotal: charge.calculated_tax,
                element: `#previewchargesListid`,
                tax_amount: charge.tax_amount,
              });
            } else {
              const chargetaxName =
                charge.tax_title ||
                $.i18n.t('controller:previewController.Tax');
              // $('<label>', {
              //   html: `${chargetaxName} (${
              //     charge.tax_amount
              //   }%) - ${currency} ${Number(charge.calculated_tax).toFixed(
              //     ROUNDOFF_UPTO,
              //   )} `,
              // }).appendTo(chargetaxContainer);

              const taxlabelContainer = $('<li class="billSummaryPrint">');
              const taxLabel = $('<label>', {
                html: `${chargetaxName} (${charge.tax_amount}%): `,
              });
              const taxLabelvalue = $('<label>', {
                html: ` ${currency} ${Number(charge.calculated_tax).toFixed(
                  ROUNDOFF_UPTO,
                )}`,
              });
              $(taxlabelContainer).append(taxLabel);
              $(taxlabelContainer).append(taxLabelvalue);
              $(chargetaxContainer).append(taxlabelContainer);
            }

            $('#previewchargesListid').append(chargetaxContainer);
          }

          chargesTotal += Number(chargeAmount);
        });

        if (chargesTotal >= 0) {
          finalGrandtotal += chargesTotal;
          $('#previewchargesWrapperid').css('display', '');
        }
      } else {
        $('#previewchargesWrapperid').css('display', 'none');
      }
    } else {
      $('#previewchargesWrapperid').css('display', 'none');
    }

    if (details.isOnlinebill && details.onlinechargesTotal) {
      finalGrandtotal += Number(
        Number(details.onlinechargesTotal).toFixed(ROUNDOFF_UPTO),
      );

      details.charges.forEach((charge) => {
        // $('#previewchargesListid').append(
        //   `<li> ${charge.title}: ${Number(
        //     charge.amount || charge.value,
        //   ).toFixed(ROUNDOFF_UPTO)}</li>`,
        // );
        const li = $('<li>', { class: 'preview-charge-item' });

        // Wrapper div
        const chargeDiv = $('<div>', {
          class: 'preview-charge-wrapper billSummaryPrint',
        });

        // Label for title
        const chargeTitleLabel = $('<label>', {
          text: `${charge.title}:`,
          class: '',
        });

        // Label for amount
        const chargeAmountLabel = $('<label>', {
          text: Number(charge.amount || charge.value).toFixed(ROUNDOFF_UPTO),
          class: '',
        });

        // Append labels into wrapper div
        chargeDiv.append(chargeTitleLabel);
        chargeDiv.append(chargeAmountLabel);

        // Append div into li
        li.append(chargeDiv);

        // Append li to UL
        $('#previewchargesListid').append(li);
      });
      // $('#previewchargesListid').append(
      //   `<li> Charges:${Number(details.onlinechargesTotal).toFixed(
      //     ROUNDOFF_UPTO,
      //   )}</li>`,
      // );

      $('#previewchargesWrapperid').css('display', '');
    } else {
      // $('#previewchargesWrapperid').css('display', 'none');
    }
    if (DO_BILL_ROUNDOFF) {
      try {
        finalGrandtotal = Number(finalGrandtotal.toFixed(ROUNDOFF_UPTO));

        const previousTotal = finalGrandtotal;

        if (details.isOldbill && !details?.extra_details?.roundedAmount) {
        } else {
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
            $('#previewroundedTotallabelid').show();
            $('#previewroundedTotallabelid').empty();
            const roundedAmount = finalGrandtotal - previousTotal;
            // $('#previewroundedTotallabelid').html(
            //   `${$.i18n.t('controller:previewController.roundedAmt')}
            //   ${roundedAmount > 0 ? '+' : ''}
            //   ${roundedAmount.toFixed(ROUNDOFF_UPTO)} `,
            // );

            const roundedLabel = `<label class='' >${$.i18n.t('controller:previewController.roundedAmt')}</label>`;
            const roundedValueLael = `<label class='' >${roundedAmount > 0 ? '+' : ''} ${Number(
              roundedAmount.toFixed(window.ROUNDOFF_UPTO),
            )}</label>`;

            $('#previewroundedTotallabelid').append(
              `<li class="billSummaryPrint"> ${roundedLabel}${roundedValueLael}</li>`,
            );
            // ${roundedAmount > 0 ? '+' : '-'}
          } else {
            $('#previewroundedTotallabelid').hide();
          }
        }
      } catch (error) { }
    }

    $('#grandtotallabelID').html(
      `${currency} ${finalGrandtotal.toFixed(ROUNDOFF_UPTO)}`,
    );

    if (
      details &&
      details.extra_details &&
      details.extra_details.currencyConversionDetails
    ) {
      $('#grandtotalInForeignCurrencylabelID').show();
      const { amountAfterConvert, currency } =
        details.extra_details.currencyConversionDetails;
      const label = `${amountAfterConvert} ${currency} Received`;
      $('#grandtotalInForeignCurrencylabelID').html(label);
    } else {
      $('#grandtotalInForeignCurrencylabelID').hide();
    }

    Object.assign(arabqrcodeinfoObject, {
      grandTotal: finalGrandtotal,
      taxTotal: finaltaxTotal,
    });

    let showZatcaInvoiceOnPrint = false;
    if (showzatcaeinvoiceQrcode) {
      showZatcaInvoiceOnPrint = true;
    }

    if (details.isdraftBill && !showZatcaQrOnDraftBillPrint) {
      showZatcaInvoiceOnPrint = false;
    }

    if (showZatcaInvoiceOnPrint) {
      await showArabtaxinfoQrcode();
    }

    if (details && details.order_note) {
      $('#orderNoteDivId').show();
      $('#orderNoteDivId').html(`Order Note: ${details.order_note}`);
    } else {
      $('#orderNoteDivId').hide();
    }
    if (
      window.storeDetails &&
      window.storeDetails.show_poweredby &&
      $('#appversionDivid').is(':empty')
    ) {
      $('#appversionDivid').html(
        `${$.i18n.t(
          'controller:previewController.poweredByTMBillV',
        )}${APP_VERSION} `,
      );
    }

    if (finalGrandtotal && window.showbillamountinWords) {
      const words = numberTowords(
        finalGrandtotal.toFixed(window.ROUNDOFF_UPTO),
        window.storeDetails.currency_name,
        window.storeDetails.sub_currency_name,
      );
      if (words) {
        $('#grandtotalwordid').html(words);
        $('#grandtotalwordid').css('display', '');
      } else {
        $('#grandtotalwordid').css('display', 'none');
      }
    } else {
      $('#grandtotalwordid').css('display', 'none');
    }

    $('#paymentQrcodeCanvascontainerid').hide();
    if (Number(window.storeDetails.show_upi)) {
      let showUpi = true;
      // don't show upi on bill print for online orders
      if (OnlineOrderBillingTypesByNumber.indexOf(details.billType) >= 0) {
        showUpi = false;
      }

      if (
        details.billType === OnlineBillingTypeByName.SWIGGY &&
        details.payment_qr_url
      ) {
        showUpi = true;
      }
      if (showUpi) {
        // OnlineOrderBillingTypesByNumber.indexOf(details.billType) === -1
        // if details having qr code generated then no need to generate again
        let upiString;
        if (details.field2 && details.field2.length) {
          upiString = details.field2;
        }

        if (details.payment_qr_url && details.payment_qr_url.length) {
          upiString = details.payment_qr_url;
        }
        if (upiString) {
          await addPaymentQRCOde(upiString);
        } else {
          await showUpiqrcode(finalGrandtotal, backuporder_id);
        }
      }
    }

    if (showZatcaInvoiceOnPrint) {
      showZatcaQRCode({
        order_id: details.bill_number,
        store_id: window.storeDetails.store_id,
        isOldbill: details.isOldbill,
        zatca_status: details.zatca_status,
        mpos_zatca_status: details.mpos_zatca_status,
      });
    }
    // else if (
    //   Number(window.storeDetails.show_upi) &&
    //   window.storeDetails.upi_id
    // ) {
    //   await addPaymentQRCOde(details.field2);
    // }
    $(`#customerInfodivid`).empty();

    if (
      details.showCustomerinfo &&
      details.customer &&
      Object.keys(details.customer).length > 0
    ) {
      let customerInfo = '';
      let { name } = details.customer;
      if (details.customer.name) {
        if (details.customer.salutation) {
          if (/^\d+$/.test(details.customer.salutation)) {
            const salutation =
              SALUTATIONS_VALUES[Number(details.customer.salutation)];
            if (salutation) {
              name = `${salutation} ${name}`;
            }
          } else {
            name = `${details.customer.salutation} ${name}`;
          }
        }
        customerInfo = `${$.i18n.t('controller:previewController.Customer')} <b>${name}</b> `;
      }
      if (details.customer.phone) {
        let dial_code = '';
        if (details.customer.dial_code) {
          dial_code = `+${details.customer.dial_code}`;
        }
        // customerInfo = `${customerInfo} (${dial_code} ${details.customer.phone})`;
        customerInfo = `${customerInfo} <b> \u202A(${dial_code} ${details.customer.phone})\u202C </b>`;
      }

      if (details.customer.alternate_phone) {
        let alternate_dial_code = '';
        if (details.customer.alternate_dial_code) {
          alternate_dial_code = `+${details.customer.alternate_dial_code}`;
        }
        customerInfo = `${customerInfo} <b> \u202A(${alternate_dial_code} ${details.customer.alternate_phone})\u202C </b>`;
      }

      if (details.customer && details.customer.extra_details) {
        const extra_details = safeParse(details.customer.extra_details);
        if (
          extra_details &&
          extra_details.extraPhones &&
          extra_details.extraPhones.length
        ) {
          extra_details.extraPhones.forEach((contact) => {
            customerInfo = `${customerInfo} <b> \u202A(+${contact.alternate_dial_code} ${contact.alternate_phone})\u202C </b>`;
          });
        }
      }
      let safeSalutation = details.customer?.salutation;
      let safeCustomerName = details.customer?.name || details.customer_name;
      if (safeSalutation && /^\d+$/.test(safeSalutation)) {
        const mappedSalutation = SALUTATIONS_VALUES[Number(safeSalutation)];
        if (mappedSalutation) {
          safeSalutation = mappedSalutation;
        }
      }

      const customerNamelabel = $('<label>', {
        class: 'preview-preorderinfo',

        html: `Customer: <strong>${[safeSalutation, safeCustomerName].filter(Boolean).join(' ')} (${details.customer?.phone || ''})</strong>`,
      });
      $(`#customerInfodivid`).append(customerNamelabel);

      let showAddress = true;
      if (
        (details.order_type_flag === 'PickUp' ||
          details.order_type_flag == 'Pickup') &&
        !showCustomerAddressOnPickupBill
      ) {
        showAddress = false;
      }

      if (showAddress) {
        // Location:
        if (details.customer.location) {
          const customeLocationlabel = $('<label>', {
            html: `Location: <b>${details.customer.location}</b>`,
          });
          $(`#customerInfodivid`).append(customeLocationlabel);
        }

        // Area:
        if (details.customer.area) {
          const customearealabel = $('<label>', {
            html: `Area: <b>${details.customer.area}</b>`,
          });
          $(`#customerInfodivid`).append(customearealabel);
        }

        // Block:
        if (details.customer.block) {
          const customeBlocklabel = $('<label>', {
            html: `Block: <b>${details.customer.block}</b>`,
          });
          $(`#customerInfodivid`).append(customeBlocklabel);
        }

        // Street:
        if (details.customer.street) {
          const customeStreetlabel = $('<label>', {
            html: `Street: <b>${details.customer.street}</b>`,
          });
          $(`#customerInfodivid`).append(customeStreetlabel);
        }

        // Lane:
        if (details.customer.lane) {
          const customeLanelabel = $('<label>', {
            html: `Lane: <b> ${details.customer.lane}</b>`,
          });
          $(`#customerInfodivid`).append(customeLanelabel);
        }

        // Building/Tower:
        if (details.customer.building) {
          const customerBuildinglabel = $('<label>', {
            html: `Building/Tower:<b> ${details.customer.building}</b>`,
          });
          $(`#customerInfodivid`).append(customerBuildinglabel);
        }

        // Flat/House No:
        if (details.customer.flat) {
          const customeFlatlabel = $('<label>', {
            html: `Flat/House No:<b> ${details.customer.flat}</b>`,
          });
          $(`#customerInfodivid`).append(customeFlatlabel);
        }

        // Floor No:
        if (details.customer.floor) {
          const customeFloorlabel = $('<label>', {
            html: `Floor No:<b> ${details.customer.floor}</b>`,
          });
          $(`#customerInfodivid`).append(customeFloorlabel);
        }

        // Landmark:
        if (details.customer.landmark) {
          const customeLandmarklabel = $('<label>', {
            html: `Landmark:<b> ${details.customer.landmark}</b>`,
          });
          $(`#customerInfodivid`).append(customeLandmarklabel);
        }

        // Complete Address:

        // Location Label:
        if (details.customer.label) {
          const customeLocationLabellabel = $('<label>', {
            html: `Location Label:<b> ${details.customer.label}</b>`,
          });
          $(`#customerInfodivid`).append(customeLocationLabellabel);
        }

        if (details.customer.address_line1) {
          const address = details.customer.address_line1
            ? details.customer.address_line1
            : '';
          const customeaddresslabel = $('<label>', {
            html: address,
          });
          $(`#customerInfodivid`).append(customeaddresslabel);
        }
      }
      if (showCustomergstonbill && details.customer.gstno) {
        let taxTitle = $.i18n.t('controller:previewController.GSTNo');
        if (window.storeDetails.country !== 'India') {
          taxTitle = $.i18n.t('controller:previewController.TaxNo');
        }
        const customergstnolabel = $('<label>', {
          html: `${taxTitle} ${details.customer.gstno} `,
        });
        $(`#customerInfodivid`).append(customergstnolabel);
      }

      try {
        const { due_payment } = details;
        if (
          window.showduePaymentonbill &&
          due_payment &&
          Number(due_payment) > 0
        ) {
          const customerDuepaylabel = $('<label>', {
            html: `${$.i18n.t(
              'controller:previewController.duePayment',
            )} ${currency} ${Number(due_payment).toFixed(ROUNDOFF_UPTO)} `,
          });
          $(`#customerInfodivid`).append(customerDuepaylabel);
        }
      } catch (error) { }

      // check pre-order
      if (details.preorderInfo) {
        if (details.preorderInfo.delivery_at) {
          const delivery_at = moment(details.preorderInfo.delivery_at).format(
            'DD MMMM YYYY hh:mm A',
          );
          const preorderdeliverydateLabel = $('<label>', {
            html: `${$.i18n.t(
              'controller:previewController.deliveryDate',
            )} ${delivery_at} `,
            class: 'preview-preorderinfo',
          });
          $(`#customerInfodivid`).append(preorderdeliverydateLabel);
        }
        if (details.preorderInfo.instructions) {
          const preorderinstructionsLabel = $('<label>', {
            html: `${$.i18n.t('controller:previewController.Instructions')} ${details.preorderInfo.instructions
              } `,
            class: 'preview-preorderinfo',
          });
          $(`#customerInfodivid`).append(preorderinstructionsLabel);
        }
      }

      // show redeemed points if reward is given
      if (
        details.discounttoApply &&
        details.isloyaltyrewardDiscount &&
        details.pointsRedeemed
      ) {
        const customerredeemedpointslabel = $('<label>', {
          html: `Points Redeemed: ${details.pointsRedeemed} `,
        });
        $(`#customerInfodivid`).append(customerredeemedpointslabel);
      }

      $('#customerInfodivid').show();
    } else {
      $('#customerInfodivid').hide();
    }

    if (
      details.showCustomerinfo &&
      !details.customer &&
      details.customer_name
    ) {
      $('#customerInfodivid').show();
      let customerInfo = '';
      customerInfo = `${$.i18n.t('controller:previewController.Customer')} ${details.customer_name
        }`;
      let safeSalutation = details.customer?.salutation;
      let safeCustomerName = details.customer?.name || details.customer_name;
      if (safeSalutation && /^\d+$/.test(safeSalutation)) {
        const mappedSalutation = SALUTATIONS_VALUES[Number(safeSalutation)];
        if (mappedSalutation) {
          safeSalutation = mappedSalutation;
        }
      }

      const customerNamelabel = $('<label>', {
        class: 'preview-preorderinfo',

        html: `Customer: <strong>${[safeSalutation, safeCustomerName].filter(Boolean).join(' ')} (${details.customer?.phone || ''})</strong>`,
      });
      $(`#customerInfodivid`).append(customerNamelabel);
    }

    // Check for paid amount
    if (showcustomerpaidAmount && Number(details.cust_paid_amount)) {
      let amountInCash = Number(finalGrandtotal);
      if (
        details.payment_mode &&
        String(details.payment_mode).toLowerCase() === 'split'
      ) {
        const cashPayment = details.payment_modes.find(
          (item) => item.payment_option === 'Cash',
        );
        const cashAmount = cashPayment ? cashPayment.amount : 0;
        if (cashAmount) {
          amountInCash = cashAmount;
        }
      }
      let returnAmount = Number(
        Number(details.cust_paid_amount) - Number(amountInCash),
      ).toFixed(ROUNDOFF_UPTO);
      returnAmount = Number(returnAmount);
      if (details?.extra_details?.total_tip) {
        returnAmount -= Number(details.extra_details.total_tip);
      }
      $('#billpreviewcustomerpaidContainer').show();
      $('#billpreviewcustomerpaidAmountlabelid').html(
        `${$.i18n.t('controller:previewController.paidAmt')} ${currency} ${Number(
          details.cust_paid_amount,
        ).toFixed(ROUNDOFF_UPTO)} `,
      );
      if (returnAmount > 0) {
        $('#billpreviewcustomerreturnAmountlabelid').html(
          `${$.i18n.t(
            'controller:previewController.returnAmt',
          )} ${currency} ${returnAmount.toFixed(ROUNDOFF_UPTO)} `,
        );
      } else {
        $('#billpreviewcustomerreturnAmountlabelid').html('');
      }
    } else {
      $('#billpreviewcustomerpaidContainer').hide();
    }

    if (details?.extra_details?.total_tip) {
      $('#billpreviewtipAmountlabelidforsection').show();
      $('#billpreviewtipAmountlabelidforsection').html(
        `Waiter Tip Amount : ${currency} ${Number(
          details?.extra_details?.total_tip,
        ).toFixed(ROUNDOFF_UPTO)}`,
      );
    } else {
      $('#billpreviewtipAmountlabelidforsection').hide();
    }

    $(`#previewmiscContainerid`).empty();
    $(`#previewmiscContainerid`).removeClass('botton-dashed');
    $(`#previewmiscContainerid`).addClass('botton-dashed');
    if (
      details.payment_mode &&
      String(details.payment_mode).toLowerCase() === 'split'
    )
      addPaymentmode(details.payment_modes);
    if (!$('#customerInfodivid').is(':empty')) {
      $(`#previewmiscContainerid`).removeClass('botton-dashed');
    } else {
      $(`#previewmiscContainerid`).addClass('botton-dashed');
    }
    if (details.extra_details && details.extra_details.zomatoPay_AuthCode) {
      const paymentmodeContainerdiv = $('<div>', {
        html: `${details.extra_details.zomatoPay_amount_receivable} ${window.storeDetails.currency} Received through Zomato Pay | ${details.extra_details.zomatoPay_AuthCode}`,
      });
      $(`#previewmiscContainerid`).append(paymentmodeContainerdiv);
    }
    // await sleep(1000);
    window.isPrintingInprogress = false;
    return 'success';
  } catch (error) {
    console.error('Message=Error while printing section wise', error);
  } finally {
    window.isPrintingInprogress = false;
  }
}

/**
 * Item to add in table
 * @param {Item details} data
 */
function addItem(data, index, itemchargesTitles, shownoteonBill, isOnlinebill) {
  // if(data.title.includes('\\n')){
  //   data.title = data.title.replace('\\n', '\n')
  // }
  // if roundoff upto 2 decimal then set item name width
  if (ROUNDOFF_UPTO != '3') {
    $('#previewItemName').css('width', '47%');
  }
  data = { ...data };
  const english = /^[~`!@#$%^&*()_+=[\]\\{}|;':",.\/<>?a-zA-Z0-9- \n]+$/;
  if (data.title) {
    const titleArray = data.title.split('');
    let foundFields = 0;
    for (let i = 0; i < titleArray.length; i++) {
      if (!english.test(titleArray[i])) {
        foundFields = i;
        break;
      }
    }

    if (foundFields) {
      const b = '\n';
      data.title = [
        data.title.slice(0, foundFields),
        b,
        data.title.slice(foundFields),
      ].join('');
    }

    if (showAlternatetitleonbill && data.alternative_title) {
      data.title = `${data.title} ${data.alternative_title}`;
    }
  }
  let dataTitle = data.title;
  if (data && data.extra_details && data.extra_details.baseTitle) {
    dataTitle = data.extra_details.baseTitle;
    if (showAlternatetitleonbill && data.alternative_title) {
      dataTitle = `${dataTitle} ${data.alternative_title}`;
    }
  }

  // if (
  //   data &&
  //   data.addons &&
  //   data.addons.length &&
  //   showOnlyBaseItemTitleForModifierItem
  // ) {
  //   if (!data?.extra_details?.defaultSelectedAddons) {
  //     data.addons.forEach((addon) => {
  //       dataTitle =
  //         `${dataTitle}\n` +
  //         `<span class='kotbillItemAddonsForPrint'>${addon.option_qty || addon.qty || 1} x ${addon.option_name || addon.title}</span> `;
  //     });
  //   }
  // } else {
  //   if (data && data.addons && data.addons.length) {
  //     data.addons.forEach((addon) => {
  //       dataTitle =
  //         `${dataTitle}\n` +
  //         `<span class='kotbillItemAddonsForPrint'>${addon.option_qty || addon.qty || 1} x ${addon.option_name || addon.title}</span> `;
  //     });
  //   }
  // }

  if (!isOnlinebill) {
    if (showDefaltItemTitleForModifierItem) {
      if (data.extra_details && data.extra_details.defaultVariantlist) {
        Object.values(data.extra_details.defaultVariantlist).forEach(
          (addon) => {
            let addonTitle = addon.title || addon.option_name;
            if (showAlternatetitleonbill && addon.alternative_title) {
              addonTitle = `${addonTitle} (${addon.alternative_title})`;
            }
            dataTitle =
              `${dataTitle}<br>` +
              `<span class='kotbillItemAddonsForPrint'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
          },
        );
      }

      if (data.extra_details && data.extra_details.defaultDeselected) {
        Object.values(data.extra_details.defaultDeselected).forEach((addon) => {
          let addonTitle = addon.title || addon.option_name;
          if (showAlternatetitleonbill && addon.alternative_title) {
            addonTitle = `${addonTitle} (${addon.alternative_title})`;
          }
          dataTitle =
            `${dataTitle}<br>` +
            `<span class='cancelledItemAddonsForPrint'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
        });
      }

      if (data.extra_details && data.extra_details.otherSelectedlist) {
        Object.values(data.extra_details.otherSelectedlist).forEach((addon) => {
          let addonTitle = addon.title || addon.option_name;
          if (showAlternatetitleonbill && addon.alternative_title) {
            addonTitle = `${addonTitle} (${addon.alternative_title})`;
          }
          dataTitle =
            `${dataTitle}<br>` +
            `<span class='kotbillItemAddonsForPrint'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
        });
      }
    } else if (!showBaseItemOnlyForModifierItems) {
      if (
        (data.extra_details &&
          data?.extra_details?.printOnKOTAndBill &&
          !Object.entries(data?.extra_details?.printOnKOTAndBill).length) ||
        !data?.extra_details?.printOnKOTAndBill
      ) {
        if (data && data.addons && data.addons.length) {
          data.addons.forEach((addon) => {
            let addonTitle = addon.title || addon.option_name;
            if (
              showAlternatetitleonbill &&
              !addon.alternative_title &&
              addon.extra_details &&
              addon.extra_details.alternative_title
            ) {
              addonTitle = `${addonTitle} (${addon.extra_details.alternative_title})`;
            }
            if (showAlternatetitleonbill && addon.alternative_title) {
              addonTitle = `${addonTitle} (${addon.alternative_title})`;
            }
            dataTitle =
              `${dataTitle}<br>` +
              `<span class='kotbillItemAddonsForPrint'>${addon.qty || addon.option_qty || 1} x ${addonTitle} </span>`;
          });
        }

        if (data.extra_details && data.extra_details.cancelledAddonslist) {
          Object.values(data.extra_details.cancelledAddonslist).forEach(
            (addon) => {
              let addonTitle = addon.title || addon.option_name;
              if (showAlternatetitleonbill && addon.alternative_title) {
                addonTitle = `${addonTitle} (${addon.alternative_title})`;
              }
              dataTitle =
                `${dataTitle}<br>` +
                `<span class='cancelledItemAddonsForPrint'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
            },
          );
        }
      }

      if (
        data.extra_details &&
        data.extra_details.printOnKOTAndBill &&
        Object.keys(data.extra_details.printOnKOTAndBill).length
      ) {
        Object.values(data.extra_details.printOnKOTAndBill).forEach((addon) => {
          let addonTitle = addon.title || addon.option_name;
          if (
            showAlternatetitleonbill &&
            !addon.alternative_title &&
            addon.extra_details &&
            addon.extra_details.alternative_title
          ) {
            addonTitle = `${addonTitle} (${addon.extra_details.alternative_title})`;
          }
          if (showAlternatetitleonbill && addon.alternative_title) {
            addonTitle = `${addonTitle} (${addon.alternative_title})`;
          }
          dataTitle =
            `${dataTitle}<br>` +
            `<span class='kotbillItemAddonsForPrint'>${addon.qty || addon.option_qty || 1} x ${addonTitle} </span>`;
        });
      }

      if (
        data.extra_details &&
        data.extra_details.printOnKOTAndBillDefaultDeselected &&
        Object.keys(data.extra_details.printOnKOTAndBillDefaultDeselected)
          .length
      ) {
        Object.values(
          data.extra_details.printOnKOTAndBillDefaultDeselected,
        ).forEach((addon) => {
          let addonTitle = addon.title || addon.option_name;
          if (showAlternatetitleonbill && addon.alternative_title) {
            addonTitle = `${addonTitle} (${addon.alternative_title})`;
          }
          dataTitle =
            `${dataTitle}<br>` +
            `<span class='cancelledItemAddonsForPrint'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
        });
      }
    } else if (showBaseItemOnlyForModifierItems) {
      if (data && data.extra_details && data.extra_details.defaultVariantlist) {
        const varientdata = data.extra_details.defaultVariantlist;
        if (Object.keys(varientdata)?.length) {
          const firstKey = Object.keys(varientdata)[0];
          if (firstKey) {
            let baseVarient =
              data.extra_details.defaultVariantlist[firstKey].title;
            if (window.selectedLanguage !== 'en') {
              baseVarient =
                data.extra_details.defaultVariantlist[firstKey]
                  .alternative_title;
            }
            if (baseVarient) {
              dataTitle = `${dataTitle} (${baseVarient})`;
            }
          }
        }
      }
    }
  }

  if (isOnlinebill && data && data.addons && data.addons.length) {
    data.addons.forEach((addon) => {
      dataTitle =
        `${dataTitle}<br>` +
        `<span class='kotbillItemAddonsForPrint'>${addon.option_qty || addon.qty || 1} x ${addon.option_name || addon.title}</span> `;
    });
  }

  if (
    data.extra_details &&
    data.extra_details.item_tags &&
    data.extra_details.item_tags.length
  ) {
    let tagContent = '';
    data.extra_details.item_tags.forEach((tag) => {
      tagContent = `${tagContent} ${tag.content}`;
    });

    dataTitle = `${dataTitle} <br>[${tagContent}]`;
  }

  // if (data.extra_details && data.extra_details.cancelledAddonslist) {
  //   Object.values(data.extra_details.cancelledAddonslist).forEach((addon) => {
  //     dataTitle =
  //       `${dataTitle}<br>` +
  //       `<span class='cancelledItemAddonsForPrint'>1 x ${addon} <span>`;
  //   });
  // }
  const table = $('#previewTable');
  if (showSRNumberOnBillPrint) {
    dataTitle = `${index}.${dataTitle} `;
  }
  const itemTitle = $('<td>', {
    html: dataTitle,
    class: 'bill-preview-item-title',
    // style: ROUNDOFF_UPTO != '3' ? 'width:50% !important' : '',
  });
  if (shownoteonBill && (data.note || data.item_note)) {
    itemTitle.append(`\n(${data.note || data.item_note})`);
  }
  if (showItemlevelchargesSeperately) {
    if (itemchargesTitles) {
      itemchargesTitles = itemchargesTitles.replace(/,\s*$/, '');
      const charges = $('<label>', {
        html: itemchargesTitles,
        class: 'item-charges-label',
      });
      itemTitle.append(charges);
    }
  }

  if (showitemhsncodeonBill && data.hsn_code) {
    const charges = $('<label>', {
      html: `\n - ${$.i18n.t('controller:previewController.HSN')} (${data.hsn_code
        })`,
      class: 'item-charges-label',
    });
    itemTitle.append(charges);
  }

  const itemQuantity = $('<td>', {
    html: data.quantity,
    class: 'rightTextAlign',
  });

  let itemPrice = $('<td>', {
    html:
      Number(data.total_with_tax).toFixed(ROUNDOFF_UPTO) == 0
        ? 0
        : ROUNDOFF_UPTO == '3'
          ? Number(data.item_price).toFixed(ROUNDOFF_UPTO)
          : Number(Number(data.item_price).toFixed(ROUNDOFF_UPTO)),
    class: 'rightTextAlign',
  });
  if (!String(data.item_price)) {
    itemPrice = $('<td>', {
      html:
        Number(data.total_with_tax).toFixed(ROUNDOFF_UPTO) == 0
          ? 0
          : ROUNDOFF_UPTO == '3'
            ? Number(data.price).toFixed(ROUNDOFF_UPTO)
            : Number(Number(data.price).toFixed(ROUNDOFF_UPTO)),
      class: 'rightTextAlign',
    });
  }
  const itemAmount = $('<td>', {
    html:
      Number(data.total_with_tax).toFixed(ROUNDOFF_UPTO) == 0
        ? 0
        : ROUNDOFF_UPTO == '3'
          ? data.amount.toFixed(ROUNDOFF_UPTO)
          : Number(Number(data.amount).toFixed(ROUNDOFF_UPTO)),
    class: 'rightTextAlign',
  });
  let discountgraterThan = false;
  switch (data.discount_type) {
    case 1:
      discountgraterThan = data.discount_rate > 100;
      break;

    case 2:
      discountgraterThan = data.discount_rate > data.pricebeforeDiscount;
      break;

    default:
      discountgraterThan = false;
      break;
  }
  if (
    data.discount_name ||
    (data.discounted_price > 0 && !discountgraterThan && data.discount_rate > 0)
  ) {
    let totalDiscount = 0;

    if (data.discount_type == 2) {
      totalDiscount = data.discount_rate * data.quantity;
    } else {
      const discount = data.pricebeforeDiscount - data.item_price;
      if (discount) {
        totalDiscount = discount * data.quantity;
      }
    }
    const itemlevelDisctitle = $('<label>', {
      html: `${data.discount_name ? `  ${data.discount_name}` : ''
        } - ${$.i18n.t('controller:previewController.Discount')} (${data.discount_type == 1 ? '' : `${currency}.`
        }${data.discount_rate}${data.discount_type == 1 ? '%' : ''}) - ${totalDiscount > 0 ? totalDiscount.toFixed(ROUNDOFF_UPTO) : ''}`,
      class: 'item-charges-label',
    });

    itemTitle.append(itemlevelDisctitle);
    itemPrice.html(
      ROUNDOFF_UPTO == '3'
        ? data.pricebeforeDiscount.toFixed(ROUNDOFF_UPTO)
        : data.pricebeforeDiscount,
    );
  }

  if (data.discount && data.isOnlineOrderBill) {
    const itemlevelDisctitle = $('<label>', {
      html: `(${$.i18n.t('controller:previewController.Discount')}: - ${data.discount > 0 ? data.discount.toFixed(ROUNDOFF_UPTO) : ''})`,
      class: 'item-charges-label',
    });

    itemTitle.append(itemlevelDisctitle);
  }
  if (!data.discount_name && data.amount === 0) {
    const itemcomplimentaryLabel = $('<label>', {
      html: `\n - Complimentary`,
      class: 'item-charges-label',
    });
    itemTitle.append(itemcomplimentaryLabel);
  }

  const row = $('<tr>');
  row.append(itemTitle);
  row.append(itemQuantity);
  row.append(itemPrice);
  row.append(itemAmount);
  table.append(row);

  // show price on setting base
  if (itemDetailsColumns && itemDetailsColumns.qty === 1) {
    $(itemQuantity).remove();
  }
  if (itemDetailsColumns && itemDetailsColumns.qty === 1) {
    $('.previewItemQtyClass').hide();
  }

  // show rate on setting base
  if (itemDetailsColumns && itemDetailsColumns.rate === 1) {
    $(itemPrice).remove();
  }
  if (itemDetailsColumns && itemDetailsColumns.rate === 1) {
    $('.previewItemRateClass').hide();
  }

  // show total on setting base
  if (itemDetailsColumns && itemDetailsColumns.total === 1) {
    $(itemAmount).remove();
  }
  if (itemDetailsColumns && itemDetailsColumns.total === 1) {
    $('.previewItemTotalClass').hide();
  }

  // $('#kotTable').trigger('rowAddOrRemove');
}

function addSectionitem(
  data,
  index,
  parent,
  itemchargesTitles,
  shownoteonBill,
  isOnlinebill,
) {
  let item_title = data.title;
  if (data.extra_details && data.extra_details.baseTitle) {
    item_title = data.extra_details.baseTitle;
  }
  if (showAlternatetitleonbill && data.alternative_title) {
    item_title = `${item_title} ${data.alternative_title}`;
  }

  if (!isOnlinebill) {
    if (showDefaltItemTitleForModifierItem) {
      if (data.extra_details && data.extra_details.defaultVariantlist) {
        Object.values(data.extra_details.defaultVariantlist).forEach(
          (addon) => {
            let addonTitle = addon.title || addon.option_name;
            if (showAlternatetitleonbill && addon.alternative_title) {
              addonTitle = `${addonTitle} ${addon.alternative_title}`;
            }
            item_title =
              `${item_title}<br>` +
              `<span class='kotbillItemAddonsForPrint'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
          },
        );
      }

      if (data.extra_details && data.extra_details.defaultDeselected) {
        Object.values(data.extra_details.defaultDeselected).forEach((addon) => {
          let addonTitle = addon.title || addon.option_name;
          if (showAlternatetitleonbill && addon.alternative_title) {
            addonTitle = `${addonTitle}\n${addon.alternative_title}`;
          }
          item_title =
            `${item_title}<br>` +
            `<span class='cancelledItemAddonsForPrint'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
        });
      }

      if (data.extra_details && data.extra_details.otherSelectedlist) {
        Object.values(data.extra_details.otherSelectedlist).forEach((addon) => {
          let addonTitle = addon.title || addon.option_name;
          if (showAlternatetitleonbill && addon.alternative_title) {
            addonTitle = `${addonTitle}\n${addon.alternative_title}`;
          }
          item_title =
            `${item_title}<br>` +
            `<span class='kotbillItemAddonsForPrint'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
        });
      }
    } else if (!showBaseItemOnlyForModifierItems) {
      if (
        data.extra_details &&
        data.extra_details.printOnKOTAndBill &&
        !Object.keys(data.extra_details.printOnKOTAndBill).length
      ) {
        if (data && data.addons && data.addons.length) {
          data.addons.forEach((addon) => {
            let addonTitle = addon.title || addon.option_name;
            if (showAlternatetitleonbill && addon.alternative_title) {
              addonTitle = `${addonTitle}\n${addon.alternative_title}`;
            }
            item_title =
              `${item_title}<br>` +
              `<span class='kotbillItemAddonsForPrint'>${addon.qty || addon.option_qty || 1} x ${addonTitle} </span>`;
          });
        }

        if (data.extra_details && data.extra_details.cancelledAddonslist) {
          Object.values(data.extra_details.cancelledAddonslist).forEach(
            (addon) => {
              let addonTitle = addon.title || addon.option_name;
              if (showAlternatetitleonbill && addon.alternative_title) {
                addonTitle = `${addonTitle}\n${addon.alternative_title}`;
              }
              item_title =
                `${item_title}<br>` +
                `<span class='cancelledItemAddonsForPrint'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
            },
          );
        }
      }

      if (
        data.extra_details &&
        data.extra_details.printOnKOTAndBill &&
        Object.keys(data.extra_details.printOnKOTAndBill).length
      ) {
        Object.values(data.extra_details.printOnKOTAndBill).forEach((addon) => {
          let addonTitle = addon.title || addon.option_name;
          if (
            showAlternatetitleonbill &&
            !addon.alternative_title &&
            addon.extra_details &&
            addon.extra_details.alternative_title
          ) {
            addonTitle = `${addonTitle} (${addon.extra_details.alternative_title})`;
          }
          if (showAlternatetitleonbill && addon.alternative_title) {
            addonTitle = `${addonTitle} (${addon.alternative_title})`;
          }
          item_title =
            `${item_title}<br>` +
            `<span class='kotbillItemAddonsForPrint'>${addon.qty || addon.option_qty || 1} x ${addonTitle} </span>`;
        });
      }

      if (
        data.extra_details &&
        data.extra_details.printOnKOTAndBillDefaultDeselected &&
        Object.keys(data.extra_details.printOnKOTAndBillDefaultDeselected)
          .length
      ) {
        Object.values(
          data.extra_details.printOnKOTAndBillDefaultDeselected,
        ).forEach((addon) => {
          let addonTitle = addon.title || addon.option_name;
          if (showAlternatetitleonbill && addon.alternative_title) {
            addonTitle = `${addonTitle} (${addon.alternative_title})`;
          }
          item_title =
            `${item_title}<br>` +
            `<span class='cancelledItemAddonsForPrint'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
        });
      }
    } else if (showBaseItemOnlyForModifierItems) {
      if (data && data.extra_details && data.extra_details.defaultVariantlist) {
        const varientdata = data.extra_details.defaultVariantlist;
        if (Object.keys(varientdata)?.length) {
          const firstKey = Object.keys(varientdata)[0];
          if (firstKey) {
            let baseVarient =
              data.extra_details.defaultVariantlist[firstKey].title;
            if (baseVarient) {
              if (window.selectedLanguage !== 'en') {
                baseVarient =
                  data.extra_details.defaultVariantlist[firstKey]
                    .alternative_title;
              }
              if (baseVarient) {
                item_title = `${item_title} (${baseVarient})`;
              }
            }
          }
        }
      }
    }
  }

  if (isOnlinebill && data && data.addons && data.addons.length) {
    data.addons.forEach((addon) => {
      item_title =
        `${item_title}<br>` +
        `<span class='kotbillItemAddonsForPrint'>${addon.option_qty || addon.qty || 1} x ${addon.option_name || addon.title}</span> `;
    });
  }

  // if (data && data.addons && data.addons.length) {
  //   data.addons.forEach((addon) => {
  //     item_title =
  //       `${item_title}<br>` +
  //       `<span class='kotbillItemAddonsForPrint'>${addon.option_qty || addon.qty || 1} x ${addon.option_name || addon.title}</span> `;
  //   });
  // }
  // if (data.extra_details && data.extra_details.cancelledAddonslist) {
  //   Object.values(data.extra_details.cancelledAddonslist).forEach((addon) => {
  //     item_title =
  //       `${item_title}<br>` +
  //       `<span class='cancelledItemAddonsForPrint'>1 x ${addon} <span>`;
  //   });
  // }
  if (showSRNumberOnBillPrint) {
    item_title = `${index}.${item_title} `;
  }
  const title = $('<td>', {
    html: item_title,
    class: 'bill-preview-item-title',
  });

  const quantity = $('<td>', { html: data.quantity, class: 'rightTextAlign' });
  const amount = $('<td>', {
    html:
      ROUNDOFF_UPTO == '3' ? data.amount.toFixed(ROUNDOFF_UPTO) : data.amount,
    class: 'rightTextAlign',
  });
  let price = $('<td>', {
    html:
      ROUNDOFF_UPTO == '3'
        ? Number(data.item_price).toFixed(ROUNDOFF_UPTO)
        : data.item_price,
    class: 'rightTextAlign',
  });

  if (!String(data.item_price) && data.price) {
    price = $('<td>', {
      html:
        ROUNDOFF_UPTO == '3'
          ? Number(data.price).toFixed(ROUNDOFF_UPTO)
          : data.price,
      class: 'rightTextAlign',
    });
  }

  if (shownoteonBill && data.note) {
    title.append(`(${data.note})`);
  }

  if (showItemlevelchargesSeperately && itemchargesTitles) {
    itemchargesTitles = itemchargesTitles.replace(/,\s*$/, '');
    const charges = $('<label>', {
      html: itemchargesTitles,
      class: 'item-charges-label',
    });
    title.append(charges);
  }

  if (showitemhsncodeonBill && data.hsn_code) {
    const charges = $('<label>', {
      html: `\n - ${$.i18n.t('controller:previewController.HSN')}
    } (${data.hsn_code})`,
      class: 'item-charges-label',
    });
    title.append(charges);
  }

  if (!data.discount_name && data.amount === 0) {
    const itemcomplimentaryLabel = $('<label>', {
      html: `\n - Complimentary`,
      class: 'item-charges-label',
    });
    title.append(itemcomplimentaryLabel);
  }

  let discountgraterThan = false;
  switch (data.discount_type) {
    case 1:
      discountgraterThan = data.discount_rate > 100;
      break;

    case 2:
      discountgraterThan = data.discount_rate > data.pricebeforeDiscount;
      break;

    default:
      discountgraterThan = false;
      break;
  }

  if (
    data.discount_name ||
    (data.discounted_price > 0 && data.discount_rate > 0 && !discountgraterThan)
  ) {
    let totalDiscount = 0;

    if (data.discount_type == 2) {
      totalDiscount = data.discount_rate * data.quantity;
    } else {
      const discount = data.pricebeforeDiscount - data.item_price;
      if (discount) {
        totalDiscount = discount * data.quantity;
      }
    }
    const itemlevelDisctitle = $('<label>', {
      html: `${data.discount_name ? `  ${data.discount_name}` : ''
        } - ${$.i18n.t('controller:previewController.Discount')} (${data.discount_type == 1 ? '' : `${currency}.`
        }${data.discount_rate}${data.discount_type == 1 ? '%' : ''}) - ${totalDiscount > 0 ? totalDiscount.toFixed(ROUNDOFF_UPTO) : ''}`,
      class: 'item-charges-label',
    });
    title.append(itemlevelDisctitle);
    price.html(
      ROUNDOFF_UPTO == '3'
        ? data?.pricebeforeDiscount?.toFixed(ROUNDOFF_UPTO)
        : data.pricebeforeDiscount,
    );
  }

  const row = $('<tr>')
    .append(title)
    .append(quantity)
    .append(price)
    .append(amount);
  $(parent).append(row);

  // show price on setting base
  if (itemDetailsColumns && itemDetailsColumns.qty === 1) {
    $(quantity).remove();
  }

  // show rate on setting base
  if (itemDetailsColumns && itemDetailsColumns.rate === 1) {
    $(price).remove();
  }

  // show total on setting base
  if (itemDetailsColumns && itemDetailsColumns.total === 1) {
    $(amount).remove();
  }
}

function addComputeditemstopreview(itemsList) {
  for (const currentItem of itemsList) {
    const table = $('#previewTable');
    const itemTitle = $('<td>', {
      html: currentItem.itemTitle,
    });
    const itemQuantity = $('<td>', {
      html: currentItem.itemQuantity,
    });
    const itemPrice = $('<td>', {
      html: currentItem.itemPrice,
    });
    const itemAmount = $('<td>', {
      html: currentItem.itemAmount,
    });

    const row = $('<tr>');
    row.append(itemTitle);
    row.append(itemQuantity);
    row.append(itemPrice);
    row.append(itemAmount);
    table.append(row);

    // $('#kotTable').trigger('rowAddOrRemove');
  }
}

function Initialize() {
  initQRCodegenerator();
  if (ISBILLINGBYSECTION_ON) {
    printPreviewbysection();
  } else if (useoldprintPreviewmethod) {
    printPreviewold();
  } else {
    newprintPreview();
  }
  getBharatpeStatus();

  if ($.i18n) {
    initalizei18nforpreviewWindow();
  } else {
    setTimeout(initalizei18nforpreviewWindow, 400);
  }
}

/**
 * Initialize the QRCode Div
 */
function initQRCodegenerator() { }

function getSettingforpreview() {
  try {
    if (
      window.settingsConfig &&
      window.settingsConfig.length > 0 &&
      window.settingsConfig[SHOW_CUSTOMERGST_ON_BILL_CHECK - 1]
    ) {
      showCustomergstonbill =
        window.settingsConfig[SHOW_CUSTOMERGST_ON_BILL_CHECK - 1].value == '1';
    }

    if (
      window.settingsConfig &&
      window.settingsConfig.length > 0 &&
      window.settingsConfig[SHOW_ALTERNATE_TITLE_ON_BILL_PRINT - 1]
    ) {
      showAlternatetitleonbill =
        window.settingsConfig[SHOW_ALTERNATE_TITLE_ON_BILL_PRINT - 1].value ==
        '1';
    }

    if (
      window.settingsConfig &&
      window.settingsConfig.length > 0 &&
      window.settingsConfig[SHOW_CUSTOMERAMTPAID_ONBILL - 1]
    ) {
      showcustomerpaidAmount =
        window.settingsConfig[SHOW_CUSTOMERAMTPAID_ONBILL - 1].value == '1';
    }

    if (window.settingsConfig[SHOW_WAITER_ONBILL - 1] != undefined) {
      showWaiternameonbill =
        window.settingsConfig[SHOW_WAITER_ONBILL - 1].value === '1';
    }
    if (window.settingsConfig[SHOW_DATEANDTIME_ONBILL - 1] != undefined) {
      showdatentimeonBill =
        window.settingsConfig[SHOW_DATEANDTIME_ONBILL - 1].value === '1';
    }
    if (window.settingsConfig[SHOW_USERNAMEON_BILL - 1] != undefined) {
      showusernameonBill =
        window.settingsConfig[SHOW_USERNAMEON_BILL - 1].value === '1';
    }
    if (window.settingsConfig[SHOW_ITEMHSNCODE_ON_BILL - 1] != undefined) {
      showitemhsncodeonBill =
        window.settingsConfig[SHOW_ITEMHSNCODE_ON_BILL - 1].value === '1';
    }
    if (window.settingsConfig[SHOW_CUSTOM_BILL_NUMBER - 1] != undefined) {
      showcustombillnumber =
        window.settingsConfig[SHOW_CUSTOM_BILL_NUMBER - 1].value === '1';
    }
    if (window.settingsConfig[SHOW_CAPTAIN_ON_BILL - 1] != undefined) {
      showCaptainnameonbill =
        window.settingsConfig[SHOW_CAPTAIN_ON_BILL - 1].value === '1';
    }
    if (
      window.settingsConfig[SHOW_BILL_PRINT_COUNT_ONRECEIPT - 1] != undefined
    ) {
      showbillprintCount =
        window.settingsConfig[SHOW_BILL_PRINT_COUNT_ONRECEIPT - 1].value ===
        '1';
    }
    if (window.settingsConfig[SHOW_INVOICE_QR_ONBILL - 1] != undefined) {
      showinvoiceqronBill =
        window.settingsConfig[SHOW_INVOICE_QR_ONBILL - 1].value === '1';
    }
    if (window.settingsConfig[SHOW_CUSTOM_QRS_ONBILL - 1] != undefined) {
      showcustomqsronBill =
        window.settingsConfig[SHOW_CUSTOM_QRS_ONBILL - 1].value === '1';
    }

    if (window.settingsConfig[SHOW_ZATCA_INVOICEQR - 1] != undefined) {
      showzatcaeinvoiceQrcode =
        window.settingsConfig[SHOW_ZATCA_INVOICEQR - 1].value === '1';
    }

    if (window.settingsConfig[SHOW_JORDAN_E_INVOIC_QR - 1] != undefined) {
      showJordanEinvoiceQrcode =
        window.settingsConfig[SHOW_JORDAN_E_INVOIC_QR - 1].value === '1';
    }

    if (window.settingsConfig[SHOW_CHARGESTAX_ONBILL - 1] != undefined) {
      showtaxOnChargeOnBill =
        window.settingsConfig[SHOW_CHARGESTAX_ONBILL - 1].value === '1';
    }
    if (window.settingsConfig[SHOW_DISCOUNTREASON_ONBILL - 1] != undefined) {
      showDiscountreasonifapplied =
        window.settingsConfig[SHOW_DISCOUNTREASON_ONBILL - 1].value === '1';
    }
    if (
      window.settingsConfig &&
      window.settingsConfig.length > 0 &&
      window.settingsConfig[SHOWNOTE_ON_BILLPRINT - 1]
    ) {
      showitemnoteonBill =
        window.settingsConfig[SHOWNOTE_ON_BILLPRINT - 1].value == '1';
    }

    if (
      window.settingsConfig[SEPERATE_BILLING_FOR_OL_ORDER - 1] !== undefined
    ) {
      seperateBillNumber =
        window.settingsConfig[SEPERATE_BILLING_FOR_OL_ORDER - 1].value === '1';
    }

    if (window.settingsConfig[SHOW_BRAND_NAME_ON_BILL - 1] !== undefined) {
      showBrandName =
        window.settingsConfig[SHOW_BRAND_NAME_ON_BILL - 1].value === '1';
    }

    if (window.settingsConfig[SHOW_OUTLET_NAME_ON_BILL - 1] !== undefined) {
      showOutletName =
        window.settingsConfig[SHOW_OUTLET_NAME_ON_BILL - 1].value === '1';
    }

    if (
      window.settingsConfig[SHOW_ALTERNATIVE_OUTLET_NAME_ON_BILL - 1] !==
      undefined
    ) {
      showAlternativeOutletTitleonBill =
        window.settingsConfig[SHOW_ALTERNATIVE_OUTLET_NAME_ON_BILL - 1]
          .value === '1';
    }

    if (window.settingsConfig[SHOW_KOT_NUMBER_ON_BILL - 1] !== undefined) {
      showKotNumbers =
        window.settingsConfig[SHOW_KOT_NUMBER_ON_BILL - 1].value === '1';
    }

    if (window.settingsConfig[SHOW_ITEM_CHARGES_SEPERATELY - 1] !== undefined) {
      showItemlevelchargesSeperately =
        window.settingsConfig[SHOW_ITEM_CHARGES_SEPERATELY - 1].value === '1';
    }

    if (window.settingsConfig[SHOW_COVERS_ON_BILL - 1] !== undefined) {
      showCoversonbill =
        window.settingsConfig[SHOW_COVERS_ON_BILL - 1].value === '1';
    }

    if (
      window.settingsConfig[SHOW_ORDER_PLACED_TIME_ON_BILL - 1] !== undefined
    ) {
      showOrderTimeOnBill =
        window.settingsConfig[SHOW_ORDER_PLACED_TIME_ON_BILL - 1].value === '1';
    }

    if (
      window.settingsConfig[SHOW_TRANSLATIONS_IN_BOTH_LANGUAGES - 1] !==
      undefined
    ) {
      showTranslationInBothLanguage =
        window.settingsConfig[SHOW_TRANSLATIONS_IN_BOTH_LANGUAGES - 1].value ===
        '1';
    }

    if (
      window.settingsConfig[SHOW_ITEM_SERIAL_NUMBER_ON_BILL_PRINT - 1] !==
      undefined
    ) {
      showSRNumberOnBillPrint =
        window.settingsConfig[SHOW_ITEM_SERIAL_NUMBER_ON_BILL_PRINT - 1]
          .value === '1';
    }

    if (
      window.settingsConfig[
      SHOW_DEFAULT_ITEMTITLE_ONLY_FOR_MODIFIER_ITEM_ON_BILL - 1
      ] !== undefined
    ) {
      showDefaltItemTitleForModifierItem =
        window.settingsConfig[
          SHOW_DEFAULT_ITEMTITLE_ONLY_FOR_MODIFIER_ITEM_ON_BILL - 1
        ].value === '1';
    }

    if (
      window.settingsConfig[SHOW_BASE_ITEM_ONLY_ON_BILL_PRINT - 1] !== undefined
    ) {
      showBaseItemOnlyForModifierItems =
        window.settingsConfig[SHOW_BASE_ITEM_ONLY_ON_BILL_PRINT - 1].value ===
        '1';
    }

    if (
      window.settingsConfig[SHOW_CUSTOMER_ADDRESS_ON_PICKUP_BILL - 1] !==
      undefined
    ) {
      showCustomerAddressOnPickupBill =
        window.settingsConfig[SHOW_CUSTOMER_ADDRESS_ON_PICKUP_BILL - 1]
          .value === '1';
    }

    if (window.settingsConfig[DRAFT_BILL_SHOW_PAYMENT_MODE - 1]) {
      showPaymentModeOnDraftBillPrint =
        window.settingsConfig[DRAFT_BILL_SHOW_PAYMENT_MODE - 1].value === '1';
    }

    if (window.settingsConfig[DRAFT_BILL_SHOW_BILL_NUMBER - 1]) {
      showBillNumberOnDraftBillPrint =
        window.settingsConfig[DRAFT_BILL_SHOW_BILL_NUMBER - 1].value === '1';
    }

    if (window.settingsConfig[DRAFT_BILL_SHOW_ZATCA_QR - 1]) {
      showZatcaQrOnDraftBillPrint =
        window.settingsConfig[DRAFT_BILL_SHOW_ZATCA_QR - 1].value === '1';
    }

    if (window.settingsConfig[DRAFT_BILL_SHOW_ORDER_NUMBER - 1]) {
      showOrderNumberOnDraftBillPrint =
        window.settingsConfig[DRAFT_BILL_SHOW_ORDER_NUMBER - 1].value === '1';
    }

    if (window.settingsConfig[DRAFT_BILL_SHOW_ORDER_ID - 1]) {
      showOrderIdOnDraftBillPrint =
        window.settingsConfig[DRAFT_BILL_SHOW_ORDER_ID - 1].value === '1';
    }

    if (window.settingsConfig[DRAFT_BILL_SHOW_BRAND_NAME - 1]) {
      showBrandNameOnDraftBillPrint =
        window.settingsConfig[DRAFT_BILL_SHOW_BRAND_NAME - 1].value === '1';
    }

    if (window.settingsConfig[DRAFT_BILL_SHOW_OUTLTE_NAME - 1]) {
      showOutletNameOnDraftBillPrint =
        window.settingsConfig[DRAFT_BILL_SHOW_OUTLTE_NAME - 1].value === '1';
    }

    if (window.settingsConfig[SHOW_CHANNEL_RESTAURANT_NAME_ON_BILL_PRINT - 1]) {
      showChannelRestaurantName =
        window.settingsConfig[SHOW_CHANNEL_RESTAURANT_NAME_ON_BILL_PRINT - 1]
          .value === '1';
    }

    if (window.settingsConfig[DRAFT_BILL_SHOW_ALTERNATIVE_OUTLET_NAME - 1]) {
      showAlternateOutletNameOnDraftBillPrint =
        window.settingsConfig[DRAFT_BILL_SHOW_ALTERNATIVE_OUTLET_NAME - 1]
          .value === '1';
    }

    if (window.settingsConfig[DRAFT_BILL_SHOW_LOGO - 1]) {
      showLogoOnDraftBillPrint =
        window.settingsConfig[DRAFT_BILL_SHOW_LOGO - 1].value === '1';
    }

    if (window.settingsConfig[DRAFT_BILL_TAX_NUMNER - 1]) {
      showTaxNumberOnDraftBillPrint =
        window.settingsConfig[DRAFT_BILL_TAX_NUMNER - 1].value === '1';
    }

    if (
      window.settingsConfig[BILL_PRINT_ITEM_DETAIL_COLUMNS - 1] !== undefined
    ) {
      itemDetailsColumns = safeParse(
        window.settingsConfig[BILL_PRINT_ITEM_DETAIL_COLUMNS - 1].value,
      );
    }

    if (
      window.settingsConfig[HIDE_TOTAL_WHITOUT_TAX_ON_BILL_PRINT - 1] !==
      undefined
    ) {
      hideTotalWithoutTax =
        window.settingsConfig[HIDE_TOTAL_WHITOUT_TAX_ON_BILL_PRINT - 1]
          .value === '1';
    }

    if (window.settingsConfig[SHOW_ORDER_ID_BARCODE_ON_BILL_PRINT - 1]) {
      showOrderIdBarcode =
        window.settingsConfig[SHOW_ORDER_ID_BARCODE_ON_BILL_PRINT - 1].value ===
        '1';
    }

    // show payment mode on bill
    if (window.settingsConfig[SHOW_PAYMENT_MODE_ON - 1] != undefined) {
      try {
        let rawpaymentmodeSettings;
        const { value } = window.settingsConfig[SHOW_PAYMENT_MODE_ON - 1];
        if (value.constructor === 'test'.constructor) {
          rawpaymentmodeSettings = JSON.parse(
            window.settingsConfig[SHOW_PAYMENT_MODE_ON - 1].value,
          );
        } else {
          rawpaymentmodeSettings = value;
        }
        if (rawpaymentmodeSettings && isObject(rawpaymentmodeSettings)) {
          showPaymentModeOnDine = rawpaymentmodeSettings.dinein;
          showPaymentModeOnTakeaway = rawpaymentmodeSettings.takeaway;
          showPaymentModeOnDelivery = rawpaymentmodeSettings.delivery;
          showPaymentModeOnQuickBill = rawpaymentmodeSettings.quick;
        }
      } catch (error) {
        console.log(error);
      }
    }

    // show table name on bill
    if (window.settingsConfig[SHOW_TABLE_NAME_ON - 1] != undefined) {
      try {
        let rawtablenameSettings;
        const { value } = window.settingsConfig[SHOW_TABLE_NAME_ON - 1];
        if (value.constructor === 'test'.constructor) {
          rawtablenameSettings = JSON.parse(
            window.settingsConfig[SHOW_TABLE_NAME_ON - 1].value,
          );
        } else {
          rawtablenameSettings = value;
        }
        if (rawtablenameSettings && isObject(rawtablenameSettings)) {
          showTableNameOnDine = rawtablenameSettings.dinein;
          showTableNameOnTakeaway = rawtablenameSettings.takeaway;
          showTableNameOnDelivery = rawtablenameSettings.delivery;
          showTableNameOnQuickBill = rawtablenameSettings.quick;
        }
      } catch (error) {
        console.log(error);
      }
    }

    if (window.storeDetails && window.storeDetails.extra_info) {
      const extra_info = safeParse(window.storeDetails.extra_info);
      if (extra_info.bill_number_length) {
        bill_number_length = extra_info.bill_number_length;
      }
    }

    // show order type on bill
    if (window.settingsConfig[SHOW_ORDER_TYPE_ON - 1] != undefined) {
      try {
        let rawordertypeSettings;
        const { value } = window.settingsConfig[SHOW_ORDER_TYPE_ON - 1];
        if (value.constructor === 'test'.constructor) {
          rawordertypeSettings = JSON.parse(
            window.settingsConfig[SHOW_ORDER_TYPE_ON - 1].value,
          );
        } else {
          rawordertypeSettings = value;
        }

        if (rawordertypeSettings && isObject(rawordertypeSettings)) {
          showOrderTypeOnDine = rawordertypeSettings.dinein;
          // showOrderTypeOnTakeaway = rawordertypeSettings['takeaway'];
          showOrderTypeOnTakeaway = rawordertypeSettings.takeaway;
          showOrderTypeOnDelivery = rawordertypeSettings.delivery;
          showOrderTypeOnQuickBill = rawordertypeSettings.quick;
        }
      } catch (error) {
        console.log(error);
      }
    }

    if (showTranslationInBothLanguage) {
      $('.orderitemtable').remove();
      $('.itemtablewrapperclass').show();
      $('#totalqtylabelid').hide();
      $('#totalqtylableidforbothlang').show();
      $('#totalamountlabelid').hide();
      $('#totalamountlableidforbothlang').show();
      $('#grandtotallabelid').hide();
      $('#grandtotallabelidforbothlang').show();
      $('#sectionwisegrandtotalid').hide();
      $('#sectionwisegrandtotalidforbothlang').show();
      $('#totalwithtaxid').hide();
      $('#totalwithouttaxinbothlangid').show();
      $('#ordertypeLabel').hide();
      $('#ordertypeLabelinbothlangauge').show();
    } else {
      $('.itemtablewrapperclass').remove();
    }
  } catch (error) {
    console.log(error);
  }
}

window.showPreview = async (previewDetails) => {
  const issectionwisebilling = window.ISBILLINGBYSECTION_ON;
  let status = true;
  getSettingforpreview();

  if (issectionwisebilling) {
    status = await printPreviewbysection(previewDetails);
    // await waitForRender();
    return status;
  }

  if (useoldprintPreviewmethod) {
    status = await printPreviewold(previewDetails);
    // await waitForRender();
    return status;
  }

  // await newprintPreview(previewDetails);
  // await waitForStableDOM();
  return status;
};

const billPrintQueue = [];
let isPrinting = false;

async function processQueue() {
  // Guard: only one run loop at a time
  if (isPrinting || window.isPrintingInprogress) return;

  while (billPrintQueue.length > 0) {
    ensurePrintBillLockIsHealthy();
    isPrinting = true;
    printBillLockStartedAt = Date.now();

    const previewDetails = billPrintQueue.shift();

    try {
      const result = await showPreview(previewDetails);

      if (previewDetails.showPopup) {
        // Popup bills skip printing — just move to next in queue
        continue;
      }

      if (result) {
        const {
          printerId,
          currentTableButton,
          billing_type,
          printFromCsk,
          isdraftBill,
          sendImageToCSK,
          printBillOnBothSide,
          socketUserId,
          cskPrintEvent,
          printWidth,
          printers,
          table_id,
          forQuickbill,
          job_id,
        } = previewDetails;

        await window.sendBillprintfromremote({
          printerId,
          currentTableButton,
          billing_type,
          printFromCsk,
          sendImageToCSK,
          printBillOnBothSide,
          socketUserId,
          cskPrintEvent,
          printWidth,
          printers,
          isdraftBill,
          table_id,
          forQuickbill,
          job_id,
        });
      }
    } catch (error) {
      console.error('[PreviewController] Message="Error"', error);
    } finally {
      // Always release lock before next iteration
      isPrinting = false;
      printBillLockStartedAt = null;
    }
  }
}

window.printBillfromqueue = async ({
  previewDetails,
  printerId,
  currentTableButton,
  billing_type,
  printFromCsk,
  sendImageToCSK,
  printBillOnBothSide,
  socketUserId,
  cskPrintEvent,
  printWidth,
  printers,
  showPopup,
}) => {
  // eslint-disable-next-line no-param-reassign
  // previewDetails.printers = printers;
  const clonedPreviewDetails = cloneDeep(previewDetails);
  clonedPreviewDetails.printerId = printerId;
  clonedPreviewDetails.currentTableButton = currentTableButton;
  clonedPreviewDetails.billing_type = billing_type;
  clonedPreviewDetails.printFromCsk = printFromCsk;
  clonedPreviewDetails.sendImageToCSK = sendImageToCSK;
  clonedPreviewDetails.printBillOnBothSide = printBillOnBothSide;
  clonedPreviewDetails.socketUserId = socketUserId;
  clonedPreviewDetails.cskPrintEvent = cskPrintEvent;
  clonedPreviewDetails.printWidth = printWidth;
  clonedPreviewDetails.printers = printers;
  clonedPreviewDetails.showPopup = showPopup;

  billPrintQueue.push(clonedPreviewDetails);
  await processQueue();
};

function pad(num, size) {
  num = num.toString();
  while (num.length < size) num = `0${num}`;
  return num;
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

window.reloadbillPreviewsettings = async function () {
  initQRCodegenerator();
};

Initialize();
