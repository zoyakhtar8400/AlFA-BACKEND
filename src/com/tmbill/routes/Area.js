const express = require('express');
const { ResponseMessage } = require('../error/ResponseMessage');
const router = express.Router();

function mapArea(a) {
  return {
    id: a.id,
    name: a.name || '',
    description: a.description || '',
    active: a.active === 'No' ? 'No' : 'Yes',
    store_id: a.store_id || 'STORE_1',
    createdAt: a.created_at || a.createdAt,
    updatedAt: a.updated_at || a.updatedAt
  };
}

// GET all areas
router.get('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    if (global.serverdbConnection && global.serverdbConnection.Area) {
      const areas = await global.serverdbConnection.Area.findAll({
        order: [['id', 'ASC']],
        raw: true
      });
      const mapped = areas.map(mapArea);
      response.data = mapped;
      response.areas = mapped;
      response.setStatus(200);
    } else {
      response.data = [];
      response.areas = [];
      response.setStatus(200);
    }
  } catch (err) {
    console.error('Error fetching areas:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to fetch areas');
  }
  res.json(response);
});

// GET single area
router.get('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const area = await global.serverdbConnection.Area.findByPk(req.params.id, { raw: true });
    if (!area) {
      response.setStatus(404);
      response.setMessage('Area not found');
    } else {
      response.data = mapArea(area);
      response.area = response.data;
      response.setStatus(200);
    }
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// POST create area
router.post('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { name, active, description, store_id } = req.body;
    if (!name || !name.trim()) {
      response.setStatus(400);
      response.setMessage('Area Name is required');
      return res.json(response);
    }

    const trimmedName = name.trim();

    // Check duplicate name
    const existing = await global.serverdbConnection.Area.findOne({
      where: global.serverdbConnection.Sequelize.where(
        global.serverdbConnection.Sequelize.fn('LOWER', global.serverdbConnection.Sequelize.col('name')),
        trimmedName.toLowerCase()
      )
    });

    if (existing) {
      response.setStatus(400);
      response.setMessage(`Area "${trimmedName}" already exists`);
      return res.json(response);
    }

    const created = await global.serverdbConnection.Area.create({
      name: trimmedName,
      description: description || null,
      active: active === 'No' ? 'No' : 'Yes',
      store_id: store_id || 'STORE_1'
    });

    response.setStatus(201);
    response.setMessage('Area created successfully');
    response.data = mapArea(created.get({ plain: true }));
    response.area = response.data;
  } catch (err) {
    console.error('Error creating area:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to create area');
  }
  res.json(response);
});

// PUT update area
router.put('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { name, active, description, store_id } = req.body;
    const area = await global.serverdbConnection.Area.findByPk(req.params.id);
    if (!area) {
      response.setStatus(404);
      response.setMessage('Area not found');
      return res.json(response);
    }

    const trimmedName = name ? name.trim() : area.name;

    // Check duplicate name if name changed
    if (trimmedName && trimmedName.toLowerCase() !== area.name.toLowerCase()) {
      const existing = await global.serverdbConnection.Area.findOne({
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
        response.setMessage(`Area "${trimmedName}" already exists`);
        return res.json(response);
      }
    }

    await area.update({
      name: trimmedName,
      description: description !== undefined ? description : area.description,
      active: active !== undefined ? (active === 'No' ? 'No' : 'Yes') : area.active,
      store_id: store_id !== undefined ? store_id : area.store_id,
      updated_at: new Date()
    });

    response.setStatus(200);
    response.setMessage('Area updated successfully');
    response.data = mapArea(area.get({ plain: true }));
    response.area = response.data;
  } catch (err) {
    console.error('Error updating area:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to update area');
  }
  res.json(response);
});

// DELETE area
router.delete('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const area = await global.serverdbConnection.Area.findByPk(req.params.id);
    if (!area) {
      response.setStatus(404);
      response.setMessage('Area not found');
      return res.json(response);
    }

    await area.destroy();
    response.setStatus(200);
    response.setMessage('Area deleted successfully');
  } catch (err) {
    console.error('Error deleting area:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to delete area');
  }
  res.json(response);
});

module.exports = router;
