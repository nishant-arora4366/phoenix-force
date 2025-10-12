import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics';
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    // User is already authenticated via withAuth middleware
    const userId = user.id

    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    // Check if user is admin (withAuth already checks role, but double-check status)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (userError || !userData || userData.role !== 'admin' || userData.status !== 'approved') {
      return NextResponse.json({ error: 'Unauthorized - Admin role required' }, { status: 403 })
    }

    // Fetch all player skills with their values
    const { data: skills, error: skillsError } = await supabase
      .from('player_skills')
      .select(`
        *,
        values:player_skill_values(
          id,
          value_name,
          display_order,
          is_active
        )
      `)
      .order('display_order', { ascending: true })

    if (skillsError) {
      return NextResponse.json({ error: 'Error fetching player skills' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      skills: skills || []
    })

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function postHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    const body = await request.json()
    const { skill } = body

    // User is already authenticated via withAuth middleware
    const userId = user.id

    if (!userId || !skill) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user is admin (withAuth already checks role, but double-check status)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (userError || !userData || userData.role !== 'admin' || userData.status !== 'approved') {
      return NextResponse.json({ error: 'Unauthorized - Admin role required' }, { status: 403 })
    }

    // Create new skill
    const { data: newSkill, error: skillError } = await supabase
      .from('player_skills')
      .insert({
        skill_name: skill.name,
        skill_type: skill.type,
        is_required: skill.required || false,
        display_order: skill.displayOrder || 0,
        is_admin_managed: skill.isAdminManaged || false,
        viewer_can_see: skill.viewerCanSee !== undefined ? skill.viewerCanSee : true
      })
      .select()
      .single()

    if (skillError) {
      return NextResponse.json({ error: 'Error creating player skill' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      skill: newSkill
    })

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function putHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    const body = await request.json()
    const { skillId, skill } = body

    // User is already authenticated via withAuth middleware
    const userId = user.id

    if (!userId || !skillId || !skill) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user is admin (withAuth already checks role, but double-check status)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (userError || !userData || userData.role !== 'admin' || userData.status !== 'approved') {
      return NextResponse.json({ error: 'Unauthorized - Admin role required' }, { status: 403 })
    }

    // Update skill
    const { data: updatedSkill, error: skillError } = await supabase
      .from('player_skills')
      .update({
        skill_name: skill.name,
        skill_type: skill.type,
        is_required: skill.required,
        display_order: skill.displayOrder,
        is_admin_managed: skill.isAdminManaged,
        viewer_can_see: skill.viewerCanSee
      })
      .eq('id', skillId)
      .select()
      .single()

    if (skillError) {
      return NextResponse.json({ error: 'Error updating player skill' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      skill: updatedSkill
    })

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function deleteHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    const body = await request.json()
    const { skillId } = body

    // User is already authenticated via withAuth middleware
    const userId = user.id

    if (!userId || !skillId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user is admin (withAuth already checks role, but double-check status)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (userError || !userData || userData.role !== 'admin' || userData.status !== 'approved') {
      return NextResponse.json({ error: 'Unauthorized - Admin role required' }, { status: 403 })
    }

    // Delete skill (this will cascade to values and assignments)
    const { error: deleteError } = await supabase
      .from('player_skills')
      .delete()
      .eq('id', skillId)

    if (deleteError) {
      return NextResponse.json({ error: 'Error deleting player skill' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Player skill deleted successfully'
    })

  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Export the handler with analytics
export const GET = withAnalytics(withAuth(getHandler, ['admin']))
// Export the handler with analytics
export const POST = withAnalytics(withAuth(postHandler, ['admin']))
// Export the handler with analytics
export const PUT = withAnalytics(withAuth(putHandler, ['admin']))
// Export the handler with analytics
export const DELETE = withAnalytics(withAuth(deleteHandler, ['admin']))
