const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const tableReservation = sequelize.define(
    util.DBDetails.Tables.MPOS_TABLE_RESERVATIONS,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        unique: true,
      },
      order_id: {
        type: type.STRING,
        allowNull: true,
      },
      reservation_id: {
        type: type.STRING,
      },
      store_id: {
        type: type.STRING,
      },
      tmpos_id: {
        type: type.STRING,
      },
      table_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      table_name: {
        type: type.STRING,
        allowNull: true,
      },
      user_id: {
        type: type.STRING,
        allowNull: true,
      },
      name: {
        type: type.STRING,
        allowNull: true,
      },
      phone: {
        type: type.STRING,
        allowNull: true,
      },
      created_at: {
        type: type.TIME,
        allowNull: true,
        defaultValue: type.NOW,
      },
      check_in: {
        type: type.TIME,
        allowNull: true,
        defaultValue: type.NOW,
      },
      check_out: {
        type: type.TIME,
        allowNull: true,
        defaultValue: type.NOW,
      },
      created_time: {
        type: type.TIME,
        allowNull: true,
        defaultValue: type.NOW,
      },
      persons: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      occasion: {
        type: type.STRING,
        allowNull: true,
      },
      sync_status: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      status: {
        type: type.STRING,
        allowNull: true,
      },
      booking_date: {
        type: type.STRING,
        allowNull: true,
      },
      booking_time: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_TABLE_RESERVATIONS,
      // hierarchy: true
    },
  );
  return tableReservation;
}

module.exports = {
  getModel,
};
