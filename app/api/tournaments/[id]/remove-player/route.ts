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
    const { slotId } = await request.json()

    if (!slotId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Slot ID is required' 
      }, { status: 400 })
    }

    // Get user from session
    const userData = sessionManager.getUserFromRequest(request)
    if (!userData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin or host
    if (userData.role !== 'admin' && userData.role !== 'host') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only admins and hosts can remove players from tournament slots' 
      }, { status: 403 })
    }

    // Get the slot to verify it exists and get player info
    const { data: slot, error: slotError } = await supabase
      .from('tournament_slots')
      .select(`
        id,
        slot_number,
        status,
        player_id,
        players!tournament_slots_player_id_fkey (
          id,
          display_name,
          users!players_user_id_fkey (
            id,
            email,
            firstname,
            lastname
          )
        )
      `)
      .eq('id', slotId)
      .eq('tournament_id', tournamentId)
      .single()

    if (slotError || !slot) {
      return NextResponse.json({ 
        success: false, 
        error: 'Tournament slot not found' 
      }, { status: 404 })
    }

    if (!slot.player_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'No player assigned to this slot' 
      }, { status: 400 })
    }

    // Get player name for response
    const playerName = slot.players?.display_name || 
                      (slot.players?.users?.firstname && slot.players?.users?.lastname 
                        ? `${slot.players.users.firstname} ${slot.players.users.lastname}`
                        : slot.players?.users?.email || 'Player')

    // Remove player from slot (set player_id to null, status to empty, clear timestamps)
    const { error: updateError } = await supabase
      .from('tournament_slots')
      .update({
        player_id: null,
        status: 'empty',
        requested_at: null,
        confirmed_at: null,
        waitlist_position: null
      })
      .eq('id', slotId)

    if (updateError) {
      console.error('Error removing player from slot:', updateError)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to remove player from tournament slot' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully removed ${playerName} from tournament slot ${slot.slot_number}`,
      playerName,
      slotNumber: slot.slot_number
    })

  } catch (error) {
    console.error('Error in remove-player API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
