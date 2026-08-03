const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const KitchenDepartment = sequelize.define(
    util.DBDetails.Tables.MPOS_KITCHEN_DEPARTMENT,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      kitchen_dept_name: {
        type: type.STRING,
        allowNull: true,
      },
      isactive: {
        type: type.INTEGER,
        defaultValue: 1,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_KITCHEN_DEPARTMENT,
    },
  );
  return KitchenDepartment;
}

module.exports = {
  getModel,
};
