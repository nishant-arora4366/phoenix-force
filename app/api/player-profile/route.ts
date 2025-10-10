import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'

async function getHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user's player profile
    // First, let's get the player without skill assignments to see if the player exists
    const { data: playerBasic, error: playerBasicError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (playerBasicError) {
      console.error('Error fetching player profile:', playerBasicError)
      return NextResponse.json({ 
        success: false, 
        error: 'Database error while fetching player profile'
      }, { status: 500 })
    }
    
    if (!playerBasic) {
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
    
    if (skillError) {
      console.error('Error fetching skill assignments:', skillError)
      return NextResponse.json({ 
        success: false, 
        error: 'Database error while fetching skill assignments'
      }, { status: 500 })
    }
    
    // Combine the results
    const player = {
      ...playerBasic,
      player_skill_assignments: skillAssignments || []
    }

    // Format skills data with filtering based on user role and visibility
    const skills: { [key: string]: string | string[] } = {}
    const userRole = user.role || 'viewer'

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
    
    // Remove the skill assignments from the response
    const { player_skill_assignments, ...profileData } = player

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

async function postHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    // Check if user has permission to create their own player profile
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Users should be able to create their player profile regardless of approval status
    // The player profile itself will have a status that requires admin approval
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
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
      .eq('user_id', user.id)
      .single()

    if (existingPlayer) {
      return NextResponse.json({
        success: false,
        error: 'User already has a player profile'
      }, { status: 400 })
    }

    // Create player profile (only basic info)
    const insertData: any = {
      user_id: user.id,
      display_name,
      bio: bio || null,
      profile_pic_url: profile_pic_url || null,
      mobile_number: mobile_number || null,
      status: 'pending', // User-created profiles need admin approval
      created_by: user.id // Track who created this player
    }

    // Only include base_price for admins and hosts
    if ((userData.role === 'admin' || userData.role === 'host') && base_price !== undefined) {
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
      // Get all player skills to map skill names to IDs and check admin-managed status
      const { data: playerSkills } = await supabase
        .from('player_skills')
        .select('id, skill_name, is_admin_managed')

      const skillIdMap: { [key: string]: string } = {}
      const adminManagedSkills: { [key: string]: boolean } = {}
      playerSkills?.forEach(skill => {
        // Use the exact skill name as the key (matching frontend)
        skillIdMap[skill.skill_name] = skill.id
        adminManagedSkills[skill.skill_name] = skill.is_admin_managed || false
      })

      // Check if user is trying to set admin-managed skills during creation
      const userRole = user.role || 'viewer'
      if (userRole !== 'admin' && userRole !== 'host') {
        for (const skillKey of Object.keys(skills)) {
          if (adminManagedSkills[skillKey]) {
            return NextResponse.json({
              success: false,
              error: `You are not authorized to set the '${skillKey}' skill during profile creation. This skill is managed by administrators.`
            }, { status: 403 })
          }
        }
      }

      // Create skill assignments
      for (const [skillKey, skillValue] of Object.entries(skills)) {
        if (skillValue && skillIdMap[skillKey]) {
          const skillId = skillIdMap[skillKey]
          
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
                    player_id: player.id,
                    skill_id: skillId,
                    skill_value_ids: skillValueIds,
                    value_array: skillValue
                  })
                
                if (insertError) {
                  console.error(`Error inserting multi-select skill ${skillKey}:`, insertError)
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
                    player_id: player.id,
                    skill_id: skillId,
                    skill_value_id: skillValueData.id,
                    value_array: [skillValue]
                  })
                
                if (insertError) {
                  console.error(`Error inserting single-select skill ${skillKey}:`, insertError)
                }
              }
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
    // Check user role and status
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Users should be able to update their player profile regardless of approval status
    // The player profile itself will have a status that requires admin approval
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 })
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

    if (!existingPlayer || existingPlayer.user_id !== user.id) {
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
    if ((userData.role === 'admin' || userData.role === 'host') && base_price !== undefined) {
      updateData.base_price = base_price || 0
    }

    const { data: updatedPlayer, error } = await supabase
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

      // Get all player skills to map skill names to IDs and check admin-managed status
      const { data: playerSkills } = await supabase
        .from('player_skills')
        .select('id, skill_name, is_admin_managed')

      const skillIdMap: { [key: string]: string } = {}
      const adminManagedSkills: { [key: string]: boolean } = {}
      playerSkills?.forEach(skill => {
        // Use the exact skill name as the key (matching frontend)
        skillIdMap[skill.skill_name] = skill.id
        adminManagedSkills[skill.skill_name] = skill.is_admin_managed || false
      })

      // Check if user is trying to modify admin-managed skills
      const userRole = user.role || 'viewer'
      if (userRole !== 'admin' && userRole !== 'host') {
        // Get current skill assignments to compare with new values
        const { data: currentAssignments } = await supabase
          .from('player_skill_assignments')
          .select(`
            skill_id,
            value_array,
            player_skills!inner(skill_name)
          `)
          .eq('player_id', id)

        // Create a map of current skill values
        const currentSkills: { [key: string]: any } = {}
        currentAssignments?.forEach(assignment => {
          const skillName = (assignment.player_skills as any).skill_name
          currentSkills[skillName] = assignment.value_array
        })

        // Check if any admin-managed skills are being changed
        for (const skillKey of Object.keys(skills)) {
          if (adminManagedSkills[skillKey]) {
            const currentValue = currentSkills[skillKey]
            const newValue = skills[skillKey]
            
            // Normalize values for comparison
            const normalizeValue = (value: any) => {
              if (!value) return ''
              if (Array.isArray(value)) {
                return value.filter(v => v).sort().join(',')
              }
              return String(value).trim()
            }
            
            const currentValueStr = normalizeValue(currentValue)
            const newValueStr = normalizeValue(newValue)
            
            if (currentValueStr !== newValueStr) {
              return NextResponse.json({
                success: false,
                error: `You are not authorized to modify the '${skillKey}' skill. This skill is managed by administrators.`
              }, { status: 403 })
            }
          }
        }
      }

      // Create new skill assignments
      for (const [skillKey, skillValue] of Object.entries(skills)) {
        if (skillValue && skillIdMap[skillKey]) {
          const skillId = skillIdMap[skillKey]
          
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
                  console.error(`Error inserting multi-select skill ${skillKey}:`, insertError)
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
                  console.error(`Error inserting single-select skill ${skillKey}:`, insertError)
                }
              }
            }
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

// PATCH handler for partial updates
async function patchHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { id, ...updateData } = await request.json()
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Player ID is required'
      }, { status: 400 })
    }

    // Verify the player belongs to the user (unless admin/host)
    const userRole = user.role || 'viewer'
    if (userRole !== 'admin' && userRole !== 'host') {
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('user_id')
        .eq('id', id)
        .single()

      if (playerError || !player) {
        return NextResponse.json({
          success: false,
          error: 'Player not found'
        }, { status: 404 })
      }

      if (player.user_id !== user.id) {
        return NextResponse.json({
          success: false,
          error: 'You can only update your own player profile'
        }, { status: 403 })
      }
    }

    // Build update object with only provided fields
    const updateFields: any = {}
    
    // Handle basic profile fields
    if (updateData.display_name !== undefined) updateFields.display_name = updateData.display_name
    if (updateData.mobile_number !== undefined) updateFields.mobile_number = updateData.mobile_number
    if (updateData.profile_pic_url !== undefined) updateFields.profile_pic_url = updateData.profile_pic_url
    if (updateData.bio !== undefined) updateFields.bio = updateData.bio

    // Update basic fields if any
    if (Object.keys(updateFields).length > 0) {
      const { data: updatedPlayer, error: updateError } = await supabase
        .from('players')
        .update(updateFields)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Database error:', updateError)
        return NextResponse.json({
          success: false,
          error: updateError.message,
          details: updateError
        }, { status: 500 })
      }
    }

    // Handle skill updates if provided
    if (updateData.skills && Object.keys(updateData.skills).length > 0) {
      // Get all player skills to check admin-managed status
      const { data: playerSkills } = await supabase
        .from('player_skills')
        .select('id, skill_name, is_admin_managed')

      const adminManagedSkills: { [key: string]: boolean } = {}
      const skillIdMap: { [key: string]: string } = {}
      playerSkills?.forEach(skill => {
        skillIdMap[skill.skill_name] = skill.id
        adminManagedSkills[skill.skill_name] = skill.is_admin_managed || false
      })

      // Check if user is trying to modify admin-managed skills
      if (userRole !== 'admin' && userRole !== 'host') {
        for (const skillKey of Object.keys(updateData.skills)) {
          if (adminManagedSkills[skillKey]) {
            return NextResponse.json({
              success: false,
              error: `You are not authorized to modify the '${skillKey}' skill. This skill is managed by administrators.`
            }, { status: 403 })
          }
        }
      }

      // Delete existing skill assignments for the skills being updated
      const skillIdsToUpdate = Object.keys(updateData.skills)
        .filter(skillName => skillIdMap[skillName])
        .map(skillName => skillIdMap[skillName])

      if (skillIdsToUpdate.length > 0) {
        await supabase
          .from('player_skill_assignments')
          .delete()
          .eq('player_id', id)
          .in('skill_id', skillIdsToUpdate)
      }

      // Create new skill assignments for updated skills
      for (const [skillKey, skillValue] of Object.entries(updateData.skills)) {
        if (skillValue && skillIdMap[skillKey]) {
          const skillId = skillIdMap[skillKey]
          
          if (Array.isArray(skillValue)) {
            // Multi-select skill
            if (skillValue.length > 0) {
              const { data: skillValues } = await supabase
                .from('player_skill_values')
                .select('id')
                .in('value_name', skillValue)
                .eq('skill_id', skillId)

              if (skillValues && skillValues.length > 0) {
                const skillValueIds = skillValues.map(sv => sv.id)
                
                await supabase
                  .from('player_skill_assignments')
                  .insert({
                    player_id: id,
                    skill_id: skillId,
                    skill_value_ids: skillValueIds,
                    value_array: skillValue
                  })
              }
            }
          } else {
            // Single-select skill
            if (skillValue) {
              const { data: skillValueData } = await supabase
                .from('player_skill_values')
                .select('id')
                .eq('value_name', skillValue)
                .eq('skill_id', skillId)
                .single()

              if (skillValueData) {
                await supabase
                  .from('player_skill_assignments')
                  .insert({
                    player_id: id,
                    skill_id: skillId,
                    skill_value_id: skillValueData.id,
                    value_array: [skillValue]
                  })
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
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
export const PATCH = withAnalytics(withAuth(patchHandler, ['viewer', 'host', 'admin']))
