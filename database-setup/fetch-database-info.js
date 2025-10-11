#!/usr/bin/env node

/**
 * Database Information Fetcher for Phoenix Force (SQL Version)
 * 
 * This script uses raw SQL queries to fetch comprehensive database information from Supabase.
 * It's designed to work with Supabase's security model by using direct SQL execution.
 * 
 * Usage: node fetch-database-info-sql.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('   Make sure .env.local file exists with these variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fetchDatabaseInfo() {
  console.log('🚀 Starting database information fetch using SQL queries...\n');

  try {
    // Create output directory
    const outputDir = path.join(__dirname, 'schema');
    await fs.mkdir(outputDir, { recursive: true });

    // 1. Fetch all tables
    console.log('📋 Fetching tables information...');
    const tables = await fetchTablesWithSQL();
    await saveToFile(outputDir, 'tables.json', tables);
    console.log(`✅ Found ${tables.length} tables`);

    // 2. Fetch RLS policies
    console.log('🔒 Fetching RLS policies...');
    const policies = await fetchRLSPoliciesWithSQL();
    await saveToFile(outputDir, 'rls-policies.json', policies);
    console.log(`✅ Found ${policies.length} RLS policies`);

    // 3. Fetch functions
    console.log('⚙️  Fetching database functions...');
    const functions = await fetchFunctionsWithSQL();
    await saveToFile(outputDir, 'functions.json', functions);
    console.log(`✅ Found ${functions.length} functions`);

    // 4. Fetch foreign key relationships
    console.log('🔗 Fetching foreign key relationships...');
    const foreignKeys = await fetchForeignKeysWithSQL();
    await saveToFile(outputDir, 'foreign-keys.json', foreignKeys);
    console.log(`✅ Found ${foreignKeys.length} foreign key relationships`);

    // 5. Fetch indexes
    console.log('📊 Fetching indexes...');
    const indexes = await fetchIndexesWithSQL();
    await saveToFile(outputDir, 'indexes.json', indexes);
    console.log(`✅ Found ${indexes.length} indexes`);

    // 6. Fetch triggers
    console.log('🎯 Fetching triggers...');
    const triggers = await fetchTriggersWithSQL();
    await saveToFile(outputDir, 'triggers.json', triggers);
    console.log(`✅ Found ${triggers.length} triggers`);

    // 7. Generate complete schema SQL
    console.log('📝 Generating complete schema SQL...');
    const completeSchema = await generateCompleteSchema(tables, policies, functions, foreignKeys, indexes, triggers);
    await saveToFile(outputDir, 'complete-schema.sql', completeSchema);

    // 8. Generate setup script
    console.log('🛠️  Generating setup script...');
    const setupScript = generateSetupScript(tables, policies, functions);
    await saveToFile(outputDir, 'setup-database.sql', setupScript);

    // 9. Generate documentation
    console.log('📚 Generating documentation...');
    const documentation = generateDocumentation(tables, policies, functions, foreignKeys);
    await saveToFile(outputDir, 'DATABASE_DOCUMENTATION.md', documentation);

    // 10. Generate SQL queries file for manual execution
    console.log('📄 Generating SQL queries file...');
    const sqlQueries = generateSQLQueries();
    await saveToFile(outputDir, 'database-queries.sql', sqlQueries);

    console.log('\n🎉 Database information fetch completed successfully!');
    console.log(`📁 All files saved to: ${outputDir}`);
    console.log('\n📋 Generated files:');
    console.log('   - tables.json (table schemas)');
    console.log('   - rls-policies.json (security policies)');
    console.log('   - functions.json (database functions)');
    console.log('   - foreign-keys.json (relationships)');
    console.log('   - indexes.json (database indexes)');
    console.log('   - triggers.json (database triggers)');
    console.log('   - complete-schema.sql (full schema)');
    console.log('   - setup-database.sql (setup script)');
    console.log('   - DATABASE_DOCUMENTATION.md (documentation)');
    console.log('   - database-queries.sql (SQL queries for manual execution)');

  } catch (error) {
    console.error('❌ Error fetching database information:', error);
    process.exit(1);
  }
}

async function fetchTablesWithSQL() {
  const sql = `
    SELECT 
      t.table_name,
      t.table_type,
      obj_description(c.oid) as table_comment,
      json_agg(
        json_build_object(
          'column_name', c.column_name,
          'data_type', c.data_type,
          'is_nullable', c.is_nullable,
          'column_default', c.column_default,
          'character_maximum_length', c.character_maximum_length,
          'column_comment', col_description(pgc.oid, c.ordinal_position)
        ) ORDER BY c.ordinal_position
      ) as columns
    FROM information_schema.tables t
    LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    LEFT JOIN pg_class pgc ON pgc.relname = t.table_name
    WHERE t.table_schema = 'public' 
      AND t.table_type = 'BASE TABLE'
    GROUP BY t.table_name, t.table_type, c.oid
    ORDER BY t.table_name;
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.warn('Could not fetch tables with SQL:', error.message);
    return [];
  }
  
  return data || [];
}

async function fetchRLSPoliciesWithSQL() {
  const sql = `
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
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.warn('Could not fetch RLS policies with SQL:', error.message);
    return [];
  }
  
  return data || [];
}

async function fetchFunctionsWithSQL() {
  const sql = `
    SELECT 
      p.proname as function_name,
      pg_get_function_result(p.oid) as return_type,
      pg_get_function_arguments(p.oid) as arguments,
      p.prosrc as source_code,
      p.prokind as function_kind,
      l.lanname as language
    FROM pg_proc p
    LEFT JOIN pg_language l ON p.prolang = l.oid
    WHERE p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ORDER BY p.proname;
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.warn('Could not fetch functions with SQL:', error.message);
    return [];
  }
  
  return data || [];
}

async function fetchForeignKeysWithSQL() {
  const sql = `
    SELECT 
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_type
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name;
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.warn('Could not fetch foreign keys with SQL:', error.message);
    return [];
  }
  
  return data || [];
}

async function fetchIndexesWithSQL() {
  const sql = `
    SELECT 
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes 
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.warn('Could not fetch indexes with SQL:', error.message);
    return [];
  }
  
  return data || [];
}

async function fetchTriggersWithSQL() {
  const sql = `
    SELECT 
      trigger_name,
      event_manipulation,
      event_object_table,
      action_statement,
      action_timing,
      action_orientation
    FROM information_schema.triggers 
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name;
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql });
  
  if (error) {
    console.warn('Could not fetch triggers with SQL:', error.message);
    return [];
  }
  
  return data || [];
}

function generateSQLQueries() {
  return `-- Phoenix Force Database Information Queries
-- Run these queries in Supabase SQL Editor to get database information

-- ==============================================
-- TABLES AND COLUMNS
-- ==============================================

SELECT 
  t.table_name,
  t.table_type,
  obj_description(c.oid) as table_comment,
  json_agg(
    json_build_object(
      'column_name', c.column_name,
      'data_type', c.data_type,
      'is_nullable', c.is_nullable,
      'column_default', c.column_default,
      'character_maximum_length', c.character_maximum_length,
      'column_comment', col_description(pgc.oid, c.ordinal_position)
    ) ORDER BY c.ordinal_position
  ) as columns
FROM information_schema.tables t
LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
LEFT JOIN pg_class pgc ON pgc.relname = t.table_name
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name, t.table_type, c.oid
ORDER BY t.table_name;

-- ==============================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================

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

-- ==============================================
-- DATABASE FUNCTIONS
-- ==============================================

SELECT 
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as arguments,
  p.prosrc as source_code,
  p.prokind as function_kind,
  l.lanname as language
FROM pg_proc p
LEFT JOIN pg_language l ON p.prolang = l.oid
WHERE p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY p.proname;

-- ==============================================
-- FOREIGN KEY RELATIONSHIPS
-- ==============================================

SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- ==============================================
-- INDEXES
-- ==============================================

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ==============================================
-- TRIGGERS
-- ==============================================

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ==============================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ==============================================
-- TABLE SIZES AND STATISTICS
-- ==============================================

SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_stat_get_tuples_returned(c.oid) as tuples_returned,
  pg_stat_get_tuples_fetched(c.oid) as tuples_fetched
FROM pg_tables pt
JOIN pg_class c ON c.relname = pt.tablename
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
`;
}

async function generateCompleteSchema(tables, policies, functions, foreignKeys, indexes, triggers) {
  let sql = '-- Phoenix Force Database Schema\n';
  sql += '-- Generated automatically from Supabase\n';
  sql += `-- Generated on: ${new Date().toISOString()}\n\n`;

  // Add tables
  sql += '-- ==============================================\n';
  sql += '-- TABLES\n';
  sql += '-- ==============================================\n\n';
  
  for (const table of tables) {
    sql += `-- Table: ${table.table_name}\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${table.table_name} (\n`;
    
    if (table.columns && table.columns.length > 0) {
      const columnDefs = table.columns.map(col => {
        let def = `  ${col.column_name} ${col.data_type}`;
        if (col.character_maximum_length) {
          def += `(${col.character_maximum_length})`;
        }
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }
        return def;
      });
      sql += columnDefs.join(',\n');
    }
    
    sql += '\n);\n\n';
  }

  // Add foreign keys
  if (foreignKeys.length > 0) {
    sql += '-- ==============================================\n';
    sql += '-- FOREIGN KEYS\n';
    sql += '-- ==============================================\n\n';
    
    for (const fk of foreignKeys) {
      sql += `-- Foreign key: ${fk.constraint_name}\n`;
      sql += `-- ALTER TABLE ${fk.table_name} ADD CONSTRAINT ${fk.constraint_name} FOREIGN KEY (${fk.column_name}) REFERENCES ${fk.foreign_table_name}(${fk.foreign_column_name});\n\n`;
    }
  }

  // Add indexes
  if (indexes.length > 0) {
    sql += '-- ==============================================\n';
    sql += '-- INDEXES\n';
    sql += '-- ==============================================\n\n';
    
    for (const index of indexes) {
      sql += `-- Index: ${index.indexname}\n`;
      sql += `-- ${index.indexdef}\n\n`;
    }
  }

  // Add functions
  if (functions.length > 0) {
    sql += '-- ==============================================\n';
    sql += '-- FUNCTIONS\n';
    sql += '-- ==============================================\n\n';
    
    for (const func of functions) {
      sql += `-- Function: ${func.function_name}\n`;
      sql += `-- ${func.source_code || 'Function definition not available'}\n\n`;
    }
  }

  // Add RLS policies
  if (policies.length > 0) {
    sql += '-- ==============================================\n';
    sql += '-- ROW LEVEL SECURITY POLICIES\n';
    sql += '-- ==============================================\n\n';
    
    for (const policy of policies) {
      sql += `-- Policy: ${policy.policyname} on ${policy.tablename}\n`;
      sql += `-- ${policy.qual || 'Policy definition not available'}\n\n`;
    }
  }

  return sql;
}

function generateSetupScript(tables, policies, functions) {
  let sql = '-- Phoenix Force Database Setup Script\n';
  sql += '-- Run this script to set up the database from scratch\n';
  sql += `-- Generated on: ${new Date().toISOString()}\n\n`;

  sql += '-- Enable necessary extensions\n';
  sql += 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n';
  sql += 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n\n';

  // Add table creation
  for (const table of tables) {
    sql += `-- Create table: ${table.table_name}\n`;
    sql += `CREATE TABLE IF NOT EXISTS ${table.table_name} (\n`;
    
    if (table.columns && table.columns.length > 0) {
      const columnDefs = table.columns.map(col => {
        let def = `  ${col.column_name} ${col.data_type}`;
        if (col.character_maximum_length) {
          def += `(${col.character_maximum_length})`;
        }
        if (col.is_nullable === 'NO') {
          def += ' NOT NULL';
        }
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }
        return def;
      });
      sql += columnDefs.join(',\n');
    }
    
    sql += '\n);\n\n';
  }

  // Enable RLS
  sql += '-- Enable Row Level Security\n';
  for (const table of tables) {
    sql += `ALTER TABLE ${table.table_name} ENABLE ROW LEVEL SECURITY;\n`;
  }
  sql += '\n';

  return sql;
}

function generateDocumentation(tables, policies, functions, foreignKeys) {
  let doc = '# Phoenix Force Database Documentation\n\n';
  doc += `Generated on: ${new Date().toISOString()}\n\n`;

  doc += '## Overview\n\n';
  doc += 'This document contains comprehensive information about the Phoenix Force database schema.\n\n';

  // Tables section
  doc += '## Tables\n\n';
  for (const table of tables) {
    doc += `### ${table.table_name}\n\n`;
    doc += `**Description:** ${table.table_comment || 'No description available'}\n\n`;
    
    if (table.columns && table.columns.length > 0) {
      doc += '**Columns:**\n\n';
      doc += '| Column | Type | Nullable | Default | Description |\n';
      doc += '|--------|------|----------|---------|-------------|\n';
      
      for (const column of table.columns) {
        doc += `| ${column.column_name} | ${column.data_type} | ${column.is_nullable} | ${column.column_default || 'None'} | ${column.column_comment || 'No description'} |\n`;
      }
      doc += '\n';
    }
  }

  // Foreign keys section
  if (foreignKeys.length > 0) {
    doc += '## Foreign Key Relationships\n\n';
    doc += '| Table | Column | References | Description |\n';
    doc += '|-------|--------|------------|-------------|\n';
    
    for (const fk of foreignKeys) {
      doc += `| ${fk.table_name} | ${fk.column_name} | ${fk.foreign_table_name}.${fk.foreign_column_name} | ${fk.constraint_name} |\n`;
    }
    doc += '\n';
  }

  // RLS policies section
  if (policies.length > 0) {
    doc += '## Row Level Security Policies\n\n';
    for (const policy of policies) {
      doc += `### ${policy.policyname} (${policy.tablename})\n\n`;
      doc += `**Command:** ${policy.cmd}\n\n`;
      doc += `**Roles:** ${policy.roles ? policy.roles.join(', ') : 'All'}\n\n`;
      doc += `**Qualification:** \`${policy.qual || 'None'}\`\n\n`;
    }
  }

  // Functions section
  if (functions.length > 0) {
    doc += '## Database Functions\n\n';
    for (const func of functions) {
      doc += `### ${func.function_name}\n\n`;
      doc += `**Return Type:** ${func.return_type}\n\n`;
      doc += `**Arguments:** ${func.arguments || 'None'}\n\n`;
    }
  }

  return doc;
}

async function saveToFile(directory, filename, data) {
  const filePath = path.join(directory, filename);
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, content, 'utf8');
}

// Run the script
if (require.main === module) {
  fetchDatabaseInfo().catch(console.error);
}

module.exports = { fetchDatabaseInfo };
