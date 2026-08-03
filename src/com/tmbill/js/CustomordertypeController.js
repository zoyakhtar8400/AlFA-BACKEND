/* eslint-disable camelcase */
/* eslint-disable no-restricted-syntax */
const {
  BILLINGTYPES_MAP,
  ARABIC_BIILING_TYPES_BYID,
} = require('../util/DBUtil');
const {
  ASKFOR_CUSTOM_QUICKORDERTYPE,
  ASK_CUSTOM_ORDER_ID,
} = require('../util/SettingIDs');
const {
  checkDoesOrderIdExistRequest,
} = require('../renderer/helper/Order.helper');
const { addSuggestionstoelement } = require('./UIutils');
const {
  DINEIN_BILLING_FLAG,
  TAKEAWAY_BILLING_FLAG,
  HOMED_BILLING_FLAG,
} = require('../util/Constants');

let featureEnabled = false;
const useSelectoptionforcustomtype = false;
let tablesbuttonList;

async function createSwalordertypescontainer(customOrdertypes) {
  const htmlContainer = $('<div>', {
    class: 'd-flex flex-wrap mxhv-25 swal-container-child',
  });
  for (const type of customOrdertypes) {
    let orderTypeTitle = window.orderTypes[Number(type)]?.order_type;
    if (
      window.selectedLanguage !== 'en' &&
      window.orderTypes[Number(type)]?.alternative_title
    ) {
      orderTypeTitle = window.orderTypes[Number(type)]?.alternative_title;
    }

    const typeContainer = $(`<div>`, {
      html: orderTypeTitle,
      // window.selectedLanguage == 'ar'
      //   ? ARABIC_BIILING_TYPES_BYID[Number(type)]
      //   : BILLINGTYPES_MAP[Number(type)],
      class: 'card order-type p-4 mr-2 mt-1 w-23',
      'data-order-type': type,
    });
    $(htmlContainer).append(typeContainer);
  }

  const { value: formValues } = await Swal.fire({
    title: $.i18n.t('controller:orderController.Selectordertype'),
    html: htmlContainer,
    focusConfirm: false,
    width: '39em',
    allowOutsideClick: false,
    confirmButtonText: $.i18n.t('controller:orderController.ConfirmandProceed'),
    showCancelButton: true,
    cancelButtonText: $.i18n.t('controller:orderController.Close'),
    allowOutsideClick: true,
    // allowEscapeKey: true,
    customClass: {
      popup: 'tmbill-swal-pop-up custom-order-type-swal-container',
    },
    didOpen: () => {
      $(`#swal2-html-container div.swal-container-child div`).click(
        function (e) {
          const currentContext = this;
          $(`#swal2-html-container div.swal-container-child div`).removeClass(
            'selectedPayment',
          );
          $(currentContext).addClass('selectedPayment');
        },
      );
    },
    preConfirm: () => {
      const result = $(
        `#swal2-html-container div.swal-container-child div.selectedPayment`,
      );
      if (result && result.length) {
        return {
          orderType: Number($(result[0]).attr('data-order-type')),
          orderTypevalue: $(result[0]).html(),
        };
      }
      window.Swal.showValidationMessage('You need to select order type :)');
      setTimeout(() => {
        if (window.Swal.isVisible()) window.Swal.resetValidationMessage();
      }, 2000);
    },
  });
  return formValues;
}

async function createSwalOrderIdContainer() {
  const result = await window.Swal.fire({
    title: 'Enter order Id',
    html: `<input type="text" id="swalquickorderid"  placeholder=${$.i18n.t(
      'controller:swalDataTranslations.EnterorderId',
    )} style="width:300px"  maxlength="400" >`,
    focusConfirm: false,
    width: '27em',
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
    confirmButtonText: $.i18n.t('controller:masterMenuController.Account.OK'),
    allowOutsideClick: false,
    allowEscapeKey: false,
    async preConfirm() {
      const orderId = $('#swalquickorderid').val();
      if (orderId.includes(' ')) {
        window.Swal.showValidationMessage(
          $.i18n.t(
            'controller:swalDataTranslations.Spaceisnotallowedinorderid',
          ),
        );
        return;
      }
      if (orderId.length > 12) {
        window.Swal.showValidationMessage(
          $.i18n.t(
            'controller:swalDataTranslations.Orderidlengthshouldbetwelve',
          ),
        );
        return;
      }
      const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
      const checkSpecialChar = specialChars.test(orderId);
      if (checkSpecialChar) {
        window.Swal.showValidationMessage(
          $.i18n.t(
            'controller:swalDataTranslations.SpecialcharacterisnotallowedinorderidOrderidshouldbealphanumeric',
          ),
        );
        return;
      }

      const isOrderIdPresent = await checkDoesOrderIdExistRequest({ orderId });
      if (isOrderIdPresent) {
        window.Swal.showValidationMessage(
          $.i18n.t(
            'controller:swalDataTranslations.OrderidisalreadypresentYoucannotentersameorderid',
          ),
        );
        return;
      }
      if (!orderId) {
        window.Swal.showValidationMessage(
          $.i18n.t('controller:swalDataTranslations.PleaseenterorderId'),
        );
        // eslint-disable-next-line consistent-return
        return false;
      }
    },
  });
  let quickOrderId;
  if (result && result.value) {
    quickOrderId = $('#swalquickorderid').val();
  }
  return quickOrderId;
}
async function showcustomOrdertype(selectOptions) {
  console.log('selectOptions', selectOptions);
  const { value: selectedcustomOrdertype } = await window.Swal.fire({
    title: $.i18n.t('controller:swalDataTranslations.Selectacustomordertype'),
    input: 'select',
    inputOptions: selectOptions,
    inputPlaceholder: $.i18n.t(
      'controller:swalDataTranslations.Selectacustomordertype',
    ),
    customClass: {
      container: 'custom-order-type-swal-container',
    },
    showCancelButton: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    confirmButtonText: $.i18n.t('controller:swalDataTranslations.Select'),
    inputValidator: (value) =>
      new Promise((resolve) => {
        if (value) {
          resolve();
        } else {
          resolve('You need to select order type :)');
        }
      }),
  });
  if (selectedcustomOrdertype) {
    return {
      orderType: Number(selectedcustomOrdertype),
      orderTypevalue:
        window.orderTypes[Number(selectedcustomOrdertype)]?.order_type, // BILLINGTYPES_MAP[Number(selectedcustomOrdertype)],
    };
  }
  return undefined;
}
async function checkIfcustomordertypeisenabledforQuickbill(
  quickbilltableButton,
  checkForcefully = false,
) {
  if (
    window.settingsConfig &&
    window.settingsConfig[ASKFOR_CUSTOM_QUICKORDERTYPE - 1] != undefined
  ) {
    featureEnabled =
      window.settingsConfig[ASKFOR_CUSTOM_QUICKORDERTYPE - 1].value === '1';
  }

  if (
    featureEnabled &&
    quickbilltableButton &&
    window.storeDetails.custom_quickbill_ordertypes
  ) {
    const { items } = quickbilltableButton.data.details;
    if ((items && items.length === 0) || checkForcefully) {
      const customOrdertypes = String(
        window.storeDetails.custom_quickbill_ordertypes,
      ).split(',');

      let response;
      if (customOrdertypes && customOrdertypes.length) {
        if (useSelectoptionforcustomtype) {
          const selectOptions = {};
          for (const orderType of customOrdertypes) {
            Object.assign(selectOptions, {
              [Number(orderType)]:
                window.orderTypes[Number(orderType)]?.order_type, // BILLINGTYPES_MAP[Number(orderType)]
            });
            // Object.assign(selectOptions, {
            //   [Number(orderType)]:
            //     window.orderTypes[Number(orderType)].order_type,
            // });
          }
          const result = await showcustomOrdertype(selectOptions);
          return result;
        }
        if (
          $('#customQuickBillTypeid').text() === 'New Order' ||
          $('#customQuickBillTypeid').text() === 'طلب جديد' ||
          checkForcefully
        ) {
          response = await createSwalordertypescontainer(customOrdertypes);
          if (!response) {
            return 'ask order type';
          }
        }
        let askCustomOrderid = false;
        if (window.settingsConfig[ASK_CUSTOM_ORDER_ID - 1] !== undefined) {
          askCustomOrderid =
            window.settingsConfig[ASK_CUSTOM_ORDER_ID - 1].value === '1';
        }
        if (
          askCustomOrderid &&
          $('#customQuickBillTypeid').text() === 'New Order'
        ) {
          if (
            !['Quick Bill', 'Takeaway', 'Delivery', 'Home Delivery'].includes(
              response.orderTypevalue,
            )
          ) {
            const orderIdResult = await createSwalOrderIdContainer();
            Object.assign(response, { quick_custom_order_id: orderIdResult });
          }
        }
        return response;
      }
    }
  }
  return false;
}

function showTableSelectionPopup() {
  const popup = Swal.mixin({});
  const list = $('<datalist></datalist>').attr('id', 'tableSuggestionslist');
  window.tableName_suggestions.forEach((element) => {
    list.append($('<option>').text(element));
  });

  popup.fire({
    title: $.i18n.t('controller:orderController.enterTableName'),
    text: $.i18n.t(
      'controller:orderController.thisWillShiftTheCurrentKOTAndBillItemToDestiantionTable',
    ),
    // input: 'text',
    html: `<input type="text" placeholder=${$.i18n.t(
      'controller:orderController.enterTableName',
    )} class="changetableInputfield w-75">`,
    confirmButtonText: $.i18n.t('controller:orderController.changeTable.OK'),
    cancelButtonText: $.i18n.t('controller:orderController.changeTable.Cancel'),
    backdrop: false,
    didOpen: async () => {
      await addSuggestionstoelement(
        '#swal2-html-container input.changetableInputfield',
        window.tableName_suggestions,
        '#swal2-html-container',
      );
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
      input: 'tmbill-swal-input',
      actions: 'oldkot-swal-action',
    },
    showCancelButton: true,
    // allowOutsideClick: false,
    width: '23em',
    preConfirm: () => {
      const value = $(
        '#swal2-html-container input.changetableInputfield',
      ).val();

      if (!value) {
        return 'Please add valid table name';
      }
      findelementandFire(value.toString(), false).then(async (button_found) => {
        if (button_found != undefined && button_found.id != undefined) {
          const desttable_id = button_found.id.replace('table_', '');
          const destTableOrderFlag = button_found.data.order_type_flag;
          return {
            desttable_id,
            destTableOrderFlag,
          };
        }
      });
    },
  });
}

async function createSwalordertypescontainerForChangeordertype(
  customOrdertypes,
  ordertype,
  changeOrderTypeAfterSaveKot,
) {
  // const tableContainer = `<input type="text" placeholder=${$.i18n.t(
  //   'controller:orderController.enterTableName',
  // )} class="changetableInputfield w-75">`;
  let askCustomOrderid = false;
  if (window.settingsConfig[ASK_CUSTOM_ORDER_ID - 1] !== undefined) {
    askCustomOrderid =
      window.settingsConfig[ASK_CUSTOM_ORDER_ID - 1].value === '1';
  }

  const tableContainer = $('<input>', {
    class: 'changetableInputfield w-75',
    id: 'table',
    placeholder: $.i18n.t('controller:orderController.enterTableName'),
    style: 'display: none;', // Initially hidden
  });
  const orderIdContainer = $('<input>', {
    class: 'changetableInputfield w-75',
    id: 'customOrderId',
    // placeholder: $.i18n.t('controller:orderController.enterTableName'),
    placeholder: 'Enter Order Id',
    style: 'display: none;', // Initially hidden
  });
  const htmlContainer = $('<div>', {
    class: '',
  });
  htmlContainer.append(tableContainer);
  htmlContainer.append(orderIdContainer);
  const predefinedordertypehtmlContainer = $('<div>', {
    class: 'd-flex flex-wrap mxhv-25 swal-container-child',
  });
  const customordertypehtmlContainer = $('<div>', {
    class: 'd-flex flex-wrap mxhv-25 swal-container-child',
  });
  let defaultTypes = [];
  if (!window.dineInDisabled) {
    defaultTypes.push('1');
  }
  if (!window.takeawayDisabled) {
    defaultTypes.push('2');
  }
  if (!window.deliveryDisabled) {
    defaultTypes.push('3');
  }

  if (!window.quickbillDisabled) {
    defaultTypes.push('0');
  }

  // change order type after save kot no need of quick bill
  if (changeOrderTypeAfterSaveKot) {
    // defaultTypes = ['1', '2', '3'];
    defaultTypes = defaultTypes.filter((item) => item !== '0');
  }
  const predefinedOrdertypes = defaultTypes.filter(
    (item) => ![ordertype].includes(item),
  );
  for (const type of predefinedOrdertypes) {
    let orderTypeTitle = window.orderTypes[Number(type)]?.order_type;
    if (
      window.selectedLanguage !== 'en' &&
      window.orderTypes[Number(type)]?.altenative_title
    ) {
      orderTypeTitle = window.orderTypes[Number(type)]?.altenative_title;
    }
    const typeContainer = $(`<div>`, {
      html: orderTypeTitle,
      // window.selectedLanguage == 'ar'
      //   ? ARABIC_BIILING_TYPES_BYID[Number(type)]
      //   : BILLINGTYPES_MAP[Number(type)],
      class: 'card order-type p-4 mr-2 mt-1 w-23',
      'data-order-type': type,
    });
    $(predefinedordertypehtmlContainer).append(typeContainer);
  }

  const orderTypes = customOrdertypes.filter(
    (item) => !['0', '1', '2', '3'].includes(item),
  );

  // change order type after save kot no need of custom order type
  if (!changeOrderTypeAfterSaveKot) {
    for (const type of orderTypes) {
      let orderTypeTitle = window.orderTypes[Number(type)]?.order_type;
      if (
        window.selectedLanguage !== 'en' &&
        window.orderTypes[Number(type)]?.altenative_title
      ) {
        orderTypeTitle = window.orderTypes[Number(type)]?.altenative_title;
      }
      const typeContainer = $(`<div>`, {
        html: orderTypeTitle,
        // window.selectedLanguage == 'ar'
        //   ? ARABIC_BIILING_TYPES_BYID[Number(type)]
        //   : BILLINGTYPES_MAP[Number(type)],
        class: 'card order-type p-4 mr-2 mt-1 w-23',
        'data-order-type': type,
      });
      $(customordertypehtmlContainer).append(typeContainer);
    }
  }

  htmlContainer.append(predefinedordertypehtmlContainer);
  htmlContainer.append(customordertypehtmlContainer);

  const { value: formValues } = await Swal.fire({
    title: $.i18n.t('controller:orderController.Selectordertype'),
    html: htmlContainer,
    focusConfirm: false,
    width: '39em',
    allowOutsideClick: false,
    confirmButtonText: $.i18n.t('controller:orderController.ConfirmandProceed'),
    showCancelButton: true,
    cancelButtonText: $.i18n.t('controller:orderController.Close'),
    backdrop: false,
    // allowOutsideClick: true,
    // allowEscapeKey: true,
    customClass: {
      popup: 'tmbill-swal-pop-up custom-order-type-swal-container',
    },
    didOpen: async () => {
      $(`#swal2-html-container div.swal-container-child div`).click(
        function (e) {
          const currentContext = this;
          $(`#swal2-html-container div.swal-container-child div`).removeClass(
            'selectedPayment',
          );
          $(currentContext).addClass('selectedPayment');
        },
      );

      $('.order-type').click(async () => {
        const result = $(
          `#swal2-html-container div.swal-container-child div.selectedPayment`,
        );
        if (result && result.length) {
          const orderType = Number($(result[0]).attr('data-order-type'));
          const orderTypevalue = $(result[0]).html();
          // if (orderType === 1) {
          //   // showTableSelectionPopup();
          //   // const selectedTable = showTableSelectionPopup();
          //   console.log('selectedTable::', selectedTable);
          // }
          if (
            askCustomOrderid &&
            ![
              DINEIN_BILLING_FLAG,
              TAKEAWAY_BILLING_FLAG,
              HOMED_BILLING_FLAG,
            ].includes(orderType)
          ) {
            $('#customOrderId').show();
          } else {
            $('#customOrderId').hide();
          }
          if (orderType === 1) {
            const $tableInput = $('#table');

            $tableInput.show();

            await addSuggestionstoelement(
              '#table',
              window.dinein_tableName_suggestions,
              '#swal2-html-container',
            );

            setTimeout(() => {
              if ($tableInput.length) {
                $tableInput[0].focus();
              }
            }, 150);
          } else {
            $('#table').hide();
          }
        }
      });
      // showTableSelectionPopup
    },
    preConfirm: async () => {
      const result = $(
        `#swal2-html-container div.swal-container-child div.selectedPayment`,
      );
      if (result && result.length) {
        const tableValue = $('#table').val();
        const orderType = Number($(result[0]).attr('data-order-type'));
        const orderTypevalue = $(result[0]).html();
        if (
          askCustomOrderid &&
          ![
            DINEIN_BILLING_FLAG,
            TAKEAWAY_BILLING_FLAG,
            HOMED_BILLING_FLAG,
          ].includes(orderType)
        ) {
          const customeOrderId = $('#customOrderId').val();
          if (!customeOrderId) {
            window.Swal.showValidationMessage('Please enter order id');
            return false;
          }
          return {
            orderType,
            orderTypevalue,
            customeOrderId,
          };
        }
        if (orderType === 1) {
          if (!tableValue) {
            window.Swal.showValidationMessage(
              'Please enter a valid table name',
            );
            return false;
          }

          // Execute findelementandFire logic
          const button_found = await findelementandFire(tableValue, false);
          if (
            button_found &&
            button_found.data &&
            button_found.data.details &&
            button_found.data.details.order_state === 'Placed'
          ) {
            window.Swal.showValidationMessage(
              'Order is running on this table.',
            );
            return false;
          }
          if (button_found && button_found.id) {
            const desttable_id = button_found.id.replace('table_', '');
            const destTableOrderFlag = button_found.data.order_type_flag;
            const destTableDeptId = button_found.data.department;

            return {
              orderType,
              orderTypevalue,
              desttable_id,
              destTableOrderFlag,
              destTableDeptId,
            };
          }
          window.Swal.showValidationMessage('Table not found');
          return false;
        }
        return {
          orderType: Number($(result[0]).attr('data-order-type')),
          orderTypevalue: $(result[0]).html(),
        };
      }
      window.Swal.showValidationMessage('You need to select order type :)');
      setTimeout(() => {
        if (window.Swal.isVisible()) window.Swal.resetValidationMessage();
      }, 2000);
    },
  });
  return formValues;
}

async function showOrderTypesForchangeordertype(
  ordertype,
  tablesList,
  changeOrderTypeAfterSaveKot,
) {
  tablesbuttonList = tablesList;

  // if (window.storeDetails.custom_quickbill_ordertypes) {
  let customOrdertypes;

  if (
    !window.quickbillDisabled &&
    window.storeDetails.custom_quickbill_ordertypes
  ) {
    customOrdertypes = String(
      window.storeDetails.custom_quickbill_ordertypes,
    ).split(',');
  } else {
    customOrdertypes = ['2', '3'];
  }

  let response;
  if (customOrdertypes && customOrdertypes.length) {
    if (!changeOrderTypeAfterSaveKot && useSelectoptionforcustomtype) {
      const selectOptions = {};
      for (const orderType of customOrdertypes) {
        Object.assign(selectOptions, {
          [Number(orderType)]: window.orderTypes[Number(orderType)]?.order_type, // BILLINGTYPES_MAP[Number(orderType)]
        });
      }
      const result = await showcustomOrdertype(selectOptions);
      return result;
    }
    response = await createSwalordertypescontainerForChangeordertype(
      customOrdertypes,
      ordertype,
      changeOrderTypeAfterSaveKot,
    );
    if (!response) {
      return 'ask order type';
    }
    return response;
  }
  // }
  return false;
}

async function findelementandFire(button_name, forItem) {
  let button;
  if (button_name != undefined) {
    if (forItem) {
      const itemButton = $(
        `#itemviewContainer button[data-title='${button_name}']:visible`,
      );

      if (itemButton.length) {
        button = itemButton[0];
      } else {
        itemsbuttonList.forEach((item) => {
          if (item.content == button_name) {
            button = item;
          }
        });
      }
    } else {
      tablesbuttonList.forEach((item) => {
        if (item.content == button_name) {
          button = item;
        }
      });
    }
  }
  return button;
}
module.exports = {
  checkIfcustomordertypeisenabledforQuickbill,
  showOrderTypesForchangeordertype,
};
