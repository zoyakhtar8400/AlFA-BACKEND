const util = require('../util/DBUtil');

async function addOpenPricetoItem(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_ITEM, 'open_price', {
      type: type.INTEGER,
      defaultValue: 0,
    });
  } catch (error) {
    console.log(error);
  }
}

async function addZatcaStatusTable(query, type) {
  try {
    await query.createTable(util.DBDetails.Tables.MPOS_ZATCA_STATUS, {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: type.STRING,
      },
      store_id: {
        type: type.STRING,
      },
      status: {
        type: type.STRING,
      },
      qr: {
        type: type.STRING,
      },
    });
  } catch (err) {
    console.error(err);
  }
}

async function addZatcaGeneratedtoOrderLevel(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_ORDER, 'zatca_status', {
      type: type.INTEGER,
      defaultValue: 0,
    });
  } catch (error) {
    console.log(error);
  }
}

async function createOrderTypesTable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_ORDER_TYPES,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
        },
        order_type: {
          type: type.STRING,
        },
        order_type_image: {
          type: type.STRING,
          allowNull: true,
        },
        alternative_title: {
          type: type.STRING,
          allowNull: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_ORDER_TYPES,
      },
    );
  } catch (error) {
    console.error(error);
  }
}

async function addAlternativeTitleToPaymentModes(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_PAYMENT_MODE,
      'alternative_title',
      {
        type: type.STRING,
        allowNull: true,
      },
    );
  } catch (error) {
    console.log(error);
  }
}

async function addIsOldUserFieldToUser(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_USER, 'is_old_user', {
      type: type.STRING,
      allowNull: true,
    });
  } catch (error) {
    console.log(error);
  }
}
const up = function (query, type) {
  addOpenPricetoItem(query, type);
  addZatcaStatusTable(query, type);
  addZatcaGeneratedtoOrderLevel(query, type);
  createOrderTypesTable(query, type);
  addAlternativeTitleToPaymentModes(query, type);
  addIsOldUserFieldToUser(query, type);
};

const down = function (query, type) {};
module.exports = {
  up,
  down,
};
