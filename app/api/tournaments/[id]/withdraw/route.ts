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
      return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 })
    }

    // Get user's player profile
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', sessionUser.id)
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

    if (registrationError) {
      if (registrationError.code === 'PGRST116') {
        return NextResponse.json({ 
          success: false, 
          error: 'You are not registered for this tournament' 
        }, { status: 404 })
      }
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to check registration status' 
      }, { status: 500 })
    }

    if (!registration) {
      return NextResponse.json({ 
        success: false, 
        error: 'You are not registered for this tournament' 
      }, { status: 404 })
    }

    // Delete the slot record entirely in dynamic slot system
    const { error: deleteError } = await supabase
      .from('tournament_slots')
      .delete()
      .eq('id', registration.id)

    if (deleteError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to withdraw from tournament' 
      }, { status: 500 })
    }

    // No auto-promotion needed - positions are calculated dynamically in frontend

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully withdrew from tournament' 
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Wrapper function to match middleware expectations
async function postWrapper(request: NextRequest, user: AuthenticatedUser) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const tournamentId = pathParts[pathParts.length - 2] // Get the tournament ID from the path
  if (!tournamentId) {
    return NextResponse.json({ success: false, error: 'Tournament ID required' }, { status: 400 })
  }
  return POSTHandler(request, user, { params: Promise.resolve({ id: tournamentId }) })
}

// Export the handlers with analytics
export const POST = withAnalytics(withAuth(postWrapper, ['viewer', 'host', 'admin']))
