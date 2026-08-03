const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Customer = sequelize.define(
    util.DBDetails.Tables.MPOS_CUSTOMER,
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
      is_guest_mode: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      address_line1: {
        type: type.STRING,
        allowNull: true,
      },
      address_line2: {
        type: type.STRING,
        allowNull: true,
      },
      sub_locality: {
        type: type.STRING,
        allowNull: true,
      },
      email: {
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
      city: {
        type: type.STRING,
        allowNull: true,
      },
      state: {
        type: type.STRING,
        allowNull: true,
      },
      business_name: {
        type: type.STRING,
        allowNull: true,
      },
      description: {
        type: type.STRING,
        allowNull: true,
      },
      fssai: {
        type: type.STRING,
        allowNull: true,
      },
      panno: {
        type: type.STRING,
        allowNull: true,
      },
      adhar: {
        type: type.STRING,
        allowNull: true,
      },
      gstno: {
        type: type.STRING,
        allowNull: true,
      },
      dob: {
        type: type.DATEONLY,
        allowNull: true,
      },
      anniversary: {
        type: type.DATEONLY,
        allowNull: true,
      },
      createdDate: {
        type: type.DATE,
        allowNull: true,
      },
      pincode: {
        type: type.STRING,
        allowNull: true,
      },
      sync_flag: {
        // 1 Synced
        type: type.INTEGER,
        defaultValue: 0,
      },
      location: {
        type: type.STRING,
        allowNull: true,
      },
      block: {
        type: type.STRING,
        allowNull: true,
      },
      area: {
        type: type.STRING,
        allowNull: true,
      },
      street: {
        type: type.STRING,
        allowNull: true,
      },
      lane: {
        type: type.STRING,
        allowNull: true,
      },
      flat: {
        type: type.STRING,
        allowNull: true,
      },
      floor: {
        type: type.STRING,
        allowNull: true,
      },
      landmark: {
        type: type.STRING,
        allowNull: true,
      },
      building: {
        type: type.STRING,
        allowNull: true,
      },
      label: {
        type: type.STRING,
        allowNull: true,
      },
      dial_code: {
        type: type.INTEGER,
        allowNull: true,
      },
      alternate_phone: {
        type: type.STRING,
        allowNull: true,
      },
      alternate_dial_code: {
        type: type.INTEGER,
        allowNull: true,
      },
      salutation: {
        type: type.INTEGER,
        allowNull: true,
      },
      cust_type: {
        type: type.INTEGER,
        allowNull: true,
      },
      comment: {
        type: type.STRING,
        allowNull: true,
      },
      extra_details: {
        type: type.JSON,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_CUSTOMER,
    },
    {
      instanceMethods: {},
    },
  );
  return Customer;
}

module.exports = {
  getModel,
};
