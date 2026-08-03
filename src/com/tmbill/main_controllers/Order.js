/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
const hasPath = require('lodash/has');
// const NepaliDate = require('nepali-date-converter');
const { default: NepaliDate } = require('nepali-date-converter');
const uniqBy = require('lodash/uniqBy');
const isNumber = require('lodash/isNumber');
const { Op, where, Sequelize } = require('sequelize');
const { default: axios } = require('axios');
const { response } = require('express');
const {
  KOT,
  BillCharges,
  KOTCharges,
  BillItem,
  BillItemOption,
  Bill,
  Duepayments,
} = require('../js/database');
const { OFFLINE_ORDERSTATES } = require('../util/OrderStates');
const {
  QUICKBILL_BILLING_FLAG,
  ONLINE_PLATFORMS,
  DEFAULT_TAKEAWAY_TABLENAME,
  DEFAULT_HOMED_TABLENAME,
  TAKEAWAY_FLAG_ID,
  HOMED_FLAG_ID,
  ITEM_TAX_TYPES,
  BILL_PREFIX_FOR,
  VIRTUALTABLE_FLAG_ID,
} = require('../util/Constants');
const TableUtils = require('../util/TableUtils');
const {
  ASYNC_LISTEN_CUSTOMER_UPDATES,
  REMOTE_FORCE_LOGUT,
  RETRY_PULL_ONLINE_ORDER,
  UPDATE_STOCK_QTY,
  PRINT_CSK_KOT,
  SET_BUSY_TABLE_DATA,
} = require('../util/IPC_Messages');
const {
  MENU_ITEMSORT_TYPES,
  DEFAULT_PAYMENT_MODE,
  USE_CATEGORY_TIME_FOR_POS,
  AUTO_OUTOF_STOCK,
  ONLINE_ORDER_DIRECT_IN_PREPRATION,
  ADD_LOGIN_VALIDATION_FOR_CSK_TERMINAL_USER,
  SYNC_TIME_INTERVAL,
  SYNC_ORDER_BATCH_SIZE,
  FILTER_ITEMS_BY_ORDER_TYPES,
  SHOWNOTE_ON_BILLPRINT,
  COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY,
  PRINT_WIDTH_FOR_CSK_BILL_PRINT,
  SHOW_FOODREADY_NOTIFICATION_ON_ORDERHUB,
  FETCH_REPORT_AS_PER_CLOSE_DAY,
  SHOW_ITEM_NOTE_IN_BILLING_WINDOW,
} = require('../util/SettingIDs');
const connection = require('../js/database');

const stringConstructor = 'test'.constructor;
const {
  getdepartmentstoInclude,
  getitemcatstoInclude,
} = require('../js/AccesslevelManager');
const { restartPreordersjobs } = require('../util/Jobs');
const {
  syncCustomersifany,
  updateRewardhistory,
  sendLivesyncrequest,
  setSyncTimeInterval,
} = require('../services/SyncService');
const { OrderState, OnlineBillingTypeByName } = require('../util/DBUtil');
const { setDateForMidnightOrder } = require('../util/MiscUtil');
const { deleteOrderById } = require('./Bill');
const {
  safeParseformain,
  istimebetweenTwotimeformain,
  CATEGROY_DAYS_FOR_MAIN,
  sleep,
} = require('./Utils');
const { getHeadersformpos } = require('../services/MiscServices');
const { getPlatformCatalogueitems, reduceBackendStock } = require('./APICalls');
const {
  fetchCategoryTimingsandsetcronjob,
} = require('./Utils/categoryTimings');
const { generateTallyXML } = require('./TallyReport');
const { getItemTaxes, getItemPrices } = require('./Item');
const { apiCall } = require('../services/APIService');
const { setSyncLimit } = require('../services/OrderPayloadGenerator');
const { ORDER } = require('../server/SocketEvents');
const {
  addRecordItemStockOutBox,
  startItemOutBoxJob,
} = require('../main/services/ItemStock.service');

global.allowModifyBill = false;
global.selectedLanguage = 'en';
let currentAccesslevels;
let bill_number_length = 0;
global.isBillsaveinprocess = false;
let useCategoryTimings = false;
let tally_integration = false;
global.allTables;
global.isSaveKOtInProgress = false;
let putDigitalOrderDirectInPreparation = false;
global.addLoginValidationForCskTerminalUsers = false;
global.syncTimeInterval = undefined;
global.syncOrderBatchSize = undefined;
let platformCatalogueitems = [];
let platformCatalogueCategories = [];
global.orderTypeWiseOrderNumber = false;
global.itemFileterByOrderType = false;
global.showitemnoteonBill = false;
global.showItemNoteInBillingWindow = false;
global.countMidnightSale = false;
global.hasItemDiscount = false;
global.printWidthForCSKBillPrint = 0;
global.showFoodReadyNotificationOnOrderhub = false;
global.fetchReportAsPerCloseDay = false;
global.defaultPaymentoption;

const busy_table = new Map();
async function initializeAccesslevles() {
  try {
    if (global && global.storeDetails && global.storeDetails.access_levels) {
      if (global.storeDetails.access_levels.constructor === stringConstructor) {
        currentAccesslevels = safeParseformain(
          global.storeDetails.access_levels,
        );
      } else {
        currentAccesslevels = global.storeDetails.access_levels;
      }
    } else {
      currentAccesslevels = undefined;
    }
  } catch (error) {
    elog.error({ from: 'parseAccesslevels', error });
    currentAccesslevels = undefined;
  }

  if (currentAccesslevels) {
    if (currentAccesslevels.order_window) {
      initAccesslevelsfororders({
        orderAccesslevels: currentAccesslevels.order_window,
      });
    }
  }
  if (global.settingsConfig && !platformCatalogueitems.length) {
    const { platformItems, platformCategories } =
      await getPlatformCatalogueitems();
    platformCatalogueitems = platformItems;
    platformCatalogueCategories = platformCategories;
  }

  if (global.storeDetails && global.storeDetails.extra_info) {
    const extra_info = safeParseformain(global.storeDetails.extra_info);
    bill_number_length = Number(extra_info.bill_number_length);
  }

  if (global.storeDetails && global.storeDetails.extra_info) {
    const extra_info = safeParseformain(global.storeDetails.extra_info);
    tally_integration = Number(extra_info.tally_integration);
  }

  if (global.storeDetails && global.storeDetails.extra_info) {
    const extra_info = safeParseformain(global.storeDetails.extra_info);
    global.orderTypeWiseOrderNumber = Number(
      extra_info.generateOrderTypeWiseOrderNumber,
    );
  }

  if (
    global.settingsConfig &&
    global.settingsConfig[USE_CATEGORY_TIME_FOR_POS - 1] != undefined &&
    global.settingsConfig[USE_CATEGORY_TIME_FOR_POS - 1].value === '1'
  ) {
    useCategoryTimings = true;
  }
  global.reduceStock = false;

  if (
    global.settingsConfig &&
    global.settingsConfig[AUTO_OUTOF_STOCK - 1] &&
    global.settingsConfig[AUTO_OUTOF_STOCK - 1].value === '1'
  ) {
    global.reduceStock = true;
  }

  if (global.reduceStock && global.__IS_MASTER_POS__) {
    startItemOutBoxJob();
  }
  if (
    global.settingsConfig &&
    global.settingsConfig[ONLINE_ORDER_DIRECT_IN_PREPRATION - 1] != undefined &&
    global.settingsConfig[ONLINE_ORDER_DIRECT_IN_PREPRATION - 1].value === '1'
  ) {
    putDigitalOrderDirectInPreparation = true;
  }

  if (
    global.settingsConfig &&
    global.settingsConfig[ADD_LOGIN_VALIDATION_FOR_CSK_TERMINAL_USER - 1] !=
      undefined &&
    global.settingsConfig[ADD_LOGIN_VALIDATION_FOR_CSK_TERMINAL_USER - 1]
      .value === '1'
  ) {
    global.addLoginValidationForCskTerminalUsers = true;
  }

  if (
    global.settingsConfig &&
    global.settingsConfig[SYNC_TIME_INTERVAL - 1] &&
    global.settingsConfig[SYNC_TIME_INTERVAL - 1].value
  ) {
    global.syncTimeInterval =
      global.settingsConfig[SYNC_TIME_INTERVAL - 1].value;
  }

  if (
    global.settingsConfig &&
    global.settingsConfig[PRINT_WIDTH_FOR_CSK_BILL_PRINT - 1] &&
    global.settingsConfig[PRINT_WIDTH_FOR_CSK_BILL_PRINT - 1].value
  ) {
    global.printWidthForCSKBillPrint =
      global.settingsConfig[PRINT_WIDTH_FOR_CSK_BILL_PRINT - 1].value;
  }

  if (
    global.settingsConfig &&
    global.settingsConfig[SHOW_FOODREADY_NOTIFICATION_ON_ORDERHUB - 1] &&
    global.settingsConfig[SHOW_FOODREADY_NOTIFICATION_ON_ORDERHUB - 1].value
  ) {
    global.showFoodReadyNotificationOnOrderhub =
      global.settingsConfig[SHOW_FOODREADY_NOTIFICATION_ON_ORDERHUB - 1].value;
  }

  if (
    global.settingsConfig &&
    global.settingsConfig[SYNC_ORDER_BATCH_SIZE - 1] &&
    global.settingsConfig[SYNC_ORDER_BATCH_SIZE - 1].value
  ) {
    global.syncOrderBatchSize =
      global.settingsConfig[SYNC_ORDER_BATCH_SIZE - 1].value;
  }

  if (global.settingsConfig[FILTER_ITEMS_BY_ORDER_TYPES - 1] !== undefined) {
    global.itemFileterByOrderType =
      global.settingsConfig[FILTER_ITEMS_BY_ORDER_TYPES - 1].value === '1';
  }
  if (global.settingsConfig[SHOWNOTE_ON_BILLPRINT - 1] !== undefined) {
    global.showitemnoteonBill =
      global.settingsConfig[SHOWNOTE_ON_BILLPRINT - 1].value === '1';
  }

  if (
    global.settingsConfig[SHOW_ITEM_NOTE_IN_BILLING_WINDOW - 1] !== undefined
  ) {
    global.showItemNoteInBillingWindow =
      global.settingsConfig[SHOW_ITEM_NOTE_IN_BILLING_WINDOW - 1].value === '1';
  }

  if (
    global.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1] !== undefined
  ) {
    global.countMidnightSale =
      global.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1].value ===
      '1';
  }

  if (global.settingsConfig && global.settingsConfig.length > 0) {
    global.fetchReportAsPerCloseDay =
      global.settingsConfig[FETCH_REPORT_AS_PER_CLOSE_DAY - 1].value === '1';
  }

  if (global.settingsConfig[DEFAULT_PAYMENT_MODE - 1] !== undefined) {
    global.defaultPaymentoption =
      global.settingsConfig[DEFAULT_PAYMENT_MODE - 1].value;
    if (!global.defaultPaymentoption) global.defaultPaymentoption = 'Cash';
  }
  setSyncLimit();
  setSyncTimeInterval();
}

// initializeAccesslevles();

function initAccesslevelsfororders({ orderAccesslevels }) {
  if (!currentAccesslevels) return;
  if (orderAccesslevels == undefined) {
    parseAccesslevels();
    orderAccesslevels =
      currentAccesslevels && currentAccesslevels.order_window
        ? currentAccesslevels.order_window
        : undefined;
  }
  if (orderAccesslevels) {
    if (orderAccesslevels.modify_bill_after_save) {
      global.allowModifyBill = true;
    } else {
      global.allowModifyBill = false;
    }
  }
}

async function getSettings() {
  let settingsConfig = [];
  try {
    settingsConfig = await connection.Settings.findAll({
      raw: true,
      order: [['id', 'ASC']],
    });
  } catch (error) {
    settingsConfig = [];
  }
  return settingsConfig;
}

async function addItemlevelkotcharges(
  table_id,
  chargeDetails,
  parentItem,
  transaction,
) {
  try {
    for (const charge of chargeDetails) {
      await connection.KOTItemcharges.destroy({
        where: {
          itemtitle: parentItem,
          table_id,
          charge_id: charge.charge_id,
        },
        transaction,
      });
      charge.table_id = table_id;
      charge.itemtitle = parentItem;
      await connection.KOTItemcharges.create(charge, { transaction });
    }
  } catch (error) {}
}

async function isBillgeneratedfortable(table_id, transaction) {
  const isbillGeneratedfortable = await connection.KOT.findAll({
    limit: 1,
    raw: true,
    where: {
      table_id,
      is_active: 1,
      bill_number: {
        [connection.Sequelize.Op.ne]: 0,
      },
    },
    transaction,
  });
  return isbillGeneratedfortable.length > 0;
}
/**
 * Save's a KOT
 * @param {Save KOT details} kotDetails
 */
async function saveKOT(kotDetails) {
  // console.log('save kot kotDetails::', kotDetails);
  const responseData = {};
  global.isSaveKOtInProgress = true;
  let transaction;
  if (global.isLoadMenuInProgress) {
    responseData.status = 'failure';
    responseData.message =
      'Load menu is in process. Please try after some time';
    return responseData;
  }
  if (global.reduceStock) {
    const { items } = kotDetails;
    if (items && items.length) {
      for (let i = 0; i < items.length; i++) {
        const kotitem = items[i];
        if (!kotitem.is_open_item) {
          const item = await connection.Item.findOne({
            attributes: ['current_stock'],
            where: {
              item_refid: kotitem.item_refid,
            },
          });

          if (kotitem.addons && kotitem.addons.length) {
            // kotitem.addons.forEach(async (addon) => {
            for (let i = 0; i < kotitem.addons.length; i++) {
              const addon = kotitem.addons[i];
              if (addon.option_ref_id) {
                const optionitem = await connection.Item.findOne({
                  attributes: ['current_stock'],
                  where: {
                    item_refid: addon.option_ref_id,
                  },
                });
                const addonQty = kotitem.quantity * addon.qty;
                if (optionitem && addonQty > optionitem.current_stock) {
                  responseData.status = 'failure';
                  responseData.message = `${addon.title} is out of stock`;
                }
              }
            }
          }

          if (item && kotitem.quantity > item.current_stock) {
            responseData.status = 'failure';
            responseData.message = `${kotitem.title} is out of stock`;
          }
        }
      }
    }
    if (responseData.status === 'failure') {
      global.isSaveKOtInProgress = false;
      return responseData;
    }
  }
  try {
    transaction = await connection.sequelize.transaction();
    if (kotDetails) {
      let hasactivePreviouskot = 0;
      let isNewKot = true;
      if (kotDetails.table_id) {
        // let isbillGeneratedfortable = await isBillgeneratedfortable(kotDetails.table_id);
        // if (isbillGeneratedfortable) {
        //     responseData.status = 'failure';
        //     responseData.message = 'Bill is generated for current table.';
        //     return responseData;
        // }

        if (
          global.allTables &&
          global.allTables.length &&
          kotDetails &&
          kotDetails.table_id &&
          kotDetails.isBarSection &&
          global.storeDetails.is_bar_section_billing
        ) {
          // check section of table
          const table = global.allTables.find(
            (table) => table.id === Number(kotDetails.table_id),
          );

          if (
            table &&
            table['mpos_department.section'] !== kotDetails.isBarSection
          ) {
            console.log(
              `Message="Table department section not matching" Table Section=${table['mpos_department.section']} kotDetails sections=${kotDetails.isBarSection}`,
            );
            responseData.status = 'failure';
            responseData.message = 'Table department section not matching';
            global.isSaveKOtInProgress = false;
            return responseData;
          }
        }

        // check if bill save process
        const isTableBusy = busy_table.get(kotDetails.table_id);
        if (isTableBusy) {
          responseData.status = 'failure';
          responseData.message = "Bill save is in process. Can't place kot now";
          global.isSaveKOtInProgress = false;
          return responseData;
        }
        hasactivePreviouskot = await connection.KOT.count({
          where: { table_id: kotDetails.table_id, is_active: 1 },
          transaction,
        });

        const doesbillExists = await connection.Bill.findOne({
          where: {
            table_id: kotDetails.table_id,
            order_state: {
              [connection.Sequelize.Op.in]: [
                'pending',
                'food ready',
                'dispatched',
              ],
            },
          },
          raw: true,
          transaction,
        });
        if (doesbillExists !== null) {
          if (!allowModifyBill) {
            responseData.status = 'failure';
            responseData.message = 'Cannot modify saved bill';
            global.isSaveKOtInProgress = false;
            return responseData;
          }

          await connection.Bill.update(
            {
              isBillModified: 2,
              field2: null,
            },
            {
              where: {
                order_id: doesbillExists.order_id,
              },
              transaction,
            },
          );

          await connection.KOT.update(
            {
              discount_rate: 0,
              discount_title: '',
              discount_type: 0,
              discounted_product_groups: null,
            },
            {
              where: {
                bill_number: doesbillExists.order_id,
              },
              transaction,
            },
          );

          await connection.CoupondiscountHistory.destroy({
            where: {
              order_id: doesbillExists.order_id,
            },
            transaction,
          });
        }
      }

      const { forDinein } = kotDetails;
      const { createTable } = kotDetails;
      const { items } = kotDetails;
      const { printKOT } = kotDetails;
      const { updateAddress, updateCustomerName } = kotDetails;
      const { newCustomerAddress } = kotDetails;
      let updatedCustomer;
      if (updateAddress || updateCustomerName) {
        if (newCustomerAddress) {
          updatedCustomer = await addCustomerWithTransaction(
            {
              name: kotDetails.customer_name,
              phone: kotDetails.customer_mobile,
              address_line1: updateAddress,
              address_line2: '',
              store_id: kotDetails.store_id,
              ...newCustomerAddress,
            },
            transaction,
          );
        } else {
          // if address line 1 is updated then remove other address fields
          updatedCustomer = await addCustomerWithTransaction(
            {
              name: kotDetails.customer_name,
              phone: kotDetails.customer_mobile,
              address_line1: updateAddress,
              address_line2: '',
              store_id: kotDetails.store_id,
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
            },
            transaction,
          );
        }
      }
      responseData.forDinein = forDinein;
      responseData.createTable = createTable;
      const { table_color } = kotDetails;
      const { table_action_flag } = kotDetails;
      const { istakeawaywindowSelected } = kotDetails;
      const { selfOrder } = kotDetails;
      const { tablenameAscustomer } = kotDetails;
      if (tablenameAscustomer) delete kotDetails.tablenameAscustomer;

      if (kotDetails.istakeawaywindowSelected)
        delete kotDetails.istakeawaywindowSelected;
      if (kotDetails.table_color) delete kotDetails.table_color;
      if (kotDetails.table_action_flag) delete kotDetails.table_action_flag;
      if (kotDetails.forDinein) delete kotDetails.forDinein;
      if (kotDetails.createTable) delete kotDetails.createTable;
      if (kotDetails.items) delete kotDetails.items;
      if (kotDetails.printKOT) delete kotDetails.printKOT;
      if (kotDetails.selfOrder) delete kotDetails.selfOrder;
      /**
       * Check if save KOT is called from TA/HD
       */
      if (kotDetails.customer) {
        let { customer } = kotDetails;
        try {
          if (customer.constructor === stringConstructor) {
            customer = safeParseformain(customer);
          }
          if (customer.name || customer.phone) {
            // let checkresultEntity = await addCustomer(customer);
            const checkresultEntity = await addCustomerWithTransaction(
              customer,
              transaction,
            );
            if (checkresultEntity.customer) {
              kotDetails.customer_name = checkresultEntity.customer.name;
              kotDetails.customer_mobile = checkresultEntity.customer.phone;
            }
          }
        } catch (error) {
          console.error(error);
        }
      }
      let nextOrderNumber = 1;
      if (!hasactivePreviouskot) {
        nextOrderNumber = await getResettedordernumberifexist();
        if (global.orderTypeWiseOrderNumber) {
          nextOrderNumber = safeParseformain(nextOrderNumber);
          if (nextOrderNumber && nextOrderNumber[kotDetails.billing_type]) {
            nextOrderNumber = nextOrderNumber[kotDetails.billing_type];
          } else {
            nextOrderNumber = 1;
          }
        }
      } else if (hasactivePreviouskot) {
        const prevKot = await connection.KOT.findOne({
          raw: true,
          where: { table_id: kotDetails.table_id, is_active: 1 },
          transaction,
        });
        if (prevKot && prevKot.extra_details) {
          const extra_details = safeParseformain(prevKot.extra_details);
          nextOrderNumber = extra_details.order_number;
        }
      }
      let updateTablecolor = true;
      if (!forDinein) {
        const { defaultDepartmentid } = kotDetails;
        if (createTable) {
          let nexttakeawayid = 0;
          const nextidResult = await connection.Tempnumbers.findAll({
            raw: true,
            limit: 1,
            attributes: ['takeawaybill_number'],
            where: { id: 1 },
            transaction,
          });

          if (nextidResult && nextidResult.length > 0) {
            nexttakeawayid = nextidResult[0].takeawaybill_number;
          }

          let order_type_flag = 1;
          let tableName;
          if (global.orderTypeWiseOrderNumber) {
            if (istakeawaywindowSelected) {
              tableName = DEFAULT_TAKEAWAY_TABLENAME + nextOrderNumber;
            } else {
              tableName = DEFAULT_HOMED_TABLENAME + nextOrderNumber;
              order_type_flag = 2;
            }
          } else {
            if (istakeawaywindowSelected) {
              tableName = DEFAULT_TAKEAWAY_TABLENAME + nexttakeawayid;
            } else {
              tableName = DEFAULT_HOMED_TABLENAME + nexttakeawayid;
              order_type_flag = 2;
            }
          }

          if (tablenameAscustomer && kotDetails.customer_name) {
            tableName = kotDetails.customer_name;
          }
          let customer_mobile = kotDetails.customer_mobile;
          const tableDetails = {
            table_name: tableName,
            isactive: 1,
            tablenameAscustomer: 1,
            department: defaultDepartmentid,
            order_type_flag,
            table_color,
            table_action_flag,
            store_id: kotDetails.store_id,
            order_state: OFFLINE_ORDERSTATES.PLACED,
            is_pre_order: kotDetails.is_pre_order || 0,
          };
          // if (customer_mobile) {
          //   const extra_details = {
          //     customer_mobile,
          //     customer_name: kotDetails.customer_name
          //   };
          //   Object.assign(tableDetails, { extra_details });
          // }
          if (kotDetails.waiter) {
            tableDetails.waiter = kotDetails.waiter;
            tableDetails.waiter_id = kotDetails.waiter_id;
          }

          const addtableResult = await connection.Table.create(tableDetails, {
            transaction,
          });
          // addtableResult = addtableResult.get({ plain: true })

          if (addtableResult.id) {
            tableDetails.id = addtableResult.id;

            Object.assign(kotDetails, {
              table_id: addtableResult.id,
              table_name: tableDetails.table_name,
            });
          }
          // await connection.Tempnumbers.increment(['takeawaybill_number'], {
          //   by: 1,
          //   where: { id: 1 },
          //   transaction,
          // });
          await fetchAndUpdateTakeawayKotNumber(transaction);
          responseData.tableDetails = tableDetails;
          updateTablecolor = false;
          if (selfOrder) {
            updateTablecolor = true;
          }
        }
      }

      if (kotDetails.remote_kot_id) {
        Object.assign(kotDetails, {
          kot_uniqueid: kotDetails.remote_kot_id,
        });
      } else {
        Object.assign(kotDetails, {
          kot_uniqueid: global.generateId(),
        });
      }

      // if(kotDetails.remotekot){
      //     // connection.KOTItem.findAll(tempkotItem)
      //     const iskotItemPresent = await  connection.KOT.findAll({
      //         where: {
      //             store_id: global.storeDetails.store_id,
      //             // table_id:kotDetails.table_id,
      //             order_id: kotDetails.order_id,
      //             is_active:1
      //         }
      //     });

      //     if(iskotItemPresent){
      //          await  connection.KOT.update({is_active:0},{
      //             where: {
      //                 store_id: global.storeDetails.store_id,
      //                 // table_id:kotDetails.table_id,
      //                 order_id: kotDetails.order_id,
      //                 is_active:1
      //             }
      //         });
      //     }
      // }

      // set date
      Object.assign(kotDetails, {
        kot_date: global.moment().format('YYYY-MM-DD HH:mm:ss'),
        createdDate: global.moment().format('YYYY-MM-DD HH:mm:ss'),
      });
      // check midnight sale is enabled
      if (kotDetails.countMidnightSale) {
        const result = setDateForMidnightOrder();

        if (result) {
          const intime = Date.now();
          const in_time = global.moment(intime).subtract(1, 'days').format('x');
          const { kotPlacedDate } = result;
          Object.assign(kotDetails, {
            createdDate: kotPlacedDate,
            in_time,
            kot_date: kotPlacedDate,
          });
        }
      }

      if (kotDetails.forDinein !== false && kotDetails.billing_type == 2) {
        console.log(
          `Message="Save kot details having issue for billing type" Payload=${JSON.stringify(kotDetails)}`,
        );
        Object.assign(kotDetails, {
          billing_type: 1,
        });
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

      if (hasactivePreviouskot) {
        let extra_details = {};
        if (kotDetails.extra_details) {
          extra_details = { ...kotDetails.extra_details };
        }
        Object.assign(extra_details, {
          kot_state: 'Running KOT',
        });
        kotDetails.extra_details = extra_details;
        isNewKot = false;
      }

      const kotresult = await connection.KOT.create(kotDetails, {
        transaction,
      });

      if (kotresult != undefined && kotresult.kot_id != 0) {
        let insertedKOTid = kotresult.kot_id;
        // items.forEach(async (item) => {
        // eslint-disable-next-line no-restricted-syntax
        const decrementQty = [];
        for (const item of items) {
          if (item.extra_details) {
            Object.assign(item.extra_details, { placedQty: item.quantity });
          } else {
            const extra_details = {
              placedQty: item.quantity,
            };
            item.extra_details = extra_details;
          }
          const tempkotItem = {
            kot_id: kotresult.kot_id,
            item_id: item.item_refid,
            item_name: item.title,
            alternative_title: item.alternative_title,
            item_price: item.amount === 0 ? 0 : Number(item.price),
            quantity: Number(item.quantity),
            amount: Number(item.amount).toFixed(global.ROUNDOFF_UPTO),
            item_tax_name: item.tax_name,
            item_tax_per: item.item_tax_per,
            item_tax_value: Number(
              item.isitemwithOption
                ? item.new_item_tax_value || item.item_tax_value
                : item.item_tax_value,
            ).toFixed(global.ROUNDOFF_UPTO),
            item_tax_method: item.item_tax_method,
            item_is_devidable: item.item_is_devidable,
            createdBy: kotDetails.createdBy,
            user_id: kotDetails.createdBy,
            item_total_tax_value: Number(
              Number(
                (item.isitemwithOption
                  ? item.new_item_tax_value
                  : item.item_tax_value) * item.quantity,
              ).toFixed(global.ROUNDOFF_UPTO),
            ),
            note: item.note ? item.note : null,
            reason: item.reason ? item.reason : null,
            short_code: item.short_code,
            has_options: item.has_options ? item.has_options : 0,
            product_group_id:
              item.product_group_id !== undefined ? item.product_group_id : 0,
            product_group_name: item.product_group_name
              ? item.product_group_name
              : null,
            discounted_price: item.discounted_price
              ? item.discounted_price
              : item.item_price || 0,
            discount_type: item.discount_type,
            discount_rate: item.discount_rate,
            pricebeforeDiscount: item.pricebeforeDiscount
              ? item.pricebeforeDiscount
              : item.item_price || 0,
            modified_discount: item.modified_discount,
            discount: item.pricebeforeDiscount
              ? Number(
                  (
                    (item.pricebeforeDiscount - item.price) *
                    item.quantity
                  ).toFixed(global.ROUNDOFF_UPTO),
                )
              : 0,
            is_complimentary: item.amount === 0,
            kitchen_dept: item.kitchen_dept ? item.kitchen_dept : 0,
            hsn_code: item.hsn_code || null,
            is_open_item: item.is_open_item || item.open_price || 0,
            discount_name: item.discount_name || undefined,
            category_name: item.category_name,
            alternative_category_name: item.alternative_category_name,
            extra_details: item?.extra_details,
          };
          if (item.discounted_items) {
            try {
              let { discounted_items } = item;
              if (discounted_items.constructor === stringConstructor) {
                discounted_items = safeParseformain(discounted_items);
              }
              Object.assign(tempkotItem, {
                discounted_items,
              });
            } catch (error) {
              console.error(error);
            }
          }

          // check midnight sale is on
          if (kotDetails.countMidnightSale) {
            const result = setDateForMidnightOrder();
            if (result) {
              const { kotPlacedDate } = result;
              Object.assign(tempkotItem, {
                start_time: kotPlacedDate,
                modifiedDate: kotPlacedDate,
              });
            }
          }

          if (!tempkotItem.product_group_id) {
            const posItem = global.itemsList.find(
              (o) => Number(o.item_refid) === Number(item.item_refid),
            );
            if (posItem) {
              Object.assign(tempkotItem, {
                product_group_id: posItem.product_group,
                product_group_name:
                  posItem['mpos_productgroup.product_group_name'],
              });
            }
          }
          const itemresultEntity = await connection.KOTItem.create(
            tempkotItem,
            {
              transaction,
            },
          );

          // decrement kot item qty
          if (global.reduceStock && !item.is_open_item) {
            await connection.Item.decrement('current_stock', {
              by: Number(Number(item.quantity).toFixed(global.ROUNDOFF_UPTO)),
              where: { item_refid: item.item_refid },
              transaction,
            });
            const itemQty = await connection.Item.findOne({
              raw: true,
              attributes: ['current_stock'],
              where: { item_refid: item.item_refid },
              transaction,
            });
            decrementQty.push({
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
          if (
            itemresultEntity &&
            item.isitemwithOption &&
            item.addons &&
            item.addons.length > 0
          ) {
            for (addon of item.addons) {
              // .option_type = 0;
              // let option_qty = addon.option_type === 0 ? item.quantity : 1;
              let option_qty = 1;
              if (addon.qty) {
                option_qty = addon.qty;
              }

              const option_total = addon.price * option_qty;
              const option_total_with_tax =
                option_total + addon.option_tax * option_qty;

              const tempaddon = {
                kot_items_id: itemresultEntity.id,
                option_group_name: addon.optionGrptitle,
                option_group_ref_id: addon.opt_grp_ref_ids,
                option_ref_id: addon.ref_id,
                option_name: addon.title,
                option_price: addon.price,
                option_tax_amount: addon.option_tax,
                option_qty,
                option_total,
                option_total_with_tax,
                option_type: addon.option_type,
                item_ref_id: addon.item_ref_id,
                option_id: addon.option_id || addon.option_ref_id,
                extra_details: addon.extra_details,
                alternative_title: addon.alternative_title,
              };
              await connection.KotItemOption.create(tempaddon, { transaction });

              if (global.reduceStock) {
                const posItem = global.itemsList.find(
                  (i) => i.item_refid === addon.option_ref_id,
                );
                if (posItem) {
                  const reduceqty = Number(item.quantity * option_qty);
                  await connection.Item.decrement('current_stock', {
                    by: reduceqty,
                    where: { item_refid: addon.option_ref_id },
                    transaction,
                  });
                  const itemQty = await connection.Item.findOne({
                    raw: true,
                    attributes: ['current_stock'],
                    where: { item_refid: addon.option_ref_id },
                    transaction,
                  });
                  decrementQty.push({
                    item_refid: addon.option_ref_id,
                    qty: reduceqty,
                    quantity: reduceqty,
                    current_stock: itemQty?.current_stock,
                    short_code: posItem.short_code,
                    store_id: global.storeDetails.store_id,
                    changeType: 'SALE',
                  });
                }
              }
            }
          }
          if (
            item.itemlevelCharges &&
            Array.isArray(item.itemlevelCharges) &&
            item.itemlevelCharges.length > 0
          ) {
            addItemlevelkotcharges(
              kotDetails.table_id,
              item.itemlevelCharges,
              tempkotItem.item_name,
              transaction,
            );
          }
        }

        if (global.reduceStock && decrementQty && decrementQty.length) {
          // send event
          const data = {
            decrementQtyItems: decrementQty,
          };
          global.ipcEventEmitter.emit(UPDATE_STOCK_QTY, data);
          // reduceBackendStock
          const result = Object.values(
            decrementQty.reduce((acc, item) => {
              const key = item.item_refid;

              if (!acc[key]) {
                acc[key] = { ...item };
              } else {
                acc[key].qty += item.qty;
                acc[key].quantity += item.quantity;
                acc[key].current_stock = Math.min(
                  acc[key].current_stock,
                  item.current_stock,
                );
              }

              return acc;
            }, {}),
          );
          console.log('result:', result);
          for (let i = 0; i < result.length; i++) {
            addRecordItemStockOutBox(result[i], { transaction });
          }
        }
        // await connection.KOTItem.bulkCreate(kotItems);
        let nextKot;
        if (
          kotDetails.isBarSection == 2 &&
          global.storeDetails.is_bar_section_billing
        ) {
          nextKot = await getbarSectionBillkotifexist({ forKot: true });
        } else {
          nextKot = await getResettedbillkotifexist({ forKot: true });
        }

        if (nextKot) insertedKOTid = nextKot;

        if (updateTablecolor && kotDetails.table_id) {
          const tableUpdateData = {
            table_color,
            table_action_flag,
            order_state: OFFLINE_ORDERSTATES.PLACED,
          };

          if (selfOrder) {
            if (tablenameAscustomer) {
              if (kotDetails.customer_name) {
                tableUpdateData.table_name = `${kotDetails.customer_name}-${insertedKOTid}`;
              } else if (kotDetails.customer_mobile) {
                tableUpdateData.table_name = `${kotDetails.customer_mobile}-${insertedKOTid}`;
              } else {
                tableUpdateData.table_name = `Self Order-${insertedKOTid}`;
              }
            } else {
              tableUpdateData.table_name = `Self Order-${insertedKOTid}`;
            }
            if (responseData.tableDetails) {
              responseData.tableDetails.table_name = tableUpdateData.table_name;
            }
          }
          const tableExtradetails = {};
          if (!hasactivePreviouskot && kotDetails.requestFromOrderHub) {
            Object.assign(tableExtradetails, {
              createdBy: kotDetails.createdBy,
            });
            Object.assign(tableUpdateData, {
              extra_details: tableExtradetails,
            });
            if (responseData.tableDetails) {
              Object.assign(responseData.tableDetails, {
                extra_details: tableExtradetails,
              });
            }
          }
          if (kotDetails.customer_mobile) {
            Object.assign(tableExtradetails, {
              customer_mobile: kotDetails.customer_mobile,
              customer_name: kotDetails.customer_name,
            });
            Object.assign(tableUpdateData, {
              extra_details: tableExtradetails,
            });
            if (responseData.tableDetails) {
              Object.assign(responseData.tableDetails, {
                extra_details: tableExtradetails,
              });
            }
          }

          await connection.Table.update(tableUpdateData, {
            where: {
              id: kotDetails.table_id,
            },
            transaction,
          });
        } else {
          const tableUpdateData = {};
          const tableExtradetails = {};
          if (!hasactivePreviouskot && kotDetails.requestFromOrderHub) {
            Object.assign(tableExtradetails, {
              createdBy: kotDetails.createdBy,
            });
            Object.assign(tableUpdateData, {
              extra_details: tableExtradetails,
            });
            if (responseData.tableDetails) {
              Object.assign(responseData.tableDetails, {
                extra_details: tableExtradetails,
              });
            }
          }
          if (kotDetails.customer_mobile) {
            Object.assign(tableExtradetails, {
              customer_mobile: kotDetails.customer_mobile,
              customer_name: kotDetails.customer_name,
            });
            Object.assign(tableUpdateData, {
              extra_details: tableExtradetails,
            });
            if (responseData.tableDetails) {
              Object.assign(responseData.tableDetails, {
                extra_details: tableExtradetails,
              });
            }
          }

          await connection.Table.update(tableUpdateData, {
            where: {
              id: kotDetails.table_id,
            },
            transaction,
          });
        }
        if (kotDetails.remotekot) {
          responseData.remoteKot = true;
          responseData.order_id = kotDetails.remote_order_id;
          ((responseData.billing_type = kotDetails.billing_type),
            (responseData.remote_kot_id = kotDetails.remote_kot_id));
          ((responseData.items = items),
            (responseData.customerMobile = kotDetails.customer_mobile),
            (responseData.customerName = kotDetails.customer_name),
            (responseData.customer = kotDetails.customer),
            (responseData.note = kotDetails.note));
          // responseData.forDinein=true
        }
        responseData.table_id = kotDetails.table_id;
        responseData.forDinein = forDinein;
        responseData.insertedKOTid = insertedKOTid;
        responseData.order_number = nextOrderNumber;
        responseData.printKOT = printKOT;
        responseData.status = 'success';
        responseData.message = 'KOT Placed';
        responseData.hasactivePreviouskot = hasactivePreviouskot;
        responseData.billing_type = kotDetails.billing_type;
        responseData.saveBill = kotDetails.saveBill;
        responseData.isNewKot = isNewKot;

        if (updatedCustomer && updatedCustomer.customer) {
          responseData.updatedCustomer = updatedCustomer.customer;
        }

        const kotUpdatedata = {
          sendEbillcheck: kotDetails.sendEbillcheck ? 1 : 0,
          showCustomeronbill: kotDetails.showCustomeronbill ? 1 : 0,
          // createdBy: kotDetails.createdBy,
          // kot_number :insertedKOTid,
          sync_status: 0,
        };
        if (kotDetails.customer_mobile) {
          Object.assign(kotUpdatedata, {
            customer_mobile: kotDetails.customer_mobile,
            customer_name: kotDetails.customer_name,
          });
        }
        if (
          kotDetails.isBarSection == 2 &&
          global.storeDetails.is_bar_section_billing
        ) {
          await updateDummyBarkotnumber(kotresult.kot_id, transaction);
        } else {
          await updateDummykotnumber(kotresult.kot_id, transaction);
        }

        if (!hasactivePreviouskot) {
          await fetchAndUpdateOrderNumber(kotDetails, transaction);
        }
        // //check midnight sale is enabled
        // if (kotDetails.countMidnightSale) {
        //   const result = setDateForMidnightOrder();

        //   if (result) {
        //     let intime = Date.now();
        //     let in_time = moment(intime).subtract(1, 'days').format('x');
        //     const { kotPlacedDate } = result;
        //     Object.assign(kotUpdatedata, {
        //       createdDate: kotPlacedDate,
        //       in_time,
        //       kot_date: kotPlacedDate,
        //     });
        //   }
        // }
        await connection.KOT.update(kotUpdatedata, {
          where: { table_id: kotDetails.table_id, is_active: 1 },
          transaction,
        });

        // if (
        //   kotDetails.isBarSection == 2 &&
        //   global.storeDetails.is_bar_section_billing
        // ) {
        //   await connection.Tempnumbers.increment(['barSection_kot_number'], {
        //     by: 1,
        //     where: { id: 1 },
        //   });
        // } else {
        //   await connection.Tempnumbers.increment(['kot_number'], {
        //     by: 1,
        //     where: { id: 1 },
        //   });
        // }
        await fetchAndUpdateKOTNumber(kotDetails, transaction);

        // check if bill is already created
        if (kotDetails.bill_number) {
          await checkifBillissavedforkot({
            bill_number: kotDetails.bill_number,
            table_id: kotDetails.table_id,
            insertedKOTid,
            transaction,
          });
        }
        // await transaction.commit();
        if (kotDetails.customer_mobile) {
          const customer = await connection.Customer.findOne({
            raw: true,
            where: {
              phone: kotDetails.customer_mobile,
              store_id: global.storeDetails.store_id,
            },
          });
          if (customer) {
            kotDetails.customer = customer;
          }
        }
        kotDetails.insertedKOTid = insertedKOTid;
        kotDetails.order_number = nextOrderNumber;
        kotDetails.kot_number = insertedKOTid;
        kotDetails.items = items;
        kotDetails.isNewKot = isNewKot;
        responseData.kotDetails = kotDetails;
        // if kot is placed from captain app and print kot then send event to renderer process to kot print
        if ((kotDetails.isCaptainKot || kotDetails.remotekot) && printKOT) {
          // responseData.kotNote = kotDetails.note;
          if (kotDetails.remotekot) {
            delete kotDetails.createdBy;
          }
          global.mainWindow.webContents.send(PRINT_CSK_KOT, kotDetails);
        }
        global.mainWindow.webContents.send(SET_BUSY_TABLE_DATA, kotDetails);

        sendLivesyncrequest();
      } else {
        responseData.status = 'failure';
        responseData.message = 'Something went wrong';
      }
    } else {
      responseData.status = 'failure';
      responseData.message = 'Something went wrong';
    }
  } catch (error) {
    console.error(error);
    console.error(`Message="Save kot error" Data=`, JSON.stringify(kotDetails));
    responseData.status = 'failure';
    responseData.message = 'Something went wrong';
    global.isSaveKOtInProgress = false;
    if (transaction) await transaction.rollback();
    return responseData;
  } finally {
    global.isSaveKOtInProgress = false;
    await transaction.commit();
  }
  return responseData;
}
async function fetchAndUpdateKOTNumber(kotDetails, transaction) {
  // let transaction;
  try {
    // transaction = await connection.sequelize.transaction();

    // Fetch and lock the temp number row
    const tempNumber = await connection.Tempnumbers.findOne({
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (
      kotDetails.isBarSection == 2 &&
      global.storeDetails.is_bar_section_billing
    ) {
      await tempNumber.increment(['barSection_kot_number'], {
        by: 1,
        where: { id: 1 },
        transaction,
      });
    } else {
      await tempNumber.increment(['kot_number'], {
        by: 1,
        where: { id: 1 },
        transaction,
      });
    }

    // Commit the transaction
    // await transaction.commit();

    return tempNumber;
  } catch (error) {
    // Rollback the transaction if there's an error
    if (transaction) await transaction.rollback();
    throw error;
  }
}

async function fetchAndUpdateTakeawayKotNumber(transaction) {
  try {
    // transaction = await connection.sequelize.transaction();

    // Fetch and lock the temp number row
    const tempNumber = await connection.Tempnumbers.findOne({
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    await tempNumber.increment(['takeawaybill_number'], {
      by: 1,
      where: { id: 1 },
      transaction,
    });

    // Commit the transaction
    // await transaction.commit();

    return tempNumber;
  } catch (error) {
    // Rollback the transaction if there's an error
    if (transaction) await transaction.rollback();
    throw error;
  }
}
async function checkIfKOTIsRunning() {
  const isBillRunning = await connection.KOT.findAll({
    where: {
      store_id: global.storeDetails.store_id,
      is_active: 1,
    },
  });

  return isBillRunning;
}

async function checkBillIsRunning() {
  try {
    const isBillRunning = await connection.Bill.findAll({
      attributes: ['order_id', 'bill_number'],
      where: {
        store_id: global.storeDetails.store_id,
        order_state: 'pending',
      },
    });
    console.log('isBillRunning::', isBillRunning);

    return isBillRunning;
  } catch (error) {
    console.error(
      `Message="Error while checking bill is running" Error=`,
      error,
    );
  }
}

async function checkifBillissavedforkot({
  bill_number,
  table_id,
  insertedKOTid,
  transaction,
}) {
  try {
    const doeskothassavedBill = await KOT.count({
      where: {
        bill_number,
        table_id,
        is_active: 1,
      },
      transaction,
    });
    if (doeskothassavedBill) {
      const savedBilldetails = await Bill.findOne({
        where: {
          order_id: bill_number,
        },
        transaction,
      });

      // Remove all the order related data
      await KOTCharges.destroy({
        where: { table_id, is_active: 1 },
        transaction,
      });
      await BillCharges.destroy({
        where: { order_id: bill_number },
        transaction,
      });

      await KOT.update(
        {
          discount_rate: 0,
          discount_type: 0,
          discounted_product_groups: null,
          couponDisount: 0,
          couponDisounttype: 0,
          coupon: null,
          custom_bill_number: savedBilldetails.custom_bill_number,
          field1: 0,
          order_id: savedBilldetails.bill_number,
          sync_status: 0,
        },
        {
          where: { table_id, is_active: 1 },
          transaction,
        },
      );

      const savedItemslist = await getRunningkotitemsdetails({
        table_id,
        kot_id: insertedKOTid,
      });

      const saveitemResult = await saveBillitems(
        bill_number,
        savedItemslist,
        savedBilldetails.id,
        transaction,
      );

      await Bill.update(
        {
          quantity:
            (saveitemResult.quantity || 1) + Number(savedBilldetails.quantity),
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
          where: { order_id: bill_number },
          transaction,
        },
      );
      await Duepayments.destroy({
        where: {
          order_id: bill_number,
        },
        transaction,
      });
    }
  } catch (error) {}
}

async function getResettedbillkotifexist({ forKot, transaction }) {
  if (
    (global.storeDetails &&
      global.storeDetails.resetBillAfterDays &&
      isNumber(global.storeDetails.resetBillAfterDays)) ||
    (global.storeDetails.reset_kot_indays &&
      isNumber(global.storeDetails.reset_kot_indays))
  ) {
    const data = await connection.Tempnumbers.findOne({
      attributes: ['kot_number', 'bill_number'],
      raw: true,
      where: { id: 1 },
      transaction,
    });
    if (data && data.kot_number) {
      return forKot ? data.kot_number : data.bill_number;
    }
  }
}

// this method is for bar section kot number

async function getbarSectionBillkotifexist({ forKot }) {
  if (
    (global.storeDetails &&
      global.storeDetails.resetBillAfterDays &&
      isNumber(global.storeDetails.resetBillAfterDays)) ||
    (global.storeDetails.reset_kot_indays &&
      isNumber(global.storeDetails.reset_kot_indays))
  ) {
    const data = await connection.Tempnumbers.findOne({
      attributes: ['barSection_kot_number', 'barSection_bill_number'],
      raw: true,
      where: { id: 1 },
    });
    if (data && data.barSection_kot_number) {
      return forKot ? data.barSection_kot_number : data.barSection_bill_number;
    }
  }
}

// this method is for seperate bill numbers for onliner orders
async function getResettedOnlinebill({ forKot }) {
  if (
    (global.storeDetails &&
      global.storeDetails.resetBillAfterDays &&
      isNumber(global.storeDetails.resetBillAfterDays)) ||
    (global.storeDetails.reset_kot_indays &&
      isNumber(global.storeDetails.reset_kot_indays))
  ) {
    const data = await connection.Tempnumbers.findOne({
      attributes: ['kot_number', 'secondary_bill_number'],
      raw: true,
      where: { id: 1 },
    });
    return data.secondary_bill_number;
  }
}

// get order number
async function getResettedordernumberifexist() {
  let extra_info;
  if (global.storeDetails) {
    extra_info = safeParseformain(global.storeDetails.extra_info);
  }
  if (
    extra_info &&
    extra_info.reset_order_no_in_days &&
    isNumber(extra_info.reset_order_no_in_days)
  ) {
    if (global.orderTypeWiseOrderNumber) {
      const data = await connection.Tempnumbers.findOne({
        attributes: ['order_type_wise_order_number'],
        raw: true,
        where: { id: 1 },
      });
      if (data && data.order_type_wise_order_number) {
        return data.order_type_wise_order_number;
      }
    } else {
      const data = await connection.Tempnumbers.findOne({
        attributes: ['order_number'],
        raw: true,
        where: { id: 1 },
      });
      if (data && data.order_number) {
        return data.order_number;
      }
    }
  }
}

async function doespaymenttotalMatch(order_id) {
  let totalMatches = true;
  try {
    const billDetails = await connection.Bill.findOne({
      attributes: ['order_total', 'due_payment', 'hasDuepayment'],
      where: {
        order_id,
      },
      raw: true,
    });

    const payDetails = await connection.BillPayment.findOne({
      attributes: [
        [
          connection.Sequelize.fn('sum', connection.Sequelize.col('amount')),
          'amount',
        ],
      ],
      where: {
        order_id,
      },
      group: ['order_id'],
      raw: true,
    });
    if (billDetails && payDetails) {
      const difference = Math.abs(
        (payDetails?.amount || 0) - billDetails.order_total,
      );
      if (difference > 1) {
        totalMatches = false;
      } else {
        totalMatches = true;
      }

      // Check if the due payment is available
      // If yes then send true
      if (
        !totalMatches &&
        billDetails.due_payment > 0 &&
        billDetails.hasDuepayment
      ) {
        totalMatches = true;
      }
    }
  } catch (error) {
    console.error(error);
  }
  return totalMatches;
}

async function updateStatusOfKotItems(params) {
  // if order is cancelled then cancel all items of that order

  // get kot_id of order
  const kots = await KOT.findAll({
    raw: true,
    attributes: ['kot_id'],
    where: {
      bill_number: params.order_id,
    },
  });

  const kot_ids = kots.map((kot) => kot.kot_id);
  const kotItems = await connection.KOTItem.findAll({
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
    await connection.KOTItem.create(item);
  }
  await connection.KOTItem.update(
    {
      status: 3,
      reason: 'Order Cancelled',
    },
    {
      where: {
        kot_id: {
          [Sequelize.Op.in]: kot_ids,
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
    },
  );

  await KOT.update(
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

/**
 * Settle's the bill
 * @param {Bill details to update} billData
 */
async function settleBill(billData) {
  const responseData = {};
  if (global.isLoadMenuInProgress) {
    responseData.status = 'failure';
    responseData.message =
      'Load menu is in process. Please try after some time';
    return responseData;
  }
  try {
    const { billupdateData } = billData;
    const { discountHistory } = billData;
    const { paymentDetails } = billData;

    if (billData && billupdateData) {
      console.log(
        `Message="Settle bill process" order_id=${billData.order_id}`,
      );
      const doesbillExists = await connection.Bill.findOne({
        where: {
          table_id: billData.table_id,
          // order_state: 'pending',
          order_state: {
            [connection.Sequelize.Op.in]: [
              'pending',
              'food ready',
              'dispatched',
            ],
          },
        },
        raw: true,
      });

      if (doesbillExists === null) {
        responseData.status = 'failure';
        responseData.message = 'No such bill.Please refresh the window';
        return responseData;
      }

      // compare charges from order table and chares table
      const billCharges = await connection.BillCharges.findAll({
        raw: true,
        attributes: ['value'],
        where: {
          order_id: billData.order_id,
          status_flag: 0,
        },
      });

      if (billCharges && billCharges.length) {
        let totalCharges = 0;
        billCharges.forEach((charge) => {
          totalCharges += Number(charge.value);
        });

        const orderCharges = await connection.Bill.findOne({
          raw: true,
          attributes: ['order_level_total_charges'],
          where: {
            order_id: billData.order_id,
          },
        });
        if (
          totalCharges &&
          orderCharges &&
          orderCharges.order_level_total_charges
        ) {
          if (
            Math.ceil(Number(totalCharges)) !==
            Math.ceil(Number(orderCharges.order_level_total_charges))
          ) {
            console.log(
              `Messgae="Charges are not matching for order_id=${billData.order_id}"`,
            );
            if (billCharges.length === 1) {
              await connection.BillCharges.update(
                {
                  value: orderCharges.order_level_total_charges,
                },
                {
                  where: {
                    order_id: billData.order_id,
                  },
                },
              );
            } else {
              responseData.status = 'failure';
              responseData.message = 'Please re-apply Charges and settle bill';
              return responseData;
            }
          }
        }
      }

      if (
        allowModifyBill &&
        doesbillExists &&
        doesbillExists.isBillModified == 2
      ) {
        responseData.status = 'failure';
        responseData.message = 'Please save bill first';
        return responseData;
      }

      // if discount is applied then update tax of order child
      if (
        ((billupdateData.discount || billupdateData.couponDisounttotal) &&
          billupdateData.orderItems &&
          !billupdateData.issectionwisebilling) ||
        (billupdateData.issectionwisebilling &&
          billData.discountHistory &&
          billData.discountHistory.length)
      ) {
        try {
          billupdateData.orderItems.forEach(async (item) => {
            const result = await connection.BillItem.update(
              {
                tax_value: Number(
                  Number(item.item_tax_value).toFixed(global.ROUNDOFF_UPTO),
                ),
                total_with_tax: Number(
                  (
                    Number(item.amount) +
                    item.item_tax_value * item.quantity
                  ).toFixed(global.ROUNDOFF_UPTO),
                ),
                total: item.total
                  ? Number(Number(item.total).toFixed(3))
                  : Number(Number(item.amount).toFixed(3)),
              },
              {
                where: {
                  item_id: String(item.item_id),
                  orderMasterId: billData.order_id,
                  title: item.title,
                  price: item.item_price,
                },
              },
            );
          });
        } catch (error) {
          console.error(error);
        }
      }
      let item_level_total_discount = 0;
      if (
        billupdateData &&
        billupdateData.orderItems &&
        billupdateData.orderItems.length
      ) {
        billupdateData.orderItems.forEach((item) => {
          if (item.discount) {
            item_level_total_discount += item.discount;
          }
        });
      }
      Object.assign(billupdateData, {
        sync_status: 0,
        item_level_total_discount,
      });

      // get intime of first kot for that particular table
      const intime = await connection.KOT.findOne({
        where: {
          table_id: billData.table_id,
          is_active: 1,
        },
        limit: 1,
        raw: true,
      });

      // intime and outtime for order
      const { in_time } = intime;
      const outtime = Date.now();
      Object.assign(billupdateData, { intime: in_time, outtime });

      // check for midnight sale
      if (billupdateData.countMidnightSale) {
        const result = setDateForMidnightOrder();
        if (result) {
          const { orderDate, created_time } = result;
          Object.assign(billupdateData, {
            my_order_date: orderDate,
            created_time,
          });
          const out_time = moment(outtime).subtract(1, 'days').format('x');
          Object.assign(billupdateData, { outtime: out_time });
        }
      }

      if (
        discountHistory &&
        Array.isArray(discountHistory) &&
        discountHistory.length > 0
      ) {
        Object.assign(billData.billupdateData.extra_details, {
          discountHistory: billData.discountHistory,
        });
        Object.assign(billupdateData, {
          extra_details: billData.billupdateData.extra_details,
        });
      }

      console.log(
        `Message="Settle bill data", order_state=${billupdateData.order_state} order_id=${billData.order_id}`,
      );
      await connection.Bill.update(billupdateData, {
        where: { order_id: billData.order_id },
      });

      if (billupdateData.order_state === 'cancelled') {
        updateStatusOfKotItems({ order_id: billData.order_id });
      }
      if (
        discountHistory &&
        Array.isArray(discountHistory) &&
        discountHistory.length > 0
      ) {
        try {
          // find discount history
          discountHistory.forEach(async (discount) => {
            await connection.SectionwiseDiscounthistory.destroy({
              where: {
                order_id: discount.order_id,
              },
            });
          });
          await connection.SectionwiseDiscounthistory.bulkCreate(
            discountHistory,
          );
        } catch (error) {
          console.error(error);
        }
      }
      if (paymentDetails) {
        await addPaymentWithoutTransaction(paymentDetails);
      }
    }

    // check saved bill total
    const paymentMatches = await doespaymenttotalMatch(billData.order_id);

    if (!paymentMatches) {
      console.log(
        `Message="Payment and order total not matching for order id="${billData.order_id}`,
      );
      await connection.Bill.update(
        {
          order_state: 'pending',
        },
        {
          where: { order_id: billData.order_id },
        },
      );

      responseData.status = 'failure';
      responseData.errorMessage = 'PaymentNotMatch';
      responseData.message =
        'Payment and total does not match. Please select payment again';
      return responseData;
    }
    const kotIDs = await connection.KOT.findAll({
      attributes: ['kot_id'],
      where: { table_id: billData.table_id, is_active: 1 },
    });

    await connection.KOT.update(
      { is_active: 0, sync_status: 0, status: 5 },
      {
        where: { table_id: billData.table_id, is_active: 1 },
      },
    );

    await connection.KOTCharges.destroy({
      where: { table_id: billData.table_id, is_active: 1 },
    });

    await connection.KOTItemcharges.destroy({
      where: { table_id: billData.table_id },
    });

    await connection.Table.update(
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
      await connection.PreOrder.update(
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

    // if table having reservation then fulfill it
    if (billData.reservation_id) {
      await connection.TableReservation.update(
        {
          status: 'fulfilled',
        },
        {
          where: {
            reservation_id: billData.reservation_id,
          },
        },
      );
    }

    if (billData.order_state === OrderState.FREE) {
      await connection.BillPayment.destroy({
        where: {
          order_id: billData.order_id,
        },
      });
    }

    responseData.order_state = billData.order_state;
    responseData.order_type_flag = billData.order_type_flag;
    responseData.status = 'success';
    responseData.table_id = billData.table_id;
    responseData.order_id = billData.order_id;
    responseData.printBill = billData.printBill;
    responseData.printBillOnBothSide = billData.printBillOnBothSide;
    responseData.printWidth = billData.printWidth;
    responseData.socketUserId = billData.socketUserId;
    responseData.cskPrintEvent = billData.cskPrintEvent;
    responseData.sendImageToCSK = billData.sendImageToCSK;
    responseData.isRequestFromCsk = billData.isRequestFromCsk;

    responseData.kotIDs = kotIDs;
    // delete table if it is a TA/HD
    if (
      billData.order_type_flag !== undefined &&
      [TAKEAWAY_FLAG_ID, HOMED_FLAG_ID, VIRTUALTABLE_FLAG_ID].includes(
        billData.order_type_flag,
      )
    ) {
      try {
        const table = await connection.Table.findOne({
          raw: true,
          where: {
            id: billData.table_id,
          },
        });
        if (table && table.order_type_flag !== 0) {
          console.log(`Message="Destroy table" table_id=${billData.table_id}`);
          await connection.Table.destroy({
            where: { id: billData.table_id },
          });
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (
      billupdateData.extra_details &&
      billupdateData.extra_details.rewardDiscount &&
      billupdateData.order_state === OrderState.FULFILLED
    ) {
      updateRewardhistory({
        order_id: billData.order_id,
        status: 'completed',
      });
    }
    if (tally_integration) {
      generateTallyXML(billData.order_id);
    }
    sendLivesyncrequest(true);
  } catch (error) {
    console.error(error);
    responseData.status = 'failure';
  }
  return responseData;
}

async function addPayment(paymentDetails, transaction) {
  try {
    console.log(`Message='addPayment paymentDetails='`, paymentDetails);
    const isPaymentAdded = await connection.BillPayment.findOne({
      where: {
        order_id: paymentDetails.order_id,
      },
      transaction,
    });
    if (isPaymentAdded) {
      await connection.BillPayment.destroy({
        where: {
          order_id: paymentDetails.order_id,
        },
        transaction,
      });
    }

    const addpayResult = await connection.BillPayment.addPayment(
      paymentDetails,
      transaction,
    );
    return addpayResult;
  } catch (error) {
    console.error(
      `Message="Add payment failed error" Payload=${JSON.stringify(paymentDetails)} Error=${error}`,
    );
  }
}

async function addPaymentWithoutTransaction(paymentDetails) {
  try {
    const isPaymentAdded = await connection.BillPayment.findOne({
      where: {
        order_id: paymentDetails.order_id,
      },
    });
    if (isPaymentAdded) {
      await connection.BillPayment.destroy({
        where: {
          order_id: paymentDetails.order_id,
        },
      });
    }

    const addpayResult =
      await connection.BillPayment.addPayment(paymentDetails);
    return addpayResult;
  } catch (error) {
    console.error(
      `Message="Add payment failed error" Payload=${JSON.stringify(paymentDetails)} Error=${error}`,
    );
  }
}
/**
 * Transfers the KOT table to another table
 * @param {Change table data} changeTabledata
 */
async function changeTableforkot(changeTabledata) {
  const response = { status: 200, message: '' };
  try {
    const { table_id, desttable_id } = changeTabledata;
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

    if (!changeTabledata.isBillTableempty) {
      if (table_id != undefined && desttable_id != undefined) {
        // get items of that kot to print
        const items = await connection.KOTItem.findAll({
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
          raw: true,
        });

        const kots = await connection.KOT.findAll({
          raw: true,
          attributes: ['kot_id', 'kot_number'],
          where: {
            table_id,
            is_active: 1,
          },
        });
        const kot_numbers = kots.map((kot) => kot.kot_number);

        const data = {
          from_table_name: changeTabledata.from_table_name,
          to_table_name: changeTabledata.table_name,
          items,
          order_type_flag: changeTabledata.order_type_flag,
          table_id,
          desttable_id,
          kot_numbers,
          billing_type: changeTabledata.destTableOrderFlag,
        };

        response.data = data;

        let extra_details = {};

        const activeKot = await connection.KOT.findOne({
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
        hasactivePreviouskot = await connection.KOT.count({
          where: { table_id: desttable_id, is_active: 1 },
        });
        if (hasactivePreviouskot) {
          Object.assign(extra_details, {
            kot_state: 'Running KOT',
          });
        }

        // if billing type wise order type then only update order number
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
            const prevKot = await connection.KOT.findOne({
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
          table_name: changeTabledata.table_name || '',
          sync_status: 0,
          billing_type: changeTabledata.destTableOrderFlag,
          extra_details,
        };

        if (changeTabledata.createdBy) {
          Object.assign(kotUpdateData, {
            createdBy: changeTabledata.createdBy,
          });
        }

        await connection.KOT.update(kotUpdateData, {
          where: {
            table_id,
            is_active: 1,
          },
        });

        // multipricing
        if (selectedItems && selectedItems.length) {
          const kot_ids = kots.map((kot) => kot.kot_id);
          await connection.KOTItem.destroy({
            where: {
              kot_id: {
                [connection.Sequelize.Op.in]: kot_ids,
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
            item.id = item.kot_items_id || item.kot_item_id;
            item.item_name = item.title;
            if (changeTabledata.createdBy) {
              Object.assign(item, {
                createdBy: changeTabledata.createdBy,
              });
            }
            if (item.amount === 0) {
              item.is_complimentary = 1;
            }
            await connection.KOTItem.create(item);
            await connection.KOTItemcharges.update(
              { table_id: changeTabledata.desttable_id },
              {
                where: {
                  table_id: changeTabledata.table_id,
                  itemtitle: {
                    [Op.like]: `%${item.title}%`,
                  },
                },
              },
            );

            // for charges billing type is different eg for quickbill = 1, dinein = 2, pickup = 3, delivery = 4
            let chargeBillingType = 0;
            switch (changeTabledata.destTableOrderFlag) {
              case 1:
                chargeBillingType = '2';
                break;
              case 2:
                chargeBillingType = '3';
                break;
              case 3:
                chargeBillingType = '4';
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
            await connection.KOTItemcharges.destroy({
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
        await connection.Table.update(
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
      }
    }

    await connection.Table.update(
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
      await connection.Table.destroy({
        where: {
          id: table_id,
        },
      });
    }
    if (!hasactivePreviouskot && global.orderTypeWiseOrderNumber) {
      const params = {
        billing_type: changeTabledata.destTableOrderFlag,
      };
      await fetchAndUpdateOrderNumberWithoutTransaction(params);
    }
    sendLivesyncrequest();
    response.message = 'success';
    response.status = 200;
    return response;
  } catch (error) {
    console.error(error);
  }
  response.message = 'failure';
  response.status = 400;
  return response;
}
/**
 * save bill
 * @param {bill details} billData
 */
async function saveBill(billData) {
  const responseData = {};
  let transaction;
  if (global.isLoadMenuInProgress) {
    responseData.status = 'failure';
    responseData.message =
      'Load menu is in process. Please try after some time';
    return responseData;
  }
  try {
    transaction = await connection.sequelize.transaction();

    if (billData) {
      const { billDetails } = billData;
      busy_table.set(billDetails.table_id, true);
      global.isBillsaveinprocess = true;
      const { items } = billData;
      const { charges } = billData;
      const { paymentDetails } = billData;
      const { discountHistory } = billData;
      let doesbillExists;

      // console.log('save bill data in main process::', billData);
      responseData.printBill = billData.printBill;

      // section validation should work only dinein order
      if (
        global.storeDetails.is_bar_section_billing &&
        global.allTables &&
        global.allTables.length &&
        billDetails.billing_type &&
        billDetails.billing_type === 1
      ) {
        // check section of table
        const table = global.allTables.find(
          (table) => table.id === Number(billDetails.table_id),
        );

        if (
          table &&
          table['mpos_department.section'] !== billDetails.isBarSection
        ) {
          console.log(
            `Message="Table department section not matching" Table Section=${table['mpos_department.section']} billdetails sections=${billDetails.isBarSection}`,
          );
          responseData.status = 'failure';
          responseData.message = 'Table department section not matching';
          return responseData;
        }
      }

      // if bill is of pickup or delivery and getting section 2 (bar section) then set it to food section
      if (billDetails.billing_type !== 1 && billDetails.isBarSection === 2) {
        Object.assign(billDetails, {
          isBarSection: 1,
        });

        if (billDetails.extra_details) {
          Object.assign(billDetails.extra_details, {
            isBarSection: false,
          });
        }
      }

      let nextOrderNumber;
      // let find count of qty
      if (billDetails?.table_id && items && items.length) {
        const activekots = await connection.KOT.findAll({
          attributes: [
            'kot_id',
            'extra_details',
            'kot_number',
            'actual_in_time',
          ],
          raw: true,
          where: { table_id: billDetails.table_id, is_active: 1 },
          transaction,
        });

        // get order_number from kot
        if (activekots && activekots.length && activekots[0].extra_details) {
          let extra_details = safeParseformain(activekots[0].extra_details);
          nextOrderNumber = extra_details.order_number;
          const kot_numbers = [];
          activekots.map((kot) => {
            kot_numbers.push(kot.kot_number);
          });

          if (
            kot_numbers &&
            kot_numbers.length &&
            billDetails &&
            billDetails.extra_details
          ) {
            Object.assign(billDetails.extra_details, {
              ...billDetails.extra_details,
              kot_numbers,
              kotcreatedAt: activekots[0].actual_in_time,
            });
          }
        }

        const outputArray = activekots.map((obj) => obj.kot_id);

        const activeKotQtyCount = await connection.KOTItem.findAll({
          raw: true,
          attributes: [
            [
              connection.Sequelize.fn(
                'sum',
                connection.Sequelize.col('quantity'),
              ),
              'total_qty',
            ],
          ],
          where: {
            kot_id: {
              [connection.Sequelize.Op.in]: outputArray,
            },
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
          transaction,
        });

        const billItemsQty = items.reduce((sum, obj) => sum + obj.quantity, 0);
        if (
          Math.ceil(Number(activeKotQtyCount[0].total_qty)) !==
          Math.ceil(Number(billItemsQty.toFixed(global.ROUNDOFF_UPTO)))
        ) {
          responseData.status = 'failure';
          responseData.msg = 'Item mismatch';
          responseData.message =
            'Item quantiy not matching. Please click on table again and save bill';
          return responseData;
        }
      }

      if (billDetails.table_id) {
        doesbillExists = await connection.Bill.findOne({
          where: {
            table_id: billDetails.table_id,
            order_state: {
              [connection.Sequelize.Op.in]: [
                'pending',
                'food ready',
                'dispatched',
              ],
            },
          },
          raw: true,
          transaction,
        });
        if (doesbillExists) {
          if (!allowModifyBill) {
            responseData.status = 'failure';
            responseData.message = 'Bill is running on this table';
            responseData.order_type_flag = billData.order_type_flag;
            return responseData;
          }
          // delete all bill realted details
          console.log(
            `Message="Deleting order details. Modify bill after save" OrderID="${doesbillExists.order_id}"`,
          );
          await deleteOrderById(doesbillExists, billDetails, transaction);
        }
      }

      if (doesbillExists && allowModifyBill) {
        billDetails.order_id = doesbillExists.order_id;
        if (paymentDetails) {
          paymentDetails.order_id = doesbillExists.order_id;
        }
        // billDetails.cust_paid_amount = billDetails.order_total;
        Object.assign(billDetails.extra_details, {
          isModifiedBill: true,
        });
      }

      if (!billDetails.persons) billDetails.persons = 1;
      if (paymentDetails && Object.values(paymentDetails).length) {
        await addPayment(paymentDetails, transaction);
      }

      if (
        billDetails.isBarSection == 2 &&
        global.storeDetails.is_bar_section_billing
      ) {
        Object.assign(billDetails, {
          bill_prefix_for: BILL_PREFIX_FOR.BAR_SECTION_BILLING,
        });
      } else {
        Object.assign(billDetails, {
          bill_prefix_for: BILL_PREFIX_FOR.NORMAL_BILLING,
        });
      }
      // update order_id reservation table
      if (billDetails.reservation_id) {
        await connection.TableReservation.update(
          {
            order_id: billDetails.order_id,
          },
          {
            where: {
              reservation_id: billDetails.reservation_id,
            },
            transaction,
          },
        );
      }

      // add MITI date in extra_details for nepal customers
      if (global.storeDetails.country == 'Nepal') {
        const date = new NepaliDate(new Date()).format('YYYY-MM-DD');
        const time = moment().format('HH:mm:ss');
        const dateTime = `${date} ${time}`;
        const nepaliDate = moment(dateTime).format('x');
        Object.assign(billData.billDetails.extra_details, {
          miti_date: nepaliDate,
        });
      }

      // find and add previous order id in extra_details
      const prevOrder_id = await connection.Bill.findOne({
        raw: true,
        attributes: ['order_id'],
        order: [['id', 'DESC']],
        where: {
          store_id: global.storeDetails.store_id,
        },
        transaction,
      });

      if (prevOrder_id) {
        Object.assign(billDetails.extra_details, {
          previous_order_id: prevOrder_id.order_id,
        });
      }
      if (global.menu_id) {
        Object.assign(billDetails, {
          menu_id: global.menu_id,
        });
      }

      Object.assign(billDetails, {
        app_source: 'atlantic_pos',
      });
      const billResult = await connection.Bill.create(billDetails, {
        transaction,
      });

      if (billResult != undefined && billResult.id != 0) {
        let insertedBillno = billResult.id;
        let quantity = 0;
        const saveitemResult = await saveBillitems(
          billDetails.order_id,
          items,
          insertedBillno,
          transaction,
        );
        if (saveitemResult) {
          quantity = saveitemResult.quantity;
        }

        let nextBill;

        if (
          billDetails.isBarSection == 2 &&
          global.storeDetails.is_bar_section_billing
        ) {
          nextBill = await getbarSectionBillkotifexist({ forKot: false });
        } else {
          nextBill = await getResettedbillkotifexist({ forKot: false });
        }
        if (nextBill) insertedBillno = nextBill;

        // let nextOrderNumber = await getResettedordernumberifexist();
        // if (global.orderTypeWiseOrderNumber) {
        //   nextOrderNumber = safeParseformain(nextOrderNumber);
        //   if (nextOrderNumber && nextOrderNumber[billDetails.billing_type]) {
        //     nextOrderNumber = nextOrderNumber[billDetails.billing_type];
        //   } else {
        //     nextOrderNumber = 1;
        //   }
        // }

        if (allowModifyBill && doesbillExists && doesbillExists.bill_number) {
          insertedBillno = doesbillExists.bill_number;
          created_time = doesbillExists.created_time;
          const extra_details = safeParseformain(doesbillExists.extra_details);
          if (extra_details.order_number) {
            nextOrderNumber = extra_details.order_number;
          }
        }
        const kotdetailsUpdatedata = {
          bill_number: billDetails.order_id,
          order_id: insertedBillno,
          // sync_status: 0,
        };

        let padBillNumber = insertedBillno;
        if (padBillNumber && bill_number_length) {
          padBillNumber = pad(insertedBillno, bill_number_length);
        }

        if (
          billDetails.isBarSection == 2 &&
          global.storeDetails.is_bar_section_billing &&
          global.storeDetails.bar_bill_prefix
        ) {
          Object.assign(kotdetailsUpdatedata, {
            custom_bill_number: `${global.storeDetails.bar_bill_prefix}${padBillNumber}`,
          });
        } else if (global.storeDetails.bill_number_prefix) {
          Object.assign(kotdetailsUpdatedata, {
            custom_bill_number: `${global.storeDetails.bill_number_prefix}${padBillNumber}`,
          });
        }
        await connection.KOT.update(kotdetailsUpdatedata, {
          where: {
            table_id: billDetails.table_id,
            is_active: 1,
          },
          transaction,
        });
        const billnumberUpdatedata = {
          bill_number: insertedBillno,
          quantity,
          sync_status: 0,
          isBillModified: 1,
        };

        if (nextOrderNumber && billDetails && billDetails.extra_details) {
          Object.assign(billDetails.extra_details, {
            ...billDetails.extra_details,
            order_number: nextOrderNumber,
          });

          Object.assign(billnumberUpdatedata, {
            extra_details: {
              ...billDetails.extra_details,
              order_number: nextOrderNumber,
            },
          });
          responseData.extra_details = billDetails.extra_details;
        }

        if (allowModifyBill && doesbillExists && doesbillExists.bill_number) {
          Object.assign(billnumberUpdatedata, {
            created_time: doesbillExists.created_time,
          });
        }

        if (
          billDetails.isBarSection == 2 &&
          global.storeDetails.is_bar_section_billing &&
          global.storeDetails.bar_bill_prefix
        ) {
          Object.assign(billnumberUpdatedata, {
            custom_bill_number: `${global.storeDetails.bar_bill_prefix}${padBillNumber}`,
          });
        } else if (global.storeDetails.bill_number_prefix) {
          Object.assign(billnumberUpdatedata, {
            custom_bill_number: `${global.storeDetails.bill_number_prefix}${padBillNumber}`,
          });
        }
        await connection.Bill.update(billnumberUpdatedata, {
          where: {
            id: billResult.id,
          },
          transaction,
        });

        if (billDetails.is_pre_order && billDetails.phone) {
          await connection.PreOrder.update(
            {
              order_id: billDetails.order_id,
            },
            {
              where: {
                customer_mobile: billDetails.phone,
                status: 'created',
                table_id: billDetails.table_id,
                store_id: billDetails.store_id,
              },
              transaction,
            },
          );
        }
        await connection.Table.update(
          {
            table_color: billData.table_color,
            table_action_flag: billData.table_action_flag,
          },
          {
            where: {
              id: billDetails.table_id,
            },
            transaction,
          },
        );

        if (charges && charges.length > 0) {
          await connection.KOTCharges.destroy({
            where: { table_id: billDetails.table_id, is_active: 1 },
            transaction,
          });

          charges.forEach(async (element) => {
            const data = {
              order_id: billDetails.order_id,
              title: element.title,
              amount: element.amount,
              value: element.amounttoAdd,
              is_default_flag: element.is_default,
              order_billing_flag: element.billing_flag,
              per_or_fixed: element.per_or_fixed,
              charge_id: element.charge_id,
              is_tax_included: element.is_tax_included,
              calculated_tax: element.calculated_tax,
              tax_divided: element.tax_divided,
              tax_title: element.tax_title,
              tax_amount: element.tax_amount,
              extra_details: safeParseformain(element.extra_details),
            };

            try {
              await connection.BillCharges.create(data);

              delete data.value;
              data.table_id = billDetails.table_id;
              if (data.calculated_tax) delete data.calculated_tax;
              Object.assign(data, {
                is_tax_applicable: element.is_tax_applicable,
                tax_amount: element.tax_amount,
              });

              await connection.KOTCharges.create(data);
            } catch (error) {
              console.error(error);
            }
          });
        }

        if (billData.printBill) {
          responseData.items = items;
        }

        if (billData.couponDisounthistorydata) {
          await addCouponhistory(
            billData.couponDisounthistorydata,
            transaction,
          );
        }

        if (
          discountHistory &&
          Array.isArray(discountHistory) &&
          discountHistory.length > 0
        ) {
          try {
            await connection.SectionwiseDiscounthistory.bulkCreate(
              discountHistory,
              { transaction },
            );
          } catch (error) {}
        }

        if (!doesbillExists) {
          // if (
          //   billDetails.isBarSection == 2 &&
          //   global.storeDetails.is_bar_section_billing
          // ) {
          //   await connection.Tempnumbers.increment(
          //     ['barSection_bill_number', 'order_number'],
          //     { by: 1, where: { id: 1 } },
          //   );
          // } else {
          //   await connection.Tempnumbers.increment(
          //     ['bill_number', 'order_number'],
          //     { by: 1, where: { id: 1 } },
          //   );
          // }
          await fetchAndUpdateBillNumber(billDetails, transaction);
        }
        // await transaction.commit();
        if (billnumberUpdatedata.custom_bill_number) {
          responseData.custom_bill_number =
            billnumberUpdatedata.custom_bill_number;
        }
        // responseData.printBill = billData.printBill;
        responseData.isRequestFromCsk = billData.isRequestFromCsk;
        responseData.printBillOnBothSide = billData.printBillOnBothSide;
        responseData.printWidth = billData.printWidth;
        responseData.sendImageToCSK = billData.sendImageToCSK;
        responseData.socketUserId = billData.socketUserId;
        responseData.cskPrintEvent = billData.cskPrintEvent;
        responseData.order_type_flag = billData.order_type_flag;
        responseData.order_id = billResult.order_id;
        responseData.id = insertedBillno;
        responseData.nextOrderNumber = nextOrderNumber;
        responseData.billing_type = billDetails.billing_type;
        responseData.table_id = billDetails.table_id;
        responseData.status = 'success';
        global.isBillsaveinprocess = false;

        sendLivesyncrequest();
      } else {
        responseData.status = 'failure';
        global.isBillsaveinprocess = false;
      }
    }
  } catch (error) {
    console.error(error);
    responseData.status = 'failure';
    global.isBillsaveinprocess = false;
    if (transaction) await transaction.rollback();
  } finally {
    await transaction.commit();
  }

  if (billData?.billDetails?.table_id) {
    busy_table.set(billData.billDetails.table_id, false);
  }

  global.isBillsaveinprocess = false;
  return responseData;
}
async function fetchAndUpdateBillNumber(billDetails, transaction) {
  // let transaction;
  try {
    // transaction = await connection.sequelize.transaction();

    // Fetch and lock the temp number row
    const tempNumber = await connection.Tempnumbers.findOne({
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    if (
      billDetails.isBarSection == 2 &&
      global.storeDetails.is_bar_section_billing
    ) {
      await tempNumber.increment(['barSection_bill_number'], {
        // 'order_number'
        by: 1,
        where: { id: 1 },
        transaction,
      });
    } else {
      await tempNumber.increment(['bill_number'], {
        // 'order_number'
        by: 1,
        where: { id: 1 },
        transaction,
      });
    }

    // if (global.orderTypeWiseOrderNumber) {
    //   // Step 1: Fetch the row
    //   const tempNumberRow = await connection.Tempnumbers.findOne({
    //     where: { id: 1 },
    //     transaction,
    //   });

    //   // Step 2: Modify the JSON field in JS
    //   const jsonField = tempNumberRow.order_type_wise_order_number || {};
    //   const key = billDetails.billing_type; // or any dynamic
    //   if (jsonField[key]) {
    //     jsonField[key] = (jsonField[key] || 0) + 1;
    //   } else {
    //     jsonField[key] = 2;
    //   }

    //   // Step 3: Save it back
    //   await connection.Tempnumbers.update(
    //     { order_type_wise_order_number: jsonField },
    //     { where: { id: 1 }, transaction },
    //   );
    // }

    // Commit the transaction
    // await transaction.commit();

    return tempNumber;
  } catch (error) {
    // Rollback the transaction if there's an error
    if (transaction) await transaction.rollback();
    throw error;
  }
}

async function fetchAndUpdateOrderNumber(billDetails, transaction) {
  // let transaction;
  try {
    // transaction = await connection.sequelize.transaction();

    // Fetch and lock the temp number row
    const tempNumber = await connection.Tempnumbers.findOne({
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    await tempNumber.increment(['order_number'], {
      // 'order_number'
      by: 1,
      where: { id: 1 },
      transaction,
    });

    if (global.orderTypeWiseOrderNumber) {
      // Step 1: Fetch the row
      const tempNumberRow = await connection.Tempnumbers.findOne({
        where: { id: 1 },
        transaction,
      });

      // Step 2: Modify the JSON field in JS
      const jsonField = tempNumberRow.order_type_wise_order_number || {};
      const key = billDetails.billing_type; // or any dynamic
      if (jsonField[key]) {
        jsonField[key] = (jsonField[key] || 0) + 1;
      } else {
        jsonField[key] = 2;
      }

      // Step 3: Save it back
      await connection.Tempnumbers.update(
        { order_type_wise_order_number: jsonField },
        { where: { id: 1 }, transaction },
      );
    }

    // Commit the transaction
    // await transaction.commit();

    return tempNumber;
  } catch (error) {
    // Rollback the transaction if there's an error
    if (transaction) await transaction.rollback();
    throw error;
  }
}

async function fetchAndUpdateOrderNumberWithoutTransaction(billDetails) {
  // let transaction;
  try {
    // transaction = await connection.sequelize.transaction();

    // Fetch and lock the temp number row
    const tempNumber = await connection.Tempnumbers.findOne();

    await tempNumber.increment(['order_number'], {
      // 'order_number'
      by: 1,
      where: { id: 1 },
    });

    if (global.orderTypeWiseOrderNumber) {
      // Step 1: Fetch the row
      const tempNumberRow = await connection.Tempnumbers.findOne({
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

      // Step 3: Save it back
      await connection.Tempnumbers.update(
        { order_type_wise_order_number: jsonField },
        { where: { id: 1 } },
      );
    }

    // Commit the transaction
    // await transaction.commit();

    return tempNumber;
  } catch (error) {
    // Rollback the transaction if there's an error
    throw error;
  }
}

async function saveBillitems(
  order_id,
  billitemsList,
  insertedBillno,
  transaction,
) {
  const response = { quantity: 1 };
  try {
    let quantity = 0;
    // eslint-disable-next-line no-restricted-syntax
    for (const item of billitemsList) {
      const unique_id = global.generateId();
      quantity += Number(item.quantity);
      item.amount = Number(item.amount);
      const discount = item.pricebeforeDiscount
        ? Number(
            (item.pricebeforeDiscount - item.item_price) * item.quantity,
          ).toFixed(global.ROUNDOFF_UPTO)
        : 0;
      const tempItem = {
        title: item.title,
        alternative_title: item.alternative_title,
        item_id: item.item_id,
        quantity: item.quantity,
        amount: Number(item.amount),
        price: item.item_price,
        bill_id: insertedBillno,
        orderMasterId: order_id,
        total: Number(item.amount),
        total_with_tax: Number(
          (Number(item.amount) + item.item_tax_value * item.quantity).toFixed(
            global.ROUNDOFF_UPTO,
          ),
        ),
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
        discounted_price: item.discounted_price,
        discount_type: item.discount_type,
        discount_rate: item.discount_rate,
        pricebeforeDiscount: item.pricebeforeDiscount
          ? item.pricebeforeDiscount
          : 0,
        modified_discount: item.modified_discount,
        discount: discount > 0 ? discount : 0,
        kitchen_dept: item.kitchen_dept ? item.kitchen_dept : 0,
        hsn_code: item.hsn_code || null,
        is_open_item: item.is_open_item || 0,
        short_code: item.short_code,
        category_name: item.category_name,
        item_note: item.note,
        has_options: item.has_options,
        extra_details: safeParseformain(item?.extra_details),
        discount_name: item.discount_name,
        unique_id,
      };
      // Calculate total with tax value
      let itemtotalwithTax = tempItem.total_with_tax;
      if (item.item_tax_method === ITEM_TAX_TYPES.INCLUSIVE) {
        itemtotalwithTax = item.amount;
      } else {
        itemtotalwithTax = item.amount + item.item_tax_value * item.quantity;
      }
      if (item.extra_details && item.extra_details.totalExclusiveTax) {
        itemtotalwithTax = item.amount + item.extra_details.totalExclusiveTax;
      }
      Object.assign(tempItem, {
        total_with_tax: Number(itemtotalwithTax.toFixed(global.ROUNDOFF_UPTO)),
      });
      let billitemresult;
      // let billitemresult = await BillItem.create(tempItem);
      if (!tempItem.product_group_id) {
        const posItem = global.itemsList.find(
          (o) => Number(o.item_refid) === Number(item.item_id),
        );
        if (posItem) {
          Object.assign(tempItem, {
            product_group_id: posItem.product_group,
            product_group_name: posItem['mpos_productgroup.product_group_name'],
          });
        }
      }
      try {
        billitemresult = await BillItem.create(tempItem, { transaction });
      } catch (err) {
        console.error('err', err?.message);
      }
      //  await BillItem.create(tempItem);

      if (
        billitemresult.id &&
        item.has_options &&
        item.has_options == 1 &&
        item.addons &&
        item.addons.length > 0
      ) {
        // eslint-disable-next-line no-restricted-syntax
        for (const addon of item.addons) {
          await BillItemOption.create(
            {
              order_id,
              order_item_id: billitemresult.id,
              option_group_ref_id: addon.option_group_ref_id,
              option_ref_id: addon.option_ref_id,
              option_group_name: addon.option_group_name,
              title: addon.option_name,
              qty: addon.option_qty * item.quantity,
              price: addon.option_price,
              total: addon.option_total,
              total_with_tax: addon.option_total_with_tax,
              tax_value: addon.option_tax_amount,
              type: addon.option_type,
              item_ref_id: addon.item_ref_id,
              tax_name: item.item_tax_name,
              is_devidable: item.item_is_devidable,
              option_id: addon.option_id,
              tax_per: item.item_tax_per,
              extra_details: safeParseformain(addon.extra_details),
            },
            { transaction },
          );
        }
      }
      const { itemlevelCharges } = item;
      if (
        itemlevelCharges &&
        Array.isArray(itemlevelCharges) &&
        itemlevelCharges.length > 0
      ) {
        // eslint-disable-next-line no-restricted-syntax
        for (const charge of itemlevelCharges) {
          await connection.Orderchildcharges.create(
            {
              order_id,
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
            },
            { transaction },
          );
        }
      }
    }
    Object.assign(response, { quantity });
  } catch (error) {}
  return response;
}

async function isOrdersynced({ order_id }) {
  try {
    const result = await connection.Bill.findOne({
      raw: true,
      where: {
        order_id,
        sync_status: {
          [connection.Sequelize.Op.in]: [1, 2],
        },
      },
    });
    return result;
  } catch (error) {
    console.error(error);
  }
}

// resync online order
async function resyncOnlineOrder(order_id, sync_status) {
  try {
    await connection.Bill.update(
      { sync_status: sync_status || 0 },
      {
        where: {
          order_id,
        },
      },
    );
    sendLivesyncrequest();
  } catch (error) {
    console.error(
      `Message="Error while updating sync status" OrderID="${order_id}"`,
    );
  }
}
async function saveDigitalorder(orderDetails) {
  const response = { type: 'error', msg: '' };
  try {
    if (orderDetails.id) delete orderDetails.id;
    const items = orderDetails?.tmpos_order_child;
    const charges = orderDetails.tmpos_order_charges;
    const payments = orderDetails.tmpos_order_payment;
    let isModifiedOrder = false;
    let billNumberForModifiedOrder = 0;

    // if (global.reduceStock) {
    //   if (items && items.length) {
    //     for (let i = 0; i < items.length; i++) {
    //       const kotitem = items[i];
    //       const item = await connection.Item.findOne({
    //         attributes: ['current_stock'],
    //         where: {
    //           item_refid: Number(kotitem.item_id),
    //         },
    //       });

    //       if (item && kotitem.quantity > item.current_stock) {
    //         response.status = 'failure';
    //         response.msg = `${kotitem.title} is out of stock`;
    //       }
    //     }
    //   }
    //   if (response.status === 'failure') {
    //     return response;
    //   }
    // }

    // if not order items then return and pull again
    if (!items.length) {
      console.error("Order doesn't have items", JSON.stringify(orderDetails));
      // pull order
      global.mainWindow.webContents.send(RETRY_PULL_ONLINE_ORDER, {
        order_id: orderDetails.order_id,
      });
      return;
    }

    console.log(
      `Message="Pulling digital order" OrderID=${orderDetails.order_id} StoreID=${orderDetails.store_id} `,
    );

    if (orderDetails.reason) {
      Object.assign(orderDetails, { field1: orderDetails.reason });
    }

    orderDetails.sync_status = 0;
    orderDetails.order_kotflag = 2; // Set order as placed
    // orderDetails.order_state = 'fulfilled'; // Set order as placed
    // find and add previous order id in extra_details
    const prevOrder_id = await connection.Bill.findOne({
      raw: true,
      attributes: ['order_id'],
      order: [['id', 'DESC']],
      where: {
        store_id: global.storeDetails.store_id,
      },
    });

    if (prevOrder_id && orderDetails) {
      if (orderDetails.extra_details) {
        Object.assign(orderDetails.extra_details, {
          ...orderDetails.extra_details,
          previous_order_id: prevOrder_id.order_id,
        });
      } else {
        Object.assign(orderDetails, {
          extra_details: {
            previous_order_id: prevOrder_id.order_id,
          },
        });
      }
    }

    const isOrderPulled = await connection.Bill.findOne({
      raw: true,
      where: {
        order_id: orderDetails.order_id,
      },
    });

    // if (
    //   isOrderPulled &&
    //   isOrderPulled.order_state !== 'cancelled' &&
    //   isOrderPulled.order_state !== orderDetails.order_state
    // ) {
    //   let result = await connection.Bill.update(
    //     {
    //       order_state: orderDetails.order_state,
    //     },
    //     {
    //       where: {
    //         order_id: orderDetails.order_id,
    //       },
    //     },
    //   );
    //   if (result) {
    //     response.type = 'success';
    //     response.msg = 'Order status updated';
    //     return response;
    //   } else {
    //     response.type = 'error';
    //     response.msg = 'Order pulled already';
    //     return response;
    //   }
    // }

    if (
      isOrderPulled
      // &&
      // isOrderPulled.order_state == 'cancelled' &&
      // orderDetails.order_state == 'fulfilled'
    ) {
      console.log(
        `Message="Order already pulled and pulling again" OrderID=${orderDetails.order_id} StoreID=${orderDetails.store_id} `,
      );
      // prev bill number to update
      isModifiedOrder = true;
      billNumberForModifiedOrder = isOrderPulled.bill_number;

      // delete order item
      await connection.BillItem.destroy({
        where: {
          orderMasterId: orderDetails.order_id,
        },
      });

      // delete order item addons
      await connection.BillItemOption.destroy({
        where: {
          order_id: orderDetails.order_id,
        },
      });
      // delete order charges
      await connection.BillCharges.destroy({
        where: {
          order_id: orderDetails.order_id,
        },
      });

      // delete order payment
      await connection.BillPayment.destroy({
        where: {
          order_id: orderDetails.order_id,
        },
      });

      // delete order
      const result = await connection.Bill.destroy({
        where: {
          order_id: orderDetails.order_id,
        },
      });

      // delete order child charges
      await connection.Orderchildcharges.destroy({
        where: {
          order_id: orderDetails.order_id,
        },
      });
    }

    // if (
    //   isOrderPulled &&
    //   isOrderPulled.order_state !== 'cancelled' &&
    //   orderDetails.order_state !== 'fulfilled'
    // ) {
    //   response.type = 'error';
    //   response.msg = 'Order pulled already';
    //   return response;
    // }

    if (!items) {
      console.error("Order doesn't have items", orderDetails);
    }

    Object.assign(orderDetails, { sync_status: 1 });
    if (putDigitalOrderDirectInPreparation) {
      Object.assign(orderDetails, { order_kotflag: 4 });
    }

    // online order charges issue
    if (
      orderDetails.item_level_total_charges ||
      orderDetails.order_level_total_charges
    ) {
      const totalItemAndOrderlevelCharges =
        Number(orderDetails.item_level_total_charges) +
        Number(orderDetails.order_level_total_charges);
      if (Number(orderDetails.charges) !== totalItemAndOrderlevelCharges) {
        Object.assign(orderDetails, {
          charges: totalItemAndOrderlevelCharges,
        });
      }
    }
    const saveOrderResult = await connection.Bill.create(orderDetails);
    if (saveOrderResult !== undefined && saveOrderResult.id !== 0) {
      let quantity = 0;
      // eslint-disable-next-line no-restricted-syntax
      const decrementQty = [];
      for (const item of items) {
        const unique_id = global.generateId();
        Object.assign(item, { unique_id });
        item.bill_id = saveOrderResult.id;
        delete item.id;
        let titletocheckWith = item.title;
        if (
          item.order_child_options != undefined &&
          item.order_child_options.length > 0
        ) {
          let options_titleto_remove = item.order_child_options
            .map((elem) => elem.title)
            .join(',');
          options_titleto_remove = `(${options_titleto_remove})`;
          titletocheckWith = String(titletocheckWith)
            .replace(options_titleto_remove, '')
            .trim();
        }
        const itemdetails = await connection.Item.findOne({
          raw: true,
          where: {
            // title: {
            //   [connection.Sequelize.Op.like]: `${titletocheckWith}`,
            // },
            item_refid: item.item_id,
            store_id: orderDetails.store_id,
          },
        });
        if (itemdetails) {
          const productGroupsdetails = await connection.ProductGroup.findOne({
            raw: true,
            where: {
              product_group_id: itemdetails.product_group,
              store_id: orderDetails.store_id,
            },
          });
          Object.assign(item, {
            item_id: itemdetails.item_refid,
            kitchen_dept: itemdetails.kitchen_dept,
            product_group_id: itemdetails.product_group,
            // product_group_name:
            //   (productGroupsdetails &&
            //     productGroupsdetails.product_group_name) ||
            //   '',
            hsn_code: item.hsn_code || '',
          });
          if (productGroupsdetails && productGroupsdetails.product_group_name) {
            Object.assign(item, {
              product_group_name: productGroupsdetails.product_group_name,
            });
          }
        }

        const billitemresult = await connection.BillItem.create(item);
        quantity += item.quantity;
        // decrement kot item qty
        if (global.reduceStock) {
          await connection.Item.decrement('current_stock', {
            by: Number(item.quantity),
            where: { item_refid: item.item_id },
          });
          const itemQty = await connection.Item.findOne({
            raw: true,
            attributes: ['current_stock'],
            where: { item_refid: item.item_id },
          });
          decrementQty.push({
            item_refid: item.item_id,
            qty: item.quantity,
            quantity: item.quantity,
            current_stock: itemQty?.current_stock,
            short_code: item.short_code,
            item_id: item.item_id,
            store_id: global.storeDetails.store_id,
            changeType: 'SALE',
          });
        }
        if (
          item.order_child_options &&
          item.order_child_options.length &&
          billitemresult &&
          billitemresult.id
        ) {
          // eslint-disable-next-line no-restricted-syntax
          for (const option of item.order_child_options) {
            option.order_item_id = billitemresult.id;
            option.order_id = orderDetails.order_id;
            option.item_ref_id = billitemresult.item_id;
            if (option.item_id) {
              option.option_id = option.item_id;
            }
            if (
              orderDetails.billing_type != OnlineBillingTypeByName.CAREEM &&
              item.quantity &&
              option.qty
            ) {
              option.qty = option.qty * item.quantity;
            }
            delete option.id;
            await connection.BillItemOption.create(option);
          }
        }
        if (
          item.order_child_charges &&
          item.order_child_charges.length &&
          billitemresult &&
          billitemresult.id
        ) {
          // eslint-disable-next-line no-restricted-syntax
          for (const currentCharge of item.order_child_charges) {
            await connection.Orderchildcharges.create({
              order_id: orderDetails.order_id,
              order_item_id: billitemresult.id,
              charge_title: currentCharge.charge_title,
              per_fixed: currentCharge.per_fixed,
              calculated_charge: currentCharge.calculated_charge,
              calculated_tax: currentCharge.calculated_tax,
              charge_amount: currentCharge.charge_amount,
              calculate_tax_for_item_charges:
                currentCharge.calculated_tax > 0 ? 1 : 0,
              is_tax_applicable: currentCharge.is_tax_applicable,
              tax_amount: currentCharge.tax_amount,
              is_tax_included: currentCharge.is_tax_included,
              tax_title: currentCharge.tax_title,
              tax_divided: currentCharge.tax_divided,
            });
          }
        }
      }

      if (global.reduceStock && decrementQty && decrementQty.length) {
        // send event
        const data = {
          decrementQtyItems: decrementQty,
        };
        global.ipcEventEmitter.emit(UPDATE_STOCK_QTY, data);
        // reduceBackendStock(decrementQty);
        const result = Object.values(
          decrementQty.reduce((acc, item) => {
            const key = item.item_refid;

            if (!acc[key]) {
              acc[key] = { ...item };
            } else {
              acc[key].qty += item.qty;
              acc[key].quantity += item.quantity;
              acc[key].current_stock = Math.min(
                acc[key].current_stock,
                item.current_stock,
              );
            }

            return acc;
          }, {}),
        );
        for (let i = 0; i < result.length; i++) {
          addRecordItemStockOutBox(result[i]);
        }
      }

      // eslint-disable-next-line no-restricted-syntax
      for (const charge of charges) {
        delete charge.id;
        charge.order_billing_flag = 8;
        await connection.BillCharges.create(charge);
      }

      for (const payment of payments) {
        delete payment.id;
        await addPayment(payment);
      }

      if (orderDetails.coupan_code && orderDetails.coupan_value) {
        const couponHistoryData = {
          store_id: global.storeDetails.store_id,
          tmpos_id: global.storeDetails.tmpos_id,
          logedin_user: global.storeDetails.username,
          coupon_code: orderDetails.coupan_code,
          customer_name: orderDetails.cust_name,
          customer_phone: orderDetails.phone,
          coupon_code_amt: orderDetails.coupan_value,
          order_id: orderDetails.order_id,
        };
        addCouponhistory(couponHistoryData);
      }

      let insertedBillno = saveOrderResult.id;
      let nextBill;
      if (orderDetails.seperateBillNumber) {
        nextBill = await getResettedOnlinebill({ forKot: false });
      } else {
        nextBill = await getResettedbillkotifexist({ forKot: false });
      }

      if (nextBill && !isModifiedOrder) insertedBillno = nextBill;

      if (isModifiedOrder) insertedBillno = billNumberForModifiedOrder;
      let padBillNumber = insertedBillno;
      if (padBillNumber && bill_number_length) {
        padBillNumber = pad(insertedBillno, bill_number_length);
      }
      const billnumberUpdatedata = {
        bill_number: insertedBillno,
        quantity,
        sync_status: 0,
      };

      if (orderDetails.seperateBillNumber) {
        Object.assign(billnumberUpdatedata, {
          bill_prefix_for: BILL_PREFIX_FOR.ONLINE_ORDERS_BILLING,
        });
      }

      if (isModifiedOrder) {
        Object.assign(billnumberUpdatedata, {
          created_time: isOrderPulled.created_time,
          actual_created_time: isOrderPulled.actual_created_time,
          my_order_date: isOrderPulled.my_order_date,
        });
      }
      if (
        orderDetails.seperateBillNumber &&
        global.storeDetails.secondary_bill_prefix
      ) {
        const custom_bill_number = `${global.storeDetails.secondary_bill_prefix}${padBillNumber}`;
        Object.assign(billnumberUpdatedata, {
          custom_bill_number,
        });
      } else if (global.storeDetails.bill_number_prefix) {
        const custom_bill_number = `${global.storeDetails.bill_number_prefix}${padBillNumber}`;
        Object.assign(billnumberUpdatedata, {
          custom_bill_number,
        });
      }

      // check for midnight sale
      if (orderDetails.countMidnightSale) {
        const result = setDateForMidnightOrder();
        if (result) {
          const { orderDate, created_time } = result;
          Object.assign(billnumberUpdatedata, {
            my_order_date: orderDate,
            created_time,
          });
        }
      }

      await connection.Bill.update(billnumberUpdatedata, {
        where: {
          id: saveOrderResult.id,
        },
      });
      if (!isModifiedOrder) {
        if (orderDetails.seperateBillNumber) {
          await connection.Tempnumbers.increment(['secondary_bill_number'], {
            by: 1,
            where: { id: 1 },
          });
        } else {
          await connection.Tempnumbers.increment(['bill_number'], {
            by: 1,
            where: { id: 1 },
          });
        }
      }

      if (!isOrderPulled) {
        const kotDetails = {
          // order_id: billDetails.order_id,
          // bill_number: insertedBillno,
          bill_number: saveOrderResult.order_id,
          order_id: insertedBillno,
          amount: orderDetails.order_total,
          persons: orderDetails.persons ? Number(orderDetails.persons) : 1,
          table_id: orderDetails.table_id,
          customer_name: orderDetails.cust_name,
          customer_mobile: orderDetails.phone,
          customer_id: 0,
          sendEbillcheck: 0,
          showCustomeronbill: 0,
          createdBy: orderDetails.user_id,
          user_id: orderDetails.user_id,
          store_id: orderDetails.store_id,
          is_active: 0,
          billing_type: orderDetails.billing_type,
          // table_name: 'Quick Bill',
          note: orderDetails.instructions,
          waiter: orderDetails.waiter,
          waiter_id: orderDetails.waiter_id,
        };
        if (global.storeDetails.bill_number_prefix) {
          Object.assign(kotDetails, {
            custom_bill_number: billnumberUpdatedata.custom_bill_number,
          });
        }

        Object.assign(kotDetails, {
          kot_uniqueid: global.generateId(),
        });
        const kotresult = await connection.KOT.create(kotDetails);

        if (kotresult != undefined && kotresult.kot_id != 0) {
          const decrementQty = [];
          for (const item of items) {
            const extra_details = item.extra_details;
            let item_note = '';
            if (item.item_note) {
              item_note = item.item_note;
            }

            if (extra_details && extra_details.item_note) {
              item_note = extra_details.item_note;
            }
            const itemresultEntity = await connection.KOTItem.create({
              kot_id: kotresult.kot_id,
              item_id: item.item_id || item.item_refid,
              item_name: item.title,
              item_price: item.price,
              quantity: item.quantity,
              amount: Number(item.total).toFixed(global.ROUNDOFF_UPTO),
              item_tax_name: item.tax_name,
              item_tax_per: item.item_tax_per,
              item_tax_value: item.item_tax_value,
              item_tax_method: item.item_tax_method,
              item_is_devidable: item.item_is_devidable,
              createdBy: orderDetails.user_id,
              user_id: orderDetails.user_id,
              item_total_tax_value: Number(
                item.item_tax_value * item.quantity,
              ).toFixed(global.ROUNDOFF_UPTO),
              note: item_note,
              reason: item.reason ? item.reason : null,
              short_code: item.short_code,
              product_group_id:
                item.product_group_id != undefined
                  ? item.product_group_id
                  : null,
              product_group_name: item.product_group_name
                ? item.product_group_name
                : null,
              discounted_price: item.discounted_price,
              discount_type: item.discount_type,
              discount_rate: item.discount_rate,
              pricebeforeDiscount: item.pricebeforeDiscount
                ? item.pricebeforeDiscount
                : 0,
              modified_discount: item.modified_discount,
              discount: item.pricebeforeDiscount
                ? Number(
                    (
                      (item.pricebeforeDiscount - item.price) *
                      item.quantity
                    ).toFixed(global.ROUNDOFF_UPTO),
                  )
                : 0,
              is_complimentary: item.amount === 0,
              kitchen_dept: item.kitchen_dept ? item.kitchen_dept : 0,
              hsn_code: item.hsn_code || null,
              is_open_item: item.is_open_item || 0,
              extra_details: item.extra_details,
              has_options: item.has_options ? item.has_options : 0,
              alternative_category_name: item.alternative_category_name,
              alternative_title: item.alternative_title,
            });
            if (
              itemresultEntity &&
              item.isitemwithOption &&
              item.addons &&
              item.addons.length > 0
            ) {
              for (const addon of item.addons) {
                // const option_qty = addon.option_type === 0 ? item.quantity : 1;
                let option_qty = 1;
                if (addon.qty) {
                  option_qty = addon.qty;
                }
                const option_total = addon.price * option_qty;
                const option_total_with_tax =
                  option_total + addon.option_tax * option_qty;
                const tempaddon = {
                  kot_items_id: itemresultEntity.id,
                  option_group_name: addon.optionGrptitle,
                  option_group_ref_id: addon.opt_grp_ref_ids,
                  option_ref_id: addon.ref_id,
                  option_name: addon.title,
                  option_price: addon.price,
                  option_tax_amount: addon.option_tax,
                  option_qty,
                  option_total,
                  option_total_with_tax,
                  option_type: addon.option_type,
                  item_ref_id: addon.item_ref_id,
                  option_id: addon.option_id,
                };

                await connection.KotItemOption.create(tempaddon);
              }
            }
          }
          await updateDummykotnumberWithoutTransaction(kotresult.kot_id);
          await connection.Tempnumbers.increment(['kot_number'], {
            by: 1,
            where: { id: 1 },
          });
        }
      }

      // check if customer is present and if yes then update address for that customer so when we send customer in order sync then no issue in address
      const customer = await connection.Customer.findOne({
        raw: true,
        where: {
          phone: orderDetails.phone,
          store_id: global.storeDetails.store_id,
        },
      });

      let dial_code;
      if (
        orderDetails &&
        orderDetails.extra_details &&
        orderDetails.extra_details.phone_prefix
      ) {
        dial_code = orderDetails.extra_details.phone_prefix.replace(/\+/g, '');
      }
      if (customer && (orderDetails.line_1 || orderDetails.line_2)) {
        const updateData = {
          address_line1: orderDetails.line_1,
          address_line2: orderDetails.line_2,
        };
        if (dial_code) {
          Object.assign(updateData, {
            dial_code,
          });
        }
        await connection.Customer.update(updateData, {
          where: {
            phone: orderDetails.phone,
            store_id: global.storeDetails.store_id,
          },
        });
      } else {
        const customer = {
          name: orderDetails.cust_name,
          phone: orderDetails.phone,
          email: '',
          store_id: global.storeDetails.store_id,
          address_line1: orderDetails.line_1,
          address_line2: orderDetails.line_2,
          city: '',
          dob: '',
          anniversary: '',
          createdDate: moment().format('YYYY-MM-DD HH:mm:ss'),
        };
        if (dial_code) {
          Object.assign(customer, {
            dial_code,
          });
        }
        await addCustomer(customer);
      }

      if (
        global.start_day_date &&
        global.start_day_date > orderDetails.created_time
      ) {
        const { created_time } = orderDetails;
        const oneMinuteLess = created_time - 60 * 1000;
        global.start_day_date = oneMinuteLess;
        await connection.StartcloseDay.update(
          {
            sync_flag: 0,
            start_day_date: oneMinuteLess,
          },
          {
            where: {
              start_day_date: global.start_day_date,
              store_id: global.storeDetails.store_id,
            },
          },
        );
      }
      if (tally_integration) {
        generateTallyXML(orderDetails.order_id);
      }
      sendLivesyncrequest(true);
    }

    Object.assign(response, {
      type: 'success',
      msg: 'Order pulled',
      status: orderDetails.order_kotflag,
      order_id: orderDetails.order_id,
    });
  } catch (error) {
    console.log('Pulling digital order failed', error);
    if (error.original && error.original.errno === 19) {
      response.type = 'error';
      response.msg = 'Order already pulled';
    } else {
      Object.assign(response, { type: 'error', msg: 'Something went wrong.' });
    }
  } finally {
    if (response.type !== 'success') {
      resyncOnlineOrder(orderDetails.order_id);
    }
  }
  return response;
}

async function getrunningorderDetails(params) {
  let response = {};
  try {
    const { table_id } = params;
    // const { table_name } = params;
    const kotResult = await connection.KOT.findAll({
      where: {
        table_id,
        is_active: 1,
      },
      raw: true,
    });
    let tableState = await connection.Table.findAll({
      limit: 1,
      raw: true,
      attributes: [
        'table_color',
        'table_action_flag',
        'reservation_id',
        'order_type_flag',
      ],
      where: {
        id: table_id,
      },
    });

    let tableReservationDetails;
    if (tableState && tableState.length > 0) {
      tableState = tableState[0];
      if (tableState.reservation_id) {
        tableReservationDetails = await connection.TableReservation.findOne({
          raw: true,
          where: {
            reservation_id: tableState.reservation_id,
          },
        });
      }
    }
    if (kotResult != undefined && kotResult.length > 0) {
      const { bill_number } = kotResult[0];
      const payid = kotResult[0].payment_id;
      const { kot_id } = kotResult[0];
      const { order_id } = kotResult[0];
      let payment_mode;
      let noofPersons = 1;
      if (kotResult[0].persons) noofPersons = kotResult[0].persons;
      const customerName = kotResult[0].customer_name;
      const customerMobile = kotResult[0].customer_mobile;
      const ebillCheckstat = kotResult[0].sendEbillcheck;
      const showonBillstat = kotResult[0].showCustomeronbill;
      const { deliveryboy_id } = kotResult[0];
      const { note } = kotResult[0];
      const { discount_type } = kotResult[0];
      const discount = kotResult[0].discount_rate;
      const discountInstruction = kotResult[0].field1;
      const discountTitle = kotResult[0].discount_title;
      const { discounted_product_groups } = kotResult[0];
      const { couponDisount } = kotResult[0];
      const { couponDisounttype } = kotResult[0];
      const { coupon } = kotResult[0];
      // let kotcreatedAt = kotResult[0].in_time;
      const kotcreatedAt = kotResult[0].actual_in_time;
      const { waiter } = kotResult[0];
      const { waiter_id } = kotResult[0];
      let { is_pre_order } = kotResult[0];
      const { custom_bill_number } = kotResult[0];
      let billDetails;
      let { createdBy } = kotResult[0];
      const { draftprint_status } = kotResult[0];
      let remoteKot = kotResult[0].remote_order_id != 0;
      let { remote_order_id } = kotResult[0];
      const order_type_flag = kotResult[0].billing_type;
      const { table_name, field2, field3 } = kotResult[0];
      let { extra_details } = kotResult[0];

      let bill_id;

      // getting all kot_numbers
      const kot_numbers = [];
      const kot_status = [];
      kotResult.map((kot) => {
        kot_numbers.push(kot.kot_number);
        kot_status.push(kot.status);
        if (kot.remote_order_id && kot.remote_order_id != 0) {
          remote_order_id = kot.remote_order_id;
        }
        if (kot.billing_type == 40) {
          remoteKot = true;
        }
      });

      if (bill_number != 0) {
        const fetcholdPayresult = await connection.BillPayment.findAll({
          raw: true,
          where: { order_id: bill_number },
          attributes: ['payment_option'],
          group: ['payment_option'],
        });
        if (fetcholdPayresult.length > 0) {
          if (fetcholdPayresult.length > 1) {
            payment_mode = 'Split';
          } else {
            payment_mode = fetcholdPayresult[0].payment_option;
          }
        }

        const billDetailsResult = await connection.Bill.findAll({
          raw: true,
          attributes: [
            'hasDuepayment',
            'due_payment',
            'cust_paid_amount',
            'extra_details',
            'payment',
            'instructions',
            'id',
            'isBillModified',
            'print_status',
            'draftprint_status',
            'order_total',
            'field2',
            'createdBy',
            'order_note',
            'delivery_boy_name',
          ],
          where: { order_id: bill_number },
        });
        if (billDetailsResult && billDetailsResult.length > 0) {
          billDetails = billDetailsResult[0];
          createdBy = billDetails.createdBy;
          extra_details = billDetails?.extra_details;

          const paymentModes = await connection.BillPayment.findAll({
            raw: true,
            where: {
              order_id: bill_number,
            },
          });
          if (paymentModes) {
            Object.assign(billDetails, {
              payment_modes: paymentModes,
            });
          }
          if (
            billDetails &&
            billDetails.payment &&
            String(billDetails.payment).toLowerCase() === 'split'
          ) {
            payment_mode = 'Split';
          }

          bill_id = billDetails.id;
        }
      } else {
        const paymentModes = await connection.BillPayment.findAll({
          raw: true,
          where: {
            id: kotResult[0].payment_id,
          },
        });

        if (paymentModes && paymentModes.length === 1) {
          payment_mode = paymentModes[0].payment_option;
        }
      }

      // Check for charges
      const billCharges = await connection.KOTCharges.findAll({
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
            is_tax_applicable: element.is_tax_applicable,
            tax_amount: element.tax_amount,
            is_tax_included: element.is_tax_included,
            tax_title: element.tax_title,
            tax_divided: element.tax_divided,
            extra_details: element.extra_details,
          };
          charges.push(data);
        });
      }
      // let billItems = await connection.KOTItem.getKotitems(table_id);
      const billItems = await getRunningkotitemsdetails({ table_id });
      let printBillItems = [];

      if (global.showItemNoteInBillingWindow) {
        printBillItems = await getRunningkotitemsdetailsForPrint({
          table_id,
        });
      }
      let itemsForItemDiscount = [];
      if (global.hasItemDiscount) {
        itemsForItemDiscount = await getRunningkotitemsdetailsForItemDiscount({
          table_id,
        });
      }

      response = {
        tableState,
        bill_number,
        payid,
        kot_id,
        order_id,
        payment_mode,
        charges,
        noofPersons,
        customerName,
        customerMobile,
        ebillCheckstat,
        showonBillstat,
        discount_type,
        discount,
        billItems,
        itemsForItemDiscount,
        table_id,
        table_name,
        note,
        deliveryboy_id,
        couponDisount,
        couponDisounttype,
        coupon,
        billDetails,
        kotcreatedAt,
        waiter,
        waiter_id,
        discounted_product_groups,
        discountTitle,
        is_pre_order,
        custom_bill_number,
        createdBy,
        field1: kotResult[0].field1,
        field2: kotResult[0].field2,
        draftprint_status,
        remoteKot,
        remote_order_id,
        kot_numbers,
        kot_status,
        bill_id,
        tableReservationDetails,
        order_type_flag,
        discountInstruction,
        order_note: field3,
        extra_details,
        printBillItems,
      };
      response.status = 200;

      if (is_pre_order) {
        const preorderInfo = await connection.PreOrder.findOne({
          where: {
            table_id,
            status: 'created',
          },
        });
        if (preorderInfo) {
          Object.assign(response, { preorderInfo });
        } else {
          is_pre_order = 0;
        }
      }
    } else {
      response.status = 404;
      response.table_id = table_id;
      response.tableState = tableState;
      response.tableReservationDetails = tableReservationDetails;
    }
  } catch (error) {
    console.error(error);
    response.status = 404;
    response.message = 'Something went wrong';
  }
  return response;
}

async function getRunningtableKotItems(params) {
  let response = {};
  try {
    const { table_id } = params;
    const billItems = await getRunningkotitemsdetails({ table_id });
    response.billItems = billItems;
    return response;
  } catch (error) {
    console.log(error);
  }
}

async function getNewOrRunnigTagForOrder(params) {
  try {
    const { table_id } = params;
    const kots = await connection.KOT.findAll({
      attributes: ['kot_id'],
      where: {
        table_id,
        is_active: 1,
      },
    });
    return kots;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Fetch KOT Items by table_id and kot_id (Optional)
 * @param {table_id} on which the KOT items to fetch
 * * @param {kot_id} on which the KOT items to fetch
 * @returns
 */
async function getRunningkotitemsdetails({ table_id, kot_id }) {
  let billItems = [];
  try {
    const kotWheredata = {
      table_id,
      is_active: 1,
    };
    if (kot_id) {
      Object.assign(kotWheredata, {
        kot_id,
      });
    }
    billItems = await connection.KOTItem.findAll({
      include: [
        {
          model: connection.KOT,
          attributes: [],
          where: kotWheredata,
        },
      ],
      attributes: [
        ['id', 'kot_items_id'],
        ['item_name', 'title'],
        'alternative_title',
        // [connection.Sequelize.fn('sum', connection.Sequelize.col('mpos_kot_item.amount')), 'amount'],
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f",(sum(mpos_kot_item.amount)))`,
          ),
          'amount',
        ],
        // [
        //   connection.Sequelize.fn(
        //     'sum',
        //     connection.Sequelize.col('mpos_kot_item.quantity'),
        //   ),
        //   'quantity',
        // ],
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f",(sum(mpos_kot_item.quantity)))`,
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
        'discount',
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
        'category_name',
        'createdBy',
        'user_id',
        'extra_details',
        'discount_name',
        [
          connection.Sequelize.fn(
            'GROUP_CONCAT',
            connection.Sequelize.col('mpos_kot_item.kot_id'),
          ),
          'kot_ids',
        ],
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
      // group: ['mpos_kot_item.item_name'],
      // is_complimentary
      group: [
        [
          connection.Sequelize.fn(
            'LOWER',
            connection.Sequelize.col('mpos_kot_item.item_name'),
          ),
        ],
        'is_complimentary',
        'item_price',
        'short_code',
      ],
      // group: ['mpos_kot_item.item_name', 'mpos_kot_item.amount'],
      order: connection.Sequelize.literal('mpos_kot_item.id'),
      raw: true,
    });
    // eslint-disable-next-line no-restricted-syntax
    for (const kotItem of billItems) {
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
              where: kotWheredata,
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
          // kot_items_id: {
          //   [connection.Sequelize.Op.in]: kot_ids,
          // },
          // kot_items_id: {
          //   [connection.Sequelize.Op.in]: [item.kot_items_id],
          // },
          kot_items_id: kotItem.kot_items_id,
        };

        // if (kotItem.title) {
        //   let regex = /\(([^)]+)\)/;
        //   let match = kotItem.title.match(regex);
        //   if (match) {
        //     let input_string = match[1].replace(/and/g, ',');
        //     let option_items = input_string.r(',');
        //     // .map(function (item) {
        //     //   return item.trim(); // Remove leading and trailing whitespaces
        //     // });

        //     if (option_items && option_items.length) {
        //       Object.assign(optionWhereData, {
        //         option_name: {
        //           [connection.Sequelize.Op.in]: option_items,
        //         },
        //       });
        //     }
        //   }
        // }

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
          table_id,
        },
        group: ['title'],
      });
      if (itemlevelCharges && itemlevelCharges.length > 0) {
        kotItem.itemlevelCharges = itemlevelCharges;
      }
    }
  } catch (error) {}
  return billItems;
}

async function getRunningkotitemsdetailsForPrint({ table_id, kot_id }) {
  let billItems = [];
  try {
    const kotWheredata = {
      table_id,
      is_active: 1,
    };
    if (kot_id) {
      Object.assign(kotWheredata, {
        kot_id,
      });
    }
    billItems = await connection.KOTItem.findAll({
      include: [
        {
          model: connection.KOT,
          attributes: [],
          where: kotWheredata,
        },
      ],
      attributes: [
        ['id', 'kot_items_id'],
        ['item_name', 'title'],
        'alternative_title',
        // [connection.Sequelize.fn('sum', connection.Sequelize.col('mpos_kot_item.amount')), 'amount'],
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f",(sum(mpos_kot_item.amount)))`,
          ),
          'amount',
        ],
        // [
        //   connection.Sequelize.fn(
        //     'sum',
        //     connection.Sequelize.col('mpos_kot_item.quantity'),
        //   ),
        //   'quantity',
        // ],
        [
          connection.sequelize.literal(
            `printf("%.${global.ROUNDOFF_UPTO}f",(sum(mpos_kot_item.quantity)))`,
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
        'category_name',
        'createdBy',
        'user_id',
        'extra_details',
        'discount_name',
        [
          connection.Sequelize.fn(
            'GROUP_CONCAT',
            connection.Sequelize.col('mpos_kot_item.kot_id'),
          ),
          'kot_ids',
        ],
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
      // group: ['mpos_kot_item.item_name'],
      // is_complimentary
      group: [
        [
          connection.Sequelize.fn(
            'LOWER',
            connection.Sequelize.col('mpos_kot_item.item_name'),
          ),
        ],
        'is_complimentary',
        'item_price',
        'short_code',
        'mpos_kot_item.note',
      ],
      // group: ['mpos_kot_item.item_name', 'mpos_kot_item.amount'],
      order: connection.Sequelize.literal('mpos_kot_item.id'),
      raw: true,
    });
    // eslint-disable-next-line no-restricted-syntax
    for (const kotItem of billItems) {
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
              where: kotWheredata,
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
          // kot_items_id: {
          //   [connection.Sequelize.Op.in]: kot_ids,
          // },
          // kot_items_id: {
          //   [connection.Sequelize.Op.in]: [item.kot_items_id],
          // },
          kot_items_id: kotItem.kot_items_id,
        };

        // if (kotItem.title) {
        //   let regex = /\(([^)]+)\)/;
        //   let match = kotItem.title.match(regex);
        //   if (match) {
        //     let input_string = match[1].replace(/and/g, ',');
        //     let option_items = input_string.split(',');
        //     // .map(function (item) {
        //     //   return item.trim(); // Remove leading and trailing whitespaces
        //     // });

        //     if (option_items && option_items.length) {
        //       Object.assign(optionWhereData, {
        //         option_name: {
        //           [connection.Sequelize.Op.in]: option_items,
        //         },
        //       });
        //     }
        //   }
        // }

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
          table_id,
        },
        group: ['title'],
      });
      if (itemlevelCharges && itemlevelCharges.length > 0) {
        kotItem.itemlevelCharges = itemlevelCharges;
      }
    }
  } catch (error) {}
  return billItems;
}
async function getRunningkotitemsdetailsForItemDiscount({ table_id, kot_id }) {
  let billItems = [];
  try {
    const kotWheredata = {
      table_id,
      is_active: 1,
    };
    if (kot_id) {
      Object.assign(kotWheredata, {
        kot_id,
      });
    }
    billItems = await connection.KOTItem.findAll({
      include: [
        {
          model: connection.KOT,
          attributes: [],
          where: kotWheredata,
        },
      ],
      attributes: [
        ['id', 'kot_items_id'],
        ['item_name', 'title'],
        'alternative_title',
        'amount',
        'quantity',
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
        'discount',
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
        'category_name',
        'createdBy',
        'user_id',
        'extra_details',
        'discount_name',
        // [
        //   connection.Sequelize.fn(
        //     'GROUP_CONCAT',
        //     connection.Sequelize.col('mpos_kot_item.kot_id'),
        //   ),
        //   'kot_ids',
        // ],
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

      order: connection.Sequelize.literal('mpos_kot_item.id'),
      raw: true,
    });
    // eslint-disable-next-line no-restricted-syntax
    for (const kotItem of billItems) {
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
              where: kotWheredata,
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
          // kot_items_id: {
          //   [connection.Sequelize.Op.in]: kot_ids,
          // },
          // kot_items_id: {
          //   [connection.Sequelize.Op.in]: [item.kot_items_id],
          // },
          kot_items_id: kotItem.kot_items_id,
        };

        // if (kotItem.title) {
        //   let regex = /\(([^)]+)\)/;
        //   let match = kotItem.title.match(regex);
        //   if (match) {
        //     let input_string = match[1].replace(/and/g, ',');
        //     let option_items = input_string.split(',');
        //     // .map(function (item) {
        //     //   return item.trim(); // Remove leading and trailing whitespaces
        //     // });

        //     if (option_items && option_items.length) {
        //       Object.assign(optionWhereData, {
        //         option_name: {
        //           [connection.Sequelize.Op.in]: option_items,
        //         },
        //       });
        //     }
        //   }
        // }

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
            'option_qty',
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
          table_id,
        },
        group: ['title'],
      });
      if (itemlevelCharges && itemlevelCharges.length > 0) {
        kotItem.itemlevelCharges = itemlevelCharges;
      }
    }
  } catch (error) {}
  return billItems;
}

function extractLastBracketContent(input) {
  const matches = input.match(/\(([^)]+)\)/g);

  if (matches && matches.length > 0) {
    const lastBracketContent = matches[matches.length - 1].replace(
      /\(|\)/g,
      '',
    );
    const items = lastBracketContent.split(', ').map((item) => item.trim());
    return items;
  }

  return null; // or any other default value if no bracket content is found
}
async function checkifduepaymentExists({ phone }) {
  const response = { status: 400, msg: '' };
  try {
    const where = {
      store_id: global.storeDetails.store_id,
      due_payment: {
        [connection.Sequelize.Op.ne]: 0,
      },
      phone,
    };
    const duePay = await connection.Bill.findAll({
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
    Object.assign(response, {
      status: 200,
      msg: 'success',
      duePay,
    });
  } catch (error) {}
  return response;
}

/**
 * Settle quick bill
 * @param {Quick bill data} billData
 */
async function settleQuickbill(billData) {
  let transaction;
  let timeoutHandle = null;
  const responseData = {};
  if (global.isLoadMenuInProgress) {
    responseData.status = 'failure';
    responseData.message =
      'Load menu is in process. Please try after some time';
    return responseData;
  }
  if (global.isLoadMenuInProgress) {
    console.log('load menu is in progress');
    responseData.status = 'failure';
    responseData.message =
      'Load menu is in process. Please try after some time';
    return responseData;
  }
  if (global.reduceStock) {
    const { items } = billData;
    if (items && items.length) {
      for (let i = 0; i < items.length; i++) {
        const kotitem = items[i];
        if (!kotitem.is_open_item) {
          const item = await connection.Item.findOne({
            attributes: ['current_stock'],
            where: {
              item_refid: kotitem.item_refid,
            },
          });

          if (kotitem.addons && kotitem.addons.length) {
            // kotitem.addons.forEach(async (addon) => {
            for (let i = 0; i < kotitem.addons.length; i++) {
              const addon = kotitem.addons[i];
              if (addon.option_ref_id) {
                const optionitem = await connection.Item.findOne({
                  attributes: ['current_stock'],
                  where: {
                    item_refid: addon.option_ref_id,
                  },
                });
                const addonQty = kotitem.quantity * addon.qty;
                if (optionitem && addonQty > optionitem.current_stock) {
                  responseData.status = 'failure';
                  responseData.message = `${addon.title} is out of stock`;
                }
              }
            }
          }

          if (item && kotitem.quantity > item.current_stock) {
            responseData.status = 'failure';
            responseData.message = `${kotitem.title} is out of stock`;
          }
        }
      }
    }
    if (responseData.status === 'failure') {
      return responseData;
    }
  }
  try {
    transaction = await connection.sequelize.transaction();
    timeoutHandle = setTimeout(async () => {
      if (!transaction.finished) {
        await transaction.rollback();
      }
    }, 10000);

    global.dbOperationisinprogress = true;
    if (billData) {
      let { billDetails } = billData;
      const { items } = billData;
      const { charges } = billData;
      const { paymentDetails } = billData;
      const { isSplitpayment } = paymentDetails;
      const { printBill } = billData;
      const { printKOT } = billData;
      const { couponDisounthistorydata } = billData;
      const { discountHistory } = billData;
      const { dueHistory } = billData;
      const { addasdueChecked } = billData;
      const { billing_type } = billDetails;
      let item_level_total_discount = 0;

      if (!billDetails.persons) billDetails.persons = 1;

      delete paymentDetails.isSplitpayment;

      const { updateAddress, updateCustomerName } = billDetails;
      const { newCustomerAddress } = billDetails;
      let updatedCustomer;
      if (updateAddress || updateCustomerName) {
        if (newCustomerAddress) {
          updatedCustomer = await addCustomer({
            name: billDetails.cust_name,
            phone: billDetails.phone,
            address_line1: updateAddress,
            address_line2: '',
            store_id: billDetails.store_id,
            ...newCustomerAddress,
          });
        } else {
          updatedCustomer = await addCustomer({
            name: billDetails.cust_name,
            phone: billDetails.phone,
            address_line1: updateAddress,
            address_line2: '',
            store_id: billDetails.store_id,
          });
        }
      }

      if (
        isSplitpayment &&
        paymentDetails.payList != undefined &&
        paymentDetails.payList.length > 0
      ) {
        await connection.BillPayment.destroy({
          where: {
            order_id: billDetails.order_id,
          },
          transaction,
        });
        // const newpaymentList = uniqBy(paymentDetails.payList, 'payment_option');
        // await connection.BillPayment.bulkCreate(newpaymentList, {
        //   transaction,
        // });

        await connection.BillPayment.bulkCreate(paymentDetails.payList, {
          transaction,
        });
      } else if (!addasdueChecked) {
        await addPayment(paymentDetails, transaction);
      }
      // check if due pay is available
      if (addasdueChecked && dueHistory && dueHistory.due_payment != 0) {
        billDetails.hasDuepayment = 1;
      }
      if (!billDetails.order_id) {
        billDetails = global.generateId();
      }

      // find and add previous order id in extra_details
      const prevOrder_id = await connection.Bill.findOne({
        raw: true,
        attributes: ['order_id'],
        order: [['id', 'DESC']],
        where: {
          store_id: global.storeDetails.store_id,
        },
        transaction,
      });

      if (prevOrder_id) {
        Object.assign(billDetails.extra_details, {
          previous_order_id: prevOrder_id.order_id,
        });
      }
      const billResult = await connection.Bill.create(billDetails, {
        transaction,
      });
      let insertedBillno = billResult.id;
      let nextOrderNumber;
      let kot_number;

      if (billResult != undefined && billResult.id != 0) {
        let quantity = 0;
        // console.log('quick bill items to save::', items);
        for (let item of items) {
          const unique_id = global.generateId();
          quantity += item.quantity;
          const tempItem = {
            title: item.title,
            alternative_title: item.alternative_title,
            item_id: item.item_refid,
            quantity: item.quantity,
            amount: item.amount,
            price: String(item.price) ? item.price : item.item_price,
            bill_id: billResult.id,
            orderMasterId: billDetails.order_id,
            total: item.amount, // item.total ? item.total : item.amount,
            total_with_tax: Number(
              (item.amount + item.item_tax_value * item.quantity).toFixed(
                global.ROUNDOFF_UPTO,
              ),
            ),
            tax_method: item.item_tax_method,
            tax_name: item.item_tax_name || item.tax_name,
            tax_per: item.item_tax_per,
            tax_value: item.item_tax_value,
            is_devidable: item.item_is_devidable,
            product_group_id:
              item.product_group_id != undefined ? item.product_group_id : null,
            product_group_name: item.product_group_name
              ? item.product_group_name
              : null,
            discounted_price: item.discounted_price,
            discount_type: item.discount_type,
            discount_rate: item.discount_rate,
            pricebeforeDiscount: item.pricebeforeDiscount
              ? item.pricebeforeDiscount
              : 0,
            modified_discount: item.modified_discount,
            discount: item.pricebeforeDiscount
              ? Number(
                  (item.pricebeforeDiscount - item.item_price) * item.quantity,
                ).toFixed(global.ROUNDOFF_UPTO)
              : 0,
            kitchen_dept: item.kitchen_dept ? item.kitchen_dept : 0,
            hsn_code: item.hsn_code || null,
            is_open_item: item.is_open_item || 0,
            short_code: item.short_code,
            category_name: item.category_name,
            item_note: item.note,
            extra_details: item.extra_details,
            has_options: item.has_options ? item.has_options : 0,
            alternative_category_name: item.alternative_category_name,
            unique_id,
          };

          if (tempItem.discount) {
            item_level_total_discount += Number(tempItem.discount);
          }

          // Calculate total with tax value
          let itemtotalwithTax = tempItem.total_with_tax;
          if (item.item_tax_method === ITEM_TAX_TYPES.INCLUSIVE) {
            itemtotalwithTax = item.amount;
          } else {
            itemtotalwithTax =
              item.amount + item.item_tax_value * item.quantity;
          }
          Object.assign(tempItem, {
            total_with_tax: Number(
              itemtotalwithTax.toFixed(global.ROUNDOFF_UPTO),
            ),
          });

          let billitemresult;
          try {
            billitemresult = await connection.BillItem.create(tempItem, {
              transaction,
            });
          } catch (error) {
            console.error('error', error);
          }

          if (
            billitemresult.id &&
            item.has_options &&
            item.has_options == 1 &&
            item.addons &&
            item.addons.length > 0
          ) {
            // eslint-disable-next-line no-restricted-syntax
            for (const addon of item.addons) {
              let addonQty = 1;
              if (addon.qty) {
                addonQty = addon.qty;
              }
              await connection.BillItemOption.create(
                {
                  order_id: billDetails.order_id,
                  order_item_id: billitemresult.id,
                  option_group_ref_id: addon.opt_grp_ref_ids,
                  option_ref_id: addon.ref_id,
                  option_group_name: addon.optionGrptitle,
                  title: addon.title,
                  qty: addonQty * item.quantity,
                  price: addon.price,
                  total: addon.price,
                  total_with_tax: addon.option_tax,
                  tax_value: addon.option_tax,
                  type: addon.option_type,
                  item_ref_id: addon.item_ref_id,
                  option_id: addon.option_ref_id,
                  tax_per: item.item_tax_per,
                },
                { transaction },
              );
            }
          }

          const { itemlevelCharges } = item;
          if (
            itemlevelCharges &&
            Array.isArray(itemlevelCharges) &&
            itemlevelCharges.length > 0
          ) {
            // eslint-disable-next-line no-restricted-syntax
            for (const charge of itemlevelCharges) {
              await connection.Orderchildcharges.create(
                {
                  order_id: billDetails.order_id,
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
                },
                { transaction },
              );
            }
          }
        }

        if (charges && charges.length > 0) {
          for (element of charges) {
            const data = {
              order_id: billDetails.order_id,
              title: element.title,
              amount: element.amount,
              value: element.amounttoAdd,
              is_default_flag: element.is_default,
              order_billing_flag: element.billing_flag,
              per_or_fixed: element.per_or_fixed,
              charge_id: element.charge_id,
              is_tax_included: element.is_tax_included,
              calculated_tax: element.calculated_tax,
              tax_divided: element.tax_divided,
              tax_title: element.tax_title,
              tax_amount: element.tax_amount,
              extra_details: element.extra_details,
            };
            await connection.BillCharges.create(data, { transaction });
          }
        }

        const nextBill = await getResettedbillkotifexist({ forKot: false });

        if (nextBill) insertedBillno = nextBill;

        let padBillNumber = insertedBillno;
        if (padBillNumber && bill_number_length) {
          padBillNumber = pad(insertedBillno, bill_number_length);
        }

        nextOrderNumber = await getResettedordernumberifexist();
        if (global.orderTypeWiseOrderNumber) {
          nextOrderNumber = safeParseformain(nextOrderNumber);
          if (nextOrderNumber && nextOrderNumber[billDetails.billing_type]) {
            nextOrderNumber = nextOrderNumber[billDetails.billing_type];
          } else {
            nextOrderNumber = 1;
          }
        }
        if (nextOrderNumber && billDetails && billDetails.extra_details) {
          Object.assign(billDetails.extra_details, {
            ...billDetails.extra_details,
            order_number: nextOrderNumber,
          });
        }

        // Add KOT Data
        const kotDetails = {
          // order_id: billDetails.order_id,
          // bill_number: insertedBillno,
          bill_number: billResult.order_id,
          order_id: insertedBillno,
          amount: billDetails.order_total,
          persons: billDetails.persons ? Number(billDetails.persons) : 1,
          table_id: billDetails.table_id,
          customer_name: billDetails.cust_name,
          customer_mobile: billDetails.phone,
          customer_id: 0,
          sendEbillcheck: 0,
          showCustomeronbill: 0,
          createdBy: billDetails.user_id,
          user_id: billDetails.user_id,
          store_id: billDetails.store_id,
          is_active: 0,
          billing_type: billDetails.billing_type,
          table_name: 'Quick Bill',
          note: billDetails.note,
          waiter: billDetails.waiter,
          waiter_id: billDetails.waiter_id,
        };
        if (global.storeDetails.bill_number_prefix) {
          Object.assign(kotDetails, {
            custom_bill_number: `${global.storeDetails.bill_number_prefix}${padBillNumber}`,
          });
        }
        if (couponDisounthistorydata) {
          await addCouponhistory(couponDisounthistorydata, transaction);
          kotDetails.couponDisount = billDetails.couponDisount;
          kotDetails.couponDisounttype = billDetails.couponDisounttype;
          kotDetails.coupon = billDetails.coupon;
        }

        if (dueHistory) {
          dueHistory.transaction_id = global.generateId();
          addDuepaymenthistory(dueHistory, transaction);
        }

        Object.assign(kotDetails, {
          kot_uniqueid: global.generateId(),
        });
        const kotresult = await connection.KOT.create(kotDetails, {
          transaction,
        });

        if (kotresult != undefined && kotresult.kot_id != 0) {
          const decrementQty = [];
          for (item of items) {
            const itemresultEntity = await connection.KOTItem.create(
              {
                kot_id: kotresult.kot_id,
                item_id: item.item_refid,
                item_name: item.title,
                item_price: item.price,
                quantity: item.quantity,
                amount: Number(item.amount).toFixed(global.ROUNDOFF_UPTO),
                item_tax_name: item.tax_name,
                item_tax_per: item.item_tax_per,
                item_tax_value: item.item_tax_value,
                item_tax_method: item.item_tax_method,
                item_is_devidable: item.item_is_devidable,
                createdBy: billDetails.user_id,
                user_id: billDetails.user_id,
                item_total_tax_value: Number(
                  item.item_tax_value * item.quantity,
                ).toFixed(global.ROUNDOFF_UPTO),
                note: item.note ? item.note : null,
                reason: item.reason ? item.reason : null,
                short_code: item.short_code,
                product_group_id:
                  item.product_group_id != undefined
                    ? item.product_group_id
                    : null,
                product_group_name: item.product_group_name
                  ? item.product_group_name
                  : null,
                discounted_price: item.discounted_price,
                discount_type: item.discount_type,
                discount_rate: item.discount_rate,
                pricebeforeDiscount: item.pricebeforeDiscount
                  ? item.pricebeforeDiscount
                  : 0,
                modified_discount: item.modified_discount,
                discount: item.pricebeforeDiscount
                  ? Number(
                      (
                        (item.pricebeforeDiscount - item.price) *
                        item.quantity
                      ).toFixed(global.ROUNDOFF_UPTO),
                    )
                  : 0,
                is_complimentary: item.amount === 0,
                kitchen_dept: item.kitchen_dept ? item.kitchen_dept : 0,
                hsn_code: item.hsn_code || null,
                is_open_item: item.is_open_item || 0,
                extra_details: item.extra_details,
                has_options: item.has_options ? item.has_options : 0,
                alternative_category_name: item.alternative_category_name,
                alternative_title: item.alternative_title,
              },
              { transaction },
            );
            if (global.reduceStock) {
              await connection.Item.decrement('current_stock', {
                by: Number(item.quantity),
                where: { item_refid: item.item_refid },
                transaction,
              });
              const itemQty = await connection.Item.findOne({
                raw: true,
                attributes: ['current_stock'],
                where: { item_refid: item.item_refid },
                transaction,
              });
              decrementQty.push({
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
            if (
              itemresultEntity &&
              item.isitemwithOption &&
              item.addons &&
              item.addons.length > 0
            ) {
              for (addon of item.addons) {
                // const option_qty = addon.option_type === 0 ? item.quantity : 1;
                let option_qty = 1;
                if (addon.qty) {
                  option_qty = addon.qty;
                }
                const option_total = addon.price * option_qty;
                const option_total_with_tax =
                  option_total + addon.option_tax * option_qty;
                const tempaddon = {
                  kot_items_id: itemresultEntity.id,
                  option_group_name: addon.optionGrptitle,
                  option_group_ref_id: addon.opt_grp_ref_ids,
                  option_ref_id: addon.ref_id,
                  option_name: addon.title,
                  option_price: addon.price,
                  option_tax_amount: addon.option_tax,
                  option_qty,
                  option_total,
                  option_total_with_tax,
                  option_type: addon.option_type,
                  item_ref_id: addon.item_ref_id,
                  option_id: addon.option_id,
                };

                await connection.KotItemOption.create(tempaddon, {
                  transaction,
                });
              }
            }
          }
          if (global.reduceStock && decrementQty && decrementQty.length) {
            // send event
            const data = {
              decrementQtyItems: decrementQty,
            };
            global.ipcEventEmitter.emit(UPDATE_STOCK_QTY, data);
            // reduceBackendStock(decrementQty);
            const result = Object.values(
              decrementQty.reduce((acc, item) => {
                const key = item.item_refid;

                if (!acc[key]) {
                  acc[key] = { ...item };
                } else {
                  acc[key].qty += item.qty;
                  acc[key].quantity += item.quantity;
                  acc[key].current_stock = Math.min(
                    acc[key].current_stock,
                    item.current_stock,
                  );
                }

                return acc;
              }, {}),
            );
            for (let i = 0; i < result.length; i++) {
              addRecordItemStockOutBox(result[i]);
            }
          }
          kot_number = await updateDummykotnumber(
            kotresult.kot_id,
            transaction,
          );

          Object.assign(billDetails.extra_details, {
            kot_numbers: [kot_number],
          });
        }

        if (
          discountHistory &&
          Array.isArray(discountHistory) &&
          discountHistory.length > 0
        ) {
          // order id is not generated at the time of discount added so adding order_id here
          discountHistory.map((discount) => {
            discount.order_id = billData.billDetails.order_id;
          });
          try {
            await connection.SectionwiseDiscounthistory.bulkCreate(
              discountHistory,
              { transaction },
            );
          } catch (error) {}
        }
        const billnumberUpdatedata = {
          quantity,
          bill_number: insertedBillno,
          extra_details: billDetails.extra_details,
          sync_status: 0,
          item_level_total_discount,
        };
        if (global.storeDetails.bill_number_prefix) {
          const custom_bill_number = `${global.storeDetails.bill_number_prefix}${padBillNumber}`;
          Object.assign(billnumberUpdatedata, {
            custom_bill_number,
          });
          Object.assign(responseData, {
            custom_bill_number,
          });
        }

        // check for midnight sale
        const outtime = Date.now();

        if (billData.countMidnightSale) {
          const result = setDateForMidnightOrder();
          if (result) {
            const { orderDate, created_time } = result;
            Object.assign(billnumberUpdatedata, {
              my_order_date: orderDate,
              created_time,
            });
            const out_time = moment(outtime).subtract(1, 'days').format('x');
            Object.assign(billnumberUpdatedata, { outtime: out_time });
          }
        }

        if (
          discountHistory &&
          Array.isArray(discountHistory) &&
          discountHistory.length > 0
        ) {
          Object.assign(billData.billDetails.extra_details, {
            discountHistory,
          });
          Object.assign(billnumberUpdatedata, {
            extra_details: billData.billDetails.extra_details,
          });
        }

        await connection.Bill.update(billnumberUpdatedata, {
          where: {
            id: billResult.id,
          },
          transaction,
        });
      }
      // await connection.Tempnumbers.increment(
      //   ['bill_number', 'kot_number', 'order_number'],
      //   { by: 1, where: { id: 1 } },
      // );
      await fetchAndUpdateBillNumberforquickbill(billDetails, transaction);
      if (
        billDetails &&
        billDetails.waiterTipDetails &&
        billDetails.waiterTipDetails.amount
      ) {
        Object.assign(billDetails.waiterTipDetails, {
          order_id: billDetails.order_id,
        });

        await updateWaitertipDetailsForquickbill(
          billDetails.waiterTipDetails,
          transaction,
        );
      }
      // if kot is placed from captain app and print kot then send event to renderer process to kot print

      if (billData.isCaptainKot && printKOT) {
        const customer = {
          name: billData.billDetails.cust_name,
          phone: billData.billDetails.phone,
        };
        const kotDetails = {
          items: billData.items,
          note: billData.billDetails.note,
          billingType: billData.billDetails.billing_type,
          billing_type: billData.billDetails.billing_type,
          order_id: billData.billDetails.order_id,
          kot_number,
          order_number: nextOrderNumber,
          table_name: billData.billDetails.table_name,
          tableName: billData.billDetails.table_name,
          customer,
          isQuickbillkot: true,
          username: billData.billDetails.createdBy,
        };

        global.mainWindow.webContents.send(PRINT_CSK_KOT, kotDetails);
      }

      responseData.status = 'success';
      responseData.printKOT = printKOT;
      responseData.printBill = printBill;
      responseData.id = insertedBillno;
      responseData.order_id = billDetails.order_id;
      responseData.order_state = billDetails.order_state;
      responseData.nextOrderNumber = nextOrderNumber;
      responseData.kot_number = [kot_number];
      responseData.billing_type = billing_type;
      if (updatedCustomer && updatedCustomer.customer) {
        responseData.updatedCustomer = updatedCustomer.customer;
      }
    }
    await transaction.commit();

    sendLivesyncrequest(true);
  } catch (error) {
    console.error(error);
    responseData.status = 'failure';
    if (transaction) await transaction.rollback();
  } finally {
    clearTimeout(timeoutHandle);
    if (tally_integration) {
      generateTallyXML(billData.billDetails.order_id);
    }
  }
  global.dbOperationisinprogress = false;
  return responseData;
}

async function fetchAndUpdateBillNumberforquickbill(billDetails, transaction) {
  // let transaction;
  try {
    // transaction = await connection.sequelize.transaction();

    // Fetch and lock the temp number row
    const tempNumber = await connection.Tempnumbers.findOne({
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    await tempNumber.increment(['bill_number', 'kot_number', 'order_number'], {
      by: 1,
      where: { id: 1 },
      transaction,
    });

    // Commit the transaction
    // await transaction.commit();
    if (global.orderTypeWiseOrderNumber) {
      // Step 1: Fetch the row
      const tempNumberRow = await connection.Tempnumbers.findOne({
        where: { id: 1 },
        transaction,
      });

      // Step 2: Modify the JSON field in JS
      const jsonField = tempNumberRow.order_type_wise_order_number || {};
      const key = billDetails.billing_type; // or any dynamic key
      if (jsonField[key]) {
        jsonField[key] = (jsonField[key] || 0) + 1;
      } else {
        jsonField[key] = 2;
      }

      // Step 3: Save it back
      await connection.Tempnumbers.update(
        { order_type_wise_order_number: jsonField },
        { where: { id: 1 }, transaction },
      );
    }

    return tempNumber;
  } catch (error) {
    // Rollback the transaction if there's an error
    if (transaction) await transaction.rollback();
    throw error;
  }
}

async function updateDummykotnumber(kot_id, transaction) {
  try {
    const result = await connection.Tempnumbers.findOne({
      raw: true,
      attributes: ['kot_number'],
      where: { id: 1 },
      transaction,
    });
    await connection.KOT.update(
      { kot_number: result.kot_number, sync_status: 0 },
      {
        where: { kot_id },
        transaction,
      },
    );
    return result.kot_number;
  } catch (error) {}
}

async function updateDummykotnumberWithoutTransaction(kot_id) {
  try {
    const result = await connection.Tempnumbers.findOne({
      raw: true,
      attributes: ['kot_number'],
      where: { id: 1 },
    });
    await connection.KOT.update(
      { kot_number: result.kot_number, sync_status: 0 },
      {
        where: { kot_id },
      },
    );
    return result.kot_number;
  } catch (error) {}
}

// this is for bar section kot
async function updateDummyBarkotnumber(kot_id, transaction) {
  try {
    const result = await connection.Tempnumbers.findOne({
      raw: true,
      attributes: ['barSection_kot_number'],
      where: { id: 1 },
      transaction,
    });
    await connection.KOT.update(
      { kot_number: result.barSection_kot_number, sync_status: 0 },
      {
        where: { kot_id },
        transaction,
      },
    );
  } catch (error) {}
}

async function updateBill(params) {
  try {
    const { order_id } = params;
    if (order_id) {
      const updateData = { sync_status: 0 };
      if (params.cust_paid_amount) {
        Object.assign(updateData, {
          cust_paid_amount: params.cust_paid_amount,
        });
      }

      if (params.updatePrintcount) {
        //  connection.sequelize.literal('finalamount')
        Object.assign(updateData, {
          print_status: connection.sequelize.literal('print_status + 1'),
        });
      }
      if (params.draftprintRequested) {
        Object.assign(updateData, {
          draftprint_status: connection.sequelize.literal(
            'draftprint_status + 1',
          ),
        });
      }

      if (params.updatePayment) {
        await connection.BillPayment.update(
          {
            payment_option: params.updatePayment,
          },
          {
            where: {
              order_id,
            },
          },
        );

        Object.assign(updateData, { payment: params.updatePayment });
      }

      await connection.Bill.update(updateData, {
        where: {
          order_id,
        },
      });
      return { status: 200 };
    }
    return { status: 400 };
  } catch (error) {}
}

async function updatereceiptprintCount({ order_id }) {
  try {
    await connection.Bill.update(
      {
        print_status: connection.sequelize.literal('print_status + 1'),
        sync_status: 0,
      },
      {
        where: {
          order_id,
        },
      },
    );
  } catch (error) {}
}

async function getreceiptprintCount({ order_id }) {
  try {
    const count = await connection.Bill.findOne({
      attributes: ['print_status', 'draftprint_status'],
      where: {
        order_id,
      },
    });
    if (count) {
      return count.print_status + count.draftprint_status;
    }
  } catch (error) {
    console.error(error);
  }
  return 0;
}

async function addPreorderform(preorderData) {
  const response = { status: 200, message: '' };
  try {
    if (!preorderData.table_id) {
      Object.assign(response, {
        status: 400,
        message: 'Provide table id',
      });
      return;
    }
    if (!preorderData.customer_mobile) {
      Object.assign(response, {
        status: 400,
        message: 'Provide mobile number',
      });
      return;
    }
    let result;
    if (preorderData.id) {
      const preorderid = preorderData.id;
      delete preorderData.id;
      await connection.PreOrder.update(preorderData, {
        where: {
          id: preorderid,
        },
      });
      result = await connection.PreOrder.findOne({
        raw: true,
        where: {
          id: preorderid,
        },
      });
    } else {
      const rawresult = await connection.PreOrder.create(preorderData);
      result = rawresult.get({ plain: true });
      result = await connection.PreOrder.findOne({
        raw: true,
        where: {
          id: result.id,
        },
      });
    }
    Object.assign(response, {
      status: 200,
      message: 'Success',
      data: result,
    });
    restartPreordersjobs();
  } catch (error) {
    console.error(error);
    Object.assign(response, {
      status: 400,
      message: 'Something went wrong',
    });
  }
  return response;
}

async function getPreordersfilterby({ fromDate, toDate }) {
  let preorderInfolist = [];
  try {
    preorderInfolist = await connection.PreOrder.findAll({
      raw: true,
      where: {
        delivery_at: {
          [connection.Sequelize.Op.between]: [fromDate, toDate],
        },
        status: 'created',
      },
    });
  } catch (error) {}
  return preorderInfolist;
}
/**
 * Updates the waiter for the current table
 * @param {Params} params
 */
async function updateWaiter(params) {
  const response = { status: 200, message: '' };
  try {
    if (params.table_id) {
      await connection.KOT.update(
        {
          waiter: params.waiter,
          waiter_id: params.waiter_id,
          sync_status: 0,
        },
        {
          where: {
            table_id: params.table_id,
            is_active: 1,
          },
        },
      );

      if (params.order_id) {
        await connection.Bill.update(
          {
            waiter: params.waiter,
            waiter_id: params.waiter_id,
            sync_status: 0,
          },
          {
            where: {
              order_id: params.order_id,
            },
          },
        );
      }

      if (params && params.table_id) {
        const table_data = await connection.Table.findOne({
          raw: true,
          attributes: ['extra_details'],
          where: {
            id: params.table_id,
          },
        });
        let extra_details = {};
        if (table_data.extra_details) {
          const extradetails = safeParseformain(table_data.extra_details);
          extra_details = { ...extra_details, ...extradetails };
          if (extra_details.waiter) {
            delete extra_details.waiter;
            delete extra_details.waiter_id;
          }
        }

        const extraDetails = {
          waiter: params.waiter,
          waiter_id: params.waiter_id,
        };
        extra_details = { ...extra_details, ...extraDetails };

        await connection.Table.update(
          {
            extra_details,
          },
          {
            where: {
              id: params.table_id,
            },
          },
        );
      }
      Object.assign(response, {
        status: 200,
        message: 'Success',
      });
    }
  } catch (error) {
    Object.assign(response, {
      status: 400,
      message: 'Something went wrong',
    });
    console.error(error);
  }
  return response;
}
/**
 * Add's new KOT Note for a item
 * @param {KOT Note data} content
 */
async function addItemnote(content) {
  // Check for notes
  const result = await connection.Itemnote.findAll({
    raw: true,
    limit: 1,
    where: {
      item_refid: content.item_refid,
      store_id: content.store_id,
    },
  });
  if (result.length == 0) {
    await connection.Itemnote.create(content);
  } else {
    let notes = result[0].note;
    notes = String(notes).split('###');

    if (!notes.includes(content.note)) {
      notes.push(content.note);
      if (notes.length > 10) {
        notes.shift();
      }
      notes = notes.join('###');
      await connection.Itemnote.update(
        { note: notes },
        {
          where: {
            item_refid: content.item_refid,
          },
        },
      );
    }
  }
}

/**
 * Add's new KOT Note for a item
 * @param {KOT Note data} content
 */
async function deleteItemnote(content) {
  // Check for notes
  const result = await connection.Itemnote.findAll({
    raw: true,
    limit: 1,
    where: {
      item_refid: content.item_refid,
      store_id: content.store_id,
    },
  });
  if (result && result.length) {
    let notes = result[0].note;
    notes = String(notes).split('###');
    notes = notes.filter((item) => item !== content.note);
    notes = notes.join('###');
    await connection.Itemnote.update(
      { note: notes },
      {
        where: {
          item_refid: content.item_refid,
        },
      },
    );
  }
}

async function getKotitemnotes(content) {
  try {
    const result = await connection.Itemnote.findAll({
      raw: true,
      limit: 1,
      where: {
        item_refid: content.item_refid,
        store_id: content.store_id,
      },
    });
    let notes;
    if (result.length > 0) {
      notes = result[0].note;
    }
    const itemNoteGroup = await connection.ItemNoteGroups.findAll({
      raw: true,
      where: {
        item_id: content.item_refid,
        store_id: content.store_id,
      },
    });
    const data = {
      item_refid: content.item_refid,
      item_id: content.item_id,
      notes,
      itemNoteGroup,
    };
    return data;
  } catch (error) {}
}

async function updateItemCurrentStock(content) {
  try {
    const result = await connection.Item.update(
      {
        current_stock: content.stock,
      },
      {
        where: {
          item_refid: content.item_refid,
        },
      },
    );
    return result;
  } catch (error) {}
}

/**
 * returns the item options
 * @param {Request data} requestdata
 */
async function getItemoptions(requestdata) {
  try {
    const options = requestdata.optionids.split(',');
    let optionGroups = [];
    if (options && options.length > 0) {
      optionGroups = await connection.OptionGroup.findAll({
        where: {
          ref_id: {
            [connection.Sequelize.Op.in]: options,
          },
          store_id: requestdata.store_id, // NEW STOREWISE CHANGE 17 JAN 2020
        },
        raw: true,
      });

      if (optionGroups && optionGroups.length > 0) {
        // Make a possible combination of id value in
        // comma seperated column with multiple id's
        for await (element of optionGroups) {
          const combination = `%,${element.ref_id}%`;
          const combination2 = `%,${element.ref_id}`;
          const combination3 = `${element.ref_id},%`;
          const combination4 = element.ref_id;

          const options = await connection.Options.findAll({
            where: {
              [connection.Sequelize.Op.or]: [
                {
                  opt_grp_ref_ids: {
                    [connection.Sequelize.Op.like]: combination,
                  },
                },
                {
                  opt_grp_ref_ids: {
                    [connection.Sequelize.Op.like]: combination2,
                  },
                },
                {
                  opt_grp_ref_ids: {
                    [connection.Sequelize.Op.like]: combination3,
                  },
                },
                {
                  opt_grp_ref_ids: {
                    [connection.Sequelize.Op.like]: combination4,
                  },
                },
              ],
              item_ref_id: requestdata.item_refid,
              store_id: requestdata.store_id, // NEW STOREWISE CHANGE 17 JAN 2020
            },
            raw: true,
          });
          element.options = options;
        }
      }
    }
    const data = {
      optionGroups,
      item_refid: requestdata.item_refid,
    };

    return data;
  } catch (error) {
    console.error(error);
  }
}

async function getOptiongroupandoptions({ store_id }) {
  let optionGroups = [];
  let options = [];
  try {
    optionGroups = await connection.OptionGroup.findAll({
      where: {
        store_id,
      },
      raw: true,
    });
    options = await connection.Options.findAll({
      where: {
        store_id,
      },
      raw: true,
    });
  } catch (error) {
    optionGroups = [];
    options = [];
  }
  return {
    optionGroups,
    options,
  };
}

async function updateEbillstatus({ status, table_id }) {
  try {
    await connection.KOT.update(
      {
        sendEbillcheck: status,
        sync_status: 0,
      },
      {
        where: {
          table_id,
          is_active: 1,
        },
      },
    );
    return 'success';
  } catch (error) {}
  return 'error';
}

/**
 * Updates the delivery boy data
 * @param {Delivery boy data} data
 */
async function updateDeliveryboy(data) {
  try {
    await connection.KOT.update(
      {
        deliveryboy_id: data.deliveryboy_id,
        sync_status: 0,
      },
      {
        where: {
          table_id: data.table_id,
          is_active: 1,
        },
      },
    );
    if (data.bill_number != undefined && data.bill_number != 0) {
      await connection.Bill.update(
        {
          delivery_boy_name: data.name,
          deliveryboy_id: data.deliveryboy_id,
          delivery_boy_phone: data.phone,
          sync_status: 0,
        },
        {
          where: {
            order_id: data.bill_number,
          },
        },
      );
    }

    // update delivery boy name in table's extra_details
    let extra_details = {};
    if (data.table_extra_details) {
      const extraDetails = safeParseformain(data.table_extra_details);
      if (extraDetails) {
        extra_details = {
          ...extraDetails,
        };
      }
    }
    Object.assign(extra_details, {
      delivery_boy_name: data.name,
    });
    const tableUpdateData = {};
    tableUpdateData.extra_details = extra_details;
    await connection.Table.update(
      { extra_details: safeParseformain(extra_details) },
      {
        where: {
          id: Number(data.table_id),
        },
      },
    );
  } catch (error) {
    console.error(error);
  }
}

/**
 * Returns the KOT number
 */
async function fetchKOTnumbers() {
  try {
    const data = await connection.Tempnumbers.findAll({
      raw: true,
      limit: 1,
      where: {
        id: 1,
      },
    });
    if (data.length > 0) return data[0];
  } catch (error) {
    console.error(error);
  }
}

/**
 * Get tables for the store id
 * @param {Store ID} store_id
 */
async function getTables(store_id, parameters) {
  let tables = [];
  let depstoinclude = [];
  if (parameters && parameters.includeDepartments) {
    depstoinclude = String(parameters.includeDepartments).split(',');
  } else if (parameters && !parameters.isTerminal) {
    depstoinclude = getdepartmentstoInclude();
  }
  if (!Array.isArray(depstoinclude)) depstoinclude = [];
  const departmentWheredata = {};
  if (depstoinclude.length > 0) {
    depstoinclude = ['987654', ...depstoinclude];
    departmentWheredata.id = {
      [connection.Sequelize.Op.in]: depstoinclude,
    };
  }
  const tableWheredata = { store_id };
  if (
    parameters &&
    parameters.disabledTabfilter &&
    parameters.disabledTabfilter.length
  ) {
    Object.assign(tableWheredata, {
      order_type_flag: {
        [connection.Sequelize.Op.notIn]: parameters.disabledTabfilter,
      },
    });
  }

  try {
    if (Object.keys(departmentWheredata).length > 0) {
      tables = await connection.Table.findAll({
        raw: true,
        include: [
          {
            model: connection.Department,
            attributes: ['department_name', 'section', 'product_groups', 'id'],
            where: departmentWheredata,
          },
        ],
        where: tableWheredata,
        // order: [['table_name', 'ASC']]
      });
    } else {
      tables = await connection.Table.findAll({
        raw: true,
        include: [
          {
            model: connection.Department,
            attributes: ['department_name', 'section', 'product_groups', 'id'],
          },
        ],
        where: tableWheredata,
        // order: [['table_name', 'ASC']]
      });
    }
  } catch (error) {
    tables = [];
  }
  return tables;
}

async function getTablesDepartment(params) {}

async function getWaiterslist({ store_id }) {
  if (!store_id) {
    store_id = global.storeDetails.store_id;
  }
  try {
    const users = await connection.Waiter.findAll({
      raw: true,
      where: {
        store_id,
      },
      attributes: ['id', 'name', 'phone', 'username'],
    });
    return users;
  } catch (error) {
    return [];
  }
}

/**
 * Returns the customer for that store
 * @param {Parameter if any} params
 */
async function getCustomers(params) {
  const storeList = await connection.Store.findAll({
    raw: true,
    limit: 1,
    where: {
      // NEW STOREWISE CHANGE 17 JAN 2020
      store_id: params.store_id,
    },
  });

  let customers = await params.connection.Customer.findAll({
    raw: true,
    where: {
      store_id: params.store_id,
    },
  });
  if (customers && customers.length > 0 && storeList && storeList.length > 0) {
    customers = customers.map((el) => {
      const o = { ...el };
      o.store_name = storeList[0].store_name;
      return o;
    });
  }

  return customers;
}

async function getCatsWithintime() {
  const catwhereData = { store_id: global.storeDetails.store_id, is_active: 1 };
  const menuCategories = await connection.Category.findAll({
    raw: true,
    order: [['category_sort', 'ASC']],
    where: catwhereData,
  });

  const categories = menuCategories.map((item) => item.category_refid);

  menuCategories.forEach((item, index) => {
    const timings = safeParseformain(item.timings);
    if (timings) {
      let showCategory = false;
      timings.forEach((time) => {
        if (time && time.day) {
          const currentDate = moment();
          const currentDay = currentDate.day();
          const valid_days = time.day;
          if (valid_days.includes(CATEGROY_DAYS_FOR_MAIN[currentDay])) {
            const date = new Date();

            if (time && time?.slots.length) {
              time.slots.forEach((slot) => {
                const isBetween = istimebetweenTwotimeformain(
                  slot.start_time,
                  slot.end_time,
                );
                if (isBetween) {
                  showCategory = true;
                }
              });
            }
          }
          if (!showCategory) {
            const indexToRemove = categories.indexOf(item.category_refid);
            if (indexToRemove !== -1) {
              categories.splice(indexToRemove, 1);
            }
          }
        }
      });
    }
  });
  return categories;
}

async function getMenuitems(store_id, parameters) {
  let items = [];
  let categories = [];
  try {
    const itemsWherequery = { store_id, active: 1 };
    const catwhereData = { store_id, is_active: 1 };
    let groupBy = [];
    let order = [];
    let catstoInclude = [];
    if (parameters && parameters.includeCategories) {
      catstoInclude = String(parameters.includeCategories).split(',');
    } else {
      catstoInclude = getitemcatstoInclude();
    }

    if (useCategoryTimings) {
      // fetch categoried and check timing
      const catsWithintime = await getCatsWithintime();

      // check catswithintime are in access level or not
      if (
        catstoInclude &&
        catstoInclude.length &&
        catsWithintime &&
        catsWithintime.length
      ) {
        const outputArray = catsWithintime.filter((value) =>
          catstoInclude.includes(String(value)),
        );
        catstoInclude = outputArray;
      }

      if (!catstoInclude.length && catsWithintime && catsWithintime.length) {
        catstoInclude = catsWithintime;
      }

      fetchCategoryTimingsandsetcronjob(connection);
    }

    if (
      catstoInclude &&
      Array.isArray(catstoInclude) &&
      catstoInclude.length > 0
    ) {
      itemsWherequery.category_ref_ids = {
        [connection.Sequelize.Op.in]: catstoInclude,
      };
      Object.assign(catwhereData, {
        category_refid: {
          [connection.Sequelize.Op.in]: catstoInclude,
        },
      });
    }
    const include = [
      {
        model: connection.Category,
        attributes: ['category_name', 'alternative_title', 'color'],
        where: { store_id, is_active: 1 },
      },
      {
        model: connection.ProductGroup,
        attributes: ['product_group_name'],
        where: {
          // NEW STOREWISE CHANGE 17 JAN 2020
          store_id,
        },
      },
      {
        model: connection.Category,
        required: true, // This ensures that only records with matching values in TableB are fetched
        where: connection.Sequelize.literal(
          'mpos_category.category_refid = mpos_item.category_ref_ids',
        ),
      },
    ];

    // get id of order child
    const billId = await connection.BillItem.findOne({
      raw: true,
      attributes: ['id'],
      order: [['id', 'DESC']],
      limit: 1,
    });

    let id;
    // to optimize item sort by qty and item sort by amount we conside only 2000 items
    if (billId && billId.id) {
      id = billId.id;
    }
    if (id && id > 8000) {
      id -= 8000;
    } else {
      id = 1;
    }

    if (parameters) {
      if (parameters.sortmenuItemsby) {
        switch (parameters.sortmenuItemsby) {
          case MENU_ITEMSORT_TYPES.BY_CODE:
            order.push(['short_code', 'ASC']);
            break;
          case MENU_ITEMSORT_TYPES.BY_TOPSOLD_AMT:
            include.push({
              model: connection.BillItem,
              attributes: [
                [
                  connection.Sequelize.fn(
                    'sum',
                    connection.Sequelize.col('mpos_order_child.total'),
                  ),
                  'itemorderTotal',
                ],
              ],
              required: false,
              where: {
                id: {
                  [Op.gt]: id, // Use Op.gt for greater than comparison
                },
              },
            });
            order.push([
              connection.sequelize.literal('`mpos_order_child.itemorderTotal`'),
              'DESC',
            ]);
            groupBy.push('mpos_item.item_refid');
            break;
          case MENU_ITEMSORT_TYPES.BY_TOPSOLD_QTY:
            include.push({
              model: connection.BillItem,
              attributes: [
                [
                  connection.Sequelize.fn(
                    'sum',
                    connection.Sequelize.col('mpos_order_child.quantity'),
                  ),
                  'itemorderTotal',
                ],
              ],
              required: false,
              where: {
                id: {
                  [Op.gt]: id, // Use Op.gt for greater than comparison
                },
              },
            });
            order.push([
              connection.sequelize.literal('`mpos_order_child.itemorderTotal`'),
              'DESC',
            ]);
            groupBy.push('mpos_item.item_refid');
            break;
          case MENU_ITEMSORT_TYPES.BY_NAME:
            order.push(['title', 'ASC']);
            break;
          default:
            break;
        }
      }
    }
    if (groupBy.length == 0) groupBy = undefined;
    if (order.length == 0) order = undefined;
    items = await connection.Item.findAll({
      raw: true,
      include,
      where: itemsWherequery,
      group: groupBy,
      order,
    });

    categories = await connection.Category.findAll({
      raw: true,
      // include: {
      //   model: connection.Item,
      //   attributes: ['active', 'category_ref_ids', 'item_id'],
      //   where: {
      //     active: 1,
      //     store_id,
      //   },
      //   on: {
      //     category_refid: connection.sequelize.literal(
      //       'mpos_categories.category_refid = mpos_items.category_ref_ids',
      //     ),
      //   },
      //   required: false,
      // },
      // distinct: true,
      // group: ['mpos_categories.category_refid'],
      // having: connection.Sequelize.literal('mpos_items.active = 1'),
      order: [['category_sort', 'ASC']],
      where: catwhereData,
    });
  } catch (error) {
    console.error(error);
  }
  return { items, categories };
}

async function checkifStoreisloggedin(store_id) {
  const storeDetails = await connection.Store.findOne({
    attributes: ['settings'],
    raw: true,
    where: { store_id },
  });
  if (storeDetails) {
    const settings = safeParseformain(storeDetails.settings);
    if (!settings.userlogged && global.mainWindow) {
      global.mainWindow.webContents.send(REMOTE_FORCE_LOGUT);
    }
  }
}

/**
 * Returns the current store info details
 */
async function getOrderwindowdetails(store_id, parameters) {
  try {
    await checkifStoreisloggedin(store_id);
    const responseData = {};
    if (global.isLoadMenuInProgress) {
      responseData.status = 'failure';
      responseData.message =
        'Load menu is in process. Please try after some time';
      return responseData;
    }
    if (!bill_number_length) {
      if (global.storeDetails && global.storeDetails.extra_info) {
        const extra_info = safeParseformain(global.storeDetails.extra_info);
        bill_number_length = Number(extra_info.bill_number_length);
      }
    }

    const tables = await getTables(store_id, parameters);
    const { items, categories } = await getMenuitems(store_id, parameters);

    const taxes = await getItemTaxes(store_id, items);
    const itemPrices = await getItemPrices(store_id);

    global.itemsList = items;
    global.menu_id = items[0]?.tmpos_menu_id;
    const options = await connection.Options.findAll({
      raw: true,
      where: {
        store_id,
      },
    });
    global.optionsList = options;
    const modifiers = await connection.Modifiers.findAll({
      raw: true,
      where: {
        store_id,
      },
    });
    global.modifiersList = modifiers;
    const itemlevelChargesExists = await connection.Charges.count({
      where: {
        store_id,
        charge_applicable_on: {
          [connection.Sequelize.Op.in]: [1, 2],
        },
      },
    });

    if (itemlevelChargesExists > 0) {
      await getItemlevelcharges(items, store_id);
    }

    let depstoinclude = [];
    if (parameters && parameters.includeDepartments) {
      depstoinclude = String(parameters.includeDepartments).split(',');
    }
    if (!Array.isArray(depstoinclude)) depstoinclude = [];
    const departmentWheredata = {};
    departmentWheredata.store_id = store_id;
    if (depstoinclude.length > 0) {
      departmentWheredata.id = {
        [connection.Sequelize.Op.in]: depstoinclude,
      };
    }

    const departments = await connection.Department.findAll({
      raw: true,
      // where: {//NEW STOREWISE CHANGE 17 JAN 2020
      //     store_id
      // }
      where: departmentWheredata,
    });
    // 0=order level   1=item level    2=on both
    const charges = await connection.Charges.findAll({
      raw: true,
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        store_id,
        charge_applicable_on: {
          [connection.Sequelize.Op.in]: [0, 2],
        },
      },
    });
    const storeList = await connection.Store.findAll({
      raw: true,
      limit: 1,
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        store_id,
      },
    });

    let customers = await connection.Customer.findAll({
      raw: true,
      where: {
        store_id,
      },
    });

    if (
      customers &&
      customers.length > 0 &&
      storeList &&
      storeList.length > 0
    ) {
      customers = customers.map((el) => {
        const o = { ...el };
        o.store_name = storeList[0].store_name;
        return o;
      });
    }

    const deliveryBoys = await connection.DeliveryBoy.findAll({
      raw: true,
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        store_id,
      },
    });

    global.deliveryBoys = deliveryBoys;

    const shortcuts = await connection.Shortcuts.findAll({ raw: true });

    const kitchenDepartments = await connection.KitchenDepartment.findAll({
      raw: true,
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        // store_id
        isactive: 1,
      },
    });
    const outletKitchenDepartments = await connection.KitchenDepartment.findAll(
      {
        raw: true,
        where: {
          store_id,
          isactive: 1,
        },
      },
    );
    const outletProductGroups = await connection.ProductGroup.findAll({
      raw: true,
      where: {
        store_id,
      },
    });

    const productGroups =
      await connection.ProductGroup.getonlyexisitngGroups(store_id);
    const waiters = await getWaiterslist({ store_id });
    const multipricing_settings =
      await serverdbConnection.MultipricingSettings.findAll({
        where: {
          store_id,
        },
      });

    const outletTaxes = await serverdbConnection.Tax.findAll({
      where: {
        store_id: global.storeDetails.store_id,
      },
    });

    const users = await serverdbConnection.User.findAll({
      where: {
        store_id: global.storeDetails.store_id,
      },
    });

    const orderTypesData = await connection.OrderTypes.findAll({
      raw: true,
      // where: {
      //   store_id,
      // },
    });

    const orderTypes = orderTypesData.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
    global.orderTypes = orderTypes;

    const platformMappingDetails = await connection.PlatformMapping.findAll({
      raw: true,
      where: {
        store_id: global.storeDetails.store_id,
      },
    });

    // if (global.settingsConfig && !platformCatalogueitems.length) {
    //   const { platformItems, platformCategories } =
    //     await getPlatformCatalogueitems();
    //   platformCatalogueitems = platformItems;
    //   platformCatalogueCategories = platformCategories;
    // }
    const orderwindowData = {
      items,
      tables,
      categories,
      departments,
      charges,
      customers,
      deliveryBoys,
      shortcuts,
      kitchenDepartments,
      productGroups,
      waiters,
      options,
      multipricing_settings,
      platformCatalogueitems,
      platformCatalogueCategories,
      outletKitchenDepartments,
      outletTaxes,
      outletProductGroups,
      taxes,
      itemPrices,
      modifiers,
      users,
      orderTypes,
      platformMappingDetails,
    };

    return orderwindowData;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Adds the item level charges if exists
 * @param {Items} items
 * @param {*} store_id
 */
async function getItemlevelcharges(items, store_id) {
  if (items && Array.isArray(items) && items.length > 0) {
    for (const currentItem of items) {
      const combination = `%,${currentItem.item_refid}%`;
      const combination2 = `%,${currentItem.item_refid}`;
      const combination3 = `${currentItem.item_refid},%`;
      const combination4 = currentItem.item_refid;

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
        },
        raw: true,
      });
      if (options.length > 0) {
        currentItem.itemlevelCharges = options;
      }
    }
  }
}

async function updateCustomerforanorder(customerupdateData) {
  try {
    if (customerupdateData) {
      const { customer } = customerupdateData;
      const { customer_name } = customerupdateData;
      const { customer_mobile } = customerupdateData;

      if (
        customerupdateData.order_id != undefined &&
        customerupdateData.order_id != 0
      ) {
        await connection.Bill.update(
          {
            cust_name: customer != undefined ? customer.name : customer_name,
            phone: customer != undefined ? customer.phone : customer_mobile,
            email: customer != undefined ? customer.email : '',
            line_1: customer != undefined ? customer.address_line1 : '',
            line_2: customer != undefined ? customer.address_line2 : '',
            sync_status: 0,
          },
          {
            where: {
              order_id: customerupdateData.order_id,
            },
          },
        );
      }
      if (customerupdateData.table_id) {
        await connection.KOT.update(
          {
            customer_name:
              customer != undefined ? customer.name : customer_name,
            customer_mobile:
              customer != undefined ? customer.phone : customer_mobile,
            customer_id: customer != undefined ? customer.id : 0,
            sync_status: 0,
          },
          {
            where: {
              table_id: customerupdateData.table_id,
              is_active: 1,
            },
          },
        );

        const activeKot = await connection.KOT.findAll({
          where: {
            table_id: customerupdateData.table_id,
            is_active: 1,
          },
        });
        if (activeKot && activeKot.length) {
          const table_data = await connection.Table.findOne({
            raw: true,
            attributes: ['extra_details'],
            where: {
              id: customerupdateData.table_id,
            },
          });
          let extra_details = {};
          if (table_data.extra_details) {
            const extradetails = safeParseformain(table_data.extra_details);
            extra_details = { ...extra_details, ...extradetails };
          }

          let extraDetails = {
            customer_name:
              customer != undefined ? customer.name : customer_name,
            customer_mobile:
              customer != undefined ? customer.phone : customer_mobile,
          };
          extra_details = { ...extra_details, ...extraDetails };

          await connection.Table.update(
            {
              extra_details,
            },
            {
              where: {
                id: customerupdateData.table_id,
              },
            },
          );
        }
      }
    }
    return 'success';
  } catch (error) {
    console.error(error);
    return 'failure';
  }
}

// async function updateCustoerOnTable(customerupdateData) {
//   const table_data = await connection.Table.findOne({
//     raw: true,
//     attributes: ['extra_details'],
//     where: {
//       id: customerupdateData.table_id,
//     },
//   });
//   let extra_details = {};
//   if (table_data.extra_details) {
//     const extradetails = safeParseformain(table_data.extra_details);
//     extra_details = { ...extra_details, ...extradetails };
//   }

//   let extraDetails = {
//     customer_name: customer != undefined ? customer.name : customer_name,
//     customer_mobile: customer != undefined ? customer.phone : customer_mobile,
//   };
//   extra_details = { ...extra_details, ...extraDetails };

//   await connection.Table.update(
//     {
//       extra_details,
//     },
//     {
//       where: {
//         id: customerupdateData.table_id,
//       },
//     },
//   );
// }
async function getDefaultpaymode() {
  let defaultPays = await connection.Settings.findAll({
    raw: true,
    where: {
      id: DEFAULT_PAYMENT_MODE,
    },
  });
  if (defaultPays && Array.isArray(defaultPays) && defaultPays.length > 0) {
    defaultPays = defaultPays[0];
  } else {
    defaultPays = undefined;
  }
  return defaultPays;
}
/**
 * Updates charges data
 * @param {Charges data} updatechargesData
 */
async function updateCharges(updatechargesData) {
  try {
    if (!updatechargesData) {
      return { status: 400, message: 'failure' };
    }
    const { allowchargesafterPrint } = updatechargesData;
    if (!allowchargesafterPrint) {
      const tableState = await connection.Table.findAll({
        limit: 1,
        raw: true,
        where: {
          id: updatechargesData.table_id,
          table_action_flag: 3, // BIll printed
        },
      });
      if (tableState && tableState.length > 0) {
        return {
          status: 400,
          message: 'Cannot apply charges after bill printed',
        };
      }
    }

    if (
      updatechargesData.order_id &&
      updatechargesData.addtoBillcharges &&
      updatechargesData.billupdateData
    ) {
      const { billupdateData } = updatechargesData;
      if (billupdateData.payment !== 'None') {
        addPayment({
          order_id: updatechargesData.order_id,
          payment_option: billupdateData.payment || 'Cash',
          amount: billupdateData.order_total,
          isSplitpayment: false,
        });
      }

      await connection.BillCharges.update(
        { status_flag: 1 },
        {
          where: { order_id: updatechargesData.order_id },
        },
      );

      if (billupdateData) {
        Object.assign(billupdateData, { sync_status: 0 });
        await connection.Bill.update(billupdateData, {
          where: { order_id: updatechargesData.order_id },
        });
      }
    }
    await connection.KOTCharges.destroy({
      where: { table_id: updatechargesData.table_id, is_active: 1 },
    });

    if (hasPath(updatechargesData, 'defaultchargesRemoved')) {
      connection.KOT.update(
        {
          field2: updatechargesData.defaultchargesRemoved,
          sync_status: 0,
        },
        {
          where: { table_id: updatechargesData.table_id, is_active: 1 },
        },
      );
    }

    if (
      updatechargesData.tempCharges != undefined &&
      updatechargesData.tempCharges.length > 0
    ) {
      const { table_id } = updatechargesData;
      updatechargesData.tempCharges.forEach(async (element) => {
        const data = {
          order_id: updatechargesData.order_id,
          title: element.title,
          value: element.amounttoAdd,
          amount: element.amount,
          is_default_flag: element.is_default,
          order_billing_flag: element.billing_flag,
          per_or_fixed: element.per_or_fixed,
          charge_id: element.charge_id,
          is_tax_included: element.is_tax_included,
          calculated_tax: element.calculated_tax,
          tax_divided: element.tax_divided,
          tax_title: element.tax_title,
          tax_amount: element.tax_amount,
          extra_details: safeParseformain(element.extra_details),
        };

        // tempCharges.push(data);
        try {
          if (updatechargesData.addtoBillcharges) {
            await connection.BillCharges.create(data);
          }

          delete data.value;
          data.table_id = table_id;
          if (data.calculated_tax) delete data.calculated_tax;
          Object.assign(data, {
            is_tax_applicable: element.is_tax_applicable,
            tax_amount: element.tax_amount,
          });
          await connection.KOTCharges.create(data);
        } catch (error) {
          console.error(error);
        }
      });

      /**
       * Reset the payment details
       */
      if (updatechargesData.addtoBillcharges) {
        const defaultPays = await getDefaultpaymode();
        const { billTotal } = updatechargesData;

        if (defaultPays.value !== 'None') {
          console.log('update none payment in charhes');
          const paymentDetails = {
            order_id: updatechargesData.order_id,
            payment_option: defaultPays ? defaultPays.value : 'Cash',
            amount: billTotal,
          };
          await connection.BillPayment.destroy({
            where: {
              order_id: updatechargesData.order_id,
            },
          });
          const payResult = await addPayment(paymentDetails);
          const resultEntityObj = payResult
            ? payResult.get({ plain: true })
            : undefined;
          const insertedPayid = resultEntityObj ? resultEntityObj.id : 0;

          await connection.KOT.update(
            { payment_id: insertedPayid, sync_status: 0 },
            { where: { table_id: updatechargesData.table_id, is_active: 1 } },
          );

          if (paymentDetails) {
            await connection.Bill.update(
              {
                payment: paymentDetails.payment_option,
                sync_status: 0,
              },
              {
                where: {
                  order_id: updatechargesData.order_id,
                },
              },
            );
          }
        }
      }
      return { status: 200, message: 'Charges applied' };
    }
  } catch (error) {
    console.error(error);
    return { status: 400, message: 'failure' };
  }
}

/**
 * Updates the payment info
 * @param {Payment info} paymentData
 */
async function updatePayment(paymentData) {
  console.log(
    'Message=Update bill payment payload',
    JSON.stringify(paymentData),
  );
  const response = { status: 400, message: '' };
  if (paymentData) {
    try {
      await connection.BillPayment.destroy({
        where: {
          order_id: paymentData.order_id,
        },
      });
      await connection.Duepayments.destroy({
        where: {
          order_id: paymentData.order_id,
        },
      });

      const order = await connection.Bill.findOne({
        attributes: ['order_total', 'table_name'],
        where: {
          order_id: paymentData.order_id,
        },
      });

      let isSplittedBill = false;
      if (/-Per-|-Por-|-Part/.test(order.table_name)) {
        isSplittedBill = true;
      }

      if (
        !isSplittedBill &&
        paymentData.isSplitpayment &&
        !paymentData.addasdueChecked &&
        paymentData.payList &&
        paymentData.payList.length
      ) {
        let paymentTotal = 0;
        paymentData.payList.forEach((payment) => {
          paymentTotal += Number(payment.amount);
        });

        console.log('paymentTotal:', paymentTotal);
        console.log('order.order_total::', order);

        if (order.order_total !== paymentTotal) {
          response.status = 400;
          response.message = 'Payment total not matching with order total';
          response.table_id = paymentData.table_id;
          return response;
        }
      }

      const { addasdueChecked } = paymentData;
      const billupdateData = {
        payment: paymentData.paymentName,
        due_payment: 0,
        sync_status: 0,
      };

      let payment_info;
      if (paymentData.isSplitpayment) {
        // const newpaymentList = uniqBy(paymentData.payList, 'payment_option');
        // const addpayResult =
        //   await connection.BillPayment.bulkCreate(newpaymentList);
        const addpayResult = await connection.BillPayment.bulkCreate(
          paymentData.payList,
        );
        if (
          addpayResult != undefined &&
          addpayResult.length > 0 &&
          addpayResult[0].dataValues
        ) {
          if (addpayResult[0].dataValues.id != undefined) {
            await connection.KOT.update(
              { payment_id: addpayResult[0].dataValues.id, sync_status: 0 },
              { where: { table_id: paymentData.table_id, is_active: 1 } },
            );
          }
        }
        if (addasdueChecked) {
          billupdateData.due_payment = paymentData.due_payment;
          // billupdateData.cust_paid_amount =
          //   Number(paymentData.billTotal) - Number(paymentData.due_payment);
          billupdateData.hasDuepayment = 1;
          payment_info = paymentData.payList
            .map((elem) => `${elem.payment_option}-${elem.amount}`)
            .join(',');
        } else {
          billupdateData.hasDuepayment = 0;
          // billupdateData.cust_paid_amount = Number(paymentData.billTotal);
          if (paymentData.cust_paid_amount) {
            billupdateData.cust_paid_amount = Number(
              paymentData.cust_paid_amount,
            );
          } else {
            billupdateData.cust_paid_amount = 0;
          }
        }
      } else {
        if (!addasdueChecked) {
          if (
            paymentData.paymentDetails.payment_option === null ||
            paymentData.paymentDetails.payment_option === 'NULL'
          ) {
            const defaultPays = await getDefaultpaymode();
            paymentData.paymentDetails.payment_option = defaultPays
              ? defaultPays.value
              : 'Cash';
            paymentData.paymentName = defaultPays ? defaultPays.value : 'Cash';
          }
          const addPayresult = await addPayment(paymentData.paymentDetails);
          const resultEntityObj = addPayresult
            ? addPayresult.get({ plain: true })
            : undefined;
          const insertedPayid = resultEntityObj ? resultEntityObj.id : 0;

          await connection.KOT.update(
            { payment_id: insertedPayid, sync_status: 0 },
            { where: { table_id: paymentData.table_id, is_active: 1 } },
          );
        }

        if (addasdueChecked) {
          billupdateData.due_payment = paymentData.paymentDetails.amount;
          billupdateData.cust_paid_amount = 0;
          billupdateData.hasDuepayment = 1;
        } else {
          billupdateData.hasDuepayment = 0;
          if (paymentData.cust_paid_amount) {
            billupdateData.cust_paid_amount = Number(
              paymentData.cust_paid_amount,
            );
          } else {
            billupdateData.cust_paid_amount = 0;
          }
          // billupdateData.cust_paid_amount = Number(paymentData.billTotal);
        }
      }

      await connection.Bill.update(billupdateData, {
        where: {
          order_id: paymentData.order_id,
        },
      });
      const payment_modes = await connection.BillPayment.findAll({
        raw: true,
        where: {
          order_id: paymentData.order_id,
        },
      });

      if (
        addasdueChecked &&
        billupdateData.due_payment != 0 &&
        paymentData.dueHistory
      ) {
        let received_amount = 0;
        if (paymentData.isSplitpayment) {
          received_amount = paymentData.received_amount;
        } else {
          received_amount = 0;
        }
        addDuepaymenthistory({
          order_id: paymentData.order_id,
          bill_number: paymentData.bill_number,
          store_id: paymentData.dueHistory.store_id,
          cust_mobile: paymentData.dueHistory.cust_mobile,
          customer_name: paymentData.dueHistory.cust_name,
          amount_to_pay: paymentData.billTotal,
          due_amount: billupdateData.due_payment,
          received_amount,
          payment_info,
          billing_user_id: paymentData.dueHistory.billing_user_id,
          transaction_id: global.generateId(),
        });
      }

      const order_details = await connection.Bill.findOne({
        raw: true,
        attributes: ['billing_type'],
        where: {
          order_id: paymentData.order_id,
        },
      });

      Object.assign(response, {
        status: 200,
        message: 'Payment applied',
        payment_modes,
        printBill: paymentData.printBill,
        billing_type: order_details?.billing_type,
      });

      return response;
    } catch (error) {
      console.error(error);

      return 'failure';
    }
  }
  return response;
}

/**
 * Add's pay due history
 * @param {Due History} params
 */
async function addDuepaymenthistory(params) {
  try {
    // await connection.Duepayments.destroy({
    //     where: {
    //         order_id: params.order_id
    //     }
    // });
    // check for midnight sale
    if (global.countMidnightSale) {
      const result = setDateForMidnightOrder();
      if (result && result.created_time) {
        const { created_time } = result;
        Object.assign(params, {
          created_time,
        });
      }
    }
    await connection.Duepayments.create(params);
  } catch (error) {
    console.log(
      `Message="Due payment history create error"`,
      JSON.stringify(params),
    );
    console.error(error);
  }
}

async function getOrderbillnumber({ order_id }) {
  try {
    const result = await connection.Bill.findOne({
      raw: true,
      attributes: ['bill_number'],
      where: {
        order_id,
      },
    });
    if (result) {
      return result.bill_number;
    }
  } catch (error) {}
}

async function getOrderdetails(order_id) {
  const response = {};
  try {
    const billDetails = await connection.Bill.findAll({
      where: {
        order_id,
      },
      include: [
        {
          as: 'tmpos_order_child',
          model: connection.BillItem,
        },
      ],
    });
    response.status = 200;
    response.billDetails = billDetails;
  } catch (error) {
    console.error(error);

    response.status = 400;
  }
  return response;
}
/**
 * Update discount
 * @param {Discount info} discountData
 */
async function updateDiscount(discountData) {
  try {
    const { allowdiscountafterPrint } = discountData;
    if (!allowdiscountafterPrint) {
      const tableState = await connection.Table.findAll({
        limit: 1,
        raw: true,
        where: {
          id: discountData.table_id,
          table_action_flag: 3, // BIll printed
        },
      });
      if (tableState && tableState.length > 0) {
        return {
          status: 400,
          message: 'Cannot apply discount after bill printed',
        };
      }
    }
    const discountUpdatedata = discountData.data;
    Object.assign(discountUpdatedata, {
      sync_status: 0,
    });
    await connection.KOT.update(discountUpdatedata, {
      where: {
        table_id: discountData.table_id,
        is_active: 1,
      },
    });
    if (discountData.order_id) {
      const { billupdateData } = discountData;
      Object.assign(billupdateData, { sync_status: 0 });
      await connection.Bill.update(billupdateData, {
        where: { order_id: discountData.order_id },
      });
      const { paymentDetails } = discountData;
      await addPayment(paymentDetails);

      await connection.BillCharges.update(
        { status_flag: 1 },
        {
          where: { order_id: discountData.order_id },
        },
      );
      if (discountData.tempCharges && discountData.tempCharges.length > 0) {
        discountData.tempCharges.forEach(async (element) => {
          const charge = {
            order_id: discountData.order_id,
            title: element.title,
            value: element.amounttoAdd,
            amount: element.amount,
            is_default_flag: element.is_default,
            order_billing_flag: element.billing_flag,
            per_or_fixed: element.per_or_fixed,
            charge_id: element.charge_id,
            is_tax_included: element.is_tax_included,
            calculated_tax: element.calculated_tax,
            tax_divided: element.tax_divided,
            tax_title: element.tax_title,
            tax_amount: element.tax_amount,
            extra_details: safeParseformain(element.extra_details),
          };
          await connection.BillCharges.create(charge);
        });
      }
      if (discountData.couponDisounthistorydata) {
        await addCouponhistory(discountData.couponDisounthistorydata);
      }
    }

    return { status: 200, message: 'Discount applied' };
  } catch (error) {
    console.error(error);
    return { status: 400, message: 'error' };
  }
}

/**
 * Coupon history info
 * @param {Coupon history data} params
 */
async function addCouponhistory(params, transaction) {
  try {
    await connection.CoupondiscountHistory.destroy({
      where: {
        order_id: params.order_id,
      },
      transaction,
    });
    await connection.CoupondiscountHistory.create(params, { transaction });
  } catch (error) {
    console.error(error);
  }
}

async function sendrefreshCustomerspingtowindow(customer) {
  betteripcMain.callRenderer(
    global.mainWindow,
    ASYNC_LISTEN_CUSTOMER_UPDATES,
    customer,
  );
}
/**
 * Add's new customer
 * @param {Customer data} customer
 */
async function addCustomer(customer) {
  try {
    if (customer) {
      const result = await connection.Customer.findAll({
        raw: true,
        limit: 1,
        where: {
          phone: customer.phone,
          store_id: customer.store_id,
        },
      });

      if (customer.id) delete customer.id;

      if (result.length > 0) {
        if (!customer.name) {
          delete customer.name;
        }
        Object.assign(customer, {
          sync_flag: 0,
        });
        await connection.Customer.update(customer, {
          where: {
            phone: customer.phone,
            store_id: customer.store_id,
          },
        });

        const customerresultEntity = await connection.Customer.findAll({
          raw: true,
          limit: 1,
          where: {
            phone: customer.phone,
            store_id: customer.store_id,
          },
        });
        customer = customerresultEntity[0];
      } else {
        const createdDate = moment().format('YYYY-MM-DD HH:mm:ss');
        Object.assign(customer, { createdDate });
        const customerResult = await connection.Customer.create(customer);
        customer = customerResult.get({ plain: true });
      }
      sendrefreshCustomerspingtowindow(customer);
      syncCustomersifany({ connection, store_id: customer.store_id });
      return { status: 200, message: 'success', customer };
    }
  } catch (error) {
    return { status: 400, message: 'error' };
  }

  return { status: 400, message: 'error' };
}

async function addCustomerWithTransaction(customer, transaction) {
  try {
    if (customer) {
      const result = await connection.Customer.findOne({
        raw: true,
        limit: 1,
        where: {
          phone: customer.phone,
          store_id: customer.store_id,
        },
        transaction,
      });

      if (customer.id) delete customer.id;

      if (result.length > 0) {
        if (!customer.name) {
          delete customer.name;
        }
        Object.assign(customer, {
          sync_flag: 0,
        });
        await connection.Customer.update(customer, {
          where: {
            phone: customer.phone,
            store_id: customer.store_id,
          },
          transaction,
        });
        const customerresultEntity = await connection.Customer.findOne({
          raw: true,
          limit: 1,
          where: {
            phone: customer.phone,
            store_id: customer.store_id,
          },
          transaction,
        });
        customer = customerresultEntity[0];
      } else {
        const createdDate = moment().format('YYYY-MM-DD HH:mm:ss');
        Object.assign(customer, { createdDate });
        console.time('add customer');
        const customerResult = await connection.Customer.create(customer, {
          transaction,
        });
        console.timeEnd('add customer');
        customer = customerResult.get({ plain: true });
      }

      sendrefreshCustomerspingtowindow(customer);
      syncCustomersifany({ connection, store_id: customer.store_id });
      return { status: 200, message: 'success', customer };
    }
  } catch (error) {
    return { status: 400, message: 'error' };
  }

  return { status: 400, message: 'error' };
}

/**
 * Transfers the KOT item to new table
 * @param {Transfer items params} params
 */
async function transferKOTItem(params) {
  if (params) {
    try {
      const isbillGeneratedfordesttable = await isBillgeneratedfortable(
        params.destinationtable,
      );
      if (isbillGeneratedfordesttable && !global.allowModifyBill) {
        return { status: 400, message: 'Bill is saved for destination table.' };
      }
      const isbillGeneratedforcurrenttable = await isBillgeneratedfortable(
        params.currentTable,
      );
      if (isbillGeneratedforcurrenttable) {
        return { status: 400, message: 'Bill is saved for current table.' };
      }

      let hasactivePreviouskot = 0;

      // Object.assign(kotDetails, {
      //     kot_uniqueid: global.generateId()
      // });
      // for showing proper status in live tracking set status and sync item
      const kotnosList = new Set();
      if (params.selectedItems) {
        for (const item of params.selectedItems) {
          if (!kotnosList.has(item.kot_id)) {
            kotnosList.add(item.kot_id);
          }
          await connection.KOTItem.update(
            { status: 4, createdBy: item.createdBy },
            {
              where: {
                id: item.kot_item_id,
              },
            },
          );
          Object.assign(item, { comment: '##DELETE_THIS_ITEM##' });
          item.item_name = item.title;
          await connection.KOTItem.create(item);
          await connection.KOTItemcharges.update(
            { table_id: params.destinationtable },
            {
              where: {
                table_id: params.currentTable,
                itemtitle: {
                  [Op.like]: `%${item.title}%`,
                },
              },
            },
          );
          Object.assign(item, { comment: '' });

          // get kot amount total for this item
          const kot_amount = await connection.KOT.findOne({
            raw: true,
            attributes: ['amount'],
            where: {
              kot_id: item.kot_id,
            },
          });

          // update kot amount total for this item kot
          const updated_kot_amount = (kot_amount.amount - item.amount).toFixed(
            ROUNDOFF_UPTO,
          );
          await connection.KOT.update(
            {
              amount: updated_kot_amount,
              sync_status: 0,
            },
            {
              where: {
                is_active: 1,
                table_id: params.currentTable,
                kot_id: item.kot_id,
              },
            },
          );
        }
      }

      Object.assign(params, {
        kot_uniqueid: global.generateId(),
      });
      const extra_details = {};
      hasactivePreviouskot = await connection.KOT.count({
        where: { table_id: params.destinationtable, is_active: 1 },
      });
      if (hasactivePreviouskot) {
        Object.assign(extra_details, {
          kot_state: 'Running KOT',
        });
      }
      let nextOrderNumber = 1;
      if (!hasactivePreviouskot) {
        nextOrderNumber = await getResettedordernumberifexist();
        if (global.orderTypeWiseOrderNumber) {
          nextOrderNumber = safeParseformain(nextOrderNumber);
          if (nextOrderNumber && nextOrderNumber[params.billing_type]) {
            nextOrderNumber = nextOrderNumber[params.billing_type];
          } else {
            nextOrderNumber = 1;
          }
        }
      } else if (hasactivePreviouskot && global.orderTypeWiseOrderNumber) {
        const prevKot = await connection.KOT.findOne({
          raw: true,
          where: { table_id: params.destinationtable, is_active: 1 },
        });
        if (prevKot && prevKot.extra_details) {
          const extra_details = safeParseformain(prevKot.extra_details);
          nextOrderNumber = extra_details.order_number;
        }
      }

      if (nextOrderNumber) {
        Object.assign(extra_details, {
          order_number: nextOrderNumber,
        });
      }
      const oldKot = await connection.KOT.findOne({
        raw: true,
        where: {
          is_active: 1,
          table_id: params.currentTable,
        },
      });
      let kotresult = await connection.KOT.create({
        table_id: params.destinationtable,
        table_name: params.destinationTableName,
        amount: params.newKOTtotal,
        persons: 1,
        createdBy: params.createdBy,
        user_id: params.user_id,
        store_id: params.store_id,
        kot_uniqueid: params.kot_uniqueid,
        billing_type: params.billing_type,
        status: params.status,
        extra_details,
        waiter: oldKot.waiter,
        waiter_id: oldKot.waiter_id,
        customer_name: oldKot.customer_name,
        customer_mobile: oldKot.customer_mobile,
        customer_id: oldKot.customer_id,
        note: params.note,
      });
      kotresult = kotresult.get({ plain: true });

      const kotnoSet = new Set();
      if (kotresult && kotresult.kot_id) {
        for (const item of params.selectedItems) {
          if (!kotnoSet.has(kotresult.kot_id)) {
            kotnoSet.add(item.kot_id);
          }
          // await connection.KOTItem.update({ kot_id: kotresult.kot_id, is_transferred: 1, status: 1 }, {
          //     where: {
          //         id: item.kot_item_id
          //     }
          // });
          item.kot_id = kotresult.kot_id;
          item.item_name = item.title;
          item.user_id = params.user_id;
          item.createdBy = params.createdBy;
          if (item.amount === 0) {
            item.is_complimentary = 1;
          }
          const itemresultEntity = await connection.KOTItem.create(item);
          if (itemresultEntity && item.addons && item.addons.length > 0) {
            for (addon of item.addons) {
              // .option_type = 0;
              // let option_qty = addon.option_type === 0 ? item.quantity : 1;
              // let option_qty = item.quantity ? item.quantity : 1;

              // let option_total = addon.price * option_qty;
              // let option_total_with_tax =
              //   option_total + addon.option_tax * option_qty;

              // let tempaddon = {
              //   kot_items_id: itemresultEntity.id,
              //   option_group_name: addon.optionGrptitle,
              //   option_group_ref_id: addon.opt_grp_ref_ids,
              //   option_ref_id: addon.ref_id,
              //   option_name: addon.title,
              //   option_price: addon.price,
              //   option_tax_amount: addon.option_tax,
              //   option_qty: option_qty,
              //   option_total: option_total,
              //   option_total_with_tax: option_total_with_tax,
              //   option_type: addon.option_type,
              //   item_ref_id: addon.item_ref_id,
              //   option_id: addon.option_id,
              // };

              Object.assign(addon, { kot_items_id: itemresultEntity.id });

              await connection.KotItemOption.create(addon);
            }
          }
        }
      }

      // Update old KOT total
      if (
        params.isBarSection == 2 &&
        global.storeDetails.is_bar_section_billing
      ) {
        await updateDummyBarkotnumber(kotresult.kot_id);
      } else {
        await updateDummykotnumber(kotresult.kot_id);
      }
      if (!hasactivePreviouskot) {
        await fetchAndUpdateOrderNumberWithoutTransaction(params);
      }
      await connection.KOT.update(
        {
          // amount: params.currentKOTtotal,
          sync_status: 0,
        },
        {
          where: {
            is_active: 1,
            table_id: params.currentTable,
          },
        },
      );

      let table_extra_details = {};
      if (oldKot.customer_mobile) {
        const table = await connection.Table.findOne({
          raw: true,
          where: {
            id: params.destinationtable,
          },
        });

        table_extra_details.customer_mobile = oldKot.customer_mobile;
        table_extra_details.customer_name = oldKot.customer_name;

        if (table && table.extra_details) {
          table_extra_details = {
            ...table_extra_details,
            ...table.extra_details,
          };
        }
      }
      await connection.Table.update(
        {
          table_color: TableUtils.Colors.KOT_SAVED,
          table_action_flag: params.table_action_flag,
          order_state: OFFLINE_ORDERSTATES.PLACED,
          extra_details: table_extra_details,
        },
        {
          where: {
            id: params.destinationtable,
          },
        },
      );

      if (
        params.isBarSection == 2 &&
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
      setKOTInactiveifany(Array.from(kotnosList), params?.remote_order_id);

      // send kot number to print on tansfer kot print
      const kot_number = await connection.KOT.findAll({
        attributes: ['kot_number'],
        raw: true,
        where: {
          kot_id: kotresult.kot_id,
          is_active: 1,
          table_id: params.destinationtable,
        },
      });

      sendLivesyncrequest();
      return {
        status: 200,
        kot_number,
        message: 'success',
        kot_id: kotresult.kot_id,
        extra_details,
      };
    } catch (error) {
      console.error(error);
      return { status: 400, message: 'Invalid Parameters' };
    }
  } else {
    return { status: 400, message: 'Invalid Parameters' };
  }
}

async function setKOTInactiveifany(kotnosList, remote_order_id) {
  if (kotnosList && kotnosList.length > 0) {
    for (const kot_id of kotnosList) {
      const kotItems = await connection.KOTItem.findAll({
        // include: [
        //   {
        //     model: connection.KOT,
        //     attributes: [],
        //     where: {
        //       table_id: table,
        //       is_active: 1,
        //     },
        //   },
        // ],
        raw: true,
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
      });
      if (kotItems.length === 0) {
        const kotResult = await connection.KOT.findOne({
          where: {
            kot_id,
          },
          raw: true,
        });
        await connection.KOT.update(
          { sync_status: 0, is_active: 0 },
          {
            where: {
              kot_id,
            },
          },
        );
        // const tableDetails = await connection.Table.findOne({
        //   raw: true,
        //   where: { id: table },
        // });
        // await connection.Table.update(
        //   {
        //     // table_color: '#1A9A62',
        //     table_color: '#007c45',
        //     table_action_flag: 0,
        //     order_state: '',
        //   },
        //   {
        //     where: {
        //       id: table,
        //     },
        //   },
        // );
        // if (
        //   [TAKEAWAY_FLAG_ID, HOMED_FLAG_ID].includes(
        //     tableDetails.order_type_flag,
        //   )
        // ) {
        //   await connection.Table.destroy({
        //     where: { id: table },
        //   });
        // }
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

async function getWalletdetails(customer) {
  let walletDetails = [];
  try {
    if (customer && customer.phone) {
      walletDetails = await connection.Wallet.findAll({
        raw: true,
        where: {
          cust_phone: customer.phone,
        },
      });
    }
  } catch (error) {}
  return walletDetails;
}

async function getDiscounts(data) {
  const response = {};
  let discounts = [];
  try {
    response.addDiscounttolist = data.addDiscounttolist;
    response.showDiscountWindow = data.showDiscountWindow;

    discounts = await connection.Discount.findAll({
      raw: true,
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        store_id: data.store_id,
        active: 1,
      },
    });
    const customizeddiscounts = await connection.CustomizedDiscount.findAll({
      raw: true,
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        store_id: data.store_id,
        is_active: 1,
      },
    });
    response.customizeddiscounts = customizeddiscounts;

    const itemDiscounts = await connection.ItemDiscount.findAll({
      raw: true,
      where: {
        // NEW STOREWISE CHANGE 17 JAN 2020
        store_id: data.store_id,
        active: 1,
      },
    });
    if (itemDiscounts && itemDiscounts.length) {
      global.hasItemDiscount = true;
    }
    response.itemDiscounts = itemDiscounts;
  } catch (error) {
    discounts = [];
  }
  response.discounts = discounts;
  return response;
}
async function getOrderduetransactions({ order_id, store_id }) {
  let transactions = [];
  const response = { status: 200 };
  if (order_id && store_id) {
    try {
      transactions = await connection.Duepayments.findAll({
        raw: true,
        attributes: [
          'store_id',
          'order_id',
          'cust_mobile',
          'waived_off',
          'payment_info',
          'billing_user_id',
          'transaction_id',
          'created',
          [
            connection.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", amount_to_pay)`,
            ),
            'amount_to_pay',
          ],
          [
            connection.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", received_amount)`,
            ),
            'received_amount',
          ],
          [
            connection.sequelize.literal(
              `printf("%.${global.ROUNDOFF_UPTO}f", due_amount)`,
            ),
            'due_amount',
          ],
        ],
        where: {
          order_id,
          store_id,
        },
      });
      response.transactions = transactions;
    } catch (error) {
      response.status = 400;
      response.message = 'Invalid parameters';
    }
  } else {
    response.status = 400;
    response.message = 'Please provide order id/store id.';
  }

  return response;
}

/**
 * Returns the table list with item which are currently running
 * @param {Parameters} params
 */
async function getRunningtableswithdetails(params) {
  let tables = [];
  // const tableKotStatus = {};
  try {
    if (params.store_id) {
      const { assignedKitchedeps } = params;
      tables = await connection.KOT.getBusytableswithdetails({
        store_id: params.store_id,
        status: params.status,
      });

      const kotitemWhere = {};
      if (assignedKitchedeps) {
        Object.assign(kotitemWhere, {
          kitchen_dept: {
            [connection.Sequelize.Op.in]: String(assignedKitchedeps).split(','),
          },
        });
      }
      Object.assign(kotitemWhere, {
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
      });
      if (tables.length > 0) {
        for (const currentTable of tables) {
          const kotWheredata = {
            table_id: currentTable.table_id,
            is_active: 1,
            kot_id: currentTable.kot_id,
          };

          const items = await connection.KOTItem.findAll({
            raw: true,
            include: [
              {
                model: connection.KOT,
                where: kotWheredata,
                attributes: [
                  'kot_id',
                  'is_pre_order',
                  'customer_name',
                  'user_id',
                  'extra_details',
                ],
              },
            ],
            attributes: [
              ['id', 'kot_item_id'],
              ['item_name', 'title'],
              'amount',
              'alternative_title',
              'item_price',
              'quantity',
              'item_id',
              'item_tax_per',
              'item_tax_value',
              'item_tax_method',
              'item_is_devidable',
              'orderstatus',
              'previousstatus',
              'comment',
              'kot_id',
              'reason',
              'note',
              'status',
              'discounted_price',
              'discount_type',
              'discount_rate',
              'pricebeforeDiscount',
              'modified_discount',
              'category_name',
              'has_options',
              'alternative_category_name',
            ],
            group: ['id'],
            where: kotitemWhere,
          });
          for (const kotItem of items) {
            kotItem.quantity = Number(kotItem.quantity);
            kotItem.amount = Number(kotItem.amount);
            kotItem.extra_details = safeParseformain(kotItem.extra_details);
            if (kotItem.has_options == 1) {
              // if in same kot having same item two time with different options then for single item getting two option
              // so we have to match with title also

              const optionWhereData = {
                item_ref_id: kotItem.item_id,
                kot_items_id: kotItem.kot_item_id,
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
                ],
                group: [
                  'option_name',
                  'option_price',
                  'item_ref_id',
                  'option_id',
                ],
                order: [['id', 'ASC']],
                where: optionWhereData,
              });
              if (addons && addons.length) {
                addons.forEach((addon) => {
                  addon.option_qty = Number(addon.option_qty);
                });
              }

              kotItem.addons = addons;
            }
          }
          currentTable.items = items;

          // if (!tableKotStatus[currentTable.table_id]) {
          //   tableKotStatus[currentTable.table_id] = true;
          //   currentTable.kot_state = 'New KOT';
          // } else {
          //   currentTable.kot_state = 'Running KOT';
          // }
          if (currentTable && currentTable.extra_details) {
            const extra_details = safeParseformain(currentTable.extra_details);
            if (extra_details && extra_details.kot_state) {
              currentTable.kot_state = extra_details.kot_state;
            } else {
              currentTable.kot_state = 'New KOT';
            }
          } else {
            currentTable.kot_state = 'New KOT';
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
  return tables;
}

/**
 * Returns the table list with item which are currently running
 * @param {Parameters} params
 */
async function getRunningtakeawaytables(params) {
  let tables = [];
  try {
    if (params.store_id) {
      tables = await connection.KOT.getTakeawayBusytables({
        store_id: params.store_id,
      });
    }
  } catch (error) {
    console.error(error);
  }
  return tables;
}

async function getsettledKots(params) {
  let settledOrders = [];
  try {
    const filters = [];
    const kotitemWhere = {};
    const { assignedKitchedeps } = params;
    if (assignedKitchedeps) {
      const depfilters = String(assignedKitchedeps).split(',');
      depfilters.push(0);
      Object.assign(kotitemWhere, {
        kitchen_dept: {
          [connection.Sequelize.Op.in]: depfilters,
        },
      });
    }

    let ordertypeFilters = [2, 4, 5];
    if (params.status === '2') {
      ordertypeFilters = [3];
    }

    if (params.showQsrorders) {
      filters.push(QUICKBILL_BILLING_FLAG);
    }

    if (params.showOnlineorders) {
      filters.push(...ONLINE_PLATFORMS);
    }

    if (params.showDigitalorders) {
      filters.push(8);
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0); // Set time to 00:00:00
    const fromDate = todayStart.getTime(); // Get timestamp

    // Get today's end time as a timestamp
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999); // Set time to 23:59:59.999
    const toDate = todayEnd.getTime(); // Get timestamp

    const where = {
      billing_type: {
        [connection.Sequelize.Op.in]: filters,
      },
      order_kotflag: {
        [connection.Sequelize.Op.in]: ordertypeFilters,
      },
      store_id: params.store_id,
      order_state: 'fulfilled',
      actual_created_time: {
        [connection.Sequelize.Op.between]: [fromDate, toDate],
      },
    };

    if (params.showAllorders) {
      delete where.billing_type;
    }

    if (filters.length > 0) {
      settledOrders = await connection.Bill.findAll({
        attributes: [
          'created_time',
          'order_id',
          'bill_number',
          'billing_type',
          ['order_kotflag', 'order_flag'],
          'user_id',
          'instructions',
          'extra_details',
          'delivery_type',
          'table_name',
          'table_id',
          ['cust_name', 'customer_name'],
          ['phone', 'customer_phone'],
          'app_source',
        ],
        where,
        include: [
          {
            as: 'tmpos_order_child',
            model: connection.BillItem,
            // attributes: ['id', 'title', 'quantity'],
            attributes: [
              'id',
              'title',
              'quantity',
              ['item_note', 'note'],
              'category_name',
              'alternative_title',
              'alternative_category_name',
            ],
            include: [
              {
                as: 'order_child_options',
                model: connection.BillItemOption,
              },
            ],
            where: kotitemWhere,
          },
          {
            model: connection.KOT,
            attributes: [
              ['note', 'instructions'],
              'persons',
              'kot_number',
              'kot_id',
              'is_pre_order',
              'billing_type',
              'bill_number',
              'order_id',
              'customer_name',
            ],
          },
        ],
      });

      if (params.showQsrorders) {
        settledOrders.forEach((element) => {
          if (element.billing_type === QUICKBILL_BILLING_FLAG) {
            const result = element.get({ plain: true });
            element.instructions =
              result.mpos_kots &&
              result.mpos_kots[0] &&
              result.mpos_kots[0].instructions;

            element.persons =
              result.mpos_kots &&
              result.mpos_kots[0] &&
              result.mpos_kots[0].persons;
          }
        });
      }
    }
  } catch (error) {
    console.error(error);
    settledOrders = [];
  }
  return settledOrders;
}

async function getsettledQuickbillkot(params) {
  let settledOrders = [];
  try {
    const filters = [QUICKBILL_BILLING_FLAG];
    // 1=Served 2=Placed 3=bumped 4=Preparing 5=Ready
    const kotitemWhere = {};
    const { assignedKitchedeps } = params;
    if (assignedKitchedeps) {
      const depfilters = String(assignedKitchedeps).split(',');
      Object.assign(kotitemWhere, {
        kitchen_dept: {
          [connection.Sequelize.Op.in]: depfilters,
        },
      });
    }

    let ordertypeFilters = [2, 4, 5];
    if (params.status === '2') {
      ordertypeFilters = [3];
    }
    if (filters.length > 0) {
      settledOrders = await connection.Bill.findAll({
        attributes: [
          'created_time',
          'order_id',
          'bill_number',
          'billing_type',
          ['order_kotflag', 'order_flag'],
          'user_id',
          'instructions',
          'extra_details',
        ],
        where: {
          billing_type: {
            [connection.Sequelize.Op.in]: filters,
          },
          order_kotflag: {
            [connection.Sequelize.Op.in]: ordertypeFilters,
          },
          store_id: params.store_id,
        },
        include: [
          {
            as: 'tmpos_order_child',
            model: connection.BillItem,
            attributes: ['id', 'title', 'quantity', ['item_note', 'note']],
            where: kotitemWhere,
          },
          {
            model: connection.KOT,
            attributes: [['note', 'instructions']],
          },
        ],
      });
    }
  } catch (error) {
    console.error(error);
    settledOrders = [];
  }
  return settledOrders;
}

async function getrunningKotitems(params) {
  let items = [];
  try {
    items = await connection.KOTItem.getrunningKotitems(params);
  } catch (error) {
    console.error(error);
  }
  return items;
}

async function updateTablestatus(content) {
  const response = { status: 200, message: 'Table status updated' };
  if (
    content &&
    content.table_action_flag != undefined &&
    content.table_id != undefined
  ) {
    try {
      await connection.Table.update(
        {
          table_action_flag: content.table_action_flag,
          table_color: content.table_color,
        },
        {
          where: { id: content.table_id },
        },
      );
      response.params = content;
    } catch (error) {
      response.status = 400;
      response.message = 'Invalid Parameters';
    }
  } else {
    response.status = 400;
    response.message = 'Invalid Parameters';
  }
  return response;
}

async function updateliveitemstatus(itemsData) {
  const response = { status: 200 };
  try {
    if (itemsData.kot_item_id && itemsData.orderstatus) {
      const updateData = {};
      if (itemsData.orderstatus) {
        updateData.orderstatus = itemsData.orderstatus;
      }
      if (itemsData.previousstatus) {
        updateData.previousstatus = itemsData.previousstatus;
      }
      if (itemsData.comment) {
        updateData.comment = itemsData.comment;
      }
      if (itemsData.status) {
        updateData.status = itemsData.status;
      }
      if (itemsData.reason) {
        updateData.reason = itemsData.reason;
      }

      let result = await connection.KOTItem.update(updateData, {
        where: { id: itemsData.kot_item_id },
      });

      // get kot_id on item_id basis
      const kotItem = await connection.KOTItem.findOne({
        raw: true,
        where: { id: itemsData.kot_item_id },
      });

      // get all kot item on basis of kot_id
      const allkotItems = await connection.KOTItem.findAll({
        raw: true,
        where: {
          kot_id: kotItem.kot_id,
        },
      });

      // check status of all kot
      const allEqual = (arr) =>
        arr.every((v) => v.orderstatus == arr[0].orderstatus);
      const isAllEqual = allEqual(allkotItems);

      // if status of all kot's are same then update kot
      if (isAllEqual) {
        let status = 1;
        switch (kotItem.orderstatus) {
          case 'Placed':
            status = 1;
            break;

          case 'Bumped':
            status = 2;
            break;

          case 'Preparing':
            status = 3;
            break;

          case 'Ready':
            status = 4;
            break;

          case 'Served':
            status = 5;
            break;

          default:
            break;
        }
        await connection.KOT.update(
          {
            status,
          },
          {
            where: {
              kot_id: kotItem.kot_id,
            },
          },
        );
      }

      const kot = await connection.KOT.findOne({
        raw: true,
        where: {
          kot_id: kotItem.kot_id,
        },
      });

      if (
        global.showFoodReadyNotificationOnOrderhub &&
        kotItem &&
        itemsData.orderstatus === 'Ready'
      ) {
        const data = {
          title: 'Food Ready',
          message: `${kotItem.item_name} is ready for Table ${kot.table_name}`,
          table_id: kot.table_id,
          username: kotItem.createdBy,
          alert: true,
        };
        global.ipcEventEmitter.emit(ORDER.SHOW_NOTIFICATION_ON_ORDERHUB, data);
      }

      if (result.length > 0) {
        result = result[0];
        if (result >= 1) {
          response.status = 200;
          response.message = 'Item status updated.';
        } else {
          response.status = 400;
          response.message = 'Updated Failed';
        }
      } else {
        response.status = 400;
        response.message = 'Something went wrong';
      }
    } else {
      response.status = 400;
      response.message = 'Invalid parameters';
    }
  } catch (error) {
    response.status = 400;
    response.message = 'Something went wrong';
  }
  return response;
}

async function updateKotdata(params) {
  const response = { status: 200 };
  try {
    if (params.kot_id) {
      const updateData = {};
      if (params.status) {
        updateData.status = params.status;
      }
      Object.assign(updateData, { sync_status: 0 });
      let result = await connection.KOT.update(updateData, {
        where: { kot_id: params.kot_id },
      });

      if (result.length > 0) {
        result = result[0];
        if (result >= 1) {
          response.status = 200;
          response.message = 'KOT updated.';
        } else {
          response.status = 400;
          response.message = 'Updated Failed';
        }
      } else {
        response.status = 400;
        response.message = 'Something went wrong';
      }

      if (global.showFoodReadyNotificationOnOrderhub && params.status === 4) {
        const kot = await connection.KOT.findOne({
          where: { kot_id: params.kot_id },
        });
        const data = {
          title: 'Food Ready',
          message: `KOT ${kot.kot_number} is ready for Table ${kot.table_name}`,
          table_id: kot.table_id,
          username: kot.createdBy,
          alert: true,
        };
        global.ipcEventEmitter.emit(ORDER.SHOW_NOTIFICATION_ON_ORDERHUB, data);
      }
    } else {
      response.status = 400;
      response.message = 'Invalid parameters';
    }
  } catch (error) {
    response.status = 400;
    response.message = 'Something went wrong';
  }
  return response;
}

async function updateorderKotdata(params) {
  const response = { status: 200 };
  try {
    if (params.order_id) {
      const updateData = {};
      if (params.status) {
        updateData.order_kotflag = params.status;
      }
      Object.assign(updateData, { sync_status: 0 });
      let result = await connection.Bill.update(updateData, {
        where: { order_id: params.order_id },
      });

      // for settled order for served kot stats is coming 1 and we have to update status 5 on kot level for served kot
      if (params.status === 1) {
        await connection.KOT.update(
          { status: 5 },
          {
            where: { bill_number: params.order_id },
          },
        );
      }

      if (result.length > 0) {
        result = result[0];
        if (result >= 1) {
          response.status = 200;
          response.message = 'KOT updated.';
        } else {
          response.status = 400;
          response.message = 'Updated Failed';
        }
      } else {
        response.status = 400;
        response.message = 'Something went wrong';
      }
    } else {
      response.status = 400;
      response.message = 'Invalid parameters';
    }
  } catch (error) {
    response.status = 400;
    response.message = 'Something went wrong';
  }
  return response;
}

async function setSyncstatus({ fromDate, toDate }) {
  const response = { status: 200 };
  const status = 0;
  try {
    await connection.Bill.update(
      {
        sync_status: status,
      },
      {
        where: {
          store_id: global.storeDetails.store_id,
          created_time: {
            [connection.Sequelize.Op.between]: [fromDate, toDate],
          },
          order_state: {
            [connection.Sequelize.Op.not]: OrderState.PENDING,
          },
        },
      },
    );

    await connection.KOT.update(
      {
        sync_status: status,
        sync_status: 0,
      },
      {
        where: {
          in_time: {
            [connection.Sequelize.Op.between]: [fromDate, toDate],
          },
          store_id: global.storeDetails.store_id,
        },
      },
    );

    await connection.Expenses.update(
      {
        sync_flag: status,
      },
      {
        where: {
          store_id: global.storeDetails.store_id,
          expense_time: {
            [connection.Sequelize.Op.between]: [fromDate, toDate],
          },
        },
      },
    );
    await connection.Duepayments.update(
      {
        sync_flag: status,
      },
      {
        where: {
          store_id: global.storeDetails.store_id,
        },
      },
    );
    response.status = 200;
    response.message = 'Success';
  } catch (error) {
    console.error(error);
    response.status = 400;
    response.message = 'Something went wrong';
  }
  return response;
}

async function checkOrderIdIsPresent(orderId) {
  const result = await connection.Bill.findOne({
    where: {
      order_id: orderId,
    },
  });
  return result;
}

async function updateBillNumber(params) {
  const updateData = {
    bill_number: params.offlineBillNumber + 1,
    secondary_bill_number: params.onlineBillNumber + 1,
    barSection_bill_number: params.barBillNumber ? params.barBillNumber : 1,
  };
  const result = await connection.Tempnumbers.update(updateData, {
    where: { id: 1 },
  });
  return result;
}

async function checkBillIsPrinted(params) {
  const result = await connection.Bill.findAll({
    raw: true,
    attributes: ['print_status', 'draftprint_status'],
    where: { order_id: params.order_id, store_id: params.store_id },
  });
  return result;
}

async function updatePrintCountOfOrder(params) {
  const result = await connection.Bill.increment(['print_status'], {
    by: 1,
    where: { order_id: params.order_id, store_id: params.store_id },
  });
  return result;
}

async function getItemsByProductGroup(params) {
  const groupBy = [];
  const order = [];
  const include = [
    {
      model: connection.Category,
      attributes: ['category_name'],
      where: { store_id: params.store_id, is_active: 1 },
    },
    {
      model: connection.ProductGroup,
      attributes: ['product_group_name'],
      where: {
        store_id: params.store_id,
      },
    },
  ];
  if (params && params.sortmenuItemsby) {
    switch (params.sortmenuItemsby) {
      case MENU_ITEMSORT_TYPES.BY_CODE:
        order.push(['short_code', 'ASC']);
        break;
      case MENU_ITEMSORT_TYPES.BY_TOPSOLD_AMT:
        include.push({
          model: connection.BillItem,
          attributes: [
            [
              connection.Sequelize.fn(
                'sum',
                connection.Sequelize.col('mpos_order_child.total'),
              ),
              'itemorderTotal',
            ],
          ],
          required: false,
          where: {},
        });
        order.push([
          connection.sequelize.literal('`mpos_order_child.itemorderTotal`'),
          'DESC',
        ]);
        groupBy.push('mpos_item.item_refid');
        break;
      case MENU_ITEMSORT_TYPES.BY_TOPSOLD_QTY:
        include.push({
          model: connection.BillItem,
          attributes: [
            [
              connection.Sequelize.fn(
                'sum',
                connection.Sequelize.col('mpos_order_child.quantity'),
              ),
              'itemorderTotal',
            ],
          ],
          required: false,
          where: {},
        });
        order.push([
          connection.sequelize.literal('`mpos_order_child.itemorderTotal`'),
          'DESC',
        ]);
        groupBy.push('mpos_item.item_refid');
        break;
      case MENU_ITEMSORT_TYPES.BY_NAME:
        order.push(['title', 'ASC']);
        break;
      default:
        break;
    }
  }
  const result = await connection.Item.findAll({
    raw: true,
    where: {
      // NEW STOREWISE CHANGE 17 JAN 2020
      store_id: params.store_id,
      product_group: {
        [connection.Sequelize.Op.in]: params.productGroups,
      },
    },
    include,
    group: groupBy,
    order,
  });

  const itemlevelChargesExists = await connection.Charges.count({
    where: {
      store_id: params.store_id,
      charge_applicable_on: {
        [connection.Sequelize.Op.in]: [1, 2],
      },
    },
  });

  if (itemlevelChargesExists > 0) {
    await getItemlevelcharges(result, params.store_id);
  }
  return result;
}

async function getAllProductGroup() {
  const result = await connection.ProductGroup.findAll({
    raw: true,
    attributes: ['product_group_id'],
    where: {
      // NEW STOREWISE CHANGE 17 JAN 2020
      store_id: global.storeDetails.store_id,
    },
  });
  return result;
}

async function getKotNumberForTransferItem(data) {
  // send kot number to print on tansfer kot print
  const kot_number = await connection.KOT.findAll({
    attributes: ['kot_number'],
    raw: true,
    order: [['kot_number', 'DESC']],
    where: {
      is_active: 1,
      table_id: data.table_id,
    },
  });
  return kot_number;
}

async function changeTableColor(params) {
  const result = await connection.Table.update(
    {
      table_color: params.table_color,
      table_action_flag: params.table_action_flag,
      order_state: params.order_state,
    },
    {
      where: {
        id: Number(params.table_id),
      },
    },
  );

  await connection.KOT.update(
    { is_active: 0 },
    {
      where: {
        table_id: Number(params.table_id),
        is_active: 1,
      },
    },
  );
  return result;
}

async function checkIsKotActiveForTable(params) {
  const result = await connection.KOT.findAll({
    raw: true,
    where: {
      table_id: params.table_id,
      is_active: 1,
    },
  });

  return result;
}

async function checkIsDineinKotActive() {
  const result = await connection.KOT.findAll({
    raw: true,
    where: {
      billing_type: 1,
      is_active: 1,
      store_id: global.storeDetails.store_id,
    },
  });

  return result;
}
async function updateOrderItemsForReeloDiscount(params) {
  if (params && params.mainItems && params.mainItems.length) {
    params.mainItems.forEach((item) => {
      // delete kot item

      // update order child
      connection.BillItem.update(
        {
          total: item.amount,
          price: item.item_price,
          quantity: item.quantity,
          total_with_tax: Number(
            (item.amount + item.item_tax_value * item.quantity).toFixed(
              global.ROUNDOFF_UPTO,
            ),
          ),
          discounted_price: item.item_price,
          discount_type: item.discount_type,
          discount_rate: item.discount_rate,
          discount: item.pricebeforeDiscount
            ? Number(
                (item.pricebeforeDiscount - item.item_price) * item.quantity,
              ).toFixed(global.ROUNDOFF_UPTO)
            : 0,
        },
        {
          where: {
            orderMasterId: params.order_id,
            item_id: item.item_id,
          },
        },
      );

      const result = connection.KOT.findAll({
        raw: true,
        attributes: ['kot_id', 'user_id', 'createdBy', 'amount'],
        where: {
          bill_number: params.order_id,
        },
      }).then((result) => {
        // })

        // delete kot items based on kot id and item id
        if (result) {
          const kot_ids = result.map((a) => a.kot_id);
          const kotitem = connection.KOTItem.findAll({
            raw: true,
            where: {
              item_id: Number(item.item_id),
              kot_id: {
                [connection.Sequelize.Op.in]: kot_ids,
              },
            },
          });

          const deleteResult = connection.KOTItem.destroy({
            where: {
              item_id: Number(item.item_id),
              kot_id: {
                [connection.Sequelize.Op.in]: kot_ids,
              },
            },
          });

          if (deleteResult) {
            params.mainItems.forEach(async (mainItem) => {
              if (item.item_id == mainItem.item_id) {
                connection.KOTItem.create(item);
              }
            });
            if (
              params &&
              params.discountedItems &&
              params.discountedItems.length
            ) {
              // add entry in kot item
              // discountedItems
              try {
                params.discountedItems.forEach(async (item) => {
                  const createres = connection.KOTItem.create(item);
                  const tempItem = {
                    title: item.title,
                    item_id: item.item_id,
                    quantity: item.quantity,
                    amount: item.amount,
                    price: item.item_price,
                    bill_id: params.bill_id,
                    orderMasterId: params.order_id,
                    total: item.amount,
                    total_with_tax: Number(
                      (
                        item.amount +
                        item.item_tax_value * item.quantity
                      ).toFixed(global.ROUNDOFF_UPTO),
                    ),
                    tax_method: item.item_tax_method,
                    tax_name: item.item_tax_name,
                    tax_per: item.item_tax_per,
                    tax_value: item.item_tax_value,
                    is_devidable: item.item_is_devidable,
                    product_group_id:
                      item.product_group_id != undefined
                        ? item.product_group_id
                        : null,
                    product_group_name: item.product_group_name
                      ? item.product_group_name
                      : null,
                    discounted_price: item.discounted_price,
                    discount_type: item.discount_type,
                    discount_rate: item.discount_rate,
                    pricebeforeDiscount: item.pricebeforeDiscount
                      ? item.pricebeforeDiscount
                      : 0,
                    modified_discount: item.modified_discount,
                    discount: item.pricebeforeDiscount
                      ? Number(
                          (item.pricebeforeDiscount - item.item_price) *
                            item.quantity,
                        ).toFixed(global.ROUNDOFF_UPTO)
                      : 0,
                    kitchen_dept: item.kitchen_dept ? item.kitchen_dept : 0,
                    hsn_code: item.hsn_code || null,
                    is_open_item: item.is_open_item || 0,
                    short_code: item.short_code,
                    category_name: item.category_name,
                    item_note: item.note,
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
                    total_with_tax: Number(
                      itemtotalwithTax.toFixed(global.ROUNDOFF_UPTO),
                    ),
                  });

                  BillItem.create(tempItem);
                });
              } catch (err) {
                console.error('error', err);
              }
            }
          }
        }
      });
    });
  }
}

function pad(num, size) {
  num = num.toString();
  while (num.length < size) num = `0${num}`;
  return num;
}

async function updateWaitertipDetails(data) {
  if (data) {
    try {
      await connection.OrderTip.destroy({
        where: {
          order_id: data.order_id,
        },
      });
      const result = await connection.OrderTip.create(data);
      if (result) {
        return result;
      }
    } catch (err) {
      console.error(err);
    }
  }
}

async function updateWaitertipDetailsForquickbill(data, transaction) {
  if (data) {
    try {
      await connection.OrderTip.destroy({
        where: {
          order_id: data.order_id,
        },
        transaction,
      });
      const result = await connection.OrderTip.create(data, { transaction });
      if (result) {
        return result;
      }
    } catch (err) {
      console.error(err);
    }
  }
}

async function setOrderNote(data) {
  if (data) {
    try {
      const response = {};
      if (data.order_id) {
        const result = await connection.Bill.update(
          {
            order_note: data.order_note,
          },
          {
            where: {
              order_id: data.order_id,
            },
          },
        );
      }
      if (data.table_id) {
        const result = await connection.KOT.update(
          {
            field3: data.order_note,
          },
          {
            where: {
              table_id: data.table_id,
              is_active: 1,
            },
          },
        );
        response.status = 'success';
        response.message = 'Order note added';
      }
      return response;
    } catch (err) {
      console.error(err);
    }
  }
}

async function setTables() {
  const parameters = {
    isTerminal: true,
  };
  const storeId = global.storeDetails.store_id;
  global.allTables = await getTables(storeId, parameters);
}

async function getItemOptions(params) {
  try {
    const addons = await connection.BillItemOption.findAll({
      where: {
        order_id: params.order_id,
      },
    });
    return addons;
  } catch (error) {
    console.error(error);
  }
  return undefined;
}

async function updatekotstatus(params) {
  try {
    const status = await connection.Bill.update(
      { order_kotflag: params.status },
      {
        where: {
          order_id: params.order_id,
        },
      },
    );
    return status;
  } catch (error) {
    console.error(error);
  }
}

async function getRunningOrderDetials(params) {
  const { order_id, bill_number } = params;
  // const formattedOrderId = order_id.slice(-5);
  const billDetails = await connection.Bill.findOne({
    attributes: ['order_total', 'due_payment', 'hasDuepayment', 'table_id'],
    where: {
      // order_id,
      // order_id: {
      //   [Op.like]: `%${formattedOrderId}`, // match last 6 digits
      // },
      // id: order_id,
      bill_number,
      order_state: 'pending',
    },
    raw: true,
  });
  return billDetails;
}
module.exports = {
  setTables,
  updateDummykotnumber,
  updateDummyBarkotnumber,
  getResettedordernumberifexist,
  updateWaitertipDetails,
  pad,
  initializeAccesslevles,
  updateOrderItemsForReeloDiscount,
  checkIsKotActiveForTable,
  changeTableColor,
  getKotNumberForTransferItem,
  getAllProductGroup,
  getItemsByProductGroup,
  checkBillIsPrinted,
  updateBillNumber,
  checkOrderIdIsPresent,
  checkBillIsRunning,
  checkIfKOTIsRunning,
  getOrderbillnumber,
  checkifduepaymentExists,
  setSyncstatus,
  getDiscounts,
  updateorderKotdata,
  updateKotdata,
  updateliveitemstatus,
  updateTablestatus,
  getRunningtableswithdetails,
  getrunningKotitems,
  getOrderduetransactions,
  getWalletdetails,
  transferKOTItem,
  addCustomer,
  updateDiscount,
  updatePayment,
  updateCustomerforanorder,
  getOrderwindowdetails,
  addItemnote,
  getKotitemnotes,
  getItemoptions,
  updateDeliveryboy,
  fetchKOTnumbers,
  getTables,
  saveKOT,
  saveBill,
  saveDigitalorder,
  settleBill,
  changeTableforkot,
  settleQuickbill,
  updateBill,
  getrunningorderDetails,
  updateCharges,
  getCustomers,
  getOrderdetails,
  getSettings,
  getsettledKots,
  getsettledQuickbillkot,
  updateEbillstatus,
  getWaiterslist,
  updateWaiter,
  getOptiongroupandoptions,
  getResettedbillkotifexist,
  getbarSectionBillkotifexist,
  getResettedOnlinebill,
  addPreorderform,
  getPreordersfilterby,
  updatereceiptprintCount,
  getreceiptprintCount,
  isOrdersynced,
  updatePrintCountOfOrder,
  addPayment,
  checkIsDineinKotActive,
  updateItemCurrentStock,
  setOrderNote,
  getItemOptions,
  getRunningtableKotItems,
  getNewOrRunnigTagForOrder,
  getRunningtakeawaytables,
  deleteItemnote,
  getTablesDepartment,
  updatekotstatus,
  fetchAndUpdateOrderNumberWithoutTransaction,
  isBillgeneratedfortable,
  getRunningOrderDetials,
  getRunningkotitemsdetails,
};
