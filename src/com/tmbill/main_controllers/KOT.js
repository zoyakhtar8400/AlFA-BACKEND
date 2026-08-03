const { Bill, KOT, Sequelize } = require('../js/database');

async function settleAllKDSkotandorders(params) {
  let response = { status: 200 };
  try {
    if (params.kot_id) {
      let kotupdateData = { sync_status: 0 };
      if (params.status) {
        kotupdateData.status = params.status;
      }
      await KOT.update(kotupdateData, {
        where: {
          kot_id: {
            [Sequelize.Op.in]: params.kot_id,
          },
        },
      });
    }
    if (params.order_id) {
      let orderupdateData = { sync_status: 0 };
      if (params.order_status) {
        orderupdateData.order_kotflag = params.order_status;
      }
      await Bill.update(orderupdateData, {
        where: {
          order_id: {
            [Sequelize.Op.in]: params.order_id,
          },
        },
      });
    }
  } catch (error) {
    console.error(error);
    response.status = 400;
    response.message = 'Something went wrong';
  }
  return response;
}

module.exports = {
  settleAllKDSkotandorders,
};
