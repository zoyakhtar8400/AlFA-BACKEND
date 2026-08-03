const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const CouponDiscount = sequelize.define(util.DBDetails.Tables.MPOS_COUPON_DISCOUNT,
        {
            id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            applicable_on: {
                type: type.INTEGER,
                defaultValue: 0
            },
            applicable_on_items: {
                type: type.STRING,
                allowNull: true
            },
            amount: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
            },
            applicable_categories: {
                type: type.STRING,
                allowNull: true
            },
            per_fixed: {
                type: type.BOOLEAN,
                defaultValue: true
            },
            applicable_order_amt: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
            },
            cust_type: {
                type: type.BOOLEAN,
                defaultValue: true
            },
            validity_in_days: {
                type: type.INTEGER,
                defaultValue: 0
            },
            amount_upper_limit: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
            },
            from_date_time: {
                type: type.TIME,
                allowNull: true,
                defaultValue: type.NOW
            },
            to_date_time: {
                type: type.TIME,
                allowNull: true,
                defaultValue: type.NOW
            },
            store_id: {
                type: type.STRING,
                allowNull: true
            }
        },
        {
            timestamps: false,
            tableName: util.DBDetails.Tables.MPOS_COUPON_DISCOUNT
        });
    return CouponDiscount;
}

module.exports = {
    getModel
}