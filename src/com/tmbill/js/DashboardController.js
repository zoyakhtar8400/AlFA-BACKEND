/* eslint-disable camelcase */
const { Chart } = require('chart.js/auto');
const { DASHBOARD_IPC } = require('../util/IPC_Messages');
const { materialColor } = require('../util/MiscUtil');
const { initAccesslevelsfordashboard } = require('./AccesslevelManager');
const { initializei18nforDashboardwindowui } = require('./i18nController');
const { setDashboardsalespermission } = require('./PasscodeController');
const { setDateForgettingMidnightReport } = require('../util/MiscUtil');
const {
  COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY,
  FETCH_REPORT_AS_PER_CLOSE_DAY,
} = require('../util/SettingIDs');
const {
  getFromAndToDateForReportsAsPerCloseDay,
  getFromAndToDateForReportsAsPerCloseDayForMonthwiseReport,
} = require('./RendererUtils');

const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];
window.dashboardWindowloaded = true;

let saleslineChart;
let salesBarchart;
let topItemspiechart;
let countMidnightSale = false;
let fetchReportAsPerCloseDay = false;
const ROUNDOFF_UPTO = window.ROUNDOFF_UPTO;
const currency = window.currency;

async function getDashboarddata() {
  let response;
  const result = setDateForgettingMidnightReport();
  if (countMidnightSale && result) {
    response = await betteripcRenderer.callMain(DASHBOARD_IPC.GET_ALL_DATA, {
      bydate: false,
      user_id: window.storeDetails.username,
      store_id: window.storeDetails.store_id,
      fromDate: result.fromDate,
      toDate: result.toDate,
      monthStart: result.monthStart,
      monthEnd: result.monthEnd,
      weekStart: result.weekStart,
      weekEnd: result.weekEnd,
      sales_params: {
        getSalesby: 'default',
        toDate: moment().format('x'),
        fromDate: moment().subtract(30, 'days').format('x'),
        user_id: window.storeDetails.username,
        store_id: window.storeDetails.store_id,
      },
      items_params: {
        toDate: moment().format('x'),
        fromDate: moment().subtract(30, 'days').format('x'),
        filterbyAmount: false,
        limit: 5,
        user_id: window.storeDetails.username,
        store_id: window.storeDetails.store_id,
      },
    });
    if (response && response.data) {
      renderDashboarddata(response.data);
    }
  } else {
    let fromDate = window.moment().startOf('day').format('x');
    let toDate = window.moment().endOf('day').format('x');

    let monthStart = window.moment().startOf('month').format('x');
    let monthEnd = window.moment().endOf('month').format('x');
    let weekStart = window.moment().startOf('week').format('x');
    let weekEnd = window.moment().endOf('week').format('x');
    if (fetchReportAsPerCloseDay) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // End of today (11:59:59 PM)
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      fromDate = startOfToday.getTime();
      toDate = endOfToday.getTime();
      const fromToDateresult = getFromAndToDateForReportsAsPerCloseDay({
        fromDate,
        toDate,
      });
      console.log('fromToDateresult:', fromToDateresult);
      if (fromToDateresult.fromDate) {
        fromDate = Number(fromToDateresult.fromDate);
      }
      if (fromToDateresult.toDate) {
        toDate = Number(fromToDateresult.toDate);
      }

      const monthfromToDateresult =
        getFromAndToDateForReportsAsPerCloseDayForMonthwiseReport({
          fromDate: monthStart,
          toDate: monthEnd,
        });

      if (monthfromToDateresult.fromDate) {
        monthStart = Number(monthfromToDateresult.fromDate);
      }
      if (monthfromToDateresult.toDate) {
        monthEnd = Number(monthfromToDateresult.toDate);
      }

      const weekfromToDateresult =
        getFromAndToDateForReportsAsPerCloseDayForMonthwiseReport({
          fromDate: weekStart,
          toDate: weekEnd,
        });

      if (weekfromToDateresult.fromDate) {
        weekStart = Number(weekfromToDateresult.fromDate);
      }
      if (weekfromToDateresult.toDate) {
        weekEnd = Number(weekfromToDateresult.toDate);
      }
    }

    let saletoDate = window.moment().format('x');
    let salefromDate = window.moment().subtract(30, 'days').format('x');
    if (fetchReportAsPerCloseDay) {
      const fromToDateresult = getFromAndToDateForReportsAsPerCloseDay({
        fromDate: salefromDate,
        toDate: saletoDate,
      });
      if (fromToDateresult.fromDate) {
        salefromDate = Number(fromToDateresult.fromDate);
      }
      if (fromToDateresult.toDate) {
        saletoDate = Number(fromToDateresult.toDate);
      }
    }
    response = await window.betteripcRenderer.callMain(
      DASHBOARD_IPC.GET_ALL_DATA,
      {
        bydate: false,
        user_id: window.storeDetails.username,
        store_id: window.storeDetails.store_id,
        fromDate,
        toDate,
        monthStart,
        monthEnd,
        weekStart,
        weekEnd,
        sales_params: {
          getSalesby: 'default',
          toDate: saletoDate,
          fromDate: salefromDate,
          user_id: window.storeDetails.username,
          store_id: window.storeDetails.store_id,
        },
        items_params: {
          toDate: saletoDate,
          fromDate: salefromDate,
          filterbyAmount: false,
          limit: 5,
          user_id: window.storeDetails.username,
          store_id: window.storeDetails.store_id,
        },
      },
    );
    if (response && response.data) {
      renderDashboarddata(response.data);
    }
  }
}

async function getDashboarddatabydate() {
  let date1 = $('#dashboarddateFilterid')
    .data('daterangepicker')
    .startDate.format('x');
  let date2 = $('#dashboarddateFilterid')
    .data('daterangepicker')
    .endDate.format('x');
  let weekStart = window.moment().startOf('week').format('x');
  let weekEnd = window.moment().endOf('week').format('x');
  if (fetchReportAsPerCloseDay) {
    const fromToDateresult = getFromAndToDateForReportsAsPerCloseDay({
      fromDate: date1,
      toDate: date2,
    });
    if (fromToDateresult.fromDate) {
      date1 = Number(fromToDateresult.fromDate);
    }
    if (fromToDateresult.toDate) {
      date2 = Number(fromToDateresult.toDate);
    }

    const weekfromToDateresult = getFromAndToDateForReportsAsPerCloseDay({
      fromDate: weekStart,
      toDate: weekEnd,
    });

    if (weekfromToDateresult.fromDate) {
      weekStart = Number(weekfromToDateresult.fromDate);
    }
    if (weekfromToDateresult.toDate) {
      weekEnd = Number(weekfromToDateresult.toDate);
    }
  }

  const response = await betteripcRenderer.callMain(
    DASHBOARD_IPC.GET_ALL_DATA,
    {
      bydate: true,
      user_id: window.storeDetails.username,
      store_id: window.storeDetails.store_id,
      fromDate: date1,
      toDate: date2,
      weekStart,
      weekEnd,
      sales_params: {
        getSalesby: 'default',
        toDate: date2,
        fromDate: date1,
        user_id: window.storeDetails.username,
        store_id: window.storeDetails.store_id,
      },
      items_params: {
        toDate: date2,
        fromDate: date1,
        filterbyAmount: false,
        limit: 5,
        user_id: window.storeDetails.username,
        store_id: window.storeDetails.store_id,
      },
    },
  );

  if (response && response.data) {
    renderDashboarddata(response.data);
  }
}

function renderDashboarddata(data) {
  const { dashboardDetails } = data;
  console.log('dashboardDetails::', dashboardDetails);
  if (data && dashboardDetails) {
    const paymentsTotal = dashboardDetails.paymentsTotal || 0;
    const todaysTotal = dashboardDetails.todaysTotal ?? 0;
    const todaysOrders = dashboardDetails.todaysOrders ?? 0;
    const totalSales = dashboardDetails.totalSale ?? 0;
    const monthOrders = dashboardDetails.monthOrders
      ? dashboardDetails.monthOrders
      : 0;

    const duePaymentsRecived = data.duePaymentRecieved || 0;
    const duePaymentsReceivable = data.duePaymentReceivable || 0;
    const walletCredited = data.walletCredited || 0;
    const walletDebited = data.walletDebited || 0;

    const monthsTotal = dashboardDetails.monthsTotal
      ? dashboardDetails.monthsTotal
      : 0;
    const totalOrders = dashboardDetails.totalOrders
      ? dashboardDetails.totalOrders
      : 0;
    const avgsalesPerperson = dashboardDetails.avgsalesPerperson
      ? dashboardDetails.avgsalesPerperson
      : 0;

    const offlineSales = dashboardDetails.offlineSales
      ? dashboardDetails.offlineSales
      : 0;
    const offlineSalescount = dashboardDetails.offlineSalescount
      ? dashboardDetails.offlineSalescount
      : 0;
    const onlineSales = dashboardDetails.onlineSales ?? 0;
    const onlineSalescount = dashboardDetails.onlineSalescount
      ? dashboardDetails.onlineSalescount
      : 0;

    const totalTax = dashboardDetails.totalTax ? dashboardDetails.totalTax : 0;
    const totalDiscount = dashboardDetails.totalDiscount
      ? dashboardDetails.totalDiscount
      : 0;
    const oltotalTax = dashboardDetails.oltotalTax
      ? dashboardDetails.oltotalTax
      : 0;
    const oltotalDiscount = dashboardDetails.oltotalDiscount
      ? dashboardDetails.oltotalDiscount
      : 0;
    const quickbillTotal = dashboardDetails.quickbillTotal
      ? dashboardDetails.quickbillTotal
      : 0;
    const quickbillOrders = dashboardDetails.quickbillOrders
      ? dashboardDetails.quickbillOrders
      : 0;
    const dineinTotal = dashboardDetails.dineinTotal
      ? dashboardDetails.dineinTotal
      : 0;
    const dineinOrders = dashboardDetails.dineinOrders
      ? dashboardDetails.dineinOrders
      : 0;
    const takeawayTotal = dashboardDetails.takeawayTotal
      ? dashboardDetails.takeawayTotal
      : 0;
    const takeawayOrders = dashboardDetails.takeawayOrders
      ? dashboardDetails.takeawayOrders
      : 0;
    const homdedelTotal = dashboardDetails.homdedelTotal
      ? dashboardDetails.homdedelTotal
      : 0;
    const homdedelOrders = dashboardDetails.homdedelOrders
      ? dashboardDetails.homdedelOrders
      : 0;

    //    const quickbillrecord = ordertypewisedashboardDetails.find(
    //   (item) => item.billing_type === 0,
    // );
    // const quickbillTotal =
    //   quickbillrecord && quickbillrecord.total_sale
    //     ? quickbillrecord.total_sale
    //     : 0;
    // const quickbillOrders =
    //   quickbillrecord && quickbillrecord.total_orders
    //     ? quickbillrecord.total_orders
    //     : 0;

    // const dineinrecord = ordertypewisedashboardDetails.find(
    //   (item) => item.billing_type === 1,
    // );
    // const dineinTotal =
    //   dineinrecord && dineinrecord.total_sale ? dineinrecord.total_sale : 0;
    // const dineinOrders =
    //   dineinrecord && dineinrecord.total_orders ? dineinrecord.total_orders : 0;

    // const takeawayrecord = ordertypewisedashboardDetails.find(
    //   (item) => item.billing_type === 2,
    // );
    // const takeawayTotal =
    //   takeawayrecord && takeawayrecord.total_sale
    //     ? takeawayrecord.total_sale
    //     : 0;
    // const takeawayOrders =
    //   takeawayrecord && takeawayrecord.total_orders
    //     ? takeawayrecord.total_orders
    //     : 0;

    // const deliveryrecord = ordertypewisedashboardDetails.find(
    //   (item) => item.billing_type === 3,
    // );
    // const homdedelTotal =
    //   deliveryrecord && deliveryrecord.total_sale
    //     ? deliveryrecord.total_sale
    //     : 0;
    // const homdedelOrders =
    //   deliveryrecord && deliveryrecord.total_orders
    //     ? deliveryrecord.total_orders
    //     : 0;

    const swiggyTotal = dashboardDetails.swiggyTotal
      ? dashboardDetails.swiggyTotal
      : 0;
    const swiggyOrders = dashboardDetails.swiggyOrders
      ? dashboardDetails.swiggyOrders
      : 0;
    const zomatoTotal = dashboardDetails.zomatoTotal
      ? dashboardDetails.zomatoTotal
      : 0;
    const zomatoOrders = dashboardDetails.zomatoOrders
      ? dashboardDetails.zomatoOrders
      : 0;
    const ubereatsTotal = dashboardDetails.ubereatsTotal
      ? dashboardDetails.ubereatsTotal
      : 0;
    const ubereatsOrders = dashboardDetails.ubereatsOrders
      ? dashboardDetails.ubereatsOrders
      : 0;
    const dunzoTotal = dashboardDetails.dunzoTotal
      ? dashboardDetails.dunzoTotal
      : 0;
    const dunzoOrders = dashboardDetails.dunzoOrders
      ? dashboardDetails.dunzoOrders
      : 0;

    const ondcTotal = dashboardDetails.ondcTotal
      ? dashboardDetails.ondcTotal
      : 0;
    const ondcOrders = dashboardDetails.ondcOrders
      ? dashboardDetails.ondcOrders
      : 0;

    const weeksTotal = dashboardDetails.weeksTotal
      ? dashboardDetails.weeksTotal
      : 0;

    const dineoutTotal = dashboardDetails.dineoutTotal
      ? dashboardDetails.dineoutTotal
      : 0;
    const dineoutOrders = dashboardDetails.dineoutOrders
      ? dashboardDetails.dineoutOrders
      : 0;

    const googlepayTotal = dashboardDetails.googlepayTotal
      ? dashboardDetails.googlepayTotal
      : 0;
    const googlepayOrders = dashboardDetails.googlepayOrders
      ? dashboardDetails.googlepayOrders
      : 0;

    const gupshupTotal = dashboardDetails.gupshupTotal
      ? dashboardDetails.dineoutTgupshupTotalotal
      : 0;
    const gupshupOrders = dashboardDetails.gupshupOrders
      ? dashboardDetails.gupshupOrders
      : 0;

    const peppoTotal = dashboardDetails.peppoTotal
      ? dashboardDetails.peppoTotal
      : 0;
    const peppoOrders = dashboardDetails.peppoOrders
      ? dashboardDetails.peppoOrders
      : 0;

    const amazonfoodTotal = dashboardDetails.amazonfoodTotal
      ? dashboardDetails.amazonfoodTotal
      : 0;
    const amazonfoodOrders = dashboardDetails.amazonfoodOrders
      ? dashboardDetails.amazonfoodOrders
      : 0;

    const dotpeTotal = dashboardDetails.dotpeTotal
      ? dashboardDetails.dotpeTotal
      : 0;
    const dotpeOrders = dashboardDetails.dotpeOrders
      ? dashboardDetails.dotpeOrders
      : 0;

    const eazydinerTotal = dashboardDetails.eazydinerTotal
      ? dashboardDetails.eazydinerTotal
      : 0;
    const eazydinerOrders = dashboardDetails.eazydinerOrders
      ? dashboardDetails.eazydinerOrders
      : 0;

    const dukaanTotal = dashboardDetails.dukaanTotal
      ? dashboardDetails.dukaanTotal
      : 0;
    const dukaanOrders = dashboardDetails.dukaanOrders
      ? dashboardDetails.dukaanOrders
      : 0;

    const jungleworksTotal = dashboardDetails.jungleworksTotal
      ? dashboardDetails.jungleworksTotal
      : 0;
    const jungleworksOrders = dashboardDetails.jungleworksOrders
      ? dashboardDetails.jungleworksOrders
      : 0;

    const yumzyTotal = dashboardDetails.yumzyTotal
      ? dashboardDetails.yumzyTotal
      : 0;
    const yumzyOrders = dashboardDetails.yumzyOrders
      ? dashboardDetails.yumzyOrders
      : 0;

    const magicpinTotal = dashboardDetails.magicpinTotal
      ? dashboardDetails.magicpinTotal
      : 0;
    const magicpinOrders = dashboardDetails.magicpinOrders
      ? dashboardDetails.magicpinOrders
      : 0;

    const thriveTotal = dashboardDetails.thriveTotal
      ? dashboardDetails.thriveTotal
      : 0;
    const thriveOrders = dashboardDetails.thriveOrders
      ? dashboardDetails.thriveOrders
      : 0;

    const talabatTotal = dashboardDetails.talabatTotal
      ? dashboardDetails.talabatTotal
      : 0;
    const talabatOrders = dashboardDetails.talabatOrders
      ? dashboardDetails.talabatOrders
      : 0;

    const radyesTotal = dashboardDetails.radyesTotal
      ? dashboardDetails.radyesTotal
      : 0;
    const radyesOrders = dashboardDetails.radyesOrders
      ? dashboardDetails.radyesOrders
      : 0;

    const mymenuTotal = dashboardDetails.mymenuTotal
      ? dashboardDetails.mymenuTotal
      : 0;
    const mymenuOrders = dashboardDetails.mymenuOrders
      ? dashboardDetails.mymenuOrders
      : 0;

    const deliverectTotal = dashboardDetails.deliverectTotal
      ? dashboardDetails.deliverectTotal
      : 0;
    const deliverectOrders = dashboardDetails.deliverectOrders
      ? dashboardDetails.deliverectOrders
      : 0;

    const foodpandaTotal = dashboardDetails.foodpandaTotal
      ? dashboardDetails.foodpandaTotal
      : 0;
    const foodpandaOrders = dashboardDetails.foodpandaOrders
      ? dashboardDetails.foodpandaOrders
      : 0;

    const hungerstationTotal = dashboardDetails.hungerstationTotal
      ? dashboardDetails.hungerstationTotal
      : 0;
    const hungerstationOrders = dashboardDetails.hungerstationOrders
      ? dashboardDetails.hungerstationOrders
      : 0;

    const jahezTotal = dashboardDetails.jahezTotal
      ? dashboardDetails.jahezTotal
      : 0;
    const jahezOrders = dashboardDetails.jahezOrders
      ? dashboardDetails.jahezOrders
      : 0;

    const toyouTotal = dashboardDetails.toyouTotal
      ? dashboardDetails.toyouTotal
      : 0;
    const toyouOrders = dashboardDetails.toyouOrders
      ? dashboardDetails.toyouOrders
      : 0;

    const chefzTotal = dashboardDetails.chefzTotal
      ? dashboardDetails.chefzTotal
      : 0;
    const chefzOrders = dashboardDetails.chefzOrders
      ? dashboardDetails.chefzOrders
      : 0;

    const mrsoolTotal = dashboardDetails.mrsoolTotal
      ? dashboardDetails.mrsoolTotal
      : 0;
    const mrsoolOrders = dashboardDetails.mrsoolOrders
      ? dashboardDetails.mrsoolOrders
      : 0;

    const wasselTotal = dashboardDetails.wasselTotal
      ? dashboardDetails.wasselTotal
      : 0;
    const wasselOrders = dashboardDetails.wasselOrders
      ? dashboardDetails.wasselOrders
      : 0;

    const walemTotal = dashboardDetails.walemTotal
      ? dashboardDetails.walemTotal
      : 0;
    const walemOrders = dashboardDetails.walemOrders
      ? dashboardDetails.walemOrders
      : 0;

    const careemTotal = dashboardDetails.careemTotal
      ? dashboardDetails.careemTotal
      : 0;
    const careemOrders = dashboardDetails.careemOrders
      ? dashboardDetails.careemOrders
      : 0;

    const tmtTotal = dashboardDetails.tmtTotal ? dashboardDetails.tmtTotal : 0;
    const tmtOrders = dashboardDetails.tmtOrders
      ? dashboardDetails.tmtOrders
      : 0;

    const mathaqiTotal = dashboardDetails.mathaqiTotal
      ? dashboardDetails.mathaqiTotal
      : 0;
    const mathaqiOrders = dashboardDetails.mathaqiOrders
      ? dashboardDetails.mathaqiOrders
      : 0;

    const ezhalhaTotal = dashboardDetails.ezhalhaTotal
      ? dashboardDetails.ezhalhaTotal
      : 0;
    const ezhalhaOrders = dashboardDetails.ezhalhaOrders
      ? dashboardDetails.ezhalhaOrders
      : 0;

    const lugmetyTotal = dashboardDetails.lugmetyTotal
      ? dashboardDetails.lugmetyTotal
      : 0;
    const lugmetyOrders = dashboardDetails.lugmetyOrders
      ? dashboardDetails.lugmetyOrders
      : 0;

    const foodboyTotal = dashboardDetails.foodboyTotal
      ? dashboardDetails.foodboyTotal
      : 0;
    const foodboyOrders = dashboardDetails.foodboyOrders
      ? dashboardDetails.foodboyOrders
      : 0;

    const yummyTotal = dashboardDetails.yummyTotal
      ? dashboardDetails.yummyTotal
      : 0;
    const yummyOrders = dashboardDetails.yummyOrders
      ? dashboardDetails.yummyOrders
      : 0;

    const upsaleTotal = dashboardDetails.upsaleTotal
      ? dashboardDetails.upsaleTotal
      : 0;
    const upsaleOrders = dashboardDetails.upsaleOrders
      ? dashboardDetails.upsaleOrders
      : 0;

    const wizzyTotal = dashboardDetails.wizzyTotal
      ? dashboardDetails.wizzyTotal
      : 0;
    const wizzyOrders = dashboardDetails.wizzyOrders
      ? dashboardDetails.wizzyOrders
      : 0;

    const snoonuTotal = dashboardDetails.snoonuTotal
      ? dashboardDetails.snoonuTotal
      : 0;
    const snoonuOrders = dashboardDetails.snoonuOrders
      ? dashboardDetails.snoonuOrders
      : 0;

    const raffeqTotal = dashboardDetails.raffeqTotal
      ? dashboardDetails.raffeqTotal
      : 0;
    const raffeqOrders = dashboardDetails.raffeqOrders
      ? dashboardDetails.raffeqOrders
      : 0;

    const mrdTotal = dashboardDetails.mrdTotal ? dashboardDetails.mrdTotal : 0;
    const mrdOrders = dashboardDetails.mrdOrders
      ? dashboardDetails.mrdOrders
      : 0;

    const accountsTotal = dashboardDetails.accountsTotal
      ? dashboardDetails.accountsTotal
      : 0;
    const accountsOrders = dashboardDetails.accountsOrders
      ? dashboardDetails.accountsOrders
      : 0;

    const whakaaroTotal = dashboardDetails.whakaaroTotal
      ? dashboardDetails.whakaaroTotal
      : 0;
    const whakaaroOrders = dashboardDetails.whakaaroOrders
      ? dashboardDetails.whakaaroOrders
      : 0;

    const gatoesTotal = dashboardDetails.gatoesTotal
      ? dashboardDetails.gatoesTotal
      : 0;
    const gatoesOrders = dashboardDetails.gatoesOrders
      ? dashboardDetails.gatoesOrders
      : 0;

    const walaanTotal = dashboardDetails.walaanTotal
      ? dashboardDetails.walaanTotal
      : 0;
    const walaanOrders = dashboardDetails.walaanOrders
      ? dashboardDetails.walaanOrders
      : 0;

    const deliverypartnerTotal = dashboardDetails.deliverypartnerTotal
      ? dashboardDetails.deliverypartnerTotal
      : 0;
    const deliverypartnerOrders = dashboardDetails.deliverypartnerOrders
      ? dashboardDetails.deliverypartnerOrders
      : 0;
    const cancelledordersTotal = dashboardDetails.cancelledordersTotal
      ? dashboardDetails.cancelledordersTotal
      : 0;
    const cancelledordersCount = dashboardDetails.cancelledordersCount
      ? dashboardDetails.cancelledordersCount
      : 0;
    const freeordersTotal = dashboardDetails.freeordersTotal
      ? dashboardDetails.freeordersTotal
      : 0;
    const freeordersCount = dashboardDetails.freeordersCount
      ? dashboardDetails.freeordersCount
      : 0;
    const deletedordersTotal = dashboardDetails.deletedordersTotal
      ? dashboardDetails.deletedordersTotal
      : 0;
    const deletedordersCount = dashboardDetails.deletedordersCount
      ? dashboardDetails.deletedordersCount
      : 0;

    const olcancelledordersTotal = dashboardDetails.olcancelledordersTotal
      ? dashboardDetails.olcancelledordersTotal
      : 0;
    const olcancelledordersCount = dashboardDetails.olcancelledordersCount
      ? dashboardDetails.olcancelledordersCount
      : 0;
    const total_expense = dashboardDetails.total_expense
      ? dashboardDetails.total_expense
      : 0;
    const due_paymentCount = dashboardDetails.due_paymentCount
      ? dashboardDetails.due_paymentCount
      : 0;
    const due_payment = dashboardDetails.due_payment
      ? dashboardDetails.due_payment
      : 0;
    const totalCustomers = dashboardDetails.customers
      ? dashboardDetails.customers
      : 0;

    // digitalsaleslabelid
    const digitalonlineSales = dashboardDetails.digiSales || 0;
    const digitalonlineSalescount = dashboardDetails.digiSalescount
      ? dashboardDetails.digiSalescount
      : 0;
    const digitalcancelledordersTotal =
      dashboardDetails.digicancelledordersTotal
        ? dashboardDetails.digicancelledordersTotal
        : 0;
    const digitalolcancelledordersCount =
      dashboardDetails.digicancelledordersCount
        ? dashboardDetails.digicancelledordersCount
        : 0;
    const digitaltotalTax = dashboardDetails.digitotalTax
      ? dashboardDetails.digitotalTax
      : 0;
    const digitaltotalDiscount = dashboardDetails.digitotalDiscount
      ? dashboardDetails.digitotalDiscount
      : 0;

    let closing_balance =
      data?.total_todays_cash_amount[0]?.amount +
      data?.startenddayOpeningBalanace[0]?.opening_balance -
      data?.todays_cash_expense;
    if (!closing_balance) closing_balance = 0;
    $('#digitalsaleslabelid').html(
      `${currency} ${Number(digitalonlineSales).toFixed(
        ROUNDOFF_UPTO,
      )}(${digitalonlineSalescount})`,
    );
    $('#digitalcancelledordersTotallabelid').html(
      `${currency} ${Number(digitalcancelledordersTotal).toFixed(
        ROUNDOFF_UPTO,
      )} (${digitalolcancelledordersCount})`,
    );
    $('#digitaltotalTaxlabelid').html(
      `${currency} ${Number(digitaltotalTax).toFixed(ROUNDOFF_UPTO)}`,
    );
    $('#digitaltotalDiscountlabelid').html(
      `${currency} ${Number(digitaltotalDiscount).toFixed(ROUNDOFF_UPTO)}`,
    );

    if (data.payment_modes) {
      renderTodayspayments(paymentsTotal, data.payment_modes);
    }

    const totalSaledata = `${currency} ${Number(totalSales).toFixed(
      ROUNDOFF_UPTO,
    )} (${totalOrders})`;

    $('#todaysalesLabelid').html(
      `${currency}  ${Number(todaysTotal).toFixed(
        ROUNDOFF_UPTO,
      )} (${todaysOrders})`,
    );
    $('#totalsalesLabelid').attr('sale', totalSaledata).html(totalSaledata);

    $('#monthsalesLabelid').html(
      `${currency} ${Number(monthsTotal).toFixed(
        ROUNDOFF_UPTO,
      )} (${monthOrders})`,
    );

    $('#offlinesaleslabelid').html(
      `${currency} ${Number(offlineSales).toFixed(
        ROUNDOFF_UPTO,
      )}(${offlineSalescount})`,
    );
    $('#onlinesaleslabelid').html(
      `${currency} ${Number(onlineSales).toFixed(
        ROUNDOFF_UPTO,
      )}(${onlineSalescount})`,
    );
    $('#totalTaxlabelid').html(
      `${currency} ${Number(totalTax).toFixed(ROUNDOFF_UPTO)}`,
    );
    $('#totalTaxlabelid').html(
      `${currency} ${Number(totalTax).toFixed(ROUNDOFF_UPTO)}`,
    );
    $('#totalDiscountlabelid').html(
      `${currency} ${Number(totalDiscount).toFixed(ROUNDOFF_UPTO)}`,
    );
    $('#oltotalTaxlabelid').html(
      `${currency} ${Number(oltotalTax).toFixed(ROUNDOFF_UPTO)}`,
    );
    $('#oltotalDiscountlabelid').html(
      `${currency} ${Number(oltotalDiscount).toFixed(ROUNDOFF_UPTO)}`,
    );
    $('#dineintotallabelid').html(
      `${currency} ${Number(dineinTotal).toFixed(
        ROUNDOFF_UPTO,
      )} (${dineinOrders})`,
    );
    $('#quickbillTotallabelid').html(
      `${currency} ${Number(quickbillTotal).toFixed(
        ROUNDOFF_UPTO,
      )} (${quickbillOrders})`,
    );
    $('#homdedelTotallabelid').html(
      `${currency} ${Number(homdedelTotal).toFixed(
        ROUNDOFF_UPTO,
      )} (${homdedelOrders})`,
    );
    $('#takeawaytotalLabelid').html(
      `${currency} ${Number(takeawayTotal).toFixed(
        ROUNDOFF_UPTO,
      )} (${takeawayOrders})`,
    );
    $('#dashboardIplabelid').html(window.globalIPAddress);

    $('#cancelledordersTotallabelid').html(
      `${currency} ${Number(cancelledordersTotal).toFixed(
        ROUNDOFF_UPTO,
      )} (${cancelledordersCount})`,
    );
    $('#freeordersTotallabelid').html(
      `${currency} ${Number(freeordersTotal).toFixed(
        ROUNDOFF_UPTO,
      )} (${freeordersCount})`,
    );
    $('#deletedordersTotallabelid').html(
      `${currency} ${Number(deletedordersTotal).toFixed(
        ROUNDOFF_UPTO,
      )} (${deletedordersCount})`,
    );
    $('#olcancelledordersTotallabelid').html(
      `${currency} ${Number(olcancelledordersTotal).toFixed(
        ROUNDOFF_UPTO,
      )} (${olcancelledordersCount})`,
    );
    // $('#olfreeordersTotallabelid').html(`${currency} ${Number(olfreeordersTotal).toFixed(ROUNDOFF_UPTO)}`);
    // $('#oldeletedordersTotallabelid').html(`${currency} ${Number(oldeletedordersTotal).toFixed(ROUNDOFF_UPTO)}`);

    if (zomatoTotal) {
      $('#zomatoordersTotalContianerid').show();
      $('#zomatoordersTotallabelid').html(
        `${currency} ${Number(zomatoTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${zomatoOrders})`,
      );
    } else {
      $('#zomatoordersTotalContianerid').hide();
    }
    if (swiggyTotal) {
      $('#swiggyordersTotalContianerid').show();

      $('#swiggyordersTotallabelid').html(
        `${currency} ${Number(swiggyTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${swiggyOrders})`,
      );
    } else {
      $('#swiggyordersTotalContianerid').hide();
    }

    if (ondcTotal) {
      $('#ondcordersTotalContianerid').show();

      $('#ondcordersTotallabelid').html(
        `${currency} ${Number(ondcTotal).toFixed(ROUNDOFF_UPTO)} (${ondcOrders})`,
      );
    } else {
      $('#ondcordersTotalContianerid').hide();
    }

    if (dunzoTotal) {
      $('#dunzoordersTotalContianerid').show();

      $('#dunzoordersTotallabelid').html(
        `${currency} ${Number(dunzoTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${dunzoOrders})`,
      );
    } else {
      $('#dunzoordersTotalContianerid').hide();
    }

    if (ubereatsTotal) {
      $('#ubereatsordersTotalContianerid').show();

      $('#uberordersTotallabelid').html(
        `${currency} ${Number(ubereatsTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${ubereatsOrders})`,
      );
    } else {
      $('#ubereatsordersTotalContianerid').hide();
    }

    if (dineoutTotal) {
      $('#dineoutsordersTotalContianerid').show();
      $('#dineoutsordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/dineout.png',
      );
      $('#dineoutordersTotallabelid').html(
        `${currency} ${Number(dineoutTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${dineoutOrders})`,
      );
    } else {
      $('#dineoutsordersTotalContianerid').hide();
    }

    if (googlepayTotal) {
      $('#googlepaysordersTotalContianerid').show();
      $('#googlepaysordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/Google pay.png',
      );
      $('#googlepayordersTotallabelid').html(
        `${currency} ${Number(googlepayTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${googlepayOrders})`,
      );
    } else {
      $('#googlepaysordersTotalContianerid').hide();
    }

    if (gupshupTotal) {
      $('#gupshupordersTotalContianerid').show();
      $('#gupshupordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/gupshup.png',
      );
      $('#gupshupordersTotallabelid').html(
        `${currency} ${Number(gupshupTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${gupshupOrders})`,
      );
    } else {
      $('#gupshupordersTotalContianerid').hide();
    }

    if (peppoTotal) {
      $('#peppoordersTotalContianerid').show();
      $('#peppoordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/peppo.png',
      );
      $('#peppoordersTotallabelid').html(
        `${currency} ${Number(peppoTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${peppoOrders})`,
      );
    } else {
      $('#peppoordersTotalContianerid').hide();
    }

    if (amazonfoodTotal) {
      $('#amazonfoodordersTotalContianerid').show();
      $('#amazonfoodordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/amazon food.png',
      );
      $('#amazonfoodordersTotallabelid').html(
        `${currency} ${Number(amazonfoodTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${amazonfoodOrders})`,
      );
    } else {
      $('#amazonfoodordersTotalContianerid').hide();
    }

    if (dotpeTotal) {
      $('#DotpesordersTotalContianerid').show();
      $('#DotpesordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/dotpe.png',
      );
      $('#DotpeordersTotallabelid').html(
        `${currency} ${Number(dotpeTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${dotpeOrders})`,
      );
    } else {
      $('#DotpesordersTotalContianerid').hide();
    }

    if (eazydinerTotal) {
      $('#eazydinerordersTotalContianerid').show();
      $('#eazydinerordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/easydiner.png',
      );
      $('#eazydinerordersTotallabelid').html(
        `${currency} ${Number(eazydinerTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${eazydinerOrders})`,
      );
    } else {
      $('#eazydinerordersTotalContianerid').hide();
    }

    if (dukaanTotal) {
      $('#dukaanordersTotalContianerid').show();
      $('#dukaanordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/dukaan.png',
      );
      $('#dukaanordersTotallabelid').html(
        `${currency} ${Number(dukaanTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${dukaanOrders})`,
      );
    } else {
      $('#dukaanordersTotalContianerid').hide();
    }

    if (jungleworksTotal) {
      $('#jungleworksordersTotalContianerid').show();
      $('#jungleworksordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/jungleworks.png',
      );
      $('#jungleworksordersTotallabelid').html(
        `${currency} ${Number(jungleworksTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${jungleworksOrders})`,
      );
    } else {
      $('#jungleworksordersTotalContianerid').hide();
    }

    if (yumzyTotal) {
      $('#YUMZYordersTotalContianerid').show();
      $('#YUMZYordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/yumzy.png',
      );
      $('#YUMZYordersTotallabelid').html(
        `${currency} ${Number(yumzyTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${yumzyOrders})`,
      );
    } else {
      $('#YUMZYordersTotalContianerid').hide();
    }

    if (magicpinTotal) {
      $('#magicpinordersTotalContianerid').show();
      $('#magicpinordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/magicpin.png',
      );
      $('#magicpinordersTotallabelid').html(
        `${currency} ${Number(magicpinTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${magicpinOrders})`,
      );
    } else {
      $('#magicpinordersTotalContianerid').hide();
    }

    if (thriveTotal) {
      $('#THRIVEordersTotalContianerid').show();
      $('#THRIVEordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/thrive.png',
      );
      $('#THRIVEordersTotallabelid').html(
        `${currency} ${Number(thriveTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${thriveOrders})`,
      );
    } else {
      $('#THRIVEordersTotalContianerid').hide();
    }

    if (radyesTotal) {
      $('#RADYESordersTotalContianerid').show();
      $('#RADYESordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/radyes.png',
      );
      $('#dineoutordersTotallabelid').html(
        `${currency} ${Number(radyesTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${radyesOrders})`,
      );
    } else {
      $('#RADYESordersTotalContianerid').hide();
    }

    if (talabatTotal) {
      $('#talabatordersTotalContianerid').show();
      $('#talabatordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/talabat.png',
      );
      $('#talabatordersTotallabelid').html(
        `${currency} ${Number(talabatTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${talabatOrders})`,
      );
    } else {
      $('#talabatordersTotalContianerid').hide();
    }

    if (radyesTotal) {
      $('#RADYESordersTotalContianerid').show();
      $('#RADYESordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/radyes.png',
      );
      $('#dineoutordersTotallabelid').html(
        `${currency} ${Number(radyesTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${radyesOrders})`,
      );
    } else {
      $('#RADYESordersTotalContianerid').hide();
    }

    if (mymenuTotal) {
      $('#MYMENUTotalContianerid').show();
      $('#MYMENUTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/mymenu.png',
      );
      $('#MYMENUTotallabelid').html(
        `${currency} ${Number(mymenuTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${mymenuOrders})`,
      );
    } else {
      $('#MYMENUTotalContianerid').hide();
    }

    if (deliverectTotal) {
      $('#deliverectordersTotalContianerid').show();
      $('#deliverectordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/deliverect.png',
      );
      $('#dineoutordersTotallabelid').html(
        `${currency} ${Number(deliverectTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${deliverectOrders})`,
      );
    } else {
      $('#deliverectordersTotalContianerid').hide();
    }

    if (hungerstationTotal) {
      $('#HungerStationordersTotalContianerid').show();
      $('#HungerStationordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/hungerstation.png',
      );
      $('#HungerStationordersTotallabelid').html(
        `${currency} ${Number(hungerstationTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${hungerstationOrders})`,
      );
    } else {
      $('#HungerStationordersTotalContianerid').hide();
    }

    if (jahezTotal) {
      $('#JahezordersTotalContianerid').show();
      $('#JahezordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/jahez.png',
      );
      $('#JahezordersTotallabelid').html(
        `${currency} ${Number(jahezTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${jahezOrders})`,
      );
    } else {
      $('#JahezordersTotalContianerid').hide();
    }

    if (foodpandaTotal) {
      $('#FoodPandaordersTotalContianerid').show();
      $('#FoodPandaordersTotalContianerid img').attr(
        'src',
        'https://cdn.tmbill.com/backoffice/dashboard/foodpanda.png',
      );
      $('#FoodPandaordersTotallabelid').html(
        `${currency} ${Number(foodpandaTotal).toFixed(
          ROUNDOFF_UPTO,
        )} (${foodpandaOrders})`,
      );
    } else {
      $('#FoodPandaordersTotalContianerid').hide();
    }

    $('#expensesTotallabelid').html(
      `${currency} ${Number(total_expense).toFixed(ROUNDOFF_UPTO)}`,
    );
    $('#customersTotallabelid').html(`${Number(totalCustomers)}`);
    $('#duepayTotallabelid').html(
      `${currency} ${Number(duePaymentsRecived).toFixed(ROUNDOFF_UPTO)} `,
    );

    $('#duepayReceivableTotallabelid').html(
      `${currency} ${Number(duePaymentsReceivable).toFixed(ROUNDOFF_UPTO)} `,
    );

    $('#walletCreditedTotallabelid').html(
      `${currency} ${Number(walletCredited).toFixed(ROUNDOFF_UPTO)} `,
    );

    $('#walletDebitedTotallabelid').html(
      `${currency} ${Number(walletDebited).toFixed(ROUNDOFF_UPTO)} `,
    );
    $('#averagesalesperplabelid').html(
      `${currency} ${Number(avgsalesPerperson).toFixed(ROUNDOFF_UPTO)}`,
    );
    $('#todaysClosingBalancelabelid').html(
      `${currency} ${Number(closing_balance).toFixed(ROUNDOFF_UPTO)}`,
    );

    // Digital Orders

    const { weekdays } = data;
    setVerticlebarsdata(weeksTotal, weekdays);
    const { saleschartdata } = data;
    const { getSalesby } = data;
    rendersalesChart(getSalesby, saleschartdata);
    const { topItems } = data;
    renderTopitemschart(topItems);

    setDashboardsalespermission();
  }
}

async function renderTodayspayments(paymentsTotal, payment_modes) {
  $('#dashboardPaymentListid').empty();
  if (
    paymentsTotal &&
    payment_modes &&
    Array.isArray(payment_modes) &&
    payment_modes.length > 0
  ) {
    for (const payment of payment_modes) {
      const payItem = $('<li>');

      const title = $('<label>', {
        class: 'pay-list-item-title',
        html: payment.payment_option,
      });
      const amount = $('<label>', {
        class: 'pay-list-item-value',
        html: `${currency} ${payment.amount.toFixed(ROUNDOFF_UPTO)}`,
      });

      let percentage = (Number(payment.amount) / Number(paymentsTotal)) * 100;
      percentage = Number(percentage).toFixed(ROUNDOFF_UPTO);

      const progressWrapper = $('<div>', {
        class: 'progress-bar-wrapper',
        title: `${percentage}%`,
      });
      const progressBar = $('<div>', {
        class: 'progress-bar',
        html: '&nbsp',
      }).css({
        width: `${percentage}%`,
      });

      progressWrapper.append(progressBar);
      payItem.append(title);
      payItem.append(progressWrapper);
      payItem.append(amount);
      $('#dashboardPaymentListid').append(payItem);
    }
  }
}

async function setVerticlebarsdata(weeksTotal, params) {
  for (const day of DAYS_OF_WEEK) {
    const dayofWeek = _.find(params, { day });
    if (dayofWeek) {
      const { amount } = dayofWeek;
      let dayPercent = (Number(amount) / Number(weeksTotal)) * 100;
      dayPercent = Number(Number(dayPercent).toFixed(ROUNDOFF_UPTO));
      const blankPercent = 100 - dayPercent;
      $(`#${day}blankbarId`)
        .attr('title', `${day}-${currency} ${amount}`)
        .css({ height: `${blankPercent}%` });
      $(`#${day}barId`)
        .show()
        .attr('title', `${day}-${currency} ${amount}`)
        .css({ height: `${dayPercent}%` });
    } else {
      $(`#${day}blankbarId`)
        .attr('title', `${day}-${currency} 0`)
        .css({ height: `100%` });
      $(`#${day}barId`)
        .attr('title', `${currency} 0`)
        .css({ height: `0%` })
        .hide();
    }
  }
}

async function rendersalesChart(getSalesby, saleschartdata) {
  if (saleslineChart) saleslineChart.destroy();
  if (salesBarchart) salesBarchart.destroy();

  if (
    saleschartdata &&
    Array.isArray(saleschartdata) &&
    saleschartdata.length > 0
  ) {
    const labels = [];
    const data = [];
    for (const salesData of saleschartdata) {
      switch (getSalesby) {
        case 'month':
          labels.push(moment(salesData.month).format('MMMM'));
          break;
        case 'year':
          labels.push(moment(salesData.year).format('YYYY'));
          break;
        default:
          labels.push(moment(salesData.day).format('DD MMMM'));
          break;
      }
      data.push(salesData.amount);
    }

    const ctx = document.getElementById('allsalesLinechartid').getContext('2d');
    const ctx2 = document.getElementById('allsalesBarchartid').getContext('2d');
    const color = materialColor();
    saleslineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Sales', // Name the series
            borderColor: color, // '#2196f3', // Add custom color border (Line)
            backgroundColor: color,
            data,
            fill: false,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true, // Instruct chart js to respond nicely.
        maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height
      },
    });
    const color2 = materialColor();
    salesBarchart = new Chart(ctx2, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Sales', // Name the series
            borderColor: color2, // '#2196f3', // Add custom color border (Line)
            backgroundColor: color2,
            data,
            fill: false,
            // fillOpacity: .3,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true, // Instruct chart js to respond nicely.
        maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height
      },
    });
  }
}

async function renderTopitemschart(topItems) {
  if (topItemspiechart) topItemspiechart.destroy();
  $('#js-legend').html('');
  if (topItems && Array.isArray(topItems) && topItems.length > 0) {
    const labels = [];
    const backgroundColor = [];
    const data = [];

    for (const item of topItems) {
      labels.push(item.title);
      data.push(item.qty);
      backgroundColor.push(materialColor());
    }
    const ctx = document.getElementById('topitemspieChartid').getContext('2d');
    try {
      topItemspiechart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              backgroundColor,
              data,
            },
          ],
        },
        options: {
          rotation: 270,
          circumference: 180,
          plugins: {
            htmlLegend: {
              // ID of the container to put the legend in
              containerID: 'js-legend',
            },
            legend: {
              display: false,
            },
          },
        },
        plugins: [htmlLegendPlugin],
      });
      // document.getElementById('js-legend').innerHTML = topItemspiechart.generateLegend();
    } catch (error) {
      console.log(error);
    }
  }
}
function refreshData(isforceRefresh) {
  if (isforceRefresh) window.refreshDashboard = true;

  if (window.refreshDashboard) getDashboarddata();
  window.refreshDashboard = false;
}

window.refreshDashboardifneeded = refreshData;

const getOrCreateLegendList = (chart, id) => {
  const legendContainer = document.getElementById(id);
  let listContainer = legendContainer.querySelector('ul');

  if (!listContainer) {
    listContainer = document.createElement('ul');
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'row';
    listContainer.style.margin = 0;
    listContainer.style.padding = 0;

    legendContainer.appendChild(listContainer);
  }

  return listContainer;
};

const htmlLegendPlugin = {
  id: 'htmlLegend',
  afterUpdate(chart, args, options) {
    const ul = getOrCreateLegendList(chart, options.containerID);
    // Remove old legend items
    while (ul.firstChild) {
      ul.firstChild.remove();
    }
    // Reuse the built-in legendItems generator
    const items = chart.options.plugins.legend.labels.generateLabels(chart);
    items.forEach((item) => {
      const li = document.createElement('li');
      li.style.alignItems = 'center';
      li.style.cursor = 'pointer';
      li.style.display = 'flex';
      li.style.flexDirection = 'row';
      li.style.marginLeft = '10px';

      li.onclick = () => {
        const { type } = chart.config;
        if (type === 'pie' || type === 'doughnut') {
          // Pie and doughnut charts only have a single dataset and visibility is per item
          chart.toggleDataVisibility(item.index);
        } else {
          chart.setDatasetVisibility(
            item.datasetIndex,
            !chart.isDatasetVisible(item.datasetIndex),
          );
        }
        chart.update();
      };

      // Color box
      const boxSpan = document.createElement('span');
      boxSpan.style.background = item.fillStyle;
      boxSpan.style.borderColor = item.strokeStyle;
      boxSpan.style.borderWidth = `${item.lineWidth}px`;
      boxSpan.style.display = 'inline-block';
      boxSpan.style.height = '20px';
      boxSpan.style.marginRight = '10px';
      boxSpan.style.width = '20px';

      // Text
      const textContainer = document.createElement('p');
      textContainer.style.color = item.fontColor;
      textContainer.style.margin = 0;
      textContainer.style.padding = 0;
      textContainer.style.textDecoration = item.hidden ? 'line-through' : '';

      const text = document.createTextNode(item.text);
      textContainer.appendChild(text);

      li.appendChild(boxSpan);
      li.appendChild(textContainer);
      ul.appendChild(li);
    });
  },
};

async function getTopitemsbydate(params) {
  let limit = 5;
  if ($('#itemslimitfieldId').val()) {
    try {
      limit = Number($('#itemslimitfieldId').val());
      if (isNaN(limit) || $('#itemslimitfieldId').val().length > 10) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:dashboardController.invalidLimit'),
        );
        return;
      }
    } catch (error) {
      limit = 5;
      $('#itemslimitfieldId').val('');
    }
  }
  params.limit = limit;
  params.filterbyAmount = false;
  const topItems = await window.betteripcRenderer.callMain(
    DASHBOARD_IPC.GET_TOP_ITEMS,
    params,
  );
  renderTopitemschart(topItems);
}

async function getSaleschartdata(params) {
  let selection = $('#saleschartOptionsid option:selected:not([disabled])');
  if (selection.length > 0) {
    selection = params.getSalesby = $(selection).val();
  }
  const saleschartdata = await betteripcRenderer.callMain(
    DASHBOARD_IPC.GET_SALES_DATA,
    params,
  );

  rendersalesChart(selection, saleschartdata);
}

function initialize() {
  $('#refreshDashboard').on('click', getDashboarddata);
  if (
    window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1] != undefined
  ) {
    countMidnightSale =
      window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1].value ===
      '1';
  }
  if (countMidnightSale) {
    $('#itemsdaterangeId,#salesdaterangeId').daterangepicker({
      timePicker: false,
      endDate: window.moment(),
      startDate: window.moment().subtract(30, 'days'),
      locale: {
        format: 'DD MMM YYYY',
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
    $('#itemsdaterangeId,#salesdaterangeId').daterangepicker({
      timePicker: false,
      endDate: window.moment(),
      startDate: window.moment().subtract(30, 'days'),
      locale: {
        format: 'DD MMM YYYY',
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

  $('#dashboarddateFilterid').daterangepicker({
    timePicker: true,
    endDate: window.moment(),
    startDate: window.moment().subtract(30, 'days'),
    drops: 'up',
    parentEl: '#dashboardparentDivid',
    orientation: 'auto',
    locale: {
      format: 'DD MMM YYYY hh:mm A',
      // format: 'YYYY/MM/DD hh:mm A'
    },
  });

  if (window.settingsConfig && window.settingsConfig.length > 0) {
    fetchReportAsPerCloseDay =
      window.settingsConfig[FETCH_REPORT_AS_PER_CLOSE_DAY - 1].value === '1';
  }
  $('#dashboarddateFilterid').on('apply.daterangepicker', (ev, picker) => {
    getDashboarddatabydate();
  });

  $('#itemsdaterangeId').on('apply.daterangepicker', (ev, picker) => {
    fetchitemsData();
  });

  $('#salesdaterangeId').on('apply.daterangepicker', (ev, picker) => {
    fetchsalesData();
  });

  $('#fetchsalesdataButton').on('click', fetchsalesData);
  $('#fetchtopitemsButton').on('click', fetchitemsData);

  $('#totalsalesLabelid').on('click', () => {
    const currentData = $('#totalsalesLabelid').html();
    if (String(currentData).includes('***')) {
      $('#totalsalesLabelid').html($('#totalsalesLabelid').attr('sale'));
      setTimeout(() => {
        $('#totalsalesLabelid').html('***');
      }, 5000);
    }
  });

  getDashboarddata();
  initAccesslevelsfordashboard();

  if ($.i18n) {
    initializei18nforDashboardwindowui();
  } else {
    setTimeout(initializei18nforDashboardwindowui, 400);
  }
}

function fetchitemsData() {
  let fromDate = $('#itemsdaterangeId')
    .data('daterangepicker')
    .startDate.format('x');
  let toDate = $('#itemsdaterangeId')
    .data('daterangepicker')
    .endDate.format('x');
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
  getTopitemsbydate({
    user_id: window.storeDetails.username,
    store_id: window.storeDetails.store_id,
    fromDate,
    toDate,
  });
}

function fetchsalesData() {
  let fromDate = $('#salesdaterangeId')
    .data('daterangepicker')
    .startDate.format('x');
  let toDate = $('#salesdaterangeId')
    .data('daterangepicker')
    .endDate.format('x');
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
  getSaleschartdata({
    getSalesby: 'default',
    toDate,
    fromDate,
    user_id: window.storeDetails.username,
    store_id: window.storeDetails.store_id,
  });
}

initialize();

module.exports = {
  refreshData,
};
