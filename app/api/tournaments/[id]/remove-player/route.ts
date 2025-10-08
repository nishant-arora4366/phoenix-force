import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const { slotId } = await request.json()
    
    if (!slotId) {
      return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 })
    }
    
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

    // Get the slot details
    const { data: slot, error: slotError } = await supabase
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
      .eq('id', slotId)
      .eq('tournament_id', tournamentId)
      .single()

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
    }

    if (!slot.player_id) {
      return NextResponse.json({ error: 'Slot is already empty' }, { status: 400 })
    }

    // Delete the slot record entirely in dynamic slot system
    const { error: deleteError } = await supabase
      .from('tournament_slots')
      .delete()
      .eq('id', slotId)

    if (deleteError) {
      console.error('Error deleting slot:', deleteError)
      return NextResponse.json({ error: 'Failed to delete slot' }, { status: 500 })
    }

    // No auto-promotion needed - positions are calculated dynamically in frontend

    // Send notification to the removed player
    if (slot.player_id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: slot.player_id,
          type: 'player_removed',
          title: 'You have been removed from the tournament',
          message: `You have been removed from the tournament by the host.`,
          data: {
            tournament_id: tournamentId,
            slot_id: slot.id,
            removed_at: new Date().toISOString()
          }
        })
    }

    return NextResponse.json({
      success: true,
      message: 'Player removed successfully',
      removed_player: {
        id: slot.player_id,
        name: slot.players?.display_name,
        slot_id: slot.id
      }
    })

  } catch (error: any) {
    console.error('Error removing player from tournament:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}