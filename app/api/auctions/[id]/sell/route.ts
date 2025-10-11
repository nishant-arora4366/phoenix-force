import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/src/lib/auth-middleware';
import { supabase } from '@/src/lib/supabaseClient';

async function sellPlayer(request: NextRequest, user: any, auctionId: string) {
  try {
    const { playerId } = await request.json();

      if (!playerId) {
        return NextResponse.json(
          { error: 'Missing required field: playerId' },
          { status: 400 }
        );
      }

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

      // Get auction details first
      const { data: auction, error: auctionError } = await supabase
        .from('auctions')
        .select('tournament_id')
        .eq('id', auctionId)
        .single();

      if (auctionError || !auction) {
        return NextResponse.json(
          { error: 'Auction not found' },
          { status: 404 }
        );
      }

      // Get current highest bid
      const { data: highestBid, error: bidError } = await supabase
        .from('auction_bids')
        .select('team_id, bid_amount')
        .eq('tournament_id', auction.tournament_id)
        .eq('player_id', playerId)
        .order('bid_amount', { ascending: false })
        .limit(1)
        .single();

      if (bidError || !highestBid) {
        return NextResponse.json(
          { error: 'No bids found for this player' },
          { status: 400 }
        );
      }

      // Update team formation - deduct from remaining purse and add to total spent
      const { error: teamError } = await supabase
        .from('auction_teams')
        .update({
          total_spent: supabase.raw(`total_spent + ${highestBid.bid_amount}`),
          remaining_purse: supabase.raw(`remaining_purse - ${highestBid.bid_amount}`)
        })
        .eq('id', highestBid.team_id);

      if (teamError) {
        return NextResponse.json(
          { error: 'Failed to update team formation' },
          { status: 500 }
        );
      }

      // Get captain_id from team
      const { data: teamData, error: teamDataError } = await supabase
        .from('auction_teams')
        .select('captain_id')
        .eq('id', highestBid.team_id)
        .single();

      if (teamDataError || !teamData) {
        return NextResponse.json(
          { error: 'Failed to get team captain' },
          { status: 500 }
        );
      }

      // Mark player as sold
      const { error: playerError } = await supabase
        .from('auction_players')
        .update({
          status: 'sold',
          sold_to: teamData.captain_id,
          sold_price: highestBid.bid_amount
        })
        .eq('auction_id', auctionId)
        .eq('player_id', playerId);

      if (playerError) {
        return NextResponse.json(
          { error: 'Failed to mark player as sold' },
          { status: 500 }
        );
      }

      // Mark the winning bid
      const { error: bidUpdateError } = await supabase
        .from('auction_bids')
        .update({ is_winning_bid: true })
        .eq('tournament_id', auction.tournament_id)
        .eq('player_id', playerId)
        .eq('team_id', highestBid.team_id)
        .eq('bid_amount', highestBid.bid_amount);

      if (bidUpdateError) {
        console.error('Failed to mark winning bid:', bidUpdateError);
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
        message: 'Player sold successfully',
        soldTo: teamData.captain_id,
        soldPrice: highestBid.bid_amount,
        nextPlayerId: nextPlayer?.player_id || null,
        auctionCompleted: !nextPlayer
      });

    } catch (error) {
      console.error('Error selling player:', error);
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
  
  return withAuth((req, user) => sellPlayer(req, user, auctionId))(request);
}
