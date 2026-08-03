const util = require('../util/DBUtil');

//kot modified if modified after save
async function addTableRservationIDField(query, type) {
  // terminal_access_levels
  query.addColumn(util.DBDetails.Tables.MPOS_TABLE, 'reservation_id', {
    allowNull: true,
    type: type.STRING,
  });
}

async function addTableReservationTable(query, type) {
  try {
    await query.createTable(
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
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_TABLE_RESERVATIONS,
        // hierarchy: true
      },
    );
  } catch (err) {}
}

async function addTableRservationStatusField(query, type) {
  // terminal_access_levels
  query.addColumn(util.DBDetails.Tables.MPOS_TABLE_RESERVATIONS, 'status', {
    allowNull: true,
    type: type.STRING,
  });
}

const up = function (query, type) {
  addTableRservationIDField(query, type);
  addTableReservationTable(query, type);
  addTableRservationStatusField(query, type);
};
const down = function (query, type) {};

module.exports = {
  up,
  down,
};
