/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-expressions */
let currentAccesslevels;
const ENABLED = 1;
const INACTIVE = 0;
const { forEach } = require('lodash');
const {
  TAKEAWAY_FLAG_ID,
  DINEIN_FLAG_ID,
  HOMED_FLAG_ID,
  DINEIN_TAB_ID,
  TAKEAWAY_TAB_ID,
  QUICK_TAB_ID,
  HOMEDELIVERY_TAB_ID,
  DELIVERY_TAB_ID,
} = require('../util/Constants');
const {
  USE_SEPERATE_VIEWS,
  FETCH_REPORT_AS_PER_CLOSE_DAY,
} = require('../util/SettingIDs');

const stringConstructor = 'test'.constructor;
const ONLINESTORE_SETTINGS_ITEMOPTION_BUTTONS = [1, 2, 3, 4];

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
    window.elog.error({ from: 'parseAccesslevels', error });
    currentAccesslevels = undefined;
  }
};

function checkduePaymentaccess(activeTab) {
  let allowAccess = false;
  if (!currentAccesslevels) {
    parseAccesslevels();
  }
  const orderwindowAccesslevels =
    currentAccesslevels && currentAccesslevels.order_window
      ? currentAccesslevels.order_window
      : undefined;
  if (currentAccesslevels && orderwindowAccesslevels && activeTab) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
        allowAccess =
          orderwindowAccesslevels.dine_in &&
          orderwindowAccesslevels.dine_in.billing &&
          orderwindowAccesslevels.dine_in.billing.allowed_due_payment === 1;
        break;
      case TAKEAWAY_TAB_ID:
        allowAccess =
          orderwindowAccesslevels.ta &&
          orderwindowAccesslevels.ta.billing &&
          orderwindowAccesslevels.ta.billing.allowed_due_payment === 1;
        break;
      case DELIVERY_TAB_ID:
        allowAccess =
          orderwindowAccesslevels.hd &&
          orderwindowAccesslevels.hd.billing &&
          orderwindowAccesslevels.hd.billing.allowed_due_payment === 1;
        break;
      case QUICK_TAB_ID:
        allowAccess =
          orderwindowAccesslevels.hd &&
          orderwindowAccesslevels.quick_bill &&
          orderwindowAccesslevels.quick_bill.allowed_due_payment === 1;
        break;

      default:
        break;
    }
  }
  return allowAccess;
}

function isItemcomplimentaryavailable(activeTab) {
  let allowComplimentary = true;
  if (!currentAccesslevels) {
    parseAccesslevels();
  }
  const orderwindowAccesslevels =
    currentAccesslevels && currentAccesslevels.order_window
      ? currentAccesslevels.order_window
      : undefined;
  if (currentAccesslevels && orderwindowAccesslevels && activeTab) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
        allowComplimentary =
          orderwindowAccesslevels.dine_in &&
          orderwindowAccesslevels.dine_in.kot &&
          orderwindowAccesslevels.dine_in.kot.item_as_complementory === 1;
        break;
      case TAKEAWAY_TAB_ID:
        allowComplimentary =
          orderwindowAccesslevels.ta &&
          orderwindowAccesslevels.ta.kot &&
          orderwindowAccesslevels.ta.kot.item_as_complementory === 1;
        break;
      case DELIVERY_TAB_ID:
        allowComplimentary =
          orderwindowAccesslevels.hd &&
          orderwindowAccesslevels.hd.kot &&
          orderwindowAccesslevels.hd.kot.item_as_complementory === 1;
        break;
      case QUICK_TAB_ID:
        allowComplimentary =
          orderwindowAccesslevels.quick_bill &&
          orderwindowAccesslevels.quick_bill.item_as_complementory === 1;
        break;
      default:
        break;
    }
  }
  return allowComplimentary;
}

function isChangeItemPriceavailable() {
  let allowChangeItemPrice = true;
  if (!currentAccesslevels) {
    parseAccesslevels();
  }
  const orderwindowAccesslevels =
    currentAccesslevels && currentAccesslevels.order_window
      ? currentAccesslevels.order_window
      : undefined;
  if (currentAccesslevels && orderwindowAccesslevels) {
    allowChangeItemPrice = orderwindowAccesslevels.change_item_price === 1;
  }
  return allowChangeItemPrice;
}

function getdepartmentstoInclude() {
  let list = [];
  if (!currentAccesslevels) {
    parseAccesslevels();
  }
  if (currentAccesslevels) {
    const { table_departments } = currentAccesslevels.order_window;
    if (table_departments) {
      try {
        list = String(table_departments).split(',');
        list = list.filter(Boolean);
      } catch (error) {
        list = [];
      }
    }
  }
  return list;
}

function getitemcatstoInclude() {
  let list = [];
  parseAccesslevels();

  if (currentAccesslevels) {
    const table_departments = currentAccesslevels.order_window.item_categories;
    if (table_departments) {
      try {
        list = String(table_departments).split(',');
        list = list.filter(Boolean);
      } catch (error) {
        list = [];
      }
    }
  }
  return list;
}

function setAccesslevelforitemManangement(itemManagementAccessLevels) {
  if (!currentAccesslevels) return;
  if (!itemManagementAccessLevels) {
    parseAccesslevels();
    itemManagementAccessLevels =
      currentAccesslevels && currentAccesslevels?.menu_management?.menu_items
        ? currentAccesslevels.menu_management?.menu_items
        : undefined;
  }

  itemManagementAccessLevels?.is_visible === ENABLED
    ? $('#itemsManagementCardid').show()
    : $('#itemsManagementCardid').hide();
  setTimeout(() => {
    itemManagementAccessLevels?.add_item === ENABLED
      ? $('#addItemInMenuManagement').show()
      : $('#addItemInMenuManagement').hide();
  }, 100);

  setTimeout(() => {
    itemManagementAccessLevels?.edit_item === ENABLED
      ? $('.edit-item-container .item-edit-icon').show()
      : $('.edit-item-container .item-edit-icon').hide();
  }, 50);

  setTimeout(() => {
    itemManagementAccessLevels?.visible_items === ENABLED
      ? $('.edit-item-container .item-status-switch').show()
      : $('.edit-item-container .item-status-switch').hide();
  }, 50);

  setTimeout(() => {
    itemManagementAccessLevels?.visible_category === ENABLED
      ? $('.node-itemManagementCategorytree .category-status-switch').show()
      : $('.node-itemManagementCategorytree .category-status-switch').hide();
  });

  setTimeout(() => {
    itemManagementAccessLevels?.load_menu === ENABLED
      ? $('#syncButton').show()
      : $('#syncButton').hide();
  }, 50);
}

function initAccesslevelsformenuManagement(menuManagamenAccessLevels) {
  if (!currentAccesslevels) return;

  if (!menuManagamenAccessLevels) {
    parseAccesslevels();
    menuManagamenAccessLevels =
      currentAccesslevels?.menu_management || undefined;
  }

  if (!menuManagamenAccessLevels) return;

  menuManagamenAccessLevels.is_visible === ENABLED
    ? $('#menuManagementIcon').show()
    : $('#menuManagementIcon').hide();

  if (menuManagamenAccessLevels.ip_address !== undefined) {
    menuManagamenAccessLevels.ip_address === INACTIVE
      ? $('#menuManagementIpContainer').hide()
      : $('#menuManagementIpContainer').show();
  }

  if (menuManagamenAccessLevels.menu_items) {
    setAccesslevelforitemManangement(menuManagamenAccessLevels.menu_items);
  }

  if (menuManagamenAccessLevels.account) {
    initAccountAccessLevels(menuManagamenAccessLevels.account);
  }

  if (menuManagamenAccessLevels.add_expense) {
    toggleByAccess(
      '#expenseManagementCardid',
      menuManagamenAccessLevels.add_expense.is_visible,
    );

    window.menuExpenseAccessLevels = menuManagamenAccessLevels.add_expense;
  }

  if (menuManagamenAccessLevels.customer_management) {
    applyCustomerManagementAccessLevels(
      menuManagamenAccessLevels.customer_management,
    );
  }

  if (menuManagamenAccessLevels.user_management !== undefined) {
    toggleByAccess(
      '#UserManagementid',
      menuManagamenAccessLevels.user_management,
    );
  }

  if (menuManagamenAccessLevels.wallet_management) {
    applyWalletAccessLevels(menuManagamenAccessLevels.wallet_management);
  }
}

function applyWalletAccessLevels(walletAccess) {
  if (!walletAccess) return;

  toggleByAccess('#walletCardid', walletAccess.is_visible);

  const applyButtons = () => {
    toggleByAccess('#opencreateWalletbutton', walletAccess.create_wallet);
    toggleByAccess(
      '#wallettableID button.add-credit-button',
      walletAccess.add_credit,
    );
    toggleByAccess(
      '#wallettableID button.material-button',
      walletAccess.view_transactions,
    );
  };

  if (window.walletmgmtScriptloaded) {
    applyButtons();
  } else {
    const walletWatcher = setInterval(() => {
      if (window.walletmgmtScriptloaded) {
        applyButtons();
        clearInterval(walletWatcher);
      }
    }, 300);
  }
}
function applyCustomerManagementAccessLevels(customerAccess) {
  if (!customerAccess) return;

  toggleByAccess('#crmCardid', customerAccess.is_visible);

  const applyButtons = () => {
    toggleByAccess('#openaddcustomerModal', customerAccess.add);
    toggleByAccess('#importCustomersbutton', customerAccess.import);
    toggleByAccess('#exportCustomersbutton', customerAccess.export);

    if (customerAccess.edit === INACTIVE) {
      $('#customermgmtDattable tbody tr td.edit-icon-on-left').hide();
    } else {
      $('#customermgmtDattable tbody tr td.edit-icon-on-left').show();
    }
  };

  if (window.customermgmtscriptLoaded) {
    applyButtons();
  } else {
    const customerWatcher = setInterval(() => {
      if (window.customermgmtscriptLoaded) {
        applyButtons();
        clearInterval(customerWatcher);
      }
    }, 300);
  }
}
function applyExpenseAccessLevels(expenseAccess) {
  if (!expenseAccess) return;

  toggleByAccess('#openaddExpensebutton', expenseAccess.add_expense);
  toggleByAccess('#openaddCategorybutton', expenseAccess.add_category);
  toggleByAccess('#openaddSubcategorybutton', expenseAccess.add_sub_category);

  toggleByAccess(
    '#openCashDrawerOnExpensesbuttonid',
    expenseAccess.cash_drawer,
  );

  toggleByAccess('#expensesOverviewtabid', expenseAccess.overview);
  toggleByAccess('#expensesalltabid', expenseAccess.all_expenses);
  toggleByAccess('#expensesGraphstabid', expenseAccess.graph);
  toggleByAccess('#expensesncrReporttabid', expenseAccess.ncr_report);

  setTimeout(() => {
    const firstVisibleTab = $('.expense-tabs a:visible').first();
    if (firstVisibleTab.length) {
      firstVisibleTab.tab('show');
    }
  }, 50);
}

if (typeof window !== 'undefined') {
  window.applyExpenseAccessLevels = applyExpenseAccessLevels;
}

function toggleByAccess(selector, access) {
  access === INACTIVE ? $(selector).hide() : $(selector).show();
}

function initAccesslevelsforsettings(settingsaccessLevels) {
  if (!currentAccesslevels) return;
  if (!settingsaccessLevels) {
    parseAccesslevels();
    settingsaccessLevels =
      currentAccesslevels && currentAccesslevels.settings
        ? currentAccesslevels.settings
        : undefined;
  }

  if (settingsaccessLevels) {
    settingsaccessLevels.is_visible === INACTIVE
      ? $('#settingsButton').hide()
      : $('#settingsButton').show();

    if (window.settingscriptLoaded) {
      settingsaccessLevels.general === INACTIVE
        ? $('#generalTablink,#generalTab').hide()
        : $('#generalTablink').show();
      settingsaccessLevels.printers === INACTIVE
        ? $('#printerTablink').hide()
        : $('#printerTablink').show();
      settingsaccessLevels.shortcuts === INACTIVE
        ? $('#shortcutsTablink').hide()
        : $('#shortcutsTablink').show();
      settingsaccessLevels.profile === INACTIVE
        ? $('#profileTablink').hide()
        : $('#profileTablink').show();
      settingsaccessLevels.formatting === INACTIVE
        ? $('#formattingTablink').hide()
        : $('#formattingTablink').show();

      setTimeout(() => {
        $('#settingsTablistid li a:visible:first').tab('show');
      }, 300);
    }
  }
}

function initAccesslevelsformasters(mastersaccessLevels) {
  if (!currentAccesslevels) return;
  if (!mastersaccessLevels) {
    parseAccesslevels();
    mastersaccessLevels =
      currentAccesslevels && currentAccesslevels.master_management
        ? currentAccesslevels.master_management
        : undefined;
  }

  if (mastersaccessLevels) {
    mastersaccessLevels.is_visible === INACTIVE
      ? $('#mastermenuIcon').hide()
      : $('#mastermenuIcon').show();

    if (window.mastermenuScriptloaded) {
      mastersaccessLevels.ip_address === INACTIVE
        ? $('#mastermenuWrapperid #ipaddressField').hide()
        : $('#mastermenuWrapperid #ipaddressField').show();

      mastersaccessLevels.user_management === INACTIVE
        ? $('#menu-types-list-id li[menu-type=2]').hide()
        : $('#menu-types-list-id li[menu-type=2]').show();

      // if (menuManagamenAccessLevels.add_expense) {
      //   toggleByAccess(
      //     '#expenseManagementCardid',
      //     menuManagamenAccessLevels.add_expense.is_visible
      //   );

      //   window.menuExpenseAccessLevels =
      //     menuManagamenAccessLevels.add_expense;
      // }

      if (mastersaccessLevels.account) {
        mastersaccessLevels.account.is_visible === INACTIVE
          ? $('#accordionExample').hide()
          : $('#accordionExample').show();

        mastersaccessLevels.account.close_day === INACTIVE
          ? $('#accountCloseDay').hide()
          : $('#accountCloseDay').show();

        mastersaccessLevels.account.close_shift === INACTIVE
          ? $('#accountCloseShift').hide()
          : $('#accountCloseShift').show();
      }

      // Check access levels for customer_management
      // if (mastersaccessLevels.customer_management) {
      //   mastersaccessLevels.customer_management.is_visible === INACTIVE
      //     ? $('#menu-types-list-id li[menu-type=3]').hide()
      //     : $('#menu-types-list-id li[menu-type=3]').show();
      //   if (window.customermgmtscriptLoaded) {
      //     mastersaccessLevels.customer_management.add === INACTIVE
      //       ? $('#openaddcustomerModal').hide()
      //       : $('#openaddcustomerModal').show();
      //     mastersaccessLevels.customer_management.import === INACTIVE
      //       ? $('#importCustomersbutton').hide()
      //       : $('#importCustomersbutton').show();
      //     mastersaccessLevels.customer_management.export === INACTIVE
      //       ? $('#exportCustomersbutton').hide()
      //       : $('#exportCustomersbutton').show();

      //     setTimeout(() => {
      //       mastersaccessLevels.customer_management.edit === INACTIVE
      //         ? $('#customermgmtDattable tbody tr td.edit-icon-on-left').hide()
      //         : $('#customermgmtDattable tbody tr td.edit-icon-on-left').show();
      //     }, 100);
      //   }
      // }

      // if (mastersaccessLevels.wallet_management) {
      //   mastersaccessLevels.wallet_management.is_visible === INACTIVE
      //     ? $('#menu-types-list-id li[menu-type=4]').hide()
      //     : $('#menu-types-list-id li[menu-type=4]').show();
      //   if (window.walletmgmtScriptloaded) {
      //     mastersaccessLevels.wallet_management.create_wallet === INACTIVE
      //       ? $('#opencreateWalletbutton').hide()
      //       : $('#opencreateWalletbutton').show();
      //     mastersaccessLevels.wallet_management.add_credit === INACTIVE
      //       ? $('#wallettableID button.add-credit-button').hide()
      //       : $('#wallettableID button.add-credit-button').show();
      //     mastersaccessLevels.wallet_management.view_transactions === INACTIVE
      //       ? $('#wallettableID button.material-button').hide()
      //       : $('#wallettableID button.material-button').show();
      //   }
      // }
    }
  }
}

function initAccesslevelsforreports(reportaccessLevels) {
  if (!currentAccesslevels) return;
  if (!reportaccessLevels) {
    parseAccesslevels();
    reportaccessLevels =
      currentAccesslevels && currentAccesslevels.reports
        ? currentAccesslevels.reports
        : undefined;
  }
  if (reportaccessLevels) {
    reportaccessLevels.is_visible === INACTIVE
      ? $('#allreportsIcon').hide()
      : $('#allreportsIcon').show();
    if (window.allreportsscriptLoaded) {
      // sales_report
      reportaccessLevels.sales_report === INACTIVE
        ? $('#reporttypeContainerid div.salesReportcard').hide()
        : $('#reporttypeContainerid div.salesReportcard').show();
      reportaccessLevels.todays_report === INACTIVE
        ? $('#reporttypeContainerid div.todaysReportcard').hide()
        : $('#reporttypeContainerid div.todaysReportcard').show();
      reportaccessLevels.payment_report === INACTIVE
        ? $('#reporttypeContainerid div.paymentReportcard').hide()
        : $('#reporttypeContainerid div.paymentReportcard').show();
      reportaccessLevels.order_report === INACTIVE
        ? $('#reporttypeContainerid div.orderReportcard').hide()
        : $('#reporttypeContainerid div.orderReportcard').show();
      reportaccessLevels.category_wise_report === INACTIVE
        ? $('#reporttypeContainerid div.catwiseReportcard').hide()
        : $('#reporttypeContainerid div.catwiseReportcard').show();
      reportaccessLevels.kitchen_dept_wise_report === INACTIVE
        ? $('#reporttypeContainerid div.kdwiseReportcard').hide()
        : $('#reporttypeContainerid div.kdwiseReportcard').show();
      reportaccessLevels.coupon_history === INACTIVE
        ? $('#reporttypeContainerid div.couponReportcard').hide()
        : $('#reporttypeContainerid div.couponReportcard').show();
      reportaccessLevels['user-shift_report'] === INACTIVE
        ? $('#reporttypeContainerid div.usershiftReportcard').hide()
        : $('#reporttypeContainerid div.usershiftReportcard').show();

      reportaccessLevels.tax_report === INACTIVE
        ? $('#reporttypeContainerid div.taxReportcard').hide()
        : $('#reporttypeContainerid div.taxReportcard').show();

      reportaccessLevels.kot_report === INACTIVE
        ? $('#reporttypeContainerid div.kotReportcard').hide()
        : $('#reporttypeContainerid div.kotReportcard').show();

      reportaccessLevels.delivery_boy_report === INACTIVE
        ? $('#reporttypeContainerid div.deliveryboyReportcard').hide()
        : $('#reporttypeContainerid div.deliveryboyReportcard').show();

      reportaccessLevels.user_report === INACTIVE
        ? $('#reporttypeContainerid div.userReportcard').hide()
        : $('#reporttypeContainerid div.userReportcard').show();

      reportaccessLevels.user_shift_report === INACTIVE
        ? $('#reporttypeContainerid div.usershiftReportcard').hide()
        : $('#reporttypeContainerid div.usershiftReportcard').show();

      reportaccessLevels.startCloseDay_report === INACTIVE
        ? $('#reporttypeContainerid div.dayendReportcard').hide()
        : $('#reporttypeContainerid div.dayendReportcard').show();

      // for terminal user no need to show start close day report
      if (!window.__IS_MASTER_POS__) {
        $('#reporttypeContainerid div.dayendReportcard').hide();
      }

      reportaccessLevels.pre_order_report === INACTIVE
        ? $('#reporttypeContainerid div.preOrderReportcard').hide()
        : $('#reporttypeContainerid div.preOrderReportcard').show();

      reportaccessLevels.misc_report === INACTIVE
        ? $('#reporttypeContainerid div.miscReportcard').hide()
        : $('#reporttypeContainerid div.miscReportcard').show();

      reportaccessLevels.mall_report === INACTIVE
        ? $('#reporttypeContainerid div.mallReportcard').hide()
        : $('#reporttypeContainerid div.mallReportcard').show();

      reportaccessLevels.reservation_report === INACTIVE
        ? $('#reporttypeContainerid div.reservationReportcard').hide()
        : $('#reporttypeContainerid div.reservationReportcard').show();

      // Due payment filters
      if (reportaccessLevels.due_payment_report) {
        reportaccessLevels.due_payment_report.is_visible === INACTIVE
          ? $('#reporttypeContainerid div.duepayReportcard').hide()
          : $('#reporttypeContainerid div.duepayReportcard').show();

        if (reportaccessLevels.due_payment_report.due_orders === INACTIVE) {
          $('#duepayreportTable-wrapper-id').hide();
        }

        reportaccessLevels.due_payment_report.due_orders === INACTIVE
          ? $('#due-sections-container-id div[report-action=16]').hide()
          : $('#due-sections-container-id div[report-action=16]').show();

        reportaccessLevels.due_payment_report.order_history_report === INACTIVE
          ? $(
              '#due-sections-container-id div[report-action=17],#duepayhistoryreportTable-wrapper-id',
            ).hide()
          : $(
              '#due-sections-container-id div[report-action=17],#duepayhistoryreportTable-wrapper-id',
            ).show();

        // if (
        //   reportaccessLevels.due_payment_report.due_orders === INACTIVE &&
        //   reportaccessLevels.due_payment_report.order_history_report === INACTIVE
        // ) {
        //   $('#reporttypeContainerid div.duepayReportcard').hide();
        // }

        if (reportaccessLevels.show_amount === 0) {
          window.hideAmountOnReport = true;
        }
      }

      // Items report filters
      if (reportaccessLevels.item_report) {
        // is_visible
        reportaccessLevels.item_report.is_visible === INACTIVE
          ? $('#reporttypeContainerid div.itemsReportcard').hide()
          : $('#reporttypeContainerid div.itemsReportcard').show();

        reportaccessLevels.item_report.top_item_report === INACTIVE
          ? $('#itemsreportsectionId div[report-action=2]').hide()
          : $('#itemsreportsectionId div[report-action=2]').show();
        reportaccessLevels.item_report.cancelled_items_report === INACTIVE
          ? $('#itemsreportsectionId div[report-action=3]').hide()
          : $('#itemsreportsectionId div[report-action=3]').show();
        reportaccessLevels.item_report.sold_items_report === INACTIVE
          ? $('#itemsreportsectionId div[report-action=4]').hide()
          : $('#itemsreportsectionId div[report-action=4]').show();
        reportaccessLevels.item_report.complementory_items_report === INACTIVE
          ? $('#itemsreportsectionId div[report-action=5]').hide()
          : $('#itemsreportsectionId div[report-action=5]').show();

        reportaccessLevels.item_report.dead_items_report === INACTIVE
          ? $('#itemsreportsectionId div[report-action=6]').hide()
          : $('#itemsreportsectionId div[report-action=6]').show();
        reportaccessLevels.item_report.deleted_items_report === INACTIVE
          ? $('#itemsreportsectionId div[report-action=18]').hide()
          : $('#itemsreportsectionId div[report-action=18]').show();
        reportaccessLevels.item_report.add_on_items_report === INACTIVE
          ? $('#itemsreportsectionId div[report-action=19]').hide()
          : $('#itemsreportsectionId div[report-action=19]').show();

        if ($('#itemsreportsectionId div:visible').length === 0) {
          // $("#reporttypeContainerid div.itemsReportcard").hide();
        }
      }
    }
    if (reportaccessLevels.showAllUserReport) {
      window.showAllUserReport = reportaccessLevels.showAllUserReport;
    }
  }
}

function initAccesslevelsforreceipts(receiptaccessLevels) {
  if (!currentAccesslevels) return;
  if (!receiptaccessLevels) {
    parseAccesslevels();
    receiptaccessLevels =
      currentAccesslevels && currentAccesslevels.receipts
        ? currentAccesslevels.receipts
        : undefined;
  }

  if (receiptaccessLevels) {
    receiptaccessLevels.is_visible === INACTIVE
      ? $('#receiptIcon').hide()
      : $('#receiptIcon').show();
    if (window.receiptsWindowloaded) {
      // todays_report
      receiptaccessLevels.todays_report === INACTIVE
        ? $('#todaysreportbutton').hide()
        : $('#todaysreportbutton').show();
      receiptaccessLevels.preview === INACTIVE
        ? $('#previewreceiptbillButton').hide()
        : $('#previewreceiptbillButton').show();
      receiptaccessLevels.edit_bill.is_visible === INACTIVE
        ? $('#editbillButton').hide()
        : $('#editbillButton').show();
      receiptaccessLevels.edit_bill.payment_mode === INACTIVE
        ? $('#receiptmodalpaymentWrapperid').hide()
        : $('#receiptmodalpaymentWrapperid').show();
      receiptaccessLevels.edit_bill.bill_status === INACTIVE
        ? $('#receiptOrderstatusWrapperid').hide()
        : $('#receiptOrderstatusWrapperid').show();

      if (
        receiptaccessLevels.edit_bill.payment_mode === INACTIVE &&
        receiptaccessLevels.edit_bill.bill_status === INACTIVE
      ) {
        $('#editbillButton').hide();
      }
      if (receiptaccessLevels.reprint_bill === INACTIVE) {
        $('#receiptprintButton').hide();
      } else {
        $('#receiptprintButton').show();
      }

      if (receiptaccessLevels.resync_bills === INACTIVE) {
        $('#resyncBillbuttonid').hide();
      } else {
        $('#resyncBillbuttonid').show();
      }

      if (receiptaccessLevels.all_bills === INACTIVE) {
        $('#allbillsButton').hide();
      } else {
        $('#allbillsButton').show();
      }

      if (receiptaccessLevels.todays_bills === INACTIVE) {
        $('#todaysbillsButton').hide();
      } else {
        $('#todaysbillsButton').show();
      }

      if (receiptaccessLevels.date_filter === INACTIVE) {
        $('#receipt_fromdateButton').hide();
      } else {
        $('#receipt_fromdateButton').show();
      }

      // deleted status
      if (receiptaccessLevels.deleted_status === INACTIVE) {
        $('#deleted').hide();
      } else {
        $('#deleted').show();
      }

      // free status
      if (receiptaccessLevels.free_status === INACTIVE) {
        $('#free').hide();
      } else {
        $('#free').show();
      }

      if (receiptaccessLevels.edit_bill_after_save == '1') {
        $('#modifybillButton').show();
        window.editBillFromReciptSectionAllowed = true;
      } else {
        window.editBillFromReciptSectionAllowed = false;
        $('#modifybillButton').hide();
      }

      if (receiptaccessLevels.reverse_inventory == '1') {
        $('#reverseInventoryButton').show();
      } else {
        $('#reverseInventoryButton').hide();
      }

      if (receiptaccessLevels.selected_bills) {
        window.showSelectedBillAmount = true;
      }
      if (receiptaccessLevels.all_bills_amount) {
        window.showAllBillAmount = true;
      }

      if (receiptaccessLevels.net_sale_amounts) {
        window.showNetSaleAmount = true;
      }
      if (receiptaccessLevels.show_bills_amount) {
        window.showAllShownBillAmount = true;
      }
      if (receiptaccessLevels.total_fulfilled_amount) {
        window.showTotalFulfilledAmount = true;
      }

      if (receiptaccessLevels.tip_amount == '1') {
        $('#receipttipAmountid').show();
      } else {
        $('#receipttipAmountid').hide();
      }
    }
  }
}

function initAccesslevelsfordashboard(dashboardAccesslevels) {
  if (!currentAccesslevels) return;
  if (!dashboardAccesslevels) {
    parseAccesslevels();
    dashboardAccesslevels =
      currentAccesslevels && currentAccesslevels.dashboard
        ? currentAccesslevels.dashboard
        : undefined;
  }

  if (dashboardAccesslevels) {
    dashboardAccesslevels.is_visible === INACTIVE
      ? $('#dashboardIcon').hide()
      : $('#dashboardIcon').show();

    if (window.dashboardWindowloaded) {
      dashboardAccesslevels.todays_sale === INACTIVE
        ? $('#todaysalesLabelid').hide()
        : $('#todaysalesLabelid').show();
      dashboardAccesslevels.total_sales === INACTIVE
        ? $('#totalsalesLabelid').hide()
        : $('#totalsalesLabelid').show();
      dashboardAccesslevels.this_month_sale === INACTIVE
        ? $('#monthsalesLabelid').hide()
        : $('#monthsalesLabelid').show();

      dashboardAccesslevels.sales_analysis_by_days === INACTIVE
        ? $('#overall-sales-bar-chart-id').hide()
        : $('#overall-sales-bar-chart-id').show();

      dashboardAccesslevels.all_sales_analysis === INACTIVE
        ? $('#allsales-stat-container-id *').hide()
        : $('#allsales-stat-container-id *').show();

      dashboardAccesslevels.item_pie_chart === INACTIVE
        ? $('#piechart-container-id').hide()
        : $('#piechart-container-id').show();

      dashboardAccesslevels.line_sales_chart === INACTIVE
        ? $('#linesaleschart-container-id').hide()
        : $('#linesaleschart-container-id').show();

      dashboardAccesslevels.bar_sales_chart === INACTIVE
        ? $('#barsaleschart-container-id').hide()
        : $('#barsaleschart-container-id').show();

      dashboardAccesslevels.payment_modes_chart === INACTIVE
        ? $('#dashboard-pay-statsid').hide()
        : $('#dashboard-pay-statsid').show();

      dashboardAccesslevels.ip_address === INACTIVE
        ? $('#dashboardparentDivid div.dash-ip-container').hide()
        : $('#dashboardparentDivid div.dash-ip-container').show();

      if (
        dashboardAccesslevels.bar_sales_chart === INACTIVE &&
        dashboardAccesslevels.line_sales_chart === INACTIVE &&
        dashboardAccesslevels.item_pie_chart === INACTIVE
      ) {
        $('#dashboardparentDivid').css({
          'grid-template-rows': '13vh 27vh',
        });
        $('#dashboard-stat-container-2-id').css({
          height: 'inherit',
        });
        $('#dashboard-stat-container-3-id').hide();
      }
    }
  }
}

function initAccesslevelsforquickbill({ quickbillaccessLevels }) {
  if (!currentAccesslevels) return;
  if (!quickbillaccessLevels) {
    parseAccesslevels();
    quickbillaccessLevels =
      currentAccesslevels && currentAccesslevels.order_window
        ? currentAccesslevels.order_window.quick_bill
        : undefined;
  }
  if (quickbillaccessLevels.is_visible === INACTIVE) {
    window.quickbillDisabled = true;
  }
  if (quickbillaccessLevels) {
    quickbillaccessLevels.is_visible === INACTIVE
      ? $('#quickbilltabID').hide()
      : $('#quickbilltabID').show();
    quickbillaccessLevels.kot === INACTIVE
      ? $('#quickkotprintChecklabel').hide()
      : $('#quickkotprintChecklabel').show();
    quickbillaccessLevels.bill === INACTIVE
      ? $('#quickbillprintChecklabel').hide()
      : $('#quickbillprintChecklabel').show();
    quickbillaccessLevels.customer_history === INACTIVE
      ? $('#quickcustomerhistoryButton').hide()
      : $('#quickcustomerhistoryButton').show();
    quickbillaccessLevels.show_on_bill === INACTIVE
      ? $('#showOnquickbillBilllabelcheckid').hide()
      : $('#showOnquickbillBilllabelcheckid').show();
    quickbillaccessLevels.show_preview === INACTIVE
      ? $('#quickpreviewButton').hide()
      : $('#quickpreviewButton').show();
    quickbillaccessLevels.add_coupon === INACTIVE
      ? $('#quickcoupondiscountButton').hide()
      : $('#quickcoupondiscountButton').show();
    quickbillaccessLevels.add_discount === INACTIVE
      ? $('#quickdiscountButton').hide()
      : $('#quickdiscountButton').show();
    quickbillaccessLevels.add_payment === INACTIVE
      ? $('#quickpaymentButton,#quickpaymentButton2').hide()
      : $('#quickpaymentButton,#quickpaymentButton2').show();
    quickbillaccessLevels.add_charge === INACTIVE
      ? $('#quickchargesButton').hide()
      : $('#quickchargesButton').show();
    quickbillaccessLevels.paid === INACTIVE
      ? $('#quickbillsettleButton').hide()
      : $('#quickbillsettleButton').show();

    quickbillaccessLevels.send_ebill === INACTIVE
      ? $('#quickebillBillcheckidlabel').hide()
      : $('#quickebillBillcheckidlabel').show();
  }
}

function initAccesslevelsfororders({ orderwindowAccesslevels }) {
  if (!currentAccesslevels) return;
  if (!orderwindowAccesslevels) {
    parseAccesslevels();
    orderwindowAccesslevels =
      currentAccesslevels && currentAccesslevels.order_window
        ? currentAccesslevels.order_window
        : undefined;
  }

  if (orderwindowAccesslevels) {
    orderwindowAccesslevels.print_and_settle_bill === INACTIVE
      ? $('#savenewpaymentButton').hide()
      : $('#savenewpaymentButton').show();

    orderwindowAccesslevels.save_and_settle_bill === INACTIVE
      ? $('#applynewpaymentButton').hide()
      : $('#applynewpaymentButton').show();
    if (orderwindowAccesslevels.is_visible === INACTIVE) {
      $('#orderIcon').hide();
      $('#menu-wapper-id li a:visible:first').click();
    } else {
      $('#orderIcon').show();
    }

    if (window.orderWindowloaded) {
      let showActionDiv = false;
      if (orderwindowAccesslevels.filter_table === INACTIVE) {
        $('#filterButton').hide();
      } else {
        showActionDiv = true;
        $('#filterButton').show();
      }
      if (orderwindowAccesslevels.change_table === INACTIVE) {
        $('#changeTablebutton').hide();
      } else {
        showActionDiv = true;
        $('#changeTablebutton').show();
      }
      if (orderwindowAccesslevels.add_customer === INACTIVE) {
        $('#openCustomerbtn').hide();
      } else {
        showActionDiv = true;
        $('#openCustomerbtn').show();
      }
      if (orderwindowAccesslevels.refresh_button === INACTIVE) {
        $('#refreshButton').hide();
      } else {
        showActionDiv = true;
        $('#refreshButton').show();
      }
      if (orderwindowAccesslevels.payment_list === INACTIVE) {
        $('#paymentsList').hide();
      } else {
        showActionDiv = true;
        $('#paymentsList').show();
      }
      if (orderwindowAccesslevels.waiter_notification === INACTIVE) {
        $('#waiterNotificationsid').hide();
      } else {
        showActionDiv = true;
        $('#waiterNotificationsid').show();
      }
      if (orderwindowAccesslevels.live_tracking === INACTIVE) {
        $('#livetstatusButton').hide();
      } else {
        showActionDiv = true;
        $('#livetstatusButton').show();
      }

      if (window.settingsConfig[USE_SEPERATE_VIEWS - 1] != undefined) {
        window.usenewtableitemView =
          window.settingsConfig[USE_SEPERATE_VIEWS - 1].value === '1';
      }
      if (!showActionDiv && !window.usenewtableitemView) {
        $('.actionDiv').hide();
      }

      let showSearchDiv = false;
      if (orderwindowAccesslevels.live_support === INACTIVE) {
        $('#help-button-id').hide();
      } else {
        showSearchDiv = true;
        $('#help-button-id').show();
      }

      if (orderwindowAccesslevels.search_table === INACTIVE) {
        $('#searchTablebyname').hide();
      } else {
        showSearchDiv = true;
        $('#searchTablebyname').show();
      }

      if (orderwindowAccesslevels.search_by_code === INACTIVE) {
        $('#searchitembyCode').hide();
      } else {
        showSearchDiv = true;
        $('#searchitembyCode').show();
      }

      if (orderwindowAccesslevels.search_by_name === INACTIVE) {
        $('#serachItemBynamewrapper').hide();
      } else {
        showSearchDiv = true;
        $('#serachItemBynamewrapper').show();
      }

      if (orderwindowAccesslevels.delete_search === INACTIVE) {
        $('#deleteItembyindex').hide();
      } else {
        showSearchDiv = true;
        $('#deleteItembyindex').show();
      }

      if (orderwindowAccesslevels.sync_button === INACTIVE) {
        $('#syncIndicatorid').hide();
      } else {
        showSearchDiv = true;
        $('#syncIndicatorid').show();
      }

      if (!showSearchDiv) {
        $('.searchDiv').hide();
      }

      if (window.usenewtableitemView && !showSearchDiv) {
        $('#itemsDivid').css('height', '61%');
      }

      if (!window.usenewtableitemView && (!showSearchDiv || !showActionDiv)) {
        $('#itemsDivid').css('height', '70%');
      }
      if (!window.usenewtableitemView && !showSearchDiv && !showActionDiv) {
        $('#itemsDivid').css('height', '70%');
      }

      if (window.usenewtableitemView && !showSearchDiv && !showActionDiv) {
        $('#itemsDivid').css('height', '93%');
      }

      setTimeout(() => {
        if (window.usenewtableitemView && (showSearchDiv || showActionDiv)) {
          $('#itemsDivid').css('height', '92%');
        }
        if (
          window.globalDisabledTabs &&
          window.globalDisabledTabs.includes(DINEIN_TAB_ID) &&
          window.globalDisabledTabs.includes(TAKEAWAY_TAB_ID) &&
          !showActionDiv
        ) {
          $('.actionDiv').hide();
        }

        if (
          window.globalDisabledTabs &&
          window.globalDisabledTabs.includes(DINEIN_TAB_ID) &&
          window.globalDisabledTabs.includes(TAKEAWAY_TAB_ID) &&
          !showActionDiv &&
          !showSearchDiv
        ) {
          $('#itemsDivid').css('height', '92%');
        }

        if (
          window.globalDisabledTabs &&
          window.globalDisabledTabs.includes(DINEIN_TAB_ID) &&
          window.globalDisabledTabs.includes(TAKEAWAY_TAB_ID) &&
          (showActionDiv || showSearchDiv)
        ) {
          $('#itemsDivid').css('height', '92%');
        }

        if (
          window.globalDisabledTabs &&
          window.globalDisabledTabs.includes(DINEIN_TAB_ID) &&
          window.globalDisabledTabs.includes(TAKEAWAY_TAB_ID) &&
          showActionDiv &&
          showSearchDiv
        ) {
          $('#itemsDivid').css('height', '93%');
        }
      }, 200);

      if (!window.__IS_MASTER_POS__) {
        window.showPaymentNotification =
          orderwindowAccesslevels.payment_notification;
      }
      // orderwindowAccesslevels.load_menu === INACTIVE
      //   ? $('#syncButton').hide()
      //   : $('#syncButton').show();

      // (orderwindowAccesslevels.item_categories === INACTIVE)
      //     ? $('#tree').hide()
      //     : $('#tree').show();
      // if (orderwindowAccesslevels.item_categories === INACTIVE) {
      //     $('#itemviewContainer').css('width', '100%');
      // }

      // Dine in access levels
      if (orderwindowAccesslevels.dine_in) {
        // eslint-disable-next-line no-use-before-define
        setAccesslevelfordinein(orderwindowAccesslevels.dine_in);
      }

      if (orderwindowAccesslevels.hd) {
        setaccessLevelsfordelivery(orderwindowAccesslevels.hd);
      }

      if (orderwindowAccesslevels.ta || orderwindowAccesslevels.takeaway) {
        // eslint-disable-next-line no-use-before-define
        if (!window.__IS_MASTER_POS__) {
          // setaccessLevelsfortahd({
          //   tahdaccessLevels: orderwindowAccesslevels.takeaway,
          //   type: TAKEAWAY_FLAG_ID,
          // });
          setaccessLevelsfortakeaway(orderwindowAccesslevels.takeaway);
        } else {
          // setaccessLevelsfortahd({
          //   tahdaccessLevels: orderwindowAccesslevels.ta,
          //   type: TAKEAWAY_FLAG_ID,
          // });
          setaccessLevelsfortakeaway(orderwindowAccesslevels.ta);
        }
      }

      if (orderwindowAccesslevels.quick_bill) {
        initAccesslevelsforquickbill({
          quickbillaccessLevels: orderwindowAccesslevels.quick_bill,
        });
      }

      if (orderwindowAccesslevels.modify_bill_after_save) {
        window.allowModifyBill = true;
      } else {
        window.allowModifyBill = false;
      }
      if (orderwindowAccesslevels.table_reservation) {
        window.isTableReservationEnabled = true;
      } else {
        window.isTableReservationEnabled = false;
      }
    }

    if (orderwindowAccesslevels.changeOrderType) {
      window.changeOrderTypeEnabled = true;
      $('#changeordertypeid').show();
      $('#takeawaychangeordertypeid').show();
      $('#deliverychangeordertypeid').show();
    }

    if (orderwindowAccesslevels.cash_drawer === ENABLED) {
      window.showCashDrawerEnabled = true;
      $('#openCashDrawerbuttonid').show();
    } else {
      $('#openCashDrawerbuttonid').hide();
    }
    // orderwindowAccesslevels.cash_drawer === ENABLED
    //   ? $('#openCashDrawerbuttonid').show()
    //   : $('#openCashDrawerbuttonid').hide();

    orderwindowAccesslevels.updateStock === ENABLED
      ? (window.updateStockAccess = true)
      : (window.updateStockAccess = false);
  }
}

function initAccesslevelsfororderSettlementWindow({
  orderSettlementwindowAccesslevels,
}) {
  if (!currentAccesslevels) return;
  if (!orderSettlementwindowAccesslevels) {
    parseAccesslevels();
    orderSettlementwindowAccesslevels =
      currentAccesslevels && currentAccesslevels.order_settlement_window
        ? currentAccesslevels.order_settlement_window
        : undefined;
  }
  if (!orderSettlementwindowAccesslevels) return;
  orderSettlementwindowAccesslevels.is_visible === INACTIVE
    ? $('#orderSettlementIcon').hide()
    : $('#orderSettlementIcon').show();

  orderSettlementwindowAccesslevels.update === INACTIVE
    ? $('#orderSettlewindowUpdateButtonId').hide()
    : $('#orderSettlewindowUpdateButtonId').show();

  orderSettlementwindowAccesslevels.settle === INACTIVE
    ? $('#orderSettlewindowSettleButtonId').hide()
    : $('#orderSettlewindowSettleButtonId').show();

  orderSettlementwindowAccesslevels.delivery_boy_report === ENABLED
    ? $('#deliveryBoyReeportprintButton').show()
    : $('#deliveryBoyReeportprintButton').hide();

  if (orderSettlementwindowAccesslevels.actions) {
    if (orderSettlementwindowAccesslevels.actions.settle === INACTIVE) {
      window.showGotoOrderWindow = false;
      $('.gotoOrderPageClass').hide();
    } else {
      window.showGotoOrderWindow = true;
      $('.gotoOrderPageClass').show();
    }

    if (orderSettlementwindowAccesslevels.actions.settle === INACTIVE) {
      window.showUpdateOrderStatusIcon = false;
      $('.updateOrderStatusIcon').hide();
    } else {
      window.showUpdateOrderStatusIcon = true;
      $('.updateOrderStatusIcon').show();
    }
  }
}

function initAccesslevelsforonlineorders({ onlineorderwindowAccesslevels }) {
  if (!currentAccesslevels) return;
  if (!onlineorderwindowAccesslevels) {
    parseAccesslevels();
    onlineorderwindowAccesslevels =
      currentAccesslevels && currentAccesslevels.online_orders
        ? currentAccesslevels.online_orders
        : undefined;
  }
  if (onlineorderwindowAccesslevels) {
    if (onlineorderwindowAccesslevels.is_visible === INACTIVE) {
      $('#onlineorderIcon').hide();
    } else {
      $('#onlineorderIcon').show();
    }
    if (onlineorderwindowAccesslevels.print_bill === INACTIVE) {
      $('#printonlinebillButton').hide();
    } else {
      $('#printonlinebillButton').show();
    }
    if (onlineorderwindowAccesslevels.store) {
      onlineorderwindowAccesslevels.store.is_visible === INACTIVE
        ? $('#storeSettingsbuttonid').hide()
        : $('#storeSettingsbuttonid').show();
    }

    if (onlineorderwindowAccesslevels.store.item_settings_buttons) {
      onlineorderwindowAccesslevels.store.item_settings_buttons.includes(1)
        ? $('#enableitemsButton').show()
        : $('#enableitemsButton').hide();

      onlineorderwindowAccesslevels.store.item_settings_buttons.includes(2)
        ? $('#disableitemsButton').show()
        : $('#disableitemsButton').hide();

      onlineorderwindowAccesslevels.store.item_settings_buttons.includes(3)
        ? $('#enableallitemsButton').show()
        : $('#enableallitemsButton').hide();

      onlineorderwindowAccesslevels.store.item_settings_buttons.includes(4)
        ? $('#disableallitemsButton').show()
        : $('#disableallitemsButton').hide();
    }

    if (onlineorderwindowAccesslevels.store.option_settings_button) {
      onlineorderwindowAccesslevels.store.option_settings_button.includes(1)
        ? $('#enableOptionsButton').show()
        : $('#enableOptionsButton').hide();

      onlineorderwindowAccesslevels.store.option_settings_button.includes(2)
        ? $('#disableoptionsButton').show()
        : $('#disableoptionsButton').hide();

      onlineorderwindowAccesslevels.store.option_settings_button.includes(3)
        ? $('#enablealloptionsButton').show()
        : $('#enablealloptionsButton').hide();

      onlineorderwindowAccesslevels.store.option_settings_button.includes(4)
        ? $('#disablealloptionsButton').show()
        : $('#disablealloptionsButton').hide();
    }
  }
}

function initAccesslevelsfordigitalorders({ digitalorderwindowAccesslevels }) {
  if (!currentAccesslevels) return;
  if (!digitalorderwindowAccesslevels) {
    parseAccesslevels();
    digitalorderwindowAccesslevels =
      currentAccesslevels && currentAccesslevels.digital_order
        ? currentAccesslevels.digital_order
        : undefined;
  }

  if (digitalorderwindowAccesslevels) {
    if (digitalorderwindowAccesslevels.is_visible === INACTIVE) {
      window.digitalOrderAccessEnabled = false;
      $('#digitalOrdersIcon').hide();
    } else {
      window.digitalOrderAccessEnabled = true;
      $('#digitalOrdersIcon').show();
    }

    if (!window.__IS_MASTER_POS__) {
      window.digitalOrderAccessEnabled = false;
      $('#digitalOrdersIcon').hide();
    }
    window.showPrintBill = currentAccesslevels.digital_order.print_bill;
    if (digitalorderwindowAccesslevels.print_bill === INACTIVE) {
      $('#printdigitalonlinebillButton').hide();
    } else {
      $('#printdigitalonlinebillButton').show();
    }

    window.showPrintKot = currentAccesslevels.digital_order.kot_print;
    if (digitalorderwindowAccesslevels.kot_print === INACTIVE) {
      $('#printdigitalonlinekotButton').hide();
    } else {
      $('#printdigitalonlinekotButton').show();
    }
    if (digitalorderwindowAccesslevels.store) {
      digitalorderwindowAccesslevels?.store?.is_visible === INACTIVE
        ? $('#digiorderstoreSettingsbuttonid').hide()
        : $('#digiorderstoreSettingsbuttonid').show();
    }
  }
}

function initAccesslevelsforonlineorderssettings(onlineorderSettingsaccess) {
  if (!currentAccesslevels) return;
  if (!onlineorderSettingsaccess) {
    parseAccesslevels();
    onlineorderSettingsaccess =
      currentAccesslevels && currentAccesslevels.online_orders
        ? currentAccesslevels.online_orders
        : undefined;
  }
  if (onlineorderSettingsaccess) {
    if (onlineorderSettingsaccess.store) {
      onlineorderSettingsaccess.store.store_setting === INACTIVE
        ? $('.storesettingsTabs li:nth-child(1)').hide()
        : $('.storesettingsTabs li:nth-child(1)').show();

      onlineorderSettingsaccess.store.item_setting === INACTIVE
        ? $('.storesettingsTabs li:nth-child(2)').hide()
        : $('.storesettingsTabs li:nth-child(2)').show();

      onlineorderSettingsaccess.store.option_setting === INACTIVE
        ? $('.storesettingsTabs li:nth-child(4)').hide()
        : $('.storesettingsTabs li:nth-child(4)').show();

      onlineorderSettingsaccess.store.category_setting === INACTIVE
        ? $('.storesettingsTabs li:nth-child(3)').hide()
        : $('.storesettingsTabs li:nth-child(3)').show();

      if (onlineorderSettingsaccess.store.item_settings_buttons) {
        $('#itemsettingstabdivId .platformsactionsContainer button').show();
        const { item_settings_buttons } = onlineorderSettingsaccess.store;
        if (
          item_settings_buttons &&
          Array.isArray(item_settings_buttons) &&
          item_settings_buttons.length
        ) {
          forEach(ONLINESTORE_SETTINGS_ITEMOPTION_BUTTONS, (status) => {
            if (item_settings_buttons.includes(status)) {
              $(
                `#itemsettingstabdivId .platformsactionsContainer button[accesslevel-value=${status}]`,
              ).show();
            } else {
              $(
                `#itemsettingstabdivId .platformsactionsContainer button[accesslevel-value=${status}]`,
              ).hide();
            }
          });
        }
      }

      if (onlineorderSettingsaccess.store.option_settings_button) {
        $(
          '#storeoptionsssettingstabdivId .platformsactionsContainer button',
        ).show();
        const { option_settings_button } = onlineorderSettingsaccess.store;
        if (
          option_settings_button &&
          Array.isArray(option_settings_button) &&
          option_settings_button.length
        ) {
          forEach(ONLINESTORE_SETTINGS_ITEMOPTION_BUTTONS, (status) => {
            if (option_settings_button.includes(status)) {
              $(
                `#storeoptionsssettingstabdivId .platformsactionsContainer button[accesslevel-value=${status}]`,
              ).show();
            } else {
              $(
                `#storeoptionsssettingstabdivId .platformsactionsContainer button[accesslevel-value=${status}]`,
              ).hide();
            }
          });
        }
      }

      // store-other-settings-container-1
    }

    if (onlineorderSettingsaccess.other) {
      onlineorderSettingsaccess.other.send_notification === INACTIVE
        ? $('.store-other-settings-container-1').hide()
        : $('.store-other-settings-container-1').show();

      onlineorderSettingsaccess.other.send_notification === INACTIVE
        ? $('#notificationSettingsWrapperid').attr(
            'style',
            'display: none !important',
          )
        : $('#notificationSettingsWrapperid').show();

      onlineorderSettingsaccess.other.auto_accept_order === INACTIVE
        ? $('#autoacceptSettingsWrapperid').attr(
            'style',
            'display: none !important',
          )
        : $('#autoacceptSettingsWrapperid').show();
    }
  }
}

function initAccesslevelsfordigitalorderssettings(digitalorderSettingsaccess) {
  if (!currentAccesslevels) return;
  if (!digitalorderSettingsaccess) {
    parseAccesslevels();
    digitalorderSettingsaccess =
      currentAccesslevels && currentAccesslevels.digital_order
        ? currentAccesslevels.digital_order
        : undefined;
  }
  if (digitalorderSettingsaccess) {
    if (digitalorderSettingsaccess.store) {
      // digitalorderSettingsaccess?.store?.store_setting === INACTIVE
      //   ? $('.digistoresettingsTabs li:nth-child(1)').hide()
      //   : $('.digistoresettingsTabs li:nth-child(1)').show();
      if (digitalorderSettingsaccess?.store?.store_setting === INACTIVE) {
        $('.digistoresettingsTabs li:nth-child(1)').hide();
        $('#digistoressettingstabdivId').hide();
      } else {
        $('.digistoresettingsTabs li:nth-child(1)').show();
        $('#digistoressettingstabdivId').show();
      }

      if (digitalorderSettingsaccess?.store?.item_setting === INACTIVE) {
        $('.digistoresettingsTabs li:nth-child(2)').hide();
        $('.digitalstoreItemscontainer').hide();
      } else {
        $('.digistoresettingsTabs li:nth-child(2)').show();
        $('.digitalstoreItemscontainer').show();
      }
      // digitalorderSettingsaccess?.store?.item_setting === INACTIVE
      //   ? $('.digistoresettingsTabs li:nth-child(2)').hide()
      //   : $('.digistoresettingsTabs li:nth-child(2)').show();

      if (digitalorderSettingsaccess?.store?.option_setting === INACTIVE) {
        $('.digistoresettingsTabs li:nth-child(4)').hide();
        // $('#digistoreoptionsssettingstabdivId').hide();
      } else {
        $('.digistoresettingsTabs li:nth-child(4)').show();
        // $('#digistoreoptionsssettingstabdivId').show();
      }
      // digitalorderSettingsaccess?.store?.option_setting === INACTIVE
      //   ? $('.digistoresettingsTabs li:nth-child(4)').hide()
      //   : $('.digistoresettingsTabs li:nth-child(4)').show();

      if (digitalorderSettingsaccess?.store?.category_setting === INACTIVE) {
        $('.digistoresettingsTabs li:nth-child(3)').hide();
        // $('#digistorecatssettingstabdivId').hide();
      } else {
        $('.digistoresettingsTabs li:nth-child(3)').show();
        // $('#digistorecatssettingstabdivId').show();
      }
      // digitalorderSettingsaccess?.store?.category_setting === INACTIVE
      //   ? $('.digistoresettingsTabs li:nth-child(3)').hide()
      //   : $('.digistoresettingsTabs li:nth-child(3)').show();
    }
  }
}

function setAccesslevelfordinein(dineinacessLevels) {
  if (!currentAccesslevels) return;
  if (!dineinacessLevels) {
    parseAccesslevels();
    dineinacessLevels = currentAccesslevels.order_window.dine_in;
  }
  if (dineinacessLevels) {
    const dinekotLevels = dineinacessLevels.kot;
    if (dinekotLevels) {
      if (dinekotLevels.is_visible === INACTIVE) {
        $('a#kottabID').hide();
        $('.tabsContainer div#tab1').hide();
      } else {
        $('a#kottabID').show();
        // $('.tabsContainer div#tab1').show();
      }

      dinekotLevels.view_customer_history === INACTIVE
        ? $('#customerhistoryButton').hide()
        : $('#customerhistoryButton').show();
      dinekotLevels.show_on_bill === INACTIVE
        ? $('#showOnBilllabelcheckid').hide()
        : $('#showOnBilllabelcheckid').show();
      dinekotLevels.save === INACTIVE
        ? $('#savekotButton').hide()
        : $('#savekotButton').show();
      dinekotLevels.save_and_print === INACTIVE
        ? $('#print_n_savekotButton').hide()
        : $('#print_n_savekotButton').show();

      dinekotLevels.print_kot_and_bill === ENABLED
        ? $('#PrintKotAndBillButton').show()
        : $('#PrintKotAndBillButton').hide();
      dinekotLevels.item_as_complementory === INACTIVE
        ? $('.context-menu-visible').hide()
        : $('.context-menu-visible').show();
    }

    const dinebillLevels = dineinacessLevels?.billing;
    if (dinebillLevels) {
      if (dinebillLevels.is_visible === INACTIVE) {
        $('a#billtabID').hide();
        $('.tabsContainer div#tab2').hide();
      } else {
        $('a#billtabID').show();
        $('.tabsContainer div#tab2').show();
      }

      dinebillLevels.preview === INACTIVE
        ? $('#previewButton').hide()
        : $('#previewButton').show();
      dinebillLevels.draft_print === INACTIVE
        ? $('#draftprintButton').hide()
        : $('#draftprintButton').show();
      dinebillLevels.add_coupon === INACTIVE
        ? $('#coupondiscountButton').hide()
        : $('#coupondiscountButton').show();
      dinebillLevels.add_discount === INACTIVE
        ? $('#discountButton').hide()
        : $('#discountButton').show();
      dinebillLevels.add_payment === INACTIVE
        ? $('#paymentButton,#paymentButton2').hide()
        : $('#paymentButton,#paymentButton2').show();
      dinebillLevels.add_charges === INACTIVE
        ? $('#chargesButton').hide()
        : $('#chargesButton').show();
      dinebillLevels.modify_bill_status === INACTIVE
        ? $('#billstatusButton').hide()
        : $('#billstatusButton').show();
      dinebillLevels.send_ebill === INACTIVE
        ? $('#ebillBilllabelcheckid').hide()
        : $('#ebillBilllabelcheckid').show();
      dinebillLevels.save_bill === INACTIVE
        ? $('#saveBillbutton').hide()
        : $('#saveBillbutton').show();
      // dinebillLevels.save_and_print_bill === INACTIVE
      //   ? $('#print_n_savebillButton').hide()
      //   : $('#print_n_savebillButton').show();

      window.dineinPrintBillAccessLevel = dinebillLevels.save_and_print_bill;
      if (dinebillLevels.save_and_print_bill === INACTIVE) {
        $('#print_n_savebillButton').hide();
      } else {
        if ($('#print_n_savebillButton').is(':visible'))
          $('#print_n_savebillButton').show();
      }
      dinebillLevels.paid === INACTIVE
        ? $('#settlebillButton').hide()
        : $('#settlebillButton').show();

      dinebillLevels.reprint_bill === INACTIVE
        ? (window.reprintBill = false)
        : (window.reprintBill = true);

      if (dinebillLevels?.old_kot) {
        window.dineinOldKotAccess = dinebillLevels?.old_kot;
        dinebillLevels.old_kot.is_visible === INACTIVE
          ? $('#oldkotButton').hide()
          : $('#oldkotButton').show();
      }

      if (!window.__IS_MASTER_POS__) {
        window.dineinOldKotAccess = dineinacessLevels.old_kot;
      }
      if (dinebillLevels.split_bill) {
        dinebillLevels.split_bill.is_visible === INACTIVE
          ? $('#splitbillButton').hide()
          : $('#splitbillButton').show();
      }
    }

    if (!window.__IS_MASTER_POS__) {
      window.dineinOldKotAccess = dineinacessLevels.old_kot;
      if (dineinacessLevels?.old_kot) {
        window.dineinOldKotAccess = dineinacessLevels?.old_kot;
        dineinacessLevels.old_kot.is_visible === INACTIVE
          ? $('#oldkotButton').hide()
          : $('#oldkotButton').show();
      }

      if (dineinacessLevels.split_bill) {
        dineinacessLevels.split_bill.is_visible === INACTIVE
          ? $('#splitbillButton').hide()
          : $('#splitbillButton').show();
      }
    }
  }
}

async function setaccessLevelsfortakeaway(tahdaccessLevels) {
  if (!currentAccesslevels) return;
  if (!tahdaccessLevels) tahdaccessLevels = currentAccesslevels.order_window.ta;
  // switch (type) {
  //   case TAKEAWAY_FLAG_ID:
  //     if (!tahdaccessLevels)
  //       tahdaccessLevels = currentAccesslevels.order_window.ta;
  //     break;
  //   case HOMED_FLAG_ID:
  //     if (!tahdaccessLevels)
  //       tahdaccessLevels = currentAccesslevels.order_window.hd;
  //     break;
  //   default:
  //     tahdaccessLevels = undefined;
  //     break;
  // }

  if (tahdaccessLevels) {
    window.isTakeawaybilltabEnabled = true;
    tahdaccessLevels.new_order === INACTIVE
      ? $('#takeawayneworderButtonid').hide()
      : $('#takeawayneworderButtonid').show();

    const tahdkotLevels = tahdaccessLevels.kot;
    if (tahdkotLevels) {
      if (tahdkotLevels.is_visible === INACTIVE) {
        window.takeawayDisabled = true;
      }
      if (tahdkotLevels.is_visible === INACTIVE) {
        $('a#takeawaykotTab').hide();
        $('#takeawaykotTabid').hide();
      } else {
        $('a#takeawaykotTab').show();
      }

      tahdkotLevels.view_customer_history === INACTIVE
        ? $('#takeawaycustomerhistoryButton').hide()
        : $('#takeawaycustomerhistoryButton').show();
      tahdkotLevels.show_on_bill === INACTIVE
        ? $('#showOntakeawayBilllabelcheckid').hide()
        : $('#showOntakeawayBilllabelcheckid').show();
      tahdkotLevels.save === INACTIVE
        ? $('#takeawaysavekotButton').hide()
        : $('#takeawaysavekotButton').show();
      tahdkotLevels.save_and_print === INACTIVE
        ? $('#takeawayprint_n_savekotButton').hide()
        : $('#takeawayprint_n_savekotButton').show();

      tahdkotLevels.print_kot_and_bill === ENABLED
        ? $('#saveTakeawayKOTAndBill').show()
        : $('#saveTakeawayKOTAndBill').hide();
    }

    const tahdbillLevels = tahdaccessLevels.billing;
    if (tahdbillLevels) {
      if (tahdbillLevels.is_visible === INACTIVE) {
        $('a#takeawaybillTab').hide();
        window.isTakeawaybilltabEnabled = false;
        // $('.takeawaytabsContainer div#takeawaybillTabid').hide();
      } else {
        $('a#takeawaybillTab').show();
        // $('.takeawaytabsContainer div#takeawaybillTabid').show();
      }
      // Start from here
      tahdbillLevels.preview === INACTIVE
        ? $('#takeawaypreviewButton').hide()
        : $('#takeawaypreviewButton').show();
      tahdbillLevels.draft_print === INACTIVE
        ? $('#takeawaydraftprintButton').hide()
        : $('#takeawaydraftprintButton').show();
      tahdbillLevels.add_coupon === INACTIVE
        ? $('#tacoupondiscountButton').hide()
        : $('#tacoupondiscountButton').show();
      tahdbillLevels.add_discount === INACTIVE
        ? $('#takeawaydiscountButton').hide()
        : $('#takeawaydiscountButton').show();
      tahdbillLevels.add_payment === INACTIVE
        ? $('#takeawaypaymentButton,#takeawaypaymentButton2').hide()
        : $('#takeawaypaymentButton,#takeawaypaymentButton2').show();
      tahdbillLevels.add_charges === INACTIVE
        ? $('#takeawaychargesButton').hide()
        : $('#takeawaychargesButton').show();
      tahdbillLevels.modify_bill_status === INACTIVE
        ? $('#takeawaybillstatusButton').hide()
        : $('#takeawaybillstatusButton').show();
      tahdbillLevels.send_ebill === INACTIVE
        ? $('#takeawayebillBilllabelcheckid').hide()
        : $('#takeawayebillBilllabelcheckid').show();
      tahdbillLevels.save_bill === INACTIVE
        ? $('#savetakeawayBillbutton').hide()
        : $('#savetakeawayBillbutton').show();
      window.takeawayPrintBillAccessLevel = tahdbillLevels.save_and_print_bill;
      tahdbillLevels.save_and_print_bill === INACTIVE
        ? $('#print_n_savetakeawayBillbutton').hide()
        : $('#print_n_savetakeawayBillbutton').show();
      tahdbillLevels.paid === INACTIVE
        ? $('#takeawaysettlebillButton').hide()
        : $('#takeawaysettlebillButton').show();

      tahdbillLevels.order_note === ENABLED
        ? $('#taOrdernoteButton').show()
        : $('#taOrdernoteButton').hide();

      if (tahdbillLevels.old_kot) {
        window.takeawayOldKotAccess = tahdbillLevels.old_kot;
        tahdbillLevels.old_kot.is_visible === INACTIVE
          ? $('#takeawayoldkotButton').hide()
          : $('#takeawayoldkotButton').show();
      }

      if (tahdbillLevels.split_bill) {
        tahdbillLevels.split_bill.is_visible === INACTIVE
          ? $('#tasplitbillButton').hide()
          : $('#tasplitbillButton').show();
      }
    }

    if (!window.__IS_MASTER_POS__) {
      window.takeawayOldKotAccess = tahdaccessLevels.old_kot;
      if (tahdaccessLevels?.old_kot) {
        window.takeawayOldKotAccess = tahdaccessLevels?.old_kot;
        tahdaccessLevels.old_kot.is_visible === INACTIVE
          ? $('#takeawayoldkotButton').hide()
          : $('#takeawayoldkotButton').show();
      }

      if (tahdaccessLevels.split_bill) {
        tahdaccessLevels.split_bill.is_visible === INACTIVE
          ? $('#tasplitbillButton').hide()
          : $('#tasplitbillButton').show();
      }
    }
  }
}

async function setaccessLevelsfordelivery(deliveryAccessLevels) {
  if (!currentAccesslevels) return;
  if (!deliveryAccessLevels)
    deliveryAccessLevels = currentAccesslevels.order_window.hd;

  if (deliveryAccessLevels) {
    window.isDeliverybilltabEnabled = true;
    deliveryAccessLevels.new_order === INACTIVE
      ? $('#deliveryneworderButtonid').hide()
      : $('#deliveryneworderButtonid').show();

    deliveryAccessLevels.select_delivery_boy === INACTIVE
      ? $('#selectdeliveryboybutton').hide()
      : $('#selectdeliveryboybutton').show();

    const deliverykotLevels = deliveryAccessLevels.kot;
    if (deliverykotLevels) {
      if (deliverykotLevels.is_visible === INACTIVE) {
        $('a#deliverykotTab').hide();
        $('#deliverykotTabid').hide();
      } else {
        $('a#deliverykotTab').show();
      }

      deliverykotLevels.view_customer_history === INACTIVE
        ? $('#deliverycustomerhistoryButton').hide()
        : $('#deliverycustomerhistoryButton').show();
      deliverykotLevels.show_on_bill === INACTIVE
        ? $('#showOndeliveryBilllabelcheckid').hide()
        : $('#showOndeliveryBilllabelcheckid').show();
      deliverykotLevels.save === INACTIVE
        ? $('#takeawaysavekotButton').hide()
        : $('#takeawaysavekotButton').show();
      deliverykotLevels.save_and_print === INACTIVE
        ? $('#deliveryprint_n_savekotButton').hide()
        : $('#deliveryprint_n_savekotButton').show();

      deliverykotLevels.print_kot_and_bill === ENABLED
        ? $('#saveDeliveryKOTAndBill').show()
        : $('#saveDeliveryKOTAndBill').hide();
    }

    const deliverybillLevels = deliveryAccessLevels.billing;
    if (deliverybillLevels) {
      if (deliverybillLevels.is_visible === INACTIVE) {
        window.deliveryDisabled = true;
      }
      if (deliverybillLevels.is_visible === INACTIVE) {
        $('a#deliverybillTab').hide();
        window.isDeliverybilltabEnabled = false;
        // $('.takeawaytabsContainer div#takeawaybillTabid').hide();
      } else {
        $('a#deliverybillTab').show();
        // $('.takeawaytabsContainer div#takeawaybillTabid').show();
      }

      // Start from here
      deliverybillLevels.preview === INACTIVE
        ? $('#deliverypreviewButton').hide()
        : $('#deliverypreviewButton').show();
      deliverybillLevels.draft_print === INACTIVE
        ? $('#deliverydraftprintButton').hide()
        : $('#deliverydraftprintButton').show();
      deliverybillLevels.add_coupon === INACTIVE
        ? $('#deliverycoupondiscountButton').hide()
        : $('#deliverycoupondiscountButton').show();
      deliverybillLevels.add_discount === INACTIVE
        ? $('#deliverydiscountButton').hide()
        : $('#deliverydiscountButton').show();
      deliverybillLevels.add_payment === INACTIVE
        ? $('#deliverypaymentButton,#deliverypaymentButton2').hide()
        : $('#deliverypaymentButton,#deliverypaymentButton2').show();
      deliverybillLevels.add_charges === INACTIVE
        ? $('#deliverychargesButton').hide()
        : $('#deliverychargesButton').show();
      deliverybillLevels.modify_bill_status === INACTIVE
        ? $('#deliverybillstatusButton').hide()
        : $('#deliverybillstatusButton').show();
      deliverybillLevels.send_ebill === INACTIVE
        ? $('#deliveryebillBilllabelcheckid').hide()
        : $('#deliveryebillBilllabelcheckid').show();
      deliverybillLevels.save_bill === INACTIVE
        ? $('#savedeliveryBillbutton').hide()
        : $('#savedeliveryBillbutton').show();
      window.deliveryPrintBillAccessLevel =
        deliverybillLevels.save_and_print_bill;
      deliverybillLevels.save_and_print_bill === INACTIVE
        ? $('#print_n_savedeliveryBillbutton').hide()
        : $('#print_n_savedeliveryBillbutton').show();
      deliverybillLevels.paid === INACTIVE
        ? $('#deliverysettlebillButton').hide()
        : $('#deliverysettlebillButton').show();
      deliverybillLevels.order_note === ENABLED
        ? $('#deliveryOrdernoteButton').show()
        : $('#deliveryOrdernoteButton').hide();

      if (deliverybillLevels.old_kot) {
        window.takeawayOldKotAccess = deliverybillLevels.old_kot;
        deliverybillLevels.old_kot.is_visible === INACTIVE
          ? $('#deliveryoldkotButton').hide()
          : $('#deliveryoldkotButton').show();
      }

      if (deliverybillLevels.split_bill) {
        deliverybillLevels.split_bill.is_visible === INACTIVE
          ? $('#deliverysplitbillButton').hide()
          : $('#deliverysplitbillButton').show();
      }
    }
  }
}

function setOldkotlevelstatus(oldkotaccessLevels, type) {
  if (!oldkotaccessLevels) {
    parseAccesslevels();
  }
  if (!currentAccesslevels) return;
  switch (type) {
    case DINEIN_FLAG_ID:
      if (!oldkotaccessLevels)
        oldkotaccessLevels =
          currentAccesslevels?.order_window?.dine_in?.billing?.old_kot;
      if (!window.__IS_MASTER_POS__) {
        oldkotaccessLevels =
          currentAccesslevels?.order_window?.dine_in?.old_kot;
      }
      break;
    case TAKEAWAY_FLAG_ID:
      if (!oldkotaccessLevels)
        oldkotaccessLevels =
          currentAccesslevels?.order_window?.ta?.billing?.old_kot;
      if (!window.__IS_MASTER_POS__) {
        oldkotaccessLevels =
          currentAccesslevels?.order_window?.hd?.billing.old_kot;
      }
      break;
    case HOMED_FLAG_ID:
      if (!oldkotaccessLevels)
        oldkotaccessLevels =
          currentAccesslevels?.order_window?.hd?.billing?.old_kot;
      if (!window.__IS_MASTER_POS__) {
        oldkotaccessLevels =
          currentAccesslevels?.order_window?.takeaway?.old_kot;
      }
      break;
    default:
      break;
  }

  if (oldkotaccessLevels) {
    if (oldkotaccessLevels.print_kot === INACTIVE) {
      $('#printkotlabelCheck,#printoldkotButton').hide();
    } else {
      $('#printkotlabelCheck,#printoldkotButton').show();
    }
    oldkotaccessLevels.print_cancel_kot === INACTIVE
      ? $('#cancelkotlabelCheck').hide()
      : $('#cancelkotlabelCheck').show();

    window.delete_kot_access = oldkotaccessLevels.delete_kot;
    window.transfer_item_access = oldkotaccessLevels.transfer_item;

    oldkotaccessLevels.delete_kot === INACTIVE
      ? $('#deleteoldkotButton').hide()
      : $('#deleteoldkotButton').show();

    if (oldkotaccessLevels.cancel_kot === INACTIVE) {
      $('#canceloldkotButton').hide();
    } else {
      $('#canceloldkotButton').show();
    }

    if (oldkotaccessLevels.check_kot_print === INACTIVE) {
      $('#checkKotsPrintButton').hide();
    } else {
      $('#checkKotsPrintButton').show();
    }

    oldkotaccessLevels.transfer_item === INACTIVE
      ? $('#transferitemButton').hide()
      : $('#transferitemButton').show();
    !oldkotaccessLevels.item_as_complementory ||
    oldkotaccessLevels.item_as_complementory === INACTIVE
      ? $('#oldkotmakecomplimentaryButtonid').hide()
      : $('#oldkotmakecomplimentaryButtonid').show();
  }
}

function setSplitbillwindowaccess(splitbillaccessLevels, type) {
  if (!splitbillaccessLevels) {
    parseAccesslevels();
  }
  if (currentAccesslevels) {
    switch (type) {
      case DINEIN_FLAG_ID:
        if (!splitbillaccessLevels)
          splitbillaccessLevels =
            currentAccesslevels.order_window.dine_in.billing.split_bill;
        break;
      case TAKEAWAY_FLAG_ID:
        if (!splitbillaccessLevels)
          splitbillaccessLevels =
            currentAccesslevels.order_window.ta?.billing?.split_bill ||
            currentAccesslevels.order_window.takeaway?.billing?.split_bill;
        break;
      case HOMED_FLAG_ID:
        if (!splitbillaccessLevels)
          splitbillaccessLevels =
            currentAccesslevels.order_window.hd?.billing.split_bill;
        break;
      default:
        break;
    }
    if (splitbillaccessLevels) {
      splitbillaccessLevels.item_wise === INACTIVE
        ? $('#split-itemwise-tab,#split-itemwise-container-id').hide()
        : $('#split-itemwise-tab').show();
      splitbillaccessLevels.portion_wise === INACTIVE
        ? $('#split-portionwise-tab').hide()
        : $('#split-portionwise-tab').show();
      splitbillaccessLevels.percentage_wise === INACTIVE
        ? $('#split-percentwise-tab').hide()
        : $('#split-percentwise-tab').show();
    }
  }
}

function inittoplevelsAccess() {
  parseAccesslevels();
  if (currentAccesslevels) {
    // Check for dashboard access levels
    if (currentAccesslevels.dashboard) {
      initAccesslevelsfordashboard(currentAccesslevels.dashboard);
    }
    if (currentAccesslevels.order_window) {
      initAccesslevelsfororders({
        orderwindowAccesslevels: currentAccesslevels.order_window,
      });
    }

    if (currentAccesslevels.order_settlement_window) {
      initAccesslevelsfororderSettlementWindow({
        orderSettlementwindowAccesslevels:
          currentAccesslevels.order_settlement_window,
      });
    }
    if (currentAccesslevels.order_window) {
      initAccesslevelsforonlineorders({
        onlineorderwindowAccesslevels: currentAccesslevels.online_orders,
      });
    }

    if (currentAccesslevels.receipts) {
      initAccesslevelsforreceipts(currentAccesslevels.receipts);
    }
    if (currentAccesslevels.reports) {
      initAccesslevelsforreports(currentAccesslevels.reports);
    }
    if (currentAccesslevels.master_management) {
      initAccesslevelsformasters(currentAccesslevels.master_management);
    }
    if (currentAccesslevels.settings) {
      initAccesslevelsforsettings(currentAccesslevels.settings);
    }
    if (currentAccesslevels.menu_management) {
      initAccesslevelsformenuManagement(currentAccesslevels.menu_management);
    }
    if (currentAccesslevels.switch_outlet) {
      currentAccesslevels.switch_outlet.is_visible === INACTIVE
        ? $('#changeStoreicon').hide()
        : $('#changeStoreicon').show();
    }

    if (currentAccesslevels.custom_links) {
      currentAccesslevels.custom_links.is_visible === INACTIVE
        ? $('#customLinksIconId').hide()
        : $('#customLinksIconId').show();
    } else {
      $('#customLinksIconId').hide();
    }

    if (currentAccesslevels.digital_order) {
      window.isDigitalOrderVisible =
        currentAccesslevels.digital_order.is_visible;
      initAccesslevelsfordigitalorders({
        digitalorderwindowAccesslevels: currentAccesslevels.digital_order,
      });
    }
  }
}

function resetCurrentaccesslevel() {
  currentAccesslevels = undefined;
  parseAccesslevels();
}

function initAccountAccessLevels(account) {
  if (!currentAccesslevels) return;
  if (!account) {
    parseAccesslevels();
    account =
      currentAccesslevels && currentAccesslevels?.menu_management
        ? currentAccesslevels?.menu_management.account
        : undefined;
  }
  if (account) {
    account.close_day === INACTIVE
      ? $('#closeDayCardid').hide()
      : $('#closeDayCardid').show();

    account.close_shift === INACTIVE
      ? $('#closeShiftCardid').hide()
      : $('#closeShiftCardid').show();
    if (account && account.close_day_window) {
      account.close_day_window.payment_transaction_summary === INACTIVE
        ? $('.closeDayTransactionsTableContaierClass').hide()
        : $('.closeDayTransactionsTableContaierClass').show();

      account.close_day_window.transaction_count === ENABLED
        ? $('.closeDayTransactionCount').hide()
        : $('.closeDayTransactionCount').show();

      account.close_day_window.settle_amount === ENABLED
        ? $('.closeDaySettledAmount').hide()
        : $('.closeDaySettledAmount').show();

      account.close_day_window.variance_amount === ENABLED
        ? $('.closeDayVarianceAmount').hide()
        : $('.closeDayVarianceAmount').show();
    }
  }

  if (account && account.close_shift_window) {
    account.close_shift_window.transaction_count === ENABLED
      ? $('.closeShiftTransactionCount').hide()
      : $('.closeShiftTransactionCount').show();

    account.close_shift_window.settle_amount === ENABLED
      ? $('.closeShiftSettledAmount').hide()
      : $('.closeShiftSettledAmount').show();

    account.close_shift_window.variance_amount === ENABLED
      ? $('.closeShiftVarianceAmount').hide()
      : $('.closeShiftVarianceAmount').show();
  }

  if (account.cash_drawer) {
    $('#openCashDrawerOnCloseDayAndShiftbuttonid').show();
    $('#openCashDrawerOnCloseShiftbuttonid').show();
    $('#openCashDrawerOnStartDayAndShiftbuttonid').show();
    $('#openCashDrawerOnStartShiftbuttonid').show();
    $('#openCashDrawerOnExpensesbuttonid').show();
  } else {
    $('#openCashDrawerOnCloseDayAndShiftbuttonid').hide();
    $('#openCashDrawerOnCloseShiftbuttonid').hide();
    $('#openCashDrawerOnStartDayAndShiftbuttonid').hide();
    $('#openCashDrawerOnStartShiftbuttonid').hide();
    $('#openCashDrawerOnExpensesbuttonid').hide();
  }

  if (!window.__IS_MASTER_POS__) {
    $('#closeDayCardid').hide();
  }
}

module.exports = {
  initAccesslevelsfordigitalorderssettings,
  initAccesslevelsforonlineorderssettings,
  resetCurrentaccesslevel,
  setSplitbillwindowaccess,
  inittoplevelsAccess,
  initAccesslevelsfordashboard,
  initAccesslevelsfororders,
  setOldkotlevelstatus,
  initAccesslevelsforreceipts,
  initAccesslevelsforreports,
  initAccesslevelsformasters,
  initAccesslevelsforsettings,
  getdepartmentstoInclude,
  getitemcatstoInclude,
  isItemcomplimentaryavailable,
  checkduePaymentaccess,
  initAccesslevelsforonlineorders,
  initAccesslevelsformenuManagement,
  setAccesslevelforitemManangement,
  initAccesslevelsfororderSettlementWindow,
  initAccountAccessLevels,
  isChangeItemPriceavailable,
};
