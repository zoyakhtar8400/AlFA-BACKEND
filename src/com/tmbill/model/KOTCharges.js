const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const KOTCharges = sequelize.define(util.DBDetails.Tables.MPOS_KOT_CHARGES,
        {
            id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            table_id: {
                type: type.INTEGER,
                defaultValue: 1
            },
            title: {
                type: type.STRING
            },
            is_active: {
                type: type.INTEGER,
                defaultValue: 1
            },
            remark: {
                type: type.INTEGER,
                defaultValue: 0
            },
            status_flag: {
                type: type.INTEGER,
                defaultValue: 0
            },
            order_billing_flag: {
                type: type.INTEGER,
                defaultValue: 1
            },
            is_default_flag: {
                type: type.INTEGER,
                defaultValue: 0
            },
            per_or_fixed: {
                type: type.INTEGER,
                defaultValue: 0
            },
            charge_id: {
                type: type.INTEGER,
                defaultValue: 0
            },
            amount: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
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
            delivery_free_afteramount: {
                type: type.DECIMAL(10, 2),
                defaultValue: 0
            },
            delivery_applicable_platform: {
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
            tableName: util.DBDetails.Tables.MPOS_KOT_CHARGES
        }
    );
    return KOTCharges;
}

module.exports = {
    getModel
}