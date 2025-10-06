import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get user role from authorization header if available
    let userRole = 'viewer' // Default to viewer
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      try {
        const userData = JSON.parse(authHeader)
        if (userData && userData.role) {
          userRole = userData.role
        }
      } catch (error) {
        // If parsing fails, keep default viewer role
        console.log('Could not parse authorization header, using viewer role')
      }
    }

    console.log('User role for skill filtering:', userRole)

    // Fetch specific player with skill assignments using service role (bypasses RLS)
    // GET requests are public - no authentication required for viewing
    const { data: player, error } = await supabase
      .from('players')
      .select(`
        *,
        player_skill_assignments (
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
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    if (!player) {
      return NextResponse.json({
        success: false,
        error: 'Player not found'
      }, { status: 404 })
    }

    // Transform the data to match the expected interface
    const skills: { [key: string]: any } = {}
    
    console.log('Player skill assignments:', player.player_skill_assignments)
    
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
              console.log('Skipping skill for viewer:', skillName)
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

    // Map to the expected interface
    const transformedPlayer = {
      id: player.id,
      display_name: player.display_name,
      bio: player.bio,
      profile_pic_url: player.profile_pic_url,
      mobile_number: player.mobile_number,
      created_at: player.created_at,
      updated_at: player.updated_at,
      // Include filtered skills for detailed view
      skills: skills
    }

    return NextResponse.json({
      success: true,
      data: transformedPlayer,
      message: 'Player fetched successfully'
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch player',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    let userData
    try {
      userData = JSON.parse(authHeader)
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid authorization header' }, { status: 401 })
    }

    if (!userData || !userData.id) {
      return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 })
    }

    // Check if user has permission to update players (admin or host)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userData.id)
      .single()

    if (userError || !user || user.status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'User not approved for updating players'
      }, { status: 403 })
    }

    if (user.role !== 'admin' && user.role !== 'host') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only admins and hosts can update players' 
      }, { status: 403 })
    }

    const body = await request.json()
    console.log('=== API /api/players/[id] PUT - RECEIVING DATA ===')
    console.log('Received data in API:', body)
    console.log('Skills received:', body.skills)
    console.log('Skills keys received:', Object.keys(body.skills || {}))
    console.log('Skills values received:', Object.values(body.skills || {}))
    
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
        error: 'Display name is required'
      }, { status: 400 })
    }

    // Update player profile (only basic info)
    const { data: player, error } = await supabase
      .from('players')
      .update({
        display_name,
        bio: bio || null,
        profile_pic_url: profile_pic_url || null,
        mobile_number: mobile_number || null,
        base_price: base_price ? Number(base_price) : 0,
        updated_at: new Date().toISOString()
      })
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

    if (!player) {
      return NextResponse.json({
        success: false,
        error: 'Player not found'
      }, { status: 404 })
    }

    // Handle skill assignments if provided
    if (skills && Object.keys(skills).length > 0) {
      console.log('Processing skills:', skills)
      
      // Delete existing skill assignments for this player
      await supabase
        .from('player_skill_assignments')
        .delete()
        .eq('player_id', id)

      // Insert new skill assignments
      for (const [skillName, skillValue] of Object.entries(skills)) {
        console.log(`Processing skill: ${skillName} = ${skillValue}`)
        // Get the skill ID
        const { data: skillData } = await supabase
          .from('player_skills')
          .select('id')
          .eq('skill_name', skillName)
          .single()

        if (!skillData) {
          console.warn(`Skill "${skillName}" not found in database`)
          continue
        }

        const skillId = skillData.id

        if (Array.isArray(skillValue)) {
          // Multi-select skill
          if (skillValue.length > 0) {
            // Get skill value IDs
            const { data: skillValues } = await supabase
              .from('player_skill_values')
              .select('id')
              .in('value_name', skillValue)
              .eq('skill_id', skillId)

            if (skillValues && skillValues.length > 0) {
              const skillValueIds = skillValues.map(sv => sv.id)
              
              const { error: insertError } = await supabase
                .from('player_skill_assignments')
                .insert({
                  player_id: id,
                  skill_id: skillId,
                  skill_value_ids: skillValueIds,
                  value_array: skillValue
                })
              
              if (insertError) {
                console.error(`Error inserting multi-select skill ${skillName}:`, insertError)
              } else {
                console.log(`Successfully inserted multi-select skill ${skillName}:`, skillValue)
              }
            }
          }
        } else {
          // Single-select skill
          if (skillValue) {
            // Get skill value ID
            const { data: skillValueData } = await supabase
              .from('player_skill_values')
              .select('id')
              .eq('value_name', skillValue)
              .eq('skill_id', skillId)
              .single()

            if (skillValueData) {
              const { error: insertError } = await supabase
                .from('player_skill_assignments')
                .insert({
                  player_id: id,
                  skill_id: skillId,
                  skill_value_id: skillValueData.id,
                  value_array: [skillValue]
                })
              
              if (insertError) {
                console.error(`Error inserting single-select skill ${skillName}:`, insertError)
              } else {
                console.log(`Successfully inserted single-select skill ${skillName}:`, skillValue)
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: player,
      message: 'Player updated successfully'
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update player',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    let userData
    try {
      userData = JSON.parse(authHeader)
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid authorization header' }, { status: 401 })
    }

    if (!userData || !userData.id) {
      return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 })
    }

    // Check if user has permission to delete players (admin only)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userData.id)
      .single()

    if (userError || !user || user.status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'User not approved for deleting players'
      }, { status: 403 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only admins can delete players' 
      }, { status: 403 })
    }

    // Delete player
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Player deleted successfully'
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete player',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
