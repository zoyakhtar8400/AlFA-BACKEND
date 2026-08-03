/* eslint-disable no-new */
/* eslint-disable no-constructor-return */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */

const { sleep } = require('../../util/MiscUtil');

/* eslint-disable camelcase */
let savebillLockStartedAt = null;
const MAX_SAVEBILL_TIME = 10000; // 10 seconds

function ensureSaveBillLockIsHealthy() {
  if (
    window.savebillisinProgress &&
    savebillLockStartedAt &&
    Date.now() - savebillLockStartedAt > MAX_SAVEBILL_TIME
  ) {
    console.warn('⚠ savebill lock stuck. Auto-releasing...');
    window.savebillisinProgress = false;
    savebillLockStartedAt = null;
  }
}

class TaskQueue {
  constructor() {
    if (TaskQueue._instance) {
      return TaskQueue._instance;
    }

    this.queue = [];
    this.processing = false;
    this.activeKeys = new Set();

    TaskQueue._instance = this;
  }

  static getInstance() {
    if (!TaskQueue._instance) {
      new TaskQueue();
    }
    return TaskQueue._instance;
  }

  async addTask({ table_id, response, handlerFn, job_id, context }) {
    console.log(
      `[${context}] Message="Save and print bill task added in queue" JobId="${job_id}"`,
    );
    if (this.activeKeys.has(job_id)) {
      console.log(
        `[${context}] Message="Ignored duplicate request" JobId="${job_id}"`,
      );
      return;
    }

    this.activeKeys.add(job_id);
    this.queue.push({ job_id, table_id, response, handlerFn });
    this.run();
  }

  async run() {
    console.log(
      `Message="Run function called" this.processing="${this.processing}"  window.savebillisinProgress="${window.savebillisinProgress}"`,
    );
    ensureSaveBillLockIsHealthy();

    if (this.processing || window.savebillisinProgress) return;
    this.processing = true;
    window.savebillisinProgress = true;

    while (this.queue.length > 0) {
      const { job_id, table_id, response, handlerFn } = this.queue.shift();

      try {
        savebillLockStartedAt = Date.now();
        console.log(
          `Message="Processing save and print job" JobId="${job_id}" TableId="${table_id}"`,
        );
        Object.assign(response, {
          job_id,
        });
        await handlerFn(response);
        await sleep(100);
      } catch (err) {
        console.error(
          `[TaskQueue] Error processing job_id="${job_id}" table_id="${table_id}"`,
          err,
        );
      } finally {
        savebillLockStartedAt = null;
        this.processing = false;
        window.savebillisinProgress = false;
        this.activeKeys.delete(job_id);
      }
    }

    this.processing = false;
  }
}

TaskQueue._instance = null;

module.exports = {
  OrderHubSaveBillTaskQueue: TaskQueue.getInstance(),
};
