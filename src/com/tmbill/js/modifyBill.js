/* eslint-disable no-param-reassign */
/* eslint-disable func-names */
const { debounce } = require('lodash');
const {
  orderCalculations,
  sectionWiseOrderCalculation,
} = require('./calculations');
const { MAKE_REASON_MANDATORY } = require('../util/SettingIDs');
const { initalizei18nformodifybillWindow } = require('./i18nController');
const {
  makeCancelitemmodificationrequest,
  makeUpdateBillqtyrequest,
  makeUpdateBillrequest,
} = require('../renderer/helper/Receipt.helper');
const { safeParse } = require('../util/RendererUtils');

window.modifyBillScriptLoaded = true;
let reasonMandatory = false;
let items;
let currentorderData;
const updatedItemslist = {};

/**
 *
 * @param {Item to add in table} item
 */
function addoldBillRow(item) {
  if (item !== undefined) {
    const table = $('#modifyBillItemTable');

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
      if (item.discounted_items) {
        checkDiscounteditems(item, $(this).is(':checked'));
      }
    });
    const rowinputcheckboxlabel = $('<label>', {
      html: '&nbsp',
      for: `modifyitem_${item.id}`,
    });
    const rowinputreason = $('<input>', {
      type: 'text',
      class: 'reasonField',
      placeholder: 'reason',
      style: 'display:none',
    });
    rowCell5.append(rowinputcheckbox);
    rowCell5.append(rowinputcheckboxlabel);
    rowCell5.append(rowinputreason);

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
  $('#modifyBillItemTable').trigger('rowAddOrRemove');
}

/**
 * Returns the checked items
 */
function getCheckedItems(_fortransferItem) {
  const selectedItems = [];
  const values = [];
  const kotNumberstoPrint = [];
  $('#modifyBillItemTable')
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
        const reason = $(this).siblings('input.reasonField').val();

        if (reason.length > 50) {
          setTimeout(() => {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t(
                'controller:modifybillnotifications.Reasonlengthshouldbelessthanfiftycharacters',
              ),
            );
          }, 50);
          return;
        }
        if (reasonMandatory && !reason) {
          setTimeout(() => {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t('controller:modifybillnotifications.Addreason'),
            );
          }, 50);
          return;
        }

        let data;
        // data = {
        //   id: raw_id
        // };
        if (reason.length) {
          data = {
            id: rawId,
            reason,
          };
        } else {
          data = {
            id: rawId,
          };
        }
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

async function cancelItem() {
  const selectedItems = getCheckedItems();
  if (
    currentorderData.items &&
    selectedItems &&
    currentorderData.items.length === selectedItems.length
  ) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:modifybillnotifications.Cantcancelallitems'),
    );
    return;
  }
  if (selectedItems.length === 0) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:modifybillnotifications.Pleaseselectitem'),
    );
    return;
  }
  const result = await makeCancelitemmodificationrequest({
    selectedItems,
    order_id: currentorderData.order_id,
    inventoryReduced: currentorderData.inventoryReduced,
  });
  if (result) {
    selectedItems.forEach((element) => {
      const index = window._.findIndex(currentorderData.items, {
        id: element.id,
      });
      currentorderData.items.splice(index, 1);
    });

    // Object.assign(currentorderData.extra_details, { isModifiedBill: true });
    // const calcResult = await orderCalculations(currentorderData);
    let calcResult;
    if (window.ISBILLINGBYSECTION_ON) {
      calcResult = sectionWiseOrderCalculation(currentorderData);
    } else {
      calcResult = orderCalculations(currentorderData);
    }
    Object.assign(calcResult.extra_details, { isModifiedBill: true });

    if (calcResult) {
      // update order level values
      const orderLevelValues = {
        discount: calcResult.discounttoApply,
        charges: calcResult.chargesTotal,
        order_level_total_charges: calcResult.chargesTotal,
        order_level_total_taxes: calcResult.taxTotal,
        order_subtotal: calcResult.totalAmount,
        order_total: calcResult.grandTotal,
        // cust_paid_amount: calcResult.grandTotal,
        billId: currentorderData.order_id,
        extra_details: calcResult.extra_details,
        additional_charges: calcResult.charges,
        sync_status: 0,
      };

      makeUpdateBillrequest(orderLevelValues);
      window.notifyUser.showMessage(
        'success',
        $.i18n.t('controller:modifybillnotifications.Itemdeleted'),
      );
    }
  }
  $('#modifyBillItemTable').find('tr:not(:first)').remove();
  if (currentorderData.items) {
    currentorderData.items.forEach((item) => {
      addoldBillRow(item);
    });
  }
}

async function makeUpdatebillqtyrequest(params) {
  const reply = await makeUpdateBillqtyrequest(params);
  if (reply === 'success') {
    window.notifyUser.showMessage(
      'success',
      $.i18n.t('controller:modifybillnotifications.Itemquantityupdated'),
    );
    // Object.assign(currentorderData.extra_details, { isModifiedBill: true });
    let calcResult;
    if (window.ISBILLINGBYSECTION_ON) {
      calcResult = sectionWiseOrderCalculation(currentorderData);
    } else {
      calcResult = orderCalculations(currentorderData);
    }
    Object.assign(calcResult.extra_details, { isModifiedBill: true });

    //   return
    if (calcResult) {
      // update order level values
      const orderLevelValues = {
        discount: calcResult.discounttoApply,
        charges: calcResult.chargesTotal,
        order_level_total_charges: calcResult.chargesTotal,
        order_level_total_taxes: calcResult.taxTotal,
        order_subtotal: calcResult.totalAmount,
        order_total: calcResult.grandTotal,
        cust_paid_amount: calcResult.grandTotal,
        billId: currentorderData.order_id,
        extra_details: calcResult.extra_details,
        sync_status: 0,
        additional_charges: calcResult.charges,
        couponDisounttotal: calcResult.coupondiscounttoApply,
      };

      makeUpdateBillrequest(orderLevelValues);
    }
  }
}

function sendUpdateqtyrequest(newQty, item) {
  const quantityDecreased = newQty - item.quantity;
  item.originalQty = item.quantity;
  item.quantity = newQty;
  // itemExists = true;
  item.amount = Number(item.item_price * item.quantity).toFixed(
    window.ROUNDOFF_UPTO,
  );
  if (quantityDecreased > 0) {
    item.newQuantity = quantityDecreased;
  }

  const updateOldkotdata = {
    updateStatus: false,
    status: 5, // Updated,
    quantity: item.quantity,
    amount: item.amount,
    id: item.id,
    hasOptions: item.has_options,
    item,
    order_id: item.orderMasterId,
    inventoryReduced: currentorderData.inventoryReduced,
  };

  if (quantityDecreased < 0) {
    const cancelledItem = { ...item };
    const copyOfCancelledItem = { ...item };
    delete cancelledItem.kot_item_id;
    cancelledItem.quantity = Math.abs(quantityDecreased);
    cancelledItem.amount = cancelledItem.item_price * cancelledItem.quantity;
    cancelledItem.status = 2;
    cancelledItem.item_name = cancelledItem.title;

    copyOfCancelledItem.quantity = Math.abs(quantityDecreased);
    copyOfCancelledItem.amount =
      cancelledItem.item_price * cancelledItem.quantity;
    copyOfCancelledItem.status = 1;
    copyOfCancelledItem.item_name = cancelledItem.title;
    copyOfCancelledItem.comment = '##DELETE_THIS_ITEM##';
    Object.assign(updateOldkotdata, {
      cancelledItem,
      copyOfCancelledItem,
      quantityDecreased: true,
    });
  }

  if (newQty === 0) {
    Object.assign(updateOldkotdata, {
      actionType: 2,
      quantity: 1,
      amount: item.item_price * 1,
      status: 2,
    });
  }
  updatedItemslist[item.title] = item;
  makeUpdatebillqtyrequest(updateOldkotdata);
}

function Initialize() {
  const details = $('#billModifyModalbodyid')[0];
  currentorderData = JSON.parse(details.getAttribute('data'));
  items = currentorderData.items;
  // eslint-disable-next-line array-callback-return
  currentorderData.items.map((item) => {
    delete Object.assign(item, { amount: item.total }).total;
    delete Object.assign(item, { item_price: item.price }).price;
    delete Object.assign(item, { item_is_devidable: item.is_devidable })
      .is_devidable;
    delete Object.assign(item, { item_tax_method: item.tax_method }).tax_method;
    delete Object.assign(item, { item_tax_name: item.tax_name }).tax_name;
    delete Object.assign(item, { item_tax_per: item.tax_per }).tax_per;
    Object.assign(item, { item_tax_value: item.tax_value });
  });
  if (Number(currentorderData.discount)) {
    const extra_details = safeParse(currentorderData.extra_details);
    currentorderData.discount = extra_details?.discount?.discount_rate;
    currentorderData.discount_type = extra_details?.discount?.discount_type;
    if (extra_details.discountHistory && extra_details.discountHistory.length) {
      currentorderData.discount =
        extra_details.discountHistory[0]?.discount_rate;
      currentorderData.discount_type =
        extra_details.discountHistory[0]?.discount_type;
    }
  }

  if (currentorderData.tmpos_order_charges) {
    currentorderData.charges = currentorderData.tmpos_order_charges;
    currentorderData.charges.forEach((charge) => {
      Object.assign(charge, { amount: charge.chargeAmount });
      if (charge.calculated_tax) {
        Object.assign(charge, { is_tax_applicable: 1 });
      }
    });
  }

  $('#modifyBillItemTable').find('tr:not(:first)').remove();
  if (currentorderData.items) {
    currentorderData.items.forEach((item) => {
      addoldBillRow(item);
    });
  }

  $('#cancelmodifyItemtButton').on(
    'click',
    debounce(() => {
      cancelItem();
    }, 300),
  );

  $(document).on(
    'click',
    '#modifyBillItemTable tbody tr td:last-child input.olditemCheck',
    function (_e) {
      const isChecked = $(this).is(':checked');
      // let kot_item_id = $(this).attr('id');
      // kot_item_id = String(kot_item_id).replace('olditem_', '');

      if (isChecked) {
        $(this).siblings('input.reasonField').show();
      } else {
        $(this).siblings('input.reasonField').hide();
      }
    },
  );

  if (window.settingsConfig[MAKE_REASON_MANDATORY - 1] !== undefined) {
    reasonMandatory =
      window.settingsConfig[MAKE_REASON_MANDATORY - 1].value === '1';
  }

  $(document).on(
    'blur',
    '#modifyBillItemTable tr .modifyeditablekotQty',
    function (_e) {
      let newQty = $(this).text();
      if (newQty && newQty.length > 10) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:modifybillnotifications.Quantitylengthshouldbelessthantendigit',
          ),
        );
        return;
      }

      const rawId = $(this).parent().attr('id');
      $('#modifyBillItemTable').find('tr:not(:first)').remove();
      try {
        newQty = Number(Number(newQty).toFixed(window.ROUNDOFF_UPTO));
      } catch (error) {
        newQty = 1;
      }
      if (newQty === 0) {
        newQty = 1;
      }

      const currentItemid = rawId.replace('modifyitemrow_', '');
      const isqtyValid = newQty && newQty > 0;
      if (isqtyValid && items !== undefined) {
        // let updatedItem;
        items.forEach((item) => {
          if (item.id === Number(currentItemid) && newQty !== item.quantity) {
            sendUpdateqtyrequest(newQty, item);
          }
          addoldBillRow(item);
        });
      }
    },
  );

  $(document).on(
    'keydown',
    '#modifyBillItemTable td.modifyeditablekotQty',
    function (e) {
      if (e.keyCode === 13) {
        try {
          $(this).blur();
        } catch (error) {
          console.error(error);
        }
      }
    },
  );

  if ($.i18n) {
    initalizei18nformodifybillWindow();
  } else {
    setTimeout(initalizei18nformodifybillWindow, 400);
  }
}

$('#billModifyModal').on('shown.bs.modal', (_e) => {
  $('#cancelmodifyItemtButton').unbind();
  Initialize();
});

$('#billModifyModal').on('hidden.bs.modal', () => {
  $('#receipt_fetchbillsButton').click();
});

setTimeout(() => {
  Initialize();
}, 100);
