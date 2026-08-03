/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
const {
  Bill,
  Sequelize,
  Table,
  PreOrder,
  KOTItemcharges,
  KOTCharges,
  KOT,
  BillPayment,
  Duepayments,
} = require('../../js/database');
const {
  sendLivesyncrequest,
  updateRewardhistory,
} = require('../../services/SyncService');
const {
  TAKEAWAY_BILLING_FLAG,
  HOMED_BILLING_FLAG,
} = require('../../util/Constants');
const { OrderState } = require('../../util/DBUtil');
const { generateTallyXML } = require('../TallyReport');
const { safeParseformain } = require('../Utils');

async function getBills(params) {
  const { fromDate, toDate } = params;
  try {
    const bills = await Bill.findAll({
      raw: true,
      where: {
        actual_created_time: {
          [Sequelize.Op.between]: [fromDate, toDate],
        },
        store_id: params.store_id,
        billing_type: {
          [Sequelize.Op.in]: [1, 2, 3],
        },
        // app_source: 'atlantic_pos',
        // order_state: {
        //   [Sequelize.Op.ne]: 'fulfilled',
        // },
      },
      order: [['id', 'DESC']],
    });
    const runningOrders = await KOT.findAll({
      raw: true,
      attributes: [
        'bill_number',
        ['actual_in_time', 'created_time'],
        'billing_type',
        'kot_uniqueid',
        'createdBy',
        ['customer_name', 'cust_name'],
        ['customer_mobile', 'phone'],
        ['actual_in_time', 'my_order_date'],
        ['billing_type', 'order_state'],
        // ['customer_name', 'line_1'],
        // ['customer_name', 'delivery_boy_name'],
        // ['customer_name', 'order_total'],
        // ['customer_name', 'payment'],
        'table_id',
        'table_name',
        'deliveryboy_id',
        'waiter',
        'waiter_id',
      ],
      group: ['table_id'],
      where: {
        is_active: 1,
        bill_number: 0,
        store_id: params.store_id,
      },
    });
    if (runningOrders && runningOrders.length) {
      runningOrders.forEach((order) => {
        if (order.billing_type === 3 && order.deliveryboy_id) {
          const deliveryBoy = global.deliveryBoys.find(
            (d) => d.id === order.deliveryboy_id,
          );
          if (deliveryBoy) {
            Object.assign(order, {
              delivery_boy_name: deliveryBoy.name,
              delivery_boy_phone: deliveryBoy.phone,
            });
          }
        }
      });
    }
    const orderCountStatus = await Bill.getOrderbyOrderState(params);
    return { bills, orderCountStatus, runningOrders };
  } catch (error) {
    console.error(
      `Message="Error while fetching bills for order settlement window" Error=`,
      error,
    );
  }
  return undefined;
}

async function settleMultipleOrders(params) {
  try {
    const response = [];
    if (params && params.length) {
      for (let i = 0; i < params.length; i++) {
        const billData = params[i];
        console.log(
          `Message="Settle bill from order settlement window" order_id=${billData.order_id}`,
        );
        const responseData = {};

        const kotIDs = await KOT.findAll({
          attributes: ['kot_id'],
          where: { table_id: billData.table_id, is_active: 1 },
        });

        await KOT.update(
          { is_active: 0, sync_status: 0, status: 5 },
          {
            where: { table_id: billData.table_id, is_active: 1 },
          },
        );

        await KOTCharges.destroy({
          where: { table_id: billData.table_id, is_active: 1 },
        });

        await KOTItemcharges.destroy({
          where: { table_id: billData.table_id },
        });

        await Table.update(
          {
            table_color: billData.table_color,
            table_action_flag: billData.table_action_flag,
            order_state: '',
            reservation_id: null,
            extra_details: {},
          },
          { where: { id: billData.table_id } },
        );

        if (billData.is_pre_order) {
          await PreOrder.update(
            {
              status: 'completed',
            },
            {
              where: {
                order_id: billData.order_id,
              },
            },
          );
        }

        if (billData.payment) {
          await BillPayment.destroy({
            where: {
              order_id: billData.order_id,
            },
          });
          await Duepayments.destroy({
            where: {
              order_id: billData.order_id,
            },
          });

          await BillPayment.create({
            order_id: billData.order_id,
            payment_option: billData.payment,
            amount: billData.order_total,
            status: 0,
          });
        }

        // if table having reservation then fulfill it
        // if (billData.reservation_id) {
        //   await TableReservation.update(
        //     {
        //       status: 'fulfilled',
        //     },
        //     {
        //       where: {
        //         reservation_id: billData.reservation_id,
        //       },
        //     },
        //   );
        // }

        responseData.order_state = billData.order_state;
        responseData.order_type_flag = billData.order_type_flag;
        responseData.status = 'success';
        responseData.table_id = billData.table_id;
        responseData.order_id = billData.order_id;
        responseData.billing_type = billData.billing_type;
        responseData.kotIDs = kotIDs;
        responseData.name = billData.name;
        responseData.phone = billData.mobile;
        responseData.order_total = billData.orderTotal;
        responseData.billType = billData.billingType;
        responseData.delivery_boy_phone = billData.delivery_boy_phone;
        responseData.cust_name = billData.name;

        if (responseData.dboyPhone) {
          responseData.delivery_boy_phone = billData.dboyPhone;
        }

        await Bill.update(billData, {
          where: {
            order_id: billData.order_id,
          },
        });

        // delete table if it is a TA/HD
        if (
          billData.billing_type !== undefined &&
          [TAKEAWAY_BILLING_FLAG, HOMED_BILLING_FLAG].includes(
            billData.billing_type,
          )
        ) {
          try {
            const table = await Table.findOne({
              raw: true,
              where: {
                id: billData.table_id,
              },
            });
            if (table && table.order_type_flag !== 0) {
              await Table.destroy({
                where: { id: billData.table_id },
              });
            }
          } catch (error) {
            console.error(error);
          }
        }

        // delete table of split bill
        if (/-Per-|-Por-|-Part/.test(billData.table_name)) {
          try {
            const table = await Table.findOne({
              raw: true,
              where: {
                id: billData.table_id,
              },
            });
            if (table) {
              await Table.destroy({
                where: { id: billData.table_id },
              });
            }
          } catch (error) {
            console.error(error);
          }
        }

        if (
          billData.extra_details &&
          billData.extra_details.rewardDiscount &&
          billData.order_state === OrderState.FULFILLED
        ) {
          updateRewardhistory({
            order_id: billData.order_id,
            status: 'completed',
          });
        }
        // if (tally_integration) {
        //   generateTallyXML(billData.order_id);
        // }
        response.push(responseData);
      }
    }

    sendLivesyncrequest();
    return response;
  } catch (error) {
    console.error(
      `Message="Error while settling multiple orders" Error=`,
      error,
    );
  }
  return undefined;
}

async function updateMultipleOrders(params) {
  try {
    const response = [];
    if (params && params.length) {
      for (let i = 0; i < params.length; i++) {
        const billData = params[i];
        console.log(
          `Message="Update order from order settlement window" billData=${billData}`,
        );
        const responseData = {};

        responseData.order_state = billData.order_state;
        responseData.status = 'success';
        responseData.table_id = billData.table_id;
        responseData.order_id = billData.order_id;
        responseData.billing_type = billData.billing_type;
        responseData.deliveryBoyChanged = billData.deliveryBoyChanged;

        await Bill.update(billData, {
          where: {
            order_id: billData.order_id,
          },
        });

        if (billData.payment) {
          await BillPayment.destroy({
            where: {
              order_id: billData.order_id,
            },
          });
          await Duepayments.destroy({
            where: {
              order_id: billData.order_id,
            },
          });

          await BillPayment.create({
            order_id: billData.order_id,
            payment_option: billData.payment,
            amount: billData.order_total,
            status: 0,
          });
        }

        // update delivery boy name on table
        if (billData.delivery_boy_name) {
          await KOT.update(
            {
              deliveryboy_id: billData.deliveryboy_id,
              sync_status: 0,
            },
            {
              where: {
                table_id: billData.table_id,
                is_active: 1,
              },
            },
          );

          const table_data = await Table.findOne({
            raw: true,
            attributes: ['extra_details'],
            where: {
              id: billData.table_id,
            },
          });
          let extra_details = {};
          if (table_data.extra_details) {
            const extradetails = safeParseformain(table_data.extra_details);
            extra_details = { ...extra_details, ...extradetails };
          }
          Object.assign(extra_details, {
            delivery_boy_name: billData.delivery_boy_name,
          });

          await Table.update(
            { extra_details },
            {
              where: {
                id: billData.table_id,
              },
            },
          );

          responseData.delivery_boy_name = billData.delivery_boy_name;
        }

        // update delivery boy name on table
        if (billData.waiter) {
          await KOT.update(
            {
              waiter: billData.waiter,
              waiter_id: billData.waiter_id,
              sync_status: 0,
            },
            {
              where: {
                table_id: billData.table_id,
                is_active: 1,
              },
            },
          );

          const table_data = await Table.findOne({
            raw: true,
            attributes: ['extra_details'],
            where: {
              id: billData.table_id,
            },
          });
          let extra_details = {};
          if (table_data.extra_details) {
            const extradetails = safeParseformain(table_data.extra_details);
            extra_details = { ...extra_details, ...extradetails };
          }
          Object.assign(extra_details, {
            waiter: billData.waiter,
            waiter_id: billData.waiter_id,
          });

          await Table.update(
            { extra_details },
            {
              where: {
                id: billData.table_id,
              },
            },
          );

          responseData.waiterChanged = billData.waiterChanged;
          responseData.waiter = billData.waiter;
          responseData.waiter_id = billData.waiter_id;
        }

        response.push(responseData);
      }
    }

    sendLivesyncrequest();
    return response;
  } catch (error) {
    console.error(
      `Message="Error while updating multiple orders" Error=`,
      error,
    );
  }
}

module.exports = {
  getBills,
  settleMultipleOrders,
  updateMultipleOrders,
};
