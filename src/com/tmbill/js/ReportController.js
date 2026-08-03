/* eslint-disable camelcase */
const groupBy = require('lodash/groupBy');
const {
  SHOW_SOLDITEMS_IN_REPORT,
  PRINTERS,
  PRINTER_58_CONFIG,
  PRINTER_80_CONFIG,
  SHOW_BILLHISTORY_ONREPORT,
  SHOW_PAYMENTS_ONREPORT,
  SHOW_SUMMARYSTATS_ONREPORT,
  SHOW_CATEGORYWISE_ITEM_REPORT,
  SHOW_ORDER_TYPE_SUMMARY_REPORT,
  SHOW_EXPENSE_REPORT,
  SHOW_WAITER_SUMMARY_REPORT,
  SHOW_DELIVERYBOY_SUMMARY_REPORT,
  SHOW_ALTERNATE_TITLE_ON_REPORT_PRINT,
  SHOW_DISCOUNT_SUMMARY_REPORT,
  SHOW_DEU_PAYEMENT_SUMMARY_REPORT,
  SHOW_WALLET_SUMMARY_REPORT,
  SHOW_DUE_PAYMENTS_RECEIVABLE_SUMMARY,
  SHOW_CASH_DENOMINATION_SUMMARY,
  SHOW_PAYMENT_VARIANCE_SUMMARY,
  SHOW_KDWISE_SUMMARY_REPORT,
  COUNT_SELL_EXEMPTED_TOTAL,
  SHOW_LIQUOR_SALE_EXEMPT_ON_REPORT_PRINT,
} = require('../util/SettingIDs');
const { PRINTER_SIZES_REFID } = require('../util/PrintersUtil');
const { PRINTERS_IPC } = require('../util/IPC_Messages');
const {
  OrderState,
  BillingTypes,
  ARABIC_PAYMENT_MODES,
  ARABIC_BIILING_TYPES_BYID,
} = require('../util/DBUtil');

window.reportsscriptLoaded = true;
const { initalizei18nforreportWindow } = require('./i18nController');
const { safeParse } = require('../util/RendererUtils');

let showBills = true;
let showPayments = true;
let showSolditems = true;
const showExpenses = true;
let showSummarystats = true;
let showOrderTypeSummaryReport = true;
let showWaiterSummaryReport = false;
let showDeliveryboySummaryReport = false;
let showDuePaymentSummaryReport = false;
let showDuePaymentReceivableSummaryReport = false;
let showDiscountSummaryReport = false;
let showWalletSummaryReport = false;
let showKDWiseSummaryReport = false;
let showExpenseReport = true;
let currency = 'Rs. ';
let showAlternatetitleforreports = false;
let showCurrencyDenomination = true;
let showPaymentVarianceSummary = false;
let countSellExemptedTotal = false;
let showLiquorSaleExemptReport = false;

/**
 * Initialize
 */
function Initialize() {
  // generateReportview();
  if ($.i18n) {
    initalizei18nforreportWindow();
  } else {
    setTimeout(initalizei18nforreportWindow, 400);
  }
}

/**
 * Generates the report view
 */
async function generateReportview() {
  const pageConfig = await setPageconfigifany();
  console.log(`Message="generate report view"`);

  // Set the pageConfig if provided
  if (pageConfig) {
    const rawmargins = String(pageConfig.margins).split(' ');
    $('#reportviewContainerid').css({
      'margin-left': rawmargins[0],
      width: rawmargins[1],
    });
  }

  $('#reporthotelnameID').html('Demo');
  const details = $('#reportprintBodyid').data('data');
  currency = 'Rs. ';

  $('#reporttitleLabelID').text(details.report_type);

  if (details.reportsubTitle) {
    $('#reportsubtitleLabelID').show();
    $('#reportsubtitleLabelID').text(`( For: ${details.reportsubTitle} )`);
  } else {
    $('#reportsubtitleLabelID').hide();
  }
  $('#billsTable').find('tr:not(:first)').remove();
  $('#reportpayTable').find('tr:not(:first)').remove();
  $('#expensesTable').find('tr:not(:first)').remove();
  $('#solditemsTable').find('tr:not(:first)').remove();
  $('#cancelleditemsTable').find('tr:not(:first)').remove();
  $('#orderreportTable').find('tr:not(:first)').remove();
  $('#catwisereportTable').find('tr:not(:first)').remove();
  $('#kdwisereportTable').find('tr:not(:first)').remove();
  $('#couponhistoryreportTable').find('tr:not(:first)').remove();
  $('#duepaymentreportTable').find('tr:not(:first)').remove();
  $('#discounteditemsreportTable').find('tr:not(:first)').remove();
  $('#billprintreportTable').find('tr:not(:first)').remove();
  $('#taxprintreportTable').find('tr:not(:first)').remove();
  $('#orderSettlementdeliveryreportTable').find('tr:not(:first)').remove();
  $('.taxAdded').remove();
  $('#logo').find(':not(:first)').remove();
  $('#appliedchargesreportTable,#preorderprintreportTableid')
    .find('tr:not(:first)')
    .remove();
  $('#reportoredrSummaryTable').find('tr:not(:first)').remove();
  $('#reportwaiterSummaryTable').find('tr:not(:first)').remove();
  $('#reportdeliveryboySummaryTable').find('tr:not(:first)').remove();
  $('#reportdiscountSummaryTable').find('tr:not(:first)').remove();
  $('#walletSummaryTable').find('tr:not(:first)').remove();
  $('#kdwiseItemsSummaryTable').find('tr:not(:first)').remove();
  $('#expensereportTable').find('tr:not(:first)').remove();
  $('#closingCurrencyDenominationTable').find('tr:not(:first)').remove();
  $('#closingDayShiftTransactionsTable').find('tr:not(:first)').remove();

  const currentdate = new Date();
  // $("#reportdatelabelID").html(formatDate(currentdate, false));
  if (details && details.data && details.data.isMidnightSale) {
    $('#reportdatelabelID').html(
      `Printed Report on: ${moment(currentdate)
        .subtract(1, 'days')
        .format('DD/MM/YYYY HH:mm:ss')}`,
    );
  } else {
    $('#reportdatelabelID').html(
      `Printed Report on: ${moment(currentdate).format('DD/MM/YYYY HH:mm:ss')}`,
    );
  }

  if (window.storeDetails.user_line_1) {
    $('#reportOutletLocationlabelID').html(window.storeDetails.user_line_1);
  }

  if (details && details.data) {
    if (window.storeDetails) {
      if (window.storeDetails.store_name) {
        $('#reporthotelnameID').html(window.storeDetails.store_name);
      }
      if (window.storeDetails.currency) {
        currency = `${window.storeDetails.currency} `;
      }
    }

    const billsList = details.data.bills;
    const paymentsList = details.data.payments;
    let grandTotal = 0;
    let totalTax = 0;
    let totalChargestax = 0;
    let cancelledOrdertotalChargestax = 0;
    let totalCharges = 0;
    let sellExemptedTotalCharges = 0;
    let cancelledOrderTotalCharges = 0;
    let totalDiscount = 0;
    let fulfilledordersTotal = 0;
    let sellExemptedTotal = 0;
    let liquorSaleTotal = 0;
    let freeordersTotal = 0;
    let cancelledordersTotal = 0;
    let pendingordersTotal = 0;
    let deletedordersTotal = 0;
    const cashinhandTotal = 0;
    let duepaymentTotal = 0;
    // tax summary
    let salesIncludedTax = 0;
    let salesExcludedTax = 0;
    let totalVat = 0;
    let totalOrders = 0;
    let duePaymentsReceived = 0;
    let duePaymentsReceivable = 0;
    let paymentMadeUsingWallet = 0;
    let paymentRecivedThroughWallet = 0;
    const paymentsData = details.data.paymentData;
    let net_sale = 0;
    let totalTip = 0;
    const { orderTypeWiseOrders } = details.data;
    const waiterSummaryReport = details.data.waiterSummary;
    const deliveryboySummaryReport = details.data.deliveryboySummary;
    const duePaymentSummaryReport = details.data.duePaymentSummary;
    const duePaymentReceivableSummaryReport =
      details.data.duePaymentReceivableSummary;
    const discountSummaryReport = details.data.discountSummary;
    const walletSummaryReport = details.data.walletSummary;
    const kdWiseItemSummary = details.data.kdWiseItemSummary;
    // KD summary visibility BASED ON DATA (NOT SETTINGS ONLY)
    if (details.data && details.data.kdWiseItemSummary) {
      showKDWiseSummaryReport = true;
    }

    const invoice_range = details.data.invoice_range;
    const totalBills = details.data.totalBills;
    const orderSettlementDeliveryBoySummary =
      details.data.orderSettlementDeliveryBoySummary;
    const { expenses_list } = details.data;
    let closing_currency_denomination = [];
    let dayShift_end_transactions = [];
    const showPaymentsForceFully = details.data.showPaymentsForceFully;
    if (
      details &&
      details.data &&
      // details.data.shiftData &&
      details.data.closing_currency_denomination &&
      details.data.closing_currency_denomination.cash_denominations
    ) {
      closing_currency_denomination =
        details.data.closing_currency_denomination.cash_denominations;
    }

    if (
      details &&
      details.data &&
      // details.data.shiftData &&
      details.data.dayShift_end_transactions &&
      details.data.dayShift_end_transactions.paymentTransactions
    ) {
      dayShift_end_transactions =
        details.data.dayShift_end_transactions.paymentTransactions;
    }

    if (details.data.customDatetitle) {
      $('#reportdatelabelID2').show();
      $('#reportdatelabelID2').html(details.data.customDatetitle);
    } else {
      $('#reportdatelabelID2').hide();
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showSolditems =
        window.settingsConfig[SHOW_SOLDITEMS_IN_REPORT - 1].value == '1';
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showAlternatetitleforreports =
        window.settingsConfig[SHOW_ALTERNATE_TITLE_ON_REPORT_PRINT - 1].value ==
        '1';
    }

    // Check if show sold items is to be shown forcefully
    if (details.data && details.data.showSolditems) {
      showSolditems = true;
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showWaiterSummaryReport =
        window.settingsConfig[SHOW_WAITER_SUMMARY_REPORT - 1].value == '1';
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showDeliveryboySummaryReport =
        window.settingsConfig[SHOW_DELIVERYBOY_SUMMARY_REPORT - 1].value == '1';
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showDuePaymentSummaryReport =
        window.settingsConfig[SHOW_DEU_PAYEMENT_SUMMARY_REPORT - 1].value ==
        '1';
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showDuePaymentReceivableSummaryReport =
        window.settingsConfig[SHOW_DUE_PAYMENTS_RECEIVABLE_SUMMARY - 1].value ==
        '1';
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showDiscountSummaryReport =
        window.settingsConfig[SHOW_DISCOUNT_SUMMARY_REPORT - 1].value === '1';
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showWalletSummaryReport =
        window.settingsConfig[SHOW_WALLET_SUMMARY_REPORT - 1].value === '1';
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showKDWiseSummaryReport =
        window.settingsConfig[SHOW_KDWISE_SUMMARY_REPORT - 1].value === '1';
    }

    //KD
    showKDWiseSummaryReport =
      showKDWiseSummaryReport ||
      (kdWiseItemSummary && kdWiseItemSummary.length > 0);

    if (kdWiseItemSummary && kdWiseItemSummary.length > 0) {
      showKDWiseSummaryReport = true;
    }
    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showOrderTypeSummaryReport =
        window.settingsConfig[SHOW_ORDER_TYPE_SUMMARY_REPORT - 1].value == '1';
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showBills =
        window.settingsConfig[SHOW_BILLHISTORY_ONREPORT - 1].value == '1';
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showPayments =
        window.settingsConfig[SHOW_PAYMENTS_ONREPORT - 1].value == '1';
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showSummarystats =
        window.settingsConfig[SHOW_SUMMARYSTATS_ONREPORT - 1].value == '1';
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showExpenseReport =
        window.settingsConfig[SHOW_EXPENSE_REPORT - 1].value == '1';
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showLiquorSaleExemptReport =
        window.settingsConfig[SHOW_LIQUOR_SALE_EXEMPT_ON_REPORT_PRINT - 1]
          .value == '1';
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showCurrencyDenomination =
        window.settingsConfig[SHOW_CASH_DENOMINATION_SUMMARY - 1].value == '1';
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showPaymentVarianceSummary =
        window.settingsConfig[SHOW_PAYMENT_VARIANCE_SUMMARY - 1].value == '1';
    }

    if (window.settingsConfig && window.settingsConfig.length > 0) {
      countSellExemptedTotal =
        window.settingsConfig[COUNT_SELL_EXEMPTED_TOTAL - 1].value === '1';
    }

    if ((showBills || showSummarystats) && billsList && billsList.length > 0) {
      let totalRoundedAmt = 0;
      billsList.forEach((bill) => {
        if (bill.order_state === 'fulfilled') {
          // || bill.order_state === 'free'
          totalTax += Number(bill.order_level_total_taxes);
          totalChargestax += Number(bill.charges_level_total_tax);
          // totalCharges += Number(bill.order_level_total_charges_without_tax);

          if (
            countSellExemptedTotal &&
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
            ].includes(bill.billing_type)
          ) {
            sellExemptedTotalCharges += Number(
              bill.order_level_total_charges_without_tax,
            );
          }
          totalCharges += Number(bill.order_level_total_charges_without_tax);
          // else {
          //   totalCharges += Number(bill.order_level_total_charges_without_tax);
          // }

          if (bill.extra_details) {
            const extra_details = safeParse(bill.extra_details);
            if (extra_details && extra_details.sale_exempt_total) {
              liquorSaleTotal += extra_details.sale_exempt_total;
            }
          }
        }

        if (bill.order_state === 'cancelled') {
          cancelledOrdertotalChargestax += Number(bill.charges_level_total_tax);
          cancelledOrderTotalCharges += Number(
            bill.order_level_total_charges_without_tax,
          );
        }

        if (bill && bill.extra_details && bill.extra_details.total_tip) {
          totalTip += Number(bill.extra_details.total_tip);
        }

        grandTotal += Number(bill.order_total);
        if (bill.discount && bill.order_state === 'fulfilled') {
          totalDiscount += Number(bill.discount);
        }
        if (bill.extra_details && bill.order_state === 'fulfilled') {
          // let extra_details = JSON.parse(bill.extra_details)
          let { extra_details } = bill;
          if (extra_details.constructor === 'test'.constructor) {
            extra_details = JSON.parse(bill.extra_details);
          }
          if (extra_details.roundedAmount) {
            totalRoundedAmt += extra_details.roundedAmount;
          }
        }

        if (
          bill.hasDuepayment &&
          bill.due_payment > 0 &&
          bill.order_state !== 'cancelled'
        ) {
          duepaymentTotal += Number(bill.due_payment);
          if (String(bill.payment).toLowerCase() === 'cash') bill.payment = '-';
        }

        if (bill.order_state) {
          switch (bill.order_state) {
            case OrderState.FULFILLED:
              if (
                countSellExemptedTotal &&
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
                ].includes(bill.billing_type)
              ) {
                sellExemptedTotal += Number(bill.order_total);
              }
              fulfilledordersTotal += Number(bill.order_total);
              // else {
              //   fulfilledordersTotal += Number(bill.order_total);
              // }
              break;
            case OrderState.FREE:
              freeordersTotal += Number(bill.order_total);
              bill.payment = '-';
              break;
            case OrderState.CANCELLED:
              cancelledordersTotal += Number(bill.order_total);
              break;
            case OrderState.PENDING:
              pendingordersTotal += Number(bill.order_total);
              break;
            case OrderState.DELETE:
              deletedordersTotal += Number(bill.order_total);
              break;
            default:
              break;
          }
        }

        if (showBills) addreportTablerow(bill);
      });

      net_sale =
        fulfilledordersTotal - (totalTax + totalChargestax) - totalRoundedAmt;

      if (duepaymentTotal > 0) {
        fulfilledordersTotal -= duepaymentTotal;
      }
      showBills ? $('#billsTable').show() : $('#billsTable').hide();
      showBills
        ? $('#billSummaryLableid').show()
        : $('#billSummaryLableid').hide();
      showSummarystats
        ? $('#billLabelscontainerid').show()
        : $('#billLabelscontainerid').hide();
      // if (showSummarystats) {
      //   // $('#reportnetsaleLabelID').text("Net Sale Amt: " + currency + Number(net_sale).toFixed(ROUNDOFF_UPTO));

      //   // $('#reportfulfillamountLabelID').text("Fulfilled Orders (Total/Gross Sale) Amount: " + currency + Number(fulfilledordersTotal).toFixed(ROUNDOFF_UPTO));
      //   // $('#reporttaxLabelID').text("Tax on (Total/Gross Sale): " + currency + Number(totalTax).toFixed(ROUNDOFF_UPTO));

      //   // $('#reportchargeslabelID').text("Total Charge: " + currency + Number(totalCharges).toFixed(ROUNDOFF_UPTO));
      //   // $('#reportchargestaxLabelID').text(`Tax on Charge: ${currency} ${Number(totalChargestax).toFixed(ROUNDOFF_UPTO)}`);

      //   // $('#reportdiscountLabelID').text("Total Discount: " + currency + Number(totalDiscount).toFixed(ROUNDOFF_UPTO));
      //   // $('#reportfreeamountLabelID').text("Free Orders Amount: " + currency + Number(freeordersTotal).toFixed(ROUNDOFF_UPTO));
      //   // $('#reportpendingamountLabelID').text("Pending Orders Amount: " + currency + Number(pendingordersTotal).toFixed(ROUNDOFF_UPTO));
      //   // $('#reportcancelamountLabelID').text("Cancelled Orders Amount: " + currency + Number(cancelledordersTotal).toFixed(ROUNDOFF_UPTO));
      //   // $('#reportdeleteamountLabelID').text("Deleted Orders Amount: " + currency + Number(deletedordersTotal).toFixed(ROUNDOFF_UPTO));

      //   // $('#reportcashinhandLabelID').text("Cash in hand (includes Online Payments): " + currency + Number(fulfilledordersTotal).toFixed(ROUNDOFF_UPTO));
      //   // $('#reportdueamountLabelID').text("Due Amount from Customer: " + currency + Number(duepaymentTotal).toFixed(ROUNDOFF_UPTO));

      //   $('#reportnetsaleLabelID').text(
      //     $.i18n.t('report.NetSaleAmt') +
      //       currency +
      //       Number(net_sale).toFixed(ROUNDOFF_UPTO),
      //   );

      //   $('#reportfulfillamountLabelID').text(
      //     `${$.i18n.t(
      //       'report.FullfilledOrdesAmount',
      //     )}:${currency}${Number(fulfilledordersTotal).toFixed(ROUNDOFF_UPTO)}`,
      //   );
      //   $('#reporttaxLabelID').text(
      //     `${$.i18n.t(
      //       'report.TaxonTotalGrossSale',
      //     )}:${currency}${Number(totalTax).toFixed(ROUNDOFF_UPTO)}`,
      //   );

      //   $('#reportchargeslabelID').text(
      //     `${$.i18n.t(
      //       'report.TotalCharges',
      //     )}:${currency}${Number(totalCharges).toFixed(ROUNDOFF_UPTO)}`,
      //   );
      //   $('#reportchargestaxLabelID').text(
      //     `${$.i18n.t('report.TaxonCharges')}:` +
      //       ` ${currency} ${Number(totalChargestax).toFixed(ROUNDOFF_UPTO)}`,
      //   );
      //   $('#reportCancelledOrderchargeslabelID').text(
      //     `${$.i18n.t(
      //       'report.CancelledOrderTotalCharges',
      //     )}:${currency}${Number(cancelledOrderTotalCharges).toFixed(ROUNDOFF_UPTO)}`,
      //   );

      //   $('#reportdiscountLabelID').text(
      //     `${$.i18n.t(
      //       'report.Totaldiscount',
      //     )}:${currency}${Number(totalDiscount).toFixed(ROUNDOFF_UPTO)}`,
      //   );
      //   $('#reportfreeamountLabelID').text(
      //     `${$.i18n.t(
      //       'report.FreeOrderAmount',
      //     )}:${currency}${Number(freeordersTotal).toFixed(ROUNDOFF_UPTO)}`,
      //   );
      //   $('#reportpendingamountLabelID').text(
      //     `${$.i18n.t(
      //       'report.PendingOrderamount',
      //     )}:${currency}${Number(pendingordersTotal).toFixed(ROUNDOFF_UPTO)}`,
      //   );
      //   $('#reportcancelamountLabelID').text(
      //     `${$.i18n.t(
      //       'report.CancelledOrderAmount',
      //     )}:${currency}${Number(cancelledordersTotal).toFixed(ROUNDOFF_UPTO)}`,
      //   );
      //   $('#reportdeleteamountLabelID').text(
      //     `${$.i18n.t(
      //       'report.DeletedOrderAmount',
      //     )}:${currency}${Number(deletedordersTotal).toFixed(ROUNDOFF_UPTO)}`,
      //   );

      //   // $('#reportcashinhandLabelID').text(
      //   //   $.i18n.t('report.Cashinhand') +
      //   //     ':' +
      //   //     currency +
      //   //     Number(fulfilledordersTotal).toFixed(ROUNDOFF_UPTO),
      //   // );
      //   $('#reportdueamountLabelID').text(
      //     `Total Due Payments Receivable:${currency}${Number(duepaymentTotal).toFixed(ROUNDOFF_UPTO)}`,
      //   );

      //   $('#reportduePaymentReceivedLabelID').text(
      //     `Total Due Payments Received:${currency}${duePaymentsReceived.toFixed(ROUNDOFF_UPTO)}`,
      //   );

      //   $('#reportPaymentMadeUsingWalletLabelID').text(
      //     `Total Payments Made Using Wallet(Debited):${currency}${Number(paymentMadeUsingWallet).toFixed(ROUNDOFF_UPTO)}`,
      //   );

      //   $('#reportpaymentRecivedThroughWallteLabelID').text(
      //     `Total Payments Received Through Wallet(Credited):${currency}${Number(paymentMadeUsingWallet).toFixed(ROUNDOFF_UPTO)}`,
      //   );
      // }
    } else {
      $('#billLabelscontainerid').hide();
      $('#billsTable').hide();
      $('#billSummaryLableid').hide();
    }

    if (details.data.hidesolditemsTitle) {
      $('#solditemsTitleid').hide();
    } else {
      $('#solditemsTitleid').show();
    }

    if (
      showSolditems &&
      details.data &&
      details.data.soldItems &&
      details.data.soldItems.length > 0
    ) {
      $('#solditemsWrapperid').show();
      let totalAmount = 0;
      let totalItems = 0;
      const soldItemslist = details.data.soldItems;
      soldItemslist.forEach((element) => {
        addSolditemtable_row(element);

        if (element.qty && element.qty !== '-')
          totalItems += Number(element.qty);

        if (element.total && element.total !== '-')
          totalAmount += Number(element.total);
      });
      const soldItemObj = {
        qty: totalItems,
        total: totalAmount,
        finalAmount: totalAmount,
        title: 'Total',
      };
      addSolditemtable_row(soldItemObj);
      if (window.hideAmountOnReport) {
        $('.itemReportAmountColumn').hide();
      }

      // $('#totalItemscountlabel').html(
      //   `${$.i18n.t('report.TotalItems')}:${Number(totalItems).toFixed(
      //     ROUNDOFF_UPTO,
      //   )}`,
      // );
      // $('#totalItemsamountlabel').html(
      //   `${$.i18n.t('report.TotalAmountofItems')}:${Number(totalAmount).toFixed(
      //     ROUNDOFF_UPTO,
      //   )}`,
      // );
    } else {
      $('#solditemsWrapperid').hide();
    }

    if (details.data.hasCancelledItemsTitle) {
      $('#cancelleditemsTitleid').hide();
    } else {
      $('#cancelleditemsTitleid').show();
    }
    // Check if cancelled or complementary report is provided
    if (details.data.cancelledItems && details.data.cancelledItems.length > 0) {
      $('#cancelleditemsWrapperid').show();
      let totalAmount = 0;
      let totalItems = 0;
      const { cancelledItems } = details.data;
      cancelledItems.forEach((element) => {
        addCancelleditemtable_row(element);

        if (element.qty && element.qty !== '-')
          totalItems += Number(element.qty);

        if (element.total && element.total !== '-')
          totalAmount += Number(element.total);
      });
      const totalObj = {
        title: 'Total',
        alternative_title: 'الاجمالي',
        qty: totalItems,
        total: totalAmount,
        reason: '',
        user_id: '',
        createdBy: '',
      };
      addCancelleditemtable_row(totalObj);
      if (window.hideAmountOnReport) {
        $('.itemReportAmountColumn').hide();
      }

      // $('#totalcancelItemscountlabel').html(
      //   `<span> Total</span> <span class="sales-summary-amount">
      //   (${Number(Number(totalItems).toFixed(window.ROUNDOFF_UPTO))})
      //   ${currency} ${Number(Number(totalAmount).toFixed(window.ROUNDOFF_UPTO))}</span>`,
      // );
      // $('#totalcancelItemscountlabel').html(
      //   `${$.i18n.t('report.TotalItems')}:${Number(
      //     Number(totalItems).toFixed(ROUNDOFF_UPTO),
      //   )}`,
      // );
      // $('#totalcancelItemsamountlabel').html(
      //   `${$.i18n.t('report.TotalAmountofItems')}:${Number(totalAmount).toFixed(
      //     ROUNDOFF_UPTO,
      //   )}`,
      // );
    } else {
      $('#cancelleditemsWrapperid').hide();
    }

    if (
      (showPayments || showPaymentsForceFully) &&
      paymentsList &&
      paymentsList.length > 0
    ) {
      // $('#billsTable').hide();
      // details.report_type == 'Todays Report' ||
      // details.report_type == "Today's Report" ||
      // details.report_type == 'Sales Report' ||
      // details.report_type == 'Start Close Shift report' ||
      // details.report_type == 'Start Close Day report' ||
      // details.report_type == 'User shift report' ||
      // details.report_type == 'Start Close day report'
      //   ? $('#billsTable').show()
      //   : $('#billsTable').hide();
      // $('#paymentWrapperid').show();
      if (details.report_type === 'Payment Report') {
        $('#billsTable').hide();
        $('#billSummaryLableid').hide();
      }
      let totalTransactions = 0;
      let totalpaymentAmount = 0;
      // fulfilledordersTotal = 0;
      let showorderstatewiseTotal = false;
      if (details.data.addStatuscolumn) {
        $('#paystatusColumnids').show();
        showorderstatewiseTotal = true;
      } else {
        $('#paystatusColumnids').hide();
      }

      let paymentTotal = 0;
      let paymentTrans = 0;
      paymentsList.forEach((payment) => {
        totalTransactions += payment.transactions;
        totalpaymentAmount += Number(payment.amount);
        if (showorderstatewiseTotal && payment.status) {
          switch (payment.status) {
            case OrderState.FULFILLED:
              // fulfilledordersTotal += Number(payment.amount);
              break;
            case OrderState.FREE:
              freeordersTotal += Number(payment.amount);
              break;
            case OrderState.CANCELLED:
              cancelledordersTotal += Number(payment.amount);
              break;
            case OrderState.PENDING:
              pendingordersTotal += Number(payment.amount);
              break;
            case OrderState.DELETE:
              deletedordersTotal += Number(payment.amount);
              break;
            default:
              break;
          }
        }
        paymentTotal += Number(payment.amount);
        paymentTrans += Number(payment.transactions);
        addPaymenttable_row(payment);
      });
      const paymentObj = {
        amount: Number(paymentTotal),
        transactions: paymentTrans,
        count: paymentTrans,
        payment_option: 'Total',
      };
      addPaymenttable_row(paymentObj);

      $('#paymentreportOverallinfolabel').html(
        `${$.i18n.t(
          'report.paymenttotal',
        )}--${totalTransactions}--${currency}${totalpaymentAmount.toFixed(window.ROUNDOFF_UPTO)}`,
      );

      if (showorderstatewiseTotal) {
        $('#billLabelscontainerid').show();
        $('#reporttaxLabelID').text(
          `${$.i18n.t(
            'report.TotalTax',
          )}:${currency}${Number(totalTax).toFixed(window.ROUNDOFF_UPTO)}`,
        );
        // $('#reportchargestaxLabelID').text("");
        $('#reportdiscountLabelID').text(
          `${$.i18n.t(
            'report.Totaldiscount',
          )}:${currency}${Number(totalDiscount).toFixed(window.ROUNDOFF_UPTO)}`,
        );
        $('#reportchargeslabelID').text(
          `${$.i18n.t(
            'report.TotalCharges',
          )}:${currency}${Number(totalCharges).toFixed(window.ROUNDOFF_UPTO)}`,
        );
        $('#reportfulfillamountLabelID').text(
          `${$.i18n.t(
            'report.FullfilledOrdesAmount',
          )}:${currency}${Number(fulfilledordersTotal).toFixed(window.ROUNDOFF_UPTO)}`,
        );
        $('#reportTotalTipCollectedLabelID').text(
          `${$.i18n.t(
            'report.TotalTipsCollected',
          )}:${currency}${Number(totalTip).toFixed(window.ROUNDOFF_UPTO)}`,
        );
        $('#reportSellExemptedTotalLabelID').text(
          `${$.i18n.t('report.SaleExemptedTotal')}:${currency}${Number(sellExemptedTotal).toFixed(window.ROUNDOFF_UPTO)}`,
        );

        $('#reportfreeamountLabelID').text(
          `${$.i18n.t(
            'report.FreeOrderAmount',
          )}:${currency}${Number(freeordersTotal).toFixed(window.ROUNDOFF_UPTO)}`,
        );
        $('#reportcancelamountLabelID').text(
          `${$.i18n.t(
            'report.CancelledOrderAmount',
          )}:${currency}${Number(cancelledordersTotal).toFixed(window.ROUNDOFF_UPTO)}`,
        );
        $('#reportpendingamountLabelID').text(
          `${$.i18n.t(
            'report.PendingOrderamount',
          )}:${currency}${Number(pendingordersTotal).toFixed(window.ROUNDOFF_UPTO)}`,
        );
        $('#reportdeleteamountLabelID').text(
          `${$.i18n.t(
            'report.DeletedOrderAmount',
          )}:${currency}${Number(deletedordersTotal).toFixed(window.ROUNDOFF_UPTO)}`,
        );
        // $('#reportcashinhandLabelID').text(
        //   $.i18n.t('report.Cashinhand') +
        //     ':' +
        //     currency +
        //     Number(fulfilledordersTotal).toFixed(ROUNDOFF_UPTO),
        // );
        $('#reportdueamountLabelID').text('');
      }
    } else {
      $('#paymentWrapperid').hide();
    }

    if (
      showOrderTypeSummaryReport &&
      orderTypeWiseOrders &&
      orderTypeWiseOrders.length
    ) {
      $('#ordertypeSummaryWrapperid').show();
      $('#ordertypeSummaryWrapperid').addClass('paymentWrapper');

      orderTypeWiseOrders.forEach((data) => {
        let orderType = $('<td>', {
          html: window.orderTypes[Number(data.billing_type)].order_type,
        }); // BillingTypes[data.billing_type]
        if (
          window.selectedLanguage !== 'en' &&
          window.orderTypes[Number(data.billing_type)].alternative_title
        ) {
          orderType = $('<td>', {
            html:
              window.orderTypes[Number(data.billing_type)].alternative_title ||
              '', // ARABIC_BIILING_TYPES_BYID[data.billing_type],
          });
        } else {
          orderType = $('<td>', {
            html: window.orderTypes[Number(data.billing_type)].order_type,
          });
        }
        const count = $('<td>', { html: data.count, class: 'centerTextAlign' });
        const charges = $('<td>', {
          html: Number(data.charges).toFixed(window.ROUNDOFF_UPTO),
          class: 'rightTextAlign',
        });
        const discount = $('<td>', {
          html: Number(data.discount).toFixed(window.ROUNDOFF_UPTO),
          class: 'rightTextAlign',
        });

        const netSale = $('<td>', {
          html: (
            data.order_total -
            (data.order_level_total_taxes + data.charges_level_total_tax) -
            (data.total_rounded_amt ? data.total_rounded_amt : 0)
          ).toFixed(window.ROUNDOFF_UPTO),
          class: 'rightTextAlign',
        });
        const grossSale = $('<td>', {
          html: data.order_total.toFixed(window.ROUNDOFF_UPTO),
          class: 'rightTextAlign',
        });
        const row = $('<tr>')
          .append(orderType)
          .append(count)
          .append(charges)
          .append(discount)
          .append(netSale)
          .append(grossSale);
        $('#reportoredrSummaryTable').append(row);
      });
    } else {
      $('#ordertypeSummaryWrapperid').removeClass('paymentWrapper');
      $('#ordertypeSummaryWrapperid').hide();
    }

    if (showWaiterSummaryReport) {
      if (waiterSummaryReport && waiterSummaryReport.length) {
        $('#waiterSummaryWrapperid').show();
        $('#nowaiterreportavaible').hide();

        waiterSummaryReport.forEach((data) => {
          const Name = $('<td>', { html: data.waiter });

          const Count = $('<td>', {
            html: data.count,
            class: 'centerTextAlign',
          });
          const Amount = $('<td>', {
            html: Number(
              Number(data.total_order).toFixed(window.ROUNDOFF_UPTO),
            ),
            class: 'rightTextAlign',
          });
          const TipAmount = $('<td>', {
            html:
              Number(Number(data.total_tip).toFixed(window.ROUNDOFF_UPTO)) ||
              '',
            class: 'rightTextAlign',
          });
          const row = $('<tr>')
            .append(Name)
            .append(Count)
            .append(Amount)
            .append(TipAmount);
          $('#reportwaiterSummaryTable').append(row);
        });
      } else {
        $('#nowaiterreportavaible').show();
        $('#waiterSummaryWrapperid').hide();
      }
    } else {
      $('#waiterSummaryWrapperid').hide();
    }

    if (showDeliveryboySummaryReport) {
      if (deliveryboySummaryReport && deliveryboySummaryReport.length) {
        $('#deliveryBoySummaryWrapperid').show();
        $('#nodboyreportavaible').hide();

        deliveryboySummaryReport.forEach((data) => {
          // in pascal case
          const order_state =
            data.order_state.charAt(0).toUpperCase() +
            data.order_state.slice(1).toLowerCase();
          const Name = $('<td>', { html: data.delivery_boy_name });

          const Count = $('<td>', {
            html: data.count,
            class: 'centerTextAlign',
          });
          const Amount = $('<td>', {
            html: Number(data.order_total).toFixed(window.ROUNDOFF_UPTO),
            class: 'rightTextAlign',
          });
          const Status = $('<td>', {
            html: order_state,
            class: 'rightTextAlign',
          });

          const row = $('<tr>')
            .append(Name)
            .append(Count)
            .append(Amount)
            .append(Status);
          $('#reportdeliveryboySummaryTable').append(row);
        });
      } else {
        $('#nodboyreportavaible').show();
        $('#deliveryBoySummaryWrapperid').hide();
      }
    } else {
      $('#deliveryBoySummaryWrapperid').hide();
    }

    if (showDuePaymentSummaryReport) {
      if (duePaymentSummaryReport && duePaymentSummaryReport.length) {
        $('#reportduePaymentSummaryTable').find('tr:not(:first)').remove();

        $('#duePaymentSummaryWrapperid').show();
        $('#noduePaymentreportavaible').hide();

        let totalpaymentAmount = 0;
        let totalTransactions = 0;
        duePaymentSummaryReport.forEach((data) => {
          const bill_number = $('<td>', { html: data.bill_number });

          const formattedDate = window
            .moment(data.created_time)
            .format('DD/MM/YYYY hh:mm A');
          const paymentdate = $('<td>', {
            html: formattedDate,
            class: 'centerTextAlign',
          });
          const customername = $('<td>', {
            html: data.cust_mobile,
            class: 'centerTextAlign',
          });
          const Amount = $('<td>', {
            html: Number(data.total_amount).toFixed(window.ROUNDOFF_UPTO),
            class: 'centerTextAlign',
          });
          const paymentName = $('<td>', {
            html: data.payment_mode,
            class: 'rightTextAlign',
          });
          totalpaymentAmount += Number(data.total_amount);
          totalTransactions += 1;
          const row = $('<tr>')
            .append(bill_number)
            .append(paymentdate)
            .append(customername)
            .append(Amount)
            .append(paymentName);
          $('#reportduePaymentSummaryTable').append(row);

          duePaymentsReceived += Number(data.total_amount);
        });

        $('#duepaymentreportOverallinfolabel').html(
          `<span>Total Received</span> <span class="sales-summary-amount">${currency} ${totalpaymentAmount.toFixed(window.ROUNDOFF_UPTO)}</span>`,
        );
      } else {
        $('#noduePaymentreportavaible').show();
        $('#duePaymentSummaryWrapperid').hide();
      }
    } else {
      $('#duePaymentSummaryWrapperid').hide();
    }

    if (showDuePaymentReceivableSummaryReport) {
      if (
        duePaymentReceivableSummaryReport &&
        duePaymentReceivableSummaryReport.length
      ) {
        $('#reportduePaymentReceivableSummaryTable')
          .find('tr:not(:first)')
          .remove();

        $('#duePaymentReceivableSummaryWrapperid').show();
        $('#noduePaymentReceivablereportavaible').hide();

        let totalpaymentAmount = 0;
        let totalTransactions = 0;
        duePaymentReceivableSummaryReport.forEach((data) => {
          const bill_number = $('<td>', { html: data.bill_number });

          const formattedDate = window
            .moment(data.created_time)
            .format('DD/MM/YYYY hh:mm A');
          const paymentdate = $('<td>', {
            html: formattedDate,
            class: 'centerTextAlign',
          });
          const customername = $('<td>', {
            html: data.cust_mobile,
            class: 'centerTextAlign',
          });
          const Amount = $('<td>', {
            html: Number(data.total_amount).toFixed(window.ROUNDOFF_UPTO),
            class: 'rightTextAlign',
          });
          const paymentName = $('<td>', { html: data.payment_mode });
          totalpaymentAmount += Number(data.total_amount);
          totalTransactions += 1;
          const row = $('<tr>')
            .append(bill_number)
            .append(paymentdate)
            .append(customername)
            .append(Amount)
            .append(paymentName);
          $('#reportduePaymentReceivableSummaryTable').append(row);

          duePaymentsReceivable += data.total_amount;
        });

        $('#duepaymentReceivablereportOverallinfolabel').html(
          `<span>${$.i18n.t('report.TotalReceivable')}</span> <span class="sales-summary-amount">${currency} ${totalpaymentAmount.toFixed(window.ROUNDOFF_UPTO)}</span>`,
        );
      } else {
        $('#noduePaymentReceivablereportavaible').show();
        $('#duePaymentReceivableSummaryWrapperid').hide();
      }
    } else {
      $('#duePaymentReceivableSummaryWrapperid').hide();
    }

    if (showDiscountSummaryReport) {
      if (discountSummaryReport && discountSummaryReport.length) {
        $('#discountSummaryWrapperid').show();
        $('#nodiscountreportavaible').hide();

        discountSummaryReport.forEach((data) => {
          const Name = $('<td>', { html: data.discount_title });

          const Count = $('<td>', {
            html: data.count,
            class: 'centerTextAlign',
          });
          const Amount = $('<td>', {
            html: Number(data.total_discount).toFixed(window.ROUNDOFF_UPTO),
            class: 'rightTextAlign',
          });
          const orderTotal = $('<td>', {
            html: Number(data.order_total).toFixed(window.ROUNDOFF_UPTO),
            class: 'rightTextAlign',
          });
          const row = $('<tr>')
            .append(Name)
            .append(Count)
            .append(Amount)
            .append(orderTotal);
          $('#reportdiscountSummaryTable').append(row);
        });
      } else {
        $('#nodiscountreportavaible').show();
        $('#discountSummaryWrapperid').hide();
      }
    } else {
      $('#discountSummaryWrapperid').hide();
    }

    if (showWalletSummaryReport) {
      if (walletSummaryReport && walletSummaryReport.length) {
        $('#walletSummaryWrapperid').show();
        $('#noWalletSummaryreportavaible').hide();
        let totalDebited = 0;
        let totalCredited = 0;
        walletSummaryReport.forEach((data) => {
          const Name = $('<td>', { html: data['mpos_wallet.wallet_name'] });

          const phone = $('<td>', { html: data['cust_phone'] });
          const creditAmount = $('<td>', {
            html: Number(data.credit).toFixed(window.ROUNDOFF_UPTO),
            class: 'rightTextAlign',
          });
          const debitAmount = $('<td>', {
            html: Number(data.debit).toFixed(window.ROUNDOFF_UPTO),
            class: 'rightTextAlign',
          });
          const available_balance = $('<td>', {
            html: Number(data.available_balance).toFixed(window.ROUNDOFF_UPTO),
            class: 'rightTextAlign',
          });
          const payment_mode = $('<td>', {
            html: data.payment_mode,
            class: 'rightTextAlign',
          });
          const row = $('<tr>')
            // .append(Name)
            .append(phone)
            .append(creditAmount)
            .append(debitAmount)
            .append(available_balance)
            .append(payment_mode);
          $('#walletSummaryTable').append(row);

          totalDebited += Number(data.debit);
          totalCredited += Number(data.credit);
          paymentMadeUsingWallet += Number(data.debit);
          paymentRecivedThroughWallet += Number(data.credit);
        });
        $('#totalDebitedWalletinfolabel').html(
          `<span>${$.i18n.t('report.WalletDebited')}</span>  <span class="sales-summary-amount">${currency} ${Number(totalDebited).toFixed(window.ROUNDOFF_UPTO)}</span>`,
        );

        $('#totalCreditedWalletinfolabel').html(
          `<span>${$.i18n.t('report.WalletCredited')}</span>  <span class="sales-summary-amount">${currency} ${Number(totalCredited).toFixed(window.ROUNDOFF_UPTO)}</span>`,
        );
      } else {
        $('#noWalletSummaryreportavaible').show();
        $('#walletSummaryWrapperid').hide();
      }
    } else {
      $('#walletSummaryWrapperid').hide();
    }

    if (showKDWiseSummaryReport) {
      if (kdWiseItemSummary && kdWiseItemSummary.length) {
        $('#kdWiseItemummaryWrapperid').show();
        $('#noKDWiseItemsSummaryreportavaible').hide();
        kdWiseItemSummary.forEach((data) => {
          const kitchenDeptName = $('<td>', { html: data.kitchen_dept_name });

          const count = $('<td>', {
            html: Number(data.count),
            class: 'centerTextAlign',
          });
          const amount = $('<td>', {
            html: Number(data.total).toFixed(window.ROUNDOFF_UPTO),
            class: 'rightTextAlign',
          });
          const row = $('<tr>')
            .append(kitchenDeptName)
            .append(count)
            .append(amount);
          $('#kdwiseItemsSummaryTable').append(row);
        });
      } else {
        $('#noKDWiseItemsSummaryreportavaible').show();
        $('#kdWiseItemummaryWrapperid').hide();
      }
    } else {
      $('#kdWiseItemummaryWrapperid').hide();
    }

    // deliveryboySummaryReport;
    if (showExpenseReport && expenses_list && expenses_list.length) {
      let expensesTotal = 0;
      $('#expensereportWrapperid').show();
      expenses_list.forEach((data) => {
        const expenseCategory = $('<td>', { html: data.category_name });
        const expenseSubcategory = $('<td>', { html: data.sub_category_name });
        const expenseAmount = $('<td>', {
          html: data.amount,
          class: 'rightTextAlign',
        });
        const expensePaymentMode = $('<td>', {
          html: data.payment_mode,
          class: 'rightTextAlign',
        });

        const row = $('<tr>')
          .append(expenseCategory)
          .append(expenseSubcategory)
          .append(expenseAmount)
          .append(expensePaymentMode);
        $('#expensereportTable').append(row);

        expensesTotal += data.amount;
      });
      $('#expensesOveralllabel').html(
        `<span>${$.i18n.t('report.Total')}: </span><span class="sales-summary-amount">${currency} ${expensesTotal}</span>`,
      );
    } else {
      $('#expensereportWrapperid').hide();
    }

    if (details.data.orderfromList && details.data.orderfromList.length > 0) {
      $('#orderfromWrapperid').show();
      let totalTransactions = 0;
      let totalpaymentAmount = 0;
      let showorderstatewiseTotal = false;
      totalTax = 0;
      totalDiscount = 0;
      totalCharges = 0;
      if (details.data.showorderstatewiseTotal) {
        showorderstatewiseTotal = true;
      }

      details.data.orderfromList.forEach((payment) => {
        payment.amount = Number(payment.amount);

        totalTransactions += payment.transactions;
        totalpaymentAmount += payment.amount;
        totalTax += payment.totalTax;
        totalDiscount += payment.totalDiscount;
        totalCharges += payment.totalCharges;

        addorderfromtable_row(payment);
        if (showorderstatewiseTotal && payment.status) {
          switch (payment.status) {
            case OrderState.FULFILLED:
              fulfilledordersTotal += payment.amount;
              break;
            case OrderState.FREE:
              freeordersTotal += payment.amount;
              break;
            case OrderState.CANCELLED:
              cancelledordersTotal += payment.amount;
              break;
            case OrderState.PENDING:
              pendingordersTotal += payment.amount;
              break;
            case OrderState.DELETE:
              deletedordersTotal += payment.amount;
              break;
            default:
              break;
          }
        }
      });
      $('#orderreportOverallinfolabel').html(
        `Order from Total--${totalTransactions}--${currency}${totalpaymentAmount.toFixed(window.ROUNDOFF_UPTO)}`,
      );
      if (showorderstatewiseTotal) {
        $('#billLabelscontainerid').show();
        $('#reportchargestaxLabelID').text(
          `${$.i18n.t('report.TaxonCharges')}:` +
            `${currency} ${totalChargestax.toFixed(window.ROUNDOFF_UPTO)}`,
        );
        $('#reporttaxLabelID').text(
          `${$.i18n.t(
            'report.TotalTax',
          )}: ${currency} ${totalTax.toFixed(window.ROUNDOFF_UPTO)}`,
        );
        $('#reportdiscountLabelID').text(
          `${$.i18n.t(
            'report.Totaldiscount',
          )}:  ${currency} ${totalDiscount.toFixed(window.ROUNDOFF_UPTO)}`,
        );
        $('#reportchargeslabelID').text(
          `${$.i18n.t(
            'report.TotalCharges',
          )}: ${currency} ${totalCharges.toFixed(window.ROUNDOFF_UPTO)}`,
        );
        $('#reportfulfillamountLabelID').text(
          `${$.i18n.t(
            'report.FullfilledOrdesAmount',
          )}: ${currency}${Number(fulfilledordersTotal).toFixed(window.ROUNDOFF_UPTO)}`,
        );
        $('#reportTotalTipCollectedLabelID').text(
          `${$.i18n.t(
            'report.TotalTipsCollected',
          )}: ${currency}${Number(totalTip).toFixed(window.ROUNDOFF_UPTO)}`,
        );
        $('#reportSellExemptedTotalLabelID').text(
          `Sale Exempted Total: ${currency}${Number(sellExemptedTotal).toFixed(window.ROUNDOFF_UPTO)}`,
        );
        if (showLiquorSaleExemptReport) {
          $('#reportLiquorSaleTotalLabelID').text(
            `Liquor sale exempted: ${currency}${Number(liquorSaleTotal).toFixed(window.ROUNDOFF_UPTO)}`,
          );
        }
        $('#reportfreeamountLabelID').text(
          `${$.i18n.t(
            'report.FreeOrderAmount',
          )}:${currency}${freeordersTotal.toFixed(window.ROUNDOFF_UPTO)}`,
        );
        $('#reportcancelamountLabelID').text(
          `${$.i18n.t(
            'report.CancelledOrderAmount',
          )}:${currency}${cancelledordersTotal.toFixed(window.ROUNDOFF_UPTO)}`,
        );
        $('#reportpendingamountLabelID').text(
          `${$.i18n.t(
            'report.PendingOrderamount',
          )}:${currency}${pendingordersTotal.toFixed(window.ROUNDOFF_UPTO)}`,
        );
        $('#reportdeleteamountLabelID').text(
          `${$.i18n.t(
            'report.DeletedOrderAmount',
          )}:${currency}${deletedordersTotal.toFixed(window.ROUNDOFF_UPTO)}`,
        );
        // $('#reportcashinhandLabelID').text(
        //   $.i18n.t('report.Cashinhand') +
        //     ':' +
        //     currency +
        //     Number(fulfilledordersTotal).toFixed(ROUNDOFF_UPTO),
        // );
      }
    } else {
      $('#orderfromWrapperid').hide();
    }

    // closing currency denomination
    if (
      showCurrencyDenomination &&
      closing_currency_denomination &&
      closing_currency_denomination.length
    ) {
      $('#closingCurrencyDenominationWrapperid').show();
      let totalAmount = 0;
      closing_currency_denomination.forEach((data) => {
        totalAmount += Number(data.total);
        const denominationCurrency = $('<td>', {
          html: `${window.storeDetails.currency} ${data.currency}`,
        });
        const denoinationNoteCount = $('<td>', {
          html: data.note_count,
          class: 'centerTextAlign',
        });
        const denominationTotalAmount = $('<td>', {
          html: `${window.storeDetails.currency} ${data.total}`,
          class: 'rightTextAlign',
        });

        const row = $('<tr>')
          .append(denominationCurrency)
          .append(denoinationNoteCount)
          .append(denominationTotalAmount);
        $('#closingCurrencyDenominationTable').append(row);
      });
      $('#currencyDenominationOveralllabel').html(
        `<span>Total :</span> <span class="sales-summary-amount"> ${currency} ${totalAmount}</span>`,
      );
    } else {
      $('#closingCurrencyDenominationWrapperid').hide();
    }

    // close day transactions
    // closing currency denomination
    if (
      showPaymentVarianceSummary &&
      dayShift_end_transactions &&
      dayShift_end_transactions.length
    ) {
      $('#closingDayShiftTransactionsWrapperid').show();
      let totalVariance = 0;
      dayShift_end_transactions.forEach((data) => {
        const paymentMethod = $('<td>', {
          html: ` ${data.payment_mode}`,
        });
        const count = $('<td>', {
          html: data.transactions,
          class: 'centerTextAlign',
        });
        const settledAmount = $('<td>', {
          html: `${data.settledAmount}`,
          class: 'rightTextAlign',
        });
        const actualAmount = $('<td>', {
          html: ` ${data.actualAmount}`,
          class: 'rightTextAlign',
        });
        const variance = $('<td>', {
          html: ` ${data.varienceAmount}`,
          class: 'rightTextAlign',
        });

        const row = $('<tr>')
          .append(paymentMethod)
          .append(count)
          .append(settledAmount)
          .append(actualAmount)
          .append(variance);
        $('#closingDayShiftTransactionsTable').append(row);

        totalVariance += data.varienceAmount;
      });
      $('#transactionVarianceOveralllabel').html(
        `<span>Total Payment Variance:</span> <span class="sales-summary-amount">${currency} ${totalVariance}</span>`,
      );
    } else {
      $('#closingDayShiftTransactionsWrapperid').hide();
    }

    if (
      details.report_type == 'Start Close Shift report' ||
      details.report_type == 'Start Close Day report' ||
      details.report_type == 'User shift report' ||
      details.report_type == 'Start Close day report' ||
      details.report_type == 'Todays Report' ||
      details.report_type == "Today's Report" ||
      details.report_type == 'Sales Report'
    ) {
      $('#categroyReportTitle').show();
    } else {
      $('#categroyReportTitle').hide();
    }
    if (
      details.report_type === 'Start Close Shift report' ||
      details.report_type === 'Start Close Day report' ||
      details.report_type === 'User shift report' ||
      details.report_type === 'Start Close day report'
    ) {
      $('#orderfromWrapperid').hide();
      // $('#billLabelscontainerid').hide();
      $('#startEndDayShiftReport').show();

      // start end day and shift data show
      $('#shiftStartTimelabel').show();
      $('#shiftEndTimelabel').show();
      $('#dayStartTimelabel').show();
      $('#dayEndTimelabel').show();

      // $('#categroyReportTitle').show();
      const { shiftData } = details.data;
      let startShifttime;
      let endShifttime;
      if (shiftData.fromDate && shiftData.toDate) {
        // startShifttime = moment(shiftData.fromDate).format('DD-MM-YYYY HH:mm');
        // endShifttime = moment(shiftData.toDate).format('DD-MM-YYYY HH:mm');
        startShifttime = moment(shiftData.fromDate).format('DD-MM-YYYY HH:mm');
        endShifttime = moment(shiftData.toDate).format('DD-MM-YYYY HH:mm');
      }
      if (
        details.report_type == 'Start Close Shift report' ||
        details.report_type == 'User shift report'
      ) {
        if (shiftData.shift_start_date && shiftData.shift_end_date) {
          // startShifttime = moment(shiftData.fromDate).format('DD-MM-YYYY HH:mm');
          // endShifttime = moment(shiftData.toDate).format('DD-MM-YYYY HH:mm');
          startShifttime = window
            .moment(shiftData.shift_start_date)
            .format('DD-MM-YYYY HH:mm');
          endShifttime = window
            .moment(shiftData.shift_end_date)
            .format('DD-MM-YYYY HH:mm');
        }
        $('#shiftStartTimelabel').html(
          `<span>${$.i18n.t('report.StartshiftTime')}:</span> <span class="sales-summary-amount">${startShifttime ? startShifttime : '-'} </span>`,
        );

        $('#shiftEndTimelabel').html(
          `<span>${$.i18n.t('report.EndShiftTime')}:</span> <span class="sales-summary-amount">${endShifttime ? endShifttime : '-'}</span>`,
        );
      } else {
        if (shiftData.start_day_date && shiftData.day_close_date) {
          // startShifttime = moment(shiftData.fromDate).format('DD-MM-YYYY HH:mm');
          // endShifttime = moment(shiftData.toDate).format('DD-MM-YYYY HH:mm');
          startShifttime = window
            .moment(shiftData.start_day_date)
            .format('DD-MM-YYYY HH:mm');
          endShifttime = window
            .moment(shiftData.day_close_date)
            .format('DD-MM-YYYY HH:mm');
        }
        $('#shiftStartTimelabel').html(
          `<span>${$.i18n.t('report.StartDaytime')}:</span> <span class="sales-summary-amount">${startShifttime ? startShifttime : '-'}</span>`,
        );
        $('#shiftEndTimelabel').html(
          `<span>${$.i18n.t('report.EndDayTime')}:</span> <span class="sales-summary-amount"> ${endShifttime ? endShifttime : '-'}</span>`,
        );
      }
      if (shiftData.username) {
        $('#shiftusername').html(
          `<span>${$.i18n.t('report.Username')}:</span>  <span class="sales-summary-amount">${shiftData.username ? shiftData.username : '-'}</span>`,
        );
      }
      $('#openingBalance').html(
        `<span>${$.i18n.t(
          'report.OpeningBalance',
        )}:</span> <span class="sales-summary-amount">${Number(shiftData.opening_balance) ? Number(shiftData.opening_balance).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
      );
      if (details.report_type == 'Start Close Shift report') {
        $('#closingBalance').html(
          `<span>${$.i18n.t(
            'report.ClosingBalance',
          )}:</span> <span class="sales-summary-amount">${Number(shiftData.closing_balance) ? Number(shiftData.closing_balance).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
        );
      } else {
        $('#closingBalance').html(
          `<span>${$.i18n.t('report.ClosingBalance')}:</span>  <span class="sales-summary-amount">${
            Number(shiftData.current_closing_balance)
              ? Number(shiftData.current_closing_balance).toFixed(
                  window.ROUNDOFF_UPTO,
                )
              : '-'
          }</span>`,
        );
      }
      shiftData.total_expense &&
        $('#totalExpenses').html(
          `<span>${$.i18n.t(
            'report.TotalExpenses',
          )}:</span> <span class="sales-summary-amount">${Number(shiftData.total_expense) ? Number(shiftData.total_expense).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
        );
      // $('#totalSale').html(
      //   `<span>${$.i18n.t(
      //     'report.TotalSale',
      //   )}:</span> <span class="sales-summary-amount">${Number(shiftData.total_sales).toFixed(window.ROUNDOFF_UPTO)}</span>`,
      // );
      // $('#invoiceRange').html(
      //   `<span>${$.i18n.t('report.InvoiceRange')}:</span> <span class="sales-summary-amount"> ${shiftData.invoice_range}</span>`,
      // );
      if (
        details.report_type == 'Start Close Shift report' ||
        details.report_type == 'User shift report'
      ) {
        $('#startDayComment').html(
          `<span>${$.i18n.t(
            'report.Startshiftcomment',
          )}:</span> <span class="sales-summary-amount"> ${shiftData.shift_start_comment ? shiftData.shift_start_comment : '-'}</span>`,
        );
        $('#endDayComment').html(
          `<span>${$.i18n.t(
            'report.EndshiftComment',
          )}:</span> <span class="sales-summary-amount"> ${shiftData.shift_end_comment ? shiftData.shift_end_comment : '-'}</span>`,
        );
      } else {
        $('#startDayComment').html(
          `<span>${$.i18n.t(
            'report.Startdaycomment',
          )}:</span> <span class="sales-summary-amount">${shiftData.start_day_comment ? shiftData.start_day_comment : '_'}</span>`,
        );
        $('#endDayComment').html(
          `<span>${$.i18n.t(
            'report.Closedaycomment',
          )}:</span> <span class="sales-summary-amount"> ${shiftData.close_day_comment ? shiftData.close_day_comment : '-'}</span>`,
        );
      }
      if (
        details.report_type == 'Start Close Shift report' ||
        details.report_type == 'User shift report'
      ) {
        $('#closeShiftAmountReport').html(
          `<span>${$.i18n.t(
            'report.CloseShiftamount',
          )}:</span> <span class="sales-summary-amount"> ${Number(shiftData.close_shift_amount) ? Number(shiftData.close_shift_amount).toFixed(window.ROUNDOFF_UPTO) : '-'} </span>`,
        );
      } else {
        $('#closeShiftAmountReport').html(
          `<span>${$.i18n.t(
            'report.Closedayamount',
          )}:</span> <span class="sales-summary-amount">${Number(shiftData.close_day_amount) ? Number(shiftData.close_day_amount).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
        );
      }
      $('#cashDifference').html(
        `<span>${$.i18n.t(
          'report.Cashdifference',
        )}:</span> <span class="sales-summary-amount"> ${Number(shiftData.cash_diff) ? Number(shiftData.cash_diff).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
      );
    } else {
      $('#startEndDayShiftReport').hide();
      // $('#categroyReportTitle').hide();

      // start end day and shift data hide
      $('#shiftStartTimelabel').hide();
      $('#shiftEndTimelabel').hide();
      $('#dayStartTimelabel').hide();
      $('#dayEndTimelabel').hide();
    }
    let showCategoryData = false;
    if (window.settingsConfig && window.settingsConfig.length > 0) {
      showCategoryData =
        window.settingsConfig[SHOW_CATEGORYWISE_ITEM_REPORT - 1].value == '1';
    }
    if (
      // showCategoryData &&
      details.data.catwisedataList &&
      details.data.catwisedataList.length > 0
    ) {
      $('#catwisereportWrapperid').show();
      $('#disposable-catitem-report-containerid').empty();
      if (details.data.printwithItems) {
        $('#catwisereportTable').hide();
        // addCategorieswithItems
        addCategorieswithItems(
          details.data.catwisedataList,
          details.data.groupByBaseItem,
        );
      } else {
        $('#catwisereportTable').show();
        details.data.catwisedataList.forEach((element) => {
          addCatwisereportrow(element);
        });
      }
    } else {
      $('#catwisereportWrapperid').hide();
    }

    // this sold items for close day close shift report which is belowe category wise report
    // if (
    //   showSolditems &&
    //   details.data &&
    //   details.data.closeDaysoldItems &&
    //   details.data.closeDaysoldItems.length > 0
    // ) {
    //   $('#solditemsclosedayWrapperid').show();
    //   let totalAmount = 0;
    //   let totalItems = 0;
    //   const soldItemslist = details.data.closeDaysoldItems;
    //   soldItemslist.forEach((element) => {
    //     addSolditemtableCloseday_row(element);

    //     if (element.qty && element.qty !== '-')
    //       totalItems += Number(element.qty);

    //     if (element.total && element.total !== '-')
    //       totalAmount += Number(element.total);
    //   });

    //   $('#totalCloasDayItemscountlabel').html(
    //     `${$.i18n.t('report.TotalItems')}:${Number(totalItems).toFixed(
    //       ROUNDOFF_UPTO,
    //     )}`,
    //   );
    //   $('#totalClosedayItemsamountlabel').html(
    //     `${$.i18n.t('report.TotalAmountofItems')}:${Number(totalAmount).toFixed(
    //       ROUNDOFF_UPTO,
    //     )}`,
    //   );
    // } else {
    //   $('#solditemsclosedayWrapperid').hide();
    // }

    if (
      details.data.discountedItemslist &&
      details.data.discountedItemslist.length > 0
    ) {
      $('#discounteditemreportWrapperid').show();
      details.data.discountedItemslist.forEach((element) => {
        addDiscounteditemrow(element);
      });
    } else {
      $('#discounteditemreportWrapperid').hide();
    }

    if (
      details.data.couponhistorydataList &&
      details.data.couponhistorydataList.length > 0
    ) {
      $('#couponhistoryreportWrapperid').show();
      let totalcouponsAmount = 0;
      details.data.couponhistorydataList.forEach((element) => {
        addCouponhistoryreportrow(element);
        totalcouponsAmount += Number(element.coupon_code_amt);
      });
      // couponreportOverallinfolabel
      $('#couponreportOverallinfolabel').html(
        `Coupons Info--${details.data.couponhistorydataList.length}--${currency}${totalcouponsAmount.toFixed(window.ROUNDOFF_UPTO)}`,
      );
    } else {
      $('#couponhistoryreportWrapperid').hide();
    }

    if (details.data.kdwisedataList && details.data.kdwisedataList.length > 0) {
      $('#kdwisereportWrapperid').show();
      let totalAmount = 0;
      let totalQty = 0;
      details.data.kdwisedataList.forEach((element) => {
        addkdwisereportrow(element);
        totalAmount += Number(element.total);
        totalQty += Number(element.count);
      });
      $('#kdwisetotalItemscountlabel').html(
        `${$.i18n.t('report.TotalItems')}:${Number(totalQty).toFixed(
          window.ROUNDOFF_UPTO,
        )}`,
      );
      $('#kdwisetotalItemsamountlabel').html(
        `${$.i18n.t('report.TotalAmountofItems')}:${Number(totalAmount).toFixed(
          window.ROUNDOFF_UPTO,
        )}`,
      );
    } else {
      $('#kdwisereportWrapperid').hide();
    }

    if (details.data.duepaymentData && details.data.duepaymentData.length > 0) {
      $('#duepaymentreportWrapperid').show();
      let totalDueamount = 0;
      details.data.duepaymentData.forEach((element) => {
        totalDueamount += Number(element.due_amount);
        addduepaytablerow(element);
      });
      $('#duepayOveralllabel').html(
        `Due Info--${details.data.duepaymentData.length}--${currency}${totalDueamount}`,
      );
    } else {
      $('#duepaymentreportWrapperid').hide();
    }

    if (details.data.preordersList && details.data.preordersList.length > 0) {
      $('#preorderreportWrapperid').show();
      details.data.preordersList.forEach((element) => {
        addPreorderreportrow(element);
      });
    } else {
      $('#preorderreportWrapperid').hide();
    }

    if (
      showExpenses &&
      details.data.expensesList &&
      details.data.expensesList.length > 0
    ) {
      let expensesTotal = 0;

      details.data.expensesList.forEach((element) => {
        expensesTotal += element.amount;
        addExpensetablerow(element);
      });
      $('#expensesOveralllabel').html(
        `Expenses total--${details.data.expensesList.length}--${currency} ${expensesTotal}`,
      );
      $('#expensesWrapperid').show();
    } else {
      $('#expensesWrapperid').hide();
    }

    // Bill print report
    if (
      details.data.billprintReportlist &&
      details.data.billprintReportlist.length > 0
    ) {
      $('#billprintreportWrapperid').show();
      details.data.billprintReportlist.forEach((element) => {
        addbillprintreportrow(element);
      });
    } else {
      $('#billprintreportWrapperid').hide();
    }

    if (details.data.taxReport && details.data.taxReport.length > 0) {
      const imgSrc = window.hotelogoFilepath; // global.storeDetails.logo
      if (imgSrc) {
        $('#hotelLogoID').show();
        const imgLogo = $('<img>', {
          id: 'saleReportImg',
          src: imgSrc,
        });
        $('#hotelLogoID').prepend(imgLogo);
      }
      $('#salesReportNumber').show();
      $('#salesReportNumber').html(
        `Sales Report No: ${details.data.nextReportNumber}`,
      );

      if (global.storeDetails.field2) {
        $('#taxNamelabelID').show();
        $('#taxNamelabelID').html(`GST/VAT No: ${global.storeDetails.field2}`);
      }
      $('#taxprintreportWrapperid').show();

      details.data.taxReport.forEach((element) => {
        salesIncludedTax += Number(element.Price);
        salesExcludedTax += Number(element.Total);
        totalVat += Number(element.Tax);
        totalOrders += Number(element.Orders);
        addtaxprintreportrow(element);
      });

      const total = $('<td>', { html: 'Total', class: 'taxTotal' });
      const price = $('<td>', {
        html: salesIncludedTax.toFixed(window.ROUNDOFF_UPTO),
        class: 'taxTotal',
      });
      const orders = $('<td>', {
        html: totalOrders.toFixed(window.ROUNDOFF_UPTO),
        class: 'taxTotal',
      });
      const taxPer = $('<td>', { html: '' });
      const taxTotal = $('<td>', {
        html: totalVat.toFixed(window.ROUNDOFF_UPTO),
        class: 'taxTotal',
      });
      const Amt = $('<td>', {
        html: salesExcludedTax.toFixed(window.ROUNDOFF_UPTO),
        class: 'taxTotal',
      });

      const row = $('<tr>')
        .append(total)
        .append(price)
        .append(orders)
        .append(taxPer)
        .append(taxTotal)
        .append(Amt);

      $('#taxprintreportTable').append(row);

      let taxSum = 0;
      let taxPert = 0;
      const taxes = [];
      const taxGroups = groupBy(details.data.taxReport, (n) => n.TaxPer);

      const seperateTaxCalc = Object.values(taxGroups);
      seperateTaxCalc.map((group) => {
        taxSum = 0;
        taxPert = 0;
        group.map((taxValue) => {
          taxSum += Number(taxValue.Tax);
          taxPert = taxValue.TaxPer;
        });
        const tax = { taxSum, taxPert };
        taxes.push(tax);
      });
      let rowCell;
      if (taxes) {
        taxes.map((tax) => {
          rowCell = $('<label>', {
            class: 'taxReportTitle paymentInfo taxAdded',
            html: `Tax @ ${tax.taxPert} % : ${currency} ${tax.taxSum} `,
          });
          if (tax.taxPert > 0) {
            $('#taxLabels').append(rowCell);
          }
        });
      }
      $('#salesIncludedTaxlabel').html(
        `${$.i18n.t(
          'report.SaleIncudedTax',
        )}:${currency}${salesIncludedTax.toFixed(window.ROUNDOFF_UPTO)}`,
      );
      $('#salesExludedTaxlabel').html(
        `${$.i18n.t(
          'report.SaleExcludedTax',
        )}:${currency}${salesExcludedTax.toFixed(window.ROUNDOFF_UPTO)}`,
      );
      $('#totalVatlabel').html(
        `${$.i18n.t(
          'report.TotalTax',
        )}:${currency}${totalVat.toFixed(window.ROUNDOFF_UPTO)}`,
      );
      $('#totalOrderslabel').html(
        `${$.i18n.t('report.TotalItems')}:${totalOrders.toFixed(
          ROUNDOFF_UPTO,
        )}`,
      );
      $('#totalBillslabel').html(
        `${$.i18n.t('report.TotalBills')}:${
          details.data.totalBillsForTaxReport
        }`,
      );
      $('#totalChargeslabel').html(
        `${$.i18n.t(
          'report.TotalCharges',
        )}:${details.data.totalChargesForTaxReport.toFixed(window.ROUNDOFF_UPTO)}`,
      );
      $('#totalDiscountlabel').html(
        `${$.i18n.t(
          'report.Totaldiscount',
        )}:${details.data.totalDiscountForTaxReport.toFixed(window.ROUNDOFF_UPTO)}`,
      );

      let totalpaymentAmount = 0;

      paymentsData.forEach((payment) => {
        if (payment.order_state == 'fulfilled') {
          totalpaymentAmount += payment.amount;
          taxCell = $('<label>', {
            class: 'taxReportTitle paymentInfo taxAdded',
            html: `${
              payment.payment_option
            } : ${currency} ${payment.amount.toFixed(window.ROUNDOFF_UPTO)} `,
          });
          $('#paymentWithTax').append(taxCell);
        }

        // addPaymenttable_row(payment);
      });

      $('#PaymentTotal').html(
        `${$.i18n.t('report.Total')}: ${currency} ${totalpaymentAmount.toFixed(window.ROUNDOFF_UPTO)}`,
      );
    } else {
      $('#taxprintreportWrapperid').hide();
      $('#hotelLogoID').hide();
      $('#salesReportNumber').hide();
      $('#taxNamelabelID').hide();
    }

    if (
      details.data.appliedchargesReportlist &&
      details.data.appliedchargesReportlist.length > 0
    ) {
      $('#appliedchargesreportWrapperid').show();
      details.data.appliedchargesReportlist.forEach((element) => {
        addappliedchargereportrow(element);
      });
    } else {
      $('#appliedchargesreportWrapperid').hide();
    }

    if (
      details.data &&
      details.data.deliveryBoyList &&
      details.data.deliveryBoyList.length > 0
    ) {
      $('#deliveryboyreportWrapperid').show();
      $('#deliveryreportTable').find('tr:not(:first)').remove();
      const deliveryBoylist = details.data.deliveryBoyList;
      deliveryBoylist.forEach((element) => {
        adddeliveryBoy_row(element);
      });
    } else {
      $('#deliveryboyreportWrapperid').hide();
    }

    if (
      details.data &&
      details.data.userwiseList &&
      details.data.userwiseList.length > 0
    ) {
      $('#userreportWrapperid').show();
      $('#userreportTable').find('tr:not(:first)').remove();
      const userwiseList = details.data.userwiseList;
      userwiseList.forEach((element) => {
        addUserReport_row(element);
      });
    } else {
      $('#userreportWrapperid').hide();
    }

    if (
      orderSettlementDeliveryBoySummary &&
      orderSettlementDeliveryBoySummary.length
    ) {
      $('#orderSettlementDeliveryboyreportWrapperid').show();
      $('#deliveryBoynameorderSettlementId').html(
        orderSettlementDeliveryBoySummary[0].delivery_boy_name,
      );

      let total = 0;
      orderSettlementDeliveryBoySummary.forEach((data, i) => {
        // in pascal case
        total += data.order_total;
        const srNo = $('<td>', { html: i + 1 });
        const billNumber = $('<td>', { html: data.bill_number });

        const customerName = $('<td>', {
          html: data.phone,
          class: 'centerTextAlign',
        });
        const Amount = $('<td>', {
          html: data.order_total
            ? Number(data.order_total).toFixed(window.ROUNDOFF_UPTO)
            : '',
          class: 'rightTextAlign',
        });

        const row = $('<tr>')
          .append(srNo)
          .append(billNumber)
          .append(customerName)
          .append(Amount);
        $('#orderSettlementdeliveryreportTable').append(row);
      });

      if (total) {
        const srNo = $('<td>', {
          html: 'Total',
          class: 'report-summary-footer',
        });
        const billNumber = $('<td>', { html: '' });

        const customerName = $('<td>', {
          html: '',
          class: 'centerTextAlign',
        });
        const Amount = $('<td>', {
          html: Number(total).toFixed(window.ROUNDOFF_UPTO),
          class: 'rightTextAlign report-summary-footer',
        });

        const row = $('<tr>')
          .append(srNo)
          .append(billNumber)
          .append(customerName)
          .append(Amount);
        $('#orderSettlementdeliveryreportTable').append(row);
      }
    } else {
      $('#orderSettlementDeliveryboyreportWrapperid').hide();
    }

    if (showSummarystats) {
      // $('#reportnetsaleLabelID').text("Net Sale Amt: " + currency + Number(net_sale).toFixed(ROUNDOFF_UPTO));

      // $('#reportfulfillamountLabelID').text("Fulfilled Orders (Total/Gross Sale) Amount: " + currency + Number(fulfilledordersTotal).toFixed(ROUNDOFF_UPTO));
      // $('#reporttaxLabelID').text("Tax on (Total/Gross Sale): " + currency + Number(totalTax).toFixed(ROUNDOFF_UPTO));

      // $('#reportchargeslabelID').text("Total Charge: " + currency + Number(totalCharges).toFixed(ROUNDOFF_UPTO));
      // $('#reportchargestaxLabelID').text(`Tax on Charge: ${currency} ${Number(totalChargestax).toFixed(ROUNDOFF_UPTO)}`);

      // $('#reportdiscountLabelID').text("Total Discount: " + currency + Number(totalDiscount).toFixed(ROUNDOFF_UPTO));
      // $('#reportfreeamountLabelID').text("Free Orders Amount: " + currency + Number(freeordersTotal).toFixed(ROUNDOFF_UPTO));
      // $('#reportpendingamountLabelID').text("Pending Orders Amount: " + currency + Number(pendingordersTotal).toFixed(ROUNDOFF_UPTO));
      // $('#reportcancelamountLabelID').text("Cancelled Orders Amount: " + currency + Number(cancelledordersTotal).toFixed(ROUNDOFF_UPTO));
      // $('#reportdeleteamountLabelID').text("Deleted Orders Amount: " + currency + Number(deletedordersTotal).toFixed(ROUNDOFF_UPTO));

      // $('#reportcashinhandLabelID').text("Cash in hand (includes Online Payments): " + currency + Number(fulfilledordersTotal).toFixed(ROUNDOFF_UPTO));
      // $('#reportdueamountLabelID').text("Due Amount from Customer: " + currency + Number(duepaymentTotal).toFixed(ROUNDOFF_UPTO));

      // $('#reportnetsaleLabelID').text(
      //   $.i18n.t('report.NetSaleAmt') +
      //     ' ' +
      //     currency +
      //     Number(net_sale).toFixed(window.ROUNDOFF_UPTO),
      // );

      $('#reportnetsaleLabelID').html(
        `<span>${$.i18n.t('report.NetSaleAmt')}</span>     
          <span class="sales-summary-amount"> ${currency} ${Number(net_sale).toFixed(window.ROUNDOFF_UPTO)}</span>`,
      );

      $('#reporttaxLabelID').html(
        `<span>${$.i18n.t(
          'report.TaxonTotalGrossSale',
        )}:</span> <span class="sales-summary-amount">${Number(totalTax) ? currency + Number(totalTax).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
      );

      $('#reportfulfillamountLabelID').html(
        `<span>${$.i18n.t(
          'report.FullfilledOrdesAmount',
        )}:</span> <span class="sales-summary-amount"> ${currency}${Number(fulfilledordersTotal).toFixed(window.ROUNDOFF_UPTO)}</span>`,
      );

      $('#reportTotalTipCollectedLabelID').html(
        `<span>${$.i18n.t(
          'report.TotalTipsCollected',
        )}:</span> <span class="sales-summary-amount"> ${currency}${Number(totalTip).toFixed(window.ROUNDOFF_UPTO)}</span>`,
      );
      if (sellExemptedTotal) {
        $('#reportSellExemptedTotalLabelID').show();
        $('#reportSellExemptedTotalLabelID').html(
          `<span>Sale Exempted Total:</span> <span class="sales-summary-amount"> ${currency}${Number(sellExemptedTotal).toFixed(window.ROUNDOFF_UPTO)}</span>`,
        );
      } else {
        $('#reportSellExemptedTotalLabelID').hide();
      }

      if (showLiquorSaleExemptReport && liquorSaleTotal) {
        $('#reportLiquorSaleTotalLabelID').show();
        $('#reportLiquorSaleTotalLabelID').html(
          `<span>Liquor sale exempted:</span> <span class="sales-summary-amount"> ${currency}${Number(liquorSaleTotal).toFixed(window.ROUNDOFF_UPTO)}</span>`,
        );
      } else {
        $('#reportLiquorSaleTotalLabelID').show();
      }

      $('#reportdiscountLabelID').html(
        `<span>${$.i18n.t(
          'report.Totaldiscount',
        )}:</span> <span class="sales-summary-amount"> ${Number(totalDiscount) ? currency + Number(totalDiscount).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`, // ${Number(totalDiscount) ? currency + Number(totalDiscount).toFixed(window.ROUNDOFF_UPTO) : '-'}
      );

      $('#reportchargeslabelID').html(
        `<span>${$.i18n.t(
          'report.TotalCharges',
        )}:</span> <span class="sales-summary-amount"> ${Number(totalCharges) ? currency + Number(totalCharges).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
      );

      if (sellExemptedTotalCharges) {
        $('#reportSellExemptedChargeslabelID').show();
        $('#reportSellExemptedChargeslabelID').html(
          `<span>Sale Exempted Charges:</span> <span class="sales-summary-amount"> ${Number(sellExemptedTotalCharges) ? currency + Number(sellExemptedTotalCharges).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
        );
      } else {
        $('#reportSellExemptedChargeslabelID').hide();
      }
      $('#reportchargestaxLabelID').html(
        `<span>${$.i18n.t('report.TaxonCharges')}:</span>` +
          `<span class="sales-summary-amount"> ${Number(totalChargestax) ? currency + Number(totalChargestax).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
      );
      $('#reportCancelledOrderchargeslabelID').html(
        `<span>${$.i18n.t(
          'report.CancelledOrderTotalCharges',
        )}:</span> <span class="sales-summary-amount">${Number(cancelledOrderTotalCharges) ? currency + Number(cancelledOrderTotalCharges).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
      );

      $('#reportfreeamountLabelID').html(
        `<span>${$.i18n.t(
          'report.FreeOrderAmount',
        )}:</span> <span class="sales-summary-amount"> ${Number(freeordersTotal) ? currency + Number(freeordersTotal).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
      );
      $('#reportpendingamountLabelID').html(
        `<span>${$.i18n.t(
          'report.PendingOrderamount',
        )}:</span> <span class="sales-summary-amount"> ${Number(pendingordersTotal) ? currency + Number(pendingordersTotal).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
      );
      $('#reportcancelamountLabelID').html(
        `<span>${$.i18n.t(
          'report.CancelledOrderAmount',
        )}:</span> <span class="sales-summary-amount">${Number(cancelledordersTotal) ? currency + Number(cancelledordersTotal).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
      );
      $('#reportdeleteamountLabelID').html(
        `<span>${$.i18n.t(
          'report.DeletedOrderAmount',
        )}:</span> <span class="sales-summary-amount"> ${Number(deletedordersTotal) ? currency + Number(deletedordersTotal).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
      );

      // $('#reportcashinhandLabelID').text(
      //   $.i18n.t('report.Cashinhand') +
      //     ':' +
      //     currency +
      //     Number(fulfilledordersTotal).toFixed(ROUNDOFF_UPTO),
      // );
      $('#reportdueamountLabelID').html(
        `<span>${$.i18n.t('report.DuePaymentsReceivable')}</span> <span class="sales-summary-amount" dir="ltr">${Number(duepaymentTotal) ? currency + Number(duepaymentTotal).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
      );

      $('#reportduePaymentReceivedLabelID').html(
        `<span>${$.i18n.t('report.DuePaymentsReceived')}</span> <span class="sales-summary-amount" dir="ltr">${Number(duePaymentsReceived) ? currency + duePaymentsReceived.toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
      );

      $('#reportPaymentMadeUsingWalletLabelID').html(
        `<span>${$.i18n.t('report.WalletDebited')}</span> <span class="sales-summary-amount" dir="ltr">${Number(paymentMadeUsingWallet) ? currency + Number(paymentMadeUsingWallet).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
      );

      $('#reportpaymentRecivedThroughWallteLabelID').html(
        `<span>${$.i18n.t('report.WalletCredited')}</span> <span class="sales-summary-amount" dir="ltr">${Number(paymentRecivedThroughWallet) ? currency + Number(paymentRecivedThroughWallet).toFixed(window.ROUNDOFF_UPTO) : '-'}</span>`,
      );

      $('#reportRevenueIdLabelID').html(
        `<span>${$.i18n.t('report.RevenueID')}</span> <span class="sales-summary-amount" dir="ltr">${window.revenue_id}</span>`,
      );

      $('#reportPrintedByUserLabelID').html(
        `<span>${$.i18n.t('report.PrintedBy')}</span> <span class="sales-summary-amount">${window.storeDetails.person_name}</span>`,
      );

      $('#reportTotalBillsLabelID').html(
        `<span>${$.i18n.t('report.TotalBills')}</span> <span class="sales-summary-amount" dir="ltr">${totalBills}</span>`,
      );

      $('#reportBillRangeLabelID').html(
        `<span>${$.i18n.t('report.BillRange')}</span> <span class="sales-summary-amount" dir="ltr">${invoice_range}</span>`,
      );
    }

    if (
      window.storeDetails &&
      window.storeDetails.show_poweredby &&
      $('#reportappversionDivid').is(':empty')
    ) {
      $('#reportappversionDivid').html(
        `Powered By TMBill ${window.APP_VERSION}`,
      );
    }
    const sendBase64String = details.sendBase64String || undefined;
    const printReportWhileSendingOnMail =
      details.printReportWhileSendingOnMail || undefined;
    const showLoader = details.showLoader || undefined;
    printtodaysReport({
      converttoPdf: details.converttoPdf,
      storeDetails,
      sendBase64String,
      printReportWhileSendingOnMail,
      showLoader,
      report_type: details.report_type,
    });
  }
}

/**
 * Set the margins to the preview if there are any
 */
async function setPageconfigifany() {
  try {
    let currentPrinter = 2;
    if (
      window.printersList != undefined &&
      window.printersList.length >= PRINTERS.REPORT
    ) {
      const size = window.printersList[PRINTERS.REPORT - 1].printer_size;
      currentPrinter = Number(size);
    }
    if (currentPrinter && window.settingsConfig) {
      let margins;
      switch (currentPrinter) {
        case PRINTER_SIZES_REFID.PRINTER_58MM.ID:
          margins = window.settingsConfig[PRINTER_58_CONFIG - 1].value;
          break;
        case PRINTER_SIZES_REFID.PRINTER_80MM.ID:
          margins = window.settingsConfig[PRINTER_80_CONFIG - 1].value;
          break;
        default:
          break;
      }
      const pageConfig = {
        margins,
      };
      if (margins) {
        window.pageconfigProvided = true;
      } else {
        window.pageconfigProvided = false;
      }
      return pageConfig;
    }
  } catch (error) {}
}

/**
 * Print the worker window to a report printer
 */
function printtodaysReport({
  converttoPdf,
  storeDetails,
  sendBase64String,
  printReportWhileSendingOnMail,
  showLoader,
  report_type,
}) {
  let deviceName = '';
  let copies = 1;
  let size = 2;
  let activate = true;
  try {
    if (window.printersList[PRINTERS.REPORT - 1] != undefined) {
      deviceName = window.printersList[PRINTERS.REPORT - 1].device_name
        ? window.printersList[PRINTERS.REPORT - 1].device_name
        : '';
      copies = window.printersList[PRINTERS.REPORT - 1].no_of_prints;
      size = window.printersList[PRINTERS.REPORT - 1].printer_size;
      activate = window.printersList[PRINTERS.REPORT - 1].activate;
    }
  } catch (error) {}

  if (!activate) {
    setTimeout(() => {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:reportController.Reportprinterisdisabled'),
        0,
      );
    }, 500);
    return true;
  }
  let printData;
  if (deviceName) {
    printData = {
      content: $('#reportprintBodyid').html(),
      deviceName,
      silent: true,
      copies,
      size,
      type: 2,
      container: 'reportviewContainer',
      converttoPdf,
      storeDetails,
      sendBase64String,
      printReportWhileSendingOnMail,
      showLoader,
      report_type,
      pageconfigProvided: window.pageconfigProvided,
    };
  } else {
    printData = {
      content: $('#reportprintBodyid').html(),
      deviceName: '',
      silent: true,
      type: 2,
      converttoPdf,
      container: 'reportviewContainer',
      storeDetails,
      sendBase64String,
      printReportWhileSendingOnMail,
      showLoader,
      report_type,
      pageconfigProvided: window.pageconfigProvided,
    };
  }
  Object.assign(printData, {
    job_id: window.generateId(10),
  });
  console.log(
    `[ReportController] Messgae="Sending printing request" JobId="${printData?.job_id}"`,
  );
  window.betteripcRenderer.callMain(PRINTERS_IPC.PRINT_WINDOW_AYNC, printData);
}
/**
 *
 * @param {Bill details } data
 */
function addreportTablerow(data) {
  const table = $('#billsTable');
  let billNumber = data.bill_number;
  if (window.storeDetails.bill_number_prefix && data.custom_bill_number) {
    billNumber = data.custom_bill_number;
  }

  // in pascal case
  const order_state =
    data.order_state.charAt(0).toUpperCase() +
    data.order_state.slice(1).toLowerCase();

  table.append(
    `<tr><td>${billNumber}</td><td class="centerTextAlign">${
      data.quantity ? Number(data.quantity).toFixed(window.ROUNDOFF_UPTO) : 0
    }</td><td class="rightTextAlign">${Number(
      data.order_level_total_taxes,
    ).toFixed(
      ROUNDOFF_UPTO,
    )}</td><td class="rightTextAlign">${Number(data.discount).toFixed(window.ROUNDOFF_UPTO)}</td><td class="rightTextAlign">${Number(
      data.order_total,
    ).toFixed(
      ROUNDOFF_UPTO,
    )}</td><td class="rightTextAlign">${order_state}</td><td class="rightTextAlign">${
      data.payment ? data.payment : '-'
    }</td></tr>`,
  );
}

/**
 * Adds an item to the sold item table
 * @param {Sold item details} data
 */
function addSolditemtable_row(data) {
  const table = $('#solditemsTable');
  let { title } = data;
  if (window.selectedLanguage !== 'en' && data.alternative_title) {
    title = `${data.alternative_title}`;
  }
  if (isNaN(data.total)) data.total = 0;
  if (data.title === 'Total') {
    table.append(
      `<tr><td class="topBorder">` +
        `${data.finalPrice == 0 ? `${title} (complementary)` : title}` +
        `</td><td class="summaryTopBorder centerTextAlign">${Number(data.qty)}</td><td class="summaryTopBorder rightTextAlign itemReportAmountColumn">${Number(
          data.total,
        ).toFixed(window.ROUNDOFF_UPTO)}</td></tr>`,
    );
  } else {
    table.append(
      `<tr><td>` +
        `${data.finalPrice == 0 ? `${title} (complementary)` : title}` +
        `</td><td class="centerTextAlign">${Number(data.qty)}</td><td class="rightTextAlign itemReportAmountColumn">${Number(
          data.total,
        ).toFixed(window.ROUNDOFF_UPTO)}</td></tr>`,
    );
  }
}

// for close day close shift rpeort
function addSolditemtableCloseday_row(data) {
  const table = $('#solditemsCloseDayTable');
  table.append(
    `<tr><td>${data.title}</td><td>${data.qty}</td><td>${data.total}</td></tr>`,
  );
}

function adddeliveryBoy_row(data) {
  const table = $('#deliveryreportTable');
  table.append(
    `<tr><td>${data.delivery_boy_name}</td><td>${data.count}</td><td>${data.order_total}</td><td>${data.order_state}</td</tr>`,
  );
}

function addUserReport_row(data) {
  const table = $('#userreportTable');
  table.append(
    `<tr><td>${data.createdBy}</td><td>${data.count}</td><td>${data.amount}</td></tr>`,
  );
}

function addCancelleditemtable_row(data) {
  const table = $('#cancelleditemsTable');
  let { title } = data;
  if (window.selectedLanguage !== 'en' && data.alternative_title) {
    title = ` ${data.alternative_title}`;
  }
  if (title === 'Total') {
    table.append(
      `<tr><td class="topBorder">${title}</td><td class="centerTextAlign summaryBottomBorder">${data.qty}</td><td class="rightTextAlign summaryBottomBorder itemReportAmountColumn">${data.total.toFixed(window.ROUNDOFF_UPTO)}</td><td class="topBorder">${
        data.createdBy
      }</td><td class="rightTextAlign topBorder">${data.reason}</td></tr>`,
    );
  } else {
    table.append(
      `<tr><td>${title}</td><td class="centerTextAlign">${Number(data.qty)}</td><td class="rightTextAlign itemReportAmountColumn">${data.total}</td><td>${
        data.createdBy ? data.createdBy : '-'
      }</td><td class="rightTextAlign">${data.reason ? data.reason : '-'}</td></tr>`,
    );
  }
}

/**
 * Adds a payment info to the table
 * @param {Payment data to be added} data
 */
function addPaymenttable_row(data) {
  if (selectedLanguage == 'ar') {
    const paymentoption =
      ARABIC_PAYMENT_MODES[data.payment_option] || data.payment_option;
    data.payment_option = paymentoption;
  }

  let payment_option;
  let transactions;
  let amount;
  if (data.payment_option === 'Total') {
    payment_option = $('<td>', {
      html: data.payment_option,
      class: 'topBorder',
    });
    transactions = $('<td>', {
      html: data.transactions,
      class: 'summaryTopBorder centerTextAlign',
    });
    amount = $('<td>', {
      html: Number(data.amount).toFixed(window.ROUNDOFF_UPTO),
      class: 'summaryTopBorder rightTextAlign',
    });
  } else {
    payment_option = $('<td>', { html: data.payment_option });
    transactions = $('<td>', {
      html: data.transactions,
      class: 'centerTextAlign',
    });
    amount = $('<td>', {
      html: Number(data.amount).toFixed(window.ROUNDOFF_UPTO),
      class: 'rightTextAlign',
    });
  }
  const row = $('<tr>')
    .append(payment_option)
    .append(transactions)
    .append(amount);
  if (data.status) {
    const status = $('<td>', { html: data.status });
    row.append(status);
  }
  $('#reportpayTable').append(row);
}

/**
 * Adds a order from info to the table
 * @param {Payment data to be added} data
 */
function addorderfromtable_row(data) {
  const order_from = $('<td>', { html: data.order_from });
  const transactions = $('<td>', { html: data.transactions });
  const amount = $('<td>', { html: data.amount.toFixed(window.ROUNDOFF_UPTO) });
  const status = $('<td>', { html: data.status });
  const row = $('<tr>')
    .append(order_from)
    .append(transactions)
    .append(amount)
    .append(status);
  $('#orderreportTable').append(row);
}

/**
 * Adds a expense info to the table
 * @param {expense data to be added} data
 */
function addExpensetablerow(data) {
  const table = $('#expensesTable');
  table.append(
    `<tr><td>` +
      `${data.category_name}(${data.sub_category_name})` +
      `</td><td>${data.amount}</td></tr>`,
  );
}
/**
 * add's a row of data to category wise report
 * @param {Data} data
 */
function addDiscounteditemrow(data) {
  let title = data.title;
  if (window.selectedLanguage !== 'en' && data.alternative_title) {
    title = data.alternative_title;
  }
  const category = $('<td>', { html: title });
  const count = $('<td>', { html: data.qty });
  const discount = $('<td>', { html: data.totalDiscount });
  const price = $('<td>', { html: data.price });
  const row = $('<tr>')
    .append(category)
    .append(count)
    .append(discount)
    .append(price);
  $('#discounteditemsreportTable').append(row);
}

function addCategorieswithItems(catwisedataList, groupByBaseItem) {
  if (
    catwisedataList &&
    Array.isArray(catwisedataList) &&
    catwisedataList.length > 0
  ) {
    let categoryTotal = 0;
    catwisedataList.forEach((element) => {
      let categoryname = element.name;
      if (window.selectedLanguage !== 'en' && element.alternative_title) {
        categoryname = element.alternative_title;
      }
      const { items } = element;
      if (items && Array.isArray(items) && items.length > 0) {
        const catcontainer = $('<div>', {
          class: 'catreport-category-container',
        });
        const title = $('<div>', {
          html: `${categoryname}`,
          class: 'reportcat-title',
        });
        const allitemsContainer = $('<div>');

        const overallcontainer = $('<div>', {
          class: 'd-flex-reverse catreport-overall-container',
        });

        let totalItems = 0;
        let allitemstotal = 0;

        items.forEach((item) => {
          let itemname = item.title;
          if (window.selectedLanguage !== 'en' && item.alternative_title) {
            itemname = item.alternative_title;
          }

          if (item && item.extra_details) {
            const extra_details = safeParse(item.extra_details);
            if (
              window.selectedLanguage == 'en' &&
              extra_details.baseTitle &&
              groupByBaseItem
            ) {
              itemname = extra_details.baseTitle;
            }
          }
          const itemsContainer = $('<div>', {
            class: 'd-flex catreport-itemcontainer',
          });
          const itemTitle = $('<div>', {
            html: `${itemname}`,
            class: 'catreport-itemcontainer-title',
          });
          const itemQtys = $('<div>', {
            html: `${item.count}`,
            class: 'catreport-itemcontainer-qty',
          });
          const itemAmount = $('<div>', {
            html: `${item.total}`,
            class: 'catreport-itemcontainer-total',
          });
          itemsContainer.append(itemTitle);
          itemsContainer.append(itemQtys);
          itemsContainer.append(itemAmount);
          allitemsContainer.append(itemsContainer);

          totalItems += Number(item.count);
          allitemstotal += Number(item.total);
        });
        // overallcontainer
        const totalItemsContainer = $('<div>', {
          html: `${Number(totalItems).toFixed(window.ROUNDOFF_UPTO)}`,
          class: 'catreport-overallitems-count',
        });
        const allitemstotalContainer = $('<div>', {
          html: `${Number(allitemstotal).toFixed(window.ROUNDOFF_UPTO)}`,
          class: 'catreport-overallitems-count',
        });
        overallcontainer.append(totalItemsContainer);
        overallcontainer.append(allitemstotalContainer);

        catcontainer.append(title);
        catcontainer.append(allitemsContainer);
        catcontainer.append(overallcontainer);
        $('#disposable-catitem-report-containerid').append(catcontainer);
      }
      categoryTotal += Number(element.total);
    });
    const allcatoverallinfoContainer = $('<div>', {
      class: 'd-flex-reverse allcatoverallinfo-container',
    });
    const allcatstotalContainer = $('<div>', {
      html: `Total:`,
      class: 'total-label',
    });
    const allcatstotalamountContainer = $('<div>', {
      html: `${currency} ${Number(categoryTotal).toFixed(window.ROUNDOFF_UPTO)}`,
      class: 'pl-2 total-amount',
    });
    allcatoverallinfoContainer.append(allcatstotalContainer);
    allcatoverallinfoContainer.append(allcatstotalamountContainer);
    $('#disposable-catitem-report-containerid').append(
      allcatoverallinfoContainer,
    );
  }
}

/**
 * add's a row of data to category wise report
 * @param {Data} data
 */
function addCatwisereportrow(data) {
  let catName = data.name || data.category_name;
  if (window.selectedLanguage !== 'en' && data.alternative_title) {
    catName = data.alternative_title;
  }
  const category = $('<td>', { html: catName });
  const count = $('<td>', {
    html: Number(data.count),
    class: 'centerTextAlign',
  });
  const amount = $('<td>', { html: data.total, class: 'rightTextAlign' });
  const row = $('<tr>').append(category).append(count).append(amount);
  $('#catwisereportTable').append(row);
}
/**
 * add's a row of data to category wise report
 * @param {Data} data
 */
function addCouponhistoryreportrow(data) {
  const coupon = $('<td>', { html: data.coupon_code });
  const customer = $('<td>', {
    html: `${data.customer_name}(${data.customer_phone})`,
  });
  const amount = $('<td>', { html: data.coupon_code_amt });
  const row = $('<tr>').append(coupon).append(customer).append(amount);
  $('#couponhistoryreportTable').append(row);
}

/**
 * add's a row of data to category wise report
 * @param {Data} data
 */
function addkdwisereportrow(data) {
  const category = $('<td>', { html: data.name });
  const count = $('<td>', { html: data.count });
  const amount = $('<td>', { html: data.total });
  const row = $('<tr>').append(category).append(count).append(amount);
  $('#kdwisereportTable').append(row);
}

/**
 * add's a row of data to category wise report
 * @param {Data} data
 */
function addbillprintreportrow(data) {
  const orderid = $('<td>', { html: data.order_id });
  const type = $('<td>', { html: data.billing_type });
  const amount = $('<td>', { html: data.order_total });
  const status = $('<td>', { html: data.order_state });
  const printcount = $('<td>', { html: data.print_status });
  const row = $('<tr>')
    .append(orderid)
    .append(type)
    // .append(amount)
    .append(status)
    .append(printcount);
  $('#billprintreportTable').append(row);
}

// vat report
function addtaxprintreportrow(data) {
  const category = $('<td>', { html: data.Category });
  const price = $('<td>', { html: data.Price });
  const orders = $('<td>', { html: data.Orders });
  const taxPer = $('<td>', { html: data.TaxPer });
  const taxTotal = $('<td>', { html: data.Tax });
  const total = $('<td>', { html: data.Total });

  const row = $('<tr>')
    .append(category)
    .append(price)
    .append(orders)
    .append(taxPer)
    .append(taxTotal)
    .append(total);

  $('#taxprintreportTable').append(row);
}

/**
 * add's a row of data to report
 * @param {Data} data
 */
function addappliedchargereportrow(data) {
  const orderid = $('<td>', { html: data.order_id });
  const title = $('<td>', { html: data.title });
  const chargeamount = $('<td>', { html: data.value });
  const statusLabel = $('<td>', {
    html: data.status_flag === 0 ? 'Applied' : 'Deleted',
  });
  const row = $('<tr>')
    .append(orderid)
    .append(title)
    .append(chargeamount)
    .append(statusLabel);
  $('#appliedchargesreportTable').append(row);
}

function addduepaytablerow(data) {
  const customer = $('<td>', {
    html: `${data.cust_name ? data.cust_name : ''}-${data.cust_mobile}`,
  });
  const due_amount = $('<td>', { html: data.due_amount });
  const orderid = $('<td>', { html: `${data.order_id ? data.order_id : '-'}` });
  const row = $('<tr>').append(customer).append(due_amount).append(orderid);
  $('#duepaymentreportTable').append(row);
}

function addPreorderreportrow(data) {
  const customerInfolabel = $('<td>', { html: `${data.customer_name || ''}` });
  const customerphonelabel = $('<td>', {
    html: `${data.customer_mobile || ''}`,
  });
  const status = $('<td>', { html: data.status });
  const row = $('<tr>')
    .append(customerInfolabel)
    .append(customerphonelabel)
    .append(status);
  $('#preorderprintreportTableid').append(row);
}

window.redrawReportview = async function () {
  generateReportview();
};

Initialize();
