#!/usr/bin/env node

/**
 * Enhanced Supabase Database Schema Backup Script
 * Fetches complete database schema including tables, functions, policies, triggers, etc.
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

async function fetchTableSchema() {
  console.log('🏗️  Fetching table schema...')
  
  try {
    // Get table information
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_type, table_schema')
      .eq('table_schema', 'public')

    if (tablesError) {
      console.warn('⚠️  Could not fetch tables:', tablesError.message)
      return []
    }

    const tableDetails = []
    for (const table of tables || []) {
      try {
        // Get column information
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('*')
          .eq('table_name', table.table_name)
          .eq('table_schema', 'public')

        // Get constraints
        const { data: constraints, error: constraintsError } = await supabase
          .from('information_schema.table_constraints')
          .select('*')
          .eq('table_name', table.table_name)
          .eq('table_schema', 'public')

        // Get indexes
        const { data: indexes, error: indexesError } = await supabase
          .from('pg_indexes')
          .select('*')
          .eq('tablename', table.table_name)
          .eq('schemaname', 'public')

        tableDetails.push({
          table_name: table.table_name,
          table_type: table.table_type,
          columns: columns || [],
          constraints: constraints || [],
          indexes: indexes || []
        })
      } catch (error) {
        console.warn(`⚠️  Could not fetch details for table ${table.table_name}:`, error.message)
      }
    }

    return tableDetails
  } catch (error) {
    console.warn('⚠️  Error fetching table schema:', error.message)
    return []
  }
}

async function fetchFunctions() {
  console.log('⚙️  Fetching functions...')
  
  try {
    const { data: functions, error } = await supabase
      .from('pg_proc')
      .select('*')
      .eq('pronamespace', 2200) // public schema

    if (error) {
      console.warn('⚠️  Could not fetch functions:', error.message)
      return []
    }

    return functions || []
  } catch (error) {
    console.warn('⚠️  Error fetching functions:', error.message)
    return []
  }
}

async function fetchPolicies() {
  console.log('🔒 Fetching RLS policies...')
  
  try {
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('*')

    if (error) {
      console.warn('⚠️  Could not fetch policies:', error.message)
      return []
    }

    return policies || []
  } catch (error) {
    console.warn('⚠️  Error fetching policies:', error.message)
    return []
  }
}

async function fetchTriggers() {
  console.log('🎯 Fetching triggers...')
  
  try {
    const { data: triggers, error } = await supabase
      .from('pg_trigger')
      .select('*')

    if (error) {
      console.warn('⚠️  Could not fetch triggers:', error.message)
      return []
    }

    return triggers || []
  } catch (error) {
    console.warn('⚠️  Error fetching triggers:', error.message)
    return []
  }
}

async function fetchExtensions() {
  console.log('🔌 Fetching extensions...')
  
  try {
    const { data: extensions, error } = await supabase
      .from('pg_extension')
      .select('*')

    if (error) {
      console.warn('⚠️  Could not fetch extensions:', error.message)
      return []
    }

    return extensions || []
  } catch (error) {
    console.warn('⚠️  Error fetching extensions:', error.message)
    return []
  }
}

async function fetchRealtimePublications() {
  console.log('📡 Fetching realtime publications...')
  
  try {
    const { data: publications, error } = await supabase
      .from('pg_publication')
      .select('*')

    if (error) {
      console.warn('⚠️  Could not fetch publications:', error.message)
      return []
    }

    return publications || []
  } catch (error) {
    console.warn('⚠️  Error fetching publications:', error.message)
    return []
  }
}

async function generateCompleteSchemaSQL(schemaInfo) {
  console.log('📝 Generating complete schema SQL...')
  
  const sqlStatements = []
  
  // Add header
  sqlStatements.push('-- Complete Database Schema')
  sqlStatements.push(`-- Generated: ${new Date().toISOString()}`)
  sqlStatements.push('-- Source: Supabase Database')
  sqlStatements.push('')
  
  // Create tables
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('-- TABLE CREATION')
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('')
  
  for (const table of schemaInfo.tables) {
    sqlStatements.push(`-- Table: ${table.table_name}`)
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS ${table.table_name} (`)
    
    const columnDefs = []
    for (const column of table.columns) {
      let columnDef = `  ${column.column_name} ${column.data_type}`
      
      if (column.character_maximum_length) {
        columnDef += `(${column.character_maximum_length})`
      }
      
      if (column.is_nullable === 'NO') {
        columnDef += ' NOT NULL'
      }
      
      if (column.column_default) {
        columnDef += ` DEFAULT ${column.column_default}`
      }
      
      columnDefs.push(columnDef)
    }
    
    sqlStatements.push(columnDefs.join(',\n'))
    sqlStatements.push(');')
    sqlStatements.push('')
  }
  
  // Add constraints
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('-- CONSTRAINTS')
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('')
  
  for (const table of schemaInfo.tables) {
    for (const constraint of table.constraints) {
      if (constraint.constraint_type === 'PRIMARY KEY') {
        sqlStatements.push(`ALTER TABLE ${table.table_name} ADD CONSTRAINT ${constraint.constraint_name} PRIMARY KEY (${constraint.constraint_name});`)
      } else if (constraint.constraint_type === 'FOREIGN KEY') {
        sqlStatements.push(`-- Foreign key constraint: ${constraint.constraint_name}`)
      }
    }
  }
  
  // Add indexes
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('-- INDEXES')
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('')
  
  for (const table of schemaInfo.tables) {
    for (const index of table.indexes) {
      if (!index.indexname.includes('_pkey')) { // Skip primary key indexes
        sqlStatements.push(`-- Index: ${index.indexname}`)
        sqlStatements.push(`CREATE INDEX IF NOT EXISTS ${index.indexname} ON ${table.table_name} (${index.indexdef.split('(')[1]?.split(')')[0] || 'columns'});`)
      }
    }
  }
  
  // Add RLS policies
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('-- ROW LEVEL SECURITY POLICIES')
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('')
  
  for (const policy of schemaInfo.policies) {
    sqlStatements.push(`-- Policy: ${policy.policyname}`)
    sqlStatements.push(`CREATE POLICY ${policy.policyname} ON ${policy.tablename} FOR ${policy.cmd} TO ${policy.roles.join(', ')}`)
    if (policy.qual) {
      sqlStatements.push(`  USING (${policy.qual})`)
    }
    if (policy.with_check) {
      sqlStatements.push(`  WITH CHECK (${policy.with_check})`)
    }
    sqlStatements.push(';')
    sqlStatements.push('')
  }
  
  return sqlStatements.join('\n')
}

async function main() {
  console.log('🚀 Starting complete database schema backup...')
  console.log(`📅 Timestamp: ${timestamp}`)
  console.log('')

  try {
    // Create backup directory
    await ensureDirectoryExists(backupDir)

    // Fetch all schema information
    const tables = await fetchTableSchema()
    const functions = await fetchFunctions()
    const policies = await fetchPolicies()
    const triggers = await fetchTriggers()
    const extensions = await fetchExtensions()
    const publications = await fetchRealtimePublications()

    const schemaInfo = {
      tables,
      functions,
      policies,
      triggers,
      extensions,
      publications,
      timestamp: new Date().toISOString()
    }

    // Generate complete schema SQL
    const schemaSQL = await generateCompleteSchemaSQL(schemaInfo)

    // Save schema information
    console.log('💾 Saving schema files...')
    
    const schemaFilePath = path.join(backupDir, 'complete-schema.json')
    await fs.writeFile(schemaFilePath, JSON.stringify(schemaInfo, null, 2))

    const sqlFilePath = path.join(backupDir, 'complete-schema.sql')
    await fs.writeFile(sqlFilePath, schemaSQL)

    // Generate detailed schema report
    const schemaReport = `# Complete Database Schema Report

**Generated:** ${schemaInfo.timestamp}
**Database URL:** ${supabaseUrl}

## Schema Summary
- **Tables:** ${tables.length}
- **Functions:** ${functions.length}
- **Policies:** ${policies.length}
- **Triggers:** ${triggers.length}
- **Extensions:** ${extensions.length}
- **Publications:** ${publications.length}

## Tables
${tables.map(table => `- **${table.table_name}**: ${table.columns.length} columns, ${table.constraints.length} constraints, ${table.indexes.length} indexes`).join('\n')}

## Functions
${functions.map(func => `- **${func.proname}**: ${func.prokind} function`).join('\n')}

## RLS Policies
${policies.map(policy => `- **${policy.policyname}** on ${policy.tablename}: ${policy.cmd} for ${policy.roles.join(', ')}`).join('\n')}

## Extensions
${extensions.map(ext => `- **${ext.extname}**: ${ext.extversion}`).join('\n')}

## Files Generated
- \`complete-schema.json\` - Complete schema information
- \`complete-schema.sql\` - SQL schema creation script

## Usage
To recreate the database schema:
1. Run \`complete-schema.sql\` to create tables, constraints, and indexes
2. Apply RLS policies as needed
3. Set up realtime publications
4. Configure extensions
`

    const reportFilePath = path.join(backupDir, 'SCHEMA_REPORT.md')
    await fs.writeFile(reportFilePath, schemaReport)

    console.log('')
    console.log('✅ Schema backup completed successfully!')
    console.log(`📁 Backup directory: ${backupDir}`)
    console.log(`🏗️  Tables: ${tables.length}`)
    console.log(`⚙️  Functions: ${functions.length}`)
    console.log(`🔒 Policies: ${policies.length}`)
    console.log(`🎯 Triggers: ${triggers.length}`)
    console.log(`🔌 Extensions: ${extensions.length}`)
    console.log(`📡 Publications: ${publications.length}`)
    console.log('')
    console.log('📋 Files generated:')
    console.log('  - complete-schema.json')
    console.log('  - complete-schema.sql')
    console.log('  - SCHEMA_REPORT.md')

  } catch (error) {
    console.error('❌ Schema backup failed:', error.message)
    process.exit(1)
  }
}

// Run the schema backup
main().catch(console.error)
