/* eslint-disable no-await-in-loop */
/* eslint-disable no-param-reassign */
require('axios');
const { BillItem, Bill, Sequelize, BillItemOption } = require('../js/database');
const { getHeadersformpos } = require('../services/MiscServices');
const { apiCall } = require('../services/APIService');

let isReduceInventoryIsInProcess = false;

/**
 * Send's the reverse inventory request to channel
 * @param {Parameters} params
 */
async function reverseInventoryrequest(params) {
  // console.log(`reverseInventoryrequest`);
  try {
    if (params && params.store_id && params.order_id) {
      let items;
      if (params.isModifiedBill) {
        items = await BillItem.findAll({
          raw: true,
          attributes: ['id', 'item_id', ['title', 'name'], ['quantity', 'qty']],
          where: {
            orderMasterId: params.order_id,
            item_id: {
              [Sequelize.Op.in]: params.itemIds,
            },
          },
        });
      } else {
        items = await BillItem.findAll({
          raw: true,
          include: [
            {
              model: Bill,
              attributes: [],
              where: {
                store_id: params.store_id,
                order_id: params.order_id,
                inventoryReduced: 1, // Reverse only if it is reduced previously
              },
            },
          ],
          attributes: ['id', 'item_id', ['title', 'name'], ['quantity', 'qty']],
          where: { orderMasterId: params.order_id },
        });
      }

      if (items && items.length > 0) {
        // eslint-disable-next-line no-restricted-syntax
        for (const item of items) {
          // eslint-disable-next-line no-await-in-loop
          const options = await BillItemOption.findAll({
            raw: true,
            attributes: [
              'qty',
              'option_id',
              'item_ref_id',
              ['type', 'isAddOn'],
              ['title', 'option_name'],
            ],
            where: {
              order_item_id: item.id,
            },
          });
          item.options = options;
        }
        if (items && params.isModifiedBill && params.itemQty) {
          items.forEach((item) => {
            item.qty = params.itemQty;
            if (item.options) {
              item.options.forEach((option) => {
                option.qty = params.itemQty;
              });
            }
          });
        }
        params.items = items;

        if (params.isModifiedBill) {
          delete params.isModifiedBill;
          delete params.itemIds;
        }

        // console.log(params);
        // console.log('reverse inventory payload::', JSON.stringify(params));

        const { data } = await apiCall.post(
          global.Config.links.reverseInventory,
          params,
          {
            headers: getHeadersformpos(),
          },
        );

        // console.log(data);
        if (data && [200, '200'].includes(data.statusCode)) {
          await Bill.update(
            { inventoryReduced: 2 },
            {
              where: { order_id: params.order_id },
            },
          );
        } else if (['303', 303].includes(data.status)) {
          window.reloginfromremote();
        }

        return { result: data, params };
      }
    }
  } catch (error) {
    console.log(error);
  }
  return undefined;
}

/**
 * Send's the reduce inventory request to channel
 * @param {Parameters} content
 */
async function reduceInventoryoforder(orderIdlist) {
  try {
    // console.log('reduce inventory::', orderIdlist);
    if (isReduceInventoryIsInProcess) {
      setTimeout(() => {
        reduceInventoryoforder(orderIdlist);
      }, 7000);
      return;
    }
    // const requestInfo = [];
    // const requestedOrderIds = [];
    if (orderIdlist && Array.isArray(orderIdlist) && orderIdlist.length) {
      for (let i = 0; i < orderIdlist.length; i += 5) {
        const requestInfo = [];
        const requestedOrderIds = [];
        // eslint-disable-next-line no-plusplus
        for (let j = i; j < i + 5; j++) {
          if (!orderIdlist[j]) {
            break;
          }
          const order = await Bill.findOne({
            attributes: ['billing_type'],
            where: {
              order_id: orderIdlist[j],
            },
          });

          const currentorderInfo = {
            order_id: orderIdlist[j],
            warehouse_id: global.storeDetails.warehouse_id,
            tmpos_id: global.storeDetails.tmpos_id,
            store_id: global.storeDetails.store_id,
            billing_type: order?.billing_type,
          };
          isReduceInventoryIsInProcess = true;
          // eslint-disable-next-line no-await-in-loop
          const items = await BillItem.findAll({
            raw: true,
            include: [
              {
                model: Bill,
                attributes: [],
                where: {
                  store_id: currentorderInfo.store_id,
                  inventoryReduced: 0,
                  order_id: currentorderInfo.order_id,
                  order_state: {
                    [Sequelize.Op.notLike]: 'pending',
                  },
                },
              },
            ],
            attributes: [
              'id',
              'item_id',
              ['title', 'name'],
              ['quantity', 'qty'],
            ],
            where: { orderMasterId: currentorderInfo.order_id },
          });

          if (items && items.length > 0) {
            // eslint-disable-next-line no-restricted-syntax
            for (const item of items) {
              // eslint-disable-next-line no-await-in-loop
              const options = await BillItemOption.findAll({
                raw: true,
                attributes: [
                  'qty',
                  'option_id',
                  'item_ref_id',
                  ['type', 'isAddOn'],
                  ['title', 'option_name'],
                ],
                where: {
                  order_item_id: item.id,
                },
              });
              if (options) {
                item.options = options;
              }
            }
            currentorderInfo.items = items;
            requestedOrderIds.push(currentorderInfo.order_id);
            requestInfo.push(currentorderInfo);
          }
        }

        const newRequestInfo = {
          store_id: global.storeDetails.store_id,
          list: requestInfo,
        };
        console.log(
          'reduce inventory payload::',
          JSON.stringify(newRequestInfo),
        );
        console.log(
          `MESSAGE=Reduce Inventory for ORDER_ID's='${requestedOrderIds}'`,
        );

        // eslint-disable-next-line no-await-in-loop
        const { data } = await apiCall.post(
          global.Config.links.reduceInventory,
          newRequestInfo,
          { headers: getHeadersformpos() },
        );

        // console.log(`Message: Reduce inventory response`, data);

        if (data) {
          isReduceInventoryIsInProcess = false;
        }

        if (data && ['200', 200].includes(data.statusCode)) {
          // eslint-disable-next-line no-await-in-loop
          await Bill.update(
            { inventoryReduced: 1 },
            {
              where: {
                order_id: {
                  [Sequelize.Op.in]: requestedOrderIds,
                },
              },
            },
          );
        } else if (['303', 303].includes(data.status)) {
          window.reloginfromremote();
        }
      }
    }
  } catch (error) {
    isReduceInventoryIsInProcess = false;
    console.log(error);
  }
}

module.exports = {
  reduceInventoryoforder,
  reverseInventoryrequest,
};
