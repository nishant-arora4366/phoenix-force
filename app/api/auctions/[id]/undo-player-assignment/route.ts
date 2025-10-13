import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/src/lib/jwt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check user role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user || (user.role !== 'admin' && user.role !== 'host')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get auction details to check status
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('status')
      .eq('id', auctionId)
      .single()

    if (auctionError || !auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    // Check if auction is in live status
    if (auction.status !== 'live') {
      return NextResponse.json({ 
        error: `Cannot undo player assignment. Auction is currently ${auction.status}. Please start the auction first.` 
      }, { status: 400 })
    }

    // Find the most recently sold player (last player assignment)
    const { data: lastSoldPlayer, error: lastSoldError } = await supabase
      .from('auction_players')
      .select(`
        *,
        auction_teams!inner(
          id,
          team_name,
          captain_id,
          players_count,
          total_spent,
          remaining_purse
        )
      `)
      .eq('auction_id', auctionId)
      .eq('status', 'sold')
      .order('sold_at', { ascending: false })
      .limit(1)
      .single()

    if (lastSoldError || !lastSoldPlayer) {
      return NextResponse.json({ error: 'No player assignments to undo' }, { status: 404 })
    }

    // Get the team that bought this player
    const team = lastSoldPlayer.auction_teams

    // Start a transaction to undo the player assignment
    const { error: undoError } = await supabase
      .from('auction_players')
      .update({
        status: 'available',
        sold_to: null,
        sold_price: null,
        sold_at: null,
        current_player: false
      })
      .eq('auction_id', auctionId)
      .eq('player_id', lastSoldPlayer.player_id)

    if (undoError) {
      console.error('Error undoing player assignment:', undoError)
      return NextResponse.json({ error: 'Failed to undo player assignment' }, { status: 500 })
    }

    // Update team statistics - refund the money and decrease player count
    const { error: teamUpdateError } = await supabase
      .from('auction_teams')
      .update({
        players_count: Math.max(0, (team.players_count || 0) - 1),
        total_spent: Math.max(0, (team.total_spent || 0) - (lastSoldPlayer.sold_price || 0)),
        remaining_purse: (team.remaining_purse || 0) + (lastSoldPlayer.sold_price || 0)
      })
      .eq('auction_id', auctionId)
      .eq('id', team.id)

    if (teamUpdateError) {
      console.error('Error updating team statistics:', teamUpdateError)
      return NextResponse.json({ error: 'Failed to update team statistics' }, { status: 500 })
    }

    // Mark all bids for this player as undone since the player is no longer sold
    const { error: bidsUndoError } = await supabase
      .from('auction_bids')
      .update({
        is_undone: true,
        undone_at: new Date().toISOString(),
        undone_by: decoded.userId
      })
      .eq('auction_id', auctionId)
      .eq('player_id', lastSoldPlayer.player_id)
      .eq('is_undone', false)

    if (bidsUndoError) {
      console.error('Error undoing bids:', bidsUndoError)
      // Don't fail the entire operation, just log the error
    }

    // Set the undone player as the current player so host can continue from there
    const { error: setCurrentError } = await supabase
      .from('auction_players')
      .update({ current_player: true })
      .eq('auction_id', auctionId)
      .eq('player_id', lastSoldPlayer.player_id)

    if (setCurrentError) {
      console.error('Error setting undone player as current:', setCurrentError)
      // Don't fail the entire operation, just log the error
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Player assignment undone successfully',
      data: {
        player_id: lastSoldPlayer.player_id,
        team_id: team.id,
        refunded_amount: lastSoldPlayer.sold_price
      }
    })
  } catch (error) {
    console.error('Error in undo-player-assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
