const moment = require('moment');

/**
 * Resolves the effective business date based on:
 * 1. An active open session in mpos_startday_endday (if present)
 * 2. Store closing boundary configuration (defaults to 02:00 AM closing)
 * 
 * Rule:
 * Transactions before midnight on Date X belong to Business Date X.
 * Transactions between 12:00:00 AM and 01:59:59 AM (or configured closing hour)
 * belong to the previous day's operating session (Date X).
 * 
 * If a session is open from Date X and it's 03:00 AM because Night Audit is delayed,
 * it safely remains associated with the active open session's business date.
 */
function resolveBusinessDate(activeSession, storeSettings = {}, targetTimestamp = null) {
  // 1. If an active open session exists in DB with an established business date
  if (activeSession && activeSession.business_date) {
    return {
      businessDate: activeSession.business_date,
      source: 'ACTIVE_SESSION',
      sessionId: activeSession.id,
      sessionStatus: 'OPEN'
    };
  }

  // 2. Calculate using configured restaurant closing time
  // Store closing hour default: 2 (i.e. 02:00 AM)
  let closeHour = 2;
  let closeMinute = 0;

  const dayCloseTime = storeSettings.day_close_time || (storeSettings.settings && storeSettings.settings.day_close_time);
  if (dayCloseTime && typeof dayCloseTime === 'string' && dayCloseTime.includes(':')) {
    const parts = dayCloseTime.split(':').map(Number);
    if (!isNaN(parts[0])) closeHour = parts[0];
    if (!isNaN(parts[1])) closeMinute = parts[1];
  } else if (storeSettings.pdam_end_time !== undefined && storeSettings.pdam_end_time !== null) {
    const num = Number(storeSettings.pdam_end_time);
    if (!isNaN(num) && num >= 0 && num <= 23) {
      closeHour = num;
    }
  }

  const dt = targetTimestamp ? moment(targetTimestamp) : moment();
  const currentHour = dt.hours();
  const currentMinute = dt.minutes();

  // If current time is past midnight but before the closing cutoff (e.g. before 02:00 AM)
  const isPastMidnightBeforeCutoff = (currentHour < closeHour) || (currentHour === closeHour && currentMinute < closeMinute);

  let calculatedBusinessDate;
  if (isPastMidnightBeforeCutoff) {
    // Belongs to the previous calendar day's business session
    calculatedBusinessDate = dt.clone().subtract(1, 'day').format('YYYY-MM-DD');
  } else {
    calculatedBusinessDate = dt.format('YYYY-MM-DD');
  }

  return {
    businessDate: calculatedBusinessDate,
    source: 'STORE_CONFIG_SCHEDULE',
    closingHour: closeHour,
    closingMinute: closeMinute,
    sessionStatus: activeSession ? 'OPEN' : 'STANDBY'
  };
}

module.exports = {
  resolveBusinessDate
};
