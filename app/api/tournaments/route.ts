import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function getHandler(request: NextRequest) {
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
        // Count all registered players (both confirmed and pending) that have a player assigned
        const { count: totalRegistered } = await supabaseAdmin
          .from('tournament_slots')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', tournament.id)
          .in('status', ['confirmed', 'pending'])
          .not('player_id', 'is', null)

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
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

async function postHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    const body = await request.json()
    const { 
      name, 
      format, 
      selected_teams, 
      tournament_date, 
      description, 
      total_slots, 
      host_id, 
      status, 
      venue, 
      google_maps_link,
      community_restrictions,
      base_price_restrictions,
      min_base_price,
      max_base_price
    } = body

    // SECURITY: User is already authenticated via withAuth middleware
    const sessionUser = user
    
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Check authorization: Only admin or host role can create tournaments
    const isAdmin = sessionUser.role === 'admin'
    const isHost = sessionUser.role === 'host'

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
        google_maps_link,
        community_restrictions: community_restrictions || null,
        base_price_restrictions: base_price_restrictions || null,
        min_base_price: min_base_price || null,
        max_base_price: max_base_price || null
      })
      .select()
      .single()

    if (tournamentError) {
      return NextResponse.json({ success: false, error: tournamentError.message }, { status: 500 })
    }

    // No need to pre-create slots - they will be created dynamically as players register

    return NextResponse.json({ success: true, tournament })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}




// Export the handlers with analytics
export const GET = withAnalytics(getHandler)
export const POST = withAnalytics(withAuth(postHandler, ['host', 'admin']))
