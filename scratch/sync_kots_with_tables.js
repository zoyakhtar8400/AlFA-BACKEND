require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'alfa_restaurant',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'Zoya@8400',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false
  }
);

async function syncKotsWithTables() {
  try {
    await sequelize.authenticate();

    // Check which tables are currently occupied/running
    const [runningTables] = await sequelize.query(`
      SELECT id, table_name, order_state 
      FROM mpos_table 
      WHERE order_state = 'Running' OR order_state = 'KOT_CUT' OR order_state = 'OCCUPIED' OR order_state = 'ORDERED';
    `);
    console.log(`Currently running tables: ${runningTables.length}`);
    console.table(runningTables);

    const runningTableIds = runningTables.map(t => t.id);

    if (runningTableIds.length === 0) {
      // No tables running -> all lingering KOTs should be marked inactive / closed
      await sequelize.query(`
        UPDATE mpos_kot 
        SET is_active = 0, status = 6 
        WHERE is_active = 1;
      `);
      console.log('All legacy lingering KOTs updated to is_active = 0, status = 6 (Closed)');
    } else {
      // Mark KOTs for non-running tables as closed
      await sequelize.query(`
        UPDATE mpos_kot 
        SET is_active = 0, status = 6 
        WHERE is_active = 1 AND table_id NOT IN (${runningTableIds.join(',')});
      `);
      console.log(`Updated legacy KOTs for non-running tables`);
    }

    const [activeKots] = await sequelize.query(`
      SELECT kot_id, kot_number, table_id, table_name, amount, is_active, status 
      FROM mpos_kot 
      WHERE is_active = 1 AND status != 6;
    `);
    console.log(`\nActive KOTs remaining in PostgreSQL: ${activeKots.length}`);
    console.table(activeKots);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

syncKotsWithTables();
