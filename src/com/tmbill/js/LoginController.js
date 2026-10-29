/* eslint-disable no-console */
require('../hooks/i18n');
const CryptoJS = require('crypto-js');
const commandlineArgv = require('minimist')(process.argv);
window.Swal = require('sweetalert2');
window.Config = require('../config/config').Config;
const remote = require('@electron/remote');
const { Titlebar, TitlebarColor } = require('custom-electron-titlebar');
const Mousetrap = require('mousetrap');
const address = require('address');
const { openHelpwindow } = require('./OrderMisc');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
window.notifyUser = require('../util/Notification');
require('../notifications/push_service');
const { apiCall } = require('../services/APIService');
const { setLocalStorage, getLocalStorage } = require('../storage');
const { safeParse } = require('../util/RendererUtils');
const { initializevirtualKeyboard } = require('./VirtualKeyboard');
const { throttle } = require('lodash');
const { machineId } = require('node-machine-id');
const { getSysyteminfo } = require('./Helperfunctions');
const { sleep } = require('../util/MiscUtil');

let trackingInfo;
async function waitForTrackingInfo(timeout = 5000) {
  const step = 200;
  let waited = 0;

  while (!trackingInfo && waited < timeout) {
    await sleep(step);
    waited += step;
  }

  return !!trackingInfo;
}
let apptitleBar;

async function openOrderwindow(storedetails, token) {
  let password = document.getElementById('user_password')?.value;

  if (!password && storedetails?.password) {
    password = storedetails.password;
  }

  const cipherPassword = CryptoJS.AES.encrypt(
    password || '',
    window.Config.cipherKey,
  );

  storedetails.password = cipherPassword.toString();
  storedetails.token = token;

  window.ipcRenderer.send('login-success', JSON.stringify({ storedetails }));
}

async function openOrderwindowforterminal(response) {
  // override the access level on store level with terminal access levels
  if (response.storeDetails && response.data) {
    if (response.storeDetails?.access_levels) {
      const accessLevels = safeParse(response.storeDetails?.access_levels);
      response.storeDetails.access_levels = accessLevels;
    }

    if (response.data?.terminal_access_levels) {
      response.storeDetails.access_levels =
        response.data?.terminal_access_levels;
      setLocalStorage(
        'terminal_access_levels',
        response.data?.terminal_access_levels,
      );
    }

    if (response.storeDetails?.custom_qr_codes) {
      const customqrCodes = safeParse(response.storeDetails?.custom_qr_codes);
      response.storeDetails.custom_qr_codes = customqrCodes;
    }

    if (response.storeDetails?.point_of_contact) {
      const poc = safeParse(response.storeDetails?.point_of_contact);
      response.storeDetails.point_of_contact = poc;
    }

    if (response.storeDetails?.extra_info) {
      const extraInfo = safeParse(response.storeDetails?.extra_info);
      Object.assign(extraInfo, {
        master_pos_username: response.storeDetails.username,
      });
      response.storeDetails.extra_info = extraInfo;
    }
    if (response.password) {
      response.storeDetails.password = response.password;
    }
  }
  window.ipcRenderer.send('login-success', JSON.stringify(response));
}

/**
 * PASSWORD login (from main branch) - unchanged logic
 */
async function checkLogin({ accessCodeUserName, accessCodePassword } = {}) {
  if (!navigator.onLine) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:homecontrollerNotifications.Billisrunningyoucannotlogout',
      ),
    );
  }
  // Retrieve the input fields
  const userName =
    accessCodeUserName || document.getElementById('user_name')?.value.trim();

  const userPassword =
    accessCodePassword ||
    document.getElementById('user_password')?.value.trim();

  const MACHINE_ID = await machineId();

  if (userName && userPassword) {
    if (userName) {
      if (userName.length > 50) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:loginControllerNotifications.usernamelengthshouldbelessthanfifty',
          ),
        );
        return;
      }

      if (window.specialCharRegex.test(userName)) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:loginControllerNotifications.Pleaseentervalidusername',
          ),
        );
        return;
      }
    }

    if (userPassword) {
      if (userPassword.length > 15) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:loginControllerNotifications.usernamelengthshouldbelessthanfifteen',
          ),
        );
        return;
      }
    }

    let macAddress = '';
    address.mac((err, addr) => {
      macAddress = addr;
    });

    const currentDate = new Date().getTime();
    document.getElementById('login').textContent = $.i18n.t(
      'controller:login.Verifying',
    );

    $('#login').prop('disabled', true);

    const options = {
      body: {
        username: userName,
        password: userPassword,
        appVersion: commandlineArgv.appVersion || '',
        subscription: window.firebaseToken,
        type: 5,
        mac_address: macAddress,
        system_date: currentDate,
        extra_details: { ...trackingInfo },
        machine_id: MACHINE_ID,
      },
    };
    // const trackingReady = await waitForTrackingInfo();

    // if (!trackingReady) {
    //   $('#login').prop('disabled', false);
    //   document.getElementById('login').textContent = 'Login';

    //   window.notifyUser.showMessage(
    //     'error',
    //     'System info not ready. Please try again.',
    //   );
    //   return;
    // }
    if (!trackingInfo) {
      await sleep(500);
      checkLogin({ accessCodeUserName, accessCodePassword });
      return;
    }

    try {
      const result = await apiCall.post(
        window.Config.links.signin,
        options.body,
      );
      const response = result.data;
      if (response.data && response.data.pos_settings) {
        const roundOffSetting = [];
        if (response.data && response.data.config) {
          const enableroundOff = {
            id: 29,
            title: 'enable-round-off-bill',
            value: response?.data?.config?.enabled_round_off || 0,
          };
          roundOffSetting.push(enableroundOff);

          if (response.data.config.roundoff_upto_decimal) {
            const roundOffupto = {
              id: 66,
              title: 'round-off-upto-decimal',
              value: response.data.config.roundoff_upto_decimal,
            };
            roundOffSetting.push(roundOffupto);
          }
        }
        const posSettings = [];
        const settings = response.data.pos_settings;
        posSettings.push(
          ...settings.bill_print_settings,
          ...settings.general_settings,
          ...settings.kot_print_settings,
          ...roundOffSetting,
        );
        if (
          settings &&
          settings.draft_print_settings &&
          Object.values(settings.draft_print_settings).length
        ) {
          posSettings.push(...settings.draft_print_settings);
        }
        if (settings.online_order_settings) {
          posSettings.push(...settings.online_order_settings);
        }

        if (settings.misc_settings) {
          Object.assign(response.data, {
            misc_settings: settings.misc_settings,
          });
        }

        Object.assign(response.data, { pos_settings: posSettings });
      }
      if (response && response.data && response.data.languagePreference) {
        setLocalStorage('lang', response.data.languagePreference);
      }
      if (response) {
        $('#login').prop('disabled', false);
        if (response.status === 200) {
          window.notifyUser.showMessage(
            'success',
            `${$.i18n.t('controller:login.welcomeBack')} ${userName}`,
            0,
          );
          if (response.data) {
            setLocalStorage('TOKEN', response.token);
            setLocalStorage('X_USERNAME', userName);
            openOrderwindow(response.data, response.token);
          }
        } else if (response.msg != null || response.message != null) {
          window.notifyUser.showMessage(
            'error',
            response.msg || response.message,
            0,
          );
          document.getElementById('login').textContent = 'Login';
        }
      } else {
        $('#login').prop('disabled', false);
        document.getElementById('login').textContent = 'Login';
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:login.somethingwentWrong'),
          0,
        );
      }
    } catch (error) {
      $('#login').prop('disabled', false);
      console.log('error', error);
      document.getElementById('login').textContent = 'Login';
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:login.somethingwentWrong'),
        0,
      );
    }
  } else {
    $('#login').prop('disabled', false);
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:login.usernamePasswordIsInvalid'),
      0,
    );
  }
}

/**
 * Terminal login (main branch)
 */
async function checkterminalLogin() {
  if (!navigator.onLine) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:homecontrollerNotifications.Billisrunningyoucannotlogout',
      ),
    );
  }
  const userName = document.getElementById('user_name').value;
  const userPassword = document.getElementById('user_password').value;
  const MACHINE_ID = await machineId();

  const masterPOSEndpoint = getLocalStorage('MASTER_POS_URL');

  if (!masterPOSEndpoint) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:login.selectMasterpos'),
    );
    return;
  }
  if (userName && userPassword) {
    if (userName) {
      if (userName.length > 50) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:loginControllerNotifications.usernamelengthshouldbelessthanfifty',
          ),
        );
        return;
      }

      if (window.specialCharRegex.test(userName)) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:loginControllerNotifications.Pleaseentervalidusername',
          ),
        );
        return;
      }
    }

    if (userPassword) {
      if (userPassword.length > 15) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:loginControllerNotifications.usernamelengthshouldbelessthanfifteen',
          ),
        );
        return;
      }
    }

    try {
      const result = await apiCall.post(`${masterPOSEndpoint}login/`, {
        username: userName,
        password: userPassword,
        isTerminal: true,
        machine_id: MACHINE_ID,
      });
      const response = result.data;
      if (response) {
        if (response.status === 200) {
          window.notifyUser.showMessage(
            'success',
            `${$.i18n.t('controller:login.welcomeBack')} ${userName}`,
            0,
          );
          if (response.data) {
            setLocalStorage('TOKEN', response.token);
            setLocalStorage('JWT_TOKEN', response.token);
            setLocalStorage('X_USERNAME', userName);
            setLocalStorage('lang', response.data.selectedLanguage);
            openOrderwindowforterminal(response);
            window.menu_id = response.data.menu_id;

            if (response && response.data && response.data.languagePreference) {
              setLocalStorage('lang', response.data.languagePreference);
            }
          }
        } else if (response.msg != null || response.message != null) {
          window.notifyUser.showMessage(
            'error',
            response.msg || response.message,
          );
          document.getElementById('login').textContent = 'Login';
        }
      } else {
        document.getElementById('login').textContent = 'Login';
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:login.somethingwentWrong'),
          0,
        );
      }
    } catch (error) {
      console.log('error', error);
      document.getElementById('login').textContent = 'Login';
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:login.somethingwentWrong'),
        0,
      );
    }
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:login.usernamePasswordIsInvalid'),
      0,
    );
  }
}

async function checkterminalLoginWithAccessCode(username, password) {
  const MACHINE_ID = await machineId();
  const masterPOSEndpoint = getLocalStorage('MASTER_POS_URL');

  if (!masterPOSEndpoint) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:login.selectMasterpos'),
    );
    return;
  }

  try {
    const result = await apiCall.post(`${masterPOSEndpoint}login/`, {
      username,
      password,
      isTerminal: true,
      machine_id: MACHINE_ID,
    });

    const response = result.data;

    if (response.status === 200) {
      window.notifyUser.showMessage(
        'success',
        `${$.i18n.t('controller:login.welcomeBack')} ${username}`,
        0,
      );

      setLocalStorage('TOKEN', response.token);
      setLocalStorage('JWT_TOKEN', response.token);
      setLocalStorage('X_USERNAME', username);
      setLocalStorage('lang', response.data.selectedLanguage);

      openOrderwindowforterminal(response);
    } else {
      window.notifyUser.showMessage('error', response.msg || response.message);
    }
  } catch (err) {
    console.error(err);
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:login.somethingwentWrong'),
    );
  }
}

/**
 * ACCESS CODE login (copied/adapted from other branch)
 */
async function loginWithAccessCode() {
  const code = document.getElementById('access_code')?.value.trim();

  if (!code) {
    window.notifyUser.showMessage('error', 'Please enter access code');
    return;
  }

  try {
    const result = await apiCall.post(
      window.Config.links.signinwithaccesscode,
      { code },
    );
    const data = result.data;

    console.log('🪪 accesscode response:', data);

    if (data.isAlreadyLoggedIn) {
      window.notifyUser.showMessage(
        'error',
        'This account is already logged in on another device',
      );
      return;
    }

    if (data.status === 200 && data.username && data.password) {
      if (window.__IS_MASTER_POS__) {
        // ✅ Master POS → normal login
        return checkLogin({
          accessCodeUserName: data.username,
          accessCodePassword: data.password,
        });
      } else {
        // ✅ Terminal POS → terminal login
        return checkterminalLoginWithAccessCode(data.username, data.password);
      }
    } else {
      window.notifyUser.showMessage('error', data.msg || 'Invalid access code');
    }
  } catch (err) {
    console.error(' access code error:', err);
    window.notifyUser.showMessage('error', 'Something went wrong');
  }
}
window.loginWithAccessCode = loginWithAccessCode;

/**
 * Helper to call checkLogin with provided credentials (keeps main branch checkLogin intact)
 */
async function checkLoginWithCredentials(
  accessCodeUserName,
  accessCodePassword,
) {
  // Reuse the main branch checkLogin flow by temporarily injecting values into inputs,
  // then calling checkLogin (which reads inputs). This keeps all behavior identical.
  const prevUser = document.getElementById('user_name').value;
  const prevPass = document.getElementById('user_password').value;

  document.getElementById('user_name').value = accessCodeUserName;
  document.getElementById('user_password').value = accessCodePassword;

  try {
    if (window.__IS_MASTER_POS__) {
      await checkLogin();
    } else {
      await checkterminalLogin();
    }
  } finally {
    // restore fields (clear password for security)
    document.getElementById('user_name').value = prevUser;
    document.getElementById('user_password').value = '';
  }
}

/**
 * CARD login handler (UI existed in other branch; no card reader implementation present)
 * Here we keep behaviour minimal: show a message (or you can add card-reader hooks).
 */
async function loginWithCard() {
  // If you have card-reader logic, integrate here.
  // For now show a friendly message (keeps parity with the branch that only showed UI).
  window.notifyUser.showMessage('error', 'Card login not implemented');
}
window.loginWithCard = loginWithCard;

const updateOnlineStatus = () => {
  if (!navigator.onLine) {
    if (window.Swal.isVisible()) window.Swal.close();
  }
  window.ipcRenderer.send(
    'online-status-changed',
    navigator.onLine ? 'online' : 'offline',
  );
};

async function addKeylisteners() {
  Mousetrap.reset();
  const mousetrap = new Mousetrap();

  mousetrap.bind('up up down down left right left right b a enter', () => {
    console.log('Opening devtools');
    remote.getCurrentWebContents().openDevTools();
  });
}

/**
 * Sends the request to the server
 * @param {Options} options
 */
async function sendRequest(options) {
  const headers = { ...getHeadersformposforrender() };
  const MACHINE_ID = await machineId();
  Object.assign(headers, { machine_id: MACHINE_ID });
  const axiosResult = await apiCall.post(options.link, options.body, {
    headers,
  });
  const result = axiosResult.data;
  if (result) {
    if (result.status === '200') {
      window.notifyUser.showMessage(
        'success',
        $.i18n.t('controller:login.demoRequestSent'),
      );

      $('#restaurantinputnameId').val('');
      $('#ownernameinputId').val('');
      $('#ownerinputmobileId').val('');
      $('#emailinputId').val('');
      $('#cityinputId').val('');
      $('#addressinputId').val('');
      $('#messageinputId').val('');
    }
  }
  if (window.Swal.isVisible()) {
    window.Swal.close();
  }

  $('#requestModal').modal('hide');
}

async function sendregisterRequest() {
  const restaurantName = $('#restaurantinputnameId').val();
  const ownername = $('#ownernameinputId').val();
  const ownermobile = $('#ownerinputmobileId').val();
  const email = $('#emailinputId').val();
  const city = $('#cityinputId').val();
  const useraddress = $('#addressinputId').val();
  const message = $('#messageinputId').val();

  // validations (same as main)
  if (restaurantName) {
    if (restaurantName.length > 50) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.RestaurantNamelengthshouldbelessthancharacter',
        ),
      );
      return;
    }

    if (window.specialCharRegex.test(restaurantName)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.PleaseentervalidRestaurantName',
        ),
      );
      return;
    }
  }

  if (ownername) {
    if (ownername.length > 50) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.Ownernamelengthshouldbelessthanfiftycharacter',
        ),
      );
      return;
    }

    if (
      window.allspecialCharRegex.test(ownername) ||
      window.onlyNumberRegex.test(ownername)
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.PleaseentervalidOwnername',
        ),
      );
      return;
    }
  }

  if (ownermobile) {
    if (ownermobile.length > 15) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.Mobilenumbershouldbelessthanfifteendigit',
        ),
      );
      return;
    }

    if (Number.isNaN(ownermobile)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.Pleaseentervalidmobilenumber',
        ),
      );
      return;
    }
  }

  if (email) {
    if (ownermobile.length > 50) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.Emaillengthshouldbelessthanfifty',
        ),
      );
      return;
    }

    if (!window.emailRegex.test(email)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.Pleaseentervalidemail',
        ),
      );
      return;
    }
  }

  if (city) {
    if (city.length > 50) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.Citylengthshouldbelessthan50',
        ),
      );
      return;
    }

    if (
      window.allspecialCharRegex.test(city) ||
      window.onlyNumberRegex.test(city)
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.PleaseentervalidcityName',
        ),
      );
      return;
    }
  }

  if (useraddress) {
    if (useraddress.length > 100) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.Addresslengthshouldbelessthanhundredchracter',
        ),
      );
      return;
    }

    if (window.specialCharRegex.test(useraddress)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.PleaseentervalidAddress',
        ),
      );
      return;
    }
  }

  if (message) {
    if (message.length > 100) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.Messagelengthshouldbelessthanhundredchracter',
        ),
      );
      return;
    }

    if (window.specialCharRegex.test(message)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loginControllerNotifications.Pleaseentervalidmessages',
        ),
      );
      return;
    }
  }

  if (
    restaurantName &&
    ownername &&
    ownermobile &&
    email &&
    city &&
    useraddress &&
    message
  ) {
    const postData = {
      restaurantName,
      ownername,
      ownermobile,
      email,
      city,
      address: useraddress,
      message,
      type: 1,
    };

    const options = {
      link: window.Config.links.requestDemo,
      body: postData,
    };

    window.Swal.fire({
      title: $.i18n.t('controller:swalDataTranslations.Sendingrequest'),
      text: $.i18n.t('controller:swalDataTranslations.Thiswilltakejustasecond'),
      showConfirmButton: false,
      width: '23em',
      allowOutsideClick: false,
      allowEscapeKey: false,
      customClass: {
        confirmButton: 'callmeback',
        actions: 'swal-custom-actions',
      },
      didOpen: () => {
        window.Swal.showLoading();
        sendRequest(options);
      },
    });
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:login.allFieldsAreRequired'),
    );
  }
}

/**
 * Create a custome title bar for a window
 */
function createtitleBar() {
  document.getElementById('tmbillversionLabel').innerHTML = `${$.i18n.t(
    'controller:login.releasedOn',
  )} ${window.Config.releaseDate} | ${remote.app.getVersion()}`;
  try {
    const menu = new remote.Menu();
    menu.append(new remote.MenuItem({}));
    apptitleBar = new Titlebar({
      backgroundColor: TitlebarColor.fromHex('#fff'),
      icon: '../assets/logo.ico',
    });
  } catch (error) {
    console.error(error);
  }
}

function checkIfMasetIpIsDetected() {
  const masterIPs = $('#masterposSelectid option:not([disabled])');
  if (masterIPs && masterIPs.length === 0) {
    $('#masterposSelectwrapper').addClass('hide');
    $('#masterposSelectInputwrapper').removeClass('hide');
  }
}

function initTerminalsetup() {
  setLocalStorage('MASTER_POS_URL', undefined);
  window.ipcRenderer.send('INIT_SEARCH_MASTER');
  $('#masterposSelectwrapper').removeClass('hide');

  setTimeout(() => {
    checkIfMasetIpIsDetected();
  }, 5000);

  $('#masterposSelectid').on('change', () => {
    const selection = $('#masterposSelectid option:selected:not([disabled])');
    if (selection.length > 0) {
      const masterPOSURL = $(selection).attr('value');
      setLocalStorage('MASTER_POS_URL', masterPOSURL);
    }
  });

  $('#masterposSelectInputid').on('change', () => {
    const selection = $('#masterposSelectid option:selected:not([disabled])');
    if (selection.length === 0) {
      const enteredIP = $('#masterposSelectInputid').val();
      if (enteredIP) {
        const ipRegex =
          /^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])$/;

        if (!ipRegex.test(enteredIP)) {
          window.notifyUser.showMessage(
            'error',
            'Please enter valid ip address',
          );
          return;
        }
        const masterPOSURL = `http://${enteredIP}:8000/`;
        setLocalStorage('MASTER_POS_URL', masterPOSURL);
      }
    }
  });
}

/**
 * Mode switching helper (from other branch)
 */
function switchLoginMode(mode) {
  const modes = ['password', 'accesscode', 'card'];
  modes.forEach((id) => {
    const el = document.getElementById(`login-${id}`);
    if (el) el.classList.add('hide');
  });
  const active = document.getElementById(`login-${mode}`);
  if (active) active.classList.remove('hide');
}

async function Initialize() {
  $('#requestdemoButton').on('click', () => {
    $('#requestModal').modal('show');
  });

  $('#requestdemobutton').on('click', () => {
    sendregisterRequest();
  });

  $('#contactusButton').on('click', () => {
    window.remote.shell.openExternal('https://tmbill.com/contact');
  });

  $('#help-button-id').on('click', () => {
    $.get(
      'Getintouch.html',
      (data) => {
        openHelpwindow(data, window.Swal);
      },
      'html',
    );
  });

  $('#showpasswordCheck').on('click', function () {
    const showPassword = $(this).is(':checked');
    if (showPassword) $('#user_password').attr('type', 'text');
    else $('#user_password').attr('type', 'password');
  });

  // Mode selection button wiring (from other branch)
  const buttons = document.querySelectorAll('.mode-selection button');
  buttons.forEach((btn) => {
    btn.addEventListener('click', function () {
      buttons.forEach((b) => b.classList.remove('active'));
      this.classList.add('active');

      if (this.classList.contains('password')) {
        switchLoginMode('password');
      } else if (this.classList.contains('access')) {
        switchLoginMode('accesscode');
      } else if (this.classList.contains('card1')) {
        switchLoginMode('card');
      }
    });
  });
  // Default
  switchLoginMode('password');
  document.querySelector('.mode-selection .password')?.classList.add('active');

  $('#login').on('click', (event) => {
    event.preventDefault();
    // Decide which flow to run based on visible mode
    const isAccessVisible = !document
      .getElementById('login-accesscode')
      .classList.contains('hide');
    const isPasswordVisible = !document
      .getElementById('login-password')
      .classList.contains('hide');
    const isCardVisible = !document
      .getElementById('login-card')
      .classList.contains('hide');

    if (isAccessVisible) {
      // call access code flow
      loginWithAccessCode();
    } else if (isCardVisible) {
      loginWithCard();
    } else if (isPasswordVisible) {
      if (window.__IS_MASTER_POS__) {
        checkLogin();
      } else {
        checkterminalLogin();
      }
    } else {
      window.notifyUser.showMessage('error', 'Please select a login method');
    }
  });
  $('#user_name').on('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();

      const passwordInput = document.getElementById('user_password');
      if (passwordInput) {
        passwordInput.focus();
      }
    }
  });

  $(document).on('keydown.login', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();

      const isAccessVisible = !document
        .getElementById('login-accesscode')
        .classList.contains('hide');
      const isPasswordVisible = !document
        .getElementById('login-password')
        .classList.contains('hide');

      if (isAccessVisible) {
        loginWithAccessCode();
      } else if (isPasswordVisible) {
        if (window.__IS_MASTER_POS__) {
          checkLogin();
        } else {
          checkterminalLogin();
        }
      }
    }
  });

  if ($.i18n) {
    $('.has-i18n').localize();
  } else {
    setTimeout(() => {
      $('.has-i18n').localize();
    }, 400);
  }
  if (!window.__IS_MASTER_POS__) {
    $('#loginWindowTitleLabelId').text($.i18n.t('login.atlanticTerminalLogin'));
  }
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  addKeylisteners();
  setTimeout(() => {
    updateOnlineStatus();
  }, 100);

  $('#masterposSelectwrapper').addClass('hide');
  if (!window.__IS_MASTER_POS__) {
    initTerminalsetup();
  }

  $('#loginSceenvirtualkeyboard').on(
    'click',
    throttle(() => {
      initializevirtualKeyboard(true);
    }, 100000000),
  );

  trackingInfo = await getSysyteminfo();
  if (trackingInfo) {
    delete trackingInfo.outletsadded;
    delete trackingInfo.printersInfo;
  }
}

window.ipcRenderer.on('MASTER_POS_DISCOVERED', (event, content) => {
  if (content && content.discoveredIps && content.serversList.length) {
    $('#masterposSelectid option:gt(0)').remove();
    $('#masterposSelectInputwrapper').addClass('hide');
    $('#masterposSelectwrapper').removeClass('hide');
    content.serversList.forEach((s) => {
      const info = s?.txt;
      const serverIP = s?.referer?.address || '';
      if (info && info.storeName) {
        $('<option>')
          .val(info.url)
          .text(`${info.storeName} (${serverIP})`)
          .appendTo('#masterposSelectid');
      }
    });

    if (
      content.serversList &&
      content.serversList.length === 1 &&
      content.serversList[0]
    ) {
      $('#masterposSelectid').val(
        $('#masterposSelectid option:not([disabled]):first').val(),
      );
      const info = content.serversList[0]?.txt;
      if (info.url) {
        setLocalStorage('MASTER_POS_URL', info.url);
      }
    }
  }
});

window.onload = Initialize;

createtitleBar();
window.addEventListener('load', () => {
  setTimeout(() => {
    window.focus();

    const usernameInput = document.getElementById('user_name');
    if (usernameInput) {
      usernameInput.focus();
      usernameInput.click();
    }
  }, 300);
});
