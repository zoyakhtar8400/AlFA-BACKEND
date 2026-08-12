const util = require('../util/DBUtil');

function getModel(sequelize, type) {
  const DepartmentIssue = sequelize.define(
    util.DBDetails.Tables.DEPARTMENT_ISSUES || 'department_issues',
    {
      issue_id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      issue_number: {
        type: type.STRING,
        allowNull: false,
      },
      from_department: {
        type: type.STRING,
        defaultValue: 'PURCHASE STORE',
      },
      to_department: {
        type: type.STRING,
        defaultValue: 'MAIN KITCHEN',
      },
      issue_date: {
        type: type.DATE,
        defaultValue: type.NOW,
      },
      notes: {
        type: type.TEXT,
        allowNull: true,
      },
      is_active: {
        type: type.INTEGER,
        defaultValue: 1,
      },
    },
    {
      timestamps: false,
      tableName: 'department_issues',
    }
  );
  return DepartmentIssue;
}

module.exports = { getModel };
