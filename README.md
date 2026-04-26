# Easy Table POS

A modern restaurant point-of-sale system built for speed and simplicity. Learnable in under one hour.

**Live Demo:** [easy-table-pos.vercel.app](https://easy-table-pos.vercel.app)

## What's New (April 2025)

### KDS (Kitchen Display System)
- Real-time kitchen ticket display with station filtering (Grill, Saute, Fry, Bar, Expo)
- Tickets grouped by table/tab, sorted oldest-first
- Urgency color coding: normal (< 5 min), yellow warning (5-10 min), red pulse (> 10 min)
- Bump individual items or entire tickets with optimistic updates
- Allergy alerts highlighted in red for kitchen visibility
- Auto-polls every 8 seconds for new tickets

### Menu Editor
- Full CRUD for menu categories and items in Admin panel
- Edit item names, prices, mod screen toggle, cook temp toggle, and add-ons
- Categories can be scoped to lunch, dinner, or all dayparts
- Syncs to backend database

### Toast Notifications
- Success/error/warning feedback on admin saves and actions
- Auto-dismiss after 3 seconds

### Floor List View
- Toggle between floor plan layout and sortable table list
- List shows status, server, seat count, item count, and elapsed time
- Occupied tables grouped by server, then available tables

### Auto Sign-Out
- Configurable inactivity timeout (1-10 minutes or disabled)
- Set in Admin > General > Auto Sign-Out
- Default: 2 minutes

### Staff PIN Management
- Staff PINs editable in Admin > Staff section
- PINs synced to backend on save
- Admin PIN modal supports keyboard input

### Bug Fixes
- Venue mode exit now returns to correct view (tabs for bar, floor for restaurant)
- Staff sync no longer wipes existing users on save

## Previous Releases

### Backend Integration (Phase 3)
- Full Express + PostgreSQL backend with Prisma ORM
- PIN-based staff login with JWT auth
- All actions sync to backend when `VITE_API_URL` is set
- Runs standalone with localStorage when no backend configured
- Deployed: Vercel (frontend) + Railway (backend)

### Admin Panel (Phase 2)
- PIN-gated admin settings (default PIN: 1234)
- Sections: General, Menu, Discounts, Void Reasons, Staff
- Runtime venue mode switching (Restaurant, Hotel, Bar, Bar+Hotel)
- Editable tax rate, tip presets, service times
- Add-on price breakdown on order items

### Core POS Features (Phase 1)
- Seat-based ordering with course management (Drinks, Apps, Mains, Dessert)
- Course-based kitchen firing (auto-fire drinks/apps, stage mains/dessert)
- Drag-and-drop items between seats
- Split items, move items, transfer tables
- Payment by full bill or per seat (Cash, Visa, MC, Amex, Debit, Gift Card)
- Comp and void tracking with timed quick-void (< 2 min)
- Bar tab support with tab-to-table transfer
- Shift reporting with sales, void, and comp summaries
- Gift card redemption

## Test Accounts

| Staff    | PIN  |
|----------|------|
| Ray      | 1111 |
| Nik      | 2222 |
| Hannah   | 3333 |
| Yaro     | 4444 |
| Ashley   | 5555 |

Admin PIN: **1234**

## Quick Start (Local Development)

```bash
# Frontend only (localStorage mode)
cd client
npm install
npm run dev
# Open http://localhost:5173

# With backend
cd server
cp .env.example .env   # configure DATABASE_URL, JWT secrets
npm install
npm run dev             # http://localhost:3001

cd client
echo "VITE_API_URL=http://localhost:3001" > .env.local
npm run dev
```

## Testing the KDS

1. Sign in as any staff member
2. Open a table, add items, and hit **Send Order**
3. Click **KDS** in the header nav
4. You should see fired tickets appear, grouped by table
5. Use station tabs to filter by kitchen station
6. Tap an item to bump it individually, or hit **BUMP** to clear the whole ticket
7. Tickets turn yellow at 5 minutes and red (pulsing) at 10 minutes

## Known Limitations

- **Print cheque**: Placeholder only, no real receipt printing yet
- **Room charge**: Stores room number locally but doesn't POST to a PMS
- **VoidModal "Other"**: Custom text input not yet wired
- **KDS real-time**: Currently polls every 8s; Socket.IO upgrade planned
- **Multi-province tax**: Ontario HST only for now

## Tech Stack

- **Frontend**: React 18, Vite 5, plain CSS (dark theme)
- **Backend**: Express 5, Prisma ORM, PostgreSQL
- **Auth**: JWT + httpOnly refresh cookies, PIN-based login
- **Deployment**: Vercel (frontend) + Railway (backend)
