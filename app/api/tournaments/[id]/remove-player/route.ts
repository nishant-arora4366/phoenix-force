import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function POSTHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    const { slotId } = await request.json()
    
    if (!slotId) {
      return NextResponse.json({ error: 'Slot ID is required' }, { status: 400 })
    }
    
    // User is already authenticated via withAuth middleware
    const sessionUser = user
    
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

    const isHost = tournament.host_id === sessionUser.id
    const isAdmin = sessionUser.role === 'admin'

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
          user_id
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

    // Record the removal in tournament_players_left table
    const { error: recordError } = await supabase
      .from('tournament_players_left')
      .insert({
        tournament_id: tournamentId,
        player_id: slot.player_id,
        player_name: slot.players?.display_name || 'Unknown Player',
        player_photo_url: slot.players?.profile_pic_url,
        left_reason: 'removed',
        left_by: sessionUser.id, // user who removed the player
        slot_created_at: slot.created_at
      })

    if (recordError) {
      console.error('Failed to record player removal:', recordError)
      // Continue with deletion even if recording fails
    }

    // Delete the slot record entirely in dynamic slot system
    const { error: deleteError } = await supabase
      .from('tournament_slots')
      .delete()
      .eq('id', slotId)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete slot' }, { status: 500 })
    }

    // No auto-promotion needed - positions are calculated dynamically in frontend

    // Send notification to the removed player (if they have a user account)
    if (slot.players?.user_id) {
      await supabase
        .from('notifications')
        .insert({
          user_id: slot.players.user_id,
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Wrapper function to match middleware expectations
async function postWrapper(request: NextRequest, user: AuthenticatedUser) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const tournamentId = pathParts[pathParts.length - 2] // Get the tournament ID from the path
  if (!tournamentId) {
    return NextResponse.json({ error: 'Tournament ID required' }, { status: 400 })
  }
  return POSTHandler(request, user, { params: Promise.resolve({ id: tournamentId }) })
}

// Export the handlers with analytics
export const POST = withAnalytics(withAuth(postWrapper, ['viewer', 'host', 'admin']))
