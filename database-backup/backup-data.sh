#!/bin/bash

# =====================================================
# PHOENIX FORCE CRICKET - DATA BACKUP SCRIPT
# =====================================================
# This script creates a backup of all table data
# 
# Usage: ./backup-data.sh
# =====================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="database-backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PROJECT_REF="ydhwhnwuzbjzsfhixsou"

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}PHOENIX FORCE CRICKET - DATA BACKUP${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI is not installed${NC}"
    echo "Please install it with: brew install supabase/tap/supabase"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📊 Backing up table data...${NC}"

# Create data backup with INSERT statements
echo -e "${BLUE}Creating data backup with INSERT statements...${NC}"
supabase db dump --linked --data-only --file "$BACKUP_DIR/DATA_BACKUP_$TIMESTAMP.sql" || {
    echo -e "${RED}Failed to create data backup${NC}"
    exit 1
}

# Create CSV exports for each table
echo -e "${BLUE}Creating CSV exports for each table...${NC}"

# List of tables to backup
TABLES=(
    "users"
    "players" 
    "tournaments"
    "tournament_slots"
    "teams"
    "team_players"
    "auction_bids"
    "auction_config"
    "notifications"
    "player_skills"
    "player_skill_values"
    "player_skill_assignments"
    "player_tags"
    "tags"
    "waitlist"
)

# Create CSV directory
mkdir -p "$BACKUP_DIR/csv-exports"

# Export each table to CSV
for table in "${TABLES[@]}"; do
    echo -e "${YELLOW}Exporting $table to CSV...${NC}"
    
    # Create CSV export using psql
    supabase db dump --linked --table="$table" --format=csv --file="$BACKUP_DIR/csv-exports/${table}_$TIMESTAMP.csv" || {
        echo -e "${YELLOW}Warning: Could not export $table (table might be empty)${NC}"
    }
done

# Create a comprehensive data backup script
echo -e "${BLUE}Creating comprehensive data restore script...${NC}"

cat > "$BACKUP_DIR/RESTORE_DATA_$TIMESTAMP.sql" << 'EOF'
-- =====================================================
-- PHOENIX FORCE CRICKET - DATA RESTORE SCRIPT
-- =====================================================
-- This script restores all table data
-- Generated on: TIMESTAMP_PLACEHOLDER
-- 
-- Usage: Run this script in Supabase SQL Editor
-- =====================================================

-- Disable triggers temporarily for faster import
SET session_replication_role = replica;

-- Restore data here (INSERT statements will be added by backup script)

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verify data restoration
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'players', COUNT(*) FROM players
UNION ALL
SELECT 'tournaments', COUNT(*) FROM tournaments
UNION ALL
SELECT 'tournament_slots', COUNT(*) FROM tournament_slots
UNION ALL
SELECT 'teams', COUNT(*) FROM teams
UNION ALL
SELECT 'team_players', COUNT(*) FROM team_players
UNION ALL
SELECT 'auction_bids', COUNT(*) FROM auction_bids
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'player_skills', COUNT(*) FROM player_skills
UNION ALL
SELECT 'player_skill_values', COUNT(*) FROM player_skill_values
UNION ALL
SELECT 'player_skill_assignments', COUNT(*) FROM player_skill_assignments
UNION ALL
SELECT 'player_tags', COUNT(*) FROM player_tags
UNION ALL
SELECT 'tags', COUNT(*) FROM tags
UNION ALL
SELECT 'waitlist', COUNT(*) FROM waitlist;
EOF

# Replace timestamp placeholder
sed -i.bak "s/TIMESTAMP_PLACEHOLDER/$TIMESTAMP/g" "$BACKUP_DIR/RESTORE_DATA_$TIMESTAMP.sql"
rm "$BACKUP_DIR/RESTORE_DATA_$TIMESTAMP.sql.bak"

echo ""
echo -e "${GREEN}✅ Data backup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📁 Backup files created:${NC}"
echo -e "   • $BACKUP_DIR/DATA_BACKUP_$TIMESTAMP.sql (SQL INSERT statements)"
echo -e "   • $BACKUP_DIR/csv-exports/ (CSV files for each table)"
echo -e "   • $BACKUP_DIR/RESTORE_DATA_$TIMESTAMP.sql (Restore script template)"
echo ""
echo -e "${YELLOW}💡 To restore data in the future:${NC}"
echo -e "   1. Run the SQL file in Supabase SQL Editor"
echo -e "   2. Or import CSV files using Supabase Dashboard"
echo ""
echo -e "${GREEN}🎉 Data backup process completed!${NC}"
