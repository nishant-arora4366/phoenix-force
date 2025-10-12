import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Public GET handler - no authentication required to view tournament details
async function getHandlerPublic(
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
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

async function putHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      name, 
      format, 
      selected_teams, 
      tournament_date, 
      description, 
      total_slots, 
      status, 
      venue, 
      google_maps_link,
      community_restrictions,
      base_price_restrictions,
      min_base_price,
      max_base_price
    } = body

    // SECURITY: User is already authenticated via withAuth middleware
    // The 'user' parameter contains the verified user from JWT
    const sessionUser = user
    
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // User role is already in the user object from JWT
    const userProfile = { role: sessionUser.role }

    // Get tournament to check if user is host
    const { data: tournamentData, error: tournamentError } = await supabaseAdmin
      .from('tournaments')
      .select('host_id')
      .eq('id', id)
      .single()

    if (tournamentError || !tournamentData) {
      return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 })
    }

    // Check authorization: Only admin or (tournament host with host role) can update
    const isAdmin = userProfile.role === 'admin'
    const isTournamentHost = sessionUser.id === tournamentData.host_id
    const hasHostRole = userProfile.role === 'host'

    if (!isAdmin && !(isTournamentHost && hasHostRole)) {
      return NextResponse.json({ success: false, error: 'Not authorized to update this tournament' }, { status: 403 })
    }

    // Handle status-only updates
    if (status && !name && !format && !selected_teams && !tournament_date && !description && !total_slots && !venue && !google_maps_link) {
    const { data: updatedTournament, error } = await supabaseAdmin
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

      return NextResponse.json({ success: true, tournament: updatedTournament })
    }

    // Handle full tournament updates
    if (!name || !format || !selected_teams || !tournament_date || !total_slots) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Update tournament using service role (bypasses RLS)
    const { data: updatedTournament, error } = await supabaseAdmin
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
        community_restrictions: community_restrictions || null,
        base_price_restrictions: base_price_restrictions || null,
        min_base_price: min_base_price || null,
        max_base_price: max_base_price || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, tournament: updatedTournament })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

async function deleteHandler(
  request: NextRequest,
  user: AuthenticatedUser,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // SECURITY: User is already authenticated via withAuth middleware
    // The 'user' parameter contains the verified user from JWT
    const sessionUser = user
    
    if (!sessionUser || !sessionUser.id) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // User role is already in the user object from JWT
    const userProfile = { role: sessionUser.role }

    // Get tournament to check if user is host
    const { data: tournamentData, error: tournamentError } = await supabaseAdmin
      .from('tournaments')
      .select('host_id')
      .eq('id', id)
      .single()

    if (tournamentError || !tournamentData) {
      return NextResponse.json({ success: false, error: 'Tournament not found' }, { status: 404 })
    }

    // Check authorization: Only admin or (tournament host with host role) can delete
    const isAdmin = userProfile.role === 'admin'
    const isTournamentHost = sessionUser.id === tournamentData.host_id
    const hasHostRole = userProfile.role === 'host'

    if (!isAdmin && !(isTournamentHost && hasHostRole)) {
      return NextResponse.json({ success: false, error: 'Not authorized to delete this tournament' }, { status: 403 })
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
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// Public wrapper for GET - no authentication required
async function getWrapperPublic(request: NextRequest) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const tournamentId = pathParts[pathParts.length - 1] // Get the tournament ID from the path
  if (!tournamentId) {
    return NextResponse.json({ success: false, error: 'Tournament ID required' }, { status: 400 })
  }
  return getHandlerPublic(request, { params: Promise.resolve({ id: tournamentId }) })
}

async function putWrapper(request: NextRequest, user: AuthenticatedUser) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const tournamentId = pathParts[pathParts.length - 1] // Get the tournament ID from the path
  if (!tournamentId) {
    return NextResponse.json({ success: false, error: 'Tournament ID required' }, { status: 400 })
  }
  return putHandler(request, user, { params: Promise.resolve({ id: tournamentId }) })
}

async function deleteWrapper(request: NextRequest, user: AuthenticatedUser) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split('/')
  const tournamentId = pathParts[pathParts.length - 1] // Get the tournament ID from the path
  if (!tournamentId) {
    return NextResponse.json({ success: false, error: 'Tournament ID required' }, { status: 400 })
  }
  return deleteHandler(request, user, { params: Promise.resolve({ id: tournamentId }) })
}

// Export the handlers with analytics
// GET is public - anyone can view tournament details
export const GET = withAnalytics(getWrapperPublic)
// PUT and DELETE require authentication
export const PUT = withAnalytics(withAuth(putWrapper, ['viewer', 'host', 'admin']))
export const DELETE = withAnalytics(withAuth(deleteWrapper, ['viewer', 'host', 'admin']))
