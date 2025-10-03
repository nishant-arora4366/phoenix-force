import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tournament_id = searchParams.get('tournament_id')
    
    if (!tournament_id) {
      return NextResponse.json({
        success: false,
        error: 'Missing tournament_id parameter'
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
    const { data, error } = await supabaseAdmin.rpc('get_auction_status', {
      p_tournament_id: tournament_id
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
      message: 'Auction status retrieved'
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to get auction status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
