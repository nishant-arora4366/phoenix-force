#!/bin/bash

# Phoenix Force Docker Database Backup Script
# This script runs the backup process in a Docker container

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
FORMAT="both"
OUTPUT_DIR="data-backup"
BUILD_IMAGE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --format=*)
      FORMAT="${1#*=}"
      shift
      ;;
    --output=*)
      OUTPUT_DIR="${1#*=}"
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
      echo "  --format=FORMAT    Backup format: json, sql, or both (default: both)"
      echo "  --output=DIR       Output directory (default: data-backup)"
      echo "  --build           Build Docker image before running"
      echo "  --help            Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                           # Full backup (JSON + SQL)"
      echo "  $0 --format=json            # JSON only"
      echo "  $0 --format=sql             # SQL only"
      echo "  $0 --build                  # Build image and backup"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🐳 Phoenix Force Docker Database Backup${NC}"
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

# Build Docker image if requested
if [ "$BUILD_IMAGE" = true ]; then
    echo -e "${YELLOW}🔨 Building Docker image...${NC}"
    docker-compose build phoenix-db-setup
    echo ""
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo -e "${GREEN}🚀 Starting backup process...${NC}"
echo -e "📋 Format: ${FORMAT}"
echo -e "📁 Output: ${OUTPUT_DIR}"
echo ""

# Run backup in Docker container
docker-compose run --rm \
    -e BACKUP_FORMAT="$FORMAT" \
    -e BACKUP_OUTPUT="$OUTPUT_DIR" \
    phoenix-db-setup \
    node backup-data.js --format="$FORMAT" --output="$OUTPUT_DIR"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo -e "${GREEN}📁 Backup files saved to: ${OUTPUT_DIR}/${NC}"
    echo ""
    echo -e "${BLUE}📋 Backup Summary:${NC}"
    if [ -f "$OUTPUT_DIR/backup-summary.json" ]; then
        echo -e "   📊 $(cat "$OUTPUT_DIR/backup-summary.json" | grep -o '"total_records":[0-9]*' | cut -d':' -f2) total records"
        echo -e "   📋 $(cat "$OUTPUT_DIR/backup-summary.json" | grep -o '"total_tables":[0-9]*' | cut -d':' -f2) tables backed up"
    fi
    echo ""
    echo -e "${BLUE}📁 Generated Files:${NC}"
    echo -e "   📄 $OUTPUT_DIR/backup-summary.json"
    echo -e "   📄 $OUTPUT_DIR/BACKUP_REPORT.md"
    if [ "$FORMAT" = "sql" ] || [ "$FORMAT" = "both" ]; then
        echo -e "   📄 $OUTPUT_DIR/complete-data-backup.sql"
    fi
    if [ "$FORMAT" = "json" ] || [ "$FORMAT" = "both" ]; then
        echo -e "   📁 $OUTPUT_DIR/json/ (individual table JSON files)"
    fi
    if [ "$FORMAT" = "sql" ] || [ "$FORMAT" = "both" ]; then
        echo -e "   📁 $OUTPUT_DIR/sql/ (individual table SQL files)"
    fi
else
    echo ""
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi
