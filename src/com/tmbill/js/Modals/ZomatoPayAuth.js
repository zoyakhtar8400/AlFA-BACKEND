const { apiCall } = require('../../services/APIService');
const {
  getHeadersformposforrender,
} = require('../../util/MiscServer.renderer');
const { sleep } = require('../../util/MiscUtil');
const { safeParse } = require('../../util/RendererUtils');

function initialize() {
  $('#VeifyZomatoPayAuthCodebuttonId').on('click', async () => {
    const orderdata = $('#neworderpaymentModalid').attr('data');
    if (orderdata) {
      const tableData = safeParse(orderdata);
      const { details } = tableData;
      const formattedDate = window.moment().format('YYYY-MM-DD');
      const authCode = $('#zomatoPayAuthenticationCodeInputid').val();
      if (!authCode || !authCode.length) {
        window.notifyUser.showMessage('error', 'Please enter auth code');
        return;
      }

      if (Number.isNaN(Number(authCode))) {
        window.notifyUser.showMessage('error', 'Please enter valid auth code');
        return;
      }
      $('#verifyingAuthCodeContainerId').show();
      const payload = {
        order_id: details.bill_number,
        paid_amount: details.order_total,
        store_id: window.storeDetails.store_id,
        tmpos_id: window.storeDetails.tmpos_id,
        auth_code: Number(authCode),
        order_date: formattedDate,
      };

      console.log('payload::', payload);
      try {
        const { data } = await apiCall.post(
          window.Config.links.START_ZOMATO_PAY_TRX,
          payload,
          {
            headers: getHeadersformposforrender(),
          },
        );
        $('#verifyingAuthCodeContainerId').hide();

        if (data.status === 400) {
          $('#zomatoPayAuthFailureMessageID').show();
          $('#zomatoPayAuthFailureMessageID').html(data.message);
        }

        if (data.status === 200) {
          $('#zomatoPayAuthSuccessMessageID').show();
          if (
            data.zomato_pay &&
            data.zomato_pay.status === 'transaction_found'
          ) {
            $('#zomatoPayAuthSuccessMessageID').html(
              `Verification Completed - Payment Confirmed. ${data.zomato_pay.amount_receivable} ${window.storeDetails.currency} Amount Received `,
            );
            Object.assign(tableData.details.extra_details, {
              zomatoPay_AuthCode: authCode,
              zomatoPay_amount_receivable: data.zomato_pay.amount_receivable,
            });
            if (data.zomato_pay.amount_receivable !== details.order_total) {
              // $('#newpaymentsplitCheckid').prop('checked', true);
              $('#newpaymentsplitCheckid').click();
              $('#newpaysplitpayAmount').val(data.zomato_pay.amount_receivable);
              $('#newpayaddpayMethodbutton').click();
            }
            $('#neworderpaymentModalid').attr(
              'data',
              JSON.stringify(tableData),
            );
          } else {
            $('#zomatoPayAuthSuccessMessageID').hide();
            $('#zomatoPayAuthFailureMessageID').show();
            $('#zomatoPayAuthFailureMessageID').html(data.zomato_pay.message);
          }
          setTimeout(() => {
            $('#zomatoPayAuthModal').modal('hide');
          }, 5000);
        }
      } catch (error) {
        console.error(error);
      }
    }
  });
}

initialize();
