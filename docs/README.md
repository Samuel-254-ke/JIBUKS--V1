# JiBUks System Documentation

**Version:** 1.0.0  
**Last updated:** July 2026  
**Purpose:** Canonical reference for developers maintaining or extending JiBUks.

---

## Documentation map

| Document | Contents |
|----------|----------|
| [01 — System Overview](./01-SYSTEM_OVERVIEW.md) | Product purpose, architecture, tech stack, domain concepts, security model |
| [02 — Backend API Reference](./02-BACKEND_API.md) | Every mounted HTTP endpoint, auth, request/response shapes |
| [03 — Frontend Guide](./03-FRONTEND.md) | Expo app structure, routes, auth, API client, user flows |
| [04 — Database Schema](./04-DATABASE.md) | Prisma models, enums, relationships, accounting spine |
| [05 — Setup & Deployment](./05-SETUP_AND_DEPLOYMENT.md) | Local runbook, Docker, env vars, seeds, production notes |

---

## Quick facts

| Item | Value |
|------|--------|
| Product | Multi-tenant family finance + small-business accounting (Kenya-oriented) |
| Backend | Node.js, Express 4, Prisma, PostgreSQL |
| Frontend | React Native 0.81, Expo 54, Expo Router |
| API base (local) | `http://localhost:4001/api` (see port notes in Setup) |
| API base (prod) | `https://jibuksapi.apbcafrica.com/api` |
| Auth | JWT Bearer (`Authorization: Bearer <token>`) |
| Source of truth for schema | `backend/prisma/schema.prisma` |
| Source of truth for route mounts | `backend/src/app.js` |
| Frontend API client | `FRONTEND/services/api.ts` |

---

## Related / older docs

These remain useful for feature-specific history; prefer this folder for the current system contract:

- `FRONTEND/docs/` — feature notes (income, dashboard, family settings, business onboarding)
- `backend/docs/admin-dashboard.openapi.yaml` — Super Admin dashboard OpenAPI
- `backend/Jibuks_Admin_APIs.postman_collection.json` — Admin Postman collection
- `.gemini/`, `.agent/` — historical implementation notes (may be outdated)
