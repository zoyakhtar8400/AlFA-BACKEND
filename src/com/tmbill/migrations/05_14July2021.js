const util = require('../util/DBUtil');


async function addDummykotnumbertokot(query, type) {
    query.addColumn(util.DBDetails.Tables.MPOS_KOT, 'kot_number', type.INTEGER, {
        defaultValue: 0
    });

}



const up = async function (query, type) {
    addDummykotnumbertokot(query, type);
}
const down = async function (query, type) {

}

module.exports = {
    up,
    down
}
