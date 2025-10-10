const fs = require('fs');
const path = require('path');

// Read the JSON data
const jsonFilePath = '/Users/I516374/Desktop/Personal/Cricket/cardOrganiser/card_organiser/data/players.json';
const playersData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

console.log(`Found ${playersData.length} players to migrate`);

// Function to calculate base price based on ratings
function calculateBasePrice(battingRating, bowlingRating) {
  const ratings = [battingRating, bowlingRating];
  
  // If either rating is Advanced, return 100
  if (ratings.includes('Advanced')) {
    return '100';
  }
  
  // If either rating is Intermediate, return 60
  if (ratings.includes('Intermediate')) {
    return '60';
  }
  
  // Otherwise (Beginner, NA, etc.), return 40
  return '40';
}

// Function to map batting style
function mapBattingStyle(battingStyle) {
  switch (battingStyle) {
    case 'RHB':
      return 'Right Hand Batter';
    case 'LHB':
      return 'Left Hand Batter';
    default:
      return null;
  }
}

// Function to map bowling style
function mapBowlingStyle(bowlingStyle) {
  switch (bowlingStyle) {
    case 'RHM':
      return 'Right Arm Medium';
    case 'LHM':
      return 'Left Arm Medium';
    case 'RHM/F':
      return 'Right Arm Fast';
    case 'LHM/F':
      return 'Left Arm Fast';
    case 'Spinner':
      return 'Right Arm Spin';
    case 'Throw':
    case 'NA':
    default:
      return null;
  }
}

// Generate SQL migration script
let sqlScript = `-- Migration script to import players from JSON data
-- Generated on: ${new Date().toISOString()}
-- Total players: ${playersData.length}

-- First, get the admin user ID
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get admin user ID for nishantarora1998@gmail.com
    SELECT id INTO admin_user_id 
    FROM users 
    WHERE email = 'nishantarora1998@gmail.com' 
    AND role = 'admin';
    
    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Admin user with email nishantarora1998@gmail.com not found';
    END IF;
    
    RAISE NOTICE 'Found admin user ID: %', admin_user_id;
    
    -- Import players
    RAISE NOTICE 'Starting player import...';
`;

// Process each player
playersData.forEach((player, index) => {
  const basePrice = calculateBasePrice(player.battingRating, player.bowlingRating);
  const battingStyle = mapBattingStyle(player.battingStyle);
  const bowlingStyle = mapBowlingStyle(player.bowlingStyle);
  
  // Insert player
  sqlScript += `
    -- Player ${index + 1}: ${player.name}
    INSERT INTO players (
        id,
        user_id,
        display_name,
        bio,
        profile_pic_url,
        mobile_number,
        cricheroes_profile_url,
        status,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        '${player.id}',
        NULL,
        '${player.name.replace(/'/g, "''")}',
        NULL,
        NULL,
        NULL,
        NULL,
        'approved',
        admin_user_id,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        status = EXCLUDED.status,
        updated_at = NOW();`;

  // Add batting style skill assignment if applicable
  if (battingStyle) {
    sqlScript += `
    
    -- Add batting style skill assignment for ${player.name}
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '${player.id}',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = '${battingStyle}'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;`;
  }

  // Add bowling style skill assignment if applicable
  if (bowlingStyle) {
    sqlScript += `
    
    -- Add bowling style skill assignment for ${player.name}
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '${player.id}',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = '${bowlingStyle}'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;`;
  }

  // Add community skill assignment (iBlitz for all players)
  sqlScript += `
    
    -- Add community skill assignment for ${player.name} (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '${player.id}',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;`;

  // Add base price skill assignment
  sqlScript += `
    
    -- Add base price skill assignment for ${player.name}
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '${player.id}',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '${basePrice}'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;`;

  // Add role skill assignment (both 'Batter' and 'Bowler' as array)
  sqlScript += `
    
    -- Add role skill assignment for ${player.name} (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '${player.id}',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'Batter'),
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'Bowler')
        ],
        ARRAY['Batter', 'Bowler']
    FROM player_skills ps
    WHERE ps.skill_name = 'Role'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;`;
});

// Close the DO block
sqlScript += `
    
    RAISE NOTICE 'Player import completed successfully!';
    RAISE NOTICE 'Total players processed: ${playersData.length}';
    
END $$;

-- Verification queries
SELECT 
    'Players imported' as category,
    COUNT(*) as count
FROM players 
WHERE created_by = (SELECT id FROM users WHERE email = 'nishantarora1998@gmail.com' AND role = 'admin');

SELECT 
    'Skill assignments created' as category,
    COUNT(*) as count
FROM player_skill_assignments psa
JOIN players p ON psa.player_id = p.id
WHERE p.created_by = (SELECT id FROM users WHERE email = 'nishantarora1998@gmail.com' AND role = 'admin');

-- Show sample of imported players
SELECT 
    p.display_name,
    p.base_price,
    p.status,
    p.created_at
FROM players p
WHERE p.created_by = (SELECT id FROM users WHERE email = 'nishantarora1998@gmail.com' AND role = 'admin')
ORDER BY p.created_at DESC
LIMIT 10;
`;

// Write the SQL script to a file
const outputPath = path.join(__dirname, 'migrate-players-import.sql');
fs.writeFileSync(outputPath, sqlScript);

console.log(`\nMigration script generated: ${outputPath}`);
console.log(`\nSummary:`);
console.log(`- Total players: ${playersData.length}`);
console.log(`- Base price calculation: Advanced=100, Intermediate=60, else=40`);
console.log(`- All players will be assigned to 'iBlitz' group`);
console.log(`- Status: approved`);
console.log(`- Created by: admin user (nishantarora1998@gmail.com)`);

// Show some statistics
const basePriceStats = {};
const battingStyleStats = {};
const bowlingStyleStats = {};

playersData.forEach(player => {
  const basePrice = calculateBasePrice(player.battingRating, player.bowlingRating);
  basePriceStats[basePrice] = (basePriceStats[basePrice] || 0) + 1;
  
  const battingStyle = mapBattingStyle(player.battingStyle);
  if (battingStyle) {
    battingStyleStats[battingStyle] = (battingStyleStats[battingStyle] || 0) + 1;
  }
  
  const bowlingStyle = mapBowlingStyle(player.bowlingStyle);
  if (bowlingStyle) {
    bowlingStyleStats[bowlingStyle] = (bowlingStyleStats[bowlingStyle] || 0) + 1;
  }
});

console.log(`\nBase Price Distribution:`);
Object.entries(basePriceStats).forEach(([price, count]) => {
  console.log(`  ${price}: ${count} players`);
});

console.log(`\nBatting Style Distribution:`);
Object.entries(battingStyleStats).forEach(([style, count]) => {
  console.log(`  ${style}: ${count} players`);
});

console.log(`\nBowling Style Distribution:`);
Object.entries(bowlingStyleStats).forEach(([style, count]) => {
  console.log(`  ${style}: ${count} players`);
});

console.log(`\nTo run the migration:`);
console.log(`1. Review the generated SQL file: ${outputPath}`);
console.log(`2. Run it against your database using psql or your preferred SQL client`);
console.log(`3. The script includes verification queries at the end`);
