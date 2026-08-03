const express = require('express');
require('../../../../main/services/Waiter.service');
const {
  requestassignReservationtotable,
  requestcreateReservation,
} = require('../../../../main/services/Reservation.service');

const reservationRouter = express.Router();

async function assignReservationhandler(req, res) {
  const data = await requestassignReservationtotable(req.body);
  res.json(data);
}

async function createreservationHandler(req, res) {
  const data = await requestcreateReservation(req.body);
  res.json(data);
}

reservationRouter.post('/AssignToTable', assignReservationhandler);
reservationRouter.post('/Create', createreservationHandler);

module.exports = reservationRouter;
