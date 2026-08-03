const util = require('../util/DBUtil');

//kot item alternative title
async function addalternatekotitemtitle(query, type) {
  // terminal_access_levels
  query.addColumn(
    util.DBDetails.Tables.MPOS_KOT_ITEM,
    'alternative_title',
    type.STRING,
    {
      defaultValue: null,
      allowNull: true,
    },
  );
}

//order child alternative title
async function addalternateorderitemtitle(query, type) {
  // terminal_access_levels
  query.addColumn(
    util.DBDetails.Tables.MPOS_ORDER_CHILD,
    'alternative_title',
    type.STRING,
    {
      defaultValue: null,
      allowNull: true,
    },
  );
}

//kot modified if modified after save
async function addkotmodifiedfield(query, type) {
  // terminal_access_levels
  query.addColumn(util.DBDetails.Tables.MPOS_KOT, 'is_modified', type.INTEGER, {
    defaultValue: 0,
    allowNull: true,
  });
}

const up = function (query, type) {
  addalternatekotitemtitle(query, type);
  addalternateorderitemtitle(query, type);
  addkotmodifiedfield(query, type);
};
const down = function (query, type) {};

module.exports = {
  up,
  down,
};
