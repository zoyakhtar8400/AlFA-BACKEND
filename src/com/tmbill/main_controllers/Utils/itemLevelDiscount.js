const {
  KOTItem,
  Bill,
  BillCharges,
  BillItem,
  Sequelize,
} = require('../../js/database');
const { addPayment } = require('../Order');

async function updatekotItems(discountData) {
  try {
    if (discountData && discountData.items && discountData.items.length) {
      discountData.items.forEach(async (item) => {
        // const kotIds = item.kot_id;
        // .split(',')
        // .map((id) => Number(id.trim()))
        // .filter(Boolean);

        if (item.discount_rate !== 0) {
          await KOTItem.update(
            {
              item_price: Number(
                item.discounted_price.toFixed(global.ROUNDOFF_UPTO),
              ),
              amount: Number(item.amount.toFixed(global.ROUNDOFF_UPTO)),
              item_tax_value: item.item_tax_value,
              pricebeforeDiscount: item.pricebeforeDiscount,
              discounted_price: Number(
                item.discounted_price.toFixed(global.ROUNDOFF_UPTO),
              ),
              discount_rate: item.discount_rate,
            },
            {
              where: {
                kot_id: item.kot_id,
                // kot_id: { [Sequelize.Op.in]: kotIds },
                item_id: item.item_id,
                item_name: item.title,
                note: item.note,
                id: item.kot_items_id,
              },
            },
          );
        }
      });
    }

    if (discountData.order_id) {
      const { billupdateData } = discountData;
      Object.assign(billupdateData, { sync_status: 0 });
      await Bill.update(billupdateData, {
        where: { order_id: discountData.order_id },
      });
      const { paymentDetails } = discountData;
      await addPayment(paymentDetails);

      await BillCharges.update(
        { status_flag: 1 },
        {
          where: { order_id: discountData.order_id },
        },
      );
      if (discountData.tempCharges && discountData.tempCharges.length > 0) {
        discountData.tempCharges.forEach(async (element) => {
          const charge = {
            order_id: discountData.order_id,
            title: element.title,
            value: element.amounttoAdd,
            amount: element.amount,
            is_default_flag: element.is_default,
            order_billing_flag: element.billing_flag,
            per_or_fixed: element.per_or_fixed,
            charge_id: element.charge_id,
            is_tax_included: element.is_tax_included,
            calculated_tax: element.calculated_tax,
            tax_divided: element.tax_divided,
            tax_title: element.tax_title,
            tax_amount: element.tax_amount,
            extra_details: JSON.parse(element.extra_details),
          };
          await BillCharges.create(charge);
        });
      }
      // if (discountData.couponDisounthistorydata) {
      //   await addCouponhistory(discountData.couponDisounthistorydata);
      // }

      discountData.items.forEach(async (item) => {
        if (item.discount_rate !== 0) {
          await BillItem.update(
            {
              price: Number(item.item_price.toFixed(global.ROUNDOFF_UPTO)),
              total: Number(item.amount.toFixed(global.ROUNDOFF_UPTO)),
              tax_value: item.item_tax_value,
              total_with_tax: item.amount + item.item_tax_value,
              discount: item.pricebeforeDiscount - item.discounted_price,
              discounted_price: Number(
                item.discounted_price.toFixed(global.ROUNDOFF_UPTO),
              ),
              discount_rate: item.discount_rate,
              discount_type: item.discount_type,
            },
            {
              where: {
                orderMasterId: discountData.order_id,
                item_id: item.item_id,
              },
            },
          );
        }
      });
    }
    return 'success';
  } catch (err) {
    console.error(err);
  }
  return 'failure';
}

module.exports = {
  updatekotItems,
};
