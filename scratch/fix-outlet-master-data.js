require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'alfa_restaurant',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'Zoya@8400',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function fixOutletMasterData() {
  console.log('Fixing outlet master data in PostgreSQL mpos_store...');
  try {
    await sequelize.authenticate();

    // 1. Delete messy test entries beyond id 5
    await sequelize.query('DELETE FROM mpos_store WHERE id > 5');

    // 2. Set clean human-friendly outlet records for IDs 1 to 5
    const cleanOutlets = [
      { id: 1, store_id: 'STORE_1', store_name: 'Main Restaurant' },
      { id: 2, store_id: 'STORE_2', store_name: 'Airport Restaurant' },
      { id: 3, store_id: 'STORE_3', store_name: 'City Restaurant' },
      { id: 4, store_id: 'STORE_4', store_name: 'Bar & Lounge' },
      { id: 5, store_id: 'STORE_5', store_name: 'Cafe & Bakery' }
    ];

    for (const out of cleanOutlets) {
      await sequelize.query(`
        INSERT INTO mpos_store (id, store_id, store_name, disable_ordering, show_poweredby)
        VALUES (${out.id}, '${out.store_id}', '${out.store_name}', 0, 1)
        ON CONFLICT (id) DO UPDATE
        SET store_id = '${out.store_id}', store_name = '${out.store_name}';
      `);
    }

    const [finalStores] = await sequelize.query('SELECT id, store_id, store_name FROM mpos_store ORDER BY id ASC');
    console.log('✅ Clean Outlets in mpos_store:', finalStores);

  } catch (err) {
    console.error('Error fixing outlets:', err.message);
  } finally {
    await sequelize.close();
  }
}

fixOutletMasterData();
