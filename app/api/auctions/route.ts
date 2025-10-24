import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthenticatedUser } from '@/src/lib/auth-middleware'
import { logger } from '@/lib/logger'

async function getHandler(request: NextRequest) {
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
      logger.error('Error fetching auctions:', error)
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
    logger.error('Error in auctions API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function patchHandler(request: NextRequest, user: AuthenticatedUser) {
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

    // User already authenticated via middleware
    if (user.role !== 'admin' && user.role !== 'host') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { action, player_id, team_id, sold_price, status, started_at } = body

    // Handle general auction updates (status changes)
    if (status) {
      const updateData: any = { status }
      
      // Add started_at if provided (for starting auction)
      if (started_at) {
        updateData.started_at = started_at
      }
      
      // Add completed_at if status is completed
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('auctions')
        .update(updateData)
        .eq('id', auctionId)

      if (updateError) {
        console.error('Error updating auction status:', updateError)
        return NextResponse.json({ error: 'Failed to update auction status' }, { status: 500 })
      }

      // Initialize timer on first transition to live (only if not already started)
      if (status === 'live') {
        try {
          await supabase
            .from('auctions')
            .update({
              timer_last_reset_at: new Date().toISOString(),
              timer_paused: false,
              timer_paused_remaining_seconds: null
            })
            .eq('id', auctionId)
            .is('timer_last_reset_at', null)
        } catch (e) {
          console.error('Error initializing auction timer on start:', e)
        }
      }

      // If transitioning to live (start or resume) ensure a current player exists.
      // This prevents first bid failures (NO_CURRENT_PLAYER) and aligns with bids route safeguard.
      if (status === 'live') {
        try {
          // First, clear any stray current_player flags to avoid multiple current players
          await supabase
            .from('auction_players')
            .update({ current_player: false })
            .eq('auction_id', auctionId)
            .eq('current_player', true)

          const { data: existingCurrent } = await supabase
            .from('auction_players')
            .select('player_id')
            .eq('auction_id', auctionId)
            .eq('current_player', true)
            .maybeSingle()

          if (!existingCurrent) {
            console.log(`[AUCTION ${auctionId}] No current player found, setting first available...`)
            
            // Fetch captain ids to exclude from first selection.
            const { data: teamRows } = await supabase
              .from('auction_teams')
              .select('captain_id')
              .eq('auction_id', auctionId)
            const captainIds = (teamRows || []).map(r => r.captain_id).filter(Boolean)
            console.log(`[AUCTION ${auctionId}] Excluding captains:`, captainIds)

            let firstQuery = supabase
              .from('auction_players')
              .select('player_id, display_order')
              .eq('auction_id', auctionId)
              .eq('status', 'available')
              .order('display_order', { ascending: true })
              .limit(1)
            if (captainIds.length) {
              firstQuery = firstQuery.not('player_id', 'in', `(${captainIds.map(id => `"${id}"`).join(',')})`)
            }
            const { data: firstAvail, error: queryErr } = await firstQuery.maybeSingle()
            
            if (queryErr) {
              console.error(`[AUCTION ${auctionId}] Error finding first available player:`, queryErr)
            } else if (firstAvail) {
              console.log(`[AUCTION ${auctionId}] Setting current player:`, firstAvail.player_id)
              const { error: setCurrentErr } = await supabase
                .from('auction_players')
                .update({ current_player: true })
                .eq('auction_id', auctionId)
                .eq('player_id', firstAvail.player_id)
              if (setCurrentErr) {
                console.error(`[AUCTION ${auctionId}] Error setting current player:`, setCurrentErr)
              } else {
                console.log(`[AUCTION ${auctionId}] Successfully set current player:`, firstAvail.player_id)
              }
            } else {
              console.log(`[AUCTION ${auctionId}] No available players found to set as current`)
            }
          } else {
            console.log(`[AUCTION ${auctionId}] Current player already exists:`, existingCurrent.player_id)
          }
        } catch (liveInitErr) {
          console.error(`[AUCTION ${auctionId}] Live transition current player init failed:`, liveInitErr)
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Auction status updated successfully' 
      })
    }

    if (action === 'sell_player') {
      // Mark player as sold
      const { error: updateError } = await supabase
        .from('auction_players')
        .update({
          status: 'sold',
          sold_to: team_id,
          sold_price: sold_price,
          sold_at: new Date().toISOString(),  // Set the sold timestamp
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
        // Defensive: clear any stray current_player flags first (shouldn't normally be needed)
        await supabase
          .from('auction_players')
          .update({ current_player: false })
          .eq('auction_id', auctionId)
          .eq('current_player', true)

        const { error: setCurrentError } = await supabase
          .from('auction_players')
          .update({ current_player: true })
          .eq('auction_id', auctionId)
          .eq('player_id', nextPlayer.player_id)

        if (setCurrentError) {
          console.error('Error setting next player as current:', setCurrentError)
        }
      }

      // Reset timer on sell
      await supabase
        .from('auctions')
        .update({
          timer_last_reset_at: new Date().toISOString(),
          timer_paused: false,
          timer_paused_remaining_seconds: null
        })
        .eq('id', auctionId)

      return NextResponse.json({ 
        success: true, 
        message: 'Player sold successfully',
        next_player: nextPlayer
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    logger.error('Error in PATCH /api/auctions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function postHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const body = await request.json()

    // User already authenticated via middleware
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
    if (user.role !== 'admin' && tournament.host_id !== user.id) {
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
      max_tokens_per_captain,
      min_bid_amount,
      use_base_price: body.use_base_price || false,
      min_increment: body.min_increment || 20,
      use_fixed_increments: body.use_fixed_increments !== false,
      player_order_type: body.player_order_type || 'base_price_desc',
      created_by: user.id,
      auction_config: {
        custom_increment_ranges: body.custom_increment_ranges || null,
        additional_settings: body.additional_settings || {}
      }
    }

    logger.debug('Creating auction with data:', auctionData)

    const { data: auction, error } = await supabase
      .from('auctions')
      .insert([auctionData])
      .select()
      .single()

    if (error) {
      logger.error('Error creating auction:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create auction' },
        { status: 500 }
      )
    }

    // Create auction teams if captains are provided
    // NOTE: We MUST select() after insert so we have generated team IDs available
    // for assigning captain players (sold_to) and later statistics updates.
    let auctionTeams: any[] = []
    if (body.captains && body.captains.length > 0) {
      // Calculate required players per team based on selected players
      // Total players includes captains, so each team gets totalPlayers/numTeams slots
      const totalPlayers: number = Array.isArray(body.selected_players) ? body.selected_players.length : 0
      const numTeams: number = body.captains.length
      const requiredPlayersPerTeam: number = numTeams > 0 ? Math.floor(totalPlayers / numTeams) : 0

      auctionTeams = body.captains.map((captain: any) => ({
        auction_id: auction.id,
        captain_id: captain.player_id,
        team_name: captain.team_name,
        remaining_purse: max_tokens_per_captain,
        max_tokens: max_tokens_per_captain,
        total_spent: 0,
        players_count: 0,
        required_players: requiredPlayersPerTeam
      }))
      // Insert and fetch generated IDs
      const { data: insertedTeams, error: teamsError } = await supabase
        .from('auction_teams')
        .insert(auctionTeams)
        .select()

      if (teamsError) {
        console.error('Error creating auction teams:', teamsError)
        // Don't fail the entire operation, just log the error
      } else if (insertedTeams) {
        auctionTeams = insertedTeams
      }
    }

    // Create auction players if selected players are provided
    if (body.selected_players && body.selected_players.length > 0) {
      // Normalize order type
      const orderType: string = body.player_order_type || auctionData.player_order_type || 'base_price_desc'
      // We expect each selected_player to include skills if base price ordering is needed.
      let orderedPlayers = [...body.selected_players]
      const getBasePrice = (p: any) => {
        const raw = p.skills?.['Base Price']
        if (raw == null) return 0
        if (Array.isArray(raw)) return parseInt(raw[0]) || 0
        const num = parseInt(raw)
        return isNaN(num) ? 0 : num
      }
      switch (orderType) {
        case 'base_price_desc':
          console.log('[AUCTION CREATE] Ordering players by base price desc')
          orderedPlayers.sort((a,b)=> getBasePrice(b) - getBasePrice(a))
          break
        case 'base_price_asc':
          console.log('[AUCTION CREATE] Ordering players by base price asc')
          orderedPlayers.sort((a,b)=> getBasePrice(a) - getBasePrice(b))
          break
        case 'name_asc':
          console.log('[AUCTION CREATE] Ordering players by name asc')
          orderedPlayers.sort((a,b)=> (a.display_name||'').localeCompare(b.display_name||''))
          break
        case 'name_desc':
          console.log('[AUCTION CREATE] Ordering players by name desc')
          orderedPlayers.sort((a,b)=> (b.display_name||'').localeCompare(a.display_name||''))
          break
        case 'random':
          console.log('[AUCTION CREATE] Ordering players randomly')
          orderedPlayers.sort(()=> Math.random()-0.5)
          break
        case 'original':
        default:
          // keep original order (already in body.selected_players)
          break
      }

      // Get captain IDs for auto-assignment
      const captainIds = body.captains ? body.captains.map((captain: any) => captain.player_id) : []
      
      const auctionPlayers = orderedPlayers.map((player: any, index: number) => {
        // Check if this player is a captain
        const isCaptain = captainIds.includes(player.id)
        
        if (isCaptain) {
          // Find the team this captain belongs to
          const captainData = body.captains.find((captain: any) => captain.player_id === player.id)
          const teamData = auctionTeams.find((team: any) => team.captain_id === player.id)
          
          return {
            auction_id: auction.id,
            player_id: player.id,
            status: 'sold',
            sold_to: teamData?.id || null,
            sold_price: 0,
            sold_at: new Date().toISOString(),  // Set the sold timestamp for captains
            display_order: index + 1, // Final mapped order after sorting
            times_skipped: 0,
            current_player: false
          }
        } else {
          // Regular player - available for auction
          return {
            auction_id: auction.id,
            player_id: player.id,
            status: 'available',
            display_order: index + 1,
            times_skipped: 0,
            current_player: false
          }
        }
      })

      const { error: playersError } = await supabase
        .from('auction_players')
        .insert(auctionPlayers)

      if (playersError) {
        console.error('Error creating auction players:', playersError)
        // Don't fail the entire operation, just log the error
      }

      // Update team statistics for captains (they are already assigned)
      if (body.captains && body.captains.length > 0) {
        const captainTeamUpdates = body.captains.map((captain: any) => {
          const teamData = auctionTeams.find((team: any) => team.captain_id === captain.player_id)
          return {
            id: teamData?.id,
            players_count: 1, // Captain is already assigned
            total_spent: 0, // Captain costs 0
            remaining_purse: max_tokens_per_captain // Full purse available
          }
        })

        // Update each team's statistics
        for (const update of captainTeamUpdates) {
          if (update.id) {
            await supabase
              .from('auction_teams')
              .update({
                players_count: update.players_count,
                total_spent: update.total_spent,
                remaining_purse: update.remaining_purse
              })
              .eq('id', update.id)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      auction,
      teams: auctionTeams // include team data (with IDs) so client can reflect immediately
    })

  } catch (error) {
    logger.error('Error in auctions POST API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export with middleware
// GET is public - no authentication required
export async function GET(request: NextRequest) {
  return getHandler(request)
}

export async function PATCH(request: NextRequest) {
  const user = await import('@/src/lib/auth-middleware').then(m => m.authenticateRequest(request))
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (user.role !== 'admin' && user.role !== 'host') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  return patchHandler(request, user)
}

export async function POST(request: NextRequest) {
  const user = await import('@/src/lib/auth-middleware').then(m => m.authenticateRequest(request))
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (!['host', 'admin'].includes(user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  return postHandler(request, user)
}
