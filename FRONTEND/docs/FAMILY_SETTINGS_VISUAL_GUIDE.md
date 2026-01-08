# Family Settings - Screen Flow Guide

## 🏠 Dashboard → Settings Button

**Location:** Top-right corner of dashboard header  
**Action:** Tap settings icon to navigate to Family Settings

---

## ⚙️ Family Settings Screen

### Header
- **Blue Gradient**: #1e3a8a → #2563eb
- **Back Button**: Left side (white icon on transparent background)
- **Title**: "Family Settings" (white, bold)

### Family Profile Section
```
┌────────────────────────────────────────┐
│  Family Profile                        │
│                                        │
│  [Avatar]    The Johnsons  [Edit]     │
│   with       4 Members                 │
│  [Camera]    Dec 1, 2025               │
│   icon       3 Goals                   │
└────────────────────────────────────────┘
```
- Tap avatar or edit icon → Navigate to Edit Family Profile

### Family Members Section
```
┌────────────────────────────────────────┐
│  Family Members                        │
│                                        │
│  [J] John Doe (You)         [👁️][✏️][🗑️] │
│      john@example.com                  │
│      [Parent] [Active]                 │
│  ────────────────────────────────────  │
│  [S] Sarah Johnson          [👁️]    [>]│
│      sarah@example.com                 │
│      [Child] [Active]                  │
│  ────────────────────────────────────  │
│  [E] Emily Johnson          [👁️]    [>]│
│      emily@example.com                 │
│      [Child] [Active]                  │
│  ────────────────────────────────────  │
│  [M] Mike Johnson           [👁️][✏️] [>]│
│      mike@example.com                  │
│      [Guardian] [Active]               │
└────────────────────────────────────────┘
```
- **Permission Icons:**
  - 👁️ Green = Can View
  - ✏️ Orange = Can Edit
  - 🗑️ Red = Can Delete
- Tap member card → Navigate to Edit Member Permissions
- Current user (marked "You") cannot edit own permissions

### Pending Invitations Section
```
┌────────────────────────────────────────┐
│  Pending Invitations                   │
│                                        │
│  david@example.com          [↻] [✕]   │
│  Child • Sent Jan 5, 2026              │
└────────────────────────────────────────┘
```
- **↻** = Resend invitation (blue icon)
- **✕** = Cancel invitation (red icon)
- If empty: Shows "No pending invitations" with mail icon

### Danger Zone
```
┌────────────────────────────────────────┐
│  Danger Zone                           │
│                                        │
│  [🚪 Leave Family]                     │
│  (Red outline button)                  │
│                                        │
│  [🗑️ Delete Family]                    │
│  (Red solid button - creator only)     │
└────────────────────────────────────────┘
```
- Both show confirmation dialogs before action
- Delete Family only visible to family creator

---

## 👤 Edit Member Permissions Screen

### Header
- **Title**: Member's name
- **Back Button**: Asks to confirm if unsaved changes

### Member Info Card
```
┌────────────────────────────────────────┐
│  [S]  Sarah Johnson                    │
│       sarah@example.com                │
└────────────────────────────────────────┘
```

### Role Selector
```
┌────────────────────────────────────────┐
│  Member Role                           │
│  ┌──────────────────────────────────┐ │
│  │ Child                      [▼]   │ │
│  └──────────────────────────────────┘ │
│  Options: Parent, Child, Guardian, Other│
└────────────────────────────────────────┘
```
- Changing role auto-updates permissions

### Permission Categories

**Transaction Permissions**
```
┌────────────────────────────────────────┐
│ [👁️] View Transactions     [Toggle ON] │
│     Can see all family transactions    │
├────────────────────────────────────────┤
│ [+] Add Transactions      [Toggle OFF] │
│     Can create new transactions        │
├────────────────────────────────────────┤
│ [✏️] Edit Transactions     [Toggle OFF] │
│     Can modify existing transactions   │
├────────────────────────────────────────┤
│ [🗑️] Delete Transactions   [Toggle OFF] │
│     Can remove transactions            │
└────────────────────────────────────────┘
```

**Budget Permissions**
```
┌────────────────────────────────────────┐
│ [💰] View Budgets          [Toggle ON] │
│     Can see all family budgets         │
├────────────────────────────────────────┤
│ [✏️] Edit Budgets          [Toggle OFF] │
│     Can modify budget allocations      │
└────────────────────────────────────────┘
```

**Goal Permissions**
```
┌────────────────────────────────────────┐
│ [🏆] View Goals            [Toggle ON] │
│     Can see all family goals           │
├────────────────────────────────────────┤
│ [💵] Contribute to Goals   [Toggle ON] │
│     Can add money to goals             │
└────────────────────────────────────────┘
```

**Member Management**
```
┌────────────────────────────────────────┐
│ [👥+] Invite Members      [Toggle OFF] │
│      Can invite new family members     │
├────────────────────────────────────────┤
│ [👥-] Remove Members      [Toggle OFF] │
│      Can remove family members         │
└────────────────────────────────────────┘
```

### Action Buttons
```
┌────────────────────────────────────────┐
│  [💾 Save Changes]                     │
│  (Blue gradient - enabled when changed)│
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  [👥- Remove from Family]              │
│  (Red solid button)                    │
└────────────────────────────────────────┘
```

---

## ✏️ Edit Family Profile Screen

### Header
- **Title**: "Edit Family Profile"
- **Back Button**: Asks to confirm if unsaved changes

### Avatar Section
```
┌────────────────────────────────────────┐
│  Family Avatar                         │
│                                        │
│        [   Large Avatar   ]            │
│        [ with Camera Icon ]            │
│                                        │
│  Tap to change family photo            │
└────────────────────────────────────────┘
```
- **Tap Avatar Options:**
  - Take Photo (camera)
  - Choose from Library
  - Remove Photo
  - Cancel

### Family Name Input
```
┌────────────────────────────────────────┐
│  Family Name                           │
│  ┌──────────────────────────────────┐ │
│  │ [👥] The Johnsons               │ │
│  └──────────────────────────────────┘ │
│                              15/50     │
└────────────────────────────────────────┘
```
- Character counter (max 50)
- Validation: Cannot be empty

### Action Buttons
```
┌────────────────────────────────────────┐
│  [💾 Save Changes]                     │
│  (Blue gradient - enabled when changed)│
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  Cancel                                │
│  (White button with border)            │
└────────────────────────────────────────┘
```

---

## 🎨 Design Colors

| Element | Color | Hex Code |
|---------|-------|----------|
| Header Gradient Start | Dark Blue | #1e3a8a |
| Header Gradient End | Blue | #2563eb |
| Edit Icon | Orange | #f59e0b |
| Success/View Icon | Green | #10b981 |
| Danger/Delete | Red | #ef4444 |
| Text Primary | Dark Gray | #1e293b |
| Text Secondary | Gray | #64748b |
| Background | Light Gray | #f8fafc |
| Card Background | White | #ffffff |

---

## 📱 Interaction Patterns

### Confirmation Dialogs
- **Remove Member**: "Are you sure you want to remove [Name]?"
- **Cancel Invitation**: "Are you sure you want to cancel this invitation?"
- **Leave Family**: "You will lose access to all family data"
- **Delete Family**: "This action cannot be undone and all data will be permanently lost"
- **Unsaved Changes**: "You have unsaved changes. Discard them?"

### Success Messages
- **Save Permissions**: "Member permissions updated successfully!"
- **Save Profile**: "Family profile updated successfully!"
- **Resend Invitation**: "Invitation resent successfully!"
- **Cancel Invitation**: "Invitation cancelled"
- **Leave Family**: "You have left the family"
- **Delete Family**: "Family deleted"

### Loading States (To Be Implemented)
- Skeleton loaders while fetching data
- Disabled buttons with loading indicators
- Pull-to-refresh on member list

---

## 🧪 Testing Scenarios

### Happy Path
1. Open dashboard → Tap settings icon
2. View family profile and all members
3. Tap a member → Edit their permissions
4. Change role → See permissions auto-update
5. Toggle specific permissions
6. Save changes → See success message
7. Back to settings → Edit family profile
8. Change name and avatar → Save
9. View pending invitations → Resend one

### Edge Cases
1. Try to edit own permissions (should be disabled)
2. Try to delete family as non-creator (button hidden)
3. Try to save with empty family name (validation error)
4. Navigate back with unsaved changes (confirmation)
5. Cancel invitation (confirmation dialog)
6. View empty invitations list (empty state)

### Permission Scenarios
- **Parent Role**: All permissions enabled
- **Child Role**: Only view and contribute permissions
- **Guardian Role**: Most permissions except remove members
- **Custom**: Toggle individual permissions

---

## 🔗 Navigation Map

```
Dashboard (index.tsx)
    ↓
Family Settings (family-settings.tsx)
    ├→ Edit Family Profile (edit-family-profile.tsx)
    │   └→ Image Picker (native)
    │
    ├→ Edit Member Permissions (edit-member-permissions.tsx)
    │   ├→ Role Picker
    │   └→ Permission Toggles
    │
    └→ Danger Zone
        ├→ Leave Family (confirmation)
        └→ Delete Family (confirmation)
```

---

## 📋 Backend Integration Checklist

- [ ] Replace mock data with API calls
- [ ] Add error handling for network failures
- [ ] Implement loading states
- [ ] Add image upload to cloud storage
- [ ] Connect to AuthContext for current user
- [ ] Test all permission combinations
- [ ] Validate role changes on backend
- [ ] Implement rate limiting
- [ ] Add audit logging for sensitive actions
- [ ] Test on different screen sizes
- [ ] Test on iOS and Android
- [ ] Add analytics events
