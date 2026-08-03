/* eslint-disable camelcase */
const { forEach, maxBy, debounce, capitalize, map } = require('lodash');
const { default: axios } = require('axios');
const { LOADER } = require('./RawButtons');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const { apiCall } = require('../services/APIService');
let currentCustomerphone;
let currentCouponCode;
let max_redemption_point;
let cashback_redemption;
let order_subtotal;
let orderItems = [];
let customer_points = 0;

/**
 * Show customer rewards
 * @param {*} param0
 * @returns
 */
async function showCustomerReelopointsandrewards({
  phone,
  tmpos_id,
  store_id,
  subtotal,
  billing_type,
  items,
}) {
  try {
    resetReelorewardsUI();
    order_subtotal = Number(subtotal);
    orderItems = items;
    $(`#storeReelorewardslistContainerid`).append($(LOADER));
    currentCustomerphone = phone;
    currentBillingtype = billing_type;

    const result = await apiCall.post(
      window.Config.links.getReelocustomerLoyaltyDetails,
      {
        store_id: window.storeDetails.store_id,
        customer_mobile: phone,
      },
      {
        headers: getHeadersformposforrender(),
      },
    );
    // result =JSON.parse(result)
    // if (result && result.data) {
    // if (result) {
    if (result.data.status == '200') {
      if (result) {
        const response = result.data;
        const storedRewards = response.reeloResponse.response.coupons;
        const customer = _.find(customersList, { phone });

        const points = response.reeloResponse.response.loyalty_points;
        let coupons = 0;
        coupons = response.reeloResponse.response.coupons.length;
        customer_points = points;
        if (points === 0 && !coupons) {
          $('#reeloOTPButton').prop('disabled', true);
        } else {
          $('#reeloOTPButton').prop('disabled', false);
        }
        if (points) {
          let name = customer ? customer.name : 'customer';
          $(`#reelorewardsModalBodyid div.alert-success`).show();
          $(`#reelorewardsModalBodyid div.alert-success`).html(
            `${
              name ? capitalize(name) : 'Customer'
            } has total ${points} points`,
          );
        } else {
          $(`#reelorewardsModalBodyid div.alert-success`).hide();
        }

        if (response.reeloResponse.response.cashback_redemption) {
          cashback_redemption =
            response.reeloResponse.response.cashback_redemption;
        }

        if (
          response.reeloResponse.response.max_redemption_value_in_percentage
        ) {
          max_redemption_point =
            response.reeloResponse.response.max_redemption_value_in_percentage;
          $('#usepointsloyaltycontainerid').show();
        } else {
          $('#usepointsloyaltycontainerid').hide();
        }
        if (
          storedRewards &&
          Array.isArray(storedRewards) &&
          storedRewards.length
        ) {
          $('#storeReelorewardslistContainerid').show();
          $('#redeemPointsContainerid').hide();
          fillRewardinlistcontainer(storedRewards, points, subtotal);
        } else {
          // window.notifyUser.showMessage('error', $.i18n.t('controller:loyaltyController.noRewardsFound'));
          // $('#reelorewardsModalid').modal('toggle');
          // return
          $('#redeemPointsContainerid').show();
          $('#storeReelorewardslistContainerid').hide();
          $(`#storeReelorewardslistContainerid`).empty();
        }
      } else if (result.data.status == '303') {
        // reloginfromremote();
      }
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:loyaltyController.noRewardsFound'),
      );
      $('#reelorewardsModalid').modal('toggle');
      return;
    }
  } catch (error) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:loyaltyController.noRewardsFound'),
    );
    $('#reelorewardsModalid').modal('toggle');
    if ([401].includes(error?.response?.status)) {
      reloginfromremote();
    }
  }
}

/**
 * Show the list of rewards to the customer
 * @param {Rewards list} rewards
 * @param {Customer current points} points
 * @param {order subtotal} subtotal
 */
async function fillRewardinlistcontainer(rewards, points, subtotal) {
  $(`#storeReelorewardslistContainerid`).empty();
  forEach(rewards, (reward) => {
    let requiredPoints = $(`<span>`, {
      class: `badge badge-warning float-right badge-pill`,
      // html: `Required Points ${reward.extra_fields[0].value}`
      html: `${`${
        reward.extra_fields[0].name == 'Points Value'
          ? `Required Points ${reward.extra_fields[0].value}`
          : ''
      }`}`,
    });

    let element = $(`<li>`, {
      class: `list-group-item`,
      html: reward.coupon_name,
      id: `reward_${reward.coupon_code}`,
    })
      .append(requiredPoints)
      .data('reward', reward)
      .click(function () {
        checkReward(this, reward, points, subtotal);
      });
    $(`#storeReelorewardslistContainerid`).append(element);
  });
  // findBestoffer(rewards, points, subtotal);
}

function checkReward(element, reward, points, subtotal) {
  $(`#storeReelorewardslistContainerid li`).removeClass('activeElement');
  currentCouponCode = reward.coupon_code;
  let reward_type = reward.extra_fields.find(
    (item) => item.name === 'Reward Type',
  );
  if (Number(points) || (reward_type && reward_type.value == 'Promotion')) {
    $(element).addClass('activeElement');
  } else {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:loyaltyController.youDontHaveEnoughPoints'),
    );
  }
}

async function sendorverifyOTP() {
  if (!navigator.onLine) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:loyaltyController.noInternetConnection'),
    );
    return;
  }

  const isPointSelected = $('#usepointsloyaltyid').is(':checked');

  if (isPointSelected) {
    // check if points are added
    const addedPoints = $('#reeloPointsRedeeminputid').val();
    console.log('added point', addedPoints);
    if (!addedPoints) {
      window.notifyUser.showMessage('error', 'Please enter points');
      return;
    }

    if (addedPoints > order_subtotal) {
      window.notifyUser.showMessage(
        'error',
        'Points should be less than order total',
      );
      return;
    }
  }

  // check if points are less than order total

  //check reelo points

  $(`#storeReelorewardslistContainerid`).hide();
  if ($('#reeloOTPButton').html() == 'Send OTP') {
    $('#reeloOTPButton').html('Sending OTP');
    const response = await sendOTPtocustomerrequest();
    if (
      (response &&
        response.reeloResponse &&
        response.reeloResponse.status_code == '200') ||
      (response && response.status == '201')
    ) {
      $('#reeloOTPButton').html('Verify');
      $(`#reelorewards-otp-containerid input`).attr(
        `placeholder`,
        $.i18n.t('controller:loyaltyController.pleaseEnterOTP'),
      );
    } else {
      $('#reeloOTPButton').html('Send OTP');
    }
  } else {
    let enteredOtp = $(`#reelorewards-otp-containerid input`).val();
    if (currentCouponCode) {
      const response = await apiCall.post(
        Config.links.reeloRedeemCoupon,
        {
          customer_mobile: currentCustomerphone,
          store_id: window.storeDetails.store_id,
          coupon_code: currentCouponCode,
          otp: Number(enteredOtp),
        },
        {
          headers: getHeadersformposforrender(),
        },
      );
      if (
        response &&
        response.data &&
        response.data.reeloResponse.status_code == 200
      ) {
        $('#reeloOTPButton').prop('disabled', true);
        $(`#applyselectedReeloRewardbuttonid`).show();
        const selectedReward = $(
          `#storeReelorewardslistContainerid li.activeElement`,
        ).data('reward');
        $(`#applyselectedReeloRewardbuttonid`).data(
          'reward',
          selectedReward || undefined,
        );
        $(`#applyselectedReeloRewardbuttonid`).click();
        window.notifyUser.showMessage(
          'success',
          response.data.reeloResponse.response.message,
        );
      } else {
        if (response?.data?.reeloResponse?.response?.message) {
          window.notifyUser.showMessage(
            'error',
            response.data.reeloResponse.response.message,
          );
        } else {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:loyaltyController.pleaseEnterValidOTP'),
          );
        }
        $(`#rewards-otp-containerid input`).val('');
      }
    } else {
      let points = $('#reeloPointsRedeeminputid').val();

      const response = await apiCall.post(
        Config.links.reeloRedeemPoints,
        {
          customer_mobile: currentCustomerphone,
          store_id: window.storeDetails.store_id,
          points: Number(points),
          otp: Number(enteredOtp),
        },
        {
          headers: getHeadersformposforrender(),
        },
      );
      if (
        response &&
        response.data &&
        response.data.reeloResponse.status_code == 200
      ) {
        $('#reeloOTPButton').prop('disabled', true);
        $(`#applyselectedReeloRewardbuttonid`).show();
        let discount_value = Number(
          response.data.reeloResponse.response.points_value,
        );
        // if(discount_value > max_redemption_point ){
        //     discount_value = max_redemption_point;
        // }
        const selectedReward = {
          discount_on: 'bill',
          discount_value: discount_value,
          discount_type: 'fixed',
          coupon_name: '',
          isReedemPointReward: true,
        };
        $(`#applyselectedReeloRewardbuttonid`).data(
          'reward',
          selectedReward || undefined,
        );
        $(`#applyselectedReeloRewardbuttonid`).click();
        window.notifyUser.showMessage(
          'success',
          response.data.reeloResponse.response.message,
        );
      } else {
        if (response?.data?.reeloResponse?.response?.message) {
          window.notifyUser.showMessage(
            'error',
            response.data.reeloResponse.response.message,
          );
        } else {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:loyaltyController.pleaseEnterValidOTP'),
          );
        }

        $(`#rewards-otp-containerid input`).val('');
      }
    }
  }
}

async function sendOTPtocustomerrequest() {
  try {
    let response;
    if (currentCouponCode) {
      const selectedReward = $(
        `#storeReelorewardslistContainerid li.activeElement`,
      ).data('reward');

      if (selectedReward.discount_on == 'item') {
        let checkItems = [];

        orderItems.map((item) => {
          let checkitem;
          if (item.item_refid) {
            checkitem = selectedReward.products.find(
              (element) => element._id == item.item_refid,
            );
          } else {
            checkitem = selectedReward.products.find(
              (element) => element._id === item.item_id,
            );
          }
          if (checkitem) {
            checkItems.push(checkitem);
          }
        });

        if (!checkItems || checkItems.length == 0) {
          $(`#storeReelorewardslistContainerid`).show();
          $('#reeloOTPButton').html('Send OTP');
          $(`#reelorewardsModalBodyid div.alert-danger`).show();
          $(`#reelorewardsModalBodyid div.alert-danger`).html(
            'Sorry item is not present in order',
          );
          return;
        } else {
          $(`#reelorewardsModalBodyid div.alert-danger`).hide();
        }
      }
      response = await apiCall.post(
        Config.links.reeloAuthRedeemption,
        {
          customer_mobile: currentCustomerphone,
          store_id: window.storeDetails.store_id,
          coupon_code: currentCouponCode,
        },
        {
          headers: getHeadersformposforrender(),
        },
      );
    } else {
      const points = $('#reeloPointsRedeeminputid').val();
      // let max_redem_points = (order_subtotal * max_redemption_point) / 100;
      let max_redem_points = (customer_points * max_redemption_point) / 100;
      max_redem_points = Math.floor(max_redem_points);

      if (
        cashback_redemption &&
        cashback_redemption.active &&
        cashback_redemption.percentage
      ) {
        const reedemPoint =
          (order_subtotal * cashback_redemption.percentage) / 100;
        if (reedemPoint < max_redem_points) {
          max_redem_points = reedemPoint;
        }
      }
      if (points > max_redem_points) {
        $('#reeloOTPButton').html('Send OTP');
        //  window.notifyUser.showMessage('error', `You can redeem upto ${max_redem_points} points`);
        $(`#reelorewardsModalBodyid div.alert-danger`).show();
        $(`#reelorewardsModalBodyid div.alert-danger`).html(
          `${$.i18n.t(
            'controller:loyaltyController.Youcanredeemupto',
          )} ${max_redem_points} ${$.i18n.t(
            'controller:loyaltyController.points',
          )}`,
        );
        return;
      } else {
        $(`#reelorewardsModalBodyid div.alert-danger`).hide();
      }
      response = await apiCall.post(
        Config.links.reeloAuthRedeemption,
        {
          customer_mobile: currentCustomerphone,
          store_id: window.storeDetails.store_id,
          points: Number(points),
        },
        {
          headers: getHeadersformposforrender(),
        },
      );
    }

    if (response && response.data) {
      const serverresponse = response.data;
      window.notifyUser.showMessage(
        'success',
        $.i18n.t('controller:loyaltyController.OTPSent'),
      );
      return serverresponse;
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:loyaltyController.sendingOTPFailed'),
      );
      $('#loyaltyotpButton').html('Send OTP');
    }
  } catch (error) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:loyaltyController.sendingOTPFailed'),
    );
    $('#loyaltyotpButton').html('Send OTP');
  }
}

function resetReelorewardsUI() {
  $(`#storeReelorewardslistContainerid`).show();
  $(`#storeReelorewardslistContainerid`).empty();
  $(`#reelorewardsModalBodyid div.alert-success`).hide();
  $(`#reelorewardsModalBodyid div.alert-danger`).hide();
  $('#applyselectedReeloRewardbuttonid').hide();
  // $(`.rewards-otp-container`).hide();
  $(`.rewards-otp-container button`).html('Send OTP');
  $(`#applyselectedReeloRewardbuttonid`).data('reward', undefined);
  $(`#reelorewards-otp-containerid input`).val('');
  $('#reeloPointsRedeeminputid').val('');
  $('#reeloOTPButton').prop('disabled', false);
  $('#redeemPointsContainerid').hide();
  $('#usepointsloyaltycontainerid').hide();
  $("input:radio[name='usepointsloyalty']").prop('checked', false);
  $("input:radio[name='usepointsloyalty']").prop('value', '1');
  currentCustomerphone = undefined;
  currentCouponCode = undefined;
  max_redemption_point = undefined;
  cashback_redemption = undefined;
  order_subtotal = undefined;
  orderItems = [];
  customer_points = 0;
}

function initialize() {
  $('#reeloOTPButton').on(
    'click',
    debounce(() => {
      sendorverifyOTP();
    }, 200),
  );

  $('#usepointsloyaltyid').on('click', () => {
    const isPointSelected = $('#usepointsloyaltyid').is(':checked');

    if (isPointSelected && customer_points === 0) {
      $('#reeloOTPButton').prop('disabled', true);
    } else {
      $('#reeloOTPButton').prop('disabled', false);
    }
  });

  if (window.storeDetails) {
    setTimeout(() => {
      window.storeDetails.loyalty_enabled
        ? $(
            `#dineinrewardsButton,#tdhdrewardsButton,#quickbillrewardsButton`,
          ).show()
        : $(
            `#dineinrewardsButton,#tdhdrewardsButton,#quickbillrewardsButton`,
          ).hide();
    }, 300);
  } else {
    setTimeout(() => {
      window.storeDetails && window.storeDetails.loyalty_enabled
        ? $(
            `#dineinrewardsButton,#tdhdrewardsButton,#quickbillrewardsButton`,
          ).show()
        : $(
            `#dineinrewardsButton,#tdhdrewardsButton,#quickbillrewardsButton`,
          ).hide();
    }, 1000);
  }

  $('input[name="usepointsloyalty"]').on('click', async function (event) {
    if ($("input:radio[name='usepointsloyalty']").prop('value') == 1) {
      $("input:radio[name='usepointsloyalty']").prop('checked', true);
      $("input:radio[name='usepointsloyalty']").prop('value', '2');
      $('#redeemPointsContainerid').show();
      $(`#storeReelorewardslistContainerid li`).removeClass('activeElement');
      $(`#storeReelorewardslistContainerid`).hide();
    } else {
      $("input:radio[name='usepointsloyalty']").prop('checked', false);
      $("input:radio[name='usepointsloyalty']").prop('value', '1');
      $('#redeemPointsContainerid').hide();
      $(`#storeReelorewardslistContainerid`).show();
    }
  });
}

initialize();
module.exports = {
  showCustomerReelopointsandrewards,
};
