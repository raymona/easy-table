import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

const router = Router();

// GET /api/tables — All open table sessions for venue
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sessions = await prisma.tableSession.findMany({
      where: { venueId: req.staff.venueId, status: 'open' },
      include: {
        table: true,
        staff: { select: { id: true, name: true, color: true } },
        orderItems: { where: { voidedAt: null } },
        payments: true,
      },
    });
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
});

// POST /api/tables/:tableNumber/open — Open a table
router.post('/:tableNumber/open', authenticate, async (req, res, next) => {
  try {
    const tableNumber = parseInt(req.params.tableNumber);
    const { seatCount } = req.body;

    const table = await prisma.table.findFirst({
      where: { venueId: req.staff.venueId, number: tableNumber },
    });
    if (!table) throw new AppError('Table not found', 404);

    // Check if table already has an open session
    const existing = await prisma.tableSession.findFirst({
      where: { tableId: table.id, status: 'open' },
    });
    if (existing) throw new AppError('Table is already open', 409);

    const session = await prisma.tableSession.create({
      data: {
        venueId: req.staff.venueId,
        tableId: table.id,
        staffId: req.staff.staffId,
        seatCount: seatCount || table.defaultSeats,
      },
      include: { table: true, staff: { select: { id: true, name: true, color: true } } },
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('table:opened', session);

    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tables/:sessionId/seats — Adjust seat count
router.patch('/:sessionId/seats', authenticate, async (req, res, next) => {
  try {
    const { seatCount } = req.body;
    const session = await prisma.tableSession.update({
      where: { id: req.params.sessionId },
      data: { seatCount },
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('table:updated', session);

    res.json({ session });
  } catch (err) {
    next(err);
  }
});

// POST /api/tables/:sessionId/close — Close empty table
router.post('/:sessionId/close', authenticate, async (req, res, next) => {
  try {
    const session = await prisma.tableSession.update({
      where: { id: req.params.sessionId },
      data: { status: 'closed', closedAt: new Date() },
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('table:closed', { tableSessionId: session.id });

    res.json({ session });
  } catch (err) {
    next(err);
  }
});

// POST /api/tables/:sessionId/transfer — Transfer to different table
router.post('/:sessionId/transfer', authenticate, async (req, res, next) => {
  try {
    const { toTableNumber } = req.body;
    const toTable = await prisma.table.findFirst({
      where: { venueId: req.staff.venueId, number: toTableNumber },
    });
    if (!toTable) throw new AppError('Destination table not found', 404);

    const existing = await prisma.tableSession.findFirst({
      where: { tableId: toTable.id, status: 'open' },
    });
    if (existing) throw new AppError('Destination table is occupied', 409);

    const session = await prisma.tableSession.update({
      where: { id: req.params.sessionId },
      data: { tableId: toTable.id },
      include: { table: true },
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('table:updated', session);

    res.json({ session });
  } catch (err) {
    next(err);
  }
});

export default router;
