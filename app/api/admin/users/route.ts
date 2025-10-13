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
        players!user_id (
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

    const { userId: targetUserId, status, role, firstname, lastname, username } = await request.json()

    if (!targetUserId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    let updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (role !== undefined) updateData.role = role
    if (firstname !== undefined) updateData.firstname = firstname || null
    if (lastname !== undefined) updateData.lastname = lastname || null
    if (username !== undefined) updateData.username = username || null

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

async function postHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    const adminUserId = user.id
    
    // Double-check admin status
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('id', adminUserId)
      .single()

    if (userError || !userData || userData.role !== 'admin' || userData.status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'Access denied - Admin role required'
      }, { status: 403 })
    }

    const { email, firstname, lastname, username, role, status } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }

    // Create user with service role (bypasses RLS)
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        firstname: firstname || null,
        lastname: lastname || null,
        username: username || null,
        role: role || 'viewer',
        status: status || 'pending'
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json({
        success: false,
        error: createError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

async function deleteHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    const adminUserId = user.id
    
    // Double-check admin status
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('id', adminUserId)
      .single()

    if (userError || !userData || userData.role !== 'admin' || userData.status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'Access denied - Admin role required'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    // Prevent admin from deleting themselves
    if (targetUserId === adminUserId) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete your own account'
      }, { status: 400 })
    }

    // Delete user using service role (bypasses RLS)
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', targetUserId)

    if (deleteError) {
      return NextResponse.json({
        success: false,
        error: deleteError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

async function patchHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    const adminUserId = user.id
    
    // Double-check admin status
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role, status')
      .eq('id', adminUserId)
      .single()

    if (userError || !userData || userData.role !== 'admin' || userData.status !== 'approved') {
      return NextResponse.json({
        success: false,
        error: 'Access denied - Admin role required'
      }, { status: 403 })
    }

    const { userId, playerId, action } = await request.json()

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    if (action === 'link') {
      if (!playerId) {
        return NextResponse.json({
          success: false,
          error: 'Player ID is required for linking'
        }, { status: 400 })
      }

      // Check if player is already linked to another user
      const { data: existingPlayer } = await supabaseAdmin
        .from('players')
        .select('user_id')
        .eq('id', playerId)
        .single()

      if (existingPlayer?.user_id && existingPlayer.user_id !== userId) {
        return NextResponse.json({
          success: false,
          error: 'Player is already linked to another user'
        }, { status: 400 })
      }

      // Link player to user
      const { error: linkError } = await supabaseAdmin
        .from('players')
        .update({ user_id: userId })
        .eq('id', playerId)

      if (linkError) {
        return NextResponse.json({
          success: false,
          error: linkError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Player linked to user successfully'
      })

    } else if (action === 'unlink') {
      // Unlink all players from user
      const { error: unlinkError } = await supabaseAdmin
        .from('players')
        .update({ user_id: null })
        .eq('user_id', userId)

      if (unlinkError) {
        return NextResponse.json({
          success: false,
          error: unlinkError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Player unlinked from user successfully'
      })

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "link" or "unlink"'
      }, { status: 400 })
    }

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
export const POST = withAnalytics(withAuth(postHandler, ['admin']))
export const DELETE = withAnalytics(withAuth(deleteHandler, ['admin']))
export const PATCH = withAnalytics(withAuth(patchHandler, ['admin']))
