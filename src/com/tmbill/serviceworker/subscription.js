const { apiCall } = require('../services/APIService');
const { getLocalStorage } = require('../storage');

async function sendSubscription(userPayload) {
  let { firebaseToken } = userPayload;
  window.firebaseToken = firebaseToken;
  if (!firebaseToken) {
    firebaseToken = getLocalStorage('firebaseToken');
    window.firebaseToken = firebaseToken;
  }
  const body = {
    subscription: firebaseToken,
    id: userPayload.store_id,
    cust_phone: '1234',
    type: 5,
  };
  try {
    if (!body.subscription) {
      console.log(`Message="Firebase token not found"`);
      return;
    }
    await apiCall.post(window.Config.links.digitalOrderssubscribe, body);
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  sendSubscription,
};
