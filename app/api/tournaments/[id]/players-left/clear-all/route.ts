import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params;

    // First, get count of entries to be deleted for response
    const { count, error: countError } = await supabaseAdmin
      .from('tournament_players_left')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId);

    if (countError) {
      console.error('Error counting players left entries:', countError);
      return NextResponse.json(
        { error: countError.message },
        { status: 500 }
      );
    }

    // Delete all player left entries for this tournament
    const { error: deleteError } = await supabaseAdmin
      .from('tournament_players_left')
      .delete()
      .eq('tournament_id', tournamentId);

    if (deleteError) {
      console.error('Database error:', deleteError);
      return NextResponse.json(
        { error: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `All ${count || 0} player left entries have been cleared`,
      cleared_count: count || 0
    });

  } catch (error: any) {
    console.error('Error clearing all players left entries:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
