import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const playerId = searchParams.get('playerId')
    
    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 })
    }

    console.log('=== DEBUG API - CHECKING PLAYER SKILLS ===')
    console.log('Player ID:', playerId)

    // Get the player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single()

    console.log('Player query result:', { player, playerError })

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 })
    }

    // Get all skill assignments for this player
    const { data: skillAssignments, error: skillError } = await supabase
      .from('player_skill_assignments')
      .select(`
        *,
        player_skills (
          id,
          skill_name,
          skill_type,
          is_required,
          display_order,
          is_admin_managed,
          viewer_can_see
        ),
        player_skill_values (
          id,
          value_name,
          display_order
        )
      `)
      .eq('player_id', playerId)

    console.log('Skill assignments query result:', { skillAssignments, skillError })

    // Get all skills to see what's available
    const { data: allSkills, error: allSkillsError } = await supabase
      .from('player_skills')
      .select('*')
      .order('display_order')

    console.log('All skills query result:', { allSkills, allSkillsError })

    return NextResponse.json({
      success: true,
      player,
      skillAssignments: skillAssignments || [],
      allSkills: allSkills || [],
      counts: {
        player: player ? 1 : 0,
        skillAssignments: skillAssignments?.length || 0,
        allSkills: allSkills?.length || 0
      }
    })

  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
