# Complete Database Setup Guide

This guide will help you recreate the Phoenix Force database from scratch using the backup files.

## 📋 Prerequisites

1. **Supabase Account**: Create a new Supabase project
2. **Environment Variables**: Set up your `.env` file
3. **Backup Files**: Ensure all backup files are available

## 🚀 Step-by-Step Setup

### 1. Create New Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `phoenix-force`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be ready (2-3 minutes)

### 2. Set Up Environment Variables

Create a `.env` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Database URL (optional)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 3. Run Database Schema Setup

```bash
# Navigate to database setup directory
cd database-setup

# Install dependencies
npm install

# Run the schema setup
node backup-schema-rest.js
```

### 4. Create Tables and Structure

Use the generated SQL files to create your database structure:

```bash
# Run the complete schema SQL
psql $DATABASE_URL -f data-backup/database-schema.sql
```

### 5. Set Up Row Level Security (RLS)

You'll need to manually configure RLS policies in the Supabase dashboard:

1. Go to **Authentication > Policies**
2. Enable RLS for each table
3. Create policies for:
   - **Users**: Allow users to read/update their own data
   - **Players**: Allow authenticated users to read, admins to write
   - **Tournaments**: Allow authenticated users to read, hosts/admins to write
   - **Auctions**: Allow authenticated users to read, hosts/admins to write
   - **Auction Teams**: Allow captains to manage their teams
   - **Auction Players**: Allow authenticated users to read, hosts to write

### 6. Set Up Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Create buckets:
   - **player-profiles**: Public bucket for profile pictures
   - **tournament-schedules**: Public bucket for schedule images

### 7. Configure Realtime

1. Go to **Database > Replication** in Supabase dashboard
2. Enable replication for tables that need real-time updates:
   - `auction_players`
   - `auction_teams`
   - `notifications`
   - `api_usage_analytics`

### 8. Restore Data

```bash
# Run the complete data backup
psql $DATABASE_URL -f data-backup/complete-database-backup.sql
```

### 9. Set Up Storage Files

Upload the storage files from your backup:

```bash
# Upload player profile pictures
# (Use Supabase dashboard or API to upload files)

# Upload tournament schedules
# (Use Supabase dashboard or API to upload files)
```

### 10. Configure Authentication

1. Go to **Authentication > Settings** in Supabase dashboard
2. Configure:
   - **Site URL**: Your application URL
   - **Redirect URLs**: Your application URLs
   - **Email Templates**: Customize as needed
   - **Auth Providers**: Enable email/password, social providers

### 11. Set Up API Keys

1. Go to **Settings > API** in Supabase dashboard
2. Copy your API keys to your `.env` file
3. Configure CORS settings for your domain

## 📊 Database Structure

### Core Tables

- **users**: User accounts and profiles
- **players**: Player information and details
- **tournaments**: Tournament configurations
- **tournament_slots**: Tournament slot allocations
- **auctions**: Auction configurations
- **auction_teams**: Team formations
- **auction_players**: Player auction status
- **player_skills**: Player skill definitions
- **player_skill_values**: Player skill values
- **player_skill_assignments**: Skill assignments
- **notifications**: System notifications
- **api_usage_analytics**: API usage tracking

### Storage Buckets

- **player-profiles**: Profile pictures (5MB limit, image types)
- **tournament-schedules**: Schedule images (10MB limit, image types)

## 🔧 Manual Configuration Required

### RLS Policies

You'll need to manually create these policies in Supabase:

```sql
-- Example RLS policies (create in Supabase dashboard)

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Players table
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view players" ON players FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage players" ON players FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Tournaments table
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view tournaments" ON tournaments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Hosts can manage tournaments" ON tournaments FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'host'));

-- Auctions table
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view auctions" ON auctions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Hosts can manage auctions" ON auctions FOR ALL USING (auth.jwt() ->> 'role' IN ('admin', 'host'));
```

### Functions and Triggers

Create these functions in Supabase SQL editor:

```sql
-- Example functions (create in Supabase SQL editor)

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ... apply to other tables as needed
```

## 🧪 Testing Your Setup

1. **Test Database Connection**:
   ```bash
   # Test with your app
   npm run dev
   ```

2. **Test Authentication**:
   - Try signing up a new user
   - Test login/logout functionality

3. **Test Data Operations**:
   - Create a tournament
   - Add players
   - Start an auction

4. **Test Storage**:
   - Upload a profile picture
   - Test file access

## 📝 Backup and Maintenance

### Regular Backups

```bash
# Run backup script
cd database-setup
node backup-schema-rest.js
```

### Monitoring

- Monitor database performance in Supabase dashboard
- Check storage usage
- Review API usage analytics
- Monitor realtime connections

## 🆘 Troubleshooting

### Common Issues

1. **RLS Policies**: Make sure all tables have proper RLS policies
2. **Storage Permissions**: Check bucket policies and file permissions
3. **Realtime**: Ensure tables are enabled for replication
4. **API Keys**: Verify all environment variables are correct

### Getting Help

1. Check Supabase documentation
2. Review error logs in Supabase dashboard
3. Test with Supabase CLI
4. Contact support if needed

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)

---

**Note**: This guide provides a comprehensive setup process. Some manual configuration is required for RLS policies, functions, and triggers that cannot be automatically generated from the backup.
