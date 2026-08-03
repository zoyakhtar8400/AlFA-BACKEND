/* eslint-disable camelcase */
const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Department = sequelize.define(
    util.DBDetails.Tables.MPOS_DEPARTMENT,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        get() {
          const id = this.getDataValue('id');
          return id;
        },
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      department_name: {
        type: type.STRING,
        get() {
          const department_name = this.getDataValue('department_name');
          return department_name;
        },
      },
      is_active: {
        type: type.INTEGER,
        defaultValue: 1,
        get() {
          const isactive = this.getDataValue('is_active');
          return isactive;
        },
      },
      section: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      product_groups: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_DEPARTMENT,
    },
  );
  return Department;
}

module.exports = {
  getModel,
};
