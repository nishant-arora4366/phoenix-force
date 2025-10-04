import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Parse user data from authorization header
    let userData
    try {
      userData = JSON.parse(authHeader)
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid authorization header' }, { status: 401 })
    }

    if (!userData || !userData.id) {
      return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 })
    }

    // Fetch players from database using service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: false })

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
      data: data || [],
      message: 'Players fetched successfully'
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch players',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Parse user data from authorization header
    let userData
    try {
      userData = JSON.parse(authHeader)
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid authorization header' }, { status: 401 })
    }

    if (!userData || !userData.id) {
      return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 })
    }

    // Check if user has permission to create players (any authenticated user can create their own player profile)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userData.id)
      .single()

    if (userError || !user || user.status !== 'approved') {
      return NextResponse.json({ 
        success: false, 
        error: 'User not approved for creating player profile' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name, 
      bio, 
      batting_style, 
      bowling_style, 
      role, 
      price, 
      group, 
      photo, 
      user_id 
    } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json({
        success: false,
        error: 'Player name is required'
      }, { status: 400 })
    }

    // Check if player profile already exists for this user
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', user_id)
      .single()

    if (existingPlayer) {
      return NextResponse.json({
        success: false,
        error: 'Player profile already exists for this user'
      }, { status: 400 })
    }

    // Create player profile
    const { data: player, error } = await supabase
      .from('players')
      .insert({
        user_id,
        name,
        bio: bio || null,
        batting_style: batting_style || null,
        bowling_style: bowling_style || null,
        role: role || null,
        price: Number(price) || 0,
        group: group || null,
        photo: photo || null,
        status: 'pending' // New player profiles need admin approval
      })
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

    return NextResponse.json({
      success: true,
      data: player,
      message: 'Player profile created successfully'
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create player profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Parse user data from authorization header
    let userData
    try {
      userData = JSON.parse(authHeader)
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid authorization header' }, { status: 401 })
    }

    if (!userData || !userData.id) {
      return NextResponse.json({ success: false, error: 'User not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      id,
      name, 
      bio, 
      batting_style, 
      bowling_style, 
      role, 
      price, 
      group, 
      photo, 
      user_id 
    } = body

    // Validate required fields
    if (!name || !id) {
      return NextResponse.json({
        success: false,
        error: 'Player name and ID are required'
      }, { status: 400 })
    }

    // Check if user owns this player profile
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: existingPlayer } = await supabase
      .from('players')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existingPlayer || existingPlayer.user_id !== userData.id) {
      return NextResponse.json({
        success: false,
        error: 'You can only update your own player profile'
      }, { status: 403 })
    }

    // Update player profile
    const { data: player, error } = await supabase
      .from('players')
      .update({
        name,
        bio: bio || null,
        batting_style: batting_style || null,
        bowling_style: bowling_style || null,
        role: role || null,
        price: Number(price) || 0,
        group: group || null,
        photo: photo || null,
        status: 'pending' // Reset to pending when updated
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

    return NextResponse.json({
      success: true,
      data: player,
      message: 'Player profile updated successfully'
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update player profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}