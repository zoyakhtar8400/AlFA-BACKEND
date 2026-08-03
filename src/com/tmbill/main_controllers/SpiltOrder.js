/* eslint-disable no-restricted-syntax */
/* eslint-disable no-use-before-define */
/* eslint-disable no-await-in-loop */
/* eslint-disable eqeqeq */
/* eslint-disable camelcase */
const { ipcMain } = require('electron');
const getBykey = require('lodash/map');
const uniqid = require('uniqid');
const { SPLIT_BILL } = require('../util/IPC_Messages');
const { ITEM_TAX_TYPES } = require('../util/Constants');
const { Colors } = require('../util/TableUtils');
const connection = require('../js/database');
const {
  getResettedbillkotifexist,
  getbarSectionBillkotifexist,
  getResettedordernumberifexist,
  updateDummyBarkotnumber,
  updateDummykotnumber,
  fetchAndUpdateOrderNumberWithoutTransaction,
} = require('./Order');
const { sendLivesyncrequest } = require('../services/SyncService');
const { safeParse } = require('../util/RendererUtils');
const { safeParseformain } = require('./Utils');

let bill_number_length = 0;
let orderTypeWiseOrderNumber = false;

function getBillnumberlength() {
  let billNumberlength = 0;
  if (global.storeDetails && global.storeDetails.extra_info) {
    const extra_info = safeParse(global.storeDetails.extra_info);
    billNumberlength = Number(extra_info.bill_number_length);
  }
  bill_number_length = billNumberlength;
  return billNumberlength;
}

async function initListeners() {
  if (ipcMain) {
    ipcMain.on(SPLIT_BILL.SPLIT_BY_PORTION, splitbillbyportionRequest);
    ipcMain.on(SPLIT_BILL.SPLIT_BY_PERCENTAGE, spillBillbypercentagerequest);
    ipcMain.on(SPLIT_BILL.SPLIT_BY_ITEMS, spillBillbyitemsrequest);
  }
  if (global.storeDetails && global.storeDetails.extra_info) {
    const extra_info = safeParseformain(global.storeDetails.extra_info);
    orderTypeWiseOrderNumber = Number(
      extra_info.generateOrderTypeWiseOrderNumber,
    );
  }
}

async function spillBillbypercentage(params) {
  try {
    const { table_id } = params;
    const { table_name } = params;
    const { percentageNumbers } = params;
    let { order_type_flag } = params;

    let kotResult = await connection.KOT.findAll({
      limit: 1,
      where: {
        table_id,
        is_active: 1,
      },
      raw: true,
    });
    let billing_type = order_type_flag;
    billing_type++;
    if (order_type_flag == 0) {
      order_type_flag = 5;
    }
    if (kotResult && kotResult.length > 0) {
      kotResult = kotResult[0];
      const kotItems = await getKotitemsandaddons(table_id);
      if (
        percentageNumbers &&
        Array.isArray(percentageNumbers) &&
        percentageNumbers.length > 0
      ) {
        const lastPercent = percentageNumbers.pop();
        const createdTable = [];
        const response = { status: 200 };
        for (const percent of percentageNumbers) {
          const percentwiseItems = [];
          let kotTotal = 0;
          for (const item of kotItems) {
            const tempItems = JSON.parse(JSON.stringify(item));
            let newQty = (Number(item.quantity) / 100) * percent;
            newQty = Number(newQty.toFixed(2));
            tempItems.quantity = newQty;
            tempItems.amount =
              tempItems.amount == 0 ? 0 : newQty * tempItems.item_price;
            tempItems.amount = Number(tempItems.amount.toFixed(2));
            tempItems.item_total_tax_value =
              tempItems.item_tax_value * tempItems.quantity;
            tempItems.item_total_tax_value = Number(
              Number(tempItems.item_total_tax_value).toFixed(2),
            );
            kotTotal += tempItems.amount;

            delete tempItems.kot_items_id;
            percentwiseItems.push(tempItems);
          }

          const kotDetails = {
            amount: kotTotal.toFixed(2),
            note: kotResult.note,
            persons: kotResult.persons,
            table_id,
            customer_name: kotResult.customer_name,
            customer_mobile: kotResult.customer_mobile,
            customer_id: kotResult.customer_id,
            createdBy: kotResult.createdBy,
            user_id: kotResult.user_id,
            store_id: kotResult.store_id,
            bill_number: global.generateId(),
            billing_type,
            discount_type: kotResult.discount_type,
            discount_rate: kotResult.discount_rate,
            waiter: kotResult.waiter,
            waiter_id: kotResult.waiter_id,
            extra_details: { splittedBill: true },
          };
          const newTablename = `${table_name}-Per-${percent}`;
          const tableDetails = {
            table_name: newTablename,
            department: params.defaultDepartmentid,
            section: params.section,
            table_action_flag: 2,
            order_type_flag,
            store_id: kotResult.store_id,
            isactive: 1,
            table_color: Colors.BILL_SAVED,
            order_state: 'Placed',
          };

          const result = await createtableaddnewKOT(
            tableDetails,
            kotDetails,
            percentwiseItems,
          );
          if (result) {
            createdTable.push(result);
          }
          // response[`${percent}`] = percentwiseItems;
        }

        let oldkotTotal = 0;
        for (const tempItems of kotItems) {
          let newQty = (Number(tempItems.quantity) / 100) * lastPercent;
          newQty = Number(newQty.toFixed(2));
          tempItems.quantity = newQty;
          tempItems.amount =
            tempItems.amount == 0 ? 0 : newQty * tempItems.item_price;
          tempItems.amount = Number(tempItems.amount.toFixed(2));
          tempItems.item_total_tax_value =
            tempItems.item_tax_value * tempItems.quantity;
          tempItems.item_total_tax_value = Number(
            Number(tempItems.item_total_tax_value).toFixed(2),
          );
          oldkotTotal += tempItems.amount;

          const kot_item_id = tempItems.kot_items_id;

          delete tempItems.kot_items_id;
          await connection.KOTItem.update(tempItems, {
            where: {
              id: kot_item_id,
            },
          });
        }
        await connection.KOT.update(
          { amount: oldkotTotal, sync_status: 0 },
          {
            where: {
              kot_id: kotResult.kot_id,
            },
          },
        );

        response.lastPercent = lastPercent;
        response.createdTable = createdTable;

        // check for kot charges and send charge id in response
        // let charges = await connection.KOTCharges.findAll({
        //   raw: true,
        //   where: {
        //     table_id,
        //     is_active: 1,
        //   },
        // });

        // if (charges && charges.length) {
        //   response.charges = charges;
        // }

        sendLivesyncrequest();
        return response;
      }
      return { staus: 400, message: 'Invalid Parameters' };
    }
    return { staus: 400, message: 'Invalid Parameters' };
  } catch (error) {
    console.log(error);
    return { staus: 400, message: 'Invalid Parameters' };
  }
}

async function spillBillbyportion(params) {
  try {
    const { table_id } = params;
    const { table_name } = params;
    const { noofPortions } = params;
    let { order_type_flag } = params;

    let kotResult = await connection.KOT.findAll({
      limit: 1,
      where: {
        table_id,
        is_active: 1,
      },
      raw: true,
    });
    if (kotResult && kotResult.length > 0) {
      kotResult = kotResult[0];
      const kotItems = await getKotitemsandaddons(table_id);
      const portionwiseItems = [];
      let kotTotal = 0;
      const oldKotitems = [];
      for (const item of kotItems) {
        const tempItems = JSON.parse(JSON.stringify(item));
        let newQty = Number(item.quantity) / noofPortions;

        newQty = Number(newQty.toFixed(2));
        tempItems.quantity = newQty;
        tempItems.amount =
          tempItems.amount == 0 ? 0 : newQty * tempItems.item_price;
        tempItems.amount = Number(tempItems.amount.toFixed(2));
        tempItems.item_total_tax_value =
          tempItems.item_tax_value * tempItems.quantity;
        kotTotal += tempItems.amount;

        const oldkotItem = JSON.parse(JSON.stringify(tempItems));
        delete tempItems.kot_items_id;
        portionwiseItems.push(tempItems);
        oldKotitems.push(oldkotItem);
      }

      let billing_type = order_type_flag;
      billing_type++;
      if (order_type_flag == 0) {
        order_type_flag = 5;
      }
      const kotDetails = {
        amount: kotTotal.toFixed(2),
        note: kotResult.note,
        persons: kotResult.persons,
        table_id,
        customer_name: kotResult.customer_name,
        customer_mobile: kotResult.customer_mobile,
        customer_id: kotResult.customer_id,
        createdBy: kotResult.createdBy,
        user_id: kotResult.user_id,
        store_id: kotResult.store_id,
        bill_number: global.generateId(),
        billing_type,
        discount_type: kotResult.discount_type,
        discount_rate: kotResult.discount_rate,
        extra_details: { splittedBill: true },
      };
      const createdTable = [];
      for (let index = 1; index < noofPortions; index++) {
        const newTablename = `${table_name}-Por-${index}`;
        const tableDetails = {
          table_name: newTablename,
          department: params.defaultDepartmentid,
          section: params.section,
          table_action_flag: 2,
          order_type_flag,
          store_id: kotResult.store_id,
          isactive: 1,
          table_color: Colors.BILL_SAVED,
          order_state: 'Placed',
        };
        const result = await createtableaddnewKOT(
          tableDetails,
          kotDetails,
          portionwiseItems,
        );
        if (result) {
          createdTable.push(result);
        }
      }
      await connection.KOT.update(
        { amount: kotTotal, sync_status: 0 },
        {
          where: {
            kot_id: kotResult.kot_id,
          },
        },
      );

      // if same item is in multiple kot then in base table item qty not getting proper
      // first disable all acitve kot's
      // enable only those kot's which are having items
      await connection.KOT.update(
        { is_active: 0 },
        {
          where: {
            table_id,
            is_active: 1,
          },
        },
      );
      for (const olditem of oldKotitems) {
        const kot_item_id = olditem.kot_items_id;
        delete olditem.kot_items_id;
        await connection.KOT.update(
          { is_active: 1 },
          {
            where: {
              kot_id: olditem.kot_id,
            },
          },
        );
        await connection.KOTItem.update(olditem, {
          where: {
            // id: kot_item_id,
            kot_id: olditem.kot_id,
            item_id: olditem.item_id,
            item_name: olditem.item_name,
            item_price: olditem.item_price,
          },
        });
      }
      // check for kot charges and send charge id in response
      // let charges = await connection.KOTCharges.findAll({
      //   raw: true,
      //   where: {
      //     table_id,
      //     is_active: 1,
      //   },
      // });

      sendLivesyncrequest();
      return { status: 200, portionwiseItems, createdTable };
    }
    return { staus: 400 };
  } catch (error) {
    console.log(error);
    return { staus: 400, message: 'Invalid Parameters' };
  }
}

async function spillBillbyitems(params) {
  try {
    const { table_id } = params;
    const { table_name } = params;
    const { createdParts } = params;
    const { customer } = params;
    const { user_id } = params;
    const { store_id } = params;
    let { order_type_flag } = params;

    let placedkotNos = [];

    let kotResult = await connection.KOT.findAll({
      where: {
        table_id,
        is_active: 1,
      },
      raw: true,
    });

    if (kotResult && kotResult.length > 0) {
      placedkotNos = getBykey(kotResult, 'kot_id');
      kotResult = kotResult[0];
    } else {
      kotResult = undefined;
    }

    let billing_type = order_type_flag;
    billing_type++;
    if (order_type_flag == 0) {
      order_type_flag = 5;
    }

    if (
      createdParts &&
      Array.isArray(createdParts) &&
      createdParts.length > 0
    ) {
      if (createdParts.length > 1) {
        const lastPart = createdParts.pop();
        const createdTable = [];

        for (const element of createdParts) {
          const currentsplitItems = element.items;
          if (!currentsplitItems) {
            return;
          }
          let kotTotal = 0;
          currentsplitItems.forEach((element) => {
            element.item_name = element.title;
            kotTotal = element.amount == 0 ? 0 : kotTotal + element.amount;
            element.item_total_tax_value =
              element.item_tax_value * element.quantity;
            element.item_total_tax_value = Number(
              Number(element.item_total_tax_value).toFixed(2),
            );
            element.amount = element.quantity * element.item_price;

            element.createdBy = user_id;
            element.user_id = user_id;
          });

          const kotDetails = {
            amount: kotTotal.toFixed(2),
            table_id,
            customer_name: customer ? customer.name : '',
            customer_mobile: customer ? customer.phone : '',
            customer_id: customer.customer_id,

            createdBy: user_id,
            user_id,
            store_id,
            bill_number: global.generateId(),
            billing_type,
            discount_type: kotResult ? kotResult.discount_type : 0,
            discount_rate: kotResult ? kotResult.discount_rate : 0,
            extra_details: { splittedBill: true },
          };

          const newTablename = `${table_name}-${element.part}`;
          const tableDetails = {
            table_name: newTablename,
            department: params.defaultDepartmentid,
            section: params.section,
            table_action_flag: 2,
            order_type_flag,
            store_id,
            isactive: 1,
            table_color: Colors.BILL_SAVED,
            order_state: 'Placed',
          };
          const result = await createtableaddnewKOT(
            tableDetails,
            kotDetails,
            currentsplitItems,
          );
          if (result) {
            createdTable.push(result);
          }
        }

        if (lastPart && lastPart.items) {
          const currentsplitItems = lastPart.items;
          let kotTotal = 0;

          if (placedkotNos && placedkotNos.length > 0) {
            await connection.KOTItem.destroy({
              where: {
                kot_id: {
                  [connection.Sequelize.Op.in]: placedkotNos,
                },
              },
            });
            for (const element of currentsplitItems) {
              kotTotal += element.amount;
              element.item_total_tax_value =
                element.item_tax_value * element.quantity;
              element.item_total_tax_value = Number(
                Number(element.item_total_tax_value).toFixed(2),
              );
              element.amount =
                element.amount == 0 ? 0 : element.quantity * element.item_price;

              const { addons } = element;
              delete element.addons;
              element.kot_id = kotResult.kot_id;
              element.item_name = element.title;

              element.createdBy = user_id;
              element.user_id = user_id;

              const itemresultEntity = await connection.KOTItem.create(element);
              if (addons && Array.isArray(addons) && addons.length > 0) {
                for (const addon of addons) {
                  addon.kot_items_id = itemresultEntity.id;
                  delete addon.id;
                  await connection.KotItemOption.create(addon);
                }
              }
              if (
                element.itemlevelCharges &&
                Array.isArray(element.itemlevelCharges) &&
                element.itemlevelCharges.length > 0
              ) {
                addItemlevelkotcharges(
                  kotResult.table_id,
                  element.itemlevelCharges,
                  element.item_name,
                  false,
                );
              }
            }

            await connection.KOT.update(
              { amount: kotTotal, sync_status: 0 },
              { where: { kot_id: kotResult.kot_id } },
            );
          }
        }
        // check for kot charges and send charge id in response
        // let charges = await connection.KOTCharges.findAll({
        //   raw: true,
        //   where: {
        //     table_id,
        //     is_active: 1,
        //   },
        // });

        sendLivesyncrequest();
        return { status: 200, message: 'success', createdTable };
      }
      return {
        status: 400,
        message: 'Invalid Parameter',
      };
    }
    return {
      status: 400,
      message: 'Invalid Parameter',
    };
  } catch (error) {
    console.log(error);
    return {
      status: 400,
      message: 'Invalid Parameter',
    };
  }
}

async function addItemlevelkotcharges(
  table_id,
  chargeDetails,
  parentItem,
  deleteOld,
) {
  try {
    for (const charge of chargeDetails) {
      await connection.KOTItemcharges.destroy({
        where: {
          itemtitle: parentItem,
          table_id,
          charge_id: charge.charge_id,
        },
      });
      if (charge.id) delete charge.id;
      charge.table_id = table_id;
      charge.itemtitle = parentItem;
      await connection.KOTItemcharges.create(charge);
    }
  } catch (error) {
    console.log(error);
  }
}

async function createtableaddnewKOT(tableDetails, kotDetails, splittedItems) {
  try {
    let createdTableenitiy = await connection.Table.create(tableDetails);
    createdTableenitiy = createdTableenitiy.get({ plain: true });

    if (createdTableenitiy) {
      Object.assign(createdTableenitiy, {
        'mpos_department.section': tableDetails.section,
      });
    }

    Object.assign(kotDetails, {
      table_id: createdTableenitiy.id,
      table_name: tableDetails.table_name,
      bill_number: global.generateId(),
    });

    Object.assign(kotDetails, {
      kot_uniqueid: global.generateId(),
    });

    let nextOrderNumber = await getResettedordernumberifexist();
    if (global.orderTypeWiseOrderNumber) {
      nextOrderNumber = safeParseformain(nextOrderNumber);
      if (nextOrderNumber && nextOrderNumber[kotDetails.billing_type]) {
        nextOrderNumber = nextOrderNumber[kotDetails.billing_type];
      } else {
        nextOrderNumber = 1;
      }
    }

    if (nextOrderNumber) {
      let extra_details = {};
      if (kotDetails.extra_details) {
        extra_details = { ...kotDetails.extra_details };
      }
      Object.assign(extra_details, {
        order_number: nextOrderNumber,
      });
      kotDetails.extra_details = extra_details;
    }

    const kotresultEntity = await connection.KOT.create(kotDetails);

    if (
      tableDetails.section == 2 &&
      global.storeDetails.is_bar_section_billing
    ) {
      await updateDummyBarkotnumber(kotresultEntity.kot_id);
    } else {
      await updateDummykotnumber(kotresultEntity.kot_id);
    }

    if (
      tableDetails.section == 2 &&
      global.storeDetails.is_bar_section_billing
    ) {
      await connection.Tempnumbers.increment(['barSection_kot_number'], {
        by: 1,
        where: { id: 1 },
      });
    } else {
      await connection.Tempnumbers.increment(['kot_number'], {
        by: 1,
        where: { id: 1 },
      });
    }

    if (kotresultEntity != undefined && kotresultEntity.kot_id != 0) {
      for (const portionItem of splittedItems) {
        const kotItem = JSON.parse(JSON.stringify(portionItem));

        const { addons } = kotItem;
        delete kotItem.addons;
        kotItem.kot_id = kotresultEntity.kot_id;
        const itemresultEntity = await connection.KOTItem.create(kotItem);
        if (addons && Array.isArray(addons) && addons.length > 0) {
          for (const addon of addons) {
            addon.kot_items_id = itemresultEntity.id;
            delete addon.id;
            await connection.KotItemOption.create(addon);
          }
        }
        if (
          kotItem.itemlevelCharges &&
          Array.isArray(kotItem.itemlevelCharges) &&
          kotItem.itemlevelCharges.length > 0
        ) {
          addItemlevelkotcharges(
            createdTableenitiy.id,
            kotItem.itemlevelCharges,
            kotItem.item_name,
            true,
          );
        }
      }

      const cust_name = kotDetails.customer_name;
      const cust_phone = kotDetails.customer_mobile;

      // if (!cust_name && !cust_phone) {
      //   cust_name = 'POS User';
      //   cust_phone = '9090909090';
      // }

      const billDetails = {
        order_total: kotDetails.amount,
        table_name: tableDetails.table_name,
        table_id: createdTableenitiy.id,
        cust_name,
        phone: cust_phone,
        persons: kotDetails.persons,
        order_state: 'pending',
        discount: 0,
        order_level_total_taxes: 0,
        order_id: kotDetails.bill_number,
        order_subtotal: kotDetails.amount,
        order_level_total_charges: 0,
        store_id: kotDetails.store_id,
        billing_type: kotDetails.billing_type,
        user_id: kotDetails.user_id,
        createdBy: kotDetails.user_id,
        waiter: kotDetails.waiter,
        waiter_id: kotDetails.waiter_id,
        // payment: 'Cash'
      };

      // if (global.defaultPaymentoption) {
      //   Object.assign(billDetails, {
      //     payment: global.defaultPaymentoption,
      //   });
      // }
      const extra_details = {};
      if (tableDetails.section == 2) {
        Object.assign(extra_details, { isBarSection: 'true' });
      }

      if (extra_details) {
        Object.assign(billDetails, { extra_details });
      }
      let billResult = await connection.Bill.create(billDetails);
      // if (billDetails.payment) {
      //   const paymentDetails = {
      //     order_id: billDetails.order_id,
      //     payment_option: billDetails.payment,
      //     store_id: global.storeDetails.store_id,
      //     amount: billDetails.order_total,
      //   };

      //   await connection.BillPayment.create(paymentDetails);
      // }
      billResult = billResult.get({ plain: true });
      if (billResult) {
        let quantity = 0;
        // eslint-disable-next-line no-restricted-syntax
        for (const item of splittedItems) {
          quantity += item.quantity;
          const tempItem = {
            title: item.item_name,
            item_id: item.item_id,
            quantity: item.quantity,
            amount: item.amount,
            price: item.item_price,
            bill_id: billResult.id,
            orderMasterId: billResult.order_id,
            total: item.amount,
            total_with_tax: item.amount + item.item_tax_value * item.quantity,
            tax_method: item.item_tax_method,
            tax_name: item.item_tax_name,
            tax_per: item.item_tax_per,
            tax_value: item.item_tax_value,
            is_devidable: item.item_is_devidable,
            product_group_id:
              item.product_group_id != undefined ? item.product_group_id : null,
            product_group_name: item.product_group_name
              ? item.product_group_name
              : null,

            kitchen_dept: item.kitchen_dept,
            hsn_code: item.hsn_code,
            short_code: item.short_code,
            category_name: item.category_name,
            alternative_title: item.alternative_title,
            extra_details: item.extra_details,
            has_options: item.has_options,
          };

          // Calculate total with tax value
          let itemtotalwithTax = tempItem.total_with_tax;
          if (item.item_tax_method === ITEM_TAX_TYPES.INCLUSIVE) {
            itemtotalwithTax = item.amount;
          } else {
            itemtotalwithTax =
              item.amount + item.item_tax_value * item.quantity;
          }
          Object.assign(tempItem, {
            total_with_tax: itemtotalwithTax,
          });

          const billitemresult = await connection.BillItem.create(tempItem);
          if (
            billitemresult.id &&
            item.has_options &&
            item.has_options == 1 &&
            item.addons &&
            item.addons.length > 0
          ) {
            // eslint-disable-next-line no-restricted-syntax
            for (const addon of item.addons) {
              await connection.BillItemOption.create({
                order_id: billDetails.order_id,
                order_item_id: billitemresult.id,
                option_group_ref_id: addon.option_group_ref_id,
                option_ref_id: addon.option_ref_id,
                option_group_name: addon.option_group_name,
                title: addon.option_name,
                qty: addon.option_qty,
                price: addon.option_price,
                total: addon.option_total,
                total_with_tax: addon.option_total_with_tax,
                tax_value: addon.option_tax_amount,
                type: addon.option_type,
                item_ref_id: addon.item_ref_id,
                tax_name: item.item_tax_name,
                is_devidable: item.item_is_devidable,
                option_id: addon.option_id,
              });
            }
          }

          // if item having item level charges
          if (item && item.itemlevelCharges && item.itemlevelCharges.length) {
            // eslint-disable-next-line no-restricted-syntax
            for (const charge of item.itemlevelCharges) {
              // 1-percentage 0-fix
              let chargeTaxpercentage = 0;
              if (charge.tax_amount) {
                chargeTaxpercentage = charge.tax_amount;
              }
              let chargeAmount = charge.amount;
              if (charge.per_or_fixed == 1) {
                // chargeAmount = ((item.amount * chargeAmount) / 100).toFixed(ROUNDOFF_UPTO);
                if (charge.extra_details) {
                  const extra_details = JSON.parse(charge.extra_details);
                  // extra_details = JSON.parse(extra_details)
                  // eslint-disable-next-line camelcase
                  if (extra_details.applicable_on_amount == '1') {
                    chargeAmount = (
                      ((item.pricebeforeDiscount
                        ? item.pricebeforeDiscount
                        : item.item_price) *
                        item.quantity *
                        chargeAmount) /
                      100
                    ).toFixed(ROUNDOFF_UPTO);
                  } else {
                    chargeAmount = ((item.amount * chargeAmount) / 100).toFixed(
                      ROUNDOFF_UPTO,
                    );
                  }
                } else {
                  chargeAmount = ((item.amount * chargeAmount) / 100).toFixed(
                    ROUNDOFF_UPTO,
                  );
                }
              } else {
                chargeAmount = Number(chargeAmount) * Number(item.quantity);
              }

              chargeAmount = Number(chargeAmount).toFixed(ROUNDOFF_UPTO);
              charge.calculated_charge = chargeAmount;
              if (charge.calculate_tax_for_item_charges !== 0) {
                charge.calculated_tax = (
                  (chargeTaxpercentage * chargeAmount) /
                  100
                ).toFixed(ROUNDOFF_UPTO);
                Object.assign(item, {
                  recalculatedAmount:
                    Number(item.amount) + Number(chargeAmount),
                });
              }

              await connection.Orderchildcharges.create({
                order_id: kotDetails.bill_number,
                order_item_id: billitemresult.id,
                charge_title: charge.title,
                per_fixed: charge.per_or_fixed,
                calculated_charge: charge.calculated_charge,
                calculated_tax: charge.calculated_tax,
                charge_amount: charge.amount,
                calculate_tax_for_item_charges:
                  charge.calculate_tax_for_item_charges,
                is_tax_applicable: charge.is_tax_applicable,
                tax_amount: charge.tax_amount,
                is_tax_included: charge.is_tax_included,
                tax_title: charge.tax_title,
                tax_divided: charge.tax_divided,
              });
            }
          }
        }

        let insertedBillno = billResult.id;
        let nextBill;
        if (tableDetails.section == 2) {
          nextBill = await getbarSectionBillkotifexist({ forKot: false });
        } else {
          nextBill = await getResettedbillkotifexist({ forKot: false });
        }

        if (nextBill) insertedBillno = nextBill;

        let padBillNumber = insertedBillno;
        bill_number_length = getBillnumberlength();

        if (padBillNumber && bill_number_length) {
          padBillNumber = pad(insertedBillno, bill_number_length);
        }

        const kotdetailsUpdatedata = {
          bill_number: billDetails.order_id,
          order_id: nextBill,
          sync_status: 0,
        };

        const billnumberUpdatedata = {
          quantity,
          bill_number: insertedBillno,
          sync_status: 0,
        };
        if (nextOrderNumber && billDetails && billDetails.extra_details) {
          Object.assign(billDetails.extra_details, {
            order_number: nextOrderNumber,
          });
          Object.assign(billnumberUpdatedata, {
            extra_details: billDetails.extra_details,
          });
        }
        if (
          tableDetails.section == 2 &&
          global.storeDetails.is_bar_section_billing &&
          global.storeDetails.bar_bill_prefix
        ) {
          Object.assign(kotdetailsUpdatedata, {
            custom_bill_number: `${global.storeDetails.bar_bill_prefix}${padBillNumber}`,
          });
          Object.assign(billnumberUpdatedata, {
            custom_bill_number: `${global.storeDetails.bar_bill_prefix}${padBillNumber}`,
          });
        } else if (global.storeDetails.bill_number_prefix) {
          Object.assign(kotdetailsUpdatedata, {
            custom_bill_number: `${global.storeDetails.bill_number_prefix}${padBillNumber}`,
          });
          Object.assign(billnumberUpdatedata, {
            custom_bill_number: `${global.storeDetails.bill_number_prefix}${padBillNumber}`,
          });
        }

        await connection.KOT.update(kotdetailsUpdatedata, {
          where: {
            table_id: billDetails.table_id,
            is_active: 1,
          },
        });

        await connection.Bill.update(billnumberUpdatedata, {
          where: {
            id: billResult.id,
          },
        });

        if (tableDetails.section == 2) {
          await connection.Tempnumbers.increment(['barSection_bill_number'], {
            by: 1,
            where: { id: 1 },
          });
        } else {
          await connection.Tempnumbers.increment(['bill_number'], {
            by: 1,
            where: { id: 1 },
          });
        }

        await fetchAndUpdateOrderNumberWithoutTransaction(kotDetails);
      }
    }

    return createdTableenitiy;
  } catch (error) {
    console.log(error);
  }
}

/**
 * Returns the KOT items of table
 * @param {Table ID} table_id
 */
async function getKotitemsandaddons(table_id) {
  let billItems = [];
  try {
    // let billItems = await connection.KOTItem.getKotitems(table_id);
    billItems = await connection.KOTItem.findAll({
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
      attributes: [
        ['id', 'kot_items_id'],
        'item_name',
        [
          connection.Sequelize.fn(
            'sum',
            connection.Sequelize.col('mpos_kot_item.amount'),
          ),
          'amount',
        ],
        [
          connection.Sequelize.fn(
            'sum',
            connection.Sequelize.col('mpos_kot_item.quantity'),
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
        'note',
        'has_options',
        'product_group_id',
        'product_group_name',
        'user_id',
        'createdBy',
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
        'extra_details',
        'alternative_category_name',
        'category_name',
        'alternative_title',
      ],
      where: {
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
      group: ['mpos_kot_item.item_name', 'item_price'],
      order: connection.Sequelize.literal('mpos_kot_item.id'),
      raw: true,
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const kotItem of billItems) {
      kotItem.extra_details = safeParseformain(kotItem.extra_details);
      kotItem.extra_details = safeParseformain(kotItem.extra_details);

      if (kotItem.has_options == 1) {
        // eslint-disable-next-line no-await-in-loop
        const addons = await connection.KotItemOption.findAll({
          raw: true,
          where: {
            kot_items_id: kotItem.kot_items_id,
          },
        });
        kotItem.addons = addons;
      }
      const itemlevelCharges = await connection.KOTItemcharges.findAll({
        raw: true,
        where: {
          itemtitle: kotItem.item_name,
          table_id,
        },
      });
      if (itemlevelCharges && itemlevelCharges.length > 0) {
        kotItem.itemlevelCharges = itemlevelCharges;
      }
    }
  } catch (error) {
    billItems = [];
  }
  return billItems;
}

async function splitbillbyportionRequest(event, data) {
  const result = await spillBillbyportion(data);
  event.reply(SPLIT_BILL.SPLIT_BY_PORTION_REPLY, result);
}

async function spillBillbypercentagerequest(event, data) {
  const result = await spillBillbypercentage(data);
  event.reply(SPLIT_BILL.SPLIT_BY_PERCENTAGE_REPLY, result);
}

async function spillBillbyitemsrequest(event, data) {
  const result = await spillBillbyitems(data);
  event.reply(SPLIT_BILL.SPLIT_BY_PERCENTAGE_REPLY, result);
}

function pad(num, size) {
  num = num.toString();
  while (num.length < size) num = `0${num}`;
  return num;
}

initListeners();

module.exports = {
  spillBillbypercentage,
  spillBillbyportion,
  spillBillbyitems,
};
