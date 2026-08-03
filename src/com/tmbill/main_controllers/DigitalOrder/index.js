const { DIGITAL_ORDER_IPC } = require('../../constant/IPCEvents');
const { Bill, Sequelize, BillPayment } = require('../../js/database');
const { ipcMain } = require('electron');
const { ORDER_IPC } = require('../../util/IPC_Messages');

async function updateOrder(orderDetails) {
  try {
    if (orderDetails && orderDetails.order_id) {
      const datatoUpdate = { ...orderDetails };
      delete datatoUpdate.order_id;

      const result = await Bill.update(datatoUpdate, {
        where: { order_id: orderDetails.order_id },
      });
      return result;
    }
  } catch (error) {
    console.error(
      `Message="Error While Updating the order details" OrderID="${orderDetails.order_id}"`,
    );
  }
}

async function updateOrderstatus(orderDetails) {
  try {
    if (orderDetails && orderDetails.order_id) {
      const datatoUpdate = {
        order_state: orderDetails.order_state,
        sync_status: 0,
      };

      const result = await Bill.update(datatoUpdate, {
        where: {
          order_id: {
            [Sequelize.Op.in]: orderDetails.order_id,
          },
          order_state: {
            [Sequelize.Op.ne]: orderDetails.order_state,
          },
        },
      });
    }
  } catch (error) {
    console.error(
      `Message="Error While Updating the order details" OrderID="${orderDetails.order_id}"`,
    );
  }
}

// ipcMain.on(DIGITAL_ORDER_IPC.ORDER_CANCELLED, async (event, content) => {
//   if (content) {
//     try {
//       if (content.constructor === 'test'.constructor) {
//         content = JSON.parse(content);
//       }
//       let responseData = await updateOrder(content);
//       event.reply(DIGITAL_ORDER_IPC.ORDER_CANCELLED_REPLY, responseData);
//     } catch (error) {
//       console.log(error);
//     }
//   }
// });
betteripcMain.answerRenderer(
  DIGITAL_ORDER_IPC.ORDER_CANCELLED,
  async (content) => {
    if (content) {
      try {
        if (content.constructor === 'test'.constructor) {
          content = JSON.parse(content);
        }
        let responseData = await updateOrder(content);
        return responseData;
      } catch (error) {
        console.log(error);
      }
    }
  },
);

ipcMain.on(DIGITAL_ORDER_IPC.UPDATE_ORDERSTATUS, async (event, content) => {
  if (content) {
    try {
      if (content.constructor === 'test'.constructor) {
        content = JSON.parse(content);
      }
      let responseData = await updateOrderstatus(content);
      event.reply(DIGITAL_ORDER_IPC.UPDATE_ORDERSTATUS, responseData);
    } catch (error) {
      console.log(error);
    }
  }
});

betteripcMain.answerRenderer(
  ORDER_IPC.UPDATE_DIGITAL_ORDER_PAYMENT,
  async ({ order_id, updatePayment }) => {
    try {
      if (order_id && updatePayment) {
        //check if order is present
        let order = await Bill.findOne({
          raw: true,
          where: {
            order_id,
          },
        });

        if (order) {
          //update payment mode in order
          let billUpdate = await Bill.update(
            {
              payment: updatePayment,
            },
            {
              where: {
                order_id,
              },
            },
          );

          let paymentupdateResult = await BillPayment.update(
            {
              payment_option: updatePayment,
            },
            {
              where: {
                order_id,
              },
            },
          );
        }
      }
    } catch (err) {}
  },
);
