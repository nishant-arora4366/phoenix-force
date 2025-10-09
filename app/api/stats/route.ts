import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use service role client to bypass RLS for stats
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
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

    // Handle errors and log results for debugging
    if (playersResult.error) {
      console.error('Error fetching players count:', playersResult.error)
    } else {
      console.log('Players query successful, count:', playersResult.count)
    }
    
    if (tournamentsResult.error) {
      console.error('Error fetching tournaments count:', tournamentsResult.error)
    } else {
      console.log('Tournaments query successful, count:', tournamentsResult.count)
    }
    
    if (usersResult.error) {
      console.error('Error fetching users count:', usersResult.error)
    } else {
      console.log('Users query successful, count:', usersResult.count)
    }
    
    if (activeTournamentsResult.error) {
      console.error('Error fetching active tournaments count:', activeTournamentsResult.error)
    } else {
      console.log('Active tournaments query successful, count:', activeTournamentsResult.count)
    }

    // Extract counts, defaulting to 0 if there's an error
    const playersCount = playersResult.count || 0
    const tournamentsCount = tournamentsResult.count || 0
    const usersCount = usersResult.count || 0
    const activeTournamentsCount = activeTournamentsResult.count || 0

    console.log('Final stats:', {
      playersCount,
      tournamentsCount,
      usersCount,
      activeTournamentsCount
    })

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
    console.error('Error fetching platform statistics:', error)
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
