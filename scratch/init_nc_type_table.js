require('dotenv').config();
const { sequelize } = require('./src/com/tmbill/js/database');

async function initTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS mpos_nc_type (
      id SERIAL PRIMARY KEY,
      code VARCHAR(50),
      name VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'Active',
      is_active INT DEFAULT 1,
      store_id VARCHAR(50) DEFAULT 'STORE_1'
    );
  `;
  await sequelize.query(query);
  console.log('✅ PostgreSQL table "mpos_nc_type" created/verified successfully!');
  process.exit(0);
}

initTable().catch(err => {
  console.error('Error creating mpos_nc_type table:', err);
  process.exit(1);
});
