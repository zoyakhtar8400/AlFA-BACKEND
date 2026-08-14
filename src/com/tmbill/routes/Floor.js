const express = require('express');
const { ResponseMessage } = require('../error/ResponseMessage');
const router = express.Router();

function mapFloor(f) {
  return {
    id: f.id,
    name: f.name || '',
    active: f.active === 'No' ? 'No' : 'Yes',
    createdAt: f.created_at || f.createdAt,
    updatedAt: f.updated_at || f.updatedAt
  };
}

// GET all floors
router.get('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const floors = await global.serverdbConnection.Floor.findAll({
      order: [['id', 'ASC']],
      raw: true
    });
    const mapped = floors.map(mapFloor);
    response.data = mapped;
    response.floors = mapped;
    response.setStatus(200);
  } catch (err) {
    console.error('Error fetching floors:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to fetch floors');
  }
  res.json(response);
});

// GET single floor
router.get('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const floor = await global.serverdbConnection.Floor.findByPk(req.params.id, { raw: true });
    if (!floor) {
      response.setStatus(404);
      response.setMessage('Floor not found');
    } else {
      response.data = mapFloor(floor);
      response.floor = response.data;
      response.setStatus(200);
    }
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// POST create floor
router.post('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { name, active } = req.body;
    if (!name || !name.trim()) {
      response.setStatus(400);
      response.setMessage('Floor Name is required');
      return res.json(response);
    }

    const trimmedName = name.trim();

    // Check duplicate name
    const existing = await global.serverdbConnection.Floor.findOne({
      where: global.serverdbConnection.Sequelize.where(
        global.serverdbConnection.Sequelize.fn('LOWER', global.serverdbConnection.Sequelize.col('name')),
        trimmedName.toLowerCase()
      )
    });

    if (existing) {
      response.setStatus(400);
      response.setMessage(`Floor "${trimmedName}" already exists`);
      return res.json(response);
    }

    const created = await global.serverdbConnection.Floor.create({
      name: trimmedName,
      active: active === 'No' ? 'No' : 'Yes',
      store_id: req.body.store_id || 'STORE_1'
    });

    response.setStatus(201);
    response.setMessage('Floor created successfully');
    response.data = mapFloor(created.get({ plain: true }));
    response.floor = response.data;
  } catch (err) {
    console.error('Error creating floor:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to create floor');
  }
  res.json(response);
});

// PUT update floor
router.put('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { name, active } = req.body;
    const floor = await global.serverdbConnection.Floor.findByPk(req.params.id);
    if (!floor) {
      response.setStatus(404);
      response.setMessage('Floor not found');
      return res.json(response);
    }

    const trimmedName = name ? name.trim() : floor.name;

    // Check duplicate name if name changed
    if (trimmedName && trimmedName.toLowerCase() !== floor.name.toLowerCase()) {
      const existing = await global.serverdbConnection.Floor.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.and]: [
            global.serverdbConnection.Sequelize.where(
              global.serverdbConnection.Sequelize.fn('LOWER', global.serverdbConnection.Sequelize.col('name')),
              trimmedName.toLowerCase()
            ),
            { id: { [global.serverdbConnection.Sequelize.Op.ne]: req.params.id } }
          ]
        }
      });
      if (existing) {
        response.setStatus(400);
        response.setMessage(`Floor "${trimmedName}" already exists`);
        return res.json(response);
      }
    }

    await floor.update({
      name: trimmedName,
      active: active !== undefined ? (active === 'No' ? 'No' : 'Yes') : floor.active,
      updated_at: new Date()
    });

    response.setStatus(200);
    response.setMessage('Floor updated successfully');
    response.data = mapFloor(floor.get({ plain: true }));
    response.floor = response.data;
  } catch (err) {
    console.error('Error updating floor:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to update floor');
  }
  res.json(response);
});

// DELETE floor
router.delete('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const floor = await global.serverdbConnection.Floor.findByPk(req.params.id);
    if (!floor) {
      response.setStatus(404);
      response.setMessage('Floor not found');
      return res.json(response);
    }

    await floor.destroy();
    response.setStatus(200);
    response.setMessage('Floor deleted successfully');
  } catch (err) {
    console.error('Error deleting floor:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to delete floor');
  }
  res.json(response);
});

module.exports = router;
