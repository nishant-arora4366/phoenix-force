#!/bin/bash

# Phoenix Force Docker Database Setup Script
# This script sets up a complete local development environment with PostgreSQL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
WITH_DATA=false
SKIP_CONFIRMATION=false
BUILD_IMAGE=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --with-data)
      WITH_DATA=true
      shift
      ;;
    --skip-confirmation)
      SKIP_CONFIRMATION=true
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
      echo "  --with-data         Include sample data in setup"
      echo "  --skip-confirmation Skip confirmation prompts"
      echo "  --build            Build Docker image before running"
      echo "  --help             Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                           # Basic setup"
      echo "  $0 --with-data              # Setup with sample data"
      echo "  $0 --skip-confirmation      # Setup without prompts"
      echo "  $0 --build                  # Build image and setup"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}🐳 Phoenix Force Docker Database Setup${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local file not found${NC}"
    echo "Creating .env.local template..."
    cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Local PostgreSQL Configuration (for local development)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=phoenix_force
POSTGRES_USER=phoenix_user
POSTGRES_PASSWORD=phoenix_password
EOF
    echo -e "${GREEN}✅ Created .env.local template${NC}"
    echo -e "${YELLOW}⚠️  Please update .env.local with your actual Supabase credentials${NC}"
    echo ""
fi

# Build Docker image if requested
if [ "$BUILD_IMAGE" = true ]; then
    echo -e "${YELLOW}🔨 Building Docker image...${NC}"
    docker-compose build phoenix-db-setup
    echo ""
fi

# Show setup options
echo -e "${GREEN}📋 Setup Configuration:${NC}"
echo -e "   📊 Include Sample Data: ${WITH_DATA}"
echo -e "   🔇 Skip Confirmation: ${SKIP_CONFIRMATION}"
echo ""

# Confirmation prompt (unless skipped)
if [ "$SKIP_CONFIRMATION" = false ]; then
    echo -e "${YELLOW}⚠️  This will set up a local PostgreSQL database${NC}"
    echo -e "${YELLOW}⚠️  Ports 5432 (PostgreSQL) and 8080 (pgAdmin) will be used${NC}"
    echo ""
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}ℹ️  Setup cancelled by user${NC}"
        exit 0
    fi
fi

echo -e "${GREEN}🚀 Starting local database setup...${NC}"
echo ""

# Start local PostgreSQL database
echo -e "${BLUE}🐘 Starting PostgreSQL database...${NC}"
docker-compose --profile local-db up -d postgres

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
sleep 10

# Check if PostgreSQL is ready
until docker-compose exec postgres pg_isready -U phoenix_user -d phoenix_force; do
    echo -e "${YELLOW}⏳ Still waiting for PostgreSQL...${NC}"
    sleep 2
done

echo -e "${GREEN}✅ PostgreSQL is ready!${NC}"

# Start pgAdmin
echo -e "${BLUE}🔧 Starting pgAdmin...${NC}"
docker-compose --profile local-db up -d pgadmin

# Wait for pgAdmin to be ready
echo -e "${YELLOW}⏳ Waiting for pgAdmin to be ready...${NC}"
sleep 5

echo -e "${GREEN}✅ pgAdmin is ready!${NC}"

# Run database setup
echo -e "${BLUE}📊 Setting up database schema...${NC}"

# Prepare setup arguments
SETUP_ARGS=""
if [ "$WITH_DATA" = true ]; then
    SETUP_ARGS="$SETUP_ARGS --with-sample-data"
fi
if [ "$SKIP_CONFIRMATION" = true ]; then
    SETUP_ARGS="$SETUP_ARGS --skip-confirmation"
fi

# Run setup in Docker container
docker-compose run --rm \
    -e POSTGRES_HOST=postgres \
    -e POSTGRES_PORT=5432 \
    -e POSTGRES_DB=phoenix_force \
    -e POSTGRES_USER=phoenix_user \
    -e POSTGRES_PASSWORD=phoenix_password \
    phoenix-db-setup \
    node setup-project.js $SETUP_ARGS

# Check if setup was successful
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Database setup completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Local Development Environment:${NC}"
    echo -e "   🐘 PostgreSQL: localhost:5432"
    echo -e "   📊 Database: phoenix_force"
    echo -e "   👤 User: phoenix_user"
    echo -e "   🔑 Password: phoenix_password"
    echo ""
    echo -e "${BLUE}🔧 Database Management:${NC}"
    echo -e "   🌐 pgAdmin: http://localhost:8080"
    echo -e "   📧 Email: admin@phoenixforce.com"
    echo -e "   🔑 Password: admin123"
    echo ""
    echo -e "${BLUE}📁 Useful Commands:${NC}"
    echo -e "   📊 View logs: docker-compose logs postgres"
    echo -e "   🛑 Stop services: docker-compose --profile local-db down"
    echo -e "   🔄 Restart services: docker-compose --profile local-db restart"
    echo -e "   🗑️  Remove everything: docker-compose --profile local-db down -v"
    echo ""
    echo -e "${GREEN}🎉 Your local Phoenix Force database is ready!${NC}"
else
    echo ""
    echo -e "${RED}❌ Database setup failed!${NC}"
    echo -e "${YELLOW}💡 Check the logs above for error details${NC}"
    exit 1
fi
