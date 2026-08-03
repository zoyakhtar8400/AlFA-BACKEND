const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const OptionGrp = sequelize.define(util.DBDetails.Tables.MPOS_OPTION_GROUPS,
        {
            ref_id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            title: {
                type: type.STRING
            },
            description: {
                type: type.STRING,
                allowNull: true
            },
            min_selectable: {
                type: type.INTEGER,
                defaultValue: 0
            },
            max_selectable: {
                type: type.INTEGER,
                defaultValue: 0
            },
            active: {
                type: type.INTEGER,
                defaultValue: 1
            },
            item_ref_ids: {
                type: type.STRING,
                allowNull: true
            },
            is_addon: {
                type: type.INTEGER,
                defaultValue: 0
            },
            store_id: {
                type: type.STRING,
                allowNull: true
            }
        },
        {
            timestamps: false,
            tableName: util.DBDetails.Tables.MPOS_OPTION_GROUPS
        }, {
        instanceMethods: {

        }
    });
    return OptionGrp;
}

module.exports = {
    getModel
}