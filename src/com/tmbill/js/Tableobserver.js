/* eslint-disable no-restricted-syntax */
let tablewatchersList = [];
let tableupdateInterval;

// function addtabletowatchList(id, kotcreatedAt) {
//   if (kotcreatedAt && id) {
//     const doesExist = _.find(tablewatchersList, { id });
//     if (!doesExist) {
//       // let relativeTime = moment(kotcreatedAt).fromNow();
//       // Current timestamp
//       const now = window.moment();

//       // Calculate difference in milliseconds
//       const differenceInMs = now.diff(window.moment(kotcreatedAt));

//       // Convert difference to duration and format as hours and minutes
//       const duration = window.moment.duration(differenceInMs);
//       const hours = Math.floor(duration.asHours()); // Total hours
//       const minutes = duration.minutes(); // Remaining minutes
//       let relativeTime = `${hours} H, ${minutes} M`;
//       if (hours === 0) {
//         relativeTime = `${minutes} M`;
//       }
//       if (hours === 0 && minutes === 0) {
//         relativeTime = `Few seconds ago`;
//       }
//       tablewatchersList.push({
//         id,
//         kotcreatedAt,
//         relativeTime,
//       });
//       $(`#${id} label.table-button-kottime-label`)
//         .attr('title', `KOT was placed ${relativeTime} ago`)
//         .html(relativeTime);

//       if (tableupdateInterval == undefined) {
//         tableupdateInterval = setInterval(startWatchingtables, 60000); // 1-min:60000,2-min:120000
//       }
//     } else {
//       startWatchingtables();
//     }
//   }
// }

function addtabletowatchList(id, kotcreatedAt) {
  if (!kotcreatedAt || !id) return;

  const doesExist = tablewatchersList.some((item) => item.id === id);

  if (!doesExist) {
    // Calculate time difference using native JS (faster than moment.js)
    const now = Date.now();
    const kotTime = new Date(kotcreatedAt).getTime();
    const diffMs = now - kotTime;

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let relativeTime = `${hours} H, ${minutes} M`;
    if (hours === 0) relativeTime = `${minutes} M`;
    if (hours === 0 && minutes === 0) relativeTime = `Few seconds ago`;

    // Store data
    tablewatchersList.push({ id, kotcreatedAt, relativeTime });

    // Cache selector to avoid repeated DOM lookups
    const $label = $(`#${id} label.table-button-kottime-label`);
    if ($label.length) {
      $label.attr('title', `KOT was placed ${relativeTime} ago`);
      $label.text(relativeTime);
    }

    // Create interval only once
    if (!tableupdateInterval) {
      tableupdateInterval = setInterval(startWatchingtables, 60000);
    }
  } else {
    // Instead of calling immediately, maybe mark for next interval update
    // Calling startWatchingtables() here can cause too frequent updates
    requestAnimationFrame(startWatchingtables);
  }
}

function startWatchingtables() {
  if (tablewatchersList && tablewatchersList.length > 0) {
    for (const table of tablewatchersList) {
      // table.relativeTime = moment(table.kotcreatedAt).fromNow();
      const previousTimestamp = table.kotcreatedAt;
      const currentTimestamp = Date.now();
      // let relativeTime = Math.ceil(
      //   (currentTimestamp - previousTimestamp) / 60000,
      // );
      // Current timestamp
      const now = window.moment();

      // Calculate difference in milliseconds
      // const differenceInMs = now.diff(
      //   window.moment(currentTimestamp - previousTimestamp),
      // );

      // Convert difference to duration and format as hours and minutes
      const duration = window.moment.duration(
        window.moment(currentTimestamp - previousTimestamp),
      );
      const hours = Math.floor(duration.asHours()); // Total hours
      const minutes = duration.minutes(); // Remaining minutes
      const relativeTime = `${hours} hour, ${minutes} mnt`;
      table.relativeTime = relativeTime;
      let title = `KOT was placed ${hours} H, ${minutes} M ago`;
      if (hours === 0) {
        title = `KOT was placed ${minutes} minutes ago`;
      }
      let htmlTitle = `${hours} H, ${minutes} M`;
      if (hours === 0) {
        htmlTitle = `${minutes} M`;
      }
      if (hours === 0 && minutes === 0) {
        htmlTitle = `Few seconds ago`;
      }
      $(`#${table.id} label.table-button-kottime-label`)
        .attr('title', title)
        .html(htmlTitle);
    }
  } else {
    clearInterval(tableupdateInterval);
    tableupdateInterval = undefined;
  }
}

function removetablefromwathersList(id) {
  const index = _.findIndex(tablewatchersList, { id });
  if (index >= 0) {
    tablewatchersList.splice(index, 1);
    $(`#table_${id} label.table-button-kottime-label`)
      .attr('title', ``)
      .html('&nbsp');
  }
  if (tablewatchersList && tablewatchersList.length == 0) {
    clearInterval(tableupdateInterval);
    tableupdateInterval = undefined;
  }
}

function settableWatcherslist(list) {
  tablewatchersList = list;
  if (tablewatchersList.length == 0) {
    clearInterval(tableupdateInterval);
    tableupdateInterval = undefined;
  }
}
module.exports = {
  removetablefromwathersList,
  addtabletowatchList,
  settableWatcherslist,
};
