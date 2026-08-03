const { debounce } = require('lodash');

function renderDeliveryBoys() {
  $('#deliveryBoylistId').empty();
  $('#searchDeliveryBoyid').val('');
  const deliveryboyId = $('#deliveryBoyNamelabelid').attr('deliveryBoyId');
  if (window.deliveryBoys && window.deliveryBoys.length) {
    window.deliveryBoys.forEach((dBoy) => {
      const chargeListitem = $('<li>', {
        content: dBoy.name,
      });
      const chargeiteminputcheck = $('<input>', {
        type: 'radio',
        value: dBoy.id,
        id: `deliveryBoy_${dBoy.id}`,
        username: dBoy.username,
        name: 'deliveryBoyButton',
        phone: dBoy.phone,
        text: dBoy.name,
        checked: Number(deliveryboyId) === dBoy.id,
      });
      const chargeiteminputlabel = $('<label>', {
        for: `deliveryBoy_${dBoy.id}`,
        html: `${dBoy.name} ${dBoy.phone}`,
      });
      $(chargeListitem)
        .append(chargeiteminputcheck)
        .append(chargeiteminputlabel)
        .appendTo(`#deliveryBoylistId`);
    });
  }
}

function renderDeliveryBoysForDigitalOrder() {
  $('#digideliveryBoylistId').empty();
  $('#searchdigiDeliveryBoyid').val('');
  if (window.deliveryBoys && window.deliveryBoys.length) {
    window.deliveryBoys.forEach((dBoy) => {
      const chargeListitem = $('<li>', {
        content: dBoy.name,
      });
      const chargeiteminputcheck = $('<input>', {
        type: 'radio',
        value: dBoy.id,
        id: `digideliveryBoy_${dBoy.id}`,
        username: dBoy.username,
        name: 'digideliveryBoyButton',
        phone: dBoy.phone,
        text: dBoy.name,
      });
      const chargeiteminputlabel = $('<label>', {
        for: `digideliveryBoy_${dBoy.id}`,
        html: `${dBoy.name} ${dBoy.phone}`,
      });
      $(chargeListitem)
        .append(chargeiteminputcheck)
        .append(chargeiteminputlabel)
        .appendTo(`#digideliveryBoylistId`);
    });
  }
}

function renderDeliveryBoysForReceiptSection() {
  // $('#receiptdeliveryBoylistId').empty();
  // if (window.deliveryBoys && window.deliveryBoys.length) {
  //   window.deliveryBoys.forEach((dBoy) => {
  //     const chargeListitem = $('<li>', {
  //       content: dBoy.name,
  //     });
  //     const chargeiteminputcheck = $('<input>', {
  //       type: 'radio',
  //       value: dBoy.id,
  //       id: `receiptdeliveryBoy_${dBoy.id}`,
  //       username: dBoy.username,
  //       name: 'receiptdeliveryBoyButton',
  //       phone: dBoy.phone,
  //       text: dBoy.name,
  //     });
  //     const chargeiteminputlabel = $('<label>', {
  //       for: `digideliveryBoy_${dBoy.id}`,
  //       html: `${dBoy.name} ${dBoy.phone}`,
  //     });
  //     $(chargeListitem)
  //       .append(chargeiteminputcheck)
  //       .append(chargeiteminputlabel)
  //       .appendTo(`#receiptdeliveryBoylistId`);
  //   });
  // }
  // $('#receiptdeliveryBoylistId option:gt(0)').remove();
  // window.deliveryBoys.forEach((dboy) => {
  //   $('<option>')
  //     .val(dboy.id)
  //     .text(dboy.name)
  //     .attr('phone', dboy.phone)
  //     .appendTo('#receiptdeliveryBoylistId');
  // });
}

async function searchDeliveryBoy(data, isDigitalOrder) {
  const filter = data.toLowerCase();
  let myNode;
  if (isDigitalOrder) {
    myNode = document.getElementById('digideliveryBoylistId');
  } else {
    myNode = document.getElementById('deliveryBoylistId');
  }
  const descendents = myNode.getElementsByTagName('li');
  if (!filter && isDigitalOrder) {
    $('#digideliveryBoylistId li').show();
  } else if (!filter) {
    $('#deliveryBoylistId li').show();
  }

  let i;
  let currentDescedent;
  let matches;
  let acronym;
  for (i = 0; i < descendents.length; ++i) {
    currentDescedent = descendents[i];
    if (
      currentDescedent !== undefined &&
      $(currentDescedent).attr('content') !== undefined
    ) {
      matches = $(currentDescedent)
        .attr('content')
        .match(/\b(\w)/g);
    }
    if (matches) {
      acronym = matches.join('').toLowerCase();
    }

    if (currentDescedent !== undefined) {
      if (
        $(currentDescedent).attr('content') !== undefined &&
        !$(currentDescedent)
          .attr('content')
          .toLowerCase()
          .trim()
          .includes(filter.trim()) &&
        !acronym.toLowerCase().trim().includes(filter.trim())
      ) {
        currentDescedent.style.display = 'none';
      }
    }
  }
}

function initialize() {
  $('#searchDeliveryBoyid').on(
    'keyup',
    debounce((e) => {
      searchDeliveryBoy($(`#searchDeliveryBoyid`).val(), false);
    }, 300),
  );
}

initialize();

module.exports = {
  renderDeliveryBoys,
  renderDeliveryBoysForDigitalOrder,
  renderDeliveryBoysForReceiptSection,
  searchDeliveryBoy,
};
