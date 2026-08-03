const { apiCall } = require('../../services/APIService');
const { RESET_FCM_TOKEN } = require('../../util/IPC_Messages');

let tmbFcmState = 'ready';
let tmbFcmTimer = null;
let tmbFcmCancelled = false;
(function () {
  function initTmbFcm() {
    bindEvents();

    $('#gobacktomenumanagementfromfcmview')
      .off('click')
      .on('click', function () {
        $('#fcmTestwindowWrapperid').hide();
        $('#menuManagementwindowWrapperid').show();
      });

    resetTest();
  }

  function bindEvents() {
    $('#tmbFcmStartBtn').off('click').on('click', handleStart);
    $('#tmbFcmCancelBtn').off('click').on('click', handleCancel);

    $('#resetFCMTokenButton')
      .off('click')
      .on('click', function () {
        const confirmed = confirm(
          'Are you sure you want to reset the FCM Token?\n\nApplication restart will be required.',
        );

        if (!confirmed) return;

        // Show loader dialog
        if (typeof Swal !== 'undefined') {
          Swal.fire({
            title: 'Resetting Token',
            text: 'Resetting FCM token and restarting application. Please wait...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });
        }

        // Give UI time to render loader before restart
        setTimeout(() => {
          window.betteripcRenderer.callMain(RESET_FCM_TOKEN, {});
        }, 3000);
      });
  }
  // function setStep(stepNo, mode, statusText) {
  //   const $step = $('#tmbFcmStep' + stepNo);
  //   const $icon = $step.find('.tmb-fcm-step-icon');
  //   const $status = $step.find('.tmb-fcm-step-status');

  //   $step.removeClass('done active failed');

  //   if (mode === 'done') {
  //     $step.addClass('done');
  //     $icon.html('✓');
  //   } else if (mode === 'active') {
  //     $step.addClass('active');
  //     $icon.html('<div class="tmb-fcm-spinner"></div>');
  //   } else if (mode === 'failed') {
  //     $step.addClass('failed');
  //     $icon.html('✕');
  //   } else {
  //     $icon.html('<div class="tmb-fcm-step-pending"></div>');
  //   }

  //   $status.text(statusText || 'PENDING');
  // }
  function setStep(stepNo, mode, statusText) {
    const $step = $('#tmbFcmStep' + stepNo);
    const $icon = $step.find('.tmb-fcm-step-icon');
    const $status = $step.find('.tmb-fcm-step-status');

    $step.removeClass('done active failed');

    if (mode === 'done') {
      $step.addClass('done');
      $icon.html('✓');
    } else if (mode === 'active') {
      $step.addClass('active');
      $icon.html(
        '<div class="tmb-fcm-spinner"><i class="fa-solid fa-circle-notch fa-spin"></i></div>',
      );
    } else if (mode === 'failed') {
      $step.addClass('failed');
      $icon.html('✕');
    } else {
      $icon.html('<div class="tmb-fcm-step-pending"></div>');
    }

    $status.text(statusText || 'PENDING');
  }
  function setProgress(percent, message, color) {
    $('#tmbFcmProgressMsg').text(message);
    $('#tmbFcmProgressPct').text(percent + '%');
    $('#tmbFcmProgressFill')
      .css('width', percent + '%')
      .css('background', color === 'red' ? '#d23c3c' : '#1db87a');
  }

  function setBadge(mode, text) {
    const $badge = $('#tmbFcmBadge');

    $badge
      .removeClass(
        'tmb-fcm-badge-ready tmb-fcm-badge-success tmb-fcm-badge-failed',
      )
      .addClass('tmb-fcm-badge-' + mode);

    $('#tmbFcmBadgeText').text(text);
  }

  function showAlert(type, title, desc) {
    const $alert = $('#tmbFcmAlert');

    $alert.addClass('show');

    if (type === 'success') {
      $alert.css('background', '#e8f8f0');
      $('#tmbFcmAlertIcon').text('✓');
    } else {
      $alert.css('background', '#fff4f4');
      $('#tmbFcmAlertIcon').text('⚠️');
    }

    $('#tmbFcmAlertTitle').text(title);
    $('#tmbFcmAlertDesc').text(desc || '');
  }

  function hideAlert() {
    $('#tmbFcmAlert').removeClass('show');
  }

  async function triggerServerRequest() {
    try {
      const result = await apiCall.post(window.Config.links.testFCM, {
        fcm_token: window.firebaseToken,
        store_id: window.storeDetails.store_id,
        token: window.testFCMToken,
      });
      return result.data;
    } catch (error) {
      console.log(
        `Message="Error while triggering server request" Error=`,
        error,
      );
    }
  }
  function failStepsFrom(stepNo) {
    for (let i = stepNo; i <= 5; i++) {
      if ($('#tmbFcmStep' + i).hasClass('done')) continue;
      setStep(i, 'failed', 'FAILED');
    }

    setProgress(75, 'Test halted due to error', 'red');
    setBadge('failed', 'TEST FAILED');

    $('#tmbFcmSubtitle').text(
      'Testing failed. Please check your internet connection or Firebase configuration.',
    );

    $('#resetFCMTokenButton').show();
    $('#tmbFcmCancelBtn').hide();

    tmbFcmState = 'failed';
  }
  async function handleStart() {
    if (tmbFcmState === 'running') return;
    tmbFcmCancelled = false;

    tmbFcmState = 'running';
    $('#resetFCMTokenButton').hide();
    $('#tmbFcmCancelBtn').show();
    hideAlert();
    setBadge('ready', 'IN PROGRESS');

    $('#tmbFcmSubtitle').text(
      'Testing Firebase Cloud Messaging integration. Please stay on this screen.',
    );

    for (let i = 1; i <= 5; i++) {
      setStep(i, '', 'PENDING');
    }

    setProgress(0, 'Starting test...');

    try {
      // STEP 1
      setStep(1, 'active', 'VERIFYING...');
      setProgress(15, 'Verifying device token...');
      await delay(800);
      if (tmbFcmCancelled) return;
      if (window.firebaseToken) {
        setStep(1, 'done', 'SUCCESS');
      } else {
        setStep(1, 'failed', 'TOKEN VERIFICATION FAILED');
        failStepsFrom(2);
        return;
      }
      // STEP 2
      setStep(2, 'active', 'REQUESTING...');
      setProgress(35, 'Triggering server request...');
      await delay(800);
      if (tmbFcmCancelled) return;
      let requestTriggred = false;
      window.requestedFCMTokenVerified = false;
      window.testFCMToken = Math.random().toString(36).substring(2, 12);
      const result = await triggerServerRequest();
      console.log('result', result);
      if (
        result &&
        result.status === 200 &&
        result.token === window.testFCMToken &&
        result.sent
      ) {
        requestTriggred = true;
        setStep(2, 'done', 'SUCCESS');
      } else {
        setStep(2, 'failed', 'SERVER REQUEST FAILED');
        failStepsFrom(3);
        return;
      }

      // STEP 3
      setStep(3, 'active', 'SENDING...');
      setProgress(55, 'Server sending notification...');
      if (requestTriggred) {
        setStep(3, 'done', 'SUCCESS');
      } else {
        setStep(3, 'failed', 'NOTIFICATION SEND FAILED');
        failStepsFrom(4);
        return;
      }

      // STEP 4
      setStep(4, 'active', 'WAITING...');
      setProgress(75, 'Awaiting delivery to device...');

      await delay(2000);
      if (tmbFcmCancelled) return;

      function runEveryThreeSeconds() {
        if (tmbFcmCancelled) {
          clearInterval(tmbFcmTimer);
          return;
        }
        let elapsed = 0;
        const intervalTime = 3000;
        const maxTime = 60000;

        tmbFcmTimer = setInterval(async () => {
          if (tmbFcmCancelled) {
            clearInterval(tmbFcmTimer);
            return;
          }
          if (!navigator.onLine) {
            clearInterval(tmbFcmTimer);

            setStep(4, 'failed', 'NOTIFICATION NOT RECEIVED');
            setStep(5, 'failed', 'TEST FAILED');

            $('#resetFCMTokenButton').show();
            $('#tmbFcmCancelBtn').hide();

            tmbFcmState = 'failed';
            return;
          }

          elapsed += intervalTime;
          console.log(`Running at ${elapsed / 1000} seconds`);
          console.log(
            'window.requestedFCMTokenVerified',
            window.requestedFCMTokenVerified,
          );
          if (window.requestedFCMTokenVerified) {
            clearInterval(tmbFcmTimer);
            setStep(4, 'done', 'SUCCESS');
            await delay(1000);
            if (tmbFcmCancelled) return;
            setStep(5, 'done', 'SUCCESS');
            await delay(1000);
            if (tmbFcmCancelled) return;

            setProgress(100, '100% Signal Strength', 'green');
            setBadge('success', 'TEST SUCCESSFUL');
            window.PlayHowlerbyid();

            setTimeout(() => {
              window.stopHowler();
            }, 4000);
            $('#tmbFcmSubtitle').text(
              'Notification test Completed successfully.',
            );

            showAlert(
              'success',
              'Notification Received Successfully',
              'The end-to-end pipeline is fully operational.',
            );
            $('#resetFCMTokenButton').hide();
            $('#tmbFcmCancelBtn').hide();
            tmbFcmState = 'success';
            return;
          }
          if (elapsed >= maxTime) {
            clearInterval(tmbFcmTimer);

            setStep(4, 'failed', 'NOTIFICATION NOT RECEIVED');
            setStep(5, 'failed', 'TEST FAILED');

            $('#resetFCMTokenButton').show();
            $('#tmbFcmCancelBtn').hide();
          }
        }, intervalTime);
      }

      runEveryThreeSeconds();

      // const success = Math.random() > 0.35;

      // if (!success) throw new Error('timeout');

      // SUCCESS

      // setStep(5, 'done', 'SUCCESS');

      // setProgress(100, '100% Signal Strength', 'green');
      // setBadge('success', 'TEST SUCCESSFUL');

      // $('#tmbFcmSubtitle').text('Notification test SUCCESS successfully.');

      // showAlert(
      //   'success',
      //   'Notification Received Successfully',
      //   'The end-to-end pipeline is fully operational.',
      // );

      // tmbFcmState = 'success';
    } catch (e) {
      // FAILED
      setStep(4, 'failed', 'NOTIFICATION NOT RECEIVED');
      setStep(5, 'failed', 'TEST FAILED');

      setProgress(75, 'Test halted due to error', 'red');
      setBadge('failed', 'TEST FAILED');

      $('#tmbFcmSubtitle').text(
        'Testing failed. Please check your Firebase configuration.',
      );

      showAlert(
        'error',
        'Notification Timeout',
        'No response received from device.',
      );
      $('#resetFCMTokenButton').show();
      tmbFcmState = 'failed';
    }
  }

  function handleCancel() {
    tmbFcmCancelled = true;

    if (tmbFcmTimer) {
      clearInterval(tmbFcmTimer);
      tmbFcmTimer = null;
    }

    tmbFcmState = 'ready';

    for (let i = 1; i <= 5; i++) {
      setStep(i, '', 'PENDING');
    }

    setProgress(0, 'Notification test was cancelled,Start it again!');
    setBadge('ready', 'CANCELLED');

    hideAlert();

    $('#tmbFcmCancelBtn').hide();
    $('#resetFCMTokenButton').hide();

    $('#tmbFcmSubtitle').text(
      'Test was cancelled. You can start again anytime.',
    );
  }

  window.resetTest = function resetTest() {
    tmbFcmState = 'ready';

    hideAlert();

    setBadge('ready', 'READY');
    $('#resetFCMTokenButton').hide();
    $('#tmbFcmCancelBtn').hide();

    $('#tmbFcmSubtitle').text(
      'Verify your Firebase Cloud Messaging configuration by running a diagnostic test.',
    );

    for (let i = 1; i <= 5; i++) {
      setStep(i, '', 'PENDING');
    }

    setProgress(0, 'Waiting to start...');
  };

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  $(document).ready(function () {
    if ($('.tmb-fcm-root').length) {
      initTmbFcm();
    }
  });
})();
