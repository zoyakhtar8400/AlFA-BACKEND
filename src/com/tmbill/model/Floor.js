/* eslint-disable camelcase */
function getModel(sequelize, type) {
  const Floor = sequelize.define(
    'hotel_floors',
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
      floor_number: {
        type: type.STRING,
        allowNull: true,
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
      tableName: 'hotel_floors',
    }
  );
  return Floor;
}

module.exports = {
  getModel,
};
