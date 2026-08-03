const util = require('../util/DBUtil');
async function addTaxTable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_TAX,
      {
        tax_id: {
          type: type.INTEGER,
          primaryKey: true,
          // autoIncrement: true
        },
        tax_name: {
          type: type.STRING,
        },
        tax_perct: {
          type: type.INTEGER, //1-percentage 0-fix
          defaultValue: 0,
        },
        tax_method: {
          type: type.INTEGER, //1-default 0-not default
          defaultValue: 1,
        },
        is_devidable: {
          type: type.INTEGER, //1-percentage 0-fix
          defaultValue: 0,
        },
        product_group_id: {
          //0=All ,1=Quick Bill, 2=Dine In, 3= TA 4=HD
          type: type.INTEGER,
        },
        store_id: {
          allowNull: true,
          type: type.STRING,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_TAX,
        // hierarchy: true
      },
    );
  } catch (err) {}
}
async function addstoreIdFieldInTAXTable(query, type) {
  // terminal_access_levels
  query.addColumn(util.DBDetails.Tables.MPOS_TAX, 'store_id', {
    allowNull: true,
    type: type.STRING,
  });
}
const up = function (query, type) {
  addTaxTable(query, type);
  addstoreIdFieldInTAXTable(query, type);
};
const down = function (query, type) {};

module.exports = {
  up,
  down,
};
