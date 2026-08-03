const util = require('../util/DBUtil');

async function addFieldsInCRM(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'alternate_phone', {
      type: type.STRING,
      allowNull: true,
    });
    query.addColumn(
      util.DBDetails.Tables.MPOS_CUSTOMER,
      'alternate_dial_code',
      {
        type: type.INTEGER,
        allowNull: true,
      },
    );
    query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'salutation', {
      type: type.INTEGER,
      allowNull: true,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'cust_type', {
      type: type.INTEGER,
      allowNull: true,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'comment', {
      type: type.STRING,
      allowNull: true,
    });
  } catch (error) {
    console.error(error);
  }
}

function addSettings(query) {
  const settingsList = [
    { id: 201, name: 'new_setting_107', value: '0' },
    { id: 202, name: 'new_setting_108', value: '0' },
    { id: 203, name: 'new_setting_109', value: '0' },
    { id: 204, name: 'new_setting_110', value: '0' },
    { id: 205, name: 'new_setting_111', value: '0' },
    { id: 206, name: 'new_setting_112', value: '0' },
    { id: 207, name: 'new_setting_113', value: '0' },
    { id: 208, name: 'new_setting_114', value: '0' },
    { id: 209, name: 'new_setting_115', value: '0' },
    { id: 210, name: 'new_setting_116', value: '0' },
    { id: 211, name: 'new_setting_117', value: '0' },
    { id: 212, name: 'new_setting_118', value: '0' },
    { id: 213, name: 'new_setting_119', value: '0' },
    { id: 214, name: 'new_setting_200', value: '0' },
    { id: 215, name: 'new_setting_201', value: '0' },
    { id: 216, name: 'new_setting_202', value: '0' },
    { id: 217, name: 'new_setting_203', value: '0' },
    { id: 218, name: 'new_setting_204', value: '0' },
    { id: 219, name: 'new_setting_205', value: '0' },
    { id: 220, name: 'new_setting_206', value: '0' },
    { id: 221, name: 'new_setting_207', value: '0' },
    { id: 222, name: 'new_setting_208', value: '0' },
    { id: 223, name: 'new_setting_209', value: '0' },
    { id: 224, name: 'new_setting_210', value: '0' },
    { id: 225, name: 'new_setting_211', value: '0' },
    { id: 226, name: 'new_setting_212', value: '0' },
    { id: 227, name: 'new_setting_213', value: '0' },
    { id: 228, name: 'new_setting_214', value: '0' },
    { id: 229, name: 'new_setting_215', value: '0' },
    { id: 230, name: 'new_setting_216', value: '0' },
  ];

  try {
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList);
  } catch (err) {
    console.error(err);
  }
}

async function addStartEndDateInDayAndShift(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_STARTDAY_ENDDAY, 'start_date', {
    type: type.TIME,
    allowNull: true,
  });

  query.addColumn(util.DBDetails.Tables.MPOS_STARTDAY_ENDDAY, 'close_date', {
    type: type.TIME,
    allowNull: true,
  });

  query.addColumn(util.DBDetails.Tables.MPOS_USERSHIFT, 'start_date', {
    type: type.TIME,
    allowNull: true,
  });

  query.addColumn(util.DBDetails.Tables.MPOS_USERSHIFT, 'close_date', {
    type: type.TIME,
    allowNull: true,
  });
}
async function addMenuIdInOrderLevel(query, type) {
  query.addColumn(util.DBDetails.Tables.MPOS_ORDER, 'menu_id', {
    type: type.INTEGER,
    allowNull: true,
  });
}

async function addItemNoteGroupsTable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_ITEM_NOTE_GROUPS,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        item_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        item_note_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        menu_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        short_code: {
          type: type.STRING,
          allowNull: true,
        },
        tag_group_name: {
          type: type.STRING,
          allowNull: true,
        },
        tags_info: {
          type: type.JSON,
          allowNull: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        tmpos_id: {
          type: type.STRING,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_ITEM_NOTE_GROUPS,
      },
    );
  } catch (err) {
    console.error(err);
  }
}
const up = function (query, type) {
  addFieldsInCRM(query, type);
  addSettings(query, type);
  addStartEndDateInDayAndShift(query, type);
  addMenuIdInOrderLevel(query, type);
  addItemNoteGroupsTable(query, type);
};

const down = function (query, type) {};
module.exports = {
  up,
  down,
};
