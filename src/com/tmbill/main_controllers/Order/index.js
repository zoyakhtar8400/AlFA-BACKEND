/* eslint-disable camelcase */
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

const connection = require('../../js/database');
const {
  syncCustomersifany,
  sendLivesyncrequest,
} = require('../../services/SyncService');
const {
  updateWaitertipDetails,
  addCustomer,
  updateCustomerforanorder,
} = require('../Order');

async function updateQRCodeinorder(params) {
  if (params) {
    try {
      if (params && params.code) {
        const result = await connection.Bill.update(
          {
            field2: params.code,
          },
          {
            where: {
              order_id: params.order_id,
            },
          },
        );
        return result;
      }
    } catch (err) {
      console.log(err);
    }
  }
}

async function checkIfOrderIsPulled(order_id) {
  if (order_id) {
    try {
      const isOrderPulled = await connection.Bill.findOne({
        raw: true,
        where: {
          order_id,
        },
      });
      return isOrderPulled;
    } catch (error) {}
  }
}

async function checkIfRemoteKotIsPulled(kot_uniqueid) {
  if (kot_uniqueid) {
    try {
      const isOrderPulled = await connection.KOT.findOne({
        raw: true,
        where: {
          kot_uniqueid,
        },
      });
      return isOrderPulled;
    } catch (error) {}
  }
}

// check if order is saved or not
async function checkIsOrderSaved(params) {
  if (params) {
    try {
      if (params && params.table_id) {
        const result = await connection.Bill.findOne({
          raw: true,
          where: {
            table_id: params.table_id,
            store_id: params.store_id,
            order_state: 'pending',
          },
        });
        return result;
      }
    } catch (err) {
      console.log(err);
    }
  }
}

async function updateTipAmountForRemoteOrder(params) {
  try {
    // first check order is saved or not is not saved then try again
    const doesbillExists = await connection.Bill.findOne({
      raw: true,
      where: {
        // table_id: params.table_id,
        order_id: params.order_id,
      },
    });

    if (!doesbillExists) {
      updateTipAmountForRemoteOrder(params);
    }

    if (doesbillExists) {
      if (doesbillExists.extra_details && params.tip_amount) {
        let order_extra_details = doesbillExists.extra_details;
        order_extra_details = JSON.parse(order_extra_details);
        Object.assign(order_extra_details, {
          total_tip: params.tip_amount,
        });
        const extra_details = order_extra_details;
        // let extra_details = JSON.stringify(order_extra_details);
        await connection.Bill.update(
          { extra_details },
          {
            where: {
              order_id: doesbillExists.order_id,
            },
          },
        );
      } else {
        const extra_details = {
          total_tip: params.tip_amount,
        };
        await connection.Bill.update(
          { extra_details },
          {
            where: {
              order_id: doesbillExists.order_id,
            },
          },
        );
      }

      let waitertipResult;
      if (Number(params.tip_amount)) {
        const waiterTipDetails = {
          store_id: doesbillExists.store_id,
          order_id: params.order_id,
          amount: params.tip_amount,
          waiter: doesbillExists.waiter,
          waiter_id: doesbillExists.waiter_id,
        };

        waitertipResult = await updateWaitertipDetails(waiterTipDetails);
      } else {
        let order_extra_details = doesbillExists.extra_details;
        order_extra_details = JSON.parse(order_extra_details);

        Object.assign(order_extra_details, {
          total_tip: params.tip_amount,
        });

        const extra_details = order_extra_details;
        await connection.Bill.update(
          { extra_details },
          {
            where: {
              order_id: params.order_id,
            },
          },
        );
        await connection.OrderTip.destroy({
          where: {
            order_id: doesbillExists.order_id,
          },
        });
      }

      return waitertipResult;
    }
  } catch (err) {
    console.log(err);
  }
}

async function getTableidOfOrder(params) {
  try {
    const result = await connection.Bill.findOne({
      raw: true,
      attributes: ['table_id'],
      where: {
        order_id: params.order_id,
      },
    });
    if (result) {
      return result.table_id;
    }
  } catch (error) {}
}

async function updateCustomerAddress(params) {
  const result = await addCustomer(params.customer);
  if (result && result.status === 200 && result.customer) {
    if (params.miscData) {
      const { miscData } = params;
      const customerupdateData = {
        order_id: miscData.order_id,
        customer: result.customer,
        table_id: miscData.table_id,
      };
      await updateCustomerforanorder(customerupdateData);
    }
  }
  syncCustomersifany({
    connection,
    store_id: global.storeDetails.store_id,
  });
  return result;
}

async function updateOrderDataAsPerPaymentInfo(content) {
  if (content) {
    // let phoneNumber = content.payment.cust_phone;
    let phoneNumber = '';
    let custName;
    const cust_Name = content?.payment?.cust_name;
    if (cust_Name) {
      custName = cust_Name;
    }
    if (
      content &&
      content.payment &&
      content.payment.cust_phone &&
      content.payment.cust_phone.length === 12
    ) {
      if (String(content.payment.cust_phone).startsWith(91)) {
        phoneNumber = String(content.payment.cust_phone).substring(2);
      }
    }
    const customerData = {
      phone: phoneNumber,
      email: '',
      store_id: global.storeDetails.store_id,
      address_line1: '',
      address_line2: '',
      city: '',
      createdDate: global.moment().format('YYYY-MM-DD'),
    };

    if (content.payment.cust_name) {
      Object.assign(customerData, {
        name: content.payment.cust_name,
      });
    }

    const findCustomer = await connection.KOT.findOne({
      raw: true,
      where: {
        bill_number: content.order_id,
      },
    });

    if (findCustomer && findCustomer.name) {
      custName = findCustomer.name;
    }

    if (
      findCustomer &&
      !findCustomer.customer_name &&
      findCustomer.customer_mobile &&
      findCustomer.customer_mobile != 9090909090
    ) {
      phoneNumber = findCustomer.customer_mobile;

      Object.assign(customerData, {
        name: content.payment.cust_name,
        phone: phoneNumber,
      });
    }

    const customerResult = await addCustomer(customerData);
    const { customer } = customerResult;
    if (
      findCustomer &&
      // findCustomer.customer_name !== content.payment.cust_name
      !findCustomer.customer_name
    ) {
      global.mainWindow.webContents.send('update-customer-to-table', {
        customer,
        table_id: findCustomer.table_id,
      });

      // update customer to kot
      await connection.KOT.update(
        {
          customer_id: customer.id,
          customer_name: customer.name,
          customer_mobile: customer.phone,
        },
        {
          where: {
            bill_number: content.order_id,
          },
        },
      );
    }

    await connection.Bill.update(
      {
        payment: content.mode || 'UPI',
        cust_name: custName,
        sync_status: 0,
      },
      {
        where: {
          order_id: content.order_id,
        },
      },
    );

    // update payment info and customer of order
    if (content && content.payment && content.payment.amount) {
      // destroy payment
      await connection.BillPayment.destroy({
        where: {
          order_id: content.order_id,
        },
      });

      // create payment
      const paymentData = {
        order_id: content.order_id,
        payment_option: content.mode || 'UPI',
        amount: content.payment.amount,
        status_flag: 0,
      };

      await connection.BillPayment.create(paymentData);
    } else {
      // update order payment mode
      await connection.BillPayment.update(
        {
          payment_option: content.mode || 'UPI',
        },
        {
          where: {
            order_id: content.order_id,
          },
        },
      );
    }

    // fetch table id to settle bill
    const tableId = await connection.Bill.findOne({
      attributes: ['table_id', 'table_name'],
      raw: true,
      where: {
        order_id: content.order_id,
      },
    });
    sendLivesyncrequest();
    return tableId;
  }
  return undefined;
}
async function getPayments(params) {
  const response = {};
  let payments = [];
  try {
    const data = params;
    response.addPaymenttolist = data.addPaymenttolist;
    response.showPaymentWindow = data.showPaymentWindow;

    payments = await connection.Payment.findAll({
      raw: true,
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        store_id: global.storeDetails.store_id,
      },
    });
  } catch (error) {
    payments = [];
  }
  response.payments = payments;
  return response;
}

// function saveBillPrintImage(params) {
//   const invoicesDir = path.join(app.getPath('userData'), 'public', 'invoices');
//   fs.mkdirSync(invoicesDir, { recursive: true });
//   const filePath = path.join(invoicesDir, params.fileName);
//   fs.writeFileSync(filePath, params.pdfBuffer.toJPEG(100));

//   return filePath;
// }

// In your main process (e.g., where you handle IPC)
function saveBillPrintImage(params) {
  const { fileName, buffer, format = 'png' } = params; // default to png

  // Validate inputs
  if (!fileName || !buffer) {
    throw new Error('Missing fileName or buffer');
  }

  const invoicesDir = path.join(app.getPath('userData'), 'public', 'invoices');
  fs.mkdirSync(invoicesDir, { recursive: true });

  let filePath = path.join(invoicesDir, fileName);

  let finalBuffer = buffer;

  // Optional: Convert to JPEG if needed (not recommended for bills — PNG is sharper for text)
  if (format === 'jpeg' || format === 'jpg') {
    // If it's already a PNG Image (from capturePage), convert
    if (typeof buffer.toJPEG === 'function') {
      finalBuffer = buffer.toJPEG(90); // 90% quality is good balance
    } else {
      // If it's already a JPEG buffer, just use it
      // Or if sharp is available, you could re-encode, but unnecessary
    }
    // Ensure correct extension
    const newFileName = fileName.replace(/\.(png|jpg|jpeg)$/i, '.jpg');
    if (newFileName !== fileName) {
      filePath = path.join(invoicesDir, newFileName);
    }
  }

  // Write the buffer directly — it's already in the correct format
  fs.writeFileSync(filePath, finalBuffer);

  return filePath;
}

async function clearInvoicesDirectory() {
  const invoicesDir = path.join(app.getPath('userData'), 'public', 'invoices');

  try {
    if (fs.existsSync(invoicesDir)) {
      const files = fs.readdirSync(invoicesDir);

      for (const file of files) {
        const filePath = path.join(invoicesDir, file);
        try {
          fs.unlinkSync(filePath); // Delete file
        } catch (err) {
          console.error(`Failed to delete ${filePath}:`, err);
        }
      }

      console.log('All invoice files deleted.');
    }
  } catch (err) {
    console.error('Failed to delete invoice files:', err);
  }
}
module.exports = {
  getTableidOfOrder,
  checkIfOrderIsPulled,
  updateQRCodeinorder,
  checkIsOrderSaved,
  updateTipAmountForRemoteOrder,
  updateCustomerAddress,
  updateOrderDataAsPerPaymentInfo,
  getPayments,
  saveBillPrintImage,
  clearInvoicesDirectory,
  checkIfRemoteKotIsPulled,
};
