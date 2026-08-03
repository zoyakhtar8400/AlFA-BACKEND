const util = require('../util/DBUtil');

async function addUsershiftFields(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_USERSHIFT, 'revenue_id', {
      type: type.STRING,
      allowNull: true,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_USERSHIFT, 'drawer_id', {
      type: type.STRING,
      allowNull: true,
    });
    query.addColumn(
      util.DBDetails.Tables.MPOS_USERSHIFT,
      'shift_start_currency_denomination',
      {
        type: type.JSON,
        allowNull: true,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_USERSHIFT,
      'shift_end_currency_denomination',
      {
        type: type.JSON,
        allowNull: true,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_USERSHIFT,
      'shift_end_transactions',
      {
        type: type.JSON,
        allowNull: true,
      },
    );
  } catch (error) {
    console.log(error);
  }
}

async function addStartDayFields(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_STARTDAY_ENDDAY, 'revenue_id', {
      type: type.STRING,
      allowNull: true,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_STARTDAY_ENDDAY, 'drawer_id', {
      type: type.STRING,
      allowNull: true,
    });
    query.addColumn(
      util.DBDetails.Tables.MPOS_STARTDAY_ENDDAY,
      'day_start_currency_denomination',
      {
        type: type.JSON,
        allowNull: true,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_STARTDAY_ENDDAY,
      'day_close_currency_denomination',
      {
        type: type.JSON,
        allowNull: true,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_STARTDAY_ENDDAY,
      'day_close_transactions',
      {
        type: type.JSON,
        allowNull: true,
      },
    );
  } catch (error) {
    console.log(error);
  }
}

async function addFiledsInOrderAndOrderChildTable(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_ORDER, 'machine_id', {
      type: type.STRING,
      allowNull: true,
    });
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDER_CHILD,
      'alternative_category_name',
      {
        type: type.STRING,
        allowNull: true,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOT_ITEM,
      'alternative_category_name',
      {
        type: type.STRING,
        allowNull: true,
      },
    );
  } catch (error) {
    console.log(error);
  }
}

const up = function (query, type) {
  addUsershiftFields(query, type);
  addStartDayFields(query, type);
  addFiledsInOrderAndOrderChildTable(query, type);
};

const down = function (query, type) {};
module.exports = {
  up,
  down,
};
