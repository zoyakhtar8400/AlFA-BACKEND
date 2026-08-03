const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const Orderchildcharges = sequelize.define(util.DBDetails.Tables.MPOS_ORDERCHILD_CHARGES,
        {
            id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            order_id: {
                type: type.STRING,
                allowNull: true
            },
            order_item_id: {
                type: type.INTEGER,
                defaultValue: 0
            },
            charge_title: {
                type: type.STRING
            },
            charge_amount: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
            },
            per_fixed: {
                type: type.INTEGER,//1-percentage 0-fix
                defaultValue: 0
            },
            calculated_charge: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
            },
            calculated_tax: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
            },
            calculate_tax_for_item_charges: {//1= calculate tax for charge  0=do not calculate tax for charge
                type: type.BOOLEAN,
                defaultValue: false
            },
            is_tax_applicable: {
                type: type.INTEGER,
                defaultValue: 0
            },
            tax_amount: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
            },
            is_tax_included: {
                type: type.INTEGER,
                defaultValue: 0
            },
            tax_title: {
                type: type.STRING,
                allowNull: true
            },
            tax_divided: {
                type: type.BOOLEAN,
                defaultValue: false
            },
            extra_details:{
                type: type.JSON,
                allowNull: true
            }
        },
        {
            timestamps: false,
            tableName: util.DBDetails.Tables.MPOS_ORDERCHILD_CHARGES
        });
    return Orderchildcharges;
}

module.exports = {
    getModel
}