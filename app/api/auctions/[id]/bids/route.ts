import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/src/lib/jwt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('player_id')
    
    // First, get the auction teams to map team_id to team_name
    const { data: auctionTeams, error: teamsError } = await supabase
      .from('auction_teams')
      .select('id, team_name')
      .eq('auction_id', auctionId)

    if (teamsError) {
      console.error('Error fetching auction teams:', teamsError)
      return NextResponse.json({ error: 'Failed to fetch auction teams' }, { status: 500 })
    }

    // Create a map of team_id to team_name
    const teamNameMap = new Map()
    auctionTeams?.forEach(team => {
      teamNameMap.set(team.id, team.team_name)
    })

    // Build the query for bids
    let query = supabase
      .from('auction_bids')
      .select(`
        id,
        auction_id,
        player_id,
        team_id,
        bid_amount,
        is_winning_bid,
        is_undone,
        created_at
      `)
      .eq('auction_id', auctionId)
      .eq('is_undone', false)
    
    // Filter by player_id if provided
    if (playerId) {
      query = query.eq('player_id', playerId)
    }
    
    const { data: bids, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching bids:', error)
      return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 })
    }


    // Transform the data to match frontend expectations
    const transformedBids = bids?.map(bid => ({
      id: bid.id,
      auction_id: bid.auction_id,
      player_id: bid.player_id,
      team_id: bid.team_id,
      team_name: teamNameMap.get(bid.team_id) || 'Unknown Team',
      bid_amount: bid.bid_amount,
      is_winning_bid: bid.is_winning_bid,
      is_undone: bid.is_undone,
      timestamp: bid.created_at
    })) || []

    return NextResponse.json(transformedBids)
  } catch (error) {
    console.error('Error in GET /api/auctions/[id]/bids:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params
    const body = await request.json()
    const { team_id, bid_amount } = body

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

    // Get auction details
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', auctionId)
      .single()

    if (auctionError || !auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    // Check if auction is in live status
    if (auction.status !== 'live') {
      return NextResponse.json({ 
        error: `Cannot place bids. Auction is currently ${auction.status}. Please start the auction first.` 
      }, { status: 400 })
    }

    // Get current player
    const { data: currentPlayer, error: playerError } = await supabase
      .from('auction_players')
      .select('*')
      .eq('auction_id', auctionId)
      .eq('current_player', true)
      .single()

    if (playerError || !currentPlayer) {
      return NextResponse.json({ error: 'No current player found' }, { status: 400 })
    }

    // Get team details
    const { data: team, error: teamError } = await supabase
      .from('auction_teams')
      .select('*')
      .eq('id', team_id)
      .eq('auction_id', auctionId)
      .single()

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Validate bid amount
    if (bid_amount <= 0) {
      return NextResponse.json({ error: 'Bid amount must be positive' }, { status: 400 })
    }

    // Get current highest bid for this player
    const { data: currentBids, error: bidsError } = await supabase
      .from('auction_bids')
      .select('bid_amount')
      .eq('auction_id', auctionId)
      .eq('player_id', currentPlayer.player_id)
      .eq('is_winning_bid', true)
      .eq('is_undone', false)
      .order('created_at', { ascending: false })
      .limit(1)

    const hasExistingBid = currentBids && currentBids.length > 0
    const currentBid = hasExistingBid ? currentBids[0].bid_amount : null

    // Determine starting bid for first bid scenario
    let startingBid = auction.min_bid_amount || 0
    if (auction.use_base_price) {
      // Best-effort: try to fetch player's base price; fall back to min if unavailable
      try {
        const { data: basePriceRows } = await supabase
          .from('player_skill_assignments')
          .select('player_skills(skill_name), player_skill_values(value_name)')
          .eq('player_id', currentPlayer.player_id)
          .limit(20)
        const basePriceRow = (basePriceRows as any[] | null)?.find((r: any) => r.player_skills?.skill_name === 'Base Price')
        const rawValue = (basePriceRow && (basePriceRow as any).player_skill_values 
          && (basePriceRow as any).player_skill_values[0]
          ? (basePriceRow as any).player_skill_values[0].value_name as string
          : undefined)
        const parsed = rawValue ? parseInt(rawValue) : NaN
        if (!isNaN(parsed)) {
          startingBid = Math.max(startingBid, parsed)
        }
      } catch (_) {
        // ignore and use min bid
      }
    }

    if (!hasExistingBid) {
      if (bid_amount < startingBid) {
        return NextResponse.json({ error: `First bid must be at least ₹${startingBid}` }, { status: 400 })
      }
    } else {
      if (bid_amount <= (currentBid as number)) {
        return NextResponse.json({ error: 'Bid must be higher than current bid' }, { status: 400 })
      }
    }

    // Check if team can afford the bid
    if (team.remaining_purse < bid_amount) {
      return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 })
    }

    // Start transaction
    const { data: newBid, error: bidInsertError } = await supabase
      .from('auction_bids')
      .insert({
        auction_id: auctionId,
        player_id: currentPlayer.player_id,
        team_id: team_id,
        bid_amount: bid_amount,
        is_winning_bid: true,
        is_undone: false
      })
      .select()
      .single()

    if (bidInsertError) {
      console.error('Error inserting bid:', bidInsertError)
      return NextResponse.json({ error: 'Failed to place bid' }, { status: 500 })
    }

    // Set all previous bids for this player as not winning
    const { error: updatePreviousBidsError } = await supabase
      .from('auction_bids')
      .update({ is_winning_bid: false })
      .eq('auction_id', auctionId)
      .eq('player_id', currentPlayer.player_id)
      .neq('id', newBid.id)

    if (updatePreviousBidsError) {
      console.error('Error updating previous bids:', updatePreviousBidsError)
    }

    // Note: Team purse is not updated during bidding - only when player is sold

    return NextResponse.json({ 
      success: true, 
      bid: newBid,
      message: 'Bid placed successfully' 
    })
  } catch (error) {
    console.error('Error in POST /api/auctions/[id]/bids:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params
    const { searchParams } = new URL(request.url)
    const bidId = searchParams.get('bidId')

    if (!bidId) {
      return NextResponse.json({ error: 'Bid ID is required' }, { status: 400 })
    }

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
        error: `Cannot undo bid. Auction is currently ${auction.status}. Please start the auction first.` 
      }, { status: 400 })
    }

    // Get the bid to undo
    const { data: bid, error: bidError } = await supabase
      .from('auction_bids')
      .select('*')
      .eq('id', bidId)
      .eq('auction_id', auctionId)
      .eq('is_winning_bid', true)
      .eq('is_undone', false)
      .single()

    if (bidError || !bid) {
      console.error('Bid not found:', bidError)
      return NextResponse.json({ error: 'Bid not found or already undone' }, { status: 404 })
    }

    // Mark the bid as undone
    const { error: undoError } = await supabase
      .from('auction_bids')
      .update({ 
        is_undone: true,
        undone_at: new Date().toISOString(),
        undone_by: decoded.userId
      })
      .eq('id', bidId)

    if (undoError) {
      console.error('Error undoing bid:', undoError)
      return NextResponse.json({ error: 'Failed to undo bid' }, { status: 500 })
    }

    // Note: No purse refund needed - team purse is only affected when players are sold

    // Find the previous highest bid for this player and make it winning
    const { data: previousBids, error: prevBidsError } = await supabase
      .from('auction_bids')
      .select('*')
      .eq('auction_id', auctionId)
      .eq('player_id', bid.player_id)
      .eq('is_undone', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (prevBidsError) {
      console.error('Error finding previous bids:', prevBidsError)
    } else if (previousBids && previousBids.length > 0) {
      // Make the previous bid winning
      const { error: updatePrevBidError } = await supabase
        .from('auction_bids')
        .update({ is_winning_bid: true })
        .eq('id', previousBids[0].id)

      if (updatePrevBidError) {
        console.error('Error updating previous bid:', updatePrevBidError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Bid undone successfully' 
    })
  } catch (error) {
    console.error('Error in DELETE /api/auctions/[id]/bids:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
