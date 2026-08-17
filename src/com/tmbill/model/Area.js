/* eslint-disable camelcase */
function getModel(sequelize, type) {
  const Area = sequelize.define(
    'pos_areas',
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: type.STRING,
        allowNull: false,
      },
      description: {
        type: type.TEXT,
        allowNull: true,
      },
      active: {
        type: type.STRING,
        defaultValue: 'Yes',
      },
      store_id: {
        type: type.STRING,
        defaultValue: 'STORE_1',
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
      tableName: 'pos_areas',
    }
  );
  return Area;
}

module.exports = {
  getModel,
};
