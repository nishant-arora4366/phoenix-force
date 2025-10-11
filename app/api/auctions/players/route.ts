import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser, isHostOrAdmin } from '@/src/lib/auth-middleware'
import { createClient } from '@supabase/supabase-js'
import { withAnalytics } from '@/src/lib/api-analytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function addAuctionPlayers(request: NextRequest, user: AuthenticatedUser) {
  try {
    // Check if user has permission to add auction players
    if (!isHostOrAdmin(user)) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to add auction players'
      }, { status: 403 })
    }

    const body = await request.json()
    const { auction_id, players } = body

    // Validate required fields
    if (!auction_id || !players || !Array.isArray(players)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: auction_id and players array'
      }, { status: 400 })
    }

    // Check if auction exists
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('id, tournament_id')
      .eq('id', auction_id)
      .single()

    if (auctionError || !auction) {
      return NextResponse.json({
        success: false,
        error: 'Auction not found'
      }, { status: 404 })
    }

    // Check if user has permission to manage this auction
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('host_id')
      .eq('id', auction.tournament_id)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({
        success: false,
        error: 'Tournament not found'
      }, { status: 404 })
    }

    if (user.role !== 'admin' && tournament.host_id !== user.id) {
      return NextResponse.json({
        success: false,
        error: 'You can only manage auctions for tournaments you host'
      }, { status: 403 })
    }

    // Prepare players data for insertion
    const playersData = players.map((player: any) => ({
      auction_id,
      player_id: player.id,
      status: 'available',
      sold_to: null,
      sold_price: null
    }))

    console.log('Inserting auction players:', {
      auction_id,
      playersCount: players.length,
      playersData: playersData.slice(0, 3) // Log first 3 for debugging
    })

    // Insert players
    const { data: createdPlayers, error } = await supabase
      .from('auction_players')
      .insert(playersData)
      .select()

    if (error) {
      console.error('Error adding auction players:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to add auction players'
      }, { status: 500 })
    }

    console.log('Successfully inserted auction players:', {
      createdCount: createdPlayers?.length,
      firstPlayer: createdPlayers?.[0]
    })

    return NextResponse.json({
      success: true,
      data: createdPlayers,
      message: 'Auction players added successfully'
    })

  } catch (error) {
    console.error('Error in auction players addition:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Export the authenticated handler with analytics
export const POST = withAnalytics(withAuth(addAuctionPlayers, ['host', 'admin']))