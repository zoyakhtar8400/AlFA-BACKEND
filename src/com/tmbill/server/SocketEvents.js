const ORDER = {
  BILL_SAVED: 'bill-saved',
  BILL_SETTLED: 'bill-settled',
  BILL_PRINTED: 'bill-printed',
  KOT_SAVED: 'kot-saved',
  KOT_UPDATED: 'kot-updated',
  MESSAGE: 'message',
  KOT_CANCELLED: 'websocket-kot-cancelled',
  KOTITEM_TRANSFERRED: 'websocket-kotitem-transferred',
  SAVE_AND_PRINT_BILL: 'save-and-print-bill-request',
  CHARGES_UPDATED: 'charges-updated',
  TABLE_CLICKED: 'table-clicked',
  QUICK_BILL_PLACED: 'quick-bill-placed',
  PAYMENT_RECEIVED: 'payment-received',
  REFRESH_TABLES: 'refresh-tables',
  KOT_TOTAL: 'kot_total',
  SEND_ORDER_TOTAL: 'send-order-total',
  UPDATE_TABLE_COLOR: 'update-table-color',
  CLOSE_NOTIFICATION_VIEW: 'close-notification-view',
  TABLE_SPLITTED: 'table-splitted',
  TABLE_MERGED: 'table-merged',
  TABLE_CHANGED: 'table-changed',
  ASSISTANCE_REQUIRED: 'assistance-required',
  DRAFT_BILL_PRINTED: 'draft-bill-printed',
  BACKGROUND_BILL_SETTLEMENT: 'background-bill-settlement-request',
  ORDER_UPDATED_FROM_SETTLMENT_WINDOW: 'order-updated-from-settlement-window',
  UPDATE_TABLE_DETAILS: 'update-table-details',
  REMOTE_KOT_PLACED: 'remote-kot-placed',
  ACCEPT_REMOTE_KOT: 'accept-remote-kot',
  SHOW_NOTIFICATION_ON_ORDERHUB: 'show-notification',
};

const KDS = {
  ITEM_STATUS_CHANGED: 'item-status-changed',
  KOT_UPDATED: 'kds-kot-updated',
  KOT_STATUS_UPDATES: 'kds-kot-status-updated',
  SETTLE_ALL_KOT: 'kds-settleall',
};

const GLOBAL_EVENT = {
  CLOSING_APP: 'exit-app',
  MENU_UPDATED: 'menu-updated',
  POS_MENU_UPDATED: 'pos-menu-updated',
  POS_SETTINGS_UPDATED: 'pos-settings-updated',
  SEND_NOTIFICATION: 'send-notification',
  UPDATE_STOCK: 'update-stock',
  CUSTOMER_UPDATED: 'customer-updated',
  LOGOUT_USER: 'logout-user',
};
const PRINT = {
  KOT: 'print-kot-request',
  BILL: 'print-bill-request',
  KOT_PRINTED: 'print-kotrequest-complete',
  QUICK_BILL_PRINT: 'quick-bill-print-request',
  PRINT_SETTELED_BILL: 'print-settled-bill',
};

const EVENT_FLAGS = {
  BILL_SAVED: 1, // 'bill-saved',
  BILL_SETTLED: 2, // 'bill-settled'
  KOT_SAVED: 3, // 'kot-saved'
  KOT_UPDATED: 4, // 'kot-updated'
  TABLE_CLICKED: 5, // 'table-clicked'
  KOT_TOTAL: 6, // 'kot_total'
  SEND_ORDER_TOTAL: 7, // 'send-order-total'
  CLOSE_NOTIFICATION_VIEW: 8, // 'close-notification-view'
  ASSISTANCE_REQUIRED: 9, // 'assistance-required'
  DRAFT_BILL_PRINTED: 10, // 'draft-bill-printed'
  ITEM_STATUS_CHANGED: 11, // 'item-status-changed'
  KDS_KOT_UPDATED: 12, // 'kds-kot-updated'
  KOT_STATUS_UPDATES: 13, // 'kds-kot-status-updated'
  UPDATE_TABLE_DETAILS: 14,
};

module.exports = {
  KDS,
  ORDER,
  PRINT,
  GLOBAL_EVENT,
  EVENT_FLAGS,
};
