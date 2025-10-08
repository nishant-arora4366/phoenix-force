import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Automatic promotion endpoint - no authentication required for system calls
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params
    
    console.log('=== AUTOMATIC WAITLIST PROMOTION ===')
    console.log('Tournament ID:', tournamentId)

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      console.error('Tournament not found:', tournamentError)
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 })
    }

    console.log('Tournament total slots:', tournament.total_slots)

    // Use the simplified FCFS promotion function
    console.log('=== USING SIMPLIFIED FCFS PROMOTION SYSTEM ===')
    
    const { data: promotionResult, error: promotionError } = await supabase
      .rpc('promote_next_player_simple', {
        p_tournament_id: tournamentId
      })

    if (promotionError) {
      console.error('Error in FCFS promotion:', promotionError)
      return NextResponse.json({ 
        error: 'Failed to promote waitlist player',
        details: promotionError.message
      }, { status: 500 })
    }

    if (!promotionResult || promotionResult.length === 0) {
      console.log('No promotion result returned')
      return NextResponse.json({ 
        success: false, 
        message: 'No waitlist players to promote' 
      }, { status: 200 })
    }

    const result = promotionResult[0]
    
    if (!result.success) {
      console.log('Promotion failed:', result.message)
      return NextResponse.json({ 
        success: false, 
        message: result.message 
      }, { status: 200 })
    }

    console.log('=== SIMPLIFIED FCFS PROMOTION SUCCESSFUL ===')
    console.log('Successfully promoted waitlist player using simplified FCFS system')
    console.log('Player ID:', result.promoted_player_id)
    console.log('Message:', result.message)
    
    return NextResponse.json({
      success: true,
      message: result.message,
      promoted_player: {
        id: result.promoted_player_id
      }
    })

  } catch (error: any) {
    console.error('Error in automatic promotion:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message
    }, { status: 500 })
  }
}
