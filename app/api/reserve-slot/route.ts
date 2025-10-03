import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const { tournament_id, player_id, slot_number } = await request.json()

    // Validate required fields
    if (!tournament_id || !player_id) {
      return NextResponse.json({
        success: false,
        error: 'Tournament ID and Player ID are required'
      }, { status: 400 })
    }

    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Call the reserve_slot RPC
    const { data, error } = await supabase.rpc('reserve_slot', {
      p_tournament_id: tournament_id,
      p_player_id: player_id,
      p_slot_number: slot_number || null,
      p_user_id: user.id
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
      message: 'Slot reservation processed'
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to reserve slot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
