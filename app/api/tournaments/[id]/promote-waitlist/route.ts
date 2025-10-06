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

    // Try to use the new safe promotion function first
    console.log('Attempting to call find_and_promote_waitlist for tournament:', tournamentId)
    const { data: promotionResult, error: promotionError } = await supabase
      .rpc('find_and_promote_waitlist', { p_tournament_id: tournamentId })

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
      console.log('Database function returned no promotion, trying manual promotion...')
      return await manualPromotion(tournamentId, supabase)
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
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message,
      code: error.code
    }, { status: 500 })
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
    console.log('=== STARTING MANUAL PROMOTION ===')
    console.log('Tournament ID:', tournamentId)
    
    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    console.log('=== TOURNAMENT DETAILS ===')
    console.log('Tournament data:', tournament)
    console.log('Tournament error:', tournamentError)
    console.log('Total slots configured:', tournament?.total_slots)
    console.log('Tournament status:', tournament?.status)

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    // Debug: Get all tournament slots to see current state
    const { data: allSlots, error: allSlotsError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('slot_number', { ascending: true })

    console.log('=== ALL TOURNAMENT SLOTS ===')
    console.log('Total slots in database:', allSlots?.length || 0)
    console.log('All slots error:', allSlotsError)
    console.log('Slot breakdown:')
    if (allSlots) {
      const mainSlots = allSlots.filter((s: any) => s.slot_number <= tournament.total_slots)
      const waitlistSlots = allSlots.filter((s: any) => s.slot_number > tournament.total_slots)
      const emptySlots = allSlots.filter((s: any) => s.player_id === null)
      const filledSlots = allSlots.filter((s: any) => s.player_id !== null)
      
      console.log(`- Main slots (1-${tournament.total_slots}): ${mainSlots.length}`)
      console.log(`- Waitlist slots (>${tournament.total_slots}): ${waitlistSlots.length}`)
      console.log(`- Empty slots: ${emptySlots.length}`)
      console.log(`- Filled slots: ${filledSlots.length}`)
      
      console.log('Main slots details:')
      mainSlots.forEach((slot: any) => {
        console.log(`  Slot ${slot.slot_number}: ${slot.status} (player: ${slot.player_id ? 'YES' : 'NO'})`)
      })
      
      console.log('Waitlist slots details:')
      waitlistSlots.forEach((slot: any) => {
        console.log(`  Slot ${slot.slot_number}: ${slot.status} (player: ${slot.player_id ? 'YES' : 'NO'})`)
      })
    }
    
    // Debug: Get all slots with players to see the actual structure
    const { data: slotsWithPlayers, error: slotsWithPlayersError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .not('player_id', 'is', null)
      .order('slot_number', { ascending: true })

    console.log('=== SLOTS WITH PLAYERS ===')
    console.log('Slots with players:', slotsWithPlayers?.length || 0)
    console.log('Slots with players error:', slotsWithPlayersError)
    if (slotsWithPlayers) {
      slotsWithPlayers.forEach((slot: any) => {
        console.log(`  Slot ${slot.slot_number}: ${slot.status} (player: ${slot.player_id})`)
      })
    }

    // Find the first available main slot number (not necessarily empty, but available)
    console.log('=== SEARCHING FOR AVAILABLE MAIN SLOTS ===')
    
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
    console.log('Total slots configured:', tournament.total_slots)

    if (!availableMainSlot) {
      console.log('No available main slots found')
      return NextResponse.json({ 
        success: false, 
        message: 'No available main slots' 
      }, { status: 200 })
    }

    // Find the first waitlist player - look for any player with status 'waitlist'
    console.log('=== SEARCHING FOR WAITLIST PLAYERS ===')
    console.log('Looking for waitlist players with status = waitlist')
    
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
    
    if (waitlistPlayers && waitlistPlayers.length > 0) {
      console.log(`Found waitlist player: Slot ${waitlistPlayers[0].slot_number} (ID: ${waitlistPlayers[0].id}, Player: ${waitlistPlayers[0].player_id})`)
    } else {
      console.log('No waitlist players found')
    }

    let actualWaitlistPlayers = waitlistPlayers

    if (!actualWaitlistPlayers || actualWaitlistPlayers.length === 0) {
      console.log('No waitlist players found with any approach')
      return NextResponse.json({ 
        success: false, 
        message: 'No waitlist players to promote' 
      }, { status: 200 }) // Return 200 instead of 404 to prevent retries
    }

    const waitlistPlayer = actualWaitlistPlayers[0]

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
    console.log(`Waitlist player ID: ${waitlistPlayer.id}`)
    
    // Simply update the waitlist player's slot number to the available main slot
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

    console.log('=== PROMOTION SUCCESSFUL ===')
    console.log('Successfully promoted waitlist player manually')
    console.log('Player moved from slot', waitlistPlayer.slot_number, 'to slot', availableMainSlot)
    console.log('Player ID:', waitlistPlayer.player_id)
    
    return NextResponse.json({
      success: true,
      message: 'Waitlist player promoted successfully (manual)',
      promoted_player: {
        id: waitlistPlayer.player_id,
        new_slot: availableMainSlot
      }
    })

  } catch (error: any) {
    console.error('Error in manual promotion:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    return NextResponse.json({ 
      error: 'Manual promotion failed',
      details: error.message,
      code: error.code
    }, { status: 500 })
  }
}
