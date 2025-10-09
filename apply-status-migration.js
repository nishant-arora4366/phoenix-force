#!/usr/bin/env node

/**
 * Script to apply the tournament status migration
 * This fixes the mismatch between frontend statusFlow and database constraint
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🔄 Applying tournament status migration...')
    
    // Read the migration file
    const fs = require('fs')
    const path = require('path')
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20241208_add_missing_tournament_statuses.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }
    
    console.log('✅ Migration applied successfully!')
    console.log('📋 Tournament status constraint updated to include:')
    console.log('   - draft')
    console.log('   - registration_open')
    console.log('   - registration_closed')
    console.log('   - auction_started')
    console.log('   - auction_completed')
    console.log('   - teams_formed')
    console.log('   - completed')
    console.log('   - in_progress')
    console.log('')
    console.log('🎉 Admins can now mark tournaments as complete!')
    
  } catch (error) {
    console.error('❌ Error applying migration:', error)
    process.exit(1)
  }
}

// Check if we have the exec_sql function, if not, provide manual instructions
async function checkMigrationSupport() {
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' })
    if (error && error.message.includes('function exec_sql')) {
      console.log('⚠️  exec_sql function not available. Please apply the migration manually:')
      console.log('')
      console.log('1. Go to your Supabase dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Run the following SQL:')
      console.log('')
      console.log('-- Drop existing constraint')
      console.log('ALTER TABLE tournaments DROP CONSTRAINT IF EXISTS tournaments_status_check;')
      console.log('')
      console.log('-- Add new constraint with all status values')
      console.log('ALTER TABLE tournaments ADD CONSTRAINT tournaments_status_check')
      console.log('CHECK (status IN (')
      console.log("  'draft',")
      console.log("  'registration_open',")
      console.log("  'registration_closed',")
      console.log("  'auction_started',")
      console.log("  'auction_completed',")
      console.log("  'teams_formed',")
      console.log("  'completed',")
      console.log("  'in_progress'")
      console.log('));')
      console.log('')
      return false
    }
    return true
  } catch (error) {
    console.log('⚠️  Could not check migration support. Please apply manually.')
    return false
  }
}

async function main() {
  const canAutoMigrate = await checkMigrationSupport()
  if (canAutoMigrate) {
    await applyMigration()
  }
}

main()
