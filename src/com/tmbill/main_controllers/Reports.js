/* eslint-disable camelcase */
/* eslint-disable no-case-declarations */
const { ipcMain } = require('electron');
const _ = require('lodash');
const sumBy = require('lodash/sumBy');
const filter = require('lodash/filter');
const connection = require('../js/database');
const { REPORT_MESSAGES } = require('../util/IPC_Messages');
const { REPORT_TYPES } = require('../util/ReportTypes');
const {
  getTodaysDate,
  checkIfTimeForMidnightReport,
} = require('../util/MiscUtil');
const {
  ONLINE_PLATFORMS,
  OFFLINE_BILLING_TYPES,
  OrderState,
} = require('../util/DBUtil');
// const { Category, Item, Expenses, PasscodeActivity, Sequelize, KOT, KOTItem, KotItemOption, Bill, BillItem,
//     BillItemOption, Orderchildcharges, BillPayment, Customer, BillCharges, SectionwiseDiscounthistory,
//     Duepayments, StartcloseDay, UserShift, Wallet, WalletTransactions } = require('../js/database');

const { COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY } = require('../util/SettingIDs');
const { Op, where } = require('sequelize');
const { safeParseformain } = require('./Utils');

/**
 * Get's billed item by bill number
 * @param {Bill number} bill_number
 */
async function getBillitems(bill_number) {
  let billitems = [];
  try {
    billitems = await connection.BillItem.findAll({
      raw: true,
      where: {
        orderMasterId: bill_number,
      },
    });
  } catch (error) {
    billitems = [];
    console.log(error);
  }

  try {
    for await (const item of billitems) {
      const itemlevelCharges = await connection.Orderchildcharges.findAll({
        raw: true,
        attributes: [
          ['charge_title', 'title'],
          ['charge_amount', 'amount'],
          ['per_fixed', 'per_or_fixed'],
          'calculate_tax_for_item_charges',
          'calculated_charge',
          'calculated_tax',
          'is_tax_included',
          'tax_amount',
        ],
        where: {
          order_item_id: item.id,
        },
      });
      item.itemlevelCharges = itemlevelCharges;

      if (item.has_options) {
        const options = await connection.BillItemOption.findAll({
          where: {
            order_id: item.orderMasterId,
            item_ref_id: item.item_id,
            order_item_id: item.id,
          },
        });
        item.options = options;
      }

      if (item && item.extra_details) {
        const extra_detail = safeParseformain(item.extra_details);
        if (extra_detail && extra_detail.baseTitle) {
          // item.title = extra_detail.baseTitle;
          item.extra_details = extra_detail;
        }
      }
    }
  } catch (error) {
    console.log(error);
  }

  return billitems;
}

async function getReportData(params) {
  if (!global.storeDetails) {
    global.storeDetails = { store_id: 1, username: 'admin' };
  }
  const response = {};
  if (params && connection) {
    try {
      params = safeParseformain(params);
      response.params = params;
      let fromDate = (params.fromDate && String(params.fromDate).trim()) ? String(params.fromDate).trim() : getTodaysDate();
      let toDate = (params.toDate && String(params.toDate).trim()) ? String(params.toDate).trim() : getTodaysDate();
      const startDateOnly = fromDate.slice(0, 10);
      const endDateOnly = toDate.slice(0, 10);
      const dateExists = true;
      const groupByBaseItem = params.groupByBaseItem === 'true';

      switch (Number(params.reportType)) {
        case REPORT_TYPES.SALES_REPORT:
        case REPORT_TYPES.TODAYS_REPORT:
          const currentStoreId = String(global.storeDetails?.store_id || '1');
          const whereData = {
            [connection.Sequelize.Op.and]: [
              {
                [connection.Sequelize.Op.or]: [
                  { store_id: currentStoreId },
                  { store_id: 'STORE_1' },
                  { store_id: '1' }
                ]
              },
              {
                [connection.Sequelize.Op.or]: [
                  { my_order_date: { [connection.Sequelize.Op.between]: [startDateOnly, endDateOnly] } },
                  { my_order_date: null }
                ]
              }
            ]
          };
          if (params.username) {
            whereData[connection.Sequelize.Op.and].push({ createdBy: params.username });
          }
          const bills = await connection.Bill.findAll({
            // raw: true,
            where: whereData,
            attributes: [
              'order_id',
              'table_name',
              'user_id',
              'cust_name',
              'phone',
              'discount',
              'instructions',
              'order_level_total_charges',
              'item_level_total_charges',
              'order_level_total_taxes',
              'charges_level_total_tax',
              'order_state',
              ['order_total', 'order_total_new'],
              'order_total',
              'created_time',
              'payment',
              'billing_type',
              'persons',
              'bill_number',
              'order_flag',
              'total_external_discount',
              'delivery_boy_name',
              'delivery_boy_phone',
              'my_order_date',
              'quantity',
              'hasDuepayment',
              'due_payment',
              'createdBy',
              'persons',
              'custom_bill_number',
              'extra_details',
              'charges',
              ['order_level_total_charges', 'order_level_total_charges_without_tax'],
            ],
            include: [
              {
                raw: true,
                as: 'tmpos_order_charges',
                model: connection.BillCharges,
              },
            ],
          });

          let orderIds = [];
          bills.map((ele) => {
            if (ele.tmpos_order_charges && ele.tmpos_order_charges.length) {
              let order_level_total_charges_without_tax = 0;
              ele.tmpos_order_charges.forEach((charge) => {
                if (charge.status_flag === 0) {
                  if (charge.calculated_tax && charge.is_tax_included === 0) {
                    order_level_total_charges_without_tax +=
                      charge.value - charge.calculated_tax;
                  } else {
                    order_level_total_charges_without_tax += charge.value;
                  }
                }
              });
              // ele.order_level_total_charges_without_tax =
              //   order_level_total_charges_without_tax;
              ele.setDataValue(
                'order_level_total_charges_without_tax',
                order_level_total_charges_without_tax,
              );
            } else if (Number(ele.charges)) {
              ele.setDataValue(
                'order_level_total_charges_without_tax',
                Number(ele.charges),
              );
            }
            if (ele.quantity) {
              ele.quantity = Number(ele.quantity.toFixed(global.ROUNDOFF_UPTO));
            }
            orderIds.push(ele.order_id);
          });
          response.bills = bills;
          response.totalBills = bills?.length;

          let invoice_range = await connection.Bill.getBillrange({
            ...whereData,
            fromDate,
            toDate,
          });

          if (invoice_range) {
            const bill_range = {
              min_bill_number: invoice_range.min_bill_number,
              max_bill_number: invoice_range.max_bill_number,
            };
            invoice_range = Object.values(bill_range).join('-');
            response.invoice_range = invoice_range;
          }
          if (params.getPaymentandItems) {
            const soldItems = await getSolditemsbydate({
              fromDate,
              toDate,
              username: params?.username,
            });
            response.soldItems = soldItems;

            const payments = await getPaymentsbydate(
              fromDate,
              toDate,
              params?.username,
            );
            response.payments = payments;
          }
          if (params.showWaiterData) {
            const waiterSummary = await getWaiterSummarybydate(whereData);
            response.waiterSummary = waiterSummary;
          }

          if (params.showCancelitems) {
            const cancelledItems = await connection.KOTItem.getItemsbystatus(
              3,
              fromDate,
              toDate,
              global.storeDetails.store_id,
              params?.username,
            );
            response.cancelledItems = cancelledItems;
          }

          // delivery boy summary
          if (params.showDeliveryBoyData) {
            const deliveryboySummary =
              await getDeliveryboySummarybydate(whereData);
            response.deliveryboySummary = deliveryboySummary;
          }

          const duePaymentSummary = await getDuePaymentSummarybydate(
            fromDate,
            toDate,
          );
          response.duePaymentSummary = duePaymentSummary;
          // get order type wise summary
          // const orderTypewise = await getOrderTypewisesummarybydate(whereData);
          // console.log('orderTypewise::', orderTypewise);

          if (params.showDuePaymentReceivableData) {
            const duePaymentReceivableSummary =
              await getDuePaymentReceivableSummarybydate(fromDate, toDate);
            response.duePaymentReceivableSummary = duePaymentReceivableSummary;
          }

          if (params.showDiscountData) {
            const discountSummary = await getDiscountSummarybydate(whereData);
            response.discountSummary = discountSummary;
          }

          if (params.showWalletData) {
            const walletSummary = await getWalletSummarybydate({
              toDate,
              fromDate,
            });
            response.walletSummary = walletSummary;
          }

          if (params.showKDWiseItemsData) {
            const kdWiseItemSummary = await connection.BillItem.getkdwisereport(
              fromDate,
              toDate,
              global.storeDetails.store_id,
              // global.storeDetails.username,
              params?.username,
            );
            response.kdWiseItemSummary = kdWiseItemSummary;
          }
          const orderTypeWiseOrders = await connection.Bill.count({
            attributes: [
              [
                connection.Sequelize.literal('SUM(CAST(COALESCE("order_total", \'0\') AS numeric))'),
                'order_total',
              ],
              [
                connection.Sequelize.literal('SUM(CAST(COALESCE("charges", \'0\') AS numeric))'),
                'charges',
              ],
              [
                connection.Sequelize.literal('SUM(CAST(COALESCE("discount", \'0\') AS numeric))'),
                'discount',
              ],
              [
                connection.Sequelize.literal('SUM(CAST(COALESCE("order_level_total_taxes", \'0\') AS numeric))'),
                'order_level_total_taxes',
              ],
              [
                connection.Sequelize.literal('SUM(CAST(COALESCE("charges_level_total_tax", \'0\') AS numeric))'),
                'charges_level_total_tax',
              ],
            ],
            group: ['billing_type'],
            where: { ...whereData, order_state: 'fulfilled' },
          });
          const extra_details = await connection.Bill.findAll({
            raw: true,
            attributes: ['billing_type', 'extra_details'],
            where: {
              ...whereData,
              order_state: 'fulfilled',
            },
          });
          const extra_detail = [];
          extra_details.forEach((element) => {
            element.extra_details = JSON.parse(element.extra_details);
            const obj = {};
            if (element.extra_details && element.extra_details.roundedAmount) {
              obj.roundedAmount = Number(element.extra_details.roundedAmount);
              obj.billing_type = element.billing_type;
              extra_detail.push(obj);
            }
          });
          const output = _(extra_detail)
            .groupBy('billing_type')
            .map((objs, key) => ({
              billing_type: key,
              roundedAmount: _.sumBy(objs, 'roundedAmount'),
            }))
            .value();
          orderTypeWiseOrders.map((item) => {
            const value = output.find(
              (o) => o.billing_type == item.billing_type,
            );
            if (value) {
              Object.assign(item, { total_rounded_amt: value.roundedAmount });
            }
          });
          let catdataList;
          if (params.showCategoryData) {
            catdataList = await connection.BillItem.getCategorywisereport(
              params.fromDate,
              params.toDate,
              global.storeDetails.store_id,
              // global.storeDetails.username,
              params?.username,
            );
            response.catdataList = catdataList;
          }

          if (
            params.printwithItems &&
            catdataList &&
            Array.isArray(catdataList) &&
            catdataList.length > 0
          ) {
            for (const category of catdataList) {
              const items =
                await connection.BillItem.getCategorywiseitemsreport(
                  params.fromDate,
                  params.toDate,
                  global.storeDetails.store_id,
                  global.storeDetails.username,
                  category.category_ref_ids,
                  groupByBaseItem,
                );
              category.items = items;
            }
          }
          response.orderTypeWiseOrders = orderTypeWiseOrders;

          if (params.showExpenseData) {
            const expenseData = await getExpensesByDate(fromDate, toDate);
            response.expenses_list = expenseData;
          }
          break;
        case REPORT_TYPES.MALL_REPORT:
          const storeId = global.storeDetails.store_id;
          const ordersWhereData = {
            store_id: global.storeDetails.store_id,
            // user_id: global.storeDetails.username,
            created_time: {
              [connection.Sequelize.Op.between]: [fromDate, toDate],
            },
            // order_state: {
            //     [connection.Sequelize.Op.in]: Object.values(OrderState),
            // }
            order_state: 'fulfilled',
          };
          const ordersListData = { list: [], store_id: storeId };
          const billIds = [];
          const ordersData = await connection.Bill.findAll({
            raw: true,
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
              'field1',
              'field2',
              'field3',
              'field4',
              'discount_title',
              'intime',
              'outtime',
            ],
            where: ordersWhereData,
          });
          const ordersList = [];
          if (ordersData && ordersData.length) {
            for (currentBillitem of ordersData) {
              billIds.push(currentBillitem.order_id);
              currentBillitem.created_time = moment(
                currentBillitem.created_time,
              ).format('YYYY-MM-DD HH:mm:ss');
              currentBillitem.my_order_time = moment(
                currentBillitem.created_time,
              ).format('HH:mm:ss');

              if (currentBillitem.extra_details) {
                try {
                  Object.assign(currentBillitem, {
                    extra_details: JSON.parse(currentBillitem.extra_details),
                  });
                } catch (error) {}
              }
              try {
                // Get Bill items
                const billitems = await connection.BillItem.findAll({
                  raw: true,
                  where: {
                    orderMasterId: currentBillitem.order_id,
                  },
                });

                for (const currentBillitem of billitems) {
                  const currentOptions =
                    await connection.BillItemOption.findAll({
                      raw: true,
                      where: {
                        order_item_id: currentBillitem.id,
                      },
                    });

                  const itemlevelCharges =
                    await connection.Orderchildcharges.findAll({
                      raw: true,
                      where: {
                        order_item_id: currentBillitem.id,
                      },
                    });
                  currentBillitem.order_option_list = currentOptions;
                  currentBillitem.itemlevelCharges = itemlevelCharges;
                }
                currentBillitem.quantity = billitems.length;
                currentBillitem.orderchildList = billitems;
              } catch (error) {
                console.log(error);
              }

              try {
                const payment = await connection.BillPayment.findAll({
                  raw: true,
                  where: {
                    order_id: currentBillitem.order_id,
                  },
                });
                // payment = uniqBy(payment, 'payment_option');
                // payment.push(...payment);
                currentBillitem.orderPaymentList = payment;
              } catch (error) {}

              if (currentBillitem.phone) {
                try {
                  const customer = await connection.Customer.findAll({
                    raw: true,
                    where: {
                      phone: currentBillitem.phone,
                      store_id,
                    },
                  });
                  currentBillitem.customerList = customer;
                } catch (error) {}
              }

              try {
                const charges = await connection.BillCharges.findAll({
                  raw: true,
                  where: {
                    order_id: currentBillitem.order_id,
                  },
                });
                currentBillitem.all_charge_order_list = charges;
              } catch (error) {}
              try {
                const discountHistory =
                  await connection.SectionwiseDiscounthistory.findAll({
                    raw: true,
                    where: {
                      order_id: currentBillitem.order_id,
                    },
                  });
                currentBillitem.discountHistory = discountHistory;
              } catch (error) {}

              try {
                const duePayments = await connection.Duepayments.getSyncdata({
                  order_id: currentBillitem.order_id,
                });
                currentBillitem.duePayments = duePayments;
              } catch (error) {}

              if (
                Number(currentBillitem.due_payment) <= 0 &&
                (!currentBillitem.orderPaymentList ||
                  !currentBillitem.orderPaymentList.length)
              ) {
                sendorderTosync = false;
              }
              // if (sendorderTosync) {
              ordersList.push(currentBillitem);
              // }
            }
            ordersListData.list = ordersList;
          }
          const mallReportNumber = await connection.Tempnumbers.findAll({
            raw: true,
            where: { id: 1 },
          });
          const reportNumber =
            mallReportNumber[mallReportNumber.length - 1].mall_report_id;
          response.reportId = reportNumber;
          response.orderData = ordersList;
          break;
        case REPORT_TYPES.TOP_ITEMS:
          const topItems = await connection.BillItem.gettopSolditems({
            fromDate,
            toDate,
            store_id: global.storeDetails.store_id,
            // user_id: global.storeDetails.username,
            limit: params.limit,
            filterbyAmount: params.filterbyAmount,
            groupByBaseItem,
            user_id: params.username,
          });
          response.items = topItems;
          break;
        case REPORT_TYPES.CANCELLED_ITEMS:
          const cancelledItems = await connection.KOTItem.getItemsbystatus(
            3,
            fromDate,
            toDate,
            global.storeDetails.store_id,
            params.username,
            groupByBaseItem,
            // global.storeDetails.username,
          );
          response.items = cancelledItems;
          break;
        case REPORT_TYPES.DELETED_ITEMS:
          const deletedItems = await connection.KOTItem.getItemsbystatus(
            2,
            fromDate,
            toDate,
            global.storeDetails.store_id,
            params.username,
            groupByBaseItem,
            // global.storeDetails.username,
          );

          response.items = deletedItems;
          break;
        case REPORT_TYPES.SOLD_ITEMS:
          const soldItems = await getSolditemsbydate({
            fromDate,
            toDate,
            groupByBaseItem,
            user_id: params.username,
          });
          response.items = soldItems;
          break;
        case REPORT_TYPES.COMPLEMENTARY_ITEMS:
          const complementaryItems =
            await connection.KOTItem.getComplimentaryitems(
              fromDate,
              toDate,
              global.storeDetails.store_id,
              params.username,
              groupByBaseItem,
            );

          response.items = complementaryItems;
          break;
        case REPORT_TYPES.DEAD_ITEMS:
          const deadItemlist = await connection.Item.getDeaditems(
            global.storeDetails.store_id,
            global.storeDetails.username,
          );
          response.deadItemlist = deadItemlist;
          break;
        case REPORT_TYPES.ADDON_ITEMS:
          // option_type=1
          const addonsItems = await connection.BillItemOption.findAll({
            raw: true,
            include: [
              {
                model: connection.Bill,
                attributes: [],
                where: {
                  store_id: global.storeDetails.store_id,
                  // user_id: global.storeDetails.username,
                  created_time: {
                    [connection.Sequelize.Op.between]: [fromDate, toDate],
                  },
                },
              },
            ],
            // where: {
            //   type: 1,
            // },
            attributes: [
              'id',
              'title',
              'extra_details',
              [
                connection.sequelize.fn(
                  'sum',
                  connection.sequelize.col(
                    'mpos_orderchild_option_addon_items.qty',
                  ),
                ),
                'qty',
              ],
              'price',
              [
                connection.sequelize.literal(
                  '(mpos_orderchild_option_addon_items.price * sum(mpos_orderchild_option_addon_items.qty))',
                ),
                'finalamount',
              ],
              [
                connection.sequelize.literal(
                  '(mpos_orderchild_option_addon_items.price * sum(mpos_orderchild_option_addon_items.qty))',
                ),
                'total',
              ],
              [
                connection.sequelize.literal(
                  '(CASE mpos_orderchild_option_addon_items.total =0  WHEN TRUE THEN 0 ELSE mpos_orderchild_option_addon_items.price END)',
                ),
                'finalPrice',
              ],
              [
                connection.sequelize.fn(
                  'sum',
                  connection.sequelize.col(
                    'mpos_orderchild_option_addon_items.total',
                  ),
                ),
                'total_withouttax_old',
              ],
              [
                connection.sequelize.literal(
                  '(CASE mpos_orderchild_option_addon_items.tax_method=1 WHEN TRUE THEN (mpos_orderchild_option_addon_items.total_with_tax - (mpos_orderchild_option_addon_items.tax_value * mpos_orderchild_option_addon_items.qty) ) ELSE mpos_orderchild_option_addon_items.total_with_tax END)',
                ),
                'total_withouttax',
              ],
              [
                connection.sequelize.fn(
                  'sum',
                  connection.sequelize.col(
                    'mpos_orderchild_option_addon_items.total_with_tax',
                  ),
                ),
                'total_with_tax',
              ],
            ],
            order: [
              [
                params.filterbyAmount
                  ? connection.sequelize.literal('finalamount')
                  : connection.sequelize.literal('qty'),
                'DESC',
              ],
            ],
            group: ['title', 'finalPrice'],
            where: {
              type: 1,
            },
          });
          addonsItems.map((item) => {
            item.finalamount = item.finalamount.toFixed(global.ROUNDOFF_UPTO);
          });
          response.items = addonsItems;
          break;
        case REPORT_TYPES.DISCOUNTED_ITEMS:
          // option_type=1
          const disountedItems = await connection.BillItem.findAll({
            include: [
              {
                model: connection.Bill,
                where: {
                  store_id: global.storeDetails.store_id,
                  // user_id: global.storeDetails.username,
                  created_time: {
                    [connection.Sequelize.Op.between]: [fromDate, toDate],
                  },
                },
                attributes: [],
                // attributes: ['order_id']
              },
            ],
            raw: true,
            where: {
              discount: {
                [connection.Sequelize.Op.gt]: 0,
              },
            },
            attributes: [
              'title',
              'alternative_title',
              [
                connection.sequelize.literal(
                  `SUM(CAST(COALESCE(mpos_order_child.discount, 0) AS numeric))`,
                ),
                'totalDiscount',
              ],
              [
                connection.sequelize.fn(
                  'sum',
                  connection.sequelize.col('mpos_order_child.quantity'),
                ),
                'qty',
              ],
              'price',
              [
                connection.sequelize.literal(
                  '(mpos_order_child.price * sum(mpos_order_child.quantity))',
                ),
                'finalamount',
              ],
              [
                connection.sequelize.literal(
                  '(CASE mpos_order_child.total =0  WHEN TRUE THEN 0 ELSE mpos_order_child.price END)',
                ),
                'finalPrice',
              ],
            ],
            group: ['title'],
          });

          response.items = disountedItems;
          break;
        case REPORT_TYPES.PAYMENT:
          try {
            const list = await getPaymentsbydate(
              fromDate,
              toDate,
              params.username,
            );
            const whereData = {
              store_id: global.storeDetails.store_id,
              // user_id: global.storeDetails.username,
              created_time: {
                [connection.Sequelize.Op.between]: [fromDate, toDate],
              },
              // order_state: {
              //     [connection.Sequelize.Op.in]: Object.values(OrderState),
              // }
            };
            if (params.username) {
              Object.assign(whereData, {
                createdBy: params.username,
              });
            }
            const bills = await connection.Bill.findAll({
              raw: true,
              where: whereData,
              attributes: [
                'order_id',
                'order_total',
                'discount',
                'order_level_total_charges',
                'order_level_total_taxes',
                'charges_level_total_tax',
                'order_state',
                'total_external_discount',
                'my_order_date',
                'quantity',
                'extra_details',
                'custom_bill_number',
                'bill_number',
                'due_payment',
                'payment',
                [
                  connection.sequelize.literal(
                    `(COALESCE(order_level_total_charges, 0) - COALESCE(charges_level_total_tax, 0))`,
                  ),
                  'order_level_total_charges_without_tax',
                ],
              ],
            });

            bills.map((ele) => {
              if (ele.quantity) {
                ele.quantity = Number(
                  ele.quantity.toFixed(global.ROUNDOFF_UPTO),
                );
              }
            });
            response.bills = bills;
            response.list = list;
            response.totalBills = bills?.length;

            let invoiceRange = await connection.Bill.getBillrange({
              ...whereData,
              fromDate,
              toDate,
            });

            if (invoiceRange) {
              const bill_range = {
                min_bill_number: invoiceRange.min_bill_number,
                max_bill_number: invoiceRange.max_bill_number,
              };
              invoiceRange = Object.values(bill_range).join('-');
              response.invoice_range = invoiceRange;
            }
          } catch (error) {
            console.log(error);
          }
          break;
        case REPORT_TYPES.VAT_REPORT:
          params.store_id = String(global.storeDetails?.store_id || '1');
          const startDateOnlyVat = String(fromDate).slice(0, 10);
          const endDateOnlyVat = String(toDate).slice(0, 10);

          const whereCondition = {
            [connection.Sequelize.Op.and]: [
              {
                [connection.Sequelize.Op.or]: [
                  { store_id: params.store_id },
                  { store_id: 'STORE_1' },
                  { store_id: '1' }
                ]
              },
              {
                [connection.Sequelize.Op.or]: [
                  { my_order_date: { [connection.Sequelize.Op.between]: [startDateOnlyVat, endDateOnlyVat] } },
                  { my_order_date: null }
                ]
              }
            ]
          };

          // getting order_id and extra_details for tax
          const vatReportList = await connection.Bill.findAll({
            raw: true,
            where: whereCondition,
          });
          response.bills = vatReportList;
          response.vatReportList = vatReportList;

          const allOrderIds = [];
          let allTaxes = [];
          let totalCharges = 0;
          let totalDiscount = 0;
          let totalBills = 0;
          vatReportList.map((order) => {
            if (order) {
              allOrderIds.push(order.order_id);
              const extra_details =
                order.extra_details && JSON.parse(order.extra_details);

              extra_details &&
                extra_details.tax &&
                allTaxes.push(extra_details.tax);
              totalCharges += Number(order.charges);
              totalDiscount += Number(order.discount);
            }
          });
          allTaxes = allTaxes.flat();
          totalBills = allOrderIds.length;

          // get all order items
          const orderItems = await connection.BillItem.findAll({
            raw: true,
            attributes: [
              'product_group_name',
              'tax_name',
              [connection.sequelize.literal('tax_per'), 'taxPercentage'],
              [
                connection.sequelize.fn(
                  'sum',
                  connection.sequelize.col('mpos_order_child.total'),
                ),
                'totalAmount',
              ],
              // [connection.sequelize.literal('ROUND(SUM(mpos_order_child.total),2)'), 'totalAmount'],
              [
                connection.sequelize.fn(
                  'sum',
                  connection.sequelize.col('mpos_order_child.quantity'),
                ),
                'orders',
              ],
              [
                connection.sequelize.fn(
                  'sum',
                  connection.sequelize.col('mpos_order_child.tax_value'),
                ),
                'totalTax',
              ],
              // [connection.sequelize.literal('ROUND(SUM(mpos_order_child.tax_value),2)'), 'totalTax'],
            ],
            group: ['product_group_name'],
            where: {
              orderMasterId: {
                [connection.Sequelize.Op.in]: allOrderIds,
              },
            },
          });

          orderItems.map((tax) => {
            tax.orders = tax.orders.toFixed(global.ROUNDOFF_UPTO);
            tax.total = tax.totalAmount - tax.totalTax;
            tax.total = tax.total.toFixed(global.ROUNDOFF_UPTO);
            tax.totalAmount = tax.totalAmount.toFixed(global.ROUNDOFF_UPTO);
            tax.totalTax = tax.totalTax.toFixed(global.ROUNDOFF_UPTO);
          });

          var result = [];
          allTaxes.reduce((res, value) => {
            if (!res[value.section]) {
              res[value.section] = {
                section: value.section,
                amount: 0,
                tax_inclusive: value.tax_inclusive,
              };
              result.push(res[value.section]);
            }
            res[value.section].amount += Number(
              value.amount.toFixed(global.ROUNDOFF_UPTO),
            );
            return res;
          }, {});

          for (let i = 0; i < orderItems.length; i++) {
            for (let j = 0; j < result.length; j++) {
              if (orderItems[i].product_group_name == result[j].section) {
                //old one
                if (orderItems[i].taxPercentage === 0) {
                  orderItems[i].taxPercentage = '-';
                }
                orderItems[i].totalTax = result[j].amount.toFixed(
                  global.ROUNDOFF_UPTO,
                );
                orderItems[i].total = result[j].tax_inclusive
                  ? Number(
                      Number(orderItems[i].totalAmount).toFixed(
                        global.ROUNDOFF_UPTO,
                      ) -
                        Number(result[j].amount).toFixed(global.ROUNDOFF_UPTO),
                    ).toFixed(global.ROUNDOFF_UPTO)
                  : Number(orderItems[i].totalAmount).toFixed(
                      global.ROUNDOFF_UPTO,
                    );
                orderItems[i].totalAmount = !result[j].tax_inclusive
                  ? Number(
                      Number(
                        Number(orderItems[i].totalAmount).toFixed(
                          global.ROUNDOFF_UPTO,
                        ),
                      ) +
                        Number(result[j].amount.toFixed(global.ROUNDOFF_UPTO)),
                    ).toFixed(ROUNDOFF_UPTO)
                  : Number(orderItems[i].totalAmount).toFixed(
                      global.ROUNDOFF_UPTO,
                    );
              }
            }
          }

          const payments = await getPaymentsbydate(fromDate, toDate);

          response.payments = payments;
          response.vatReportList = orderItems;
          response.totalCharges = totalCharges;
          response.totalDiscount = totalDiscount;
          response.totalBills = totalBills;
          break;
        case REPORT_TYPES.ORDER_FROM:
          const orderWhereData = {
            store_id: global.storeDetails.store_id,
            // user_id: global.storeDetails.username,
            created_time: {
              [connection.Sequelize.Op.between]: [fromDate, toDate],
            },
          };

          if (params.username) {
            Object.assign(orderWhereData, {
              createdBy: params.username,
            });
          }
          const orderList = await connection.Bill.findAll({
            raw: true,
            where: orderWhereData,
            attributes: [
              'billing_type',
              // [
              //   connection.sequelize.fn(
              //     'sum',
              //     connection.sequelize.col('mpos_order.order_total'),
              //   ),
              //   'amount',
              // ],
              [
                connection.sequelize.literal(
                  `printf("%.${global.ROUNDOFF_UPTO}f", sum(mpos_order.order_total))`,
                ),
                'amount',
              ],
              [
                connection.sequelize.fn(
                  'sum',
                  connection.sequelize.col(
                    'mpos_order.order_level_total_taxes',
                  ),
                ),
                'totalTax',
              ],
              [
                connection.sequelize.fn(
                  'sum',
                  connection.sequelize.col('mpos_order.discount'),
                ),
                'totalDiscount',
              ],
              [
                connection.sequelize.fn(
                  'sum',
                  connection.sequelize.col(
                    'mpos_order.order_level_total_charges',
                  ),
                ),
                'totalCharges',
              ],
              [
                connection.sequelize.literal('count(mpos_order.order_id)'),
                'count',
              ],
              'order_state',
            ],
            group: ['billing_type', 'order_state'],
          });
          response.list = orderList;
          response.totalBills = orderList?.length;

          let invoicerange = await connection.Bill.getBillrange({
            ...orderWhereData,
            fromDate,
            toDate,
          });

          if (invoicerange) {
            const bill_range = {
              min_bill_number: invoicerange.min_bill_number,
              max_bill_number: invoicerange.max_bill_number,
            };
            invoicerange = Object.values(bill_range).join('-');
            response.invoice_range = invoicerange;
          }

          break;
        case REPORT_TYPES.CATEGORYWISE:
          {
            const catdataList = await connection.BillItem.getCategorywisereport(
              fromDate,
              toDate,
              global.storeDetails.store_id,
              // global.storeDetails.username,
              params.username,
            );
            response.list = catdataList;
            if (
              params.printwithItems &&
              catdataList &&
              Array.isArray(catdataList) &&
              catdataList.length > 0
            ) {
              // console.log('get items too');
              for (const category of catdataList) {
                const items =
                  await connection.BillItem.getCategorywiseitemsreport(
                    fromDate,
                    toDate,
                    global.storeDetails.store_id,
                    // global.storeDetails.username,
                    params.username,
                    category.category_ref_ids,
                    groupByBaseItem,
                  );
                category.items = items;
              }
            }
          }
          break;
        case REPORT_TYPES.KDWISE:
          {
            const kdwisedataList = await connection.BillItem.getkdwisereport(
              fromDate,
              toDate,
              global.storeDetails.store_id,
              // global.storeDetails.username,
              params.username,
            );
            response.list = kdwisedataList;
          }
          break;
        case REPORT_TYPES.COUPON_HISTORY:
          {
            const couponWhereData = {
              store_id: global.storeDetails.store_id,
              used_date: {
                [connection.Sequelize.Op.between]: [fromDate, toDate],
              },
            };
            if (params.username) {
              Object.assign(whereData, {
                logedin_user: params.username,
              });
            }
            const couponHistory =
              await connection.CoupondiscountHistory.findAll({
                raw: true,
                attributes: [
                  'id',
                  'tmpos_id',
                  'store_id',
                  'logedin_user',
                  'coupon_code',
                  'customer_name',
                  'customer_phone',
                  'coupon_code_amt',
                  'used_date',
                  'order_id',
                  'sync_flag',
                  'is_loyalty_coupon',
                ],
                where: couponWhereData,
              });
            response.list = couponHistory;
          }
          break;
        case REPORT_TYPES.START_CLOSEDAY:
          {
            const day_end = await connection.StartcloseDay.findAll({
              raw: true,
              attributes: [
                'id',
                'tmpos_id',
                'store_id',
                'start_day_date',
                'day_start_by_user',
                'day_close_date',
                'day_close_by_user',
                'opening_balance',
                'prev_closing_balance',
                'total_expense',
                'total_sales',
                'current_closing_balance',
                'created_date',
                'day_start_petty_cash_amt',
                'day_close_petty_cash_amt',
                'invoice_range',
                'start_day_comment',
                'close_day_comment',
                'extra_details',
                'sync_flag',
                'cash_diff',
                'close_day_amount',
                'raw_cash_in_hand',
              ],
              where: {
                store_id: global.storeDetails.store_id,
                created_date: {
                  [connection.Sequelize.Op.between]: [fromDate, toDate],
                },
              },
            });
            response.list = day_end;
          }
          break;
        case REPORT_TYPES.USER_SHIFT:
          {
            const day_end = await connection.UserShift.findAll({
              raw: true,
              attributes: [
                'id',
                'tmpos_id',
                'store_id',
                'shift_start_date',
                'shift_start_by_user',
                'shift_end_date',
                'shift_end_by_user',
                [
                  connection.sequelize.literal(
                    `printf("%.${global.ROUNDOFF_UPTO}f", opening_balance)`,
                  ),
                  'opening_balance',
                ],
                [
                  connection.sequelize.literal(
                    `printf("%.${global.ROUNDOFF_UPTO}f", prev_closing_balance)`,
                  ),
                  'prev_closing_balance',
                ],
                [
                  connection.sequelize.literal(
                    `printf("%.${global.ROUNDOFF_UPTO}f", total_expense)`,
                  ),
                  'total_expense',
                ],
                [
                  connection.sequelize.literal(
                    `printf("%.${global.ROUNDOFF_UPTO}f", total_sales)`,
                  ),
                  'total_sales',
                ],
                [
                  connection.sequelize.literal(
                    `printf("%.${global.ROUNDOFF_UPTO}f", current_closing_balance)`,
                  ),
                  'current_closing_balance',
                ],
                'created_date',
                [
                  connection.sequelize.literal(
                    `printf("%.${global.ROUNDOFF_UPTO}f", day_start_petty_cash_amt)`,
                  ),
                  'day_start_petty_cash_amt',
                ],
                [
                  connection.sequelize.literal(
                    `printf("%.${global.ROUNDOFF_UPTO}f", day_close_petty_cash_amt)`,
                  ),
                  'day_close_petty_cash_amt',
                ],
                'invoice_range',
                'shift_start_comment',
                'shift_end_comment',
                'extra_details',
                'sync_flag',
                [
                  connection.sequelize.literal(
                    `printf("%.${global.ROUNDOFF_UPTO}f", cash_diff)`,
                  ),
                  'cash_diff',
                ],
                [
                  connection.sequelize.literal(
                    `printf("%.${global.ROUNDOFF_UPTO}f", close_shift_amount)`,
                  ),
                  'close_shift_amount',
                ],
                [
                  connection.sequelize.literal(
                    `printf("%.${global.ROUNDOFF_UPTO}f", raw_cash_in_hand)`,
                  ),
                  'raw_cash_in_hand',
                ],
              ],
              where: {
                store_id: global.storeDetails.store_id,
                shift_start_date: {
                  [connection.Sequelize.Op.ne]: null,
                },
                shift_end_date: {
                  [connection.Sequelize.Op.ne]: null,
                },
                shift_start_by_user: global.storeDetails.username,
              },
            });
            response.list = day_end;
          }

          break;
        case REPORT_TYPES.DUE_PAYMENT:
          {
            params.store_id = global.storeDetails.store_id;
            const where = {
              // user_id: global.storeDetails.username,
              store_id: global.storeDetails.store_id,
              due_payment: {
                [connection.Sequelize.Op.ne]: 0,
              },
              order_state: {
                [connection.Sequelize.Op.notIn]: ['pending', 'cancelled'],
              },
            };
            if (fromDate && toDate) {
              where.created_time = {
                [connection.Sequelize.Op.between]: [fromDate, toDate],
              };
            }

            if (params.username) {
              Object.assign(where, {
                createdBy: params.username,
              });
            }

            const allDueslist2 = await connection.Bill.findAll({
              raw: true,
              attributes: [
                'store_id',
                [
                  connection.sequelize.literal(
                    `printf("%.${global.ROUNDOFF_UPTO}f", due_payment)`,
                  ),
                  'due_amount',
                ],
                ['phone', 'cust_mobile'],
                ['user_id', 'billing_user_id'],
                'order_id',
                ['order_total', 'amount_to_pay'],
                'cust_name',
                'order_state',
                'bill_number',
                [
                  connection.Sequelize.literal('(order_total - due_payment)'),
                  'received_amount',
                ],
              ],
              where,
            });

            for (const due of allDueslist2) {
              const payments = await connection.BillPayment.findAll({
                raw: true,
                where: {
                  order_id: due.order_id,
                },
              });
              const payment_info = payments
                .map(
                  (elem) =>
                    `${elem.payment_option}-${elem.amount.toFixed(global.ROUNDOFF_UPTO)}`,
                )
                .join(',');
              due.payment_info = payment_info;
              due.payments = payments;
            }

            response.list = allDueslist2;
          }
          break;
        case REPORT_TYPES.DUE_PAYMENT_HISTORY:
          {
            params.store_id = global.storeDetails.store_id;
            const where = {
              // user_id: global.storeDetails.username,
              store_id: global.storeDetails.store_id,
              due_payment: 0,
              hasDuepayment: 1,
              order_state: {
                [connection.Sequelize.Op.notIn]: ['pending', 'cancelled'],
              },
            };
            if (fromDate && toDate) {
              where.created_time = {
                [connection.Sequelize.Op.between]: [fromDate, toDate],
              };
            }

            if (params.username) {
              Object.assign(where, {
                createdBy: params.username,
              });
            }

            const allDueslist2 = await connection.Bill.findAll({
              raw: true,
              attributes: [
                'store_id',
                ['phone', 'cust_mobile'],
                ['user_id', 'billing_user_id'],
                'order_id',
                'cust_name',
              ],
              where,
            });

            for (const due of allDueslist2) {
              const payments = await connection.BillPayment.findAll({
                raw: true,
                where: {
                  order_id: due.order_id,
                },
              });
              const payment_info = payments
                .map(
                  (elem) =>
                    `${elem.payment_option}-${elem.amount.toFixed(global.ROUNDOFF_UPTO)}`,
                )
                .join(',');
              due.payment_info = payment_info;
              due.payments = payments;
            }

            response.list = allDueslist2;
          }
          break;
        case REPORT_TYPES.DUE_BY_CUSTOMER:
          {
            params.store_id = global.storeDetails.store_id;
            const where = {
              // user_id: global.storeDetails.username,
              store_id: global.storeDetails.store_id,
              due_payment: {
                [connection.Sequelize.Op.ne]: 0,
              },
              order_state: {
                [connection.Sequelize.Op.not]: 'pending',
              },
            };
            if (fromDate && toDate) {
              where.created_time = {
                [connection.Sequelize.Op.between]: [fromDate, toDate],
              };
            }

            if (params.username) {
              Object.assign(where, {
                createdBy: params.username,
              });
            }

            const duebyCustomers = await connection.Bill.findAll({
              raw: true,
              attributes: [
                'store_id',
                ['phone', 'cust_mobile'],
                'cust_name',
                [
                  connection.Sequelize.fn(
                    'sum',
                    connection.sequelize.col('due_payment'),
                  ),
                  'due_payment',
                ],
              ],
              group: ['phone'],
              where,
            });

            duebyCustomers.map((payment) => {
              payment.due_payment = payment.due_payment.toFixed(
                global.ROUNDOFF_UPTO,
              );
            });
            response.list = duebyCustomers;
          }
          break;
        case REPORT_TYPES.BILLPRINT_HISTORY:
          params.store_id = global.storeDetails.store_id;
          const billPrintWhereData = {
            store_id: params.store_id,
            [connection.Sequelize.Op.or]: [
              {
                print_status: {
                  [connection.Sequelize.Op.gt]: 0,
                },
              },
              // {draftprint_status: {
              //     [connection.Sequelize.Op.gt]: 0
              // }}
            ],
            created_time: {
              [connection.Sequelize.Op.between]: [fromDate, toDate],
            },
          };
          if (params.username) {
            Object.assign(billPrintWhereData, {
              createdBy: params.username,
            });
          }
          const billprintHistory = await connection.Bill.findAll({
            raw: true,
            attributes: [
              'order_id',
              'table_name',
              'my_order_date',
              'billing_type',
              'order_state',
              'print_status',
              'bill_number',
              [
                connection.sequelize.literal(
                  `printf("%.${global.ROUNDOFF_UPTO}f", order_total)`,
                ),
                'order_total',
              ],
            ],
            where: billPrintWhereData,
          });
          response.billprintHistory = billprintHistory;
          break;
        case REPORT_TYPES.APPLIED_CHARGES_HISTORY:
          params.store_id = global.storeDetails.store_id;
          const appliedChargehistory =
            await connection.BillCharges.getappliedchargesHistorynew({
              store_id: params.store_id,
              fromDate,
              toDate,
            });
          response.appliedChargehistory = appliedChargehistory;
          break;
        case REPORT_TYPES.PRE_ORDER_REPORT:
          params.store_id = global.storeDetails.store_id;
          let preordersList = await connection.PreOrder.findAll({
            raw: true,
            where: {
              store_id: params.store_id,
              delivery_at: {
                [connection.Sequelize.Op.between]: [fromDate, toDate],
              },
            },
          });
          if (preordersList && preordersList.length) {
            preordersList = [...preordersList];
            for (let i = 0; i < preordersList.length; i++) {
              const items = await getBillitems(preordersList[i].order_id);
              preordersList[i].items = items;
            }
          }
          response.preordersList = preordersList;
          break;

        case REPORT_TYPES.KOT_REPORT:
          const kotReportWhereData = {
            [connection.Sequelize.Op.and]: [
              {
                [connection.Sequelize.Op.or]: [
                  { store_id: String(global.storeDetails?.store_id || '1') },
                  { store_id: 'STORE_1' },
                  { store_id: '1' }
                ]
              }
            ]
          };
          if (params.username) {
            kotReportWhereData[connection.Sequelize.Op.and].push({ createdBy: params.username });
          }
          const kot_data = await connection.KOT.findAll({
            raw: true,
            attributes: [
              'bill_number',
              'billing_type',
              'kot_number',
              'in_time',
              'table_name',
              'createdBy',
              'waiter',
            ],
            include: [
              {
                as: 'kotItems',
                model: connection.KOTItem,
                attributes: [
                  'item_name',
                  'alternative_title',
                  'status',
                  'item_price',
                  'quantity',
                  'amount',
                  'createdBy',
                ],
                where: {
                  [connection.Sequelize.Op.or]: [
                    {
                      comment: {
                        [connection.Sequelize.Op.notIn]: [
                          '##DELETE_THIS_ITEM##',
                        ],
                      },
                    },
                    {
                      comment: null, // Include null values
                    },
                  ],
                },
              },
            ],
            where: kotReportWhereData,
          });
          response.kotReportData = kot_data;
          break;

        case REPORT_TYPES.RESERVATION_REPORT:
          const reservationData = await connection.TableReservation.findAll({
            raw: true,
            where: {
              store_id: global.storeDetails.store_id,
              created_time: {
                [connection.Sequelize.Op.between]: [fromDate, toDate],
              },
            },
          });
          response.reservationData = reservationData;

          break;

        case REPORT_TYPES.DELIVERY_BOY_REPORT:
          const deliveryboySummary = await getDeliveryboySummarybydate({
            store_id: global.storeDetails.store_id,
            // user_id: global.storeDetails.username,
            created_time: {
              [connection.Sequelize.Op.between]: [fromDate, toDate],
            },
            // order_state: {
            //     [connection.Sequelize.Op.in]: Object.values(OrderState),
            // }
            createdBy: params.username,
          });
          response.deliveryboySummary = deliveryboySummary;
          break;

        case REPORT_TYPES.USER_REPORT:
          const userReportWhereData = {
            store_id: global.storeDetails.store_id,
            // user_id: global.storeDetails.username,
            created_time: {
              [connection.Sequelize.Op.between]: [fromDate, toDate],
            },
            order_state: 'fulfilled',
          };

          if (params.username) {
            Object.assign(userReportWhereData, {
              createdBy: params.username,
            });
          }
          const userwiseList = await connection.Bill.findAll({
            raw: true,
            where: userReportWhereData,
            attributes: [
              'billing_type',
              // [
              //   connection.sequelize.fn(
              //     'sum',
              //     connection.sequelize.col('mpos_order.order_total'),
              //   ),
              //   'amount',
              // ],
              [
                connection.sequelize.literal(
                  `printf("%.${global.ROUNDOFF_UPTO}f", sum(mpos_order.order_total))`,
                ),
                'amount',
              ],
              [
                connection.sequelize.fn(
                  'sum',
                  connection.sequelize.col(
                    'mpos_order.order_level_total_taxes',
                  ),
                ),
                'totalTax',
              ],
              [
                connection.sequelize.fn(
                  'sum',
                  connection.sequelize.col('mpos_order.discount'),
                ),
                'totalDiscount',
              ],
              [
                connection.sequelize.fn(
                  'sum',
                  connection.sequelize.col(
                    'mpos_order.order_level_total_charges',
                  ),
                ),
                'totalCharges',
              ],
              [
                connection.sequelize.literal('count(mpos_order.order_id)'),
                'count',
              ],
              'createdBy',
              'order_state',
            ],
            group: ['createdBy'],
          });
          response.userwiseList = userwiseList;
          break;
        default:
          break;
      }
    } catch (error) {
      console.log(error);
    }
  }
  return response;
}

if (ipcMain && typeof ipcMain.on === 'function') {
  ipcMain.on(REPORT_MESSAGES.GET_REPORTDATA, async (event, params) => {
    const response = await getReportData(params);
    event.reply(REPORT_MESSAGES.GET_REPORTDATA_REPLY, JSON.stringify(response));
  });
}

async function getPaymentsbydate(fromDate, toDate, user_id = '') {
  let paymentList = [];
  try {
    paymentList = await connection.BillPayment.getPayments({
      store_id: global.storeDetails.store_id,
      fromDate,
      toDate,
      user_id,
      groupBy: 'order_state,payment_option',
    });
  } catch (error) {
    console.log(error);
  }
  return paymentList;
}

async function getWaiterSummarybydate(whereData) {
  let waiterList = [];
  try {
    const data = await connection.Bill.findAll({
      raw: true,
      attributes: [
        // [
        //   connection.Sequelize.fn(
        //     'sum',
        //     connection.Sequelize.col('order_total'),
        //   ),
        //   'order_total',
        // ],
        'order_total',
        'extra_details',
        'waiter',
        'waiter_id',
      ],
      // group: ['waiter_id'],
      where: {
        ...whereData,
        order_state: 'fulfilled',
        waiter_id: {
          [connection.Sequelize.Op.ne]: 0,
        },
      },
    });
    if (data && data.length) {
      waiterList = Object.values(
        data.reduce((acc, item) => {
          const waiterId = item.waiter_id;
          const extraDetails = JSON.parse(item.extra_details);
          // Initialize if not exists
          if (!acc[waiterId]) {
            acc[waiterId] = {
              waiter_id: waiterId,
              waiter: item.waiter,
              total_order: 0,
              total_tip: 0,
              count: 0,
            };
          }

          // Aggregate values
          acc[waiterId].total_order += item.order_total;
          if (extraDetails.total_tip) {
            acc[waiterId].total_tip += Number(extraDetails.total_tip);
          }
          acc[waiterId].count += 1;

          return acc;
        }, {}),
      );
    }
    return waiterList;
  } catch (err) {
    console.log(err);
  }
}

async function getDeliveryboySummarybydate(whereData) {
  let waiterList = [];
  if (!whereData.createdBy) {
    delete whereData.createdBy;
  }
  try {
    waiterList = await connection.Bill.count({
      attributes: [
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f",( sum(mpos_order.order_total)))`,
          ),
          'order_total',
        ],
        'delivery_boy_name',
        'delivery_boy_phone',
        'order_state',
      ],
      group: ['delivery_boy_name', 'order_state'],
      where: {
        ...whereData,
        // order_state: 'fulfilled',
        delivery_boy_phone: {
          [connection.Sequelize.Op.ne]: null,
        },
        billing_type: 3,
      },
    });
    return waiterList;
  } catch (err) {
    console.log(err);
  }
}

async function getDuePaymentSummarybydate(fromDate, toDate, user_id) {
  let deuPaymentList = [];
  const currentStoreId = String(global.storeDetails?.store_id || '1');
  const duePaymentWhereData = {
    [connection.Sequelize.Op.and]: [
      {
        [connection.Sequelize.Op.or]: [
          { store_id: currentStoreId },
          { store_id: 'STORE_1' },
          { store_id: '1' }
        ]
      },
      {
        received_amount: {
          [connection.Sequelize.Op.ne]: 0
        }
      }
    ]
  };
  if (user_id) {
    duePaymentWhereData[connection.Sequelize.Op.and].push({ billing_user_id: user_id });
  }
  try {
    deuPaymentList = await connection.Duepayments.findAll({
      raw: true,
      attributes: [
        [
          connection.sequelize.literal('SUM(CAST(COALESCE("received_amount", 0) AS numeric))'),
          'total_amount',
        ],
        'payment_mode',
        'bill_number',
        'customer_name',
        'created_time',
        'cust_mobile',
      ],
      group: ['payment_mode', 'cust_mobile', 'bill_number', 'customer_name', 'created_time'],
      where: duePaymentWhereData,
    });
    return deuPaymentList;
  } catch (err) {
    console.log(err);
  }
}

async function getDuePaymentReceivableSummarybydate(fromDate, toDate) {
  let deuPaymentList = [];
  try {
    deuPaymentList = await connection.Duepayments.findAll({
      raw: true,
      attributes: [
        ['due_amount', 'total_amount'],
        'bill_number',
        'customer_name',
        'created_time',
        'order_id',
        'cust_mobile',
      ],
      order: [['id', 'DESC']],
      where: {
        status: true,
      },
    });

    const lastTransactions = {};
    deuPaymentList.forEach((tx) => {
      if (!lastTransactions[tx.order_id]) {
        lastTransactions[tx.order_id] = tx;
      }
    });
    const result = Object.values(lastTransactions);
    return result;
  } catch (err) {
    console.log(err);
  }
}

async function getOrderTypewisesummarybydate(whereData) {
  let orderTypewiseList = [];
  try {
    orderTypewiseList = await connection.Bill.count({
      attributes: [
        [
          connection.sequelize.literal('SUM(CAST(COALESCE("order_total", \'0\') AS numeric))'),
          'order_total',
        ],
        'billing_type',
        [
          connection.sequelize.literal('SUM(CAST(COALESCE("order_total", \'0\') AS numeric))'),
          'total_by_billing_type',
        ],
        [
          connection.sequelize.literal('100.0'),
          'percentage',
        ],
      ],
      group: ['billing_type'],
      where: {
        ...whereData,
        order_state: 'fulfilled',
      },
    });

    return orderTypewiseList;
  } catch (err) {
    console.log(err);
  }
}

async function getDiscountSummarybydate(whereData) {
  let discountList = [];
  try {
    discountList = await connection.Bill.count({
      attributes: [
        [
          connection.Sequelize.literal('SUM(CAST(COALESCE("order_total", \'0\') AS numeric))'),
          'order_total',
        ],
        'discount_title',
        'coupon',
        [
          connection.Sequelize.literal('SUM(CAST(COALESCE("discount", \'0\') AS numeric))'),
          'total_discount',
        ],
      ],
      group: ['discount_title', 'coupon'],
      where: {
        ...whereData,
        [connection.Sequelize.Op.and]: [
          connection.Sequelize.literal('CAST(COALESCE("discount", \'0\') AS numeric) > 0')
        ]
      },
    });

    if (discountList && discountList.length) {
      discountList.forEach((discount) => {
        if (discount.coupon && discount.couponDisounttotal) {
          discount.total_discount -= discount.couponDisounttotal;
        }
      });
    }

    const couponList = await connection.Bill.count({
      attributes: [
        [
          connection.Sequelize.literal('SUM(CAST(COALESCE("order_total", \'0\') AS numeric))'),
          'order_total',
        ],
        ['coupon', 'discount_title'],
        [
          connection.Sequelize.literal('SUM(CAST(COALESCE("couponDisounttotal", \'0\') AS numeric))'),
          'total_discount',
        ],
      ],
      group: ['coupon'],
      where: {
        ...whereData,
      },
    });

    discountList.push(...couponList);
    return discountList;
  } catch (err) {
    console.log(err);
  }
}

async function getWalletSummarybydate({ toDate, fromDate }) {
  let transactionsList = [];
  const formattedFromDate = global
    .moment(Number(fromDate))
    .format('YYYY-MM-DD HH:mm:ss.SSS Z');
  const formattedToDate = global
    .moment(Number(toDate))
    .format('YYYY-MM-DD HH:mm:ss.SSS Z');
  try {
    transactionsList = await connection.WalletTransactions.findAll({
      raw: true,
      attributes: [
        // 'amount',
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f",(sum(mpos_wallet_transactions.amount)))`,
          ),
          'amount',
        ],
        'available_balance',
        'created_time',
        'credit_debit_type',
        'cust_phone',
        'id',
        'order_id',
        'payment_mode',
        'sync_flag',
        'transaction_id',
        'user_id',
        'wallet_id',
      ],

      include: [
        {
          model: connection.Wallet,
          attributes: ['wallet_name'],
        },
      ],
      group: [
        'credit_debit_type',
        'mpos_wallet_transactions.cust_phone',
        'payment_mode',
      ],
      where: {
        created_time: {
          [connection.Sequelize.Op.between]: [
            formattedFromDate,
            formattedToDate,
          ],
        },
      },
    });
    if (transactionsList && transactionsList.length) {
      const grouped = transactionsList.reduce((acc, curr) => {
        const key = `${curr.cust_phone}-${curr.payment_mode || 'null'}`; // Unique key for cust_phone and payment_mode

        // If this combination hasn't been seen yet, initialize it
        if (!acc[key]) {
          acc[key] = { ...curr, credit: 0, debit: 0 };
        }

        // Update credit or debit
        if (curr.credit_debit_type === 1) {
          acc[key].credit += curr.amount;
        } else if (curr.credit_debit_type === 0) {
          acc[key].debit += curr.amount;
        }

        return acc;
      }, {});
      const result = Object.values(grouped);
      transactionsList = result;
    }
    return transactionsList;
  } catch (err) {
    console.log(err);
  }
}

async function getExpensesByDate(fromDate, toDate, user_id) {
  let expenseData = [];
  const expenseWhereData = {
    store_id: global.storeDetails.store_id,
    expense_time: {
      [connection.Sequelize.Op.between]: [fromDate, toDate],
    },
  };
  if (user_id) {
    Object.assign(expenseData, {
      user_id,
    });
  }
  try {
    expenseData = await connection.Expenses.findAll({
      raw: true,
      // attributes: ['category_name', 'sub_category_name', 'payment_mode', 'amount', 'is_chargable', ''],
      where: expenseWhereData,
    });
  } catch (err) {}

  return expenseData;
}
async function getSolditemsbydate({
  fromDate,
  toDate,
  username: user_id,
  groupByBaseItem,
}) {
  let soldItems = [];
  const startDateOnly = String(fromDate).slice(0, 10);
  const endDateOnly = String(toDate).slice(0, 10);
  const currentStoreId = String(global.storeDetails?.store_id || '1');

  const billWhereData = {
    [connection.Sequelize.Op.and]: [
      {
        [connection.Sequelize.Op.or]: [
          { store_id: currentStoreId },
          { store_id: 'STORE_1' },
          { store_id: '1' }
        ]
      },
      {
        [connection.Sequelize.Op.or]: [
          { my_order_date: { [connection.Sequelize.Op.between]: [startDateOnly, endDateOnly] } },
          { my_order_date: null }
        ]
      }
    ]
  };

  if (user_id) {
    billWhereData[connection.Sequelize.Op.and].push({ createdBy: user_id });
  }
  let groupBy = ['title', 'price'];
  if (groupByBaseItem) {
    groupBy = ['item_id'];
  }
  try {
    soldItems = await connection.BillItem.findAll({
      include: [
        {
          model: connection.Bill,
          where: billWhereData,
          attributes: [],
        },
      ],
      raw: true,
      where: {},
      attributes: [
        'title',
        'price',
        [
          connection.sequelize.literal('SUM(CAST(COALESCE(mpos_order_child.quantity, 0) AS numeric))'),
          'qty',
        ],
        [
          connection.sequelize.literal('SUM(CAST(COALESCE(mpos_order_child.quantity, 0) * COALESCE(mpos_order_child.price, 0) AS numeric))'),
          'finalamount',
        ],
        [
          connection.sequelize.literal('SUM(CAST(COALESCE(mpos_order_child.quantity, 0) * COALESCE(mpos_order_child.price, 0) AS numeric))'),
          'total',
        ],
        [
          connection.sequelize.literal('AVG(CAST(COALESCE(mpos_order_child.price, 0) AS numeric))'),
          'finalPrice',
        ],
        [
          connection.sequelize.literal('SUM(CAST(COALESCE(mpos_order_child.total, 0) AS numeric))'),
          'total_withouttax_old',
        ],
        [
          connection.sequelize.literal('SUM(CAST(COALESCE(mpos_order_child.total_with_tax, 0) AS numeric))'),
          'total_withouttax',
        ],
        [
          connection.sequelize.literal('SUM(CAST(COALESCE(mpos_order_child.total_with_tax, 0) AS numeric))'),
          'total_with_tax',
        ],
      ],
      group: groupBy,
    });
  } catch (err) {
    console.log(err);
  }
  return soldItems;
}

async function getPaymentsbydateForCloseday(fromDate, toDate, user_id) {
  let paymentList = [];
  try {
    paymentList = await connection.BillPayment.getPaymentsForCLoseDay({
      store_id: global.storeDetails.store_id,
      fromDate,
      toDate,
      user_id,
      groupBy: 'order_state,payment_option',
    });
  } catch (error) {
    console.log(error);
  }
  return paymentList;
}

async function getSolditemsbydateForCloseDay(fromDate, toDate, user_id) {
  let soldItems = [];
  try {
    const whereData = {
      store_id: global.storeDetails.store_id,
      // user_id: global.storeDetails.username,
      actual_created_time: {
        [connection.Sequelize.Op.between]: [fromDate, toDate],
      },
      order_state: {
        [connection.Sequelize.Op.in]: [OrderState.FULFILLED, OrderState.FREE],
      },
    };

    if (user_id) {
      Object.assign(whereData, {
        user_id,
      });
    }
    soldItems = await connection.BillItem.findAll({
      include: [
        {
          model: connection.Bill,
          where: whereData,
          attributes: ['order_id'],
        },
      ],
      raw: true,
      where: {},
      attributes: [
        'id',
        'title',
        // [connection.sequelize.fn('sum', connection.sequelize.col('mpos_order_child.quantity')), 'qty'],
        // [connection.sequelize.literal('ROUND((sum(mpos_order_child.quantity)),2)'), 'qty'],
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f",(sum(mpos_order_child.quantity)))`,
          ),
          'qty',
        ],
        'price',
        // [connection.sequelize.literal('ROUND((mpos_order_child.price * sum(mpos_order_child.quantity)),2)'), 'finalamount'],
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f",(mpos_order_child.price * sum(mpos_order_child.quantity)))`,
          ),
          'finalamount',
        ],
        // [connection.sequelize.literal('ROUND((mpos_order_child.price * sum(mpos_order_child.quantity)),2)'), 'total'],
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f",(mpos_order_child.price * sum(mpos_order_child.quantity)))`,
          ),
          'total',
        ],
        [
          connection.sequelize.literal(
            '(CASE mpos_order_child.total=0  WHEN TRUE THEN 0 ELSE mpos_order_child.price END)',
          ),
          'finalPrice',
        ],
        [
          connection.sequelize.fn(
            'sum',
            connection.sequelize.col('mpos_order_child.total'),
          ),
          'total_withouttax_old',
        ],
        // [connection.sequelize.literal('(CASE mpos_order_child.tax_method=1 WHEN TRUE THEN sum((mpos_order_child.total_with_tax - (mpos_order_child.tax_value * mpos_order_child.quantity))) ELSE sum(mpos_order_child.total) END)'), 'total_withouttax'],
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f",(CASE mpos_order_child.tax_method=1 WHEN TRUE THEN sum(((mpos_order_child.total_with_tax * mpos_order_child.quantity) - (mpos_order_child.tax_value * mpos_order_child.quantity))) ELSE (SUM(mpos_order_child.quantity) * mpos_order_child.price) END))`,
          ),
          'total_withouttax',
        ],

        // [connection.sequelize.fn('sum', connection.sequelize.col('mpos_order_child.total_with_tax')), 'total_with_tax'],
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f",( sum(mpos_order_child.total_with_tax)))`,
          ),
          'total_with_tax',
        ],
        // [connection.sequelize.literal('(CASE mpos_order_child.tax_method =1  WHEN TRUE THEN 0 ELSE mpos_order_child.price END)'), 'finalPrice'],
      ],
      group: ['title', 'finalPrice'],
    });
  } catch (error) {}
  return soldItems;
}
if (ipcMain && typeof ipcMain.on === 'function') {
  ipcMain.on(REPORT_MESSAGES.GET_STARTENDREPORT_DATA, async (event, params) => {
    // let data = undefined;
    let data = {};
    try {
      params = safeParseformain(params);
      let isDayClosedAtMidnight = false;
      if (params.isDayClosedAtMidnight) {
        isDayClosedAtMidnight = params.isDayClosedAtMidnight;
      }

      const isTimeBetweenMidnightSale = checkIfTimeForMidnightReport();
      const bills = await getusershiftReportdata(params);
      data.bills = bills;
      data.totalBills = bills?.length;
      const paymentDetails = await getPaymentsbydateForCloseday(
        params.fromDate,
        params.toDate,
      );
      data.paymentDetails = paymentDetails;

      if (params.showSolditems) {
        const soldItems = await getSolditemsbydateForCloseDay(
          params.fromDate,
          params.toDate,
        );
        data.soldItems = soldItems;
      }

      const whereData = {
        store_id: global.storeDetails.store_id,
        actual_created_time: {
          [connection.Sequelize.Op.between]: [params.fromDate, params.toDate],
        },
      };

      if (params.showWaiterData) {
        const waiterSummary = await getWaiterSummarybydate(whereData);
        data.waiterSummary = waiterSummary;
      }

      if (params.showDiscountData) {
        const discountSummary = await getDiscountSummarybydate(whereData);
        data.discountSummary = discountSummary;
      }

      if (params.showDeliveryBoyData) {
        const deliveryboySummary = await getDeliveryboySummarybydate(whereData);
        data.deliveryboySummary = deliveryboySummary;
      }
      const orderTypeWiseOrders = await connection.Bill.count({
        attributes: [
          [
            connection.Sequelize.fn(
              'sum',
              connection.Sequelize.col('order_total'),
            ),
            'order_total',
          ],
          [
            connection.Sequelize.fn('sum', connection.Sequelize.col('charges')),
            'charges',
          ],
          [
            connection.Sequelize.fn('sum', connection.Sequelize.col('discount')),
            'discount',
          ],
          [
            connection.Sequelize.fn(
              'sum',
              connection.Sequelize.col('order_level_total_taxes'),
            ),
            'order_level_total_taxes',
          ],
          [
            connection.Sequelize.fn(
              'sum',
              connection.Sequelize.col('charges_level_total_tax'),
            ),
            'charges_level_total_tax',
          ],
        ],
        group: ['billing_type'],
        where: { ...whereData, order_state: 'fulfilled' },
      });
      const extra_details = await connection.Bill.findAll({
        raw: true,
        attributes: ['billing_type', 'extra_details'],
        where: {
          created_time: {
            [connection.Sequelize.Op.between]: [params.fromDate, params.toDate],
          },
          store_id: global.storeDetails.store_id,
          order_state: 'fulfilled',
        },
      });
      const extra_detail = [];
      extra_details.forEach((element) => {
        element.extra_details = JSON.parse(element.extra_details);
        const obj = {};
        if (element.extra_details && element.extra_details.roundedAmount) {
          obj.roundedAmount = Number(element.extra_details.roundedAmount);
          obj.billing_type = element.billing_type;
          extra_detail.push(obj);
        }
      });
      const output = _(extra_detail)
        .groupBy('billing_type')
        .map((objs, key) => ({
          billing_type: key,
          roundedAmount: _.sumBy(objs, 'roundedAmount'),
        }))
        .value();
      orderTypeWiseOrders.map((item) => {
        const value = output.find((o) => o.billing_type == item.billing_type);
        if (value) {
          Object.assign(item, { total_rounded_amt: value.roundedAmount });
        }
      });

      data.orderTypeWiseOrders = orderTypeWiseOrders;

      if (params.showExpenseData) {
        const expenseData = await getExpensesByDate(
          params.fromDate,
          params.toDate,
        );
        data.expenses_list = expenseData;
      }

      if (params.showDuePaymentData) {
        const duePaymentSummary = await getDuePaymentSummarybydate(
          params.fromDate,
          params.toDate,
        );
        data.duePaymentSummary = duePaymentSummary;
      }

      if (params.showDuePaymentReceivableData) {
        const duePaymentReceivableSummary =
          await getDuePaymentReceivableSummarybydate(
            params.fromDate,
            params.toDate,
          );
        data.duePaymentReceivableSummary = duePaymentReceivableSummary;
      }
      if (params.showCategoryData) {
        const catdataList =
          await connection.BillItem.getCategorywisereportForCloseDay(
            params.fromDate,
            params.toDate,
            global.storeDetails.store_id,
            global.storeDetails.username,
          );
        data.catdataList = catdataList;
        if (
          params.printwithItems &&
          catdataList &&
          Array.isArray(catdataList) &&
          catdataList.length > 0
        ) {
          for (const category of catdataList) {
            const items =
              await connection.BillItem.getCategorywiseitemsreportForCloseDay(
                params.fromDate,
                params.toDate,
                global.storeDetails.store_id,
                global.storeDetails.username,
                category.category_ref_ids,
              );
            category.items = items;
          }
        }
      }

      if (params.showCancelitems) {
        const cancelledItems = await connection.KOTItem.getItemsbystatus(
          3,
          params.fromDate,
          params.toDate,
          global.storeDetails.store_id,
        );
        data.cancelledItems = cancelledItems;
      }

      if (params.showWalletData) {
        const walletSummary = await getWalletSummarybydate({
          toDate: params.toDate,
          fromDate: params.fromDate,
        });
        data.walletSummary = walletSummary;
      }

      if (params.showKDWiseItemsData) {
        const kdWiseItemSummary = await connection.BillItem.getkdwisereport(
          params.fromDate,
          params.toDate,
          global.storeDetails.store_id,
        );
        data.kdWiseItemSummary = kdWiseItemSummary;
      }

      data.rowIndex = params.rowIndex;
      data.invoice_range = params.invoice_range;

      if (params.day_close_transactions) {
        data.day_close_transactions = params.day_close_transactions;
      }
    } catch (error) {
      console.log('fetch close day report error::', error);
      data = undefined;
    }
    event.reply(
      REPORT_MESSAGES.GET_STARTENDREPORT_DATA_REPLY,
      JSON.stringify(data),
    );
  });

  ipcMain.on(REPORT_MESSAGES.GET_USERSHIFT_DATA, async (event, params) => {
    let data = {};
    try {
      params = safeParseformain(params);
      const response = await getShiftwiseReport(params);
      data = { ...response };
      data.rowIndex = params.reply.rowIndex;
      data.shift_end_by_user = params.reply.shift_end_by_user;
      data.invoice_range = params.reply.invoice_range;
    } catch (error) {
      console.error(error);
      data = undefined;
    }
    event.reply(REPORT_MESSAGES.GET_USERSHIFT_DATA_REPLY, JSON.stringify(data));
  });
}

/**
 * Generate report data for given start and end date
 * @param {Insertted Start day } insertedId
 */
async function setStartdayotherdetails(
  insertedId,
  current_closing_balance,
  nextInsertedinfo,
  countMidnightSale,
  nextDayOpeningAmount,
) {
  try {
    try {
      current_closing_balance = parseFloat(current_closing_balance);
    } catch (error) {
      current_closing_balance = 0;
    }
    let startenddayRecords = await connection.StartcloseDay.findAll({
      limit: 1,
      raw: true,
      where: {
        id: insertedId,
      },
    });
    if (startenddayRecords && startenddayRecords.length > 0) {
      startenddayRecords = startenddayRecords[0];
      const fromDate = startenddayRecords.start_day_date;
      const toDate = startenddayRecords.day_close_date;
      let { prev_closing_balance } = startenddayRecords;
      const { opening_balance } = startenddayRecords;
      if (prev_closing_balance == null || prev_closing_balance == undefined) {
        prev_closing_balance = 0;
      }

      const isTimeBetweenMidnightSale = checkIfTimeForMidnightReport();

      // if(countMidnightSale && isTimeBetweenMidnightSale ){
      //     // fromDate = moment(fromDate).subtract(1, 'days').format('x');
      //     fromDate = moment(fromDate).set("hour", 00).set("minute", 00).format('x');
      //     toDate = moment(toDate).subtract(1, 'days').set("hour", 23).set("minute", 59).format('x');

      // }

      const params = {
        fromDate,
        toDate,
        store_id: global.storeDetails.store_id,
      };

      const total_sales =
        await connection.Bill.getSalestotalForCloseDay(params);
      const due_amount =
        await connection.Bill.getduepayTotalForCloseDay(params);
      const { expensesTotal: total_expense, expenseInCashOnly } =
        await connection.Expenses.getExpensestotal(params);
      let invoice_range = await connection.Bill.getBillrangeForCloseDay(params);

      let generated_bill_range = {};
      if (invoice_range) {
        generated_bill_range = invoice_range;
        invoice_range = Object.values(invoice_range).join('-');
      }
      const updateData = {
        total_expense,
        total_sales,
        invoice_range,
      };
      const extra_details = {
        generated_bill_range,
      };

      if (isTimeBetweenMidnightSale) {
        Object.assign(extra_details, { isDayClosedAtMidnight: true });
      }

      const data =
        await connection.Expenses.getDataforstartendDayreport(params);
      extra_details.expense_data = {
        data,
      };
      extra_details.day_end_data = {
        expenseInCashOnly,
        total_expense,
        prev_closing_balance,
        due_amount,
      };
      const orderDetails = await connection.Bill.getDataforstartendDayreport(
        params,
        OFFLINE_BILLING_TYPES,
        ONLINE_PLATFORMS,
      );
      extra_details.orderDetails = orderDetails;
      await getOrderdetailsbybillstatus(params, extra_details);

      const payment_modes = await connection.BillPayment.getPaymentsForCLoseDay(
        {
          store_id: global.storeDetails.store_id,
          fromDate: params.fromDate,
          toDate: params.toDate,
          user_id: undefined,
          order_state: `"fulfilled"`,
        },
      );
      let rawcashinHand = 0;
      extra_details.day_end_data.rawcashinHand = rawcashinHand;
      if (payment_modes && payment_modes.length > 0) {
        extra_details.payment_modes = {
          data: payment_modes,
        };
        const rawcashPayments = filter(payment_modes, (o) =>
          ['cash'].includes(String(o.payment_option).toLowerCase()),
        );
        rawcashinHand = sumBy(rawcashPayments, 'amount');
        extra_details.day_end_data.rawcashinHand = rawcashinHand;
        updateData.raw_cash_in_hand = rawcashinHand;
      }

      if (orderDetails.online_orderDetails.overallInfo) {
        extra_details.day_end_data.online_amount =
          orderDetails.online_orderDetails?.overallInfo?.amount;
      }
      try {
        // Old way
        // extra_details.day_end_data.Cash_in_hand =
        //     (Number(opening_balance) +
        //         Number(extra_details.day_end_data.fulfilled_order_amount)) -
        //     Number(extra_details.day_end_data.total_expense);

        extra_details.day_end_data.Cash_in_hand =
          Number(opening_balance) +
          Number(extra_details.day_end_data.rawcashinHand) -
          Number(extra_details.day_end_data.expenseInCashOnly);
        // Number(extra_details.day_end_data.total_expense);

        extra_details.day_end_data.Cash_in_hand = Number(
          extra_details.day_end_data.Cash_in_hand,
        ).toFixed(global.ROUNDOFF_UPTO);
        extra_details.day_end_data.opening_balance = Number(
          opening_balance,
        ).toFixed(global.ROUNDOFF_UPTO);
        extra_details.day_end_data.rawcashinHand =
          extra_details.day_end_data.Cash_in_hand;
      } catch (error) {
        extra_details.day_end_data.Cash_in_hand = 0;
      }

      updateData.extra_details = extra_details;

      // Check if current_closing_balance is provided or not
      // if not then calculate the balance
      if (current_closing_balance == 0) {
        if (extra_details?.day_end_data?.Cash_in_hand) {
          current_closing_balance = extra_details?.day_end_data?.Cash_in_hand;
          updateData.current_closing_balance = current_closing_balance;
        }
      }
      // console.log(JSON.stringify(extra_details));

      // let cash=opening_balance - current_closing_balance
      // let closeDayAmount=startenddayRecords.close_day_amount
      // let cash_diff=Math.abs(cash)-Math.abs(closeDayAmount)
      const cash_diff =
        startenddayRecords.close_day_amount - current_closing_balance;
      updateData.cash_diff = cash_diff.toFixed(global.ROUNDOFF_UPTO);

      await connection.StartcloseDay.update(updateData, {
        where: {
          id: insertedId,
        },
      });
      // Changed prev_closing_balanace to raw cash in hand instead
      // current_closing_balance of previous day
      if (
        nextDayOpeningAmount &&
        nextInsertedinfo &&
        nextInsertedinfo.nextdayId
      ) {
        await connection.StartcloseDay.update(
          {
            // prev_closing_balance: current_closing_balance
            prev_closing_balance: nextDayOpeningAmount,
          },
          {
            where: {
              id: nextInsertedinfo.nextdayId,
            },
          },
        );
      } else if (nextInsertedinfo && nextInsertedinfo.nextdayId) {
        await connection.StartcloseDay.update(
          {
            // prev_closing_balance: current_closing_balance
            prev_closing_balance: extra_details.day_end_data.rawcashinHand,
          },
          {
            where: {
              id: nextInsertedinfo.nextdayId,
            },
          },
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Generate report data for start and end day
 * @param {Parameters} params
 * @param {*} extra_details
 */
async function getOrderdetailsbybillstatus(params, extra_details) {
  for (const state in OrderState) {
    const dataList = [];
    const whereData = {
      store_id: params.store_id,
      order_state: OrderState[state],
    };
    if (params.fromDate && params.toDate) {
      whereData.actual_created_time = {
        [connection.Sequelize.Op.between]: [params.fromDate, params.toDate],
      };
    }

    const attributes = [
      [
        connection.sequelize.fn('sum', connection.sequelize.col('order_total')),
        'amount',
      ],
      [
        connection.sequelize.fn('count', connection.sequelize.col('id')),
        'count',
      ],
    ];
    if (OrderState[state] == OrderState.FULFILLED) {
      attributes.push(
        [
          connection.sequelize.fn('sum', connection.sequelize.col('discount')),
          'discount',
        ],
        [
          connection.sequelize.fn(
            'sum',
            connection.sequelize.col('order_level_total_taxes'),
          ),
          'tax',
        ],
        [
          connection.sequelize.fn(
            'sum',
            connection.sequelize.col('couponDisounttotal'),
          ),
          'couponDisount',
        ],
      );
    }
    let data = await connection.Bill.findAll({
      raw: true,
      attributes,
      where: whereData,
    });

    if (data && data.length > 0) {
      data = data[0];
      if (data.amount == null || data.amount == undefined) {
        data.amount = 0;
      }
    }

    for (const element of OFFLINE_BILLING_TYPES) {
      whereData.billing_type = element.id;
      const data =
        await connection.Bill.getOrderdetailsbybillingtype(whereData);
      if (data) {
        data.type = element.name;
        dataList.push(data);
      }
    }
    if (OrderState[state] == OrderState.FULFILLED) {
      extra_details.day_end_data.discount = data.discount;
      extra_details.day_end_data.tax = data.tax;
      extra_details.day_end_data.couponDisount = data.couponDisount;
    }

    extra_details[`${OrderState[state]}_orders`] = {
      data,
      details: dataList,
    };
    extra_details.day_end_data[`${OrderState[state]}_order_amount`] =
      data.amount ? data.amount : 0;
  }

  if (extra_details?.orderDetails) {
    if (extra_details?.orderDetails?.online_orderDetails) {
      extra_details.day_end_data.online_amount =
        extra_details?.orderDetails?.online_orderDetails?.overallInfo?.amount;
    }
  }
}

async function getstartenddayReportdata(params) {
  let reportData;
  try {
    const bills = await connection.Bill.findAll({
      raw: true,
      attributes: [
        'order_id',
        'table_name',
        'user_id',
        'quantity',
        'cust_name',
        'phone',
        'discount',
        'instructions',
        'order_level_total_charges',
        'order_level_total_taxes',
        'order_state',
        'order_total',
        'created_time',
        'payment',
        'billing_type',
        'persons',
        'bill_number',
        'order_flag',
        'total_external_discount',
        'delivery_boy_name',
        'delivery_boy_phone',
        'my_order_date',
        'hasDuepayment',
        'due_payment',
      ],
      where: {
        store_id: params.store_id,
        created_time: {
          [connection.Sequelize.Op.between]: [params.fromDate, params.toDate],
        },
      },
    });
    // console.log(bills);
    reportData = {
      bills,
      fromDate: params.fromDate,
      toDate: params.toDate,
    };
  } catch (error) {
    reportData = undefined;
  }
  return reportData;
}

async function getusershiftReportdata(params) {
  let reportData;
  try {
    const whereData = {
      store_id: params.store_id,
      actual_created_time: {
        [connection.Sequelize.Op.between]: [params.fromDate, params.toDate],
      },
    };

    if (params.shift_start_by_user) {
      Object.assign(whereData, {
        user_id: params.shift_start_by_user,
      });
    }
    const bills = await connection.Bill.findAll({
      // raw: true,
      attributes: [
        'order_id',
        'table_name',
        'user_id',
        'cust_name',
        'phone',
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f", discount)`,
          ),
          'discount',
        ],
        'instructions',
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f", order_level_total_charges)`,
          ),
          'order_level_total_charges',
        ],
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f", item_level_total_charges)`,
          ),
          'item_level_total_charges',
        ],
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f", order_level_total_taxes)`,
          ),
          'order_level_total_taxes',
        ],
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f", charges_level_total_tax)`,
          ),
          'charges_level_total_tax',
        ],
        'order_state',
        ['order_total', 'order_total_new'],
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f", order_total)`,
          ),
          'order_total',
        ],
        'created_time',
        'payment',
        'billing_type',
        'persons',
        'bill_number',
        'order_flag',
        'total_external_discount',
        'delivery_boy_name',
        'delivery_boy_phone',
        'my_order_date',
        'quantity',
        'hasDuepayment',
        'due_payment',
        'createdBy',
        'persons',
        'custom_bill_number',
        'extra_details',
        'charges',
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f", order_level_total_charges)`,
          ),
          'order_level_total_charges_without_tax',
        ],
      ],
      where: whereData,
    });
    bills.map((ele) => {
      if (ele.tmpos_order_charges && ele.tmpos_order_charges.length) {
        let order_level_total_charges_without_tax = 0;
        ele.tmpos_order_charges.forEach((charge) => {
          if (charge.status_flag === 0) {
            if (charge.calculated_tax && charge.is_tax_included === 0) {
              order_level_total_charges_without_tax +=
                charge.value - charge.calculated_tax;
            } else {
              order_level_total_charges_without_tax += charge.value;
            }
          }
        });
        // ele.order_level_total_charges_without_tax =
        //   order_level_total_charges_without_tax;
        ele.setDataValue(
          'order_level_total_charges_without_tax',
          order_level_total_charges_without_tax,
        );
      } else if (Number(ele.charges)) {
        ele.setDataValue(
          'order_level_total_charges_without_tax',
          Number(ele.charges),
        );
      }
      if (ele.quantity) {
        ele.quantity = Number(ele.quantity.toFixed(global.ROUNDOFF_UPTO));
      }
    });
    reportData = {
      bills,
      fromDate: params.fromDate,
      toDate: params.toDate,
    };
  } catch (error) {
    reportData = undefined;
  }
  return reportData;
}

// betteripcMain.answerRenderer('get-shift-wise-report', async (params)=>{
//     let response = {}
//     let bills = await getusershiftReportdata(params.reply);
//     response.bills = bills;

//     let paymentDetails = await getPaymentsbydate(params.reply.fromDate, params.reply.toDate);
//     response.paymentDetails = paymentDetails;

//     let soldItems = await getSolditemsbydate(params.reply.fromDate, params.reply.toDate);
//     response.soldItems = soldItems;

//     let catdataList = await connection.BillItem.getCategorywisereport(params.reply.fromDate,
//         params.reply.toDate, global.storeDetails.store_id,
//         global.storeDetails.username);
//     response.catdataList = catdataList;
//     if (params.printwithItems && catdataList && Array.isArray(catdataList) && catdataList.length > 0) {
//         // console.log('get items too');
//         for (const category of catdataList) {
//             let items = await connection.BillItem.getCategorywiseitemsreport(fromDate,
//                 toDate, global.storeDetails.store_id,
//                 global.storeDetails.username, category.category_ref_ids);
//             category.items = items;
//         }
//     }
//     return response
// })

// betteripcMain.answerRenderer('get-shift-wise-report', async (params) => {
async function getShiftwiseReport(data) {
  const params = safeParseformain(data);
  const response = {};
  const bills = await getusershiftReportdata(params.reply);
  response.bills = bills;
  response.totalBills = bills?.length;

  // const paymentDetails = await getPaymentsbydateForCloseday(
  //   params.reply.fromDate,
  //   params.reply.toDate,
  //   params.reply.shift_start_by_user,
  // );
  const paymentDetails = await connection.BillPayment.getPaymentsForCLoseDay({
    store_id: global.storeDetails.store_id,
    fromDate: params.reply.fromDate,
    toDate: params.reply.toDate,
    user_id: params.reply.shift_start_by_user,
  });
  response.paymentDetails = paymentDetails;

  if (params.reply.showSolditems) {
    const soldItems = await getSolditemsbydateForCloseDay(
      params.reply.fromDate,
      params.reply.toDate,
      params.reply.shift_start_by_user,
    );
    response.soldItems = soldItems;
  }

  const whereData = {
    store_id: global.storeDetails.store_id,
    // user_id: global.storeDetails.username,
    actual_created_time: {
      [connection.Sequelize.Op.between]: [
        params.reply.fromDate,
        params.reply.toDate,
      ],
    },
    order_state: {
      [connection.Sequelize.Op.or]: ['fulfilled', 'pending'],
    },
  };

  if (params.reply.shift_start_by_user) {
    Object.assign(whereData, {
      user_id: params.reply.shift_start_by_user,
    });
  }

  if (params.reply.showWaiterData) {
    const waiterSummary = await getWaiterSummarybydate(whereData);
    response.waiterSummary = waiterSummary;
  }

  if (params.reply.showDiscountData) {
    const discountSummary = await getDiscountSummarybydate(whereData);
    response.discountSummary = discountSummary;
  }

  // delivery boy summary
  if (params.reply.showDeliveryBoyData) {
    const deliveryboySummary = await getDeliveryboySummarybydate(whereData);
    response.deliveryboySummary = deliveryboySummary;
  }
  const orderTypeWiseOrders = await connection.Bill.count({
    attributes: [
      [
        connection.Sequelize.fn('sum', connection.Sequelize.col('order_total')),
        'order_total',
      ],
      [
        connection.Sequelize.fn('sum', connection.Sequelize.col('charges')),
        'charges',
      ],
      [
        connection.Sequelize.fn('sum', connection.Sequelize.col('discount')),
        'discount',
      ],
      [
        connection.Sequelize.fn(
          'sum',
          connection.Sequelize.col('order_level_total_taxes'),
        ),
        'order_level_total_taxes',
      ],
      [
        connection.Sequelize.fn(
          'sum',
          connection.Sequelize.col('charges_level_total_tax'),
        ),
        'charges_level_total_tax',
      ],
    ],
    group: ['billing_type'],
    where: { ...whereData }, //order_state: 'fulfilled'
  });

  const whereDataForExtra = {
    actual_created_time: {
      [connection.Sequelize.Op.between]: [params.fromDate, params.toDate],
    },
    store_id: global.storeDetails.store_id,
    order_state: 'fulfilled',
  };
  if (params.reply.shift_start_by_user) {
    Object.assign(whereDataForExtra, {
      user_id: params.reply.shift_start_by_user,
    });
  }
  const extra_details = await connection.Bill.findAll({
    raw: true,
    attributes: ['billing_type', 'extra_details'],
    where: whereDataForExtra,
  });
  const extra_detail = [];
  extra_details.forEach((element) => {
    element.extra_details = JSON.parse(element.extra_details);
    const obj = {};
    if (element.extra_details && element.extra_details.roundedAmount) {
      obj.roundedAmount = Number(element.extra_details.roundedAmount);
      obj.billing_type = element.billing_type;
      extra_detail.push(obj);
    }
  });
  const output = _(extra_detail)
    .groupBy('billing_type')
    .map((objs, key) => ({
      billing_type: key,
      roundedAmount: _.sumBy(objs, 'roundedAmount'),
    }))
    .value();
  orderTypeWiseOrders.map((item) => {
    const value = output.find((o) => o.billing_type == item.billing_type);
    if (value) {
      Object.assign(item, { total_rounded_amt: value.roundedAmount });
    }
  });

  response.orderTypeWiseOrders = orderTypeWiseOrders;

  if (params.reply.showExpenseData) {
    const expenseData = await getExpensesByDate(
      params.reply.fromDate,
      params.reply.toDate,
      params.reply.shift_start_by_user,
    );
    response.expenses_list = expenseData;
  }

  if (params.reply.showDuePaymentData) {
    const duePaymentSummary = await getDuePaymentSummarybydate(
      params.reply.fromDate,
      params.reply.toDate,
      params.reply.shift_start_by_user,
    );
    response.duePaymentSummary = duePaymentSummary;
  }

  if (params.reply.showDuePaymentReceivableData) {
    const duePaymentReceivableSummary =
      await getDuePaymentReceivableSummarybydate(
        params.reply.fromDate,
        params.reply.toDate,
        params.reply.shift_start_by_user,
      );
    response.duePaymentReceivableSummary = duePaymentReceivableSummary;
  }

  if (params.reply.showCategoryData) {
    const catdataList =
      await connection.BillItem.getCategorywisereportForCloseDay(
        params.reply.fromDate,
        params.reply.toDate,
        global.storeDetails.store_id,
        params.reply.shift_start_by_user,
      );
    response.catdataList = catdataList;
    if (
      params.printwithItems &&
      catdataList &&
      Array.isArray(catdataList) &&
      catdataList.length > 0
    ) {
      for (const category of catdataList) {
        const items =
          await connection.BillItem.getCategorywiseitemsreportForCloseDay(
            params.reply.fromDate,
            params.reply.toDate,
            global.storeDetails.store_id,
            global.storeDetails.username,
            category.category_ref_ids,
          );
        category.items = items;
      }
    }
  }

  if (params.reply.showCancelitems) {
    const cancelledItems = await connection.KOTItem.getItemsbystatus(
      3,
      params.reply.fromDate,
      params.reply.toDate,
      global.storeDetails.store_id,
      params.reply.shift_start_by_user,
    );
    response.cancelledItems = cancelledItems;
  }

  if (params.reply.showWalletData) {
    const walletSummary = await getWalletSummarybydate({
      toDate: params.reply.toDate,
      fromDate: params.reply.fromDate,
    });
    response.walletSummary = walletSummary;
  }

  if (params.reply.showKDWiseItemsData) {
    const kdWiseItemSummary = await connection.BillItem.getkdwisereport(
      params.reply.fromDate,
      params.reply.toDate,
      global.storeDetails.store_id,
      // global.storeDetails.username,
      params.reply.shift_start_by_user,
    );
    response.kdWiseItemSummary = kdWiseItemSummary;
  }
  return response;
}
// )

async function getReportNumber() {
  let nextReportNumber = await connection.Tempnumbers.getNextTaxReportNumber();
  if (nextReportNumber == null) {
    nextReportNumber = 0;
  }
  const nextUpdateNumber = nextReportNumber + 1;

  const dataToupdate = { next_sales_report_id: nextUpdateNumber };
  const updateReportNextNumber = await connection.Tempnumbers.update(
    dataToupdate,
    {
      where: {
        id: 1,
      },
    },
  );

  return nextUpdateNumber;
}

async function updateCustomerToDuePayment(params) {
  try {
    const responseData = {};
    const { name, phone, order_id, store_id } = params;
    // update customer name and number to order
    await connection.Bill.update(
      {
        cust_name: name,
        phone,
        sync_status: 0,
      },
      {
        where: {
          order_id,
        },
      },
    );
    // update customer to due payment in due payment table
    await connection.Duepayments.update(
      {
        cust_mobile: phone,
        customer_name: name,
        sync_flag: 0,
      },
      {
        where: {
          order_id,
        },
      },
    );

    // if customer is not in database then add it
    const customer = await connection.Customer.findAll({
      raw: true,
      limit: 1,
      where: {
        phone,
        store_id,
      },
    });
    if (!customer) {
      const addCustomer = {
        name,
        phone,
        address_line1: '',
        address_line2: '',
        store_id,
        location: '',
        block: '',
        area: '',
        street: '',
        lane: '',
        flat: '',
        floor: '',
        landmark: '',
        building: '',
        label: '',
      };
      const createdDate = global.moment().format('YYYY-MM-DD HH:mm:ss');
      Object.assign(addCustomer, { createdDate });
      await connection.Customer.create(addCustomer);
      responseData.reloadCustomers = true;
    }
    responseData.status = 'success';
    return responseData;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

module.exports = {
  setStartdayotherdetails,
  getReportNumber,
  getWaiterSummarybydate,
  getDeliveryboySummarybydate,
  getDiscountSummarybydate,
  getReportData,
  getDuePaymentSummarybydate,
  getDuePaymentReceivableSummarybydate,
  getWalletSummarybydate,
  getShiftwiseReport,
  updateCustomerToDuePayment,
};
