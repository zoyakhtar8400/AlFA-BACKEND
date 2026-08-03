const util = require('../util/DBUtil');

async function addItemStockOutBoxTable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_ITEM_STOCK_OUTBOX,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        item_id: {
          type: type.STRING,
          allowNull: false,
        },
        store_id: {
          type: type.STRING,
          allowNull: false,
        },
        variant_id: {
          type: type.STRING,
          allowNull: true,
        },
        change_type: {
          type: type.ENUM('IN', 'OUT', 'ADJUSTMENT', 'SALE', 'RETURN'),
          allowNull: false,
        },
        quantity: {
          type: type.REAL,
          allowNull: false,
        },
        previous_stock: {
          type: type.REAL,
          allowNull: true,
        },
        current_stock: {
          type: type.REAL,
          allowNull: true,
        },
        reference_id: {
          type: type.STRING,
          allowNull: true,
        },
        sync_status: {
          type: type.ENUM('PENDING', 'PROCESSING', 'SYNCED', 'FAILED'),
          allowNull: false,
          defaultValue: 'PENDING',
        },
        retry_count: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        last_attempt_at: {
          type: type.STRING,
          allowNull: true,
        },
        backend_ack_id: {
          type: type.STRING,
          allowNull: true,
        },
        machine_id: {
          type: type.STRING,
          allowNull: true,
        },
        created_at: {
          type: type.STRING,
          defaultValue: type.NOW,
        },
        updated_at: {
          type: type.STRING,
          defaultValue: type.NOW,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_ITEM_STOCK_OUTBOX,
        indexes: [
          {
            name: 'idx_outbox_status_created',
            fields: ['sync_status', 'created_at'],
          },
          {
            name: 'idx_outbox_item_store',
            fields: ['item_id', 'store_id'],
          },
          {
            name: 'idx_outbox_reference',
            fields: ['reference_id'],
          },
        ],
      },
    );
  } catch (err) {
    console.error(err);
  }
}

const up = (query, type) => {
  addItemStockOutBoxTable(query, type);
};
const down = () => {};

module.exports = {
  up,
  down,
};
