/* eslint-disable no-case-declarations */
const { default: axios } = require('axios');
const { default: Swal } = require('sweetalert2');
const { debounce, cloneDeep } = require('lodash');
const { parsePhoneNumberFromString } = require('libphonenumber-js');
const {
  getHeadersformposforrender,
} = require('../../util/MiscServer.renderer');
const { showSelecttablepopup } = require('../RendererUtils');
const {
  SET_RESERVATION_ID_TO_TABLE,
  CREATE_TABLE_RESERVATION_RECORD,
} = require('../../util/IPC_Messages');
const TableUtils = require('../../util/TableUtils');
const { showLoader } = require('../CommonUtils');
const { apiCall } = require('../../services/APIService');
const { sendUpdateTableColorevent } = require('../ClientrequestHandler');
// const { initializei18nforTableReservationwindowui } = require('./i18nController');

let reservationToBeUpdated;

// ADD THIS FUNCTION AT TOP OF tableReservation.js
function initializei18nforTableReservationwindowui() {
  if ($.i18n && $.i18n.language !== 'en') {
    $('.newpaymentModal-dialog .has-i18n').localize();
  }
}

async function renderNewReservations() {
  $('#createRservationbuttonid').show();
  $('#tableReservationtListID').empty();
  $('#tableReservationtListID').show();
  $('#createReservationFormid').hide();
  $('#newRservationbuttonid').addClass('active');
  $('#AllocatedReservationsbuttonid').removeClass('active');
  $('#fulfilledReservationbuttonid').removeClass('active');
  $('#createRservationbuttonid').removeClass('active');
  $('#cancelledRservationbuttonid').removeClass('active');

  const reservationsData = await fetchReservationData();
  if (reservationsData) {
    // sort only new reservation having pending status and not table id
    const filteredReservations = reservationsData.filter(
      (reservation) =>
        reservation.status === 'pending' || reservation.status === 'confirmed',
    );
    if (filteredReservations.length) {
      $('#noreservationfoundid').hide();
    } else {
      $('#noreservationfoundid').show();
    }

    createReservationCards(filteredReservations);
    if (filteredReservations.length > 8) {
      $('#paginateTableReservations').empty();

      $('#paginateTableReservations').pagination({
        dataSource: filteredReservations,
        pageSize: 8,
        callback(data, pagination) {
          if (data && data.length) {
            $('#tableReservationtListID').empty();
            //   data.forEach((notifiation) => {
            createReservationCards(data);
            //   });
          }
        },
      });
    }
  }
}

async function renderAllocatedReservations() {
  $('#createRservationbuttonid').show();
  $('#tableReservationtListID').empty();
  $('#createReservationFormid').hide();
  $('#tableReservationtListID').show();
  $('#newRservationbuttonid').removeClass('active');
  $('#AllocatedReservationsbuttonid').addClass('active');
  $('#fulfilledReservationbuttonid').removeClass('active');
  $('#createRservationbuttonid').removeClass('active');
  $('#cancelledRservationbuttonid').removeClass('active');

  const reservationsData = await fetchReservationData();
  if (reservationsData) {
    // sort only new reservation having pending status and not table id
    const filteredReservations = reservationsData.filter(
      (reservation) => reservation.status === 'allocated',
    );
    if (filteredReservations.length) {
      $('#noreservationfoundid').hide();
    } else {
      $('#noreservationfoundid').show();
    }
    createReservationCards(filteredReservations);
    $('#paginateTableReservations').empty();
    if (filteredReservations.length > 8) {
      $('#paginateTableReservations').pagination({
        dataSource: filteredReservations,
        pageSize: 8,
        callback(data, pagination) {
          if (data && data.length) {
            $('#tableReservationtListID').empty();
            //   data.forEach((notifiation) => {
            createReservationCards(data);
            //   });
          }
        },
      });
    }
  }
}

async function renderFulfilledReservations() {
  $('#createRservationbuttonid').show();
  $('#tableReservationtListID').empty();
  $('#createReservationFormid').hide();
  $('#tableReservationtListID').show();
  $('#newRservationbuttonid').removeClass('active');
  $('#AllocatedReservationsbuttonid').removeClass('active');
  $('#fulfilledReservationbuttonid').addClass('active');
  $('#createRservationbuttonid').removeClass('active');
  $('#cancelledRservationbuttonid').removeClass('active');

  const reservationsData = await fetchReservationData();
  if (reservationsData) {
    // sort only new reservation having pending status and not table id
    const filteredReservations = reservationsData.filter(
      (reservation) => reservation.status === 'fulfilled',
    );
    if (filteredReservations.length) {
      $('#noreservationfoundid').hide();
    } else {
      $('#noreservationfoundid').show();
    }
    createReservationCards(filteredReservations);
    $('#paginateTableReservations').empty();

    if (filteredReservations.length > 8) {
      $('#paginateTableReservations').pagination({
        dataSource: filteredReservations,
        pageSize: 8,
        callback(data, pagination) {
          if (data && data.length) {
            $('#tableReservationtListID').empty();
            //   data.forEach((notifiation) => {
            createReservationCards(data);
            //   });
          }
        },
      });
    }
  }
}

async function renderCancelledReservations() {
  $('#createRservationbuttonid').show();
  $('#tableReservationtListID').empty();
  $('#createReservationFormid').hide();
  $('#tableReservationtListID').show();
  $('#newRservationbuttonid').removeClass('active');
  $('#AllocatedReservationsbuttonid').removeClass('active');
  $('#fulfilledReservationbuttonid').removeClass('active');
  $('#createRservationbuttonid').removeClass('active');
  $('#cancelledRservationbuttonid').addClass('active');

  const reservationsData = await fetchReservationData();
  if (reservationsData) {
    // sort only new reservation having pending status and not table id
    const filteredReservations = reservationsData.filter(
      (reservation) => reservation.status === 'cancelled',
    );
    if (filteredReservations.length) {
      $('#noreservationfoundid').hide();
    } else {
      $('#noreservationfoundid').show();
    }
    createReservationCards(filteredReservations);
    $('#paginateTableReservations').empty();

    if (filteredReservations.length > 8) {
      $('#paginateTableReservations').pagination({
        dataSource: filteredReservations,
        pageSize: 8,
        callback(data, pagination) {
          if (data && data.length) {
            $('#tableReservationtListID').empty();
            //   data.forEach((notifiation) => {
            createReservationCards(data);
            //   });
          }
        },
      });
    }
  }
}

function resetRservationFormData() {
  $('#custNameForReservationid').val('');
  $('#custPhoneForReservationid').val('');
  $('#personsForReservationid').val('');
  $('#noteForReservationid').val('');
  $("input:radio[name='reservationOccations']").prop('checked', false);
  $('#datePickerForReservationid').val('Select Date');
  $('#timePickerForReservationid').val('Select Time');
  $('#submitReservatioDataButtonid').show();
  $('#updateReservatioDataButtonid').hide();
  reservationToBeUpdated = undefined;
}
// Add this at the top of tableReservation.js (after requires)
function initializei18nforTableReservationwindowui() {
  if ($.i18n && $.i18n.language !== 'en') {
    $('.newpaymentModal-dialog .has-i18n').localize();
  }
}
async function openTableReservationModal() {
  $('#tableReservationModal').modal('show');
  $('#createReservationFormid').hide();
  renderNewReservations();
  initializei18nforTableReservationwindowui(); // This works now
  reservationToBeUpdated = undefined;
}

async function fetchReservationData() {
  resetRservationFormData();

  showLoader({
    title: $.i18n.t('controller:orderController.fetchingReservations'),
    text: $.i18n.t('controller:orderController.pleaseWait'),
  });

  try {
    const startOfToday = window.moment().startOf('day').valueOf();
    const endOfNext30Days = window
      .moment()
      .add(30, 'days')
      .endOf('day')
      .valueOf();

    const result = await apiCall.get(window.Config.links.getTableReservations, {
      params: {
        store_id: window.storeDetails.store_id,
        checkin_from: startOfToday,
        checkin_to: endOfNext30Days,
      },
      headers: getHeadersformposforrender(),
    });

    Swal.close();

    if (result?.data?.reservations) {
      return result.data.reservations;
    }

    $('#noreservationfoundid').show();
  } catch (error) {
    Swal.close();
    console.log(error);
  }
}

function createReservationCards(reservations) {
  //   reservations.forEach((reservation) => {
  // let reservation = JSON.parse(reser);

  $('#tableReservationtListID').empty();
  for (let i = 0; i < reservations.length; i += 4) {
    const row = $('<div>', { class: 'row reservation-card-row' });
    for (let reservation = i; reservation < i + 4; reservation++) {
      if (reservations[reservation]) {
        const col1 = $('<div>', { class: 'col-sm-3 reservation-card' });
        const card1 = $('<div>', {
          class: 'card border-success reservation-card-body',
        });
        const cardHeader = $('<div>', {
          class: 'card-header reservation-card-header',
        });
        const created_at = moment(
          Number(reservations[reservation].created_at),
        ).format('DD-MM-YYYY');
        const header1 = $('<span>');
        const stopwatch = $('<i>', { class: 'fas fa-stopwatch' });
        const created_at_tag = $('<span>', {
          text: created_at,
          class: 'header-content',
        });
        header1.append(stopwatch);
        header1.append(created_at_tag);

        const header2 = $('<span>');
        const personsicon = $('<i>', { class: 'fas fa-users' });
        const person_tag = $('<span>', {
          text: `${reservations[reservation].persons} Persons`,
          class: 'header-content',
        });
        header2.append(personsicon);
        header2.append(person_tag);
        cardHeader.append(header1);
        cardHeader.append(header2);
        card1.append(cardHeader);
        const cardBody = $('<div>', {
          class: 'card-body table-reservation-card-body',
        });
        // let cardHeading1 = $('<h5>', {
        //   class: '',
        //   text: reservations[reservation].name,
        // });
        // cardBody.append(cardHeading1);

        const custNameInfo = $('<div>');
        const userIcon = $('<i>', { class: 'fas fa-user' });
        const custName = $('<span>', {
          text: reservations[reservation].name,
          class: 'left-padding',
        });
        custNameInfo.append(userIcon);
        custNameInfo.append(custName);
        cardBody.append(custNameInfo);

        // other info
        const reserveInfo = $('<div>');
        // phone
        const phoneInfo = $('<div>');
        const phoneIcon = $('<i>', { class: 'fas fa-phone-alt' });
        const phone = $('<span>', {
          text: reservations[reservation].phone,
          class: 'left-padding',
        });
        phoneInfo.append(phoneIcon);
        phoneInfo.append(phone);
        reserveInfo.append(phoneInfo);

        // occasion
        const occasionInfo = $('<div>');
        const occasionIcon = $('<i>', { class: 'fas fa-location-arrow' });
        const occasion = $('<span>', {
          text: reservations[reservation].occasion,
          class: 'left-padding',
        });
        occasionInfo.append(occasionIcon);
        occasionInfo.append(occasion);
        reserveInfo.append(occasionInfo);
        if (!reservations[reservation].occasion) {
          $(occasionInfo).css({ visibility: 'hidden' });
        }

        const check_in_formatted_date = moment(
          Number(reservations[reservation].check_in),
        ).format('DD-MM-YYYY HH:mm A');
        const check_in = $('<div>', {
          text: `Check In - ${check_in_formatted_date}`,
        });
        reserveInfo.append(check_in);

        const reservation_note = $('<div>', {
          text: `Note - ${reservations[reservation].instructions}`,
        });
        reserveInfo.append(reservation_note);

        const reservation_id = $('<div>', {
          text: `Reservation Id - ${reservations[reservation].reservation_id}`,
        });
        reserveInfo.append(reservation_id);

        cardBody.append(reserveInfo);

        // allocate table button
        if (reservations[reservation].status == 'pending') {
          const allocateTableButton = $('<button>', {
            class: 'btn btn-outline-success allocateTable allocate-table-btn',
            id: 'allocateTable',
            html: 'Confirm',
          })
            .attr('reservation_data', JSON.stringify(reservations[reservation]))
            .click(function (e) {
              confirmReservation(reservations[reservation]);
            });
          cardBody.append(allocateTableButton);
          // edit delete address
          const update_div = $('<div>', {
            class: 'update-address-class',
          });

          const edit_reservation_icon = $('<i>', {
            class: ' fa fa-edit editaddressicon',
          }).click(() => {
            editTableReservation(reservations[reservation]);
          });

          const delete_reservation_icon = $('<i>', {
            class: 'fa fa-trash-o deleteaddressicon',
          }).click(() => {
            deleteTableRervation(reservations[reservation]);
          });
          update_div.append(edit_reservation_icon);
          update_div.append(delete_reservation_icon);

          cardBody.append(update_div);
        }
        if (reservations[reservation].status == 'confirmed') {
          const allocateTableButton = $('<button>', {
            class: 'btn btn-outline-success allocateTable allocate-table-btn',
            id: 'allocateTable',
            html: 'Allocate Table',
          })
            .attr('reservation_data', JSON.stringify(reservations[reservation]))
            .click(function (e) {
              $('#tableReservationtListID div div').removeClass(
                'selected-reservation',
              );
              $(this).closest('div').addClass('selected-reservation');
              changeTableForKot(this);
            });
          cardBody.append(allocateTableButton);
          // edit delete address
          const update_div = $('<div>', {
            class: 'update-address-class',
          });

          const edit_reservation_icon = $('<i>', {
            class: ' fa fa-edit editaddressicon',
            title: 'Edit',
          }).click(() => {
            editTableReservation(reservations[reservation]);
          });

          const delete_reservation_icon = $('<i>', {
            class: 'fa fa-trash-o deleteaddressicon',
            title: 'Delete',
          }).click(() => {
            deleteTableRervation(reservations[reservation]);
          });
          update_div.append(edit_reservation_icon);
          update_div.append(delete_reservation_icon);

          cardBody.append(update_div);
        }
        card1.append(cardBody);
        col1.append(card1);
        row.append(col1);
      }
      $('#tableReservationtListID').append(row);
    }
  }
  //   });
}

async function editTableReservation(reservation) {
  const { name, phone, persons, occasion, check_in, instructions } =
    reservation;

  $('#custNameForReservationid').val(name);
  $('#custPhoneForReservationid').val(phone);
  $('#personsForReservationid').val(persons);
  $('#noteForReservationid').val(instructions);
  $(`input[name="reservationOccations"][value='${occasion}']`).prop(
    'checked',
    true,
  );

  const date = window.moment(Number(check_in)).format('YYYY-MM-DD');
  const time = window.moment(Number(check_in)).format('HH:mm');
  $('#datePickerForReservationid').val(date);
  $('#timePickerForReservationid').val(time);
  $('#submitReservatioDataButtonid').hide();
  $('#updateReservatioDataButtonid').show();
  reservationToBeUpdated = reservation;

  // Add this line to ensure the form opens
  openCreateReservationForm();
}

async function deleteTableRervation(reservation) {
  const deleteReservationonfirmation = await Swal.fire({
    title: $.i18n.t('controller:orderController.doYouWantToCancelReservation'),
    showConfirmButton: true,
    showCancelButton: true,
    width: '23em',
    allowOutsideClick: true,
    allowEscapeKey: false,
    confirmButtonText: $.i18n.t('controller:orderController.Yes'),
    cancelButtonText: $.i18n.t('controller:orderController.Cancel'),
    customClass: {
      popup: 'tmbill-swal-pop-up',
      content: 'tmbill-swal-title-class',
      input: 'tmbill-swal-input2',
      container: 'delete-address-confirmation',
    },
  });

  if (
    deleteReservationonfirmation &&
    deleteReservationonfirmation.isConfirmed
  ) {
    sendDeleteReservationAddress(reservation);
  }
}

async function confirmReservation(reservation) {
  const reservationData = {
    ...reservation,
    status: 'confirmed',
  };
  showLoader({
    title: 'Confirming Reservation',
    text: $.i18n.t('controller:orderController.pleaseWait'),
  });
  try {
    const { data } = await apiCall.put(
      window.Config.links.getTableReservations,
      reservationData,
      {
        headers: getHeadersformposforrender(),
      },
    );

    Swal.close();
    if (data && data.status === 200) {
      window.notifyUser.showMessage(
        'success',
        $.i18n.t('controller:orderController.Reservationconfirmedsuccessfully'),
      );
      renderNewReservations();
    }
  } catch (error) {
    console.log('Error while confirming reservation:', error);
  }
}

async function sendDeleteReservationAddress(reservation) {
  try {
    const { reservation_id, store_id, tmpos_id } = reservation;
    const payload = {
      reservation_id,
      store_id,
      tmpos_id,
    };

    const response = await apiCall.delete(
      window.Config.links.getTableReservations,
      {
        data: payload,
        headers: getHeadersformposforrender(),
      },
    );

    if (response?.data?.status === 200) {
      window.notifyUser.showMessage(
        'success',
        $.i18n.t('controller:orderController.Reservationcancelledsuccessfully'),
      );
      renderNewReservations();
    } else {
      window.notifyUser.showMessage('success', 'Something went wrong');
    }
  } catch (error) {
    console.log('Error while cancelling reservation');
  }
}
async function changeTableForKot(button) {
  const result = await showSelecttablepopup();

  if (result.isConfirmed) {
    const { destinationtable, destinationtableName } = result.value;
    const selectedReservation = $(
      '#tableReservationtListID div div.selected-reservation .allocateTable',
    );
    if (selectedReservation.length > 0) {
      const data = $(selectedReservation).attr('reservation_data');
      const reservationData = JSON.parse(data);
      const phoneWithPrefix = reservationData.phone;
      const phone = parsePhoneNumberFromString(reservationData.phone);
      let customer_mobile = reservationData.phone;
      let dial_code = window.dial_code;
      if (phone && phone.nationalNumber) {
        customer_mobile = phone.nationalNumber;
        dial_code = phone.countryCallingCode;

        Object.assign(reservationData, {
          phone: customer_mobile,
        });
      }
      // update reservation id to selected table and do entry in reservation table
      const tableReservationResult = await window.betteripcRenderer.callMain(
        SET_RESERVATION_ID_TO_TABLE,
        {
          table_id: destinationtable,
          reservation_id: reservationData.reservation_id,
          table_color: TableUtils.Colors.RESERVED_TABLE,
          customer_name: reservationData.name,
          customer_mobile,
          dial_code,
        },
      );
      if (tableReservationResult) {
        switch (tableReservationResult.status) {
          case 200:
            $(`#table_${destinationtable}`).css(
              'background-color',
              TableUtils.Colors.RESERVED_TABLE,
            );
            $(`#table_${destinationtable}`)
              .find('#tablecustomernameLabelid')
              .html(reservationData.name);
            Object.assign(reservationData, {
              table_id: destinationtable,
              status: 'allocated',
            });
            if (
              $(`#table_${destinationtable}`) &&
              $(`#table_${destinationtable}`)[0] &&
              $(`#table_${destinationtable}`)[0].data
            ) {
              $(`#table_${destinationtable}`)[0].data.extra_details = {
                customer_name: reservationData.name,
                customer_mobile,
              };
            }

            const updateReservationData = cloneDeep(reservationData);
            Object.assign(updateReservationData, {
              phone: phoneWithPrefix,
            });

            await updateTableidToReservationData(updateReservationData);

            // create table reservation record
            Object.assign(reservationData, {
              table_name: destinationtableName,
            });
            await window.betteripcRenderer.callMain(
              CREATE_TABLE_RESERVATION_RECORD,
              reservationData,
            );
            const updateColordetails = {
              table_id: destinationtable,
              table_color: TableUtils.Colors.RESERVED_TABLE,
              customer_name: reservationData.name,
              tableReservation: true,
            };
            sendUpdateTableColorevent(updateColordetails);
            $('#tableReservationModal').modal('hide');
            window.notifyUser.showMessage('success', 'Table reserved');
            break;

          case 400:
            window.notifyUser.showMessage(
              'error',
              $.i18n.t('controller:orderController.Tableisreservedalready'),
            );
            break;
          default:
            if (tableReservationResult.message) {
              window.notifyUser.showMessage(
                'error',
                tableReservationResult.message,
              );
            } else {
              window.notifyUser.showMessage(
                'error',
                $.i18n.t('controller:orderController.Somethingwentwrong'),
              );
            }
            break;
        }
      }
    }

    // await
  }
}

async function updateTableidToReservationData(reservationData) {
  try {
    await apiCall.put(
      window.Config.links.getTableReservations,
      reservationData,
      {
        headers: getHeadersformposforrender(),
      },
    );
  } catch (error) {
    console.log('Error while updated table id to reservation data:', error);
  }
}

function openCreateReservationForm() {
  $('#createRservationbuttonid').hide();
  $('#createReservationFormid').show();
  $('#tableReservationtListID').hide();
  $('#paginateTableReservations').empty();

  $('#newRservationbuttonid').removeClass('active');
  $('#AllocatedReservationsbuttonid').removeClass('active');
  $('#fulfilledReservationbuttonid').removeClass('active');
  $('#cancelledRservationbuttonid').removeClass('active');
  $('#createRservationbuttonid').addClass('active');
  $('#noreservationfoundid').hide();
}

function generateReservationPayload() {
  const name = $('#custNameForReservationid').val();
  const phone = $('#custPhoneForReservationid').val();
  const persons = $('#personsForReservationid').val();
  const instructions = $('#noteForReservationid').val();

  const occasion = $("input:radio[name='reservationOccations']:checked").val();
  const date = $('#datePickerForReservationid').val();
  const time = $('#timePickerForReservationid').val();
  const combinedDateTime = `${date} ${time}`;
  const checkIn = window
    .moment(combinedDateTime, 'YYYY-MM-DD HH:mm')
    .format('x');

  if (!name) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.Pleaseentercustomername'),
    );
    return;
  }

  if (!phone) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.Pleaseentercustomerphone'),
    );
    return;
  }

  if (!persons) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.Pleaseenterguests'),
    );
    return;
  }

  if (!date || date === 'Select Date') {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.Pleaseselectdate'),
    );
    return;
  }

  if (!time || time === 'Select Time') {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.Pleaseselecttime'),
    );
    return;
  }

  if (instructions && instructions.length > 100) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.Noteshouldbelessthan100characters'),
    );
    return;
  }

  if (persons && persons.length > 3) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:orderController.Numberofguestsshouldbeupto3digit'),
    );
    return;
  }

  const payload = {
    store_id: window.storeDetails.store_id,
    tmpos_id: window.storeDetails.tmpos_id,
    phone,
    name,
    email: '',
    status: 'pending',
    persons: Number(persons),
    check_in: checkIn,
    check_out: null,
    instructions,
    tags: null,
    occasion,
  };

  return payload;
}

async function makeCreateRservationRequest() {
  try {
    const payload = generateReservationPayload();
    if (payload) {
      showLoader({
        title: 'Creating Reservation',
        text: $.i18n.t('controller:orderController.pleaseWait'),
      });

      const response = await apiCall.post(
        window.Config.links.getTableReservations,
        payload,
        {
          headers: getHeadersformposforrender(),
        },
      );
      if (
        response &&
        (response.status === 200 || response.status === 201) &&
        response.data &&
        response.data.status === 200
      ) {
        Swal.close();
        window.notifyUser.showMessage(
          'success',
          $.i18n.t('controller:orderController.Reservationsuccessful'),
        );

        renderNewReservations();
        resetRservationFormData();
      } else {
        Swal.close();
        window.notifyUser.showMessage(
          'error',
          $.i18n.t('controller:orderController.Somethingwentwrong'),
        );
      }
    }
  } catch (error) {
    console.log('Error while creating reservation::', error);
  }
}

async function makeUpdateRservationRequest() {
  try {
    const payload = generateReservationPayload();
    if (reservationToBeUpdated && reservationToBeUpdated.reservation_id) {
      Object.assign(payload, {
        reservation_id: reservationToBeUpdated.reservation_id,
      });
    }
    showLoader({
      title: 'Updating Reservation',
      text: $.i18n.t('controller:orderController.pleaseWait'),
    });

    const response = await apiCall.put(
      window.Config.links.getTableReservations,
      payload,
      {
        headers: getHeadersformposforrender(),
      },
    );
    if (response && response.data && response.data.status === 200) {
      Swal.close();
      window.notifyUser.showMessage(
        'success',
        $.i18n.t('controller:orderController.Reservationsuccessful'),
      );

      renderNewReservations();
      resetRservationFormData();
    } else {
      Swal.close();

      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:orderController.Somethingwentwrong'),
      );
    }
  } catch (error) {
    console.log('Error while creating reservation::', error);
  }
}

function Initialize() {
  window.flatpickr('#datePickerForReservationid', {
    minDate: 'today',
    enableTime: false,
    dateFormat: 'Y-m-d',
  });

  window.flatpickr('#timePickerForReservationid', {
    enableTime: true,
    noCalendar: true,
    dateFormat: 'H:i',
    minuteIncrement: 30,
  });
  $('#personsForReservationid').on('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
    if (this.value.length > 3) {
      this.value = this.value.slice(0, 3);
    }
  });
  $('#custPhoneForReservationid').on('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
    if (this.value.length > 15) {
      this.value = this.value.slice(0, 15);
    }
  });

  $('#submitReservatioDataButtonid').on(
    'click',
    debounce(() => {
      makeCreateRservationRequest();
    }, 200),
  );

  $('#updateReservatioDataButtonid').on(
    'click',
    debounce(() => {
      makeUpdateRservationRequest();
    }, 200),
  );

  setTimeout(() => {
    $('#newRservationbuttonid').on(
      'click',
      debounce(() => {
        renderNewReservations();
      }, 200),
    );
  }, 3000);

  setTimeout(() => {
    $('#AllocatedReservationsbuttonid').on(
      'click',
      debounce(() => {
        renderAllocatedReservations();
        $('#pullRemotekotButton').hide();
      }, 200),
    );
  }, 3000);

  setTimeout(() => {
    $('#fulfilledReservationbuttonid').on(
      'click',
      debounce(() => {
        renderFulfilledReservations();
      }, 200),
    );
  }, 3000);

  setTimeout(() => {
    $('#cancelledRservationbuttonid').on(
      'click',
      debounce(() => {
        renderCancelledReservations();
      }, 200),
    );
  }, 3000);
  setTimeout(() => {
    $('#createRservationbuttonid').on('click', () => {
      openCreateReservationForm();
    });
  }, 3000);
}

setTimeout(() => {
  Initialize();
}, 1000);
module.exports = {
  openTableReservationModal,
  updateTableidToReservationData,
};
