const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const Item = sequelize.define(util.DBDetails.Tables.IRN_HISTORY,
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
            tmpos_id: {
                type: type.STRING,
                allowNull: true
            },
            type: {
                type: type.INTEGER
            },
            ref_id: {
                type: type.STRING,
                allowNull: true
            },
            irn_no: {
                type: type.INTEGER,
                defaultValue: 1
            },
            irn_response:{
                type:type.JSON,
            },
            cancel_response:{
                type: type.JSON,
                allowNull: true
            },
            ewaybill_no:{
                type: type.STRING,
                allowNull: true
            },
            ewaybill_response:{
                type: type.JSON,
                allowNull: true
            },
            state:{
                type: type.STRING,
                allowNull: true
            },
            ewaybill_state:{
                type: type.STRING,
                allowNull: true
            },
            connector_id:{
                type: type.STRING,
                allowNull: true
            },
            invoice_no:{
                type: type.STRING,
                allowNull: true
            }
        },
        {
            timestamps: false,
            tableName: util.DBDetails.Tables.IRN_HISTORY
        }
    );

    return Item;
   
}

module.exports = {
    getModel
}