# DinePilot

Multi-tenant restaurant operations, recipe costing, menu profitability, and QR ordering platform built with Express, Mongoose, Socket.IO, and Next.js 14.

## Surfaces

- **Marketing & Auth**: `/`, `/features`, `/pricing`, `/about`, `/contact`, `/privacy`, `/terms`, `/login`, `/register`
- **Restaurant Dashboard**: `/app/overview`, `/app/orders`, `/app/menu`, `/app/inventory`, `/app/recipes`, `/app/analytics`, `/app/ai-insights`, `/app/tables`, `/app/reservations`, `/app/customers`, `/app/loyalty`, `/app/staff`, `/app/reports`, `/app/settings`, `/app/billing`
- **Guest QR Ordering**: `/menu/:restaurantSlug`, `/menu/:restaurantSlug/cart`, `/order/:publicOrderToken`
- **Kitchen Display System**: `/kitchen`
- **Platform Admin**: `/platform/overview`, `/platform/restaurants`, `/platform/users`, `/platform/subscriptions`, `/platform/audit-logs`

## Demo Accounts

Password for all demo accounts: `DinePilot@2026`

| Role | Email | Default Route |
|---|---|---|
| Owner (Saoji & Spice Kitchen, Nagpur) | `owner@dinepilot.in` | `/app/overview` |
| Kitchen KDS | `chef@dinepilot.in` | `/kitchen` |
| Floor Manager | `manager@dinepilot.in` | `/app/orders` |
| Owner (Zero Mile Roasters) | `roasters@dinepilot.in` | `/app/overview` |
| Platform Admin | `admin@dinepilot.in` | `/platform/overview` |

## Development & Verification

```bash
npm install
npm test
npm run typecheck
npm run build
npm run seed
```
