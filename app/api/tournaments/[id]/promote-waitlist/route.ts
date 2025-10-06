import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Manual promotion endpoint for hosts/admins
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    
    // Get user from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }
    
    // Parse the user from the authorization header
    let sessionUser
    try {
      sessionUser = JSON.parse(authHeader)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid authorization header' }, { status: 401 })
    }
    
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    // Check if user is host or admin
    const userResponse = await fetch(`${request.nextUrl.origin}/api/user-profile?userId=${sessionUser.id}`)
    const userResult = await userResponse.json()
    
    if (!userResult.success) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    const isHost = tournament.host_id === sessionUser.id
    const isAdmin = userResult.data.role === 'admin'

    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Try to use the manual_promote_waitlist function first
    console.log('Attempting to call manual_promote_waitlist for tournament:', tournamentId)
    const { data: promotionResult, error: promotionError } = await supabase
      .rpc('manual_promote_waitlist', { p_tournament_id: tournamentId })

    console.log('Promotion result:', promotionResult)
    console.log('Promotion error:', promotionError)

    if (promotionError) {
      console.error('Error promoting waitlist player:', promotionError)
      // If the function doesn't exist, try manual promotion
      if (promotionError.message?.includes('function') || promotionError.message?.includes('does not exist')) {
        console.log('Database function not available, trying manual promotion...')
        return await manualPromotion(tournamentId, supabase)
      }
      return NextResponse.json({ error: 'Failed to promote waitlist player' }, { status: 500 })
    }

    if (!promotionResult || promotionResult.length === 0 || !promotionResult[0].success) {
      return NextResponse.json({ error: 'No waitlist players to promote or no available slots' }, { status: 404 })
    }

    const promotedPlayer = promotionResult[0]

    // Send notification to the promoted player
    await supabase
      .from('notifications')
      .insert({
        user_id: promotedPlayer.promoted_player_id,
        type: 'waitlist_promotion',
        title: 'You have been promoted from the waitlist!',
        message: `You have been promoted to position ${promotedPlayer.new_slot_number} in the tournament. Please wait for host approval.`,
        data: {
          tournament_id: tournamentId,
          new_slot_number: promotedPlayer.new_slot_number,
          promoted_at: new Date().toISOString()
        }
      })

    return NextResponse.json({
      success: true,
      message: 'Waitlist player promoted successfully',
      promoted_player: {
        id: promotedPlayer.promoted_player_id,
        new_slot: promotedPlayer.new_slot_number
      }
    })

  } catch (error: any) {
    console.error('Error promoting waitlist player:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get waitlist status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    
    // Get user from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }
    
    // Parse the user from the authorization header
    let sessionUser
    try {
      sessionUser = JSON.parse(authHeader)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid authorization header' }, { status: 401 })
    }
    
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Get waitlist players
    const { data: waitlistPlayers, error: waitlistError } = await supabase
      .from('tournament_slots')
      .select(`
        *,
        players (
          id,
          display_name,
          user_id,
          users (
            id,
            email,
            firstname,
            lastname,
            username
          )
        )
      `)
      .eq('tournament_id', tournamentId)
      .gt('slot_number', tournament.total_slots)
      .not('player_id', 'is', null)
      .eq('status', 'waitlist')
      .order('requested_at', { ascending: true })

    if (waitlistError) {
      return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 })
    }

    // Calculate user's waitlist position manually
    let userPosition = 0
    if (waitlistPlayers) {
      const userSlotIndex = waitlistPlayers.findIndex(slot => slot.player_id === sessionUser.id)
      userPosition = userSlotIndex >= 0 ? userSlotIndex + 1 : 0
    }

    return NextResponse.json({
      success: true,
      waitlist: {
        players: waitlistPlayers || [],
        total_count: waitlistPlayers?.length || 0,
        user_position: userPosition,
        tournament_total_slots: tournament.total_slots
      }
    })

  } catch (error: any) {
    console.error('Error fetching waitlist status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Manual promotion function as fallback
async function manualPromotion(tournamentId: string, supabase: any) {
  try {
    console.log('Starting manual promotion for tournament:', tournamentId)
    
    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('total_slots')
      .eq('id', tournamentId)
      .single()

    console.log('Tournament data:', tournament)
    console.log('Tournament error:', tournamentError)

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Debug: Get all tournament slots to see current state
    const { data: allSlots, error: allSlotsError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('slot_number', { ascending: true })

    console.log('All tournament slots:', allSlots)
    console.log('All slots error:', allSlotsError)
    
    // Debug: Get all slots with players to see the actual structure
    const { data: slotsWithPlayers, error: slotsWithPlayersError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .not('player_id', 'is', null)
      .order('slot_number', { ascending: true })

    console.log('All slots with players:', slotsWithPlayers)
    console.log('Slots with players error:', slotsWithPlayersError)

    // Find the first empty main slot
    const { data: emptySlots, error: emptySlotsError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .lte('slot_number', tournament.total_slots)
      .is('player_id', null)
      .order('slot_number', { ascending: true })
      .limit(1)

    console.log('Empty slots query result:', emptySlots)
    console.log('Empty slots error:', emptySlotsError)
    console.log('Total slots:', tournament.total_slots)

    if (emptySlotsError || !emptySlots || emptySlots.length === 0) {
      console.log('No empty main slots found')
      return NextResponse.json({ error: 'No empty main slots available' }, { status: 404 })
    }

    // Find the first waitlist player - try different approaches
    console.log('Looking for waitlist players with slot_number >', tournament.total_slots)
    
    // First try: look for slots with slot_number > total_slots and player_id not null
    const { data: waitlistPlayers, error: waitlistError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .gt('slot_number', tournament.total_slots)
      .not('player_id', 'is', null)
      .order('requested_at', { ascending: true })
      .limit(1)

    console.log('Waitlist players query result:', waitlistPlayers)
    console.log('Waitlist players error:', waitlistError)

    // If no results, try looking for any slot with a player that's not in main slots
    let actualWaitlistPlayers = waitlistPlayers
    if (!waitlistPlayers || waitlistPlayers.length === 0) {
      console.log('No waitlist players found with slot_number > total_slots, trying alternative approach...')
      
      // Alternative: look for any slot with player_id not null and status not 'confirmed'
      const { data: altWaitlistPlayers, error: altWaitlistError } = await supabase
        .from('tournament_slots')
        .select('*')
        .eq('tournament_id', tournamentId)
        .not('player_id', 'is', null)
        .neq('status', 'confirmed')
        .order('requested_at', { ascending: true })
        .limit(1)
      
      console.log('Alternative waitlist players query result:', altWaitlistPlayers)
      console.log('Alternative waitlist players error:', altWaitlistError)
      
      actualWaitlistPlayers = altWaitlistPlayers
    }

    if (!actualWaitlistPlayers || actualWaitlistPlayers.length === 0) {
      console.log('No waitlist players found with any approach')
      return NextResponse.json({ error: 'No waitlist players to promote' }, { status: 404 })
    }

    const emptySlot = emptySlots[0]
    const waitlistPlayer = actualWaitlistPlayers[0]

    console.log('Found empty slot:', emptySlot.slot_number)
    console.log('Found waitlist player:', waitlistPlayer.player_id)

    // Promote the waitlist player
    const { error: updateError } = await supabase
      .from('tournament_slots')
      .update({
        slot_number: emptySlot.slot_number,
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', waitlistPlayer.id)

    if (updateError) {
      console.error('Error updating waitlist player:', updateError)
      return NextResponse.json({ error: 'Failed to promote waitlist player' }, { status: 500 })
    }

    // Send notification
    await supabase
      .from('notifications')
      .insert({
        user_id: waitlistPlayer.player_id,
        type: 'waitlist_promotion',
        title: 'You have been promoted from the waitlist!',
        message: `You have been promoted to position ${emptySlot.slot_number} in the tournament. Please wait for host approval.`,
        data: {
          tournament_id: tournamentId,
          new_slot_number: emptySlot.slot_number,
          promoted_at: new Date().toISOString()
        }
      })

    console.log('Successfully promoted waitlist player manually')
    return NextResponse.json({
      success: true,
      message: 'Waitlist player promoted successfully (manual)',
      promoted_player: {
        id: waitlistPlayer.player_id,
        new_slot: emptySlot.slot_number
      }
    })

  } catch (error: any) {
    console.error('Error in manual promotion:', error)
    return NextResponse.json({ error: 'Manual promotion failed' }, { status: 500 })
  }
}
