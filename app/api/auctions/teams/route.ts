import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser, isHostOrAdmin } from '@/src/lib/auth-middleware'
import { createClient } from '@supabase/supabase-js'
import { withAnalytics } from '@/src/lib/api-analytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function createAuctionTeams(request: NextRequest, user: AuthenticatedUser) {
  try {
    // Check if user has permission to create auction teams
    if (!isHostOrAdmin(user)) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to create auction teams'
      }, { status: 403 })
    }

    const body = await request.json()
    const { auction_id, teams } = body

    // Validate required fields
    if (!auction_id || !teams || !Array.isArray(teams)) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: auction_id and teams array'
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

    // Prepare teams data for insertion
    const teamsData = teams.map((team: any) => ({
      auction_id,
      captain_id: team.playerId,
      team_name: team.teamName,
      total_spent: 0,
      remaining_purse: 1000000 // Default purse amount
    }))

    // Insert teams
    const { data: createdTeams, error } = await supabase
      .from('auction_teams')
      .insert(teamsData)
      .select()

    if (error) {
      console.error('Error creating auction teams:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create auction teams'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: createdTeams,
      message: 'Auction teams created successfully'
    })

  } catch (error) {
    console.error('Error in auction teams creation:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Export the authenticated handler with analytics
export const POST = withAnalytics(withAuth(createAuctionTeams, ['host', 'admin']))