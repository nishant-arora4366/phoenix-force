import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (userError || !user || user.role !== 'admin' || user.status !== 'approved') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
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
      console.error('Error fetching player skills:', skillsError)
      return NextResponse.json({ error: 'Error fetching player skills' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      skills: skills || []
    })

  } catch (error: any) {
    console.error('Error in admin player skills API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, skill } = body

    if (!userId || !skill) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (userError || !user || user.role !== 'admin' || user.status !== 'approved') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
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
      console.error('Error creating player skill:', skillError)
      return NextResponse.json({ error: 'Error creating player skill' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      skill: newSkill
    })

  } catch (error: any) {
    console.error('Error in admin player skills POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, skillId, skill } = body

    if (!userId || !skillId || !skill) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (userError || !user || user.role !== 'admin' || user.status !== 'approved') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
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
      console.error('Error updating player skill:', skillError)
      return NextResponse.json({ error: 'Error updating player skill' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      skill: updatedSkill
    })

  } catch (error: any) {
    console.error('Error in admin player skills PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, skillId } = body

    if (!userId || !skillId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user is admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role, status')
      .eq('id', userId)
      .single()

    if (userError || !user || user.role !== 'admin' || user.status !== 'approved') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete skill (this will cascade to values and assignments)
    const { error: deleteError } = await supabase
      .from('player_skills')
      .delete()
      .eq('id', skillId)

    if (deleteError) {
      console.error('Error deleting player skill:', deleteError)
      return NextResponse.json({ error: 'Error deleting player skill' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Player skill deleted successfully'
    })

  } catch (error: any) {
    console.error('Error in admin player skills DELETE API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
