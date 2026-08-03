const { initializei18nforSplitbillctrlwindowui } = require('./i18nController');

window.splitbillscriptLoaded = true;
let currentsplitItemslist = [];

let createdParts = [];
function initialize() {
  $('#restart-newsplitpercent-input-id').on('click', restartPercentagesplit);
  $('#add-newsplitpercent-input-id').on('click', addPercentinput);
  $('#createItemspartbutton').on('click', async function () {
    if (currentsplitItemslist.length == 0) {
      window.notifyUser.showMessage(
        'success',
        $.i18n.t('controller:splitbillnotiifcation.Youcannowsplitthebill'),
      );
      return;
    }
    if (createdParts.length > 0) {
      let result = await asktochoosePart();
      if (result.value == undefined) {
        filteritemstocreatePart();
      } else {
        additemtoExistingpart(result.value);
      }
    } else {
      filteritemstocreatePart();
    }
  });

  if ($.i18n) {
    initializei18nforSplitbillctrlwindowui();
  } else {
    setTimeout(initializei18nforSplitbillctrlwindowui, 400);
  }
}

async function showSplitbillinformation(currentTable) {
  clearSplititemsdata();
  if (currentTable && currentTable.data && currentTable.data.details) {
    let items = currentTable.data.details.items;

    showSplititems(JSON.parse(JSON.stringify(items)));
  }
}

async function showSplititems(items) {
  $('#split-items-list-id').empty();
  if (items && Array.isArray(items) && items.length > 0) {
    currentsplitItemslist = items;
    items.forEach((element) => {
      let listItem = $('<li>');
      let checkBox = $('<input>', {
        type: 'checkbox',
        class: 'split-item-check',
        // id: element.item_id,
        id: `split_${element.kot_items_id}`,
        data: element,
      });

      let itemTitle = element.title;
      if (window.selectedLanguage !== 'en' && element.alternative_title) {
        itemTitle = element.alternative_title;
      }
      if (element && element.extra_details && element.extra_details.baseTitle) {
        itemTitle = element.extra_details.baseTitle;
        if (window.selectedLanguage !== 'en' && element.alternative_title) {
          itemTitle = element.alternative_title;
        }
      }

      if (element.addons && element.addons.length) {
        element.addons.forEach((addon) => {
          Object.assign(addon, {
            qty: addon.option_qty,
          });
          if (window.selectedLanguage !== 'en' && addon.alternative_title) {
            itemTitle =
              itemTitle +
              '<br>' +
              `${addon.option_qty} x ${addon.alternative_title} `;
          } else {
            itemTitle =
              itemTitle +
              '<br>' +
              `${addon.option_qty} x ${addon.option_name} `;
          }
        });
      }
      let itemName = $('<label>', {
        html: `${itemTitle} - ${element.quantity}`,
        // for: element.item_id,
        for: `split_${element.kot_items_id}`,
      });

      listItem.append(checkBox);
      listItem.append(itemName);
      $('#split-items-list-id').append(listItem);
    });
  }
  // split-items-list-id
}

window.showSplitbillinformation_fromremote = showSplitbillinformation;

function addPercentinput() {
  let childs = $('#split-percentage-content-inputs-id').find('input');
  let nextId = childs.length++;
  let newInput = $('<input>', {
    type: 'number',
    class: 'split-percent-input extra-input',
    min: 1,
    max: 99,
    id: `split-percent-input-${nextId}`,
    placeholder: `Enter percentage ${nextId}`,
  });

  $('#split-percentage-content-inputs-id').append(newInput);
}

async function additemtoExistingpart(listId) {
  if (listId) {
    let data = $(`#${listId}`).data();
    let existingItems = data.selectedItems;
    let checkedItems = $(
      '#split-items-list-id li .split-item-check:checkbox:checked',
    );
    if (checkedItems && checkedItems.length > 0) {
      checkedItems.each((_index, value) => {
        let currentItem = $(value).data();
        if (currentItem) {
          let index = _.findIndex(currentsplitItemslist, {
            item_id: currentItem.item_id,
          });
          if (index >= 0) {
            let newData = currentsplitItemslist[index];
            let qty = Number(newData.quantity);
            if (qty > 1) {
              qty--;
              newData.quantity = qty;
              currentsplitItemslist.splice(
                index,
                1,
                JSON.parse(JSON.stringify(newData)),
              );
              newData.quantity = 1;
            } else if (qty <= 1) {
              currentsplitItemslist.splice(index, 1);
            }

            let existingindex = _.findIndex(existingItems, {
              item_id: currentItem.item_id,
            });
            if (existingindex >= 0) {
              let olditemData = existingItems[existingindex];
              let oldQty = Number(olditemData.quantity);
              oldQty++;
              // oldQty = oldQty + qty;
              olditemData.quantity = oldQty;
              existingItems.splice(existingindex, 1, olditemData);
            } else {
              existingItems.push(JSON.parse(JSON.stringify(newData)));
            }
          }
        }
      });
      showSplititems(currentsplitItemslist);
      createPart(existingItems, listId);
    }
  }
}
async function createPart(selectedItems, islistparentProvided) {
  if (
    selectedItems &&
    Array.isArray(selectedItems) &&
    selectedItems.length > 0
  ) {
    // split-itemwise-splitedparts-id
    let length = createdParts.length;
    length++;

    let listWrapperid = `split-items-part-list-${length}`;
    let list = $('<ul>', {
      class: `split-items-part-list`,
      id: listWrapperid,
    });
    if (islistparentProvided) {
      list = $(`#${islistparentProvided}`);
      $(list).empty();
    }
    $(list).data({ selectedItems });

    selectedItems.forEach((element) => {
      let itemTitle = element.title;
      if (window.selectedLanguage !== 'en' && element.alternative_title) {
        itemTitle = element.alternative_title;
      }

      if (element && element.extra_details && element.extra_details.baseTitle) {
        itemTitle = element.extra_details.baseTitle;
        if (window.selectedLanguage !== 'en' && element.alternative_title) {
          itemTitle = element.alternative_title;
        }
      }

      if (element.addons && element.addons.length) {
        element.addons.forEach((addon) => {
          Object.assign(addon, {
            qty: addon.option_qty,
          });
          if (window.selectedLanguage !== 'en' && addon.alternative_title) {
            itemTitle =
              itemTitle +
              '<br>' +
              `${addon.option_qty} x ${addon.alternative_title} `;
          } else {
            itemTitle =
              itemTitle +
              '<br>' +
              `${addon.option_qty} x ${addon.option_name} `;
          }
        });
      }

      let listItem = $('<li>');
      let itemName = $('<label>', {
        html: `${itemTitle} - ${element.quantity}`,
      });
      let action = $('<i>', {
        class: 'fas fa-times-circle',
      }).on('click', function () {
        removeItemfrompart(this, element);
      });
      listItem.append(itemName);
      listItem.append(action);
      list.append(listItem);
    });

    if (islistparentProvided == undefined) {
      $('#split-itemwise-splitedparts-id').append(list);
      createdParts.push({
        id: listWrapperid,
        part: `Part ${length}`,
      });
    }
  }
}

async function removeItemfrompart(clickedItem, itemDetails) {
  let data = $(clickedItem).closest('ul').data();
  let listWrapperid = $(clickedItem).closest('ul').attr('id');

  if (data && data.selectedItems) {
    let selectedItems = data.selectedItems;
    if (currentsplitItemslist.length == 0) {
      currentsplitItemslist.push(itemDetails);
    } else {
      let index = _.findIndex(currentsplitItemslist, {
        item_id: itemDetails.item_id,
      });
      if (index >= 0) {
        let newData = currentsplitItemslist[index];
        let qty = Number(newData.quantity);
        qty = qty + itemDetails.quantity;
        newData.quantity = qty;
        currentsplitItemslist.splice(
          index,
          1,
          JSON.parse(JSON.stringify(newData)),
        );
      } else {
        currentsplitItemslist.push(itemDetails);
      }
    }
    selectedItems = _.filter(selectedItems, function (n) {
      return Number(n.item_id) != Number(itemDetails.item_id);
    });

    $(clickedItem).closest('ul').data({ selectedItems });

    if (selectedItems.length == 0) {
      $(clickedItem).closest('ul').empty();
      createdParts = _.filter(createdParts, function (o) {
        return o.id != listWrapperid;
      });
      $(`#${listWrapperid}`).remove();
    } else {
      createPart(selectedItems, listWrapperid);
    }

    showSplititems(currentsplitItemslist);
  }
}

async function asktochoosePart() {
  let inputOptions = {};
  createdParts.forEach((element) => {
    inputOptions[element.id] = element.part;
  });

  const result = await Swal.fire({
    title: $.i18n.t('controller:swalDataTranslations.Additemstoexistingpart'),
    input: 'select',
    inputOptions: inputOptions,
    inputPlaceholder: $.i18n.t('controller:swalDataTranslations.Selectapart'),
    showCancelButton: true,
    cancelButtonText: $.i18n.t('controller:swalDataTranslations.Createnewpart'),
  });

  return result;
}

async function filteritemstocreatePart() {
  let checkedItems = $(
    '#split-items-list-id li .split-item-check:checkbox:checked',
  );
  if (checkedItems && checkedItems.length > 0) {
    let selectedItems = [];
    checkedItems.each((_index, value) => {
      let currentItem = $(value).data();
      if (currentItem) {
        let index = _.findIndex(currentsplitItemslist, {
          item_id: currentItem.item_id,
        });
        if (index >= 0) {
          let newData = currentsplitItemslist[index];
          let qty = Number(newData.quantity.toFixed(window.ROUNDOFF_UPTO));
          if (qty > 1) {
            qty--;
            newData.quantity = Number(qty.toFixed(window.ROUNDOFF_UPTO));
            currentsplitItemslist.splice(
              index,
              1,
              JSON.parse(JSON.stringify(newData)),
            );
            newData.quantity = 1;
          } else if (qty <= 1) {
            currentsplitItemslist.splice(index, 1);
          }
          selectedItems.push(newData);
        }
      }
    });
    createPart(selectedItems);
    showSplititems(currentsplitItemslist);
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:splitbillnotiifcation.Pleaseselectsomeitems'),
      0,
    );
  }
}

window.getSplititemparts_fromremote = function () {
  return createdParts;
};

window.doesallitemsSplited = function () {
  return currentsplitItemslist.length == 0;
};

function restartPercentagesplit() {
  $('#split-percentage-content-inputs-id input.extra-input').remove();
  $('#split-percent-input-1').val('');
}

function clearSplititemsdata() {
  $('#split-items-list-id').empty();
  currentsplitItemslist = [];
  createdParts = [];
  $('#split-itemwise-splitedparts-id').empty();
}

window.clearSplititemsdata_fromremote = clearSplititemsdata;

initialize();
