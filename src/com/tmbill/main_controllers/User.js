const { app } = require('electron');
const CryptoJS = require('crypto-js');
const { forEach, get } = require('lodash');
const si = require('systeminformation');
const ip = require('ip');
const os = require('os');
const {
  User,
  PasscodeActivity,
  Store,
  UserLoginStatus,
} = require('../js/database');
const {
  USER_MODEL_IPC,
  LOGOUT_USER_FORCEFULLY,
} = require('../util/IPC_Messages');
const { sendLogpasscodeactivity } = require('./SyncListeners');
const { resolveGeoIp } = require('../main/services/IP.service');

// let stringConstructor = "test".constructor;

/**
 * Get users
 * @param {filter params} params
 */
async function getUsers(params) {
  let users = [];
  try {
    const whereFilter = {
      store_id: params.store_id,
    };
    if (params.filterByterminal) {
      Object.assign(whereFilter, {
        is_terminal_app: 1,
      });
    }
    if (params.filterBykds) {
      Object.assign(whereFilter, {
        is_kds_app: 1,
      });
    }

    users = await User.findAll({
      raw: true,
      where: whereFilter,
    });
  } catch (error) {
    console.log(error);
    users = [];
  }
  return users;
}

async function updateassingedDepartments(params) {
  const response = { status: 200, message: '' };
  try {
    const result = await User.update(
      {
        assignedKitchedeps: params.assignedKitchedeps,
      },
      {
        where: {
          id: params.username,
        },
      },
    );
    if (result) {
      const users = await getUsers({
        store_id: params.store_id,
        filterBykds: true,
      });
      Object.assign(response, {
        users,
      });
    }
  } catch (error) {
    Object.assign(response, {
      status: 400,
      message: 'Update Failed',
    });
  }
  return response;
}

async function checkUserpasscodeandaccess({ passcode, context }) {
  const reply = { status: 400, message: '', passcodeMatched: false };
  try {
    const passcodeuserList = await User.findAll({
      raw: true,
      where: {
        userCategory: 5, // Passcode user,
        store_id: global.storeDetails.store_id,
      },
    });
    // eslint-disable-next-line no-restricted-syntax
    for (const currentUser of passcodeuserList) {
      const bytes = CryptoJS.AES.decrypt(
        currentUser.password,
        global.Config.cipherKey,
      );
      const plaintext = bytes.toString(CryptoJS.enc.Utf8);
      if (plaintext === passcode && context) {
        // check the access type
        const { permission } = context;
        let rawAccesslevel = currentUser.passcode_access_levels;
        const eventDetails = context.event_details;
        rawAccesslevel = JSON.parse(rawAccesslevel);
        const isPresent = get(rawAccesslevel, permission);
        Object.assign(reply, {
          passcodeMatched: true,
          status: 200,
          username: currentUser.username,
          hasPermission: isPresent === 1,
          requestedPermission: permission,
        });
        PasscodeActivity.create({
          activity: context.feature,
          requested_permission: permission,
          activity_id: global.generateId(),
          billing_user: eventDetails.billingUser || null,
          passcode_user: currentUser.username,
          order_id: eventDetails.order_id || null,
          bill_number: eventDetails.bill_number || null,
          kot_number: eventDetails.kot_number || context.kot_number || null,
          store_id: global.storeDetails.store_id,
          tmpos_id: global.storeDetails.tmpos_id,
          extra_details: eventDetails.extra_details || null,
          permission_given: isPresent === 1,
          activity_event_id: context.id,
        });

        sendLogpasscodeactivity({ store_id: global.storeDetails.store_id });
      }
    }
  } catch (error) {
    console.log(error);
  }
  return reply;
}

async function generateTrackinginfo() {
  const valueObject = {
    cpu: 'manufacturer,brand,processors,cores',
    osInfo: 'platform, release',
    system: 'model, manufacturer',
  };

  const trackingInfo = {};
  // Get general systems data
  const generalData = await si.get(valueObject);
  // Get systems RAM
  const memoryInfo = await si.mem();
  const totalRam = Math.round(memoryInfo.total / 1024 / 1024 / 1024);
  const { username } = os.userInfo();

  // Get printers connected
  const rawprintersInfo = await si.printer();
  const printersInfo = [];
  Object.assign(generalData, { RAM: totalRam });
  if (rawprintersInfo && rawprintersInfo.length) {
    forEach(rawprintersInfo, (info) => {
      printersInfo.push({
        name: info.name,
        model: info.model,
      });
    });
  }

  // Get added stores info
  const outletsadded = await Store.findAll({
    raw: true,
    attributes: ['store_id', 'store_name'],
  });

  // Get system addresses
  const systemAdress = await si.uuid();

  Object.assign(systemAdress, {
    internalIP: ip.address(),
  });

  const userDetails = await resolveGeoIp();
  if (userDetails?.ip) {
    Object.assign(trackingInfo, {
      userDetails,
    });
  }

  Object.assign(trackingInfo, {
    generalData,
    printersInfo,
    appVersion: app.getVersion(),
    outletsadded,
    systemAdress,
    system_username: username,
  });

  return trackingInfo;
}

async function logoutUserForcefully(params) {
  try {
    const result = await UserLoginStatus.update(
      { status: 0 },
      {
        where: {
          id: params.id,
          username: params.username,
        },
      },
    );
    return result;
  } catch (error) {
    console.error(
      'Message="Error while logging out user forcefully" Error=',
      error,
    );
  }
}
global.betteripcMain.answerRenderer(
  USER_MODEL_IPC.CHECK_USER_PASSCODE_ASYNC,
  async (params) => {
    const result = await checkUserpasscodeandaccess(params);
    return result;
  },
);

global.betteripcMain.answerRenderer(
  USER_MODEL_IPC.GET_POS_USERS_ASYNC,
  async (params) => {
    const result = await getUsers(params);
    return result;
  },
);

global.betteripcMain.answerRenderer(
  USER_MODEL_IPC.UPDATE_ASSIGNED_DEPS,
  async (params) => {
    const result = await updateassingedDepartments(params);
    return result;
  },
);

global.betteripcMain.answerRenderer(
  USER_MODEL_IPC.GET_USER_TRACKING_INFO,
  async () => {
    const result = await generateTrackinginfo();
    return result;
  },
);

// logout user forcefully
global.betteripcMain.answerRenderer(LOGOUT_USER_FORCEFULLY, async (params) => {
  const responseData = await logoutUserForcefully(params);
  return responseData;
});

module.exports = {
  checkUserpasscodeandaccess,
};
