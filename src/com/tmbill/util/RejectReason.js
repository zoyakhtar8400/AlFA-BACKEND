const REJECT_REASON = {
  // ITEM_OUT_OF_STOCK: 'Item out of stock.',
  ITEM_OUT_OF_STOCK: $.i18n.t(
    'controller:digitalOrderController.rejectReason.itemOutOfStock',
  ),
  NO_DELIVERY_GUY: $.i18n.t(
    'controller:digitalOrderController.rejectReason.deliveryPersonNotAvailable',
  ),
  NO_DELIVERY_AT_LOCATION: $.i18n.t(
    'controller:digitalOrderController.rejectReason.deliveryNotAvailableAtThisLocation',
  ),
  CLOSING_TIME: $.i18n.t(
    'controller:digitalOrderController.rejectReason.closingTime',
  ),
  STORE_BUSY: $.i18n.t(
    'controller:digitalOrderController.rejectReason.storeBusy',
  ),
  RIDER_NOT_AVAILABLE: $.i18n.t(
    'controller:digitalOrderController.rejectReason.riderNotAvailable',
  ),
  OUT_OF_DELIVERY_RADIUS: $.i18n.t(
    'controller:digitalOrderController.rejectReason.outOfDeliveryRadius',
  ),
  CONNECTIVITY_ISSUE: $.i18n.t(
    'controller:digitalOrderController.rejectReason.connectivityIssue',
  ),
  TOTAL_MISMATCH: $.i18n.t(
    'controller:digitalOrderController.rejectReason.totalMismatch',
  ),
  INVALID_ITEM: $.i18n.t(
    'controller:digitalOrderController.rejectReason.invalidItem',
  ),
  OPTION_OUT_OF_STOCK: $.i18n.t(
    'controller:digitalOrderController.rejectReason.optionsOutOfStock',
  ),
  INVALID_OPTION: $.i18n.t(
    'controller:digitalOrderController.rejectReason.invalidOption',
  ),
  UNSPECIFIED: $.i18n.t(
    'controller:digitalOrderController.rejectReason.Unspecified',
  ),
};

// [
//  'Item out of Stock',
//  'Delivery Person not available',
//  'Delivery not available at this location',
//  'Closing time',
//  'Store Busy',
//   'Rider not available',
//   'Out of delivery radius',
//   'Connectivity issue',
//   'Total Mismatch',
//   'Invalid item',
//   'Options Out of Stock',
//   'Invalid Option',
//  'Unspecified',
// ]

// const ONDC_REJECT_REASON = [
//   {
//     comment: 'One or more items in the Order not available.',
//     code: '002',
//   },
//   {
//     comment: 'Merchant rejected the order',
//     code: '005',
//   },
//   {
//     comment: 'Order/fulfillment not ready for pickup',
//     code: '008',
//   },
//   {
//     comment: 'Buyer not found or cannot be contacted.',
//     code: '011',
//   },
//   {
//     comment: 'Buyer does not want product any more.',
//     code: '012',
//   },
//   {
//     comment: 'Buyer refused to accept delivery.',
//     code: '013',
//   },
//   {
//     comment: 'Address not found',
//     code: '014',
//   },
//   {
//     comment: 'Buyer not available at location',
//     code: '015',
//   },
//   {
//     comment: 'Accident / rain / strike / vehicle issues',
//     code: '016',
//   },
//   {
//     comment: 'Order delivery delayed or not possible',
//     code: '017',
//   },
//   {
//     comment: 'Delivery pin code not serviceable',
//     code: '018',
//   },
//   {
//     comment: 'Pickup pin code not serviceable',
//     code: '019',
//   },
//   {
//     comment: 'Order lost in transit',
//     code: '020',
//   },
//   {
//     comment: 'Packed order not complete',
//     code: '021',
//   },
// ];
const ONDC_REJECT_REASON = {
  '002': 'One or more items in the Order not available.',
  '005': 'Merchant rejected the order',
  '008': 'Order/fulfillment not ready for pickup',
  '011': 'Buyer not found or cannot be contacted.',
  '012': 'Buyer does not want product any more.',
  '013': 'Buyer refused to accept delivery.',
  '014': 'Address not found',
  '015': 'Buyer not available at location',
  '016': 'Accident / rain / strike / vehicle issues',
  '017': 'Order delivery delayed or not possible',
  '018': 'Delivery pin code not serviceable',
  '019': 'Pickup pin code not serviceable',
  '020': 'Order lost in transit',
  '021': 'Packed order not complete',
};

const ONDC_REASON_CODES = {
  '001': {
    comment:
      'Price of one or more items have changed due to which buyer was asked to make additional payment',
    code: '001',
    for: 'BAP',
  },
  '002': {
    comment: 'One or more items in the Order not available.',
    code: '002',
    for: 'BPP',
  },
  '003': {
    comment: 'Product available at lower than order price.',
    code: '003',
    for: 'BAP',
  },
  '004': {
    comment:
      'Order / fulfillment in pending shipment / delivery state for too long',
    code: '004',
    for: 'BAP',
  },
  '005': {
    comment: 'Merchant rejected the order',
    code: '005',
    for: 'BPP',
  },
  '006': {
    comment: 'Order / fulfillment not received as per buyer app SLA',
    code: '006',
    for: 'BAP',
  },
  '008': {
    comment: 'Order/fulfillment not ready for pickup',
    code: '008',
    for: 'LOG',
  },
  '009': {
    comment: 'Wrong product delivered.',
    code: '009',
    for: 'BAP',
  },
  '010': {
    comment: 'Buyer wants to modify details.',
    code: '010',
    for: 'BAP',
  },
  '011': {
    comment: 'Buyer not found or cannot be contacted.',
    code: '011',
    for: 'BPP',
  },
  '012': {
    comment: 'Buyer does not want product any more.',
    code: '012',
    for: 'BPP',
  },
  '013': {
    comment: 'Buyer refused to accept delivery.',
    code: '013',
    for: 'BPP',
  },
  '014': {
    comment: 'Address not found',
    code: '014',
    for: 'BPP',
  },
  '015': {
    comment: 'Buyer not available at location',
    code: '015',
    for: 'BPP',
  },
  '016': {
    comment: 'Accident / rain / strike / vehicle issues',
    code: '016',
    for: 'BPP',
  },
  '017': {
    comment: 'Order delivery delayed or not possible',
    code: '017',
    for: 'LOG',
  },
  '018': {
    comment: 'Delivery pin code not serviceable',
    code: '018',
    for: 'BPP',
  },
  '019': {
    comment: 'Pickup pin code not serviceable',
    code: '019',
    for: 'BPP',
  },
  '020': {
    comment: 'Order lost in transit',
    code: '020',
    for: 'LOG',
  },
  '021': {
    comment: 'Packed order not complete',
    code: '021',
    for: 'LOG',
  },
};

const ONDC_RETURN_REASON = {
  'Return-approved': 'Return-approved',
  'Return-rejected': 'Return-rejected',
  'Return-liquidated': 'Return-liquidated',
};

const ZOMATO_REJECT_REASON = {
  1: 'Item out of stock',
  2: 'No delivery boys available',
  3: 'Nearing closing time',
  4: 'Out of Subzone/Area',
  5: 'Kitchen is Full',
  6: 'Merchant device issue',
  7: 'Outlet Closed',
};

const DELIVEROO_REJECT_REASON = {
  1: 'ingredient_unavailable',
  2: 'other',
  3: 'closing_early',
  5: 'busy',
};
const HUNGERSTATION_REJECT_REASONS = {
  1: 'ADDRESS_INCOMPLETE_MISSTATED',
  2: 'BAD_WEATHER',
  3: 'BLACKLISTED',
  4: 'CARD_READER_NOT_AVAILABLE',
  5: 'CLOSED',
  6: 'CONTENT_WRONG_MISLEADING',
  7: 'FOOD_QUALITY_SPILLAGE',
  8: 'FRAUD_PRANK',
  9: 'ITEM_UNAVAILABLE',
  10: 'LATE_DELIVERY',
  11: 'MENU_ACCOUNT_SETTINGS',
  12: 'MOV_NOT_REACHED',
  13: 'NO_COURIER',
  14: 'NO_PICKER',
  15: 'NO_RESPONSE',
  16: 'OUTSIDE_DELIVERY_AREA',
  17: 'TECHNICAL_PROBLEM',
  18: 'TEST_ORDER',
  19: 'TOO_BUSY',
  20: 'UNABLE_TO_FIND',
  21: 'UNABLE_TO_PAY',
  22: 'UNPROFESSIONAL_BEHAVIOUR',
  23: 'WILL_NOT_WORK_WITH_PLATFORM',
  24: 'WRONG_ORDER_ITEMS_DELIVERED',
  25: 'BAD_LOCATION',
  26: 'BILLING_PROBLEM',
  27: 'COURIER_ACCIDENT',
  28: 'COURIER_UNREACHABLE',
  29: 'DELIVERY_ETA_TOO_LONG',
  30: 'DUPLICATE_ORDER',
  31: 'MISTAKE_ERROR',
  32: 'NEVER_DELIVERED',
  33: 'ORDER_MODIFICATION_NOT_POSSIBLE',
  34: 'OUTSIDE_SERVICE_HOURS',
  35: 'REASON_UNKNOWN',
  36: 'UNREACHABLE',
  37: 'VOUCHER_NOT_APPLIED',
  38: 'EXTRA_CHARGE_NEEDED',
  39: 'EXTRA_CHARGE_NEEDED',
};

const TALABAT_REJECT_REASONS = {
  1: 'ADDRESS_INCOMPLETE_MISSTATED',
  2: 'BAD_WEATHER',
  3: 'BLACKLISTED',
  4: 'CARD_READER_NOT_AVAILABLE',
  5: 'CLOSED',
  6: 'CONTENT_WRONG_MISLEADING',
  7: 'FOOD_QUALITY_SPILLAGE',
  8: 'FRAUD_PRANK',
  9: 'ITEM_UNAVAILABLE',
  10: 'LATE_DELIVERY',
  11: 'MENU_ACCOUNT_SETTINGS',
  12: 'MOV_NOT_REACHED',
  13: 'NO_COURIER',
  14: 'NO_PICKER',
  15: 'NO_RESPONSE',
  16: 'OUTSIDE_DELIVERY_AREA',
  17: 'TECHNICAL_PROBLEM',
  18: 'TEST_ORDER',
  19: 'TOO_BUSY',
  20: 'UNABLE_TO_FIND',
  21: 'UNABLE_TO_PAY',
  22: 'UNPROFESSIONAL_BEHAVIOUR',
  23: 'WILL_NOT_WORK_WITH_PLATFORM',
  24: 'WRONG_ORDER_ITEMS_DELIVERED',
};

const SWIGGY_REJECT_REASON = {
  // ITEMS_OUT_OF_STOCK: 'ITEMS_OUT_OF_STOCK',
  // RESTAURANT_CLOSED: 'RESTAURANT_CLOSED',
  // KITCHEN_STRESS: 'KITCHEN_STRESS',
  // MERCHANT_DEVICE_ISSUE: 'MERCHANT_DEVICE_ISSUE',
  // NO_DELIVERY_PARTNER_AVAILABLE: 'NO_DELIVERY_PARTNER_AVAILABLE',
  // CUSTOMER_OUTSIDE_DELIVERY_RADIUS: 'CUSTOMER_OUTSIDE_DELIVERY_RADIUS',
  1: 'ITEMS_OUT_OF_STOCK',
  2: 'NO_DELIVERY_PARTNER_AVAILABLE',
  4: 'CUSTOMER_OUTSIDE_DELIVERY_RADIUS',
  5: 'KITCHEN_STRESS',
  6: 'MERCHANT_DEVICE_ISSUE',
  7: 'RESTAURANT_CLOSED',
};

const KEETA_REJECT_REASON = {
  500000: 'others',
  500001: 'Insufficient dishes',
  500002: 'Suspension of business',
  500003: 'Insufficient manpower',
};

const KEETA_REFUND_REJECT_REASON = {
  100001: 'Meal has been served',
  100002: 'Start delivery',
  100000: 'Other',
};
module.exports = {
  REJECT_REASON,
  ONDC_REJECT_REASON,
  ONDC_RETURN_REASON,
  ZOMATO_REJECT_REASON,
  ONDC_REASON_CODES,
  DELIVEROO_REJECT_REASON,
  HUNGERSTATION_REJECT_REASONS,
  KEETA_REJECT_REASON,
  KEETA_REFUND_REJECT_REASON,
  TALABAT_REJECT_REASONS,
  SWIGGY_REJECT_REASON,
};
