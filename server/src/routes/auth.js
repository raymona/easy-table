import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// POST /api/auth/login — PIN-based staff login
router.post('/login', async (req, res, next) => {
  try {
    const { pin, venueId } = req.body;
    if (!pin || !venueId) {
      throw new AppError('PIN and venueId are required', 400);
    }

    const staff = await prisma.staff.findFirst({
      where: { venueId, pin, active: true },
    });

    if (!staff) {
      throw new AppError('Invalid PIN', 401);
    }

    const token = jwt.sign(
      { staffId: staff.id, venueId: staff.venueId, role: staff.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { staffId: staff.id, venueId: staff.venueId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      token,
      staff: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        color: staff.color,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh — Refresh JWT using httpOnly cookie
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      throw new AppError('No refresh token', 401);
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const staff = await prisma.staff.findUnique({
      where: { id: decoded.staffId },
    });

    if (!staff || !staff.active) {
      throw new AppError('Staff not found or inactive', 401);
    }

    const token = jwt.sign(
      { staffId: staff.id, venueId: staff.venueId, role: staff.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me — Get current staff + venue info
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: req.staff.staffId },
      select: { id: true, name: true, role: true, color: true, venueId: true },
    });

    const venue = await prisma.venue.findUnique({
      where: { id: req.staff.venueId },
      select: { id: true, name: true, province: true, mode: true, timezone: true, tipPresets: true },
    });

    res.json({ staff, venue });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/staff — Get all staff for a venue (for sign-in screen)
router.get('/staff', async (req, res, next) => {
  try {
    const { venueId } = req.query;
    if (!venueId) {
      throw new AppError('venueId is required', 400);
    }

    const staff = await prisma.staff.findMany({
      where: { venueId, active: true },
      select: { id: true, name: true, color: true, role: true },
      orderBy: { name: 'asc' },
    });

    res.json({ staff });
  } catch (err) {
    next(err);
  }
});

export default router;
