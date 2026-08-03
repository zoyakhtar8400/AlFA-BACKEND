const i18n = require('i18next');
const jqueryI18next = require('jquery-i18next');
const resources = require('../../locales');
const {
  getLocalStorage,
  setLocalStorage,
} = require('../../storage/localStorage');

const fallbc = ['en'];
const langArr = ['en', 'ar'];

let defaultLang = getLocalStorage('lang');
if (!defaultLang) {
  defaultLang = 'en';
  setLocalStorage('lang', defaultLang);
}

if (!langArr.includes(defaultLang)) {
  defaultLang = 'en';
  setLocalStorage('lang', defaultLang);
}

i18n.init(
  {
    resources,
    ns: ['common', 'translation', 'controller', 'tables'],
    lng: defaultLang,
    defaultNS: 'translation',
    supportedLngs: langArr,
    // keySeparator: false, // we do not use keys in form messages.welcome
    fallbackLng: fallbc,
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  },
  // eslint-disable-next-line func-names, prefer-arrow-callback
  function (_err, _t) {
    jqueryI18next.init(i18n, $, {
      tName: 't', // --> appends $.t = i18next.t
      i18nName: 'i18n', // --> appends $.i18n = i18next
      handleName: 'localize', // --> appends $(selector).localize(opts);
      selectorAttr: 'data-i18n', // selector for translating elements
      targetAttr: 'i18n-target', // data-() attribute to grab target element to translate (if different than itself)
      optionsAttr: 'i18n-options', // data-() attribute that contains options, will load/set if useOptionsAttr = true
      useOptionsAttr: false, // see optionsAttr
      parseDefaultValueFromContent: true, // parses default values from content ele.val or ele.text
    });
  },
);

module.exports = i18n;
