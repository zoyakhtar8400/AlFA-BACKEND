const { Bill, ZatcaStatus } = require('../../js/database');

async function addZatcaStatus(params) {
  const response = { status: 200, message: '' };
  try {
    await Bill.update(
      { zatca_status: 1 },
      {
        where: {
          order_id: params.order_id,
        },
      },
    );

    await ZatcaStatus.destroy({
      where: {
        order_id: params.order_id,
      },
    });
    await ZatcaStatus.create({
      order_id: params.order_id,
      store_id: params.store_id,
      status: params.status,
      qr: params.qr,
    });
    Object.assign(response, {
      status: 200,
      message: 'Success',
    });
  } catch (error) {
    console.error(error);
    Object.assign(response, {
      status: 400,
      message: 'Something went wrong',
    });
  }
  return response;
}

module.exports = {
  addZatcaStatus,
};
