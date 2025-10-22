# Phoenix Force Database Setup

This directory contains scripts for backing up and managing the Phoenix Force Supabase database.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp env.template .env
   # Edit .env with your Supabase credentials
   ```

3. **Run complete database backup:**
   ```bash
   npm run backup
   ```

4. **Run data-only backup:**
   ```bash
   npm run backup:data
   ```

5. **Run schema-only backup:**
   ```bash
   npm run backup:schema
   ```

## What Gets Backed Up

### 📊 **Table Data**
- All table records with complete data
- Individual JSON files for each table
- Complete SQL backup with INSERT statements

### 🏗️ **Database Schema**
- Table structures and relationships
- Functions and stored procedures
- Policies and Row Level Security (RLS)
- Triggers and event handlers

### 📡 **Realtime Configuration**
- Realtime publications
- Realtime subscriptions
- Event triggers and listeners

### 💾 **Storage Information**
- Storage buckets configuration
- File listings and metadata
- Storage policies

## Files Generated

After running the backup, you'll find:

```
data-backup/
├── complete-database-backup.sql    # Complete SQL backup
├── database-schema.json            # Schema information
├── realtime-config.json            # Realtime configuration
├── storage-info.json               # Storage information
├── BACKUP_REPORT.md                # Detailed backup report
├── backup-summary.json             # Backup summary
├── json/                           # Individual table JSON files
│   ├── users.json
│   ├── players.json
│   ├── tournaments.json
│   └── ...
└── sql/                            # Individual table SQL files
    ├── users.sql
    ├── players.sql
    ├── tournaments.sql
    └── ...
```

## Environment Variables

Create a `.env` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Usage Examples

### Complete Database Backup
```bash
npm run backup
```

### Manual Backup
```bash
node backup-complete-database.js
```

## Backup Contents

### Table Data
- **users** - User accounts and profiles
- **players** - Player information and details
- **tournaments** - Tournament configurations
- **tournament_slots** - Tournament slot allocations
- **auctions** - Auction configurations
- **auction_teams** - Team formations
- **auction_players** - Player auction status
- **player_skills** - Player skill definitions
- **player_skill_values** - Player skill values
- **player_skill_assignments** - Skill assignments
- **notifications** - System notifications
- **api_usage_analytics** - API usage tracking

### Schema Information
- Table structures and column definitions
- Foreign key relationships
- Indexes and constraints
- Custom functions and procedures
- Row Level Security policies
- Database triggers

### Realtime Configuration
- Publication settings
- Subscription configurations
- Event triggers
- Real-time listeners

### Storage Information
- Bucket configurations
- File metadata
- Storage policies
- Access controls

## Troubleshooting

### Common Issues

1. **Authentication Error**
   - Verify your `SUPABASE_SERVICE_ROLE_KEY` is correct
   - Ensure the service role key has proper permissions

2. **Missing Tables**
   - Some tables might not exist yet
   - The script will log warnings for missing tables

3. **Permission Errors**
   - Ensure your service role key has read access to all tables
   - Check RLS policies don't block the service role

### Logs and Output

The backup script provides detailed logging:
- ✅ Success messages for each operation
- ⚠️ Warnings for non-critical issues
- ❌ Errors for critical failures

## Security Notes

- Never commit your `.env` file to version control
- Keep your service role key secure
- The backup contains sensitive data - store securely
- Consider encrypting backup files for long-term storage

## Support

For issues or questions:
1. Check the backup report in `BACKUP_REPORT.md`
2. Review the console output for error messages
3. Verify your Supabase credentials and permissions
