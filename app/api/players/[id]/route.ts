import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get user role from authorization header if available (optional for public endpoint)
    let userRole = 'viewer' // Default to viewer
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // JWT token is present - try to decode it (for skill visibility filtering)
      // For now, default to viewer unless we add JWT decoding
      // TODO: Add proper JWT decoding if role-based skill filtering is needed
      userRole = 'viewer'
    }


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
    
    
    if (player.player_skill_assignments) {
      for (const assignment of player.player_skill_assignments) {
        const skillName = assignment.player_skills?.skill_name
        const isAdminManaged = assignment.player_skills?.is_admin_managed
        const viewerCanSee = assignment.player_skills?.viewer_can_see
        
        
        // Filter skills based on user role and visibility
        if (skillName) {
          // If user is admin or host, show all skills
          if (userRole === 'admin' || userRole === 'host') {
            // Show all skills for admins and hosts
          } else {
            // For viewers, only show skills that viewers can see
            if (viewerCanSee !== true) {
              continue
            }
          }
          
          if (assignment.player_skills?.skill_type === 'multiselect') {
            // For multiselect, use the value_array
            skills[skillName] = assignment.value_array || []
          } else {
            // For single select, use the skill_value_id to get the value
            if (assignment.player_skill_values) {
              skills[skillName] = assignment.player_skill_values.value_name
            }
          }
        }
      }
    }
    

    // Map to the expected interface
    const transformedPlayer = {
      id: player.id,
      display_name: player.display_name,
      bio: player.bio,
      profile_pic_url: player.profile_pic_url,
      mobile_number: player.mobile_number,
      created_at: player.created_at,
      updated_at: player.updated_at,
      user_id: player.user_id, // Include user_id for navigation logic
      created_by: player.created_by, // Include created_by for access control
      // Include filtered skills for detailed view
      skills: skills
    }

    return NextResponse.json({
      success: true,
      data: transformedPlayer,
      message: 'Player fetched successfully'
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch player',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function putHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if user has permission to update players
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'User not approved for updating players'
      }, { status: 403 })
    }

    // Get the player to check ownership
    const { data: existingPlayer, error: playerError } = await supabase
      .from('players')
      .select('created_by, user_id')
      .eq('id', id)
      .single()

    if (playerError || !existingPlayer) {
      return NextResponse.json({
        success: false,
        error: 'Player not found'
      }, { status: 404 })
    }

    // Access control logic:
    // 1. Admin has all access
    // 2. Host can only edit players they created (created_by = user.id)
    // 3. Regular users can only edit their own profile (user_id = user.id)
    if (userData.role === 'admin') {
      // Admin has full access - no additional checks needed
    } else if (userData.role === 'host') {
      // Host can only edit players they created
      if (existingPlayer.created_by !== user.id) {
        return NextResponse.json({
          success: false,
          error: 'You can only edit players you created'
        }, { status: 403 })
      }
    } else if (userData.role === 'user') {
      // Regular users can only edit their own profile
      if (existingPlayer.user_id !== user.id) {
        return NextResponse.json({
          success: false,
          error: 'You can only edit your own profile'
        }, { status: 403 })
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to update players'
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
        error: 'Display name is required'
      }, { status: 400 })
    }

    // Update player profile (only basic info)
    const { data: updatedPlayer, error } = await supabase
      .from('players')
      .update({
        display_name,
        bio: bio || null,
        profile_pic_url: profile_pic_url || null,
        mobile_number: mobile_number || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    if (!updatedPlayer) {
      return NextResponse.json({
        success: false,
        error: 'Player not found'
      }, { status: 404 })
    }

    // Handle skill assignments if provided
    if (skills && Object.keys(skills).length > 0) {
      // Delete existing skill assignments for this player
      await supabase
        .from('player_skill_assignments')
        .delete()
        .eq('player_id', id)

      // Insert new skill assignments
      for (const [skillName, skillValue] of Object.entries(skills)) {
        // Get the skill ID
        const { data: skillData } = await supabase
          .from('player_skills')
          .select('id')
          .eq('skill_name', skillName)
          .single()

        if (!skillData) {
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
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedPlayer,
      message: 'Player updated successfully'
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to update player',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function deleteHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if user has permission to delete players
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'User not approved for deleting players'
      }, { status: 403 })
    }

    // Get the player to check ownership
    const { data: playerToDelete, error: playerError } = await supabase
      .from('players')
      .select('created_by, user_id')
      .eq('id', id)
      .single()

    if (playerError || !playerToDelete) {
      return NextResponse.json({
        success: false,
        error: 'Player not found'
      }, { status: 404 })
    }

    // Access control logic:
    // 1. Admin has all access
    // 2. Host can only delete players they created (created_by = user.id)
    // 3. Regular users can only delete their own profile (user_id = user.id)
    if (userData.role === 'admin') {
      // Admin has full access - no additional checks needed
    } else if (userData.role === 'host') {
      // Host can only delete players they created
      if (playerToDelete.created_by !== user.id) {
        return NextResponse.json({
          success: false,
          error: 'You can only delete players you created'
        }, { status: 403 })
      }
    } else if (userData.role === 'user') {
      // Regular users can only delete their own profile
      if (playerToDelete.user_id !== user.id) {
        return NextResponse.json({
          success: false,
          error: 'You can only delete your own profile'
        }, { status: 403 })
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to delete players'
      }, { status: 403 })
    }

    // Delete player
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id)

    if (error) {
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
    return NextResponse.json({
      success: false,
      error: 'Failed to delete player',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Wrapper functions to match middleware expectations
async function putWrapper(request: NextRequest, user: AuthenticatedUser) {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) {
    return NextResponse.json({ success: false, error: 'Player ID required' }, { status: 400 })
  }
  return putHandler(request, user, { params: Promise.resolve({ id }) })
}

async function deleteWrapper(request: NextRequest, user: AuthenticatedUser) {
  const url = new URL(request.url)
  const id = url.pathname.split('/').pop()
  if (!id) {
    return NextResponse.json({ success: false, error: 'Player ID required' }, { status: 400 })
  }
  return deleteHandler(request, user, { params: Promise.resolve({ id }) })
}

// Export the handlers with analytics
export const GET = getHandler
export const PUT = withAnalytics(withAuth(putWrapper, ['viewer', 'host', 'admin']))
export const DELETE = withAnalytics(withAuth(deleteWrapper, ['viewer', 'host', 'admin']))
