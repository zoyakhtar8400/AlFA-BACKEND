const { default: axios } = require('axios');
const { showLoader } = require('../CommonUtils');
const { default: Swal } = require('sweetalert2');
const {
  getHeadersformposforrender,
} = require('../../util/MiscServer.renderer');
const { calculateTaxForItem } = require('../calculations');
const { apiCall } = require('../../services/APIService');
const {
  makeSaveIRNResponserequest,
} = require('../../renderer/helper/Receipt.helper');
const {
  initializei18nforIRNModal
} = require('../i18controller');
$('#IRNmodal').on('shown.bs.modal', function () {
  initializei18nforIRNModal();
});

window.irnscriptLoaded = true;
let orderItems;
let isIgst = false;
let orderRef_id;
let order_data;
let rounded_amt;
let chargeHSNCode;

async function Initialize() {
  //set date
  $('#irnDocumentdateField').daterangepicker({
    timePicker: true,
    singleDatePicker: true,
    startDate: moment(),
    locale: {
      format: 'DD/MM/YYYY',
    },
  });

  $('#docTypeDropdownid').val('INV');
  $('#docTypeStoreId').val(window.storeDetails.store_id);
  $('#transDetailSupplieTypeid').val('B2B');
  //select radio group
  $('#tax_liablity_option_1').attr('checked', true);
  $('#IgstOnIntra_option_1').attr('checked', true);

  //seller details

  let extra_info = JSON.parse(storeDetails.extra_info);
  $('#sellerLegalNameid').val(window.storeDetails.store_name);
  $('#sellerGstid').val(extra_info.gstNo);
  $('#selleraddrOneid').val(window.storeDetails.user_line_1);
  $('#sellerPincodeid').val(extra_info.pincode);
  $('#sellerPhoneid').val(window.storeDetails.store_phone);
  $('#sellerTraderNameid').val(window.storeDetails.store_name);
  $('#sellerlocationid').val(window.storeDetails.user_city);
  $('#sellerAdddressTwoid').val(window.storeDetails.user_line_2);
  $('#sellerStateCodeid').val();
  $('#sellerEmailid').val(window.storeDetails.user_email);

  let supplierStateCode =
    extra_info && extra_info.gstNo && extra_info.gstNo.substring(0, 2);
  $('#sellerStateCodeid').val(supplierStateCode);

  //set state code and pos code to buyer details
  let buyergstNo = $('#buyerGstid').val();
  let state_code = buyergstNo.substring(0, 2);
  $('#buyerStatecodeid').val(state_code);
  $('#buyerPoscodeid').val(supplierStateCode);

  let pos_code = $('#buyerPoscodeid').val();

  if (pos_code != supplierStateCode) {
    isIgst = true;
  } else {
    isIgst = false;
  }

  let details = $('#IRNmodalBodyid')[0];
  order_data = JSON.parse(details.getAttribute('data'));
  let order_date = moment(order_data.created_time).format('DD/MM/yyyy');
  $('#irnDocumentdateField').val(order_date);
  rounded_amt = order_data.extra_details.roundedAmount;

  orderRef_id = order_data.order_id;
  //setting value details
  let roundOffamt =
    order_data.extra_details && order_data.extra_details.roundedAmount;
  let totalAccessAmt =
    order_data.order_total -
    Number(order_data.order_level_total_taxes) -
    Number(order_data.charges_level_total_tax) -
    Number(roundOffamt);
  // $('#totalAccesableAmtid').val(order_data.order_subtotal- Number(order_data.discount));
  $('#totalAccesableAmtid').val(totalAccessAmt.toFixed(ROUNDOFF_UPTO));

  let totTax =
    Number(order_data.charges_level_total_tax) +
    Number(order_data.order_level_total_taxes);
  if (isIgst) {
    $('#totalCgstValueid').val(0);
    $('#totalSgstValueid').val(0);
    // $('#totalIgstvalueid').val(order_data.order_level_total_taxes);
    $('#totalIgstvalueid').val(totTax);
  } else {
    $('#totalIgstvalueid').val(0);
    // $('#totalCgstValueid').val((order_data.order_level_total_taxes/2).toFixed(2));
    // $('#totalSgstValueid').val((order_data.order_level_total_taxes/2).toFixed(2));
    $('#totalCgstValueid').val((totTax / 2).toFixed(2));
    $('#totalSgstValueid').val((totTax / 2).toFixed(2));
  }
  $('#totalcessid').val(0);
  $('#totalCessofitemid').val(0);
  // $('#discountValueid').val(order_data.discount);
  $('#discountValueid').val(0);
  // $('#totalChargesValueId').val(Number(order_data.order_level_total_charges) + Number(order_data.item_level_total_charges));
  $('#totalChargesValueId').val(0);
  $('#roundedoffamtValueid').val(rounded_amt || 0);
  $('#finalInvoiceValueid').val(order_data.order_total);
  $('#finalinvoicevalueinOthCurrencyid').val(0);

  $("[data-card-widget='collapse']").on('click', function () {
    //Find the box parent
    let card = $(this).parents('.card').first();
    //Find the body and the footer
    let cardBody = card.find('.card-body');
    if (!card.hasClass('collapsed-box')) {
      card.addClass('collapsed-box');
      $(this).children().addClass('fa-minus');
      $(this).children().removeClass('fa-plus');
      cardBody.show();
    } else {
      card.removeClass('collapsed-box');
      $(this).children().addClass('fa-plus');
      $(this).children().removeClass('fa-minus');
      cardBody.hide();
    }
  });

  //   $("[data-card-widget='collapse']").on("click",function() {
  //     let cardBody = $(this).parent().parent().siblings(".card-body");
  //     if (!cardBody.hasClass("collapsed-card")) {
  //         cardBody.addClass("collapsed-card");
  //         $(this).children().addClass('fa-minus');
  //         $(this).children().removeClass('fa-plus');
  //         cardBody.hide();
  //     } else {
  //         cardBody.removeClass("collapsed-card");
  //         $(this).children().addClass('fa-plus');
  //         $(this).children().removeClass('fa-minus');
  //         cardBody.show();
  //     }
  // });

  $('#buyerGstid').on('change', () => {
    let buyergstNo = $('#buyerGstid').val();
    let state_code = buyergstNo.substring(0, 2);
    $('#buyerStatecodeid').val(state_code);
    $('#buyerPoscodeid').val(state_code);

    if (state_code !== supplierStateCode) {
      isIgst = true;
    } else {
      isIgst = false;
    }

    if (isIgst) {
      $('#totalCgstValueid').val(0);
      $('#totalSgstValueid').val(0);
      $('#totalIgstvalueid').val(order_data.order_level_total_taxes);
    } else {
      $('#totalIgstvalueid').val(0);
      $('#totalCgstValueid').val(
        (order_data.order_level_total_taxes / 2).toFixed(2),
      );
      $('#totalSgstValueid').val(
        (order_data.order_level_total_taxes / 2).toFixed(2),
      );
    }
  });

  $('#sellerGstid').on('change', () => {
    let sellerGstNO = $('#sellerGstid').val();
    let state_code = sellerGstNO.substring(0, 2);
    $('#sellerStateCodeid').val(state_code);

    let buyerGstNo = $('#buyerStatecodeid').val();
    if (state_code !== buyerGstNo) {
      isIgst = true;
    } else {
      isIgst = false;
    }

    if (isIgst) {
      $('#totalCgstValueid').val(0);
      $('#totalSgstValueid').val(0);
      $('#totalIgstvalueid').val(order_data.order_level_total_taxes);
    } else {
      $('#totalIgstvalueid').val(0);
      $('#totalCgstValueid').val(
        (order_data.order_level_total_taxes / 2).toFixed(2),
      );
      $('#totalSgstValueid').val(
        (order_data.order_level_total_taxes / 2).toFixed(2),
      );
    }
  });

  //get customer data
  let selectedCustomer;
  if (order_data && order_data.phone) {
    selectedCustomer = _.find(window.customersList, {
      phone: order_data.phone,
    });
    if (selectedCustomer) {
      $('#buyerLegalNameid').val(selectedCustomer.name);
      $('#buyerGstid').val(selectedCustomer.gstno);
      $('#buyerAddrOneid').val(selectedCustomer.address_line1);
      $('#buyerPincodeid').val(selectedCustomer.pincode);
      $('#buyerPhoneid').val(selectedCustomer.phone);
      $('#buyerTradernameid').val(selectedCustomer.name);
      $('#buyerLocationid').val(selectedCustomer.city);
      $('#buyerAddrTwoid').val(selectedCustomer.address_line2);
      // $('#buyerStatecodeid').val(selectedCustomer);
      // $('#buyerPoscodeid').val(selectedCustomer);
      $('#buyerEmailid').val(selectedCustomer.email);
    }
  }

  function calculateTaxForItem(item) {
    if (Number(item.item_tax_method)) {
      taxTotal = 0;
      let taxPerct;
      if (item.item_is_devidable) {
        taxPerct = Number(
          (
            (item.price / (100 + item.tax_per / 2)) *
            (item.tax_per / 2)
          ).toFixed(ROUNDOFF_UPTO),
        );

        taxTotal = Number((taxTotal + taxPerct * 2).toFixed(ROUNDOFF_UPTO));
      } else {
        taxTotal = Number(
          (
            taxTotal +
            (item.price / (100 + item.tax_per)) * item.tax_per
          ).toFixed(ROUNDOFF_UPTO),
        );
      }
      return taxTotal;
    } else {
      taxTotal = 0;
      let taxPerct;
      if (item.item_is_devidable) {
        taxPerct = Number(
          (
            (item.tax_per / 2 / 100) *
            (Number(item.pricebeforeDiscount) * Number(item.quantity) -
              item.order_level_discount)
          ).toFixed(ROUNDOFF_UPTO),
        );
        taxTotal = Number((taxTotal + taxPerct * 2).toFixed(ROUNDOFF_UPTO));
      } else {
        taxTotal = Number(
          (
            taxTotal +
            ((Number(item.pricebeforeDiscount) * Number(item.quantity) -
              item.order_level_discount) *
              item.tax_per) /
              100
          ).toFixed(ROUNDOFF_UPTO),
        );
      }
      return taxTotal;
    }
  }

  function calculateItemlevelcharges(item) {
    let totalItemLevelCharges = 0;
    if (item && item.itemlevelCharges && item.itemlevelCharges.length) {
      item.itemlevelCharges.forEach((charge) => {
        let chargeAmount = charge.amount;
        if (charge.per_or_fixed == 1) {
          chargeAmount = (
            ((item.pricebeforeDiscount
              ? item.pricebeforeDiscount
              : item.price) *
              item.quantity *
              chargeAmount) /
            100
          ).toFixed(ROUNDOFF_UPTO);
        }
        totalItemLevelCharges = totalItemLevelCharges + chargeAmount;
      });
    }
    Object.assign(item, { item_level_charges_total: totalItemLevelCharges });
  }

  orderItems = order_data.items;
  chargeHSNCode = orderItems[0].hsn_code;
  let splittedDiscountamount =
    Number(order_data.discount) / Number(order_data.order_subtotal);
  // let discountAmounttominus = Number(order_data.discount) / orderItems.length;
  $('#irnItemDetailstableid').find('tr').remove();
  if (orderItems) {
    orderItems.map((item, i) => {
      //previous one
      // calculateItemlevelcharges(item)
      // Object.assign(item, { total:Number(item.total) + Number(item.item_level_charges_total) })
      // let discountAmounttominus = (Number(item.total) * splittedDiscountamount);
      // discountAmounttominus = discountAmounttominus.toFixed(ROUNDOFF_UPTO);
      // Object.assign(item,{discount: item.discount + Number(discountAmounttominus), order_level_discount:Number(discountAmounttominus) })

      // let tax =  calculateTaxForItem(item)
      //  Object.assign(item, {tax_value:tax})
      // // let recalculatedAmount = item.total_with_tax ? item.total_with_tax - (item.discount + Number(discountAmounttominus)) : discountAmounttominus;
      // let total_with_tax = item.total + tax - (item.discount + Number(discountAmounttominus))
      // total_with_tax = total_with_tax + ( Number(discountAmounttominus))
      // total_with_tax = Number(total_with_tax).toFixed(ROUNDOFF_UPTO)
      // Object.assign(item, {total_with_tax:total_with_tax})
      // Object.assign(item, {srNo: i+1, unit:'PCS', isIgst});
      // additemRow(item, i)

      //latest one
      // let discount = 0;
      // let itemSubTotal = Number(item.price) * Number(item.quantity);
      // let chargeAmounttoadd = 0;
      // item.itemlevelCharges.forEach((charge)=>{
      //   chargeAmounttoadd = charge.calculated_charge ? charge.calculated_charge : 0;
      //   if(charge.tax_amount && charge.calculated_tax > 0 && charge.is_tax_included == 0){
      //     chargeAmounttoadd = chargeAmounttoadd - charge.calculated_tax
      //   }
      //   let attribute = {};
      //   Object.assign(attribute, {Nm: charge.title, Val:charge.calculated_charge})
      //   // item
      // })
      // calculateItemlevelcharges(item)
      // Object.assign(item, { total:Number(item.total) + Number(item.item_level_charges_total) })
      // let discountAmounttominus = (Number(item.total) * splittedDiscountamount);
      // discountAmounttominus = discountAmounttominus.toFixed(ROUNDOFF_UPTO);
      // Object.assign(item,{discount: item.discount + Number(discountAmounttominus), order_level_discount:Number(discountAmounttominus) })

      // let tax =  calculateTaxForItem(item)
      //  Object.assign(item, {tax_value:tax})
      // // let recalculatedAmount = item.total_with_tax ? item.total_with_tax - (item.discount + Number(discountAmounttominus)) : discountAmounttominus;
      // let total_with_tax = item.total + tax - (item.discount + Number(discountAmounttominus))
      // total_with_tax = total_with_tax + ( Number(discountAmounttominus))
      // total_with_tax = Number(total_with_tax).toFixed(ROUNDOFF_UPTO)
      // Object.assign(item, {total_with_tax:total_with_tax})
      Object.assign(item, { srNo: i + 1, unit: 'PCS', isIgst });
      additemRow(item, i);
    });

    order_data.tmpos_order_charges &&
      order_data.tmpos_order_charges.map((charge) => {
        let itempay = {
          srNo: orderItems.length + 1,
          // UnitPrice:item.price,
          // UnitPrice:item.pricebeforeDiscount,
          id: 0,
          item_id: 0,
          food_type: 0,
          discount: 0,
          image_url: '',
          price: (charge.value - charge.calculated_tax).toFixed(ROUNDOFF_UPTO),
          quantity: 1,
          title: charge.title,
          total: (charge.value - charge.calculated_tax).toFixed(ROUNDOFF_UPTO),
          total_with_tax: charge.value,
          tax_per: charge.tax_amount,
          tax_value: charge.calculated_tax,
          tax_method: charge.is_tax_included,
          is_devidable: 0,
          item_note: '',
          product_group_id: 0,
          product_group_name: 0,
          discount_type: 0,
          is_update_item_id: 0,
          tax_name: charge.tax_title,
          hsn_code: chargeHSNCode,
          category_name: 0,
          short_code: 0,
          kitchen_dept: 0,
          item_level_charges: [],
        };
        orderItems.push(itempay);
      });
  }

  //click on view item details
  $('.viewIRNItemdetailsid').on('click', function () {
    let data = $(this)[0];
    let itemDeatils = data.getAttribute('data');
    if (window.itmedetailsScriptLoaded) {
      $('#IRNItemmodalBodyid').attr('data', JSON.stringify(itemDeatils));
      $('#IRNItemmodal').modal('show');
    } else {
      $('#IRNItemDetailsmodalBodyid').load(
        'IRNItemDetails.html',
        async function () {
          $('#IRNItemmodalBodyid').attr('data', JSON.stringify(itemDeatils));
          $('#IRNItemmodal').modal('show');
        },
      );
    }
  });

  //document number
  let date = new Date();
  let year = date.getFullYear();
  let month = date.getMonth();
  if (month < 10) {
    month = `0${month + 1}`;
  } else {
    month = month + 1;
  }
  // let bill_number= '0000'.substring( String(order_data.bill_number).length ) + order_data.bill_number;

  // // let documentNumber = `No/${year}/${month}/${bill_number}`;
  // let initialId = nanoid();
  // initialId = initialId.toUpperCase()
  // let documentNumber = `${initialId}/${bill_number}`
  let documentNumber = order_data.custom_bill_number;
  // let documentNumber = `${year}/${month}/${bill_number}`;
  $('#documentDeatilsNumberid').val(documentNumber);

  $('#generateIrnbuttonId').on('click', () => {
    callgenerateIRNAPI();
  });
}

function additemRow(data, index) {
  let table = $('#irnItemDetailstableid');
  let itemdetails = JSON.stringify(data);

  table.append(
    '<tr ><td>' +
      `${Number(index) + 1}` +
      '</td><td>' +
      (data.hsn_code !== null ? data.hsn_code : '') +
      '</td><td>' +
      data.title +
      '</td><td>' +
      data.quantity +
      '</td><td>' +
      //   + data.quantity
      data.unit +
      '</td><td>' +
      data.price +
      '</td><td>' +
      data.discount +
      '</td><td>' +
      data.tax_per +
      '</td><td>' +
      `<i class='fas fa-eye viewIRNItemdetailsid' data='${itemdetails}'></i>` +
      '</td>',
  );
}

function updateUnit(item, unit) {
  let itemfound = undefined;
  itemfound = _.find(orderItems, { item_id: item.item_id });
  itemfound.unit = unit;
  $('#irnItemDetailstableid').find('tr').remove();
  orderItems.map((item, i) => {
    Object.assign(item, { srNo: i + 1 });
    additemRow(item, i);
  });

  $('.viewIRNItemdetailsid').on('click', function () {
    let data = $(this)[0];
    let itemDeatils = data.getAttribute('data');
    if (window.itmedetailsScriptLoaded) {
      $('#IRNItemmodalBodyid').attr('data', JSON.stringify(itemDeatils));
      $('#IRNItemmodal').modal('show');
      // openGenerateIrnModal();
    } else {
      $('#IRNItemDetailsmodalBodyid').load(
        'IRNItemDetails.html',
        async function () {
          $('#IRNItemmodalBodyid').attr('data', JSON.stringify(itemDeatils));
          $('#IRNItemmodal').modal('show');
        },
      );
    }
  });
}

async function callgenerateIRNAPI() {
  //let payload values
  let payload = {};
  //DocDtls
  let Version = '1.1';
  Object.assign(payload, { Version });
  let docType = $('#docTypeDropdownid').val();
  let docNumber = $('#documentDeatilsNumberid').val();
  let date = $('#irnDocumentdateField').val();

  let DocDtls = {
    Typ: docType,
    No: docNumber,
    Dt: date,
  };

  Object.assign(payload, { DocDtls });

  //transaction details
  let TaxSch = 'GST';
  let SupTyp = $('#transDetailSupplieTypeid').val();
  let RegRev = document.querySelector(
    'input[name="tax_liablity"]:checked',
  ).value;
  let IgstOnIntra = document.querySelector(
    'input[name="IgstOnIntra"]:checked',
  ).value;

  let TranDtls = {
    TaxSch,
    SupTyp,
    RegRev,
    IgstOnIntra,
  };

  Object.assign(payload, { TranDtls });

  //seller details
  let Gstin = $('#sellerGstid').val();
  let LglNm = $('#sellerLegalNameid').val();
  let TrdNm = $('#sellerTraderNameid').val();
  let Addr1 = $('#selleraddrOneid').val();
  let Addr2 = $('#sellerAdddressTwoid').val();
  let Loc = $('#sellerlocationid').val();
  let Stcd = $('#sellerStateCodeid').val();
  let Ph = $('#sellerPhoneid').val();
  let Em = $('#sellerEmailid').val();
  let Pin = Number($('#sellerPincodeid').val());

  if (!Gstin) {
    window.notifyUser.showMessage('error', 'Please add seller GST number');
    return;
  }

  if (Gstin) {
    if (!/[0-9]{2}[0-9A-Z]{13}/.test(Gstin)) {
      window.notifyUser.showMessage(
        'error',
        'Please enter valid seller GST number',
      );
      return;
    }
    if (Gstin.length > 15 || Gstin.length < 3) {
      window.notifyUser.showMessage(
        'error',
        'Please enter valid seller GST number',
      );
      return;
    }
  }

  if (!LglNm) {
    window.notifyUser.showMessage('error', 'Please enter seller legal name');
    return;
  }

  if (LglNm.length > 100 || LglNm.length < 3) {
    window.notifyUser.showMessage(
      'error',
      'seller legal name length should be in between 3 to 100 letters',
    );
    return;
  }
  if (TrdNm) {
    if (TrdNm.length > 100 || TrdNm.length < 3) {
      window.notifyUser.showMessage(
        'error',
        'Seller trade name length should be in between 3 to 100 letters',
      );
      return;
    }
  }
  if (!Addr1) {
    window.notifyUser.showMessage('error', 'Please enter seller address 1');
    return;
  }

  if (Addr1) {
    if (Addr1.length > 100 || Addr1.length < 3) {
      window.notifyUser.showMessage(
        'error',
        'Sellet address one length should be in between 3 to 100 letters',
      );
      return;
    }
  }

  if (Addr2) {
    if (Addr2.length > 100 || Addr2.length < 3) {
      window.notifyUser.showMessage(
        'error',
        'Sellet address two length should be in between 3 to 100 letters',
      );
      return;
    }
  }

  if (!Ph) {
    window.notifyUser.showMessage('error', 'Please enter seller mobile number');
    return;
  }

  if (isNaN(Ph)) {
    window.notifyUser.showMessage(
      'error',
      'Please enter valid seller mobile number',
    );
    return;
  }

  if (!Pin) {
    window.notifyUser.showMessage('error', 'Please add seller pincode');
    return;
  }

  if (Pin) {
    if (Pin.length > 6 || Pin.length < 6) {
      window.notifyUser.showMessage(
        'error',
        'Seller pincode should be of 6 digit',
      );
      return;
    }

    if (isNaN(Pin)) {
      window.notifyUser.showMessage(
        'error',
        'Please enter valid seller pincode',
      );
      return;
    }
  }

  if (!Loc) {
    window.notifyUser.showMessage('error', 'Please add seller location');
    return;
  }

  if (Loc) {
    if (Loc.length > 50 || Loc.length < 3) {
      window.notifyUser.showMessage(
        'error',
        'Seller location length should be in between 3 to 50 letters',
      );
      return;
    }
  }

  let sellerDetails = {
    Gstin,
    LglNm,
    TrdNm,
    Addr1,
    Addr2,
    Loc,
    Stcd,
    Ph,
    Em,
    Pin,
  };
  let sellerNullCheck = Object.keys(sellerDetails).filter(
    (key) => sellerDetails[key] === '' || sellerDetails[key] === null,
  );

  sellerNullCheck.forEach((i) => {
    delete sellerDetails[i];
  });

  Object.assign(payload, { SellerDtls: sellerDetails });

  //buyer details
  let buyerGstin = $('#buyerGstid').val();
  let buyerLglNm = $('#buyerLegalNameid').val();
  let buyerTrdNm = $('#buyerTradernameid').val();
  let buyerAddr1 = $('#buyerAddrOneid').val();
  let buyerAddr2 = $('#buyerAddrTwoid').val();
  let buyerLoc = $('#buyerLocationid').val();
  let buyerStcd = $('#buyerStatecodeid').val();
  let buyerPh = $('#buyerPhoneid').val();
  let buyerEm = $('#buyerEmailid').val();
  let buyerpin = Number($('#buyerPincodeid').val());
  let Pos = $('#buyerPoscodeid').val();

  if (!buyerGstin) {
    window.notifyUser.showMessage('error', 'Please add buyer GST number');
    return;
  }

  if (buyerGstin) {
    if (!/[0-9]{2}[0-9A-Z]{13}/.test(buyerGstin)) {
      window.notifyUser.showMessage(
        'error',
        'Please enter valid buyer GST number',
      );
      return;
    }
    if (buyerGstin.length > 15 || buyerGstin.length < 3) {
      window.notifyUser.showMessage(
        'error',
        'Please enter valid buyer GST number',
      );
      return;
    }
  }

  if (!buyerLglNm) {
    window.notifyUser.showMessage('error', 'Please enter buyer legal name');
    return;
  }

  if (buyerLglNm.length > 100 || buyerLglNm.length < 3) {
    window.notifyUser.showMessage(
      'error',
      'Buyer legal name length should be in between 3 to 100 letters',
    );
    return;
  }
  if (buyerTrdNm) {
    if (buyerTrdNm.length > 100 || buyerTrdNm.length < 3) {
      window.notifyUser.showMessage(
        'error',
        'Buyer trade name length should be in between 3 to 100 letters',
      );
      return;
    }
  }

  if (!buyerLoc) {
    window.notifyUser.showMessage('error', 'Please add buyer location');
    return;
  }

  if (buyerLoc) {
    if (buyerLoc.length > 50 || buyerLoc.length < 3) {
      window.notifyUser.showMessage(
        'error',
        'Buyer location length should be in between 3 to 50 letters',
      );
      return;
    }
  }

  if (buyerAddr1) {
    if (buyerAddr1.length > 100 || buyerAddr1.length < 3) {
      window.notifyUser.showMessage(
        'error',
        'Buyer address one length should be in between 3 to 100 letters',
      );
      return;
    }
  }

  if (buyerAddr2) {
    if (buyerAddr2.length > 100 || buyerAddr2.length < 3) {
      window.notifyUser.showMessage(
        'error',
        'Buyer address two length should be in between 3 to 100 letters',
      );
      return;
    }
  }

  if (!buyerpin) {
    window.notifyUser.showMessage('error', 'Please add buyer pincode');
    return;
  }

  if (buyerpin) {
    if (buyerpin.length > 6 || buyerpin.length < 6) {
      window.notifyUser.showMessage(
        'error',
        'Buyer pincode should be of 6 digit',
      );
      return;
    }

    if (isNaN(buyerpin)) {
      window.notifyUser.showMessage(
        'error',
        'Please enter valid Buyer pincode',
      );
      return;
    }
  }

  if (!buyerPh) {
    window.notifyUser.showMessage(
      'error',
      'Please enter valid Buyer mobile number',
    );
    return;
  }
  if (isNaN(buyerPh)) {
    window.notifyUser.showMessage(
      'error',
      'Please enter valid Buyer mobile number',
    );
    return;
  }

  let buyerDetails = {
    Gstin: buyerGstin,
    LglNm: buyerLglNm,
    TrdNm: buyerTrdNm,
    Addr1: buyerAddr1,
    Addr2: buyerAddr2,
    Loc: buyerLoc,
    Stcd: buyerStcd,
    Ph: buyerPh,
    Em: buyerEm,
    Pin: buyerpin,
    Pos,
  };

  let buyerNullCheck = Object.keys(buyerDetails).filter(
    (key) => buyerDetails[key] === '' || buyerDetails[key] === null,
  );

  buyerNullCheck.forEach((i) => {
    delete buyerDetails[i];
  });

  Object.assign(payload, { BuyerDtls: buyerDetails });
  //dispatch details
  let dispatchDetailName = $('#dispatchDetailNameid').val();
  let dispatchLocation = $('#dispatchDetailNameid').val();
  let dispatchAddrone = $('#dispatchDetailAddroneid').val();
  let dispatchAddrtwo = $('#dispatchDetailAddrtwoid').val();
  let dispatchPincode = $('#dispatchDetailsPincodeid').val();
  let dispatchStateCode = $('#dispatchDetailStateid').val();

  if (
    dispatchDetailName ||
    dispatchLocation ||
    dispatchAddrone ||
    dispatchAddrtwo ||
    dispatchPincode ||
    dispatchStateCode
  ) {
    if (
      !dispatchDetailName ||
      !dispatchLocation ||
      !dispatchAddrone ||
      !dispatchPincode ||
      !dispatchStateCode
    ) {
      window.notifyUser.showMessage(
        'error',
        'Please enter all dispatch details or remove all dispatch details',
      );
      return;
    }
  }

  let DispDtls = {
    Nm: dispatchDetailName,
    Addr1: dispatchAddrone,
    Addr2: dispatchAddrtwo,
    Loc: dispatchLocation,
    Pin: dispatchPincode,
    Stcd: dispatchStateCode,
  };

  let dispatchNullCheck = Object.keys(DispDtls).filter(
    (key) => DispDtls[key] === '' || DispDtls[key] === null,
  );

  dispatchNullCheck.forEach((i) => {
    delete DispDtls[i];
  });

  if (Object.keys(DispDtls).length) {
    Object.assign(payload, { DispDtls });
  }

  //shifment details
  let shipmentGst = $('#shipmentDetailgstid').val();
  let shipmentLocation = $('#shipmentDetailLocationid').val();
  let shipmentlegalName = $('#shipmentDetailLegalnameid').val();
  let shipmentTradename = $('#shipmentDetailtradenameid').val();
  let shipmentAddrone = $('#shipmentDetailsaddroneid').val();
  let shipmentAddrtwo = $('#shipmentDetailsaddrtwoid').val();
  let shipmentpincode = $('#shipmentDetailsPincodeid').val();
  let shipmentStatecode = $('#shipmentDetailStatecodeid').val();

  if (shipmentGst) {
    if (!/[0-9]{2}[0-9A-Z]{13}/.test(shipmentGst)) {
      window.notifyUser.showMessage(
        'error',
        'Please enter valid shipment GST number',
      );
      return;
    }
  }

  if (
    shipmentGst ||
    shipmentLocation ||
    shipmentlegalName ||
    shipmentTradename ||
    shipmentAddrone ||
    shipmentAddrtwo ||
    shipmentpincode ||
    shipmentStatecode
  ) {
    if (
      !shipmentGst ||
      !shipmentLocation ||
      !shipmentlegalName ||
      !shipmentTradename ||
      !shipmentAddrone ||
      !shipmentpincode ||
      !shipmentStatecode
    ) {
      window.notifyUser.showMessage(
        'error',
        'Please enter all shipment details or remove all shipment details',
      );
      return;
    }
  }
  let ShipDtls = {
    Gstin: shipmentGst,
    LglNm: shipmentlegalName,
    TrdNm: shipmentTradename,
    Addr1: shipmentAddrone,
    Addr2: shipmentAddrtwo,
    Loc: shipmentLocation,
    Pin: shipmentpincode,
    Stcd: shipmentStatecode,
  };

  let shipmentNullCheck = Object.keys(ShipDtls).filter(
    (key) => ShipDtls[key] === '' || ShipDtls[key] === null,
  );

  shipmentNullCheck.forEach((i) => {
    delete ShipDtls[i];
  });

  if (Object.keys(ShipDtls).length) {
    Object.assign(payload, { ShipDtls });
  }
  // item payload
  let items = [];
  // let
  let total_calcuated_cgst = 0;
  let total_calculated_igst = 0;
  let totalDiscount = 0;
  let orderLevelDiscount = Number(order_data.discount);
  let orderSubTotal = Number(order_data.order_subtotal);
  let totalChargesAmountToAdd = 0;
  let totalAssAmount = 0;
  let chargeAttribute = {};
  orderItems.map((item) => {
    // let assamt =Number(item.total) - Number(item.discount)
    // let assamt =Number((Number(item.pricebeforeDiscount) * Number(item.quantity)) - Number(item.discount))
    let Discount = 0;
    let itemSubTotal = Number(item.price) * Number(item.quantity);
    // itemSubTotal = Number(itemSubTotal).toFixed(2)
    let chargeAmounttoadd = 0;
    item.itemlevelCharges &&
      item.itemlevelCharges.forEach((charge) => {
        chargeAmounttoadd = charge.calculated_charge
          ? charge.calculated_charge
          : 0;
        if (
          charge.tax_amount &&
          charge.calculated_tax > 0 &&
          charge.is_tax_included == 0
        ) {
          chargeAmounttoadd = chargeAmounttoadd - charge.calculated_tax;
          chargeAmounttoadd = Number(chargeAmounttoadd).toFixed(2);
        }
        chargeAttribute = {};
        Object.assign(chargeAttribute, {
          Nm: charge.title,
          Val: charge.calculated_charge,
        });
        // item
      });

    if (item.id !== 0) {
      Discount =
        (orderLevelDiscount / orderSubTotal) *
        (itemSubTotal + chargeAmounttoadd);
      Discount = roundAmountUptoDecimals(Discount, ROUNDOFF_UPTO);
    }

    // itemSubTotal = Number(itemSubTotal).toFixed(2)

    let assAmount = itemSubTotal - Discount;
    // let assamt =Number(Number(item.total) - Number(item.discount))
    // assamt = assamt.toFixed(ROUNDOFF_UPTO)
    // totalDiscount = totalDiscount + Number(item.discount);
    if (assAmount > 0) {
      let sgst = 0;
      let cgst = 0;
      let igst = 0;

      assAmount = itemSubTotal - Discount + chargeAmounttoadd;
      assAmount = Number(assAmount).toFixed(2);
      totalAssAmount += Number(assAmount);
      // let calculateditemTaxvalue = calculateTaxForItemHB(assAmount, item.tax_per, Number(item.tax_method), item.is_devidable);
      let asAmt = roundAmountUptoDecimals(assAmount, ROUNDOFF_UPTO);
      let calculateditemTaxvalue = calculateTaxForItemHB(
        asAmt,
        Number(item.tax_per),
        Number(item.tax_method),
        item.is_devidable,
      );
      calculateditemTaxvalue = roundAmountUptoDecimals(
        calculateditemTaxvalue,
        ROUNDOFF_UPTO,
      );
      // calculateditemTaxvalue = (Number(calculateditemTaxvalue).toFixed(3))
      if (!isIgst) {
        if (item.tax_value && item.is_devidable) {
          sgst = Number(calculateditemTaxvalue);
          cgst = Number(calculateditemTaxvalue);
          total_calcuated_cgst += Number(sgst);
        } else {
          let taxVal = roundAmountUptoDecimals(
            Number(calculateditemTaxvalue / 2),
            ROUNDOFF_UPTO,
          );

          sgst = Number(taxVal);
          cgst = Number(taxVal);
          total_calcuated_cgst += Number(sgst);
        }
      } else if (item.tax_value) {
        igst = calculateditemTaxvalue * 2;
        total_calculated_igst += Number(igst);
      }

      let unitPrice = item.price + Number(item.discount);
      let totalAmt = Number(assAmount) + Discount + Number(item.discount);
      let totalItemValue = Number(assAmount) + igst + cgst + sgst;
      totalItemValue = Number(totalItemValue).toFixed(2);
      totalChargesAmountToAdd = totalChargesAmountToAdd + chargeAmounttoadd;

      let itemLevlDiscount = Number(item.discount + Discount).toFixed(
        ROUNDOFF_UPTO,
      );

      let itempay = {
        SlNo: item.srNo,
        UnitPrice: Number(unitPrice).toFixed(2),
        TotAmt: Number(totalAmt).toFixed(2),
        IsServc: 'N',
        HsnCd: item.hsn_code,
        AssAmt: Number(assAmount).toFixed(2),
        GstRt: item.tax_per,
        TotItemVal: totalItemValue,
        PrdDesc: item.title,
        Barcde: null,
        Qty: item.quantity,
        FreeQty: 0,
        Unit: item.unit || 'PCS',
        // Discount:item.discount + Discount|| 0,
        Discount: itemLevlDiscount || 0,
        PreTaxVal: 0,
        // SgstAmt: !isIgst ? (Number((item.tax_value / 2).toFixed(2))* item.quantity) : 0,
        IgstAmt: igst,
        CgstAmt: cgst.toFixed(2),
        SgstAmt: sgst.toFixed(2),
        CesRt: 0,
        CesAmt: 0,
        CesNonAdvlAmt: 0,
        StateCesRt: 0,
        StateCesAmt: 0,
        StateCesNonAdvlAmt: 0,
        OthChrg: 0,
        //   OrdLineRef:'',
        //   OrgCntry:'',
        //   PrdSlNo:'',
        AttribDtls: [
          {
            Nm: item.title,
            Val: String(item.price),
          },
        ],
      };
      if (chargeAttribute) {
        itempay.AttribDtls.push(chargeAttribute);
      }
      if (item.hsn_code.startsWith('99')) {
        Object.assign(itempay, { IsServc: 'Y' });
      }
      items.push(itempay);
    }
    // let itempay ={
    //     SlNo:item.srNo,
    //     // UnitPrice:item.price,
    //     UnitPrice:item.pricebeforeDiscount,
    //     // TotAmt:Number(item.total) - Number(item.discount),
    //     TotAmt:Number(item.total),
    //     IsServc:'N',
    //     HsnCd:item.hsn_code,
    //     AssAmt:Number(assamt),
    //     GstRt:item.tax_per,
    //     // TotItemVal:item.total_with_tax,
    //     TotItemVal:assamt + item.tax_value,
    //     PrdDesc:item.title,
    //   //   Barcde:'',
    //     Qty:item.quantity,
    //     FreeQty:0,
    //     Unit:item.unit,
    //     Discount:item.discount|| 0,
    //     PreTaxVal:0,
    //     // IgstAmt: isIgst ? (Number(item.tax_value) * item.quantity) : 0,
    //     // CgstAmt: !isIgst ? (Number((item.tax_value / 2).toFixed(2)) * item.quantity) : 0,
    //     // SgstAmt: !isIgst ? (Number((item.tax_value / 2).toFixed(2))* item.quantity) : 0,
    //     IgstAmt: isIgst ? (Number(item.tax_value)) : 0,
    //     CgstAmt: !isIgst ? (Number((item.tax_value / 2).toFixed(2)) ) : 0,
    //     SgstAmt: !isIgst ? (Number((item.tax_value / 2).toFixed(2))) : 0,
    //     CesRt:0,
    //     CesAmt:0,
    //     CesNonAdvlAmt:0,
    //     StateCesRt:0,
    //     StateCesAmt:0,
    //     StateCesNonAdvlAmt:0,
    //     OthChrg:0,
    //   //   OrdLineRef:'',
    //   //   OrgCntry:'',
    //   //   PrdSlNo:'',
    //     AttribDtls:[
    //         {
    //             Nm: item.title,
    //             Val: String(item.price)
    //         }
    //     ]
    //   };
    //   if(item.hsn_code.startsWith('99')){
    //     Object.assign(itempay, {IsServc: 'Y'})
    //   }
    //   items.push(itempay);
  });

  Object.assign(payload, { ItemList: items });

  let totalInvValue =
    totalAssAmount +
    total_calculated_igst +
    total_calcuated_cgst +
    total_calcuated_cgst;
  let roundOff;
  if (
    order_data &&
    order_data.extra_details &&
    order_data.extra_details.roundedAmount
  ) {
    roundOff = order_data.extra_details.roundedAmount;
  } else {
    let previousTotal = order_data.order_total;
    let newgrandTotal = Math.round(order_data.order_total);
    if (previousTotal !== newgrandTotal) {
      roundOff = newgrandTotal - previousTotal;
    }
  }

  let ValDtls = {
    AssVal: Number(totalAssAmount).toFixed(2),
    CgstVal: Number(total_calcuated_cgst).toFixed(2),
    SgstVal: Number(total_calcuated_cgst).toFixed(2),
    IgstVal: Number(total_calculated_igst).toFixed(2),
    CesVal: Number($('#totalcessid').val()),
    StCesVal: Number($('#totalCessofitemid').val()),
    Discount: 0,
    // OthChrg:Number($('#totalChargesValueId').val()),
    OthChrg: 0,
    RndOffAmt: Number(roundOff).toFixed(2),
    // TotInvVal:Number(totalInvValue).toFixed(2),
    TotInvVal: Number(order_data.order_total).toFixed(2),
    TotInvValFc: 0,
  };

  //value details
  // let ValDtls ={
  //     AssVal:Number($('#totalAccesableAmtid').val()),
  //     // AssVal:1058.75,
  //     CgstVal:Number($('#totalCgstValueid').val()),
  //     SgstVal:Number($('#totalSgstValueid').val()),
  //     IgstVal:Number($('#totalIgstvalueid').val()),
  //     // IgstVal:52.94,
  //     CesVal:Number($('#totalcessid').val()),
  //     StCesVal:Number($('#totalCessofitemid').val()),
  //     // Discount:Number($('#discountValueid').val()),
  //     Discount:0,
  //     OthChrg:Number($('#totalChargesValueId').val()),
  //     RndOffAmt:Number($('#roundedoffamtValueid').val()),
  //     TotInvVal:Number($('#finalInvoiceValueid').val()),
  //     // TotInvVal: 1155,
  //     TotInvValFc:Number($('#finalinvoicevalueinOthCurrencyid').val()),
  //     RndOffAmt:rounded_amt
  // }

  Object.assign(payload, { ValDtls });

  let payloadBody = {};
  let storeid = window.storeDetails.store_id;
  let type = 1;

  Object.assign(payloadBody, {
    store_id: storeid,
    type,
    ref_id: orderRef_id,
    payload,
  });
  // return

  try {
    showLoader({
      title: 'Generating IRN',
      text: $.i18n.t('controller:orderController.pleaseWait'),
    });
    let irnResponse = await apiCall.post(
      Config.links.generateIRN,
      payloadBody,
      {
        headers: getHeadersformposforrender(),
      },
    );

    let response = irnResponse.data;
    if (response) {
      Swal.close();
      if (response.message == ' Success.' || response.status == 200) {
        Object.assign(response, { ref_id: order_data.order_id });
        makeSaveIRNResponserequest(response);
        $('#IRNmodal').modal('toggle');
        $('#receipt_fetchbillsButton').click();
        window.notifyUser.showMessage('success', 'IRN generated');
      } else {
        window.notifyUser.showMessage(
          'error',
          response.message || response.hbmessage,
        );
      }
    }
  } catch (err) {
    console.log('err', err);
  }
}

$('#IRNmodal').on('shown.bs.modal', function (e) {
  $("[data-card-widget='collapse']").unbind();
  $('#generateIrnbuttonId').unbind();
  Initialize();
});

setTimeout(() => {
  Initialize();
}, 100);

function calculateTaxForItemHB(price, tax_rate, isInclusive, isTaxDevided) {
  tax_rate = Number(tax_rate);
  let taxValue = 0;
  if (isTaxDevided) {
    tax_rate = tax_rate / 2;
  }
  if (isInclusive) {
    taxValue = price / (100 + tax_rate);
    taxValue = taxValue * tax_rate;
  } else {
    // taxValue = (price / 100) * tax_rate;
    taxValue = (price * tax_rate) / 100;
  }
  return taxValue;
}

function roundAmountUptoDecimals(numb, roundUpto) {
  roundUpto = Number(roundUpto);
  numb = Number(numb);
  const decimals = Number(String(1).padEnd(roundUpto + 1 || 2, '0'));
  return Math.round((numb + Number.EPSILON) * decimals) / decimals;
}

module.exports = {
  updateUnit,
};
