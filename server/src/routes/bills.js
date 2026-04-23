import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

const router = Router();

// GET /api/bills — List closed bills
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { staffId, date } = req.query;
    const where = { venueId: req.staff.venueId };

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.closedAt = { gte: start, lt: end };
    }

    const bills = await prisma.bill.findMany({
      where,
      include: {
        payments: true,
        tableSession: { include: { table: true, staff: { select: { id: true, name: true } } } },
        tabSession: { include: { staff: { select: { id: true, name: true } } } },
      },
      orderBy: { closedAt: 'desc' },
    });

    // Filter by staffId if provided (from the session, not the bill)
    const filtered = staffId
      ? bills.filter(b =>
          (b.tableSession?.staffId === staffId) || (b.tabSession?.staffId === staffId)
        )
      : bills;

    res.json({ bills: filtered });
  } catch (err) {
    next(err);
  }
});

// POST /api/bills — Close a session into a bill
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      tableSessionId, tabSessionId,
      subtotal, discountAmount, discountLabel,
      taxAmount, total, tipTotal, amountPaid,
    } = req.body;

    const bill = await prisma.bill.create({
      data: {
        venueId: req.staff.venueId,
        tableSessionId: tableSessionId || null,
        tabSessionId: tabSessionId || null,
        subtotal,
        discountAmount: discountAmount || 0,
        discountLabel: discountLabel || null,
        taxAmount,
        total,
        tipTotal: tipTotal || 0,
        amountPaid,
      },
    });

    // Close the session
    if (tableSessionId) {
      await prisma.tableSession.update({
        where: { id: tableSessionId },
        data: { status: 'closed', closedAt: new Date() },
      });
    }
    if (tabSessionId) {
      await prisma.tabSession.update({
        where: { id: tabSessionId },
        data: { status: 'closed', closedAt: new Date() },
      });
    }

    // Link existing payments to the bill
    const paymentWhere = tableSessionId
      ? { tableSessionId }
      : { tabSessionId };
    await prisma.payment.updateMany({
      where: { ...paymentWhere, status: 'completed' },
      data: { billId: bill.id },
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('bill:closed', {
      billId: bill.id,
      tableSessionId,
      tabSessionId,
    });

    res.status(201).json({ bill });
  } catch (err) {
    next(err);
  }
});

// POST /api/bills/:id/reopen — Reopen a closed bill
router.post('/:id/reopen', authenticate, async (req, res, next) => {
  try {
    const bill = await prisma.bill.findUnique({
      where: { id: req.params.id },
      include: { tableSession: true, tabSession: true },
    });
    if (!bill) throw new AppError('Bill not found', 404);

    // Reopen the session
    if (bill.tableSessionId) {
      await prisma.tableSession.update({
        where: { id: bill.tableSessionId },
        data: { status: 'open', closedAt: null },
      });
    }
    if (bill.tabSessionId) {
      await prisma.tabSession.update({
        where: { id: bill.tabSessionId },
        data: { status: 'open', closedAt: null },
      });
    }

    // Delete the bill record
    await prisma.bill.delete({ where: { id: req.params.id } });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('bill:reopened', {
      billId: req.params.id,
      tableSessionId: bill.tableSessionId,
      tabSessionId: bill.tabSessionId,
    });

    res.json({ reopened: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/bills/:id/payment — Edit a payment on a closed bill
router.patch('/:id/payment', authenticate, async (req, res, next) => {
  try {
    const { paymentId, method, amount } = req.body;
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { method, amount },
    });
    res.json({ payment });
  } catch (err) {
    next(err);
  }
});

export default router;
