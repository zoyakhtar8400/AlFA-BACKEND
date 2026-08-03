/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
const CryptoJS = require('crypto-js');
const connection = require('../js/database');
const { apiCall } = require('../services/APIService');
const { getHeadersformpos } = require('../services/MiscServices');
const {
  LOAD_SETTING_REQUEST_FROM_SERVER,
  LOAD_ACCESS_LEVEL_REQUEST_FROM_SERVER,
  LOAD_USERS_REQUEST_FROM_SERVER,
  LOAD_PAYMENT_MODES_REQUEST_FROM_SERVER,
} = require('../util/IPC_Messages');
const { safeParse } = require('../util/RendererUtils');
// const { initializeListeners } = require('../js/MainIPClisteners');

const stringConstructor = 'test'.constructor;
// const { resetCurrentaccesslevel, inittoplevelsAccess  }= require('../js/AccesslevelManager');

async function fetchData(posSettings, users, paymenModes, storeInfo) {
  try {
    const response = await apiCall.post(
      global.Config.links.catalogueReload,
      {
        store_id: global.storeDetails.store_id,
        tmpos_id: global.storeDetails.tmpos_id,
        pos_settings: posSettings || 0,
        users: users || 0,
        payment_modes: paymenModes || 0,
        store_info: storeInfo || 0,
        billing_user_setting_username: global.storeDetails.username,
      },
      {
        headers: getHeadersformpos(),
      },
    );
    if (response) {
      return response;
    }
  } catch (err) {
    console.log('err', err);
  }
  return undefined;
}

async function updateSettingsOnNotification(params) {
  const settings = params.settings.filter((item) => item.id != 145);
  settings.forEach(async (setting) => {
    if (
      setting.value !== null &&
      setting.value?.constructor === 'test'.constructor
    ) {
      await connection.Settings.update(
        {
          value: Number(setting.value),
          title: setting.title,
        },
        {
          where: {
            id: setting.id,
          },
        },
      );
      if (typeof setting.value === 'string') {
        await connection.Settings.update(
          {
            value: setting.value,
            title: setting.title,
          },
          {
            where: {
              id: setting.id,
            },
          },
        );
      }
    } else {
      if (setting.id === 141) {
        //
      }
      if (setting.id === 32) {
        const settingValues = Object.values(setting.value);
        const value = settingValues.join(',');
        await connection.Settings.update(
          {
            value,
            title: setting.title,
          },
          {
            where: {
              id: setting.id,
            },
          },
        );
      } else {
        await connection.Settings.update(
          {
            value: setting.value !== null ? JSON.stringify(setting.value) : '',
            title: setting.title,
          },
          {
            where: {
              id: setting.id,
            },
          },
        );
      }
    }
  });
  return 'success';
}

// delete user
async function deleteUsers() {
  try {
    await connection.User.destroy({
      where: {
        store_id: global.storeDetails.store_id,
      },
    });
  } catch (err) {
    console.error(err);
  }
}

// add users to database
async function addUsersToDatabase(data) {
  if (data.captain_users) {
    if (data.captain_users && data.captain_users.length > 0) {
      data.captain_users.forEach(async (user) => {
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

        try {
          user.password = CryptoJS.AES.encrypt(
            user.password,
            global.Config.cipherKey,
          ).toString();
          await connection.User.create(user);
        } catch (err) {
          console.error(err);
        }
      });
    }
  }
}

// delete payment modes
async function deletePaymentModes() {
  try {
    await connection.Payment.destroy({
      where: {
        store_id: global.storeDetails.store_id,
      },
    });
  } catch (err) {
    console.error(err);
  }
}

async function addPaymentModesTodatabase(data) {
  if (data.payment_modes) {
    try {
      await connection.Payment.bulkCreate(data.payment_modes);
    } catch (err) {
      console.error(err);
    }
  }
}

async function updateAccesslevelsOnNotification(accessLevels) {
  if (accessLevels) {
    const updateAccesslevel = await connection.Store.update(
      {
        access_levels: accessLevels,
      },
      {
        where: {
          store_id: global.storeDetails.store_id,
        },
      },
    );
    if (updateAccesslevel) {
      Object.assign(global.storeDetails, {
        access_levels: JSON.stringify(accessLevels),
      });
      return 'success';
    }
  }
  return undefined;
}

global.betteripcMain.answerRenderer('update-pos-settings', async (params) => {
  await updateSettingsOnNotification(params);
});

global.betteripcMain.answerRenderer(
  LOAD_SETTING_REQUEST_FROM_SERVER,
  async () => {
    try {
      const response = await fetchData(1, 0, 0);
      if (response && response.data && response.data.result) {
        const currentposSettings = [];
        const settings = response.data.result.pos_settings;
        currentposSettings.push(
          ...settings.bill_print_settings,
          ...settings.general_settings,
          ...settings.kot_print_settings,
        );

        const result = await updateSettingsOnNotification({
          settings: currentposSettings,
        });

        if (result) {
          // global.mainWindow.webContents.send(MENU_LOADED_RELOAD_APP, {});
          const posSettings = await connection.Settings.findAll({
            raw: true,
            order: [['id', 'ASC']],
          });
          if (posSettings) {
            global.mainWindow.webContents.send('set-settings', {
              settings: posSettings,
            });
          }
        }

        // check if other settings are provided
        if (
          settings.misc_settings &&
          global.storeDetails &&
          global.storeDetails.extra_info
        ) {
          const storeExtrainfo = safeParse(
            global.storeDetails.extra_info || {},
          );
          // eslint-disable-next-line node/no-unsupported-features/es-syntax
          const extraInfo = {
            ...storeExtrainfo,
            pos_settings: currentposSettings,
            misc_settings: settings.misc_settings,
          };

          await connection.Store.update(
            {
              extra_info: extraInfo,
            },
            {
              where: {
                store_id: global.storeDetails.store_id,
              },
            },
          );
        }
        // initializeListeners();
        global.initializeMainIpcListenersFromRemote();
      }
    } catch (err) {
      console.log('err', err);
    }
  },
);

global.betteripcMain.answerRenderer(
  LOAD_ACCESS_LEVEL_REQUEST_FROM_SERVER,
  async () => {
    try {
      const response = await fetchData(1, 0, 0, 0);
      if (
        response &&
        response.data &&
        response.data.result &&
        response.data.result.access_levels &&
        response.data.result.access_levels.length
      ) {
        const result = await updateAccesslevelsOnNotification(
          response.data.result.access_levels[0].access_levels,
        );
        if (result === 'success') {
          global.mainWindow.webContents.send('set-access-levels', {
            access_levels: JSON.stringify(
              response.data.result.access_levels[0].access_levels,
            ),
          });
        }
      }
    } catch (err) {
      console.log('err', err);
    }
  },
);

// load users
global.betteripcMain.answerRenderer(
  LOAD_USERS_REQUEST_FROM_SERVER,
  async () => {
    try {
      const response = await fetchData(0, 1, 0, 0);
      if (
        response &&
        response.data &&
        response.data.result &&
        response.data.result.captain_users
      ) {
        await deleteUsers();
        await addUsersToDatabase(response.data.result);
      }
    } catch (err) {
      console.log('err', err);
    }
  },
);

// load payment modes
global.betteripcMain.answerRenderer(
  LOAD_PAYMENT_MODES_REQUEST_FROM_SERVER,
  async () => {
    try {
      const response = await fetchData(0, 0, 1, 0);
      if (response && response.data && response.data.result) {
        await deletePaymentModes();
        await addPaymentModesTodatabase(response.data.result);
        // if(result){
        //     global.mainWindow.webContents.send(MENU_LOADED_RELOAD_APP, {});
        // }
      }
    } catch (err) {
      console.log('err', err);
    }
  },
);

// load outlet settings
global.betteripcMain.answerRenderer(
  'load-outlet-settings-request-from-server',
  async () => {
    try {
      const response = await fetchData(0, 0, 0, 1);
      if (
        response &&
        response.data &&
        response.data.result &&
        response.data.result
      ) {
        const store = response.data.result.store_settings;
        console.log('load-outlet-settings-request-from-server store::', store);
        let notificationEmails = [];
        if (store.config.notification_emails) {
          notificationEmails = store.config.notification_emails.split(',');
        }
        let contactPhone = [];
        if (store.config.contact_phone) {
          contactPhone = store.config.contact_phone.split(',');
        }
        const extraInformation = {
          pincode: store.pin_code || null,
          gstNo: store.gst_no || null,
          isHBIntegrate: store.hostbook_integration || null,
          isReeloIntegrate: store.config.reelo_integration || null,
          channels_enabled: store.config.channels_enabled || null,
          enable_multipricing: store.config.enable_multipricing || 0,
          enable_customer_loyalty: store.config.enable_customer_loyalty || 0,
          bharatpe_integration: store.config.bharatpe_integration || 0,
          phonepe_integration: store.config.phonepe_integration || 0,
          zomato_pay_integration: store.config.zomato_pay_integration || 0,
          sunmi_integration: store.storeDetails?.config?.sunmi_integration || 0,
          tally_integration: store.config.tally_integration || 0,
          call_center: store.config.call_center || 0,
          bill_number_length: store.config.bill_number_length || 0,
          auto_update_pos: store.config.auto_update_pos || 0,
          generateOrderTypeWiseOrderNumber:
            store.config.generateOrderTypeWiseOrderNumber || 0,
          verify_pos_system_date: store.config.verify_pos_system_date || 0,
          partial_order_accept: store?.ondc?.partial_accept_order || null,
          allow_cancel_item: store?.ondc?.allow_cancel_item || null,
          notification_emails: notificationEmails,
          contact_phone: contactPhone,
          dial_code: store.dial_code,
          day_close_time: store.day_close_time,
        };

        // fetch store extra_info and update it
        const storeDetails = await connection.Store.findOne(
          { raw: true },
          {
            where: {
              store_id: global.storeDetails.store_id,
            },
          },
        );

        let extraInfo = {};
        if (storeDetails?.extra_info) {
          const storeExtrainfo = safeParse(storeDetails.extra_info);
          // eslint-disable-next-line node/no-unsupported-features/es-syntax
          extraInfo = { ...storeExtrainfo, ...extraInformation };
        }
        const updatestore = await connection.Store.update(
          {
            store_name: store.name,
            store_phone: store.contact_phone,
            user_line_1: store.address,
            reset_kot_time: store.next_reset_dates.nextkotresetDate,
            reset_bill_time: store.next_reset_dates.nextbillresetDate,
            reset_kot_indays: store.next_reset_dates.resetKotafterdays,
            resetBillAfterDays: store.next_reset_dates.resetBillafterdays,
            disable_ordering: store.active,
            logout_after_close_pos_apps: store.logout_after_close_pos_app,
            enabled_passcode_protection: store.enabled_passcode_protection,
            tenant_id: store.tenant_id,
            pdam_start_time: store.pdam_start_time,
            pdam_end_time: store.pdam_end_time,
            reduce_inventory: store.reduce_inventory,
            alternative_outlet_name: store.alternative_outlet_name,
            store_email: store.email,
            upi_id: store.upi_id,
            bill_number_prefix: store.bill_number_prefix,
            secondary_bill_prefix: store.secondary_bill_prefix,
            bar_bill_prefix: store.bar_bill_prefix,
            show_upi: store.showupi_id,
            is_bar_section_billing: store.is_bar_section_billing,
            show_phone_on_bill: store.show_phone_on_bill,
            note: store.note,
            footer_note: store.footer_note,
            field1: store.field1,
            field2: store.field2,
            field3: store.field3,
            field4: store.field4,
            field5: store.field5,
            extra_info: extraInfo,
            brand_name: store.brand_name,
            country: store.country,
            point_of_contact: store.point_of_contact,
          },
          {
            where: {
              store_id: global.storeDetails.store_id,
            },
          },
        );
        if (store.config) {
          // if(store.config.enabled_round_off){

          await connection.Settings.update(
            {
              title: 'enable-round-off-bill',
              value: store.config.enabled_round_off,
            },
            {
              where: {
                id: 29,
              },
            },
          );

          global.DO_BILL_ROUNDOFF = store.config.enabled_round_off;
          // }

          if (store.config.roundoff_upto_decimal) {
            await connection.Settings.update(
              {
                title: 'round-off-upto-decimal',
                value: store.config.roundoff_upto_decimal,
              },
              {
                where: {
                  id: 66,
                },
              },
            );

            global.ROUNDOFF_UPTO = store.config.roundoff_upto_decimal;
          }
        }
        if (updatestore) {
          const storeDetail = await connection.Store.findOne({
            raw: true,
            where: {
              store_id: global.storeDetails.store_id,
            },
          });

          // update settings of round off upto in database as well main and renderer process
          //
          global.mainWindow.webContents.send('set-store-details', {
            storeDetails: storeDetail,
            doRoundOff: store.config.enabled_round_off,
            roundOffUpto: store.config.roundoff_upto_decimal,
          });
          global.storeDetails = storeDetail;
        }
      }
    } catch (err) {
      console.log('err', err);
    }
  },
);

module.exports = {
  updateSettingsOnNotification,
};
