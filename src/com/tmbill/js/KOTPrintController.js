/* eslint-disable no-plusplus */
/* eslint-disable camelcase */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-lonely-if */
const { isEmpty, forEach } = require('lodash');
const isObject = require('lodash/isObject');
const {
  QUICKBILL_BILLING_FLAG,
  DINEIN_BILLING_FLAG,
  TAKEAWAY_BILLING_FLAG,
  HOMED_BILLING_FLAG,
  ZOMATO_BILLING_FLAG,
  SWIGGY_BILLING_FLAG,
  DIGITAL_BILLING_FLAG,
  ONDC_BILLING_FLAG,
  CAREEM_BILLING_FLAG,
  TALABAT_BILLING_FLAG,
  NOONFOOD_BILLING_FLAG,
  UBEREATS_BILLING_FLAG,
  DELIVEROO_BILLING_FLAG,
  FIDOO_BILLING_FLAG,
  JAHEZ_BILLING_FLAG,
  AMAZON_BILLING_FLAG,
  MRSOOL_BILLING_FLAG,
  RADYES_BILLING_FLAG,
  THRIVE_BILLING_FLAG,
  CULTFIT_BILLING_FLAG,
  GUPSHUP_BILLING_FLAG,
  INRESTO_BILLING_FLAG,
  JUSTEAT_BILLING_FLAG,
  SCOOTSY_BILLING_FLAG,
  CHATFOOD_BILLING_FLAG,
  FLIPDISH_BILLING_FLAG,
  EAZYDINER_BILLING_FLAG,
  SWIGGYSTORE_BILLING_FLAG,
  ZOMATOMARKET_BILLING_FLAG,
  FOODPANDA_BILLING_FLAG,
  BEANZ_BILLING_FLAG,
  CARI_BILLING_FLAG,
  HUNGERSATATION_BILLING_FLAG,
  INSTASHOP_BILLING_FLAG,
  SMILES_BILLING_FLAG,
  TOYOU_BILLING_FLAG,
  EATEASY,
  SALUTATIONS_VALUES,
  KEETA_BILLING_FLAG,
} = require('../util/Constants');
const { maskString, sleep } = require('../util/MiscUtil');
const {
  SHOW_BILLINGTYPE_ONKOT,
  SHOW_KOTITEMS_BYCATEGORY,
  SHOW_ORDERID_ON_KOT,
  SHOW_CAPTAIN_ON_KOT,
  HIDE_ORDER_TYPE_IN_QUICKBILL,
  SHOW_ITEMNOTE,
  SHOW_TERMINAL_USER_ON_KOT,
  SHOW_ORDER_NUMBER_ON_QUICK_KOT,
  SHOW_KOT_NUMBER_ON_QUICK_BILL,
  CUSTOMIZE_ORDER_NUMBER_NAME,
  SHOW_ALTERNATE_TITLE_ON_KOT_PRINT,
  SHOW_KOT_TRANSLATIONS_IN_BOTH_LANGUAGES,
  SHOW_PRICE_ON_KOT_PRINT,
  SHOW_DEFAULT_ITEMTITLE_ONLY_FOR_MODIFIER_ITEM_ON_KOT,
  SHOW_USERNAME_ON_KOT,
} = require('../util/SettingIDs');
const { waitForRender } = require('../renderer/utils');

window.kotpreviewscriptLoaded = true;
const firstordertypeSymbolrendered = false;
const maskSize = 4;

let showbillingTypeonkot = false;
let groupkotitemsBycat = false;

let showOrderIdOnOnlineorder = false;
let showOrderIdOnQickbillKOT = false;
let showCaptainUser = false;
let showTerminalUser = false;
let hideOrderTypeOnQuickKot = false;
let showkotNote = false;
let showPriceOnKotPrint = false;
let showKotNumberOnQuickbillKot = false;
let showOrderNumberOnQuickbillKot = false;
window.showAlternatetitleonkot = false;
let showTranslationInBothLanguage = false;
let showBasetitleForModifiers = false;
let showUsernameOnKot = false;
let printKotLockStartedAt = null;
const MAX_PRINTKOT_TIME = 10000; // 10 seconds
// near other "show..." flags

let totalKotItemQty = 0;

/**
 * Queue Variables
 */
const kotPrintQueue = [];
let isProcessing = false;

function ensurePrintKotLockIsHealthy() {
  if (
    isProcessing &&
    printKotLockStartedAt &&
    Date.now() - printKotLockStartedAt > MAX_PRINTKOT_TIME
  ) {
    console.warn('⚠ KOT print lock stuck. Auto-releasing...');
    isProcessing = false;
    window.isKOTPrintInprogess = false;
    printKotLockStartedAt = null;
  }
}

/**
 *
 * @param {*} data
 */
function addItem(kotdata, kotType, isOnlinebill) {
  const data = { ...kotdata };

  const english = /^[~`!@#$%^&*()_+=[\]\\{}|;':",.\\/<br>?a-zA-Z0-9- \n]+$/;
  if (data.title) {
    const titleArray = data.title.split('');
    let foundFields = 0;
    for (let i = 0; i < titleArray.length; i++) {
      if (!english.test(titleArray[i])) {
        foundFields = i;
        break;
      }
    }

    if (foundFields) {
      const b = '\n';
      data.title = [
        data.title.slice(0, foundFields),
        b,
        data.title.slice(foundFields),
      ].join('');
    }
  }
  const note =
    data.note !== undefined && data.note
      ? `</br> <span id="kotitemNoteId">( Note:${data.note})</span>`
      : '';
  const reason =
    data.reason !== undefined && data.reason
      ? `</br>( Reason:${data.reason})`
      : '';

  let itemTitle = data.title;
  if (data.extra_details && data.extra_details.baseTitle) {
    itemTitle = data.extra_details.baseTitle;
  }
  if (window.showAlternatetitleonkot && data.alternative_title) {
    itemTitle = `${itemTitle}\n${data.alternative_title}`;
  }

  if (showBasetitleForModifiers) {
    if (data.extra_details && data.extra_details.defaultVariantlist) {
      Object.values(data.extra_details.defaultVariantlist).forEach((addon) => {
        let addonTitle = addon.title || addon.option_name;
        if (window.showAlternatetitleonkot && addon.alternative_title) {
          addonTitle = `${addonTitle}\n${addon.alternative_title}`;
        }
        itemTitle =
          `${itemTitle}<br>` +
          `<span class='kotbillItemAddonsForPrint kotitem-addon-title'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
      });
    }

    if (data.extra_details && data.extra_details.defaultDeselected) {
      Object.values(data.extra_details.defaultDeselected).forEach((addon) => {
        let addonTitle = addon.title || addon.option_name;
        if (window.showAlternatetitleonkot && addon.alternative_title) {
          addonTitle = `${addonTitle}\n${addon.alternative_title}`;
        }
        itemTitle =
          `${itemTitle}<br>` +
          `<span class='cancelledItemAddonsForPrint'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
      });
    }

    if (data.extra_details && data.extra_details.otherSelectedlist) {
      Object.values(data.extra_details.otherSelectedlist).forEach((addon) => {
        let addonTitle = addon.title || addon.option_name;
        if (window.showAlternatetitleonkot && addon.alternative_title) {
          addonTitle = `${addonTitle}\n${addon.alternative_title}`;
        }
        itemTitle =
          `${itemTitle}<br>` +
          `<span class='kotbillItemAddonsForPrint kotitem-addon-title'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
      });
    }

    if (
      data.extra_details &&
      !data.extra_details.defaultVariantlist &&
      !data.extra_details.otherSelectedlist
    ) {
      if (data && data.addons && data.addons.length) {
        data.addons.forEach((addon) => {
          let addonTitle = addon.title || addon.option_name;
          if (window.showAlternatetitleonkot && addon.alternative_title) {
            addonTitle = `${addonTitle}\n${addon.alternative_title}`;
          }
          itemTitle =
            `${itemTitle}<br>` +
            `<span class='kotbillItemAddonsForPrint kotitem-addon-title'>${addon.qty || 1} x ${addonTitle} </span>`;
        });
      }
    }
  } else {
    if (data.extra_details && !data.extra_details.printOnKOTAndBill) {
      if (data && data.addons && data.addons.length) {
        data.addons.forEach((addon) => {
          let addonTitle = addon.title || addon.option_name;
          if (window.showAlternatetitleonkot && addon.alternative_title) {
            addonTitle = `${addonTitle}\n${addon.alternative_title}`;
          }
          itemTitle =
            `${itemTitle}<br>` +
            `<span class='kotbillItemAddonsForPrint kotitem-addon-title'>${addon.qty || 1} x ${addonTitle} </span>`;
        });
      }

      if (data.extra_details && data.extra_details.cancelledAddonslist) {
        Object.values(data.extra_details.cancelledAddonslist).forEach(
          (addon) => {
            let addonTitle = addon.title || addon.option_name;
            if (window.showAlternatetitleonkot && addon.alternative_title) {
              addonTitle = `${addonTitle}\n${addon.alternative_title}`;
            }
            itemTitle =
              `${itemTitle}<br>` +
              `<span class='cancelledItemAddonsForPrint kotitem-addon-title'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
          },
        );
      }
    }

    if (
      data.extra_details &&
      data.extra_details.printOnKOTAndBill &&
      Object.keys(data.extra_details.printOnKOTAndBill).length
    ) {
      Object.values(data.extra_details.printOnKOTAndBill).forEach((addon) => {
        let addonTitle = addon.title || addon.option_name;
        if (window.showAlternatetitleonkot && addon.alternative_title) {
          addonTitle = `${addonTitle}\n${addon.alternative_title}`;
        }
        itemTitle =
          `${itemTitle}<br>` +
          `<span class='kotbillItemAddonsForPrint kotitem-addon-title'>${addon.qty || 1} x ${addonTitle}</span> `;
      });
    }

    if (
      data.extra_details &&
      data.extra_details.printOnKOTAndBillDefaultDeselected &&
      Object.keys(data.extra_details.printOnKOTAndBillDefaultDeselected).length
    ) {
      Object.values(
        data.extra_details.printOnKOTAndBillDefaultDeselected,
      ).forEach((addon) => {
        let addonTitle = addon.title || addon.option_name;
        if (window.showAlternatetitleonkot && addon.alternative_title) {
          addonTitle = `${addonTitle}\n${addon.alternative_title}`;
        }
        itemTitle =
          `${itemTitle}<br>` +
          `<span class='cancelledItemAddonsForPrint'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
      });
    }
  }

  if (isOnlinebill && data && data.addons && data.addons.length) {
    data.addons.forEach((addon) => {
      itemTitle =
        `${itemTitle}<br>` +
        `<span class='kotbillItemAddonsForPrint'>${addon.option_qty || addon.qty || 1} x ${addon.option_name || addon.title}</span> `;
    });
  }

  if (
    data.extra_details &&
    data.extra_details.item_tags &&
    data.extra_details.item_tags.length
  ) {
    let tagContent = '';
    data.extra_details.item_tags.forEach((tag) => {
      tagContent = `${tagContent} ${tag.content}`;
    });

    itemTitle = `${itemTitle} <br>[${tagContent}]`;
  }
  let itemTitleClass = 'kot-itemtitle';
  if (
    kotType === 'Cancelled ' ||
    kotType === 'Cancelled KOT' ||
    kotType === 'تم إلغاء'
  ) {
    itemTitleClass += ' cancelledItemForPrint';
  }
  const itemName = $('<td>', {
    html: `<span class="${itemTitleClass}">${itemTitle}</span> ${note} ${reason}`,
    class: 'kot-itemtitle',
  });
  const quantity = $('<td>', {
    html:
      kotType === 'Cancelled ' ||
      kotType === 'Cancelled KOT' ||
      kotType === 'تم إلغاء'
        ? ` <span style="font-weight:bold">-</span> ${data.quantity}`
        : data.quantity,
    class: 'kot-itemqty',
  });
  if (showPriceOnKotPrint) {
    const total = $('<td>', {
      html: data.total
        ? Number(data.total).toFixed(window.ROUNDOFF_UPTO)
        : Number(data.amount).toFixed(window.ROUNDOFF_UPTO),
      class: 'kot-itemqty',
    });
    $('<tr>')
      .append(itemName)
      .append(quantity)
      .append(total)
      .appendTo('#kotpreviewTable');
  } else {
    $('<tr>').append(itemName).append(quantity).appendTo('#kotpreviewTable');
  }
}

function addItemforview2(data) {
  const note =
    data.note !== undefined && data.note ? `</br>( Note:${data.note})` : '';
  const reason =
    data.reason !== undefined && data.reason
      ? `</br>( Reason:${data.reason})`
      : '';
  const { addons } = data;
  let addonsAvailable = false;
  if (addons && Array.isArray(addons) && addons.length > 0) {
    addonsAvailable = true;
  }

  let optionsItemstitles = [];
  const addonItemstitles = [];
  const addonItems = [];
  if (addonsAvailable) {
    for (const currentAddon of addons) {
      if (currentAddon.option_type === 0) {
        optionsItemstitles.push(currentAddon.title);
      } else {
        const addonTitle = $('<label>', {
          html: `+ ${currentAddon.quantity || currentAddon.qty} x ${currentAddon.title} `,
          class: 'kotitem-addon-title',
        });
        addonItemstitles.push(currentAddon.title);
        addonItems.push(addonTitle);
      }
    }
  }

  // let itemTitletext = addonsAvailable ? data.oldTitle : data.title;
  let itemTitletext = data.title;
  if (data.extra_details && data.extra_details.baseTitle) {
    itemTitletext = data.extra_details.baseTitle;
  }

  if (window.showAlternatetitleonkot && data.alternative_title) {
    itemTitletext = `${itemTitletext}\n${data.alternative_title}`;
  }
  if (addonsAvailable) {
    const rawtitle = [...optionsItemstitles, ...addonItemstitles];
    const contenttoremoveFromtitle = `(${[
      rawtitle.slice(0, -1).join(', '),
      rawtitle.slice(-1)[0],
    ].join(rawtitle.length < 2 ? '' : ' and ')})`;
    itemTitletext = String(itemTitletext).replace(contenttoremoveFromtitle, '');
  }
  const itemName = $('<td>', {
    html: `${data.quantity} x ${itemTitletext} `,
    class: 'kot-itemtitle',
  });

  if (optionsItemstitles.length > 0) {
    optionsItemstitles = `(${[
      optionsItemstitles.slice(0, -1).join(', '),
      optionsItemstitles.slice(-1)[0],
    ].join(optionsItemstitles.length < 2 ? '' : ' and ')})`;
    itemName.append(optionsItemstitles);
  }
  if (addonItems.length > 0) {
    itemName.append(`</br > `);
    addonItems.forEach((element) => {
      itemName.append(element);
      itemName.append(`</br > `);
    });
  }

  itemName.append(`${note} ${reason} `);
  $('<tr>').append(itemName).appendTo('#kotpreviewTable');
}

function showOrderidonkot(orderid) {
  let orderId = orderid;
  if (
    window.globalmaskOrderidinpreview &&
    String(orderId).length - maskSize > 0
  ) {
    const maskedResult = maskString(
      orderId,
      0,
      String(orderId).length - maskSize,
      '*',
    );
    if (maskedResult) {
      orderId = `${maskedResult.maskedString}<h6>${maskedResult.remianingString}</h6>`;
    }
  }
  $('#kotorderIdlabel').show();
  $('#kotorderIdlabel').html(
    `${$.i18n.t('controller:previewController.OrderId')}:${orderId}`,
  );
}

async function generateItemsgrpbyKot(details) {
  $(`#disposableDivid`).show();
  $('#kotprintItemscontainerid').show();
  $('#kotpreviewTable').find('tr:not(:first)').remove();
  $('#disposableDivid').empty();

  const useSecondprintformat = window.currentkotPrintview === 2;
  if (useSecondprintformat) {
    $('#kotpreviewTable tr.item-row-heading').hide();
  }

  totalKotItemQty = 0;
  forEach(details.groupByKotNumber, (value, key) => {
    const container = $('<div>', {
      class: 'd-flex align-items-center catgrp-container',
    });
    const catnamecontainer = $('<div>', {
      class: 'd-flex category',
      html: `${details.customKOTTitle.replace('Check', '')} : ${key} \n`,
    });
    const itemscontainer = $('<div>', {
      class: 'd-flex pl-4 flex-column ',
    });

    for (const elem of value) {
      const itemrowContainer = $(`<div>`, {
        class: `d-flex justify-content-between ${!showPriceOnKotPrint ? 'w-80' : ''}`, // d-flex justify-content-between
      });
      let { title } = elem;
      if (elem.extra_details && elem.extra_details.baseTitle) {
        title = elem.extra_details.baseTitle;
      }

      if (window.showAlternatetitleonkot && elem.alternative_title) {
        title = `${title}\n${elem.alternative_title}`;
      }

      if (showBasetitleForModifiers) {
        if (elem.extra_details && elem.extra_details.defaultVariantlist) {
          Object.values(elem.extra_details.defaultVariantlist).forEach(
            (addon) => {
              let addonTitle = addon.title || addon.option_name;
              if (window.showAlternatetitleonkot && addon.alternative_title) {
                addonTitle = `${addonTitle}\n${addon.alternative_title}`;
              }
              title =
                `${title}<br>` +
                `<span class='kotbillItemAddonsForPrint kotitem-addon-title'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
            },
          );
        }

        if (elem.extra_details && elem.extra_details.defaultDeselected) {
          Object.values(elem.extra_details.defaultDeselected).forEach(
            (addon) => {
              let addonTitle = addon.title || addon.option_name;
              if (window.showAlternatetitleonkot && addon.alternative_title) {
                addonTitle = `${addonTitle}\n${addon.alternative_title}`;
              }
              title =
                `${title}<br>` +
                `<span class='cancelledItemAddonsForPrint'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
            },
          );
        }

        if (elem.extra_details && elem.extra_details.otherSelectedlist) {
          Object.values(elem.extra_details.otherSelectedlist).forEach(
            (addon) => {
              let addonTitle = addon.title || addon.option_name;
              if (window.showAlternatetitleonkot && addon.alternative_title) {
                addonTitle = `${addonTitle}\n${addon.alternative_title}`;
              }
              title =
                `${title}<br>` +
                `<span class='kotbillItemAddonsForPrint kotitem-addon-title'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
            },
          );
        }
      } else {
        if (
          elem.extra_details &&
          elem.extra_details.printOnKOTAndBill &&
          !Object.keys(elem.extra_details.printOnKOTAndBill).length
        ) {
          if (elem && elem.addons && elem.addons.length) {
            elem.addons.forEach((addon) => {
              let addonTitle = addon.title || addon.option_name;
              if (window.showAlternatetitleonkot && addon.alternative_title) {
                addonTitle = `${addonTitle}\n${addon.alternative_title}`;
              }
              title =
                `${title}<br>` +
                `<span class='kotbillItemAddonsForPrint kotitem-addon-title'>${addon.qty || 1} x ${addonTitle}</span> `;
            });
          }

          if (elem.extra_details && elem.extra_details.cancelledAddonslist) {
            Object.values(elem.extra_details.cancelledAddonslist).forEach(
              (addon) => {
                let addonTitle = addon.title || addon.option_name;
                if (window.showAlternatetitleonkot && addon.alternative_title) {
                  addonTitle = `${addonTitle}\n${addon.alternative_title}`;
                }
                title =
                  `${title}<br>` +
                  `<span class='cancelledItemAddonsForPrint'>${addon.qty || 1} x ${addonTitle} <span>`;
              },
            );
          }
        }

        if (
          elem.extra_details &&
          elem.extra_details.printOnKOTAndBill &&
          Object.keys(elem.extra_details.printOnKOTAndBill).length
        ) {
          Object.values(elem.extra_details.printOnKOTAndBill).forEach(
            (addon) => {
              let addonTitle = addon.title || addon.option_name;
              if (window.showAlternatetitleonkot && addon.alternative_title) {
                addonTitle = `${addonTitle}\n${addon.alternative_title}`;
              }
              title =
                `${title}<br>` +
                `<span class='kotbillItemAddonsForPrint kotitem-addon-title'>${addon.qty || 1} x ${addonTitle}</span> `;
            },
          );
        }

        if (
          elem.extra_details &&
          elem.extra_details.printOnKOTAndBillDefaultDeselected &&
          Object.keys(elem.extra_details.printOnKOTAndBillDefaultDeselected)
            .length
        ) {
          Object.values(
            elem.extra_details.printOnKOTAndBillDefaultDeselected,
          ).forEach((addon) => {
            let addonTitle = addon.title || addon.option_name;
            if (window.showAlternatetitleonkot && addon.alternative_title) {
              addonTitle = `${addonTitle}\n${addon.alternative_title}`;
            }
            title =
              `${title}<br>` +
              `<span class='cancelledItemAddonsForPrint'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
          });
        }
      }

      if (
        elem.extra_details &&
        elem.extra_details.item_tags &&
        elem.extra_details.item_tags.length
      ) {
        let tagContent = '';
        elem.extra_details.item_tags.forEach((tag) => {
          tagContent = `${tagContent} ${tag.content}`;
        });

        title = `${title} <br>[${tagContent}]`;
      }

      if (elem.note && elem.note !== null) {
        title = `${title} (${elem.note})`;
      }

      totalKotItemQty += elem.quantity || 0;
      if (elem.reason) {
        title = `${title} (${elem.reason})`;
      }
      const itemtitleContainer = $(`<span>`, {
        class: 'pr-2 kot-itemtitle',
        html: title,
        css: {
          // width: showPriceOnKotPrint ? '60%' : '',
          width: showPriceOnKotPrint ? '55%' : '',
          'line-break': 'anywhere',
        },
      });
      itemrowContainer.append(itemtitleContainer);
      if (elem.quantity) {
        const itemqtyContainer = $(`<span>`, {
          class: 'no-wrap align-self-center kot-itemqty',
          html: useSecondprintformat
            ? ` ${elem.quantity} x`
            : ` ${elem.quantity}`,
          css: {
            width: showPriceOnKotPrint ? '20%' : '',
          },
        });
        if (useSecondprintformat) {
          $(itemqtyContainer).addClass('pr-2');
          itemrowContainer.prepend(itemqtyContainer);
        } else {
          itemrowContainer.append(itemqtyContainer);
        }
      }
      if (showPriceOnKotPrint) {
        const itemtotalContainer = $(`<span>`, {
          class: 'no-wrap align-self-center kot-itemqty',
          html:
            elem.amount.toFixed(window.ROUNDOFF_UPTO) ||
            elem.total.toFixed(window.ROUNDOFF_UPTO),
          // css: {
          //   width: '20%',
          // },
        });
        itemrowContainer.append(itemtotalContainer);
      }
      itemscontainer.append(itemrowContainer);
      itemscontainer.append(itemrowContainer);
    }

    $(container).append(catnamecontainer);
    $(container).append(itemscontainer);
    $(`#disposableDivid`).append(container);
  });
}

function showCustomerinfoifany(customer) {
  try {
    $('#customerinfoId').show();
    $('#customerinfoId').html('');

    // Helper: remove stray "undefined" prefix/occurrences and trim
    const clean = (v) => {
      if (v === undefined || v === null) return '';
      return String(v)
        .replace(/undefined\s*/gi, '')
        .trim();
    };

    if (typeof customer === 'string') {
      const cleanCustomer = clean(customer);
      if (cleanCustomer) {
        $('#customerinfoId').html(
          `${$.i18n.t('controller:previewController.Customer')} ${cleanCustomer}`,
        );
      } else {
        $('#customerinfoId').hide();
      }
      return;
    }

    if (customer && customer.name) {
      // sanitize name
      let custName = clean(customer.name);

      let salutationText = '';
      if (customer.salutation) {
        const mapped = SALUTATIONS_VALUES[customer.salutation];
        salutationText = clean(mapped || customer.salutation);
      }
      if (salutationText) {
        custName = `${salutationText} ${custName}`;
      }

      let custPhone = '';
      if (customer.phone) {
        custPhone = `(${clean(customer.phone)})`;
        if (customer.dial_code) {
          custPhone = `(+${clean(customer.dial_code)} ${clean(customer.phone)})`;
        }
      }
      if (customer.alternate_phone) {
        let altCustPhone = `(${clean(customer.alternate_phone)})`;
        if (customer.alternate_dial_code) {
          altCustPhone = `(+${clean(customer.alternate_dial_code)} ${clean(customer.alternate_phone)})`;
        }
        custPhone = custPhone ? `${custPhone} ${altCustPhone}` : altCustPhone;
      }

      let displayText = '';
      switch (window.customerinfotoshowonKOT) {
        case '0':
          displayText =
            `${$.i18n.t('controller:previewController.Customer')} ${custName} ${custPhone}`.trim();
          break;
        case '1':
          displayText =
            `${$.i18n.t('controller:previewController.Customer')} ${custName}`.trim();
          break;
        case '2':
          displayText =
            `${$.i18n.t('controller:previewController.Customer')} ${custPhone}`.trim();
          break;
        default:
          displayText =
            `${$.i18n.t('controller:previewController.Customer')} ${custName}`.trim();
          break;
      }

      if (displayText) {
        $('#customerinfoId').html(displayText);
      } else {
        $('#customerinfoId').hide();
      }
    } else {
      $('#customerinfoId').hide();
    }
  } catch (error) {
    $('#customerinfoId').html('');
    $('#customerinfoId').hide();
  }
}

async function addOrdertypesymbol(billingType) {
  $(`#kotordertypeImagecontainerid`).hide();
  $(`#kotordertypeImagecontainerid img`).attr('src', '');
  if (showbillingTypeonkot && billingType !== undefined) {
    $(`#kotordertypeImagecontainerid`).show();
    let imageSource;
    switch (Number(billingType)) {
      case QUICKBILL_BILLING_FLAG:
        imageSource = '../assets/images/order_types/quickbill.png';
        break;
      case DINEIN_BILLING_FLAG:
        imageSource = '../assets/images/order_types/dine.png';
        break;
      case TAKEAWAY_BILLING_FLAG:
        imageSource = '../assets/images/order_types/takeaway.png';
        break;
      case HOMED_BILLING_FLAG:
        imageSource = '../assets/images/order_types/homedelivery.png';
        break;
      case ZOMATO_BILLING_FLAG:
        imageSource = '../assets/images/order_types/zomato.png';
        break;
      case SWIGGY_BILLING_FLAG:
        imageSource = '../assets/images/order_types/swiggy.png';
        break;
      case DIGITAL_BILLING_FLAG:
        if (
          window.currentKotDetails?.delivery_id ||
          window.currentKotDetails?.order_type_mode === 'delivery'
        ) {
          imageSource = '../assets/images/order_types/homedelivery.png';
        } else if (window.currentKotDetails?.order_type_mode === 'pickup') {
          imageSource = '../assets/images/order_types/takeaway.png';
        } else {
          imageSource = '../assets/images/order_types/online.png';
        }
        break;

      case ONDC_BILLING_FLAG:
        imageSource = '../assets/images/transparent/ondc.png';
        break;
      case CAREEM_BILLING_FLAG:
        imageSource = '../assets/images/order_types/careem.png';
        break;
      case TALABAT_BILLING_FLAG:
        imageSource = '../assets/images/order_types/talabat.png';
        break;
      case NOONFOOD_BILLING_FLAG:
        imageSource = '../assets/images/order_types/noonfood.png';
        break;
      case UBEREATS_BILLING_FLAG:
        imageSource = '../assets/images/order_types/ubereats.png';
        break;
      case DELIVEROO_BILLING_FLAG:
        imageSource = '../assets/images/order_types/deliveroo.png';
        break;
      case FIDOO_BILLING_FLAG:
        imageSource = '../assets/images/order_types/fidoo.png';
        break;
      case JAHEZ_BILLING_FLAG:
        imageSource = '../assets/images/order_types/jahez.png';
        break;
      case AMAZON_BILLING_FLAG:
        imageSource = '../assets/images/order_types/amazon.png';
        break;
      case MRSOOL_BILLING_FLAG:
        imageSource = '../assets/images/order_types/marsool.png';
        break;
      case RADYES_BILLING_FLAG:
        imageSource = '../assets/images/order_types/radyes.png';
        break;
      case THRIVE_BILLING_FLAG:
        imageSource = '../assets/images/order_types/thrive.png';
        break;
      case CULTFIT_BILLING_FLAG:
        imageSource = '../assets/images/order_types/cultfit.png';
        break;
      case GUPSHUP_BILLING_FLAG:
        imageSource = '../assets/images/order_types/gupshup.png';
        break;
      case INRESTO_BILLING_FLAG:
        imageSource = '../assets/images/order_types/inresto.png';
        break;
      case JUSTEAT_BILLING_FLAG:
        imageSource = '../assets/images/order_types/justeat.png';
        break;
      case SCOOTSY_BILLING_FLAG:
        imageSource = '../assets/images/order_types/scootsy.png';
        break;
      case CHATFOOD_BILLING_FLAG:
        imageSource = '../assets/images/order_types/chatfood.png';
        break;
      case FLIPDISH_BILLING_FLAG:
        imageSource = '../assets/images/order_types/flipdish.png';
        break;
      case EAZYDINER_BILLING_FLAG:
        imageSource = '../assets/images/order_types/eazydiner.png';
        break;
      case SWIGGYSTORE_BILLING_FLAG:
        imageSource = '../assets/images/order_types/swiggy.png';
        break;
      case ZOMATOMARKET_BILLING_FLAG:
        imageSource = '../assets/images/order_types/zomato.png';
        break;
      case FOODPANDA_BILLING_FLAG:
        imageSource = '../assets/images/order_types/foodpanda.png';
        break;
      case BEANZ_BILLING_FLAG:
        imageSource = '../assets/images/order_types/beanz.png';
        break;
      case CARI_BILLING_FLAG:
        imageSource = '../assets/images/order_types/cari.png';
        break;
      case HUNGERSATATION_BILLING_FLAG:
        imageSource = '../assets/images/order_types/hungerstation.jpg';
        break;
      case INSTASHOP_BILLING_FLAG:
        imageSource = '../assets/images/order_types/instashop.png';
        break;
      case SMILES_BILLING_FLAG:
        imageSource = '../assets/images/order_types/smiles.png';
        break;
      case TOYOU_BILLING_FLAG:
        imageSource = '../assets/images/order_types/toyou.png';
        break;
      case EATEASY:
        imageSource = '../assets/images/order_types/eateasy.png';
        break;
      case KEETA_BILLING_FLAG:
        imageSource = '../assets/images/order_types/keeta.png';
        break;
      default:
        $(`#kotordertypeImagecontainerid`).hide();
        break;
    }
    if (imageSource) {
      $(`#kotordertypeImagecontainerid`).show();
      $(`#kotordertypeImagecontainerid img`).attr('src', imageSource);
      if (!firstordertypeSymbolrendered) {
        await sleep(1000);
      }
      // await sleep(PRINT_DELAY);
    } else {
      $(`#kotordertypeImagecontainerid img`).attr('src', '');
      $(`#kotordertypeImagecontainerid`).hide();
    }
  }
}

function changeTablePrint(details) {
  // $('#disposableDivid').show();
  $('#kotprintItemscontainerid').hide();
  // $('#kotdatelabelID').hide();
  $('#kotwrapper1id').hide();
  $('#kotstorenameId').hide();
  // $('#kottablenameLabel').hide();
  $('#orderNumberLabelid').hide();
  $('#totalQtyDIvid').hide();
  $('#tablestatuskotprinttagLabel').hide();
  $('#totalkotitemqtyidforbothlang').hide();
  $('#preOrderKotIdlabel').hide();

  $('#kotLabelid').show();
  $('#kotordertypeLabelid').show();
  $('#kotLabelid').html(`KOT Number :${details.kot_number}`);
  $('#kottablenameLabel').html(details.kot_title);
  $('#kotdatelabelID').html(window.moment().format('DD MMMM YYYY hh:mm A'));
  $('#changeTableAlertkotprinttagLabel').show();
  $('#changeTableAlertkotprinttagLabel').html('Change Table Alert');
  if (details.billingType >= 0) {
    if (showTranslationInBothLanguage) {
      if (details.billingType === 104) {
        $('#kotordertypeLabelid').html('TMBill | ONDC');
      } else {
        $('#kotordertypeLabelid').html(
          // `${BillingTypes[details.billingType]} | ${ARABIC_BIILING_TYPES_BYID[details.billingType] ? ARABIC_BIILING_TYPES_BYID[details.billingType] : ''}`,
          `${window.orderTypes[Number(details.billingType)].order_type}  ${window.orderTypes[Number(details.billingType)].alternative_title ? window.orderTypes[Number(details.billingType)].alternative_title : ''}`,
        );
      }
    } else if (window.selectedLanguage === 'ar') {
      $('#kotordertypeLabelid').html(
        window.orderTypes[Number(details.billingType)].altenative_title || '',
        // ARABIC_BIILING_TYPES_BYID[details.billingType],
      );
    } else if (details.billingType === 104) {
      $('#kotordertypeLabelid').html('TMBill | ONDC');
    } else {
      const orderTypeTitle =
        window.orderTypes[Number(details.billingType)].order_type;
      // BillingTypes[details.billingType]
      if (
        details.billingType === 0 &&
        details.tableName &&
        details.tableName !== 'Quick Bill'
      ) {
        $('#kotordertypeLabelid').html(
          `${orderTypeTitle} - ${details.tableName}`,
        );
      } else {
        $('#kotordertypeLabelid').html(orderTypeTitle);
      }
    }
  } else {
    $('#kotordertypeLabelid').html('');
  }
}

function generateItemsgrpbycat(details) {
  $(`#disposableDivid`).show();
  $('#kotprintItemscontainerid').show();
  $('#kotpreviewTable').find('tr:not(:first)').remove();
  $('#disposableDivid').empty();

  const useSecondprintformat = window.currentkotPrintview === 2;
  if (useSecondprintformat) {
    $('#kotpreviewTable tr.item-row-heading').hide();
  }

  totalKotItemQty = 0;
  forEach(details.groupBycategory, (value, key) => {
    const container = $('<div>', {
      class: 'd-flex align-items-center catgrp-container',
    });
    // let categroyName =key
    let catgeoryName = key;
    if (window.showAlternatetitleonkot) {
      const category = window.categoriesList.find(
        (c) => c.category_name === key,
      );
      if (category) {
        catgeoryName = `${catgeoryName} \n${category.alternative_title ? category.alternative_title : ''}`;
      }
    }
    const catnamecontainer = $('<div>', {
      class: 'd-flex category',
      html: `${catgeoryName} : \n`,
    });
    const itemscontainer = $('<div>', {
      class: 'd-flex pl-4 flex-column ',
    });

    for (const elem of value) {
      const itemrowContainer = $(`<div>`, {
        class: `d-flex justify-content-between ${!showPriceOnKotPrint ? 'w-80' : ''}`,
      });
      let { title } = elem;
      if (elem.extra_details && elem.extra_details.baseTitle) {
        title = elem.extra_details.baseTitle;
      }

      if (window.showAlternatetitleonkot && elem.alternative_title) {
        title = `${title}\n${elem.alternative_title}`;
      }

      if (showBasetitleForModifiers) {
        if (elem.extra_details && elem.extra_details.defaultVariantlist) {
          Object.values(elem.extra_details.defaultVariantlist).forEach(
            (addon) => {
              let addonTitle = addon.title || addon.option_name;
              if (window.showAlternatetitleonkot && addon.alternative_title) {
                addonTitle = `${addonTitle}\n${addon.alternative_title}`;
              }
              title =
                `${title}<br>` +
                `<span class='kotbillItemAddonsForPrint kotitem-addon-title'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
            },
          );
        }

        if (elem.extra_details && elem.extra_details.defaultDeselected) {
          Object.values(elem.extra_details.defaultDeselected).forEach(
            (addon) => {
              let addonTitle = addon.title || addon.option_name;
              if (window.showAlternatetitleonkot && addon.alternative_title) {
                addonTitle = `${addonTitle}\n${addon.alternative_title}`;
              }
              title =
                `${title}<br>` +
                `<span class='cancelledItemAddonsForPrint'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
            },
          );
        }

        if (elem.extra_details && elem.extra_details.otherSelectedlist) {
          Object.values(elem.extra_details.otherSelectedlist).forEach(
            (addon) => {
              let addonTitle = addon.title || addon.option_name;
              if (window.showAlternatetitleonkot && addon.alternative_title) {
                addonTitle = `${addonTitle}\n${addon.alternative_title}`;
              }
              title =
                `${title}<br>` +
                `<span class='kotbillItemAddonsForPrint kotitem-addon-title'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
            },
          );
        }

        if (
          elem.extra_details &&
          !elem.extra_details.defaultVariantlist &&
          !elem.extra_details.otherSelectedlist
        ) {
          if (elem && elem.addons && elem.addons.length) {
            elem.addons.forEach((addon) => {
              let addonTitle = addon.title || addon.option_name;
              if (window.showAlternatetitleonkot && addon.alternative_title) {
                addonTitle = `${addonTitle}\n${addon.alternative_title}`;
              }
              title =
                `${title}<br>` +
                `<span class='kotbillItemAddonsForPrint kotitem-addon-title'>${addon.qty || 1} x ${addonTitle} </span>`;
            });
          }
        }
      } else {
        if (
          elem.extra_details &&
          elem.extra_details.printOnKOTAndBill &&
          !Object.keys(elem.extra_details.printOnKOTAndBill).length
        ) {
          if (elem && elem.addons && elem.addons.length) {
            elem.addons.forEach((addon) => {
              let addonTitle = addon.title || addon.option_name;
              if (window.showAlternatetitleonkot && addon.alternative_title) {
                addonTitle = `${addonTitle}\n${addon.alternative_title}`;
              }
              title =
                `${title}<br>` +
                `<span class='kotbillItemAddonsForPrint kotitem-addon-title'>${addon.qty || 1} x ${addonTitle}</span> `;
            });
          }
          if (elem.extra_details && elem.extra_details.cancelledAddonslist) {
            Object.values(elem.extra_details.cancelledAddonslist).forEach(
              (addon) => {
                let addonTitle = addon.title || addon.option_name;
                if (window.showAlternatetitleonkot && addon.alternative_title) {
                  addonTitle = `${addonTitle}\n${addon.alternative_title}`;
                }
                title =
                  `${title}<br>` +
                  `<span class='cancelledItemAddonsForPrint'>${addon.qty || 1} x ${addonTitle} <span>`;
              },
            );
          }
        }

        if (
          elem.extra_details &&
          elem.extra_details.printOnKOTAndBill &&
          Object.keys(elem.extra_details.printOnKOTAndBill).length
        ) {
          Object.values(elem.extra_details.printOnKOTAndBill).forEach(
            (addon) => {
              let addonTitle = addon.title || addon.option_name;
              if (window.showAlternatetitleonkot && addon.alternative_title) {
                addonTitle = `${addonTitle}\n${addon.alternative_title}`;
              }
              title =
                `${title}<br>` +
                `<span class='kotbillItemAddonsForPrint kotitem-addon-title'>${addon.qty || 1} x ${addonTitle}</span> `;
            },
          );
        }

        if (
          elem.extra_details &&
          elem.extra_details.printOnKOTAndBillDefaultDeselected &&
          Object.keys(elem.extra_details.printOnKOTAndBillDefaultDeselected)
            .length
        ) {
          Object.values(
            elem.extra_details.printOnKOTAndBillDefaultDeselected,
          ).forEach((addon) => {
            let addonTitle = addon.title || addon.option_name;
            if (window.showAlternatetitleonkot && addon.alternative_title) {
              addonTitle = `${addonTitle}\n${addon.alternative_title}`;
            }
            title =
              `${title}<br>` +
              `<span class='cancelledItemAddonsForPrint'>${addon.qty ? addon.qty : '1'} x ${addonTitle} </span>`;
          });
        }
      }
      if (elem.note && elem.note !== null) {
        title = `${title} (${elem.note})`;
      }
      if (
        elem.extra_details &&
        elem.extra_details.item_tags &&
        elem.extra_details.item_tags.length
      ) {
        let tagContent = '';
        elem.extra_details.item_tags.forEach((tag) => {
          tagContent = `${tagContent} ${tag.content}`;
        });

        title = `${title} <br>[${tagContent}]`;
      }

      totalKotItemQty += elem.quantity || 0;
      if (elem.reason) {
        title = `${title} (${elem.reason})`;
      }
      let itemTitleClass = 'pr-2 kot-itemtitle';

      if (
        details.kot_type === 'Cancelled ' ||
        details.kot_type === 'Cancelled KOT' ||
        details.kot_type === 'تم إلغاء'
      ) {
        itemTitleClass += ' cancelledItemForPrint';
      }
      const itemtitleContainer = $(`<span>`, {
        class: itemTitleClass,
        html: title,
        css: {
          width: showPriceOnKotPrint ? '48%' : '',
          'line-break': 'anywhere',
        },
      });
      itemrowContainer.append(itemtitleContainer);
      if (elem.quantity) {
        const itemqtyContainer = $(`<span>`, {
          class: 'no-wrap align-self-center kot-itemqty',
          html:
            details.kot_type === 'Cancelled ' ||
            details.kot_type === 'Cancelled KOT' ||
            details.kot_type === 'تم إلغاء'
              ? ` <span style="font-weight:bold">-</span> ${useSecondprintformat ? `${elem.quantity} x` : elem.quantity}`
              : ` ${elem.quantity}`,
        });
        if (useSecondprintformat) {
          $(itemqtyContainer).addClass('pr-2');
          itemrowContainer.prepend(itemqtyContainer);
        } else {
          itemrowContainer.append(itemqtyContainer);
        }
      }

      if (showPriceOnKotPrint) {
        const itemtotalContainer = $(`<span>`, {
          class: 'no-wrap align-self-center kot-itemqty',
          html: elem.total
            ? Number(elem.total).toFixed(window.ROUNDOFF_UPTO)
            : Number(elem.amount).toFixed(window.ROUNDOFF_UPTO),
        });
        itemrowContainer.append(itemtotalContainer);
      }
      itemscontainer.append(itemrowContainer);
    }

    $(container).append(catnamecontainer);
    $(container).append(itemscontainer);
    $(`#disposableDivid`).append(container);
  });
}

/**
 *
 * @param {KOT Printing details} details
 */
async function printforOtherprinters(details) {
  console.log('details::', details);
  if (details) {
    console.log(
      `[KOT Queue] Message="Rendering Print contents for job" kot_number="${details?.kot_number}" billing_type="${details?.billingType}" table_name="${details?.table_name}" JobId="${details?.job_id}"`,
    );
  }
  if (details.changeTablePrint) {
    changeTablePrint(details);
    return;
  }
  window.isKOTPrintInprogess = true;
  let billType = String(details.billingType) || details.billing_type;
  if (
    details.billingType === 0 &&
    details.tableName &&
    details.tableName !== 'Quick Bill'
  ) {
    const oType = Object.values(window.orderTypes).find(
      (item) => item.order_type === details.tableName,
    );
    if (oType) {
      billType = oType.id;
    }
    // billType = String(BillingTypes.indexOf(details.tableName));
  }
  window.currentKotDetails = details;

  addOrdertypesymbol(billType);
  const { kot_number } = details;

  $('#kotLabelid').show();
  $('#disposableDivid').empty();
  $('#disposableDivid').hide();
  if (kot_number !== undefined && kot_number !== 0) {
    if (details.kot_type === undefined) {
      // eslint-disable-next-line no-param-reassign
      details.kot_type = $.i18n.t('controller:oldKotController.KOT');
    }
    if (details.customKOTTitle) {
      if (
        details.kot_type === 'Check' &&
        details.customKOTTitle.includes('No')
      ) {
        const checkKotTitle = details.customKOTTitle.replace('No', '');
        $('#kotLabelid').html(`${checkKotTitle}`);
      } else {
        $('#kotLabelid').html(`${details.customKOTTitle} :${kot_number}`);
      }

      $('#kotLabelid').css('font-size', '20px');
    } else {
      if (details.kot_type === 'Check') {
        $('#kotLabelid').html(`${details.kot_type} KOT`);
      } else {
        $('#kotLabelid').html(`${details.kot_type} No:${kot_number}`);
      }

      $('#kotLabelid').css('font-size', '20px');
    }
  } else {
    $('#kotLabelid').html(details.kot_type);
  }

  if (!showKotNumberOnQuickbillKot && details.tableName === 'Quick Bill') {
    $('#kotLabelid').hide();
  } else {
    $('#kotLabelid').show();
  }

  if (
    // details.billingType === 0 &&
    showOrderNumberOnQuickbillKot &&
    details.order_number
  ) {
    $('#orderNumberLabelid').show();
    if (window.customOrderNumberName) {
      $('#orderNumberLabelid').html(
        `${window.customOrderNumberName} :${details.order_number}`,
      );
      $('#orderNumberLabelid').css('font-size', '28px');
    } else {
      $('#orderNumberLabelid').html(`Order No:${details.order_number}`);
      $('#orderNumberLabelid').css('font-size', '28px');
    }
  } else {
    $('#orderNumberLabelid').hide();
  }

  if (details.billingType >= 0) {
    if (showTranslationInBothLanguage) {
      if (details.billingType === 104) {
        $('#kotordertypeLabelid').html('TMBill | ONDC');
      } else {
        $('#kotordertypeLabelid').html(
          // `${BillingTypes[details.billingType]} | ${ARABIC_BIILING_TYPES_BYID[details.billingType] ? ARABIC_BIILING_TYPES_BYID[details.billingType] : ''}`,
          `${window.orderTypes[Number(details.billingType)].order_type} | ${window.orderTypes[Number(details.billingType)].alternative_title ? window.orderTypes[Number(details.billingType)].alternative_title : ''}`,
        );
      }
    } else if (window.selectedLanguage === 'ar') {
      $('#kotordertypeLabelid').html(
        window.orderTypes[Number(details.billingType)].altenative_title || '',
        // ARABIC_BIILING_TYPES_BYID[details.billingType],
      );
    } else if (details.billingType === 104) {
      $('#kotordertypeLabelid').html('TMBill | ONDC');
    } else {
      const orderTypeTitle =
        window.orderTypes[Number(details.billingType)].order_type;
      // BillingTypes[details.billingType]
      if (
        details.billingType === 0 &&
        details.tableName &&
        details.tableName !== 'Quick Bill'
      ) {
        $('#kotordertypeLabelid').html(
          `${orderTypeTitle} - ${details.tableName}`,
        );
      } else {
        $('#kotordertypeLabelid').html(orderTypeTitle);
      }
    }
  } else {
    $('#kotordertypeLabelid').html('');
  }
  if (details.order_type_mode && details.order_type_mode !== 'partner') {
    $('#kotordertypeModeLabelid').html(details.order_type_mode);
  } else {
    $('#kotordertypeModeLabelid').html('');
  }
  if (
    details.extra_details &&
    details.extra_details.order_tags &&
    details.extra_details.order_tags.length
  ) {
    $('#kotonlineorderTagsContainerid').show();
    $('#kotonlineorderTagsContainerid').empty();
    details.extra_details.order_tags.forEach((tag) => {
      const tagLabel = $('<label>', {
        class: 'online-order-tags',
        html: tag.content,
      });
      $('#kotonlineorderTagsContainerid').append(tagLabel);
    });
  } else {
    $('#kotonlineorderTagsContainerid').hide();
  }

  if (details.is_pre_order) {
    $('#preOrderKotIdlabel').show();
  } else {
    $('#preOrderKotIdlabel').hide();
  }

  if (details.note && details.customer) {
    $('#customerinfoId').addClass('kotNoteBorder');
  } else {
    $('#customerinfoId').removeClass('kotNoteBorder');
  }

  if (showkotNote) {
    if (details.note) {
      $('#kotnoteLabelid').html(`Note: ${details.note}`);
    } else {
      $('#kotnoteLabelid').html('');
    }
  }

  if (details.waiter && details.waiter) {
    const showWaiterSetting = window.settingsConfig[79];
    const shouldShowWaiter =
      showWaiterSetting && showWaiterSetting.value === '1';

    if (shouldShowWaiter) {
      let waiterName = details.waiter;
      const waiter = window.waitersList.find(
        (c) => c.username === details.waiter,
      );
      if (waiter && waiter.name) {
        waiterName = waiter.name;
      }
      $('#kotwrapper3id').show();
      $('#kotwaiternameLabelid').html(
        `${$.i18n.t('controller:previewController.Waiter')} ${waiterName}`,
      );
    } else {
      $('#kotwrapper3id').hide();
      $('#kotwaiternameLabelid').html('');
    }
  } else {
    $('#kotwrapper3id').hide();
    $('#kotwaiternameLabelid').html('');
  }

  if (details.createdBy && showCaptainUser && !details.isTerminalKot) {
    let captainName = details.createdBy;
    const captain = window.users.find((c) => c.username === details.createdBy);
    if (captain && captain.name) {
      captainName = captain.name;
    }
    $('#kotwrapper4id').show();
    $('#kotCaptainUsernameLabelid').html(
      `${$.i18n.t('controller:previewController.Captain')} ${captainName}`,
    );
  } else {
    $('#kotwrapper4id').hide();
    $('#kotCaptainUsernameLabelid').html('');
  }

  if (details.createdBy && showTerminalUser && details.isTerminalKot) {
    $('#kotwrapper5id').show();
    $('#kotTerminalUsernameLabelid').html(
      `Terminal User: ${details.createdBy}`,
    );
  } else {
    $('#kotwrapper5id').hide();
    $('#kotTerminalUsernameLabelid').html('');
  }

  if (details.tablestatuskotprintTag) {
    $('#tablestatuskotprinttagLabel').show();
    $('#tablestatuskotprinttagLabel').html(`${details.tablestatuskotprintTag}`);
  } else {
    $('#tablestatuskotprinttagLabel').hide();
  }

  if (details.customer) {
    showCustomerinfoifany(details.customer);
  } else {
    $('#customerinfoId').html('');
    $('#customerinfoId').hide();
  }

  if (!details.customer && details.customer_name) {
    const cleanName = String(details.customer_name)
      .replace(/undefined\s*/gi, '')
      .trim();
    if (cleanName) {
      $('#customerinfoId').show();
      $('#customerinfoId').html(`Customer: ${cleanName}`);
    } else {
      $('#customerinfoId').hide();
    }
  }

  if (details.isOnlinebill && details.orderTime) {
    const formatted = window
      .moment(details.orderTime)
      .utc()
      .format('DD MMMM YYYY hh:mm A');
    $('#kotdatelabelID').html(formatted);
  } else {
    $('#kotdatelabelID').html(window.moment().format('DD MMMM YYYY hh:mm A'));
  }

  let tableNameprinted = false;
  let usernamePrinted = false;
  $('kotwrapper1id').show();

  if (details.showStorenamonkot) {
    $('#kotstorenameId').show();
    $('#kotstorenameId').html(details.showStorenamonkot);
  } else {
    $('#kotstorenameId').hide();
  }

  if (
    details.billingType === 0 &&
    showOrderIdOnQickbillKOT &&
    details.order_id
  ) {
    showOrderidonkot(details.order_id);
  } else if (
    details.tableName &&
    details.isOnlinebill &&
    showOrderIdOnOnlineorder &&
    details.order_id
  ) {
    showOrderidonkot(details.order_id);
  } else {
    $('#kotorderIdlabel').hide();
  }

  if (details.delivery_id) {
    $('#kotdelveryorderIdlabel').show();
    $('#kotdelveryorderIdlabel').html(`Delivery Id:${details.delivery_id}`);
  } else {
    $('#kotdelveryorderIdlabel').hide();
  }

  if (details.extra_details && details.extra_details.external_order_id) {
    $('#kotexternalOrderIdlabel').show();
    $('#kotexternalOrderIdlabel').html(
      `${$.i18n.t('controller:previewController.EXTERNAL_ORDER_ID')} ${details.extra_details.external_order_id}`,
    );
  } else {
    $('#kotexternalOrderIdlabel').hide();
  }

  if (details.extra_details && details.extra_details.picked_up_at) {
    $('#kotPickupedAtIdlabel').show();
    const formattedDate = window
      .moment(details.extra_details.picked_up_at)
      .format('DD MM yyyy hh:mm A');
    $('#kotPickupedAtIdlabel').html(`Pickuped At:  ${formattedDate}`);
  } else {
    $('#kotPickupedAtIdlabel').hide();
  }

  if (details.extra_details && details.extra_details.parent_order_id) {
    $('#kotparentorderidlabel').show();
    $('#kotparentorderidlabel').html(
      `Parent Order ID: ${details.extra_details.parent_order_id}`,
    );
  } else {
    $('#kotparentorderidlabel').hide();
  }

  if (details.showCovers) {
    $('#kotcoversLabelid').show();
    $('#kotcoversLabelid').html(
      `${$.i18n.t('controller:previewController.Guests')}:${
        details.showCovers
      }`,
    );
  } else {
    $('#kotcoversLabelid').hide();
  }

  if (details.otp && details.showOnlineOrderOtpOnKot) {
    $('#kotonlineOTPLabelid').show();
    $('#kotonlineOTPLabelid').html(`OTP: ${details.otp}`);
  } else {
    $('#kotonlineOTPLabelid').hide();
  }
  $('#kottablenameLabel').css('display', 'none');
  if (details.tableName && details.fromTable) {
    $('#kottablenameLabel').css('display', '');
    $('#kottablenameLabel').html(
      `From ${details.fromTable} to ${details.tableName}`,
    );
  } else if (details.tableName || details.table_name) {
    if (details.billingType === 0) {
      if (!hideOrderTypeOnQuickKot) {
        $('#kottablenameLabel').css('display', '');
        if (window.selectedLanguage !== 'en') {
          const orderType = Object.values(window.orderTypes).find(
            (item) => item.order_type === details.tableName,
          );
          const arabicTableName = orderType?.alternative_title;
          $('#kottablenameLabel').html(
            arabicTableName, // ARABIC_BIILING_TYPES_BYNAME[details.tableName],
          );
        } else {
          $('#kottablenameLabel').html(details.tableName);
        }

        tableNameprinted = true;
      } else {
        $('#kottablenameLabel').css('display', 'none');
        $('#kotwrapper1id').css({ height: '0px', 'border-bottom': 'none' });
      }
    } else {
      $('#kottablenameLabel').css('display', '');
      $('#kottablenameLabel').html(details.tableName || details.table_name);
      tableNameprinted = true;
    }
  } else {
    $('#kottablenameLabel').css('display', 'none');
  }
  if (showUsernameOnKot && details.username) {
    $('#kotUsername').css('display', '');
    $('#kotUsername').html(details.username);
    usernamePrinted = true;
  } else {
    $('#kotUsername').css('display', 'none');
  }
  if (!usernamePrinted && !tableNameprinted) {
    $('kotwrapper1id').hide();
  }
  if (
    !details.checkKotPrint &&
    groupkotitemsBycat &&
    details.groupBycategory &&
    Object.keys(details.groupBycategory) &&
    Object.keys(details.groupBycategory).length > 0
  ) {
    generateItemsgrpbycat(details);
  } else if (details.checkKotPrint && details.groupByKotNumber) {
    generateItemsgrpbyKot(details);
  } else if (details) {
    $('#kotpreviewTable').find('tr:not(:first)').remove();
    totalKotItemQty = 0;
    // eslint-disable-next-line no-plusplus
    for (let index = 0; index < details?.items?.length; index++) {
      const item = details.items[index];
      totalKotItemQty += item.quantity;
      if (window.currentkotPrintview === 2) {
        $('#kotpreviewTable tr.item-row-heading').hide();
        addItemforview2(item);
      } else {
        addItem(
          item,
          details.kotType || details.kot_type,
          details.isOnlinebill,
        );
      }
    }
  }

  if (totalKotItemQty === 0) {
    $('#totalQtyDIvid').css('display', 'none');
  } else {
    $('#totalkotQtylabel').html(
      Number(totalKotItemQty).toFixed(window.ROUNDOFF_UPTO),
    );
    $('#totalQtyDIvid').css('display', '');
  }

  const { more_info } = details;
  if (more_info) {
    if (more_info.remark) {
      $('#kotremarkLabelid').html(more_info.remark);
    } else {
      $('#kotremarkLabelid').html('');
    }
  } else {
    $('#kotremarkLabelid').html('');
  }

  if (details.kitchenDepartment) {
    $('#kitchenDepartmentDiv').show();
    $('#kotprintkitchenDepartmentlabelid').show();
    $('#kotprintkitchenDepartmentlabelid').html(details.kitchenDepartment);
  } else {
    $('#kotprintkitchenDepartmentlabelid').empty();
    $('#kitchenDepartmentDiv').hide();
  }
  await waitForRender();
}

function mapItemstocategory(details) {
  Object.assign(details, {
    groupBycategory: undefined,
  });
  if (window.itemCatmapping && !isEmpty(window.itemCatmapping)) {
    const groupBycategory = {};
    forEach(details.items, (item) => {
      let itemKeyname = item.item_refid || item.item_id;
      if (details.billingType === DIGITAL_BILLING_FLAG) {
        itemKeyname = Number(item.item_id);
      }

      if (window.itemCatmapping[itemKeyname]) {
        const items = groupBycategory[window.itemCatmapping[itemKeyname]] || [];
        items.push(item);
        Object.assign(groupBycategory, {
          [window.itemCatmapping[itemKeyname]]: items,
        });
      } else {
        const items = groupBycategory.Default || [];
        items.push(item);
        Object.assign(groupBycategory, {
          Default: items,
        });
      }
    });
    Object.assign(details, {
      groupBycategory,
    });
    // eslint-disable-next-line no-param-reassign
    details.groupBycategory = groupBycategory;
    if (window.customerinfotoshowonKOT) {
      $('#customerinfoId').css('border-top', 'dashed');
      $('#customerinfoId').css('border-width', '0 .113rem');
    }
  }
}

function mapItemstoKotNumber(details) {
  Object.assign(details, {
    groupByKotNumber: undefined,
  });
  if (window.itemCatmapping && !isEmpty(window.itemCatmapping)) {
    const groupByKotNumber = {};
    forEach(details.items, (item) => {
      let itemKeyname = item.item_refid || item.item_id;
      if (details.billingType === DIGITAL_BILLING_FLAG) {
        itemKeyname = Number(item.item_id);
      }

      if (window.itemCatmapping[itemKeyname]) {
        const items = groupByKotNumber[item.mpos_kot.kot_number] || [];
        items.push(item);
        Object.assign(groupByKotNumber, {
          [item.mpos_kot.kot_number]: items,
        });
      } else {
        const items = groupByKotNumber.Default || [];
        items.push(item);
        Object.assign(groupByKotNumber, {
          Default: items,
        });
      }
    });
    Object.assign(details, {
      groupByKotNumber,
    });
    // eslint-disable-next-line no-param-reassign
    details.groupByKotNumber = groupByKotNumber;
    if (window.customerinfotoshowonKOT) {
      $('#customerinfoId').css('border-top', 'dashed');
      $('#customerinfoId').css('border-width', '0 .113rem');
    }
  }
}

// function showCustomerinfoifany(customer) {
//   try {
//     if (customer && customer.name) {
//       $('#customerinfoId').show();
//       $('#customerinfoId').html('');
//       $('#customerinfoId').html(
//         `${$.i18n.t('controller:previewController.Customer')} ${
//           customer.name
//         } `,
//       );
//       if (window.customerinfotoshowonKOT) {
//         let custName = customer.name;
//         if (custName && customer.salutation) {
//           const salutation = SALUTATIONS_VALUES[customer.salutation];
//           custName = `${salutation} ${customer.name}`;
//         }

//         let custPhone = `(${customer.phone})`;
//         if (customer.dial_code) {
//           custPhone = `(+${customer.dial_code} ${customer.phone})`;
//         }
//         if (customer.alternate_phone) {
//           let altCustPhone = `(${customer.alternate_phone})`;
//           if (customer.alternate_dial_code) {
//             altCustPhone = `(+${customer.alternate_dial_code} ${customer.alternate_phone})`;
//           }
//           custPhone = `${custPhone} ${altCustPhone}`;
//         }
//         // if (details.customer && details.customer.segments) {
//         //   let segmentContent = '';
//         //   details.customer.segments.forEach((segment) => {
//         //     segmentContent = `${segmentContent} <br> ${segment.en} ${segment.ar}`;
//         //   });
//         //   customerInfo = `${customerInfo} ${segmentContent}`;
//         // }
//         let segmentContent = '';
//         if (customer && customer.segments) {
//           customer.segments.forEach((segment) => {
//             segmentContent = `${segmentContent} <br> ${segment.en} ${segment.ar}`;
//           });
//         }
//         switch (window.customerinfotoshowonKOT) {
//           case '0': // Show both customer name and mobile
//             $('#customerinfoId').html(
//               `${$.i18n.t('controller:previewController.Customer')} ${
//                 custName
//               } ${custPhone} ${segmentContent}`,
//             );
//             break;

//           case '1': // Show both customer name and mobile
//             $('#customerinfoId').html(
//               `${$.i18n.t('controller:previewController.Customer')} ${
//                 custName
//               } ${segmentContent}`,
//             );
//             break;
//           case '2': // Only mobile
//             $('#customerinfoId').html(
//               `${$.i18n.t('controller:previewController.Customer')} ${
//                 custName
//               } ${segmentContent}`,
//             );
//             break;
//           default:
//             break;
//         }
//       } else {
//         $('#customerinfoId').html(
//           `${$.i18n.t('controller:previewController.Customer')} ${
//             customer.name
//           } `,
//         );
//       }
//     }
//   } catch (error) {
//     $('#customerinfoId').html('');
//     $('#customerinfoId').hide();
//   }
// }
/**
 *
 * @param {KOT Details} details
 */
async function printForlabelprinter(details) {
  if (details) {
    $('#disposableDivid').show();
    $('#kotprintItemscontainerid').hide();
    $('#kotdatelabelID').hide();
    $('#kotwrapper1id').hide();
    $('#kotstorenameId').hide();
    $('#kottablenameLabel').hide();
    $('#orderNumberLabelid').hide();
    $('#totalQtyDIvid').hide();
    $('#tablestatuskotprinttagLabel').hide();
    $('#totalkotitemqtyidforbothlang').hide();
    const tempKOTnumber = details.kot_number;
    let currentid = 1;
    const { more_info } = details;
    $('#disposableDivid').css({
      width: `${more_info.width}in`,
    });

    details.items.forEach((item) => {
      const div = $('<div>', {
        class: 'd-flex align-items-center',
        id: currentid,
      });

      // Check if KOT Number is provided
      let shortcutLabel;

      if (tempKOTnumber !== undefined && tempKOTnumber !== 0) {
        shortcutLabel = $('<label>', {
          class: 'kotLabelclass disposablekotLabelclass',
          html: `${details.kot_type} No:${tempKOTnumber}`,
        });
      } else {
        shortcutLabel = $('<label>', {
          class: 'kotLabelclass disposablekotLabelclass',
          html: details.kotType,
        });
      }

      div.append(shortcutLabel);

      // Check if online order id is provided
      if (details.tableName) {
        const tableNameLabel = $('<label>', {
          class: 'kotLabelclass disposablekotLabelclass',
          html: `${details.tableName} ${
            details.username ? details.username : ''
          }`,
        });
        div.append(tableNameLabel);
      }

      const note =
        item.note !== undefined && item.note ? `</br>( Note:${item.note})` : '';

      const itemNamelabel = $('<label>', {
        class: 'disposablekotitemnameclass',
        // html:'THis is a sample long ass item name that will go beyond.'
        html: `${item.title + note} : ${item.quantity}`,
      });
      div.append(itemNamelabel);

      $('#disposableDivid').append(div);
      $('<p style="page-break-before: always">').appendTo('#disposableDivid');
      currentid++;
    });
    $('#disposableDivid').children().last().remove();
  }
}

function getSettings() {
  if (window.settingsConfig[SHOW_BILLINGTYPE_ONKOT - 1] !== undefined) {
    showbillingTypeonkot =
      window.settingsConfig[SHOW_BILLINGTYPE_ONKOT - 1].value === '1';
  }

  if (
    window.settingsConfig[SHOW_ALTERNATE_TITLE_ON_KOT_PRINT - 1] !== undefined
  ) {
    window.showAlternatetitleonkot =
      window.settingsConfig[SHOW_ALTERNATE_TITLE_ON_KOT_PRINT - 1].value ===
      '1';
  }
  if (window.settingsConfig[SHOW_KOTITEMS_BYCATEGORY - 1] !== undefined) {
    groupkotitemsBycat =
      window.settingsConfig[SHOW_KOTITEMS_BYCATEGORY - 1].value === '1';
  }
  if (window.settingsConfig[SHOW_CAPTAIN_ON_KOT - 1] !== undefined) {
    showCaptainUser =
      window.settingsConfig[SHOW_CAPTAIN_ON_KOT - 1].value === '1';
  }
  if (window.settingsConfig[SHOW_TERMINAL_USER_ON_KOT - 1] !== undefined) {
    showTerminalUser =
      window.settingsConfig[SHOW_TERMINAL_USER_ON_KOT - 1].value === '1';
  }

  if (window.settingsConfig[HIDE_ORDER_TYPE_IN_QUICKBILL - 1] !== undefined) {
    hideOrderTypeOnQuickKot =
      window.settingsConfig[HIDE_ORDER_TYPE_IN_QUICKBILL - 1].value === '1';
  }

  if (window.settingsConfig[SHOW_ITEMNOTE - 1] !== undefined) {
    showkotNote = window.settingsConfig[SHOW_ITEMNOTE - 1].value === '1';
  }

  if (window.settingsConfig[SHOW_PRICE_ON_KOT_PRINT - 1] !== undefined) {
    showPriceOnKotPrint =
      window.settingsConfig[SHOW_PRICE_ON_KOT_PRINT - 1].value === '1';
  }

  if (window.settingsConfig[SHOW_ORDER_NUMBER_ON_QUICK_KOT - 1] !== undefined) {
    showOrderNumberOnQuickbillKot =
      window.settingsConfig[SHOW_ORDER_NUMBER_ON_QUICK_KOT - 1].value === '1';
  }

  if (window.settingsConfig[SHOW_KOT_NUMBER_ON_QUICK_BILL - 1] !== undefined) {
    showKotNumberOnQuickbillKot =
      window.settingsConfig[SHOW_KOT_NUMBER_ON_QUICK_BILL - 1].value === '1';
  }

  if (
    window.settingsConfig[
      SHOW_DEFAULT_ITEMTITLE_ONLY_FOR_MODIFIER_ITEM_ON_KOT - 1
    ] !== undefined
  ) {
    showBasetitleForModifiers =
      window.settingsConfig[
        SHOW_DEFAULT_ITEMTITLE_ONLY_FOR_MODIFIER_ITEM_ON_KOT - 1
      ].value === '1';
  }

  if (window.settingsConfig[CUSTOMIZE_ORDER_NUMBER_NAME - 1] !== undefined) {
    window.customizeOrderNumberName =
      window.settingsConfig[CUSTOMIZE_ORDER_NUMBER_NAME - 1].value;
  }

  if (window.settingsConfig[SHOW_USERNAME_ON_KOT - 1] !== undefined) {
    showUsernameOnKot =
      window.settingsConfig[SHOW_USERNAME_ON_KOT - 1].value === '1';
  }
  if (
    window.settingsConfig[SHOW_KOT_TRANSLATIONS_IN_BOTH_LANGUAGES - 1] !==
    undefined
  ) {
    showTranslationInBothLanguage =
      window.settingsConfig[SHOW_KOT_TRANSLATIONS_IN_BOTH_LANGUAGES - 1]
        .value === '1';
  }

  if (window.settingsConfig[SHOW_ORDERID_ON_KOT - 1]) {
    try {
      let rawOrderIdOnKotSettings;
      const { value } = window.settingsConfig[SHOW_ORDERID_ON_KOT - 1];
      if (value.constructor === 'test'.constructor) {
        rawOrderIdOnKotSettings = JSON.parse(
          window.settingsConfig[SHOW_ORDERID_ON_KOT - 1].value,
        );
      } else {
        rawOrderIdOnKotSettings = value;
      }
      if (rawOrderIdOnKotSettings && isObject(rawOrderIdOnKotSettings)) {
        showOrderIdOnQickbillKOT = rawOrderIdOnKotSettings.quick;
        showOrderIdOnOnlineorder = rawOrderIdOnKotSettings.onlineOrder;
      }
    } catch (error) {
      console.log(error);
    }
  }
}

/**
 * Generate the KOT Body
 */
async function printkotPreview(details) {
  try {
    if (details === undefined) {
      return false;
    }
    console.log(
      `[KOT Queue] Message="Requesting render Print contents for job" JobId="${details?.job_id}"`,
    );
    // console.log('printkotPreview details:', details);
    totalKotItemQty = 0;
    if (!details.checkKotPrint && groupkotitemsBycat)
      mapItemstocategory(details);
    if (details.checkKotPrint) mapItemstoKotNumber(details);
    // Set the pageConfig if provided
    if (details.pageConfig) {
      const rawmargins = String(details.pageConfig.margins).split(' ');
      $('#kotpreviewContainerid').css({
        'margin-left': rawmargins[0],
        width: rawmargins[1],
      });
    }

    $('#kotprintItemscontainerid').show();
    $('#kotdatelabelID').show();
    $('.kotwrapper1').show();
    $('#disposableDivid').empty();
    // $('#disposableDivid').hide();
    $('#kotLabelid').empty();
    $('#kotordertypeLabelid').empty();
    $('#kotordertypeModeLabelid').empty();
    $('#kotnoteLabelid').html('');
    $('#customerinfoId,#kotcoversLabelid').hide();
    $('#kotpreviewTable tr.item-row-heading').show();
    $('#tablestatuskotprinttagLabel').hide();
    $('#kotwaiternameLabelid').show();
    $(`#kotordertypeImagecontainerid`).hide();
    $(`#kotprintkitchenDepartmentlabelid`).hide();
    $('#changeTableAlertkotprinttagLabel').hide();

    if (showTranslationInBothLanguage) {
      $('.kotitemswrapper').remove();
      $('#totalkotitemqtyidforbothlang').show();
      $('#totalkotitemqtyid').hide();
    } else {
      $('.kotitemswrapperforbothlanguages').remove();
      $('#totalkotitemqtyidforbothlang').hide();
      $('#totalkotitemqtyid').show();
    }

    if (showPriceOnKotPrint) {
      $('#itemtotalkotprint').show();
      $('#itemtotalkotprintbothlang').show();
    } else {
      $('#itemtotalkotprint').hide();
      $('#itemtotalkotprintbothlang').hide();
    }

    if (details.isLabelprinter) {
      await printForlabelprinter(details);
    } else {
      await printforOtherprinters(details);
    }
    return true;
  } catch (error) {
    console.log(error);
    window.isKOTPrintInprogess = false;
  } finally {
    await sleep(700);
    window.isKOTPrintInprogess = false;
  }
  return false;
}

function Initialize() {
  getSettings();
  printkotPreview();
}

async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;
  window.isKOTPrintInprogess = true;

  try {
    while (kotPrintQueue.length > 0) {
      const job = kotPrintQueue.shift();
      printKotLockStartedAt = Date.now();

      let result = false;
      try {
        // eslint-disable-next-line no-await-in-loop
        result = await printkotPreview(job);
      } catch (err) {
        console.error(`[KOT Queue] Job failed JobId="${job?.job_id}"`, err);
        // eslint-disable-next-line no-continue
        continue;
      }

      if (result && job.printers?.length) {
        for (const printer of job.printers) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await window.sendPrintKOTfromremote(
              printer.printerIndex,
              job.job_id,
            );
          } catch (err) {
            console.error(
              `[KOT Queue] Printer dispatch failed JobId="${job?.job_id}" printer=${printer.printerIndex}`,
              err,
            );
          }
        }
      }

      // eslint-disable-next-line no-await-in-loop
      await sleep(300);
    }
  } finally {
    isProcessing = false;
    window.isKOTPrintInprogess = false;
    printKotLockStartedAt = null;
  }
}

window.printKotfromqueue = async ({ previewDetails, printers }) => {
  ensurePrintKotLockIsHealthy();
  // eslint-disable-next-line no-param-reassign
  previewDetails.printers = printers;
  kotPrintQueue.push({ ...previewDetails });
  if (!isProcessing) {
    processQueue();
  }
};

window.showkotPreview = async () => {
  getSettings();
  await printkotPreview();
};

Initialize();
