# Business Onboarding Functional Overview

This document provides a high-level overview of the Business Onboarding flow to assist the backend developer in implementing the necessary logic and data persistence.

## Flow Summary

The business onboarding is a multi-step process designed to collect all essential information to set up a business account. Data is accumulated across four main screens and finally confirmed in a success screen.

### 1. Business Profile & Identity
**Screen:** `business-onboarding.tsx`
- **Business Name**: The registered or trading name of the business.
- **Industry**: Selected from a predefined list (e.g., Retail, Services, Manufacturing). This helps in tailoring the accounting categories.
- **What you sell**: Categorized as 'Services only', 'Products only', or 'Both'. This determines if the app should prioritize inventory or service-based invoicing.

### 2. Contact Information
**Screen:** `contact-information.tsx`
- **Address**: Physical or postal address of the business.
- **Phone Number**: Primary contact number (Required).
- **Email**: Business email for invoicing and communications.

### 3. Financial Setup
**Screen:** `financial-setup.tsx`
- **Currency**: The primary currency for accounting (Default: KES - Kenyan Shilling).
- **Fiscal Year Start**: The month when the business financial year begins (Default: January). The app automatically calculates the Year End month.

### 4. Tax and Invoicing
**Screen:** `tax-and-invoice.tsx`
- **VAT Status**: Whether the business charges value-added tax (Standard 16% in Kenya).
- **Invoice Style**: 'Simple' (clean/basic) or 'Detailed' (terms/conditions included).

### 5. Confirmation & Success
**Screen:** `business-onboarding-success.tsx`
- Displays a summary of all collected data for final verification by the user.
- On "Start Using JiBUks", the data should be persisted to the backend.

---

## Business Logic Notes
- **Tenant Isolation**: Each business should represent a new "Tenant" or be linked to an existing one depending on the user's role.
- **Default Chart of Accounts**: Based on the selected industry, the backend should ideally initialize a default set of income and expense categories.
- **Multi-platform Consistency**: The design uses `SafeAreaView` to ensure responsiveness on all mobile devices.
