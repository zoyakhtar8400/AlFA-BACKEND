/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
const map = require('lodash/map');
const CryptoJS = require('crypto-js');
const { HttpStatusCode } = require('axios');
const debounce = require('lodash/debounce');
const {
  Category,
  Item,
  Expenses,
  PasscodeActivity,
  Sequelize,
  KOT,
  Bill,
  Duepayments,
  StartcloseDay,
  UserShift,
  Wallet,
  WalletTransactions,
  OrderTip,
  Store,
  Customer,
  KOTCharges,
  Charges,
  Table,
  Department,
  Discount,
  ItemDiscount,
  Payment,
  DeliveryBoy,
  Options,
  OptionGroup,
  KitchenDepartment,
  StoreMapper,
  ExpensesCategory,
  ExpensesSubcategory,
  User,
  CustomizedDiscount,
  ProductGroup,
  Waiter,
  MultipricingSettings,
  PlatformMapping,
  Tax,
  BillItemOption,
  CoupondiscountHistory,
  sequelize,
} = require('../js/database');
const { Config } = require('../config/config');
const {
  getHeadersformpos,
  getActivetablelist,
  resolveloadmenuTables,
  resolvesyncmenuConflict,
  resloveLoadUser,
  resolvesyncmenuUserConflict,
  getActivetableWithSplitTableslist,
} = require('./MiscServices');
const { SHOW_NOTIFICATION, SYNC_BILL_REPLY } = require('../util/IPC_Messages');
const { apiCall } = require('./APIService');
const { generateSyncpayload } = require('./OrderPayloadGenerator');
const { sleep, safeParseformain } = require('../main_controllers/Utils/index');
const { startloadModifiersData } = require('./loadModifiersData');
const { startloadItemPricesData } = require('./loadItemPricesData');
const { startloadItemNotesData } = require('./loadItemNotesData');
const { throttle } = require('lodash');
const { startloadMiscDetailsData } = require('./loadMiscDetails');

const stringConstructor = 'test'.constructor;

let isSyncInProcess = false;
let syncIntervalid;
const RETRY_SYNC_AFTER = 5000;
let previousSynchash;
const SAME_BILL_SYNC_THRESHOLD = 5;
let sameBillssyncingcount = 0;
global.menu_id;

let OFFSET = 5;
if (global.syncOrderBatchSize) {
  OFFSET = global.syncOrderBatchSize;
}
async function updateHash(store_id, transaction) {
  // Update the sync-hash in database
  try {
    const updateData = { sync_hash: global.uniqid() };
    await Store.update(updateData, {
      where: { store_id },
      transaction,
    });
    global.storeDetails.sync_hash = updateData.sync_hash;
  } catch (error) {
    console.log(error);
  }
}

/**
 *
 * @param {Data to be added} data
 * @param {*} connection
 * @param {*} store_id
 * @param {*} transaction
 */
async function addToDatabase(data, store_id, transaction) {
  console.log('Adding to DB');

  if (data.categories) {
    try {
      await Category.bulkCreate(data.categories, { transaction });
    } catch (err) {
      console.error(err);
    }
  }

  if (data.items) {
    try {
      global.menu_id = data.items[0].tmpos_menu_id;
      await Item.bulkCreate(data.items, { transaction });
    } catch (err) {
      console.error(err);
    }
  }

  if (data.table_dept) {
    try {
      const takeawayDetp = {
        id: 987654,
        store_id: global.storeDetails.store_id,
        department_name: 'takwaey',
        is_active: 1,
        section: 1,
        product_groups: '',
      };

      await Department.bulkCreate(data.table_dept, { transaction });
      await Department.create(takeawayDetp, { transaction });
      if (data.table_dept && data.table_dept.length === 0) {
        await Department.create(
          {
            store_id,
            department_name: 'Default',
            is_active: 1,
          },
          { transaction },
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Add Tables
   */
  if (data.table) {
    try {
      await Table.bulkCreate(data.table, { transaction });
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Add Payment Mode
   */
  if (data.payment_mode) {
    try {
      await Payment.bulkCreate(data.payment_mode, { transaction });
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Add Customers
   */
  // console.log('data.customer', data.customer);
  if (data.customer) {
    // console.time();
    try {
      for (let i = 0; i < data.customer.length; i++) {
        data.customer[i].store_id = store_id;
        data.customer[i].sync_flag = 1;
      }
      await Customer.bulkCreate(data.customer, { transaction });
      // await Customer.update(
      //   { sync_flag: 1 },
      //   {
      //     where: { store_id },
      //   },
      // );
    } catch (err) {
      console.error(err);
    }
    // console.timeEnd();
  }

  /**
   * Add Discounts
   */
  if (data.discount) {
    try {
      await Discount.bulkCreate(data.discount, { transaction });
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Add item Discounts
   */
  if (data.item_discounts) {
    try {
      await ItemDiscount.bulkCreate(data.item_discounts, { transaction });
    } catch (err) {
      console.error(err);
    }
  }
  /**
   * Add Option Groups
   */
  if (data.option_group) {
    try {
      await OptionGroup.bulkCreate(data.option_group, { transaction });
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Add Options
   */
  if (data.options) {
    try {
      await Options.bulkCreate(data.options, { transaction });
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Add charges
   */
  if (data.charges) {
    try {
      if (data && data.charges) {
        data.charges.map((charge) => {
          // eslint-disable-next-line no-param-reassign
          charge.billing_flag = charge.extra_details.billing_flag;
          return undefined;
        });
      }
      await Charges.bulkCreate(data.charges, { transaction });
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Delivery BOys
   */
  if (data.delivery_boys) {
    try {
      await DeliveryBoy.bulkCreate(data.delivery_boys, { transaction });
    } catch (err) {
      console.error(err);
    }
  }

  /**
   * Add Kitchen departments
   */
  if (data.kitchen_dept) {
    try {
      await KitchenDepartment.bulkCreate(data.kitchen_dept, { transaction });
    } catch (err) {
      console.error(err);
    }
  }

  if (data.captain_users) {
    if (data.captain_users && data.captain_users.length > 0) {
      // eslint-disable-next-line no-restricted-syntax
      for (const user of data.captain_users) {
        if (
          user.terminal_access_levels &&
          user.terminal_access_levels.constructor === stringConstructor
        ) {
          user.terminal_access_levels = JSON.parse(user.terminal_access_levels);
        }

        if (
          user.passcode_access_levels &&
          user.passcode_access_levels.constructor === stringConstructor
        ) {
          user.passcode_access_levels = JSON.parse(user.passcode_access_levels);
        }

        if (user.userCategory === 0 && user.app_access_levels) {
          user.terminal_access_levels = user.app_access_levels;
        }

        if (user.userCategory === 0 && user.access_levels) {
          let access_level;
          if (
            user.access_levels &&
            user.access_levels.constructor === stringConstructor
          ) {
            access_level = JSON.parse(user.access_levels);
          } else {
            access_level = user.access_levels;
          }
          user.terminal_access_levels = access_level;
        }
        try {
          user.password = CryptoJS.AES.encrypt(
            user.password,
            Config.cipherKey,
          ).toString();
          // eslint-disable-next-line no-await-in-loop
          await User.create(user, { transaction });
        } catch (err) {
          console.error(err);
        }
      }
    }
  }

  if (data.store_mapping) {
    try {
      await StoreMapper.bulkCreate(data.store_mapping, { transaction });
    } catch (err) {
      console.error(err);
    }
  }
  // add Expenses
  if (data.expense_categories) {
    try {
      // eslint-disable-next-line no-restricted-syntax
      for (const category of data.expense_categories) {
        // If parent category is 0 then it is category
        // else it is sub-cateogory
        if (Number(category.parent_id) === 0) {
          // eslint-disable-next-line no-await-in-loop
          await ExpensesCategory.create(
            {
              ref_id: category.ref_id,
              category_name: category.categoryName,
              store_id: category.store_id,
            },
            { transaction },
          );
        } else {
          // eslint-disable-next-line no-await-in-loop
          await ExpensesSubcategory.create(
            {
              ref_id: category.ref_id,
              sub_category_name: category.categoryName,
              store_id: category.store_id,
              category_id: category.parent_id,
            },
            { transaction },
          );
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (data.customized_discount) {
    try {
      await CustomizedDiscount.bulkCreate(data.customized_discount, {
        transaction,
      });
    } catch (err) {
      console.error(err);
    }
  }

  if (
    data.product_groups &&
    Array.isArray(data.product_groups) &&
    data.product_groups.length > 0
  ) {
    // eslint-disable-next-line no-restricted-syntax
    for (const group of data.product_groups) {
      group.store_id = store_id;
      group.product_group_id = group.id;
      delete group.id;
      try {
        await ProductGroup.create(group, { transaction });
      } catch (error) {
        console.log(error);
      }
    }
  }

  if (
    data.multipricing_settings &&
    Array.isArray(data.multipricing_settings) &&
    data.multipricing_settings.length > 0
  ) {
    // eslint-disable-next-line no-restricted-syntax
    for (const setting of data.multipricing_settings) {
      try {
        await MultipricingSettings.create(setting, { transaction });
      } catch (error) {
        console.log(error);
      }
    }
  }

  if (data.cust_wallet) {
    try {
      await Wallet.bulkCreate(data.cust_wallet, { transaction });
    } catch (err) {
      console.error(err);
    }
  }

  if (data.platform_mapping) {
    try {
      // eslint-disable-next-line no-restricted-syntax
      for (const mapping of data.platform_mapping) {
        try {
          const currentMapping = { ...mapping };
          if (currentMapping.platforms && currentMapping.platforms.length) {
            Object.assign(currentMapping, {
              platform: currentMapping.platforms,
            });
          }
          await PlatformMapping.create(currentMapping, { transaction });
        } catch (error) {
          console.log(error);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }

  if (data.waiters) {
    try {
      await Waiter.bulkCreate(data.waiters, { transaction });
    } catch (err) {
      console.error(err);
    }
  }
  if (data.tax_list) {
    try {
      data.tax_list.forEach((tax) => {
        Object.assign(tax, {
          store_id: global.storeDetails?.store_id,
        });
      });
      await Tax.bulkCreate(data.tax_list, { transaction });
    } catch (err) {
      console.error(err);
    }
  }
  await updateHash(store_id, transaction);
}

/**
 *
 * @param {Sync STatus} status
 * @param {Store ID} store_id
 */
async function setSyncedstatus({
  status,
  store_id,
  billidstoSync,
  syncedkotIdlist,
}) {
  try {
    if (billidstoSync && billidstoSync.length > 0) {
      const billWheredata = {
        // sync_status: 0,
        sync_status: {
          [Sequelize.Op.gt]: 1, // sync_status != 2
        },
        store_id,
        // order_state: {
        //   [Sequelize.Op.notLike]: 'pending',
        // },
        order_id: {
          [Sequelize.Op.in]: billidstoSync,
        },
      };

      const duepayWheredata = {
        sync_flag: 0,
        store_id,
        order_id: {
          [Sequelize.Op.in]: billidstoSync,
        },
      };

      // await Bill.update(
      //   {
      //     sync_status: status,
      //   },
      //   {
      //     where: billWheredata,
      //   },
      // );

      await Duepayments.update(
        {
          sync_flag: status,
        },
        {
          where: duepayWheredata,
        },
      );

      await Bill.increment(['sync_status'], {
        by: 1, // increment by 1
        where: {
          order_id: {
            [Sequelize.Op.in]: billidstoSync, // your array of order IDs
          },
        },
      });
    }

    if (syncedkotIdlist && syncedkotIdlist.length) {
      const kotWheredata = {
        sync_status: 0,
        store_id,
        kot_uniqueid: {
          [Sequelize.Op.in]: syncedkotIdlist,
        },
        // is_active: 0,
      };
      await KOT.update(
        {
          sync_status: status,
        },
        {
          where: kotWheredata,
        },
      );
    }

    // await Expenses.update(
    //   {
    //     sync_flag: status,
    //   },
    //   {
    //     where: {
    //       sync_flag: 0,
    //       store_id,
    //     },
    //   },
    // );

    await Expenses.increment(['sync_flag'], {
      by: 1, // increment by 1
      where: {
        sync_flag: {
          [Sequelize.Op.in]: [0, 1], // your array of order IDs
        },
        store_id,
      },
    });

    await OrderTip.update(
      {
        sync_status: status,
      },
      {
        where: {
          order_id: {
            [Sequelize.Op.in]: billidstoSync,
          },
        },
      },
    );

    return 'success';
  } catch (error) {
    console.log(error);
    return 'failure';
  }
}

/**
 *  Send's start and close day data
 * @param {DB Interface} connection
 * @param {*} params
 */
async function syncStartenddaydata(params) {
  try {
    if (!params.store_id) {
      Object.assign(params, {
        store_id: global.storeDetails.store_id,
      });
    }
    const day_end = await StartcloseDay.findAll({
      raw: true,
      where: {
        store_id: params.store_id,
        sync_flag: 0,
        start_day_date: {
          [Sequelize.Op.ne]: null,
        },
        // day_close_date: {
        //   [Sequelize.Op.ne]: null,
        // },
      },
    });
    if (day_end && day_end.length) {
      for (let index = 0; index < day_end.length; index++) {
        const currentData = day_end[index];
        // const currentData = rawcurrentData.get({ plain: true });

        if (currentData.day_start_currency_denomination) {
          try {
            Object.assign(currentData, {
              day_start_currency_denomination: JSON.parse(
                currentData.day_start_currency_denomination,
              ),
            });
          } catch (error) {
            console.error(error);
          }
        }

        if (currentData.day_close_currency_denomination) {
          try {
            Object.assign(currentData, {
              day_close_currency_denomination: JSON.parse(
                currentData.day_close_currency_denomination,
              ),
            });
          } catch (error) {
            console.error(error);
          }
        }

        if (currentData.day_close_transactions) {
          try {
            Object.assign(currentData, {
              day_close_transactions: JSON.parse(
                currentData.day_close_transactions,
              ),
            });
          } catch (error) {
            console.error(error);
          }
        }
      }
    }
    const shift_end = await UserShift.findAll({
      raw: true,
      where: {
        store_id: params.store_id,
        sync_flag: 0,
        shift_start_date: {
          [Sequelize.Op.ne]: null,
        },
        shift_end_date: {
          [Sequelize.Op.ne]: null,
        },
      },
    });

    if (shift_end && shift_end.length) {
      for (let index = 0; index < shift_end.length; index++) {
        const currentData = shift_end[index];
        // const currentData = rawcurrentData.get({ plain: true });

        if (currentData.shift_start_currency_denomination) {
          try {
            Object.assign(currentData, {
              shift_start_currency_denomination: JSON.parse(
                currentData.shift_start_currency_denomination,
              ),
            });
          } catch (error) {
            console.error(error);
          }
        }

        if (currentData.shift_end_currency_denomination) {
          try {
            Object.assign(currentData, {
              shift_end_currency_denomination: JSON.parse(
                currentData.shift_end_currency_denomination,
              ),
            });
          } catch (error) {
            console.error(error);
          }
        }

        if (currentData.shift_end_transactions) {
          try {
            Object.assign(currentData, {
              shift_end_transactions: JSON.parse(
                currentData.shift_end_transactions,
              ),
            });
          } catch (error) {
            console.error(error);
          }
        }
      }
    }

    const cust_wallet = await Wallet.findAll({
      raw: true,
      where: {
        store_id: params.store_id,
        sync_flag: 0,
      },
    });

    const cust_wallet_transactions = await WalletTransactions.getSyndata({
      store_id: params.store_id,
      model: Wallet,
    });

    if (
      (day_end && day_end.length > 0) ||
      (shift_end && shift_end.length > 0) ||
      (cust_wallet_transactions && cust_wallet_transactions.length > 0) ||
      (cust_wallet && cust_wallet.length > 0)
    ) {
      const options = {
        day_end,
        store_id: params.store_id,
        tmpos_id: params.tmpos_id,
        shift_end,
        cust_wallet_transactions,
        cust_wallet,
      };

      // console.log('options:', JSON.stringify(options));
      // return;
      // console.log('calling start end day api:', options);
      const { data: response } = await apiCall.post(
        Config.links.dayendSync,
        options,
        {
          headers: getHeadersformpos(),
        },
      );

      if (response && response.status === 200) {
        const dayendSyncresult = response.day_end;
        await StartcloseDay.setSyncflag(dayendSyncresult);

        const shiftendSyncresult = response.shift_end;
        await UserShift.setSyncflag(shiftendSyncresult);
        const walletsResult = response.cust_wallet;
        await Wallet.setSyncflag(walletsResult);

        const wallettrans = response.wallet_transactions;
        await WalletTransactions.setSyncflag(wallettrans);
      }
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Called after sync is done
 * @param {Current IPC event} event
 * @param {Response from the server} parsedBody
 * @param {Notificatioon data} notifyData
 * @param {*} misc_data
 * @param {*} deleteStorechecked
 */
async function syncPostprocessing({
  event,
  parsedBody,
  notifyData,
  misc_data,
  deleteStorechecked,
  deleteSaleRecordchecked,
  billidstoSync,
  syncedkotIdlist,
  unsyncedOrders,
  offset,
}) {
  try {
    if (parsedBody && parsedBody.status) {
      if (parsedBody.status === HttpStatusCode.Ok) {
        notifyData.message = 'Bills Synced.';
        notifyData.type = 'success';
        notifyData.data = undefined;
        if (misc_data.silentSync && !misc_data.silentSync && event) {
          const countAndOffsetDiff = unsyncedOrders % 5;
          if (offset === unsyncedOrders - countAndOffsetDiff) {
            event.reply(SHOW_NOTIFICATION, JSON.stringify(notifyData));
          }
        }
        await setSyncedstatus({
          status: 1,
          store_id: global.storeDetails.store_id,
          billidstoSync,
          syncedkotIdlist,
        }); // Synced

        isSyncInProcess = false;
        syncStartenddaydata({
          store_id: global.storeDetails.store_id,
          tmpos_id: global.storeDetails.tmpos_id,
        });

        if (misc_data.logout && misc_data.logout) {
          if (deleteStorechecked) {
            await global.deletecurrentStorefromremote();
          }

          if (deleteSaleRecordchecked) {
            await global.deleteSalesRecordfromremote();
          }
          global.openloginfromRemote();
        }
        return;
      }
      if (parsedBody.status === HttpStatusCode.Unauthorized) {
        isSyncInProcess = false;
        global.reloginfromremote();
        return;
      }
      if (parsedBody.status === HttpStatusCode.MovedPermanently) {
        isSyncInProcess = false;
        misc_data.silentSync = false;
        notifyData.message = parsedBody.msg || 'Store is disabled.';
        notifyData.type = 'error';
        return;
      }
    }
    isSyncInProcess = false;
    notifyData.message = 'Sync Failed.';
    notifyData.type = 'error';
    if (misc_data.silentSync && !misc_data.silentSync && event)
      event.reply(SHOW_NOTIFICATION, JSON.stringify(notifyData));
  } catch (error) {
    isSyncInProcess = false;
    console.error(`Message="Error While Post Processing Sync Request"`, error);
  }
}

/**
 * Sync's all the bill's and KOT's
 */
async function startSync(
  event,
  misc_data,
  deleteStorechecked,
  deleteSaleRecordchecked,
) {
  // console.log('sync started...');
  if (isSyncInProcess) {
    // console.warn(`Message="sync is in progress"`);
    // isSyncInProcess = false;
    setTimeout(() => {
      startSync(event, misc_data, deleteStorechecked);
    }, RETRY_SYNC_AFTER);
    return;
  }

  if (global.storeDetails && misc_data && !isSyncInProcess) {
    const notifyData = {
      message: "Syncing Bill's.You will be notified when bill's are synced.",
      type: 'success',
      delay: 0,
      showPrompt: misc_data.showPrompt ? misc_data.showPrompt : false,
      promptTitle: 'Sync is in progress',
      promptText: "This won't take a long &#128578",
      showLoader: true,
    };
    if (misc_data.silentSync && !misc_data.silentSync && event) {
      // event.reply(SHOW_NOTIFICATION, JSON.stringify(notifyData));
    }

    try {
      // const result = await generateSyncpayload(global.storeDetails.store_id);
      notifyData.showPrompt = false;
      // return;
      let unsyncedOrders = await Bill.count({
        where: {
          sync_status: 0,
          store_id: global.storeDetails.store_id,
        },
      });

      const unsyncedKot = await KOT.count({
        where: { sync_status: 0, store_id: global.storeDetails.store_id },
      });

      // unsyncedOrders = unsyncedOrders ? unsyncedOrders : unsyncedKot;
      unsyncedOrders = unsyncedOrders || 1;

      if (unsyncedKot > unsyncedOrders) {
        unsyncedOrders = unsyncedKot;
      }

      let result;
      // return;
      if ((unsyncedOrders || unsyncedKot) && !isSyncInProcess) {
        for (let offset = 0; offset < unsyncedOrders; offset += OFFSET) {
          isSyncInProcess = true;
          // sleep added because in rare case fulfilled order sending first and then pending order
          // eslint-disable-next-line no-await-in-loop
          await sleep(4000);

          // eslint-disable-next-line no-await-in-loop
          result = await generateSyncpayload(
            global.storeDetails.store_id,
            offset,
          );
          // console.log('sync payload::', JSON.stringify(result));
          // return;
          if (result && result.list) {
            console.log(
              `Message="Sync Started" OrderID="${result.billidstoSync}"`,
            );

            console.log(
              `Message="Sync Started" KOTID="${result.kotidstosync}"`,
            );
            // let billidstoSync = [];
            const billidstoSync = result.billidstoSync;
            // result.billidstoSync = undefined;

            // eslint-disable-next-line no-await-in-loop
            const { data: parsedBody } = await apiCall.post(
              Config.links.syncBills,
              result,
              {
                headers: getHeadersformpos(),
                timeout: 25000,
              },
            );

            // console.log('parsedBody:', parsedBody);
            if (parsedBody && parsedBody.status === HttpStatusCode.Ok) {
              // checking this for performance imporvement same order goes multiple time
              // after settle bill order id's coming from backend

              // for time being commenting this
              // billidstoSync = parsedBody.billidstoSync;
              // eslint-disable-next-line no-await-in-loop
              await syncPostprocessing({
                event,
                parsedBody,
                notifyData,
                misc_data,
                deleteStorechecked,
                deleteSaleRecordchecked,
                billidstoSync,
                syncedkotIdlist: parsedBody.kotSyncList,
                unsyncedOrders,
                offset,
              });
              // await sleep(4000);
            } else {
              isSyncInProcess = false;
              notifyData.message = 'No data to sync';
              notifyData.type = 'error';
              notifyData.showPrompt = false;
              if (misc_data && !misc_data.silentSync && event)
                event.reply(SHOW_NOTIFICATION, JSON.stringify(notifyData));
            }
            console.log(`Message="Sync Completed"`);
          } else {
            isSyncInProcess = false;
            notifyData.message = 'No data to sync';
            notifyData.type = 'error';
            notifyData.showPrompt = false;
            if (misc_data && !misc_data.silentSync && event)
              event.reply(SHOW_NOTIFICATION, JSON.stringify(notifyData));
          }

          // if offset is greater than unsynced orders but there is some unsynced orders
          // so in this case call startSync method once more
          if (offset >= unsyncedOrders && unsyncedOrders) {
            startSync();
          }
          // Check if pending bill's exists
          // let hastoPass = result?.hash;
          // doespendingbillExists(global.storeDetails.store_id, hastoPass);
        }
      } else {
        isSyncInProcess = false;
      }
    } catch (error) {
      isSyncInProcess = false;
      console.error(`Message="Error Occured while syncing.`, error);
      if ([401].includes(error?.status)) {
        global.reloginfromremote();
      }
      notifyData.message =
        'Sync Failed.This may be caused due to network issue';
      notifyData.type = 'error';
      notifyData.showPrompt = false;
      if (misc_data && !misc_data.silentSync && event)
        event.reply(SHOW_NOTIFICATION, JSON.stringify(notifyData));

      setTimeout(() => {
        // eslint-disable-next-line no-use-before-define
        doespendingbillExists(global.storeDetails.store_id);
      }, 5000);
    }

    // setTimeout(() => {
    //   doespendingbillExists(global.storeDetails.store_id, undefined);
    // }, 3000);
  }
}

// const sendLivesyncrequest = debounce((forceSync) => {
//   if (
//     (global.storeDetails && global.storeDetails.live_tracking_enabled) ||
//     forceSync
//   ) {
//     console.log(`Message="Sending live tracking info...."`);
//     const data = { silentSync: true, logout: false };
//     startSync(undefined, data, false);
//   }
// }, 8000);

// new implementation

// let timerId = null;
// let lastCallTime = null;
// let hasExecuted = false;
let syncTimeInterval = 8;
if (global.syncTimeInterval) {
  syncTimeInterval = Number(global.syncTimeInterval);
}

function setSyncTimeInterval() {
  if (global.syncTimeInterval) {
    syncTimeInterval = Number(global.syncTimeInterval);
  }
}

// Shared debounced function for startSync
const debouncedStartSync = debounce(
  async ({ event, content, forceSync, silentSync, logout }) => {
    try {
      const data = content || { silentSync: !!silentSync, logout: !!logout };
      const result = await startSync(event, data, false);
      if (event && global.mainWindow) {
        global.mainWindow.webContents.send('SYNC_BILL_REPLY', result);
      }
      console.log('startSync executed:', { result });
      return result;
    } catch (error) {
      console.error('Error in debouncedStartSync:', error);
    }
  },
  syncTimeInterval * 1000,
);

// // Function to handle live sync requests
// const sendLivesyncrequest = (forceSync = false) => {
//   if (
//     (global.storeDetails && global.storeDetails.live_tracking_enabled) ||
//     forceSync
//   ) {
//     console.log('Sending live tracking info....');
//     callStartSync({ forceSync, silentSync: true, logout: false });
//   }
// };

function createControlledSync(fn, interval) {
  let isWaiting = false;

  return async function (...args) {
    if (isWaiting) {
      console.log('startSync call skipped due to interval control');
      return;
    }

    isWaiting = true;

    try {
      await fn(...args);
    } finally {
      setTimeout(() => {
        isWaiting = false;
      }, interval);
    }
  };
}

const controlledStartSync = createControlledSync(
  startSync,
  syncTimeInterval * 1000,
);

const sendLivesyncrequest = debounce((forceSync) => {
  console.log('forceSync:::', forceSync);
  if (global.__IS_MASTER_POS__) {
    if (
      (global.storeDetails && global.storeDetails.live_tracking_enabled) ||
      forceSync
    ) {
      console.log(`Message="Sending live tracking info...."`);
      const data = { silentSync: true, logout: false };
      controlledStartSync(undefined, data, false);
    }
  }
}, syncTimeInterval * 1000);

// Shared function to call startSync (immediate or debounced)
const callStartSync = async ({
  event,
  content,
  forceSync,
  silentSync,
  logout,
}) => {
  if (forceSync) {
    // Immediate execution for forceSync
    const data = content || { silentSync: !!silentSync, logout: !!logout };
    const result = await startSync(event, data, false);
    if (event && global.mainWindow) {
      global.mainWindow.webContents.send('SYNC_BILL_REPLY', result);
    }
    return result;
  }
  // Queue through debounced function
  return debouncedStartSync({ event, content, forceSync, silentSync, logout });
};

// function sendLivesyncrequest(forceSync) {
//   const now = Date.now();
//   // First call or new session: execute immediately
//   if (!hasExecuted) {
//     console.log(`Message="Sending live tracking info...."`);
//     const data = { silentSync: true, logout: false };
//     startSync(undefined, data, false);
//     hasExecuted = true;
//   }

//   lastCallTime = now;

//   if (timerId) {
//     clearTimeout(timerId);
//   }

//   // Set a new timer for 5 minutes after the last call
//   timerId = setTimeout(() => {
//     const timeSinceLastCall = Date.now() - lastCallTime;

//     // Only execute if it's been 5 minutes since last call
//     if (timeSinceLastCall >= syncTimeInterval * 1000) {
//       if (
//         (global.storeDetails && global.storeDetails.live_tracking_enabled) ||
//         forceSync
//       ) {
//         console.log(`Message="Sending live tracking info...."`);
//         const data = { silentSync: true, logout: false };
//         startSync(undefined, data, false);
//       }
//       hasExecuted = false;
//       timerId = null;
//     }
//   }, syncTimeInterval * 1000);
// }

// till this

/**
 * Tell's if the passed store id has some pending bills
 * @param {*} db
 * @param {*} store_id
 */
async function doespendingbillExists(store_id, hash) {
  try {
    const bills = await Bill.count({
      where: {
        store_id,
        [Sequelize.Op.or]: [
          {
            order_state: 'pending',
          },
          {
            sync_status: 0,
          },
        ],
      },
    });
    const kotExists = await KOT.count({
      where: {
        store_id,
        [Sequelize.Op.or]: [
          {
            is_active: 1,
          },
          {
            sync_status: 0,
          },
        ],
      },
    });
    if (bills > 0 && kotExists > 0) {
      console.log(
        `Message="Pending bills found. Starting Sync" OrdersCount="${bills}" StoreID="${store_id}"`,
      );
      if (!previousSynchash) {
        previousSynchash = hash;
      }

      // CHeck if previous sync hash and current sync hash is same
      // if same increase a counter
      // this means same orders are being synced regularly
      if (previousSynchash === hash) {
        // eslint-disable-next-line no-plusplus
        sameBillssyncingcount++;
      } else {
        sameBillssyncingcount = 0;
        previousSynchash = hash;
      }

      // Check if threshold has crossed for of 5 consecutive requests of same
      // payload if yes add incremental delay
      if (sameBillssyncingcount > SAME_BILL_SYNC_THRESHOLD) {
        console.warn(
          `Message="Same bills are being sent. Adding more delay." Delay="Retring after ${
            sameBillssyncingcount * SAME_BILL_SYNC_THRESHOLD
          }s" StoreID="${store_id}"`,
        );
        setTimeout(() => {
          sendLivesyncrequest(true);
        }, sameBillssyncingcount * 5000);
      } else {
        sendLivesyncrequest(true);
      }
    } else {
      console.log(`Message="No Pending bills found." StoreID="${store_id}"`);
      sameBillssyncingcount = 0;
      previousSynchash = hash;
    }
  } catch (error) {
    console.log(error);
    sameBillssyncingcount = 0;
    previousSynchash = hash;
  }
}

/**
 * Checks if sync is needed
 * @param {DB Connection} db
 * @param {Store ID to check for} store_id
 */
async function issyncNeeded(store_id) {
  try {
    const bills = await Bill.count({
      where: {
        sync_status: 0,
        store_id,
      },
    });
    const kotExists = await KOT.count({
      where: {
        is_active: 0,
        store_id,
        sync_status: 0,
      },
    });
    if (bills > 0 || kotExists > 0) {
      return true;
    }
  } catch (error) {
    console.log(error);
  }
  return false;
}

/**
 * Tell's if the passed store id has some bill's
 *  and KOT not synced.
 * @param {DB COnnection} db
 * @param {*} store_id
 */
async function checkIfsyncisneeded(store_id) {
  let issynceNeeded = false;
  try {
    const bills = await Bill.count({
      where: {
        sync_status: 0,
        store_id,
      },
    });
    issynceNeeded = bills > 0;
    const kots = await KOT.count({
      where: {
        sync_status: 0,
        store_id,
      },
    });
    if (kots && kots > 0) {
      return true;
    }

    return issynceNeeded;
  } catch (error) {
    console.log(error);
  }
  return issynceNeeded;
}

/**
 * Deletes the current store data
 * @param {DB Connection} connection
 * @param {Store ID} store_id
 * @param {*} transaction
 */
async function deletestoreData(storeID, transaction) {
  try {
    await KOTCharges.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }
  try {
    await Charges.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }
  try {
    let rawactivetableList = await getActivetableWithSplitTableslist(
      storeID,
      transaction,
    );
    rawactivetableList = map(rawactivetableList, 'table_id');
    console.log('Table.destroy rawactivetableList::', rawactivetableList);
    await Table.destroy({
      where: {
        store_id: storeID,
        id: {
          [Sequelize.Op.notIn]: rawactivetableList,
        },
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }
  try {
    await Department.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
    await Department.destroy({
      where: {
        id: 987654,
      },
      transaction,
    });
  } catch (err) {
    console.log(err);
  }
  try {
    await Item.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }
  try {
    await Category.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }
  try {
    await Discount.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await ItemDiscount.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await Payment.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await Customer.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await DeliveryBoy.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }

  await Options.destroy({
    where: {
      store_id: storeID,
    },
    transaction,
  });
  try {
    await OptionGroup.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await KitchenDepartment.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }
  try {
    await StoreMapper.destroy({
      where: {
        tmpos_store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await ExpensesCategory.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }
  try {
    await ExpensesSubcategory.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }
  try {
    // await User.destroy({
    //   where: {
    //     store_id: storeID,
    //   },
    // });

    await User.destroy({
      where: {
        store_id: storeID,
        [Sequelize.Op.or]: [
          { assignedKitchedeps: null },
          { assignedKitchedeps: 0 },
        ],
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await CustomizedDiscount.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await ProductGroup.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }
  try {
    await Wallet.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }
  try {
    await Waiter.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await MultipricingSettings.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await PlatformMapping.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await Tax.destroy({
      where: {
        store_id: storeID,
      },
      transaction,
    });
  } catch (err) {
    console.error(err);
  }

  console.log('DB Cleared...');
  return 'success';
}

/**
 * Starts the sync process and does the post proceess after
 * data is fetched successfully
 * @param {Parameters} params
 */
async function startloadCatalog(params) {
  try {
    global.isLoadMenuInProgress = true;
    // Initial cleanup of old data to handle any crashes in the middle of a previous sync
    await resolveloadmenuTables();
    await resloveLoadUser(params.store_id);

    const { data: result } = await apiCall.post(
      params.loadmenuLink,
      { store_id: params.store_id, tmpos_id: global.storeDetails.tmpos_id },
      { headers: getHeadersformpos() },
    );
    if (result && result.status) {
      if (result.status === 200 && result.data) {
        await sequelize.transaction(async (t) => {
          // 1. Virtualize tables (Pre-sync conflict resolution)
          await resolvesyncmenuConflict(t);
          await resolvesyncmenuUserConflict(params.store_id, t);

          // 2. Clear old data and Load new catalog
          await deletestoreData(params.store_id, t);
          await addToDatabase(result.data, params.store_id, t);

          // 3. Restore virtual tables back to original tables (Post-sync resolution)
          await resolveloadmenuTables(t);
          await resloveLoadUser(params.store_id, t);
        });
        await startloadModifiersData();
        await startloadItemPricesData();
        await startloadItemNotesData();
        await startloadMiscDetailsData();
        global.isLoadMenuInProgress = false;
        params.event.reply(params.message, 'success');
        return;
      }
      if (result.status === 401) {
        global.isLoadMenuInProgress = false;
        global.reloginfromremote();
        return;
      }
      if (result.status === 401) {
        // params.event.reply(result.msg, 'error');
        global.isLoadMenuInProgress = false;
        params.event.reply(SHOW_NOTIFICATION, {
          type: 'error',
          message: result.msg,
        });

        return;
      }
    }
    params.event.reply(params.message, 'error');
  } catch (error) {
    await resolveloadmenuTables();
    console.log(error);
    if ([401].includes(error?.status)) {
      global.reloginfromremote();
    }
    global.isLoadMenuInProgress = false;
  }
}

async function readdCustomers(params) {
  let customers = [];
  try {
    const options = {
      store_id: params.store_id,
    };
    const result = await apiCall.post(Config.links.loadmenu, options, {
      headers: getHeadersformpos(),
    });
    if (result && result.status === 200 && result.data) {
      try {
        await Customer.destroy({
          where: {
            // NEW STOREWISE CHANGE 17 JAN 2020
            store_id: params.store_id,
          },
        });
        await Customer.bulkCreate(result.data.customer);
        customers = result.data.customer;
      } catch (err) {
        console.error(err);
      }
    } else if (result && result.status === 401) {
      global.reloginfromremote();
    }
  } catch (error) {
    console.log(error);
  }

  return customers;
}

/**
 * Send's the reduce inventory request to channel
 * @param {Parameters} content
 */
async function sendReduceinventoryrequest(content) {
  try {
    const { connection } = content;
    // eslint-disable-next-line no-param-reassign
    delete content.connection;
    let items;
    if (content.isModifiedBill) {
      items = await connection.BillItem.findAll({
        raw: true,
        include: [
          {
            model: connection.Bill,
            attributes: [],
            where: {
              store_id: content.store_id,
              order_id: content.order_id,
            },
          },
        ],
        attributes: ['id', 'item_id', ['title', 'name'], ['quantity', 'qty']],
        where: {
          orderMasterId: content.order_id,
          item_id: {
            [connection.Sequelize.Op.in]: content.itemIds,
          },
        },
      });
    } else {
      items = await connection.BillItem.findAll({
        raw: true,
        include: [
          {
            model: connection.Bill,
            attributes: [],
            where: {
              store_id: content.store_id,
              inventoryReduced: 0,
              order_id: content.order_id,
            },
          },
        ],
        attributes: ['id', 'item_id', ['title', 'name'], ['quantity', 'qty']],
        where: { orderMasterId: content.order_id },
      });
    }

    if (items && items.length > 0) {
      items.forEach(async (item) => {
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
      });
      content.items = items;
      // content.items[0].qty = content.quantity
      const newContent = {};
      if (Config.USE_NEW_API_BACKEND) {
        Object.assign(newContent, {
          store_id: global.storeDetails.store_id,
          list: [content],
        });
      }
      if (content.isModifiedBill) {
        delete content.itemIds;
        delete content.isModifiedBill;
      }

      const options = {
        method: 'POST',
        uri: Config.links.reduceInventory,
        body: Config.USE_NEW_API_BACKEND ? newContent : [content],
        json: true,
        headers: getHeadersformpos(),
        rejectUnauthorized: false,
      };

      // let result = await request(options);
      console.log('send reduce inventory request:', content.order_id);
      const { data } = await apiCall.post(options.uri, options.body, {
        headers: options.headers,
      });
      if (data && (data.status === 200 || data.statusCode === 200)) {
        await connection.Bill.update(
          { inventoryReduced: 1 },
          {
            where: { order_id: content.order_id },
          },
        );
      }
      return { content };
    }
  } catch (error) {
    return { error };
  }
  return {};
}

/**
 * Send's the coupon history if exists
 * @param {DB Interface} connection
 */
async function sendCouponhistory(params) {
  try {
    const couponHistory = await CoupondiscountHistory.findAll({
      raw: true,
      attributes: [
        'tmpos_id',
        'store_id',
        'logedin_user',
        ['coupon_code', 'coupan_code'],
        'customer_name',
        'customer_phone',
        'order_id',
        ['coupon_code_amt', 'coupan_code_amt'],
        'order_id',
      ],
      where: {
        store_id: params.store_id,
        sync_flag: 0,
      },
    });

    if (Config.USE_NEW_API_BACKEND) {
      if (couponHistory && couponHistory.length > 0) {
        const axiosresponse = await apiCall.post(
          Config.links.couponDiscountHistory,
          { history: couponHistory, store_id: global.storeDetails.store_id },
          { headers: getHeadersformpos() },
        );
        const response = axiosresponse.data;
        if (response && response.statusCode) {
          if (response.statusCode === 200 && Array.isArray(response.data)) {
            const insertedCoupons = response.data;
            insertedCoupons.forEach(async (element) => {
              if (element.status === 'success') {
                await CoupondiscountHistory.update(
                  { sync_flag: 1 },
                  {
                    where: {
                      order_id: element.order_id,
                    },
                  },
                );
              }
            });
          } else if (response.status === 401) {
            global.reloginfromremote();
          }
        }
      }
    } else if (couponHistory && couponHistory.length > 0) {
      const axiosresponse = await apiCall.post(
        Config.links.couponDiscountHistory,
        { history: couponHistory },
        { headers: getHeadersformpos() },
      );
      const response = axiosresponse.data;
      if (response && response.status) {
        if (response.status === 200 && Array.isArray(response.msg)) {
          const insertedCoupons = response.msg;
          insertedCoupons.forEach(async (element) => {
            if (element.status === 'success') {
              await CoupondiscountHistory.update(
                { sync_flag: 1 },
                {
                  where: {
                    order_id: element.order_id,
                  },
                },
              );
            }
          });
        } else if (response.status === 401) {
          global.reloginfromremote();
        }
      }
    }
    // console.log(couponHistory);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Sync customer if ther are any to sync
 * @param {parms} params
 */
async function syncCustomersifany(params) {
  try {
    const customers = await Customer.findAll({
      raw: true,
      where: {
        store_id: params.store_id,
        sync_flag: 0,
      },
    });

    if (!customers.length) {
      return;
    }
    const postData = {
      list: customers,
      store_id: params.store_id,
    };

    const result = await apiCall.post(Config.links.addCustomerbulk, postData, {
      headers: getHeadersformpos(),
    });
    if (result && result.data && [200, '200'].includes(result.data.status)) {
      await Customer.update(
        { sync_flag: 1 },
        {
          where: { store_id: params.store_id },
        },
      );
    } else if (result.status === 401) {
      global.reloginfromremote();
      setTimeout(syncCustomersifany, 180000, {
        store_id: params.store_id,
      });
    }
  } catch (error) {
    console.log(error);
  }
}

async function sendResetdatedetails(
  next_reset_info,
  store_id,
  storeupdateDetails,
) {
  if (!global.internetConnectionavailable) {
    setTimeout(() => {
      sendResetdatedetails(next_reset_info, store_id, storeupdateDetails);
    }, 10000);
    return;
  }
  // setTimeout(() => {
  //   global.mainWindow.webContents.send(
  //     BILL_NUMBER_RESET_DATE_NOTIFICATION,
  //     next_reset_info,
  //   );
  // }, 5000);

  const postData = {
    store_id,
    next_reset_info,
  };
  console.log(
    `Message="Reset Date payload" Payload=${JSON.stringify(
      postData,
    )} StoreID="${store_id}`,
  );
  try {
    console.log(
      `Message="Sending Reset Date to Backend" StoreID="${store_id}"`,
    );
    const token = getHeadersformpos();
    if ((token && !token['x-tmbill-key']) || !token) {
      setTimeout(() => {
        sendResetdatedetails(next_reset_info, store_id, storeupdateDetails);
      }, 10000);
      return;
    }
    const { data } = await apiCall.put(Config.links.sendresetdates, postData, {
      headers: getHeadersformpos(),
    });

    if (data.status === HttpStatusCode.Ok) {
      console.log(
        `Message="Reset Date Sent Sucessfully to Backend" StoreID="${store_id}"`,
      );
      // console.log('storeupdateDetails::', storeupdateDetails);
      const storeupdateresult = await Store.update(storeupdateDetails, {
        where: {
          store_id,
        },
      });
      console.log('storeupdateresult::', storeupdateresult);
      if (storeupdateresult) {
        console.log('reset date updated locally');
        await global.getStoredetailsforremote();
      }
    }
  } catch (error) {
    console.error(
      `Message="Error While Sending Reset Date to Backend" StoreID="${store_id}"`,
      error,
    );
    setTimeout(() => {
      sendResetdatedetails(next_reset_info, store_id);
    }, 10000);
  }
}

async function updateRewardhistory({ status, order_id }) {
  const postData = {
    action: 'update',
    status,
    order_id,
    store_id: global.storeDetails.store_id,
    tmpos_id: global.storeDetails.tmpos_id,
  };
  try {
    // console.log('send reward history:::', postData);
    const result = await apiCall.post(Config.links.rewardHistory, postData, {
      headers: getHeadersformpos(),
    });
    const response = result.data;
    if ([401].includes(response.status)) {
      global.reloginfromremote();
      setTimeout(() => {
        updateRewardhistory({ status, order_id });
      }, 8000);
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Set passcode status
 * @param {Logged activity list} activityList
 */
function setPasscodeactivitysyncstatus(activityList) {
  try {
    if (activityList && Array.isArray(activityList) && activityList.length) {
      PasscodeActivity.update(
        { sync_status: 1 },
        {
          where: {
            activity_id: {
              [Sequelize.Op.in]: activityList,
            },
          },
        },
      );
    }
  } catch (error) {
    console.log(error);
  }
}

async function sendPasscodeactivity({ store_id }) {
  try {
    const passcodeactivityList = await PasscodeActivity.findAll({
      where: {
        store_id,
        sync_status: 0,
      },
    });
    const postData = {
      list: passcodeactivityList,
      store_id: global.storeDetails.store_id,
      tmpos_id: global.storeDetails.tmpos_id,
    };
    const result = await apiCall.post(
      Config.links.logpasscodeActivity,
      postData,
      {
        headers: getHeadersformpos(),
      },
    );
    if (result && result.data) {
      const response = result.data;
      if (response.status === 200 && response.syncActivityId) {
        setPasscodeactivitysyncstatus(response.syncActivityId);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

function createSyncinterval() {
  try {
    if (syncIntervalid) {
      clearInterval(syncIntervalid);
    }
    syncIntervalid = setInterval(() => {
      if (!isSyncInProcess) {
        console.log(
          `Mesage="Syncing using interval" Timestamp="${Date.now()}"`,
        );
        doespendingbillExists(global.storeDetails?.store_id);
      }
    }, 600000); // Start a sync every 10 minutes
  } catch (error) {
    console.error(`Message="Error While Creating Sync Interval"`, error);
    if (syncIntervalid) {
      clearInterval(syncIntervalid);
    }
  }
}

module.exports = {
  sendLivesyncrequest,
  sendPasscodeactivity,
  updateRewardhistory,
  sendResetdatedetails,
  syncCustomersifany,
  syncStartenddaydata,
  sendCouponhistory,
  addToDatabase,
  checkIfsyncisneeded,
  issyncNeeded,
  startloadCatalog,
  deletestoreData,
  startSync,
  sendReduceinventoryrequest,
  readdCustomers,
  createSyncinterval,
  setSyncTimeInterval,
  callStartSync,
  controlledStartSync,
};
