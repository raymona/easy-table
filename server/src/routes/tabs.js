import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

const router = Router();

// GET /api/tabs — All open tab sessions for venue
router.get('/', authenticate, async (req, res, next) => {
  try {
    const tabs = await prisma.tabSession.findMany({
      where: { venueId: req.staff.venueId, status: 'open' },
      include: {
        staff: { select: { id: true, name: true, color: true } },
        orderItems: { where: { voidedAt: null } },
        payments: true,
      },
    });
    res.json({ tabs });
  } catch (err) {
    next(err);
  }
});

// POST /api/tabs/open — Open a new bar tab
router.post('/open', authenticate, async (req, res, next) => {
  try {
    const { name, preAuthRef, cardLast4 } = req.body;
    if (!name) throw new AppError('Tab name is required', 400);

    const tab = await prisma.tabSession.create({
      data: {
        venueId: req.staff.venueId,
        staffId: req.staff.staffId,
        name,
        preAuthRef: preAuthRef || null,
        cardLast4: cardLast4 || null,
      },
      include: {
        staff: { select: { id: true, name: true, color: true } },
      },
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('tab:opened', tab);

    res.status(201).json({ tab });
  } catch (err) {
    next(err);
  }
});

// POST /api/tabs/:id/convert-to-table — Move tab items to a new table session
router.post('/:id/convert-to-table', authenticate, async (req, res, next) => {
  try {
    const { tableNumber, seatCount } = req.body;
    if (!tableNumber) throw new AppError('tableNumber is required', 400);

    const tab = await prisma.tabSession.findUnique({
      where: { id: req.params.id },
      include: { orderItems: { where: { voidedAt: null } } },
    });
    if (!tab) throw new AppError('Tab not found', 404);

    const table = await prisma.table.findFirst({
      where: { venueId: req.staff.venueId, number: tableNumber },
    });
    if (!table) throw new AppError('Table not found', 404);

    const existing = await prisma.tableSession.findFirst({
      where: { tableId: table.id, status: 'open' },
    });
    if (existing) throw new AppError('Table is already occupied', 409);

    // Create table session and move items in a transaction
    const [session] = await prisma.$transaction([
      prisma.tableSession.create({
        data: {
          venueId: req.staff.venueId,
          tableId: table.id,
          staffId: tab.staffId,
          seatCount: seatCount || 1,
        },
      }),
      // Move all tab items to the new table session, seat 1
      ...tab.orderItems.map(item =>
        prisma.orderItem.update({
          where: { id: item.id },
          data: { tableSessionId: null, tabSessionId: null, seatNumber: 1 },
        })
      ),
      // Close the tab
      prisma.tabSession.update({
        where: { id: req.params.id },
        data: { status: 'closed', closedAt: new Date() },
      }),
    ]);

    // Fix: set tableSessionId on moved items (can't reference session.id inside the same transaction array)
    await prisma.orderItem.updateMany({
      where: { id: { in: tab.orderItems.map(i => i.id) } },
      data: { tableSessionId: session.id, seatNumber: 1 },
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('tab:closed', { tabSessionId: tab.id });
    io.to(`venue:${req.staff.venueId}`).emit('table:opened', session);

    res.json({ session });
  } catch (err) {
    next(err);
  }
});

// POST /api/tabs/:id/close — Close a tab
router.post('/:id/close', authenticate, async (req, res, next) => {
  try {
    const tab = await prisma.tabSession.update({
      where: { id: req.params.id },
      data: { status: 'closed', closedAt: new Date() },
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('tab:closed', { tabSessionId: tab.id });

    res.json({ tab });
  } catch (err) {
    next(err);
  }
});

export default router;
