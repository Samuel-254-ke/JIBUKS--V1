# Backend Category Seeding Update

## What Changed

The backend now automatically seeds **categories** (with `type`, `icon`, and `color` fields) when a new family is created, just like it does for the Chart of Accounts.

## Changes Made

### 1. **Added Category Template** (`backend/src/services/accountingService.js`)
- Created `FAMILY_CATEGORIES_TEMPLATE` with 18 standard categories (6 income, 12 expense)
- Each category has: `name`, `type`, `icon`, `color`
- Categories map to the Chart of Accounts for double-entry bookkeeping

### 2. **Added Category Seeding Function** (`backend/src/services/accountingService.js`)
- New `seedFamilyCategories(tenantId)` function
- Automatically called when new families are created
- Checks for existing categories before seeding

### 3. **Updated Auth Controller** (`backend/src/controllers/authController.js`)
- Now calls `seedFamilyCategories()` after `seedFamilyCoA()` during registration
- New families get both accounts AND categories automatically

### 4. **Added Seed Endpoint** (`backend/src/routes/categories.js`)
- New `POST /api/categories/seed` endpoint
- Allows admins to seed categories for existing families
- Supports `force=true` parameter to reseed

### 5. **Updated Seed Script** (`backend/scripts/seedCategories.js`)
- Script now uses the new `seedFamilyCategories()` function
- Can seed categories for all existing families at once

## Categories Template

The backend now seeds these categories:

### Income Categories (6)
- 💼 Salary (green)
- 🏢 Business (blue)
- 📈 Investment (purple)
- 🎁 Gift (pink)
- 🏠 Rental (orange)
- 💰 Other Income (green)

### Expense Categories (12)
- 🍔 Food (red)
- 🚗 Transport (orange)
- 🏡 Housing (green)
- 💡 Utilities (teal)
- 🏥 Healthcare (cyan)
- 📚 Education (blue)
- 🎬 Entertainment (purple)
- 🛍️ Shopping (pink)
- 📱 Communication (rose)
- 🛡️ Insurance (gray)
- 🤝 Donations (green)
- 📦 Other Expenses (gray)

## For Existing Families

If you have an existing family that was created before this update, you have two options:

### Option 1: Run the Seed Script
```bash
cd backend
node scripts/seedCategories.js
```

This will seed categories for all families that don't have them yet.

### Option 2: Call the API Endpoint
```bash
curl -X POST http://localhost:3000/api/categories/seed \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

Or from the frontend, you can call:
```javascript
await apiService.post('/categories/seed');
```

## Frontend Impact

The frontend will now:
1. ✅ Get real categories from the backend (no more mock fallback needed)
2. ✅ Display categories with proper `type`, `icon`, and `color`
3. ✅ Filter categories by type (income/expense) correctly
4. ✅ Show consistent data across all users in the same family

## Testing

1. **For New Users**: Register a new family → categories will be seeded automatically
2. **For Existing Users**: Run the seed script or call the seed endpoint
3. **Verify**: Check the add-income/add-expense screens to see categories populated from backend

## Next Steps

- [ ] Run the seed script to populate categories for your existing family
- [ ] Test category creation from the backend
- [ ] Consider removing mock categories from `FRONTEND/services/api.ts` once backend is stable
