const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const RecipeMaster = sequelize.define(
    util.DBDetails.Tables.RECIPE_MASTER || 'recipe_master',
    {
      recipe_id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      menu_item_id: {
        type: type.INTEGER,
        allowNull: false,
      },
      recipe_name: {
        type: type.STRING,
        allowNull: false,
      },
      yield_qty: {
        type: type.DECIMAL(10, 2),
        defaultValue: 1,
      },
      is_active: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      created_at: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
      updated_at: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
    },
    {
      timestamps: false,
      tableName: 'recipe_master',
    }
  );
  return RecipeMaster;
}

module.exports = { getModel };
