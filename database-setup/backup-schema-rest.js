#!/usr/bin/env node

/**
 * Supabase Database Schema Backup using REST API
 * Fetches database schema information using Supabase REST API
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

// Load environment variables
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Create backup directory structure
const backupDir = path.join(__dirname, 'data-backup')
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

async function ensureDirectoryExists(dir) {
  try {
    await fs.mkdir(dir, { recursive: true })
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
  }
}

async function fetchTableInfo() {
  console.log('🏗️  Fetching table information...')
  
  // Get list of tables by trying to fetch from each known table
  const knownTables = [
    'users', 'players', 'tournaments', 'tournament_slots', 'auctions',
    'auction_teams', 'auction_players', 'player_skills', 'player_skill_values',
    'player_skill_assignments', 'notifications', 'api_usage_analytics'
  ]
  
  const tableInfo = {}
  
  for (const tableName of knownTables) {
    try {
      console.log(`  📋 Checking table: ${tableName}`)
      
      // Try to get table structure by fetching one record
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (!error && data) {
        // Get column information from the first record
        const columns = Object.keys(data[0] || {})
        const columnTypes = {}
        
        for (const column of columns) {
          const value = data[0][column]
          columnTypes[column] = typeof value
        }
        
        tableInfo[tableName] = {
          exists: true,
          columns: columns,
          column_types: columnTypes,
          sample_record: data[0]
        }
        
        console.log(`  ✅ ${tableName}: ${columns.length} columns`)
      } else {
        tableInfo[tableName] = {
          exists: false,
          error: error?.message || 'Unknown error'
        }
        console.log(`  ❌ ${tableName}: ${error?.message || 'Not found'}`)
      }
    } catch (error) {
      tableInfo[tableName] = {
        exists: false,
        error: error.message
      }
      console.log(`  ❌ ${tableName}: ${error.message}`)
    }
  }
  
  return tableInfo
}

async function fetchStorageInfo() {
  console.log('💾 Fetching storage information...')
  
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.warn('⚠️  Could not fetch storage buckets:', bucketsError.message)
      return { buckets: [], files: {} }
    }

    const files = {}
    for (const bucket of buckets) {
      try {
        const { data: bucketFiles, error: filesError } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 1000 })

        if (!filesError) {
          files[bucket.name] = bucketFiles || []
        }
      } catch (error) {
        console.warn(`⚠️  Could not fetch files from bucket ${bucket.name}:`, error.message)
        files[bucket.name] = []
      }
    }

    return { buckets, files }
  } catch (error) {
    console.warn('⚠️  Error fetching storage info:', error.message)
    return { buckets: [], files: {} }
  }
}

async function generateSchemaSQL(tableInfo) {
  console.log('📝 Generating schema SQL...')
  
  const sqlStatements = []
  
  // Add header
  sqlStatements.push('-- Complete Database Schema')
  sqlStatements.push(`-- Generated: ${new Date().toISOString()}`)
  sqlStatements.push('-- Source: Supabase Database')
  sqlStatements.push('')
  
  // Create tables based on known structure
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('-- TABLE CREATION')
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('')
  
  for (const [tableName, info] of Object.entries(tableInfo)) {
    if (!info.exists) continue
    
    sqlStatements.push(`-- Table: ${tableName}`)
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS ${tableName} (`)
    
    const columnDefs = []
    for (const column of info.columns) {
      let columnDef = `  ${column}`
      
      // Map JavaScript types to SQL types
      const jsType = info.column_types[column]
      let sqlType = 'TEXT'
      
      if (jsType === 'number') {
        sqlType = 'NUMERIC'
      } else if (jsType === 'boolean') {
        sqlType = 'BOOLEAN'
      } else if (jsType === 'object') {
        sqlType = 'JSONB'
      } else if (jsType === 'string' && column.includes('_at')) {
        sqlType = 'TIMESTAMP WITH TIME ZONE'
      } else if (jsType === 'string' && column.includes('id')) {
        sqlType = 'UUID'
      }
      
      columnDef += ` ${sqlType}`
      
      // Add common constraints
      if (column === 'id') {
        columnDef += ' PRIMARY KEY'
      } else if (column.includes('_at') && column !== 'created_at') {
        columnDef += ' DEFAULT NOW()'
      }
      
      columnDefs.push(columnDef)
    }
    
    sqlStatements.push(columnDefs.join(',\n'))
    sqlStatements.push(');')
    sqlStatements.push('')
  }
  
  // Add common indexes
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('-- INDEXES')
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('')
  
  for (const [tableName, info] of Object.entries(tableInfo)) {
    if (!info.exists) continue
    
    // Add common indexes
    if (info.columns.includes('user_id')) {
      sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_${tableName}_user_id ON ${tableName} (user_id);`)
    }
    if (info.columns.includes('created_at')) {
      sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_${tableName}_created_at ON ${tableName} (created_at);`)
    }
    if (info.columns.includes('updated_at')) {
      sqlStatements.push(`CREATE INDEX IF NOT EXISTS idx_${tableName}_updated_at ON ${tableName} (updated_at);`)
    }
  }
  
  return sqlStatements.join('\n')
}

async function main() {
  console.log('🚀 Starting database schema backup using REST API...')
  console.log(`📅 Timestamp: ${timestamp}`)
  console.log('')

  try {
    // Create backup directory
    await ensureDirectoryExists(backupDir)

    // Fetch table information
    const tableInfo = await fetchTableInfo()
    
    // Fetch storage information
    const storageInfo = await fetchStorageInfo()

    const schemaData = {
      tables: tableInfo,
      storage: storageInfo,
      timestamp: new Date().toISOString()
    }

    // Generate complete schema SQL
    const schemaSQL = await generateSchemaSQL(tableInfo)

    // Save schema information
    console.log('💾 Saving schema files...')
    
    const schemaFilePath = path.join(backupDir, 'database-schema.json')
    await fs.writeFile(schemaFilePath, JSON.stringify(schemaData, null, 2))

    const sqlFilePath = path.join(backupDir, 'database-schema.sql')
    await fs.writeFile(sqlFilePath, schemaSQL)

    // Generate detailed schema report
    const existingTables = Object.entries(tableInfo).filter(([_, info]) => info.exists)
    const schemaReport = `# Database Schema Report

**Generated:** ${schemaData.timestamp}
**Database URL:** ${supabaseUrl}

## Schema Summary
- **Tables Found:** ${existingTables.length}
- **Storage Buckets:** ${storageInfo.buckets.length}
- **Total Files:** ${Object.values(storageInfo.files).reduce((sum, files) => sum + files.length, 0)}

## Tables
${existingTables.map(([name, info]) => `- **${name}**: ${info.columns.length} columns`).join('\n')}

## Storage Information
${storageInfo.buckets.map(bucket => `- **${bucket.name}**: ${storageInfo.files[bucket.name]?.length || 0} files`).join('\n')}

## Files Generated
- \`database-schema.json\` - Complete schema information
- \`database-schema.sql\` - SQL schema creation script

## Usage
To recreate the database schema:
1. Run \`database-schema.sql\` to create tables and indexes
2. Set up storage buckets as needed
3. Configure RLS policies manually
4. Set up realtime subscriptions manually

## Notes
- This backup captures table structure and storage information
- RLS policies, functions, and triggers need to be configured manually
- Use Supabase dashboard for complete schema management
`

    const reportFilePath = path.join(backupDir, 'SCHEMA_REPORT.md')
    await fs.writeFile(reportFilePath, schemaReport)

    console.log('')
    console.log('✅ Schema backup completed successfully!')
    console.log(`📁 Backup directory: ${backupDir}`)
    console.log(`🏗️  Tables: ${existingTables.length}`)
    console.log(`💾 Storage buckets: ${storageInfo.buckets.length}`)
    console.log(`📁 Total files: ${Object.values(storageInfo.files).reduce((sum, files) => sum + files.length, 0)}`)
    console.log('')
    console.log('📋 Files generated:')
    console.log('  - database-schema.json')
    console.log('  - database-schema.sql')
    console.log('  - SCHEMA_REPORT.md')

  } catch (error) {
    console.error('❌ Schema backup failed:', error.message)
    process.exit(1)
  }
}

// Run the schema backup
main().catch(console.error)
