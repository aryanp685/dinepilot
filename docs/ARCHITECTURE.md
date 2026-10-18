# DinePilot System Architecture (`docs/ARCHITECTURE.md`)

## 1. Product Vision & Architectural Philosophy

**DinePilot** is an original, production-oriented multi-tenant Restaurant Operations, Profitability, and Guest Ordering SaaS platform built for independent restaurants, cafés, cloud kitchens, and multi-outlet chains in India (with defaults optimized for Nagpur/Maharashtra and pan-India GST compliance).

Rather than acting merely as a digital menu or POS clerk, DinePilot connects **five operational loops**:
1. **Guest & Table Ordering Loop**: Cryptographically verified QR table tokens, Running Table Sessions (multi-KOT support for repeat rounds of ordering), 4 dynamic menu theme presets, and zero-MDR UPI payment instructions.
2. **Kitchen & Floor Execution Loop**: Strict Order State Machine (`NEW → ACCEPTED → PREPARING → READY → COMPLETED / CANCELLED`) with real-time Socket.IO room broadcasts to the Kitchen Display System (`/kitchen`), staff order desk (`/app/orders`), and guest live tracker (`/order/:publicOrderToken`).
3. **Inventory, Yield & Recipe Costing Loop**: Yield-adjusted ingredient costing (accounting for peeling/trimming shrinkage), packaging cost per serving, unit family validation (`g/kg`, `ml/l`, `pcs`), and idempotent stock deduction on order acceptance.
4. **Menu Profitability Engine**: Real-time Menu Engineering Matrix classifying dishes into **Stars** (High Volume, High Margin), **Plowhorses** (High Volume, Low Margin), **Puzzles** (Low Volume, High Margin), and **Dogs** (Low Volume, Low Margin) using integer paise accounting.
5. **AI Business Copilot**: Deterministic backend metric computation paired with an AI Provider Adapter (supporting external LLMs with strict Zod schema validation, or the built-in **Deterministic Rule-Based Insights Engine** when no external key is configured).

---

## 2. Monorepo Structure

```text
dinepilot/
  packages/
    shared/               # Shared Zod schemas, TypeScript types, INR paise math, GST engine, RBAC matrix
  apps/
    api/                  # Express + TypeScript + Mongoose + Socket.IO modular monolith (/api/v1)
    web/                  # Next.js (App Router) + TypeScript + Tailwind CSS + TanStack Query + Recharts
  docs/
    ARCHITECTURE.md       # System design, state machines, design system tokens
    DATABASE.md           # Collections, indexes, transaction rules, retention policies
    API.md                # REST API v1 specification & OpenAPI contract
    SECURITY.md           # Multi-tenant isolation, RBAC matrix, threat model
```

---

## 3. Five Application Surfaces

1. **Public Marketing Site (`/`, `/features`, `/pricing`, `/about`, `/contact`, `/privacy`, `/terms`, `/login`, `/register`)**
2. **Restaurant Administration Dashboard (`/app/overview`, `/app/orders`, `/app/menu`, `/app/inventory`, `/app/recipes`, `/app/analytics`, `/app/ai-insights`, `/app/tables`, `/app/reservations`, `/app/customers`, `/app/loyalty`, `/app/staff`, `/app/reports`, `/app/settings`, `/app/billing`)**
3. **Guest QR Ordering Application (`/menu/:restaurantSlug`, `/menu/:restaurantSlug/cart`, `/order/:publicOrderToken`)**
4. **Kitchen Display System (`/kitchen`)**
5. **Platform Administration (`/platform/overview`, `/platform/restaurants`, `/platform/users`, `/platform/subscriptions`, `/platform/audit-logs`)**

---

## 4. Order State Machine & Inventory Deduction Rule

### Valid Order States
- `NEW`: Created by guest QR or staff; awaits staff verification for QR orders.
- `ACCEPTED`: Verified by staff; **triggers idempotent recipe ingredient consumption** in `inventoryMovements` and routes to Kitchen Display System (`KDS`).
- `PREPARING`: Kitchen staff has started cooking/plating.
- `READY`: Dish/Order is ready for pickup or table service.
- `COMPLETED`: Delivered/served to guest; triggers **idempotent loyalty points accrual** if a customer profile is linked and order is settled.
- `CANCELLED`: Cancelled with mandatory reason and actor audit. If the order had already reached `ACCEPTED` or `PREPARING`, the system creates an auditable `RETURN_REVERSAL` movement in the inventory ledger if stock reversal is requested.

### Allowed Transitions
| Current State | Allowed Next States |
| :--- | :--- |
| `NEW` | `ACCEPTED`, `CANCELLED` |
| `ACCEPTED` | `PREPARING`, `CANCELLED` |
| `PREPARING` | `READY`, `CANCELLED` |
| `READY` | `COMPLETED`, `CANCELLED` |
| `COMPLETED` | *(Terminal State)* |
| `CANCELLED` | *(Terminal State)* |

Any attempt to jump backwards (e.g., `COMPLETED → NEW` or `NEW → COMPLETED` directly) is rejected on the server with HTTP `400 Bad Request` (`INVALID_STATE_TRANSITION`).

---

## 5. Indian GST & Monetary Engine (Integer Paise)

All monetary amounts across the database, API, and frontend calculations are represented in **integer paise** (`₹1.00 = 100 paise`).

### Tax Modes Supported per Restaurant
1. **`TAX_EXCLUSIVE` (Default Casual Dining — 5% GST)**:
   - Taxable Subtotal = Base Items + Modifiers - Discounts + Service Charge + Packaging Charge
   - `CGST = round(Taxable Subtotal * (cgstRateBps / 10000))` (Default 2.5% = 250 bps)
   - `SGST = round(Taxable Subtotal * (sgstRateBps / 10000))` (Default 2.5% = 250 bps)
2. **`TAX_INCLUSIVE` (Café / QSR MRP Mode)**:
   - Item prices already include GST; CGST and SGST components are back-calculated for tax invoice reporting without increasing the guest total.
3. **`COMPOSITION_OR_EXEMPT` (GST Composition Scheme / Unregistered)**:
   - 0 paise CGST and 0 paise SGST charged on guest bills.

### Rupee Round-Off
When `enableRoundOff` is enabled in restaurant settings, the final bill is rounded to the nearest whole rupee (`100 paise`), and the exact `roundOffPaise` delta (`-49` to `+50` paise) is recorded transparently on the order.

---

## 6. Design System & Editorial Tokens

- **Background Primary**: `#FBF9F5` (Warm Alabaster)
- **Surface Primary**: `#FFFFFF` (Crisp Paper)
- **Surface Secondary**: `#F2EFE9` (Warm Stone)
- **Brand Primary**: `#0F291E` (Deep Forest Espresso)
- **Brand Secondary**: `#1C3F30` (Botanical Pine)
- **Brand Muted**: `#E6ECE8` (Sage Mist)
- **Accent Primary**: `#D97706` (Saffron Amber)
- **Accent Highlight**: `#84CC16` (Fresh Lime Leaf)
- **Semantic Status**:
  - Success: `#15803D`
  - Warning: `#B45309`
  - Error: `#B91C1C`
