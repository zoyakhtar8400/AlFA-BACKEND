const util = require('../util/DBUtil');

async function addModifierGroupItemTable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_MODIFIERGROUP_ITEMS_MAPPING,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        tmpos_id: {
          type: type.STRING,
          allowNull: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        menu_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        group_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        item_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        short_code: {
          type: type.STRING,
          allowNull: true,
        },
        item_name: {
          type: type.STRING,
        },
        rank: {
          type: type.INTEGER,
          defaultValue: 1,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_MODIFIERGROUP_ITEMS_MAPPING,
      },
    );
  } catch (err) {
    console.error(err);
  }
}

async function addodifireGroupsTable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_MODIFIER_GROUPS,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        tmpos_id: {
          type: type.STRING,
          allowNull: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        menu_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        title: {
          type: type.STRING,
        },
        subtitle: {
          type: type.STRING,
        },
        description: {
          type: type.STRING,
        },
        min: {
          // Minimum selectable modifers
          type: type.INTEGER,
          defaultValue: 0,
        },
        max: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        type: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        status: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        rank: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        coc: {
          // Indicate if it is customisation of customisation
          type: type.INTEGER,
          defaultValue: 0,
        },
        visible_for_coc: {
          // Indicate if it is customisation of customisation
          type: type.INTEGER,
          defaultValue: 0,
        },
        tags: {
          type: type.STRING,
        },
        extra_details: {
          type: type.JSON,
          allowNull: true,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_MODIFIER_GROUPS,
      },
    );
  } catch (err) {
    console.error(err);
  }
}

async function addModifiersTable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_MODIFIERS,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        unique_id: {
          type: type.STRING,
        },
        tmpos_id: {
          type: type.STRING,
        },
        store_id: {
          type: type.STRING,
        },
        menu_id: {
          type: type.INTEGER,
        },
        group_id: {
          // reference to the modifier grp
          type: type.INTEGER,
        },
        item_id: {
          // reference to the menuchild item
          type: type.INTEGER,
        },
        short_code: {
          type: type.STRING,
        },
        title: {
          type: type.STRING,
        },
        subtitle: {
          type: type.STRING,
        },
        price: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        description: {
          type: type.STRING,
        },
        min: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        max: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        extra: {
          // 0 = Varient and 1 = Addon
          type: type.FLOAT,
          defaultValue: 0,
        },
        free: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        has_variants: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        has_customisation: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        has_nested_mg: {
          // Tell if this modifier has nested modifiers groups
          type: type.INTEGER,
          defaultValue: 0,
        },
        default_selected: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        status: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        rank: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        tags: {
          type: type.STRING,
        },
        assets: {
          type: type.JSON,
          allowNull: true,
        },
        extra_details: {
          type: type.JSON,
          allowNull: true,
        },
        sku: {
          type: type.STRING,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_MODIFIERS,
      },
    );
  } catch (err) {
    console.error(err);
  }
}

async function addModifiersGroupMappingTable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_MODIFIERS_GROUP_MAPPING,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        tmpos_id: {
          type: type.STRING,
          allowNull: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        modifier_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        modifier_group_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_MODIFIERS_GROUP_MAPPING,
      },
    );
  } catch (err) {
    console.error(err);
  }
}

async function addModifiersVarientTable(query, type) {
  try {
    await query.createTable(
      util.DBDetails.Tables.MPOS_MODIFIER_VARIENT,
      {
        id: {
          type: type.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        tmpos_id: {
          type: type.STRING,
          allowNull: true,
        },
        store_id: {
          type: type.STRING,
          allowNull: true,
        },
        modifier_id: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        variant_id: {
          type: type.STRING,
          allowNull: true,
        },
        title: {
          type: type.STRING,
        },
        price: {
          type: type.INTEGER,
          defaultValue: 0,
        },
        item_id: {
          // Use this to refer the menu item for inventory
          type: type.INTEGER,
        },
        short_code: {
          type: type.STRING,
          allowNull: true,
        },
        default_selected: {
          type: type.INTEGER,
          defaultValue: 0,
        },
      },
      {
        timestamps: false,
        tableName: util.DBDetails.Tables.MPOS_MODIFIER_VARIENT,
      },
    );
  } catch (err) {
    console.error(err);
  }
}

async function addModifierValueOnItemLevel(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_ITEM, 'has_modifiers', {
      allowNull: true,
      type: type.INTEGER,
    });
    query.addColumn(util.DBDetails.Tables.MPOS_ITEM, 'is_combo', {
      allowNull: true,
      type: type.INTEGER,
    });
  } catch (error) {
    console.error(error);
  }
}

async function addExtraDetailsOnKotAndOrderOption(query, type) {
  try {
    query.addColumn(
      util.DBDetails.Tables.MPOS_KOTITEM_OPTION_ADDONS,
      'extra_details',
      {
        allowNull: true,
        type: type.JSON,
      },
    );
    query.addColumn(
      util.DBDetails.Tables.MPOS_ORDERCHILD_OPTION_ADDONS,
      'extra_details',
      {
        allowNull: true,
        type: type.JSON,
      },
    );
  } catch (error) {
    console.error(error);
  }
}

async function addNewFieldsInTaxTable(query, type) {
  try {
    query.addColumn(util.DBDetails.Tables.MPOS_TAX, 'cal_method', {
      allowNull: true,
      type: type.INTEGER,
    });

    query.addColumn(util.DBDetails.Tables.MPOS_TAX, 'tax_display_name', {
      allowNull: true,
      type: type.STRING,
    });

    query.addColumn(util.DBDetails.Tables.MPOS_TAX, 'primary', {
      allowNull: true,
      type: type.INTEGER,
    });

    query.addColumn(util.DBDetails.Tables.MPOS_TAX, 'sort', {
      allowNull: true,
      type: type.INTEGER,
    });

    query.addColumn(util.DBDetails.Tables.MPOS_TAX, 'extra_details', {
      allowNull: true,
      type: type.JSON,
    });
  } catch (error) {
    console.error(error);
  }
}

const up = (query, type) => {
  addModifierGroupItemTable(query, type);
  addodifireGroupsTable(query, type);
  addModifiersTable(query, type);
  addModifiersGroupMappingTable(query, type);
  addModifiersVarientTable(query, type);
  addModifierValueOnItemLevel(query, type);
  addExtraDetailsOnKotAndOrderOption(query, type);
  addNewFieldsInTaxTable(query, type);
};
const down = () => {};

module.exports = {
  up,
  down,
};
