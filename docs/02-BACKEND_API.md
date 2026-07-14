# 02 — Backend API Reference

Complete catalogue of **mounted** HTTP endpoints as of July 2026.

| Item | Value |
|------|--------|
| Mount file | `backend/src/app.js` |
| Default error body | `{ "error": "message" }` |
| Auth header | `Authorization: Bearer <accessToken>` |
| JSON limit | 10 MB |
| Uploads | Multipart fields noted per route; files under `/uploads/<filename>` |

### Auth legend

| Label | Meaning |
|-------|---------|
| **Public** | No JWT |
| **User JWT** | `verifyJWT` — `req.user`: `id`, `email`, `tenantId`, `role`, … |
| **Admin JWT** | `verifyAdminJWT` — token must include `isAdmin: true` → `req.admin` |
| **Tenant query** | No JWT; caller passes `tenantId` (cheques only) |

---

## Table of contents

1. [System](#1-system)
2. [Auth](#2-auth--apiauth)
3. [Users](#3-users--apiusers)
4. [Family](#4-family--apifamily)
5. [Transactions](#5-transactions--apitransactions)
6. [Categories](#6-categories--apicategories)
7. [Payment methods](#7-payment-methods--apipayment-methods)
8. [Goals](#8-goals--apigoals)
9. [Dashboard](#9-dashboard--apidashboard)
10. [Business](#10-business--apibusiness)
11. [Chart of accounts](#11-chart-of-accounts--apiaccounts)
12. [Reports](#12-reports--apireports)
13. [Vendors](#13-vendors--apivendors)
14. [Purchases](#14-purchases--apipurchases)
15. [Inventory](#15-inventory--apiinventory)
16. [Bank](#16-bank--apibank)
17. [Fixed assets](#17-fixed-assets--apifixed-assets)
18. [Customers](#18-customers--apicustomers)
19. [Invoices](#19-invoices--apiinvoices)
20. [Cheques](#20-cheques--apicheques)
21. [Transfers](#21-transfers--apitransfers)
22. [Lending](#22-lending--apilending)
23. [VAT rates](#23-vat-rates--apivat-rates)
24. [Admin auth](#24-admin-auth--apiadmin)
25. [Tenant management](#25-tenant-management--apiadminmanagementtenants)
26. [Admin messaging](#26-admin-messaging--apiadminmessaging)
27. [Admin dashboard](#27-admin-dashboard--apiadmindashboard)
28. [Admin tasks](#28-admin-tasks--apitasks)

---

## 1. System

| Method | Path | Auth | Response |
|--------|------|------|----------|
| `GET` | `/` | Public | `{ ok, message }` |
| `GET` | `/health` | Public | `{ status, message, timestamp, network }` |
| `GET` | `/uploads/*` | Public | Static file |

---

## 2. Auth — `/api/auth`

**Files:** `routes/auth.js` → `controllers/authController.js`

| Method | Path | Auth | Body | Success |
|--------|------|------|------|---------|
| `POST` | `/api/auth/register` | Public | `firstName`, `lastName`, `email`, `phone?`, `password`, `confirmPassword`, `tenantSlug?`, `tenantType?` (`FAMILY`\|`BUSINESS`) | `201` `{ accessToken, refreshToken, user }` — seeds CoA/categories/VAT/etc. for new tenant |
| `POST` | `/api/auth/login` | Public | `email`, `password` | `{ accessToken, refreshToken, user }` |
| `POST` | `/api/auth/refresh-token` | Public | `refreshToken` | `{ accessToken }` |
| `POST` | `/api/auth/logout` | Public | — | `{ message }` (no server blacklist) |
| `POST` | `/api/auth/forgot-password` | Public | `email?`, `phone?`, `deliveryMethod?` (`sms`\|email) | `{ message }` |
| `POST` | `/api/auth/verify-otp` | Public | `email`, `otp` | `{ message }` |
| `POST` | `/api/auth/reset-password` | Public | `email`, `otp`, `newPassword` | `{ message }` |
| `GET` | `/api/auth/me` | User JWT | — | Current user + `tenantType` |

**Login `user` shape (typical):** `{ id, email, name, tenantId, role, tenantType }`

---

## 3. Users — `/api/users`

**Files:** `routes/users.js` → `userController.js` — all **User JWT**

| Method | Path | Body / notes | Success |
|--------|------|--------------|---------|
| `PATCH` | `/api/users/me/presence` | Heartbeat for admin “active now” | `{ ok, lastSeenAt }` |
| `GET` | `/api/users/` | Users for caller’s tenant | User[] |
| `GET` | `/api/users/all` | **All users DB-wide** (no admin gate) | User[] |
| `POST` | `/api/users/` | `name?`, `email`, `password`, `tenantId?` | `201` user |

---

## 4. Family — `/api/family`

**Files:** `family.js` + family controllers — **User JWT**  
Uploads: `profileImage` on add member; `avatar` on profile update.

| Method | Path | Body / params | Notes |
|--------|------|---------------|-------|
| `GET` | `/api/family/` | — | Tenant + members |
| `PUT` | `/api/family/` | `name?`, `metadata?` | Update tenant |
| `POST` | `/api/family/members` | multipart: `name`, `email`, `password`, `role`, `age?` + `profileImage?` | `201` |
| `POST` | `/api/family/goals` | `name`, `targetAmount`, `targetDate?`, `monthlyContribution?`, `assignedUserId?`, `category?` | Also see `/api/goals` |
| `GET` | `/api/family/goals` | — | Goals |
| `POST` | `/api/family/budgets` | `budgets: [{ category, amount }]` | Batch save |
| `GET` | `/api/family/budgets` | — | Budgets + spend enrichment |
| `GET` | `/api/family/settings` | — | Settings payload |
| `GET` | `/api/family/dashboard` | — | Family dashboard |
| `PUT` | `/api/family/profile` | multipart `name?` + `avatar?` | Profile |
| `GET` | `/api/family/members/:memberId` | — | Member detail |
| `PUT` | `/api/family/members/:memberId/permissions` | `permissions` (JSON) | |
| `PUT` | `/api/family/members/:memberId/role` | `role` | Owner-gated |
| `DELETE` | `/api/family/members/:memberId` | — | Remove member |
| `DELETE` | `/api/family/leave` | — | Leave tenant |
| `DELETE` | `/api/family/` | — | Delete family (owner) |
| `GET` | `/api/family/groups` | — | Chamas |
| `POST` | `/api/family/groups` | `name`, `description?`, `target?`, `type?`, `color?`, `frequency?`, `contributionAmount?`, `treasurerName?`, `treasurerPhone?` | `201` |
| `GET` | `/api/family/groups/:id` | — | Group + members |
| `PUT` | `/api/family/groups/:id` | Partial group fields | |
| `DELETE` | `/api/family/groups/:id` | — | |
| `POST` | `/api/family/groups/:id/contribute` | `amount`, `method?`, `note?` | `201` |
| `GET` | `/api/family/groups/:id/activity` | — | Contributions |
| `POST` | `/api/family/groups/:id/members` | `userId`, `role?` | `201` |
| `DELETE` | `/api/family/groups/:id/members/:memberId` | — | |

---

## 5. Transactions — `/api/transactions`

**File:** `routes/transactions.js` — **User JWT**

| Method | Path | Query / body | Notes |
|--------|------|--------------|-------|
| `GET` | `/api/transactions/` | `type`, `startDate`, `endDate`, `category`, `limit=50` | List |
| `GET` | `/api/transactions/stats` | `startDate`, `endDate` | Aggregates |
| `POST` | `/api/transactions/` | See below | `201` + journal |
| `GET` | `/api/transactions/:id` | — | One |
| `PUT` | `/api/transactions/:id` | Partial fields | |
| `DELETE` | `/api/transactions/:id` | — | |

**Create body:**  
`type` (`INCOME`\|`EXPENSE`\|`TRANSFER`\|`LIABILITY_INC`\|`LIABILITY_DEC`\|`DEPOSIT`), `amount`, `category?`, `description?`, `date?`, `paymentMethod?`, `notes?`, `debitAccountId?`, `creditAccountId?`, `accountId?`, `splits?`, `payee?`, `taxTreatment?`, `vendorId?`

---

## 6. Categories — `/api/categories`

**User JWT**

| Method | Path | Body / query |
|--------|------|--------------|
| `GET` | `/api/categories/` | `?type=` |
| `POST` | `/api/categories/` | `name`, `type`, `icon?`, `color?` |
| `PUT` | `/api/categories/:id` | `name?`, `type?`, `icon?`, `color?` |
| `DELETE` | `/api/categories/:id` | — |
| `POST` | `/api/categories/seed` | Seed defaults |

---

## 7. Payment methods — `/api/payment-methods`

**User JWT**

| Method | Path | Body |
|--------|------|------|
| `GET` | `/api/payment-methods/` | — |
| `POST` | `/api/payment-methods/` | `name`, `type`, `details?` |
| `PUT` | `/api/payment-methods/:id` | `name?`, `type?`, `details?`, `isActive?` |
| `DELETE` | `/api/payment-methods/:id` | Soft/delete |
| `POST` | `/api/payment-methods/seed` | Seed defaults |

---

## 8. Goals — `/api/goals`

**User JWT** — standalone goals API (family also exposes goals under `/api/family/goals`)

| Method | Path | Body |
|--------|------|------|
| `GET` | `/api/goals/` | List + progress |
| `GET` | `/api/goals/:id` | Detail |
| `POST` | `/api/goals/` | `name`, `description?`, `targetAmount`, `currentAmount?`, `targetDate?`, `monthlyContribution?`, `assignedUserId?` |
| `POST` | `/api/goals/:id/contribute` | `amount`, `description?` — may post journal |
| `PUT` | `/api/goals/:id` | Goal fields |
| `DELETE` | `/api/goals/:id` | |

---

## 9. Dashboard — `/api/dashboard`

**User JWT** — `dashboardController.js`

| Method | Path | Response (summary) |
|--------|------|-------------------|
| `GET` | `/api/dashboard/business` | `{ summary: { revenue, expenses, netIncome, cashBankBalance, arBalance }, counts, recentActivity, period }` |

---

## 10. Business — `/api/business`

**User JWT** — `businessController.js`

| Method | Path | Body |
|--------|------|------|
| `GET` | `/api/business/profile` | Tenant + users |
| `PUT` | `/api/business/profile` | `name?`, `industry?`, `salesType?`, `businessSize?`, `currency?` |
| `GET` | `/api/business/onboarding-status` | `{ hasName, hasIndustry, hasSalesType, isCompleted }` |
| `PUT` | `/api/business/onboarding` | `businessName?`, `industry?`, `salesType?`, `address?`, `phoneNumber?`, `email?`, `currency?`, `yearStart?`, `vatChoice?`, `styleChoice?` |
| `PUT` | `/api/business/contact` | `phone?`, `website?`, `physicalAddress?`, `email?` |
| `PUT` | `/api/business/tax-settings` | `kraPin?`, `isTaxRegistered?`, `taxType?` |
| `GET` | `/api/business/staff` | Staff users |
| `POST` | `/api/business/staff` | `name`, `email`, `password`, `role?` |

---

## 11. Chart of accounts — `/api/accounts`

**User JWT**

| Method | Path | Query / body |
|--------|------|--------------|
| `GET` | `/api/accounts/` | `type?`, `includeBalances?`, `includeInactive?` |
| `GET` | `/api/accounts/payment-eligible` | Cash/bank eligible |
| `GET` | `/api/accounts/types` | Account type info |
| `GET` | `/api/accounts/mapping` | `category?`, `type?` |
| `GET` | `/api/accounts/:id` | Detail + balance |
| `POST` | `/api/accounts/` | `code`, `name`, `type`, `description?`, `parentId?`, `currency?`, `detailType?` |
| `PUT` | `/api/accounts/:id` | `name?`, `description?`, `isActive?`, `parentId?` |
| `DELETE` | `/api/accounts/:id` | Soft/hard rules for system accounts |
| `POST` | `/api/accounts/seed` | `force?`, `mode?` — owner/admin |
| `GET` | `/api/accounts/balances/summary` | Balances by type |

**Account `type` enum:** `ASSET | LIABILITY | EQUITY | INCOME | EXPENSE`

---

## 12. Reports — `/api/reports`

**User JWT** — backed by `accountingService`

| Method | Path | Query |
|--------|------|-------|
| `GET` | `/api/reports/trial-balance` | Date range as applicable |
| `GET` | `/api/reports/profit-loss` | `startDate`, `endDate` |
| `GET` | `/api/reports/cash-flow` | dates |
| `GET` | `/api/reports/balance-sheet` | as-of date |
| `GET` | `/api/reports/summary` | High-level summary |
| `GET` | `/api/reports/monthly-trend` | `months=6` |
| `GET` | `/api/reports/category-analysis` | Category breakdown |
| `GET` | `/api/reports/account-transactions/:accountId` | `limit`, `offset` |

---

## 13. Vendors — `/api/vendors`

**User JWT** — upload field `logo` on create/update

| Method | Path | Body / query |
|--------|------|--------------|
| `GET` | `/api/vendors/` | `active?`, `search?` |
| `GET` | `/api/vendors/:id` | Vendor + purchases summary |
| `POST` | `/api/vendors/` | `name`, `email?`, `phone?`, `address?`, `taxId?`, `paymentTerms?`, `tags?` + logo |
| `PUT` | `/api/vendors/:id` | Same + `isActive?` |
| `DELETE` | `/api/vendors/:id` | Deactivate/delete |
| `GET` | `/api/vendors/:id/statement` | `startDate?`, `endDate?` |

---

## 14. Purchases — `/api/purchases`

**User JWT** — upload `attachment` on create

| Method | Path | Body / query |
|--------|------|--------------|
| `GET` | `/api/purchases/` | `status?`, `vendorId?`, `startDate?`, `endDate?` |
| `GET` | `/api/purchases/status/unpaid` | Unpaid / partial |
| `GET` | `/api/purchases/:id` | Bill + items + payments |
| `POST` | `/api/purchases/` | See below — journals + stock |
| `PUT` | `/api/purchases/:id` | `billNumber?`, `dueDate?`, `notes?`, `status?` (limited if paid) |
| `DELETE` | `/api/purchases/:id` | If unpaid |
| `POST` | `/api/purchases/:id/payment` | `amount`, `paymentDate?`, `paymentMethod?`, `reference?`, `notes?`, `bankAccountId` |

**Create:** `vendorId?`, `billNumber?`, `purchaseDate?`, `dueDate?`, `items: [{ description, quantity, unitPrice, accountId?, inventoryItemId? }]`, `tax?`, `discount?`, `notes?`, `status?`, `apAccountId?` + file

---

## 15. Inventory — `/api/inventory`

**User JWT** — `inventory.js` + `inventoryService` / `inventoryAccountingService`

| Method | Path | Params / body |
|--------|------|---------------|
| `GET` | `/api/inventory/item-types` | ItemType[] |
| `GET` | `/api/inventory/` | `search`, `type`, `category`, `lowStock`, `page`, `limit`, `sortBy`, `sortOrder` |
| `GET` | `/api/inventory/products` | Similar filters, paginated |
| `GET` | `/api/inventory/alerts` | Low stock |
| `POST` | `/api/inventory/products` | Product fields + `initialQuantity?` |
| `GET` | `/api/inventory/products/:id` | Product + movements |
| `POST` | `/api/inventory/adjust` | `itemId`, `type`, `reason`, `quantity`, `unitCost?`, `notes?`, `reference?` |
| `GET` | `/api/inventory/transactions` | `page`, `limit`, `itemId` |
| `GET` | `/api/inventory/valuation/current` | Valuation snapshot |
| `GET` | `/api/inventory/catalog` | `search?`, `category?` — master catalog ≤20 |
| `POST` | `/api/inventory/credit-memo` | `invoiceId?`, `creditMemoNumber?`, `items`, `date?` |
| `POST` | `/api/inventory/physical-count` | `itemId`, `actualQuantity`, `notes?`, `date?` |
| `GET` | `/api/inventory/accounting/valuation` | Accounting valuation |
| `GET` | `/api/inventory/:itemId/history` | `startDate?`, `endDate?`, `limit?` |
| `GET` | `/api/inventory/cogs-report` | `startDate?`, `endDate?` |

> **Note:** `POST /adjust` may be defined twice in the route file; last registered handler wins.

---

## 16. Bank — `/api/bank`

**User JWT**

| Method | Path | Body / query |
|--------|------|--------------|
| `GET` | `/api/bank/transactions` | `bankAccountId?`, `type?`, `status?`, `reconciled?`, `startDate?`, `endDate?` |
| `POST` | `/api/bank/deposit` | `bankAccountId`, `amount`, `sourceAccountId`, `date?`, `reference?`, `description?`, `notes?` |
| `POST` | `/api/bank/cheque` | Payee, amount, bankAccountId, chequeNumber, … |
| `POST` | `/api/bank/transfer` | Bank-level transfer between bank accounts |
| `PUT` | `/api/bank/reconcile/:id` | `reconciled?` |
| `PUT` | `/api/bank/status/:id` | `status`: `PENDING`\|`CLEARED`\|`BOUNCED`\|`CANCELLED` |
| `GET` | `/api/bank/unreconciled` | `bankAccountId?` |
| `GET` | `/api/bank/statement` | `bankAccountId` required + dates |

---

## 17. Fixed assets — `/api/fixed-assets`

**User JWT** — journals via `accountingService`  
*(Legacy `routes/assets.js` is **not** mounted.)*

| Method | Path | Body |
|--------|------|------|
| `GET` | `/api/fixed-assets/` | `?status=` |
| `GET` | `/api/fixed-assets/accounts` | Asset-related CoA accounts |
| `GET` | `/api/fixed-assets/:id` | Detail |
| `POST` | `/api/fixed-assets/` | `name`, `category`, `assetAccountId`, `purchaseDate`, `purchasePrice`, + optional finance/warranty/depreciation fields |
| `POST` | `/api/fixed-assets/:id/depreciate` | `newValue` |
| `POST` | `/api/fixed-assets/:id/dispose` | Disposal price / account fields |

---

## 18. Customers — `/api/customers`

**User JWT**

| Method | Path | Query / body |
|--------|------|--------------|
| `GET` | `/api/customers/` | `active?`, `search?`, `businessType?`, `limit`, `offset` |
| `GET` | `/api/customers/:id` | |
| `POST` | `/api/customers/` | Customer fields (`name` required) |
| `PUT` | `/api/customers/:id` | Updatable fields |
| `DELETE` | `/api/customers/:id` | Soft delete typically |
| `GET` | `/api/customers/:id/statement` | `startDate?`, `endDate?` |
| `GET` | `/api/customers/:id/balance` | |
| `GET` | `/api/customers/:id/transactions` | `limit`, `offset`, `type?` |
| `GET` | `/api/customers/:id/analytics` | `period?` |

---

## 19. Invoices — `/api/invoices`

**User JWT**

| Method | Path | Body / query |
|--------|------|--------------|
| `GET` | `/api/invoices/` | `status?`, `customerId?` |
| `GET` | `/api/invoices/status/unpaid` | |
| `GET` | `/api/invoices/:id` | + balance |
| `POST` | `/api/invoices/` | `customerId`, `invoiceNumber?`, `invoiceDate?`, `dueDate?`, `items: [{ description, quantity, unitPrice, accountId?, inventoryItemId? }]`, `tax?`, `discount?`, `notes?`, `status?` |
| `PUT` | `/api/invoices/:id` | Limited header fields |
| `DELETE` | `/api/invoices/:id` | If unpaid |
| `POST` | `/api/invoices/:id/payment` | `amount`, `paymentDate?`, `paymentMethod?`, `bankAccountId?`, `reference?`, `notes?` |

Creating invoices posts AR journal / COGS when inventory lines are present.

---

## 20. Cheques — `/api/cheques`

**Auth: Tenant query** — no JWT. Scope via `tenantId` query or body.

| Method | Path | Params / body |
|--------|------|---------------|
| `GET` | `/api/cheques/pending` | `?tenantId=` |
| `GET` | `/api/cheques/all` | `?tenantId=` |
| `GET` | `/api/cheques/summary` | `?tenantId=` → counts, amounts, bank availability |
| `POST` | `/api/cheques/create` | `tenantId`, `chequeNumber`, `payee`, `amount`, `dueDate`, `bankAccountId`, `accountNumber?`, `purpose?`, `notes?`, `reference?` |
| `POST` | `/api/cheques/:id/clear` | `dateCleared?`, `clearedById?`, `tenantId` — posts journal |
| `POST` | `/api/cheques/:id/void` | void payload |
| `GET` | `/api/cheques/:id` | |

> Prefer securing these with User JWT in a future hardening pass.

---

## 21. Transfers — `/api/transfers`

**User JWT** — asset↔asset CoA transfers

| Method | Path | Body / query |
|--------|------|--------------|
| `POST` | `/api/transfers/` | `fromAccountId`, `toAccountId`, `amount`, `fee?`, `date?`, `reference?`, `description?` |
| `GET` | `/api/transfers/` | `startDate?`, `endDate?`, `limit?` |
| `GET` | `/api/transfers/:id` | |

---

## 22. Lending — `/api/lending`

**User JWT** — `lendingService.js`

| Method | Path | Body |
|--------|------|------|
| `GET` | `/api/lending/dashboard` | Loans dashboard |
| `POST` | `/api/lending/issue` | `borrowerName`, `amount`, `dueDate?`, `paidFromAccountId`, `notes?`, `phoneNumber?` |
| `POST` | `/api/lending/repay` | `loanId`, `amount`, `depositedToAccountId`, `date?` |
| `POST` | `/api/lending/:id/write-off` | Write-off |

---

## 23. VAT rates — `/api/vat-rates`

**User JWT**

| Method | Path | Body |
|--------|------|------|
| `GET` | `/api/vat-rates/` | Active rates |
| `GET` | `/api/vat-rates/:id` | |
| `POST` | `/api/vat-rates/` | `name`, `rate`, `code`, `description?`, `isActive?` |
| `PUT` | `/api/vat-rates/:id` | `name?`, `rate?`, `description?`, `isActive?` |
| `DELETE` | `/api/vat-rates/:id` | |

---

## 24. Admin auth — `/api/admin`

**Files:** `adminRoutes.js` → `adminController.js`

| Method | Path | Auth | Body |
|--------|------|------|------|
| `POST` | `/api/admin/register` | Public | `name`, `email`, `phone?`, `password`, `organization?` |
| `POST` | `/api/admin/login` | Public | `email`, `password` → `{ accessToken, refreshToken, admin }` |
| `POST` | `/api/admin/logout` | Admin JWT | |
| `GET` | `/api/admin/me` | Admin JWT | Admin profile |

---

## 25. Tenant management — `/api/admin/management/tenants`

**Admin JWT** (mounted with `verifyAdminJWT` in `app.js`)

| Method | Path | Body |
|--------|------|------|
| `GET` | `/api/admin/management/tenants/stats` | Platform stats |
| `GET` | `/api/admin/management/tenants/` | List (pagination/search in controller) |
| `GET` | `/api/admin/management/tenants/:id` | Detail |
| `PUT` | `/api/admin/management/tenants/:id` | `name?`, `slug?`, `tenantType?`, `ownerEmail?`, `metadata?` |
| `DELETE` | `/api/admin/management/tenants/:id` | |

---

## 26. Admin messaging — `/api/admin/messaging`

**Admin JWT**

| Method | Path | Body / query |
|--------|------|--------------|
| `GET` | `/api/admin/messaging/clients` | `page`, `limit`, `search`, `tenantId`, `status` → `{ data, meta }` |
| `GET` | `/api/admin/messaging/conversations` | `{ data: ConversationRow[] }` |
| `POST` | `/api/admin/messaging/conversations` | `{ clientId }` |
| `GET` | `/api/admin/messaging/conversations/:conversationId/messages` | `limit?`, `beforeId?` |
| `POST` | `/api/admin/messaging/conversations/:conversationId/messages` | `{ body, attachments? }` |
| `POST` | `/api/admin/messaging/conversations/:conversationId/read` | `{ success: true }` |

---

## 27. Admin dashboard — `/api/admin/dashboard`

**Admin JWT**  
Formal OpenAPI: `backend/docs/admin-dashboard.openapi.yaml`

| Method | Path | Query |
|--------|------|-------|
| `GET` | `/api/admin/dashboard/summary` | KPI cards |
| `GET` | `/api/admin/dashboard/active-sessions` | `{ count }` |
| `GET` | `/api/admin/dashboard/revenue-by-month` | `year?` |
| `GET` | `/api/admin/dashboard/recent-users` | |
| `GET` | `/api/admin/dashboard/analytics/traffic` | range |
| `GET` | `/api/admin/dashboard/analytics/kpis` | range |
| `GET` | `/api/admin/dashboard/analytics/referrers` | range |
| `GET` | `/api/admin/dashboard/analytics/devices` | range |

---

## 28. Admin tasks — `/api/tasks`

**Admin JWT** — `taskRoutes.js` → `taskController.js`

| Method | Path | Body / query |
|--------|------|--------------|
| `GET` | `/api/tasks/` | `page`, `pageSize`, `filter`, `status`, `priority`, `sort` |
| `POST` | `/api/tasks/` | `title`, `status?`, `label?`, `priority?`, `description?`, `dueDate?`, `assignee?` |
| `PATCH` | `/api/tasks/:id` | Partial |
| `DELETE` | `/api/tasks/:id` | |
| `POST` | `/api/tasks/bulk-delete` | `{ ids: number[] }` |
| `POST` | `/api/tasks/import` | Tasks payload |

---

## Services (business logic owners)

| Service | Path | Responsibility |
|---------|------|----------------|
| Accounting | `services/accountingService.js` | CoA seed, journals, TB/P&L/CF/BS, fixed assets, VAT/supplier seed |
| Inventory | `services/inventoryService.js` | Products, movements, adjustments |
| Inventory accounting | `services/inventoryAccountingService.js` | WAC, purchase/sale/return journals |
| Lending | `services/lendingService.js` | Issue / repay / write-off |
| Email | `services/emailService.js` | Nodemailer |
| SMS | `services/smsService.js` | Celcom ISMS |
| Admin dashboard | `services/adminDashboardService.js` | Platform KPIs |

---

## Middleware

| Middleware | File | Role |
|------------|------|------|
| `verifyJWT` | `middleware/auth.js` | User routes |
| `verifyAdminJWT` | `middleware/auth.js` | Admin routes |
| `upload` | `middleware/upload.js` | Images ≤5MB → `public/uploads` |

Validation is **inline** in handlers (no shared Zod/Joi layer).

---

## Not mounted / unused

| Item | Notes |
|------|--------|
| `routes/assets.js` | Use `/api/fixed-assets` |
| `platformAuthController.js` | Not wired in `app.js` |
| Auth0 OAuth routes | Mentioned in older README; not registered |

---

## Endpoint count

Roughly **150+** routes including health/root. For machine-readable admin dashboard contracts, see OpenAPI + Postman under `backend/docs/` and `backend/Jibuks_Admin_APIs.postman_collection.json`.
