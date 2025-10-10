-- Migration script to import players from JSON data
-- Generated on: 2025-10-10T05:08:01.103Z
-- Total players: 236

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

    -- Player 1: Nishant Arora
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
        '6b7157ae-0e04-41d6-8337-f73511dc9d3c',
        NULL,
        'Nishant Arora',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Nishant Arora
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6b7157ae-0e04-41d6-8337-f73511dc9d3c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Nishant Arora
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6b7157ae-0e04-41d6-8337-f73511dc9d3c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Nishant Arora (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '6b7157ae-0e04-41d6-8337-f73511dc9d3c',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Nishant Arora
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6b7157ae-0e04-41d6-8337-f73511dc9d3c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Nishant Arora (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '6b7157ae-0e04-41d6-8337-f73511dc9d3c',
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
        value_array = EXCLUDED.value_array;
    -- Player 2: Devi Prasath
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
        'e997e421-5c04-4d7e-b22a-dfa5575ef7c1',
        NULL,
        'Devi Prasath',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Devi Prasath
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e997e421-5c04-4d7e-b22a-dfa5575ef7c1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Devi Prasath
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e997e421-5c04-4d7e-b22a-dfa5575ef7c1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Fast'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Devi Prasath (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'e997e421-5c04-4d7e-b22a-dfa5575ef7c1',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Devi Prasath
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e997e421-5c04-4d7e-b22a-dfa5575ef7c1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Devi Prasath (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'e997e421-5c04-4d7e-b22a-dfa5575ef7c1',
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
        value_array = EXCLUDED.value_array;
    -- Player 3: Satish 
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
        '3f4e66f9-13f2-4b03-b2db-0455ab12c9c9',
        NULL,
        'Satish ',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Satish 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3f4e66f9-13f2-4b03-b2db-0455ab12c9c9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Satish 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3f4e66f9-13f2-4b03-b2db-0455ab12c9c9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Left Arm Fast'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Satish  (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3f4e66f9-13f2-4b03-b2db-0455ab12c9c9',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Satish 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3f4e66f9-13f2-4b03-b2db-0455ab12c9c9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Satish  (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3f4e66f9-13f2-4b03-b2db-0455ab12c9c9',
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
        value_array = EXCLUDED.value_array;
    -- Player 4: Nithyahari
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
        '17e14a63-0a38-4843-baf4-356dc658ac07',
        NULL,
        'Nithyahari',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Nithyahari
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '17e14a63-0a38-4843-baf4-356dc658ac07',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Nithyahari
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '17e14a63-0a38-4843-baf4-356dc658ac07',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Nithyahari (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '17e14a63-0a38-4843-baf4-356dc658ac07',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Nithyahari
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '17e14a63-0a38-4843-baf4-356dc658ac07',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Nithyahari (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '17e14a63-0a38-4843-baf4-356dc658ac07',
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
        value_array = EXCLUDED.value_array;
    -- Player 5: Swarup
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
        '368a6497-245f-4677-8f50-4e82c36265eb',
        NULL,
        'Swarup',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Swarup
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '368a6497-245f-4677-8f50-4e82c36265eb',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Swarup
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '368a6497-245f-4677-8f50-4e82c36265eb',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Fast'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Swarup (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '368a6497-245f-4677-8f50-4e82c36265eb',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Swarup
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '368a6497-245f-4677-8f50-4e82c36265eb',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Swarup (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '368a6497-245f-4677-8f50-4e82c36265eb',
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
        value_array = EXCLUDED.value_array;
    -- Player 6: Agrim Dogra
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
        '1b26c6b2-4e65-473b-9305-b17ae243efd8',
        NULL,
        'Agrim Dogra',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Agrim Dogra
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1b26c6b2-4e65-473b-9305-b17ae243efd8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Agrim Dogra
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1b26c6b2-4e65-473b-9305-b17ae243efd8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Agrim Dogra (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '1b26c6b2-4e65-473b-9305-b17ae243efd8',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Agrim Dogra
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1b26c6b2-4e65-473b-9305-b17ae243efd8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Agrim Dogra (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '1b26c6b2-4e65-473b-9305-b17ae243efd8',
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
        value_array = EXCLUDED.value_array;
    -- Player 7: Harsh Masand
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
        '6921105f-392b-4359-9a1e-4e006da5a3e7',
        NULL,
        'Harsh Masand',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Harsh Masand
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6921105f-392b-4359-9a1e-4e006da5a3e7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Harsh Masand
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6921105f-392b-4359-9a1e-4e006da5a3e7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Harsh Masand (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '6921105f-392b-4359-9a1e-4e006da5a3e7',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Harsh Masand
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6921105f-392b-4359-9a1e-4e006da5a3e7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Harsh Masand (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '6921105f-392b-4359-9a1e-4e006da5a3e7',
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
        value_array = EXCLUDED.value_array;
    -- Player 8: Darshdeep Singh
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
        'ccc0779d-5e67-4715-a577-0a5b929b5c62',
        NULL,
        'Darshdeep Singh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Darshdeep Singh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ccc0779d-5e67-4715-a577-0a5b929b5c62',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Darshdeep Singh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ccc0779d-5e67-4715-a577-0a5b929b5c62',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Fast'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Darshdeep Singh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ccc0779d-5e67-4715-a577-0a5b929b5c62',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Darshdeep Singh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ccc0779d-5e67-4715-a577-0a5b929b5c62',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Darshdeep Singh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ccc0779d-5e67-4715-a577-0a5b929b5c62',
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
        value_array = EXCLUDED.value_array;
    -- Player 9: Abhinav Chauhan
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
        '865ec9bb-2c0d-4ab9-871a-c26d6d28abea',
        NULL,
        'Abhinav Chauhan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Abhinav Chauhan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '865ec9bb-2c0d-4ab9-871a-c26d6d28abea',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Abhinav Chauhan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '865ec9bb-2c0d-4ab9-871a-c26d6d28abea',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Fast'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Abhinav Chauhan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '865ec9bb-2c0d-4ab9-871a-c26d6d28abea',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Abhinav Chauhan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '865ec9bb-2c0d-4ab9-871a-c26d6d28abea',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Abhinav Chauhan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '865ec9bb-2c0d-4ab9-871a-c26d6d28abea',
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
        value_array = EXCLUDED.value_array;
    -- Player 10: Vivek
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
        'bf1af7bb-853d-4ff7-a82b-7d7013603583',
        NULL,
        'Vivek',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Vivek
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'bf1af7bb-853d-4ff7-a82b-7d7013603583',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Vivek
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'bf1af7bb-853d-4ff7-a82b-7d7013603583',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Spin'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Vivek (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'bf1af7bb-853d-4ff7-a82b-7d7013603583',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Vivek
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'bf1af7bb-853d-4ff7-a82b-7d7013603583',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Vivek (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'bf1af7bb-853d-4ff7-a82b-7d7013603583',
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
        value_array = EXCLUDED.value_array;
    -- Player 11: Gautam
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
        '62b34552-1525-41f2-9440-c75cd5dce9c1',
        NULL,
        'Gautam',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Gautam
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '62b34552-1525-41f2-9440-c75cd5dce9c1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Gautam
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '62b34552-1525-41f2-9440-c75cd5dce9c1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Gautam (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '62b34552-1525-41f2-9440-c75cd5dce9c1',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Gautam
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '62b34552-1525-41f2-9440-c75cd5dce9c1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Gautam (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '62b34552-1525-41f2-9440-c75cd5dce9c1',
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
        value_array = EXCLUDED.value_array;
    -- Player 12: Pranav Sirikonda
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
        '562d2692-a942-4564-9ee5-ddf0cf47689c',
        NULL,
        'Pranav Sirikonda',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Pranav Sirikonda
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '562d2692-a942-4564-9ee5-ddf0cf47689c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Left Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Pranav Sirikonda
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '562d2692-a942-4564-9ee5-ddf0cf47689c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Spin'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Pranav Sirikonda (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '562d2692-a942-4564-9ee5-ddf0cf47689c',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Pranav Sirikonda
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '562d2692-a942-4564-9ee5-ddf0cf47689c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Pranav Sirikonda (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '562d2692-a942-4564-9ee5-ddf0cf47689c',
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
        value_array = EXCLUDED.value_array;
    -- Player 13: Mrigank
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
        '62f10a66-43b6-4a3d-9b80-7a1d6d45929e',
        NULL,
        'Mrigank',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Mrigank
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '62f10a66-43b6-4a3d-9b80-7a1d6d45929e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Mrigank
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '62f10a66-43b6-4a3d-9b80-7a1d6d45929e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Mrigank (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '62f10a66-43b6-4a3d-9b80-7a1d6d45929e',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Mrigank
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '62f10a66-43b6-4a3d-9b80-7a1d6d45929e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '40'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Mrigank (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '62f10a66-43b6-4a3d-9b80-7a1d6d45929e',
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
        value_array = EXCLUDED.value_array;
    -- Player 14: Venkatesh N
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
        '95fb65ac-6b82-459d-93ca-48c4cd2e23a9',
        NULL,
        'Venkatesh N',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Venkatesh N
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '95fb65ac-6b82-459d-93ca-48c4cd2e23a9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Venkatesh N (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '95fb65ac-6b82-459d-93ca-48c4cd2e23a9',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Venkatesh N
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '95fb65ac-6b82-459d-93ca-48c4cd2e23a9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '40'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Venkatesh N (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '95fb65ac-6b82-459d-93ca-48c4cd2e23a9',
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
        value_array = EXCLUDED.value_array;
    -- Player 15: Lakshman
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
        '6955857a-7652-465c-9dd5-75c5ff1a424e',
        NULL,
        'Lakshman',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Lakshman
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6955857a-7652-465c-9dd5-75c5ff1a424e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Lakshman
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6955857a-7652-465c-9dd5-75c5ff1a424e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Lakshman (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '6955857a-7652-465c-9dd5-75c5ff1a424e',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Lakshman
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6955857a-7652-465c-9dd5-75c5ff1a424e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Lakshman (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '6955857a-7652-465c-9dd5-75c5ff1a424e',
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
        value_array = EXCLUDED.value_array;
    -- Player 16: Rajesh
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
        '40e40039-fd93-4726-b23d-7f16148d5396',
        NULL,
        'Rajesh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Rajesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '40e40039-fd93-4726-b23d-7f16148d5396',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Rajesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '40e40039-fd93-4726-b23d-7f16148d5396',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Rajesh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '40e40039-fd93-4726-b23d-7f16148d5396',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Rajesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '40e40039-fd93-4726-b23d-7f16148d5396',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Rajesh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '40e40039-fd93-4726-b23d-7f16148d5396',
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
        value_array = EXCLUDED.value_array;
    -- Player 17: Khwahish
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
        'daf44719-791c-45b0-a00c-3698c511a2c5',
        NULL,
        'Khwahish',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Khwahish
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'daf44719-791c-45b0-a00c-3698c511a2c5',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Khwahish
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'daf44719-791c-45b0-a00c-3698c511a2c5',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Khwahish (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'daf44719-791c-45b0-a00c-3698c511a2c5',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Khwahish
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'daf44719-791c-45b0-a00c-3698c511a2c5',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Khwahish (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'daf44719-791c-45b0-a00c-3698c511a2c5',
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
        value_array = EXCLUDED.value_array;
    -- Player 18: Anand
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
        'b9fb2f80-61ee-452a-b1c1-df6fda1f6bca',
        NULL,
        'Anand',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Anand
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b9fb2f80-61ee-452a-b1c1-df6fda1f6bca',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Anand (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b9fb2f80-61ee-452a-b1c1-df6fda1f6bca',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Anand
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b9fb2f80-61ee-452a-b1c1-df6fda1f6bca',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Anand (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b9fb2f80-61ee-452a-b1c1-df6fda1f6bca',
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
        value_array = EXCLUDED.value_array;
    -- Player 19: Aditya Bhuvangiri
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
        '207620dc-32b6-43b8-8476-3520cb9f9b43',
        NULL,
        'Aditya Bhuvangiri',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Aditya Bhuvangiri
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '207620dc-32b6-43b8-8476-3520cb9f9b43',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Aditya Bhuvangiri (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '207620dc-32b6-43b8-8476-3520cb9f9b43',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Aditya Bhuvangiri
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '207620dc-32b6-43b8-8476-3520cb9f9b43',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '40'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Aditya Bhuvangiri (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '207620dc-32b6-43b8-8476-3520cb9f9b43',
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
        value_array = EXCLUDED.value_array;
    -- Player 20: Suman De
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
        '12b603cb-5e02-4a73-a121-0fc874725307',
        NULL,
        'Suman De',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Suman De
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '12b603cb-5e02-4a73-a121-0fc874725307',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Suman De
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '12b603cb-5e02-4a73-a121-0fc874725307',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Suman De (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '12b603cb-5e02-4a73-a121-0fc874725307',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Suman De
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '12b603cb-5e02-4a73-a121-0fc874725307',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Suman De (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '12b603cb-5e02-4a73-a121-0fc874725307',
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
        value_array = EXCLUDED.value_array;
    -- Player 21: Akhil
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
        '2242ac7d-2604-4bbb-93a8-48e49f42d7a2',
        NULL,
        'Akhil',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Akhil
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2242ac7d-2604-4bbb-93a8-48e49f42d7a2',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Akhil
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2242ac7d-2604-4bbb-93a8-48e49f42d7a2',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Akhil (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '2242ac7d-2604-4bbb-93a8-48e49f42d7a2',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Akhil
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2242ac7d-2604-4bbb-93a8-48e49f42d7a2',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Akhil (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '2242ac7d-2604-4bbb-93a8-48e49f42d7a2',
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
        value_array = EXCLUDED.value_array;
    -- Player 22: Praveen Kumar
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
        '5fa049ce-590f-4fcf-a93c-fb6a0c61e8fe',
        NULL,
        'Praveen Kumar',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Praveen Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '5fa049ce-590f-4fcf-a93c-fb6a0c61e8fe',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Praveen Kumar (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '5fa049ce-590f-4fcf-a93c-fb6a0c61e8fe',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Praveen Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '5fa049ce-590f-4fcf-a93c-fb6a0c61e8fe',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Praveen Kumar (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '5fa049ce-590f-4fcf-a93c-fb6a0c61e8fe',
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
        value_array = EXCLUDED.value_array;
    -- Player 23: Ajay H N
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
        '00771c93-aebb-4d1e-aa26-9c19b47a9bdf',
        NULL,
        'Ajay H N',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ajay H N
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '00771c93-aebb-4d1e-aa26-9c19b47a9bdf',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ajay H N (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '00771c93-aebb-4d1e-aa26-9c19b47a9bdf',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ajay H N
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '00771c93-aebb-4d1e-aa26-9c19b47a9bdf',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ajay H N (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '00771c93-aebb-4d1e-aa26-9c19b47a9bdf',
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
        value_array = EXCLUDED.value_array;
    -- Player 24: Krishna Sharma
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
        '5bcd17fa-fd0b-4c76-a99d-916e0925082c',
        NULL,
        'Krishna Sharma',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Krishna Sharma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '5bcd17fa-fd0b-4c76-a99d-916e0925082c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Krishna Sharma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '5bcd17fa-fd0b-4c76-a99d-916e0925082c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Krishna Sharma (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '5bcd17fa-fd0b-4c76-a99d-916e0925082c',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Krishna Sharma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '5bcd17fa-fd0b-4c76-a99d-916e0925082c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Krishna Sharma (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '5bcd17fa-fd0b-4c76-a99d-916e0925082c',
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
        value_array = EXCLUDED.value_array;
    -- Player 25: Abhijit
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
        'c65e3890-ada0-495a-9f1e-35ae0dbe4234',
        NULL,
        'Abhijit',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Abhijit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c65e3890-ada0-495a-9f1e-35ae0dbe4234',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Abhijit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c65e3890-ada0-495a-9f1e-35ae0dbe4234',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Abhijit (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c65e3890-ada0-495a-9f1e-35ae0dbe4234',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Abhijit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c65e3890-ada0-495a-9f1e-35ae0dbe4234',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Abhijit (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c65e3890-ada0-495a-9f1e-35ae0dbe4234',
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
        value_array = EXCLUDED.value_array;
    -- Player 26: Naveen 
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
        '7b6bfa2f-6ff3-4856-a212-ebe97cfd16d8',
        NULL,
        'Naveen ',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Naveen 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7b6bfa2f-6ff3-4856-a212-ebe97cfd16d8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Left Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Naveen 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7b6bfa2f-6ff3-4856-a212-ebe97cfd16d8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Spin'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Naveen  (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '7b6bfa2f-6ff3-4856-a212-ebe97cfd16d8',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Naveen 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7b6bfa2f-6ff3-4856-a212-ebe97cfd16d8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Naveen  (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '7b6bfa2f-6ff3-4856-a212-ebe97cfd16d8',
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
        value_array = EXCLUDED.value_array;
    -- Player 27: Shrikanth
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
        '2888a290-99af-40ab-b8c1-944054157479',
        NULL,
        'Shrikanth',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Shrikanth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2888a290-99af-40ab-b8c1-944054157479',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Shrikanth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2888a290-99af-40ab-b8c1-944054157479',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Shrikanth (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '2888a290-99af-40ab-b8c1-944054157479',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Shrikanth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2888a290-99af-40ab-b8c1-944054157479',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Shrikanth (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '2888a290-99af-40ab-b8c1-944054157479',
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
        value_array = EXCLUDED.value_array;
    -- Player 28: Diwakar
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
        '17101683-f278-4565-9255-ab4f4181f21c',
        NULL,
        'Diwakar',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Diwakar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '17101683-f278-4565-9255-ab4f4181f21c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Diwakar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '17101683-f278-4565-9255-ab4f4181f21c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Diwakar (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '17101683-f278-4565-9255-ab4f4181f21c',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Diwakar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '17101683-f278-4565-9255-ab4f4181f21c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Diwakar (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '17101683-f278-4565-9255-ab4f4181f21c',
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
        value_array = EXCLUDED.value_array;
    -- Player 29: Manikantavarma
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
        'e5cd7914-09eb-407a-b700-be2a60071474',
        NULL,
        'Manikantavarma',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Manikantavarma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e5cd7914-09eb-407a-b700-be2a60071474',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Manikantavarma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e5cd7914-09eb-407a-b700-be2a60071474',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Manikantavarma (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'e5cd7914-09eb-407a-b700-be2a60071474',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Manikantavarma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e5cd7914-09eb-407a-b700-be2a60071474',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Manikantavarma (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'e5cd7914-09eb-407a-b700-be2a60071474',
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
        value_array = EXCLUDED.value_array;
    -- Player 30: Sharan
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
        'eb250fe8-6032-4e7f-8791-3b9f0a6b87f1',
        NULL,
        'Sharan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sharan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'eb250fe8-6032-4e7f-8791-3b9f0a6b87f1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sharan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'eb250fe8-6032-4e7f-8791-3b9f0a6b87f1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sharan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'eb250fe8-6032-4e7f-8791-3b9f0a6b87f1',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sharan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'eb250fe8-6032-4e7f-8791-3b9f0a6b87f1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sharan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'eb250fe8-6032-4e7f-8791-3b9f0a6b87f1',
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
        value_array = EXCLUDED.value_array;
    -- Player 31: Yeshwanth
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
        'aac6b1e3-8c18-494f-a516-28f8d0b85734',
        NULL,
        'Yeshwanth',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Yeshwanth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'aac6b1e3-8c18-494f-a516-28f8d0b85734',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Yeshwanth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'aac6b1e3-8c18-494f-a516-28f8d0b85734',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Yeshwanth (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'aac6b1e3-8c18-494f-a516-28f8d0b85734',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Yeshwanth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'aac6b1e3-8c18-494f-a516-28f8d0b85734',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Yeshwanth (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'aac6b1e3-8c18-494f-a516-28f8d0b85734',
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
        value_array = EXCLUDED.value_array;
    -- Player 32: Mani Dasari
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
        'd570145e-9e41-4b5c-b498-d2fbc0a19a46',
        NULL,
        'Mani Dasari',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Mani Dasari
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd570145e-9e41-4b5c-b498-d2fbc0a19a46',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Left Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Mani Dasari
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd570145e-9e41-4b5c-b498-d2fbc0a19a46',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Fast'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Mani Dasari (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'd570145e-9e41-4b5c-b498-d2fbc0a19a46',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Mani Dasari
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd570145e-9e41-4b5c-b498-d2fbc0a19a46',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Mani Dasari (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'd570145e-9e41-4b5c-b498-d2fbc0a19a46',
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
        value_array = EXCLUDED.value_array;
    -- Player 33: Gopal
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
        '8d1ecf00-7eed-4912-9ace-a6991d8aa461',
        NULL,
        'Gopal',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Gopal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8d1ecf00-7eed-4912-9ace-a6991d8aa461',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Gopal (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8d1ecf00-7eed-4912-9ace-a6991d8aa461',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Gopal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8d1ecf00-7eed-4912-9ace-a6991d8aa461',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '40'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Gopal (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8d1ecf00-7eed-4912-9ace-a6991d8aa461',
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
        value_array = EXCLUDED.value_array;
    -- Player 34: Praveen Hedge
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
        'fbec8585-b65f-4a02-a3b0-b14d63c2da50',
        NULL,
        'Praveen Hedge',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Praveen Hedge
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'fbec8585-b65f-4a02-a3b0-b14d63c2da50',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Praveen Hedge
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'fbec8585-b65f-4a02-a3b0-b14d63c2da50',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Praveen Hedge (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'fbec8585-b65f-4a02-a3b0-b14d63c2da50',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Praveen Hedge
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'fbec8585-b65f-4a02-a3b0-b14d63c2da50',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Praveen Hedge (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'fbec8585-b65f-4a02-a3b0-b14d63c2da50',
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
        value_array = EXCLUDED.value_array;
    -- Player 35: Pravin Agarwal
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
        '16d13c0b-9644-4941-8a74-e4d7bbbaf538',
        NULL,
        'Pravin Agarwal',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Pravin Agarwal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '16d13c0b-9644-4941-8a74-e4d7bbbaf538',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Pravin Agarwal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '16d13c0b-9644-4941-8a74-e4d7bbbaf538',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Pravin Agarwal (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '16d13c0b-9644-4941-8a74-e4d7bbbaf538',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Pravin Agarwal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '16d13c0b-9644-4941-8a74-e4d7bbbaf538',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Pravin Agarwal (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '16d13c0b-9644-4941-8a74-e4d7bbbaf538',
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
        value_array = EXCLUDED.value_array;
    -- Player 36: Rohit Saxena
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
        '08cf410a-c931-49f7-9e91-a1a84f09885b',
        NULL,
        'Rohit Saxena',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Rohit Saxena
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '08cf410a-c931-49f7-9e91-a1a84f09885b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Rohit Saxena
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '08cf410a-c931-49f7-9e91-a1a84f09885b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Rohit Saxena (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '08cf410a-c931-49f7-9e91-a1a84f09885b',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Rohit Saxena
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '08cf410a-c931-49f7-9e91-a1a84f09885b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Rohit Saxena (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '08cf410a-c931-49f7-9e91-a1a84f09885b',
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
        value_array = EXCLUDED.value_array;
    -- Player 37: Ashu
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
        'b041dc3c-2b3f-4d90-a1fc-484c490bf3d5',
        NULL,
        'Ashu',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ashu
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b041dc3c-2b3f-4d90-a1fc-484c490bf3d5',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ashu (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b041dc3c-2b3f-4d90-a1fc-484c490bf3d5',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ashu
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b041dc3c-2b3f-4d90-a1fc-484c490bf3d5',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ashu (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b041dc3c-2b3f-4d90-a1fc-484c490bf3d5',
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
        value_array = EXCLUDED.value_array;
    -- Player 38: Mohit Kumar
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
        '76ba20d1-c9b5-4641-aafe-2b1add22ec78',
        NULL,
        'Mohit Kumar',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Mohit Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '76ba20d1-c9b5-4641-aafe-2b1add22ec78',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Mohit Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '76ba20d1-c9b5-4641-aafe-2b1add22ec78',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Mohit Kumar (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '76ba20d1-c9b5-4641-aafe-2b1add22ec78',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Mohit Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '76ba20d1-c9b5-4641-aafe-2b1add22ec78',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Mohit Kumar (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '76ba20d1-c9b5-4641-aafe-2b1add22ec78',
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
        value_array = EXCLUDED.value_array;
    -- Player 39: Mehul
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
        '946b8d18-6a19-4edc-b6ce-043f7cdd5308',
        NULL,
        'Mehul',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Mehul
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '946b8d18-6a19-4edc-b6ce-043f7cdd5308',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Mehul
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '946b8d18-6a19-4edc-b6ce-043f7cdd5308',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Mehul (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '946b8d18-6a19-4edc-b6ce-043f7cdd5308',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Mehul
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '946b8d18-6a19-4edc-b6ce-043f7cdd5308',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Mehul (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '946b8d18-6a19-4edc-b6ce-043f7cdd5308',
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
        value_array = EXCLUDED.value_array;
    -- Player 40: Bikash Dutta
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
        'c13859db-b546-4440-9c4a-145f5d320785',
        NULL,
        'Bikash Dutta',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Bikash Dutta
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c13859db-b546-4440-9c4a-145f5d320785',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Bikash Dutta
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c13859db-b546-4440-9c4a-145f5d320785',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Bikash Dutta (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c13859db-b546-4440-9c4a-145f5d320785',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Bikash Dutta
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c13859db-b546-4440-9c4a-145f5d320785',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Bikash Dutta (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c13859db-b546-4440-9c4a-145f5d320785',
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
        value_array = EXCLUDED.value_array;
    -- Player 41: Ambarish Karan
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
        '7df09fb1-4517-4cb5-83fa-8fe4f194e184',
        NULL,
        'Ambarish Karan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ambarish Karan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7df09fb1-4517-4cb5-83fa-8fe4f194e184',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Ambarish Karan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7df09fb1-4517-4cb5-83fa-8fe4f194e184',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ambarish Karan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '7df09fb1-4517-4cb5-83fa-8fe4f194e184',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ambarish Karan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7df09fb1-4517-4cb5-83fa-8fe4f194e184',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '40'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ambarish Karan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '7df09fb1-4517-4cb5-83fa-8fe4f194e184',
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
        value_array = EXCLUDED.value_array;
    -- Player 42: Bharath Bhushan
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
        'fac7d1ac-3002-4682-beb8-2d698c40468a',
        NULL,
        'Bharath Bhushan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Bharath Bhushan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'fac7d1ac-3002-4682-beb8-2d698c40468a',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Bharath Bhushan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'fac7d1ac-3002-4682-beb8-2d698c40468a',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Bharath Bhushan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'fac7d1ac-3002-4682-beb8-2d698c40468a',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Bharath Bhushan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'fac7d1ac-3002-4682-beb8-2d698c40468a',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Bharath Bhushan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'fac7d1ac-3002-4682-beb8-2d698c40468a',
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
        value_array = EXCLUDED.value_array;
    -- Player 43: Archit Raj
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
        'bd22094c-2dc3-446c-8359-4589164525fd',
        NULL,
        'Archit Raj',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Archit Raj
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'bd22094c-2dc3-446c-8359-4589164525fd',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Archit Raj
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'bd22094c-2dc3-446c-8359-4589164525fd',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Archit Raj (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'bd22094c-2dc3-446c-8359-4589164525fd',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Archit Raj
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'bd22094c-2dc3-446c-8359-4589164525fd',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '40'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Archit Raj (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'bd22094c-2dc3-446c-8359-4589164525fd',
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
        value_array = EXCLUDED.value_array;
    -- Player 44: Babu
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
        'cf554395-182b-45a8-9673-d14cb1f70ecf',
        NULL,
        'Babu',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Babu
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cf554395-182b-45a8-9673-d14cb1f70ecf',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Babu
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cf554395-182b-45a8-9673-d14cb1f70ecf',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Babu (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'cf554395-182b-45a8-9673-d14cb1f70ecf',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Babu
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cf554395-182b-45a8-9673-d14cb1f70ecf',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Babu (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'cf554395-182b-45a8-9673-d14cb1f70ecf',
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
        value_array = EXCLUDED.value_array;
    -- Player 45: Rohit Sharma
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
        '47928aed-7d12-407b-9a64-fadec15e6633',
        NULL,
        'Rohit Sharma',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Rohit Sharma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '47928aed-7d12-407b-9a64-fadec15e6633',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Rohit Sharma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '47928aed-7d12-407b-9a64-fadec15e6633',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Rohit Sharma (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '47928aed-7d12-407b-9a64-fadec15e6633',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Rohit Sharma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '47928aed-7d12-407b-9a64-fadec15e6633',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Rohit Sharma (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '47928aed-7d12-407b-9a64-fadec15e6633',
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
        value_array = EXCLUDED.value_array;
    -- Player 46: Sanyam
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
        '8037724e-4572-432c-8bbd-672d0354ab8d',
        NULL,
        'Sanyam',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sanyam
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8037724e-4572-432c-8bbd-672d0354ab8d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sanyam
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8037724e-4572-432c-8bbd-672d0354ab8d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sanyam (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8037724e-4572-432c-8bbd-672d0354ab8d',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sanyam
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8037724e-4572-432c-8bbd-672d0354ab8d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sanyam (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8037724e-4572-432c-8bbd-672d0354ab8d',
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
        value_array = EXCLUDED.value_array;
    -- Player 47: Bhupati
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
        '77bc91dc-053d-438e-844f-a31199f9863a',
        NULL,
        'Bhupati',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Bhupati
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '77bc91dc-053d-438e-844f-a31199f9863a',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Bhupati
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '77bc91dc-053d-438e-844f-a31199f9863a',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Bhupati (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '77bc91dc-053d-438e-844f-a31199f9863a',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Bhupati
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '77bc91dc-053d-438e-844f-a31199f9863a',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Bhupati (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '77bc91dc-053d-438e-844f-a31199f9863a',
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
        value_array = EXCLUDED.value_array;
    -- Player 48: Yash Vardhan
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
        '8f8449e1-8fa9-4390-a41a-d04f2231433d',
        NULL,
        'Yash Vardhan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Yash Vardhan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8f8449e1-8fa9-4390-a41a-d04f2231433d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Yash Vardhan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8f8449e1-8fa9-4390-a41a-d04f2231433d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Yash Vardhan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8f8449e1-8fa9-4390-a41a-d04f2231433d',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Yash Vardhan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8f8449e1-8fa9-4390-a41a-d04f2231433d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Yash Vardhan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8f8449e1-8fa9-4390-a41a-d04f2231433d',
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
        value_array = EXCLUDED.value_array;
    -- Player 49: Aditya Gupta
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
        'c43e98e8-cdf5-4fc1-9001-2d40beccbe88',
        NULL,
        'Aditya Gupta',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Aditya Gupta
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c43e98e8-cdf5-4fc1-9001-2d40beccbe88',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Aditya Gupta
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c43e98e8-cdf5-4fc1-9001-2d40beccbe88',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Aditya Gupta (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c43e98e8-cdf5-4fc1-9001-2d40beccbe88',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Aditya Gupta
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c43e98e8-cdf5-4fc1-9001-2d40beccbe88',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Aditya Gupta (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c43e98e8-cdf5-4fc1-9001-2d40beccbe88',
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
        value_array = EXCLUDED.value_array;
    -- Player 50: Abhishek Kannan
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
        '5aa27e50-921f-497c-9a0f-97144b909065',
        NULL,
        'Abhishek Kannan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Abhishek Kannan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '5aa27e50-921f-497c-9a0f-97144b909065',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Abhishek Kannan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '5aa27e50-921f-497c-9a0f-97144b909065',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Spin'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Abhishek Kannan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '5aa27e50-921f-497c-9a0f-97144b909065',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Abhishek Kannan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '5aa27e50-921f-497c-9a0f-97144b909065',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Abhishek Kannan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '5aa27e50-921f-497c-9a0f-97144b909065',
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
        value_array = EXCLUDED.value_array;
    -- Player 51: Niranjan
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
        '258f4375-2619-46ba-85b0-948a6cf61e77',
        NULL,
        'Niranjan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Niranjan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '258f4375-2619-46ba-85b0-948a6cf61e77',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Niranjan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '258f4375-2619-46ba-85b0-948a6cf61e77',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Niranjan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '258f4375-2619-46ba-85b0-948a6cf61e77',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Niranjan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '258f4375-2619-46ba-85b0-948a6cf61e77',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Niranjan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '258f4375-2619-46ba-85b0-948a6cf61e77',
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
        value_array = EXCLUDED.value_array;
    -- Player 52: Kartikey Bhatia
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
        '9046d1de-0f9e-41ce-907b-81c4e58d1424',
        NULL,
        'Kartikey Bhatia',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Kartikey Bhatia
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9046d1de-0f9e-41ce-907b-81c4e58d1424',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Kartikey Bhatia
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9046d1de-0f9e-41ce-907b-81c4e58d1424',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Kartikey Bhatia (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9046d1de-0f9e-41ce-907b-81c4e58d1424',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Kartikey Bhatia
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9046d1de-0f9e-41ce-907b-81c4e58d1424',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Kartikey Bhatia (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9046d1de-0f9e-41ce-907b-81c4e58d1424',
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
        value_array = EXCLUDED.value_array;
    -- Player 53: Arun Balaji
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
        'f5903e1a-85ff-4c81-9c97-57395dd28930',
        NULL,
        'Arun Balaji',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Arun Balaji
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'f5903e1a-85ff-4c81-9c97-57395dd28930',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Arun Balaji
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'f5903e1a-85ff-4c81-9c97-57395dd28930',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Arun Balaji (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'f5903e1a-85ff-4c81-9c97-57395dd28930',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Arun Balaji
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'f5903e1a-85ff-4c81-9c97-57395dd28930',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Arun Balaji (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'f5903e1a-85ff-4c81-9c97-57395dd28930',
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
        value_array = EXCLUDED.value_array;
    -- Player 54: Rahul Dabetta
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
        'aab4f035-3380-46ec-a2a6-3e051d7ee155',
        NULL,
        'Rahul Dabetta',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Rahul Dabetta
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'aab4f035-3380-46ec-a2a6-3e051d7ee155',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Rahul Dabetta
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'aab4f035-3380-46ec-a2a6-3e051d7ee155',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Rahul Dabetta (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'aab4f035-3380-46ec-a2a6-3e051d7ee155',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Rahul Dabetta
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'aab4f035-3380-46ec-a2a6-3e051d7ee155',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Rahul Dabetta (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'aab4f035-3380-46ec-a2a6-3e051d7ee155',
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
        value_array = EXCLUDED.value_array;
    -- Player 55: Arul
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
        'd3f0f819-499d-4bb8-bf36-948ba99a9c61',
        NULL,
        'Arul',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Arul
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd3f0f819-499d-4bb8-bf36-948ba99a9c61',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Arul
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd3f0f819-499d-4bb8-bf36-948ba99a9c61',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Spin'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Arul (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'd3f0f819-499d-4bb8-bf36-948ba99a9c61',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Arul
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd3f0f819-499d-4bb8-bf36-948ba99a9c61',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Arul (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'd3f0f819-499d-4bb8-bf36-948ba99a9c61',
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
        value_array = EXCLUDED.value_array;
    -- Player 56: Gagan
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
        '4d6e32e5-748c-4133-ba44-cf1ca812f082',
        NULL,
        'Gagan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Gagan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '4d6e32e5-748c-4133-ba44-cf1ca812f082',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Gagan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '4d6e32e5-748c-4133-ba44-cf1ca812f082',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Gagan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '4d6e32e5-748c-4133-ba44-cf1ca812f082',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Gagan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '4d6e32e5-748c-4133-ba44-cf1ca812f082',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Gagan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '4d6e32e5-748c-4133-ba44-cf1ca812f082',
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
        value_array = EXCLUDED.value_array;
    -- Player 57: Utkarsh
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
        '2f6b1103-c2ea-425e-a251-d4f71d0d4dd8',
        NULL,
        'Utkarsh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Utkarsh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2f6b1103-c2ea-425e-a251-d4f71d0d4dd8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Utkarsh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2f6b1103-c2ea-425e-a251-d4f71d0d4dd8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Utkarsh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '2f6b1103-c2ea-425e-a251-d4f71d0d4dd8',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Utkarsh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2f6b1103-c2ea-425e-a251-d4f71d0d4dd8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Utkarsh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '2f6b1103-c2ea-425e-a251-d4f71d0d4dd8',
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
        value_array = EXCLUDED.value_array;
    -- Player 58: Prakhar
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
        '8d4c85ef-98be-4587-b598-fa9118125f7b',
        NULL,
        'Prakhar',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Prakhar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8d4c85ef-98be-4587-b598-fa9118125f7b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Prakhar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8d4c85ef-98be-4587-b598-fa9118125f7b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Prakhar (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8d4c85ef-98be-4587-b598-fa9118125f7b',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Prakhar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8d4c85ef-98be-4587-b598-fa9118125f7b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Prakhar (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8d4c85ef-98be-4587-b598-fa9118125f7b',
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
        value_array = EXCLUDED.value_array;
    -- Player 59: Vicky
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
        '2e49f993-b06d-44c6-add4-d66797b404a5',
        NULL,
        'Vicky',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Vicky
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2e49f993-b06d-44c6-add4-d66797b404a5',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Vicky (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '2e49f993-b06d-44c6-add4-d66797b404a5',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Vicky
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2e49f993-b06d-44c6-add4-d66797b404a5',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Vicky (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '2e49f993-b06d-44c6-add4-d66797b404a5',
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
        value_array = EXCLUDED.value_array;
    -- Player 60: Mayank
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
        '57cb3b51-9880-4130-88ef-f2eb296e8c8c',
        NULL,
        'Mayank',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Mayank
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '57cb3b51-9880-4130-88ef-f2eb296e8c8c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Mayank
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '57cb3b51-9880-4130-88ef-f2eb296e8c8c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Mayank (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '57cb3b51-9880-4130-88ef-f2eb296e8c8c',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Mayank
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '57cb3b51-9880-4130-88ef-f2eb296e8c8c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Mayank (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '57cb3b51-9880-4130-88ef-f2eb296e8c8c',
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
        value_array = EXCLUDED.value_array;
    -- Player 61: Ambadi
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
        '58457f43-74ad-4b69-8edf-6d9f80080153',
        NULL,
        'Ambadi',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ambadi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '58457f43-74ad-4b69-8edf-6d9f80080153',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Ambadi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '58457f43-74ad-4b69-8edf-6d9f80080153',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ambadi (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '58457f43-74ad-4b69-8edf-6d9f80080153',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ambadi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '58457f43-74ad-4b69-8edf-6d9f80080153',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ambadi (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '58457f43-74ad-4b69-8edf-6d9f80080153',
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
        value_array = EXCLUDED.value_array;
    -- Player 62: Durai Raj
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
        '3903f8dd-d7db-416c-9a0a-8bdf0bc3af22',
        NULL,
        'Durai Raj',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Durai Raj
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3903f8dd-d7db-416c-9a0a-8bdf0bc3af22',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Durai Raj
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3903f8dd-d7db-416c-9a0a-8bdf0bc3af22',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Durai Raj (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3903f8dd-d7db-416c-9a0a-8bdf0bc3af22',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Durai Raj
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3903f8dd-d7db-416c-9a0a-8bdf0bc3af22',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Durai Raj (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3903f8dd-d7db-416c-9a0a-8bdf0bc3af22',
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
        value_array = EXCLUDED.value_array;
    -- Player 63: Subham
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
        '790c0d81-b345-4ca2-a73a-1fe4f735acc4',
        NULL,
        'Subham',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Subham
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '790c0d81-b345-4ca2-a73a-1fe4f735acc4',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Subham
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '790c0d81-b345-4ca2-a73a-1fe4f735acc4',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Subham (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '790c0d81-b345-4ca2-a73a-1fe4f735acc4',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Subham
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '790c0d81-b345-4ca2-a73a-1fe4f735acc4',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Subham (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '790c0d81-b345-4ca2-a73a-1fe4f735acc4',
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
        value_array = EXCLUDED.value_array;
    -- Player 64: Praveen D
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
        '0b91ad10-4b03-417b-9369-8076c2657c8c',
        NULL,
        'Praveen D',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Praveen D
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0b91ad10-4b03-417b-9369-8076c2657c8c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Left Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Praveen D
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0b91ad10-4b03-417b-9369-8076c2657c8c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Praveen D (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0b91ad10-4b03-417b-9369-8076c2657c8c',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Praveen D
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0b91ad10-4b03-417b-9369-8076c2657c8c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Praveen D (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0b91ad10-4b03-417b-9369-8076c2657c8c',
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
        value_array = EXCLUDED.value_array;
    -- Player 65: Aryan
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
        '7c564bbb-a8cd-4d31-ad48-21b4f5900751',
        NULL,
        'Aryan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Aryan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7c564bbb-a8cd-4d31-ad48-21b4f5900751',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Aryan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7c564bbb-a8cd-4d31-ad48-21b4f5900751',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Aryan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '7c564bbb-a8cd-4d31-ad48-21b4f5900751',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Aryan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7c564bbb-a8cd-4d31-ad48-21b4f5900751',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '40'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Aryan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '7c564bbb-a8cd-4d31-ad48-21b4f5900751',
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
        value_array = EXCLUDED.value_array;
    -- Player 66: Koushik
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
        'cf9c93f6-8db5-4450-8a4d-c33d7062ba3b',
        NULL,
        'Koushik',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Koushik
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cf9c93f6-8db5-4450-8a4d-c33d7062ba3b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Koushik
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cf9c93f6-8db5-4450-8a4d-c33d7062ba3b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Koushik (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'cf9c93f6-8db5-4450-8a4d-c33d7062ba3b',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Koushik
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cf9c93f6-8db5-4450-8a4d-c33d7062ba3b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '40'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Koushik (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'cf9c93f6-8db5-4450-8a4d-c33d7062ba3b',
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
        value_array = EXCLUDED.value_array;
    -- Player 67: Yashwanth Pathi
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
        '3e39fb4b-b383-46ab-98e3-216e5c405199',
        NULL,
        'Yashwanth Pathi',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Yashwanth Pathi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3e39fb4b-b383-46ab-98e3-216e5c405199',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Yashwanth Pathi (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3e39fb4b-b383-46ab-98e3-216e5c405199',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Yashwanth Pathi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3e39fb4b-b383-46ab-98e3-216e5c405199',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Yashwanth Pathi (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3e39fb4b-b383-46ab-98e3-216e5c405199',
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
        value_array = EXCLUDED.value_array;
    -- Player 68: Ajith
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
        '0c02b87b-6bd7-4db5-9ee2-040a1e14dcd0',
        NULL,
        'Ajith',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ajith
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0c02b87b-6bd7-4db5-9ee2-040a1e14dcd0',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Ajith
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0c02b87b-6bd7-4db5-9ee2-040a1e14dcd0',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ajith (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0c02b87b-6bd7-4db5-9ee2-040a1e14dcd0',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ajith
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0c02b87b-6bd7-4db5-9ee2-040a1e14dcd0',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ajith (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0c02b87b-6bd7-4db5-9ee2-040a1e14dcd0',
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
        value_array = EXCLUDED.value_array;
    -- Player 69: Deepak
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
        '8741944d-0f78-4670-a408-4cbbc2da4c18',
        NULL,
        'Deepak',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Deepak
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8741944d-0f78-4670-a408-4cbbc2da4c18',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Deepak
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8741944d-0f78-4670-a408-4cbbc2da4c18',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Deepak (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8741944d-0f78-4670-a408-4cbbc2da4c18',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Deepak
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8741944d-0f78-4670-a408-4cbbc2da4c18',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Deepak (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8741944d-0f78-4670-a408-4cbbc2da4c18',
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
        value_array = EXCLUDED.value_array;
    -- Player 70: Sravan
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
        '014dce93-de5f-46eb-b08c-3705f978fb3e',
        NULL,
        'Sravan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sravan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '014dce93-de5f-46eb-b08c-3705f978fb3e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sravan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '014dce93-de5f-46eb-b08c-3705f978fb3e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sravan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '014dce93-de5f-46eb-b08c-3705f978fb3e',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sravan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '014dce93-de5f-46eb-b08c-3705f978fb3e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sravan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '014dce93-de5f-46eb-b08c-3705f978fb3e',
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
        value_array = EXCLUDED.value_array;
    -- Player 71: Sashi
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
        '2a1e939f-422c-4059-8051-90daaf5f67e6',
        NULL,
        'Sashi',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sashi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2a1e939f-422c-4059-8051-90daaf5f67e6',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sashi (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '2a1e939f-422c-4059-8051-90daaf5f67e6',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sashi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2a1e939f-422c-4059-8051-90daaf5f67e6',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sashi (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '2a1e939f-422c-4059-8051-90daaf5f67e6',
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
        value_array = EXCLUDED.value_array;
    -- Player 72: Mahesh
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
        '52c2bf58-580d-40f5-bcb6-245a9f6793b7',
        NULL,
        'Mahesh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Mahesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '52c2bf58-580d-40f5-bcb6-245a9f6793b7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Mahesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '52c2bf58-580d-40f5-bcb6-245a9f6793b7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Mahesh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '52c2bf58-580d-40f5-bcb6-245a9f6793b7',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Mahesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '52c2bf58-580d-40f5-bcb6-245a9f6793b7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Mahesh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '52c2bf58-580d-40f5-bcb6-245a9f6793b7',
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
        value_array = EXCLUDED.value_array;
    -- Player 73: Sairamaraju
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
        'a9555136-569e-493e-90a7-f6c8881acedc',
        NULL,
        'Sairamaraju',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sairamaraju
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'a9555136-569e-493e-90a7-f6c8881acedc',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sairamaraju
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'a9555136-569e-493e-90a7-f6c8881acedc',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sairamaraju (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'a9555136-569e-493e-90a7-f6c8881acedc',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sairamaraju
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'a9555136-569e-493e-90a7-f6c8881acedc',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sairamaraju (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'a9555136-569e-493e-90a7-f6c8881acedc',
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
        value_array = EXCLUDED.value_array;
    -- Player 74: Prashanth Reddy
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
        '8ea2ddac-c2af-4d52-a97d-fb908b4d7c12',
        NULL,
        'Prashanth Reddy',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Prashanth Reddy
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8ea2ddac-c2af-4d52-a97d-fb908b4d7c12',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Prashanth Reddy
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8ea2ddac-c2af-4d52-a97d-fb908b4d7c12',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Prashanth Reddy (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8ea2ddac-c2af-4d52-a97d-fb908b4d7c12',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Prashanth Reddy
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8ea2ddac-c2af-4d52-a97d-fb908b4d7c12',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Prashanth Reddy (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8ea2ddac-c2af-4d52-a97d-fb908b4d7c12',
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
        value_array = EXCLUDED.value_array;
    -- Player 75: Azhar
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
        'b01571c1-c5c5-44b3-b8aa-121eec50be1e',
        NULL,
        'Azhar',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Azhar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b01571c1-c5c5-44b3-b8aa-121eec50be1e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Azhar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b01571c1-c5c5-44b3-b8aa-121eec50be1e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Azhar (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b01571c1-c5c5-44b3-b8aa-121eec50be1e',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Azhar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b01571c1-c5c5-44b3-b8aa-121eec50be1e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Azhar (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b01571c1-c5c5-44b3-b8aa-121eec50be1e',
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
        value_array = EXCLUDED.value_array;
    -- Player 76: Vipul
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
        '22f38242-4cc6-4374-8706-0633b39e2051',
        NULL,
        'Vipul',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Vipul
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '22f38242-4cc6-4374-8706-0633b39e2051',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Vipul
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '22f38242-4cc6-4374-8706-0633b39e2051',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Vipul (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '22f38242-4cc6-4374-8706-0633b39e2051',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Vipul
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '22f38242-4cc6-4374-8706-0633b39e2051',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Vipul (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '22f38242-4cc6-4374-8706-0633b39e2051',
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
        value_array = EXCLUDED.value_array;
    -- Player 77: Dadapeer
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
        '56cdc8f3-9994-43ce-96a1-0c7e2dfa822b',
        NULL,
        'Dadapeer',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Dadapeer
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '56cdc8f3-9994-43ce-96a1-0c7e2dfa822b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Dadapeer
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '56cdc8f3-9994-43ce-96a1-0c7e2dfa822b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Dadapeer (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '56cdc8f3-9994-43ce-96a1-0c7e2dfa822b',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Dadapeer
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '56cdc8f3-9994-43ce-96a1-0c7e2dfa822b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Dadapeer (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '56cdc8f3-9994-43ce-96a1-0c7e2dfa822b',
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
        value_array = EXCLUDED.value_array;
    -- Player 78: Pranav Pillai
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
        'c9f10223-dfa3-4dcc-86f3-26a5518170b4',
        NULL,
        'Pranav Pillai',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Pranav Pillai
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c9f10223-dfa3-4dcc-86f3-26a5518170b4',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Left Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Pranav Pillai
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c9f10223-dfa3-4dcc-86f3-26a5518170b4',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Pranav Pillai (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c9f10223-dfa3-4dcc-86f3-26a5518170b4',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Pranav Pillai
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c9f10223-dfa3-4dcc-86f3-26a5518170b4',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Pranav Pillai (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c9f10223-dfa3-4dcc-86f3-26a5518170b4',
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
        value_array = EXCLUDED.value_array;
    -- Player 79: Dhruv Khurana
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
        '58ded9e0-bd97-45f8-8ca8-9e69b4f9b435',
        NULL,
        'Dhruv Khurana',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Dhruv Khurana
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '58ded9e0-bd97-45f8-8ca8-9e69b4f9b435',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Dhruv Khurana
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '58ded9e0-bd97-45f8-8ca8-9e69b4f9b435',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Dhruv Khurana (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '58ded9e0-bd97-45f8-8ca8-9e69b4f9b435',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Dhruv Khurana
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '58ded9e0-bd97-45f8-8ca8-9e69b4f9b435',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Dhruv Khurana (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '58ded9e0-bd97-45f8-8ca8-9e69b4f9b435',
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
        value_array = EXCLUDED.value_array;
    -- Player 80: Sathish Kumar
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
        '4c5c7f76-297b-4bd9-a3a8-31a612830591',
        NULL,
        'Sathish Kumar',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sathish Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '4c5c7f76-297b-4bd9-a3a8-31a612830591',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sathish Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '4c5c7f76-297b-4bd9-a3a8-31a612830591',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sathish Kumar (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '4c5c7f76-297b-4bd9-a3a8-31a612830591',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sathish Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '4c5c7f76-297b-4bd9-a3a8-31a612830591',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sathish Kumar (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '4c5c7f76-297b-4bd9-a3a8-31a612830591',
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
        value_array = EXCLUDED.value_array;
    -- Player 81: Ajay Raj
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
        'ca68623e-90fe-4b2d-86ea-72081c05d0b8',
        NULL,
        'Ajay Raj',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ajay Raj
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ca68623e-90fe-4b2d-86ea-72081c05d0b8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Ajay Raj
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ca68623e-90fe-4b2d-86ea-72081c05d0b8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Spin'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ajay Raj (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ca68623e-90fe-4b2d-86ea-72081c05d0b8',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ajay Raj
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ca68623e-90fe-4b2d-86ea-72081c05d0b8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ajay Raj (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ca68623e-90fe-4b2d-86ea-72081c05d0b8',
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
        value_array = EXCLUDED.value_array;
    -- Player 82: Nirmal Unnikrishna
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
        '3ba60946-4d74-494b-acdd-2da041f5e477',
        NULL,
        'Nirmal Unnikrishna',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Nirmal Unnikrishna
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3ba60946-4d74-494b-acdd-2da041f5e477',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Nirmal Unnikrishna
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3ba60946-4d74-494b-acdd-2da041f5e477',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Nirmal Unnikrishna (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3ba60946-4d74-494b-acdd-2da041f5e477',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Nirmal Unnikrishna
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3ba60946-4d74-494b-acdd-2da041f5e477',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Nirmal Unnikrishna (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3ba60946-4d74-494b-acdd-2da041f5e477',
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
        value_array = EXCLUDED.value_array;
    -- Player 83: Bishal
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
        'e34c6ac3-9cbd-4b9d-b933-1d7c1005bf54',
        NULL,
        'Bishal',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Bishal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e34c6ac3-9cbd-4b9d-b933-1d7c1005bf54',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Bishal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e34c6ac3-9cbd-4b9d-b933-1d7c1005bf54',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Bishal (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'e34c6ac3-9cbd-4b9d-b933-1d7c1005bf54',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Bishal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e34c6ac3-9cbd-4b9d-b933-1d7c1005bf54',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Bishal (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'e34c6ac3-9cbd-4b9d-b933-1d7c1005bf54',
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
        value_array = EXCLUDED.value_array;
    -- Player 84: Shashank
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
        '139daae9-10bc-42a5-959b-98253f92150e',
        NULL,
        'Shashank',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Shashank
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '139daae9-10bc-42a5-959b-98253f92150e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Shashank (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '139daae9-10bc-42a5-959b-98253f92150e',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Shashank
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '139daae9-10bc-42a5-959b-98253f92150e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Shashank (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '139daae9-10bc-42a5-959b-98253f92150e',
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
        value_array = EXCLUDED.value_array;
    -- Player 85: Shreyas
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
        'b1692e11-9aa7-45b2-bf46-616bca5bee9f',
        NULL,
        'Shreyas',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Shreyas
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b1692e11-9aa7-45b2-bf46-616bca5bee9f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Shreyas
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b1692e11-9aa7-45b2-bf46-616bca5bee9f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Shreyas (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b1692e11-9aa7-45b2-bf46-616bca5bee9f',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Shreyas
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b1692e11-9aa7-45b2-bf46-616bca5bee9f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Shreyas (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b1692e11-9aa7-45b2-bf46-616bca5bee9f',
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
        value_array = EXCLUDED.value_array;
    -- Player 86: Vipul Raj
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
        '9f3904b1-add8-4183-bcb2-8644e23771fa',
        NULL,
        'Vipul Raj',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Vipul Raj
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9f3904b1-add8-4183-bcb2-8644e23771fa',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Vipul Raj
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9f3904b1-add8-4183-bcb2-8644e23771fa',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Vipul Raj (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9f3904b1-add8-4183-bcb2-8644e23771fa',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Vipul Raj
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9f3904b1-add8-4183-bcb2-8644e23771fa',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Vipul Raj (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9f3904b1-add8-4183-bcb2-8644e23771fa',
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
        value_array = EXCLUDED.value_array;
    -- Player 87: Kushal
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
        '0cf4d672-ece3-4cff-8e30-ecbcbbee048f',
        NULL,
        'Kushal',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Kushal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0cf4d672-ece3-4cff-8e30-ecbcbbee048f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Kushal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0cf4d672-ece3-4cff-8e30-ecbcbbee048f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Kushal (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0cf4d672-ece3-4cff-8e30-ecbcbbee048f',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Kushal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0cf4d672-ece3-4cff-8e30-ecbcbbee048f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Kushal (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0cf4d672-ece3-4cff-8e30-ecbcbbee048f',
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
        value_array = EXCLUDED.value_array;
    -- Player 88: Praveen M
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
        '36820d16-3af3-4752-9535-2df2818a87f6',
        NULL,
        'Praveen M',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Praveen M
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '36820d16-3af3-4752-9535-2df2818a87f6',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Praveen M
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '36820d16-3af3-4752-9535-2df2818a87f6',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Praveen M (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '36820d16-3af3-4752-9535-2df2818a87f6',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Praveen M
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '36820d16-3af3-4752-9535-2df2818a87f6',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Praveen M (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '36820d16-3af3-4752-9535-2df2818a87f6',
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
        value_array = EXCLUDED.value_array;
    -- Player 89: Ashutosh
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
        '7b3393d0-4200-48c0-8a7b-f054756f60e5',
        NULL,
        'Ashutosh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ashutosh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7b3393d0-4200-48c0-8a7b-f054756f60e5',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Ashutosh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7b3393d0-4200-48c0-8a7b-f054756f60e5',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Spin'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ashutosh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '7b3393d0-4200-48c0-8a7b-f054756f60e5',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ashutosh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7b3393d0-4200-48c0-8a7b-f054756f60e5',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ashutosh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '7b3393d0-4200-48c0-8a7b-f054756f60e5',
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
        value_array = EXCLUDED.value_array;
    -- Player 90: Amit
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
        'ba46304f-2048-4c1d-a046-652ae67d51d7',
        NULL,
        'Amit',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Amit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ba46304f-2048-4c1d-a046-652ae67d51d7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Amit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ba46304f-2048-4c1d-a046-652ae67d51d7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Amit (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ba46304f-2048-4c1d-a046-652ae67d51d7',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Amit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ba46304f-2048-4c1d-a046-652ae67d51d7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Amit (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ba46304f-2048-4c1d-a046-652ae67d51d7',
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
        value_array = EXCLUDED.value_array;
    -- Player 91: Sreenu
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
        '4356b3d9-a526-430f-a61e-c1c2afcbfb6f',
        NULL,
        'Sreenu',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sreenu
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '4356b3d9-a526-430f-a61e-c1c2afcbfb6f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sreenu
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '4356b3d9-a526-430f-a61e-c1c2afcbfb6f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sreenu (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '4356b3d9-a526-430f-a61e-c1c2afcbfb6f',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sreenu
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '4356b3d9-a526-430f-a61e-c1c2afcbfb6f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sreenu (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '4356b3d9-a526-430f-a61e-c1c2afcbfb6f',
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
        value_array = EXCLUDED.value_array;
    -- Player 92: Akshay KP
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
        '31061887-dc21-4ff5-9902-fa8089d60bb8',
        NULL,
        'Akshay KP',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Akshay KP
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '31061887-dc21-4ff5-9902-fa8089d60bb8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Akshay KP
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '31061887-dc21-4ff5-9902-fa8089d60bb8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Akshay KP (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '31061887-dc21-4ff5-9902-fa8089d60bb8',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Akshay KP
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '31061887-dc21-4ff5-9902-fa8089d60bb8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Akshay KP (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '31061887-dc21-4ff5-9902-fa8089d60bb8',
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
        value_array = EXCLUDED.value_array;
    -- Player 93: Santhosh
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
        '0aaf216d-1fdb-4f40-b88e-b552abaa9e19',
        NULL,
        'Santhosh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Santhosh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0aaf216d-1fdb-4f40-b88e-b552abaa9e19',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Santhosh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0aaf216d-1fdb-4f40-b88e-b552abaa9e19',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Santhosh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0aaf216d-1fdb-4f40-b88e-b552abaa9e19',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Santhosh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0aaf216d-1fdb-4f40-b88e-b552abaa9e19',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Santhosh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0aaf216d-1fdb-4f40-b88e-b552abaa9e19',
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
        value_array = EXCLUDED.value_array;
    -- Player 94: Suhail
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
        '8ded1fe5-f49d-484b-9fbf-a2c0687f36b3',
        NULL,
        'Suhail',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Suhail
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8ded1fe5-f49d-484b-9fbf-a2c0687f36b3',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Suhail
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8ded1fe5-f49d-484b-9fbf-a2c0687f36b3',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Suhail (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8ded1fe5-f49d-484b-9fbf-a2c0687f36b3',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Suhail
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8ded1fe5-f49d-484b-9fbf-a2c0687f36b3',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Suhail (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8ded1fe5-f49d-484b-9fbf-a2c0687f36b3',
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
        value_array = EXCLUDED.value_array;
    -- Player 95: Venu Gopal
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
        '43c13c27-167f-4c09-ae94-3c5cdb3ed700',
        NULL,
        'Venu Gopal',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Venu Gopal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '43c13c27-167f-4c09-ae94-3c5cdb3ed700',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Venu Gopal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '43c13c27-167f-4c09-ae94-3c5cdb3ed700',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Venu Gopal (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '43c13c27-167f-4c09-ae94-3c5cdb3ed700',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Venu Gopal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '43c13c27-167f-4c09-ae94-3c5cdb3ed700',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Venu Gopal (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '43c13c27-167f-4c09-ae94-3c5cdb3ed700',
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
        value_array = EXCLUDED.value_array;
    -- Player 96: Raunak
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
        '9e77dd63-372b-47a6-934d-a031a472cad8',
        NULL,
        'Raunak',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Raunak
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9e77dd63-372b-47a6-934d-a031a472cad8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Raunak
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9e77dd63-372b-47a6-934d-a031a472cad8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Raunak (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9e77dd63-372b-47a6-934d-a031a472cad8',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Raunak
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9e77dd63-372b-47a6-934d-a031a472cad8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Raunak (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9e77dd63-372b-47a6-934d-a031a472cad8',
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
        value_array = EXCLUDED.value_array;
    -- Player 97: Sarath
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
        '07cf7c8c-9054-4af6-9042-f7beac7d5e84',
        NULL,
        'Sarath',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sarath
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '07cf7c8c-9054-4af6-9042-f7beac7d5e84',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sarath
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '07cf7c8c-9054-4af6-9042-f7beac7d5e84',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sarath (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '07cf7c8c-9054-4af6-9042-f7beac7d5e84',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sarath
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '07cf7c8c-9054-4af6-9042-f7beac7d5e84',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sarath (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '07cf7c8c-9054-4af6-9042-f7beac7d5e84',
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
        value_array = EXCLUDED.value_array;
    -- Player 98: Silvister
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
        'ef5b3724-3f12-43c1-b82f-9b632655b510',
        NULL,
        'Silvister',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Silvister
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ef5b3724-3f12-43c1-b82f-9b632655b510',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Silvister
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ef5b3724-3f12-43c1-b82f-9b632655b510',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Silvister (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ef5b3724-3f12-43c1-b82f-9b632655b510',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Silvister
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ef5b3724-3f12-43c1-b82f-9b632655b510',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Silvister (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ef5b3724-3f12-43c1-b82f-9b632655b510',
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
        value_array = EXCLUDED.value_array;
    -- Player 99: Amit Aggarwal
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
        'b9024c72-a676-4f7c-9965-dc632d45bb66',
        NULL,
        'Amit Aggarwal',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Amit Aggarwal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b9024c72-a676-4f7c-9965-dc632d45bb66',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Amit Aggarwal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b9024c72-a676-4f7c-9965-dc632d45bb66',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Amit Aggarwal (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b9024c72-a676-4f7c-9965-dc632d45bb66',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Amit Aggarwal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b9024c72-a676-4f7c-9965-dc632d45bb66',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Amit Aggarwal (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b9024c72-a676-4f7c-9965-dc632d45bb66',
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
        value_array = EXCLUDED.value_array;
    -- Player 100: Chiranjiv
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
        '817c56fe-1d7a-4def-8269-829602d3063f',
        NULL,
        'Chiranjiv',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Chiranjiv
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '817c56fe-1d7a-4def-8269-829602d3063f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Chiranjiv
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '817c56fe-1d7a-4def-8269-829602d3063f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Chiranjiv (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '817c56fe-1d7a-4def-8269-829602d3063f',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Chiranjiv
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '817c56fe-1d7a-4def-8269-829602d3063f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Chiranjiv (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '817c56fe-1d7a-4def-8269-829602d3063f',
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
        value_array = EXCLUDED.value_array;
    -- Player 101: Gaja
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
        'f6282034-7613-43cb-9d86-9db7c4f6fa64',
        NULL,
        'Gaja',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Gaja
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'f6282034-7613-43cb-9d86-9db7c4f6fa64',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Gaja
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'f6282034-7613-43cb-9d86-9db7c4f6fa64',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Gaja (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'f6282034-7613-43cb-9d86-9db7c4f6fa64',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Gaja
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'f6282034-7613-43cb-9d86-9db7c4f6fa64',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Gaja (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'f6282034-7613-43cb-9d86-9db7c4f6fa64',
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
        value_array = EXCLUDED.value_array;
    -- Player 102: Nirmal Nithesh
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
        '0d823b2e-3cb5-45f1-b61f-c7affaae0b01',
        NULL,
        'Nirmal Nithesh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Nirmal Nithesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0d823b2e-3cb5-45f1-b61f-c7affaae0b01',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Nirmal Nithesh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0d823b2e-3cb5-45f1-b61f-c7affaae0b01',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Nirmal Nithesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0d823b2e-3cb5-45f1-b61f-c7affaae0b01',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Nirmal Nithesh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0d823b2e-3cb5-45f1-b61f-c7affaae0b01',
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
        value_array = EXCLUDED.value_array;
    -- Player 103: Sudharam
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
        'bf86cde5-262b-40ae-ad67-1b01e1476a06',
        NULL,
        'Sudharam',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sudharam
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'bf86cde5-262b-40ae-ad67-1b01e1476a06',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sudharam
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'bf86cde5-262b-40ae-ad67-1b01e1476a06',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sudharam (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'bf86cde5-262b-40ae-ad67-1b01e1476a06',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sudharam
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'bf86cde5-262b-40ae-ad67-1b01e1476a06',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sudharam (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'bf86cde5-262b-40ae-ad67-1b01e1476a06',
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
        value_array = EXCLUDED.value_array;
    -- Player 104: Hanumesh
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
        '54fc6fca-1b77-4146-a31e-fa6ef4b91526',
        NULL,
        'Hanumesh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Hanumesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '54fc6fca-1b77-4146-a31e-fa6ef4b91526',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Hanumesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '54fc6fca-1b77-4146-a31e-fa6ef4b91526',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Hanumesh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '54fc6fca-1b77-4146-a31e-fa6ef4b91526',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Hanumesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '54fc6fca-1b77-4146-a31e-fa6ef4b91526',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Hanumesh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '54fc6fca-1b77-4146-a31e-fa6ef4b91526',
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
        value_array = EXCLUDED.value_array;
    -- Player 105: Ritavash
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
        'ec13f736-0698-4ee3-8b03-7802d2c96048',
        NULL,
        'Ritavash',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ritavash
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ec13f736-0698-4ee3-8b03-7802d2c96048',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ritavash (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ec13f736-0698-4ee3-8b03-7802d2c96048',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ritavash
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ec13f736-0698-4ee3-8b03-7802d2c96048',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ritavash (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ec13f736-0698-4ee3-8b03-7802d2c96048',
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
        value_array = EXCLUDED.value_array;
    -- Player 106: Teja
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
        '5db03076-401c-43a8-a0e8-c14cf9a2408f',
        NULL,
        'Teja',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Teja
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '5db03076-401c-43a8-a0e8-c14cf9a2408f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Teja
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '5db03076-401c-43a8-a0e8-c14cf9a2408f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Teja (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '5db03076-401c-43a8-a0e8-c14cf9a2408f',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Teja
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '5db03076-401c-43a8-a0e8-c14cf9a2408f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Teja (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '5db03076-401c-43a8-a0e8-c14cf9a2408f',
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
        value_array = EXCLUDED.value_array;
    -- Player 107: Sravanth
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
        'eed56f3c-acb7-46f9-92ee-8f41bd59959f',
        NULL,
        'Sravanth',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sravanth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'eed56f3c-acb7-46f9-92ee-8f41bd59959f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sravanth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'eed56f3c-acb7-46f9-92ee-8f41bd59959f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Fast'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sravanth (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'eed56f3c-acb7-46f9-92ee-8f41bd59959f',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sravanth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'eed56f3c-acb7-46f9-92ee-8f41bd59959f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sravanth (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'eed56f3c-acb7-46f9-92ee-8f41bd59959f',
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
        value_array = EXCLUDED.value_array;
    -- Player 108: Vikash
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
        '8f365fa3-3865-47ea-a72b-b46fa289cf69',
        NULL,
        'Vikash',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Vikash
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8f365fa3-3865-47ea-a72b-b46fa289cf69',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Vikash
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8f365fa3-3865-47ea-a72b-b46fa289cf69',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Vikash (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8f365fa3-3865-47ea-a72b-b46fa289cf69',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Vikash
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8f365fa3-3865-47ea-a72b-b46fa289cf69',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Vikash (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8f365fa3-3865-47ea-a72b-b46fa289cf69',
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
        value_array = EXCLUDED.value_array;
    -- Player 109: Pranjal Mishra
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
        '789fa8a0-7594-4a54-a011-174358da5d64',
        NULL,
        'Pranjal Mishra',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Pranjal Mishra
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '789fa8a0-7594-4a54-a011-174358da5d64',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Pranjal Mishra
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '789fa8a0-7594-4a54-a011-174358da5d64',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Pranjal Mishra (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '789fa8a0-7594-4a54-a011-174358da5d64',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Pranjal Mishra
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '789fa8a0-7594-4a54-a011-174358da5d64',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Pranjal Mishra (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '789fa8a0-7594-4a54-a011-174358da5d64',
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
        value_array = EXCLUDED.value_array;
    -- Player 110: Pranjal
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
        'cc6f60c8-ae04-4cbb-83ce-3cd4c88369f7',
        NULL,
        'Pranjal',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Pranjal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cc6f60c8-ae04-4cbb-83ce-3cd4c88369f7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Pranjal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cc6f60c8-ae04-4cbb-83ce-3cd4c88369f7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Pranjal (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'cc6f60c8-ae04-4cbb-83ce-3cd4c88369f7',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Pranjal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cc6f60c8-ae04-4cbb-83ce-3cd4c88369f7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Pranjal (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'cc6f60c8-ae04-4cbb-83ce-3cd4c88369f7',
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
        value_array = EXCLUDED.value_array;
    -- Player 111: Mukesh
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
        'be05bed1-32e9-46e3-a030-01e0c6c2aef7',
        NULL,
        'Mukesh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Mukesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'be05bed1-32e9-46e3-a030-01e0c6c2aef7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Mukesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'be05bed1-32e9-46e3-a030-01e0c6c2aef7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Spin'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Mukesh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'be05bed1-32e9-46e3-a030-01e0c6c2aef7',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Mukesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'be05bed1-32e9-46e3-a030-01e0c6c2aef7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Mukesh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'be05bed1-32e9-46e3-a030-01e0c6c2aef7',
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
        value_array = EXCLUDED.value_array;
    -- Player 112: Sunil
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
        '8fdfec40-51c5-4aab-a543-becfb9e26374',
        NULL,
        'Sunil',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sunil
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8fdfec40-51c5-4aab-a543-becfb9e26374',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sunil
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8fdfec40-51c5-4aab-a543-becfb9e26374',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sunil (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8fdfec40-51c5-4aab-a543-becfb9e26374',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sunil
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8fdfec40-51c5-4aab-a543-becfb9e26374',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sunil (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8fdfec40-51c5-4aab-a543-becfb9e26374',
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
        value_array = EXCLUDED.value_array;
    -- Player 113: Prajwal
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
        '0a73efff-6fe7-49ed-ba9f-2bb064197274',
        NULL,
        'Prajwal',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Prajwal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0a73efff-6fe7-49ed-ba9f-2bb064197274',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Prajwal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0a73efff-6fe7-49ed-ba9f-2bb064197274',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Prajwal (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0a73efff-6fe7-49ed-ba9f-2bb064197274',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Prajwal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0a73efff-6fe7-49ed-ba9f-2bb064197274',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Prajwal (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0a73efff-6fe7-49ed-ba9f-2bb064197274',
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
        value_array = EXCLUDED.value_array;
    -- Player 114: Pankaj
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
        'a91546f1-fa5a-4ab4-a27c-aeb365c34671',
        NULL,
        'Pankaj',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Pankaj
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'a91546f1-fa5a-4ab4-a27c-aeb365c34671',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Pankaj
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'a91546f1-fa5a-4ab4-a27c-aeb365c34671',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Pankaj (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'a91546f1-fa5a-4ab4-a27c-aeb365c34671',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Pankaj
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'a91546f1-fa5a-4ab4-a27c-aeb365c34671',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Pankaj (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'a91546f1-fa5a-4ab4-a27c-aeb365c34671',
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
        value_array = EXCLUDED.value_array;
    -- Player 115: Saurabh
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
        '198be480-2191-49b5-9176-4068756eafbd',
        NULL,
        'Saurabh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Saurabh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '198be480-2191-49b5-9176-4068756eafbd',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Left Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Saurabh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '198be480-2191-49b5-9176-4068756eafbd',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Spin'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Saurabh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '198be480-2191-49b5-9176-4068756eafbd',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Saurabh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '198be480-2191-49b5-9176-4068756eafbd',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Saurabh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '198be480-2191-49b5-9176-4068756eafbd',
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
        value_array = EXCLUDED.value_array;
    -- Player 116: Arun Kalwala
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
        '700dc1ab-c9f6-4039-9f2e-41423bdf84f4',
        NULL,
        'Arun Kalwala',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Arun Kalwala
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '700dc1ab-c9f6-4039-9f2e-41423bdf84f4',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Arun Kalwala (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '700dc1ab-c9f6-4039-9f2e-41423bdf84f4',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Arun Kalwala
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '700dc1ab-c9f6-4039-9f2e-41423bdf84f4',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Arun Kalwala (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '700dc1ab-c9f6-4039-9f2e-41423bdf84f4',
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
        value_array = EXCLUDED.value_array;
    -- Player 117: Abhishek Kumar
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
        'cbe45ba2-df4e-403b-822a-4322d7fea509',
        NULL,
        'Abhishek Kumar',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Abhishek Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cbe45ba2-df4e-403b-822a-4322d7fea509',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Abhishek Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cbe45ba2-df4e-403b-822a-4322d7fea509',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Abhishek Kumar (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'cbe45ba2-df4e-403b-822a-4322d7fea509',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Abhishek Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cbe45ba2-df4e-403b-822a-4322d7fea509',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Abhishek Kumar (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'cbe45ba2-df4e-403b-822a-4322d7fea509',
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
        value_array = EXCLUDED.value_array;
    -- Player 118: Anil
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
        '20aac4ea-a15a-4d94-b5c5-2ab8bb3ff9ae',
        NULL,
        'Anil',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Anil
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '20aac4ea-a15a-4d94-b5c5-2ab8bb3ff9ae',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Anil
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '20aac4ea-a15a-4d94-b5c5-2ab8bb3ff9ae',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Anil (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '20aac4ea-a15a-4d94-b5c5-2ab8bb3ff9ae',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Anil
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '20aac4ea-a15a-4d94-b5c5-2ab8bb3ff9ae',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Anil (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '20aac4ea-a15a-4d94-b5c5-2ab8bb3ff9ae',
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
        value_array = EXCLUDED.value_array;
    -- Player 119: Smit
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
        '8e30f532-45ce-4d2f-abb4-64c14b9739c8',
        NULL,
        'Smit',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Smit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8e30f532-45ce-4d2f-abb4-64c14b9739c8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Smit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8e30f532-45ce-4d2f-abb4-64c14b9739c8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Spin'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Smit (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8e30f532-45ce-4d2f-abb4-64c14b9739c8',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Smit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8e30f532-45ce-4d2f-abb4-64c14b9739c8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Smit (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8e30f532-45ce-4d2f-abb4-64c14b9739c8',
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
        value_array = EXCLUDED.value_array;
    -- Player 120: Aditya Goyal
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
        '1a1f5844-aee6-487e-9468-1a9f963a019d',
        NULL,
        'Aditya Goyal',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Aditya Goyal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1a1f5844-aee6-487e-9468-1a9f963a019d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Aditya Goyal (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '1a1f5844-aee6-487e-9468-1a9f963a019d',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Aditya Goyal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1a1f5844-aee6-487e-9468-1a9f963a019d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Aditya Goyal (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '1a1f5844-aee6-487e-9468-1a9f963a019d',
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
        value_array = EXCLUDED.value_array;
    -- Player 121: Kaushik
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
        '3b312566-c38d-466c-811e-a416ff740294',
        NULL,
        'Kaushik',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Kaushik
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3b312566-c38d-466c-811e-a416ff740294',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Kaushik
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3b312566-c38d-466c-811e-a416ff740294',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Left Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Kaushik (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3b312566-c38d-466c-811e-a416ff740294',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Kaushik
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3b312566-c38d-466c-811e-a416ff740294',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Kaushik (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3b312566-c38d-466c-811e-a416ff740294',
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
        value_array = EXCLUDED.value_array;
    -- Player 122: Giridhara
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
        'ac18c744-208b-4352-98d1-829b2fb8d0b7',
        NULL,
        'Giridhara',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Giridhara
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ac18c744-208b-4352-98d1-829b2fb8d0b7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Giridhara
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ac18c744-208b-4352-98d1-829b2fb8d0b7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Giridhara (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ac18c744-208b-4352-98d1-829b2fb8d0b7',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Giridhara
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ac18c744-208b-4352-98d1-829b2fb8d0b7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Giridhara (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ac18c744-208b-4352-98d1-829b2fb8d0b7',
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
        value_array = EXCLUDED.value_array;
    -- Player 123: Akash 
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
        '4ee1c876-882b-4436-afdb-d210f86f383f',
        NULL,
        'Akash ',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Akash 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '4ee1c876-882b-4436-afdb-d210f86f383f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Akash 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '4ee1c876-882b-4436-afdb-d210f86f383f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Akash  (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '4ee1c876-882b-4436-afdb-d210f86f383f',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Akash 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '4ee1c876-882b-4436-afdb-d210f86f383f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Akash  (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '4ee1c876-882b-4436-afdb-d210f86f383f',
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
        value_array = EXCLUDED.value_array;
    -- Player 124: Akshay Miraje
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
        '421c481a-8f99-4afd-b785-8d39c234067e',
        NULL,
        'Akshay Miraje',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Akshay Miraje
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '421c481a-8f99-4afd-b785-8d39c234067e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Akshay Miraje
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '421c481a-8f99-4afd-b785-8d39c234067e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Akshay Miraje (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '421c481a-8f99-4afd-b785-8d39c234067e',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Akshay Miraje
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '421c481a-8f99-4afd-b785-8d39c234067e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Akshay Miraje (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '421c481a-8f99-4afd-b785-8d39c234067e',
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
        value_array = EXCLUDED.value_array;
    -- Player 125: Veeramuhilan
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
        'dc34fcfa-3a9f-4f84-b607-a78abb594f64',
        NULL,
        'Veeramuhilan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Veeramuhilan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'dc34fcfa-3a9f-4f84-b607-a78abb594f64',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Veeramuhilan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'dc34fcfa-3a9f-4f84-b607-a78abb594f64',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Veeramuhilan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'dc34fcfa-3a9f-4f84-b607-a78abb594f64',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Veeramuhilan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'dc34fcfa-3a9f-4f84-b607-a78abb594f64',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Veeramuhilan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'dc34fcfa-3a9f-4f84-b607-a78abb594f64',
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
        value_array = EXCLUDED.value_array;
    -- Player 126: Sumit
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
        'c80812e0-a821-4d28-95ef-efc4386929be',
        NULL,
        'Sumit',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sumit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c80812e0-a821-4d28-95ef-efc4386929be',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sumit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c80812e0-a821-4d28-95ef-efc4386929be',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Left Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sumit (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c80812e0-a821-4d28-95ef-efc4386929be',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sumit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c80812e0-a821-4d28-95ef-efc4386929be',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sumit (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c80812e0-a821-4d28-95ef-efc4386929be',
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
        value_array = EXCLUDED.value_array;
    -- Player 127: Nikhil 
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
        '623d86cf-2a57-4b12-9313-b803f1a644aa',
        NULL,
        'Nikhil ',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Nikhil 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '623d86cf-2a57-4b12-9313-b803f1a644aa',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Nikhil 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '623d86cf-2a57-4b12-9313-b803f1a644aa',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Nikhil  (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '623d86cf-2a57-4b12-9313-b803f1a644aa',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Nikhil 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '623d86cf-2a57-4b12-9313-b803f1a644aa',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Nikhil  (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '623d86cf-2a57-4b12-9313-b803f1a644aa',
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
        value_array = EXCLUDED.value_array;
    -- Player 128: Praneeth
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
        '0cfea68c-f821-480b-9706-84e440fdb5e1',
        NULL,
        'Praneeth',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Praneeth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0cfea68c-f821-480b-9706-84e440fdb5e1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Praneeth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0cfea68c-f821-480b-9706-84e440fdb5e1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Praneeth (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0cfea68c-f821-480b-9706-84e440fdb5e1',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Praneeth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0cfea68c-f821-480b-9706-84e440fdb5e1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Praneeth (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0cfea68c-f821-480b-9706-84e440fdb5e1',
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
        value_array = EXCLUDED.value_array;
    -- Player 129: Amandeep
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
        'ce6fd69d-09d4-4757-b2e7-83553da610a1',
        NULL,
        'Amandeep',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Amandeep
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ce6fd69d-09d4-4757-b2e7-83553da610a1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Amandeep (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ce6fd69d-09d4-4757-b2e7-83553da610a1',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Amandeep
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ce6fd69d-09d4-4757-b2e7-83553da610a1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Amandeep (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ce6fd69d-09d4-4757-b2e7-83553da610a1',
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
        value_array = EXCLUDED.value_array;
    -- Player 130: Sakthi
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
        '76b7b01a-e3b5-4813-bbd4-73668f5348f7',
        NULL,
        'Sakthi',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sakthi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '76b7b01a-e3b5-4813-bbd4-73668f5348f7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sakthi (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '76b7b01a-e3b5-4813-bbd4-73668f5348f7',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sakthi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '76b7b01a-e3b5-4813-bbd4-73668f5348f7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sakthi (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '76b7b01a-e3b5-4813-bbd4-73668f5348f7',
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
        value_array = EXCLUDED.value_array;
    -- Player 131: Ajay Rathore
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
        '6fe001f9-320e-4adc-9c0c-b1067369897f',
        NULL,
        'Ajay Rathore',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ajay Rathore
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6fe001f9-320e-4adc-9c0c-b1067369897f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Ajay Rathore
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6fe001f9-320e-4adc-9c0c-b1067369897f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ajay Rathore (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '6fe001f9-320e-4adc-9c0c-b1067369897f',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ajay Rathore
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6fe001f9-320e-4adc-9c0c-b1067369897f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ajay Rathore (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '6fe001f9-320e-4adc-9c0c-b1067369897f',
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
        value_array = EXCLUDED.value_array;
    -- Player 132: Sangam
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
        'a2080deb-a1d7-4b66-997a-0f9f2a3c0cde',
        NULL,
        'Sangam',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sangam
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'a2080deb-a1d7-4b66-997a-0f9f2a3c0cde',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sangam (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'a2080deb-a1d7-4b66-997a-0f9f2a3c0cde',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sangam
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'a2080deb-a1d7-4b66-997a-0f9f2a3c0cde',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sangam (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'a2080deb-a1d7-4b66-997a-0f9f2a3c0cde',
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
        value_array = EXCLUDED.value_array;
    -- Player 133: Chandra Shekhar
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
        'fb719744-2f78-4684-bf8d-d4fa37c78f27',
        NULL,
        'Chandra Shekhar',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Chandra Shekhar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'fb719744-2f78-4684-bf8d-d4fa37c78f27',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Chandra Shekhar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'fb719744-2f78-4684-bf8d-d4fa37c78f27',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Spin'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Chandra Shekhar (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'fb719744-2f78-4684-bf8d-d4fa37c78f27',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Chandra Shekhar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'fb719744-2f78-4684-bf8d-d4fa37c78f27',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Chandra Shekhar (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'fb719744-2f78-4684-bf8d-d4fa37c78f27',
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
        value_array = EXCLUDED.value_array;
    -- Player 134: Govarthan
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
        'b9341f01-1491-4d19-b5cb-2ee1ac50e05e',
        NULL,
        'Govarthan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Govarthan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b9341f01-1491-4d19-b5cb-2ee1ac50e05e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Govarthan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b9341f01-1491-4d19-b5cb-2ee1ac50e05e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Govarthan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b9341f01-1491-4d19-b5cb-2ee1ac50e05e',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Govarthan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b9341f01-1491-4d19-b5cb-2ee1ac50e05e',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Govarthan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b9341f01-1491-4d19-b5cb-2ee1ac50e05e',
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
        value_array = EXCLUDED.value_array;
    -- Player 135: Ankit
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
        'a8e82897-44f3-4d33-9429-565ef6a1abbf',
        NULL,
        'Ankit',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ankit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'a8e82897-44f3-4d33-9429-565ef6a1abbf',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Left Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Ankit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'a8e82897-44f3-4d33-9429-565ef6a1abbf',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Left Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ankit (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'a8e82897-44f3-4d33-9429-565ef6a1abbf',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ankit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'a8e82897-44f3-4d33-9429-565ef6a1abbf',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ankit (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'a8e82897-44f3-4d33-9429-565ef6a1abbf',
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
        value_array = EXCLUDED.value_array;
    -- Player 136: Bobby
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
        'e5c96e1f-ea69-4187-bd80-c933b22444ab',
        NULL,
        'Bobby',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Bobby
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e5c96e1f-ea69-4187-bd80-c933b22444ab',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Bobby
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e5c96e1f-ea69-4187-bd80-c933b22444ab',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Bobby (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'e5c96e1f-ea69-4187-bd80-c933b22444ab',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Bobby
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e5c96e1f-ea69-4187-bd80-c933b22444ab',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Bobby (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'e5c96e1f-ea69-4187-bd80-c933b22444ab',
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
        value_array = EXCLUDED.value_array;
    -- Player 137: Saket
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
        'bd159ad9-4d35-423c-a846-86b7de607e67',
        NULL,
        'Saket',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Saket
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'bd159ad9-4d35-423c-a846-86b7de607e67',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Saket
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'bd159ad9-4d35-423c-a846-86b7de607e67',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Saket (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'bd159ad9-4d35-423c-a846-86b7de607e67',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Saket
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'bd159ad9-4d35-423c-a846-86b7de607e67',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Saket (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'bd159ad9-4d35-423c-a846-86b7de607e67',
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
        value_array = EXCLUDED.value_array;
    -- Player 138: Aditya M
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
        '0254be1a-33f7-42ec-bd08-290f5e4bcf46',
        NULL,
        'Aditya M',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Aditya M
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0254be1a-33f7-42ec-bd08-290f5e4bcf46',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Aditya M
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0254be1a-33f7-42ec-bd08-290f5e4bcf46',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Aditya M (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0254be1a-33f7-42ec-bd08-290f5e4bcf46',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Aditya M
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0254be1a-33f7-42ec-bd08-290f5e4bcf46',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Aditya M (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0254be1a-33f7-42ec-bd08-290f5e4bcf46',
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
        value_array = EXCLUDED.value_array;
    -- Player 139: Hari
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
        '25902f01-1d49-4483-841a-559576b9aa00',
        NULL,
        'Hari',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Hari
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '25902f01-1d49-4483-841a-559576b9aa00',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Hari
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '25902f01-1d49-4483-841a-559576b9aa00',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Hari (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '25902f01-1d49-4483-841a-559576b9aa00',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Hari
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '25902f01-1d49-4483-841a-559576b9aa00',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Hari (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '25902f01-1d49-4483-841a-559576b9aa00',
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
        value_array = EXCLUDED.value_array;
    -- Player 140: Rahul Roshan
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
        '89aa89b0-1da2-47d9-b473-fd381ccea266',
        NULL,
        'Rahul Roshan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Rahul Roshan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '89aa89b0-1da2-47d9-b473-fd381ccea266',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Rahul Roshan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '89aa89b0-1da2-47d9-b473-fd381ccea266',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Rahul Roshan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '89aa89b0-1da2-47d9-b473-fd381ccea266',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Rahul Roshan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '89aa89b0-1da2-47d9-b473-fd381ccea266',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Rahul Roshan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '89aa89b0-1da2-47d9-b473-fd381ccea266',
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
        value_array = EXCLUDED.value_array;
    -- Player 141: Saurabh Singh
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
        'ec81c24d-2ae2-4a2c-86ba-384da4401627',
        NULL,
        'Saurabh Singh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Saurabh Singh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ec81c24d-2ae2-4a2c-86ba-384da4401627',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Saurabh Singh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ec81c24d-2ae2-4a2c-86ba-384da4401627',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Left Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Saurabh Singh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ec81c24d-2ae2-4a2c-86ba-384da4401627',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Saurabh Singh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ec81c24d-2ae2-4a2c-86ba-384da4401627',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Saurabh Singh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ec81c24d-2ae2-4a2c-86ba-384da4401627',
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
        value_array = EXCLUDED.value_array;
    -- Player 142: Nikhil Vishwakarma
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
        '9550d760-9a7f-4592-ba45-529f9f729993',
        NULL,
        'Nikhil Vishwakarma',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Nikhil Vishwakarma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9550d760-9a7f-4592-ba45-529f9f729993',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Nikhil Vishwakarma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9550d760-9a7f-4592-ba45-529f9f729993',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Nikhil Vishwakarma (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9550d760-9a7f-4592-ba45-529f9f729993',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Nikhil Vishwakarma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9550d760-9a7f-4592-ba45-529f9f729993',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Nikhil Vishwakarma (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9550d760-9a7f-4592-ba45-529f9f729993',
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
        value_array = EXCLUDED.value_array;
    -- Player 143: Virat Pujari
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
        '16a4b75f-859a-4f34-8615-b8517fffebaf',
        NULL,
        'Virat Pujari',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Virat Pujari
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '16a4b75f-859a-4f34-8615-b8517fffebaf',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Virat Pujari
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '16a4b75f-859a-4f34-8615-b8517fffebaf',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Virat Pujari (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '16a4b75f-859a-4f34-8615-b8517fffebaf',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Virat Pujari
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '16a4b75f-859a-4f34-8615-b8517fffebaf',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Virat Pujari (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '16a4b75f-859a-4f34-8615-b8517fffebaf',
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
        value_array = EXCLUDED.value_array;
    -- Player 144: Hitesh Sharma
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
        '173bc527-5cac-4fb7-ab7d-16f99fe1642c',
        NULL,
        'Hitesh Sharma',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Hitesh Sharma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '173bc527-5cac-4fb7-ab7d-16f99fe1642c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Hitesh Sharma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '173bc527-5cac-4fb7-ab7d-16f99fe1642c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Hitesh Sharma (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '173bc527-5cac-4fb7-ab7d-16f99fe1642c',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Hitesh Sharma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '173bc527-5cac-4fb7-ab7d-16f99fe1642c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Hitesh Sharma (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '173bc527-5cac-4fb7-ab7d-16f99fe1642c',
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
        value_array = EXCLUDED.value_array;
    -- Player 145: Jayanth
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
        '887591c2-a3eb-4d6d-925e-4bbe0ed75dce',
        NULL,
        'Jayanth',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Jayanth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '887591c2-a3eb-4d6d-925e-4bbe0ed75dce',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Jayanth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '887591c2-a3eb-4d6d-925e-4bbe0ed75dce',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Jayanth (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '887591c2-a3eb-4d6d-925e-4bbe0ed75dce',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Jayanth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '887591c2-a3eb-4d6d-925e-4bbe0ed75dce',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Jayanth (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '887591c2-a3eb-4d6d-925e-4bbe0ed75dce',
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
        value_array = EXCLUDED.value_array;
    -- Player 146: Akash M
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
        '4db83746-b98a-42cf-9c62-f36ac88e9a32',
        NULL,
        'Akash M',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Akash M
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '4db83746-b98a-42cf-9c62-f36ac88e9a32',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Akash M
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '4db83746-b98a-42cf-9c62-f36ac88e9a32',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Left Arm Fast'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Akash M (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '4db83746-b98a-42cf-9c62-f36ac88e9a32',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Akash M
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '4db83746-b98a-42cf-9c62-f36ac88e9a32',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Akash M (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '4db83746-b98a-42cf-9c62-f36ac88e9a32',
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
        value_array = EXCLUDED.value_array;
    -- Player 147: Vinod
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
        '821af411-5a21-4e66-91ed-108b8dc5708d',
        NULL,
        'Vinod',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Vinod
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '821af411-5a21-4e66-91ed-108b8dc5708d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Vinod
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '821af411-5a21-4e66-91ed-108b8dc5708d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Vinod (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '821af411-5a21-4e66-91ed-108b8dc5708d',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Vinod
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '821af411-5a21-4e66-91ed-108b8dc5708d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Vinod (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '821af411-5a21-4e66-91ed-108b8dc5708d',
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
        value_array = EXCLUDED.value_array;
    -- Player 148: Parag
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
        '6c19df4e-93fd-4963-a314-f67a07f0558b',
        NULL,
        'Parag',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Parag
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6c19df4e-93fd-4963-a314-f67a07f0558b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Parag
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6c19df4e-93fd-4963-a314-f67a07f0558b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Parag (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '6c19df4e-93fd-4963-a314-f67a07f0558b',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Parag
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6c19df4e-93fd-4963-a314-f67a07f0558b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Parag (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '6c19df4e-93fd-4963-a314-f67a07f0558b',
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
        value_array = EXCLUDED.value_array;
    -- Player 149: Suhas
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
        '2a304fe1-82ba-438b-812a-66759ed22003',
        NULL,
        'Suhas',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Suhas
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2a304fe1-82ba-438b-812a-66759ed22003',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Suhas
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2a304fe1-82ba-438b-812a-66759ed22003',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Suhas (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '2a304fe1-82ba-438b-812a-66759ed22003',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Suhas
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2a304fe1-82ba-438b-812a-66759ed22003',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Suhas (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '2a304fe1-82ba-438b-812a-66759ed22003',
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
        value_array = EXCLUDED.value_array;
    -- Player 150: Ashish K
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
        '1215fe9e-e22f-416c-8517-6587ee6a328d',
        NULL,
        'Ashish K',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ashish K
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1215fe9e-e22f-416c-8517-6587ee6a328d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Ashish K
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1215fe9e-e22f-416c-8517-6587ee6a328d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ashish K (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '1215fe9e-e22f-416c-8517-6587ee6a328d',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ashish K
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1215fe9e-e22f-416c-8517-6587ee6a328d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ashish K (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '1215fe9e-e22f-416c-8517-6587ee6a328d',
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
        value_array = EXCLUDED.value_array;
    -- Player 151: Amit Kumar
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
        'd8797379-7fc5-4d13-a2d7-12b4799894ce',
        NULL,
        'Amit Kumar',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Amit Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd8797379-7fc5-4d13-a2d7-12b4799894ce',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Amit Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd8797379-7fc5-4d13-a2d7-12b4799894ce',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Left Arm Fast'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Amit Kumar (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'd8797379-7fc5-4d13-a2d7-12b4799894ce',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Amit Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd8797379-7fc5-4d13-a2d7-12b4799894ce',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Amit Kumar (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'd8797379-7fc5-4d13-a2d7-12b4799894ce',
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
        value_array = EXCLUDED.value_array;
    -- Player 152: Mukul
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
        '22f3b76a-82ad-4061-8df2-b2dc4819c9ef',
        NULL,
        'Mukul',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Mukul
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '22f3b76a-82ad-4061-8df2-b2dc4819c9ef',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Mukul
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '22f3b76a-82ad-4061-8df2-b2dc4819c9ef',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Mukul (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '22f3b76a-82ad-4061-8df2-b2dc4819c9ef',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Mukul
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '22f3b76a-82ad-4061-8df2-b2dc4819c9ef',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Mukul (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '22f3b76a-82ad-4061-8df2-b2dc4819c9ef',
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
        value_array = EXCLUDED.value_array;
    -- Player 153: Dinesh Kumar
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
        '0a8ab5ab-b0d3-4d57-aa9a-b65c24af6d97',
        NULL,
        'Dinesh Kumar',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Dinesh Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0a8ab5ab-b0d3-4d57-aa9a-b65c24af6d97',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Dinesh Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0a8ab5ab-b0d3-4d57-aa9a-b65c24af6d97',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Dinesh Kumar (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0a8ab5ab-b0d3-4d57-aa9a-b65c24af6d97',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Dinesh Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0a8ab5ab-b0d3-4d57-aa9a-b65c24af6d97',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Dinesh Kumar (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0a8ab5ab-b0d3-4d57-aa9a-b65c24af6d97',
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
        value_array = EXCLUDED.value_array;
    -- Player 154: Vishal Sharma
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
        '1ab25400-37fc-4fa2-8855-72ace6438a40',
        NULL,
        'Vishal Sharma',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Vishal Sharma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1ab25400-37fc-4fa2-8855-72ace6438a40',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Left Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Vishal Sharma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1ab25400-37fc-4fa2-8855-72ace6438a40',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Vishal Sharma (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '1ab25400-37fc-4fa2-8855-72ace6438a40',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Vishal Sharma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1ab25400-37fc-4fa2-8855-72ace6438a40',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Vishal Sharma (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '1ab25400-37fc-4fa2-8855-72ace6438a40',
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
        value_array = EXCLUDED.value_array;
    -- Player 155: Vishal
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
        '017d52f7-7e47-4de7-ac2b-faea2c1aef43',
        NULL,
        'Vishal',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Vishal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '017d52f7-7e47-4de7-ac2b-faea2c1aef43',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Vishal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '017d52f7-7e47-4de7-ac2b-faea2c1aef43',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Vishal (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '017d52f7-7e47-4de7-ac2b-faea2c1aef43',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Vishal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '017d52f7-7e47-4de7-ac2b-faea2c1aef43',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Vishal (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '017d52f7-7e47-4de7-ac2b-faea2c1aef43',
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
        value_array = EXCLUDED.value_array;
    -- Player 156: Roshan PR
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
        'd65bbc4d-6586-4e61-b58a-b71cfc5b80d1',
        NULL,
        'Roshan PR',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Roshan PR
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd65bbc4d-6586-4e61-b58a-b71cfc5b80d1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Roshan PR
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd65bbc4d-6586-4e61-b58a-b71cfc5b80d1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Roshan PR (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'd65bbc4d-6586-4e61-b58a-b71cfc5b80d1',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Roshan PR
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd65bbc4d-6586-4e61-b58a-b71cfc5b80d1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Roshan PR (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'd65bbc4d-6586-4e61-b58a-b71cfc5b80d1',
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
        value_array = EXCLUDED.value_array;
    -- Player 157: Tarun
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
        '3b895403-3226-43e0-8b6f-eb44ac594a18',
        NULL,
        'Tarun',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Tarun
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3b895403-3226-43e0-8b6f-eb44ac594a18',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Tarun
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3b895403-3226-43e0-8b6f-eb44ac594a18',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Tarun (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3b895403-3226-43e0-8b6f-eb44ac594a18',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Tarun
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3b895403-3226-43e0-8b6f-eb44ac594a18',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Tarun (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3b895403-3226-43e0-8b6f-eb44ac594a18',
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
        value_array = EXCLUDED.value_array;
    -- Player 158: Rahul Reddy
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
        '9f4a0874-1dba-4326-8001-5fc1b138a4c2',
        NULL,
        'Rahul Reddy',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Rahul Reddy
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9f4a0874-1dba-4326-8001-5fc1b138a4c2',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Rahul Reddy
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9f4a0874-1dba-4326-8001-5fc1b138a4c2',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Rahul Reddy (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9f4a0874-1dba-4326-8001-5fc1b138a4c2',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Rahul Reddy
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9f4a0874-1dba-4326-8001-5fc1b138a4c2',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Rahul Reddy (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9f4a0874-1dba-4326-8001-5fc1b138a4c2',
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
        value_array = EXCLUDED.value_array;
    -- Player 159: Ashok
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
        '29532207-e2e9-4f08-bc45-d3b1ccc25de3',
        NULL,
        'Ashok',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ashok
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '29532207-e2e9-4f08-bc45-d3b1ccc25de3',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Ashok
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '29532207-e2e9-4f08-bc45-d3b1ccc25de3',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ashok (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '29532207-e2e9-4f08-bc45-d3b1ccc25de3',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ashok
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '29532207-e2e9-4f08-bc45-d3b1ccc25de3',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ashok (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '29532207-e2e9-4f08-bc45-d3b1ccc25de3',
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
        value_array = EXCLUDED.value_array;
    -- Player 160: Anshuman
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
        '6c6fb01d-9be2-40bf-8f26-d9f4aaf1f0d5',
        NULL,
        'Anshuman',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Anshuman
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6c6fb01d-9be2-40bf-8f26-d9f4aaf1f0d5',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Anshuman
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6c6fb01d-9be2-40bf-8f26-d9f4aaf1f0d5',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Spin'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Anshuman (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '6c6fb01d-9be2-40bf-8f26-d9f4aaf1f0d5',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Anshuman
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6c6fb01d-9be2-40bf-8f26-d9f4aaf1f0d5',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Anshuman (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '6c6fb01d-9be2-40bf-8f26-d9f4aaf1f0d5',
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
        value_array = EXCLUDED.value_array;
    -- Player 161: Pradeep
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
        '62a5da34-2251-4baf-98c4-3a4767b60eaa',
        NULL,
        'Pradeep',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Pradeep
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '62a5da34-2251-4baf-98c4-3a4767b60eaa',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Pradeep
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '62a5da34-2251-4baf-98c4-3a4767b60eaa',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Pradeep (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '62a5da34-2251-4baf-98c4-3a4767b60eaa',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Pradeep
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '62a5da34-2251-4baf-98c4-3a4767b60eaa',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Pradeep (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '62a5da34-2251-4baf-98c4-3a4767b60eaa',
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
        value_array = EXCLUDED.value_array;
    -- Player 162: Jayant
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
        '2f90f6f2-7e48-4c92-aba3-e6fb8f73c2ce',
        NULL,
        'Jayant',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Jayant
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2f90f6f2-7e48-4c92-aba3-e6fb8f73c2ce',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Jayant
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2f90f6f2-7e48-4c92-aba3-e6fb8f73c2ce',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Jayant (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '2f90f6f2-7e48-4c92-aba3-e6fb8f73c2ce',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Jayant
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2f90f6f2-7e48-4c92-aba3-e6fb8f73c2ce',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Jayant (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '2f90f6f2-7e48-4c92-aba3-e6fb8f73c2ce',
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
        value_array = EXCLUDED.value_array;
    -- Player 163: Rahul Singh
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
        '1f42cc0d-54e6-4a64-be62-2265be5daae9',
        NULL,
        'Rahul Singh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Rahul Singh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1f42cc0d-54e6-4a64-be62-2265be5daae9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Left Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Rahul Singh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1f42cc0d-54e6-4a64-be62-2265be5daae9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Spin'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Rahul Singh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '1f42cc0d-54e6-4a64-be62-2265be5daae9',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Rahul Singh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1f42cc0d-54e6-4a64-be62-2265be5daae9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Rahul Singh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '1f42cc0d-54e6-4a64-be62-2265be5daae9',
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
        value_array = EXCLUDED.value_array;
    -- Player 164: Bhuwanesh Nainwal
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
        '419b1963-1053-4695-9352-7a956d044b76',
        NULL,
        'Bhuwanesh Nainwal',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Bhuwanesh Nainwal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '419b1963-1053-4695-9352-7a956d044b76',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Bhuwanesh Nainwal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '419b1963-1053-4695-9352-7a956d044b76',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Bhuwanesh Nainwal (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '419b1963-1053-4695-9352-7a956d044b76',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Bhuwanesh Nainwal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '419b1963-1053-4695-9352-7a956d044b76',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Bhuwanesh Nainwal (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '419b1963-1053-4695-9352-7a956d044b76',
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
        value_array = EXCLUDED.value_array;
    -- Player 165: Abhishek Singh
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
        'b9c54e05-0929-484a-a85c-9a0039856f51',
        NULL,
        'Abhishek Singh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Abhishek Singh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b9c54e05-0929-484a-a85c-9a0039856f51',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Abhishek Singh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b9c54e05-0929-484a-a85c-9a0039856f51',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Abhishek Singh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b9c54e05-0929-484a-a85c-9a0039856f51',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Abhishek Singh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b9c54e05-0929-484a-a85c-9a0039856f51',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Abhishek Singh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b9c54e05-0929-484a-a85c-9a0039856f51',
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
        value_array = EXCLUDED.value_array;
    -- Player 166: Yash Khaitan
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
        '7ce1c869-0cb2-439f-b4a4-9573dce49604',
        NULL,
        'Yash Khaitan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Yash Khaitan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7ce1c869-0cb2-439f-b4a4-9573dce49604',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Left Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Yash Khaitan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7ce1c869-0cb2-439f-b4a4-9573dce49604',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Yash Khaitan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '7ce1c869-0cb2-439f-b4a4-9573dce49604',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Yash Khaitan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7ce1c869-0cb2-439f-b4a4-9573dce49604',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Yash Khaitan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '7ce1c869-0cb2-439f-b4a4-9573dce49604',
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
        value_array = EXCLUDED.value_array;
    -- Player 167: Parth
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
        '9d7be08e-0b53-4aad-a993-9c15654a9110',
        NULL,
        'Parth',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Parth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9d7be08e-0b53-4aad-a993-9c15654a9110',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Left Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Parth (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9d7be08e-0b53-4aad-a993-9c15654a9110',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Parth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9d7be08e-0b53-4aad-a993-9c15654a9110',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Parth (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9d7be08e-0b53-4aad-a993-9c15654a9110',
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
        value_array = EXCLUDED.value_array;
    -- Player 168: Suresh
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
        'c4b9497d-6587-48e3-bf56-143d47aa843d',
        NULL,
        'Suresh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Suresh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c4b9497d-6587-48e3-bf56-143d47aa843d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Suresh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c4b9497d-6587-48e3-bf56-143d47aa843d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Suresh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c4b9497d-6587-48e3-bf56-143d47aa843d',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Suresh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c4b9497d-6587-48e3-bf56-143d47aa843d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Suresh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c4b9497d-6587-48e3-bf56-143d47aa843d',
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
        value_array = EXCLUDED.value_array;
    -- Player 169: Irfan
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
        '79ebc33c-0b6a-4119-9234-0bbe223ab5da',
        NULL,
        'Irfan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Irfan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '79ebc33c-0b6a-4119-9234-0bbe223ab5da',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Irfan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '79ebc33c-0b6a-4119-9234-0bbe223ab5da',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Irfan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '79ebc33c-0b6a-4119-9234-0bbe223ab5da',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Irfan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '79ebc33c-0b6a-4119-9234-0bbe223ab5da',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Irfan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '79ebc33c-0b6a-4119-9234-0bbe223ab5da',
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
        value_array = EXCLUDED.value_array;
    -- Player 170: Pulkit
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
        '48e26fa1-4aa5-4d7e-9b73-afd457503de9',
        NULL,
        'Pulkit',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Pulkit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '48e26fa1-4aa5-4d7e-9b73-afd457503de9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Pulkit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '48e26fa1-4aa5-4d7e-9b73-afd457503de9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Pulkit (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '48e26fa1-4aa5-4d7e-9b73-afd457503de9',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Pulkit
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '48e26fa1-4aa5-4d7e-9b73-afd457503de9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Pulkit (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '48e26fa1-4aa5-4d7e-9b73-afd457503de9',
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
        value_array = EXCLUDED.value_array;
    -- Player 171: Animesh
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
        '820f5296-405b-4691-aa6e-a635e56db451',
        NULL,
        'Animesh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Animesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '820f5296-405b-4691-aa6e-a635e56db451',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Animesh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '820f5296-405b-4691-aa6e-a635e56db451',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Animesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '820f5296-405b-4691-aa6e-a635e56db451',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Animesh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '820f5296-405b-4691-aa6e-a635e56db451',
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
        value_array = EXCLUDED.value_array;
    -- Player 172: Tharun
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
        '359fbaed-c6b2-41f4-b782-f37d8c9370ca',
        NULL,
        'Tharun',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Tharun
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '359fbaed-c6b2-41f4-b782-f37d8c9370ca',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Tharun (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '359fbaed-c6b2-41f4-b782-f37d8c9370ca',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Tharun
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '359fbaed-c6b2-41f4-b782-f37d8c9370ca',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Tharun (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '359fbaed-c6b2-41f4-b782-f37d8c9370ca',
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
        value_array = EXCLUDED.value_array;
    -- Player 173: Samarth Gupta
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
        'c9af0143-c595-4c14-a024-7fa18ba983b5',
        NULL,
        'Samarth Gupta',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Samarth Gupta
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c9af0143-c595-4c14-a024-7fa18ba983b5',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Samarth Gupta
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c9af0143-c595-4c14-a024-7fa18ba983b5',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Left Arm Fast'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Samarth Gupta (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c9af0143-c595-4c14-a024-7fa18ba983b5',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Samarth Gupta
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c9af0143-c595-4c14-a024-7fa18ba983b5',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Samarth Gupta (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c9af0143-c595-4c14-a024-7fa18ba983b5',
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
        value_array = EXCLUDED.value_array;
    -- Player 174: Akshat Sharma
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
        '29d9a1e7-0eb6-4753-8713-2ab3c71cc723',
        NULL,
        'Akshat Sharma',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Akshat Sharma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '29d9a1e7-0eb6-4753-8713-2ab3c71cc723',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Akshat Sharma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '29d9a1e7-0eb6-4753-8713-2ab3c71cc723',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Akshat Sharma (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '29d9a1e7-0eb6-4753-8713-2ab3c71cc723',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Akshat Sharma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '29d9a1e7-0eb6-4753-8713-2ab3c71cc723',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Akshat Sharma (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '29d9a1e7-0eb6-4753-8713-2ab3c71cc723',
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
        value_array = EXCLUDED.value_array;
    -- Player 175: Jagannath Pal
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
        '93f55622-00c0-431e-b315-220ede6eadaf',
        NULL,
        'Jagannath Pal',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Jagannath Pal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '93f55622-00c0-431e-b315-220ede6eadaf',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Jagannath Pal (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '93f55622-00c0-431e-b315-220ede6eadaf',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Jagannath Pal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '93f55622-00c0-431e-b315-220ede6eadaf',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Jagannath Pal (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '93f55622-00c0-431e-b315-220ede6eadaf',
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
        value_array = EXCLUDED.value_array;
    -- Player 176: Sai Krishna
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
        'e2c37c92-bc0d-4fa7-ae6f-c57e2984171d',
        NULL,
        'Sai Krishna',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sai Krishna
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e2c37c92-bc0d-4fa7-ae6f-c57e2984171d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sai Krishna
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e2c37c92-bc0d-4fa7-ae6f-c57e2984171d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sai Krishna (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'e2c37c92-bc0d-4fa7-ae6f-c57e2984171d',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sai Krishna
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e2c37c92-bc0d-4fa7-ae6f-c57e2984171d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sai Krishna (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'e2c37c92-bc0d-4fa7-ae6f-c57e2984171d',
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
        value_array = EXCLUDED.value_array;
    -- Player 177: Ravi Charan
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
        'c4c649d1-121e-48a8-ba15-123ff360343c',
        NULL,
        'Ravi Charan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ravi Charan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c4c649d1-121e-48a8-ba15-123ff360343c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Ravi Charan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c4c649d1-121e-48a8-ba15-123ff360343c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ravi Charan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c4c649d1-121e-48a8-ba15-123ff360343c',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ravi Charan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c4c649d1-121e-48a8-ba15-123ff360343c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ravi Charan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c4c649d1-121e-48a8-ba15-123ff360343c',
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
        value_array = EXCLUDED.value_array;
    -- Player 178: Pratik Shinde
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
        'ff767601-538d-48f6-9f74-e3280a651c48',
        NULL,
        'Pratik Shinde',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Pratik Shinde
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ff767601-538d-48f6-9f74-e3280a651c48',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Pratik Shinde (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ff767601-538d-48f6-9f74-e3280a651c48',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Pratik Shinde
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ff767601-538d-48f6-9f74-e3280a651c48',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Pratik Shinde (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ff767601-538d-48f6-9f74-e3280a651c48',
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
        value_array = EXCLUDED.value_array;
    -- Player 179: Vishva G
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
        'ece43628-aad8-45b2-b828-0189309d94a8',
        NULL,
        'Vishva G',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Vishva G
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ece43628-aad8-45b2-b828-0189309d94a8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Vishva G
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ece43628-aad8-45b2-b828-0189309d94a8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Vishva G (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ece43628-aad8-45b2-b828-0189309d94a8',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Vishva G
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'ece43628-aad8-45b2-b828-0189309d94a8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Vishva G (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'ece43628-aad8-45b2-b828-0189309d94a8',
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
        value_array = EXCLUDED.value_array;
    -- Player 180: Jayant Pal
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
        '06994cbf-367f-443e-97bc-ef5db8ee6a84',
        NULL,
        'Jayant Pal',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Jayant Pal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '06994cbf-367f-443e-97bc-ef5db8ee6a84',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Jayant Pal (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '06994cbf-367f-443e-97bc-ef5db8ee6a84',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Jayant Pal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '06994cbf-367f-443e-97bc-ef5db8ee6a84',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Jayant Pal (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '06994cbf-367f-443e-97bc-ef5db8ee6a84',
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
        value_array = EXCLUDED.value_array;
    -- Player 181: Dhruvil Shah
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
        'c40bdb22-f795-4e4f-a5bd-eaabbef786a4',
        NULL,
        'Dhruvil Shah',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Dhruvil Shah
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c40bdb22-f795-4e4f-a5bd-eaabbef786a4',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Left Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Dhruvil Shah
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c40bdb22-f795-4e4f-a5bd-eaabbef786a4',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Dhruvil Shah (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c40bdb22-f795-4e4f-a5bd-eaabbef786a4',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Dhruvil Shah
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c40bdb22-f795-4e4f-a5bd-eaabbef786a4',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Dhruvil Shah (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c40bdb22-f795-4e4f-a5bd-eaabbef786a4',
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
        value_array = EXCLUDED.value_array;
    -- Player 182: Shafi
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
        '6fcbc388-1e51-4d3b-ac0e-5e593e1e52e9',
        NULL,
        'Shafi',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Shafi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6fcbc388-1e51-4d3b-ac0e-5e593e1e52e9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Shafi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6fcbc388-1e51-4d3b-ac0e-5e593e1e52e9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Spin'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Shafi (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '6fcbc388-1e51-4d3b-ac0e-5e593e1e52e9',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Shafi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6fcbc388-1e51-4d3b-ac0e-5e593e1e52e9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Shafi (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '6fcbc388-1e51-4d3b-ac0e-5e593e1e52e9',
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
        value_array = EXCLUDED.value_array;
    -- Player 183: Rama Krishna Varma
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
        'aaabfaf5-2900-4d72-a8f7-bc6dfea81103',
        NULL,
        'Rama Krishna Varma',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Rama Krishna Varma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'aaabfaf5-2900-4d72-a8f7-bc6dfea81103',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Rama Krishna Varma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'aaabfaf5-2900-4d72-a8f7-bc6dfea81103',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Rama Krishna Varma (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'aaabfaf5-2900-4d72-a8f7-bc6dfea81103',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Rama Krishna Varma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'aaabfaf5-2900-4d72-a8f7-bc6dfea81103',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Rama Krishna Varma (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'aaabfaf5-2900-4d72-a8f7-bc6dfea81103',
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
        value_array = EXCLUDED.value_array;
    -- Player 184: Rishabh Jain
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
        '539e4117-4388-4098-8eb0-ba1b91b89239',
        NULL,
        'Rishabh Jain',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Rishabh Jain
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '539e4117-4388-4098-8eb0-ba1b91b89239',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Rishabh Jain (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '539e4117-4388-4098-8eb0-ba1b91b89239',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Rishabh Jain
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '539e4117-4388-4098-8eb0-ba1b91b89239',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Rishabh Jain (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '539e4117-4388-4098-8eb0-ba1b91b89239',
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
        value_array = EXCLUDED.value_array;
    -- Player 185: Harsh Tomar
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
        '9c502475-cdc5-49f3-940d-94f35ea5b333',
        NULL,
        'Harsh Tomar',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Harsh Tomar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9c502475-cdc5-49f3-940d-94f35ea5b333',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Harsh Tomar (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9c502475-cdc5-49f3-940d-94f35ea5b333',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Harsh Tomar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9c502475-cdc5-49f3-940d-94f35ea5b333',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Harsh Tomar (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9c502475-cdc5-49f3-940d-94f35ea5b333',
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
        value_array = EXCLUDED.value_array;
    -- Player 186: Aman
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
        '1024269f-2322-4759-a5d6-4f53c1d0b36c',
        NULL,
        'Aman',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Aman
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1024269f-2322-4759-a5d6-4f53c1d0b36c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Aman
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1024269f-2322-4759-a5d6-4f53c1d0b36c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Aman (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '1024269f-2322-4759-a5d6-4f53c1d0b36c',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Aman
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '1024269f-2322-4759-a5d6-4f53c1d0b36c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Aman (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '1024269f-2322-4759-a5d6-4f53c1d0b36c',
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
        value_array = EXCLUDED.value_array;
    -- Player 187: Shalivahan
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
        '3f64fa2b-85d2-481c-b72a-c23424d4e341',
        NULL,
        'Shalivahan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Shalivahan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3f64fa2b-85d2-481c-b72a-c23424d4e341',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Shalivahan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3f64fa2b-85d2-481c-b72a-c23424d4e341',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Shalivahan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3f64fa2b-85d2-481c-b72a-c23424d4e341',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Shalivahan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3f64fa2b-85d2-481c-b72a-c23424d4e341',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Shalivahan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3f64fa2b-85d2-481c-b72a-c23424d4e341',
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
        value_array = EXCLUDED.value_array;
    -- Player 188: Sanjay Nandi
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
        '29c450f2-da40-4d74-9f39-950758e17949',
        NULL,
        'Sanjay Nandi',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sanjay Nandi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '29c450f2-da40-4d74-9f39-950758e17949',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sanjay Nandi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '29c450f2-da40-4d74-9f39-950758e17949',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sanjay Nandi (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '29c450f2-da40-4d74-9f39-950758e17949',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sanjay Nandi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '29c450f2-da40-4d74-9f39-950758e17949',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sanjay Nandi (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '29c450f2-da40-4d74-9f39-950758e17949',
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
        value_array = EXCLUDED.value_array;
    -- Player 189: Raghav
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
        '9003c78e-eba5-4251-a074-1cd663def10b',
        NULL,
        'Raghav',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Raghav
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9003c78e-eba5-4251-a074-1cd663def10b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Raghav
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9003c78e-eba5-4251-a074-1cd663def10b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Raghav (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9003c78e-eba5-4251-a074-1cd663def10b',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Raghav
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9003c78e-eba5-4251-a074-1cd663def10b',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Raghav (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9003c78e-eba5-4251-a074-1cd663def10b',
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
        value_array = EXCLUDED.value_array;
    -- Player 190: Yash
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
        '37a610dd-3c17-480a-93ec-c66b35181d3a',
        NULL,
        'Yash',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Yash
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '37a610dd-3c17-480a-93ec-c66b35181d3a',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Yash
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '37a610dd-3c17-480a-93ec-c66b35181d3a',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Yash (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '37a610dd-3c17-480a-93ec-c66b35181d3a',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Yash
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '37a610dd-3c17-480a-93ec-c66b35181d3a',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Yash (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '37a610dd-3c17-480a-93ec-c66b35181d3a',
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
        value_array = EXCLUDED.value_array;
    -- Player 191: Aiyush Verma
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
        '42daf5bc-d7e9-46ed-92e7-c0867ab9dbae',
        NULL,
        'Aiyush Verma',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Aiyush Verma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '42daf5bc-d7e9-46ed-92e7-c0867ab9dbae',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Aiyush Verma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '42daf5bc-d7e9-46ed-92e7-c0867ab9dbae',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Aiyush Verma (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '42daf5bc-d7e9-46ed-92e7-c0867ab9dbae',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Aiyush Verma
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '42daf5bc-d7e9-46ed-92e7-c0867ab9dbae',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Aiyush Verma (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '42daf5bc-d7e9-46ed-92e7-c0867ab9dbae',
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
        value_array = EXCLUDED.value_array;
    -- Player 192: Pratik
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
        '675404a6-217a-42e9-a7ae-9f92c2280920',
        NULL,
        'Pratik',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Pratik
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '675404a6-217a-42e9-a7ae-9f92c2280920',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Pratik
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '675404a6-217a-42e9-a7ae-9f92c2280920',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Pratik (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '675404a6-217a-42e9-a7ae-9f92c2280920',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Pratik
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '675404a6-217a-42e9-a7ae-9f92c2280920',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Pratik (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '675404a6-217a-42e9-a7ae-9f92c2280920',
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
        value_array = EXCLUDED.value_array;
    -- Player 193: Soundar J
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
        'cf15d0a3-2aeb-433e-9a4b-506a91f79f2d',
        NULL,
        'Soundar J',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Soundar J
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cf15d0a3-2aeb-433e-9a4b-506a91f79f2d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Soundar J (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'cf15d0a3-2aeb-433e-9a4b-506a91f79f2d',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Soundar J
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cf15d0a3-2aeb-433e-9a4b-506a91f79f2d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Soundar J (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'cf15d0a3-2aeb-433e-9a4b-506a91f79f2d',
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
        value_array = EXCLUDED.value_array;
    -- Player 194: Vinay Pujari
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
        'c174a2cf-b353-4a6b-bf26-dfc429cf6617',
        NULL,
        'Vinay Pujari',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Vinay Pujari
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c174a2cf-b353-4a6b-bf26-dfc429cf6617',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Vinay Pujari
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c174a2cf-b353-4a6b-bf26-dfc429cf6617',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Vinay Pujari (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c174a2cf-b353-4a6b-bf26-dfc429cf6617',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Vinay Pujari
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c174a2cf-b353-4a6b-bf26-dfc429cf6617',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Vinay Pujari (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c174a2cf-b353-4a6b-bf26-dfc429cf6617',
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
        value_array = EXCLUDED.value_array;
    -- Player 195: Manish
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
        '22e013e2-8767-4ca3-9e96-20327718fcca',
        NULL,
        'Manish',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Manish
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '22e013e2-8767-4ca3-9e96-20327718fcca',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Manish
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '22e013e2-8767-4ca3-9e96-20327718fcca',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Manish (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '22e013e2-8767-4ca3-9e96-20327718fcca',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Manish
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '22e013e2-8767-4ca3-9e96-20327718fcca',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Manish (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '22e013e2-8767-4ca3-9e96-20327718fcca',
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
        value_array = EXCLUDED.value_array;
    -- Player 196: Manoz
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
        '7d30172b-406c-4a49-9c8a-0baa6bff1056',
        NULL,
        'Manoz',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Manoz
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7d30172b-406c-4a49-9c8a-0baa6bff1056',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Manoz (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '7d30172b-406c-4a49-9c8a-0baa6bff1056',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Manoz
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7d30172b-406c-4a49-9c8a-0baa6bff1056',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Manoz (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '7d30172b-406c-4a49-9c8a-0baa6bff1056',
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
        value_array = EXCLUDED.value_array;
    -- Player 197: Vimal
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
        '52d821f1-de9f-4e5a-adb1-94866b9188fa',
        NULL,
        'Vimal',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Vimal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '52d821f1-de9f-4e5a-adb1-94866b9188fa',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Vimal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '52d821f1-de9f-4e5a-adb1-94866b9188fa',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Vimal (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '52d821f1-de9f-4e5a-adb1-94866b9188fa',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Vimal
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '52d821f1-de9f-4e5a-adb1-94866b9188fa',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Vimal (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '52d821f1-de9f-4e5a-adb1-94866b9188fa',
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
        value_array = EXCLUDED.value_array;
    -- Player 198: Manthan
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
        'deca32b9-3541-4609-bfab-da65439cb625',
        NULL,
        'Manthan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Manthan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'deca32b9-3541-4609-bfab-da65439cb625',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Manthan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'deca32b9-3541-4609-bfab-da65439cb625',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Manthan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'deca32b9-3541-4609-bfab-da65439cb625',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Manthan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'deca32b9-3541-4609-bfab-da65439cb625',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Manthan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'deca32b9-3541-4609-bfab-da65439cb625',
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
        value_array = EXCLUDED.value_array;
    -- Player 199: Saleem
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
        'bdaac189-35b3-4c53-85ba-aea9e37258eb',
        NULL,
        'Saleem',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Saleem
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'bdaac189-35b3-4c53-85ba-aea9e37258eb',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Saleem
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'bdaac189-35b3-4c53-85ba-aea9e37258eb',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Saleem (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'bdaac189-35b3-4c53-85ba-aea9e37258eb',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Saleem
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'bdaac189-35b3-4c53-85ba-aea9e37258eb',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Saleem (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'bdaac189-35b3-4c53-85ba-aea9e37258eb',
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
        value_array = EXCLUDED.value_array;
    -- Player 200: Adithya R
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
        '0523c296-46ec-41de-943a-eab268953a96',
        NULL,
        'Adithya R',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Adithya R
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0523c296-46ec-41de-943a-eab268953a96',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Adithya R
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0523c296-46ec-41de-943a-eab268953a96',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Adithya R (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0523c296-46ec-41de-943a-eab268953a96',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Adithya R
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0523c296-46ec-41de-943a-eab268953a96',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Adithya R (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0523c296-46ec-41de-943a-eab268953a96',
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
        value_array = EXCLUDED.value_array;
    -- Player 201: Sadashiv
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
        'acab2145-c6c2-4bd8-9c3f-b701d76abaff',
        NULL,
        'Sadashiv',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sadashiv
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'acab2145-c6c2-4bd8-9c3f-b701d76abaff',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sadashiv
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'acab2145-c6c2-4bd8-9c3f-b701d76abaff',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sadashiv (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'acab2145-c6c2-4bd8-9c3f-b701d76abaff',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sadashiv
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'acab2145-c6c2-4bd8-9c3f-b701d76abaff',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sadashiv (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'acab2145-c6c2-4bd8-9c3f-b701d76abaff',
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
        value_array = EXCLUDED.value_array;
    -- Player 202: Sharath
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
        '3db44c16-5b31-4d00-a17d-8f1199c33506',
        NULL,
        'Sharath',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sharath
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3db44c16-5b31-4d00-a17d-8f1199c33506',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sharath
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3db44c16-5b31-4d00-a17d-8f1199c33506',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sharath (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3db44c16-5b31-4d00-a17d-8f1199c33506',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sharath
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3db44c16-5b31-4d00-a17d-8f1199c33506',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sharath (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3db44c16-5b31-4d00-a17d-8f1199c33506',
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
        value_array = EXCLUDED.value_array;
    -- Player 203: Saksham
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
        '94dcb29f-5de5-4cba-b300-a7ca5d87c47f',
        NULL,
        'Saksham',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Saksham
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '94dcb29f-5de5-4cba-b300-a7ca5d87c47f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Saksham
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '94dcb29f-5de5-4cba-b300-a7ca5d87c47f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Saksham (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '94dcb29f-5de5-4cba-b300-a7ca5d87c47f',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Saksham
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '94dcb29f-5de5-4cba-b300-a7ca5d87c47f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Saksham (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '94dcb29f-5de5-4cba-b300-a7ca5d87c47f',
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
        value_array = EXCLUDED.value_array;
    -- Player 204: Chethan
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
        'aa4a980d-c936-44f5-92d5-82510cc51223',
        NULL,
        'Chethan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Chethan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'aa4a980d-c936-44f5-92d5-82510cc51223',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Chethan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'aa4a980d-c936-44f5-92d5-82510cc51223',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Chethan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'aa4a980d-c936-44f5-92d5-82510cc51223',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Chethan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'aa4a980d-c936-44f5-92d5-82510cc51223',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Chethan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'aa4a980d-c936-44f5-92d5-82510cc51223',
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
        value_array = EXCLUDED.value_array;
    -- Player 205: Ritesh Rastogi
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
        '7c4268dc-3a7b-4bee-a0b4-71c8285170d6',
        NULL,
        'Ritesh Rastogi',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ritesh Rastogi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7c4268dc-3a7b-4bee-a0b4-71c8285170d6',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Ritesh Rastogi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7c4268dc-3a7b-4bee-a0b4-71c8285170d6',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ritesh Rastogi (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '7c4268dc-3a7b-4bee-a0b4-71c8285170d6',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ritesh Rastogi
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7c4268dc-3a7b-4bee-a0b4-71c8285170d6',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ritesh Rastogi (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '7c4268dc-3a7b-4bee-a0b4-71c8285170d6',
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
        value_array = EXCLUDED.value_array;
    -- Player 206: Prem V
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
        '3088955d-ee31-4d35-b027-9d2eb2bf9f64',
        NULL,
        'Prem V',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Prem V
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3088955d-ee31-4d35-b027-9d2eb2bf9f64',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Prem V
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3088955d-ee31-4d35-b027-9d2eb2bf9f64',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Prem V (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3088955d-ee31-4d35-b027-9d2eb2bf9f64',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Prem V
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '3088955d-ee31-4d35-b027-9d2eb2bf9f64',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Prem V (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '3088955d-ee31-4d35-b027-9d2eb2bf9f64',
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
        value_array = EXCLUDED.value_array;
    -- Player 207: Sandeep V
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
        'cc016c58-020d-4a98-81c0-c1296fa119dd',
        NULL,
        'Sandeep V',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sandeep V
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cc016c58-020d-4a98-81c0-c1296fa119dd',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sandeep V
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cc016c58-020d-4a98-81c0-c1296fa119dd',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sandeep V (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'cc016c58-020d-4a98-81c0-c1296fa119dd',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sandeep V
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'cc016c58-020d-4a98-81c0-c1296fa119dd',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sandeep V (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'cc016c58-020d-4a98-81c0-c1296fa119dd',
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
        value_array = EXCLUDED.value_array;
    -- Player 208: Anshuman Panda
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
        'c24cb80f-cab2-4cfb-b11e-a545c4af7985',
        NULL,
        'Anshuman Panda',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Anshuman Panda
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c24cb80f-cab2-4cfb-b11e-a545c4af7985',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Anshuman Panda
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c24cb80f-cab2-4cfb-b11e-a545c4af7985',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Spin'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Anshuman Panda (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c24cb80f-cab2-4cfb-b11e-a545c4af7985',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Anshuman Panda
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'c24cb80f-cab2-4cfb-b11e-a545c4af7985',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Anshuman Panda (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'c24cb80f-cab2-4cfb-b11e-a545c4af7985',
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
        value_array = EXCLUDED.value_array;
    -- Player 209: Maan
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
        'dd83ee1b-f8f9-4dd3-ac2a-4a3e98feeb8d',
        NULL,
        'Maan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Maan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'dd83ee1b-f8f9-4dd3-ac2a-4a3e98feeb8d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Maan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'dd83ee1b-f8f9-4dd3-ac2a-4a3e98feeb8d',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Maan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'dd83ee1b-f8f9-4dd3-ac2a-4a3e98feeb8d',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Maan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'dd83ee1b-f8f9-4dd3-ac2a-4a3e98feeb8d',
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
        value_array = EXCLUDED.value_array;
    -- Player 210: Arun Kumar
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
        'd9277e95-31e3-4ec0-86ac-71ce4fa6f5d2',
        NULL,
        'Arun Kumar',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Arun Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd9277e95-31e3-4ec0-86ac-71ce4fa6f5d2',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Arun Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd9277e95-31e3-4ec0-86ac-71ce4fa6f5d2',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Arun Kumar (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'd9277e95-31e3-4ec0-86ac-71ce4fa6f5d2',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Arun Kumar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd9277e95-31e3-4ec0-86ac-71ce4fa6f5d2',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Arun Kumar (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'd9277e95-31e3-4ec0-86ac-71ce4fa6f5d2',
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
        value_array = EXCLUDED.value_array;
    -- Player 211: Rishabh Bhargav
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
        'b8605682-a19d-4295-a8fd-d4e8fdc743bb',
        NULL,
        'Rishabh Bhargav',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Rishabh Bhargav
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b8605682-a19d-4295-a8fd-d4e8fdc743bb',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Rishabh Bhargav (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b8605682-a19d-4295-a8fd-d4e8fdc743bb',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Rishabh Bhargav
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b8605682-a19d-4295-a8fd-d4e8fdc743bb',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Rishabh Bhargav (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b8605682-a19d-4295-a8fd-d4e8fdc743bb',
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
        value_array = EXCLUDED.value_array;
    -- Player 212: Lokesh
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
        '067a7076-f8e3-4bd1-932f-6206123b58d2',
        NULL,
        'Lokesh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Lokesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '067a7076-f8e3-4bd1-932f-6206123b58d2',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Lokesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '067a7076-f8e3-4bd1-932f-6206123b58d2',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Lokesh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '067a7076-f8e3-4bd1-932f-6206123b58d2',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Lokesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '067a7076-f8e3-4bd1-932f-6206123b58d2',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Lokesh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '067a7076-f8e3-4bd1-932f-6206123b58d2',
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
        value_array = EXCLUDED.value_array;
    -- Player 213: Wildcard
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
        'a65ab0e1-0c65-4490-9511-93853d899022',
        NULL,
        'Wildcard',
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
        updated_at = NOW();
    
    -- Add community skill assignment for Wildcard (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'a65ab0e1-0c65-4490-9511-93853d899022',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Wildcard
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'a65ab0e1-0c65-4490-9511-93853d899022',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '40'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Wildcard (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'a65ab0e1-0c65-4490-9511-93853d899022',
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
        value_array = EXCLUDED.value_array;
    -- Player 214: Gaurav Jha
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
        'd7f4c1be-8e51-4314-818d-e3b226d2bb69',
        NULL,
        'Gaurav Jha',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Gaurav Jha
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd7f4c1be-8e51-4314-818d-e3b226d2bb69',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Gaurav Jha (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'd7f4c1be-8e51-4314-818d-e3b226d2bb69',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Gaurav Jha
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd7f4c1be-8e51-4314-818d-e3b226d2bb69',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Gaurav Jha (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'd7f4c1be-8e51-4314-818d-e3b226d2bb69',
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
        value_array = EXCLUDED.value_array;
    -- Player 215: Pravakar
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
        'b7b9634d-d4c7-4baa-b6e2-93dacb1e049a',
        NULL,
        'Pravakar',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Pravakar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b7b9634d-d4c7-4baa-b6e2-93dacb1e049a',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Pravakar (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b7b9634d-d4c7-4baa-b6e2-93dacb1e049a',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Pravakar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b7b9634d-d4c7-4baa-b6e2-93dacb1e049a',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Pravakar (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b7b9634d-d4c7-4baa-b6e2-93dacb1e049a',
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
        value_array = EXCLUDED.value_array;
    -- Player 216: Hemanth
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
        '0b647e48-900b-47bd-ab8c-4441053ced8c',
        NULL,
        'Hemanth',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Hemanth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0b647e48-900b-47bd-ab8c-4441053ced8c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Hemanth (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0b647e48-900b-47bd-ab8c-4441053ced8c',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Hemanth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '0b647e48-900b-47bd-ab8c-4441053ced8c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Hemanth (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '0b647e48-900b-47bd-ab8c-4441053ced8c',
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
        value_array = EXCLUDED.value_array;
    -- Player 217: Nishchinth
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
        'd70ee907-e107-489a-a522-e95484d65b07',
        NULL,
        'Nishchinth',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Nishchinth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd70ee907-e107-489a-a522-e95484d65b07',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Nishchinth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd70ee907-e107-489a-a522-e95484d65b07',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Nishchinth (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'd70ee907-e107-489a-a522-e95484d65b07',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Nishchinth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'd70ee907-e107-489a-a522-e95484d65b07',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Nishchinth (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'd70ee907-e107-489a-a522-e95484d65b07',
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
        value_array = EXCLUDED.value_array;
    -- Player 218: Shadab
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
        '112fdf96-52e2-489e-911b-1a618e23e93c',
        NULL,
        'Shadab',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Shadab
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '112fdf96-52e2-489e-911b-1a618e23e93c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Shadab
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '112fdf96-52e2-489e-911b-1a618e23e93c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Shadab (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '112fdf96-52e2-489e-911b-1a618e23e93c',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Shadab
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '112fdf96-52e2-489e-911b-1a618e23e93c',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Shadab (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '112fdf96-52e2-489e-911b-1a618e23e93c',
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
        value_array = EXCLUDED.value_array;
    -- Player 219: Sudeep
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
        'a047197a-c9a8-4e6d-84f8-5aaa18cf3a7f',
        NULL,
        'Sudeep',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sudeep
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'a047197a-c9a8-4e6d-84f8-5aaa18cf3a7f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sudeep
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'a047197a-c9a8-4e6d-84f8-5aaa18cf3a7f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sudeep (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'a047197a-c9a8-4e6d-84f8-5aaa18cf3a7f',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sudeep
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'a047197a-c9a8-4e6d-84f8-5aaa18cf3a7f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sudeep (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'a047197a-c9a8-4e6d-84f8-5aaa18cf3a7f',
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
        value_array = EXCLUDED.value_array;
    -- Player 220: Gopi 
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
        '7584310f-c6b0-4101-b016-1fbba2dde2f8',
        NULL,
        'Gopi ',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Gopi 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7584310f-c6b0-4101-b016-1fbba2dde2f8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Gopi 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7584310f-c6b0-4101-b016-1fbba2dde2f8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Gopi  (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '7584310f-c6b0-4101-b016-1fbba2dde2f8',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Gopi 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '7584310f-c6b0-4101-b016-1fbba2dde2f8',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Gopi  (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '7584310f-c6b0-4101-b016-1fbba2dde2f8',
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
        value_array = EXCLUDED.value_array;
    -- Player 221: Fasil
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
        'e22a2aa8-4358-4329-a7b6-e49b36156a48',
        NULL,
        'Fasil',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Fasil
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e22a2aa8-4358-4329-a7b6-e49b36156a48',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Fasil
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e22a2aa8-4358-4329-a7b6-e49b36156a48',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Fasil (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'e22a2aa8-4358-4329-a7b6-e49b36156a48',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Fasil
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'e22a2aa8-4358-4329-a7b6-e49b36156a48',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Fasil (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'e22a2aa8-4358-4329-a7b6-e49b36156a48',
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
        value_array = EXCLUDED.value_array;
    -- Player 222: Sayyad
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
        'fdd894fa-5098-4a0f-92f0-2074e3a7c4e9',
        NULL,
        'Sayyad',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sayyad
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'fdd894fa-5098-4a0f-92f0-2074e3a7c4e9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sayyad
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'fdd894fa-5098-4a0f-92f0-2074e3a7c4e9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sayyad (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'fdd894fa-5098-4a0f-92f0-2074e3a7c4e9',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sayyad
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'fdd894fa-5098-4a0f-92f0-2074e3a7c4e9',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '100'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sayyad (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'fdd894fa-5098-4a0f-92f0-2074e3a7c4e9',
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
        value_array = EXCLUDED.value_array;
    -- Player 223: Siddharth
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
        '2e36e146-4b93-4cf8-8507-b2d16e28ad2f',
        NULL,
        'Siddharth',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Siddharth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2e36e146-4b93-4cf8-8507-b2d16e28ad2f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Siddharth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2e36e146-4b93-4cf8-8507-b2d16e28ad2f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Siddharth (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '2e36e146-4b93-4cf8-8507-b2d16e28ad2f',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Siddharth
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '2e36e146-4b93-4cf8-8507-b2d16e28ad2f',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Siddharth (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '2e36e146-4b93-4cf8-8507-b2d16e28ad2f',
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
        value_array = EXCLUDED.value_array;
    -- Player 224: Sandipt Singh
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
        '927197d3-d5f7-48f6-8caf-4d458edf05e1',
        NULL,
        'Sandipt Singh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sandipt Singh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '927197d3-d5f7-48f6-8caf-4d458edf05e1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sandipt Singh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '927197d3-d5f7-48f6-8caf-4d458edf05e1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sandipt Singh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '927197d3-d5f7-48f6-8caf-4d458edf05e1',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sandipt Singh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '927197d3-d5f7-48f6-8caf-4d458edf05e1',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sandipt Singh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '927197d3-d5f7-48f6-8caf-4d458edf05e1',
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
        value_array = EXCLUDED.value_array;
    -- Player 225: Raju VRA
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
        '8d080210-a26a-415d-a6f8-010526207ce2',
        NULL,
        'Raju VRA',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Raju VRA
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8d080210-a26a-415d-a6f8-010526207ce2',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Raju VRA
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8d080210-a26a-415d-a6f8-010526207ce2',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Raju VRA (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8d080210-a26a-415d-a6f8-010526207ce2',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Raju VRA
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '8d080210-a26a-415d-a6f8-010526207ce2',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Raju VRA (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '8d080210-a26a-415d-a6f8-010526207ce2',
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
        value_array = EXCLUDED.value_array;
    -- Player 226: Harthik
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
        '39360290-2c5b-47bb-8ccb-e9dec0e8f0e7',
        NULL,
        'Harthik',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Harthik
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '39360290-2c5b-47bb-8ccb-e9dec0e8f0e7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Harthik
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '39360290-2c5b-47bb-8ccb-e9dec0e8f0e7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Harthik (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '39360290-2c5b-47bb-8ccb-e9dec0e8f0e7',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Harthik
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '39360290-2c5b-47bb-8ccb-e9dec0e8f0e7',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Harthik (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '39360290-2c5b-47bb-8ccb-e9dec0e8f0e7',
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
        value_array = EXCLUDED.value_array;
    -- Player 227: Ashim 
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
        'f7af4dd7-5843-48ea-9292-240605d38be0',
        NULL,
        'Ashim ',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ashim 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'f7af4dd7-5843-48ea-9292-240605d38be0',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Ashim 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'f7af4dd7-5843-48ea-9292-240605d38be0',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ashim  (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'f7af4dd7-5843-48ea-9292-240605d38be0',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ashim 
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'f7af4dd7-5843-48ea-9292-240605d38be0',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ashim  (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'f7af4dd7-5843-48ea-9292-240605d38be0',
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
        value_array = EXCLUDED.value_array;
    -- Player 228: Raghul Kannan
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
        '42149739-db52-4935-bef7-5ad867f78fb4',
        NULL,
        'Raghul Kannan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Raghul Kannan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '42149739-db52-4935-bef7-5ad867f78fb4',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Raghul Kannan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '42149739-db52-4935-bef7-5ad867f78fb4',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Raghul Kannan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '42149739-db52-4935-bef7-5ad867f78fb4',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Raghul Kannan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '42149739-db52-4935-bef7-5ad867f78fb4',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Raghul Kannan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '42149739-db52-4935-bef7-5ad867f78fb4',
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
        value_array = EXCLUDED.value_array;
    -- Player 229: Ausaf Khan
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
        'da2e7367-be50-45d9-90e7-238ba452f002',
        NULL,
        'Ausaf Khan',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ausaf Khan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'da2e7367-be50-45d9-90e7-238ba452f002',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Ausaf Khan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'da2e7367-be50-45d9-90e7-238ba452f002',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ausaf Khan (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'da2e7367-be50-45d9-90e7-238ba452f002',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ausaf Khan
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'da2e7367-be50-45d9-90e7-238ba452f002',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ausaf Khan (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'da2e7367-be50-45d9-90e7-238ba452f002',
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
        value_array = EXCLUDED.value_array;
    -- Player 230: Yajnesh
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
        '37df2852-4ea0-4335-998c-a7c418c4a345',
        NULL,
        'Yajnesh',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Yajnesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '37df2852-4ea0-4335-998c-a7c418c4a345',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Yajnesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '37df2852-4ea0-4335-998c-a7c418c4a345',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Yajnesh (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '37df2852-4ea0-4335-998c-a7c418c4a345',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Yajnesh
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '37df2852-4ea0-4335-998c-a7c418c4a345',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Yajnesh (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '37df2852-4ea0-4335-998c-a7c418c4a345',
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
        value_array = EXCLUDED.value_array;
    -- Player 231: Harikrishna
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
        '61422569-e475-4b16-add1-f09432a99102',
        NULL,
        'Harikrishna',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Harikrishna
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '61422569-e475-4b16-add1-f09432a99102',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Harikrishna
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '61422569-e475-4b16-add1-f09432a99102',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Harikrishna (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '61422569-e475-4b16-add1-f09432a99102',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Harikrishna
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '61422569-e475-4b16-add1-f09432a99102',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Harikrishna (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '61422569-e475-4b16-add1-f09432a99102',
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
        value_array = EXCLUDED.value_array;
    -- Player 232: Ashirbad
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
        '5ea3d3e2-a4f2-426a-a909-b02174261b53',
        NULL,
        'Ashirbad',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Ashirbad
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '5ea3d3e2-a4f2-426a-a909-b02174261b53',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Ashirbad (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '5ea3d3e2-a4f2-426a-a909-b02174261b53',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Ashirbad
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '5ea3d3e2-a4f2-426a-a909-b02174261b53',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Ashirbad (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '5ea3d3e2-a4f2-426a-a909-b02174261b53',
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
        value_array = EXCLUDED.value_array;
    -- Player 233: Abhilash K
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
        '9a20dd0e-2e52-4e07-8da6-a9ce9f646436',
        NULL,
        'Abhilash K',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Abhilash K
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9a20dd0e-2e52-4e07-8da6-a9ce9f646436',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Abhilash K
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9a20dd0e-2e52-4e07-8da6-a9ce9f646436',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Abhilash K (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9a20dd0e-2e52-4e07-8da6-a9ce9f646436',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Abhilash K
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '9a20dd0e-2e52-4e07-8da6-a9ce9f646436',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Abhilash K (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '9a20dd0e-2e52-4e07-8da6-a9ce9f646436',
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
        value_array = EXCLUDED.value_array;
    -- Player 234: Prabash
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
        '21135bd6-8ca3-4153-9895-9946ecb61070',
        NULL,
        'Prabash',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Prabash
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '21135bd6-8ca3-4153-9895-9946ecb61070',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Prabash
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '21135bd6-8ca3-4153-9895-9946ecb61070',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Prabash (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '21135bd6-8ca3-4153-9895-9946ecb61070',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Prabash
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '21135bd6-8ca3-4153-9895-9946ecb61070',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Prabash (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '21135bd6-8ca3-4153-9895-9946ecb61070',
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
        value_array = EXCLUDED.value_array;
    -- Player 235: Sagar
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
        'b30a0a4b-266a-4b3f-b143-ed030c4b1301',
        NULL,
        'Sagar',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Sagar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b30a0a4b-266a-4b3f-b143-ed030c4b1301',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Sagar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b30a0a4b-266a-4b3f-b143-ed030c4b1301',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Sagar (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b30a0a4b-266a-4b3f-b143-ed030c4b1301',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Sagar
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        'b30a0a4b-266a-4b3f-b143-ed030c4b1301',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Sagar (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        'b30a0a4b-266a-4b3f-b143-ed030c4b1301',
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
        value_array = EXCLUDED.value_array;
    -- Player 236: Abhishek
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
        '6e2f6209-061c-4c09-9002-ab4ea64e2000',
        NULL,
        'Abhishek',
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
        updated_at = NOW();
    
    -- Add batting style skill assignment for Abhishek
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6e2f6209-061c-4c09-9002-ab4ea64e2000',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Batting Style'
    AND psv.value_name = 'Right Hand Batter'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add bowling style skill assignment for Abhishek
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6e2f6209-061c-4c09-9002-ab4ea64e2000',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Bowling Style'
    AND psv.value_name = 'Right Arm Medium'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add community skill assignment for Abhishek (iBlitz)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '6e2f6209-061c-4c09-9002-ab4ea64e2000',
        ps.id,
        ARRAY[
            (SELECT id FROM player_skill_values WHERE skill_id = ps.id AND value_name = 'iBlitz')
        ],
        ARRAY['iBlitz']
    FROM player_skills ps
    WHERE ps.skill_name = 'Community'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_ids = EXCLUDED.skill_value_ids,
        value_array = EXCLUDED.value_array;
    
    -- Add base price skill assignment for Abhishek
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_id)
    SELECT 
        '6e2f6209-061c-4c09-9002-ab4ea64e2000',
        ps.id,
        psv.id
    FROM player_skills ps
    JOIN player_skill_values psv ON ps.id = psv.skill_id
    WHERE ps.skill_name = 'Base Price'
    AND psv.value_name = '60'
    ON CONFLICT (player_id, skill_id) DO UPDATE SET
        skill_value_id = EXCLUDED.skill_value_id;
    
    -- Add role skill assignment for Abhishek (Batter and Bowler)
    INSERT INTO player_skill_assignments (player_id, skill_id, skill_value_ids, value_array)
    SELECT 
        '6e2f6209-061c-4c09-9002-ab4ea64e2000',
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
        value_array = EXCLUDED.value_array;
    
    RAISE NOTICE 'Player import completed successfully!';
    RAISE NOTICE 'Total players processed: 236';
    
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
