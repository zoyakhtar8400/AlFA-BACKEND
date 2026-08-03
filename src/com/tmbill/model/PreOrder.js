const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const PreOrder = sequelize.define(util.DBDetails.Tables.MPOS_PRE_ORDER,
        {
            id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            placed_at: {
                type: type.TIME,
                allowNull: true,
                defaultValue: type.NOW
            },
            delivery_at: {
                type: type.TIME,
                allowNull: true,
                defaultValue: type.NOW
            },
            order_id: {
                type: type.STRING(20),
                allowNull: true
            },
            table_id: {
                type: type.INTEGER,
                defaultValue: 0
            },
            notification_time: {
                type: type.TIME,
                allowNull: true
            },
            instructions: {
                type: type.STRING,
                allowNull: true
            },
            customer_name: {
                type: type.STRING(90),
                allowNull: true
            },
            customer_mobile: {
                type: type.STRING(15),
                allowNull: true
            },
            customer_address: {
                type: type.STRING,
                allowNull: true
            },
            payment_instruction: {
                type: type.STRING(90),
                allowNull: true
            },
            store_id: {
                type: type.STRING(50),
                allowNull: true
            },
            media: {
                type: type.STRING,
                allowNull: true
            },
            status: {
                type: type.STRING(50),
                allowNull: true,
                defaultValue: 'created'
            }
        },
        {
            timestamps: false,
            tableName: util.DBDetails.Tables.MPOS_PRE_ORDER
        });
    return PreOrder;
}

module.exports = {
    getModel
}