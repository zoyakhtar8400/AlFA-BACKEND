const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const PlatformMapping = sequelize.define(util.DBDetails.Tables.MPOS_PLATFORM_MAPPING,
        {
            id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                unique: true
            },
            platform_store_id: {
                type: type.STRING,
                allowNull: true
            },
            store_id: {
                type: type.STRING,
                allowNull: true
            },
            platform: {
                type: type.STRING,
                allowNull: true
            },
            store_name: {
                type: type.STRING,
                allowNull: true
            },
            platform_menu: {
                type: type.JSON,
                allowNull: true
            },
            is_published:{
                type:type.INTEGER,
                defaultValue: 0
            }
            
        },
        {
            timestamps: false,
            tableName: util.DBDetails.Tables.MPOS_PLATFORM_MAPPING
        }
    );

    return PlatformMapping;
   
}

module.exports = {
    getModel
}