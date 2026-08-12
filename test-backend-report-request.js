require('dotenv').config();
const connection = require('./src/com/tmbill/js/database');
const Reports = require('./src/com/tmbill/main_controllers/Reports');

async function testBackendRequest() {
  await connection.sequelize.authenticate();
  global.storeDetails = { store_id: 1, username: 'admin' };
  global.ROUNDOFF_UPTO = 2;

  const testParams = {
    reportType: "1",
    fromDate: "2026-08-12 00:00:00",
    toDate: "2026-08-12 23:59:59",
    getPaymentandItems: "true",
    showWaiterData: "true",
    showDiscountData: "true",
    showCategoryData: "true",
    showDuePaymentReceivableData: "true",
    showCancelitems: "true"
  };

  console.log('--- TESTING BACKEND getReportData WITH USER PARAMS ---');
  try {
    const response = await Reports.getReportData(testParams);
    console.log('Response status:', response.status);
    console.log('Bills count in response:', response.bills ? response.bills.length : 'undefined');
    if (response.bills && response.bills.length > 0) {
      console.log('Sample Bill:', {
        bill_number: response.bills[0].bill_number,
        custom_bill_number: response.bills[0].custom_bill_number,
        order_total: response.bills[0].order_total,
        created_time: response.bills[0].created_time
      });
    }
  } catch (err) {
    console.error('❌ Error executing getReportData:', err);
  }

  process.exit(0);
}

testBackendRequest();
