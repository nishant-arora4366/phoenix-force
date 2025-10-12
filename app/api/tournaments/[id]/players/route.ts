import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;

    // First, get tournament details to know total_slots
    const { data: tournament, error: tournamentError } = await supabaseAdmin
      .from('tournaments')
      .select('total_slots, selected_teams')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) {
      return NextResponse.json({ error: tournamentError.message }, { status: 500 });
    }

    // Get player IDs from tournament_slots, ordered by registration time (created_at)
    // Only get up to total_slots count (excludes waitlist)
    const { data: slots, error: slotsError } = await supabaseAdmin
      .from('tournament_slots')
      .select('player_id, created_at')
      .eq('tournament_id', tournamentId)
      .not('player_id', 'is', null)
      .order('created_at', { ascending: true }) // Earliest registrations first
      .limit(tournament.total_slots || 100); // Limit to tournament slots only

    if (slotsError) {
      return NextResponse.json({ error: slotsError.message }, { status: 500 });
    }

    if (!slots || slots.length === 0) {
      return NextResponse.json({ 
        players: [], 
        totalSlots: tournament.total_slots,
        teamCount: tournament.selected_teams 
      });
    }

    const playerIds = slots.map(s => s.player_id);

    // Fetch player details
    const { data: players, error: playersError } = await supabaseAdmin
      .from('players')
      .select('id, display_name, profile_pic_url')
      .in('id', playerIds);

    if (playersError) {
      return NextResponse.json({ error: playersError.message }, { status: 500 });
    }

    // Fetch player skills using the correct foreign key relationships
    let playerSkillsMap: { [playerId: string]: { [skillName: string]: string | string[] } } = {}
    
    if (playerIds.length > 0) {
      const { data: skillAssignments, error: skillsError } = await supabaseAdmin
        .from('player_skill_assignments')
        .select(`
          player_id,
          skill_value_id,
          skill_value_ids,
          value_array,
          player_skills (
            skill_name,
            skill_type,
            viewer_can_see
          ),
          player_skill_values (
            value_name
          )
        `)
        .in('player_id', playerIds)
      
      if (!skillsError && skillAssignments) {
        // Group skills by player_id
        skillAssignments.forEach((assignment: any) => {
          const playerId = assignment.player_id
          const skillName = assignment.player_skills?.skill_name
          const viewerCanSee = assignment.player_skills?.viewer_can_see
          const valueName = assignment.player_skill_values?.value_name
          
          // Only include skills that viewers can see
          if (skillName && viewerCanSee) {
            if (!playerSkillsMap[playerId]) {
              playerSkillsMap[playerId] = {}
            }
            
            if (assignment.player_skills?.skill_type === 'multiselect') {
              playerSkillsMap[playerId][skillName] = assignment.value_array || []
            } else if (assignment.player_skill_values) {
              playerSkillsMap[playerId][skillName] = assignment.player_skill_values.value_name
            }
          }
        })
      }
    }

    // Attach skills to player data
    const playersWithSkills = (players || []).map(player => ({
      ...player,
      skills: playerSkillsMap[player.id] || {}
    }))


    return NextResponse.json({ 
      players: playersWithSkills,
      totalSlots: tournament.total_slots,
      teamCount: tournament.selected_teams
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
