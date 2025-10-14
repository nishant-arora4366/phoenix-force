import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/src/lib/jwt'

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
          bio,
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
            bio: player.bio,
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

export async function DELETE(
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

    // Check if user is the creator of the auction (for hosts) or admin
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('created_by')
      .eq('id', auctionId)
      .single()

    if (auctionError) {
      console.error('Error fetching auction:', auctionError)
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    // Hosts can only delete their own auctions, admins can delete any
    if (user.role === 'host' && auction.created_by !== decoded.userId) {
      return NextResponse.json({ error: 'You can only delete your own auctions' }, { status: 403 })
    }

    // Delete the auction (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('auctions')
      .delete()
      .eq('id', auctionId)

    if (deleteError) {
      console.error('Error deleting auction:', deleteError)
      return NextResponse.json({ error: 'Failed to delete auction' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Auction deleted successfully' 
    })

  } catch (error) {
    console.error('Error in DELETE auction API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
