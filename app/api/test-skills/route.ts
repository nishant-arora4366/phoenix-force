import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Check if player_skills table exists and has data
    const { data: skills, error: skillsError } = await supabase
      .from('player_skills')
      .select('*')
      .limit(5)

    console.log('Skills query result:', { skills, skillsError })

    // Check if player_skill_values table exists and has data
    const { data: values, error: valuesError } = await supabase
      .from('player_skill_values')
      .select('*')
      .limit(5)

    console.log('Values query result:', { values, valuesError })

    return NextResponse.json({
      success: true,
      message: 'Database check completed',
      data: {
        skills: {
          count: skills?.length || 0,
          data: skills,
          error: skillsError
        },
        values: {
          count: values?.length || 0,
          data: values,
          error: valuesError
        }
      }
    })

  } catch (error: any) {
    console.error('Error in test skills API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
