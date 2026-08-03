const util = require('../util/DBUtil');

async function removeFastSettle(query) {
  await query.bulkDelete(util.DBDetails.Tables.MPOS_SHORTCUTS, { id: 31 }, {});
}

const up = async function (query, type) {
  await removeFastSettle(query);
};

const down = async function (query, type) {};

module.exports = { up, down };
