const { default: axios } = require('axios');
const { default: Swal } = require('sweetalert2');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const { PLATFORM_MAPPING_TYPES, PLATFORM_ICONS } = require('../util/DBUtil');
const {
  initAccesslevelsfordigitalorderssettings,
} = require('./AccesslevelManager');
const { apiCall } = require('../services/APIService');
const {
  initializei18nforOnlinestorectrlwindowui,
} = require('./i18nController');

window.opendigiStoreScriptloaded = true;
const stringConstructor = 'test'.constructor;

let selecteditemsRefidlist = [];
let selectedCategories = [];
let selectedOptions = [];
let selectedMenuid;
let selectedplatformStoreid;
let selectedPlatform;
let allPlatforms;
let storeConfigtoupdate;
let isChanged = false;

/**
 * Initialize the components
 */
async function Intialize() {
  $('.nav-tabs a[href="#digistoressettingstabdivId"]').tab('show');
  resetUiDetils();
  initAccesslevelsfordigitalorderssettings();

  $('#parentcurrentdigiStoresoptionsid').on('change', async () => {
    const platformStoreId = $(
      '#parentcurrentdigiStoresoptionsid option:selected:not([disabled])',
    ).attr('value');

    const store = _.find(allPlatforms, { platform_store_id: platformStoreId });

    if (store) {
      let platform_menu;
      if (store.platform_menu.constructor === stringConstructor) {
        platform_menu = JSON.parse(store.platform_menu);
      } else {
        platform_menu = store.platform_menu;
      }

      selectedplatformStoreid = store.platform_store_id;
      selectedMenuid = platform_menu && platform_menu.menu_id;
      selectedPlatform = String(store.platforms || '');
      makegetItemsrequest();
      renderCurrentplatformstatus(store);
      initAccesslevelsfordigitalorderssettings();
    }
  });

  $('#getdigistoreItemsbutton').on('click', () => {
    makegetItemsrequest();
  });

  $('#digiitemsettingstabId').on('click', () => {
    if (!$('#digiStoreMenuUpdateButtonid').is(':visible')) {
      $('#digiStoreMenuUpdateButtonid').show();
    }
    setTimeout(() => {
      $('#digistoreItemstableId').DataTable().columns.adjust();
    }, 200);
  });

  $('#digistorecategoryettingstabId').on('click', () => {
    if (!$('#digiStoreMenuUpdateButtonid').is(':visible')) {
      $('#digiStoreMenuUpdateButtonid').show();
    }
    setTimeout(() => {
      $('#digistoreCategoriestableId').DataTable().columns.adjust();
    }, 200);
  });

  $('#digistoreoptionsettingstabId').on('click', () => {
    if (!$('#digiStoreMenuUpdateButtonid').is(':visible')) {
      $('#digiStoreMenuUpdateButtonid').show();
    }
    setTimeout(() => {
      $('#digistoreoptionssTableId').DataTable().columns.adjust();
    }, 200);
  });

  $('#digitalfilterstoreitemsField').keyup(function () {
    const value = $(this).val().trim();
    $('#digistoreItemstableId')
      .DataTable()
      .search(value.normalize ? value.normalize('NFC') : value, false, false)
      .draw();
  });
  $('#digistoreItemstableId_filter').hide();

  $('#digitalfilterstoreoptionsField').keyup(function () {
    $('#digistoreoptionssTableId').DataTable().search($(this).val()).draw();
  });
  $('#digistoreoptionssTableId_filter').hide();

  $('#digistorePublishMenutabId').on('click', () => {
    if ($('#digiStoreMenuUpdateButtonid').is(':visible')) {
      $('#digiStoreMenuUpdateButtonid').hide();
    }
  });

  if ($.i18n) {
    initializei18nforOnlinestorectrlwindowui();
  } else {
    setTimeout(initializei18nforOnlinestorectrlwindowui, 400);
  }

  // Update items checkbox change
  $(document).on(
    'change',
    '#digistoreItemstableId input.digistoreitemInputcheck',
    function () {
      const itemId = $(this).attr('item_id');
      const short_code = $(this).attr('short_code');
      const title = $(this).attr('title');
      const itemObj = {
        item_refid: Number(itemId),
        is_active: $(this).is(':checked') ? 1 : 0,
        short_code,
        title,
      };
      const obj = selecteditemsRefidlist.find((x) => x.item_refid == itemId);
      if (obj) {
        const index = selecteditemsRefidlist.indexOf(obj);
        selecteditemsRefidlist[index].is_active = $(this).is(':checked')
          ? 1
          : 0;
      } else {
        selecteditemsRefidlist.push(itemObj);
      }
      isChanged = true;
    },
  );

  // Update categories checkbox change
  $(document).on(
    'change',
    '#digistoreCategoriestableId input.storeCategoryInputcheck',
    function () {
      const categoryId = $(this).attr('category_refid');
      const categoryObj = {
        category_refid: categoryId,
        is_active: $(this).is(':checked') ? 1 : 0,
      };
      const obj = selectedCategories.find(
        (x) => x.category_refid == categoryId,
      );
      if (obj) {
        const index = selectedCategories.indexOf(obj);
        selectedCategories[index].is_active = $(this).is(':checked') ? 1 : 0;
      } else {
        selectedCategories.push(categoryObj);
      }
      isChanged = true;
    },
  );

  // Update options checkbox change
  $(document).on(
    'change',
    '#digistoreoptionssTableId input.storeOptionsInputcheck',
    function () {
      const optionId = $(this).attr('item_id');
      const short_code = $(this).attr('short_code');
      const is_addon = $(this).attr('is_addon');
      let item_ids = $(this).attr('item_ids');
      const title = $(this).attr('title');
      const modifier_group_id = $(this).attr('modifier_group_id');

      if (item_ids) {
        item_ids = item_ids.split(',');
      }

      const optionObj = {
        option_item_id: optionId,
        is_active: $(this).is(':checked') ? 1 : 0,
        short_code,
        is_addon,
        item_ids,
        title,
        modifier_group_id,
      };
      const obj = selectedOptions.find((x) => x.option_item_id == optionId);
      if (obj) {
        const index = selectedOptions.indexOf(obj);
        selectedOptions[index].is_active = $(this).is(':checked') ? 1 : 0;
      } else {
        selectedOptions.push(optionObj);
      }
      isChanged = true;
    },
  );

  // Update store checkbox change
  $(document).on(
    'change',
    '#digistoretableId input.digistoreInputcheck',
    async function () {
      isChanged = true;
      if (!navigator.onLine) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:commonUtils.noInternetConnection'),
        );
        return;
      }
      const platform_id = $(this).attr('platform_store_id');
      const platformDetails = allPlatforms.find(
        (x) => x.platform_store_id == platform_id,
      );

      const is_active = $(this).is(':checked') ? 1 : 0;
      showLoader({
        title: $.i18n.t(
          'controller:digitalStoreSettingNotifications.Updatingstorestatus',
        ),
        text: $.i18n.t(
          'controller:digitalStoreSettingNotifications.Thiswilltakejustsecond',
        ),
      });

      try {
        const result = await apiCall.post(
          Config.links.updateplatformStorestatus,
          {
            store_id: platformDetails.store_id,
            platform_store_id: platformDetails.platform_store_id,
            platform: String(
              platformDetails.platforms || platformDetails.platform,
            ).split(','),
            status: String(is_active),
          },
          {
            headers: getHeadersformposforrender(),
          },
        );

        if (result) {
          Swal.close();
          if (result && result.data.data.code == 200) {
            window.notifyUser.showMessage(
              'success',
              $.i18n.t(
                'controller:digitalStoreSettingNotifications.Storestatusupdatedsuccessfully',
              ),
            );
          }
        }
      } catch (error) {
        console.log(error);
        Swal.close();
      }
      if (Swal.isVisible()) Swal.close();
    },
  );

  $('#digiStoreMenuUpdateButtonid').on('click', () => {
    processupdateButtonclick();
  });

  $('#digipublishMenubuttonid').on('click', () => {
    makePublishMenuRequest();
  });

  // ============================================================
  // NATIVE SELECT FILTERS - CATEGORY AND STATUS
  // ============================================================
  // Category filter change event
  $('#filterdigistoreitemsbycatOptions').on('change', function () {
    console.log('Category filter changed to:', $(this).val());
    applyItemsTableFilters();
  });

  // Status filter change event - THIS HANDLES ACTIVE/INACTIVE
  $('#filterdigistoreitemsbystatusOptions').on('change', function () {
    console.log('Status filter changed to:', $(this).val());
    applyItemsTableFilters();
  });

  $('#getdigistoreItemsbutton,#getdigistoreOptionsbutton').on('click', () => {
    makegetItemsrequest();
  });

  $('#digiordersettingsModal').on('hide.bs.modal', async (e) => {
    if (isChanged) {
      e.preventDefault();
      const unsavedChangesConfirmation = await window.Swal.fire({
        title: 'Update Unsaved Changes',
        showConfirmButton: true,
        showCancelButton: true,
        width: '23em',
        allowOutsideClick: true,
        allowEscapeKey: false,
        confirmButtonText: 'Update',
        cancelButtonText: $.i18n.t('controller:orderController.Cancel'),
        customClass: {
          popup: 'tmbill-swal-pop-up',
          content: 'tmbill-swal-title-class',
          input: 'tmbill-swal-input2',
        },
      });

      if (
        unsavedChangesConfirmation &&
        unsavedChangesConfirmation.isConfirmed
      ) {
        isChanged = false;
        processupdateButtonclick();
      }
    }
  });
}

/**
 * ============================================================
 * COMBINED FILTER FUNCTION - HANDLES BOTH CATEGORY AND STATUS
 * ============================================================
 *
 * HOW ACTIVE/INACTIVE WORKS:
 *
 * In your HTML:
 * <select id="filterdigistoreitemsbystatusOptions">
 *   <option value="">All</option>
 *   <option value="1">Active</option>
 *   <option value="0">Inactive</option>
 * </select>
 *
 * In the table data (row object):
 * - row.active = 1 means ACTIVE (checkbox is checked)
 * - row.active = 0 means INACTIVE (checkbox is unchecked)
 *
 * How the filter works:
 * - User selects "Active" (value="1") from dropdown
 * - statusValue becomes "1"
 * - Function checks: if row.active == "1", show row
 * - User selects "Inactive" (value="0") from dropdown
 * - statusValue becomes "0"
 * - Function checks: if row.active == "0", show row
 * - User selects "All" (value="") from dropdown
 * - statusValue becomes ""
 * - Function shows all rows (no status filter applied)
 *
 * ============================================================
 */
function applyItemsTableFilters() {
  const categoryValue = String(
    $('#filterdigistoreitemsbycatOptions').val(),
  ).trim();
  const statusValue = String(
    $('#filterdigistoreitemsbystatusOptions').val(),
  ).trim();

  console.log('=== APPLYING FILTERS ===');
  console.log('Category Filter Value:', categoryValue);
  console.log('Status Filter Value:', statusValue);

  const table = $('#digistoreItemstableId').DataTable();

  // Remove any existing custom search filters
  $.fn.dataTable.ext.search.pop();

  // Add new custom filter function
  $.fn.dataTable.ext.search.push(function (settings, data, dataIndex) {
    // Only apply to items table
    if (settings.sTableId !== 'digistoreItemstableId') {
      return true;
    }

    const row = table.row(dataIndex).data();
    if (!row) {
      return true;
    }

    // ============================================================
    // CATEGORY FILTER LOGIC
    // ============================================================
    let categoryMatch = true;
    if (categoryValue && categoryValue !== '' && categoryValue !== '0') {
      // Specific category selected - filter by category_ref_ids
      categoryMatch = String(row.category_ref_ids) === categoryValue;
      console.log(
        'Category Check - Row:',
        row.title,
        'Row Category:',
        row.category_ref_ids,
        'Filter Category:',
        categoryValue,
        'Match:',
        categoryMatch,
      );
    }

    // ============================================================
    // STATUS FILTER LOGIC - ACTIVE/INACTIVE
    // ============================================================
    // row.active values: 1 = active (checked), 0 = inactive (unchecked)
    let statusMatch = true;
    if (statusValue && statusValue !== '') {
      const rowStatus = String(row.active); // Convert to string for comparison
      statusMatch = rowStatus === statusValue;
      console.log(
        'Status Check - Row:',
        row.title,
        'Row Status (active):',
        row.active,
        'Filter Status:',
        statusValue,
        'Match:',
        statusMatch,
      );
    }

    // Return true only if BOTH filters match
    const shouldShow = categoryMatch && statusMatch;

    if (!shouldShow) {
      console.log(
        'HIDING Row:',
        row.title,
        '(Category match:',
        categoryMatch,
        ', Status match:',
        statusMatch,
        ')',
      );
    }

    return shouldShow;
  });

  // Redraw table with new filters applied
  console.log('=== REDRAWING TABLE ===');
  table.draw();
}

/**
 * Throttle function - limits update requests
 */
function throttle(func, delay) {
  let lastExecution = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastExecution >= delay) {
      lastExecution = now;
      func.apply(this, args);
    } else {
      $(this).prop('checked', !$(this).is(':checked'));
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:digitalStoreSettingNotifications.Toomanyattemptspleasetryagainafterminute',
        ),
      );
    }
  };
}

// ADD THIS FUNCTION BEFORE makeUpdateDataRequest()
async function refreshTableAfterUpdate() {
  try {
    console.log('🔄 REFRESHING TABLE DATA FROM SERVER...');

    const axiosResponse = await apiCall.post(
      Config.links.getPlatformCatalogue,
      {
        store_id: window.storeDetails.store_id,
        platform_store_id: selectedplatformStoreid,
        platform: selectedPlatform,
      },
      {
        headers: getHeadersformposforrender(),
      },
    );

    const response = axiosResponse.data;

    if (response && ['200', 200].includes(response.status)) {
      // Clear and reload items table with fresh data
      if (
        response.result &&
        response.result.items &&
        response.result.items.length > 0
      ) {
        $('#digistoreItemstableId').DataTable().clear();
        $('#digistoreItemstableId').DataTable().rows.add(response.result.items);
        $('#digistoreItemstableId').DataTable().columns.adjust().draw();
      } else {
        $('#digistoreItemstableId').DataTable().clear().draw();
      }

      // Clear and reload categories table
      if (
        response.result &&
        response.result.category &&
        response.result.category.length > 0
      ) {
        for (const category of response.result.category) {
          const itemsInCategory = response.result.items.filter(
            (o) => o.category_ref_ids == category.category_refid,
          );

          if (
            itemsInCategory.length > 0 &&
            itemsInCategory.every((o) => o.active == 0)
          ) {
            Object.assign(category, { active: 0 });
          }
        }
        $('#digistoreCategoriestableId').DataTable().clear();
        $('#digistoreCategoriestableId')
          .DataTable()
          .rows.add(response.result.category);
        $('#digistoreCategoriestableId').DataTable().columns.adjust().draw();
      } else {
        $('#digistoreCategoriestableId').DataTable().clear().draw();
      }

      // Clear and reload options table
      if (
        response.result &&
        response.result.option_items &&
        response.result.option_items.length > 0
      ) {
        $('#digistoreoptionssTableId').DataTable().clear();
        $('#digistoreoptionssTableId')
          .DataTable()
          .rows.add(response.result.option_items);
        $('#digistoreoptionssTableId').DataTable().columns.adjust().draw();
        console.log('✅ Options table refreshed');
      } else {
        $('#digistoreoptionssTableId').DataTable().clear().draw();
      }

      // Reset filters and reapply
      $('#filterdigistoreitemsbycatOptions').val('');
      $('#filterdigistoreitemsbystatusOptions').val('');
      applyItemsTableFilters();
    } else {
      console.error('❌ Failed to fetch fresh data:', response);
    }
  } catch (error) {
    console.error('❌ Error refreshing table:', error);
  }
}

/**
 * Make update data request for items/categories/options
 */
async function makeUpdateDataRequest() {
  const table = $('#digistoreItemstableId').DataTable();
  const data = table.rows().data();
  const items = [];

  if (data) {
    data.map((item) => {
      items.push(item);
    });
  }

  if (!navigator.onLine) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:commonUtils.noInternetConnection'),
    );
    return;
  }

  if (selectedCategories && selectedCategories.length) {
    selectedCategories.forEach((category) => {
      items.forEach((item) => {
        if (item.category_ref_ids == category.category_refid) {
          const itemObj = {
            item_refid: Number(item.item_id),
            is_active: category.is_active,
            short_code: item.short_code,
          };

          selecteditemsRefidlist.push(itemObj);
        }
      });
    });
  }

  // --- BEGIN REPLACEMENT BLOCK ---
  /**
   * Make update data request for items/categories/options
   * OPTION 2: Backend-driven category logic (CORRECT FIX)
   */
  async function makeUpdateDataRequest() {
    if (!navigator.onLine) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:commonUtils.noInternetConnection'),
      );
      return;
    }

    // 🔎 DEBUG (keep for now)
    console.log('Updating menu...');
    console.log('Categories changed:', selectedCategories);
    console.log('Items changed:', selecteditemsRefidlist);
    console.log('Options changed:', selectedOptions);

    const payload = {
      store_id: window.storeDetails.store_id,
      menu_id: [selectedMenuid],

      // ✅ send category toggles AS categories
      categories: selectedCategories,

      // ✅ send ONLY explicitly changed items
      items: selecteditemsRefidlist,

      // unchanged
      options: selectedOptions,
      platform_store_id: selectedplatformStoreid,
    };

    showLoader({
      title: $.i18n.t('controller:menuManagement.Updatingmenu'),
      text: $.i18n.t('controller:menuManagement.Thiswilltakejustsecond'),
    });

    try {
      const result = await apiCall.post(
        Config.links.updateDigiStoreMenu,
        payload,
        {
          headers: getHeadersformposforrender(),
        },
      );

      Swal.close();

      if (result && result.data.status == 200) {
        // ✅ CLEAR STATE after successful update
        selectedCategories = [];
        selecteditemsRefidlist = [];
        selectedOptions = [];
        isChanged = false;

        betteripcRenderer.callMain('update-publish-menu-value', {
          value: 1,
          store_id: window.storeDetails.store_id,
        });

        window.notifyUser.showMessage('success', result.data.message);

        // 🔄 Reload fresh data from server
        setTimeout(() => {
          refreshTableAfterUpdate();
        }, 500);
      } else {
        window.notifyUser.showMessage('error', result.data.message);
      }
    } catch (error) {
      console.error(error);
      Swal.close();
    }
  }

  // Dedupe selecteditemsRefidlist to ensure a single entry per item (last-write wins)
  if (selecteditemsRefidlist && selecteditemsRefidlist.length) {
    const map = new Map();
    // iterate in order so later pushes override earlier ones
    selecteditemsRefidlist.forEach((it) => {
      map.set(String(it.item_refid), it);
    });
    selecteditemsRefidlist = Array.from(map.values());
  }
  // --- END REPLACEMENT BLOCK ---

  const payload = {
    store_id: window.storeDetails.store_id,
    menu_id: [selectedMenuid],
    categories: selectedCategories,
    items: selecteditemsRefidlist,
    options: selectedOptions,
    platform_store_id: selectedplatformStoreid,
  };

  showLoader({
    title: $.i18n.t('controller:menuManagement.Updatingmenu'),
    text: $.i18n.t('controller:menuManagement.Thiswilltakejustsecond'),
  });

  try {
    const result = await apiCall.post(
      Config.links.updateDigiStoreMenu,
      payload,
      {
        headers: getHeadersformposforrender(),
      },
    );

    if (result) {
      selectedCategories = [];
      selecteditemsRefidlist = [];
      Swal.close();
      if (result.data.status == 200) {
        betteripcRenderer.callMain('update-publish-menu-value', {
          value: 1,
          store_id: window.storeDetails.store_id,
        });
        window.notifyUser.showMessage('success', result.data.message);

        // Refresh table from server
        console.log('✅ UPDATE SUCCESS - Fetching fresh data from server...');
        setTimeout(() => {
          refreshTableAfterUpdate();
        }, 500);
      } else {
        window.notifyUser.showMessage('error', result.data.message);
      }
    }
  } catch (error) {
    console.log(error);
    Swal.close();
  }
}

/**
 * Update store status
 */
async function updateStorestatus() {
  try {
    showLoader({
      title: $.i18n.t(
        'controller:digitalStoreSettingNotifications.Updatingstorestatus',
      ),
      text: $.i18n.t(
        'controller:digitalStoreSettingNotifications.Thiswilltakejustsecond',
      ),
    });

    const result = await apiCall.post(
      Config.links.updateplatformStorestatus,
      {
        store_id: window.storeDetails.store_id,
        platform_store_id: selectedplatformStoreid,
        platform: String(selectedPlatform).split(','),
        status: storeConfigtoupdate.zomato || '0',
        extra_details: storeConfigtoupdate,
      },
      {
        headers: getHeadersformposforrender(),
      },
    );

    if (Swal.isVisible()) Swal.close();

    if (result && result.status == 200) {
      window.notifyUser.showMessage(
        'success',
        $.i18n.t(
          'controller:digitalStoreSettingNotifications.Storestatusupdatedsuccessfully',
        ),
      );
    }
  } catch (error) {
    Swal.close();
  }
}

const throttledUpdateStoreData = throttle(updateStorestatus, 60000);
const throttledUpdateMenuData = throttle(makeUpdateDataRequest, 60000);

/**
 * Process update button click
 */
function processupdateButtonclick() {
  isChanged = false;
  const ref_this = $('#digistoressettingstabListid li.nav-item a.active');
  if (ref_this) {
    if ($(ref_this).attr('id') === 'digistoresettingstabId') {
      throttledUpdateStoreData();
    } else {
      throttledUpdateMenuData();
    }
  }
}

/**
 * Publish menu to platforms
 */
async function makePublishMenuRequest() {
  if (!selectedplatformStoreid) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:digitalStoreSettingNotifications.Pleaseselectstore'),
    );
    return;
  }

  showLoader({
    title: $.i18n.t('controller:storeMenu.Gettingstoremenu'),
    text: $.i18n.t('controller:storeMenu.Thiswilltakejustsecond'),
  });

  const result = await apiCall.post(
    Config.links.publishDigiStoreMenu,
    {
      store_id: window.storeDetails.store_id,
      platform_store_id: [selectedplatformStoreid],
      platform: String(selectedPlatform).split(','),
    },
    {
      headers: getHeadersformposforrender(),
    },
  );

  const response = result.data;
  if (Swal.isVisible()) Swal.close();

  if (response) {
    Swal.close();
    if (response.status == 200) {
      window.notifyUser.showMessage('success', response.data.message);
    } else {
      window.notifyUser.showMessage('error', response.data.message);
    }
  }
}

/**
 * Add platform status element
 */
/**
 * Add platform status element — now includes platform name in Proper Case
 */
function toTitleCase(str = '') {
  return String(str)
    .toLowerCase()
    .split(/[\s\-_]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

function addPlatformstatuslement({ title, status, key, urbanpiper }) {
  const platformstatusContainerdiv = $('<div>', {
    class: 'platform-status-container',
    title,
  });

  // platform icon
  const img = $('<img>', {
    src: PLATFORM_ICONS[title] || PLATFORM_ICONS[key] || '',
  });
  platformstatusContainerdiv.append(img);

  // platform name (Proper Case). Use title or key as fallback.
  // If the title comes as UPPERCASE like "ZOMATO" it becomes "Zomato"
  const prettyName = toTitleCase(String(title || key || '').replace(/_/g, ' '));
  const nameDiv = $('<div>', {
    class: 'platform-name',
    text: prettyName,
    'aria-label': prettyName,
    title: prettyName,
  });
  platformstatusContainerdiv.append(nameDiv);

  // switch wrapper + input
  const switchWrapper = $('<label>', {
    type: 'switch',
    class: 'switch',
  });

  const input = $('<input>', {
    type: 'checkbox',
    checked: [1, '1'].includes(status),
    'data-title': title,
  });

  // when switch toggled, update config
  input.change(function () {
    const statusVal = $(this).is(':checked') ? '1' : '0';
    isChanged = true;
    if (!urbanpiper) {
      storeConfigtoupdate[key] = statusVal;
    } else {
      Object.assign(storeConfigtoupdate.urbanpiper, {
        ...storeConfigtoupdate.urbanpiper,
        [key]: statusVal,
      });
    }
  });

  switchWrapper.append(input);
  switchWrapper.append(`<span class="slider round"></span>`);
  platformstatusContainerdiv.append(switchWrapper);

  // append into correct list
  if (urbanpiper) {
    $(platformstatusContainerdiv).appendTo(
      '#digistoresettings-platformstatus-list-id',
    );
  } else {
    $(platformstatusContainerdiv).appendTo(
      '#digistoresettings-direct-platformstatus-list-id',
    );
  }
}

/**
 * Render current platform status
 */
function renderCurrentplatformstatus(platformStoredetils) {
  $(`#digistoresettings-platformstatus-list-id`).empty();
  $(`#digistoresettings-direct-platformstatus-list-id`).empty();
  storeConfigtoupdate = undefined;

  const associatedPlatforms = String(platformStoredetils.platforms || '').split(
    ',',
  );
  const associatePlatformstatus = platformStoredetils.extra_details;

  if (associatePlatformstatus) {
    storeConfigtoupdate = associatePlatformstatus;

    for (const iterator of associatedPlatforms) {
      console.log('iterator::', iterator);
      switch (iterator) {
        case PLATFORM_MAPPING_TYPES.ZOMATO:
          $('<div>', {
            text: $.i18n.t('controller:onlineOrderSettings.Platformstatus'),
            class: 'platform-title-container',
          }).appendTo('#digistoresettings-direct-platformstatus-list-id');
          addPlatformstatuslement({
            title: String(PLATFORM_MAPPING_TYPES.ZOMATO).toUpperCase(),
            status: associatePlatformstatus[PLATFORM_MAPPING_TYPES.ZOMATO],
            key: PLATFORM_MAPPING_TYPES.ZOMATO,
            urbanpiper: false,
          });
          break;

        case PLATFORM_MAPPING_TYPES.SWIGGY:
          $('<div>', {
            text: $.i18n.t('controller:onlineOrderSettings.Platformstatus'),
            class: 'platform-title-container',
          }).appendTo('#digistoresettings-direct-platformstatus-list-id');
          addPlatformstatuslement({
            title: String(PLATFORM_MAPPING_TYPES.SWIGGY).toUpperCase(),
            status: associatePlatformstatus[PLATFORM_MAPPING_TYPES.SWIGGY],
            key: PLATFORM_MAPPING_TYPES.SWIGGY,
            urbanpiper: false,
          });
          break;

        case PLATFORM_MAPPING_TYPES.RAFEEQ:
          $('<div>', {
            text: $.i18n.t('controller:onlineOrderSettings.Platformstatus'),
            class: 'platform-title-container',
          }).appendTo('#digistoresettings-direct-platformstatus-list-id');
          addPlatformstatuslement({
            title: String(PLATFORM_MAPPING_TYPES.RAFEEQ).toUpperCase(),
            status: associatePlatformstatus[PLATFORM_MAPPING_TYPES.RAFEEQ],
            key: PLATFORM_MAPPING_TYPES.RAFEEQ,
            urbanpiper: false,
          });
          break;

        case PLATFORM_MAPPING_TYPES.NOON_FOOD:
          $('<div>', {
            text: $.i18n.t('controller:onlineOrderSettings.Platformstatus'),
            class: 'platform-title-container',
          }).appendTo('#digistoresettings-direct-platformstatus-list-id');
          addPlatformstatuslement({
            title: String(PLATFORM_MAPPING_TYPES.NOON_FOOD).toUpperCase(),
            status: associatePlatformstatus[PLATFORM_MAPPING_TYPES.NOON_FOOD],
            key: PLATFORM_MAPPING_TYPES.NOON_FOOD,
            urbanpiper: false,
          });
          break;

        case PLATFORM_MAPPING_TYPES.CAREEM:
          $('<div>', {
            text: $.i18n.t('controller:onlineOrderSettings.Platformstatus'),
            class: 'platform-title-container',
          }).appendTo('#digistoresettings-direct-platformstatus-list-id');
          addPlatformstatuslement({
            title: String(PLATFORM_MAPPING_TYPES.CAREEM).toUpperCase(),
            status: associatePlatformstatus[PLATFORM_MAPPING_TYPES.CAREEM],
            key: PLATFORM_MAPPING_TYPES.CAREEM,
            urbanpiper: false,
          });
          break;

        case PLATFORM_MAPPING_TYPES.DELIVEROO:
          $('<div>', {
            text: $.i18n.t('controller:onlineOrderSettings.Platformstatus'),
            class: 'platform-title-container',
          }).appendTo('#digistoresettings-direct-platformstatus-list-id');
          addPlatformstatuslement({
            title: String(PLATFORM_MAPPING_TYPES.DELIVEROO).toUpperCase(),
            status: associatePlatformstatus[PLATFORM_MAPPING_TYPES.DELIVEROO],
            key: PLATFORM_MAPPING_TYPES.DELIVEROO,
            urbanpiper: false,
          });
          break;

        case PLATFORM_MAPPING_TYPES.SMILES:
          $('<div>', {
            text: $.i18n.t('controller:onlineOrderSettings.Platformstatus'),
            class: 'platform-title-container',
          }).appendTo('#digistoresettings-direct-platformstatus-list-id');
          addPlatformstatuslement({
            title: String(PLATFORM_MAPPING_TYPES.SMILES).toUpperCase(),
            status: associatePlatformstatus[PLATFORM_MAPPING_TYPES.SMILES],
            key: PLATFORM_MAPPING_TYPES.SMILES,
            urbanpiper: false,
          });
          break;

        case PLATFORM_MAPPING_TYPES.HUNGERSTATION:
          $('<div>', {
            text: $.i18n.t('controller:onlineOrderSettings.Platformstatus'),
            class: 'platform-title-container',
          }).appendTo('#digistoresettings-direct-platformstatus-list-id');
          addPlatformstatuslement({
            title: String(PLATFORM_MAPPING_TYPES.HUNGERSTATION).toUpperCase(),
            status:
              associatePlatformstatus[PLATFORM_MAPPING_TYPES.HUNGERSTATION],
            key: PLATFORM_MAPPING_TYPES.HUNGERSTATION,
            urbanpiper: false,
          });
          break;

        case PLATFORM_MAPPING_TYPES.KEETA:
          $('<div>', {
            text: $.i18n.t('controller:onlineOrderSettings.Platformstatus'),
            class: 'platform-title-container',
          }).appendTo('#digistoresettings-direct-platformstatus-list-id');
          addPlatformstatuslement({
            title: String(PLATFORM_MAPPING_TYPES.KEETA).toUpperCase(),
            status: associatePlatformstatus[PLATFORM_MAPPING_TYPES.KEETA],
            key: PLATFORM_MAPPING_TYPES.KEETA,
            urbanpiper: false,
          });
          break;

        case PLATFORM_MAPPING_TYPES.TALABAT:
          $('<div>', {
            text: $.i18n.t('controller:onlineOrderSettings.Platformstatus'),
            class: 'platform-title-container',
          }).appendTo('#digistoresettings-direct-platformstatus-list-id');
          addPlatformstatuslement({
            title: String(PLATFORM_MAPPING_TYPES.TALABAT).toUpperCase(),
            status: associatePlatformstatus[PLATFORM_MAPPING_TYPES.TALABAT],
            key: PLATFORM_MAPPING_TYPES.TALABAT,
            urbanpiper: false,
          });
          break;

        case PLATFORM_MAPPING_TYPES.URBANPIPER:
          if (associatePlatformstatus[PLATFORM_MAPPING_TYPES.URBANPIPER]) {
            const upsubPlatforms =
              associatePlatformstatus[PLATFORM_MAPPING_TYPES.URBANPIPER];
            let integratedPlatforms = [];

            for (const key in upsubPlatforms) {
              const element = upsubPlatforms[key];
              integratedPlatforms =
                upsubPlatforms && upsubPlatforms.platforms.split(',');

              if (
                Object.values(PLATFORM_MAPPING_TYPES).includes(key) &&
                integratedPlatforms &&
                integratedPlatforms.includes(key)
              ) {
                addPlatformstatuslement({
                  title: String(key).toUpperCase(),
                  status: element,
                  key,
                  urbanpiper: true,
                });
              }
            }
          }
          break;

        default:
          break;
      }
    }
  }
}

/**
 * Initialize store items table with DataTables
 */
async function initializeStoreitemstable(itemsList) {
  const language = {
    url: `../locales/${$.i18n.language}/datatable.json`,
  };

  // ============================================================
  // ITEMS TABLE INITIALIZATION
  // ============================================================
  $('#digistoreItemstableId').DataTable({
    ordering: false,
    scrollY: '46vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: true,
    bInfo: false,
    paging: true,
    order: [[1, 'asc']],
    language,
    search: {
      smart: false,
      caseInsensitive: true,
    },
    dom: 'lrtip',
    columns: [
      {
        title: $.i18n.t('tables:digiStoreSettingTableHeadings.SrNo'),
        data: 'srno',
      },
      {
        title: $.i18n.t('tables:digiStoreSettingTableHeadings.Itemname'),
        data: null,
        render(data, type, row) {
          const text =
            window.selectedLanguage !== 'en' && row.alternative_title
              ? row.alternative_title
              : row.title || '';

          if (type === 'display' || type === 'filter') {
            return text.normalize ? text.normalize('NFC') : text;
          }
          return row.title || '';
        },
      },
      { title: ' ', data: 'active' },
      {
        title: $.i18n.t('tables:digiStoreSettingTableHeadings.category'),
        data: 'category_ref_ids',
      },
    ],
    columnDefs: [
      {
        render(data, type, full, meta) {
          if (meta.row < itemsList.length) {
            itemsList[meta.row].srno = meta.row + 1;
          }
          return meta.row + 1;
        },
        targets: 0,
      },
      {
        targets: 3,
        visible: false,
        searchable: true,
      },
    ],
    createdRow(row, data, index) {
      if (data) {
        const statusInputcheck = $('<input>', {
          type: 'checkbox',
          class: 'digistoreitemInputcheck',
          id: `${data.item_id}_check`,
          item_id: data.item_id,
          short_code: data.short_code,
          title: data.title,
        });
        const statusInputchecklabel = $('<label>', {
          for: `${data.item_id}_check`,
          class: 'switch',
        });

        const spanEle = $('<span>', {
          class: 'slider round',
        });

        $(statusInputcheck).prop('checked', data.active);
        $(statusInputchecklabel).append(statusInputcheck).append(spanEle);

        $('td', row).eq(2).empty().append(statusInputchecklabel);
      }
    },
  });

  // ============================================================
  // CATEGORIES TABLE INITIALIZATION
  // ============================================================
  $('#digistoreCategoriestableId').DataTable({
    ordering: false,
    scrollY: '47vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: false,
    bInfo: false,
    paging: true,
    order: [[1, 'asc']],
    language,
    columns: [
      {
        title: $.i18n.t('tables:digiStoreSettingTableHeadings.SrNo'),
        data: 'srno',
      },
      {
        title: $.i18n.t('tables:digiStoreSettingTableHeadings.category'),
        data: 'category_name',
      },
      { title: '', data: 'active' },
    ],
    columnDefs: [
      {
        render(data, type, full, meta) {
          if (meta.row < itemsList.length) {
            itemsList[meta.row].srno = meta.row + 1;
          }
          return meta.row + 1;
        },
        targets: 0,
      },
    ],
    createdRow(row, data, index) {
      if (data) {
        const statusInputcheck = $('<input>', {
          type: 'checkbox',
          class: 'storeCategoryInputcheck',
          id: `${data.category_refid}_check`,
          category_refid: data.category_refid,
        });
        const statusInputchecklabel = $('<label>', {
          for: `${data.category_refid}_check`,
          class: 'switch',
        });

        const spanEle = $('<span>', {
          class: 'slider round',
        });

        $(statusInputcheck).prop('checked', data.active);
        $(statusInputchecklabel).append(statusInputcheck).append(spanEle);

        $('td', row).eq(2).empty().append(statusInputchecklabel);
        if (window.selectedLanguage !== 'en' && data.alternative_title) {
          $('td', row).eq(1).empty().append(data.alternative_title);
        }
      }
    },
  });

  // ============================================================
  // OPTIONS TABLE INITIALIZATION
  // ============================================================
  $('#digistoreoptionssTableId').DataTable({
    ordering: false,
    scrollY: '45vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: true,
    bInfo: false,
    paging: true,
    order: [[1, 'asc']],
    language,
    dom: 'lrtip',
    columns: [
      {
        title: $.i18n.t('tables:digiStoreSettingTableHeadings.SrNo'),
        data: 'srno',
      },
      {
        title: $.i18n.t(
          'tables:digiStoreSettingTableHeadings.ModifierItemName',
        ),
        data: 'title',
      },
      {
        title: $.i18n.t(
          'tables:digiStoreSettingTableHeadings.ModifierGroupName',
        ),
        data: 'option_group_name',
      },
      { title: '', data: 'active' },
    ],
    columnDefs: [
      {
        render(data, type, full, meta) {
          if (meta.row < itemsList.length) {
            itemsList[meta.row].srno = meta.row + 1;
          }
          return meta.row + 1;
        },
        targets: 0,
      },
    ],
    createdRow(row, data, index) {
      if (data) {
        const statusInputcheck = $('<input>', {
          type: 'checkbox',
          class: 'storeOptionsInputcheck',
          id: `${data.item_id}_check`,
          item_id: data.item_id,
          short_code: data.short_code,
          is_addon: data.is_addon,
          item_ids: data.item_ids,
          title: data.title,
          modifier_group_id: data.modifier_group_id,
        });
        const statusInputchecklabel = $('<label>', {
          for: `${data.item_id}_check`,
          class: 'switch',
        });

        const spanEle = $('<span>', {
          class: 'slider round',
        });

        $(statusInputcheck).prop('checked', data.active);
        $(statusInputchecklabel).append(statusInputcheck).append(spanEle);

        $('td', row).eq(3).empty().append(statusInputchecklabel);
        if (window.selectedLanguage !== 'en' && data.alternative_title) {
          $('td', row).eq(1).empty().append(data.alternative_title);
        }

        if (window.selectedLanguage !== 'en' && data.group_alternative_title) {
          $('td', row).eq(2).empty().append(data.group_alternative_title);
        }
      }
    },
  });
}

/**
 * Reset UI details
 */
function resetUiDetils() {
  selecteditemsRefidlist = [];
  selectedCategories = [];
  selectedOptions = [];
  selectedplatformMappingDetails = undefined;
  selectedMenuid = undefined;
  selectedplatformStoreid = undefined;
  selectedPlatform = undefined;
  $('#digistoreItemstableId').DataTable().clear().draw();
  $('#digistoreCategoriestableId').DataTable().clear().draw();
  $('#digistoreoptionssTableId').DataTable().clear().draw();
  $('#parentcurrentdigiStoresoptionsid').val(
    $('#parentcurrentdigiStoresoptionsid option:first').val(),
  );
  // Reset filter dropdowns to empty/all
  $('#filterdigistoreitemsbycatOptions').val('');
  $('#filterdigistoreitemsbystatusOptions').val('');
}

/**
 * Show loader
 */
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
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
  });
}

/**
 * Make get items request
 */
async function makegetItemsrequest() {
  try {
    let response;
    showLoader({
      title: $.i18n.t(
        'controller:digitalStoreSettingNotifications.gettingStoreMenu',
      ),
      text: $.i18n.t(
        'controller:digitalStoreSettingNotifications.loadingTakesSecond',
      ),
    });

    const axiosResponse = await apiCall.post(
      Config.links.getPlatformCatalogue,
      {
        store_id: window.storeDetails.store_id,
        platform_store_id: selectedplatformStoreid,
        platform: selectedPlatform,
      },
      {
        headers: getHeadersformposforrender(),
      },
    );

    response = axiosResponse.data;
    if (response) {
      Swal.close();
      if (['200', 200].includes(response.status)) {
        window.notifyUser.showMessage('success', response.message);

        // Load items
        if (
          response.result &&
          response.result.items &&
          response.result.items.length > 0
        ) {
          $('#digistoreItemstableId').DataTable().clear().draw();
          $('#digistoreItemstableId')
            .DataTable()
            .rows.add(response.result.items);
          $('#digistoreItemstableId').DataTable().columns.adjust().draw();
        } else {
          $('#digistoreItemstableId').DataTable().clear().draw();
        }

        // Load categories
        if (
          response.result &&
          response.result.category &&
          response.result.category.length > 0
        ) {
          // ✅ NEW CODE - Fixes duplicate
          // Clear ALL options completely
          $('#filterdigistoreitemsbycatOptions').empty();

          // Add ONE "All" option (selected by default)
          $('<option>')
            .val('')
            .text('All')
            .prop('selected', true) // ← Makes sure "All" is selected
            .appendTo('#filterdigistoreitemsbycatOptions');

          for (const category of response.result.category) {
            const itemsInCategory = response.result.items.filter(
              (o) => o.category_ref_ids == category.category_refid,
            );

            if (
              itemsInCategory.length > 0 &&
              itemsInCategory.every((o) => o.active == 0)
            ) {
              Object.assign(category, { active: 0 });
            }

            let categroyName = category.category_name;
            if (
              window.selectedLanguage !== 'en' &&
              category.alternative_title
            ) {
              categroyName = category.alternative_title;
            }
            $('<option>')
              .val(category.category_refid)
              .text(categroyName)
              .appendTo('#filterdigistoreitemsbycatOptions');
          }

          $('#digistoreCategoriestableId').DataTable().clear().draw();
          $('#digistoreCategoriestableId')
            .DataTable()
            .rows.add(response.result.category);
          $('#digistoreCategoriestableId').DataTable().columns.adjust().draw();
        } else {
          $('#digistoreCategoriestableId').DataTable().clear().draw();
        }

        // Load options
        if (
          response.result &&
          response.result.option_items &&
          response.result.option_items.length > 0
        ) {
          $('#digistoreoptionssTableId').DataTable().clear().draw();
          $('#digistoreoptionssTableId')
            .DataTable()
            .rows.add(response.result.option_items);
          $('#digistoreoptionssTableId').DataTable().columns.adjust().draw();
        } else {
          $('#digistoreoptionssTableId').DataTable().clear().draw();
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
  Swal.close();
}

/**
 * Fetch platforms
 */
async function fetchPlatforms() {
  try {
    const storeResult = await apiCall.post(
      window.Config.links.getPlatforms,
      {
        store_id: window.storeDetails.store_id,
      },
      {
        headers: getHeadersformposforrender(),
      },
    );

    if (storeResult && storeResult.data && storeResult.data.platform_mapping) {
      allPlatforms = storeResult.data.platform_mapping;
      $('#parentcurrentdigiStoresoptionsid option:gt(0)').remove();
      allPlatforms.forEach((store) => {
        const option = $('<option>')
          .val(store.platform_store_id)
          .text(store.store_name);

        $('#parentcurrentdigiStoresoptionsid').append(option);
      });
      if (selectedplatformStoreid) {
        $('#parentcurrentdigiStoresoptionsid').val(selectedplatformStoreid);
      }
    }
  } catch (error) {
    Swal.close();
    console.log(error);
  }
}

// Event listener for modal shown
$('#digiordersettingsModal').on('shown.bs.modal', (e) => {
  fetchPlatforms();
});

// Initialize on page load
initializeStoreitemstable([]);
Intialize();
