const {
  makeGetAllStoresRequest,
} = require('../../renderer/helper/Store.helper');

window.alladdedStoreslist = [];

// ipcRenderer.on(MISC_IPC.GET_ALL_STORES_LIST, (_event, storeslist) => {
//   if (storeslist && Array.isArray(storeslist) && storeslist.length) {
//     window.alladdedStoreslist = storeslist.map((s) => s.store_id);
//   } else {
//     window.alladdedStoreslist = [];
//   }
// });

async function fetchAllstores() {
  const storeslist = await makeGetAllStoresRequest();
  if (storeslist && Array.isArray(storeslist) && storeslist.length) {
    window.alladdedStoreslist = storeslist.map((s) => s.store_id);
  } else {
    window.alladdedStoreslist = [];
  }
}

function checkitemhasProductgroups(items, product_groups) {
  try {
    if (items && items.length && product_groups) {
      const itemsProductgrplist = items.map((i) => String(i.product_group_id));
      const productGroupstocheck = String(product_groups).split(',');
      if (
        itemsProductgrplist &&
        productGroupstocheck &&
        productGroupstocheck.length &&
        itemsProductgrplist.length
      ) {
        const hasProductgrps = itemsProductgrplist.some((r) =>
          productGroupstocheck.includes(r),
        );
        return hasProductgrps;
      }
    }
  } catch (error) {
    console.log(
      `Message="Error While Checking if item has product grps"`,
      error,
    );
  }
}

async function addTablenamesuggestions(elementId) {
  $(elementId).autocomplete({
    source: function (req, response) {
      const sourceData = [];
      const re = $.ui.autocomplete.escapeRegex(req.term);
      window.tableName_suggestions.forEach(function (tableName) {
        if (String(tableName).toLowerCase().includes(re.toLowerCase())) {
          sourceData.push({
            label: tableName,
            value: tableName,
          });
        }
      });
      response(sourceData);
    },
    appendTo: '#swal2-html-container',
    classes: {
      'ui-autocomplete': 'autocomplete-to-front ',
    },
    select: function (event, ui) {
      $(elementId).val(ui.item.value);
    },
  });
}

async function showSelecttablepopup() {
  let destinationtable;
  let destinationtableName;
  const result = await Swal.fire({
    title: $.i18n.t('controller:oldKotController.enterTableName'),
    text: $.i18n.t(
      'controller:oldKotController.selectedItemsWillBeShiftedToSelectedTable',
    ),
    html: `<input type="text" placeholder="Enter table name" class="transferTablename w-75">`,
    didOpen: async () => {
      await addTablenamesuggestions(
        '#swal2-html-container input.transferTablename',
      );
    },
    focusConfirm: false,
    width: '23em',
    customClass: {
      popup: 'tmbill-swal-pop-up',
      input: 'tmbill-swal-input',
      actions: 'oldkot-swal-action',
    },
    allowOutsideClick: () => !Swal.isLoading(),
    allowEscapeKey: () => !Swal.isLoading(),
    showCancelButton: true,
    width: '23em',
    preConfirm: async function () {
      let inputTable = $('#swal2-html-container input.transferTablename').val();
      if (inputTable && window.tableName_suggestions.includes(inputTable)) {
        let foundTable = $(
          '#tablesContainer button[name="' + inputTable + '"]',
        );

        if (foundTable.length > 0) {
          destinationtable = foundTable[0].data.id;
          destinationtableName = foundTable[0].data.table_name;

          return { destinationtable, destinationtableName };
        }
      }
      Swal.showValidationMessage(
        $.i18n.t('controller:oldKotController.invalidTableName'),
      );
      return false;
    },
  });
  return result;
}

function getFromAndToDateForReportsAsPerCloseDay({ fromDate, toDate }) {
  if (
    window.startEndDayDateData &&
    window.startEndDayDateData.startDayDates &&
    Object.keys(window.startEndDayDateData.startDayDates) &&
    Object.keys(window.startEndDayDateData.startDayDates).length > 0
  ) {
    const date = new Date(Number(fromDate));
    date.setHours(0, 0, 0, 0);
    let checkFromDate = date.getTime();
    const dates = window.startEndDayDateData.startDayDates[checkFromDate];
    if (dates && dates.length) {
      fromDate = dates[0];
    }

    if (!dates) {
      const values = Object.values(window.startEndDayDateData.startDayDates);
      const latestStartDayList = values[values.length - 1];
      const latestStartDay = latestStartDayList[latestStartDayList.length - 1];
      fromDate = latestStartDay;
    }
  }

  if (
    window.startEndDayDateData &&
    window.startEndDayDateData.closeDayDates &&
    Object.keys(window.startEndDayDateData.closeDayDates) &&
    Object.keys(window.startEndDayDateData.closeDayDates).length > 0
  ) {
    const date = new Date(Number(toDate));
    // date.setHours(23, 59, 59, 999);
    date.setHours(0, 0, 0, 0);
    const checkCloseDate = date.getTime();
    const dates = window.startEndDayDateData.closeDayDates[checkCloseDate];
    if (dates && dates.length) {
      toDate = dates[dates.length - 1];
      if (!toDate) {
        toDate = Date.now();
      }
    } else {
      toDate = Date.now();
    }
  }

  return { fromDate: Number(fromDate), toDate: Number(toDate) };
}

function getFromAndToDateForReportsAsPerCloseDayForMonthwiseReport({
  fromDate,
  toDate,
}) {
  if (
    window.startEndDayDateData &&
    window.startEndDayDateData.startDayDates &&
    Object.keys(window.startEndDayDateData.startDayDates) &&
    Object.keys(window.startEndDayDateData.startDayDates).length > 0
  ) {
    const date = new Date(Number(fromDate));
    date.setHours(0, 0, 0, 0);
    let checkFromDate = date.getTime();
    const dates = window.startEndDayDateData.startDayDates[checkFromDate];
    if (dates && dates.length) {
      fromDate = dates[0];
    }
  }

  if (
    window.startEndDayDateData &&
    window.startEndDayDateData.closeDayDates &&
    Object.keys(window.startEndDayDateData.closeDayDates) &&
    Object.keys(window.startEndDayDateData.closeDayDates).length > 0
  ) {
    const date = new Date(Number(toDate));
    // date.setHours(23, 59, 59, 999);
    date.setHours(0, 0, 0, 0);
    const checkCloseDate = date.getTime();
    const dates = window.startEndDayDateData.closeDayDates[checkCloseDate];
    if (dates && dates.length) {
      toDate = dates[dates.length - 1];
    }
  }

  return { fromDate: Number(fromDate), toDate: Number(toDate) };
}
module.exports = {
  getFromAndToDateForReportsAsPerCloseDay,
  showSelecttablepopup,
  fetchAllstores,
  checkitemhasProductgroups,
  getFromAndToDateForReportsAsPerCloseDayForMonthwiseReport,
};
