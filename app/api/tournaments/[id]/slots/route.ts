import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sessionManager } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Get all tournament slots with player information
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const sessionUser = sessionManager.getUser()
    
    if (!sessionUser) {
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

    // Check if user is host or admin
    const userResponse = await fetch(`${request.nextUrl.origin}/api/user-profile?userId=${sessionUser.id}`)
    const userResult = await userResponse.json()
    
    if (!userResult.success) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const isHost = tournament.host_id === sessionUser.id
    const isAdmin = userResult.data.role === 'admin'

    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all slots for the tournament
    const { data: slots, error: slotsError } = await supabase
      .from('tournament_slots')
      .select(`
        *,
        players (
          id,
          name,
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
      .order('slot_number')

    if (slotsError) {
      return NextResponse.json({ error: 'Error fetching tournament slots' }, { status: 500 })
    }

    // Create a map of filled slots
    const filledSlots = slots?.reduce((acc, slot) => {
      acc[slot.slot_number] = slot
      return acc
    }, {} as Record<number, any>) || {}

    // Generate all slots (main + waitlist)
    const totalSlots = tournament.total_slots
    const waitlistSlots = 10
    const allSlots = []

    // Main tournament slots
    for (let i = 1; i <= totalSlots; i++) {
      const slot = filledSlots[i] || {
        id: null,
        slot_number: i,
        player_id: null,
        status: 'empty',
        players: null,
        requested_at: null,
        confirmed_at: null
      }
      allSlots.push({
        ...slot,
        is_main_slot: true
      })
    }

    // Waitlist slots
    for (let i = totalSlots + 1; i <= totalSlots + waitlistSlots; i++) {
      const slot = filledSlots[i] || {
        id: null,
        slot_number: i,
        player_id: null,
        status: 'empty',
        players: null,
        requested_at: null,
        confirmed_at: null
      }
      allSlots.push({
        ...slot,
        is_main_slot: false,
        waitlist_position: i - totalSlots
      })
    }

    return NextResponse.json({
      success: true,
      tournament: tournament,
      slots: allSlots,
      stats: {
        total_slots: totalSlots,
        waitlist_slots: waitlistSlots,
        filled_main_slots: slots?.filter(s => s.slot_number <= totalSlots && s.status !== 'empty').length || 0,
        filled_waitlist_slots: slots?.filter(s => s.slot_number > totalSlots && s.status !== 'empty').length || 0,
        pending_approvals: slots?.filter(s => s.status === 'pending').length || 0
      }
    })

  } catch (error: any) {
    console.error('Error fetching tournament slots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Approve or reject a slot registration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const sessionUser = sessionManager.getUser()
    
    if (!sessionUser) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { slotId, action } = body // action: 'approve' or 'reject'

    if (!slotId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
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

    // Check if user is host or admin
    const userResponse = await fetch(`${request.nextUrl.origin}/api/user-profile?userId=${sessionUser.id}`)
    const userResult = await userResponse.json()
    
    if (!userResult.success) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const isHost = tournament.host_id === sessionUser.id
    const isAdmin = userResult.data.role === 'admin'

    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get the slot details
    const { data: slot, error: slotError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('id', slotId)
      .eq('tournament_id', tournamentId)
      .single()

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 })
    }

    if (slot.status !== 'pending') {
      return NextResponse.json({ error: 'Slot is not in pending status' }, { status: 400 })
    }

    // Update slot status
    const updateData: any = {}
    
    if (action === 'approve') {
      updateData.status = 'confirmed'
      updateData.confirmed_at = new Date().toISOString()
    } else {
      // Reject - remove the player from the slot
      updateData.player_id = null
      updateData.status = 'empty'
      updateData.requested_at = null
    }

    const { data: updatedSlot, error: updateError } = await supabase
      .from('tournament_slots')
      .update(updateData)
      .eq('id', slotId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update slot' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Slot approved successfully' : 'Slot rejected successfully',
      slot: updatedSlot
    })

  } catch (error: any) {
    console.error('Error updating tournament slot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
