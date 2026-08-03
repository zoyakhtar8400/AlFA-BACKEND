/* eslint-disable camelcase */
const { forEach, maxBy, debounce, capitalize, map } = require('lodash');
const { getLocalStorage, setLocalStorage } = require('../storage/localStorage');
const { CAMPAIGN_EVENTS } = require('../util/Constants');
const { SYNC_BILL } = require('../util/IPC_Messages');
const { getHeadersformposforrender } = require('../util/MiscServer.renderer');
const { LOADER } = require('./RawButtons');
const { apiCall } = require('../services/APIService');
const {
  checkOrderSyncStatusRequest,
} = require('../renderer/helper/Order.helper');

const delay = 8000;
let currentCustomerphone;
let receivedOtp;
let currentBillingtype;

function resetrewardsUI() {
  $(`#storerewardslistContainerid`).show();
  $(`#storerewardslistContainerid`).empty();
  $(`#loyaltyrewardsModalBodyid div.alert`).hide();
  $('#applyselectedRewardbuttonid').hide();
  $(`.rewards-otp-container`).hide();
  $(`.rewards-otp-container button`).html('Send OTP');
  $(`#applyselectedRewardbuttonid`).data('reward', undefined);
  $(`#rewards-otp-containerid input`).val('');
  $('#loyaltyotpButton').prop('disabled', false);
  currentCustomerphone = undefined;
  receivedOtp = undefined;
  currentBillingtype = undefined;
}

async function checkifcustomerhasRewardpoints({ name, phone, tmpos_id }) {}

async function getStorerewardsandpoints({ store_id, tmpos_id }) {
  try {
    const result = await apiCall.post(
      Config.links.getRewardsnPoints,
      { store_id, tmpos_id, flag: 3 },
      { headers: getHeadersformposforrender() },
    );
    if (result && result.data) {
      const response = result.data;
      if (response && response.data && response.data.points_list) {
        addpointstoLocalstorage({
          points: response.data.points_list,
          store_id,
        });
      }
      if (response && response.data && response.data.rewards_list) {
        addrewardstoLocalstorage({
          rewards: response.data.rewards_list,
          store_id,
        });
      }
    }
  } catch (error) {
    console.log(error);
    if ([401].includes(error?.response?.status)) {
      reloginfromremote();
    }
  }
}

function addrewardstoLocalstorage({ rewards, store_id }) {
  try {
    let previousRewards = getLocalStorage('loyalty_rewards');
    if (previousRewards) {
      previousRewards = JSON.parse(previousRewards);
      Object.assign(previousRewards, {
        [store_id]: {
          rewards,
        },
      });
    } else {
      previousRewards = {
        [store_id]: {
          rewards,
        },
      };
    }
    if (previousRewards)
      setLocalStorage('loyalty_rewards', JSON.stringify(previousRewards));
  } catch (error) {
    console.log(error);
  }
}

function addpointstoLocalstorage({ points, store_id }) {
  try {
    const pointRules = map(points, 'campaign_event_string');
    let previousRewards = getLocalStorage('loyalty_points');
    if (previousRewards) {
      previousRewards = JSON.parse(previousRewards);
      const pointRules = map(points, 'campaign_event_string');

      Object.assign(previousRewards, {
        [store_id]: {
          points,
          pointRules,
        },
      });
    } else {
      previousRewards = {
        [store_id]: {
          points,
          pointRules,
        },
      };
    }
    if (previousRewards)
      setLocalStorage('loyalty_points', JSON.stringify(previousRewards));
  } catch (error) {
    console.log(error);
  }
}

async function sendPointruleactionifexists({ store_id, order_id, tmpos_id }) {
  console.log('sending rule ping..');
  let loyalty_points = getLocalStorage('loyalty_points');
  if (loyalty_points) {
    loyalty_points = JSON.parse(loyalty_points);
    if (!loyalty_points[store_id]) {
      return;
    }
    const pointEvents = loyalty_points[store_id];

    if (
      pointEvents.pointRules &&
      Array.isArray(pointEvents.pointRules) &&
      (pointEvents.pointRules.includes(
        CAMPAIGN_EVENTS.POINTS.CustomerBirthday,
      ) ||
        pointEvents.pointRules.includes(CAMPAIGN_EVENTS.POINTS.OrderAmount) ||
        pointEvents.pointRules.includes(CAMPAIGN_EVENTS.POINTS.PlaceOrder) ||
        pointEvents.pointRules.includes(CAMPAIGN_EVENTS.POINTS.NewAccount))
    ) {
      //  check if order is synced
      const result = await checkOrderSyncStatusRequest({ order_id });
      if (result) {
        if (!result.phone) {
          return;
        }
        // Send event to backend.
        const payload = {
          order_id,
          tmpos_id,
          store_id,
        };
        try {
          // console.log(payload);
          const authResult = await apiCall.post(
            window.Config.links.sendpointruleAction,
            payload,
            {
              headers: getHeadersformposforrender(),
            },
          );
          const response = authResult.data;
          if (response.status === 300 || response.status === '300') {
            reloginfromremote();
            setTimeout(() => {
              sendPointruleactionifexists({ store_id, order_id, tmpos_id });
            }, 8000);
          }
        } catch (error) {
          console.log(error);
          if ([401].includes(error?.response?.status)) {
            reloginfromremote();
          }
        }
      } else {
        console.log('Delay send point ping..');
        window.ipcRenderer.send(
          SYNC_BILL,
          JSON.stringify({ silentSync: true, logout: false }),
        );
        setTimeout(() => {
          sendPointruleactionifexists({ store_id, order_id, tmpos_id });
        }, delay);
      }
    } else {
      console.log('No points available..');
    }
  } else {
    console.log('No points available..');
  }
}

/**
 * Show customer rewards
 * @param {*} param0
 * @returns
 */
async function showCustomerpointsandrewards({
  phone,
  tmpos_id,
  store_id,
  subtotal,
  billing_type,
}) {
  try {
    console.log({ subtotal });
    resetrewardsUI();
    $(`#storerewardslistContainerid`).append($(LOADER));
    currentCustomerphone = phone;
    currentBillingtype = billing_type;

    const result = await apiCall.post(
      window.Config.links.getRewardsnPoints,
      {
        store_id,
        tmpos_id,
        flag: 3,
        phone,
      },
      {
        headers: getHeadersformposforrender(),
      },
    );
    if (result && result.data) {
      if (result.data.status == '200') {
        const response = result.data;
        const storedRewards = response.data.rewards_list;
        const { customer } = response.data;
        if (!customer) {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:loyaltyController.customerDoesntExist'),
          );
          return;
        }
        const points =
          customer && customer.loyalty_points ? customer.loyalty_points : 0;
        if (points) {
          const { name } = customer;
          $(`#loyaltyrewardsModalBodyid div.alert`).show();
          $(`#loyaltyrewardsModalBodyid div.alert`).html(
            `${name ? capitalize(name) : 'Customer'} has total ${points} points`,
          );
        } else {
          $(`#loyaltyrewardsModalBodyid div.alert`).hide();
        }
        if (
          storedRewards &&
          Array.isArray(storedRewards) &&
          storedRewards.length
        ) {
          fillRewardinlistcontainer(storedRewards, points, subtotal);
        } else {
          window.notifyUser.showMessage(
            'error',
            $.i18n.t('controller:loyaltyController.noRewardsFound'),
          );
          $('#loyaltyrewardsModalid').modal('toggle');
        }
      } else if (result.data.status == '303') {
        reloginfromremote();
      }
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:loyaltyController.noRewardsFound'),
      );
      $('#loyaltyrewardsModalid').modal('toggle');
    }
  } catch (error) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:loyaltyController.noRewardsFound'),
    );
    $('#loyaltyrewardsModalid').modal('toggle');
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
  $(`#storerewardslistContainerid`).empty();
  forEach(rewards, (reward) => {
    const requiredPoints = $(`<span>`, {
      class: `badge badge-warning float-right badge-pill`,
      html: `Required Points ${reward.points_to_redeem}`,
    });

    const element = $(`<li>`, {
      class: `list-group-item`,
      html: reward.title,
      id: `reward_${reward.id}`,
    })
      .append(requiredPoints)
      .data('reward', reward)
      .click(function () {
        checkReward(this, reward, points, subtotal);
      });
    $(`#storerewardslistContainerid`).append(element);
  });
  findBestoffer(rewards, points, subtotal);
}

function checkReward(element, reward, points, subtotal) {
  $(`#storerewardslistContainerid li`).removeClass('activeElement');
  if (
    reward.expired_at &&
    window.moment().isAfter(window.moment(reward.expired_at))
  ) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:loyaltyController.sorryThisRewardIsExpired'),
    );
    return;
  }
  if (reward.billing_type) {
    const validTypes = String(reward.billing_type).split(',');
    const iscurrenttypeValid =
      validTypes.includes(String(currentBillingtype)) ||
      validTypes.includes('all');

    if (!iscurrenttypeValid) {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t(
          'controller:loyaltyController.sorryThisRewardIsNotAllowedInThisSection',
        ),
      );
      return;
    }
  }
  if (
    reward.min_order_amount > 0 &&
    Number(subtotal) < reward.min_order_amount
  ) {
    window.notifyUser.showMessage(
      'error',
      `${$.i18n.t('controller:loyaltyController.minimumOrderAmountIs')} ${reward.min_order_amount}.`,
    );
    return;
  }

  if (
    reward.start_date &&
    reward.end_date &&
    !window
      .moment()
      .isBetween(
        window.moment(reward.start_date),
        window.moment(reward.end_date),
      )
  ) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:loyaltyController.sorryThisRewardIsExpired'),
    );
    return;
  }

  if (Number(points) >= Number(reward.points_to_redeem)) {
    $(element).addClass('activeElement');
    if (window.storeDetails.reward_otp_verification) {
      $(`.rewards-otp-container`).show();
    } else {
      $(`#applyselectedRewardbuttonid`).data('reward', reward || undefined);
      $(`#applyselectedRewardbuttonid`).click();
    }
  } else {
    $(`.rewards-otp-container`).hide();
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:loyaltyController.youDontHaveEnoughPoints'),
    );
  }
}

async function findBestoffer(rewards, points, order_subtotal) {
  const discountandRewards = [];
  forEach(rewards, (reward) => {
    let { discount } = reward;
    if (reward.discount_type == 1) {
      discount = ((order_subtotal * discount) / 100).toFixed(2);
    }
    discountandRewards.push({
      id: reward.id,
      discount: Number(discount),
    });
  });
  // console.log(discountandRewards);
  if (discountandRewards) {
    const bestOffer = maxBy(discountandRewards, 'discount');
    if (bestOffer) {
      const bestofferSpan = $(`<span>`, {
        class: `badge badge-success float-right badge-pill mr-1`,
        html: `Best Offer`,
      });
      $(`#storerewardslistContainerid li#reward_${bestOffer.id}`).append(
        bestofferSpan,
      );
    }
  }
}

async function sendOTPtocustomerrequest() {
  try {
    const response = await apiCall.post(
      window.Config.links.sendloyaltyOtp,
      {
        phone: currentCustomerphone,
        store_id: window.storeDetails.store_id,
        store_name: window.storeDetails.store_name,
        sendOtp: 1,
        type: 1,
      },
      {
        headers: getHeadersformposforrender(),
      },
    );
    // console.log(response);
    if (response && response.data) {
      const serverresponse = response.data;
      window.notifyUser.showMessage(
        'success',
        $.i18n.t('controller:loyaltyController.OTPSent'),
      );
      return serverresponse;
    }
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:loyaltyController.sendingOTPFailed'),
    );
    $('#loyaltyotpButton').html('Send OTP');
  } catch (error) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:loyaltyController.sendingOTPFailed'),
    );
    $('#loyaltyotpButton').html('Send OTP');
  }
  return undefined;
}

async function sendorverifyOTP() {
  if (!navigator.onLine) {
    window.notifyUser.showMessage(
      'error',
      $.i18n.t('controller:loyaltyController.noInternetConnection'),
    );
    return;
  }

  $(`#storerewardslistContainerid`).hide();
  if ($('#loyaltyotpButton').html() == 'Send OTP') {
    $('#loyaltyotpButton').html('Sending OTP');
    const response = await sendOTPtocustomerrequest();
    if ((response && response.status === '200') || response.status == '201') {
      $('#loyaltyotpButton').html('Verify');
      if (Config.USE_NEW_API_BACKEND) {
        receivedOtp = response.otp;
      } else {
        receivedOtp = response.msg;
      }
      $(`#rewards-otp-containerid input`).attr(
        `placeholder`,
        $.i18n.t('controller:loyaltyController.pleaseEnterOTP'),
      );
    } else {
      $('#loyaltyotpButton').html('Send OTP');
    }
  } else {
    const enteredOtp = $(`#rewards-otp-containerid input`).val();
    if (enteredOtp && Number(enteredOtp) === Number(receivedOtp)) {
      $('#loyaltyotpButton').prop('disabled', true);
      $(`#applyselectedRewardbuttonid`).show();
      const selectedReward = $(
        `#storerewardslistContainerid li.activeElement`,
      ).data('reward');
      $(`#applyselectedRewardbuttonid`).data(
        'reward',
        selectedReward || undefined,
      );
      $(`#applyselectedRewardbuttonid`).click();
    } else {
      window.notifyUser.showMessage(
        'error',
        $.i18n.t('controller:loyaltyController.pleaseEnterValidOTP'),
      );
      $(`#rewards-otp-containerid input`).val('');
    }
  }
}

function initialize() {
  $('#loyaltyotpButton').on(
    'click',
    debounce(() => {
      sendorverifyOTP();
    }, 200),
  );

  if (window.storeDetails) {
    setTimeout(() => {
      window.storeDetails.loyalty_enabled
        ? $(
            `#dineinrewardsButton,#tdhdrewardsButton,#deliveryrewardsButton,#quickbillrewardsButton`,
          ).show()
        : $(
            `#dineinrewardsButton,#tdhdrewardsButton,#deliveryrewardsButton,#quickbillrewardsButton`,
          ).hide();
    }, 300);
  } else {
    setTimeout(() => {
      window.storeDetails && window.storeDetails.loyalty_enabled
        ? $(
            `#dineinrewardsButton,#tdhdrewardsButton,#deliveryrewardsButton,#quickbillrewardsButton`,
          ).show()
        : $(
            `#dineinrewardsButton,#tdhdrewardsButton,#deliveryrewardsButton,#quickbillrewardsButton`,
          ).hide();
    }, 1000);
  }
}

initialize();
module.exports = {
  sendPointruleactionifexists,
  checkifcustomerhasRewardpoints,
  getStorerewardsandpoints,
  showCustomerpointsandrewards,
};
