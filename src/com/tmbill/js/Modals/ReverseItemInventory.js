window.reverseItemInventoryScriptLoaded = true;
/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
const { debounce } = require('lodash');
const {
  getHeadersformposforrender,
} = require('../../util/MiscServer.renderer');
const { apiCall } = require('../../services/APIService');
const { showLoader } = require('../CommonUtils');
window.modifyBillScriptLoaded = true;
let items;
let currentorderData;

/**
 *
 * @param {Item to add in table} item
 */
function addoldBillRow(item) {
  if (item !== undefined) {
    const table = $('#reverseItemInventoryBillItemTable');

    const oldkotitemrow = $('<tr>', {
      id: `modifyitemrow_${item.id}`,
    });

    const rowCell1 = $('<td>', { html: item.title });
    const rowCell2 = $('<td>', {
      html: item.quantity,
      class: 'modifyeditablekotQty',
      contenteditable: true,
      inputmode: 'decimal',
    });
    const rowCell3 = $('<td>', { html: item.amount });

    let kotNumber = item.kot_id;
    if (item.mpos_kot && item.mpos_kot.kot_number) {
      // eslint-disable-next-line no-unused-vars
      kotNumber = item.mpos_kot.kot_number;
    }

    //   let rowCell4 = $('<td>', { html: kot_number });
    const rowCell5 = $('<td>');
    const rowinputcheckbox = $('<input>', {
      class: 'olditemCheck',
      type: 'checkbox',
      id: `modifyitem_${item.id}`,
    }).click(function (_e) {
      //   if (item.discounted_items) {
      //     checkDiscounteditems(item, $(this).is(':checked'));
      //   }
    });
    const rowinputcheckboxlabel = $('<label>', {
      html: '&nbsp',
      for: `modifyitem_${item.id}`,
    });
    rowCell5.append(rowinputcheckbox);
    rowCell5.append(rowinputcheckboxlabel);

    if (item.discount_name) {
      $(rowCell2).prop('contenteditable', false);
    }
    oldkotitemrow.append(rowCell1);
    oldkotitemrow.append(rowCell2);
    oldkotitemrow.append(rowCell3);
    //   oldkotitemrow.append(rowCell4);
    oldkotitemrow.append(rowCell5);
    table.append(oldkotitemrow);
  }
  $('#reverseItemInventoryBillItemTable').trigger('rowAddOrRemove');
}

/**
 * Returns the checked items
 */
function getCheckedItems(_fortransferItem) {
  const selectedItems = [];
  const values = [];
  const kotNumberstoPrint = [];
  $('#reverseItemInventoryBillItemTable')
    .find('input[type="checkbox"]:checked')
    .each(function () {
      let rawId = $(this).attr('id');
      const closettr = $(this).closest('tr');
      if (closettr && closettr.length > 0) {
        try {
          const td = $(closettr).children('td').eq(3);
          if (!kotNumberstoPrint.includes(Number($(td).text()))) {
            kotNumberstoPrint.push(Number($(td).text()));
          }
        } catch (error) {
          console.error(error);
        }
      }
      if (rawId) {
        rawId = rawId.replace('modifyitem_', '');

        let data = {
          id: rawId,
        };
        values.push(data);
      }
    });

  items.forEach((item) => {
    const value = window._.find(values, { id: String(item.id) });
    if (value && value.reason) {
      item.reason = value.reason;
    }
    if (value) {
      // item.reason = value.reason ? value.reason : "";
      selectedItems.push(item);
    }
  });
  return selectedItems;
}

async function reverseInventory() {
  const selectedItems = getCheckedItems();

  if (selectedItems.length === 0) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:modifybillnotifications.Pleaseselectitem'),
    );
    return;
  }

  const inventoryItems = [];
  if (selectedItems && selectedItems.length) {
    selectedItems.forEach((item) => {
      const obj = {
        id: item.id,
        item_id: item.item_id,
        name: item.title,
        qty: item.quantity,
      };
      const options = [];
      if (item.options && item.options.length) {
        item.options.forEach((op) => {
          const opObj = {
            qty: op.qty,
            option_id: op.option_id,
            item_ref_id: op.item_ref_id,
            isAddOn: op.type,
            option_name: op.title,
          };
          options.push(opObj);
        });

        Object.assign(obj, {
          options,
        });
      }
      inventoryItems.push(obj);
    });
  }

  const payload = {
    order_state: currentorderData.order_state,
    order_id: currentorderData.order_id,
    store_id: currentorderData.store_id,
    tmpos_id: window.storeDetails.tmpos_id,
    items: inventoryItems,
  };

  showLoader({
    title: 'Reverse Inventory',
    text: $.i18n.t('controller:orderController.pleaseWait'),
  });

  const { data } = await apiCall.post(
    global.Config.links.reverseInventory,
    payload,
    {
      headers: getHeadersformposforrender(),
    },
  );

  window.Swal.close();
  // console.log(data);
  if (data && [200, '200'].includes(data.statusCode)) {
    window.notifyUser.showMessage('success', 'Inventory reversed');
    $('#reverseItemInventoryModal').modal('hide');
  }
  //   $('#reverseItemInventoryBillItemTable').find('tr:not(:first)').remove();
  //   if (currentorderData.items) {
  //     currentorderData.items.forEach((item) => {
  //       addoldBillRow(item);
  //     });
  //   }
}

function Initialize() {
  const details = $('#reverseItemInventoryModalbodyid')[0];
  currentorderData = JSON.parse(details.getAttribute('data'));
  items = currentorderData.items;

  $('#reverseItemInventoryBillItemTable').find('tr:not(:first)').remove();
  if (currentorderData.items) {
    currentorderData.items.forEach((item) => {
      addoldBillRow(item);
    });
  }

  $('#reverserItemInventoryButton').on(
    'click',
    debounce(() => {
      reverseInventory();
    }, 300),
  );

  //   if ($.i18n) {
  //     initalizei18nformodifybillWindow();
  //   } else {
  //     setTimeout(initalizei18nformodifybillWindow, 400);
  //   }
}

$('#reverseItemInventoryModal').on('shown.bs.modal', (_e) => {
  $('#reverserItemInventoryButton').unbind();
  Initialize();
});

setTimeout(() => {
  Initialize();
}, 100);
