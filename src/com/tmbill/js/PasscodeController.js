/* eslint-disable func-names */
const getbyPath = require('lodash/get');
const { cloneDeep } = require('lodash');
const {
  DINEIN_TAB_ID,
  TAKEAWAY_TAB_ID,
  HOMEDELIVERY_TAB_ID,
  PASSCODE_ACTIVITY_EVENTS,
  QUICK_TAB_ID,
  DELIVERY_TAB_ID,
} = require('../util/Constants');
const { USER_MODEL_IPC } = require('../util/IPC_Messages');
const { checkPasscodeRequest } = require('../renderer/helper/Common.helper');

const stringConstructor = 'test'.constructor;
let pausedEvent;
let currentEventcontext;
let passcodeVerified = false;
let currentAccesslevels;
const ASK_PASSCODE = 1;

const parseAccesslevels = () => {
  try {
    if (global && global.storeDetails && global.storeDetails.access_levels) {
      if (global.storeDetails.access_levels.constructor === stringConstructor) {
        currentAccesslevels = JSON.parse(global.storeDetails.access_levels);
      } else {
        currentAccesslevels = global.storeDetails.access_levels;
      }
    } else {
      currentAccesslevels = undefined;
    }
  } catch (error) {
    console.error({ from: 'parseAccesslevels', error });
    currentAccesslevels = undefined;
  }
};

function resetCurrentpasscodecontext() {
  currentEventcontext = undefined;
  passcodeVerified = false;
  pausedEvent = undefined;
}

/**
 * Generates the event details for the html element
 * @param {} details
 * @returns
 */
function generateEventtemplate(details) {
  return {
    ...details,
    event_details: {
      billingUser: window.storeDetails.username,
    },
  };
}

function addPasscodeattrtoelement(element, status, event) {
  let passcodeStatus = status;
  if (passcodeStatus === undefined) {
    passcodeStatus = 0;
  }
  if (!window.storeDetails.enabled_passcode_protection) {
    return;
  }
  if (
    element === '#itemviewContainer' &&
    Number(passcodeStatus) === ASK_PASSCODE
  ) {
    window.modifybillaftersavePasscodeEvent = event;
    window.askPasscodeForModifyBillAfterSave = true;
  }
  if (Number(passcodeStatus) === ASK_PASSCODE) {
    $(element).attr('passcode-protected', '1');
    $(element).data(event);
  } else {
    $(element).removeAttr('passcode-protected');
  }
}

/**
 * This is the part which will be called before every action i.e Click
 * and stops the further propagation and continues if the
 * passcode validation is done
 */
function addPasscodecheckbeforeelements() {
  document.addEventListener(
    'click',
    async (event) => {
      const isPasscodeprotected = $(event.target).attr('passcode-protected');
      if (!passcodeVerified && isPasscodeprotected && window.storeDetails) {
        currentEventcontext = cloneDeep($(event.target).data());
        if (
          [
            'previewButton',
            'draftprintButton',
            'coupondiscountButton',
            'chargesButton',
            'discountButton',
            'tacoupondiscountButton',
            'takeawaypreviewButton',
            'takeawaydraftprintButton',
            'takeawaydiscountButton',
            'takeawaychargesButton',
          ].includes($(event.target).attr('id'))
        ) {
          Object.assign(currentEventcontext.event_details, {
            bill_number: window.currentOrderDetails?.order_id,
            order_id: window.currentOrderDetails?.bill_number,
            kot_number: window.currentOrderDetails?.kot_numbers.join(','),
          });
        }

        if (
          [
            'canceloldkotButton',
            'deleteoldkotButton',
            'transferitemButton',
          ].includes($(event.target).attr('id'))
        ) {
          Object.assign(currentEventcontext.event_details, {
            bill_number: window.currentOrderDetails?.bill_number,
            order_id: window.currentoldkotDetails?.order_id,
          });
        }

        // Remove HTML element
        if (currentEventcontext['bs.tab']) {
          delete currentEventcontext['bs.tab'];
        }
        $('#userpasscodeModalid').modal('toggle');
        pausedEvent = event;
        event.stopPropagation();
        event.preventDefault();
      }
    },
    true,
  );
}

// eslint-disable-next-line no-unused-vars
function showPasscodewindow() {
  pausedEvent = undefined;
  currentEventcontext = undefined;
  $('#userpasscodeModalid').modal('toggle');
}

/**
 * Allow only one number digit in the input
 * @param {input element} currentElement
 */
function digitValidate(currentElement) {
  if (currentElement && currentElement.target) {
    const currentInput = currentElement.target;
    const values = [...currentInput.value.replace(/[^0-9]/g, '')];
    currentInput.value = values[0] || '';
  }
}

/**
 * This should be used for only dynamic content
 * @returns
 */
async function askSwalpasscode(contextProvided) {
  let reply = {};
  if (contextProvided) {
    currentEventcontext = contextProvided;
  }
  const { value: passcode } = await window.Swal.fire({
    html: $(`#userpasscodeModalbodyid`).html(),
    focusConfirm: false,
    didOpen: () => {
      $('#swal2-html-container #passcodeGroupcontainer input').on(
        'keyup',
        digitValidate,
      );
      $('#swal2-html-container #passcodeGroupcontainer input').on(
        'keyup',
        function () {
          let inputIndex = $(this).attr('input-number');
          inputIndex = Number(inputIndex);
          const passcodeInputs = document.querySelectorAll(
            '#swal2-html-container #passcodeGroupcontainer input',
          );
          if (
            passcodeInputs[inputIndex - 1] &&
            // eslint-disable-next-line eqeqeq
            passcodeInputs[inputIndex - 1].value != ''
          ) {
            if (passcodeInputs[inputIndex]) passcodeInputs[inputIndex].focus();
          } else if (
            passcodeInputs[inputIndex - 1] &&
            // eslint-disable-next-line eqeqeq
            passcodeInputs[inputIndex - 1].value == ''
          ) {
            if (passcodeInputs[inputIndex - 2])
              passcodeInputs[inputIndex - 2].focus();
          }
        },
      );
    },
    preConfirm: () => {
      const passcodeinputValues = $(
        '#swal2-html-container #passcodeGroupcontainer input',
      )
        .map(function () {
          return $(this).val();
        })
        .get();
      if (
        passcodeinputValues &&
        Array.isArray(passcodeinputValues) &&
        passcodeinputValues.length
      ) {
        return passcodeinputValues.join('');
      }
      return undefined;
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
    },
  });
  if (passcode) {
    const result = await window.betteripcRenderer.callMain(
      USER_MODEL_IPC.CHECK_USER_PASSCODE_ASYNC,
      { passcode, context: currentEventcontext },
    );
    if (result.status === 200 && result.passcodeMatched) {
      if (!result.hasPermission) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:passcodeController.noPermission'),
        );
        return reply;
      }
      reply = result;
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:passcodeController.wrongPasscode'),
      );
      return reply;
    }
  }
  return reply;
}
async function verifyuserPasscode() {
  const passcodeinputValues = $('#passcodeGroupcontainer input')
    .map(function () {
      return $(this).val();
    })
    .get();

  if (
    passcodeinputValues &&
    Array.isArray(passcodeinputValues) &&
    passcodeinputValues.length &&
    currentEventcontext
  ) {
    const passcode = passcodeinputValues.join('');
    const result = await checkPasscodeRequest({
      passcode,
      context: currentEventcontext,
    });
    if (result.status === 200 && result.passcodeMatched) {
      if (!result.hasPermission) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:passcodeController.noPermission'),
        );
        return;
      }
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:passcodeController.wrongPasscode'),
      );
      return;
    }
  }
  if (pausedEvent) {
    const targetElement = pausedEvent.target;
    setTimeout(() => {
      passcodeVerified = true;
      if (['checkbox'].includes(targetElement.type)) {
        // Special cases for switch
        // if (
        //   ['autoacceptorderforStoreid', 'addduepaymentCheck'].includes(
        //     $(targetElement).attr('id'),
        //   )
        // ) {
        $(targetElement).click();
        // }
        $(targetElement).change();
      } else if (['radio'].includes(targetElement.type)) {
        $(targetElement).click();
      } else {
        targetElement.dispatchEvent(pausedEvent);
      }
      pausedEvent = undefined;
      $('#userpasscodeModalid').modal('toggle');
    }, 100);
  }
  currentEventcontext = undefined;
}

/**
 * Continuesly check if all the inputs are filled
 * @returns
 */
function checkIfallinputsarefilled() {
  let isValid = true;
  $('#passcodeGroupcontainer input').each(function () {
    if ($(this).val() === '') isValid = false;
  });
  if (isValid) {
    verifyuserPasscode();
  }
  return isValid;
}

/**
 * Add the passcode protected attr to all the required elements on
 * dashboard
 */
function initializeHomepermissions() {
  if (currentAccesslevels) {
    addPasscodeattrtoelement(
      '#changeStoreicon',
      currentAccesslevels?.switch_outlet?.ask_passcode_is_visible,
      generateEventtemplate({
        permission: 'switch_outlet.is_visible_access',
        ...PASSCODE_ACTIVITY_EVENTS.APP.SWITCH_OUTLET,
      }),
    );
    addPasscodeattrtoelement(
      '#orderIcon',
      currentAccesslevels?.order_window?.ask_passcode_is_visible,
      generateEventtemplate({
        permission: 'order_window.is_visible_access',
        ...PASSCODE_ACTIVITY_EVENTS.APP.OPEN_ORDER_WINDOW,
      }),
    );
    addPasscodeattrtoelement(
      '#allreportsIcon',
      currentAccesslevels?.reports?.ask_passcode_is_visible,
      generateEventtemplate({
        permission: 'reports.is_visible_access',
        ...PASSCODE_ACTIVITY_EVENTS.APP.OPEN_REPORTS,
      }),
    );
    addPasscodeattrtoelement(
      '#receiptIcon',
      currentAccesslevels?.receipts?.ask_passcode_is_visible,
      generateEventtemplate({
        permission: 'receipt.is_visible_access',
        ...PASSCODE_ACTIVITY_EVENTS.APP.OPEN_RECEIPT_MGMT,
      }),
    );
    addPasscodeattrtoelement(
      '#onlineorderIcon',
      currentAccesslevels?.online_orders?.ask_passcode_is_visible,
      generateEventtemplate({
        permission: 'online_orders.is_visible_access',
        ...PASSCODE_ACTIVITY_EVENTS.APP.OPEN_ONLINE_ORDERS,
      }),
    );
    addPasscodeattrtoelement(
      '#digitalOrdersIcon',
      currentAccesslevels?.digital_orders?.ask_passcode_is_visible,
      generateEventtemplate({
        permission: 'digital_orders.is_visible_access',
        ...PASSCODE_ACTIVITY_EVENTS.APP.OPEN_DIGITAL_ORDERS,
      }),
    );
    addPasscodeattrtoelement(
      '#orderSettlementIcon',
      currentAccesslevels?.order_settlement_window?.ask_passcode_is_visible,
      generateEventtemplate({
        permission: 'order_settlement_window.is_visible',
        ...PASSCODE_ACTIVITY_EVENTS.APP.OPEN_SETTLEMENT_WINDOW,
      }),
    );
    addPasscodeattrtoelement(
      '#settingsButton',
      currentAccesslevels?.settings?.ask_passcode_is_visible,
      generateEventtemplate({
        permission: 'settings.is_visible_access',
        ...PASSCODE_ACTIVITY_EVENTS.APP.OPEN_MASTER_MGMT,
      }),
    );
  }
}

/**
 * Add the passcode protected attr to all the required elements on
 * dashboard
 */
function initializeDashboardpermissions() {
  if (currentAccesslevels && currentAccesslevels.dashboard) {
    // check dashboard
    addPasscodeattrtoelement(
      '#dashboardIcon',
      currentAccesslevels?.dashboard?.ask_passcode_is_visible,
      generateEventtemplate({
        permission: 'dashboard.is_visible_access',
        ...PASSCODE_ACTIVITY_EVENTS.APP.OPEN_DASHBOARD,
      }),
    );

    if (window.dashboardWindowloaded) {
      addPasscodeattrtoelement(
        '#totalsalesLabelid',
        currentAccesslevels?.dashboard?.ask_passcode_total_sales,
        generateEventtemplate({
          permission: 'dashboard.total_sale_access',
          ...PASSCODE_ACTIVITY_EVENTS.DASHBOARD.VIEW_DASHBOARD_SALES,
        }),
      );
    }
  }
}

function setDashboardsalespermission() {
  if (currentAccesslevels && currentAccesslevels.dashboard) {
    addPasscodeattrtoelement(
      '#totalsalesLabelid',
      currentAccesslevels?.dashboard?.ask_passcode_total_sales,
      generateEventtemplate({
        permission: 'dashboard.total_sale_access',
        ...PASSCODE_ACTIVITY_EVENTS.DASHBOARD.VIEW_DASHBOARD_SALES,
      }),
    );
    if (currentAccesslevels?.dashboard?.ask_passcode_total_sales === 1) {
      $('#totalsalesLabelid').html('***');
    }
  }
}
/**
 * Add the passcode protected attr to all the required elements on
 * Master menu
 */
function initializeMastermenupermissions() {
  if (currentAccesslevels && currentAccesslevels.master_management) {
    const masterMenuaccess = currentAccesslevels.master_management;

    addPasscodeattrtoelement(
      "#menu-types-list-id li[menu-type='1'],#menu-types-list-id li[menu-type='1'] span",
      masterMenuaccess?.add_expense?.ask_passcode_is_visible,
      generateEventtemplate({
        permission: 'master_management.expense.is_visible_access',
        ...PASSCODE_ACTIVITY_EVENTS.MASTER_MGMT.OPEN_EXPENSES,
      }),
    );
    addPasscodeattrtoelement(
      "#menu-types-list-id li[menu-type='4'],#menu-types-list-id li[menu-type='4'] span",
      masterMenuaccess?.wallet_management?.ask_passcode_is_visible,
      generateEventtemplate({
        permission: 'master_management.wallet_management.is_visible_access',
        ...PASSCODE_ACTIVITY_EVENTS.MASTER_MGMT.OPEN_WALLET_MGMT,
      }),
    );
    addPasscodeattrtoelement(
      "#menu-types-list-id li[menu-type='3'],#menu-types-list-id li[menu-type='3'] span",
      masterMenuaccess?.customer_management?.ask_passcode_is_visible,
      generateEventtemplate({
        permission: 'master_management.customer_management.is_visible_access',
        ...PASSCODE_ACTIVITY_EVENTS.MASTER_MGMT.OPEN_CUSTOMER_MGMT,
      }),
    );
  }
}

/**
 * Add the passcode protected attr to all the required elements on
 * Online orders
 */
function initializeOnlineorderpermissions() {
  if (currentAccesslevels && currentAccesslevels.online_orders) {
    const storeAccesslevels = currentAccesslevels?.online_orders?.store;
    const otherAccesslevels = currentAccesslevels?.online_orders?.other;
    addPasscodeattrtoelement(
      '#storesettingsTabwrapperid #itemsettingstabId',
      storeAccesslevels?.ask_passcode_item_setting,
      generateEventtemplate({
        permission: 'online_orders.store_settings.item_access',
        ...PASSCODE_ACTIVITY_EVENTS.ONLINE_ORDERS.STORE.OPEN_ITEM_SETTING,
      }),
    );
    addPasscodeattrtoelement(
      '#storesettingsTabwrapperid #storesettingstabId',
      storeAccesslevels?.ask_passcode_store_setting,
      generateEventtemplate({
        permission: 'online_orders.store_settings.store_access',
        ...PASSCODE_ACTIVITY_EVENTS.ONLINE_ORDERS.STORE.OPEN_STORE_SETTING,
      }),
    );
    addPasscodeattrtoelement(
      '#storesettingsTabwrapperid #storecategoryettingstabId',
      storeAccesslevels?.ask_passcode_category_setting,
      generateEventtemplate({
        permission: 'online_orders.store_settings.category_access',
        ...PASSCODE_ACTIVITY_EVENTS.ONLINE_ORDERS.STORE.OPEN_CATEGORY_SETTING,
      }),
    );
    addPasscodeattrtoelement(
      '#storesettingsTabwrapperid #storeoptionsettingstabId',
      storeAccesslevels?.ask_passcode_option_setting,
      generateEventtemplate({
        permission: 'online_orders.store_settings.options_access',
        ...PASSCODE_ACTIVITY_EVENTS.ONLINE_ORDERS.STORE.OPEN_OPTIONS_SETTING,
      }),
    );
    addPasscodeattrtoelement(
      '#itemsettingstabdivId .platformsactionsContainer button',
      storeAccesslevels?.ask_passcode_item_settings_button,
      generateEventtemplate({
        permission: 'online_orders.store_settings.item_button_access',
        ...PASSCODE_ACTIVITY_EVENTS.ONLINE_ORDERS.STORE
          .CLICK_ITEMS_BUTTON_SETTING,
      }),
    );

    addPasscodeattrtoelement(
      '#autoacceptorderforStoreid',
      otherAccesslevels?.ask_passcode_auto_accept_order,
      generateEventtemplate({
        permission: 'online_orders.other.set_autoaccept_access',
        ...PASSCODE_ACTIVITY_EVENTS.ONLINE_ORDERS.OTHER.AUTO_ACCEPT_ORDER,
      }),
    );

    addPasscodeattrtoelement(
      '#othersettingstabdivId #notificationSettingsWrapperid input',
      otherAccesslevels?.ask_passcode_send_notification,
      generateEventtemplate({
        permission: 'online_orders.other.send_notification_access',
        ...PASSCODE_ACTIVITY_EVENTS.ONLINE_ORDERS.OTHER.SEND_NOTIFICATION,
      }),
    );
  }
}

async function checkComplementarypermisson(activeTab) {
  resetCurrentpasscodecontext();
  let allowComplimentary = true;
  const orderwindowAccesslevels =
    currentAccesslevels && currentAccesslevels.order_window
      ? currentAccesslevels.order_window
      : undefined;

  if (orderwindowAccesslevels) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
        allowComplimentary =
          orderwindowAccesslevels?.dine_in &&
          orderwindowAccesslevels?.dine_in?.kot &&
          orderwindowAccesslevels?.dine_in?.kot
            ?.ask_passcode_item_as_complementory === 1;
        currentEventcontext = generateEventtemplate({
          permission: 'order_window.dine_in.kot.item_as_complementory_access',
          ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.DINE_IN.ITEM_COMPLEMENTARY,
        });
        break;
      case TAKEAWAY_TAB_ID:
        allowComplimentary =
          orderwindowAccesslevels?.ta &&
          orderwindowAccesslevels?.ta?.kot &&
          orderwindowAccesslevels?.ta?.kot
            ?.ask_passcode_item_as_complementory === 1;
        currentEventcontext = generateEventtemplate({
          permission: 'order_window.takeaway.kot.item_as_complementory_access',
          ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.TAKEAWAY_WINDOW
            .ITEM_COMPLEMENTARY,
        });
        break;
      case DELIVERY_TAB_ID:
        allowComplimentary =
          orderwindowAccesslevels?.hd &&
          orderwindowAccesslevels?.hd?.kot &&
          orderwindowAccesslevels?.hd?.kot
            ?.ask_passcode_item_as_complementory === 1;
        currentEventcontext = generateEventtemplate({
          permission: 'order_window.hd.kot.item_as_complementory_access',
          ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.HOMED_WINDOW
            .ITEM_COMPLEMENTARY,
        });
        break;
      case QUICK_TAB_ID:
        allowComplimentary =
          orderwindowAccesslevels?.quick_bill &&
          orderwindowAccesslevels?.quick_bill?.kot &&
          orderwindowAccesslevels?.quick_bill
            ?.ask_passcode_item_as_complementory === 1;
        currentEventcontext = generateEventtemplate({
          permission: 'order_window.quick_bill.item_as_complementory_access',
          ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.QUICK_BILL
            .ITEM_COMPLEMENTARY,
        });
        break;
      default:
        break;
    }
    if (allowComplimentary) {
      const result = await askSwalpasscode();
      allowComplimentary = result.status === 200;
    } else {
      allowComplimentary = true;
    }
  }
  return allowComplimentary;
}
async function checkChangePricepermisson(activeTab) {
  resetCurrentpasscodecontext();
  let allowChangePrice = true;
  const orderwindowAccesslevels =
    currentAccesslevels && currentAccesslevels.order_window
      ? currentAccesslevels.order_window
      : undefined;

  if (orderwindowAccesslevels) {
    allowChangePrice =
      orderwindowAccesslevels?.ask_passcode_change_item_price === 1;
    currentEventcontext = generateEventtemplate({
      permission: 'order_window.ask_passcode_change_item_price',
      ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.CHANGE_ITEM_PRICE,
    });
    if (allowChangePrice) {
      const result = await askSwalpasscode();
      allowChangePrice = result.status === 200;
    } else {
      allowChangePrice = true;
    }
  }
  return allowChangePrice;
}

async function addDuepaycheckpermisson(activeTab) {
  resetCurrentpasscodecontext();
  let askPasscode = true;
  let eventDetails = {};
  const orderwindowAccesslevels =
    currentAccesslevels && currentAccesslevels.order_window
      ? currentAccesslevels.order_window
      : undefined;
  if (orderwindowAccesslevels) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
        askPasscode =
          orderwindowAccesslevels?.dine_in &&
          orderwindowAccesslevels?.dine_in?.billing
            ?.ask_passcode_allowed_due_payment;
        eventDetails = generateEventtemplate({
          permission: 'order_window.dine_in.billing.allowed_due_payment_access',
          ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.DINE_IN.ALLOW_DUEPAY,
        });
        break;
      case TAKEAWAY_TAB_ID:
        askPasscode =
          orderwindowAccesslevels?.ta &&
          orderwindowAccesslevels?.ta?.billing
            ?.ask_passcode_allowed_due_payment;
        eventDetails = generateEventtemplate({
          permission:
            'order_window.takeaway.billing.allowed_due_payment_access',
          ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.TAKEAWAY_WINDOW.ALLOW_DUEPAY,
        });
        break;
      case HOMEDELIVERY_TAB_ID:
        askPasscode =
          orderwindowAccesslevels?.hd &&
          orderwindowAccesslevels?.hd?.billing
            ?.ask_passcode_allowed_due_payment;
        eventDetails = generateEventtemplate({
          permission: 'order_window.hd.billing.allowed_due_payment_access',
          ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.HOMED_WINDOW.ALLOW_DUEPAY,
        });
        break;
      case QUICK_TAB_ID:
        askPasscode =
          orderwindowAccesslevels?.quick_bill &&
          orderwindowAccesslevels?.quick_bill?.ask_passcode_allowed_due_payment;
        eventDetails = generateEventtemplate({
          ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.QUICK_BILL.ALLOW_DUEPAY,
          permission: 'order_window.quick_bill.allowed_due_payment_access',
        });
        break;
      default:
        break;
    }
    addPasscodeattrtoelement('#addduepaymentCheck', askPasscode, eventDetails);
  }
}

async function addOldKOTactionspermissonforbilling({
  type,
  event,
  permissionKey,
}) {
  const orderwindowAccesslevels =
    currentAccesslevels && currentAccesslevels.order_window
      ? currentAccesslevels.order_window
      : undefined;
  if (
    orderwindowAccesslevels &&
    orderwindowAccesslevels[type] &&
    orderwindowAccesslevels[type].billing &&
    orderwindowAccesslevels[type].billing?.old_kot
  ) {
    const oldkotAcesslevels = orderwindowAccesslevels[type]?.billing?.old_kot;

    addPasscodeattrtoelement(
      '#canceloldkotButton',
      oldkotAcesslevels?.ask_passcode_cancel_kot,
      generateEventtemplate({
        permission: `order_window.${permissionKey}.old_kot.cancel_kot_access`,
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.CANCEL_KOT`),
      }),
    );
    addPasscodeattrtoelement(
      '#transferitemButton',
      oldkotAcesslevels?.ask_passcode_transfer_item,
      generateEventtemplate({
        permission: `order_window.${permissionKey}.old_kot.transfer_item_access`,
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.TRANSFER_KOTITEM`),
      }),
    );
    addPasscodeattrtoelement(
      '#deleteoldkotButton',
      oldkotAcesslevels?.ask_passcode_delete_kot,
      generateEventtemplate({
        permission: `order_window.${permissionKey}.old_kot.delete_kot_access`,
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.DELETE_KOT`),
      }),
    );
    addPasscodeattrtoelement(
      '#oldkotmakecomplimentaryButtonid',
      oldkotAcesslevels?.ask_passcode_item_as_complementory,
      generateEventtemplate({
        permission: `order_window.${permissionKey}.old_kot.item_as_complementory_access`,
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.ITEM_COMPLEMENTARY`),
      }),
    );

    // addPasscodeattrtoelement(
    //   '.oldeditablekotQty',
    //   1,
    //   generateEventtemplate({
    //     permission: `order_window.${permissionKey}.old_kot.item_as_complementory_access`,
    //     ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.ITEM_COMPLEMENTARY`),
    //   }),
    // );
  }
}
/**
 * Set permission by order type
 * @param {Current order tab} activeTab
 */
async function addOldKOTactionspermisson(activeTab) {
  resetCurrentpasscodecontext();
  switch (activeTab) {
    case DINEIN_TAB_ID:
      addOldKOTactionspermissonforbilling({
        type: 'dine_in',
        event: `ORDER_WINDOW.DINE_IN.OLD_KOT_ACTIONS`,
        permissionKey: 'dine_in',
      });
      break;
    case TAKEAWAY_TAB_ID:
      addOldKOTactionspermissonforbilling({
        type: 'ta',
        event: `ORDER_WINDOW.TAKEAWAY_WINDOW.OLD_KOT_ACTIONS`,
        permissionKey: 'takeaway',
      });
      break;
    case HOMEDELIVERY_TAB_ID:
      addOldKOTactionspermissonforbilling({
        type: 'hd',
        event: `ORDER_WINDOW.HOMED_WINDOW.OLD_KOT_ACTIONS`,
        permissionKey: 'hd',
      });
      break;
    default:
      break;
  }
}

/**
 * Add the passcode protected attr to all the required elements on
 * dine in
 */
function initializeDineinpermissions() {
  if (
    currentAccesslevels &&
    currentAccesslevels.order_window &&
    currentAccesslevels.order_window.dine_in
  ) {
    const dinein = currentAccesslevels?.order_window?.dine_in;
    // for terminal oldkot and split bill access level getting outside of billing
    if (dinein?.billing && dinein.old_kot) {
      Object.assign(dinein.billing, {
        old_kot: dinein.old_kot,
      });
    }

    if (dinein?.billing && dinein.split_bill) {
      Object.assign(dinein.billing, {
        split_bill: dinein.split_bill,
      });
    }
    addPasscodeattrtoelement(
      '#splitbillButton',
      dinein?.billing?.split_bill?.ask_passcode_is_visible,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.DINE_IN.SPLIT_BILL,
        permission: 'order_window.dine_in.split_bill.is_visible_access',
      }),
    );

    addPasscodeattrtoelement(
      '#oldkotButton',
      dinein?.billing?.old_kot?.ask_passcode_is_visible,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.DINE_IN.OLD_KOT,
        permission: 'order_window.dine_in.old_kot.is_visible_access',
      }),
    );

    addPasscodeattrtoelement(
      '#previewButton',
      dinein?.billing?.ask_passcode_preview,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.DINE_IN.BILL_PREVIEW,
        permission: 'order_window.dine_in.billing.preview_access',
      }),
    );
    addPasscodeattrtoelement(
      '#draftprintButton',
      dinein?.billing?.ask_passcode_draft_print,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.DINE_IN.DRAFT_PRINT,
        permission: 'order_window.dine_in.billing.draft_print_access',
      }),
    );

    addPasscodeattrtoelement(
      '#coupondiscountButton',
      dinein?.billing?.ask_passcode_add_coupon,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.DINE_IN.ADD_COUPON,
        permission: 'order_window.dine_in.billing.add_coupon_access',
      }),
    );
    addPasscodeattrtoelement(
      '#chargesButton',
      dinein?.billing?.ask_passcode_add_charges,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.DINE_IN.ADD_CHARGES,
        permission: 'order_window.dine_in.billing.add_charges_access',
      }),
    );
    addPasscodeattrtoelement(
      '#discountButton',
      dinein?.billing?.ask_passcode_add_discount,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.DINE_IN.ADD_DISCOUNT,
        permission: 'order_window.dine_in.billing.add_discount_access',
      }),
    );
    addPasscodeattrtoelement(
      '#billstatusButton',
      dinein?.billing?.ask_passcode_modify_bill_status,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.DINE_IN.MODIFY_BILL_STATUS,
        permission: 'order_window.dine_in.billing.modify_bill_status_access',
      }),
    );
    addPasscodeattrtoelement(
      '#reprint_n_savebillButton',
      dinein?.billing?.ask_passcode_reprint_bill,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.DINE_IN.REPRINT_BILL,
        permission: 'order_window.dine_in.billing.reprint_bill',
      }),
    );
    addPasscodeattrtoelement(
      '#reprint_n_savetakeawayBillbutton',
      dinein?.billing?.ask_passcode_reprint_bill,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.DINE_IN.REPRINT_BILL,
        permission: 'order_window.dine_in.billing.reprint_bill',
      }),
    );
  }
}

/**
 * Add the passcode protected attr to all the required elements on
 * Takeaway
 */
function initializeTahdinpermissions({ type, event, permissionKey }) {
  if (
    currentAccesslevels &&
    currentAccesslevels.order_window &&
    currentAccesslevels.order_window[type]
  ) {
    const accesslevel = currentAccesslevels?.order_window[type];
    addPasscodeattrtoelement(
      '#tasplitbillButton',
      accesslevel?.billing?.split_bill?.ask_passcode_is_visible,
      generateEventtemplate({
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.SPLIT_BILL`),
        permission: `order_window.${permissionKey}.split_bill.is_visible_access`,
      }),
    );

    addPasscodeattrtoelement(
      '#takeawayoldkotButton',
      accesslevel?.billing?.old_kot?.ask_passcode_is_visible,
      generateEventtemplate({
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.OLD_KOT`),
        permission: `order_window.${permissionKey}.old_kot.is_visible_access`,
      }),
    );

    addPasscodeattrtoelement(
      '#takeawaypreviewButton',
      accesslevel?.billing?.ask_passcode_preview,
      generateEventtemplate({
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.BILL_PREVIEW`),
        permission: `order_window.${permissionKey}.billing.preview_access`,
      }),
    );
    addPasscodeattrtoelement(
      '#takeawaydraftprintButton',
      accesslevel?.billing?.ask_passcode_draft_print,
      generateEventtemplate({
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.DRAFT_PRINT`),
        permission: `order_window.${permissionKey}.billing.draft_print_access`,
      }),
    );

    addPasscodeattrtoelement(
      '#tacoupondiscountButton',
      accesslevel?.billing?.ask_passcode_add_coupon,
      generateEventtemplate({
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.ADD_COUPON`),
        permission: `order_window.${permissionKey}.billing.add_coupon_access`,
      }),
    );
    addPasscodeattrtoelement(
      '#takeawaychargesButton',
      accesslevel?.billing?.ask_passcode_add_charges,
      generateEventtemplate({
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.ADD_CHARGES`),
        permission: `order_window.${permissionKey}.billing.add_charges_access`,
      }),
    );
    addPasscodeattrtoelement(
      '#takeawaydiscountButton',
      accesslevel?.billing?.ask_passcode_add_discount,
      generateEventtemplate({
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.ADD_DISCOUNT`),
        permission: `order_window.${permissionKey}.billing.add_discount_access`,
      }),
    );
    addPasscodeattrtoelement(
      '#takeawaybillstatusButton',
      accesslevel?.billing?.ask_passcode_modify_bill_status,
      generateEventtemplate({
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.MODIFY_BILL_STATUS`),
        permission: `order_window.${permissionKey}.billing.modify_bill_status_access`,
      }),
    );
  }
}

/**
 * Add the passcode protected attr to all the required elements on
 *  Home Delivery
 */
function initializehdinpermissions({ type, event, permissionKey }) {
  if (
    currentAccesslevels &&
    currentAccesslevels.order_window &&
    currentAccesslevels.order_window[type]
  ) {
    const accesslevel = currentAccesslevels?.order_window[type];
    addPasscodeattrtoelement(
      '#deliverysplitbillButton',
      accesslevel?.billing?.split_bill?.ask_passcode_is_visible,
      generateEventtemplate({
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.SPLIT_BILL`),
        permission: `order_window.${permissionKey}.split_bill.is_visible_access`,
      }),
    );

    addPasscodeattrtoelement(
      '#deliveryoldkotButton',
      accesslevel?.billing?.old_kot?.ask_passcode_is_visible,
      generateEventtemplate({
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.OLD_KOT`),
        permission: `order_window.${permissionKey}.old_kot.is_visible_access`,
      }),
    );

    addPasscodeattrtoelement(
      '#deliverypreviewButton',
      accesslevel?.billing?.ask_passcode_preview,
      generateEventtemplate({
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.BILL_PREVIEW`),
        permission: `order_window.${permissionKey}.billing.preview_access`,
      }),
    );
    addPasscodeattrtoelement(
      '#deliverydraftprintButton',
      accesslevel?.billing?.ask_passcode_draft_print,
      generateEventtemplate({
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.DRAFT_PRINT`),
        permission: `order_window.${permissionKey}.billing.draft_print_access`,
      }),
    );

    addPasscodeattrtoelement(
      '#deliverycoupondiscountButton',
      accesslevel?.billing?.ask_passcode_add_coupon,
      generateEventtemplate({
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.ADD_COUPON`),
        permission: `order_window.${permissionKey}.billing.add_coupon_access`,
      }),
    );
    addPasscodeattrtoelement(
      '#deliverychargesButton',
      accesslevel?.billing?.ask_passcode_add_charges,
      generateEventtemplate({
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.ADD_CHARGES`),
        permission: `order_window.${permissionKey}.billing.add_charges_access`,
      }),
    );
    addPasscodeattrtoelement(
      '#deliverydiscountButton',
      accesslevel?.billing?.ask_passcode_add_discount,
      generateEventtemplate({
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.ADD_DISCOUNT`),
        permission: `order_window.${permissionKey}.billing.add_discount_access`,
      }),
    );
    addPasscodeattrtoelement(
      '#deliverybillstatusButton',
      accesslevel?.billing?.ask_passcode_modify_bill_status,
      generateEventtemplate({
        ...getbyPath(PASSCODE_ACTIVITY_EVENTS, `${event}.MODIFY_BILL_STATUS`),
        permission: `order_window.${permissionKey}.billing.modify_bill_status_access`,
      }),
    );
  }
}

/**
 * Add the passcode protected attr to all the required elements on
 * dine in
 */
function initializeQuickbillpermissions() {
  if (
    currentAccesslevels &&
    currentAccesslevels.order_window &&
    currentAccesslevels.order_window.quick_bill
  ) {
    const quickBill = currentAccesslevels.order_window.quick_bill;

    addPasscodeattrtoelement(
      '#quickcoupondiscountButton',
      quickBill?.ask_passcode_add_coupon,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.QUICK_BILL.ADD_COUPON,
        permission: 'order_window.quick_bill.add_coupon_access',
      }),
    );
    addPasscodeattrtoelement(
      '#quickchargesButton',
      quickBill?.ask_passcode_add_charges,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.QUICK_BILL.ADD_CHARGES,
        permission: 'order_window.quick_bill.add_charges_access',
      }),
    );
    addPasscodeattrtoelement(
      '#quickdiscountButton',
      quickBill?.ask_passcode_add_discount,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.QUICK_BILL.ADD_DISCOUNT,
        permission: 'order_window.quick_bill.add_discount_access',
      }),
    );
  }
}

/**
 * Add the passcode protected attr to all the required elements on
 * order window
 */
function initializeOrderwindowpermissions() {
  if (currentAccesslevels) {
    // check dashboard
    if (currentAccesslevels.order_window) {
      addPasscodeattrtoelement(
        '#orderIcon',
        currentAccesslevels?.order_window?.ask_passcode_is_visible,
        generateEventtemplate({
          ...PASSCODE_ACTIVITY_EVENTS.APP.OPEN_ORDER_WINDOW,
          permission: 'order_window.is_visible_access',
        }),
      );
      addPasscodeattrtoelement(
        '#syncButton',
        currentAccesslevels?.order_window?.ask_passcode_load_menu,
        generateEventtemplate({
          ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.LOAD_MENU,
          permission: 'order_window.load_menu_access',
        }),
      );

      addPasscodeattrtoelement(
        '#changeTablebutton',
        currentAccesslevels?.order_window?.ask_passcode_change_table,
        generateEventtemplate({
          ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.CHANGE_TABLE,
          permission: 'order_window.change_table_access',
        }),
      );

      addPasscodeattrtoelement(
        '#saveBilloldkotButton',
        currentAccesslevels?.order_window?.ask_passcode_modify_bill_after_save,
        generateEventtemplate({
          ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.MODIFY_BILL_AFTER_SAVE,
          permission: 'order_window.modify_bill_after_save',
        }),
      );

      addPasscodeattrtoelement(
        '#saveBilltakeawayoldkotButton',
        currentAccesslevels?.order_window?.ask_passcode_modify_bill_after_save,
        generateEventtemplate({
          ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.MODIFY_BILL_AFTER_SAVE,
          permission: 'order_window.modify_bill_after_save',
        }),
      );

      addPasscodeattrtoelement(
        '#itemviewContainer',
        currentAccesslevels?.order_window?.ask_passcode_modify_bill_after_save,
        generateEventtemplate({
          ...PASSCODE_ACTIVITY_EVENTS.ORDER_WINDOW.MODIFY_BILL_AFTER_SAVE,
          permission: 'order_window.modify_bill_after_save',
        }),
      );
      initializeDineinpermissions();
      initializeQuickbillpermissions();
    }
  }
}

/**
 * Add the passcode protected attr to all the required elements on
 * Reports window
 */
function initializeReportwindowpermissions() {
  if (currentAccesslevels && currentAccesslevels.reports) {
    const reportAccesslevel = currentAccesslevels.reports;

    addPasscodeattrtoelement(
      "#reporttypeContainerid div[report-action='10']",
      reportAccesslevel?.ask_passcode_order_report,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.REPORT.OPEN_ORDER_REPORT,
        permission: 'reports.order_report_access',
      }),
    );
    addPasscodeattrtoelement(
      "#reporttypeContainerid div[report-action='1']",
      reportAccesslevel?.ask_passcode_sales_report,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.REPORT.OPEN_SALES_REPORT,
        permission: 'reports.sales_report_access',
      }),
    );
    addPasscodeattrtoelement(
      "#reporttypeContainerid div[report-action='7']",
      reportAccesslevel?.ask_passcode_todays_report,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.REPORT.OPEN_TODAYS_REPORT,
        permission: 'reports.todays_report_access',
      }),
    );
    addPasscodeattrtoelement(
      "#reporttypeContainerid div[report-action='9']",
      reportAccesslevel?.ask_passcode_payment_report,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.REPORT.OPEN_PAYMENT_REPORT,
        permission: 'reports.payment_report_access',
      }),
    );
    addPasscodeattrtoelement(
      "#reporttypeContainerid div[report-action='15']",
      reportAccesslevel?.ask_passcode_user_shift_report,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.REPORT.OPEN_USERSHIFT_REPORT,
        permission: 'reports.user_shift_report_access',
      }),
    );
    addPasscodeattrtoelement(
      "#reporttypeContainerid div[report-action='13']",
      reportAccesslevel?.ask_passcode_coupon_code_history,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.REPORT.OPEN_COUPONCODE_HISTORY,
        permission: 'reports.coupon_history_access',
      }),
    );
    addPasscodeattrtoelement(
      "#reporttypeContainerid div[report-action='11']",
      reportAccesslevel?.ask_passcode_category_wise_report,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.REPORT.OPEN_CATWISE_REPORT,
        permission: 'reports.category_wise_report_access',
      }),
    );
    addPasscodeattrtoelement(
      "#reporttypeContainerid div[report-action='12']",
      reportAccesslevel?.ask_passcode_kitchen_dept_wise_report,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.REPORT.OPEN_KITCHEN_REPORT,
        permission: 'reports.kitchen_dept_wise_report_access',
      }),
    );

    addPasscodeattrtoelement(
      "#reporttypeContainerid div[report-action='2']",
      reportAccesslevel?.item_report?.ask_passcode_is_visible,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.REPORT.OPEN_ITEM_REPORT,
        permission: 'reports.item_report.is_visible_access',
      }),
    );
    addPasscodeattrtoelement(
      "#reporttypeContainerid div[report-action='16']",
      reportAccesslevel?.due_payment_report?.ask_passcode_is_visible,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.REPORT.OPEN_DUEPAY_REPORT,
        permission: 'reports.due_payment_report.is_visible_access',
      }),
    );

    addPasscodeattrtoelement(
      "#reporttypeContainerid div[report-action='14']",
      reportAccesslevel?.ask_passcode_startCloseDay_report,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.REPORT.OPEN_START_DAY_CLOSE_DAY_REPORT,
        permission: 'reports.due_payment_report.is_visible_access',
      }),
    );

    addPasscodeattrtoelement(
      "#reporttypeContainerid div[report-action='26']",
      reportAccesslevel?.ask_passcode_mall_report,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.REPORT.OPEN_MALL_REPORT,
        permission: 'reports.due_payment_report.is_visible_access',
      }),
    );

    addPasscodeattrtoelement(
      "#reporttypeContainerid div[report-action='28']",
      reportAccesslevel?.ask_passcode_reservation_report,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.REPORT.OPEN_DUEPAY_REPORT,
        permission: 'reports.due_payment_report.is_visible_access',
      }),
    );
  }
}

function addReceipteditbillpermission() {
  if (currentAccesslevels && currentAccesslevels.receipts) {
    const receiptAccess = currentAccesslevels.receipts;
    addPasscodeattrtoelement(
      '#receiptpaymentList li input',
      receiptAccess?.edit_bill?.ask_passcode_payment_mode,
      generateEventtemplate({
        // eslint-disable-next-line node/no-unsupported-features/es-syntax
        ...PASSCODE_ACTIVITY_EVENTS.RECEIPT.TODAYS_REPORT,
        permission: 'receipt.edit_bill.payment_mode_access',
      }),
    );
    addPasscodeattrtoelement(
      '#receiptbillstatList li input',
      receiptAccess?.edit_bill?.ask_passcode_bill_status,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.RECEIPT.TODAYS_REPORT,
        permission: 'receipt.edit_bill.bill_status_access',
      }),
    );
  }
}

/**
 * Add the passcode protected attr to all the required elements on
 * dine in
 */
function initializeReceiptpermissions() {
  if (currentAccesslevels && currentAccesslevels.receipts) {
    const receiptAccess = currentAccesslevels.receipts;
    addPasscodeattrtoelement(
      '#previewreceiptbillButton',
      receiptAccess?.ask_passcode_preview,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.RECEIPT.OPEN_PREVIEW,
        permission: 'receipt.preview_access',
      }),
    );
    addPasscodeattrtoelement(
      '#receiptprintButton',
      receiptAccess?.ask_passcode_reprint_bill,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.RECEIPT.DRAFT_PRINT,
        permission: 'receipt.reprint_bill_access',
      }),
    );
    addPasscodeattrtoelement(
      '#resyncBillbuttonid',
      receiptAccess?.ask_passcode_resync_bills,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.RECEIPT.RESYNC_BILLS,
        permission: 'receipt.resync_access',
      }),
    );
    addPasscodeattrtoelement(
      '#todaysreportbutton',
      receiptAccess?.ask_passcode_todays_report,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.RECEIPT.TODAYS_REPORT,
        permission: 'receipt.todays_report_access',
      }),
    );
    addPasscodeattrtoelement(
      '#editbillButton',
      receiptAccess?.edit_bill?.ask_passcode_is_visible,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.RECEIPT.TODAYS_REPORT,
        permission: 'receipt.edit_bill.is_visible_access',
      }),
    );

    addPasscodeattrtoelement(
      '#modifybillButton',
      receiptAccess?.ask_passcode_edit_bill_after_save,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.RECEIPT.MODIFY_BILL_AFTER_SAVE,
        permission: 'receipt.edit_bill_after_save',
      }),
    );
    addReceipteditbillpermission();
  }
}

function initializeMenuManagementPermisions() {
  if (currentAccesslevels && currentAccesslevels.menu_management) {
    const menuItemsAccess = currentAccesslevels?.menu_management?.menu_items;
    addPasscodeattrtoelement(
      '#syncButton',
      menuItemsAccess?.ask_passcode_load_menu,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.MENU_MANAGEMENT.LOAD_MENU,
        permission: 'menu_management.menu_items.load_menu',
      }),
    );

    addPasscodeattrtoelement(
      '#addItemInMenuManagement',
      menuItemsAccess?.ask_passcode_add_items,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.MENU_MANAGEMENT.ADD_ITEM,
        permission: 'menu_management.menu_items.add_item',
      }),
    );

    addPasscodeattrtoelement(
      '.item-edit-icon',
      menuItemsAccess?.ask_passcode_edit_item,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.MENU_MANAGEMENT.EDIT_ITEM,
        permission: 'menu_management.menu_items.edit_item',
      }),
    );

    addPasscodeattrtoelement(
      '.item-status-switch .checkbox',
      menuItemsAccess?.ask_passcode_is_visible_items,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.MENU_MANAGEMENT.ENABLE_DISABLE_ITEM,
        permission: 'menu_management.menu_items.visible_items',
      }),
    );

    addPasscodeattrtoelement(
      '.category-status-switch .slider',
      menuItemsAccess?.ask_passcode_is_visible_category,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.MENU_MANAGEMENT.ENABLE_DISABLE_CATEGORY,
        permission: 'menu_management.menu_items.visible_category',
      }),
    );
  }
}

function initializeOrderSettlementWindowPermissions() {
  if (currentAccesslevels && currentAccesslevels.order_settlement_window) {
    const orderSettlementAccess = currentAccesslevels?.order_settlement_window;
    addPasscodeattrtoelement(
      '#orderSettlewindowUpdateButtonId',
      orderSettlementAccess?.ask_passcode_update,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.ORDER_SETTLEMENT_WINDOW.UPDATE_ORDER,
        permission: 'order_settlement_window.update',
      }),
    );

    addPasscodeattrtoelement(
      '#orderSettlewindowSettleButtonId',
      orderSettlementAccess?.ask_passcode_settle,
      generateEventtemplate({
        ...PASSCODE_ACTIVITY_EVENTS.ORDER_SETTLEMENT_WINDOW.SETTLE_ORDER,
        permission: 'order_settlement_window.settle',
      }),
    );
  }
}

function addPasscodepermissions() {
  parseAccesslevels();
  if (currentAccesslevels) {
    initializeDashboardpermissions();
    initializeHomepermissions();
    if (window.receiptsWindowloaded) initializeReceiptpermissions();
    if (window.reportsscriptLoaded) initializeReportwindowpermissions();
    if (window.onlineordersWindowloaded) initializeOnlineorderpermissions();
    if (window.mastermenuScriptloaded) initializeMastermenupermissions();
    if (window.orderWindowloaded) {
      initializeOrderwindowpermissions();
      initializeQuickbillpermissions();
      addOldKOTactionspermisson();
    }

    if (window.itemsManagementWindowloaded)
      initializeMenuManagementPermisions();

    if (window.orderSettlementWindowloaded)
      initializeOrderSettlementWindowPermissions();
  }
}

/**
 * Action listeners for all the passcode fields and modal
 */
function initializePasscodeinputs() {
  $('#userpasscodeModalid').on('shown.bs.modal', () => {
    $('#passcodeGroupcontainer input').val('');
    $('#passcodeGroupcontainer input').first().focus();
  });

  $('#userpasscodeModalid').on('hidden.bs.modal', () => {
    resetCurrentpasscodecontext();
    $('#passcodeGroupcontainer input').val('');
  });

  $('#passcodeGroupcontainer input').on('keyup', digitValidate);
  $('#passcodeGroupcontainer input').on('keyup', function () {
    let inputIndex = $(this).attr('input-number');
    inputIndex = Number(inputIndex);
    const passcodeInputs = document.querySelectorAll(
      '#passcodeGroupcontainer input',
    );
    if (
      passcodeInputs[inputIndex - 1] &&
      // eslint-disable-next-line eqeqeq
      passcodeInputs[inputIndex - 1].value != ''
    ) {
      if (passcodeInputs[inputIndex]) passcodeInputs[inputIndex].focus();
    } else if (
      passcodeInputs[inputIndex - 1] &&
      // eslint-disable-next-line eqeqeq
      passcodeInputs[inputIndex - 1].value == ''
    ) {
      if (passcodeInputs[inputIndex - 2])
        passcodeInputs[inputIndex - 2].focus();
    }
    checkIfallinputsarefilled();
  });

  $('#userpasscodeModalid button.close i,#userpasscodeModalid button.close').on(
    'click',
    () => {
      $('#userpasscodeModalid').modal('hide');
    },
  );

  if (window.storeDetails) {
    addPasscodepermissions();
  } else {
    setTimeout(addPasscodepermissions, 400);
  }
}

initializePasscodeinputs();

module.exports = {
  addPasscodecheckbeforeelements,
  addPasscodepermissions,
  initializeOrderwindowpermissions,
  checkComplementarypermisson,
  addDuepaycheckpermisson,
  addOldKOTactionspermisson,
  initializeTahdinpermissions,
  initializehdinpermissions,
  initializeReportwindowpermissions,
  initializeReceiptpermissions,
  addReceipteditbillpermission,
  initializeOnlineorderpermissions,
  initializeMastermenupermissions,
  setDashboardsalespermission,
  initializeMenuManagementPermisions,
  initializeOrderSettlementWindowPermissions,
  checkChangePricepermisson,
};
