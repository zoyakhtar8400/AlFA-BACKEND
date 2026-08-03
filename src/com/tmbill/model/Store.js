const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Store = sequelize.define(
    util.DBDetails.Tables.MPOS_STORE,
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
      store_name: {
        type: type.STRING,
        allowNull: true,
      },
      store_phone: {
        type: type.STRING,
        allowNull: true,
      },
      user_phone: {
        type: type.STRING,
        allowNull: true,
      },
      disable_ordering: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      username: {
        type: type.STRING,
        allowNull: true,
      },
      person_name: {
        type: type.STRING,
        allowNull: true,
      },
      user_email: {
        type: type.STRING,
        allowNull: true,
      },
      user_city: {
        type: type.STRING,
        allowNull: true,
      },
      user_line_1: {
        type: type.STRING(1234),
        allowNull: true,
      },
      user_line_2: {
        type: type.STRING,
        allowNull: true,
      },
      user_sub_locality: {
        type: type.STRING,
        allowNull: true,
      },
      user_designation: {
        type: type.STRING,
        allowNull: true,
      },
      user_shift_time: {
        type: type.STRING,
        allowNull: true,
      },
      country: {
        type: type.STRING,
        allowNull: true,
      },
      currency: {
        type: type.STRING,
        allowNull: true,
      },
      store_email: {
        type: type.STRING,
        allowNull: true,
      },
      website: {
        type: type.STRING,
        allowNull: true,
      },
      note: {
        type: type.STRING,
        allowNull: true,
      },
      footer_note: {
        type: type.STRING,
        allowNull: true,
      },
      upi_id: {
        type: type.STRING,
        allowNull: true,
      },
      field1: {
        type: type.STRING,
        allowNull: true,
      },
      field2: {
        type: type.STRING,
        allowNull: true,
      },
      field3: {
        type: type.STRING,
        allowNull: true,
      },
      field4: {
        type: type.STRING,
        allowNull: true,
      },
      currency_code: {
        type: type.STRING,
        allowNull: true,
      },
      show_upi: {
        type: type.STRING,
        allowNull: true,
      },
      settings: {
        type: type.JSON,
        allowNull: true,
      },
      password: {
        type: type.STRING,
        allowNull: true,
      },
      resetBillAfterDays: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      warehouse_id: {
        type: type.STRING,
        allowNull: true,
      },
      reduce_inventory: {
        type: type.STRING,
        allowNull: true,
      },
      tmpos_id: {
        type: type.STRING,
        allowNull: true,
      },
      sync_hash: {
        type: type.STRING,
        allowNull: true,
      },
      token: {
        type: type.STRING,
        allowNull: true,
      },
      access_levels: {
        type: type.JSON,
        allowNull: true,
      },
      reset_bill_time: {
        type: type.STRING,
        allowNull: true,
      },
      reset_kot_indays: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      reset_kot_time: {
        type: type.STRING,
        allowNull: true,
      },
      show_poweredby: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      alternative_outlet_name: {
        type: type.STRING,
        allowNull: true,
      },
      bill_number_prefix: {
        type: type.STRING,
        allowNull: true,
      },
      show_phone_on_bill: {
        type: type.STRING,
        allowNull: true,
      },
      logo: {
        type: type.STRING,
        allowNull: true,
      },
      field5: {
        type: type.STRING,
        allowNull: true,
      },
      field6: {
        type: type.STRING,
        allowNull: true,
      },
      field7: {
        type: type.STRING,
        allowNull: true,
      },
      field8: {
        type: type.STRING,
        allowNull: true,
      },
      loyalty_enabled: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      reward_otp_verification: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      reward_otp_verification: {
        type: type.STRING,
        allowNull: true,
      },
      custom_qr_codes: {
        type: type.JSON,
        allowNull: true,
      },
      logout_after_close_pos_app: {
        type: type.BOOLEAN,
        defaultValue: false,
      },
      activation_expires_at: {
        type: type.STRING,
        allowNull: true,
      },
      currency_name: {
        type: type.STRING,
        allowNull: true,
      },
      sub_currency_name: {
        type: type.STRING,
        allowNull: true,
      },
      field9: {
        type: type.STRING,
        allowNull: true,
      },
      field10: {
        type: type.STRING,
        allowNull: true,
      },
      field11: {
        type: type.STRING,
        allowNull: true,
      },
      field12: {
        type: type.STRING,
        allowNull: true,
      },
      custom_quickbill_ordertypes: {
        type: type.STRING,
        allowNull: true,
      },
      enabled_passcode_protection: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      live_tracking_enabled: {
        type: type.BOOLEAN,
        defaultValue: false,
      },
      brand_name: {
        type: type.STRING,
        allowNull: true,
      },
      secondary_bill_prefix: {
        type: type.STRING,
        allowNull: true,
      },
      point_of_contact: {
        type: type.JSON,
        allowNull: true,
      },
      bar_bill_prefix: {
        type: type.STRING,
        allowNull: true,
      },
      is_bar_section_billing: {
        type: type.INTEGER,
        defaultValue: 0,
        allowNull: true,
      },
      pdam_start_time: {
        type: type.INTEGER,
        defaultValue: '00',
        allowNull: true,
      },
      pdam_end_time: {
        type: type.INTEGER,
        defaultValue: '06',
        allowNull: true,
      },
      tenant_id: {
        type: type.STRING,
        allowNull: true,
      },
      extra_info: {
        type: type.JSON,
        allowNull: true,
      },
      languagePreference: {
        type: type.STRING,
        defaultValue: 'en',
        allowNull: true,
      },
      day_start_time: {
        type: type.STRING,
        allowNull: true,
      },
      day_close_time: {
        type: type.STRING,
        allowNull: true,
      },
      pos_settings: {
        type: type.JSON,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_STORE,
    },
  );
  return Store;
}

module.exports = {
  getModel,
};
