#!/usr/bin/env node

/**
 * Phoenix Force Database Data Backup System
 * 
 * This script extracts all data from the current database tables
 * and creates comprehensive backup files for future production/development use.
 * 
 * Usage:
 *   node backup-data.js
 *   node backup-data.js --format=json
 *   node backup-data.js --format=sql
 *   node backup-data.js --format=both
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const format = args.find(arg => arg.startsWith('--format='))?.split('=')[1] || 'both';
const outputDir = args.find(arg => arg.startsWith('--output='))?.split('=')[1] || 'data-backup';

// Table names to backup (excluding system tables)
const TABLES_TO_BACKUP = [
  'users',
  'players',
  'tournaments',
  'tournament_slots',
  'player_skills',
  'player_skill_values',
  'player_skill_assignments',
  'auctions',
  'auction_teams',
  'auction_players',
  'auction_bids',
  'auction_config',
  'notifications',
  'api_usage_analytics'
];

// Create output directory
async function createOutputDirectory() {
  try {
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(path.join(outputDir, 'json'), { recursive: true });
    await fs.mkdir(path.join(outputDir, 'sql'), { recursive: true });
    console.log(`📁 Created backup directory: ${outputDir}`);
  } catch (error) {
    console.error('❌ Error creating output directory:', error.message);
    process.exit(1);
  }
}

// Get table information
async function getTableInfo(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_name', tableName)
      .eq('table_schema', 'public')
      .single();

    if (error) {
      console.warn(`⚠️  Could not get info for table ${tableName}:`, error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.warn(`⚠️  Error getting table info for ${tableName}:`, error.message);
    return null;
  }
}

// Backup table data to JSON
async function backupTableToJSON(tableName) {
  try {
    console.log(`📊 Backing up ${tableName} to JSON...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');

    if (error) {
      console.error(`❌ Error backing up ${tableName}:`, error.message);
      return null;
    }

    const backupData = {
      table_name: tableName,
      backup_timestamp: new Date().toISOString(),
      record_count: data.length,
      data: data
    };

    const filename = path.join(outputDir, 'json', `${tableName}.json`);
    await fs.writeFile(filename, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ ${tableName}: ${data.length} records backed up to JSON`);
    return backupData;
  } catch (error) {
    console.error(`❌ Error backing up ${tableName} to JSON:`, error.message);
    return null;
  }
}

// Generate SQL INSERT statements
function generateSQLInserts(tableName, data) {
  if (!data || data.length === 0) {
    return `-- No data to insert for table ${tableName}\n`;
  }

  let sql = `-- Data backup for table: ${tableName}\n`;
  sql += `-- Backup timestamp: ${new Date().toISOString()}\n`;
  sql += `-- Record count: ${data.length}\n\n`;

  // Get column names from first record
  const columns = Object.keys(data[0]);
  const columnList = columns.join(', ');

  sql += `-- Disable foreign key checks temporarily\n`;
  sql += `SET session_replication_role = replica;\n\n`;

  sql += `-- Insert data\n`;
  data.forEach((record, index) => {
    const values = columns.map(col => {
      const value = record[col];
      if (value === null) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      if (typeof value === 'boolean') return value;
      if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      return value;
    }).join(', ');

    sql += `INSERT INTO ${tableName} (${columnList}) VALUES (${values});\n`;
  });

  sql += `\n-- Re-enable foreign key checks\n`;
  sql += `SET session_replication_role = DEFAULT;\n\n`;

  return sql;
}

// Backup table data to SQL
async function backupTableToSQL(tableName, data) {
  try {
    console.log(`📊 Backing up ${tableName} to SQL...`);
    
    const sql = generateSQLInserts(tableName, data);
    const filename = path.join(outputDir, 'sql', `${tableName}.sql`);
    await fs.writeFile(filename, sql);
    
    console.log(`✅ ${tableName}: SQL backup created`);
    return true;
  } catch (error) {
    console.error(`❌ Error backing up ${tableName} to SQL:`, error.message);
    return false;
  }
}

// Create comprehensive backup summary
async function createBackupSummary(backupResults) {
  const summary = {
    backup_timestamp: new Date().toISOString(),
    total_tables: TABLES_TO_BACKUP.length,
    successful_backups: backupResults.filter(r => r.success).length,
    failed_backups: backupResults.filter(r => !r.success).length,
    total_records: backupResults.reduce((sum, r) => sum + (r.record_count || 0), 0),
    tables: backupResults.map(r => ({
      table_name: r.table_name,
      success: r.success,
      record_count: r.record_count || 0,
      error: r.error || null
    }))
  };

  // Save summary as JSON
  const summaryFile = path.join(outputDir, 'backup-summary.json');
  await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));

  // Create human-readable report
  const report = `# Phoenix Force Database Backup Report

**Backup Date:** ${summary.backup_timestamp}
**Total Tables:** ${summary.total_tables}
**Successful Backups:** ${summary.successful_backups}
**Failed Backups:** ${summary.failed_backups}
**Total Records:** ${summary.total_records.toLocaleString()}

## Table Details

| Table Name | Status | Record Count |
|------------|--------|--------------|
${summary.tables.map(t => `| ${t.table_name} | ${t.success ? '✅ Success' : '❌ Failed'} | ${t.record_count.toLocaleString()} |`).join('\n')}

## Files Generated

### JSON Format
${summary.tables.filter(t => t.success).map(t => `- \`json/${t.table_name}.json\` (${t.record_count} records)`).join('\n')}

### SQL Format
${summary.tables.filter(t => t.success).map(t => `- \`sql/${t.table_name}.sql\` (${t.record_count} records)`).join('\n')}

## Usage Instructions

### Restore from JSON
\`\`\`bash
# Use the setup-project.js script with --with-sample-data flag
node setup-project.js --with-sample-data
\`\`\`

### Restore from SQL
\`\`\`bash
# Run individual table SQL files
psql -f sql/users.sql
psql -f sql/players.sql
# ... etc for each table
\`\`\`

### Complete Database Restore
\`\`\`bash
# First restore schema
psql -f schema/setup-with-realtime.sql

# Then restore data (run in order to respect foreign keys)
psql -f sql/users.sql
psql -f sql/players.sql
psql -f sql/tournaments.sql
psql -f sql/tournament_slots.sql
psql -f sql/player_skills.sql
psql -f sql/player_skill_values.sql
psql -f sql/player_skill_assignments.sql
psql -f sql/auctions.sql
psql -f sql/auction_teams.sql
psql -f sql/auction_players.sql
psql -f sql/auction_bids.sql
psql -f sql/auction_config.sql
psql -f sql/notifications.sql
psql -f sql/api_usage_analytics.sql
\`\`\`

---
*Generated by Phoenix Force Database Backup System*
`;

  const reportFile = path.join(outputDir, 'BACKUP_REPORT.md');
  await fs.writeFile(reportFile, report);

  console.log(`📋 Backup summary created: ${summaryFile}`);
  console.log(`📋 Backup report created: ${reportFile}`);
  
  return summary;
}

// Create master SQL file with all data
async function createMasterSQLFile(backupResults) {
  try {
    console.log('📊 Creating master SQL file...');
    
    let masterSQL = `-- Phoenix Force Database Complete Data Backup\n`;
    masterSQL += `-- Generated: ${new Date().toISOString()}\n`;
    masterSQL += `-- Total Tables: ${backupResults.length}\n`;
    masterSQL += `-- Total Records: ${backupResults.reduce((sum, r) => sum + (r.record_count || 0), 0)}\n\n`;

    masterSQL += `-- Disable foreign key checks\n`;
    masterSQL += `SET session_replication_role = replica;\n\n`;

    // Add data for each table in dependency order
    const dependencyOrder = [
      'users',
      'players', 
      'tournaments',
      'tournament_slots',
      'player_skills',
      'player_skill_values',
      'player_skill_assignments',
      'auctions',
      'auction_teams',
      'auction_players',
      'auction_bids',
      'auction_config',
      'notifications',
      'api_usage_analytics'
    ];

    for (const tableName of dependencyOrder) {
      const result = backupResults.find(r => r.table_name === tableName);
      if (result && result.success && result.data) {
        masterSQL += `-- Table: ${tableName} (${result.record_count} records)\n`;
        masterSQL += generateSQLInserts(tableName, result.data);
        masterSQL += `\n`;
      }
    }

    masterSQL += `-- Re-enable foreign key checks\n`;
    masterSQL += `SET session_replication_role = DEFAULT;\n\n`;
    masterSQL += `-- Backup completed successfully\n`;

    const masterFile = path.join(outputDir, 'complete-data-backup.sql');
    await fs.writeFile(masterFile, masterSQL);
    
    console.log(`✅ Master SQL file created: ${masterFile}`);
    return true;
  } catch (error) {
    console.error('❌ Error creating master SQL file:', error.message);
    return false;
  }
}

// Main backup function
async function performBackup() {
  console.log('🚀 Starting Phoenix Force Database Backup...');
  console.log(`📅 Backup Date: ${new Date().toISOString()}`);
  console.log(`📁 Output Directory: ${outputDir}`);
  console.log(`📋 Format: ${format}`);
  console.log('');

  await createOutputDirectory();

  const backupResults = [];

  for (const tableName of TABLES_TO_BACKUP) {
    console.log(`\n🔄 Processing table: ${tableName}`);
    
    try {
      let data = null;
      let success = false;
      let recordCount = 0;
      let error = null;

      // Backup to JSON if requested
      if (format === 'json' || format === 'both') {
        const jsonResult = await backupTableToJSON(tableName);
        if (jsonResult) {
          data = jsonResult.data;
          recordCount = jsonResult.record_count;
          success = true;
        } else {
          error = `Failed to backup ${tableName} to JSON`;
        }
      }

      // Backup to SQL if requested
      if (format === 'sql' || format === 'both') {
        if (data || format === 'sql') {
          // If we don't have data yet, fetch it
          if (!data) {
            const { data: tableData, error: fetchError } = await supabase
              .from(tableName)
              .select('*');
            
            if (fetchError) {
              error = fetchError.message;
            } else {
              data = tableData;
              recordCount = data.length;
            }
          }
          
          if (data) {
            const sqlSuccess = await backupTableToSQL(tableName, data);
            if (sqlSuccess) {
              success = true;
            } else if (!error) {
              error = `Failed to backup ${tableName} to SQL`;
            }
          }
        }
      }

      backupResults.push({
        table_name: tableName,
        success,
        record_count: recordCount,
        data: data,
        error
      });

    } catch (error) {
      console.error(`❌ Unexpected error processing ${tableName}:`, error.message);
      backupResults.push({
        table_name: tableName,
        success: false,
        record_count: 0,
        data: null,
        error: error.message
      });
    }
  }

  // Create summary and reports
  console.log('\n📋 Creating backup summary...');
  const summary = await createBackupSummary(backupResults);

  // Create master SQL file if SQL format is requested
  if (format === 'sql' || format === 'both') {
    await createMasterSQLFile(backupResults);
  }

  // Final report
  console.log('\n🎉 Backup completed!');
  console.log(`📊 Total Tables: ${summary.total_tables}`);
  console.log(`✅ Successful: ${summary.successful_backups}`);
  console.log(`❌ Failed: ${summary.failed_backups}`);
  console.log(`📈 Total Records: ${summary.total_records.toLocaleString()}`);
  console.log(`📁 Output Directory: ${outputDir}`);
  console.log('\n📋 Check the following files:');
  console.log(`   - ${outputDir}/backup-summary.json`);
  console.log(`   - ${outputDir}/BACKUP_REPORT.md`);
  if (format === 'sql' || format === 'both') {
    console.log(`   - ${outputDir}/complete-data-backup.sql`);
  }

  if (summary.failed_backups > 0) {
    console.log('\n⚠️  Some backups failed. Check the summary for details.');
    process.exit(1);
  }
}

// Run the backup
if (require.main === module) {
  performBackup().catch(error => {
    console.error('❌ Backup failed:', error.message);
    process.exit(1);
  });
}

module.exports = { performBackup, TABLES_TO_BACKUP };
