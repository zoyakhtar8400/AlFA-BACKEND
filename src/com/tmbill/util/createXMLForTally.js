/* eslint-disable no-param-reassign */
/* eslint-disable prefer-template */
/* eslint-disable camelcase */
const { XMLBuilder } = require('fast-xml-parser');
const { EXPORT_TALLY_REPORT } = require('./IPC_Messages');

const food_types = ['', 'Veg', 'Non Veg', 'Egg', 'Other'];

async function createXmlForOrder(order) {
  function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = '0' + num;
    return num;
  }
  const bill_number = pad(order.bill_number, 9);
  const formattedDate = window.moment(order.created_time).format('YYYYMMDD');

  const itemsList = [];
  const paymentsList = [];
  const stockItemsList = [];
  function addItemToVoucer(item) {
    const itemamount = item.total.toFixed(window.ROUNDOFF_UPTO);

    let itemTitle = item.title;
    let optionsTitle = '';
    let optionTitlelist = [];
    if (
      item.has_options &&
      item.extra_details &&
      item.extra_details.baseTitle
    ) {
      itemTitle = item.extra_details.baseTitle;
      if (item.order_option_list && item.order_option_list.length) {
        item.order_option_list.forEach((i) => {
          // optionsTitle = optionsTitle + ', ' + i.title;
          optionTitlelist.push(i.title);
        });
        if (optionTitlelist && optionTitlelist.length) {
          optionsTitle = optionTitlelist.join(',');
        }
      }
    }
    const itemObj = {
      STOCKITEMNAME: itemTitle,
      ISDEEMEDPOSITIVE: 'NO',
      RATE: `${item.price}/Nos`,
      AMOUNT: itemamount,
      ACTUALQTY: `${item.quantity} Nos`,
      BILLEDQTY: `${item.quantity} Nos`,
      'BATCHALLOCATIONS.LIST': {
        AMOUNT: itemamount,
        ACTUALQTY: item.quantity,
        BILLEDQTY: item.quantity,
      },
      'ACCOUNTINGALLOCATIONS.LIST': {
        LEDGERNAME: `${window.storeDetails.store_name} SALES`,
        ISDEEMEDPOSITIVE: 'NO',
        LEDGERFROMITEM: 'NO',
        ISLASTDEEMEDPOSITIVE: 'NO',
        AMOUNT: itemamount,
      },
      DESCRIPTION: optionsTitle,
    };
    itemsList.push(itemObj);
  }

  function addStockItemsToList(item) {
    const itemForFoodType = window.allItemsList.find(
      (element) => element?.item_refid === Number(item?.item_id),
    );
    const food_type = food_types[Number(itemForFoodType?.food_type)];
    let itemTitle = item.title;
    if (
      item.has_options &&
      item.extra_details &&
      item.extra_details.baseTitle
    ) {
      itemTitle = item.extra_details.baseTitle;
    }
    const itemObj = {
      '@@NAME': itemTitle,
      '@@RESERVEDNAME': '',
      PARENT: food_type.toUpperCase(),
      CATEGORY: item.category_name,
      BASEUNITS: 'Nos',
      'LANGUAGENAME.LIST': {
        'NAME.LIST': {
          '@@TYPE': 'String',
        },
        NAME: itemTitle,
        LANGUAGEID: item.price,
      },
    };
    stockItemsList.push(itemObj);
  }

  // function addOptionsTovoucher(addon) {
  //   const optionObj = {
  //     STOCKITEMNAME: addon.title,
  //     ISDEEMEDPOSITIVE: 'NO',
  //     RATE: `0/Nos`,
  //     AMOUNT: 0,
  //     ACTUALQTY: `${addon.qty} Nos`,
  //     BILLEDQTY: `${addon.qty} Nos`,
  //     'BATCHALLOCATIONS.LIST': {
  //       AMOUNT: 0,
  //       ACTUALQTY: addon.qty,
  //       BILLEDQTY: addon.qty,
  //     },
  //     'ACCOUNTINGALLOCATIONS.LIST': {
  //       LEDGERNAME: `${window.storeDetails.store_name} SALES`,
  //       ISDEEMEDPOSITIVE: 'NO',
  //       LEDGERFROMITEM: 'NO',
  //       ISLASTDEEMEDPOSITIVE: 'NO',
  //       AMOUNT: 0,
  //     },
  //   };
  //   itemsList.push(optionObj);
  // }

  function addOrderLevelChargesToVoucer(charge) {
    let { value } = charge;
    if (charge.calculated_tax) {
      value = Number((value - charge.calculated_tax).toFixed(ROUNDOFF_UPTO));
    }
    const orderChargeObj = {
      STOCKITEMNAME: charge.title,
      ISDEEMEDPOSITIVE: 'NO',
      RATE: `${value}/Nos`,
      AMOUNT: value,
      ACTUALQTY: `1 Nos`,
      BILLEDQTY: `1 Nos`,
      'BATCHALLOCATIONS.LIST': {
        AMOUNT: value,
        ACTUALQTY: 1,
        BILLEDQTY: 1,
      },
      'ACCOUNTINGALLOCATIONS.LIST': {
        LEDGERNAME: `${window.storeDetails.store_name} SALES`,
        ISDEEMEDPOSITIVE: 'NO',
        LEDGERFROMITEM: 'NO',
        ISLASTDEEMEDPOSITIVE: 'NO',
        AMOUNT: value,
      },
    };
    itemsList.push(orderChargeObj);
  }

  function addItemLevelChargesToVoucer(charge) {
    const itemChargeObj = {
      STOCKITEMNAME: charge.charge_title,
      ISDEEMEDPOSITIVE: 'NO',
      RATE: `${charge.calculated_charge}/Nos`,
      AMOUNT: charge.calculated_charge,
      ACTUALQTY: `1 Nos`,
      BILLEDQTY: `1 Nos`,
      'BATCHALLOCATIONS.LIST': {
        AMOUNT: charge.calculated_charge,
        ACTUALQTY: 1,
        BILLEDQTY: 1,
      },
      'ACCOUNTINGALLOCATIONS.LIST': {
        LEDGERNAME: `${window.storeDetails.store_name} SALES`,
        ISDEEMEDPOSITIVE: 'NO',
        LEDGERFROMITEM: 'NO',
        ISLASTDEEMEDPOSITIVE: 'NO',
        AMOUNT: charge.calculated_charge,
      },
    };
    itemsList.push(itemChargeObj);
  }

  // item list
  order.orderchildList.forEach((item) => {
    addItemToVoucer(item);
    addStockItemsToList(item);
    // if (item.order_option_list && item.order_option_list.length) {
    //   item.order_option_list.forEach((option) => {
    //     addOptionsTovoucher(option);
    //   });
    // }
    if (item.itemlevelCharges && item.itemlevelCharges.length) {
      item.itemlevelCharges.forEach((charge) => {
        addItemLevelChargesToVoucer(charge);
      });
    }
  });

  if (order.all_charge_order_list && order.all_charge_order_list.length) {
    order.all_charge_order_list.forEach((charge) => {
      if (charge.status_flag == 0) {
        addOrderLevelChargesToVoucer(charge);
      }
    });
  }

  // item list end

  // ledger entry list
  function addTaxLedgerEntry(tax) {
    const taxLedger = {
      LEDGERNAME: tax.name,
      ISDEEMEDPOSITIVE: 'No',
      ISLASTDEEMEDPOSITIVE: 'No',
      ISPARTYLEDGER: 'no',
      AMOUNT: tax.value,
    };

    paymentsList.push(taxLedger);
  }

  function addPaymentLedgerEntry(payment) {
    const paymentObj = {
      LEDGERNAME: payment.payment_option,
      POSPAYMENTTYPE: payment.payment_option,
      ISDEEMEDPOSITIVE: 'YES',
      ISLASTDEEMEDPOSITIVE: 'YES',
      AMOUNT: `-${payment.amount}`,
    };
    paymentsList.push(paymentObj);
  }

  if (order.orderPaymentList && order.orderPaymentList.length) {
    order.orderPaymentList.forEach((payment) => {
      addPaymentLedgerEntry(payment);
    });
  }

  if (
    order.order_level_total_taxes &&
    order.extra_details &&
    order.extra_details.tax
  ) {
    let { order_level_total_taxes } = order;
    if (order.charges_level_total_tax) {
      order_level_total_taxes += order.charges_level_total_tax;
    }
    if (order.extra_details.tax[0].taxDivided) {
      const tax_percentage = order.extra_details.tax[0].tax_percent / 2;
      const value = Number(Number(order_level_total_taxes) / 2).toFixed(
        window.ROUNDOFF_UPTO,
      );
      const SGSTTax = {
        name: `CGST @${tax_percentage}%`,
        value,
      };
      addTaxLedgerEntry(SGSTTax);
      const CGSTTax = {
        name: `SGST @${tax_percentage}%`,
        value,
      };
      addTaxLedgerEntry(CGSTTax);
    } else {
      const tax = {
        name: order.extra_details.tax[0].name,
        value: order_level_total_taxes,
      };
      addTaxLedgerEntry(tax);
    }
  }

  if (Number(order.discount)) {
    const title = order.discount_title ? order.discount_title : 'Discount';
    const discount = {
      name: title,
      value: `-${Number(order.discount)}`,
    };
    addTaxLedgerEntry(discount);
  }

  if (Number(order.couponDisounttotal)) {
    const title = order.coupon ? order.coupon : 'Coupon Discount';
    const discount = {
      name: title,
      value: `-${Number(order.couponDisounttotal)}`,
    };
    addTaxLedgerEntry(discount);
  }

  if (order?.extra_details?.roundedAmount) {
    const title = 'ROUNDOFF';
    const roundedAmount = {
      name: title,
      value: `${Number(order?.extra_details?.roundedAmount)}`,
    };
    addTaxLedgerEntry(roundedAmount);
  }

  const xmlObject = {
    ENVELOPE: {
      HEADER: {
        TALLYREQUEST: 'IMPORT DATA',
      },
      BODY: {
        IMPORTDATA: {
          REQUESTDESC: {
            REPORTNAME: 'ALL MASTERS',
            STATICVARIABLES: {
              SVCURRENTCOMPANY: window.storeDetails.store_name,
            },
          },
          REQUESTDATA: {
            TALLYMESSAGE: {
              '@@xmlns:UDF': 'TallyUDF',
              STOCKITEM: stockItemsList,
              VOUCHER: {
                '@@REMOTEID': `${window.storeDetails.store_id}-${order.order_id}-${bill_number}`,
                '@@VCHKEY': `${window.storeDetails.store_id}-${order.order_id}:${bill_number}`,
                '@@VCHTYPE': 'POS Sales',
                '@@ACTION': order?.extra_details?.isModifiedBill
                  ? 'alter'
                  : 'Create',
                '@@OBJVIEW': 'Invoice Voucher View',
                DATE: formattedDate,
                GUID: `${window.storeDetails.store_id}-${order.order_id}-${bill_number}`,
                STATENAME: window.storeDetails.country,
                COUNTRYOFRESIDENCE: window.storeDetails.country,
                PLACEOFSUPPLY: window.storeDetails.country,
                POSCASHLEDGER: order.payment,
                POSCARDLEDGER: '',
                VOUCHERTYPENAME: `Voucher ${window.storeDetails.store_name} Sales`,
                VOUCHERNUMBER: order.bill_number,
                NUMBERINGSTYLE: 'Manual',
                PERSISTEDVIEW: 'Invoice Voucher View',
                'ALLINVENTORYENTRIES.LIST': itemsList,
                LEDGERENTRIES: paymentsList,
              },
            },
          },
        },
      },
    },
  };

  const builder = new XMLBuilder({
    // oneListGroup: true,
    // arrayMode: true,
    ignoreAttributes: false,
    attributeNamePrefix: '@@',
    format: true,
  });
  const xmlContent = builder.build(xmlObject);

  // let formattedxml = prettifyXml(xmlContent);
  await window.betteripcRenderer.callMain(EXPORT_TALLY_REPORT, {
    content: xmlContent,
    order_id: order.order_id,
  });
}

module.exports = {
  createXmlForOrder,
};
