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
