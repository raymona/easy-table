import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Skip if already seeded
  const existingVenue = await prisma.venue.findFirst();
  if (existingVenue) {
    console.log('Database already seeded, skipping.');
    return;
  }

  console.log('Seeding Easy Table database...');

  // ── Venue ──────────────────────────────────────────────────
  const venue = await prisma.venue.create({
    data: {
      name: 'Easy Table Demo',
      province: 'ON',
      mode: 'restaurant',
      timezone: 'America/Toronto',
      adminPin: '1234',
      tipPresets: [15, 18, 20, 25],
    },
  });
  console.log(`Created venue: ${venue.name} (${venue.id})`);

  // ── Staff ──────────────────────────────────────────────────
  const staffData = [
    { name: 'Ray', pin: '1111', role: 'admin', color: '#3B82F6' },
    { name: 'Nik', pin: '2222', role: 'manager', color: '#10B981' },
    { name: 'Hannah', pin: '3333', role: 'server', color: '#F59E0B' },
    { name: 'Yaro', pin: '4444', role: 'server', color: '#8B5CF6' },
    { name: 'Ashley', pin: '5555', role: 'bartender', color: '#EC4899' },
  ];

  const staff = [];
  for (const s of staffData) {
    const created = await prisma.staff.create({
      data: { venueId: venue.id, ...s },
    });
    staff.push(created);
  }
  console.log(`Created ${staff.length} staff members`);

  // ── Floor Sections ──────────────────────────────────────────
  const sections = await Promise.all([
    prisma.floorSection.create({
      data: { venueId: venue.id, name: 'dining', label: 'Dining Room', sortOrder: 0 },
    }),
    prisma.floorSection.create({
      data: { venueId: venue.id, name: 'lounge', label: 'Lounge / Bar', sortOrder: 1 },
    }),
    prisma.floorSection.create({
      data: { venueId: venue.id, name: 'patio', label: 'Patio', sortOrder: 2 },
    }),
  ]);
  const sectionMap = Object.fromEntries(sections.map(s => [s.name, s.id]));
  console.log(`Created ${sections.length} floor sections`);

  // ── Tables ──────────────────────────────────────────────────
  const tablesData = [
    // Dining Room
    { number: 1, x: 40, y: 30, shape: 'square', defaultSeats: 4, section: 'dining' },
    { number: 2, x: 140, y: 30, shape: 'square', defaultSeats: 4, section: 'dining' },
    { number: 3, x: 240, y: 30, shape: 'round', defaultSeats: 6, section: 'dining' },
    { number: 4, x: 40, y: 130, shape: 'rectangle', defaultSeats: 6, section: 'dining' },
    { number: 5, x: 180, y: 130, shape: 'booth', defaultSeats: 4, section: 'dining' },
    { number: 6, x: 40, y: 220, shape: 'square', defaultSeats: 2, section: 'dining' },
    { number: 7, x: 140, y: 220, shape: 'square', defaultSeats: 2, section: 'dining' },
    { number: 8, x: 240, y: 220, shape: 'round', defaultSeats: 8, section: 'dining' },
    // Lounge
    { number: 101, x: 40, y: 30, shape: 'round', defaultSeats: 2, section: 'lounge' },
    { number: 102, x: 120, y: 30, shape: 'round', defaultSeats: 2, section: 'lounge' },
    { number: 103, x: 200, y: 30, shape: 'round', defaultSeats: 4, section: 'lounge' },
    { number: 104, x: 40, y: 110, shape: 'square', defaultSeats: 4, section: 'lounge' },
    { number: 105, x: 140, y: 110, shape: 'booth', defaultSeats: 6, section: 'lounge' },
    { number: 106, x: 40, y: 200, shape: 'rectangle', defaultSeats: 8, section: 'lounge' },
    // Patio
    { number: 201, x: 40, y: 30, shape: 'square', defaultSeats: 4, section: 'patio' },
    { number: 202, x: 140, y: 30, shape: 'square', defaultSeats: 4, section: 'patio' },
    { number: 203, x: 240, y: 30, shape: 'square', defaultSeats: 4, section: 'patio' },
    { number: 204, x: 40, y: 120, shape: 'round', defaultSeats: 6, section: 'patio' },
    { number: 205, x: 150, y: 120, shape: 'rectangle', defaultSeats: 8, section: 'patio' },
  ];

  for (const t of tablesData) {
    await prisma.table.create({
      data: {
        venueId: venue.id,
        sectionId: sectionMap[t.section],
        number: t.number,
        x: t.x,
        y: t.y,
        shape: t.shape,
        defaultSeats: t.defaultSeats,
      },
    });
  }
  console.log(`Created ${tablesData.length} tables`);

  // ── Menu Categories & Items ─────────────────────────────────
  const menuData = {
    lunch: [
      {
        key: 'drinks', label: 'Drinks', items: [
          { name: 'Coffee', price: 3.50 },
          { name: 'Tea', price: 3.00 },
          { name: 'Fresh OJ', price: 5.00 },
          { name: 'Apple Juice', price: 4.00 },
          { name: 'Coke', price: 3.50 },
          { name: 'Sprite', price: 3.50 },
          { name: 'Ginger Ale', price: 3.50 },
          { name: 'Sparkling Water', price: 4.00 },
          { name: 'Iced Tea', price: 4.00 },
          { name: 'Lemonade', price: 4.50 },
          { name: 'House Lager', price: 7.00, kdsRouting: 'bar' },
          { name: 'Local IPA', price: 8.00, kdsRouting: 'bar' },
          { name: 'Irish Stout', price: 8.00, kdsRouting: 'bar' },
          { name: 'House White (glass)', price: 10.00, kdsRouting: 'bar' },
          { name: 'House Red (glass)', price: 10.00, kdsRouting: 'bar' },
        ],
      },
      {
        key: 'apps', label: 'Starters', items: [
          { name: 'Soup of the Day', price: 8.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Crispy Wings', price: 16.00, needsModScreen: true, kdsRouting: 'fry', addOns: [{ name: 'Extra Sauce', price: 1.00 }, { name: 'Blue Cheese', price: 1.50 }, { name: 'Celery', price: 0.50 }] },
          { name: 'Loaded Nachos', price: 18.00, needsModScreen: true, kdsRouting: 'fry', addOns: [{ name: 'Guac', price: 3.00 }, { name: 'Sour Cream', price: 1.00 }, { name: 'Jalapeños', price: 0.50 }] },
          { name: 'Fried Calamari', price: 16.00, needsModScreen: true, kdsRouting: 'fry' },
          { name: 'Bruschetta', price: 12.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Spinach Artichoke Dip', price: 14.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Beef Sliders (3)', price: 15.00, needsModScreen: true, hasCookTemp: true, kdsRouting: 'grill' },
        ],
      },
      {
        key: 'sandwiches', label: 'Sandwiches & Burgers', items: [
          { name: 'Classic Club', price: 17.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'BLT', price: 14.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Grilled Cheese', price: 12.00, needsModScreen: true, kdsRouting: 'saute', addOns: [{ name: 'Bacon', price: 3.00 }, { name: 'Tomato', price: 0.50 }, { name: 'Avocado', price: 3.00 }] },
          { name: 'Crispy Chicken Sandwich', price: 18.00, needsModScreen: true, kdsRouting: 'fry' },
          { name: 'Reuben', price: 19.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Classic Burger', price: 18.00, needsModScreen: true, hasCookTemp: true, kdsRouting: 'grill', addOns: [{ name: 'Bacon', price: 3.00 }, { name: 'Cheese', price: 1.50 }, { name: 'Fried Egg', price: 2.00 }, { name: 'Avocado', price: 3.00 }] },
          { name: 'Mushroom Swiss Burger', price: 20.00, needsModScreen: true, hasCookTemp: true, kdsRouting: 'grill' },
          { name: 'Veggie Burger', price: 17.00, needsModScreen: true, kdsRouting: 'grill' },
        ],
      },
      {
        key: 'pizzas', label: 'Pizzas & Flatbreads', items: [
          { name: 'Margherita', price: 16.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Pepperoni', price: 18.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Meat Lovers', price: 22.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Garden Veggie', price: 18.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Fig & Prosciutto Flatbread', price: 16.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Wild Mushroom Flatbread', price: 15.00, needsModScreen: true, kdsRouting: 'saute' },
        ],
      },
      {
        key: 'mains', label: 'Mains', items: [
          { name: 'Fish & Chips', price: 22.00, needsModScreen: true, kdsRouting: 'fry' },
          { name: 'Fish Tacos', price: 19.00, needsModScreen: true, kdsRouting: 'fry' },
          { name: 'Chicken Caesar Salad', price: 18.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Cobb Salad', price: 19.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Pasta Primavera', price: 18.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Truffle Mac & Cheese', price: 17.00, needsModScreen: true, kdsRouting: 'saute', addOns: [{ name: 'Bacon', price: 3.00 }, { name: 'Lobster', price: 12.00 }, { name: 'Pulled Pork', price: 5.00 }] },
        ],
      },
      {
        key: 'sides', label: 'Sides', items: [
          { name: 'Fries', price: 6.00, kdsRouting: 'fry' },
          { name: 'Sweet Potato Fries', price: 7.00, kdsRouting: 'fry' },
          { name: 'Onion Rings', price: 8.00, kdsRouting: 'fry' },
          { name: 'Coleslaw', price: 4.00 },
          { name: 'Side Salad', price: 6.00 },
          { name: 'Garlic Bread', price: 5.00, kdsRouting: 'saute' },
        ],
      },
      {
        key: 'dessert', label: 'Dessert', items: [
          { name: 'Warm Brownie Sundae', price: 10.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'NY Cheesecake', price: 10.00, needsModScreen: true },
          { name: 'Sticky Toffee Pudding', price: 11.00, needsModScreen: true, kdsRouting: 'saute' },
        ],
      },
    ],
    dinner: [
      {
        key: 'drinks', label: 'Drinks', items: [
          { name: 'Coffee', price: 3.50 },
          { name: 'Tea', price: 3.00 },
          { name: 'Coke', price: 3.50 },
          { name: 'Sprite', price: 3.50 },
          { name: 'Ginger Ale', price: 3.50 },
          { name: 'Sparkling Water', price: 4.00 },
          { name: 'House Lager', price: 7.00, kdsRouting: 'bar' },
          { name: 'Local IPA', price: 8.00, kdsRouting: 'bar' },
          { name: 'Irish Stout', price: 8.00, kdsRouting: 'bar' },
          { name: 'Czech Pilsner', price: 8.00, kdsRouting: 'bar' },
          { name: 'House White (glass)', price: 12.00, kdsRouting: 'bar' },
          { name: 'House Red (glass)', price: 12.00, kdsRouting: 'bar' },
          { name: 'Sauvignon Blanc', price: 14.00, kdsRouting: 'bar' },
          { name: 'Chardonnay', price: 14.00, kdsRouting: 'bar' },
          { name: 'Pinot Noir', price: 15.00, kdsRouting: 'bar' },
          { name: 'Cabernet Sauvignon', price: 16.00, kdsRouting: 'bar' },
          { name: 'House Margarita', price: 14.00, kdsRouting: 'bar' },
          { name: 'Old Fashioned', price: 15.00, kdsRouting: 'bar' },
          { name: 'Mojito', price: 14.00, kdsRouting: 'bar' },
          { name: 'Moscow Mule', price: 14.00, kdsRouting: 'bar' },
          { name: 'Negroni', price: 15.00, kdsRouting: 'bar' },
          { name: 'Martini', price: 16.00, kdsRouting: 'bar' },
        ],
      },
      {
        key: 'apps', label: 'Starters', items: [
          { name: 'Soup of the Day', price: 10.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Crispy Wings', price: 18.00, needsModScreen: true, kdsRouting: 'fry', addOns: [{ name: 'Extra Sauce', price: 1.00 }, { name: 'Blue Cheese', price: 1.50 }, { name: 'Celery', price: 0.50 }] },
          { name: 'Loaded Nachos', price: 20.00, needsModScreen: true, kdsRouting: 'fry', addOns: [{ name: 'Guac', price: 3.00 }, { name: 'Sour Cream', price: 1.00 }, { name: 'Jalapeños', price: 0.50 }] },
          { name: 'Fried Calamari', price: 18.00, needsModScreen: true, kdsRouting: 'fry' },
          { name: 'Bruschetta', price: 14.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Beef Tartare', price: 19.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Tuna Tartare', price: 21.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Oysters (6)', price: 24.00, needsModScreen: true },
          { name: 'Shrimp Cocktail', price: 22.00, needsModScreen: true },
          { name: 'Charcuterie Board', price: 26.00, needsModScreen: true },
        ],
      },
      {
        key: 'sandwiches', label: 'Burgers', items: [
          { name: 'Classic Burger', price: 20.00, needsModScreen: true, hasCookTemp: true, kdsRouting: 'grill', addOns: [{ name: 'Bacon', price: 3.00 }, { name: 'Cheese', price: 1.50 }, { name: 'Fried Egg', price: 2.00 }, { name: 'Avocado', price: 3.00 }] },
          { name: 'Mushroom Swiss Burger', price: 22.00, needsModScreen: true, hasCookTemp: true, kdsRouting: 'grill' },
          { name: 'Blue Cheese Burger', price: 23.00, needsModScreen: true, hasCookTemp: true, kdsRouting: 'grill' },
          { name: 'Veggie Burger', price: 19.00, needsModScreen: true, kdsRouting: 'grill' },
        ],
      },
      {
        key: 'pizzas', label: 'Pizzas & Flatbreads', items: [
          { name: 'Margherita', price: 18.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Pepperoni', price: 20.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Meat Lovers', price: 24.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Truffle & Mushroom', price: 24.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Fig & Prosciutto Flatbread', price: 18.00, needsModScreen: true, kdsRouting: 'saute' },
        ],
      },
      {
        key: 'mains', label: 'Mains', items: [
          { name: 'Fish & Chips', price: 26.00, needsModScreen: true, kdsRouting: 'fry' },
          { name: 'Pan-Seared Salmon', price: 32.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Roast Chicken', price: 28.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Grilled Pork Chop', price: 30.00, needsModScreen: true, hasCookTemp: true, kdsRouting: 'grill' },
          { name: 'Lamb Chops', price: 38.00, needsModScreen: true, hasCookTemp: true, kdsRouting: 'grill' },
          { name: 'Ribeye 14oz', price: 52.00, needsModScreen: true, hasCookTemp: true, kdsRouting: 'grill', addOns: [{ name: 'Peppercorn Sauce', price: 3.00 }, { name: 'Blue Cheese Butter', price: 2.00 }, { name: 'Garlic Butter', price: 2.00 }, { name: 'Mushrooms', price: 3.00 }] },
          { name: 'Filet Mignon 8oz', price: 48.00, needsModScreen: true, hasCookTemp: true, kdsRouting: 'grill', addOns: [{ name: 'Peppercorn Sauce', price: 3.00 }, { name: 'Blue Cheese Butter', price: 2.00 }, { name: 'Garlic Butter', price: 2.00 }] },
          { name: 'NY Strip 12oz', price: 46.00, needsModScreen: true, hasCookTemp: true, kdsRouting: 'grill' },
          { name: 'Braised Short Rib', price: 36.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Bolognese', price: 24.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Carbonara', price: 24.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Mushroom Risotto', price: 26.00, needsModScreen: true, kdsRouting: 'saute' },
        ],
      },
      {
        key: 'sides', label: 'Sides', items: [
          { name: 'Fries', price: 7.00, kdsRouting: 'fry' },
          { name: 'Truffle Fries', price: 10.00, kdsRouting: 'fry' },
          { name: 'Mashed Potatoes', price: 8.00, kdsRouting: 'saute' },
          { name: 'Loaded Baked Potato', price: 9.00, kdsRouting: 'saute' },
          { name: 'Grilled Asparagus', price: 10.00, kdsRouting: 'grill' },
          { name: 'Roasted Brussels Sprouts', price: 10.00, kdsRouting: 'saute' },
          { name: 'Creamed Spinach', price: 9.00, kdsRouting: 'saute' },
          { name: 'Side Caesar', price: 8.00 },
        ],
      },
      {
        key: 'dessert', label: 'Dessert', items: [
          { name: 'Warm Brownie Sundae', price: 12.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'NY Cheesecake', price: 12.00, needsModScreen: true },
          { name: 'Sticky Toffee Pudding', price: 13.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Crème Brûlée', price: 12.00, needsModScreen: true, kdsRouting: 'saute' },
          { name: 'Affogato', price: 10.00, needsModScreen: true },
        ],
      },
    ],
  };

  let itemCount = 0;
  for (const [daypart, categories] of Object.entries(menuData)) {
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const category = await prisma.menuCategory.create({
        data: {
          venueId: venue.id,
          key: cat.key,
          label: cat.label,
          daypart,
          sortOrder: i,
        },
      });

      for (let j = 0; j < cat.items.length; j++) {
        const item = cat.items[j];
        await prisma.menuItem.create({
          data: {
            categoryId: category.id,
            name: item.name,
            price: item.price,
            needsModScreen: item.needsModScreen || false,
            hasCookTemp: item.hasCookTemp || false,
            addOns: item.addOns || [],
            kdsRouting: item.kdsRouting || null,
            sortOrder: j,
          },
        });
        itemCount++;
      }
    }
  }
  console.log(`Created menu: ${itemCount} items`);

  // ── Discount Presets ────────────────────────────────────────
  const discounts = [
    { label: '10%', type: 'percent', value: 10 },
    { label: '20%', type: 'percent', value: 20 },
    { label: '50% Industry', type: 'percent', value: 50 },
    { label: '100% Comp', type: 'percent', value: 100 },
    { label: '$5 off', type: 'fixed', value: 5 },
    { label: '$10 off', type: 'fixed', value: 10 },
    { label: '$20 off', type: 'fixed', value: 20 },
  ];
  for (const d of discounts) {
    await prisma.discountPreset.create({
      data: { venueId: venue.id, ...d },
    });
  }
  console.log(`Created ${discounts.length} discount presets`);

  // ── Void Reasons ────────────────────────────────────────────
  const voidReasons = [
    'Guest changed mind',
    'Kitchen error',
    'Server error',
    "86'd",
    'Other',
  ];
  for (const label of voidReasons) {
    await prisma.voidReason.create({
      data: { venueId: venue.id, label },
    });
  }
  console.log(`Created ${voidReasons.length} void reasons`);

  // ── Service Config ──────────────────────────────────────────
  await prisma.serviceConfig.create({
    data: { venueId: venue.id, period: 'lunch', start: '11:00', end: '16:59' },
  });
  await prisma.serviceConfig.create({
    data: { venueId: venue.id, period: 'dinner', start: '17:00', end: '22:59' },
  });
  console.log('Created service config (lunch/dinner)');

  // ── KDS Stations ────────────────────────────────────────────
  const stations = [
    { name: 'Grill', key: 'grill', color: '#EF4444', sortOrder: 0 },
    { name: 'Sauté', key: 'saute', color: '#F59E0B', sortOrder: 1 },
    { name: 'Fry', key: 'fry', color: '#3B82F6', sortOrder: 2 },
    { name: 'Bar', key: 'bar', color: '#8B5CF6', sortOrder: 3 },
    { name: 'Expo', key: 'expo', color: '#10B981', sortOrder: 4 },
  ];
  for (const s of stations) {
    await prisma.kdsStation.create({
      data: { venueId: venue.id, ...s },
    });
  }
  console.log(`Created ${stations.length} KDS stations`);

  // ── Gift Cards ──────────────────────────────────────────────
  const giftCards = [
    { code: 'ET-001', balance: 50.00 },
    { code: 'ET-002', balance: 100.00 },
    { code: 'ET-003', balance: 25.00 },
    { code: 'ET-VIP', balance: 500.00 },
  ];
  for (const gc of giftCards) {
    await prisma.giftCard.create({ data: gc });
  }
  console.log(`Created ${giftCards.length} gift cards`);

  console.log('\nSeed complete!');
  console.log(`Venue ID: ${venue.id}`);
  console.log('Staff PINs: Ray=1111, Nik=2222, Hannah=3333, Yaro=4444, Ashley=5555');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
