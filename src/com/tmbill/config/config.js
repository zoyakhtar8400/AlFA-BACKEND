/* eslint-disable no-console */
const { ENVS } = require('../util/Constants');
const isDev = require('../packages/electron-is-dev');

const NEW_CHANNEL_API_ADDED = true;

const Version1 = 'v1';
const Version2 = 'v2';
const Version3 = 'v3';
const Version4 = 'v4';

let baseUrl = 'https://api.tmbill.com/';

if (isDev && [ENVS.TEST].includes(process.env.NODE_ENV)) {
  baseUrl = 'https://staging.tmbill.com/';
}

if (process.env.FORCE_STAGING) {
  baseUrl = 'https://staging.tmbill.com/';
}

// baseUrl = 'https://staging.tmbill.com/';

const APP_CONFIG = {
  DBConfig: {
    username: process.env.DB_USER || 'openpg',
    password: process.env.DB_PASSWORD || 'openpgpwd',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    DBName: process.env.DB_NAME || 'alfa_restaurant',
    dialect: process.env.DB_DIALECT || 'postgres',
  },
  links: {
    // MPOS API Services
    signin: `${baseUrl}mpos/${Version2}/store/signin`,
    signinwithaccesscode: `${baseUrl}/mpos/${Version1}/store/public/LoginByCode`,
    loadmenu: `${baseUrl}mpos/${Version4}/menu/catalogue`,
    getCustomers: `${baseUrl}mpos/${Version1}/customer`,
    addCustomerbulk: `${baseUrl}mpos/${Version1}/customer/bulk`,
    profileUpdate: `${baseUrl}mpos/${Version1}/user/profile`,
    syncBills: `${baseUrl}mpos/${Version2}/sync/order`,
    customerHistory: `${baseUrl}mpos/${Version4}/customer/history`,
    customerAnalytics: `${baseUrl}mpos/${Version4}/customer/history`,
    requestDemo: `${baseUrl}mpos/${Version1}/customer/enquiry`,
    addExpensecat: `${baseUrl}mpos/${Version1}/expenses/category`,
    reduceInventory: `${baseUrl}mpos/${Version1}/inventory/reduce-stock`,
    reverseInventory: `${baseUrl}mpos/${Version1}/inventory/reverse-stock`,
    couponDiscount: `${baseUrl}mpos/${Version1}/coupon`,
    couponDiscountHistory: `${baseUrl}mpos/${Version1}/coupon/history`,
    liveSupport: `${baseUrl}mpos/${Version1}/misc/live-support`,
    dayendSync: `${baseUrl}mpos/${Version1}/sync/dayend`,
    createWallet: `${baseUrl}mpos/${Version1}/customer/wallet`,
    sendOTP: `${baseUrl}mpos/${Version1}/sms/send-otp`,
    sendcustomertoDboy: `${baseUrl}mpos/${Version1}/sms/delivery-details`,
    sendtrackingInfo: `${baseUrl}mpos/${Version1}/store/login-history`,
    sendbill: `${baseUrl}mpos/${Version1}/sms/send-bill`,
    sendresetdates: `${baseUrl}mpos/${Version1}/outlet/reset-date`,
    getStoreexpirydate: `${baseUrl}mpos/${Version1}/outlet/activation-details`,
    logpasscodeActivity: `${baseUrl}mpos/${Version1}/passcode/activity`,
    getLatestBillNumber: `${baseUrl}mpos/${Version1}/order/lastest-bill`,
    itemEnableDisable: `${baseUrl}mpos/${Version1}/platform/inventory/locations`,
    clearFirebaseToken: `${baseUrl}mpos/${Version2}/store/logout`,
    catalogueReload: `${baseUrl}mpos/${Version1}/menu/catalogue/reload`,
    generateIRN: `${baseUrl}tp/${Version1}/hostbook/GenerateIRN`,
    orderpaymentDifference: `${baseUrl}mpos/${Version1}/payment/GetOrdersPaymentDifference`,
    getTableReservations: `${baseUrl}mpos/${Version1}/Reservation`,
    getDate: `${baseUrl}mpos/${Version1}/outlet/GetDate`,
    sendReport: `${baseUrl}api/${Version1}/submit-todays-report`,
    loadModifiersData: `${baseUrl}mpos/${Version1}/modifiers/modifiers-groups`,
    loadItemPricesData: `${baseUrl}mpos/${Version1}/item/multi-prices`,
    loadItemNotesData: `${baseUrl}mpos/${Version1}/item/item-notes`,
    reduceStockManually: `${baseUrl}mpos/${Version1}/inventory/reduce-stock-manual`,
    zatcaInvoice: `${baseUrl}tp/${Version2}/zatca/ReportInvoice`,
    jordanEinvoice: `${baseUrl}tp/${Version1}/FlexOps/ReportInvoice`,
    // zatcaV2Invoice: `${baseUrl}tp/${Version2}/zatca/ReportInvoice`,
    customerFinancialSummary: ` ${baseUrl}mpos/${Version1}/customer/customerFinancialSummary`,
    testFCM: `${baseUrl}channel/${Version1}/notification/TestFCM`,
    requestOTP: `${baseUrl}mpos/${Version1}/sms/requestOtp`,
    validateOTP: `${baseUrl}mpos/${Version1}/sms/validateOtp`,
    // Digital
    digitalOrders: `${baseUrl}digimenu/tmdigi-menu/api/orderbystore`,
    updatedigitalOrder: `${baseUrl}digimenu/tmdigi-menu/api/status`,
    updatedigitalPaymode: `${baseUrl}digimenu/tmdigi-menu/api/paymodefororder`,
    updateDeliveryboy: `${baseUrl}digimenu/tmdigi-menu/api/deliveryboyfororder`,
    digitalOrderssubscribe: `${baseUrl}digimenu/tmdigi-menu/api/save-subscription`,
    cancelDunzotask: `${baseUrl}digimenu/tmdigi-menu/api/cancel_dunzo_task`,
    remoteKot: `${baseUrl}digimenu/tmdigi-menu/api/kotbystore`,
    updateRemoteKot: `${baseUrl}digimenu/tmdigi-menu/api/remotekot`,
    getstorePayment: `${baseUrl}digimenu/tmdigi-menu/api/payment`,
    getPlatformCatalogue: `${baseUrl}mpos/${Version1}/platform/catalogue`,
    getPlatforms: `${baseUrl}mpos/v1/platform/stores`,
    updateDigiStoreMenu: `${baseUrl}mpos/${Version2}/platform/inventory/locations`,
    updateplatformStorestatus: `${baseUrl}mpos/v2/platform/location`,
    publishDigiStoreMenu: `${baseUrl}mpos/${Version1}/platform/publish`,
    rejectONDCOrder: `${baseUrl}tp/${Version1}/ondc/CancelOrder`,
    partialOrderAccept: `${baseUrl}tp/${Version1}/ondc/PartialAccept`,
    returnOrder: `${baseUrl}tp/${Version1}/ondc/return_order`,
    deactivateRemoteKOT: `${baseUrl}tp/${Version1}/order/RemoteKotInActive`,
    macUpdate: `${baseUrl}v1/mpos/MACUpdate`,
    acceptKeetaRefund: `${baseUrl}channel/${Version1}/keeta/aggreeRefundRequest`,
    rejectKeetaRefund: `${baseUrl}hannel/${Version1}/keeta/rejectRefundRequest`,
    swiggyContactSupport: `${baseUrl}mpos/${Version1}/contact/swiggy-support`,
    swiggyContactMasking: `${baseUrl}mpos/${Version1}/contact/swiggy-contact-masking`,
    swiggyEditOrder: `${baseUrl}mpos/${Version1}/contact/swiggy-edit-order`,
    ITEM_STOCK_OUTBOX_INGEST: `${baseUrl}mpos/${Version1}/item/stock`,

    customeraddress: `${baseUrl}digimenu/tmdigi-menu/api/address`,
    getCustomerProfile: `${baseUrl}digimenu/tmdigi-menu/api/customer/profile`,

    // Channel
    updateChannelOrderStatus: `${baseUrl}channel/v1/mpos/UpdateOrder`,

    // Loyalty
    getRewardsnPoints: `${baseUrl}mpos/${Version2}/customer/loyalty`,
    sendloyaltyOtp: `${baseUrl}mpos/${Version1}/sms/loyalty-otp`,
    rewardHistory: `${baseUrl}mpos/${Version2}/customer/reward-history`,
    sendpointruleAction: `${baseUrl}mpos/${Version2}/customer/add-rule-points`,

    // reelo loyalty
    getReelocustomerLoyaltyDetails: `${baseUrl}tp/${Version1}/reelo/GetCustomerLoyaltyDetails`,
    reeloRedeemCoupon: `${baseUrl}tp/${Version1}/reelo/ReedemCoupon`,
    reeloRedeemPoints: `${baseUrl}tp/${Version1}/reelo/ReedemPoints`,
    reeloAuthRedeemption: `${baseUrl}tp/${Version1}/reelo/AuthRedemption`,

    // Third Party
    START_EZETAP_TRX: `${baseUrl}tp/${Version1}/ezetap/StartTransaction`,
    CHECK_EZETAP_TRX: `${baseUrl}tp/${Version1}/ezetap/CheckStatus`,
    START_ZOMATO_PAY_TRX: `https://pay.tmbill.com/v1/ZomatoPay/ValidateAuthCode`,

    // menu update
    updateItem: `${baseUrl}mpos/${Version1}/item/save`,
    addCategory: `${baseUrl}mpos/${Version1}/item/category`,
    addKitchenDepartment: `${baseUrl}mpos/${Version1}/item/kitchen-dept`,
    categoryEnableDisable: `${baseUrl}mpos/${Version1}/item/category-items`,
    multiCategoryEnableDisable: `${baseUrl}mpos/${Version2}/item/category-items`,

    getMenuId: `${baseUrl}mpos/${Version1}/item/menu`,
    getCategories: `${baseUrl}mpos/${Version1}/item/category-list`,

    // sunmi
    startSunmiTransaction: `https://pay.tmbill.com/v1/sunmi/StartTransaction`,
    cancelSunmiTransaction: `https://pay.tmbill.com/v1/sunmi/CheckConnection`,
    checkSunmiTransaction: `https://pay.tmbill.com/v1/sunmi/CheckTransaction`,
  },
  template: {
    LOGIN: './src/com/tmbill/templates/login.html',
    HOME: 'src/com/tmbill/templates/Home.html',
    SPLASH: 'src/com/tmbill/templates/Splash_Screen.html',
    NEW_LOGIN: 'src/com/tmbill/templates/login.html',
    NEW_HOME: 'src/com/tmbill/templates/Home.html',
    NEW_SPLASH: 'src/com/tmbill/templates/Splash_Screen.html',
  },
  theme: 'light',
  basePath: '',
  sourcePath: '',
  senderId: '992602538917', // 697935885051 992602538917
  server_port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8000,
  cipherKey: process.env.CIPHER_KEY || 'ep6nEwGhdNKSJZLXR5Q',
  JWT_SECRET: process.env.JWT_SECRET,
  baseUrl,
};

const Config = APP_CONFIG;
if (isDev) {
  console.log('Starting app in dev mode');
} else {
  console.log('Starting app in prod mode');
}

Config.isDev = isDev;
Config.releaseDate = '04 April 2026';
Config.USE_NEW_API_BACKEND = true;
Config.NEW_CHANNEL_API_ADDED = NEW_CHANNEL_API_ADDED;

module.exports = {
  mode: 1,
  Config,
};
