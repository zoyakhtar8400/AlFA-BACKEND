const { ARABIC_PAYMENT_MODES } = require('../util/DBUtil');

const SUPPORTED_LANG = {
  ENGLISH: 'en',
  ARABIC: 'ar',
};

function getPaymentTranslation(mode) {
  let modetoReturn = mode;

  switch (window.selectedLanguage) {
    case SUPPORTED_LANG.ARABIC:
      modetoReturn = ARABIC_PAYMENT_MODES[mode] || mode;
      break;
    default:
      modetoReturn = mode;
      break;
  }
  return modetoReturn;
}

module.exports = {
  getPaymentTranslation,
};
