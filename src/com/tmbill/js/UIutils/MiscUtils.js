/* eslint-disable camelcase */
const GULF_COUNTRIES = [
  'Bahrain',
  'Iran',
  'Iraq',
  'Kuwait',
  'Oman',
  'Qatar',
  'Saudi Arabia',
  'United Arab Emirates',
  'Yemen',
  'Jordan',
  'Tunisia',
  'Algeria',
  'Egypt',
  'Lebanon',
];

function aggregatePayments(payments) {
  const grouped = payments.reduce((acc, curr) => {
    const key = `${curr.order_id}-${curr.payment_option}`;

    // Convert amount to a fixed number
    const currAmount = parseFloat(curr.amount).toFixed(window.ROUNDOFF_UPTO);

    if (!acc[key]) {
      acc[key] = { ...curr, amount: currAmount, count: 1 };
    } else {
      const existingAmount = acc[key].amount;

      // If amounts match, sum them; otherwise, keep separate entries
      if (existingAmount === currAmount) {
        acc[key].amount = (
          parseFloat(existingAmount) + parseFloat(currAmount)
        ).toFixed(2);
        acc[key].count += 1;
      } else {
        acc[key + `-${acc[key].count}`] = {
          ...curr,
          amount: currAmount,
          count: acc[key].count,
        };
        acc[key].count += 1;
      }
    }

    return acc;
  }, {});

  const result = Object.values(grouped).map(({ count, ...rest }) => rest);

  return result;
}

module.exports = {
  GULF_COUNTRIES,
  aggregatePayments,
};
