# Business Onboarding API Guide

This document outlines the API requirements for the Backend Developer to support the Business Onboarding flow.

## Required Endpoint: Create Business Profile

### `POST /api/business/setup`

This endpoint should be called when the user completes the onboarding flow (at the success screen). It persists all collected data to the database and initializes the business environment.

#### Authentication
- **Header**: `Authorization: Bearer <JWT_TOKEN>`
- **Note**: The user must be authenticated. The backend should link the new business (Tenant) to the authenticated user.

#### Request Body (JSON)
```json
{
  "businessName": "Doris Beauty Salon",
  "industry": "Hair Salon, Beauty Salon, or Barber Shop",
  "salesType": "services",
  "address": "123 Salon Street, Nairobi",
  "phoneNumber": "+2547897654389",
  "email": "doris@salon.com",
  "currency": "🇰🇪 KES - Kenyan Shilling",
  "fiscalYearStart": "January",
  "vatStatus": true,
  "invoiceStyle": "simple"
}
```

#### Expected Backend Actions
1. **Create Tenant**: Create a new record in the `Tenant` table.
2. **Link User**: Associate the current user with the new `Tenant` (e.g., in a `UserTenant` join table or by updating the User's `tenantId`).
3. **Initialize Settings**: Store the `currency`, `fiscalYearStart`, and `vatStatus` in a `BusinessSettings` table.
4. **Seed Categories**: (Optional but Recommended) Based on the `industry`, seed the `AccountCategory` table with relevant categories for that specific business type.

---

## Database Schema Mapping (Prisma)

Based on the existing `schema.prisma`, here is the suggested mapping:

- **BusinessName** -> `Tenant.name`
- **Industry** -> `Tenant.industry` (add this field to Tenant model)
- **SalesType** -> `Tenant.type` (e.g., Enum: SERVICE, PRODUCT, BOTH)
- **Address/Phone/Email** -> `Tenant` contact fields.
- **Currency/FiscalYear** -> `TenantSettings` model (linked to Tenant).

## Response Codes
- `201 Created`: Business setup successful.
- `400 Bad Request`: Missing required fields (Business Name, Phone).
- `401 Unauthorized`: Missing or invalid token.
- `500 Internal Server Error`: Database connection or seeding failure.
