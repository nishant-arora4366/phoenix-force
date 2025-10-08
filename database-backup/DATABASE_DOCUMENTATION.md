# Phoenix Force Cricket - Complete Database Documentation

## Overview

This documentation covers the complete database setup for Phoenix Force Cricket, extracted from the live Supabase database. The database includes all tables, functions, triggers, policies, and relationships needed to run the application.

## Quick Setup

### 1. Run Complete Database Setup
```bash
# Run the complete setup script
psql -h your-host -U postgres -d your-database -f COMPLETE_DATABASE_SETUP.sql
```

### 2. Verify Setup
```sql
-- Check all functions are created
SELECT count(*) FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check all tables are created  
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Check all policies are active
SELECT count(*) FROM pg_policies WHERE schemaname = 'public';
```

## Database Components

### 📊 Tables (13 Total)

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User accounts and authentication | Role-based access (admin, host, captain, viewer) |
| `players` | Player profiles and information | Linked to users, status management |
| `tournaments` | Tournament management | Multiple formats, host assignment |
| `tournament_slots` | Slot management system | Dynamic slot creation, waitlist support |
| `teams` | Team management | Captain assignment, budget tracking |
| `team_players` | Final team compositions | Auction results, bid amounts |
| `auction_bids` | Auction bidding system | Real-time bidding, winning bid tracking |
| `auction_config` | Auction configuration | Player order, bidding modes |
| `player_skills` | Skill definitions | Configurable skills, admin managed |
| `player_skill_values` | Skill value options | Multi-select support, display order |
| `player_skill_assignments` | Player skill assignments | User-defined skills, value arrays |
| `player_tags` | Player tagging system | Flexible tagging for categorization |
| `notifications` | Real-time notifications | User notifications, read tracking |
| `waitlist` | Waitlist management | Position tracking, automatic promotion |
| `tags` | Tag definitions | Reusable tags for players |

### ⚙️ Functions (29 Total)

#### Waitlist Management (7 functions)
- `auto_promote_waitlist()` - **Trigger function** for automatic promotion
- `get_waitlist_position()` - Get player's waitlist position
- `get_next_available_main_slot()` - Find next available slot
- `manual_promote_waitlist()` - Manual waitlist promotion
- `check_and_promote_waitlist()` - Bulk waitlist promotion
- `safe_promote_waitlist_player()` - Safe promotion with conflict prevention
- `find_and_promote_waitlist()` - Find and promote first available player

#### Slot Management (4 functions)
- `reserve_slot()` - Reserve tournament slots
- `confirm_slot()` - Confirm slot reservations
- `cancel_slot_reservation()` - Cancel reservations with auto-promotion
- `register_player()` - Register players for tournaments

#### Auction System (5 functions)
- `place_bid()` - Place auction bids with validation
- `finalize_auction()` - Finalize auction and create teams
- `reset_auction()` - Reset auction to initial state
- `get_auction_status()` - Get current auction status
- `get_auction_results()` - Get final auction results

#### Tournament Management (4 functions)
- `get_tournament_status()` - Get comprehensive tournament status
- `validate_tournament_data()` - Validate tournament configuration
- `get_recommended_slots()` - Get recommended slots for format
- `get_recommended_teams()` - Get recommended teams for format

#### User Management (6 functions)
- `is_admin()` - Check admin privileges
- `is_tournament_host()` - Check host privileges
- `is_team_captain()` - Check captain privileges
- `generate_username_from_email()` - Generate usernames
- `get_user_display_name()` - Get user display name
- `get_user_full_name()` - Get user full name

#### Notifications (2 functions)
- `mark_notification_read()` - Mark single notification as read
- `mark_all_notifications_read()` - Mark all notifications as read

#### System Functions (1 function)
- `sync_auth_user()` - **Trigger function** for auth user sync

### 🔄 Triggers (2 Total)

1. **`trigger_auto_promote_waitlist`**
   - **Table**: `tournament_slots`
   - **Events**: AFTER DELETE OR UPDATE
   - **Function**: `auto_promote_waitlist()`
   - **Purpose**: Automatically promotes waitlist players when main slots become empty

2. **`sync_auth_user`** (implied trigger)
   - **Table**: `auth.users` (Supabase auth)
   - **Function**: `sync_auth_user()`
   - **Purpose**: Syncs authentication users to public.users table

### 🔒 RLS Policies (50+ Total)

#### Admin Policies
- Full CRUD access to all tables for admin users
- User management and role assignment
- Player profile management
- Tournament and slot management

#### Host Policies
- Tournament creation and management
- Team creation and management
- Slot assignment and confirmation
- Tournament status updates

#### Captain Policies
- Team management for assigned teams
- Auction bidding for team players
- Team budget management

#### User Policies
- Own profile management
- Own player profile management
- Own skill assignments
- Own notifications management

#### Public Access Policies
- View tournaments, players, teams
- View auction bids and results
- View player skills and assignments

### 📈 Views (1 Total)

- **`tournament_details`** - Enhanced tournament view with recommendations and validation status

## Key Features

### 🎯 Dynamic Slot Management
- Slots are created dynamically as players register
- No pre-allocation of slots
- Intelligent slot numbering and management

### 🔄 Automatic Waitlist Promotion
- Real-time promotion when slots become available
- Trigger-based automatic promotion
- Manual promotion capabilities for hosts

### 💰 Auction System
- Real-time bidding with validation
- Budget tracking and management
- Winning bid determination
- Team composition finalization

### 🏷️ Flexible Player Skills
- Configurable skill types (text, number, select, multi-select)
- Admin-managed vs user-managed skills
- Display order and visibility controls

### 🔐 Comprehensive Security
- Row Level Security (RLS) on all tables
- Role-based access control
- Function-level security with SECURITY DEFINER
- Proper authentication and authorization

### 📱 Real-time Notifications
- User notification system
- Read/unread tracking
- Real-time updates via Supabase Realtime

## Database Relationships

```
users (1) ←→ (1) players
users (1) ←→ (n) tournaments (as host)
tournaments (1) ←→ (n) tournament_slots
tournaments (1) ←→ (n) teams
tournaments (1) ←→ (n) auction_bids
teams (1) ←→ (n) team_players
players (1) ←→ (n) player_skill_assignments
player_skills (1) ←→ (n) player_skill_values
player_skills (1) ←→ (n) player_skill_assignments
```

## Performance Optimizations

### Indexes
- Primary key indexes on all tables
- Foreign key indexes for relationships
- Status-based indexes for filtering
- Composite indexes for common queries

### Query Optimization
- Efficient slot management queries
- Optimized waitlist position calculations
- Fast auction bid lookups
- Efficient notification queries

## Security Considerations

### Authentication
- Supabase Auth integration
- JWT token validation
- User session management

### Authorization
- Role-based access control (RBAC)
- Function-level permissions
- Row-level security policies
- API endpoint protection

### Data Protection
- Input validation in functions
- SQL injection prevention
- Proper error handling
- Audit trail capabilities

## Migration and Deployment

### Fresh Installation
1. Run `COMPLETE_DATABASE_SETUP.sql` on new database
2. Configure Supabase Auth settings
3. Set up environment variables
4. Test all functions and policies

### Updates and Maintenance
- Functions can be updated individually
- Policies can be modified as needed
- Schema changes require careful migration
- Always backup before major changes

## Monitoring and Maintenance

### Health Checks
```sql
-- Check function health
SELECT proname, prosrc FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Check policy status
SELECT tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public';

-- Check trigger status
SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE trigger_schema = 'public';
```

### Performance Monitoring
- Monitor slow queries
- Check index usage
- Monitor function execution times
- Track RLS policy performance

## Troubleshooting

### Common Issues
1. **Function not found**: Check if function exists and has proper permissions
2. **RLS policy blocking**: Verify user role and policy conditions
3. **Trigger not firing**: Check trigger definition and function
4. **Permission denied**: Verify user has required role and status

### Debug Commands
```sql
-- Check user role and status
SELECT role, status FROM users WHERE id = auth.uid();

-- Check function permissions
SELECT has_function_privilege('function_name', 'EXECUTE');

-- Check RLS status
SELECT relname, relrowsecurity FROM pg_class WHERE relrowsecurity = true;
```

---

*This documentation is generated from the live database and reflects the current production implementation. All components are tested and working in production.*
