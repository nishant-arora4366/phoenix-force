import { NextRequest, NextResponse } from 'next/server'
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function getUserProfile(request: NextRequest, user: AuthenticatedUser) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // If no userId provided, return current user's profile
    const targetUserId = userId || user.id

    const { data: profileUser, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, firstname, middlename, lastname, photo, role, status, created_at, updated_at')
      .eq('id', targetUserId)
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

// Export the authenticated handler
const getHandler = withAuth(getUserProfile)

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


