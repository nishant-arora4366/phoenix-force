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

    // Format the response
    const formattedSkills = skills?.map(skill => ({
      id: skill.id,
      name: skill.skill_name,
      type: skill.skill_type,
      required: skill.is_required,
      displayOrder: skill.display_order,
      values: skill.values
        ?.filter(value => value.is_active)
        ?.sort((a, b) => a.display_order - b.display_order)
        ?.map(value => ({
          id: value.id,
          name: value.value_name,
          displayOrder: value.display_order
        })) || []
    })) || []

    return NextResponse.json({
      success: true,
      skills: formattedSkills
    })

  } catch (error: any) {
    console.error('Error in player skills API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
