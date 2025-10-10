import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { withAuth, AuthenticatedUser, isHostOrAdmin } from '@/src/lib/auth-middleware'
import { withAnalytics } from '@/src/lib/api-analytics'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function createAuction(request: NextRequest, user: AuthenticatedUser) {
  try {
    // Check if user has permission to create auctions
    if (!isHostOrAdmin(user)) {
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
    if (user.role !== 'admin' && tournament.host_id !== user.id) {
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
        created_by: user.id
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

// Export the authenticated handler with analytics
export const POST = withAnalytics(withAuth(createAuction, ['host', 'admin']))

async function getAuctions(request: NextRequest, user: AuthenticatedUser) {
  try {

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

// Export the authenticated handler with analytics
export const GET = withAnalytics(withAuth(getAuctions))
