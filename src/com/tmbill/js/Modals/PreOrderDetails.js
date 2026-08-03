const { safeParse } = require('../../util/RendererUtils');

function renderPreOrderDetails() {
  const details = $('#preOrderDetailsBodyid')[0];
  const orderData = safeParse(details.getAttribute('data'));
  $('#preOrderItemsContainerId').empty();

  console.log('orderData::', orderData);
  orderData.items.forEach((data) => {
    let itemTitle = data.title;
    if (window.selectedLanguage !== 'en' && data.alternative_title) {
      itemTitle = data.alternative_title;
    }

    if (data && data.extra_details && data.extra_details.baseTitle) {
      itemTitle = data.extra_details.baseTitle;
      if (window.selectedLanguage !== 'en' && data.alternative_title) {
        itemTitle = data.alternative_title;
      }
      itemTitle = `<span class='baseItemKotbillrow'>${itemTitle}</span>`;
    }

    if (data && data.options && data.options.length) {
      data.options.forEach((addon) => {
        if (window.selectedLanguage !== 'en' && addon.alternative_title) {
          itemTitle =
            `${itemTitle}` +
            `<br><span class='kotbillItemAddons'>${addon.option_qty || addon.qty || 1} x ${addon.alternative_title || addon.option_name || addon.title} </span>`;
        } else {
          itemTitle =
            `${itemTitle}` +
            `<br><span class='kotbillItemAddons'>${addon.option_qty || addon.qty || 1} x ${addon.option_name || addon.title} </span>`;
        }
      });
    }

    const kotitemnameCell = $('<li>', {
      html: itemTitle,
      class: 'preOrderReportItemInfo',
    });
    $('#preOrderItemsContainerId').append(kotitemnameCell);
  });

  if (orderData.instructions) {
    $('#preOrderInstruction').html(`Instruction: ${orderData.instructions}`);
  } else {
    $('#preOrderInstruction').html(`Instruction: `);
  }

  if (orderData.payment_instruction) {
    $('#preOrderPaymentInstruction').html(
      `Payment Instruction: ${orderData.payment_instruction}`,
    );
  } else {
    $('#preOrderPaymentInstruction').html(`Payment Instruction:`);
  }
}

module.exports = {
  renderPreOrderDetails,
};
