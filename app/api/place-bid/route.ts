import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics';
import { createClient } from '@supabase/supabase-js'

async function POSTHandler(request: NextRequest, user: AuthenticatedUser) {
  try {
    const { tournament_id, player_id, team_id, bid_amount } = await request.json()
    
    // Validate required fields
    if (!tournament_id || !player_id || !team_id || !bid_amount) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: tournament_id, player_id, team_id, bid_amount'
      }, { status: 400 })
    }
    
    // Validate bid amount
    if (bid_amount <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Bid amount must be greater than 0'
      }, { status: 400 })
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Service role key not configured'
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Call the RPC function
    const { data, error } = await supabaseAdmin.rpc('place_bid', {
      p_tournament_id: tournament_id,
      p_player_id: player_id,
      p_team_id: team_id,
      p_bid_amount: bid_amount
    })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Bid placement attempted'
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to place bid',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Export handlers with analytics

// Export the handlers with analytics
export const POST = withAnalytics(withAuth(POSTHandler, ['viewer', 'host', 'admin']))
