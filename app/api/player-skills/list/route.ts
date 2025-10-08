import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Get all skills with their values
    const { data: skills, error } = await supabaseAdmin
      .from('player_skills')
      .select(`
        id,
        name,
        type,
        player_skill_values(
          id,
          value_name,
          display_order
        )
      `)
      .eq('is_active', true)
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
      name: skill.name,
      type: skill.type,
      values: skill.player_skill_values
        ?.sort((a: any, b: any) => a.display_order - b.display_order)
        .map((value: any) => ({
          id: value.id,
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
