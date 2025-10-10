import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sessionManager } from '@/src/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const userData = sessionManager.getUser()
    if (!userData) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Check if user has permission to create auctions
    if (userData.role !== 'host' && userData.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions to create auctions'
      }, { status: 403 })
    }

    const body = await request.json()
    const { tournament_id, start_time, end_time, starting_bid, bid_increment, description } = body

    // Validate required fields
    if (!tournament_id || !start_time || !end_time || !starting_bid || !bid_increment) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }

    // Validate that start time is before end time
    const startDate = new Date(start_time)
    const endDate = new Date(end_time)
    if (startDate >= endDate) {
      return NextResponse.json({
        success: false,
        error: 'Start time must be before end time'
      }, { status: 400 })
    }

    // Validate that start time is in the future
    if (startDate <= new Date()) {
      return NextResponse.json({
        success: false,
        error: 'Start time must be in the future'
      }, { status: 400 })
    }

    // Check if tournament exists and user has permission to create auction for it
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('id, host_id, name')
      .eq('id', tournament_id)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({
        success: false,
        error: 'Tournament not found'
      }, { status: 404 })
    }

    // Check if user is the host of the tournament or admin
    if (userData.role !== 'admin' && tournament.host_id !== userData.id) {
      return NextResponse.json({
        success: false,
        error: 'You can only create auctions for tournaments you host'
      }, { status: 403 })
    }

    // Create the auction
    const { data: auction, error } = await supabase
      .from('auctions')
      .insert({
        tournament_id,
        start_time,
        end_time,
        starting_bid: parseFloat(starting_bid),
        bid_increment: parseFloat(bid_increment),
        description: description || null,
        status: 'scheduled',
        created_by: userData.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating auction:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to create auction'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: auction,
      message: 'Auction created successfully'
    })

  } catch (error) {
    console.error('Error in auction creation:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const userData = sessionManager.getUser()
    if (!userData) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Fetch auctions with tournament details
    const { data: auctions, error } = await supabase
      .from('auctions')
      .select(`
        *,
        tournaments (
          id,
          name,
          format,
          tournament_date,
          venue
        )
      `)
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching auctions:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch auctions'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      auctions: auctions || []
    })

  } catch (error) {
    console.error('Error in auction fetching:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
