import { NextRequest, NextResponse } from 'next/server'
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function postHandler(request: NextRequest) {
  try {
    const { tournament_id, player_id, preferred_slot } = await request.json()

    // Validate required fields
    if (!tournament_id || !player_id) {
      return NextResponse.json({
        success: false,
        error: 'Tournament ID and Player ID are required'
      }, { status: 400 })
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    let userData
    try {
      userData = JSON.parse(authHeader)
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid authorization header' }, { status: 401 })
    }

    if (!userData || !userData.id) {
      return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 })
    }

    // Call the register_player RPC
    const { data, error } = await supabase.rpc('register_player', {
      p_tournament_id: tournament_id,
      p_player_id: player_id,
      p_preferred_slot: preferred_slot || null,
      p_user_id: userData.id
    })

    if (error) {
      console.error('RPC Error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message, 
        details: error 
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Player registration processed'
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to register player',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}


