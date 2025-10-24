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

    // Authorization: Only admin or auction creator (host) can undo replacements
    const isAdmin = user.role === 'admin'
    const isHost = user.role === 'host' && auction.created_by === user.id
    
    if (!isAdmin && !isHost) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Validate that auction is completed
    if (auction.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Replacement undo is only allowed for completed auctions' 
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

    // Check if player is actually replaced
    if (!auctionPlayer.is_replaced || !auctionPlayer.replaced_by) {
      return NextResponse.json({ 
        error: 'This player has not been replaced' 
      }, { status: 400 })
    }

    // Start transaction: Restore original player and remove replacement
    // 1. Restore the original player (unmark as replaced)
    const { error: restoreError } = await supabase
      .from('auction_players')
      .update({
        is_replaced: false,
        replaced_by: null,
        replaced_at: null,
        replaced_by_user: null,
        replacement_reason: null
      })
      .eq('id', auction_player_id)

    if (restoreError) {
      logger.error('Error restoring original player:', restoreError)
      return NextResponse.json({ error: 'Failed to restore original player' }, { status: 500 })
    }

    // 2. Remove the replacement player (set back to available or delete)
    // Find the replacement player's auction_player record
    const { data: replacementRecord } = await supabase
      .from('auction_players')
      .select('id')
      .eq('auction_id', auctionId)
      .eq('player_id', auctionPlayer.replaced_by)
      .eq('sold_to', auctionPlayer.sold_to)
      .single()

    if (replacementRecord) {
      // Set replacement player back to available status
      const { error: removeError } = await supabase
        .from('auction_players')
        .update({
          status: 'available',
          sold_to: null,
          sold_price: null,
          sold_at: null
        })
        .eq('id', replacementRecord.id)

      if (removeError) {
        logger.error('Error removing replacement player:', removeError)
        // Don't fail the whole operation if this fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Replacement undone successfully' 
    })

  } catch (error) {
    logger.error('Error in POST /api/auctions/[id]/undo-replacement:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
