const express = require('express');
const ResponseMessage = require('../error/ResponseMessage').ResponseMessage;
const router = express.Router();


/**
 * Returns table
 * @param {Parameters} params 
 */
async function getDepartments(params) {
    let departments = [];
    try {

        const whereData = params.store_id ? { store_id: params.store_id } : {};
        departments = await serverdbConnection.Department.findAll({
            raw: true,
            where: whereData
        });

    } catch (error) {
        departments = [];
    }
    return departments;
}



router.get('/', async (req, res) => {
    let response = new ResponseMessage(200, "");
    let departments = await getDepartments(req.query);
    response.departments = departments;
    response.data = departments;
    response.setStatus(200);
    res.json(response);

});

module.exports = router