//Oldcontroller.js
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const { default: Swal } = require('sweetalert2');
const filterkotItems = require('lodash/filter');
const { debounce, cloneDeep } = require('lodash');
const notifyUser = require('../util/Notification');
const { PRINTERS_IPC } = require('../util/IPC_Messages');
const {
  PRINTERS,
  DEFAULT_PRINTOLDKOT_CHECK,
  DEFAULT_CANCELPRINTOLDKOT_CHECK,
  DISPLAYTIME_ON_TABLES,
  MAKE_REASON_MANDATORY,
  DEFAULT_TRANSFERPRINTOLDKOT_CHECK,
  SHOW_CUSTOMERON_KOT_CHECK,
  SHOW_STORENAME_ONKOT,
  PRINT_ALL_IN_ONE_KOT,
  AUTO_OUTOF_STOCK,
  SHOW_COVERSON_KOT,
  ASK_OTP_FOR_OLDKOT_CANCEL_ITEM,
} = require('../util/SettingIDs');
const {
  sendKotupdateddevent,
  sendItemTransferredevent,
  sendKOTPrintRequestToMaster,
} = require('./ClientrequestHandler');
const {
  TAKEAWAY_FLAG_ID,
  HOMED_FLAG_ID,
  DINEIN_TAB_ID,
  TAKEAWAY_TAB_ID,
  PRINTER_ACTION_TYPES,
  DELIVERY_TAB_ID,
  HOMED_BILLING_FLAG,
  TAKEAWAY_BILLING_FLAG,
  DELIVEROO_BILLING_FLAG,
  OTP_TYPES,
} = require('../util/Constants');
const { initializei18nforOldkotctrlwindowui } = require('./i18nController');
const { removetablefromwathersList } = require('./Tableobserver');
const { showLoader, askforOTP } = require('./CommonUtils');
const {
  calculateDiscountForItem,
  roundAmountUptoDecimals,
} = require('./calculations');
const { safeParse } = require('../util/RendererUtils');
const { removeTableFromSuggestions } = require('./OrderController');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const TableUtils = require('../util/TableUtils');

const {
  makeUpdateKotItemRequest,
  makeSetInactiveKotRequest,
  makeTransferOldKotRequest,
} = require('../renderer/helper/Kot.helper');
const { makeDeleteTableRequest } = require('../renderer/helper/Table.helper');
const {
  getPrinterbykitchendepartment,
  getPrinterbyordertype,
  getPrinterbyCategory,
  getPrinterbytable,
} = require('./Printer/Helper');
const { ORDER_SOURCE_FOR_PRINT } = require('../constant');
const { mapItemstocategory } = require('./UIutils/ItemCategoryMapping');
const {
  checkforMultipricingbydept,
  checkforMultipricing,
} = require('./MultiPricing');
//  GLOBAL ORIGINAL QTY STORE
window.__originalQtyMap = {};
window.__originalQtyMap = window.__originalQtyMap || {};
window.currentoldkotDetails = undefined;
let table_id;

const PRINT_OLD_KOT = 1;
const DELETED_KOT_ITEM = 2;
const CANCELLED_KOT_ITEM = 3;
const TRANSFER_KOT_ITEM = 4;

let order_type_flag = 0;
let kotNumberstoPrint = [];
let transferKotNumber;
let currentKOTtotal = 0;
let newKOTtotal = 0;
let updatedItemslist = {};
let showTimeOnTable = false;
let reasonMandatory = false;
let showcustomeronKOTfordinein = false;
let showStorenamonkot = false;
let printAllInOneKot = false;
let kotItemForQuantityUpdate = [];
let cancelledKotItems = [];
let reduceStock = false;
let currentBillingtype;
let oldkotUpdated = false;
let otpApprovedForDecrement = false;
let selectedKotNumbers = [];
let showcoversonKotprint = false;
let askotpforoldkotcancelitem = false;
let pendingQtyChanges = {};
let __lastOldKotDetailsBackup = null;
let __cancelledItemsBackupForPrint = [];
let __isCancelAfterOTP = false;
const debouncedManualQtyUpdate = debounce(async ($cell) => {
  try {
    await handleOldQtyUpdate($cell);
  } catch (err) {
    console.error('Manual qty update error:', err);
  }
}, 500);
/**
 * Loads old KOT details
 * @param {*} details
 * @param {*} kotitemModel
 */
function __shouldBlockValidationError() {
  try {
    return (
      askotpforoldkotcancelitem &&
      (!pendingQtyChanges || Object.keys(pendingQtyChanges).length === 0) &&
      oldkotUpdated === false
    );
  } catch (e) {
    return false;
  }
}
function loadoldItems(details) {

  pendingQtyChanges = {};
  window.cancelledKotItems = [];
  
  oldkotUpdated = false;

  currentBillingtype = undefined;

  oldkotUpdated = false;
  updatedItemslist = {};
  kotNumberstoPrint = [];
  kotItemForQuantityUpdate = [];
  cancelledKotItems = [];
  $('#oldbillTable').find('tr:not(:first)').remove();

  $('#oldkotupdatedprintButton').hide();
updatedItemslist = {};
  if (details != undefined) {
    window.currentoldkotDetails = details;
    if (details && Array.isArray(details.items)) {
      __lastOldKotDetailsBackup = JSON.parse(JSON.stringify(details));
    }

    table_id = details.table_id;
    order_type_flag = details.order_type_flag;
    refreshOldkot(details.items);
  }

  if (window.settingsConfig[DEFAULT_PRINTOLDKOT_CHECK - 1] != undefined) {
    $('#printkotCheck').prop(
      'checked',
      window.settingsConfig[DEFAULT_PRINTOLDKOT_CHECK - 1].value === '1',
    );
  }
  if (window.settingsConfig[DEFAULT_CANCELPRINTOLDKOT_CHECK - 1] != undefined) {
    $('#cancelkotCheck').prop(
      'checked',
      window.settingsConfig[DEFAULT_CANCELPRINTOLDKOT_CHECK - 1].value === '1',
    );
  }
  if (
    window.settingsConfig[DEFAULT_TRANSFERPRINTOLDKOT_CHECK - 1] != undefined
  ) {
    $('#transferkotCheck').prop(
      'checked',
      window.settingsConfig[DEFAULT_TRANSFERPRINTOLDKOT_CHECK - 1].value ===
        '1',
    );
  }

  if (window.settingsConfig[PRINT_ALL_IN_ONE_KOT - 1] != undefined) {
    printAllInOneKot =
      window.settingsConfig[PRINT_ALL_IN_ONE_KOT - 1].value === '1';
  }

  if (window.settingsConfig[SHOW_CUSTOMERON_KOT_CHECK - 1] != undefined) {
    showCustomerOnDineinCheck(
      window.settingsConfig[SHOW_CUSTOMERON_KOT_CHECK - 1].value,
    );
  }

  function showCustomerOnDineinCheck(value) {
    try {
      if (value) {
        const valuesList = String(value).split(',');
        showcustomeronKOTfordinein = valuesList[0] == '1';
      }
    } catch (error) {}
  }

  if (window.settingsConfig[SHOW_STORENAME_ONKOT - 1] != undefined) {
    showStorenamonkot =
      window.settingsConfig[SHOW_STORENAME_ONKOT - 1].value === '1';
  }

  if (window.settingsConfig[DISPLAYTIME_ON_TABLES - 1] != undefined) {
    showTimeOnTable =
      window.settingsConfig[DISPLAYTIME_ON_TABLES - 1].value === '1';
  }

  if (window.settingsConfig[MAKE_REASON_MANDATORY - 1] != undefined) {
    reasonMandatory =
      window.settingsConfig[MAKE_REASON_MANDATORY - 1].value === '1';
  }
  if (window.settingsConfig[SHOW_COVERSON_KOT - 1] !== undefined) {
    showcoversonKotprint =
      window.settingsConfig[SHOW_COVERSON_KOT - 1].value === '1';
  }
  if (window.settingsConfig[ASK_OTP_FOR_OLDKOT_CANCEL_ITEM - 1] !== undefined) {
    askotpforoldkotcancelitem =
      window.settingsConfig[ASK_OTP_FOR_OLDKOT_CANCEL_ITEM - 1].value === '1';
  }

  setTimeout(() => {
    if (window.currentoldkotDetails && window.currentoldkotDetails.order_id) {
      $('#deleteoldkotButton').hide();
      $('#transferitemButton').hide();
    }
    if (window.delete_kot_access == 1) {
      $('#deleteoldkotButton').show();
    }
    if (window.transfer_item_access == 1) {
      $('#transferitemButton').show();
    }
  }, 200);
}

function refreshOldkot(items) {
  $('#oldbillTable').find('tr:not(:first)').remove();
 $('#oldkotupdatedprintButton').hide();
  items.forEach((item) => {
    addoldBillRow(item);
    if (currentBillingtype === undefined) {
      currentBillingtype = item?.mpos_kot?.billing_type;
    }

    // check discounted item of bogo offer and disable it
    setTimeout(() => {
      disableYItemOfBOGO(item);
    }, 50);
  });
}

function disableYItemOfBOGO(clickeditemDetails) {
  let discount;
  if (clickeditemDetails.constructor == 'test'.constructor) {
    discount = safeParse(clickeditemDetails.discounted_items);
  } else {
    discount = clickeditemDetails.discounted_items;
  }
  // let { item_id_list, percentage_off } = discount;
  if (discount) {
    let item_id_list;
    let percentage_off;
    if (Array.isArray(discount) && discount.length) {
      item_id_list = discount[0].item_id_list;
      percentage_off = discount[0].percentage_off;
    } else {
      item_id_list = discount.item_id_list;
      percentage_off = discount.percentage_off;
    }
    const itemidList = String(item_id_list).split(',');
    const { kot_id } = clickeditemDetails;
    window.currentoldkotDetails.items.forEach((item) => {
      if (
        itemidList.includes(`${item.item_id}`) &&
        item.discount_rate === percentage_off &&
        kot_id == item.kot_id
      ) {
        $(`#olditem_${item.kot_item_id}`).prop('checked', false);
        $(`#olditem_${item.kot_item_id}`).attr('disabled', true);
        $(`.incrementitem_${item.kot_item_id}`).attr('disabled', true);
        $(`.decrementitem_${item.kot_item_id}`).attr('disabled', true);
        $(`.checkitem_${item.kot_item_id}`).attr('disabled', true);
        $(`.olditem_${item.kot_item_id}`).attr('contenteditable', false);
      }
    });
  }
}

async function updateItemPostProcess(data) {

  if (
    !(
      askotpforoldkotcancelitem &&
      pendingQtyChanges &&
      Object.keys(pendingQtyChanges).length > 0
    )
  ) {
    window.getOldKotFromRemote();
  }

  Swal.close();
  
 setTimeout(() => {
    if (data) {
      $('#oldkotupdatedprintButton').show();
    }
  }, 200);

  if (data && data.qtyDecreased && data.cancelledItems) {
    cancelledKotItems.push(data.cancelledItems);
  }
}

async function inactiveKotPostProcess(content) {
  if (content) {
    try {
      if (content.deleteTable) {
        $(`#table_${content.table_id}`).remove();
        window.initNewOrderFromRemote();
        const table_index = window.tableName_suggestions.indexOf(
          content.tableName,
        );
        if (table_index > -1) {
          window.tableName_suggestions.splice(table_index, 1);
        }
      } else {
        const data = $(`#table_${content.table_id}`).prop('data');
        if (data != undefined && data.details != undefined) {
          $(`#table_${content.table_id}`).css(
            'background-color',
            TableUtils.Colors.FREE_TABLE,
          );
          data.details.color = TableUtils.Colors.FREE_TABLE;
          data.details.order_state = '';
          data.table_action_flag = TableUtils.State.FREE_TABLE;
          $(`#table_${content.table_id}`)
            .find('#tableorderstatusLabel')
            .html('&nbsp');
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
}

async function transferOldKotPostProcess() {}
// init helper request
async function initUpdateOldKotItem(updateItemData) {
  try {
    const response = await makeUpdateKotItemRequest(updateItemData);
    updateItemPostProcess(response);
  } catch (error) {
    console.error(error);
  }
}

async function initSetInactiveKot(kotData) {
  try {
    const response = await makeSetInactiveKotRequest(kotData);
    inactiveKotPostProcess(response);
  } catch (error) {
    console.error(error);
  }
}

async function initTransferOldKot(transferData) {
  try {
    const response = await makeTransferOldKotRequest(transferData);
    // transferOldKotPostProcess(response);
    return response;
  } catch (error) {
    console.error(error);
  }
}

/**
 *
 * @param {Item to add in table} item
 */
function addoldBillRow(item) {
  if (item !== undefined) {
    const table = $('#oldbillTable');

    const oldkotitemrow = $('<tr>', {
      id: `olditemrow_${item.kot_item_id}`,
    });
    // if (item.title.includes('option::')) {
    //   const result = item.title
    //     .substring(0, item.title.indexOf('option::'))
    //     .trim();
    //   item.title = result;
    // }

    let itemTitle = item.title;
    if (window.selectedLanguage !== 'en' && item.alternative_title) {
      itemTitle = item.alternative_title;
    }
    if (item && item.extra_details && item.extra_details.baseTitle) {
      itemTitle = item.extra_details.baseTitle;
      if (window.selectedLanguage !== 'en' && item.alternative_title) {
        itemTitle = item.alternative_title;
      }
    }

    if (item.addons && item.addons.length) {
      item.addons.forEach((addon) => {
        Object.assign(addon, {
          qty: addon.option_qty,
        });
        if (window.selectedLanguage !== 'en' && addon.alternative_title) {
          itemTitle =
            itemTitle +
            '<br>' +
            `${addon.option_qty} x ${addon.alternative_title} `;
        } else {
          itemTitle =
            itemTitle + '<br>' + `${addon.option_qty} x ${addon.option_name} `;
        }
      });
    }
    if (item.note) {
      itemTitle = `${itemTitle} <br>(${item.note})`;
    }
    const rowCell1 = $('<td>', { html: itemTitle });
    const rowCell2 = $('<td>', {
      class: 'olditem-qty-row',
    });

    const items = $('<span>', {
      class: `editable item-qty-editable-row oldeditablekotQty editQty_${item.item_refid} olditem_${item.kot_item_id}_${item.kot_id}  olditem_${item.kot_item_id}`,
      contenteditable: 'true',
      html: item.quantity,
      item_id: item.id,
      title: item.title,
      inputmode: 'decimal',
    });

    const decrement = $('<button>', {
      class: `fas fa-minus decrementQty decrementitem_${item.item_refid}_${item.kot_id} decrementitem_${item.kot_item_id}`,
      id: `decrement_${item.item_id}`,
      title: item.title,
      item_id: item.item_id,
      price: item.price,
    });

    const increment = $('<button>', {
      class: `fas fa-plus  incrementQty incrementitem_${item.item_refid}_${item.kot_id} incrementitem_${item.kot_item_id}`,
      id: `increment_${item.item_id}`,
      title: item.title,
      item_id: item.item_id,
      title: item.title,
    });

    rowCell2.append(decrement);
    rowCell2.append(items);
    rowCell2.append(increment);

    const rowCell3 = $('<td>', {
      html: item.amount.toFixed(window.ROUNDOFF_UPTO),
    });

    let kot_number = item.kot_id;
    // if (item.mpos_kot && item.mpos_kot.kot_number) {
    //   kot_number = item.mpos_kot.kot_number;
    // }

    // if (item['mpos_kot.kot_number']) {
    //   kot_number = item['mpos_kot.kot_number'];
    // }
    if (item?.mpos_kot?.kot_number) {
      kot_number = item?.mpos_kot?.kot_number;
    }

    const rowCell4 = $('<td>', { html: kot_number });
    const rowCell5 = $('<td>');
    let itemCheckClass = `olditemCheck olditem_${item.item_refid} checkitem_${item.kot_item_id}`;
    if (item.extra_details && item.extra_details.baseItemRefId) {
      itemCheckClass = `olditemCheck olditem_${item.item_refid} baseItemRef_${item.extra_details.baseItemRefId}_${item.kot_id} `;
    }

  const rowinputcheckbox = $('<input>', {
  class: itemCheckClass,
  type: 'checkbox',
  id: `olditem_${item.kot_item_id}`,
  kot_number: item?.mpos_kot?.kot_number,
}).click(function (e) {
  if (item.discounted_items) {
    checkDiscounteditems(item, $(this).is(':checked'));
  }

  try {
    if (!$(this).is(':checked')) {
      $(`#olditemreason_${item.kot_item_id}`).val('');
    }
  } catch (err) {
    console.error('Error clearing reason on uncheck', err);
  }
});
    const rowinputcheckboxlabel = $('<label>', {
      html: '&nbsp',
      for: `olditem_${item.kot_item_id}`,
    });
    const rowinputreason = $('<input>', {
      type: 'text',
      class: 'reasonField',
      id: `olditemreason_${item.kot_item_id}`,
      placeholder: $.i18n.t('controller:kotPrintController.Reason'),
      // style: 'display:none',
    });
    rowCell5.append(rowinputcheckbox);
    rowCell5.append(rowinputcheckboxlabel);
    rowCell5.append(rowinputreason);

    if (item.discount_name) {
      $(rowCell2).prop('contenteditable', false);
    }
    oldkotitemrow.append(rowCell1);
    oldkotitemrow.append(rowCell2);
    oldkotitemrow.append(rowCell3);
    oldkotitemrow.append(rowCell4);
    oldkotitemrow.append(rowCell5);
    $(oldkotitemrow).data(item);
    table.append(oldkotitemrow);
  }
  $('#oldbillTable').trigger('rowAddOrRemove');
}

function checkDiscounteditems(clickeditemDetails, status) {
  // let discount = JSON.parse(clickeditemDetails.discounted_items);
  let discount;
  if (clickeditemDetails.constructor == 'test'.constructor) {
    discount = safeParse(clickeditemDetails.discounted_items);
  } else {
    discount = clickeditemDetails.discounted_items;
  }
  // let { item_id_list, percentage_off } = discount;
  let item_id_list;
  let percentage_off;
  if (Array.isArray(discount) && discount.length) {
    item_id_list = discount[0].item_id_list;
    percentage_off = discount[0].percentage_off;
  } else {
    item_id_list = discount.item_id_list;
    percentage_off = discount.percentage_off;
  }
  const itemidList = String(item_id_list).split(',');
  const { kot_id } = clickeditemDetails;

  window.currentoldkotDetails.items.forEach((item) => {
    if (
      itemidList.includes(`${item.item_id}`) &&
      item.discount_rate === percentage_off &&
      kot_id == item.kot_id
    ) {
      $(`.baseItemRef_${clickeditemDetails.item_refid}_${item.kot_id}`).prop(
        'checked',
        status,
      );
      if (!status) {
        // $(`#olditem_${item.kot_item_id}`).removeAttr('disabled');
      } else {
        $(`#olditem_${item.kot_item_id}`).attr('disabled', true);
        $(`.olditem_${item.kot_item_id}`).attr('disabled', true);
      }
    }
  });
}

/**
 * Returns the checked items
 */
function getCheckedItems(fortransferItem, actionType) {
  if (!window.currentoldkotDetails || !window.currentoldkotDetails.items) {
    if (__lastOldKotDetailsBackup && __lastOldKotDetailsBackup.items) {
      window.currentoldkotDetails = __lastOldKotDetailsBackup;
    } else {
      return [];
    }
  }
  const selectedItems = new Array();
  const values = [];
  kotNumberstoPrint = [];
  $('#oldbillTable')
    .find('input[type="checkbox"]:checked')
    .each(function () {
      let raw_id = $(this).attr('id');
      const closettr = $(this).closest('tr');
      if (closettr && closettr.length > 0) {
        try {
          const td = $(closettr).children('td').eq(3);
          if (!kotNumberstoPrint.includes(Number($(td).text()))) {
            kotNumberstoPrint.push(Number($(td).text()));
          }
        } catch (error) {}
      }
      if (raw_id) {
        raw_id = raw_id.replace('olditem_', '');
        let reason = $(this).siblings('input.reasonField').val();
        reason = reason.trim();
        if (reason.length > 50) {
          setTimeout(() => {
              if (__shouldBlockValidationError()) return;
            window.notifyUser.showMessage(
              'error',
              $.i18n.t(
                'controller:modifybillnotifications.Reasonlengthshouldbelessthanfiftycharacters',
              ),
            );
          }, 50);
          return;
        }
        if (window.allspecialCharRegex.test(reason)) {
          setTimeout(() => {
              if (__shouldBlockValidationError()) return;
            window.notifyUser.showMessage(
              'error',
              'Special characters are not allowed in reason',
            );
          }, 50);
          return;
        }
        if (
          reasonMandatory &&
          !reason &&
          !fortransferItem &&
          actionType !== 1
        ) {


          const hasPendingQty =
            pendingQtyChanges &&
            Object.keys(pendingQtyChanges).length > 0;

          if (!hasPendingQty) {
           setTimeout(() => {
   if (__shouldBlockValidationError()) return;

  window.notifyUser.showMessage(
    'error',
    $.i18n.t('controller:modifybillnotifications.Addreason'),
  );
}, 50);
          }


          return;
        }
        let data;
        if (reason.length) {
          data = {
            kot_item_id: raw_id,
            reason,
          };
        } else {
          data = {
            kot_item_id: raw_id,
          };
        }
        values.push(data);
      }
    });

  currentKOTtotal = 0;
  newKOTtotal = 0;

  window.currentoldkotDetails.items.forEach((item) => {

    let itemToUse = item;

    if (
      askotpforoldkotcancelitem &&
      pendingQtyChanges &&
      Object.keys(pendingQtyChanges).length > 0 &&
      __lastOldKotDetailsBackup &&
      __lastOldKotDetailsBackup.items
    ) {
      const originalItem = __lastOldKotDetailsBackup.items.find(

        (i) => String(i.kot_item_id) === String(item.kot_item_id)
      );

      if (originalItem) {

        itemToUse = { ...item, quantity: originalItem.quantity, amount: originalItem.amount };
      }
    }


    const value = _.find(values, { kot_item_id: String(item.kot_item_id) });
    if (value && value.reason) {
      itemToUse.reason = value.reason;
    } else {
      itemToUse.reason = '';
    }
    if (value) {
      selectedItems.push(itemToUse);
    }
    if (fortransferItem) {
      if (value) {
        newKOTtotal += itemToUse.amount;
      } else {
        currentKOTtotal += itemToUse.amount;
      }
    }
  });
  return selectedItems;
}

async function printUpdatedqtykot() {
  let order_number;
  if (
    window.currentoldkotDetails &&
    window.currentoldkotDetails.items &&
    window.currentoldkotDetails.items.length
  ) {
    let extra_details =
      window.currentoldkotDetails.items[0].mpos_kot.extra_details;
    if (extra_details) {
      extra_details = safeParse(extra_details);
      order_number = extra_details.order_number;
    }
  }
  const safeItems =
  Object.keys(updatedItemslist).length !== 0
    ? updatedItemslist
    : (window.currentoldkotDetails?.items || []);

if (Object.keys(safeItems).length !== 0) {
    kotNumberstoPrint = _.uniq(
      _.map(
  Object.values(
    Object.keys(updatedItemslist).length !== 0
      ? updatedItemslist
      : (Array.isArray(safeItems) ? safeItems : safeItems)
  ),
  'mpos_kot.kot_number'
),
    );
    if (!kotNumberstoPrint || kotNumberstoPrint.length === 0) {
      kotNumberstoPrint = _.uniq(
        _.map(Object.values(updatedItemslist), 'kot_id'),
      );
    }

    const content = {
      items: Array.isArray(safeItems)
  ? safeItems
  : Object.values(safeItems),
      tableName: window.currentoldkotDetails.tableName,
      kot_type: 'Updated old',
      kot_number: kotNumberstoPrint.join(','),
      billingType: window.currentoldkotDetails.order_type_flag + 1,
      showStorenamonkot: showStorenamonkot && window.storeDetails.store_name,
      username: window.storeDetails.username,
      order_number,

      // note: '',
    };

    const orderType = window.currentoldkotDetails.order_type_flag;

    if (window.customKOTtitlesettings) {
      let customTitle;
      switch (orderType) {
        case 0:
          customTitle = `${content.kot_type} ${window.customKOTtitlesettings.dinein ? window.customKOTtitlesettings.dinein : ''}`;
          break;

        case 1:
          customTitle = `${content.kot_type} ${window.customKOTtitlesettings.takeaway ? window.customKOTtitlesettings.takeaway : ''}`;
          break;

        case 2:
          customTitle = `${content.kot_type} ${window.customKOTtitlesettings.delivery ? window.customKOTtitlesettings.delivery : ''}`;
          break;
        default:
          break;
      }
      Object.assign(content, {
        customKOTTitle: customTitle,
      });
    }

    // $('#kotpreviewBodyid').data('data', previewDetails);
    // await showkotPreview();
    // await sendPrintKOT(false);
    // if (window.printtoLabelprinter) {
    //   printkottoLabelprinter(previewDetails);
    // }

    if (window.printkdwiseKot && content.items && content.items.length > 0) {
      // $('#kitchenDepartmentDiv').addClass('kitchendept');
      // $('#kitchenDepartmentDiv').show();
      const originalContent = { ...content };

      const filteredList = window.groupItemsbyDepsforremote(content.items);
      window.addKitchenprinterifnotadded_fromremote();
      // Now Print KOT by filtering the above filtered
      // list of departments along with their items
      for (const element of window.kitchenDepartments) {
        const groupFilter = _.find(filteredList, ['kitchen_dept', element.id]);
        if (groupFilter) {
          await sleep(1200);
          content.items = groupFilter.items;
          content.kitchenDepartment =
            window.kitchenDepartmentsidsmap[element.id];
          Object.assign(content, {
            job_id: window.generateId(10),
          });

          console.log(
            `[OldKOT]Message="Printing Kitchen Dept KOT" KitchenDept="${content.kitchenDepartment}" JobId="${content?.job_id}"`,
          );
          const getPrinters = await getPrinterbykitchendepartment({
            action_type: PRINTER_ACTION_TYPES.KD_KOT_PRINTER,
            app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
            billing_type: String(content.billingType),
            department_name: window.kitchenDepartmentsidsmap[element.id],
          });
          await renderkotView(content, getPrinters);

          // Check if label printer is on
          if ([1, 2].includes(window.printtoLabelprinter)) {
            await renderkotViewforLabel(previewDetails);
          }
        }
      }

      if (printAllInOneKot) {
        // await sleep(500);
        // $('#kitchenDepartmentDiv').hide();

        const getPrinters = await getPrinterbyordertype({
          action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
          app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
          billing_type: String(content.billingType),
        });
        Object.assign(originalContent, {
          job_id: window.generateId(10),
        });
        await renderkotView(originalContent, getPrinters);
        // await sendPrintKOTfromremote(1);
      }
    } else {
      // $('#kitchenDepartmentDiv').removeClass('kitchendept');
      const getPrinters = await getPrinterbyordertype({
        action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
        app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
        billing_type: String(content.billingType),
      });
      await renderkotView(content, getPrinters);

      // Check if label printer is on
      if ([1, 2].includes(window.printtoLabelprinter)) {
        await renderkotViewforLabel(previewDetails);
      }
    }
  }
updatedItemslist = {};
$('#oldkotupdatedprintButton').hide();
}
async function loadWaitersList() {
  try {
    console.log('Attempting to load waiters list...');
    // Replace with your actual API endpoint for waiters
    const response = await apiCall.get('/api/waiters', {
      headers: getHeadersformposforrender(),
    });
    if (response.data && response.data.waiters) {
      window.waitersList = response.data.waiters;
      console.log('Successfully loaded waiters list:', window.waitersList);
    } else {
      console.log('No waiters data in response');
      window.waitersList = [];
    }
  } catch (error) {
    console.error('Failed to load waiters list:', error);
    window.waitersList = [];
  }
  console.log('loadWaitersList finished loading');
}
async function checkKotsPrint() {
  if (window.currentoldkotDetails !== undefined) {
    // add customer
    const table = $(`#table_${window.currentoldkotDetails.table_id}`);
    const { customer } = table[0].data.details;
    const orderType = window.currentoldkotDetails.order_type_flag;

    const selectedItems = window.currentoldkotDetails.items;

    // const groupedItems = _.chain(selectedItems)
    //   .groupBy('title')
    //   .map((platform, id) => ({
    //     title: id,
    //     quantity: _.sumBy(platform, 'quantity'),
    //     amount: _.sumBy(platform, 'amount'),
    //     kitchen_dept: platform[0].kitchen_dept,
    //     product_group_id: platform[0].product_group_id,
    //     product_group_name: platform[0].product_group_name,
    //     item_refid: platform[0].item_refid,
    //     reason: platform[0].reason,
    //     note: platform[0].note,
    //     alternative_title: platform[0].alternative_title,
    //   }))
    //   .value();
    let order_number;
    if (
      window.currentoldkotDetails &&
      window.currentoldkotDetails.items &&
      window.currentoldkotDetails.items.length
    ) {
      let extra_details =
        window.currentoldkotDetails.items[0].mpos_kot.extra_details;
      if (extra_details) {
        extra_details = safeParse(extra_details);
        order_number = extra_details.order_number;
      }
    }
    if (selectedItems.length > 0) {
      const previewDetails = {
        items: selectedItems,
        tableName: window.currentoldkotDetails.tableName,
        kot_type: 'Check',
        kot_number: kotNumberstoPrint.join(','),
        fromTable: '',
        billingType: window.currentoldkotDetails.order_type_flag + 1,
        customer: showcustomeronKOTfordinein && customer ? customer : undefined,
        showStorenamonkot: showStorenamonkot && window.storeDetails.store_name,
        checkKotPrint: true,
        waiter: window.currentoldkotDetails.waiter,
        order_number,
        username: window.storeDetails.username,
        // note: '',
      };

      if (currentBillingtype !== undefined) {
        Object.assign(previewDetails, {
          billingType: currentBillingtype,
        });
      }

      if (window.customKOTtitlesettings) {
        let customTitle;
        switch (orderType) {
          case 0:
            customTitle = `${previewDetails.kot_type} ${window.customKOTtitlesettings.dinein ? window.customKOTtitlesettings.dinein : ''}`;
            break;

          case 1:
            customTitle = `${previewDetails.kot_type} ${window.customKOTtitlesettings.takeaway ? window.customKOTtitlesettings.takeaway : ''}`;
            break;

          case 2:
            customTitle = `${previewDetails.kot_type} ${window.customKOTtitlesettings.delivery ? window.customKOTtitlesettings.delivery : ''}`;
            break;
          default:
            break;
        }

        Object.assign(previewDetails, {
          customKOTTitle: customTitle,
        });
      }

      await checkKotPrintHandler(previewDetails);
    } else {
      notifyUser.showMessage(
        'error',
        $.i18n.t('controller:oldKotController.pleaseSelectSomeItems'),
      );
    }
  }
}
/**
 *
 * @param {
 *  1= print Old KOT
 *  2= Delete KOT
 *  3= cancel KOT
 *  4= Transfer
 */
async function printoldKOT(
  actionType,
  tableName,
  cancelledItems,
  extra_details,
) {
  if (window.currentoldkotDetails != undefined) {
    let printcancelledKOT = false;
    let printTransferKOT = false;
    if (
      (actionType == CANCELLED_KOT_ITEM || actionType == 5) &&
      $('#cancelkotCheck').is(':checked')
    ) {
      printcancelledKOT = true;
    }

    if (
      actionType == TRANSFER_KOT_ITEM &&
      $('#transferkotCheck').is(':checked')
    ) {
      printTransferKOT = true;
    }

    if (actionType == 1 && !$('#printkotCheck').is(':checked')) {
      notifyUser.showMessage(
        'error',
        $.i18n.t('controller:oldKotController.pleaseCheckPrint'),
      );
      return;
    }

    // add customer
    const table = $(`#table_${window.currentoldkotDetails.table_id}`);
    const { customer } = table[0].data.details;
    const orderType = window.currentoldkotDetails.order_type_flag;
    let isTrasferItem = false;
    if (actionType == TRANSFER_KOT_ITEM) {
      isTrasferItem = true;
    }

    let selectedItems;
    if (actionType == 5) {
      selectedItems = cancelledItems;
      kotNumberstoPrint = [cancelledItems[0].mpos_kot?.kot_number];
    } else {
      selectedItems = getCheckedItems(isTrasferItem, actionType);
    }

    let order_number;
    if (
      window.currentoldkotDetails &&
      window.currentoldkotDetails.items &&
      window.currentoldkotDetails.items.length
    ) {
      if (!extra_details) {
        extra_details =
          window.currentoldkotDetails.items[0].mpos_kot.extra_details;
      }
      if (extra_details) {
        extra_details = safeParse(extra_details);
        order_number = extra_details.order_number;
      }
    }
    switch (actionType) {
      case CANCELLED_KOT_ITEM:
        showLoader({
          title: 'Cancelling KOT Item',
          text: $.i18n.t('controller:orderController.pleaseWait'),
        });
        break;

      case DELETED_KOT_ITEM:
        showLoader({
          title: 'Deleting KOT Item',
          text: $.i18n.t('controller:orderController.pleaseWait'),
        });
        break;

      default:
        break;

      // case TRANSFER_KOT_ITEM:
      //   showLoader({
      //     title: 'Transferring KOT',
      //     text: $.i18n.t('controller:orderController.pleaseWait'),
      //   });
      //   break;
    }

    if (
      window.currentoldkotDetails &&
      window.currentoldkotDetails.order_id &&
      selectedItems.length === window.currentoldkotDetails.items.length &&
      actionType === CANCELLED_KOT_ITEM
    ) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:modifybillnotifications.Cantcancelallitems'),
      );
      return;
    }

    if (
      window.currentoldkotDetails &&
      window.currentoldkotDetails.order_id &&
      selectedItems.length === window.currentoldkotDetails.items.length &&
      actionType === DELETED_KOT_ITEM
    ) {
      window.notifyUser.showMessage('error', "Can't delete all items");
      return;
    }
    const groupedItems = _.chain(selectedItems)
      // .groupBy('oldTitle-amount')
      .groupBy((item) => `${item.oldTitle}^${item.item_price}-${item.note}`) // -${item.amount}
      .map((platform, id) => {
        const [oldTitle, amount] = id.split('^'); // Extract the two conditions
        // const oldTitle = id;
        return {
          title: oldTitle,
          oldTitle: oldTitle, // Grouped by oldTitlee
          kitchen_dept: platform[0].kitchen_dept,
          quantity: _.sumBy(platform, 'quantity'), // Sum of quantities
          amount: _.sumBy(platform, 'amount'), // Sum of amounts
          product_group_id: platform[0].product_group_id,
          product_group_name: platform[0].product_group_name,
          item_refid: platform[0].item_refid,
          reason: platform[0].reason,
          note: platform[0].note,
          alternative_title: platform[0].alternative_title,
          addons: platform[0].addons,
          extra_details: platform[0].extra_details,
        };
      })
      .value();
    // .map((platform, id) => ({
    //   title: id,
    //   quantity: _.sumBy(platform, 'quantity'),
    //   amount: _.sumBy(platform, 'amount'),
    //   kitchen_dept: platform[0].kitchen_dept,
    //   product_group_id: platform[0].product_group_id,
    //   product_group_name: platform[0].product_group_name,
    //   item_refid: platform[0].item_refid,
    //   reason: platform[0].reason,
    //   note: platform[0].note,
    //   alternative_title: platform[0].alternative_title,
    //   addons: platform[0].addons,
    //   extra_details: platform[0].extra_details,
    // }))
    // .value();

    // remote order id's
    let remote_order_id = '';
    const kot_notes = {};
    selectedItems.forEach((item) => {
      if (
        item &&
        item.mpos_kot &&
        item.mpos_kot.remote_order_id &&
        item.mpos_kot.remote_order_id != '0'
      ) {
        // if (!remote_order_ids.includes(item.mpos_kot.remote_order_id)) {
        //   remote_order_ids.push(item.mpos_kot.remote_order_id);
        // }
        remote_order_id = item.mpos_kot.remote_order_id;
      }

      if (item.mpos_kot && item.mpos_kot.note) {
        kot_notes[item.mpos_kot.kot_number] = item.mpos_kot.note;
      }
    });

    if (selectedItems.length > 0) {
      let kotIDs;

      if (actionType == CANCELLED_KOT_ITEM || actionType == DELETED_KOT_ITEM) {
        kotIDs = new Set();
        const updateOldkotdata = {
          updateStatus: true,
          actionType,
          selectedItems,
          order_id: window.currentoldkotDetails.order_id,
          table_id: window.currentoldkotDetails.table_id,
          remote_order_id,
        };
        const cancelledItems = [];
        updateOldkotdata.selectedItems.forEach((item) => {
          kotIDs.add(item.kot_id);
          Object.assign(item, { createdBy: window.storeDetails.username });
          // check if item is discounted item
          // if same item y item on multiple x item then issue is in live tracking
          // send all discounted item qty for cancel
          let sumQuantity;
          if (item && item.extra_details && item.extra_details.baseItemRefId) {
            sumQuantity = window.currentoldkotDetails.items
              .filter(
                (i) =>
                  i.item_refid === item.item_refid &&
                  i.item_price === item.item_price &&
                  i.kot_id === item.kot_id,
              )
              .reduce((sum, i) => sum + i.quantity, 0);
          }
          const originalItem = { ...item };
          Object.assign(originalItem, {
            comment: '##DELETE_THIS_ITEM##',
            item_name: originalItem.title,
            category_name: originalItem.category_name,
            createdBy: window.storeDetails.username,
          });
          if (item && item.extra_details && item.extra_details.baseItemRefId) {
            Object.assign(originalItem, {
              quantity: sumQuantity,
              deleteDiscountedItem: true,
            });
          }
          cancelledItems.push(originalItem);
        });

        Object.assign(updateOldkotdata, { cancelledItems });

        initUpdateOldKotItem(JSON.stringify(updateOldkotdata));
        selectedItems.forEach((item) => {
          const row = $(`table#oldbillTable tr#olditemrow_${item.kot_item_id}`);
          const qtyCell = row.find('.oldeditablekotQty');
          const currentQty = Number(qtyCell.text());

          if (
            !isNaN(currentQty) &&
            currentQty > 0 &&
            currentQty !== item.quantity
          ) {
            item.quantity = currentQty;
          } else {
            row.remove();
          }
        });
        let allitemsRemoved = false;
        if ($('#oldbillTable tbody tr').length == 0) {
          initSetInactiveKot(
            JSON.stringify({
              table_id,
              deleteTable: order_type_flag != 0,
              tableName: window.currentoldkotDetails.tableName,
            }),
          );
          const data = $(`#table_${table_id}`).prop('data');
          if (data) {
            data.details.items = [];
          }
          allitemsRemoved = true;

          if (allitemsRemoved) {
            if (showTimeOnTable) {
              removetablefromwathersList(`table_${table_id}`);
            }
            window.resetCurrenttableDataFromRemot();
          }
        }
        if (kotIDs.size) {
          for (let kot_id of kotIDs) {
            const eventParams = {
              kot_id,
              table_id,
              allitemsRemoved,
              message: `KOT Update for ${window.currentoldkotDetails.tableName}`,
              tableName: window.currentoldkotDetails.tableName,
            };

            setTimeout(() => {
              sendKotupdateddevent(eventParams);
            }, 2000);
          }
        } else {
          const eventParams = {
            table_id,
            allitemsRemoved,
            message: `KOT Update for ${window.currentoldkotDetails.tableName}`,
          };

          setTimeout(() => {
            sendKotupdateddevent(eventParams);
          }, 2000);
        }
        $('#oldbillTable tbody tr td input.reasonField').val('');
      }

      window.refreshOrderSettlementWindow = true;
      let kot_note = '';
      if (
        kot_notes &&
        Object.values(kot_notes) &&
        Object.values(kot_notes).length
      ) {
        kot_note = Object.values(kot_notes).join(',');
      }
      // updated data first and then print kot
      if (
        actionType == PRINT_OLD_KOT ||
        (CANCELLED_KOT_ITEM && printcancelledKOT) ||
        (actionType == TRANSFER_KOT_ITEM && printTransferKOT) ||
        (actionType == 5 && cancelledItems && printcancelledKOT)
      ) {
        const previewDetails = {
          items: groupedItems,
          tableName:
            actionType == TRANSFER_KOT_ITEM
              ? tableName
              : window.currentoldkotDetails.tableName,
          kot_type:
            actionType == CANCELLED_KOT_ITEM || actionType == 5
              ? $.i18n.t('controller:oldKotController.cancelledKOT')
              : actionType == TRANSFER_KOT_ITEM
                ? $.i18n.t('controller:oldKotController.Transfer')
                : 'Old',
          kot_number:
            actionType === TRANSFER_KOT_ITEM
              ? transferKotNumber
              : kotNumberstoPrint.join(','),
          // kot_number: kotNumberstoPrint.join(','),
          fromTable:
            actionType == TRANSFER_KOT_ITEM
              ? window.currentoldkotDetails.tableName
              : '',
          billingType: window.currentoldkotDetails.order_type_flag + 1,
          customer:
            // actionType !== TRANSFER_KOT_ITEM &&
            showcustomeronKOTfordinein && customer ? customer : undefined,
          showStorenamonkot:
            showStorenamonkot && window.storeDetails.store_name,
          waiter: window.currentoldkotDetails.waiter,
          order_number,
          note: actionType !== CANCELLED_KOT_ITEM ? kot_note : '',
          table_id: window.currentoldkotDetails.table_id,
          // note: '',
        };

        if (currentBillingtype !== undefined) {
          Object.assign(previewDetails, {
            billingType: currentBillingtype,
          });
        }

        if (window.customKOTtitlesettings) {
          let customTitle;
          switch (orderType) {
            case 0:
              customTitle = `${previewDetails.kot_type} ${window.customKOTtitlesettings.dinein ? window.customKOTtitlesettings.dinein : ''}`;
              break;

            case 1:
              customTitle = `${previewDetails.kot_type} ${window.customKOTtitlesettings.takeaway ? window.customKOTtitlesettings.takeaway : ''}`;
              break;

            case 2:
              customTitle = `${previewDetails.kot_type} ${window.customKOTtitlesettings.delivery ? window.customKOTtitlesettings.delivery : ''}`;
              break;
            default:
              break;
          }
          Object.assign(previewDetails, {
            customKOTTitle: customTitle,
          });
        }
        let showCovers = 0;
        if (showcoversonKotprint) {
          const activeTab = $('#ordermainsectionTabsid li a.active').attr('id');
          if (activeTab) {
            switch (activeTab) {
              case DINEIN_TAB_ID:
                if ($('#noofpersonsField').val()) {
                  showCovers = $('#noofpersonsField').val();
                }
                break;
              case TAKEAWAY_TAB_ID:
                if ($('#takeawaynoofpersonsField').val()) {
                  showCovers = $('#takeawaynoofpersonsField').val();
                }
                break;
              case DELIVERY_TAB_ID:
                if ($('#deliverynoofpersonsField').val()) {
                  showCovers = $('#deliverynoofpersonsField').val();
                }
                break;

              default:
                break;
            }
          }
          Object.assign(previewDetails, {
            showCovers,
          });
        }
        await kotprintHandler(previewDetails);
        // if (actionType === TRANSFER_KOT_ITEM) {
        //   const prevDetails = cloneDeep(previewDetails);
        //   prevDetails.changeTablePrint = true;
        //   await kotprintHandler(prevDetails);
        // }
      }
 } else {

  if (!__isCancelAfterOTP) {
    notifyUser.showMessage(
      'error',
      $.i18n.t('controller:oldKotController.pleaseSelectSomeItems'),
    );
  }

}
  }
}

async function kotprintHandler(content) {
  try {
    if (window.printkdwiseKot && content.items && content.items.length > 0) {
      // $('#kitchenDepartmentDiv').addClass('kitchendept');
      // $('#kitchenDepartmentDiv').show();
      Object.assign(content, { username: window.storeDetails.username });
      const originalContent = { ...content };

      const filteredList = groupItemsbyDepsforremote(content.items);
      addKitchenprinterifnotadded_fromremote();
      // Now Print KOT by filtering the above filtered
      // list of departments along with their items
      for (let i = 0; i < window.kitchenDepartments.length; i++) {
        const element = window.kitchenDepartments[i];
        const groupFilter = _.find(filteredList, ['kitchen_dept', element.id]);
        if (groupFilter) {
          // await sleep(1200);
          content.items = groupFilter.items;
          content.kitchenDepartment =
            window.kitchenDepartmentsidsmap[element.id];

          Object.assign(content, {
            job_id: window.generateId(10),
          });
          console.log(
            `[OldKOT]Message="Printing Kitchen Dept KOT" KitchenDept="${content.kitchenDepartment}" JobId="${content?.job_id}"`,
          );
          let getPrinters = await getPrinterbykitchendepartment({
            action_type: PRINTER_ACTION_TYPES.KD_KOT_PRINTER,
            app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
            billing_type: String(content.billingType),
            department_name: window.kitchenDepartmentsidsmap[element.id],
          });
          if (getPrinters.length === 0 && !printAllInOneKot) {
            getPrinters = await getPrinterbyordertype({
              action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
              app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
              billing_type: String(content.billingType),
            });
          }
          await renderkotView({ ...content }, getPrinters);

          // Check if label printer is on
          if ([1, 2].includes(window.printtoLabelprinter)) {
            await renderkotViewforLabel(previewDetails);
          }
        }
      }

      if (printAllInOneKot) {
        // $('#kitchenDepartmentDiv').hide();
        // await sleep(1200);

        Object.assign(originalContent, {
          isTerminalPrint: true,
          allInOneKot: true,
          job_id: window.generateId(10),
        });

        const getPrinters = await getPrinterbyordertype({
          action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
          app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
          billing_type: String(content.billingType),
        });
        await renderkotView(originalContent, getPrinters);
        // await sendPrintKOTfromremote(1);
      }
    } else if (window.printCategorywiseKot) {
      const filteredList = mapItemstocategory(content.items);
      // Now Print KOT by filtering the above filtered
      // list of departments along with their items
      for (const [key, value] of Object.entries(filteredList)) {
        if (value) {
          content.items = value;
          const getPrinters = getPrinterbyCategory({
            action_type: PRINTER_ACTION_TYPES.CATEGORYWISE_KOT_PRINTER,
            app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
            billing_type: String(content.billingType),
            category_name: key,
          });
          await renderkotView({ ...content }, getPrinters);
        }
      }
    } else if (window.printTablewiseKot) {
      const getPrinters = getPrinterbytable({
        action_type: PRINTER_ACTION_TYPES.TABLEWISE_KOT_PRINTER,
        app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
        table_name: content.tableName,
        table_id: content.table_id,
      });
      await renderkotView(content, getPrinters);
    } else {
      // $('#kitchenDepartmentDiv').removeClass('kitchendept');
      Object.assign(content, { username: window.storeDetails.username });
      const getPrinters = await getPrinterbyordertype({
        action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_KOT,
        app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
        billing_type: String(content.billingType),
      });
      await renderkotView(content, getPrinters);

      // Check if label printer is on
      if ([1, 2].includes(window.printtoLabelprinter)) {
        await renderkotViewforLabel(previewDetails);
      }
    }
  } catch (error) {
    console.log(error);
  }
}

async function checkKotPrintHandler(content) {
  try {
    // $('#kitchenDepartmentDiv').removeClass('kitchendept');
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    switch (activeTab) {
      case DINEIN_TAB_ID:
        {
          const getPrinters = await getPrinterbyordertype({
            action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
            app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
            billing_type: '1',
          });
          await renderkotView(content, getPrinters);
        }

        break;
      case TAKEAWAY_TAB_ID:
        {
          const getPrinters = await getPrinterbyordertype({
            action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
            app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
            billing_type: '2',
          });
          await renderkotView(content, getPrinters);
        }
        break;
      case DELIVERY_TAB_ID:
        {
          const getPrinters = await getPrinterbyordertype({
            action_type: PRINTER_ACTION_TYPES.ORDER_TYPE_WISE_BILL,
            app_source: ORDER_SOURCE_FOR_PRINT.ATLANTIC_POS,
            billing_type: '3',
          });
          await renderkotView(content, getPrinters);
        }
        break;
      default:
        break;
    }
  } catch (error) {
    console.log(`Error=Error while printing check kot print`, error);
  }
}

/**
 * Writes the details to the document to render
 * the data
 * @param {KOT Preview details} previewDetails
 */
async function renderkotView(previewDetails, printers) {
  try {
    const pageConfig = await setPageconfigifany_fromremote(
      previewDetails.tabId,
    );
    if (pageConfig && pageConfig.margins) {
      previewDetails.pageConfig = pageConfig;
      pageconfigProvided = true;
    } else {
      pageconfigProvided = false;
    }

    if (previewDetails) {
      console.log(
        `[OldKOT] Message="Preparing Kot print data for rendering" JobId="${previewDetails?.job_id}" kot_number="${previewDetails.kot_number}" billing_type="${previewDetails.billingType}" table_name="${previewDetails.tableName}"`,
      );
    }
    if (!window.__IS_MASTER_POS__ && !printers.length) {
      // const printKotData = $('#kotpreviewBodyid').data();

      Object.assign(previewDetails, {
        isTerminalPrint: true,
        // table_id: previewDetails.table_id,
      });
      sendKOTPrintRequestToMaster(previewDetails);
    } else {
      await window.printKotfromqueue({ previewDetails, printers });
    }

    sendKotupdateddevent({
      table: previewDetails.tableName,
      message: 'KOT Printed',
    });
  } catch (error) {
    console.log(error);
  }
}

async function sendPrintKOT(isLabelprinter) {
  let printData;
  const PRINTERNAME = isLabelprinter ? PRINTERS.LABEL : PRINTERS.KOT;
  let printkotFlag = true;

  if (
    window.printersList != undefined &&
    window.printersList.length > PRINTERNAME
  ) {
    printkotFlag = window.printersList[PRINTERNAME - 1].activate == 1;
    if (!printkotFlag) {
      setTimeout(() => {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:oldKotController.KOTPrintIsDisabled'),
        );
      }, 500);
      return true;
    }
    printData = {
      content: $('#kotpreviewBodyid').html(),
      deviceName: window.printersList[PRINTERNAME - 1].device_name
        ? window.printersList[PRINTERNAME - 1].device_name
        : '',
      silent: true,
      copies: window.printersList[PRINTERNAME - 1].no_of_prints,
      size: window.printersList[PRINTERNAME - 1].printer_size,
      type: 1,
      container: 'kotpreviewContainer',
    };
  } else {
    printData = {
      content: $('#kotpreviewBodyid').html(),
      deviceName: '',
      silent: true,
      type: 1,
    };
  }
  betteripcRenderer.callMain(PRINTERS_IPC.PRINT_WINDOW_AYNC, printData);
}

/**
 *
 * @param {Data to print} data
 */
async function printkottoLabelprinter(data) {
  if (
    window.printersList[PRINTERS.LABEL - 1] != undefined &&
    window.printersList[PRINTERS.LABEL - 1].device_name != undefined &&
    window.printersList[PRINTERS.LABEL - 1].more_info != undefined
  ) {
    const printkotFlag = window.printersList[PRINTERS.LABEL - 1].activate === 1;
    if (!printkotFlag) {
      setTimeout(() => {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:oldKotController.labelPrintIsDisabled'),
        );
      }, 500);
      return true;
    }

    try {
      const current_more_info = safeParse(
        window.printersList[PRINTERS.LABEL - 1].more_info,
      );
      if (!current_more_info.width) {
        current_more_info.width = '2';
      }
      data.isLabelprinter = true;
      data.more_info = current_more_info;

      $('#kotpreviewBodyid').data('data', data);
      await showkotPreview();
      sendPrintKOT(true);
    } catch (error) {}
  }
}
function reasonChanged() {}

async function handleOldQtyUpdate($cell) {

  if ($cell.data('processing')) {

    $cell.data('processing', false);
  }
  $cell.data('processing', true);

  let newQty = $cell.text().trim();

  if (!newQty || isNaN(newQty) || newQty.length > 10 || Number(newQty) < 0) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('Please enter valid quantity'),
    );
    $cell.data('processing', false);
    return false;
  }

  const minQty = 0.001;

  if (Number(newQty) < minQty) {
    window.notifyUser.showMessage(
      'error',
      `Minimum allowed quantity is ${minQty}`,
    );
    $cell.data('processing', false);
    return false;
  }

  try {
    newQty = Number(Number(newQty).toFixed(window.ROUNDOFF_UPTO));
  } catch {
    newQty = 1;
  }

  if (newQty === 0) newQty = 1;
  const $row = $cell.closest('tr');
  const rowId = $row.attr('id');
  const currentKotItemId = rowId.replace('olditemrow_', '');

  if (
    !window.currentoldkotDetails ||
    !Array.isArray(window.currentoldkotDetails.items)
  ) {
    $cell.data('processing', false);
    return false;
  }

  let updatedItem = null;

  for (const item of window.currentoldkotDetails.items) {
    if (item.kot_item_id != currentKotItemId) continue;
    if (newQty === item.quantity) break;

    const originalItem = { ...item };
    if (newQty === originalItem.quantity) {
      $cell.data('processing', false);
      return true;
    }
    console.log('reduceStock:', reduceStock);
    if (reduceStock) {
      const stockItem = window.allItemsList.find(
        (i) => i.item_refid === item.item_refid,
      );

      console.log('stockItem:', stockItem);
      console.log('newQty:', newQty);
      console.log('item.quantity::', item.quantity);
      console.log('stockItem.current_stock::', stockItem.current_stock);
      console.log(
        'newQty > item.quantity + stockItem.current_stock:',
        newQty > item.quantity + stockItem.current_stock,
      );
      if (stockItem && newQty > item.quantity + stockItem.current_stock) {
        window.notifyUser.showMessage(
          'error',
          `Only ${stockItem.current_stock} items available`,
        );
        $cell.text(item.quantity);
        $cell.data('processing', false);
        return false;
      }
      const getItems = window.currentoldkotDetails.items.filter(
        (i) => i.item_refid === item.item_refid,
      );

      let currentSelectedQty = 0;
      if (getItems && getItems.length > 1) {
        currentSelectedQty = window.currentoldkotDetails.items.reduce(
          (sum, oitem) => {
            return sum + (oitem.quantity || 0);
          },
          0,
        );

        const posItem = window.allItemsList.find(
          (i) => i.item_refid === item.item_refid,
        );

        const totQty = currentSelectedQty - item.quantity;
        const totalStock = posItem.current_stock;
        if (totQty > totalStock) {
          window.notifyUser.showMessage(
            'error',
            `Only ${posItem.current_stock} items available. You can add upto ${posItem.current_stock} items`,
          );
          $cell.text(item.quantity);
          $cell.data('processing', false);
          return false;
        }
      }
    }
    item.quantity = newQty;
    if (newQty < item.quantity) {
      try {
        const otpResult = await askforOTP(
          order_type_flag,
          window.currentoldkotDetails.table_id,
          OTP_TYPES.ORDER_ITEM_MODIFY,
        );

        if (!otpResult) {
          $cell.text(item.quantity);
          $cell.data('processing', false);
          return false;
        }
      } catch (error) {
        console.error('OTP Error:', error);
        $cell.text(item.quantity);
        $cell.data('processing', false);
        return false;
      }
      if (!$('#canceloldkotButton').is(':visible')) {
        window.notifyUser.showMessage(
          'error',
          "You don't have access of cancel item",
        );
        $cell.text(item.quantity);
        $cell.data('processing', false);
        return false;
      }

      let reason = $row.find('.reasonField').val()?.trim();

      if (reasonMandatory && !reason) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:modifybillnotifications.Addreason'),
        );
        $cell.text(item.quantity);
        $cell.data('processing', false);
        return false;
      }

      if (reason && reason.length > 50) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:modifybillnotifications.Reasonlengthshouldbelessthanfiftycharacters',
          ),
        );
        $cell.text(item.quantity);
        $cell.data('processing', false);
        return false;
      }

      if (reason && window.allspecialCharRegex.test(reason)) {
        window.notifyUser.showMessage(
          'error',
          'Special characters are not allowed in reason',
        );
        $cell.text(item.quantity);
        $cell.data('processing', false);
        return false;
      }
    }

    // item.quantity = newQty;

    if (askotpforoldkotcancelitem && newQty < originalItem.quantity) {
      if (!window.cancelledKotItems) {
        window.cancelledKotItems = [];
      }

      const cancelledQty = Number(
        (originalItem.quantity - newQty).toFixed(window.ROUNDOFF_UPTO),
      );

      if (cancelledQty > 0) {
        window.cancelledKotItems.push({
          ...item,

          item_name: item.item_name || item.title || 'Item',

          quantity: cancelledQty,

          item_price: Number(item.item_price || item.price || 0),

          total: Number(
            ((item.item_price || item.price || 0) * cancelledQty).toFixed(
              window.ROUNDOFF_UPTO,
            ),
          ),
        });
      }

      pendingQtyChanges[item.kot_item_id] = {
        newQty: newQty,
        item: item,
        originalItem: originalItem,
      };

      oldkotUpdated = true;
} else {

  // ✅ ADD THIS CONDITION (DO NOT REMOVE ANYTHING)
  if (
    askotpforoldkotcancelitem &&
    pendingQtyChanges &&
    pendingQtyChanges[item.kot_item_id] &&
    pendingQtyChanges[item.kot_item_id].originalItem &&
    newQty < pendingQtyChanges[item.kot_item_id].originalItem.quantity
  ) {
    // 🚨 stay in pending (fix for 8 → 6 → 7)
    pendingQtyChanges[item.kot_item_id] = {
      newQty: newQty,
      item: item,
      originalItem: pendingQtyChanges[item.kot_item_id].originalItem,
    };

    oldkotUpdated = true;

  } else {

    item.quantity = originalItem.quantity;
    sendUpdateqtyrequest(newQty, item, originalItem);

    if (
      askotpforoldkotcancelitem &&
      pendingQtyChanges &&
      pendingQtyChanges[item.kot_item_id]
    ) {
      delete pendingQtyChanges[item.kot_item_id];

      if (Object.keys(pendingQtyChanges).length === 0) {
        oldkotUpdated = false;
      }
    }

  }
}

    updatedItem = item;

    console.log('handleoldkotupdate::', updatedItemslist);
  if (!askotpforoldkotcancelitem) {
  $('#oldkotupdatedprintButton').show();
}
    oldkotUpdated = true;

    setTimeout(() => {
      sendKotupdateddevent({
        table_id,
        allitemsRemoved: false,
        message: `KOT Update for ${window.currentoldkotDetails.tableName}`,
      });
    }, 2000);

    break;
  }
  if (updatedItem?.discounted_items) {
    updateDiscounteditemsqty(newQty, updatedItem);
  }
  $cell.data('processing', false);
  return true;
}
function Initialize() {
  $('#transferitemButton').on('click', async () => {
    $('#oldbillTable td .oldeditablekotQty').blur();
    try {


      let hasInvalidReason = false;

      $('#oldbillTable tbody tr').each(function () {
        const $row = $(this);

        const reason = $row.find('.reasonField').val()?.trim();
        const isChecked = $row.find('input[type="checkbox"]').prop('checked');

        if (reason && reason.length > 0 && !isChecked) {
          hasInvalidReason = true;
        }
      });


      if (hasInvalidReason) {
        notifyUser.showMessage(
          'error',
          $.i18n.t('controller:oldKotController.pleaseSelectSomeItems'),
        );
        return;
      }

    const selectedBeforeOTP = getCheckedItems(true, 2);

try {
  const pendingKeys = Object.keys(pendingQtyChanges || {});

  if (pendingKeys.length > 0) {
    const selectedIds = (selectedBeforeOTP || []).map(i =>
      String(i.kot_item_id)
    );

    const hasUnselectedModified = pendingKeys.some(
      key => !selectedIds.includes(String(key))
    );

    if (hasUnselectedModified) {
      notifyUser.showMessage(
        'error',
        $.i18n.t('controller:oldKotController.pleaseSelectSomeItems')
      );
      return;
    }
  }
} catch (err) {
  console.error('Transfer modified selection validation error', err);
}

let hasDecrement = false;

      selectedBeforeOTP.forEach((item) => {
        const change = pendingQtyChanges[item.kot_item_id];

        if (!change) return;

        const originalQty = Number(change.originalItem?.quantity);
        const newQty = Number(change.newQty);

        if (newQty < originalQty) {
          hasDecrement = true;
        }
      });
      if (
        reasonMandatory &&
        Object.keys(pendingQtyChanges).length > 0 &&
        hasDecrement
      ) {
        let reasonMissing = false;

        const selectedItemsForValidation = getCheckedItems(true, 2);

        selectedItemsForValidation.forEach((item) => {
          const change = pendingQtyChanges[item.kot_item_id];

          if (!change) return;

          const originalQty = Number(change.originalItem?.quantity);
          const newQty = Number(change.newQty);

          if (newQty < originalQty) {
            const reason = $(`#olditemreason_${item.kot_item_id}`)
              .val()
              ?.trim();

            if (!reason) {
              reasonMissing = true;
            }
          }
        });

        if (reasonMissing) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:modifybillnotifications.Addreason'),
          );
          return;
        }
      }

      if (
        askotpforoldkotcancelitem &&
        Object.keys(pendingQtyChanges).length > 0 &&
        hasDecrement
      ) {
        const otpResult = await askforOTP(
          order_type_flag,
          window.currentoldkotDetails.table_id,
          OTP_TYPES.ORDER_ITEM_MODIFY,
        );

        const __backupPendingQtyChanges = { ...pendingQtyChanges };
        const __backupOldkotUpdated = oldkotUpdated;


        if (!otpResult) {
          if (window.cancelledKotItems && window.cancelledKotItems.length > 0) {
            window.cancelledKotItems = [];
          }
          pendingQtyChanges = {};
          oldkotUpdated = false;

          if (Object.keys(__backupPendingQtyChanges).length > 0) {
            pendingQtyChanges = __backupPendingQtyChanges;
            oldkotUpdated = true;
          }

          return;
        }

        for (const key in pendingQtyChanges) {
          const change = pendingQtyChanges[key];
          sendUpdateqtyrequest(change.newQty, change.item, change.originalItem);
        }
        if (window.cancelledKotItems && window.cancelledKotItems.length > 0) {
          __cancelledItemsBackupForPrint = [...window.cancelledKotItems];
        }
        pendingQtyChanges = {};
        oldkotUpdated = false;
        pendingQtyChanges = {};
        await new Promise((resolve) => setTimeout(resolve, 50));

        selectedBeforeOTP.forEach((item) => {
          $(`#olditem_${item.kot_item_id}`).prop('checked', true);
        });
      }

      openTransferitempopup();
    } catch (error) {
      console.error('Transfer OTP Error:', error);
    }
  });
  $('#printoldkotButton').on('click', () => {
    printoldKOT(1);
  });

  $('#canceloldkotButton').on('click', async () => {
    __isCancelAfterOTP = false;
    try {
      const selectedItems = getCheckedItems(false, CANCELLED_KOT_ITEM);



      if (!selectedItems || selectedItems.length === 0) {
        notifyUser.showMessage(
          'error',
          $.i18n.t('controller:oldKotController.pleaseSelectSomeItems'),
        );
        return;
      }

      let hasInvalidReason = false;

      $('#oldbillTable tbody tr').each(function () {
        const $row = $(this);

        const reason = $row.find('.reasonField').val()?.trim();
        const isChecked = $row.find('input[type="checkbox"]').prop('checked');

        if (reason && reason.length > 0 && !isChecked) {
          hasInvalidReason = true;
        }
      });

      if (hasInvalidReason) {
        notifyUser.showMessage(
          'error',
          $.i18n.t('controller:oldKotController.pleaseSelectSomeItems'),
        );
        return;
      }


      if (reasonMandatory) {

        let reasonMissing = false;

        $('#oldbillTable tbody tr').each(function () {
          const row = $(this);
          const isChecked = row.find('input[type="checkbox"]').prop('checked');
          const reason = row.find('.reasonField').val()?.trim();


          if (isChecked && (!reason || reason.length === 0)) {
            reasonMissing = true;
          }
        });


        if (reasonMissing) {
          notifyUser.showMessage(
            'error',
            $.i18n.t('controller:modifybillnotifications.Addreason'),
          );
          return;
        }
      }
      if (reasonMandatory) {
        let reasonMissing = false;

        $('#oldbillTable tbody tr').each(function () {
          const row = $(this);
          const rowId = row.attr('id');

          if (!rowId) return;

          const kotItemId = rowId.replace('olditemrow_', '');

          const item = window.currentoldkotDetails.items.find(
            (i) => String(i.kot_item_id) === String(kotItemId),
          );

          if (!item) return;

          const uiQty = Number(row.find('.oldeditablekotQty').text());
          const originalQty = Number(item.quantity);

          if (uiQty < originalQty) {
            const reason = row.find('.reasonField').val()?.trim();

            if (!reason) {
              reasonMissing = true;
            }
          }
        });

        if (reasonMissing) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:modifybillnotifications.Addreason'),
          );
          return;
        }
      }
      if (askotpforoldkotcancelitem) {
        const otpResult = await askforOTP(
          order_type_flag,
          window.currentoldkotDetails.table_id,
          OTP_TYPES.ORDER_ITEM_MODIFY,
        );

        const __backupPendingQtyChanges = { ...pendingQtyChanges };
        const __backupOldkotUpdated = oldkotUpdated;

        if (!otpResult) {
          pendingQtyChanges = {};


          oldkotUpdated = false;
__isCancelAfterOTP = true;

          if (Object.keys(__backupPendingQtyChanges).length > 0) {
            pendingQtyChanges = __backupPendingQtyChanges;
            oldkotUpdated = true;
          }

          return;
        }

        const hasPendingQtyChanges = Object.keys(pendingQtyChanges).length > 0;

        for (const key in pendingQtyChanges) {
          __isCancelAfterOTP = true;
          const change = pendingQtyChanges[key];
          sendUpdateqtyrequest(change.newQty, change.item, change.originalItem);
          Object.keys(pendingQtyChanges).forEach((kotItemId) => {
            $(`#olditem_${kotItemId}`).prop('checked', false);
          });
        }
        if (window.cancelledKotItems && window.cancelledKotItems.length > 0) {
          __cancelledItemsBackupForPrint = [...window.cancelledKotItems];
        }
        pendingQtyChanges = {};

        oldkotUpdated = false;
        $('#oldkotupdatedprintButton').css(
          'display',
          Object.keys(updatedItemslist).length === 0 ? 'none' : '',
        );


        if (hasPendingQtyChanges && (!selectedItems || selectedItems.length === 0)) {

          return;
        }
      }

      printoldKOT(CANCELLED_KOT_ITEM);
      oldkotUpdated = false;
    } catch (error) {
      console.error('OTP Error:', error);
    }
  });

  $('#deleteoldkotButton').on('click', async () => {
    try {
      const selectedItems = getCheckedItems(false, DELETED_KOT_ITEM);

    if (!selectedItems || selectedItems.length === 0) {

  setTimeout(() => {
    if (__isCancelAfterOTP) return;

    notifyUser.showMessage(
      'error',
      $.i18n.t('controller:oldKotController.pleaseSelectSomeItems'),
    );
  }, 50);

  return;
}

      if (reasonMandatory) {
        let reasonMissing = false;

        $('#oldbillTable')
          .find('input[type="checkbox"]:checked')
          .each(function () {
            const reason = $(this).siblings('input.reasonField').val()?.trim();
            if (!reason) reasonMissing = true;
          });

        if (reasonMissing) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:modifybillnotifications.Addreason'),
          );
          return;
        }
      }

      if (askotpforoldkotcancelitem) {
        const otpResult = await askforOTP(
          order_type_flag,
          window.currentoldkotDetails.table_id,
          OTP_TYPES.ORDER_ITEM_MODIFY,
        );

        if (!otpResult) return;
      }

      const hasPendingQtyChanges = Object.keys(pendingQtyChanges).length > 0;

      for (const key in pendingQtyChanges) {
        const change = pendingQtyChanges[key];
        sendUpdateqtyrequest(change.newQty, change.item, change.originalItem);

        Object.keys(pendingQtyChanges).forEach((kotItemId) => {
          $(`#olditem_${kotItemId}`).prop('checked', false);
        });
      }

      pendingQtyChanges = {};

      if (hasPendingQtyChanges) {
        oldkotUpdated = false;
        return;
      }

      printoldKOT(DELETED_KOT_ITEM);
      oldkotUpdated = false;
    } catch (error) {
      console.error('OTP Error:', error);
    }
  });

  $('#oldkotupdatedprintButton').on('click', () => {
    printUpdatedqtykot();
  });

  $('#checkKotsPrintButton').on('click', () => {
    checkKotsPrint();
  });

  $('#oldkotmakecomplimentaryButtonid').on('click', () => {
    markasComplimentary();
  });

  $('#selectallCheck').click(function (e) {
    $('#oldbillTable')
      .find('tr td input:checkbox')
      .prop('checked', this.checked);
    if (this.checked) {
      $('#oldbillTable tbody tr td:last-child input.reasonField').show();
    } else {
      // $('#oldbillTable tbody tr td:last-child input.reasonField').hide();
    }
  });

  if (window.settingsConfig[AUTO_OUTOF_STOCK - 1] != undefined) {
    reduceStock = window.settingsConfig[AUTO_OUTOF_STOCK - 1].value === '1';
  }
  const observer = new MutationObserver(() => {
    const otpInput = document.querySelector('.swal2-input');

    if (otpInput) {
      otpInput.focus();
      otpInput.select();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  $(document).on(
    'keydown',
    '#oldbillTable td .oldeditablekotQty',

    async function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();

        const $cell = $(this);
        const success = await handleOldQtyUpdate($cell);

        if (success) {
          setTimeout(() => {
            $cell.blur();
          }, 0);
        }
      }
    },
  );
  $(document).on(
    'focusout',
    '#oldbillTable td .oldeditablekotQty',

    async function () {
      const $cell = $(this);

      if ($cell.data('processing')) return;

      const newQty = $cell.text().trim();

      if (!newQty || isNaN(newQty)) return;

      try {
        await handleOldQtyUpdate($cell);
      } catch (err) {
        console.error('Old KOT qty update error:', err);
      }
    },
  );
  /* Handle typing when OTP setting is OFF */
  $(document).on('input', '#oldbillTable td .oldeditablekotQty', function () {
    // If OTP setting is ON → skip this logic
    if (askotpforoldkotcancelitem) return;

    const $cell = $(this);

    // Prevent duplicate processing
    if ($cell.data('processing')) return;

    const newQty = $cell.text().trim();

    // Ignore invalid input
    if (!newQty || isNaN(newQty)) return;

    // Debounced API update
    debouncedManualQtyUpdate($cell);
  });
  $(document).on('shown.bs.modal', '.swal2-container', function () {
    setTimeout(() => {
      const otpInput = document.querySelector('#swal2-input');
      if (otpInput) {
        otpInput.focus();
        otpInput.select();
      }
    }, 50);
  });
  $(document).on(
    'change paste keyup',
    '#oldbillTable tbody tr td input.reasonField',
    function () {
      const selectedItems = getCheckedItems(false, 1);

      // if (selectedItems.length == window.currentoldkotDetails?.items.length) {
      const reason = $(this).val();
      // $('#oldbillTable tbody tr td input.reasonField').val(reason);
      selectedItems.forEach((item) => {
        if ($(`#olditem_${item.kot_item_id}`).is(':checked')) {
          $(`#olditemreason_${item.kot_item_id}`).val(reason);
        }
      });
      // }
    },
  );

  $(document).on(
    'click',
    '#oldbillTable tbody tr td:last-child input.olditemCheck',
    function (e) {
      const isChecked = $(this).is(':checked');
      // let kot_item_id = $(this).attr('id');
      // kot_item_id = String(kot_item_id).replace('olditem_', '');

      if (isChecked) {
        $(this).siblings('input.reasonField').show();
      } else {
        $(this).siblings('input.reasonField').hide();
      }
    },
  );
  $('#oldkotModal').on('hide.bs.modal', function (e) {
    if (askotpforoldkotcancelitem && oldkotUpdated) {
      e.preventDefault();

      Swal.fire({
        title: 'Unsaved Changes',
        text: 'Item quantity has been modified. Closing will discard the changes.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, Close',
        cancelButtonText: 'Cancel',
        cancelButtonColor: '#dc3545',
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then((result) => {
        if (result.isConfirmed) {
          $('#oldbillTable td .oldeditablekotQty').each(function () {
            $(this).data('processing', false);
          });
          oldkotUpdated = false;
          pendingQtyChanges = {};
          window.cancelledKotItems = [];
          $('#oldkotModal').modal('hide');
        }
      });
    }
  });
  if ($.i18n) {
    initializei18nforOldkotctrlwindowui();
  } else {
    setTimeout(initializei18nforOldkotctrlwindowui, 1000);
  }

  $('#oldbillTable').on(
    'click',
    '.incrementQty',
    debounce(function (e) {
      e.preventDefault();
      e.stopPropagation();
      incrementDecrementqty(this, e);
    }, 400),
  );

  $('#oldbillTable').on(
    'click',
    '.decrementQty',
    debounce(function (e) {
      e.preventDefault();
      e.stopPropagation();

      incrementDecrementqty(this, e);
    }, 400),
  );
  $('#oldbillTable').on('click', 'button, i', function (e) {


    if ($(this).hasClass('incrementQty') || $(this).hasClass('decrementQty')) {
      return;
    }
    if (!window.currentoldkotDetails || !Array.isArray(window.currentoldkotDetails.items)) {

      return;
    }

    if (e != undefined && e.target != undefined && e.target.id) {
      const raw_id = e.target.id;

      switch (raw_id.split('_')[0]) {
        case 'increment':
          $(this).siblings('.editable').off('blur');
          const item_id = $(this).attr('item_id');
          const itemData = $(this).parent().parent().data();
          let newQty = $(this).text();

          newQty = itemData.quantity + 1;
          if (item_id != undefined) {
            try {
              newQty = Number(Number(newQty).toFixed(ROUNDOFF_UPTO));
            } catch (error) {
              newQty = 1;
            }
            const items = cloneDeep(window.currentoldkotDetails.items);
            // $('#oldbillTable').find('tr:not(:first)').remove();
            let discountedItemsavailable;
            items.forEach(async (item) => {
              if (item && item.amount !== undefined) {
                let roundoffto = 2;
                if (item.amount && Number(item.amount).countDecimals() >= 3) {
                  roundoffto = 3;
                }
                let comparewith = item.title;
                if (item.isitemwithOption) {
                  comparewith = item.titlewithOption;
                }
                if (item.is_open_item && item.newopenitemName) {
                  comparewith = item.newopenitemName;
                }
                // if (itemData.title === comparewith) {
                if (
                  itemData.title === comparewith &&
                  item.price === itemData.price &&
                  item.short_code === itemData.short_code
                ) {
                  item.quantity =
                    newQty && typeof newQty === 'number' && newQty > 0
                      ? newQty
                      : item.quantity;
                  item.amount = item.item_price * item.quantity;
                  item.amount = Number(Number(item.amount).toFixed(roundoffto));
                  item.qtyUpdated = true;
                  if (
                    newQty !== itemData.quantity &&
                    itemData.discounted_items
                  ) {
                    discountedItemsavailable = item;
                  }
                }
                // addoldBillRow(item);
              }
            });
            // if (discountedItemsavailable) {
            //   addDiscounteditems(
            //     discountedItemsavailable.quantity,
            //     discountedItemsavailable,
            //     QUICK_BILLTABLE,
            //   );
            // }
            // precalculateDetailsCheck(quickbilltableButton);
          }

          break;

        case 'decrement':
          if (!$('#canceloldkotButton').is(':visible')) {
            window.notifyUser.showMessage(
              'error',
              "You don't have access of cancel item",
            );
            return;
          }
          $(this).siblings('.editable').off('blur');
          const itemId = $(this).attr('item_id');
          const item_Data = $(this).parent().parent().data();
          let reason = $(this).closest('tr').find('.reasonField').val();
          if (reason) {
            reason = reason.trim();
            if (reason.length > 50) {
              setTimeout(() => {
                window.notifyUser.showMessage(
                  'error',
                  $.i18n.t(
                    'controller:modifybillnotifications.Reasonlengthshouldbelessthanfiftycharacters',
                  ),
                );
              }, 50);
              return;
            }
            if (window.allspecialCharRegex.test(reason)) {
              setTimeout(() => {
                window.notifyUser.showMessage(
                  'error',
                  'Special characters are not allowed in reason',
                );
              }, 50);
              return;
            }
          }

          // Reason will be validated during Cancel/Delete action
          let new_Qty = $(this).text();
          new_Qty = item_Data.quantity - 1;
          if (new_Qty <= 0) {
            return;
          }
          if (itemId != undefined) {
            try {
              new_Qty = Number(Number(new_Qty).toFixed(ROUNDOFF_UPTO));
            } catch (error) {
              new_Qty = 1;
            }
            const items = cloneDeep(window.currentoldkotDetails.items);
            // $('#oldbillTable').find('tr:not(:first)').remove();
            let discountedItemsavailable;

            if (new_Qty > 0) {
              items.forEach((item) => {
                if (item && item.amount !== undefined) {
                  let roundoffto = 2;
                  if (item.amount && Number(item.amount).countDecimals() >= 3) {
                    roundoffto = 3;
                  }
                  let comparewith = item.title;
                  if (item.isitemwithOption) {
                    comparewith = item.titlewithOption;
                  }
                  if (item.is_open_item && item.newopenitemName) {
                    comparewith = item.newopenitemName;
                  }
                  // if (itemData.title === comparewith) {
                  if (
                    item_Data.title === comparewith &&
                    item.price === item_Data.price &&
                    item.short_code === item_Data.short_code
                  ) {
                    item.quantity =
                      new_Qty && typeof new_Qty === 'number' && new_Qty > 0
                        ? new_Qty
                        : item.quantity;
                    item.amount = item.item_price * item.quantity;
                    item.amount = Number(
                      Number(item.amount).toFixed(roundoffto),
                    );

                    if (
                      new_Qty !== item_Data.quantity &&
                      item_Data.discounted_items
                    ) {
                      discountedItemsavailable = item;
                    }
                  }
                  // addoldBillRow(item);
                }
              });
              // if (discountedItemsavailable) {
              //   addDiscounteditems(
              //     discountedItemsavailable.quantity,
              //     discountedItemsavailable,
              //     QUICK_BILLTABLE,
              //   );
              // }
            }
          }
          break;

        default:
          break;
      }
    }
  });

  $('#oldbillTable').on('change', 'input[type="checkbox"]', function () {
    const kot = $(this).attr('kot_number');

    if ($(this).is(':checked')) {
      // Add if not already present
      if (!selectedKotNumbers.includes(kot)) {
        selectedKotNumbers.push(kot);
      }
    } else {
      // Remove when unchecked
      selectedKotNumbers = selectedKotNumbers.filter((k) => k !== kot);
    }

    const kotString = selectedKotNumbers.join(',');
    $('#canceloldkotButton').data('kot_number', kotString);
  });
}

function incrementDecrementqty(a, e) {


  if (!window.currentoldkotDetails || !Array.isArray(window.currentoldkotDetails.items)) {

    if (__lastOldKotDetailsBackup && Array.isArray(__lastOldKotDetailsBackup.items)) {


      window.currentoldkotDetails = __lastOldKotDetailsBackup;
    } else {
      return;
    }
  }

  let newQty = $(a).siblings('.editable').text();
  const $btn = $(a);
  const $row = $btn.closest('tr');
  const $amountEl = $row.find('td').eq(2); // rowCell3
  let reason;
  if (e !== undefined && e.target !== undefined && e.target.id) {
    const raw_id = e.target.id;
    switch (raw_id.split('_')[0]) {
      case 'increment':
        newQty = Number(newQty) + 1;
        break;

      case 'decrement':
        if (!$('#canceloldkotButton').is(':visible')) {
          window.notifyUser.showMessage(
            'error',
            "You don't have access of cancel item",
          );
          return;
        }

        newQty = Number(newQty) - 1;
        break;
      default:
        break;
    }
  }

  if (newQty && newQty.length > 10) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:modifybillnotifications.Quantitylengthshouldbelessthantendigit',
      ),
    );
    return;
  }

  const raw_id = $(a).parent().parent().attr('id');
  // $('#oldbillTable').find('tr:not(:first)').remove();
  try {
    newQty = Number(Number(newQty).toFixed(window.ROUNDOFF_UPTO));
  } catch (error) {
    newQty = 1;
  }
  if (newQty == 0) {
    newQty = 1;
  }
  const current_kot_item_id = raw_id.replace('olditemrow_', '');
  const isqtyValid = newQty && newQty > 0;
  if (
    isqtyValid &&
    window.currentoldkotDetails != undefined &&
    window.currentoldkotDetails.items != undefined &&
    window.currentoldkotDetails.items.length > 0
  ) {
    let updatedItem;
    window.currentoldkotDetails.items.forEach((item) => {
      const originalItem = { ...item };
      if (item.kot_item_id == current_kot_item_id && newQty !== item.quantity) {
        if (reduceStock) {
          const getItem = window.allItemsList.find(
            (i) => i.item_refid === item.item_refid,
          );
          console.log('newQty:', newQty);
          console.log('item.quantity:', item.quantity);
          console.log('getItem.current_stock:', getItem.current_stock);
          if (getItem && newQty > item.quantity + getItem.current_stock) {
            setTimeout(() => {
              window.notifyUser.showMessage(
                'error',
                `Only ${getItem.current_stock} items available. You can add upto ${getItem.current_stock} items`,
              );
            }, 50);
            newQty = item.quantity;
          }

          const getItems = window.currentoldkotDetails.items.filter(
            (i) => i.item_refid === item.item_refid,
          );

          let currentSelectedQty = 0;
          if (getItems && getItems.length > 1) {
            currentSelectedQty = window.currentoldkotDetails.items.reduce(
              (sum, oitem) => {
                return sum + (oitem.quantity || 0);
              },
              0,
            );

            const posItem = window.allItemsList.find(
              (i) => i.item_refid === item.item_refid,
            );
            // const totQty = currentSelectedQty - (newQty + item.quantity);
            const totQty = newQty - item.quantity;

            let totalStock = posItem.current_stock;
            if (totQty > totalStock) {
              window.notifyUser.showMessage(
                'error',
                `Only ${posItem.current_stock} items available. You can add upto ${posItem.current_stock} items`,
              );
              newQty = item.quantity;
            }
          }
        }
        item.reason = reason;
        Object.assign(item, { createdBy: window.storeDetails.username });
   const existingPending = pendingQtyChanges[item.kot_item_id];

if (askotpforoldkotcancelitem) {
  if (existingPending) {
  const originalQty = Number(existingPending.originalItem?.quantity);

  if (newQty === originalQty) {
   
    delete pendingQtyChanges[item.kot_item_id];

    if (Object.keys(pendingQtyChanges).length === 0) {
      oldkotUpdated = false;
    }
  } else if (newQty > originalQty) {
  
    delete pendingQtyChanges[item.kot_item_id];
    sendUpdateqtyrequest(newQty, item, existingPending.originalItem);
  } else {
  
    pendingQtyChanges[item.kot_item_id] = {
      newQty: newQty,
      item: item,
      originalItem: existingPending.originalItem,
    };
    oldkotUpdated = true;
  }
} else if (newQty < item.quantity) {

    pendingQtyChanges[item.kot_item_id] = {
      newQty: newQty,
      item: item,
      originalItem: originalItem,
    };
    oldkotUpdated = true;
  } else {

    sendUpdateqtyrequest(newQty, item, originalItem);
  }
} else {
  sendUpdateqtyrequest(newQty, item, originalItem);
}

        $('#oldkotupdatedprintButton').hide();
        $('#oldkotupdatedprintButton').css(
          'display',
          Object.keys(updatedItemslist).length === 0 ? 'none' : '',
        );
        
if (!askotpforoldkotcancelitem || newQty >= item.quantity) {
  $('#oldkotupdatedprintButton').show();
}

if (
  askotpforoldkotcancelitem &&
  pendingQtyChanges &&
  pendingQtyChanges[item.kot_item_id] &&
  pendingQtyChanges[item.kot_item_id].originalItem &&
  typeof pendingQtyChanges[item.kot_item_id].originalItem.quantity === 'number' &&
  newQty < pendingQtyChanges[item.kot_item_id].originalItem.quantity
) {
  $('#oldkotupdatedprintButton').hide();
}
        if (askotpforoldkotcancelitem && newQty < item.quantity) {
          oldkotUpdated = true;
        } else {
          oldkotUpdated = false;
        }
        const eventParams = {
          table_id,
          allitemsRemoved: false,
          message: `KOT Update for ${window.currentoldkotDetails.tableName}`,
        };
        if (item && item.discounted_items) {
          updatedItem = item;
        }
        if (item.isComplimentary) {
          item.amount = 0;
          $amountEl.text(0);
        } else {
          const calculatedAmount = Number(item.item_price) * Number(newQty);
          item.amount = Number(calculatedAmount.toFixed(window.ROUNDOFF_UPTO));

          $amountEl.text(item.amount);
        }
        setTimeout(() => {
          sendKotupdateddevent(eventParams);
        }, 2000);
      }
      $(a).siblings('.editable').text(newQty);

      // addoldBillRow(item);
      setTimeout(() => {
        disableYItemOfBOGO(item);
      }, 50);
    });
    if (updatedItem && updatedItem.discounted_items) {
      updateDiscounteditemsqty(newQty, updatedItem);
    }
  }
}
function sendUpdateqtyrequest(newQty, item, originalItem) {
  const key = String(item.kot_item_id);

  //  STORE ONLY FIRST TIME GLOBALLY
  if (window.__originalQtyMap[key] === undefined) {
    window.__originalQtyMap[key] =
      originalItem ? originalItem.quantity : item.quantity;

    console.log(" GLOBAL ORIGINAL SET", {
      kot_item_id: item.kot_item_id,
      fixedQty: window.__originalQtyMap[key],
    });
  }
  if (newQty > window.__originalQtyMap[key]) {
  window.__originalQtyMap[key] = newQty;
}
  console.log(" sendUpdateqtyrequest CALLED", {
    kot_item_id: item.kot_item_id,
    newQty,
    itemQtyBefore: item.quantity,
    originalItemQty: originalItem?.quantity,
    title: item.title,
  });
  showLoader({
    title: 'Updating quantity',
    text: $.i18n.t('controller:orderController.pleaseWait'),
  });

  const originalQuantity =
    window.__originalQtyMap[String(item.kot_item_id)] ??
    (originalItem ? originalItem.quantity : item.quantity);

  const quantityDecreased = newQty - originalQuantity;

 if (newQty !== originalQuantity) {
  updatedItemslist[`${item.title}_${item.item_price}_${item.note}`] = item;

  // SHOW BUTTON ONLY AFTER REAL UPDATE
  $('#oldkotupdatedprintButton').show();
} const previousQty = item.quantity;
  item.quantity = newQty;
  itemExists = true;
  if (item.isComplimentary === true) {
    item.amount = 0;
  } else {
    item.amount = Number(item.item_price * item.quantity);
    item.amount = Number(Number(item.amount).toFixed(3));
    item.amount = Number(roundAmountUptoDecimals(item.amount, ROUNDOFF_UPTO));
  }

  const updateOldkotdata = {
    updateStatus: false,
    status: 5, // Updated,
    quantity: item.quantity,
    amount: item.amount,
    kot_item_id: item.kot_item_id,
    hasOptions: item.has_options,
    table_id,
    createdBy: window.storeDetails.username,
  };

  if (quantityDecreased < 0 && (askotpforoldkotcancelitem || newQty < previousQty)) {
    console.log(" CANCEL BLOCK", {
      kot_item_id: item.kot_item_id,
      newQty,
      quantityDecreased,
      itemQty: item.quantity,
    });

    const cancelledItem = { ...item };

    if (!window.cancelledKotItems) {
      window.cancelledKotItems = [];
    }

    delete cancelledItem.kot_item_id;
    console.log("BEFORE PUSH", {
      kot_item_id: item.kot_item_id,
      itemQtyBeforePush: item.quantity,
      newQty,
      quantityDecreased,
    });
    cancelledItem.quantity = Number(
      Math.abs(previousQty - newQty).toFixed(window.ROUNDOFF_UPTO),
    );
    console.log(" CALCULATED QTY", {
      kot_item_id: item.kot_item_id,
      calculatedQty: cancelledItem.quantity,
    });
    cancelledItem.amount = Number(
      (cancelledItem.item_price * cancelledItem.quantity).toFixed(
        window.ROUNDOFF_UPTO,
      ),
    );

    cancelledItem.status = CANCELLED_KOT_ITEM;
    cancelledItem.item_name = cancelledItem.title;
    console.log(" PUSHING CANCELLED ITEM", {
      kot_item_id: item.kot_item_id,
      pushedQty: cancelledItem.quantity,
    });
    if (cancelledItem.quantity > 0) { //  ADD SAFETY
      window.cancelledKotItems.push({
        ...cancelledItem,
      });
    } console.log(" ARRAY AFTER PUSH", JSON.stringify(window.cancelledKotItems));
    if (window.cancelledKotItems && window.cancelledKotItems.length > 0) {
      __cancelledItemsBackupForPrint = [
        ...__cancelledItemsBackupForPrint,
        ...window.cancelledKotItems,
      ];
    } window.cancelledKotItems = [];
    Object.assign(updateOldkotdata, { cancelledItem, quantityDecreased: true });
  }
  if (!askotpforoldkotcancelitem && newQty > previousQty) {
    var _netCancelledQty = Number((originalQuantity - newQty).toFixed(window.ROUNDOFF_UPTO));

    __cancelledItemsBackupForPrint = __cancelledItemsBackupForPrint.filter(function(_b) {
      return !(_b.kot_id === item.kot_id && _b.item_refid === item.item_refid && _b.item_price === item.item_price);
    });
    if (_netCancelledQty > 0) {
  
      var _consolidatedEntry = { ...item };
      delete _consolidatedEntry.kot_item_id;
      _consolidatedEntry.quantity = _netCancelledQty;
      _consolidatedEntry.amount = Number((item.item_price * _netCancelledQty).toFixed(window.ROUNDOFF_UPTO));
      _consolidatedEntry.status = CANCELLED_KOT_ITEM;
      _consolidatedEntry.item_name = item.title;
      __cancelledItemsBackupForPrint.push(_consolidatedEntry);
    }
  }
  if (newQty === 0) {
    Object.assign(updateOldkotdata, {
      actionType: 2,
      quantity: 1,
      amount: item.item_price * 1,
      status: 2,
      createdBy: window.storeDetails.username,
    });
  }
  if (originalItem) {
    Object.assign(originalItem, {
      comment: '##DELETE_THIS_ITEM##',
      item_name: originalItem.title,
      category_name: originalItem.category_name,
      createdBy: window.storeDetails.username,
    });
    Object.assign(updateOldkotdata, { originalItem });
  }
  initUpdateOldKotItem(JSON.stringify(updateOldkotdata));
  $(`#olditem_${item.kot_item_id}`).prop('checked', false);
}

// function updateDiscounteditemsqty(currentQuantity, clickeditemDetails) {
//   let discount;
//   if (clickeditemDetails.constructor == 'test'.constructor) {
//     discount = safeParse(clickeditemDetails.discounted_items);
//   } else if (Array.isArray(clickeditemDetails.discounted_items)) {
//     discount = clickeditemDetails.discounted_items[0];
//   } else {
//     discount = clickeditemDetails.discounted_items;
//   }
//   const { on_qty, get_qty, item_id_list, percentage_off } = discount;
//   // const parts = Math.floor(currentQuantity / on_qty);
//   // const parts = Number(
//   //   (currentQuantity / on_qty).toFixed(window.ROUNDOFF_UPTO),
//   // );
//   const parts = Math.floor(currentQuantity / on_qty);
//   const discounteditemQty = parts * get_qty;
//   const itemidList = String(item_id_list).split(',');
//   const itemstoRemove = [];
//   window.currentoldkotDetails.items.forEach((item) => {
//     const originalItem = { ...item };
//     if (
//       itemidList.includes(`${item.item_id}`) &&
//       item.quantity !== discounteditemQty &&
//       item.discount_rate === percentage_off &&
//       item.kot_id === clickeditemDetails.kot_id &&
//       item.extra_details.baseItemRefId === clickeditemDetails.item_refid
//     ) {
//       // item.quantity = discounteditemQty;
//       if (discounteditemQty === 0) {
//         itemstoRemove.push(item.kot_item_id);
//       }
//       sendUpdateqtyrequest(discounteditemQty, item, originalItem);
//     }
//   });
//   if (itemstoRemove.length) {
//     window.currentoldkotDetails.items = filterkotItems(
//       window.currentoldkotDetails.items,
//       (item) => !itemstoRemove.includes(item.kot_item_id),
//     );
//   }
//   refreshOldkot(window.currentoldkotDetails.items);
// }

function updateDiscounteditemsqty(currentQuantity, clickeditemDetails) {
  let discount;
  if (clickeditemDetails.constructor == 'test'.constructor) {
    discount = safeParse(clickeditemDetails.discounted_items);
  } else if (Array.isArray(clickeditemDetails.discounted_items)) {
    discount = clickeditemDetails.discounted_items[0];
  } else {
    discount = clickeditemDetails.discounted_items;
  }
  const { on_qty, get_qty, item_id_list, percentage_off } = discount;
  const parts = Math.floor(currentQuantity / on_qty);
  const discounteditemQty = parts * get_qty;
  const itemidList = String(item_id_list).split(',');
  const itemstoRemove = [];
  window.currentoldkotDetails.items.forEach((item) => {
    if (
      itemidList.includes(`${item.item_id}`) &&
      item.discount_rate === percentage_off &&
      item.kot_id === clickeditemDetails.kot_id &&
      item.extra_details?.baseItemRefId === clickeditemDetails.item_refid
    ) {
      const originalItem = cloneDeep(item);
      const newQty = discounteditemQty;
      if (newQty === item.quantity) return;

      const $row = $(`#olditemrow_${item.kot_item_id}`);
      if ($row.length) {
        $row.find('.oldeditablekotQty').text(newQty);
        $row
          .find('td')
          .eq(2)
          .text(
            !item.isComplimentary
              ? Number((item.item_price * newQty).toFixed(window.ROUNDOFF_UPTO))
              : 0,
          );
      }

      if (askotpforoldkotcancelitem && newQty < originalItem.quantity) {
        pendingQtyChanges[item.kot_item_id] = {
          newQty,
          item,
          originalItem,
        };
      } else {
        // sendUpdateqtyrequest mutates item.quantity and item.amount internally
        sendUpdateqtyrequest(newQty, item, originalItem);
      }

      if (newQty === 0) {
        itemstoRemove.push(item.kot_item_id);
      }
    }
  });
  if (itemstoRemove.length) {
    window.currentoldkotDetails.items = filterkotItems(
      window.currentoldkotDetails.items,
      (item) => !itemstoRemove.includes(item.kot_item_id),
    );
    refreshOldkot(window.currentoldkotDetails.items);
  }
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function markasComplimentary() {
  const selectedItems = getCheckedItems(true, 2);
  if (selectedItems.length > 0) {
    selectedItems.forEach((item) => {
      Object.assign(item, { createdBy: storeDetails.username });

      item.isComplimentary = true;

      item.item_price = 0;
      item.sale_price = 0;
      item.price = 0;
      item.amount = 0;
    });
    const updateOldkotdata = {
      updateStatus: true,
      makeitemComplimentary: true,
      selectedItems,
      table_id: window.currentoldkotDetails.table_id,
    };
    const eventParams = {
      table_id,
      allitemsRemoved: false,
      message: `KOT Update for ${window.currentoldkotDetails.tableName}`,
    };

    Swal.fire({
      title: $.i18n.t('controller:oldKotController.updatingKOT'),
      text: $.i18n.t('controller:oldKotController.thisWillTakeASecond'),
      showConfirmButton: false,
      width: '23em',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: async () => {
        Swal.showLoading();
        initUpdateOldKotItem(JSON.stringify(updateOldkotdata));

        await sleep(500);
        setTimeout(() => {
          sendKotupdateddevent(eventParams);
        }, 2000);

        $('#oldbillTable')
          .find('input[type="checkbox"]')
          .prop('checked', false);

        selectedItems.forEach((selectedItem) => {
          $(`table#oldbillTable tr#olditemrow_${selectedItem.kot_item_id}`)
            .find('td')
            .eq(2)
            .html('0');
          window.currentoldkotDetails.items.forEach((item) => {
            if (item.kot_item_id == selectedItem.kot_item_id) {
              item.amount = 0;
            }
          });
        });

        Swal.close();
      },
      customClass: {
        popup: 'tmbill-swal-pop-up',
        title: 'tmbill-swal-title-class',
        content: 'tmbill-swal-title-class',
      },
    }).then(() => {});
  } else {
    notifyUser.showMessage(
      'error',
      $.i18n.t('controller:oldKotController.pleaseSelectSomeItems'),
    );
  }
}

function resetTableDetails(table_id) {
  if (window.showbillDetails) {
    try {
      $(`#table_${table_id}`).find('#tablebillnumberlabel').html('&nbsp');
      $(`#table_${table_id}`).find('#tableamountlabel').html('&nbsp');
      $(`#table_${table_id}`).find('#tableorderstatusLabel').html('&nbsp');
      $(`#table_${table_id}`).find('#tablekotnosLabelid').html('&nbsp');
      $(`#table_${table_id}`).find('#tableOrdernoLabelid').html('&nbsp');
      $(`#table_${table_id}`).find('#tablecustomernameLabelid').html('&nbsp');
      $(`#table_${table_id}`).find('#tableCreatedByLabelid').html('&nbsp');
      $(`#table_${table_id}`)
        .find('#tablekottimelabelId')
        .attr('title', '')
        .html('&nbsp');
      const table = window.allTableslist.find((t) => t.id === table_id);
      if (table) {
        table.table_customer_mobile = '';
      }
    } catch (error) {
      console.error(error);
    }
  }
}
function getkotIdOccurrence(arr, property) {
  const frequency = {};

  arr.forEach((obj) => {
    const key = obj[property];
    if (key !== undefined) {
      frequency[key] = (frequency[key] || 0) + 1;
    }
  });

  return frequency;
}

/**
 * Transfers the selected items to new table
 */
async function openTransferitempopup() {
  const selectedItems = getCheckedItems(true, 2);

  const cancelledItemsForPrint = [];

  selectedItems.forEach((item) => {
    const pending = pendingQtyChanges[item.kot_item_id];

    if (pending && pending.newQty !== undefined) {
      const originalQty = Number(pending.originalItem?.quantity);
      const newQty = Number(pending.newQty);

      //  LOG QTY COMPARISON
      console.log('STEP 3 qty compare', {
        kot_item_id: item.kot_item_id,
        originalQty,
        newQty,
      });

      // APPLY NEW QTY (your existing logic)
      item.quantity = newQty;

      if (!item.isComplimentary) {
        item.amount = Number(
          (item.item_price * item.quantity).toFixed(window.ROUNDOFF_UPTO),
        );
      } else {
        item.amount = 0;
      }

      //  MAIN LOGIC (THIS WAS MISSING)
      if (newQty < originalQty) {
        const cancelledQty = Number(
          (originalQty - newQty).toFixed(window.ROUNDOFF_UPTO),
        );

        console.log(' cancelledQty', cancelledQty);

        if (cancelledQty > 0) {
          cancelledItemsForPrint.push([
            {
              ...item,
              quantity: cancelledQty,
            },
          ]);
        }
      }
    } else {
      console.log(' no pending found for', item.kot_item_id);
    }
  });

  console.log(' cancelledItemsForPrint', cancelledItemsForPrint);
  if (
    window.currentoldkotDetails &&
    window.currentoldkotDetails.order_id &&
    selectedItems.length === window.currentoldkotDetails.items.length
  ) {
    window.notifyUser.showMessage('error', "Can't transfer all items");
    return;
  }
  if (selectedItems.length > 0) {
    const result = await showSelecttablepopup();
    if (result && result.value && result.value.destinationtable) {
      const { destinationtable, destinationtableSection } = result.value;
      const destinationTableName = result.value.destinationtableName;
      const isBarSection = result.value.destinationtableSection;
      const table = $(`#table_${destinationtable}`);

      const currentTable = $(`#table_${table_id}`);
      const currentTableSection =
        currentTable[0].data['mpos_department.section'];
      if (
        currentTableSection &&
        destinationtableSection &&
        window.storeDetails.is_bar_section_billing &&
        currentTableSection !== destinationtableSection
      ) {
        window.notifyUser.showMessage(
          'error',
          'Table section not matching with current table',
        );
        return;
      }

      let currenttableButton;
      const kotIDs = new Set();
      const kotId = getkotIdOccurrence(
        window.currentoldkotDetails.items,
        'kot_id',
      );
      let remote_order_id = '';
      selectedItems.forEach((item) => {
        if (
          item &&
          item.mpos_kot &&
          item.mpos_kot.remote_order_id &&
          item.mpos_kot.remote_order_id != '0'
        ) {
          remote_order_id = item.mpos_kot.remote_order_id;
        }
      });
      if (table && table.length) {
        currenttableButton = table[0];
        if (window.isMultipricingEnabled) {
          selectedItems.map(async (item) => {
            kotIDs.add(item.kot_id);
            let checkItemPricing = true;
            if (item.is_open_item) {
              checkItemPricing = false;
            }
            if (checkItemPricing) {
              const localItem = window.allItemsList.find(
                (o) => o.item_refid === item.item_refid,
              );
              Object.assign(item, { createdBy: window.storeDetails.username });
              let totoalOptionsAmount = 0;
              const pricestoAdd = [];
              if (item.addons && item.addons.length) {
                // after modifier selection item_price can change so get original price
                let posItem = window.allItemsList.find(
                  (p) => p.item_refid === item.item_id,
                );
                if (posItem) {
                  const { sale_price } = posItem;
                  item.item_price = sale_price;
                }
                for (let i = 0; i < item.addons.length; i++) {
                  const addon = item.addons[i];
                  let itemData;
                  itemData = window.optionsList.find(
                    (o) => o.ref_id === addon.option_ref_id,
                  );

                  if (!itemData) {
                    itemData = window.modifiersList.find(
                      (o) => o.item_id === addon.option_ref_id,
                    );
                  }

                  if (itemData) {
                    if (
                      (itemData?.sale_price_1 != 0 ||
                        itemData?.sale_price_2 !== 0 ||
                        itemData?.sale_price_3 !== 0 ||
                        itemData?.sale_price_4 !== 0 ||
                        itemData?.sale_price_5 !== 0) &&
                      window.multipricingSetting &&
                      window.multipricingSetting.table_department_wise
                    ) {
                      const itemPrice =
                        window.multipricingSetting.table_department_wise.find(
                          (o) =>
                            o.id ==
                            currenttableButton.data['mpos_department.id'],
                        );

                      if (itemPrice) {
                        const sale_price = itemData[itemPrice.price_field];

                        if (sale_price) {
                          // itemData = cloneDeep(itemData)
                          // btn = cloneDeep(btn)
                          addon.item_price = sale_price;
                          addon.sale_price = sale_price;
                          addon.option_price = sale_price;
                          addon.option_total = sale_price;

                          addon.amount = sale_price * item.quantity;
                          if (addon.option_type == 1) {
                            const addonPrice = addon.option_qty * sale_price;
                            item.item_price = localItem.sale_price + addonPrice;
                            item.amount = localItem.sale_price + addonPrice;
                          } else {
                            item.item_price = sale_price;
                            item.amount = sale_price;
                          }

                          // if(addon.)
                          if (
                            itemData &&
                            itemData.pricebeforeDiscount &&
                            itemData.discounted_rate
                          ) {
                            calculateDiscountForItem(itemData);
                          }
                        }
                      } else {
                        const { sale_price } = itemData;

                        if (sale_price) {
                          // itemData = cloneDeep(itemData)
                          // btn = cloneDeep(btn)
                          item.item_price = sale_price;
                          item.sale_price = sale_price;
                          item.amount = sale_price * item.quantity;
                          if (
                            itemData &&
                            itemData.pricebeforeDiscount &&
                            itemData.discounted_rate
                          ) {
                            calculateDiscountForItem(itemData);
                          }
                        }
                      }
                    }
                  }

                  // && !item.discounted_items
                  if (window.itemPricesMapping) {
                    const pricesData =
                      window.itemPricesMapping[addon.option_ref_id];
                    if (pricesData) {
                      let priceData;
                      switch (currenttableButton.data.order_type_flag) {
                        case 0:
                          priceData = pricesData.find(
                            (p) =>
                              p.ref ===
                              currenttableButton.data['mpos_department.id'],
                          );
                          break;

                        case 1:
                          priceData = pricesData.find(
                            (p) => p.ref === TAKEAWAY_BILLING_FLAG,
                          );
                          break;
                        case 2:
                          priceData = pricesData.find(
                            (p) => p.ref === HOMED_BILLING_FLAG,
                          );
                          break;
                        default:
                          break;
                      }
                      if (priceData) {
                        let sale_price = priceData.price;
                        if (priceData.extra_details) {
                          const extra_details = safeParse(
                            priceData.extra_details,
                          );
                          if (
                            extra_details &&
                            String(extra_details.price_for_modifier)
                          ) {
                            sale_price = extra_details.price_for_modifier;
                          }
                        }
                        if (String(sale_price)) {
                          if (String(sale_price)) {
                            addon.item_price = sale_price;
                            addon.sale_price = sale_price;
                            addon.option_price = sale_price;
                            addon.option_total = sale_price;

                            if (addon.option_type === 0) {
                              totoalOptionsAmount += addon.sale_price;
                              item.option_price = addon.sale_price;
                            }
                            if (
                              addon.extra_details &&
                              addon.option_type === 1 &&
                              addon.extra_details?.freeQty
                            ) {
                              if (addon.extra_details?.freeQty) {
                                const totalamt =
                                  addon.sale_price *
                                  (addon.option_qty || addon.qty);
                                let totalAmtToAdd = 0;
                                if (addon.qty < addon.extra_details.freeQty) {
                                  totalAmtToAdd = 0;
                                } else {
                                  totalAmtToAdd =
                                    totalamt -
                                    addon.sale_price *
                                      addon.extra_details.freeQty;
                                }
                                pricestoAdd.push(totalAmtToAdd);
                              } else {
                                pricestoAdd.push(
                                  addon.sale_price *
                                    (addon.option_qty || addon.qty),
                                );
                              }
                            } else if (addon.option_type === 1) {
                              pricestoAdd.push(
                                addon.sale_price *
                                  (addon.option_qty || addon.qty),
                              );
                            }
                            item.amount = item.item_price;
                            if (
                              item &&
                              item.pricebeforeDiscount &&
                              item.discount_rate
                            ) {
                              if (!item.sale_price && item.item_price) {
                                item.sale_price = item.item_price;
                              }
                              if (!item.sale_price && item.price) {
                                item.sale_price = item.price;
                              }
                              if (!item.sale_price && item.option_price) {
                                item.sale_price = item.option_price;
                              }
                              calculateDiscountForItem(item);
                            }
                          }
                        }
                      }
                    }
                  }
                }
                if (!totoalOptionsAmount) {
                  if (!posItem) {
                    posItem = window.allItemsList.find(
                      (p) => p.item_refid === item.item_refid,
                    );
                  }
                  if (posItem) {
                    // const newItem = checkforMultipricingbydept(
                    //   item,
                    //   currenttableButton.data['mpos_department.id'],
                    // );
                    let newItem;
                    switch (currenttableButton.data.order_type_flag) {
                      case 0:
                        newItem = checkforMultipricingbydept(
                          item,
                          currenttableButton.data['mpos_department.id'],
                        );
                        break;

                      case 1:
                        newItem = checkforMultipricing(
                          item,
                          TAKEAWAY_BILLING_FLAG,
                        );
                        break;
                      case 2:
                        newItem = checkforMultipricing(
                          item,
                          DELIVEROO_BILLING_FLAG,
                        );
                        break;
                      default:
                        break;
                    }
                    totoalOptionsAmount = newItem.item_price;
                    if (newItem.original_sale_price) {
                      totoalOptionsAmount = newItem.original_sale_price;
                    }

                    if (newItem && newItem.data && newItem.data.price) {
                      totoalOptionsAmount = newItem.data.price;
                    }
                  }
                }
                const finalPrice = pricestoAdd.reduce((a, b) => a + b, 0);
                const sale_price = totoalOptionsAmount + finalPrice;
                // item.item_price += Number(sale_price);
                // // item.amount = item.item_price + addonPrice;
                // item.amount = Number(sale_price * item.quantity).toFixed(
                //   window.ROUNDOFF_UPTO,
                // );
                item.sale_price = sale_price;
                item.item_price = sale_price;
                item.price = sale_price;
                item.amount = Number(
                  sale_price * item.quantity.toFixed(window.ROUNDOFF_UPTO),
                );
                item.recalculatedAmount = Number(
                  (sale_price * item.quantity).toFixed(window.ROUNDOFF_UPTO),
                );
                item.total = Number(
                  (sale_price * item.quantity).toFixed(window.ROUNDOFF_UPTO),
                );
                item.pricebeforeDiscount = sale_price;
                if (item.pricebeforeDiscount && item.discounted_price) {
                  calculateDiscountForItem(item);
                }
              } else {
                let itemData = window.allItemsList.find(
                  (o) => Number(o.item_refid) == Number(item.item_refid),
                );
                if (itemData && window.isMultipricingEnabled) {
                  if (
                    (itemData?.sale_price_1 !== 0 ||
                      itemData?.sale_price_2 !== 0 ||
                      itemData?.sale_price_3 !== 0 ||
                      itemData?.sale_price_4 !== 0 ||
                      itemData?.sale_price_5 !== 0) &&
                    item.item_price !== 0 &&
                    window.multipricingSetting &&
                    window.multipricingSetting.table_department_wise
                  ) {
                    const itemPrice =
                      window.multipricingSetting.table_department_wise.find(
                        (o) =>
                          o.id == currenttableButton.data['mpos_department.id'],
                      );

                    if (itemPrice) {
                      const sale_price = itemData[itemPrice.price_field];

                      if (sale_price) {
                        // itemData = cloneDeep(itemData)
                        // btn = cloneDeep(btn)
                        item.item_price = sale_price;
                        item.sale_price = sale_price;
                        item.amount = sale_price * item.quantity;
                        if (
                          itemData &&
                          itemData.pricebeforeDiscount &&
                          itemData.discounted_rate
                        ) {
                          calculateDiscountForItem(itemData);
                        }
                      }
                    } else {
                      const { sale_price } = itemData;

                      if (sale_price) {
                        // itemData = cloneDeep(itemData)
                        // btn = cloneDeep(btn)
                        item.item_price = sale_price;
                        item.sale_price = sale_price;
                        item.amount = sale_price * item.quantity;
                        if (
                          itemData &&
                          itemData.pricebeforeDiscount &&
                          itemData.discounted_rate
                        ) {
                          calculateDiscountForItem(itemData);
                        }
                      }
                    }
                  }
                  let checkMultipricing = true;
                  if (
                    item &&
                    item.extra_details &&
                    item.extra_details.isBOGOItem
                  ) {
                    checkMultipricing = false;
                  }
                  if (
                    window.itemPricesMapping &&
                    window.isMultipricingEnabled &&
                    !itemData.discounted_items &&
                    checkMultipricing
                  ) {
                    const pricesData =
                      window.itemPricesMapping[itemData.item_refid];

                    if (pricesData) {
                      let priceData;
                      switch (currenttableButton.data.order_type_flag) {
                        case 0:
                          priceData = pricesData.find(
                            (p) =>
                              p.ref ===
                              currenttableButton.data['mpos_department.id'],
                          );
                          break;

                        case 1:
                          priceData = pricesData.find(
                            (p) => p.ref === TAKEAWAY_BILLING_FLAG,
                          );
                          break;
                        case 2:
                          priceData = pricesData.find(
                            (p) => p.ref === HOMED_BILLING_FLAG,
                          );
                          break;
                        default:
                          break;
                      }
                      if (priceData && item.item_price !== 0) {
                        const sale_price = priceData.price;
                        if (sale_price) {
                          if (sale_price) {
                            // itemData = cloneDeep(itemData)
                            // btn = cloneDeep(btn)
                            item.item_price = sale_price;
                            item.sale_price = sale_price;
                            item.amount = sale_price * item.quantity;
                            if (
                              item &&
                              item.pricebeforeDiscount &&
                              (item.discounted_rate || item.discount_rate)
                            ) {
                              calculateDiscountForItem(item);
                            }
                          }
                        }
                      } else {
                        const posItem = window.allItemsList.find(
                          (p) => p.item_refid === item.item_refid,
                        );
                        if (posItem) {
                          let { sale_price } = posItem;

                          const { discounted_price } = posItem;
                          if (discounted_price) {
                            sale_price = discounted_price;
                          }
                          if (sale_price) {
                            item.item_price = sale_price;
                            item.sale_price = sale_price;
                            item.amount = sale_price * item.quantity;
                            if (
                              item &&
                              item.pricebeforeDiscount &&
                              item.discounted_rate
                            ) {
                              calculateDiscountForItem(item);
                            }
                          }
                        }
                      }
                      // To make sure discount on item level do not go in minus
                      // if (itemData.pricebeforeDiscount !== itemData.sale_price) {
                      //   itemData.pricebeforeDiscount = itemData.sale_price;
                      // }
                    } else {
                      const posItem = window.allItemsList.find(
                        (p) => p.item_refid === item.item_refid,
                      );
                      if (posItem) {
                        let { sale_price } = posItem;
                        const { discounted_price } = posItem;
                        if (discounted_price) {
                          sale_price = discounted_price;
                        }
                        if (sale_price) {
                          item.item_price = sale_price;
                          item.sale_price = sale_price;
                          item.amount = sale_price * item.quantity;
                          if (
                            item &&
                            item.pricebeforeDiscount &&
                            item.discounted_rate
                          ) {
                            calculateDiscountForItem(item);
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          });
        }
      }
      const dest_table_dept = currenttableButton.data['mpos_department.id'];
      let billing_type;
      if (dest_table_dept === 987654) {
        billing_type = 2;
      } else {
        billing_type = 1;
      }
      const data = {
        currentTable: table_id,
        selectedItems,
        destinationtable,
        destinationTableName,
        currentKOTtotal,
        newKOTtotal,
        createdBy:
          currentoldkotDetails.createdBy || window.storeDetails.username,
        user_id: window.storeDetails.username,
        store_id: window.storeDetails.store_id,
        table_color: '#0095d7',
        table_action_flag: 1,
        isBarSection,
        // billing_type: selectedItems[0].mpos_kot.billing_type,
        billing_type,
        status: selectedItems[0].mpos_kot?.status,
        remote_order_id,
        note: selectedItems[0].mpos_kot?.note,
      };

      showLoader({
        title: 'Transferring KOT',
        text: $.i18n.t('controller:orderController.pleaseWait'),
      });

      initTransferOldKot(JSON.stringify(data)).then((transferKotResult) => {
          __isCancelAfterOTP = true;
        if (Swal.isVisible()) Swal.close();

        if (transferKotResult && transferKotResult.kot_number[0].kot_number) {
          transferKotNumber = transferKotResult.kot_number[0].kot_number;
          if (Swal.isVisible()) Swal.close();
        }

        $(`#table_${destinationtable}`).css({
          'background-color': '#0095d7',
        });

        oldkotUpdated = false;
        printoldKOT(
          TRANSFER_KOT_ITEM,
          destinationTableName,
          undefined,
          transferKotResult.extra_details,
        );
        console.log(
          'STEP 4  Before pushing cancelled items',
          cancelledItemsForPrint,
        );

        if (cancelledItemsForPrint.length) {
          cancelledKotItems.push(...cancelledItemsForPrint);
        }

        console.log('STEP 4 FINAL  cancelledKotItems', cancelledKotItems);
        selectedItems.forEach((item) => {
          $(`table#oldbillTable tr#olditemrow_${item.kot_item_id}`).remove();
          const index = window.currentoldkotDetails.items.indexOf(item);
          if (index > -1) {
            window.currentoldkotDetails.items.splice(index, 1);
          }
        });
        // selectedItems.forEach((item) => {
        //   if (pendingQtyChanges[item.kot_item_id]) {
        //     delete pendingQtyChanges[item.kot_item_id];
        //   }
        // });
        selectedItems.forEach((item) => {
          const pending = pendingQtyChanges[item.kot_item_id];

          if (pending && pending.newQty !== undefined) {
            item.quantity = pending.newQty;

            delete pendingQtyChanges[item.kot_item_id];
          }
        });
        $('#oldbillTable tbody tr td input.reasonField').val('');

        let allitemsRemoved = false;
        let transferredallItems = false;
        let order_type;
        if ($('#oldbillTable tbody tr').length == 0) {
          initSetInactiveKot(
            JSON.stringify({
              table_id,
              deleteTable: false,
            }),
          );
          const data = $(`#table_${table_id}`).prop('data');
          order_type = data.order_type_flag;
          if (data) {
            data.details.items = [];
            if (
              [TAKEAWAY_FLAG_ID, HOMED_FLAG_ID].includes(data.order_type_flag)
            ) {
              makeDeleteTableRequest({ table_id });
              $(`#table_${table_id}`).remove();
              removeTableFromSuggestions(window.currentoldkotDetails.tableName);
              window.initNewOrderFromRemote();
              const table_index = window.tableName_suggestions.indexOf(
                data.table_name,
              );
              if (table_index > -1) {
                window.tableName_suggestions.splice(table_index, 1);
              }
            }
          }
          allitemsRemoved = true;
          transferredallItems = true;
        }

        const selectedKotId = getkotIdOccurrence(selectedItems, 'kot_id');

        const commonKeys = Object.keys(kotId).filter(
          (key) => key in selectedKotId,
        );
        const allItemstransferredKots = {};
        commonKeys.forEach((key) => {
          allItemstransferredKots[key] = kotId[key] === selectedKotId[key];
        });

        const eventParams = {
          table_id,
          allitemsRemoved,
          transferredallItems,
          transferItem: true,
          destinationtable,
          message: `KOT Update for ${window.currentoldkotDetails.tableName}`,
          createdAt: selectedItems[0].mpos_kot.actual_in_time,
          order_type,
          destination_kot_id: transferKotResult.kot_id,
          status: selectedItems[0].mpos_kot?.status,
          kot_number: transferKotNumber,
          allItemstransferredKots,
        };
        if (kotIDs) {
          const resultArray = [...kotIDs];
          Object.assign(eventParams, { kot_id: resultArray });
        }
        sendItemTransferredevent(eventParams);

        if (allitemsRemoved) {
          if (showTimeOnTable) {
            removetablefromwathersList(`table_${table_id}`);
          }
          resetTableDetails(table_id);
          const activeTableDept = $(
            '.activeTableDepartment .menuItemButtoncontentwrapper .department-title-container',
          ).attr('value');
          if (activeTableDept === 'Running Orders') {
            $(`#table_${table_id}`).hide();
          }
          const currenttable = $(`#table_${table_id}`);

          if (
            currenttable &&
            currenttable.length &&
            Array.isArray(currenttable)
          ) {
            currenttable[0].data.details.order_state = '';
            window.resetCurrenttableDataFromRemot();
          }
          $(`#table_${destinationtable}`).click();
        }

        setTimeout(() => {
          sendKotupdateddevent(eventParams);
        }, 2000);
      });
    }
  } else {
    notifyUser.showMessage(
      'error',
      $.i18n.t('controller:oldKotController.pleaseSelectSomeItems'),
    );
  }
}

async function showSelecttablepopup() {
  let destinationtable;
  let destinationtableName;
  let destinationtableSection;
  const result = await Swal.fire({
    title: $.i18n.t('controller:oldKotController.enterTableName'),
    text: $.i18n.t(
      'controller:oldKotController.selectedItemsWillBeShiftedToSelectedTable',
    ),
    html: `<input type="text" placeholder=${$.i18n.t(
      'controller:swalDataTranslations.Entertablename',
    )} class="transferTablename w-75">`,
    didOpen: async () => {
      await addTablenamesuggestions(
        '#swal2-html-container input.transferTablename',
      );
    },
    focusConfirm: false,
    width: '23em',
    customClass: {
      popup: 'tmbill-swal-pop-up',
      input: 'tmbill-swal-input',
      actions: 'oldkot-swal-action',
    },
    allowOutsideClick: () => !Swal.isLoading(),
    allowEscapeKey: () => !Swal.isLoading(),
    showCancelButton: true,
    width: '23em',
    async preConfirm() {
      const inputTable = $(
        '#swal2-html-container input.transferTablename',
      ).val();

      if (inputTable && currentoldkotDetails.tables.includes(inputTable)) {
        const foundTable = $(`#tablesContainer button[name="${inputTable}"]`);
        if (foundTable.length > 0) {
          destinationtable = foundTable[0].data.id;
          destinationtableName = foundTable[0].data.table_name;
          destinationtableSection =
            foundTable[0].data['mpos_department.section'];
          if (
            foundTable[0].data.details.bill_number &&
            !window.allowModifyBill
          ) {
            Swal.showValidationMessage(
              $.i18n.t('controller:oldKotController.cannotModifySavedBill'),
            );
            return false;
          }

          if (destinationtable === table_id) {
            Swal.showValidationMessage(
              $.i18n.t('controller:oldKotController.cannotTransferToSameTable'),
            );
            return false;
          }
          const currentTable = $(`#table_${table_id}`);
          const currentTableSection =
            currentTable[0].data['mpos_department.section'];
          if (
            currentTableSection &&
            destinationtableSection &&
            currentTableSection !== destinationtableSection
          ) {
            Swal.showValidationMessage(
              'Table section not matching with current table',
            );
            return false;
          }
          return {
            destinationtable,
            destinationtableName,
            destinationtableSection,
          };
        }
      }
      Swal.showValidationMessage(
        $.i18n.t('controller:oldKotController.invalidTableName'),
      );
      return false;
    },
  });
  return result;
}

async function addTablenamesuggestions(elementId) {
  $(elementId).autocomplete({
    source(req, response) {
      const sourceData = [];
      const re = $.ui.autocomplete.escapeRegex(req.term);
      currentoldkotDetails.tables.forEach((tableName) => {
        if (String(tableName).toLowerCase().includes(re.toLowerCase())) {
          sourceData.push({
            label: tableName,
            value: tableName,
          });
        }
      });
      response(sourceData);
    },
    appendTo: '#swal2-html-container',
    classes: {
      'ui-autocomplete': 'autocomplete-to-front ',
    },
    select(event, ui) {
      $(elementId).val(ui.item.value);
    },
  });
}

$('#oldkotModal').on('hidden.bs.modal', () => {
  window.__originalQtyMap = {};
if (
  askotpforoldkotcancelitem &&
  !__isCancelAfterOTP &&
  (
    !__cancelledItemsBackupForPrint ||
    __cancelledItemsBackupForPrint.length === 0 ||
    Object.keys(window.__originalQtyMap || {}).length > 0 
  )
) {
  console.log(" Skipping print (OTP not confirmed)");
  window.cancelledKotItems = [];
  __cancelledItemsBackupForPrint = [];
}
  const itemsToPrint =
    (window.cancelledKotItems && window.cancelledKotItems.length
      ? window.cancelledKotItems
      : __cancelledItemsBackupForPrint) || [];


  console.log('FINAL PRINT CHECK', itemsToPrint);
  console.log(" FINAL cancelledKotItems", JSON.stringify(window.cancelledKotItems));
  console.log(" FINAL backup", JSON.stringify(__cancelledItemsBackupForPrint));
  if (itemsToPrint.length) {
    console.log(" FINAL PRINT DATA", itemsToPrint);
    printoldKOT(5, '', itemsToPrint);
    window.cancelledKotItems = [];
    __cancelledItemsBackupForPrint = [];
  }
  updatedItemslist = {};
  $('#canceloldkotButton').data('kot_number', '');
});

Initialize();

window.loadoldKOTItems = async function (details) {
  loadoldItems(details);
};
