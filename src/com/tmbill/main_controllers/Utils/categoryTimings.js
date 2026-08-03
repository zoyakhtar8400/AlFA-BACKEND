const { CATEGROY_DAYS_FOR_MAIN } = require('.');
const { startCategoryTimeJob } = require('../../util/Jobs');

async function fetchCategoryTimingsandsetcronjob(connection) {
  try {
    let categories = await connection.Category.findAll({
      raw: true,
      where: {
        store_id: global.storeDetails.store_id,
        is_active: 1,
      },
    });

    if (categories && categories.length) {
      categories.forEach(function (item, index) {
        let timings = JSON.parse(item.timings);
        let timesArray = [];
        if (timings) {
          timings.forEach((time) => {
            if (time && time.day) {
              let currentDate = moment();
              let currentDay = currentDate.day();
              let valid_days = time.day;
              if (valid_days.includes(CATEGROY_DAYS_FOR_MAIN[currentDay])) {
                if (time && time?.slots.length) {
                  time.slots.forEach((slot) => {
                    timesArray.push(slot.start_time);
                    timesArray.push(slot.end_time);
                  });
                }
              }
            }
          });
          if (timesArray && timesArray.length) {
            takeNeartestTimeandstartCronjob(timesArray);
          }
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
}

function takeNeartestTimeandstartCronjob(timesArray) {
  // Get the current time
  const currentDate = new Date();
  const currentHours = currentDate.getHours();
  const currentMinutes = currentDate.getMinutes();

  // Convert current time to total minutes since midnight
  const currentTimeInMinutes = currentHours * 60 + currentMinutes;

  // Find the nearest time from the array
  let nearestTime;
  let minDifference = Infinity;

  for (const time of timesArray) {
    // Convert the given time to hours and minutes
    const [givenHours, givenMinutes] = time.split(':').map(Number);

    // Convert the given time to total minutes since midnight
    const givenTimeInMinutes = givenHours * 60 + givenMinutes;

    // Calculate the absolute difference between the current time and the given time
    const difference = Math.abs(currentTimeInMinutes - givenTimeInMinutes);

    // Update nearestTime if the current time is closer
    if (difference < minDifference) {
      minDifference = difference;
      nearestTime = time;
    }
  }

  if (nearestTime) {
    startCategoryTimeJob({ time: nearestTime });
  }
}

module.exports = {
  fetchCategoryTimingsandsetcronjob,
};
