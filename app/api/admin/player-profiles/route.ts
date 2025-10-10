import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics';
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function getHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    // User is already authenticated via withAuth middleware
    const userId = user.id
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 })
    }

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
        error: 'Access denied - Admin role required'
      }, { status: 403 })
    }

    // Fetch all player profiles with user information using service role (bypasses RLS)
    const { data: profiles, error } = await supabaseAdmin
      .from('players')
      .select(`
        *,
        users!players_user_id_fkey (
          id,
          email,
          username,
          firstname,
          lastname,
          role,
          status
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profiles: profiles || []
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
    // Get user ID from query parameters (passed from client-side session)
    const url = new URL(request.url)
    const adminUserId = url.searchParams.get('userId')
    
    if (!adminUserId) {
      return NextResponse.json({
        success: false,
        error: 'No user ID provided'
      }, { status: 401 })
    }

    // Check if user is admin using service role (bypasses RLS)
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
        error: 'Access denied'
      }, { status: 403 })
    }

    const { playerId, status, basePrice } = await request.json()

    if (!playerId) {
      return NextResponse.json({
        success: false,
        error: 'Player ID is required'
      }, { status: 400 })
    }

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Valid status is required (pending, approved, rejected)'
      }, { status: 400 })
    }

    // If approving and base price is provided, validate and set it
    if (status === 'approved' && basePrice) {
      // First, get the Base Price skill ID
      const { data: basePriceSkill, error: skillError } = await supabaseAdmin
        .from('player_skills')
        .select('id')
        .eq('skill_name', 'Base Price')
        .single()

      if (skillError || !basePriceSkill) {
        return NextResponse.json({
          success: false,
          error: 'Base Price skill not found'
        }, { status: 500 })
      }

      // Get the skill value ID for the selected base price
      const { data: skillValue, error: valueError } = await supabaseAdmin
        .from('player_skill_values')
        .select('id')
        .eq('skill_id', basePriceSkill.id)
        .eq('value_name', basePrice)
        .single()

      if (valueError || !skillValue) {
        return NextResponse.json({
          success: false,
          error: 'Invalid base price value'
        }, { status: 400 })
      }

      // Delete any existing Base Price assignments for this player
      await supabaseAdmin
        .from('player_skill_assignments')
        .delete()
        .eq('player_id', playerId)
        .eq('skill_id', basePriceSkill.id)

      // Create new Base Price assignment
      const { error: assignmentError } = await supabaseAdmin
        .from('player_skill_assignments')
        .insert({
          player_id: playerId,
          skill_id: basePriceSkill.id,
          skill_value_id: skillValue.id,
          value_array: [basePrice]
        })

      if (assignmentError) {
        return NextResponse.json({
          success: false,
          error: 'Failed to set base price: ' + assignmentError.message
        }, { status: 500 })
      }
    }

    // Update player profile status using service role (bypasses RLS)
    const { error } = await supabaseAdmin
      .from('players')
      .update({ status })
      .eq('id', playerId)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Player profile status updated successfully'
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
    
    // Check if user is admin
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

    const { playerId, userId, action } = await request.json()

    if (!playerId) {
      return NextResponse.json({
        success: false,
        error: 'Player ID is required'
      }, { status: 400 })
    }

    if (action === 'link') {
      if (!userId) {
        return NextResponse.json({
          success: false,
          error: 'User ID is required for linking'
        }, { status: 400 })
      }

      // Check if user already has a player profile
      const { data: existingPlayerForUser } = await supabaseAdmin
        .from('players')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (existingPlayerForUser && existingPlayerForUser.id !== playerId) {
        return NextResponse.json({
          success: false,
          error: 'User is already linked to another player profile'
        }, { status: 400 })
      }

      // Link user to player
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
        message: 'User linked to player successfully'
      })

    } else if (action === 'unlink') {
      // Unlink user from player
      const { error: unlinkError } = await supabaseAdmin
        .from('players')
        .update({ user_id: null })
        .eq('id', playerId)

      if (unlinkError) {
        return NextResponse.json({
          success: false,
          error: unlinkError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'User unlinked from player successfully'
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
export const PATCH = withAnalytics(withAuth(patchHandler, ['admin']))
