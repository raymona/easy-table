# Easy Table — Developer Guide

## Project Overview
Easy Table is a restaurant POS system built as a React SPA. It supports table management, per-seat ordering, bar tabs, course-based kitchen firing, split payments, and end-of-shift reporting. The target is fast, intuitive operation learnable in under one hour.

Designed to support three deployment modes (configured at runtime — no code change needed):
- **Full-service restaurant** — multi-course, seat-based ordering, floor plan
- **Bar / quick-service** — no tables, fast tab open/close, minimal tap count
- **Hotel restaurant** — all FSR features + "Charge to Room" payment method → PMS integration

## Tech Stack
- **Framework**: React 18 (hooks only — no class components)
- **Build**: Vite 5
- **State**: React `useReducer` (POSContext) + `useState` (UIContext)
- **Styling**: Plain CSS with custom properties (dark theme)
- **Testing**: Vitest + @testing-library/react + jsdom
- **No router yet** — single-page, view controlled via UI context

## Running the App
```bash
npm run dev       # dev server at http://localhost:5173
npm run build     # production build → dist/
npm run preview   # preview production build
npm test          # run tests once (vitest run)
npm run test:watch  # watch mode
npm run test:ui   # vitest UI
```

## Directory Structure
```
src/
├── components/
│   ├── POS.jsx              ← thin shell: renders views + mounts all modals (66 lines)
│   ├── POS.css              ← full styles (CSS split planned)
│   ├── SignIn/SignIn.jsx
│   ├── Header/Header.jsx
│   ├── FloorView/
│   │   ├── FloorView.jsx
│   │   └── FloorTable.jsx
│   ├── TabsView/TabsView.jsx
│   ├── OrderView/
│   │   ├── OrderView.jsx
│   │   ├── OrderPanel/
│   │   │   ├── OrderPanel.jsx
│   │   │   ├── SeatSection.jsx
│   │   │   └── OrderItem.jsx
│   │   └── MenuPanel/
│   │       ├── MenuPanel.jsx
│   │       └── MenuItem.jsx
│   ├── modals/
│   │   ├── SeatPickerModal.jsx
│   │   ├── NewTabModal.jsx
│   │   ├── ModScreen.jsx
│   │   ├── ItemActionsModal.jsx
│   │   ├── VoidModal.jsx
│   │   ├── SplitItemModal.jsx
│   │   ├── MoveItemModal.jsx
│   │   ├── PrintChequeModal.jsx
│   │   ├── PaymentModal.jsx
│   │   ├── DiscountModal.jsx
│   │   ├── OpenItemModal.jsx
│   │   ├── TransferModal.jsx
│   │   ├── ReopenTablePicker.jsx
│   │   ├── EditPaymentModal.jsx
│   │   └── ServerScreen.jsx
│   └── admin/
│       ├── AdminPinModal.jsx    ← 4-digit PIN gate
│       ├── AdminShell.jsx       ← sidebar + content shell
│       ├── AdminLayout.jsx      ← old scaffold (unused)
│       └── sections/
│           ├── GeneralSection.jsx   ← venue mode, service times, tax, tips
│           ├── DiscountsSection.jsx
│           ├── VoidReasonsSection.jsx
│           └── StaffSection.jsx
├── context/
│   ├── POSContext.jsx       ← business data (useReducer)
│   ├── UIContext.jsx        ← UI/navigation state (useState)
│   └── index.js             ← re-exports usePOS, useUI, POS_ACTIONS, getServerInfo
├── hooks/
│   ├── useOrderTotals.js    ← subtotal, tax, total (discount-aware), seat totals
│   ├── usePayments.js       ← paid amounts, remaining, paid seats
│   └── useDaypart.js        ← auto-switching lunch/dinner
├── utils/
│   ├── calculations.js      ← pure math (TAX_RATE, getTotal, etc.)
│   ├── orderHelpers.js      ← groupItemsByCourse, sortItemsByCourse
│   ├── idGenerator.js       ← generateId()
│   └── __tests__/
├── config.js                ← APP_MODE legacy (superseded by adminConfig.mode in state)
├── data/
│   └── menu.js              ← MENU, SERVERS, TABLES, TAX_RATE, constants
├── styles/
│   └── components/          ← CSS split from POS.css (planned)
└── test/
    └── setup.js
```

## State Management Pattern

### POSContext (business data)
Uses `useReducer`. Returns `{ state, dispatch }`.

State shape:
```js
{
  currentServer: null | serverId,
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
  },
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
Each component is responsible for its own handlers. Components consume `usePOS()` and `useUI()` directly — no prop drilling. `POS.jsx` is a pure mount/render shell.

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

## Recently Completed (Feb 2026)

### Pain Point Improvements (Phase 1) — all done
1. **COMP badge CSS** — `.item-badge` / `.item-badge.comp` added to `POS.css`
2. **Timed quick-void** — Within 2 min of sending, "Quick Void" appears in `ItemActionsModal` (no reason needed). After 2 min, "Void (with reason)..." opens `VoidModal`. `VoidModal` now passes `reason` to `VOID_ITEM` dispatch.
3. **Void tracking** — `VOID_ITEM` stores a `voidRecord` in `tableStates[id].voidedItems` / `tabStates[id].voidedItems`. `OPEN_TABLE` and `OPEN_TAB` initialize `voidedItems: []`. `REOPEN_BILL` restores `voidedItems`. `closeTableBill()` in `PaymentModal` includes `voidedItems` on the closed bill record.
4. **localStorage auto-save** — `POSContext` hydrates from `localStorage` on mount (key: `easy-table-v2`, version: 3). Saves debounced 500 ms on every state change. `currentServer` stripped on load (forces sign-in). `NEW_DAY` action clears storage and resets state. "New Day / Clear Data" button in `ServerScreen`.
5. **ServerScreen reporting** — Shift stats now include Avg Check, Void count+total, Comp count. Closed bill cards show collapsible Voids section (`<details>`) with item name, reason, price.
6. **Admin service times** — `serviceConfig` in POSContext state (auto-persisted). `getDaypartFromConfig(config)` in `calculations.js`. Hook called in `POS.jsx`. ⚙ button in Header nav → `view = 'admin'`.

### Admin Panel + Bug Fixes (Phase 2) — all done
- **Bug fix: daypart toggle flip-flop** — `useDaypart.js` used `daypart` as an effect dependency, causing the auto-check to immediately revert manual toggles. Fixed with `useRef` to track current daypart; interval effect only re-runs on `serviceConfig` change.
- **Bug fix: payment wouldn't close bill** — `getTax` and `getSeatTotal` in `calculations.js` returned unrounded floats, causing `totalPaid >= total` to fail on certain amounts. Both now round to 2 decimal places with `Math.round(... * 100) / 100`.
- **Add-on price breakdown** — `ModScreen` stores `basePrice` + `selectedAddOns: [{name, price}]` on each item. `OrderItem` and `ItemActionsModal` display the breakdown (base + each add-on + total) when add-ons are present.
- **Full admin panel** — PIN-gated (`adminConfig.pin`, default `1234`). `adminUnlocked` boolean in UIContext resets on refresh. Sections: General (venue mode, service times, tax rate, tip presets), Discounts, Void Reasons, Staff. All dispatch `UPDATE_ADMIN_CONFIG`. `AdminSettings.jsx` deleted and replaced.
- **Runtime venue mode** — `adminConfig.mode` replaces static `APP_MODE` from `config.js`. Header, PaymentModal, and initial view all read from state. Supports `'restaurant'`, `'hotel'`, `'bar'`, `'bar-hotel'`.
- **Runtime-editable staff/discounts/void reasons** — Components read from `adminConfig` instead of hardcoded `menu.js` constants.
- **State robustness** — Provider initializer now does `{ ...initialState, ...stored, currentServer: null }` so new state keys always have defaults even against older saves (prevents blank server list on schema additions).

## Known Limitations / In-Progress Items
- **Print cheque**: Placeholder modals, not real receipt printing (needs backend print server)
- **Gift card balance not on closed bill**: When a gift card is partially used, the remaining balance is correct in state but not printed on the closed bill receipt row
- **Room charge PMS integration**: Room charge stores room number/guest name locally but does not POST to a PMS (OPERA, Mews, etc.) — see PaymentService abstraction hook point above
- **No training/demo mode**
- **VoidModal "Other" text not captured**: When user selects "Other" void reason, the freetext input has no `value`/`onChange` binding — the reason is saved as the string `"Other"` not the custom text. Pre-existing issue.
- **Admin PIN change**: No UI to change the PIN from within the admin panel yet (can be changed by editing `adminConfig.pin` via `UPDATE_ADMIN_CONFIG` dispatch).
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
| General | Venue mode, service times, tax rate, tip presets |
| Discounts | Add/edit/remove discount presets |
| Void Reasons | Add/edit/remove void reason strings |
| Staff | Add/edit/remove servers (name + color) |

Future phases: Menu Editor, Floor Plan Editor, full reporting dashboard.

## Testing Strategy
- **Unit tests** (`utils/__tests__/`): Pure functions — fast, no DOM
- **Reducer tests** (`context/__tests__/`): Action → state assertions (no rendering)
- **Component tests** (`components/**/__tests__/`): RTL render + user interaction

## Payment Integration Roadmap
See `PaymentService` abstraction planned in architecture. Recommended path:
1. **Stripe Terminal** — best dev experience, works in Canada, strong docs
2. **Node.js backend** — token exchange (browser never touches raw card data)
3. **Moneris** — lower per-transaction fees at scale (~2.55% vs Stripe's 2.9%)

Canada note: **Interac debit is ~60% of transactions** — all major processors support it.

Competitive context: Lightspeed (strong in Canada) and Oracle MICROS Simphony (hotel standard) are the primary market comparables. Easy Table's advantages are simplicity, offline-by-default, and fast tab count for common operations (void: 3 taps, transfer: 2 taps, split cheque: seat-based from the start).
