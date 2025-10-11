#!/usr/bin/env node

/**
 * Phoenix Force Project Setup Script
 * 
 * This script helps set up the Phoenix Force project from scratch by:
 * - Setting up the database schema
 * - Creating necessary functions and policies
 * - Setting up realtime subscriptions
 * - Creating sample data (optional)
 * 
 * Usage: node setup-project.js [options]
 * Options:
 *   --with-sample-data    Include sample data in setup
 *   --skip-confirmation   Skip confirmation prompts
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

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

// Parse command line arguments
const args = process.argv.slice(2);
const withSampleData = args.includes('--with-sample-data');
const skipConfirmation = args.includes('--skip-confirmation');

async function setupProject() {
  console.log('🚀 Phoenix Force Project Setup\n');
  console.log('This script will set up your Phoenix Force database from scratch.\n');

  if (!skipConfirmation) {
    const confirmed = await askConfirmation('Do you want to proceed? This will modify your database.');
    if (!confirmed) {
      console.log('❌ Setup cancelled by user.');
      process.exit(0);
    }
  }

  try {
    // Check if schema files exist
    const schemaDir = path.join(__dirname, 'schema');
    const setupFile = path.join(schemaDir, 'setup-database.sql');
    
    try {
      await fs.access(setupFile);
    } catch (error) {
      console.log('📋 No setup file found. Please run fetch-database-info.js first to generate schema files.');
      process.exit(1);
    }

    // 1. Set up database schema
    console.log('🏗️  Setting up database schema...');
    await setupDatabaseSchema();

    // 2. Set up RLS policies
    console.log('🔒 Setting up Row Level Security policies...');
    await setupRLSPolicies();

    // 3. Set up functions
    console.log('⚙️  Setting up database functions...');
    await setupFunctions();

    // 4. Set up realtime subscriptions
    console.log('📡 Setting up realtime subscriptions...');
    await setupRealtimeSubscriptions();

    // 5. Create admin user
    console.log('👤 Creating admin user...');
    await createAdminUser();

    // 6. Optional: Add sample data
    if (withSampleData) {
      console.log('📊 Adding sample data...');
      await addSampleData();
    }

    console.log('\n🎉 Project setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Update your .env.local with the admin credentials');
    console.log('   2. Run: npm run dev');
    console.log('   3. Visit: http://localhost:3000');
    console.log('   4. Login with the admin credentials');

  } catch (error) {
    console.error('❌ Error during setup:', error);
    process.exit(1);
  }
}

async function setupDatabaseSchema() {
  const schemaFile = path.join(__dirname, 'schema', 'setup-database.sql');
  const sql = await fs.readFile(schemaFile, 'utf8');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  for (const statement of statements) {
    if (statement.trim()) {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      if (error) {
        console.warn(`⚠️  Warning executing statement: ${error.message}`);
      }
    }
  }
}

async function setupRLSPolicies() {
  const policiesFile = path.join(__dirname, 'schema', 'rls-policies.json');
  
  try {
    const policiesData = await fs.readFile(policiesFile, 'utf8');
    const policies = JSON.parse(policiesData);
    
    for (const policy of policies) {
      const { error } = await supabase.rpc('create_rls_policy', {
        table_name: policy.tablename,
        policy_name: policy.policyname,
        command: policy.cmd,
        roles: policy.roles,
        qualification: policy.qual
      });
      
      if (error) {
        console.warn(`⚠️  Warning creating policy ${policy.policyname}: ${error.message}`);
      }
    }
  } catch (error) {
    console.warn('⚠️  Warning: Could not set up RLS policies:', error.message);
  }
}

async function setupFunctions() {
  const functionsFile = path.join(__dirname, 'schema', 'functions.json');
  
  try {
    const functionsData = await fs.readFile(functionsFile, 'utf8');
    const functions = JSON.parse(functionsData);
    
    for (const func of functions) {
      if (func.prosrc) {
        const { error } = await supabase.rpc('exec_sql', { sql: func.prosrc });
        if (error) {
          console.warn(`⚠️  Warning creating function ${func.proname}: ${error.message}`);
        }
      }
    }
  } catch (error) {
    console.warn('⚠️  Warning: Could not set up functions:', error.message);
  }
}

async function setupRealtimeSubscriptions() {
  const tables = [
    'tournaments',
    'tournament_slots',
    'players',
    'user_profiles',
    'auctions',
    'auction_teams',
    'auction_players',
    'auction_bids'
  ];

  for (const table of tables) {
    const { error } = await supabase.rpc('enable_realtime', { table_name: table });
    if (error) {
      console.warn(`⚠️  Warning enabling realtime for ${table}: ${error.message}`);
    }
  }
}

async function createAdminUser() {
  const adminEmail = 'admin@phoenixforce.com';
  const adminPassword = 'Admin@123456';
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true
  });

  if (authError) {
    console.warn(`⚠️  Warning creating admin user: ${authError.message}`);
    return;
  }

  // Create user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: authData.user.id,
      email: adminEmail,
      role: 'admin',
      status: 'active',
      firstname: 'Admin',
      lastname: 'User'
    });

  if (profileError) {
    console.warn(`⚠️  Warning creating admin profile: ${profileError.message}`);
  } else {
    console.log(`✅ Admin user created successfully!`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
  }
}

async function addSampleData() {
  // Add sample tournaments
  const { error: tournamentError } = await supabase
    .from('tournaments')
    .insert([
      {
        name: 'Phoenix Premier League',
        description: 'The premier cricket tournament',
        total_slots: 32,
        status: 'active',
        host_id: 'admin-user-id'
      },
      {
        name: 'Summer Championship',
        description: 'Summer cricket championship',
        total_slots: 16,
        status: 'upcoming',
        host_id: 'admin-user-id'
      }
    ]);

  if (tournamentError) {
    console.warn(`⚠️  Warning adding sample tournaments: ${tournamentError.message}`);
  }

  // Add sample players
  const samplePlayers = [
    { display_name: 'Virat Kohli', status: 'approved' },
    { display_name: 'Rohit Sharma', status: 'approved' },
    { display_name: 'MS Dhoni', status: 'approved' },
    { display_name: 'Jasprit Bumrah', status: 'approved' },
    { display_name: 'Ravindra Jadeja', status: 'approved' }
  ];

  const { error: playersError } = await supabase
    .from('players')
    .insert(samplePlayers);

  if (playersError) {
    console.warn(`⚠️  Warning adding sample players: ${playersError.message}`);
  }
}

function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Run the script
if (require.main === module) {
  setupProject().catch(console.error);
}

module.exports = { setupProject };
