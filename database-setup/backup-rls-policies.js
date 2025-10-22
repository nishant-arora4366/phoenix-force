#!/usr/bin/env node

/**
 * Supabase RLS Policies and Database Schema Backup
 * Fetches RLS policies, functions, triggers using Supabase Management API
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

async function fetchRLSPolicies() {
  console.log('🔒 Fetching RLS policies...')
  
  try {
    // Try to get policies using a direct SQL query
    const { data, error } = await supabase
      .rpc('exec', { 
        sql: `
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
      })
    
    if (error) {
      console.warn('⚠️  Could not fetch RLS policies via RPC:', error.message)
      return []
    }
    
    return data || []
  } catch (error) {
    console.warn('⚠️  Error fetching RLS policies:', error.message)
    return []
  }
}

async function fetchFunctions() {
  console.log('⚙️  Fetching functions...')
  
  try {
    const { data, error } = await supabase
      .rpc('exec', { 
        sql: `
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
      })
    
    if (error) {
      console.warn('⚠️  Could not fetch functions via RPC:', error.message)
      return []
    }
    
    return data || []
  } catch (error) {
    console.warn('⚠️  Error fetching functions:', error.message)
    return []
  }
}

async function fetchTriggers() {
  console.log('🎯 Fetching triggers...')
  
  try {
    const { data, error } = await supabase
      .rpc('exec', { 
        sql: `
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
      })
    
    if (error) {
      console.warn('⚠️  Could not fetch triggers via RPC:', error.message)
      return []
    }
    
    return data || []
  } catch (error) {
    console.warn('⚠️  Error fetching triggers:', error.message)
    return []
  }
}

async function fetchExtensions() {
  console.log('🔌 Fetching extensions...')
  
  try {
    const { data, error } = await supabase
      .rpc('exec', { 
        sql: `
          SELECT 
            extname,
            extversion,
            extowner,
            extnamespace
          FROM pg_extension
          ORDER BY extname;
        `
      })
    
    if (error) {
      console.warn('⚠️  Could not fetch extensions via RPC:', error.message)
      return []
    }
    
    return data || []
  } catch (error) {
    console.warn('⚠️  Error fetching extensions:', error.message)
    return []
  }
}

async function fetchRealtimePublications() {
  console.log('📡 Fetching realtime publications...')
  
  try {
    const { data, error } = await supabase
      .rpc('exec', { 
        sql: `
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
      })
    
    if (error) {
      console.warn('⚠️  Could not fetch publications via RPC:', error.message)
      return []
    }
    
    return data || []
  } catch (error) {
    console.warn('⚠️  Error fetching publications:', error.message)
    return []
  }
}

async function generateRLSSQL(policies) {
  console.log('📝 Generating RLS policies SQL...')
  
  const sqlStatements = []
  
  // Add header
  sqlStatements.push('-- RLS Policies')
  sqlStatements.push(`-- Generated: ${new Date().toISOString()}`)
  sqlStatements.push('-- Source: Supabase Database')
  sqlStatements.push('')
  
  // Group policies by table
  const policiesByTable = {}
  for (const policy of policies) {
    if (!policiesByTable[policy.tablename]) {
      policiesByTable[policy.tablename] = []
    }
    policiesByTable[policy.tablename].push(policy)
  }
  
  // Generate RLS policies
  for (const [tableName, tablePolicies] of Object.entries(policiesByTable)) {
    sqlStatements.push(`-- RLS Policies for ${tableName}`)
    sqlStatements.push(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`)
    sqlStatements.push('')
    
    for (const policy of tablePolicies) {
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
  }
  
  return sqlStatements.join('\n')
}

async function main() {
  console.log('🚀 Starting RLS policies and database schema backup...')
  console.log(`📅 Timestamp: ${timestamp}`)
  console.log('')

  try {
    // Create backup directory
    await ensureDirectoryExists(backupDir)

    // Fetch all schema information
    const policies = await fetchRLSPolicies()
    const functions = await fetchFunctions()
    const triggers = await fetchTriggers()
    const extensions = await fetchExtensions()
    const publications = await fetchRealtimePublications()

    const schemaInfo = {
      policies,
      functions,
      triggers,
      extensions,
      publications,
      timestamp: new Date().toISOString()
    }

    // Generate RLS policies SQL
    const rlsSQL = await generateRLSSQL(policies)

    // Save schema information
    console.log('💾 Saving RLS policies files...')
    
    const schemaFilePath = path.join(backupDir, 'rls-policies.json')
    await fs.writeFile(schemaFilePath, JSON.stringify(schemaInfo, null, 2))

    const sqlFilePath = path.join(backupDir, 'rls-policies.sql')
    await fs.writeFile(sqlFilePath, rlsSQL)

    // Generate detailed RLS report
    const rlsReport = `# RLS Policies and Database Schema Report

**Generated:** ${schemaInfo.timestamp}
**Database URL:** ${supabaseUrl}

## Schema Summary
- **RLS Policies:** ${policies.length}
- **Functions:** ${functions.length}
- **Triggers:** ${triggers.length}
- **Extensions:** ${extensions.length}
- **Publications:** ${publications.length}

## RLS Policies
${policies.map(policy => `- **${policy.policyname}** on ${policy.tablename}: ${policy.cmd} for ${policy.roles.join(', ')}`).join('\n')}

## Functions
${functions.map(func => `- **${func.function_name}**: ${func.return_type} (${func.arguments})`).join('\n')}

## Triggers
${triggers.map(trigger => `- **${trigger.trigger_name}** on ${trigger.event_object_table}: ${trigger.event_manipulation}`).join('\n')}

## Extensions
${extensions.map(ext => `- **${ext.extname}**: ${ext.extversion}`).join('\n')}

## Files Generated
- \`rls-policies.json\` - Complete RLS policies information
- \`rls-policies.sql\` - SQL RLS policies creation script

## Usage
To recreate the RLS policies:
1. Run \`rls-policies.sql\` to create all RLS policies
2. Verify policies in Supabase dashboard
3. Test with different user roles
`

    const reportFilePath = path.join(backupDir, 'RLS_POLICIES_REPORT.md')
    await fs.writeFile(reportFilePath, rlsReport)

    console.log('')
    console.log('✅ RLS policies backup completed successfully!')
    console.log(`📁 Backup directory: ${backupDir}`)
    console.log(`🔒 RLS Policies: ${policies.length}`)
    console.log(`⚙️  Functions: ${functions.length}`)
    console.log(`🎯 Triggers: ${triggers.length}`)
    console.log(`🔌 Extensions: ${extensions.length}`)
    console.log(`📡 Publications: ${publications.length}`)
    console.log('')
    console.log('📋 Files generated:')
    console.log('  - rls-policies.json')
    console.log('  - rls-policies.sql')
    console.log('  - RLS_POLICIES_REPORT.md')

  } catch (error) {
    console.error('❌ RLS policies backup failed:', error.message)
    process.exit(1)
  }
}

// Run the RLS policies backup
main().catch(console.error)
