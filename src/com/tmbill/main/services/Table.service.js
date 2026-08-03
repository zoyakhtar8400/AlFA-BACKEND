/* eslint-disable no-console */

const { where } = require('sequelize');
const { Table, KOT } = require('../../js/database');
const {
  getrunningorderDetails,
  changeTableColor,
  getTables,
  getRunningtableKotItems,
  getTablesDepartment,
} = require('../../main_controllers/Order');
const { sendLivesyncrequest } = require('../../services/SyncService');

async function requestDeletetable(data) {
  const responseData = {};
  try {
    if (data && data.table_id) {
      try {
        await Table.destroy({
          where: { id: data.table_id },
        });
        responseData.status = 'success';
        responseData.table_id = data.table_id;
      } catch (error) {
        responseData.status = 'failure';
      }
      return responseData;
    }
    console.warn(
      `Message="Invalid Delete Table Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While Delete Table Payload"`, error);
  }
  return responseData;
}

async function requestFetchtablebilldata(data) {
  try {
    if (data && data.table_id) {
      const responseData = await getrunningorderDetails(data);
      return responseData;
    }
    console.warn(
      `Message="Invalid Fetch Table Bill Data Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While Fetch Table Bill Data"`, error);
  }
  return undefined;
}

async function requestrunnigKotItems(data) {
  try {
    if (data && data.table_id) {
      const responseData = await getRunningtableKotItems(data);
      return responseData;
    }
    console.warn(
      `Message="Invalid Fetch KOT item Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While Fetch KOT item Data"`, error);
  }
  return undefined;
}

async function requestSplittable(data) {
  try {
    if (data && data.tableDetails) {
      const tableDetails = await Table.create(data.tableDetails);
      tableDetails.setDataValue(
        'mpos_department.department_name',
        data.tableDetails['mpos_department.department_name'],
      );

      tableDetails.setDataValue(
        'mpos_department.product_groups',
        data.tableDetails['mpos_department.product_groups'],
      );

      tableDetails.setDataValue(
        'mpos_department.section',
        data.tableDetails['mpos_department.section'],
      );

      tableDetails.setDataValue(
        'mpos_department.id',
        data.tableDetails['mpos_department.id'],
      );

      return {
        tableDetails: tableDetails.get({ plain: true }),
        // tableDetails: data.tableDetails,
      };
    }
    console.warn(
      `Message="Invalid Split Table Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While Splitting Table"`, error);
  }
  return undefined;
}

async function requestMergetable(data) {
  try {
    if (data && data.parentTable && data.currentTable) {
      await KOT.update(
        {
          table_id: data.parentTable,
          table_name: data.parentTablename || '',
          sync_status: 0,
        },
        {
          where: {
            table_id: data.currentTable,
            is_active: 1,
          },
        },
      );

      await Table.update(
        {
          table_action_flag: data.table_action_flag,
          table_color: data.table_color,
        },
        {
          where: {
            id: data.parentTable,
          },
        },
      );

      await Table.destroy({
        where: { id: data.currentTable },
      });

      sendLivesyncrequest();
      return {
        message: 'success',
        table_id: data.currentTable,
        tableName: data.tableName,
      };
    }
    console.warn(
      `Message="Invalid Merge Table Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While Merging Table"`, error);
  }
  return undefined;
}

async function requestGetBusyTablestable(data) {
  try {
    if (data && data.store_id) {
      const response = await KOT.getBusytableswithdetails(data);
      return response;
    }
    console.warn(
      `Message="Invalid Get Busy Table Bill Data Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While Get Busy Table Data"`, error);
  }
  return undefined;
}

async function requestGetBusyTablesWithoutDetailstable() {
  try {
    const response = await KOT.getBusytables();
    return response;
  } catch (error) {
    console.error(
      `Message="Error While Get Busy Table without details Data"`,
      error,
    );
  }
  return undefined;
}

async function requestUpdateTableState(data) {
  try {
    if (data && data.order_state) {
      await Table.updateorderState(data.order_state, data.id);
    }
    console.warn(
      `Message="Invalid update table state Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While updating table state"`, error);
  }
  return undefined;
}

async function requestUpdateTableColor(details) {
  try {
    if (details && details.table_color) {
      if (details && details.table_id) {
        await Table.update(
          {
            table_color: details.table_color,
            table_action_flag: details.table_action_flag,
          },
          {
            where: {
              id: details.table_id,
            },
          },
        );
        await KOT.increment(['draftprint_status'], {
          by: 1,
          where: {
            table_id: details.table_id,
            is_active: 1,
          },
        });
        return 'success';
      }
    }
    console.warn(
      `Message="Invalid update table color Payload" Payload="${JSON.stringify(details)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While updating table color"`, error);
  }
  return undefined;
}

async function requestUpdateTableStatus(data) {
  try {
    if (data && data.order_state) {
      await Table.updateorderState(data.order_state, data.id);
    }
    console.warn(
      `Message="Invalid update table status Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While updating table staus"`, error);
  }
  return undefined;
}

async function requestChangetablecolor(data) {
  try {
    if (data) {
      const result = await changeTableColor(data);
      return result;
    }
    console.warn(
      `Message="Invalid Change Table Color Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While Changing Table Color "`, error);
  }
  return undefined;
}

async function requestGettables(data) {
  try {
    if (data && data.store_id) {
      const tables = await getTables(data.store_id, data);
      return tables;
    }
    console.warn(
      `Message="Invalid Get Tables Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While Getting Tables "`, error);
  }
  return undefined;
}

async function requestGettablesDepartment(data) {
  try {
    if (data && data.store_id) {
      const tables = await getTablesDepartment(data.store_id, data);
      return tables;
    }
    console.warn(
      `Message="Invalid Get Tables Departments Payload" Payload="${JSON.stringify(data)}"`,
    );
  } catch (error) {
    console.error(`Message="Error While Getting Tables Departments"`, error);
  }
  return undefined;
}

module.exports = {
  requestDeletetable,
  requestFetchtablebilldata,
  requestSplittable,
  requestMergetable,
  requestGetBusyTablestable,
  requestUpdateTableState,
  requestUpdateTableColor,
  requestUpdateTableStatus,
  requestChangetablecolor,
  requestGettables,
  requestGetBusyTablesWithoutDetailstable,
  requestrunnigKotItems,
  requestGettablesDepartment,
};
