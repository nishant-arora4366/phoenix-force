import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Automatic promotion endpoint - no authentication required for system calls
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    
    console.log('=== AUTOMATIC WAITLIST PROMOTION ===')
    console.log('Tournament ID:', tournamentId)

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      console.error('Tournament not found:', tournamentError)
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    console.log('Tournament total slots:', tournament.total_slots)

    // Get all existing slots to find gaps
    const { data: existingSlots, error: existingSlotsError } = await supabase
      .from('tournament_slots')
      .select('slot_number')
      .eq('tournament_id', tournamentId)
      .order('slot_number')

    if (existingSlotsError) {
      console.error('Error fetching existing slots:', existingSlotsError)
      return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 })
    }

    const existingSlotNumbers = existingSlots?.map((s: any) => s.slot_number) || []
    let availableMainSlot = null
    
    // Find the first available main slot (1 to total_slots)
    for (let slotNum = 1; slotNum <= tournament.total_slots; slotNum++) {
      if (!existingSlotNumbers.includes(slotNum)) {
        availableMainSlot = slotNum
        break
      }
    }

    console.log('Available main slot:', availableMainSlot)
    console.log('Existing slot numbers:', existingSlotNumbers)

    if (!availableMainSlot) {
      console.log('No available main slots found')
      return NextResponse.json({ 
        success: false, 
        message: 'No available main slots' 
      }, { status: 200 })
    }

    // Find the first waitlist player
    console.log('=== SEARCHING FOR WAITLIST PLAYERS ===')
    
    const { data: waitlistPlayers, error: waitlistError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('status', 'waitlist')
      .not('player_id', 'is', null)
      .order('requested_at', { ascending: true })
      .limit(1)

    console.log('Waitlist players query result:', waitlistPlayers)
    console.log('Waitlist players error:', waitlistError)
    
    if (!waitlistPlayers || waitlistPlayers.length === 0) {
      console.log('No waitlist players found')
      return NextResponse.json({ 
        success: false, 
        message: 'No waitlist players to promote' 
      }, { status: 200 })
    }

    const waitlistPlayer = waitlistPlayers[0]

    console.log('=== PROMOTION DETAILS ===')
    console.log('Available main slot:', availableMainSlot)
    console.log('Waitlist player:', {
      id: waitlistPlayer.id,
      slot_number: waitlistPlayer.slot_number,
      status: waitlistPlayer.status,
      player_id: waitlistPlayer.player_id
    })

    // Promote the waitlist player by updating their slot number
    console.log('=== PROMOTING WAITLIST PLAYER ===')
    console.log(`Moving player from slot ${waitlistPlayer.slot_number} to slot ${availableMainSlot}...`)
    
    const { error: updateError } = await supabase
      .from('tournament_slots')
      .update({
        slot_number: availableMainSlot,
        status: 'pending'
      })
      .eq('id', waitlistPlayer.id)

    if (updateError) {
      console.error('Error promoting waitlist player:', updateError)
      return NextResponse.json({ 
        error: 'Failed to promote waitlist player',
        details: updateError.message,
        code: updateError.code
      }, { status: 500 })
    }

    console.log('Successfully promoted waitlist player to main slot!')

    // Send notification
    await supabase
      .from('notifications')
      .insert({
        user_id: waitlistPlayer.player_id,
        type: 'waitlist_promotion',
        title: 'You have been promoted from the waitlist!',
        message: `You have been promoted to position ${availableMainSlot} in the tournament. Please wait for host approval.`,
        data: {
          tournament_id: tournamentId,
          new_slot_number: availableMainSlot,
          promoted_at: new Date().toISOString()
        }
      })

    console.log('=== AUTOMATIC PROMOTION SUCCESSFUL ===')
    console.log('Successfully promoted waitlist player automatically')
    console.log('Player moved from slot', waitlistPlayer.slot_number, 'to slot', availableMainSlot)
    console.log('Player ID:', waitlistPlayer.player_id)
    
    return NextResponse.json({
      success: true,
      message: 'Waitlist player promoted automatically',
      promoted_player: {
        id: waitlistPlayer.player_id,
        new_slot: availableMainSlot
      }
    })

  } catch (error: any) {
    console.error('Error in automatic promotion:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
