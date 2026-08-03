const util = require('../util/DBUtil');

async function addstoreIdFieldInTableReservationTable(query, type) {
  await query.removeColumn(
    util.DBDetails.Tables.MPOS_TABLE_RESERVATIONS,
    'order_id',
  );
  query.addColumn(util.DBDetails.Tables.MPOS_TABLE_RESERVATIONS, 'order_id', {
    allowNull: true,
    type: type.STRING,
  });
}

const up = function (query, type) {
  addstoreIdFieldInTableReservationTable(query, type);
};
const down = function (query, type) {};

module.exports = {
  up,
  down,
};
