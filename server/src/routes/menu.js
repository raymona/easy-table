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

// PUT /api/menu/sync — bulk sync entire menu
router.put('/sync', authenticate, async (req, res, next) => {
  try {
    const { categories: incoming } = req.body;
    const venueId = req.staff.venueId;

    // Get existing categories for this venue
    const existing = await prisma.menuCategory.findMany({
      where: { venueId },
      include: { items: true },
    });

    const existingCatIds = new Set(existing.map(c => c.id));
    const incomingCatIds = new Set(incoming.filter(c => c.id && existingCatIds.has(c.id)).map(c => c.id));

    // Delete removed categories (soft-delete their items first)
    const catsToDelete = [...existingCatIds].filter(id => !incomingCatIds.has(id));
    if (catsToDelete.length) {
      await prisma.menuItem.updateMany({
        where: { categoryId: { in: catsToDelete } },
        data: { active: false },
      });
      await prisma.menuCategory.deleteMany({ where: { id: { in: catsToDelete } } });
    }

    // Upsert categories and their items
    for (let i = 0; i < incoming.length; i++) {
      const cat = incoming[i];
      let categoryId;

      if (cat.id && existingCatIds.has(cat.id)) {
        // Update existing category
        await prisma.menuCategory.update({
          where: { id: cat.id },
          data: { key: cat.key, label: cat.label, daypart: cat.daypart || 'all', sortOrder: i },
        });
        categoryId = cat.id;
      } else {
        // Create new category
        const created = await prisma.menuCategory.create({
          data: { venueId, key: cat.key, label: cat.label, daypart: cat.daypart || 'all', sortOrder: i },
        });
        categoryId = created.id;
      }

      // Handle items for this category
      const existingItems = existing.find(e => e.id === cat.id)?.items || [];
      const existingItemIds = new Set(existingItems.map(item => item.id));
      const incomingItemIds = new Set(
        (cat.items || []).filter(item => item.id && existingItemIds.has(item.id)).map(item => item.id)
      );

      // Soft-delete removed items
      const itemsToRemove = [...existingItemIds].filter(id => !incomingItemIds.has(id));
      if (itemsToRemove.length) {
        await prisma.menuItem.updateMany({
          where: { id: { in: itemsToRemove } },
          data: { active: false },
        });
      }

      // Upsert items
      for (let j = 0; j < (cat.items || []).length; j++) {
        const item = cat.items[j];
        const itemData = {
          name: item.name,
          price: parseFloat(item.price),
          needsModScreen: item.needsModScreen || false,
          hasCookTemp: item.hasCookTemp || false,
          addOns: item.addOns || [],
          sortOrder: j,
          active: true,
        };

        if (item.id && existingItemIds.has(item.id)) {
          await prisma.menuItem.update({ where: { id: item.id }, data: itemData });
        } else {
          await prisma.menuItem.create({ data: { categoryId, ...itemData } });
        }
      }
    }

    // Return refreshed menu
    const categories = await prisma.menuCategory.findMany({
      where: { venueId },
      include: { items: { where: { active: true }, orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

export default router;
