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

async function migratePrinterTable() {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL database');

    // 1. Ensure mpos_printer table exists with all required columns
    await sequelize.query(`
      DO $$
      BEGIN
        -- Alter printer_type to VARCHAR(50) if it is integer
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'mpos_printer' AND column_name = 'printer_type' AND data_type != 'character varying'
        ) THEN
          ALTER TABLE mpos_printer ALTER COLUMN printer_type TYPE VARCHAR(50) USING (
            CASE 
              WHEN LOWER(COALESCE(title, device_name, '')) LIKE '%bill%' THEN 'BILL'
              ELSE 'KOT'
            END
          );
        END IF;

        -- Ensure printer_port_number column exists
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'mpos_printer' AND column_name = 'printer_port_number'
        ) THEN
          ALTER TABLE mpos_printer ADD COLUMN printer_port_number VARCHAR(20) DEFAULT '9100';
        END IF;

        -- Ensure is_active column exists
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'mpos_printer' AND column_name = 'is_active'
        ) THEN
          ALTER TABLE mpos_printer ADD COLUMN is_active INTEGER DEFAULT 1;
        END IF;

        -- Ensure store_id column exists
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'mpos_printer' AND column_name = 'store_id'
        ) THEN
          ALTER TABLE mpos_printer ADD COLUMN store_id VARCHAR(50) DEFAULT 'STORE_1';
        END IF;
      END $$;
    `);

    // 2. Normalize existing printer_type values
    await sequelize.query(`
      UPDATE mpos_printer 
      SET printer_type = CASE 
        WHEN UPPER(printer_type) IN ('BILL', 'INVOICE', 'RECEIPT') THEN 'BILL'
        WHEN LOWER(COALESCE(title, device_name, '')) LIKE '%bill%' THEN 'BILL'
        ELSE 'KOT'
      END,
      printer_port_number = COALESCE(printer_port_number, '9100'),
      is_active = COALESCE(is_active, 1),
      store_id = COALESCE(store_id, 'STORE_1');
    `);

    // 3. Ensure standard default printers exist for STORE_1 if empty or incomplete
    const [existing] = await sequelize.query(`SELECT id, title, printer_type, store_id, is_active FROM mpos_printer;`);
    console.log('Current Printers in DB:', existing);

    const hasKot = existing.some(p => p.printer_type === 'KOT' && p.is_active === 1 && p.store_id === 'STORE_1');
    const hasBill = existing.some(p => p.printer_type === 'BILL' && p.is_active === 1 && p.store_id === 'STORE_1');

    if (!hasKot) {
      console.log('Seeding default KOT printer for STORE_1...');
      await sequelize.query(`
        INSERT INTO mpos_printer (device_name, device_address, title, activate, printer_size, printer_port_number, printer_type, store_id, is_active)
        VALUES ('Kitchen Thermal Printer', '192.168.1.101', 'Kitchen Thermal Printer', 1, 2, '9100', 'KOT', 'STORE_1', 1);
      `);
    }

    if (!hasBill) {
      console.log('Seeding default BILL printer for STORE_1...');
      await sequelize.query(`
        INSERT INTO mpos_printer (device_name, device_address, title, activate, printer_size, printer_port_number, printer_type, store_id, is_active)
        VALUES ('Billing Desk Printer', '192.168.1.107', 'Billing Desk Printer', 1, 2, '9100', 'BILL', 'STORE_1', 1);
      `);
    }

    const [finalPrinters] = await sequelize.query(`SELECT id, title, device_address, printer_port_number, printer_type, store_id, is_active FROM mpos_printer;`);
    console.log('Final Migrated Printers:', finalPrinters);

  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await sequelize.close();
  }
}

migratePrinterTable();
