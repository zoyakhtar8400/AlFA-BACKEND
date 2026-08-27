const fs = require('fs');
let code = fs.readFileSync('src/com/tmbill/main_controllers/Reports.js', 'utf8');

const replacement = `...(currentStoreId === 'ALL' ? [] : [{
                [connection.Sequelize.Op.or]: [
                  { store_id: currentStoreId },
                  { store_id: 'STORE_1' },
                  { store_id: '1' }
                ]
              }]),`;

code = code.replace(/\{\s*\[connection\.Sequelize\.Op\.or\]:\s*\[\s*\{\s*store_id:\s*currentStoreId\s*\},[^{]*\{\s*store_id:\s*'STORE_1'\s*\},[^{]*\{\s*store_id:\s*'1'\s*\}\s*\]\s*\},/g, replacement);

fs.writeFileSync('src/com/tmbill/main_controllers/Reports.js', code);
console.log('Patched Reports.js');
