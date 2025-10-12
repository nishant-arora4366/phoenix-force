import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { id: auctionId } = await params

    if (!auctionId) {
      return NextResponse.json(
        { success: false, error: 'Auction ID is required' },
        { status: 400 }
      )
    }

    // Fetch auction with tournament information
    const { data: auction, error: auctionError } = await supabase
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
      .eq('id', auctionId)
      .single()

    if (auctionError) {
      console.error('Error fetching auction:', auctionError)
      return NextResponse.json(
        { success: false, error: 'Auction not found' },
        { status: 404 }
      )
    }

    // Fetch auction teams
    const { data: teams, error: teamsError } = await supabase
      .from('auction_teams')
      .select('*')
      .eq('auction_id', auctionId)

    if (teamsError) {
      console.error('Error fetching auction teams:', teamsError)
    }

    // Fetch auction players
    const { data: auctionPlayers, error: playersError } = await supabase
      .from('auction_players')
      .select('*')
      .eq('auction_id', auctionId)

    if (playersError) {
      console.error('Error fetching auction players:', playersError)
    }

    // Fetch player details for auction players
    let playerDetails: any[] = []
    if (auctionPlayers && auctionPlayers.length > 0) {
      const playerIds = auctionPlayers.map(ap => ap.player_id)
      
      const { data: players, error: playerDetailsError } = await supabase
        .from('players')
        .select(`
          id,
          display_name,
          profile_pic_url,
          user_id,
          player_skill_assignments (
            player_skills (
              skill_name,
              skill_type,
              viewer_can_see
            ),
            player_skill_values (
              value_name
            ),
            value_array
          )
        `)
        .in('id', playerIds)

      if (playerDetailsError) {
        console.error('Error fetching player details:', playerDetailsError)
      } else {
        // Transform player skills data
        playerDetails = (players || []).map(player => {
          const skills: { [skillName: string]: string | string[] } = {}
          
          if (player.player_skill_assignments) {
            player.player_skill_assignments.forEach((assignment: any) => {
              const skillName = assignment.player_skills?.skill_name
              const viewerCanSee = assignment.player_skills?.viewer_can_see
              const valueName = assignment.player_skill_values?.value_name
              
              if (skillName && viewerCanSee) {
                if (assignment.player_skills?.skill_type === 'multiselect') {
                  skills[skillName] = assignment.value_array || []
                } else if (assignment.player_skill_values) {
                  skills[skillName] = valueName
                }
              }
            })
          }
          
          return {
            id: player.id,
            display_name: player.display_name,
            profile_pic_url: player.profile_pic_url,
            user_id: player.user_id,
            skills
          }
        })
      }
    }

    // Transform the auction data to include tournament information
    const transformedAuction = {
      ...auction,
      tournament_name: auction.tournaments?.name,
      tournament_format: auction.tournaments?.format,
      tournament_date: auction.tournaments?.tournament_date,
      // Remove the nested tournaments object
      tournaments: undefined
    }

    return NextResponse.json({
      success: true,
      auction: transformedAuction,
      teams: teams || [],
      players: auctionPlayers || [],
      playerDetails
    })

  } catch (error) {
    console.error('Error in auction API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
