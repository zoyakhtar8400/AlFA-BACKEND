require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'alfa_restaurant',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'Zoya@8400',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: false
  }
);

async function fix() {
  await sequelize.authenticate();
  console.log('✅ DB connected');

  const addCol = async (table, col, def) => {
    try {
      await sequelize.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${def};`);
      console.log(`  ✅ ${table}.${col} added`);
    } catch (e) {
      console.log(`  ⚠️  ${table}.${col}: ${e.message}`);
    }
  };

  // Fix mpos_printer
  console.log('\n=== mpos_printer ===');
  await addCol('mpos_printer', 'is_active', 'INT DEFAULT 1');
  await addCol('mpos_printer', 'store_id', 'VARCHAR(50) DEFAULT \'STORE_1\'');

  // Fix mpos_kitchen_department
  console.log('\n=== mpos_kitchen_department ===');
  await addCol('mpos_kitchen_department', 'is_active', 'INT DEFAULT 1');
  await addCol('mpos_kitchen_department', 'store_id', 'VARCHAR(50) DEFAULT \'STORE_1\'');
  await addCol('mpos_kitchen_department', 'name', 'VARCHAR(255)');

  // Update any NULL is_active to 1 for existing rows
  console.log('\n=== Setting existing rows to is_active=1 ===');
  await sequelize.query(`UPDATE mpos_printer SET is_active = 1 WHERE is_active IS NULL;`);
  await sequelize.query(`UPDATE mpos_kitchen_department SET is_active = 1 WHERE is_active IS NULL;`);

  console.log('\n✅ All fixes applied');
  process.exit(0);
}

fix().catch(e => { console.error('❌', e.message); process.exit(1); });
