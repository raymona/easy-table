import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

const router = Router();

// GET /api/admin/config — Get venue config
router.get('/config', authenticate, async (req, res, next) => {
  try {
    const venue = await prisma.venue.findUnique({
      where: { id: req.staff.venueId },
      include: {
        staff: { where: { active: true }, orderBy: { name: 'asc' } },
        discountPresets: true,
        voidReasons: true,
        serviceConfigs: true,
        kdsStations: { orderBy: { sortOrder: 'asc' } },
      },
    });
    res.json({ config: venue });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/config — Update venue config
router.patch('/config', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const { mode, province, adminPin, taxRate, tipPresets } = req.body;
    const data = {};
    if (mode !== undefined) data.mode = mode;
    if (province !== undefined) data.province = province;
    if (adminPin !== undefined) data.adminPin = adminPin;
    if (taxRate !== undefined) data.taxRate = taxRate;
    if (tipPresets !== undefined) data.tipPresets = tipPresets;

    const venue = await prisma.venue.update({
      where: { id: req.staff.venueId },
      data,
    });
    res.json({ config: venue });
  } catch (err) {
    next(err);
  }
});

// --- Staff Bulk Sync ---

// PUT /api/admin/staff/sync — Replace staff list (deactivates removed, creates new, updates existing)
router.put('/staff/sync', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { staff: staffList } = req.body;
    const venueId = req.staff.venueId;

    const existing = await prisma.staff.findMany({ where: { venueId } });
    const existingById = new Map(existing.map(s => [s.id, s]));
    const existingByName = new Map(existing.map(s => [s.name.toLowerCase(), s]));

    const accountedIds = new Set();

    // Create or update each incoming staff member
    for (const s of staffList) {
      // Match by CUID first, fall back to name match (handles pre-hydration numeric IDs)
      let match = null;
      if (typeof s.id === 'string' && existingById.has(s.id)) {
        match = existingById.get(s.id);
      } else if (s.name) {
        match = existingByName.get(s.name.toLowerCase());
      }

      if (match) {
        accountedIds.add(match.id);
        const data = { name: s.name, color: s.color, role: s.role || 'server', active: true };
        if (s.pin !== undefined) data.pin = s.pin || null;
        await prisma.staff.update({ where: { id: match.id }, data });
      } else {
        await prisma.staff.create({
          data: { venueId, name: s.name, pin: s.pin || null, color: s.color || '#3B82F6', role: s.role || 'server' },
        });
      }
    }

    // Deactivate staff not accounted for (can't delete due to FK constraints)
    for (const ex of existing) {
      if (ex.active && !accountedIds.has(ex.id)) {
        await prisma.staff.update({ where: { id: ex.id }, data: { active: false } });
      }
    }

    const updated = await prisma.staff.findMany({
      where: { venueId, active: true },
      select: { id: true, name: true, pin: true, role: true, color: true, active: true },
      orderBy: { name: 'asc' },
    });
    res.json({ staff: updated });
  } catch (err) {
    next(err);
  }
});

// --- Staff CRUD ---

// GET /api/admin/staff
router.get('/staff', authenticate, async (req, res, next) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { venueId: req.staff.venueId },
      select: { id: true, name: true, role: true, color: true, active: true, pin: true },
      orderBy: { name: 'asc' },
    });
    res.json({ staff });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/staff
router.post('/staff', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, pin, role, color } = req.body;
    const staff = await prisma.staff.create({
      data: {
        venueId: req.staff.venueId,
        name,
        pin: pin || null,
        role: role || 'server',
        color: color || '#3B82F6',
      },
    });
    res.status(201).json({ staff });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/staff/:id
router.patch('/staff/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, pin, role, color, active } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (pin !== undefined) data.pin = pin;
    if (role !== undefined) data.role = role;
    if (color !== undefined) data.color = color;
    if (active !== undefined) data.active = active;

    const staff = await prisma.staff.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ staff });
  } catch (err) {
    next(err);
  }
});

// --- Discount Presets Bulk Sync ---

// PUT /api/admin/discounts/sync — Replace all discount presets
router.put('/discounts/sync', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const { presets } = req.body;
    const venueId = req.staff.venueId;

    await prisma.discountPreset.deleteMany({ where: { venueId } });

    const created = [];
    for (const p of presets) {
      const d = await prisma.discountPreset.create({
        data: { venueId, label: p.label, type: p.type, value: p.value },
      });
      created.push(d);
    }
    res.json({ discounts: created });
  } catch (err) {
    next(err);
  }
});

// --- Discount Presets ---

// GET /api/admin/discounts
router.get('/discounts', authenticate, async (req, res, next) => {
  try {
    const discounts = await prisma.discountPreset.findMany({
      where: { venueId: req.staff.venueId },
    });
    res.json({ discounts });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/discounts
router.post('/discounts', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const { label, type, value } = req.body;
    const discount = await prisma.discountPreset.create({
      data: { venueId: req.staff.venueId, label, type, value },
    });
    res.status(201).json({ discount });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/discounts/:id
router.delete('/discounts/:id', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    await prisma.discountPreset.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// --- Void Reasons Bulk Sync ---

// PUT /api/admin/void-reasons/sync — Replace all void reasons
router.put('/void-reasons/sync', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const { reasons } = req.body;
    const venueId = req.staff.venueId;

    await prisma.voidReason.deleteMany({ where: { venueId } });

    const created = [];
    for (const label of reasons) {
      const r = await prisma.voidReason.create({
        data: { venueId, label },
      });
      created.push(r);
    }
    res.json({ reasons: created });
  } catch (err) {
    next(err);
  }
});

// --- Void Reasons ---

// GET /api/admin/void-reasons
router.get('/void-reasons', authenticate, async (req, res, next) => {
  try {
    const reasons = await prisma.voidReason.findMany({
      where: { venueId: req.staff.venueId },
    });
    res.json({ reasons });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/void-reasons
router.post('/void-reasons', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const { label } = req.body;
    const reason = await prisma.voidReason.create({
      data: { venueId: req.staff.venueId, label },
    });
    res.status(201).json({ reason });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/void-reasons/:id
router.delete('/void-reasons/:id', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    await prisma.voidReason.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  } catch (err) {
    next(err);
  }
});

// --- Service Config ---

// PATCH /api/admin/service-config
router.patch('/service-config', authenticate, requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const { configs } = req.body; // [{ period, start, end }]
    const results = [];
    for (const cfg of configs) {
      const result = await prisma.serviceConfig.upsert({
        where: {
          id: cfg.id || 'new',
        },
        update: { start: cfg.start, end: cfg.end },
        create: {
          venueId: req.staff.venueId,
          period: cfg.period,
          start: cfg.start,
          end: cfg.end,
        },
      });
      results.push(result);
    }
    res.json({ configs: results });
  } catch (err) {
    next(err);
  }
});

export default router;
