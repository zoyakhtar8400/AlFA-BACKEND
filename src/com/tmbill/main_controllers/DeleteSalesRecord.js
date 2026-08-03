const {
  KOT,
  KOTItem,
  Sequelize,
  Bill,
  BillItem,
  BillPayment,
  BillCharges,
  BillItemOption,
  PreOrder,
  Table,
  KotItemOption,
} = require('../js/database');

async function deleteSalesRecord(storeID) {
  // deleting kot
  const kots = await KOT.findAll({
    raw: true,
    attributes: ['kot_id'],
    where: {
      store_id: storeID,
    },
  });

  const kot = [];
  kots.map((ele) => {
    kot.push(ele.kot_id);
    return undefined;
  });

  const kotItems = await KOTItem.findAll({
    raw: true,
    attributes: ['id'],
    where: {
      kot_id: {
        [Sequelize.Op.in]: kot,
      },
    },
  });

  const kotItemsId = [];
  kotItems.map((ele) => {
    kotItemsId.push(ele.id);
    return undefined;
  });

  try {
    await KotItemOption.destroy({
      where: {
        kot_items_id: {
          [Sequelize.Op.in]: kotItemsId,
        },
      },
    });
    await KOTItem.destroy({
      where: {
        kot_id: {
          [Sequelize.Op.in]: kot,
        },
      },
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await KOT.destroy({
      where: {
        kot_id: {
          [Sequelize.Op.in]: kot,
        },
      },
    });
  } catch (err) {
    console.error(err);
  }

  // deleting bills

  const orders = await Bill.findAll({
    raw: true,
    attributes: ['order_id'],
    where: {
      store_id: storeID,
    },
  });

  const bills = [];
  orders.map((ele) => {
    bills.push(ele.order_id);
    return undefined;
  });

  try {
    await BillItem.destroy({
      where: {
        orderMasterId: {
          [Sequelize.Op.in]: bills,
        },
      },
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await BillPayment.destroy({
      where: {
        order_id: {
          [Sequelize.Op.in]: bills,
        },
      },
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await BillCharges.destroy({
      where: {
        order_id: {
          [Sequelize.Op.in]: bills,
        },
      },
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await BillItemOption.destroy({
      where: {
        order_id: {
          [Sequelize.Op.in]: bills,
        },
      },
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await PreOrder.destroy({
      where: {
        order_id: {
          [Sequelize.Op.in]: bills,
        },
      },
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await Bill.destroy({
      where: {
        order_id: {
          [Sequelize.Op.in]: bills,
        },
      },
    });
  } catch (err) {
    console.error(err);
  }

  try {
    await Table.update(
      {
        table_color: '#007c45',
      },
      {
        where: {
          store_id: storeID,
        },
      },
    );
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  deleteSalesRecord,
};
