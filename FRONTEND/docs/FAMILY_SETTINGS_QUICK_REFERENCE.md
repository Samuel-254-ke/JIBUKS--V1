# Quick Reference - Family Settings

## 🚀 Quick Start

### Testing the Feature
1. Start the development server:
   ```bash
   cd FRONTEND
   npm start
   ```

2. Navigate to the dashboard (tabs/index)
3. Tap the settings icon (⚙️) in the top-right corner
4. Explore the family settings screens

### File Locations
```
FRONTEND/
├── app/
│   ├── family-settings.tsx          # Main settings screen
│   ├── edit-member-permissions.tsx  # Edit permissions
│   └── edit-family-profile.tsx      # Edit profile
├── types/
│   └── family.ts                    # TypeScript types (updated)
└── docs/
    ├── API_CONTRACTS.md             # API endpoints (updated)
    ├── FAMILY_SETTINGS_IMPLEMENTATION.md
    └── FAMILY_SETTINGS_VISUAL_GUIDE.md
```

---

## 🎯 Key Components

### family-settings.tsx
**Purpose:** Main settings screen with family overview, members, invitations, and danger zone

**Mock Data Location:** Line 15
```typescript
const mockFamilySettings: FamilySettingsType = { ... }
```

**Key Functions:**
- `handleResendInvitation()` - Resend invitation (TODO: API call)
- `handleCancelInvitation()` - Cancel invitation (TODO: API call)
- `handleLeaveFamily()` - Leave family (TODO: API call)
- `handleDeleteFamily()` - Delete family (TODO: API call)

**Navigation:**
- Back button → Previous screen
- Tap family profile → `/edit-family-profile`
- Tap member card → `/edit-member-permissions?memberId=X`

---

### edit-member-permissions.tsx
**Purpose:** Edit individual member's role and permissions

**Mock Data Location:** Line 15
```typescript
const mockMemberData = { ... }
```

**Key Features:**
- Role picker with auto-permission updates
- 10 permission toggles organized by category
- Change tracking (save button only enabled when changed)
- Unsaved changes warning

**Key Functions:**
- `handleRoleChange()` - Auto-adjust permissions based on role
- `togglePermission()` - Toggle individual permission
- `handleSave()` - Save all changes (TODO: API call)
- `handleRemoveMember()` - Remove member (TODO: API call)

---

### edit-family-profile.tsx
**Purpose:** Edit family name and avatar

**Mock Data Location:** Line 17
```typescript
const mockFamilyProfile = { ... }
```

**Key Features:**
- Avatar picker (camera, library, remove)
- Text input with character counter (50 max)
- Validation (name cannot be empty)
- Unsaved changes warning

**Key Functions:**
- `pickImage()` - Choose from photo library
- `takePhoto()` - Take photo with camera
- `handleSave()` - Save profile (TODO: API call)
- `handleCancel()` - Cancel with warning if changes

---

## 📝 TypeScript Types

### FamilyRole
```typescript
type FamilyRole = 'Parent' | 'Child' | 'Guardian' | 'Other';
```

### MemberPermissions
```typescript
interface MemberPermissions {
  canView: boolean;              // View transactions
  canAdd: boolean;               // Add transactions
  canEdit: boolean;              // Edit transactions
  canDelete: boolean;            // Delete transactions
  canViewBudgets: boolean;       // View budgets
  canEditBudgets: boolean;       // Edit budgets
  canViewGoals: boolean;         // View goals
  canContributeGoals: boolean;   // Contribute to goals
  canInvite: boolean;            // Invite members
  canRemove: boolean;            // Remove members
}
```

### FamilySettings
```typescript
interface FamilySettings {
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

---

## 🔌 API Endpoints

### Get Settings
```typescript
GET /api/family/settings
Response: FamilySettings
```

### Update Family
```typescript
PUT /api/family
Body: { name: string, avatar: string | null }
```

### Get Member Permissions
```typescript
GET /api/family/members/:id/permissions
Response: { role, permissions }
```

### Update Permissions
```typescript
PUT /api/family/members/:id/permissions
Body: { permissions: MemberPermissions }
```

### Update Role
```typescript
PUT /api/family/members/:id/role
Body: { role: FamilyRole }
```

### Remove Member
```typescript
DELETE /api/family/members/:id
```

### Manage Invitations
```typescript
GET /api/family/invitations/pending
POST /api/family/invitations/:id/resend
DELETE /api/family/invitations/:id
```

### Danger Zone
```typescript
DELETE /api/family/leave
DELETE /api/family
```

See `docs/API_CONTRACTS.md` for full details.

---

## 🎨 Design System

### Colors
```typescript
const COLORS = {
  // Header
  gradientStart: '#1e3a8a',  // Dark blue
  gradientEnd: '#2563eb',    // Blue
  
  // Actions
  edit: '#f59e0b',           // Orange
  success: '#10b981',        // Green
  danger: '#ef4444',         // Red
  
  // Text
  primary: '#1e293b',        // Dark gray
  secondary: '#64748b',      // Gray
  tertiary: '#94a3b8',       // Light gray
  
  // Background
  screen: '#f8fafc',         // Light gray
  card: '#ffffff',           // White
};
```

### Icons (Ionicons)
- Settings: `settings-outline`
- Back: `arrow-back`
- Camera: `camera`
- Edit: `create-outline`
- View: `eye`
- Add: `add-circle`
- Delete: `trash`
- Save: `save`
- Remove: `person-remove`
- Refresh: `refresh`
- Close: `close-circle`
- Exit: `exit-outline`
- People: `people`

---

## 🔐 Permission Presets

### Parent Role
```typescript
{
  canView: true,
  canAdd: true,
  canEdit: true,
  canDelete: true,
  canViewBudgets: true,
  canEditBudgets: true,
  canViewGoals: true,
  canContributeGoals: true,
  canInvite: true,
  canRemove: true,
}
```

### Child Role
```typescript
{
  canView: true,
  canAdd: false,
  canEdit: false,
  canDelete: false,
  canViewBudgets: true,
  canEditBudgets: false,
  canViewGoals: true,
  canContributeGoals: true,
  canInvite: false,
  canRemove: false,
}
```

### Guardian Role
```typescript
{
  canView: true,
  canAdd: true,
  canEdit: true,
  canDelete: false,
  canViewBudgets: true,
  canEditBudgets: true,
  canViewGoals: true,
  canContributeGoals: true,
  canInvite: false,
  canRemove: false,
}
```

---

## ⚠️ Important Notes

### Current User Protection
```typescript
const currentUserId = '1'; // TODO: Get from AuthContext

// Cannot edit own permissions
if (member.id === currentUserId) {
  // Disable interaction
}
```

### Family Creator
```typescript
// Only creator can delete family
if (settings.family.creatorId.toString() === currentUserId) {
  // Show delete button
}
```

### Confirmation Dialogs
Always use `Alert.alert()` for destructive actions:
```typescript
Alert.alert(
  'Title',
  'Message',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Confirm', style: 'destructive', onPress: () => {} }
  ]
);
```

---

## 🐛 Common Issues

### Issue: Picker not rendering
**Solution:** Ensure `@react-native-picker/picker` is installed
```bash
npm install @react-native-picker/picker
```

### Issue: Image picker not working
**Solution:** Request permissions first
```typescript
const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
if (status !== 'granted') {
  Alert.alert('Permission Required', 'Please grant permissions');
  return;
}
```

### Issue: Navigation not working
**Solution:** Check if route is registered in `_layout.tsx`
```typescript
<Stack.Screen name="family-settings" options={{ headerShown: false }} />
```

---

## ✅ Testing Checklist

### Basic Flow
- [ ] Dashboard settings button works
- [ ] All sections render correctly
- [ ] Member list shows all members
- [ ] Current user is marked with "(You)"
- [ ] Permission icons display correctly

### Edit Permissions
- [ ] Can navigate to edit permissions
- [ ] Role picker works
- [ ] Permission toggles work
- [ ] Auto-permission update on role change
- [ ] Save button enables on changes
- [ ] Remove member shows confirmation

### Edit Profile
- [ ] Can navigate to edit profile
- [ ] Avatar picker shows options
- [ ] Name input works
- [ ] Character counter updates
- [ ] Validation prevents empty name
- [ ] Save button enables on changes

### Invitations
- [ ] Pending invitations display
- [ ] Empty state shows when no invites
- [ ] Resend shows success alert
- [ ] Cancel shows confirmation

### Danger Zone
- [ ] Leave family shows confirmation
- [ ] Delete family only visible to creator
- [ ] Delete shows strong warning
- [ ] Actions navigate correctly

### Edge Cases
- [ ] Current user cannot edit own permissions
- [ ] Back button warns on unsaved changes
- [ ] Invalid data shows error
- [ ] Long names truncate properly
- [ ] Empty states display correctly

---

## 📚 Resources

- **API Documentation:** `docs/API_CONTRACTS.md`
- **Implementation Guide:** `docs/FAMILY_SETTINGS_IMPLEMENTATION.md`
- **Visual Guide:** `docs/FAMILY_SETTINGS_VISUAL_GUIDE.md`
- **Type Definitions:** `types/family.ts`

---

## 🚀 Next Steps

1. **Test the UI**: Run the app and navigate through all screens
2. **Backend Integration**: Replace mock data with API calls
3. **Error Handling**: Add try-catch blocks and error states
4. **Loading States**: Add skeleton loaders and spinners
5. **Authentication**: Connect to AuthContext for current user
6. **Image Upload**: Implement cloud storage for avatars
7. **Validation**: Add more robust form validation
8. **Analytics**: Track user interactions
9. **Testing**: Write unit and integration tests
10. **Polish**: Add animations and micro-interactions
