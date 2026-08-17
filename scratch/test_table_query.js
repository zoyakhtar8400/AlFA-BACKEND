require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function testTableQuery() {
  try {
    const activeKots = await connection.KOT.findAll({
      where: { is_active: 1 },
      raw: true
    });
    console.log('Active KOTs:', activeKots.map(k => ({ kot_id: k.kot_id, table_id: k.table_id, table_name: k.table_name, is_active: k.is_active })));

    const activeKotIds = activeKots.map(k => k.kot_id);
    const allKotItems = await connection.KOTItem.findAll({
      where: { kot_id: activeKotIds },
      raw: true
    });
    console.log('All KOT items count:', allKotItems.length);

    const tables = await connection.Table.findAll({ raw: true });
    tables.forEach(tbl => {
      const cleanTblId = String(tbl.id || '').replace(/[^0-9]/g, '');
      const cleanTblNo = String(tbl.no || tbl.table_no || tbl.table_name || '').replace(/[^0-9]/g, '');
      const tblKots = activeKots.filter(k => {
        const cleanKotTableId = String(k.table_id || '').replace(/[^0-9]/g, '');
        const cleanKotTableName = String(k.table_name || '').replace(/[^0-9]/g, '');
        return (
          (cleanTblId && cleanKotTableId === cleanTblId) ||
          (cleanTblNo && cleanKotTableId === cleanTblNo) ||
          (cleanTblNo && cleanKotTableName === cleanTblNo) ||
          (cleanTblId && cleanKotTableName === cleanTblId)
        );
      });
      if (tblKots.length > 0) {
        console.log(`Matched table ${tbl.id} (${tbl.table_name}) with ${tblKots.length} KOTs!`);
      }
    });
  } catch (err) {
    console.error('Error in testTableQuery:', err);
  } finally {
    process.exit(0);
  }
}

testTableQuery();
