#!/usr/bin/env node

/**
 * Setup Supabase Storage for Tournament Schedules
 * 
 * This script sets up the storage bucket and RLS policies
 * for tournament schedule uploads in Phoenix Force.
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
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease check your .env file and try again.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage for Tournament Schedules...\n');

  try {
    // Read the storage setup SQL file
    const sqlPath = path.join(__dirname, 'schema', 'tournament-schedule-storage.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ SQL file not found:', sqlPath);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Some errors are expected (like "already exists")
            if (error.message.includes('already exists') || 
                error.message.includes('duplicate key') ||
                error.message.includes('relation already exists') ||
                error.message.includes('policy') && error.message.includes('already exists')) {
              console.log(`⚠️  Statement ${i + 1}: ${error.message.split('\n')[0]}`);
            } else {
              console.error(`❌ Statement ${i + 1} failed:`, error.message);
            }
          } else {
            console.log(`✅ Statement ${i + 1}: Executed successfully`);
          }
        } catch (err) {
          console.error(`❌ Statement ${i + 1} failed:`, err.message);
        }
      }
    }

    // Verify bucket was created
    const { data: buckets, error: bucketError } = await supabase
      .from('storage.buckets')
      .select('*')
      .eq('id', 'tournament-schedules');

    if (bucketError) {
      console.log('⚠️  Could not verify bucket creation (this is normal for some setups)');
    } else if (buckets && buckets.length > 0) {
      console.log('✅ Tournament schedules bucket created successfully');
      console.log(`   - Name: ${buckets[0].name}`);
      console.log(`   - Public: ${buckets[0].public}`);
      console.log(`   - File size limit: ${buckets[0].file_size_limit} bytes (${Math.round(buckets[0].file_size_limit / 1024 / 1024)}MB)`);
    }

    console.log('\n🎉 Tournament schedule storage setup completed!');
    
    console.log('\n📝 Next steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Storage');
    console.log('3. Create a bucket named "tournament-schedules" if it doesn\'t exist');
    console.log('4. Set it as public');
    console.log('5. Configure file size limit to 10MB');
    console.log('6. Set allowed MIME types to: image/jpeg, image/png, image/webp');
    console.log('7. Test the schedule upload functionality in your tournament page');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    console.log('\n📝 Manual setup required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Storage');
    console.log('3. Create a bucket named "tournament-schedules"');
    console.log('4. Set it as public');
    console.log('5. Configure file size limit to 10MB');
    console.log('6. Set allowed MIME types to: image/jpeg, image/png, image/webp');
    console.log('7. Run the SQL from tournament-schedule-storage.sql in your SQL editor');
  }
}

// Run the setup
setupStorage().catch(console.error);
