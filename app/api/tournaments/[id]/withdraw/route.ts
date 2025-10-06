import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sessionManager } from '@/lib/session'

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

    // Try to promote a waitlist player to the now-empty main slot
    try {
      const promotionResponse = await fetch(`${request.nextUrl.origin}/api/tournaments/${tournamentId}/auto-promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (promotionResponse.ok) {
        const promotionResult = await promotionResponse.json()
        if (promotionResult.success) {
          console.log('Successfully promoted waitlist player:', promotionResult.promoted_player)
        } else {
          console.log('No waitlist players to promote:', promotionResult.message)
        }
      } else {
        console.log('Promotion failed or no waitlist players available')
      }
    } catch (promotionError) {
      console.error('Error calling auto-promote:', promotionError)
    }

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
