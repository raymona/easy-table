import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

const router = Router();

// POST /api/orders/items — Add item to table session or tab session
router.post('/items', authenticate, async (req, res, next) => {
  try {
    const { tableSessionId, tabSessionId, seatNumber, item } = req.body;

    if (!tableSessionId && !tabSessionId) {
      throw new AppError('tableSessionId or tabSessionId required', 400);
    }

    // Resolve KDS station from menu item routing
    let kdsStationId = null;
    if (item.menuItemId) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        select: { kdsRouting: true },
      });
      if (menuItem?.kdsRouting) {
        const station = await prisma.kdsStation.findUnique({
          where: { venueId_key: { venueId: req.staff.venueId, key: menuItem.kdsRouting } },
        });
        kdsStationId = station?.id || null;
      }
    }

    const orderItem = await prisma.orderItem.create({
      data: {
        tableSessionId: tableSessionId || null,
        tabSessionId: tabSessionId || null,
        seatNumber: seatNumber || null,
        menuItemId: item.menuItemId || null,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        course: item.course || '',
        mods: item.mods || [],
        addOns: item.addOns || [],
        cookTemp: item.cookTemp || null,
        allergies: item.allergies || [],
        notes: item.notes || [],
        timing: item.timing || null,
        sentById: req.staff.staffId,
        kdsStationId,
      },
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('item:added', {
      item: orderItem,
      sessionId: tableSessionId || tabSessionId,
      seatNumber,
    });

    res.status(201).json({ item: orderItem });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/orders/items/:id — Update an item (mods, course, etc.)
router.patch('/items/:id', authenticate, async (req, res, next) => {
  try {
    const { updates } = req.body;
    const item = await prisma.orderItem.update({
      where: { id: req.params.id },
      data: updates,
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('item:updated', item);

    res.json({ item });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/orders/items/:id — Void an item
router.delete('/items/:id', authenticate, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const item = await prisma.orderItem.update({
      where: { id: req.params.id },
      data: {
        status: 'voided',
        voidedAt: new Date(),
        voidReason: reason || 'No reason',
      },
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('item:voided', {
      itemId: item.id,
      reason: item.voidReason,
    });

    res.json({ item });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/send — Send order (fire drinks/apps, stage mains/dessert)
router.post('/send', authenticate, async (req, res, next) => {
  try {
    const { sessionId, sessionType } = req.body;
    const where = sessionType === 'table'
      ? { tableSessionId: sessionId }
      : { tabSessionId: sessionId };

    const now = new Date();

    // Fire drinks, apps, and uncategorized items immediately
    await prisma.orderItem.updateMany({
      where: {
        ...where,
        status: 'new',
        course: { in: ['', 'Drinks', 'Apps'] },
      },
      data: { status: 'fired', sentAt: now, firedAt: now },
    });

    // Stage mains and dessert
    await prisma.orderItem.updateMany({
      where: {
        ...where,
        status: 'new',
        course: { in: ['Mains', 'Dessert'] },
      },
      data: { status: 'sent', sentAt: now },
    });

    // Backfill KDS routing for items that don't have a station assigned
    const itemsNeedingRouting = await prisma.orderItem.findMany({
      where: { ...where, kdsStationId: null, status: { in: ['fired', 'sent'] }, voidedAt: null },
      select: { id: true, menuItemId: true },
    });

    for (const oi of itemsNeedingRouting) {
      if (!oi.menuItemId) continue;
      const mi = await prisma.menuItem.findUnique({
        where: { id: oi.menuItemId },
        select: { kdsRouting: true },
      });
      if (!mi?.kdsRouting) continue;
      const station = await prisma.kdsStation.findUnique({
        where: { venueId_key: { venueId: req.staff.venueId, key: mi.kdsRouting } },
      });
      if (station) {
        await prisma.orderItem.update({
          where: { id: oi.id },
          data: { kdsStationId: station.id },
        });
      }
    }

    const items = await prisma.orderItem.findMany({
      where: { ...where, voidedAt: null },
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('order:sent', { sessionId, items });

    res.json({ items });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/fire-course — Fire a staged course
router.post('/fire-course', authenticate, async (req, res, next) => {
  try {
    const { sessionId, sessionType, course } = req.body;
    const where = sessionType === 'table'
      ? { tableSessionId: sessionId }
      : { tabSessionId: sessionId };

    const now = new Date();
    await prisma.orderItem.updateMany({
      where: { ...where, status: 'sent', course },
      data: { status: 'fired', firedAt: now },
    });

    const firedItems = await prisma.orderItem.findMany({
      where: { ...where, course, status: 'fired' },
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('items:fired', {
      sessionId,
      course,
      items: firedItems,
    });

    res.json({ items: firedItems });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/move-item — Move item between seats
router.post('/move-item', authenticate, async (req, res, next) => {
  try {
    const { itemId, toSeat } = req.body;
    const item = await prisma.orderItem.update({
      where: { id: itemId },
      data: { seatNumber: toSeat },
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('item:updated', item);

    res.json({ item });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/split-item — Split item into N copies
router.post('/split-item', authenticate, async (req, res, next) => {
  try {
    const { itemId, splitWays } = req.body;
    const original = await prisma.orderItem.findUnique({ where: { id: itemId } });
    if (!original) throw new AppError('Item not found', 404);

    const splitPrice = Math.round((original.price / splitWays) * 100) / 100;

    // Update original to split price
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { price: splitPrice },
    });

    // Create splitWays-1 copies
    const copies = [];
    for (let i = 1; i < splitWays; i++) {
      const copy = await prisma.orderItem.create({
        data: {
          tableSessionId: original.tableSessionId,
          tabSessionId: original.tabSessionId,
          seatNumber: original.seatNumber,
          menuItemId: original.menuItemId,
          name: original.name,
          price: splitPrice,
          quantity: original.quantity,
          course: original.course,
          status: original.status,
          mods: original.mods,
          addOns: original.addOns,
          cookTemp: original.cookTemp,
          splitFrom: original.id,
          sentAt: original.sentAt,
          firedAt: original.firedAt,
          sentById: original.sentById,
        },
      });
      copies.push(copy);
    }

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('item:split', { originalId: itemId, copies });

    res.json({ copies });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/comp-item — Comp an item (set price to $0)
router.post('/comp-item', authenticate, async (req, res, next) => {
  try {
    const { itemId, reason } = req.body;
    const item = await prisma.orderItem.update({
      where: { id: itemId },
      data: { isComped: true, compReason: reason || null, price: 0 },
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('item:updated', item);

    res.json({ item });
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/transfer-item — Move item to different session/seat
router.post('/transfer-item', authenticate, async (req, res, next) => {
  try {
    const { itemId, toTableSessionId, toTabSessionId, toSeat } = req.body;
    const data = { seatNumber: toSeat || null };
    if (toTableSessionId) {
      data.tableSessionId = toTableSessionId;
      data.tabSessionId = null;
    } else if (toTabSessionId) {
      data.tabSessionId = toTabSessionId;
      data.tableSessionId = null;
    }

    const item = await prisma.orderItem.update({
      where: { id: itemId },
      data,
    });

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('item:updated', item);

    res.json({ item });
  } catch (err) {
    next(err);
  }
});

export default router;
