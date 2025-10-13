import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/src/lib/jwt'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Fetch auctions with tournament information
    const { data: auctions, error } = await supabase
      .from('auctions')
      .select(`
        *,
        tournaments!inner(
          id,
          name,
          format,
          tournament_date
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching auctions:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch auctions' },
        { status: 500 }
      )
    }

    // Transform the data to include tournament information
    const transformedAuctions = auctions?.map((auction: any) => ({
      ...auction,
      tournament_name: auction.tournaments?.name,
      tournament_format: auction.tournaments?.format,
      tournament_date: auction.tournaments?.tournament_date,
      // Remove the nested tournaments object
      tournaments: undefined
    })) || []

    return NextResponse.json({
      success: true,
      auctions: transformedAuctions
    })

  } catch (error) {
    console.error('Error in auctions API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const auctionId = searchParams.get('id')
    
    if (!auctionId) {
      return NextResponse.json({ error: 'Auction ID is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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

    const body = await request.json()
    const { action, player_id, team_id, sold_price } = body

    if (action === 'sell_player') {
      // Mark player as sold
      const { error: updateError } = await supabase
        .from('auction_players')
        .update({
          status: 'sold',
          sold_to: team_id,
          sold_price: sold_price,
          current_player: false
        })
        .eq('auction_id', auctionId)
        .eq('player_id', player_id)

      if (updateError) {
        console.error('Error selling player:', updateError)
        return NextResponse.json({ error: 'Failed to sell player' }, { status: 500 })
      }

      // Update team statistics - first get current values
      const { data: currentTeam, error: teamFetchError } = await supabase
        .from('auction_teams')
        .select('players_count, total_spent, remaining_purse')
        .eq('auction_id', auctionId)
        .eq('id', team_id)
        .single()

      if (teamFetchError) {
        console.error('Error fetching team data:', teamFetchError)
        return NextResponse.json({ error: 'Failed to fetch team data' }, { status: 500 })
      }

      // Update team statistics with calculated values
      const { error: teamUpdateError } = await supabase
        .from('auction_teams')
        .update({
          players_count: (currentTeam.players_count || 0) + 1,
          total_spent: (currentTeam.total_spent || 0) + sold_price,
          remaining_purse: (currentTeam.remaining_purse || 0) - sold_price
        })
        .eq('auction_id', auctionId)
        .eq('id', team_id)

      if (teamUpdateError) {
        console.error('Error updating team statistics:', teamUpdateError)
        return NextResponse.json({ error: 'Failed to update team statistics' }, { status: 500 })
      }

      // Get current player's display order first
      const { data: currentPlayerData, error: currentPlayerError } = await supabase
        .from('auction_players')
        .select('display_order')
        .eq('auction_id', auctionId)
        .eq('player_id', player_id)
        .single()

      let nextPlayer = null
      if (!currentPlayerError && currentPlayerData) {
        // Find the next available player
        const { data: nextPlayerData, error: nextPlayerError } = await supabase
          .from('auction_players')
          .select('*')
          .eq('auction_id', auctionId)
          .eq('status', 'available')
          .gt('display_order', currentPlayerData.display_order)
          .order('display_order', { ascending: true })
          .limit(1)

        if (!nextPlayerError && nextPlayerData && nextPlayerData.length > 0) {
          nextPlayer = nextPlayerData[0]
        }
      }

      if (nextPlayer) {
        // Set the next player as current
        const { error: setCurrentError } = await supabase
          .from('auction_players')
          .update({ current_player: true })
          .eq('auction_id', auctionId)
          .eq('player_id', nextPlayer.player_id)

        if (setCurrentError) {
          console.error('Error setting next player as current:', setCurrentError)
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Player sold successfully',
        next_player: nextPlayer
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in PATCH /api/auctions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const body = await request.json()

    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify JWT token
    const token = authHeader.substring(7)
    const decoded = verifyToken(token)
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Verify user has permission to create auctions (host or admin)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', decoded.userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    if (!['host', 'admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions. Only hosts and admins can create auctions.' },
        { status: 403 }
      )
    }

    // Validate required fields
    const { tournament_id, max_tokens_per_captain, min_bid_amount, timer_seconds } = body

    if (!tournament_id || !max_tokens_per_captain || !min_bid_amount || !timer_seconds) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify tournament exists and user has permission to create auction for it
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, host_id, name')
      .eq('id', tournament_id)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { success: false, error: 'Tournament not found' },
        { status: 404 }
      )
    }

    // Check if user is tournament host or admin
    if (user.role !== 'admin' && tournament.host_id !== decoded.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only create auctions for tournaments you host' },
        { status: 403 }
      )
    }

    // Create new auction with all configuration fields
    const auctionData = {
      tournament_id,
      status: 'draft',
      timer_seconds,
      current_bid: min_bid_amount,
      max_tokens_per_captain,
      min_bid_amount,
      use_base_price: body.use_base_price || false,
      min_increment: body.min_increment || 20,
      use_fixed_increments: body.use_fixed_increments !== false,
      player_order_type: body.player_order_type || 'base_price_desc',
      created_by: decoded.userId,
      auction_config: {
        custom_increment_ranges: body.custom_increment_ranges || null,
        additional_settings: body.additional_settings || {}
      }
    }

    console.log('Creating auction with data:', auctionData)

    const { data: auction, error } = await supabase
      .from('auctions')
      .insert([auctionData])
      .select()
      .single()

    if (error) {
      console.error('Error creating auction:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create auction' },
        { status: 500 }
      )
    }

    // Create auction teams if captains are provided
    if (body.captains && body.captains.length > 0) {
      const auctionTeams = body.captains.map((captain: any) => ({
        auction_id: auction.id,
        captain_id: captain.player_id,
        team_name: captain.team_name,
        remaining_purse: max_tokens_per_captain
      }))

      const { error: teamsError } = await supabase
        .from('auction_teams')
        .insert(auctionTeams)

      if (teamsError) {
        console.error('Error creating auction teams:', teamsError)
        // Don't fail the entire operation, just log the error
      }
    }

    // Create auction players if selected players are provided
    if (body.selected_players && body.selected_players.length > 0) {
      const auctionPlayers = body.selected_players.map((player: any) => ({
        auction_id: auction.id,
        player_id: player.id,
        status: 'available'
      }))

      const { error: playersError } = await supabase
        .from('auction_players')
        .insert(auctionPlayers)

      if (playersError) {
        console.error('Error creating auction players:', playersError)
        // Don't fail the entire operation, just log the error
      }
    }

    return NextResponse.json({
      success: true,
      auction
    })

  } catch (error) {
    console.error('Error in auctions POST API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
