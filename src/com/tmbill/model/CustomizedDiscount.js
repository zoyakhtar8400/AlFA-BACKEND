const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const CustomizedDiscount = sequelize.define(util.DBDetails.Tables.MPOS_CUSTOMIZED_DISCOUNT,
        {
            id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            title: {
                type: type.STRING,
                allowNull: true
            },
            amount: {
                type: type.DECIMAL(10, 2)
            },
            type: {//0 Fixed 1 Percent
                type: type.INTEGER,
                defaultValue: 1
            },
            order_type: { // 0=All ,1=Quick Bill, 2=Dine In, 3= TA
                type: type.INTEGER,
                defaultValue: 1
            },
            applicable_on_amount: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
            },
            max_applicable_discount: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
            },
            amount_lower_limit: {
                type: type.DECIMAL(10, 2),
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
            discount_day: {
                type: type.INTEGER,
                defaultValue: 0
            },
            is_active: {
                type: type.INTEGER,
                defaultValue: 1
            },
            discount_after_amount: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
            },
            store_id: {
                type: type.STRING,
                allowNull: true
            },
            is_default: {// 1=default 0=not default
                type: type.BOOLEAN,
                defaultValue: true
            },
            product_groups: {
                type: type.STRING,
                allowNull: true
            },
            // applicable_on_items: {
            //     type: type.STRING,
            //     allowNull: true
            // },
            // discounted_items: {
            //     type: type.JSON,
            //     allowNull: true
            // }
        },
        {
            timestamps: false,
            tableName: util.DBDetails.Tables.MPOS_CUSTOMIZED_DISCOUNT
        });
    return CustomizedDiscount;
}

module.exports = {
    getModel
}