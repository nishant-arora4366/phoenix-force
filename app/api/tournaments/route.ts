import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Fetch all tournaments with slot information using service role (bypasses RLS)
    const { data: tournaments, error } = await supabaseAdmin
      .from('tournaments')
      .select(`
        *,
        tournament_slots!left(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // Process tournaments to add slot information
    const tournamentsWithSlots = await Promise.all(
      (tournaments || []).map(async (tournament) => {
        // Count all registered players (both confirmed and pending)
        const { count: totalRegistered } = await supabaseAdmin
          .from('tournament_slots')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', tournament.id)
          .in('status', ['confirmed', 'pending'])

        const totalRegisteredCount = totalRegistered || 0
        const tournamentCapacity = tournament.total_slots || 0

        // Filled slots = min(total registered, tournament capacity)
        const filledSlots = Math.min(totalRegisteredCount, tournamentCapacity)
        
        // Waitlist = players beyond capacity
        const waitlistCount = Math.max(0, totalRegisteredCount - tournamentCapacity)

        return {
          ...tournament,
          filled_slots: filledSlots,
          waitlist_count: waitlistCount,
          available_slots: tournamentCapacity - filledSlots
        }
      })
    )

    return NextResponse.json({ success: true, tournaments: tournamentsWithSlots })
  } catch (error: any) {
    console.error('Error fetching tournaments:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, format, selected_teams, tournament_date, description, total_slots, host_id, status, venue, google_maps_link } = body

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

    // Check authorization: Only admin or host role can create tournaments
    const isAdmin = userProfile.role === 'admin'
    const isHost = userProfile.role === 'host'

    if (!isAdmin && !isHost) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Only admin or host can create tournaments' }, { status: 403 })
    }

    // Validate required fields
    if (!name || !format || !selected_teams || !tournament_date || !total_slots || !host_id) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Ensure the host_id matches the authenticated user (unless admin)
    if (!isAdmin && sessionUser.id !== host_id) {
      return NextResponse.json({ success: false, error: 'Unauthorized: You can only create tournaments for yourself' }, { status: 403 })
    }

    // Debug: Log the tournament_date being received
    console.log('Received tournament_date:', tournament_date)
    console.log('Type of tournament_date:', typeof tournament_date)
    
    // Create tournament using service role (bypasses RLS)
    const { data: tournament, error: tournamentError } = await supabaseAdmin
      .from('tournaments')
      .insert({
        name,
        format,
        selected_teams,
        tournament_date,
        description,
        total_slots,
        host_id,
        status: status || 'draft',
        venue,
        google_maps_link
      })
      .select()
      .single()

    if (tournamentError) {
      return NextResponse.json({ success: false, error: tournamentError.message }, { status: 500 })
    }

    // No need to pre-create slots - they will be created dynamically as players register
    console.log('Tournament created successfully. Slots will be created dynamically as players register.')

    return NextResponse.json({ success: true, tournament })
  } catch (error: any) {
    console.error('Error creating tournament:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
