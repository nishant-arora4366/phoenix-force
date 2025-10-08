import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const searchTerm = url.searchParams.get('q')
    const tournamentId = url.searchParams.get('tournamentId')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    if (!searchTerm || searchTerm.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Search term must be at least 2 characters'
      }, { status: 400 })
    }

    // Build the query to search for players
    let query = supabaseAdmin
      .from('players')
      .select(`
        id,
        display_name,
        users!inner(
          id,
          email,
          firstname,
          lastname,
          username,
          status
        )
      `)
      .ilike('display_name', `%${searchTerm}%`)
      .limit(limit)

    // If tournamentId is provided, exclude players already registered for this tournament
    if (tournamentId) {
      // Get player IDs already registered for this tournament
      const { data: registeredPlayers } = await supabaseAdmin
        .from('tournament_slots')
        .select('player_id')
        .eq('tournament_id', tournamentId)

      const registeredPlayerIds = registeredPlayers?.map(p => p.player_id) || []
      
      if (registeredPlayerIds.length > 0) {
        query = query.not('id', 'in', `(${registeredPlayerIds.join(',')})`)
      }
    }

    const { data: players, error } = await query

    if (error) {
      console.error('Error searching players:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to search players'
      }, { status: 500 })
    }

    // Format the response
    const formattedPlayers = players?.map(player => ({
      id: player.id,
      display_name: player.display_name,
      user: {
        id: (player.users as any).id,
        email: (player.users as any).email,
        firstname: (player.users as any).firstname,
        lastname: (player.users as any).lastname,
        username: (player.users as any).username,
        status: (player.users as any).status
      }
    })) || []

    return NextResponse.json({
      success: true,
      players: formattedPlayers
    })

  } catch (error: any) {
    console.error('Error in players search API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
