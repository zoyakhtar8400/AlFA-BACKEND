const util = require('../util/DBUtil');

function addSettings(query) {
    let settingsList1 = [
        { id: 116, name: 'new_setting_22', value: '0' },
    ];
    let settingsList2 = [
        { id: 117, name: 'new_setting_23', value: '1' },
    ];
    let settingsList3 = [
        { id: 118, name: 'new_setting_24', value: '0' },
    ];
    let settingsList4 = [
        { id: 119, name: 'new_setting_25', value: '0' },
    ];
    let settingsList5 = [
        { id: 120, name: 'new_setting_26', value: '0' },
    ];
    let settingsList6 = [
        { id: 121, name: 'new_setting_27', value: '0' },
    ];
    let settingsList7 = [
        { id: 122, name: 'new_setting_28', value: '0' },
    ];
    let settingsList8 = [
        { id: 123, name: 'new_setting_29', value: '1' },
    ];
    let settingsList9 = [
        { id: 124, name: 'new_setting_30', value: '0' },
    ];
    let settingsList10 = [
        { id: 125, name: 'new_setting_31', value: '{"dinein":true,"takeaway":true,"quick":true}' },
    ];

    try {
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList1);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList2);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList3);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList4);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList5);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList6);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList7);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList8);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList9);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList10);

    } catch (err) {
    }

}


// add intime and outtime in order table
function addIntimeOuttimeColumn(query, type) {
    try {
        query.addColumn(util.DBDetails.Tables.MPOS_ORDER, 'intime', type.TIME, {
            allowNull: true
        });
        query.addColumn(util.DBDetails.Tables.MPOS_ORDER, 'outtime', type.TIME, {
            allowNull: true
        });
    } catch (err) {

    }

}

function addStoreLevelValue(query, type) {
    try {
        query.addColumn(util.DBDetails.Tables.MPOS_STORE, 'is_bar_section_billing', type.INTEGER, {
            allowNull: true,
            default: 0
        });

        query.addColumn(util.DBDetails.Tables.MPOS_STORE, 'pdam_start_time', type.INTEGER, {
            allowNull: true,
            default: 0
        });

        query.addColumn(util.DBDetails.Tables.MPOS_STORE, 'pdam_end_time', type.INTEGER, {
            allowNull: true,
            default: 0
        });

        query.addColumn(util.DBDetails.Tables.MPOS_STORE, 'tenant_id', type.STRING, {
            allowNull: true,
        });
    } catch (err) {

    }

}

function addCashDiffInCloseShift(query, type) {
    try {
        query.addColumn(util.DBDetails.Tables.MPOS_USERSHIFT, 'cash_diff', type.INTEGER, {
            defaultValue: 0,
            allowNull: true
        });
        query.addColumn(util.DBDetails.Tables.MPOS_USERSHIFT, 'close_shift_amount', type.INTEGER, {
            defaultValue: 0,
            allowNull: true
        });
    } catch (error) {

    }
}

function addCraetedDateInCustomer(query, type) {
    try {
        query.addColumn(util.DBDetails.Tables.MPOS_CUSTOMER, 'createdDate', type.DATE, {
            allowNull: true
        });
    } catch (error) {

    }
}

function addnewSettings(query) {
    let settingsList1 = [
        { id: 126, name: 'new_setting_32', value: '{"dinein":true,"takeaway":true,"quick":true}' },
    ];
    let settingsList2 = [
        { id: 127, name: 'new_setting_33', value: '{"dinein":true,"takeaway":true,"quick":true}' },
    ];
    let settingsList3 = [
        { id: 128, name: 'new_setting_34', value: '0' },
    ];
    let settingsList4 = [
        { id: 129, name: 'new_setting_35', value: '{"dinein":"KOT No","takeaway":"KOT No","delivery":"KOT No"}' },
    ];
    let settingsList5 = [
        { id: 130, name: 'new_setting_36', value: '0' },
    ];
    let settingsList6 = [
        { id: 131, name: 'new_setting_37', value: '1' },
    ];
    let settingsList7 = [
        { id: 132, name: 'new_setting_38', value: '0' },
    ];
    let settingsList8 = [
        { id: 133, name: 'new_setting_39', value: '0' },
    ];
    let settingsList9 = [
        { id: 134, name: 'new_setting_40', value: '0' },
    ];
    let settingsList10 = [
        { id: 135, name: 'new_setting_41', value: '0' },
    ];
    let settingsList11 = [
        { id: 136, name: 'new_setting_42', value: '0' },
    ];
    let settingsList12 = [
        { id: 137, name: 'new_setting_43', value: '0' },
    ];
    let settingsList13 = [
        { id: 138, name: 'new_setting_44', value: '0' },
    ];
    let settingsList14 = [
        { id: 139, name: 'new_setting_45', value: '0' },
    ];
    let settingsList15 = [
        { id: 140, name: 'new_setting_46', value: '0' },
    ];

    // Posytude Customer Display Settings
    //{"path":"COM2","baudRate":2400,"dataBits":8,"parity":"mark","stopBits":1}
    // let settingsList11 = [
    //     { id: 136, name: 'new_setting_32', value: '0' },
    // ];

    try {
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList1);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList2);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList3);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList4);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList5);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList6);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList7);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList8);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList9);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList10);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList11);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList12);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList13);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList14);
        query.bulkInsert(util.DBDetails.Tables.MPOS_SETTINGS, settingsList15);

    } catch (err) {
    }

}

const up = function (query, type) {
    addSettings(query, type);
    addIntimeOuttimeColumn(query, type);
    addStoreLevelValue(query, type);
    addCashDiffInCloseShift(query, type);
    addCraetedDateInCustomer(query, type);
    addnewSettings(query, type);
}
const down = function (query, type) {

}

module.exports = {
    up,
    down
}
