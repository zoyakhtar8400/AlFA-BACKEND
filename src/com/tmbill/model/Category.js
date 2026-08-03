const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Category = sequelize.define(
    util.DBDetails.Tables.MPOS_CATEGORY,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      category_refid: {
        type: type.INTEGER,
        defaultValue: 0,
        unique: true,
      },
      category_name: {
        type: type.STRING,
      },
      description: {
        type: type.STRING,
        allowNull: true,
      },
      is_active: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      img_url: {
        type: type.STRING,
        allowNull: true,
      },
      parent_ref_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      category_sort: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      timings: {
        type: type.JSON,
        allowNull: true,
      },
      alternative_title: {
        type: type.STRING,
        allowNull: true,
      },
      color: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_CATEGORY,
    },
    {
      instanceMethods: {},
    },
  );
  return Category;
}

module.exports = {
  getModel,
};
