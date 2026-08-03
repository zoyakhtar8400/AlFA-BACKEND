const util = require('../util/DBUtil');

async function addnewSettings(query) {
    let settingsList1 = [
        { id: 93, name: 'show-sendpayment-link', value: '0' },
    ];
    let settingsList2 = [
        { id: 94, name: 'show-billprintcount-onreceipt', value: '0' },
    ];
    let settingsList3 = [
        { id: 95, name: 'new_setting_1', value: '0' },
    ];
    let settingsList4 = [
        { id: 96, name: 'new_setting_2', value: '0' },
    ];
    let settingsList5 = [
        { id: 97, name: 'new_setting_3', value: '0' },
    ];
    let settingsList6 = [
        { id: 98, name: 'new_setting_4', value: '0' },
    ];
    let settingsList7 = [
        { id: 99, name: 'new_setting_5', value: '1' },
    ];
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList1);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList2);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList3);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList4);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList5);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList6);
    query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList7);

}

async function addOrderlevelfields(query, type) {
    query.addColumn(util.DBDetails.Tables.MPOS_ORDER, 'item_level_total_charges', type.DECIMAL(10, 2), {
        defaultValue: 0
    });
}

async function addStorelevelfields(query, type) {
    query.addColumn(util.DBDetails.Tables.MPOS_STORE, 'show_phone_on_bill', type.STRING, {
        defaultValue: null
    });
    query.addColumn(util.DBDetails.Tables.MPOS_STORE, 'field5', type.STRING, {
        defaultValue: null
    });
    query.addColumn(util.DBDetails.Tables.MPOS_STORE, 'field6', type.STRING, {
        defaultValue: null
    });


}

async function addStorelogo(query, type) {
    query.addColumn(util.DBDetails.Tables.MPOS_STORE, 'logo', type.STRING, {
        defaultValue: null
    });

}


const up = async function (query, type) {
    addnewSettings(query);
    addOrderlevelfields(query, type);
    addStorelevelfields(query, type);
    addStorelogo(query, type);
}
const down = async function (query, type) {

}

module.exports = {
    up,
    down
}
