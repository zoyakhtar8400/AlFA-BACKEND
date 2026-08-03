const { debounce } = require('lodash');
const Mousetrap = require('mousetrap');
const {
  DINEIN_TAB_ID,
  TAKEAWAY_TAB_ID,
  QUICK_TAB_ID,
  DELIVERY_TAB_ID,
} = require('../../util/Constants');
const { SHORTCUTS } = require('../../util/SettingIDs');
const { MISC_IPC } = require('../../util/IPC_Messages');
const { OrderState } = require('../../util/DBUtil');

const mousetrap = new Mousetrap();
Mousetrap.prototype.stopCallback = function (e, element, combo) {
  return false;
};

let mousetrapInitialized;

function checkElementavailable(selector) {
  return $(selector).is(':visible') && !$(selector).prop('disabled');
}

async function settleBillshortcut(e) {
  const activeTab = $('.mainsectionTabs li a.active').attr('id');

  const isDiscountModalOpen = $('#discountModalid').is(':visible');
  const isChargesModalOpen = $('#billchargesModal').is(':visible');

  if (
    activeTab &&
    !isDiscountModalOpen &&
    !isChargesModalOpen &&
    $('.modal.show').length === 0
  ) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
        if ($('#settlebillButton').length) $('#settlebillButton').click();
        break;

      case TAKEAWAY_TAB_ID:
        if ($('#takeawaysettlebillButton').length)
          $('#takeawaysettlebillButton').click();
        break;

      case DELIVERY_TAB_ID:
        if ($('#deliverysettlebillButton').length)
          $('#deliverysettlebillButton').click();
        break;

      case QUICK_TAB_ID:
        if ($('#quickbillsettleButton').length)
          $('#quickbillsettleButton').click();
        break;
    }
  }
}

function saveBillshortcut() {
  if (
    window.validateCustomerBeforeSaveOrPrint &&
    !window.validateCustomerBeforeSaveOrPrint()
  ) {
    return;
  }

  const activeTab = $('.mainsectionTabs li a.active').attr('id');
  const isVisible = $('#tablesParentdivclassid').is(':visible');

  const isDiscountModalOpen = $('#discountModalid').is(':visible');
  const isChargesModalOpen = $('#billchargesModal').is(':visible');

  if (
    activeTab &&
    isVisible &&
    window.currentoldkotDetails === undefined &&
    !isDiscountModalOpen &&
    !isChargesModalOpen
  ) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
        if ($('#kottabID').hasClass('active')) {
          if ($('#savekotButton').is(':visible')) $('#savekotButton').click();
          return;
        }
        if ($('#saveBillbutton').is(':visible')) $('#saveBillbutton').click();
        break;

      case TAKEAWAY_TAB_ID:
        if ($('#takeawaykotTab').hasClass('active')) {
          if ($('#takeawaysavekotButton').is(':visible'))
            $('#takeawaysavekotButton').click();
          return;
        }
        if ($('#savetakeawayBillbutton').is(':visible'))
          $('#savetakeawayBillbutton').click();
        break;

      case DELIVERY_TAB_ID:
        if ($('#deliverykotTab').hasClass('active')) {
          if ($('#deliverysavekotButton').is(':visible'))
            $('#deliverysavekotButton').click();
          return;
        }
        if ($('#savedeliveryBillbutton').is(':visible'))
          $('#savedeliveryBillbutton').click();
        break;

      case QUICK_TAB_ID:
        if ($('#quickbillsettleButton').is(':visible'))
          $('#quickbillsettleButton').click();
        break;

      default:
        break;
    }
  }
}

/**
 * Adds shortcut listener to components in order window.
 */
async function addShortcutKeylisteners(
  shortcuts,
  { toggleMaintabs, toggleitemtableView },
) {
  const forcedSearchShortcut =
    process.platform === 'darwin' ? 'command+g' : 'ctrl+g';

  // Override runtime shortcut value (so DB value doesn't matter)
  if (shortcuts[SHORTCUTS.SEARCH_BY_NAME - 1]) {
    shortcuts[SHORTCUTS.SEARCH_BY_NAME - 1].value = forcedSearchShortcut;
  }

  mousetrap.bind(shortcuts[SHORTCUTS.PRINT_N_SAVE - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    const isVisible = $('#tablesParentdivclassid').is(':visible');
    if (activeTab && isVisible && $('.modal.show').length === 0) {
      switch (activeTab) {
        case DINEIN_TAB_ID:
          if ($('#kottabID').hasClass('active')) {
            if ($('#print_n_savekotButton').is(':visible'))
              $('#print_n_savekotButton').click();
            return;
          }
          if ($('#print_n_savebillButton').is(':visible'))
            $('#print_n_savebillButton').click();
          break;
        case TAKEAWAY_TAB_ID:
          if ($('#takeawaykotTab').hasClass('active')) {
            $('#takeawayprint_n_savekotButton').click();
            return;
          }
          if ($('#print_n_savetakeawayBillbutton').is(':visible'))
            $('#print_n_savetakeawayBillbutton').click();
          break;
        case DELIVERY_TAB_ID:
          if ($('#deliverykotTab').hasClass('active')) {
            $('#deliveryprint_n_savekotButton').click();
            return;
          }
          if ($('#print_n_savedeliveryBillbutton').is(':visible'))
            $('#print_n_savedeliveryBillbutton').click();
          break;
        default:
          break;
      }
    }
    if (window.receiptsWindowloaded) {
      const isreceiptVisible = $('#receiptwindowWrapperid').is(':visible');
      if (isreceiptVisible && $('#receiptprintButton').is(':visible')) {
        $('#receiptprintButton').click();
      }
    }
  });

  mousetrap.bind(forcedSearchShortcut, function (e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const input = document.getElementById('searchByname_item');

    if (input && input.offsetParent !== null) {
      input.focus();
      input.select();
    }
  });

  mousetrap.bind(
    shortcuts[SHORTCUTS.TAKE_NEW_ORDER - 1].value,
    cycleNewOrderProperly,
  );

  if (shortcuts[SHORTCUTS.SWITCH_ITEMTABLE_VIEW - 1]) {
    mousetrap.bind(shortcuts[SHORTCUTS.SWITCH_ITEMTABLE_VIEW - 1].value, () => {
      toggleitemtableView();
    });
  }

  mousetrap.bind(shortcuts[SHORTCUTS.FOCUS_KOTOTE - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    const isVisible = $('#tablesParentdivclassid').is(':visible');
    if (activeTab && isVisible) {
      switch (activeTab) {
        case DINEIN_TAB_ID:
          if ($('#kotnoteField').is(':visible')) $('#kotnoteField').focus();
          break;
        case TAKEAWAY_TAB_ID:
          if ($('#takeawaykotnoteField').is(':visible'))
            $('#takeawaykotnoteField').focus();
          break;
        case DELIVERY_TAB_ID:
          if ($('#deliverykotnoteField').is(':visible'))
            $('#deliverykotnoteField').focus();
          break;
        case QUICK_TAB_ID:
          if ($('#quickbillkotnoteField').is(':visible'))
            $('#quickbillkotnoteField').focus();
          break;
        default:
          break;
      }
    }
  });

  mousetrap.bind(shortcuts[SHORTCUTS.SEARCH_BY_CODE - 1].value, () => {
    $('#searchitembyCode').focus();
  });

  mousetrap.bind(
    shortcuts[SHORTCUTS.SETTLE_BILL - 1].value,
    settleBillshortcut,
  );

  mousetrap.bind(
    shortcuts[SHORTCUTS.SAVE_BILL - 1].value,
    debounce(saveBillshortcut, 300),
  );

  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_PAYMENT - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    const isVisible = $('#tablesParentdivclassid').is(':visible');
    if (activeTab && isVisible) {
      switch (activeTab) {
        case DINEIN_TAB_ID:
          if ($('#paymentButton2').is(':visible')) $('#paymentButton2').click();
          break;
        case TAKEAWAY_TAB_ID:
          if ($('#takeawaypaymentButton2').is(':visible'))
            $('#takeawaypaymentButton2').click();
          break;
        case DELIVERY_TAB_ID:
          if ($('#deliverypaymentButton2').is(':visible'))
            $('#deliverypaymentButton2').click();
          break;
        case QUICK_TAB_ID:
          if ($('#quickpaymentButton2').is(':visible'))
            $('#quickpaymentButton2').click();
          break;
        default:
          break;
      }
    }
  });

  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_CHARGES - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    const isVisible = $('#tablesParentdivclassid').is(':visible');
    if (activeTab && isVisible) {
      switch (activeTab) {
        case DINEIN_TAB_ID:
          if ($('#chargesButton').is(':visible')) $('#chargesButton').click();
          break;
        case TAKEAWAY_TAB_ID:
          if ($('#takeawaychargesButton').is(':visible'))
            $('#takeawaychargesButton').click();
          break;
        case DELIVERY_TAB_ID:
          if ($('#deliverychargesButton').is(':visible'))
            $('#deliverychargesButton').click();
          break;
        case QUICK_TAB_ID:
          if ($('#quickchargesButton').is(':visible'))
            $('#quickchargesButton').click();
          break;
        default:
          break;
      }
    }
  });

  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_DISCOUNT - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    const isVisible = $('#tablesParentdivclassid').is(':visible');
    if (activeTab && isVisible) {
      switch (activeTab) {
        case DINEIN_TAB_ID:
          if ($('#discountButton').is(':visible')) $('#discountButton').click();
          break;
        case TAKEAWAY_TAB_ID:
          if ($('#takeawaydiscountButton').is(':visible'))
            $('#takeawaydiscountButton').click();
          break;
        case DELIVERY_TAB_ID:
          if ($('#deliverydiscountButton').is(':visible'))
            $('#deliverydiscountButton').click();
          break;
        case QUICK_TAB_ID:
          if ($('#quickdiscountButton').is(':visible'))
            $('#quickdiscountButton').click();
          break;
        default:
          break;
      }
    }
  });

  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_BILLSTATUS - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    const isVisible = $('#tablesParentdivclassid').is(':visible');
    if (activeTab && isVisible) {
      switch (activeTab) {
        case DINEIN_TAB_ID:
          if ($('#billstatusButton').is(':visible')) {
            $('#billstatusButton').click();
          }

          break;
        case TAKEAWAY_TAB_ID:
          if ($('#takeawaybillstatusButton').is(':visible')) {
            $('#takeawaybillstatusButton').click();
          }
          break;
        case DELIVERY_TAB_ID:
          if ($('#deliverybillstatusButton').is(':visible')) {
            $('#deliverybillstatusButton').click();
          }
          break;
        default:
          break;
      }
    }
  });
  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_PREVIEW - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    const isVisible = $('#tablesParentdivclassid').is(':visible');
    if (activeTab && isVisible) {
      switch (activeTab) {
        case DINEIN_TAB_ID:
          if ($('#previewButton').is(':visible')) $('#previewButton').click();
          break;
        case TAKEAWAY_TAB_ID:
          if ($('#takeawaypreviewButton').is(':visible'))
            $('#takeawaypreviewButton').click();
          break;
        case DELIVERY_TAB_ID:
          if ($('#deliverypreviewButton').is(':visible'))
            $('#deliverypreviewButton').click();
          break;
        case QUICK_TAB_ID:
          if ($('#quickpreviewButton').is(':visible'))
            $('#quickpreviewButton').click();
          break;
        default:
          break;
      }
    }

    if (window.receiptsWindowloaded) {
      const isreceiptVisible = $('#receiptwindowWrapperid').is(':visible');
      if (isreceiptVisible && $('#previewreceiptbillButton').is(':visible')) {
        $('#previewreceiptbillButton').click();
      }
    }
  });

  mousetrap.bind(shortcuts[SHORTCUTS.DRAFT_PRINT - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    const isVisible = $('#tablesParentdivclassid').is(':visible');
    if (activeTab && isVisible) {
      switch (activeTab) {
        case DINEIN_TAB_ID:
          if ($('#draftprintButton').is(':visible'))
            $('#draftprintButton').click();
          break;
        case TAKEAWAY_TAB_ID:
          if ($('#takeawaydraftprintButton').is(':visible'))
            $('#takeawaydraftprintButton').click();
          break;
        case DELIVERY_TAB_ID:
          if ($('#deliverydraftprintButton').is(':visible'))
            $('#deliverydraftprintButton').click();
          break;
        default:
          break;
      }
    }
  });

  mousetrap.bind(shortcuts[SHORTCUTS.CANCEL_BILL - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    const isVisible = $('#tablesParentdivclassid').is(':visible');
    if (activeTab && isVisible) {
      switch (activeTab) {
        case DINEIN_TAB_ID:
          if ($('#billstatusButton').is(':visible')) {
            window.settleBillFromRemote(OrderState.CANCELLED);
          }
          break;
        case TAKEAWAY_TAB_ID:
          if ($('#takeawaybillstatusButton').is(':visible')) {
            window.settleBillFromRemote(OrderState.CANCELLED);
          }
          break;
        case DELIVERY_TAB_ID:
          if ($('#deliverybillstatusButton').is(':visible')) {
            window.settleBillFromRemote(OrderState.CANCELLED);
          }
          break;
        default:
          break;
      }
    }
  });

  mousetrap.bind(shortcuts[SHORTCUTS.FREE_BILL - 1].value, () => {
    const isVisible = $('#tablesParentdivclassid').is(':visible');
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    if (activeTab && isVisible) {
      switch (activeTab) {
        case DINEIN_TAB_ID:
          if ($('#billstatusButton').is(':visible')) {
            window.settleBillFromRemote(OrderState.FREE);
          }
          break;
        case TAKEAWAY_TAB_ID:
          if ($('#takeawaybillstatusButton').is(':visible')) {
            window.settleBillFromRemote(OrderState.FREE);
          }
          break;
        case DELIVERY_TAB_ID:
          if ($('#deliverybillstatusButton').is(':visible')) {
            window.settleBillFromRemote(OrderState.FREE);
          }
          break;
        default:
          break;
      }
    }
  });

  mousetrap.bind(shortcuts[SHORTCUTS.SEARCH_TABLE - 1].value, () => {
    const isVisible = $('#tablesParentdivclassid').is(':visible');
    if (isVisible) {
      $('#searchTablebyname').focus();
    }
  });

  mousetrap.bind(
    shortcuts[SHORTCUTS.OPEN_ONLINE_ORDER_WINDOW - 1].value,
    () => {
      const isVisible = $('#digitalOrdersIcon').is(':visible');
      if (isVisible) {
        $('#digitalOrdersIcon').click();
      }
    },
  );

  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_ADDCUSTOMER - 1].value, () => {
    const isVisible = $('#tablesParentdivclassid').is(':visible');
    if (isVisible && $('.modal.show').length === 0) {
      $('#openCustomerbtn').click();
    }
  });

  mousetrap.bind(shortcuts[SHORTCUTS.CHANGE_TABLE - 1].value, () => {
    const isVisible = $('#tablesParentdivclassid').is(':visible');
    if (isVisible && $('#changeTablebutton').is(':visible')) {
      $('#changeTablebutton').click();
    }
  });

  mousetrap.bind(shortcuts[SHORTCUTS.RELOAD_APP - 1].value, () => {
    window.remote.getCurrentWebContents().reload();
  });

  /**
   * Main Navigation shortcuts
   */
  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_ORDER_WINDOW - 1].value, () => {
    if ($('#orderIcon').is(':visible')) $('#orderIcon').click();
  });
  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_RECEIPT_WINDOW - 1].value, () => {
    if ($('#receiptIcon').is(':visible')) $('#receiptIcon').click();
  });
  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_REPORTS - 1].value, () => {
    if ($('#allreportsIcon').is(':visible')) $('#allreportsIcon').click();
  });
  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_MASTERS - 1].value, () => {
    if ($('#menuManagementIcon').is(':visible'))
      $('#menuManagementIcon').click();
  });

  // mousetrap.bind(shortcuts[SHORTCUTS.OPEN_ONLINEORDER_WINDOW - 1].value, () => {
  //   if ($('#onlineorderIcon').is(':visible')) $('#onlineorderIcon').click();
  // });

  mousetrap.bind(shortcuts[SHORTCUTS.LOGOUT - 1].value, () => {
    $('#logoutIcon').click();
  });
  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_SETTINGS - 1].value, () => {
    if ($('#settingsButton').is(':visible'))
      window.openwindowFromremote('settings');
  });

  /**
   * Old KOT Shortcut
   */
  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_OLDKOT - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    const isVisible = $('#tablesParentdivclassid').is(':visible');
    if (activeTab && isVisible) {
      switch (activeTab) {
        case DINEIN_TAB_ID:
          if ($('#oldkotButton').is(':visible')) $('#oldkotButton').click();
          break;
        case TAKEAWAY_TAB_ID:
          if ($('#takeawayoldkotButton').is(':visible'))
            $('#takeawayoldkotButton').click();
          break;
        case DELIVERY_TAB_ID:
          if ($('#deliveryoldkotButton').is(':visible'))
            $('#deliveryoldkotButton').click();
          break;
        default:
          break;
      }
    }
  });

  /**
   * Load Menu
   */
  mousetrap.bind(shortcuts[SHORTCUTS.LOAD_MENU - 1].value, () => {
    if ($('#syncButton').is(':visible')) $('#syncButton').click();
  });
  mousetrap.bind(shortcuts[SHORTCUTS.CUSTOMER_HISTORY - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    const isVisible = $('#tablesParentdivclassid').is(':visible');
    if (activeTab && isVisible) {
      switch (activeTab) {
        case DINEIN_TAB_ID:
          if ($('#customerhistoryButton').is(':visible'))
            $('#customerhistoryButton').click();
          break;
        case TAKEAWAY_TAB_ID:
          if ($('#takeawaycustomerhistoryButton').is(':visible'))
            $('#takeawaycustomerhistoryButton').click();
          break;
        case DELIVERY_TAB_ID:
          if ($('#deliverycustomerhistoryButton').is(':visible'))
            $('#deliverycustomerhistoryButton').click();
          break;
        case QUICK_TAB_ID:
          if ($('#quickcustomerhistoryButton').is(':visible'))
            $('#quickcustomerhistoryButton').click();
          break;
        default:
          break;
      }
    }
  });

  mousetrap.bind(
    shortcuts[SHORTCUTS.TOGGLE_MAINTABS - 1].value,
    debounce(toggleMaintabs, 200),
  );

  mousetrap.bind(shortcuts[SHORTCUTS.SWITCH_STORE - 1].value, () => {
    if ($('#changeStoreicon').is(':visible')) $('#changeStoreicon').click();
  });

  mousetrap.bind('down', () => {
    if (window.traverseTable) window.traverseTable('down');
  });
  mousetrap.bind('up', () => {
    if (window.traverseTable) window.traverseTable('up');
  });

  mousetrap.bind(shortcuts[SHORTCUTS.EDIT_BILL - 1].value, () => {
    if (window.receiptsWindowloaded) {
      const isreceiptVisible = $('#receiptwindowWrapperid').is(':visible');
      if (isreceiptVisible && $('#editbillButton').is(':visible')) {
        $('#editbillButton').click();
      }
    }
  });

  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_PREORDER_FORM - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    if (activeTab && activeTab === TAKEAWAY_TAB_ID) {
      if ($('#takeawaypreorderformButton').is(':visible'))
        $('#takeawaypreorderformButton').click();
    }

    if (activeTab && activeTab === DELIVERY_TAB_ID) {
      if ($('#deliverypreorderformButton').is(':visible'))
        $('#deliverypreorderformButton').click();
    }
  });

  // shortcut for loyalty window
  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_LOYALTY_WINDOW - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    switch (activeTab) {
      case DINEIN_TAB_ID:
        if ($('#dineinrewardsButton').is(':visible'))
          $('#dineinrewardsButton').click();
        break;
      case TAKEAWAY_TAB_ID:
        if ($('#tdhdrewardsButton').is(':visible'))
          $('#tdhdrewardsButton').click();
        break;
      case DELIVERY_TAB_ID:
        if ($('#deliveryrewardsButton').is(':visible'))
          $('#deliveryrewardsButton').click();
        break;
      case QUICK_TAB_ID:
        if ($('#quickbillrewardsButton').is(':visible'))
          $('#quickbillrewardsButton').click();
        break;
      default:
        break;
    }
  });

  // open waiter window
  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_WAITER_WINDOW - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    switch (activeTab) {
      case DINEIN_TAB_ID:
        if ($('#selectdineinWaiterbutton').is(':visible'))
          $('#selectdineinWaiterbutton').click();
        break;
      case TAKEAWAY_TAB_ID:
        if ($('#selecttakeawayWaiterbutton').is(':visible'))
          $('#selecttakeawayWaiterbutton').click();
        break;
      case DELIVERY_TAB_ID:
        if ($('#selectdeliveryWaiterbutton').is(':visible'))
          $('#selectdeliveryWaiterbutton').click();
        break;
      case QUICK_TAB_ID:
        if ($('#selectquickWaiterbutton').is(':visible'))
          $('#selectquickWaiterbutton').click();
        break;
      default:
        break;
    }
  });

  // shortcut for send payment link
  mousetrap.bind(shortcuts[SHORTCUTS.SEND_PAYMENT_LINK - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    switch (activeTab) {
      case DINEIN_TAB_ID:
        if ($('#sendpaylinkdineinButtonid').is(':visible'))
          $('#sendpaylinkdineinButtonid').click();
        break;
      case TAKEAWAY_TAB_ID:
        if ($('#sendpaylinktaButtonid').is(':visible'))
          $('#sendpaylinktaButtonid').click();
        break;
      case DELIVERY_TAB_ID:
        if ($('#sendpaylinkdeliveryButtonid').is(':visible'))
          $('#sendpaylinkdeliveryButtonid').click();
        break;
      default:
        break;
    }
  });

  // shortcut for split bill window
  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_SPLIT_BILL_WINDOW - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    switch (activeTab) {
      case DINEIN_TAB_ID:
        if ($('#splitbillButton').is(':visible'))
          document
            .getElementById('splitbillButton')
            .dispatchEvent(
              new MouseEvent('click', { bubbles: true, cancelable: true }),
            );
        break;
      case TAKEAWAY_TAB_ID:
        if ($('#tasplitbillButton').is(':visible'))
          document
            .getElementById('tasplitbillButton')
            .dispatchEvent(
              new MouseEvent('click', { bubbles: true, cancelable: true }),
            );
        break;
      case DELIVERY_TAB_ID:
        if ($('#deliverysplitbillButton').is(':visible'))
          document
            .getElementById('deliverysplitbillButton')
            .dispatchEvent(
              new MouseEvent('click', { bubbles: true, cancelable: true }),
            );
        break;
      default:
        break;
    }
  });

  // shortcut for show discount window
  mousetrap.bind(shortcuts[SHORTCUTS.OPEN_COUPON_DISCOUNT - 1].value, () => {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    switch (activeTab) {
      case DINEIN_TAB_ID:
        if ($('#coupondiscountButton').is(':visible'))
          $('#coupondiscountButton').click();
        break;
      case TAKEAWAY_TAB_ID:
        if ($('#tacoupondiscountButton').is(':visible'))
          $('#tacoupondiscountButton').click();
        break;
      case DELIVERY_TAB_ID:
        if ($('#deliverycoupondiscountButton').is(':visible'))
          $('#deliverycoupondiscountButton').click();
        break;
      case QUICK_TAB_ID:
        if ($('#quickcoupondiscountButton').is(':visible'))
          $('#quickcoupondiscountButton').click();
        break;
      default:
        break;
    }
  });

  mousetrap.unbind('del');
  mousetrap.unbind(['ctrl+shift+i', 'command+shift+i']);
  mousetrap.bind(['ctrl+shift+i', 'command+shift+i'], () => {
    if (window.appParameters !== undefined && window.appParameters.length > 0) {
      if (window.appParameters.includes(window.DEVMODE_SECRET)) {
        window.remote.getCurrentWebContents().openDevTools();
      }
    }
  });
  mousetrap.bind('up up down down left right left right b a a enter', () => {
    console.log('Hi sid opening devtools');
    window.remote.getCurrentWebContents().openDevTools();
    window.betteripcRenderer.callMain(MISC_IPC.OPEN_DEV_TOOLS, {});
  });
  mousetrap.bind('del', () => {
    window.deleteSelectedrow();
  });
  mousetrap.bind(['ctrl+shift+k', 'command+shift+k'], () => {
    window.showKeyboard();
  });
  mousetrapInitialized = true;

  if (mousetrapInitialized) {
    //
  }
}
function cycleNewOrderProperly() {
  const activeTab = $('.mainsectionTabs li a.active').attr('id');

  switch (activeTab) {
    case DINEIN_TAB_ID:
      if ($('#takeawayneworderButtonid').length)
        $('#takeawayneworderButtonid').click();
      break;

    case TAKEAWAY_TAB_ID:
      if ($('#deliveryneworderButtonid').length)
        $('#deliveryneworderButtonid').click();
      break;

    case DELIVERY_TAB_ID:
      // Quick Bill usually doesn't need "new order"
      if ($('#quickbilltabID').length) $('#quickbilltabID').click();
      break;

    case QUICK_TAB_ID:
    default:
      if ($('#dineintabId').length) $('#dineintabId').click();
      break;
  }
}

module.exports = {
  addShortcutKeylisteners,
};
