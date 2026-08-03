const util = require('../util/DBUtil');

function addIrnTable(query, type) {
  query.createTable(
    util.DBDetails.Tables.IRN_HISTORY,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      tmpos_id: {
        type: type.STRING,
        allowNull: true,
      },
      type: {
        type: type.INTEGER,
      },
      ref_id: {
        type: type.STRING,
        allowNull: true,
      },
      irn_no: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      irn_response: {
        type: type.JSON,
      },
      cancel_response: {
        type: type.JSON,
        allowNull: true,
      },
      ewaybill_no: {
        type: type.STRING,
        allowNull: true,
      },
      ewaybill_response: {
        type: type.JSON,
        allowNull: true,
      },
      state: {
        type: type.STRING,
        allowNull: true,
      },
      ewaybill_state: {
        type: type.STRING,
        allowNull: true,
      },
      connector_id: {
        type: type.STRING,
        allowNull: true,
      },
      invoice_no: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.IRN_HISTORY,
    },
  );
}

function addPincodeFieldIncustomer(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'pincode', type.STRING, {
    allowNull: true,
  });
}

function addExtraInfoFieldInStore(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_STORE, 'extra_info', type.JSON, {
    allowNull: true,
  });
}

function addStateFieldIncustomer(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'state', type.STRING, {
    allowNull: true,
  });
}

function addShortcodeAndCatNameOnOrderChild(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_ORDER_CHILD,
    'short_code',
    type.STRING,
    {
      allowNull: true,
    },
  );

  query.addColumn(
    util.DBDetails.Tables.MPOS_ORDER_CHILD,
    'category_name',
    type.STRING,
    {
      allowNull: true,
    },
  );

  query.addColumn(
    util.DBDetails.Tables.MPOS_ORDER_CHILD,
    'has_options',
    type.INTEGER,
    {
      defaultValue: 0,
    },
  );
}

function addExtrdetailsFieldInCharges(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_CHARGES,
    'extra_details',
    type.JSON,
    {
      allowNull: true,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_ORDER_CHARGES,
    'extra_details',
    type.JSON,
    {
      allowNull: true,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_KOT_CHARGES,
    'extra_details',
    type.JSON,
    {
      allowNull: true,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_KOTITEMS_CHARGES,
    'extra_details',
    type.JSON,
    {
      allowNull: true,
    },
  );
  query.addColumn(
    util.DBDetails.Tables.MPOS_ORDERCHILD_CHARGES,
    'extra_details',
    type.JSON,
    {
      allowNull: true,
    },
  );
}

function addBillModifyColumn(query, type) {
  query.addColumn(
    util.DBDetails.Tables.MPOS_ORDER,
    'isBillModified',
    type.TINYINT,
    {
      // allowNull: true
      defaultValue: 1,
    },
  );
}

const up = function (query, type) {
  addIrnTable(query, type);
  addPincodeFieldIncustomer(query, type);
  addExtraInfoFieldInStore(query, type);
  addStateFieldIncustomer(query, type);
  addShortcodeAndCatNameOnOrderChild(query, type);
  addExtrdetailsFieldInCharges(query, type);
  addBillModifyColumn(query, type);
};
const down = function (query, type) {};

module.exports = {
  up,
  down,
};
