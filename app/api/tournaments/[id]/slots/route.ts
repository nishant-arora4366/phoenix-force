import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics';
import { createClient } from '@supabase/supabase-js'
import { sessionManager } from '@/src/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Public GET handler - no authentication required to view tournament slots
async function getHandlerPublic(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    
    // Extract optional user info from Authorization header (if present)
    let sessionUser: AuthenticatedUser | null = null
    const authHeader = request.headers.get('authorization')
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const { verifyToken } = await import('@/src/lib/jwt')
        const decoded = verifyToken(token)
        if (decoded) {
          // Fetch user details from database
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, username, firstname, lastname, role, status')
            .eq('id', decoded.userId)
            .single()
          
          if (userData) {
            sessionUser = userData as AuthenticatedUser
          }
        }
      } catch {
        // Ignore token validation errors for public endpoint
      }
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

    // Check if user is host or admin (optional, for logged-in users)
    let isHost = false
    let isAdmin = false
    
    if (sessionUser) {
      isHost = tournament.host_id === sessionUser.id
      isAdmin = sessionUser.role === 'admin'
    }

    // All users (authenticated and unauthenticated) can view tournament slots
    // Only hosts and admins can manage slots (checked in PUT method)

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

    if (allSlotsError) {
      console.error('Error fetching all slots:', allSlotsError)
      return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 })
    }

    console.log('All slots from database:', allSlotsData?.length || 0)
    
    const totalSlots = tournament.total_slots
    
    // Simple FCFS system - calculate positions based on requested_at timestamp
    const allSlotsWithPlayers = allSlotsData?.filter(slot => slot.player_id && slot.requested_at) || []
    
    // Sort all slots by requested_at (FCFS) - earliest first
    // Use slot ID as secondary sort key for stable ordering when timestamps are identical
    const sortedSlots = allSlotsWithPlayers.sort((a, b) => {
      const timeA = new Date(a.requested_at).getTime()
      const timeB = new Date(b.requested_at).getTime()
      
      // If timestamps are identical, sort by slot ID for consistent ordering
      if (timeA === timeB) {
        return a.id.localeCompare(b.id)
      }
      
      return timeA - timeB
    })
    
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
async function putHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId} = await params
    
    // User is already authenticated via withAuth middleware
    // The 'user' parameter contains the verified user from JWT
    const sessionUser = user
    
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

    // Check if user is host or admin (user is already authenticated via middleware)
    const isHost = tournament.host_id === sessionUser.id
    const isAdmin = sessionUser.role === 'admin'

    // All authenticated users can view tournament slots
    // Only hosts and admins can manage slots
    if (!isHost && !isAdmin && sessionUser.role !== 'viewer') {
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

// Public wrapper for GET - no authentication required
async function getWrapperPublic(request: NextRequest) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const tournamentId = pathParts[pathParts.length - 2] // Get the tournament ID from the path
  if (!tournamentId) {
    return NextResponse.json({ error: 'Tournament ID required' }, { status: 400 })
  }
  return getHandlerPublic(request, { params: Promise.resolve({ id: tournamentId }) })
}

async function putWrapper(request: NextRequest, user: AuthenticatedUser) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const tournamentId = pathParts[pathParts.length - 2] // Get the tournament ID from the path
  if (!tournamentId) {
    return NextResponse.json({ error: 'Tournament ID required' }, { status: 400 })
  }
  return putHandler(request, user, { params: Promise.resolve({ id: tournamentId }) })
}

// Export the handlers with analytics
// GET is public - anyone can view tournament slots
export const GET = withAnalytics(getWrapperPublic)
// PUT requires authentication - only hosts and admins can manage slots
export const PUT = withAnalytics(withAuth(putWrapper, ['viewer', 'host', 'admin']))
