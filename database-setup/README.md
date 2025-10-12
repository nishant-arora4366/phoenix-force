# Phoenix Force Database Setup

This directory contains essential scripts for database setup, backup, and restoration for Phoenix Force.

## 📁 Files Overview

- `backup-data.js` - Data backup system (JSON + SQL formats)
- `restore-data.js` - Data restoration system
- `setup-project.js` - Database setup from scratch
- `fetch-database-info.js` - Database schema extraction
- `schema/` - Essential database schema files
- `data-backup/` - Current data backup (2,707 records from 12 tables)
- `setup-with-realtime.sql` - Complete database setup with realtime

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd database-setup
npm install
```

### 2. Set Up Environment

Create `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Operations

#### **Backup Data:**
```bash
# Full backup (JSON + SQL)
npm run backup

# JSON only
npm run backup:json

# SQL only  
npm run backup:sql
```

#### **Restore Data:**
```bash
# Restore from JSON
npm run restore:json

# Restore from SQL
npm run restore:sql

# Restore from complete SQL file
npm run restore:complete

# Test restore (dry run)
npm run restore:dry-run
```

#### **Set Up New Database:**
```bash
# Basic setup
npm run setup

# With sample data
npm run setup:with-data

# Auto setup (no prompts)
npm run setup:auto
```

#### **Extract Schema:**
```bash
# Capture current database schema
npm run fetch
```


## 📋 Prerequisites

- **Node.js**: Version 16 or higher
- **Supabase Project**: Active project with service role key
- **Environment Variables**: `.env.local` with Supabase credentials


## 📊 Current Backup Status

**Backup Date:** 2025-10-11T12:15:44.706Z  
**Total Tables:** 12  
**Total Records:** 2,707  
**Status:** ✅ Complete

### Table Breakdown

| Table | Records | Description |
|-------|---------|-------------|
| `users` | 18 | User accounts and authentication |
| `players` | 248 | Player profiles and information |
| `tournaments` | 2 | Tournament configurations |
| `tournament_slots` | 50 | Tournament registration slots |
| `player_skills` | 5 | Available skill categories |
| `player_skill_values` | 21 | Skill value definitions |
| `player_skill_assignments` | 1,000 | Player-skill relationships |
| `auctions` | 18 | Auction configurations |
| `auction_teams` | 36 | Team formations in auctions |
| `auction_players` | 288 | Players in auction system |
| `notifications` | 21 | User notifications |
| `api_usage_analytics` | 1,000 | API usage tracking |

## 🏗️ Production Deployment

### Complete Database Recreation

```bash
# 1. Set up schema
psql -f schema/setup-with-realtime.sql

# 2. Restore data
psql -f data-backup/complete-data-backup.sql
```

### Individual Table Restoration

```bash
# Restore in dependency order
psql -f data-backup/sql/users.sql
psql -f data-backup/sql/players.sql
psql -f data-backup/sql/tournaments.sql
psql -f data-backup/sql/tournament_slots.sql
psql -f data-backup/sql/player_skills.sql
psql -f data-backup/sql/player_skill_values.sql
psql -f data-backup/sql/player_skill_assignments.sql
psql -f data-backup/sql/auctions.sql
psql -f data-backup/sql/auction_teams.sql
psql -f data-backup/sql/auction_players.sql
psql -f data-backup/sql/notifications.sql
psql -f data-backup/sql/api_usage_analytics.sql
```

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `npm run backup` | Full backup (JSON + SQL) |
| `npm run backup:json` | JSON format only |
| `npm run backup:sql` | SQL format only |
| `npm run restore` | Restore from JSON |
| `npm run restore:json` | Restore from JSON backup |
| `npm run restore:sql` | Restore from SQL backup |
| `npm run restore:complete` | Restore from complete SQL |
| `npm run restore:dry-run` | Test restore without changes |
| `npm run setup` | Set up new database |
| `npm run setup:with-data` | Set up with sample data |
| `npm run setup:auto` | Auto setup (no prompts) |
| `npm run fetch` | Extract database schema |

## 🛠️ Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure `.env.local` exists with Supabase credentials

2. **Permission Denied**
   - Verify Service Role Key has proper permissions

3. **Backup/Restore Errors**
   - Check console output for detailed error messages
   - Use `--dry-run` flag to test operations safely

## 📁 File Structure

```
database-setup/
├── backup-data.js              # Data backup system
├── restore-data.js             # Data restoration system
├── setup-project.js            # Database setup
├── fetch-database-info.js      # Schema extraction
├── data-backup/                # Current backup (2,707 records)
│   ├── complete-data-backup.sql
│   ├── json/                   # Individual table JSON files
│   └── sql/                    # Individual table SQL files
├── schema/                     # Database schema files
│   ├── complete-schema.sql
│   ├── tables.json
│   ├── rls-policies.json
│   └── ...
└── setup-with-realtime.sql     # Complete setup script
```
