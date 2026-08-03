const { apiCall } = require('../services/APIService');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const {
  PULLORDER_ONACCEPT,
  PRINTKOT_ONORDER_ACCEPT,
  PRINTBILL_ONORDER_ACCEPT,
} = require('../util/SettingIDs');
const { showLoader } = require('./CommonUtils');

let order_data;

let orderItemsCount = 0;

function addOrderItemRow(item) {
  if (item != undefined) {
    let table = $('#ondcorderItemTable');

    let oldkotitemrow = $('<tr>', {
      id: `partialorderitemrow_${item.id}`,
      item: JSON.stringify(item),
    });

    let rowCell1 = $('<td>', { html: item.title });
    let rowCell2 = $('<td>', {
      html: item.quantity,
      class: 'modifyeditablekotQty',
    });
    let rowCell3 = $('<td>', { html: item.price });
    let rowCell5 = $('<div>', {
      id: `item_${item.item_id}`,
      class: 'handle-counter',
    });
    let button1 = $('<button>', {
      text: '-',
      class: 'counter-minus counter-btn btn-primary',
    });
    let input = $('<input>', {
      type: 'email',
      value: 0,
      contenteditable: false,
    });
    let button2 = $('<button>', {
      text: '+',
      class: 'counter-plus counter-btn btn-primary',
    });

    rowCell5.append(button1);
    rowCell5.append(input);
    rowCell5.append(button2);
    setTimeout(() => {
      let options = {
        minimum: 0,
        maximize: item.quantity,
        onChange: valChanged,
        // onMinimum: function (e) {
        // },
        // onMaximize: function (e) {
        // },
      };
      $(`#item_${item.item_id}`).handleCounter(options);
      function valChanged(d) {
        $(this).val(d);
      }
    }, 200);

    oldkotitemrow.append(rowCell1);
    oldkotitemrow.append(rowCell2);
    oldkotitemrow.append(rowCell3);
    oldkotitemrow.append(rowCell5);
    table.append(oldkotitemrow);
  }
  $('#ondcorderItemTable').trigger('rowAddOrRemove');
}
function Initialize() {
  let details = $('#partialAcceptorderModalid')[0];
  if (details) {
    orderItemsCount = 0;
    order_data = JSON.parse(details.getAttribute('data'));
    if (order_data.tmpos_order_child) {
      order_data.tmpos_order_child.forEach((item) => {
        addOrderItemRow(item);
        orderItemsCount += Number(item.quantity);
      });
    }
  }
}

function initializeEvenets() {
  $('#partialAcceptorderbutton').click(() => {
    makePartialAcceiptOrderRequest();
  });
}

function getQtyChangedItems() {
  let selectedItems = [];
  $('#ondcorderItemTable tr').each(function () {
    var $row = $(this);

    $row.find("input[type='email']").each(function () {
      var inputValue = parseFloat($(this).val());
      if (Number(inputValue) > 0) {
        let item = JSON.parse($row[0].getAttribute('item'));
        Object.assign(item, { updatedQuantity: inputValue });
        selectedItems.push(item);
      }
    });
  });

  return selectedItems;
}
async function makePartialAcceiptOrderRequest() {
  let selectedItems = getQtyChangedItems();
  let cancelledItems = [];
  let selectedItemQty = 0;
  let isCustomizedItem = false;
  if (selectedItems && selectedItems.length) {
    selectedItems.forEach((item) => {
      let obj = {
        title: item.title,
        id: `${item.item_id}::${item.short_code}`,
        qty: item.updatedQuantity,
      };
      if (item.extra_details && item.extra_details.parent_item_id) {
        Object.assign(obj, {
          parent_item_id: item.extra_details.parent_item_id,
        });
        isCustomizedItem = true;
      }
      cancelledItems.push(obj);
      selectedItemQty += item.updatedQuantity;
    });
  }

  if (selectedItemQty == orderItemsCount) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:partialAcceptnotifications.Ifyouwanttocancelallitemsthenpleasecancelorder',
      ),
    );
    return;
  }
  if (!cancelledItems || !cancelledItems.length) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:partialAcceptnotifications.Pleaseselectitems'),
    );
    return;
  }
  let payload = {
    store_id: window.storeDetails.store_id,
    order_id: order_data.order_id,
    cancelled_items: cancelledItems,
  };

  if (isCustomizedItem) {
    Object.assign(payload, {
      HasCustomizeItems: true,
    });
  }

  showLoader({
    title: 'Partial order accept',
    text: 'Partial order accept in process please wait',
  });

  let response = await apiCall.post(Config.links.partialOrderAccept, payload, {
    header: getHeadersformposforrender,
  });
  if (response && response.status == 200) {
    $('#partialAcceptorderModal').modal('hide');
    let attr = '[order-id=' + order_data.order_id + ']';
    let selectedBill = $('#digitalorderslistID').find(attr);
    if (selectedBill.length > 0) {
      $(selectedBill[0]).remove();
    }

    //order is update so first fetch latest order and then pull it
    if (
      (window.settingsConfig[PULLORDER_ONACCEPT - 1] != undefined &&
        window.settingsConfig[PULLORDER_ONACCEPT - 1].value == '1') ||
      (window.settingsConfig[PRINTKOT_ONORDER_ACCEPT - 1] != undefined &&
        window.settingsConfig[PRINTKOT_ONORDER_ACCEPT - 1].value == '1') ||
      (window.settingsConfig[PRINTBILL_ONORDER_ACCEPT - 1] != undefined &&
        window.settingsConfig[PRINTBILL_ONORDER_ACCEPT - 1].value == '1')
    ) {
      setTimeout(async () => {
        const { data: response } = await apiCall.post(
          Config.links.digitalOrders,
          {
            order_id: order_data.order_id,
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
          let orderData = response.data[0];
          if (orderData) {
            console.log(
              `Message="Digital Order Partially Accepted. Pulling.."`,
            );
            setTimeout(() => {
              window.pullDigitalOrderFromRemote(orderData, order_data.order_id);
            }, 5000);
          } else {
            console.log(
              `Message="Order Not Found. Please pull the order manually"`,
            );
          }
        }
      }, 2000);

      // window.pullDigitalOrderFromRemote(order_data, order_data.order_id);
    }
    Swal.close();
    window.notifyUser.showMessage(
      'success',
      $.i18n.t('controller:partialAcceptnotifications.Orderacceptedpartially'),
    );
  } else {
    Swal.close();
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:partialAcceptnotifications.Somethingwentwrong'),
    );
  }
}

$('#partialAcceptorderModal').on('shown.bs.modal', function (_e) {
  Initialize();
});

initializeEvenets();
