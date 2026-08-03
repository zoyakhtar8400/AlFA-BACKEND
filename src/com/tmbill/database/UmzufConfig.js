/* eslint-disable camelcase */
const { Umzug, SequelizeStorage } = require('umzug');
const isNumber = require('lodash/isNumber');
const db = require('../js/database');
const { sendResetdatedetails } = require('../services/SyncService');
const { startcronJob } = require('../util/Jobs');
const { isEmpty } = require('../main_controllers/Utils');
const { BILL_NUMBER_RESET_DATE_NOTIFICATION } = require('../util/IPC_Messages');

const stringConstructor = 'test'.constructor;

function safeParse(params) {
  let parsed = params;
  try {
    if (parsed && parsed.constructor === stringConstructor) {
      parsed = JSON.parse(parsed);
    }
  } catch (error) {
    console.error(`Message="Error While Safe Parse"`, error);
  }
  return parsed;
}

const umzug = new Umzug({
  migrations: {
    glob: [`../migrations/*.js`, { cwd: __dirname }],
    resolve: ({ name, path, context }) => {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const migration = require(path);
      return {
        // adjust the parameters Umzug will
        // pass to migration methods when called
        name,
        up: async () => migration.up(context, db.Sequelize),
        down: async () => migration.down(context, db.Sequelize),
      };
    },
  },
  context: db.sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize: db.sequelize }),
  logger: console,
});

async function Up() {
  try {
    const migrations = await umzug.up();
    console.log(migrations);
  } catch (error) {
    console.log(error);
  }
}

async function resetCurrenttempnumbersandsendupdate(params) {
  try {
    await db.Tempnumbers.update(
      {
        ...params,
        takeawaybill_number: 1,
        takeawaykot_number: 1,
      },
      { where: { id: 1 } },
    );
    // eslint-disable-next-line no-use-before-define
    updatenextresetDates({
      store: global.storeDetails,
      resetKotdate: params.kot_number !== undefined,
      resetBilldate: params.bill_number !== undefined,
      resetOrderNumberDate: params.order_number !== undefined,
    });
  } catch (error) {
    console.error(error);
  }
}

async function checkifresetisRequired2() {
  console.log('Message="Check if Bill/KOT reset is required.."');
  try {
    const resetParams = {};
    if (global.storeDetails) {
      if (
        global.storeDetails.resetBillAfterDays &&
        global.storeDetails.reset_bill_time &&
        isNumber(global.storeDetails.resetBillAfterDays)
      ) {
        const nextbillDate = global.moment(
          Number(global.storeDetails.reset_bill_time),
        );
        console.log(
          'Check store bill reset date::',
          global.storeDetails.reset_bill_time,
        );
        const isbilldatePassed = global.moment().isSameOrAfter(nextbillDate);
        console.log(
          `Message="Bill Reset Date is ${
            isbilldatePassed ? 'passed' : 'Not Passed'
          }"`,
        );

        if (isbilldatePassed) {
          console.log('bill passed current date:', Date.now());
          Object.assign(resetParams, {
            bill_number: 1,
            secondary_bill_number: 1,
            barSection_bill_number: 1,
          });
        }
      }
      if (
        global.storeDetails.reset_kot_indays &&
        global.storeDetails.reset_kot_time &&
        global.storeDetails.reset_kot_indays !== 0 &&
        isNumber(global.storeDetails.reset_kot_indays)
      ) {
        const nextkotDate = global.moment(
          Number(global.storeDetails.reset_kot_time),
        );
        console.log(
          'check store kot reset date::',
          global.storeDetails.reset_kot_time,
        );
        const iskotdatePassed = global.moment().isSameOrAfter(nextkotDate);
        console.log(
          `Message="KOT Reset Date is ${
            iskotdatePassed ? 'passed' : 'Not Passed'
          }"`,
        );
        if (iskotdatePassed) {
          console.log('kot passed current date:', Date.now());
          Object.assign(resetParams, {
            kot_number: 1,
            barSection_kot_number: 1,
          });
        }
      }

      let extra_info;
      if (global.storeDetails && global.storeDetails.extra_info) {
        extra_info = safeParse(global.storeDetails.extra_info);
      }
      if (
        extra_info &&
        extra_info.reset_order_no_in_days &&
        extra_info.reset_order_no_date &&
        isNumber(extra_info.reset_order_no_in_days)
      ) {
        const formatted_date = global
          .moment(extra_info.reset_order_no_date, 'YYYY-MM-DD hh:mm a')
          .format('x');

        const nextOrderNumberDate = global.moment(Number(formatted_date));
        console.log(
          'Check store order number reset date::',
          nextOrderNumberDate,
        );
        const isorderNumberdatePassed = global
          .moment()
          .isSameOrAfter(nextOrderNumberDate);

        console.log(
          `Message="Order Reset Date is ${
            isorderNumberdatePassed ? 'passed' : 'Not Passed'
          }"`,
        );
        if (isorderNumberdatePassed) {
          Object.assign(resetParams, {
            order_number: 1,
            order_type_wise_order_number: {},
          });
        }
      }
    }
    if (Object.keys(resetParams).length !== 0) {
      resetCurrenttempnumbersandsendupdate(resetParams);
    }
  } catch (error) {
    console.error(`Message="Error While Checking Next Reset Date"`, error);
  }
}

/**
 * Check if store exists then add
 * @param {*} store
 */
async function addorupdateStore(store) {
  const resetParams = {
    store,
    resetBilldate: false,
    resetKotdate: false,
    resetOrderNumberdate: false,
  };
  try {
    const count = await db.Store.count({
      where: {
        store_id: store.store_id,
        username: store.username,
      },
    });
    if (count === 0) {
      await db.Store.destroy({
        where: { store_id: store.store_id },
      });
      await db.Store.create(store);
      console.log('add store');
      Object.assign(resetParams, {
        resetBilldate: true,
        resetKotdate: true,
        resetOrderNumberdate: false,
      });
    } else {
      console.log('update store');
      // compare next reset dates
      const storeDetails = await db.Store.findAll({
        raw: true,
        where: {
          store_id: store.store_id,
        },
      });
      if (storeDetails) {
        // next bill number reset date

        if (
          storeDetails[0].reset_bill_time &&
          store.reset_bill_time
          //  &&
          // storeDetails[0].reset_bill_time > store.reset_bill_time
        ) {
          const date1 = new Date(Number(storeDetails[0].reset_bill_time));
          const date2 = new Date(Number(store.reset_bill_time));

          // Extract date parts
          // let storeBillResetDate = dateStr1.toISOString().split('T')[0];
          // let loginBillResetDate = dateStr2.toISOString().split('T')[0];
          const storeBillResetDate = new Date(
            date1.getFullYear(),
            date1.getMonth(),
            date1.getDate(),
          );
          const loginBillResetDate = new Date(
            date2.getFullYear(),
            date2.getMonth(),
            date2.getDate(),
          );
          if (storeBillResetDate > loginBillResetDate) {
            // eslint-disable-next-line no-param-reassign
            delete store.reset_bill_time;
          }
        }
        // next kot number reset date
        if (
          storeDetails[0].reset_kot_time &&
          store.reset_kot_time
          // &&
          // storeDetails[0].reset_kot_time > store.reset_kot_time
        ) {
          const date1 = new Date(Number(storeDetails[0].reset_kot_time));
          const date2 = new Date(Number(store.reset_kot_time));

          // let storeKOTResetDate = dateStr1.toISOString().split('T')[0];
          // let loginKOTResetDate = dateStr2.toISOString().split('T')[0];
          const storeKOTResetDate = new Date(
            date1.getFullYear(),
            date1.getMonth(),
            date1.getDate(),
          );
          const loginKOTResetDate = new Date(
            date2.getFullYear(),
            date2.getMonth(),
            date2.getDate(),
          );
          if (storeKOTResetDate > loginKOTResetDate) {
            // eslint-disable-next-line no-param-reassign
            delete store.reset_kot_time;
          }
        }
        // next order number reset date

        const storeDetails_extra_info = JSON.parse(storeDetails[0].extra_info);
        const store_extra_info = store.extra_info;
        if (
          storeDetails_extra_info.reset_order_no_date &&
          store_extra_info.reset_order_no_date
        ) {
          const date1 = new Date(storeDetails_extra_info.reset_order_no_date);
          const date2 = new Date(store_extra_info.reset_order_no_date);

          const storeOrderNumberDate = date1.toISOString().split('T')[0];
          const loginOrderNumberDate = date2.toISOString().split('T')[0];
          if (storeOrderNumberDate > loginOrderNumberDate) {
            // eslint-disable-next-line no-param-reassign
            store.extra_info.reset_order_no_date =
              storeDetails_extra_info.reset_order_no_date;
            Object.assign(store, { extra_info: store.extra_info });
          }
        }
      }

      await db.Store.update(store, {
        where: {
          store_id: store.store_id,
        },
      });
      if (global.storeDetails && store) {
        if (
          store.resetBillAfterDays !== global.storeDetails.resetBillAfterDays ||
          store.reset_bill_time !== global.storeDetails.reset_bill_time
        ) {
          Object.assign(resetParams, { resetBilldate: true });
        }

        if (
          store.reset_kot_indays !== global.storeDetails.reset_kot_indays ||
          store.reset_kot_time !== global.storeDetails.reset_kot_time
        ) {
          Object.assign(resetParams, { resetKotdate: true });
        }
        const extra_info = safeParse(store.extra_info);
        const storeDetails_extra_info = safeParse(
          global.storeDetails.extra_info,
        );

        if (
          (extra_info &&
            extra_info.reset_order_no_in_days !==
              storeDetails_extra_info.reset_order_no_in_days) ||
          extra_info.reset_order_no_date !==
            storeDetails_extra_info.reset_order_no_date
        ) {
          Object.assign(resetParams, { resetOrderNumberdate: true });
        }
      }
    }
    setTimeout(() => {
      //   checkifresetisRequired2();
      startcronJob({ callBack: checkifresetisRequired2 });
    }, 2000);
    return 'success';
  } catch (error) {
    console.log(error);

    return 'failure';
  }
}

function getNextResetDate(
  nextDate,
  days,
  hours,
  minutes,
  currentDate,
  resetBillAfterDaysBeforeChanges,
) {
  if (resetBillAfterDaysBeforeChanges === 30) {
    const date = global.moment(Number(nextDate));
    const daysInMonth = date.daysInMonth();
    // eslint-disable-next-line no-param-reassign
    days = daysInMonth;
  }

  if (resetBillAfterDaysBeforeChanges === 365) {
    const nextYear = global.moment(Number(nextDate)).year();
    const isLeapYear =
      (nextYear % 4 === 0 && nextYear % 100 !== 0) || nextYear % 400 === 0;

    // eslint-disable-next-line no-param-reassign
    if (isLeapYear) days = 366;
  }

  const nextresetDate = global
    .moment(nextDate, 'x')
    .add(days, 'days')
    .set('hour', hours)
    .set('minute', minutes)
    .set('second', 0)
    .set('millisecond', 0)
    .format('x');

  if (nextresetDate > currentDate) {
    return nextresetDate;
  }

  return getNextResetDate(
    nextresetDate,
    days,
    hours,
    minutes,
    currentDate,
    resetBillAfterDaysBeforeChanges,
  );
}

async function updatenextresetDates({
  store,
  resetBilldate,
  resetKotdate,
  resetOrderNumberDate,
}) {
  // eslint-disable-next-line no-param-reassign
  if (store) store = global.storeDetails;
  const { store_id } = store;
  const resetData = {};
  const storeupdateDetails = {};
  const currentDate = global.moment().format('x');
  try {
    if (
      resetBilldate &&
      store.resetBillAfterDays &&
      store.reset_bill_time &&
      store.resetBillAfterDays !== 0 &&
      isNumber(store.resetBillAfterDays)
    ) {
      try {
        let { resetBillAfterDays } = store;
        const resetBillAfterDaysBeforeChanges = store.resetBillAfterDays;
        if (resetBillAfterDays === 365) {
          const billResetYearToCheck = global
            .moment(store.reset_bill_time, 'x')
            .add(resetBillAfterDays, 'days')
            .format('x');
          const nextYear = global.moment(Number(billResetYearToCheck)).year();
          const isLeapYear =
            (nextYear % 4 === 0 && nextYear % 100 !== 0) ||
            nextYear % 400 === 0;

          if (isLeapYear) resetBillAfterDays = 366;
        }

        if (resetBillAfterDays === 30) {
          // resetBillAfterDays = moment().daysInMonth();
          const date = global.moment(Number(store.reset_bill_time));
          const daysInMonth = date.daysInMonth();
          resetBillAfterDays = daysInMonth;
        }
        let nextbillresetDate = global
          .moment(store.reset_bill_time, 'x')
          .add(resetBillAfterDays, 'days')
          .format('x');
        const iscurrentbilldatePassed = global
          .moment()
          .isSameOrAfter(nextbillresetDate);
        if (!iscurrentbilldatePassed) {
          const billresetHours = global
            .moment(store.reset_bill_time, 'x')
            .hours();
          const billresetMinutes = global
            .moment(store.reset_bill_time, 'x')
            .minutes();

          // if (resetBillAfterDays == 1) {
          //   nextbillresetDate = moment(currentDate, 'x')
          //     .add(resetBillAfterDays, 'days')
          //     .set('hour', billresetHours)
          //     .set('minute', billresetMinutes)
          //     .set('second', 0)
          //     .set('millisecond', 0)
          //     .format('x');
          // } else {
          nextbillresetDate = global
            .moment(store.reset_bill_time, 'x')
            .add(resetBillAfterDays, 'days')
            .set('hour', billresetHours)
            .set('minute', billresetMinutes)
            .set('second', 0)
            .set('millisecond', 0)
            .format('x');

          if (nextbillresetDate < currentDate) {
            // let resetbilldays = resetBillAfterDays - 1;
            nextbillresetDate = getNextResetDate(
              nextbillresetDate,
              resetBillAfterDaysBeforeChanges,
              billresetHours,
              billresetMinutes,
              currentDate,
              resetBillAfterDaysBeforeChanges,
            );
          }
          // }
        }

        Object.assign(resetData, {
          nextbillresetDate,
          resetBillafterdays: resetBillAfterDays,
        });
        Object.assign(storeupdateDetails, {
          reset_bill_time: nextbillresetDate,
        });
        console.log('nextbillresetDate::', nextbillresetDate);
      } catch (error) {
        console.error(error);
      }
    }

    if (
      resetKotdate &&
      store.reset_kot_indays &&
      store.reset_kot_time &&
      store.reset_kot_indays !== 0 &&
      isNumber(store.reset_kot_indays)
    ) {
      try {
        let { reset_kot_indays } = store;
        console.log('reset kot in days::', reset_kot_indays);
        const reset_kot_indayssBeforeChanges = store.reset_kot_indays;

        if (reset_kot_indays === 365) {
          const kotResetYearToCheck = global
            .moment(store.reset_kot_time, 'x')
            .add(reset_kot_indays, 'days')
            .format('x');
          const nextYear = global.moment(Number(kotResetYearToCheck)).year();
          const isLeapYear =
            (nextYear % 4 === 0 && nextYear % 100 !== 0) ||
            nextYear % 400 === 0;

          if (isLeapYear) reset_kot_indays = 366;
        }

        if (reset_kot_indays === 30) {
          // resetBillAfterDays = moment().daysInMonth();
          const date = global.moment(Number(store.reset_kot_time));
          const daysInMonth = date.daysInMonth();
          reset_kot_indays = daysInMonth;
        }
        let nextkotresetDate = global
          .moment(store.reset_kot_time, 'x')
          .add(reset_kot_indays, 'days')
          .format('x');

        console.log('next kot reset date::', nextkotresetDate);
        const iscurrentkotdatePassed = global
          .moment()
          .isSameOrAfter(nextkotresetDate);
        console.log('is current kot date passed::', iscurrentkotdatePassed);
        if (!iscurrentkotdatePassed) {
          const kotresetHours = global
            .moment(store.reset_kot_time, 'x')
            .hours();
          const kotresetMinutes = global
            .moment(store.reset_kot_time, 'x')
            .minutes();

          // if (reset_kot_indays == 1) {
          //   nextkotresetDate = moment(currentDate, 'x')
          //     .add(reset_kot_indays, 'days')
          //     .set('hour', kotresetHours)
          //     .set('minute', kotresetMinutes)
          //     .set('second', 0)
          //     .set('millisecond', 0)
          //     .format('x');
          // } else {
          nextkotresetDate = global
            .moment(store.reset_kot_time, 'x')
            .add(reset_kot_indays, 'days')
            .set('hour', kotresetHours)
            .set('minute', kotresetMinutes)
            .set('second', 0)
            .set('millisecond', 0)
            .format('x');

          if (nextkotresetDate < currentDate) {
            nextkotresetDate = getNextResetDate(
              nextkotresetDate,
              reset_kot_indays,
              kotresetHours,
              kotresetMinutes,
              currentDate,
              reset_kot_indayssBeforeChanges,
            );
          }
          // }
        }
        console.log('next kot reset date::', nextkotresetDate);
        Object.assign(resetData, {
          nextkotresetDate,
          resetKotafterdays: reset_kot_indays,
        });
        Object.assign(storeupdateDetails, {
          reset_kot_time: nextkotresetDate,
        });
        console.log('nextkotresetDate::', nextkotresetDate);
      } catch (error) {
        console.error(error);
      }
    }

    const extra_info = safeParse(store.extra_info);

    if (
      resetOrderNumberDate &&
      extra_info.reset_order_no_in_days &&
      extra_info.reset_order_no_date &&
      extra_info.reset_order_no_in_days !== 0 &&
      isNumber(extra_info.reset_order_no_in_days)
    ) {
      try {
        let { reset_order_no_in_days } = extra_info;
        const resetOrderNumberDaysBeforeChanges =
          extra_info.reset_order_no_in_days;
        if (reset_order_no_in_days === 365) {
          const currentYear = new Date().getFullYear();
          const nextYear = currentYear + 1;
          const isLeapYear =
            (nextYear % 4 === 0 && nextYear % 100 !== 0) ||
            nextYear % 400 === 0;

          if (isLeapYear) reset_order_no_in_days = 366;
        }

        console.log('reset order number in days', reset_order_no_in_days);
        if (reset_order_no_in_days === 365) {
          const orderNumerResetDate = global
            .moment(extra_info.reset_order_no_date, 'YYYY-MM-DD hh:mm A')
            .add(reset_order_no_in_days, 'days')
            .format('YYYY-MM-DD hh:mm A');
          const date = global.moment.utc(orderNumerResetDate);
          const timestampInMillis = date.valueOf();
          const nextYear = global.moment(timestampInMillis).year();
          const isLeapYear =
            (nextYear % 4 === 0 && nextYear % 100 !== 0) ||
            nextYear % 400 === 0;

          if (isLeapYear) reset_order_no_in_days = 366;
        }

        let nextorderNumerResetDate = global
          .moment(extra_info.reset_order_no_date, 'YYYY-MM-DD hh:mm A')
          .add(reset_order_no_in_days, 'days')
          .format('YYYY-MM-DD hh:mm A');

        const formatted_date = global
          .moment(nextorderNumerResetDate, 'YYYY-MM-DD hh:mm:s A')
          .format('x');

        if (reset_order_no_in_days === 30) {
          // reset_order_no_in_days = moment().daysInMonth();
          const date = global.moment(Number(formatted_date));
          const daysInMonth = date.daysInMonth();
          reset_order_no_in_days = daysInMonth;
        }

        // let formatted_date = moment(
        //   nextorderNumerResetDate,
        //   'YYYY-MM-DD hh:mm:s A',
        // ).format('x');

        // eslint-disable-next-line no-unused-vars
        const nextOrderNumberDate = global.moment(Number(formatted_date));
        const isorderNumberdatePassed = global
          .moment()
          .isSameOrAfter(formatted_date);
        // console.log()
        const ordernumberresetHours = global
          .moment(formatted_date, 'x')
          .hours();
        const ordernumberresetMinutes = global
          .moment(formatted_date, 'x')
          .minutes();
        if (!isorderNumberdatePassed) {
          nextorderNumerResetDate = global
            .moment(currentDate, 'x')
            .add(reset_order_no_in_days, 'days')
            .set('hour', ordernumberresetHours)
            .set('minute', ordernumberresetMinutes)
            .set('second', 0)
            .set('millisecond', 0)
            .format('YYYY-MM-DD hh:mm A');

          let nextorderNumerResetDateFormatted = global
            .moment(formatted_date, 'x')
            .add(reset_order_no_in_days, 'days')
            .set('hour', ordernumberresetHours)
            .set('minute', ordernumberresetMinutes)
            .set('second', 0)
            .set('millisecond', 0)
            .format('x');

          if (nextorderNumerResetDateFormatted < currentDate) {
            nextorderNumerResetDateFormatted = getNextResetDate(
              nextorderNumerResetDateFormatted,
              reset_order_no_in_days,
              ordernumberresetHours,
              ordernumberresetMinutes,
              currentDate,
              resetOrderNumberDaysBeforeChanges,
            );

            nextorderNumerResetDate = global
              .moment(Number(nextorderNumerResetDateFormatted))
              .format('YYYY-MM-DD hh:mm:s A');
          }
        }
        Object.assign(resetData, {
          nextorderNumerResetDate,
        });
        delete extra_info.reset_order_no_date;
        Object.assign(extra_info, {
          reset_order_no_date: nextorderNumerResetDate,
        });
        Object.assign(storeupdateDetails, { extra_info });
      } catch (error) {
        console.log("Message='Error while resetting date'", error);
      }
    }

    const storeupdateresult = await db.Store.update(storeupdateDetails, {
      where: {
        store_id: store.store_id,
      },
    });

    if (storeupdateresult) {
      console.log('reset date updated');
    }
    global.getStoredetailsforremote();
    if (resetData && !isEmpty(resetData)) {
      sendResetdatedetails(resetData, store_id, storeupdateDetails);
      setTimeout(() => {
        global.mainWindow.webContents.send(
          BILL_NUMBER_RESET_DATE_NOTIFICATION,
          resetData,
        );
      }, 5000);
    }

    setTimeout(() => {
      startcronJob({ callBack: checkifresetisRequired2 });
    }, 500);
  } catch (error) {
    console.error(`Message="Error While Updating Next Reset Dates"`, error);
  }
}

module.exports = {
  Up,
  addorupdateStore,
  db,
  checkifresetisRequired2,
};
