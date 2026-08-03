const { ipcMain } = require('electron');
const map = require('lodash/map');
const { debounce } = require('lodash');
const { sequelize, Bill, Sequelize } = require('../js/database');

const { INVENTORY_STATUS } = require('../util/Constants');
const { MISC_IPC, OPEN_CASH_DRAWER } = require('../util/IPC_Messages');
const { reduceInventoryoforder } = require('./Inventory');
const { openCashDrawerFunction } = require('./CashDrawer');

async function makedatabaseuptoDate() {
  const migrationsToreset = [
    // '03_2December2020.js',
    // '04_24May2021.js',
    // '05_14July2021.js',
    // '06_22September2021.js',
    // '07_29September2021.js',
    '08_2December_2021.js',
    '09_24February_2022.js',
    '10_27April_2022.js',
    '11_24September_2022.js',
    '12_30January_2023.js',
    '13_27March_2023.js',
    '14_11April_2023.js',
    '15_18April_2023.js',
    '16_05May_2023.js',
    '17_14October_2023.js',
    '18_30November_2023.js',
    '19_12December_2023.js',
    '20_11January_2024.js',
    '21_08February_2024.js',
    '22_23February_2024.js',
    '23_01April_2024.js',
    '24_04June_2024.js',
    '25_20June_2024.js',
    '26_18July_2024.js',
    '27_29July_2024.js',
    '28_29August_2024.js',
    '29_25September_2024.js',
    '30_02December_2024.js',
    '31_06January_2025.js',
    '32_05March_2025.js',
    '33_23April_2025.js',
    '34_26May_2025.js',
    '35_08July_2025.js',
    '36_01September_2025.js',
    '37_28October_2025.js',
    '38_02December_2025.js',
    '39_25February_2026.js',
    '40_02April_2026.js',
  ];
  const rawName = `'${migrationsToreset.join("','")}'`;
  sequelize.query(`DELETE from SequelizeMeta where name in (${rawName})`);

  // we have done changes in sync api
  // now we are getting orders whose sync status is upto 2 means [0,1,2]
  // so for previous orders set sync_status = 2

  // Create a Date object for now
  const now = new Date();

  // Move to yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  // Set time to 11:59 PM (23:59:00)
  yesterday.setHours(23, 59, 0, 0);

  const timestamp = yesterday.getTime();
  console.log(
    `Updating order sync_status to 2 of order date less than ${timestamp}`,
  ); // Timestamp in ms
  const orders = await Bill.findAll({
    raw: true,
    attributes: ['id'],
    where: {
      // sync_status: {
      //   [Sequelize.Op.lt]: 2, // sync_status != 2
      // },
      sync_status: 1,
      created_time: {
        [Sequelize.Op.lt]: timestamp, // sync_status != 2
      },
    },
  });
  if (orders && orders.length) {
    await Bill.update(
      {
        sync_status: 2,
      },
      {
        where: {
          created_time: {
            [Sequelize.Op.lt]: timestamp, // sync_status != 2
          },
          sync_status: 1,
        },
      },
    );
  }
}

async function autoInventoryreduce() {
  try {
    const inventorytoReduce = await Bill.findAll({
      raw: true,
      attributes: ['order_id'],
      where: {
        inventoryReduced: INVENTORY_STATUS.NOT_REDUCED,
        store_id: global.storeDetails.store_id,
      },
    });

    if (inventorytoReduce && inventorytoReduce.length) {
      const orderIdlist = map(inventorytoReduce, 'order_id');
      reduceInventoryoforder(orderIdlist);
    }
  } catch (error) {
    console.log(error);
  }
}
let syncTimeInterval = 10000;
if (global.syncTimeInterval) {
  syncTimeInterval = Number(global.syncTimeInterval) + 10000;
}
const autoReduceInventoryRequest = debounce(() => {
  autoInventoryreduce();
}, syncTimeInterval);

global.betteripcMain.answerRenderer(
  MISC_IPC.AUTO_REDUCE_INVENTORY,
  async () => {
    autoReduceInventoryRequest();
  },
);

global.betteripcMain.answerRenderer(MISC_IPC.MAKE_DB_UPTO_DATE, async () => {
  makedatabaseuptoDate();
});

ipcMain.on(OPEN_CASH_DRAWER, async () => {
  try {
    openCashDrawerFunction();
  } catch (error) {
    console.log(error);
  }
});

module.exports = {
  autoReduceInventoryRequest,
};
