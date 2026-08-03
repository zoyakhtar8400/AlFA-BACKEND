const util = require('../util/DBUtil');

//kot modified if modified after save
async function addkotActualInTimeField(query, type) {
  // terminal_access_levels
  query.addColumn(util.DBDetails.Tables.MPOS_KOT, 'actual_in_time', type.TIME, {
    allowNull: true,
    defaultValue: type.NOW,
  });
}

async function addWaiterNotificationTable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_WAITER_NOTIFICATIONS,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          unique: true,
        },

        store_id: {
          type: type.STRING,
        },
        table_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        Message: {
          type: type.STRING,
        },
        status: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        created_at: {
          type: type.TIME,
          allowNull: true,
          defaultValue: type.NOW,
        },
        updated_at: {
          type: type.TIME,
          allowNull: true,
          defaultValue: type.NOW,
        },
        username: {
          type: type.STRING,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_WAITER_NOTIFICATIONS,
      },
    );
  } catch (err) {}
}

const up = function (query, type) {
  addkotActualInTimeField(query, type);
  addWaiterNotificationTable(query, type);
};
const down = function (query, type) {};

module.exports = {
  up,
  down,
};
