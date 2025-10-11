import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/src/lib/auth-middleware';
import { supabase } from '@/src/lib/supabaseClient';

async function nextPlayer(request: NextRequest, user: any, auctionId: string) {
  try {

      // Check if user is host or admin
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!profile || !['host', 'admin'].includes(profile.role)) {
        return NextResponse.json(
          { error: 'Unauthorized - Host or Admin access required' },
          { status: 403 }
        );
      }

      // Get current player
      const { data: auction, error: auctionError } = await supabase
        .from('auctions')
        .select('current_player_id')
        .eq('id', auctionId)
        .single();

      if (auctionError || !auction) {
        return NextResponse.json(
          { error: 'Auction not found' },
          { status: 404 }
        );
      }

      // If there's a current player, mark it as skipped
      if (auction.current_player_id) {
        const { error: skipError } = await supabase
          .from('auction_players')
          .update({ status: 'skipped' })
          .eq('auction_id', auctionId)
          .eq('player_id', auction.current_player_id);

        if (skipError) {
          return NextResponse.json(
            { error: 'Failed to skip current player' },
            { status: 500 }
          );
        }
      }

      // Get next available player
      const { data: nextPlayer, error: nextPlayerError } = await supabase
        .from('auction_players')
        .select('player_id')
        .eq('auction_id', auctionId)
        .eq('status', 'available')
        .order('created_at')
        .limit(1)
        .single();

      if (nextPlayerError && nextPlayerError.code !== 'PGRST116') {
        return NextResponse.json(
          { error: 'Failed to get next player' },
          { status: 500 }
        );
      }

      // Update auction with next player
      const { error: updateError } = await supabase
        .from('auctions')
        .update({
          current_player_id: nextPlayer?.player_id || null,
          current_bid: 0,
          timer_seconds: nextPlayer ? 30 : 0
        })
        .eq('id', auctionId);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update auction' },
          { status: 500 }
        );
      }

      // If no more players, complete auction
      if (!nextPlayer) {
        const { error: completeError } = await supabase
          .from('auctions')
          .update({ status: 'completed' })
          .eq('id', auctionId);

        if (completeError) {
          console.error('Failed to complete auction:', completeError);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Moved to next player',
        nextPlayerId: nextPlayer?.player_id || null,
        auctionCompleted: !nextPlayer
      });

    } catch (error) {
      console.error('Error moving to next player:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const auctionId = resolvedParams.id;
  
  return withAuth((req, user) => nextPlayer(req, user, auctionId))(request);
}
