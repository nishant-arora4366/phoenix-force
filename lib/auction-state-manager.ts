// Centralized auction state management using Zustand
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { getSupabaseClient } from '@/src/lib/supabaseClient'

interface AuctionState {
  // Core auction data
  auction: any | null
  auctionTeams: any[]
  auctionPlayers: any[]
  players: any[]
  currentPlayer: any | null
  recentBids: any[]
  
  // Loading states
  isLoading: boolean
  bidLoading: Record<string, boolean>
  
  // Actions
  setAuction: (auction: any) => void
  setCurrentPlayer: (player: any) => void
  addBid: (bid: any) => void
  updateTeam: (teamId: string, update: Partial<any>) => void
  updateAuctionPlayer: (playerId: string, update: Partial<any>) => void
  
  // Optimistic updates
  optimisticBidUpdate: (teamId: string, amount: number) => void
  rollbackBid: (bidId: string) => void
  
  // Batch updates for performance
  batchUpdate: (updates: Partial<AuctionState>) => void
}

export const useAuctionStore = create<AuctionState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    auction: null,
    auctionTeams: [],
    auctionPlayers: [],
    players: [],
    currentPlayer: null,
    recentBids: [],
    isLoading: false,
    bidLoading: {},
    
    // Actions
    setAuction: (auction) => set({ auction }),
    
    setCurrentPlayer: (player) => set({ currentPlayer: player }),
    
    addBid: (bid) => set((state) => ({
      recentBids: [bid, ...state.recentBids.slice(0, 49)] // Keep last 50 bids
    })),
    
    updateTeam: (teamId, update) => set((state) => ({
      auctionTeams: state.auctionTeams.map(team => 
        team.id === teamId ? { ...team, ...update } : team
      )
    })),
    
    updateAuctionPlayer: (playerId, update) => set((state) => ({
      auctionPlayers: state.auctionPlayers.map(player =>
        player.player_id === playerId ? { ...player, ...update } : player
      )
    })),
    
    // Optimistic bid update for instant UI feedback
    optimisticBidUpdate: (teamId, amount) => {
      const tempBidId = `temp_${Date.now()}`
      const team = get().auctionTeams.find(t => t.id === teamId)
      
      // Immediately update UI
      set((state) => ({
        recentBids: [
          {
            id: tempBidId,
            team_id: teamId,
            team_name: team?.team_name || 'Unknown',
            bid_amount: amount,
            timestamp: new Date().toISOString(),
            player_id: state.currentPlayer?.player_id,
            is_winning_bid: true,
            is_undone: false,
            is_optimistic: true
          },
          ...state.recentBids.map(b => 
            b.player_id === state.currentPlayer?.player_id 
              ? { ...b, is_winning_bid: false } 
              : b
          )
        ]
      }))
      
      return tempBidId
    },
    
    rollbackBid: (bidId) => set((state) => ({
      recentBids: state.recentBids.filter(b => b.id !== bidId)
    })),
    
    // Batch update for reducing re-renders
    batchUpdate: (updates) => set(updates)
  }))
)

// Singleton WebSocket manager for consolidated real-time updates
class AuctionWebSocketManager {
  private static instance: AuctionWebSocketManager
  private channel: any = null
  private auctionId: string | null = null
  private updateBuffer: any[] = []
  private flushTimer: NodeJS.Timeout | null = null
  
  static getInstance(): AuctionWebSocketManager {
    if (!AuctionWebSocketManager.instance) {
      AuctionWebSocketManager.instance = new AuctionWebSocketManager()
    }
    return AuctionWebSocketManager.instance
  }
  
  async connect(auctionId: string) {
    if (this.auctionId === auctionId && this.channel) return
    
    this.disconnect()
    this.auctionId = auctionId
    
    const supabase = getSupabaseClient()
    
    // Single multiplexed channel for all auction updates
    this.channel = supabase
      .channel(`auction-all-${auctionId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'auction_bids', filter: `auction_id=eq.${auctionId}` },
        (payload: any) => this.bufferUpdate('bid', payload)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'auctions', filter: `id=eq.${auctionId}` },
        (payload: any) => this.bufferUpdate('auction', payload)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'auction_players', filter: `auction_id=eq.${auctionId}` },
        (payload: any) => this.bufferUpdate('player', payload)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'auction_teams', filter: `auction_id=eq.${auctionId}` },
        (payload: any) => this.bufferUpdate('team', payload)
      )
      .subscribe()
  }
  
  private bufferUpdate(type: string, payload: any) {
    this.updateBuffer.push({ type, payload, timestamp: Date.now() })
    
    // Debounce updates - flush every 100ms
    if (this.flushTimer) clearTimeout(this.flushTimer)
    
    this.flushTimer = setTimeout(() => {
      this.flushUpdates()
    }, 100)
  }
  
  private flushUpdates() {
    if (this.updateBuffer.length === 0) return
    
    const updates = this.updateBuffer
    this.updateBuffer = []
    
    const store = useAuctionStore.getState()
    const batchUpdates: Partial<AuctionState> = {}
    
    // Process all buffered updates
    for (const { type, payload } of updates) {
      switch (type) {
        case 'bid':
          if (payload.eventType === 'INSERT') {
            batchUpdates.recentBids = [
              payload.new,
              ...(batchUpdates.recentBids || store.recentBids)
            ]
          }
          break
          
        case 'auction':
          if (payload.eventType === 'UPDATE') {
            batchUpdates.auction = { ...store.auction, ...payload.new }
          }
          break
          
        case 'player':
          if (payload.eventType === 'UPDATE') {
            const players = batchUpdates.auctionPlayers || store.auctionPlayers
            batchUpdates.auctionPlayers = players.map(p =>
              p.id === payload.new.id ? { ...p, ...payload.new } : p
            )
            
            // Update current player if needed
            if (payload.new.current_player && payload.new.status === 'available') {
              const playerData = store.players.find(p => p.id === payload.new.player_id)
              if (playerData) {
                batchUpdates.currentPlayer = {
                  ...playerData,
                  ...payload.new
                }
              }
            }
          }
          break
          
        case 'team':
          if (payload.eventType === 'UPDATE') {
            const teams = batchUpdates.auctionTeams || store.auctionTeams
            batchUpdates.auctionTeams = teams.map(t =>
              t.id === payload.new.id ? { ...t, ...payload.new } : t
            )
          }
          break
      }
    }
    
    // Apply all updates in a single batch
    if (Object.keys(batchUpdates).length > 0) {
      store.batchUpdate(batchUpdates)
    }
  }
  
  disconnect() {
    if (this.channel) {
      getSupabaseClient().removeChannel(this.channel)
      this.channel = null
    }
    this.auctionId = null
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    this.updateBuffer = []
  }
}

export const auctionWebSocketManager = AuctionWebSocketManager.getInstance()
