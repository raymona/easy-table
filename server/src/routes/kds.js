import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/kds/stations — Get KDS stations for venue
router.get('/stations', authenticate, async (req, res, next) => {
  try {
    const stations = await prisma.kdsStation.findMany({
      where: { venueId: req.staff.venueId },
      orderBy: { sortOrder: 'asc' },
    });
    res.json({ stations });
  } catch (err) {
    next(err);
  }
});

// GET /api/kds/tickets/:stationKey — Get active tickets for a station
router.get('/tickets/:stationKey', authenticate, async (req, res, next) => {
  try {
    const station = await prisma.kdsStation.findFirst({
      where: { venueId: req.staff.venueId, key: req.params.stationKey },
    });

    if (!station) {
      return res.json({ tickets: [] });
    }

    // Get fired items routed to this station that haven't been bumped
    const items = await prisma.orderItem.findMany({
      where: {
        kdsStationId: station.id,
        status: 'fired',
        bumpedAt: null,
        voidedAt: null,
      },
      include: {
        tableSession: { include: { table: true } },
        tabSession: true,
      },
      orderBy: { firedAt: 'asc' },
    });

    // Group items into tickets by session
    const ticketMap = new Map();
    for (const item of items) {
      const key = item.tableSessionId || item.tabSessionId;
      if (!ticketMap.has(key)) {
        ticketMap.set(key, {
          sessionId: key,
          tableNumber: item.tableSession?.table?.number || null,
          tabName: item.tabSession?.name || null,
          firedAt: item.firedAt,
          items: [],
        });
      }
      ticketMap.get(key).items.push(item);
    }

    res.json({ tickets: Array.from(ticketMap.values()) });
  } catch (err) {
    next(err);
  }
});

// POST /api/kds/bump-item — Bump a single item
router.post('/bump-item', authenticate, async (req, res, next) => {
  try {
    const { itemId } = req.body;
    const item = await prisma.orderItem.update({
      where: { id: itemId },
      data: { bumpedAt: new Date(), status: 'bumped' },
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('kds:itemBumped', {
      itemId: item.id,
      bumpedAt: item.bumpedAt,
    });

    res.json({ item });
  } catch (err) {
    next(err);
  }
});

// POST /api/kds/bump-ticket — Bump all items in a ticket (session)
router.post('/bump-ticket', authenticate, async (req, res, next) => {
  try {
    const { sessionId, stationKey } = req.body;
    const station = await prisma.kdsStation.findFirst({
      where: { venueId: req.staff.venueId, key: stationKey },
    });

    const now = new Date();
    const where = {
      kdsStationId: station?.id,
      bumpedAt: null,
      status: 'fired',
    };

    // Determine if this is a table or tab session
    const tableSession = await prisma.tableSession.findUnique({ where: { id: sessionId } }).catch(() => null);
    if (tableSession) {
      where.tableSessionId = sessionId;
    } else {
      where.tabSessionId = sessionId;
    }

    await prisma.orderItem.updateMany({
      where,
      data: { bumpedAt: now, status: 'bumped' },
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('kds:ticketBumped', {
      sessionId,
      stationKey,
      bumpedAt: now,
    });

    res.json({ bumped: true });
  } catch (err) {
    next(err);
  }
});

export default router;
