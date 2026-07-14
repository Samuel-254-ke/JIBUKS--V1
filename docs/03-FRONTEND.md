# 03 — Frontend Guide

**Location:** `FRONTEND/`  
**Package name:** `frontend` (app / Android id references `com.apbc.jibuksapp`)  
**Nature:** Cross-platform mobile app (iOS / Android / Web via Expo), not a separate Next.js web SPA.

---

## 1. Tech stack

| Layer | Choice |
|-------|--------|
| React Native | 0.81.5 |
| React | 19.1.0 |
| Expo | ~54.0.32 (New Architecture) |
| Routing | Expo Router ~6.0.22 — entry `expo-router/entry` |
| Language | TypeScript (strict) |
| HTTP | `fetch` singleton `apiService` |
| Storage | AsyncStorage |
| UI extras | Image, ImagePicker, LinearGradient, Print, Sharing, Haptics, DateTimePicker, Picker, Toast |
| Animation | Reanimated, Gesture Handler |
| Builds | EAS (`eas.json`: development / preview / production / apk-test) |
| Experiments | `typedRoutes`, `reactCompiler` |

**Scripts:** `npm start` → `expo start`; also `android`, `ios`, `web`, `lint`.

Path alias: `@/*` → project root (`tsconfig.json`).

---

## 2. Directory structure

```
FRONTEND/
├── app/                      # File-based routes
│   ├── _layout.tsx           # Root stack, AuthProvider, route guard
│   ├── (tabs)/               # Family bottom tabs
│   ├── business-tabs/        # Business onboarding + dashboard + sales
│   ├── reports/              # P&L, balance sheet, account details
│   ├── fixed-assets/
│   └── lending/
├── components/               # Auth gate, FAB, themed helpers
├── constants/                # Colors, fonts, toast config
├── contexts/                 # AuthContext, AccountsContext
├── hooks/                    # Theme, inactivity timer
├── services/api.ts           # Entire API client (~1480 lines)
├── types/family.ts
├── utils/                    # Auth routing, logout, toast, account mapping
├── assets/
├── docs/                     # Feature markdown (income, dashboard, …)
├── app.json / eas.json
├── env.example / example.env
└── purchases.tsx             # Orphan — NOT under app/ (not a live route)
```

Feature UI is mostly **screen-local** `StyleSheet`s; there is not a large shared component library.

---

## 3. Routing & screens

Routing is file-based. Initial route: **`slideshow`**.

### Auth navigation guard

`AuthNavigationGuard` in `app/_layout.tsx`:

- Unauthenticated users → public routes only; else redirect to `/login`
- Authenticated users → bounced off public auth screens to tenant home

Home routing (`utils/authRouting.ts`):

| Condition | Destination |
|-----------|-------------|
| `tenantType === BUSINESS` | `/business-tabs` |
| `FAMILY` with named family | `/(tabs)` |
| `FAMILY` without setup | `/family-setup` |
| Else | `/welcome` (or `/account-type` from welcome CTA) |

### Public routes

| Route | Purpose |
|-------|---------|
| `/slideshow` | First-launch onboarding slides |
| `/auth` | Auth landing CTAs |
| `/login` | Email/password login |
| `/signup` | Registration |
| `/forgot-password` | Request OTP |
| `/verify-otp` | Verify OTP |
| `/reset-password` | Set new password |
| `/password-reset-success` | Success |

### Post-auth / onboarding

| Route | Purpose |
|-------|---------|
| `/welcome` | Post-login welcome |
| `/account-type` | Business / Family / Both |
| `/family-setup` | Create family profile |
| `/add-family-member` | Add/invite member |
| `/invite-success`, `/member-added-success` | Success |
| `/income-sources`, `/spending-categories` | Preferences |
| `/monthly-budgets`, `/budget-categories`, `/edit-budget`, `/add-budget-category` | Budgets |
| `/financial-goals`, `/add-saving-goals`, `/goal-detail`, `/add-savings`, `/add-to-goal`, `/goal-success` | Goals |
| `/connect-mobile-money` | Mobile money connect UI |

### Family tabs — `/(tabs)`

| Tab | Purpose |
|-----|---------|
| `/(tabs)/` (index) | Family home + FAB |
| `/(tabs)/analytics` | Activity feed |
| `/(tabs)/goals` | Goals |
| `/(tabs)/community` | Records / reports hub |
| `/(tabs)/explore` | More / settings |
| `/(tabs)/transactions` | Cheque registry (extra) |

Tab labels (typical): Home · Activity · Goals · Reports · More. Accent: active `#fe9900`, inactive `#122f8a`.

### Family feature screens (selected)

| Route | Purpose |
|-------|---------|
| `/family-settings`, `/edit-family-profile`, `/edit-member-permissions`, `/member-details` | Members & permissions |
| `/groups`, `/create-group`, `/group-detail`, `/group-members`, `/add-group-members`, `/group-activity`, `/contribute-group` | Chama |
| `/income`, `/add-income`, `/expenses`, `/add-expense`, `/transfer`, `/accounts`, `/manage` | Cashflow & CoA |
| `/reports`, `/reports/profit-loss`, `/reports/balance-sheet`, `/reports/account-details` | Reports |
| `/budget-alerts`, `/budget-history` | Budget monitoring |
| `/household-assets`, `/fixed-assets`, `/fixed-assets/add` | Assets |
| `/banking`, `/write-cheque`, `/pending-cheques`, `/cheque-details`, `/deposit-cheque` | Banking |
| `/lending`, `/add-loan`, `/repay-loan` | Lending |

### Business screens

| Route | Purpose |
|-------|---------|
| `/business-tabs` | Router: onboarding vs dashboard (`businessOnboardingComplete` flag) |
| `/business-tabs/business-onboarding` | Start |
| `/business-tabs/contact-information` | Contact step |
| `/business-tabs/financial-setup` | Finance step |
| `/business-tabs/tax-and-invoice` | Tax/invoice prefs |
| `/business-tabs/business-onboarding-success` | Done |
| `/business-tabs/business-dashboard` | Business home |
| `/business-tabs/more-business` | More menu |
| `/business-tabs/sales/*` | customers, invoices, cash-sale, payments, credit-notes |

### Sales / purchases / inventory (business accounting)

| Area | Routes |
|------|--------|
| AR | `/customers`, `/create-invoice`, `/invoices`, `/receipt`, `/credit-memo`, `/sales-order` |
| AP | `/vendors`, `/add-supplier`, `/vendor-profile`, `/pay-supplier`, `/supplier-bill` |
| Purchasing | `/new-purchase`, `/cash-purchase`, `/purchase-order`, `/bill-entry`, `/debit-note`, `/expenses-and-bills` |
| Stock | `/inventory`, `/inventory-detail`, `/new-inventory-item`, `/inventory-valuation`, `/item-history`, `/stock-adjustment`, `/stock-adjustment-bulk`, `/stock-transfer`, `/receive-stock`, `/cogs-report` |

Many screens are auto-discovered by Expo Router even when not every path is listed in `_layout.tsx`.

---

## 4. State management

| Mechanism | Role |
|-----------|------|
| `AuthContext` | `user`, `isAuthenticated`, login/register/logout, session restore |
| `AccountsContext` | Chart of accounts + balances, `refreshAccounts` |
| Local `useState` / `useEffect` | Per-screen fetching |
| AsyncStorage | Tokens, `lastActiveAt`, `businessOnboardingComplete` |

Providers in `app/_layout.tsx`: `AuthProvider` → `AccountsProvider` → Navigation `ThemeProvider`.

---

## 5. API client (`services/api.ts`)

### Base URL resolution (priority)

1. `EXPO_PUBLIC_API_URL` (or `app.json` → `extra.eas.EXPO_PUBLIC_API_URL`)
2. Else platform defaults:
   - Android emulator: `http://10.0.2.2:{PORT}/api`
   - Android device: `http://{LOCAL_IP}:{PORT}/api`
   - iOS simulator: `http://localhost:{PORT}/api`
   - Web: `http://localhost:{PORT}/api`

Code defaults historically: `LOCAL_IP=192.168.1.69`, `API_PORT=4400` — prefer env files to align with backend `4001` or Docker `4401`.

Production URL in `app.json`: `https://jibuksapi.apbcafrica.com/api`

### Auth

Every authenticated call sends:

```http
Authorization: Bearer <authToken>
```

JSON requests set `Content-Type: application/json`. Multipart `FormData` omits that header so the boundary is set correctly.

Helpers: `get`, `post`, `put`, `delete`; errors thrown as `{ error: string }`.

### Method map (by domain)

| Domain | Methods |
|--------|---------|
| Auth | `login`, `register`, `getCurrentUser`, `refreshToken`, `logout`, `forgotPassword`, `verifyOtp`, `resetPassword` |
| Family | `getFamily`, `updateFamily`, `addFamilyMember`, `getFamilySettings`, member role/permissions/remove, leave/delete family, `updateFamilyProfile`, dashboard stats |
| Goals | `createGoal`, `getGoals`, `getGoal`, `contributeToGoal` |
| Budgets | `getFamilyBudgets`, `createFamilyBudget`, `updateFamilyBudget`, `deleteFamilyBudget`, `saveFamilyBudgets` |
| Groups | CRUD + contribute + activity + members |
| Transactions / categories | create/list/stats; categories; payment methods |
| Accounts | list, get, create, update, delete, mapping, seed, balances, payment-eligible, account transactions |
| Reports | trial balance, P&L, cash flow, balance sheet, summary, monthly trend, category analysis, analytics |
| Business | `getBusinessDashboard` → `GET /dashboard/business` |
| Customers / invoices | Full CRUD + payments + unpaid |
| Vendors / purchases | List/create + payments |
| Inventory | items, valuation, adjustments, transfer, receive |
| Bank / cheques | deposits, cheques CRUD, clear/void, summary |
| Lending | dashboard, issue, repay, write-off |
| Fixed assets | list, create, depreciate, dispose |
| VAT | CRUD rates |
| Media | `getImageUrl(path)` |

Screens call `apiService` directly — no React Query/SWR layer.

---

## 6. Auth & session

```
slideshow → auth / login / signup
         → tokens saved (AsyncStorage)
         → AuthContext.user set
         → AuthNavigationGuard / welcome
         → getAuthenticatedHomeRoute(tenantType)
```

| Storage key | Content |
|-------------|---------|
| `authToken` | Access JWT |
| `refreshToken` | Refresh JWT |
| `lastActiveAt` | Background session clock |
| `businessOnboardingComplete` | `'true'` after business setup |

| Protection | Behavior |
|------------|----------|
| Route guard | Public allowlist |
| Boot | If token present → `GET /auth/me`; fail → clear tokens |
| Idle | `useInactivityTimer` — **5 minutes** → logout |
| Background | Away **≥ 10 minutes** → logout on resume |

Password reset: forgot → OTP → reset → success.  
Google login button on login UI is a **stub** (not wired).

Logout: `POST /auth/logout` then clear tokens (`confirmAndLogout` helper).

---

## 7. Forms & validation

No Formik/RHF/Zod. Pattern: controlled inputs + manual checks + `showToast` / `Alert.alert`.

Uploads via `expo-image-picker` + `FormData` (avatars, vendor logos, etc.).

---

## 8. Styling & brand

- Dominant: React Native `StyleSheet.create`
- Recurring colors: deep navy/blue (`#122f8a`, `#1e3a8a`), gold/amber (`#FFAA00`, `#f59e0b`), orange CTA (`#fe9900`)
- Gradients via `expo-linear-gradient`
- Fonts: Inria Serif + Inter loaded globally
- `constants/theme.ts` exists but most screens use local tokens

No Tailwind / NativeWind / CSS Modules.

---

## 9. Key user flows

| Flow | Steps |
|------|--------|
| First open | Slideshow → Auth → Signup/Login |
| Family first-time | Welcome → account type → family setup → optional members/budgets/goals → `/(tabs)` |
| Family daily | Home + FAB (savings, transfer, income, expense) |
| Business first-time | Onboarding wizard → flag → dashboard |
| Business daily | Dashboard → sales / purchases / stock / reports |
| Password reset | Forgot → OTP → reset |
| Session expiry | Idle 5m or background 10m → login |

---

## 10. Types

There is **no shared backend/frontend package**. Types live in:

- `FRONTEND/services/api.ts` — User, Account, Transaction, auth DTOs, …
- `FRONTEND/types/family.ts` — Family/dashboard interfaces

Align conceptually with Prisma enums (`FAMILY`/`BUSINESS`, roles, account types, transaction types). Complex payloads often typed as `any`.

Feature contracts also documented under `FRONTEND/docs/API_CONTRACTS.md` and related guides.

---

## 11. How to run

```bash
cd FRONTEND
npm install
# Copy example.env → .env and set:
# EXPO_PUBLIC_API_URL=http://YOUR_LAN_IP:4001/api
# EXPO_PUBLIC_LOCAL_IP=YOUR_LAN_IP
# EXPO_PUBLIC_API_PORT=4001

npx expo start
# i | a | w — or npm run android / ios / web
# Clear cache: npx expo start -c
```

Prerequisites: Node ≥ 18, Expo Go or emulator/simulator, backend reachable on the same LAN (for physical devices).

See also [05-SETUP_AND_DEPLOYMENT.md](./05-SETUP_AND_DEPLOYMENT.md).
