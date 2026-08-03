const arTranslations = require('./ar/translations');
const arcommonTranslations = require('./ar/common');
const arControllers = require('./ar/controllers');
const enTranslations = require('./en/translations');
const encommonTranslations = require('./en/common');
const enControllers = require('./en/controllers');
const entables = require('./en/tables');
const artables = require('./ar/tables');

const resources = {
  en: {
    translation: enTranslations,
    common: encommonTranslations,
    controller: enControllers,
    tables: entables,
  },
  ar: {
    translation: arTranslations,
    common: arcommonTranslations,
    controller: arControllers,
    tables: artables,
  },
};

module.exports = resources;
