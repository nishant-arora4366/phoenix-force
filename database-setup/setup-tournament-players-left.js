#!/usr/bin/env node

/**
 * Setup script for tournament_players_left table
 * This script creates the table and policies for tracking players who left tournaments
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTournamentPlayersLeft() {
  console.log('🚀 Setting up tournament_players_left table...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-tournament-players-left.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split into individual statements (simple approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          console.log(`   ${i + 1}. Executing statement...`);
          
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Check if it's a "already exists" error (which is okay)
            if (error.message.includes('already exists') || 
                error.message.includes('relation') && error.message.includes('already exists')) {
              console.log(`   ✅ Statement ${i + 1}: Already exists (skipping)`);
            } else {
              console.error(`   ❌ Statement ${i + 1} failed:`, error.message);
              throw error;
            }
          } else {
            console.log(`   ✅ Statement ${i + 1}: Success`);
          }
        } catch (stmtError) {
          console.error(`   ❌ Statement ${i + 1} failed:`, stmtError.message);
          throw stmtError;
        }
      }
    }

    console.log('\n🎉 tournament_players_left table setup completed successfully!');
    console.log('\n📋 What was created:');
    console.log('   • tournament_players_left table with all necessary columns');
    console.log('   • Performance indexes for efficient queries');
    console.log('   • Row Level Security (RLS) policies');
    console.log('   • Foreign key constraints for data integrity');
    
    console.log('\n🔍 Verification:');
    
    // Verify table exists
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'tournament_players_left');

    if (tableError) {
      console.error('   ❌ Could not verify table creation:', tableError.message);
    } else if (tables && tables.length > 0) {
      console.log('   ✅ tournament_players_left table exists');
    } else {
      console.log('   ⚠️  tournament_players_left table not found');
    }

    // Verify columns
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'tournament_players_left')
      .order('ordinal_position');

    if (columnError) {
      console.error('   ❌ Could not verify columns:', columnError.message);
    } else if (columns && columns.length > 0) {
      console.log('   ✅ Table has the following columns:');
      columns.forEach(col => {
        console.log(`      • ${col.column_name} (${col.data_type})`);
      });
    }

    console.log('\n✨ Ready to track players who leave tournaments!');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupTournamentPlayersLeft();
