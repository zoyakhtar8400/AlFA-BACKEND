/* eslint-disable camelcase */

const { Table, TableReservation } = require('../../js/database');
const { safeParseformain } = require('../Utils');

async function setRservationIdToTable(params) {
  try {
    // check same reservation id is assigned already
    const {
      reservation_id,
      table_id,
      table_color,
      customer_name,
      customer_mobile,
    } = params;
    const isTableAssigned = await Table.findOne({
      raw: true,
      where: {
        // reservation_id,
        id: table_id,
      },
    });

    if (isTableAssigned && isTableAssigned.order_state === 'Placed') {
      return {
        message: "Table is running. You can't reserve this table now.",
      };
    }

    const isReservationReserved = await TableReservation.findOne({
      raw: true,
      where: {
        reservation_id,
        //   id: table_id,
      },
    });
    // if reservation id is assigned already and table is same then return
    if (
      (isTableAssigned && isTableAssigned.reservation_id) ||
      isReservationReserved
    ) {
      return { status: 400, message: 'Table is reserved already' };
    }

    const result = await Table.update(
      {
        reservation_id,
        table_color,
      },
      {
        where: {
          id: table_id,
        },
      },
    );

    if (result) {
      const table_data = await Table.findOne({
        raw: true,
        attributes: ['extra_details'],
        where: {
          id: table_id,
        },
      });
      let extra_details = {
        customer_name,
        customer_mobile,
      };
      if (table_data.extra_details) {
        const extradetails = safeParseformain(table_data.extra_details);
        extra_details = { ...extra_details, ...extradetails };
      }

      await Table.update(
        { extra_details },
        {
          where: {
            id: table_id,
          },
        },
      );
      return { status: 200, message: 'Table reserved' };
    }
  } catch (error) {
    console.log('error', error);
  }
  return {};
}

async function createReservationRecord(params) {
  try {
    // check if same record present then delete
    const isReservationCreated = await TableReservation.findOne({
      raw: true,
      where: {
        reservation_id: params.reservation_id,
      },
    });
    if (isReservationCreated) {
      // return {message:'rs'}
      await TableReservation.destroy({
        where: {
          reservation_id: params.reservation_id,
        },
      });
    }

    // eslint-disable-next-line no-param-reassign
    delete params.id;
    await TableReservation.create(params);
    return { message: 'Reservation created successfully' };
  } catch (error) {
    console.log('error while adding reservation data in database:', error);
  }
  return {};
}

module.exports = {
  setRservationIdToTable,
  createReservationRecord,
};
