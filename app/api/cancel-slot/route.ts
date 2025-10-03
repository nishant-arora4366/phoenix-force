import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: Request) {
  try {
    const { tournament_id, slot_id } = await request.json()

    // Validate required fields
    if (!tournament_id || !slot_id) {
      return NextResponse.json({
        success: false,
        error: 'Tournament ID and Slot ID are required'
      }, { status: 400 })
    }

    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Call the cancel_slot_reservation RPC
    const { data, error } = await supabase.rpc('cancel_slot_reservation', {
      p_tournament_id: tournament_id,
      p_slot_id: slot_id,
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
      message: 'Slot cancellation processed'
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel slot',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
