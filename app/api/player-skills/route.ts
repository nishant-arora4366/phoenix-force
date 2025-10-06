import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
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

    console.log('Raw skills from database:', skills)
    console.log('Number of skills found:', skills?.length || 0)

    // Format the response to match frontend expectations
    const formattedSkills = skills?.map(skill => ({
      id: skill.id,
      skill_name: skill.skill_name,
      skill_type: skill.skill_type,
      is_required: skill.is_required,
      display_order: skill.display_order,
      is_admin_managed: skill.is_admin_managed || false,
      viewer_can_see: skill.viewer_can_see !== undefined ? skill.viewer_can_see : true,
      values: skill.values
        ?.filter((value: any) => value.is_active)
        ?.sort((a: any, b: any) => a.display_order - b.display_order)
        ?.map((value: any) => ({
          id: value.id,
          value_name: value.value_name,
          display_order: value.display_order
        })) || []
    })) || []

    console.log('Formatted skills:', formattedSkills)

    return NextResponse.json({
      success: true,
      skills: formattedSkills
    })

  } catch (error: any) {
    console.error('Error in player skills API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
