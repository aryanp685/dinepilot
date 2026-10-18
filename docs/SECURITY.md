# DinePilot Security & Multi-Tenant Isolation Model (`docs/SECURITY.md`)

## 1. Multi-Tenant Isolation Strategy
1. **Server-Derived Tenant Context**:
   - The active `restaurantId` is derived on the backend from the authenticated user's verified `memberships` record (using header `x-restaurant-id` only if the user holds an active, verified `Membership` for that exact `restaurantId`).
   - Any attempt to pass another restaurant's ID in URL params, query strings, or body payloads is either ignored in favor of `req.tenant.restaurantId` or rejected with HTTP `403 Forbidden` (`CROSS_TENANT_ACCESS_DENIED`).
2. **Compound Database Queries**:
   - Every repository/service query on tenant resources scopes by `{ _id: resourceId, restaurantId: req.tenant.restaurantId }`.

---

## 2. Role-Based Access Control (RBAC) Permission Matrix

| Capability | OWNER | MANAGER | CASHIER | KITCHEN | WAITER | PLATFORM_ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| View Dashboard Overview | Yes | Yes | Yes | No | Yes | Platform Scope |
| Create / Update Orders | Yes | Yes | Yes | Status Only | Yes | No |
| Verify Payments / Refunds | Yes | Yes | Yes | No | No | No |
| Kitchen Display (`/kitchen`) | Yes | Yes | No | Yes | Yes | No |
| Edit Menu & Pricing | Yes | Yes | No | No | No | No |
| View / Record Inventory | Yes | Yes | No | View/Waste | No | No |
| Edit Recipes & Costing | Yes | Yes | No | No | No | No |
| Profitability & AI Copilot | Yes | Yes | No | No | No | No |
| Tables & Reservations | Yes | Yes | Yes | No | Yes | No |
| Loyalty & Customers | Yes | Yes | Yes | No | Yes | No |
| Manage Staff & Roles | Yes | Invite Only | No | No | No | No |
| Restaurant Settings & GST | Yes | No | No | No | No | No |
| Billing & Subscriptions | Yes | No | No | No | No | Yes |
| Platform Admin Console | No | No | No | No | No | **Yes (Exclusive)** |

*Note: Platform Admin privilege (`user.isPlatformAdmin === true`) is stored on the `User` record and can never be self-assigned through registration or tenant role updates.*

---

## 3. Authentication, Cookies & Session Security
- Passwords hashed with `bcryptjs` (cost factor 10).
- Authentication tokens issued as signed JWTs stored in `HttpOnly`, `SameSite=Lax`, `Secure` (in production) cookies (`dp_session`), with fallback Bearer token support for API integration tests.
- Socket.IO handshakes verify the session cookie/token before allowing a socket to join `restaurant:<restaurantId>` or `kitchen:<restaurantId>` rooms.

---

## 4. Public QR & Payment Anti-Abuse Controls
- **Non-Guessable Public Tokens**: Guest order tracking uses a 128-bit random hex `publicOrderToken` (`ord_...`). Internal MongoDB ObjectIds are never used in public URLs.
- **Server-Side Price Recalculation**: The public order endpoint ignores any price or tax numbers sent by the client and recalculates item base prices, modifier deltas, packaging fees, CGST, SGST, and rupee round-off from authoritative database records.
- **No Trust in Client Payment Claims**: A guest clicking "I have paid via UPI" sets `paymentStatus = PENDING_VERIFICATION`. Only an authorized `OWNER`, `MANAGER`, or `CASHIER` (or a verified HMAC-SHA256 gateway webhook) can transition `paymentStatus` to `PAID`.
- **NoSQL Injection & Input Sanitization**: All incoming payloads are validated with strict `Zod` schemas; string inputs and query parameters strip `$` and `.` operator keys.
