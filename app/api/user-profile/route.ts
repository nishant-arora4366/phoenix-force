import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Public handler - allows fetching any user profile by userId (no auth required)
async function getUserProfilePublic(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'userId is required'
      }, { status: 400 })
    }

    const { data: profileUser, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, firstname, middlename, lastname, photo, role, status, created_at, updated_at')
      .eq('id', userId)
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: profileUser
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// Authenticated handler - fetches current user's own profile (auth required)
async function getUserProfile(request: NextRequest, user: AuthenticatedUser) {
  try {
    const { data: profileUser, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, firstname, middlename, lastname, photo, role, status, created_at, updated_at')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // Check if user has a linked player profile
    const { data: playerProfile } = await supabaseAdmin
      .from('players')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      data: {
        ...profileUser,
        player_id: playerProfile?.id || null
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// Wrapper to handle both authenticated and public requests
async function getHandler(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  // If userId is provided, use public handler (no auth required)
  if (userId) {
    return getUserProfilePublic(request)
  }

  // Otherwise, require authentication and return current user's profile
  return withAuth(getUserProfile)(request)
}

async function updateUserProfile(request: NextRequest, user: AuthenticatedUser) {
  try {
    const body = await request.json()
    const { userId, profile } = body

    // Users can only update their own profile unless they're admin
    const targetUserId = userId || user.id
    if (user.role !== 'admin' && targetUserId !== user.id) {
      return NextResponse.json({
        success: false,
        error: 'You can only update your own profile'
      }, { status: 403 })
    }

    // Validate required fields
    if (!profile.firstname || !profile.lastname) {
      return NextResponse.json({
        success: false,
        error: 'First name and last name are required'
      }, { status: 400 })
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({
        username: profile.username || null,
        firstname: profile.firstname,
        middlename: profile.middlename || null,
        lastname: profile.lastname,
        photo: profile.photo || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedUser
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

// Export the authenticated handler
const putHandler = withAuth(updateUserProfile)

// Export the handlers with analytics
export const GET = withAnalytics(getHandler)
export const PUT = withAnalytics(putHandler)
