const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const ExpenseCategory = sequelize.define(util.DBDetails.Tables.MPOS_EXPENSE_CATEGORY,
        {
            category_id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            ref_id: {
                type: type.INTEGER
            },
            category_name: {
                type: type.STRING
            },
            store_id: {
                type: type.STRING,
                allowNull: true
            }
        }, {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_EXPENSE_CATEGORY
    }, {
        instanceMethods: {

        }
    });
    return ExpenseCategory;
}

module.exports = {
    getModel
}