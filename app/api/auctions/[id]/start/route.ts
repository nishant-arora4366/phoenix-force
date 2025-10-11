import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/src/lib/auth-middleware';
import { supabase } from '@/src/lib/supabaseClient';

async function startAuction(request: NextRequest, user: any, auctionId: string) {
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

      // Get auction details
      const { data: auction, error: auctionError } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', auctionId)
        .single();

      if (auctionError || !auction) {
        return NextResponse.json(
          { error: 'Auction not found' },
          { status: 404 }
        );
      }

      if (auction.status !== 'pending') {
        return NextResponse.json(
          { error: 'Auction is not in pending status' },
          { status: 400 }
        );
      }

      // Get first available player
      const { data: firstPlayer, error: playerError } = await supabase
        .from('auction_players')
        .select('player_id')
        .eq('auction_id', auctionId)
        .eq('status', 'available')
        .order('created_at')
        .limit(1)
        .single();

      if (playerError && playerError.code !== 'PGRST116') {
        return NextResponse.json(
          { error: 'Failed to get first player' },
          { status: 500 }
        );
      }

      // Start auction
      const { error: updateError } = await supabase
        .from('auctions')
        .update({
          status: 'active',
          current_player_id: firstPlayer?.player_id || null,
          current_bid: 0,
          timer_seconds: firstPlayer ? 30 : 0
        })
        .eq('id', auctionId);

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to start auction' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Auction started successfully',
        auction: {
          id: auctionId,
          status: 'active',
          current_player_id: firstPlayer?.player_id || null,
          timer_seconds: firstPlayer ? 30 : 0
        }
      });

    } catch (error) {
      console.error('Error starting auction:', error);
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
  
  return withAuth((req, user) => startAuction(req, user, auctionId))(request);
}
