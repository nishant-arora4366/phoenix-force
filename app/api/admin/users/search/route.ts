import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware'
import { createClient } from '@supabase/supabase-js'
import { withAnalytics } from '@/src/lib/api-analytics'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function searchHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const filter = searchParams.get('filter') || 'all'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build the query
    let usersQuery = supabaseAdmin
      .from('users')
      .select(`
        *,
        players!user_id (
          id,
          display_name,
          status,
          created_at
        )
      `)

    // Apply search filter
    if (query) {
      usersQuery = usersQuery.or(
        `email.ilike.%${query}%,` +
        `firstname.ilike.%${query}%,` +
        `lastname.ilike.%${query}%,` +
        `username.ilike.%${query}%`
      )
    }

    // Apply status filter
    if (filter !== 'all') {
      usersQuery = usersQuery.eq('status', filter)
    }

    // Apply pagination
    usersQuery = usersQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: users, error, count } = await usersQuery

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // Transform the data
    const transformedUsers = users?.map(user => ({
      ...user,
      player_profile: user.players?.[0] ? {
        id: user.players[0].id,
        display_name: user.players[0].display_name,
        status: user.players[0].status,
        created_at: user.players[0].created_at
      } : null
    })) || []

    return NextResponse.json({
      success: true,
      users: transformedUsers,
      count,
      limit,
      offset
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// Export with authentication and analytics
export const GET = withAnalytics(withAuth(searchHandler, ['admin']))
