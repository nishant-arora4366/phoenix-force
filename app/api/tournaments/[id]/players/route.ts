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
      console.error('Error loading tournament:', tournamentError);
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
      console.error('Error loading slots:', slotsError);
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
      console.error('Error loading players:', playersError);
      return NextResponse.json({ error: playersError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      players: players || [],
      totalSlots: tournament.total_slots,
      teamCount: tournament.selected_teams
    });
  } catch (error: any) {
    console.error('Error in players API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
