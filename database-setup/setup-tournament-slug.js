const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupTournamentSlug() {
  console.log('🚀 Setting up tournament slug functionality...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-tournament-slug.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Executing SQL migration...');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            // Some errors are expected (like "already exists")
            if (error.message.includes('already exists') || 
                error.message.includes('does not exist') ||
                error.message.includes('duplicate key')) {
              console.log(`⚠️  ${error.message}`);
            } else {
              console.error(`❌ Error: ${error.message}`);
              errorCount++;
            }
          } else {
            console.log(`✅ Executed successfully`);
            successCount++;
          }
        }
      } catch (err) {
        console.error(`❌ Unexpected error: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    // Test the setup
    console.log('\n🧪 Testing tournament slug functionality...');
    
    const { data: tournaments, error: fetchError } = await supabase
      .from('tournaments')
      .select('id, name, slug')
      .limit(5);

    if (fetchError) {
      console.error('❌ Error fetching tournaments:', fetchError.message);
    } else {
      console.log('✅ Tournament slugs:');
      tournaments.forEach(tournament => {
        console.log(`   📝 "${tournament.name}" → /t/${tournament.slug}`);
      });
    }

    console.log('\n🎉 Tournament slug setup completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Update your application to use slug-based URLs');
    console.log('   2. Create redirect routes for short URLs');
    console.log('   3. Update Open Graph meta tags to use short URLs');
    console.log('\n💡 Example URLs:');
    console.log('   Old: /tournaments/3fe7e4ed-33c3-4788-bab4-22710a278c34');
    console.log('   New: /t/summer-cricket-championship-2024');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
setupTournamentSlug();
