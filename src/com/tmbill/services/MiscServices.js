/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
const os = require('os');
const { machineId } = require('node-machine-id');
const {
  KOT,
  KOTCharges,
  PreOrder,
  Bill,
  Table,
  Sequelize,
  KOTItemcharges,
  User,
} = require('../js/database');
const { safeParseformain } = require('../main_controllers/Utils');
const {
  HOMED_FLAG_ID,
  TAKEAWAY_FLAG_ID,
  VIRTUALTABLE_FLAG_ID,
} = require('../util/Constants');
const { Op } = require('sequelize');
const { app } = require('electron');
let MACHINE_ID;

async function getMachineId() {
  MACHINE_ID = await machineId();
}

getMachineId();
function getHeadersformpos() {
  if (global.storeDetails) {
    return {
      'x-user': global.storeDetails.username,
      'x-tmbill-key': global.storeDetails.token || '',
      Authorization: `Bearer ${global.storeDetails.token}`,
      'x-tmbill-source': 'atlantic_pos',
      'x-tmbill-storeid': global.storeDetails.store_id,
      machine_id: MACHINE_ID,
      'X-Machine-Id': String(MACHINE_ID),
      'X-Store-Id': String(global.storeDetails.store_id),
      'X-Terminal-Type': global.__IS_MASTER_POS__ ? 'POS' : 'Terminal',
      'X-App-Version': app.getVersion(),
      'X-Platform': os.platform(),
      'X-OS-Version': os.release(),
      'X-Electron-Version': process.versions.electron,
      // 'X-Local-IP': localIp,
      // 'X-Global-IP': globalIp || '',
    };
  }
  return {};
}

async function getActivetablelist(store_id, transaction) {
  let activeTableslist = await KOT.findAll({
    raw: true,
    attributes: ['table_id'],
    where: {
      is_active: 1,
      store_id,
    },
    transaction,
  });

  const activeSplittedTableslist = await Table.findAll({
    raw: true,
    attributes: [['id', 'table_id']],
    where: {
      parent: {
        [Op.ne]: 0,
      },
      store_id,
    },
    transaction,
  });

  const splittedIds = new Set(activeSplittedTableslist.map((t) => t.table_id));

  for (let i = activeTableslist.length - 1; i >= 0; i--) {
    if (splittedIds.has(activeTableslist[i].table_id)) {
      activeTableslist.splice(i, 1);
    }
  }

  const reservedTableslist = await Table.findAll({
    raw: true,
    attributes: [['id', 'table_id']],
    where: {
      reservation_id: {
        [Sequelize.Op.ne]: null,
      },
      store_id,
    },
    transaction,
  });

  // const uniqueObjects = activeTableslist;
  const uniqueObjects = activeTableslist?.filter(
    (item, index, self) =>
      self.findIndex((obj) => obj.table_id === item.table_id) === index,
  );

  if (reservedTableslist) {
    activeTableslist = [...uniqueObjects, ...reservedTableslist];
  }
  return activeTableslist;
}

async function getActivetableWithSplitTableslist(store_id, transaction) {
  let activeTableslist = await KOT.findAll({
    raw: true,
    attributes: ['table_id'],
    where: {
      is_active: 1,
      store_id,
    },
    transaction,
  });

  const reservedTableslist = await Table.findAll({
    raw: true,
    attributes: [['id', 'table_id']],
    where: {
      reservation_id: {
        [Sequelize.Op.ne]: null,
      },
      store_id,
    },
    transaction,
  });

  // const uniqueObjects = activeTableslist;
  const uniqueObjects = activeTableslist?.filter(
    (item, index, self) =>
      self.findIndex((obj) => obj.table_id === item.table_id) === index,
  );

  if (reservedTableslist) {
    activeTableslist = [...uniqueObjects, ...reservedTableslist];
  }
  return activeTableslist;
}
async function updateTablerefids(
  newtable_id,
  oldtable_id,
  isLoadMenuResolved,
  transaction,
) {
  try {
    await KOT.update(
      {
        table_id: newtable_id,
        sync_status: 0,
      },
      {
        where: {
          is_active: 1,
          table_id: oldtable_id,
          store_id: global.storeDetails.store_id,
        },
        transaction,
      },
    );
    await KOTCharges.update(
      {
        table_id: newtable_id,
      },
      {
        where: {
          table_id: oldtable_id,
          store_id: global.storeDetails.store_id,
        },
        transaction,
      },
    );
    await KOTItemcharges.update(
      {
        table_id: newtable_id,
      },
      {
        where: {
          table_id: oldtable_id,
          store_id: global.storeDetails.store_id,
        },
        transaction,
      },
    );
    await Bill.update(
      {
        table_id: newtable_id,
        sync_status: 0,
      },
      {
        where: {
          table_id: oldtable_id,
          // sync_status: 0,
          store_id: global.storeDetails.store_id,
          order_state: 'pending',
        },
        transaction,
      },
    );
    await PreOrder.update(
      {
        table_id: newtable_id,
      },
      {
        where: {
          table_id: oldtable_id,
          store_id: global.storeDetails.store_id,
          status: 'created',
        },
        transaction,
      },
    );

    // if (isLoadMenuResolved) {
    //   await Table.update(
    //     {
    //       is_old_table: 0,
    //       id: newtable_id,
    //     },
    //     {
    //       where: {
    //         id: oldtable_id,
    //       },
    //     },
    //   );
    // }
  } catch (error) {
    console.error(error);
  }
}

/**
 * Deletes the old temporary table and replaces it with new
 * @param {New Table ID} newTableid
 * @param {Old Table ID} oldtableId
 * @param {*} transaction
 */
async function deleteOldandinsertnewtable(newTableid, oldtableId, transaction) {
  try {
    const tableDetails = await Table.findOne({
      raw: true,
      where: {
        id: oldtableId,
        store_id: global.storeDetails.store_id,
        parent: 0,
      },
      transaction,
    });
    await Table.destroy({
      where: {
        id: oldtableId,
        parent: 0,
      },
      transaction,
    });
    if (tableDetails) {
      Object.assign(tableDetails, {
        id: newTableid,
        extra_details: safeParseformain(tableDetails.extra_details),
      });

      await Table.create(tableDetails, { transaction });
    }
  } catch (error) {
    console.error(error);
  }
}

/**
 * This will create a new temporary tables which are currently running
 * @param {*} transaction
 * @returns
 */
async function resolvesyncmenuConflict(transaction) {
  const activeTableslist = await getActivetablelist(
    global.storeDetails.store_id,
    transaction,
  );
  if (
    activeTableslist &&
    Array.isArray(activeTableslist) &&
    activeTableslist.length
  ) {
    // eslint-disable-next-line no-restricted-syntax
    for (const element of activeTableslist) {
      // const newtable_id = Date.now();
      const newtable_id = Number(global.generateNumId(10));

      // Mark table as virtual so table will be deleted on settle
      try {
        await updateTablerefids(
          newtable_id,
          element.table_id,
          false,
          transaction,
        );
        await Table.update(
          {
            is_old_table: element.table_id,
          },
          {
            where: {
              id: element.table_id,
              store_id: global.storeDetails.store_id,
              parent: 0,
            },
            transaction,
          },
        );
        await deleteOldandinsertnewtable(
          newtable_id,
          element.table_id,
          transaction,
        );
        // await sequelize.query(`UPDATE mpos_table set id=${newtable_id} WHERE id=${element.table_id}
        // AND store_id=${global.storeDetails.store_id}`);
      } catch (error) {
        console.log(error);
      }
    }
  }
}

async function resolveloadmenuTables(transaction) {
  try {
    const activeTableslist = await Table.findAll({
      raw: true,
      where: {
        is_old_table: {
          [Sequelize.Op.ne]: 0,
        },
        store_id: global.storeDetails.store_id,
        parent: 0,
      },
      transaction,
    });

    if (
      activeTableslist &&
      Array.isArray(activeTableslist) &&
      activeTableslist.length
    ) {
      // eslint-disable-next-line no-restricted-syntax
      for (const element of activeTableslist) {
        // if (![TAKEAWAY_FLAG_ID, HOMED_FLAG_ID, VIRTUALTABLE_FLAG_ID].includes(element.order_type_flag) && element.parent == 0) {
        if (element.parent === 0) {
          await updateTablerefids(
            element.is_old_table,
            element.id,
            true,
            transaction,
          );
          if (
            ![TAKEAWAY_FLAG_ID, HOMED_FLAG_ID, VIRTUALTABLE_FLAG_ID].includes(
              element.order_type_flag,
            )
          ) {
            await Table.destroy({
              where: { id: element.id },
              transaction,
            });
            await Table.update(
              {
                table_color: element.table_color,
                table_action_flag: element.table_action_flag,
                order_state: element.order_state,
                is_pre_order: element.is_pre_order,
                is_old_table: 0,
                reservation_id: element.reservation_id,
              },
              {
                where: {
                  id: element.is_old_table,
                },
                transaction,
              },
            );
          } else {
            await Table.update(
              {
                table_color: element.table_color,
                table_action_flag: element.table_action_flag,
                order_state: element.order_state,
                is_pre_order: element.is_pre_order,
                is_old_table: 0,
                id: element.is_old_table,
                reservation_id: element.reservation_id,
              },
              {
                where: {
                  is_old_table: element.is_old_table,
                },
                transaction,
              },
            );
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}

async function resolvesyncmenuUserConflict(storeID, transaction) {
  const userHavingKDAssignlist = await User.findAll({
    raw: true,
    where: {
      store_id: storeID,
      [Sequelize.Op.and]: [
        { assignedKitchedeps: { [Sequelize.Op.ne]: null } },
        { assignedKitchedeps: { [Sequelize.Op.ne]: 0 } },
      ],
    },
    transaction,
  });
  if (
    userHavingKDAssignlist &&
    Array.isArray(userHavingKDAssignlist) &&
    userHavingKDAssignlist.length
  ) {
    // eslint-disable-next-line no-restricted-syntax
    for (const element of userHavingKDAssignlist) {
      try {
        const newusername = Date.now();
        await User.update(
          {
            is_old_user: element.username,
            username: newusername,
            id: newusername,
          },
          {
            where: {
              username: element.username,
              store_id: global.storeDetails.store_id,
            },
            transaction,
          },
        );
      } catch (error) {
        console.log(error);
      }
    }
  }
}

async function resloveLoadUser(storeID, transaction) {
  const userHavingKDAssignlist = await User.findAll({
    raw: true,
    where: {
      store_id: storeID,
      [Sequelize.Op.and]: [
        { assignedKitchedeps: { [Sequelize.Op.ne]: null } },
        { assignedKitchedeps: { [Sequelize.Op.ne]: 0 } },
      ],
    },
    transaction,
  });

  if (
    userHavingKDAssignlist &&
    Array.isArray(userHavingKDAssignlist) &&
    userHavingKDAssignlist.length
  ) {
    // eslint-disable-next-line no-restricted-syntax
    for (const element of userHavingKDAssignlist) {
      await User.destroy({
        where: {
          store_id: storeID,
          is_old_user: element.is_old_user,
        },
        transaction,
      });
      await User.update(
        {
          assignedKitchedeps: element.assignedKitchedeps,
        },
        {
          where: {
            username: element.is_old_user,
          },
          transaction,
        },
      );
    }
  }
}

function encodebase64(value) {
  return Buffer.from(value || '').toString('base64');
}
function decodebase64(value) {
  return Buffer.from(value || '', 'base64').toString('ascii');
}

module.exports = {
  getHeadersformpos,
  resolvesyncmenuConflict,
  getActivetablelist,
  resolveloadmenuTables,
  encodebase64,
  decodebase64,
  resloveLoadUser,
  resolvesyncmenuUserConflict,
  getActivetableWithSplitTableslist,
};
