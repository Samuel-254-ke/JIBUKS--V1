# 05 — Setup & Deployment

## 1. Prerequisites

- Node.js **≥ 18**
- npm
- PostgreSQL **15+** (local or Docker)
- For mobile: Expo Go app and/or Android Studio / Xcode
- Optional: Docker + Docker Compose for backend + DB

---

## 2. Port cheat sheet (important)

| Source | Port |
|--------|------|
| Backend `.env.example` | `4001` |
| Frontend `example.env` | `4001` |
| `server.js` default (if env missing) | often `4400` |
| Docker Compose host→container | `4401 → 4400` |
| Production API | `https://jibuksapi.apbcafrica.com` |

**Always set `PORT` and `EXPO_PUBLIC_API_URL` explicitly** so frontend and backend agree.

---

## 3. Backend — local

```bash
cd backend
cp .env.example .env
# Edit .env — see section 5

npm install
npx prisma migrate deploy   # or: npx prisma migrate dev
npm run db:init             # optional init script
# optional: npm run seed / seed:* scripts

npm run start               # nodemon src/server.js
# or: npm run dev           # node src/server.js
```

Health check: `GET http://localhost:<PORT>/health`

### Backend scripts (`package.json`)

| Script | Command |
|--------|---------|
| `start` | `nodemon src/server.js` |
| `dev` | `node src/server.js` |
| `db:init` | `node scripts/initDb.js` |
| `seed` | `node prisma/seed.js` |
| `seed:assets` / `seed:liabilities` / `seed:equity` / `seed:revenue` / `seed:expenses` | CoA seeds |
| `seed:suppliers` | Kenyan suppliers |
| `seed:dashboard` | Admin dashboard seed |

---

## 4. Frontend — local

```bash
cd FRONTEND
npm install
cp example.env .env
# Set EXPO_PUBLIC_* — see section 5

npx expo start
# Press a / i / w for Android / iOS / web
# Or: npm run android | ios | web
# Cache issues: npx expo start -c
```

Physical devices must use your machine’s **LAN IP** in `EXPO_PUBLIC_API_URL`, not `localhost`.

---

## 5. Environment variables

### Backend (`backend/.env`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `PORT` | Yes | HTTP listen port |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Sign/verify JWTs |
| `LOCAL_NETWORK_IP` | Dev | CORS origins for device testing |
| `NODE_ENV` | Prod | `production` tightens CORS |
| `SMTP_HOST`, `SMTP_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `ADMIN_EMAIL` | For email OTP/invites | Nodemailer |
| `SMS_API_KEY`, `SMS_PARTNER_ID`, `SMS_SHORTCODE` | For SMS OTP | Celcom ISMS |
| `AUTH0_*` | Optional | Present in example; live routes are JWT-only |
| `POSTGRES_PASSWORD` | Docker | Used by Compose for DB |

Example `DATABASE_URL`:

```
postgresql://postgres:PASSWORD@localhost:5432/jibuks_dev
```

### Frontend (`FRONTEND/.env`)

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | Full API base including `/api` (preferred) |
| `EXPO_PUBLIC_LOCAL_IP` | LAN IP for physical devices |
| `EXPO_PUBLIC_API_PORT` | Backend port if constructing URL |

Example:

```
EXPO_PUBLIC_LOCAL_IP=192.168.1.100
EXPO_PUBLIC_API_PORT=4001
EXPO_PUBLIC_API_URL=http://192.168.1.100:4001/api
```

Production URL is also configured in `FRONTEND/app.json` extras for EAS builds.

---

## 6. Docker Compose

Root file: `docker-compose.yml`

| Service | Image / build | Ports |
|---------|---------------|-------|
| `backend` | `backend/dockerfile` | `4401:4400` |
| `database` | `postgres:15-alpine` | internal; volume `postgres_data` |

```bash
# Root .env must define POSTGRES_PASSWORD
docker compose up -d --build
```

Compose overrides `DATABASE_URL` to:

```
postgresql://postgres:${POSTGRES_PASSWORD}@database:5432/jibuks
```

Backend depends on DB healthcheck (`pg_ready`).

---

## 7. Database operations

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
npx prisma studio
```

New tenants from **register** receive seeded chart of accounts, categories, VAT, suppliers, and item types via auth registration flow / accounting seed helpers.

---

## 8. Production notes

| Topic | Detail |
|-------|--------|
| API host | `https://jibuksapi.apbcafrica.com` |
| Web mention | `https://jibuks.apbcafrica.com` (CORS allowlist) |
| CORS | Production allowlist in `app.js`; mobile may send `Origin: null` (allowed) |
| Uploads | Served from `/uploads`; ensure volume persistence in deploy |
| CI | `.github/workflows/deploy.yaml` |
| Secrets | Never commit real `.env`; rotate `JWT_SECRET` and DB passwords |

### Hardening checklist (recommended)

- [ ] Add JWT to `/api/cheques/*`
- [ ] Restrict or remove `GET /api/users/all` for non-admins
- [ ] Enable `express-rate-limit` on auth routes
- [ ] Align documented vs actual listen ports
- [ ] Remove unused Auth0/passport code or wire it deliberately
- [ ] Add refresh-token revocation if session security requires it

---

## 9. Smoke test checklist

1. `GET /health` → `OK`
2. `POST /api/auth/register` with FAMILY or BUSINESS → tokens returned
3. `GET /api/auth/me` with Bearer token → user + `tenantType`
4. `GET /api/accounts` → seeded CoA
5. Expo app login → lands on `/(tabs)` or `/business-tabs` as expected
6. Create income/expense or invoice → journal lines appear (Prisma Studio)

---

## 10. Troubleshooting

| Symptom | Likely cause |
|---------|--------------|
| App cannot reach API on phone | Using `localhost`; need LAN IP + firewall open on port |
| CORS errors on web | Origin not in allowlist / wrong `NODE_ENV` |
| JWT invalid | Mismatched `JWT_SECRET` or expired token |
| Empty CoA | Seed failed; re-run account seed or register fresh tenant |
| Prisma errors | Migrations not applied; regenerate client |
| Port in use | Change `PORT` in `.env` and update Expo env |

---

## 11. Related docs

- [System overview](./01-SYSTEM_OVERVIEW.md)
- [API reference](./02-BACKEND_API.md)
- [Frontend guide](./03-FRONTEND.md)
- [Database schema](./04-DATABASE.md)
- Admin OpenAPI: `backend/docs/admin-dashboard.openapi.yaml`
- Postman: `backend/Jibuks_Admin_APIs.postman_collection.json`
