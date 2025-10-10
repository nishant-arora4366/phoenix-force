import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { createClient } from '@supabase/supabase-js'
import { withAnalytics } from '@/src/lib/api-analytics'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function getHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    // Use user ID from JWT token (already authenticated by withAuth middleware)
    const userId = user.id

    // Check if user is admin using service role (bypasses RLS)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    if (userData.role !== 'admin' || userData.status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'Access denied'
      }, { status: 403 })
    }

    // Fetch all users with their player profiles using service role (bypasses RLS)
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        players!players_user_id_fkey (
          id,
          display_name,
          status,
          created_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // Transform the data to match the expected interface
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
      users: transformedUsers
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

async function putHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    // User is already authenticated via withAuth middleware
    // The middleware already checks that user.role === 'admin'
    const adminUserId = user.id
    
    if (!adminUserId) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 })
    }

    // Double-check admin status using service role (bypasses RLS)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('id', adminUserId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    if (userData.role !== 'admin' || userData.status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'Access denied - Admin role required'
      }, { status: 403 })
    }

    const { userId: targetUserId, status, role } = await request.json()

    if (!targetUserId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    let updateData: any = {}
    if (status) updateData.status = status
    if (role) updateData.role = role

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No update data provided'
      }, { status: 400 })
    }

    // Update user using service role (bypasses RLS)
    const { error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', targetUserId)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// Export the handlers with analytics
export const GET = withAnalytics(withAuth(getHandler, ['admin']))
export const PUT = withAnalytics(withAuth(putHandler, ['admin']))
