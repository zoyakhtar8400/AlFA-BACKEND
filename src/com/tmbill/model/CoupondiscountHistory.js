const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const CoupondiscountHistory = sequelize.define(util.DBDetails.Tables.MPOS_COUPON_DISCOUNT_HISTORY,
        {
            id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            tmpos_id: {
                type: type.STRING,
                allowNull: true
            },
            store_id: {
                type: type.STRING,
                allowNull: true
            },
            logedin_user: {
                type: type.STRING,
                allowNull: true
            },
            coupon_code: {
                type: type.STRING,
                allowNull: true
            },
            customer_name: {
                type: type.STRING,
                allowNull: true
            },
            customer_phone: {
                type: type.STRING,
                allowNull: true
            },
            coupon_code_amt: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
            },
            used_date: {
                type: type.TIME,
                allowNull: true,
                defaultValue: type.NOW
            },
            order_id: {
                type: type.STRING,
                allowNull: true
            },
            sync_flag: {
                type: type.INTEGER,
                defaultValue: 0
            }
        },
        {
            timestamps: false,
            tableName: util.DBDetails.Tables.MPOS_COUPON_DISCOUNT_HISTORY
        });
    return CoupondiscountHistory;
}

module.exports = {
    getModel
}