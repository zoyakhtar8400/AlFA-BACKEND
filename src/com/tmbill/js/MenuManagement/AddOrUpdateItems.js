/* eslint-disable camelcase */
const { default: axios } = require('axios');
const { default: Swal } = require('sweetalert2');
const {
  getHeadersformposforrender,
} = require('../../util/MiscServer.renderer');
const { showLoader } = require('../CommonUtils');
const {
  UPDATE_ITEM_DETAILS_LOCALLY,
  ADD_ITEM_LOCALLY,
  MENU_MANAGEMENT_MESSAGES,
  ADD_CATEGORY_LOCALLY,
  ADD_CATEGORY_LOCALLY_WITHOUT_ACCESS_LEVEL,
} = require('../../util/IPC_Messages');
const { initalizei18nformenuManagement } = require('../i18nController');
const { apiCall } = require('../../services/APIService');
const { initMenutree } = require('./ItemsManagement');
const {
  makeUpdateItemStockRequest,
} = require('../../renderer/helper/Catalog.helper');
const {
  makeUpdateBackendItemStockRequest,
} = require('../UIutils/AddItemStock');
const {
  REASON_MANDATORY_FOR_REDUCE_INVENTORY,
} = require('../../util/SettingIDs');
require('./AddCategoryAndKD');

window.isAddOrUpdatewidowLoaded = true;
let item;
let addNewItem = false;

async function reduceItemInventory(params) {
  try {
    let reasonMandatoryForReduceInventory = false;
    if (
      window.settingsConfig[REASON_MANDATORY_FOR_REDUCE_INVENTORY - 1] !=
      undefined
    ) {
      reasonMandatoryForReduceInventory =
        window.settingsConfig[REASON_MANDATORY_FOR_REDUCE_INVENTORY - 1]
          .value === '1';
    }
    let remark = 'Manual Stock-Out from POS';
    if (reasonMandatoryForReduceInventory) {
      const { value: reason } = await Swal.fire({
        title: 'Add Reason',
        input: 'text',
        width: '28em',
        allowOutsideClick: false,
        allowEscapeKey: false,
        inputPlaceholder: $.i18n.t(
          'controller:digitalOrderController.selectAReason',
        ),
        showCancelButton: true,
        customClass: {
          popup: 'tmbill-swal-pop-up',
          content: 'tmbill-swal-title-class',
          input: 'tmbill-swal-input2',
        },
      });

      if (!reason) {
        window.notifyUser.showMessage('error', 'Please add reason');
        return;
      }
      remark = reason;
    }
    console.log('data');
    const stock = $('#reduceItemInventoryInputId').val();
    const getItem = window.allItemsList.find(
      (e) => e.item_refid === item.item_refid,
    );
    let current_stock = item.current_stock;
    if (getItem) {
      current_stock = getItem.current_stock;
    }

    if (Number(stock) > current_stock) {
      window.notifyUser.showMessage(
        'error',
        'Reduce quantity should be less than item stock',
      );
      return;
    }

    if (isNaN(stock)) {
      window.notifyUser.showMessage('error', 'Please enter valid number');
      return;
    }
    const payload = {
      store_id: window.storeDetails.store_id,
      list: [
        {
          warehouse_id: window.storeDetails.warehouse_id,
          tmpos_id: window.storeDetails.tmpos_id,
          store_id: window.storeDetails.store_id,
          items: [
            {
              id: 2,
              item_id: item.item_refid,
              name: item.title,
              qty: Number(stock),
              remark,
              options: [],
            },
          ],
        },
      ],
    };

    showLoader({
      title: 'Reducing inventory',
      text: 'Please wait',
    });
    const response = await apiCall.post(
      window.Config.links.reduceStockManually,
      payload,
      {
        headers: getHeadersformposforrender(),
      },
    );
    if (response && response.data && response.data.statusCode === 200) {
      Swal.close();
      window.notifyUser.showMessage('success', 'Inventory has been reduced.');
      const itemStock = item.current_stock - Number(stock);
      await makeUpdateItemStockRequest({
        stock: Number(itemStock),
        item_refid: item.item_refid,
      });
      $('#itemCurrentStockid').val(itemStock.toFixed(window.ROUNDOFF_UPTO));
      item.current_stock = itemStock;
      $('#AddOrUpdateItemmodalBodyid').removeAttr('data');
      $('#AddOrUpdateItemmodalBodyid').attr('data', JSON.stringify(item));
      const outletitem = window.outletAllItemsList.find(
        (element) => element.item_refid === Number(item.item_refid),
      );
      makeUpdateBackendItemStockRequest(outletitem, itemStock);
      outletitem.current_stock = Number(itemStock);
      $('#reduceItemInventoryInputId').val('');
      window.refreshOrderWindow = true;
    }
  } catch (error) {
    Swal.close();
    console.error('error while reducing item inventory', error);
  }
}
function Initialize() {
  console.log('add or update item');
  $('#itemCategorieslist').on('change', function () {
    filterSubcats($(this).find('option:selected'));
  });
  $('#menuItemUpdatebuttonid').on('click', () => {
    sendUpdateItemRequest();
  });

  $('#menuItemAddbuttonid').on('click', () => {
    sendAddItemRequest();
  });
  $('#showMultiplePrices').on('click', () => {
    manageMultipricingContainer();
  });

  if (window.isMultipricingEnabled) {
    $('#itemMultipricingCheckContainer').show();
  } else {
    $('#itemMultipricingCheckContainer').hide();
  }

  $('[data-toggle="popover"]').popover({
    container: 'body',
    title: 'Search',
    html: true,
    placement: 'bottom',
    sanitize: false,
    content() {
      return $('#PopoverContent').html();
    },
  });

  $('#reduceItemInventoryButtonId').on('click', () => {
    reduceItemInventory();
  });

  $('#menuitemshortcodeid').on('input', function () {
    let value = $(this).val();
    value = value
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 15);
    $(this).val(value);
  });

  if ($.i18n) {
    initalizei18nformenuManagement();
  } else {
    setTimeout(initalizei18nformenuManagement, 400);
  }
}

function manageMultipricingContainer() {
  if ($('.multipricingContainer').is(':visible')) {
    $('.multipricingContainer').hide();
    $('.mutiplepricing-container-symbol').addClass('fa-plus-circle');
    $('.mutiplepricing-container-symbol').removeClass('fa-minus-circle');
  } else {
    $('.multipricingContainer').show();
    $('.mutiplepricing-container-symbol').addClass('fa-minus-circle');
    $('.mutiplepricing-container-symbol').removeClass('fa-plus-circle');
  }
}

function resetFormData() {
  $('#menuitemshortcodeid').val('');
  $('#menuItemNameId').val('');
  $('#menuAlternativeItemNameId').val('');
  $('#itemSalePriceid').val('');
  $('#itemSalePrice_1id').val('');
  $('#itemSalePrice_2id').val('');
  $('#itemSalePrice_3id').val('');
  $('#itemSalePrice_4id').val('');
  $('#itemSalePrice_5id').val('');
  $('#itemCurrentStockid').val('');
  $('#itemFoodTypeslist').val('');
  $('#itemTypeslist').val('');
  $('#kitchenDepartmentslist').val('');
  $('#itemCategorieslist').val('');
  $('#itemSubCategorieslist').val('');
  $('#itemTypeslist').val('');
  $('#itemFoodTypeslist').val('');
  $('#productGroupslist').val('');
  $('#reduceItemInventoryInputId').val('');
  $('#searchByname_item_in_item_management').val('');

  $('.multipricingContainer').hide();
  $('.mutiplepricing-container-symbol').addClass('fa-plus-circle');
  $('.mutiplepricing-container-symbol').removeClass('fa-minus-circle');
}

function getFormData() {
  const short_code = $('#menuitemshortcodeid').val();
  const title = $('#menuItemNameId').val();
  const alternative_title = $('#menuAlternativeItemNameId').val();
  const sale_price = $('#itemSalePriceid').val();
  // const item_stock = $('#itemCurrentStockid').is(':checked');
  const item_stock = $('#itemCurrentStockid').val();
  const category = $('#itemCategorieslist').text();
  const sub_category = $('#itemSubCategorieslist').text();
  const food_type = $('#itemFoodTypeslist').val();
  // let item_type = $('#itemTypeslist').val();
  const item_type = 0;
  // let recommended = $('#isItemRecommendedswitchcheckId').is(':checked');
  const recommended = 1;
  const is_active = $('#isItemActiveswitchcheckId').is(':checked');
  const kitchen_dept_id = $('#kitchenDepartmentslist').val();
  const category_id = $('#itemCategorieslist').val();
  const sub_category_id = $('#itemSubCategorieslist').val();
  const product_group_id = $('#productGroupslist').val();
  // const sale_price_1 = $('#itemSalePrice_1id').val();
  // const sale_price_2 = $('#itemSalePrice_2id').val();
  // const sale_price_3 = $('#itemSalePrice_3id').val();
  // const sale_price_4 = $('#itemSalePrice_4id').val();
  // const sale_price_5 = $('#itemSalePrice_5id').val();
  const set_multi_price = $('#samePriceForAllOrderTypescheckid').is(':checked');

  const food_types = ['', 'Veg', 'Non Veg', 'Egg', 'Other'];

  return {
    short_code,
    title,
    alternative_title,
    sale_price,
    item_stock,
    category,
    sub_category,
    food_type,
    item_type,
    recommended,
    is_active,
    kitchen_dept_id,
    category_id,
    sub_category_id,
    food_types,
    product_group_id,
    // sale_price_1,
    // sale_price_2,
    // sale_price_3,
    // sale_price_4,
    // sale_price_5,
    set_multi_price,
  };
}

function validateNumberWithDecimals(input) {
  // Regular expression pattern to match a number with up to three decimal places
  const decimalPlaces = window.ROUNDOFF_UPTO;
  const pattern = new RegExp(`^\\d+(\\.\\d{1,${decimalPlaces}})?$`);
  return pattern.test(input);
}
async function sendAddItemRequest() {
  try {
    let {
      short_code,
      title,
      alternative_title,
      sale_price,
      item_stock,
      category,
      sub_category,
      food_type,
      item_type,
      recommended,
      is_active,
      kitchen_dept_id,
      category_id,
      sub_category_id,
      food_types,
      product_group_id,
      // sale_price_1,
      // sale_price_2,
      // sale_price_3,
      // sale_price_4,
      // sale_price_5,
      set_multi_price,
    } = getFormData();

    if (!navigator.onLine) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.noInternetConnection'),
      );
      return;
    }

    if (isNaN(sale_price)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseentervalidsalerice'),
      );
      return false;
    }

    if (!validateNumberWithDecimals(Number(sale_price))) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.PleaseadduptoDecimalsinsalerice'),
      );
      return;
    }

    if (window.specialCharRegex.test(short_code)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:commonUtils.Specialcharactersnotallowedinshortcode',
        ),
      );
      return;
    }

    if (/\s/.test(short_code)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Spacenotallowedinshortcode'),
      );
      return;
    }

    if (short_code && short_code.length > 15) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Shortcodeshouldbelessthan15digit'),
      );
      return;
    }
    const is_short_code_present = window.outletAllItemsList.find(
      (element) => element.short_code == short_code,
    );

    if (is_short_code_present) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Shortcodealreadyexists'),
      );
      return;
    }

    if (!sale_price) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseaddsalerice'),
      );
      return;
    }

    if (!short_code) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseaddshortcode'),
      );
      return;
    }

    if (!title) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseadditemname'),
      );
      return;
    }

    if (window.specialCharRegex.test(title)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:commonUtils.Specialcharactersnotallowedinitemname',
        ),
      );
      return;
    }

    if (title.length > 50) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Itemnameshouldbelessthan50characters'),
      );
      return;
    }

    if (alternative_title.length > 50) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:commonUtils.Alternativeitemnameshouldbelessthan50characters',
        ),
      );
      return;
    }

    if (sale_price < 0) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseentervalidsalerice'),
      );
      return;
    }

    if (Number(sale_price) > 1000000000) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:commonUtils.PleaseentersalericeLESSTHAN1000000000',
        ),
      );
      return;
    }

    if (!category) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseaddcategory'),
      );
      return;
    }

    if (!food_type) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseaddfoodtype'),
      );
      return;
    }

    if (!kitchen_dept_id) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseaddkitchendept'),
      );
      return;
    }

    if (!product_group_id) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseaddproductgroup'),
      );
      return;
    }

    if (Number(item_stock) < 0) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Stockshouldnotbenegative'),
      );
      return;
    }

    // if (window.allspecialCharRegex.test(item_stock)) {
    //   window.notifyUser.showMessage(
    //     'error',
    //     $.i18n.t('controller:commonUtils.Specialcharactersnotallowedinstock'),
    //   );
    //   return;
    // }

    if (Number.isNaN(item_stock)) {
      window.notifyUser.showMessage('error', 'Please enter valid stock');
      return;
    }
    if (Number(item_stock) > 1000000000) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Stockshouldbelessthan1000000000'),
      );
      return;
    }

    const item_category = allMasterCategories.find(
      (element) => element.category_refid === Number(category_id),
    );

    if (!item_category) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseaddcategory'),
      );
      return;
    }

    if (item_category.parent_ref_id) {
      const parent_category = allMasterCategories.find(
        (element) =>
          element?.category_refid === Number(item_category?.parent_ref_id),
      );
      category = parent_category.category_name;
      sub_category_name = sub_category;
    } else {
      category = item_category.category_name;
      sub_category_name = item_category.category_name;
    }

    const tax_details = outletTaxes.find(
      (element) => element.product_group_id === Number(product_group_id),
    );
    const itemPayload = {
      short_code,
      title,
      alternative_title,
      food_type: food_types[Number(food_type)],
      product_group_id: Number(product_group_id),
      kitchen_department_id: Number(kitchen_dept_id),
      category_id: Number(category_id),
      sub_category_id: Number(sub_category_id),
      sale_price: Number(sale_price) || 0,
      is_active: is_active == true ? 1 : 0,
      item_type: Number(item_type),
      description: '',
      tax_title: tax_details?.tax_name || null,
      tax_per: tax_details?.tax_perct || 0,
      tax_method: tax_details?.tax_method || 0,
      tax_devidable: tax_details?.is_devidable || 0,
      // discounted_price: item.sale_price,
      recommended: recommended == true ? 1 : 0,
      // current_stock: item_stock == true ? 1 : 0,
      current_stock: Number(item_stock),
      recalculatedAmount: Number(sale_price),
      set_multi_price: set_multi_price ? 1 : 0,
    };
    const payload = {
      tmpos_id: Number(window.storeDetails.tmpos_id),
      store_id: window.storeDetails.store_id,
      menu_id: Number(window.menu_id),
      action: 'create',
      items: [itemPayload],
    };
    showLoader({
      title: 'Adding Item',
      text: 'Please wait',
    });
    const response = await apiCall.post(
      window.Config.links.updateItem,
      payload,
      {
        headers: getHeadersformposforrender(),
        // timeout: 5000,
      },
    );
    if (response.data?.status == 200) {
      console.log(
        `Message="New item added" item_refid=${response?.data?.items[0]?.item_refid} username=${window.storeDetails.username} store_id=${storeDetails.store_id}`,
      );
      Swal.close();
      calculateTaxForItem(itemPayload);
      Object.assign(itemPayload, {
        tmpos_menu_id: Number(window.menu_id),
        // current_stock: item_stock == true ? 1 : 0,
        current_stock: Number(item_stock),
        item_refid: Number(response?.data?.items[0]?.item_refid),
        recalculatedAmount: sale_price || 0,
        description: '',
        recommended: recommended == true ? 1 : 0,
        category_ref_ids: sub_category_id || category_id,
        is_devidable: itemPayload.tax_devidable,
        tax_name: itemPayload.tax_title,
        product_group: itemPayload.product_group_id,
        store_id: window.storeDetails.store_id,
        active: is_active == true ? 1 : 0,
        food_type: Number(food_type),
        kitchen_dept: Number(kitchen_dept_id),
        tax_discount_method: 0,
        option_group_ref_id: null,
      });
      window.notifyUser.showMessage('success', 'Item Added');
      $('#AddOrUpdateItemmodal').modal('hide');
      const result = await betteripcRenderer.callMain(
        ADD_ITEM_LOCALLY,
        itemPayload,
      );
      // check if new category then add it to database
      const categoryPresent = window.allOutletCategories.find(
        (element) => element.category_refid === Number(category_id),
      );
      if (!categoryPresent) {
        const categoryUpdateData = {
          category_refid: category_id,
          category_name: category,
          description: null,
          is_active: 1,
          img_url: null,
          parent_ref_id: 0,
          store_id: window.storeDetails.store_id,
          category_sort: 0,
          timings: null,
        };

        await window.betteripcRenderer.callMain(
          ADD_CATEGORY_LOCALLY_WITHOUT_ACCESS_LEVEL,
          categoryUpdateData,
        );
      }

      if (sub_category_id) {
        const subcategoryPresent = window.allOutletCategories.find(
          (element) => element.category_refid === Number(sub_category_id),
        );
        if (!subcategoryPresent) {
          const subcategory = window.allMasterCategories.find(
            (element) => element.category_refid === Number(sub_category_id),
          );
          const categoryUpdateData = {
            category_refid: sub_category_id,
            category_name: subcategory.category_name,
            description: null,
            is_active: 1,
            img_url: null,
            parent_ref_id: category_id,
            store_id: window.storeDetails.store_id,
            category_sort: 0,
            timings: null,
          };

          await window.betteripcRenderer.callMain(
            ADD_CATEGORY_LOCALLY_WITHOUT_ACCESS_LEVEL,
            categoryUpdateData,
          );
        }
      }
      if (result) {
        window.ipcRenderer.send(MENU_MANAGEMENT_MESSAGES.GET_MENUDATA, {});
        window.refreshOrderWindow = true;
      }
    } else {
      Swal.close();
      window.notifyUser.showMessage('error', response?.data?.message);
    }
  } catch (error) {
    $('#AddOrUpdateItemmodal').modal('hide');
    console.log(`Message="Error while adding new item"`, error);
    Swal.close();
    window.notifyUser.showMessage('error', 'Something went wrong');
    if (error && Array.isArray(error) && error.length > 0) {
      window.notifyUser.showMessage('error', error[0]);
    }
  }
}

async function sendUpdateItemRequest() {
  try {
    let {
      short_code,
      title,
      alternative_title,
      sale_price,
      item_stock,
      category,
      sub_category,
      food_type,
      item_type,
      recommended,
      is_active,
      kitchen_dept_id,
      category_id,
      sub_category_id,
      food_types,
      product_group_id,
      set_multi_price,
    } = getFormData();
    if (!navigator.onLine) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.noInternetConnection'),
      );
      return;
    }

    if (!short_code) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseaddshortcode'),
      );
      return;
    }

    if (!title) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseadditemname'),
      );
      return;
    }

    if (window.specialCharRegex.test(title)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:commonUtils.Specialcharactersnotallowedinitemname',
        ),
      );
      return;
    }

    if (title.length > 50) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Itemnameshouldbelessthan50characters'),
      );
      return;
    }

    if (alternative_title.length > 50) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:commonUtils.Alternativeitemnameshouldbelessthan50characters',
        ),
      );
      return;
    }

    if (!sale_price) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseaddsalerice'),
      );
      return;
    }

    if (isNaN(sale_price)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseentervalidsalerice'),
      );
      return false;
    }

    if (Number(sale_price) > 1000000000) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:commonUtils.PleaseentersalericeLESSTHAN1000000000',
        ),
      );
      return;
    }

    if (!validateNumberWithDecimals(Number(sale_price))) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.PleaseadduptoDecimalsinsalerice'),
      );
      return;
    }

    if (!category) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseaddcategory'),
      );
      return;
    }

    if (!food_type) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseaddfoodtype'),
      );
      return;
    }

    if (!kitchen_dept_id) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseaddkitchendept'),
      );
      return;
    }

    if (!product_group_id) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseaddproductgroup'),
      );
      return;
    }

    if (Number(item_stock) < 0) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Stockshouldnotbenegative'),
      );
      return;
    }

    // if (!Number.isInteger(Number(item_stock))) {
    //   window.notifyUser.showMessage(
    //     'error',
    //     $.i18n.t('controller:commonUtils.Pleaseentervalidnumber'),
    //   );
    //   return;
    // }

    if (Number.isNaN(item_stock)) {
      window.notifyUser.showMessage('error', 'Please enter valid stock');
      return;
    }

    if (Number(item_stock) > 1000000000) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Stockshouldbelessthan1000000000'),
      );
      return;
    }

    if (sale_price < 0) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.Pleaseentervalidsalerice'),
      );
      return;
    }
    let sub_category_name = '';

    const item_category = window.allMasterCategories.find(
      (element) => element.category_refid === Number(item.category_ref_ids),
    );

    if (item_category.parent_ref_id) {
      const parent_category = window.allMasterCategories.find(
        (element) =>
          element?.category_refid === Number(item_category?.parent_ref_id),
      );
      category = parent_category.category_name;
      sub_category_name = sub_category;
    } else {
      category = item_category.category_name;
      sub_category_name = item_category.category_name;
    }
    const tax_details = outletTaxes.find(
      (element) => element.product_group_id === Number(product_group_id),
    );

    const itemPayload = {
      short_code,
      title,
      alternative_title,
      food_type: food_types[Number(food_type)],
      sale_price: Number(sale_price) || 0,
      is_active: is_active == true ? 1 : 0,
      // current_stock: item_stock == true ? 1 : 0,
      current_stock: Number(item_stock),
      item_type: Number(item_type),
      description: item.description,
      tax_title: tax_details?.tax_name || null,
      tax_per: tax_details?.tax_perct || 0,
      tax_method: Number(tax_details?.tax_method) || 0,
      tax_devidable: tax_details?.is_devidable || 0,
      discounted_price: item.discounted_price,
      category_id: Number(category_id),
      sub_category_id: Number(sub_category_id),
      kitchen_department_id: Number(kitchen_dept_id),
      product_group_id: Number(product_group_id),
      recommended: recommended == true ? 1 : 0,
      discount_rate: item.discount_rate,
      discount_type: item.discount_type,
      set_multi_price: set_multi_price ? 1 : 0,
    };
    await calculateTaxForItem(itemPayload);
    if (itemPayload.discount_rate) {
      await calculateDiscountForItem(itemPayload);
    }
    const payload = {
      tmpos_id: Number(window.storeDetails.tmpos_id),
      store_id: window.storeDetails.store_id,
      menu_id: Number(window.menu_id),
      action: 'update',
      items: [itemPayload],
    };

    // let itemUpdateData = { ...item };
    const itemUpdateData = {};
    let cat_id = category_id;
    if (sub_category_id) {
      cat_id = sub_category_id;
    }
    const old_food_type = item.food_type;
    Object.assign(itemUpdateData, {
      sale_price: Number(sale_price) || 0,
      title,
      alternative_title,
      short_code,
      active: is_active == true ? 1 : 0,
      item_type: Number(item_type),
      category_ref_ids: cat_id,
      // current_stock: item_stock == true ? 1 : 0,
      current_stock: Number(item_stock),
      recommended: recommended == true ? 1 : 0,
      itemsub_total: Number(sale_price),
      kitchen_dept: Number(kitchen_dept_id),
      recalculatedAmount: Number(sale_price) || 0,
      food_type: Number(food_type),
      product_group: product_group_id,
      tax_name: tax_details?.tax_name || null,
      tax_per: tax_details?.tax_perct || 0,
      tax_method: Number(tax_details?.tax_method) || 0,
      tax_devidable: tax_details?.is_devidable || 0,
      item_refid: item.item_refid,
      discount_rate: item.discount_rate,
      discount_type: item.discount_type,
      is_devidable: tax_details?.is_devidable || 0,
    });
    await calculateTaxForItem(itemUpdateData);
    if (item.discount_rate) {
      await calculateDiscountForItem(itemUpdateData);
    }

    showLoader({
      title: $.i18n.t('controller:commonUtils.Updatingitem'),
      text: $.i18n.t('controller:commonUtils.Pleasewait'),
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
      console.log(
        `Message="Item updated" item_refid=${itemUpdateData.item_refid} username=${storeDetails.username} store_id=${storeDetails.store_id}`,
      );
      Swal.close();
      $('#AddOrUpdateItemmodal').modal('hide');
      window.notifyUser.showMessage('success', 'Item updated');
      const result = await betteripcRenderer.callMain(
        UPDATE_ITEM_DETAILS_LOCALLY,
        itemUpdateData,
      );
      if (result) {
        // ipcRenderer.send(MENU_MANAGEMENT_MESSAGES.GET_MENUDATA, {});
        // find item and update data
        const item = outletAllItemsList.find(
          (element) => element.item_refid === Number(itemUpdateData.item_refid),
        );

        const title = $(`#item_short_code_${item.short_code}`);
        title.text(itemUpdateData.title);

        const targetElement = document.getElementById(
          `item_short_code_${item.short_code}`,
        );
        const short_code =
          targetElement.parentElement.querySelector(`.item-short-code`);

        short_code.textContent = itemUpdateData.short_code;

        const price =
          targetElement.parentElement.querySelector(`.item-sale-price`);
        price.textContent = itemUpdateData.sale_price.toFixed(
          window.ROUNDOFF_UPTO,
        );

        const stock =
          targetElement.parentElement.querySelector(`.item-stock-status`);
        const stockTextContent =
          itemUpdateData.current_stock === 0
            ? 'Out Of Stock'
            : `(${itemUpdateData.current_stock})`;
        stock.textContent = stockTextContent;
        if (stock && itemUpdateData.current_stock === 0) {
          stock.classList.add('outofstocktag');
        }
        const foodtypeElement = document.getElementById(
          `Item_management_${item.item_refid}`,
        );
        foodtypeElement.classList.remove(
          `compact-menuItemButton-${old_food_type || 1}`,
        );
        foodtypeElement.classList.add(
          `compact-menuItemButton-${itemUpdateData.food_type || 1}`,
        );

        // update active status on item card
        const itemCard = document.getElementById(
          `Item_management_${item.item_refid}`,
        );

        const itemCardActiveStatus = itemCard.querySelectorAll(
          `.item-status-switch .checkbox`,
        );

        itemCardActiveStatus[0].checked = is_active;

        let isCategoryChanged = false;
        if (item.category_ref_ids !== cat_id) {
          isCategoryChanged = true;
        }
        Object.assign(item, { ...itemUpdateData });
        $('#AddOrUpdateItemmodalBodyid').removeAttr('data');
        $('#AddOrUpdateItemmodalBodyid').attr('data', JSON.stringify(item));
        window.refreshOrderWindow = true;
        if (isCategoryChanged) {
          initMenutree(window.allOutletCategories);
        }
      }
    }
  } catch (error) {
    $('#AddOrUpdateItemmodal').modal('hide');
    console.log(`Message="Error while updating item"`, error);
    Swal.close();
    window.notifyUser.showMessage('error', 'Something went wrong');
    if (error && Array.isArray(error) && error.length > 0) {
      window.notifyUser.showMessage('error', error[0]);
    }
  }
}

function calculateTaxForItem(item) {
  if (Number(item.tax_method)) {
    // if tax is inclusive
    taxTotal = 0;
    taxTotal = Number(
      (
        taxTotal +
        (item.sale_price / (100 + item.tax_per)) * item.tax_per
      ).toFixed(ROUNDOFF_UPTO),
    );
    Object.assign(item, {
      tax_value: taxTotal,
      itemsub_total: item.recalculatedAmount,
    });
    return taxTotal;
  }
  taxTotal = 0;
  let taxPerct;
  if (item.is_devidable) {
    // taxPerct = Number(
    //   (item.item_tax_per / 2 / 100) * item.recalculatedAmount,
    // )
    taxPerct = Number(((item.tax_per / 2) * item.sale_price) / 100);
    taxPerct = roundAmountUptoDecimals(taxPerct, ROUNDOFF_UPTO);
    taxTotal = Number((taxTotal + taxPerct * 2).toFixed(ROUNDOFF_UPTO));
  } else {
    taxTotal = Number(
      (taxTotal + (item.sale_price * item.tax_per) / 100).toFixed(
        ROUNDOFF_UPTO,
      ),
    );
    // taxTotal = roundAmountUptoDecimals(Number((taxTotal + ((item.recalculatedAmount * item.item_tax_per) / 100)), ROUNDOFF_UPTO))
  }
  Object.assign(item, {
    tax_value: taxTotal,
    itemsub_total: Number(item.recalculatedAmount) + Number(taxTotal),
  });
  return taxTotal;
}

function calculateDiscountForItem(item) {
  let discount = item.discount_rate;
  if (item.discount_type == 1) {
    discount = Number((item.sale_price * item.discount_rate) / 100).toFixed(
      ROUNDOFF_UPTO,
    );
  }
  if (discount <= item.sale_price) {
    const discounted_price = item.sale_price - discount;
    item.pricebeforeDiscount = item.sale_price;
    item.discounted_price = Number(discounted_price.toFixed(ROUNDOFF_UPTO));
  } else {
    item.pricebeforeDiscount = item.sale_price;
  }
}

function roundAmountUptoDecimals(numb, roundUpto) {
  roundUpto = Number(roundUpto);
  numb = Number(numb);
  const value = Intl.NumberFormat('en-US', {
    minimumFractionDigits: roundUpto,
    maximumFractionDigits: roundUpto,
    useGrouping: false,
  }).format(numb);
  return Number(value);
}
function filterSubcats(element) {
  const category_id = $(element).attr('value');

  // if first subcategory is selected then after selecting category deselect subcategory
  // because there may be category, sub-category mismatch
  if ($('#itemSubCategorieslist option:selected:not([disabled])')) {
    $('#itemSubCategorieslist').prop('selectedIndex', 0);
    $('#itemSubCategorieslist').val('');
  }

  $('#itemSubCategorieslist option').each(function (index) {
    const parent = $(this).attr('parent_ref_id');
    if (parent === category_id) {
      $(this).attr('disabled', false);
      $(this).show();
    } else {
      $(this).hide();
    }
  });
}

function InitializeComponentData() {
  $('#itemCategorieslist option:gt(0)').remove();
  $('#itemSubCategorieslist option:gt(0)').remove();
  $('#kitchenDepartmentslist option:gt(0)').remove();
  $('#productGroupslist option:gt(0)').remove();
  if (window.categoriesList) {
    window.allMasterCategories.forEach((element) => {
      if (element.parent_ref_id == 0) {
        const option = $('<option>')
          .val(element.category_refid)
          .text(element.category_name)
          .attr('category_id', element.category_refid);
        $('#itemCategorieslist').append(option);
      } else {
        const option = $('<option>')
          .val(element.category_refid)
          .text(element.category_name)
          .attr('category_id', element.category_refid)
          .attr('parent_ref_id', element.parent_ref_id);
        $('#itemSubCategorieslist').append(option);
      }
    });
  }

  if (window.kitchenDepartments) {
    window.outletKitchenDepartments.forEach((element) => {
      const option = $('<option>')
        .val(element.id)
        .text(element.kitchen_dept_name)
        .attr('kitchen_dept_id', element.id);
      $('#kitchenDepartmentslist').append(option);
    });
  }

  if (window.globalproductGroups) {
    window.outletProductGroups.forEach((element) => {
      const option = $('<option>')
        .val(element.product_group_id)
        .text(element.product_group_name)
        .attr('kitchen_dept_id', element.product_group_id);
      $('#productGroupslist').append(option);
    });
  }
}
function setItemDetails() {
  // 🔥 HARD RESET (IMPORTANT)
  $('#addItemModalHeading').hide();
  $('#updateItemModalHeading').hide();
  $('#menuItemAddbuttonid').hide();
  $('#menuItemUpdatebuttonid').hide();
  $('#reduceItemInventoryContainer').hide();

  const details = $('#AddOrUpdateItemmodalBodyid')[0];
  const rawData = details.getAttribute('data');
  const itemdetails = rawData ? JSON.parse(rawData) : null;

  item = itemdetails;
  if (itemdetails) {
    $('#updateItemModalHeading').show();
    $('#menuItemUpdatebuttonid').show();
    $('#addItemModalHeading').hide();
    $('#menuItemAddbuttonid').hide();
    $('#reduceItemInventoryContainer').show();
    $('#samePriceForAllOrderTypescheckid').prop('checked', false);
  } else {
    $('#updateItemModalHeading').hide();
    $('#menuItemUpdatebuttonid').hide();
    $('#addItemModalHeading').show();
    $('#menuItemAddbuttonid').show();
    $('#reduceItemInventoryContainer').hide();
    $('#samePriceForAllOrderTypescheckid').prop('checked', true);
  }
  if (itemdetails) {
    $('#menuitemshortcodeid').prop('disabled', true);
    $('#menuitemshortcodeid').addClass('shortCodeDisabled');
  } else {
    $('#menuitemshortcodeid').prop('disabled', false);
    $('#menuitemshortcodeid').removeClass('shortCodeDisabled');
  }
  if (!itemdetails) {
    addNewItem = true;
    $('#isItemActiveswitchcheckId').prop('checked', true);
    // $('#itemCurrentStockid').prop('checked', true);
    return;
  }
  if (itemdetails) {
    $('#menuitemshortcodeid').val(itemdetails.short_code);
    $('#menuItemNameId').val(itemdetails.title);
    $('#menuAlternativeItemNameId').val(itemdetails.alternative_title);
    $('#itemSalePriceid').val(itemdetails.sale_price);
    // $('#itemSalePrice_1id').val(itemdetails.sale_price_1);
    // $('#itemSalePrice_2id').val(itemdetails.sale_price_2);
    // $('#itemSalePrice_3id').val(itemdetails.sale_price_3);
    // $('#itemSalePrice_4id').val(itemdetails.sale_price_4);
    // $('#itemSalePrice_5id').val(itemdetails.sale_price_5);

    const category = allMasterCategories.find(
      (element) =>
        element.category_refid === Number(itemdetails.category_ref_ids),
    );

    // if (!category) {
    //   window.notifyUser.showMessage(
    //     'error',
    //     'Category not found for this item',
    //   );
    //   return;
    // }
    $('#kitchenDepartmentslist').val(itemdetails.kitchen_dept);
    $('#productGroupslist').val(itemdetails.product_group);
    $('#itemTypeslist').val(0);

    // set food type
    $('#itemFoodTypeslist').val(itemdetails?.food_type);
    if (category && category.parent_ref_id) {
      const parent_category = allMasterCategories.find(
        (element) =>
          element?.category_refid === Number(category?.parent_ref_id),
      );
      $('#itemSubCategorieslist').val(itemdetails?.category_ref_ids);
      $('#itemCategorieslist').val(parent_category?.category_refid);
    } else {
      $('#itemCategorieslist').val(itemdetails?.category_ref_ids);
    }

    // $('#itemTypeslist').val(itemdetails?.food_type);
    // $('#isItemRecommendedswitchcheckId').prop(
    //   'checked',
    //   itemdetails.recommended == '1' ? true : false,
    // );
    $('#isItemActiveswitchcheckId').prop('checked', itemdetails.active == 1);

    // $('#itemCurrentStockid').prop('checked', itemdetails.current_stock > 0);
    $('#itemCurrentStockid').val(itemdetails.current_stock);

    // set item type
  }
}

$('#AddOrUpdateItemmodal').on('shown.bs.modal', (e) => {
  // $('#itemUnitid').unbind();
  //   Initialize();
  resetFormData();

  InitializeComponentData();
  setItemDetails();
});

$('#AddOrUpdateItemmodal').on('hidden.bs.modal', () => {
  item = undefined;
  resetFormData();
  $('#searchByname_item_in_item_management').trigger(
    $.Event('keyup', { keyCode: 13 }),
  );
});
$('#addCategoryModalId')
  .off('shown.bs.modal.autofocus')
  .on('shown.bs.modal.autofocus', function () {
    initalizei18nformenuManagement();
    $('#AddOrUpdateItemmodal')
      .off('shown.bs.modal.autofocus')
      .on('shown.bs.modal.autofocus', function () {
        setTimeout(() => {
          const input = $('#menuItemNameId');
          if (input.length && !input.prop('disabled')) {
            input.trigger('focus');
          }
        }, 200);
      });
    setTimeout(() => {
      $('#categoryInputField').trigger('focus');
    }, 150);
  });

$('#addSubCategoryModalId')
  .off('shown.bs.modal.autofocus')
  .on('shown.bs.modal.autofocus', function () {
    setTimeout(() => {
      $('#subCategoryInputField').trigger('focus');
    }, 150);
  });

$('#addKitchenDeptModalId')
  .off('shown.bs.modal.autofocus')
  .on('shown.bs.modal.autofocus', function () {
    initalizei18nformenuManagement();
    setTimeout(() => {
      $('#addKitchenDepartmentInput').trigger('focus');
    }, 150);
  });
setTimeout(() => {
  Initialize();
}, 100);
