# JiBUks - Family & Business Financial Management App

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB.svg)
![Expo](https://img.shields.io/badge/Expo-~54.0-000020.svg)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791.svg)

**A comprehensive mobile application for managing family finances and business accounting**

[Features](#features) • [Installation](#installation) • [Full docs](./docs/README.md) • [API reference](./docs/02-BACKEND_API.md)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Database Setup](#database-setup)
- [API Endpoints](#api-endpoints) → full catalogue in [`docs/`](./docs/README.md)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [System documentation](./docs/README.md)
- [Contributing](#contributing)

---

## 🎯 About

**JiBUks** is a full-stack mobile application designed to help families and small businesses manage their finances effectively. The app provides comprehensive tools for tracking income, expenses, budgets, goals, and business operations with multi-tenant support and real-time analytics.

### Key Capabilities
- 👨‍👩‍👧‍👦 **Family Financial Management**: Track household income, expenses, and shared budgets
- 💼 **Business Accounting**: Manage business transactions, inventory, and financial reports
- 📊 **Analytics Dashboard**: Real-time insights into spending patterns and financial health
- 🎯 **Goal Tracking**: Set and monitor financial goals with progress visualization
- 👥 **Multi-User Support**: Family members with role-based permissions
- 🔒 **Secure Authentication**: JWT-based auth (access + refresh tokens)

---

## ✨ Features

### Family Features
- ✅ Income & expense tracking
- ✅ Category-based budgeting
- ✅ Family member management with permissions
- ✅ Shared financial goals and dreams
- ✅ Mobile money integration
- ✅ Transaction history and analytics
- ✅ Monthly budget planning

### Business Features
- ✅ Business dashboard with daily summaries
- ✅ Cash and credit sales tracking
- ✅ Expense management
- ✅ Customer and supplier management
- ✅ Stock/inventory tracking
- ✅ Journal entries
- ✅ Financial reports
- ✅ Tax and invoice management

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React Native 0.81.5
- **Navigation**: Expo Router 6.0
- **UI Components**: React Native, Expo Vector Icons
- **State Management**: React Hooks, Context API
- **HTTP Client**: Fetch API with custom service layer
- **Platform**: Expo ~54.0 (iOS, Android, Web)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.21
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + bcrypt
- **Security**: Helmet, CORS, Rate Limiting
- **Email**: Nodemailer
- **File Upload**: Multer

### Database
- **DBMS**: PostgreSQL
- **ORM**: Prisma 5.22
- **Migrations**: Prisma Migrate
- **Multi-tenancy**: Tenant-based data isolation

---

## 📁 Project Structure

```
JIBUKS--V1/
├── FRONTEND/                    # React Native mobile app
│   ├── app/                     # Expo Router screens
│   │   ├── (tabs)/             # Tab navigation screens
│   │   │   ├── index.tsx       # Family dashboard
│   │   │   ├── analytics.tsx   # Analytics screen
│   │   │   ├── transactions.tsx
│   │   │   └── community.tsx
│   │   ├── business-tabs/      # Business section
│   │   │   ├── business-dashboard.tsx
│   │   │   ├── more-business.tsx
│   │   │   ├── business-onboarding.tsx
│   │   │   ├── contact-information.tsx
│   │   │   ├── financial-setup.tsx
│   │   │   └── tax-and-invoice.tsx
│   │   ├── _layout.tsx         # Root layout
│   │   ├── login.tsx
│   │   ├── signup.tsx
│   │   ├── add-expense.tsx
│   │   ├── add-income.tsx
│   │   ├── family-settings.tsx
│   │   └── ...
│   ├── components/             # Reusable components
│   │   ├── haptic-tab.tsx
│   │   ├── ParallaxScrollView.tsx
│   │   └── ...
│   ├── constants/              # App constants
│   │   ├── theme.ts
│   │   └── ToastConfig.tsx
│   ├── contexts/               # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/                  # Custom hooks
│   │   └── use-color-scheme.ts
│   ├── services/               # API services
│   │   └── api.ts
│   ├── utils/                  # Utility functions
│   ├── assets/                 # Images, fonts
│   ├── .env                    # Environment variables
│   └── package.json
│
├── backend/                     # Node.js Express API
│   ├── src/
│   │   ├── controllers/        # Route controllers
│   │   │   ├── authController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── transactionController.js
│   │   │   └── userController.js
│   │   ├── routes/             # API routes
│   │   │   ├── auth.js
│   │   │   ├── dashboard.js
│   │   │   ├── transactions.js
│   │   │   ├── categories.js
│   │   │   ├── paymentMethods.js
│   │   │   ├── budgets.js
│   │   │   ├── goals.js
│   │   │   └── users.js
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── services/           # Business logic
│   │   │   └── emailService.js
│   │   ├── db/                 # Database utilities
│   │   │   └── index.js
│   │   ├── app.js              # Express app setup
│   │   └── server.js           # Server entry point
│   ├── prisma/                 # Prisma schema & migrations
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── scripts/                # Utility scripts
│   │   ├── initDb.js
│   │   └── seedCategories.js
│   ├── .env                    # Environment variables
│   ├── .env.example
│   └── package.json
│
├── README.md                    # This file
├── docs/                        # Canonical system documentation
└── .gitignore
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: v9.0.0 or higher (comes with Node.js)
- **PostgreSQL**: v14.0 or higher ([Download](https://www.postgresql.org/download/))
- **Git**: For version control ([Download](https://git-scm.com/))
- **Expo CLI**: Install globally with `npm install -g expo-cli`
- **Mobile Device** or **Emulator**: 
  - iOS: Xcode (macOS only)
  - Android: Android Studio
  - Or use Expo Go app on physical device

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/JIBUKS--V1.git
cd JIBUKS--V1
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../FRONTEND
npm install
```

---

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE jibuks_dev;

# Exit psql
\q
```

### 2. Configure Database Connection

Create `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=4001
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/jibuks_dev
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email Configuration (for invitations)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=your-email@gmail.com

# Network Configuration
LOCAL_NETWORK_IP=192.168.1.X  # Your local IP address
```

### 3. Run Database Migrations

```bash
cd backend
npx prisma migrate dev --name initial_setup
```

### 4. Seed Default Categories (Optional)

```bash
npm run seed:categories
```

This will create default income and expense categories for all families.

---

## 🏃 Running Locally

### Backend Server

```bash
cd backend

# Development mode (with auto-reload)
npm run start

# Or production mode
npm run dev
```

The backend server will start on `http://localhost:4001`

**Expected Output:**
```
Server listening on port 4001
Environment: development
✅ Email server is ready to send messages
```

### Frontend App

#### Option 1: Using Expo Go (Recommended for Quick Testing)

```bash
cd FRONTEND

# Configure environment
cp example.env .env
```

Edit `FRONTEND/.env`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:4001/api
EXPO_PUBLIC_LOCAL_IP=YOUR_LOCAL_IP
```

**Find your local IP:**
- **Windows**: Run `ipconfig` and look for IPv4 Address
- **macOS/Linux**: Run `ifconfig | grep "inet " | grep -v 127.0.0.1`

```bash
# Start Expo development server
npx expo start
```

Scan the QR code with:
- **iOS**: Camera app
- **Android**: Expo Go app

#### Option 2: Using Emulator/Simulator

```bash
# For iOS (macOS only)
npx expo start --ios

# For Android
npx expo start --android

# For Web
npx expo start --web
```

---

## 🔌 API Endpoints

The partial list that used to live here is **outdated**. The complete, maintained API catalogue (150+ endpoints) is in:

**→ [`docs/02-BACKEND_API.md`](./docs/02-BACKEND_API.md)**

Quick entry points:

| Area | Base path | Auth |
|------|-----------|------|
| Auth | `/api/auth` | Public / JWT |
| Family | `/api/family` | User JWT |
| Transactions | `/api/transactions` | User JWT |
| Chart of accounts | `/api/accounts` | User JWT |
| Reports | `/api/reports` | User JWT |
| Customers / Invoices | `/api/customers`, `/api/invoices` | User JWT |
| Vendors / Purchases | `/api/vendors`, `/api/purchases` | User JWT |
| Inventory | `/api/inventory` | User JWT |
| Bank / Cheques | `/api/bank`, `/api/cheques` | JWT / tenant query |
| Admin | `/api/admin/*`, `/api/tasks` | Admin JWT |

Register is `POST /api/auth/register` (not `/signup`). Full request/response notes, admin OpenAPI, and Postman links are in the docs folder.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
# Server Configuration
PORT=4001

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# JWT Authentication
JWT_SECRET=your-secret-key-min-32-characters

# Email Service (for invitations)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
ADMIN_EMAIL=admin@example.com

# Network
LOCAL_NETWORK_IP=192.168.1.100

# Auth0 (Optional)
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_CALLBACK_URL=http://localhost:4001/auth/auth0/callback
```

### Frontend (`FRONTEND/.env`)

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://192.168.1.100:4001/api
EXPO_PUBLIC_LOCAL_IP=192.168.1.100

# Figma (Optional - for design access)
FIGMA_API_KEY=your-figma-api-key
```

---

## 🧪 Testing the Application

### 1. Create a Test Account

```bash
# Using curl
curl -X POST http://localhost:4001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "familyName": "Test Family"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 3. Test Protected Endpoints

```bash
# Get dashboard (replace TOKEN with your JWT)
curl -X GET http://localhost:4001/api/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🐛 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Find process using port 4001
# Windows
netstat -ano | findstr :4001

# macOS/Linux
lsof -i :4001

# Kill the process
# Windows
taskkill /PID <PID> /F

# macOS/Linux
kill -9 <PID>
```

**Database connection failed:**
- Ensure PostgreSQL is running
- Verify DATABASE_URL in `.env`
- Check database exists: `psql -U postgres -l`

**Migration errors:**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev --name fix_schema
```

### Frontend Issues

**Cannot connect to backend:**
- Verify backend is running on port 4001
- Check `EXPO_PUBLIC_API_URL` in `.env`
- Ensure your device/emulator is on the same network
- Try using your computer's IP address instead of localhost

**Expo app not loading:**
```bash
# Clear cache and restart
npx expo start -c
```

**Module not found errors:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 📱 Main Features Walkthrough

### Family Dashboard
- View total income, expenses, and balance
- See recent transactions
- Quick access to add income/expense
- Budget overview and goal progress

### Business Dashboard
- Daily summary (income, expenses, balance)
- Quick actions (Cash Sale, Credit Sale, Add Expense)
- Management grid (Customers, Suppliers, Stock, Reports, etc.)
- Recent activity feed

### Analytics
- Monthly/yearly spending trends
- Category-wise breakdown
- Income vs expense charts
- Budget utilization

### Family Settings
- Manage family members
- Set permissions (Admin, Member, Viewer)
- Edit family profile
- View family statistics

---

## 📚 System Documentation (canonical)

| Doc | Description |
|-----|-------------|
| **[docs/README.md](./docs/README.md)** | Documentation index |
| **[docs/01-SYSTEM_OVERVIEW.md](./docs/01-SYSTEM_OVERVIEW.md)** | Architecture, domain, security |
| **[docs/02-BACKEND_API.md](./docs/02-BACKEND_API.md)** | Every mounted HTTP endpoint |
| **[docs/03-FRONTEND.md](./docs/03-FRONTEND.md)** | Expo routes, auth, `api.ts` client |
| **[docs/04-DATABASE.md](./docs/04-DATABASE.md)** | Prisma models & relationships |
| **[docs/05-SETUP_AND_DEPLOYMENT.md](./docs/05-SETUP_AND_DEPLOYMENT.md)** | Local, Docker, env vars |

Also useful:

- **[backend/README.md](backend/README.md)** — backend package notes
- **[FRONTEND/docs/](FRONTEND/docs/)** — feature-specific guides (income, dashboard, family settings)
- **[backend/docs/admin-dashboard.openapi.yaml](backend/docs/admin-dashboard.openapi.yaml)** — Super Admin OpenAPI
- **[docs/cheque_integration_summary.md](./docs/cheque_integration_summary.md)** — cheque payment flow notes

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 👥 Authors

- **Development Team** - Initial work

---

## 🙏 Acknowledgments

- Expo team for the amazing framework
- React Native community
- PostgreSQL and Prisma teams

---

<div align="center">

**Built with ❤️ using React Native and Node.js**

[⬆ Back to Top](#jibuks---family--business-financial-management-app)

</div>
