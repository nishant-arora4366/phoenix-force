import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'
import { sessionManager } from '@/src/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    
    console.log('User check:', sessionUser)
    console.log('User status:', sessionUser.status)
    
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

    console.log('Tournament status:', tournament.status)
    console.log('Tournament total_slots:', tournament.total_slots)
    if (tournament.status !== 'registration_open') {
      return NextResponse.json({ error: 'Tournament registration is not open' }, { status: 400 })
    }

    // Debug: Check existing slots for this tournament
    const { data: existingSlots, error: slotsError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('requested_at')

    console.log('Existing slots for tournament:', existingSlots?.length || 0)
    console.log('Slot details:', existingSlots?.map(s => ({ id: s.id, status: s.status, player_id: s.player_id, requested_at: s.requested_at })))

    // Check if user already has a player profile
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', sessionUser.id)
      .single()

    if (playerError || !player) {
      console.error('Player profile error:', playerError)
      console.error('User ID:', sessionUser.id)
      console.error('Player found:', !!player)
      return NextResponse.json({ error: 'Player profile not found. Please create a player profile first.' }, { status: 400 })
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
        console.log(`Registration attempt ${attempt}/${maxRetries}`)
        
        // Get current slots to determine next slot number
        const { data: currentSlots, error: slotsError } = await supabase
          .from('tournament_slots')
          .select('player_id, status')
          .eq('tournament_id', tournamentId)

        if (slotsError) {
          console.error('Failed to get current slots:', slotsError)
          lastError = slotsError
          continue
        }

        // Simple FCFS system - all registrations start as pending
        // Waitlist vs main slot is determined by position in frontend, not status in DB
        
        console.log('Attempting to register:', {
          currentSlotsCount: currentSlots?.length || 0,
          tournamentTotalSlots: tournament.total_slots
        })
        
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
          console.error(`Registration attempt ${attempt} failed:`, registerError)
          lastError = registerError
          
          // Check for specific constraint violations
          if (registerError.code === '23505') {
            if (registerError.message.includes('unique_tournament_player')) {
              return NextResponse.json({ error: 'Player already registered for this tournament' }, { status: 400 })
            } else if (registerError.message.includes('unique_tournament_slot')) {
              // Slot conflict - retry with exponential backoff
              if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100
                console.log(`Slot conflict detected, retrying in ${delay}ms...`)
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
          console.log('Registration successful:', slot)
          return NextResponse.json({
            success: true,
            message: `Registered for tournament. Position will be assigned based on registration time.`,
            slot: slot
          })
        }
      } catch (error) {
        console.error(`Registration attempt ${attempt} exception:`, error)
        lastError = error
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100
          console.log(`Exception occurred, retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // If we get here, all retries failed
    console.error('All registration attempts failed')
    return NextResponse.json({ 
      error: `Failed to register after multiple attempts: ${lastError?.message || 'Unknown error'}`,
      details: lastError?.message 
    }, { status: 500 })

  } catch (error: any) {
    console.error('Error registering for tournament:', error)
    console.error('Error details:', error.message, error.stack)
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
    console.error('Error cancelling tournament registration:', error)
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
