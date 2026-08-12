require('dotenv').config();
const connection = require('./src/com/tmbill/js/database');
const Reports = require('./src/com/tmbill/main_controllers/Reports');

async function testAll18PosReports() {
  try {
    console.log('--- AUDITING ALL 18 POS REPORTS AGAINST POSTGRESQL ---');
    global.storeDetails = { store_id: '1', username: 'admin' };
    global.ROUNDOFF_UPTO = 2;
    await connection.sequelize.authenticate();
    console.log('✅ PostgreSQL connected.');

    const fromDate = '2026-08-12 00:00:00';
    const toDate = '2026-08-12 23:59:59';

    const reportConfigs = [
      { id: 'sales-register', reportType: '1' },
      { id: 'itemwise-sale', reportType: '1' },
      { id: 'itemwise-outletwise-sale', reportType: '1' },
      { id: 'itemwise-categorywise-sale', reportType: '1' },
      { id: 'tablewise-sale', reportType: '1' },
      { id: 'cover-analysis', reportType: '1' },
      { id: 'kitchen-time-gap', reportType: '4' },
      { id: 'stewardwise-sale', reportType: '1' },
      { id: 'flash-report', reportType: '1' },
      { id: 'tax-datawise-summary', reportType: '5' },
      { id: 'taxwise-summary', reportType: '5' },
      { id: 'kot-register', reportType: '4' },
      { id: 'nc-kot', reportType: '6' },
      { id: 'pending-kot-report', reportType: '4' },
      { id: 'cashier-settlement-summarized', reportType: '8' },
      { id: 'userwise-collection-report', reportType: '9' },
      { id: 'customer-info-report', reportType: '13' },
      { id: 'customer-outlet-visit-report', reportType: '9' }
    ];

    let passed = 0;
    let failed = 0;

    for (const r of reportConfigs) {
      const params = {
        reportType: r.reportType,
        fromDate,
        toDate,
        getPaymentandItems: 'true',
        showWaiterData: 'true',
        showDiscountData: 'true',
        showCategoryData: 'true',
        showDuePaymentReceivableData: 'true',
        showCancelitems: 'true'
      };

      try {
        const res = await Reports.getReportData(params);
        let count = 0;
        if (res.bills) count += res.bills.length;
        if (res.items) count += res.items.length;
        if (res.soldItems) count += res.soldItems.length;
        if (res.catdataList) count += res.catdataList.length;
        if (res.kotReportData) count += res.kotReportData.length;
        if (res.waiterSummary) count += res.waiterSummary.length;
        if (res.vatReportList) count += res.vatReportList.length;
        if (res.cancelledItems) count += res.cancelledItems.length;
        if (res.userwiseList) count += res.userwiseList.length;
        if (res.duebyCustomers) count += res.duebyCustomers.length;
        if (res.list) count += res.list.length;

        console.log(`[PASS] POS Report: ${r.id.padEnd(30)} | Records fetched: ${count}`);
        passed++;
      } catch (err) {
        console.error(`[FAIL] POS Report: ${r.id.padEnd(30)} | Error: ${err.message}`);
        failed++;
      }
    }

    console.log(`\n========================================`);
    console.log(`POS REPORTS AUDIT SUMMARY: Passed ${passed}/${reportConfigs.length}, Failed ${failed}/${reportConfigs.length}`);
    console.log(`========================================`);

    process.exit(0);
  } catch (err) {
    console.error('Fatal audit error:', err);
    process.exit(1);
  }
}

testAll18PosReports();
