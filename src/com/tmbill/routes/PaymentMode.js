const express = require('express');
const { ResponseMessage } = require('../error/ResponseMessage');
const router = express.Router();

function mapPaymentMode(p) {
  return {
    id: p.id,
    name: p.payment_mode_name || p.name || '',
    payment_mode_name: p.payment_mode_name || p.name || '',
    alternative_title: p.alternative_title || '',
    type: p.type || 'CASH',
    charge_percent: Number(p.charge_percent || 0),
    is_quick_pay: p.is_quick_pay !== false,
    description: p.description || '',
    active: p.active === 'No' ? 'No' : 'Yes',
    isActive: p.active !== 'No',
    store_id: p.store_id || 'STORE_1',
    createdAt: p.created_at || p.createdAt,
    updatedAt: p.updated_at || p.updatedAt
  };
}

async function ensureDefaultPaymentModes() {
  try {
    if (!global.serverdbConnection || !global.serverdbConnection.PaymentMode) return;
    const count = await global.serverdbConnection.PaymentMode.count();
    if (count === 0) {
      const defaults = [
        { payment_mode_name: 'Cash', type: 'CASH', charge_percent: 0, is_quick_pay: true, active: 'Yes', description: 'Cash payment' },
        { payment_mode_name: 'Card', type: 'CARD', charge_percent: 0, is_quick_pay: true, active: 'Yes', description: 'Credit / Debit Card' },
        { payment_mode_name: 'UPI', type: 'UPI', charge_percent: 0, is_quick_pay: true, active: 'Yes', description: 'GooglePay / PhonePe / Paytm UPI' },
        { payment_mode_name: 'Other', type: 'OTHER', charge_percent: 0, is_quick_pay: true, active: 'Yes', description: 'Other payment option' },
        { payment_mode_name: 'Due', type: 'CREDIT', charge_percent: 0, is_quick_pay: false, active: 'Yes', description: 'Customer Due / Ledger Credit' },
        { payment_mode_name: 'Complimentary', type: 'OTHER', charge_percent: 0, is_quick_pay: false, active: 'Yes', description: 'Complimentary / Non-Chargeable' },
        { payment_mode_name: 'Cheque', type: 'OTHER', charge_percent: 0, is_quick_pay: false, active: 'Yes', description: 'Bank Cheque Payment' },
        { payment_mode_name: 'Online', type: 'ONLINE', charge_percent: 0, is_quick_pay: false, active: 'Yes', description: 'Online Gateway / Portal' },
        { payment_mode_name: 'Room Post', type: 'CREDIT', charge_percent: 0, is_quick_pay: false, active: 'Yes', description: 'Post charge to hotel room' }
      ];
      await global.serverdbConnection.PaymentMode.bulkCreate(defaults);
      console.log('✅ Default POS Payment Modes seeded into mpos_payment_mode');
    }
  } catch (e) {
    console.warn('ensureDefaultPaymentModes warning:', e.message);
  }
}

// GET all payment modes
router.get('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    if (global.serverdbConnection && global.serverdbConnection.PaymentMode) {
      await ensureDefaultPaymentModes();
      const modes = await global.serverdbConnection.PaymentMode.findAll({
        order: [['id', 'ASC']],
        raw: true
      });
      const mapped = modes.map(mapPaymentMode);
      response.data = mapped;
      response.paymentModes = mapped;
      response.payment_modes = mapped;
      response.setStatus(200);
    } else {
      response.data = [];
      response.paymentModes = [];
      response.setStatus(200);
    }
  } catch (err) {
    console.error('Error fetching payment modes:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to fetch payment modes');
  }
  res.json(response);
});

// GET single payment mode
router.get('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const item = await global.serverdbConnection.PaymentMode.findByPk(req.params.id, { raw: true });
    if (!item) {
      response.setStatus(404);
      response.setMessage('Payment mode not found');
    } else {
      response.data = mapPaymentMode(item);
      response.paymentMode = response.data;
      response.setStatus(200);
    }
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// POST create payment mode
router.post('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { name, payment_mode_name, type, charge_percent, is_quick_pay, active, description, store_id } = req.body;
    const modeName = (name || payment_mode_name || '').trim();

    if (!modeName) {
      response.setStatus(400);
      response.setMessage('Payment Mode Name is required');
      return res.json(response);
    }

    // Check duplicate name
    const existing = await global.serverdbConnection.PaymentMode.findOne({
      where: global.serverdbConnection.Sequelize.where(
        global.serverdbConnection.Sequelize.fn('LOWER', global.serverdbConnection.Sequelize.col('payment_mode_name')),
        modeName.toLowerCase()
      )
    });

    if (existing) {
      response.setStatus(400);
      response.setMessage(`Payment Mode "${modeName}" already exists`);
      return res.json(response);
    }

    const created = await global.serverdbConnection.PaymentMode.create({
      payment_mode_name: modeName,
      type: type || 'CASH',
      charge_percent: Number(charge_percent || 0),
      is_quick_pay: is_quick_pay !== false,
      active: active === 'No' ? 'No' : 'Yes',
      description: description || null,
      store_id: store_id || 'STORE_1'
    });

    response.setStatus(201);
    response.setMessage('Payment Mode created successfully');
    response.data = mapPaymentMode(created.get({ plain: true }));
    response.paymentMode = response.data;
  } catch (err) {
    console.error('Error creating payment mode:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to create payment mode');
  }
  res.json(response);
});

// PUT update payment mode
router.put('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { name, payment_mode_name, type, charge_percent, is_quick_pay, active, description, store_id } = req.body;
    const mode = await global.serverdbConnection.PaymentMode.findByPk(req.params.id);

    if (!mode) {
      response.setStatus(404);
      response.setMessage('Payment mode not found');
      return res.json(response);
    }

    const modeName = (name || payment_mode_name || '').trim();

    if (modeName && modeName.toLowerCase() !== mode.payment_mode_name.toLowerCase()) {
      const existing = await global.serverdbConnection.PaymentMode.findOne({
        where: {
          [global.serverdbConnection.Sequelize.Op.and]: [
            global.serverdbConnection.Sequelize.where(
              global.serverdbConnection.Sequelize.fn('LOWER', global.serverdbConnection.Sequelize.col('payment_mode_name')),
              modeName.toLowerCase()
            ),
            { id: { [global.serverdbConnection.Sequelize.Op.ne]: req.params.id } }
          ]
        }
      });
      if (existing) {
        response.setStatus(400);
        response.setMessage(`Payment Mode "${modeName}" already exists`);
        return res.json(response);
      }
    }

    await mode.update({
      payment_mode_name: modeName || mode.payment_mode_name,
      type: type !== undefined ? type : mode.type,
      charge_percent: charge_percent !== undefined ? Number(charge_percent) : mode.charge_percent,
      is_quick_pay: is_quick_pay !== undefined ? is_quick_pay : mode.is_quick_pay,
      active: active !== undefined ? (active === 'No' ? 'No' : 'Yes') : mode.active,
      description: description !== undefined ? description : mode.description,
      store_id: store_id !== undefined ? store_id : mode.store_id,
      updated_at: new Date()
    });

    response.setStatus(200);
    response.setMessage('Payment Mode updated successfully');
    response.data = mapPaymentMode(mode.get({ plain: true }));
    response.paymentMode = response.data;
  } catch (err) {
    console.error('Error updating payment mode:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to update payment mode');
  }
  res.json(response);
});

// DELETE payment mode
router.delete('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const mode = await global.serverdbConnection.PaymentMode.findByPk(req.params.id);
    if (!mode) {
      response.setStatus(404);
      response.setMessage('Payment mode not found');
      return res.json(response);
    }

    await mode.destroy();
    response.setStatus(200);
    response.setMessage('Payment Mode deleted successfully');
  } catch (err) {
    console.error('Error deleting payment mode:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to delete payment mode');
  }
  res.json(response);
});

module.exports = router;
