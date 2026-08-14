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

async function createFloorTable() {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL database...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS hotel_floors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        floor_number VARCHAR(50),
        description TEXT,
        active VARCHAR(10) DEFAULT 'Yes',
        store_id VARCHAR(50) DEFAULT 'STORE_1',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check count and seed if empty
    const [rows] = await sequelize.query('SELECT COUNT(*) as cnt FROM hotel_floors;');
    const count = parseInt(rows[0].cnt, 10);
    if (count === 0) {
      console.log('Seeding initial floors...');
      await sequelize.query(`
        INSERT INTO hotel_floors (name, floor_number, description, active, store_id)
        VALUES 
          ('Ground Floor', '0', 'Main Lobby and Reception Area', 'Yes', 'STORE_1'),
          ('First Floor', '1', 'Deluxe Rooms Corridor', 'Yes', 'STORE_1'),
          ('Second Floor', '2', 'Executive Suites Corridor', 'Yes', 'STORE_1'),
          ('Balcony', '3', 'Open Terrace & Balcony View', 'Yes', 'STORE_1'),
          ('Garden', '4', 'Outdoor Garden & Lawn Area', 'Yes', 'STORE_1');
      `);
    }

    console.log('hotel_floors table created and ready!');
  } catch (error) {
    console.error('Error creating hotel_floors table:', error.message);
  } finally {
    await sequelize.close();
  }
}

createFloorTable();
