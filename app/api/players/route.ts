import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Create a new Supabase client with the auth header
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Fetch players from database
    const { data, error } = await supabaseWithAuth
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

    // Create a new Supabase client with the auth header
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has permission to create players (any authenticated user can create their own player profile)
    const { data: userData } = await supabaseWithAuth
      .from('users')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (!userData || userData.status !== 'approved') {
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
    const { data: existingPlayer } = await supabaseWithAuth
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
    const { data: player, error } = await supabaseWithAuth
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

    // Create a new Supabase client with the auth header
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader
          }
        }
      }
    )

    // Ensure user is authenticated
    const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
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
    const { data: existingPlayer } = await supabaseWithAuth
      .from('players')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existingPlayer || existingPlayer.user_id !== user.id) {
      return NextResponse.json({
        success: false,
        error: 'You can only update your own player profile'
      }, { status: 403 })
    }

    // Update player profile
    const { data: player, error } = await supabaseWithAuth
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