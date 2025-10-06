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
    
    console.log('User profile check result:', userResult)
    console.log('User data:', userResult.data)
    console.log('User status:', userResult.data?.status)
    
    if (!userResult.success) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }
    
    // For now, allow any user to register (remove approval check for testing)
    // if (userResult.data.status !== 'approved') {
    //   return NextResponse.json({ error: 'User not approved for registration' }, { status: 403 })
    // }

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
    console.log('Tournament total_slots:', tournament.total_slots)
    if (tournament.status !== 'registration_open') {
      return NextResponse.json({ error: 'Tournament registration is not open' }, { status: 400 })
    }

    // Debug: Check existing slots for this tournament
    const { data: existingSlots, error: slotsError } = await supabase
      .from('tournament_slots')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('slot_number')

    console.log('Existing slots for tournament:', existingSlots?.length || 0)
    console.log('Slot details:', existingSlots?.map(s => ({ slot_number: s.slot_number, status: s.status, player_id: s.player_id })))

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

    // Slot assignment with retry logic
    const maxRetries = 3
    const baseDelay = 100 // Base delay in milliseconds
    let lastError: any = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Registration attempt ${attempt}/${maxRetries}`)
        
        // Get fresh slot count for this attempt - only count slots with players
        const { data: currentSlots, error: slotsError } = await supabase
          .from('tournament_slots')
          .select('*')
          .eq('tournament_id', tournamentId)
          .not('player_id', 'is', null)
          .order('slot_number')

        if (slotsError) {
          console.error('Failed to get current slots:', slotsError)
          lastError = slotsError
          continue
        }

        // Find the next available slot number
        const existingSlotNumbers = currentSlots?.map(s => s.slot_number) || []
        let nextSlotNumber = 1
        
        // Find the first available slot number
        while (existingSlotNumbers.includes(nextSlotNumber)) {
          nextSlotNumber++
        }
        
        const isWaitlist = nextSlotNumber > tournament.total_slots
        
        console.log('Attempting to register:', {
          nextSlotNumber,
          isWaitlist,
          currentSlotsCount: currentSlots?.length || 0,
          tournamentTotalSlots: tournament.total_slots
        })
        
        // Update existing empty slot
        const { data: slot, error: registerError } = await supabase
          .from('tournament_slots')
          .update({
            player_id: player.id,
            status: isWaitlist ? 'waitlist' : 'pending',
            requested_at: new Date().toISOString()
          })
          .eq('tournament_id', tournamentId)
          .eq('slot_number', nextSlotNumber)
          .is('player_id', null) // Only update empty slots
          .select()
          .single()

        if (registerError) {
          console.error(`Registration attempt ${attempt} failed:`, registerError)
          lastError = registerError
          
          // Check for specific constraint violations
          if (registerError.code === '23505') {
            if (registerError.message.includes('unique_tournament_player')) {
              return NextResponse.json({ error: 'Player already registered for this tournament' }, { status: 400 })
            } else if (registerError.message.includes('unique_tournament_slot')) {
              // Slot conflict - retry with exponential backoff
              if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100
                console.log(`Slot conflict detected, retrying in ${delay}ms...`)
                await new Promise(resolve => setTimeout(resolve, delay))
                continue
              } else {
                return NextResponse.json({ error: 'Slot number already taken. Please try again.' }, { status: 400 })
              }
            }
          }
          
          // For other errors, don't retry
          if (attempt === maxRetries) {
            return NextResponse.json({ error: `Failed to register for tournament slot: ${registerError.message}` }, { status: 500 })
          }
        } else {
          // Success!
          console.log('Registration successful:', slot)
          return NextResponse.json({
            success: true,
            message: isWaitlist 
              ? `Registered for waitlist position ${nextSlotNumber - tournament.total_slots}`
              : `Registered for slot ${nextSlotNumber}`,
            slot: slot
          })
        }
      } catch (error) {
        console.error(`Registration attempt ${attempt} exception:`, error)
        lastError = error
        
        if (attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 100
          console.log(`Exception occurred, retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // If we get here, all retries failed
    console.error('All registration attempts failed')
    return NextResponse.json({ 
      error: `Failed to register after multiple attempts: ${lastError?.message || 'Unknown error'}`,
      details: lastError?.message 
    }, { status: 500 })

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

    // Clear the slot (make it empty) instead of deleting it
    const { error: updateError } = await supabase
      .from('tournament_slots')
      .update({
        player_id: null,
        status: 'empty',
        requested_at: null,
        confirmed_at: null
      })
      .eq('id', slot.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to cancel registration' }, { status: 500 })
    }

    // Try to promote a waitlist player to the now-empty main slot
    const { data: promotionResult, error: promotionError } = await supabase
      .rpc('manual_promote_waitlist', { p_tournament_id: tournamentId })

    if (promotionError) {
      console.error('Error promoting waitlist player:', promotionError)
    } else if (promotionResult && promotionResult.length > 0 && promotionResult[0].success) {
      console.log('Successfully promoted waitlist player:', promotionResult[0])
      
      // Send notification to the promoted player
      await supabase
        .from('notifications')
        .insert({
          user_id: promotionResult[0].promoted_player_id,
          type: 'waitlist_promotion',
          title: 'You have been promoted from the waitlist!',
          message: `You have been promoted to position ${promotionResult[0].new_slot_number} in the tournament. Please wait for host approval.`,
          data: {
            tournament_id: tournamentId,
            new_slot_number: promotionResult[0].new_slot_number,
            promoted_at: new Date().toISOString()
          }
        })
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
