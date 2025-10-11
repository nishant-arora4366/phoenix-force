#!/usr/bin/env node

/**
 * Phoenix Force Database Data Restoration System
 * 
 * This script restores data from backup files created by backup-data.js
 * 
 * Usage:
 *   node restore-data.js
 *   node restore-data.js --source=json
 *   node restore-data.js --source=sql
 *   node restore-data.js --source=complete
 *   node restore-data.js --dry-run
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
require('dotenv').config();

const execAsync = promisify(exec);

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
const source = args.find(arg => arg.startsWith('--source='))?.split('=')[1] || 'json';
const backupDir = args.find(arg => arg.startsWith('--backup-dir='))?.split('=')[1] || 'data-backup';
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

// Table restoration order (respecting foreign key dependencies)
const RESTORATION_ORDER = [
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

// Check if backup directory exists
async function checkBackupDirectory() {
  try {
    await fs.access(backupDir);
    console.log(`📁 Found backup directory: ${backupDir}`);
    return true;
  } catch (error) {
    console.error(`❌ Backup directory not found: ${backupDir}`);
    console.error('   Please run backup-data.js first to create backup files.');
    process.exit(1);
  }
}

// Load backup summary
async function loadBackupSummary() {
  try {
    const summaryFile = path.join(backupDir, 'backup-summary.json');
    const summaryData = await fs.readFile(summaryFile, 'utf8');
    const summary = JSON.parse(summaryData);
    
    console.log(`📋 Loaded backup summary from: ${summary.backup_timestamp}`);
    console.log(`📊 Total tables: ${summary.total_tables}, Records: ${summary.total_records.toLocaleString()}`);
    
    return summary;
  } catch (error) {
    console.error('❌ Could not load backup summary:', error.message);
    process.exit(1);
  }
}

// Restore table from JSON
async function restoreTableFromJSON(tableName, dryRun = false) {
  try {
    const jsonFile = path.join(backupDir, 'json', `${tableName}.json`);
    const jsonData = await fs.readFile(jsonFile, 'utf8');
    const backup = JSON.parse(jsonData);
    
    if (!backup.data || backup.data.length === 0) {
      console.log(`⚠️  No data to restore for ${tableName}`);
      return { success: true, record_count: 0 };
    }

    if (dryRun) {
      console.log(`🔍 [DRY RUN] Would restore ${tableName}: ${backup.record_count} records`);
      return { success: true, record_count: backup.record_count };
    }

    console.log(`📊 Restoring ${tableName}: ${backup.record_count} records...`);

    // Clear existing data first (if force flag is set)
    if (force) {
      console.log(`🗑️  Clearing existing data in ${tableName}...`);
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
      if (deleteError) {
        console.warn(`⚠️  Could not clear existing data in ${tableName}:`, deleteError.message);
      }
    }

    // Insert data in batches to avoid timeout
    const batchSize = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < backup.data.length; i += batchSize) {
      const batch = backup.data.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from(tableName)
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i/batchSize) + 1} for ${tableName}:`, error.message);
        return { success: false, record_count: totalInserted, error: error.message };
      }

      totalInserted += data.length;
      console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${data.length} records inserted`);
    }

    console.log(`✅ ${tableName}: ${totalInserted} records restored`);
    return { success: true, record_count: totalInserted };
    
  } catch (error) {
    console.error(`❌ Error restoring ${tableName} from JSON:`, error.message);
    return { success: false, record_count: 0, error: error.message };
  }
}

// Restore table from SQL
async function restoreTableFromSQL(tableName, dryRun = false) {
  try {
    const sqlFile = path.join(backupDir, 'sql', `${tableName}.sql`);
    
    if (dryRun) {
      console.log(`🔍 [DRY RUN] Would restore ${tableName} from SQL file`);
      return { success: true, record_count: 0 };
    }

    console.log(`📊 Restoring ${tableName} from SQL...`);

    // Read SQL file
    const sqlContent = await fs.readFile(sqlFile, 'utf8');
    
    // For now, we'll use Supabase client to execute the SQL
    // In a real scenario, you might want to use psql directly
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });
    
    if (error) {
      console.error(`❌ Error executing SQL for ${tableName}:`, error.message);
      return { success: false, record_count: 0, error: error.message };
    }

    console.log(`✅ ${tableName}: SQL executed successfully`);
    return { success: true, record_count: 0 };
    
  } catch (error) {
    console.error(`❌ Error restoring ${tableName} from SQL:`, error.message);
    return { success: false, record_count: 0, error: error.message };
  }
}

// Restore from complete SQL file
async function restoreFromCompleteSQL(dryRun = false) {
  try {
    const completeFile = path.join(backupDir, 'complete-data-backup.sql');
    
    if (dryRun) {
      console.log(`🔍 [DRY RUN] Would restore from complete SQL file`);
      return { success: true, record_count: 0 };
    }

    console.log(`📊 Restoring from complete SQL file...`);

    // Read SQL file
    const sqlContent = await fs.readFile(completeFile, 'utf8');
    
    // Execute the complete SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sqlContent });
    
    if (error) {
      console.error(`❌ Error executing complete SQL:`, error.message);
      return { success: false, record_count: 0, error: error.message };
    }

    console.log(`✅ Complete SQL executed successfully`);
    return { success: true, record_count: 0 };
    
  } catch (error) {
    console.error(`❌ Error restoring from complete SQL:`, error.message);
    return { success: false, record_count: 0, error: error.message };
  }
}

// Create restoration summary
async function createRestorationSummary(results) {
  const summary = {
    restoration_timestamp: new Date().toISOString(),
    source: source,
    dry_run: dryRun,
    total_tables: results.length,
    successful_restorations: results.filter(r => r.success).length,
    failed_restorations: results.filter(r => !r.success).length,
    total_records: results.reduce((sum, r) => sum + (r.record_count || 0), 0),
    tables: results.map(r => ({
      table_name: r.table_name,
      success: r.success,
      record_count: r.record_count || 0,
      error: r.error || null
    }))
  };

  // Save summary as JSON
  const summaryFile = path.join(backupDir, 'restoration-summary.json');
  await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));

  // Create human-readable report
  const report = `# Phoenix Force Database Restoration Report

**Restoration Date:** ${summary.restoration_timestamp}
**Source:** ${summary.source}
**Dry Run:** ${summary.dry_run ? 'Yes' : 'No'}
**Total Tables:** ${summary.total_tables}
**Successful Restorations:** ${summary.successful_restorations}
**Failed Restorations:** ${summary.failed_restorations}
**Total Records:** ${summary.total_records.toLocaleString()}

## Table Details

| Table Name | Status | Record Count |
|------------|--------|--------------|
${summary.tables.map(t => `| ${t.table_name} | ${t.success ? '✅ Success' : '❌ Failed'} | ${t.record_count.toLocaleString()} |`).join('\n')}

## Errors

${summary.tables.filter(t => !t.success && t.error).map(t => `### ${t.table_name}\n\`\`\`\n${t.error}\n\`\`\``).join('\n\n')}

---
*Generated by Phoenix Force Database Restoration System*
`;

  const reportFile = path.join(backupDir, 'RESTORATION_REPORT.md');
  await fs.writeFile(reportFile, report);

  console.log(`📋 Restoration summary created: ${summaryFile}`);
  console.log(`📋 Restoration report created: ${reportFile}`);
  
  return summary;
}

// Main restoration function
async function performRestoration() {
  console.log('🚀 Starting Phoenix Force Database Restoration...');
  console.log(`📅 Restoration Date: ${new Date().toISOString()}`);
  console.log(`📁 Backup Directory: ${backupDir}`);
  console.log(`📋 Source: ${source}`);
  console.log(`🔍 Dry Run: ${dryRun ? 'Yes' : 'No'}`);
  console.log(`💥 Force: ${force ? 'Yes' : 'No'}`);
  console.log('');

  // Check backup directory
  await checkBackupDirectory();

  // Load backup summary
  const backupSummary = await loadBackupSummary();

  const restorationResults = [];

  if (source === 'complete') {
    // Restore from complete SQL file
    console.log('\n🔄 Restoring from complete SQL file...');
    const result = await restoreFromCompleteSQL(dryRun);
    restorationResults.push({
      table_name: 'complete_backup',
      success: result.success,
      record_count: result.record_count,
      error: result.error
    });
  } else {
    // Restore tables individually
    for (const tableName of RESTORATION_ORDER) {
      console.log(`\n🔄 Processing table: ${tableName}`);
      
      try {
        let result;
        
        if (source === 'json') {
          result = await restoreTableFromJSON(tableName, dryRun);
        } else if (source === 'sql') {
          result = await restoreTableFromSQL(tableName, dryRun);
        } else {
          console.error(`❌ Unknown source format: ${source}`);
          process.exit(1);
        }

        restorationResults.push({
          table_name: tableName,
          success: result.success,
          record_count: result.record_count,
          error: result.error
        });

      } catch (error) {
        console.error(`❌ Unexpected error processing ${tableName}:`, error.message);
        restorationResults.push({
          table_name: tableName,
          success: false,
          record_count: 0,
          error: error.message
        });
      }
    }
  }

  // Create summary and reports
  console.log('\n📋 Creating restoration summary...');
  const summary = await createRestorationSummary(restorationResults);

  // Final report
  console.log('\n🎉 Restoration completed!');
  console.log(`📊 Total Tables: ${summary.total_tables}`);
  console.log(`✅ Successful: ${summary.successful_restorations}`);
  console.log(`❌ Failed: ${summary.failed_restorations}`);
  console.log(`📈 Total Records: ${summary.total_records.toLocaleString()}`);
  console.log(`📁 Backup Directory: ${backupDir}`);
  console.log('\n📋 Check the following files:');
  console.log(`   - ${backupDir}/restoration-summary.json`);
  console.log(`   - ${backupDir}/RESTORATION_REPORT.md`);

  if (summary.failed_restorations > 0) {
    console.log('\n⚠️  Some restorations failed. Check the summary for details.');
    process.exit(1);
  }
}

// Run the restoration
if (require.main === module) {
  performRestoration().catch(error => {
    console.error('❌ Restoration failed:', error.message);
    process.exit(1);
  });
}

module.exports = { performRestoration, RESTORATION_ORDER };
