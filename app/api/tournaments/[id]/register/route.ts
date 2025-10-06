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

    // Get user profile to check if they're approved
    const userResponse = await fetch(`${request.nextUrl.origin}/api/user-profile?userId=${sessionUser.id}`)
    const userResult = await userResponse.json()
    
    if (!userResult.success || userResult.data.status !== 'approved') {
      return NextResponse.json({ error: 'User not approved for registration' }, { status: 403 })
    }

    // Check if tournament exists and registration is open
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    console.log('Tournament status:', tournament.status)
    if (tournament.status !== 'registration_open') {
      return NextResponse.json({ error: 'Tournament registration is not open' }, { status: 400 })
    }

    // Check if user already has a player profile
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', sessionUser.id)
      .single()

    if (playerError || !player) {
      console.error('Player profile error:', playerError)
      console.error('User ID:', sessionUser.id)
      console.error('Player found:', !!player)
      return NextResponse.json({ error: 'Player profile not found. Please create a player profile first.' }, { status: 400 })
    }

    // Check if player is already registered for this tournament
    const { data: existingSlot, error: existingError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('player_id', player.id)
      .single()

    if (existingSlot) {
      return NextResponse.json({ error: 'Player already registered for this tournament' }, { status: 400 })
    }

    // Check available slots
    const { data: filledSlots, error: slotsError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .in('status', ['pending', 'confirmed'])
      .order('slot_number')

    if (slotsError) {
      console.error('Error fetching filled slots:', slotsError)
      return NextResponse.json({ error: 'Error checking tournament slots' }, { status: 500 })
    }

    console.log('Filled slots from database:', filledSlots)
    const filledSlotNumbers = filledSlots?.map(slot => slot.slot_number) || []
    console.log('Filled slot numbers array:', filledSlotNumbers)
    const totalSlots = tournament.total_slots
    const waitlistSlots = 10 // Additional waitlist slots
    const maxSlots = totalSlots + waitlistSlots

    let slotNumber = 1
    let status = 'pending'

    // Find next available slot
    console.log('Filled slot numbers:', filledSlotNumbers)
    console.log('Total slots:', totalSlots)
    console.log('Max slots:', maxSlots)
    
    // Find the first available slot number
    for (let i = 1; i <= maxSlots; i++) {
      if (!filledSlotNumbers.includes(i)) {
        slotNumber = i
        break
      }
    }
    
    console.log('Selected slot number:', slotNumber)

    if (slotNumber > maxSlots) {
      return NextResponse.json({ error: 'Tournament is full and waitlist is full' }, { status: 400 })
    }

    // Double-check that the selected slot is actually available
    if (filledSlotNumbers.includes(slotNumber)) {
      console.error('Selected slot number is already filled:', slotNumber)
      console.error('Filled slots:', filledSlotNumbers)
      return NextResponse.json({ error: 'Selected slot is already taken. Please try again.' }, { status: 400 })
    }

    // If slot is beyond tournament slots, it's waitlist
    if (slotNumber > totalSlots) {
      status = 'waitlist'
    }

    // Register player for slot
    const { data: slot, error: registerError } = await supabase
      .from('tournament_slots')
      .insert({
        tournament_id: tournamentId,
        slot_number: slotNumber,
        player_id: player.id,
        status: status,
        requested_at: new Date().toISOString()
      })
      .select()
      .single()

    if (registerError) {
      console.error('Registration insert error:', registerError)
      console.error('Tournament ID:', tournamentId)
      console.error('Player ID:', player.id)
      console.error('Slot number:', slotNumber)
      console.error('Status:', status)
      
      // Check for specific constraint violations
      if (registerError.code === '23505') {
        if (registerError.message.includes('unique_tournament_player')) {
          return NextResponse.json({ error: 'Player already registered for this tournament' }, { status: 400 })
        } else if (registerError.message.includes('unique_tournament_slot')) {
          return NextResponse.json({ error: 'Slot number already taken' }, { status: 400 })
        }
      }
      
      return NextResponse.json({ error: 'Failed to register for tournament slot', details: registerError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: status === 'waitlist' 
        ? `Registered for waitlist position ${slotNumber - totalSlots}`
        : `Registered for slot ${slotNumber}`,
      slot: slot
    })

  } catch (error: any) {
    console.error('Error registering for tournament:', error)
    console.error('Error details:', error.message, error.stack)
    return NextResponse.json({ error: `Internal server error: ${error.message}` }, { status: 500 })
  }
}

export async function DELETE(
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

    // Get user's player profile
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', sessionUser.id)
      .single()

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player profile not found' }, { status: 400 })
    }

    // Find and remove player's registration
    const { data: slot, error: slotError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('player_id', player.id)
      .single()

    if (slotError || !slot) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    // Remove the registration
    const { error: deleteError } = await supabase
      .from('tournament_slots')
      .delete()
      .eq('id', slot.id)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to cancel registration' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Registration cancelled successfully'
    })

  } catch (error: any) {
    console.error('Error cancelling tournament registration:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
