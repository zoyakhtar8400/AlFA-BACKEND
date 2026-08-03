const SERVER_MESSAGE_RECEIVED = 'server-message-received';
const SHOW_NOTIFICATION = 'show-notification';
const STORE_SWITCH_COMPLETED = 'store-switch-completed';
const CHECKIF_DAYISTARTED = 'check-ifdaystarted';
const CHECKIF_DAYISTARTED_REPLY = 'check-ifdaystarted-reply';
const SHOW_CLOSE_DAY_WINDOW = 'show-close-day-window';

const CHECK_USERSHIFTSTARTED = 'check-usershiftstarted';
const CHECK_USERSHIFTSTARTED_REPLY = 'check-usershiftstarted-reply';
const CHECK_PRECLOSESHIFT = 'check-precloseshift';
const CHECK_PRECLOSESHIFT_REPLY = 'check-precloseshift-reply';
const START_USERSHIFT = 'start-usershift';
const START_USERSHIFT_REPLY = 'start-usershift-reply';
const CLOSE_DAY = 'close-day';
const CLOSE_DAY_REPLY = 'close-day-reply';
const CLOSE_SHIFT = 'close-shift';
const CLOSE_SHIFT_REPLY = 'close-shift-reply';

const LOAD_MENU = 'load-menu';
const LOAD_MENU_REPLY = 'load-menu-reply';

const SET_KOT_INACTIVE = 'set-kot-inactive';
const SET_KOT_INACTIVE_REPLY = 'set-kot-inactive-reply';

const INIT_SYNC = 'init-sync';
const INIT_SYNC_REPLY = 'init-sync-reply';

const GET_BUSY_TABLES = '';
const GET_BUSY_TABLES_REPLY = '';

const SAVE_KOT = 'save-kot';
const SAVE_KOT_REPLY = 'save-kot-reply';

const SAVE_BILL = 'save-bill';
const SAVE_BILL_REPLY = 'save-bill-reply';
const GET_BILLS = 'get-bills';
const GET_BILLS_REPLY = 'get-bills-reply';
const SETTLE_BILL = 'settle-bill';
const SETTLE_BILL_REPLY = 'settle-bill-reply';

const SETTLE_QUICK_BILL = 'settle-quickbill';
const SETTLE_QUICK_BILL_REPLY = 'settle-quickbill-reply';

const GET_SETTNGS = 'get-settings';
const GET_SETTNGS_REPLY = 'get-settings-reply';

const UPDATE_SETTNGS = 'update-settings';
const UPDATE_SETTNGS_REPLY = 'update-settings-reply';

const GET_ORDERWINDOW_DETAILS = 'get-orderwindow-details';
const GET_ORDERWINDOW_DETAILS_REPLY = 'get-orderwindow-details-reply';

const DELETE_TABLE = 'delete-table';
const DELETE_TABLE_REPLY = 'delete-table-reply';

const UPDATE_TABLECOLOR = 'upate-tablecolor';
const UPDATE_TABLE_COLOR = 'update-table-color';
const UPDATE_TABLECOLOR_REPLY = 'upate-tablecolor-reply';

const UPDATE_TABLESTATE = 'update-tablestate';
const UPDATE_TABLESTATE_REPLY = 'update-tablestate-reply';

const GET_OLD_KOT = 'get-oldkot';
const GET_OLD_KOT_REPLY = 'get-oldkot-reply';

const TRANSFER_OLDKOT = 'transfer-oldkot';
const TRANSFER_OLDKOT_REPLY = 'transfer-oldkot-reply';

const UPDATE_OLDKOTITEM = 'update-oldkotitem';
const UPDATE_OLDKOTITEM_REPLY = 'update-oldkotitem-reply';

const GET_PAYMENTS = 'get-payments';
const GET_PAYMENTS_REPLY = 'get-payments-reply';

const UPDATE_PAYMENTS = 'update-payments';
const UPDATE_PAYMENTS_REPLY = 'update-payments-reply';

const UPDATE_DISCOUNT = 'update-discounts';
const UPDATE_DISCOUNT_REPLY = 'update-discounts-reply';

const UPDATE_CHARGES = 'update-charges';
const UPDATE_CHARGES_REPLY = 'update-charges-reply';

const UPDATE_SELECTEDCUSTOMER = 'update-selectedcustomer';
const UPDATE_SELECTEDCUSTOMER_REPLY = 'update-selectedcustomer-reply';

const ADD_CUSTOMER = 'add-customer';
const ADD_CUSTOMER_REPLY = 'add-customer-reply';

const GET_DISCOUNTS = 'get-discounts';
const GET_DISCOUNTS_REPLY = 'get-discounts-reply';

const CHANGE_TABLE_DETAILS_REPLY = 'change-tabledetails';
const CHANGE_TABLE_DETAILS = 'change-tabledetails-reply';

const FETCH_BILLTABLE_DATA = 'fetch-billtable-data';
const FETCH_BILLTABLE_DATA_REPLY = 'fetch-billtable-data-reply';

const FETCH_KOTBILL_NUMBER = 'fetch-kotbillnumber';
const FETCH_KOTBILL_NUMBER_REPLY = 'fetch-kotbillnumber-reply';
const FETCH_ASYNC_KOTBILL_NUMBER = 'FETCH_ASYNC_KOTBILL_NUMBER';

const UPDATE_DELIVERY_BOY = 'update-deliveryboy';
const UPDATE_DELIVERY_BOY_REPLY = 'update-deliveryboy-reply';
const UPDATE_ONLINEDELIVERY_BOY = 'update-onlinedeliveryboy';
const UPDATE_ONLINEDELIVERY_BOY_REPLY = 'update-onlinedeliveryboy-reply';

const GET_SHORTCUTS_REPLY = 'get-shortcuts-reply';
const GET_SHORTCUTS = 'get-shortcuts';

const UPDATE_SHORTCUTS_REPLY = 'update-shortcuts-reply';
const UPDATE_SHORTCUTS = 'update-shortcuts';

const GET_ITEMOPTIONS = 'get-itemoptions';
const GET_ITEMOPTIONS_REPLY = 'get-itemoptions-reply';

const ADD_PRINTER = 'add-printer';
const ADD_PRINTER_REPLY = 'add-printer-reply';

const UDATE_STORE_DETAILS = 'update-store-details';
const UDATE_STORE_DETAILS_REPLY = 'update-store-details-reply';

const GET_STOREDETAILS = 'get-store-details';
const GET_STOREDETAILS_REPLY = 'get-store-details-reply';

const GET_ALLSTORE = 'get-allstores';
const GET_ALLSTORE_REPLY = 'get-allstores-reply';

const SWITCH_STORE = 'switch-store';
const SWITCH_STORE_REPLY = 'switch-store-reply';

const PRINT_PDF = 'printPDF';
const HOTELLOGO_MODIFIED = 'hotellogo-modified';

const SAVE_ONLINEBILL = 'save-onlinebill';
const SAVE_ONLINEBILL_REPLY = 'save-onlinebill-reply';
const SETTLE_ONLINEBILL = 'settle-onlinebill';
const SETTLE_ONLINEBILL_REPLY = 'settle-onlinebill-reply';
const SPLIT_TABLE = 'split-table';
const SPLIT_TABLE_REPLY = 'split-table-reply';
const MERGE_TABLE_REPLY = 'merge-table-reply';
const MERGE_TABLE = 'merge-table';

const PULL_DIGITALORDER = 'pull-digitalorder';
const UPDATE_ONLINEORDER_STATUS_REPLY = 'update-onlineorder-status-reply';
const UPDATE_ONLINEORDER_STATUS = 'update-onlineorder-status';
const GET_PAYMENTS_ASYNC = 'get-paymentmethods-async';
const ASYNC_LISTEN_CUSTOMER_UPDATES = 'listen-customerupdate-async';
const NEW_STORE_ADDED_UPDATED = 'NEW_STORE_ADDED_UPDATED';

const RELOAD_APP = 'RELOAD_APP_IPC';
const DESTROY_USER_SESSION = 'DESTROY_USER_SESSION';
const REMOTE_FORCE_LOGUT = 'REMOTE_FORCE_LOGUT_ASYNC';

const LOGOUT_ON_CLOSE_DAY_SHIFT = 'logout-on-close-day-shift';

const GET_PAYMENT_MODES_FOR_STRIP = 'get-payment-modes-for-strip';
const GET_PAYMENT_MODES_FOR_STRIP_REPLY = 'get-payment-modes-for-strip-reply';

const CHECK_IFBILL_IS_RUNNING = 'check-ifbill-is-running';
const CHECK_IFBILL_IS_RUNNING_REPLY = 'check-ifbill-is-running-reply';

const GET_REPORT_NUMBER = 'get-report-number';
const GET_REPORT_NUMBER_REPLY = 'get-report-number-reply';

const OPEN_DIALOG_FOR_DIRECTORY = 'open-dialog-for-directory';

const UPDATE_BILL_NUMBER = 'update-bill-number';

const CHECK_BILL_PRINTED = 'check-bill-printed';

const GET_ITEMS_BY_PRODUCT_GROUP = 'get-items-by-product-group';

const GET_ALL_PRODUCT_GROUP = 'get-all-product-group';

const GET_RUNNING_ORDER_ITEMS = 'get-running-order-items';

const TRANSFER_ITEM_KOT_NUMBER = 'transfer-item-kot-number';

const UPDATE_MALL_REPORT_ID = 'update-mall-report-id';

const UPDATE_FAST_SETTLE_PAYMENT = 'update-fast-settle-payment';
const UPDATE_FAST_SETTLE_PAYMENT_REPLY = 'update-fast-settle-payment-reply';

const CHECK_IS_KOT_ACTIVE_FOR_CSK = 'check-is-kot-active-for-csk';

const UPDATE_ORDERDATA_AS_PER_PAYMENT_INFO =
  'update-orderdata-as-per-payment-info';

const GET_DELIVERY_BOY_DATA = 'get-delivery-boy-data';

const UPDATE_PRINT_STATUS_OF_ORDER = 'update-print-count-of-order';

const STATUS_UPDATED_RELOAD_APP = 'status-updated-reload-app';
const MENU_LOADED_RELOAD_APP = 'menu-loaded-reload-app';
const SAVE_BILL_FOR_CSK = 'save-bill-for-csk';
const SAVE_BILL_FOR_CSK_REPLY = 'save-bill-for-csk-reply';
const FETCH_BILL_DATA_FOR_CSK = 'fetch-bill-data-for-csk';
const FETCH_BILL_DATA_FOR_CSK_REPLY = 'fetch-bill-data-for-csk-reply';

const LOAD_SETTING_REQUEST_FROM_SERVER = 'load-setting-request-from-server';
const LOAD_ACCESS_LEVEL_REQUEST_FROM_SERVER =
  'load-access-level-request-from-server';
const LOAD_USERS_REQUEST_FROM_SERVER = 'load-users-request-from-server';
const LOAD_PAYMENT_MODES_REQUEST_FROM_SERVER =
  'load-payment-modes-request-from-server';

const ADD_BHARATPE_QR_IN_DATABASE = 'add-bharatpe-qr-in-database';
const BILL_NUMBER_RESET_DATE_NOTIFICATION = 'bill-number-date-notification';
const CHECK_IF_ORDER_IS_PULLED = 'check-if-order-is-pulled';
const CHECK_IF_REMOTE_KOT_IS_PULLED = 'check-if-remote-kot-is-pulled';
const PAYMENT_RECEIVED = 'payment-received';
const REFRESH_TABLES_EVENT = 'refresh-tables-event';
const GET_ORDER_TOTAL = ' get-order-total';
const FETCH_BILL_DATA_FOR_CSK_ORDER_TOTAL =
  'fetch-bill-table-data-for-csk-order-total';
const FETCH_BILL_DATA_FOR_CSK_ORDER_TOTAL_REPLY =
  'fetch-bill-table-data-for-csk-order-total-reply';

const SEND_ORDER_TOTAL = 'send-order-total';
const CLOSE_NOTIFICATION_VIEW = 'close-notification-view';
const RETRY_PULL_ONLINE_ORDER = 'retry-pull-online-order';
const SET_LANGUAGE = 'set-language';

const ASSISTANCE_REQUESTED = 'assiatence-required';
const REMOTE_KOT_PLACED = 'remote-kot-placed';
const ITEM_DISCOUNT_APPLIED_UPDATE_KOT_ITEMS =
  'item-discount-applied-update-kot-items';

const FETCH_CATEGORIES_AND_MENU = 'fetch-categories-and-menu';
const START_CATEGORY_SHOW_CRON_JOB = 'start-category-show-job';

const CHECK_ORDER_IS_SAVED = 'check-is-order-saved';

const UPDATE_TIP_AMOUNT_FOR_REMOTE_ORDER = 'update-tip-amount-for-remote-order';
const FETCH_BILL_DATA_FOR_SETTLE_BILL_REPLY =
  'fetch-bill-data-for-settle-bill-reply';

const SETTLE_BILL_IN_BACKGROUND = 'settle-bill-in-background';
const SETTLE_BILL_IN_BACKGROUND_REPLY = 'settle-bill-in-background-reply';

const SET_RESERVATION_ID_TO_TABLE = 'set-reservation-id-to-table';
const CREATE_TABLE_RESERVATION_RECORD = 'create-table-reservation-rescord';

const SEND_BACKGROUND_SETTLEMENT_REQUEST = 'send-background-selltement-request';
const GET_TABLE_ID = 'get-table-id';
const UPDATE_ITEM_DETAILS_LOCALLY = 'update-item-details-locally';
const ADD_ITEM_LOCALLY = 'add-item-locally';
const ADD_CATEGORY_LOCALLY = 'add-category-locally';
const ADD_CATEGORY_LOCALLY_WITHOUT_ACCESS_LEVEL =
  'add-category-locally-without-access-level';
const ADD_KITCHEN_DEPT_LOCALLY = 'add-kitchen-dept-locally';
const UPDATE_CATEGORY_STATUS = 'update-category-status';
const CHECK_FOR_UPDATES = 'check-for-updates';
const EXPORT_TALLY_REPORT = 'export-tally-report';
const SEND_GENERATE_XML_REQUEST = 'send-generate-xml-request';
const DATA_SYNCING_ON_LOGOUT = 'data-syncing-on-logout';
const SHOW_SENT_REPORT_NOTIFICATION = 'show-sent-reporot-notification';
const SEND_SHOW_SENT_REPORT_NOTIFICATION = 'send-show-send-report-notification';
const CHECK_BILL_NUMBER_RESET_IS_VALID = 'check-bill-number-reset-is-valid';
const UPDATE_STOCK_QTY = 'update-stock-qty';
const LOGOUT_USER = 'logout-connected-user';
const OPEN_CASH_DRAWER = 'open-cash-drawer';
const PRINT_CSK_KOT = 'print-csk-kot';
const GET_NEWORRUNNING_KOT_TAG = 'get-runningOrNew-kot-tag';
const TOGGLE_FULLSCREEN = 'toggle-fullscreen';
const LOGOUT_USER_FORCEFULLY = 'logout-user-forcefully';
const UPDATE_ONLINE_ORDER_KDS_KOT_STATUS = 'update-online-order-kds-kot-status';
const SOCKET_EVENT_EMITTER = 'socket-event-emitter';
const EXTEND_CLOSE_DAY_TIME = 'extend-close-day-time';
const SET_STOREDETAILS = 'set-storedetails';
const CUSTOMER_UPDATED = 'customer-updated';
const SET_BUSY_TABLE_DATA = 'set-busy-table-data';
const RESET_FCM_TOKEN = 'reset-fcm-token';

const REPORT_MESSAGES = {
  GET_REPORTDATA: 'get-reportdata',
  GET_REPORTDATA_REPLY: 'get-reportdata-reply',
  GET_STARTENDREPORT_DATA: 'get-startendreport-data',
  GET_STARTENDREPORT_DATA_REPLY: 'get-startendreport-data-reply',
  GET_USERSHIFT_DATA: 'get-usershift-data',
  GET_USERSHIFT_DATA_REPLY: 'get-usershift-data-reply',
};

const MENU_MANAGEMENT_MESSAGES = {
  GET_MENUDATA: 'get-menudata',
  GET_MENUDATA_REPLY: 'get-menudata-reply',
};

const EXPORT_IMPORT_MSG = {
  EXPORT_SETTINGS: 'export-settingsto-csv',
  EXPORT_SETTINGS_REPLY: 'export-settingsto-csv-reply',
  IMPORT_SETTINGS: 'import-settingsto-csv',
  IMPORT_SETTINGS_REPLY: 'import-settingsto-csv-reply',
  EXPORT_PRINTERS: 'export-printersto-csv',
  EXPORT_PRINTERS_REPLY: 'export-printersto-csv-reply',
};

const CAPTAIN_IPC = {
  ADD_CAPTAIN: 'add-captain',
  ADD_CAPTAIN_REPLY: 'add-captain-reply',
  GET_CAPTAINS: 'get-captains',
  GET_CAPTAINS_REPLY: 'get-captains-reply',
};
const ORDER_IPC = {
  CHECK_FORSTARTDAY: 'check-forstartday',
  CHECK_FORSTARTDAY_REPLY: 'check-forstartday-reply',
  CHECK_USERSHIFTSTARTED: 'check-orderusershiftstarted',
  CHECK_USERSHIFTSTARTED_REPLY: 'check-orderusershiftstarted-reply',
  START_DAY: 'startday',
  START_DAY_REPLY: 'startday-reply',
  SENT_REDUCEINVENTORY_REQUEST: 'send-reduceinventory',
  SENT_REDUCEINVENTORY_REQUEST_REPLY: 'send-reduceinventory-reply',
  SENT_REVERSEINVENTORY_REQUEST: 'send-reverseinventory',
  SENT_REVERSEINVENTORY_REQUEST_REPLY: 'send-reverseinventory-reply',
  CHECK_SYNC_STATUS: 'check-sync-status',
  CHECK_SYNC_STATUS_REPLY: 'check-sync-status-reply',
  RE_ADD_CUSTOMERS: 'readd-customers',
  RE_ADD_CUSTOMERS_REPLY: 'readd-customers-reply',
  GET_CUSTOMERS: 'get-customer',
  GET_CUSTOMERS_REPLY: 'get-customer-reply',
  SEND_COUPON_HISTORY: 'send-coupon-history',
  SEND_COUPON_HISTORY_REPLY: 'send-coupon-history-reply',
  GET_ORDER_DETAILS: 'get-orderdetails',
  GET_ORDER_DETAILS_REPLY: 'get-orderdetails-reply',
  GET_WALLET_DETAILS: 'get-walletdetails',
  GET_WALLET_DETAILS_REPLY: 'get-walletdetails-reply',
  GET_DUETRANS_DETAILS: 'get-orderduetrans',
  GET_DUETRANS_DETAILS_REPLY: 'get-orderduetrans-reply',
  UPDATE_TABLESTATUS: 'update-ordertablestatus',
  UPDATE_TABLESTATUS_REPLY: 'get-ordertablestatus-reply',
  GET_LIVESTATUS_DATA: 'get-livestatus',
  UPDATE_LIVEITEMSTATUS_DATA: 'update-liveitemsstatus',
  ADD_UPDATE_CUSTOMER: 'add-update-customer',
  UPDATE_EBILLCHECK_STATUS: 'update-ebillcheckstatus',
  UPDATE_BILLDATA: 'async-update-billdata',
  GET_WAITERS: 'async-get-waiters',
  UPDATE_WAITER: 'async-update-waiter',
  DELETE_STORE_ASYNC: 'delete-store-async',
  INCREMENT_BILL_PRINT_COUNT: 'INCREMENT_BILL_PRINT_COUNT_ASYNC',
  REFRESH_TABLES: 'REFRESH_TABLES',
  GET_ORDER_TABLES: 'GET_ORDER_TABLES',
  GET_ORDER_TABLES_REPLY: 'GET_ORDER_TABLES_REPLY',
  RESYNC_BILLS_BETWEEN_DATE: 'RESYNC_BILLS_BETWEEN_DATE',
  CREATEUPDATE_PRE_ORDER_DATA: 'CREATEUPDATE_PRE_ORDER_DATA',
  FILTER_PRE_ORDER_BYDATE: 'FILTER_PRE_ORDER_BYDATE',
  SHOW_PUSH_NOTIFICATION: 'SHOW_PUSH_NOTIFICATION',
  CHECK_IF_DUE_PAY_EXIST: 'CHECK_IF_DUE_PAY_EXIST',
  GET_SETTNGS_ASYNC: 'GET_SETTNGS_ASYNC',
  GET_STOREDETAILS_ASYNC: 'GET_STOREDETAILS_ASYNC',
  GET_BILL_NUMBER: 'GET_BILL_NUMBER_ASYNC',
  CHECK_IFORDER_SYNCED: 'CHECK_IFORDER_SYNCED_ASYNC',
  SEND_REWARDHISTORY_STATUS_UPDATE: 'SEND_REWARDHISTORY_STATUS_UPDATE',
  SENT_MULTIPLE_REDUCEINVENTORY_REQUEST:
    'SENT_MULTIPLE_REDUCEINVENTORY_REQUEST',
  GET_PAYMENT_LIST_ASYNC: 'GET_PAYMENT_LIST_ASYNC',
  SAVE_ONLINEBILL_ASYNC: 'SAVE_ONLINEBILL_ASYNC',
  CHECK_ORDERID_IS_PRESENT: 'is-orderid-present',
  UPDATE_DIGITAL_ORDER_PAYMENT: 'update-digital-order-payment',
};

const PRINTERS_IPC = {
  GET_TABLES: 'get-tableforprinters',
  DELETE_PRINTER: 'delete_printers',
  PRINT_WINDOW_AYNC: 'PRINT_WINDOW_AYNC',
  HOTELLOGO_MODIFIED: 'HOTELLOGO_MODIFIED',
  UPDATE_RECEIPT_PRINT_COUNT: 'UPDATE_RECEIPT_PRINT_COUNT',
  GET_RECEIPT_PRINT_COUNT: 'GET_RECEIPT_PRINT_COUNT',
};

const SYNC_BILL = 'sync-bill';
const SYNC_BILL_REPLY = 'sync-bill-reply';
const SPLIT_BILL = {
  SPLIT_BY_PORTION: 'splitbill-by-portion',
  SPLIT_BY_PORTION_REPLY: 'splitbill-by-portion-reply',
  SPLIT_BY_PERCENTAGE: 'splitbill-by-percentage',
  SPLIT_BY_PERCENTAGE_REPLY: 'splitbill-by-percentage-reply',
  SPLIT_BY_ITEMS: 'splitbill-by-items',
  SPLIT_BY_ITEMSE_REPLY: 'splitbill-by-items-reply',
};

const EXPENSES_IPC = {
  ADDORUPDATE_CATEGORY: 'add-category',
  ADDORUPDATE_CATEGORY_REPLY: 'add-category-reply',
  ADDORUPDATE_SUBCATEGORY: 'add-subcategory',
  ADDORUPDATE_SUBCATEGORY_REPLY: 'add-subcategory-reply',
  ADD_SUBCATEGORY: 'add-subcategory',
  ADD_SUBCATEGORY_REPLY: 'add-subcategory-reply',
  ADD_EXPENSE: 'add-expense',
  ADD_EXPENSE_REPLY: 'add-expense-reply',
  GET_EXPENSEDATA: 'get-expensedata',
  GET_EXPENSEDATA_REPLY: 'get-expensedata-reply',
  GET_EXPENSESINFO: 'get-expensesinfo',
  GET_EXPENSESINFO_REPLY: 'get-expensesinfo-reply',
  GET_OVERVIEWDATA: 'get-overviewdata',
  GET_OVERVIEWDATA_REPLY: 'get-overviewdata-reply',
  GET_EXPENSES: 'get-expenses',
  GET_EXPENSES_REPLY: 'get-expenses-reply',
  GET_GRAPHDATA: 'get-graphdata',
  GET_GRAPHDATA_REPLY: 'get-graphdata-reply',
  UPDATE_EXPENSE: 'update-expense',
  UPDATE_EXPENSE_REPLY: 'update-expense-reply',
  DELETE_EXPENSE: 'delete-expense',
  DELETE_EXPENSE_REPLY: 'delete-expense-reply',
  GET_PAYMENT_MODES: 'get-payment-modes',
  GET_PAYMENT_MODES_REPLY: 'get-payment-modes-reply',
};
const ADD_ITEMNOTES = 'add-itemnotes';
const ADD_ITEMNOTES_REPLY = 'add-itemnotes-reply';
const GET_ITEMNOTES = 'get-itemnotes';
const GET_ITEMNOTES_REPLY = 'get-itemnotes-reply';
const NEW_TABLEADDED = 'new-tableadded';
const NEW_TABLEADDED_REPLY = 'new-tableadded-reply';

const WALLET_IPC = {
  GET_DATA: 'get-data',
  GET_DATA_REPLY: 'get-data-reply',
  TOPUP: 'wallet-topup',
  TOPUP_REPLY: 'wallet-topup-reply',
  CREATE: 'create-wallet',
  CREATE_REPLY: 'create-wallet-reply',
  GET_CUSTOMERS: 'get-walletcustomers',
  GET_CUSTOMERS_REPLY: 'get-walletcustomers-reply',
  GET_TRANSACTIONS: 'get-transactions',
  GET_TRANSACTIONS_REPLY: 'get-transactions-reply',
  CHECKIF_AMOUNT_AVAILABLE: 'checkif-amount-available',
  CHECKIF_AMOUNT_AVAILABLE_REPLY: 'checkif-amount-available-reply',
  UPDATE_DUEAND_ADDTRANS: 'update-dueandadd-trans',
  UPDATE_DUEAND_ADDTRANS_REPLY: 'update-dueandadd-trans-reply',
};

const ONLINEORDER_IPC = {
  PULL_CANCELLED_ORDER: 'PULL_CANCELLED_ONLINE_ORDER_ASYNC',
  SEND_MAIN_TO_RENDERER_TO_MAIN: 'SEND_MAIN_TO_RENDERER_TO_MAIN',
  CHECK_CANCELLED_ORDERS: 'CHECK_CANCELLED_ORDERS_ASYNC',
};

const DASHBOARD_IPC = {
  GET_ALL_DATA: 'get-alldashboard-data',
  GET_TOP_ITEMS: 'get-dashboard-topitems',
  GET_SALES_DATA: 'get-dashboard-sales',
};

const USER_MODEL_IPC = {
  UPDATE_ASSIGNED_DEPS: 'UPDATE_ASSIGNED_DEPS_ASYNC',
  GET_POS_USERS_ASYNC: 'GET_POS_USERS_ASYNC',
  GET_USER_TRACKING_INFO: 'GET_USER_TRACKING_INFO_ASYNC',
  CHECK_USER_PASSCODE_ASYNC: 'CHECK_USER_PASSCODE_ASYNC',
};

const MISC_IPC = {
  GET_MENU_ASYNC: 'GET_MENU_ASYNC',
  MAKE_DB_UPTO_DATE: 'MAKE_DB_UPTO_DATE_ASYNC',
  AUTO_REDUCE_INVENTORY: 'AUTO_REDUCE_INVENTORY_ASYNC',
  OPEN_DEV_TOOLS: 'MISC_IPC:OPEN_DEV_TOOLS',
  GET_ALL_STORES_LIST: 'IPC_EVENTS::MISC_IPC::GET_ALL_STORES_LIST',
};

const SYNC_LISTENERS_IPC = {
  LOG_PASSCODE_ACTIVITY: 'LOG_PASSCODE_ACTIVITY_ASYNC',
};

const RECEIPTWINDOW_IPC = {
  UPDATE_BILLS_AND_PAY: 'UPDATE_BILLS_AND_PAY_ASYNC',
  UPDATE_BILLS_AND_PAY_REPLY: 'UPDATE_BILLS_AND_PAY_REPLY',
};

module.exports = {
  SEND_SHOW_SENT_REPORT_NOTIFICATION,
  SHOW_SENT_REPORT_NOTIFICATION,
  DATA_SYNCING_ON_LOGOUT,
  ADD_CATEGORY_LOCALLY_WITHOUT_ACCESS_LEVEL,
  SEND_GENERATE_XML_REQUEST,
  EXPORT_TALLY_REPORT,
  CHECK_FOR_UPDATES,
  ADD_KITCHEN_DEPT_LOCALLY,
  ADD_CATEGORY_LOCALLY,
  UPDATE_CATEGORY_STATUS,
  ADD_ITEM_LOCALLY,
  UPDATE_ITEM_DETAILS_LOCALLY,
  GET_TABLE_ID,
  SEND_BACKGROUND_SETTLEMENT_REQUEST,
  CREATE_TABLE_RESERVATION_RECORD,
  SET_RESERVATION_ID_TO_TABLE,
  SETTLE_BILL_IN_BACKGROUND_REPLY,
  SETTLE_BILL_IN_BACKGROUND,
  FETCH_BILL_DATA_FOR_SETTLE_BILL_REPLY,
  MENU_MANAGEMENT_MESSAGES,
  UPDATE_TIP_AMOUNT_FOR_REMOTE_ORDER,
  CHECK_ORDER_IS_SAVED,
  START_CATEGORY_SHOW_CRON_JOB,
  FETCH_CATEGORIES_AND_MENU,
  ITEM_DISCOUNT_APPLIED_UPDATE_KOT_ITEMS,
  SET_LANGUAGE,
  ASSISTANCE_REQUESTED,
  RETRY_PULL_ONLINE_ORDER,
  CLOSE_NOTIFICATION_VIEW,
  UPDATE_TABLE_COLOR,
  SEND_ORDER_TOTAL,
  FETCH_BILL_DATA_FOR_CSK_ORDER_TOTAL,
  FETCH_BILL_DATA_FOR_CSK_ORDER_TOTAL_REPLY,
  GET_ORDER_TOTAL,
  REFRESH_TABLES_EVENT,
  PAYMENT_RECEIVED,
  CHECK_IF_ORDER_IS_PULLED,
  BILL_NUMBER_RESET_DATE_NOTIFICATION,
  UPDATE_PRINT_STATUS_OF_ORDER,
  LOAD_PAYMENT_MODES_REQUEST_FROM_SERVER,
  LOAD_USERS_REQUEST_FROM_SERVER,
  LOAD_ACCESS_LEVEL_REQUEST_FROM_SERVER,
  LOAD_SETTING_REQUEST_FROM_SERVER,
  FETCH_BILL_DATA_FOR_CSK_REPLY,
  FETCH_BILL_DATA_FOR_CSK,
  SAVE_BILL_FOR_CSK_REPLY,
  SAVE_BILL_FOR_CSK,
  MENU_LOADED_RELOAD_APP,
  STATUS_UPDATED_RELOAD_APP,
  GET_DELIVERY_BOY_DATA,
  UPDATE_ORDERDATA_AS_PER_PAYMENT_INFO,
  CHECK_IS_KOT_ACTIVE_FOR_CSK,
  UPDATE_FAST_SETTLE_PAYMENT_REPLY,
  UPDATE_FAST_SETTLE_PAYMENT,
  UPDATE_MALL_REPORT_ID,
  TRANSFER_ITEM_KOT_NUMBER,
  GET_RUNNING_ORDER_ITEMS,
  GET_ITEMS_BY_PRODUCT_GROUP,
  GET_ALL_PRODUCT_GROUP,
  CHECK_BILL_PRINTED,
  UPDATE_BILL_NUMBER,
  OPEN_DIALOG_FOR_DIRECTORY,
  GET_REPORT_NUMBER,
  GET_REPORT_NUMBER_REPLY,
  CHECK_IFBILL_IS_RUNNING,
  CHECK_IFBILL_IS_RUNNING_REPLY,
  GET_PAYMENT_MODES_FOR_STRIP,
  GET_PAYMENT_MODES_FOR_STRIP_REPLY,
  RECEIPTWINDOW_IPC,
  SYNC_LISTENERS_IPC,
  REMOTE_FORCE_LOGUT,
  LOGOUT_ON_CLOSE_DAY_SHIFT,
  DESTROY_USER_SESSION,
  RELOAD_APP,
  ONLINEORDER_IPC,
  MISC_IPC,
  NEW_STORE_ADDED_UPDATED,
  USER_MODEL_IPC,
  PULL_DIGITALORDER,
  DASHBOARD_IPC,
  WALLET_IPC,
  PRINTERS_IPC,
  CHECK_PRECLOSESHIFT,
  CHECK_PRECLOSESHIFT_REPLY,
  START_USERSHIFT,
  START_USERSHIFT_REPLY,
  CHECK_USERSHIFTSTARTED,
  CHECK_USERSHIFTSTARTED_REPLY,
  CLOSE_DAY_REPLY,
  CLOSE_SHIFT,
  CLOSE_SHIFT_REPLY,
  CLOSE_DAY,
  CHECKIF_DAYISTARTED_REPLY,
  CHECKIF_DAYISTARTED,
  ORDER_IPC,
  SYNC_BILL,
  SYNC_BILL_REPLY,
  CAPTAIN_IPC,
  EXPENSES_IPC,
  SPLIT_BILL,
  NEW_TABLEADDED_REPLY,
  NEW_TABLEADDED,
  SETTLE_ONLINEBILL,
  SETTLE_ONLINEBILL_REPLY,
  GET_ITEMOPTIONS_REPLY,
  GET_ITEMOPTIONS,
  SERVER_MESSAGE_RECEIVED,
  SHOW_NOTIFICATION,
  GET_BUSY_TABLES,
  GET_BUSY_TABLES_REPLY,
  LOAD_MENU_REPLY,
  LOAD_MENU,
  SET_KOT_INACTIVE,
  SET_KOT_INACTIVE_REPLY,
  INIT_SYNC_REPLY,
  INIT_SYNC,
  GET_SETTNGS,
  GET_SETTNGS_REPLY,
  UPDATE_SETTNGS,
  UPDATE_SETTNGS_REPLY,
  GET_ORDERWINDOW_DETAILS_REPLY,
  GET_ORDERWINDOW_DETAILS,
  SAVE_KOT_REPLY,
  SAVE_KOT,
  GET_BILLS,
  GET_BILLS_REPLY,
  SAVE_BILL_REPLY,
  SAVE_BILL,
  SETTLE_BILL_REPLY,
  SETTLE_BILL,
  SETTLE_QUICK_BILL_REPLY,
  SETTLE_QUICK_BILL,
  DELETE_TABLE_REPLY,
  DELETE_TABLE,
  GET_OLD_KOT,
  GET_OLD_KOT_REPLY,
  TRANSFER_OLDKOT,
  TRANSFER_OLDKOT_REPLY,
  GET_PAYMENTS_REPLY,
  GET_PAYMENTS,
  UPDATE_PAYMENTS_REPLY,
  UPDATE_PAYMENTS,
  GET_DISCOUNTS,
  GET_DISCOUNTS_REPLY,
  UPDATE_CHARGES_REPLY,
  UPDATE_CHARGES,
  UPDATE_DISCOUNT_REPLY,
  UPDATE_DISCOUNT,
  UPDATE_SELECTEDCUSTOMER,
  UPDATE_SELECTEDCUSTOMER_REPLY,
  ADD_CUSTOMER_REPLY,
  ADD_CUSTOMER,
  CHANGE_TABLE_DETAILS,
  CHANGE_TABLE_DETAILS_REPLY,
  UPDATE_TABLECOLOR_REPLY,
  UPDATE_TABLECOLOR,
  UPDATE_OLDKOTITEM,
  UPDATE_OLDKOTITEM_REPLY,
  FETCH_BILLTABLE_DATA,
  FETCH_BILLTABLE_DATA_REPLY,
  FETCH_ASYNC_KOTBILL_NUMBER,
  FETCH_KOTBILL_NUMBER,
  FETCH_KOTBILL_NUMBER_REPLY,
  UPDATE_DELIVERY_BOY_REPLY,
  UPDATE_ONLINEDELIVERY_BOY_REPLY,
  UPDATE_ONLINEDELIVERY_BOY,
  UPDATE_DELIVERY_BOY,
  GET_SHORTCUTS_REPLY,
  GET_SHORTCUTS,
  UPDATE_SHORTCUTS_REPLY,
  UPDATE_SHORTCUTS,
  ADD_PRINTER,
  ADD_PRINTER_REPLY,
  UDATE_STORE_DETAILS_REPLY,
  UDATE_STORE_DETAILS,
  GET_ALLSTORE_REPLY,
  GET_ALLSTORE,
  GET_STOREDETAILS,
  GET_STOREDETAILS_REPLY,
  EXPORT_IMPORT_MSG,
  SWITCH_STORE_REPLY,
  STORE_SWITCH_COMPLETED,
  SWITCH_STORE,
  PRINT_PDF,
  HOTELLOGO_MODIFIED,
  ADD_ITEMNOTES,
  ADD_ITEMNOTES_REPLY,
  GET_ITEMNOTES,
  GET_ITEMNOTES_REPLY,
  REPORT_MESSAGES,
  UPDATE_TABLESTATE,
  UPDATE_TABLESTATE_REPLY,
  SAVE_ONLINEBILL_REPLY,
  SAVE_ONLINEBILL,
  SPLIT_TABLE_REPLY,
  SPLIT_TABLE,
  MERGE_TABLE_REPLY,
  MERGE_TABLE,
  UPDATE_ONLINEORDER_STATUS_REPLY,
  UPDATE_ONLINEORDER_STATUS,
  GET_PAYMENTS_ASYNC,
  ASYNC_LISTEN_CUSTOMER_UPDATES,
  ADD_BHARATPE_QR_IN_DATABASE,
  CHECK_BILL_NUMBER_RESET_IS_VALID,
  UPDATE_STOCK_QTY,
  OPEN_CASH_DRAWER,
  PRINT_CSK_KOT,
  GET_NEWORRUNNING_KOT_TAG,
  TOGGLE_FULLSCREEN,
  LOGOUT_USER_FORCEFULLY,
  LOGOUT_USER,
  UPDATE_ONLINE_ORDER_KDS_KOT_STATUS,
  SOCKET_EVENT_EMITTER,
  REMOTE_KOT_PLACED,
  CHECK_IF_REMOTE_KOT_IS_PULLED,
  SHOW_CLOSE_DAY_WINDOW,
  EXTEND_CLOSE_DAY_TIME,
  SET_STOREDETAILS,
  CUSTOMER_UPDATED,
  SET_BUSY_TABLE_DATA,
  RESET_FCM_TOKEN,
};
