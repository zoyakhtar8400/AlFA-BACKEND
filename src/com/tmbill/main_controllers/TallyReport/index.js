/* eslint-disable camelcase */
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  Bill,
  BillItem,
  BillItemOption,
  Orderchildcharges,
  BillPayment,
  BillCharges,
  SectionwiseDiscounthistory,
} = require('../../js/database');
const { SEND_GENERATE_XML_REQUEST } = require('../../util/IPC_Messages');
// const xmlbuilder = require('xmlbuilder');
async function exportTallyReport(data) {
  try {
    // const xmlContent = xmlbuilder.create('root')
    // .ele('item', content)
    // .end({ pretty: true });

    const { content, order_id } = data;

    const userHomeDir = os.homedir();

    const targetDirectory = `${userHomeDir}/TMBill-Tally`;
    const fileName = `${order_id}.xml`;
    const filePath = path.join(targetDirectory, fileName);

    // Check if the target directory exists
    if (!fs.existsSync(targetDirectory)) {
      // If it doesn't exist, create the directory
      fs.mkdirSync(targetDirectory, { recursive: true });
    }
    // Write XML content to the file

    // fs.writeFileSync(filePath, content);
    fs.writeFile(filePath, content, (err) => {
      if (err) {
        console.error(err);
        return 'error';
      }
      return 'sucess';
    });
  } catch (error) {
    console.error(error);
  }
}

async function generateTallyXML(order_id) {
  try {
    const currentBillitemData = await Bill.findOne({
      attributes: [
        'id',
        'order_id',
        'store_id',
        'discount',
        'order_level_total_charges',
        'order_level_total_taxes',
        'order_subtotal',
        'order_total',
        'my_order_date',
        'created_time',
        'payment',
        'persons',
        'bill_number',
        'total_external_discount',
        'couponDisount',
        'couponDisounttype',
        'coupon',
        'couponDisounttotal',
        'due_payment',
        'cust_paid_amount',
        'charges_level_total_tax',
        'custom_bill_number',
        'extra_details',
        'createdBy',
        'item_level_total_charges',
        'charges',
        'discount_title',
      ],
      // group: ['order_id'],
      // group: ['mpos_order.order_id'],
      where: {
        order_id,
        store_id: global.storeDetails.store_id,
      },
      include: [
        {
          as: 'tmpos_order_child',
          model: BillItem,
          include: [
            {
              as: 'order_child_options',
              model: BillItemOption,
            },
            {
              as: 'order_child_charges',
              model: Orderchildcharges,
            },
          ],
        },
        {
          as: 'tmpos_order_payment',
          model: BillPayment,
        },
        {
          as: 'tmpos_order_charges',
          model: BillCharges,
        },
        {
          as: 'discountHistory',
          model: SectionwiseDiscounthistory,
        },
      ],
      order: ['id'],
    });

    const currentBillitem = currentBillitemData.get({ plain: true });

    // if (syncbillsList && syncbillsList.length) {
    //   for (let index = 0; index < syncbillsList.length; index++) {
    //     const rawcurrentBillitem = syncbillsList[index];
    //     const currentBillitem = rawcurrentBillitem.get({ plain: true });

    // currentBillitem.quantity = currentBillitem.tmpos_order_child.length;
    currentBillitem.orderchildList = currentBillitem.tmpos_order_child;
    currentBillitem.orderPaymentList = currentBillitem.tmpos_order_payment;
    currentBillitem.all_charge_order_list = currentBillitem.tmpos_order_charges;

    delete currentBillitem.tmpos_order_child;
    delete currentBillitem.tmpos_order_payment;
    delete currentBillitem.tmpos_order_charges;
    delete currentBillitem.mpos_order_tip;

    if (currentBillitem.extra_details) {
      try {
        Object.assign(currentBillitem, {
          extra_details: currentBillitem.extra_details,
        });
      } catch (error) {
        console.error(error);
      }
    }

    currentBillitem.created_time = global
      .moment(currentBillitem.created_time)
      .format('YYYY-MM-DD HH:mm:ss');

    currentBillitem.my_order_time = global
      .moment(currentBillitem.created_time)
      .format('HH:mm:ss');

    // Items Mapping
    if (
      currentBillitem.orderchildList &&
      currentBillitem.orderchildList.length
    ) {
      for (
        let index = 0;
        index < currentBillitem.orderchildList.length;
        // eslint-disable-next-line no-plusplus
        index++
      ) {
        const item = currentBillitem.orderchildList[index];

        item.order_option_list = item.order_child_options;
        item.itemlevelCharges = item.order_child_charges;

        delete item.order_child_options;
        delete item.order_child_charges;
      }
    }
    // }
    // }

    if (currentBillitem && currentBillitem.id) {
      global.mainWindow.webContents.send(SEND_GENERATE_XML_REQUEST, {
        order_data: currentBillitem,
      });
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  exportTallyReport,
  generateTallyXML,
};
