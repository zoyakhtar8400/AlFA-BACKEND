const express = require('express');
const ResponseMessage = require('../error/ResponseMessage').ResponseMessage;
const router = express.Router();

function mapReservation(r) {
  const tableNoStr = String(r.table_name || r.table_id || '').replace(/[^0-9]/g, '') || String(r.table_id || '');
  return {
    id: r.id,
    reservationId: r.reservation_id || `RES-${r.id}`,
    tableId: r.table_id,
    tableName: r.table_name || `Table ${tableNoStr}`,
    tableNo: tableNoStr,
    customerName: r.name || 'Walk-in',
    phone: r.phone || '—',
    persons: Number(r.persons || 1),
    occasion: r.occasion || '',
    bookingDate: r.booking_date || null,
    booking_date: r.booking_date || null,
    bookingTime: r.booking_time || r.check_in || null,
    booking_time: r.booking_time || r.check_in || null,
    checkIn: r.check_in || null,
    checkOut: r.check_out || null,
    status: r.status || 'Reserved',
    createdAt: r.created_at || r.createdAt || null
  };
}

// GET all reservations (supports ?date=YYYY-MM-DD and ?store_id=...)
router.get('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const where = {};
    if (req.query.date) {
      where.booking_date = req.query.date;
    }
    if (req.query.store_id && req.query.store_id !== 'all') {
      where.store_id = req.query.store_id;
    }
    const reservations = await global.serverdbConnection.TableReservation.findAll({
      where,
      order: [['id', 'DESC']],
      raw: true
    });
    const mapped = reservations.map(mapReservation);
    response.reservations = mapped;
    response.data = mapped;
    response.setStatus(200);
  } catch (err) {
    console.error('Error fetching reservations:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to fetch reservations');
  }
  res.json(response);
});

// GET single reservation
router.get('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const reservation = await global.serverdbConnection.TableReservation.findByPk(req.params.id, { raw: true });
    if (!reservation) {
      response.setStatus(404);
      response.setMessage('Reservation not found');
    } else {
      response.reservation = mapReservation(reservation);
      response.data = response.reservation;
    }
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message);
  }
  res.json(response);
});

// POST create reservation
router.post('/', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const b = req.body;
    const tableNoStr = String(b.tableNo || b.table_no || b.tableId || '').replace(/[^0-9]/g, '') || String(b.tableId || '');
    const resId = b.reservationId || `RES-${Date.now()}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const bDate = b.bookingDate || b.booking_date || b.date || todayStr;

    const formatTime = (v) => {
      if (!v) return new Date().toTimeString().split(' ')[0];
      const str = String(v).trim();
      if (str.length === 8 && str.includes(':')) return str;
      if (str.length === 5 && str.includes(':')) return `${str}:00`;
      const parsed = new Date(str);
      if (!isNaN(parsed.getTime())) return parsed.toTimeString().split(' ')[0];
      return new Date().toTimeString().split(' ')[0];
    };

    const bTime = b.bookingTime || b.booking_time || b.time || formatTime(b.checkIn || b.check_in);

    const created = await global.serverdbConnection.TableReservation.create({
      reservation_id: resId,
      store_id: b.store_id || 'STORE_1',
      table_id: Number(b.tableId || b.table_id || 0),
      table_name: b.tableName || `Table ${tableNoStr}`,
      name: b.customerName || b.name || 'Walk-in',
      phone: b.phone || '',
      persons: Number(b.persons || b.guestsCount || 1),
      occasion: b.occasion || '',
      booking_date: bDate,
      booking_time: bTime,
      check_in: formatTime(b.checkIn || bTime),
      check_out: formatTime(b.checkOut || bTime),
      status: b.status || 'Reserved',
      created_at: formatTime(new Date()),
      created_time: formatTime(new Date())
    });

    // Mark table as Reserved in PostgreSQL if booking is for today
    const isToday = b.isToday !== undefined ? b.isToday : (bDate === todayStr);
    if ((b.tableId || b.table_id) && isToday) {
      const tid = b.tableId || b.table_id;
      const table = await global.serverdbConnection.Table.findByPk(tid);
      if (table) {
        const extra = table.extra_details || {};
        await table.update({
          order_state: 'RESERVED',
          extra_details: {
            ...extra,
            status: 'Reserved',
            customer: b.customerName || b.name || 'Walk-in',
            waiter: b.waiter || extra.waiter || null,
            kot_status: 'NONE',
            payment_status: 'UNPAID'
          }
        });
      }
    }

    response.setStatus(201);
    response.setMessage('Reservation created successfully');
    response.reservation = mapReservation(created.get({ plain: true }));
    response.data = response.reservation;
  } catch (err) {
    console.error('Error creating reservation:', err);
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to create reservation');
  }
  res.json(response);
});

// PUT update reservation
router.put('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const reservation = await global.serverdbConnection.TableReservation.findByPk(req.params.id);
    if (!reservation) {
      response.setStatus(404);
      response.setMessage('Reservation not found');
      return res.json(response);
    }
    const b = req.body;
    const tableNoStr = String(b.tableNo || b.table_no || reservation.table_id || '').replace(/[^0-9]/g, '');

    await reservation.update({
      ...(b.tableId !== undefined && { table_id: Number(b.tableId) }),
      ...(b.tableName !== undefined && { table_name: b.tableName }),
      ...((b.tableName === undefined && b.tableNo) && { table_name: `Table ${tableNoStr}` }),
      ...(b.customerName !== undefined && { name: b.customerName }),
      ...(b.phone !== undefined && { phone: b.phone }),
      ...(b.persons !== undefined && { persons: Number(b.persons) }),
      ...(b.occasion !== undefined && { occasion: b.occasion }),
      ...(b.checkIn !== undefined && { check_in: b.checkIn }),
      ...(b.checkOut !== undefined && { check_out: b.checkOut }),
      ...(b.status !== undefined && { status: b.status })
    });

    response.setStatus(200);
    response.setMessage('Reservation updated successfully');
    response.reservation = mapReservation(reservation.get({ plain: true }));
    response.data = response.reservation;
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to update reservation');
  }
  res.json(response);
});

// PATCH update reservation status
router.patch('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const reservation = await global.serverdbConnection.TableReservation.findByPk(req.params.id);
    if (!reservation) {
      response.setStatus(404);
      response.setMessage('Reservation not found');
      return res.json(response);
    }

    const nextStatus = req.body.status || 'Cancelled';
    await reservation.update({ status: nextStatus });

    // If cancelled, free the table if it was just reserved
    if (nextStatus === 'Cancelled' && reservation.table_id) {
      const table = await global.serverdbConnection.Table.findByPk(reservation.table_id);
      if (table && (table.order_state === 'ORDERED' || table.order_state === 'AVAILABLE')) {
        const extra = table.extra_details || {};
        await table.update({
          order_state: 'AVAILABLE',
          extra_details: {
            ...extra,
            customer: 'Walk-in',
            kot_status: 'NONE',
            payment_status: 'UNPAID',
            amount: 0
          }
        });
      }
    }

    response.setStatus(200);
    response.setMessage(`Reservation status updated to ${nextStatus}`);
    response.data = { id: req.params.id, status: nextStatus };
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to update reservation status');
  }
  res.json(response);
});

// DELETE reservation
router.delete('/:id', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const reservation = await global.serverdbConnection.TableReservation.findByPk(req.params.id);
    if (reservation) {
      await reservation.destroy();
    }
    response.setStatus(200);
    response.setMessage('Reservation deleted successfully');
  } catch (err) {
    response.setStatus(400);
    response.setMessage(err.message || 'Failed to delete reservation');
  }
  res.json(response);
});

module.exports = router;
