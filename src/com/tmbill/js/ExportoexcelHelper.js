/* eslint-disable no-restricted-syntax */
/* eslint-disable no-undef */
function exportDattoexcel({ data, name }) {
  json2excel({
    data: data,
    name,
  });
}

function exportstartenddayReport({ shift_data }) {
  let startdatendreportdata = [];
  let startendDaydetails = [];
  startendDaydetails.push(shift_data);
  if (
    startendDaydetails &&
    Array.isArray(startendDaydetails) &&
    startendDaydetails.length
  ) {
    for (const currentDetails of startendDaydetails) {
      startdatendreportdata.push({
        'Start Day': moment(currentDetails.fromDate, 'x').format(
          'DD MMMM YYYY hh:mm A',
        ),
        'End Day': moment(currentDetails.toDate, 'x').format(
          'DD MMMM YYYY hh:mm A',
        ),
        'Day Start By': currentDetails.day_start_by_user,
        'Day End By': currentDetails.username,
        'Opening Balance': Number(currentDetails.opening_balance).toFixed(
          ROUNDOFF_UPTO,
        ),
        'Closing Balance': Number(
          currentDetails.current_closing_balance,
        ).toFixed(ROUNDOFF_UPTO),
        'Total Expense': Number(currentDetails.total_expense).toFixed(
          ROUNDOFF_UPTO,
        ),
        'Total Sales': Number(currentDetails.total_sales).toFixed(
          ROUNDOFF_UPTO,
        ),
        'Invoice Range': currentDetails.invoice_range,
        'Start Day comment': currentDetails.start_day_comment,
        'End Day comment': currentDetails.close_day_comment,
        'close day amount': Number(currentDetails.close_day_amount).toFixed(
          ROUNDOFF_UPTO,
        ),
        'cash difference': Number(currentDetails.cash_diff).toFixed(
          ROUNDOFF_UPTO,
        ),
      });
    }

    json2excel({
      data: startdatendreportdata,
      name: 'Start End day report',
    });
  }
}

function exportStartEndShiftReport({ shift_data }) {
  let startdatendreportdata = [];
  let startendDaydetails = [];
  startendDaydetails.push(shift_data);
  if (
    startendDaydetails &&
    Array.isArray(startendDaydetails) &&
    startendDaydetails.length
  ) {
    for (const currentDetails of startendDaydetails) {
      startdatendreportdata.push({
        'Start shift': moment(currentDetails.fromDate, 'x').format(
          'DD MMMM YYYY hh:mm A',
        ),
        'End shift': moment(currentDetails.toDate, 'x').format(
          'DD MMMM YYYY hh:mm A',
        ),
        'Shift Start By': currentDetails.shift_start_by_user,
        'Shift End By': currentDetails.shift_end_by_user,
        'Opening Balance': Number(currentDetails.opening_balance).toFixed(
          ROUNDOFF_UPTO,
        ),
        'Closing Balance': Number(currentDetails.closing_balance).toFixed(
          ROUNDOFF_UPTO,
        ),
        'Total Expense': Number(currentDetails.total_expense).toFixed(
          ROUNDOFF_UPTO,
        ),
        'Total Sales': Number(currentDetails.total_sales).toFixed(
          ROUNDOFF_UPTO,
        ),
        'Invoice Range': currentDetails.invoice_range,
        'Start Shift comment': currentDetails.shift_start_comment,
        'End Shift comment': currentDetails.shift_end_comment,
        'Close shift amount': Number(currentDetails.close_shift_amount).toFixed(
          ROUNDOFF_UPTO,
        ),
        'Cash difference': Number(currentDetails.cash_diff).toFixed(
          ROUNDOFF_UPTO,
        ),
      });
    }

    json2excel({
      data: startdatendreportdata,
      name: 'Start End shift report',
    });
  }
}

module.exports = {
  exportDattoexcel,
  exportstartenddayReport,
  exportStartEndShiftReport,
};
