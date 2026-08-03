/* eslint-disable func-names */
const Swal = require('sweetalert2');

const successHowl = undefined;
const cancelHowl = undefined;

function intializeNotification() {}

const playHowlersoundbytype = async function (howlerType) {
  if (window.howlerId !== undefined) {
    window.howlerId.play();
  }
  switch (howlerType) {
    case 'success':
      if (cancelHowl !== undefined) {
        successHowl.play();
      }
      break;
    case 'failure':
      if (cancelHowl !== undefined) {
        cancelHowl.play();
      }
      break;
    default:
      break;
  }
};

const playHowlersoundbyid = async function (howlerId) {
  if (howlerId !== undefined) {
    howlerId.play();
  }
  if (howlerId === undefined && !successHowl) {
    successHowl.play();
  }
};

const stopHowling = async function () {
  if (!successHowl) {
    successHowl.stop();
  }
  if (!cancelHowl) {
    cancelHowl.stop();
  }
};

const Toast = Swal.mixin({
  toast: true,
  background: 'rgba(0,0,0,0) linear-gradient(#444,#111) repeat scroll 0 0',
  position: 'bottom-left',
  showConfirmButton: false,
  padding: '10px',
  timer: 3000,
});

function showMessage(icon, message, timeout) {
  setTimeout(
    (_) => {
      Toast.fire({
        icon,
        title: message,
        customClass: {
          title: 'tmbill-swal-toast-title-class',
          body: 'tmbill-swal-toast-body-class',
        },
      });
    },
    timeout && !Number.isNaN(timeout) ? timeout : 0,
  );
}

intializeNotification();

module.exports = {
  showMessage,
  Swal,
  playHowlersoundbyid,
  stopHowling,
  playHowlersoundbytype,
};
