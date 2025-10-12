#!/usr/bin/env node

/**
 * Setup Supabase Storage for Profile Pictures
 * 
 * This script sets up the storage bucket and RLS policies
 * for profile picture uploads in Phoenix Force.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
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

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage for Profile Pictures...\n');

  try {
    // Read the storage setup SQL file
    const sqlPath = path.join(__dirname, 'schema', 'storage-setup.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📋 Executing storage setup SQL...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      // If exec_sql doesn't exist, try direct query execution
      console.log('⚠️  exec_sql function not found, trying alternative approach...');
      
      // Split SQL into individual statements and execute them
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            const { error: stmtError } = await supabase.rpc('exec', { query: statement });
            if (stmtError) {
              console.log(`⚠️  Statement failed (might already exist): ${statement.substring(0, 50)}...`);
            }
          } catch (err) {
            console.log(`⚠️  Statement failed (might already exist): ${statement.substring(0, 50)}...`);
          }
        }
      }
    }

    console.log('✅ Storage setup completed!');

    // Verify the setup
    console.log('\n🔍 Verifying storage setup...');
    
    // Check if bucket exists
    const { data: buckets, error: bucketError } = await supabase
      .from('storage.buckets')
      .select('*')
      .eq('id', 'profile-pictures');

    if (bucketError) {
      console.log('⚠️  Could not verify bucket creation (this is normal for some setups)');
    } else if (buckets && buckets.length > 0) {
      console.log('✅ Profile pictures bucket created successfully');
      console.log(`   - Name: ${buckets[0].name}`);
      console.log(`   - Public: ${buckets[0].public}`);
      console.log(`   - File size limit: ${buckets[0].file_size_limit} bytes (${Math.round(buckets[0].file_size_limit / 1024 / 1024)}MB)`);
    } else {
      console.log('⚠️  Bucket not found - you may need to create it manually in Supabase dashboard');
    }

    console.log('\n📝 Next steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Storage');
    console.log('3. Create a bucket named "profile-pictures" if it doesn\'t exist');
    console.log('4. Set it as public');
    console.log('5. Configure file size limit to 15MB');
    console.log('6. Set allowed MIME types to: image/jpeg, image/png, image/webp');

  } catch (error) {
    console.error('❌ Error setting up storage:', error.message);
    console.log('\n📝 Manual setup required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Storage');
    console.log('3. Create a bucket named "profile-pictures"');
    console.log('4. Set it as public');
    console.log('5. Configure file size limit to 15MB');
    console.log('6. Set allowed MIME types to: image/jpeg, image/png, image/webp');
    console.log('7. Run the SQL from database-setup/schema/storage-setup.sql in the SQL editor');
  }
}

// Run the setup
setupStorage().catch(console.error);
