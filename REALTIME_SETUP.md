# Enable Real-Time for Tournaments Table

## Problem
The tournaments table doesn't have real-time subscriptions enabled, so status changes don't update in real-time for other users.

## Solution

### Option 1: Apply Migration (Recommended)
Run the migration file to enable real-time:

```bash
# If using Supabase CLI
supabase db push

# Or apply the migration directly
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20241207_enable_realtime_for_tournaments.sql
```

### Option 2: Manual Setup in Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to Database → Replication

2. **Enable Real-Time for Tournaments Table**
   - Find the `tournaments` table
   - Toggle "Enable real-time" to ON
   - Save changes

3. **Verify Permissions**
   - Go to Database → Tables → tournaments
   - Check that RLS policies allow SELECT for anon and authenticated users

### Option 3: SQL Commands in Supabase SQL Editor

Run these commands in the Supabase SQL Editor:

```sql
-- Enable real-time for tournaments table
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;

-- Grant necessary permissions for real-time
GRANT SELECT ON tournaments TO anon, authenticated;
GRANT SELECT ON tournaments TO service_role;
```

## Verification

After enabling real-time:

1. **Check Console Logs**
   - Open browser dev tools
   - Look for: "Successfully subscribed to tournament updates"
   - Should NOT see: "Failed to subscribe to tournament updates"

2. **Test Real-Time Updates**
   - Open tournament page in two different browsers/users
   - Change tournament status in one browser
   - Should see immediate update in the other browser

## Troubleshooting

If real-time still doesn't work:

1. **Check Supabase Project Settings**
   - Go to Settings → API
   - Ensure real-time is enabled for your project

2. **Verify Table Permissions**
   ```sql
   -- Check if table is in realtime publication
   SELECT schemaname, tablename 
   FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime' AND tablename = 'tournaments';
   ```

3. **Check RLS Policies**
   - Ensure SELECT policies exist for anon and authenticated users
   - Policies should allow reading tournament data

## Expected Behavior After Fix

- ✅ Tournament status changes update in real-time for all users
- ✅ Registration buttons update immediately when status changes
- ✅ Users see "Tournament status updated to: [Status]" notifications
- ✅ No page refresh needed to see status changes
