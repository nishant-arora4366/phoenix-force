import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; playerLeftId: string }> }
) {
  try {
    const { id: tournamentId, playerLeftId } = await params;

    // Verify the player left entry exists and belongs to this tournament
    const { data: playerLeftEntry, error: fetchError } = await supabaseAdmin
      .from('tournament_players_left')
      .select('id, tournament_id, player_name')
      .eq('id', playerLeftId)
      .eq('tournament_id', tournamentId)
      .single();

    if (fetchError || !playerLeftEntry) {
      return NextResponse.json(
        { error: 'Player left entry not found' },
        { status: 404 }
      );
    }

    // Delete the player left entry
    const { error: deleteError } = await supabaseAdmin
      .from('tournament_players_left')
      .delete()
      .eq('id', playerLeftId);

    if (deleteError) {
      console.error('Database error:', deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Player left entry for ${playerLeftEntry.player_name} has been cleared`
    });

  } catch (error: any) {
    console.error('Error clearing player left entry:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
