import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/floor — Fetch floor sections and tables
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sections = await prisma.floorSection.findMany({
      where: { venueId: req.staff.venueId },
      include: {
        tables: { orderBy: { number: 'asc' } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ sections });
  } catch (err) {
    next(err);
  }
});

export default router;
