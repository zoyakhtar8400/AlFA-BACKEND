const fs = require('fs');
let CronJob = require('cron').CronJob;
const forEach = require('lodash/forEach');
const debounce = require('lodash/debounce');
const {
  SHOW_NOTIFICATION,
  ORDER_IPC,
  FETCH_CATEGORIES_AND_MENU,
} = require('../util/IPC_Messages');
const connection = require('../js/database');
const { safeParseformain } = require('../main_controllers/Utils');

let scheduledJobs = [];
let preordernotificationJobs = [];
let backupCronjob;
let showCategoryjob;
let fetchDatejob;

function startcronJob({ callBack }) {
  destroyallJobs();
  startresetbillkotJobs(callBack);

  if (global.storeDetails && global.storeDetails.store_id) checkforPreorders();
}

function sendPreordernotification(order) {
  // console.log(`Send Pre-Order notification`);
  if (global.mainWindow && order) {
    let deliveryDate = moment(order.delivery_at).format(`DD MMMM YY hh:mm A`);
    let message = `Pre-Order is scheduled ${deliveryDate}.(${
      order.customer_name || ''
    } - ${order.customer_mobile || ''} )`;
    global.mainWindow.webContents.send(SHOW_NOTIFICATION, {
      issystemNotification: true,
      data: {
        notification: {
          body: {
            msg: message,
          },
          title: 'Pre-Order',
        },
      },
    });
    global.mainWindow.webContents.send(SHOW_NOTIFICATION, {
      showPrompt: true,
      promptTitle: 'Pre Order',
      promptText: message,
      showConfirmButton: true,
      showLoader: false,
    });
    global.mainWindow.webContents.send(ORDER_IPC.SHOW_PUSH_NOTIFICATION, {
      title: `Pre-Order`,
      data: message,
    });
  }
}

async function checkforPreorders() {
  try {
    if (
      preordernotificationJobs &&
      Array.isArray(preordernotificationJobs) &&
      preordernotificationJobs.length
    ) {
      preordernotificationJobs.forEach((job) => {
        if (job) job.stop();
      });
      preordernotificationJobs = [];
    }
    let preorders = await connection.PreOrder.findAll({
      raw: true,
      where: {
        status: 'created',
        store_id: global.storeDetails.store_id,
      },
    });
    forEach(preorders, (order) => {
      let cronTime;
      let currenttime = Number(moment().format('x'));
      if (order.notification_time) {
        cronTime = order.notification_time;
      }
      if (!cronTime && order.delivery_at) {
        cronTime = order.delivery_at;
      }

      // Check if notification time is already passed and it is currently behind
      // the delivery time then set the cron time 10 minutes behind the delivery time
      if (
        !order.notification_time &&
        cronTime < currenttime &&
        order.delivery_at > currenttime
      ) {
        // let notificationTime = moment(cronTime);
        // let
        // let duration = moment().duration(moment(currenttime).diff(moment()));
        cronTime = moment(order.delivery_at).subtract(10, 'minutes');
        // console.log('schedule 10 minutes before delivery');
      }
      let date = moment(cronTime).toDate();
      createandaddjobtolist(date, order, preordernotificationJobs);
    });
  } catch (error) {
    console.log(error);
  }
}

function createandaddjobtolist(date, order, list) {
  try {
    let job = new CronJob(
      date,
      () => {
        sendPreordernotification(order);
      },
      null,
      true,
    );
    list.push(job);
    job.start();
  } catch (error) {}
}

function destroyallJobs() {
  scheduledJobs.forEach((job) => {
    job.stop();
  });
  preordernotificationJobs.forEach((job) => {
    job.stop();
  });

  scheduledJobs = [];
  preordernotificationJobs = [];
}

async function restartPreordersjobs() {
  if (global.storeDetails && global.storeDetails.store_id) checkforPreorders();
}

async function startresetbillkotJobs(callBack) {
  if (global.storeDetails === undefined) {
    setTimeout(() => {
      startresetbillkotJobs();
    }, 10000);
  } else {
    console.log('start cron job::', global.storeDetails.reset_bill_time);
    if (global.storeDetails.reset_bill_time) {
      try {
        let billresetDate = moment(
          global.storeDetails.reset_bill_time,
          'x',
        ).toDate();
        let billresetJob = new CronJob(
          billresetDate,
          () => {
            if (callBack) debouncedCheckreset(callBack);
          },
          null,
          true,
        );

        scheduledJobs.push(billresetJob);
        billresetJob.start();
        console.log(
          `Message="Bill reset cron job is ${
            billresetJob.running ? '' : 'not'
          } running"`,
        );
      } catch (error) {}
    }

    if (global.storeDetails.reset_kot_time) {
      try {
        let kotresetDate = moment(
          global.storeDetails.reset_kot_time,
          'x',
        ).toDate();
        let kotresetJob = new CronJob(
          kotresetDate,
          () => {
            if (callBack) debouncedCheckreset(callBack);
          },
          null,
          true,
        );
        scheduledJobs.push(kotresetJob);
        kotresetJob.start();
        console.log(
          `Message="KOT reset cron job is ${
            kotresetJob.running ? '' : 'not'
          } running"`,
        );
      } catch (error) {}
    }

    if (global.storeDetails.extra_info) {
      try {
        const extraInfo = safeParseformain(global.storeDetails.extra_info);
        if (
          extraInfo.reset_order_no_in_days &&
          extraInfo.reset_order_no_date &&
          Number(extraInfo.reset_order_no_in_days) > 0
        ) {
          let ordernoresetJob = new CronJob(
            new Date(extraInfo.reset_order_no_date),
            () => {
              if (callBack) debouncedCheckreset(callBack);
            },
            null,
            true,
          );
          scheduledJobs.push(ordernoresetJob);
          ordernoresetJob.start();
          console.log(
            `Message="Order No reset cron job is ${
              ordernoresetJob.running ? '' : 'not'
            } running"`,
          );
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (scheduledJobs.length) {
      console.log('Message="Bill/KOT/Order No reset cron job started..."');
    }
  }
}

const debouncedCheckreset = debounce(function (callBack) {
  callBack();
  destroyallJobs();
}, 5000);

function sendsystemNotificationtoUser(title, message) {
  global.mainWindow.webContents.send(SHOW_NOTIFICATION, {
    issystemNotification: true,
    data: {
      notification: {
        body: {
          msg: message,
        },
        title: title,
      },
    },
  });
}

/*
 * Starts the backup database job
 */
async function startDatabasebackup() {
  try {
    let destinationDirectory;
    let storedDatabasebakpathdetails = await connection.Settings.findOne({
      raw: true,
      where: {
        id: 113, // Use the directory path setting id for this
      },
    });
    if (storedDatabasebakpathdetails && storedDatabasebakpathdetails.value) {
      destinationDirectory = storedDatabasebakpathdetails.value;
    }
    // If backup directory path is not provided then ask the path
    if (!destinationDirectory) {
      sendsystemNotificationtoUser(
        'TMBill Backup Config',
        'Please set backup directory to prevent unwanted database corruption. ',
      );
    }

    if (destinationDirectory && fs.existsSync(destinationDirectory)) {
      console.log(`Backup job started..`);
      // Database file path
      const databaseFilepath = Config.DBConfig.path;
      const backupfileName =
        destinationDirectory +
        `/database-bak-${moment().format('YYYY-MMM-DD hh:mm a')}.sqlite`;
      fs.copyFile(databaseFilepath, backupfileName, (err) => {
        if (err) throw err;
        console.log(`Backup job completed..`);
      });
    } else {
      sendsystemNotificationtoUser(
        'TMBill Backup Config',
        'Please set backup directory to prevent unwanted database corruption. ',
      );
    }
  } catch (e) {
    console.error(`Backup job failed..`);
  }
}

async function startdatabasebackupJob() {
  try {
    console.log(`Setup the backup job..`);
    if (backupCronjob) {
      backupCronjob.stop();
    }
    // 0 11,21 * * *
    backupCronjob = new CronJob(
      '0 11,21 * * * ',
      startDatabasebackup,
      null,
      true,
    );
    backupCronjob.start();
    // setTimeout(startDatabasebackup, 4000);
  } catch (error) {
    console.log(error);
  }
}

async function fetchCategories() {
  global.mainWindow.webContents.send(FETCH_CATEGORIES_AND_MENU, {});
}

//start category job
async function startCategoryTimeJob(data) {
  try {
    console.log(`Setup the show catgeory job..`);
    let hour;
    let minute;
    if (data && data.time) {
      const [hours, minutes] = data.time.split(':');
      hour = parseInt(hours, 10);
      minute = parseInt(minutes, 10);
    }
    if (showCategoryjob) {
      showCategoryjob.stop();
    }
    // 0 11,21 * * *
    showCategoryjob = new CronJob(
      `0 ${minute} ${hour} * * * `,
      fetchCategories,
      null,
      true,
    );
    showCategoryjob.start();
    // setTimeout(startDatabasebackup, 4000);
  } catch (error) {
    console.log(error);
  }
}

//start category job
async function startGetDateJob() {
  try {
    console.log(`Setup the get date job..`);
    if (fetchDatejob) {
      fetchDatejob.stop();
    }
    // 0 11,21 * * *
    fetchDatejob = new CronJob(`0 */12 * * *`, fetchDate, null, true);
    fetchDatejob.start();
    // setTimeout(startDatabasebackup, 4000);
  } catch (error) {
    console.log(error);
  }
}

async function fetchDate() {}

//fetch categories
async function fetchCategory() {}
module.exports = {
  destroyallJobs,
  startcronJob,
  restartPreordersjobs,
  startdatabasebackupJob,
  startCategoryTimeJob,
  startGetDateJob,
  startresetbillkotJobs,
};
