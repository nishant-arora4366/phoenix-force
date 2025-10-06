import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Parse user data from authorization header
    let userData
    try {
      userData = JSON.parse(authHeader)
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid authorization header' }, { status: 401 })
    }

    if (!userData || !userData.id) {
      return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user's player profile
    console.log('=== API /api/player-profile GET - QUERYING DATABASE ===')
    console.log('Looking for player with user_id:', userData.id)
    
    // First, let's get the player without skill assignments to see if the player exists
    const { data: playerBasic, error: playerBasicError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userData.id)
      .single()
    
    console.log('Basic player query result:', { playerBasic, playerBasicError })
    
    if (playerBasicError || !playerBasic) {
      console.log('No player found for user_id:', userData.id)
      return NextResponse.json({ 
        success: true, 
        profile: null,
        message: 'No player profile found'
      })
    }
    
    // Now get the skill assignments separately
    const { data: skillAssignments, error: skillError } = await supabase
      .from('player_skill_assignments')
      .select(`
        id,
        skill_value_id,
        skill_value_ids,
        value_array,
        player_skills (
          id,
          skill_name,
          skill_type,
          is_required,
          display_order,
          is_admin_managed,
          viewer_can_see
        ),
        player_skill_values (
          id,
          value_name,
          display_order
        )
      `)
      .eq('player_id', playerBasic.id)
    
    console.log('Skill assignments query result:', { skillAssignments, skillError })
    
    // Combine the results
    const player = {
      ...playerBasic,
      player_skill_assignments: skillAssignments || []
    }
    
    console.log('Database query result:', { player })
    console.log('Player found:', !!player)
    console.log('Player ID from database:', player?.id)
    console.log('Number of skill assignments found:', skillAssignments?.length || 0)

    // Format skills data with filtering based on user role and visibility
    const skills: { [key: string]: string | string[] } = {}
    const userRole = userData.role || 'viewer'
    
    console.log('=== API /api/player-profile GET - FETCHING DATA ===')
    console.log('Player skill assignments:', player.player_skill_assignments)
    console.log('User role for skill filtering in player profile:', userRole)
    console.log('Player ID:', player.id)
    console.log('User ID:', userData.id)
    console.log('Number of skill assignments:', player.player_skill_assignments?.length || 0)
    
    if (player.player_skill_assignments) {
      for (const assignment of player.player_skill_assignments) {
        const skillName = assignment.player_skills?.skill_name
        const isAdminManaged = assignment.player_skills?.is_admin_managed
        const viewerCanSee = assignment.player_skills?.viewer_can_see
        
        console.log('Processing skill:', skillName, 'Type:', assignment.player_skills?.skill_type, 'Admin managed:', isAdminManaged, 'Viewer can see:', viewerCanSee)
        
        // Filter skills based on user role and visibility
        if (skillName) {
          // If user is admin or host, show all skills
          if (userRole === 'admin' || userRole === 'host') {
            // Show all skills for admins and hosts
          } else {
            // For viewers, only show skills that viewers can see
            if (viewerCanSee !== true) {
              console.log('Skipping skill for viewer in player profile:', skillName)
              continue
            }
          }
          
          if (assignment.player_skills?.skill_type === 'multiselect') {
            // For multiselect, use the value_array
            skills[skillName] = assignment.value_array || []
            console.log('Multiselect skill value:', skills[skillName])
          } else {
            // For single select, use the skill_value_id to get the value
            if (assignment.player_skill_values) {
              skills[skillName] = assignment.player_skill_values.value_name
              console.log('Single select skill value:', skills[skillName])
            }
          }
        }
      }
    }
    
    console.log('Formatted skills after filtering:', skills)
    console.log('Final skills keys:', Object.keys(skills))
    console.log('Final skills values:', Object.values(skills))
    console.log('Number of final skills:', Object.keys(skills).length)

    // Remove the skill assignments from the response
    const { player_skill_assignments, ...profileData } = player

    console.log('=== API /api/player-profile GET - RETURNING DATA ===')
    console.log('Returning profile:', profileData)
    console.log('Returning skills:', skills)

    return NextResponse.json({
      success: true,
      profile: profileData,
      skills
    })

  } catch (error: any) {
    console.error('Error in player profile GET API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Parse user data from authorization header
    let userData
    try {
      userData = JSON.parse(authHeader)
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid authorization header' }, { status: 401 })
    }

    if (!userData || !userData.id) {
      return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 })
    }

    // Check if user has permission to create their own player profile
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userData.id)
      .single()

    if (userError || !user || user.status !== 'approved') {
      return NextResponse.json({ 
        success: false, 
        error: 'User not approved for creating player profile' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { 
      display_name, 
      bio, 
      profile_pic_url, 
      mobile_number,
      base_price,
      skills // This will be an object with skill assignments
    } = body

    // Validate required fields
    if (!display_name) {
      return NextResponse.json({
        success: false,
        error: 'Player display name is required'
      }, { status: 400 })
    }

    // Check if user already has a player profile
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', userData.id)
      .single()

    if (existingPlayer) {
      return NextResponse.json({
        success: false,
        error: 'User already has a player profile'
      }, { status: 400 })
    }

    // Create player profile (only basic info)
    const insertData: any = {
      user_id: userData.id,
      display_name,
      bio: bio || null,
      profile_pic_url: profile_pic_url || null,
      mobile_number: mobile_number || null,
      status: 'pending' // User-created profiles need admin approval
    }

    // Only include base_price for admins and hosts
    if ((user.role === 'admin' || user.role === 'host') && base_price !== undefined) {
      insertData.base_price = base_price || 0
    }

    const { data: player, error } = await supabase
      .from('players')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    // Handle skill assignments if provided
    if (skills && Object.keys(skills).length > 0) {
      // Get all player skills to map skill names to IDs
      const { data: playerSkills } = await supabase
        .from('player_skills')
        .select('id, skill_name')

      const skillIdMap: { [key: string]: string } = {}
      playerSkills?.forEach(skill => {
        skillIdMap[skill.skill_name.toLowerCase().replace(' ', '_')] = skill.id
      })

      // Create skill assignments
      for (const [skillKey, skillValue] of Object.entries(skills)) {
        if (skillValue && skillIdMap[skillKey]) {
          const skillId = skillIdMap[skillKey]
          
          // Check if this is a multi-select skill (array of values)
          if (Array.isArray(skillValue)) {
            // Multi-select: store array of skill value IDs
            const skillValueIds: string[] = []
            const valueArray: string[] = []
            
            for (const value of skillValue) {
              const { data: skillValueData } = await supabase
                .from('player_skill_values')
                .select('id')
                .eq('skill_id', skillId)
                .eq('value_name', value)
                .single()
              
              if (skillValueData) {
                skillValueIds.push(skillValueData.id)
                valueArray.push(value)
              }
            }
            
            if (skillValueIds.length > 0) {
              await supabase
                .from('player_skill_assignments')
                .insert({
                  player_id: player.id,
                  skill_id: skillId,
                  skill_value_ids: skillValueIds,
                  value_array: valueArray
                })
            }
          } else {
            // Single select: store single skill value ID
            const { data: skillValueData } = await supabase
              .from('player_skill_values')
              .select('id')
              .eq('skill_id', skillId)
              .eq('value_name', skillValue)
              .single()

            if (skillValueData) {
              await supabase
                .from('player_skill_assignments')
                .insert({
                  player_id: player.id,
                  skill_id: skillId,
                  skill_value_id: skillValueData.id,
                  value_array: [skillValue]
                })
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: player,
      message: 'Player profile created successfully'
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create player profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Parse user data from authorization header
    let userData
    try {
      userData = JSON.parse(authHeader)
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid authorization header' }, { status: 401 })
    }

    if (!userData || !userData.id) {
      return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 })
    }

    // Check user role and status
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userData.id)
      .single()

    if (userError || !user || user.status !== 'approved') {
      return NextResponse.json({ 
        success: false, 
        error: 'User not approved' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { 
      id,
      display_name, 
      bio, 
      profile_pic_url, 
      mobile_number,
      base_price,
      user_id,
      skills // This will be an object with skill assignments
    } = body

    // Validate required fields
    if (!display_name || !id) {
      return NextResponse.json({
        success: false,
        error: 'Player display name and ID are required'
      }, { status: 400 })
    }

    // Check if user owns this player profile
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existingPlayer || existingPlayer.user_id !== userData.id) {
      return NextResponse.json({
        success: false,
        error: 'You can only update your own player profile'
      }, { status: 403 })
    }

    // Update player profile (only basic info)
    const updateData: any = {
      display_name,
      bio: bio || null,
      profile_pic_url: profile_pic_url || null,
      mobile_number: mobile_number || null
    }

    // Only include base_price for admins and hosts
    if ((user.role === 'admin' || user.role === 'host') && base_price !== undefined) {
      updateData.base_price = base_price || 0
    }

    const { data: player, error } = await supabase
      .from('players')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    // Handle skill assignments if provided
    if (skills && Object.keys(skills).length > 0) {
      // Delete existing skill assignments for this player
      await supabase
        .from('player_skill_assignments')
        .delete()
        .eq('player_id', id)

      // Get all player skills to map skill names to IDs
      const { data: playerSkills } = await supabase
        .from('player_skills')
        .select('id, skill_name')

      const skillIdMap: { [key: string]: string } = {}
      playerSkills?.forEach(skill => {
        skillIdMap[skill.skill_name.toLowerCase().replace(' ', '_')] = skill.id
      })

      // Create new skill assignments
      for (const [skillKey, skillValue] of Object.entries(skills)) {
        if (skillValue && skillIdMap[skillKey]) {
          // Find the skill value ID
          const { data: skillValues } = await supabase
            .from('player_skill_values')
            .select('id')
            .eq('skill_id', skillIdMap[skillKey])
            .eq('value_name', skillValue)
            .single()

          if (skillValues) {
            await supabase
              .from('player_skill_assignments')
              .insert({
                player_id: id,
                skill_id: skillIdMap[skillKey],
                skill_value_id: skillValues.id
              })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: player,
      message: 'Player profile updated successfully'
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update player profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
