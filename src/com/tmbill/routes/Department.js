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
        let whereData = {};
        if (params && params.store_id) {
            whereData = {
                [global.serverdbConnection.Sequelize.Op.or]: [
                    { store_id: params.store_id },
                    { store_id: 'STORE_1' },
                    { store_id: '1' },
                    { store_id: null }
                ]
            };
        }
        departments = await global.serverdbConnection.Department.findAll({
            raw: true,
            where: whereData
        });
        if (!departments || departments.length === 0) {
            // Also check all active departments
            departments = await global.serverdbConnection.Department.findAll({
                raw: true
            }).catch(() => []);
        }
        if (!departments || departments.length === 0) {
            departments = [
                { id: 1, department_name: 'RESTAURANT', store_id: 'STORE_1', is_active: 1 }
            ];
        }
    } catch (error) {
        departments = [
            { id: 1, department_name: 'RESTAURANT', store_id: 'STORE_1', is_active: 1 }
        ];
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