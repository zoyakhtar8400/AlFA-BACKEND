const { json2excel } = require('js2excel');
const { Chart } = require('chart.js/auto');
const { default: axios } = require('axios');
const { debounce } = require('lodash');
const { EXPENSES_IPC, OPEN_CASH_DRAWER } = require('../util/IPC_Messages');
const { formatAMPM } = require('../util/MiscUtil');
const { materialColor } = require('../util/MiscUtil');
const { initAccesslevelsformasters } = require('./AccesslevelManager');
const {
  initializei18nforExpensesmgmtctrlwindowui,
} = require('./i18nController');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const { apiCall } = require('../services/APIService');
const { FETCH_REPORT_AS_PER_CLOSE_DAY } = require('../util/SettingIDs');
const { getFromAndToDateForReportsAsPerCloseDay } = require('./RendererUtils');

// window.menuExpenseScriptLoaded = true;

window.expenseScriptLoaded = true;

const FOR_ALLEXPENSES = 1;
const FOR_NCEEXPENSES = 2;

let overviewChart;
let expenseslineChart;
const nceexpenseslineChart = undefined;
let expensepieChart;
let nceexpensepieChart;
let fetchReportAsPerCloseDay = true;

async function openCashDrawerRequest() {
  try {
    window.ipcRenderer.send(OPEN_CASH_DRAWER, {});
  } catch (error) {
    console.error(error);
  }
  // window.ipcRenderer.send('open-cash-drawer', {});
  return undefined;
}

function Initialize() {
  fetchReportAsPerCloseDay =
    window.settingsConfig[FETCH_REPORT_AS_PER_CLOSE_DAY - 1].value === '1';
  $('#expensesubCategorieslist').on('change', () => {
    const isCategorySelected = $('#expenseCategorieslist').find(
      'option:selected',
    );
    if (isCategorySelected[0].index == 0) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:expenseNotifications.Pleaseselectcategoryfirst'),
      );
      $('#expensesubCategorieslist').prop('selectedIndex', 0);
      $('#expensesubcatFieldid').val('');
    }
  });

  $('#deleteselectedExpense').hide();
  $('#deleteselectedExpense').on('click', () => {
    deleteselectedExpense();
  });
  $('.expense-tabs a[href="#home"]').tab('show');
  $('#expenseCategorieslist').on('change', function () {
    filterSubcats($(this).find('option:selected'));
  });
  $('#exportallExpenses').on('click', () => {
    exportExcel(FOR_ALLEXPENSES);
  });

  $('#exportnceExpenses').on('click', () => {
    exportExcel(FOR_NCEEXPENSES);
  });

  $('#refreshgraphsButton').on('click', () => {
    getgraphData();
  });

  $('#addExpensebutton').on(
    'click',
    debounce(() => {
      addExpense();
    }, 800),
  );

  $('#fetchexpensebydateButton').on('click', () => {
    fetchExpenses();
  });

  $('#expensesalltabid').on('click', () => {
    fetchExpenses();
  });

  $('#expensesGraphstabid').on('click', () => {
    getgraphData();
  });

  $('#expensesncrReporttabid').on('click', () => {
    fetchnceExpenses();
  });

  $('#fetchallexpensesButton').on('click', () => {
    ipcRenderer.send(
      EXPENSES_IPC.GET_EXPENSES,
      JSON.stringify({
        type: FOR_ALLEXPENSES,
        is_chargable: 0,
      }),
    );
  });

  $('#fetchnceexpensebydateButton').on('click', () => {
    fetchnceExpenses();
  });

  $('#fetchallnceexpensesButton').on('click', () => {
    ipcRenderer.send(
      EXPENSES_IPC.GET_EXPENSES,
      JSON.stringify({
        is_chargable: 1,
        type: FOR_NCEEXPENSES,
      }),
    );
  });
  $('#openaddExpensebutton').on('click', () => {
    $('#expensedateField').daterangepicker({
      timePicker: true,
      singleDatePicker: true,
      startDate: moment(),
      maxDate: window.moment().endOf('day'),
      drops: 'up',
      locale: {
        format: 'YYYY/MM/DD hh:mm A',
      },
    });
    ipcRenderer.send(EXPENSES_IPC.GET_PAYMENT_MODES, '');
    $('#expensesModal').modal('toggle');
  });

  $('#openCashDrawerOnExpensesbuttonid').on('click', () => {
    openCashDrawerRequest();
  });

  $('#openaddCategorybutton').on('click', () => {
    if (!navigator.onLine) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:expenseController.noInternetConnection'),
      );
      return;
    }
    $('#expensescategoryModal').modal('toggle');
  });

  $('#openaddSubcategorybutton').on('click', () => {
    if (!navigator.onLine) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:expenseController.noInternetConnection'),
      );
      return;
    }
    $('#expensesubcategoryModal').modal('toggle');
  });

  $('#expensesModal').on('hidden.bs.modal', () => {
    clearcurrentExpensedata();
  });

  $('#addnewExpensecatbutton').on('click', () => {
    showLoader(
      'Expense category',
      $.i18n.t('controller:expenseController.addingCategoryPleaseWait'),
      addexpenseCategory,
      0,
    );
  });
  $('#updateExpensecatbutton').on('click', () => {
    showLoader(
      'Expense category',
      $.i18n.t('controller:expenseController.updatingCategoryPleaseWait'),
      addexpenseCategory,
      1,
    );
  });

  $('#addnewExpensesubcatbutton').on('click', () => {
    showLoader(
      'Expense Sub-category',
      $.i18n.t('controller:expenseController.addingSubCategoryPleaseWait'),
      addexpensesubCategory,
      0,
    );
  });

  $('#updateExpensesubcatbutton').on('click', () => {
    showLoader(
      'Expense Sub-category',
      $.i18n.t('controller:expenseController.updatingSubCategoryPleaseWait'),
      addexpensesubCategory,
      1,
    );
  });

  $(document).on('click', '#expense-category-list-containerid li', function () {
    $('#expense-category-list-containerid li').removeClass(
      'selectedExpensecat',
    );
    $(this).addClass('selectedExpensecat');
  });

  $(document).on(
    'click',
    '#expense-subcategory-list-containerid li',
    function () {
      $('#expense-subcategory-list-containerid li').removeClass(
        'selectedExpensecat',
      );
      $(this).addClass('selectedExpensecat');
    },
  );

  $('#refeshexpenseOverviewbutton').on('click', () => {
    getOverviewdata();
  });
  // Date field
  $('#expensedateField').daterangepicker({
    timePicker: true,
    singleDatePicker: true,
    startDate: moment(),
    maxDate: window.moment().endOf('day'),
    locale: {
      format: 'YYYY/MM/DD hh:mm A',
    },
  });

  $('#graphdateField').daterangepicker({
    timePicker: true,
    startDate: moment().startOf('month'),
    endDate: moment().endOf('month'),
    locale: {
      format: 'YYYY/MM/DD hh:mm A',
    },
  });

  $(
    '#allexpensefromdateField,#allnceexpensefromdateField,#graphdateField',
  ).daterangepicker({
    timePicker: true,
    locale: {
      format: 'YYYY/MM/DD hh:mm A',
    },
    ranges: {
      [$.i18n.t('common:timeRange.Today')]: [
        window.moment().subtract(1, 'days').startOf('day'),
        window.moment().subtract(1, 'days').endOf('day'),
      ],
      [$.i18n.t('common:timeRange.Yesterday')]: [
        window.moment().subtract(1, 'days').startOf('day'),
        window.moment().subtract(1, 'days').endOf('day'),
      ],
      [$.i18n.t('common:timeRange.lastSevenDays')]: [
        window.moment().subtract(6, 'days').startOf('day'),
        window.moment().endOf('day'),
      ],
      [$.i18n.t('common:timeRange.lastThirtyDays')]: [
        window.moment().subtract(29, 'days').startOf('day'),
        window.moment().endOf('day'),
      ],
      [$.i18n.t('common:timeRange.thisMonth')]: [
        window.moment().startOf('month'),
        window.moment().endOf('month'),
      ],
      [$.i18n.t('common:timeRange.lastMonth')]: [
        window.moment().subtract(1, 'month').startOf('month'),
        window.moment().subtract(1, 'month').endOf('month'),
      ],
    },
  });

  inittables();
  getOverviewdata();
  initAccesslevelsformasters();
  ipcRenderer.send(EXPENSES_IPC.GET_EXPENSEDATA, undefined);

  $('#gobacktomenumangemtfromexpenseview').on('click', () => {
    $('#expenseManagementwindowWrapperid').hide();
    $('#menuManagementwindowWrapperid').show();
  });

  setTimeout(() => {
    if (
      window.menuExpenseAccessLevels &&
      typeof window.applyExpenseAccessLevels === 'function'
    ) {
      window.applyExpenseAccessLevels(window.menuExpenseAccessLevels);
    }
  }, 0);

  if ($.i18n) {
    initializei18nforExpensesmgmtctrlwindowui();
  } else {
    setTimeout(initializei18nforExpensesmgmtctrlwindowui, 400);
  }
}

async function deleteselectedExpense() {
  let selectedExpense = $('#overviewexpensesTable tbody tr.selectedbillRow');
  if (selectedExpense.length > 0) {
    selectedExpense = selectedExpense[0];
    const expense_id = $(selectedExpense).attr('expense_id');
    if (expense_id) {
      ipcRenderer.send(
        EXPENSES_IPC.DELETE_EXPENSE,
        JSON.stringify({
          expense_id,
        }),
      );
      $(selectedExpense).remove();
    }
  }
}

/**
 * Exports the data to excel
 * @param {Report type} type
 */
function exportExcel(type) {
  let tableid;
  let title = $.i18n.t('controller:expenseController.Expenses');
  switch (type) {
    case FOR_ALLEXPENSES:
      tableid = '#allexpensesTable';
      title = 'All Expenses';
      break;
    case FOR_NCEEXPENSES:
      tableid = '#nceexpensesTable';
      title = 'NCE Expenses';
      break;
    default:
      break;
  }

  if (tableid) {
    {
      const table = $(tableid).DataTable();
      const data = table.rows().data();
      if (data.length == 0) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:expenseController.noData'),
        );
        return;
      }
      const exportData = [];
      let totalAmount = 0;
      for (let index = 0; index < data.length; index++) {
        totalAmount += data[index].amount;
        const tempData = {
          ID: data[index].expense_id,
          Category: data[index].category_name,
          'Sub-category': data[index].sub_category_name,
          Amount: data[index].amount,
          'Payment Mode': data[index].payment_mode,
          Date: data[index].expense_time_2,
          Description: data[index].description,
          Chargable: data[index].is_chargable == 1 ? 'Yes' : 'No',
        };
        exportData.push(tempData);
      }

      const totalTitles = {
        Description: 'Total Expenses',
        Chargable: 'Total Amount',
      };

      const totalTitlesdata = {
        Description: exportData.length,
        Chargable: totalAmount,
      };
      exportData.push({});
      exportData.push(totalTitles);
      exportData.push(totalTitlesdata);
      try {
        json2excel({
          data: exportData,
          name: title,
        });
      } catch (e) {
        console.log(e);
      }
    }
  }
}
window.clearExpensesdatafromremote = function () {
  clearExpensesdata();
};
/**
 * clears the expenses window
 */
function clearExpensesdata() {
  getOverviewdata();
  ipcRenderer.send(EXPENSES_IPC.GET_EXPENSEDATA, undefined);
  $('#todaysexpenseTotalid').html(`${window.currency} 0`);
  $('#totalexpenseTotalid').html(`${window.currency} 0`);
  $('#monthsexpenseTotalid').html(`${window.currency} 0`);

  $('#allexpensesTable').DataTable().clear().draw();
  $('#allexpensesTable').DataTable().rows.add([]); // Add new data
  $('#allexpensesTable').DataTable().columns.adjust().draw(); // Redraw the DataTable
  $('#nceexpensesTable').DataTable().clear().draw();
  $('#nceexpensesTable').DataTable().rows.add([]); // Add new data
  $('#nceexpensesTable').DataTable().columns.adjust().draw(); // Redraw the DataTable
  if (overviewChart) {
    overviewChart.destroy();
  }
  if (expenseslineChart) {
    expenseslineChart.destroy();
  }
  if (nceexpenseslineChart) {
    nceexpenseslineChart.destroy();
  }
  if (expensepieChart) {
    expensepieChart.destroy();
  }
  if (nceexpensepieChart) {
    nceexpensepieChart.destroy();
  }
}

function filterSubcats(element) {
  const category_id = $(element).attr('value');

  // if first subcategory is selected then after selecting category deselect subcategory
  // because there may be category, sub-category mismatch
  if ($('#expensesubCategorieslist option:selected:not([disabled])')) {
    $('#expensesubCategorieslist').prop('selectedIndex', 0);
    $('#expensesubcatFieldid').val('');
  }

  $('#expensesubCategorieslist option').each(function (index) {
    const parent = $(this).attr('category_id');
    if (parent === category_id) {
      $(this).attr('disabled', false);
      $(this).show();
    } else {
      $(this).hide();
    }
  });
  // $('#expensesubCategorieslist').selectpicker('refresh');
}

function showLoader(title, text, _functiontoCall, flag) {
  Swal.fire({
    title,
    text,
    showConfirmButton: false,
    width: '23em',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();

      _functiontoCall(flag);
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
  });
}

/**
 * Add's new expense category
 */
async function addexpenseCategory(flag) {
  const category_name = $('#expensecatFieldid').val();
  if (category_name) {
    if (category_name.length > 38) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:expenseNotifications.Categorynamelengthshouldbelessthanthirtyeightcharacters',
        ),
      );
      return;
    }

    if (window.specialCharRegex.test(category_name)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:expenseNotifications.Specialcharactersarenotallowed',
        ),
      );
      return;
    }
  }
  if (category_name) {
    try {
      let current_category_id = window.generateId();
      if (flag == 1) {
        // Need to update the cat
        // get the selected id
        current_category_id = $(
          '#expense-category-list-containerid li.selectedExpensecat',
        ).attr('ref_id');
        if (current_category_id == undefined) {
          if (Swal.isVisible()) {
            Swal.close();
          }
          return;
        }
      }
      const postData = {
        category_name,
        parent_id: 0,
        store_id: window.storeDetails.store_id,
        flag, // 0 for add 1 for update,
        current_category_id,
      };
      const axiosResult = await apiCall.post(
        Config.links.addExpensecat,
        postData,
        {
          headers: getHeadersformposforrender(),
        },
      );
      const result = axiosResult.data;

      if (
        result &&
        result.status &&
        ['200', 200].includes(result.status) &&
        result.data
      ) {
        result.data.flag = flag;
        $('#expensecatFieldid').val('');
        ipcRenderer.send(
          EXPENSES_IPC.ADDORUPDATE_CATEGORY,
          JSON.stringify(result.data),
        );
        if (flag == 0) {
          window.notifyUser.showMessage(
            'success',
            $.i18n.t('controller:expenseController.expenseCategoryAdded'),
          );
        } else {
          window.notifyUser.showMessage(
            'success',
            $.i18n.t('controller:expenseController.expenseCategoryUpated'),
          );
        }
      } else if (result.status === '303') {
        reloginfromremote();
      } else if (result.status == 400) {
        window.notifyUser.showMessage('error', result.msg);
      } else {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:expenseController.somethingWentWrongPleaseTryAgain',
          ),
        );
      }
      // addtoExpensecategorylist({ name: category_name });
    } catch (error) {
      console.log(error);
      if ([401].includes(error?.response?.status)) {
        reloginfromremote();
      }
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:expenseController.somethingWentWrongPleaseTryAgain',
        ),
      );
    }
  } else {
    if (Swal.isVisible()) {
      Swal.close();
    }
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:expenseController.invalidExpenseCategory'),
    );
  }
}

/**
 * Add's new expense category
 */
async function addexpensesubCategory(flag) {
  const category_name = $('#expensesubcatFieldid').val();
  if (!category_name) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:expenseController.invalidSubExpenseCategory'),
    );
    return;
  }
  if (category_name) {
    if (category_name.length > 38) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:expenseNotifications.Subcategorynamelengthshouldbelessthanthirtyeightcharacters',
        ),
      );
      return;
    }

    if (window.specialCharRegex.test(category_name)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:expenseNotifications.Specialcharactersarenotallowed',
        ),
      );
      return;
    }
  }
  const category = $(
    '#expenseCategorieslistforsub option:selected:not([disabled])',
  );
  if (category.length == 0) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:expenseController.selectCategory'),
    );
    return;
  }

  const parent_id = $(category).attr('value');
  let current_category_id = window.generateId();
  if (flag == 1) {
    current_category_id = $(
      '#expense-subcategory-list-containerid li.selectedExpensecat',
    ).attr('ref_id');
    if (current_category_id == undefined) {
      if (Swal.isVisible()) {
        Swal.close();
      }
      return;
    }
  }

  const postData = {
    parent_id,
    category_name,
    store_id: window.storeDetails.store_id,
    flag, // 0 for add 1 for update,
    current_category_id,
  };
  try {
    const axiosResult = await apiCall.post(
      Config.links.addExpensecat,
      postData,
      {
        headers: getHeadersformposforrender(),
      },
    );
    const result = axiosResult.data;
    if (
      result &&
      result.status &&
      ['200', 200].includes(result.status) &&
      result.data
    ) {
      result.data.flag = flag;
      result.data.sub_category_name = result.data.category_name;
      result.data.category_id = result.data.parent_id;
      $('#expenseCategorieslistforsub').prop('selectedIndex', 0);
      $('#expensesubcatFieldid').val('');
      ipcRenderer.send(
        EXPENSES_IPC.ADDORUPDATE_SUBCATEGORY,
        JSON.stringify(result.data),
      );
      if (flag == 0) {
        window.notifyUser.showMessage(
          'success',
          $.i18n.t('controller:expenseController.expenseCategoryAdded'),
        );
      } else {
        window.notifyUser.showMessage(
          'success',
          $.i18n.t('controller:expenseController.expenseCategoryUpated'),
        );
      }
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:expenseController.somethingWentWrongPleaseTryAgain',
        ),
      );
    }
  } catch (error) {
    console.log(error);
    if ([401].includes(error?.response?.status)) {
      reloginfromremote();
    }
  }
  if (Swal.isVisible()) {
    Swal.close();
  }
}
/**
 * Make get overview window data request
 */
function getOverviewdata() {
  let fromDate = window.moment().startOf('day').format('x');
  let toDate = window
    .moment()
    .startOf('day')
    .add(23, 'hour')
    .add(59, 'minutes')
    .format('x');
  let monthStart = window.moment().startOf('month').format('x');
  let monthEnd = window.moment().endOf('month').format('x');

  if (fetchReportAsPerCloseDay) {
    const fromToDateresult = getFromAndToDateForReportsAsPerCloseDay({
      fromDate,
      toDate,
    });
    if (fromToDateresult.fromDate) {
      fromDate = Number(fromToDateresult.fromDate);
    }
    if (fromToDateresult.toDate) {
      toDate = Number(fromToDateresult.toDate);
    }

    // const monthfromToDateresult = getFromAndToDateForReportsAsPerCloseDay({
    //   monthStart,
    //   monthEnd,
    // });
    // if (monthfromToDateresult.fromDate) {
    //   monthStart = Number(monthfromToDateresult.fromDate);
    // }
    // if (monthfromToDateresult.toDate) {
    //   monthEnd = Number(monthfromToDateresult.toDate);
    // }
  }
  const requestData = {
    fromDate,
    toDate,
    monthStart,
    monthEnd,
  };
  window.ipcRenderer.send(
    EXPENSES_IPC.GET_OVERVIEWDATA,
    JSON.stringify(requestData),
  );
}

/**
 * Initialize the table
 */
function inittables() {
  $('#overviewexpensesTable').DataTable({
    ordering: false,
    searching: false,
    scrollY: '44vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: true,
    bInfo: false,
    paging: true,
    // autoWidth: false,
    order: [[1, 'asc']],
    language: {
      url: `../locales/${$.i18n.language}/datatable.json`,
    },
    columnDefs: [
      {
        targets: 2,
        width: '70px',
      },
    ],
    columns: [
      {
        title: $.i18n.t('tables:masterTableHeadings.Category'),
        data: 'category_name',
      },
      {
        title: $.i18n.t('tables:masterTableHeadings.subCategory'),
        data: 'sub_category_name',
      },
      { title: $.i18n.t('tables:masterTableHeadings.Amount'), data: 'amount' },
    ],
    createdRow(row, data, index) {
      $(row).attr('sync_flag', data.sync_flag);
      $(row).attr('expense_id', data.expense_id);
      // if (data.sync_flag == 0) {
      $('td', row).eq(2).attr('contenteditable', true);
      $('td', row).eq(2).addClass('editable editableExpense');
      // }
    },
  });
  $('#overviewexpensesTable').on('click', 'tbody tr', function (e) {
    $(this)
      .addClass('selectedbillRow')
      .siblings()
      .removeClass('selectedbillRow');
    try {
      if ($(this).attr('sync_flag') === '0') {
        $('#deleteselectedExpense').show();
      } else {
        $('#deleteselectedExpense').hide();
      }
    } catch (error) {
      $('#deleteselectedExpense').hide();
    }
  });
  $(document).on('blur', '#overviewexpensesTable tr .editable', function (e) {
    getOverviewdata();
    if ($(this).text()) {
      const expense_id = $(this).parent().attr('expense_id');
      let amount = $(this).text().replace(/ /g, '');
      try {
        amount = Number.parseFloat(amount);
        if (amount < 0) {
          notifyUser.showMessage(
            'error',
            $.i18n.t(
              'controller:expenseController.Amountshouldnotbenegativenumber',
            ),
          );
          return;
        }
        $(this).text(amount);
        ipcRenderer.send(
          EXPENSES_IPC.UPDATE_EXPENSE,
          JSON.stringify({
            expense_id,
            updateData: {
              amount,
              sync_flag: 0,
            },
          }),
        );
      } catch (error) {}
    }
  });
  $(document).on('keyup', '#overviewexpensesTable tr .editable', (e) => {
    if (e.keyCode === 13) {
      $('#openaddExpensebutton').focus();
    }
  });

  $('#overviewexpenseSearchid').keyup(function () {
    $('#overviewexpensesTable').DataTable().search($(this).val()).draw();
  });
  $('#overviewexpensesTable_filter').hide();

  $('#allexpensesTable').DataTable({
    ordering: false,
    searching: false,
    scrollY: '54vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: true,
    bInfo: false,
    paging: true,
    autoWidth: false,
    bAutoWidth: false,
    order: [[1, 'asc']],
    language: {
      url: `../locales/${$.i18n.language}/datatable.json`,
    },
    columns: [
      {
        title: $.i18n.t('tables:masterTableHeadings.Category'),
        data: 'category_name',
      },
      {
        title: $.i18n.t('tables:masterTableHeadings.subCategory'),
        data: 'sub_category_name',
      },
      { title: $.i18n.t('tables:masterTableHeadings.Amount'), data: 'amount' },
      {
        title: $.i18n.t('tables:masterTableHeadings.paymentMode'),
        data: 'payment_mode',
      },
      {
        title: $.i18n.t('tables:masterTableHeadings.Desc'),
        data: 'description',
      },
      {
        title: $.i18n.t('tables:masterTableHeadings.Date'),
        data: 'expense_time',
      },
    ],
    createdRow(row, data, index) {
      if (data.expense_time) {
        try {
          const d = new Date(parseInt(data.expense_time));
          const formattedDate = formatAMPM(d, false);
          data.expense_time_2 = formattedDate;
          $('td', row).eq(5).html(formattedDate);
        } catch (error) {}
      }
    },
  });
  $('#nceexpensesTable').DataTable({
    ordering: false,
    searching: false,
    scrollY: '54vh',
    bPaginate: false,
    bLengthChange: false,
    bFilter: true,
    bInfo: false,
    paging: true,
    order: [[1, 'asc']],
    language: {
      url: `../locales/${$.i18n.language}/datatable.json`,
    },
    columns: [
      {
        title: $.i18n.t('tables:masterTableHeadings.Category'),
        data: 'category_name',
      },
      {
        title: $.i18n.t('tables:masterTableHeadings.subCategory'),
        data: 'sub_category_name',
      },
      { title: $.i18n.t('tables:masterTableHeadings.Amount'), data: 'amount' },
      {
        title: $.i18n.t('tables:masterTableHeadings.paymentMode'),
        data: 'payment_mode',
      },
      {
        title: $.i18n.t('tables:masterTableHeadings.Desc'),
        data: 'description',
      },
      {
        title: $.i18n.t('tables:masterTableHeadings.Date'),
        data: 'expense_time',
      },
    ],
    createdRow(row, data, index) {
      if (data.expense_time) {
        try {
          const d = new Date(parseInt(data.expense_time));
          const formattedDate = formatAMPM(d, false);
          data.expense_time_2 = formattedDate;
          $('td', row).eq(5).html(formattedDate);
        } catch (error) {}
      }
    },
  });
}

/**
 * Makes get graph data request
 */
function getgraphData() {
  const fromDate = $('#graphdateField')
    .data('daterangepicker')
    .startDate.format('x');
  const toDate = $('#graphdateField')
    .data('daterangepicker')
    .endDate.format('x');
  $('#js-legend-2,#js-legend-3').html('');
  ipcRenderer.send(
    EXPENSES_IPC.GET_GRAPHDATA,
    JSON.stringify({
      fromDate,
      toDate,
    }),
  );
}

// get payments reply
ipcRenderer.on(EXPENSES_IPC.GET_PAYMENT_MODES_REPLY, (event, content) => {
  if (content) {
    const data = JSON.parse(content);
    $('#expensePaymentMode option:gt(0)').remove();
    const payments = data;
    payments.forEach((pay) => {
      $('<option>')
        .val(pay.id)
        .text(pay.payment_mode_name)
        .appendTo('#expensePaymentMode');
    });
  }
});

/**
 * Add a new expense
 */
function addExpense() {
  const category = $('#expenseCategorieslist option:selected:not([disabled])');
  if (category.length == 0) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:expenseController.selectCategory'),
    );
    return;
  }

  const subcategory = $(
    '#expensesubCategorieslist option:selected:not([disabled])',
  );

  let sub_category_id = '';
  let sub_category_name = '';

  if (subcategory.length > 0) {
    sub_category_id = $(subcategory).attr('value');
    sub_category_name = $(subcategory).text();
  }
  // payment mode
  const paymentMode = $('#expensePaymentMode option:selected:not([disabled])');
  if (paymentMode.length == 0) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:reportController.pleaseSelectPaymentMode'),
      0,
    );
    return;
  }

  let amount = $('#expenseamountField').val();
  if (!amount) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:expenseController.pleaseAddAmount'),
    );
    return;
  }

  if (amount.length > 10) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t(
        'controller:expenseController.Amountlengthshouldbelessthan10digit',
      ),
    );
    return;
  }

  if (amount < 0) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:expenseController.Expenseamountshouldnotbenegative'),
    );
    return;
  }

  if (amount) {
    const isNumber = !isNaN(amount);
    if (!isNumber) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:masterMenuController.invalidAmount'),
      );
      return;
    }

    if (amount.length > 10) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:masterMenuController.Amountlengthshouldbelessthantendigit',
        ),
      );
      return;
    }
  }
  try {
    amount = Number(amount);
  } catch (error) {
    amount = 0;
  }
  if (amount == 0) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:expenseController.pleaseProvideValidAmount'),
    );
    return;
  }

  const description = $('#expensedescField').val();

  if (description) {
    if (description.length > 100) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:masterMenuController.Descriptionlengthshouldbelessthanhundredcharacters',
        ),
      );
      return;
    }

    if (window.specialCharRegex.test(description)) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:expenseNotifications.Specialcharactersarenotallowed',
        ),
      );
      return;
    }
  }

  const category_name = $(category).text();
  const category_id = $(category).attr('value');

  const payment_mode = $(paymentMode).text();

  const params = {
    category_id,
    category_name,
    sub_category_name,
    sub_category_id,
    description,
    payment_mode,
    amount,
    expense_time: $('#expensedateField')
      .data('daterangepicker')
      .startDate.format('x'),
    is_chargable: $('#nonchargableCheck').is(':checked') ? 1 : 0,
    store_id: window.storeDetails.store_id,
    expense_id: window.generateId(),
    field1: window.storeDetails.username,
  };
  ipcRenderer.send(EXPENSES_IPC.ADD_EXPENSE, JSON.stringify(params));
}

function fetchnceExpenses() {
  const fromDate = $('#allnceexpensefromdateField')
    .data('daterangepicker')
    .startDate.format('x');
  const toDate = $('#allnceexpensefromdateField')
    .data('daterangepicker')
    .endDate.format('x');
  ipcRenderer.send(
    EXPENSES_IPC.GET_EXPENSES,
    JSON.stringify({
      fromDate,
      toDate,
      type: FOR_NCEEXPENSES,
      is_chargable: 1,
    }),
  );
}

function fetchExpenses() {
  let fromDate = $('#allexpensefromdateField')
    .data('daterangepicker')
    .startDate.format('x');
  let toDate = $('#allexpensefromdateField')
    .data('daterangepicker')
    .endDate.format('x');

  // if (fetchReportAsPerCloseDay) {
  //   const fromToDateresult = getFromAndToDateForReportsAsPerCloseDay({
  //     fromDate,
  //     toDate,
  //   });
  //   if (fromToDateresult.fromDate) {
  //     fromDate = Number(fromToDateresult.fromDate);
  //   }
  //   if (fromToDateresult.toDate) {
  //     toDate = Number(fromToDateresult.toDate);
  //   }
  // }

  ipcRenderer.send(
    EXPENSES_IPC.GET_EXPENSES,
    JSON.stringify({
      fromDate,
      toDate,
      type: FOR_ALLEXPENSES,
      is_chargable: 0,
    }),
  );
}

function categoryonclickListener() {
  if ($('#expensesubcatFieldid').val()) {
    $('#expenseCategorieslistforsub').prop('selectedIndex', 0);
    $('#expensesubcatFieldid').val('');
  }

  $('#expensecatFieldid').val($(this).text());
}
function subcategoryonclickListener() {
  $('#expenseCategorieslistforsub').val($(this).attr('parent_id'));
  $('#expensesubcatFieldid').val($(this).attr('value'));
}
/**
 * add the item to the expense category list
 * @param {Expense category data} data
 */
function addtoExpensecategorylist(data) {
  const item = $('<li>', {
    text: data.category_name,
    class: 'expense-category-list-item',
    ref_id: data.ref_id,
  }).on('click', categoryonclickListener);
  $('#expense-category-list-containerid').append(item);
}

/**
 * add the item to the expense category list
 * @param {Expense sub-category data} data
 */
function addtoExpensesubcategorylist(data) {
  // mpos_expense_category.category_name
  const item = $('<li>', {
    text: data.sub_category_name,
    value: data.sub_category_name,
    ref_id: data.ref_id,
    parent_id: data.category_id,
    class: 'expense-category-list-item',
  }).on('click', subcategoryonclickListener);

  const cat = $('<span>', {
    text: `(${data['mpos_expense_category.category_name']})`,
  });
  item.append(cat);
  $('#expense-subcategory-list-containerid').append(item);
}

/**
 * Render expenses data
 * @param {Adds expenses window data to components} params
 */
function initializeComponents(params) {
  $('#expenseCategorieslist option:gt(0)').remove();
  $('#expensesubCategorieslist option:gt(0)').remove();
  $('#expenseCategorieslistforsub option:gt(0)').remove();

  $('#expense-category-list-containerid').empty();
  $('#expense-subcategory-list-containerid').empty();
  if (params.expenseCategories) {
    params.expenseCategories.forEach((element) => {
      const option = $('<option>')
        .val(element.ref_id)
        .text(element.category_name)
        .attr('category_id', element.category_id);
      const option2 = $('<option>')
        .val(element.ref_id)
        .text(element.category_name)
        .attr('category_id', element.category_id);
      $('#expenseCategorieslist').append(option);
      $('#expenseCategorieslistforsub').append(option2);

      addtoExpensecategorylist(element);
    });
  }

  if (params.expenseSubcategories) {
    params.expenseSubcategories.forEach((element) => {
      $('<option>')
        .val(element.ref_id)
        .text(element.sub_category_name)
        .attr('sub_category_id', element.sub_category_id)
        .attr('category_id', element.category_id)
        // .attr('disabled', true)
        .appendTo('#expensesubCategorieslist');
      addtoExpensesubcategorylist(element);
    });
  }

  // $('#expenseCategorieslist').selectpicker('refresh');
  // $('#expensesubCategorieslist').selectpicker('refresh');
}

/**
 * Renders the overview window data
 * @param {OVerview window data} params
 */
function renderOverviewwindowData(params) {
  if (params) {
    if (params.currentmonthsExpenses && params?.todaysExpenseamount) {
      $('#todaysexpenseTotalid').html(
        window.currency + params?.todaysExpenseamount?.toFixed(ROUNDOFF_UPTO),
      );
    } else {
      $('#todaysexpenseTotalid').html(`${window.currency} 0`);
    }
    if (params.totalExpenseamount) {
      $('#totalexpenseTotalid').html(
        window.currency + params.totalExpenseamount.toFixed(ROUNDOFF_UPTO),
      );
    } else {
      $('#totalexpenseTotalid').html(`${window.currency} 0`);
    }
    if (params.currentmonthsExpenses) {
      $('#monthsexpenseTotalid').html(
        window.currency + params.currentmonthsExpenses.toFixed(ROUNDOFF_UPTO),
      );
    } else {
      $('#monthsexpenseTotalid').html(`${window.currency} 0`);
    }

    $('#overviewexpensesTable').DataTable().clear().draw();
    $('#overviewexpensesTable').DataTable().rows.add(params.todaysExpenseslist); // Add new data
    $('#overviewexpensesTable').DataTable().columns.adjust().draw(); // Redraw the DataTable

    if (overviewChart) {
      overviewChart.destroy();
    }

    if (params.todaysExpenseslist) {
      const labels = [];
      const data = [];
      params.todaysExpenseslist.forEach((expense) => {
        labels.push(expense.category_name);
        data.push(expense.amount);
      });
      drawOverviewchart(labels, data);
    }
  }
}

/**
 * Redraws the line chart
 * @param {Labels} labels
 * @param {Dataset} data
 */
async function drawOverviewchart(labels, data) {
  const ctx = document.getElementById('lineChartid').getContext('2d');
  try {
    const color = materialColor();
    overviewChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Expenses', // Name the series
            borderColor: color, // '#2196f3', // Add custom color border (Line)
            backgroundColor: color,
            data,
            fill: false,
            // fillOpacity: .3,
          },
        ],
      },
      options: {
        responsive: true, // Instruct chart js to respond nicely.
        maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height
      },
    });
  } catch (error) {
    console.log(error);
  }
}

async function drawexpensesGraph(labels, data) {
  const ctx = document.getElementById('expenseLinechart').getContext('2d');
  try {
    const color = materialColor();
    expenseslineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Expenses', // Name the series
            borderColor: color, // '#2196f3', // Add custom color border (Line)
            backgroundColor: color,
            data,
            fill: false,
            // fillOpacity: .3,
          },
        ],
      },
      options: {
        responsive: true, // Instruct chart js to respond nicely.
        maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height
      },
    });
  } catch (error) {
    console.log(error);
  }
}

async function drawnceexpensesGraph(labels, data) {
  const ctx = document.getElementById('nceexpenseLinechartid').getContext('2d');
  try {
    const color = materialColor();
    expenseslineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'NC Expenses', // Name the series
            borderColor: color, // '#2196f3', // Add custom color border (Line)
            backgroundColor: color,
            data,
            fill: false,
            // fillOpacity: .3,
          },
        ],
      },
      options: {
        responsive: true, // Instruct chart js to respond nicely.
        maintainAspectRatio: false, // Add to prevent default behaviour of full-width/height
      },
    });
  } catch (error) {
    console.log(error);
  }
}

function drawgraphPiechart(
  expensesLabels,
  expensesData,
  nceexpensesLabels,
  nceexpensesData,
  backgroundColor,
) {
  const ctx = document.getElementById('expensepieChartid').getContext('2d');
  const ctx2 = document.getElementById('nceexpensepieChartid').getContext('2d');
  try {
    expensepieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: expensesLabels,
        datasets: [
          {
            backgroundColor,
            data: expensesData,
          },
        ],
      },
      options: {
        rotation: 270,
        circumference: 180,
        plugins: {
          htmlLegend: {
            // ID of the container to put the legend in
            containerID: 'js-legend',
          },
          legend: {},
        },
      },
    });
    nceexpensepieChart = new Chart(ctx2, {
      type: 'pie',
      data: {
        labels: nceexpensesLabels,
        datasets: [
          {
            backgroundColor,
            data: nceexpensesData,
          },
        ],
      },
      options: {
        rotation: 1 * Math.PI,
        circumference: 1 * Math.PI,
        legend: {
          display: false,
        },
      },
    });

    // document.getElementById('js-legend-2').innerHTML = expensepieChart.generateLegend();
    // document.getElementById('js-legend-3').innerHTML = nceexpensepieChart.generateLegend();
  } catch (error) {
    console.log(error);
  }
}

async function renderGraphwindowData(params) {
  if (params.expensesList && params.expensesList.length > 0) {
    // Line chart variables
    const expenseslabels = [];
    const nceexpenseslabels = [];
    const expensesData = [];
    const nceexpensesData = [];

    // Doughnut chart data
    const pieexpensesLabels = [];
    const piebackgroundColors = [];
    const pieexpensesData = [];
    const pienceexpensesLabels = [];
    const pienceexpensesData = [];

    params.expensesList.forEach((expense) => {
      piebackgroundColors.push(materialColor());

      if (expense.is_chargable == 1) {
        nceexpenseslabels.push(expense.category_name);
        nceexpensesData.push(expense.amount);

        pienceexpensesLabels.push(expense.category_name);
        pienceexpensesData.push(expense.amount);
      } else {
        expenseslabels.push(expense.category_name);
        expensesData.push(expense.amount);

        pieexpensesLabels.push(expense.category_name);
        pieexpensesData.push(expense.amount);
      }
    });
    if (expenseslineChart) {
      expenseslineChart.destroy();
    }
    if (nceexpenseslineChart) {
      nceexpenseslineChart.destroy();
    }
    if (expensepieChart) {
      expensepieChart.destroy();
    }
    if (nceexpensepieChart) {
      nceexpensepieChart.destroy();
    }
    $('#js-legend-2,#js-legend-3').html('');
    drawexpensesGraph(expenseslabels, expensesData);
    drawnceexpensesGraph(nceexpenseslabels, nceexpensesData);
    drawgraphPiechart(
      pieexpensesLabels,
      pieexpensesData,
      pienceexpensesLabels,
      pienceexpensesData,
      piebackgroundColors,
    );
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:expenseController.thereAreNoExpenses'),
    );
  }
}
function clearcurrentExpensedata() {
  $('#expenseCategorieslist').prop('selectedIndex', 0);
  $('#expensesubCategorieslist').prop('selectedIndex', 0);
  $('#expensePaymentMode').prop('selectedIndex', 0);
  $('#expenseamountField').val('');
  $('#expensedescField').val('');
  $('#nonchargableCheck').prop('checked', false);
}

/**
 * Render expenses data by type
 * @param {data} data
 */
async function showExpenses(data) {
  if (data && data.type) {
    if (data.expensesList.length == 0) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:expenseController.thereAreNoExpenses'),
      );
    }

    switch (data.type) {
      case FOR_ALLEXPENSES:
        $('#allexpensesTable').DataTable().clear().draw();
        $('#allexpensesTable').DataTable().rows.add(data.expensesList); // Add new data
        $('#allexpensesTable').DataTable().columns.adjust().draw(); // Redraw the DataTable

        break;
      case FOR_NCEEXPENSES:
        $('#nceexpensesTable').DataTable().clear().draw();
        $('#nceexpensesTable').DataTable().rows.add(data.expensesList); // Add new data
        $('#nceexpensesTable').DataTable().columns.adjust().draw(); // Redraw the DataTable
        break;
      default:
        break;
    }
  }
}

ipcRenderer.on(EXPENSES_IPC.GET_GRAPHDATA_REPLY, async (event, params) => {
  if (params) {
    params = JSON.parse(params);
    renderGraphwindowData(params);
  }
});

ipcRenderer.on(EXPENSES_IPC.ADD_EXPENSE_REPLY, async (event, params) => {
  window.notifyUser.showMessage(
    'success',
    $.i18n.t('controller:expenseController.expenseAdded'),
    0,
  );
  $('#expensesModal').modal('hide');
  window.refreshDashboard = true;
  if (params) {
    params = JSON.parse(params);
    getOverviewdata();
  }
});

ipcRenderer.on(EXPENSES_IPC.GET_EXPENSEDATA_REPLY, async (event, data) => {
  if (data) {
    try {
      data = JSON.parse(data);
      initializeComponents(data);
    } catch (error) {
      console.log(error);
    }
  }
});

ipcRenderer.on(EXPENSES_IPC.GET_EXPENSES_REPLY, async (event, data) => {
  if (data) {
    try {
      data = JSON.parse(data);
      showExpenses(data);
    } catch (error) {
      console.log(error);
    }
  }
});

ipcRenderer.on(EXPENSES_IPC.ADDORUPDATE_CATEGORY_REPLY, async (event, data) => {
  ipcRenderer.send(EXPENSES_IPC.GET_EXPENSEDATA, undefined);
});

ipcRenderer.on(
  EXPENSES_IPC.ADDORUPDATE_SUBCATEGORY_REPLY,
  async (event, data) => {
    ipcRenderer.send(EXPENSES_IPC.GET_EXPENSEDATA, undefined);
  },
);

ipcRenderer.on(EXPENSES_IPC.GET_OVERVIEWDATA_REPLY, async (event, data) => {
  if (data) {
    try {
      data = JSON.parse(data);
      renderOverviewwindowData(data);
    } catch (error) {
      console.log(error);
    }
  }
});

Initialize();
