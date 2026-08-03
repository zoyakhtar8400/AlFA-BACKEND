const { createHash } = require('crypto');

let stringConstructor = 'test'.constructor;

function safeParseformain(params) {
  let parsed = params;
  try {
    if (parsed && parsed.constructor === stringConstructor) {
      parsed = JSON.parse(parsed);
    }
  } catch (error) {
    console.error(`Message="Error While Safe Parse"`, error);
  }
  return parsed;
}

function hashString(value) {
  return createHash('sha256')
    .update(value || '')
    .digest('base64');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function istimebetweenTwotimeformain(from, to) {
  let isBetween = false;
  if (from && to) {
    let currentTime = moment();
    let startTime = moment(from, 'HH:mm');
    let endTime = moment(to, 'HH:mm');
    isBetween = currentTime.isBetween(startTime, endTime);
  }

  return isBetween;
}

const CATEGROY_DAYS_FOR_MAIN = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const isEmpty = (obj) =>
  [Object, Array].includes((obj || {}).constructor) &&
  !Object.entries(obj || {}).length;

// async function updateStoresettings() {
//   try {
//     await Store.update(
//       { settings: { userlogged: false } },
//       { where: { store_id: global.storeDetails.store_id } },
//     );
//   } catch (error) {
//     console.log(error);
//   }
// }
module.exports = {
  hashString,
  safeParseformain,
  sleep,
  isEmpty,
  istimebetweenTwotimeformain,
  CATEGROY_DAYS_FOR_MAIN,
  // updateStoresettings,
};
