const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const { ORDERS_NOTIFICATION } = require('../util/OrderStates');
const { clickelementifVisible } = require('../util/RendererUtils');
const { DIGITAL_ORDER_IPC } = require('../constant/IPCEvents');

let eventSource;
// window.isSseServiceModuleLoaded = true;

function initializeEventsource() {
  if (eventSource) {
    eventSource.close();
  }
  if (!window.isSSEEnabled) {
    return;
  }

  if (!window.__IS_MASTER_POS__) {
    return;
  }

  // eventSource = new EventSourcePolyfill(
  //   `https://api.tmbill.com/channel/v1/mpos/CheckPendingOrdersSSE?store_id=${window.storeDetails.store_id}`,
  //   {
  //     headers: getHeadersformposforrender(),
  //   },
  // eventSource = new EventSourcePolyfill(
  //   `https://backoffice.tmbill.com/stream-events?store_id=${window.storeDetails.store_id}`,
  //   {
  //     headers: getHeadersformposforrender(),
  //   },
  // );

  eventSource = new EventSource(
    `https://backoffice.tmbill.com/v2/stream-events?store_id=${window.storeDetails.store_id}`,
    {
      headers: getHeadersformposforrender(),
    },
  );

  eventSource.addEventListener(
    'message',
    (e) => {
      checkMessage(e.data);
    },
    false,
  );

  eventSource.addEventListener(
    'open',
    (e) => {
      console.log('Connection was opened.');
    },
    false,
  );

  eventSource.addEventListener(
    'notifications',
    (e) => {
      console.log('e.data:', e.data);
      checkMessage(e.data);
    },
    false,
  );

  eventSource.addEventListener(
    'error',
    (e) => {
      if (e.readyState == EventSource.CLOSED) {
        console.log(e.data);
      }
    },
    false,
  );
}

function checkforcancelledOrders(payload) {
  try {
    if (
      payload &&
      payload?.body &&
      payload?.body?.cancelledOrders &&
      payload?.body?.cancelledOrders.length
    ) {
      const cancelledOrders = payload?.body?.cancelledOrders || [];
      if (cancelledOrders && cancelledOrders.length > 0) {
        console.log(
          `Message="Cancelled Orders Found.Sending update status Request" OrderID="${cancelledOrders}"`,
        );
        ipcRenderer.send(DIGITAL_ORDER_IPC.UPDATE_ORDERSTATUS, {
          order_id: cancelledOrders,
          order_state: 'cancelled',
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
}

function checkMessage(params) {
  try {
    const data = JSON.parse(params);
    console.log('data:', data);
    // if (data && data.status === HttpStatusCode.Ok && data.notification) {
    if (data && data.notification) {
      const notificationData = data.notification.body;
      if (notificationData && notificationData.flag === 13) {
        // Terminate the notification sound
        stopHowler();
        showNotification(data.notification);
        checkforcancelledOrders(data.notification);
      }
    }
  } catch (error) {
    console.log(error);
  }
}

/**
 * Mimics the click for a current notification type
 * @param {Order type} type
 */
function checkNotificationtypeandtakeaction(type) {
  switch (type) {
    case ORDERS_NOTIFICATION.NEW_ORDER:
      $('#neworderButton').click();
      break;
    case ORDERS_NOTIFICATION.NEW_ORDER_ALT:
      $('#neworderButton').click();
      break;
    case ORDERS_NOTIFICATION.CANCELLED_ORDER:
      clickelementifVisible('#cancelledordersButton');
      break;
    case ORDERS_NOTIFICATION.DIGITAL_ORDER:
    case ORDERS_NOTIFICATION.PENDING_ORDERS_FOUND:
      clickelementifVisible('#newdigitalorderButton');
      break;
    case ORDERS_NOTIFICATION.DIGITAL_ORDER_CANCELLED:
      clickelementifVisible('#cancelleddigitalordersButton');
      break;
    case ORDERS_NOTIFICATION.REMOTE_KOT:
      clickelementifVisible('#remoteKot');
      break;
    default:
      break;
  }
}

/**
 * Notify user
 * @param {No of pending order} count
 */
async function showNotification(payload) {
  if (payload && payload?.body && payload?.body?.order_count) {
    PlayHowlerbyid();
    bs4Toast.show(
      payload.title || 'TMBill',
      payload?.body?.msg || 'You have got a new order',
      {},
      {
        buttons: [
          {
            text: 'View Order',
            class: 'btn viweNotification',
            callback: (id) => {
              openwindowFromremote('digital');
              if (payload?.body?.flag)
                checkNotificationtypeandtakeaction(payload?.body?.flag);
            },
          },
        ],
        icon: {
          type: 'image',
          src: payload?.image || '',
        },
      },
    );

    // setTimeout(stopHowler, 10000);
  }
}

module.exports = {
  initializeEventsource,
};
