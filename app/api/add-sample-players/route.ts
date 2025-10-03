import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Service role key not configured'
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Sample players data
    const samplePlayers = [
      {
        display_name: 'Virat Kohli',
        stage_name: 'King Kohli',
        bio: 'Aggressive batsman and former captain',
        base_price: 200,
        group_name: 'Group A',
        is_bowler: false,
        is_batter: true,
        is_wicket_keeper: false,
        bowling_rating: 3,
        batting_rating: 9,
        wicket_keeping_rating: 0
      },
      {
        display_name: 'Jasprit Bumrah',
        stage_name: 'Boom Boom',
        bio: 'Fast bowler with excellent yorkers',
        base_price: 180,
        group_name: 'Group A',
        is_bowler: true,
        is_batter: false,
        is_wicket_keeper: false,
        bowling_rating: 9,
        batting_rating: 2,
        wicket_keeping_rating: 0
      },
      {
        display_name: 'MS Dhoni',
        stage_name: 'Captain Cool',
        bio: 'Legendary wicket keeper and finisher',
        base_price: 250,
        group_name: 'Group B',
        is_bowler: false,
        is_batter: true,
        is_wicket_keeper: true,
        bowling_rating: 0,
        batting_rating: 8,
        wicket_keeping_rating: 9
      },
      {
        display_name: 'Ravindra Jadeja',
        stage_name: 'Sir Jadeja',
        bio: 'All-rounder with excellent fielding',
        base_price: 160,
        group_name: 'Group B',
        is_bowler: true,
        is_batter: true,
        is_wicket_keeper: false,
        bowling_rating: 7,
        batting_rating: 6,
        wicket_keeping_rating: 0
      },
      {
        display_name: 'Rohit Sharma',
        stage_name: 'Hitman',
        bio: 'Explosive opener and captain',
        base_price: 190,
        group_name: 'Group A',
        is_bowler: false,
        is_batter: true,
        is_wicket_keeper: false,
        bowling_rating: 2,
        batting_rating: 8,
        wicket_keeping_rating: 0
      },
      {
        display_name: 'Hardik Pandya',
        stage_name: 'Hardik',
        bio: 'Powerful all-rounder and finisher',
        base_price: 170,
        group_name: 'Group B',
        is_bowler: true,
        is_batter: true,
        is_wicket_keeper: false,
        bowling_rating: 6,
        batting_rating: 7,
        wicket_keeping_rating: 0
      }
    ]

    // Insert sample players
    const { data, error } = await supabaseAdmin
      .from('players')
      .insert(samplePlayers)
      .select()

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Sample players added successfully',
      players_added: data?.length || 0,
      players: data
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to add sample players',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
