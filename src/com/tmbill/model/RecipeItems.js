const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const RecipeItems = sequelize.define(
    util.DBDetails.Tables.RECIPE_ITEMS || 'recipe_items',
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      recipe_id: {
        type: type.INTEGER,
        allowNull: false,
      },
      inventory_item_id: {
        type: type.INTEGER,
        allowNull: false,
      },
      quantity: {
        type: type.DECIMAL(12, 3),
        allowNull: false,
      },
      unit: {
        type: type.STRING,
        allowNull: false,
        defaultValue: 'g',
      },
      is_active: {
        type: type.INTEGER,
        defaultValue: 1,
      },
    },
    {
      timestamps: false,
      tableName: 'recipe_items',
    }
  );
  return RecipeItems;
}

module.exports = { getModel };
