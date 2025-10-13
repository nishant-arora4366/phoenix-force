import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function getHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    const url = new URL(request.url)
    const searchTerm = url.searchParams.get('q') || ''
    const tournamentId = url.searchParams.get('tournamentId')
    const skillFilter = url.searchParams.get('skill')
    const skillValue = url.searchParams.get('skillValue')
    const limit = parseInt(url.searchParams.get('limit') || '1000')

    // Build the base query to get all players (including those not linked to users)
    let query = supabaseAdmin
      .from('players')
      .select(`
        id,
        display_name,
        user_id,
        users!user_id(
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

    // Apply skill filters if provided
    const skillFilters = url.searchParams.getAll('skill')
    const skillValues = url.searchParams.getAll('skillValue')
    
    if (skillFilters.length > 0 && skillValues.length > 0) {
      let allFilteredPlayerIds: string[] = []
      
      for (let i = 0; i < skillFilters.length; i++) {
        const skillFilter = skillFilters[i]
        const skillValue = skillValues[i]
        
        if (skillFilter && skillValue) {
          // Handle multiple values for a single skill (comma-separated)
          const values = skillValue.split(',')
          let skillQuery = supabaseAdmin
            .from('player_skill_assignments')
            .select('player_id')
            .eq('skill_id', skillFilter)
          
          if (values.length === 1) {
            skillQuery = skillQuery.or(`skill_value_id.eq.${values[0]},value_array.cs.{${values[0]}}`)
          } else {
            // Multiple values - use OR condition
            const orConditions = values.map(v => `skill_value_id.eq.${v},value_array.cs.{${v}}`).join(',')
            skillQuery = skillQuery.or(orConditions)
          }
          
          const { data: skillAssignments } = await skillQuery
          
          if (skillAssignments && skillAssignments.length > 0) {
            const filteredPlayerIds = skillAssignments.map(assignment => assignment.player_id)
            if (i === 0) {
              allFilteredPlayerIds = filteredPlayerIds
            } else {
              // Intersect with previous results (AND logic between different skills)
              allFilteredPlayerIds = allFilteredPlayerIds.filter(id => filteredPlayerIds.includes(id))
            }
          } else {
            // No players found with this skill value, return empty result
            allFilteredPlayerIds = []
            break
          }
        }
      }
      
      if (allFilteredPlayerIds.length > 0) {
        query = query.in('id', allFilteredPlayerIds)
      } else {
        // No players found with the skill filters, return empty result
        query = query.eq('id', 'no-match')
      }
    }

    // Apply limit
    query = query.limit(limit)

    const { data: players, error } = await query

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch players',
        details: error.message
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

    // Get skills for all players separately to avoid relationship issues
    const playerIds = players?.map(p => p.id) || []
    let playerSkills: { [key: string]: any[] } = {}
    
    if (playerIds.length > 0) {
      const { data: skillAssignments } = await supabaseAdmin
        .from('player_skill_assignments')
        .select(`
          player_id,
          skill_id,
          skill_value_id,
          value_array,
          player_skills!inner(
            skill_name,
            skill_type
          ),
          player_skill_values(
            value_name
          )
        `)
        .in('player_id', playerIds)
      
      // Group skills by player
      skillAssignments?.forEach(assignment => {
        if (!playerSkills[assignment.player_id]) {
          playerSkills[assignment.player_id] = []
        }
        playerSkills[assignment.player_id].push({
          skill_id: assignment.skill_id,
          skill_name: (assignment.player_skills as any)?.skill_name,
          skill_type: (assignment.player_skills as any)?.skill_type,
          skill_value_id: assignment.skill_value_id,
          value_name: (assignment.player_skill_values as any)?.value_name,
          value_array: assignment.value_array
        })
      })
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
      skills: playerSkills[player.id] || [],
      isRegistered: registeredPlayerIds.includes(player.id)
    })) || []

    return NextResponse.json({
      success: true,
      players: formattedPlayers
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Export the handlers with analytics
export const GET = withAnalytics(withAuth(getHandler, ['viewer', 'host', 'admin']))
