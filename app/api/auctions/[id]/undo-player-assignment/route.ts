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
  console.log('🔍 [DEBUG] GET method called on undo-player-assignment')
  const { id: auctionId } = await params
  return NextResponse.json({ 
    message: 'Undo player assignment endpoint is working',
    auctionId: auctionId,
    method: 'GET'
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🔍 [DEBUG] undo-player-assignment route called at:', new Date().toISOString())
  console.log('🔍 [DEBUG] Request URL:', request.url)
  console.log('🔍 [DEBUG] Request method:', request.method)
  console.log('🔍 [DEBUG] Request headers:', Object.fromEntries(request.headers.entries()))
  
  try {
    const { id: auctionId } = await params
    console.log('🔍 [DEBUG] Auction ID from params:', auctionId)

    // Verify authentication
    const authHeader = request.headers.get('authorization')
    console.log('🔍 [DEBUG] Auth header present:', !!authHeader)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔍 [DEBUG] No valid auth header, returning 401')
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check user role
    console.log('🔍 [DEBUG] Checking user role for userId:', decoded.userId)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user || (user.role !== 'admin' && user.role !== 'host')) {
      console.log('🔍 [DEBUG] User role check failed:', { userError, user })
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    console.log('🔍 [DEBUG] User role check passed:', user.role)

    // Get auction details to check status
    console.log('🔍 [DEBUG] Checking auction status for auctionId:', auctionId)
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('status')
      .eq('id', auctionId)
      .single()

    if (auctionError || !auction) {
      console.log('🔍 [DEBUG] Auction not found:', { auctionError, auction })
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }
    console.log('🔍 [DEBUG] Auction found with status:', auction.status)

    // Check if auction is in live status
    if (auction.status !== 'live') {
      console.log('🔍 [DEBUG] Auction not live, status:', auction.status)
      return NextResponse.json({ 
        error: `Cannot undo player assignment. Auction is currently ${auction.status}. Please start the auction first.` 
      }, { status: 400 })
    }

    // Find the most recently sold player (last player assignment)
    console.log('🔍 [DEBUG] Looking for last sold player in auction:', auctionId)
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
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    if (lastSoldError || !lastSoldPlayer) {
      console.log('🔍 [DEBUG] No sold players found:', { lastSoldError, lastSoldPlayer })
      return NextResponse.json({ error: 'No player assignments to undo' }, { status: 404 })
    }
    console.log('🔍 [DEBUG] Found last sold player:', { 
      player_id: lastSoldPlayer.player_id, 
      sold_price: lastSoldPlayer.sold_price,
      sold_to: lastSoldPlayer.sold_to 
    })

    // Get the team that bought this player
    const team = lastSoldPlayer.auction_teams
    if (!team) {
      console.log('🔍 [DEBUG] No team found for sold player')
      return NextResponse.json({ error: 'Team information not found' }, { status: 500 })
    }
    console.log('🔍 [DEBUG] Team found:', { 
      team_id: team.id, 
      team_name: team.team_name,
      players_count: team.players_count,
      total_spent: team.total_spent,
      remaining_purse: team.remaining_purse 
    })

    // Start a transaction to undo the player assignment
    console.log('🔍 [DEBUG] Starting to undo player assignment for player:', lastSoldPlayer.player_id)
    const { error: undoError } = await supabase
      .from('auction_players')
      .update({
        status: 'available',
        sold_to: null,
        sold_price: null,
        current_player: false
      })
      .eq('auction_id', auctionId)
      .eq('player_id', lastSoldPlayer.player_id)

    if (undoError) {
      console.error('🔍 [DEBUG] Error undoing player assignment:', undoError)
      return NextResponse.json({ error: 'Failed to undo player assignment' }, { status: 500 })
    }
    console.log('🔍 [DEBUG] Player assignment undone successfully')

    // Update team statistics - refund the money and decrease player count
    const refundAmount = lastSoldPlayer.sold_price || 0
    const newPlayersCount = Math.max(0, (team.players_count || 0) - 1)
    const newTotalSpent = Math.max(0, (team.total_spent || 0) - refundAmount)
    const newRemainingPurse = (team.remaining_purse || 0) + refundAmount
    
    console.log('🔍 [DEBUG] Updating team statistics:', {
      team_id: team.id,
      refund_amount: refundAmount,
      old_players_count: team.players_count,
      new_players_count: newPlayersCount,
      old_total_spent: team.total_spent,
      new_total_spent: newTotalSpent,
      old_remaining_purse: team.remaining_purse,
      new_remaining_purse: newRemainingPurse
    })
    
    const { error: teamUpdateError } = await supabase
      .from('auction_teams')
      .update({
        players_count: newPlayersCount,
        total_spent: newTotalSpent,
        remaining_purse: newRemainingPurse
      })
      .eq('auction_id', auctionId)
      .eq('id', team.id)

    if (teamUpdateError) {
      console.error('🔍 [DEBUG] Error updating team statistics:', teamUpdateError)
      return NextResponse.json({ error: 'Failed to update team statistics' }, { status: 500 })
    }
    console.log('🔍 [DEBUG] Team statistics updated successfully')

    // Mark all bids for this player as undone since the player is no longer sold
    console.log('🔍 [DEBUG] Marking bids as undone for player:', lastSoldPlayer.player_id)
    const { error: bidsUndoError } = await supabase
      .from('auction_bids')
      .update({
        is_undone: true,
        undone_by: decoded.userId
      })
      .eq('auction_id', auctionId)
      .eq('player_id', lastSoldPlayer.player_id)
      .eq('is_undone', false)

    if (bidsUndoError) {
      console.error('🔍 [DEBUG] Error undoing bids:', bidsUndoError)
      // Don't fail the entire operation, just log the error
    } else {
      console.log('🔍 [DEBUG] Bids marked as undone successfully')
    }

    // Set the undone player as the current player so host can continue from there
    console.log('🔍 [DEBUG] Setting undone player as current player')
    const { error: setCurrentError } = await supabase
      .from('auction_players')
      .update({ current_player: true })
      .eq('auction_id', auctionId)
      .eq('player_id', lastSoldPlayer.player_id)

    if (setCurrentError) {
      console.error('🔍 [DEBUG] Error setting undone player as current:', setCurrentError)
      // Don't fail the entire operation, just log the error
    } else {
      console.log('🔍 [DEBUG] Player set as current successfully')
    }

    console.log('🔍 [DEBUG] Operation completed successfully, returning response')
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
