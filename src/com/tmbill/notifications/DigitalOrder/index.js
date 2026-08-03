/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
// implement queue for order pull and kot and bill print

const {
  addDigitalOrdersInLocalStorage,
  removeDigitalOrderFromLocalStorage,
} = require('../../js/DigitalOrder/checkPullOrder');
const { apiCall } = require('../../services/APIService');
const { CHECK_IF_ORDER_IS_PULLED } = require('../../util/IPC_Messages');
const {
  getHeadersformposforrender,
} = require('../../util/MiscServer.renderer');
const { safeParse } = require('../../util/RendererUtils');

// const orderIdsToPull = [];
const orderIdsToPull = new Set();
const pulledOrderIds = new Set();
async function fetchOrder(order_id) {
  try {
    console.log(`Message="Fetch online orders for pull" order_id=${order_id}`);
    const { data: response } = await apiCall.post(
      window.Config.links.digitalOrders,
      {
        order_id,
        offset: 0,
        store_id: window.storeDetails.store_id,
        flag: 1,
        order_state: 'acknowledged',
        add_limit: 0,
        search: '',
        billing_type: [],
      },
      {
        headers: getHeadersformposforrender(),
      },
    );
    if (response && response.data) {
      const orderData = response.data[0];
      if (orderData) {
        console.log(
          `Message="Digital Order Auto Accepted. Pulling.." OrderId=${order_id} StoreId=${window.storeDetails.store_id}`,
        );
        if (orderData && orderData.extra_details) {
          const extra_details = safeParse(orderData.extra_details);
          if (extra_details.isOrderPulled) {
            console.log(
              `Message="Digital Order already pulled.May be on same device or different device" OrderId=${order_id} StoreId=${window.storeDetails.store_id}`,
            );
            return;
          }
        }

        const isOrderPulled = await window.betteripcRenderer.callMain(
          CHECK_IF_ORDER_IS_PULLED,
          { order_id },
        );

        if (!isOrderPulled) {
          await window.pullDigitalOrderFromRemote(orderData, order_id);
        } else {
          console.log(
            `Message="Order is already pulled" OrderId=${order_id} StoreId=${window.storeDetails.store_id}`,
          );
        }
      } else {
        removeDigitalOrderFromLocalStorage(order_id);
        console.error(
          `Message="Order Not Found. Please pull the order manually" OrderId=${order_id} StoreId=${window.storeDetails.store_id}`,
        );
      }
    }
  } catch (error) {
    console.error(
      `Message="Error while fetcing online order for pull order on accept" OrderId=${order_id} StoreId=${window.storeDetails.store_id}`,
      error,
    );
  }
}

let isPullInProgress = false;

async function pullOrders() {
  console.log('orderIdsToPull::', orderIdsToPull);
  while (orderIdsToPull.size > 0) {
    const orderId = orderIdsToPull.values().next().value;
    isPullInProgress = true;
    orderIdsToPull.delete(orderId);
    await fetchOrder(orderId);
    isPullInProgress = false;
  }
}

async function pullDigitalOrderOnAccept(notificationData) {
  try {
    const { order_id } = notificationData;
    // orderIdsToPull.push(order_id);
    addDigitalOrdersInLocalStorage(order_id);
    if (orderIdsToPull.has(order_id)) {
      return;
    }
    orderIdsToPull.add(order_id);
    if (!isPullInProgress) {
      pullOrders();
    }
  } catch (error) {
    console.error(`Message="Error in pull order queue" Error=`, error);
  }
}

window.pullPendingDigitalOrders = (order_id) => {
  orderIdsToPull.add(order_id);
  if (!isPullInProgress) {
    pullOrders();
  }
};

async function printCancelledOnlineOrerKot(order_id) {
  try {
    console.log(
      `Message="Fetch cancelled online order for kot print" order_id=${order_id}`,
    );
    const { data: response } = await apiCall.post(
      window.Config.links.digitalOrders,
      {
        order_id,
        offset: 0,
        store_id: window.storeDetails.store_id,
        flag: 1,
        order_state: 'cancelled',
        add_limit: 0,
        search: '',
        billing_type: [],
      },
      {
        headers: getHeadersformposforrender(),
      },
    );
    if (response && response.data) {
      const orderData = response.data[0];
      if (orderData) {
        await window.printCancelledOrderKOT(orderData, order_id);
      } else {
        removeDigitalOrderFromLocalStorage(order_id);
        console.error(
          `Message="Order Not Found. Please print cancell kot manually" OrderId=${order_id} StoreId=${window.storeDetails.store_id}`,
        );
      }
    }
  } catch (error) {
    console.error(
      `Message="Error while fetcing online order for print cancel kot" OrderId=${order_id} StoreId=${window.storeDetails.store_id}`,
      error,
    );
  }
}
module.exports = {
  pullDigitalOrderOnAccept,
  printCancelledOnlineOrerKot,
};
