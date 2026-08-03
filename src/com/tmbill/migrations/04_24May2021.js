const util = require('../util/DBUtil');

async function addopenitemandhsnChanges(query, type) {
    query.addColumn(util.DBDetails.Tables.MPOS_ITEM, 'hsn_code', type.STRING, {
        defaultValue: null
    });
    query.addColumn(util.DBDetails.Tables.MPOS_ITEM, 'is_open_item', type.INTEGER, {
        defaultValue: 0
    });

    query.addColumn(util.DBDetails.Tables.MPOS_KOT_ITEM, 'hsn_code', type.STRING, {
        defaultValue: null
    });
    query.addColumn(util.DBDetails.Tables.MPOS_KOT_ITEM, 'is_open_item', type.INTEGER, {
        defaultValue: 0
    });

    query.addColumn(util.DBDetails.Tables.MPOS_ORDER_CHILD, 'hsn_code', type.STRING, {
        defaultValue: null
    });
    query.addColumn(util.DBDetails.Tables.MPOS_ORDER_CHILD, 'is_open_item', type.INTEGER, {
        defaultValue: 0
    });



}

async function addnewSettings(query) {

    let settingsList1 = [
        { id: 87, name: 'show-itemhsn-on-bill', value: '0' },
    ];
    let settingsList2 = [
        { id: 88, name: 'default-openitem-name', value: '' }
    ];
    let settingsList3 = [
        { id: 89, name: 'allow-preorder-intahd', value: '0' },
    ];
    let settingsList4 = [
        { id: 90, name: 'show-preorder-date-filter', value: '0' }
    ];
    let settingsList5 = [
        { id: 91, name: 'show-custom-bill-number', value: '0' },
    ];
    let settingsList6 = [
        { id: 92, name: 'show-captain-on-bill', value: '0' }
    ];

    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList1);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList2);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList3);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList4);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList5);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList6);

}

async function addnewShortcut(query) {
    let isDarwin = global.currentPlatform === 'darwin';
    let shortcuts = [
        { id: 34, name: 'Open Pre-Order Form', value: isDarwin ? 'command+1' : 'ctrl+1', value: isDarwin ? 'command+1' : 'ctrl+1', window: 'order' },
    ];
    query.bulkInsert(util.DBDetails.Tables.MPOS_SHORTCUTS, shortcuts);
}
/**
 * Add Buy x Get y changes
 * @param {Sequelize Query interface } query 
 * @param {Sequelize type} type 
 */
async function newDiscountchanges(query, type) {
    query.addColumn(util.DBDetails.Tables.MPOS_KOT_ITEM, 'discount_name', type.STRING, {
        defaultValue: null, allowNull: true
    });
    query.addColumn(util.DBDetails.Tables.MPOS_ITEM, 'discounted_items', type.JSON, {
        defaultValue: null, allowNull: true
    });
    query.addColumn(util.DBDetails.Tables.MPOS_KOT_ITEM, 'discounted_items', type.JSON, {
        defaultValue: null, allowNull: true
    });
    // await query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMIZED_DISCOUNT, 'applicable_on_items', type.STRING, {
    //     defaultValue: null, allowNull: true
    // });
    // await query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMIZED_DISCOUNT, 'discounted_items', type.JSON, {
    //     defaultValue: null, allowNull: true
    // });


}

async function preorderChanges(query, type) {
    try {
        query.createTable(util.DBDetails.Tables.MPOS_PRE_ORDER,
            {
                id: {
                    type: type.INTEGER,
                    primaryKey: true,
                    autoIncrement: true
                },
                placed_at: {
                    type: type.TIME,
                    allowNull: true,
                    defaultValue: type.NOW
                },
                delivery_at: {
                    type: type.TIME,
                    allowNull: true,
                    defaultValue: type.NOW
                },
                order_id: {
                    type: type.STRING(20),
                    allowNull: true
                },
                table_id: {
                    type: type.INTEGER,
                    defaultValue: 0
                },
                notification_time: {
                    type: type.TIME,
                    allowNull: true
                },
                instructions: {
                    type: type.STRING,
                    allowNull: true
                },
                customer_name: {
                    type: type.STRING(90),
                    allowNull: true
                },
                customer_mobile: {
                    type: type.STRING(15),
                    allowNull: true
                },
                customer_address: {
                    type: type.STRING,
                    allowNull: true
                },
                payment_instruction: {
                    type: type.STRING(90),
                    allowNull: true
                },
                store_id: {
                    type: type.STRING(50),
                    allowNull: true
                },
                media: {
                    type: type.STRING,
                    allowNull: true
                },
                status: {
                    type: type.STRING(50),
                    allowNull: true,
                    defaultValue: 'created'
                }
            },
            {
                timestamps: false,
                tableName: util.DBDetails.Tables.MPOS_PRE_ORDER
            });

        // 0=No, 1=Yes
        query.addColumn(util.DBDetails.Tables.MPOS_TABLE, 'is_pre_order', type.INTEGER, {
            defaultValue: 0
        });
        query.addColumn(util.DBDetails.Tables.MPOS_KOT, 'is_pre_order', type.INTEGER, {
            defaultValue: 0
        });
        query.addColumn(util.DBDetails.Tables.MPOS_ORDER, 'is_pre_order', type.INTEGER, {
            defaultValue: 0
        });

    } catch (error) {

    }
}

async function billnoFormatchanges(query, type) {
    query.addColumn(util.DBDetails.Tables.MPOS_STORE, 'bill_number_prefix', type.STRING, {
        defaultValue: null, allowNull: true
    });
    query.addColumn(util.DBDetails.Tables.MPOS_ORDER, 'custom_bill_number', type.STRING, {
        defaultValue: null, allowNull: true
    });
    query.addColumn(util.DBDetails.Tables.MPOS_KOT, 'custom_bill_number', type.STRING, {
        defaultValue: null, allowNull: true
    });

}

async function sectionwiseTaxchanges(query, type) {
    query.addColumn(util.DBDetails.Tables.MPOS_ORDER, 'extra_details', type.JSON, {
        defaultValue: null, allowNull: true
    });

}

const up = async function (query, type) {
    addopenitemandhsnChanges(query, type);
    addnewSettings(query);
    newDiscountchanges(query, type);
    preorderChanges(query, type);
    // addnewShortcut(query, type);
    billnoFormatchanges(query, type);
    sectionwiseTaxchanges(query, type);
}
const down = async function (query, type) {

}

module.exports = {
    up,
    down
}
