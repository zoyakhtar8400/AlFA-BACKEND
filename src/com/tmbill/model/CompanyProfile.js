function getModel(sequelize, type) {
  const CompanyProfile = sequelize.define(
    'hotel_company_profile',
    {
      id: {
        type: type.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      company_name: {
        type: type.STRING,
        allowNull: true,
      },
      phone: {
        type: type.STRING,
        allowNull: true,
      },
      email: {
        type: type.STRING,
        allowNull: true,
      },
      logo: {
        type: type.TEXT,
        allowNull: true,
      },
      gstin: {
        type: type.STRING,
        allowNull: true,
      },
      fssai: {
        type: type.STRING,
        allowNull: true,
      },
      address: {
        type: type.TEXT,
        allowNull: true,
      },
      state: {
        type: type.STRING,
        allowNull: true,
      },
      city: {
        type: type.STRING,
        allowNull: true,
      },
      country: {
        type: type.STRING,
        allowNull: true,
      },
      license_key: {
        type: type.STRING,
        allowNull: true,
      },
      store_id: {
        type: type.STRING,
        allowNull: true,
        defaultValue: 'STORE_1',
      },
    },
    {
      timestamps: true,
      tableName: 'hotel_company_profile',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return CompanyProfile;
}

module.exports = {
  getModel,
};
