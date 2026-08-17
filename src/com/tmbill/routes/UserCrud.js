const express = require('express');
const { ResponseMessage } = require('../error/ResponseMessage');
const { auth, authorize } = require('../middleware/auth');
const { hashPassword } = require('../util/passwordUtils');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = ['ADMIN', 'STAFF'];

router.use(auth);
router.use(authorize('ADMIN'));

// GET all users with assigned outlets
router.get('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const userModel = global.serverdbConnection.User;
    const userOutletModel = global.serverdbConnection.UserOutlet;

    const users = await userModel.findAll({
      order: [['id', 'ASC']],
      raw: true
    });

    let outletMappings = [];
    if (userOutletModel) {
      outletMappings = await userOutletModel.findAll({ raw: true });
    }

    response.data = users.map(u => {
      const rawRole = String(u.type || u.userCategory || 'STAFF').toUpperCase();
      const normRole = rawRole === 'ADMIN' ? 'ADMIN' : 'STAFF';

      const userAssignedStores = outletMappings
        .filter(m => m.user_id === u.id)
        .map(m => m.store_id);

      return {
        id: u.id,
        username: u.username,
        email: u.email || '',
        name: u.name || u.username,
        phone: u.phone || '',
        role: normRole,
        type: normRole,
        status: u.status === 1 || u.status === '1' || u.status === true ? 'Active' : 'Inactive',
        statusCode: u.status,
        store_id: u.store_id || 'STORE_1',
        assigned_outlets: userAssignedStores.length > 0 ? userAssignedStores : [u.store_id || 'STORE_1']
      };
    });

    response.setStatus(200);
    return res.status(200).json(response);
  } catch (err) {
    console.error('Error fetching users:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to fetch users');
    return res.status(400).json(response);
  }
});

// POST create user with assigned outlets
router.post('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { username, email, password, name, phone, role, type, status, outlets, assigned_outlets } = req.body || {};

    if (!username || !password) {
      response.setStatus(400);
      response.setMessage('Username and password are required');
      return res.status(400).json(response);
    }

    const cleanUsername = String(username).trim();

    if (cleanUsername.length < 3 || cleanUsername.length > 50) {
      response.setStatus(400);
      response.setMessage('Username must be between 3 and 50 characters');
      return res.status(400).json(response);
    }

    if (String(password).trim().length < 6) {
      response.setStatus(400);
      response.setMessage('Password must be at least 6 characters');
      return res.status(400).json(response);
    }

    if (email && !EMAIL_RE.test(String(email).trim())) {
      response.setStatus(400);
      response.setMessage('Invalid email format');
      return res.status(400).json(response);
    }

    let userRole = String(role || type || 'STAFF').toUpperCase();
    if (userRole === 'USER' || userRole === 'MANAGER' || userRole === 'CASHIER' || userRole === 'WAITER') {
      userRole = 'STAFF';
    }
    if (!ALLOWED_ROLES.includes(userRole)) {
      response.setStatus(400);
      response.setMessage(`Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}`);
      return res.status(400).json(response);
    }

    const userModel = global.serverdbConnection.User;
    const existing = await userModel.findOne({ where: { username: cleanUsername } });
    if (existing) {
      response.setStatus(400);
      response.setMessage(`Username '${cleanUsername}' already exists.`);
      return res.status(400).json(response);
    }

    const statusVal = status === 'Inactive' || status === 0 || status === '0' ? 0 : 1;
    const targetOutlets = Array.isArray(outlets) ? outlets : (Array.isArray(assigned_outlets) ? assigned_outlets : ['STORE_1']);
    let firstStoreId = String(targetOutlets[0] || 'STORE_1');
    if (!firstStoreId.startsWith('STORE_')) {
      firstStoreId = `STORE_${firstStoreId}`;
    }

    const newUser = await userModel.create({
      username: cleanUsername,
      email: email ? String(email).trim() : '',
      password: hashPassword(String(password).trim()),
      name: name ? String(name).trim() : cleanUsername,
      phone: phone ? String(phone).trim() : '',
      type: userRole,
      status: statusVal,
      store_id: firstStoreId
    });

    // Save user-outlet mapping
    const userOutletModel = global.serverdbConnection.UserOutlet;
    if (userOutletModel && targetOutlets.length > 0) {
      for (const storeId of targetOutlets) {
        let normalizedStoreId = String(storeId);
        if (!normalizedStoreId.startsWith('STORE_')) {
          normalizedStoreId = `STORE_${normalizedStoreId}`;
        }
        await userOutletModel.create({
          user_id: newUser.id,
          store_id: normalizedStoreId
        });
      }
    }

    response.setStatus(201);
    response.setMessage('User created successfully');
    response.data = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      name: newUser.name,
      phone: newUser.phone,
      role: newUser.type,
      type: newUser.type,
      status: newUser.status === 1 ? 'Active' : 'Inactive',
      store_id: targetOutlets[0] || 'STORE_1',
      assigned_outlets: targetOutlets
    };
    return res.status(201).json(response);
  } catch (err) {
    console.error('Error creating user:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to create user');
    return res.status(400).json(response);
  }
});

// PUT update user with assigned outlets
router.put('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const userId = Number(req.params.id);
    if (!userId || isNaN(userId)) {
      response.setStatus(400);
      response.setMessage('Invalid user ID');
      return res.status(400).json(response);
    }

    const { username, email, password, name, phone, role, type, status, outlets, assigned_outlets } = req.body || {};

    if (email !== undefined && email !== '' && !EMAIL_RE.test(String(email).trim())) {
      response.setStatus(400);
      response.setMessage('Invalid email format');
      return res.status(400).json(response);
    }

    if (password && String(password).trim().length < 6) {
      response.setStatus(400);
      response.setMessage('Password must be at least 6 characters');
      return res.status(400).json(response);
    }

    const userModel = global.serverdbConnection.User;
    const user = await userModel.findByPk(userId);

    if (!user) {
      response.setStatus(404);
      response.setMessage('User not found');
      return res.status(404).json(response);
    }

    const updateData = {};
    if (email !== undefined) updateData.email = String(email).trim();
    if (name !== undefined) updateData.name = String(name).trim();
    if (phone !== undefined) updateData.phone = String(phone).trim();

    if (role || type) {
      let newRole = String(role || type).toUpperCase();
      if (newRole !== 'ADMIN') newRole = 'STAFF';
      updateData.type = newRole;
    }

    if (status !== undefined) {
      updateData.status = status === 'Inactive' || status === 0 || status === '0' ? 0 : 1;
    }

    if (password && String(password).trim().length > 0) {
      updateData.password = hashPassword(String(password).trim());
    }

    if (username && String(username).trim() !== user.username) {
      const cleanNew = String(username).trim();
      if (cleanNew.length < 3 || cleanNew.length > 50) {
        response.setStatus(400);
        response.setMessage('Username must be between 3 and 50 characters');
        return res.status(400).json(response);
      }
      const duplicate = await userModel.findOne({ where: { username: cleanNew } });
      if (duplicate) {
        response.setStatus(400);
        response.setMessage(`Username '${cleanNew}' is already taken.`);
        return res.status(400).json(response);
      }
      updateData.username = cleanNew;
    }

    const targetOutlets = Array.isArray(outlets) ? outlets : (Array.isArray(assigned_outlets) ? assigned_outlets : null);
    if (targetOutlets && targetOutlets.length > 0) {
      let firstStoreId = String(targetOutlets[0]);
      if (!firstStoreId.startsWith('STORE_')) {
        firstStoreId = `STORE_${firstStoreId}`;
      }
      updateData.store_id = firstStoreId;
    }

    await user.update(updateData);

    // Update user-outlet mapping
    const userOutletModel = global.serverdbConnection.UserOutlet;
    if (userOutletModel && targetOutlets) {
      await userOutletModel.destroy({ where: { user_id: user.id } });
      for (const storeId of targetOutlets) {
        let normalizedStoreId = String(storeId);
        if (!normalizedStoreId.startsWith('STORE_')) {
          normalizedStoreId = `STORE_${normalizedStoreId}`;
        }
        await userOutletModel.create({
          user_id: user.id,
          store_id: normalizedStoreId
        });
      }
    }

    let finalAssignedOutlets = targetOutlets;
    if (!finalAssignedOutlets && userOutletModel) {
      const currentOutlets = await userOutletModel.findAll({ where: { user_id: user.id }, raw: true });
      finalAssignedOutlets = currentOutlets.map(o => o.store_id);
    }

    response.setStatus(200);
    response.setMessage('User updated successfully');
    response.data = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.type,
      type: user.type,
      status: user.status === 1 ? 'Active' : 'Inactive',
      store_id: user.store_id,
      assigned_outlets: finalAssignedOutlets || [user.store_id || 'STORE_1']
    };
    return res.status(200).json(response);
  } catch (err) {
    console.error('Error updating user:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to update user');
    return res.status(400).json(response);
  }
});

// DELETE (soft deactivate) user
router.delete('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const userId = Number(req.params.id);
    if (!userId || isNaN(userId)) {
      response.setStatus(400);
      response.setMessage('Invalid user ID');
      return res.status(400).json(response);
    }

    if (req.user && Number(req.user.id) === userId) {
      response.setStatus(400);
      response.setMessage('Cannot deactivate currently authenticated administrator');
      return res.status(400).json(response);
    }

    const userModel = global.serverdbConnection.User;
    const user = await userModel.findByPk(userId);

    if (!user) {
      response.setStatus(404);
      response.setMessage('User not found');
      return res.status(404).json(response);
    }

    await user.update({ status: 0 });

    response.setStatus(200);
    response.setMessage('User deactivated successfully in PostgreSQL');
    return res.status(200).json(response);
  } catch (err) {
    console.error('Error deleting user:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to delete user');
    return res.status(400).json(response);
  }
});

module.exports = router;
