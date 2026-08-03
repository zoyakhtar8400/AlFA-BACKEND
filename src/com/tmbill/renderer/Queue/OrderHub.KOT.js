/* eslint-disable no-new */
/* eslint-disable no-constructor-return */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */

/* eslint-disable camelcase */
let printKotLockStartedAt = null;
const MAX_PRINTKOT_TIME = 10000; // 10 seconds

function ensurePrintKotLockIsHealthy() {
  if (
    window.isKOTPrintInprogessforcsk &&
    printKotLockStartedAt &&
    Date.now() - printKotLockStartedAt > MAX_PRINTKOT_TIME
  ) {
    console.warn('⚠ savebill lock stuck. Auto-releasing...');
    window.isKOTPrintInprogessforcsk = false;
    printKotLockStartedAt = null;
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
    if (this.processing || window.isKOTPrintInprogessforcsk) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const { job_id, table_id, response, handlerFn } = this.queue.shift();

      try {
        ensurePrintKotLockIsHealthy();
        printKotLockStartedAt = Date.now();

        await handlerFn(response);
      } catch (err) {
        console.error(
          `[TaskQueue] Error processing job_id="${job_id}" table_id="${table_id}"`,
          err,
        );
      } finally {
        printKotLockStartedAt = null;
        this.activeKeys.delete(job_id);
      }
    }

    this.processing = false;
  }
}

TaskQueue._instance = null;

module.exports = {
  OrderHubKOTTaskQueue: TaskQueue.getInstance(),
};
