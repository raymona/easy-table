import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

const router = Router();
const prisma = new PrismaClient();

// POST /api/payments — Process a payment
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      tableSessionId, tabSessionId,
      method, amount, seatNumber,
      tipAmount, roomNumber, guestName, giftCardCode,
    } = req.body;

    const payment = await prisma.payment.create({
      data: {
        tableSessionId: tableSessionId || null,
        tabSessionId: tabSessionId || null,
        staffId: req.staff.staffId,
        method,
        amount,
        seatNumber: seatNumber || null,
        tipAmount: tipAmount || 0,
        roomNumber: roomNumber || null,
        guestName: guestName || null,
        giftCardCode: giftCardCode || null,
      },
    });

    // Handle gift card balance deduction
    if (method === 'gift' && giftCardCode) {
      const card = await prisma.giftCard.findUnique({ where: { code: giftCardCode } });
      if (card) {
        await prisma.giftCard.update({
          where: { code: giftCardCode },
          data: { balance: Math.max(0, card.balance - amount) },
        });
      }
    }

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('payment:processed', payment);

    res.status(201).json({ payment });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/payments/:id — Void a payment
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: { status: 'voided' },
    });

    // Restore gift card balance if applicable
    if (payment.method === 'gift' && payment.giftCardCode) {
      const card = await prisma.giftCard.findUnique({ where: { code: payment.giftCardCode } });
      if (card) {
        await prisma.giftCard.update({
          where: { code: payment.giftCardCode },
          data: { balance: card.balance + payment.amount },
        });
      }
    }

    const io = req.app.get('io');
    io.to(`venue:${req.staff.venueId}`).emit('payment:voided', { paymentId: payment.id });

    res.json({ payment });
  } catch (err) {
    next(err);
  }
});

export default router;
