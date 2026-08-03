/* eslint-disable camelcase */
const { debounce } = require('lodash');
const axios = require('axios');
const { default: Swal } = require('sweetalert2');
const { ipcRenderer } = require('electron');
const { showLoader } = require('./CommonUtils');
const TableUtils = require('../util/TableUtils');
const {
  SAVE_KOT,
  CHECK_ORDER_IS_SAVED,
  CHECK_IF_REMOTE_KOT_IS_PULLED,
} = require('../util/IPC_Messages');
const { Config } = require('../config/config');
const { LOAD_MORE_ELEMENT_REMOTE } = require('./RawButtons');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const { showSelecttablepopup } = require('./RendererUtils');
const { apiCall } = require('../services/APIService');
const {
  checkIfOrderIsSavedRequest,
} = require('../renderer/helper/Order.helper');
const { makeSaveKotRequest } = require('../renderer/helper/Kot.helper');
const { OFFLINE_ORDERSTATES } = require('../util/OrderStates');
const { SHOW_CUSTOMERON_BILL_CHECK } = require('../util/SettingIDs');
const { sendKotsavedevent } = require('./ClientrequestHandler');

let tableName_suggestions;
let rejectedkotOffset;
let acceptedkotOffset;
let placedkotOffset;
let remoteKotOffset;

function Initialize() {
  setTimeout(() => {
    $('#pullRemotekotButton').on(
      'click',
      debounce(() => {
        // showPullingKot();
        sendPullKotRequest(4);
      }, 200),
    );
  }, 400);

  setTimeout(() => {
    $('#placedRemoteKot').on(
      'click',
      debounce(() => {
        renderPlacedKot();
        $('#pullRemotekotButton').show();
        placedkotOffset = 1;
      }, 200),
    );
  }, 3000);

  setTimeout(() => {
    $('#acceptedRemoteKot').on(
      'click',
      debounce(() => {
        renderAcceptedKot();
        $('#pullRemotekotButton').hide();
        acceptedkotOffset = 1;
      }, 200),
    );
  }, 3000);

  setTimeout(() => {
    $('#rejectedRemoteKot').on(
      'click',
      debounce(() => {
        renderRejectedKot();
        $('#pullRemotekotButton').hide();
        rejectedkotOffset = 1;
      }, 200),
    );
  }, 3000);
}

// render placed orders
async function renderPlacedKot(placedkotOffset) {
  $('#remoteKotListID').empty();
  $('#remoteKotdetailsTable').find('tr:not(:first)').remove();

  showLoader({
    title: $.i18n.t('controller:remoteKotController.FetchingKOTs'),
    text: $.i18n.t('controller:orderController.pleaseWait'),
  });

  // $('#remoteKotModal').modal('show');
  const result = await apiCall.post(
    Config.links.remoteKot,
    {
      // "offset": 15 * placedkotOffset,
      offset: placedkotOffset,
      status: [0],
      store_id: window.storeDetails.store_id,
      add_limit: 1,
    },
    {
      headers: getHeadersformposforrender(),
    },
  );

  if (result) {
    Swal.close();
  }

  let remoteKots;
  if (result && result.status == 200) {
    if (result.data && result.data.remotekotList) {
      remoteKots = result.data.remotekotList;

      remoteKots.map((items) => {
        items.payload.order_items.map((item) => {
          if (item.item_id) {
            delete Object.assign(item, { item_refid: item.item_id }).item_id;
          }
          // if(item['total']){
          delete Object.assign(item, { amount: item.total }).total;
          delete Object.assign(item, { item_tax_value: item.tax_value })
            .tax_value;
          delete Object.assign(item, { item_tax_per: item.tax_per }).tax_per;
          delete Object.assign(item, {
            item_tax_method: item.tax_method,
          }).tax_method;
          if (item.item_note) {
            delete Object.assign(item, { note: item.item_note }).item_note;
          }

          delete Object.assign(item, {
            'mpos_category.category_name': item.category_name,
          }).category_name;
          delete Object.assign(item, {
            kitchen_dept: item.kitchen_dept_id,
          }).kitchen_dept_id;
          // delete Object.assign(item, { ['product_group']: item['product_group_id'] })['product_group_id'];
          delete Object.assign(item, {
            item_is_devidable: item.tax_devidable,
          }).tax_devidable;

          if (
            (item.addons && item.addons.length > 0) ||
            (item.order_option_list && item.order_option_list.length > 0)
          ) {
            delete Object.assign(item, {
              new_item_tax_value: item.item_tax_value,
            }).item_tax_value;
          }

          const posItem = allItemsList.find(
            (o) => o.item_refid == item.item_refid,
          );
          if (posItem) {
            Object.assign(item, {
              short_code: posItem.short_code,
              category_name: posItem['mpos_category.category_name'],
            });
          }
        });
      });

      remoteKots.forEach(async (order) => {
        $('#kotNotFound').hide();

        await createOrder(order);
      });

      if (remoteKots.length > 14) addPlacedKotPagination();
    }
  }

  if (remoteKots.length == 0) {
    $('#kotNotFound').show();
  }
}

// add pagnation for placed kot
// let placedkotOffset = 1
function addPlacedKotPagination() {
  $('#remoteKotListID').append(LOAD_MORE_ELEMENT_REMOTE);
  $('#remotealloadmoreOrdersbutton').on('click', () => {
    renderPlacedKot(placedkotOffset);
    placedkotOffset++;
  });
}

// render accepted kots
async function renderAcceptedKot(acceptedkotOffset) {
  $('#remoteKotListID').empty();
  $('#remoteKotdetailsTable').find('tr:not(:first)').remove();

  showLoader({
    title: $.i18n.t('controller:orderController.FetchingKOTs'),
    text: $.i18n.t('controller:orderController.pleaseWait'),
  });

  // tableName_suggestions;
  // $('#remoteKotModal').modal('show');
  const result = await apiCall.post(
    Config.links.remoteKot,
    {
      offset: 15 * acceptedkotOffset,
      status: [1],
      store_id: window.storeDetails.store_id,
      add_limit: 15,
    },
    {
      headers: getHeadersformposforrender(),
    },
  );

  if (result) {
    Swal.close();
  }

  let remoteKots;
  if (result && result.status == 200) {
    if (result.data && result.data.remotekotList) {
      remoteKots = result.data.remotekotList;

      remoteKots.map((items) => {
        items.payload.order_items.map((item) => {
          if (item.item_id) {
            delete Object.assign(item, { item_refid: item.item_id }).item_id;
          }
          // if(item['total']){
          delete Object.assign(item, { amount: item.total }).total;
          delete Object.assign(item, { item_tax_value: item.tax_value })
            .tax_value;
          delete Object.assign(item, { item_tax_per: item.tax_per }).tax_per;
          delete Object.assign(item, {
            item_tax_method: item.tax_method,
          }).tax_method;
          if (item.item_note) {
            delete Object.assign(item, { note: item.item_note }).item_note;
          }

          delete Object.assign(item, {
            'mpos_category.category_name': item.category_name,
          }).category_name;
          delete Object.assign(item, {
            kitchen_dept: item.kitchen_dept_id,
          }).kitchen_dept_id;
          // delete Object.assign(item, { ['product_group']: item['product_group_id'] })['product_group_id'];
          if (
            (item.addons && item.addons.length > 0) ||
            (item.order_option_list && item.order_option_list.length > 0)
          ) {
            delete Object.assign(item, {
              new_item_tax_value: item.item_tax_value,
            }).item_tax_value;
          }

          const posItem = allItemsList.find(
            (o) => o.item_refid == item.item_refid,
          );
          if (posItem) {
            Object.assign(item, {
              short_code: posItem.short_code,
              category_name: posItem['mpos_category.category_name'],
            });
          }
        });
      });

      remoteKots.forEach(async (order) => {
        $('#kotNotFound').hide();

        await createOrder(order);
      });

      if (remoteKots.length == 0) {
        $('#kotNotFound').show();
      }

      if (remoteKots.length > 14) addAcceptedKotPagination();
    }
  }
  $('.cancelKotButton').css('visibility', 'hidden');
  $('.acceptRemoteKotButton').css('visibility', 'hidden');
  $('.changeTable').css('visibility', 'hidden');
}

// add pagnation for accepted kot
// let acceptedkotOffset = 1
function addAcceptedKotPagination() {
  $('#remoteKotListID').append(LOAD_MORE_ELEMENT_REMOTE);
  $('#remotealloadmoreOrdersbutton').on('click', () => {
    renderAcceptedKot(acceptedkotOffset);
    acceptedkotOffset++;
  });
}

// render rejected kots
async function renderRejectedKot(rejectedkotOffset) {
  $('#remoteKotListID').empty();
  $('#remoteKotdetailsTable').find('tr:not(:first)').remove();

  showLoader({
    title: $.i18n.t('controller:orderController.FetchingKOTs'),
    text: $.i18n.t('controller:orderController.pleaseWait'),
  });

  // tableName_suggestions;
  // $('#remoteKotModal').modal('show');
  const result = await apiCall.post(
    Config.links.remoteKot,
    {
      offset: 15 * rejectedkotOffset,
      add_limit: 15,
      status: [2],
      store_id: window.storeDetails.store_id,
    },
    {
      headers: getHeadersformposforrender(),
    },
  );

  if (result) {
    Swal.close();
  }

  let remoteKots;
  if (result && result.status == 200) {
    if (result.data && result.data.remotekotList) {
      remoteKots = result.data.remotekotList;

      remoteKots.map((items) => {
        items.payload.order_items.map((item) => {
          if (item.item_id) {
            delete Object.assign(item, { item_refid: item.item_id }).item_id;
          }
          // if(item['total']){
          delete Object.assign(item, { amount: item.total }).total;
          delete Object.assign(item, { item_tax_value: item.tax_value })
            .tax_value;
          delete Object.assign(item, { item_tax_per: item.tax_per }).tax_per;
          delete Object.assign(item, {
            item_tax_method: item.tax_method,
          }).tax_method;
          if (item.item_note) {
            delete Object.assign(item, { note: item.item_note }).item_note;
          }

          delete Object.assign(item, {
            'mpos_category.category_name': item.category_name,
          }).category_name;
          delete Object.assign(item, {
            kitchen_dept: item.kitchen_dept_id,
          }).kitchen_dept_id;
          // delete Object.assign(item, { ['product_group']: item['product_group_id'] })['product_group_id'];
          const posItem = allItemsList.find(
            (o) => o.item_refid == item.item_refid,
          );
          if (posItem) {
            Object.assign(item, {
              short_code: posItem.short_code,
              category_name: posItem['mpos_category.category_name'],
            });
          }
        });
      });

      remoteKots.forEach(async (order) => {
        $('#kotNotFound').hide();

        await createOrder(order);
      });

      if (remoteKots.length == 0) {
        $('#kotNotFound').show();
      }

      if (remoteKots.length > 14) addRejectedKotPagination();
    }
  }
  $('.cancelKotButton').css('visibility', 'hidden');
  $('.acceptRemoteKotButton').css('visibility', 'hidden');
  $('.changeTable').css('visibility', 'hidden');
}

// add pagnation for accepted kot
// let rejectedkotOffset = 1
function addRejectedKotPagination() {
  $('#remoteKotListID').append(LOAD_MORE_ELEMENT_REMOTE);

  $('#remotealloadmoreOrdersbutton').on('click', () => {
    renderRejectedKot(rejectedkotOffset);
    rejectedkotOffset++;
  });
}

// add pagintin to remote kot
function addPagination() {
  $('#remoteKotListID').append(LOAD_MORE_ELEMENT_REMOTE);

  $('#remotealloadmoreOrdersbutton').on('click', () => {
    renderPlacedKot(remoteKotOffset);
    remoteKotOffset++;
  });
}

async function sendPullKotRequest(action) {
  let selectedBill;
  let printKot;
  if (action === 1) {
    selectedBill = $(
      '#remoteKotListID li.selected-order .acceptRemoteKotButton',
    );
  } else {
    selectedBill = $('#remoteKotListID li.selected-order .detailsButton');
  }

  if (action === 4) {
    printKot = true;
  }

  if (selectedBill.length > 0) {
    let order_data = $(selectedBill).attr('order_data');
    if (order_data !== undefined) {
      try {
        order_data = JSON.parse(order_data);
      } catch (error) {
        console.log(error);
      }
    }
    if (printKot) {
      order_data.printKot = printKot;
    }

    if (!order_data) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:digitalOrderController.invalidDetails'),
      );
      return;
    }

    // check order is saved or not
    if (!window.allowModifyBill) {
      const result = await checkIfOrderIsSavedRequest({
        table_id: order_data.payload.table_id,
        store_id: order_data.store_id,
      });

      if (result) {
        window.notifyUser.showMessage(
          'error',
          $.i18n.t(
            'controller:remoteKotController.Billisalreadysavedforthistable',
          ),
        );
        return;
      }
    }

    if (order_data !== undefined && order_data.constructor === Object) {
      pullKot(order_data);
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:digitalOrderController.pleaseSelectOrder'),
      );
    }
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:digitalOrderController.pleaseSelectOrder'),
    );
  }
}

async function saveKotPostProcess(responseData) {
  try {
    $(`#table_${responseData.table_id}`).css(
      'background-color',
      TableUtils.Colors.KOT_SAVED,
    );
    $(`#table_${responseData.table_id}`)
      .find('#tableorderstatusLabel')
      .html(OFFLINE_ORDERSTATES.PLACED);
    const tableId = `table_${responseData.table_id}`;
    const table = $(`#${tableId}`);
    const currenttableButton = table[0];
    let showcustomeronbillCheck = false;
    if (table && table.length > 0) {
      table[0].data.details.order_state = 'Placed';
      if (
        window.globalcurrenttableId &&
        window.globalcurrenttableId === tableId
      ) {
        if (!Swal.isVisible()) $(table).click();
      }
    }
    if (responseData.printKOT) {
      let kotItems = [];
      if (responseData.remoteKot && responseData.items) {
        kotItems = responseData.items;
      }
      const kotNote = $('#kotnoteField').val();
      if (kotItems && kotItems.length > 0) {
        // await printKOT(
        //   kotItems,
        //   kotNote,
        //   false,
        //   responseData.billing_type,
        // );
        // window.handleKotPrintFromRemote({
        //   kotItems,
        //   kotNote,
        //   forQuickbill: false,
        //   billing_type: responseData.billing_type,
        // });
      }
    }
    if (responseData.remoteKot) {
      // Swal.close()
      currenttableButton.data.details.remoteKot = responseData.remoteKot;
      currenttableButton.data.details.remoteOrder_id = responseData.order_id;
      currenttableButton.data.details.billing_type = responseData.billing_type;

      // after accepting clear item from itemdetails
      $('#remoteKotdetailsTable').find('tr:not(:first)').remove();

      if (window.settingsConfig[SHOW_CUSTOMERON_BILL_CHECK - 1] !== undefined) {
        showcustomeronbillCheck =
          window.settingsConfig[SHOW_CUSTOMERON_BILL_CHECK - 1].value === '1';
      }

      const result = await apiCall.put(
        Config.links.updateRemoteKot,
        {
          remote_kot_id: responseData.remote_kot_id,
          status: 1,
          store_id: window.storeDetails.store_id,
        },
        {
          headers: getHeadersformposforrender(),
        },
      );

      if (result.data.status == 200) {
        const rejectedKot = $(`[remote_kot_id=${responseData.remote_kot_id}]`);
        rejectedKot.remove();
      }
      setTimeout(() => {
        sendKotsavedevent({
          insertedKOTid: responseData.insertedKOTid,
          table_id: currenttableButton ? currenttableButton.data.id : 0,
          message: $.i18n.t('controller:orderController.KOTSaved'),
          createTable: responseData.createTable,
          tableDetails: responseData.tableDetails,
          order_total: currenttableButton?.data?.details?.order_total || 0,
        });
      }, 200);
    }
  } catch (error) {
    console.error(error);
  }
}
async function pullKot(order_data) {
  // showLoader({
  //   title: $.i18n.t('controller:remoteKotController.PullingKOT'),
  //   text: $.i18n.t('controller:orderController.pleaseWait'),
  // });

  const isOrderPulled = await window.betteripcRenderer.callMain(
    CHECK_IF_REMOTE_KOT_IS_PULLED,
    { kot_unqiueid: order_data.remote_kot_id },
  );

  if (isOrderPulled) {
    return;
  }

  if (
    order_data &&
    order_data.payload &&
    order_data.payload.order_items &&
    order_data.payload.order_items.length
  ) {
    order_data.payload.order_items.map((item) => {
      const product_group = _.find(window.outletProductGroups, {
        product_group_id: Number(item.product_group_id),
      });
      Object.assign(item, {
        product_group_name: product_group.product_group_name,
        item_is_devidable: item.is_devidable,
      });
      if (item.extra_details && item.extra_details.alternative_title) {
        Object.assign(item, {
          alternative_title: item.extra_details.alternative_title,
        });
      }
      if (item.order_option_list && item.order_option_list.length) {
        item.order_option_list.forEach((addon) => {
          Object.assign(addon, {
            optionGrptitle: addon.option_group_name,
            opt_grp_ref_ids: addon.option_group_ref_id,
            ref_id: addon.option_ref_id,
            quantity: addon.qty,
            item_ref_id: item.item_refid,
            option_type: addon.type,
          });
          if (addon.extra_details && addon.extra_details.alternative_title) {
            Object.assign(addon, {
              alternative_title: addon.extra_details.alternative_title,
            });
          }
        });
        item.addons = item.order_option_list;
        item.isitemwithOption = true;
        item.has_options = 1;
      }
      if (order_data.createdBy) {
        Object.assign(item, {
          createdBy: order_data.createdBy,
        });
      }
    });
  }
  const kot_details = {
    amount: order_data.payload.order_total,
    note: order_data.instructions,
    table_id: order_data.payload.table_id,
    table_name: order_data.payload.table_name,
    // createdBy: order_data.created_by,
    // user_id: order_data.created_by,
    createdBy: window.storeDetails.username,
    user_id: window.storeDetails.username,
    // customer_name: order_data.payload.cust_name,
    customer_mobile: order_data.payload.phone,
    billing_type:
      order_data.payload.order_source == 'digital'
        ? 1
        : order_data.billing_type,
    store_id: order_data.store_id,
    items: order_data.payload.order_items,
    remote_order_id: order_data.order_id,
    remote_kot_id: order_data.remote_kot_id,
    printKOT: order_data.printKot,
    table_color: TableUtils.Colors.KOT_SAVED,
    table_action_flag: TableUtils.State.KOT_SAVED,
    note: order_data.payload.instructions,
    remotekot: true,
    forDinein: true,
    customer: {
      // name: order_data.payload.cust_name,
      phone: order_data.payload.phone,
      store_id: window.storeDetails.store_id,
    },
  };

  console.log('order_data:', order_data);
  if (order_data.createdBy) {
    Object.assign(kot_details, {
      createdBy: order_data.createdBy,
    });
  }

  if (!window.specialCharRegex.test(order_data.payload.cust_name)) {
    Object.assign(kot_details.customer, {
      name: order_data.payload.cust_name,
    });
    Object.assign(kot_details, {
      customer_name: order_data.payload.cust_name,
    });
  }
  // PULL_DIGITALORDER
  // ipcRenderer.send(SAVE_KOT, JSON.stringify(kot_details));
  // if ($('.modal:visible').length && !$('#remoteKotModal:visible').length) {
  //   $('.modal').modal('hide');
  // }

  // window.remoteInitSaveKot(kot_details);
  const response = await makeSaveKotRequest(kot_details);
  saveKotPostProcess(response);
}

async function autoAcceptRemoteKot({ remote_kot_id, username }) {
  const result = await apiCall.post(Config.links.remoteKot, {
    offset: 180,
    store_id: window.storeDetails.store_id,
    status: [0, 1, 2],
    add_limit: 1,
    remote_kot_id: [remote_kot_id],
  });

  // pullKot(result.data.remotekotList[0])
  const remoteKot = result.data.remotekotList[0];
  // remoteKots.map((items) => {
  remoteKot.payload.order_items.map((item) => {
    if (item.item_id) {
      delete Object.assign(item, { item_refid: item.item_id }).item_id;
    }
    // if(item['total']){
    delete Object.assign(item, { amount: item.total }).total;
    delete Object.assign(item, { item_tax_value: item.tax_value }).tax_value;
    delete Object.assign(item, { item_tax_per: item.tax_per }).tax_per;
    delete Object.assign(item, { item_tax_method: item.tax_method }).tax_method;
    if (item.item_note) {
      delete Object.assign(item, { note: item.item_note }).item_note;
    }

    delete Object.assign(item, {
      'mpos_category.category_name': item.category_name,
    }).category_name;
    delete Object.assign(item, { kitchen_dept: item.kitchen_dept_id })
      .kitchen_dept_id;

    delete Object.assign(item, {
      item_is_devidable: item.tax_devidable,
    }).tax_devidable;

    if (
      (item.addons && item.addons.length > 0) ||
      (item.order_option_list && item.order_option_list.length > 0)
    ) {
      delete Object.assign(item, {
        new_item_tax_value: item.item_tax_value,
      }).item_tax_value;
    }

    const posItem = allItemsList.find((o) => o.item_refid == item.item_refid);
    if (posItem) {
      Object.assign(item, {
        short_code: posItem.short_code,
        category_name: posItem['mpos_category.category_name'],
      });
    }
  });

  remoteKot.printKot = true;
  remoteKot.createdBy = username;
  pullKot(remoteKot);
}

async function rejectRemoteKot(remote_kot_id) {
  await apiCall.put(
    Config.links.updateRemoteKot,
    {
      remote_kot_id,
      status: 2,
      store_id: window.storeDetails.store_id,
    },
    {
      headers: getHeadersformposforrender(),
    },
  );
}

window.autoAcceptRemotKotFromRemote = (content) => {
  const { remote_kot_id, username } = content;
  if (content.reject) {
    rejectRemoteKot(remote_kot_id);
  } else {
    autoAcceptRemoteKot({ remote_kot_id, username });
  }
};

// async function showSelecttablepopup() {
//   let destinationtable;
//   let destinationtableName;
//   const result = await Swal.fire({
//     title: $.i18n.t('controller:oldKotController.enterTableName'),
//     text: $.i18n.t(
//       'controller:oldKotController.selectedItemsWillBeShiftedToSelectedTable',
//     ),
//     html: `<input type="text" placeholder="Enter table name" class="transferTablename w-75">`,
//     didOpen: async () => {
//       await addTablenamesuggestions(
//         '#swal2-html-container input.transferTablename',
//       );
//     },
//     focusConfirm: false,
//     width: '23em',
//     customClass: {
//       popup: 'tmbill-swal-pop-up',
//       input: 'tmbill-swal-input',
//       actions: 'oldkot-swal-action',
//     },
//     allowOutsideClick: () => !Swal.isLoading(),
//     allowEscapeKey: () => !Swal.isLoading(),
//     showCancelButton: true,
//     width: '23em',
//     preConfirm: async function () {
//       let inputTable = $('#swal2-html-container input.transferTablename').val();
//       if (inputTable && tableName_suggestions.includes(inputTable)) {
//         let foundTable = $(
//           '#tablesContainer button[name="' + inputTable + '"]',
//         );

//         if (foundTable.length > 0) {
//           destinationtable = foundTable[0].data.id;
//           destinationtableName = foundTable[0].data.table_name;

//           return { destinationtable, destinationtableName };
//         }
//       }
//       Swal.showValidationMessage(
//         $.i18n.t('controller:oldKotController.invalidTableName'),
//       );
//       return false;
//     },
//   });
//   return result;
// }

// async function addTablenamesuggestions(elementId) {
//   $(elementId).autocomplete({
//     source: function (req, response) {
//       let sourceData = [];
//       let re = $.ui.autocomplete.escapeRegex(req.term);
//       response(
//         $.grep(tableName_suggestions, function (tableName) {
//           if (String(tableName).toLowerCase().includes(re.toLowerCase())) {
//             sourceData.push({
//               label: tableName,
//               value: tableName,
//             });
//           }
//         }),
//       );
//       return response(sourceData);
//     },
//     appendTo: '#swal2-html-container',
//     classes: {
//       'ui-autocomplete': 'autocomplete-to-front ',
//     },
//     select: function (event, ui) {
//       $(elementId).val(ui.item.value);
//     },
//   });
// }

async function changeTableForKot(button) {
  const detailsButton = $(button).siblings('.detailsButton');
  const acceptKotButton = $(button).siblings('.acceptRemoteKotButton');

  const result = await showSelecttablepopup();

  if (result.isConfirmed) {
    let order_data = $(detailsButton).attr('order_data');
    let accept_order_data = $(acceptKotButton).attr('order_data');

    order_data = JSON.parse(order_data);
    accept_order_data = JSON.parse(accept_order_data);

    order_data.payload.table_name = result.value.destinationtableName;
    order_data.payload.table_id = result.value.destinationtable;

    accept_order_data.payload.table_name = result.value.destinationtableName;
    accept_order_data.payload.table_id = result.value.destinationtable;

    $(detailsButton).attr('order_data', JSON.stringify(order_data));
    $(acceptKotButton).attr('order_data', JSON.stringify(accept_order_data));

    $(button)
      .parent()
      .parent()
      .find('.remoteKotTableid')
      .html(`Table : ${result.value.destinationtableName}`);
  }
}

// cancel kot
async function sendCancelKotRequest() {
  const selectedBill = $('#remoteKotListID li.selected-order .cancelKotButton');
  if (selectedBill.length > 0) {
    let order_data = $(selectedBill).attr('order_data');

    const rejectResult = await Swal.fire({
      title: $.i18n.t('controller:swalDataTranslations.RejectKOT'),
      text: $.i18n.t('controller:swalDataTranslations.Areyousure'),
      showConfirmButton: true,
      showCancelButton: true,
      width: '23em',
      allowOutsideClick: true,
      allowEscapeKey: false,
      customClass: {
        popup: 'tmbill-swal-pop-up',
        content: 'tmbill-swal-title-class',
        input: 'tmbill-swal-input2',
      },
    });

    if (rejectResult && rejectResult.isConfirmed) {
      showLoader({
        title: $.i18n.t('Rejecting kot'),
        text: $.i18n.t('controller:orderController.pleaseWait'),
      });

      order_data = JSON.parse(order_data);
      const result = await apiCall.put(
        Config.links.updateRemoteKot,
        {
          remote_kot_id: order_data.remote_kot_id,
          status: 2,
          store_id: window.storeDetails.store_id,
        },
        {
          headers: getHeadersformposforrender(),
        },
      );

      if (result) {
        Swal.close();
        if (result.data.status == 200) {
          $('#remoteKotdetailsTable').find('tr:not(:first)').remove();
          const rejectedKot = $(`[remote_kot_id=${order_data.remote_kot_id}]`);
          rejectedKot.remove();
          window.notifyUser.showMessage('success', result.data.msg);
        } else {
          window.notifyUser.showMessage('error', result.data.msg);
        }
      }
    }
  }
}

async function openRemoteKotModal(tableName_suggestion) {
  $('#remoteKotListID').empty();
  $('#placedRemoteKot').addClass('active');
  $('#acceptedRemoteKot').removeClass('active');
  $('#rejectedRemoteKot').removeClass('active');
  $('#pullRemotekotButton').show();
  $('#remoteKotdetailsTable').find('tr:not(:first)').remove();

  remoteKotOffset = 1;

  showLoader({
    title: $.i18n.t('controller:orderController.FetchingKOTs'),
    text: $.i18n.t('controller:orderController.pleaseWait'),
  });

  tableName_suggestions = tableName_suggestion;
  $('#remoteKotModal').modal('show');
  const result = await apiCall.post(
    Config.links.remoteKot,
    {
      offset: 0,
      status: [0],
      store_id: window.storeDetails.store_id,
      add_limit: 15,
    },
    {
      headers: getHeadersformposforrender(),
    },
  );

  if (result) {
    Swal.close();
  }

  let remoteKots;
  if (result && result.status == 200) {
    if (result.data && result.data.remotekotList) {
      remoteKots = result.data.remotekotList;
      remoteKots.map((items) => {
        items.payload.order_items.map((item) => {
          if (item.item_id) {
            delete Object.assign(item, { item_refid: item.item_id }).item_id;
          }
          // if(item['total']){
          delete Object.assign(item, { amount: item.total }).total;
          delete Object.assign(item, { item_tax_value: item.tax_value })
            .tax_value;
          delete Object.assign(item, { item_tax_per: item.tax_per }).tax_per;
          delete Object.assign(item, {
            item_tax_method: item.tax_method,
          }).tax_method;
          if (item.item_note) {
            delete Object.assign(item, { note: item.item_note }).item_note;
          }

          delete Object.assign(item, {
            'mpos_category.category_name': item.category_name,
          }).category_name;
          delete Object.assign(item, {
            kitchen_dept: item.kitchen_dept_id,
          }).kitchen_dept_id;
          // delete Object.assign(item, { ['product_group_id']: item['product_group'] })['product_group'];
          delete Object.assign(item, {
            item_is_devidable: item.tax_devidable,
          }).tax_devidable;
          // delete Object.assign(item, { ['addons']: item['order_option_list'] })['order_option_list'];

          if (
            (item.addons && item.addons.length > 0) ||
            (item.order_option_list && item.order_option_list.length > 0)
          ) {
            delete Object.assign(item, {
              new_item_tax_value: item.item_tax_value,
            }).item_tax_value;
          }
          // item.addons.map((addon)=>{
          //     delete Object.assign(addon, { ['option_tax']: item['tax_value'] })['tax_value'];
          // })
          const posItem = allItemsList.find(
            (o) => o.item_refid == item.item_refid,
          );
          if (posItem) {
            Object.assign(item, {
              short_code: posItem.short_code,
              category_name: posItem['mpos_category.category_name'],
            });
          }
        });
      });
      remoteKots.forEach(async (order) => {
        $('#kotNotFound').hide();

        await createOrder(order);
      });

      if (remoteKots.length == 0) {
        $('#kotNotFound').show();
      }

      if (remoteKots.length > 14) addPagination();
    }
  }
}

async function createOrder(currentOrderdetails) {
  if (currentOrderdetails && currentOrderdetails.constructor == Object) {
    const kotCard = $('<li>', {
      class: 'card w-100 remoteKotCard',
    }).attr('remote_kot_id', currentOrderdetails.remote_kot_id);

    const cardBody = $('<div>', {
      class: 'card-body',
      html: '',
    });

    let orderDate;
    if (currentOrderdetails.created_at) {
      const d = new Date(parseInt(currentOrderdetails.created_at));
      const formattedDate = moment(d).format('DD MMMM YYYY hh:mm A');
      orderDate = $('<div>', {
        class: '',
        text: formattedDate,
        title: formattedDate,
      });
    }

    let customerName;
    if (currentOrderdetails.customer_name) {
      customerName = $('<div>', {
        class: 'has-i18n',
        html: ` ${$.i18n.t('controller:remoteKotController.CustomerName')}: ${
          currentOrderdetails.customer_name
        }`,
      });
    }

    let customerMobile;
    if (currentOrderdetails.customer_phone) {
      customerMobile = $('<div>', {
        class: '',
        html: `${$.i18n.t('controller:remoteKotController.MobileNumber')}: ${
          currentOrderdetails.customer_phone
        }`,
      });
    }

    let tableName;
    if (currentOrderdetails.table_name) {
      tableName = $('<div>', {
        class: 'bold remoteKotTableid',
        // id:'remoteKotTableid',
        html: `${$.i18n.t('controller:remoteKotController.Table')}: ${
          currentOrderdetails.payload.table_name
        }`,
      });
    }

    const session_id = currentOrderdetails?.payload?.session_id;
    let table_pin;
    if (session_id) {
      const tablePin = session_id.slice(-4);
      table_pin = $('<div>', {
        class: 'bold remoteKotTableid',
        // id:'remoteKotTableid',
        html: `${$.i18n.t(
          'controller:remoteKotController.TablePIN',
        )}: ${tablePin}`,
      });
    }
    let remoteKotId;
    if (currentOrderdetails.table_name) {
      remoteKotId = $('<label>', {
        class: 'remotkotid',
        html: `Order ID : ${currentOrderdetails.remote_kot_id}`,
      });
    }

    const changeTableButton = $('<button>', {
      class: 'btn btn-outline-secondary changeTable',
      id: 'changeTable',
      attribute: ('order_data', JSON.stringify(currentOrderdetails)),
      html: $.i18n.t('controller:remoteKotController.ChangeTable'),
    })
      .attr('order_data', JSON.stringify(currentOrderdetails))
      .click(function (e) {
        $('#remoteKotListID li').removeClass('selected-order');
        $(this).closest('li').addClass('selected-order');
        const orderData = $(this).attr('order_data');
        if (orderData != undefined) {
          showOrderdetails(JSON.parse(orderData));
        }
        changeTableForKot(this);
      });

    const rejectButton = $('<button>', {
      class: 'btn btn-outline-danger cancelKotButton',
      // attribute:('order_data', JSON.stringify(currentOrderdetails)),
      html: $.i18n.t('controller:remoteKotController.Reject'),
    })
      .attr('order_data', JSON.stringify(currentOrderdetails))
      .click(function (e) {
        $('#remoteKotListID li').removeClass('selected-order');
        $(this).closest('li').addClass('selected-order');
        const orderData = $(this).attr('order_data');
        if (orderData != undefined) {
          showOrderdetails(JSON.parse(orderData));
        }
        sendCancelKotRequest();
      });

    const acceptButton = $('<button>', {
      class: 'btn btn-outline-success acceptRemoteKotButton',
      html: $.i18n.t('controller:remoteKotController.Accept'),
    })
      .attr('order_data', JSON.stringify(currentOrderdetails))
      .click(function (e) {
        $('#remoteKotListID li').removeClass('selected-order');
        $(this).closest('li').addClass('selected-order');
        const orderData = $(this).attr('order_data');
        if (orderData != undefined) {
          showOrderdetails(JSON.parse(orderData));
        }
        sendPullKotRequest(1);
      });

    const detailsButton = $('<button>', {
      class: 'btn btn-outline-primary detailsButton',
      // attribute:('order_data', JSON.stringify(currentOrderdetails)),
      html: $.i18n.t('controller:remoteKotController.Details'),
    });

    detailsButton
      .attr('order_id', currentOrderdetails.id)
      .attr('order_data', JSON.stringify(currentOrderdetails))
      .click(function (e) {
        $('#remoteKotListID li').removeClass('selected-order');
        $(this).closest('li').addClass('selected-order');
        const orderData = $(this).attr('order_data');
        if (orderData != undefined) {
          showOrderdetails(JSON.parse(orderData));
        }
      });

    cardBody.append(orderDate);
    cardBody.append(customerName);
    cardBody.append(customerMobile);
    cardBody.append(remoteKotId);
    cardBody.append(tableName);
    cardBody.append(table_pin);

    const buttonsWrapper = $('<div>', {
      class: 'd-flex kotactions-container',
    });
    if (currentOrderdetails.source !== 'digital') {
      buttonsWrapper.append(changeTableButton);
    }
    buttonsWrapper.append(rejectButton);
    buttonsWrapper.append(acceptButton);
    buttonsWrapper.append(detailsButton);
    cardBody.append(buttonsWrapper);

    kotCard.append(cardBody);

    $('#remoteKotListID').append(kotCard);
  }
}

function showOrderdetails(order) {
  $('#remoteKotdetailsTable').find('tr:not(:first)').remove();

  order = order.payload;
  if (order) {
    const items = order.order_items;
    $('#remoteKotdetailsTable').attr('order_id', order.order_id);
    if (items.length > 0) {
      items.forEach((element) => {
        additemRow(element);
      });
    }
  }
}

/**
 *
 * @param {item to add in row} data
 */
function additemRow(data) {
  const table = $('#remoteKotdetailsTable');
  let itemTitle = data.title;
  if (data && data.extra_details && data.extra_details.baseTitle) {
    itemTitle = data.extra_details.baseTitle;
    if (
      window.selectedLanguage !== 'en' &&
      data.extra_details.alternative_title
    ) {
      itemTitle = data.extra_details.alternative_title;
      // data.alternative_title = data.extra_details.alternative_title;
    }
    itemTitle = `<span class='baseItemKotbillrow'>${itemTitle}</span>`;
  }
  if (data && data.order_option_list && data.order_option_list.length) {
    data.order_option_list.forEach((addon) => {
      if (
        window.selectedLanguage !== 'en' &&
        addon.extra_details.alternative_title
      ) {
        const title =
          addon.extra_details.alternative_title ||
          addon.option_name ||
          addon.title;
        itemTitle =
          itemTitle +
          '<br>' +
          `<span class='kotbillItemAddons'>${addon.option_qty || addon.qty || 1} x ${title} </span>`;
      } else {
        itemTitle =
          itemTitle +
          '<br>' +
          `<span class='kotbillItemAddons'>${addon.option_qty || addon.qty || 1} x ${addon.option_name || addon.title} </span>`;
      }
    });
  }
  table.append(
    `<tr ><td>${itemTitle}</td><td>${data.quantity}</td><td>${Number(
      data.price,
    ).toFixed(window.ROUNDOFF_UPTO)}</td><td>${Number(data.amount).toFixed(
      window.ROUNDOFF_UPTO,
    )}</td>`,
  );
  $('#remoteKotdetailsTable').trigger('rowAddOrRemove');
}

Initialize();

module.exports = {
  openRemoteKotModal,
  autoAcceptRemoteKot,
};
