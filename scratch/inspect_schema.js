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

async function inspectSchema() {
  try {
    await sequelize.authenticate();

    const [userCols] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'mpos_user';
    `);
    console.log('--- mpos_user columns ---');
    console.table(userCols);

    const [users] = await sequelize.query(`SELECT * FROM mpos_user LIMIT 5;`);
    console.log('--- sample users ---');
    console.table(users);

    const [taxCols] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'mpos_tax';
    `);
    console.log('--- mpos_tax columns ---');
    console.table(taxCols);

    const [taxes] = await sequelize.query(`SELECT * FROM mpos_tax LIMIT 5;`);
    console.log('--- sample taxes ---');
    console.table(taxes);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

inspectSchema();
