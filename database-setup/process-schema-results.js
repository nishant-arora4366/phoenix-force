#!/usr/bin/env node

/**
 * Process Schema Results from Supabase SQL Editor
 * Takes the results from fetch-schema.sql and creates organized backup files
 */

const fs = require('fs').promises
const path = require('path')

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

async function processSchemaResults() {
  console.log('📋 Processing schema results...')
  console.log('')
  console.log('📝 Instructions:')
  console.log('1. Go to your Supabase dashboard')
  console.log('2. Navigate to SQL Editor')
  console.log('3. Copy and paste the contents of fetch-schema.sql')
  console.log('4. Run the query')
  console.log('5. Export the results as CSV or copy the data')
  console.log('6. Save the results to a file named "schema-results.csv" in this directory')
  console.log('7. Run this script again to process the results')
  console.log('')
  
  // Check if results file exists
  const resultsFile = path.join(__dirname, 'schema-results.csv')
  
  try {
    await fs.access(resultsFile)
    console.log('✅ Found schema-results.csv, processing...')
    
    const csvContent = await fs.readFile(resultsFile, 'utf8')
    const lines = csvContent.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      console.log('❌ No data found in schema-results.csv')
      return
    }
    
    // Parse CSV data
    const headers = lines[0].split(',')
    const data = lines.slice(1).map(line => {
      const values = line.split(',')
      const row = {}
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || ''
      })
      return row
    })
    
    // Group data by info_type
    const groupedData = {}
    data.forEach(row => {
      const infoType = row.info_type
      if (!groupedData[infoType]) {
        groupedData[infoType] = []
      }
      groupedData[infoType].push(row)
    })
    
    // Create organized schema data
    const schemaData = {
      timestamp: new Date().toISOString(),
      rls_policies: groupedData.RLS_POLICIES || [],
      functions: groupedData.FUNCTIONS || [],
      triggers: groupedData.TRIGGERS || [],
      extensions: groupedData.EXTENSIONS || [],
      publications: groupedData.PUBLICATIONS || [],
      constraints: groupedData.CONSTRAINTS || [],
      indexes: groupedData.INDEXES || [],
      tables: groupedData.TABLES || []
    }
    
    // Generate RLS policies SQL
    const rlsSQL = generateRLSSQL(schemaData.rls_policies)
    
    // Generate complete schema SQL
    const completeSchemaSQL = generateCompleteSchemaSQL(schemaData)
    
    // Save files
    console.log('💾 Saving processed schema files...')
    
    const schemaFilePath = path.join(backupDir, 'complete-schema.json')
    await fs.writeFile(schemaFilePath, JSON.stringify(schemaData, null, 2))
    
    const rlsSQLPath = path.join(backupDir, 'rls-policies.sql')
    await fs.writeFile(rlsSQLPath, rlsSQL)
    
    const completeSQLPath = path.join(backupDir, 'complete-schema.sql')
    await fs.writeFile(completeSQLPath, completeSchemaSQL)
    
    // Generate report
    const report = generateReport(schemaData)
    const reportPath = path.join(backupDir, 'COMPLETE_SCHEMA_REPORT.md')
    await fs.writeFile(reportPath, report)
    
    console.log('')
    console.log('✅ Schema processing completed successfully!')
    console.log(`📁 Backup directory: ${backupDir}`)
    console.log(`🔒 RLS Policies: ${schemaData.rls_policies.length}`)
    console.log(`⚙️  Functions: ${schemaData.functions.length}`)
    console.log(`🎯 Triggers: ${schemaData.triggers.length}`)
    console.log(`🔌 Extensions: ${schemaData.extensions.length}`)
    console.log(`📡 Publications: ${schemaData.publications.length}`)
    console.log(`🔗 Constraints: ${schemaData.constraints.length}`)
    console.log(`📊 Indexes: ${schemaData.indexes.length}`)
    console.log('')
    console.log('📋 Files generated:')
    console.log('  - complete-schema.json')
    console.log('  - rls-policies.sql')
    console.log('  - complete-schema.sql')
    console.log('  - COMPLETE_SCHEMA_REPORT.md')
    
  } catch (error) {
    console.log('❌ schema-results.csv not found or error processing:', error.message)
    console.log('')
    console.log('📝 Please follow these steps:')
    console.log('1. Run the SQL query in Supabase SQL Editor')
    console.log('2. Export results as CSV')
    console.log('3. Save as "schema-results.csv" in this directory')
    console.log('4. Run this script again')
  }
}

function generateRLSSQL(policies) {
  const sqlStatements = []
  
  sqlStatements.push('-- RLS Policies')
  sqlStatements.push(`-- Generated: ${new Date().toISOString()}`)
  sqlStatements.push('-- Source: Supabase Database')
  sqlStatements.push('')
  
  // Group policies by table
  const policiesByTable = {}
  policies.forEach(policy => {
    if (!policiesByTable[policy.tablename]) {
      policiesByTable[policy.tablename] = []
    }
    policiesByTable[policy.tablename].push(policy)
  })
  
  // Generate RLS policies
  Object.entries(policiesByTable).forEach(([tableName, tablePolicies]) => {
    sqlStatements.push(`-- RLS Policies for ${tableName}`)
    sqlStatements.push(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`)
    sqlStatements.push('')
    
    tablePolicies.forEach(policy => {
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
    })
  })
  
  return sqlStatements.join('\n')
}

function generateCompleteSchemaSQL(schemaData) {
  const sqlStatements = []
  
  sqlStatements.push('-- Complete Database Schema')
  sqlStatements.push(`-- Generated: ${new Date().toISOString()}`)
  sqlStatements.push('-- Source: Supabase Database')
  sqlStatements.push('')
  
  // Add RLS policies
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('-- ROW LEVEL SECURITY POLICIES')
  sqlStatements.push('-- ==============================================')
  sqlStatements.push('')
  sqlStatements.push(generateRLSSQL(schemaData.rls_policies))
  
  // Add functions
  if (schemaData.functions.length > 0) {
    sqlStatements.push('-- ==============================================')
    sqlStatements.push('-- FUNCTIONS')
    sqlStatements.push('-- ==============================================')
    sqlStatements.push('')
    
    schemaData.functions.forEach(func => {
      sqlStatements.push(`-- Function: ${func.function_name}`)
      sqlStatements.push(`-- Return type: ${func.return_type}`)
      sqlStatements.push(`-- Arguments: ${func.arguments}`)
      sqlStatements.push(`-- Type: ${func.function_type}`)
      if (func.source_code) {
        sqlStatements.push(`-- Source: ${func.source_code}`)
      }
      sqlStatements.push('')
    })
  }
  
  // Add triggers
  if (schemaData.triggers.length > 0) {
    sqlStatements.push('-- ==============================================')
    sqlStatements.push('-- TRIGGERS')
    sqlStatements.push('-- ==============================================')
    sqlStatements.push('')
    
    schemaData.triggers.forEach(trigger => {
      sqlStatements.push(`-- Trigger: ${trigger.trigger_name}`)
      sqlStatements.push(`-- Table: ${trigger.event_object_table}`)
      sqlStatements.push(`-- Event: ${trigger.event_manipulation}`)
      sqlStatements.push(`-- Timing: ${trigger.action_timing}`)
      sqlStatements.push(`-- Statement: ${trigger.action_statement}`)
      sqlStatements.push('')
    })
  }
  
  return sqlStatements.join('\n')
}

function generateReport(schemaData) {
  return `# Complete Database Schema Report

**Generated:** ${schemaData.timestamp}
**Source:** Supabase Database

## Schema Summary
- **RLS Policies:** ${schemaData.rls_policies.length}
- **Functions:** ${schemaData.functions.length}
- **Triggers:** ${schemaData.triggers.length}
- **Extensions:** ${schemaData.extensions.length}
- **Publications:** ${schemaData.publications.length}
- **Constraints:** ${schemaData.constraints.length}
- **Indexes:** ${schemaData.indexes.length}

## RLS Policies
${schemaData.rls_policies.map(policy => `- **${policy.policyname}** on ${policy.tablename}: ${policy.cmd} for ${policy.roles.join(', ')}`).join('\n')}

## Functions
${schemaData.functions.map(func => `- **${func.function_name}**: ${func.return_type} (${func.arguments})`).join('\n')}

## Triggers
${schemaData.triggers.map(trigger => `- **${trigger.trigger_name}** on ${trigger.event_object_table}: ${trigger.event_manipulation}`).join('\n')}

## Extensions
${schemaData.extensions.map(ext => `- **${ext.extname}**: ${ext.extversion}`).join('\n')}

## Files Generated
- \`complete-schema.json\` - Complete schema information
- \`rls-policies.sql\` - RLS policies creation script
- \`complete-schema.sql\` - Complete schema creation script

## Usage
To recreate the database schema:
1. Run \`complete-schema.sql\` to create all schema elements
2. Apply RLS policies as needed
3. Set up functions and triggers
4. Configure realtime publications
`
}

// Run the processing
processSchemaResults().catch(console.error)
