const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Unit = sequelize.define(
    util.DBDetails.Tables.UNITS || 'units',
    {
      unit_id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      unit_name: {
        type: type.STRING,
        allowNull: false,
      },
      qty_decimal_places: {
        type: type.INTEGER,
        defaultValue: 3,
      },
      is_active: {
        type: type.INTEGER,
        defaultValue: 1,
      },
    },
    {
      timestamps: false,
      tableName: 'units',
    }
  );
  return Unit;
}

module.exports = { getModel };
