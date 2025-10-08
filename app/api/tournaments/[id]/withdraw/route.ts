import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sessionManager } from '@/src/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params

    // Get user from session
    const userData = sessionManager.getUserFromRequest(request)
    if (!userData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's player profile
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', userData.id)
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
      console.error('Error checking registration:', registrationError)
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
      console.error('Error deleting slot:', deleteError)
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
    console.error('Error in withdraw API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
