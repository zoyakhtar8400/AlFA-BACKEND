/* eslint-disable camelcase */
const { CATEGROY_DAYS } = require('../../util/Constants');
const { istimebetweenTwotime } = require('../../util/MiscUtil');

function showCategoryOntime(categories) {
  const treeData = [];
  categories.forEach((item) => {
    const timings = JSON.parse(item.timings);
    let showCategory = false;
    if (timings) {
      timings.forEach((time) => {
        if (time && time.day) {
          const currentDate = window.moment();
          const currentDay = currentDate.day();
          //   let valid_days = time.day.split(',');
          const valid_days = time.day;
          if (valid_days.includes(CATEGROY_DAYS[currentDay])) {
            // return;
            // treeData.push(template);

            if (time && time?.slots.length) {
              time.slots.forEach((slot) => {
                const isBetween = istimebetweenTwotime(
                  slot.start_time,
                  slot.end_time,
                );
                if (isBetween) {
                  showCategory = true;
                }
              });
            }
          }
        }
      });
    }
    if (timings) {
      if (!showCategory) {
        treeData.push(template);
      }
    }
  });
}

module.exports = {
  showCategoryOntime,
};
