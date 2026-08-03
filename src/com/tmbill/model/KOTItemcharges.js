const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const KOTItemcharges = sequelize.define(util.DBDetails.Tables.MPOS_KOTITEMS_CHARGES,
        {
            id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            table_id: {
                type: type.INTEGER,
                defaultValue: 0
            },
            itemtitle: {
                type: type.STRING
            },
            charge_id: {
                type: type.INTEGER,
                defaultValue: 0
            },
            title: {
                type: type.STRING
            },
            per_or_fixed: {
                type: type.INTEGER,//1-percentage 0-fix
                defaultValue: 0
            },
            is_default: {
                type: type.INTEGER,//1-default 0-not default
                defaultValue: 0
            },
            billing_flag: {//0=All ,1=Quick Bill, 2=Dine In, 3= TA
                type: type.INTEGER,
                defaultValue: 0
            },
            amount: {
                type: type.DECIMAL(10, 2)
            },
            store_id: {
                type: type.STRING,
                allowNull: true
            },
            applicable_on_items: {
                type: type.STRING,
                allowNull: true
            },
            calculate_tax_for_item_charges: {//1= calculate tax for charge  0=do not calculate tax for charge
                type: type.BOOLEAN,
                defaultValue: false
            },
            charge_applicable_on: {//0=order level   1=item level    2=on both
                type: type.INTEGER,
                defaultValue: 0
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
            tableName: util.DBDetails.Tables.MPOS_KOTITEMS_CHARGES
        });
    return KOTItemcharges;
}

module.exports = {
    getModel
}