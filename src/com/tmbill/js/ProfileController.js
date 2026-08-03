/* eslint-disable camelcase */
const path = require('path');
const fs = require('fs');

window.profileScriptloaded = true;
const { debounce } = require('lodash');
const {
  UDATE_STORE_DETAILS,
  MISC_IPC,
  RESET_FCM_TOKEN,
} = require('../util/IPC_Messages');
const { initializei18nforProfileswindowui } = require('./i18nController');
const { getActivationremainingdays } = require('./Helperfunctions');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const { apiCall } = require('../services/APIService');

window.reloadhotelLogo = function () {
  if (window.hotelogoFilepath) {
    $('#hotelLogoid').attr('src', window.hotelogoFilepath);
  }
};
/**
 * Update the store details
 */
async function updateStoredetails() {
  const username = $('#storeusernameId').html();
  const person_name = $('#usernameInputid').val();
  const user_email = $('#usermailInputid').val();
  const user_phone = $('#usermobileInputid').val();
  const user_line_1 = $('#storeaddresId1').val();
  const user_line_2 = $('#storeaddresId2').val();
  const user_sub_locality = $('#userlocalityId').val();

  if (!person_name) {
    window.notifyUser.showMessage('error', 'Username cannot be empty.');
    return;
  }

  if (person_name) {
    if (person_name.length > 50) {
      window.notifyUser.showMessage(
        'error',
        'Username length should be less than 50 character',
      );
      return;
    }

    if (window.allspecialCharRegex.test(person_name)) {
      window.notifyUser.showMessage(
        'error',
        'Special characters are not allowed in userName',
      );
      return;
    }
  }

  if (user_email) {
    if (user_email.length > 50) {
      window.notifyUser.showMessage(
        'error',
        'Email length should be less than 50',
      );
      return;
    }

    if (!window.emailRegex.test(user_email)) {
      window.notifyUser.showMessage('error', 'Please enter valid email');
      return;
    }
  }

  if (user_phone) {
    if (user_phone.length > 15) {
      window.notifyUser.showMessage(
        'error',
        'Mobile number should be less than 15 digit',
      );
      return;
    }

    if (
      window.allspecialCharRegex.test(user_phone) ||
      !window.onlyNumberRegex.test(user_phone)
    ) {
      window.notifyUser.showMessage(
        'error',
        'Please enter valid mobile number',
      );
      return;
    }
  }

  if (user_line_1) {
    if (user_line_1.length > 200) {
      window.notifyUser.showMessage(
        'error',
        'Address length should be less than 200 character',
      );
      return;
    }

    if (window.specialCharRegex.test(user_line_1)) {
      window.notifyUser.showMessage(
        'error',
        'Some special characters are not allowed in address 1',
      );
      return;
    }
  }

  if (user_line_2) {
    if (user_line_2.length > 200) {
      window.notifyUser.showMessage(
        'error',
        'Address length should be less than 200 character',
      );
      return;
    }

    if (window.specialCharRegex.test(user_line_2)) {
      window.notifyUser.showMessage(
        'error',
        'Some special characters are not allowed in address 2',
      );
      return;
    }
  }

  if (user_sub_locality) {
    if (user_sub_locality.length > 100) {
      window.notifyUser.showMessage(
        'error',
        'Sub-locality length should be less than 100 character',
      );
      return;
    }

    if (window.specialCharRegex.test(user_sub_locality)) {
      window.notifyUser.showMessage(
        'error',
        'Some special characters are not allowed in Sub-locality',
      );
      return;
    }
  }

  const postData = {
    username,
    person_name,
    user_email,
    user_phone,
    user_line_1,
    user_line_2,
    user_sub_locality,
    store_id: window.storeDetails.store_id,
  };
  try {
    const axiosResponse = await apiCall.put(
      window.Config.links.profileUpdate,
      postData,
      {
        headers: getHeadersformposforrender(),
      },
    );
    if (
      axiosResponse &&
      axiosResponse.data &&
      [200, '200'].includes(axiosResponse.data.status)
    ) {
      const responseData = axiosResponse.data;
      window.notifyUser.showMessage('success', 'Store user details updated.');
      if (responseData.data) {
        window.ipcRenderer.send(
          UDATE_STORE_DETAILS,
          JSON.stringify(responseData.data),
        );
      }
    }
  } catch (error) {
    window.notifyUser.showMessage(
      'error',
      'Something went wrong while updating details..',
    );
  }
}

/**
 * Opens a select dialog
 */
async function openSelectlogo() {
  const filters = [{ name: 'Images', extensions: ['jpg'] }];
  const options = {
    title: 'Select hotel logo',
    filters,
  };
  const openFilereply = await remote.dialog.showOpenDialog(
    remote.getCurrentWindow(),
    options,
  );
  if (openFilereply) {
    if (openFilereply.canceled) {
    } else if (openFilereply.filePaths.length > 0) {
      try {
        window.hotelogoFilepath = `${remote.app.getPath('userData')}/${window.storeDetails.store_id}`;
        const srcfile = openFilereply.filePaths[0];
        $('#hotelLogoid').attr('src', srcfile);
        const distFile = hotelogoFilepath + path.extname(srcfile);
        window.hotelogoFilepath = distFile;
        fs.copyFile(srcfile, distFile, (err) => {
          if (err) throw err;
          window.sendLogotoworkerfromRemote();
          window.isappreloadneed = true;
        });
      } catch (error) {
        console.log(error);
      }
    }
  }
  $('#hotelLogoid').prop('disabled', false);
}

function Initialize() {
  if (window.storeDetails) {
    $('#hoteltitleheadingId').html(window.storeDetails.store_name);
    $('#storeusernameId').html(window.storeDetails.username);
    $('#storetmposId').html(window.storeDetails.tmpos_id);
    $('#storecityId').html(window.storeDetails.user_city);
    $('#storephoneId').html(window.storeDetails.store_phone);
    $('#usernameInputid').val(window.storeDetails.person_name);
    $('#usermailInputid').val(window.storeDetails.user_email);
    $('#usermobileInputid').val(window.storeDetails.user_phone);
    $('#storeaddresId1').val(window.storeDetails.user_line_1);
    $('#storeaddresId2').val(window.storeDetails.user_line_2);
    $('#userlocalityId').val(window.storeDetails.user_sub_locality);
    // initializei18nforOrderwindowui()

    // Get activation expiry date
    $(`#profileWrapperid div.profileExpiryinfo`).html(``);
    if (window.storeDetails && window.storeDetails.activation_expires_at) {
      const remainingDays = getActivationremainingdays(
        window.storeDetails.activation_expires_at,
      );
      $(`#profileWrapperid div.profileExpiryinfo`).html(
        `Your Activation Will Expire In <strong>${remainingDays}</strong> Days`,
      );
    }
  }

  if (window.revenue_id) {
    $('#storeRevenueId').html(window.revenue_id);
  }

  if (window.globalIPAddress) {
    $('#storeIPAddressId').html(window.globalIPAddress);
  }

  $('#updatestoreinfoButton').on('click', () => {
    updateStoredetails();
  });
  $('#hotelLogoid').on('click', () => {
    $('#hotelLogoid').prop('disabled', true);
    openSelectlogo();
  });

  $('#fixdbissueButton').on(
    'click',
    debounce(() => {
      window.betteripcRenderer.callMain(MISC_IPC.MAKE_DB_UPTO_DATE, {});
      window.notifyUser.showMessage(
        'success',
        'Please restart the application',
        200,
      );
    }, 200),
  );

  $('#resetFCMTokenButton').on(
    'click',
    debounce(() => {
      window.betteripcRenderer.callMain(RESET_FCM_TOKEN, {});
      // window.notifyUser.showMessage(
      //   'success',
      //   'Please restart the application',
      //   200,
      // );
    }, 200),
  );

  if (window.hotelogoFilepath) {
    $('#hotelLogoid').attr('src', window.hotelogoFilepath);
  }

  if ($.i18n) {
    initializei18nforProfileswindowui();
  } else {
    setTimeout(initializei18nforProfileswindowui, 400);
  }
}

Initialize();
