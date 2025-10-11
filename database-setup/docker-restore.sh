#!/bin/bash

# Phoenix Force Docker Database Restore Script
# This script runs the restore process in a Docker container

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
SOURCE="json"
BACKUP_DIR="data-backup"
DRY_RUN=false
FORCE=false
BUILD_IMAGE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --source=*)
      SOURCE="${1#*=}"
      shift
      ;;
    --backup-dir=*)
      BACKUP_DIR="${1#*=}"
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --force)
      FORCE=true
      shift
      ;;
    --build)
      BUILD_IMAGE=true
      shift
      ;;
    --help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --source=SOURCE     Restore source: json, sql, or complete (default: json)"
      echo "  --backup-dir=DIR    Backup directory (default: data-backup)"
      echo "  --dry-run          Test restore without making changes"
      echo "  --force            Force restore (clear existing data)"
      echo "  --build            Build Docker image before running"
      echo "  --help             Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                           # Restore from JSON backup"
      echo "  $0 --source=sql             # Restore from SQL backup"
      echo "  $0 --source=complete        # Restore from complete SQL file"
      echo "  $0 --dry-run                # Test restore without changes"
      echo "  $0 --force                  # Force restore (clear existing data)"
      echo "  $0 --build                  # Build image and restore"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🐳 Phoenix Force Docker Database Restore${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ Error: .env.local file not found${NC}"
    echo "Please create .env.local with your Supabase credentials:"
    echo "  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url"
    echo "  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    exit 1
fi

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}❌ Error: Backup directory not found: $BACKUP_DIR${NC}"
    echo "Please run backup first or specify correct backup directory with --backup-dir"
    exit 1
fi

# Check if backup summary exists
if [ ! -f "$BACKUP_DIR/backup-summary.json" ]; then
    echo -e "${RED}❌ Error: Backup summary not found: $BACKUP_DIR/backup-summary.json${NC}"
    echo "Please ensure you have a valid backup directory"
    exit 1
fi

# Build Docker image if requested
if [ "$BUILD_IMAGE" = true ]; then
    echo -e "${YELLOW}🔨 Building Docker image...${NC}"
    docker-compose build phoenix-db-setup
    echo ""
fi

# Show backup information
echo -e "${GREEN}📋 Backup Information:${NC}"
BACKUP_DATE=$(cat "$BACKUP_DIR/backup-summary.json" | grep -o '"backup_timestamp":"[^"]*"' | cut -d'"' -f4)
TOTAL_RECORDS=$(cat "$BACKUP_DIR/backup-summary.json" | grep -o '"total_records":[0-9]*' | cut -d':' -f2)
TOTAL_TABLES=$(cat "$BACKUP_DIR/backup-summary.json" | grep -o '"total_tables":[0-9]*' | cut -d':' -f2)

echo -e "   📅 Backup Date: $BACKUP_DATE"
echo -e "   📊 Total Records: $TOTAL_RECORDS"
echo -e "   📋 Total Tables: $TOTAL_TABLES"
echo ""

# Confirmation prompt (unless dry run)
if [ "$DRY_RUN" = false ]; then
    echo -e "${YELLOW}⚠️  WARNING: This will restore data to your database!${NC}"
    if [ "$FORCE" = true ]; then
        echo -e "${YELLOW}⚠️  FORCE MODE: Existing data will be cleared!${NC}"
    fi
    echo ""
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}ℹ️  Restore cancelled by user${NC}"
        exit 0
    fi
fi

echo -e "${GREEN}🚀 Starting restore process...${NC}"
echo -e "📋 Source: ${SOURCE}"
echo -e "📁 Backup Directory: ${BACKUP_DIR}"
echo -e "🔍 Dry Run: ${DRY_RUN}"
echo -e "💥 Force: ${FORCE}"
echo ""

# Prepare arguments
RESTORE_ARGS="--source=$SOURCE --backup-dir=$BACKUP_DIR"
if [ "$DRY_RUN" = true ]; then
    RESTORE_ARGS="$RESTORE_ARGS --dry-run"
fi
if [ "$FORCE" = true ]; then
    RESTORE_ARGS="$RESTORE_ARGS --force"
fi

# Run restore in Docker container
docker-compose run --rm \
    -e RESTORE_SOURCE="$SOURCE" \
    -e RESTORE_BACKUP_DIR="$BACKUP_DIR" \
    -e RESTORE_DRY_RUN="$DRY_RUN" \
    -e RESTORE_FORCE="$FORCE" \
    phoenix-db-setup \
    node restore-data.js $RESTORE_ARGS

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Restore completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Restore Summary:${NC}"
    if [ -f "$BACKUP_DIR/restoration-summary.json" ]; then
        echo -e "   📊 $(cat "$BACKUP_DIR/restoration-summary.json" | grep -o '"total_records":[0-9]*' | cut -d':' -f2) total records restored"
        echo -e "   📋 $(cat "$BACKUP_DIR/restoration-summary.json" | grep -o '"total_tables":[0-9]*' | cut -d':' -f2) tables processed"
        echo -e "   ✅ $(cat "$BACKUP_DIR/restoration-summary.json" | grep -o '"successful_restorations":[0-9]*' | cut -d':' -f2) successful"
        echo -e "   ❌ $(cat "$BACKUP_DIR/restoration-summary.json" | grep -o '"failed_restorations":[0-9]*' | cut -d':' -f2) failed"
    fi
    echo ""
    echo -e "${BLUE}📁 Generated Files:${NC}"
    echo -e "   📄 $BACKUP_DIR/restoration-summary.json"
    echo -e "   📄 $BACKUP_DIR/RESTORATION_REPORT.md"
else
    echo ""
    echo -e "${RED}❌ Restore failed!${NC}"
    exit 1
fi
