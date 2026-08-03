/* eslint-disable no-param-reassign */
/* eslint-disable no-case-declarations */
/* eslint-disable camelcase */
const { cloneDeep, debounce } = require('lodash');
const {
  makeGetItemModifiersRequest,
} = require('../../renderer/helper/Catalog.helper');
const {
  DINEIN_TAB_ID,
  TAKEAWAY_TAB_ID,
  QUICK_TAB_ID,
  DELIVERY_TAB_ID,
} = require('../../util/Constants');
const { sleep } = require('../../util/MiscUtil');
const { calculateTaxForItem } = require('../calculations');
const {
  checkforMultipricingbydept,
  checkforMultipricing,
} = require('../MultiPricing');
const { safeParse } = require('../../util/RendererUtils');
const { initalizei18nforItemModifier } = require('../i18nController');

const currentclickedItem = {};
let itemrefid;
let currentClickedItemwithoutclone;
let tableDeptId;
let orderType;
let editItem = false;
let itemQty;

let selectedOptions = [];
let validateOptions = [];
let item_index = 0;
// let cancelledAddonslist = {};
let defaultVariantlist = {};
let defaultDeselected = {};
let otherSelectedlist = {};
let printOnKOTAndBill = {};
let printOnKOTAndBillDefaultDeselected = {};
let varientQtySelectedForGroup = {};
let addonQtySelectedForGroup = {};
let defaultSelectedAddons = true;

function renderSelectedOptions() {
  $('#modifiersCartContainerID').empty();
  let totalAmount =
    currentclickedItem?.data?.sale_price ||
    currentclickedItem?.data?.original_sale_price ||
    0;

  if (
    currentclickedItem?.data?.pricebeforeDiscount ||
    currentclickedItem?.data?.original_pricebeforeDiscount
  ) {
    totalAmount =
      currentclickedItem?.data?.pricebeforeDiscount ||
      currentclickedItem?.data?.original_pricebeforeDiscount ||
      0;
  }

  let totalQty = 0;
  let totalOptionsAmount = 0;
  let totalAddonsAmount = 0;
  let optionSelected = false;
  const itemData = currentclickedItem.data;
  selectedOptions = selectedOptions.sort((a, b) => a.item_index - b.item_index);

  selectedOptions.forEach((option) => {
    if (option.type === 0) {
      totalOptionsAmount += option.price;
      optionSelected = true;
      // if (itemData.discounted_price > 0) {
      //   if (itemData.discount_type === 1) {
      //     const discountAmt = option.price * (itemData.discount_rate / 100);
      //     totalOptionsAmount -= discountAmt;
      //   } else {
      //     totalOptionsAmount -= itemData.discount_rate;
      //   }
      // }
    } else {
      const total = option.price * option.qty;
      // totalAmount += total;
      if (option.free) {
        const totalamt = option.price * option.qty;
        let totalAmtToAdd = 0;
        if (option.qty < option.free) {
          totalAmtToAdd = 0;
        } else {
          totalAmtToAdd = totalamt - option.price * option.free;
        }
        totalAddonsAmount += totalAmtToAdd;
      } else {
        totalAddonsAmount += total;
      }
      // if (option.free) {
      //   totalAddonsAmount -= option.price * option.free;
      // }
    }
    if (optionSelected) {
      totalAmount = totalOptionsAmount;
    }
    // totalAmount += totalAddonsAmount;
    totalQty += option.qty;

    // if (option.free) {
    //   totalAmount -= option.price * option.free;
    // }
    const itemContainer = $('<div>', {
      class: 'cart-item-details-container',
    });
    let optionTitle = option.title;
    if (window.selectedLanguage !== 'en' && option.alternative_title) {
      optionTitle = option.alternative_title;
    }
    const title = $('<h6>', {
      text: optionTitle,
    });

    const qtyAndPrice = $('<h6>', {
      text: `${option.qty} x ${option.price}`,
      class: 'modifier-qty-and-price',
    });

    itemContainer.append(title);
    itemContainer.append(qtyAndPrice);
    $('#modifiersCartContainerID').append(itemContainer);
  });
  totalAmount += totalAddonsAmount;
  if (itemData.discount_rate > 0 && totalAmount !== itemData.sale_price) {
    if (itemData.discount_type === 1) {
      const discountAmt = totalAmount * (itemData.discount_rate / 100);
      if (totalAmount > discountAmt) {
        totalAmount -= discountAmt;
      }
    } else if (totalAmount > itemData.discount_rate) {
      totalAmount -= itemData.discount_rate;
    }
  }

  $('#modifierTotalQuantity').text(
    `${totalQty} ${totalQty === 1 ? $.i18n.t('controller:orderController.Item') : $.i18n.t('controller:orderController.Items')}`,
  );

  $('#modifierTotalAmount').text(
    `${window.storeDetails.currency} ${Number(totalAmount).toFixed(window.ROUNDOFF_UPTO)}`,
  );
  const cartBody = document.querySelector('#modifiersCartContainerID');
  cartBody.scrollTop = cartBody.scrollHeight - cartBody.clientHeight;
}

async function decrementQuantity(item, editSelecteitem) {
  // if (item.inputType === 'checkbox') {
  const itemIndex = selectedOptions.findIndex(
    (i) =>
      Number(i.item_id) === Number(item.item_id) &&
      Number(i.group_id) === Number(item.group_id),
  );

  const existItem = selectedOptions[itemIndex];
  existItem.qty -= 1;

  // default items are added by checking default status of UI
  if (item.default_selected) {
    const $el = $(item);
    let qty = $el[0]?.qty || 0;
    qty = qty > 0 ? qty - 1 : 0; // decrement but not below 0
    $el[0].qty = qty;
  }
  // if (editSelecteitem) {
  //   item.qty -= 1;
  // }
  $(`#optionGroup_${item.group_id} #addonQty_${item.item_id}`).text(
    existItem.qty,
  );
  defaultSelectedAddons = false;

  if (existItem.qty === 0) {
    // cancelledAddonslist[item.item_id] = {
    //   title: item.title,
    //   alternative_title: item.alternative_title,
    //   qty: item.qty,
    // };
    if (otherSelectedlist[`item_${item.item_id}`]) {
      delete otherSelectedlist[`item_${item.item_id}`];
    }
    if (
      (item.type === 1 || item.inputType === 'checkbox') &&
      printOnKOTAndBill[`item_${item.item_id}`]
    ) {
      delete printOnKOTAndBill[`item_${item.item_id}`];
    }
    if (existItem.default_selected) {
      defaultDeselected[`item_${item.item_id}`] = {
        title: item.title,
        alternative_title: item.alternative_title,
        qty: item.qty,
      };
    }
    if (item.type === 1 && item.default_selected && item.enableForPrint) {
      printOnKOTAndBillDefaultDeselected[`item_${item.item_id}`] = {
        title: item.title,
        qty: item.qty,
        alternative_title: item.alternative_title,
      };
    }

    selectedOptions.splice(itemIndex, 1);
    $(`#optionGroup_${item.group_id} #decrementQty_${item.item_id}`).hide();
    $(`#optionGroup_${item.group_id} #addonQty_${item.item_id}`).text('');

    $(`#optionGroup_${item.group_id} #option_${item.item_id}`)
      .removeClass('active')
      .css({ 'background-color': 'rgba(219, 209, 209, 0.822)' });
  }
  if (item.type === 0) {
    varientQtySelectedForGroup[item.group_id] = {
      qty: varientQtySelectedForGroup[item.group_id].qty - 1,
    };
    if (
      item.option_group_level_min !== 0 &&
      varientQtySelectedForGroup[item.group_id].qty <
        item.option_group_level_min
    ) {
      $(`#optionGroup_title_${item.group_id}`)
        .removeClass('success-group-title')
        .addClass('danger-group-title');
    }
  } else {
    addonQtySelectedForGroup[item.group_id] = {
      qty: (addonQtySelectedForGroup[item.group_id]?.qty || 0) - 1,
    };
    if (
      item.option_group_level_min !== 0 &&
      addonQtySelectedForGroup[item.group_id].qty < item.option_group_level_min
    ) {
      $(`#optionGroup_title_${item.group_id}`)
        .removeClass('success-group-title')
        .addClass('danger-group-title');
    }
  }
  if (item.type === 1 && item.qty && item.enableForPrint) {
    printOnKOTAndBill[`item_${item.item_id}`] = {
      title: item.title,
      qty: item.qty,
      alternative_title: item.alternative_title,
    };
  }
  if (item.type === 1 && item.enableForPrint) {
    otherSelectedlist[`item_${item.item_id}`] = {
      title: item.title,
      qty: item.qty,
      alternative_title: item.alternative_title,
    };
  }
  if (item.type === 1 && item.enableForPrint) {
    otherSelectedlist[`item_${item.item_id}`] = {
      title: item.title,
      qty: item.qty,
      alternative_title: item.alternative_title,
    };
  }

  if (item.type === 1 && existItem.qty === 0) {
    delete otherSelectedlist[`item_${item.item_id}`];
  }

  item[`qtySelectedForGroup_${item.group_id}`] =
    (item[`qtySelectedForGroup_${item.group_id}`] || 0) - 1;
  // if (
  //   item.option_group_level_min !== 0 &&
  //   item[`qtySelectedForGroup_${item.group_id}`] < item.option_group_level_min
  // ) {
  //   $(`#optionGroup_title_${item.group_id}`)
  //     .removeClass('success-group-title')
  //     .addClass('danger-group-title');
  // }
  // if (item.qty > 1) {
  //   item.qty -= 1;
  // }

  // }
  renderSelectedOptions();
}

function resetSelectedOptions() {
  if (selectedOptions && selectedOptions.length) {
    selectedOptions.forEach((option) => {
      // if (!option.default_selected) {
      $(`#option_${option.item_id}`)
        .removeClass('active')
        .css({ 'background-color': 'rgba(219, 209, 209, 0.822)' });
      $(`#option_${option.item_id} .addonQtyClass`).text('');
      $(`#option_${option.item_id} .decrementQtyClass`).hide();
      option.qty = 0;
      // const itemIndex = selectedOptions.findIndex(
      //   (i) => i.item_id === option.item_id && i.group_id === option.group_id,
      // );
      // selectedOptions.splice(itemIndex, 1);
      // }
    });

    selectedOptions = [];
    // cancelledAddonslist = {};
    defaultVariantlist = {};
    defaultDeselected = {};
    otherSelectedlist = {};
    printOnKOTAndBill = {};
    printOnKOTAndBillDefaultDeselected = {};
    varientQtySelectedForGroup = {};
    addonQtySelectedForGroup = {};
    defaultSelectedAddons = true;
  }
}
async function putItemInCart(item) {
  // selectedOptions.push(item);
  // check multipricing
  if (!item.skipmultipricing) {
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    if (activeTab) {
      Object.assign(item, {
        item_refid: item.item_id,
      });
      switch (activeTab) {
        case DINEIN_TAB_ID:
          const newitem = checkforMultipricingbydept(item, tableDeptId, true);
          if (newitem.data) {
            item = newitem.data;
            const itemIndex = selectedOptions.findIndex(
              (i) => i.item_id === item.item_id && i.group_id === item.group_id,
            );
            const existItem = selectedOptions[itemIndex];
            if (existItem) {
              item.qty = existItem.qty;
            }
          }
          break;
        default:
          const new_item = checkforMultipricing(item, orderType, true);
          if (new_item.data) {
            item = new_item.data;
            const itemIndex = selectedOptions.findIndex(
              (i) => i.item_id === item.item_id && i.group_id === item.group_id,
            );
            const existItem = selectedOptions[itemIndex];
            if (existItem) {
              item.qty = existItem.qty;
            }
          }
          break;
      }
    }
  }

  defaultSelectedAddons = false;

  if (item.inputType === 'checkbox' && item.option_group_level_max) {
    const allItemsofgroup = selectedOptions.filter(
      (i) => i.group_id === item.group_id,
    );
    let totalQty = 0;
    allItemsofgroup.forEach((i) => (totalQty += i.qty));
    if (totalQty >= item.option_group_level_max) {
      window.notifyUser.showMessage(
        'error',
        `You can select maximum ${item.option_group_level_max} options`,
      );
      return;
    }
  }
  if (item.inputType === 'checkbox') {
    if (item.qty >= item.max) {
      window.notifyUser.showMessage(
        'error',
        `You can select maximum ${item.max} options`,
      );
      return;
    }
  }

  item[`qtySelectedForGroup_${item.group_id}`] =
    (item[`qtySelectedForGroup_${item.group_id}`] || 0) + 1;

  // $('#modifiersCartContainerID').empty();

  // $(`.parent_group_id_${item.group_id}`).hide();
  // $(`.parent_optionGroup_title__id_${item.group_id}`).hide();
  // $(`.parent_group_id_${item.group_id} button`)
  //   .removeClass('active')
  //   .css({ 'background-color': 'rgba(219, 209, 209, 0.822)' });

  // $(`.parent_group_id_${item.group_id} .decrementQtyClass`).hide();

  if (item && item.optionGroups && item.optionGroups.length) {
    item.optionGroups.forEach((op) => {
      $(`#optionGroup_${op.id}`).show();
      $(`#optionGroup_title_${op.id}`).show();
    });
  }

  // hide options groups first and then show assigned options groups
  if ((item.mainBaseItem || item.parentBaseItem) && item.assigned_groups) {
    $('.ChildoptionGroup').hide();
    // $('.optionGroup-titles').hide();
    $('.ChildoptionGroupTitle').hide();

    // $(`.ChildoptionGroup button`)
    //   .removeClass('active')
    //   .css({ 'background-color': 'rgba(219, 209, 209, 0.822)' });

    // $(`.ChildoptionGroup .decrementQtyClass`).hide();
    // validateOptions = [];
    // resetSelectedOptions();
    if (item.inputType !== 'radio') {
      resetSelectedOptions();
    }
    $(`#optionGroup_title_${item.option_group_id}`).show();

    const assignedGroups = item.assigned_groups.split(',');
    assignedGroups.forEach((group) => {
      $(`#optionGroup_${group}`).show();
      $(`.parent_optionGroup_title__id_${group}`).show();
    });
  } else if (item.parentBaseItem && !item.assigned_groups) {
    $('.ChildoptionGroup').hide();
    // $('.optionGroup-titles').hide();
    $('.ChildoptionGroupTitle').hide();
  }

  $(`#option_${item.item_id}`).addClass('active');
  if (item.inputType === 'radio') {
    const groupSelector = `#optionGroup_${item.group_id}`;

    // Clear UI
    $(`${groupSelector} button`)
      .removeClass('active')
      .css({ 'background-color': 'rgba(219, 209, 209, 0.822)' });

    $(`${groupSelector} .decrementQtyClass`).hide();
    $(`${groupSelector} .addonQtyClass`).text('');

    // Remove previous selection of same group
    selectedOptions = selectedOptions.filter(
      (i) => Number(i.group_id) !== Number(item.group_id),
    );

    // Add new selection
    item.qty = 1;
    selectedOptions.unshift(item);

    $('#modifiersCartContainerID').empty();
  }

  if (item.type === 0) {
    // varient
    $(`#decrementQty_${item.item_id}`).show();
    $(`#optionGroup_${item.group_id} #option_${item.item_id}`).css({
      'background-color': 'rgb(255 45 45 / 75%)',
    });
    $(`#optionGroup_${item.group_id} #addonQty_${item.item_id}`).text(
      item.qty ? item.qty : '',
    );

    setTimeout(() => {
      $(`#decrementQty_${item.item_id}`).show();
      $(`#optionGroup_${item.group_id} #option_${item.item_id}`).css({
        'background-color': 'rgb(255 45 45 / 75%)',
      });
      $(`#optionGroup_${item.group_id} #addonQty_${item.item_id}`).text(
        item.qty ? item.qty : '',
      );
    }, 50);
  } else {
    $(`#optionGroup_${item.group_id} #option_${item.item_id}`).css({
      'background-color': 'rgb(134 240 140 / 75%)',
    });
    $(`#optionGroup_${item.group_id} #decrementQty_${item.item_id}`).show();
    $(`#optionGroup_${item.group_id} #addonQty_${item.item_id}`).text(
      item.qty ? item.qty + 1 : 1,
    );
  }

  if (item.inputType === 'checkbox') {
    const itemIndex = selectedOptions.findIndex(
      (i) => i.item_id === item.item_id && i.group_id === item.group_id,
    );

    if (itemIndex === -1) {
      item.qty = 1;
      selectedOptions.push(item);
    } else {
      const existItem = selectedOptions[itemIndex];
      existItem.qty += 1;
    }
  }
  // check for nested groups and set default for nested
  if (item.has_nested_mg && item.optionGroups) {
    for (let i = 0; i < item.optionGroups.length; i++) {
      for (let j = 0; j < item.optionGroups[i].option_list.length; j++) {
        if (item.optionGroups[i].option_list[j].default_selected) {
          if (item.optionGroups[i].option_list[j].inputType === 'radio') {
            $(
              `#optionGroup_${item.optionGroups[i].option_list[j].group_id} button`,
            ).removeClass('active');
            $(
              `#optionGroup_${item.optionGroups[i].option_list[j].group_id} button`,
            ).css({ 'background-color': 'rgba(219, 209, 209, 0.822)' });
            const itemId = item.optionGroups[i].option_list[j].item_id;
            $(
              `#optionGroup_${item.optionGroups[i].option_list[j].group_id} #option_${itemId}`,
            ).addClass('active');
            $(
              `#optionGroup_${item.optionGroups[i].option_list[j].group_id} #option_${itemId}`,
            ).css({
              'background-color': 'rgb(255 45 45 / 75%)',
            });

            const itemGroupId =
              item.optionGroups[i].option_list[j].parent_group_id;
            const itemIndex = selectedOptions.findIndex(
              (i) => i.parent_group_id === itemGroupId,
            );
            item.optionGroups[i].option_list[j].qty = 1;
            if (itemIndex === -1) {
              selectedOptions.push(item.optionGroups[i].option_list[j]);
            } else {
              // after changing varient selected varient is deselected if it's default then add in cancelled default items
              defaultDeselected[`item_${selectedOptions[itemIndex].item_id}`] =
                {
                  title: selectedOptions[itemIndex].title,
                  qty: selectedOptions[itemIndex].qty,
                  alternative_title: item.alternative_title,
                };
              selectedOptions.splice(itemIndex, 1);

              // selectedOptions.push(item);
              selectedOptions.splice(
                itemIndex,
                0,
                item.optionGroups[i].option_list[j],
              );
            }
            // $(`#option_${item.optionGroups[i].option_list[j].item_id}`).css({
            //   'background-color': 'rgb(255 45 45 / 75%)',
            // });
          }

          if (item.optionGroups[i].option_list[j].inputType === 'checkbox') {
            $(
              `#option_${item.optionGroups[i].option_list[j].item_id}`,
            ).addClass('active');
            $(`#option_${item.optionGroups[i].option_list[j].item_id}`).css({
              'background-color': 'rgb(134 240 140 / 75%)',
            });
          }
        }
      }
    }
    if ((item.mainBaseItem || item.parentBaseItem) && item.assigned_groups) {
      // addDefaultItemsInCart();
      // addDefaultItemsForVarientInCart(item);
      addDefaultNotForNestedItemInCart(item);
    }
  } else if (item.type === 0) {
    const itemGroupId = item.group_id;
    for (let i = 0; i < selectedOptions.length; i++) {
      const itemIndex = selectedOptions.findIndex(
        (i) => i.parent_group_id === itemGroupId,
      );
      if (itemIndex !== -1) {
        selectedOptions[itemIndex].qty = 0;
        selectedOptions.splice(itemIndex, 1);
      }
    }

    if (item.type === 0 && item.parentBaseItem && !item.assigned_groups) {
      addDefaultNotForNestedItemInCart(item);
      // addDefaultItemsForVarientInCart(item);
    }
  }

  if (item.type === 0 && item.parentBaseItem) {
    defaultVariantlist = {};
    defaultDeselected = {};
    otherSelectedlist = {};
    defaultVariantlist[`item_${item.item_id}`] = {
      title: item.title,
      qty: item.qty,
      alternative_title: item.alternative_title,
    };
  } else {
    const itemIndex = selectedOptions.findIndex(
      (i) => i.item_id === item.item_id && i.group_id === item.group_id,
    );

    const existItem = selectedOptions[itemIndex];
    otherSelectedlist[`item_${item.item_id}`] = {
      title: item.title,
      qty: existItem.qty, // item.qty,
      alternative_title: item.alternative_title,
    };
  }

  if (item.type === 0 && item.enableForPrint) {
    printOnKOTAndBill[`item_${item.group_id}`] = {
      title: item.title,
      qty: item.qty,
      alternative_title: item.alternative_title,
    };
  } else if (item.enableForPrint) {
    const itemIndex = selectedOptions.findIndex(
      (i) => i.item_id === item.item_id && i.group_id === item.group_id,
    );

    const existItem = selectedOptions[itemIndex];
    printOnKOTAndBill[`item_${item.item_id}`] = {
      title: item.title,
      qty: existItem.qty, // item.qty,
      alternative_title: item.alternative_title,
    };
  }
  if (item.type === 0) {
    varientQtySelectedForGroup[item.group_id] = {
      qty: 1,
    };
    if (
      item.option_group_level_min !== 0 &&
      varientQtySelectedForGroup[item.group_id].qty >=
        item.option_group_level_min
    ) {
      $(`#optionGroup_title_${item.group_id}`)
        .removeClass('danger-group-title')
        .addClass('success-group-title');
    }
  } else {
    addonQtySelectedForGroup[item.group_id] = {
      qty: (addonQtySelectedForGroup[item.group_id]?.qty || 0) + 1,
    };
    if (
      item.option_group_level_min !== 0 &&
      addonQtySelectedForGroup[item.group_id].qty >= item.option_group_level_min
    ) {
      $(`#optionGroup_title_${item.group_id}`)
        .removeClass('danger-group-title')
        .addClass('success-group-title');
    }
  }

  // if (cancelledAddonslist[item.item_id]) {
  //   delete cancelledAddonslist[item.item_id];
  // }
  if (
    item.type === 1 &&
    printOnKOTAndBillDefaultDeselected[`item_${item.item_id}`]
  ) {
    delete printOnKOTAndBillDefaultDeselected[`item_${item.item_id}`];
  }

  if (defaultDeselected[`item_${item.item_id}`]) {
    delete defaultDeselected[`item_${item.item_id}`];
  }
  renderSelectedOptions();
}

function renderModifierVarients(variants, option) {
  $('#modifierVarientContainerId').empty();
  variants.forEach((varient) => {
    // let variantTitle = varient.title;
    // if (window.selectedLanguage !== 'en') {
    //   variantTitle = varient.alternative_title;
    // }
    const varientLabel = $('<div>', {
      text: varient.title,
      class: 'modifier-varient',
      data: varient,
    }).click((e) => {
      const activeTab = $('.mainsectionTabs li a.active').attr('id');
      if (activeTab) {
        Object.assign(option, {
          item_refid: option.item_id,
        });
        // check multipricing
        Object.assign(option, {
          title: varient.title,
          price: varient.price,
          skipmultipricing: true,
        });
        switch (activeTab) {
          case DINEIN_TAB_ID:
            const newitem = checkforMultipricingbydept(
              varient,
              tableDeptId,
              true,
            );
            if (newitem.data) {
              // option = newitem.data;
              Object.assign(option, {
                sale_price: newitem.data.sale_price,
                price: newitem.data.sale_price,
                item_price: newitem.data.sale_price,
              });
            }
            break;
          default:
            const new_item = checkforMultipricing(varient, orderType, true);
            if (new_item.data) {
              // option = new_item.data;
              Object.assign(option, {
                sale_price: newitem.data.sale_price,
                price: newitem.data.sale_price,
                item_price: newitem.data.sale_price,
              });
            }
            break;
        }
      }

      putItemInCart(option);
      $('#modifierVarientModal').modal('hide');
    });
    const varientPrice = $('<span>', {
      text: `${window.storeDetails.currency} ${varient.price}`,
      class: 'varient-price',
    });
    if (varient.default_selected) {
      const defaultSelected = $('<span>', {
        text: 'Default',
        class: 'default-varient',
      });
      varientLabel.append(defaultSelected);
    }
    varientLabel.append(varientPrice);

    $('#modifierVarientContainerId').append(varientLabel);
  });
}
async function showItemModifiers() {
  // if (!window.customerItemModifiersscriptLoaded) {
  //   $('#itemModifiersModalbodyid').load('ItemModifiers.html', () => {
  //     $('#itemModifiersModal').modal('show');
  //     window.customerItemModifiersscriptLoaded = true;
  //   });
  // } else {
  //   $('#itemModifiersModal').modal('toggle');
  // }

  return new Promise((resolve) => {
    if (!window.customerItemModifiersscriptLoaded) {
      $('#itemModifiersModalbodyid').load('ItemModifiers.html', () => {
        $('#itemModifiersModal').modal('show');
        window.customerItemModifiersscriptLoaded = true;
        resolve(); // proceed only after modal is shown
      });
    } else {
      $('#itemModifiersModal').modal('toggle');
      resolve(); // modal was already loaded
    }
  });
}
let modifierGroupsId = [];

let option_group_index = 1;
// function addModifierItemsToView(
//   optionGroup,
//   parent_group_id,
//   isChildoption = false,
//   editSelecteitem = false,
// ) {
function addModifierItemsToView({
  optionGroup,
  parent_group_id,
  isChildoption,
  editSelecteitem,
}) {
  try {
    if (optionGroup.min) {
      const validateOptionGroup = {
        option_group_id: optionGroup.id,
        option_group_name: optionGroup.title,
        min: optionGroup.min,
      };
      validateOptions.push(validateOptionGroup);
    }
    if (optionGroup) {
      optionGroup.option_group_index = option_group_index;
      option_group_index += 1;
    }
    // this index for sequence
    optionGroup.option_list.map((option) => {
      // if (
      //   option.has_nested_mg &&
      //   option.optionGroups &&
      //   option.optionGroups.length
      // ) {
      //   option.mainBaseItem = true;
      //   option.optionGroups.forEach((opGroup) => {
      //     addModifierItemsToView(opGroup, opGroup.id, true);
      //   });
      // }
      let inputType = 'radio';
      let ismaxSelectable = false;
      let isminSelectable = false;
      let isrequired = false;

      if (optionGroup.min >= 1) {
        isrequired = true;
      }

      if (Number(optionGroup.type) === 1) {
        inputType = 'checkbox';
        ismaxSelectable = true;
      }

      if (optionGroup.min > 1) {
        isminSelectable = true;
      }
      Object.assign(option, {
        inputType,
        isrequired,
        ismaxSelectable,
        isminSelectable,
        minSelectable: option.min,
        maxSelectable: option.max,
        optiongrpTitle: option.title,
        isChildoption,
        parent_group_id,
        type: optionGroup.type,
        option_group_level_max: optionGroup.max,
        option_group_level_min: optionGroup.min,
        option_group_name: optionGroup.title,
        option_group_id: optionGroup.id,
      });

      // !isChildoption &&
      if (optionGroup.option_group_index == 1 && optionGroup.type === 0) {
        option.parentBaseItem = true;
      }
      if (optionGroup.extra_details) {
        const extraDetails = safeParse(optionGroup.extra_details);
        Object.assign(option, {
          enableForPrint: extraDetails.enable_for_print,
        });
      }
    });

    if (!modifierGroupsId.includes(optionGroup.id)) {
      let oprioncardclass = `card card-secondary parent_group_id_${parent_group_id}`;

      if (isChildoption) {
        oprioncardclass += ' ChildoptionGroup';
      }
      const card = $('<div>', {
        class: oprioncardclass,
        style: 'margin-bottom:2px',
        id: `optionGroup_${optionGroup.id}`,
      });

      let cardHeaderClass =
        'card-header card-custom-header modifier-card-header';
      if (Number(optionGroup.type) === 1) {
        cardHeaderClass += ' addonModifiercardHeader';
      } else {
        cardHeaderClass += ' varientModifiercardHeader';
      }

      const cardHeader = $('<div>', {
        class: cardHeaderClass,
      });

      let opGroupTitle = optionGroup.title;
      if (optionGroup.extra_details) {
        const extraDetails = safeParse(optionGroup.extra_details);
        if (
          window.selectedLanguage !== 'en' &&
          extraDetails.alternative_title
        ) {
          opGroupTitle = extraDetails.alternative_title;
        }
      }
      const modifierGroupTitle = $('<h3>', {
        class: 'card-title modifier-group-title',
        text: opGroupTitle,
      });

      let subTitle = optionGroup.description;

      if (!subTitle) {
        if (optionGroup.type === 0) {
          subTitle = $.i18n.t(
            'controller:orderController.youCanChoose.pleaseSelectAnyOneOption',
          );
        } else {
          subTitle =
            $.i18n.t(
              'controller:orderController.youCanChoose.youCanChooseUpTo',
            ) +
            ' ' +
            optionGroup.max +
            ' ' +
            $.i18n.t('controller:orderController.youCanChoose.options');
        }
      }
      const modifierGroupsubTitle = $('<div>', {
        class: 'card-title card-sub-title',
        text: subTitle,
      });

      const modifierContainer = $('<div>', {
        class: 'card-body card-custom-body modifierCardConatiner',
      });
      cardHeader.append(modifierGroupTitle);
      cardHeader.append(modifierGroupsubTitle);
      card.append(cardHeader);

      optionGroup.option_list.forEach((option) => {
        const buttonInfo = option;
        let optiontitle =
          window.selectedLanguage !== 'en' && option.alternative_title
            ? option.alternative_title
            : option.title;
        if (option.extra_details && option.extra_details.alternative_title) {
          optiontitle = option.extra_details.alternative_title;
        }
        const itembuttonWrapper = document.createElement('button');
        $(itembuttonWrapper).prepend(document.createTextNode(optiontitle));
        const optionPrice = $('<span>', {
          html: `<br>${window.storeDetails.currency} ${option.price}`,
          class: 'optionPrice-tag',
        });
        $(itembuttonWrapper).append(optionPrice);
        itembuttonWrapper.type = 'button';
        itembuttonWrapper.id = `option_${option.item_id}`;
        itembuttonWrapper.title = optiontitle;
        itembuttonWrapper.data = buttonInfo;
        itembuttonWrapper.classList.add('modifier-button');

        item_index += 1;
        // add item index
        Object.assign(option, { item_index });

        // if (optionGroup.type === 0 && option.item_index == 1) {
        //   option.parentBaseItem = true;
        // }
        if (option.default_selected) {
          const defaultTag = $('<span>', {
            text: 'Default',
            class: 'default-tag',
          });
          $(itembuttonWrapper).append(defaultTag);

          itembuttonWrapper.classList.add('active');
          itembuttonWrapper.classList.add('defaultSelected');

          // for edit item it should not add default qty
          if (!editSelecteitem) {
            option.qty = option.defaultQty;
          }
          Object.assign(option, {
            option_type: option.type,
          });
          if (option.type === 0) {
            // varient
            itembuttonWrapper.style.backgroundColor = 'rgb(255 45 45 / 75%)';
          } else {
            itembuttonWrapper.style.backgroundColor = 'rgb(134 240 140 / 75%)';
          }
        }
        const addonqty = $('<span>', {
          id: `addonQty_${option.item_id}`,
          class: 'addonQtyClass',
          text: option.default_selected ? option.defaultQty : '',
          // text: option.default_selected
          //   ? option.free
          //     ? 1 + option.free
          //     : 1
          //   : '',
        });
        $(itembuttonWrapper).append(addonqty);
        // if (option.type == 1) {
        // add - button
        const minusButton = $('<button>', {
          id: `decrementQty_${option.item_id}`,
          class: 'decrementQtyClass fas fa-minus',
        })
          .css({
            display: option.default_selected ? '' : 'none',
          })
          .on('click', (e) => {
            e.stopPropagation();
            decrementQuantity(option, editSelecteitem);
          });
        $(itembuttonWrapper).append(minusButton);
        // }

        itembuttonWrapper.onclick = async function (e) {
          e.stopPropagation();
          if (option.variants && option.variants.length) {
            // open modal to select variant
            $('#modifierVarientModal').modal('show');
            renderModifierVarients(option.variants, option);
          } else {
            putItemInCart(option);
          }
        };
        modifierContainer.append(itembuttonWrapper);
      });
      // });
      card.append(modifierContainer);
      // document.getElementById('modifiersContainerId').appendChild(card);
      $('#modifiersContainerId').append(card);

      let optionGrouptitleClass = `parent_optionGroup_title__id_${parent_group_id} optionGroup-titles`;
      if (isChildoption) {
        optionGrouptitleClass += ' ChildoptionGroupTitle';
      }

      if (optionGroup.min > 0) {
        optionGrouptitleClass += ' danger-group-title';
      }
      const optionGroupTitle = $('<a>', {
        text: opGroupTitle,
        id: `optionGroup_title_${optionGroup.id}`,
        class: optionGrouptitleClass,
      }).click(() => {
        $('#modifierGroupsContainerId a').removeClass(
          'active-option-group-title',
        );
        document
          .getElementById(`optionGroup_title_${optionGroup.id}`)
          .classList.add('active-option-group-title');
        document
          .getElementById(`optionGroup_${optionGroup.id}`)
          .scrollIntoView();
      });

      $('#modifierGroupsContainerId').append(optionGroupTitle);
      if (isChildoption) {
        $(card).hide();
        $(optionGroupTitle).hide();
      }

      optionGroup.option_list.forEach((option) => {
        if (
          option.has_nested_mg &&
          option.optionGroups &&
          option.optionGroups.length
        ) {
          option.mainBaseItem = true;
          option.optionGroups.forEach((opGroup) => {
            addModifierItemsToView({
              optionGroup: opGroup,
              parent_group_id: opGroup.id,
              isChildoption: true,
            });
          });
        }
        if (option.optionGroups) {
          option.optionGroups.forEach((childOption) => {
            addModifierItemsToView({
              optionGroup: childOption,
              parent_group_id: option.group_id,
              isChildoption: true,
            });
          });
        }
      });
      modifierGroupsId.push(optionGroup.id);
    }
  } catch (error) {
    console.log('error::', error);
  }

  return true;
}

function renderDefaultSelectedItems(item) {
  $('#modifiersCartContainerID').empty();

  if (item.inputType === 'radio' && item.isChildoption) {
    // check for child option
    const ids = selectedOptions.map((item) => item.id);
    // if (ids.includes(item.group_id)) {
    //   Object.assign(item, {
    //     addItem: true,
    //   });
    // }
    if ($(`#option_${item.item_id}`).is(':visible')) {
      Object.assign(item, {
        addItem: true,
      });
    }
  } else {
    if ($(`#option_${item.item_id}`).is(':visible')) {
      Object.assign(item, {
        addItem: true,
      });
    }

    if (item.type === 0 && item.enableForPrint) {
      printOnKOTAndBill[`item_${item.group_id}`] = {
        title: item.title,
        qty: item.qty,
        alternative_title: item.alternative_title,
      };
    } else if (item.enableForPrint) {
      printOnKOTAndBill[`item_${item.item_id}`] = {
        title: item.title,
        qty: item.qty,
        alternative_title: item.alternative_title,
      };
    }
  }
  // check multiprcing
  const activeTab = $('.mainsectionTabs li a.active').attr('id');
  if (activeTab) {
    Object.assign(item, {
      item_refid: item.item_id,
    });
    switch (activeTab) {
      case DINEIN_TAB_ID:
        const newitem = checkforMultipricingbydept(item, tableDeptId, true);
        if (newitem.data) {
          item = newitem.data;
        }
        break;
      default:
        const new_item = checkforMultipricing(item, orderType, true);
        if (new_item.data) {
          item = new_item.data;
        }
        break;
    }
  }
  if (item.inputType === 'radio' && !item.isChildoption) {
    Object.assign(item, {
      addItem: true,
    });
    $(`#optionGroup_title_${item.option_group_id}`).show();
  }
  if (item.inputType === 'radio' && item.addItem) {
    const itemIndex = selectedOptions.findIndex(
      (i) => i.group_id === item.group_id,
    );
    // item.qty = 1;
    item.qty = item.defaultQty ? item.defaultQty : 1;
    if (itemIndex === -1) {
      selectedOptions.push(item);
    } else {
      selectedOptions.splice(itemIndex, 1);
      selectedOptions.splice(itemIndex, 0, item);
    }
    $(`#optionGroup_title_${item.option_group_id}`).show();
  }

  if (item.inputType === 'checkbox' && item.addItem) {
    const itemIndex = selectedOptions.findIndex(
      (i) => i.item_id === item.item_id && i.group_id === item.group_id,
    );

    if (
      $(`#optionGroup_${item.group_id} #option_${item.item_id}`).is(':visible')
    ) {
      if (itemIndex === -1) {
        item.qty = item.defaultQty ? item.defaultQty : 1;

        // if we edit modifier item added in kot then set selected qty not default qty
        if (item.editItemquantity) item.qty = item.editItemquantity;
        selectedOptions.push(item);
      } else {
        const existItem = selectedOptions[itemIndex];
        // existItem.qty += 1;
        existItem.qty = 1;
      }
    }

    // if (item.free) {
    //   item.qty = item.free;
    // }
    $(`#optionGroup_title_${item.option_group_id}`).show();
  }

  if (item.type === 0) {
    varientQtySelectedForGroup[item.group_id] = {
      qty: item.defaultQty || 1,
    };
    if (
      item.option_group_level_min !== 0 &&
      varientQtySelectedForGroup[item.group_id].qty >=
        item.option_group_level_min
    ) {
      $(`#optionGroup_title_${item.group_id}`)
        .removeClass('danger-group-title')
        .addClass('success-group-title');
    }
  } else {
    if (item.default_selected) {
      addonQtySelectedForGroup[item.group_id] = {
        qty:
          (addonQtySelectedForGroup[item.group_id]?.qty || 0) +
            item.defaultQty || 1,
      };
    } else {
      addonQtySelectedForGroup[item.group_id] = {
        qty:
          (addonQtySelectedForGroup[item.group_id]?.qty || 0) + item.qty || 1,
      };
    }
    if (
      item.option_group_level_min !== 0 &&
      addonQtySelectedForGroup[item.group_id].qty >= item.option_group_level_min
    ) {
      $(`#optionGroup_title_${item.group_id}`)
        .removeClass('danger-group-title')
        .addClass('success-group-title');
    }
  }

  item[`qtySelectedForGroup_${item.group_id}`] =
    (item[`qtySelectedForGroup_${item.group_id}`] || 0) + item.defaultQty || 1;
  // if (
  //   item.option_group_level_min !== 0 &&
  //   item[`qtySelectedForGroup_${item.group_id}`] >= item.option_group_level_min
  // ) {
  //   $(`#optionGroup_title_${item.group_id}`)
  //     .removeClass('danger-group-title')
  //     .addClass('success-group-title');
  // }
  renderSelectedOptions();
}

async function addDefaultItemsInCart() {
  // show child option groups
  $('#modifiersCartContainerID').empty();

  const allDefaultActiveElements = $(
    '.card-custom-body .defaultSelected:visible',
  );
  allDefaultActiveElements.each(async (index, element) => {
    const { data } = $(element)[0];
    data.qty = data.defaultQty ? data.defaultQty : 0;
    renderDefaultSelectedItems(data);
    const childOptions = [];
    if (
      data &&
      data.default_selected &&
      data.optionGroups &&
      data.optionGroups.length
    ) {
      for (let i = 0; i < data.optionGroups.length; i++) {
        for (let j = 0; j < data.optionGroups[i].option_list.length; j++) {
          if (data.optionGroups[i].option_list[j].default_selected) {
            if (
              data.optionGroups[i].option_list[j].variants &&
              data.optionGroups[i].option_list[j].variants
            ) {
              data.optionGroups[i].option_list[j].variants.forEach(
                (varient) => {
                  if (varient.default_selected) {
                    Object.assign(data.optionGroups[i].option_list[j], {
                      title: varient.title,
                      price: varient.price,
                    });
                  }
                },
              );
            }
            $(
              `#optionGroup_${data.optionGroups[i].option_list[j].group_id}`,
            ).show();
            childOptions.push(data.optionGroups[i].option_list[j]);
            data.optionGroups[i].option_list[j].qty = data.optionGroups[i]
              .option_list[j].defaultQty
              ? data.optionGroups[i].option_list[j].defaultQty
              : 0;
            renderDefaultSelectedItems(data.optionGroups[i].option_list[j]);
          }
        }
      }
    }

    if (data.type === 0 && data.parentBaseItem) {
      defaultVariantlist = {};
      defaultVariantlist[`item_${data.item_id}`] = {
        title: data.title,
        qty: data.qty,
        alternative_title: data.alternative_title,
      };
    }

    if (data.type === 0 && data.enableForPrint) {
      printOnKOTAndBill[`item_${data.group_id}`] = {
        // data.item_id
        title: data.title,
        qty: data.qty,
        alternative_title: data.alternative_title,
      };
    } else if (data.enableForPrint) {
      printOnKOTAndBill[`item_${data.item_id}`] = {
        title: data.title,
        qty: data.qty,
        alternative_title: data.alternative_title,
      };
    }
  });
}

async function addSelectedItemsInCart(addons) {
  // show child option groups
  $('#modifiersCartContainerID').empty();

  // const allDefaultActiveElements = $(
  //   '.card-custom-body .defaultSelected:visible',
  // );
  $(`.modifierCardConatiner button`)
    .removeClass('active')
    .css({ 'background-color': 'rgba(219, 209, 209, 0.822)' });

  $(`.addonQtyClass`).text('');
  $('.decrementQtyClass ').hide();
  const optionRefIds = addons.map((item) => item.option_ref_id);
  addons.forEach(async (addon) => {
    const element = $(
      `#optionGroup_${addon.opt_grp_ref_ids} #option_${addon.option_ref_id}`,
    );
    const { data } = element[0];
    // data.qty = addon.quantity ? addon.quantity : 0;
    // data.quantity = addon.quantity ? addon.quantity : 0;
    data.editItemquantity = addon.quantity ? addon.quantity : 0;
    data.title = addon.title;
    data.alternative_title = addon.alternative_title;
    const item = data;
    if (item.type === 0) {
      // varient
      $(`#optionGroup_${item.group_id} #decrementQty_${item.item_id}`).show();
      $(`#optionGroup_${item.group_id} #option_${item.item_id}`).css({
        'background-color': 'rgb(255 45 45 / 75%)',
      });
      $(`#optionGroup_${item.group_id} #addonQty_${item.item_id}`).text(
        addon.editItemquantity ? item.editItemquantity : '',
      );

      setTimeout(() => {
        $(`#optionGroup_${item.group_id} #decrementQty_${item.item_id}`).show();
        $(`#optionGroup_${item.group_id} #option_${item.item_id}`).css({
          'background-color': 'rgb(255 45 45 / 75%)',
        });
        $(`#optionGroup_${item.group_id} #addonQty_${item.item_id}`).text(
          item.editItemquantity ? item.editItemquantity : '',
        );
      }, 50);
    } else {
      $(`#optionGroup_${item.group_id} #option_${item.item_id}`).css({
        'background-color': 'rgb(134 240 140 / 75%)',
      });
      $(`#optionGroup_${item.group_id} #decrementQty_${item.item_id}`).show();
      $(`#optionGroup_${item.group_id} #addonQty_${item.item_id}`).text(
        item.editItemquantity ? item.editItemquantity : 1,
      );
    }
    renderDefaultSelectedItems(data);
    const childOptions = [];
    if (data && data.optionGroups && data.optionGroups.length) {
      for (let i = 0; i < data.optionGroups.length; i++) {
        for (let j = 0; j < data.optionGroups[i].option_list.length; j++) {
          if (
            optionRefIds.includes(
              Number(data.optionGroups[i].option_list[j].item_id),
            )
          ) {
            if (
              data.optionGroups[i].option_list[j].variants &&
              data.optionGroups[i].option_list[j].variants
            ) {
              data.optionGroups[i].option_list[j].variants.forEach(
                (varient) => {
                  if (varient.default_selected) {
                    Object.assign(data.optionGroups[i].option_list[j], {
                      title: varient.title,
                      price: varient.price,
                    });
                  }
                },
              );
            }
            $(
              `#optionGroup_${data.optionGroups[i].option_list[j].group_id}`,
            ).show();
            childOptions.push(data.optionGroups[i].option_list[j]);
            data.optionGroups[i].option_list[j].qty = data.optionGroups[i]
              .option_list[j].qty
              ? data.optionGroups[i].option_list[j].qty
              : 0;
            data.optionGroups[i].option_list[j].editItemquantity =
              data.optionGroups[i].option_list[j].qty;
            renderDefaultSelectedItems(data.optionGroups[i].option_list[j]);
          }
        }
      }
    }

    if (data.type === 0 && data.parentBaseItem) {
      defaultVariantlist = {};
      defaultVariantlist[`item_${data.item_id}`] = {
        title: data.title,
        qty: data.qty,
        alternative_title: data.alternative_title,
      };
    }
    if (data.type === 0 && data.enableForPrint) {
      printOnKOTAndBill[`item_${data.group_id}`] = {
        title: data.title,
        qty: data.qty,
        alternative_title: data.alternative_title,
      };
    } else if (data.enableForPrint) {
      printOnKOTAndBill[`item_${data.item_id}`] = {
        title: data.title,
        qty: data.qty,
        alternative_title: data.alternative_title,
      };
    }
  });
}

async function addDefaultNotForNestedItemInCart(item) {
  // show child option groups
  $('#modifiersCartContainerID').empty();
  const allDefaultActiveElements = $(
    '.card-custom-body .defaultSelected:visible',
  );
  // ONLY reset UI for groups NOT already selected
  $(`.modifierCardConatiner button`).each(function () {
    const btnData = this.data;
    if (!btnData) return;

    const exists = selectedOptions.some(
      (i) => i.item_id === btnData.item_id && i.group_id === btnData.group_id,
    );

    if (!exists) {
      $(this).css('background-color', 'rgba(219, 209, 209, 0.822)');
      $(`#addonQty_${btnData.item_id}`).text('');
      $(`#decrementQty_${btnData.item_id}`).hide();
    }
  });

  allDefaultActiveElements.each(async (index, element) => {
    const { data } = $(element)[0];
    let assigned_groups = [];
    if (item.assigned_groups && item.assigned_groups.length) {
      assigned_groups = item.assigned_groups.split(',');
    }
    if (
      data.group_id !== item?.group_id &&
      assigned_groups.includes(String(data.group_id))
    ) {
      data.qty = 0;
      data[`qtySelectedForGroup_${data.group_id}`] = 0;
      renderDefaultSelectedItems(data);
      const childOptions = [];

      if (data.type === 0) {
        // varient
        // $(`#optionGroup_${data.group_id} .addonQtyClass`).text('');
        // $(`#optionGroup_${data.group_id} .decrementQtyClass`).hide();
        // $(`#optionGroup_${data.group_id} button`).css(
        //   'background-color',
        //   'rgba(219, 209, 209, 0.822)',
        // );

        $(`#option_${data.item_id}`).css(
          'background-color',
          'rgb(255 45 45 / 75%)',
        );
      } else {
        $(`#option_${data.item_id}`).css(
          'background-color',
          'rgb(134 240 140 / 75%)',
        );
      }
      if (data && data.default_selected) {
        // if item is edit item then it should show previously selected quantites
        let quantites = data.defaultQty;
        if (data.quantity) {
          quantites = data.quantity;
        }
        $(`#addonQty_${data.item_id}`).text(quantites || 1);
        $(`#decrementQty_${data.item_id}`).show();
      }
      if (
        data &&
        data.default_selected &&
        data.optionGroups &&
        data.optionGroups.length
      ) {
        for (let i = 0; i < data.optionGroups.length; i++) {
          for (let j = 0; j < data.optionGroups[i].option_list.length; j++) {
            if (data.optionGroups[i].option_list[j].default_selected) {
              if (
                data.optionGroups[i].option_list[j].variants &&
                data.optionGroups[i].option_list[j].variants
              ) {
                data.optionGroups[i].option_list[j].variants.forEach(
                  (varient) => {
                    if (varient.default_selected) {
                      Object.assign(data.optionGroups[i].option_list[j], {
                        title: varient.title,
                        price: varient.price,
                      });
                    }
                  },
                );
              }
              $(
                `#optionGroup_${data.optionGroups[i].option_list[j].group_id}`,
              ).show();
              childOptions.push(data.optionGroups[i].option_list[j]);
              data.optionGroups[i].option_list[j].qty = data.optionGroups[i]
                .option_list[j].defaultQty
                ? data.optionGroups[i].option_list[j].defaultQty
                : 0;
              renderDefaultSelectedItems(data.optionGroups[i].option_list[j]);
              if (data.optionGroups[i].option_list[j].type === 0) {
                // );

                $(`#option_${data.optionGroups[i].option_list[j].item_id}`).css(
                  'background-color',
                  'rgb(255 45 45 / 75%)',
                );
              } else {
                $(`#option_${data.optionGroups[i].option_list[j].item_id}`).css(
                  'background-color',
                  'rgb(134 240 140 / 75%)',
                );
              }
              $(
                `#addonQty_${data.optionGroups[i].option_list[j].item_id}`,
              ).text(data.optionGroups[i].option_list[j].defaultQty || 1);
              $(
                `#decrementQty_${data.optionGroups[i].option_list[j].item_id}`,
              ).show();
            }
          }
        }
      }
    }
  });
}

async function addDefaultItemsForVarientInCart(item) {
  // show child option groups
  $('#modifiersCartContainerID').empty();

  const assignedGroups = item.assigned_groups.split(',');

  const allDefaultActiveElements = $('.card-custom-body .defaultSelected');
  allDefaultActiveElements.each(async (index, element) => {
    const { data } = $(element)[0];
    data.qty = 0;
    if (assignedGroups.includes(String(data.group_id))) {
      renderDefaultSelectedItems(data);
      const childOptions = [];
      if (data && data.default_selected) {
        $(`#addonQty_${data.item_id}`).text(1);
        $(`#decrementQty_${data.item_id}`).show();
      }
      if (
        data &&
        data.default_selected &&
        data.optionGroups &&
        data.optionGroups.length
      ) {
        for (let i = 0; i < data.optionGroups.length; i++) {
          for (let j = 0; j < data.optionGroups[i].option_list.length; j++) {
            if (data.optionGroups[i].option_list[j].default_selected) {
              if (
                data.optionGroups[i].option_list[j].variants &&
                data.optionGroups[i].option_list[j].variants
              ) {
                data.optionGroups[i].option_list[j].variants.forEach(
                  (varient) => {
                    if (varient.default_selected) {
                      Object.assign(data.optionGroups[i].option_list[j], {
                        title: varient.title,
                        price: varient.price,
                      });
                    }
                  },
                );
              }
              $(
                `#optionGroup_${data.optionGroups[i].option_list[j].group_id}`,
              ).show();
              childOptions.push(data.optionGroups[i].option_list[j]);
              data.optionGroups[i].option_list[j].qty = 0;
              renderDefaultSelectedItems(data.optionGroups[i].option_list[j]);
            }
          }
        }
      }
    }
  });
}
function addBaseItemDetails() {
  $('#baseItemDetailContainerID').empty();
  let baseitemTitle = currentclickedItem.data.title;
  // if (currentclickedItem.data.title.includes('option::')) {
  //   const result = currentclickedItem.data.title
  //     .substring(0, currentclickedItem.data.title.indexOf('option::'))
  //     .trim();
  //   baseitemTitle = result;
  // }
  if (
    currentclickedItem.data &&
    currentclickedItem.data.extra_details &&
    currentclickedItem.data.extra_details.baseTitle
  ) {
    baseitemTitle = currentclickedItem.data.extra_details.baseTitle;
    Object.assign(currentclickedItem.data, {
      title: currentclickedItem.data.extra_details.baseTitle,
    });
  }

  if (currentclickedItem.data && currentclickedItem.data.newopenitemName) {
    baseitemTitle = currentclickedItem.data.newopenitemName;
    Object.assign(currentclickedItem.data, {
      title: currentclickedItem.data.newopenitemName,
    });
  }
  if (
    window.selectedLanguage !== 'en' &&
    currentclickedItem.data.alternative_title
  ) {
    baseitemTitle = currentclickedItem.data.alternative_title;
  }
  const itemTitle = $('<div>', {
    text: baseitemTitle,
    id: 'baseItemTitleid',
  });

  // if item having discount and we selected any addons then next time while adding item sale price showing previously added sale price(itemm price + addon)
  if (currentclickedItem.data.original_sale_price) {
    currentclickedItem.data.sale_price =
      currentclickedItem.data.original_sale_price;
  }
  const itemPrcie = $('<div>', {
    text: `${window.storeDetails.currency} ${String(currentclickedItem.data.sale_price) || currentclickedItem.data.original_sale_price}`,
    id: 'baseItemPrice',
  });

  $('#baseItemDetailContainerID').append(itemTitle);
  $('#baseItemDetailContainerID').append(itemPrcie);

  if (currentclickedItem.data?.description) {
    const itemDescription = $('<div>', {
      text: currentclickedItem.data.description,
      id: 'baseItemDescriptionId',
      title: currentclickedItem.data.description,
    });

    $('#baseItemDetailContainerID').append(itemDescription);
  }
}

async function initgetItemModifiersRequest({
  item_refid,
  currentclickedItem: currentclickedItemFromOrderWindow,
  dept_id,
  order_type,
}) {
  if (item_refid) {
    const data = await makeGetItemModifiersRequest({ item_refid });
    // const isVarientAvailable = data.optionGroups.find((og) => og.type === 0);

    itemrefid = item_refid;
    currentclickedItem.data = cloneDeep(currentclickedItemFromOrderWindow.data);
    currentClickedItemwithoutclone = currentclickedItemFromOrderWindow.data;

    //  the base item price is set to 0, and only the addons have prices. For the first order, the amount is calculated correctly. However, from the second order onwards, the system is taking the previous order’s amount and keeps adding it incorrectly.
    // if (currentclickedItem.data.pricebeforeDiscount) {
    //   currentclickedItem.data.sale_price =
    //     currentclickedItem.data.pricebeforeDiscount;
    //   currentclickedItem.data.item_price =
    //     currentclickedItem.data.pricebeforeDiscount;
    // }
    if (currentclickedItem.data.original_sale_price) {
      currentclickedItem.data.sale_price =
        currentclickedItem.data.original_sale_price;
      currentclickedItem.data.pricebeforeDiscount =
        currentclickedItem.data.original_sale_price;
      currentclickedItem.data.item_price =
        currentclickedItem.data.original_sale_price;
      currentclickedItem.data.pricebeforeDiscount =
        currentclickedItem.data.original_pricebeforeDiscount;
    }
    let itemTitle = currentclickedItem.data.title;
    tableDeptId = dept_id;
    orderType = order_type;
    editItem = false;
    option_group_index = 1;
    // if (currentclickedItem.data.title.includes('option::')) {
    //   const result = currentclickedItem.data.title
    //     .substring(0, currentclickedItem.data.title.indexOf('option::'))
    //     .trim();
    //   itemTitle = result;
    // }

    if (data && data.optionGroups && !data.optionGroups.length) {
      addModifierToOrder();
      return;
    }

    // if (!isVarientAvailable) {
    //   selectedOptions = [];
    //   validateOptions = [];
    //   // cancelledAddonslist = {};
    //   defaultVariantlist = {};
    //   defaultDeselected = {};
    //   otherSelectedlist = {};
    //   printOnKOTAndBill = {};
    //   printOnKOTAndBillDefaultDeselected = {};
    //   varientQtySelectedForGroup = {};
    //   addonQtySelectedForGroup = {};
    //   defaultSelectedAddons = true;
    //   let proceedAddItem = true;
    //   const proceedAddItemCheckForAllGroup = [];
    //   data.optionGroups.forEach((optionGroup) => {
    //     // check min selection on group level
    //     const minSelection = optionGroup.min;
    //     let defaultSelected = 0;
    //     if (minSelection) {
    //       proceedAddItem = false;
    //     }
    //     optionGroup.option_list.forEach((option) => {
    //       // if default selected options matches min selection then go ahead
    //       if (option.default_selected) {
    //         defaultSelected += option.defaultQty;
    //         if (option.type === 0 && option.enableForPrint) {
    //           printOnKOTAndBill[option.group_id] = {
    //             title: option.title,
    //             qty: option.qty,
    //             alternative_title: option.alternative_title,
    //           };
    //         } else if (option.enableForPrint) {
    //           printOnKOTAndBill[option.item_id] = {
    //             title: option.title,
    //             qty: option.qty,
    //             alternative_title: option.alternative_title,
    //           };
    //         }
    //         selectedOptions.push(option);
    //       }
    //     });
    //     if (defaultSelected < minSelection) {
    //       proceedAddItemCheckForAllGroup.push(false);
    //     }
    //     if (defaultSelected >= minSelection) {
    //       proceedAddItem = true;
    //     }
    //   });
    //   if (proceedAddItem && !proceedAddItemCheckForAllGroup.includes(false)) {
    //     addModifierToOrder();
    //     return;
    //   }
    // }
    if (
      currentclickedItem.data &&
      currentclickedItem.data.extra_details &&
      currentclickedItem.data.extra_details.baseTitle
    ) {
      itemTitle = currentclickedItem.data.extra_details.baseTitle;
    }

    if (
      window.selectedLanguage !== 'en' &&
      currentclickedItem.data.alternative_title
    ) {
      itemTitle = currentclickedItem.data.alternative_title;
    }
    $('#itemModifierBaseitemtitleid').html(itemTitle);
    if (data) {
      await showItemModifiers();
      // await sleep(50);
      // if (!window.customerItemModifiersscriptLoaded) {
      //   await sleep(800);
      // }
      item_index = 0;
      data.optionGroups.forEach((optionGroup) => {
        addModifierItemsToView({ optionGroup });
      });
      addBaseItemDetails();
      await sleep(200);
      addDefaultItemsInCart();
      // initialize();
    }
  }
}

async function openSelectedAddons({
  item_refid,
  data: currentclickedItemFromOrderWindow,
  dept_id,
  order_type,
}) {
  if (item_refid) {
    const data = await makeGetItemModifiersRequest({ item_refid });
    itemrefid = item_refid;
    currentclickedItem.data = cloneDeep(currentclickedItemFromOrderWindow);
    currentClickedItemwithoutclone = currentclickedItemFromOrderWindow;

    if (currentclickedItem.data.original_sale_price) {
      currentclickedItem.data.sale_price =
        currentclickedItem.data.original_sale_price;
      currentclickedItem.data.item_price =
        currentclickedItem.data.original_sale_price;
      currentclickedItem.data.pricebeforeDiscount =
        currentclickedItem.data.original_pricebeforeDiscount;
    }
    let itemTitle = currentclickedItem.data.title;
    tableDeptId = dept_id;
    orderType = order_type;
    editItem = true;
    option_group_index = 1;
    if (currentclickedItemFromOrderWindow.itemQty) {
      currentClickedItemwithoutclone.quantity =
        currentclickedItemFromOrderWindow.itemQty;
      currentclickedItem.data.quantity =
        currentclickedItemFromOrderWindow.itemQty;
    }
    if (
      currentclickedItem.data &&
      currentclickedItem.data.extra_details &&
      currentclickedItem.data.extra_details.baseTitle
    ) {
      itemTitle = currentclickedItem.data.extra_details.baseTitle;
    }

    if (
      window.selectedLanguage !== 'en' &&
      currentclickedItem.data.alternative_title
    ) {
      itemTitle = currentclickedItem.data.alternative_title;
    }
    $('#itemModifierBaseitemtitleid').html(itemTitle);
    if (data) {
      await showItemModifiers();
      // await sleep(50);
      // if (!window.customerItemModifiersscriptLoaded) {
      //   await sleep(400);
      // }
      item_index = 0;
      data.optionGroups.forEach((optionGroup) => {
        addModifierItemsToView({ optionGroup, editSelecteitem: true });
      });
      addBaseItemDetails();
      await sleep(200);
      addSelectedItemsInCart(currentclickedItem.data.addons);
      // initialize();
    }
  }
}

async function checkforOptionValidation() {
  let validated = true;
  validateOptions.forEach((option) => {
    const isOptionGroupVisible = $(`#optionGroup_${option.option_group_id}`).is(
      ':visible',
    );
    if (isOptionGroupVisible) {
      // const item = selectedOptions.find(
      //   (i) => i.option_group_id === option.option_group_id,
      // );
      const varientQty =
        varientQtySelectedForGroup[option.option_group_id]?.qty;
      const addonQty = addonQtySelectedForGroup[option.option_group_id]?.qty;
      const totalQty = varientQty || 0 + addonQty || 0;
      if (totalQty < option.min) {
        window.notifyUser.showMessage(
          'error',
          `Select at least ${option.min} option from ${option.option_group_name}`,
        );
        validated = false;
      }
    }
  });
  return validated;
}

function getNewitemnamefromoptions(baseTitle, optionTitles) {
  let newTitle = baseTitle;
  if (optionTitles && optionTitles.length > 0) {
    // newTitle = `${baseTitle} option::\n(${[
    newTitle = `${baseTitle} \n(${[
      optionTitles.slice(0, -1).join(', '),
      optionTitles.slice(-1)[0],
    ].join(optionTitles.length < 2 ? '' : ' and ')})`;
  }
  return newTitle;
}

async function addModifierToOrder() {
  const validate = await checkforOptionValidation();
  if (!validate) {
    return;
  }
  const itemData = currentclickedItem.data;
  const itemDataWithoutclone = currentClickedItemwithoutclone;
  const addons = [];
  const pricestoAdd = [];
  const namesMap = [];
  let totalAmount = 0;
  let selectedtaxTotal = 0;
  let requiredFound = false;
  const option_ref_id = window.uniqid.time();
  let newitemName = itemData.title;
  itemData.option_price =
    currentclickedItem.data.original_sale_price ||
    currentclickedItem.data.sale_price ||
    0;

  // if edit item after adding into kot and deselected all addons and adding only base item then price not getting proper
  if (itemData.discounted_price) {
    itemData.discounted_price =
      currentclickedItem.data.original_sale_price ||
      currentclickedItem.data.sale_price;
  }

  // if (
  //   currentclickedItem.data &&
  //   currentclickedItem.data.extra_details &&
  //   currentclickedItem.data.extra_details.baseTitle
  // ) {
  //   newitemName = currentclickedItem.data.extra_details.baseTitle;
  // }

  let totoalOptionsAmount = 0;
  const totalAddonsAmount = 0;

  if (selectedOptions && selectedOptions.length) {
    itemData.option_price =
      currentclickedItem.data.sale_price ||
      currentclickedItem.data.original_sale_price ||
      0;
    itemData.original_sale_price =
      currentclickedItem.data.sale_price ||
      currentclickedItem.data.original_sale_price ||
      0;

    itemData.original_pricebeforeDiscount =
      currentclickedItem.data.pricebeforeDiscount ||
      currentclickedItem.data.original_sale_price ||
      0;

    Object.assign(itemDataWithoutclone, {
      original_pricebeforeDiscount: itemData.pricebeforeDiscount,
    });
    selectedOptions.forEach((item) => {
      const total = item.price * item.qty;
      totalAmount += total;

      if (item.free) {
        totalAmount -= item.free * item.price;
      }

      const extra_details = {
        freeQty: item.free,
        modifiers: 1,
        short_code: item.short_code,
        sku: item.sku,
        alternative_title: item.alternative_title,
      };
      const option = {
        item_id: item.item_id,
        optionGrptitle: item.option_group_name,
        opt_grp_ref_ids: item.group_id,
        ref_id: item.item_id,
        option_ref_id: item.item_id,
        price: Number(item.price).toFixed(window.ROUNDOFF_UPTO),
        qty: item.qty,
        quantity: item.qty,
        rank: item.rank,
        title: item.title,
        option_tax: item.tax_value,
        total,
        total_with_tax: total,
        type: item.type,
        item_ref_id: itemData.item_refid,
        extra_details,
        option_type: item.type,
        alternative_title: item.alternative_title,
      };
      namesMap.push(item.title);
      addons.push(option);

      if (item.type === 0) {
        requiredFound = true;
        // itemData.option_price = item.price;
        totoalOptionsAmount += item.price;

        if (itemData.newopenPrice && option.price === 0) {
          if (itemData.tax_per) {
            option.option_tax =
              (itemData.newopenPrice / 100) * itemData.tax_per;
            option.price = itemData.newopenPrice;
          }
        }

        itemData.option_price = option.price;
        itemData.option_tax = option.option_tax;
        // option.option_type = 0; // option
        itemData.pricebeforeDiscount = item.price;
        itemData.sale_price = item.price;
        selectedtaxTotal += item.option_tax;

        if (!defaultVariantlist[`item_${item.item_id}`]) {
          defaultVariantlist[`item_${item.item_id}`] = {
            title: item.title,
            qty: item.qty,
            alternative_title: item.alternative_title,
          };
        }
      }
      if (item.type === 1) {
        if (itemData.tax_per) {
          option.option_tax = (option.price / 100) * itemData.tax_per;
        }
        if (item.free) {
          const totalamt = item.price * item.qty;
          let totalAmtToAdd = 0;
          if (item.qty < item.free) {
            totalAmtToAdd = 0;
          } else {
            totalAmtToAdd = totalamt - item.price * item.free;
          }
          pricestoAdd.push(totalAmtToAdd);
        } else {
          pricestoAdd.push(item.price * item.qty);
        }

        if (!otherSelectedlist[`item_${item.item_id}`]) {
          otherSelectedlist[`item_${item.item_id}`] = {
            title: item.title,
            qty: item.qty,
            alternative_title: item.alternative_title,
          };
        }
      }
    });
  }
  if (totoalOptionsAmount) {
    itemData.option_price = Number(
      totoalOptionsAmount.toFixed(window.ROUNDOFF_UPTO),
    );
  }

  if (!totoalOptionsAmount && itemData.pricebeforeDiscount) {
    itemData.option_price = Number(
      itemData.pricebeforeDiscount.toFixed(window.ROUNDOFF_UPTO),
    );
  }
  const finalPrice = pricestoAdd.reduce((a, b) => a + b, 0);

  newitemName = getNewitemnamefromoptions(newitemName, namesMap);
  Object.assign(itemData, {
    recalculatedAmount: Number(
      (Number(itemData.option_price) + Number(finalPrice)).toFixed(
        window.ROUNDOFF_UPTO,
      ),
    ),
  });
  if (itemData.tax_per) {
    Object.assign(itemData, {
      recalculatedAmount: Number(
        (Number(itemData.option_price) + Number(finalPrice)).toFixed(
          window.ROUNDOFF_UPTO,
        ),
      ),
      item_tax_per: itemData.tax_per,
      item_is_devidable: itemData.is_devidable,
      item_tax_method: itemData.tax_method,
    });
    selectedtaxTotal = calculateTaxForItem(itemData);
  }

  const extra_details = {
    baseTitle: itemData.title,
    has_modifiers: 1,
    // cancelledAddonslist,
    defaultSelectedAddons,
    // baseTitleWithVarient,
  };

  if (
    window.showDefaultaddonItemOnKotPrint ||
    window.showDefaultaddonItemOnBillPrint ||
    window.showOnlyBaseItemTitleOnBillPrint
  ) {
    Object.assign(extra_details, {
      defaultDeselected,
      defaultVariantlist,
      otherSelectedlist,
    });
  }
  Object.assign(extra_details, {
    printOnKOTAndBill,
    printOnKOTAndBillDefaultDeselected,
  });
  let finalAmount = Number(
    (Number(itemData.option_price) + finalPrice).toFixed(window.ROUNDOFF_UPTO),
  );
  let amountBeforDiscount = Number(itemData.option_price) + finalPrice;
  if (!amountBeforDiscount) {
    amountBeforDiscount = itemData.pricebeforeDiscount;
  }
  let calculateDiscount = false;

  if (
    (selectedOptions && selectedOptions.length) ||
    window.isMultipricingEnabled
  ) {
    calculateDiscount = true;
  }

  if (
    calculateDiscount &&
    itemData.discounted_price &&
    itemData.discount_rate > 0
  ) {
    if (itemData.discount_type === 1) {
      const discountAmt = finalAmount * (itemData.discount_rate / 100);
      finalAmount -= discountAmt;
      finalAmount = Number(finalAmount.toFixed(window.ROUNDOFF_UPTO));
      // totoalOptionsAmount -= discountAmt;
    } else {
      finalAmount -= itemData.discount_rate;
      finalAmount = Number(finalAmount.toFixed(window.ROUNDOFF_UPTO));
      totoalOptionsAmount -= itemData.discount_rate;
    }
    finalAmount = Number(finalAmount.toFixed(window.ROUNDOFF_UPTO));
    itemData.pricebeforeDiscount = amountBeforDiscount;
    itemData.discounted_price = finalAmount;
    itemData.option_price = finalAmount;
    if (itemData.discounted_price) {
      itemData.sale_price = itemData.discounted_price;
      itemData.price = itemData.discounted_price;
      itemData.item_price = itemData.discounted_price;
    }
  }

  Object.assign(itemData, {
    addons,
    amount: Number(
      (Number(itemData.option_price) + Number(finalPrice)).toFixed(
        window.ROUNDOFF_UPTO,
      ),
    ),
    // option_price: totalAmount,
    // pricebeforeDiscount: totalAmount,
    new_item_tax_value: selectedtaxTotal,
    option_price: finalAmount,
    pricebeforeDiscount: Number(
      amountBeforDiscount.toFixed(window.ROUNDOFF_UPTO),
    ),
    isitemwithOption: true,
    titlewithOption: newitemName,
    title: newitemName,
    option_ref_id,
    extra_details,
  });

  Object.assign(itemDataWithoutclone, {
    pricebeforeDiscount: amountBeforDiscount,
    isitemwithOption: true,
    original_sale_price: currentclickedItem.data.original_sale_price,
  });

  if (itemData.discounted_price)
    itemDataWithoutclone.discounted_price = itemData.discounted_price;

  if (selectedOptions.length === 0) {
    Object.assign(itemData, {
      pricebeforeDiscount:
        itemDataWithoutclone.pricebeforeDiscount ||
        itemDataWithoutclone.original_sale_price ||
        itemDataWithoutclone.sale_price,
      option_price:
        itemDataWithoutclone.original_sale_price ||
        itemDataWithoutclone.sale_price,
      amount:
        itemDataWithoutclone.original_sale_price ||
        itemDataWithoutclone.sale_price,
      price:
        itemDataWithoutclone.original_sale_price ||
        itemDataWithoutclone.sale_price,
      isitemwithOption: true,
    });

    if (itemData.discounted_price) {
      itemData.sale_price = itemData.discounted_price;
      itemData.price = itemData.discounted_price;
      itemData.item_price = itemData.discounted_price;
      itemData.option_price = itemData.discounted_price;
      itemData.amount = itemData.discounted_price;
    }
  }
  $('#itemModifiersModal').modal('hide');
  const activeTab = $('.mainsectionTabs li a.active').attr('id');
  if (activeTab) {
    switch (activeTab) {
      case DINEIN_TAB_ID:
        // if we are editing added kot item then remove this item from kot items so it will add again
        if (editItem) {
          window.putproductinDinein(currentclickedItem, itemDataWithoutclone);
        } else {
          window.putproductinDinein(currentclickedItem);
        }
        break;
      case TAKEAWAY_TAB_ID:
        if (editItem) {
          window.putproductinTakeaway(currentclickedItem, itemDataWithoutclone);
        } else {
          window.putproductinTakeaway(currentclickedItem);
        }
        break;
      case DELIVERY_TAB_ID:
        if (editItem) {
          window.putproductinDelivery(currentclickedItem, itemDataWithoutclone);
        } else {
          window.putproductinDelivery(currentclickedItem);
        }
        break;
      case QUICK_TAB_ID:
        if (editItem) {
          window.putproductinQuickbill(
            currentclickedItem,
            itemDataWithoutclone,
          );
        } else {
          window.putproductinQuickbill(currentclickedItem);
        }
        break;
      default:
        break;
    }
  }
}

async function resetModifiers() {
  const data = await makeGetItemModifiersRequest({ item_refid: itemrefid });
  option_group_index = 1;
  if (data) {
    // showItemModifiers();
    $('#modifierGroupsContainerId').empty();
    $('#modifiersContainerId').empty();
    $('#modifiersCartContainerID').empty();
    modifierGroupsId = [];
    selectedOptions = [];
    validateOptions = [];
    // cancelledAddonslist = {};
    defaultVariantlist = {};
    defaultDeselected = {};
    otherSelectedlist = {};
    printOnKOTAndBill = {};
    printOnKOTAndBillDefaultDeselected = {};
    varientQtySelectedForGroup = {};
    addonQtySelectedForGroup = {};
    defaultSelectedAddons = true;
    item_index = 0;
    data.optionGroups.forEach((optionGroup) => {
      addModifierItemsToView({ optionGroup });
    });
    addBaseItemDetails();
    await sleep(20);
    addDefaultItemsInCart();
    // initialize();
  }
}

$('#itemModifiersModal').on('shown.bs.modal', (e) => {
  $('#addModifierToCartButtonId').unbind();
  $('#resetModifierCartButtonId').unbind();
  $('#CloseModifierModalButtonId').unbind();

  initialize();
});

$('#itemModifiersModal').on('hidden.bs.modal', (e) => {
  $('#modifierGroupsContainerId').empty();
  $('#modifiersContainerId').empty();
  $('#modifiersCartContainerID').empty();
  $('#modifierTotalQuantity').text('');
  $('#modifierTotalAmount').text('');
  modifierGroupsId = [];
  selectedOptions = [];
  validateOptions = [];
  // cancelledAddonslist = {};
  defaultVariantlist = {};
  defaultDeselected = {};
  otherSelectedlist = {};
  printOnKOTAndBill = {};
  printOnKOTAndBillDefaultDeselected = {};
  varientQtySelectedForGroup = {};
  addonQtySelectedForGroup = {};
  defaultSelectedAddons = true;
});

function initialize() {
  $('#addModifierToCartButtonId').on(
    'click',
    debounce(() => {
      addModifierToOrder();
    }, 300),
  );

  $('#resetModifierCartButtonId').on('click', async () => {
    selectedOptions = [];
    validateOptions = [];
    // cancelledAddonslist = {};
    defaultVariantlist = {};
    defaultDeselected = {};
    otherSelectedlist = {};
    printOnKOTAndBill = {};
    printOnKOTAndBillDefaultDeselected = {};
    varientQtySelectedForGroup = {};
    addonQtySelectedForGroup = {};
    defaultSelectedAddons = true;
    // addDefaultItemsInCart();
    resetModifiers();
  });

  $('#CloseModifierModalButtonId').on('click', () => {
    $('#itemModifiersModal').modal('hide');
  });
  $('#modifiersContainerId').scrollTop(0);
  initalizei18nforItemModifier();
}

setTimeout(() => {
  initialize();
}, 400);

module.exports = {
  initgetItemModifiersRequest,
  openSelectedAddons,
};
