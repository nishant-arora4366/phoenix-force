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

    // Fetch user role
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization rules:
    // 1. Admin: always
    // 2. Host: only if host created this auction
    // 3. Captain (or viewer) who owns the captain player for the team may bid for that team
    // (role string may be 'viewer' but still linked via players.user_id)

    // Fetch auction creator for host check
    const { data: auctionRow } = await supabase
      .from('auctions')
      .select('created_by')
      .eq('id', auctionId)
      .single()

    let isAuthorized = false
    if (user.role === 'admin') {
      isAuthorized = true
    } else if (user.role === 'host' && auctionRow && auctionRow.created_by === decoded.userId) {
      isAuthorized = true
    } else {
      // Derive captain ownership from team_id->captain_id->players.user_id
      const { data: teamRecord } = await supabase
        .from('auction_teams')
        .select('id, captain_id')
        .eq('id', team_id)
        .eq('auction_id', auctionId)
        .single()
      if (teamRecord) {
        const { data: captainPlayer } = await supabase
          .from('players')
          .select('id, user_id')
          .eq('id', teamRecord.captain_id)
          .single()
        if (captainPlayer && captainPlayer.user_id === decoded.userId) {
          isAuthorized = true
        }
      }
    }
    if (!isAuthorized) return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })

    // Ensure there is a current player; if not, set the first available (excluding captains) to avoid NO_CURRENT_PLAYER errors on first bid
    const { data: existingCurrent } = await supabase
      .from('auction_players')
      .select('player_id')
      .eq('auction_id', auctionId)
      .eq('current_player', true)
      .maybeSingle()

    if (!existingCurrent) {
      console.log(`[BID ${auctionId}] No current player found during bid, setting fallback...`)
      
      // Gather captain ids to exclude
      const { data: capRows } = await supabase
        .from('auction_teams')
        .select('captain_id')
        .eq('auction_id', auctionId)
      const captainIds = (capRows || []).map(r => r.captain_id).filter(Boolean)
      
      let firstQuery = supabase
        .from('auction_players')
        .select('player_id')
        .eq('auction_id', auctionId)
        .eq('status', 'available')
        .order('display_order', { ascending: true })
        .limit(1)
      if (captainIds.length) {
        firstQuery = firstQuery.not('player_id', 'in', `(${captainIds.map(id => `"${id}"`).join(',')})`)
      }
      const { data: firstAvail, error: queryErr } = await firstQuery.maybeSingle()
      
      if (queryErr) {
        console.error(`[BID ${auctionId}] Error finding first available player:`, queryErr)
      } else if (firstAvail) {
        console.log(`[BID ${auctionId}] Setting fallback current player:`, firstAvail.player_id)
        const { error: setErr } = await supabase
          .from('auction_players')
          .update({ current_player: true })
          .eq('auction_id', auctionId)
          .eq('player_id', firstAvail.player_id)
        if (setErr) {
          console.error(`[BID ${auctionId}] Error setting fallback current player:`, setErr)
        }
      } else {
        console.log(`[BID ${auctionId}] No available players found for fallback`)
      }
    }

    // Delegate concurrency & validation to PostgreSQL function (implemented separately).
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('place_bid_atomic', {
        p_auction_id: auctionId,
        p_team_id: team_id,
        p_bid_amount: bid_amount,
        p_user_id: decoded.userId
      })

    if (rpcError) {
      // Map structured error codes embedded in message: CODE::message
      const msg = rpcError.message || ''
      let code = 'UNKNOWN'
      let detail = msg
      if (msg.includes('::')) {
        const [c, d] = msg.split('::')
        code = c
        detail = d
      }
      const statusMap: Record<string, number> = {
        BID_OUTDATED: 409,
        AUCTION_NOT_LIVE: 400,
        INSUFFICIENT_FUNDS: 400,
        INVALID_INCREMENT: 400,
        TEAM_NOT_FOUND: 404,
        AUCTION_NOT_FOUND: 404,
        NO_CURRENT_PLAYER: 400,
        PERMISSION_DENIED: 403
      }
      const status = statusMap[code] || 500
      return NextResponse.json({ success: false, code, error: detail || 'Bid failed' }, { status })
    }

    return NextResponse.json({ success: true, bid: rpcResult?.bid, current_bid: rpcResult?.current_bid, message: 'Bid placed successfully' })
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

    // Check if this is a bid reset request (from navigation)
    if (!bidId) {
      const body = await request.json().catch(() => ({}))
      
      if (body.action === 'reset_player_bids' && body.player_id) {
        // Handle bid reset for player navigation
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const token = authHeader.split(' ')[1]
        const decoded = verifyToken(token)
        if (!decoded || !decoded.userId) {
          return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // Check user role (only hosts and admins can reset bids)
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', decoded.userId)
          .single()

        if (userError || !user || (user.role !== 'admin' && user.role !== 'host')) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        // Mark all bids for this player as undone
        const { error: resetError } = await supabase
          .from('auction_bids')
          .update({ 
            is_undone: true,
            undone_at: new Date().toISOString(),
            undone_by: decoded.userId
          })
          .eq('auction_id', auctionId)
          .eq('player_id', body.player_id)
          .eq('is_undone', false)

        if (resetError) {
          console.error('Error resetting player bids:', resetError)
          return NextResponse.json({ error: 'Failed to reset player bids' }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Player bids reset successfully' 
        })
      }

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
