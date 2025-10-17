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

    // Get all players who left this tournament, ordered by most recent departure
    const { data: playersLeft, error: playersLeftError } = await supabaseAdmin
      .from('tournament_players_left')
      .select(`
        id,
        player_id,
        player_name,
        player_photo_url,
        left_at,
        left_reason,
        left_by,
        slot_created_at
      `)
      .eq('tournament_id', tournamentId)
      .order('left_at', { ascending: false }); // Most recent first

    if (playersLeftError) {
      console.error('Database error:', playersLeftError);
      return NextResponse.json({ error: playersLeftError.message }, { status: 500 });
    }

    // Get user details for those who removed players (if any)
    const removedByUserIds = playersLeft
      ?.filter(p => p.left_reason === 'removed' && p.left_by)
      .map(p => p.left_by) || [];

    let userDetails: { [key: string]: any } = {};
    if (removedByUserIds.length > 0) {
      const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, firstname, lastname, username')
        .in('id', removedByUserIds);

      if (!usersError && users) {
        userDetails = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as { [key: string]: any });
      }
    }

    // Process the data to show latest departure per player
    // If a player left multiple times, we'll show their most recent departure
    const playerMap = new Map();
    
    playersLeft?.forEach(player => {
      const playerId = player.player_id;
      
      // If we haven't seen this player before, or this is a more recent departure
      if (!playerMap.has(playerId) || 
          new Date(player.left_at) > new Date(playerMap.get(playerId).left_at)) {
        
        // Get the name of who removed them (if applicable)
        let removedBy = null;
        if (player.left_reason === 'removed' && player.left_by && userDetails[player.left_by]) {
          const user = userDetails[player.left_by];
          removedBy = user.username || `${user.firstname} ${user.lastname}`.trim() || 'Unknown';
        }
        
        playerMap.set(playerId, {
          id: player.id,
          player_id: player.player_id,
          player_name: player.player_name,
          player_photo_url: player.player_photo_url,
          left_at: player.left_at,
          left_reason: player.left_reason,
          removed_by: removedBy,
          slot_created_at: player.slot_created_at,
          // Add a count of how many times they left (for future use)
          departure_count: playersLeft.filter(p => p.player_id === playerId).length
        });
      }
    });

    // Convert map to array and sort by most recent departure
    const latestDepartures = Array.from(playerMap.values())
      .sort((a, b) => new Date(b.left_at).getTime() - new Date(a.left_at).getTime());

    return NextResponse.json({ 
      players_left: latestDepartures,
      total_count: latestDepartures.length
    });

  } catch (error: any) {
    console.error('Error fetching players who left:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
