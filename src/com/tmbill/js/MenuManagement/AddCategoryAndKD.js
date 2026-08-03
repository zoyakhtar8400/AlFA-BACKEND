const { default: axios } = require('axios');
const {
  getHeadersformposforrender,
} = require('../../util/MiscServer.renderer');
const {
  ADD_CATEGORY_LOCALLY,
  MENU_MANAGEMENT_MESSAGES,
  ADD_KITCHEN_DEPT_LOCALLY,
} = require('../../util/IPC_Messages');
const { showLoader } = require('../CommonUtils');
const { default: Swal } = require('sweetalert2');
const { apiCall } = require('../../services/APIService');

function Initialize() {
  $('#addSubCatCategorieslist option:gt(0)').remove();
  if (window.categoriesList) {
    window.categoriesList.forEach((element) => {
      if (element.parent_ref_id == 0) {
        let option = $('<option>')
          .val(element.category_refid)
          .text(element.category_name)
          .attr('category_id', element.category_refid);
        $('#addSubCatCategorieslist').append(option);
      }
    });
  }

  $('#addCategoryButtonId').on('click', function () {
    sendAddCategoryRequest(false);
  });

  $('#addSubCategoryButtonId').on('click', function () {
    sendAddCategoryRequest(true);
  });

  $('#addKitchenDepartmentbuttonid').on('click', function () {
    senAddKitchenDeptRequest();
  });
}

function setCategories() {
  $('#itemCategorieslist option:gt(0)').remove();
  $('#itemSubCategorieslist option:gt(0)').remove();
  $('#addSubCatCategorieslist option:gt(0)').remove();

  if (window.categoriesList) {
    window.categoriesList.forEach((element) => {
      if (element.parent_ref_id == 0) {
        let option = $('<option>')
          .val(element.category_refid)
          .text(element.category_name)
          .attr('category_id', element.category_refid);
        $('#itemCategorieslist').append(option);

        let option2 = $('<option>')
          .val(element.category_refid)
          .text(element.category_name)
          .attr('category_id', element.category_refid);
        $('#addSubCatCategorieslist').append(option2);
      } else {
        let option = $('<option>')
          .val(element.category_refid)
          .text(element.category_name)
          .attr('category_id', element.category_refid)
          .attr('parent_ref_id', element.parent_ref_id);
        $('#itemSubCategorieslist').append(option);
      }
    });
  }
}

function setKitchenDepartment() {
  $('#kitchenDepartmentslist option:gt(0)').remove();

  if (window.outletKitchenDepartments) {
    window.outletKitchenDepartments.forEach((element) => {
      let option = $('<option>')
        .val(element.id)
        .text(element.kitchen_dept_name)
        .attr('kitchen_dept_id', element.id);
      $('#kitchenDepartmentslist').append(option);
    });
  }
}

async function sendAddCategoryRequest(is_subCategory) {
  if (!navigator.onLine) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:commonUtils.noInternetConnection'),
    );
    return;
  }
  let category = $('#categoryInputField').val();
  let parent_ref_id = $('#addSubCatCategorieslist').val();
  let sub_category = $('#subCategoryInputField').val();

  if (parent_ref_id && is_subCategory) {
    category = sub_category;
  }
  let isCategoryPresent = allOutletCategories.find(
    (element) => element.category_name.trim() === category.trim(),
  );

  if (isCategoryPresent) {
    window.notifyUser.showMessage(
      'error',
      'Category name has been taken already',
    );
    return;
  }

  if (is_subCategory && !parent_ref_id) {
    window.notifyUser.showMessage('error', 'Please select category');
    return;
  }
  if (category.length > 45) {
    window.notifyUser.showMessage(
      'error',
      'category name should be less than 45 characters',
    );
    return;
  }

  try {
    let payload = {
      tmpos_id: window.storeDetails.tmpos_id,
      store_id: window.storeDetails.store_id,
      category_name: category,
      parent_ref_id: parent_ref_id ? Number(parent_ref_id) : 0,
      isactive: 1,
      username: window.storeDetails.username,
    };
    showLoader({
      title: 'Adding Category',
      text: 'Please wait',
    });
    let response = await apiCall.post(Config.links.addCategory, payload, {
      headers: getHeadersformposforrender(),
      timeout: 5000,
    });

    if (response && response?.data?.status == 200) {
      console.log(
        `Message="Category created" category_name=${category} username=${storeDetails.username} store_id=${storeDetails.store_id}`,
      );
      Swal.close();
      window.notifyUser.showMessage('success', 'Category added successfully');
      $('#addCategoryModalId').modal('hide');
      $('#addSubCategoryModalId').modal('hide');
      let category_id = response.data.data.category_id;
      let categoryUpdateData = {
        category_refid: category_id,
        category_name: category,
        description: null,
        is_active: 1,
        img_url: null,
        parent_ref_id: parent_ref_id ? Number(parent_ref_id) : 0,
        store_id: window.storeDetails.store_id,
        category_sort: 0,
        timings: null,
      };

      let result = await betteripcRenderer.callMain(
        ADD_CATEGORY_LOCALLY,
        categoryUpdateData,
      );

      if (result) {
        ipcRenderer.send(MENU_MANAGEMENT_MESSAGES.GET_MENUDATA, {});

        window.categoriesList.push(categoryUpdateData);
        window.allMasterCategories?.push(categoryUpdateData);
        setCategories();
        window.refreshOrderWindow = true;
      }
    } else {
      Swal.close();
      window.notifyUser.showMessage('error', 'Something went wrong');
    }
  } catch (error) {
    Swal.close();
    window.notifyUser.showMessage('error', 'Something went wrong');
    console.log(`Message="Error while adding category" error=${error}`);
  }
}

async function senAddKitchenDeptRequest() {
  try {
    if (!navigator.onLine) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.noInternetConnection'),
      );
      return;
    }
    let kitchen_dept_name = $('#addKitchenDepartmentInput').val();

    let isKDPresent = outletKitchenDepartments.find(
      (element) =>
        element.kitchen_dept_name.trim() === kitchen_dept_name.trim(),
    );
    if (isKDPresent) {
      window.notifyUser.showMessage(
        'error',
        'Kitchen department name has been taken already',
      );
      return;
    }

    if (kitchen_dept_name.length > 45) {
      window.notifyUser.showMessage(
        'error',
        'Kitchen department name should be less than 45 characters',
      );
      return;
    }
    let payload = {
      tmpos_id: window.storeDetails.tmpos_id,
      store_id: window.storeDetails.store_id,
      kitchen_dept_name,
      isactive: 1,
    };
    showLoader({
      title: 'Adding kitchen department',
      text: 'Please wait',
    });

    let response = await apiCall.post(
      Config.links.addKitchenDepartment,
      payload,
      {
        headers: getHeadersformposforrender(),
        timeout: 5000,
      },
    );

    if (response && response?.data?.status == 200) {
      Swal.close();
      console.log(
        `Message="Kitchen department created" kitchen_dept_name=${kitchen_dept_name} username=${storeDetails.username} store_id=${storeDetails.store_id}`,
      );
      window.notifyUser.showMessage(
        'success',
        response?.data?.message || 'Kitchen department added successfully',
      );
      $('#addKitchenDeptModalId').modal('hide');

      let kd_id = response.data.data.kitchen_dept_id;
      let kdUpdateData = {
        id: Number(kd_id),
        store_id: Number(window.storeDetails.store_id),
        kitchen_dept_name,
      };
      let result = await betteripcRenderer.callMain(
        ADD_KITCHEN_DEPT_LOCALLY,
        kdUpdateData,
      );

      if (result) {
        ipcRenderer.send(MENU_MANAGEMENT_MESSAGES.GET_MENUDATA, {});
        window.outletKitchenDepartments.push(kdUpdateData);
        setKitchenDepartment();
        $('#kitchenDepartmentslist').val(Number(kd_id));
        window.refreshOrderWindow = true;
      }
    } else {
      Swal.close();
    }
  } catch (error) {
    Swal.close();
    window.notifyUser.showMessage('error', 'Something went wrong');
    console.log(
      `Message="Error while adding kitchen department" Error=${error}`,
    );
  }
}

$('#addCategoryModalId').on('hidden.bs.modal', function () {
  $('#categoryInputField').val('');
});

$('#addSubCategoryModalId').on('hidden.bs.modal', function () {
  $('#subCategoryInputField').val('');
  $('#addSubCatCategorieslist').val('');
});

$('#addKitchenDeptModalId').on('hidden.bs.modal', function () {
  $('#addKitchenDepartmentInput').val('');
});

Initialize();
