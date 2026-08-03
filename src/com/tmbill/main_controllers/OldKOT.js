/* eslint-disable camelcase */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const moment = require('moment');
const { default: axios } = require('axios');
const connection = require('../js/database');
const TableUtils = require('../util/TableUtils');
const { sendLivesyncrequest } = require('../services/SyncService');
const { getHeadersformpos } = require('../services/MiscServices');
const { apiCall } = require('../services/APIService');
const { UPDATE_STOCK_QTY } = require('../util/IPC_Messages');
const {
  addRecordItemStockOutBox,
} = require('../main/services/ItemStock.service');

/**
 * Returns the old KOT details
 * @param {Parameters containing request data} data
 */
async function getOldKOTdetails(data) {
  if (data) {
    try {
      const items = await connection.KOTItem.findAll({
        // raw: true,
        include: [
          {
            model: connection.KOT,
            where: {
              table_id: data.table_id,
              is_active: 1,
            },
            attributes: [
              'kot_number',
              'customer_mobile',
              'billing_type',
              'persons',
              'note',
              'waiter',
              'remote_order_id',
              'actual_in_time',
              'status',
              'waiter_id',
              'extra_details',
            ],
          },
          {
            model: connection.KotItemOption,
            as: 'addons',
            attributes: [
              ['option_name', 'title'],
              ['option_qty', 'quantity'],
              'option_type',
              'option_ref_id',
              'option_name',
              'option_group_name',
              'option_group_ref_id',
              'option_price',
              'option_tax_amount',
              'option_total',
              'option_total_with_tax',
              'option_qty',
              'option_type',
              'item_ref_id',
              'option_id',
              'alternative_title',
              'extra_details',
            ],
          },
        ],
        attributes: [
          ['id', 'kot_item_id'],
          ['item_name', 'title'],
          ['item_name', 'oldTitle'],
          'alternative_title',
          'amount',
          'item_price',
          'quantity',
          'item_id',
          ['item_id', 'item_refid'],
          'note',
          'item_tax_per',
          'item_tax_value',
          'item_tax_method',
          'item_is_devidable',
          'user_id',
          'createdBy',
          'item_tax_name',
          'item_total_tax_value',
          'short_code',
          'has_options',
          'product_group_id',
          'product_group_name',
          'kot_id',
          'kitchen_dept',
          'discounted_items',
          'discounted_price',
          'discount_type',
          'discount_rate',
          'discount_name',
          'pricebeforeDiscount',
          'modified_discount',
          'reason',
          'discount',
          'category_name',
          'extra_details',
          'is_open_item',
          'status',
        ],
        // group: ['mpos_kot_item.id'],
        where: {
          status: {
            [connection.Sequelize.Op.or]: [1, 5],
          },
          [connection.Sequelize.Op.or]: [
            {
              comment: {
                [connection.Sequelize.Op.notIn]: ['##DELETE_THIS_ITEM##'],
              },
            },
            {
              comment: null, // Include null values
            },
          ],
        },
      });

      let persons = 0;
      let kot_note = '';
      let customer_mobile;
      let waiter = '';
      items?.forEach((item) => {
        item = item.get({ plain: true });
        if (item && item.addons && item.addons.length) {
          item.addons.forEach((addon) => {
            const posOption = global.optionsList.find(
              (o) => Number(o.item_ref_id) === Number(addon.item_ref_id),
            );
            if (
              posOption &&
              (posOption.sale_price_1 ||
                posOption.sale_price_2 ||
                posOption.sale_price_3 ||
                posOption.sale_price_4 ||
                posOption.sale_price_5)
            ) {
              Object.assign(addon, {
                sale_price_1: posOption.sale_price_1,
                sale_price_2: posOption.sale_price_2,
                sale_price_3: posOption.sale_price_3,
                sale_price_4: posOption.sale_price_4,
                sale_price_5: posOption.sale_price_5,
              });
            }
          });
        } else {
          const posItem = global.itemsList.find(
            (o) => o.item_refid == item.item_id,
          );
          if (
            posItem &&
            (posItem.sale_price_1 ||
              posItem.sale_price_2 ||
              posItem.sale_price_3 ||
              posItem.sale_price_4 ||
              posItem.sale_price_5)
          ) {
            Object.assign(item, {
              sale_price_1: posItem.sale_price_1,
              sale_price_2: posItem.sale_price_2,
              sale_price_3: posItem.sale_price_3,
              sale_price_4: posItem.sale_price_4,
              sale_price_5: posItem.sale_price_5,
            });
          }
        }

        if (item?.dataValues?.mpos_kot?.dataValues?.persons) {
          persons = item.dataValues.mpos_kot.dataValues.persons;
        }

        if (item?.dataValues?.mpos_kot?.dataValues?.note) {
          kot_note = item.dataValues.mpos_kot.dataValues.note;
        }

        if (item?.dataValues?.mpos_kot?.dataValues?.customer_mobile) {
          customer_mobile = item.dataValues.mpos_kot.dataValues.customer_mobile;
        }
      });
      let customer;
      if (customer_mobile) {
        customer = await connection.Customer.findAll({
          raw: true,
          limit: 1,
          where: {
            phone: customer_mobile,
            store_id: global.storeDetails.store_id,
          },
        });
      }
      if (items && items.length && items[0].mpos_kot?.waiter) {
        waiter = items[0].mpos_kot.waiter;
      }
      return {
        table_id: data.table_id,
        items,
        order_type_flag: data.order_type_flag,
        customer,
        persons,
        kot_note,
        waiter,
      };
    } catch (error) {
      console.log(error);

      return {
        table_id: data.table_id,
      };
    }
  }
}

async function setInactiveKotifany(kotnosList, remote_order_id) {
  if (kotnosList && Array.isArray(kotnosList) && kotnosList.length > 0) {
    for (const kot_id of kotnosList) {
      if (kot_id) {
        const billItems = await connection.KOTItem.findAll({
          where: {
            kot_id,
            status: {
              [connection.Sequelize.Op.in]: [1, 5],
            },
            [connection.Sequelize.Op.or]: [
              {
                comment: {
                  [connection.Sequelize.Op.notIn]: ['##DELETE_THIS_ITEM##'],
                },
              },
              {
                comment: null, // Include null values
              },
            ],
          },
          raw: true,
        });
        if (billItems.length === 0) {
          // Reset KOT and table data
          const kotResult = await connection.KOT.findOne({
            where: {
              kot_id,
            },
            raw: true,
          });

          if (kotResult) {
            // connection.Table.update({
            //     table_color: TableUtils.Colors.FREE_TABLE,
            //     table_action_flag: TableUtils.State.FREE_TABLE,
            //     order_state: ''
            // }, {
            //     where: {
            //         id: kotResult.table_id
            //     }
            // });

            await connection.KOT.update(
              {
                is_active: 0,
                sync_status: 0,
              },
              {
                where: {
                  kot_id,
                },
              },
            );

            if (remote_order_id) {
              // deactivate remote order id
              const result = await apiCall.post(
                Config.links.deactivateRemoteKOT,
                {
                  store_id: global.storeDetails.store_id,
                  order_id: remote_order_id,
                  kot_uniqueid: [kotResult.kot_uniqueid],
                },
                { headers: getHeadersformpos() },
              );
            }
          }
        }
      }
    }
  }

  sendLivesyncrequest();
}

async function setinactiveForoldkot(data) {
  const response = { status: 200, message: 'success' };
  if (data && data.table_id) {
    try {
      const { table_id, deleteTable } = data;
      if (table_id) {
        connection.KOT.update(
          {
            is_active: 0,
            sync_status: 0,
          },
          {
            where: {
              table_id,
              is_active: 1,
            },
          },
        );

        if (deleteTable) {
          connection.Table.destroy({
            where: { id: table_id },
          });
        } else {
          connection.Table.update(
            {
              table_color: TableUtils.Colors.FREE_TABLE,
              table_action_flag: TableUtils.State.FREE_TABLE,
              order_state: '',
              extra_details: {},
            },
            {
              where: {
                id: table_id,
              },
            },
          );
        }
        sendLivesyncrequest();
      }
    } catch (error) {
      console.log(error);
    }
  } else {
    Object.assign(response, {
      status: 400,
      message: 'Missing parameters',
    });
  }
  return response;
}
/**
 * Updates the Old KOT
 * @param {Parameters containing request data} data
 */
async function updateOldkot(data) {
  try {
    // Tells if only item status or qty is to be updated"
    const updateitemStatus = data.updateStatus;
    const itemslisttoUpdate = data.selectedItems;
    let doesbillExists;
    const { allowModifyBill } = global;
    const decrementQtyItems = [];
    const incrementQtyItems = [];
    if (data) {
      if (data.table_id) {
        doesbillExists = await connection.Bill.findOne({
          where: {
            table_id: data.table_id,
            order_state: 'pending',
          },
          raw: true,
        });

        // console.log({ doesbillExists });
        if (doesbillExists !== null && allowModifyBill) {
          await connection.Bill.update(
            {
              isBillModified: 2,
              field2: null,
            },
            {
              where: {
                order_id: doesbillExists.order_id,
              },
            },
          );

          await connection.KOT.update(
            {
              discount_rate: 0,
              discount_title: '',
              discount_type: 0,
              discounted_product_groups: null,
              coupon: '',
              couponDisount: 0,
            },
            {
              where: {
                bill_number: doesbillExists.order_id,
              },
            },
          );
        }
      }
      if (updateitemStatus) {
        // let modifiedDate =moment().format();
        // const modifiedDate = moment().format('YYYY-MM-DDTHH:mm:ss[Z]');
        const modifiedDate = moment().utc().format('YYYY-MM-DD HH:mm:ss.SSS Z');

        if (itemslisttoUpdate && itemslisttoUpdate.length > 0) {
          const kotnosList = new Set();
          for (const item of itemslisttoUpdate) {
            if (!kotnosList.has(item.kot_id)) {
              kotnosList.add(item.kot_id);
            }
            const updateData = {};
            if (data.actionType !== undefined) {
              Object.assign(updateData, {
                status: data.actionType,
                reason: item.reason,
                modifiedDate,
                createdBy: item.createdBy,
              });
            }
            if (data.makeitemComplimentary) {
              Object.assign(updateData, {
                amount: 0,
                reason: item.reason,
                item_price: 0,
                item_tax_per: 0,
                item_tax_value: 0,
                item_total_tax_value: 0,
                is_complimentary: 1,
                createdBy: item.createdBy,
              });
            }
            const doesKotexists = await connection.KOT.findOne({
              raw: true,
              where: { kot_id: item.kot_id },
            });

            if (
              doesKotexists &&
              (data.actionType == 3 ||
                data.actionType == 2 ||
                data.makeitemComplimentary)
            ) {
              const kotAmount = doesKotexists.amount - item.amount;
              await connection.KOT.update(
                { amount: kotAmount },
                {
                  where: {
                    kot_id: item.kot_id,
                  },
                },
              );

              // if (data.cancelledItems && data.cancelledItems.length) {
              //   data.cancelledItems.forEach(async (item) => {
              //     await connection.KOTItem.create(item);
              //   });
              // }
            }
            if (doesKotexists) {
              await connection.KOTItem.update(updateData, {
                where: {
                  id: item.kot_item_id,
                },
              });

              if (
                global.reduceStock &&
                (data.actionType == 3 || data.actionType == 2)
              ) {
                await connection.Item.increment('current_stock', {
                  by: Number(item.quantity),
                  where: { item_refid: item.item_refid },
                });
                const itemQty = await connection.Item.findOne({
                  raw: true,
                  attributes: ['current_stock'],
                  where: { item_refid: item.item_refid },
                });
                incrementQtyItems.push({
                  item_refid: item.item_refid,
                  qty: item.quantity,
                  quantity: item.quantity,
                  current_stock: itemQty?.current_stock,
                  short_code: item.short_code,
                  item_id: item.item_refid,
                  store_id: global.storeDetails.store_id,
                  changeType: 'SALE',
                });
              }
            }
          }
          if (data.cancelledItems && data.cancelledItems.length) {
            data.cancelledItems.forEach(async (item) => {
              if (item.deleteDiscountedItem) {
                await connection.KOTItem.destroy({
                  where: {
                    item_id: item.item_id,
                    comment: '##DELETE_THIS_ITEM##',
                  },
                });
              }
              await connection.KOTItem.create(item);
            });
          }
          await setSyncstatusforupdatedkot(Array.from(kotnosList));
          setInactiveKotifany(Array.from(kotnosList), data?.remote_order_id);
        }
      } else {
        // Update only Qty
        let doesKotexists;
        const modifiedDate = moment().format('YYYY-MM-DDTHH:mm:ss[Z]');
        if (doesbillExists) {
          doesKotexists = await connection.KOT.findOne({
            raw: true,
            where: {
              table_id: data.table_id,
              is_active: 1,
            },
          });
        } else {
          doesKotexists = await connection.KOT.findOne({
            raw: true,
            where: {
              bill_number: 0,
              is_active: 1,
              table_id: data.table_id,
            },
          });
        }

        if (doesKotexists) {
          if (data && data.cancelledItem) {
            let kotAmount = doesKotexists.amount - data.cancelledItem?.amount;
            kotAmount = Number(kotAmount.toFixed(2));

            // await connection.KOT.update(
            //   { amount: kotAmount },
            //   {
            //     where: {
            //       kot_id: data.cancelledItem?.kot_id,
            //     },
            //   },
            // );
          }

          // if (data && data.originalItem) {
          //   let kotAmount = data.originalItem?.amount;
          //   kotAmount = Number(kotAmount.toFixed(2));

          //   await connection.KOT.update(
          //     { amount: kotAmount },
          //     {
          //       where: {
          //         kot_id: data.originalItem?.kot_id,
          //       },
          //     },
          //   );
          // }

          const updateData = {
            status: data.status, // Updated,
            quantity: data.quantity,
            amount: data.amount,
            createdBy: data.createdBy,
            // modifiedDate: modifiedDate,
          };
          await connection.KOTItem.update(updateData, {
            where: {
              id: data.kot_item_id,
            },
          });
          // kot_items_id
          if (data.hasOptions) {
            const options = await connection.KotItemOption.findAll({
              raw: true,
              where: {
                kot_items_id: data.kot_item_id,
                option_type: 0,
              },
            });
            // console.log(options);
            // for (const addon of options) {
            //   const option_qty = data.quantity;
            //   const option_total = addon.option_price * option_qty;
            //   const option_total_with_tax =
            //     option_total + addon.option_tax_amount * option_qty;

            //   await connection.KotItemOption.update(
            //     {
            //       option_qty: data.quantity,
            //       option_total,
            //       option_total_with_tax,
            //     },
            //     {
            //       where: {
            //         id: addon.id,
            //       },
            //     },
            //   );
            // }
          }
          if (!data.quantityDecreased && data.originalItem) {
            await connection.KOTItem.create(data.originalItem);

            // update kot level total
            // from old kot minus original item amount and then add amount into it
            // const originalItemAmount = data.originalItem.amount;

            // remove this amont from new item qty amount

            let updatedAmount;
            if (!data.cancelledItem) {
              updatedAmount =
                Number(data.amount) - Number(data.originalItem.amount);
            } else {
              updatedAmount =
                Number(data.originalItem.amount) - Number(data.amount);
            }
            const kotAmount = await connection.KOT.findOne({
              raw: true,
              attributes: ['amount'],
              where: {
                kot_id: data.originalItem.kot_id,
              },
            });
            if (kotAmount && kotAmount.amount) {
              let amountToupdate = kotAmount.amount + updatedAmount;
              if (!data.cancelledItem) {
                amountToupdate = kotAmount.amount + updatedAmount;
              } else {
                amountToupdate = kotAmount.amount - updatedAmount;
              }

              await connection.KOT.update(
                {
                  amount: amountToupdate,
                },
                {
                  where: {
                    kot_id: data.originalItem.kot_id,
                  },
                },
              );
            }
          }
          if (data.quantityDecreased && data.cancelledItem) {
            Object.assign(data.cancelledItem, {
              // modifiedDate: modifiedDate,
            });
            await connection.KOTItem.create(data.cancelledItem);

            if (global.reduceStock) {
              await connection.Item.increment('current_stock', {
                by: Number(data.cancelledItem.quantity),
                where: { item_refid: data.cancelledItem.item_refid },
              });

              const itemQty = await connection.Item.findOne({
                raw: true,
                attributes: ['current_stock'],
                where: { item_refid: data.cancelledItem.item_refid },
              });

              incrementQtyItems.push({
                item_refid: data.cancelledItem.item_refid,
                qty: data.cancelledItem.quantity,
                quantity: data.cancelledItem.quantity,
                current_stock: itemQty?.current_stock,
                short_code: data.cancelledItem.short_code,
                item_id: data.cancelledItem.item_refid,
                store_id: global.storeDetails.store_id,
                changeType: 'SALE',
              });
            }
          }

          if (data.quantityDecreased && data.originalItem) {
            await connection.KOTItem.create(data.originalItem);
          }

          if (
            global.reduceStock &&
            !data.quantityDecreased &&
            data.originalItem
          ) {
            const changedQty = data.quantity - data.originalItem.quantity;
            const qtydata = await connection.Item.decrement('current_stock', {
              by: Number(changedQty),
              where: { item_refid: data.originalItem.item_refid },
            });
            const itemQty = await connection.Item.findOne({
              raw: true,
              attributes: ['current_stock'],
              where: { item_refid: data.originalItem.item_refid },
            });
            decrementQtyItems.push({
              item_refid: data.originalItem.item_refid,
              qty: data.originalItem.quantity,
              quantity: data.originalItem.quantity,
              current_stock: itemQty?.current_stock,
              short_code: data.originalItem.short_code,
              item_id: data.originalItem.item_refid,
              store_id: global.storeDetails.store_id,
              changeType: 'SALE',
            });
          }
          if (global.storeDetails.live_tracking_enabled) {
            const kotDetails = await connection.KOTItem.findOne({
              raw: true,
              attributes: ['kot_id'],
              where: {
                id: data.kot_item_id,
              },
            });
            if (kotDetails) {
              await setSyncstatusforupdatedkot([kotDetails.kot_id]);
            }
          }
          setInactiveKotifany([doesKotexists.kot_id]);
        }
      }
    }

    if (allowModifyBill && doesbillExists) {
      await connection.Bill.update(
        {
          isBillModified: 2,
          field2: null,
        },
        {
          where: {
            order_id: doesbillExists.order_id,
          },
        },
      );
      // Remove all the order related data
      await connection.KOTCharges.destroy({
        where: { table_id: doesbillExists.table_id, is_active: 1 },
      });
      await connection.BillCharges.destroy({
        where: { order_id: doesbillExists.order_id },
      });

      await connection.KOT.update(
        {
          discount_rate: 0,
          discount_type: 0,
          discounted_product_groups: null,
          couponDisount: 0,
          couponDisounttype: 0,
          coupon: null,
          custom_bill_number: doesbillExists.custom_bill_number,
          field1: 0,
          order_id: doesbillExists.bill_number,
          sync_status: 0,
        },
        {
          where: { table_id: doesbillExists.table_id, is_active: 1 },
        },
      );

      await connection.Bill.update(
        {
          item_level_total_charges: 0,
          discounted_product_groups: null,
          charges_level_total_tax: 0,
          cust_paid_amount: 0,
          due_payment: 0,
          hasDuepayment: 0,
          couponDisounttotal: 0,
          coupon: null,
          couponDisounttype: 0,
          couponDisount: 0,
          order_level_total_charges: 0,
          charges: 0,
          discount: 0,
          order_level_total_taxes: 0,
          sync_status: 0,
        },
        {
          where: { order_id: doesbillExists.order_id },
        },
      );
    }
    // if (data.order_id) {
    //   await updateOldbill({
    //     order_id: data.order_id,
    //     table_id: data.table_id,
    //     items: itemslisttoUpdate,
    //     updateitemStatus,
    //   });
    // }
    if (
      global.reduceStock &&
      (incrementQtyItems.length || decrementQtyItems.length)
    ) {
      const itemdata = {
        incrementQtyItems,
        decrementQtyItems,
      };
      if (incrementQtyItems && incrementQtyItems.length) {
        for (let i = 0; i < incrementQtyItems.length; i++) {
          addRecordItemStockOutBox(incrementQtyItems[i]);
        }
      }

      if (decrementQtyItems && decrementQtyItems.length) {
        for (let i = 0; i < decrementQtyItems.length; i++) {
          addRecordItemStockOutBox(decrementQtyItems[i]);
        }
      }
      global.ipcEventEmitter.emit(UPDATE_STOCK_QTY, itemdata);
    }
    sendLivesyncrequest();
    if (data.remote_order_id) {
      return { remote_order_id: data.remote_order_id };
    }
    return {
      message: 'success',
      qtyDecreased: data.quantityDecreased,
      cancelledItems: data.cancelledItem,
    };
  } catch (error) {
    return 'failure';
  }
}

async function updateOldbill({ order_id, table_id, items, updateitemStatus }) {
  if (updateitemStatus) {
    // Update item status only
    // For order items delete the items
  } else {
  }
}

async function setSyncstatusforupdatedkot(kotIdlist) {
  try {
    const updatedResult = await connection.KOT.update(
      {
        sync_status: 0,
      },
      {
        where: {
          kot_id: {
            [connection.Sequelize.Op.in]: kotIdlist,
          },
        },
      },
    );
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  setinactiveForoldkot,
  getOldKOTdetails,
  updateOldkot,
};
