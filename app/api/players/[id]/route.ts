import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch specific player using service role (bypasses RLS)
    // GET requests are public - no authentication required for viewing
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    if (!player) {
      return NextResponse.json({
        success: false,
        error: 'Player not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: player,
      message: 'Player fetched successfully'
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch player',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Check if user has permission to update players (admin or host)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userData.id)
      .single()

    if (userError || !user || user.status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'User not approved for updating players'
      }, { status: 403 })
    }

    if (user.role !== 'admin' && user.role !== 'host') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only admins and hosts can update players' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { 
      display_name, 
      stage_name, 
      bio, 
      profile_pic_url, 
      base_price, 
      group_name, 
      is_bowler, 
      is_batter, 
      is_wicket_keeper, 
      bowling_rating, 
      batting_rating, 
      wicket_keeping_rating 
    } = body

    // Validate required fields
    if (!display_name || !base_price) {
      return NextResponse.json({
        success: false,
        error: 'Display name and base price are required'
      }, { status: 400 })
    }

    // Update player
    const { data: player, error } = await supabase
      .from('players')
      .update({
        display_name,
        stage_name: stage_name || null,
        bio: bio || null,
        profile_pic_url: profile_pic_url || null,
        base_price: Number(base_price),
        group_name: group_name || null,
        is_bowler: Boolean(is_bowler),
        is_batter: Boolean(is_batter),
        is_wicket_keeper: Boolean(is_wicket_keeper),
        bowling_rating: bowling_rating ? Number(bowling_rating) : null,
        batting_rating: batting_rating ? Number(batting_rating) : null,
        wicket_keeping_rating: wicket_keeping_rating ? Number(wicket_keeping_rating) : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    if (!player) {
      return NextResponse.json({
        success: false,
        error: 'Player not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: player,
      message: 'Player updated successfully'
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update player',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Check if user has permission to delete players (admin only)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userData.id)
      .single()

    if (userError || !user || user.status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'User not approved for deleting players'
      }, { status: 403 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only admins can delete players' 
      }, { status: 403 })
    }

    // Delete player
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Player deleted successfully'
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete player',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
