/* eslint-disable prefer-template */
/* eslint-disable camelcase */
const { colors } = require('./Colors');
const numberstoWorddata = require('../locales/numberstoWorddata');

let wordsList1;
let wordsList2;
let wordsList3;

const isRenderer = process && process.type === 'renderer';

const monthNames = [
  'Jan',
  'Feb',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];

function initializeWordlist() {
  if ($ === undefined) {
    setTimeout(initializeWordlist, 500);
    return;
  }

  wordsList1 =
    numberstoWorddata[$.i18n && $.i18n.language ? $.i18n.language : 'en']
      .wordsList1;
  wordsList2 =
    numberstoWorddata[$.i18n && $.i18n.language ? $.i18n.language : 'en']
      .wordsList2;
  wordsList3 =
    numberstoWorddata[$.i18n && $.i18n.language ? $.i18n.language : 'en']
      .wordsList3;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTableData_AsJson(tableID) {
  const tableRows = { data: [] };

  const $th = $('table#' + tableID + ' th');
  $('table#' + tableID + ' tbody tr').each((i, tr) => {
    const obj = {};
    const $tds = $(tr).find('td');
    $th.each((index, th) => {
      obj[$(th).text()] = $tds.eq(index).text();
    });
    tableRows.data.push(obj);
  });

  return tableRows;
}

/**
 *
 * @param {Number to convert} num
 */
function numberTowords(numbertoConvert, currency_name, sub_currency_name) {
  if (!wordsList1) {
    initializeWordlist();
  }

  let wholeNumber = Math.floor(numbertoConvert);

  if ((wholeNumber = wholeNumber.toString()).length > 9) return 'overflow';
  n = ('000000000' + wholeNumber)
    .substr(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return;
  let convertedWords = '';
  convertedWords +=
    n[1] != 0
      ? (wordsList1[Number(n[1])] ||
          wordsList2[n[1][0]] + ' ' + wordsList1[n[1][1]]) +
        `${wordsList3.crore} `
      : '';
  convertedWords +=
    n[2] != 0
      ? (wordsList1[Number(n[2])] ||
          wordsList2[n[2][0]] + ' ' + wordsList1[n[2][1]]) +
        `${wordsList3.lakh} `
      : '';
  convertedWords +=
    n[3] != 0
      ? (wordsList1[Number(n[3])] ||
          wordsList2[n[3][0]] + ' ' + wordsList1[n[3][1]]) +
        `${wordsList3.thousand} `
      : '';
  convertedWords +=
    n[4] != 0
      ? (wordsList1[Number(n[4])] ||
          wordsList2[n[4][0]] + ' ' + wordsList1[n[4][1]]) +
        `${wordsList3.hundred} `
      : '';
  convertedWords +=
    n[5] != 0
      ? (convertedWords != '' ? `${wordsList3.and} ` : '') +
        (wordsList1[Number(n[5])] ||
          wordsList2[n[5][0]] + ' ' + wordsList1[n[5][1]]) +
        `${wordsList3.only} `
      : '';

  // Check if number has decimals
  if (String(numbertoConvert).includes('.')) {
    const allNumbers = String(numbertoConvert).split('.');
    if (allNumbers.length > 1) {
      const decimalWords = [];
      const decimalnumbers = String(allNumbers[1]).split('');

      decimalnumbers.length = window.ROUNDOFF_UPTO;
      for (currentnumber of decimalnumbers) {
        if (Number(currentnumber) === 0) {
          decimalWords.push(wordsList3.zero);
        } else {
          decimalWords.push(wordsList1[Number(currentnumber)]);
        }
      }
      if (convertedWords.endsWith('only ')) {
        convertedWords = convertedWords.replace('only', '');
      }
      if (convertedWords)
        convertedWords += `${currency_name || ''} ${wordsList3.and} `;
      if (!sub_currency_name) {
        convertedWords += ' point ';
      }
      convertedWords += decimalWords.join(' ');
      convertedWords += ` ${sub_currency_name || ''} ${wordsList3.only}`;
    }
  }
  return convertedWords;
}

/**
 *
 * @param {Date to format} date
 */
function formatDate(date, onlyTime) {
  if (onlyTime) {
    var time =
      date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
    return time;
  }
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();
  var time =
    date.getHours() +
    ':' +
    date.getMinutes() +
    ':' +
    date.getSeconds() +
    ' ' +
    (date.getHours() >= 12 ? 'PM' : 'AM');

  return day + ' ' + monthNames[monthIndex] + ' ' + year + ' ' + time;
}

function formatAMPM(date, onlyTime) {
  if (onlyTime) {
    const time =
      date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
    return time;
  }
  const day = date.getDate();
  const monthIndex = date.getMonth();
  const year = date.getFullYear();

  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours %= 12;
  hours = hours || 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  const strTime = hours + ':' + minutes + ' ' + ampm;
  return day + ' ' + monthNames[monthIndex] + ' ' + year + ' ' + strTime;
}

function getTodaysDate() {
  const MyDate = new Date();
  let datetime;
  MyDate.setDate(MyDate.getDate());
  datetime =
    MyDate.getFullYear() +
    '-' +
    ('0' + (MyDate.getMonth() + 1)).slice(-2) +
    '-' +
    ('0' + MyDate.getDate()).slice(-2);
  return datetime;
}

/**
 *
 * @param {Property} obj
 */
function pickRandomProperty(obj) {
  let result;
  let count = 0;
  for (const prop in obj) if (Math.random() < 1 / ++count) result = prop;
  return result;
}

/**
 * Generates material color
 */
function materialColor() {
  // var property = pickRandomProperty(colors);
  const colorList = colors[pickRandomProperty(colors)];
  const newColorKey = pickRandomProperty(colorList);
  const newColor = colorList[newColorKey];
  return newColor;
}

function maskString(stringtoMask, startindex, endIndex, maskChar) {
  if (!stringtoMask) return;
  const stringLenght = String(stringtoMask).length;
  if (stringLenght === 0) return;
  if (startindex < stringLenght && startindex <= endIndex) {
    // replace(/\d/g, "*");
    const datatoMask = String(stringtoMask).substring(startindex, endIndex);
    const maskedString = datatoMask.replace(/./gm, maskChar);
    const remianingString = String(stringtoMask).replace(datatoMask, '');
    return { maskedString, remianingString };
  }
}

function addOrderlevelinstructions(billstatusReason, reason, type) {
  if (billstatusReason) {
    if (String(billstatusReason).includes(`${type}::`)) {
      const allreasons = String(billstatusReason).split('|');
      billstatusReason = allreasons
        .filter((x) => x && !x.includes(`${type}::`))
        .join('|');
      if (!billstatusReason) {
        billstatusReason = `${billstatusReason} ${type}::${reason}|`;
      }
    } else {
      billstatusReason = `${billstatusReason} ${type}::${reason}|`;
    }
  } else {
    billstatusReason = `${type}::${reason}|`;
  }
  return billstatusReason;
}

function getOrderlevelinstructions(reasons) {
  const response = { discount: '', billStatus: '' };
  if (reasons) {
    const instructions = String(reasons).split('|');

    if (instructions && instructions.length) {
      for (const current of instructions) {
        if (current.includes(`Bill Status::`)) {
          Object.assign(response, {
            billStatus: String(current).replace('Bill Status::', ''),
          });
        }
        if (current.includes(`Discount::`)) {
          Object.assign(response, {
            discount: String(current).replace('Discount::', ''),
          });
        }
      }
    }
  }
  return response;
}

function showLoader({ title, text }) {
  Swal.fire({
    title,
    html: text,
    showConfirmButton: false,
    width: '23em',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => {
      Swal.showLoading();
    },
    customClass: {
      popup: 'tmbill-swal-pop-up',
      title: 'tmbill-swal-title-class',
      content: 'tmbill-swal-title-class',
    },
  });
}

function showPopupMessage({ title, text }) {
  Swal.fire({
    title,
    text,
    // showCancelButton: true,
    allowOutsideClick: false,
    allowEscapeKey: false,
    width: '23em',
    confirmButtonText: $.i18n.t('controller:popup.OK'),
    customClass: {
      popup: 'tmbill-swal-pop-up',
    },
  });
}

function showResetDatePopup(data) {
  if (data) {
    // ✅ Your showResetDatePopup is now perfect (no toggle)
    $('#resetdateinfoModalid').modal('show');
    $('#resetdateinfoModalid').on('shown.bs.modal', function () {
      initializei18nforResetDateModal();
    });

    // ✅ REMOVE THIS LINE COMPLETELY:
    // $('#resetdateinfoModalid').modal('toggle');

    data.nextbillresetDate
      ? $('#billNumberresetdatemessageid').show()
      : $('#billNumberresetdatemessageid').hide();
    data.nextkotresetDate
      ? $('#kotnumberresetdatemessageid').show()
      : $('#kotnumberresetdatemessageid').hide();
    data.nextorderNumerResetDate
      ? $('#ordernumberresetdatemessageid').show()
      : $('#ordernumberresetdatemessageid').hide();
  }
}

if (isRenderer) {
  setTimeout(initializeWordlist, 500);
}

function istimebetweenTwotime(from, to) {
  let isBetween = false;
  if (from && to) {
    const currentTime = moment();
    const startTime = moment(from, 'HH:mm');
    const endTime = moment(to, 'HH:mm');
    isBetween = currentTime.isBetween(startTime, endTime);
  }

  return isBetween;
}

function checkIfTimeForMidnightReport() {
  const from = String(global.storeDetails.pdam_start_time);
  const to = String(global.storeDetails.pdam_end_time);
  let isBetween = false;
  if (from && to) {
    const currentTime = moment();
    const startTime = moment(from, 'HH:mm');
    const endTime = moment(to, 'HH:mm');
    isBetween = currentTime.isBetween(startTime, endTime);
  }

  return isBetween;
}

function setDateForMidnightOrder() {
  // check is time between two time
  const from = String(global.storeDetails.pdam_start_time);
  const to = String(global.storeDetails.pdam_end_time);

  const result = istimebetweenTwotime(from, to);

  if (result) {
    const orderDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
    const created_time = moment().subtract(1, 'days').format('x');
    const kotPlacedDate = moment()
      .subtract(1, 'days')
      .format('YYYY-MM-DD HH:mm:ss.SSS Z');
    return { orderDate, created_time, kotPlacedDate };
  }
}

function setDateForgettingMidnightReport() {
  // check is time between two time
  const from = String(global.storeDetails.pdam_start_time);
  const to = String(global.storeDetails.pdam_end_time);

  const result = istimebetweenTwotime(from, to);
  if (result) {
    const fromDate = window
      .moment()
      .subtract(1, 'days')
      .startOf('day')
      .format('x');
    const toDate = window.moment().subtract(1, 'days').endOf('day').format('x');
    const monthStart = window.moment().startOf('month').format('x');
    const monthEnd = window
      .moment()
      .subtract(1, 'days')
      .endOf('month')
      .format('x');
    const weekStart = window
      .moment()
      .subtract(1, 'days')
      .startOf('week')
      .format('x');
    const weekEnd = window
      .moment()
      .subtract(1, 'days')
      .endOf('week')
      .format('x');
    return { fromDate, toDate, monthStart, monthEnd, weekStart, weekEnd };
  }
}

module.exports = {
  showPopupMessage,
  showResetDatePopup,
  checkIfTimeForMidnightReport,
  setDateForgettingMidnightReport,
  setDateForMidnightOrder,
  istimebetweenTwotime,
  getOrderlevelinstructions,
  addOrderlevelinstructions,
  maskString,
  getTableData_AsJson,
  numberTowords,
  formatDate,
  getTodaysDate,
  formatAMPM,
  materialColor,
  sleep,
  showLoader,
};
