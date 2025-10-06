import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('Testing promotion logic...')
    
    // Get a tournament with slots
    const { data: tournaments, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, total_slots')
      .limit(1)
    
    if (tournamentError || !tournaments || tournaments.length === 0) {
      return NextResponse.json({ error: 'No tournaments found' })
    }
    
    const tournament = tournaments[0]
    console.log('Testing with tournament:', tournament)
    
    // Get all slots for this tournament
    const { data: allSlots, error: slotsError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournament.id)
      .order('slot_number')
    
    if (slotsError) {
      return NextResponse.json({ error: 'Failed to fetch slots', details: slotsError.message })
    }
    
    console.log('All slots:', allSlots?.map(s => ({
      slot_number: s.slot_number,
      status: s.status,
      player_id: s.player_id
    })))
    
    // Find empty slots
    const emptySlots = allSlots?.filter(s => s.player_id === null) || []
    console.log('Empty slots:', emptySlots.map(s => s.slot_number))
    
    // Find waitlist players
    const waitlistPlayers = allSlots?.filter(s => s.status === 'waitlist' && s.player_id !== null) || []
    console.log('Waitlist players:', waitlistPlayers.map(s => ({
      slot_number: s.slot_number,
      player_id: s.player_id,
      status: s.status
    })))
    
    return NextResponse.json({
      success: true,
      tournament: tournament,
      emptySlots: emptySlots.length,
      waitlistPlayers: waitlistPlayers.length,
      canPromote: emptySlots.length > 0 && waitlistPlayers.length > 0
    })
    
  } catch (error: any) {
    console.error('Test error:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error.message
    })
  }
}
