# User Schema Documentation

## Overview
The Phoenix Force Cricket application has been updated by **enhancing the existing `users` table** with additional profile fields. **No separate table is created** - all new fields are added directly to the existing `users` table.

## User Schema Fields

**IMPORTANT**: All fields are added to the **existing `users` table**. No separate profile table is created.

### Required Fields
- **`id`** (UUID, Primary Key): Unique identifier for the user
- **`email`** (VARCHAR, NOT NULL): User's email address (unique)
- **`firstname`** (VARCHAR, NOT NULL): User's first name
- **`lastname`** (VARCHAR, NOT NULL): User's last name
- **`role`** (VARCHAR, NOT NULL): User role (viewer, host, captain, admin)

### Optional Fields
- **`username`** (VARCHAR, UNIQUE): User's chosen username
- **`middlename`** (VARCHAR): User's middle name
- **`photo`** (TEXT): URL to user's profile photo
- **`password_hash`** (VARCHAR): Hashed password (for future use)

### System Fields
- **`created_at`** (TIMESTAMP): Account creation timestamp
- **`updated_at`** (TIMESTAMP): Last update timestamp

## Database Functions

### Helper Functions
- **`generate_username_from_email(email)`**: Generates username from email if not provided
- **`get_user_full_name(user_record)`**: Returns full name (first + middle + last)
- **`get_user_display_name(user_record)`**: Returns username or full name for display

### Views
- **`user_profiles`**: View with computed fields (full_name, display_name)

## API Endpoints

### User Profile Management
- **`GET /api/user-profile?userId={id}`**: Get user profile
- **`PUT /api/user-profile`**: Update user profile

### Request/Response Format

#### GET User Profile
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "firstname": "John",
    "middlename": "Michael",
    "lastname": "Doe",
    "photo": "https://example.com/photo.jpg",
    "role": "viewer",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

#### PUT Update Profile
```json
{
  "userId": "uuid",
  "profile": {
    "username": "newusername",
    "firstname": "John",
    "middlename": "Michael",
    "lastname": "Doe",
    "photo": "https://example.com/photo.jpg"
  }
}
```

## Frontend Components

### AuthFormExtended
- Extended authentication form with profile fields
- Collects username, firstname, middlename, lastname, photo during signup
- Validates required fields (firstname, lastname)
- Auto-generates username from email if not provided

### Profile Page (`/profile`)
- View and edit user profile
- Real-time form validation
- Photo preview functionality
- Role-based access control

## Database Migration

### Apply the Schema Update
```sql
-- Run the migration script
\i supabase-schema/15-update-user-schema.sql
```

### Key Changes
**The existing `users` table is enhanced with new columns:**

1. **New Columns Added to `users` table**:
   - `username` (VARCHAR, UNIQUE)
   - `firstname` (VARCHAR, NOT NULL)
   - `middlename` (VARCHAR, NULLABLE)
   - `lastname` (VARCHAR, NOT NULL)
   - `photo` (TEXT, NULLABLE)
   - `password_hash` (VARCHAR, NULLABLE)

2. **Enhanced Constraints**: Added NOT NULL constraints for required fields
3. **Indexes**: Created indexes on username and email for performance
4. **Functions**: Added helper functions for name handling
5. **Views**: Created user_profiles view with computed fields
6. **RLS Policies**: Updated for new user fields

### Table Structure
```
users table (ENHANCED):
├── id (UUID, Primary Key)
├── email (VARCHAR, NOT NULL, UNIQUE)
├── role (VARCHAR, NOT NULL)
├── created_at (TIMESTAMP)
├── updated_at (TIMESTAMP)
├── username (VARCHAR, UNIQUE) ← NEW
├── firstname (VARCHAR, NOT NULL) ← NEW
├── middlename (VARCHAR) ← NEW
├── lastname (VARCHAR, NOT NULL) ← NEW
├── photo (TEXT) ← NEW
└── password_hash (VARCHAR) ← NEW
```

**NO separate profile table is created!**

## User Roles

### Role Hierarchy
1. **`viewer`**: Basic access, can view content
2. **`host`**: Can create and manage tournaments
3. **`captain`**: Can manage teams and participate in auctions
4. **`admin`**: Full system access

### Role Assignment
- New users default to `viewer` role
- Admins can update user roles via API
- Role changes are logged in the system

## Security Features

### Row Level Security (RLS)
- Users can only view/edit their own profile
- Admins can view/edit all profiles
- Profile updates are validated server-side

### Data Validation
- Required fields enforced at database level
- Email format validation
- Username uniqueness validation
- Photo URL format validation

## Usage Examples

### Sign Up with Profile
```typescript
// User signs up with extended profile
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      username: 'johndoe',
      firstname: 'John',
      middlename: 'Michael',
      lastname: 'Doe',
      photo: 'https://example.com/photo.jpg',
      role: 'viewer'
    }
  }
})
```

### Update Profile
```typescript
// Update user profile
const response = await fetch('/api/user-profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user.id,
    profile: {
      username: 'newusername',
      firstname: 'John',
      middlename: 'Michael',
      lastname: 'Doe',
      photo: 'https://example.com/new-photo.jpg'
    }
  })
})
```

## Migration Checklist

- [ ] Apply database migration script
- [ ] Update existing users with default values
- [ ] Test user registration with new fields
- [ ] Test profile update functionality
- [ ] Verify RLS policies work correctly
- [ ] Test role-based access control
- [ ] Validate photo URL handling
- [ ] Test username uniqueness constraints

## Troubleshooting

### Common Issues
1. **Username conflicts**: System auto-generates from email if username taken
2. **Required field validation**: First name and last name are mandatory
3. **Photo URL validation**: Must be valid URL format
4. **Role permissions**: Check user has appropriate role for actions

### Error Messages
- "First name and last name are required" - Missing mandatory fields
- "Username already exists" - Username uniqueness violation
- "Invalid photo URL" - Photo URL format validation failed
- "Insufficient permissions" - User role doesn't allow action
