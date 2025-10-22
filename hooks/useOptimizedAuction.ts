import { useEffect, useCallback, useRef, useState } from 'react'
import { useAuctionStore, auctionWebSocketManager } from '@/lib/auction-state-manager'
import { auctionCache, cacheKeys, cachedQuery } from '@/lib/auction-cache'
import { secureSessionManager } from '@/src/lib/secure-session'
import { interpretError } from '@/src/lib/error-codes'

interface UseOptimizedAuctionOptions {
  auctionId: string
  enableRealtime?: boolean
  cacheTimeout?: number
}

export function useOptimizedAuction({ 
  auctionId, 
  enableRealtime = true,
  cacheTimeout = 5000 
}: UseOptimizedAuctionOptions) {
  const store = useAuctionStore()
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchControllerRef = useRef<AbortController | null>(null)
  
  // Fetch auction data with caching
  const fetchAuctionData = useCallback(async () => {
    try {
      // Cancel any pending requests
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort()
      }
      
      fetchControllerRef.current = new AbortController()
      const signal = fetchControllerRef.current.signal
      
      // Fetch with cache
      const data = await cachedQuery(
        cacheKeys.auction(auctionId),
        async () => {
          const response = await fetch(`/api/auctions/${auctionId}`, { signal })
          if (!response.ok) throw new Error('Failed to fetch auction')
          return response.json()
        },
        cacheTimeout
      )
      
      // Update store with batch update
      store.batchUpdate({
        auction: data.auction,
        auctionTeams: data.teams,
        auctionPlayers: data.players,
        players: data.playerDetails,
        isLoading: false
      })
      
      // Find and set current player
      const currentAuctionPlayer = data.players?.find((p: any) => p.current_player)
      if (currentAuctionPlayer) {
        const playerData = data.playerDetails?.find((p: any) => 
          p.id === currentAuctionPlayer.player_id
        )
        if (playerData) {
          store.setCurrentPlayer({
            ...playerData,
            ...currentAuctionPlayer
          })
        }
      }
      
      setIsInitializing(false)
      setError(null)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error fetching auction data:', err)
        setError(err.message || 'Failed to load auction')
        setIsInitializing(false)
      }
    }
  }, [auctionId, cacheTimeout, store])
  
  // Optimistic bid placement
  const placeBid = useCallback(async (teamId: string, amount: number) => {
    const token = secureSessionManager.getToken()
    if (!token) {
      throw new Error('Authentication required')
    }
    
    // Optimistic update
    const tempBidId = store.optimisticBidUpdate(teamId, amount)
    
    try {
      const response = await fetch(`/api/auctions/${auctionId}/bids`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          team_id: teamId,
          bid_amount: amount
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        // Rollback optimistic update
        store.rollbackBid(tempBidId)
        
        // Handle error
        const errorInfo = interpretError(data.code)
        throw new Error(errorInfo.message({ raw: data.error }))
      }
      
      // Replace optimistic bid with real one
      store.rollbackBid(tempBidId)
      store.addBid(data.bid)
      
      // Invalidate bid cache
      auctionCache.invalidatePattern(`bids:${auctionId}`)
      
      return data
    } catch (err) {
      // Rollback on error
      store.rollbackBid(tempBidId)
      throw err
    }
  }, [auctionId, store])
  
  // Navigate to next player
  const nextPlayer = useCallback(async () => {
    const token = secureSessionManager.getToken()
    if (!token) throw new Error('Authentication required')
    
    const response = await fetch(`/api/auctions/${auctionId}/current-player`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'next' })
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to move to next player')
    }
    
    // Invalidate caches
    auctionCache.invalidate(cacheKeys.currentPlayer(auctionId))
    auctionCache.invalidatePattern(`bids:${auctionId}`)
    
    return response.json()
  }, [auctionId])
  
  // Navigate to previous player
  const previousPlayer = useCallback(async () => {
    const token = secureSessionManager.getToken()
    if (!token) throw new Error('Authentication required')
    
    const response = await fetch(`/api/auctions/${auctionId}/current-player`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'previous' })
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to move to previous player')
    }
    
    // Invalidate caches
    auctionCache.invalidate(cacheKeys.currentPlayer(auctionId))
    auctionCache.invalidatePattern(`bids:${auctionId}`)
    
    return response.json()
  }, [auctionId])
  
  // Start auction
  const startAuction = useCallback(async () => {
    const token = secureSessionManager.getToken()
    if (!token) throw new Error('Authentication required')
    
    const response = await fetch(`/api/auctions?id=${auctionId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'start' })
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to start auction')
    }
    
    // Update store
    store.setAuction({ ...store.auction, status: 'live' })
    
    // Invalidate auction cache
    auctionCache.invalidate(cacheKeys.auction(auctionId))
    
    return response.json()
  }, [auctionId, store])
  
  // Complete auction
  const completeAuction = useCallback(async () => {
    const token = secureSessionManager.getToken()
    if (!token) throw new Error('Authentication required')
    
    const response = await fetch(`/api/auctions?id=${auctionId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ action: 'complete' })
    })
    
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to complete auction')
    }
    
    // Update store
    store.setAuction({ ...store.auction, status: 'completed' })
    
    // Clear all caches for this auction
    auctionCache.invalidatePattern(`.*:${auctionId}`)
    
    return response.json()
  }, [auctionId, store])
  
  // Initialize and setup real-time
  useEffect(() => {
    fetchAuctionData()
    
    if (enableRealtime) {
      auctionWebSocketManager.connect(auctionId)
    }
    
    return () => {
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort()
      }
      if (enableRealtime) {
        auctionWebSocketManager.disconnect()
      }
    }
  }, [auctionId, enableRealtime, fetchAuctionData])
  
  return {
    // State
    auction: store.auction,
    teams: store.auctionTeams,
    players: store.auctionPlayers,
    playerDetails: store.players,
    currentPlayer: store.currentPlayer,
    recentBids: store.recentBids,
    isLoading: isInitializing,
    error,
    
    // Actions
    placeBid,
    nextPlayer,
    previousPlayer,
    startAuction,
    completeAuction,
    
    // Utilities
    refetch: fetchAuctionData,
    clearCache: () => auctionCache.invalidatePattern(`.*:${auctionId}`)
  }
}
