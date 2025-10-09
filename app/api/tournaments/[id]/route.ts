import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch tournament using service role (bypasses RLS)
    const { data: tournament, error } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (!tournament) {
      return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, tournament })
  } catch (error: any) {
    console.error('Error fetching tournament:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, format, selected_teams, tournament_date, description, total_slots, status, venue, google_maps_link } = body

    // SECURITY: Check authentication and authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    let sessionUser
    try {
      sessionUser = JSON.parse(authHeader)
      if (!sessionUser || !sessionUser.id) {
        return NextResponse.json({ success: false, error: 'Invalid authentication' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid authentication format' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', sessionUser.id)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Get tournament to check if user is host
    const { data: tournamentData, error: tournamentError } = await supabaseAdmin
      .from('tournaments')
      .select('host_id')
      .eq('id', id)
      .single()

    if (tournamentError || !tournamentData) {
      return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 })
    }

    // Check authorization: Only admin or tournament host can update
    const isAdmin = userProfile.role === 'admin'
    const isHost = sessionUser.id === tournamentData.host_id

    if (!isAdmin && !isHost) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only admin or tournament host can update' }, { status: 403 })
    }

    // Handle status-only updates
    if (status && !name && !format && !selected_teams && !tournament_date && !description && !total_slots && !venue && !google_maps_link) {
      const { data: tournament, error } = await supabaseAdmin
        .from('tournaments')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, tournament })
    }

    // Handle full tournament updates
    if (!name || !format || !selected_teams || !tournament_date || !total_slots) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Update tournament using service role (bypasses RLS)
    const { data: tournament, error } = await supabaseAdmin
      .from('tournaments')
      .update({
        name,
        format,
        selected_teams,
        tournament_date,
        description,
        total_slots,
        venue,
        google_maps_link,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, tournament })
  } catch (error: any) {
    console.error('Error updating tournament:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // SECURITY: Check authentication and authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    let sessionUser
    try {
      sessionUser = JSON.parse(authHeader)
      if (!sessionUser || !sessionUser.id) {
        return NextResponse.json({ success: false, error: 'Invalid authentication' }, { status: 401 })
      }
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid authentication format' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', sessionUser.id)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Get tournament to check if user is host
    const { data: tournamentData, error: tournamentError } = await supabaseAdmin
      .from('tournaments')
      .select('host_id')
      .eq('id', id)
      .single()

    if (tournamentError || !tournamentData) {
      return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 })
    }

    // Check authorization: Only admin or tournament host can delete
    const isAdmin = userProfile.role === 'admin'
    const isHost = sessionUser.id === tournamentData.host_id

    if (!isAdmin && !isHost) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only admin or tournament host can delete' }, { status: 403 })
    }

    // Delete tournament using service role (bypasses RLS)
    const { error } = await supabaseAdmin
      .from('tournaments')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting tournament:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}