import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/src/lib/jwt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params
    
    // Get current player using the database function
    const { data: currentPlayer, error } = await supabase
      .rpc('get_current_player', { p_auction_id: auctionId })

    if (error) {
      console.error('Error fetching current player:', error)
      return NextResponse.json({ error: 'Failed to fetch current player' }, { status: 500 })
    }

    return NextResponse.json({ 
      currentPlayer: currentPlayer[0] || null 
    })
  } catch (error) {
    console.error('Error in GET /api/auctions/[id]/current-player:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
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

    // Verify user role (only hosts and admins can control current player)
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

    let result

    switch (action) {
      case 'set_current':
        if (!player_id) {
          return NextResponse.json({ error: 'Player ID is required' }, { status: 400 })
        }
        
        // Set specific player as current
        const { data: setResult, error: setError } = await supabase
          .rpc('set_current_player', { 
            p_auction_id: auctionId, 
            p_player_id: player_id 
          })
        
        if (setError) {
          console.error('Error setting current player:', setError)
          return NextResponse.json({ error: 'Failed to set current player' }, { status: 500 })
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Current player set successfully'
        })

      case 'next':
        // Move to next player
        const { data: nextResult, error: nextError } = await supabase
          .rpc('move_to_next_player', { p_auction_id: auctionId })
        
        if (nextError) {
          console.error('Error moving to next player:', nextError)
          return NextResponse.json({ error: 'Failed to move to next player' }, { status: 500 })
        }
        
        if (nextResult && nextResult.length > 0) {
          return NextResponse.json({ 
            success: true, 
            message: 'Moved to next player successfully'
          })
        } else {
          return NextResponse.json({ error: 'No next player available' }, { status: 400 })
        }

      case 'previous':
        // Move to previous player
        const { data: prevResult, error: prevError } = await supabase
          .rpc('move_to_previous_player', { p_auction_id: auctionId })
        
        if (prevError) {
          console.error('Error moving to previous player:', prevError)
          return NextResponse.json({ error: 'Failed to move to previous player' }, { status: 500 })
        }
        
        if (prevResult && prevResult.length > 0) {
          return NextResponse.json({ 
            success: true, 
            message: 'Moved to previous player successfully'
          })
        } else {
          return NextResponse.json({ error: 'No previous player available' }, { status: 400 })
        }

      case 'set_first':
        // Set first player as current (used when auction starts)
        const { data: firstResult, error: firstError } = await supabase
          .rpc('set_first_player_current', { p_auction_id: auctionId })
        
        if (firstError) {
          console.error('Error setting first player:', firstError)
          return NextResponse.json({ error: 'Failed to set first player' }, { status: 500 })
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'First player set as current successfully'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in POST /api/auctions/[id]/current-player:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
