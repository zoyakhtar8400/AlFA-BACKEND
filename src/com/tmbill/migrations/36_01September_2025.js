const util = require('../util/DBUtil');

async function addExtraDetailsInCustomer(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'extra_details', {
      type: type.JSON,
      allowNull: true,
    });
  } catch (error) {
    console.log(error);
  }
}

async function addAlternativeTitleInVarient(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_MODIFIER_VARIENT,
      'alternative_title',
      {
        type: type.STRING,
        allowNull: true,
      },
    );
  } catch (error) {
    console.log(error);
  }
}

const up = function (query, type) {
  addExtraDetailsInCustomer(query, type);
  addAlternativeTitleInVarient(query, type);
};

const down = function (query, type) {};
module.exports = {
  up,
  down,
};
