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
    const { 
      team_id, 
      player_to_replace_id, 
      replacement_player_id, 
      reason 
    } = body

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

    // Authorization: Only admin or auction creator (host) can replace players
    const isAdmin = user.role === 'admin'
    const isHost = user.role === 'host' && auction.created_by === user.id
    
    if (!isAdmin && !isHost) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate that auction is completed
    if (auction.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Player replacement is only allowed for completed auctions' 
      }, { status: 400 })
    }

    // Validate that player_to_replace exists and belongs to the team
    // player_to_replace_id is the auction_player ID, not the player_id
    const { data: playerToReplace, error: playerError } = await supabase
      .from('auction_players')
      .select('*')
      .eq('id', player_to_replace_id)
      .eq('auction_id', auctionId)
      .eq('sold_to', team_id)
      .eq('status', 'sold')
      .single()

    if (playerError || !playerToReplace) {
      logger.error('Player to replace not found:', { player_to_replace_id, team_id, auctionId, error: playerError })
      return NextResponse.json({ 
        error: 'Player to replace not found in this team' 
      }, { status: 404 })
    }

    // Check if player is already replaced
    if (playerToReplace.is_replaced) {
      return NextResponse.json({ 
        error: 'This player has already been replaced' 
      }, { status: 400 })
    }

    // Validate that replacement player exists in the players table
    const { data: replacementPlayer, error: replacementError } = await supabase
      .from('players')
      .select('id')
      .eq('id', replacement_player_id)
      .single()

    if (replacementError || !replacementPlayer) {
      return NextResponse.json({ 
        error: 'Replacement player not found' 
      }, { status: 404 })
    }

    // Check if replacement player is already in the auction
    const { data: existingAuctionPlayer, error: existingError } = await supabase
      .from('auction_players')
      .select('id, status, sold_to')
      .eq('auction_id', auctionId)
      .eq('player_id', replacement_player_id)
      .maybeSingle()

    if (existingAuctionPlayer) {
      if (existingAuctionPlayer.status === 'sold' && existingAuctionPlayer.sold_to) {
        return NextResponse.json({ 
          error: 'Replacement player is already sold to a team' 
        }, { status: 400 })
      }
    }

    // Start transaction: Mark old player as replaced and add new player
    // 1. Mark the old player as replaced
    const { error: updateError } = await supabase
      .from('auction_players')
      .update({
        is_replaced: true,
        replaced_by: replacement_player_id,
        replaced_at: new Date().toISOString(),
        replaced_by_user: user.id,
        replacement_reason: reason || null
      })
      .eq('id', playerToReplace.id)

    if (updateError) {
      logger.error('Error marking player as replaced:', updateError)
      return NextResponse.json({ error: 'Failed to mark player as replaced' }, { status: 500 })
    }

    // 2. Add or update the replacement player
    if (existingAuctionPlayer) {
      // Update existing auction_player record
      const { error: replaceError } = await supabase
        .from('auction_players')
        .update({
          status: 'sold',
          sold_to: team_id,
          sold_price: 0, // Replacement players are added at 0 cost
          sold_at: new Date().toISOString()
        })
        .eq('id', existingAuctionPlayer.id)

      if (replaceError) {
        logger.error('Error updating replacement player:', replaceError)
        return NextResponse.json({ error: 'Failed to add replacement player' }, { status: 500 })
      }
    } else {
      // Create new auction_player record only if player doesn't exist in auction at all
      const { error: insertError } = await supabase
        .from('auction_players')
        .insert({
          auction_id: auctionId,
          player_id: replacement_player_id,
          status: 'sold',
          sold_to: team_id,
          sold_price: 0,
          sold_at: new Date().toISOString(),
          display_order: playerToReplace.display_order // Use the same display order as the replaced player
        })

      if (insertError) {
        logger.error('Error inserting replacement player:', insertError)
        return NextResponse.json({ error: 'Failed to add replacement player' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Player replaced successfully' 
    })

  } catch (error) {
    logger.error('Error in POST /api/auctions/[id]/replace-player:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
