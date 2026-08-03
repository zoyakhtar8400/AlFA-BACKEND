const { throttle } = require('lodash');
const { STORES_INFO } = require('../util/Constants');
const {
  getHeadersforchannelforrender,
} = require('../util/MiscServer.renderer');
const {
  SEND_SERVERNOTIFICATION_TO,
  AUTO_ACCEPT_ONLINE_ORDER,
} = require('../util/SettingIDs');
const {
  initAccesslevelsforonlineorderssettings,
} = require('./AccesslevelManager');
const {
  initializei18nforOnlinestorectrlwindowui,
} = require('./i18nController');
const { initializeOnlineorderpermissions } = require('./PasscodeController');
const { apiCall } = require('../services/APIService');
const { updateSettings } = require('../renderer/helper/Settings.helper');

window.openstoreScriptloaded = true;

let selecteditemsRefidlist = new Set();
let selectedoptionsRefidlist = new Set();

/**
 * Intialize the components
 */
function Intialize() {
  $('.nav-tabs a[href="#storesettingstabdivId"]').tab('show');

  $(
    '#refreshstoresButton,#refreshstoresButton2,#refreshstoresButton3,#refreshstoresButton4',
  ).on('click', fetchStores);
  $('#enablestoreButton').on('click', function () {
    changePlatformstatus('enable');
  });
  $('#parentcurrentStoresoptionsid').on('change', function () {
    setCurrentnotificationtype();
    getCategoriesforfilter();
  });

  // setCurrentnotificationtype
  $('#disablestoreButton').on('click', function () {
    changePlatformstatus('disable');
  });
  $('#updatenotifiationPrefbutton').on('click', function () {
    sendnotificationUpdateinfo();
  });

  $('#autoacceptorderforStoreid').on('click', function (event) {
    let isChecked = $(this).is(':checked');
    sendnotificationUpdateinfo(isChecked);
  });
  $('#enableitemsButton').on('click', function () {
    // checkSelectedItems('enable');
    throttled('enable');
  });
  $('#disableitemsButton').on('click', function () {
    throttled('disable');
  });
  $('#enableallitemsButton').on('click', function () {
    throttled('enable_all');
  });
  $('#disableallitemsButton').on('click', function () {
    throttled('disable_all');
  });

  $('#enableOptionsButton').on('click', function () {
    throttled('enable');
  });
  $('#disableoptionsButton').on('click', function () {
    throttled('disable');
  });
  $('#enablealloptionsButton').on('click', function () {
    throttled('enable_all');
  });
  $('#disablealloptionsButton').on('click', function () {
    throttled('disable_all');
  });

  $('#filterstoreitemsbycatOptions').on('change', function () {
    let store_id = $(
      '#parentcurrentStoresoptionsid option:selected:not([disabled])',
    ).attr('value');
    if (store_id) {
      showLoader({
        title: 'Gettings store items',
        text: 'This will take just a second.',
        event: this.value !== '0' ? makegetItemsrequest2 : makegetItemsrequest,
        args: { store_id, category_refid: this.value },
      });
    }
  });

  $('#getstoreItemsbutton').on('click', function () {
    let store_id = $(
      '#parentcurrentStoresoptionsid option:selected:not([disabled])',
    ).attr('value');
    if (store_id) {
      showLoader({
        title: 'Gettings store items',
        text: 'This will take just a second.',
        event: makegetItemsrequest,
        args: { store_id },
      });
    }
  });

  $('#getstoreCategoriesbutton').on('click', function () {
    let store_id = $(
      '#parentcurrentStoresoptionsid option:selected:not([disabled])',
    ).attr('value');
    if (store_id) {
      showLoader({
        title: 'Gettings store categories',
        text: 'This will take just a second.',
        event: makegetStorecategoriessrequest,
        args: { store_id, forFilters: false },
      });
    }
  });

  $('#getstoreOptionsbutton').on('click', function () {
    let store_id = $(
      '#parentcurrentStoresoptionsid option:selected:not([disabled])',
    ).attr('value');
    if (store_id) {
      showLoader({
        title: 'Gettings store options',
        text: 'This will take just a second.',
        event: makegetStoreoptionssrequest,
        args: { store_id },
      });
    }
  });

  addPlatforms();
  fetchStores();
  initializeStoreitemstable([]);
  $('#filterstoreitemsbycatOptions').selectpicker({
    size: 5,
  });

  $(document).on(
    'change',
    '#storeItemstableId input.storeitemInputcheck',
    function () {
      if (
        $('#storeItemstableId input.storeitemInputcheck:checked').length > 100
      ) {
        $(this).prop('checked', false);
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:onlineorderstorenotification.Youcanonlyselectuptoundreditems',
          ),
          0,
        );
      } else {
        if ($(this).prop('checked')) {
          if (!selecteditemsRefidlist.has()) {
            selecteditemsRefidlist.add($(this).attr('item_refid'));
          }
        } else {
          selecteditemsRefidlist.delete($(this).attr('item_refid'));
        }
      }
    },
  );
  $(document).on(
    'change',
    '#storeoptionssTableId input.storeitemInputcheck',
    function () {
      if (
        $('#storeoptionssTableId input.storeitemInputcheck:checked').length >
        100
      ) {
        $(this).prop('checked', false);
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:onlineorderstorenotification.Youcanonlyselectuptoundreditems',
          ),
          0,
        );
      } else {
        if ($(this).prop('checked')) {
          if (!selectedoptionsRefidlist.has()) {
            selectedoptionsRefidlist.add($(this).attr('option_refid'));
          }
        } else {
          selectedoptionsRefidlist.delete($(this).attr('option_refid'));
        }
      }
    },
  );
  setCurrentnotificationtype();
  initAccesslevelsforonlineorderssettings();
  initializeOnlineorderpermissions();
  if ($.i18n) {
    initializei18nforOnlinestorectrlwindowui();
  } else {
    setTimeout(initializei18nforOnlinestorectrlwindowui, 400);
  }
  setTimeout(() => {
    $(
      'ul.storesettingsTabs li a:not([passcode-protected]):visible:first',
    ).click();
  }, 200);
}

let throttled = throttle(
  (action) => {
    checkSelectedItems(action);
  },
  3000,
  { trailing: false },
);

function setCurrentnotificationtype() {
  // let store_id = $('#parentcurrentStoresoptionsid option:selected:not([disabled])').attr('value');
  if (window.settingsConfig[SEND_SERVERNOTIFICATION_TO - 1] != undefined) {
    window.settingsConfig[SEND_SERVERNOTIFICATION_TO - 1].value;
    $(
      "input[name='notification-type'][value=" +
        window.settingsConfig[SEND_SERVERNOTIFICATION_TO - 1].value +
        ']',
    ).prop('checked', true);
  }

  if (window.settingsConfig[AUTO_ACCEPT_ONLINE_ORDER - 1] != undefined) {
    window.settingsConfig[AUTO_ACCEPT_ONLINE_ORDER - 1].value;
    $('#autoacceptorderforStoreid').prop(
      'checked',
      window.settingsConfig[AUTO_ACCEPT_ONLINE_ORDER - 1].value == 1,
    );
    // $("input[name='notification-type'][value=" + window.settingsConfig[SEND_SERVERNOTIFICATION_TO - 1].value + "]").prop('checked', true);
  }
}

async function initializeStoreitemstable(itemsList) {
  $('#storeItemstableId').DataTable({
    data: itemsList,
    ordering: false,
    scrollY: '25vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: true,
    bInfo: false,
    paging: true,
    order: [[1, 'asc']],
    columns: [
      { title: 'Sr No', data: 'srno' },
      { title: 'Item Name', data: 'item_name' },
      { title: 'Price', data: 'price' },
      { title: 'Status ', data: 'available' },
      { title: '', data: 'available' },
    ],
    columnDefs: [
      {
        render: function (data, type, full, meta) {
          if (meta.row < itemsList.length) {
            itemsList[meta.row].srno = meta.row + 1; // adds id to dataset

            // itemsList[meta.row].item_status = (itemsList[meta.row].available === '1' ? 'Active' : 'Inactive')
          }
          return meta.row + 1; // adds id to serial no
        },
        targets: 0,
      },
    ],
    createdRow: function (row, data, index) {
      if (data) {
        if (data.available != undefined) {
          let statusLabel = $('<label>');
          if (data.available == '1') {
            statusLabel.html('Active');
            statusLabel.addClass('statusLabel activeItems');
          } else {
            statusLabel.html('Inactive');
            statusLabel.addClass('statusLabel inactiveItems');
          }
          $('td', row).eq(3).empty().append(statusLabel);

          let statusInputcheck = $('<input>', {
            type: 'checkbox',
            class: 'storeitemInputcheck',
            id: data.item_refid + '_check',
            item_refid: data.item_refid,
          });
          let statusInputchecklabel = $('<label>', {
            for: data.item_refid + '_check',
          });

          $('td', row)
            .eq(4)
            .empty()
            .append(statusInputcheck)
            .append(statusInputchecklabel);
        }
      }
    },
  });

  $('#storeCategoriestableId').DataTable({
    data: itemsList,
    ordering: false,
    scrollY: '30vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [[1, 'asc']],
    columns: [
      { title: 'Sr No', data: 'srno' },
      { title: 'Category', data: 'category_name' },
      { title: 'Items', data: 'items' },
      { title: 'Status ', data: 'active' },
      { title: '', data: 'active' },
    ],
    columnDefs: [
      {
        render: function (data, type, full, meta) {
          if (meta.row < itemsList.length) {
            itemsList[meta.row].srno = meta.row + 1; // adds id to dataset
            // itemsList[meta.row].item_status = (itemsList[meta.row].available === '1' ? 'Active' : 'Inactive')
          }
          return meta.row + 1; // adds id to serial no
        },
        targets: 0,
      },
    ],
    createdRow: function (row, data, index) {
      if (data) {
        if (data.active != undefined) {
          let actionButton = $('<label>');
          let statusLabel = $('<label>');
          if (data.active == '1') {
            statusLabel.html('Active');
            statusLabel.addClass('statusLabel activeItems');
            actionButton.addClass('btn btn-danger small-button');
            actionButton.html('Disable');
          } else {
            statusLabel.html('Inactive');
            statusLabel.addClass('statusLabel inactiveItems');
            actionButton.addClass(
              'btn btn-success button-success small-button',
            );
            actionButton.html('Enable');
          }
          $('td', row).eq(3).empty().append(statusLabel);
          $('td', row)
            .eq(4)
            .empty()
            .click(() => {
              updateStorecategorystatus(data);
            })
            .append(actionButton);
        }
      }
    },
  });
  $('#storeoptionssTableId').DataTable({
    data: [],
    ordering: false,
    scrollY: '28vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: true,
    bInfo: false,
    paging: true,
    order: [[1, 'asc']],
    columns: [
      { title: 'Sr No', data: 'srno' },
      { title: 'Title', data: 'option_title' },
      { title: 'Price', data: 'price' },
      { title: 'Option Group ', data: 'option_group_name' },
      { title: 'Status', data: 'available' },
      { title: '', data: 'available' },
    ],
    columnDefs: [
      {
        render: function (data, type, full, meta) {
          if (meta.row < itemsList.length) {
            itemsList[meta.row].srno = meta.row + 1; // adds id to dataset
            // itemsList[meta.row].item_status = (itemsList[meta.row].available === '1' ? 'Active' : 'Inactive')
          }
          return meta.row + 1; // adds id to serial no
        },
        targets: 0,
      },
    ],
    createdRow: function (row, data, index) {
      if (data) {
        if (data.available != undefined) {
          let statusLabel = $('<label>');
          if (data.available == 1) {
            statusLabel.html('Active');
            statusLabel.addClass('statusLabel activeItems');
          } else {
            statusLabel.html('Inactive');
            statusLabel.addClass('statusLabel inactiveItems');
          }
          $('td', row).eq(4).empty().append(statusLabel);

          let statusInputcheck = $('<input>', {
            type: 'checkbox',
            class: 'storeitemInputcheck',
            id: data.option_refid + '_check',
            option_refid: data.option_refid,
          });
          let statusInputchecklabel = $('<label>', {
            for: data.option_refid + '_check',
          });

          $('td', row)
            .eq(5)
            .empty()
            .append(statusInputcheck)
            .append(statusInputchecklabel);
        }
      }
    },
  });
  $('#filterstoreitemsField').keyup(function () {
    $('#storeItemstableId').DataTable().search($(this).val()).draw();
  });
  $('#storeItemstableId_filter').hide();

  $('#filterstoreoptionsField').keyup(function () {
    $('#storeoptionssTableId').DataTable().search($(this).val()).draw();
  });
  $('#storeoptionssTableId_filter').hide();
}

async function updateStorecategorystatus(data) {
  try {
    data.active = Number(data.active) == 0 ? 1 : 0;
    let store_id = $(
      '#parentcurrentStoresoptionsid option:selected:not([disabled])',
    ).attr('value');
    if (store_id) {
      data.store_id = store_id;
      data.tracking_id = window.tmpos_id;
      showLoader({
        title: 'Updating category status',
        text: 'This will take just a second.',
        event: sendCategoryupdaterequest,
        args: data,
      });
    }
  } catch (error) {}
}

async function sendCategoryupdaterequest(params) {
  try {
    let options = {
      method: 'POST',
      uri: Config.links.storeCategorystatusupdate,
      body: params,
      json: true,
      rejectUnauthorized: false,
    };
    let response;
    if (Config.NEW_CHANNEL_API_ADDED) {
      let axiosResponse = await apiCall.put(options.uri, options.body, {
        headers: getHeadersforchannelforrender(),
      });
      response = axiosResponse.data;
    } else {
      response = await request(options);
    }
    if (response && response.status == 200) {
      window.notifyUser.showMessage(
        'success',
        response.data ||
          $.i18n.t('controller:onlineorderstorenotification.Updaterequestsent'),
      );
    } else {
      window.notifyUser.showMessage(
        'error',
        response.data || $.i18n.t('controller:login.somethingwentWrong'),
      );
    }
  } catch (error) {
    console.log(error);
  }
  if (Swal.isVisible()) Swal.close();
}

async function showLoader(params) {
  Swal.fire({
    title: params.title,
    text: params.text,
    showConfirmButton: false,
    width: '23em',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
      params.event(params.args);
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
  });
}

/**
 * Make's an actual request to get items
 * @param {Store ID} store_id
 */
async function makegetItemsrequest({ store_id }) {
  let options = {
    method: 'POST',
    uri: Config.links.storeItems,
    form: { store_id },
    json: true,
    rejectUnauthorized: false,
  };
  try {
    let response;
    if (Config.NEW_CHANNEL_API_ADDED) {
      let axiosResponse = await apiCall.get(options.uri, {
        params: { store_id },
        headers: getHeadersforchannelforrender(),
      });
      response = axiosResponse.data;
    } else {
      response = await request(options);
    }

    if (['200', 200].includes(response.status)) {
      if (response.msg != undefined && response.msg.length > 0) {
        $('#storeItemstableId').DataTable().clear().draw();
        $('#storeItemstableId').DataTable().rows.add(response.msg); // Add new data
        $('#storeItemstableId').DataTable().columns.adjust().draw(); // Redraw the DataTable
      }
    }
  } catch (error) {
    console.log(error);
  }
  Swal.close();
}

async function makegetItemsrequest2({ store_id, category_refid }) {
  let options = {
    method: 'POST',
    uri: Config.links.sotreItemsbycat,
    body: { store_id, category_refid },
    json: true,
    rejectUnauthorized: false,
  };
  try {
    // let response = await request(options);
    let response;
    if (Config.NEW_CHANNEL_API_ADDED) {
      let axiosResponse = await apiCall.post(
        options.uri,
        {
          store_id,
          category_refid,
        },
        {
          headers: getHeadersforchannelforrender(),
        },
      );
      response = axiosResponse.data;
    } else {
      response = await request(options);
    }

    if (response.status == '200') {
      if (response.msg != undefined && response.msg.length > 0) {
        $('#storeItemstableId').DataTable().clear().draw();
        $('#storeItemstableId').DataTable().rows.add(response.msg); // Add new data
        $('#storeItemstableId').DataTable().columns.adjust().draw(); // Redraw the DataTable
      }
    }
  } catch (error) {
    console.log(error);
  }
  Swal.close();
}

async function getCategoriesforfilter() {
  let store_id = $(
    '#parentcurrentStoresoptionsid option:selected:not([disabled])',
  ).attr('value');
  if (store_id) {
    makegetStorecategoriessrequest({ store_id, forFilters: true });
  }
}

async function makegetStorecategoriessrequest({ store_id, forFilters }) {
  let payload = {
    store_id,
    tmpos_id,
    tracking_id: window.tmpos_id,
  };
  try {
    let axiosResponse = await apiCall.post(
      Config.links.storeCategories,
      payload,
      {
        headers: getHeadersforchannelforrender(),
      },
    );
    let response = axiosResponse.data;
    if (['200', 200].includes(response.status)) {
      if (response.msg != undefined && response.msg.length > 0) {
        if (forFilters) {
          $('#filterstoreitemsbycatOptions option:gt(0)').remove();
          $('<option>')
            .val(0)
            .text('All')
            .appendTo('#filterstoreitemsbycatOptions');
          for (const cat of response.msg) {
            $('<option>')
              .val(cat.category_id)
              .text(cat.category_name)
              .appendTo('#filterstoreitemsbycatOptions');
          }
          $('#filterstoreitemsbycatOptions').selectpicker('refresh');
        } else {
          $('#storeCategoriestableId').DataTable().clear().draw();
          $('#storeCategoriestableId').DataTable().rows.add(response.msg); // Add new data
          $('#storeCategoriestableId').DataTable().columns.adjust().draw(); // Redraw the DataTable
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
  if (Swal.isVisible()) Swal.close();
}

async function makegetStoreoptionssrequest({ store_id }) {
  let options = {
    method: 'POST',
    uri: Config.links.storeOptions,
    form: {
      store_id,
    },
    json: true,
    rejectUnauthorized: false,
  };
  try {
    let response;
    if (Config.NEW_CHANNEL_API_ADDED) {
      let axiosResponse = await apiCall.get(options.uri, {
        params: { store_id },
        headers: getHeadersforchannelforrender(),
      });
      response = axiosResponse.data;
    } else {
      response = await request(options);
    }

    if (['200', 200].includes(response.status)) {
      if (response.msg != undefined && response.msg.length > 0) {
        $('#storeoptionssTableId').DataTable().clear().draw();
        $('#storeoptionssTableId').DataTable().rows.add(response.msg); // Add new data
        $('#storeoptionssTableId').DataTable().columns.adjust().draw(); // Redraw the DataTable
      }
    }
  } catch (error) {
    console.log(error);
  }
  if (Swal.isVisible()) Swal.close();
}
/**
 * Adds platforms to a list
 */
async function addPlatforms() {
  addTitles();
  if (STORES_INFO && STORES_INFO.length > 0) {
    STORES_INFO.forEach((store) => {
      let titleListitem = $('<li>', {
        class: 'platform-container listTitle',
      });

      let storeImage = $('<img>', {
        class: 'platform-img',
        src: store.icon,
        alt: store.storeName,
      });

      let storeTitle = $('<label>', {
        html: store.storeName,
      });
      let storeCheck = $('<input>', {
        class: 'plaformcheckInput',
        type: 'checkbox',
        id: store.value + '_platformStatuscheck',
        platfomValue: store.value,
      });
      let storecheckLabel = $('<label>', {
        for: store.value + '_platformStatuscheck',
      });

      titleListitem.append(storeImage);
      titleListitem.append(storeTitle);
      titleListitem.append(storeCheck);
      titleListitem.append(storecheckLabel);
      $('#platformListid').append(titleListitem);
    });
  }
}

/**
 * Adds title to the list
 */
function addTitles() {
  let titleListitem = $('<li>', {
    class: 'platform-container listTitle',
  });

  let iconTitle = $('<label>', {
    html: '#',
  });
  let platformTitle = $('<label>', {
    html: 'Name',
  });
  let statusTitle = $('<label>', {
    html: 'Status',
  });
  titleListitem.append(iconTitle);
  titleListitem.append(platformTitle);
  titleListitem.append(statusTitle);
  $('#platformListid').empty();
  $('#platformListid').append(titleListitem);
}

/**
 * Fetch the stores
 */
async function fetchStores() {
  let options = {
    method: 'POST',
    uri: Config.links.getStorelist,
    form: {
      tracking_id: window.tmpos_id,
    },
    body: {
      tracking_id: window.tmpos_id,
    },
    headers: getHeadersforchannelforrender(),
    json: true,
    rejectUnauthorized: false,
  };
  try {
    let response;
    if (Config.NEW_CHANNEL_API_ADDED) {
      let axiosResponse = await apiCall.get(options.uri, {
        params: options.body,
        headers: options.headers,
      });
      response = axiosResponse.data;
    } else {
      response = await request(options);
    }
    if (
      response &&
      response.status != undefined &&
      ['200', 200].includes(response.status)
    ) {
      let stores = response.msg;
      if (stores && stores.length > 0) {
        $('#parentcurrentStoresoptionsid option:gt(0)').remove();
        $('#currentStoresoptionsid4 option:gt(0)').remove();
        stores.forEach((store) => {
          let option = $('<option>').val(store.store_id).text(store.store_name);

          $('#parentcurrentStoresoptionsid').append(option);
        });
        if (stores.length == 1) {
          $('#parentcurrentStoresoptionsid').prop('selectedIndex', 1);
          getCategoriesforfilter();
        }
      }
    }
  } catch (error) {
    console.log(error);
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:onlineorderstorenotification.Somethingwentwrongwhilefetchingstores',
      ),
    );
  }
}

/**
 *
 * @param {Status of platform to change} status
 */
async function changePlatformstatus(status) {
  let currentStore = $(
    '#parentcurrentStoresoptionsid option:selected:not([disabled])',
  );
  if (currentStore.length > 0) {
    let selectedPlatform = [];
    $('#platformListid li input.plaformcheckInput:checked').each(function () {
      selectedPlatform.push($(this).attr('platfomValue'));
    });

    if (selectedPlatform.length > 0) {
      let store_id = $(currentStore).attr('value');
      if (store_id) {
        Swal.fire({
          title: $.i18n.t(
            'controller:swalDataTranslations.Updatingstorestatus',
          ),
          text: $.i18n.t(
            'controller:swalDataTranslations.Thiswilltakejustasecond',
          ),
          showConfirmButton: false,
          width: '23em',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading();
            requestPlatformstatuschange(selectedPlatform, store_id, status);
          },
          customClass: {
            popup: 'tmbill-swal-pop-up',
            title: 'tmbill-swal-title-class',
            content: 'tmbill-swal-title-class',
          },
        });
      }
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:onlineorderstorenotification.Pleaseselectatleastoneplatform',
        ),
        0,
      );
    }
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:onlineorderstorenotification.Pleaseselectthestore'),
      0,
    );
  }
}

async function sendnotificationUpdateinfo(isChecked) {
  let currentStore = $(
    '#parentcurrentStoresoptionsid option:selected:not([disabled])',
  );
  if (currentStore.length > 0) {
    let store_id = $(currentStore).attr('value');
    let send_notification_to = $(
      'input[name="notification-type"]:checked',
    ).attr('value');
    if (store_id) {
      Swal.fire({
        title: $.i18n.t(
          'controller:swalDataTranslations.Updatingnotifiationstatus',
        ),
        text: $.i18n.t(
          'controller:swalDataTranslations.Thiswilltakejustasecond',
        ),
        showConfirmButton: false,
        width: '23em',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
          requestnotificationTypechange({
            store_id,
            auto_accept: isChecked != undefined ? (isChecked ? 1 : 0) : -1,
            tracking_id: window.tmpos_id,
            send_notification_to,
          });
        },
        customClass: {
          popup: 'tmbill-swal-pop-up',
          title: 'tmbill-swal-title-class',
          content: 'tmbill-swal-title-class',
        },
      });
    }
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:onlineorderstorenotification.Pleaseselectthestore'),
      0,
    );
  }
}

async function requestnotificationTypechange(params) {
  try {
    let axiosResponse = await apiCall.post(
      Config.links.updateNotification,
      params,
      {
        headers: getHeadersforchannelforrender(),
      },
    );
    let response = axiosResponse.data;
    if (response && response.status) {
      if (response.status == 200) {
        let data = {
          id: SEND_SERVERNOTIFICATION_TO,
          value: params.send_notification_to,
        };

        updateSettings(data);

        if (
          window.settingsConfig[SEND_SERVERNOTIFICATION_TO - 1] != undefined &&
          window.settingsConfig[SEND_SERVERNOTIFICATION_TO - 1].id ==
            SEND_SERVERNOTIFICATION_TO
        ) {
          window.settingsConfig[SEND_SERVERNOTIFICATION_TO - 1].value =
            params.send_notification_to;
        }

        if (params.auto_accept == 0 || params.auto_accept == 1) {
          let data = {
            id: AUTO_ACCEPT_ONLINE_ORDER,
            value: params.auto_accept,
          };
          updateSettings(data);
        }
        window.notifyUser.showMessage(
          'success',
          $.i18n.t('controller:onlineorderstorenotification.Updated'),
        );
      }
    }
  } catch (error) {}
  if (Swal.isVisible()) {
    Swal.close();
  }
}

/**
 *
 * @param {Selected platforms which need their status modified} platforms
 * @param {Selected store id} store_id
 */
async function requestPlatformstatuschange(platforms, store_id, action) {
  let options = {
    method: 'POST',
    uri: Config.links.platformUpdatestatustest,
    body: {
      location_ref_id: store_id,
      action,
      platforms,
    },
    headers: {
      Authorization: 'apikey ' + window.ordersAPIKey,
    },
    json: true,
    rejectUnauthorized: false,
  };
  try {
    const axiosResponse = await apiCall.post(options.uri, options.body, {
      headers: options.headers,
    });
    const response = axiosResponse.data;
    if (response && response.status === 'success') {
      window.notifyUser.showMessage('success', response.message, 0);
    }
  } catch (error) {
    if (error.error && error.error.message) {
      console.log(error.error.message);
      window.notifyUser.showMessage('error', error.error.message, 0);
    }
  }
  Swal.close();
}

/**
 * Sends the disable request
 * @param {Item action} action
 */
async function checkSelectedItems(action) {
  let currentStore = $(
    '#parentcurrentStoresoptionsid option:selected:not([disabled])',
  );
  if (currentStore.length > 0) {
    let store_id = $(currentStore).attr('value');
    if (store_id) {
      Swal.fire({
        title: $.i18n.t(
          'controller:swalDataTranslations.Updatingstoreitemsstatus',
        ),
        text: $.i18n.t(
          'controller:swalDataTranslations.Thiswilltakejustasecond',
        ),
        showConfirmButton: false,
        width: '23em',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
          makechangeItemstatusrequest(
            store_id,
            Array.from(selecteditemsRefidlist),
            Array.from(selectedoptionsRefidlist),
            action,
          );
        },
        customClass: {
          popup: 'tmbill-swal-pop-up',
          title: 'tmbill-swal-title-class',
          content: 'tmbill-swal-title-class',
        },
      });
    }
  }
}

async function makechangeItemstatusrequest(
  store_id,
  item_ref_ids,
  option_ref_ids,
  action,
) {
  let options = {
    uri: Config.links.storeItemstatusupdate,
    body: {
      location_ref_id: store_id,
      item_ref_ids,
      option_ref_ids,
      action,
    },
    headers: {
      Authorization: 'apikey ' + window.ordersAPIKey,
    },
  };
  try {
    let axiosResponse = await apiCall.post(options.uri, options.body, {
      headers: options.headers,
    });
    let response = axiosResponse.data;
    if (response && response.status) {
      window.notifyUser.showMessage(response.status, response.message);
      selecteditemsRefidlist.clear();
      $('#storeItemstableId input.storeitemInputcheck').prop('checked', false);
      selectedoptionsRefidlist.clear();
      $('#storeoptionssTableId input.storeitemInputcheck').prop(
        'checked',
        false,
      );
    }
  } catch (error) {
    console.log(error);
    if (error.response && error.response.data) {
      let message = '';
      if (error.response.data.message) {
        message = error.response.data.message;
      }
      if (error.response.data.error_message) {
        message = error.error.error_message;
      }
      window.notifyUser.showMessage('error', message);
    }
  }
  Swal.close();
}

Intialize();
