/* eslint-disable camelcase */
/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
/**
 * itemStockOutboxService.js
 *
 * Transactional outbox service for item stock events.
 * Handles: append → sync → purge lifecycle with a background job.
 */
const { HttpStatusCode } = require('axios');
const { ItemStockOutbox, Sequelize } = require('../../js/database'); // adjust path as needed
const { apiCall } = require('../../services/APIService');
const { getHeadersformpos } = require('../../services/MiscServices');

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SYNCED: 'SYNCED',
  FAILED: 'FAILED',
});

const CHANGE_TYPE = Object.freeze({
  IN: 'IN',
  OUT: 'OUT',
  ADJUSTMENT: 'ADJUSTMENT',
  SALE: 'SALE',
  RETURN: 'RETURN',
});

const MAX_RETRY_COUNT = 5;
const BATCH_SIZE = 50;
const JOB_INTERVAL_MS = 15_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now() {
  return new Date().toISOString();
}

// ─── Backend API ──────────────────────────────────────────────────────────────

/**
 * Sends a batch of outbox records to the backend.
 *
 * Expected backend response shape:
 * {
 *   acked:  [{ localId: number, backendAckId: string }],
 *   failed: [number]   ← localIds the backend could not process
 * }
 *
 * @param {object[]} records
 * @returns {Promise<{ acked: { localId: number, backendAckId: string }[], failed: number[] }>}
 */
async function _sendToBackend(records) {
  let acked = [];
  let failed = [];
  try {
    const items = records.map((i) => ({
      id: i.id,
      store_id: i.store_id,
      current_stock: i.current_stock,
      item_id: i.item_id,
    }));

    const payload = {
      items,
      tmpos_id: global.storeDetails?.tmpos_id,
      store_id: global.storeDetails?.store_id,
      menu_id: Number(global.menu_id) || undefined,
    };
    const { data } = await apiCall.post(
      global.Config.links.ITEM_STOCK_OUTBOX_INGEST,
      payload,
      {
        headers: getHeadersformpos(),
        timeout: 25000,
      },
    );
    if (data?.status === HttpStatusCode.Ok) {
      if (data.acked) acked = data.acked;
      if (data.failed) failed = data.failed;
    }
  } catch (err) {
    const ids = records.map((r) => r.id);
    console.log('failed ids:', ids);
    for (const localId of ids) {
      const record = await ItemStockOutbox.findByPk(localId);
      if (!record) continue;

      const newRetryCount = (record.retry_count ?? 0) + 1;
      await record.update({
        sync_status: STATUS.PENDING,
        retry_count: newRetryCount,
        last_attempt_at: now(),
        updated_at: now(),
      });

      if (newRetryCount >= MAX_RETRY_COUNT) {
        console.warn(
          `[outbox] record id=${localId} exhausted all ${MAX_RETRY_COUNT} retries.`,
        );
      }
    }
    console.error('[outbox] _sendToBackend error:', err.message);
  }
  return { acked, failed };
}

// ─── Core Operations ──────────────────────────────────────────────────────────

/**
 * Appends a stock change event to the outbox.
 *
 * Pass the caller's `transaction` if you are writing stock changes
 * and the outbox event in the same atomic operation (recommended).
 *
 * @param {object} payload
 * @param {string}  payload.itemId
 * @param {string}  payload.storeId
 * @param {string}  [payload.variantId]
 * @param {string}  payload.changeType      - one of CHANGE_TYPE values
 * @param {number}  payload.quantity
 * @param {number}  [payload.previousStock]
 * @param {number}  [payload.newStock]
 * @param {string}  [payload.referenceId]
 * @param {string}  [payload.machineId]
 * @param {object}  [options]
 * @param {import('sequelize').Transaction} [options.transaction]
 * @returns {Promise<object>} created record as plain object
 */
async function addRecord(payload, options = {}) {
  const {
    item_id,
    store_id,
    variantId = null,
    changeType,
    quantity,
    previousStock = null,
    newStock = null,
    referenceId = null,
    machineId = null,
    current_stock,
  } = payload;

  if (!item_id || !store_id || !changeType || quantity == null) {
    throw new Error(
      '[outbox] addRecord: itemId, storeId, changeType and quantity are required.',
    );
  }
  if (!CHANGE_TYPE[changeType]) {
    throw new Error(`[outbox] addRecord: invalid changeType "${changeType}".`);
  }

  // If a PENDING record already exists for this item/store/variant/changeType,
  // overwrite it in place — only the latest quantity snapshot needs to reach
  // the backend, so stacking duplicate rows is wasteful and misleading.
  const existing = await ItemStockOutbox.findOne({
    where: {
      item_id,
      store_id,
      variant_id: variantId ?? null,
      change_type: changeType,
      sync_status: STATUS.PENDING,
    },
    transaction: options.transaction,
  });

  if (existing) {
    await existing.update(
      {
        quantity,
        current_stock,
        previous_stock: previousStock,
        new_stock: newStock,
        reference_id: referenceId ?? existing.reference_id,
        machine_id: machineId ?? existing.machine_id,
        retry_count: 0, // reset — this is effectively a fresh event
        updated_at: now(),
      },
      { transaction: options.transaction },
    );

    return existing.get({ plain: true });
  }

  const record = await ItemStockOutbox.create(
    {
      item_id,
      store_id,
      variant_id: variantId,
      change_type: changeType,
      quantity,
      current_stock,
      previous_stock: previousStock,
      new_stock: newStock,
      reference_id: referenceId,
      sync_status: STATUS.PENDING,
      retry_count: 0,
      machine_id: machineId,
      created_at: now(),
      updated_at: now(),
    },
    { transaction: options.transaction },
  );

  return record.get({ plain: true });
} /**

/**
 * Partially updates an existing outbox record.
 * Automatically stamps updated_at.
 *
 * @param {number} id
 * @param {object} fields
 * @param {object} [options]
 * @param {import('sequelize').Transaction} [options.transaction]
 * @returns {Promise<object>} updated plain record
 */
async function updateRecord(id, fields, options = {}) {
  const record = await ItemStockOutbox.findByPk(id, {
    transaction: options.transaction,
  });
  if (!record)
    throw new Error(`[outbox] updateRecord: record id=${id} not found.`);

  await record.update(
    { ...fields, updated_at: now() },
    { transaction: options.transaction },
  );

  return record.get({ plain: true });
}

/**
 * Fetches a batch of PENDING / eligible FAILED records, claims them as
 * PROCESSING, calls the backend, then marks each SYNCED or FAILED.
 *
 * @returns {Promise<{ synced: number, failed: number, skipped: number }>}
 */
async function syncPendingToBackend() {
  const candidates = await ItemStockOutbox.findAll({
    where: {
      sync_status: { [Sequelize.Op.in]: [STATUS.PENDING, STATUS.FAILED] },
      retry_count: { [Sequelize.Op.lt]: MAX_RETRY_COUNT },
      store_id: global.storeDetails?.store_id,
    },
    order: [['created_at', 'ASC']],
    limit: BATCH_SIZE,
  });

  if (!candidates.length) return { synced: 0, failed: 0, skipped: 0 };

  const ids = candidates.map((r) => r.id);

  // Claim atomically — prevents double-dispatch on overlapping ticks
  await ItemStockOutbox.update(
    { sync_status: STATUS.PROCESSING, updated_at: now() },
    { where: { id: { [Sequelize.Op.in]: ids } } },
  );

  let acked = [];
  let failed = [];

  try {
    ({ acked, failed } = await _sendToBackend(
      candidates.map((r) => r.get({ plain: true })),
    ));
  } catch (err) {
    console.error('[outbox] _sendToBackend error:', err.message);
    failed = ids; // treat entire batch as failed
  }

  let synced = 0;

  for (const localId of acked) {
    await ItemStockOutbox.update(
      {
        sync_status: STATUS.SYNCED,
        // backend_ack_id: backendAckId ?? null,
        last_attempt_at: now(),
        updated_at: now(),
      },
      { where: { id: localId } },
    );
    synced++;
  }

  console.log('failed', failed);
  for (const localId of failed) {
    const record = await ItemStockOutbox.findByPk(localId);
    if (!record) continue;

    const newRetryCount = (record.retry_count ?? 0) + 1;
    await record.update({
      sync_status: STATUS.FAILED,
      retry_count: newRetryCount,
      last_attempt_at: now(),
      updated_at: now(),
    });

    if (newRetryCount >= MAX_RETRY_COUNT) {
      console.warn(
        `[outbox] record id=${localId} exhausted all ${MAX_RETRY_COUNT} retries.`,
      );
    }
  }

  // Revert any records unaccounted for in the backend response
  const accountedIds = new Set([...acked.map((a) => a.localId), ...failed]);
  const orphans = ids.filter((id) => !accountedIds.has(id));

  // if (orphans.length) {
  //   await ItemStockOutbox.update(
  //     { sync_status: STATUS.PENDING, updated_at: now() },
  //     { where: { id: { [Sequelize.Op.in]: orphans } } },
  //   );
  //   console.warn(
  //     `[outbox] ${orphans.length} orphaned record(s) reverted to PENDING.`,
  //   );
  // }

  return { synced, failed: failed.length, skipped: orphans.length };
}

/**
 * Hard-deletes all SYNCED records from the outbox.
 *
 * @returns {Promise<number>} rows deleted
 */
async function purgeSynced() {
  const deletedSynced = await ItemStockOutbox.destroy({
    where: { sync_status: STATUS.SYNCED },
  });

  const deletedExhausted = await ItemStockOutbox.destroy({
    where: {
      sync_status: STATUS.FAILED,
      retry_count: { [Sequelize.Op.gte]: MAX_RETRY_COUNT },
    },
  });

  if (deletedSynced > 0) {
    console.info(`[outbox] purged ${deletedSynced} SYNCED record(s).`);
  }
  if (deletedExhausted > 0) {
    console.warn(
      `[outbox] purged ${deletedExhausted} exhausted FAILED record(s).`,
    );
  }

  return { deletedSynced, deletedExhausted };
}

/**
 * Returns a count per sync_status — useful for UI badges or health checks.
 *
 * @returns {Promise<{ PENDING: number, PROCESSING: number, SYNCED: number, FAILED: number }>}
 */
async function getStatusCounts() {
  const rows = await ItemStockOutbox.findAll({
    attributes: [
      'sync_status',
      [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
    ],
    group: ['sync_status'],
    raw: true,
    where: {
      store_id: global.storeDetails?.store_id,
    },
  });

  const counts = { PENDING: 0, PROCESSING: 0, SYNCED: 0, FAILED: 0 };
  for (const row of rows) {
    counts[row.sync_status] = Number(row.count);
  }
  return counts;
}

// ─── Background Job ───────────────────────────────────────────────────────────

let _jobTimer = null;
let _jobRunning = false;

async function _runJobTick() {
  if (_jobRunning) return;
  _jobRunning = true;

  try {
    const { synced, failed, skipped } = await syncPendingToBackend();

    if (synced || failed || skipped) {
      console.info(
        `[outbox] tick → synced=${synced} failed=${failed} skipped=${skipped}`,
      );
    }
    if (synced > 0) {
      await purgeSynced();
    }
  } catch (err) {
    console.error('[outbox] job tick error:', err);
  } finally {
    _jobRunning = false;
  }
}

/**
 * Starts the background sync/purge job.
 * Safe to call multiple times — only one timer runs at a time.
 *
 * @param {number} [intervalMs]
 */
function startJob(intervalMs = JOB_INTERVAL_MS) {
  if (_jobTimer) return;
  console.info(`[outbox] job started — interval=${intervalMs}ms`);
  _runJobTick(); // fire immediately, then on interval
  _jobTimer = setInterval(_runJobTick, intervalMs);
}

/**
 * Stops the background job. Call on app quit.
 */
function stopJob() {
  if (!_jobTimer) return;
  clearInterval(_jobTimer);
  _jobTimer = null;
  console.info('[outbox] job stopped.');
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  STATUS,
  CHANGE_TYPE,
  addRecordItemStockOutBox: addRecord,
  updateRecord,
  syncPendingToBackend,
  purgeSynced,
  getStatusCounts,
  startItemOutBoxJob: startJob,
  stopItemOutBoxJob: stopJob,
};
