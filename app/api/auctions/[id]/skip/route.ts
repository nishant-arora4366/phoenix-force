import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthenticatedUser } from '@/src/lib/auth-middleware'
import { logger } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('player_id')

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID required' }, { status: 400 })
    }

    // Fetch skips for this player in this auction
    const { data: skips, error } = await supabase
      .from('auction_skips')
      .select('team_id, skipped_at')
      .eq('auction_id', auctionId)
      .eq('player_id', playerId)

    if (error) {
      logger.error('Error fetching skips:', error)
      return NextResponse.json({ error: 'Failed to fetch skips' }, { status: 500 })
    }

    return NextResponse.json({ skips: skips || [] })

  } catch (error) {
    logger.error('Error in GET /api/auctions/[id]/skip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function postHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params
    const body = await request.json()
    const { player_id, team_id } = body

    if (!player_id || !team_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user is the captain of the team OR is admin/host
    const { data: team, error: teamError } = await supabase
      .from('auction_teams')
      .select('captain_id, team_name')
      .eq('id', team_id)
      .eq('auction_id', auctionId)
      .single()

    if (teamError || !team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Get the captain's player record to check user_id (same logic as bid button)
    const { data: captainPlayer, error: captainError } = await supabase
      .from('players')
      .select('user_id')
      .eq('id', team.captain_id)
      .single()

    if (captainError || !captainPlayer) {
      return NextResponse.json({ error: 'Captain player not found' }, { status: 404 })
    }

    // Get auction to check if user is the creator (host)
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('created_by')
      .eq('id', auctionId)
      .single()

    if (auctionError || !auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    // Check if user is captain, admin, or auction host
    // Use captainPlayer.user_id (not team.captain_id) - same logic as bid button
    const isAdmin = user.role === 'admin'
    const isAuctionHost = user.role === 'host' && auction.created_by === user.id
    const isCaptain = captainPlayer.user_id === user.id

    if (!isAdmin && !isAuctionHost && !isCaptain) {
      return NextResponse.json({ 
        error: 'Only team captain, admin, or auction host can skip'
      }, { status: 403 })
    }

    // Verify player is the current player
    const { data: auctionPlayer, error: playerError } = await supabase
      .from('auction_players')
      .select('current_player, status')
      .eq('auction_id', auctionId)
      .eq('player_id', player_id)
      .single()

    if (playerError || !auctionPlayer) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    if (!auctionPlayer.current_player) {
      return NextResponse.json({ error: 'Player is not current' }, { status: 400 })
    }

    if (auctionPlayer.status !== 'available') {
      return NextResponse.json({ error: 'Player is not available' }, { status: 400 })
    }

    // Insert skip record into auction_skips table
    const { error: skipError } = await supabase
      .from('auction_skips')
      .insert({
        auction_id: auctionId,
        player_id: player_id,
        team_id: team_id,
        skipped_at: new Date().toISOString()
      })

    if (skipError) {
      // Check if already skipped (unique constraint violation)
      if (skipError.code === '23505') {
        return NextResponse.json({ error: 'Already skipped this player' }, { status: 400 })
      }
      logger.error('Error inserting skip:', skipError)
      return NextResponse.json({ error: 'Failed to skip player' }, { status: 500 })
    }

    logger.info(`Team ${team.team_name} skipped player ${player_id}`)

    return NextResponse.json({
      success: true,
      message: 'Player skipped successfully'
    })

  } catch (error) {
    logger.error('Error in POST /api/auctions/[id]/skip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function deleteHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('player_id')
    const teamId = searchParams.get('team_id')

    if (!playerId || !teamId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get auction to check if user is admin or host
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('created_by')
      .eq('id', auctionId)
      .single()

    if (auctionError || !auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    // Only admins and auction hosts can undo skips
    const isAdmin = user.role === 'admin'
    const isAuctionHost = user.role === 'host' && auction.created_by === user.id

    if (!isAdmin && !isAuctionHost) {
      return NextResponse.json({ 
        error: 'Only admin or auction host can undo skips' 
      }, { status: 403 })
    }

    // Delete the skip record
    const { error: deleteError } = await supabase
      .from('auction_skips')
      .delete()
      .eq('auction_id', auctionId)
      .eq('player_id', playerId)
      .eq('team_id', teamId)

    if (deleteError) {
      logger.error('Error deleting skip:', deleteError)
      return NextResponse.json({ error: 'Failed to undo skip' }, { status: 500 })
    }

    logger.info(`Skip undone for team ${teamId} on player ${playerId}`)

    return NextResponse.json({
      success: true,
      message: 'Skip undone successfully'
    })

  } catch (error) {
    logger.error('Error in DELETE /api/auctions/[id]/skip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Export with middleware
// GET is public - anyone can view skips
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return getHandler(request, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await import('@/src/lib/auth-middleware').then(m => m.authenticateRequest(request))
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  return postHandler(request, user, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await import('@/src/lib/auth-middleware').then(m => m.authenticateRequest(request))
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  return deleteHandler(request, user, context)
}
