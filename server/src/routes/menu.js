import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/menu?daypart=lunch — Fetch menu categories and items
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { daypart } = req.query;

    const where = { venueId: req.staff.venueId };
    if (daypart && daypart !== 'all') {
      where.daypart = { in: [daypart, 'all'] };
    }

    const categories = await prisma.menuCategory.findMany({
      where,
      include: {
        items: {
          where: { active: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

export default router;
