/* eslint-disable camelcase */
const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const ProductGroup = sequelize.define(
    util.DBDetails.Tables.MPOS_PRODUCTGROUP,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      product_group_id: {
        type: type.INTEGER,
        unique: true,
      },
      store_id: {
        type: type.INTEGER,
        defaultValue: 0,
      },
      product_group_name: {
        type: type.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_PRODUCTGROUP,
    },
  );

  ProductGroup.getonlyexisitngGroups = async function (store_id) {
    let groups = [];
    try {
      const query =
        'SELECT `mpos_productgroup`.`product_group_id` as id,' +
        '`mpos_productgroup`.`store_id`,' +
        '`mpos_productgroup`.`product_group_name`' +
        'FROM`mpos_productgroup` AS`mpos_productgroup` LEFT JOIN' +
        '`mpos_item` AS`mpos_items` ON`mpos_productgroup`.`product_group_id` = `mpos_items`.`product_group`' +
        'WHERE`mpos_productgroup`.`store_id` = :store_id GROUP BY`product_group_id`; ';
      groups = await sequelize.query(query, {
        model: this,
        mapToModel: true,
        replacements: { store_id },
        type: sequelize.QueryTypes.SELECT,
      });
    } catch (error) {
      groups = [];
    }
    return groups;
  };
  return ProductGroup;
}

module.exports = {
  getModel,
};
