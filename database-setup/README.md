# Phoenix Force Database Setup

This directory contains scripts and tools for setting up and managing the Phoenix Force database.

## 📁 Files Overview

- `fetch-database-info.js` - Fetches comprehensive database information from Supabase
- `setup-project.js` - Sets up the project database from scratch
- `essential-supabase-queries.sql` - SQL queries for capturing Supabase configurations
- `setup-realtime.sql` - Standalone realtime configuration setup
- `setup-with-realtime.sql` - Complete database setup with realtime
- `schema/` - Directory containing generated database schema files
- `README.md` - This documentation file

## 🚀 Quick Start

### 1. Fetch Current Database Information

To capture the current state of your Supabase database:

```bash
cd database-setup
node fetch-database-info.js
```

This will create a `schema/` directory with:
- `tables.json` - All table schemas
- `rls-policies.json` - Row Level Security policies
- `functions.json` - Database functions
- `foreign-keys.json` - Table relationships
- `indexes.json` - Database indexes
- `triggers.json` - Database triggers
- `complete-schema.sql` - Complete SQL schema
- `setup-database.sql` - Setup script
- `DATABASE_DOCUMENTATION.md` - Comprehensive documentation

### 2. Set Up New Project

To set up a fresh Phoenix Force database:

```bash
cd database-setup
node setup-project.js
```

Options:
- `--with-sample-data` - Include sample tournaments and players
- `--skip-confirmation` - Skip confirmation prompts

Example:
```bash
node setup-project.js --with-sample-data
```

### 3. Alternative Setup Methods

#### **Complete Setup with Realtime:**
```bash
# Run the complete setup script with realtime configuration
psql -f setup-with-realtime.sql
```

#### **Realtime Only Setup:**
```bash
# Set up only realtime configuration
psql -f setup-realtime.sql
```

## 📋 Prerequisites

1. **Environment Variables**: Ensure your `.env.local` file contains:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. **Node.js Dependencies**: Make sure you have the required packages:
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

## 🔧 Script Details

### fetch-database-info.js

This script connects to your Supabase database and extracts:

- **Tables**: Complete table schemas with column definitions
- **RLS Policies**: Row Level Security policies for data protection
- **Functions**: Custom database functions and procedures
- **Relationships**: Foreign key constraints and table relationships
- **Indexes**: Database indexes for performance optimization
- **Triggers**: Database triggers for automated actions

**Usage:**
```bash
node fetch-database-info.js
```

### setup-project.js

This script sets up a complete Phoenix Force database including:

- Database schema creation
- RLS policy setup
- Function creation
- Realtime subscription configuration
- Admin user creation
- Optional sample data

**Usage:**
```bash
# Basic setup
node setup-project.js

# With sample data
node setup-project.js --with-sample-data

# Skip confirmations
node setup-project.js --skip-confirmation
```

## 📊 Generated Files

### Schema Files (JSON)

- **tables.json**: Complete table information with columns, types, and constraints
- **rls-policies.json**: Security policies for data access control
- **functions.json**: Database functions and stored procedures
- **foreign-keys.json**: Table relationships and constraints
- **indexes.json**: Database indexes for query optimization
- **triggers.json**: Automated database triggers
- **realtime-config.json**: Table-level realtime status
- **realtime-publications.json**: Realtime publication configurations

### SQL Files

- **complete-schema.sql**: Full database schema in SQL format
- **setup-database.sql**: Executable setup script for new installations
- **setup-with-realtime.sql**: Complete database setup with realtime configuration
- **setup-realtime.sql**: Standalone realtime configuration setup

### Documentation

- **DATABASE_DOCUMENTATION.md**: Comprehensive database documentation with:
  - Table descriptions and column details
  - Foreign key relationships
  - RLS policy explanations
  - Function documentation

## 🔒 Security Considerations

- The scripts use the Supabase Service Role Key for full database access
- RLS policies are automatically set up to secure data access
- Admin user is created with secure default credentials
- All sensitive operations require confirmation (unless `--skip-confirmation` is used)

## 🛠️ Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   ```
   Error: Missing required environment variables
   ```
   **Solution**: Ensure `.env.local` exists with correct Supabase credentials

2. **Permission Denied**
   ```
   Error: permission denied for table
   ```
   **Solution**: Verify your Service Role Key has proper permissions

3. **Schema Files Not Found**
   ```
   Error: No setup file found
   ```
   **Solution**: Run `fetch-database-info.js` first to generate schema files

### Debug Mode

For detailed error information, check the console output. The scripts provide comprehensive error messages and warnings.

## 📝 Customization

### Adding Custom Functions

1. Create your function in Supabase
2. Run `fetch-database-info.js` to capture it
3. The function will be included in future setups

### Modifying Sample Data

Edit the `addSampleData()` function in `setup-project.js` to customize the sample data that gets created.

### Custom RLS Policies

1. Create policies in Supabase
2. Run `fetch-database-info.js` to capture them
3. Policies will be automatically applied in new setups

## 🔄 Workflow

### For Development

1. Make database changes in Supabase
2. Run `fetch-database-info.js` to capture changes
3. Commit the updated schema files to version control

### For New Installations

1. Clone the repository
2. Set up environment variables
3. Run `setup-project.js` to create the database
4. Start the application

### For Team Collaboration

1. Share the `schema/` directory with your team
2. Team members can run `setup-project.js` to get the same database structure
3. Keep schema files updated in version control

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your Supabase credentials and permissions
3. Ensure all dependencies are installed
4. Check the console output for detailed error messages

## 🔄 Version Control

It's recommended to commit the `schema/` directory to version control so that:

- Team members can set up identical database structures
- Database changes are tracked over time
- New installations can be set up consistently
- Database documentation stays up to date
