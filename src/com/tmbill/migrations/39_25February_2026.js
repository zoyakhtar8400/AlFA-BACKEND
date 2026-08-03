const util = require('../util/DBUtil');

async function addUniqueFieldInDayAndShift(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_STARTDAY_ENDDAY, 'unique_id', {
      type: type.STRING,
      allowNull: true,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_USERSHIFT, 'unique_id', {
      type: type.STRING,
      allowNull: true,
    });
  } catch (error) {
    console.log(error);
  }
}

const up = function (query, type) {
  addUniqueFieldInDayAndShift(query, type);
};

const down = function (query, type) {};
module.exports = {
  up,
  down,
};
