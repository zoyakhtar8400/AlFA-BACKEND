/* eslint-disable no-unused-expressions */
/* eslint-disable camelcase */
const { apiCall } = require('../../services/APIService');
const {
  getHeadersformposforrender,
} = require('../../util/MiscServer.renderer');
const { sleep } = require('../../util/MiscUtil');
const { safeParse } = require('../../util/RendererUtils');
const { showLoader } = require('../CommonUtils');
const { repeateOrder } = require('./RepeatOrder');

function initializei18nforBillDetails() {
  if ($.i18n && $.i18n.language !== 'en') {
    $('#customerOrderDetialsModal .has-i18n').localize();
    $('#ordersContainer .has-i18n').localize();
  }
}

// Initialize waitersList if not exists
if (!window.waitersList) {
  window.waitersList = [];
  console.log('Initialized empty waitersList');
}

function addOrderItems(items) {
  $('#customerOrderItemsTableId').find('tr:not(:first)').remove();
  if (items && items.length) {
    const table = $('#customerOrderItemsTableId');
    items.forEach((itemData) => {
      const item = itemData;
      let itemTitle = item.title;
      if (
        window.selectedLanguage !== 'en' &&
        item.extra_details?.alternative_title
      ) {
        itemTitle = item.extra_details.alternative_title;
        item.alternative_title = item.extra_details.alternative_title;
      }
      if (item && item.extra_details && item.extra_details.baseTitle) {
        itemTitle = item.extra_details.baseTitle;
        if (
          window.selectedLanguage !== 'en' &&
          item.extra_details.alternative_title
        ) {
          itemTitle = item.extra_details.alternative_title;
          item.alternative_title = item.extra_details.alternative_title;
        }
      }
      if (item.item_options && item.item_options.length) {
        item.item_options.forEach((addon) => {
          if (
            window.selectedLanguage !== 'en' &&
            addon.extra_details &&
            addon.extra_details.alternative_title
          ) {
            itemTitle = `${itemTitle}<br> + ${addon.qty} x ${addon.extra_details.alternative_title}`;
            addon.alternative_title = addon.extra_details.alternative_title;
          } else {
            itemTitle = `${itemTitle}<br> + ${addon.qty} x ${addon.title}`;
          }
        });
      }
      const itemrow = $('<tr>');
      const rowCell1 = $('<td>', { html: itemTitle });
      const rowCell2 = $('<td>', { html: item.quantity });
      const rowCell3 = $('<td>', { html: item.total });
      itemrow.append(rowCell1);
      itemrow.append(rowCell2);
      itemrow.append(rowCell3);
      table.append(itemrow);
    });
  }
}

function showBillDetails(orderData) {
  if (orderData) {
    const order = safeParse(orderData);
    console.log('=== FULL ORDER DATA ===', order);

    const billingType =
      window.orderTypes[Number(order.billing_type)].order_type;

    if (order.phone && order.cust_name) {
      $('#customerOrderDetailsHeadingId').html(
        ` | ${order.cust_name}: ${order.phone}`,
      );
    }

    $('#customerOrderDetialsModal').attr(
      'order-data',
      JSON.stringify(order).replace(/'/g, '&apos;'),
    );

    // Set basic order information
    order.order_id
      ? $('#customerOrderOrderId').text(order.order_id)
      : $('#customerOrderOrderId').text('-');
    $('#customerOrderOutletId').text(window.storeDetails.store_id);
    $('#customerOrderOutletNameId').text(order?.storeDetails?.name);
    order.cust_name
      ? $('#customerOrderCustomerNameId').text(order.cust_name)
      : $('#customerOrderCustomerNameId').text('-');
    order.table_name
      ? $('#customerOrderTableNameId').text(order.table_name)
      : $('#customerOrderTableNameId').text('-');
    order.created_date
      ? $('#customerOrderDateId').text(
          `${order.created_date} ${order.created_time}`,
        )
      : $('#customerOrderDateId').text('-');
    order.user_id
      ? $('#customerOrderUsernameId').text(order.user_id)
      : $('#customerOrderUsernameId').text('-');
    billingType
      ? $('#customerOrderBillingTypeId').text(billingType)
      : $('#customerOrderBillingTypeId').text('-');
    order.delivery_boy_name
      ? $('#customerOrderDeliveryBoyNameId').text(order.delivery_boy_name)
      : $('#customerOrderDeliveryBoyNameId').text('-');
    order.delivery_boy_phone
      ? $('#customerOrderDeliveryBoyContactId').text(order.delivery_boy_phone)
      : $('#customerOrderDeliveryBoyContactId').text('-');
    order.line_1
      ? $('#customerOrderCustomerAddressId').text(order.line_1)
      : $('#customerOrderCustomerAddressId').text('-');

    let waiterName = '-';

    // Check what waitersList contains
    console.log('window.waitersList:', window.waitersList);
    console.log('Type of waitersList:', typeof window.waitersList);

    if (window.waitersList && Array.isArray(window.waitersList)) {
      console.log('waitersList length:', window.waitersList.length);
      window.waitersList.forEach((waiter, index) => {
        console.log(`Waiter ${index}:`, waiter);
      });
    } else {
    }

    // Check all possible waiter-related fields in order data
    console.log('=== CHECKING ORDER DATA FOR WAITER FIELDS ===');
    const waiterFields = [
      'waiter_id',
      'waiterId',
      'waiterid',
      'waiter_name',
      'waiterName',
      'waiter',
      'waitername',
      'delivery_boy_waiter',
    ];

    waiterFields.forEach((field) => {
      if (order[field] !== undefined) {
        console.log(`Found field "${field}":`, order[field]);
      }
    });

    // Method 1: Try to find waiter by ID if waiter_id exists
    if (
      order.waiter_id &&
      window.waitersList &&
      Array.isArray(window.waitersList)
    ) {
      const foundWaiter = window.waitersList.find(
        (waiter) =>
          waiter.id == order.waiter_id ||
          waiter.username === order.waiter_id.toString() ||
          (waiter.name && waiter.name === order.waiter_id.toString()),
      );
      if (foundWaiter) waiterName = foundWaiter.name;
    }

    // Method 2: Try direct waiter name fields
    if (waiterName === '-') {
      const directNameFields = [
        'waiter_name',
        'waiterName',
        'waiter',
        'waitername',
        'delivery_boy_waiter',
      ];
      for (const field of directNameFields) {
        if (order[field]) {
          waiterName = order[field];
          break;
        }
      }
    }

    // Method 3: Check if waiter info is in nested objects
    if (
      waiterName === '-' &&
      order.extra_details &&
      order.extra_details.waiter_name
    ) {
      waiterName = order.extra_details.waiter_name;
    }

    // Method 4: Last resort - check user_id if it might be the waiter
    if (
      waiterName === '-' &&
      order.user_id &&
      window.waitersList &&
      Array.isArray(window.waitersList)
    ) {
      const foundWaiter = window.waitersList.find(
        (waiter) =>
          waiter.username === order.user_id.toString() ||
          waiter.id == order.user_id,
      );
      if (foundWaiter) waiterName = foundWaiter.name;
    }

    // Method 5: If all else fails and we have waiters, use the first waiter
    if (
      waiterName === '-' &&
      window.waitersList &&
      window.waitersList.length > 0
    ) {
      waiterName = window.waitersList[0].name;
    }

    // Set the waiter name in the HTML
    $('#customerOrderDeliveryBoyWaiterId').text(waiterName);

    addOrderItems(order.order_items);
    $('#customerBillOrderTotalId').html(`Amount: ${order.order_total}`);
  }
}

function addOrders(orders) {
  let html = '';
  orders.forEach((order) => {
    const formatted_id = `****${order.order_id.slice(-4)}`;
    const billingType =
      window.orderTypes[Number(order.billing_type)].order_type;
    html += `<div class="order-card customer-order-card" order-data='${JSON.stringify(order).replace(/'/g, '&apos;')}'>
      <div class="order-id-status">
        <i class="fas fa-box icon-left"></i>
        <span class="order-id">${formatted_id}</span>
        <span class="order-status ${order.order_state.toLowerCase()}">${order.order_state}</span>
      </div>
      <div class="order-meta">
        <div class="meta-row">
          <div class="meta-label-group">
            <i class="fas fa-calendar-alt meta-icon"></i>
          <span class="has-i18n" data-i18n="Customerform.DATE">Date</span>  
     </div>
          <span class="meta-value">${order.created_date}</span>
        </div>
        <div class="meta-row">
          <div class="meta-label-group">
            <i class="fas fa-dollar-sign meta-icon"></i>
           <span class="has-i18n" data-i18n="Customerform.AMOUNT">Amount</span>
          </div>
          <span class="meta-value">${order.order_total}</span>
        </div>
        <div class="meta-row">
          <div class="meta-label-group">
            <i class="fas fa-tag meta-icon"></i>
            <span class="has-i18n" data-i18n="Customerform.ORDER_TYPE">Order type</span>
          </div>
          <span class="meta-value">${billingType}</span>
        </div>
        <div class="meta-row">
          <div class="meta-label-group">
            <i class="fas fa-store meta-icon"></i>
            <span class="has-i18n" data-i18n="Customerform.OUTLET">Outlet</span>
          </div>
          <span class="meta-value">${order?.storeDetails?.name}</span>
        </div>
      </div>
      <div class="order-buttons">
        <button class="view-order-btn customer-view-order has-i18n" data-i18n="Customerform.VIEW">
  <i class="fas fa-eye btn-icon"></i> View
</button>
       <button class="repeat-order-btn customer-repeat-order has-i18n" data-i18n="Customerform.REPEAT_ORDER">
  <i class="fas fa-redo btn-icon"></i> Repeat Order
</button>

      </div>
    </div>`;
  });

  // Inject into container
  $('#ordersContainer').html(html);
  // initializei18nforOrderHistory();
  $('.customer-view-order')
    .off('click')
    .on('click', async function () {
      const data = $(this).closest('.customer-order-card').attr('order-data');

      if (!window.customerOrderDetailsLoaded) {
        $('#customerOrderDetailsBodyid').load('Customers/Billdetails.html');
        $('#customerOrderDetialsModal').modal('show');

        // ✅ SAME AS LAST TIME
        toggleRepeatOrderInViewPopup();

        window.customerOrderDetailsLoaded = true;
        await sleep(700);
        showBillDetails(data);
        initializei18nforBillDetails();
      } else {
        $('#customerOrderDetialsModal').modal('show');

        // ✅ SAME AS LAST TIME
        toggleRepeatOrderInViewPopup();

        showBillDetails(data);
        initializei18nforBillDetails();
      }
    });

  // Handle Repeat Order button
  $('.customer-repeat-order')
    .off('click')
    .on('click', function () {
      const data = $(this).closest('.customer-order-card').attr('order-data');
      const orderData = safeParse(data);
      repeateOrder(orderData, '#customerFormModal');
    });

  $('#repeatCustomerOrderButtonId')
    .off('click')
    .on('click', () => {
      const orderData = $('#customerOrderDetialsModal').attr('order-data');
      const billDetails = safeParse(orderData);
      repeateOrder(billDetails, '#customerOrderDetialsModal');
    });

  $('#cancelBill')
    .off('click')
    .on('click', () => {
      $('#customerOrderDetialsModal').modal('hide');
    });

  initializei18nforBillDetails();
}

// Function to load waiters list if needed
async function loadWaitersList() {
  try {
    console.log('Attempting to load waiters list...');
    // Replace with your actual API endpoint for waiters
    const response = await apiCall.get('/api/waiters', {
      headers: getHeadersformposforrender(),
    });
    if (response.data && response.data.waiters) {
      window.waitersList = response.data.waiters;
      console.log('Successfully loaded waiters list:', window.waitersList);
    } else {
      console.log('No waiters data in response');
      window.waitersList = [];
    }
  } catch (error) {
    console.error('Failed to load waiters list:', error);
    window.waitersList = [];
  }
}

async function fetchOrderHistory(params) {
  try {
    $('#ordersContainer').empty();

    const { cust_mobile } = params;
    if (!cust_mobile) {
      return;
    }

    // Load waiters list before fetching orders
    if (!window.waitersList || window.waitersList.length === 0) {
      console.log('Waiters list not loaded, attempting to load...');
      await loadWaitersList();
    }

    showLoader({
      title: $.i18n.t('controller:orderController.fetchingOrders'),
      text: $.i18n.t('controller:orderController.pleaseWait'),
    });

    const axiosResult = await apiCall.post(
      window.Config.links.customerHistory,
      {
        cust_mobile,
        store_id: [window.storeDetails.store_id],
        phone: cust_mobile,
      },
      {
        headers: getHeadersformposforrender(),
      },
    );

    window.Swal.close();

    if (axiosResult && axiosResult.data) {
      const orderData = axiosResult.data;

      // Render orders (NO UI change here)
      addOrders(orderData.orders);
      toggleRepeatOrderInOrderHistory();

      // ✅ FINAL SAFE UI CONTROL (DO NOT REMOVE ELEMENT)
      if (window.__isCustomerFormOpenedFromCRM === true) {
        $('#ordersContainer .customer-repeat-order').css({
          visibility: 'hidden',
          pointerEvents: 'none',
        });
      } else {
        $('#ordersContainer .customer-repeat-order').css({
          visibility: 'visible',
          pointerEvents: 'auto',
        });
      }
    }
  } catch (error) {
    window.Swal.close();
    console.error('Error fetching order history:', error);
  }
}

function toggleRepeatOrderInOrderHistory() {
  if (window.__isCustomerFormOpenedFromCRM === true) {
    $('#ordersContainer .customer-repeat-order').css({
      visibility: 'hidden',
      pointerEvents: 'none',
    });
  } else {
    $('#ordersContainer .customer-repeat-order').css({
      visibility: 'visible',
      pointerEvents: 'auto',
    });
  }
}
function toggleRepeatOrderInViewPopup() {
  if (window.__isCustomerFormOpenedFromCRM === true) {
    $('#repeatCustomerOrderButtonId').css({
      visibility: 'hidden',
      pointerEvents: 'none',
    });
  } else {
    $('#repeatCustomerOrderButtonId').css({
      visibility: 'visible',
      pointerEvents: 'auto',
    });
  }
}

module.exports = {
  fetchOrderHistory,
  loadWaitersList,
};
