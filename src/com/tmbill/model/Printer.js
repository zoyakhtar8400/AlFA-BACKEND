const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const Printer = sequelize.define(util.DBDetails.Tables.MPOS_PRINTER,
        {
            id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            device_name: {
                type: type.STRING,
                allowNull: true
            },
            device_address: {
                type: type.STRING,
                allowNull: true
            },
            title: {
                type: type.STRING,
                allowNull: true
            },
            activate: {
                type: type.INTEGER,
                defaultValue: 1
            },
            created_date: {
                type: type.DATE,
                allowNull: true,
                defaultValue: type.NOW
            },
            printer_size: {
                type: type.INTEGER,
                defaultValue: 2   //1- 58mm , 2- 80mm
            },
            printer_port_number: {
                type: type.STRING,
                allowNull: true,
                defaultValue: '9100'
            },
            printer_type: {
                type: type.STRING,
                defaultValue: 'KOT' // 'KOT' or 'BILL'
            },
            action_type: {
                type: type.INTEGER,
                defaultValue: 2
            },
            no_of_prints: {
                type: type.INTEGER,
                defaultValue: 1
            },
            more_info: {
                type: type.JSON,
                allowNull: true
            },
            store_id: {
                type: type.STRING,
                allowNull: true,
                defaultValue: 'STORE_1'
            },
            is_active: {
                type: type.INTEGER,
                defaultValue: 1
            }
        },
        {
            timestamps: false,
            tableName: util.DBDetails.Tables.MPOS_PRINTER
        }, {
        instanceMethods: {

        }
    });
    return Printer;
}

module.exports = {
    getModel
}