const util = require('../util/DBUtil');

async function addFieldsInCustomerTable(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'location', {
      allowNull: true,
      type: type.STRING,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'block', {
      allowNull: true,
      type: type.STRING,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'area', {
      allowNull: true,
      type: type.STRING,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'street', {
      allowNull: true,
      type: type.STRING,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'lane', {
      allowNull: true,
      type: type.STRING,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'flat', {
      allowNull: true,
      type: type.STRING,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'floor', {
      allowNull: true,
      type: type.STRING,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'landmark', {
      allowNull: true,
      type: type.STRING,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'building', {
      allowNull: true,
      type: type.STRING,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'label', {
      allowNull: true,
      type: type.STRING,
    });
  } catch (error) {
    console.error(error);
  }
}

async function addkotSectionInKOTTable(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_KOT, 'kot_section', {
      allowNull: true,
      type: type.INTEGER,
      defaultValue: 1,
    });
  } catch (error) {
    console.error(error);
  }
}

const up = function (query, type) {
  addFieldsInCustomerTable(query, type);
  addkotSectionInKOTTable(query, type);
};
const down = function () {};

module.exports = {
  up,
  down,
};
