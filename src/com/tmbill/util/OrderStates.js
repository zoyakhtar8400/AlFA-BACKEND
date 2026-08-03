const ONLINE_ORDERS_STATE = {
  NEW: 0,
  RUNNING: 1,
  COMPLETED: 2,
  CANCELLED: 3,
};

const ORDERS_NOTIFICATION = {
  ORDER_STATUS_UPDATE: 0,
  NEW_ORDER: 1,
  NEW_ORDER_ALT: 3,
  CANCELLED_ORDER: 4,
  AUTO_ACCEPTED: 5,
  DO_LOAD_MENU: 6,
  DIGITAL_ORDER: 100,
  DIGITAL_ORDER_CANCELLED: 101,
  REMOTE_KOT: 102,
  PAYMENT_RECEIVED: 103,
  FORCE_LOGOUT: 99999,
  SETTLE_BILL: 104,
  ONLINE_ORDER_AUTO_ACCEPTED: 7,
  ORDER_ACCEPTED_STOP_NOTIFICATION: 11,
  ORDER_DISPATCHED_CHANGE_STATUS: 12,
  PENDING_ORDERS_FOUND: 13,
  ASSISTANCE_REQUESTED: 14,
  WAITER_TIP: 15,
  TABLE_RESERVATION: 16,
  MERCHANT_AGREED_CANCELLATION: 17,
  AUTO_SETTLED: 18,
  REFUND_INITIATED: 177,
  FCM_NOTIFICATION_TEST: 99,
};

const ORDERS_NAMESTATE = ['Placed', 'Acknowledged', 'Dispatched', 'Completed'];

const ONLINE_ORDER_NAME_STATES = {
  PLACED: 'Placed',
  ACKNOWLEDGED: 'Acknowledged',
  PREPARING: 'Preparing',
  FOOD_READY: 'Food Ready',
  DISAPATCHED: 'Dispatched',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  FULFILLED: 'Fulfilled',
  RETURENED: 'Returned',
};

const OFFLINE_ORDERSTATES = {
  PLACED: 'Placed',
  PREPARING: 'Preparing',
  FOOD_READY: 'Food Ready',
  DISAPATCHED: 'Dispatched',
  // SERVED: 'Served',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
};

const ORDER_STATES = ['Placed', 'Bumped', 'Preparing', 'Ready', 'Served'];
const EN_ORDER_STATES = [
  { Placed: 'Placed' },
  { Bumped: 'Bumped' },
  { Preparing: 'Preparing' },
  { Ready: 'Ready' },
  { Served: 'Served' },
];

const ER_ORDER_STATES = [
  { Placed: 'تم الطلب' },
  { Bumped: 'تم الإرسال' },
  { Preparing: 'قيد التحضير' },
  { Ready: 'مستعد' },
  { Served: 'تم التقديم' },
];

// const ORDER_STATES = [
//   $.i18n.t('orderScreen.PLACED'),
//   $.i18n.t('orderScreen.BUMPED'),
//   $.i18n.t('orderScreen.PREPARING'),
//   $.i18n.t('orderScreen.READY'),
//   $.i18n.t('orderScreen.SERVED'),
// ];

const ONLINE_PLATFORMS = {
  ZOMATO: 'Zomato',
  SWIGGY: 'Swiggy',
  DUNZO: 'Dunzo',
  DOTPE: 'dotpe',
  MAGICPIN: 'magicpin',
};

const ORDERSTATEFOR_REDUCEINVENTORY = ['deleted', 'cancelled'];
module.exports = {
  ORDERSTATEFOR_REDUCEINVENTORY,
  ONLINE_ORDERS_STATE,
  ONLINE_PLATFORMS,
  ORDERS_NAMESTATE,
  ORDERS_NOTIFICATION,
  OFFLINE_ORDERSTATES,
  ONLINE_ORDER_NAME_STATES,
  ORDER_STATES,
  EN_ORDER_STATES,
  ER_ORDER_STATES,
};
