# DinePilot Database Schema & Policies (`docs/DATABASE.md`)

## 1. Monetary & Time Representation
- **Monetary fields**: Stored as integer paise (`Number` integer, e.g., `₹240.00` = `24000`).
- **Timestamps**: Stored as UTC `Date` objects (`createdAt`, `updatedAt`) with display and daily boundary bucketing in restaurant timezone (`Asia/Kolkata` default).
- **Tenant Isolation**: Every tenant-scoped collection includes `restaurantId: ObjectId` indexed as the leading key of compound indexes.

---

## 2. Core Collections & Indexes

### 1. `users`
- Fields: `email` (unique, lowercase), `name`, `phone`, `passwordHash`, `isPlatformAdmin` (boolean, default `false`), `isActive` (boolean), `lastLoginAt`, `passwordResetTokenHash`, `passwordResetExpiresAt`.
- Indexes: `{ email: 1 }` (unique).

### 2. `restaurants`
- Fields: `name`, `slug` (unique), `city`, `state`, `country`, `address`, `phone`, `email`, `currency` (`INR`), `timezone` (`Asia/Kolkata`), `gstin`, `fssaiNumber`, `upiVpa`, `qrThemePreset` (`botanical` | `midnight` | `terracotta` | `nordic`), `isDemo` (boolean), `settings` (tax mode, CGST/SGST bps, service charge bps, packaging charge paise, round-off toggle, operating hours, reservation slot rules, allow guest running table KOTs).
- Indexes: `{ slug: 1 }` (unique).

### 3. `memberships`
- Fields: `userId`, `restaurantId`, `role` (`OWNER` | `MANAGER` | `CASHIER` | `KITCHEN` | `WAITER`), `isActive`.
- Indexes: `{ userId: 1, restaurantId: 1 }` (unique), `{ restaurantId: 1, role: 1 }`.

### 4. `subscriptions`
- Fields: `restaurantId` (unique), `plan` (`STARTER` | `GROWTH` | `SCALE`), `status` (`ACTIVE` | `TRIALING` | `PAST_DUE` | `CANCELLED`), `pricePaise`, `billingCycle`, `currentPeriodStart`, `currentPeriodEnd`, `entitlements` (AI copilot, multi-KOT, loyalty, max tables).
- Indexes: `{ restaurantId: 1 }` (unique).

### 5. `menuCategories`
- Fields: `restaurantId`, `name`, `description`, `sortOrder`, `isActive`.
- Indexes: `{ restaurantId: 1, sortOrder: 1 }`.

### 6. `modifierGroups`
- Fields: `restaurantId`, `name`, `selectionType` (`SINGLE` | `MULTIPLE`), `isRequired`, `minSelect`, `maxSelect`, `options` (`[{ id, name, priceDeltaPaise, recipeMultiplier, isAvailable }]`).
- Indexes: `{ restaurantId: 1 }`.

### 7. `menuItems`
- Fields: `restaurantId`, `categoryId`, `name`, `description`, `pricePaise`, `packagingCostPaise`, `imageUrl`, `dietaryType` (`VEG` | `NON_VEG` | `EGG` | `JAIN` | `VEGAN`), `spiceLevel` (`MILD` | `MEDIUM` | `HOT` | `SAOJI_FIERY`), `prepTimeMinutes`, `isAvailable`, `isPopular`, `modifierGroupIds`, `tags`.
- Indexes: `{ restaurantId: 1, categoryId: 1, isAvailable: 1 }`, `{ restaurantId: 1, name: 1 }`.

### 8. `restaurantTables`
- Fields: `restaurantId`, `label` (e.g., `"T-01"`), `zone` (`"Indoor AC"`, `"Garden Courtyard"`, `"Family Lounge"`), `capacity`, `publicToken` (cryptographic random token), `sessionPin` (4-digit rotating PIN), `isActive`, `activeOrderId` (nullable ref to active running order).
- Indexes: `{ restaurantId: 1, label: 1 }` (unique), `{ publicToken: 1 }` (unique).

### 9. `orders`
- Fields: `restaurantId`, `orderNumber` (e.g., `"DP-1042"`), `publicOrderToken` (unique cryptographic token), `idempotencyKey`, `orderType` (`DINE_IN` | `TAKEAWAY` | `DELIVERY`), `source` (`QR_GUEST` | `STAFF_POS`), `tableId`, `tableLabelSnapshot`, `customerId`, `customerName`, `customerPhone`, `kotBatches` (`[{ kotNumber, createdAt, createdBy, notes }]`), `items` (`[{ menuItemId, nameSnapshot, dietarySnapshot, quantity, unitBasePricePaise, modifiers: [{ groupName, optionName, priceDeltaPaise, recipeMultiplier }], lineSubtotalPaise, packagingCostPaise, kotNumber, notes }]`), `subtotalPaise`, `discountPaise`, `discountCode`, `packagingTotalPaise`, `serviceChargePaise`, `taxModeSnapshot`, `cgstPaise`, `sgstPaise`, `roundOffPaise`, `totalPaise`, `status` (`NEW` | `ACCEPTED` | `PREPARING` | `READY` | `COMPLETED` | `CANCELLED`), `paymentStatus` (`UNPAID` | `PENDING_VERIFICATION` | `PAID` | `REFUNDED`), `paymentMethod` (`UPI` | `CASH` | `CARD` | `UNSPECIFIED`), `inventoryConsumed` (boolean), `loyaltyProcessed` (boolean), `customerNotes`, `cancelReason`, `acceptedAt`, `completedAt`, `cancelledAt`.
- Indexes:
  - `{ restaurantId: 1, createdAt: -1 }`
  - `{ restaurantId: 1, status: 1, createdAt: -1 }`
  - `{ restaurantId: 1, orderNumber: 1 }` (unique)
  - `{ publicOrderToken: 1 }` (unique)
  - `{ restaurantId: 1, idempotencyKey: 1 }` (unique sparse)

### 10. `orderStatusEvents`
- Fields: `restaurantId`, `orderId`, `fromStatus`, `toStatus`, `actorUserId`, `actorRole`, `actorName`, `note`, `createdAt`.
- Indexes: `{ orderId: 1, createdAt: 1 }`, `{ restaurantId: 1, createdAt: -1 }`.

### 11. `payments` & `paymentEvents`
- `payments`: `restaurantId`, `orderId`, `amountPaise`, `currency`, `method` (`UPI` | `CASH` | `CARD`), `status` (`INITIATED` | `PENDING_VERIFICATION` | `PAID` | `REFUNDED` | `FAILED`), `upiReference`, `gatewayReference`, `verifiedByUserId`, `verifiedAt`, `idempotencyKey`.
- `paymentEvents`: `restaurantId`, `paymentId`, `orderId`, `eventType`, `amountPaise`, `actorUserId`, `metadata`, `createdAt`.
- Indexes: `{ restaurantId: 1, orderId: 1 }`, `{ restaurantId: 1, idempotencyKey: 1 }` (unique sparse).

### 12. `suppliers` & `ingredients`
- `suppliers`: `restaurantId`, `name`, `contactName`, `phone`, `email`, `gstin`, `category`.
- `ingredients`: `restaurantId`, `name`, `sku`, `category`, `unit` (`g` | `kg` | `ml` | `l` | `pcs`), `currentStock`, `reorderThreshold`, `costPerUnitPaise`, `usableYieldPercent` (`1` to `100`, default `100`), `supplierId`, `storageNotes`, `expirationDate`, `lastUpdatedAt`.
- Indexes: `{ restaurantId: 1, name: 1 }` (unique), `{ restaurantId: 1, expirationDate: 1 }`.

### 13. `recipes`
- Fields: `restaurantId`, `menuItemId` (unique per restaurant), `yieldServings` (default `1`), `prepInstructions`, `components` (`[{ ingredientId, quantity, unit, notes }]`).
- Indexes: `{ restaurantId: 1, menuItemId: 1 }` (unique).

### 14. `inventoryMovements`
- Fields: `restaurantId`, `ingredientId`, `type` (`PURCHASE_RECEIVED` | `MANUAL_ADJUSTMENT` | `SPOILAGE` | `WASTE` | `RECIPE_CONSUMPTION` | `STOCK_CORRECTION` | `RETURN_REVERSAL`), `quantityDelta` (in ingredient's base unit), `previousStock`, `newStock`, `unitCostPaiseSnapshot`, `totalCostPaise`, `referenceOrderId`, `idempotencyKey`, `reason`, `performedByUserId`, `createdAt`.
- Indexes: `{ restaurantId: 1, ingredientId: 1, createdAt: -1 }`, `{ restaurantId: 1, type: 1, createdAt: -1 }`, `{ restaurantId: 1, idempotencyKey: 1 }` (unique sparse).

### 15. `customers`, `loyaltyAccounts`, `loyaltyTransactions`, `loyaltyRewards`
- `customers`: `restaurantId`, `name`, `phone`, `email`, `marketingConsent` (boolean), `consentUpdatedAt`, `dietaryPreferences`, `visitCount`, `totalSpentPaise`, `lastVisitAt`, `notes`, `feedbacks` (`[{ orderId, rating, comment, createdAt }]`).
- `loyaltyAccounts`: `restaurantId`, `customerId` (unique per restaurant), `pointsBalance`, `lifetimePointsEarned`, `lifetimePointsRedeemed`, `tier` (`BRONZE` | `SILVER` | `GOLD` | `PLATINUM`).
- `loyaltyTransactions`: `restaurantId`, `customerId`, `loyaltyAccountId`, `type` (`EARN` | `REDEEM` | `REVERSAL` | `BONUS`), `pointsDelta`, `balanceAfter`, `orderId`, `rewardId`, `idempotencyKey`, `description`, `createdByUserId`, `createdAt`.
- `loyaltyRewards`: `restaurantId`, `name`, `description`, `pointsCost`, `discountValuePaise`, `isActive`.

### 16. `reservations`
- Fields: `restaurantId`, `reservationCode`, `customerName`, `customerPhone`, `customerEmail`, `date` (`YYYY-MM-DD`), `timeSlot` (`HH:mm`), `durationMinutes`, `partySize`, `tableId`, `status` (`CONFIRMED` | `SEATED` | `COMPLETED` | `CANCELLED` | `NO_SHOW`), `specialRequests`, `createdByUserId`.
- Indexes: `{ restaurantId: 1, date: 1, timeSlot: 1 }`, `{ restaurantId: 1, tableId: 1, date: 1, timeSlot: 1 }`.

### 17. `staffInvitations`, `notifications`, `auditLogs`, `reportJobs`, `aiInsightLogs`
- Auditable operational records scoped by `restaurantId` (or platform-wide for `auditLogs` when `actorIsPlatformAdmin` is true).

---

## 3. Transactions, Concurrency & Data Retention
- **Transactions & Atomic Guards**: MongoDB replica set sessions (`mongoose.startSession()`) and atomic conditional updates (`findOneAndUpdate` with stock/status preconditions + unique `idempotencyKey` indexes) protect order acceptance, inventory deduction, loyalty points issuance, and reservation booking against race conditions and duplicate retries.
- **Retention & Backups**:
  - Financial records (`orders`, `payments`, `inventoryMovements`, `auditLogs`) are retained for 8 years per Indian GST statutory audit requirements.
  - Customer PII supports opt-out and anonymization upon verified erasure request.
