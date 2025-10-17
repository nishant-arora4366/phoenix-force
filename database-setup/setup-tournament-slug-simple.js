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
    // Step 1: Add slug column
    console.log('📄 Adding slug column...');
    const { error: addColumnError } = await supabase.rpc('exec', {
      sql: `
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'tournaments' 
                AND column_name = 'slug'
            ) THEN
                ALTER TABLE tournaments ADD COLUMN slug varchar(100) UNIQUE;
            END IF;
        END $$;
      `
    });

    if (addColumnError) {
      console.log('⚠️  Column may already exist:', addColumnError.message);
    } else {
      console.log('✅ Slug column added successfully');
    }

    // Step 2: Create index
    console.log('📄 Creating index...');
    const { error: indexError } = await supabase.rpc('exec', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON tournaments(slug);'
    });

    if (indexError) {
      console.log('⚠️  Index may already exist:', indexError.message);
    } else {
      console.log('✅ Index created successfully');
    }

    // Step 3: Generate slugs for existing tournaments
    console.log('📄 Generating slugs for existing tournaments...');
    const { data: tournaments, error: fetchError } = await supabase
      .from('tournaments')
      .select('id, name, slug');

    if (fetchError) {
      console.error('❌ Error fetching tournaments:', fetchError.message);
      return;
    }

    console.log(`📊 Found ${tournaments.length} tournaments`);

    for (const tournament of tournaments) {
      if (!tournament.slug) {
        // Generate slug from name
        let slug = tournament.name
          .toLowerCase()
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim('-')
          .substring(0, 50);

        if (!slug) {
          slug = 'tournament';
        }

        // Check if slug exists and add counter if needed
        let finalSlug = slug;
        let counter = 0;
        
        while (true) {
          const { data: existing } = await supabase
            .from('tournaments')
            .select('id')
            .eq('slug', finalSlug)
            .neq('id', tournament.id)
            .single();

          if (!existing) {
            break;
          }

          counter++;
          finalSlug = `${slug}-${counter}`;
        }

        // Update tournament with slug
        const { error: updateError } = await supabase
          .from('tournaments')
          .update({ slug: finalSlug })
          .eq('id', tournament.id);

        if (updateError) {
          console.error(`❌ Error updating tournament ${tournament.name}:`, updateError.message);
        } else {
          console.log(`✅ Generated slug for "${tournament.name}": ${finalSlug}`);
        }
      }
    }

    // Step 4: Make slug column NOT NULL
    console.log('📄 Making slug column NOT NULL...');
    const { error: notNullError } = await supabase.rpc('exec', {
      sql: 'ALTER TABLE tournaments ALTER COLUMN slug SET NOT NULL;'
    });

    if (notNullError) {
      console.log('⚠️  Column may already be NOT NULL:', notNullError.message);
    } else {
      console.log('✅ Slug column set to NOT NULL');
    }

    // Test the setup
    console.log('\n🧪 Testing tournament slug functionality...');
    
    const { data: testTournaments, error: testError } = await supabase
      .from('tournaments')
      .select('id, name, slug')
      .limit(5);

    if (testError) {
      console.error('❌ Error fetching tournaments:', testError.message);
    } else {
      console.log('✅ Tournament slugs:');
      testTournaments.forEach(tournament => {
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
