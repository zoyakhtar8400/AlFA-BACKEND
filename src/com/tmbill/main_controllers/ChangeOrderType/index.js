/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
const { Op } = require('sequelize');
const {
  Table,
  KOTItem,
  KOT,
  Sequelize,
  Tempnumbers,
  KOTItemcharges,
} = require('../../js/database');
const { sendLivesyncrequest } = require('../../services/SyncService');
const {
  TAKEAWAY_FLAG_ID,
  HOMED_FLAG_ID,
  DEFAULT_TAKEAWAY_TABLENAME,
  DEFAULT_HOMED_TABLENAME,
  TAKEAWAY_BILLING_FLAG,
  HOMED_BILLING_FLAG,
} = require('../../util/Constants');
const { Colors } = require('../../util/TableUtils');
const {
  isBillgeneratedfortable,
  getResettedordernumberifexist,
} = require('../Order');
const { safeParseformain } = require('../Utils');
const { cloneDeep } = require('lodash');

async function fetchAndUpdateOrderNumberWithoutTransaction(
  billDetails,
  order_type_flag,
) {
  const prevOrderTypeFlag = order_type_flag + 1;

  // Fetch and lock the temp number row
  const tempNumber = await Tempnumbers.findOne();

  await tempNumber.increment(['order_number'], {
    // 'order_number'
    by: 1,
    where: { id: 1 },
  });

  if (global.orderTypeWiseOrderNumber) {
    // Step 1: Fetch the row
    const tempNumberRow = await Tempnumbers.findOne({
      where: { id: 1 },
    });

    // Step 2: Modify the JSON field in JS
    const jsonField = tempNumberRow.order_type_wise_order_number || {};
    const key = billDetails.billing_type; // or any dynamic
    if (jsonField[key]) {
      jsonField[key] = (jsonField[key] || 0) + 1;
    } else {
      jsonField[key] = 2;
    }

    // for source order type decrement it by 1
    if (jsonField[prevOrderTypeFlag]) {
      jsonField[prevOrderTypeFlag] = (jsonField[prevOrderTypeFlag] || 0) - 1;
    }

    // Step 3: Save it back
    await Tempnumbers.update(
      { order_type_wise_order_number: jsonField },
      { where: { id: 1 } },
    );
  }

  // Commit the transaction
  // await transaction.commit();

  return tempNumber;
}

async function checkExcludeItem(item, order_type) {
  // const billintTypes = cloneDeep(BillingTypes);
  const billintTypes = cloneDeep(global.orderTypes);
  // chaning dine in value becasuse for exculde it is coming 'dinein' and billing type it is 'Dine-In'

  // get item from itemslist
  const posItem = global.itemsList.find(
    (o) => Number(o.item_refid) === Number(item.item_id),
  );

  billintTypes[1].order_type = 'dinein';
  const orderTypeGroupList = String(posItem.excludePlaforms).split(',');
  const exists = orderTypeGroupList.some(
    (i) =>
      i.toLowerCase() === billintTypes[order_type].order_type.toLowerCase(),
  );

  if (exists) {
    item.comment = '##DELETE_THIS_ITEM##';
    item.status = 1;
    await KOTItem.create(item);
    item.comment = 'exculde order type';
    item.status = 3;
  }
  return exists;
}
/**
 * Transfers the KOT table to another table
 * @param {Change table data} changeTabledata
 */
async function changeOrderTypeAfterSaveKot(changeTabledata) {
  const response = { status: 200, message: '' };
  try {
    const {
      table_id,
      changeToPickupOrDelivery,
      defaultDepartmentid,
      order_type_flag,
      destTableOrderFlag,
      from_table_name,
      is_pre_order,
    } = changeTabledata;

    let { desttable_id, table_name } = changeTabledata;
    let selectedItems;
    if (changeTabledata.selectedItems) {
      selectedItems = changeTabledata.selectedItems;
    }
    let hasactivePreviouskot;

    const isbillGeneratedforcurrenttable =
      await isBillgeneratedfortable(table_id);
    if (isbillGeneratedforcurrenttable) {
      return { status: 400, message: 'Bill is saved for current table.' };
    }
    const isbillGeneratedfordesttable =
      await isBillgeneratedfortable(desttable_id);
    if (isbillGeneratedfordesttable) {
      return { status: 400, message: 'Bill is saved for destination table.' };
    }

    if (changeToPickupOrDelivery) {
      const istakeawaywindowSelected = destTableOrderFlag === 2;
      let nextOrderNumber = await getResettedordernumberifexist();
      if (global.orderTypeWiseOrderNumber) {
        nextOrderNumber = safeParseformain(nextOrderNumber);
        if (nextOrderNumber && nextOrderNumber[destTableOrderFlag]) {
          nextOrderNumber = nextOrderNumber[destTableOrderFlag];
        } else {
          nextOrderNumber = 1;
        }
        if (istakeawaywindowSelected) {
          table_name = DEFAULT_TAKEAWAY_TABLENAME + nextOrderNumber;
        } else {
          table_name = DEFAULT_HOMED_TABLENAME + nextOrderNumber;
        }
      } else {
        let nexttakeawayid = 0;
        const nextidResult = await Tempnumbers.findAll({
          raw: true,
          limit: 1,
          attributes: ['takeawaybill_number'],
          where: { id: 1 },
        });

        if (nextidResult && nextidResult.length > 0) {
          nexttakeawayid = nextidResult[0].takeawaybill_number;
        }
        if (istakeawaywindowSelected) {
          table_name = DEFAULT_TAKEAWAY_TABLENAME + nexttakeawayid;
        } else {
          table_name = DEFAULT_HOMED_TABLENAME + nexttakeawayid;
        }
        await Tempnumbers.increment(['takeawaybill_number'], {
          by: 1,
          where: { id: 1 },
        });
      }

      if (
        changeTabledata.tablenameAscustomer &&
        changeTabledata.customer_name
      ) {
        table_name = changeTabledata.customer_name;
      }
      const tableDetails = {
        table_name,
        department: defaultDepartmentid,
        table_action_flag: 2,
        order_type_flag: 0,
        store_id: global.storeDetails.store_id,
        isactive: 1,
        table_color: Colors.KOT_SAVED,
        is_pre_order,
      };
      if (destTableOrderFlag === 2) {
        Object.assign(tableDetails, {
          order_type_flag: 1,
        });
      }

      if (destTableOrderFlag === 3) {
        Object.assign(tableDetails, {
          order_type_flag: 2,
        });
      }
      let createdTableenitiy = await Table.create(tableDetails);
      createdTableenitiy = createdTableenitiy.get({ plain: true });
      desttable_id = createdTableenitiy.id;
      Object.assign(response, {
        createNewTable: true,
        tableDetails: createdTableenitiy,
      });
    }

    if (changeTabledata) {
      if (table_id != undefined && desttable_id != undefined) {
        // get items of that kot to print
        const items = await KOTItem.findAll({
          include: [
            {
              model: KOT,
              attributes: [],
              where: {
                table_id,
                is_active: 1,
              },
            },
          ],
          raw: true,
        });

        const kots = await KOT.findAll({
          raw: true,
          attributes: ['kot_id'],
          where: {
            table_id,
            is_active: 1,
          },
        });
        const data = {
          from_table_name: changeTabledata.from_table_name,
          to_table_name: table_name,
          items,
          order_type_flag: changeTabledata.order_type_flag,
          table_id,
          desttable_id,
        };

        response.data = data;

        let extra_details = {};
        const activeKot = await KOT.findOne({
          raw: true,
          attributes: ['extra_details'],
          where: {
            table_id,
            is_active: 1,
          },
        });
        if (activeKot && activeKot.extra_details) {
          const extraDetails = safeParseformain(activeKot.extra_details);
          extra_details = {
            ...extraDetails,
          };
        }
        hasactivePreviouskot = await KOT.count({
          where: { table_id: desttable_id, is_active: 1 },
        });
        if (hasactivePreviouskot) {
          Object.assign(extra_details, {
            kot_state: 'Running KOT',
          });
        }
        if (global.orderTypeWiseOrderNumber) {
          let nextOrderNumber = 1;
          if (!hasactivePreviouskot) {
            nextOrderNumber = await getResettedordernumberifexist();
            if (global.orderTypeWiseOrderNumber) {
              nextOrderNumber = safeParseformain(nextOrderNumber);
              if (
                nextOrderNumber &&
                nextOrderNumber[changeTabledata.destTableOrderFlag]
              ) {
                nextOrderNumber =
                  nextOrderNumber[changeTabledata.destTableOrderFlag];
              } else {
                nextOrderNumber = 1;
              }
            }
          } else if (hasactivePreviouskot && global.orderTypeWiseOrderNumber) {
            const prevKot = await KOT.findOne({
              raw: true,
              where: { table_id: desttable_id, is_active: 1 },
            });
            if (prevKot && prevKot.extra_details) {
              const extraDetials = safeParseformain(prevKot.extra_details);
              nextOrderNumber = extraDetials.order_number;
            }
          }

          if (nextOrderNumber) {
            Object.assign(extra_details, {
              order_number: nextOrderNumber,
            });
          }
        }

        const kotUpdateData = {
          table_id: desttable_id,
          is_transferred: 1,
          table_name: table_name || '',
          sync_status: 0,
          billing_type: destTableOrderFlag,
          extra_details,
        };

        if (changeTabledata.createdBy) {
          Object.assign(kotUpdateData, {
            createdBy: changeTabledata.createdBy,
          });
        }
        await KOT.update(kotUpdateData, {
          where: {
            table_id,
            is_active: 1,
          },
        });

        // multipricing
        if (selectedItems && selectedItems.length) {
          const kot_ids = kots.map((kot) => kot.kot_id);
          await KOTItem.destroy({
            where: {
              kot_id: {
                [Sequelize.Op.in]: kot_ids,
              },
            },
          });

          selectedItems.forEach(async (item) => {
            // delete qty because qty not update properly
            if (item && item.discounted_items) {
              item.discounted_items = safeParseformain(item.discounted_items);
            }
            // delete item.quantity;
            // delete item.amount;
            // delete item.item_tax_value;
            // delete item.total;
            // await connection.KOTItem.update(item, {
            //   where: {
            //     id: item.kot_items_id,
            //   },
            // });
            item.id = item.kot_items_id;
            item.item_name = item.title;
            if (changeTabledata.createdBy) {
              Object.assign(item, {
                createdBy: changeTabledata.createdBy,
              });
            }
            if (item.amount === 0) {
              item.is_complimentary = 1;
            }
            if (global.itemFileterByOrderType) {
              await checkExcludeItem(item, changeTabledata.destTableOrderFlag);
            }
            try {
              delete item.id;
              await KOTItem.create(item);
            } catch (err) {
              console.error('Error message:', err.message);
              console.error('Sequelize original error:', err.original);
            }
            await KOTItemcharges.update(
              {
                table_id: desttable_id,
              },
              {
                where: {
                  table_id,
                  itemtitle: item.title,
                },
              },
            );

            // for charges billing type is different eg for quickbill = 1, dinein = 2, pickup = 3, delivery = 4
            let chargeBillingType = 0;
            switch (changeTabledata.selectedOrderType) {
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

            const valuesToCheck = ['0', chargeBillingType];

            const keepConditions = valuesToCheck.flatMap((value) => [
              { billing_flag: { [Op.eq]: value } },
              { billing_flag: { [Op.like]: `${value},%` } },
              { billing_flag: { [Op.like]: `%,${value}` } },
              { billing_flag: { [Op.like]: `%,${value},%` } },
            ]);

            // remove item charges if it doesn't have for that changed order type
            await KOTItemcharges.destroy({
              where: {
                [Op.and]: [
                  {
                    [Op.not]: {
                      [Op.or]: keepConditions,
                    },
                  },
                ],
                table_id: desttable_id,
                itemtitle: item.title,
              },
            });
          });
        }

        // Change table color for destination
        await Table.update(
          {
            table_color: changeTabledata.table_color,
            table_action_flag: changeTabledata.table_action_flag,
            order_state: 'Placed',
          },
          {
            where: {
              id: desttable_id,
            },
          },
        );

        if (global.itemFileterByOrderType) {
          // if all items are excluded then delete table for pickup/ delivery and change color for dine in
          const kot_ids = kots.map((kot) => kot.kot_id);

          const kotItems = await KOTItem.findAll({
            raw: true,
            where: {
              kot_id: {
                [Sequelize.Op.in]: kot_ids,
              },
              status: {
                [Sequelize.Op.in]: [1, 5],
              },
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
          });
          if (!kotItems || (kotItems && !kotItems.length)) {
            if (
              [TAKEAWAY_BILLING_FLAG, HOMED_BILLING_FLAG].includes(
                changeTabledata.destTableOrderFlag,
              )
            ) {
              await Table.destroy({
                where: {
                  id: desttable_id,
                },
              });
              Object.assign(response, {
                createNewTable: false,
                tableDetails: {},
              });
            } else {
              await Table.update(
                {
                  table_color: changeTabledata.table_color2,
                  table_action_flag: changeTabledata.table_action_flag2,
                  extra_details: {},
                  order_state: '',
                },
                {
                  where: {
                    id: desttable_id,
                  },
                },
              );
            }

            // deactivate kot

            await KOT.update(
              { is_active: 0 },
              {
                where: {
                  kot_id: {
                    [Sequelize.Op.in]: kot_ids,
                  },
                },
              },
            );
          }
        }
      }
    }

    await Table.update(
      {
        table_color: changeTabledata.table_color2,
        table_action_flag: changeTabledata.table_action_flag2,
        extra_details: {},
        order_state: '',
      },
      {
        where: {
          id: table_id,
        },
      },
    );

    if (
      [TAKEAWAY_FLAG_ID, HOMED_FLAG_ID].includes(
        changeTabledata.order_type_flag,
      )
    ) {
      await Table.destroy({
        where: {
          id: table_id,
        },
      });
      Object.assign(response, {
        tableIdToRemove: table_id,
      });
    }
    if (!hasactivePreviouskot && global.orderTypeWiseOrderNumber) {
      const params = {
        billing_type: changeTabledata.destTableOrderFlag,
      };
      await fetchAndUpdateOrderNumberWithoutTransaction(
        params,
        order_type_flag,
      );
    }
    sendLivesyncrequest();
    response.message = 'success';
    response.status = 200;
    response.order_type_flag = order_type_flag;
    response.table_id = table_id;
    response.from_table_name = from_table_name;
    response.desttable_id = desttable_id;
    return response;
  } catch (error) {
    console.error(error);
  }
  response.message = 'failure';
  response.status = 400;
  return response;
}

module.exports = {
  changeOrderTypeAfterSaveKot,
};
