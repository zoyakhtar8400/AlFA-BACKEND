const util = require('../util/DBUtil');

async function addExcludePlatformInItems(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_ITEM, 'excludePlaforms', {
    type: type.STRING,
    allowNull: true,
  });
}

async function addLanguagePrefernceinUser(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_USER, 'languagePreference', {
    type: type.STRING,
    allowNull: true,
    defaultValue: 'en',
  });

  query.addColumn(util.DBDetails.Tables.MPOS_STORE, 'languagePreference', {
    type: type.STRING,
    defaultValue: 'en',
    allowNull: true,
  });
}

const up = function (query, type) {
  addExcludePlatformInItems(query, type);
  addLanguagePrefernceinUser(query, type);
};
const down = function (query, type) {};
module.exports = {
  up,
  down,
};
