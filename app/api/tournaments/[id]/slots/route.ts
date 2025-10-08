import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sessionManager } from '@/src/lib/session'

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
    
    // Get user from Authorization header instead of sessionManager
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

    // Check if user is host or admin
    const userResponse = await fetch(`${request.nextUrl.origin}/api/user-profile?userId=${sessionUser.id}`)
    const userResult = await userResponse.json()
    
    if (!userResult.success) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const isHost = tournament.host_id === sessionUser.id
    const isAdmin = userResult.data.role === 'admin'

    // All authenticated users can view tournament slots
    // Only hosts and admins can manage slots (checked later in PUT method)

    // Get all existing slots from database (dynamically created)
    const { data: allSlotsData, error: allSlotsError } = await supabase
      .from('tournament_slots')
      .select(`
        *,
        players (
          id,
          display_name,
          user_id
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('requested_at')

    if (allSlotsError) {
      console.error('Error fetching all slots:', allSlotsError)
      return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 })
    }

    console.log('All slots from database:', allSlotsData?.length || 0)
    
    const totalSlots = tournament.total_slots
    
    // Simple FCFS system - calculate positions based on requested_at timestamp
    const allSlotsWithPlayers = allSlotsData?.filter(slot => slot.player_id) || []
    
    // Sort all slots by requested_at (FCFS)
    const sortedSlots = allSlotsWithPlayers.sort((a, b) => 
      new Date(a.requested_at).getTime() - new Date(b.requested_at).getTime()
    )
    
    // Assign positions dynamically based on FCFS order
    const slotsWithPositions = sortedSlots.map((slot, index) => {
      const position = index + 1 // Position in FCFS order
      const isMainSlot = position <= totalSlots
      const waitlistPosition = isMainSlot ? null : position - totalSlots
      
      return {
        ...slot,
        position,
        is_main_slot: isMainSlot,
        waitlist_position: waitlistPosition,
        players: slot.players
      }
    })

    // Create slot display using dynamic positions
    const allSlots = []
    
    // Add main slots (positions 1 to total_slots)
    for (let i = 1; i <= totalSlots; i++) {
      const slotAtPosition = slotsWithPositions.find(s => s.position === i)
      if (slotAtPosition) {
        // Slot exists and is filled
        allSlots.push(slotAtPosition)
      } else {
        // Slot doesn't exist yet - show as available
        allSlots.push({
          id: `available-${i}`,
          tournament_id: tournamentId,
          position: i,
          player_id: null,
          status: 'available',
          is_host_assigned: false,
          requested_at: null,
          confirmed_at: null,
          created_at: null,
          is_main_slot: true,
          waitlist_position: null,
          players: null
        })
      }
    }
    
    // Add waitlist slots (positions > total_slots)
    const waitlistSlots = slotsWithPositions.filter(s => !s.is_main_slot)
    waitlistSlots.forEach(slot => {
      allSlots.push(slot)
    })
    
    // Add next available waitlist position if there are waitlist players
    if (waitlistSlots.length > 0) {
      const nextWaitlistPosition = waitlistSlots.length + 1
      allSlots.push({
        id: `available-waitlist-${nextWaitlistPosition}`,
        tournament_id: tournamentId,
        position: totalSlots + nextWaitlistPosition,
        player_id: null,
        status: 'available',
        is_host_assigned: false,
        requested_at: null,
        confirmed_at: null,
        created_at: null,
        is_main_slot: false,
        waitlist_position: nextWaitlistPosition,
        players: null
      })
    }

    console.log('Processed slots:', allSlots.length)
    console.log('Main slots:', allSlots.filter(s => s.is_main_slot).length)
    console.log('Waitlist slots:', allSlots.filter(s => !s.is_main_slot).length)
    
    return NextResponse.json({
      success: true,
      tournament: tournament,
      slots: allSlots,
      stats: {
        total_slots: totalSlots,
        waitlist_slots: waitlistSlots,
        filled_main_slots: allSlots.filter(s => s.is_main_slot && s.player_id !== null).length,
        filled_waitlist_slots: allSlots.filter(s => !s.is_main_slot && s.player_id !== null).length,
        pending_approvals: allSlots.filter(s => s.status === 'pending').length
      }
    })

  } catch (error: any) {
    console.error('Error fetching tournament slots:', error)
    console.error('Error details:', error.message, error.stack)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}

// Approve or reject a slot registration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    
    // Get user from Authorization header instead of sessionManager
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

    // All authenticated users can view tournament slots
    // Only hosts and admins can manage slots
    if (!isHost && !isAdmin && userResult.data.role !== 'viewer') {
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
