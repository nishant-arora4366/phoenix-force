import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/src/lib/jwt'
import { auctionCache, cacheKeys, cachedQuery } from '@/lib/auction-cache'

// Type definitions
interface UserData {
  id: string
  role: string
}

interface AuctionData {
  id: string
  status: string
  created_by: string
}

interface TeamData {
  id: string
  captain_id: string
}

// Connection pooling - reuse Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: false
    },
    global: {
      headers: {
        'x-connection-pooling': 'true'
      }
    }
  }
)

// Optimized GET with caching
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('player_id')
    
    // Use caching for team names (they don't change during auction)
    const teamsCacheKey = cacheKeys.auctionTeams(auctionId)
    const auctionTeams = await cachedQuery(
      teamsCacheKey,
      async () => {
        const { data, error } = await supabase
          .from('auction_teams')
          .select('id, team_name')
          .eq('auction_id', auctionId)
        
        if (error) throw error
        return data || []
      },
      60000 // Cache for 1 minute
    )
    
    // Create team name map
    const teamNameMap = new Map(
      auctionTeams.map(team => [team.id, team.team_name])
    )
    
    // Cache key for bids
    const bidsCacheKey = cacheKeys.bids(auctionId, playerId || undefined)
    
    // Check if we can use cached bids (only for recent requests)
    const cachedBids = auctionCache.get(bidsCacheKey)
    if (cachedBids) {
      return NextResponse.json(cachedBids)
    }
    
    // Optimized query with proper indexing
    let query = supabase
      .from('auction_bids')
      .select('id, auction_id, player_id, team_id, bid_amount, is_winning_bid, is_undone, created_at')
      .eq('auction_id', auctionId)
      .eq('is_undone', false)
    
    if (playerId) {
      query = query.eq('player_id', playerId)
    }
    
    // Limit results for better performance
    const { data: bids, error } = await query
      .order('created_at', { ascending: false })
      .limit(100) // Limit to last 100 bids
    
    if (error) {
      console.error('Error fetching bids:', error)
      return NextResponse.json({ error: 'Failed to fetch bids' }, { status: 500 })
    }
    
    // Transform data
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
    
    // Cache the result for 3 seconds (bids change frequently)
    auctionCache.set(bidsCacheKey, transformedBids, 3000)
    
    return NextResponse.json(transformedBids)
  } catch (error) {
    console.error('Error in GET /api/auctions/[id]/bids:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Optimized POST with better concurrency handling
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params
    const body = await request.json()
    const { team_id, bid_amount } = body
    
    // Quick validation
    if (!team_id || !bid_amount || bid_amount <= 0) {
      return NextResponse.json({ 
        error: 'Invalid bid parameters' 
      }, { status: 400 })
    }
    
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
    // Check cached user permissions first
    const userCacheKey = cacheKeys.userProfile(decoded.userId)
    let user = auctionCache.get<UserData>(userCacheKey)
    
    if (!user) {
      const { data, error } = await supabase
        .from('users')
        .select('id, role')
        .eq('id', decoded.userId)
        .single()
      
      if (error || !data) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      
      user = data
      auctionCache.set(userCacheKey, user, 60000) // Cache for 1 minute
    }
    
    // Quick authorization check using cached auction data
    const auctionCacheKey = cacheKeys.auction(auctionId)
    let auctionData = auctionCache.get<AuctionData>(auctionCacheKey)
    
    if (!auctionData) {
      const { data, error } = await supabase
        .from('auctions')
        .select('id, status, created_by')
        .eq('id', auctionId)
        .single()
      
      if (error || !data) {
        return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
      }
      
      auctionData = data
      auctionCache.set(auctionCacheKey, auctionData, 10000) // Cache for 10 seconds
    }
    
    // Check auction status
    if (auctionData.status !== 'live') {
      return NextResponse.json({ 
        error: `Auction is ${auctionData.status}. Must be live to place bids.`,
        code: 'AUCTION_NOT_LIVE'
      }, { status: 400 })
    }
    
    // Simplified authorization
    let isAuthorized = false
    if (user.role === 'admin') {
      isAuthorized = true
    } else if (user.role === 'host' && auctionData.created_by === decoded.userId) {
      isAuthorized = true
    } else {
      // Check team captain ownership (with caching)
      const teamsCacheKey = `team:${team_id}`
      let teamData = auctionCache.get<TeamData>(teamsCacheKey)
      
      if (!teamData) {
        const { data } = await supabase
          .from('auction_teams')
          .select('id, captain_id')
          .eq('id', team_id)
          .eq('auction_id', auctionId)
          .single()
        
        if (data) {
          teamData = data
          auctionCache.set(teamsCacheKey, teamData, 30000)
        }
      }
      
      if (teamData) {
        const { data: captainPlayer } = await supabase
          .from('players')
          .select('id, user_id')
          .eq('id', teamData.captain_id)
          .single()
        
        if (captainPlayer?.user_id === decoded.userId) {
          isAuthorized = true
        }
      }
    }
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    // Ensure current player exists
    const { data: currentPlayerCheck } = await supabase
      .from('auction_players')
      .select('player_id')
      .eq('auction_id', auctionId)
      .eq('current_player', true)
      .maybeSingle()
    
    if (!currentPlayerCheck) {
      // Quick fix: set first available player as current
      const { data: teams } = await supabase
        .from('auction_teams')
        .select('captain_id')
        .eq('auction_id', auctionId)
      
      const captainIds = teams?.map(t => t.captain_id).filter(Boolean) || []
      
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
      
      const { data: firstAvail } = await firstQuery.maybeSingle()
      
      if (firstAvail) {
        await supabase
          .from('auction_players')
          .update({ current_player: true })
          .eq('auction_id', auctionId)
          .eq('player_id', firstAvail.player_id)
      }
    }
    
    // Use RPC for atomic bid placement
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('place_bid_atomic', {
        p_auction_id: auctionId,
        p_team_id: team_id,
        p_bid_amount: bid_amount,
        p_user_id: decoded.userId
      })
    
    if (rpcError) {
      const msg = rpcError.message || ''
      let code = 'UNKNOWN'
      let detail = msg
      
      if (msg.includes('::')) {
        [code, detail] = msg.split('::')
      }
      
      // Invalidate relevant caches on error
      auctionCache.invalidatePattern(`bids:${auctionId}`)
      
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
      
      return NextResponse.json({ 
        success: false, 
        code, 
        error: detail || 'Bid failed' 
      }, { status: statusMap[code] || 500 })
    }
    
    // Invalidate relevant caches on success
    auctionCache.invalidatePattern(`bids:${auctionId}`)
    auctionCache.invalidate(cacheKeys.currentPlayer(auctionId))
    
    return NextResponse.json({ 
      success: true, 
      bid: rpcResult?.bid, 
      current_bid: rpcResult?.current_bid, 
      message: 'Bid placed successfully' 
    })
    
  } catch (error) {
    console.error('Error in POST /api/auctions/[id]/bids:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
