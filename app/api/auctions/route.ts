import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser, isHostOrAdmin } from '@/src/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js'
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
    const { tournament_id } = body

    // Validate required fields
    if (!tournament_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: tournament_id'
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
        status: 'pending',
        current_bid: 0,
        timer_seconds: 30,
        total_purse: 1000000
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
