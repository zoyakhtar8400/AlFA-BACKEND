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

function resolveStation(title) {
  const t = (title || '').toLowerCase();

  // 1. Tandoor & Breads & Kebabs
  if (
    t.includes('tikka') || t.includes('kebab') || t.includes('kabab') ||
    t.includes('roti') || t.includes('naan') || t.includes('kulcha') ||
    t.includes('paratha') || t.includes('chaap') || t.includes('tandoor') ||
    t.includes('tangri') || t.includes('sheek') || t.includes('boti')
  ) {
    return 2; // Tandoor Section (ID: 2) -> Tandoor Printer
  }

  // 2. Chinese, Noodles, Momos, Fried Rice
  if (
    t.includes('noodle') || t.includes('chowmein') || t.includes('fried rice') ||
    t.includes('manchurian') || t.includes('momos') || t.includes('spring roll') ||
    t.includes('chilli') || t.includes('soup') || t.includes('kung pao') ||
    t.includes('satay') || t.includes('chinese') || t.includes('schezwan') ||
    t.includes('singapuri') || t.includes('shanghai') || t.includes('hakka') ||
    t.includes('wonton') || t.includes('dragon') || t.includes('french fries') ||
    t.includes('lollipop') || t.includes('drums of heaven') || t.includes('65')
  ) {
    return 3; // Chinese Section (ID: 3) -> Chinese Printer
  }

  // 3. Beverages & Mocktails & Tea & Coffee
  if (
    t.includes('tea') || t.includes('coffee') || t.includes('soda') ||
    t.includes('juice') || t.includes('shake') || t.includes('lassi') ||
    t.includes('buttermilk') || t.includes('butter milk') || t.includes('shikanji') ||
    t.includes('slush') || t.includes('mojito') || t.includes('punch') ||
    t.includes('cooler') || t.includes('lagoon') || t.includes('pina colada') ||
    t.includes('cold drink') || t.includes('mineral water') || t.includes('beverage')
  ) {
    return 4; // Beverages & Pantry (ID: 4) -> Beverage Printer
  }

  // 4. Bakery & Desserts
  if (
    t.includes('dessert') || t.includes('ice cream') || t.includes('jamun') ||
    t.includes('browni') || t.includes('rabdi') || t.includes('tukda') ||
    t.includes('halwa') || t.includes('sweet') || t.includes('kheer')
  ) {
    return 6; // Bakery & Desserts (ID: 6) -> Dessert & Bakery Printer
  }

  // 5. Bar & Spirits
  if (
    t.includes('beer') || t.includes('whisky') || t.includes('vodka') ||
    t.includes('rum') || t.includes('wine') || t.includes('cocktail') ||
    t.includes('gin') || t.includes('tequila')
  ) {
    return 26; // Bar & Spirits (ID: 26) -> Bar Printer
  }

  // 6. Default to Main Kitchen (Curries, Dals, Biryani, Rice, Salads, Papads)
  return 1; // Main Kitchen (ID: 1) -> Main Kitchen Printer
}

async function mapItemsToStations() {
  try {
    await sequelize.authenticate();
    const [items] = await sequelize.query(`SELECT item_id, title FROM mpos_item WHERE active = 1;`);
    console.log(`Mapping ${items.length} items to kitchen stations...`);

    for (const item of items) {
      const deptId = resolveStation(item.title);
      await sequelize.query(`UPDATE mpos_item SET kitchen_dept = :deptId WHERE item_id = :itemId;`, {
        replacements: { deptId, itemId: item.item_id }
      });
    }

    const [summary] = await sequelize.query(`
      SELECT k.id as dept_id, k.kitchen_dept_name as station_name, p.title as printer_name, p.device_address as printer_ip, COUNT(i.item_id) as total_items
      FROM mpos_item i
      JOIN mpos_kitchen_department k ON k.id = i.kitchen_dept
      LEFT JOIN mpos_printer p ON p.id = k.printer_id
      WHERE i.active = 1
      GROUP BY k.id, k.kitchen_dept_name, p.title, p.device_address
      ORDER BY total_items DESC;
    `);

    console.log('\n--- COMPLETED MENU ITEM STATION & PRINTER MAPPING ---');
    console.table(summary);

  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

mapItemsToStations();
