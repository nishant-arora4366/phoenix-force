import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'
import { sessionManager } from '@/src/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Function to validate tournament restrictions
async function validateTournamentRestrictions(playerId: string, tournament: any) {
  try {
    // Get player's skills using the same approach as player profile API
    const { data: skillAssignments, error: skillsError } = await supabase
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
      .eq('player_id', playerId)


      if (skillsError) {
        return { canRegister: true } // Allow registration if we can't fetch skills
      }

    // Convert skills to a more usable format (same logic as player profile API)
    const playerSkillsMap: { [key: string]: string[] } = {}
    if (skillAssignments) {
      for (const assignment of skillAssignments) {
        const skillName = (assignment.player_skills as any)?.skill_name
        const skillType = (assignment.player_skills as any)?.skill_type
        if (skillName) {
          if (skillType === 'multiselect') {
            // For multiselect, use the value_array
            playerSkillsMap[skillName] = assignment.value_array || []
          } else {
            // For single select, use the skill_value_id to get the value
            if (assignment.player_skill_values) {
              playerSkillsMap[skillName] = [(assignment.player_skill_values as any).value_name]
            } else if (assignment.value_array && assignment.value_array.length > 0) {
              // Fallback: use value_array if player_skill_values is not available
              playerSkillsMap[skillName] = assignment.value_array
            }
          }
        }
      }
    }

    // Debug logging removed

    // Check community restrictions
    if (tournament.community_restrictions && tournament.community_restrictions.length > 0) {
      const playerCommunities = playerSkillsMap['Community'] || []
      
      const hasAllowedCommunity = playerCommunities.some(community => 
        tournament.community_restrictions.includes(community)
      )
      
      if (!hasAllowedCommunity) {
        return { 
          canRegister: false, 
          reason: `This tournament is restricted to: ${tournament.community_restrictions.join(', ')}. Your communities: ${playerCommunities.join(', ') || 'None'}` 
        }
      }
    }

    // Check base price restrictions
    if (tournament.base_price_restrictions && tournament.base_price_restrictions.length > 0) {
      const playerBasePrices = playerSkillsMap['Base Price'] || []
      const hasAllowedBasePrice = playerBasePrices.some(basePrice => 
        tournament.base_price_restrictions.includes(basePrice)
      )
      
      if (!hasAllowedBasePrice) {
        return { 
          canRegister: false, 
          reason: `This tournament is restricted to base prices: ₹${tournament.base_price_restrictions.join(', ₹')}. Your base price: ₹${playerBasePrices.join(', ₹') || 'Not set'}` 
        }
      }
    }

    // Check price range restrictions
    if (tournament.min_base_price || tournament.max_base_price) {
      const playerBasePrices = playerSkillsMap['Base Price'] || []
      
      for (const basePriceStr of playerBasePrices) {
        const basePrice = parseFloat(basePriceStr)
        
        if (tournament.min_base_price && basePrice < tournament.min_base_price) {
          return { 
            canRegister: false, 
            reason: `Your base price (₹${basePrice}) is below the minimum required (₹${tournament.min_base_price})` 
          }
        }
        
        if (tournament.max_base_price && basePrice > tournament.max_base_price) {
          return { 
            canRegister: false, 
            reason: `Your base price (₹${basePrice}) is above the maximum allowed (₹${tournament.max_base_price})` 
          }
        }
      }
      
      if (playerBasePrices.length === 0) {
        return { 
          canRegister: false, 
          reason: 'Base price not set in your profile' 
        }
      }
    }

    return { canRegister: true }
    } catch (error) {
      return { canRegister: true } // Allow registration if validation fails
    }
}

async function POSTHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    
    // User is already authenticated via withAuth middleware
    const sessionUser = user
    
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }
    
    // For now, allow any user to register (remove approval check for testing)
    // if (userResult.data.status !== 'approved') {
    //   return NextResponse.json({ error: 'User not approved for registration' }, { status: 403 })
    // }

    // Check if tournament exists and registration is open
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    if (tournament.status !== 'registration_open') {
      return NextResponse.json({ error: 'Tournament registration is not open' }, { status: 400 })
    }

    // Debug: Check existing slots for this tournament
    const { data: existingSlots, error: slotsError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('requested_at')


    // Check if user already has a player profile
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', sessionUser.id)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player profile not found. Please create a player profile first.' }, { status: 400 })
    }

    // Check tournament restrictions
    const restrictionValidation = await validateTournamentRestrictions(player.id, tournament)
    if (!restrictionValidation.canRegister) {
      return NextResponse.json({ 
        error: `Registration restricted: ${restrictionValidation.reason}` 
      }, { status: 403 })
    }

    // Check if player is already registered for this tournament
    const { data: existingSlot, error: existingError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('player_id', player.id)
      .single()

    if (existingSlot) {
      return NextResponse.json({ error: 'Player already registered for this tournament' }, { status: 400 })
    }

    // Slot assignment with retry logic
    const maxRetries = 3
    const baseDelay = 100 // Base delay in milliseconds
    let lastError: any = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        
        // Get current slots to determine next slot number
        const { data: currentSlots, error: slotsError } = await supabase
          .from('tournament_slots')
          .select('player_id, status')
          .eq('tournament_id', tournamentId)

        if (slotsError) {
          lastError = slotsError
          continue
        }

        // Simple FCFS system - all registrations start as pending
        // Waitlist vs main slot is determined by position in frontend, not status in DB
        
        
        // Create new slot entry - all start as pending until host approves
        const { data: slot, error: registerError } = await supabase
          .from('tournament_slots')
          .insert({
            tournament_id: tournamentId,
            player_id: player.id,
            status: 'pending', // All registrations start as pending
            requested_at: new Date().toISOString()
          })
          .select()
          .single()

        if (registerError) {
          lastError = registerError
          
          // Check for specific constraint violations
          if (registerError.code === '23505') {
            if (registerError.message.includes('unique_tournament_player')) {
              return NextResponse.json({ error: 'Player already registered for this tournament' }, { status: 400 })
            } else if (registerError.message.includes('unique_tournament_slot')) {
              // Slot conflict - retry with exponential backoff
              if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100
                await new Promise(resolve => setTimeout(resolve, delay))
                continue
              } else {
                return NextResponse.json({ error: 'Slot number already taken. Please try again.' }, { status: 400 })
              }
            }
          }
          
          // For other errors, don't retry
          if (attempt === maxRetries) {
            return NextResponse.json({ error: `Failed to register for tournament slot: ${registerError.message}` }, { status: 500 })
          }
        } else {
          // Success!
          return NextResponse.json({
            success: true,
            message: `Registered for tournament. Position will be assigned based on registration time.`,
            slot: slot
          })
        }
      } catch (error) {
        lastError = error
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // If we get here, all retries failed
    return NextResponse.json({ 
      error: `Failed to register after multiple attempts: ${lastError?.message || 'Unknown error'}`,
      details: lastError?.message 
    }, { status: 500 })

  } catch (error: any) {
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 })
  }
}

async function DELETEHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    
    // User is already authenticated via withAuth middleware
    const sessionUser = user
    
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    // Get user's player profile
    const { data: userData, error: userError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', sessionUser.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Player profile not found' }, { status: 400 })
    }

    // Find and remove player's registration
    const { data: slot, error: slotError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('player_id', userData.id)
      .single()

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Delete the slot record entirely in dynamic slot system
    const { error: deleteError } = await supabase
      .from('tournament_slots')
      .delete()
      .eq('id', slot.id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to cancel registration' }, { status: 500 })
    }

    // No auto-promotion needed - positions are calculated dynamically in frontend

    return NextResponse.json({
      success: true,
      message: 'Registration cancelled successfully'
    })

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Wrapper functions to match middleware expectations
async function postWrapper(request: NextRequest, user: AuthenticatedUser) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const tournamentId = pathParts[pathParts.length - 2] // Get the tournament ID from the path
  if (!tournamentId) {
    return NextResponse.json({ error: 'Tournament ID required' }, { status: 400 })
  }
  return POSTHandler(request, user, { params: Promise.resolve({ id: tournamentId }) })
}

async function deleteWrapper(request: NextRequest, user: AuthenticatedUser) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const tournamentId = pathParts[pathParts.length - 2] // Get the tournament ID from the path
  if (!tournamentId) {
    return NextResponse.json({ error: 'Tournament ID required' }, { status: 400 })
  }
  return DELETEHandler(request, user, { params: Promise.resolve({ id: tournamentId }) })
}

// Export the handlers with analytics
export const POST = withAnalytics(withAuth(postWrapper, ['viewer', 'host', 'admin']))
export const DELETE = withAnalytics(withAuth(deleteWrapper, ['viewer', 'host', 'admin']))
