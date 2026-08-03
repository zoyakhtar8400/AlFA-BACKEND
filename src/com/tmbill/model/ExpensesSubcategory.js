const util = require('../util/DBUtil')

function getModel(sequelize, type) {
    const ExpenseSubcategory = sequelize.define(util.DBDetails.Tables.MPOS_EXPENSE_SUBCATEGORY,
        {
            sub_category_id: {
                type: type.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            ref_id: {
                type: type.INTEGER
            },
            category_id: {
                type: type.INTEGER,
            },
            sub_category_name: {
                type: type.STRING
            },
            store_id: {
                type: type.STRING,
                allowNull: true
            }
        }, {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_EXPENSE_SUBCATEGORY
    });
    return ExpenseSubcategory;
}

module.exports = {
    getModel
}