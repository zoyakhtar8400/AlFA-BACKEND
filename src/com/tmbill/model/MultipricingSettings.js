const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const MultipricingSettings = sequelize.define(util.DBDetails.Tables.MPOS_MULTIPRICING_SETTINGS,
        {
            id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                unique: true
            },
            store_id: {
                type: type.STRING,
                allowNull: true
            },
            settings:{
                type: type.JSON,
                allowNull: true
            }
            
        },
        {
            timestamps: false,
            tableName: util.DBDetails.Tables.MPOS_MULTIPRICING_SETTINGS
        }
    );

    return MultipricingSettings;
   
}

module.exports = {
    getModel
}