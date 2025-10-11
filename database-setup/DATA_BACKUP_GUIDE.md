# Phoenix Force Data Backup & Restoration Guide

This guide covers the comprehensive data backup and restoration system for Phoenix Force, including both native Node.js and Docker-based approaches.

## 📊 Current Backup Status

**Backup Date:** 2025-10-11T12:08:28.772Z  
**Total Tables:** 14  
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
| `auction_bids` | 0 | Bidding history (empty) |
| `auction_config` | 0 | Auction settings (empty) |
| `notifications` | 21 | User notifications |
| `api_usage_analytics` | 1,000 | API usage tracking |

## 🚀 Quick Start

### 1. Native Node.js Approach

```bash
# Install dependencies
npm install

# Create backup
npm run backup

# Restore data
npm run restore:json
```

### 2. Docker Approach

```bash
# Build Docker image
npm run docker:build

# Create backup
npm run docker:backup

# Restore data
npm run docker:restore:json
```

## 📁 Backup Structure

```
data-backup/
├── backup-summary.json          # Backup metadata and statistics
├── BACKUP_REPORT.md            # Human-readable backup report
├── complete-data-backup.sql    # Single SQL file with all data
├── json/                       # Individual table JSON files
│   ├── users.json
│   ├── players.json
│   ├── tournaments.json
│   └── ... (all tables)
└── sql/                        # Individual table SQL files
    ├── users.sql
    ├── players.sql
    ├── tournaments.sql
    └── ... (all tables)
```

## 🔧 Available Commands

### Native Commands

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

### Docker Commands

| Command | Description |
|---------|-------------|
| `npm run docker:build` | Build Docker image |
| `npm run docker:backup` | Docker backup (JSON + SQL) |
| `npm run docker:backup:json` | Docker JSON backup |
| `npm run docker:backup:sql` | Docker SQL backup |
| `npm run docker:restore` | Docker restore from JSON |
| `npm run docker:restore:json` | Docker restore from JSON |
| `npm run docker:restore:sql` | Docker restore from SQL |
| `npm run docker:restore:complete` | Docker restore from complete SQL |
| `npm run docker:restore:dry-run` | Docker test restore |
| `npm run docker:setup` | Set up local PostgreSQL |
| `npm run docker:setup:with-data` | Set up with sample data |
| `npm run docker:local-db` | Start local database |
| `npm run docker:local-db:down` | Stop local database |
| `npm run docker:local-db:logs` | View database logs |

## 🏗️ Production Deployment

### Option 1: Complete Database Recreation

```bash
# 1. Set up schema
psql -f schema/setup-with-realtime.sql

# 2. Restore data
psql -f data-backup/complete-data-backup.sql
```

### Option 2: Individual Table Restoration

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
psql -f data-backup/sql/auction_bids.sql
psql -f data-backup/sql/auction_config.sql
psql -f data-backup/sql/notifications.sql
psql -f data-backup/sql/api_usage_analytics.sql
```

### Option 3: Docker-Based Deployment

```bash
# 1. Build and run setup
npm run docker:build
npm run docker:setup:with-data

# 2. Or restore from existing backup
npm run docker:restore:complete
```

## 🔄 Regular Backup Schedule

### Automated Backup (Cron)

```bash
# Add to crontab for daily backups at 2 AM
0 2 * * * cd /path/to/phoenix-force/database-setup && npm run backup
```

### Docker Automated Backup

```bash
# Add to crontab for daily Docker backups
0 2 * * * cd /path/to/phoenix-force/database-setup && npm run docker:backup
```

## 🛡️ Data Integrity

### Backup Verification

```bash
# Verify backup integrity
node -e "
const fs = require('fs');
const summary = JSON.parse(fs.readFileSync('data-backup/backup-summary.json'));
console.log('Backup Date:', summary.backup_timestamp);
console.log('Total Records:', summary.total_records);
console.log('Successful Tables:', summary.successful_backups);
"
```

### Restore Verification

```bash
# Test restore without making changes
npm run restore:dry-run
# or
npm run docker:restore:dry-run
```

## 🚨 Troubleshooting

### Common Issues

1. **Environment Variables Missing**
   ```bash
   # Check .env.local file
   cat .env.local
   ```

2. **Docker Not Running**
   ```bash
   # Check Docker status
   docker info
   ```

3. **Permission Issues**
   ```bash
   # Make scripts executable
   chmod +x *.sh *.js
   ```

4. **Backup Directory Not Found**
   ```bash
   # Create backup directory
   mkdir -p data-backup/json data-backup/sql
   ```

### Recovery Procedures

1. **Partial Restore Failure**
   ```bash
   # Check restoration summary
   cat data-backup/restoration-summary.json
   ```

2. **Schema Mismatch**
   ```bash
   # Re-run schema setup first
   psql -f schema/setup-with-realtime.sql
   ```

3. **Foreign Key Violations**
   ```bash
   # Restore in correct order (see production deployment section)
   ```

## 📈 Monitoring & Maintenance

### Backup Health Check

```bash
# Check backup age
find data-backup -name "backup-summary.json" -mtime +7 -exec echo "Backup older than 7 days: {}" \;
```

### Storage Management

```bash
# Check backup size
du -sh data-backup/

# Clean old backups (keep last 7 days)
find data-backup -name "*.json" -mtime +7 -delete
find data-backup -name "*.sql" -mtime +7 -delete
```

## 🔐 Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Service Role Key**: Keep Supabase service role key secure
3. **Backup Storage**: Store backups in secure, encrypted locations
4. **Access Control**: Limit access to backup files and restoration scripts

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backup/restoration logs
3. Verify environment configuration
4. Test with dry-run mode first

---

*This backup system provides a complete solution for Phoenix Force database management, supporting both development and production environments.*
