const { safeParse } = require('../../util/RendererUtils');
const { MASTER_POS_ENDPOINTS } = require('../config');
const { localapiCall } = require('../services/APIService');

async function makeDeleteTableRequest(deleteTableData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.TABLE.DELETE_TABLE,
      deleteTableData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while delete table" `, error);
  }
  return undefined;
}

async function makeFetchTableDataRequest(fetchTableData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.TABLE.FETCH_BILL_TABLE_DATA,
      fetchTableData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while fetch bill table data" `, error);
  }
  return undefined;
}

async function makeFetchTableItemDataRequest(fetchTableData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.TABLE.GET_TABLE_ITEMS_RUNNING,
      fetchTableData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while fetch bill item data" `, error);
  }
  return undefined;
}

async function makeSplitTableRequest(splitTableData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.TABLE.SPLIT_TABLE,
      splitTableData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while split table" `, error);
  }
  return undefined;
}

async function makeMergeTableRequest(mergeTableData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.TABLE.MERGE_TABLE,
      mergeTableData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while merge table" `, error);
  }
  return undefined;
}

async function makeGetBusyTablesRequest(tableData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.TABLE.GET_BUSY_TABLES,
      tableData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while fetching busy tables" `, error);
  }
  return undefined;
}

async function makeGetBusyTablesWithoutDetailsRequest() {
  try {
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.TABLE.GET_BUSY_TABLES_WITHOUT_DETAILS,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while fetching busy tables" `, error);
  }
  return undefined;
}

async function makeUpdateTableStateRequest(stateData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.TABLE.UPDATE_TABLE_STATE,
      stateData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while update table state" `, error);
  }
  return undefined;
}

async function makeUpdateTableStatusRequest(stateData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.TABLE.UPDATE_STATUS,
      stateData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while update table status" `, error);
  }
  return undefined;
}

async function makeUpdateTableColorRequest(colorData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.TABLE.UPDATE_TABLE_COLOR,
      colorData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while update table color" `, error);
  }
  return undefined;
}

async function makeChangeTableColorRequest(colorData) {
  try {
    const { data } = await localapiCall.post(
      MASTER_POS_ENDPOINTS.TABLE.CHANGE_COLOR,
      colorData,
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while change table color" `, error);
  }
  return undefined;
}

function addTerminalfilters(params) {
  if (
    !window.__IS_MASTER_POS__ &&
    window.storeDetails &&
    window.storeDetails.access_levels
  ) {
    const accessLevel = safeParse(window.storeDetails.access_levels);
    let includeDepartments = [];
    if (accessLevel?.order_window?.table_departments) {
      includeDepartments = accessLevel?.order_window?.table_departments || [];
    }

    let includeCategories = [];
    if (accessLevel?.order_window?.item_categories) {
      includeCategories = accessLevel?.order_window?.item_categories || [];
    }

    Object.assign(params, {
      includeDepartments: includeDepartments.toString(),
      includeCategories: includeCategories.toString(),
    });
  }
}
function addTableDeptfilters(params) {
  if (window.storeDetails && window.storeDetails.access_levels) {
    const accessLevel = safeParse(window.storeDetails.access_levels);
    let includeDepartments = [];
    if (accessLevel?.order_window?.table_departments) {
      includeDepartments = accessLevel?.order_window?.table_departments || [];
    }

    Object.assign(params, {
      includeDepartments: includeDepartments.toString(),
    });
  }
}
async function makeGetTablesRequest(params) {
  try {
    addTableDeptfilters(params);
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.TABLE.GET_TABLES,
      { params },
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while change table color" `, error);
  }
  return undefined;
}

async function makeGetTablesDeptRequest(params) {
  try {
    addTableDeptfilters(params);
    const { data } = await localapiCall.get(
      MASTER_POS_ENDPOINTS.TABLE.GET_TABLE_DEPARTMENTS,
      { params },
    );
    return data;
  } catch (error) {
    console.error(`Message="Error while change table color" `, error);
  }
  return undefined;
}

module.exports = {
  makeGetTablesRequest,
  makeUpdateTableStatusRequest,
  makeUpdateTableColorRequest,
  makeUpdateTableStateRequest,
  makeGetBusyTablesRequest,
  makeDeleteTableRequest,
  makeFetchTableDataRequest,
  makeSplitTableRequest,
  makeMergeTableRequest,
  makeChangeTableColorRequest,
  makeGetBusyTablesWithoutDetailsRequest,
  makeFetchTableItemDataRequest,
  makeGetTablesDeptRequest,
};
