# Easy Table — Developer Guide

## Project Overview
Easy Table is a restaurant POS system built as a React SPA. It supports table management, per-seat ordering, bar tabs, course-based kitchen firing, split payments, and end-of-shift reporting. The target is fast, intuitive operation learnable in under one hour.

Designed to support three deployment modes (configured at runtime — no code change needed):
- **Full-service restaurant** — multi-course, seat-based ordering, floor plan
- **Bar / quick-service** — no tables, fast tab open/close, minimal tap count
- **Hotel restaurant** — all FSR features + "Charge to Room" payment method → PMS integration

## Tech Stack
- **Frontend**: React 18 (hooks only — no class components), Vite 5
- **Backend**: Express 5, Prisma ORM, PostgreSQL
- **State**: React `useReducer` (POSContext) + `useState` (UIContext)
- **Auth**: JWT (short-lived access token + httpOnly refresh cookie), PIN-based staff login
- **Styling**: Plain CSS with custom properties (dark theme)
- **Testing**: Vitest + @testing-library/react + jsdom
- **Deployment**: Vercel (frontend) + Railway (backend + PostgreSQL)
- **No router yet** — single-page, view controlled via UI context

## Running the App
```bash
# Client (from client/)
npm run dev       # dev server at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build
npm test          # run tests once (vitest run)
npm run test:watch  # watch mode
npm run test:ui   # vitest UI

# Server (from server/)
npm run dev       # nodemon dev server at http://localhost:3001
npm start         # production: prisma db push + seed + node

# Backend integration
# Set VITE_API_URL=http://localhost:3001 in client/.env.local to enable backend mode.
# Without it, the app runs standalone with localStorage only.
```

## Directory Structure
```
client/src/
├── components/
│   ├── POS.jsx              ← thin shell: renders views + mounts all modals
│   ├── POS.css              ← full styles (CSS split planned)
│   ├── BackendSync.jsx      ← invisible; hydrates state from backend on login
│   ├── SignIn/SignIn.jsx     ← PIN-based login (backend) or click-to-sign-in (local)
│   ├── Header/Header.jsx
│   ├── Toast.jsx             ← auto-dismiss toast notifications (success/error/warning)
│   ├── FloorView/
│   │   ├── FloorView.jsx     ← floor plan (layout) or list toggle
│   │   └── FloorListView.jsx ← table list view (sorted: occupied by server, then available)
│   ├── TabsView/TabsView.jsx
│   ├── OrderView/
│   ├── modals/              ← SeatPicker, Payment, Void, Split, Transfer, etc.
│   └── admin/               ← PIN-gated admin panel (General, Menu, Staff, Discounts, VoidReasons)
├── context/
│   ├── POSContext.jsx       ← business data (useReducer), localStorage persistence
│   ├── UIContext.jsx        ← UI/navigation state (useState)
│   ├── AuthContext.jsx      ← JWT auth state, login/logout, token refresh
│   └── index.js             ← re-exports usePOS, useUI, usePOSActions, POS_ACTIONS, getServerInfo
├── hooks/
│   ├── usePOSActions.js     ← central backend integration hook (see below)
│   ├── useOrderTotals.js    ← subtotal, tax, total (discount-aware), seat totals
│   ├── usePayments.js       ← paid amounts, remaining, paid seats
│   ├── useDaypart.js        ← auto-switching lunch/dinner
│   └── useInactivityTimeout.js ← auto sign-out after configurable idle period
├── services/
│   ├── api.js               ← fetch wrapper, token management, auto-refresh on 401
│   ├── posApi.js            ← thin async wrappers for all backend API endpoints
│   └── posTransforms.js     ← convert backend responses ↔ local state shapes
├── utils/
│   ├── calculations.js      ← pure math (TAX_RATE, getTotal, etc.)
│   ├── orderHelpers.js      ← groupItemsByCourse, sortItemsByCourse
│   ├── idGenerator.js       ← generateId()
│   └── __tests__/
├── data/
│   └── menu.js              ← MENU, SERVERS, TABLES, TAX_RATE, constants (local-mode fallbacks)
└── test/
    └── setup.js

server/src/
├── index.js                 ← Express app, CORS, cookie-parser, route mounting
├── routes/                  ← auth, tables, tabs, orders, payments, bills, admin, menu, floor
├── middleware/auth.js       ← JWT authenticate middleware
├── lib/prisma.js            ← Prisma singleton
├── utils/errors.js          ← AppError class
└── socket.js                ← Socket.IO setup (for future real-time KDS)
```

## State Management Pattern

### POSContext (business data)
Uses `useReducer`. Returns `{ state, dispatch }`.

State shape:
```js
{
  currentServer: null | serverId,   // numeric (local) or CUID string (backend)
  daypart: 'lunch' | 'dinner',
  tableStates: {
    [tableId]: { server, seats, orders: { [seatNum]: item[] }, voidedItems: [], openedAt }
  },
  tabStates: {
    [tabId]: { name, server, items: item[], voidedItems: [], openedAt }
  },
  tablePayments: {
    [tableId]: { payments: [], paidSeats: [], seatPayments: {} }
  },
  giftCards: { [code]: balance },   // in-memory; seeded with ET-001..ET-VIP
  closedBills: [],
  serviceConfig: { lunch: { start, end }, dinner: { start, end } },
  adminConfig: {
    pin: '1234',                    // 4-digit admin PIN
    mode: 'restaurant',             // 'restaurant' | 'hotel' | 'bar' | 'bar-hotel'
    taxRate: 0.13,
    tipPresets: [15, 18, 20, 25],
    discountPresets: [{ label, type, value }],  // runtime-editable
    voidReasons: string[],                       // runtime-editable
    servers: [{ id, name, color }],              // runtime-editable
    autoSignOutMinutes: 2,                        // 0 = disabled
  },
  menu: [],  // array of { id, key, label, daypart, items[] } — from backend or static MENU
  // Backend integration — maps local IDs to backend CUIDs
  sessionMap: {},     // { [tableNumber]: backendSessionId }
  tabSessionMap: {},  // { [localTabId]: backendTabSessionId }
  itemIdMap: {},      // { [localItemId]: backendItemId }
}
```
State is persisted to localStorage (`easy-table-v2`, `STATE_VERSION = 3`). On load, stored state is merged over `initialState` so new fields always have defaults.

Consume via:
```js
import { usePOS } from '../context';
const { state, dispatch } = usePOS();
const { tableStates, currentServer } = state;
```

### UIContext (navigation + modal state)
Uses `useState` for each group. All modal visibility flags, `activeTable`, `activeTab`, `activeSeat`, `view`, mod screen form state, etc.

Consume via:
```js
import { useUI } from '../context';
const { view, activeTable, setShowPaymentModal, ... } = useUI();
```

### Component pattern
Components consume `usePOSActions()` for any action that should sync to the backend, and `useUI()` for navigation/modal state. `POS.jsx` is a pure mount/render shell.

**Important:** Components must NOT use raw `dispatch` for synced actions. Only `SET_SERVER`, `SIGN_OUT` (in SignIn.jsx only), and `SET_DAYPART` use raw dispatch. Everything else goes through `usePOSActions()`.

### usePOSActions hook (backend integration)
Central hook in `hooks/usePOSActions.js`. Returns named action functions:
- **Backend enabled** (`VITE_API_URL` set): calls API first, then dispatches with backend IDs
- **Backend disabled**: dispatches directly (localStorage-only mode, no behavior change)

Components use `const actions = usePOSActions()` then `await actions.openTable(...)` instead of `dispatch({type: POS_ACTIONS.OPEN_TABLE, ...})`.

### BackendSync
Invisible component (`components/BackendSync.jsx`) that hydrates local state from the backend when a user authenticates. Fetches open tables, tabs, closed bills, and admin config, transforms them via `posTransforms.js`, and dispatches `HYDRATE_FROM_BACKEND`. Resets on logout so re-login triggers a fresh hydrate.

### Auth flow (backend mode)
1. `AuthProvider` tries token refresh on mount (httpOnly cookie)
2. If no session → SignIn shows staff list fetched from `/api/auth/staff`
3. User taps name → PIN entry → `POST /api/auth/login` → JWT issued
4. `BackendSync` hydrates state from backend
5. Sign-out calls `POST /api/auth/logout` (clears cookie) + clears local token

Staff PINs (seeded): Ray=1111, Nik=2222, Hannah=3333, Yaro=4444, Ashley=5555

### Key Reducer Actions (POSContext)
| Action | Description |
|--------|-------------|
| `SET_SERVER` | Sign in |
| `SIGN_OUT` | Sign out |
| `SET_DAYPART` | Switch lunch/dinner |
| `OPEN_TABLE` | Create table with N seats |
| `CLOSE_TABLE_IF_EMPTY` | Remove table if no items |
| `ADJUST_SEATS` | Add/remove seats |
| `OPEN_TAB` | Create bar tab |
| `ADD_ITEM` | Add item to table seat or tab |
| `UPDATE_ITEM` | Edit existing item + add extras |
| `VOID_ITEM` | Remove item from order |
| `SEND_ORDER` | Fire drinks/apps, stage mains/dessert |
| `FIRE_COURSE` | Fire a staged course to kitchen |
| `MOVE_ITEM` | Move item between seats |
| `SPLIT_ITEM` | Replace item with N split copies |
| `DRAG_DROP_ITEM` | Drag-and-drop item between seats |
| `PROCESS_TABLE_PAYMENT` | Record a payment transaction |
| `VOID_LAST_PAYMENT` | Undo last payment transaction |
| `CLOSE_TABLE_BILL` | Archive table bill, remove from active |
| `CLOSE_TAB_BILL` | Archive tab bill, remove from active |
| `REOPEN_BILL` | Restore closed bill |
| `UPDATE_PAYMENT` | Edit a closed bill's payment |
| `TRANSFER_TABLE` | Move all items to a different table |
| `TRANSFER_TAB_TO_TABLE` | Convert bar tab to table |
| `TRANSFER_ITEM` | Move single item to different table/seat |
| `COMP_ITEM` | Set item price to $0, mark `isComped: true` (stays on bill) |
| `REDEEM_GIFT_CARD` | Decrement gift card balance by payment amount |
| `ADD_GIFT_CARD` | Add a new gift card to the store |
| `UPDATE_SERVICE_CONFIG` | Update lunch/dinner service time windows |
| `UPDATE_ADMIN_CONFIG` | Partial-merge updates into `adminConfig` |
| `NEW_DAY` | Clear localStorage + reset to initialState |
| `SET_MENU` | Replace menu categories from backend sync |
| `HYDRATE_FROM_BACKEND` | Bulk-replace state from backend API responses |
| `SET_SESSION_ID` | Map tableNumber → backend session CUID |
| `MAP_ITEM_ID` | Map local item ID → backend item CUID |

## Database Schema (Prisma)
Multi-tenant via `Venue`. All models except `GiftCard` belong to a venue.

| Model | Purpose |
|-------|---------|
| `Venue` | Tenant — name, province, mode, taxRate, tipPresets, adminPin |
| `Staff` | Server/bartender/manager/admin — name, PIN, role, color |
| `FloorSection` | Dining room / lounge / patio groupings |
| `Table` | Physical table — number, x/y position, shape, defaultSeats |
| `TableSession` | Open check on a table — links staff, seatCount, status |
| `TabSession` | Open bar tab — name, staff, preAuthRef/cardLast4 |
| `OrderItem` | Individual item — price, course, status, mods, addOns, cookTemp, allergies, notes |
| `Payment` | Transaction — method, amount, tipAmount, seatNumber, roomNumber, processorRef |
| `Bill` | Closed session — subtotal, discount, tax, total, tipTotal, amountPaid |
| `MenuCategory` | Category with daypart filter (lunch/dinner/all) |
| `MenuItem` | Menu item — price, needsModScreen, hasCookTemp, addOns, kdsRouting |
| `DiscountPreset` | Preset discount — label, type (percent/fixed), value |
| `VoidReason` | Configurable void reason labels |
| `ServiceConfig` | Lunch/dinner start and end times |
| `KdsStation` | Kitchen display station — name, key, color |
| `GiftCard` | Gift card — code, balance |
| `ClockEvent` | Time clock events (clock_in/out, break_start/end) |

ID strategy: CUID strings (`@default(cuid())`). Tables also have a `number` (display number, unique per venue).

Item status lifecycle in DB: `new` → `sent` → `fired` → `bumped` (or `voided` at any point).

## Environment Variables

### Server (`server/.env`)
| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `DATABASE_URL` | Yes | `postgresql://...` | Prisma connection string |
| `JWT_SECRET` | Yes | random 64-char string | Access token signing |
| `JWT_REFRESH_SECRET` | Yes | random 64-char string | Refresh token signing |
| `CLIENT_URL` | No | `http://localhost:5173` | CORS origin (comma-separated for multiple) |
| `PORT` | No | `3001` | Server port (default 3001) |
| `NODE_ENV` | No | `production` | Controls cookie secure/sameSite flags |

### Client (`client/.env.local`)
| Variable | Required | Example | Purpose |
|----------|----------|---------|---------|
| `VITE_API_URL` | No | `http://localhost:3001` | Backend URL. Omit for localStorage-only mode |

## Backend API Routes
All routes prefixed with `/api`. Auth routes are public; all others require JWT via `authenticate` middleware.

| Group | Prefix | Key Endpoints |
|-------|--------|---------------|
| Auth | `/auth` | `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`, `GET /venues`, `GET /staff` |
| Tables | `/tables` | `GET /`, `POST /:num/open`, `PATCH /:id/seats`, `POST /:id/close`, `POST /:id/transfer` |
| Tabs | `/tabs` | `GET /`, `POST /open`, `POST /:id/close` |
| Orders | `/orders` | `POST /items`, `PATCH /items/:id`, `DELETE /items/:id`, `POST /send`, `POST /fire-course`, `POST /move-item`, `POST /split-item`, `POST /comp-item`, `POST /transfer-item` |
| Payments | `/payments` | `POST /`, `DELETE /:id` |
| Bills | `/bills` | `GET /`, `POST /`, `POST /:id/reopen`, `PATCH /:id/payment` |
| Admin | `/admin` | `GET/PATCH /config`, CRUD for `/staff`, `/discounts`, `/void-reasons`, `PATCH /service-config` |
| KDS | `/kds` | `GET /stations`, `GET /tickets/:stationKey`, `POST /bump-item`, `POST /bump-ticket` |
| Menu | `/menu` | `GET /?daypart=`, `PUT /sync` (bulk menu upsert) |
| Floor | `/floor` | `GET /` (sections + tables) |

## Key Workflows

### Order Flow
1. Server signs in → Floor view → click empty table → seat picker
2. Order view opens → select seat, tap menu items
3. Items needing mods open ModScreen (cook temp, add-ons, notes)
4. "Send Order" fires Drinks/Apps immediately (`FIRED`), stages Mains/Dessert (`SENT`)
5. "Fire Mains" / "Fire Dessert" buttons appear when staged items exist

### Payment Flow
1. Tap "Pay" → PaymentModal opens
2. Option A: Pay full bill → select method → confirm
3. Option B: Pay by seat → select seat → amount pre-filled → select method → confirm
4. When all seats paid (or full bill paid), bill closes → moves to closedBills
5. Tip = amount paid − bill total (if positive)

### Payment Integration Hook Points
The reducer is the "confirmed" step — it only fires after the processor confirms:
```
User taps Pay → PaymentModal collects amount/method
  → [PaymentService.charge(amount, method)]   ← swap real processor here
  → on success: dispatch(PROCESS_TABLE_PAYMENT / CLOSE_TABLE_BILL)
```
This means adding Stripe Terminal, Moneris, or room-charge PMS is a clean addition to PaymentModal, not a refactor of the reducer.

### Item Status Lifecycle
`new` → `sent` (staged to kitchen) → `fired` (on its way)

- Drinks, Apps, and no-course items always skip `sent` and go directly to `fired` on Send Order
- Mains/Dessert go to `sent` on Send Order, then to `fired` when the course is explicitly fired

## Important Constants
Static data in `src/data/menu.js`:
- `TAX_RATE = 0.13` (Ontario HST) — **also mirrored as `adminConfig.taxRate`** (runtime-editable)
- `COOK_TEMPS`, `COURSES`, `CARD_TYPES`
- `TABLES`, `FLOOR_SECTIONS`, `FLOOR_SECTION_LABELS`
- `SERVERS`, `VOID_REASONS`, `DISCOUNT_PRESETS` — still exported but **superseded** by `adminConfig.servers/voidReasons/discountPresets` at runtime; components read from state, not menu.js

`getServerInfo(serverId, servers)` — second arg defaults to static `SERVERS` for backwards compat; pass `adminConfig.servers` when calling from components.

## Recently Completed

### UX Polish + Menu Editor (Phase 4, Apr 2026) — all done
- **Toast notifications** — `Toast.jsx` component + `showToast(message, type)` in UIContext. Auto-dismiss after 3s. Used in admin sections for save confirmations and error feedback.
- **Floor list view** — `FloorListView.jsx` alternate view for FloorView. Shows tables as a sortable list (occupied grouped by server first, then available). Toggle between layout/list via `floorViewMode` in UIContext.
- **Menu editor** — `MenuSection.jsx` in admin panel. Full CRUD for categories and items (name, price, mods toggle, cook temp toggle, add-ons). Syncs to backend via `PUT /api/menu/sync` (bulk upsert). Falls back to static MENU data if no backend menu exists. New `SET_MENU` reducer action + `syncMenu` in usePOSActions.
- **Auto sign-out on inactivity** — `useInactivityTimeout` hook. Configurable via `adminConfig.autoSignOutMinutes` (default 2, 0=disabled). Watches pointer/key/scroll events. Configurable in Admin → General.
- **Admin PIN modal keyboard support** — PIN entry now supports keyboard input (number keys + backspace).
- **Staff PIN field in admin** — Staff section now includes PIN field for each server. PIN synced to backend on save.
- **Staff sync fix** — Backend staff sync no longer wipes out existing users (soft-delete + reactivation via `reactivate-staff.js`).
- **Venue mode exit fix** — AdminShell now exits to correct view (tabs for bar modes, floor for restaurant modes).

### Backend Integration (Phase 3, Apr 2026) — all done
- **Express 5 + Prisma backend** — Full REST API with PostgreSQL. Multi-tenant via `Venue` model. All CRUD for tables, tabs, orders, payments, bills, admin config.
- **PIN-based auth** — Staff tap name → enter PIN → JWT issued (short-lived access token + httpOnly refresh cookie). `AuthProvider` auto-refreshes on mount.
- **usePOSActions hook** — Central integration layer. When `VITE_API_URL` is set, all actions call the API first then dispatch. Without it, dispatches directly (localStorage-only). Components use `actions.openTable()` instead of raw `dispatch`.
- **BackendSync** — Invisible component hydrates local state from backend on login. Fetches open tables, tabs, closed bills, admin config. Resets on logout for fresh hydrate on re-login.
- **Logout endpoint** — `POST /api/auth/logout` clears refresh token cookie. Sign-out in Header and New Day both call it.
- **Split item backend sync** — Backend generates split copies; reducer accepts `backendCopies` to avoid local/backend ID mismatch.
- **Service config sync** — `updateServiceConfig` now PATCHes to backend.
- **KDS routes** — `/api/kds` with stations, tickets, bump-item, bump-ticket (ready for KDS UI).
- **Deployment** — Vercel (frontend) + Railway (backend + PostgreSQL). Auto-seed on first startup.
- **FloorView/ServerScreen cleanup** — Read from `adminConfig.servers` instead of hardcoded `SERVERS` import.

### Pain Point Improvements (Phase 1, Feb 2026) — all done
1. **COMP badge CSS** — `.item-badge` / `.item-badge.comp` added to `POS.css`
2. **Timed quick-void** — Within 2 min of sending, "Quick Void" appears in `ItemActionsModal` (no reason needed). After 2 min, "Void (with reason)..." opens `VoidModal`. `VoidModal` now passes `reason` to `VOID_ITEM` dispatch.
3. **Void tracking** — `VOID_ITEM` stores a `voidRecord` in `tableStates[id].voidedItems` / `tabStates[id].voidedItems`. `OPEN_TABLE` and `OPEN_TAB` initialize `voidedItems: []`. `REOPEN_BILL` restores `voidedItems`. `closeTableBill()` in `PaymentModal` includes `voidedItems` on the closed bill record.
4. **localStorage auto-save** — `POSContext` hydrates from `localStorage` on mount (key: `easy-table-v2`, version: 3). Saves debounced 500 ms on every state change. `currentServer` stripped on load (forces sign-in). `NEW_DAY` action clears storage and resets state. "New Day / Clear Data" button in `ServerScreen`.
5. **ServerScreen reporting** — Shift stats now include Avg Check, Void count+total, Comp count. Closed bill cards show collapsible Voids section (`<details>`) with item name, reason, price.
6. **Admin service times** — `serviceConfig` in POSContext state (auto-persisted). `getDaypartFromConfig(config)` in `calculations.js`. Hook called in `POS.jsx`. ⚙ button in Header nav → `view = 'admin'`.

### Admin Panel + Bug Fixes (Phase 2, Feb 2026) — all done
- **Bug fix: daypart toggle flip-flop** — `useDaypart.js` used `daypart` as an effect dependency, causing the auto-check to immediately revert manual toggles. Fixed with `useRef` to track current daypart; interval effect only re-runs on `serviceConfig` change.
- **Bug fix: payment wouldn't close bill** — `getTax` and `getSeatTotal` in `calculations.js` returned unrounded floats, causing `totalPaid >= total` to fail on certain amounts. Both now round to 2 decimal places with `Math.round(... * 100) / 100`.
- **Add-on price breakdown** — `ModScreen` stores `basePrice` + `selectedAddOns: [{name, price}]` on each item. `OrderItem` and `ItemActionsModal` display the breakdown (base + each add-on + total) when add-ons are present.
- **Full admin panel** — PIN-gated (`adminConfig.pin`, default `1234`). `adminUnlocked` boolean in UIContext resets on refresh. Sections: General (venue mode, service times, tax rate, tip presets), Discounts, Void Reasons, Staff. All dispatch `UPDATE_ADMIN_CONFIG`. `AdminSettings.jsx` deleted and replaced.
- **Runtime venue mode** — `adminConfig.mode` replaces static `APP_MODE` from `config.js`. Header, PaymentModal, and initial view all read from state. Supports `'restaurant'`, `'hotel'`, `'bar'`, `'bar-hotel'`.
- **Runtime-editable staff/discounts/void reasons** — Components read from `adminConfig` instead of hardcoded `menu.js` constants.
- **State robustness** — Provider initializer now does `{ ...initialState, ...stored, currentServer: null }` so new state keys always have defaults even against older saves (prevents blank server list on schema additions).

## Known Limitations / In-Progress Items
- **KDS UI**: Backend routes ready (`/api/kds`), no frontend yet
- **Print cheque**: Placeholder modals, not real receipt printing (needs backend print server)
- **Gift card balance not on closed bill**: When a gift card is partially used, the remaining balance is correct in state but not printed on the closed bill receipt row
- **Room charge PMS integration**: Room charge stores room number/guest name locally but does not POST to a PMS (OPERA, Mews, etc.) — see PaymentService abstraction hook point above
- **transferTabToTable**: Not yet wired to backend API (dispatches locally only)
- **updatePayment**: Not yet wired to backend API (posApi has `apiUpdateBillPayment` but usePOSActions doesn't call it)
- **No training/demo mode**
- **VoidModal "Other" text not captured**: When user selects "Other" void reason, the freetext input has no `value`/`onChange` binding — the reason is saved as the string `"Other"` not the custom text
- **Admin PIN change**: No UI to change the PIN from within the admin panel yet
- **config.js APP_MODE**: Still present but superseded by `adminConfig.mode`. Can be removed in a future cleanup.

## Deployment Mode

Venue mode is now set at runtime via **Admin → General → Venue Mode** (no code change needed). Persisted in `adminConfig.mode`.

| Mode | Effect |
|------|--------|
| `'restaurant'` | Default. Full floor plan + bar tabs. |
| `'hotel'` | All restaurant features + "Charge to Room" in PaymentModal. |
| `'bar'` | Boots to Bar Tabs view, hides Floor nav button. |
| `'bar-hotel'` | Bar mode + "Charge to Room". |

`src/config.js` (`APP_MODE`) is now legacy — no longer read by any component.

### Still to add for bar mode
- Card pre-authorization flow (swipe to open tab, charge on close)
- Reduced course/seat complexity in MenuPanel (optional)

### Still to add for hotel mode
- POST to PMS API (OPERA, Mews, Cloudbeds) via PaymentService abstraction
- Guest name lookup from room number (PMS fetch)

## Admin Section
PIN-gated (default `1234`). Click ⚙ in the header → PIN screen → AdminShell.

| Section | What it does |
|---------|-------------|
| General | Venue mode, service times, tax rate, tip presets, auto sign-out timeout |
| Menu | Full CRUD for menu categories and items (name, price, mods, cook temp, add-ons). Syncs to backend. |
| Discounts | Add/edit/remove discount presets |
| Void Reasons | Add/edit/remove void reason strings |
| Staff | Add/edit/remove servers (name, color, PIN) |

Future phases: Floor Plan Editor, full reporting dashboard.

## Testing Strategy
- **Unit tests** (`utils/__tests__/`): Pure functions — fast, no DOM
- **Reducer tests** (`context/__tests__/`): Action → state assertions (no rendering)
- **Component tests** (`components/**/__tests__/`): RTL render + user interaction

## Competitive Positioning

### Market Gap
Clear gap between "simple but limited" (Square, Clover) and "powerful but complex/expensive/locked-in" (Toast, Lightspeed, MICROS). Easy Table targets the sweet spot. SkyTab ($30/mo, free hardware, no ETF) is the closest competitor.

### Key Competitors
- **Dominant**: Toast (~24% share, 140K locations), Square (~28% general)
- **Strong in Canada**: Lightspeed (Montreal), TouchBistro (Toronto)
- **Growing**: SkyTab/Shift4, SpotOn
- **Enterprise/Hotel**: Oracle MICROS, Aloha/NCR, Silverware, Mews

### Easy Table's Differentiators
1. **Learnable in under 1 hour** vs industry standard 2-4 weeks training
2. **Offline-by-default** — works without internet, syncs when connected
3. **Low tap count** — void: 3 taps, transfer: 2 taps, split: seat-based from start
4. **No contract / no hardware lock-in** — runs on any browser/tablet
5. **Seat-based ordering built in** from day one (competitors bolt it on)

### Industry Pain Points We Exploit
1. Contract lock-in & predatory pricing (Toast 2-3yr, Revel ETFs up to $15K)
2. Hardware lock-in (Toast proprietary devices)
3. Clunky slow UIs requiring weeks of training
4. Mandatory payment processors
5. Abysmal customer support (universal complaint)

### Critical Feature Gaps to Close
1. **KDS** — backend routes ready, needs UI (market growing $487M → $1B by 2033)
2. **Bar tab pre-auth** — non-negotiable for bar mode
3. **Handheld/tableside ordering** — 72% of operators use
4. **Reporting & analytics** — basic shift stats exist, need full dashboard
5. **Multi-province tax** — HST, GST+PST, GST+QST, GST-only
6. **Staff time clock** — ClockEvent model exists, no UI yet
7. **Online ordering / delivery integration** — 40% of revenue industry-wide
8. **Inventory management**

### Canada-Specific Requirements
- Interac debit (~60% of transactions, flat $0.04-$0.12/tx)
- Multi-province tax compliance
- Tip regulations (ON/BC ban employer deductions)
- Moneris integration (Canada's leading processor, $29.99/mo)
- Bilingual support (French required in Quebec)

## Payment Integration Roadmap
Recommended path:
1. **Stripe Terminal** — best dev experience, works in Canada, strong docs
2. **Node.js backend** — token exchange (browser never touches raw card data)
3. **Moneris** — lower per-transaction fees at scale (~2.55% vs Stripe's 2.9%)
