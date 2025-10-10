import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'

async function getHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    // User is already authenticated by withAuth middleware
    const userData = user

    // Fetch players from database using service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: false })

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
      data: data || [],
      message: 'Players fetched successfully'
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch players',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function postHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    // User is already authenticated by withAuth middleware
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.status !== 'approved') {
      return NextResponse.json({ 
        success: false, 
        error: 'User not approved for creating player profile' 
      }, { status: 403 })
    }

    // Check if user has permission to create players
    // Only admins and hosts can create players through this endpoint
    if (user.role !== 'admin' && user.role !== 'host') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only admins and hosts can create players. Use your profile page to create your own player profile.' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { 
      display_name, 
      bio, 
      profile_pic_url, 
      mobile_number,
      skills // This will be an object with skill assignments
    } = body

    // Validate required fields
    if (!display_name) {
      return NextResponse.json({
        success: false,
        error: 'Player display name is required'
      }, { status: 400 })
    }

    // Create player profile (only basic info)
    const { data: player, error } = await supabase
      .from('players')
      .insert({
        display_name,
        bio: bio || null,
        profile_pic_url: profile_pic_url || null,
        mobile_number: mobile_number || null,
        status: 'approved', // Admin-created players are auto-approved
        created_by: user.id // Track who created this player
      })
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

async function putHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    // User is already authenticated by withAuth middleware
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.status !== 'approved') {
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

    if (!existingPlayer || existingPlayer.user_id !== user.id) {
      return NextResponse.json({
        success: false,
        error: 'You can only update your own player profile'
      }, { status: 403 })
    }

    // Update player profile (only basic info)
    const { data: updatedPlayer, error } = await supabase
      .from('players')
      .update({
        display_name,
        bio: bio || null,
        profile_pic_url: profile_pic_url || null
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
      data: updatedPlayer,
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

// Export the handlers with analytics
export const GET = withAnalytics(withAuth(getHandler, ['viewer', 'host', 'admin']))
export const POST = withAnalytics(withAuth(postHandler, ['viewer', 'host', 'admin']))
export const PUT = withAnalytics(withAuth(putHandler, ['viewer', 'host', 'admin']))
