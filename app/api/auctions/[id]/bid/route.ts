import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/src/lib/auth-middleware';
import { supabase } from '@/src/lib/supabaseClient';

async function placeBid(request: NextRequest, user: any, auctionId: string) {
  try {
    const { playerId, captainId, amount } = await request.json();

      if (!playerId || !captainId || !amount) {
        return NextResponse.json(
          { error: 'Missing required fields: playerId, captainId, amount' },
          { status: 400 }
        );
      }

      // Check if user is host, admin, or the captain
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const isHostOrAdmin = profile && ['host', 'admin'].includes(profile.role);
      
      // If not host/admin, check if user is the captain
      let isCaptain = false;
      if (!isHostOrAdmin) {
        const { data: captain } = await supabase
          .from('players')
          .select('user_id')
          .eq('id', captainId)
          .single();
        
        isCaptain = captain?.user_id === user.id;
      }

      if (!isHostOrAdmin && !isCaptain) {
        return NextResponse.json(
          { error: 'Unauthorized - Only captains can bid for their team' },
          { status: 403 }
        );
      }

      // Get tournament_id from auction first
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

      // Verify captain is part of this auction and get team details
      const { data: team, error: teamError } = await supabase
        .from('auction_teams')
        .select('id, remaining_purse')
        .eq('auction_id', auctionId)
        .eq('captain_id', captainId)
        .single();

      if (teamError || !team) {
        return NextResponse.json(
          { error: 'Captain not found in this auction' },
          { status: 404 }
        );
      }

      // Check if captain has enough purse
      if (amount > team.remaining_purse) {
        return NextResponse.json(
          { error: 'Bid amount exceeds remaining purse' },
          { status: 400 }
        );
      }

      // Get current highest bid
      const { data: currentBids, error: bidError } = await supabase
        .from('auction_bids')
        .select('bid_amount')
        .eq('tournament_id', auction.tournament_id)
        .eq('player_id', playerId)
        .order('bid_amount', { ascending: false })
        .limit(1);

      if (bidError) {
        return NextResponse.json(
          { error: 'Failed to check current bids' },
          { status: 500 }
        );
      }

      const currentHighestBid = currentBids[0]?.bid_amount || 0;
      const basePrice = 1000; // Minimum bid increment

      if (amount <= currentHighestBid) {
        return NextResponse.json(
          { error: `Bid must be higher than current highest bid of ₹${currentHighestBid}` },
          { status: 400 }
        );
      }


      // Get bidder user_id
      const { data: captain, error: captainError } = await supabase
        .from('players')
        .select('user_id')
        .eq('id', captainId)
        .single();

      if (captainError || !captain) {
        return NextResponse.json(
          { error: 'Captain not found' },
          { status: 404 }
        );
      }

      // Place the bid
      const { data: bid, error: insertError } = await supabase
        .from('auction_bids')
        .insert({
          tournament_id: auction.tournament_id,
          player_id: playerId,
          team_id: team.id,
          bid_amount: amount,
          bidder_user_id: captain.user_id
        })
        .select()
        .single();

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to place bid' },
          { status: 500 }
        );
      }

      // Reset timer
      const { error: timerError } = await supabase
        .from('auctions')
        .update({ timer_seconds: 30 })
        .eq('id', auctionId);

      if (timerError) {
        console.error('Timer reset error:', timerError);
      }

      return NextResponse.json({
        success: true,
        bid: bid,
        message: 'Bid placed successfully'
      });

    } catch (error) {
      console.error('Error placing bid:', error);
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
  
  return withAuth((req, user) => placeBid(req, user, auctionId))(request);
}
