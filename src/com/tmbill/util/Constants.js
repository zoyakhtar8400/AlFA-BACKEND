const TAKEAWAY_FLAG_ID = 1;
const DINEIN_FLAG_ID = 0;
const HOMED_FLAG_ID = 2;
const QUICKBILL_FLAG_ID = 3;
const ONLINEORDER_FLAG_ID = 4;
const VIRTUALTABLE_FLAG_ID = 5;

// Table type flags Dine in = 0 , TA = 1 , HD = 2 Online=3 4=Virtual

// Order type flags
const QUICKBILL_BILLING_FLAG = 0;
const DINEIN_BILLING_FLAG = 1;
const TAKEAWAY_BILLING_FLAG = 2;
const HOMED_BILLING_FLAG = 3;
const ZOMATO_BILLING_FLAG = 4;
const SWIGGY_BILLING_FLAG = 5;
const DUNZO_BILLING_FLAG = 6;
const UBERRATS_BILLING_FLAG = 7;
const DIGITAL_BILLING_FLAG = 8;
const UPSALE_BILLING_FLAG = 40;
const MAGICPIN_BILLING_FLAG = 19;
const DOTPE_BILLING_FLAG = 14;
const ONDC_BILLING_FLAG = 104;
const RAFEEQ_BILLING_FLAG = 43;
const CAREEM_BILLING_FLAG = 33;
const TALABAT_BILLING_FLAG = 21;
const NOONFOOD_BILLING_FLAG = 107;
const UBEREATS_BILLING_FLAG = 6;
const DELIVEROO_BILLING_FLAG = 108;
const FIDOO_BILLING_FLAG = 125;
const JAHEZ_BILLING_FLAG = 27;
const AMAZON_BILLING_FLAG = 13;
const MRSOOL_BILLING_FLAG = 30;
const RADYES_BILLING_FLAG = 22;
const THRIVE_BILLING_FLAG = 20;
const CULTFIT_BILLING_FLAG = 122;
const GUPSHUP_BILLING_FLAG = 11;
const INRESTO_BILLING_FLAG = 121;
const JUSTEAT_BILLING_FLAG = 124;
const SCOOTSY_BILLING_FLAG = 119;
const CHATFOOD_BILLING_FLAG = 120;
const FLIPDISH_BILLING_FLAG = 123;
const EAZYDINER_BILLING_FLAG = 15;
const SWIGGYSTORE_BILLING_FLAG = 126;
const ZOMATOMARKET_BILLING_FLAG = 127;
const FOODPANDA_BILLING_FLAG = 25;
const BEANZ_BILLING_FLAG = 170;
const CARI_BILLING_FLAG = 156;
const HUNGERSATATION_BILLING_FLAG = 26;
const INSTASHOP_BILLING_FLAG = 176;
const SMILES_BILLING_FLAG = 106;
const TOYOU_BILLING_FLAG = 28;
const EATEASY_BILLING_FLAG = 172;
const EATEASY = 172;
const KEETA_BILLING_FLAG = 177;

const ONLINE_PLATFORMS = [
  ZOMATO_BILLING_FLAG,
  SWIGGY_BILLING_FLAG,
  DUNZO_BILLING_FLAG,
  UBERRATS_BILLING_FLAG,
  MAGICPIN_BILLING_FLAG,
  DOTPE_BILLING_FLAG,
  ONDC_BILLING_FLAG,
  RAFEEQ_BILLING_FLAG,
  CAREEM_BILLING_FLAG,
  TALABAT_BILLING_FLAG,
  NOONFOOD_BILLING_FLAG,
  UBEREATS_BILLING_FLAG,
  RADYES_BILLING_FLAG,
  DELIVEROO_BILLING_FLAG,
  FIDOO_BILLING_FLAG,
  JAHEZ_BILLING_FLAG,
  AMAZON_BILLING_FLAG,
  MRSOOL_BILLING_FLAG,
  THRIVE_BILLING_FLAG,
  CULTFIT_BILLING_FLAG,
  GUPSHUP_BILLING_FLAG,
  INRESTO_BILLING_FLAG,
  JUSTEAT_BILLING_FLAG,
  SCOOTSY_BILLING_FLAG,
  CHATFOOD_BILLING_FLAG,
  FLIPDISH_BILLING_FLAG,
  EAZYDINER_BILLING_FLAG,
  FOODPANDA_BILLING_FLAG,
  SWIGGYSTORE_BILLING_FLAG,
  ZOMATOMARKET_BILLING_FLAG,
  HUNGERSATATION_BILLING_FLAG,
  EATEASY,
];

// Tab id for respective tab's in order section.
const DINEIN_TAB_ID = 'dineintabId';
const TAKEAWAY_TAB_ID = 'takeawaytabID';
const QUICK_TAB_ID = 'quickbilltabID';
const HOMEDELIVERY_TAB_ID = 'homedeliverytabID';
const DELIVERY_TAB_ID = 'deliverytabID';
// Tab container id for respective tab's in order section.
const DINEIN_TABDIV_ID = 'dineintabdivId';
const TAKEAWAY_TABDIV_ID = 'takeawaytabdivID';
const DELIVERY_TABDIV_ID = 'deliverytabdivID';
const QUICK_TABDIV_ID = 'quickbilltabdivID';
const HOMED_TABDIV_ID = 'homedeltabdivID';

const DINEIN_KOT_TABID = 'tab1';
const DINE_BILL_TABID = 'tab2';
const TAKEAWAY_KOT_TABID = 'takeawaykotTabid';
const TAKEAWAY_BILL_TABID = 'takeawaybillTabid';
const DELIVERY_KOT_TABID = 'deliverykotTabid';
const DELIVERY_BILL_TABID = 'deliverybillTabid';

// Table ID's in order section
const DINEIN_BILLTABLE = 'billTable';
const DINEIN_KOTTABLE = 'kotTable';
const TAKEAWAY_BILLTABLE = 'takebillTable';
const TAKEAWAY_KOTTABLE = 'takeawaykotTable';
const DELIVERY_KOTTABLE = 'deliverykotTable';
const DELIVERY_BILLTABLE = 'deliverybillTable';
const QUICK_BILLTABLE = 'quickbillTable';

const DEFAULT_TAKEAWAY_TABLENAME = 'P ';
const DEFAULT_HOMED_TABLENAME = 'D ';

const KOT_TITLE = 'KOT';
const NEW_KOT_TITLE = 'New KOT';
const RUNNING_KOT_TITLE = 'Running KOT';
const DEVMODE_SECRET = '314r5eAQDbEurkT2671KkFTDcve6l13d';

const CHARGE_TYPES = {
  PERCENTAGE: 1,
  FIXED: 0,
};

const STORES_INFO = [
  // {
  //     storeName: 'Urban Piper',
  //     icon: 'https://backoffice.tmbill.in/public/images/transparent/urbanpiper.png',
  //     value: 'urbanpiper'
  // },
  {
    storeName: 'Dotpe',
    icon: 'https://cdn.tmbill.com/channel/dotpe.png',
    value: 'dotpe',
  },
  {
    storeName: 'Zomato',
    icon: 'https://cdn.tmbill.com/channel/zomato.png',
    value: 'zomato',
  },
  {
    storeName: 'Swiggy',
    icon: 'https://backoffice.tmbill.com/public/images/transparent/swiggy.png',
    value: 'swiggy',
  },
  // {
  //     storeName: 'Dunzo',
  //     icon: 'https://ik.imagekit.io/dunzo/web-assets/images/logo-footer-2530fc0589c6b1f7c5e76c618e230276.png?tr=w-140,h-140',
  //     value: 'dunzo'
  // },
  {
    storeName: 'Magicpin',
    icon: 'https://cdn.tmbill.com/channel/magicpin.png',
    value: 'magicpin',
  },
];

const DELIVERY_TYPES = {
  PICKUP: 'pickup',
  PARTNER: 'partner',
  SELF: 'self',
};

const CAPTAIN_TYPES = ['captain', 'selforder', 'kds', 'terminal'];

const APP_WINDOWS = {
  ORDER: 1,
  RECEIPT: 2,
  REPORT: 3,
  ONLINE: 4,
  MASTER: 5,
};

const SPLITBILL_TABS = {
  ITEM: 'split-itemwise-tab',
  PORTION: 'split-portionwise-tab',
  PERCENTAGE: 'split-percentwise-tab',
};

const KOT_ITEMS_STATUS = {
  PLACED: 'Placed',
  REJECTED: 'Rejected',
  PREPARING: 'Preparing',
  READY: 'Ready',
};

const KOT_ITEM_STATUS = {
  1: 'Placed',
  2: 'Deleted',
  3: 'Cancelled',
  4: 'Transferred',
  5: 'Updated',
};

const CHARGE_BILL_TYPES = {
  // 0=All ,1=Quick Bill, 2=Dine In, 3= TA 4=HD
  ALL: 0,
  QUICK_BILL: 1,
  DINE_IN: 2,
  TAKEAWAY: 3,
  HOME_DELIVERY: 4,
};

const REWARD_BILL_TYPES = {
  // 0=All ,1=Quick Bill, 2=Dine In, 3= TA 4=HD
  ALL: 'all',
  QUICK_BILL: 0,
  DINE_IN: 2,
  TAKEAWAY: 1,
  HOME_DELIVERY: 1,
  DIGITAL_ORDER: 8,
};

const CAMPAIGN_EVENTS = {
  POINTS: {
    NewAccount: 'NewAccount',
    PlaceOrder: 'PlaceOrder',
    OrderCount: 'OrderCount',
    OrderAmount: 'OrderAmount',
    CustomerBirthday: 'CustomerBirthday',
    WriteReview: 'WriteReview',
  },
  REWARDS: {
    FIXEDAMOUNT: 1,
    PERCOFF: 2,
    SHIPPING: 3,
    PRODUCTGRP: 4,
  },
};

const REWARD_BILLING_FLAGS = REWARD_BILL_TYPES;

const ORDERTABS_AND_TABLETYPE_MAPPING = {
  [DINEIN_TAB_ID]: [DINEIN_FLAG_ID, VIRTUALTABLE_FLAG_ID],
  [TAKEAWAY_TAB_ID]: [TAKEAWAY_FLAG_ID],
  [DELIVERY_TAB_ID]: [HOMED_FLAG_ID],
};

const SUPPORTED_LANGUAGES = [
  { title: 'English', name: 'English', value: 'en' },
  { title: 'عربي', name: 'Arabic', value: 'ar' },
  // { title: 'French', name: 'English', value: 'fr' },
];

const TALABAT_ORDER_TYPES = {
  PICKUP: 'PICKUP',
  OWN_DELIVERY: 'OWN_DELIVERY',
  VENDOR_DELIVERY: 'VENDOR_DELIVERY',
};

const INVENTORY_STATUS = {
  NOT_REDUCED: 0,
  REDUCED: 1,
  REVERSED: 2,
  DO_NOT_REDUCE: 3,
};

const ITEM_TAX_TYPES = {
  INCLUSIVE: 1,
  EXCLUSIVE: 0,
};

const TABS_MAPPING = {
  [DINEIN_TABDIV_ID]: DINEIN_TAB_ID,
  [TAKEAWAY_TABDIV_ID]: TAKEAWAY_TAB_ID,
  [HOMED_TABDIV_ID]: HOMEDELIVERY_TAB_ID,
  [QUICK_TABDIV_ID]: QUICK_TAB_ID,
};

const BILL_PREFIX_FOR = {
  NORMAL_BILLING: 1,
  ONLINE_ORDERS_BILLING: 2,
  BAR_SECTION_BILLING: 3,
};

const USER_TYPES = [
  ' Billing User',
  'Delivery Boy',
  'Captain User',
  'Waiter',
  'Terminal',
  'Passcode User',
];

const PASSCODE_ACTIVITY_EVENTS = {
  APP: {
    OPEN_DASHBOARD: { feature: 'Open Dashboard', id: 1 },
    OPEN_ORDER_WINDOW: { feature: 'Open Order Window', id: 2 },
    OPEN_RECEIPT_MGMT: { feature: 'Open Receipt Management', id: 3 },
    SWITCH_OUTLET: { feature: 'Switch Outlet', id: 4 },
    OPEN_REPORTS: { feature: 'Open Reports Window', id: 5 },
    OPEN_ONLINE_ORDERS: { feature: 'Open Online Orders Window', id: 6 },
    OPEN_DIGITAL_ORDERS: { feature: 'Open Digital Orders Window', id: 7 },
    OPEN_MASTER_MGMT: { feature: 'Open Master Management', id: 8 },
    OPEN_SETTINGS: { feature: 'Open Settings Window', id: 9 },
    OPEN_SETTLEMENT_WINDOW: { feature: 'Open Settlement Window', id: 99 },
  },
  DASHBOARD: {
    VIEW_DASHBOARD_SALES: { feature: 'Open Dashboard Sales', id: 10 },
  },
  ORDER_WINDOW: {
    CHANGE_TABLE: { feature: 'Change Table', id: 11 },
    LOAD_MENU: { feature: 'Load Menu', id: 12 },
    DINE_IN: {
      ADD_CHARGES: { feature: 'Add Dinein charges', id: 13 },
      ADD_COUPON: { feature: 'Add Dinein coupon', id: 14 },
      ADD_DISCOUNT: { feature: 'Add Dinein discount', id: 15 },
      DRAFT_PRINT: { feature: 'Dinein Draft Print', id: 16 },
      MODIFY_BILL_STATUS: { feature: 'Dinein Modify Bill Status', id: 17 },
      BILL_PREVIEW: { feature: 'Open Dinein Preview Bill', id: 18 },
      OLD_KOT: { feature: 'Open Dinein Old KOT', id: 19 },
      OLD_KOT_ACTIONS: {
        CANCEL_KOT: { feature: 'Dinein Cancel KOT', id: 20 },
        DELETE_KOT: { feature: 'Dinein Delete KOT', id: 21 },
        TRANSFER_KOTITEM: { feature: 'Dinein Transfer Old KOT Items', id: 22 },
        ITEM_COMPLEMENTARY: {
          feature: 'Takeaway Transfer Old KOT Items',
          id: 23,
        },
      },
      SPLIT_BILL: { feature: 'Open Dinein Split Bill', id: 24 },
      ITEM_COMPLEMENTARY: { feature: 'Make Dinein Item Complementary', id: 25 },
      ALLOW_DUEPAY: { feature: 'Allow Due pay for Dinein', id: 26 },
      REPRINT_BILL: { feature: 'Reprint Bill', id: 98 },
    },
    TAKEAWAY_WINDOW: {
      OLD_KOT: { feature: 'Open Takeaway Old KOT', id: 27 },
      ADD_CHARGES: { feature: 'Add Takeaway charges', id: 28 },
      ADD_COUPON: { feature: 'Add Takeaway coupon', id: 29 },
      ADD_DISCOUNT: { feature: 'Add Takeaway discount', id: 30 },
      DRAFT_PRINT: { feature: 'Takeaway Draft Print', id: 31 },
      MODIFY_BILL_STATUS: { feature: 'Takeaway Modify Bill Status', id: 32 },

      BILL_PREVIEW: { feature: 'Open Takeaway Preview Bill', id: 33 },
      OLD_KOT_ACTIONS: {
        CANCEL_KOT: { feature: 'Takeaway Cancel KOT', id: 34 },
        DELETE_KOT: { feature: 'Takeaway Delete KOT', id: 35 },
        TRANSFER_KOTITEM: {
          feature: 'Takeaway Transfer Old KOT Items',
          id: 36,
        },
        ITEM_COMPLEMENTARY: {
          feature: 'Takeaway Transfer Old KOT Items',
          id: 37,
        },
      },
      SPLIT_BILL: { feature: 'Takeaway Modify Bill Status', id: 38 },
      ITEM_COMPLEMENTARY: {
        feature: 'Make Takeaway Item Complementary',
        id: 39,
      },
      ALLOW_DUEPAY: { feature: 'Allow Due pay for  Takeaway', id: 40 },
    },
    HOMED_WINDOW: {
      OLD_KOT: { feature: 'Open Delivery Old KOT', id: 41 },
      ADD_CHARGES: { feature: 'Add Delivery charges', id: 42 },
      ADD_COUPON: { feature: 'Add Delivery coupon', id: 43 },
      ADD_DISCOUNT: { feature: 'Add Delivery discount', id: 44 },
      DRAFT_PRINT: { feature: 'Delivery Draft Print', id: 45 },
      MODIFY_BILL_STATUS: { feature: 'Delivery Modify Bill Status', id: 46 },

      BILL_PREVIEW: { feature: 'Open Delivery  Preview Bill', id: 47 },
      OLD_KOT_ACTIONS: {
        CANCEL_KOT: { feature: 'Delivery Cancel KOT', id: 48 },
        DELETE_KOT: { feature: 'Delivery Delete KOT', id: 49 },
        TRANSFER_KOTITEM: {
          feature: 'Delivery Transfer Old KOT Items',
          id: 50,
        },
        ITEM_COMPLEMENTARY: {
          feature: 'Takeaway Transfer Old KOT Items',
          id: 51,
        },
      },
      SPLIT_BILL: { feature: 'Delivery Modify Bill Status', id: 52 },
      ITEM_COMPLEMENTARY: {
        feature: 'Make Delivery Item Complementary',
        id: 53,
      },
      ALLOW_DUEPAY: { feature: 'Allow Due pay for  Delivery', id: 54 },
    },
    QUICK_BILL: {
      ITEM_COMPLEMENTARY: {
        feature: 'Make QuickBill Item Complementary',
        id: 55,
      },
      ADD_CHARGES: { feature: 'Add Quick Bill charges', id: 56 },
      ADD_COUPON: { feature: 'Add Quick Bill  coupon', id: 57 },
      ADD_DISCOUNT: { feature: 'Add Quick Bill  discount', id: 58 },
      ALLOW_DUEPAY: { feature: 'Allow Due pay for  QuickBill', id: 59 },
    },
    MODIFY_BILL_AFTER_SAVE: { feature: 'Modify Bill after save', id: 90 },
    CHANGE_ITEM_PRICE: { feature: 'Change Item Price', id: 96 },
  },
  RECEIPT: {
    OPEN_PREVIEW: { feature: 'Open Receipt Preview', id: 60 },
    DRAFT_PRINT: { feature: 'Print Old Bill From Receipt', id: 61 },
    RESYNC_BILLS: { feature: 'Resync Bill From Receipt', id: 62 },
    TODAYS_REPORT: { feature: 'Generate Todays Report From Receipt', id: 63 },
    OPEN_EDIT_BILL: { feature: 'Open Edit Bill Window', id: 64 },
    CHANGE_PAYMENT: { feature: 'Modify Payment Mode From Receipt', id: 65 },
    CHANGE_BILL_STATUS: { feature: 'Modify Bill Status From Receipt', id: 66 },
    MODIFY_BILL_AFTER_SAVE: { feature: 'Modify Bill after save', id: 89 },
  },
  REPORT: {
    OPEN_ITEM_REPORT: { feature: 'Open Item Report', id: 67 },
    OPEN_DUEPAY_REPORT: { feature: 'Open Due Payment Report', id: 68 },
    OPEN_ORDER_REPORT: { feature: 'Open Order Report', id: 69 },
    OPEN_SALES_REPORT: { feature: 'Open Sales Report', id: 70 },
    OPEN_TODAYS_REPORT: { feature: 'Open Todays Report', id: 71 },
    OPEN_PAYMENT_REPORT: { feature: 'Open Payment Report', id: 72 },
    OPEN_USERSHIFT_REPORT: { feature: 'Open User Shift Report', id: 73 },
    OPEN_COUPONCODE_HISTORY: {
      feature: 'Open Coupon Code History Report',
      id: 74,
    },
    OPEN_CATWISE_REPORT: { feature: 'Open Category Report', id: 75 },
    OPEN_KITCHEN_REPORT: { feature: 'Open Kitchen Department Report', id: 76 },
    OPEN_START_DAY_CLOSE_DAY_REPORT: {
      feature: 'Open Start Day Close Day Report',
      id: 96,
    },
    OPEN_MALL_REPORT: {
      feature: 'Open Mall Report',
      id: 97,
    },
  },
  ONLINE_ORDERS: {
    STORE: {
      OPEN_ITEM_SETTING: { feature: 'Open Online Order Item Setting', id: 77 },
      OPEN_STORE_SETTING: {
        feature: 'Open Online Order Store Setting',
        id: 78,
      },
      OPEN_OPTIONS_SETTING: {
        feature: 'Open Online Order Option Setting',
        id: 79,
      },
      OPEN_CATEGORY_SETTING: {
        feature: 'Open Online Order Category Setting',
        id: 80,
      },
      CLICK_ITEMS_BUTTON_SETTING: {
        feature: 'Click Online Order Item Status Setting',
        id: 81,
      },
      CLICK_OPTIONS_BUTTON_SETTING: {
        feature: 'Open Online Order Option Status Setting',
        id: 82,
      },
    },
    OTHER: {
      AUTO_ACCEPT_ORDER: {
        feature: 'Set Online Order Auto Accept Order Setting',
        id: 83,
      },
      SEND_NOTIFICATION: {
        feature: 'Set Online Order Send Notification Setting',
        id: 84,
      },
    },
  },
  DIGITAL_ORDER: {},
  MASTER_MGMT: {
    OPEN_EXPENSES: { feature: 'Open Expenses Management', id: 85 },
    OPEN_CUSTOMER_MGMT: { feature: 'Open Customer Management', id: 86 },
    OPEN_WALLET_MGMT: { feature: 'Open Wallet Management', id: 87 },
  },
  SETTINGS: {
    OPEN_GENERAL_SETTING: { feature: 'Open General Setting', id: 88 },
  },
  MENU_MANAGEMENT: {
    LOAD_MENU: { feature: 'Load Menu', id: 91 },
    ADD_ITEM: { feature: 'Add Item', id: 92 },
    EDIT_ITEM: { feature: 'Edit Item', id: 93 },
    ENABLE_DISABLE_ITEM: { feature: 'Enable/disable Items', id: 94 },
    ENABLE_DISABLE_CATEGORY: { feature: 'Enable/disable Category', id: 95 },
  },
  ORDER_SETTLEMENT_WINDOW: {
    UPDATE_ORDER: {
      feature: 'Update Order From Order Settlement Window',
      id: 100,
    },
    SETTLE_ORDER: {
      feature: 'Settle Order From Order Settlement Window',
      id: 101,
    },
  },
};

const PRINTER_ACTION_TYPES = {
  KOT: 1,
  DINE_IN: 2,
  TAKEAWAY: 3,
  HOME_DELIVERY: 4,
  QUICK_BILL: 5,
  LABEL_PRINTER: 6,
  REPORT_PRINTER: 7,
  KITCHEN_PRINTER: 8,
  ONLINE_KOT: 9,
  TABLEWISE_PRINTER: 10,
  ONLINE_STOREWISE_PRINTER: 11,
  ONLINE_BILL: 12,
  ORDER_TYPE_WISE_KOT: 13,
  ORDER_TYPE_WISE_BILL: 14,
  KD_KOT_PRINTER: 15,
  TABLEWISE_KOT_PRINTER: 16,
  TABLEWISE_BILL_PRINTER: 17,
  CATEGORYWISE_KOT_PRINTER: 18,
};

const CUSTOMISED_DISCOUNT_ORDERTYPE = {
  ALL: '0',
  QUICK_BILL: '1',
  DINE_IN: '2',
  TAKEAWAY: '3',
  HOME_DELIVERY: '4',
};

const COMMON_STATE = {
  ACTIVE: 1,
  INACTIVE: 0,
};

const SYNC_STATUS_FLAG = {
  SYNCED: 1,
  NOT_SYNCED: 0,
};

const KEYBOARD_LAYOUT_MAP = {
  en: 'english',
  ar: 'arabic',
};

const ENVS = {
  PRODUCTION: 'production',
  DEV: 'development',
  TEST: 'testing',
};

const PAYMENT_STATUS = {
  SUCCESS: ['success', 'SUCCESS', 'PAYMENT_RECV', 'captured', 'paid'],
  FAILED: ['failed'],
  PENDING: ['created', 'authorized', ''],
};

const PAY_GATEWAY_TYPES = {
  RAZOR_PAY: 1,
  PAYU_MONEY: 2,
  COD: 3,
  PAYU: 4,
  PAY_LATER: 5,
  PAYTM: 6,
  UPSALE: 7,
  UPI: 8,
};

const BOGO_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CATEGROY_DAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const DISCOUNT_DAYS = [
  '',
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const VOID_REASONS = [
  'Product Quality',
  'Tech Issue',
  'Late Delivery',
  'Modified Success',
  'Fake Order',
  'Transfer Success',
  'Change Mind',
  'Wrong Order',
  'Bad Weather',
  'Wrong Area',
  'Item unavailable',
  'No Answer/Off',
  'Wrong Entry',
  'Double Punch',
  'Out Of Zone',
  'Mismatch / OLO',
  'Tech Test Order',
  'Mismatch / Agg',
  'Infra. Issue',
  'Payment Failed',
];

const SALUTATIONS = [
  {
    value: 1,
    title: 'Mr.',
  },
  {
    value: 2,
    title: 'Ms.',
  },
  {
    value: 3,
    title: 'Mrs.',
  },
  {
    value: 4,
    title: 'Dr.',
  },
  {
    value: 5,
    title: 'King',
  },
  {
    value: 6,
    title: 'Prince',
  },
  { value: 7, title: 'Queen' },
  { value: 8, title: 'Princess' },
  { value: 9, title: 'Sir' },
  { value: 10, title: 'Madam' },
  {
    value: 11,
    title: 'VIP',
  },
];

const CUSTOMER_TYPE = [
  { value: 2, title: 'Individual' },
  { value: 3, title: 'Corporate' },
];

const SALUTATIONS_VALUES = [
  '',
  'Mr.',
  'Ms.',
  'Mrs.',
  'Dr.',
  'King',
  'Prince',
  'Queen',
  'Princess',
  'Sir',
  'Madam',
  'VIP',
  'Individual',
  'Corporate',
];

const ACCOUNT = {
  CLOSE_DAY: 'close-day',
  CLOSE_SHIFT: 'close-shift',
  START_SHIFT: 'start-shift',
};
const OTP_TYPES = {
  ORDER_STATUS_UPDATE: 'ORDER_STATUS_UPDATE',
  ORDER_STATUS_UPDATE_RECEIPT: 'ORDER_STATUS_UPDATE_RECEIPT',
  ORDER_ITEM_MODIFY: 'ORDER_ITEM_MODIFY',
};
module.exports = {
  RAFEEQ_BILLING_FLAG,
  KOT_ITEM_STATUS,
  DISCOUNT_DAYS,
  CATEGROY_DAYS,
  BOGO_DAYS,
  PAY_GATEWAY_TYPES,
  PAYMENT_STATUS,
  BILL_PREFIX_FOR,
  ENVS,
  KEYBOARD_LAYOUT_MAP,
  SYNC_STATUS_FLAG,
  COMMON_STATE,
  CUSTOMISED_DISCOUNT_ORDERTYPE,
  PRINTER_ACTION_TYPES,
  PASSCODE_ACTIVITY_EVENTS,
  USER_TYPES,
  TABS_MAPPING,
  ITEM_TAX_TYPES,
  INVENTORY_STATUS,
  DIGITAL_BILLING_FLAG,
  SUPPORTED_LANGUAGES,
  REWARD_BILLING_FLAGS,
  ORDERTABS_AND_TABLETYPE_MAPPING,
  CAMPAIGN_EVENTS,
  CHARGE_BILL_TYPES,
  ONLINE_PLATFORMS,
  KOT_ITEMS_STATUS,
  SPLITBILL_TABS,
  KOT_TITLE,
  NEW_KOT_TITLE,
  RUNNING_KOT_TITLE,
  APP_WINDOWS,
  CAPTAIN_TYPES,
  TAKEAWAY_FLAG_ID,
  QUICKBILL_FLAG_ID,
  DINEIN_FLAG_ID,
  HOMED_FLAG_ID,
  DINEIN_TAB_ID,
  TAKEAWAY_TAB_ID,
  QUICK_TAB_ID,
  HOMEDELIVERY_TAB_ID,
  TAKEAWAY_BILL_TABID,
  TAKEAWAY_KOT_TABID,
  DINEIN_TABDIV_ID,
  TAKEAWAY_TABDIV_ID,
  QUICK_TABDIV_ID,
  HOMED_TABDIV_ID,
  TAKEAWAY_BILLTABLE,
  TAKEAWAY_KOTTABLE,
  DINEIN_BILLTABLE,
  DINEIN_KOTTABLE,
  DINE_BILL_TABID,
  DINEIN_KOT_TABID,
  DEFAULT_TAKEAWAY_TABLENAME,
  DEFAULT_HOMED_TABLENAME,
  DEVMODE_SECRET,
  QUICK_BILLTABLE,
  QUICKBILL_BILLING_FLAG,
  DINEIN_BILLING_FLAG,
  TAKEAWAY_BILLING_FLAG,
  HOMED_BILLING_FLAG,
  STORES_INFO,
  DELIVERY_TYPES,
  ZOMATO_BILLING_FLAG,
  DUNZO_BILLING_FLAG,
  UBERRATS_BILLING_FLAG,
  ONLINEORDER_FLAG_ID,
  VIRTUALTABLE_FLAG_ID,
  SWIGGY_BILLING_FLAG,
  CHARGE_TYPES,
  UPSALE_BILLING_FLAG,
  MAGICPIN_BILLING_FLAG,
  DOTPE_BILLING_FLAG,
  ONDC_BILLING_FLAG,
  CAREEM_BILLING_FLAG,
  TALABAT_BILLING_FLAG,
  NOONFOOD_BILLING_FLAG,
  UBEREATS_BILLING_FLAG,
  DELIVEROO_BILLING_FLAG,
  FIDOO_BILLING_FLAG,
  JAHEZ_BILLING_FLAG,
  AMAZON_BILLING_FLAG,
  MRSOOL_BILLING_FLAG,
  RADYES_BILLING_FLAG,
  THRIVE_BILLING_FLAG,
  CULTFIT_BILLING_FLAG,
  GUPSHUP_BILLING_FLAG,
  INRESTO_BILLING_FLAG,
  JUSTEAT_BILLING_FLAG,
  SCOOTSY_BILLING_FLAG,
  CHATFOOD_BILLING_FLAG,
  FLIPDISH_BILLING_FLAG,
  EAZYDINER_BILLING_FLAG,
  SWIGGYSTORE_BILLING_FLAG,
  ZOMATOMARKET_BILLING_FLAG,
  FOODPANDA_BILLING_FLAG,
  DELIVERY_TAB_ID,
  DELIVERY_KOT_TABID,
  DELIVERY_BILL_TABID,
  DELIVERY_KOTTABLE,
  DELIVERY_BILLTABLE,
  DELIVERY_TABDIV_ID,
  BEANZ_BILLING_FLAG,
  CARI_BILLING_FLAG,
  HUNGERSATATION_BILLING_FLAG,
  INSTASHOP_BILLING_FLAG,
  SMILES_BILLING_FLAG,
  TOYOU_BILLING_FLAG,
  EATEASY,
  VOID_REASONS,
  SALUTATIONS,
  CUSTOMER_TYPE,
  SALUTATIONS_VALUES,
  EATEASY_BILLING_FLAG,
  ACCOUNT,
  KEETA_BILLING_FLAG,
  TALABAT_ORDER_TYPES,
  OTP_TYPES,
};
