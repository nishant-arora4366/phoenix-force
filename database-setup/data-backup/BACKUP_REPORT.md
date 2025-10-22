# Complete Database Backup Report

**Generated:** 2025-10-22T05:46:16.733Z
**Database URL:** https://ydhwhnwuzbjzsfhixsou.supabase.co

## Table Data Summary
- **users**: 63 records
- **players**: 293 records
- **tournaments**: 2 records
- **tournament_slots**: 62 records
- **auctions**: 2 records
- **auction_teams**: 6 records
- **auction_players**: 48 records
- **player_skills**: 5 records
- **player_skill_values**: 21 records
- **player_skill_assignments**: 1414 records
- **notifications**: 37 records
- **api_usage_analytics**: 27082 records

**Total Records:** 29035

## Schema Information
- **Tables:** 0
- **Functions:** 0
- **Policies:** 0
- **Triggers:** 0

## Realtime Configuration
- **Publications:** 0
- **Subscriptions:** 0

## Storage Information
- **Buckets:** 2
- **Total Files:** 40

## Files Generated
- `complete-database-backup.sql` - Complete SQL backup
- `database-schema.json` - Schema information
- `realtime-config.json` - Realtime configuration
- `storage-info.json` - Storage information
- `json/` - Individual table JSON files
- `sql/` - Individual table SQL files

## Usage
To restore this backup, use the SQL files in the appropriate order:
1. Run schema creation scripts first
2. Run data insertion scripts
3. Apply policies and triggers
4. Configure realtime settings
