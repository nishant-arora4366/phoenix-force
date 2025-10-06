import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Service role key not configured'
      }, { status: 500 })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    // Fetch players with their skill assignments from database using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('players')
      .select(`
        *,
        player_skill_assignments (
          id,
          skill_value_id,
          skill_value_ids,
          value_array,
          player_skills (
            id,
            skill_name,
            skill_type,
            is_required,
            display_order
          ),
          player_skill_values (
            id,
            value_name,
            display_order
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      }, { status: 500 })
    }

    // Transform the data to match the expected interface
    const transformedPlayers = data?.map(player => {
      // Extract skills from skill assignments
      const skills: { [key: string]: any } = {}
      
      if (player.player_skill_assignments) {
        for (const assignment of player.player_skill_assignments) {
          const skillName = assignment.player_skills?.skill_name
          if (skillName) {
            if (assignment.player_skills?.skill_type === 'multiselect') {
              // For multiselect, use the value_array
              skills[skillName] = assignment.value_array || []
            } else {
              // For single select, use the skill_value_id to get the value
              if (assignment.player_skill_values) {
                skills[skillName] = assignment.player_skill_values.value_name
              }
            }
          }
        }
      }

      // Map to the expected interface
      return {
        id: player.id,
        display_name: player.display_name,
        stage_name: player.stage_name,
        bio: player.bio,
        profile_pic_url: player.profile_pic_url,
        base_price: skills['Base Price'] || player.base_price || 0,
        group_name: player.group_name,
        is_bowler: skills['Role']?.includes('Bowler') || false,
        is_batter: skills['Role']?.includes('Batsman') || false,
        is_wicket_keeper: skills['Role']?.includes('Wicket Keeper') || false,
        bowling_rating: skills['Bowling Rating'] || null,
        batting_rating: skills['Batting Rating'] || null,
        wicket_keeping_rating: skills['Wicket Keeping Rating'] || null,
        created_at: player.created_at,
        // Include all skills for detailed view
        skills: skills
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: transformedPlayers,
      message: 'Players fetched successfully'
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch players',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
