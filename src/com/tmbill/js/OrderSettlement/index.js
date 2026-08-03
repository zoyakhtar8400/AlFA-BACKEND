/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
const {
  makeGetPaymentsAsyncRequest,
} = require('../../renderer/helper/Catalog.helper');
const {
  makegetBillsrequest,
  makeSettleMultipleOrdersRequest,
  makeUpdateMultipleOrdersRequest,
} = require('../../renderer/helper/OrderSettlement.helper');
const { BILLINGTYPES_MAP, BillingTypes } = require('../../util/DBUtil');
const {
  setDateForgettingMidnightReport,
  sleep,
} = require('../../util/MiscUtil');
const {
  COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY,
  FETCH_REPORT_AS_PER_CLOSE_DAY,
  MAKE_DELIVERY_BOY_COMPULSORY,
  SEND_CUSTOMERDETAILSTODBOY_CHECK,
  DISPLAY_WAITER_NAME_ON_TABLE,
  DEFAULT_SENDEBILL_CHECK,
} = require('../../util/SettingIDs');
const { getFromAndToDateForReportsAsPerCloseDay } = require('../RendererUtils');
const TableUtils = require('../../util/TableUtils');
const {
  sendBillsettledevent,
  handleBillsettled,
  sendOrderUpdatedFromOrderSettlementWindowEvent,
  sendTableRefreshevent,
} = require('../ClientrequestHandler');
const {
  showLoader,
  sendEbill,
  sendCustomersinfotodboy,
} = require('../CommonUtils');
const {
  TAKEAWAY_BILLING_FLAG,
  HOMED_BILLING_FLAG,
} = require('../../util/Constants');
const { sendsilentSyncrequest } = require('../OrderController');
const { ORDERSTATEFOR_REDUCEINVENTORY } = require('../../util/OrderStates');
const {
  autoReduceInventoryRequest,
} = require('../../renderer/helper/Inventory.helper');
const { sendPointruleactionifexists } = require('../LoyaltyController');
const {
  sendCouponHistoryRequest,
} = require('../../renderer/helper/Order.helper');
const { safeParse } = require('../../util/RendererUtils');
const {
  initAccesslevelsfororderSettlementWindow,
} = require('../AccesslevelManager');
const {
  initializeOrderSettlementWindowPermissions,
} = require('../PasscodeController');
const { debounce } = require('lodash');

window.orderSettlementWindowloaded = true;
let paymentList = [];
let deliveryBoyMandatory = false;
let isSendCustomerDetailsToDBoyEnabled = false;
let showWaiterNameOnTable = false;
let defaultebillCheck = false;

function addOrderTypesToHeader() {
  let activeBillingtypes = [];
  if (window.storeDetails && window.storeDetails.custom_quickbill_ordertypes) {
    activeBillingtypes = String(
      window.storeDetails.custom_quickbill_ordertypes,
    ).split(',');
  }

  activeBillingtypes = ['1', '2', '3'];

  activeBillingtypes.forEach((billingType) => {
    // const orderType = BILLINGTYPES_MAP[Number(billingType)].toLowerCase();
    const orderType =
      window.orderTypes[Number(billingType)].order_type.toLowerCase();
    let src = `https://cdn.tmbill.com/backoffice/transparent/${orderType}.png`;

    switch (Number(billingType)) {
      case 0:
        src = `https://cdn.tmbill.com/backoffice/transparent/quickbill.png`;
        break;
      case 1:
        src = `https://cdn.tmbill.com/backoffice/transparent/dine-in.png`;
        break;
      case 2:
        src = `https://cdn.tmbill.com/backoffice/transparent/takeaway.png`;
        break;
      case 3:
        src = `https://cdn.tmbill.com/backoffice/transparent/home-delivery.png`;
        break;
      case 4:
        src = `https://cdn.tmbill.com/backoffice/transparent/${orderType}.png`;
        break;
      default:
        src = `https://cdn.tmbill.com/backoffice/transparent/${orderType}.png`;
        break;
    }
    const button = $('<button>', {
      class: 'ordersettlementordertypesbuttonclass',
      html: `<img src=${src} alt=${orderType} val=${orderType} style=" height: 30px;">`,
      value: orderType,
    });

    $('#ordertypesinOrderSettlementWindowContainerId').append(button);
  });
}

function showBills(bills) {
  $('#selectallreceiptBillcheck').prop('checked', false);
  $('#orderSettlewindowTable').DataTable().clear().draw();
  $('#orderSettlewindowTable').DataTable().rows.add(bills); // Add new data
  $('#orderSettlewindowTable').DataTable().columns.adjust().draw(); // Redraw the DataTable
}

async function renderBills(bills) {
  if (!bills) {
    return;
  }
  if (window.Swal.isVisible()) {
    window.Swal.close();
  }
  if (bills && bills.length > 0) {
    showBills(bills);
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:receiptsController.UhOhhNoBillsGenerated'),
    );
  }
}

function renderOrderCountDetails(details) {
  if (details) {
    const {
      totalCancelledOrders,
      totalFulfilledOrders,
      totalPendingOrders,
      totalFoodReadyOrders,
      totalDispatchedOrders,
      placedOrderTotalCount,
    } = details;

    const allOrders =
      totalFulfilledOrders +
      totalCancelledOrders +
      totalPendingOrders +
      totalFoodReadyOrders +
      totalDispatchedOrders +
      placedOrderTotalCount;

    // Use 'tables:' namespace prefix
    $('#orderSettlewindowAllorderCountId').text(
      `${$.i18n.t('tables:reportTableHeadings.ALL')} (${allOrders})`,
    );

    const runningOrders =
      totalPendingOrders +
      totalFoodReadyOrders +
      totalDispatchedOrders +
      placedOrderTotalCount;

    $('#orderSettlewindowRunningOrderCountId').text(
      `${$.i18n.t('tables:reportTableHeadings.RUNNING')} (${runningOrders})`,
    );

    $('#orderSettlewindowFoodReadyOrderCountId').text(
      `${$.i18n.t('tables:reportTableHeadings.READY')} (${totalFoodReadyOrders})`,
    );

    $('#orderSettlewindowDispatchedOrderCountId').text(
      `${$.i18n.t('tables:reportTableHeadings.DISPATCHED')} (${totalDispatchedOrders})`,
    );

    $('#orderSettlewindowCompletedOrderCountId').text(
      `${$.i18n.t('tables:reportTableHeadings.COMPLETED')} (${totalFulfilledOrders})`,
    );

    $('#orderSettlewindowCancelledOrderCountId').text(
      `${$.i18n.t('tables:reportTableHeadings.CANCELLED')} (${totalCancelledOrders})`,
    );
  }
}

async function fetchBills() {
  $('#headerdeliveryboyid').prop('selectedIndex', 0);
  $('#paymentModeNameid').prop('selectedIndex', 0);
  $('#waiterNameid').prop('selectedIndex', 0);
  $('#selectColumnAll').prop('checked', false);

  let type;
  const result = setDateForgettingMidnightReport();
  let fromDate;
  let toDate;
  let countMidnightSale = false;
  let fetchReportAsPerCloseDay = false;
  if (
    window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1] !== undefined
  ) {
    countMidnightSale =
      window.settingsConfig[COUNT_MIDNIGHT_SALE_IN_PREVIOUS_DAY - 1].value ===
      '1';
  }
  if (window.settingsConfig && window.settingsConfig.length > 0) {
    fetchReportAsPerCloseDay =
      window.settingsConfig[FETCH_REPORT_AS_PER_CLOSE_DAY - 1].value === '1';
  }
  if (countMidnightSale && result) {
    type = {
      fromDate: window.moment().subtract(1, 'days').startOf('day').format('x'),
      toDate: window.moment().subtract(1, 'days').endOf('day').format('x'),
    };
    if (!window.__IS_MASTER_POS__) {
      Object.assign(type, {
        user_id: window.storeDetails.username,
      });
      if (window.showAllUserReport) {
        delete type.user_id;
      }
    }
  } else {
    fromDate = window.moment().startOf('day').format('x');
    toDate = window.moment().endOf('day').format('x');
    if (fetchReportAsPerCloseDay) {
      const fromToDateresult = getFromAndToDateForReportsAsPerCloseDay({
        fromDate,
        toDate,
      });
      if (fromToDateresult.fromDate) {
        fromDate = Number(fromToDateresult.fromDate);
      }
      if (fromToDateresult.toDate) {
        toDate = Number(fromToDateresult.toDate);
      }
    }
    type = {
      fromDate,
      toDate,
    };
    if (!window.__IS_MASTER_POS__) {
      Object.assign(type, {
        user_id: window.storeDetails.username,
      });
      if (window.showAllUserReport) {
        delete type.user_id;
      }
    }
  }
  Object.assign(type, {
    store_id: window.storeDetails.store_id,
  });
  const { bills, orderCountStatus, runningOrders } =
    await makegetBillsrequest(type);
  const allBills = [...runningOrders, ...bills];
  renderBills(allBills);
  Object.assign(orderCountStatus, {
    placedOrderTotalCount: runningOrders.length,
  });
  renderOrderCountDetails(orderCountStatus);
  $('#orderSettlewindowRunningOrderCountId').click();
}

window.fetchBillsFromRemote = () => {
  const { length } = $('#orderSettlewindowTable')
    .DataTable()
    .rows('.selectedbillRow')
    .data();

  if (!length) {
    fetchBills();
  }
};

function openRunnigOrder(data) {
  $('#orderIcon').click();
  setTimeout(() => {
    $(`#table_${data.table_id}`).click();
  }, 50);
}

async function updateOrderStatus(data) {
  if (data) {
    let next_state = '';

    switch (data.order_state) {
      case 'pending':
        next_state = 'food ready';
        break;
      case 'food ready':
        next_state = 'dispatched';
        break;
      default:
        return; // Exit if no state change
    }

    const updateData = [
      {
        order_state: next_state,
        order_id: data.order_id,
        table_id: data.table_id,
        billing_type: data.billType,
      },
    ];
    const result = await makeUpdateMultipleOrdersRequest(updateData);
    if (result) {
      window.Swal.close();
      fetchBills();
    }
  }
}

function onrowCreatelistener(row, data, _index) {
  if (data) {
    const statusLabel = $('<label>', {
      html: $.i18n.t(`common:billStatus.${data.order_state}`), // data.order_state,
      class: `statusLabel ${String(data.order_state).toLowerCase()}`,
      id: `td-billstat-${data.bill_number}`,
    });
    $('td', row)
      .eq(11)
      .attr('value', data.order_state)
      .empty()
      .append(statusLabel);
  }

  if (data.created_time) {
    try {
      const formattedDate = window.moment(data.created_time).format('hh:mm A');
      $('td', row).eq(8).html(formattedDate);
    } catch (error) {
      console.error(error);
    }
  }

  if (data.order_total) {
    $('td', row)
      .eq(4)
      .empty()
      .append(Number(data.order_total).toFixed(window.ROUNDOFF_UPTO));
  }

  // const billingType = BillingTypes[data.billing_type];
  const billingType = window.orderTypes[Number(data.billing_type)].order_type;
  if (billingType) {
    const billTypelabel = $('<label>', {
      html: billingType,
      class: `statusLabel ${billingType.replace(/[0-9\s&]/g, '').toLowerCase()}`,
    });
    data.billType = data.billing_type;
    data.billing_type = billingType;

    $('td', row).eq(10).empty().append(billTypelabel);
  }

  if (data.billType !== 3) {
    $('td', row).eq(3).empty().append('');
  }

  if (data.kot_uniqueid) {
    // $('td', row).eq(1).empty().append('-');
    // $('td', row).eq(7).empty().append('-');
    // $('td', row).eq(10).empty().append('-');
    // $('td', row).eq(11).empty().append('-');
    // $('td', row).eq(12).empty().append('-');
    data.order_state = 'Placed';
    const statusLabel = $('<label>', {
      html: 'Placed', // data.order_state,
      class: `statusLabel placed`,
      id: `td-billstat-${data.bill_number}`,
    });
    $('td', row)
      .eq(11)
      .attr('value', data.order_state)
      .empty()
      .append(statusLabel);
  }

  const viewIcon = $('<i>', {
    class: 'fa-solid fa-up-right-from-square gotoOrderPageClass',
    title: 'Go to order page',
  }).click((e) => {
    e.stopPropagation();
    openRunnigOrder(data);
  });

  const updateStatusIcon = $('<i>', {
    class: 'fa fa-check updateOrderStatusIcon',
    title: 'Update Order Status',
  }).click((e) => {
    e.stopPropagation();
    const rowElement = $(this).closest('tr');
    const table = $('#orderSettlewindowTable').DataTable();
    const rowIndex = table.row(rowElement).index();

    const rowData = table.row(rowIndex).data();
    updateOrderStatus(data);
  });
  // .append(updateStatusIcon);
  if (
    window.showGotoOrderWindow &&
    (data.kot_uniqueid || data.order_state !== 'fulfilled')
  ) {
    $('td', row).eq(6).empty().append(viewIcon);
  }
  if (
    window.showUpdateOrderStatusIcon &&
    data.billType === 3 &&
    !data.kot_uniqueid &&
    data.order_state !== 'fulfilled' &&
    data.order_state !== 'dispatched'
  ) {
    $('td', row).eq(6).append(updateStatusIcon);
  }
}

// Function to create dropdown HTML
function createDeliveryBoyDropdown(selectedId = '', isHeader = false) {
  let options = `<option value="" disabled selected>${$.i18n.t('OrderTable.DELIVERY_BOY_FILTER')}</option>`;

  const idName = isHeader ? 'headerdeliveryboyid' : 'rowdeliveryboyId';
  window.deliveryBoys.forEach((boy) => {
    const selected = boy.name === selectedId ? ' selected' : '';
    options += `<option value="${boy.username}"${selected} data-username=${boy.username} data-name="${boy.name}" data-deliveryboyid=${boy.id}  data-phone=${boy.phone} for=${idName}>${boy.name}</option>`;
  });
  const className = isHeader ? 'header-delivery-boy' : 'row-delivery-boy';
  return `<select class="form-control ${className}" id=${idName} >${options}</select>`;
}

const $deliveryBoyFilter = $('#orderSettlementDeliveryBoySearchId');
// eslint-disable-next-line no-undef
window.deliveryBoys.forEach((boy) => {
  $deliveryBoyFilter.append(
    `<option value="${boy.username}">${boy.name}</option>`,
  );
});
function createPaymentDropdown(selectedId = '', isHeader = false) {
  let options = `<option value="" disabled selected>${$.i18n.t('OrderTable.PAYMENT_MODE')}</option>`;
  paymentList.forEach((payment) => {
    const selected =
      payment.payment_mode_name === selectedId ? ' selected' : '';
    options += `<option value="${payment.payment_mode_name}"${selected}>${payment.payment_mode_name}</option>`;
  });
  const className = isHeader ? 'header-payment-mode' : 'row-payment-mode';
  const idName = isHeader ? 'paymentModeNameid' : '';
  return `<select class="form-control ${className}" id=${idName}>${options}</select>`;
}

function createWaiterDropdown(selectedId = '', isHeader = false) {
  let options = `<option value="" disabled selected>${$.i18n.t('OrderTable.WAITER')}</option>`;
  window.waitersList.forEach((waiter) => {
    const selected = waiter.name === selectedId ? ' selected' : '';
    options += `<option value="${waiter.name}"${selected} data-waiterid=${waiter.id}>${waiter.name}</option>`;
  });
  const className = isHeader ? 'header-waiter-name' : 'row-waiter-name';
  const idName = isHeader ? 'waiterNameid' : '';
  return `<select class="form-control ${className}" id=${idName}>${options}</select>`;
}

/**
 * Initializes the datatable
 * @param {Bill list} bills
 */
function initializeDataTable(bills) {
  const table = $('#orderSettlewindowTable').DataTable({
    data: bills,
    scrollY: '61vh',
    scrollX: true,
    bPaginate: false,
    bLengthChange: false,
    bFilter: true,
    bInfo: false,
    bAutoWidth: false,
    ordering: false,
    paging: true,
    autoWidth: false,
    fixedColumns: true,
    pageLength: 30,
    // search: false,
    language: {
      url: `../locales/${$.i18n.language}/datatable.json`,
    },
    columns: [
      {
        title: $.i18n.t('tables:reportTableHeadings.SEQ_NO'),
        data: 'srno',
        defaultContent: '',
      },
      {
        title: 'Select',
        data: null,
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.BillNumber'),
        data: 'bill_number',
      },

      {
        title: 'D. Boy',
        data: 'delivery_boy_name',
        defaultContent: 'NA',
        // defaultContent: '<input type="checkbox" class="row-checkbox">',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Total'),
        data: 'order_total',
        defaultContent: '',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Payment'),
        data: 'payment',
        defaultContent: 'NA',

        // defaultContent: '<input type="checkbox" class="row-checkbox">',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Action'),
        data: '',
        defaultContent: '-',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Waiter'),
        data: 'waiter',
        defaultContent: 'NA',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.OrderTime'),
        data: 'my_order_date',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.TableName'),
        data: 'table_name',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.OrderType'),
        data: 'billing_type',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Status'),
        data: 'order_state',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Customer'),
        data: 'cust_name',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.PhoneNumber'),
        data: 'phone',
      },
      {
        title: $.i18n.t('tables:reportTableHeadings.Area'),
        data: 'line_1',
        defaultContent: '',
        width: '200px',
      },

      {
        title: $.i18n.t('tables:reportTableHeadings.User'),
        data: 'createdBy',
      },
    ],
    columnDefs: [
      // {
      //   targets: [10, 12],
      //   width: '150px',
      // },
      {
        // width: '60px',
        targets: 1,
        className: 'row-checkbox select-checkbox custom-check ',
        // visible: false,
        orderable: false,
        render: () => '',
      },
      {
        render(_data, _type, _full, meta) {
          if (meta.row < bills.length) {
            // eslint-disable-next-line no-param-reassign
            bills[meta.row].srno = meta.row + 1; // adds id to dataset
          }
          return meta.row + 1;
        },
        targets: 0,
        className: 'custom-check',
      },
      {
        targets: 3,
        render(data, type, _full) {
          if (type === 'display') {
            return createDeliveryBoyDropdown(data, '', _full);
          }
          if (type === 'filter') {
            const boy = window.deliveryBoys.find((b) => b.name === data);
            return boy ? boy.name : '';
          }
          return data;
        },
        createdCell(td) {
          $(td).addClass('delivery-boy-cell');
        },
      },

      {
        targets: 5,
        render(data, type, full) {
          if (type === 'display' && full.order_state !== 'fulfilled') {
            return createPaymentDropdown(data);
          }
          return data;
        },
        createdCell(td) {
          $(td).addClass('payment-mode-cell');
        },
      },
      {
        targets: 7,
        render(data, type) {
          if (type === 'display') {
            return createWaiterDropdown(data);
          }
          return data;
        },
        createdCell(td) {
          $(td).addClass('waiter-name-cell');
        },
      },
    ],
    initComplete() {
      const deliveryBoyHeader = $(
        '#orderSettlewindowTable_wrapper thead tr th',
      ).eq(3);
      deliveryBoyHeader.empty().html(createDeliveryBoyDropdown('', true));
      const paymentModeHeader = $(
        '#orderSettlewindowTable_wrapper thead tr th',
      ).eq(5);
      paymentModeHeader.empty().html(createPaymentDropdown('', true));
      const waiterHeader = $('#orderSettlewindowTable_wrapper thead tr th').eq(
        7,
      );
      waiterHeader.empty().html(createWaiterDropdown('', true));

      const selectHeader = $('#orderSettlewindowTable_wrapper thead tr th').eq(
        1,
      );
      selectHeader.empty().html(
        `<input type="checkbox" class=" header-checkbox select-checkbox custom-check" id="selectColumnAll"></input>
        <label for="selectColumnAll"></label>
          `,
      );
      const api = this.api();

      setTimeout(() => {
        const headerCols = $(
          '#orderSettlewindowTable_wrapper .dataTables_scrollHead th',
        );
        const bodyRows = $(
          '#orderSettlewindowTable_wrapper .dataTables_scrollBody table tr',
        );
        headerCols.eq(11).css({
          width: '110px',
          'min-width': '110px',
          'max-width': '110px',
          'text-align': 'center',
        });
        headerCols.eq(10).css({
          width: '150px',
          'min-width': '150px',
          'max-width': '150px',
          'text-align': 'center',
        });
        /* TABLE NAME HEADER FIX (TH only) */
        headerCols.eq(9).css({
          width: '150px',
          'min-width': '150px',
          'max-width': '150px',
          'text-align': 'center',
        });
        bodyRows?.each(function () {
          $(this).find('td').eq(10).css({
            width: '120px',
            'min-width': '120px',
            'max-width': '120px',
            'text-align': 'center',
            'white-space': 'nowrap',
          });
        });

        bodyRows?.each(function () {
          $(this).find('td').eq(11).css({
            width: '120px',
            'min-width': '120px',
            'max-width': '120px',
            'text-align': 'center',
            overflow: 'hidden',
          });
        });

        bodyRows?.each(function () {
          $(this).find('td').eq(14).css({
            'text-align': 'center',
          });
        });

        headerCols?.eq(12).css({
          width: '120px',
          'min-width': '120px',
          'max-width': '120px',
          'text-align': 'center',
        });

        bodyRows?.each(function () {
          $(this).find('td').eq(12).css({
            width: '175px',
            'min-width': '175px',
            'max-width': '175px',
          });
        });

        headerCols?.eq(14).css({
          width: '140px',
          'min-width': '140px',
          'max-width': '140px',
          'text-align': 'center',
        });
        headerCols?.eq(15).css({
          width: '80px',
          'min-width': '80px',
          'max-width': '80px',
        });
        headerCols?.eq(9).css({
          'text-align': 'center',
        });

        bodyRows.each(function () {
          $(this).find('td').eq(9).css({
            'text-align': 'center',
          });
        });

        bodyRows?.each(function () {
          $(this).find('td').eq(14).css({
            width: '220px',
            'min-width': '220px',
            'max-width': '220px',
            overflow: 'hidden',
          });
        });
        headerCols?.eq(4).css({
          width: '120px',
        });

        bodyRows?.each(function () {
          $(this).find('td').eq(4).css({
            width: '140px',
          });
        });

        bodyRows?.each(function () {
          $(this).find('td').eq(14).css({
            width: '180px',
            'min-width': '180px',
            'max-width': '180px',
            overflow: 'hidden',
          });
        });
        /* ORDER TYPE column width fix */
        headerCols?.eq(10).css({
          width: '130px',
          'min-width': '130px',
          'max-width': '130px',
          'text-align': 'center',
        });

        bodyRows?.each(function () {
          $(this).find('td').eq(10).css({
            width: '130px',
            'min-width': '130px',
            'max-width': '130px',
            'text-align': 'center',
            'white-space': 'nowrap',
          });
          /* ORDER TYPE HEADER FIX (TH only) */
          // headerCols.eq(10).css({
          //   width: '190px',
          //   'min-width': '190px',
          //   'max-width': '190px',
          //   'text-align': 'center',
          // });
          // const headerCols = $(
          //   '#orderSettlewindowTable_wrapper .dataTables_scrollHead th',
          // );

          /* ORDER TYPE header only */
          // headerCols.eq(10).css({
          //   'min-width': '140px',
          //   width: '140px',
          //   'max-width': '140px',
          //   'text-align': 'center',
          // });
        });
        api.columns.adjust();
      }, 300);
    },
    select: {
      style: 'multi',
    },
    order: [[1, 'asc']],
    createdRow: onrowCreatelistener,
    footerCallback(_row, data, _start, _end, _display) {},
  });

  table.on('draw', () => {
    setTimeout(() => {
      $('#headerdeliveryboyid')
        .off('change')
        .on('change', function () {
          const selectedBoyId = $(this).val();
          const selectedOption = $(this).find(':selected');
          const selectedBoyName = $(this).find('option:selected').text();

          $('#orderSettlewindowTable  tbody .selectedbillRow').each(
            function () {
              const row = table.row($(this).closest('tr'));
              const rowData = row.data();

              const deliveryboyId = selectedOption.data('deliveryboyid');
              const deliveryBoyName = selectedOption.data('name');
              const deliveryBoyPhone = selectedOption.data('phone');

              rowData.delivery_boy_name = deliveryBoyName;
              rowData.deliveryboy_id = deliveryboyId;
              rowData.delivery_boy_phone = deliveryBoyPhone;
              rowData.delivery_boy_name = selectedBoyName;
              rowData.deliveryBoyChanged = true;
              $(this)
                .closest('tr')
                .find('.row-delivery-boy')
                .val(selectedBoyId);
            },
          );
        });

      $('.row-delivery-boy')
        .off('change')
        .on('change', function () {
          const selectedBoyId = $(this).val();
          const selectedOption = $(this).find(':selected');
          const deliveryboyId = selectedOption.data('deliveryboyid');
          const deliveryBoyName = selectedOption.data('name');
          const deliveryBoyPhone = selectedOption.data('phone');

          const row = table.row($(this).closest('tr'));
          const rowData = row.data();
          rowData.delivery_boy_name = deliveryBoyName;
          rowData.deliveryboy_id = deliveryboyId;
          rowData.delivery_boy_phone = deliveryBoyPhone;
          rowData.deliveryBoyChanged = true;
          $(this).closest('tr').find('.row-delivery-boy').val(selectedBoyId);
        });

      $('.row-payment-mode')
        .off('change')
        .on('change', function () {
          const selectedPayment = $(this).val();
          const row = table.row($(this).closest('tr'));
          const rowData = row.data();
          rowData.payment = selectedPayment;
          rowData.paymentModeChanged = true;
          $(this).closest('tr').find('.row-payment-mode').val(selectedPayment);
        });

      $('#paymentModeNameid')
        .off('change')
        .on('change', function () {
          //   const selectedBoyId = $(this).val();
          const paymentModeName = $(this).find('option:selected').text();

          // Apply to all checked rows
          $('#orderSettlewindowTable  tbody .selectedbillRow').each(
            function () {
              const row = table.row($(this).closest('tr'));
              const rowData = row.data();
              rowData.payment = paymentModeName;
              rowData.paymentModeChanged = true;
              $(this)
                .closest('tr')
                .find('.row-payment-mode')
                .val(paymentModeName);
            },
          );

          // table.rows({ selected: true }).every(function () {
          //   const rowData = this.data();

          //   rowData.payment = paymentModeName;
          //   rowData.paymentModeChanged = true;

          //   // update row data
          //   this.data(rowData);
          // });

          // // redraw table (keeps pagination)
          // table.draw(false);
        });

      $('#waiterNameid')
        .off('change')
        .on('change', function () {
          //   const selectedBoyId = $(this).val();
          const waiterName = $(this).find('option:selected').text();
          const selectedOption = $(this).find(':selected');
          const waiter_id = selectedOption.data('waiterid');

          // Apply to all checked rows
          $('#orderSettlewindowTable  tbody .selectedbillRow').each(
            function () {
              const row = table.row($(this).closest('tr'));
              const rowData = row.data();
              rowData.waiter = waiterName;
              rowData.waiter_id = waiter_id;
              rowData.waiterChanged = true;
              $(this).closest('tr').find('.row-waiter-name').val(waiterName);
            },
          );

          // table.rows({ selected: true }).every(function () {
          //   const rowData = this.data();

          //   rowData.waiter = waiterName;
          //   rowData.waiter_id = waiter_id;
          //   rowData.waiterChanged = true;

          //   // update DataTables internal data
          //   this.data(rowData);
          // });

          // // redraw without losing pagination
          // table.draw(false);
        });

      $('.row-waiter-name')
        .off('change')
        .on('change', function () {
          const selectedWaiter = $(this).val();
          const row = table.row($(this).closest('tr'));
          const selectedOption = $(this).find(':selected');
          const waiter_id = selectedOption.data('waiterid');

          const rowData = row.data();
          rowData.waiter = selectedWaiter;
          rowData.waiter_id = waiter_id;
          rowData.waiterChanged = true;
          $(this).closest('tr').find('.row-waiter-name').val(selectedWaiter);
        });

      $('#orderSettlewindowTable tbody').on('click', 'tr', (e) => {
        if (!$(e.target).hasClass('row-checkbox')) {
          e.stopPropagation();
        }
      });

      $('#orderSettlewindowTable tbody').on(
        'click',
        '.row-checkbox',
        function () {
          const row = $(this).closest('tr');
          if ($(row[0]).hasClass('selected')) {
            table.row(row).select();
          } else {
            table.row(row).deselect();
          }
          if (!$(row[0]).hasClass('selected')) {
            $(this).closest('tr').addClass('selectedbillRow');
          } else {
            $(this).closest('tr').removeClass('selectedbillRow');
          }
        },
      );

      $('#selectColumnAll')
        .off('click')
        .on('click', function (e) {
          e.stopPropagation();
          const isChecked = $(this).is(':checked');
          $('#orderSettlewindowTable tbody .header-checkbox').prop(
            'checked',
            isChecked,
          );
          table.rows().every(function () {
            this.select(isChecked);
          });
          $('#selectColumnAll').prop('checked', isChecked);
          if (isChecked) {
            $('tbody .row-checkbox').closest('tr').addClass('selectedbillRow');
          } else {
            $('tbody .row-checkbox')
              .closest('tr')
              .removeClass('selectedbillRow');
          }
          onSelectrowchange();
        });
    }, 500);
  });

  table.on('page.dt', () => {
    const isChecked = $('#selectColumnAll').is(':checked');
    setTimeout(() => {
      if (isChecked) {
        $('tbody .row-checkbox').closest('tr').addClass('selectedbillRow');
      } else {
      }
      onSelectrowchange();
    }, 100);
    // table.rows().every(function () {
    //   this.select(false);
    // });
    // $('#selectColumnAll').prop('checked', false);
    // $('tbody .row-checkbox').closest('tr').removeClass('selectedbillRow');
  });
}

function getSelectedBills() {
  const billDetails = $('#orderSettlewindowTable')
    .DataTable()
    .rows('.selectedbillRow')
    .data();

  const { length } = $('#orderSettlewindowTable')
    .DataTable()
    .rows('.selectedbillRow')
    .data();
  const selectedRow = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < length; i++) {
    selectedRow.push(billDetails[i]);
  }
  return selectedRow;
}

// auto reduce inventory
async function initAutoReduceInventory() {
  await autoReduceInventoryRequest();
}

// send coupon history
async function initSendCouponHistory() {
  await sendCouponHistoryRequest();
}

/**
 * Called after the bill is settled.
 */
async function postSettleprocessing({
  order_id,
  orderState,
  delivery_boy_phone,
  cust_name,
  billing_type,
  order_total,
}) {
  // If silent sync is turned on the the order will
  // be synced.
  sendsilentSyncrequest();
  if (
    window.reduceInventorystatus &&
    !ORDERSTATEFOR_REDUCEINVENTORY.includes(orderState)
  ) {
    initAutoReduceInventory();
  }
  if (window.storeDetails.loyalty_enabled) {
    setTimeout(() => {
      sendPointruleactionifexists({
        order_id,
        store_id: window.storeDetails.store_id,
        tmpos_id: window.storeDetails.tmpos_id,
      });
    }, 3000);
  }

  if (
    isSendCustomerDetailsToDBoyEnabled &&
    billing_type === 3 &&
    delivery_boy_phone &&
    cust_name
  ) {
    sendCustomersinfotodboy({
      customer: cust_name,
      delivery_boy_phone,
      bill_amount: order_total,
      order_id,
    });
  }

  initSendCouponHistory();
  if (window.accessOfCustomerDisplay) {
    window.sendStatetolocalcustomerdisplay({});
  }
}

async function settleBillPostProcess(params) {
  let order_type;
  if (defaultebillCheck) {
    switch (params.billType) {
      case 1:
        order_type = 'dine-in';
        break;
      case 2:
        order_type = 'takeaway';
        break;
      case 3:
        order_type = 'delivery';
        break;
      default:
        break;
    }
  }
  const { order_total, name, phone, order_id } = params;
  sendEbill({
    phone,
    name,
    amount: order_total,
    order_id,
    delivery_type: order_type,
    for_payment_link: 0,
  });
}

async function settleOrder() {
  try {
    const selectedBills = getSelectedBills();
    if (!selectedBills || !selectedBills.length) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:receiptsController.Pleaseselectbill'),
      );
      return;
    }
    if (selectedBills && selectedBills.length === 1) {
      const bill = selectedBills[0];
      if (!bill.payment && !bill.paymentModeChanged) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:receiptsController.Pleaseselectpaymentmode'),
        );
        return;
      }

      if (!bill.bill_number) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:receiptsController.Pleasesavebillfirst'),
        );
        return;
      }
    }
    const updateData = [];
    selectedBills.forEach((bill) => {
      if (
        bill.order_state !== 'fulfilled' &&
        !bill.kot_uniqueid &&
        bill.isBillModified === 1 &&
        (bill.payment || bill.paymentModeChanged)
      ) {
        const billData = {
          order_id: bill.order_id,
          table_id: bill.table_id,
          billing_type: bill.billType,
          order_state: 'fulfilled',
          table_color: TableUtils.Colors.FREE_TABLE,
          table_action_flag: TableUtils.State.FREE_TABLE,
          extra_details: safeParse(bill.extra_details),
          is_pre_order: bill.is_pre_order,
          app_source: 'atlantic_pos',
          order_total: bill.order_total,
          waiterChanged: bill.waiterChanged,
          table_name: bill.table_name,
          name: bill.cust_name,
          mobile: bill.phone,
          orderTotal: bill.order_total,
          billingType: bill.billType,
          dboyPhone: bill.delivery_boy_phone,
          sync_status: 0,
        };
        if (bill.billType === 3 && bill.deliveryBoyChanged) {
          Object.assign(billData, {
            delivery_boy_name: bill.delivery_boy_name,
            deliveryboy_id: bill.deliveryboy_id,
            delivery_boy_phone: bill.delivery_boy_phone,
          });
        }

        let deliveryBoyadded = false;
        if (bill.billType === 3 && bill.delivery_boy_name) {
          deliveryBoyadded = true;
        }

        if (
          deliveryBoyMandatory &&
          bill.billType === 3 &&
          !deliveryBoyadded &&
          !billData.delivery_boy_name
        ) {
          setTimeout(() => {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t('controller:receiptsController.Pleaseselectdeliveryboy'),
            );
          }, 200);
          return;
        }

        if (
          isSendCustomerDetailsToDBoyEnabled &&
          bill.billType === 3 &&
          !deliveryBoyadded &&
          !billData.delivery_boy_name
        ) {
          setTimeout(() => {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t('controller:receiptsController.Pleaseselectdeliveryboy'),
            );
          }, 200);
          return;
        }

        if (bill.order_state === 'cancelled') {
          setTimeout(() => {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t(
                'controller:receiptsController.Cannotsettlecancelledorders',
              ),
            );
          }, 200);
          return;
        }
        if (bill.paymentModeChanged) {
          Object.assign(billData, {
            payment: bill.payment,
          });
        }

        if (bill.waiterChanged) {
          Object.assign(billData, {
            waiter: bill.waiter,
            waiter_id: bill.waiter_id,
          });
        }

        updateData.push(billData);
      }
    });
    showLoader({
      title: $.i18n.t('controller:orderController.settlingBill'),
      text: $.i18n.t('controller:orderController.pleaseWait'),
    });

    const result = await makeSettleMultipleOrdersRequest(updateData);
    window.Swal.close();
    if (result && result.length) {
      result.forEach((response) => {
        sendBillsettledevent(response);
        handleBillsettled(response);
        postSettleprocessing({
          order_id: response.order_id,
          orderState: 'fulfilled',
          delivery_boy_phone: response.delivery_boy_phone,
          cust_name: response.cust_name,
          billing_type: response.billType,
          order_total: response.order_total,
        });

        // if table is of pickup/ delivery then set new order
        if (response.billing_type === TAKEAWAY_BILLING_FLAG) {
          $('#takeawayneworderButtonid').click();
        } else if (response.billing_type === HOMED_BILLING_FLAG) {
          $('#deliveryneworderButtonid').click();
        }
        settleBillPostProcess(response);
      });
      $('#totalBillSelectedid').hide();
      $('#totalBillSelectedAmountid').hide();
      sendOrderUpdatedFromOrderSettlementWindowEvent(updateData);

      window.remotegetTables({
        store_id: window.storeDetails.store_id,
      });
      // Broadcast the refresh event
      // sendTableRefreshevent();
    }
    // window.
    fetchBills();
    window.refreshReceipt = true;
  } catch (error) {
    console.error(error);
  }
}

function onSelectrowchange() {
  let orderTotal = 0;
  const bills = getSelectedBills();
  bills.forEach((bill) => {
    orderTotal += bill.order_total || 0;
  });
  if (bills.length > 0) {
    $('#totalBillSelectedid').show();
    $('#totalBillSelectedAmountid').show();
    $('#totalBillSelectedid').html(`${bills.length} selected `);
    $('#totalBillSelectedAmountid').html(
      `${window.storeDetails.currency} ${orderTotal.toFixed(window.ROUNDOFF_UPTO)}`,
    );
  } else {
    $('#totalBillSelectedid').hide();
    $('#totalBillSelectedAmountid').hide();
  }
}

async function updateOrder() {
  try {
    const selectedBills = getSelectedBills();
    const updateData = [];
    selectedBills.forEach((bill) => {
      if (!bill.kot_uniqueid) {
        const billData = {
          order_id: bill.order_id,
          table_id: bill.table_id,
          billing_type: bill.billType,
          table_color: TableUtils.Colors.FREE_TABLE,
          table_action_flag: TableUtils.State.FREE_TABLE,
          extra_details: safeParse(bill.extra_details),
          is_pre_order: bill.is_pre_order,
          order_total: bill.order_total,
          deliveryBoyChanged: bill.deliveryBoyChanged,
          waiterChanged: bill.waiterChanged,
        };
        if (bill.billType === 3 && bill.deliveryBoyChanged) {
          Object.assign(billData, {
            delivery_boy_name: bill.delivery_boy_name,
            deliveryboy_id: bill.deliveryboy_id,
            delivery_boy_phone: bill.delivery_boy_phone,
          });
        }
        if (bill.paymentModeChanged && bill.order_state !== 'fulfilled') {
          Object.assign(billData, {
            payment: bill.payment,
          });
        }

        if (bill.waiterChanged) {
          Object.assign(billData, {
            waiter: bill.waiter,
            waiter_id: bill.waiter_id,
          });
        }

        updateData.push(billData);
      }
    });
    showLoader({
      title: 'Updating Orders',
      text: $.i18n.t('controller:orderController.pleaseWait'),
    });

    const result = await makeUpdateMultipleOrdersRequest(updateData);
    window.Swal.close();
    if (result && result.length) {
      result.forEach((response) => {
        if (response.deliveryBoyChanged) {
          $(`#table_${response.table_id}`)
            .find('#tabledeliveryboyLabelid')
            .html(response.delivery_boy_name);
        }
        if (response.waiterChanged && showWaiterNameOnTable) {
          $(`#table_${response.table_id}`)
            .find('#tablewaiterLabelid')
            .html(response.waiter);
        }
        if (response.billing_type === HOMED_BILLING_FLAG) {
          $('#deliveryneworderButtonid').click();
        }
      });
      $('#totalBillSelectedid').hide();
      $('#totalBillSelectedAmountid').hide();
      sendOrderUpdatedFromOrderSettlementWindowEvent(updateData);
    }
    // window.
    fetchBills();
    window.refreshReceipt = true;
  } catch (error) {
    console.error(error);
  }
}
function refreshOrderSettlementwindow() {
  if (window.refreshOrderSettlementWindow) {
    fetchBills();
  }
  window.refreshOrderSettlementWindow = false;
}

function addActiveClassToOrderCountButton(thisObj) {
  if ($(thisObj).parent().is('#orderSettleWindowOrderStatusContainer')) {
    $('#orderSettleWindowOrderStatusContainer span').removeClass(
      'activeOrderCountStatusButton',
    );
  } else if (
    $(thisObj).parent().is('#ordertypesinOrderSettlementWindowContainerId')
  ) {
    $('#ordertypesinOrderSettlementWindowContainerId button').removeClass(
      'activeOrderCountStatusButton',
    );
  }
  $(thisObj).addClass('activeOrderCountStatusButton');
}

async function renderReport(previewDetails) {
  if (window.reportsscriptLoaded) {
    $('#reportprintBodyid').data('data', previewDetails);
    await redrawReportview();
  } else {
    $('#reportprintBodyid').data('data', previewDetails);
    $('#reportprintBodyid').load('Report.html', () => {
      redrawReportview();
    });
  }
}
async function printDeliveryBoyReport() {
  const selectedBills = getSelectedBills();

  if (selectedBills && selectedBills.length) {
    // first filter delivery bills from all bills
    const deliveryBills = selectedBills.filter(
      (b) => b.billType === HOMED_BILLING_FLAG,
    );

    if (deliveryBills && deliveryBills.length) {
      // then filter delivery boy wise bills from delivery bills
      const grouped = deliveryBills.reduce((acc, item) => {
        const phone = item.deliveryboy_id;

        // If this phone number doesn't exist yet, create an empty array
        if (phone) {
          if (!acc[phone]) {
            acc[phone] = [];
          }

          // Push the current item into the correct array
          acc[phone].push(item);
        }
        return acc;
      }, {});

      const deliveryBoyData = Object.values(grouped);

      if (deliveryBoyData && deliveryBoyData.length) {
        for (let i = 0; i < deliveryBoyData.length; i++) {
          const dbData = deliveryBoyData[i];

          const data = {};
          const previewDetails = {
            report_type: 'Delivery Boy Report',
            data,
          };
          data.orderSettlementDeliveryBoySummary = dbData;
          await sleep(500);
          renderReport(previewDetails);
        }
      }
    }
  }
}

async function initialize() {
  const paymentsresponse = await makeGetPaymentsAsyncRequest({
    store_id: window.storeDetails.store_id,
  });
  addOrderTypesToHeader();
  initializeDataTable([]);
  if (paymentsresponse && paymentsresponse.payments) {
    paymentList = paymentsresponse.payments;
  }
  fetchBills();
  if (window.settingsConfig[MAKE_DELIVERY_BOY_COMPULSORY - 1] !== undefined) {
    deliveryBoyMandatory =
      window.settingsConfig[MAKE_DELIVERY_BOY_COMPULSORY - 1].value === '1';
  }

  if (
    window.settingsConfig[SEND_CUSTOMERDETAILSTODBOY_CHECK - 1] !== undefined
  ) {
    isSendCustomerDetailsToDBoyEnabled =
      window.settingsConfig[SEND_CUSTOMERDETAILSTODBOY_CHECK - 1].value === '1';
  }

  if (window.settingsConfig[DISPLAY_WAITER_NAME_ON_TABLE - 1] !== undefined) {
    showWaiterNameOnTable =
      window.settingsConfig[DISPLAY_WAITER_NAME_ON_TABLE - 1].value === '1';
  }

  if (window.settingsConfig[DEFAULT_SENDEBILL_CHECK - 1] !== undefined) {
    defaultebillCheck =
      window.settingsConfig[DEFAULT_SENDEBILL_CHECK - 1].value === '1';
  }

  $('#searchOrderSettlementField').keyup(function () {
    $('#orderSettlewindowTable').DataTable().search($(this).val()).draw();
  });

  // $('#orderSettlementDeliveryBoySearchId').on('change', function () {
  //   $('#orderSettlewindowTable')
  //     .DataTable()
  //     .column(3)
  //     .search($(this).val())
  //     .draw();
  // });
  $('#orderSettlementDeliveryBoySearchId').keyup(function () {
    $('#orderSettlewindowTable')
      .DataTable()
      .column(3)
      .search($(this).val())
      .draw();
  });

  $('#orderSettleAreaFilterId').keyup(function () {
    $('#orderSettlewindowTable')
      .DataTable()
      .column(14)
      .search($(this).val())
      .draw();
  });

  $('#orderSettlewindowSettleButtonId').on(
    'click',
    debounce(() => {
      settleOrder();
    }, 300),
  );
  $('#orderSettlewindowUpdateButtonId').on('click', () => {
    updateOrder();
  });

  $('#refreshOrderSettlementWindowButtonId').on('click', () => {
    fetchBills();
  });

  $('#orderSettlewindowTable').on('click', 'tr td.row-checkbox', (e) => {
    // e.stopPropagation();
    onSelectrowchange();
  });

  $('#deliveryBoyReeportprintButton').on('click', () => {
    printDeliveryBoyReport();
  });

  $('.ordersettlementordertypesbuttonclass').on('click', function () {
    addActiveClassToOrderCountButton(this);
    const orderType = $(this).val();
    const table = $('#orderSettlewindowTable').DataTable();
    const activeStatusBtn = $(
      '#orderSettleWindowOrderStatusContainer .activeOrderCountStatusButton',
    );
    let statusSearch = '';
    if (activeStatusBtn.length > 0) {
      const statusId = activeStatusBtn.attr('id');
      if (statusId === 'orderSettlewindowRunningOrderCountId') {
        statusSearch = 'Placed|pending|food ready|dispatched';
      } else if (statusId === 'orderSettlewindowFoodReadyOrderCountId') {
        statusSearch = 'food ready';
      } else if (statusId === 'orderSettlewindowDispatchedOrderCountId') {
        statusSearch = 'dispatched';
      } else if (statusId === 'orderSettlewindowCompletedOrderCountId') {
        statusSearch = 'fulfilled';
      } else if (statusId === 'orderSettlewindowCancelledOrderCountId') {
        statusSearch = 'Cancelled';
      }
    }

    table.columns().search('');
    if (statusSearch) {
      table.column(11).search(statusSearch, true, false);
    }
    table.column(10).search(orderType, true, false).draw();
  });

  $('#orderSettlewindowCancelledOrderCountId').on('click', function () {
    addActiveClassToOrderCountButton(this);
    const orderTypeBtn = $(
      '#ordertypesinOrderSettlementWindowContainerId .activeOrderCountStatusButton',
    );
    const orderType = orderTypeBtn.val();
    const table = $('#orderSettlewindowTable').DataTable();
    table.columns().search('');
    table.column(11).search('Cancelled', true, false);
    if (orderType) {
      table.column(10).search(orderType, true, false);
    }
    table.draw();
  });
  $('#orderSettlewindowCompletedOrderCountId').on('click', function () {
    addActiveClassToOrderCountButton(this);
    const orderTypeBtn = $(
      '#ordertypesinOrderSettlementWindowContainerId .activeOrderCountStatusButton',
    );
    const orderType = orderTypeBtn.val();
    const table = $('#orderSettlewindowTable').DataTable();
    table.columns().search('');
    table.column(11).search('fulfilled', true, false);
    if (orderType) {
      table.column(10).search(orderType, true, false);
    }
    table.draw();
  });
  $('#orderSettlewindowRunningOrderCountId').on('click', function () {
    addActiveClassToOrderCountButton(this);
    const searchValue = 'Placed|pending|food ready|dispatched';
    const orderTypeBtn = $(
      '#ordertypesinOrderSettlementWindowContainerId .activeOrderCountStatusButton',
    );
    const orderType = orderTypeBtn.val();
    const table = $('#orderSettlewindowTable').DataTable();
    table.columns().search('');
    table.column(11).search(searchValue, true, false);
    if (orderType) {
      table.column(10).search(orderType, true, false);
    }
    table.draw();
  });
  $('#orderSettlewindowAllorderCountId').on('click', function () {
    addActiveClassToOrderCountButton(this);
    $('#ordertypesinOrderSettlementWindowContainerId button').removeClass(
      'activeOrderCountStatusButton',
    );
    const table = $('#orderSettlewindowTable').DataTable();
    table.columns().search('');
    table.search('').draw();
    const { length } = table.rows('').data();
    $('#orderSettlewindowAllorderCountId').text(`All (${length})`);
  });
  $('#orderSettlewindowFoodReadyOrderCountId').on('click', function () {
    addActiveClassToOrderCountButton(this);
    const searchValue = 'food ready';
    const orderTypeBtn = $(
      '#ordertypesinOrderSettlementWindowContainerId .activeOrderCountStatusButton',
    );
    const orderType = orderTypeBtn.val();
    const table = $('#orderSettlewindowTable').DataTable();
    table.columns().search('');
    table.column(11).search(searchValue, true, false);
    if (orderType) {
      table.column(10).search(orderType, true, false);
    }
    table.draw();
  });
  $('#orderSettlewindowDispatchedOrderCountId').on('click', function () {
    addActiveClassToOrderCountButton(this);
    const searchValue = 'dispatched';
    const orderTypeBtn = $(
      '#ordertypesinOrderSettlementWindowContainerId .activeOrderCountStatusButton',
    );
    const orderType = orderTypeBtn.val();
    const table = $('#orderSettlewindowTable').DataTable();
    table.columns().search('');
    table.column(11).search(searchValue, true, false);
    if (orderType) {
      table.column(10).search(orderType, true, false);
    }
    table.draw();
  });
  setTimeout(() => {
    initAccesslevelsfororderSettlementWindow({});
  }, 500);
  initializeOrderSettlementWindowPermissions();
}

window.refreshOrderSettlementwindowfromremote = refreshOrderSettlementwindow;
initialize();
