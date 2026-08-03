const util = require('../util/DBUtil');

async function createappsource(query, type) {
  try {
    await query.addColumn(
      util.DBDetails.Tables.MPOS_ORDER,
      'app_source',
      type.STRING,
      {
        allowNull: true,
      },
    );
  } catch (err) {}
}

function addmposCategorySort(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_CATEGORY,
      'category_sort',
      type.INTEGER,
      {
        allowNull: true,
      },
    );
  } catch (err) {}
}
const up = function (query, type) {
  createappsource(query, type);
  addmposCategorySort(query, type);
};
const down = function (query, type) {};

module.exports = {
  up,
  down,
};
