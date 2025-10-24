import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/src/lib/jwt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params
    const body = await request.json()
    const { action, player_id } = body

    // Verify authentication
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userId = decoded.userId

    // Verify user role (only hosts and admins can modify players)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!['admin', 'host'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    switch (action) {
      case 'increment_skip':
        if (!player_id) {
          return NextResponse.json({ error: 'Player ID is required' }, { status: 400 })
        }
        
        // Increment times_skipped for the player
        const { data: currentPlayer, error: fetchError } = await supabase
          .from('auction_players')
          .select('times_skipped')
          .eq('auction_id', auctionId)
          .eq('player_id', player_id)
          .single()
        
        if (fetchError) {
          console.error('Error fetching player:', fetchError)
          return NextResponse.json({ error: 'Player not found' }, { status: 404 })
        }
        
        const { error: updateError } = await supabase
          .from('auction_players')
          .update({ 
            times_skipped: (currentPlayer.times_skipped || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('auction_id', auctionId)
          .eq('player_id', player_id)
        
        if (updateError) {
          console.error('Error incrementing skip count:', updateError)
          return NextResponse.json({ error: 'Failed to increment skip count' }, { status: 500 })
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Skip count incremented successfully'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in PATCH /api/auctions/[id]/players:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
