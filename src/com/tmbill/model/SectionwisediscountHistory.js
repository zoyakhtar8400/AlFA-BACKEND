const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const SectionwiseDiscounthistory = sequelize.define(util.DBDetails.Tables.MPOS_SECTIONWISE_DISCOUNT_HISTORY,
        {
            id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            order_id: {
                type: type.STRING,
                allowNull: true
            },
            product_group_id: {
                type: type.INTEGER,
                defaultValue: 0
            },
            discounted_amt: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
            },
            discount_type: {
                type: type.INTEGER,
                defaultValue: 0
            },
            discount_rate: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
            },
            coupon_code_name: {
                type: type.STRING,
                allowNull: true
            },
            coupon_code_type: {
                type: type.INTEGER,
                defaultValue: 0
            },
            coupon_code_rate: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
            },
            coupon_code_amt: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
            }
        },
        {
            timestamps: false,
            tableName: util.DBDetails.Tables.MPOS_SECTIONWISE_DISCOUNT_HISTORY
        });
    return SectionwiseDiscounthistory;
}

module.exports = {
    getModel
}