import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const body = await request.json()
    const { playerId, status = 'pending' } = body

    if (!playerId) {
      return NextResponse.json({
        success: false,
        error: 'Player ID is required'
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

    // Check if player exists and get player details
    const { data: player, error: playerError } = await supabaseAdmin
      .from('players')
      .select(`
        id,
        user_id,
        display_name,
        users!inner(id, email, firstname, lastname, username)
      `)
      .eq('id', playerId)
      .single()

    if (playerError || !player) {
      return NextResponse.json({
        success: false,
        error: 'Player not found'
      }, { status: 404 })
    }

    // Check if player is already registered for this tournament
    const { data: existingSlot, error: existingError } = await supabaseAdmin
      .from('tournament_slots')
      .select('id, status')
      .eq('tournament_id', tournamentId)
      .eq('player_id', playerId)
      .single()

    if (existingSlot) {
      return NextResponse.json({
        success: false,
        error: 'Player is already registered for this tournament'
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

    // Insert the new slot
    const { data: newSlot, error: insertError } = await supabaseAdmin
      .from('tournament_slots')
      .insert({
        tournament_id: tournamentId,
        player_id: playerId,
        status: status,
        requested_at: new Date().toISOString(),
        confirmed_at: status === 'confirmed' ? new Date().toISOString() : null
      })
      .select(`
        id,
        status,
        requested_at,
        confirmed_at,
        players!inner(
          id,
          display_name,
          users!inner(id, email, firstname, lastname, username)
        )
      `)
      .single()

    if (insertError) {
      console.error('Error inserting tournament slot:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Failed to assign player to tournament'
      }, { status: 500 })
    }

    // Create notification for the player
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: player.user_id,
        type: 'tournament_assignment',
        title: 'Tournament Assignment',
        message: `You have been ${status === 'confirmed' ? 'confirmed' : 'assigned'} to tournament "${tournament.name}" by the host.`,
        data: {
          tournament_id: tournamentId,
          slot_id: newSlot.id,
          status: status,
          assigned_by_host: true
        }
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json({
      success: true,
      message: `Player successfully ${status === 'confirmed' ? 'confirmed' : 'assigned'} to tournament`,
      slot: {
        id: newSlot.id,
        status: newSlot.status,
        requested_at: newSlot.requested_at,
        confirmed_at: newSlot.confirmed_at,
        player: {
          id: (newSlot.players as any).id,
          display_name: (newSlot.players as any).display_name,
          user: (newSlot.players as any).users
        },
        is_main_slot: isMainSlot,
        position: currentSlotCount + 1
      }
    })

  } catch (error: any) {
    console.error('Error in assign-player API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
