import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyToken } from '@/src/lib/jwt'
import { USER_ROLES } from '@/lib/constants'
import { logger } from '@/lib/logger'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Fetch replacements for an auction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    
    // Build query
    let query = supabaseAdmin
      .from('player_replacements')
      .select(`
        *,
        original_player:players!player_replacements_original_player_id_fkey(
          id, display_name, profile_pic_url
        ),
        replacement_player:players!player_replacements_replacement_player_id_fkey(
          id, display_name, profile_pic_url
        ),
        team:auction_teams(
          id, team_name
        ),
        replaced_by_user:users!player_replacements_replaced_by_fkey(
          id, email, username, firstname, lastname
        ),
        approved_by_user:users!player_replacements_approved_by_fkey(
          id, email, username, firstname, lastname
        )
      `)
      .eq('auction_id', auctionId)
    
    if (teamId) {
      query = query.eq('team_id', teamId)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) {
      logger.error('Error fetching replacements', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch replacements' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      replacements: data || []
    })
  } catch (error) {
    logger.error('Error in GET replacements', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST: Add a new replacement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params
    const body = await request.json()
    const { teamId, originalPlayerId, replacementPlayerId, reason } = body
    
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded?.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    // Check user role - only admins and hosts can add replacements
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.HOST) {
      return NextResponse.json(
        { error: 'Only admins and hosts can add replacements' },
        { status: 403 }
      )
    }
    
    // Check if auction is completed
    const { data: auction, error: auctionError } = await supabaseAdmin
      .from('auctions')
      .select('status, created_by')
      .eq('id', auctionId)
      .single()
    
    if (auctionError || !auction) {
      return NextResponse.json(
        { error: 'Auction not found' },
        { status: 404 }
      )
    }
    
    if (auction.status !== 'completed') {
      return NextResponse.json(
        { error: 'Replacements can only be added to completed auctions' },
        { status: 400 }
      )
    }
    
    // Hosts can only modify their own auctions
    if (user.role === USER_ROLES.HOST && auction.created_by !== decoded.userId) {
      return NextResponse.json(
        { error: 'You can only modify your own auctions' },
        { status: 403 }
      )
    }
    
    // Call the database function to add replacement
    const { data: result, error: replaceError } = await supabaseAdmin
      .rpc('add_player_replacement', {
        p_auction_id: auctionId,
        p_team_id: teamId,
        p_original_player_id: originalPlayerId,
        p_replacement_player_id: replacementPlayerId,
        p_reason: reason || 'Player unavailable',
        p_replaced_by: decoded.userId,
        p_auto_approve: user.role === USER_ROLES.ADMIN // Auto-approve for admins
      })
    
    if (replaceError) {
      logger.error('Error adding replacement', replaceError)
      return NextResponse.json(
        { 
          success: false, 
          error: replaceError.message || 'Failed to add replacement' 
        },
        { status: 400 }
      )
    }
    
    if (!result?.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result?.error || 'Failed to add replacement' 
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      replacementId: result.replacement_id,
      status: result.status,
      message: 'Replacement added successfully'
    })
  } catch (error) {
    logger.error('Error in POST replacement', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH: Approve or reject a replacement
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { replacementId, action } = body
    
    // Verify authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)
    if (!decoded?.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    // Only admins can approve/reject replacements
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', decoded.userId)
      .single()
    
    if (userError || !user || user.role !== USER_ROLES.ADMIN) {
      return NextResponse.json(
        { error: 'Only admins can approve replacements' },
        { status: 403 }
      )
    }
    
    if (action === 'approve') {
      const { data: result, error: approveError } = await supabaseAdmin
        .rpc('approve_player_replacement', {
          p_replacement_id: replacementId,
          p_approved_by: decoded.userId
        })
      
      if (approveError || !result?.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: result?.error || 'Failed to approve replacement' 
          },
          { status: 400 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Replacement approved successfully'
      })
    } else if (action === 'reject') {
      const { error: rejectError } = await supabaseAdmin
        .from('player_replacements')
        .update({
          status: 'rejected',
          approved_by: decoded.userId,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', replacementId)
      
      if (rejectError) {
        return NextResponse.json(
          { error: 'Failed to reject replacement' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'Replacement rejected successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      )
    }
  } catch (error) {
    logger.error('Error in PATCH replacement', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
