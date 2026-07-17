# 01 — System Overview

## 1. What is JiBUks?

**JiBUks** is a multi-tenant mobile application for:

1. **Families** — household income/expenses, budgets, savings goals, member permissions, chama/groups, banking & cheques, fixed assets, informal lending.
2. **Small businesses** — double-entry chart of accounts, customers & invoices (AR), vendors & purchases (AP), inventory (WAC), bank operations, VAT, fixed assets, financial reports (P&L, balance sheet, trial balance, cash flow).

A separate **Super Admin** surface manages tenants, platform analytics, messaging, and internal tasks.

Tenants are typed as `FAMILY` or `BUSINESS`. Users belong to one tenant; almost all data is scoped by `tenantId` from the JWT.

---

## 2. High-level architecture

```
┌─────────────────────────────────────┐
│  Expo / React Native (FRONTEND/)    │
│  Expo Router · AuthContext · api.ts │
└─────────────────┬───────────────────┘
                  │ HTTPS / HTTP
                  │ Authorization: Bearer <JWT>
                  ▼
┌─────────────────────────────────────┐
│  Express API (backend/src/)         │
│  Helmet · CORS · Morgan · Multer    │
│  Routes → Controllers → Services    │
│  Prisma Client                      │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  PostgreSQL (Prisma schema)         │
│  Journals, subledgers, inventory…   │
└─────────────────────────────────────┘

External:
  • Nodemailer (SMTP / Gmail) — invites & password OTP
  • Celcom Africa ISMS — SMS OTP
```

There are **no WebSockets**. Admin “active users” uses a simple `PATCH /api/users/me/presence` heartbeat.

---

## 3. Tech stack

### Backend

| Layer | Technology |
|-------|------------|
| Runtime | Node.js (ES modules, `"type": "module"`) |
| Framework | Express 4.21 |
| ORM | Prisma 5.x (client may resolve to 6.x in package.json) |
| Database | PostgreSQL 15 |
| Auth | `jsonwebtoken` + `bcrypt` |
| Uploads | Multer → `backend/public/uploads` (served at `/uploads/*`) |
| Security | Helmet, CORS |
| Email | Nodemailer |
| SMS | Celcom Africa ISMS |

### Frontend

| Layer | Technology |
|-------|------------|
| App | React Native 0.81.5 + React 19 |
| SDK | Expo ~54 (New Architecture) |
| Routing | Expo Router ~6 (file-based under `FRONTEND/app/`) |
| State | React Context (`AuthContext`, `AccountsContext`) + local screen state |
| HTTP | Native `fetch` via `services/api.ts` |
| Storage | AsyncStorage (tokens, onboarding flags, inactivity) |
| Fonts | Inria Serif, Inter |
| Builds | EAS (`eas.json`) |

**Not used:** Redux, Zustand, React Query, Axios, Tailwind/NativeWind, Formik/Yup/Zod, shared monorepo types package.

---

## 4. Repository layout

```
JIBUKS--V1/
├── FRONTEND/                 # Expo mobile app
│   ├── app/                  # Screens = routes
│   ├── components/
│   ├── contexts/
│   ├── services/api.ts       # All HTTP client methods
│   ├── types/
│   └── docs/                 # Feature-level notes
├── backend/
│   ├── src/
│   │   ├── app.js            # Mounts all routes
│   │   ├── server.js         # Listen + Prisma disconnect
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/         # Accounting, inventory, lending, email, SMS, admin
│   │   └── middleware/       # JWT, Multer upload
│   ├── prisma/schema.prisma
│   ├── scripts/              # CoA / category / admin seeds
│   └── docs/                 # Admin OpenAPI
├── docs/                     # ← This documentation set
├── docker-compose.yml        # Backend + Postgres
└── README.md
```

---

## 5. Domain concepts (must-know)

### Multi-tenancy

- Every family or business is a `Tenant`.
- JWT payload includes `tenantId` and `role`.
- Controllers filter with `where: { tenantId: req.user.tenantId }`.

### Double-entry accounting

Operational events (sales, purchases, deposits, transfers, asset purchase, loan issue/repay, cheque clear, etc.) create balanced **`Journal` + `JournalLine`** rows.

Reports (`/api/reports/*`) read journals. The family-facing `Transaction` model is a higher-level event log that also posts journals when appropriate.

### Kenya-first chart of accounts

Seeded CoA includes cash, banks, M-Pesa, SACCOs, AR/AP, VAT 16%, system tags (`CASH`, `BANK`, `AR`, `AP`, `MPESA`) for reliable lookups without hardcoded IDs.

### Inventory (WAC)

Purchases update **weighted average cost**. Sales post revenue + **COGS** via inventory accounting services.

### Cheques

Uncleared cheques are tracked until clear/void. Backend cheque routes currently accept `tenantId` in query/body and do **not** require JWT (security caveat — see API doc).

### Chama / groups

Family `Group` + contributions are a lighter social-savings model alongside the ledger.

### Platform admin

Separate `Admin` table and admin JWT (`isAdmin: true`). Routes under `/api/admin/*`, `/api/tasks`, tenant management, messaging, dashboard analytics.

---

## 6. Authentication & authorization

| Audience | How | Middleware |
|----------|-----|------------|
| App users | Register/login → access JWT (24h) + refresh (7d) | `verifyJWT` |
| Super admins | Admin register/login → JWT with `isAdmin: true` | `verifyAdminJWT` |
| Public | Auth, health, root, static uploads | none |
| Cheques | Query/body `tenantId` only | **none** (insecure today) |

Password reset: OTP stored on user (≈15 min), delivered by email or SMS.

Logout is **client-side** (no refresh-token blacklist on the server).

Auth0 packages and `auth0Id` fields exist; **live auth routes are local JWT only**.

User roles (`Role` enum): `OWNER | ADMIN | PARENT | CHILD | MEMBER | SUPER_ADMIN`. Family screens also use JSON `permissions` on the user.

---

## 7. Frontend ↔ backend contract

| Concern | Approach |
|---------|----------|
| Base URL | `EXPO_PUBLIC_API_URL` or constructed from local IP + port + `/api` |
| Headers | `Authorization: Bearer <authToken>`; JSON or multipart FormData |
| Types | Duplicated in `api.ts` / `types/family.ts` — **no shared package** |
| Errors | Typically `{ error: string }` (+ `stack` in development) |

Production API URL is also baked into `FRONTEND/app.json` extras: `https://jibuksapi.apbcafrica.com/api`.

---

## 8. Integrations

| Integration | Status |
|-------------|--------|
| Email (SMTP) | Active — invitations & OTP |
| SMS (Celcom) | Active — OTP (`smsService.js`; env preferred, code has fallbacks) |
| Auth0 | Dependency / schema only — not mounted |
| M-Pesa Daraja / Stripe | **Not** payment-gateway integrated; M-Pesa appears as CoA / payment method |
| WebSockets | None |
| Rate limiting | `express-rate-limit` installed but **not applied** in `app.js` |

---

## 9. Known caveats for maintainers

1. **Port mismatch:** `.env.example` / frontend examples often use `4001`; `server.js` default may be `4400`; Docker maps `4401→4400`. Align env when testing.
2. **`GET /api/users/all`** returns all users with only a normal user JWT — treat as a security bug if locking down.
3. **Cheques API unauthenticated** — prefer adding JWT before production hardening.
4. **`assets.js` route file is not mounted**; use `/api/fixed-assets`.
5. **`platformAuthController` is unused.**
6. Inventory may define **duplicate `POST /adjust` handlers** — last registration wins.
7. Root README still mentions OAuth2 in places; trust this docs set + `app.js` over older marketing text.

---

## 10. Where to go next

- Full endpoint catalogue → [02-BACKEND_API.md](./02-BACKEND_API.md)
- Screens & client methods → [03-FRONTEND.md](./03-FRONTEND.md)
- Models & ER concepts → [04-DATABASE.md](./04-DATABASE.md)
- Run / deploy → [05-SETUP_AND_DEPLOYMENT.md](./05-SETUP_AND_DEPLOYMENT.md)
