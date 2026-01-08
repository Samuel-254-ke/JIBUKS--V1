# JIBUKS API Contracts - Family Dashboard

## Overview
This document defines the API endpoints and data contracts required for the Family Dashboard feature.

---

## Base URL
```
Production: https://api.jibuks.com/v1
Development: http://localhost:3000/api
```

---

## Authentication
All API requests require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Get Family Dashboard Summary

**Endpoint:** `GET /api/family/dashboard`

**Description:** Returns a comprehensive summary of the family's financial dashboard including members, goals, budgets, and spending.

**Request Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| month | number | No | Month for budget data (1-12). Default: current month |
| year | number | No | Year for budget data. Default: current year |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "familyId": "fam_123456",
    "familyName": "The Johnsons",
    "totalMembers": 4,
    "activeGoals": 3,
    "totalBudget": 150000,
    "monthlySpending": 87500,
    "recentGoals": [
      {
        "id": "goal_1",
        "name": "New Car Fund",
        "description": "Saving for a new family car",
        "target": 500000,
        "current": 125000,
        "deadline": "2026-12-31",
        "status": "ACTIVE",
        "createdBy": "user_123",
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2026-01-06T00:00:00Z"
      }
    ],
    "budgetOverview": [
      {
        "id": "budget_1",
        "category": "Groceries",
        "allocated": 40000,
        "spent": 32000,
        "remaining": 8000,
        "month": "01",
        "year": 2026
      }
    ],
    "members": [
      {
        "id": "user_123",
        "name": "John Johnson",
        "email": "john@example.com",
        "role": "ADMIN",
        "avatarUrl": "https://...",
        "phoneNumber": "+254712345678",
        "joinedAt": "2025-01-01T00:00:00Z"
      }
    ]
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

**TypeScript Interface:**
```typescript
interface DashboardResponse {
  success: boolean;
  data: FamilyDashboard;
}

interface FamilyDashboard {
  familyId: string;
  familyName: string;
  totalMembers: number;
  activeGoals: number;
  totalBudget: number;
  monthlySpending: number;
  recentGoals: FamilyGoal[];
  budgetOverview: BudgetCategory[];
  members: FamilyMember[];
}
```

---

### 2. Get Family Goals

**Endpoint:** `GET /api/family/goals`

**Description:** Returns all goals for the authenticated user's family.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status: ACTIVE, COMPLETED, CANCELLED |
| limit | number | No | Number of goals to return (default: 10) |
| offset | number | No | Pagination offset (default: 0) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "id": "goal_1",
        "name": "New Car Fund",
        "description": "Saving for a new family car",
        "target": 500000,
        "current": 125000,
        "deadline": "2026-12-31",
        "status": "ACTIVE",
        "createdBy": "user_123",
        "createdAt": "2025-01-01T00:00:00Z",
        "updatedAt": "2026-01-06T00:00:00Z"
      }
    ],
    "total": 3,
    "limit": 10,
    "offset": 0
  }
}
```

**TypeScript Interface:**
```typescript
interface GoalsResponse {
  success: boolean;
  data: {
    goals: FamilyGoal[];
    total: number;
    limit: number;
    offset: number;
  };
}
```

---

### 3. Get Budget Overview

**Endpoint:** `GET /api/family/budgets/overview`

**Description:** Returns budget summary for the specified month and year.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| month | number | Yes | Month (1-12) |
| year | number | Yes | Year (e.g., 2026) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "month": "01",
    "year": 2026,
    "totalAllocated": 150000,
    "totalSpent": 87500,
    "totalRemaining": 62500,
    "categories": [
      {
        "id": "budget_1",
        "category": "Groceries",
        "allocated": 40000,
        "spent": 32000,
        "remaining": 8000,
        "month": "01",
        "year": 2026
      },
      {
        "id": "budget_2",
        "category": "Transport",
        "allocated": 25000,
        "spent": 18000,
        "remaining": 7000,
        "month": "01",
        "year": 2026
      }
    ]
  }
}
```

**TypeScript Interface:**
```typescript
interface BudgetOverviewResponse {
  success: boolean;
  data: {
    month: string;
    year: number;
    totalAllocated: number;
    totalSpent: number;
    totalRemaining: number;
    categories: BudgetCategory[];
  };
}
```

---

### 4. Create Family Goal

**Endpoint:** `POST /api/family/goals`

**Description:** Creates a new family goal.

**Request Body:**
```json
{
  "name": "New Car Fund",
  "description": "Saving for a new family car",
  "target": 500000,
  "deadline": "2026-12-31"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "goal_123",
    "name": "New Car Fund",
    "description": "Saving for a new family car",
    "target": 500000,
    "current": 0,
    "deadline": "2026-12-31",
    "status": "ACTIVE",
    "createdBy": "user_123",
    "createdAt": "2026-01-07T00:00:00Z",
    "updatedAt": "2026-01-07T00:00:00Z"
  }
}
```

---

### 5. Get Family Members

**Endpoint:** `GET /api/family/members`

**Description:** Returns all members of the authenticated user's family.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": "user_123",
        "name": "John Johnson",
        "email": "john@example.com",
        "role": "ADMIN",
        "avatarUrl": "https://...",
        "phoneNumber": "+254712345678",
        "joinedAt": "2025-01-01T00:00:00Z"
      }
    ],
    "total": 4
  }
}
```

---

### 6. Create Transaction

**Endpoint:** `POST /api/family/transactions`

**Description:** Creates a new transaction (income or expense).

**Request Body:**
```json
{
  "amount": 5000,
  "type": "EXPENSE",
  "category": "Groceries",
  "description": "Weekly shopping",
  "date": "2026-01-07"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "txn_123",
    "amount": 5000,
    "type": "EXPENSE",
    "category": "Groceries",
    "description": "Weekly shopping",
    "date": "2026-01-07T00:00:00Z",
    "createdBy": "user_123",
    "familyId": "fam_123"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Invalid or missing authentication token |
| FORBIDDEN | 403 | User doesn't have permission |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| SERVER_ERROR | 500 | Internal server error |

---

## Rate Limiting
- 100 requests per minute per user
- 429 status code when limit exceeded

---

## Notes
- All monetary values are in KES (Kenyan Shillings) as integers (cents)
- Dates are in ISO 8601 format (YYYY-MM-DD or with time)
- All timestamps include timezone information (UTC)

---

## Family Settings Endpoints

### 7. Get Family Settings

**Endpoint:** `GET /api/family/settings`

**Description:** Returns comprehensive family settings including family info, members with permissions, and pending invitations.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "family": {
      "id": 1,
      "name": "The Johnsons",
      "avatar": "https://...",
      "createdAt": "2025-12-01T00:00:00Z",
      "totalMembers": 4,
      "activeGoals": 3,
      "creatorId": 1
    },
    "members": [
      {
        "id": "user_123",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "Parent",
        "status": "Active",
        "avatar": "https://...",
        "joinedAt": "2025-12-01T00:00:00Z",
        "permissions": {
          "canView": true,
          "canAdd": true,
          "canEdit": true,
          "canDelete": true,
          "canViewBudgets": true,
          "canEditBudgets": true,
          "canViewGoals": true,
          "canContributeGoals": true,
          "canInvite": true,
          "canRemove": true
        }
      }
    ],
    "pendingInvitations": [
      {
        "id": 101,
        "email": "david@example.com",
        "role": "Child",
        "sentAt": "2026-01-05T00:00:00Z",
        "status": "Pending"
      }
    ]
  }
}
```

---

### 8. Update Family Profile

**Endpoint:** `PUT /api/family`

**Description:** Updates family name and/or avatar.

**Request Body:**
```json
{
  "name": "The Smith Family",
  "avatar": "base64_encoded_image_or_url"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "The Smith Family",
    "avatar": "https://...",
    "updatedAt": "2026-01-07T00:00:00Z"
  }
}
```

---

### 9. Get Member Permissions

**Endpoint:** `GET /api/family/members/:id/permissions`

**Description:** Returns detailed permissions for a specific family member.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "memberId": "user_123",
    "role": "Child",
    "permissions": {
      "canView": true,
      "canAdd": false,
      "canEdit": false,
      "canDelete": false,
      "canViewBudgets": true,
      "canEditBudgets": false,
      "canViewGoals": true,
      "canContributeGoals": true,
      "canInvite": false,
      "canRemove": false
    }
  }
}
```

---

### 10. Update Member Permissions

**Endpoint:** `PUT /api/family/members/:id/permissions`

**Description:** Updates permissions for a specific family member.

**Request Body:**
```json
{
  "permissions": {
    "canView": true,
    "canAdd": true,
    "canEdit": false,
    "canDelete": false,
    "canViewBudgets": true,
    "canEditBudgets": true,
    "canViewGoals": true,
    "canContributeGoals": true,
    "canInvite": false,
    "canRemove": false
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "memberId": "user_123",
    "permissions": { /* updated permissions */ },
    "updatedAt": "2026-01-07T00:00:00Z"
  }
}
```

---

### 11. Update Member Role

**Endpoint:** `PUT /api/family/members/:id/role`

**Description:** Changes a member's role in the family.

**Request Body:**
```json
{
  "role": "Parent"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "memberId": "user_123",
    "role": "Parent",
    "updatedAt": "2026-01-07T00:00:00Z"
  }
}
```

---

### 12. Remove Family Member

**Endpoint:** `DELETE /api/family/members/:id`

**Description:** Removes a member from the family.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

### 13. Get Pending Invitations

**Endpoint:** `GET /api/family/invitations/pending`

**Description:** Returns all pending invitations for the family.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "invitations": [
      {
        "id": 101,
        "email": "david@example.com",
        "role": "Child",
        "sentAt": "2026-01-05T00:00:00Z",
        "status": "Pending"
      }
    ],
    "total": 1
  }
}
```

---

### 14. Resend Invitation

**Endpoint:** `POST /api/family/invitations/:id/resend`

**Description:** Resends a pending invitation email.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invitation resent successfully",
  "data": {
    "invitationId": 101,
    "resentAt": "2026-01-07T00:00:00Z"
  }
}
```

---

### 15. Cancel Invitation

**Endpoint:** `DELETE /api/family/invitations/:id`

**Description:** Cancels a pending invitation.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Invitation cancelled successfully"
}
```

---

### 16. Leave Family

**Endpoint:** `DELETE /api/family/leave`

**Description:** Removes the current user from their family.

**Success Response (200):**
```json
{
  "success": true,
  "message": "You have left the family successfully"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Family creator cannot leave. Transfer ownership or delete the family."
  }
}
```

---

### 17. Delete Family

**Endpoint:** `DELETE /api/family`

**Description:** Permanently deletes the family and all associated data. Only the family creator can perform this action.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Family deleted successfully"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only the family creator can delete the family"
  }
}
```

---

## TypeScript Interfaces for Family Settings

```typescript
export type FamilyRole = 'Parent' | 'Child' | 'Guardian' | 'Other';
export type MemberStatus = 'Active' | 'Pending' | 'Inactive';

export interface MemberPermissions {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewBudgets: boolean;
  canEditBudgets: boolean;
  canViewGoals: boolean;
  canContributeGoals: boolean;
  canInvite: boolean;
  canRemove: boolean;
}

export interface FamilyMemberDetailed {
  id: string;
  name: string;
  email: string;
  role: FamilyRole;
  status: MemberStatus;
  avatar?: string | null;
  joinedAt: string;
  permissions: MemberPermissions;
}

export interface PendingInvitation {
  id: number;
  email: string;
  role: FamilyRole;
  sentAt: string;
  status: 'Pending' | 'Accepted' | 'Rejected';
}

export interface FamilySettings {
  family: {
    id: number;
    name: string;
    avatar: string | null;
    createdAt: string;
    totalMembers: number;
    activeGoals: number;
    creatorId: number;
  };
  members: FamilyMemberDetailed[];
  pendingInvitations: PendingInvitation[];
}
```

