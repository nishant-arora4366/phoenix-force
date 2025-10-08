import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const searchTerm = url.searchParams.get('q') || ''
    const tournamentId = url.searchParams.get('tournamentId')
    const skillFilter = url.searchParams.get('skill')
    const skillValue = url.searchParams.get('skillValue')
    const limit = parseInt(url.searchParams.get('limit') || '100')

    // Build the base query to get all players (including those not linked to users)
    let query = supabaseAdmin
      .from('players')
      .select(`
        id,
        display_name,
        users(
          id,
          email,
          firstname,
          lastname,
          username,
          status
        )
      `)

    // Apply search filter if provided
    if (searchTerm && searchTerm.length >= 2) {
      query = query.ilike('display_name', `%${searchTerm}%`)
    }

    // Apply skill filter if provided
    if (skillFilter && skillValue) {
      // Get player IDs that have the specified skill value
      const { data: skillAssignments } = await supabaseAdmin
        .from('player_skill_assignments')
        .select('player_id')
        .eq('skill_id', skillFilter)
        .or(`skill_value_id.eq.${skillValue},value_array.cs.{${skillValue}}`)

      if (skillAssignments && skillAssignments.length > 0) {
        const filteredPlayerIds = skillAssignments.map(assignment => assignment.player_id)
        query = query.in('id', filteredPlayerIds)
      } else {
        // No players found with this skill value, return empty result
        query = query.eq('id', 'no-match')
      }
    }

    // Apply limit
    query = query.limit(limit)

    const { data: players, error } = await query

    if (error) {
      console.error('Error fetching players:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch players'
      }, { status: 500 })
    }

    // Get registered players for this tournament if tournamentId is provided
    let registeredPlayerIds: string[] = []
    if (tournamentId) {
      const { data: registeredPlayers } = await supabaseAdmin
        .from('tournament_slots')
        .select('player_id')
        .eq('tournament_id', tournamentId)

      registeredPlayerIds = registeredPlayers?.map(p => p.player_id) || []
    }

    // Format the response
    const formattedPlayers = players?.map(player => ({
      id: player.id,
      display_name: player.display_name,
      user: player.users ? {
        id: (player.users as any).id,
        email: (player.users as any).email,
        firstname: (player.users as any).firstname,
        lastname: (player.users as any).lastname,
        username: (player.users as any).username,
        status: (player.users as any).status
      } : null,
      isRegistered: registeredPlayerIds.includes(player.id)
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
