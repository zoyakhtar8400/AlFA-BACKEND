const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const StoreMapper = sequelize.define(util.DBDetails.Tables.MPOS_STOREMAPPER,
        {
            id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true,
            },
            tmpos_store_id: {
                type: type.STRING,
                allowNull: true
            },
            tmchannel_store_id: {
                type: type.STRING,
                allowNull: true
            },
            tmpos_id: {
                type: type.STRING,
                allowNull: true
            }
        }, {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_STOREMAPPER
    });
    return StoreMapper;
}

module.exports = {
    getModel
}