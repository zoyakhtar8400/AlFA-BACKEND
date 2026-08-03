const { debounce } = require('lodash');
const {
  QUICKBILL_BILLING_FLAG,
  DINEIN_BILLING_FLAG,
  HOMED_BILLING_FLAG,
  TAKEAWAY_BILLING_FLAG,
  TAKEAWAY_TAB_ID,
  DINEIN_TAB_ID,
  QUICK_TAB_ID,
} = require('../util/Constants');

window.chargesscriptLoaded = true;

/**
 * Add's charges
 */
function readdCharges() {
  $('#chargeslistId').empty();
  const data = window.orderCharges;
  if (data.length === 0) {
    $('#searchchargesid').hide();
  } else {
    $('#searchchargesid').show();
  }

  data.forEach((element) => {
    const postFix = element.per_or_fixed == '1' ? ' %' : '';
    // Check if discount is default one or not
    const is_default =
      element.is_default != undefined && element.is_default == 1;
    if (is_default) {
      window.defaultOrdercharges.push(element);
    }

    // If charge is applicable on order level
    // 0 -Order level 1-Item level 2-All
    if (is_default && [0, 2].includes(element.charge_applicable_on)) {
      element.billing_flag = String(element.billing_flag);
      const billing_types = element.billing_flag.split(',');
      if (billing_types.length > 1 && billing_types.includes('0')) {
        const index = billing_types.indexOf('0');
        if (index > -1) {
          billing_types.splice(index, 1);
        }
      }
      billing_types.forEach((billing_flag) => {
        switch (Number(billing_flag)) {
          case 0: // All
            if ([0, 2].includes(element.charge_applicable_on)) {
            }
            window.defaultdineinOrdercharges.push(element);
            window.defaulttakeawayOrdercharges.push(element);
            window.defaultquickOrdercharges.push(element);
            window.defaulthomedOrdercharges.push(element);
            break;
          case 1: // Quick Bill
            window.defaultquickOrdercharges.push(element);
            break;
          case 2: // Dine in
            window.defaultdineinOrdercharges.push(element);
            break;
          case 3: // TA
            window.defaulttakeawayOrdercharges.push(element);
            break;
          case 4:
            window.defaulthomedOrdercharges.push(element);
            break;
          default:
            break;
        }
      });
    }
    const chargeListitem = $('<li>', {
      is_default,
      content: element.title,
    });
    const chargeiteminputcheck = $('<input>', {
      type: 'checkbox',
      charge_id: element.charge_id,
      id: `billcharges_${element.charge_id}`,
      charge_billing_type: element.billing_flag,
    });
    const chargeiteminputlabel = $('<label>', {
      for: `billcharges_${element.charge_id}`,
      html: `${element.title} ( ${element.amount}${postFix} )`,
    });
    $(chargeListitem)
      .append(chargeiteminputcheck)
      .append(chargeiteminputlabel)
      .appendTo(`#chargeslistId`);
  });
}

async function searchCharge(data) {
  const filter = data.toLowerCase();
  const myNode = document.getElementById('chargeslistId');
  const descendents = myNode.getElementsByTagName('li');

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

    const istakeawayChecked = $('#switchcheckId').is(':checked');
    let billingType = DINEIN_BILLING_FLAG;
    const activeTab = $('.mainsectionTabs li a.active').attr('id');
    switch (activeTab) {
      case TAKEAWAY_TAB_ID:
        if (istakeawayChecked) {
          billingType = TAKEAWAY_BILLING_FLAG;
        } else {
          billingType = HOMED_BILLING_FLAG;
        }
        break;
      case DINEIN_TAB_ID:
        billingType = DINEIN_BILLING_FLAG;
        break;
      case QUICK_TAB_ID:
        billingType = QUICKBILL_BILLING_FLAG;

        break;

      default:
        break;
    }
    let rawchargesId = $(currentDescedent)
      .children()
      .attr('charge_billing_type');
    rawchargesId = String(rawchargesId);
    const billingTypes = rawchargesId.split(',');

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
      } else if (
        billingTypes &&
        (billingTypes.includes(billingType) || billingTypes.includes('0'))
      ) {
        currentDescedent.style.display = '';
      }
    }
  }
}

function initializeCharges() {
  $('#searchchargesid').on(
    'keyup',
    debounce((e) => {
      searchCharge($(`#searchchargesid`).val());
    }, 300),
  );
}

initializeCharges();
window.readdCharges_fromremote = function () {
  readdCharges();
};
