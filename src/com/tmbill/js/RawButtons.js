const ACCEPT_BUTTON =
  '<button msg="ORDER_ACCEPTED" cur_state="Acknowledged"  prev_state="Placed" next_state="Food Ready" class="order-accept online-action-button has-i18n" id="orderacceptButton" data-i18n="controller:rawButtons.Accept">Accept</button>';
const REJECT_BUTTON =
  '<button cur_state="Cancelled"   prev_state="Placed" next_state="Cancelled" is_reject_button=true class="order-reject online-action-button has-i18n" id="orderrejectButton" data-i18n="controller:rawButtons.Reject" >Reject</button>';
const FOOD_READY_BUTTON =
  '<button data-i18n="controller:rawButtons.markAsFoodReady" msg="ORDER_PREPARED" cur_state="Food Ready"  prev_state="Acknowledged" next_state="Dispatched"  class="order-ready online-action-button has-i18n" id="orderreadyButton">Mark as Food Ready</button>';
const DISPATCH_BUTTON =
  '<button msg="ORDER_DISPATCHED" cur_state="Dispatched"  prev_state="Food Ready" next_state="Completed"  class="order-dispatch online-action-button has-i18n" id="orderdispatchButton"  data-i18n="controller:rawButtons.markAsDispatch" >Mark as Dispatch</button>';
const ORDER_COMPLETE_BUTTON =
  '<button msg="ORDER_COMPLETED" cur_state="Completed" prev_state="Dispatched" next_state="Completed"  class="order-complete online-action-button has-i18n" id="ordercompletetButton" data-i18n="controller:rawButtons.markAsComplete" >Mark as Complete</button>';
const ORDER_DETAILS_BUTTON =
  '<button class="order-details has-i18n" id="orderdetailsButton" data-i18n="controller:rawButtons.Details" >View </button>';
const ORDER_PAIDSTATUS =
  '<button class="order-paid-status has-i18n" data-i18n="controller:rawButtons.Paid" >Paid </button>';
const CANCEL_DUNZO_TASK =
  '<button class="rbt-btn has-i18n" data-i18n="controller:rawButtons.cancelDunzoTask" >Cancel Dunzo task </button>';
const SWALCHECKINPUT =
  '<input id="swalinputcheckId" type="checkbox"><label class="swalinputcheckLabel has-i18n" for="swalinputcheckId" data-i18n="controller:rawButtons.clearTheStoreDataAndRemoveIt"> Clear the store data and remove it.</label>';
// const RBT_BUTTON = '<button title=`Add Rider Body Temperature` class="rbt-btn" id="orderdetailsButton">Add RBT </button>';
const RBT_BUTTON =
  '<i title="Add Rider Body Temperature" class="rbt-btn fas fa-shield-virus has-i18n" ></i>';
const SWALCHECKINPUTFORSALEREPORT =
  '<input id="clearReportinputcheckId" type="checkbox"><label class="swalinputcheckLabel has-i18n" for="clearReportinputcheckId" data-i18n="controller:rawButtons.ClearSalesrecords"> Clear sales records.</label>';

const DIRECT_COMPLETE =
  '<i msg="ORDER_COMPLETED" cur_state="Completed" prev_state="Acknowledged" next_state="Completed"  class="online-action-button fa fa-check has-i18n" id="directOrdercompletetButton" data-i18n="controller:rawButtons.markAsComplete" ></i>';

const ACCEPT_REFUND_BUTTON =
  '<button msg="REFUND_ACCPTED"  class="order-accept online-action-button has-i18n" id="refundAcceptButton" data-i18n="controller:rawButtons.Accept">Accept Refund</button>';

const REJECT_REFUND_BUTTON =
  '<button msg="REFUND_REJECTED" class="reject-refund online-action-button has-i18n" id="refundRejectBtton" data-i18n="controller:rawButtons.Accept">Reject Refund</button>';

const SWIGGY_CONTACT_SUPPORT_BUTTON =
  '<button msg="CONTACT_SUPPORT" class="reject-refund online-action-button has-i18n" id="swiggyContactSupportButton" data-i18n="">Contact Support</button>';

const LOADER = '<i class="fas fa-spinner fa-spin text-center"></i>';
const CUSTOMER_LOADER =
  '<i class="fas fa-spinner fa-spin text-center customer-address-loader"></i>';

const LOAD_MORE_ELEMENT =
  '<li id="loadmoreOrdersbutton" class="list-group-item loadmoreElement has-i18n" data-i18n="controller:rawButtons.loadMore">Load More </li>';
const LOAD_MORE_ELEMENT_DIGITAL =
  '<li id="digitalloadmoreOrdersbutton" class="list-group-item loadmoreElement has-i18n" data-i18n="controller:rawButtons.loadMore">Load More </li>';
const LOAD_MORE_ELEMENT_REMOTE =
  '<li id="remotealloadmoreOrdersbutton" class="list-group-item loadmoreElement has-i18n" data-i18n="controller:rawButtons.loadMore">Load More </li>';

const PARTIAL_ACCEPT_BUTTON =
  '<button msg="ORDER_ACCEPTED" cur_state="Acknowledged"  prev_state="Placed" next_state="Food Ready" class="partial-order-accept online-action-button has-i18n" id="partialorderacceptButton" data-i18n="">Partial Accept</button>';

const RETURN_BUTTON =
  '<button cur_state="Returned"   prev_state="Completed" next_state="" is_reject_button=true  class="order-reject online-action-button has-i18n" id="orderreturnButton" data-i18n="" >Return</button>';

const ORDER_MAC_BUTTON =
  '<button class="order-details has-i18n" id="orderMerchantAgreementCancellationButton" data-i18n="" >MAC</button>';

const TABLEFOR_PREVIEW =
  '<table style="width:100%" class="bottom-border">' +
  '<tr>' +
  '<th data-i18n="previewScreen.Item" class="has-i18n lefTextAlign">Item</th>' +
  '<th data-i18n="previewScreen.Qty" class="has-i18n previewItemQtyClass rightTextAlign">Qty</th>' +
  '<th data-i18n="previewScreen.Rate" class="has-i18n previewItemRateClass rightTextAlign">Rate</th>' +
  '<th data-i18n="previewScreen.Total" class="has-i18n previewItemTotalClass rightTextAlign">Total</th>' +
  '</tr>' +
  '</table>';

const TABLEFOR_PREVIEW_IN_BOTH_LANG =
  '<table style="width:100%" class="bottom-border">' +
  '<tr>' +
  '<th data-i18n="bothLanguage.Item" class="has-i18n orderItemBysection lefTextAlign">Item <br> غرض</th>' +
  '<th data-i18n="bothLanguage.Qty" class="has-i18n orderItemBysection previewItemQtyClass rightTextAlign   ">Qty <br> الكمية</th>' +
  '<th data-i18n="bothLanguage.Rate" class="has-i18n orderItemBysection previewItemRateClass rightTextAlign">Rate <br> السعر</th>' +
  '<th data-i18n="bothLanguage.Total" class="has-i18n orderItemBysection previewItemTotalClass rightTextAlign">Total<br> الاجمالي</th>' +
  '</tr>' +
  '</table>';

const KOT_ORDERTYPE_DATAURL = {
  DINEINE: '',
  TAKEAWAY: '',
  HOME_DELIVERY: '',
  QUICKBILL: '',
  DIGITAL: '',
  ZOMATO: '',
  SWIGGY: '',
};

/**
 *
 * @param {*} storeDetails
 */
function generateMessages(storeDetails) {
  if (storeDetails !== undefined && storeDetails.store_name !== undefined) {
    const MESSAGES = {
      ORDER_ACCEPTED: `${window.storeDetails.store_name}  has accepted your order.`,
      ORDER_CANCELLED: `${window.storeDetails.store_name}  has rejceted your order.`,
      ORDER_PREPARED: `Your order is prepared and ready to pick up from 
        ${storeDetails.store_name}`,
      ORDER_DISPATCHED: `Your order is on the way from ${window.storeDetails.store_name}`,
      ORDER_COMPLETED: `Thank you for ordering from 
        ${window.storeDetails.store_name} 
        .Hope you enjoyed your food.`,
    };

    return MESSAGES;
  }
  return undefined;
}
module.exports = {
  TABLEFOR_PREVIEW_IN_BOTH_LANG,
  RETURN_BUTTON,
  PARTIAL_ACCEPT_BUTTON,
  DIRECT_COMPLETE,
  LOAD_MORE_ELEMENT_REMOTE,
  SWALCHECKINPUTFORSALEREPORT,
  KOT_ORDERTYPE_DATAURL,
  generateMessages,
  ACCEPT_BUTTON,
  REJECT_BUTTON,
  DISPATCH_BUTTON,
  FOOD_READY_BUTTON,
  ORDER_COMPLETE_BUTTON,
  ORDER_DETAILS_BUTTON,
  SWALCHECKINPUT,
  LOAD_MORE_ELEMENT,
  ORDER_PAIDSTATUS,
  TABLEFOR_PREVIEW,
  RBT_BUTTON,
  CANCEL_DUNZO_TASK,
  LOAD_MORE_ELEMENT_DIGITAL,
  LOADER,
  CUSTOMER_LOADER,
  ORDER_MAC_BUTTON,
  ACCEPT_REFUND_BUTTON,
  REJECT_REFUND_BUTTON,
  SWIGGY_CONTACT_SUPPORT_BUTTON,
};
