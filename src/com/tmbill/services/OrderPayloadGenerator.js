/* eslint-disable no-undef */
/* eslint-disable camelcase */
const {
  KOT,
  KOTItem,
  KotItemOption,
  Bill,
  BillItem,
  BillItemOption,
  Orderchildcharges,
  BillPayment,
  OrderTip,
  Customer,
  BillCharges,
  SectionwiseDiscounthistory,
  Duepayments,
  Expenses,
  Sequelize,
} = require('../js/database');
const { hashString, safeParseformain } = require('../main_controllers/Utils');

let SYNC_LIMIT = 5;
console.log('global.syncOrderBatchSize::', global.syncOrderBatchSize);
if (global.syncOrderBatchSize) {
  SYNC_LIMIT = Number(global.syncOrderBatchSize);
}

function setSyncLimit() {
  if (Number(global.syncOrderBatchSize)) {
    SYNC_LIMIT = Number(global.syncOrderBatchSize);
  }
}

async function getKOTsynclist({ store_id, offset }) {
  let kotList = [];
  try {
    const kots = await KOT.findAll({
      raw: true,
      limit: SYNC_LIMIT,
      // offset: offset,
      where: {
        sync_status: 0,
        store_id,
      },
    });

    if (kots && kots.length > 0) {
      for (kot of kots) {
        const formatDate = moment(kot.kot_date, 'YYYY-MM-DD HH:mm Z').format(
          'YYYY-MM-DD HH:mm:ss',
        );
        kot.kot_date = formatDate;
        const kotItems = await KOTItem.findAll({
          attributes: [
            'id',
            'kot_id',
            'item_id',
            'item_name',
            'alternative_title',
            'item_price',
            [Sequelize.fn('sum', Sequelize.col('quantity')), 'quantity'],
            'amount',
            'note',
            'status',
            'user_id',
            'start_time',
            'out_time',
            'is_transferred',
            'reason',
            'createdBy',
            'modifiedBy',
            'modifiedDate',
            'item_tax_name',
            'item_tax_per',
            'item_tax_value',
            'item_tax_method',
            'item_is_devidable',
            'item_total_tax_value',
            'tax_discount_method',
            'short_code',
            'has_options',
            'product_group_id',
            'product_group_name',
            'orderstatus',
            'previousstatus',
            'statusChangedby',
            'comment',
            // [
            //   Sequelize.fn('COALESCE', Sequelize.fn('MAX', col('comment')), ''),
            //   'comment',
            // ],
            // [
            //   Sequelize.literal(`
            //     MAX(CASE
            //       WHEN comment IS NOT NULL AND comment != ''
            //       THEN comment
            //       ELSE NULL
            //     END)
            //   `),
            //   'comment',
            // ],
            'discounted_price',
            'discount_type',
            'discount_rate',
            'pricebeforeDiscount',
            'discount',
            'modified_discount',
            'is_complimentary',
            'kitchen_dept',
            'hsn_code',
            'is_open_item',
            'discounted_items',
            'discount_name',
            'category_name',
            'extra_details',
          ],
          raw: true,
          group: [
            'kot_id',
            'item_id',
            'status',
            'item_name',
            'item_price',
            'quantity',
            'amount',
            'comment',
          ],
          where: {
            kot_id: kot.kot_id,
          },
        });

        for (const kotItem of kotItems) {
          if (
            kotItem.item_price === 0 &&
            kotItem.pricebeforeDiscount &&
            kotItem.is_complimentary
          ) {
            kotItem.item_price = kotItem.pricebeforeDiscount;
          }
          if (kotItem.extra_details) {
            kotItem.extra_details = safeParseformain(kotItem.extra_details);
          }
          // if (kotItem.status !== 3 && kotItem.status !== 2) {
          const itemFormatDate = moment(
            kotItem.modifiedDate,
            'YYYY-MM-DD HH:mm Z',
          ).format('YYYY-MM-DD HH:mm:ss');

          kotItem.modifiedDate = itemFormatDate;
          // }
          const currentOptions = await KotItemOption.findAll({
            raw: true,
            where: {
              kot_items_id: kotItem.id,
            },
          });
          if (currentOptions && currentOptions.length) {
            currentOptions.forEach((option) => {
              if (option.extra_details) {
                option.extra_details = safeParseformain(option.extra_details);
              }
            });
          }
          kotItem.kot_order_option_list = currentOptions;
        }
        kot.sync_kot_item_list = kotItems;
      }
    }
    kotList = kots;
  } catch (error) {}
  return kotList;
}

/**
 * Sync bill and KOT of user
 * @param {*} db
 */
async function generateSyncpayload(store_id, offset) {
  let donotSyncdata = true;
  let syncData = { list: [], store_id, hash: '' };
  const billidstoSync = [];
  const kotidstosync = [];
  try {
    const syncbillsList = await Bill.findAll({
      attributes: [
        'id',
        'order_id',
        'store_id',
        'table_id',
        'table_name',
        'user_id',
        'cust_name',
        'phone',
        'discount',
        'delivery_type',
        'instructions',
        'quantity',
        'order_level_total_charges',
        'order_level_total_taxes',
        'order_state',
        'order_subtotal',
        'order_total',
        'my_order_date',
        'created_time',
        'payment',
        'order_check_flag',
        'billing_type',
        'print_status',
        'draftprint_status',
        'payment_id',
        'persons',
        'bill_number',
        'is_guest_mode',
        'order_flag',
        'total_external_discount',
        'delivery_boy_name',
        'delivery_boy_phone',
        'couponDisount',
        'couponDisounttype',
        'coupon',
        'couponDisounttotal',
        'issectionwisebilling',
        'due_payment',
        'cust_paid_amount',
        'waiter_id',
        'charges_level_total_tax',
        'custom_bill_number',
        'extra_details',
        'createdBy',
        'item_level_total_charges',
        'charges',
        ['field1', 'reason'],
        'field2',
        'field3',
        'field4',
        'discount_title',
        'intime',
        'outtime',
        'app_source',
        'actual_created_time',
        'line_1',
        'menu_id',
        'is_pre_order',
        'bill_prefix_for',
      ],
      // group: ['order_id'],
      group: ['mpos_order.order_id'],
      limit: SYNC_LIMIT,
      offset,
      where: {
        // sync_status: 0,
        store_id,
        sync_status: {
          [Sequelize.Op.lt]: 2, // sync_status != 2
        },
        // order_id: {
        //   [Sequelize.Op.in]: [],
        // },
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
          model: OrderTip,
        },
        {
          as: 'customerList',
          model: Customer,
        },
        {
          as: 'discountHistory',
          model: SectionwiseDiscounthistory,
        },
      ],
      order: ['id'],
    });

    const orderslisttoSync = [];
    if (syncbillsList && syncbillsList.length) {
      for (let index = 0; index < syncbillsList.length; index++) {
        const rawcurrentBillitem = syncbillsList[index];
        const currentBillitem = rawcurrentBillitem.get({ plain: true });

        currentBillitem.quantity = currentBillitem.tmpos_order_child.length;
        currentBillitem.orderchildList = currentBillitem.tmpos_order_child;
        currentBillitem.orderPaymentList = currentBillitem.tmpos_order_payment;
        currentBillitem.all_charge_order_list =
          currentBillitem.tmpos_order_charges;

        // currentBillitem.customerList = [];
        // if (currentBillitem.phone) {
        //   currentBillitem.customerList = currentBillitem.customerList;
        // }

        if (!currentBillitem.phone) {
          currentBillitem.customerList = [];
        } else {
          currentBillitem.customerList = [currentBillitem.customerList];
        }
        // currentBillitem.customerList = currentBillitem.customerList
        //   ? [currentBillitem.customerList]
        //   : [];
        currentBillitem.orderTips = currentBillitem.mpos_order_tip
          ? [currentBillitem.mpos_order_tip]
          : [];

        delete currentBillitem.tmpos_order_child;
        delete currentBillitem.tmpos_order_payment;
        delete currentBillitem.tmpos_order_charges;
        delete currentBillitem.mpos_order_tip;

        if (currentBillitem.extra_details) {
          try {
            Object.assign(currentBillitem, {
              extra_details: safeParseformain(currentBillitem.extra_details),
            });
          } catch (error) {
            console.error('error::', error);
          }
        }

        billidstoSync.push(currentBillitem.order_id);

        currentBillitem.created_time = moment(
          currentBillitem.created_time,
        ).format('YYYY-MM-DD HH:mm:ss');

        currentBillitem.my_order_time = moment(
          currentBillitem.created_time,
        ).format('HH:mm:ss');

        const duePayments = await Duepayments.getSyncdata({
          order_id: currentBillitem.order_id,
        });
        currentBillitem.duePayments = duePayments;
        // Items Mapping
        if (
          currentBillitem.orderchildList &&
          currentBillitem.orderchildList.length
        ) {
          for (
            let index = 0;
            index < currentBillitem.orderchildList.length;
            index++
          ) {
            const item = currentBillitem.orderchildList[index];

            item.order_option_list = item.order_child_options;
            item.itemlevelCharges = item.order_child_charges;

            delete item.order_child_options;
            delete item.order_child_charges;
          }
        }

        let sendorderTosync =
          currentBillitem.orderchildList &&
          currentBillitem.orderchildList.length;

        // If the due payment is 0 and payment modes are not available then
        // Do not sync the order
        if (
          Number(currentBillitem.due_payment) <= 0 &&
          (!currentBillitem.orderPaymentList ||
            !currentBillitem.orderPaymentList.length)
        ) {
          sendorderTosync = false;
        }

        if (currentBillitem.order_state === 'pending') {
          sendorderTosync = true;
        }

        // for complementary order we dont set payment modes
        if (currentBillitem.order_state === 'free') {
          sendorderTosync = true;
        }
        if (sendorderTosync) {
          orderslisttoSync.push(currentBillitem);
        }
      }

      syncData.list = orderslisttoSync;
    }

    const kotsyncList = await getKOTsynclist({ store_id, offset });
    Object.assign(syncData, {
      kot_list: kotsyncList,
    });

    if (kotsyncList && kotsyncList.length) {
      kotsyncList.forEach((kot) => {
        // if (global.reduceStock) {
        //   kot.reduceStock = global.reduceStock;
        //   kot.menu_id = Number(global.menu_id);
        // }
        kotidstosync.push(kot.kot_uniqueid);
      });
    }

    donotSyncdata = kotsyncList.length == 0 && syncbillsList.length == 0;

    // Add Expenses to the list
    try {
      const allexpenselist = await Expenses.findAll({
        raw: true,
        attributes: [
          'expense_id',
          'category_id',
          'sub_category_id',
          'amount',
          'description',
          'is_chargable',
          'category_name',
          'payment_mode',
          'sub_category_name',
          // 'expense_date',
          [
            Sequelize.literal(
              'strftime("%Y-%m-%d",date(mpos_expense.expense_time/1000, "unixepoch"))',
            ),
            'expense_date',
          ],
          [
            Sequelize.literal(
              'strftime("%H:%M:%S",datetime(mpos_expense.expense_time/1000,"unixepoch", "localtime"))',
            ),
            'expense_time',
          ],
          'store_id',
          ['field1', 'user_name'],
        ],
        where: {
          store_id,
          sync_flag: {
            [Sequelize.Op.lt]: 2, // sync_status != 2
          },
          // expense_id: {
          //   [Sequelize.Op.in]: [],
          // },
        },
      });
      if (allexpenselist.length > 0) {
        donotSyncdata = false;
        syncData.allexpenselist = allexpenselist;
      }
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }

  if (donotSyncdata) syncData = undefined;

  if (syncData) {
    Object.assign(syncData, { billidstoSync, kotidstosync });
    // Calculate Hash For Order
    const hash = hashString(JSON.stringify(syncData));
    Object.assign(syncData, { hash });
  }

  return syncData;
}

module.exports = {
  generateSyncpayload,
  setSyncLimit,
};
