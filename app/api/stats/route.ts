import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role client to bypass RLS for stats
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function getHandler(request: NextRequest) {
  try {
    // Fetch all statistics in parallel using admin client to bypass RLS
    const [
      playersResult,
      tournamentsResult,
      usersResult,
      activeTournamentsResult
    ] = await Promise.all([
      // Count registered players (all players, not just approved ones)
      supabaseAdmin
        .from('players')
        .select('id', { count: 'exact', head: true }),
      
      // Count total tournaments
      supabaseAdmin
        .from('tournaments')
        .select('id', { count: 'exact', head: true }),
      
      // Count total users
      supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true }),
      
      // Count active tournaments (registration_open or in_progress)
      supabaseAdmin
        .from('tournaments')
        .select('id', { count: 'exact', head: true })
        .in('status', ['registration_open', 'in_progress'])
    ])

      // Handle errors and extract counts

    // Extract counts, defaulting to 0 if there's an error
    const playersCount = playersResult.count || 0
    const tournamentsCount = tournamentsResult.count || 0
    const usersCount = usersResult.count || 0
    const activeTournamentsCount = activeTournamentsResult.count || 0

    // Calculate additional stats
    const stats = {
      playersRegistered: playersCount,
      totalTournaments: tournamentsCount,
      totalUsers: usersCount,
      activeTournaments: activeTournamentsCount,
      // Calculate some derived stats
      averagePlayersPerTournament: tournamentsCount > 0 ? Math.round(playersCount / tournamentsCount) : 0,
      platformGrowth: usersCount > 0 ? Math.round((usersCount / 1000) * 100) / 100 : 0 // Growth percentage
    }

    return NextResponse.json({
      success: true,
      stats
    })

    } catch (error) {
      return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch platform statistics',
        stats: {
          playersRegistered: 0,
          totalTournaments: 0,
          totalUsers: 0,
          activeTournaments: 0,
          averagePlayersPerTournament: 0,
          platformGrowth: 0
        }
      },
      { status: 500 }
    )
  }
}

// Export the handler with analytics
export const GET = withAnalytics(getHandler)
