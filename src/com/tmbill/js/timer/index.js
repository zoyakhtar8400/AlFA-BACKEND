const { Timer } = require('easytimer.js');

let timer = new Timer();

/**
 * Show timer after which next action is allowed
 * @param {Countdown seconds} seconds
 */
function showCountdown({ seconds, elementtoDisable, timerElement }) {
  timer.start({ countdown: true, startValues: { seconds: seconds } });
  $(elementtoDisable).addClass('ui-state-disabled');

  $(timerElement).html(timer.getTimeValues().toString());

  timer.addEventListener('secondsUpdated', function (e) {
    $(timerElement).html(timer.getTimeValues().toString());
  });

  timer.addEventListener('targetAchieved', function (e) {
    $(timerElement).html('&nbsp;');
    $(elementtoDisable).removeClass('ui-state-disabled');
  });

  timer.addEventListener('stopped', function (e) {
    $(timerElement).html('&nbsp;');
    $(elementtoDisable).removeClass('ui-state-disabled');
  });
}

function showCountdownForOnlineOrder(timerElement, initialTime) {
  let seconds = initialTime;

  // Update the timer every second
  const interval = setInterval(function () {
    if (seconds == 180) {
      $(timerElement).addClass('prepTimeneartoend');
    }
    if (seconds <= 0) {
      clearInterval(interval);
      $(timerElement).text('');
    } else {
      const minutes = Math.floor(seconds / 60);
      const formattedSeconds = (seconds % 60).toString().padStart(2, '0');
      const formattedTime = `Prep. time: ${minutes}:${formattedSeconds}`;
      $(timerElement).text(formattedTime);
      seconds--;
    }
  }, 1000);
}

function showCountdownForMACButton(timerElement, timeStamp, threshold) {
  // Update the timer every second
  const interval = setInterval(function () {
    let isTimeWithinthreshold = isTimestampWithinThreshold(
      timeStamp,
      threshold,
    );
    if (!isTimeWithinthreshold) {
      clearInterval(interval);
      $(timerElement).hide();
    }
  }, 1000);
}

function isTimestampWithinThreshold(givenTimestamp, thresholdSeconds) {
  const currentTimestamp = new Date().getTime();
  const difference = currentTimestamp - givenTimestamp;

  // Convert the threshold to milliseconds
  const thresholdMilliseconds = thresholdSeconds * 1000;

  // Compare the difference with the threshold
  return Math.abs(difference) <= thresholdMilliseconds;
}

module.exports = {
  showCountdown,
  showCountdownForOnlineOrder,
  showCountdownForMACButton,
};
