/* eslint-disable camelcase */
const forEach = require('lodash/forEach');
const filter = require('lodash/filter');
// const NepaliDate = require('nepali-date-converter');
const { default: NepaliDate } = require('nepali-date-converter');
const { REPORT_TYPES } = require('../util/ReportTypes');
const { APP_WINDOWS, KOT_ITEM_STATUS } = require('../util/Constants');
const { BillingTypes, OrderState } = require('../util/DBUtil');
const {
  REPORT_MESSAGES,
  ORDER_IPC,
  WALLET_IPC,
  USER_MODEL_IPC,
  GET_REPORT_NUMBER,
  UPDATE_MALL_REPORT_ID,
  GET_DELIVERY_BOY_DATA,
} = require('../util/IPC_Messages');
const { formatAMPM } = require('../util/MiscUtil');
const { initAccesslevelsforreports } = require('./AccesslevelManager');
const { openFile } = require('../util/FileUtils');
const { initializei18nforallReportsswindowui } = require('./i18nController');
const { initializeReportwindowpermissions } = require('./PasscodeController');
const {
  COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY,
  SHOW_CATEGORYWISE_ITEM_REPORT,
  SHOW_SOLDITEMS_IN_REPORT,
  SHOW_EXPENSE_REPORT,
  SHOW_WAITER_SUMMARY_REPORT,
  SHOW_DELIVERYBOY_SUMMARY_REPORT,
  SEND_BASE64_REPORT_FROM_REPORT_SECTION,
  SEND_BASE64_REPORT_FROM_CLOSE_DAY_REPORT,
  SHOW_CANCELITEMS_IN_REPORT,
  SHOW_DISCOUNT_SUMMARY_REPORT,
  SHOW_DEU_PAYEMENT_SUMMARY_REPORT,
  FETCH_REPORT_AS_PER_CLOSE_DAY,
  SHOW_WALLET_SUMMARY_REPORT,
  SHOW_DUE_PAYMENTS_RECEIVABLE_SUMMARY,
  SHOW_KDWISE_SUMMARY_REPORT,
  COUNT_SELL_EXEMPTED_TOTAL,
  SEND_BASE64_REPORT_OF_CLOSE_SHIFT,
  PRINT_REPORT_WHILE_SENDING_ON_MAIL_OF_CLOSE_SHIFT,
  PRINT_REPORT_WHILE_SENDING_ON_MAIL_FROM_CLOSE_DAY_REPORT,
  PRINT_REPORT_WHILE_SENDING_ON_MAIL_FROM_REPORT_SECTION,
} = require('../util/SettingIDs');
const { setDateForgettingMidnightReport } = require('../util/MiscUtil');
const {
  makeGetPaymentsAsyncRequest,
} = require('../renderer/helper/Catalog.helper');
const { safeParse } = require('../util/RendererUtils');
const { getFromAndToDateForReportsAsPerCloseDay } = require('./RendererUtils');
const {
  makeGetReortDataRequest,
  makeUpdateCustomerToDuePaymentRequest,
  makeupdateDueAndAddTransactionRequest,
  makeCheckIfAmountIsAvailableRequest,
} = require('../renderer/helper/Report.helper');
const { renderPreOrderDetails } = require('./Modals/PreOrderDetails');

window.allreportsscriptLoaded = true;
let checksalesFilterapplied = false;
let initalloadDone = false;
let currentReporttype;
let countMidnightSale = true;

let fromDate;
let toDate;
let reportMiscdata = {};
let mallReportcsvdata;
let showCategoryData = false;
let showSolditems = false;
let showCancelitems = false;
let showExpenseData = true;
let showWaiterData = false;
let showDeliveryBoyData = false;
let showDuePaymentData = false;
let showDuePaymentReceivableData = false;
let showDiscountData = false;
let showWalletData = false;
let showKDWiseItemsData = false;
let sendBase64String = false;
let sendBase64StringForclosedayreport = false;
let sendBase64StringOnCloseShift = false;
let printReportWhileSendingOnMail = false;
let printReportWhileSendingOnMailForCloseDayReport = false;
let printReportWhileSendingOnMailForCloseShiftReport = false;
let fetchReportAsPerCloseDay = true;
let countSellExemptedTotal = false;

async function initGetPaymentAsync() {
  const data = {
    addPaymenttolist: false,
    showPaymentWindow: false,
  };

  const response = await makeGetPaymentsAsyncRequest(data);
  return response;
}
function getRandomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
}

function clearSalesreportfilters() {
  $('#salesreportFiltercombo1').prop('selectedIndex', 0);
  $('#salesreportFiltercombo2').prop('selectedIndex', 0);
  $(
    '#salesreportFilterbyterminalcombo,#salesreportFilterbyusercombo, #salesreportFilterbydeliveryboycombo',
  ).prop('selectedIndex', 0);
  $('#salesreportTableid')
    .DataTable()
    .column(8)
    .search('')
    .column(10)
    .search('')
    .column(12)
    .search('')
    .column(13)
    .search('')
    .draw();
  checksalesFilterapplied = false;
  $('#salesreportFilterinputid').val('');
  $('#salesreportFilterinputid').keyup();
}

function addSalesreportfilters() {
  $('#salesreportFiltercombo1 option:gt(0)').remove();
  Object.values(window.orderTypes).forEach((type) => {
    // if (!String(type).includes('Digital Order')) {
    if (type) {
      $('<option>')
        .val(type.order_type)
        .text(type.order_type)
        .appendTo('#salesreportFiltercombo1');
    }
    // }
  });

  for (const [key, value] of Object.entries(OrderState)) {
    const formattedText =
      value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    $('<option>')
      .val(value)
      .text(formattedText)
      .appendTo('#salesreportFiltercombo2');
  }

  $('#salesreportFilterbyterminalcombo').on('change', function () {
    const valueSelected = this.value;
    // $('#salesreportTableid')
    //   .DataTable()
    //   .column(12)
    //   .search(valueSelected)
    //   .draw();
    if (currentReporttype) {
      if (!fromDate) {
        const result = setDateForgettingMidnightReport();

        if (countMidnightSale && result) {
          fromDate = moment().subtract(1, 'days').startOf('day').format('x');
          toDate = moment().subtract(1, 'days').endOf('day').format('x');
        } else {
          fromDate = moment().startOf('day').format('x');
          toDate = moment().endOf('day').format('x');
        }
      }

      const isStartDaycheckChecked = $('#fetchReportasperclosedayCheckid').is(
        ':checked',
      );

      if (fetchReportAsPerCloseDay && isStartDaycheckChecked) {
        if (
          window.startEndDayDateData &&
          window.startEndDayDateData.startDayDates &&
          Object.keys(window.startEndDayDateData.startDayDates) &&
          Object.keys(window.startEndDayDateData.startDayDates).length > 0
        ) {
          const date = new Date(Number(fromDate));
          date.setHours(0, 0, 0, 0);
          let checkFromDate = date.getTime();
          const dates = window.startEndDayDateData.startDayDates[checkFromDate];
          if (dates && dates.length) {
            fromDate = dates[0];
          }
        }

        if (
          window.startEndDayDateData &&
          window.startEndDayDateData.closeDayDates &&
          Object.keys(window.startEndDayDateData.closeDayDates) &&
          Object.keys(window.startEndDayDateData.closeDayDates).length > 0
        ) {
          const date = new Date(Number(toDate));
          date.setHours(23, 59, 59, 999);
          const checkCloseDate = date.getTime();
          const dates =
            window.startEndDayDateData.closeDayDates[checkCloseDate];
          if (dates && dates.length) {
            toDate = dates[dates.length - 1];
          }
        }
      }

      const params = {
        reportType: Number(currentReporttype),
        fromDate,
        toDate,
      };

      if (!window.__IS_MASTER_POS__) {
        Object.assign(params, {
          username: window.storeDetails.username,
        });
        if (window.showAllUserReport) {
          delete params.username;
        }
      }

      Object.assign(params, {
        getPaymentandItems: true,
        showCategoryData,
        showSolditems,
        showCancelitems,
        showExpenseData,
        showWaiterData,
        showDeliveryBoyData,
        showDiscountData,
        showWalletData,
        showKDWiseItemsData,
        username: valueSelected,
      });
      getreportData(params, REPORT_MESSAGES.GET_REPORTDATA);
    }
  });
  $('#salesreportFilterbyusercombo').on('change', function () {
    const valueSelected = this.value;
    $('#salesreportTableid')
      .DataTable()
      .column(12)
      .search(valueSelected)
      .draw();
    clickedReport();
  });

  $('#salesreportFiltercombo1,#salesreportFiltercombo2').on('change', () => {
    const filters = getSalesfilterbyname();
    checksalesFilterapplied = true;
    $('#salesreportTableid')
      .DataTable()
      .column(8)
      .search(filters[0])
      .column(10)
      .search(filters[1])
      .draw();
  });

  $('#salesreportFilterbydeliveryboycombo').on('change', function () {
    const valueSelected = this.value;
    checksalesFilterapplied = true;
    if (valueSelected == 'All') {
      $('#salesreportTableid')
        .DataTable()
        .column(13)
        .search('^(?!\\s*$).+', true, false)
        .draw();
    } else {
      $('#salesreportTableid')
        .DataTable()
        .column(13)
        .search(valueSelected)
        .draw();
    }

    // value => value !== null && value.trim() !== ""
  });

  getTerminalusers();
  getDeliveryBodyData();
}

async function getTerminalusers() {
  const users = await betteripcRenderer.callMain(
    USER_MODEL_IPC.GET_POS_USERS_ASYNC,
    {
      store_id: window.storeDetails.store_id,
    },
  );
  $('#salesreportFilterbyterminalcombo option:gt(0)').remove();
  $('#salesreportFilterbyusercombo option:gt(0)').remove();
  if (users && users.length > 0) {
    $('#salesreportFilterbyterminalcombo').show();
    forEach(users, (user) => {
      if (user.is_terminal_app) {
        $('<option>')
          .val(user.username)
          .text(user.name)
          .appendTo('#salesreportFilterbyterminalcombo');
      } else if ([0, 2, 4].includes(Number(user.userCategory))) {
        $('<option>')
          .val(user.username)
          .text(user.name)
          .appendTo('#salesreportFilterbyusercombo');
      }
    });
  } else {
    $('#salesreportFilterbyterminalcombo').hide();
    $(`#salesreportFilterbyusercombo`).hide();
  }
}

async function getDeliveryBodyData() {
  const deliveryboy = await betteripcRenderer.callMain(GET_DELIVERY_BOY_DATA, {
    store_id: window.storeDetails.store_id,
  });

  if (deliveryboy && deliveryboy.length) {
    const all = {
      name: 'All',
      value: 'all',
    };
    deliveryboy.unshift(all);
  }
  $('#salesreportFilterbydeliveryboycombo option:gt(0)').remove();

  if (deliveryboy && deliveryboy.length) {
    $('#salesreportFilterbydeliveryboycombo').show();
    forEach(deliveryboy, (deliveryboy) => {
      $('<option>')
        .val(deliveryboy.name)
        .text(deliveryboy.name)
        .appendTo('#salesreportFilterbydeliveryboycombo');
    });
  } else {
    $('#salesreportFilterbydeliveryboycombo').hide();
  }
}

function getSalesfilterbyname() {
  let firstFilter = '';
  let secondFilter = '';
  const selectionFirst = $(
    '#salesreportFiltercombo1 option:selected:not([disabled])',
  );
  const selectionSecond = $(
    '#salesreportFiltercombo2 option:selected:not([disabled])',
  );
  if (selectionFirst.length > 0) {
    firstFilter = $(selectionFirst).val();
  }
  if (selectionSecond.length > 0) {
    secondFilter = $(selectionSecond).val();
  }
  return [firstFilter, secondFilter];
}

/**
 * Initial setup
 */
function initialSetup() {
  $('#limitFieldid').hide();
  $('.byamountcheckDiv').hide();
}

/**
 * Called when user clicks on the report section
 * on left side
 * @param {Clicked element } element
 */
function reportclickListener(element) {
  // Remove the current selected class
  $('.reportscard').removeClass('selectedReport');
  // Add selected class to the clicked element
  $(element).addClass('selectedReport');
  // get the current clicked type
  currentReporttype = $(element).find('.card-body').attr('report-action');
  // let istodaysReport= $(this).find('.card-body').attr('is-todays-report');
  // Now check the report child who has the report type same
  // as the clicked report

  $(`#reportsListid li [report-action=${currentReporttype}]`).show();
  $('#reportsListid li').each(function () {
    const type = $(this).attr('report-action');
    if (type === currentReporttype) {
      $(this).show();
    } else {
      $(this).hide();
    }
  });
  setFilters();

  if (Number(currentReporttype) == REPORT_TYPES.TODAYS_REPORT) {
    $('#reportsListid li').each(function () {
      const type = $(this).attr('report-action');
      if (type === `${REPORT_TYPES.SALES_REPORT}`) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  }
  clickedReport();
}

async function clearfilterSelection() {
  // var $dates = $('#reportfromdateButton, #reportodateButton').datepicker();
  // $dates.datepicker('setDate', null);
  $('#limitFieldid').val('');
}

function getReportsubtitle(nameFilters) {
  nameFilters = nameFilters.filter((name) => name);
  const subtitle = [
    nameFilters.slice(0, -1).join(', '),
    nameFilters.slice(-1)[0],
  ].join(nameFilters.length < 2 ? '' : ' and ');
  return subtitle;
}
/**
 * Print the report data to the printer
 */
async function printcurrentReport({ converttoPdf }) {
  if (!currentReporttype) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:allReports.pleaseSelectReport'),
    );
    return;
  }
  let report_type = 'Report';

  let data = {};
  const previewDetails = {
    data,
  };

  if (fromDate && toDate) {
    let startDayDate = fromDate;
    let endDayDate = toDate;
    const isStartDaycheckChecked = $('#fetchReportasperclosedayCheckid').is(
      ':checked',
    );

    if (fetchReportAsPerCloseDay && isStartDaycheckChecked) {
      if (
        window.startEndDayDateData &&
        window.startEndDayDateData.startDayDates &&
        Object.keys(window.startEndDayDateData.startDayDates) &&
        Object.keys(window.startEndDayDateData.startDayDates).length > 0
      ) {
        const date = new Date(Number(fromDate));
        date.setHours(0, 0, 0, 0);
        let checkFromDate = date.getTime();
        const dates = window.startEndDayDateData.startDayDates[checkFromDate];
        if (dates && dates.length) {
          // fromDate = dates[0];
          startDayDate = dates[0];
        }
      }

      if (
        window.startEndDayDateData &&
        window.startEndDayDateData.closeDayDates &&
        Object.keys(window.startEndDayDateData.closeDayDates) &&
        Object.keys(window.startEndDayDateData.closeDayDates).length > 0
      ) {
        const date = new Date(Number(toDate));
        date.setHours(23, 59, 59, 999);
        const checkCloseDate = date.getTime();
        const dates = window.startEndDayDateData.closeDayDates[checkCloseDate];
        if (dates && dates.length) {
          // toDate = dates[dates.length - 1];
          endDayDate = dates[dates.length - 1];
        }
      }
    }

    const date1 = new Date(parseInt(startDayDate));
    const formattedDate = formatAMPM(date1, false);
    const date2 = new Date(parseInt(endDayDate));
    const formattedDate2 = formatAMPM(date2, false);
    // var formattedDate = moment(date1).format('DD/MM/YYYY');
    // var date2 = new Date(parseInt(toDate));
    // var formattedDate2 = moment(date2).format('DD/MM/YYYY');
    data.customDatetitle = `${$.i18n.t(
      'report.between',
    )} ${formattedDate} ${$.i18n.t('report.to')} ${formattedDate2}`;
  }
  const type = Number(currentReporttype);
  let table;
  switch (type) {
    case REPORT_TYPES.SALES_REPORT:
    case REPORT_TYPES.TODAYS_REPORT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#salesreportTableid').DataTable();

        const filterOptions = {};
        if (type == REPORT_TYPES.SALES_REPORT) {
          if ($('#salesreportTableid_filter input').val()) {
            filterOptions.filter = 'applied';
          }
        }
        if (checksalesFilterapplied) {
          filterOptions.search = 'applied';
          const nameFilters = getSalesfilterbyname();
          previewDetails.reportsubTitle = getReportsubtitle(nameFilters);
        }
        const rawbills = table.rows(filterOptions).data();
        if (rawbills.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const bills = [];
        for (let index = 0; index < rawbills.length; index++) {
          const rawelement = rawbills[index];
          if (
            window.storeDetails.bill_number_prefix &&
            rawelement.custom_bill_number
          ) {
            Object.assign(rawelement, {
              bill_number: rawelement.custom_bill_number,
            });
          }
          bills.push(rawelement);
        }
        data.bills = bills;

        if (REPORT_TYPES.TODAYS_REPORT === reportMiscdata.type) {
          Object.assign(data, {
            soldItems: reportMiscdata.soldItems
              ? reportMiscdata.soldItems
              : undefined,
            payments: reportMiscdata.payments
              ? reportMiscdata.payments
              : undefined,
            orderTypeWiseOrders: reportMiscdata.orderTypeWiseOrders
              ? reportMiscdata.orderTypeWiseOrders
              : undefined,
            expenses_list: reportMiscdata.expenses_list
              ? reportMiscdata.expenses_list
              : undefined,
            waiterSummary: reportMiscdata.waiterSummary
              ? reportMiscdata.waiterSummary
              : undefined,

            deliveryboySummary: reportMiscdata.deliveryboySummary
              ? reportMiscdata.deliveryboySummary
              : undefined,
            duePaymentSummary: reportMiscdata.duePaymentSummary
              ? reportMiscdata.duePaymentSummary
              : undefined,
            duePaymentReceivableSummary:
              reportMiscdata.duePaymentReceivableSummary
                ? reportMiscdata.duePaymentReceivableSummary
                : undefined,
            discountSummary: reportMiscdata.discountSummary
              ? reportMiscdata.discountSummary
              : undefined,
            walletSummary: reportMiscdata.walletSummary
              ? reportMiscdata.walletSummary
              : undefined,
            kdWiseItemSummary: reportMiscdata.kdWiseItemSummary
              ? reportMiscdata.kdWiseItemSummary
              : undefined,
            cancelledItems: reportMiscdata.cancelledItems
              ? reportMiscdata.cancelledItems
              : undefined,
            totalBills: reportMiscdata.totalBills
              ? reportMiscdata.totalBills
              : undefined,
            invoice_range: reportMiscdata.invoice_range
              ? reportMiscdata.invoice_range
              : undefined,
          });

          if (showCategoryData && reportMiscdata.catdataList) {
            Object.assign(data, {
              catwisedataList: reportMiscdata.catdataList,
            });
          }
        }
        const isDeliveryBoyFilterApplied = $(
          '#salesreportFilterbydeliveryboycombo',
        ).val();
        if (
          isDeliveryBoyFilterApplied &&
          reportMiscdata.deliveryboySummary &&
          reportMiscdata.deliveryboySummary.length
        ) {
          data = {};
          previewDetails.data = {};
          const deliveryBoyFilterData = reportMiscdata.deliveryboySummary.find(
            (d) => d.delivery_boy_name === isDeliveryBoyFilterApplied,
          );
          previewDetails.data.deliveryboySummary = [deliveryBoyFilterData];
          previewDetails.data.report_type = 'Sales Report';
          // const
        }
        // is send base64 allowed
        if (sendBase64String) {
          Object.assign(previewDetails, {
            sendBase64String,
            printReportWhileSendingOnMail,
            storeDetails: window.storeDetails,
            showLoader: true,
          });
        }
      }
      break;

    case REPORT_TYPES.CANCELLED_ITEMS:
    case REPORT_TYPES.COMPLEMENTARY_ITEMS:
    case REPORT_TYPES.DELETED_ITEMS:
      {
        report_type = $('#itemsreportsectionId div.selectedItemreport').html();
        table = $('#complementaryitemsreportTableid').DataTable();
        const rawItems = table.rows().data();
        if (rawItems.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        if (rawItems.length >= 200) {
          const result = await showreportistooBig();
          if (result.value) {
            return;
          }
        }
        const cancelledItems = [];
        for (let index = 0; index < rawItems.length; index++) {
          const rawelement = rawItems[index];
          const tempitem = {
            title: rawelement.title,
            qty: rawelement.qty ? rawelement.qty : '-',
            total: rawelement.finalamount ? rawelement.finalamount : '-',
            reason: rawelement.reason,
            username: rawelement.createdBy,
            alternative_title: rawelement.alternative_title,
            createdBy: rawelement.createdBy,
          };
          if (rawelement && rawelement.extra_details) {
            const extra_details = safeParse(rawelement.extra_details);
            if (
              window.selectedLanguage == 'en' &&
              extra_details.baseTitle &&
              $('#groupByBaseItemCheckid').is(':checked')
            ) {
              const title = extra_details.baseTitle;
              Object.assign(tempitem, {
                title,
              });
            }
          }
          if (rawelement.total) {
            tempitem.total = rawelement.total;
          }
          cancelledItems.push(tempitem);
        }

        data.cancelledItems = cancelledItems;
        data.hasCancelledItemsTitle = true;
      }
      break;
    case REPORT_TYPES.TOP_ITEMS:
    case REPORT_TYPES.SOLD_ITEMS:
    case REPORT_TYPES.SECTIONWISE_ITEMS:
    case REPORT_TYPES.DEAD_ITEMS:
    case REPORT_TYPES.ADDON_ITEMS:
      {
        report_type = $('#itemsreportsectionId div.selectedItemreport').html();
        switch (type) {
          case REPORT_TYPES.TOP_ITEMS:
          case REPORT_TYPES.SOLD_ITEMS:
          case REPORT_TYPES.ADDON_ITEMS:
            table = $('#itemsreportTableid').DataTable();
            break;
          case REPORT_TYPES.COMPLEMENTARY_ITEMS:
            table = $('#complementaryitemsreportTableid').DataTable();
            break;
          case REPORT_TYPES.DEAD_ITEMS:
            table = $('#deaditemsreportTableid').DataTable();
            break;
          // case REPORT_TYPES.DISCOUNTED_ITEMS:
          //     table = $('#discounteditemsreportTableid').DataTable();
          //     break;

          default:
            break;
        }

        const rawItems = table.rows().data();
        if (rawItems.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }

        if (rawItems.length >= 200) {
          const result = await showreportistooBig();
          if (result.value) {
            return;
          }
        }
        const soldItems = [];

        for (let index = 0; index < rawItems.length; index++) {
          const rawelement = rawItems[index];
          if (rawelement.finalPrice == 0) {
            rawelement.finalamount = undefined;
          }
          const tempitem = {
            title: rawelement.title,
            qty: rawelement.qty ? rawelement.qty : '-',
            total: rawelement.finalamount ? rawelement.finalamount : '-',
            alternative_title: rawelement.alternative_title,
          };
          if (rawelement && rawelement.extra_details) {
            const extra_details = safeParse(rawelement.extra_details);
            if (
              window.selectedLanguage == 'en' &&
              extra_details.baseTitle &&
              $('#groupByBaseItemCheckid').is(':checked')
            ) {
              const title = extra_details.baseTitle;
              Object.assign(tempitem, {
                title,
              });
            }
          }

          if (
            window.selectedLanguage !== 'en' &&
            !tempitem.alternative_title &&
            rawelement.extra_details
          ) {
            const extra_details = safeParse(rawelement.extra_details);
            if (extra_details.alternative_title) {
              Object.assign(tempitem, {
                alternative_title: extra_details.alternative_title,
              });
            }
          }
          soldItems.push(tempitem);
        }

        data.soldItems = soldItems;
        data.showSolditems = true;
        data.hidesolditemsTitle = true;
      }
      break;
    case REPORT_TYPES.PAYMENT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#paymentreportTableid').DataTable();
        const rawbills = table.rows().data();
        if (rawbills.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < rawbills.length; index++) {
          datalist.push({
            payment_option: rawbills[index].payment_option,
            transactions: rawbills[index].count,
            amount: rawbills[index].amount,
            status: rawbills[index].order_state,
          });
        }
        data.payments = datalist;
        data.bills = bills;
        data.addStatuscolumn = true;
        data.invoice_range = invoice_range;
        data.totalBills = bills.length;
        data.showPaymentsForceFully = true;
      }
      break;
    case REPORT_TYPES.VAT_REPORT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#vatreportTableid').DataTable();
        const rawbills = table.rows().data();
        if (rawbills.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < rawbills.length; index++) {
          datalist.push({
            Category: rawbills[index].product_group_name,
            Price: rawbills[index].totalAmount,
            Orders: rawbills[index].orders,
            TaxPer: rawbills[index].taxPercentage,
            Tax: rawbills[index].totalTax,
            Total: rawbills[index].total,
          });
        }

        const nextRportNumber = await betteripcRenderer.callMain(
          GET_REPORT_NUMBER,
          {},
        );
        if (nextRportNumber) {
          data.nextReportNumber = nextRportNumber;
        }

        data.taxReport = datalist;
        data.paymentData = paymentsData;
        data.totalBillsForTaxReport = totalBillsForTaxReport;
        data.totalChargesForTaxReport = totalChargesForTaxReport;
        data.totalDiscountForTaxReport = totalDiscountForTaxReport;
        data.addStatuscolumn = true;
      }
      break;
    case REPORT_TYPES.ORDER_FROM:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#orderreportTableid').DataTable();
        const rawbills = table.rows().data();
        if (rawbills.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < rawbills.length; index++) {
          datalist.push({
            order_from: rawbills[index].billing_type,
            transactions: rawbills[index].count,
            amount: rawbills[index].amount,
            status: rawbills[index].order_state,
            totalTax: rawbills[index].totalTax,
            totalDiscount: rawbills[index].totalDiscount,
            totalCharges: rawbills[index].totalCharges,
          });
        }
        data.orderfromList = datalist;
        data.showorderstatewiseTotal = true;
        data.invoice_range = invoice_range;
        data.totalBills = bills.length;
      }
      break;

    case REPORT_TYPES.CATEGORYWISE:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#catwisereportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < rawData.length; index++) {
          datalist.push({
            name: rawData[index].category_name,
            count: rawData[index].count,
            total: rawData[index].total,
            items: rawData[index].items,
            alternative_title: rawData[index].alternative_title,
          });
        }
        data.printwithItems = $('#reportcatwithItemscheckid').is(':checked');
        data.groupByBaseItem = $('#groupByBaseItemCheckid').is(':checked');
        data.catwisedataList = datalist;
      }
      break;
    case REPORT_TYPES.KDWISE:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#kitchendepreportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < rawData.length; index++) {
          datalist.push({
            name: rawData[index].kitchen_dept_name,
            count: rawData[index].count,
            total: rawData[index].total,
          });
        }
        data.kdwisedataList = datalist;
      }
      break;
    case REPORT_TYPES.DISCOUNTED_ITEMS:
      {
        report_type = $('#itemsreportsectionId div.selectedItemreport').html();
        table = $('#discounteditemsreportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < rawData.length; index++) {
          const rawelement = rawData[index];
          let title = rawelement.title;
          if (rawelement && rawelement.extra_details) {
            const extra_details = safeParse(rawelement.extra_details);
            if (
              window.selectedLanguage == 'en' &&
              extra_details.baseTitle &&
              $('#groupByBaseItemCheckid').is(':checked')
            ) {
              title = extra_details.baseTitle;
            }
          }
          datalist.push({
            title,
            qty: rawelement.qty ? rawelement.qty : '-',
            totalDiscount: Number(
              Number(rawelement.totalDiscount).toFixed(window.ROUNDOFF_UPTO),
            ),
            price: rawelement.price,
            finalamount: rawelement.finalamount ? rawelement.finalamount : '-',
            alternative_title: rawelement.alternative_title,
          });
        }
        data.discountedItemslist = datalist;
      }
      break;
    case REPORT_TYPES.COUPON_HISTORY:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#couponreportTableid').DataTable();
        const filterOptions = {};
        if ($('#couponreportTableid_filter input').val()) {
          filterOptions.filter = 'applied';
        }

        const couponData = table.rows(filterOptions).data();
        if (couponData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < couponData.length; index++) {
          datalist.push({
            coupon_code: couponData[index].coupon_code,
            customer_name: couponData[index].customer_name,
            customer_phone: couponData[index].customer_phone,
            coupon_code_amt: couponData[index].coupon_code_amt,
          });
        }
        data.couponhistorydataList = datalist;
      }
      break;
    case REPORT_TYPES.DUE_PAYMENT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#duepayreportTableid').DataTable();
        const filterOptions = {};
        if ($('#duepayreportTableid_filter input').val()) {
          filterOptions.filter = 'applied';
        }
        const startendData = table.rows(filterOptions).data();
        if (startendData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < startendData.length; index++) {
          datalist.push({
            order_id: startendData[index].order_id,
            cust_mobile: startendData[index].cust_mobile,
            order_amount: startendData[index].amount_to_pay,
            received_amount: startendData[index].received_amount,
            due_amount: startendData[index].due_amount,
            payment_info: startendData[index].payment_info,
            billing_user_id: startendData[index].billing_user_id,
            created: startendData[index].created,
            cust_name: startendData[index].cust_name,
          });
        }
        data.duepaymentData = datalist;
      }
      break;
    case REPORT_TYPES.DUE_BY_CUSTOMER:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#customerduepayreportTableid').DataTable();
        const filterOptions = {};
        if ($('#customerduepayreportTableid input').val()) {
          filterOptions.filter = 'applied';
        }
        const startendData = table.rows(filterOptions).data();
        if (startendData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < startendData.length; index++) {
          datalist.push({
            cust_mobile: startendData[index].cust_mobile,
            due_amount: startendData[index].due_payment,
            cust_name: startendData[index].cust_name,
          });
        }
        data.duepaymentData = datalist;
      }
      break;
    case REPORT_TYPES.DUE_PAYMENT_HISTORY:
      {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:allReports.thisSectionIsNonReportSection'),
        );
        return;
      }
      break;
    case REPORT_TYPES.BILLPRINT_HISTORY:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#billprintreportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < rawData.length; index++) {
          datalist.push({
            order_id: rawData[index].order_id,
            order_total: rawData[index].order_total,
            billing_type: rawData[index].billing_type,
            order_state: rawData[index].order_state,
            print_status: rawData[index].print_status,
          });
        }
        data.billprintReportlist = datalist;
      }
      break;
    case REPORT_TYPES.APPLIED_CHARGES_HISTORY:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#appliedchargesreportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < rawData.length; index++) {
          datalist.push({
            order_id: rawData[index].order_id,
            title: rawData[index].title,
            value: rawData[index].value,
            status_flag: rawData[index].status_flag,
          });
        }
        data.appliedchargesReportlist = datalist;
      }
      break;
    case REPORT_TYPES.PRE_ORDER_REPORT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#preorderreportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < rawData.length; index++) {
          datalist.push({
            ...rawData[index],
          });
        }
        data.preordersList = datalist;
      }
      break;
    case REPORT_TYPES.DELIVERY_BOY_REPORT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#deliveryBoyreportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < rawData.length; index++) {
          datalist.push({
            ...rawData[index],
          });
        }
        data.deliveryBoyList = datalist;
      }
      break;

    case REPORT_TYPES.USER_REPORT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#userreportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < rawData.length; index++) {
          datalist.push({
            ...rawData[index],
          });
        }
        data.userwiseList = datalist;
      }
      break;
    // appliedchargesReportlist
    default:
      break;
  }
  report_type = String(report_type)
    .replace(/\s{2,}/g, ' ')
    .trim();

  previewDetails.report_type = report_type;
  if (converttoPdf) previewDetails.converttoPdf = converttoPdf;
  renderReport(previewDetails);
}

async function renderReport(previewDetails) {
  if (window.reportsscriptLoaded) {
    $('#reportprintBodyid').data('data', previewDetails);
    await redrawReportview();
  } else {
    $('#reportprintBodyid').data('data', previewDetails);
    $('#reportprintBodyid').load('Report.html', () => {
      redrawReportview();
    });
  }
  if (previewDetails.converttoPdf) {
    setTimeout(() => {
      window.notifyUser.showMessage(
        'success',
        $.i18n.t('controller:allReports.PDFGenerated'),
      );
    }, 300);
  }
}

function getBillstatusreason(instruction) {
  if (instruction && String(instruction).includes('Bill Status::')) {
    const allreasons = String(instruction).split('|');
    const result = filter(allreasons, (o) => o.includes('Bill Status::'));
    if (result && result.length) {
      return String(result[0]).replace('Bill Status::', '');
    }
  }
}

/**
 * Export selected report to excel
 */
async function exportreporttoExcel() {
  if (!currentReporttype) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:allReports.pleaseSelectReport'),
    );
    return;
  }
  let report_type = 'Report';
  const customDatetitle = moment().format('DD-MM-YYYY');
  const reportData = { customDatetitle };

  const type = Number(currentReporttype);
  let table;

  switch (type) {
    case REPORT_TYPES.SALES_REPORT:
    case REPORT_TYPES.TODAYS_REPORT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#salesreportTableid').DataTable();
        const filterOptions = {};
        if (type == REPORT_TYPES.SALES_REPORT) {
          if ($('#salesreportTableid_filter input').val()) {
            filterOptions.filter = 'applied';
          }
        }

        if (checksalesFilterapplied) {
          filterOptions.search = 'applied';
        }

        const rawbills = table.rows(filterOptions).data();
        if (rawbills.length == 0) {
          window.notifyUser.showMessage('error', 'No data.', 0);
          return;
        }
        const bills = [];
        let totalAmount = 0;
        let sellExemptedTotal = 0;
        let totalTax = 0;
        let totalDiscount = 0;
        let totalCharges = 0;
        let orderLevelTotalCharges = 0;
        let sellExemptedTotalCharges = 0;
        let itemLevelTotalCharges = 0;
        let totalTaxOnCharges = 0;
        let totalNetSale = 0;
        let totalSaleExemptTotal = 0;
        let totalOrderAmount = 0;

        let totalNetSalechargeTax = 0;
        let totalNetsaletax = 0;
        let totalNetSaleRound = 0;
        for (let index = 0; index < rawbills.length; index++) {
          if (rawbills[index].extra_details) {
            Object.assign(rawbills[index], {
              extraDetails: safeParse(rawbills[index].extra_details),
            });
          }

          let sale_exempt_total = 0;
          if (rawbills[index].extra_details) {
            let extra_details = safeParse(rawbills[index].extra_details);
            if (extra_details && extra_details.sale_exempt_total) {
              sale_exempt_total = extra_details.sale_exempt_total;
              totalSaleExemptTotal += sale_exempt_total;
            }
          }

          // net sale
          let net_sale = 0;
          if (rawbills[index].order_state === OrderState.FULFILLED) {
            net_sale =
              rawbills[index].order_total -
              ((Number(rawbills[index].order_level_total_taxes) || 0) +
                (Number(rawbills[index].charges_level_total_tax) || 0)) -
              (Number(rawbills[index].extra_details.roundedAmount) || 0);
            totalNetSale += net_sale;
            totalNetSalechargeTax += 0;
            totalNetsaletax +=
              Number(rawbills[index].order_level_total_taxes) || 0;
            let totalNetSaleRound = 0;
          }

          const rawelement = {
            'Order ID': rawbills[index].order_id,
            'Custom Order ID':
              rawbills[index].extraDetails &&
              rawbills[index].extraDetails.customOrderId
                ? rawbills[index].extraDetails.customOrderId
                : '',
            'Bill Number': rawbills[index].bill_number,
            'custom bill number':
              !['Zomato', 'Swiggy', 'Digital Order'].includes(
                rawbills[index].billing_type,
              ) && !safeParse(rawbills[index].extra_details).isBarSection
                ? rawbills[index].custom_bill_number
                : '',
            'Sec. custom bill number': [
              'Zomato',
              'Swiggy',
              'Digital Order',
            ].includes(rawbills[index].billing_type)
              ? rawbills[index].custom_bill_number
              : '',
            'BAR bill number':
              !['Zomato', 'Swiggy', 'Digital Order'].includes(
                rawbills[index].billing_type,
              ) && safeParse(rawbills[index].extra_details).isBarSection
                ? rawbills[index].custom_bill_number
                : '',
            Table: rawbills[index].table_name,
            Amount: Number(rawbills[index].order_total).toFixed(ROUNDOFF_UPTO),
            Tax: Number(rawbills[index].order_level_total_taxes).toFixed(
              ROUNDOFF_UPTO,
            ),
            Discount: Number(rawbills[index].discount).toFixed(ROUNDOFF_UPTO),
            'Discount Reason': rawbills[index].instructions,
            // 'Charges': Number(rawbills[index].order_level_total_charges_without_tax),
            'Total Charges': (
              Number(
                Number(
                  rawbills[index].order_level_total_charges_without_tax,
                ).toFixed(ROUNDOFF_UPTO) || 0,
              ) +
              Number(
                Number(rawbills[index].item_level_total_charges).toFixed(
                  ROUNDOFF_UPTO,
                ) || 0,
              )
            ).toFixed(ROUNDOFF_UPTO),
            'Order level Charges': Number(
              rawbills[index].order_level_total_charges_without_tax,
            ).toFixed(ROUNDOFF_UPTO),
            'Item level Charges': Number(
              rawbills[index].item_level_total_charges,
            ).toFixed(ROUNDOFF_UPTO),
            'Tax on Charge':
              Number(rawbills[index].charges_level_total_tax).toFixed(
                ROUNDOFF_UPTO,
              ) || 0,
            User: rawbills[index].createdBy,
            Payment: rawbills[index].payment,
            Date: formatAMPM(new Date(rawbills[index].created_time)),
            'MITI Date':
              window.storeDetails.country == 'Nepal'
                ? `${new NepaliDate(
                    new Date(rawbills[index].my_order_date),
                  ).format('DD-MMMM-YYYY')} ${moment(
                    parseInt(rawbills[index].created_time),
                  ).format('hh:mm A')}`
                : '',
            Status: rawbills[index].order_state,
            'Customer Name': rawbills[index].cust_name,
            'Customer Mobile': rawbills[index].phone,
            'Delivery Boy': rawbills[index].delivery_boy_name,
            'Delivery Boy Mobile': rawbills[index].delivery_boy_phone,
            Instruction:
              getBillstatusreason(rawbills[index].instructions) || '',
            'Guest/Covers': rawbills[index].persons || 1,
            'Net Sale': net_sale,
            'Liquor sale exempted': sale_exempt_total,
          };

          //
          if (countSellExemptedTotal) {
            if (
              ![
                'Dine In',
                'Dine-In',
                'Pickup',
                'Delivery',
                'Quick Bill',
                'Digital Order',
                0,
                1,
                2,
                3,
                8,
              ].includes(rawbills[index].billing_type)
            ) {
              Object.assign(rawelement, {
                'Sale-EXEMPT': Number(rawbills[index].order_total).toFixed(
                  ROUNDOFF_UPTO,
                ),
                Amount: 0,
                'Sale-Exempted Packing Charges': Number(
                  rawbills[index].order_level_total_charges_without_tax,
                ).toFixed(ROUNDOFF_UPTO),
                'Order level Charges': 0,
              });
              sellExemptedTotal += Number(rawbills[index].order_total);
              sellExemptedTotalCharges +=
                rawbills[index].order_level_total_charges_without_tax;
            }
          }

          if (
            [
              'Dine In',
              'Dine-In',
              'Pickup',
              'Delivery',
              'Quick Bill',
              'Digital Order',
              0,
              1,
              2,
              3,
              8,
            ].includes(rawbills[index].billing_type)
          ) {
            totalAmount += Number(rawbills[index].order_total);
            orderLevelTotalCharges += Number(
              rawbills[index].order_level_total_charges_without_tax,
            );
          }
          totalTax += Number(rawbills[index].order_level_total_taxes);
          totalDiscount += Number(rawbills[index].discount);
          totalCharges +=
            (Number(rawbills[index].order_level_total_charges_without_tax) ||
              0) + (Number(rawbills[index].item_level_total_charges) || 0);

          itemLevelTotalCharges += Number(
            rawbills[index].item_level_total_charges,
          );
          totalTaxOnCharges += Number(rawbills[index].charges_level_total_tax);

          totalOrderAmount += Number(rawbills[index].order_total);
          // if (window.storeDetails.bill_number_prefix
          //     && rawbills[index].custom_bill_number) {
          //     Object.assign(rawelement, {
          //         'Bill Number': rawbills[index].custom_bill_number
          //     });
          // }

          if (rawbills[index].instructions) {
            if (rawbills[index].instructions.includes('Discount')) {
              let discountReason = String(rawbills[index].instructions)
                .split('|')
                .filter((x) => x && x.includes(`Discount::`));
              if (discountReason) {
                discountReason = String(discountReason).replace(
                  'Discount::',
                  '',
                );
                Object.assign(rawelement, {
                  'Discount Reason': discountReason,
                });
              }
            } else {
              Object.assign(rawelement, {
                'Discount Reason': '',
              });
            }
          }

          if (
            rawbills[index].payment &&
            String(rawbills[index].payment).toLowerCase() !== 'split' &&
            rawbills[index].hasDuepayment &&
            rawbills[index].due_payment &&
            Number(rawbills[index].due_payment > 0)
          ) {
            rawelement.Payment = 'Due Payment';
          }
          bills.push(rawelement);
        }

        const summaryData = {
          'Order ID': 'Summary',
          'Custom Order ID': '',
          'Bill Number': '',
          'custom bill number': '',
          'Sec. custom bill number': '',
          'BAR bill number': '',
          Table: '',
          Amount: Number(totalOrderAmount).toFixed(ROUNDOFF_UPTO),
          Tax: Number(totalTax).toFixed(ROUNDOFF_UPTO),
          Discount: Number(totalDiscount).toFixed(ROUNDOFF_UPTO),
          'Discount Reason': '',
          // 'Charges': Number(rawbills[index].order_level_total_charges_without_tax),
          'Total Charges': Number(totalCharges).toFixed(ROUNDOFF_UPTO),
          'Order level Charges': Number(orderLevelTotalCharges).toFixed(
            ROUNDOFF_UPTO,
          ),
          'Item level Charges': Number(itemLevelTotalCharges).toFixed(
            ROUNDOFF_UPTO,
          ),
          'Tax on Charge': Number(totalTaxOnCharges).toFixed(ROUNDOFF_UPTO),
          User: '',
          Payment: '',
          Date: '',
          'MITI Date': '',
          Status: '',
          'Customer Name': '',
          'Customer Mobile': '',
          'Delivery Boy': '',
          'Delivery Boy Mobile': '',
          Instruction: '',
          'Guest/Covers': '',
          'Net Sale': totalNetSale,
          'Liquor sale exempted': totalSaleExemptTotal,
        };

        if (countSellExemptedTotal) {
          if (sellExemptedTotal) {
            Object.assign(summaryData, {
              'Sale-EXEMPT': sellExemptedTotal,
            });
          }

          if (sellExemptedTotalCharges) {
            Object.assign(summaryData, {
              'Sale-Exempted Packing Charges': sellExemptedTotalCharges,
            });
          }
        }

        bills.push(summaryData);
        reportData.data = bills;
      }
      break;

    case REPORT_TYPES.CANCELLED_ITEMS:
    case REPORT_TYPES.COMPLEMENTARY_ITEMS:
    case REPORT_TYPES.DELETED_ITEMS:
      {
        report_type = $('#itemsreportsectionId div.selectedItemreport').html();
        table = $('#complementaryitemsreportTableid').DataTable();
        const rawItems = table.rows().data();
        if (rawItems.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        if (rawItems.length >= 200) {
          const result = await showreportistooBig();
          if (result.value) {
            return;
          }
        }
        const cancelledItems = [];
        let totalAmount = 0;
        let totalQuantity = 0;
        for (let index = 0; index < rawItems.length; index++) {
          const rawelement = rawItems[index];

          let title = rawelement.title;
          if (rawelement && rawelement.extra_details) {
            const extra_details = safeParse(rawelement.extra_details);
            if (
              window.selectedLanguage == 'en' &&
              extra_details.baseTitle &&
              $('#groupByBaseItemCheckid').is(':checked')
            ) {
              title = extra_details.baseTitle;
            }
          }
          if (
            window.selectedLanguage !== 'en' &&
            rawelement.alternative_title
          ) {
            title = rawelement.alternative_title;
          }
          const tempitem = {
            Title: title,
            Quantity: rawelement.qty ? rawelement.qty : '-',
            Total: rawelement.total
              ? Number(rawelement.total).toFixed(ROUNDOFF_UPTO)
              : '-',
            Reason: rawelement.reason,
            Username: rawelement.createdBy,
          };

          totalAmount += Number(rawelement.total);
          totalQuantity += Number(rawelement.qty);

          cancelledItems.push(tempitem);
        }

        const summaryData = {
          Title: 'summary',
          Quantity: totalQuantity,
          Total: Number(totalAmount).toFixed(ROUNDOFF_UPTO),
          Reason: '',
          Username: '',
        };

        cancelledItems.push(summaryData);

        reportData.data = cancelledItems;
      }
      break;
    case REPORT_TYPES.TOP_ITEMS:
    case REPORT_TYPES.SOLD_ITEMS:
    case REPORT_TYPES.SECTIONWISE_ITEMS:
    case REPORT_TYPES.DEAD_ITEMS:
    case REPORT_TYPES.ADDON_ITEMS:
      {
        report_type = $('#itemsreportsectionId div.selectedItemreport').html();
        switch (type) {
          case REPORT_TYPES.TOP_ITEMS:
          case REPORT_TYPES.SOLD_ITEMS:
          case REPORT_TYPES.ADDON_ITEMS:
            table = $('#itemsreportTableid').DataTable();
            break;
          case REPORT_TYPES.COMPLEMENTARY_ITEMS:
            table = $('#complementaryitemsreportTableid').DataTable();
            break;
          case REPORT_TYPES.DEAD_ITEMS:
            table = $('#deaditemsreportTableid').DataTable();
            break;
          // case REPORT_TYPES.DISCOUNTED_ITEMS:
          //     table = $('#discounteditemsreportTableid').DataTable();
          //     break;
          default:
            break;
        }

        const rawItems = table.rows().data();
        if (rawItems.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }

        if (rawItems.length >= 200) {
          const result = await showreportistooBig();
          if (result.value) {
            return;
          }
        }
        const soldItems = [];
        let totalAmount = 0;
        let totalQuantity = 0;
        let totalwithTax = 0;
        let totalWithoutTax = 0;
        for (let index = 0; index < rawItems.length; index++) {
          const rawelement = rawItems[index];
          let title = rawelement.title;
          if (rawelement && rawelement.extra_details) {
            const extra_details = safeParse(rawelement.extra_details);
            if (
              window.selectedLanguage == 'en' &&
              extra_details.baseTitle &&
              $('#groupByBaseItemCheckid').is(':checked')
            ) {
              title = extra_details.baseTitle;
            }
          }
          if (
            window.selectedLanguage !== 'en' &&
            rawelement.alternative_title
          ) {
            title = rawelement.alternative_title;
          }

          if (
            window.selectedLanguage !== 'en' &&
            !rawelement.alternative_title &&
            rawelement.extra_details
          ) {
            const extra_details = safeParse(rawelement.extra_details);
            if (extra_details && extra_details.alternative_title) {
              title = extra_details.alternative_title;
            }
          }

          if (rawelement && rawelement.extra_details) {
            const extra_details = safeParse(rawelement.extra_details);
            if (
              window.selectedLanguage == 'en' &&
              extra_details.baseTitle &&
              $('#groupByBaseItemCheckid').is(':checked')
            ) {
              title = extra_details.baseTitle;
            }
          }
          const tempitem = {
            Title: title,
            Quantity: rawelement.qty ? rawelement.qty : '-',
            Price: rawelement.finalPrice
              ? rawelement.finalPrice
              : rawelement.total
                ? Number(rawelement.total).toFixed(ROUNDOFF_UPTO)
                : '-',
          };
          if (rawelement.total_with_tax !== undefined) {
            Object.assign(tempitem, {
              'Total with tax': Number(rawelement.total_with_tax).toFixed(
                ROUNDOFF_UPTO,
              ),
              'Total without tax': Number(rawelement.total_withouttax).toFixed(
                ROUNDOFF_UPTO,
              ),
            });
            totalWithoutTax += Number(rawelement.total_withouttax);
            totalwithTax += Number(rawelement.total_with_tax);
          }
          totalAmount += Number(rawelement.finalPrice)
            ? Number(rawelement.finalPrice)
            : Number(rawelement.total);
          totalQuantity += Number(rawelement.qty);
          soldItems.push(tempitem);
        }

        const summaryData = {
          Title: 'summary',
          Quantity: totalQuantity,
          Price: Number(totalAmount).toFixed(ROUNDOFF_UPTO),
          'Total with tax': Number(totalwithTax).toFixed(ROUNDOFF_UPTO),
          'Total without tax': Number(totalWithoutTax).toFixed(ROUNDOFF_UPTO),
        };
        soldItems.push(summaryData);
        reportData.data = soldItems;
      }
      break;
    case REPORT_TYPES.DISCOUNTED_ITEMS:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#discounteditemsreportTableid').DataTable();
        const rawbills = table.rows().data();
        if (rawbills.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        let totalQuantity = 0;
        let totalDiscount = 0;
        let finalTotal = 0;
        for (let index = 0; index < rawbills.length; index++) {
          const rawelement = rawbills[index];
          let title = rawelement.title;
          if (rawelement && rawelement.extra_details) {
            const extra_details = safeParse(rawelement.extra_details);
            if (
              window.selectedLanguage == 'en' &&
              extra_details.baseTitle &&
              $('#groupByBaseItemCheckid').is(':checked')
            ) {
              title = extra_details.baseTitle;
            }
          }
          if (
            window.selectedLanguage !== 'en' &&
            rawelement.alternative_title
          ) {
            title = rawelement.alternative_title;
          }
          datalist.push({
            Title: title,
            Quantity: rawelement.qty ? rawelement.qty : '-',
            Discount: Number(rawelement.totalDiscount).toFixed(ROUNDOFF_UPTO),
            Price: Number(rawelement.price).toFixed(ROUNDOFF_UPTO),
            Total: rawelement.finalamount
              ? Number(rawelement.finalamount).toFixed(ROUNDOFF_UPTO)
              : '-',
          });
          finalTotal += rawelement.finalamount;
          totalQuantity += rawelement.qty;
          totalDiscount += rawelement.totalDiscount;
        }
        const summaryData = {
          Title: 'summary',
          Quantity: totalQuantity,
          Discount: Number(totalDiscount).toFixed(ROUNDOFF_UPTO),
          Price: '',
          Total: Number(finalTotal).toFixed(ROUNDOFF_UPTO),
        };
        datalist.push(summaryData);
        reportData.data = datalist;
      }
      break;
    case REPORT_TYPES.PAYMENT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#paymentreportTableid').DataTable();
        const rawbills = table.rows().data();
        if (rawbills.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        let totalAmount = 0;
        let totalCount = 0;
        for (let index = 0; index < rawbills.length; index++) {
          datalist.push({
            'Payment From': rawbills[index].payment_option,
            count: rawbills[index].count,
            amount: Number(rawbills[index].amount).toFixed(ROUNDOFF_UPTO),
            status: rawbills[index].order_state,
          });
          totalAmount += Number(rawbills[index].amount);
          totalCount += rawbills[index].count;
        }

        const summaryData = {
          'Payment From': 'summary',
          count: totalCount,
          amount: Number(totalAmount).toFixed(ROUNDOFF_UPTO),
          status: '',
        };
        datalist.push(summaryData);
        reportData.data = datalist;
      }
      break;

    case REPORT_TYPES.VAT_REPORT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#vatreportTableid').DataTable();
        const rawData = table.rows().data();

        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        let totalItems = 0;
        let totalTax = 0;
        let totalAmount = 0;
        for (let index = 0; index < rawData.length; index++) {
          datalist.push({
            Category: rawData[index].product_group_name,
            Price: Number(rawData[index].totalAmount).toFixed(
              window.ROUNDOFF_UPTO,
            ),
            Items: rawData[index].orders,
            'Tax %': rawData[index].taxPercentage,
            Tax: Number(rawData[index].totalTax).toFixed(window.ROUNDOFF_UPTO),
            Total: Number(rawData[index].total).toFixed(window.ROUNDOFF_UPTO),
          });

          totalItems += Number(rawData[index].orders);
          totalTax += Number(rawData[index].totalTax);
          totalAmount += Number(rawData[index].total);
        }
        const summaryData = {
          Category: 'summary',
          Price: '',
          Items: totalItems.toFixed(window.ROUNDOFF_UPTO),
          'Tax %': '',
          Tax: Number(totalTax).toFixed(window.ROUNDOFF_UPTO),
          Total: Number(totalAmount).toFixed(window.ROUNDOFF_UPTO),
        };
        datalist.push(summaryData);
        reportData.data = datalist;
      }
      break;

    case REPORT_TYPES.ORDER_FROM:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#orderreportTableid').DataTable();
        const rawbills = table.rows().data();
        if (rawbills.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        let totalCount = 0;
        let totalAmount = 0;

        for (let index = 0; index < rawbills.length; index++) {
          datalist.push({
            'Order From': rawbills[index].billing_type,
            count: rawbills[index].count,
            amount: Number(rawbills[index].amount).toFixed(ROUNDOFF_UPTO),
            status: rawbills[index].order_state,
          });
          totalCount += Number(rawbills[index].count);
          totalAmount += Number(rawbills[index].amount);
        }

        const summaryData = {
          'Order From': 'summary',
          count: totalCount,
          amount: Number(totalAmount).toFixed(ROUNDOFF_UPTO),
          status: '',
        };
        datalist.push(summaryData);
        reportData.data = datalist;
        reportData.addPaymentcolumn = true;
      }
      break;
    case REPORT_TYPES.CATEGORYWISE:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#catwisereportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < rawData.length; index++) {
          const categoryReport = {
            Category: rawData[index].category_name,
            'Sold Items': rawData[index].count,
            Total: Number(rawData[index].total).toFixed(ROUNDOFF_UPTO),
          };
          datalist.push(categoryReport);
          const categoryItems = rawData[index].items;
          if (
            categoryItems &&
            Array.isArray(categoryItems) &&
            categoryItems.length
          ) {
            let allitemscount = 0;
            let totalwithoutTax = 0;
            let totalwithTax = 0;

            for (const item of categoryItems) {
              allitemscount += Number(item.count);
              totalwithoutTax += Number(item.total_withouttax);
              totalwithTax += Number(item.total_with_tax);
              let itemTitle = item.title;
              if (item && item.extra_details) {
                const extra_details = safeParse(item.extra_details);
                if (
                  window.selectedLanguage == 'en' &&
                  extra_details.baseTitle &&
                  $('#groupByBaseItemCheckid').is(':checked')
                ) {
                  itemTitle = extra_details.baseTitle;
                }
              }

              datalist.push({
                'Item Title': itemTitle,
                'Item Qty': item.count,
                'Total without tax': Number(item.total_withouttax).toFixed(
                  ROUNDOFF_UPTO,
                ),
                'Total with tax': Number(item.total_with_tax).toFixed(
                  ROUNDOFF_UPTO,
                ),
              });
            }

            datalist.push({
              'Item Title': 'summary',
              'Item Qty': allitemscount,
              'Total without tax':
                Number(totalwithoutTax).toFixed(ROUNDOFF_UPTO),
              'Total with tax': Number(totalwithTax).toFixed(ROUNDOFF_UPTO),
            });
          }
        }
        reportData.data = datalist;
      }
      break;
    case REPORT_TYPES.KDWISE:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#kitchendepreportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        let totalQuantity = 0;
        let totalAmount = 0;
        for (let index = 0; index < rawData.length; index++) {
          datalist.push({
            'Kitchen Department': rawData[index].kitchen_dept_name,
            'Sold Items': rawData[index].count,
            Total: Number(rawData[index].total).toFixed(ROUNDOFF_UPTO),
          });
          totalQuantity += Number(rawData[index].count);
          totalAmount += Number(rawData[index].total);
        }
        const summaryData = {
          'Kitchen Department': 'summary',
          'Sold Items': totalQuantity,
          Total: Number(totalAmount).toFixed(ROUNDOFF_UPTO),
        };
        datalist.push(summaryData);
        reportData.data = datalist;
      }
      break;
    case REPORT_TYPES.COUPON_HISTORY:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#couponreportTableid').DataTable();
        const filterOptions = {};
        if ($('#couponreportTableid_filter input').val()) {
          filterOptions.filter = 'applied';
        }
        const couponData = table.rows(filterOptions).data();
        if (couponData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        let coupontotalAmount = 0;
        for (let index = 0; index < couponData.length; index++) {
          datalist.push({
            Coupon: couponData[index].coupon_code,
            'Customer Name': couponData[index].customer_name,
            'Customer Phone': couponData[index].customer_phone,
            'Coupon Amount': Number(couponData[index].coupon_code_amt).toFixed(
              ROUNDOFF_UPTO,
            ),
          });
          coupontotalAmount += Number(couponData[index].coupon_code_amt);
        }

        const summaryData = {
          Coupon: 'summary',
          'Customer Name': '',
          'Customer Phone': '',
          'Coupon Amount': Number(coupontotalAmount).toFixed(ROUNDOFF_UPTO),
        };
        datalist.push(summaryData);
        reportData.data = datalist;
      }
      break;
    case REPORT_TYPES.USER_SHIFT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#usershiftreportTableid').DataTable();
        const filterOptions = {};
        if ($('#usershiftreportTableid_filter input').val()) {
          filterOptions.filter = 'applied';
        }
        const usershiftData = table.rows(filterOptions).data();
        if (usershiftData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        let totalopeningbalance = 0;
        let totalclosingbalanace = 0;
        let totalExpense = 0;
        let totalSale = 0;
        for (let index = 0; index < usershiftData.length; index++) {
          datalist.push({
            'Start Day': usershiftData[index].shift_start_date,
            'End Day': usershiftData[index].shift_end_date,
            'Shift Start By': usershiftData[index].shift_start_by_user,
            'Shift End By': usershiftData[index].shift_end_by_user,
            'Opening Balance': Number(
              usershiftData[index].opening_balance,
            ).toFixed(ROUNDOFF_UPTO),
            'Closing Balance': Number(
              usershiftData[index].current_closing_balance,
            ).toFixed(ROUNDOFF_UPTO),
            'Total Expense': Number(usershiftData[index].total_expense).toFixed(
              ROUNDOFF_UPTO,
            ),
            'Total Sales': Number(usershiftData[index].total_sales).toFixed(
              ROUNDOFF_UPTO,
            ),
            'Invoice Range': usershiftData[index].invoice_range,
            'Start Shift comment': usershiftData[index].shift_start_comment,
            'End Shift comment': usershiftData[index].shift_end_comment,
          });

          totalopeningbalance += Number(usershiftData[index].opening_balance);
          totalclosingbalanace += Number(
            usershiftData[index].current_closing_balance,
          );
          totalExpense += Number(usershiftData[index].total_expense);
          totalSale += Number(usershiftData[index].total_sales);
        }

        const summaryData = {
          'Start Day': 'summary',
          'End Day': '',
          'Shift Start By': '',
          'Shift End By': '',
          'Opening Balance': Number(totalopeningbalance).toFixed(ROUNDOFF_UPTO),
          'Closing Balance':
            Number(totalclosingbalanace).toFixed(ROUNDOFF_UPTO),
          'Total Expense': Number(totalExpense).toFixed(ROUNDOFF_UPTO),
          'Total Sales': Number(totalSale).toFixed(ROUNDOFF_UPTO),
          'Invoice Range': '',
          'Start Shift comment': '',
          'End Shift comment': '',
        };

        datalist.push(summaryData);

        reportData.data = datalist;
      }
      break;
    case REPORT_TYPES.START_CLOSEDAY:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#dayendreportTableid').DataTable();
        const filterOptions = {};
        if ($('#dayendreportTableid_filter input').val()) {
          filterOptions.filter = 'applied';
        }
        const startendData = table.rows(filterOptions).data();
        if (startendData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        let totalopeningbalance = 0;
        let totalclosingbalanace = 0;
        let totalExpense = 0;
        let totalSale = 0;
        for (let index = 0; index < startendData.length; index++) {
          datalist.push({
            'Start Day': startendData[index].start_day_date,
            'End Day': startendData[index].day_close_date,
            'Day Start By': startendData[index].day_start_by_user,
            'Day End By': startendData[index].day_close_by_user,
            'Opening Balance': Number(
              startendData[index].opening_balance,
            ).toFixed(ROUNDOFF_UPTO),
            'Closing Balance': Number(
              startendData[index].current_closing_balance,
            ).toFixed(ROUNDOFF_UPTO),
            'Total Expense': Number(startendData[index].total_expense).toFixed(
              ROUNDOFF_UPTO,
            ),
            'Total Sales': Number(startendData[index].total_sales).toFixed(
              ROUNDOFF_UPTO,
            ),
            'Invoice Range': startendData[index].invoice_range,
            'Start Day comment': startendData[index].start_day_comment,
            'End Day comment': startendData[index].close_day_comment,
            'Entered amount': Number(
              startendData[index].close_day_amount,
            ).toFixed(ROUNDOFF_UPTO),
            'Cash diff': Number(startendData[index].cash_diff).toFixed(
              ROUNDOFF_UPTO,
            ),
          });
          totalopeningbalance += Number(usershiftData[index].opening_balance);
          totalclosingbalanace += Number(
            usershiftData[index].current_closing_balance,
          );
          totalExpense += Number(usershiftData[index].total_expense);
          totalSale += Number(usershiftData[index].total_sales);
        }
        const summarydata = {
          'Start Day': 'summary',
          'End Day': '',
          'Day Start By': '',
          'Day End By': '',
          'Opening Balance': Number(totalopeningbalance).toFixed(ROUNDOFF_UPTO),
          'Closing Balance':
            Number(totalclosingbalanace).toFixed(ROUNDOFF_UPTO),
          'Total Expense': Number(totalExpense).toFixed(ROUNDOFF_UPTO),
          'Total Sales': Number(totalSale).toFixed(ROUNDOFF_UPTO),
          'Invoice Range': '',
          'Start Day comment': '',
          'End Day comment': '',
          'Entered amount': '',
          'Cash diff': '',
        };
        datalist.push(summarydata);
        reportData.data = datalist;
      }
      break;
    case REPORT_TYPES.DUE_PAYMENT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#duepayreportTableid').DataTable();
        const filterOptions = {};
        if ($('#duepayreportTableid input').val()) {
          filterOptions.filter = 'applied';
        }
        const startendData = table.rows(filterOptions).data();
        if (startendData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        let totalorderedamount = 0;
        let totalreceivedamount = 0;
        let totaldueamount = 0;

        for (let index = 0; index < startendData.length; index++) {
          datalist.push({
            'Order ID': startendData[index].order_id,
            'Customer Mobile': startendData[index].cust_mobile,
            'Order Amt': Number(startendData[index].amount_to_pay).toFixed(
              ROUNDOFF_UPTO,
            ),
            'Received Amt': Number(startendData[index].received_amount).toFixed(
              ROUNDOFF_UPTO,
            ),
            'Due Amt': Number(startendData[index].due_amount).toFixed(
              ROUNDOFF_UPTO,
            ),
            Payment: startendData[index].payment_info,
            'Billed By': startendData[index].billing_user_id,
            Date: startendData[index].created,
          });
          totalorderedamount += Number(startendData[index].amount_to_pay);
          totalreceivedamount += Number(startendData[index].received_amount);
          totaldueamount += Number(startendData[index].due_amount);
        }
        const summaryData = {
          'Order ID': 'summary',
          'Customer Mobile': '',
          'Order Amt': Number(totalorderedamount).toFixed(ROUNDOFF_UPTO),
          'Received Amt': Number(totalreceivedamount).toFixed(ROUNDOFF_UPTO),
          'Due Amt': Number(totaldueamount).toFixed(ROUNDOFF_UPTO),
          Payment: '',
          'Billed By': '',
          Date: '',
        };
        datalist.push(summaryData);
        reportData.data = datalist;
      }
      break;
    case REPORT_TYPES.DUE_BY_CUSTOMER:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#customerduepayreportTableid').DataTable();
        const filterOptions = {};
        if ($('#customerduepayreportTableid input').val()) {
          filterOptions.filter = 'applied';
        }
        const startendData = table.rows(filterOptions).data();
        if (startendData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        const totalDueamount = 0;
        for (let index = 0; index < startendData.length; index++) {
          datalist.push({
            'Customer Name': startendData[index].cust_name,
            'Customer Mobile': startendData[index].cust_mobile,
            'Due Amt': Number(startendData[index].due_payment).toFixed(
              window.ROUNDOFF_UPTO,
            ),
          });
          totaldueamount += startendData[index].due_payment;
        }
        const summaryData = {
          'Customer Name': 'summary',
          'Customer Mobile': '',
          'Due Amt': Number(totalDueamount).toFixed(ROUNDOFF_UPTO),
        };
        datalist.push(summaryData);
        reportData.data = datalist;
      }
      break;
    case REPORT_TYPES.BILLPRINT_HISTORY:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#billprintreportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        let totalPrintCount = 0;
        for (let index = 0; index < rawData.length; index++) {
          datalist.push({
            'Order ID': rawData[index].order_id,
            'Bill NO': rawData[index].bill_number,
            'Print count': rawData[index].print_status,
          });
          totalPrintCount += rawData[index].print_status;
        }
        const summaryData = {
          'Order ID': '',
          'Bill NO': '',
          'Print count': totalPrintCount,
        };
        datalist.push(summaryData);
        reportData.data = datalist;
      }
      break;
    case REPORT_TYPES.APPLIED_CHARGES_HISTORY:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#appliedchargesreportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        let totalChargeamount = 0;
        let totalorderamount = 0;
        for (let index = 0; index < rawData.length; index++) {
          datalist.push({
            'Order ID': rawData[index].order_id,
            Charge: rawData[index].title,
            'Charge amount': Number(rawData[index].value).toFixed(
              ROUNDOFF_UPTO,
            ),
            'Order amount': Number(rawData[index].order_total).toFixed(
              ROUNDOFF_UPTO,
            ),
            status: rawData[index].status_flag === 0 ? 'Applied' : 'Deleted',
          });
          totalChargeamount += Number(rawData[index].value);
          totalorderamount += Number(rawData[index].order_total);
        }
        const summarydata = {
          'Order ID': 'summary',
          Charge: '',
          'Charge amount': Number(totalChargeamount).toFixed(ROUNDOFF_UPTO),
          'Order amount': Number(totalorderamount).toFixed(ROUNDOFF_UPTO),
          status: '',
        };
        datalist.push(summarydata);
        reportData.data = datalist;
      }
      break;
    case REPORT_TYPES.PRE_ORDER_REPORT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#preorderreportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < rawData.length; index++) {
          datalist.push({
            'Order ID': rawData[index].order_id,
            'Placed Date': moment(rawData[index].placed_at).format(
              'DD MMMM YYYY hh:mm A',
            ),
            'Delivery Date': moment(rawData[index].delivery_at).format(
              'DD MMMM YYYY hh:mm A',
            ),
            'Customer Name': rawData[index].customer_name,
            'Customer Mobile': rawData[index].customer_mobile,
            status: rawData[index].status,
          });
        }
        reportData.data = datalist;
      }
      break;
    case REPORT_TYPES.DUE_PAYMENT_HISTORY:
      {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:allReports.thisSectionIsNonReportSection'),
          0,
        );
        return;
      }
      break;

    case REPORT_TYPES.KOT_REPORT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#kotreportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < rawData.length; index++) {
          let item_name = rawData[index]['kotItems.item_name'];
          if (rawData && rawData.extra_details) {
            const extra_details = safeParse(rawData.extra_details);
            if (
              window.selectedLanguage == 'en' &&
              extra_details.baseTitle &&
              $('#groupByBaseItemCheckid').is(':checked')
            ) {
              item_name = extra_details.baseTitle;
            }
          }
          if (
            window.selectedLanguage !== 'en' &&
            rawData[index]['kotItems.alternative_title']
          ) {
            item_name = rawData[index]['kotItems.alternative_title'];
          }
          datalist.push({
            'Order ID': rawData[index].bill_number,
            'Table Name': rawData[index].table_name,
            'KOT No': rawData[index].kot_number,
            'Item Name': item_name,
            Qty: rawData[index]['kotItems.quantity'],
            Price: rawData[index]['kotItems.item_price'],
            Total: rawData[index]['kotItems.amount'],
            Status: KOT_ITEM_STATUS[rawData[index]['kotItems.status']],
            Username: rawData[index].createdBy,
            'KOT Placed Time': moment(rawData[index].in_time).format(
              'DD-MM-YYYY hh:mm A',
            ),
          });
        }
        reportData.data = datalist;
      }
      break;

    case REPORT_TYPES.RESERVATION_REPORT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#reservationReportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        for (let index = 0; index < rawData.length; index++) {
          datalist.push({
            'Table Name': rawData[index].table_name,
            'Order ID': rawData[index].order_id,
            'Customer Name': rawData[index].name,
            'Customer Phone': rawData[index].phone,
            'Check in': moment(rawData[index].check_in).format(
              'DD-MM-YYYY HH:MM A',
            ),
          });
        }
        reportData.data = datalist;
      }
      break;

    case REPORT_TYPES.DELIVERY_BOY_REPORT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#deliveryBoyreportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        let ordersCount = 0;
        let deliveryBoyAmount = 0;
        for (let index = 0; index < rawData.length; index++) {
          datalist.push({
            Name: rawData[index].delivery_boy_name,
            Orders: rawData[index].count,
            Total: rawData[index].order_total,
          });
          ordersCount += Number(rawData[index].count);
          deliveryBoyAmount += Number(rawData[index].order_total);
        }
        const summarydata = {
          Name: 'summary',
          Orders: Number(ordersCount).toFixed(ROUNDOFF_UPTO),
          Total: Number(deliveryBoyAmount).toFixed(ROUNDOFF_UPTO),
        };
        datalist.push(summarydata);
        reportData.data = datalist;
      }
      break;

    case REPORT_TYPES.USER_REPORT:
      {
        report_type = $('#reporttypeContainerid div.selectedReport')
          .find('div.card-body')
          .html();
        table = $('#userreportTableid').DataTable();
        const rawData = table.rows().data();
        if (rawData.length == 0) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:allReports.noData'),
            0,
          );
          return;
        }
        const datalist = [];
        let userOrdersCount = 0;
        let userOrdersAmount = 0;
        for (let index = 0; index < rawData.length; index++) {
          datalist.push({
            Name: rawData[index].createdBy,
            Orders: rawData[index].count,
            Total: rawData[index].amount,
          });
          userOrdersCount += Number(rawData[index].count);
          userOrdersAmount += Number(rawData[index].amount);
        }
        const summarydata = {
          Name: 'summary',
          Orders: Number(userOrdersCount).toFixed(ROUNDOFF_UPTO),
          Total: Number(userOrdersAmount).toFixed(ROUNDOFF_UPTO),
        };
        datalist.push(summarydata);
        reportData.data = datalist;
      }
      break;
    default:
      break;
  }

  if (reportData.data && reportData.data.length > 0) {
    try {
      report_type = String(report_type)
        .replace(/\s{2,}/g, ' ')
        .trim();
      let name = `${report_type}-${customDatetitle}`;
      if (String(name).length > 25) {
        name = String(name).substring(0, 25);
      }
      json2excel({
        data: reportData.data,
        name,
      });
    } catch (e) {
      console.log(e);
    }
  }
}

// export mall report to txt file
async function exportreporttoTxt() {
  table = $('#mallreportTableid').DataTable();

  const rawItems = table.rows().data();
  if (rawItems.length == 0) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:allReports.noData'),
      0,
    );
    return;
  }
  const mallReportId = await betteripcRenderer.callMain(
    UPDATE_MALL_REPORT_ID,
    {},
  );
  const file = new Blob([mallReportcsvdata], {
    type: 'text/plain',
    endings: 'native',
  });

  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(file);
  const dateAndTime = moment().format('YYMMDDHHmm');
  const posNumber = storeDetails.store_id.slice(0, 6);
  const { tenant_id } = storeDetails;
  const filename = `t${tenant_id}_${posNumber}_${mallReportId}_${dateAndTime}.txt`;
  anchor.download = filename;
  anchor.click();
}

async function showreportistooBig() {
  const result = await Swal.fire({
    title: $.i18n.t('controller:reportController.Warning'),
    text: $.i18n.t(
      'controller:allReports.reportIsTooBigDoYouReallyWantToPrint',
    ),
    confirmButtonText: $.i18n.t('controller:reportController.cancelPrint'),
    cancelButtonText: $.i18n.t('controller:reportController.Continue'),
    showCancelButton: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    customClass: {
      popup: 'tmbill-swal-pop-up',
    },
  });
  return result;
}
/**
 * Set's filters according to the current type
 * or report requested
 */
async function setFilters() {
  switch (Number(currentReporttype)) {
    case REPORT_TYPES.SALES_REPORT:
    case REPORT_TYPES.TODAYS_REPORT:
      $('#salesreportTableid').DataTable().clear().draw();
      $('#limitFieldid').hide();
      $('.byamountcheckDiv').hide();
      break;
    case REPORT_TYPES.PAYMENT:
      $('#paymentreportTableid').DataTable().clear().draw();
      $('#limitFieldid').hide();
      $('.byamountcheckDiv').hide();
      break;
    case REPORT_TYPES.TOP_ITEMS:
    case REPORT_TYPES.SOLD_ITEMS:
    case REPORT_TYPES.ADDON_ITEMS:
      $('#itemsreportTableid_wrapper').show();
      $('#limitFieldid').show();
      $('.byamountcheckDiv').show();
      $('#deaditemsreportTableid_wrapper').hide();
      $('#complementaryitemsreportTableid_wrapper').hide();
      $('#discounteditemsreportTableid_wrapper').hide();

      break;
    case REPORT_TYPES.COMPLEMENTARY_ITEMS:
    case REPORT_TYPES.CANCELLED_ITEMS:
    case REPORT_TYPES.DELETED_ITEMS:
      $('#complementaryitemsreportTableid_wrapper').show();
      $('#itemsreportTableid_wrapper').hide();
      $('#deaditemsreportTableid_wrapper').hide();
      $('#discounteditemsreportTableid_wrapper').hide();
      break;
    case REPORT_TYPES.DISCOUNTED_ITEMS:
      $('#complementaryitemsreportTableid_wrapper').hide();
      $('#itemsreportTableid_wrapper').hide();
      $('#deaditemsreportTableid_wrapper').hide();
      $('#discounteditemsreportTableid_wrapper').show();
      break;
    case REPORT_TYPES.DEAD_ITEMS:
      $('#complementaryitemsreportTableid_wrapper').hide();
      $('#itemsreportTableid_wrapper').hide();
      $('#deaditemsreportTableid_wrapper').show();
      $('#discounteditemsreportTableid_wrapper').hide();
      break;
    case REPORT_TYPES.DUE_PAYMENT:
      $(
        '#duepayhistoryreportTable-wrapper-id,#customerduepayreportTable-wrapper-id',
      ).hide();
      $('#duepayreportTable-wrapper-id').show();
      $('#limitFieldid').hide();
      $('.byamountcheckDiv').hide();

      break;
    case REPORT_TYPES.DUE_PAYMENT_HISTORY:
      $('#duepayhistoryreportTable-wrapper-id').show();
      $('#duepayreportTable-wrapper-id').hide();
      $('#customerduepayreportTable-wrapper-id').hide();
      $('#limitFieldid').hide();
      $('.byamountcheckDiv').hide();
      break;

    case REPORT_TYPES.CATEGORYWISE:
      $('#GroupByBaseItemCheckDiv').show();
      break;
    case REPORT_TYPES.DUE_BY_CUSTOMER:
      $('#customerduepayreportTable-wrapper-id').show();
      $('#duepayhistoryreportTable-wrapper-id').hide();
      $('#duepayreportTable-wrapper-id').hide();
      $('#limitFieldid').hide();
      $('.byamountcheckDiv').hide();
      break;
    case REPORT_TYPES.BILLPRINT_HISTORY:
      $('#billprintreportTable-wrapper-id').show();
      $('#appliedchargesreportTable-wrapper-id').hide();
      break;
    case REPORT_TYPES.APPLIED_CHARGES_HISTORY:
      $('#billprintreportTable-wrapper-id').hide();
      $('#appliedchargesreportTable-wrapper-id').show();
      break;
    case REPORT_TYPES.VAT_REPORT:
      $('#limitFieldid').hide();
      $('.byamountcheckDiv').hide();
      break;
    case REPORT_TYPES.ORDER_FROM:
      $('#limitFieldid').hide();
      $('.byamountcheckDiv').hide();
      break;
    case REPORT_TYPES.USER_REPORT:
      $('#limitFieldid').hide();
      $('.byamountcheckDiv').hide();
      break;
    case REPORT_TYPES.DELIVERY_BOY_REPORT:
      $('#limitFieldid').hide();
      $('.byamountcheckDiv').hide();
      break;
    case REPORT_TYPES.RESERVATION_REPORT:
      $('#limitFieldid').hide();
      $('.byamountcheckDiv').hide();
      break;
    case REPORT_TYPES.KOT_REPORT:
      $('#limitFieldid').hide();
      $('.byamountcheckDiv').hide();
      break;
    case REPORT_TYPES.MALL_REPORT:
      $('#limitFieldid').hide();
      $('.byamountcheckDiv').hide();
      break;
    case REPORT_TYPES.KDWISE:
      $('#limitFieldid').hide();
      $('.byamountcheckDiv').hide();
      break;
    case REPORT_TYPES.COUPON_HISTORY:
      $('#limitFieldid').hide();
      $('.byamountcheckDiv').hide();
      break;
    default:
      break;
  }
  initAccesslevelsforreports();
}
/**
 * Initialize table
 */
function initTables() {
  const language = {
    url: `../locales/${$.i18n.language}/datatable.json`,
  };
  $('#itemsreportTableid').DataTable({
    ordering: true,
    scrollY: '48vh',
    scrollX: true,
    bAutoWidth: false,
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    autoWidth: false,
    order: [],
    language,
    columns: [
      { title: $.i18n.t('tables:reportTableHeadings.itemName'), data: 'title' },
      { title: $.i18n.t('tables:reportTableHeadings.QTY'), data: 'qty' },
      {
        title: $.i18n.t('tables:reportTableHeadings.Price'),
        data: 'finalPrice',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Amount'),
        data: 'finalamount',
        defaultContent: '',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.totalwithtax'),
        data: 'total_with_tax',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.totalwithouttax'),
        data: 'total_withouttax',
      },
    ],
    columnDefs: [
      {
        targets: [4, 5],
        render: $.fn.dataTable.render.number(',', '.', ROUNDOFF_UPTO),
      },
    ],
    createdRow(row, data, index) {
      // if (data.finalPrice != undefined) {
      //   try {
      //     $('td', row)
      //       .eq(2)
      //       .html(data.finalPrice == 0 ? 'Complementary' : data.finalPrice);
      //   } catch (error) {}
      // }
      if (window.selectedLanguage !== 'en' && data.alternative_title) {
        $('td', row).eq(0).html(data.alternative_title);
      }
      if (data && data.extra_details) {
        const extra_details = safeParse(data.extra_details);
        if (extra_details && extra_details.total_without_tax) {
          const total_without_tax = extra_details.total_without_tax;
          $('td', row).eq(5).html(total_without_tax.toFixed(ROUNDOFF_UPTO));
          Object.assign(data, {
            total_withouttax: total_without_tax,
          });
        }

        if (
          !data.alternative_title &&
          window.selectedLanguage !== 'en' &&
          extra_details.alternative_title
        ) {
          $('td', row).eq(0).html(extra_details.alternative_title);
        } else if (
          extra_details.baseTitle &&
          $('#groupByBaseItemCheckid').is(':checked')
        ) {
          $('td', row).eq(0).html(extra_details.baseTitle);
        }
      }
    },
    footerCallback(row, data, start, end, display) {
      const api = this.api();

      // Remove the formatting to get integer data for summation
      const intVal = function (i) {
        return typeof i === 'string'
          ? i.replace(/[\$,]/g, '') * 1
          : typeof i === 'number'
            ? i
            : 0;
      };

      // Total over all pages
      total = api
        .column(1) // 3
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      // Total over this page
      pageTotal = api
        .column(4, { page: 'current' }) // 3
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);
      pageTotalqty = api
        .column(1, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);
      pageTotalprice = api
        .column(5, { page: 'current' }) // 2
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      pageTotalAmount = api
        .column(3, { page: 'current' }) // 2
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      $(api.column(3).footer()).html(
        `${window.currency} ${Number(pageTotalAmount).toFixed(ROUNDOFF_UPTO)}`,
      );

      $(api.column(4).footer()).html(
        `${window.currency} ${Number(pageTotal).toFixed(ROUNDOFF_UPTO)}`,
      );
      $(api.column(5).footer()).html(
        `${window.currency} ${Number(pageTotalprice).toFixed(ROUNDOFF_UPTO)}`,
      );
      $(api.column(1).footer()).html(
        `${Number(pageTotalqty).toFixed(ROUNDOFF_UPTO)}`,
      );
    },
  });

  $('#duepayreportTableid').DataTable({
    ordering: false,
    searching: true,
    scrollY: '50vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [],
    language,
    columns: [
      { title: $.i18n.t('tables:reportTableHeadings.Name'), data: 'cust_name' },
      {
        title: $.i18n.t('tables:reportTableHeadings.Phone'),
        data: 'cust_mobile',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.orderID'),
        data: 'order_id',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.dueAmount'),
        data: 'due_amount',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Status'),
        data: 'order_state',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.payInfo'),
        data: 'payment_info',
      },
      { title: '  ', data: 'billing_user_id' },
    ],
    createdRow(row, data, index) {
      if (data.due_amount != 0) {
        const paydueButton = $('<button>', {
          text: $.i18n.t('tables:reportTableHeadings.payDue'),
          class: 'material-button',
        }).on('click', () => {
          precheckIfamountavaiableinwallet(index, data);
        });

        $('td', row).last().empty().append(paydueButton);
        if (data.received_amount === 0) {
          const editButton = $('<i>', {
            class: 'fa fa-edit editDuePaymentReport',
          }).on('click', () => {
            editCustomerOfDuePayment(index, data);
          });

          $('td', row).last().append(editButton);
        }
      } else {
        const paidLabel = $('<label>', {
          html: 'Paid',
          class: 'statusLabel paid',
        });
        $('td', row).last().empty().append(paidLabel);
      }
    },
    footerCallback(row, data, start, end, display) {
      const api = this.api();

      // Remove the formatting to get integer data for summation
      const intVal = function (i) {
        return typeof i === 'string'
          ? i.replace(/[\$,]/g, '') * 1
          : typeof i === 'number'
            ? i
            : 0;
      };

      // Total over all pages
      const total = api
        .column(3, { filter: 'applied' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      // Total over this page
      const pageTotal = api
        .column(3, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);
      const totalSale = api
        .column(3)
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      // Update footer
      $(api.column(0).footer()).html(
        `${$.i18n.t('common:calculations.Total')} (${window.currency} ${Number(
          total,
        ).toFixed(ROUNDOFF_UPTO)})`,
      );
    },
  });

  $('#duepayhistoryreportTableid').DataTable({
    ordering: false,
    scrollY: '50vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [],
    language,
    columns: [
      { title: $.i18n.t('tables:reportTableHeadings.Name'), data: 'cust_name' },
      {
        title: $.i18n.t('tables:reportTableHeadings.Phone'),
        data: 'cust_mobile',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.orderID'),
        data: 'order_id',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.billedBy'),
        data: 'billing_user_id',
      },
      { title: '  ', data: 'billing_user_id' },
    ],
    createdRow(row, data, index) {
      const dueHistory = $('<label>', {
        class: 'statusLabel reduce-label2',
        html: 'View',
      })
        .attr('title', `View due transactions`)
        .on('click', () => {
          event.stopPropagation();
          viewDuepaytransactions(data);
        });
      $('td', row).last().empty().append(dueHistory);
    },
  });

  $('#customerduepayreportTableid').DataTable({
    ordering: false,
    scrollY: '50vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [],
    language,
    columns: [
      { title: $.i18n.t('tables:reportTableHeadings.Name'), data: 'cust_name' },
      {
        title: $.i18n.t('tables:reportTableHeadings.Phone'),
        data: 'cust_mobile',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.dueAmount'),
        data: 'due_payment',
      },
    ],
    createdRow(row, data, index) {},
  });

  $('#deaditemsreportTableid').DataTable({
    ordering: true,
    scrollY: '50vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [[1, 'asc']],
    language,
    columns: [
      { title: $.i18n.t('tables:reportTableHeadings.itemName'), data: 'title' },
      { title: $.i18n.t('tables:reportTableHeadings.Price'), data: 'price' },
    ],
    createdRow(row, data, index) {
      if (window.selectedLanguage !== 'en' && data.alternative_title) {
        $('td', row).eq(0).html(data.alternative_title);
      }
      if (data && data.extra_details) {
        const extra_details = safeParse(data.extra_details);
        if (
          window.selectedLanguage == 'en' &&
          extra_details.baseTitle &&
          $('#groupByBaseItemCheckid').is(':checked')
        ) {
          $('td', row).eq(0).html(extra_details.baseTitle);
        }
      }
    },
  });

  $('#discounteditemsreportTableid').DataTable({
    ordering: true,
    scrollY: '50vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [[1, 'asc']],
    language,
    columns: [
      { title: $.i18n.t('tables:reportTableHeadings.itemName'), data: 'title' },
      { title: $.i18n.t('tables:reportTableHeadings.Price'), data: 'price' },
      { title: $.i18n.t('tables:reportTableHeadings.QTY'), data: 'qty' },
      {
        title: $.i18n.t('tables:reportTableHeadings.Discount'),
        data: 'totalDiscount',
      },
    ],
    createdRow(row, data, index) {
      if (window.selectedLanguage !== 'en' && data.alternative_title) {
        $('td', row).eq(0).html(data.alternative_title);
      }
      if (data && data.extra_details) {
        const extra_details = safeParse(data.extra_details);
        if (
          window.selectedLanguage == 'en' &&
          extra_details.baseTitle &&
          $('#groupByBaseItemCheckid').is(':checked')
        ) {
          $('td', row).eq(0).html(extra_details.baseTitle);
        }
      }
    },
  });

  $('#complementaryitemsreportTableid').DataTable({
    ordering: true,
    scrollY: '47vh',
    scrollX: true,
    bAutoWidth: false,
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    autoWidth: false,
    language,
    order: [[1, 'asc']],
    columns: [
      { title: $.i18n.t('tables:reportTableHeadings.itemName'), data: 'title' },
      { title: $.i18n.t('tables:reportTableHeadings.Price'), data: 'price' },
      {
        title: $.i18n.t('tables:reportTableHeadings.Table'),
        data: 'table_name',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Type'),
        data: 'billing_type',
      },
      { title: $.i18n.t('tables:reportTableHeadings.QTY'), data: 'qty' },
      {
        title: $.i18n.t('tables:reportTableHeadings.Date'),
        data: 'created_time',
      },
      { title: 'Reason ', data: 'reason' },
      { title: 'User', data: 'createdBy' },
    ],
    createdRow(row, data, index) {
      if (data.created_time) {
        try {
          if (window.selectedLanguage !== 'en' && data.alternative_title) {
            $('td', row).eq(0).html(data.alternative_title);
          }
          // const d = new Date(parseInt(data.created_time));
          // const formattedDate = formatAMPM(d, false);
          const formattedDate = moment
            .utc(data.created_time)
            .local()
            .format('D MMM YYYY h:mm A');
          $('td', row).eq(5).html(formattedDate);

          // const billingType = BillingTypes[data.billing_type];
          const billingType =
            window.orderTypes[Number(data.billing_type)].order_type;
          data.newbillingType = billingType;
          $('td', row).eq(3).empty().append(billingType);
        } catch (error) {}
      }
      if (window.selectedLanguage !== 'en' && data.alternative_title) {
        $('td', row).eq(0).html(data.alternative_title);
      }
      if (data && data.extra_details) {
        const extra_details = safeParse(data.extra_details);
        if (
          window.selectedLanguage == 'en' &&
          extra_details.baseTitle &&
          $('#groupByBaseItemCheckid').is(':checked')
        ) {
          $('td', row).eq(0).html(extra_details.baseTitle);
        }
      }
    },
    footerCallback(row, data, start, end, display) {
      const api = this.api();

      // Remove the formatting to get integer data for summation
      const intVal = function (i) {
        return typeof i === 'string'
          ? i.replace(/[\$,]/g, '') * 1
          : typeof i === 'number'
            ? i
            : 0;
      };

      // Total over all pages
      total = api
        .column(1)
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      // Total over this page
      pageTotal = api
        .column(1, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);
      pageTotalqty = api
        .column(4, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      $(api.column(1).footer()).html(
        `${window.currency} ${Number(pageTotal).toFixed(window.ROUNDOFF_UPTO)}`,
      );
      $(api.column(3).footer()).html(
        `${pageTotalqty.toFixed(window.ROUNDOFF_UPTO)}`,
      );
    },
  });

  $('#salesreportTableid').DataTable({
    ordering: false,
    searching: true,
    scrollY: '48vh',
    scrollX: true,
    bAutoWidth: false,
    bPaginate: true,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    autoWidth: false,
    fixedColumns: true,
    order: [[1, 'asc']],
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.billNo'),
        data: 'bill_number',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Table'),
        data: 'table_name',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Date'),
        data: 'my_order_date',
      },
      { title: 'MITI Date', data: 'my_order_date' },
      {
        title: $.i18n.t('tables:reportTableHeadings.Amount'),
        data: 'order_total',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Discount'),
        data: 'discount',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.discountReason'),
        data: 'instructions',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Tax'),
        data: 'order_level_total_taxes',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Type'),
        data: 'billing_type',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Payment'),
        data: 'payment',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Status'),
        data: 'order_state',
      },
      {
        title: $.i18n.t('tables:masterTableHeadings.Username'),
        data: 'user_id',
      },
      {
        title: $.i18n.t('tables:masterTableHeadings.Username'),
        data: 'createdBy',
      },
      { title: 'Delivery boy', data: 'delivery_boy_name' },
    ],
    columnDefs: [
      {
        // "targets": [9, 10],
        targets: [10, 11, 13],
        visible: false,
      },
      {
        targets: [3],
        visible: storeDetails.country == 'Nepal',
      },
      {
        width: '60px',
        targets: 0,
      },
      {
        targets: [1],
        width: '20px',
      },
      {
        targets: [3, 4],
        width: '150px',
      },
      {
        targets: [2, 5, 6, 7, 8, 9, 10, 11, 12],
        width: '90px',
      },
    ],
    createdRow(row, billdata, index) {
      if (billdata.created_time) {
        try {
          const d = new Date(parseInt(billdata.created_time));
          const formattedDate = formatAMPM(d, false);
          $('td', row).eq(2).html(formattedDate);
        } catch (error) {}
      }

      if (billdata.instructions) {
        if (billdata.instructions.includes('Discount')) {
          let discountReason = String(billdata.instructions)
            .split('|')
            .filter((x) => x && x.includes(`Discount::`));
          if (discountReason) {
            discountReason = String(discountReason).replace('Discount::', '');
            //  $('td', row).eq(5).html(discountReason);
            storeDetails.country == 'Nepal'
              ? $('td', row).eq(6).html(discountReason)
              : $('td', row).eq(5).html(discountReason);
          }
        } else {
          $('td', row).eq(5).html('');
        }
      }
      try {
        const amount = Number(data.order_total).toFixed(ROUNDOFF_UPTO);
        data.order_total = Number(amount);
        $('td', row).eq(3).empty().append(data.order_total);
      } catch (error) {}

      // const billingType = BillingTypes[billdata.billing_type];
      const billingType =
        window.orderTypes[Number(billdata.billing_type)].order_type;
      billdata.billing_type = billingType;
      // $('td', row).eq(7).empty().append(billingType);
      storeDetails.country == 'Nepal'
        ? $('td', row).eq(8).empty().append(billingType)
        : $('td', row).eq(7).empty().append(billingType);

      // Add payment as due if due payment is there
      if (
        billdata.payment &&
        String(billdata.payment).toLowerCase() !== 'split' &&
        billdata.hasDuepayment &&
        billdata.due_payment &&
        Number(billdata.due_payment > 0)
      ) {
        $('td', row).eq(7).empty().append('Due Pay');
      }

      // For nepal customer set miti date
      if (window.storeDetails.country == 'Nepal') {
        const date = new NepaliDate(new Date(billdata.my_order_date)).format(
          'DD-MMMM-YYYY',
        );
        const time = moment(parseInt(billdata.created_time)).format('hh:mm A');
        const mitiDate = `${date} ${time}`;
        $('td', row).eq(3).html(mitiDate);
      }
    },
    footerCallback(row, data, start, end, display) {
      const api = this.api();

      // Remove the formatting to get integer data for summation
      const intVal = function (i) {
        return typeof i === 'string'
          ? i.replace(/[\$,]/g, '') * 1
          : typeof i === 'number'
            ? i
            : 0;
      };

      // Total over all pages
      const total = api
        .column(4, { filter: 'applied' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      // Total over this page
      const pageTotal = api
        .column(4, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);
      const totalSale = api
        .column(4)
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);
      const pageTotaldiscount = api
        .column(5, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);
      const pageTotaltax = api
        .column(7, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      // Update footer
      $(api.column(0).footer()).html(
        `${$.i18n.t('common:calculations.Total')} (${window.currency} ${Number(
          total,
        ).toFixed(ROUNDOFF_UPTO)})`,
      );
      $(api.column(2).footer()).html(
        `${$.i18n.t('common:calculations.Total')} (${window.currency} ${Number(
          totalSale,
        ).toFixed(ROUNDOFF_UPTO)})`,
      );
      $(
        api.column(window.storeDetails.country == 'Nepal' ? 3 : 2).footer(),
      ).html(`${window.currency} ${Number(pageTotal).toFixed(ROUNDOFF_UPTO)}`);
      $(api.column(4).footer()).html(
        `${window.currency} ${Number(pageTotaldiscount).toFixed(
          ROUNDOFF_UPTO,
        )}`,
      );
      $(api.column(6).footer()).html(
        `${window.currency} ${Number(pageTotaltax).toFixed(ROUNDOFF_UPTO)}`,
      );
    },
  });

  $('#salesreportTableid_filter').hide();

  $('#salesreportFilterinputid').keyup(function () {
    $('#salesreportTableid').DataTable().search($(this).val()).draw();
  });

  $('#paymentreportTableid').DataTable({
    ordering: false,
    scrollY: '58vh',
    bPaginate: true,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [[1, 'asc']],
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.paymentFrom'),
        data: 'payment_option',
      },
      { title: $.i18n.t('tables:reportTableHeadings.Amount'), data: 'amount' },
      { title: $.i18n.t('tables:reportTableHeadings.Count'), data: 'count' },
      {
        title: $.i18n.t('tables:reportTableHeadings.Status'),
        data: 'order_state',
      },
    ],
    createdRow(row, data, index) {
      if (data) {
        try {
          const amount = Number(data.amount).toFixed(ROUNDOFF_UPTO);
          // data.amount = Number(amount);
          $('td', row).eq(1).empty().append(data.amount);
        } catch (error) {}
      }
    },
    footerCallback(row, data, start, end, display) {
      const api = this.api();

      // Remove the formatting to get integer data for summation
      const intVal = function (i) {
        return typeof i === 'string'
          ? i.replace(/[\$,]/g, '') * 1
          : typeof i === 'number'
            ? i
            : 0;
      };

      // Total over all pages
      total = api
        .column(1)
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      // Total over this page
      pageTotal = api
        .column(1, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);
      pageTotaltransaction = api
        .column(2, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      $(api.column(1).footer()).html(
        `${window.currency} ${Number(pageTotal).toFixed(ROUNDOFF_UPTO)}`,
      );
      $(api.column(2).footer()).html(`${pageTotaltransaction}`);
    },
  });

  // vat report
  $('#vatreportTableid').DataTable({
    ordering: false,
    scrollY: '50vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [],
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.ProductGroup'),
        data: 'product_group_name',
      }, // $.i18n.t('tables:reportTableHeadings.orderFrom'),
      {
        title: $.i18n.t('tables:reportTableHeadings.Price'),
        data: 'totalAmount',
      },
      { title: $.i18n.t('tables:reportTableHeadings.Items'), data: 'orders' },
      {
        title: $.i18n.t('tables:reportTableHeadings.Taxperc'),
        data: 'taxPercentage',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.TaxVal'),
        data: 'totalTax',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.TotaltaxVal'),
        data: 'total',
      },
    ],
    footerCallback(row, data, start, end, display) {
      const api = this.api();

      // Remove the formatting to get integer data for summation
      const intVal = function (i) {
        return typeof i === 'string'
          ? i.replace(/[\$,]/g, '') * 1
          : typeof i === 'number'
            ? i
            : 0;
      };

      // Total over all pages
      total = api
        .column(1)
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      // Total over this page
      pricePageTotal = api
        .column(1, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      pageTotalOrders = api
        .column(2, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      pageTotalTax = api
        .column(4, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      pageTotalAmount = api
        .column(5, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      $(api.column(1).footer()).html(
        `${window.currency} ${Number(pricePageTotal).toFixed(ROUNDOFF_UPTO)}`,
      );

      $(api.column(2).footer()).html(
        `${pageTotalOrders.toFixed(ROUNDOFF_UPTO)}`,
      );

      $(api.column(4).footer()).html(
        `${window.currency} ${Number(pageTotalTax).toFixed(ROUNDOFF_UPTO)}`,
      );

      $(api.column(5).footer()).html(
        `${window.currency} ${Number(pageTotalAmount).toFixed(ROUNDOFF_UPTO)}`,
      );
    },
  });

  // mall report
  $('#mallreportTableid').DataTable({
    ordering: false,
    scrollY: '50vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [],
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.BillNumber'),
        data: 'bill_number',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.OrderTotal'),
        data: 'order_total',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Payment'),
        data: 'payment',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.OrderId'),
        data: 'order_id',
      },
    ],
  });

  // kot report
  $('#kotreportTableid').DataTable({
    ordering: false,
    scrollY: '50vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [],
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.orderid'),
        data: 'bill_number',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.tableName'),
        data: 'table_name',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.kotno'),
        data: 'kot_number',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.itemName'),
        data: ['kotItems.item_name'],
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Qty'),
        data: ['kotItems.quantity'],
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Price'),
        data: ['kotItems.item_price'],
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Total'),
        data: ['kotItems.amount'],
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Status'),
        data: ['kotItems.status'],
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Username'),
        data: ['kotItems.createdBy'],
      },
      { title: $.i18n.t('tables:reportTableHeadings.Waiter'), data: 'waiter' },
    ],
    createdRow(row, data, index) {
      try {
        $('td', row).eq(7).html(KOT_ITEM_STATUS[data['kotItems.status']]);
        if (
          window.selectedLanguage !== 'en' &&
          data['kotItems.alternative_title']
        ) {
          $('td', row).eq(3).html(data['kotItems.alternative_title']);
        }
        if (data && data.extra_details) {
          const extra_details = safeParse(data.extra_details);
          if (
            window.selectedLanguage == 'en' &&
            extra_details.baseTitle &&
            $('#groupByBaseItemCheckid').is(':checked')
          ) {
            $('td', row).eq(3).html(extra_details.baseTitle);
          }
        }
      } catch (error) {}
    },
  });

  // reservation report
  $('#reservationReportTableid').DataTable({
    ordering: false,
    scrollY: '50vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [],
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.tableName'),
        data: 'table_name',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.customerName'),
        data: 'name',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.orderId'),
        data: 'order_id',
      },
      { title: $.i18n.t('tables:reportTableHeadings.guests'), data: 'persons' },
      {
        title: $.i18n.t('tables:reportTableHeadings.checkIn'),
        data: 'check_in',
      },
    ],

    createdRow(row, data, index) {
      try {
        $('td', row)
          .eq(4)
          .html(moment(data.check_in).format('DD-MM-YYYY HH:mm A'));
      } catch (error) {}
    },
  });

  $('#orderreportTableid').DataTable({
    data: [],
    ordering: false,
    scrollY: '58vh',
    bPaginate: true,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [[1, 'asc']],
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.orderFrom'),
        data: 'billing_type',
      },
      { title: $.i18n.t('tables:reportTableHeadings.Amount'), data: 'amount' },
      { title: $.i18n.t('tables:reportTableHeadings.Count'), data: 'count' },
      {
        title: $.i18n.t('tables:reportTableHeadings.Status'),
        data: 'order_state',
      },
    ],
    createdRow(row, data, index) {
      if (data) {
        // const billingType = BillingTypes[data.billing_type];
        const billingType =
          window.orderTypes[Number(data.billing_type)].order_type;
        data.billing_type = billingType;
        const color = getRandomColor();
        if (billingType) {
          const billTypelabel = $('<label>', {
            html: billingType,
            class: `statusLabel ${billingType.replace(/[0-9\s&]/g, '').toLowerCase()}`,
          }).css({
            'background-color': `${color}26`,
            color,
          });
          $('td', row).eq(0).empty().append(billTypelabel);
        }
        try {
          const amount = Number(data.amount).toFixed(ROUNDOFF_UPTO);
          // data.amount = Number(amount);
          $('td', row).eq(1).empty().append(data.amount);
        } catch (error) {}
      }
    },
    footerCallback(row, data, start, end, display) {
      const api = this.api();

      // Remove the formatting to get integer data for summation
      const intVal = function (i) {
        return typeof i === 'string'
          ? i.replace(/[\$,]/g, '') * 1
          : typeof i === 'number'
            ? i
            : 0;
      };

      // Total over all pages
      total = api
        .column(1)
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      // Total over this page
      pageTotal = api
        .column(1, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);
      pageTotaltransaction = api
        .column(2, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      $(api.column(1).footer()).html(
        `${window.currency} ${Number(pageTotal).toFixed(ROUNDOFF_UPTO)}`,
      );
      $(api.column(2).footer()).html(`${pageTotaltransaction}`);
    },
  });
  $('#catwisereportTableid').DataTable({
    ordering: false,
    scrollY: '57vh',
    bPaginate: true,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [[1, 'asc']],
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.Category'),
        data: 'category_name',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.soldItems'),
        data: 'count',
      },
      { title: $.i18n.t('tables:reportTableHeadings.Amount'), data: 'total' },
    ],
    createdRow(row, data, index) {
      try {
        if (window.selectedLanguage !== 'en' && data.alternative_title) {
          $('td', row).eq(0).html(data.alternative_title);
        }
        if (data && data.extra_details) {
          const extra_details = safeParse(data.extra_details);
          if (
            window.selectedLanguage == 'en' &&
            extra_details.baseTitle &&
            $('#groupByBaseItemCheckid').is(':checked')
          ) {
            $('td', row).eq(0).html(extra_details.baseTitle);
          }
        }
        const amount = data.total.toFixed(ROUNDOFF_UPTO);
        data.total = amount;
        $('td', row).eq(2).empty().append(data.total);
      } catch (error) {}
    },
    footerCallback(row, data, start, end, display) {
      const api = this.api();

      // Remove the formatting to get integer data for summation
      const intVal = function (i) {
        return typeof i === 'string'
          ? i.replace(/[\$,]/g, '') * 1
          : typeof i === 'number'
            ? i
            : 0;
      };

      // Total over all pages
      total = api
        .column(2)
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      // Total over this page
      solditemcount = api
        .column(1, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);
      pageTotal = api
        .column(2, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      $(api.column(2).footer()).html(
        `${window.currency} ${Number(pageTotal).toFixed(window.ROUNDOFF_UPTO)}`,
      );
      $(api.column(1).footer()).html(
        `${solditemcount.toFixed(window.ROUNDOFF_UPTO)}`,
      );
    },
  });

  $('#kitchendepreportTableid').DataTable({
    ordering: false,
    scrollY: '60vh',
    bPaginate: true,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [[1, 'asc']],
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.Department'),
        data: 'kitchen_dept_name',
      },
      { title: $.i18n.t('tables:reportTableHeadings.Count'), data: 'count' },
      { title: $.i18n.t('tables:reportTableHeadings.Amount'), data: 'total' },
    ],
    createdRow(row, data, index) {
      try {
        const amount = Number(data.total).toFixed(ROUNDOFF_UPTO);
        data.total = amount;
        $('td', row).eq(2).empty().append(data.total);
      } catch (error) {}
    },
    footerCallback(row, data, start, end, display) {
      const api = this.api();

      // Remove the formatting to get integer data for summation
      const intVal = function (i) {
        return typeof i === 'string'
          ? i.replace(/[\$,]/g, '') * 1
          : typeof i === 'number'
            ? i
            : 0;
      };

      // Total over all pages
      total = api
        .column(2)
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      // Total over this page
      solditemcount = api
        .column(1, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);
      pageTotal = api
        .column(2, { page: 'current' })
        .data()
        .reduce((a, b) => intVal(a) + intVal(b), 0);

      $(api.column(2).footer()).html(
        `${window.currency} ${Number(pageTotal).toFixed(ROUNDOFF_UPTO)}`,
      );
      $(api.column(1).footer()).html(`${solditemcount}`);
    },
  });
  $('#couponreportTableid').DataTable({
    ordering: false,
    scrollY: '55vh',
    bPaginate: true,
    bLengthChange: false,
    bFilter: true,
    bInfo: false,
    paging: true,
    order: [[1, 'asc']],
    searching: false,
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.Coupon'),
        data: 'coupon_code',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Amount'),
        data: 'coupon_code_amt',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.customerName'),
        data: 'customer_name',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.customerPhone'),
        data: 'customer_phone',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.orderID'),
        data: 'order_id',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.viewOrder'),
        data: 'order_id',
      },
    ],
    createdRow(row, data, index) {
      const viewIcon = $('<i>', {
        class: 'fa fa-eye',
      });
      $('td', row)
        .last()
        .empty()
        .click(() => {
          getOrderdetails(data.order_id);
        })
        .append(viewIcon);
    },
  });

  const dayEndTable = $('#dayendreportTableid').DataTable({
    scrollY: '55vh',
    searching: false,
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
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.startDate'),
        data: 'start_day_date',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.endDate'),
        data: 'day_close_date',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.startedBy'),
        data: 'day_start_by_user',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.closedBy'),
        data: 'day_close_by_user',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.openingBal'),
        data: 'opening_balance',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.closingBal'),
        data: 'current_closing_balance',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.invoiceRange'),
        data: 'invoice_range',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.totalExprenses'),
        data: 'total_expense',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.totalDue'),
        data: 'total_expense',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.totalSales'),
        data: 'total_sales',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.enteredAmount'),
        data: 'close_day_amount',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.cashDiff'),
        data: 'cash_diff',
      },
      { title: $.i18n.t('tables:reportTableHeadings.Action'), data: 'id' },
    ],
    columnDefs: [
      {
        targets: [0, 1],
        width: '150px',
      },
      {
        targets: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        width: '90px',
      },
    ],
    createdRow(row, data, index) {
      let isDayClosedAtMidnight = false;
      if (data.start_day_date) {
        try {
          var d = new Date(parseInt(data.start_day_date));
          var formattedDate = formatAMPM(d, false);
          data.startDate = data.start_day_date;
          data.start_day_date = formattedDate;

          $('td', row).eq(0).html(formattedDate);
        } catch (error) {}
      }
      if (data.day_close_date) {
        try {
          var d = new Date(parseInt(data.day_close_date));
          var formattedDate = formatAMPM(d, false);
          data.endDate = data.day_close_date;
          data.day_close_date = formattedDate;
          $('td', row).eq(1).html(formattedDate);
        } catch (error) {}
      }

      if (data.extra_details) {
        const parsedextra_details = safeParse(data.extra_details);
        Object.assign(data, {
          parsedextra_details,
        });
        if (parsedextra_details && parsedextra_details.day_end_data) {
          const { due_amount } = parsedextra_details.day_end_data;
          if (due_amount) {
            $('td', row).eq(8).html(due_amount);
          } else {
            $('td', row).eq(8).html('-');
          }
        }
        if (parsedextra_details.isDayClosedAtMidnight) {
          isDayClosedAtMidnight = parsedextra_details.isDayClosedAtMidnight;
        }
      }

      const viewIcon = $('<i>', {
        class: 'fa fa-print',
        title: 'Get Report',
      });
      $('td', row)
        .last()
        .empty()
        .click(() => {
          // getreportData(
          //   {
          //     fromDate: data.startDate,
          //     toDate: data.endDate,
          //     store_id: data.store_id,
          //     rowIndex: index,
          //     countMidnightSale,
          //     isDayClosedAtMidnight,
          //     showWaiterData,
          //     showDeliveryBoyData,
          //     showDiscountData,
          //     showWalletData,
          //     showSolditems,
          //     showCancelitems,
          //     showExpenseData,
          //   },
          //   REPORT_MESSAGES.GET_STARTENDREPORT_DATA,
          // );

          const params = {
            fromDate: data.startDate,
            toDate: data.endDate,
            store_id: data.store_id,
            rowIndex: index,
            countMidnightSale,
            isDayClosedAtMidnight,
            showCategoryData,
            showSolditems,
            showCancelitems,
            showExpenseData,
            showWaiterData,
            showDeliveryBoyData,
            showDuePaymentData,
            showDuePaymentReceivableData,
            showDiscountData,
            showWalletData,
            showKDWiseItemsData,
            invoice_range: data.invoice_range,
            day_close_transactions: data.day_close_transactions,
          };
          ipcRenderer.send(
            REPORT_MESSAGES.GET_STARTENDREPORT_DATA,
            JSON.stringify(params),
          );
        })
        .append(viewIcon);
    },
  });
  // =====================================================
  // =====================================================
  // Sync header width with body width – Day End Report
  // =====================================================
  dayEndTable.on('draw.dt column-sizing.dt', function () {
    const $wrapper = $('#dayendreportTableid_wrapper');

    const $bodyTable = $wrapper.find('.dataTables_scrollBody table');
    const $headTable = $wrapper.find('.dataTables_scrollHead table');

    const bodyWidth = $bodyTable.outerWidth();

    // 🔥 force header to match body width
    $headTable.css({
      width: bodyWidth + 'px',
      minWidth: bodyWidth + 'px',
    });
  });

  $('#usershiftreportTableid').DataTable({
    scrollY: '55vh',
    searching: false,
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
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.startDate'),
        data: 'shift_start_date',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.endDate'),
        data: 'shift_end_date',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.startedBy'),
        data: 'shift_start_by_user',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.closedBy'),
        data: 'shift_end_by_user',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.openingBal'),
        data: 'opening_balance',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.closingBal'),
        data: 'current_closing_balance',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.invoiceRange'),
        data: 'invoice_range',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.totalExprenses'),
        data: 'total_expense',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.totalSales'),
        data: 'total_sales',
      },
      { title: $.i18n.t('tables:reportTableHeadings.Action'), data: 'id' },
    ],
    columnDefs: [
      {
        targets: [0, 1],
        width: '150px',
      },
      {
        targets: [2, 3, 4, 5, 6, 7, 8, 9],
        width: '90px',
      },
    ],
    createdRow(row, data, index) {
      let isDayClosedAtMidnight = false;
      if (data.shift_start_date) {
        try {
          var d = new Date(parseInt(data.shift_start_date));
          var formattedDate = formatAMPM(d, false);
          $('td', row).eq(0).html(formattedDate);
          data.startDate = data.shift_start_date;
          data.shift_start_date = formattedDate;
        } catch (error) {}
      }
      if (data.shift_end_date) {
        try {
          var d = new Date(parseInt(data.shift_end_date));
          var formattedDate = formatAMPM(d, false);
          data.endDate = data.shift_end_date;
          data.shift_end_date = formattedDate;
          $('td', row).eq(1).html(formattedDate);
        } catch (error) {}
      }
      if (data.extra_details) {
        const parsedextra_details = safeParse(data.extra_details);
        Object.assign(data, {
          parsedextra_details,
        });
        if (parsedextra_details.isDayClosedAtMidnight) {
          isDayClosedAtMidnight = parsedextra_details.isDayClosedAtMidnight;
        }
      }
      const viewIcon = $('<i>', {
        class: 'fa fa-print',
        title: 'Get Report',
      });
      $('td', row)
        .last()
        .empty()
        .click(() => {
          // getreportData(
          //   {
          //     fromDate: data.startDate,
          //     toDate: data.endDate,
          //     store_id: data.store_id,
          //     rowIndex: index,
          //     countMidnightSale,
          //     isDayClosedAtMidnight,
          //     shift_start_by_user: data.shift_start_by_user,
          //   },
          //   REPORT_MESSAGES.GET_USERSHIFT_DATA,
          // );

          const params = {};
          const reply = {
            fromDate: data.startDate,
            toDate: data.endDate,
            store_id: data.store_id,
            rowIndex: index,
            countMidnightSale,
            isDayClosedAtMidnight,
            shift_start_by_user: data.shift_start_by_user,
            showCategoryData,
            showSolditems,
            showCancelitems,
            showExpenseData,
            showWaiterData,
            showDeliveryBoyData,
            showDuePaymentData,
            showDuePaymentReceivableData,
            showDiscountData,
            showWalletData,
            showKDWiseItemsData,
            invoice_range: data.invoice_range,
            shift_end_by_user: data.shift_end_by_user,
          };
          params.reply = reply;
          ipcRenderer.send(
            REPORT_MESSAGES.GET_USERSHIFT_DATA,
            JSON.stringify(params),
          );
        })
        .append(viewIcon);
    },
  });

  $('#billprintreportTableid').DataTable({
    ordering: false,
    scrollY: '50vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [],
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.orderID'),
        data: 'order_id',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.orderType'),
        data: 'table_name',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Date'),
        data: 'my_order_date',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Amount'),
        data: 'order_total',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Status'),
        data: 'order_state',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.printCount'),
        data: 'print_status',
      },
    ],
    createdRow(row, billdata, index) {
      if (billdata.created_time) {
        try {
          const d = new Date(parseInt(billdata.created_time));
          const formattedDate = formatAMPM(d, false);
          $('td', row).eq(2).html(formattedDate);
        } catch (error) {}
      }

      // if (billdata.draftprint_status) {
      //     try {
      //         $('td', row).eq(5).html(billdata.print_status + billdata.draftprint_status);
      //     } catch (error) {

      //     }
      // }

      // const billingType = BillingTypes[billdata.billing_type];
      const billingType =
        window.orderTypes[Number(billdata.billing_type)].order_type;
      billdata.billing_type = billingType;
      $('td', row).eq(1).empty().append(billingType);
      const clipboard = $('<i>', {
        class: `fas fa - copy clipboard`,
        css: { paddingLeft: '5px' },
        order_id: billdata.order_id,
        title: 'Copy Order ID',
        'data-clipboard-text': billdata.order_id,
      });
      $('td', row).eq(0).append(clipboard);
    },
  });

  $('#appliedchargesreportTableid').DataTable({
    ordering: false,
    scrollY: '50vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [],
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.orderID'),
        data: 'order_id',
      },
      { title: $.i18n.t('tables:reportTableHeadings.Name'), data: 'title' },
      { title: $.i18n.t('tables:reportTableHeadings.Amount'), data: 'value' },
      {
        title: $.i18n.t('tables:reportTableHeadings.orderAmount'),
        data: 'order_total',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Status'),
        data: 'status_flag',
      },
    ],
    createdRow(row, data, index) {
      // status_flag:  //0 active 1 Deleted
      const status_flag = data.status_flag === 0 ? 'Applied' : 'Deleted';
      const label = $('<label>', {
        html: status_flag,
        class: `statusLabel ${String(status_flag).toLowerCase()}`,
      });
      $('td', row).eq(4).empty().append(label);

      const clipboard = $('<i>', {
        class: `fas fa - copy clipboard`,
        css: { paddingLeft: '5px' },
        order_id: data.order_id,
        title: 'Copy Order ID',
        'data-clipboard-text': data.order_id,
      });
      $('td', row).eq(0).append(clipboard);
    },
  });

  $('#preorderreportTableid').DataTable({
    data: [],
    searching: false,
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
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.orderID'),
        data: 'order_id',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.PlacedOn'),
        data: 'status',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.customerName'),
        data: 'customer_name',
      },
      { title: $.i18n.t('tables:reportTableHeadings.Status'), data: 'status' },
      {
        title: $.i18n.t('tables:reportTableHeadings.Delivery'),
        data: 'status',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.PaymentIns'),
        data: 'payment_instruction',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Media'),
        data: 'status',
      },
      {
        title: '',
        data: 'status',
      },
    ],
    columnDefs: [
      {
        targets: [0, 3, 7],
        width: '90px',
      },
      {
        targets: [1, 2, 4],
        width: '150px',
      },
      // {
      //   targets: [7],
      //   visible: false,
      // },
    ],
    createdRow(row, data, index) {
      if (data) {
        $('td', row)
          .eq(2)
          .empty()
          .append(`${data.customer_name} - ${data.customer_mobile}`);

        const billingType = data.status;
        const billTypelabel = $('<label>', {
          html: billingType,
          class: `statusLabel ${billingType.replace(/ /g, '').toLowerCase()}`,
        });
        $('td', row).eq(3).empty().append(billTypelabel);

        const placed_at = moment(data.placed_at).format('DD MMMM YYYY hh:mm A');
        $('td', row).eq(1).empty().append(placed_at);

        const delivery = moment(data.delivery_at).format(
          'DD MMMM YYYY hh:mm A',
        );
        $('td', row).eq(4).empty().append(delivery);

        if (data.media) {
          const viewButton = $('<button>', {
            text: 'View',
            class: 'material-button',
          }).on('click', () => {
            openFile(data.media);
          });
          $('td', row).eq(6).empty().append(viewButton);
        } else {
          $('td', row).eq(6).empty().append('');
        }

        const viewOrderButton = $('<button>', {
          text: 'View',
          class: 'material-button',
        }).on('click', () => {
          showItems(data);
        });
        $('td', row).eq(7).empty().append(viewOrderButton);

        if (data.order_id) {
          const clipboard = $('<i>', {
            class: `fas fa-copy clipboard`,
            css: { paddingLeft: '5px' },
            order_id: data.order_id,
            title: 'Copy Order ID',
            'data-clipboard-text': data.order_id,
          });
          $('td', row).eq(0).append(clipboard);
        }
      }
    },
  });

  $('#deliveryBoyreportTableid').DataTable({
    data: [],
    searching: false,
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
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.Name'),
        data: 'delivery_boy_name',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Orders'),
        data: 'count',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Total'),
        data: 'order_total',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Status'),
        data: 'order_state',
      },
    ],
    columnDefs: [],
    createdRow(row, data, index) {},
  });

  $('#userreportTableid').DataTable({
    data: [],
    searching: false,
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
    language,
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.Name'),
        data: 'createdBy',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Orders'),
        data: 'count',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Total'),
        data: 'amount',
      },
    ],
    columnDefs: [],
    createdRow(row, data, index) {},
  });

  const clipboard = new ClipboardJS('.clipboard');

  clipboard.on('success', (e) => {
    window.notifyUser.showMessage(
      'success',
      $.i18n.t('controller:allreportsnotifications.Orderidcopied'),
    );
  });

  clipboard.on('error', (e) => {});
}

/**
 * SHow current due payments
 * @param {Current order data} data
 */
async function viewDuepaytransactions(data) {
  if (data && data.order_id) {
    const dueData = await betteripcRenderer.callMain(
      ORDER_IPC.GET_DUETRANS_DETAILS,
      {
        order_id: data.order_id,
        store_id: data.store_id,
      },
    );
    const { transactions } = dueData;
    if (
      transactions &&
      Array.isArray(transactions) &&
      transactions.length > 0
    ) {
      $('#orderduepaytransModal').modal('toggle');
      $('#orderduepaytransactionstableID').DataTable().clear().draw();
      $('#orderduepaytransactionstableID').DataTable().rows.add(transactions);
      $('#orderduepaytransactionstableID').DataTable().columns.adjust().draw();
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:allreportsnotifications.Historynotfound'),
        0,
      );
    }
  }
}

async function precheckIfamountavaiableinwallet(rowindex, params) {
  const newData = safeParse(JSON.stringify(params));

  const { payments } = await initGetPaymentAsync();
  const paymentsList = payments;
  const options = { Wallet: 'wallet' };
  if (paymentsList && Array.isArray(paymentsList) && paymentsList.length > 0) {
    paymentsList.forEach((element) => {
      options[element.payment_mode_name] = element.payment_mode_name;
    });
  }

  const html = $('#duepay-hidden-container-id').html();
  const result = await Swal.fire({
    title: $.i18n.t('controller:swalDataTranslations.Paydue'),
    html,
    width: '23em',
    focusConfirm: false,
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
    didOpen: () => {
      $('.swal2-html-container #duepay-orderamountInputid').val(
        Number(params.amount_to_pay).toFixed(window.ROUNDOFF_UPTO),
      );
      $('.swal2-html-container  #duepay-receivedamountInputid').val(
        params.received_amount.toFixed(window.ROUNDOFF_UPTO),
      );
      // $('.swal2-html-container  #duepay-remainingamountInputid').val(params.due_amount);
      $('.swal2-html-container  #duepay-amounttopayInputid').val(
        Number(params.due_amount).toFixed(window.ROUNDOFF_UPTO),
      );
      // swal-duepay-paymentoptionsid
      $(
        '.swal2-html-container  #swal-duepay-paymentoptionsid option:gt(0)',
      ).remove();
      for (const [key, value] of Object.entries(options)) {
        $('<option>')
          .val(value)
          .text(key)
          .appendTo('.swal2-html-container  #swal-duepay-paymentoptionsid');
      }
    },
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCancelButton: true,
    async preConfirm() {
      const value = $(
        '.swal2-html-container  #duepay-amounttopayInputid',
      ).val();
      if (!value || isNaN(value)) {
        showSwalwarning('Please provide valid amount.');
        return false;
      }
      if (value < 0) {
        showSwalwarning('Amount should not be in negative number');
        return false;
      }
      const selectedpaymodeValue = $(
        '.swal2-html-container  #swal-duepay-paymentoptionsid',
      ).val();
      if (!selectedpaymodeValue) {
        showSwalwarning('Please select payment mode.');
        return false;
      }
      const requestData = {
        due_amount: Number(Number(value).toFixed(window.ROUNDOFF_UPTO)),
        cust_phone: params.cust_mobile,
      };
      const response = { selectedpaymodeValue };
      if (String(selectedpaymodeValue).toLowerCase() === 'wallet') {
        // const data = await betteripcRenderer.callMain(
        //   WALLET_IPC.CHECKIF_AMOUNT_AVAILABLE,
        //   requestData,
        // );
        const data = await makeCheckIfAmountIsAvailableRequest(requestData);
        if (data.amountAvailable) {
          Object.assign(response, { data, walletSelected: true });
          return response;
        }
        showSwalwarning($.i18n.t('controller:allReports.walletBalanceIsLow'));
        return;
      }
      return response;
    },
  });
  if (result && result.value) {
    let amountTopay = Number(
      $('.swal2-html-container  #duepay-amounttopayInputid').val(),
    );
    if (params.due_amount >= amountTopay) {
      if (amountTopay > params.due_amount) {
        amountTopay = params.due_amount;
      }
      params.received_amount = amountTopay;
      newData.received_amount += amountTopay;
      params.due_amount -= amountTopay;
      params.due_amount = Number(
        Number(params.due_amount).toFixed(ROUNDOFF_UPTO),
      );
      params.amount_to_pay = params.due_amount + amountTopay;
      newData.due_amount = Number(params.due_amount).toFixed(
        window.ROUNDOFF_UPTO,
      );

      const paymentOption = result.value.selectedpaymodeValue;
      const payaddResult = addWalletinpaymentoption(
        params,
        amountTopay,
        paymentOption,
      );
      params.payment_info = `${paymentOption} - ${amountTopay}`;
      params.payment_mode = paymentOption;
      params.customer_name = params.cust_name;

      const paymentList = payaddResult.payments;

      if (params.payments) delete params.payments;

      const updateData = {
        dueUpdate: params,
        amountTopay,
        paymentList,
        walletSelected: result.value.walletSelected,
      };

      // const data = await betteripcRenderer.callMain(
      //   WALLET_IPC.UPDATE_DUEAND_ADDTRANS,
      //   updateData,
      // );
      const data = await makeupdateDueAndAddTransactionRequest(updateData);
      if (data.status == 200) {
        window.notifyUser.showMessage('success', data.message, 0);
        newData.payment_info = payaddResult.payment_info;
        newData.payments = paymentList;
        // params.payment_info = payaddResult.payment_info;
        $('#duepayreportTableid')
          .DataTable()
          .row(rowindex)
          .data(newData)
          .draw();
        redrawDuepayments();
      } else if (data.message) {
        window.notifyUser.showMessage('error', data.message, 0);
      }

      window.refreshDashboard = true;
      window.refreshReceipt = true;
      window.refreshOrderSettlementWindow = true;
    }
  }
}

async function editCustomerOfDuePayment(rowindex, params) {
  const result = await Swal.fire({
    title: $.i18n.t(
      'controller:orderController.editOrAddCustomer.updateCustomerTitle',
    ),
    html: `<input type='text' autocomplete='' class='w-100 wallet_customerPhone' id='swal_customerPhoneid' value=${params.cust_mobile}
            placeholder='${$.i18n.t(
              'controller:orderController.editOrAddCustomer.customerMobile',
            )}'>
            <input type='text' name='' class='w-100 wallet_customerName'  id='swal_customernameid' placeholder='${$.i18n.t(
              'controller:orderController.editOrAddCustomer.customerName',
            )}' value=${params.cust_name}>`,
    width: '23em',
    focusConfirm: false,
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
    didOpen: () => {
      const customers = window.customersList;
      if (customers && Array.isArray(customers)) {
        $('#swal2-html-container input#swal_customernameid').autocomplete({
          source(req, sresponse) {
            const sourceData = [];
            const re = $.ui.autocomplete.escapeRegex(req.term);
            sresponse(
              $.grep(customers, (customer) => {
                if (
                  customer.name &&
                  customer.name.toLowerCase().startsWith(re.toLowerCase())
                ) {
                  let address = customer.address_line1
                    ? customer.address_line1
                    : '';
                  if (customer.address_line2) {
                    address =
                      address + customer.address_line2
                        ? customer.address_line2
                        : '';
                  }
                  sourceData.push({
                    label: customer.name,
                    value: customer.name,
                    phone: customer.phone,
                    id: customer.id,
                    address,
                    customer,
                  });
                }
              }),
            );
            return sresponse(sourceData);
          },
          appendTo: '#swal2-html-container',
          classes: {
            'ui-autocomplete': 'autocomplete-to-front',
          },
          select(_event, ui) {
            $('.swal2-html-container #swal_customerPhoneid').val(ui.item.phone);
            $('.swal2-html-container #swal_customeraddressid').val(
              ui.item.address,
            );
          },
        });
        $('#swal2-html-container input#swal_customerPhoneid').autocomplete({
          source(req, sresponse) {
            const sourceData = [];
            // var re = $.ui.autocomplete.escapeRegex(req.term);
            const re = $.ui.autocomplete.escapeRegex(req.term);
            if (re.length > 3) {
              sresponse(
                $.grep(customers, (customer) => {
                  if (
                    customer.phone &&
                    customer.phone.toLowerCase().startsWith(re.toLowerCase())
                  ) {
                    let address = customer.address_line1
                      ? customer.address_line1
                      : '';
                    if (customer.address_line2) {
                      address =
                        address + customer.address_line2
                          ? customer.address_line2
                          : '';
                    }

                    sourceData.push({
                      label: customer.phone,
                      value: customer.phone,
                      name: customer.name,
                      id: customer.id,
                      address,
                      customer,
                    });
                  }
                }),
              );
            }
            return sresponse(sourceData);
          },
          appendTo: '#swal2-html-container',
          classes: {
            'ui-autocomplete': 'autocomplete-to-front',
          },
          select(_event, ui) {
            $('.swal2-html-container #swal_customernameid').val(ui.item.name);
            $('.swal2-html-container #swal_customeraddressid').val(
              ui.item.address,
            );
          },
        });
        $('.swal2-actions').css('z-index', 0);
        $('.swal2-content').css('height', '115px !important');
      }
    },
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCancelButton: true,
    async preConfirm() {
      Swal.showLoading();
      Swal.getCancelButton().style.display = 'none';

      const phone = $('.swal2-html-container #swal_customerPhoneid').val();
      const name = $('.swal2-html-container #swal_customernameid').val();

      if (isNaN(phone)) {
        window.showSwalwarning(
          $.i18n.t('controller:orderController.invalidPrice'),
        );
        return false;
      }
      if (!phone || !phone.trim()) {
        window.showSwalwarning('Mobile number is required');
        return false;
      }

      if (!name || !name.trim()) {
        window.showSwalwarning('Customer name is required');
        return false;
      }

      const customer = {
        name,
        phone,
        store_id: window.storeDetails.store_id,
        order_id: params.order_id,
      };

      Object.assign(params, {
        cust_name: name,
        cust_mobile: phone,
      });

      const result = await makeUpdateCustomerToDuePaymentRequest(customer);
      if (result.status === 'success') {
        $('#duepayreportTableid').DataTable().row(rowindex).data(params).draw();
        redrawDuepayments();
      }
      if (result && result.reloadCustomers) {
        window.initgetCustomers();
      }

      Swal.hideLoading();
      Swal.getCancelButton().style.display = '';
      return true;
    },
  });
}

function addWalletinpaymentoption(params, amountTopay, payment_option) {
  let { payments } = params;
  if (payments && Array.isArray(payments) && payments.length > 0) {
    const doespayExist = _.findIndex(payments, { payment_option });
    if (doespayExist >= 0) {
      const payData = payments[doespayExist];
      payData.amount = Number(payData.amount) + amountTopay;
      payments.splice(doespayExist, 1, payData);
    } else {
      payments.push({
        order_id: params.order_id,
        payment_option,
        amount: amountTopay,
      });
    }
  } else {
    payments = [];
    payments.push({
      order_id: params.order_id,
      payment_option,
      amount: amountTopay,
    });
  }
  const payment_info = payments
    .map(
      (elem) =>
        `${elem.payment_option} - ${elem.amount.toFixed(window.ROUNDOFF_UPTO)}`,
    )
    .join(',');
  return { payments, payment_info };
}

async function redrawDuepayments() {
  const data = $('#duepayreportTableid').DataTable().rows().data();
  delete data.context;
  delete data.selector;
  delete data.ajax;

  const dataAsArray = [];
  for (i = 0; i < data.length; i++) {
    dataAsArray.push(data[i]);
  }

  $('#duepayreportTableid').DataTable().clear().draw();
  $('#duepayreportTableid').DataTable().rows.add(dataAsArray);
  $('#duepayreportTableid').DataTable().columns.adjust().draw();
}

/**
 * Clicked card
 */
async function clickedReport() {
  initalloadDone = true;
  if (!currentReporttype) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:allReports.pleaseSelectReport'),
    );
    return;
  }
  const isStartDaycheckChecked = $('#fetchReportasperclosedayCheckid').is(
    ':checked',
  );
  if (currentReporttype) {
    if (!fromDate) {
      const result = setDateForgettingMidnightReport();

      if (countMidnightSale && result) {
        // fromDate = moment().subtract(1, 'days').startOf('day').format('x');
        // toDate = moment().subtract(1, 'days').endOf('day').format('x');
      } else {
        // fromDate = moment().startOf('day').format('x');
        // toDate = moment().endOf('day').format('x');
      }
    }
    // if (fetchReportAsPerCloseDay && isStartDaycheckChecked) {
    //   const fromToDateresult = getFromAndToDateForReportsAsPerCloseDay({
    //     fromDate,
    //     toDate,
    //   });
    //   console.log('fromToDateresult', fromToDateresult);
    //   if (fromToDateresult.fromDate) {
    //     fromDate = Number(fromToDateresult.fromDate);
    //   }
    //   if (fromToDateresult.toDate) {
    //     toDate = Number(fromToDateresult.toDate);
    //   }
    // }
    const params = {
      reportType: Number(currentReporttype),
      fromDate,
      toDate: Number(toDate),
    };
    if (!window.__IS_MASTER_POS__) {
      Object.assign(params, {
        username: window.storeDetails.username,
      });
      if (window.showAllUserReport) {
        delete params.username;
      }
    }

    const selectedUser = $('#salesreportFilterbyusercombo').val();
    if (selectedUser) {
      Object.assign(params, {
        username: selectedUser,
      });
    }

    switch (params.reportType) {
      case REPORT_TYPES.SALES_REPORT:
        Object.assign(params, {
          getPaymentandItems: true,
          showCategoryData,
          showSolditems,
          showCancelitems,
          showExpenseData,
          showWaiterData,
          showDeliveryBoyData,
          showDuePaymentData,
          showDuePaymentReceivableData,
          showDiscountData,
          showWalletData,
          showKDWiseItemsData,
        });
        clearSalesreportfilters();
        break;
      case REPORT_TYPES.TODAYS_REPORT:
        // fromDate = moment().startOf('day').format('x');
        // toDate = moment().endOf('day').format('x');
        // const isStartDaycheckChecked = $('#fetchReportasperclosedayCheckid').is(
        //   ':checked',
        // );
        // if (fetchReportAsPerCloseDay && isStartDaycheckChecked) {
        //   const fromToDateresult = getFromAndToDateForReportsAsPerCloseDay({
        //     fromDate,
        //     toDate,
        //   });
        //   if (fromToDateresult.fromDate) {
        //     fromDate = Number(fromToDateresult.fromDate);
        //   }
        //   if (fromToDateresult.toDate) {
        //     toDate = Number(fromToDateresult.toDate);
        //   }
        // }
        Object.assign(params, {
          getPaymentandItems: true,
          showCategoryData,
          showSolditems,
          showCancelitems,
          showExpenseData,
          showWaiterData,
          showDeliveryBoyData,
          showDuePaymentData,
          showDuePaymentReceivableData,
          showDiscountData,
          showWalletData,
          showKDWiseItemsData,
        });
        clearSalesreportfilters();
        break;
      case REPORT_TYPES.TOP_ITEMS:
        // check for item report filters sold item/cancelled item/ top item/ discounted item etc
        // if access level is enable for only one item report then fetch that report
        const reportTypes = $(
          '#itemsreportsectionId>div:not([style*="display: none"]',
        );
        if (reportTypes.length == 1) {
          currentReporttype = reportTypes[0].attributes['report-action'].value;
          params.reportType = Number(currentReporttype);
          $(reportTypes[0]).addClass('selectedItemreport');
          setFilters();
        } else if (
          // reportTypes[0].outerText !== 'Top Items'
          reportTypes[0].attributes['report-action'].value != 2
        ) {
          currentReporttype = reportTypes[0].attributes['report-action'].value;
          params.reportType = Number(currentReporttype);
          $('#itemsreportsectionId>div').removeClass('selectedItemreport');
          $(reportTypes[0]).addClass('selectedItemreport');
          setFilters();
        } else {
          let limit = $('#limitFieldid').val();
          if (!limit || !isNumbertest(limit)) {
            limit = 5;
            $('#limitFieldid').val('5');
          }
          $('#itemsreportsectionId>div').removeClass('selectedItemreport');
          $(reportTypes[0]).addClass('selectedItemreport');
          params.limit = limit;
          params.filterbyAmount = $('#byamountCheckid').is(':checked');
          params.groupByBaseItem = $('#groupByBaseItemCheckid').is(':checked');
        }
        break;
      case REPORT_TYPES.ADDON_ITEMS:
        params.filterbyAmount = $('#byamountCheckid').is(':checked');
        params.groupByBaseItem = $('#groupByBaseItemCheckid').is(':checked');
        break;
      case REPORT_TYPES.CATEGORYWISE:
        params.printwithItems = $('#reportcatwithItemscheckid').is(':checked');
        params.groupByBaseItem = $('#groupByBaseItemCheckid').is(':checked');
        break;
      case REPORT_TYPES.SOLD_ITEMS:
      case REPORT_TYPES.COMPLEMENTARY_ITEMS:
      case REPORT_TYPES.DEAD_ITEMS:
      case REPORT_TYPES.DISCOUNTED_ITEMS:
      case REPORT_TYPES.CANCELLED_ITEMS:
      case REPORT_TYPES.DELETED_ITEMS:
        params.groupByBaseItem = $('#groupByBaseItemCheckid').is(':checked');
        break;
      default:
        break;
    }

    switch (params.reportType) {
      case REPORT_TYPES.MALL_REPORT:
        $('#exportreportButton').hide();
        $('#printreportButton').hide();
        $('#printtopdfreportButton').hide();
        $('#exporttotxtreportbutton').show();
        break;

      case (REPORT_TYPES.START_CLOSEDAY, REPORT_TYPES.USER_SHIFT):
        $('#exportreportButton').hide();
        $('#printreportButton').hide();
        $('#printtopdfreportButton').hide();
        break;

      case REPORT_TYPES.KOT_REPORT:
        $('#exportreportButton').show();
        $('#printreportButton').hide();
        $('#printtopdfreportButton').hide();
        $('#exporttotxtreportbutton').hide();
        break;

      case REPORT_TYPES.RESERVATION_REPORT:
        $('#exportreportButton').show();
        $('#printreportButton').hide();
        $('#printtopdfreportButton').hide();
        $('#exporttotxtreportbutton').hide();
        break;

      case REPORT_TYPES.DUE_PAYMENT:
        $('#duepayreportTableid_filter input').val('');
        $('#duepayreportTableid_filter input').keyup();
        break;

      default:
        $('#exportreportButton').show();
        $('#printreportButton').show();
        $('#printtopdfreportButton').show();
        $('#exporttotxtreportbutton').hide();
        break;
    }
    getreportData(params, REPORT_MESSAGES.GET_REPORTDATA);
  }
}
function isNumbertest(n) {
  return /^\d+$/.test(n);
}

async function fetchReportRequest(params) {
  const response = await makeGetReortDataRequest(params);
  if (response) {
    try {
      const data = safeParse(response);
      renderReportdata(data);
    } catch (error) {
      console.log(error);
    }
    Swal.close();
  }
}
/**
 * Makes get report data request
 */
function getreportData(params, event) {
  Swal.fire({
    title: $.i18n.t('controller:allReports.fetchingData'),
    text: $.i18n.t('controller:allReports.fetchingReportsData'),
    showConfirmButton: false,
    width: '23em',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
      fetchReportRequest(params);
      // ipcRenderer.send(event, JSON.stringify(params));
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
  });
}

let paymentsData;
let bills;
let totalChargesForTaxReport;
let totalDiscountForTaxReport;
let totalBillsForTaxReport;
let invoice_range;

function generateMallreportdata(data) {
  const date = moment().format('YYYYMMDD');
  const time = moment().format('HH:mm:ss');
  const ordersList = data.orderData;
  if (ordersList.length > 0) {
    let formattedData = [];
    let recordOpened;
    const firstReciptNumber =
      ordersList[0].bill_number - 1 < 1 ? 1 : ordersList[0].bill_number;
    const lastReceiptNumber = ordersList[ordersList.length - 1].bill_number;
    const posNumber = storeDetails.store_id.slice(0, 6);
    const reportNumber = data.reportId;
    const { tenant_id } = storeDetails;
    recordOpened = `1|OPENED|${tenant_id}|${posNumber}|${firstReciptNumber}|${reportNumber}|${date}|${time}|${storeDetails.username.slice(
      0,
      8,
    )}|${date}`;
    formattedData.push(recordOpened);
    for (let i = 0; i < ordersList.length; i++) {
      const order_date = moment(ordersList[i].created_time).format('YYYYMMDD');
      const order_time = moment(ordersList[i].created_time).format('HH:mm:ss');
      let orderInfo = [];
      const orderDesc = `101|${
        ordersList[i].bill_number
      }|1|${order_date}|${order_time}|${storeDetails.username.slice(
        0.8,
      )}||||||${ordersList[i].persons}|N|SALE`;
      orderInfo.push(orderDesc);
      const orderItems = ordersList[i].orderchildList;
      const items = [];
      for (let j = 0; j < orderItems.length; j++) {
        const itemsDesc = `111|${orderItems[j].item_id}|${orderItems[
          j
        ].quantity.toFixed(ROUNDOFF_UPTO)}|${
          orderItems[j].pricebeforeDiscount &&
          Number(orderItems[j].pricebeforeDiscount).toFixed(ROUNDOFF_UPTO)
        }|${
          orderItems[j].price &&
          Number(orderItems[j].price).toFixed(ROUNDOFF_UPTO)
        }|${
          orderItems[j].pricebeforeDiscount !== orderItems[j].price ? 'P' : ''
        }|${orderItems[j].tax_name}||${Number(orderItems[j].discount).toFixed(
          ROUNDOFF_UPTO,
        )}|${orderItems[j].product_group_name}|||N|${(
          orderItems[j].quantity * orderItems[j].price
        ).toFixed(window.ROUNDOFF_UPTO)}|${orderItems[j].discount_rate}|${
          orderItems[j].discount_type == 1 ? '%' : '$'
        }|${orderItems[j].tax_value}|${orderItems[j].item_id}`;
        items.push(itemsDesc);
      }
      orderInfo.push(items);
      const paymentDetails = ordersList[i].orderPaymentList;

      // let discAndChargesInfo = `121|${ordersList[i].order_total}|${
      //   ordersList[i].discount && ordersList[i].discount.toFixed(ROUNDOFF_UPTO)
      // }|0|${ordersList[i].order_level_total_charges}|${
      //   ordersList[i].order_level_total_taxes
      // }|${'I'}|N|||||`;
      const discAndChargesInfo = `121|${Number(ordersList[i].order_total).toFixed(window.ROUNDOFF_UPTO)}||0||${ordersList[i].order_level_total_taxes}|${'I'}|N|||||`;
      orderInfo.push(discAndChargesInfo);
      const payments = [];
      for (let k = 0; k < paymentDetails.length; k++) {
        const paymentDesc = `131|T|${paymentDetails[k].payment_option}|${
          storeDetails.currency == 'Rs' ? 'INR' : storeDetails.currency
        }|1|${paymentDetails[k].amount.toFixed(
          ROUNDOFF_UPTO,
        )}|||${paymentDetails[k].amount.toFixed(ROUNDOFF_UPTO)}`;
        payments.push(paymentDesc);
      }
      orderInfo.push(payments);
      orderInfo = orderInfo.flat();
      formattedData.push(orderInfo);
    }
    const recordClosed = `1|CLOSED|${tenant_id}|${posNumber}|${lastReceiptNumber}|${reportNumber}|${date}|${time}|${storeDetails.username.slice(
      0,
      8,
    )}|${date}`;

    formattedData.push(recordClosed);
    formattedData = formattedData.flat();
    mallReportcsvdata = formattedData.join('\n');
  }
}
/**
 * Renders the report data
 * @param {Report data} data
 */
async function renderReportdata(data) {
  reportMiscdata = {};
  if (data && data.params) {
    switch (Number(data.params.reportType)) {
      case REPORT_TYPES.SALES_REPORT:
      case REPORT_TYPES.TODAYS_REPORT:
        checksalesFilterapplied = false;
        if (data.bills) {
          $('#salesreportTableid').DataTable().clear().draw();
          $('#salesreportTableid').DataTable().rows.add(data.bills);
          $('#salesreportTableid').DataTable().columns.adjust().draw();
        }
        if (
          REPORT_TYPES.TODAYS_REPORT === Number(data.params.reportType) ||
          REPORT_TYPES.SALES_REPORT === Number(data.params.reportType)
        ) {
          Object.assign(reportMiscdata, {
            payments: data.payments,
            soldItems: data.soldItems,
            orderTypeWiseOrders: data.orderTypeWiseOrders,
            catdataList: data.catdataList,
            expenses_list: data.expenses_list,
            waiterSummary: data.waiterSummary,
            deliveryboySummary: data.deliveryboySummary,
            duePaymentSummary: data.duePaymentSummary,
            duePaymentReceivableSummary: data.duePaymentReceivableSummary,
            discountSummary: data.discountSummary,
            walletSummary: data.walletSummary,
            kdWiseItemSummary: data.kdWiseItemSummary,
            cancelledItems: data.cancelledItems,
            invoice_range: data.invoice_range,
            totalBills: data.totalBills,
            type: REPORT_TYPES.TODAYS_REPORT,
          });
        }
        break;
      case REPORT_TYPES.TOP_ITEMS:
      case REPORT_TYPES.SOLD_ITEMS:
      case REPORT_TYPES.ADDON_ITEMS:
        $('#itemsreportTableid').DataTable().clear().draw();
        $('#itemsreportTableid').DataTable().rows.add(data.items);
        $('#itemsreportTableid').DataTable().columns.adjust().draw();
        break;
      case REPORT_TYPES.COMPLEMENTARY_ITEMS:
      case REPORT_TYPES.CANCELLED_ITEMS:
      case REPORT_TYPES.DELETED_ITEMS:
        $('#complementaryitemsreportTableid').DataTable().clear().draw();
        $('#complementaryitemsreportTableid').DataTable().rows.add(data.items);
        $('#complementaryitemsreportTableid')
          .DataTable()
          .columns.adjust()
          .draw();

        break;
      case REPORT_TYPES.DEAD_ITEMS:
        $('#deaditemsreportTableid').DataTable().clear().draw();
        $('#deaditemsreportTableid').DataTable().rows.add(data.deadItemlist);
        $('#deaditemsreportTableid').DataTable().columns.adjust().draw();
        break;
      case REPORT_TYPES.DISCOUNTED_ITEMS:
        $('#discounteditemsreportTableid').DataTable().clear().draw();
        $('#discounteditemsreportTableid').DataTable().rows.add(data.items);
        $('#discounteditemsreportTableid').DataTable().columns.adjust().draw();
        break;
      // discounteditemsreportTableid
      case REPORT_TYPES.PAYMENT:
        bills = data.bills;
        paymentsData = data.list;
        if (data.list && data.list.length) {
          data.list.map((payment) => {
            payment.amount = payment.amount.toFixed(ROUNDOFF_UPTO);
          });
        }
        invoice_range = data.invoice_range;
        $('#paymentreportTableid').DataTable().clear().draw();
        $('#paymentreportTableid').DataTable().rows.add(data.list);
        $('#paymentreportTableid').DataTable().columns.adjust().draw();
        break;
      case REPORT_TYPES.VAT_REPORT:
        paymentsData = data.payments;
        totalBillsForTaxReport = data.totalBills;
        totalChargesForTaxReport = data.totalCharges;
        totalDiscountForTaxReport = data.totalDiscount;
        $('#vatreportTableid').DataTable().clear().draw();
        $('#vatreportTableid').DataTable().rows.add(data.vatReportList);
        $('#vatreportTableid').DataTable().columns.adjust().draw();
        break;
      case REPORT_TYPES.ORDER_FROM:
        invoice_range = data.invoice_range;
        $('#orderreportTableid').DataTable().clear().draw();
        $('#orderreportTableid').DataTable().rows.add(data.list);
        $('#orderreportTableid').DataTable().columns.adjust().draw();
        break;
      case REPORT_TYPES.CATEGORYWISE:
        $('#catwisereportTableid').DataTable().clear().draw();
        $('#catwisereportTableid').DataTable().rows.add(data.list);
        $('#catwisereportTableid').DataTable().columns.adjust().draw();
        break;
      case REPORT_TYPES.KDWISE:
        $('#kitchendepreportTableid').DataTable().clear().draw();
        $('#kitchendepreportTableid').DataTable().rows.add(data.list);
        $('#kitchendepreportTableid').DataTable().columns.adjust().draw();
        break;
      case REPORT_TYPES.COUPON_HISTORY:
        $('#couponreportTableid').DataTable().clear().draw();
        $('#couponreportTableid').DataTable().rows.add(data.list);
        $('#couponreportTableid').DataTable().columns.adjust().draw();
        break;
      case REPORT_TYPES.START_CLOSEDAY:
        $('#dayendreportTableid').DataTable().clear().draw();
        $('#dayendreportTableid').DataTable().rows.add(data.list);
        $('#dayendreportTableid').DataTable().columns.adjust().draw();
        break;
      case REPORT_TYPES.USER_SHIFT:
        $('#usershiftreportTableid').DataTable().clear().draw();
        $('#usershiftreportTableid').DataTable().rows.add(data.list);
        $('#usershiftreportTableid').DataTable().columns.adjust().draw();
        break;
      case REPORT_TYPES.DUE_PAYMENT:
        $('#duepayreportTableid').DataTable().clear().draw();
        $('#duepayreportTableid').DataTable().rows.add(data.list);
        $('#duepayreportTableid').DataTable().columns.adjust().draw();
        showOnlyDueWrapper('duepayreportTableid');

        break;
      case REPORT_TYPES.DUE_PAYMENT_HISTORY:
        $('#duepayhistoryreportTableid').DataTable().clear().draw();
        $('#duepayhistoryreportTableid').DataTable().rows.add(data.list);
        $('#duepayhistoryreportTableid').DataTable().columns.adjust().draw();
        showOnlyDueWrapper('duepayhistoryreportTableid');

        break;
      case REPORT_TYPES.DUE_BY_CUSTOMER:
        $('#customerduepayreportTableid').DataTable().clear().draw();
        $('#customerduepayreportTableid').DataTable().rows.add(data.list);
        $('#customerduepayreportTableid').DataTable().columns.adjust().draw();
        showOnlyDueWrapper('customerduepayreportTableid');

        break;
      case REPORT_TYPES.BILLPRINT_HISTORY:
        $('#billprintreportTableid').DataTable().clear().draw();
        $('#billprintreportTableid')
          .DataTable()
          .rows.add(data.billprintHistory);
        $('#billprintreportTableid').DataTable().columns.adjust().draw();
        break;
      case REPORT_TYPES.APPLIED_CHARGES_HISTORY:
        $('#appliedchargesreportTableid').DataTable().clear().draw();
        $('#appliedchargesreportTableid')
          .DataTable()
          .rows.add(data.appliedChargehistory);
        $('#appliedchargesreportTableid').DataTable().columns.adjust().draw();
        break;
      case REPORT_TYPES.PRE_ORDER_REPORT:
        $('#preorderreportTableid').DataTable().clear().draw();
        $('#preorderreportTableid')
          .DataTable()
          .rows.add(data.preordersList || []);
        $('#preorderreportTableid').DataTable().columns.adjust().draw();
        break;

      case REPORT_TYPES.MALL_REPORT:
        $('#mallreportTableid').DataTable().clear().draw();
        $('#mallreportTableid').DataTable().rows.add(data.orderData);
        $('#mallreportTableid').DataTable().columns.adjust().draw();

        generateMallreportdata(data);
        break;

      case REPORT_TYPES.KOT_REPORT:
        $('#kotreportTableid').DataTable().clear().draw();
        $('#kotreportTableid').DataTable().rows.add(data.kotReportData);
        $('#kotreportTableid').DataTable().columns.adjust().draw();
        break;

      case REPORT_TYPES.RESERVATION_REPORT:
        $('#reservationReportTableid').DataTable().clear().draw();
        $('#reservationReportTableid')
          .DataTable()
          .rows.add(data.reservationData);
        $('#reservationReportTableid').DataTable().columns.adjust().draw();
        break;

      case REPORT_TYPES.DELIVERY_BOY_REPORT:
        $('#deliveryBoyreportTableid').DataTable().clear().draw();
        $('#deliveryBoyreportTableid')
          .DataTable()
          .rows.add(data.deliveryboySummary || []);
        $('#deliveryBoyreportTableid').DataTable().columns.adjust().draw();
        break;

      case REPORT_TYPES.USER_REPORT:
        $('#userreportTableid').DataTable().clear().draw();
        $('#userreportTableid')
          .DataTable()
          .rows.add(data.userwiseList || []);
        $('#userreportTableid').DataTable().columns.adjust().draw();
        break;
      default:
        break;
    }
  }
}

ipcRenderer.on(REPORT_MESSAGES.GET_REPORTDATA_REPLY, async (event, content) => {
  if (content) {
    try {
      const data = safeParse(content);
      renderReportdata(data);
    } catch (error) {
      console.log(error);
    }
  }
  Swal.close();
});
ipcRenderer.on(
  REPORT_MESSAGES.GET_STARTENDREPORT_DATA_REPLY,
  async (event, content) => {
    if (Swal.isVisible()) {
      Swal.close();
    }
    try {
      content = safeParse(content);
      if (content.catdataList && content.catdataList.length > 0) {
        content.catdataList.map((category) => {
          delete Object.assign(category, {
            name: category.category_name,
          }).category_name;
        });
      }
      if (content && content.day_close_transactions) {
        content.dayShift_end_transactions = safeParse(
          content.day_close_transactions,
        );
      }
      generateStartenddayreport(content, 'Start Close day report');
    } catch (error) {}
  },
);

ipcRenderer.on(
  REPORT_MESSAGES.GET_USERSHIFT_DATA_REPLY,
  async (event, content) => {
    if (Swal.isVisible()) {
      Swal.close();
    }
    try {
      content = safeParse(content);
      if (content.catdataList && content.catdataList.length > 0) {
        content.catdataList.map((category) => {
          delete Object.assign(category, {
            name: category.category_name,
          }).category_name;
        });
      }

      generateStartenddayreport(content, 'User shift report');
    } catch (error) {
      console.error(error);
    }
  },
);

async function generateStartenddayreport(reportData, report_type) {
  const data = {};
  const previewDetails = {
    data,
    report_type,
  };

  if (reportData.fromDate && reportData.toDate) {
    const date1 = new Date(parseInt(reportData.fromDate));
    // let formattedDate = formatAMPM(date1, false);
    // let date2 = new Date(parseInt(reportData.toDate));
    // let formattedDate2 = formatAMPM(date2, false);
    const formattedDate = moment(date1).format('dd/mm/yyyy');
    const date2 = new Date(parseInt(reportData.toDate));
    const formattedDate2 = moment(date2).format('dd/mm/yyyy');
    data.customDatetitle = `${$.i18n.t(
      'report.between',
    )} ${formattedDate} ${$.i18n.t('report.to')} ${formattedDate2}`;
  }

  let rawData;
  if (report_type == 'User shift report') {
    if (sendBase64StringOnCloseShift) {
      Object.assign(previewDetails, {
        storeDetails: window.storeDetails,
        sendBase64String: sendBase64StringOnCloseShift,
        printReportWhileSendingOnMail:
          printReportWhileSendingOnMailForCloseShiftReport,
        showLoader: true,
      });
    }
    const table = $('#usershiftreportTableid').DataTable();
    rawData = table.rows().data();
    delete Object.assign(rawData[reportData.rowIndex], {
      username: rawData[reportData.rowIndex].shift_end_by_user,
    }).shift_end_by_user;
  }

  if (report_type == 'Start Close day report') {
    if (sendBase64StringForclosedayreport) {
      Object.assign(previewDetails, {
        storeDetails: window.storeDetails,
        sendBase64String: sendBase64StringForclosedayreport,
        printReportWhileSendingOnMail:
          printReportWhileSendingOnMailForCloseDayReport,
        showLoader: true,
      });
    }
    const table = $('#dayendreportTableid').DataTable();
    rawData = table.rows().data();
    delete Object.assign(rawData[reportData.rowIndex], {
      fromDate: rawData[reportData.rowIndex].start_day_date,
    }).start_day_date;
    delete Object.assign(rawData[reportData.rowIndex], {
      toDate: rawData[reportData.rowIndex].day_close_date,
    }).day_close_date;
    delete Object.assign(rawData[reportData.rowIndex], {
      username: rawData[reportData.rowIndex].day_close_by_user,
    }).day_close_by_user;
  }

  if (reportData.bills.bills && reportData.bills.bills.length > 0) {
    data.bills = reportData.bills.bills;
    data.payments = reportData.paymentDetails;
    data.closeDaysoldItems = reportData.soldItems;
    data.orderTypeWiseOrders = reportData.orderTypeWiseOrders;
    data.deliveryboySummary = reportData.deliveryboySummary;
    data.discountSummary = reportData.discountSummary;
    data.waiterSummary = reportData.waiterSummary;
    data.cancelledItems = reportData.cancelledItems;
    data.walletSummary = reportData.walletSummary;
    data.kdWiseItemSummary = reportData.kdWiseItemSummary;
    data.discountSummary = reportData.discountSummary;
    data.totalBills = reportData.totalBills;
    data.duePaymentReceivableSummary = reportData.duePaymentReceivableSummary;
    data.duePaymentSummary = reportData.duePaymentSummary;
    data.expenses_list = reportData.expenses_list;
    data.soldItems = reportData.soldItems;
    data.totalBills = reportData.bills.bills.length;
    data.invoice_range = reportData.invoice_range;
    data.dayShift_end_transactions = reportData.dayShift_end_transactions;
    // data.showSolditems = true;
    if (showCategoryData && reportData.catdataList) {
      Object.assign(data, {
        catwisedataList: reportData.catdataList,
      });
    }
    data.shiftData = rawData[reportData.rowIndex];
    renderReport(previewDetails);
  }
}
/**
 * Send's request to get order details
 * @param {Order ID} order_id
 */
async function getOrderdetails(order_id) {
  ipcRenderer.send(
    ORDER_IPC.GET_ORDER_DETAILS,
    JSON.stringify({ order_id, requestFrom: APP_WINDOWS.REPORT }),
  );
}

function showItems(data) {
  $('#preOrderDetailsModal').modal('show');
  $('#preOrderDetailsBodyid').attr('data', JSON.stringify(data));
  renderPreOrderDetails();
}

function clearreportsData() {
  $('#reportsmainWrappperid .dataTable').DataTable().clear().draw();
  $('#reportsmainWrappperid .dataTable').DataTable().rows.add([]);
  $('#reportsmainWrappperid .dataTable').DataTable().columns.adjust().draw();
}

function showOrderdetails(params) {
  if (params && params.billDetails) {
    if (!window.billdetailsscriptLoaded) {
      $('#billdetailspreviewBodyid').load('Billdetails.html', () => {
        renderBilldetail_fromremote(params.billDetails, true);
      });
    } else {
      renderBilldetail_fromremote(params.billDetails, true);
    }
  }
}

window.showOrderdetailsfromremote_forreport = function (params) {
  showOrderdetails(params);
};

window.clearreportDatafromremote = function () {
  clearreportsData();
};
function showOnlyDueWrapper(activeTableId) {
  $('#duepayreportTableid_wrapper').hide();
  $('#customerduepayreportTableid_wrapper').hide();
  $('#duepayhistoryreportTableid_wrapper').hide();

  $('#' + activeTableId + '_wrapper').show();

  try {
    $('#' + activeTableId)
      .DataTable()
      .columns.adjust()
      .draw(false);
  } catch (e) {}
}

function Initialize() {
  if (
    window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1] !== undefined
  ) {
    countMidnightSale =
      window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1].value ===
      '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showCategoryData =
      window.settingsConfig[SHOW_CATEGORYWISE_ITEM_REPORT - 1].value === '1';
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
    showDuePaymentData =
      window.settingsConfig[SHOW_DEU_PAYEMENT_SUMMARY_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showDuePaymentReceivableData =
      window.settingsConfig[SHOW_DUE_PAYMENTS_RECEIVABLE_SUMMARY - 1].value ===
      '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showDiscountData =
      window.settingsConfig[SHOW_DISCOUNT_SUMMARY_REPORT - 1].value === '1';
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
    showSolditems =
      window.settingsConfig[SHOW_SOLDITEMS_IN_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showCancelitems =
      window.settingsConfig[SHOW_CANCELITEMS_IN_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    showExpenseData =
      window.settingsConfig[SHOW_EXPENSE_REPORT - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    countSellExemptedTotal =
      window.settingsConfig[COUNT_SELL_EXEMPTED_TOTAL - 1].value === '1';
  }

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    fetchReportAsPerCloseDay =
      window.settingsConfig[FETCH_REPORT_AS_PER_CLOSE_DAY - 1].value === '1';

    $('#fetchReportasperclosedayCheckid').prop(
      'checked',
      fetchReportAsPerCloseDay,
    );

    if (!fetchReportAsPerCloseDay) {
      $('#fetchReportasperclosedayCheckid').hide();
    }
  }

  if (
    window.settingsConfig[SEND_BASE64_REPORT_FROM_REPORT_SECTION - 1] !==
    undefined
  ) {
    sendBase64String =
      window.settingsConfig[SEND_BASE64_REPORT_FROM_REPORT_SECTION - 1]
        .value === '1';
  }

  if (
    window.settingsConfig[SEND_BASE64_REPORT_FROM_CLOSE_DAY_REPORT - 1] !==
    undefined
  ) {
    sendBase64StringForclosedayreport =
      window.settingsConfig[SEND_BASE64_REPORT_FROM_CLOSE_DAY_REPORT - 1]
        .value === '1';
  }

  if (
    window.settingsConfig[SEND_BASE64_REPORT_OF_CLOSE_SHIFT - 1] != undefined
  ) {
    sendBase64StringOnCloseShift =
      window.settingsConfig[SEND_BASE64_REPORT_OF_CLOSE_SHIFT - 1].value == '1';
  }

  if (
    window.settingsConfig[
      PRINT_REPORT_WHILE_SENDING_ON_MAIL_FROM_REPORT_SECTION - 1
    ] !== undefined
  ) {
    printReportWhileSendingOnMail =
      window.settingsConfig[
        PRINT_REPORT_WHILE_SENDING_ON_MAIL_FROM_REPORT_SECTION - 1
      ].value === '1';
  }

  if (
    window.settingsConfig[
      PRINT_REPORT_WHILE_SENDING_ON_MAIL_FROM_CLOSE_DAY_REPORT - 1
    ] !== undefined
  ) {
    printReportWhileSendingOnMailForCloseDayReport =
      window.settingsConfig[
        PRINT_REPORT_WHILE_SENDING_ON_MAIL_FROM_CLOSE_DAY_REPORT - 1
      ].value === '1';
  }

  if (
    window.settingsConfig[
      PRINT_REPORT_WHILE_SENDING_ON_MAIL_OF_CLOSE_SHIFT - 1
    ] !== undefined
  ) {
    printReportWhileSendingOnMailForCloseShiftReport =
      window.settingsConfig[
        PRINT_REPORT_WHILE_SENDING_ON_MAIL_OF_CLOSE_SHIFT - 1
      ].value === '1';
  }

  const result = setDateForgettingMidnightReport();

  if (countMidnightSale && result) {
    $('#reportfromdateButton').daterangepicker({
      timePicker: true,
      timePickerSeconds: true,
      // maxDate: window.moment().subtract(1, 'days').endOf('day'),
      startDate: window.moment().subtract(1, 'days').startOf('day'),
      endDate: window.moment().subtract(1, 'days').endOf('day'),
      locale: {
        // format: 'YYYY/MM/DD hh:mm A'
        format: 'DD MMMM YYYY hh:mm A',
        customRangeLabel: $.i18n.t('common:timeRange.customRange'),
      },
      ranges: {
        [$.i18n.t('common:timeRange.Today')]: [
          window.moment().subtract(1, 'days').startOf('day'),
          window.moment().subtract(1, 'days').endOf('day'),
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
  } else {
    $('#reportfromdateButton').daterangepicker({
      timePicker: true,
      timePickerSeconds: true,
      // maxDate: window.moment().endOf('day'),
      startDate: window.moment().startOf('day'),
      endDate: window.moment().endOf('day'),
      locale: {
        // format: 'YYYY/MM/DD hh:mm A'
        format: 'DD MMMM YYYY hh:mm A',
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
  $('#reportfromdateButton').on('apply.daterangepicker', (ev, picker) => {
    fromDate = window.moment(picker.startDate).format('x');
    toDate = window.moment(picker.endDate).format('x');
    const isStartDaycheckChecked = $('#fetchReportasperclosedayCheckid').is(
      ':checked',
    );
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
  });

  $('#fetchReportasperclosedayCheckid').on('click', function () {
    if ($(this).is(':checked')) {
      $('#reportfromdateButton').trigger('apply.daterangepicker', {
        if(fetchReportAsPerCloseDay) {
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
        },
      });
    }
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // End of today (11:59:59 PM)
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  fromDate = startOfToday.getTime();
  toDate = endOfToday.getTime();
  if (fetchReportAsPerCloseDay) {
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
  $('#reportfromdateButton').on(
    'cancel.daterangepicker',
    function (ev, picker) {
      $(this).val('');
      fromDate = undefined;
      toDate = undefined;
    },
  );

  $('#reportsListid li').hide();

  $('#reporttypeContainerid div.reportscard').on('click', function () {
    reportclickListener(this);
  });

  $('#fetchreportsButton').on('click', () => {
    clickedReport();
  });

  $('#reportcatwithItemscheckid').on('click', function () {
    $(this).is(':checked') && clickedReport();
  });

  $('#clearfilterSelection').on('click', () => {
    clearfilterSelection();
  });

  $('#printreportButton').on('click', () => {
    printcurrentReport({ converttoPdf: false });
  });

  $('#printtopdfreportButton').on('click', () => {
    printcurrentReport({ converttoPdf: true });
  });

  $('#exportreportButton').on('click', () => {
    exportreporttoExcel();
  });

  $('#exporttotxtreportbutton').on('click', () => {
    exportreporttoTxt();
  });

  $('#itemsreportsectionId>div').on('click', function () {
    $('#itemsreportsectionId>div').removeClass('selectedItemreport');
    $(this).addClass('selectedItemreport');
    currentReporttype = $(this).attr('report-action');
    setFilters();
    clickedReport();
  });

  // $('#salesreport_clearselection').on('click', clearSalesreportfilters);
  $('#salesreport_clearselection').on('click', function () {
    clearSalesreportfilters();
    clickedReport();
  });

  initTables();
  initialSetup();
  addSalesreportfilters();
  $(
    '#duepayhistoryreportTableid_wrapper, #customerduepayreportTableid_wrapper',
  ).hide();
  if ($('#due-sections-container-id div.selectedSection').length === 0) {
    $('#duepayreportTableid_wrapper').show();
  }
  $('#due-sections-container-id div,#misc-sections-container-id div').on(
    'click',
    function () {
      $(this).siblings().removeClass('selectedSection');
      $(this).addClass('selectedSection');
      currentReporttype = $(this).attr('report-action');

      // 🔒 PRE-HIDE ALL DUE TABLE WRAPPERS (UI ONLY, NO LOGIC)
      $('#duepayreportTableid_wrapper').hide();
      $('#customerduepayreportTableid_wrapper').hide();
      $('#duepayhistoryreportTableid_wrapper').hide();

      setFilters();
      clickedReport();
    },
  );

  initAccesslevelsforreports();
  initializeReportwindowpermissions();
  // Set default selected
  setTimeout(() => {
    // Open the report which is not passcode protected
    $(
      '#reporttypeContainerid div.reportscard div:not([passcode-protected]):visible:first',
    ).click();
  }, 200);

  if ($.i18n) {
    initializei18nforallReportsswindowui();
  } else {
    setTimeout(initializei18nforallReportsswindowui, 400);
  }
}

Initialize();
