import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tournament_id = searchParams.get('tournament_id')

    if (!tournament_id) {
      return NextResponse.json({
        success: false,
        error: 'Tournament ID is required'
      }, { status: 400 })
    }

    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Call the get_tournament_status RPC
    const { data, error } = await supabase.rpc('get_tournament_status', {
      p_tournament_id: tournament_id
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
      message: 'Tournament status retrieved successfully'
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get tournament status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
