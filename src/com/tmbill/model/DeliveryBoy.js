const util = require('../util/DBUtil')

function getModel(sequelize, type) {

    const DeliveryBoy = sequelize.define(util.DBDetails.Tables.MPOS_DELIVERYBOY,
        {
            id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            username: {
                type: type.STRING,
                allowNull: true
            },
            phone: {
                type: type.STRING,
                allowNull: true
            },
            name: {
                type: type.STRING,
                allowNull: true
            },
            area: {
                type: type.STRING,
                allowNull: true
            },
            store_id: {
                type: type.STRING,
                allowNull: true
            }
        },
        {
            timestamps: false,
            tableName: util.DBDetails.Tables.MPOS_DELIVERYBOY
        });
    return DeliveryBoy;
}

module.exports = {
    getModel
}