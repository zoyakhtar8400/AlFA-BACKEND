/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
/* eslint-disable prefer-destructuring */
const { where } = require('sequelize');
const connection = require('../js/database');
const { sendLivesyncrequest } = require('../services/SyncService');
const {
  reverseInventoryrequest,
  reduceInventoryoforder,
} = require('./Inventory');
const { generateTallyXML } = require('./TallyReport');
const { safeParseformain } = require('./Utils');
const { UPDATE_STOCK_QTY } = require('../util/IPC_Messages');

async function cancelItemModifyBill(params) {
  if (params.selectedItems) {
    const itemIds = params.selectedItems.map((a) => Number(a.item_id));

    if (params.inventoryReduced) {
      const param = {};
      param.isModifiedBill = true;
      param.itemIds = itemIds;
      param.order_id = params.order_id;
      param.store_id = global.storeDetails.store_id;
      param.tmpos_id = global.storeDetails.tmpos_id;

      const cancelitemreudceresult = await reverseInventoryrequest(param);

      if (cancelitemreudceresult) {
        params.selectedItems.forEach(async (element) => {
          await connection.BillItem.destroy({
            where: {
              item_id: element.item_id,
              orderMasterId: params.order_id,
              price: element.item_price,
            },
          });
          // itemIds.push(element.item_id);
          await connection.Orderchildcharges.destroy({
            where: {
              order_item_id: element.id,
              order_id: params.order_id,
            },
          });
          if (element.has_options) {
            await connection.BillItemOption.destroy({
              where: {
                order_id: params.order_id,
                item_ref_id: element.item_id,
              },
            });
          }
          // const modifiedDate = global.moment().format('YYYY-MM-DDTHH:mm:ss[Z]');
          const modifiedDate = global
            .moment()
            .utc()
            .format('YYYY-MM-DD HH:mm:ss.SSS Z');
          connection.KOT.findAll({
            where: {
              bill_number: params.order_id,
            },
          }).then(async (targets) => {
            const item = await connection.KOTItem.findOne({
              raw: true,
              where: {
                kot_id: targets.map((t) => t.kot_id),
                item_id: element.item_id,
                item_price: element.item_price,
              },
            });
            connection.KOTItem.update(
              {
                status: 3,
                reason: element.reason,
                modifiedDate,
                createdBy: global.storeDetails.username,
              },
              {
                where: {
                  kot_id: targets.map((t) => t.kot_id),
                  item_id: element.item_id,
                  item_price: element.item_price,
                },
              },
            );

            Object.assign(item, {
              comment: '##DELETE_THIS_ITEM##',
            });

            delete item.id;

            await connection.KOTItem.create(item);
          });
        });
        return 1;
      }
    } else {
      params.selectedItems.forEach(async (element) => {
        await connection.BillItem.destroy({
          where: {
            item_id: element.item_id,
            orderMasterId: params.order_id,
            price: element.item_price,
          },
        });
        // itemIds.push(element.item_id);

        await connection.Orderchildcharges.destroy({
          where: {
            order_item_id: element.id,
            order_id: params.order_id,
          },
        });
        if (element.has_options) {
          await connection.BillItemOption.destroy({
            where: {
              order_id: params.order_id,
              item_ref_id: element.item_id,
            },
          });
        }
        const modifiedDate = global.moment().format('YYYY-MM-DDTHH:mm:ss[Z]');
        connection.KOT.findAll({
          where: {
            bill_number: params.order_id,
          },
        }).then(async (targets) => {
          const item = await connection.KOTItem.findOne({
            raw: true,
            where: {
              kot_id: targets.map((t) => t.kot_id),
              item_id: element.item_id,
              item_price: element.item_price,
            },
          });

          connection.KOTItem.update(
            {
              status: 3,
              reason: element.reason,
              modifiedDate,
              createdBy: global.storeDetails.username,
            },
            {
              where: {
                kot_id: targets.map((t) => t.kot_id),
                item_id: element.item_id,
                item_price: element.item_price,
              },
            },
          );

          Object.assign(item, {
            comment: '##DELETE_THIS_ITEM##',
            modifiedDate,
          });
          delete item.id;

          await connection.KOTItem.create(item);
        });
      });
      return 1;
    }
  }
  return 0;
}

async function changeReduceinventorystatus({ order_id, inventoryReduced }) {
  try {
    await connection.Bill.update(
      { inventoryReduced },
      {
        where: {
          order_id,
        },
      },
    );
    reduceInventoryoforder([order_id]);
  } catch (error) {
    console.log(error);
  }
}

async function updateModifyBillQuantity(data) {
  try {
    if (data) {
      // 1.delete kot items
      // find kot based on order id
      const decrementQtyItems = [];
      const incrementQtyItems = [];
      const result = await connection.KOT.findAll({
        raw: true,
        attributes: ['kot_id', 'user_id', 'createdBy', 'amount'],
        where: {
          bill_number: data.order_id,
        },
      });
      const kot_ids = result.map((a) => a.kot_id);
      const modifiedDate = global.moment().format('YYYY-MM-DDTHH:mm:ss[Z]');

      // delete kot items based on kot id and item id
      await connection.KOTItem.destroy({
        where: {
          item_id: Number(data.item.item_id),
          item_price: data.item.item_price,
          kot_id: {
            [connection.Sequelize.Op.in]: kot_ids,
          },
          item_name: data.item.title,
        },
      });

      // 2.create kot items
      data.item.kot_id = kot_ids[0];
      data.item.user_id = result[0].user_id;
      data.item.createdBy = result[0].createdBy;
      data.item.item_name = data.item.title;
      data.item.modifiedDate = modifiedDate;
      delete data.item.id;
      await connection.KOTItem.create(data.item);

      if (global.reduceStock && !data.cancelledItem && data.item) {
        await connection.Item.decrement('current_stock', {
          by: Number(data.item.newQuantity),
          where: { item_refid: data.item.item_id },
        });
        const itemQty = await connection.Item.findOne({
          raw: true,
          attributes: ['current_stock'],
          where: { item_refid: data.item.item_id },
        });
        decrementQtyItems.push({
          item_refid: data.item.item_id,
          qty: data.item.newQuantity,
          current_stock: itemQty?.current_stock,
          short_code: data.item.short_code,
        });
      }

      // 3.delete cancelled item
      if (data.cancelledItem) {
        data.cancelledItem.kot_id = kot_ids[0];
        data.cancelledItem.user_id = result[0].user_id;
        // data.cancelledItem.createdBy = result[0].createdBy;
        data.cancelledItem.createdBy = global.storeDetails.username;
        data.cancelledItem.modifiedDate = modifiedDate;
        delete data.cancelledItem.id;
        await connection.KOTItem.create(data.cancelledItem);
      }

      if (global.reduceStock && data.cancelledItem) {
        await connection.Item.increment('current_stock', {
          by: Number(data.cancelledItem.quantity),
          where: { item_refid: data.cancelledItem.item_id },
        });

        const itemQty = await connection.Item.findOne({
          raw: true,
          attributes: ['current_stock'],
          where: { item_refid: data.cancelledItem.item_id },
        });

        incrementQtyItems.push({
          item_refid: data.cancelledItem.item_id,
          qty: data.cancelledItem.quantity,
          current_stock: itemQty?.current_stock,
          short_code: data.cancelledItem.short_code,
        });
      }

      if (data.copyOfCancelledItem) {
        data.copyOfCancelledItem.kot_id = kot_ids[0];
        data.copyOfCancelledItem.user_id = result[0].user_id;
        data.copyOfCancelledItem.createdBy = result[0].createdBy;
        data.copyOfCancelledItem.modifiedDate = modifiedDate;
        delete data.copyOfCancelledItem.id;
        await connection.KOTItem.create(data.copyOfCancelledItem);
      }

      // update order child quantity and amount
      const { item } = data;
      const discount =
        Number(item.pricebeforeDiscount) * Number(item.quantity) -
        Number(item.item_price) * Number(item.quantity);
      const total_with_tax =
        Number(item.amount) +
        Number(item.item_tax_value) * Number(item.quantity);
      const { quantity } = item;
      const total = item.amount;

      const updateItemresult = await connection.BillItem.update(
        {
          total,
          discount,
          total_with_tax,
          quantity,
        },
        {
          where: {
            orderMasterId: data.order_id,
            item_id: Number(item.item_id),
            price: item.item_price,
            title: item.title,
          },
        },
      );

      // if (updateItemresult && item.options && item.options.length) {
      //   item.options.forEach(async (option) => {
      //     const itemtotal = option.price * item.quantity;
      //     const totalWithtax =
      //       Number(itemtotal) +
      //       Number(option.tax_value) * Number(item.quantity);
      //     const qty = item.quantity;

      //     await connection.BillItemOption.update(
      //       {
      //         total: itemtotal,
      //         qty,
      //         total_with_tax: totalWithtax,
      //       },
      //       {
      //         where: {
      //           order_id: data.order_id,
      //           item_ref_id: item.item_id,
      //           option_ref_id: option.option_ref_id,
      //         },
      //       },
      //     );
      //   });
      // }

      await connection.Bill.update(
        { sync_status: 0 },
        {
          where: {
            order_id: data.order_id,
          },
        },
      );

      if (
        global.reduceStock &&
        (incrementQtyItems.length || decrementQtyItems.length)
      ) {
        const itemdata = {
          incrementQtyItems,
          decrementQtyItems,
        };
        global.ipcEventEmitter.emit(UPDATE_STOCK_QTY, itemdata);
      }

      sendLivesyncrequest();

      // If the inventory is already reduce reverse it
      if (data.inventoryReduced && updateItemresult) {
        const param = {};
        param.isModifiedBill = true;
        param.itemIds = [data.item.item_id];
        param.order_id = data.order_id;
        param.store_id = global.storeDetails.store_id;
        if (data.item.originalQty) param.itemQty = data.item.originalQty;

        param.tmpos_id = global.storeDetails.tmpos_id;
        param.order_state = 'fulfilled';

        setTimeout(() => {
          reverseInventoryrequest(param).then(() => {
            changeReduceinventorystatus({
              order_id: param.order_id,
              inventoryReduced: 0,
            });
          });
        }, 1000);
      }
    }
    return 'success';
  } catch (error) {
    return 'failure';
  }
}

async function updateOrderLevelValues(params) {
  const result = await connection.Bill.update(params, {
    where: {
      order_id: params.billId,
    },
  });

  // check due payment
  const order = await connection.Bill.findOne({
    raw: true,
    where: {
      order_id: params.billId,
    },
  });
  const payments = await connection.BillPayment.findAll({
    raw: true,
    where: {
      order_id: params.billId,
    },
  });

  if (order && order.due_payment) {
    let totalPaidAmount = 0;
    if (payments && payments.length) {
      payments.forEach((payment) => {
        totalPaidAmount += payment.amount;
      });
    }

    let due_payment = params.order_total;
    if (totalPaidAmount) {
      due_payment = params.order_total - totalPaidAmount;
    }

    await connection.Bill.update(
      { due_payment },
      {
        where: {
          order_id: params.billId,
        },
      },
    );
  }

  if (payments && payments.length > 1) {
    await connection.BillPayment.destroy({
      where: {
        order_id: params.billId,
      },
    });

    const payment = {
      amount: params.order_total,
      order_id: params.billId,
      payment_option: 'Cash',
    };

    await connection.BillPayment.create(payment);
    await connection.Bill.update(
      {
        payment: 'Cash',
      },
      {
        where: {
          order_id: params.billId,
        },
      },
    );
  } else {
    await connection.BillPayment.update(
      {
        amount: params.order_total,
      },
      {
        where: {
          order_id: params.billId,
        },
      },
    );
  }

  await connection.KOT.update(
    { sync_status: 0, is_modified: 1 },
    {
      where: {
        bill_number: params.billId,
      },
    },
  );

  if (params.additional_charges && params.additional_charges.length) {
    params.additional_charges.forEach(async (charge) => {
      await connection.BillCharges.update(
        {
          value: charge.amounttoAdd,
          calculated_tax: charge.calculated_tax,
        },
        {
          where: {
            order_id: charge.order_id,
          },
        },
      );
    });
  }
  if (result) {
    if (global.storeDetails && global.storeDetails.extra_info) {
      const extra_info = safeParseformain(global.storeDetails.extra_info);
      const tally_integration = Number(extra_info.tally_integration);
      if (tally_integration) {
        generateTallyXML(params.billId);
      }
    }
    sendLivesyncrequest();
  }
  return result;
}

module.exports = {
  cancelItemModifyBill,
  updateModifyBillQuantity,
  updateOrderLevelValues,
};
