const util = require('../util/DBUtil');


function addCreatedTimeColumn(query, type){
    try{
        query.addColumn(util.DBDetails.Tables.MPOS_ORDER, 'actual_created_time', type.TIME, {
            allowNull: true,
            defaultValue: type.NOW
        }); 
    }catch(err){

    }
}
const up =  function (query, type) {
    addCreatedTimeColumn(query, type)
}
const down =  function (query, type) {

}

module.exports = {
    up,
    down
}