# Phoenix Force Cricket - Database Backup

This directory contains the complete database backup extracted from the live Supabase database.

## Files

### 🗄️ `COMPLETE_DATABASE_SETUP.sql`
**The main file you need to recreate the entire database from scratch.**

- ✅ All 13 tables with complete schema
- ✅ All 29 functions with full implementation
- ✅ All 2 triggers for automation
- ✅ All 50+ RLS policies for security
- ✅ All indexes, constraints, and relationships
- ✅ Complete data types and permissions

**Usage:**
```bash
psql -h your-host -U postgres -d your-database -f COMPLETE_DATABASE_SETUP.sql
```

### 📚 `DATABASE_DOCUMENTATION.md`
**Comprehensive documentation covering everything in the database.**

- Complete function documentation with parameters
- Table relationships and purposes
- Security policies and permissions
- Performance optimizations
- Troubleshooting guide

### 🔧 `database-functions.sql`
**Database functions (for reference).**

- All 29 functions extracted from live database
- Ready to run individually if needed
- Includes proper comments and documentation

### 📊 `current-database-types.ts`
**TypeScript types generated from live database.**

- Complete type definitions for all tables
- Function parameter and return types
- Ready to use in your Next.js application

## Quick Start

1. **For new database setup:**
   ```bash
   psql -h your-host -U postgres -d your-database -f COMPLETE_DATABASE_SETUP.sql
   ```

2. **For documentation:**
   Read `DATABASE_DOCUMENTATION.md` for complete details

3. **For TypeScript integration:**
   Use `current-database-types.ts` in your application

## Creating New Backups

### Automated Backup Script
Use the provided backup script to create fresh backups whenever database changes are made:

```bash
# Run the backup script
./backup-database.sh
```

**What the script does:**
- ✅ Connects to live Supabase database
- ✅ Creates complete database dump
- ✅ Extracts functions only
- ✅ Generates TypeScript types
- ✅ Updates all main files
- ✅ Creates comprehensive documentation
- ✅ Cleans up old backup files
- ✅ Generates backup summary

**Requirements:**
- Supabase CLI installed (`npm install -g supabase`)
- Docker running
- Project linked to Supabase (`supabase link --project-ref ydhwhnwuzbjzsfhixsou`)

### Manual Backup Process
If you prefer manual control:

1. **Create complete dump:**
   ```bash
   supabase db dump --linked --schema public --data-only=false --file complete-database-dump.sql
   ```

2. **Extract functions:**
   ```bash
   awk '/CREATE OR REPLACE FUNCTION/,/^\$\$ LANGUAGE/' complete-database-dump.sql > database-functions.sql
   ```

3. **Generate types:**
   ```bash
   supabase gen types typescript --linked > current-database-types.ts
   ```

## What's Included

### Database Components
- **13 Tables**: users, players, tournaments, slots, teams, auctions, etc.
- **29 Functions**: waitlist management, slot operations, auction system, etc.
- **2 Triggers**: auto-promotion and user sync
- **50+ Policies**: comprehensive RLS security
- **1 View**: enhanced tournament details
- **All Indexes**: optimized for performance

### Key Features
- ✅ Dynamic slot management
- ✅ Automatic waitlist promotion
- ✅ Real-time auction system
- ✅ Flexible player skills
- ✅ Comprehensive security
- ✅ Real-time notifications

## Generated From Live Database

This backup was extracted from the live Supabase database (`ydhwhnwuzbjzsfhixsou`) and includes everything that was executed in the Supabase SQL console.

**All functions, triggers, policies, and schema changes are included.**

---

*Generated on: $(date)*
*Source: Live Supabase Database*
*Status: Production Ready*
