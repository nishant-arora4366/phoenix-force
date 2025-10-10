import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics';
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params

    // User is already authenticated via withAuth middleware
    if (!user || !user.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's player profile
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ 
        success: false, 
        error: 'Player profile not found. Please create a player profile first.' 
      }, { status: 404 })
    }

    // Check if player is registered for this tournament
    const { data: registration, error: registrationError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('player_id', player.id)
      .single()

    if (registrationError && registrationError.code !== 'PGRST116') {
      console.error('Error checking registration:', registrationError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check registration status' 
      }, { status: 500 })
    }

    if (registration) {
      // Calculate position based on FCFS system
      const { data: tournament, error: tournamentError } = await supabase
        .from('tournaments')
        .select('total_slots')
        .eq('id', tournamentId)
        .single()

      if (tournamentError) {
        console.error('Error fetching tournament:', tournamentError)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch tournament details' 
        }, { status: 500 })
      }

      // Get all FILLED slots for this tournament, sorted by requested_at
      const { data: allSlots, error: allSlotsError } = await supabase
        .from('tournament_slots')
        .select('id, requested_at, status, player_id')
        .eq('tournament_id', tournamentId)
        .not('player_id', 'is', null) // Only get slots with players
        .order('requested_at')

      if (allSlotsError) {
        console.error('Error fetching all slots:', allSlotsError)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to fetch slot positions' 
        }, { status: 500 })
      }

      // Find position based on requested_at timestamp (FCFS)
      const sortedSlots = allSlots?.sort((a, b) => 
        new Date(a.requested_at).getTime() - new Date(b.requested_at).getTime()
      ) || []
      
      const userSlotIndex = sortedSlots.findIndex(slot => slot.id === registration.id)
      const position = userSlotIndex >= 0 ? userSlotIndex + 1 : null
      const isMainSlot = position && position <= tournament.total_slots
      const waitlistPosition = isMainSlot ? null : (position ? position - tournament.total_slots : null)

      return NextResponse.json({ 
        success: true, 
        registration: {
          id: registration.id,
          status: registration.status,
          requested_at: registration.requested_at,
          confirmed_at: registration.confirmed_at,
          position: position,
          is_main_slot: isMainSlot,
          waitlist_position: waitlistPosition
        }
      })
    } else {
      return NextResponse.json({ 
        success: true, 
        registration: null 
      })
    }

  } catch (error) {
    console.error('Error in user-registration API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Wrapper function to match middleware expectations
async function getWrapper(request: NextRequest, user: AuthenticatedUser) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const tournamentId = pathParts[pathParts.length - 2] // Get the tournament ID from the path
  if (!tournamentId) {
    return NextResponse.json({ success: false, error: 'Tournament ID required' }, { status: 400 })
  }
  return getHandler(request, user, { params: Promise.resolve({ id: tournamentId }) })
}

// Export the handler with analytics
export const GET = withAnalytics(withAuth(getWrapper, ['viewer', 'host', 'admin']))
