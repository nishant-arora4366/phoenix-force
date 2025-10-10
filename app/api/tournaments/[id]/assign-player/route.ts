import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function POSTHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const body = await request.json()
    const { playerId, playerIds, status = 'pending' } = body

    // Support both single player and multiple players
    const playersToAssign = playerIds || (playerId ? [playerId] : [])
    
    if (playersToAssign.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Player ID(s) are required'
      }, { status: 400 })
    }

    // Validate status
    if (!['pending', 'confirmed'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Status must be either "pending" or "confirmed"'
      }, { status: 400 })
    }

    // Check if tournament exists
    const { data: tournament, error: tournamentError } = await supabaseAdmin
      .from('tournaments')
      .select('id, name, total_slots, status')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({
        success: false,
        error: 'Tournament not found'
      }, { status: 404 })
    }

    // Check if players exist and get player details
    const { data: players, error: playersError } = await supabaseAdmin
      .from('players')
      .select(`
        id,
        user_id,
        display_name,
        users!players_user_id_fkey(id, email, firstname, lastname, username)
      `)
      .in('id', playersToAssign)

    if (playersError || !players || players.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'One or more players not found'
      }, { status: 404 })
    }

    // Check if any players are already registered for this tournament
    const { data: existingSlots, error: existingError } = await supabaseAdmin
      .from('tournament_slots')
      .select('player_id')
      .eq('tournament_id', tournamentId)
      .in('player_id', playersToAssign)

    if (existingError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to check existing registrations'
      }, { status: 500 })
    }

    const registeredPlayerIds = existingSlots?.map(slot => slot.player_id) || []
    if (registeredPlayerIds.length > 0) {
      const registeredPlayers = players.filter(p => registeredPlayerIds.includes(p.id))
      const playerNames = registeredPlayers.map(p => p.display_name).join(', ')
      return NextResponse.json({
        success: false,
        error: `Player(s) already registered: ${playerNames}`
      }, { status: 400 })
    }

    // Get current slot count to determine if it's a main slot or waitlist
    const { data: currentSlots, error: slotsError } = await supabaseAdmin
      .from('tournament_slots')
      .select('id, status')
      .eq('tournament_id', tournamentId)

    if (slotsError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to check current slots'
      }, { status: 500 })
    }

    const currentSlotCount = currentSlots?.length || 0
    const isMainSlot = currentSlotCount < tournament.total_slots

    // Prepare slots data for insertion
    const slotsData = players.map((player, index) => ({
      tournament_id: tournamentId,
      player_id: player.id,
      status: status,
      requested_at: new Date().toISOString(),
      confirmed_at: status === 'confirmed' ? new Date().toISOString() : null
    }))

    // Insert the new slots
    const { data: newSlots, error: insertError } = await supabaseAdmin
      .from('tournament_slots')
      .insert(slotsData)
      .select(`
        id,
        status,
        requested_at,
        confirmed_at,
        players!tournament_slots_player_id_fkey(
          id,
          display_name,
          users!players_user_id_fkey(id, email, firstname, lastname, username)
        )
      `)

    if (insertError) {
      console.error('Error inserting tournament slots:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Failed to assign players to tournament'
      }, { status: 500 })
    }

    // Create notifications for all players
    const notificationsData = players.map((player, index) => ({
      user_id: player.user_id,
      type: 'tournament_assignment',
      title: 'Tournament Assignment',
      message: `You have been ${status === 'confirmed' ? 'confirmed' : 'assigned'} to tournament "${tournament.name}" by the host.`,
      data: {
        tournament_id: tournamentId,
        slot_id: newSlots[index]?.id,
        status: status,
        assigned_by_host: true
      }
    })).filter(notification => notification.user_id) // Only create notifications for players with user accounts

    if (notificationsData.length > 0) {
      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert(notificationsData)

      if (notificationError) {
        console.error('Error creating notifications:', notificationError)
        // Don't fail the request if notification creation fails
      }
    }

    // Format response slots
    const formattedSlots = newSlots?.map((slot, index) => ({
      id: slot.id,
      status: slot.status,
      requested_at: slot.requested_at,
      confirmed_at: slot.confirmed_at,
      player: {
        id: (slot.players as any)?.id,
        display_name: (slot.players as any)?.display_name,
        user: (slot.players as any)?.users
      },
      is_main_slot: (currentSlotCount + index + 1) <= tournament.total_slots,
      position: currentSlotCount + index + 1
    })) || []

    return NextResponse.json({
      success: true,
      message: `${players.length} player(s) successfully ${status === 'confirmed' ? 'confirmed' : 'assigned'} to tournament`,
      slots: formattedSlots
    })

  } catch (error: any) {
    console.error('Error in assign-player API:', error)
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
