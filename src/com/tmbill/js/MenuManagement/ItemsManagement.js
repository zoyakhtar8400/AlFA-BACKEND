/* eslint-disable camelcase */
const fs = require('fs');
const path = require('path');
const { debounce } = require('lodash');
const { default: Swal } = require('sweetalert2');
const {
  MENU_MANAGEMENT_MESSAGES,
  UPDATE_ITEM_DETAILS_LOCALLY,
  UPDATE_CATEGORY_STATUS,
} = require('../../util/IPC_Messages');
const CatUtil = require('../../util/CategoryUtil');
const { showLoader } = require('../CommonUtils');
const {
  getHeadersformposforrender,
} = require('../../util/MiscServer.renderer');
const { setAccesslevelforitemManangement } = require('../AccesslevelManager');
const { presyncService } = require('../OrderController');
const { initializeMenuManagementPermisions } = require('../PasscodeController');
const { initalizei18nformenuManagement } = require('../i18nController');
const { apiCall } = require('../../services/APIService');

window.itemsManagementWindowloaded = true;

window.allOutletCategories = [];
window.itemManagementWindowLoaded = true;
const itemsbuttonList = [];
let lastselectednodeid = null;
// last trigger time
let lastselecttime = null;
function Initialize() {
  // getMenuData(MENU_MANAGEMENT_MESSAGES.GET_MENUDATA);

  $('#searchByname_item_in_item_management').on(
    'keyup',
    debounce((e) => {
      if (
        $(`#searchByname_item_in_item_management`).val().length > 2 ||
        $(`#searchByname_item_in_item_management`).val().length == 0
      ) {
        search($(`#searchByname_item_in_item_management`).val(), false);
      }
    }, 100),
  );

  $('#searchitembyCode-for-item-management').on(
    'keyup',
    debounce(function () {
      const value = $(this).val().trim();

      if (value.length === 0) {
        search('', false);
        return;
      }

      search(`item_short_code_${value}`, true);
    }, 100),
  );

  $('#gobacktomenumangemtfromitemview').on('click', () => {
    $('#menuManagementwindowWrapperid').show();
    $('#itemsManagementwindowWrapperid').hide();
  });

  $('#addItemInMenuManagement').on('click', () => {
    addNewItem();
  });
  $('#syncButton').on(
    'click',
    debounce(async () => {
      const loadMenuConfirmation = await Swal.fire({
        title: $.i18n.t('controller:orderController.Doyouwanttoloadmenu'),
        showConfirmButton: true,
        showCancelButton: true,
        width: '23em',
        allowOutsideClick: true,
        allowEscapeKey: false,
        confirmButtonText: $.i18n.t('controller:orderController.Yes'),
        cancelButtonText: $.i18n.t('controller:orderController.Cancel'),
        customClass: {
          popup: 'tmbill-swal-pop-up',
          content: 'tmbill-swal-title-class',
          input: 'tmbill-swal-input2',
        },
      });

      if (loadMenuConfirmation && loadMenuConfirmation.isConfirmed) {
        $(`#syncButton`).prop('disabled', true);
        presyncService();
      }
    }, 100),
  );

  $('#filterMenuItemsId').on('change', () => {
    const filter = $('#filterMenuItemsId').val();
    switch (filter) {
      case 'All':
        $(
          '#itemManagementItemviewContainer .item-management-item-card-body',
        ).show();
        break;
      case 'outOfStock':
        $(
          '#itemManagementItemviewContainer .item-management-item-card-body',
        ).hide();
        window.outletAllItemsList.forEach((item) => {
          if (item.current_stock === 0) {
            $(`#Item_management_${item.item_refid}`).show();
          }
        });

        break;
      case 'disabled':
        $(
          '#itemManagementItemviewContainer .item-management-item-card-body',
        ).hide();
        window.outletAllItemsList.forEach((item) => {
          if (item.active === 0) {
            $(`#Item_management_${item.item_refid}`).show();
          }
        });
        break;
    }
  });
  setAccesslevelforitemManangement();
  setTimeout(() => {
    initializeMenuManagementPermisions();
  }, 100);
  if ($.i18n) {
    initalizei18nformenuManagement();
  } else {
    setTimeout(initalizei18nformenuManagement, 400);
  }
}

async function getMenuData(event) {
  Swal.fire({
    title: $.i18n.t('controller:orderController.Fetchingdata'),
    text: $.i18n.t('controller:orderController.Fetchingdatapleasewait'),
    showConfirmButton: false,
    width: '23em',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
      $('#filterMenuItemsId').prop('selectedIndex', 0);
      window.ipcRenderer.send(event, {});
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
  });
}

window.getMenuDataFromRemote = () => {
  getMenuData(MENU_MANAGEMENT_MESSAGES.GET_MENUDATA);
};
function checkifNumber(valuetoTest) {
  return /^\d+$/.test(valuetoTest);
}

async function search(data, byCode) {
  if (data.includes(':')) {
    data = data.split(':')[0];
  }
  let filter;
  filter = data.toLowerCase();
  const myNode = document.getElementById('itemManagementItemviewContainer');
  // let descendents = myNode.getElementsByTagName('*');
  const descendents = myNode.getElementsByClassName('item-title');

  let i;
  let currentDescedent;

  // CHeck if quantity is provided
  const result = filter.split(' ');
  let quantity = 1;
  if (result.length == 2 && checkifNumber(result[1])) {
    quantity = result[1];
    filter = result[0];
  }
  const suffix = data;
  // if (byCode) {
  //   suffix = suffix + filter;
  // }
  let itemFound = false;
  for (i = 0; i < descendents.length; ++i) {
    currentDescedent = descendents[i];
    if (
      currentDescedent != undefined &&
      currentDescedent.innerHTML != undefined
    ) {
      var matches = currentDescedent.innerHTML.match(/\b(\w)/g);
    }
    if (matches) {
      var acronym = matches.join('').toLowerCase();
    }
    if (byCode) {
      if (
        String(currentDescedent.id)
          .toLowerCase()
          .startsWith(String(suffix).toLowerCase()) ||
        !suffix
      ) {
        currentDescedent.parentNode.parentNode.parentNode.parentNode.style.display =
          '';

        itemFound = true;
      } else {
        currentDescedent.parentNode.parentNode.parentNode.parentNode.style.display =
          'none';
      }
    } else if (currentDescedent != undefined) {
      if (
        currentDescedent.innerHTML != undefined &&
        !currentDescedent.innerHTML
          .toLowerCase()
          .trim()
          .includes(filter.trim()) &&
        !acronym.toLowerCase().trim().includes(filter.trim())
      ) {
        currentDescedent.parentNode.parentNode.parentNode.parentNode.style.display =
          'none';
      } else {
        currentDescedent.parentNode.parentNode.parentNode.parentNode.style.display =
          '';
      }
    }
  }

  if (byCode && false) {
    $('#searchitembyCode-for-item-management').val('');
  }
  if (byCode && !itemFound) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.itemCodeDoesNotExists'),
    );
  }
}

/**
 * Init Menu tree
 */
async function initMenutree(categories) {
  $('#itemManagementCategorytree').empty();
  CatUtil.generateTreeviewdataForItemManagement(categories).then((data) => {
    $('#itemManagementCategorytree').treeview({
      data,
      showBorder: true,
      expandIcon: 'fas fa-sort-down',
      collapseIcon: 'fas fa-sort-up',
      onNodeExpanded(event, data) {
        setAccesslevelforitemManangement();
      },
      onNodeCollapsed(event, data) {
        setAccesslevelforitemManangement();
      },
    });

    $('#itemManagementCategorytree').off('nodeUnselected');
    // onNodeUnselected
    $('#itemManagementCategorytree').on('nodeUnselected', (event, data) => {
      event.stopPropagation();
      event.preventDefault();
      clicknode(event, data);
      setAccesslevelforitemManangement();
    });

    $('#itemManagementCategorytree').off('nodeSelected');
    $('#itemManagementCategorytree').on('nodeSelected', (event, data) => {
      event.stopPropagation();
      event.preventDefault();
      categoryNodeclicklistener(data);
      clicknode(event, data);
      setAccesslevelforitemManangement();
      setTimeout(() => {
        initializeMenuManagementPermisions();
      }, 100);
    });

    // $('.category-status-switch').off();
    $('#itemManagementCategorytree').on(
      'click',
      '.category-status-switch',
      function (event) {
        event.stopPropagation(); // Prevent event propagation to parent elements
        event.preventDefault();
        // Your button click handling code here
        if (!navigator.onLine) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:commonUtils.noInternetConnection'),
          );
          return;
        }
        showLoader({
          title: 'Updating category status',
          text: 'Please wait',
        });
        setTimeout(async () => {
          const id = $(this).children().first().attr('id');
          const category_id = id.split('_')[1];
          const is_active = $(this).children().first().is(':checked');
          sendUpdateCategoryRequest({ category_id, is_active: !is_active });
          // let result = await betteripcRenderer.callMain(
          //   UPDATE_CATEGORY_STATUS,
          //   { category_id, is_active },
          // );
          // if (result) {
          //   Swal.close();
          //   ipcRenderer.send(MENU_MANAGEMENT_MESSAGES.GET_MENUDATA, {});
          //   window.refreshOrderWindow = true;
          // }
        }, 50);
      },
    );
  });
}

function clicknode(event, data) {
  if (lastselectednodeid !== undefined && lastselecttime) {
    const time = new Date().getTime();
    const t = time - lastselecttime;
    if (lastselectednodeid == data.nodeId && t < 300) {
      // custombusiness(data);
      if (data.state.expanded) {
        // TODO collapse children
        collapseNode(data.nodeId);
      } else {
        // TODO expand children
        expandNode(data.nodeId);
      }
    }
  }
  lastselectednodeid = data.nodeId;
  lastselecttime = new Date().getTime();
}

function collapseNode(nodeId) {
  $('#itemManagementCategorytree').treeview('collapseNode', [nodeId]);
}

function expandNode(nodeId) {
  $('#itemManagementCategorytree').treeview('expandNode', [nodeId]);
}

async function sendUpdateCategoryRequest({
  category_id: categoryId,
  is_active: isActive,
}) {
  try {
    const categoriesWithParentRefId = window.allOutletCategories.filter(
      (category) => category.parent_ref_id === Number(categoryId),
    );

    const categoryRefIds = categoriesWithParentRefId.map(
      (category) => category.category_refid,
    );

    categoryRefIds.push(categoryId);

    const payload = {
      tmpos_id: window.storeDetails.tmpos_id,
      store_id: window.storeDetails.store_id,
      menu_id: Number(window.menu_id),
      category_ref: categoryRefIds,
      isactive: isActive ? 1 : 0,
    };

    const respone = await apiCall.post(
      window.Config.links.categoryEnableDisable,
      payload,
      {
        headers: getHeadersformposforrender(),
        timeout: 5000,
      },
    );

    if (respone && respone?.data?.status === 200) {
      // Swal.close();
      window.notifyUser.showMessage('success', 'Category status updated');
      const result = await window.betteripcRenderer.callMain(
        UPDATE_CATEGORY_STATUS,
        {
          category_id: categoryRefIds,
          is_active: isActive ? 1 : 0,
        },
      );
      if (result) {
        Swal.close();
        // ipcRenderer.send(MENU_MANAGEMENT_MESSAGES.GET_MENUDATA, {});
        // if(is_active)

        categoryRefIds.forEach((categoryid) => {
          if (isActive) {
            // $(`#itemManagementCategorytree #menuCategroy_${categoryId}`).prop(
            //   'checked',
            //   true,
            // );

            $(`.menu_item_${categoryid}`).prop('checked', true);
          } else {
            $(`.menu_item_${categoryid}`).prop('checked', false);
          }
        });

        categoryRefIds.forEach((categoryid) => {
          const index = window.allOutletCategories.findIndex(
            (category) => category.category_refid === Number(categoryid),
          );
          window.allOutletCategories[index].active = isActive;
          window.allOutletCategories[index].is_active = isActive;
        });

        initMenutree(window.allOutletCategories);

        window.refreshOrderWindow = true;
      }
    }
  } catch (error) {
    Swal.close();
    window.notifyUser.showMessage('error', 'Something went wrong');
  }
}

function categoryNodeclicklistener(data) {
  if (data.tags.length > 0) {
    switch (data.tags[0]) {
      case 'sub-category':
        if (data.tags[1]) {
          filterItems(data.tags[1], 2);
        }
        break;
      case 'category':
        if (data.tags[1]) {
          filterItems(data.tags[1], 1, data.tags[2]);
        }
        break;
      case 'root':
        showAllitems();
        break;
      default:
        showAllitems();
        break;
    }
  }
}

/**
 * Filter the items according to the category clickd
 * @param {CLicked Menu item} clicked_item
 */
async function filterItems(clicked_item, type, subcatIds) {
  if (clicked_item && type) {
    // if bar section is enabled
    let productGroupList;

    if (storeDetails)
      switch (type) {
        case 1:
          if (subcatIds) {
            subcatIds = String(subcatIds).split(',');
            itemsbuttonList.forEach((item, index) => {
              if (
                subcatIds.includes(item.data.category_ref_ids) ||
                item.data.category_ref_ids == clicked_item
              ) {
                $(`#Item_management_${item.data.item_refid}`).show();
              } else {
                $(`#Item_management_${item.data.item_refid}`).hide();
              }
            });
          } else {
            itemsbuttonList.forEach((item, index) => {
              const { data } = item;
              if (data.category_ref_ids == clicked_item) {
                $('#' + `Item_management_${item.data.item_refid}`).show();
              } else {
                $('#' + `Item_management_${item.data.item_refid}`).hide();
              }
            });
          }
          break;
        case 2:
          itemsbuttonList.forEach((item, index) => {
            const { data } = item;
            if (data.category_ref_ids == clicked_item) {
              $('#' + `Item_management_${item.data.item_refid}`).show();
            } else {
              $('#' + `Item_management_${item.data.item_refid}`).hide();
            }
          });
          break;
        default:
          break;
      }
  }
}
function showAllitems() {
  itemsbuttonList.forEach((item, index) => {
    const { data } = item;
    $('#' + `Item_management_${data.item_refid}`).show();
  });
}

async function addNewItem() {
  if (window.isAddOrUpdatewidowLoaded) {
    $('#AddOrUpdateItemmodalBodyid').removeAttr('data');
    $('#AddOrUpdateItemmodal').modal('show');
  } else {
    $('#AddOrUpdateItemManagementmodalBodyid').load(
      'MenuManagement/AddUpdateItem.html',
      async () => {
        $('#AddOrUpdateItemmodalBodyid').removeAttr('data');
        $('#AddOrUpdateItemmodal').modal('show');
      },
    );
  }
}

async function updateItem(item) {
  const itemDeatils = item;
  console.log(
    'window.isAddOrUpdatewidowLoaded::',
    window.isAddOrUpdatewidowLoaded,
  );
  if (window.isAddOrUpdatewidowLoaded) {
    $('#AddOrUpdateItemmodalBodyid').attr('data', JSON.stringify(itemDeatils));
    $('#AddOrUpdateItemmodal').modal('show');
  } else {
    // this code is giving error of blank scrren when opening addedit item modal after pos reload
    $('#AddOrUpdateItemManagementmodalBodyid').load(
      'MenuManagement/AddUpdateItem.html',
      async () => {
        setTimeout(() => {
          $('#AddOrUpdateItemmodalBodyid').attr(
            'data',
            JSON.stringify(itemDeatils),
          );
          $('#AddOrUpdateItemmodal').modal('show');
        }, 50);
      },
    );
  }
}
async function addItem(items) {
  $('#itemManagementItemviewContainer').empty();

  if (items && items.length) {
    items.forEach(async (item) => {
      const itemCard = $('<div>', {
        class: `card item-management-item-card-body` + ` ${item.short_code}`,
        content: item.title,
        id: `Item_management_${item.item_refid}`,
      });
      itemCard.addClass(`compact-menuItemButton-${item.food_type || 1}`);
      const row = $('<div>', {
        class: 'menu-management-item-row',
      });

      const img = $('<img>', {
        src: item.img_url ? item.img_url : '../assets/images/food.svg',
        alt: item.title,
        class: 'itemImage-for-menu-management',
      });

      const col1 = $('<div>', {
        class: 'col-3 img-container-for-menu-management',
      });

      col1.append(img);

      const col2 = $('<div>', {
        class: 'col-6',
      });

      let itemtitle = item.title;
      if (window.selectedLanguage !== 'en' && item.alternative_title) {
        itemtitle = item.alternative_title;
      }

      if (itemtitle.length > 32) {
        itemtitle = itemtitle.substring(0, 32) + '...';
      }
      const itemInfo = $('<div>');
      const title = $('<div>', {
        class: 'item-title',
        text: itemtitle,
        id: `item_short_code_${item.short_code}`,
      });

      const shortCode = $('<div>', {
        class: 'item-short-code',
        text: item.short_code,
      });

      const salePrice = $('<div>', {
        class: 'item-sale-price',
        text: `${window.storeDetails.currency} ${item.sale_price.toFixed(window.ROUNDOFF_UPTO)}`,
      });

      const currentStock = $('<div>', {
        class: 'item-stock-status',
        html:
          item.current_stock === 0
            ? `<span class='outofstocktag'>Out Of Stock</span>`
            : `(${item.current_stock})`,
      });
      // const itemstockLabel = document.createElement('label');
      //     itemstockLabel.classList.add('itemstockLabel');
      //     if (item.current_stock === 0) {
      //       itemstockLabel.innerHTML = `<span class='outofstocktag'>Out Of Stock</span>`;
      //     } else {
      //       itemstockLabel.innerHTML = `(${item.current_stock})`;
      //     }

      itemInfo.append(title);
      itemInfo.append(shortCode);
      itemInfo.append(salePrice);
      itemInfo.append(currentStock);

      col2.append(itemInfo);

      const col3 = $('<div>', {
        class: 'col-3 edit-item-container',
      });

      const editButton = $('<i>', {
        class: ' fa fa-edit item-edit-icon',
      }).click(() => {
        updateItem(item);
      });

      col3.append(editButton);

      const activeStatuslabel = $('<label>', {
        class: 'item-status-switch switch',
      });

      const activeStatusInput = $('<input>', {
        type: 'checkbox',
        class: `checkbox menu_item_${item.category_ref_ids}`,
      })
        .prop('checked', item.active == 1)
        .click(function () {
          const isChecked = $(this).is(':checked');
          updateItemActiveStatus(item, isChecked);
        });

      const activeStatusSpan = $('<span>', {
        class: 'slider round',
      });

      activeStatuslabel.append(activeStatusInput);
      activeStatuslabel.append(activeStatusSpan);
      col3.append(activeStatuslabel);

      row.append(col1);
      row.append(col2);
      row.append(col3);

      itemCard.append(row);
      itemsbuttonList.push(itemCard);
      itemCard.data = item;

      $('#itemManagementItemviewContainer').append(itemCard);
    });
  }
}

async function updateItemActiveStatus(item, isChecked) {
  try {
    const item_category = window.categoriesList.find(
      (element) => element.category_refid === Number(item.category_ref_ids),
    );
    if (!navigator.onLine) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.noInternetConnection'),
      );
      return;
    }
    let category_id = '';
    let sub_category_id = '';
    if (item_category && item_category.parent_ref_id) {
      const parent_category = window.categoriesList.find(
        (element) =>
          element?.category_refid === Number(item_category?.parent_ref_id),
      );
      sub_category_id = Number(item.category_ref_ids);
      category_id = parent_category.category_refid;
    } else {
      category_id = Number(item.category_ref_ids);
      sub_category_id = Number(item.category_ref_ids);
    }
    const food_types = ['', 'Veg', 'Non Veg', 'Egg', 'Other'];

    const itemPayload = {
      short_code: item.short_code,
      title: item.title,
      food_type: food_types[item.food_type],
      category_id: Number(category_id),
      sub_category_id: Number(sub_category_id),
      product_group_id: Number(item.product_group),
      kitchen_department_id: Number(item.kitchen_dept),
      sale_price: item.sale_price,
      is_active: isChecked == true ? 1 : 0,
      item_type: 0,
      description: item.discription,
      tax_title: item.tax_name,
      tax_per: item.tax_per,
      tax_method: item.tax_method,
      tax_devidable: item.is_devidable,
      discounted_price: item.discounted_price,
    };
    const payload = {
      tmpos_id: Number(window.storeDetails.tmpos_id),
      store_id: window.storeDetails.store_id,
      menu_id: Number(window.menu_id),
      items: [itemPayload],
      action: 'update',
    };

    const itemUpdateData = { ...item };

    Object.assign(itemUpdateData, {
      active: isChecked == true ? 1 : 0,
    });
    showLoader({
      title: 'Updating Item',
      text: 'Please wait',
    });
    const response = await apiCall.post(
      window.Config.links.updateItem,
      payload,
      {
        headers: getHeadersformposforrender(),
        timeout: 5000,
      },
    );
    if (response.data?.status == 200) {
      Swal.close();
      console.log(
        `Message="Item disabled" item_refid=${itemUpdateData.item_refid} username=${storeDetails.username} store_id=${storeDetails.store_id}`,
      );
      window.notifyUser.showMessage('success', 'Item updated');
      const result = await betteripcRenderer.callMain(
        UPDATE_ITEM_DETAILS_LOCALLY,
        itemUpdateData,
      );
      if (result) {
        // ipcRenderer.send(MENU_MANAGEMENT_MESSAGES.GET_MENUDATA, {});
        const item = outletAllItemsList.find(
          (element) => element.item_refid === Number(itemUpdateData.item_refid),
        );
        Object.assign(item, { ...itemUpdateData });
        $('#AddOrUpdateItemmodalBodyid').removeAttr('data');
        $('#AddOrUpdateItemmodalBodyid').attr('data', JSON.stringify(item));
        window.refreshOrderWindow = true;
      }
    }
  } catch (error) {
    Swal.close();
    window.notifyUser.showMessage('error', 'Something went wrong');
    console.log('error while updating status', error);
  }
}

async function getMenuIdFromBackend() {
  try {
    const response = await apiCall.post(
      window.Config.links.getMenuId,
      {
        store_id: window.storeDetails.store_id,
        tmpos_id: Number(window.storeDetails.tmpos_id),
      },
      {
        headers: getHeadersformposforrender(),
      },
    );

    if (response && response.data && response.data.id) {
      window.menu_id = response.data.id;
    }
  } catch (error) {}
}

function checkSameStatusForRefId(ref_id) {
  const filteredItems = outletAllItemsList.filter(
    (item) => item.category_ref_ids == ref_id,
  );

  let allStatusZero = filteredItems.every((item) => item.active === 0);
  if (filteredItems.length == 0) {
    const categoriesWithParentRefId = window.allOutletCategories.filter(
      (category) => category.parent_ref_id === Number(ref_id),
    );
    if (categoriesWithParentRefId) {
      const allStatusZero = categoriesWithParentRefId.every(
        (item) => item.is_active === 0,
      );
      return allStatusZero ? 0 : 1;
    }

    allStatusZero = false;
  }
  return allStatusZero ? 0 : 1;
}

async function getCategoriesFromBackend() {
  try {
    const response = await apiCall.post(
      window.Config.links.getCategories,
      {
        store_id: window.storeDetails.store_id,
        tmpos_id: Number(window.storeDetails.tmpos_id),
      },
      {
        headers: getHeadersformposforrender(),
      },
    );
    if (response && response.data && response.data.data) {
      window.allMasterCategories = response.data.data;
    }
  } catch (error) {
    console.log(error);
  }
}
window.ipcRenderer.on(
  MENU_MANAGEMENT_MESSAGES.GET_MENUDATA_REPLY,
  async (event, content) => {
    if (content) {
      try {
        const data = JSON.parse(content);
        if (data && data.items) {
          window.outletAllItemsList = data.items;
          addItem(data.items);
        }

        if (data && data.categories) {
          window.allOutletCategories = data.categories;
          data.categories.forEach((category) => {
            const is_active = checkSameStatusForRefId(category.category_refid);
            Object.assign(category, {
              is_active,
            });
          });
          initMenutree(window.allOutletCategories);
        }

        if (!window.allMasterCategories) {
          getCategoriesFromBackend();
        }

        if (data && data.menu_id) {
          window.menu_id = data.menu_id.tmpos_menu_id;
        }

        if (!data.menu_id) {
          getMenuIdFromBackend();
        }
        Swal.close();
        setAccesslevelforitemManangement();
        setTimeout(() => {
          initializeMenuManagementPermisions();
        }, 100);
      } catch (error) {
        console.log(error);
      }
    } else {
      Swal.close();
    }
  },
);
setTimeout(() => {
  Initialize();
}, 200);

module.exports = {
  initMenutree,
};
