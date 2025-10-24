import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

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
    const body = await request.json()
    const { auction_player_id } = body

    // Authenticate user using auth middleware
    const user = await import('@/src/lib/auth-middleware').then(m => m.authenticateRequest(request))
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get auction details
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('created_by, status')
      .eq('id', auctionId)
      .single()

    if (auctionError || !auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    // Authorization: Only admin or auction creator (host) can remove players
    const isAdmin = user.role === 'admin'
    const isHost = user.role === 'host' && auction.created_by === user.id
    
    if (!isAdmin && !isHost) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate that auction is completed
    if (auction.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Player removal is only allowed for completed auctions' 
      }, { status: 400 })
    }

    // Get the auction_player record
    const { data: auctionPlayer, error: playerError } = await supabase
      .from('auction_players')
      .select('*')
      .eq('id', auction_player_id)
      .eq('auction_id', auctionId)
      .single()

    if (playerError || !auctionPlayer) {
      return NextResponse.json({ 
        error: 'Auction player not found' 
      }, { status: 404 })
    }

    // Check if player is sold to a team
    if (auctionPlayer.status !== 'sold' || !auctionPlayer.sold_to) {
      return NextResponse.json({ 
        error: 'Player is not assigned to any team' 
      }, { status: 400 })
    }

    const teamId = auctionPlayer.sold_to
    const soldPrice = auctionPlayer.sold_price || 0

    // Remove player from team (set back to available)
    const { error: removeError } = await supabase
      .from('auction_players')
      .update({
        status: 'available',
        sold_to: null,
        sold_price: null,
        sold_at: null,
        // Also clear replacement fields if this was a replacement
        is_replaced: false,
        replaced_by: null,
        replaced_at: null,
        replaced_by_user: null,
        replacement_reason: null
      })
      .eq('id', auction_player_id)

    if (removeError) {
      logger.error('Error removing player:', removeError)
      return NextResponse.json({ error: 'Failed to remove player' }, { status: 500 })
    }

    // Update team's spent amount and remaining purse
    const { data: team, error: teamFetchError } = await supabase
      .from('auction_teams')
      .select('total_spent, remaining_purse, max_purse')
      .eq('id', teamId)
      .single()

    if (!teamFetchError && team) {
      const newTotalSpent = Math.max(0, (team.total_spent || 0) - soldPrice)
      const newRemainingPurse = (team.max_purse || 0) - newTotalSpent

      await supabase
        .from('auction_teams')
        .update({
          total_spent: newTotalSpent,
          remaining_purse: newRemainingPurse
        })
        .eq('id', teamId)
    }

    // If this player was replacing someone, restore the original player
    const { data: replacedPlayers } = await supabase
      .from('auction_players')
      .select('id')
      .eq('auction_id', auctionId)
      .eq('replaced_by', auctionPlayer.player_id)
      .eq('is_replaced', true)

    if (replacedPlayers && replacedPlayers.length > 0) {
      // Restore the original player(s)
      await supabase
        .from('auction_players')
        .update({
          is_replaced: false,
          replaced_by: null,
          replaced_at: null,
          replaced_by_user: null,
          replacement_reason: null
        })
        .in('id', replacedPlayers.map(p => p.id))
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Player removed successfully' 
    })

  } catch (error) {
    logger.error('Error in POST /api/auctions/[id]/remove-player:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
