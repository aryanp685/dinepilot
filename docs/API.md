# DinePilot REST API Specification (`docs/API.md`)

Base URL: `/api/v1`  
Machine-readable OpenAPI 3.1 Specification endpoint: `GET /api/v1/openapi.json`  
Health Check endpoint: `GET /api/v1/health`

## 1. Standard Response Envelope

All endpoints return a consistent JSON structure:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 120
  }
}
```

Error responses use appropriate HTTP status codes (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`):

```json
{
  "success": false,
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot transition order from NEW directly to COMPLETED",
    "details": []
  }
}
```

---

## 2. Endpoint Reference

### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` — Register restaurant owner + create initial restaurant, membership, subscription, and default settings.
- `POST /api/v1/auth/login` — Authenticate user, set HTTP-only session cookie, and return user + active memberships.
- `POST /api/v1/auth/logout` — Clear session cookie and record audit log.
- `POST /api/v1/auth/forgot-password` — Generate time-bound password reset token.
- `POST /api/v1/auth/reset-password` — Reset password using valid token.
- `GET /api/v1/auth/me` — Return current authenticated user, active restaurant context, role permissions, and subscription entitlements.

### Restaurant & Settings (`/api/v1/restaurant`)
- `GET /api/v1/restaurant` — Get active restaurant profile & subscription.
- `PATCH /api/v1/restaurant` — Update restaurant branding, contact, GSTIN, FSSAI, UPI VPA, and QR theme preset.
- `GET /api/v1/restaurant/settings` — Get GST tax mode, CGST/SGST rates, service charge, packaging fees, round-off, and reservation rules.
- `PATCH /api/v1/restaurant/settings` — Update operational and tax settings.

### Menu & Modifiers (`/api/v1/menu`)
- `GET /api/v1/menu` — List categories, modifier groups, and menu items for the authenticated restaurant.
- `POST /api/v1/menu/categories` — Create menu category.
- `PATCH /api/v1/menu/categories/:id` — Update category.
- `POST /api/v1/menu/modifiers` — Create modifier group (e.g., Half/Full portion, Jain prep, Add-ons).
- `POST /api/v1/menu` — Create menu item with integer paise pricing, dietary type, spice level, and modifiers.
- `PATCH /api/v1/menu/:id` — Update menu item or toggle availability (`isAvailable`).
- `DELETE /api/v1/menu/:id` — Soft/hard delete menu item with audit log.

### Public Guest QR Ordering (`/api/v1/public`)
- `GET /api/v1/public/restaurants/:slug/menu` — Public menu, categories, modifiers, restaurant branding, and active theme preset (never leaks private IDs or financials).
- `GET /api/v1/public/restaurants/:slug/tables/:publicToken` — Verify signed/random table token, return table context and any active running table order summary.
- `POST /api/v1/public/restaurants/:slug/orders` — Submit guest order (or append new KOT batch to running table order). Recalculates all prices, modifiers, GST, and round-off on the server.
- `GET /api/v1/public/orders/:publicOrderToken` — Public order tracking with status timeline, KOT batches, itemized GST breakdown, and UPI deep link instructions.
- `POST /api/v1/public/orders/:publicOrderToken/payment-claim` — Guest submits UPI payment verification request (`PENDING_VERIFICATION` — never marks `PAID` directly).
- `POST /api/v1/public/orders/:publicOrderToken/feedback` — Guest submits rating & review for completed order.

### Orders & KDS (`/api/v1/orders`)
- `GET /api/v1/orders` — Filterable, paginated orders list (`status`, `orderType`, `search`, `dateFrom`, `dateTo`).
- `POST /api/v1/orders` — Staff POS order creation or running-table KOT addition.
- `GET /api/v1/orders/:id` — Detailed order with `orderStatusEvents` and `payments`.
- `PATCH /api/v1/orders/:id/status` — Enforce state machine (`NEW → ACCEPTED → PREPARING → READY → COMPLETED / CANCELLED`), trigger idempotent recipe stock deduction on `ACCEPTED`, and broadcast via Socket.IO.

### Inventory & Waste Intelligence (`/api/v1/inventory`)
- `GET /api/v1/inventory/ingredients` — List ingredients with stock status, yield %, cost, supplier, and expiry alerts.
- `POST /api/v1/inventory/ingredients` — Create ingredient.
- `PATCH /api/v1/inventory/ingredients/:id` — Update ingredient metadata, threshold, yield %, or cost.
- `GET /api/v1/inventory/suppliers` — List suppliers.
- `POST /api/v1/inventory/suppliers` — Create supplier.
- `POST /api/v1/inventory/movements` — Record stock movement (`PURCHASE_RECEIVED`, `MANUAL_ADJUSTMENT`, `SPOILAGE`, `WASTE`, `STOCK_CORRECTION`, `RETURN_REVERSAL`) in an auditable transaction.
- `GET /api/v1/inventory/movements` — Paginated movement ledger.
- `GET /api/v1/inventory/alerts` — Low stock and expiring ingredient alerts with reorder velocity suggestions.
- `GET /api/v1/inventory/waste-report` — Waste quantity, waste cost in paise, top wasted ingredients, and trend breakdown.

### Recipes & Profitability (`/api/v1/recipes` & `/api/v1/analytics`)
- `GET /api/v1/recipes` — List recipes with yield-adjusted ingredient cost, packaging cost, selling price, gross profit paise, and food cost %.
- `POST /api/v1/recipes` — Create or upsert recipe for a menu item with unit-compatibility validation.
- `PATCH /api/v1/recipes/:id` — Update recipe components.
- `GET /api/v1/analytics/menu-profitability` — Menu Engineering Matrix (Stars, Plowhorses, Puzzles, Dogs) calculated from real orders and yield-adjusted recipes.
- `GET /api/v1/analytics/overview` — Gross sales, net sales, completed orders, AOV, food cost %, waste cost, repeat customer rate, and period comparison.
- `GET /api/v1/analytics/sales` — Hourly and daily sales time-series and category breakdown.
- `GET /api/v1/analytics/products` — Top and bottom performing products.
- `GET /api/v1/analytics/food-cost` — Theoretical vs. actual food cost and margin breakdown.
- `GET /api/v1/analytics/waste` — Waste analytics and spoilage drivers.
- `GET /api/v1/analytics/export` — Downloadable CSV report export (`sales`, `profitability`, `inventory`, `waste`).

### AI Business Copilot (`/api/v1/ai`)
- `POST /api/v1/ai/insights` — Generate structured business intelligence insights or answer natural-language operational questions over deterministic restaurant metrics.
- `GET /api/v1/ai/insights/history` — Retrieve historical generated insights and questions.

### Tables & Reservations (`/api/v1/tables` & `/api/v1/reservations`)
- `GET /api/v1/tables` — List tables with live occupancy, active order summary, and QR token URLs.
- `POST /api/v1/tables` — Create table with cryptographic QR token.
- `PATCH /api/v1/tables/:id` — Update table or rotate QR token/PIN.
- `GET /api/v1/reservations` — List reservations filtered by date and status.
- `POST /api/v1/reservations` — Create reservation with concurrency-safe time-slot & table conflict prevention.
- `PATCH /api/v1/reservations/:id` — Update reservation status (`CONFIRMED`, `SEATED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).

### Loyalty, Customers, Staff, Payments & Platform Admin
- `GET /api/v1/loyalty/customers` — Customer directory with consent flags, visit frequency, and loyalty tiers.
- `POST /api/v1/loyalty/customers` — Create/update customer profile with explicit marketing consent.
- `GET /api/v1/loyalty/transactions` — Auditable points ledger (`EARN`, `REDEEM`, `REVERSAL`, `BONUS`).
- `GET /api/v1/loyalty/rewards` & `POST /api/v1/loyalty/rewards` — Configure loyalty rewards.
- `POST /api/v1/loyalty/redeem` — Redeem points against a reward with atomic balance check.
- `GET /api/v1/staff` & `POST /api/v1/staff` & `PATCH /api/v1/staff/:id` — Manage staff roles and invitations.
- `POST /api/v1/payments/verify` — Staff verification of pending UPI/Cash/Card payments or refunds.
- `POST /api/v1/payments/webhook` — HMAC-SHA256 verified payment gateway webhook handler.
- `GET /api/v1/notifications` & `PATCH /api/v1/notifications/:id/read` — In-app operational notifications.
- `GET /api/v1/platform/*` — Platform Admin endpoints (`overview`, `restaurants`, `users`, `subscriptions`, `audit-logs`).
