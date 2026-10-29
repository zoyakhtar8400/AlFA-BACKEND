const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const User = sequelize.define(util.DBDetails.Tables.MPOS_WAITER,
        {
            id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: type.STRING,
                allowNull: true
            },
            phone: {
                type: type.STRING,
                allowNull: true
            },
            username: {
                type: type.STRING,
                allowNull: false,
                unique: true
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
            tableName: util.DBDetails.Tables.MPOS_WAITER
        });
    return User;
}

module.exports = {
    getModel
}