"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabaseClient';

interface Player {
  id: string;
  display_name: string;
  profile_pic_url?: string;
  base_price: number;
  skills?: {
    Role?: string | string[];
    [key: string]: any;
  };
}

interface Captain {
  id: string;
  display_name: string;
  profile_pic_url?: string;
  teamName: string;
  purse: number;
  currentBid?: number;
  balance: number;
}

interface Bid {
  id: string;
  player_id: string;
  captain_id: string;
  amount: number;
  timestamp: string;
}

interface Auction {
  id: string;
  tournament_id: string;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
  current_player_id?: string;
  current_bid?: number;
  timer_seconds?: number;
  created_at: string;
}

interface TeamFormation {
  captain_id: string;
  captain_name: string;
  team_name: string;
  players: Player[];
  total_spent: number;
  remaining_purse: number;
}

export default function AuctionBiddingPage() {
  const params = useParams();
  const router = useRouter();
  const auctionId = params.id as string;
  
  const [auction, setAuction] = useState<Auction | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [captains, setCaptains] = useState<Captain[]>([]);
  const [teamFormations, setTeamFormations] = useState<TeamFormation[]>([]);
  const [remainingPlayers, setRemainingPlayers] = useState<Player[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [currentBid, setCurrentBid] = useState<number>(0);
  const [timer, setTimer] = useState<number>(0);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [nextBidAmount, setNextBidAmount] = useState<number>(1000);
  const [bidIncrement, setBidIncrement] = useState<number>(1000);
  const [auctionConfig, setAuctionConfig] = useState<{
    maxTokensPerCaptain: number;
    minimumBid: number;
    minimumIncrement: number;
  }>({
    maxTokensPerCaptain: 2000,
    minimumBid: 1000,
    minimumIncrement: 1000
  });
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const auctionSubscription = useRef<any>(null);

  // Load auction data
  useEffect(() => {
    if (auctionId) {
      loadAuctionData();
      setupRealtimeSubscription();
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (auctionSubscription.current) {
        supabase.removeChannel(auctionSubscription.current);
      }
    };
  }, [auctionId]);

  // Timer effect
  useEffect(() => {
    if (timer > 0 && !isTimerPaused && auction?.status === 'active') {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            // Timer expired - could trigger auto-skip or other logic
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timer, isTimerPaused, auction?.status]);


  const loadAuctionData = async () => {
    try {
      setLoading(true);
      
      // Load auction details
      const { data: auctionData, error: auctionError } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', auctionId)
        .single();


      if (auctionError) throw auctionError;
      setAuction(auctionData);

      // Load current player if auction is active
      if (auctionData.current_player_id) {
        const { data: playerData, error: playerError } = await supabase
          .from('players')
          .select('*')
          .eq('id', auctionData.current_player_id)
          .single();

        if (!playerError && playerData) {
          setCurrentPlayer({
            ...playerData,
            base_price: 10000, // Default base price since column doesn't exist
            skills: { Role: ['All Rounder'] } // Default skills since column doesn't exist
          });
        }
      }

      // Load captains and team formations
      await loadTeamFormations();
      
      // Load remaining players
      await loadRemainingPlayers();
      
      // Load recent bids
      await loadRecentBids();
      
      // Check user role
      await checkUserRole();
      
      setTimer(auctionData.timer_seconds || 0);
      
    } catch (err) {
      console.error('Error loading auction data:', err);
      setError('Failed to load auction data');
    } finally {
      setLoading(false);
    }
  };

  const loadTeamFormations = async () => {
    try {
      // First, get auction teams
      const { data: auctionTeams, error: teamsError } = await supabase
        .from('auction_teams')
        .select('captain_id, team_name, total_spent, remaining_purse')
        .eq('auction_id', auctionId);

      if (teamsError) throw teamsError;

      if (!auctionTeams || auctionTeams.length === 0) {
        console.log('No auction teams found for auction:', auctionId);
        setTeamFormations([]);
        setCaptains([]);
        return;
      }

      // Get captain IDs
      const captainIds = auctionTeams.map((at: any) => at.captain_id);

      // Then, get captain details
      const { data: captains, error: captainsError } = await supabase
        .from('players')
        .select('id, display_name, profile_pic_url')
        .in('id', captainIds);

      if (captainsError) throw captainsError;

      // Combine the data
      const formations: TeamFormation[] = auctionTeams.map((team: any) => {
        const captain = captains.find((c: any) => c.id === team.captain_id);
        return {
          captain_id: team.captain_id,
          captain_name: captain?.display_name || 'Unknown Captain',
          team_name: team.team_name,
          players: [], // Will be loaded separately
          total_spent: team.total_spent || 0,
          remaining_purse: team.remaining_purse || 0
        };
      });

      setTeamFormations(formations);
      setCaptains(formations.map((formation: any) => ({
        id: formation.captain_id,
        display_name: formation.captain_name,
        profile_pic_url: captains.find((c: any) => c.id === formation.captain_id)?.profile_pic_url,
        teamName: formation.team_name,
        purse: formation.remaining_purse + formation.total_spent,
        balance: formation.remaining_purse
      })));

      console.log('Loaded team formations:', formations.length);
    } catch (err) {
      console.error('Error loading team formations:', err);
    }
  };

  const loadRemainingPlayers = async () => {
    try {
      // First, get auction players
      console.log('Querying auction players for auction ID:', auctionId);
      
      const { data: auctionPlayers, error: auctionError } = await supabase
        .from('auction_players')
        .select('player_id, status')
        .eq('auction_id', auctionId)
        .in('status', ['available', 'pending']);

      console.log('Auction players query result:', { auctionPlayers, auctionError });

      if (auctionError) throw auctionError;

      if (!auctionPlayers || auctionPlayers.length === 0) {
        console.log('No auction players found for auction:', auctionId);
        
        // Let's also check if there are ANY players for this auction (regardless of status)
        const { data: allAuctionPlayers, error: allError } = await supabase
          .from('auction_players')
          .select('player_id, status')
          .eq('auction_id', auctionId);
        
        console.log('All auction players (any status):', { allAuctionPlayers, allError });
        
        setRemainingPlayers([]);
        return;
      }

      // Get player IDs
      const playerIds = auctionPlayers.map((ap: any) => ap.player_id);
      console.log('Player IDs to query:', playerIds.slice(0, 5)); // Show first 5 IDs

      // Then, get player details
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, display_name, profile_pic_url')
        .in('id', playerIds);

      console.log('Players query result:', { players, playersError, playerCount: players?.length });

      if (playersError) throw playersError;

      // Test: Let's try to query just one player ID to see if it exists
      if (playerIds.length > 0) {
        const testId = playerIds[0];
        console.log('Testing player ID:', { 
          id: testId, 
          type: typeof testId, 
          length: testId?.length,
          isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(testId)
        });
        
        // First, let's try to query the players table without any filters to see if it works
        const { data: allPlayers, error: allPlayersError } = await supabase
          .from('players')
          .select('id, display_name')
          .limit(3);
        
        console.log('Test query for all players (limit 3):', { allPlayers, allPlayersError });
        
        const { data: testPlayer, error: testError } = await supabase
          .from('players')
          .select('id, display_name')
          .eq('id', testId)
          .single();
        
        console.log('Test query for first player ID:', { testPlayer, testError, playerId: testId });
      }

      // Combine the data
      const combinedPlayers: Player[] = players.map((player: any) => ({
        ...player,
        base_price: 10000, // Default base price since column doesn't exist
        skills: { Role: ['All Rounder'] } // Default skills since column doesn't exist
      }));

      console.log('Loaded remaining players:', combinedPlayers.length);
      setRemainingPlayers(combinedPlayers);
    } catch (err) {
      console.error('Error loading remaining players:', err);
    }
  };

  const loadRecentBids = async () => {
    try {
      if (!auction) return;
      
      // Get recent bids
      const { data: bids, error: bidsError } = await supabase
        .from('auction_bids')
        .select('id, player_id, team_id, bid_amount, created_at')
        .eq('tournament_id', auction.tournament_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (bidsError) throw bidsError;

      if (!bids || bids.length === 0) {
        setBids([]);
        return;
      }

      // Get team IDs
      const teamIds = bids.map((bid: any) => bid.team_id).filter(Boolean);

      if (teamIds.length === 0) {
        setBids([]);
        return;
      }

      // Get team details
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, captain_id')
        .in('id', teamIds);

      if (teamsError) throw teamsError;

      // Get captain IDs
      const captainIds = teams.map((team: any) => team.captain_id);

      // Get captain details
      const { data: captains, error: captainsError } = await supabase
        .from('players')
        .select('id, display_name')
        .in('id', captainIds);

      if (captainsError) throw captainsError;

      // Transform data to match expected format
      const transformedBids = bids.map((bid: any) => {
        const team = teams.find((t: any) => t.id === bid.team_id);
        const captain = captains.find((c: any) => c.id === team?.captain_id);
        
        return {
          id: bid.id,
          player_id: bid.player_id,
          captain_id: team?.captain_id,
          amount: bid.bid_amount,
          timestamp: bid.created_at,
          captains: { display_name: captain?.display_name || 'Unknown' }
        };
      });
      
      setBids(transformedBids);
    } catch (err) {
      console.error('Error loading recent bids:', err);
    }
  };

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      setUserRole(profile?.role || '');
      setIsHost(profile?.role === 'host' || profile?.role === 'admin');
    } catch (err) {
      console.error('Error checking user role:', err);
    }
  };

  const setupRealtimeSubscription = () => {
    auctionSubscription.current = supabase
      .channel(`auction-${auctionId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'auctions', filter: `id=eq.${auctionId}` },
        (payload: any) => {
          console.log('Auction update:', payload);
          setAuction(payload.new as Auction);
          if (payload.new.current_player_id !== payload.old?.current_player_id) {
            loadCurrentPlayer(payload.new.current_player_id);
          }
          if (payload.new.timer_seconds !== payload.old?.timer_seconds) {
            setTimer(payload.new.timer_seconds || 0);
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'auction_bids' },
        (payload: any) => {
          console.log('Bid update:', payload);
          loadRecentBids();
          setCurrentBid(payload.new?.bid_amount || 0);
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'auction_teams', filter: `auction_id=eq.${auctionId}` },
        (payload: any) => {
          console.log('Team formation update:', payload);
          loadTeamFormations();
        }
      )
      .subscribe();
  };

  const loadCurrentPlayer = async (playerId: string) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (!error && data) {
        setCurrentPlayer({
          ...data,
          base_price: 10000, // Default base price since column doesn't exist
          skills: { Role: ['All Rounder'] } // Default skills since column doesn't exist
        });
      }
    } catch (err) {
      console.error('Error loading current player:', err);
    }
  };

  const handleBid = async (captainId: string, amount: number) => {
    try {
      const response = await fetch(`/api/auctions/${auctionId}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: currentPlayer?.id,
          captainId: captainId,
          amount: amount
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place bid');
      }

      // Reset timer
      const { error: timerError } = await supabase
        .from('auctions')
        .update({ timer_seconds: 30 })
        .eq('id', auctionId);

      if (timerError) console.error('Timer reset error:', timerError);
    } catch (err) {
      console.error('Error placing bid:', err);
      setError('Failed to place bid: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleSold = async () => {
    if (!currentPlayer || !currentBid) return;

    try {
      const response = await fetch(`/api/auctions/${auctionId}/sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          playerId: currentPlayer.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sell player');
      }

      const result = await response.json();
      
      // Update current bid to 0
      setCurrentBid(0);
      
      // If auction is completed, show completion message
      if (result.auctionCompleted) {
        setError('Auction completed successfully!');
      }
    } catch (err) {
      console.error('Error selling player:', err);
      setError('Failed to sell player: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleNextPlayer = async () => {
    try {
      const response = await fetch(`/api/auctions/${auctionId}/next-player`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to move to next player');
      }

      const result = await response.json();
      
      setCurrentBid(0);
      setTimer(result.nextPlayerId ? 30 : 0);

      // If auction is completed, show completion message
      if (result.auctionCompleted) {
        setError('Auction completed successfully!');
      }
    } catch (err) {
      console.error('Error moving to next player:', err);
      setError('Failed to move to next player: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const completeAuction = async () => {
    try {
      const { error } = await supabase
        .from('auctions')
        .update({ 
          status: 'completed',
          current_player_id: null,
          timer_seconds: 0
        })
        .eq('id', auctionId);

      if (error) throw error;
    } catch (err) {
      console.error('Error completing auction:', err);
      setError('Failed to complete auction');
    }
  };

  const getRoleEmoji = (role: string | string[] | undefined): string[] => {
    if (!role) return ['❓'];
    const roles = Array.isArray(role) ? role : [role];
    return roles.map(r => {
      switch (r.toLowerCase()) {
        case 'batter': return '🏏';
        case 'bowler': return '⚾';
        case 'wicket keeper': return '🧤';
        case 'all rounder': return '🎯';
        default: return '❓';
      }
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate max bid possible for a captain
  const getMaxBidPossible = (captain: Captain): number => {
    const playersNeeded = Math.ceil(remainingPlayers.length / captains.length);
    const reserveAmount = playersNeeded * auctionConfig.minimumBid;
    return Math.max(0, captain.balance - reserveAmount);
  };

  // Calculate balance after current bid
  const getBalanceAfterBid = (captain: Captain, bidAmount: number): number => {
    return captain.balance - bidAmount;
  };

  // Check if captain can bid
  const canCaptainBid = (captain: Captain, bidAmount: number): boolean => {
    return captain.balance >= bidAmount && bidAmount <= getMaxBidPossible(captain);
  };

  // Get next bid amount
  const getNextBidAmount = (): number => {
    return Math.max(currentBid + bidIncrement, auctionConfig.minimumBid);
  };

  // Start auction
  const startAuction = async () => {
    try {
      const response = await fetch(`/api/auctions/${auctionId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start auction');
      }

      const result = await response.json();
      setTimer(result.timerSeconds || 30);
    } catch (err) {
      console.error('Error starting auction:', err);
      setError('Failed to start auction: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Pause/Resume timer
  const toggleTimer = () => {
    setIsTimerPaused(!isTimerPaused);
  };

  // Undo last bid
  const undoLastBid = async () => {
    try {
      const response = await fetch(`/api/auctions/${auctionId}/undo-bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to undo bid');
      }

      // Reload data
      loadRecentBids();
      loadTeamFormations();
    } catch (err) {
      console.error('Error undoing bid:', err);
      setError('Failed to undo bid: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Previous player
  const previousPlayer = async () => {
    try {
      const response = await fetch(`/api/auctions/${auctionId}/previous-player`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to go to previous player');
      }

      const result = await response.json();
      if (result.currentPlayerId) {
        loadCurrentPlayer(result.currentPlayerId);
      }
      setCurrentBid(0);
      setTimer(result.timerSeconds || 30);
    } catch (err) {
      console.error('Error going to previous player:', err);
      setError('Failed to go to previous player: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Reset auction
  const resetAuction = async () => {
    if (!confirm('Are you sure you want to reset the auction? This will undo all bids and team assignments.')) {
      return;
    }

    try {
      const response = await fetch(`/api/auctions/${auctionId}/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset auction');
      }

      // Reload all data
      loadAuctionData();
    } catch (err) {
      console.error('Error resetting auction:', err);
      setError('Failed to reset auction: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  // Cancel auction
  const cancelAuction = async () => {
    if (!confirm('Are you sure you want to cancel the auction? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/auctions/${auctionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel auction');
      }

      router.push('/auctions');
    } catch (err) {
      console.error('Error cancelling auction:', err);
      setError('Failed to cancel auction: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#1A1F2E] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
          <p className="text-[#DBD0C0] text-lg">Loading auction...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#1A1F2E] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-[#CEA17A] text-[#0A0E1A] rounded-lg hover:bg-[#B8915F] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#1A1F2E] to-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#DBD0C0] text-lg mb-4">Auction not found</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-[#CEA17A] text-[#0A0E1A] rounded-lg hover:bg-[#B8915F] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#1A1F2E] to-[#0A0E1A] p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="flex items-center text-[#CEA17A] hover:text-[#DBD0C0] transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Auctions
            </button>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold text-[#DBD0C0] mb-2">
                Live Auction
              </h1>
              <div className="flex items-center justify-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  auction.status === 'active' 
                    ? 'bg-green-500/20 text-green-400' 
                    : auction.status === 'paused'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {auction.status.toUpperCase()}
                </span>
                {timer > 0 && (
                  <span className="text-2xl font-mono text-[#CEA17A]">
                    {formatTime(timer)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="w-20"></div> {/* Spacer */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Player Profile */}
          <div className="lg:col-span-2">
            <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-6 mb-6">
              <h2 className="text-xl font-bold text-[#DBD0C0] mb-4">Current Player</h2>
              
              {currentPlayer ? (
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    {currentPlayer.profile_pic_url ? (
                      <img
                        src={currentPlayer.profile_pic_url}
                        alt={currentPlayer.display_name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-[#CEA17A]/30"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-[#CEA17A]/20 flex items-center justify-center border-2 border-[#CEA17A]/30">
                        <span className="text-2xl font-bold text-[#CEA17A]">
                          {currentPlayer.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 flex">
                      {getRoleEmoji(currentPlayer.skills?.Role).map((emoji, index) => (
                        <span key={index} className="text-lg bg-[#09171F] rounded-full p-1">
                          {emoji}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-[#DBD0C0] mb-2">
                      {currentPlayer.display_name}
                    </h3>
                    <div className="flex items-center space-x-4 text-[#CEA17A]">
                      <span className="text-lg font-semibold">
                        Base Price: ₹{currentPlayer.base_price}
                      </span>
                      {currentBid > 0 && (
                        <span className="text-xl font-bold text-green-400">
                          Current Bid: ₹{currentBid}
                        </span>
                      )}
                    </div>
                    {currentPlayer.skills?.Role && (
                      <div className="mt-2">
                        <span className="text-sm text-[#CEA17A]">
                          Role: {Array.isArray(currentPlayer.skills.Role) 
                            ? currentPlayer.skills.Role.join(', ') 
                            : currentPlayer.skills.Role}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#CEA17A] text-lg">No current player</p>
                  <p className="text-[#DBD0C0] text-sm mt-2">
                    {remainingPlayers.length > 0 
                      ? `${remainingPlayers.length} players remaining`
                      : 'All players sold'}
                  </p>
                </div>
              )}
            </div>

            {/* Auction Status and Start Button */}
            {auction.status === 'pending' && isHost && (
              <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-6 mb-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-[#DBD0C0] mb-4">Auction Ready to Start</h3>
                  <p className="text-[#CEA17A] mb-6">
                    {remainingPlayers.length} players available for auction
                  </p>
                  <button
                    onClick={startAuction}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
                  >
                    Start Auction
                  </button>
                </div>
              </div>
            )}

            {/* Bidding Controls */}
            {currentPlayer && auction.status === 'active' && (
              <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-[#DBD0C0]">Bidding Controls</h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-[#CEA17A]">
                      Next Bid: ₹{getNextBidAmount()}
                    </span>
                    <span className="text-sm text-[#CEA17A]">
                      Increment: ₹{bidIncrement}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {captains.map((captain: any) => {
                    const nextBid = getNextBidAmount();
                    const maxBid = getMaxBidPossible(captain);
                    const canBid = canCaptainBid(captain, nextBid);
                    const balanceAfter = getBalanceAfterBid(captain, nextBid);
                    
                    return (
                      <div key={captain.id} className="bg-[#0A0E1A]/50 rounded-lg p-4 border border-[#CEA17A]/10">
                        <div className="flex items-center space-x-3 mb-3">
                          {captain.profile_pic_url ? (
                            <img
                              src={captain.profile_pic_url}
                              alt={captain.display_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#CEA17A]/20 flex items-center justify-center">
                              <span className="text-sm font-bold text-[#CEA17A]">
                                {captain.display_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-[#DBD0C0] text-sm">
                              {captain.teamName}
                            </p>
                            <p className="text-xs text-[#CEA17A]">
                              Balance: ₹{captain.balance}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <button
                            onClick={() => handleBid(captain.id, nextBid)}
                            disabled={!canBid}
                            className="w-full px-3 py-2 bg-[#CEA17A] text-[#0A0E1A] rounded-lg hover:bg-[#B8915F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                          >
                            Bid ₹{nextBid}
                          </button>
                          <button
                            onClick={() => handleBid(captain.id, nextBid + bidIncrement)}
                            disabled={!canCaptainBid(captain, nextBid + bidIncrement)}
                            className="w-full px-3 py-2 bg-[#CEA17A]/80 text-[#0A0E1A] rounded-lg hover:bg-[#B8915F]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                          >
                            Bid ₹{nextBid + bidIncrement}
                          </button>
                        </div>
                        
                        <div className="mt-2 text-xs text-[#CEA17A] space-y-1">
                          <p>Max Bid: ₹{maxBid}</p>
                          <p>After Bid: ₹{balanceAfter}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Host Controls */}
                {isHost && (
                  <div className="mt-6 pt-6 border-t border-[#CEA17A]/20">
                    <h4 className="text-md font-bold text-[#DBD0C0] mb-4">Host Controls</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <button
                        onClick={handleSold}
                        disabled={currentBid === 0}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        SOLD
                      </button>
                      <button
                        onClick={handleNextPlayer}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Next Player
                      </button>
                      <button
                        onClick={previousPlayer}
                        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                      >
                        Previous
                      </button>
                      <button
                        onClick={undoLastBid}
                        className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                      >
                        Undo Bid
                      </button>
                      <button
                        onClick={toggleTimer}
                        className={`px-3 py-2 rounded-lg transition-colors text-sm ${
                          isTimerPaused 
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        {isTimerPaused ? 'Resume' : 'Pause'}
                      </button>
                      <button
                        onClick={resetAuction}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Reset
                      </button>
                      <button
                        onClick={completeAuction}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                      >
                        Complete
                      </button>
                      <button
                        onClick={cancelAuction}
                        className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bidding Metrics Table */}
            {auction.status === 'active' && (
              <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-6">
                <h3 className="text-lg font-bold text-[#DBD0C0] mb-4">Bidding Metrics</h3>
                
                <div className="space-y-3">
                  {captains.map((captain: any) => {
                    const maxBid = getMaxBidPossible(captain);
                    const nextBid = getNextBidAmount();
                    const balanceAfter = getBalanceAfterBid(captain, nextBid);
                    
                    return (
                      <div key={captain.id} className="bg-[#0A0E1A]/50 rounded-lg p-3 border border-[#CEA17A]/10">
                        <div className="flex items-center space-x-2 mb-2">
                          {captain.profile_pic_url ? (
                            <img
                              src={captain.profile_pic_url}
                              alt={captain.display_name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#CEA17A]/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-[#CEA17A]">
                                {captain.display_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="font-semibold text-[#DBD0C0] text-sm">
                            {captain.teamName}
                          </span>
                        </div>
                        <div className="text-xs text-[#CEA17A] space-y-1">
                          <p>Current Purse: ₹{captain.balance}</p>
                          <p>Max Bid Possible: ₹{maxBid}</p>
                          <p>Balance After Bid: ₹{balanceAfter}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Team Formations */}
            <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-6">
              <h3 className="text-lg font-bold text-[#DBD0C0] mb-4">Team Formations</h3>
              
              <div className="space-y-4">
                {teamFormations.map((team: any) => (
                  <div key={team.captain_id} className="bg-[#0A0E1A]/50 rounded-lg p-4 border border-[#CEA17A]/10">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-[#DBD0C0] text-sm">
                        {team.team_name}
                      </h4>
                      <span className="text-xs text-[#CEA17A]">
                        {team.players.length} players
                      </span>
                    </div>
                    <div className="text-xs text-[#CEA17A] space-y-1">
                      <p>Spent: ₹{team.total_spent}</p>
                      <p>Remaining: ₹{team.remaining_purse}</p>
                    </div>
                    {team.players.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-[#CEA17A] mb-1">Players:</p>
                        <div className="flex flex-wrap gap-1">
                          {team.players.slice(0, 3).map((player: any, index: number) => (
                            <span key={index} className="text-xs bg-[#CEA17A]/20 text-[#CEA17A] px-2 py-1 rounded">
                              {player.display_name}
                            </span>
                          ))}
                          {team.players.length > 3 && (
                            <span className="text-xs text-[#CEA17A] px-2 py-1">
                              +{team.players.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Bids */}
            <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-6">
              <h3 className="text-lg font-bold text-[#DBD0C0] mb-4">Recent Bids</h3>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {bids.slice(0, 5).map((bid: any) => (
                  <div key={bid.id} className="bg-[#0A0E1A]/50 rounded-lg p-3 border border-[#CEA17A]/10">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#DBD0C0]">
                        {bid.captains?.display_name || 'Unknown'}
                      </span>
                      <span className="text-sm font-semibold text-[#CEA17A]">
                        ₹{bid.amount}
                      </span>
                    </div>
                    <p className="text-xs text-[#CEA17A] mt-1">
                      {new Date(bid.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
                {bids.length === 0 && (
                  <p className="text-[#CEA17A] text-sm text-center py-4">
                    No bids yet
                  </p>
                )}
              </div>
            </div>

            {/* Remaining Players */}
            <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-6">
              <h3 className="text-lg font-bold text-[#DBD0C0] mb-4">Remaining Players</h3>
              
              <div className="text-center">
                <p className="text-2xl font-bold text-[#CEA17A] mb-2">
                  {remainingPlayers.length}
                </p>
                <p className="text-sm text-[#DBD0C0]">
                  players left
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
