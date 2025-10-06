import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tournamentId = searchParams.get('tournamentId')
    
    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 })
    }

    console.log('=== TESTING AUTO-PROMOTION ===')
    console.log('Tournament ID:', tournamentId)

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    console.log('Tournament total slots:', tournament.total_slots)

    // Get all slots
    const { data: allSlots, error: slotsError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('slot_number')

    if (slotsError) {
      return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 })
    }

    console.log('All slots:', allSlots?.length || 0)
    
    const mainSlots = allSlots?.filter(s => s.slot_number <= tournament.total_slots) || []
    const waitlistSlots = allSlots?.filter(s => s.slot_number > tournament.total_slots) || []
    
    console.log('Main slots:', mainSlots.length)
    console.log('Waitlist slots:', waitlistSlots.length)
    
    // Check for empty main slots
    const emptyMainSlots = mainSlots.filter(s => !s.player_id)
    console.log('Empty main slots:', emptyMainSlots.length)
    
    // Check for waitlist players
    const waitlistPlayers = waitlistSlots.filter(s => s.player_id && s.status === 'waitlist')
    console.log('Waitlist players:', waitlistPlayers.length)
    
    // Test the promotion function
    console.log('=== TESTING PROMOTION FUNCTION ===')
    const { data: promotionResult, error: promotionError } = await supabase
      .rpc('manual_promote_waitlist', { p_tournament_id: tournamentId })

    console.log('Promotion result:', promotionResult)
    console.log('Promotion error:', promotionError)

    return NextResponse.json({
      success: true,
      tournament: {
        id: tournament.id,
        name: tournament.name,
        total_slots: tournament.total_slots
      },
      slots: {
        total: allSlots?.length || 0,
        main: mainSlots.length,
        waitlist: waitlistSlots.length,
        empty_main: emptyMainSlots.length,
        waitlist_players: waitlistPlayers.length
      },
      promotion: {
        result: promotionResult,
        error: promotionError
      }
    })

  } catch (error: any) {
    console.error('Error testing auto-promotion:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
