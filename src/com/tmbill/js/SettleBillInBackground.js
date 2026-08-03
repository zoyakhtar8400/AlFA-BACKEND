const {
  FETCH_BILL_DATA_FOR_SETTLE_BILL_REPLY,
} = require('../util/IPC_Messages');

ipcRenderer.on(FETCH_BILL_DATA_FOR_SETTLE_BILL_REPLY, async (_event, reply) => {
  try {
    let responseData = JSON.parse(reply);
    currenttableButton = undefined;
    if (responseData.table_id) {
      currenttable = $(`#table_${responseData.table_id}`);
      if (currenttable) {
        currenttableButton = currenttable[0];
      }
    }

    if (currenttableButton) {
      let result = await savebilldata(responseData);
      if (result == 'success') {
        makesaveBillrequest(true);
      }
    }
  } catch (error) {
    console.log(error);
  }
});

// let defaultebillCheck = false;
let currenttableButton = undefined;

async function savebilldata(currenttableData) {
  if (currenttableButton == undefined) {
    return;
  }
  if (currenttableData) {
    let table_id = currenttableButton.id.replace('table_', '');
    if (currenttableData.table_id == table_id) {
      let currentbillTable = undefined;
      let tabtoSwitch = undefined;
      currenttableButton.data.details.instructions = undefined;
      currenttableButton.data.details.draftprint_status = 0;
      if (currenttableData.tableState) {
        currenttableButton.data.details.color =
          currenttableData.tableState.table_color;
        $('#' + currenttableButton.id).css(
          'background-color',
          currenttableData.tableState.table_color,
        );
      }

      if (currenttableData.status == 200) {
        let bill_number = currenttableData.bill_number;
        let payid = currenttableData.payid;
        let kot_id = currenttableData.kot_id;
        let order_id = currenttableData.order_id;
        let billDetails = currenttableData.billDetails;
        let kotcreatedAt = currenttableData.kotcreatedAt;

        if (bill_number != 0) {
          if (window.showbillDetails && order_id != 0) {
            //    try {
            //       $('#' + currenttableButton.id)
            //          .find('#tablebillnumberlabel')
            //          .text('Bill No: ' + order_id);
            //    } catch (error) {
            //    }
          }

          let tableState = currenttableData.tableState;
          if (tableState) {
            $('#' + currenttableButton.id).css(
              'background-color',
              tableState.table_color,
            );
            currenttableButton.data.details.color = tableState.table_color;
            currenttableButton.data.table_action_flag =
              tableState.table_action_flag;
          } else {
            $('#' + currenttableButton.id).css(
              'background-color',
              TableUtils.Colors.BILL_SAVED,
            );
            currenttableButton.data.details.color =
              TableUtils.Colors.BILL_SAVED;
            currenttableButton.data.table_action_flag =
              TableUtils.State.BILL_SAVED;
          }

          currenttableButton.data.details.payment_mode =
            currenttableData.payment_mode;
        } else if (currenttableData.draftprint_status) {
          currenttableButton.data.details.color =
            currenttableData.tableState.table_color;
          $('#' + currenttableButton.id).css(
            'background-color',
            currenttableData.tableState.table_color,
          );
          currenttableButton.data.table_action_flag =
            TableUtils.State.DRAFT_BILL_PRINTED;
        } else {
          // currenttableButton.data.details.color = TableUtils.Colors.KOT_SAVED;
          // $('#' + currenttableButton.id).css("background-color", TableUtils.Colors.KOT_SAVED);
          // currenttableButton.data.table_action_flag = TableUtils.State.KOT_SAVED;
          currenttableButton.data.details.color =
            currenttableData.tableState.table_color;
          $('#' + currenttableButton.id).css(
            'background-color',
            currenttableData.tableState.table_color,
          );
          currenttableButton.data.table_action_flag =
            currenttableData.tableState.table_action_flag;
        }

        let kot_numbers = currenttableData.kot_numbers.join(',');
        if (showkotnosonTable) {
          $('#' + currenttableButton.id)
            .find('#tablekotnosLabelid')
            .text(`KOT : ${kot_numbers}`)
            .prop('title', `${kot_numbers}`);
        }

        currenttableButton.data.details.kot_numbers =
          currenttableData.kot_numbers;

        currenttableButton.data.details.charges = currenttableData.charges;
        if (payid != undefined && payid != 0) {
          currenttableButton.data.details.paymentAdded = true;
        }

        let noofPersons = 1;
        if (currenttableData.noofPersons)
          noofPersons = currenttableData.noofPersons;
        let customerName = currenttableData.customerName;
        let customerMobile = currenttableData.customerMobile;
        let ebillCheckstat = currenttableData.ebillCheckstat;
        let showonBillstat = currenttableData.showonBillstat;
        let deliveryboy_id = currenttableData.deliveryboy_id;
        if (customerName && customerMobile) {
          let customer = getCustomer(false, customerMobile);
          if (customer) {
            currenttableButton.data.details.customer = customer;
          } else {
            currenttableButton.data.details.customer = {
              name: customerName,
              phone: customerMobile,
              address_line1: '',
              address_line2: '',
            };
          }
        }

        let discount_type = currenttableData.discount_type;
        let discount = currenttableData.discount;

        //  if (currenttableData.billItems != undefined && currenttableData.billItems.length > 0) {
        //     currenttableData.billItems.forEach(element => {
        //     //    addBillRow(currentbillTable, element);
        //     });
        //  }
        let order_type_flag = currenttableButton.data.order_type_flag;
        let applyDefaultcharges =
          currenttableData.charges == undefined ||
          (currenttableData.charges &&
            Array.isArray(currenttableData.charges) &&
            currenttableData.charges.length == 0);

        //Check if previously default charges were removed or not
        if (
          currenttableData.field1 &&
          Number(currenttableData.field1) &&
          [COMMON_STATE.ACTIVE, COMMON_STATE.INACTIVE].includes(
            Number(currenttableData.field1),
          )
        ) {
          applyDefaultcharges =
            Number(currenttableData.field1) == COMMON_STATE.INACTIVE;
          currenttableButton.data.details.defaultchargesRemoved = true;
        }

        //check for waiter
        currenttableButton.data.details.waiter =
          currenttableData.waiter || undefined;
        currenttableButton.data.details.waiter_id =
          currenttableData.waiter_id || undefined;
        currenttableButton.data.details.createdBy =
          currenttableData.createdBy || undefined;
        currenttableButton.data.details.draftprint_status =
          currenttableData.draftprint_status;
        currenttableButton.data.details.bill_id = currenttableData.bill_id;
        // checkifduePayavailable(customerMobile);
        switch (order_type_flag) {
          case TAKEAWAY_FLAG_ID:
          case HOMED_FLAG_ID:
            //Add Default charges if any
            //Newly added
            if (applyDefaultcharges) {
              if (order_type_flag === HOMED_FLAG_ID) {
                if (
                  window.defaulthomedOrdercharges != undefined &&
                  window.defaulthomedOrdercharges.length > 0
                ) {
                  currenttableButton.data.details.charges =
                    window.defaulthomedOrdercharges;
                }
              } else {
                if (
                  window.defaulttakeawayOrdercharges != undefined &&
                  window.defaulttakeawayOrdercharges.length > 0
                ) {
                  currenttableButton.data.details.charges =
                    window.defaulttakeawayOrdercharges;
                }
              }
            }
            break;
          case DINEIN_FLAG_ID:
          case VIRTUALTABLE_FLAG_ID:
            if (
              applyDefaultcharges &&
              window.defaultdineinOrdercharges != undefined &&
              window.defaultdineinOrdercharges.length > 0
            ) {
              currenttableButton.data.details.charges =
                window.defaultdineinOrdercharges;
            }

            break;
          default:
            break;
        }

        currenttableButton.data.details.bill_number = bill_number;
        currenttableButton.data.details.order_id = order_id;
        currenttableButton.data.details.items = currenttableData.billItems;
        currenttableButton.data.details.persons = noofPersons;

        applyDiscounttotable(currenttableButton, {
          rate: discount,
          discount_type: discount_type,
          discount_name: currenttableData.discountTitle || '',
          product_groups: currenttableData.discounted_product_groups,
        });

        currenttableButton.data.details.couponDisountamt =
          currenttableData.couponDisount;
        currenttableButton.data.details.couponDisounttype =
          currenttableData.couponDisounttype;
        currenttableButton.data.details.coupon = currenttableData.coupon;
        currenttableButton.data.details.kotcreatedAt = kotcreatedAt;

        currenttableButton.data.details.remoteKot = currenttableData.remoteKot;
        currenttableButton.data.details.remoteOrder_id =
          currenttableData.remote_order_id;

        if (currenttableData.is_pre_order) {
          currenttableButton.data.details.preorderInfo =
            currenttableData.preorderInfo || undefined;
          currenttableButton.data.details.is_pre_order =
            currenttableData.is_pre_order;
        } else {
          currenttableButton.data.details.preorderInfo = undefined;
          currenttableButton.data.details.is_pre_order = 0;
        }
        currenttableButton.data.details.custom_bill_number =
          currenttableData.custom_bill_number || undefined;

        //  if (displaytimeonTables) {
        //     addtabletowatchList(currenttableButton.id, kotcreatedAt);
        //  }

        if (billDetails) {
          currenttableButton.data.details.due_payment = billDetails.due_payment;
          // currenttableButton.data.details.cust_paid_amount =
          //   billDetails.cust_paid_amount || undefined;
          currenttableButton.data.details.isBillModified =
            billDetails.isBillModified || undefined;
          currenttableButton.data.details.print_status =
            billDetails.print_status || undefined;
          if (billDetails.extra_details) {
            currenttableButton.data.details.extra_details = JSON.parse(
              billDetails.extra_details,
            );
          }
          currenttableButton.data.details.payment_modes =
            billDetails.payment_modes;
          currenttableButton.data.details.instructions =
            billDetails.instructions || '';
          billstatusReason = billDetails.instructions || '';
        }

        //  activateTab(tabtoSwitch);
        precalculateDetailsCheck(currenttableButton);
      } else {
        currenttableButton.data.details.kotcreatedAt = undefined;
      }
      $('#takeawayebillBillcheckid').prop('checked', defaultebillCheck);
      $('#ebillBillcheckid').prop('checked', defaultebillCheck);
    }

    return 'success';
  }
}
