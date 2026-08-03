const {
  makeUpdateItemStockRequest,
} = require('../../renderer/helper/Catalog.helper');
const { apiCall } = require('../../services/APIService');
const {
  getHeadersformposforrender,
} = require('../../util/MiscServer.renderer');
const { sendStockUpdatedevent } = require('../ClientrequestHandler');
const { showLoader } = require('../CommonUtils');

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

async function makeUpdateBackendItemStockRequest(item, stock) {
  try {
    const food_types = ['', 'Veg', 'Non Veg', 'Egg', 'Other'];
    const data = {
      tmpos_id: Number(window.storeDetails.tmpos_id),
      store_id: window.storeDetails.store_id,
      menu_id: Number(window.menu_id),
      action: 'update',
      items: [
        {
          short_code: item.short_code,
          title: item.title,
          food_type: food_types[Number(item.food_type)],
          sale_price: item.pricebeforeDiscount || item.sale_price,
          is_active: 1,
          current_stock: Number(stock),
          item_type: 0,
          description: item.description,
          tax_title: item.tax_name,
          tax_per: item.tax_per,
          tax_method: Number(item.tax_method),
          tax_devidable: item.is_devidable,
          discounted_price: item.discounted_price,
          category_id: Number(item.category_ref_ids),
          sub_category_id: 0,
          kitchen_department_id: Number(item.kitchen_dept),
          product_group_id:
            Number(item.product_group) || Number(item.product_group_id),
          sale_price_1: item.sale_price_1,
          sale_price_2: item.sale_price_2,
          sale_price_3: item.sale_price_3,
          sale_price_4: item.sale_price_4,
          sale_price_5: item.sale_price_5,
          recommended: item.recommended,
          discount_rate: item.discount_rate,
          discount_type: item.discount_type,
          tax_value: item.tax_value,
          item_refid: item.item_refid,
        },
      ],
    };

    showLoader({
      title: $.i18n.t('controller:orderController.Updatingstock'),
      text: $.i18n.t('controller:orderController.Pleasewait'),
    });

    const response = await apiCall.post(window.Config.links.updateItem, data, {
      headers: getHeadersformposforrender(),
      timeout: 8000,
    });
    if (response.data?.status === 200) {
      console.log(
        `Message="Item stock updated" item_refid=${data.items[0].item_refid} username=${window.storeDetails.username} store_id=${window.storeDetails.store_id}`,
      );
      window.Swal.close();
      window.notifyUser.showMessage('success', 'Stock updated');
      const resp = await makeUpdateItemStockRequest({
        stock,
        item_refid: item.item_refid,
      });
      if (resp) {
        const getItem = window.allItemsList.find(
          (i) => i.item_refid === item.item_refid,
        );
        if (getItem) {
          getItem.current_stock = Number(stock);
        }
        Object.assign(item, {
          current_stock: Number(stock),
        });
        if (item.current_stock === 0) {
          $(`#item_${item.short_code} .itemstockLabel`).text(`Out Of Stock`);
          $(`#item_${item.short_code} .itemstockLabel`).addClass(
            'outofstocktag',
          );
        } else {
          $(`#item_${item.short_code} .itemstockLabel`).removeClass(
            'outofstocktag',
          );
          $(`#item_${item.short_code} .itemstockLabel`).text(
            `(${item.current_stock})`,
          );
        }
        const incrementQtyItems = [];
        incrementQtyItems.push({
          item_refid: item.item_refid,
          qty: Number(stock),
          current_stock: Number(stock),
          short_code: item.short_code,
        });

        sendStockUpdatedevent(incrementQtyItems);
      }
    }
  } catch (error) {
    Swal.close();
    console.log('Message=Error while updating item stock', error);
  }
}

/* eslint-disable camelcase */
async function openAddStockwindow(item) {
  const result = await window.Swal.fire({
    title: `Add Stock`,
    html: `<input type="number" placeholder="Add stock" id="swal-input1" class="swal2-input w-75 has-i18n">`,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: `Add`,
    cancelButtonText: $.i18n.t(
      'controller:orderController.editOrAddCustomer.Cancel',
    ),
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
      htmlContainer: 'tmbill-swal-html-container',
    },
    didOpen: () => {
      if (!navigator.onLine) {
        window.showSwalwarning(
          $.i18n.t('controller:orderController.Nointernetconnection'),
        );
      }
    },
    showLoaderOnConfirm: true,
    // showCancelButton: true,
    preConfirm: async () => {
      const stock = document.getElementById('swal-input1').value;
      if (!stock) {
        window.showSwalwarning(
          $.i18n.t('controller:orderController.Pleaseenterstock'),
        );
        return;
      }
      if (Number(stock) < 0) {
        window.showSwalwarning(
          $.i18n.t('controller:orderController.Negativestocknotallowed'),
        );
        return;
      }
      if (stock) {
        if (Number(stock) > 1000000000) {
          window.showSwalwarning(
            $.i18n.t(
              'controller:orderController.Stockshouldbelessthan1000000000',
            ),
          );
          return;
        }

        if (window.allspecialCharRegex.test(stock)) {
          window.showSwalwarning(
            $.i18n.t(
              'controller:orderController.Specialcharactersnotallowedinstock',
            ),
          );
          return;
        }
        try {
          await makeUpdateBackendItemStockRequest(item, stock);
        } catch (error) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t(
              'controller:orderController.Somethingwentwrongwhileupdatingstock',
            ),
          );
          Swal.close();
          console.error(error);
        }
      }
    },
    allowOutsideClick: () => !window.Swal.isLoading(),
  });
  return result;
}

async function addItemStock(item) {
  const addStockConfirmation = await window.Swal.fire({
    title: $.i18n.t('controller:orderController.Itemisoutofstock'),
    text: $.i18n.t('controller:orderController.Doyouwanttoupdatestock'),
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

  if (addStockConfirmation && addStockConfirmation.isConfirmed) {
    openAddStockwindow(item);
  }
}

// if (window.__IS_MASTER_POS__) {
setTimeout(() => {
  getMenuIdFromBackend();
}, 10000);
// }
module.exports = {
  addItemStock,
  makeUpdateBackendItemStockRequest,
};
