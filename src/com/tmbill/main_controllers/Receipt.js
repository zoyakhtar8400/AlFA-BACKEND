/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable camelcase */
const uniqBy = require('lodash/uniqBy');
const _ = require('lodash');
const { Op, where, Sequelize } = require('sequelize');
const { getTodaysDate } = require('../util/MiscUtil');
const { sendLivesyncrequest } = require('../services/SyncService');
const {
  getWaiterSummarybydate,
  getDeliveryboySummarybydate,
  getDiscountSummarybydate,
  getDuePaymentSummarybydate,
  getDuePaymentReceivableSummarybydate,
  getWalletSummarybydate,
} = require('./Reports');
const { safeParseformain } = require('./Utils');

class Receipt {
  constructor(receipt) {
    this.receipt = receipt;
  }

  /**
   * Get bills
   * @param {Parameters} params
   * @param {*} store_id
   * @param {*} user_id
   */
  async getBills2(params, store_id, user_id) {
    let bills = [];
    const whereData = {
      store_id,
    };
    if (params.user_id) {
      Object.assign(whereData, { createdBy: params.user_id });
    }
    if (user_id) {
      Object.assign(whereData, { user_id });
    }
    try {
      if (params.fromDate !== undefined) {
        whereData.created_time = {
          [this.receipt.Sequelize.Op.between]: [params.fromDate, params.toDate],
        };
      }
      const billOrder = ['id'];
      if (params.showoldbillFirst) {
        billOrder.push('ASC');
      } else {
        billOrder.push('DESC');
      }
      bills = await this.receipt.Bill.findAll({
        // raw: true,
        attributes: [
          'id',
          'order_id',
          'store_id',
          'table_id',
          'table_name',
          'user_id',
          'cust_name',
          'createdBy',
          'phone',
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", discount)`,
            ),
            'discount',
          ],
          'delivery_type',
          'discount_title',
          'instructions',
          'quantity',
          'order_state',
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", order_subtotal)`,
            ),
            'order_subtotal',
          ],
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
          'deliveryboy_id',
          'delivery_boy_name',
          'delivery_boy_phone',
          'order_note',
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", couponDisount)`,
            ),
            'couponDisount',
          ],
          'couponDisounttype',
          'coupon',
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", couponDisounttotal)`,
            ),
            'couponDisounttotal',
          ],
          'issectionwisebilling',
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", due_payment)`,
            ),
            'due_payment',
          ],
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", cust_paid_amount)`,
            ),
            'cust_paid_amount',
          ],
          'waiter_id',
          'waiter',
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", charges_level_total_tax)`,
            ),
            'charges_level_total_tax',
          ],
          'inventoryReduced',
          'hasDuepayment',
          'is_pre_order',
          'custom_bill_number',
          'discounted_product_groups',
          'instructions',
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", order_level_total_charges)`,
            ),
            'order_level_total_charges_without_tax',
          ],
          // [
          //   this.receipt.sequelize.literal(
          //     '(CASE mpos_orderchild_option_addon_items.tax_method=1 WHEN TRUE THEN (mpos_orderchild_option_addon_items.total_with_tax - (mpos_orderchild_option_addon_items.tax_value * mpos_orderchild_option_addon_items.qty) ) ELSE mpos_orderchild_option_addon_items.total END)',
          //   ),
          //   'total_withouttax',
          // ],
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", order_total)`,
            ),
            'order_total',
          ],
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", order_level_total_taxes)`,
            ),
            'order_level_total_taxes',
          ],
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", order_level_total_charges)`,
            ),
            'order_level_total_charges',
          ],
          'extra_details',
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", item_level_total_charges)`,
            ),
            'item_level_total_charges',
          ],
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", charges)`,
            ),
            'charges',
          ],
          'zatca_status',
          'charges',
        ],
        order: [billOrder],
        include: [
          {
            as: 'tmpos_order_payment',
            model: this.receipt.BillPayment,
          },
          {
            model: this.receipt.IRNHistory,
          },
          {
            as: 'tmpos_order_charges',
            model: this.receipt.BillCharges,
          },
          {
            model: this.receipt.OrderTip,
          },
          {
            model: this.receipt.ZatcaStatus,
          },
        ],
        // group: ['mpos_order.id'],
        where: whereData,
      });
      // eslint-disable-next-line no-plusplus
      // for (let i = 0; i < bills.length; i++) {
      //   // eslint-disable-next-line no-await-in-loop
      //   const kots = await this.receipt.KOT.findAll({
      //     raw: true,
      //     attributes: ['kot_number', 'actual_in_time'],
      //     where: {
      //       bill_number: bills[i].dataValues.order_id,
      //     },
      //   });
      //   const kot_numbers = _.map(kots, 'kot_number');
      //   Object.assign(bills[i].dataValues, { kot_numbers });
      //   if (
      //     bills[i].dataValues.mpos_order_tip &&
      //     bills[i].dataValues.mpos_order_tip.dataValues
      //   ) {
      //     Object.assign(bills[i].dataValues, {
      //       tipAmount: Number(
      //         bills[i].dataValues.mpos_order_tip.dataValues.amount,
      //       ).toFixed(global.ROUNDOFF_UPTO),
      //     });
      //   } else {
      //     Object.assign(bills[i].dataValues, { tipAmount: 0 });
      //   }

      //   if (
      //     bills[i].dataValues.mpos_order_tip &&
      //     bills[i].dataValues.mpos_order_tip.dataValues
      //   ) {
      //     Object.assign(bills[i].dataValues, {
      //       tipPaymentMode:
      //         bills[i].dataValues.mpos_order_tip.dataValues.payment_option,
      //     });
      //   } else {
      //     Object.assign(bills[i].dataValues, { tipPaymentMode: '' });
      //   }

      //   if (kots && kots.length) {
      //     Object.assign(bills[i].dataValues, {
      //       kotcreatedAt: kots[0].actual_in_time,
      //     });
      //   }
      //   if (
      //     bills[i].tmpos_order_charges &&
      //     bills[i].tmpos_order_charges.length
      //   ) {
      //     let order_level_total_charges_without_tax = 0;
      //     bills[i].tmpos_order_charges.forEach((charge) => {
      //       if (charge.status_flag === 0) {
      //         if (charge.calculated_tax && charge.is_tax_included === 0) {
      //           order_level_total_charges_without_tax +=
      //             charge.value - charge.calculated_tax;
      //         } else {
      //           order_level_total_charges_without_tax += charge.value;
      //         }
      //       }
      //     });
      //     // bills[i].order_level_total_charges_without_tax =
      //     //   order_level_total_charges_without_tax;
      //     bills[i].setDataValue(
      //       'order_level_total_charges_without_tax',
      //       order_level_total_charges_without_tax,
      //     );
      //   } else if (Number(bills[i].charges)) {
      //     bills[i].setDataValue(
      //       'order_level_total_charges_without_tax',
      //       Number(bills[i].charges),
      //     );
      //   }
      // }
      return bills;
    } catch (error) {
      console.log(error);
    }
    return undefined;
  }

  /**
   * Get's billed item by bill number
   * @param {Bill number} bill_number
   */
  async getBillitems(bill_number) {
    let billitems = [];
    try {
      billitems = await this.receipt.BillItem.findAll({
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
        const itemlevelCharges = await this.receipt.Orderchildcharges.findAll({
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
          const options = await this.receipt.BillItemOption.findAll({
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

  async updatekotandTable(order_id, orderUpdateData) {
    const response = {};
    if (orderUpdateData.order_state) {
      await this.receipt.KOT.update(
        { is_active: 0, sync_status: 0 },
        {
          // is_active: 0,
          where: { bill_number: order_id, is_active: 1 },
        },
      );
    } else {
      await this.receipt.KOT.update(
        { sync_status: 0 },
        {
          // is_active: 0,
          where: { bill_number: order_id, is_active: 1 },
        },
      );
    }

    const activekotResult = await this.receipt.KOT.findOne({
      raw: true,
      where: {
        bill_number: order_id,
      },
    });
    if (activekotResult && activekotResult.table_id) {
      const billedTable = await this.receipt.Table.findOne({
        raw: true,
        where: {
          id: activekotResult.table_id,
        },
      });

      if (orderUpdateData.order_status === 'fulfilled') {
        await this.receipt.KOTCharges.destroy({
          where: { table_id: activekotResult.table_id, is_active: 1 },
        });
        await this.receipt.KOTItemcharges.destroy({
          where: { table_id: activekotResult.table_id },
        });
      }

      if (billedTable && orderUpdateData.order_state) {
        if ([1, 2].includes(billedTable.order_type_flag)) {
          await this.receipt.Table.destroy({
            where: { id: activekotResult.table_id },
          });
        } else {
          await this.receipt.Table.update(
            {
              // table_color: '#1A9A62',
              table_color: '#007c45',
              table_action_flag: 0,
              order_state: '',
              extra_details: {},
            },
            {
              where: {
                id: activekotResult.table_id,
              },
            },
          );
        }
        Object.assign(response, { refreshTables: 1 });
      }
    }
    return response;
  }

  /**
   *
   * @param {bill parameters} params
   */
  async updateBill(params) {
    console.log(`Message="Update bill from receipt section" params=`, params);
    const response = { status: 'failure', refreshTables: 0 };
    if (params) {
      const { multipleBillsselected } = params;
      const { selectedOrderid } = params;
      const { mutltiplePaylist } = params;
      const billupdateData = { sync_status: 0 };
      try {
        if (!multipleBillsselected) {
          if (
            params.ispaymentSplit &&
            params.payList &&
            params.payList.length > 0
          ) {
            console.log(
              `Message="Update payment from receipt section for order_id=${params.order_id}"`,
              params.payList,
            );
            await this.receipt.BillPayment.destroy({
              where: { order_id: params.order_id },
            });
            // const paymentList = uniqBy(params.payList, 'payment_option');
            // await this.receipt.BillPayment.bulkCreate(paymentList);
            await this.receipt.BillPayment.bulkCreate(params.payList);
            Object.assign(billupdateData, {
              payment_id: 0,
            });
          } else if (params.updateData && params.updateData.payment) {
            console.log(
              `Message="Update payment from receipt section for order_id=${params.order_id} payment_mode=${params.updateData.payment}" `,
            );
            await this.receipt.BillPayment.destroy({
              where: { order_id: params.order_id },
            });
            const paymentDetails = {
              order_id: params.order_id,
              payment_option: params.updateData.payment,
              amount: params.amount,
            };
            const payResult =
              await this.receipt.BillPayment.create(paymentDetails);
            Object.assign(billupdateData, {
              payment_id: payResult.id,
            });
          }
          if (params.updateData.payment) {
            Object.assign(billupdateData, {
              payment: params.updateData.payment,
            });
          }
          if (String(params.updateData.due_payment)) {
            Object.assign(billupdateData, {
              due_payment: Number(params?.updateData?.due_payment),
            });
          }

          if (
            params.updateData &&
            params.updateData.order_state === 'cancelled'
          ) {
            // if order is cancelled then cancel all items of that order

            // get kot_id of order
            const kots = await this.receipt.KOT.findAll({
              raw: true,
              attributes: ['kot_id'],
              where: {
                bill_number: params.order_id,
              },
            });

            const kot_ids = kots.map((kot) => kot.kot_id);
            const kotItems = await this.receipt.KOTItem.findAll({
              raw: true,
              where: {
                kot_id: {
                  [Sequelize.Op.in]: kot_ids,
                },
              },
            });
            // get kot items add in delete this error
            for (let i = 0; i < kotItems.length; i++) {
              const item = kotItems[i];
              Object.assign(item, {
                comment: '##DELETE_THIS_ITEM##',
              });
              delete item.id;
              await this.receipt.KOTItem.create(item);
            }
            await this.receipt.KOTItem.update(
              {
                status: 3,
                reason: 'Order Cancelled',
              },
              {
                where: {
                  kot_id: {
                    [Sequelize.Op.in]: kot_ids,
                  },
                  status: {
                    [Sequelize.Op.ne]: 3, // status != 3
                  },
                  // comment: '##DELETE_THIS_ITEM##',
                  // comment: {
                  //   [Sequelize.Op.not]: '##DELETE_THIS_ITEM##',
                  // },
                  [Sequelize.Op.or]: [
                    {
                      comment: {
                        [Sequelize.Op.notIn]: ['##DELETE_THIS_ITEM##'],
                      },
                    },
                    {
                      comment: null, // Include null values
                    },
                  ],
                },
              },
            );

            await this.receipt.KOT.update(
              {
                sync_status: 0,
                is_modified: 1,
              },
              {
                where: {
                  bill_number: params.order_id,
                },
              },
            );
          }

          if (
            params.updateData &&
            params.updateData.order_state === 'fulfilled' &&
            params.updateData.order_status === 'cancelled'
          ) {
            // if order is cancelled then cancel all items of that order

            // get kot_id of order
            const kots = await this.receipt.KOT.findAll({
              raw: true,
              attributes: ['kot_id'],
              where: {
                bill_number: params.order_id,
              },
            });

            const kot_ids = kots.map((kot) => kot.kot_id);
            const kotItems = await this.receipt.KOTItem.findAll({
              raw: true,
              where: {
                kot_id: {
                  [Sequelize.Op.in]: kot_ids,
                },
              },
            });
            // get kot items add in delete this error

            await this.receipt.KOTItem.update(
              {
                status: 1,
                reason: 'Order fulfilled after cancelled',
              },
              {
                where: {
                  kot_id: {
                    [Sequelize.Op.in]: kot_ids,
                  },
                  status: {
                    [Sequelize.Op.eq]: 3, // status != 3
                  },
                  // comment: '##DELETE_THIS_ITEM##',
                  // comment: {
                  //   [Sequelize.Op.not]: '##DELETE_THIS_ITEM##',
                  // },
                  // [Sequelize.Op.or]: [
                  //   {
                  //     comment: {
                  //       [Sequelize.Op.notIn]: ['##DELETE_THIS_ITEM##'],
                  //     },
                  //   },
                  //   {
                  //     comment: null, // Include null values
                  //   },
                  // ],
                },
              },
            );

            await this.receipt.KOT.update(
              {
                sync_status: 0,
                is_modified: 1,
              },
              {
                where: {
                  bill_number: params.order_id,
                },
              },
            );
          }

          if (
            params.updateData &&
            params.updateData.order_state === 'deleted'
          ) {
            // if order is cancelled then cancel all items of that order

            // get kot_id of order
            const kots = await this.receipt.KOT.findAll({
              raw: true,
              attributes: ['kot_id'],
              where: {
                bill_number: params.order_id,
              },
            });

            const kot_ids = kots.map((kot) => kot.kot_id);
            const kotItems = await this.receipt.KOTItem.findAll({
              raw: true,
              where: {
                kot_id: {
                  [Sequelize.Op.in]: kot_ids,
                },
              },
            });
            // get kot items add in delete this error
            for (let i = 0; i < kotItems.length; i++) {
              const item = kotItems[i];
              Object.assign(item, {
                comment: '##DELETE_THIS_ITEM##',
              });
              delete item.id;
              await this.receipt.KOTItem.create(item);
            }
            await this.receipt.KOTItem.update(
              {
                status: 2,
                reason: 'Order Deleted',
              },
              {
                where: {
                  kot_id: {
                    [Sequelize.Op.in]: kot_ids,
                  },
                  status: {
                    [Sequelize.Op.ne]: 2, // status != 3
                  },
                  // comment: '##DELETE_THIS_ITEM##',
                  comment: {
                    [Sequelize.Op.not]: '##DELETE_THIS_ITEM##',
                  },
                },
              },
            );

            await this.receipt.KOT.update(
              {
                sync_status: 0,
                is_modified: 1,
              },
              {
                where: {
                  bill_number: params.order_id,
                },
              },
            );
          }
        } else if (
          selectedOrderid &&
          selectedOrderid.length &&
          mutltiplePaylist &&
          mutltiplePaylist.length
        ) {
          await this.receipt.BillPayment.destroy({
            where: {
              order_id: {
                [this.receipt.Sequelize.Op.in]: selectedOrderid,
              },
            },
          });
          await this.receipt.BillPayment.bulkCreate(mutltiplePaylist);
          Object.assign(billupdateData, {
            payment: params.updateData.payment,
          });
        }
        Object.assign(billupdateData, {
          sync_status: 0,
        });

        // if (!multipleBillsselected && params.hasDuepayment) {
        //   let orderidList = [];
        //   if (multipleBillsselected) {
        //     orderidList = selectedOrderid;
        //   } else {
        //     orderidList = [params.order_id];
        //   }
        //   this.receipt.Duepayments.destroy({
        //     where: {
        //       order_id: {
        //         [this.receipt.Sequelize.Op.in]: orderidList,
        //       },
        //     },
        //   });
        //   if (!params.hasDuepayment) {
        //     Object.assign(billupdateData, {
        //       hasDuepayment: 0,
        //       due_payment: 0,
        //     });
        //   }
        // }

        if (params && params.updateData && params.updateData.instructions) {
          Object.assign(billupdateData, {
            instructions: params.updateData.instructions,
          });
        }

        if (params && params.updateData && params.updateData.field1) {
          Object.assign(billupdateData, {
            field1: params.updateData.field1,
          });
        }
        if (params && params.updateData && params.updateData.deliveryboy_id) {
          Object.assign(billupdateData, {
            deliveryboy_id: params.updateData.deliveryboy_id,
            delivery_boy_name: params.updateData?.delivery_boy_name,
            delivery_boy_phone: params.updateData?.delivery_boy_phone,
          });
        }

        if (params && params.updateData) {
          Object.assign(billupdateData, {
            order_state: params.updateData.order_state,
            cust_paid_amount: params.updateData?.cust_paid_amount,
            createdBy: params.updateData?.user_id,
          });

          if (billupdateData && billupdateData.payment) {
            if (
              (params &&
                params.updateData &&
                params.updateData.order_status === 'free') ||
              params.updateData.order_status === 'cancelled'
            ) {
              Object.assign(billupdateData, {
                order_state: 'fulfilled',
              });
            }
          }

          if (!billupdateData.payment) {
            if (params.updateData.order_status === 'free') {
              Object.assign(billupdateData, {
                payment: '',
              });

              await this.receipt.BillPayment.destroy({
                where: {
                  order_id: params.order_id,
                },
              });
            }
          }
          if (multipleBillsselected) {
            let refreshCount = 0;
            for await (const currentorderId of selectedOrderid) {
              try {
                const result = await this.updatekotandTable(
                  currentorderId,
                  params.updateData,
                );
                if (result.refreshTables) {
                  refreshCount += 1;
                }
              } catch (error) {
                console.log(error);
              }
            }
            Object.assign(response, {
              refreshTables: refreshCount,
            });
          } else {
            const result = await this.updatekotandTable(
              params.order_id,
              params.updateData,
            );
            if (result.refreshTables) {
              Object.assign(response, {
                refreshTables: response.refreshTables + 1,
              });
            }
          }
        }

        const billwhereData = {};
        let orderidstoUpdate = [];
        if (multipleBillsselected) {
          Object.assign(billwhereData, {
            order_id: {
              [this.receipt.Sequelize.Op.in]: selectedOrderid,
            },
          });
          orderidstoUpdate = selectedOrderid;
        } else {
          Object.assign(billwhereData, {
            order_id: params.order_id,
          });
          orderidstoUpdate = [params.order_id];
        }

        await this.receipt.Bill.update(billupdateData, {
          where: billwhereData,
        });

        await this.receipt.KOT.update(
          { is_active: 0, sync_status: 0 },
          {
            where: {
              is_active: {
                [this.receipt.Sequelize.Op.not]: 1,
              },
              bill_number: {
                [this.receipt.Sequelize.Op.in]: orderidstoUpdate,
              },
            },
          },
        );
        await this.receipt.Duepayments.update(
          { sync_flag: 0 },
          {
            where: {
              order_id: {
                [this.receipt.Sequelize.Op.in]: orderidstoUpdate,
              },
            },
          },
        );
        const tipData = Object.values(params.orderTipData);
        if (tipData && tipData.length) {
          const tipRecord = await this.receipt.OrderTip.findOne({
            raw: true,
            where: {
              order_id: params.orderTipData.order_id,
            },
          });
          if (tipRecord) {
            await this.receipt.OrderTip.update(params.orderTipData, {
              where: {
                order_id: params.orderTipData.order_id,
              },
            });
          } else {
            await this.receipt.OrderTip.create(params.orderTipData);
          }

          const order = await this.receipt.Bill.findOne({
            raw: true,
            where: {
              order_id: params.orderTipData.order_id,
            },
          });
          if (order) {
            let { extra_details } = order;
            extra_details = JSON.parse(extra_details);
            Object.assign(extra_details, {
              total_tip: params.orderTipData.amount,
              tip_payment_mode: params.orderTipData.payment_option,
            });
            await this.receipt.Bill.update(
              { sync_status: 0, extra_details },
              { where: { order_id: params.orderTipData.order_id } },
            );
          }
        }

        if (params.payment_refernce_number) {
          const order = await this.receipt.Bill.findOne({
            raw: true,
            where: {
              order_id: params.order_id,
            },
          });
          if (order) {
            let { extra_details } = order;
            extra_details = JSON.parse(extra_details);
            Object.assign(extra_details, {
              payment_refernce_number: params.payment_refernce_number,
            });
            await this.receipt.Bill.update(
              { sync_status: 0, extra_details },
              { where: { order_id: params.order_id } },
            );
          }
        }

        sendLivesyncrequest();

        if (params.table_id) {
          Object.assign(response, {
            table_id: params.table_id,
            extra_details: params.extra_details,
            name: params.name,
            phone: params.phone,
          });
        }
        Object.assign(response, { status: 'success' });
        return response;
      } catch (error) {
        console.log(error);
        Object.assign(response, { status: 'failure' });
        return response;
      }
    }
    return response;
  }

  /**
   * Set the sync status
   * @param {sync status} status
   */
  async setBillstatus(status, store_id) {
    try {
      await this.receipt.KOT.update(
        {
          // sync_status: status,
          sync_status: 0,
        },
        {
          where: {
            sync_status: 0,
            is_active: {
              [this.receipt.Sequelize.Op.not]: 1,
            },
            store_id,
          },
        },
      );

      await this.receipt.Bill.update(
        {
          sync_status: status,
        },
        {
          where: {
            sync_status: 0,
            order_state: {
              [this.receipt.Sequelize.Op.not]: 'pending',
            },
            store_id,
          },
        },
      );
      await this.receipt.Expenses.update(
        {
          sync_flag: status,
        },
        {
          where: {
            sync_flag: 0,
            store_id,
          },
        },
      );
      return 'success';
    } catch (error) {
      console.log(error);

      return 'failure';
    }
  }

  async getCharges(order_id) {
    let billcharges = [];
    try {
      billcharges = await this.receipt.BillCharges.findAll({
        raw: true,
        where: {
          order_id,
          status_flag: 0,
        },
      });
    } catch (error) {
      billcharges = [];
      console.log(error);
    }
    return billcharges;
  }

  /**
   * Return todays report data
   */
  async getTodaysreport(params, billsdata) {
    try {
      const payments = await this.receipt.BillPayment.getPayments({
        store_id: global.storeDetails.store_id,
        fromDate: params.fromDate,
        toDate: params.toDate,
        user_id: params.user_id,
      });
      billsdata.payments = payments;
      let soldItemslist = [];
      if (params.showSolditems) {
        const fromDate = getTodaysDate();
        const toDate = fromDate;
        soldItemslist = await this.receipt.BillItem.getSolditems(
          fromDate,
          toDate,
          global.storeDetails.store_id,
          params.user_id,
        );
        billsdata.soldItems = soldItemslist;
      }

      if (params.showCancelleditems) {
        // let fromDate = getTodaysDate();
        // let toDate = fromDate;
        const cancelledItems = await this.receipt.KOTItem.getItemsbystatus(
          3,
          params.fromDate,
          params.toDate,
          global.storeDetails.store_id,
          params.user_id,
        );
        billsdata.cancelledItems = cancelledItems;
      }

      if (params.showExpenseData) {
        const expensesList = await this.receipt.Expenses.findAll({
          raw: true,
          where: {
            store_id: global.storeDetails.store_id,
            expense_time: {
              [this.receipt.Sequelize.Op.between]: [
                params.fromDate,
                params.toDate,
              ],
            },
          },
        });
        billsdata.expenses_list = expensesList;
      }

      const orderTypeWhereData = {
        created_time: {
          [this.receipt.Sequelize.Op.between]: [params.fromDate, params.toDate],
        },
        store_id: global.storeDetails.store_id,
        order_state: 'fulfilled',
      };

      if (params.user_id) {
        Object.assign(orderTypeWhereData, { createdBy: params.user_id });
      }
      const orderTypeWiseOrders = await this.receipt.Bill.count({
        attributes: [
          [
            this.receipt.Sequelize.fn(
              'sum',
              this.receipt.Sequelize.col('order_total'),
            ),
            'order_total',
          ],
          [
            this.receipt.Sequelize.fn(
              'sum',
              this.receipt.Sequelize.col('order_level_total_taxes'),
            ),
            'order_level_total_taxes',
          ],
          [
            this.receipt.Sequelize.fn(
              'sum',
              this.receipt.Sequelize.col('charges_level_total_tax'),
            ),
            'charges_level_total_tax',
          ],
          [
            this.receipt.Sequelize.fn(
              'sum',
              this.receipt.Sequelize.col('charges'),
            ),
            'charges',
          ],
          [
            this.receipt.Sequelize.fn(
              'sum',
              this.receipt.Sequelize.col('discount'),
            ),
            'discount',
          ],
        ],
        group: ['billing_type'],
        where: orderTypeWhereData,
      });
      const extra_details = await this.receipt.Bill.findAll({
        raw: true,
        attributes: ['billing_type', 'extra_details'],
        where: {
          created_time: {
            [this.receipt.Sequelize.Op.between]: [
              params.fromDate,
              params.toDate,
            ],
          },
          store_id: global.storeDetails.store_id,
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

      // console.log(output);

      // eslint-disable-next-line array-callback-return
      orderTypeWiseOrders.map((item) => {
        const value = output.find((o) => o.billing_type == item.billing_type);
        if (value) {
          Object.assign(item, { total_rounded_amt: value.roundedAmount });
        }
      });
      billsdata.orderTypeWiseOrders = orderTypeWiseOrders;
      const whereData = {};
      if (params.fromDate && params.toDate) {
        whereData.created_time = {
          [Op.between]: [Number(params.fromDate), Number(params.toDate)],
        };
        Object.assign(whereData, { store_id: global.storeDetails.store_id });
      }
      if (params.user_id) {
        Object.assign(whereData, { createdBy: params.user_id });
      }
      const bills = await this.receipt.Bill.findAll({
        // raw: true,
        where: whereData,
        attributes: [
          'order_id',
          'table_name',
          'user_id',
          'cust_name',
          'phone',
          // 'discount',
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", discount)`,
            ),
            'discount',
          ],
          'instructions',
          // 'order_level_total_charges',
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", order_level_total_charges)`,
            ),
            'order_level_total_charges',
          ],
          // 'item_level_total_charges',
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", item_level_total_charges)`,
            ),
            'item_level_total_charges',
          ],
          // 'order_level_total_taxes',
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", order_level_total_taxes)`,
            ),
            'order_level_total_taxes',
          ],
          // 'charges_level_total_tax',
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", charges_level_total_tax)`,
            ),
            'charges_level_total_tax',
          ],
          'order_state',
          ['order_total', 'order_total_new'],
          // [connection.sequelize.literal('printf("%.2f", (order_total - due_payment))'), 'order_total'],
          [
            this.receipt.sequelize.literal(
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
          // 'quantity',
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", quantity)`,
            ),
            'quantity',
          ],
          'hasDuepayment',
          'due_payment',
          'createdBy',
          'persons',
          'custom_bill_number',
          'extra_details',
          'charges',
          // [
          //   this.receipt.sequelize.literal(
          //     `printf("%.${global.ROUNDOFF_UPTO}f", (order_level_total_charges - charges_level_total_tax))`,
          //   ),
          //   'order_level_total_charges_without_tax',
          // ],
          [
            this.receipt.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", order_level_total_charges)`,
            ),
            'order_level_total_charges_without_tax',
          ],
        ],
      });

      // bills.map(
      //   (ele) => (ele.quantity = ele.quantity.toFixed(global.ROUNDOFF_UPTO)),
      // );
      for (let i = 0; i < bills.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        const kots = await this.receipt.KOT.findAll({
          raw: true,
          attributes: ['kot_number', 'actual_in_time'],
          where: {
            bill_number: bills[i].order_id,
          },
        });
        const kot_numbers = _.map(kots, 'kot_number');
        Object.assign(bills[i], { kot_numbers });
        if (bills[i].mpos_order_tip && bills[i].mpos_order_tip) {
          Object.assign(bills[i], {
            tipAmount: Number(bills[i].mpos_order_tip.amount).toFixed(
              global.ROUNDOFF_UPTO,
            ),
          });
        } else {
          Object.assign(bills[i], { tipAmount: 0 });
        }

        if (bills[i].mpos_order_tip) {
          Object.assign(bills[i], {
            tipPaymentMode: bills[i].mpos_order_tip.payment_option,
          });
        } else {
          Object.assign(bills[i], { tipPaymentMode: '' });
        }

        if (kots && kots.length) {
          Object.assign(bills[i], {
            kotcreatedAt: kots[0].actual_in_time,
          });
        }
        if (
          bills[i].tmpos_order_charges &&
          bills[i].tmpos_order_charges.length
        ) {
          let order_level_total_charges_without_tax = 0;
          bills[i].tmpos_order_charges.forEach((charge) => {
            if (charge.calculated_tax && charge.is_tax_included === 0) {
              order_level_total_charges_without_tax +=
                charge.value - charge.calculated_tax;
            } else {
              order_level_total_charges_without_tax += charge.value;
            }
          });
          // bills[i].order_level_total_charges_without_tax =
          //   order_level_total_charges_without_tax;
          bills[i].setDataValue(
            'order_level_total_charges_without_tax',
            order_level_total_charges_without_tax,
          );
        } else if (Number(bills[i].charges)) {
          bills[i].setDataValue(
            'order_level_total_charges_without_tax',
            Number(bills[i].charges),
          );
        }
      }

      billsdata.bills = bills;
      billsdata.totalBills = bills?.length;

      let invoice_range = await this.receipt.Bill.getBillrange({
        ...whereData,
        fromDate: params.fromDate,
        toDate: params.toDate,
      });

      if (invoice_range) {
        const bill_range = {
          min_bill_number: invoice_range.min_bill_number,
          max_bill_number: invoice_range.max_bill_number,
        };
        invoice_range = Object.values(bill_range).join('-');
        billsdata.invoice_range = invoice_range;
      }

      if (params.showCategoryData) {
        const catdataList =
          await this.receipt.BillItem.getCategorywisereportForCloseDay(
            params.fromDate,
            params.toDate,
            global.storeDetails.store_id,
            params.user_id,
          );
        billsdata.catwisedataList = catdataList;
      }

      if (params.showWaiterData) {
        const waiterSummary = await getWaiterSummarybydate(whereData);
        billsdata.waiterSummary = waiterSummary;
      }

      if (params.showDiscountData) {
        const discountSummary = await getDiscountSummarybydate(whereData);
        billsdata.discountSummary = discountSummary;
      }

      // delivery boy summary
      if (params.showDeliveryBoyData) {
        const deliveryboySummary = await getDeliveryboySummarybydate(whereData);
        billsdata.deliveryboySummary = deliveryboySummary;
      }

      if (params.showDuePaymentData) {
        const duePaymentSummary = await getDuePaymentSummarybydate(
          params.fromDate,
          params.toDate,
        );
        billsdata.duePaymentSummary = duePaymentSummary;
      }

      if (params.showDuePaymentReceivableData) {
        const duePaymentReceivableSummary =
          await getDuePaymentReceivableSummarybydate(
            params.fromDate,
            params.toDate,
          );
        billsdata.duePaymentReceivableSummary = duePaymentReceivableSummary;
      }
      if (params.showWalletData) {
        const walletSummary = await getWalletSummarybydate({
          toDate: params.toDate,
          fromDate: params.fromDate,
        });
        billsdata.walletSummary = walletSummary;
      }
      if (params.showKDWiseItemsData) {
        const kdWiseItemSummary = await this.receipt.BillItem.getkdwisereport(
          params.fromDate,
          params.toDate,
          global.storeDetails.store_id,
          // global.storeDetails.username,
          params.user_id,
        );
        billsdata.kdWiseItemSummary = kdWiseItemSummary;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async getPreorder(order_id) {
    let preorder = {};
    try {
      preorder = this.receipt.PreOrder.findOne({
        raw: true,
        where: {
          order_id,
        },
      });
    } catch (error) {
      console.error(error);
    }
    return preorder;
  }
}

module.exports = Receipt;
