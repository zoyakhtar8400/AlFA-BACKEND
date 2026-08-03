const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Options = sequelize.define(
    util.DBDetails.Tables.MPOS_OPTIONS,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ref_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      title: {
        type: type.STRING,
      },
      description: {
        type: type.STRING,
        allowNull: true,
      },
      available: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      price: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      weight: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      opt_grp_ref_ids: {
        type: type.STRING,
        allowNull: true,
      },
      item_ref_id: {
        type: type.STRING,
        allowNull: true,
      },
      option_tax: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      option_level_subtotal: {
        type: type.DECIMAL(10, 2),
        defaultValue: 0,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      option_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      sale_price_1: {
        type: type.DECIMAL(10, 2),
      },
      sale_price_2: {
        type: type.DECIMAL(10, 2),
      },
      sale_price_3: {
        type: type.DECIMAL(10, 2),
      },
      sale_price_4: {
        type: type.DECIMAL(10, 2),
      },
      sale_price_5: {
        type: type.DECIMAL(10, 2),
      },
      child_optgrp_refids: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_OPTIONS,
    },
    {
      instanceMethods: {},
    },
  );
  return Options;
}

module.exports = {
  getModel,
};
