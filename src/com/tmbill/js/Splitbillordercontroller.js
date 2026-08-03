const {
  makeSplitByPortionsRequest,
  makeSplitByPercentageRequest,
  makeSplitByItemsRequest,
} = require('../renderer/helper/Order.helper');
const { setSplitbillwindowaccess } = require('./AccesslevelManager');

let clickedButton;

// init methods
async function initSplitByPortionsRequest(splitPortionData) {
  try {
    const response = await makeSplitByPortionsRequest(splitPortionData);
    window.splitbillbyportionreponseHandler(response);
  } catch (error) {
    console.log(`Message="Error while split order by portion" `, error);
  }
}

async function initSplitByPercentageRequest(splitPecentageData) {
  try {
    const response = await makeSplitByPercentageRequest(splitPecentageData);
    window.splitbillbypercentreponseHandler(response);
  } catch (error) {
    console.log(`Message="Error while split order by percentage" `, error);
  }
}

async function initSplitByItemsRequest(splitItemsData) {
  try {
    const response = await makeSplitByItemsRequest(splitItemsData);
    window.splitbillbyitemsreponseHandler(response);
  } catch (error) {
    console.log(`Message="Error while split order by items" `, error);
  }
}

function showLoadersandsendrequest(event, args) {
  window.Swal.fire({
    title: $.i18n.t('controller:swalDataTranslations.SplitBill'),
    text: $.i18n.t('controller:swalDataTranslations.Splitingbillisinprogress'),
    showConfirmButton: false,
    width: '23em',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      window.Swal.showLoading();
      window.ipcRenderer.send(event, args);
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
  });
}

async function openSpiltbillwindow(currenttableButton) {
  clickedButton = currenttableButton;
  if (!window.splitbillscriptLoaded) {
    $('#splitbillModalBodyid').load('SplitBill.html', () => {
      $('#splitbillModal').on('show.bs.modal', () => {
        if (clickedButton && clickedButton.data) {
          setSplitbillwindowaccess(
            undefined,
            clickedButton.data.order_type_flag,
          );
        }
      });
      $('#splitbillModal').modal('show');
      window.showSplitbillinformation_fromremote(clickedButton);
    });
  } else {
    $('#splitbillModal').modal('toggle');
    if (clickedButton && clickedButton.data) {
      setSplitbillwindowaccess(undefined, clickedButton.data.order_type_flag);
    }
    window.showSplitbillinformation_fromremote(currenttableButton);
  }
}

async function sendspltbillbyPortionrequest(currentTable, noofPortions) {
  const params = {
    table_id: currentTable.data.id,
    table_name: currentTable.content,
    section: currentTable.data['mpos_department.section'],
    noofPortions,
    defaultDepartmentid:
      currentTable.data['mpos_department.id'] || currentTable.data.department,
    order_id: window.generateId(),
    order_type_flag: currentTable.data.order_type_flag,
  };
  // showLoadersandsendrequest(SPLIT_BILL.SPLIT_BY_PORTION, params);
  initSplitByPortionsRequest(params);
}

async function sendspltbillbyItemsrequest(currentTable, createdParts) {
  const params = {
    table_id: currentTable.data.id,
    table_name: currentTable.content,
    section: currentTable.data['mpos_department.section'],
    createdParts,
    defaultDepartmentid:
      currentTable.data['mpos_department.id'] || currentTable.data.department,
    user_id: window.storeDetails.username,
    store_id: window.storeDetails.store_id,
    order_type_flag: currentTable.data.order_type_flag,
  };

  try {
    const { customer } = currentTable.data.details;
    params.customer = customer;
  } catch (error) {
    console.error(error);
  }
  // showLoadersandsendrequest(SPLIT_BILL.SPLIT_BY_ITEMS, params);
  initSplitByItemsRequest(params);
}

async function sendsplitbillbypercentage(currentTable, percentageNumbers) {
  const params = {
    table_id: currentTable.data.id,
    table_name: currentTable.content,
    section: currentTable.data['mpos_department.section'],
    percentageNumbers,
    defaultDepartmentid:
      currentTable.data['mpos_department.id'] || currentTable.data.department,
    order_type_flag: currentTable.data.order_type_flag,
  };
  // showLoadersandsendrequest(SPLIT_BILL.SPLIT_BY_PERCENTAGE, params);
  initSplitByPercentageRequest(params);
}

async function applysplitbillButton(currentTable, SPLITBILL_TABS) {
  const splitbillactiveTab = $('#splitbillTab li a.active').attr('id');
  if (splitbillactiveTab) {
    switch (splitbillactiveTab) {
      case SPLITBILL_TABS.ITEM:
        {
          if (!window.doesallitemsSplited()) {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t(
                'controller:splitbillnotiifcation.Makesureallitemsaresplitted',
              ),
              0,
            );
            return;
          }

          const createdParts = window.getSplititemparts_fromremote();
          if (
            createdParts &&
            Array.isArray(createdParts) &&
            createdParts.length > 0
          ) {
            if (createdParts.length === 1) {
              window.notifyUser.showMessage(
                'error',
                $.i18n.t(
                  'controller:splitbillnotiifcation.Itemspartsshouldbemorethanone',
                ),
                0,
              );
              return;
            }

            createdParts.forEach((part) => {
              const data = $(`#${part.id}`).data();
              if (data.selectedItems && data.selectedItems.length > 0)
                // eslint-disable-next-line no-param-reassign
                part.items = data.selectedItems;
            });
          }
          await sendspltbillbyItemsrequest(currentTable, createdParts);
        }
        break;
      case SPLITBILL_TABS.PORTION:
        {
          let noofPortions = $('#splitbill-portions-field-id').val();
          if (noofPortions) {
            try {
              noofPortions = Number(noofPortions);
            } catch (error) {
              noofPortions = 0;
            }
            if (noofPortions < 2 || noofPortions > 15) {
              window.notifyUser.showMessage(
                'error',
                $.i18n.t(
                  'controller:splitbillnotiifcation.Invalidnoofportions',
                ),
              );
              return;
            }
            $('#splitbill-portions-field-id').val('');
            await sendspltbillbyPortionrequest(currentTable, noofPortions);
          } else {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t('controller:splitbillnotiifcation.Invalidnoofportions'),
            );
          }
        }
        break;
      case SPLITBILL_TABS.PERCENTAGE:
        {
          const percentageNumbers = [];
          let totalPercentage = 0;
          $('#split-percentage-content-inputs-id')
            .find('input')
            // eslint-disable-next-line func-names
            .each(function () {
              try {
                let value = $(this).val();
                if (value) {
                  value = Number(value);
                  if (value < 0) {
                    window.notifyUser.showMessage(
                      'error',
                      'Negative numbers are not allowed',
                    );
                    return;
                  }
                  if (value > 0) {
                    percentageNumbers.push(value);
                    totalPercentage += value;
                  }
                }
              } catch (error) {
                console.error(error);
              }
            });
          if (totalPercentage > 100) {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t(
                'controller:splitbillnotiifcation.Invalidnoofpercentage',
              ),
              0,
            );
            return;
          }
          if (totalPercentage === 100 && percentageNumbers.length === 1) {
            window.notifyUser.showMessage(
              'error',
              $.i18n.t(
                'controller:splitbillnotiifcation.Invalidnoofpercentage',
              ),
              0,
            );
            return;
          }
          if (totalPercentage !== 100) {
            percentageNumbers.push(Number(100 - totalPercentage));
          }

          $('#split-percentage-content-inputs-id input.extra-input').remove();
          $('#split-percent-input-1').val('');
          sendsplitbillbypercentage(currentTable, percentageNumbers);
        }
        break;
      default:
        break;
    }
  }
}

module.exports = {
  openSpiltbillwindow,
  applysplitbillButton,
};
