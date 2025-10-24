import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { AuthenticatedUser } from '@/src/lib/auth-middleware'
import { logger } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params
    
    // Get current player using the database function
    const { data: currentPlayer, error } = await supabase
      .rpc('get_current_player', { p_auction_id: auctionId })

    if (error) {
      logger.error('Error fetching current player:', error)
      return NextResponse.json({ error: 'Failed to fetch current player' }, { status: 500 })
    }

    return NextResponse.json({ 
      currentPlayer: currentPlayer[0] || null 
    })
  } catch (error) {
    logger.error('Error in GET /api/auctions/[id]/current-player:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function postHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params
    const body = await request.json()
    const { action, player_id } = body

    // User already authenticated via middleware
    // Check role
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
          logger.error('Error setting current player:', setError)
          return NextResponse.json({ error: 'Failed to set current player' }, { status: 500 })
        }

        // Reset timer on explicit current player set
        await supabase.from('auctions').update({
          timer_last_reset_at: new Date().toISOString(),
          timer_paused: false,
          timer_paused_remaining_seconds: null
        }).eq('id', auctionId)
        
        return NextResponse.json({ 
          success: true, 
          message: 'Current player set successfully'
        })

      case 'next':
        // Move to next player
        const { data: nextResult, error: nextError } = await supabase
          .rpc('move_to_next_player', { p_auction_id: auctionId })
        
        if (nextError) {
          logger.error('Error moving to next player:', nextError)
          return NextResponse.json({ error: 'Failed to move to next player' }, { status: 500 })
        }
        
        if (nextResult && nextResult.length > 0) {
          await supabase.from('auctions').update({
            timer_last_reset_at: new Date().toISOString(),
            timer_paused: false,
            timer_paused_remaining_seconds: null
          }).eq('id', auctionId)
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
          logger.error('Error moving to previous player:', prevError)
          return NextResponse.json({ error: 'Failed to move to previous player' }, { status: 500 })
        }
        
        if (prevResult && prevResult.length > 0) {
          await supabase.from('auctions').update({
            timer_last_reset_at: new Date().toISOString(),
            timer_paused: false,
            timer_paused_remaining_seconds: null
          }).eq('id', auctionId)
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
          logger.error('Error setting first player:', firstError)
          return NextResponse.json({ error: 'Failed to set first player' }, { status: 500 })
        }

        await supabase.from('auctions').update({
          timer_last_reset_at: new Date().toISOString(),
          timer_paused: false,
          timer_paused_remaining_seconds: null
        }).eq('id', auctionId)
        
        return NextResponse.json({ 
          success: true, 
          message: 'First player set as current successfully'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    logger.error('Error in POST /api/auctions/[id]/current-player:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Export with middleware
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await import('@/src/lib/auth-middleware').then(m => m.authenticateRequest(request))
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  return getHandler(request, user, context)
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await import('@/src/lib/auth-middleware').then(m => m.authenticateRequest(request))
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }
  if (!['admin', 'host'].includes(user.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }
  return postHandler(request, user, context)
}
