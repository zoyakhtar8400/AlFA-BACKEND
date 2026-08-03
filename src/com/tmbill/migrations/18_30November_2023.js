const util = require('../util/DBUtil');

async function addCaptainUseraccess(query, type) {
  // terminal_access_levels
  query.addColumn(
    util.DBDetails.Tables.MPOS_USER,
    'captain_user_access',
    type.INTEGER,
    {
      defaultValue: null,
      allowNull: true,
    },
  );
}

async function addalternateitemtitle(query, type) {
  // terminal_access_levels
  query.addColumn(
    util.DBDetails.Tables.MPOS_ITEM,
    'alternative_title',
    type.STRING,
    {
      defaultValue: null,
      allowNull: true,
    },
  );
}

const up = function (query, type) {
  addCaptainUseraccess(query, type);
  addalternateitemtitle(query, type);
};
const down = function (query, type) {};

module.exports = {
  up,
  down,
};
