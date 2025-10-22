#!/usr/bin/env node

/**
 * Supabase Database Schema Backup using Raw SQL
 * Fetches complete database schema using direct SQL queries
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

async function executeSQLQuery(query, description) {
  console.log(`🔍 ${description}...`)
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query })
    
    if (error) {
      console.warn(`⚠️  ${description} failed:`, error.message)
      return []
    }
    
    return data || []
  } catch (error) {
    console.warn(`⚠️  ${description} error:`, error.message)
    return []
  }
}

async function fetchTableSchema() {
  const query = `
    SELECT 
      t.table_name,
      t.table_type,
      c.column_name,
      c.data_type,
      c.character_maximum_length,
      c.is_nullable,
      c.column_default,
      c.ordinal_position
    FROM information_schema.tables t
    LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public'
    ORDER BY t.table_name, c.ordinal_position;
  `
  
  return await executeSQLQuery(query, 'Fetching table schema')
}

async function fetchConstraints() {
  const query = `
    SELECT 
      tc.table_name,
      tc.constraint_name,
      tc.constraint_type,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    LEFT JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name;
  `
  
  return await executeSQLQuery(query, 'Fetching constraints')
}

async function fetchIndexes() {
  const query = `
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `
  
  return await executeSQLQuery(query, 'Fetching indexes')
}

async function fetchFunctions() {
  const query = `
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_result(p.oid) as return_type,
      pg_get_function_arguments(p.oid) as arguments,
      p.prokind as function_type,
      p.prosrc as source_code
    FROM pg_proc p
    LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    ORDER BY p.proname;
  `
  
  return await executeSQLQuery(query, 'Fetching functions')
}

async function fetchPolicies() {
  const query = `
    SELECT 
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `
  
  return await executeSQLQuery(query, 'Fetching RLS policies')
}

async function fetchTriggers() {
  const query = `
    SELECT 
      t.trigger_name,
      t.event_manipulation,
      t.event_object_table,
      t.action_statement,
      t.action_timing,
      t.action_orientation
    FROM information_schema.triggers t
    WHERE t.trigger_schema = 'public'
    ORDER BY t.event_object_table, t.trigger_name;
  `
  
  return await executeSQLQuery(query, 'Fetching triggers')
}

async function fetchExtensions() {
  const query = `
    SELECT 
      extname,
      extversion,
      extowner,
      extnamespace
    FROM pg_extension
    ORDER BY extname;
  `
  
  return await executeSQLQuery(query, 'Fetching extensions')
}

async function fetchRealtimePublications() {
  const query = `
    SELECT 
      pubname,
      puballtables,
      pubinsert,
      pubupdate,
      pubdelete,
      pubtruncate
    FROM pg_publication
    ORDER BY pubname;
  `
  
  return await executeSQLQuery(query, 'Fetching realtime publications')
}

async function generateSchemaSQL(schemaData) {
  console.log('📝 Generating schema SQL...')
  
  const sqlStatements = []
  
  // Add header
  sqlStatements.push('-- Complete Database Schema')
  sqlStatements.push(`-- Generated: ${new Date().toISOString()}`)
  sqlStatements.push('-- Source: Supabase Database')
  sqlStatements.push('')
  
  // Group tables by name
  const tables = {}
  for (const row of schemaData.tables) {
    if (!tables[row.table_name]) {
      tables[row.table_name] = {
        table_name: row.table_name,
        table_type: row.table_type,
        columns: []
      }
    }
    if (row.column_name) {
      tables[row.table_name].columns.push({
        column_name: row.column_name,
        data_type: row.data_type,
        character_maximum_length: row.character_maximum_length,
        is_nullable: row.is_nullable,
        column_default: row.column_default,
        ordinal_position: row.ordinal_position
      })
    }
  }
  
  // Create tables
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('-- TABLE CREATION')
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('')
  
  for (const [tableName, table] of Object.entries(tables)) {
    sqlStatements.push(`-- Table: ${tableName}`)
    sqlStatements.push(`CREATE TABLE IF NOT EXISTS ${tableName} (`)
    
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
  
  for (const constraint of schemaData.constraints) {
    if (constraint.constraint_type === 'PRIMARY KEY') {
      sqlStatements.push(`ALTER TABLE ${constraint.table_name} ADD CONSTRAINT ${constraint.constraint_name} PRIMARY KEY (${constraint.column_name});`)
    } else if (constraint.constraint_type === 'FOREIGN KEY') {
      sqlStatements.push(`ALTER TABLE ${constraint.table_name} ADD CONSTRAINT ${constraint.constraint_name} FOREIGN KEY (${constraint.column_name}) REFERENCES ${constraint.foreign_table_name}(${constraint.foreign_column_name});`)
    } else if (constraint.constraint_type === 'UNIQUE') {
      sqlStatements.push(`ALTER TABLE ${constraint.table_name} ADD CONSTRAINT ${constraint.constraint_name} UNIQUE (${constraint.column_name});`)
    }
  }
  
  // Add indexes
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('-- INDEXES')
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('')
  
  for (const index of schemaData.indexes) {
    if (!index.indexname.includes('_pkey')) { // Skip primary key indexes
      sqlStatements.push(`-- Index: ${index.indexname}`)
      sqlStatements.push(`${index.indexdef};`)
    }
  }
  
  // Add RLS policies
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('-- ROW LEVEL SECURITY POLICIES')
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('')
  
  for (const policy of schemaData.policies) {
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
  
  // Add functions
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('-- FUNCTIONS')
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('')
  
  for (const func of schemaData.functions) {
    sqlStatements.push(`-- Function: ${func.function_name}`)
    sqlStatements.push(`-- Return type: ${func.return_type}`)
    sqlStatements.push(`-- Arguments: ${func.arguments}`)
    sqlStatements.push(`-- Type: ${func.function_type}`)
    if (func.source_code) {
      sqlStatements.push(`-- Source: ${func.source_code}`)
    }
    sqlStatements.push('')
  }
  
  return sqlStatements.join('\n')
}

async function main() {
  console.log('🚀 Starting complete database schema backup using SQL...')
  console.log(`📅 Timestamp: ${timestamp}`)
  console.log('')

  try {
    // Create backup directory
    await ensureDirectoryExists(backupDir)

    // Fetch all schema information using SQL
    const tables = await fetchTableSchema()
    const constraints = await fetchConstraints()
    const indexes = await fetchIndexes()
    const functions = await fetchFunctions()
    const policies = await fetchPolicies()
    const triggers = await fetchTriggers()
    const extensions = await fetchExtensions()
    const publications = await fetchRealtimePublications()

    const schemaData = {
      tables,
      constraints,
      indexes,
      functions,
      policies,
      triggers,
      extensions,
      publications,
      timestamp: new Date().toISOString()
    }

    // Generate complete schema SQL
    const schemaSQL = await generateSchemaSQL(schemaData)

    // Save schema information
    console.log('💾 Saving schema files...')
    
    const schemaFilePath = path.join(backupDir, 'complete-schema.json')
    await fs.writeFile(schemaFilePath, JSON.stringify(schemaData, null, 2))

    const sqlFilePath = path.join(backupDir, 'complete-schema.sql')
    await fs.writeFile(sqlFilePath, schemaSQL)

    // Generate detailed schema report
    const schemaReport = `# Complete Database Schema Report

**Generated:** ${schemaData.timestamp}
**Database URL:** ${supabaseUrl}

## Schema Summary
- **Tables:** ${Object.keys(tables.reduce((acc, row) => { acc[row.table_name] = true; return acc; }, {})).length}
- **Functions:** ${functions.length}
- **Policies:** ${policies.length}
- **Triggers:** ${triggers.length}
- **Extensions:** ${extensions.length}
- **Publications:** ${publications.length}
- **Constraints:** ${constraints.length}
- **Indexes:** ${indexes.length}

## Tables
${Object.keys(tables.reduce((acc, row) => { acc[row.table_name] = true; return acc; }, {})).map(tableName => `- **${tableName}**`).join('\n')}

## Functions
${functions.map(func => `- **${func.function_name}**: ${func.return_type} (${func.arguments})`).join('\n')}

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
    console.log(`🏗️  Tables: ${Object.keys(tables.reduce((acc, row) => { acc[row.table_name] = true; return acc; }, {})).length}`)
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
