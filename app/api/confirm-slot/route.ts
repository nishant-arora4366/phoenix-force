import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { tournament_id, slot_id } = await request.json()

    // Validate required fields
    if (!tournament_id || !slot_id) {
      return NextResponse.json({
        success: false,
        error: 'Tournament ID and Slot ID are required'
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

    // Call the confirm_slot RPC
    const { data, error } = await supabase.rpc('confirm_slot', {
      p_tournament_id: tournament_id,
      p_slot_id: slot_id,
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
      message: 'Slot confirmation processed'
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to confirm slot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
