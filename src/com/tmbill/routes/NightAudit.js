const express = require('express');
const { ResponseMessage } = require('../error/ResponseMessage');
const { resolveBusinessDate } = require('../util/businessDateUtil');

const router = express.Router();

/**
 * GET /api/night-audit/status
 * Fetches current operating session and business date
 */
router.get('/status', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const targetStoreId = req.query?.store_id || req.user?.store_id || 'STORE_1';

    // 1. Get current active session from mpos_startday_endday
    const activeSession = await global.serverdbConnection.StartcloseDay.findOne({
      where: {
        store_id: targetStoreId,
        day_close_date: null
      },
      order: [['id', 'DESC']],
      raw: true
    });

    // 2. Get store settings for 2:00 AM closing boundary
    const storeObj = await global.serverdbConnection.Store.findOne({
      where: { store_id: targetStoreId },
      raw: true
    });

    const bizRes = resolveBusinessDate(activeSession, storeObj || {});

    // 3. Get last completed audit
    const lastAudit = await global.serverdbConnection.StartcloseDay.findOne({
      where: {
        store_id: targetStoreId,
        day_close_date: { [global.serverdbConnection.Sequelize.Op.ne]: null }
      },
      order: [['id', 'DESC']],
      raw: true
    });

    response.data = {
      businessDate: bizRes.businessDate,
      closingHour: bizRes.closingHour,
      closingMinute: bizRes.closingMinute,
      sessionStatus: activeSession ? 'OPEN' : 'STANDBY',
      activeSession: activeSession || null,
      lastAudit: lastAudit ? {
        id: lastAudit.id,
        businessDate: lastAudit.business_date,
        closedAt: lastAudit.closed_at,
        closedByUser: lastAudit.day_close_by_user,
        totalSales: Number(lastAudit.total_sales || 0),
        currentClosingBalance: Number(lastAudit.current_closing_balance || 0),
        auditStatus: lastAudit.audit_status || 'Completed'
      } : null
    };
    return res.status(200).json(response);
  } catch (err) {
    console.error('Error in GET /api/night-audit/status:', err);
    response.setStatus(500);
    response.setMessage(err.message);
    return res.status(500).json(response);
  }
});

/**
 * GET /api/night-audit/reconcile
 * Calculates full sales, payments, taxes, discounts, refunds, and reconciliation metrics
 * for the requested business date
 */
router.get('/reconcile', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const targetStoreId = req.query?.store_id || req.user?.store_id || 'STORE_1';
    let targetBizDate = req.query?.business_date || req.query?.date;

    // If no date specified, resolve active business date
    if (!targetBizDate) {
      const activeSession = await global.serverdbConnection.StartcloseDay.findOne({
        where: {
          store_id: targetStoreId,
          day_close_date: null
        },
        order: [['id', 'DESC']],
        raw: true
      });
      const storeObj = await global.serverdbConnection.Store.findOne({ where: { store_id: targetStoreId }, raw: true });
      targetBizDate = resolveBusinessDate(activeSession, storeObj || {}).businessDate;
    }

    // 1. Fetch all bills for this business date
    const bills = await global.serverdbConnection.Bill.findAll({
      where: {
        store_id: targetStoreId,
        [global.serverdbConnection.Sequelize.Op.or]: [
          { business_date: targetBizDate },
          { my_order_date: targetBizDate }
        ]
      },
      order: [['id', 'ASC']],
      raw: true
    });

    // 2. Fetch all recorded payments for these bills
    const orderIdentifiers = bills.map(b => String(b.order_id || b.id)).filter(Boolean);
    const billNumericIds = bills.map(b => String(b.id));
    const allSearchIds = Array.from(new Set([...orderIdentifiers, ...billNumericIds]));

    let recordedPayments = [];
    if (allSearchIds.length > 0) {
      recordedPayments = await global.serverdbConnection.BillPayment.findAll({
        where: {
          order_id: { [global.serverdbConnection.Sequelize.Op.in]: allSearchIds }
        },
        raw: true
      });
    }

    // Map payments to bills to avoid counting multiple times
    const paymentsByOrder = {};
    recordedPayments.forEach(p => {
      const oid = String(p.order_id);
      if (!paymentsByOrder[oid]) paymentsByOrder[oid] = [];
      paymentsByOrder[oid].push(p);
    });

    let grossSales = 0;
    let discounts = 0;
    let taxTotals = 0;
    let netSales = 0;
    let refunds = 0;
    let totalCollected = 0;
    let unpaidBillsTotal = 0;
    let complimentaryTotal = 0;

    const paymentModeBreakdown = {
      cash: 0,
      card: 0,
      upi: 0,
      other: 0,
      complimentary: 0
    };

    const discrepancies = [];
    const unpaidBills = [];
    const transactionDetails = [];

    bills.forEach(bill => {
      const state = String(bill.order_state || '').toLowerCase();
      const subtotal = Number(bill.order_subtotal || bill.subtotal || 0);
      const discount = Number(bill.discount || bill.discount_amount || 0);
      const tax = Number(bill.order_level_total_taxes || bill.total_tax || 0);
      const grandTotal = Number(bill.order_total || bill.total_amount || 0) || Math.round(subtotal + tax - discount);

      // Check if cancelled or refunded
      const isCancelled = state === 'cancelled' || state === 'void' || state === 'deleted';
      if (isCancelled) {
        refunds += grandTotal;
        transactionDetails.push({
          id: bill.id,
          orderId: bill.order_id,
          billNo: bill.custom_bill_number || `Bill ${bill.id}`,
          table: bill.table_name,
          amount: grandTotal,
          state: 'Cancelled',
          paymentMode: bill.payment,
          paidAmount: 0,
          status: 'REFUNDED_OR_CANCELLED'
        });
        return;
      }

      // Check if complimentary / NC
      const isComp = state === 'nc' || state === 'complimentary' || String(bill.payment || '').toLowerCase() === 'complimentary';
      if (isComp) {
        complimentaryTotal += grandTotal;
        grossSales += (subtotal || grandTotal);
        discounts += discount;
        taxTotals += tax;
        transactionDetails.push({
          id: bill.id,
          orderId: bill.order_id,
          billNo: bill.custom_bill_number || `Bill ${bill.id}`,
          table: bill.table_name,
          amount: grandTotal,
          state: 'Complimentary',
          paymentMode: 'Complimentary',
          paidAmount: 0,
          status: 'COMPLIMENTARY'
        });
        return;
      }

      grossSales += (subtotal || (grandTotal - tax + discount));
      discounts += discount;
      taxTotals += tax;
      netSales += grandTotal;

      // Find payments recorded in BillPayment table
      const bPayments = paymentsByOrder[String(bill.order_id)] || paymentsByOrder[String(bill.id)] || [];
      let billPaidSum = bPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

      // If bill is marked completed/paid but no explicit BillPayment row exists (e.g. direct POS payment)
      if (billPaidSum === 0 && (state === 'completed' || state === 'paid' || String(bill.payment_status).toLowerCase() === 'paid')) {
        billPaidSum = grandTotal;
        // Group by bill.payment mode
        const pMode = String(bill.payment || 'Cash').toLowerCase();
        if (pMode.includes('upi') || pMode.includes('qr') || pMode.includes('gpay')) paymentModeBreakdown.upi += grandTotal;
        else if (pMode.includes('card') || pMode.includes('pos')) paymentModeBreakdown.card += grandTotal;
        else paymentModeBreakdown.cash += grandTotal;
      } else {
        // Tally from individual payment rows
        bPayments.forEach(p => {
          const opt = String(p.payment_option || 'Cash').toLowerCase();
          const pAmt = Number(p.amount || 0);
          if (opt.includes('upi') || opt.includes('qr') || opt.includes('gpay')) paymentModeBreakdown.upi += pAmt;
          else if (opt.includes('card') || opt.includes('pos')) paymentModeBreakdown.card += pAmt;
          else paymentModeBreakdown.cash += pAmt;
        });
      }

      totalCollected += billPaidSum;

      const isPaid = state === 'completed' || state === 'paid' || billPaidSum >= grandTotal;
      if (!isPaid) {
        unpaidBillsTotal += (grandTotal - billPaidSum);
        unpaidBills.push({
          id: bill.id,
          orderId: bill.order_id,
          billNo: bill.custom_bill_number || `Bill ${bill.id}`,
          table: bill.table_name || `Table ${bill.table_id}`,
          grandTotal,
          paidAmount: billPaidSum,
          outstanding: grandTotal - billPaidSum,
          orderState: bill.order_state,
          waiter: bill.waiter || 'Staff',
          customer: bill.cust_name || 'Walk-in'
        });
      }

      // Check for discrepancies between bill total and collected amount
      if (isPaid && Math.abs(grandTotal - billPaidSum) > 0.5) {
        discrepancies.push({
          billId: bill.id,
          billNo: bill.custom_bill_number || `Bill ${bill.id}`,
          type: 'PAYMENT_AMOUNT_MISMATCH',
          expected: grandTotal,
          collected: billPaidSum,
          difference: Math.round((grandTotal - billPaidSum) * 100) / 100,
          reason: 'Recorded payments differ from bill grand total'
        });
      }

      transactionDetails.push({
        id: bill.id,
        orderId: bill.order_id,
        billNo: bill.custom_bill_number || `Bill ${bill.id}`,
        table: bill.table_name || `Table ${bill.table_id}`,
        subtotal,
        discount,
        tax,
        grandTotal,
        paidAmount: billPaidSum,
        state: isPaid ? 'Paid' : 'Unpaid',
        paymentMode: bill.payment || 'Cash'
      });
    });

    // 3. Operational checks: Active Tables & Pending KOTs
    const activeTables = await global.serverdbConnection.Table.findAll({
      where: {
        store_id: targetStoreId,
        order_state: {
          [global.serverdbConnection.Sequelize.Op.notIn]: ['Blank', 'AVAILABLE', 'BLANK']
        }
      },
      raw: true
    });

    const pendingKots = await global.serverdbConnection.KOT.findAll({
      where: {
        store_id: targetStoreId,
        is_active: 1
      },
      raw: true
    });

    // Determine readiness
    const blockers = [];
    if (activeTables.length > 0) {
      blockers.push({
        type: 'ACTIVE_TABLES',
        count: activeTables.length,
        message: `${activeTables.length} dining table(s) are currently active or uncleaned.`,
        items: activeTables.map(t => ({ id: t.id, name: t.table_name, status: t.order_state }))
      });
    }

    if (pendingKots.length > 0) {
      blockers.push({
        type: 'PENDING_KOTS',
        count: pendingKots.length,
        message: `${pendingKots.length} kitchen order ticket(s) are still active in the kitchen.`,
        items: pendingKots.map(k => ({ id: k.kot_id, tableId: k.table_id, tableName: k.table_name }))
      });
    }

    if (unpaidBills.length > 0) {
      blockers.push({
        type: 'UNPAID_BILLS',
        count: unpaidBills.length,
        totalOutstanding: unpaidBillsTotal,
        message: `${unpaidBills.length} bill(s) have unpaid or outstanding balances totalling ₹${Math.round(unpaidBillsTotal)}.`,
        items: unpaidBills
      });
    }

    const auditStatus = blockers.length > 0 ? 'ACTION_REQUIRED' : 'READY_TO_CLOSE';

    response.data = {
      businessDate: targetBizDate,
      storeId: targetStoreId,
      auditStatus,
      financialSummary: {
        totalBillsCount: bills.length,
        grossSales: Math.round(grossSales * 100) / 100,
        discounts: Math.round(discounts * 100) / 100,
        taxTotals: Math.round(taxTotals * 100) / 100,
        netSales: Math.round(netSales * 100) / 100,
        refunds: Math.round(refunds * 100) / 100,
        complimentaryTotal: Math.round(complimentaryTotal * 100) / 100,
        totalCollected: Math.round(totalCollected * 100) / 100,
        unpaidBillsTotal: Math.round(unpaidBillsTotal * 100) / 100,
        cashVariance: Math.round((netSales - totalCollected) * 100) / 100,
        paymentModeBreakdown: {
          cash: Math.round(paymentModeBreakdown.cash * 100) / 100,
          card: Math.round(paymentModeBreakdown.card * 100) / 100,
          upi: Math.round(paymentModeBreakdown.upi * 100) / 100,
          other: Math.round(paymentModeBreakdown.other * 100) / 100,
          complimentary: Math.round(complimentaryTotal * 100) / 100
        }
      },
      blockers,
      discrepancies,
      unpaidBills,
      transactionDetails
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error('Error in GET /api/night-audit/reconcile:', err);
    response.setStatus(500);
    response.setMessage(err.message);
    return res.status(500).json(response);
  }
});

/**
 * POST /api/night-audit/close-day
 * Executes durable backend close operation:
 * - Atomic database transaction
 * - Validates permissions
 * - Prevents duplicate closure
 * - Records durable audit report
 * - Advances business session
 */
router.post('/close-day', async (req, res) => {
  const response = new ResponseMessage(200, '');
  let t = null;
  try {
    const targetStoreId = req.body?.store_id || req.user?.store_id || 'STORE_1';
    const closingUser = req.user?.username || req.body?.username || 'Admin';
    const allowOverride = req.body?.allow_override === true || req.body?.allow_override === 'true' || Boolean(req.body?.allow_override);
    const overrideReason = req.body?.override_reason || '';
    const actualCashCounted = req.body?.actual_cash_counted !== undefined ? Number(req.body.actual_cash_counted) : null;

    console.log('[NightAudit close-day] Received request:', { targetStoreId, closingUser, allowOverride, overrideReason, body: req.body });

    // 1. Permission check: Only authorized roles can close Night Audit
    const userRole = String(req.user?.type || req.user?.role || '').toUpperCase();
    const isAuthorized = req.user?.id === 1 || req.user?.username === 'admin' || userRole === 'ADMIN' || userRole === 'SUPERADMIN' || userRole === 'MANAGER';
    if (!isAuthorized && req.user) {
      response.setStatus(403);
      response.setMessage('Forbidden: Only Administrators or Managers can perform Night Audit close.');
      return res.status(403).json(response);
    }

    // 2. Fetch current active session or resolve business date (Read-only)
    const activeSession = await global.serverdbConnection.StartcloseDay.findOne({
      where: {
        store_id: targetStoreId,
        day_close_date: null
      },
      order: [['id', 'DESC']],
      raw: true
    });

    const storeObj = await global.serverdbConnection.Store.findOne({ where: { store_id: targetStoreId }, raw: true });
    const bizRes = resolveBusinessDate(activeSession, storeObj || {});
    const targetBizDate = req.body?.business_date || bizRes.businessDate;

    // 3. Prevent duplicate closure: check if today's business date is already closed
    const alreadyClosed = await global.serverdbConnection.StartcloseDay.findOne({
      where: {
        store_id: targetStoreId,
        business_date: targetBizDate,
        day_close_date: { [global.serverdbConnection.Sequelize.Op.ne]: null }
      },
      raw: true
    });

    if (alreadyClosed && !allowOverride) {
      response.setStatus(400);
      response.setMessage(`Night Audit for business date ${targetBizDate} has already been completed and closed.`);
      return res.status(400).json(response);
    }

    // 4. Revalidate all transactions and operational blockers on server
    const openTables = await global.serverdbConnection.Table.findAll({
      where: {
        store_id: targetStoreId,
        order_state: { [global.serverdbConnection.Sequelize.Op.notIn]: ['Blank', 'AVAILABLE', 'BLANK'] }
      },
      raw: true
    });

    const openKots = await global.serverdbConnection.KOT.findAll({
      where: {
        store_id: targetStoreId,
        is_active: 1,
        status: { [global.serverdbConnection.Sequelize.Op.notIn]: [5, 6] }
      },
      raw: true
    });

    const unpaidBills = await global.serverdbConnection.Bill.findAll({
      where: {
        store_id: targetStoreId,
        business_date: targetBizDate,
        order_state: { [global.serverdbConnection.Sequelize.Op.in]: ['unpaid', 'UNPAID_BILL', 'UNPAID', 'pending'] }
      },
      raw: true
    });

    const hasBlockers = openTables.length > 0 || openKots.length > 0 || unpaidBills.length > 0;
    if (hasBlockers && !allowOverride) {
      response.setStatus(400);
      response.setMessage(`Cannot close Night Audit: unresolved blockers found (${openTables.length} active tables, ${openKots.length} open KOTs, ${unpaidBills.length} unpaid bills). An authorized override with reason is required.`);
      return res.status(400).json(response);
    }

    // 5. Compute authoritative final totals
    const allBills = await global.serverdbConnection.Bill.findAll({
      where: {
        store_id: targetStoreId,
        business_date: targetBizDate
      },
      raw: true
    });

    let totalSales = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalCollected = 0;
    const tenderSummary = { cash: 0, card: 0, upi: 0, other: 0, complimentary: 0 };

    allBills.forEach(b => {
      const state = String(b.order_state || '').toLowerCase();
      if (state !== 'cancelled' && state !== 'void') {
        const amt = Number(b.order_total || b.total_amount || 0);
        totalSales += amt;
        totalDiscount += Number(b.discount || b.discount_amount || 0);
        totalTax += Number(b.order_level_total_taxes || b.total_tax || 0);
        if (state === 'completed' || state === 'paid') {
          totalCollected += amt;
          const mode = String(b.payment || 'Cash').toLowerCase();
          if (mode.includes('upi') || mode.includes('qr')) tenderSummary.upi += amt;
          else if (mode.includes('card')) tenderSummary.card += amt;
          else if (mode.includes('comp')) tenderSummary.complimentary += amt;
          else tenderSummary.cash += amt;
        }
      }
    });

    const expectedCash = tenderSummary.cash;
    const cashVariance = actualCashCounted !== null ? Math.round((actualCashCounted - expectedCash) * 100) / 100 : 0;

    // 6. Build persistent audit snapshot
    const now = new Date();
    const auditReportData = {
      businessDate: targetBizDate,
      storeId: targetStoreId,
      closedAt: now.toISOString(),
      closedByUser: closingUser,
      totalSales: Math.round(totalSales * 100) / 100,
      totalDiscount: Math.round(totalDiscount * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalCollected: Math.round(totalCollected * 100) / 100,
      expectedCash,
      actualCashCounted,
      cashVariance,
      tenderSummary,
      blockersSummary: {
        openTablesCount: openTables.length,
        openKotsCount: openKots.length,
        unpaidBillsCount: unpaidBills.length
      },
      overrideApplied: allowOverride,
      overrideReason: overrideReason || null
    };

    // 7. Save or update mpos_startday_endday inside atomic transaction
    t = await global.serverdbConnection.sequelize.transaction();
    const closeTimeString = now.toTimeString().slice(0, 8);
    let closedRecord;

    try {
      if (activeSession) {
        await global.serverdbConnection.StartcloseDay.update({
          business_date: targetBizDate,
          day_close_by_user: closingUser,
          day_close_date: closeTimeString,
          total_sales: totalSales,
          current_closing_balance: totalCollected,
          raw_cash_in_hand: actualCashCounted !== null ? actualCashCounted : expectedCash,
          cash_diff: Math.round(cashVariance),
          closed_at: now,
          audit_status: 'Completed',
          audit_report: typeof auditReportData === 'object' ? JSON.stringify(auditReportData) : auditReportData,
          close_day_comment: overrideReason || 'Night Audit Closed Successfully'
        }, {
          where: { id: activeSession.id },
          transaction: t
        });
        closedRecord = await global.serverdbConnection.StartcloseDay.findByPk(activeSession.id, { transaction: t, raw: true });
      } else {
        closedRecord = await global.serverdbConnection.StartcloseDay.create({
          tmpos_id: '0',
          unique_id: `NA_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          store_id: targetStoreId,
          business_date: targetBizDate,
          day_start_by_user: closingUser,
          day_close_by_user: closingUser,
          start_day_date: '00:00:00',
          day_close_date: closeTimeString,
          total_sales: totalSales,
          current_closing_balance: totalCollected,
          raw_cash_in_hand: actualCashCounted !== null ? actualCashCounted : expectedCash,
          cash_diff: Math.round(cashVariance),
          opened_at: now,
          closed_at: now,
          audit_status: 'Completed',
          audit_report: typeof auditReportData === 'object' ? JSON.stringify(auditReportData) : auditReportData,
          close_day_comment: overrideReason || 'Night Audit Closed Successfully'
        }, { transaction: t });
      }
    } catch (dbErr1) {
      console.error('[NightAudit] Step 7 (close record update/create) error:', dbErr1.message, dbErr1.parent?.detail, dbErr1.parent?.message);
      throw dbErr1;
    }

    // 8. Automatically open next business date session (+1 day)
    const currBizDateObj = new Date(targetBizDate + 'T00:00:00');
    const nextBizDateObj = new Date(currBizDateObj.getTime() + 24 * 60 * 60 * 1000);
    const nextBizDateStr = nextBizDateObj.toISOString().slice(0, 10);

    try {
      await global.serverdbConnection.StartcloseDay.create({
        tmpos_id: '0',
        unique_id: `NA_${Date.now() + 1}_${Math.floor(Math.random() * 1000)}`,
        store_id: targetStoreId,
        business_date: nextBizDateStr,
        day_start_by_user: closingUser,
        start_day_date: closeTimeString,
        opening_balance: actualCashCounted !== null ? actualCashCounted : expectedCash,
        prev_closing_balance: totalCollected,
        opened_at: now,
        audit_status: 'Not Started',
        start_day_comment: `Auto-initialized following audit closure of ${targetBizDate}`
      }, { transaction: t });
    } catch (dbErr2) {
      console.error('[NightAudit] Step 8 (open next day create) error:', dbErr2.message, dbErr2.parent?.detail, dbErr2.parent?.message);
      throw dbErr2;
    }

    await t.commit();

    response.setStatus(200);
    response.setMessage(`Night Audit completed for ${targetBizDate}. Business date advanced to ${nextBizDateStr}.`);
    response.data = {
      closedBusinessDate: targetBizDate,
      nextBusinessDate: nextBizDateStr,
      closedAt: now.toISOString(),
      closedByUser: closingUser,
      auditReport: auditReportData
    };

    return res.status(200).json(response);
  } catch (err) {
    if (t) {
      try { await t.rollback(); } catch (_) {}
    }
    console.error('Error in POST /api/night-audit/close-day:', err);
    if (err.parent || err.original) {
      console.error('Detailed PostgreSQL Error:', {
        message: err.parent?.message || err.original?.message,
        detail: err.parent?.detail || err.original?.detail,
        table: err.parent?.table || err.original?.table,
        column: err.parent?.column || err.original?.column,
        sql: err.sql
      });
    }
    response.setStatus(500);
    response.setMessage(err.parent?.message || err.original?.message || err.message || 'Failed to complete Night Audit');
    return res.status(500).json(response);
  }
});

/**
 * GET /api/night-audit/history
 * Returns durable history of completed night audits from database
 */
router.get('/history', async (req, res) => {
  const response = new ResponseMessage(200, '');
  try {
    const targetStoreId = req.query?.store_id || req.user?.store_id || 'STORE_1';
    const limit = Number(req.query?.limit) || 30;

    const records = await global.serverdbConnection.StartcloseDay.findAll({
      where: {
        store_id: targetStoreId,
        day_close_date: { [global.serverdbConnection.Sequelize.Op.ne]: null }
      },
      order: [['id', 'DESC']],
      limit,
      raw: true
    });

    const formattedHistory = records.map(r => ({
      id: r.id,
      auditDate: r.business_date,
      closedAt: r.closed_at ? new Date(r.closed_at).toLocaleString('en-GB') : (r.day_close_date || 'Closed'),
      auditor: r.day_close_by_user || 'Admin',
      outlet: targetStoreId,
      grossSales: Number(r.total_sales || 0),
      totalCollected: Number(r.current_closing_balance || 0),
      discrepancy: Number(r.cash_diff || 0),
      status: r.audit_status || 'Completed',
      report: typeof r.audit_report === 'string' ? JSON.parse(r.audit_report || '{}') : (r.audit_report || null)
    }));

    response.data = formattedHistory;
    return res.status(200).json(response);
  } catch (err) {
    console.error('Error in GET /api/night-audit/history:', err);
    response.setStatus(500);
    response.setMessage(err.message);
    return res.status(500).json(response);
  }
});

module.exports = router;
