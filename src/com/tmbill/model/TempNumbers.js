const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const Tempnumbers = sequelize.define(
    util.DBDetails.Tables.MPOS_TEMP_NUMBERS,
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      bill_number: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      kot_number: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      takeawaybill_number: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      takeawaykot_number: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
      },
      next_sales_report_id: {
        type: type.STRING,
        allowNull: true,
      },
      mall_report_id: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      secondary_bill_number: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      barSection_bill_number: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      barSection_kot_number: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      order_number: {
        type: type.INTEGER,
        defaultValue: 1,
      },
      order_type_wise_order_number: {
        type: type.JSON,
        allowNull: true,
      },
    },
    {
      timestamps: false,
      tableName: util.DBDetails.Tables.MPOS_TEMP_NUMBERS,
    },
  );

  Tempnumbers.getNextTaxReportNumber = async function (params) {
    const query = `SELECT next_sales_report_id from mpos_tempnumbers where id=1`;
    let reportNumber;
    reportNumber = await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT,
    });

    return reportNumber[0].next_sales_report_id;
  };

  return Tempnumbers;
}

module.exports = {
  getModel,
};
