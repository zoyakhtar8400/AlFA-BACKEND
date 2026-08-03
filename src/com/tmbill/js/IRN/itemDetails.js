const { updateUnit } = require('./generateIRN');
window.itmedetailsScriptLoaded = true;

function Initialize() {
  let details = $('#IRNItemmodalBodyid')[0];
  if (details) {
    let itemDeatils = JSON.parse(details.getAttribute('data'));
    let item = JSON.parse(itemDeatils);
    if (item) {
      let srno = $('#srNoItemDetailId')[0];
      srno.innerHTML = item.srNo;
      let title = $('#descItemdetailid')[0];
      title.innerHTML = item.title;
      let hsnCode = $('#hsnCodeItemdetailid')[0];
      hsnCode.innerHTML = item.hsn_code;
      let qty = $('#qtyItemdetailid')[0];
      qty.innerHTML = item.quantity;
      let priceItem = $('#priceItemDetailid')[0];
      priceItem.innerHTML = item.price;
      // priceItem.innerHTML = item.pricebeforeDiscount;
      let totalItem = $('#totalItemdetailid')[0];
      totalItem.innerHTML = item.total;
      let discount = $('#discountItemdetailid')[0];
      discount.innerHTML = item.discount || 0;
      let gst = $('#gstItemdetailid')[0];
      gst.innerHTML = item.tax_per;

      if (item.isIgst) {
        let totalIgst = $('#totalIgstPaybleid')[0];
        totalIgst.innerHTML = item.tax_value * item.quantity;

        let totalCgst = $('#totalCgstPaybleid')[0];
        totalCgst.innerHTML = 0;

        let totalSgst = $('#totalSgstPaybleid')[0];
        totalSgst.innerHTML = 0;
      } else {
        let totalIgst = $('#totalIgstPaybleid')[0];
        totalIgst.innerHTML = 0;

        let totalCgst = $('#totalCgstPaybleid')[0];
        totalCgst.innerHTML =
          Number((item.tax_value / 2).toFixed(2)) * item.quantity;

        let totalSgst = $('#totalSgstPaybleid')[0];
        totalSgst.innerHTML =
          Number((item.tax_value / 2).toFixed(2)) * item.quantity;
      }

      let totalWithTax = $('#totalwithtaxItemdetailid')[0];
      totalWithTax.innerHTML = item.total_with_tax;
      let nameItem = $('#nameItemdetailid')[0];
      nameItem.innerHTML = item.title;
      let itemUnit = $('#itemUnitid')[0];
      $(itemUnit).val(item.unit);
    }

    if (item) {
      $('#itemUnitid').on('change', (e) => {
        e.stopPropagation();
        let newVal = $('#itemUnitid').val();
        updateUnit(item, newVal);
      });
    }
  }
}

$('#IRNItemmodal').on('shown.bs.modal', function (e) {
  $('#itemUnitid').unbind();
  Initialize();
});

Initialize();
