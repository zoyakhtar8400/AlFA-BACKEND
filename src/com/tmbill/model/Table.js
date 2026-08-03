const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Table = sequelize.define(
    util.DBDetails.Tables.MPOS_TABLE,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      table_name: {
        type: type.STRING,
        allowNull: false,
      },
      isactive: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      max_person: {
        type: type.STRING,
        defaultValue: '0',
      },
      department: {
        type: type.INTEGER,
        allowNull: false,
        // references: {
        //     model: 'tmpos_table_department',
        //     key: 'id'
        // }
      },
      table_color: {
        type: type.STRING,
        allowNull: true,
      },
      order_type_flag: {
        // Dine in = 0 , TA = 1 , HD = 2 Online=3 4=Virtual
        type: type.INTEGER,
        defaultValue: 0,
      },
      table_action_flag: {
        // 0- table free , 1-kot saved , 2- bill saved , 3- Bill saved & printed
        type: type.INTEGER,
        defaultValue: 0,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      order_state: {
        type: type.STRING,
        allowNull: true,
      },
      parent: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      is_pre_order: {
        // 1 Is pre-order
        type: type.INTEGER,
        defaultValue: 0,
      },
      is_old_table: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      reservation_id: {
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
      tableName: util.DBDetails.Tables.MPOS_TABLE,
    },
  );

  Table.updateorderState = async function (order_state, id) {
    let result = await this.update({ order_state }, { where: { id } });
    return result;
  };
  return Table;
}

module.exports = {
  getModel,
};
