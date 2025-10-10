import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedUser } from '@/src/lib/auth-middleware';
import { withAnalytics } from '@/src/lib/api-analytics'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function getHandler(
  request: NextRequest,
  user: AuthenticatedUser
) {
  try {
    // Get all skills with their values using the correct table structure
    const { data: skills, error } = await supabaseAdmin
      .from('player_skills')
      .select(`
        id,
        skill_name,
        skill_type,
        is_required,
        display_order,
        is_admin_managed,
        viewer_can_see,
        values:player_skill_values(
          id,
          value_name,
          display_order,
          is_active
        )
      `)
      .order('display_order')

    if (error) {
      console.error('Error fetching skills:', error)
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch skills'
      }, { status: 500 })
    }

    // Format the response
    const formattedSkills = skills?.map(skill => ({
      id: skill.id,
      name: skill.skill_name,
      type: skill.skill_type,
      is_required: skill.is_required,
      display_order: skill.display_order,
      is_admin_managed: skill.is_admin_managed,
      viewer_can_see: skill.viewer_can_see,
      values: skill.values
        ?.filter((value: any) => value.is_active)
        ?.sort((a: any, b: any) => a.display_order - b.display_order)
        .map((value: any) => ({
          id: value.id,
          name: value.value_name,
          value_name: value.value_name,
          display_order: value.display_order
        })) || []
    })) || []

    return NextResponse.json({
      success: true,
      skills: formattedSkills
    })

  } catch (error: any) {
    console.error('Error in player skills list API:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// Export the handlers with analytics
export const GET = withAnalytics(withAuth(getHandler, ['viewer', 'host', 'admin']))
