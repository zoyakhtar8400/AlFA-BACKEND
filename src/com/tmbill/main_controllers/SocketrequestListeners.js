/* eslint-disable camelcase */
const { ORDER, PRINT, KDS, GLOBAL_EVENT } = require('../server/SocketEvents');
const connection = require('../js/database');
const { OrderTypes, BillingTypes } = require('../util/DBUtil');
const { CHARGE_BILL_TYPES } = require('../util/Constants');
let ipcMain;
try {
  // eslint-disable-next-line global-require
  ipcMain = require('electron').ipcMain;
} catch (e) {
  ipcMain = null;
}
const { safeParseformain, sleep } = require('./Utils');
const { safeParse } = require('../util/RendererUtils');
const { OFFLINE_ORDERSTATES } = require('../util/OrderStates');
const TableUtils = require('../util/TableUtils');

async function sendKOTPrintrequest(params) {
  try {
    global.mainWindow.webContents.send(PRINT.KOT, params);
  } catch (error) {
    console.log(error);
  }
}

async function kotitemstatusChanged(params) {
  try {
    global.mainWindow.webContents.send(KDS.ITEM_STATUS_CHANGED, params);
  } catch (error) {
    console.log(error);
  }
}

async function sendbillPrintrequest(params) {
  try {
    const stringConstructor = 'test'.constructor;
    if (params.constructor === stringConstructor) {
      params = JSON.parse(params);
    }

    const data = await getBillpreviewdetails(params.table_id);
    data.currenttabId = params.currenttabId;
    data.table_id = params.table_id;
    data.tableName = params.table_name;
    if (!data.tableName) {
      data.tableName = data.table_name;
    }
    if (!data.tableDepartmentSection) {
      data.tableDepartmentSection = params.tableDepartmentSection;
    }
    if (params.extra_details) {
      data.extra_details = params.extra_details;
    }
    if (params.isTerminalPrint) {
      data.isdraftBill = false;
    }
    if (params.is_Draft_bill) {
      data.isdraftBill = true;
    }
    if (params.doNotPrintBill) {
      data.doNotPrintBill = true;
    }
    if (!params.isTerminalPrint) {
      data.printFromCsk = true;
    }

    if (params.sendImageToCSK || params.printBillOnBothSide) {
      data.printBillOnBothSide = params.printBillOnBothSide;
      data.sendImageToCSK = params.sendImageToCSK;
      data.socketUserId = params.socketUserId;
      data.cskPrintEvent = params.cskPrintEvent;
      data.printWidth = params.printWidth || 2;
    }
    // data.sendImageToCSK = true;
    // add table Namec
    global.mainWindow.webContents.send(PRINT.BILL, JSON.stringify(data));
  } catch (error) {
    console.log(error);
  }
}

async function sendSettledbillPrintrequest(params) {
  try {
    const stringConstructor = 'test'.constructor;
    if (params.constructor === stringConstructor) {
      params = safeParseformain(params);
    }
    const data = await getSettledBillpreviewdetails(params.order_id);
    data.currenttabId = params.currenttabId;
    data.settledBillPrint = true;
    data.table_id = params.table_id;
    data.tableName = params.table_name;
    data.isOldbill = params.isOldbill;
    if (!params.table_name && String(params.billingType)) {
      // data.tableName = BillingTypes[params.billingType];
      data.tableName = global.orderTypes[Number(params.billingType)].order_type;
    }
    // if (params.extra_details) {
    //   data.extra_details = params.extra_details;
    // }
    // if (params.isTerminalPrint) {
    data.isdraftBill = false;
    // }
    // if (params.is_Draft_bill) {
    //   data.isdraftBill = true;
    // }
    // if (params.doNotPrintBill) {
    //   data.doNotPrintBill = true;
    // }
    if (!params.printFromCsk) {
      data.printFromCsk = true;
    } else {
      data.printFromCsk = params.printFromCsk;
    }
    // add table Name
    global.mainWindow.webContents.send(PRINT.BILL, JSON.stringify(data));
  } catch (error) {
    console.log(error);
  }
}

if (ipcMain) {
  ipcMain.on('print-settled-bill', (event, data) => {
    sendSettledbillPrintrequest(data);
  });
}

async function sendQuickBillPrintRequest(params) {
  global.mainWindow.webContents.send(PRINT.QUICK_BILL_PRINT, params);
}
async function newkotHasbeenplaced(params) {
  try {
    global.mainWindow.webContents.send(ORDER.KOT_SAVED, params);
  } catch (error) {
    console.log(error);
  }
}

async function newkotHasbeenUpdated(params) {
  try {
    global.mainWindow.webContents.send(KDS.KOT_UPDATED, params);
  } catch (error) {
    console.log(error);
  }
}

async function newbillhasbeenSaved(params) {
  try {
    global.mainWindow.webContents.send(ORDER.BILL_SAVED, params);
  } catch (error) {
    console.log(error);
  }
}

async function handleKotUpdatedRequest(params) {
  try {
    global.mainWindow.webContents.send(ORDER.KOT_UPDATED, params);
  } catch (error) {
    console.log(error);
  }
}

async function newbillhasbeenSavedAndPrint(params) {
  try {
    global.mainWindow.webContents.send(ORDER.SAVE_AND_PRINT_BILL, params);
  } catch (error) {
    console.log(error);
  }
}

async function newbillhasbeenSettled(params) {
  try {
    global.mainWindow.webContents.send(ORDER.BILL_SETTLED, params);
  } catch (error) {
    console.log(error);
  }
}

async function captainMessagereceived(params) {
  try {
    global.mainWindow.webContents.send(ORDER.MESSAGE, params);
  } catch (error) {
    console.log(error);
  }
}

async function chargesupdatedonTable(params) {
  try {
    global.mainWindow.webContents.send(ORDER.CHARGES_UPDATED, params);
  } catch (error) {
    console.log(error);
  }
}

async function handleTableSplitted(params) {
  try {
    global.mainWindow.webContents.send(ORDER.TABLE_SPLITTED, params);
  } catch (error) {
    console.log(error);
  }
}

async function handleTableMerged(params) {
  try {
    const data = safeParse(params);
    if (data.is_kot_placed) {
      await connection.Table.update(
        {
          table_color: TableUtils.Colors.KOT_SAVED,
          order_state: OFFLINE_ORDERSTATES.PLACED,
        },
        {
          where: {
            id: data.parent_table_id,
          },
        },
      );
    }
    global.mainWindow.webContents.send(ORDER.TABLE_MERGED, params);
  } catch (error) {
    console.log(error);
  }
}

async function handleTableChanged(params) {
  try {
    global.mainWindow.webContents.send(ORDER.TABLE_CHANGED, params);
  } catch (error) {
    console.log(error);
  }
}

async function handleTableClicked(params) {
  try {
    global.mainWindow.webContents.send(ORDER.TABLE_CLICKED, params);
  } catch (error) {
    console.log(error);
  }
}

async function handleUpdateTableDetails(params) {
  try {
    global.mainWindow.webContents.send(ORDER.UPDATE_TABLE_DETAILS, params);
  } catch (error) {
    console.log(error);
  }
}

async function handleOrderUpdatedFromOrderSettlementwindow(params) {
  try {
    global.mainWindow.webContents.send(
      ORDER.ORDER_UPDATED_FROM_SETTLMENT_WINDOW,
      params,
    );
  } catch (error) {
    console.log(error);
  }
}

async function handleRefreshTable(params) {
  try {
    global.mainWindow.webContents.send(ORDER.REFRESH_TABLES, params);
  } catch (error) {
    console.log(error);
  }
}

async function handleCustomerUpdated(params) {
  try {
    global.mainWindow.webContents.send(GLOBAL_EVENT.CUSTOMER_UPDATED, params);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Get preview details for bill print
 * @param {Table ID} table_id
 */
async function getBillpreviewdetails(table_id) {
  let previewDetails;
  try {
    const kotResult = await global.serverdbConnection.KOT.findAll({
      where: {
        table_id,
        is_active: 1,
      },
      raw: true,
    });
    if (kotResult != undefined && kotResult.length > 0) {
      previewDetails = {};
      previewDetails.discount_type = kotResult[0].discount_type;
      previewDetails.discount = kotResult[0].discount_rate;
      previewDetails.discounted_product_groups =
        kotResult[0].discounted_product_groups;
      previewDetails.discount_title = kotResult[0].discount_title;
      previewDetails.isdraftBill = true;
      previewDetails.order_type_flag = 'Dine in';
      previewDetails.order_type_flag = OrderTypes[kotResult[0].billing_type];
      previewDetails.billType = kotResult[0].billing_type;
      previewDetails.bill_number = kotResult[0].bill_number;
      previewDetails.kot_id = kotResult[0].kot_id;
      previewDetails.order_id = kotResult[0].order_id;
      previewDetails.showCustomerinfo = kotResult[0].showCustomeronbill;
      previewDetails.is_pre_order = kotResult[0].is_pre_order;
      previewDetails.custom_bill_number = kotResult[0].custom_bill_number;
      // previewDetails.createdBy = kotResult[0].createdBy;
      previewDetails.waiter = kotResult[0].waiter;
      previewDetails.waiter_id = kotResult[0].waiter_id;
      previewDetails.persons = kotResult[0].persons;
      previewDetails.createdBy = kotResult[0].createdBy;
      previewDetails.kotcreatedAt = kotResult[0].actual_in_time;
      previewDetails.order_note = kotResult[0].field3;
      previewDetails.instructions = kotResult[0].field1;
      previewDetails.coupon = kotResult[0].coupon;
      previewDetails.couponDisountamt = kotResult[0].couponDisount;
      previewDetails.couponDisounttype = kotResult[0].couponDisounttype;
      previewDetails.paymentAdded = true;

      previewDetails.applyDefaultcharges =
        kotResult[0].field2 == 0 || kotResult[0].field2 == null;
      if (kotResult[0].deliveryboy_id && kotResult[0].billing_type === 3) {
        const deliveryBoy = global.deliveryBoys.find(
          (d) => d.id === kotResult[0].deliveryboy_id,
        );
        if (deliveryBoy) {
          Object.assign(previewDetails, {
            deliveryboyName: deliveryBoy.name,
          });
          Object.assign(previewDetails, {
            delivery_boy_name: deliveryBoy.name,
          });
        }
      }

      if (kotResult[0].extra_details) {
        const extra_details = safeParse(kotResult[0].extra_details);
        previewDetails.extra_details = extra_details;
      }

      const kot_numbers = [];
      kotResult.map((kot) => {
        kot_numbers.push(kot.kot_number);
      });

      previewDetails.kot_numbers = kot_numbers;
      // console.log({ customer_mobile: kotResult[0].customer_mobile });
      if (kotResult[0].customer_mobile) {
        const kotCustomer = await global.serverdbConnection.Customer.findOne({
          raw: true,
          where: {
            phone: kotResult[0].customer_mobile,
            store_id: global.storeDetails.store_id,
          },
        });
        if (kotCustomer) {
          Object.assign(previewDetails, { customer: kotCustomer });
        }
      }

      // check for payement
      if (kotResult[0].bill_number) {
        const payment_modes =
          await global.serverdbConnection.BillPayment.findAll({
            raw: true,
            where: {
              order_id: kotResult[0].bill_number,
            },
          });
        if (payment_modes.length > 1) {
          previewDetails.paymentAdded = true;
          previewDetails.payment_mode = 'Split';
        }
        previewDetails.payment_modes = payment_modes;

        const billDetails = await global.serverdbConnection.Bill.findOne({
          raw: true,
          where: {
            order_id: kotResult[0].bill_number,
          },
        });
        previewDetails.cust_paid_amount = billDetails.cust_paid_amount;
        previewDetails.printCount = billDetails.print_status;
        previewDetails.due_payment = billDetails.due_payment;
        previewDetails.discount_title = billDetails.discount_title;
        previewDetails.instructions = billDetails.instructions;
        previewDetails.createdBy = billDetails.createdBy;
        previewDetails.payment_mode = billDetails.payment;

        if (billDetails && billDetails.extra_details) {
          const extraDetails = safeParseformain(billDetails.extra_details);
          if (extraDetails && extraDetails.rewardDiscount) {
            Object.assign(previewDetails, {
              isloyaltyrewardDiscount: true,
              rewardTitle: extraDetails.rewardDiscount.title,
              pointsRedeemed: extraDetails.rewardDiscount.points_redeemed,
            });
          }
        }
      }

      // Check for charges
      const billCharges = await global.serverdbConnection.KOTCharges.findAll({
        raw: true,
        where: {
          table_id,
          is_active: 1,
        },
      });
      const charges = [];
      if (billCharges != undefined && billCharges.length > 0) {
        billCharges.forEach((element) => {
          const data = {
            title: element.title,
            per_or_fixed: element.per_or_fixed,
            is_default: element.is_default_flag,
            billing_flag: element.order_billing_flag,
            amount: element.amount,
            charge_id: element.charge_id,
            extra_details: element.extra_details,
            is_tax_applicable: element.is_tax_applicable,
            tax_amount: element.tax_amount,
            is_tax_included: element.is_tax_included,
            tax_title: element.tax_title,
            tax_divided: element.tax_divided,
          };
          charges.push(data);
        });
      }
      previewDetails.charges = charges;

      const items = await global.serverdbConnection.KOTItem.findAll({
        include: [
          {
            model: global.serverdbConnection.KOT,
            attributes: [],
            where: {
              table_id,
              is_active: 1,
            },
          },
        ],
        attributes: [
          ['id', 'kot_items_id'],
          ['item_name', 'title'],
          [
            global.serverdbConnection.Sequelize.fn(
              'sum',
              global.serverdbConnection.Sequelize.col('mpos_kot_item.amount'),
            ),
            'amount',
          ],
          [
            global.serverdbConnection.Sequelize.fn(
              'sum',
              global.serverdbConnection.Sequelize.col('mpos_kot_item.quantity'),
            ),
            'quantity',
          ],
          'item_id',
          'item_price',
          'item_tax_per',
          'item_tax_value',
          'item_tax_method',
          'item_is_devidable',
          'item_tax_name',
          'short_code',
          'note',
          'has_options',
          'product_group_id',
          'product_group_name',
          'discounted_price',
          'discount_type',
          'discount_rate',
          'pricebeforeDiscount',
          'modified_discount',
          'kitchen_dept',
          'kot_id',
          'hsn_code',
          'is_open_item',
          'discounted_items',
          'discount_name',
          'alternative_title',
          'extra_details',
        ],
        where: {
          status: {
            [global.serverdbConnection.Sequelize.Op.in]: [1, 5],
          },
          [global.serverdbConnection.Sequelize.Op.or]: [
            {
              comment: {
                [global.serverdbConnection.Sequelize.Op.notIn]: [
                  '##DELETE_THIS_ITEM##',
                ],
              },
            },
            {
              comment: null, // Include null values
            },
          ],
        },
        group: ['mpos_kot_item.item_name', 'mpos_kot_item.note'],
        order: global.serverdbConnection.Sequelize.literal('mpos_kot_item.id'),
        raw: true,
      });
      for (const kotItem of items) {
        kotItem.quantity = Number(kotItem.quantity);
        kotItem.amount = Number(kotItem.amount);
        // if (kotItem.title.includes('option::')) {
        //   const result = kotItem.title
        //     .substring(0, kotItem.title.indexOf('option::'))
        //     .trim();
        //   kotItem.title = result;
        // }
        kotItem.extra_details = safeParseformain(kotItem.extra_details);
        if (kotItem.has_options == 1) {
          // if kot has item then do sum of qty of all placed kots
          const kot_Items = await connection.KOTItem.findAll({
            include: [
              {
                model: connection.KOT,
                attributes: [],
                where: {
                  table_id,
                  is_active: 1,
                },
              },
            ],
            where: {
              status: {
                [connection.Sequelize.Op.in]: [1, 5],
              },
            },
            raw: true,
          });

          const kot_ids = kot_Items.map((item) => item.id);

          // if in same kot having same item two time with different options then for single item getting two option
          // so we have to match with title also

          const optionWhereData = {
            item_ref_id: kotItem.item_id,
            kot_items_id: kotItem.kot_items_id,
          };

          const addons = await connection.KotItemOption.findAll({
            raw: true,
            attributes: [
              'id',
              'kot_items_id',
              'option_group_name',
              'option_group_ref_id',
              'option_ref_id',
              'option_name',
              'option_price',
              'option_tax_amount',
              'option_total',
              'option_total_with_tax',

              [
                connection.sequelize.literal(
                  `printf("%.${global.ROUNDOFF_UPTO}f",(sum(mpos_kotitem_option_addon_items.option_qty)))`,
                ),
                'option_qty',
              ],

              'option_type',
              'item_ref_id',
              'option_id',
              'extra_details',
              'alternative_title',
            ],
            group: ['option_name', 'option_price', 'item_ref_id', 'option_id'],
            order: [['id', 'ASC']],
            where: optionWhereData,
          });
          // let addons = await connection.KotItemOption.findAll({
          //   raw: true,
          //   where: {
          //     kot_items_id: kotItem.kot_items_id,
          //   },
          // });
          if (addons && addons.length) {
            addons.forEach((addon) => {
              addon.option_qty = Number(addon.option_qty);
            });
          }

          kotItem.addons = addons;
        }
      }
      if (previewDetails.is_pre_order) {
        const preorderInfo = await global.serverdbConnection.PreOrder.findOne({
          where: {
            table_id,
            status: 'created',
          },
        });
        if (preorderInfo) {
          Object.assign(previewDetails, { preorderInfo });
        } else {
          previewDetails.is_pre_order = 0;
        }
      }

      // item level charges
      const itemlevelChargesExists = await connection.Charges.count({
        where: {
          store_id: global.storeDetails.store_id,
          charge_applicable_on: {
            [connection.Sequelize.Op.in]: [1, 2],
          },
        },
      });
      if (itemlevelChargesExists > 0) {
        await getItemlevelcharges(items, global.storeDetails.store_id);
      }

      items.forEach((item) => {
        const { itemlevelCharges } = item;
        const tempitemlevelCharges = [];
        if (
          itemlevelCharges &&
          Array.isArray(itemlevelCharges) &&
          itemlevelCharges.length > 0
        ) {
          // const tempitemlevelCharges = [];
          itemlevelCharges.forEach((charge) => {
            // if ([CHARGE_BILL_TYPES.ALL, currentBillingtype].includes(charge.billing_flag)) {// Add charge if it is for dinein or All
            const billingTypes = String(charge.billing_flag).split(',');
            let chargeBillingType = 0;
            switch (previewDetails.billType) {
              case 1:
                chargeBillingType = 2;
                break;
              case 2:
                chargeBillingType = 3;
                break;
              case 3:
                chargeBillingType = 4;
                break;
              default:
                break;
            }
            if (
              billingTypes.includes(String(CHARGE_BILL_TYPES.ALL)) ||
              billingTypes.includes(String(chargeBillingType))
            ) {
              // Add charge if it is for dinein or All
              tempitemlevelCharges.push(charge);
              let chargeAmount = charge.amount;
              if (charge.per_or_fixed == 1) {
                chargeAmount = ((item.price * chargeAmount) / 100).toFixed(
                  ROUNDOFF_UPTO,
                );
              }
              chargeAmount = Number(chargeAmount).toFixed(ROUNDOFF_UPTO);
              Object.assign(item, {
                itemleveltotalCharges: chargeAmount,
              });
            }
          });
          if (tempitemlevelCharges.length > 0) {
            item.itemlevelCharges = tempitemlevelCharges;
          } else {
            delete item.itemlevelCharges;
          }
        }
      });

      previewDetails.items = items;

      if (kotResult[0].table_id) {
        const tableDetails = await connection.Table.findAll({
          raw: true,
          attributes: ['table_name'],
          include: [
            {
              model: connection.Department,
              attributes: ['section'],
            },
          ],
          where: {
            id: kotResult[0].table_id,
          },
          // order: [['table_name', 'ASC']]
        });
        if (tableDetails && tableDetails.length) {
          previewDetails.tableDepartmentSection =
            tableDetails[0]['mpos_department.section'];
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
  return previewDetails;
}

/**
 * Get preview details for bill print
 * @param {Table ID} table_id
 */
async function getSettledBillpreviewdetails(order_id) {
  let previewDetails;
  try {
    const kotResult = await global.serverdbConnection.KOT.findAll({
      where: {
        bill_number: order_id,
      },
      raw: true,
    });
    if (kotResult != undefined && kotResult.length > 0) {
      previewDetails = {};
      previewDetails.discount_type = kotResult[0].discount_type;
      previewDetails.discount = kotResult[0].discount_rate;
      previewDetails.isdraftBill = true;
      previewDetails.order_type_flag = 'Dine in';
      previewDetails.order_type_flag = OrderTypes[kotResult[0].billing_type];
      previewDetails.billType = kotResult[0].billing_type;
      previewDetails.bill_number = kotResult[0].bill_number;
      previewDetails.kot_id = kotResult[0].kot_id;
      previewDetails.order_id = kotResult[0].order_id;
      previewDetails.showCustomerinfo = kotResult[0].showCustomeronbill;
      previewDetails.is_pre_order = kotResult[0].is_pre_order;
      previewDetails.custom_bill_number = kotResult[0].custom_bill_number;
      // previewDetails.createdBy = kotResult[0].createdBy;
      previewDetails.waiter = kotResult[0].waiter;
      previewDetails.waiter_id = kotResult[0].waiter_id;
      previewDetails.persons = kotResult[0].persons;
      previewDetails.createdBy = kotResult[0].createdBy;
      previewDetails.kotcreatedAt = kotResult[0].actual_in_time;

      const kot_numbers = [];
      kotResult.map((kot) => {
        kot_numbers.push(kot.kot_number);
      });

      previewDetails.kot_numbers = kot_numbers;
      // console.log({ customer_mobile: kotResult[0].customer_mobile });
      if (kotResult[0].customer_mobile) {
        const kotCustomer = await global.serverdbConnection.Customer.findOne({
          raw: true,
          where: {
            phone: kotResult[0].customer_mobile,
          },
        });
        if (kotCustomer) {
          Object.assign(previewDetails, { customer: kotCustomer });
        }
      }

      // check for payement
      const billDetails = await global.serverdbConnection.Bill.findOne({
        raw: true,
        where: {
          order_id: kotResult[0].bill_number,
        },
      });
      if (kotResult[0].bill_number) {
        const payment_modes =
          await global.serverdbConnection.BillPayment.findAll({
            raw: true,
            where: {
              order_id,
            },
          });
        if (payment_modes.length > 1) {
          previewDetails.paymentAdded = true;
          previewDetails.payment_mode = 'Split';
        }
        previewDetails.payment_modes = payment_modes;

        previewDetails.cust_paid_amount = billDetails.cust_paid_amount;
        previewDetails.printCount = billDetails.print_status;
        previewDetails.due_payment = billDetails.due_payment;
        previewDetails.discount_title = billDetails.discount_title;
        previewDetails.instructions = billDetails.instructions;
        previewDetails.createdBy = billDetails.createdBy;
        previewDetails.order_note = billDetails.order_note;
        previewDetails.payment_mode = billDetails.payment;
        previewDetails.bill_status = billDetails.order_state;
        previewDetails.discounted_product_groups =
          billDetails.discounted_product_groups;
        previewDetails.extra_details = safeParseformain(
          billDetails.extra_details,
        );
      }

      // Check for charges
      const billCharges = await global.serverdbConnection.BillCharges.findAll({
        raw: true,
        where: {
          order_id,
        },
      });
      const charges = [];
      if (billCharges != undefined && billCharges.length > 0) {
        billCharges.forEach((element) => {
          const data = {
            title: element.title,
            per_or_fixed: element.per_or_fixed,
            // is_default: element.is_default_flag,
            billing_flag: element.order_billing_flag,
            amount: element.amount,
            charge_id: element.charge_id,
            extra_details: element.extra_details,
            is_tax_applicable: element.tax_amount ? 1 : 0,
            tax_amount: element.tax_amount,
            is_tax_included: element.is_tax_included,
            tax_title: element.tax_title,
            tax_divided: element.tax_divided,
          };
          charges.push(data);
        });
      }
      previewDetails.charges = charges;

      let items = await global.serverdbConnection.KOTItem.findAll({
        include: [
          {
            model: global.serverdbConnection.KOT,
            attributes: [],
            where: {
              bill_number: order_id,
            },
          },
        ],
        attributes: [
          ['id', 'kot_items_id'],
          ['item_name', 'title'],
          [
            global.serverdbConnection.Sequelize.fn(
              'sum',
              global.serverdbConnection.Sequelize.col('mpos_kot_item.amount'),
            ),
            'amount',
          ],
          [
            global.serverdbConnection.Sequelize.fn(
              'sum',
              global.serverdbConnection.Sequelize.col('mpos_kot_item.amount'),
            ),
            'total',
          ],
          [
            global.serverdbConnection.Sequelize.fn(
              'sum',
              global.serverdbConnection.Sequelize.col('mpos_kot_item.quantity'),
            ),
            'quantity',
          ],
          'item_id',
          'item_price',
          ['item_price', 'price'],
          'item_tax_per',
          'item_tax_value',
          'item_tax_method',
          'item_is_devidable',
          'item_tax_name',
          'short_code',
          'note',
          'has_options',
          'product_group_id',
          'product_group_name',
          'discounted_price',
          'discount_type',
          'discount_rate',
          'pricebeforeDiscount',
          'modified_discount',
          'kitchen_dept',
          'kot_id',
          'hsn_code',
          'is_open_item',
          'discounted_items',
          'discount_name',
          'alternative_title',
          'extra_details',
        ],
        where: {
          status: {
            [global.serverdbConnection.Sequelize.Op.in]: [1, 5],
          },
          [global.serverdbConnection.Sequelize.Op.or]: [
            {
              comment: {
                [global.serverdbConnection.Sequelize.Op.notIn]: [
                  '##DELETE_THIS_ITEM##',
                ],
              },
            },
            {
              comment: null, // Include null values
            },
          ],
        },
        group: ['mpos_kot_item.item_name'],
        order: global.serverdbConnection.Sequelize.literal('mpos_kot_item.id'),
        raw: true,
      });

      if (billDetails.order_state === 'cancelled') {
        items = await global.serverdbConnection.KOTItem.findAll({
          include: [
            {
              model: global.serverdbConnection.KOT,
              attributes: [],
              where: {
                bill_number: order_id,
              },
            },
          ],
          attributes: [
            ['id', 'kot_items_id'],
            ['item_name', 'title'],
            [
              global.serverdbConnection.Sequelize.fn(
                'sum',
                global.serverdbConnection.Sequelize.col('mpos_kot_item.amount'),
              ),
              'amount',
            ],
            [
              global.serverdbConnection.Sequelize.fn(
                'sum',
                global.serverdbConnection.Sequelize.col('mpos_kot_item.amount'),
              ),
              'total',
            ],
            [
              global.serverdbConnection.Sequelize.fn(
                'sum',
                global.serverdbConnection.Sequelize.col(
                  'mpos_kot_item.quantity',
                ),
              ),
              'quantity',
            ],
            ['item_price', 'price'],
            'item_id',
            'item_price',
            'item_tax_per',
            'item_tax_value',
            'item_tax_method',
            'item_is_devidable',
            'item_tax_name',
            'short_code',
            'note',
            'has_options',
            'product_group_id',
            'product_group_name',
            'discounted_price',
            'discount_type',
            'discount_rate',
            'pricebeforeDiscount',
            'modified_discount',
            'kitchen_dept',
            'kot_id',
            'hsn_code',
            'is_open_item',
            'discounted_items',
            'discount_name',
            'alternative_title',
            'extra_details',
          ],
          where: {
            status: {
              [global.serverdbConnection.Sequelize.Op.in]: [1, 3, 5],
            },
            [global.serverdbConnection.Sequelize.Op.or]: [
              {
                comment: {
                  [global.serverdbConnection.Sequelize.Op.notIn]: [
                    '##DELETE_THIS_ITEM##',
                  ],
                },
              },
              {
                comment: null, // Include null values
              },
            ],
          },
          group: ['mpos_kot_item.item_name'],
          order:
            global.serverdbConnection.Sequelize.literal('mpos_kot_item.id'),
          raw: true,
        });
      }

      for (const kotItem of items) {
        kotItem.quantity = Number(kotItem.quantity);
        kotItem.amount = Number(kotItem.amount);
        // if (kotItem.title.includes('option::')) {
        //   const result = kotItem.title
        //     .substring(0, kotItem.title.indexOf('option::'))
        //     .trim();
        //   kotItem.title = result;
        // }
        kotItem.extra_details = safeParseformain(kotItem.extra_details);
        if (kotItem.has_options == 1) {
          // if kot has item then do sum of qty of all placed kots
          const kot_Items = await connection.KOTItem.findAll({
            include: [
              {
                model: connection.KOT,
                attributes: [],
                where: {
                  bill_number: order_id,
                },
              },
            ],
            where: {
              status: {
                [connection.Sequelize.Op.in]: [1, 5],
              },
            },
            raw: true,
          });

          const kot_ids = kot_Items.map((item) => item.id);

          // if in same kot having same item two time with different options then for single item getting two option
          // so we have to match with title also

          const optionWhereData = {
            item_ref_id: kotItem.item_id,
            kot_items_id: kotItem.kot_items_id,
          };

          const addons = await connection.KotItemOption.findAll({
            raw: true,
            attributes: [
              'id',
              'kot_items_id',
              'option_group_name',
              'option_group_ref_id',
              'option_ref_id',
              'option_name',
              'option_price',
              'option_tax_amount',
              'option_total',
              'option_total_with_tax',

              [
                connection.sequelize.literal(
                  `printf("%.${global.ROUNDOFF_UPTO}f",(sum(mpos_kotitem_option_addon_items.option_qty)))`,
                ),
                'option_qty',
              ],

              'option_type',
              'item_ref_id',
              'option_id',
              'extra_details',
              'alternative_title',
            ],
            group: ['option_name', 'option_price', 'item_ref_id', 'option_id'],
            order: [['id', 'ASC']],
            where: optionWhereData,
          });
          // let addons = await connection.KotItemOption.findAll({
          //   raw: true,
          //   where: {
          //     kot_items_id: kotItem.kot_items_id,
          //   },
          // });
          if (addons && addons.length) {
            addons.forEach((addon) => {
              addon.option_qty = Number(addon.option_qty);
            });
          }

          kotItem.addons = addons;
        }
        const itemlevelCharges = await connection.KOTItemcharges.findAll({
          raw: true,
          where: {
            itemtitle: kotItem.title,
            table_id: kotResult[0].table_id,
          },
          group: ['title'],
        });
        if (itemlevelCharges && itemlevelCharges.length > 0) {
          kotItem.itemlevelCharges = itemlevelCharges;
        }
      }

      if (previewDetails.is_pre_order) {
        const preorderInfo = await global.serverdbConnection.PreOrder.findOne({
          where: {
            table_id: kotResult[0].table_id,
            status: 'created',
          },
        });
        if (preorderInfo) {
          Object.assign(previewDetails, { preorderInfo });
        } else {
          previewDetails.is_pre_order = 0;
        }
      }

      // item level charges
      const itemlevelChargesExists = await connection.Charges.count({
        where: {
          store_id: global.storeDetails.store_id,
          charge_applicable_on: {
            [connection.Sequelize.Op.in]: [1, 2],
          },
        },
      });
      if (itemlevelChargesExists > 0) {
        await getItemlevelcharges(items, global.storeDetails.store_id);
      }

      items.forEach((item) => {
        const { itemlevelCharges } = item;
        const tempitemlevelCharges = [];
        if (
          itemlevelCharges &&
          Array.isArray(itemlevelCharges) &&
          itemlevelCharges.length > 0
        ) {
          // const tempitemlevelCharges = [];
          itemlevelCharges.forEach((charge) => {
            // if ([CHARGE_BILL_TYPES.ALL, currentBillingtype].includes(charge.billing_flag)) {// Add charge if it is for dinein or All
            const billingTypes = String(charge.billing_flag).split(',');
            if (
              billingTypes.includes(String(CHARGE_BILL_TYPES.ALL)) ||
              billingTypes.includes(String(previewDetails.billType))
            ) {
              // Add charge if it is for dinein or All
              tempitemlevelCharges.push(charge);
              let chargeAmount = charge.amount;
              if (charge.per_or_fixed == 1) {
                chargeAmount = ((item.price * chargeAmount) / 100).toFixed(
                  ROUNDOFF_UPTO,
                );
              }
              chargeAmount = Number(chargeAmount).toFixed(ROUNDOFF_UPTO);
              Object.assign(item, {
                itemleveltotalCharges: chargeAmount,
              });
            }
          });
          if (tempitemlevelCharges.length > 0) {
            item.itemlevelCharges = tempitemlevelCharges;
          } else {
            delete item.itemlevelCharges;
          }
        }
      });

      previewDetails.items = items;
    }
  } catch (error) {
    console.log(error);
  }
  return previewDetails;
}
// add itemlevel charges to item
async function getItemlevelcharges(items, store_id) {
  if (items && Array.isArray(items) && items.length > 0) {
    for (const currentItem of items) {
      const combination = `%,${currentItem.item_id}%`;
      const combination2 = `%,${currentItem.item_id}`;
      const combination3 = `${currentItem.item_id},%`;
      const combination4 = currentItem.item_id;

      const options = await connection.Charges.findAll({
        where: {
          store_id,
          charge_applicable_on: {
            [connection.Sequelize.Op.in]: [1, 2],
          },
          [connection.Sequelize.Op.or]: [
            {
              applicable_on_items: {
                [connection.Sequelize.Op.like]: combination,
              },
            },
            {
              applicable_on_items: {
                [connection.Sequelize.Op.like]: combination2,
              },
            },
            {
              applicable_on_items: {
                [connection.Sequelize.Op.like]: combination3,
              },
            },
            {
              applicable_on_items: {
                [connection.Sequelize.Op.like]: combination4,
              },
            },
          ],
          is_default: 1,
        },
        raw: true,
      });
      if (options.length > 0) {
        currentItem.itemlevelCharges = options;
      }
    }
  }
}
async function oldkotcancelled(params) {
  try {
    global.mainWindow.webContents.send(ORDER.KOT_CANCELLED, params);
  } catch (error) {
    console.log(error);
  }
}

async function kotitemTransferred(params) {
  try {
    global.mainWindow.webContents.send(ORDER.KOTITEM_TRANSFERRED, params);
  } catch (error) {
    console.log(error);
  }
}

async function closeNotificationView(params) {
  try {
    global.mainWindow.webContents.send(ORDER.CLOSE_NOTIFICATION_VIEW, params);
  } catch (error) {
    console.log(error);
  }
}

const kotIdsToPull = new Set();

let isPullInProgress = false;

async function pullOrders(params) {
  while (kotIdsToPull.size > 0) {
    const orderId = kotIdsToPull.values().next().value;
    isPullInProgress = true;
    global.mainWindow.webContents.send(ORDER.ACCEPT_REMOTE_KOT, params);
    await sleep(400);
    kotIdsToPull.delete(orderId);
    isPullInProgress = false;
  }
}

async function acceptRemoteKot(params) {
  try {
    // first check kot is pulled. If pulled already then no need to pull again
    // this is because from multiple order hubs request can come for kot accept
    const data = safeParseformain(params);
    const { remote_kot_id } = data;
    // orderIdsToPull.push(order_id);
    if (kotIdsToPull.has(remote_kot_id)) {
      return;
    }
    kotIdsToPull.add(remote_kot_id);
    console.log('kotIdsToPull:', kotIdsToPull);
    if (!isPullInProgress) {
      pullOrders(params);
    }
    console.log('isPullInProgress::', isPullInProgress);
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  chargesupdatedonTable,
  newbillhasbeenSavedAndPrint,
  newkotHasbeenUpdated,
  sendKOTPrintrequest,
  sendbillPrintrequest,
  newkotHasbeenplaced,
  captainMessagereceived,
  kotitemstatusChanged,
  oldkotcancelled,
  kotitemTransferred,
  newbillhasbeenSaved,
  newbillhasbeenSettled,
  closeNotificationView,
  handleTableSplitted,
  handleTableMerged,
  handleTableChanged,
  handleTableClicked,
  handleKotUpdatedRequest,
  sendQuickBillPrintRequest,
  sendSettledbillPrintrequest,
  handleRefreshTable,
  handleOrderUpdatedFromOrderSettlementwindow,
  handleUpdateTableDetails,
  handleCustomerUpdated,
  acceptRemoteKot,
};
