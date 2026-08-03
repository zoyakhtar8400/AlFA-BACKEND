/* eslint-disable camelcase */
// let defaultebillCheck = false;
const {
  COMMON_STATE,
  TAKEAWAY_FLAG_ID,
  HOMED_FLAG_ID,
  DINEIN_FLAG_ID,
  VIRTUALTABLE_FLAG_ID,
  QUICKBILL_FLAG_ID,
} = require('../../util/Constants');
const {
  FETCH_BILL_DATA_FOR_CSK_ORDER_TOTAL_REPLY,
  SEND_ORDER_TOTAL,
} = require('../../util/IPC_Messages');
const { safeParse } = require('../../util/RendererUtils');
const {
  DISPLAYTIME_ON_TABLES,
  DEFAULT_SENDEBILL_CHECK,
  SHOW_KOTNOS_ONTABLE,
} = require('../../util/SettingIDs');
const TableUtils = require('../../util/TableUtils');
const { precalculateDetailsCheck } = require('../calculations');
const { addtabletowatchList } = require('../Tableobserver');
let currenttableButton;
let displaytimeonTables = false;
let defaultebillCheck = false;
let showkotnosonTable = false;

window.busyTableData = {};

function applyDiscounttotable(tableInstance, discountData) {
  if (tableInstance && discountData) {
    tableInstance.data.details.discount = discountData.rate;
    tableInstance.data.details.discount_type = discountData.discount_type;
    tableInstance.data.details.discounted_product_groups =
      discountData.product_groups;
    tableInstance.data.details.discount_title =
      discountData.discount_name || '';
    tableInstance.data.details.instructions = discountData.instructions || '';
  }
}

function getCustomer(byName, filter) {
  let selectedCustomer;
  if (filter) {
    selectedCustomer = _.find(
      customersList,
      byName ? { name: filter } : { phone: filter },
    );
  }
  return selectedCustomer;
}

async function savebilldata(currenttableData) {
  if (currenttableButton === undefined) {
    return;
  }
  if (currenttableData) {
    const table_id = currenttableButton.id.replace('table_', '');
    if (currenttableData.table_id == table_id) {
      const tabledetails = {
        KOT_Number: currenttableData?.kot_numbers?.join(','),
        Table_Name: currenttableData.table_name,
        Bill_Number: currenttableData.order_id,
        Customer_Mobile: currenttableData.customerMobile,
        Customer_Name: currenttableData.customerName,
      };

      const extraDetails = safeParse(currenttableData?.extra_details);
      if (extraDetails && extraDetails.order_number) {
        Object.assign(tabledetails, {
          Order_Number: extraDetails.order_number,
        });
      }

      window.busyTableData[currenttableData.table_id] = tabledetails;
      // if (currenttableData.table_id) {
      currenttableButton.data.details.instructions = undefined;
      currenttableButton.data.details.draftprint_status = 0;
      if (currenttableData.tableState) {
        currenttableButton.data.details.color =
          currenttableData.tableState.table_color;

        if (!currenttableData.isTerminalTable) {
          $(`#${currenttableButton.id}`).css(
            'background-color',
            currenttableData.tableState.table_color,
          );
        }
      }

      if (currenttableData.status == 200) {
        const { bill_number } = currenttableData;
        const { payid } = currenttableData;
        const { kot_id } = currenttableData;
        const { order_id } = currenttableData;
        const { billDetails } = currenttableData;
        const { kotcreatedAt } = currenttableData;

        if (bill_number != 0) {
          if (window.showbillDetails && order_id != 0) {
            //    try {
            //       $('#' + currenttableButton.id)
            //          .find('#tablebillnumberlabel')
            //          .text('Bill No: ' + order_id);
            //    } catch (error) {
            //    }
          }

          const { tableState } = currenttableData;
          if (tableState && !currenttableData.isTerminalTable) {
            $(`#${currenttableButton.id}`).css(
              'background-color',
              tableState.table_color,
            );
            currenttableButton.data.details.color = tableState.table_color;
            currenttableButton.data.table_action_flag =
              tableState.table_action_flag;
          } else {
            if (!currenttableData.isTerminalTable) {
              $(`#${currenttableButton.id}`).css(
                'background-color',
                TableUtils.Colors.BILL_SAVED,
              );
            }

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

          if (!currenttableData.isTerminalTable) {
            $(`#${currenttableButton.id}`).css(
              'background-color',
              currenttableData.tableState.table_color,
            );
          }

          currenttableButton.data.table_action_flag =
            TableUtils.State.DRAFT_BILL_PRINTED;
        } else {
          // currenttableButton.data.details.color = TableUtils.Colors.KOT_SAVED;
          // $('#' + currenttableButton.id).css("background-color", TableUtils.Colors.KOT_SAVED);
          // currenttableButton.data.table_action_flag = TableUtils.State.KOT_SAVED;
          currenttableButton.data.details.color =
            currenttableData.tableState.table_color;

          if (!currenttableData.isTerminalTable) {
            $(`#${currenttableButton.id}`).css(
              'background-color',
              currenttableData.tableState.table_color,
            );
          }

          currenttableButton.data.table_action_flag =
            currenttableData.tableState.table_action_flag;
        }

        const kot_numbers = currenttableData.kot_numbers.join(',');
        if (showkotnosonTable) {
          $(`#${currenttableButton.id}`)
            .find('#tablekotnosLabelid')
            .text(`KOT : ${kot_numbers}`)
            .prop('title', `${kot_numbers}`);
        }

        if (currenttableData && currenttableData.extra_details) {
          const eDetails = safeParse(currenttableData.extra_details);
          if (eDetails && eDetails.order_number) {
            $(`#${currenttableButton.id}`)
              .find('#tableOrdernoLabelid')
              .text(`# ${eDetails.order_number}`)
              .prop('title', `Order Number${eDetails.order_number}`);
          }
        }

        if (currenttableData.customerName) {
          $(`#${currenttableButton.id}`)
            .find('#tablecustomernameLabelid')
            .html(currenttableData.customerName);
        } else {
          $(`#${currenttableButton.id}`)
            .find('#tablecustomernameLabelid')
            .html('');
        }

        if (window.showCaptainNameOnTable) {
          $(`#${currenttableButton.id}`)
            .find('#tableCreatedByLabelid')
            .text(`${currenttableData.createdBy}`)
            .prop('title', `Captain: ${currenttableData.createdBy}`);
        }
        if (window.showWaiterNameOnTable && currenttableData.waiter) {
          $(`#${currenttableButton.id}`)
            .find('#tablewaiterLabelid')
            .html(currenttableData.waiter);
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
        const { customerName } = currenttableData;
        const { customerMobile } = currenttableData;
        const { ebillCheckstat } = currenttableData;
        const { showonBillstat } = currenttableData;
        const { deliveryboy_id } = currenttableData;
        if (customerName && customerMobile) {
          const customer = getCustomer(false, customerMobile);
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

        const { discount_type } = currenttableData;
        const { discount } = currenttableData;

        //  if (currenttableData.billItems != undefined && currenttableData.billItems.length > 0) {
        //     currenttableData.billItems.forEach(element => {
        //     //    addBillRow(currentbillTable, element);
        //     });
        //  }
        let { order_type_flag } = currenttableData;
        let applyDefaultcharges =
          currenttableData.charges == undefined ||
          (currenttableData.charges &&
            Array.isArray(currenttableData.charges) &&
            currenttableData.charges.length == 0);

        // Check if previously default charges were removed or not
        if (
          currenttableData.field2 &&
          Number(currenttableData.field2) &&
          [COMMON_STATE.ACTIVE, COMMON_STATE.INACTIVE].includes(
            Number(currenttableData.field2),
          )
        ) {
          applyDefaultcharges =
            Number(currenttableData.field2) == COMMON_STATE.INACTIVE;
          currenttableButton.data.details.defaultchargesRemoved = true;
        }

        // check for waiter
        currenttableButton.data.details.waiter =
          currenttableData.waiter || undefined;
        currenttableButton.data.details.waiter_id =
          currenttableData.waiter_id || undefined;
        currenttableButton.data.details.createdBy =
          currenttableData.createdBy || undefined;
        currenttableButton.data.details.draftprint_status =
          currenttableData.draftprint_status;
        currenttableButton.data.details.bill_id = currenttableData.bill_id;
        currenttableButton.data.details.deliveryboy_id =
          currenttableData.deliveryboy_id || undefined;

        if (order_type_flag) {
          switch (order_type_flag) {
            case 0:
              order_type_flag = QUICKBILL_FLAG_ID;
              break;

            case 1:
              order_type_flag = DINEIN_FLAG_ID;
              break;

            case 2:
              order_type_flag = TAKEAWAY_FLAG_ID;
              break;

            case 3:
              order_type_flag = HOMED_FLAG_ID;
              break;

            default:
              break;
          }
        }
        // currenttableButton.data.order_type_flag = order_type_flag;
        currenttableButton.data.details.order_type_flag = order_type_flag;
        // checkifduePayavailable(customerMobile);

        switch (order_type_flag) {
          case TAKEAWAY_FLAG_ID:
          case HOMED_FLAG_ID:
            // Add Default charges if any
            // Newly added
            if (applyDefaultcharges) {
              if (order_type_flag === HOMED_FLAG_ID) {
                if (
                  window.defaulthomedOrdercharges != undefined &&
                  window.defaulthomedOrdercharges.length > 0
                ) {
                  currenttableButton.data.details.charges =
                    window.defaulthomedOrdercharges;
                }
              } else if (
                window.defaulttakeawayOrdercharges != undefined &&
                window.defaulttakeawayOrdercharges.length > 0
              ) {
                currenttableButton.data.details.charges =
                  window.defaulttakeawayOrdercharges;
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
              if (currenttableButton?.data['mpos_department.section'] == 1) {
                // check if bar section charges is present and remove it
                const filteredCharges = window.defaultdineinOrdercharges.filter(
                  (charge) => {
                    const extraDetails = safeParse(charge.extra_details);
                    return extraDetails.bar_section_billing !== 1;
                  },
                );
                currenttableButton.data.details.charges = filteredCharges;
              } else {
                currenttableButton.data.details.charges =
                  window.defaultdineinOrdercharges;
              }
            }

            break;
          default:
            break;
        }

        currenttableButton.data.details.bill_number = bill_number;
        currenttableButton.data.details.order_id = order_id;
        currenttableButton.data.details.items = currenttableData.billItems;
        currenttableButton.data.details.printBillItems =
          currenttableData.printBillItems;
        currenttableButton.data.details.persons = noofPersons;
        currenttableButton.data.details.field2 =
          currenttableData?.billDetails?.field2;
        currenttableButton.data.details.order_note =
          currenttableData?.order_note;
        currenttableButton.data.details.reservation_id =
          currenttableData?.tableState?.reservation_id;

        currenttableButton.data.details.tableReservationDetails =
          currenttableData?.tableReservationDetails;

        applyDiscounttotable(currenttableButton, {
          rate: discount,
          discount_type,
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

        billstatusReason = currenttableData.discountInstruction;
        if (billDetails) {
          currenttableButton.data.details.due_payment = billDetails.due_payment;
          // currenttableButton.data.details.cust_paid_amount =
          //   billDetails.cust_paid_amount || undefined;
          currenttableButton.data.details.isBillModified =
            billDetails.isBillModified || undefined;
          currenttableButton.data.details.print_status =
            billDetails.print_status || undefined;
          if (billDetails.extra_details) {
            currenttableButton.data.details.extra_details = safeParse(
              billDetails.extra_details,
            );
          }
          currenttableButton.data.details.payment_modes =
            billDetails.payment_modes;
          currenttableButton.data.details.instructions =
            billDetails.instructions || '';
          billstatusReason = billDetails.instructions || '';
          orderStatusReason = billDetails.field1 || '';
        }

        //  activateTab(tabtoSwitch);
        precalculateDetailsCheck(currenttableButton);
        if (
          currenttableButton.data.details.extra_details &&
          currenttableData.autoSettled
        ) {
          Object.assign(currenttableButton.data.details.extra_details, {
            autoSettled: currenttableData.autoSettled,
          });
        } else if (
          !currenttableButton.data.details.extra_details &&
          currenttableData.autoSettled
        ) {
          const extra_details = {
            autoSettled: currenttableData.autoSettled,
          };
          Object.assign(currenttableButton.data.details, {
            extra_details,
          });
        }
      } else {
        currenttableButton.data.details.kotcreatedAt = undefined;
      }
      $('#takeawayebillBillcheckid').prop('checked', defaultebillCheck);
      $('#ebillBillcheckid').prop('checked', defaultebillCheck);
    }

    return 'success';
  }
}

ipcRenderer.on(
  FETCH_BILL_DATA_FOR_CSK_ORDER_TOTAL_REPLY,
  async (_event, reply) => {
    // console.log('FETCH_BILL_DATA_FOR_CSK_ORDER_TOTAL_REPLY');
    try {
      const responseData = safeParse(reply);

      currenttableButton = undefined;
      if (responseData.table_id) {
        currenttable = $(`#table_${responseData.table_id}`);
        if (currenttable) {
          currenttableButton = currenttable[0];
        }
      }

      let order_total = 0;
      if (currenttableButton && responseData.status != 404) {
        const result = await savebilldata(responseData);
        if (result == 'success') {
          order_total = currenttableButton?.data?.details?.order_total;
          if (order_total) {
            window.ipcRenderer.send(SEND_ORDER_TOTAL, {
              order_total,
              table_id: responseData.table_id,
            });
            // set order state
            if (responseData.kot_status) {
              const { kot_status } = responseData;
              const allEqual = (arr) => arr.every((v) => v == arr[0]);
              const isAllEqual = allEqual(kot_status);
              if (isAllEqual) {
                const orderState = [
                  'Placed',
                  'Bumped',
                  'Preparing',
                  'Ready',
                  'Served',
                ];
                const tableId = `table_${responseData.table_id}`;
                const orderStateToShow = kot_status[0] - 1;
                if (
                  currenttableButton.data.details.order_state &&
                  currenttableButton.data.details.order_state !== 'Placed'
                ) {
                  $(`#${currenttableButton.id}`)
                    .find('#tableorderstatusLabel')
                    .html(currenttableButton.data.details.order_state);
                } else {
                  $(`#${tableId}`)
                    .find('#tableorderstatusLabel')
                    .html(orderState[orderStateToShow]);
                }
              }
            }
            $(`#${currenttableButton.id}`)
              .find('#tableamountlabel')
              .text(
                window.currency + order_total.toFixed(window.ROUNDOFF_UPTO),
              );
          }
          if (displaytimeonTables) {
            addtabletowatchList(
              currenttableButton.id,
              responseData?.kotcreatedAt,
            );
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  },
);

function initializeShowTableDetails() {
  if (window.settingsConfig[DISPLAYTIME_ON_TABLES - 1] !== undefined) {
    displaytimeonTables =
      window.settingsConfig[DISPLAYTIME_ON_TABLES - 1].value === '1';
  }
  if (window.settingsConfig[DEFAULT_SENDEBILL_CHECK - 1] !== undefined) {
    defaultebillCheck =
      window.settingsConfig[DEFAULT_SENDEBILL_CHECK - 1].value === '1';
  }
  if (window.settingsConfig[SHOW_KOTNOS_ONTABLE - 1] !== undefined) {
    showkotnosonTable =
      window.settingsConfig[SHOW_KOTNOS_ONTABLE - 1].value === '1';
  }
}

module.exports = {
  initializeShowTableDetails,
};
