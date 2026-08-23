const express = require('express');
const router = express.Router();
const { ResponseMessage } = require('../error/ResponseMessage');

router.post('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const { items = [], discountLines = [] } = req.body;

    let subtotal = 0;
    items.forEach(item => {
      const qty = Number(item.qty || item.quantity || 1);
      const price = Number(item.unitPrice || item.price || item.rate || 0);
      subtotal += (qty * price);
    });

    let discount = 0;
    let running = subtotal;
    if (Array.isArray(discountLines)) {
      discountLines.forEach(line => {
        const val = parseFloat(line.value) || 0;
        if (val > 0) {
          if (line.type === 'Percentage') {
            const deduct = (running * val) / 100;
            running -= deduct;
            discount += deduct;
          } else {
            const deduct = Math.min(val, running);
            running -= deduct;
            discount += deduct;
          }
        }
      });
    }

    const taxableAmount = Math.max(0, subtotal - discount);

    let tax_amount = 0;
    let tax_breakdown = [];
    
    // Fetch active taxes
    if (global.serverdbConnection && global.serverdbConnection.Tax) {
      try {
        const taxes = await global.serverdbConnection.Tax.findAll({
          where: { is_active: 1 },
          raw: true
        });
        taxes.forEach(t => {
          const rate = Number(t.tax_percentage || 0);
          const amt = Math.round((taxableAmount * rate / 100) * 100) / 100;
          tax_amount += amt;
          tax_breakdown.push({
            name: t.tax_name || 'Tax',
            rate,
            amount: amt
          });
        });
      } catch (err) {
        console.warn('Error fetching taxes:', err.message);
      }
    }

    const net_amount = Math.round(taxableAmount + tax_amount);

    response.data = {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      tax_amount: Math.round(tax_amount * 100) / 100,
      net_amount: net_amount,
      tax_breakdown
    };
    response.setStatus(200);
  } catch (err) {
    console.error('Error in POS calculation API:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Error calculating POS bill');
  }
  res.json(response);
});

module.exports = router;
