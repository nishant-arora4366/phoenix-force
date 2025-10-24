import { useEffect, useCallback, useRef, useState } from 'react'
import { useAuctionStore, auctionWebSocketManager } from '@/lib/auction-state-manager'
import { auctionCache, cacheKeys, cachedQuery } from '@/lib/auction-cache'
import { secureSessionManager } from '@/src/lib/secure-session'
import { interpretError } from '@/src/lib/error-codes'
import { useAuctionLoadingStates } from '@/lib/auction-loading-states'
import { logger } from '@/lib/logger'

interface UseOptimizedAuctionOptions {
  auctionId: string
  enableRealtime?: boolean
  cacheTimeout?: number
}

export function useOptimizedAuctionWithLoading({ 
  auctionId, 
  enableRealtime = true,
  cacheTimeout = 5000 
}: UseOptimizedAuctionOptions) {
  const store = useAuctionStore()
  const loadingStates = useAuctionLoadingStates()
  const [error, setError] = useState<string | null>(null)
  const fetchControllerRef = useRef<AbortController | null>(null)
  const actionQueueRef = useRef<Promise<any>>(Promise.resolve())
  const lastPlayerUpdateRef = useRef<string | null>(null)
  
  // Queue action to prevent concurrent calls
  const queueAction = useCallback(async <T,>(
    actionName: keyof typeof loadingStates,
    action: () => Promise<T>
  ): Promise<T> => {
    // Set loading state
    loadingStates.setLoadingState(actionName as any, true)
    
    // Queue the action
    const result = actionQueueRef.current.then(async () => {
      try {
        const data = await action()
        loadingStates.setError(null)
        return data
      } catch (err: any) {
        const errorMessage = err.message || 'Action failed'
        loadingStates.setError(errorMessage)
        throw err
      } finally {
        loadingStates.setLoadingState(actionName as any, false)
      }
    })
    
    actionQueueRef.current = result.catch(() => {}) // Prevent uncaught promise rejection
    return result
  }, [loadingStates])
  
  // Fetch auction data with caching
  const fetchAuctionData = useCallback(async (skipCache = false) => {
    try {
      // Cancel any pending requests
      if (fetchControllerRef.current) {
        fetchControllerRef.current.abort()
      }
      
      fetchControllerRef.current = new AbortController()
      const signal = fetchControllerRef.current.signal
      
      loadingStates.setLoadingState('isInitializing', true)
      
      // Fetch with cache (unless skipping)
      const data = await cachedQuery(
        cacheKeys.auction(auctionId),
        async () => {
          const response = await fetch(`/api/auctions/${auctionId}`, { signal })
          if (!response.ok) throw new Error('Failed to fetch auction')
          return response.json()
        },
        skipCache ? 0 : cacheTimeout
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
          const fullPlayerData = {
            ...playerData,
            ...currentAuctionPlayer
          }
          store.setCurrentPlayer(fullPlayerData)
          lastPlayerUpdateRef.current = fullPlayerData.id
        }
      }
      
      setError(null)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        logger.error('Error fetching auction data:', err)
        setError(err.message || 'Failed to load auction')
      }
    } finally {
      loadingStates.setLoadingState('isInitializing', false)
    }
  }, [auctionId, cacheTimeout, store, loadingStates])
  
  // Optimistic bid placement
  const placeBid = useCallback(async (teamId: string, amount: number) => {
    return queueAction('isLoadingBid', async () => {
      const token = secureSessionManager.getToken()
      if (!token) {
        throw new Error('Authentication required')
      }
      
      // Set team-specific loading
      loadingStates.setTeamBidLoading(teamId, true)
      
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
      } finally {
        loadingStates.setTeamBidLoading(teamId, false)
      }
    })
  }, [auctionId, store, queueAction, loadingStates])
  
  // Navigate to next player with loading state
  const nextPlayer = useCallback(async () => {
    return queueAction('isLoadingNext', async () => {
      const token = secureSessionManager.getToken()
      if (!token) throw new Error('Authentication required')
      
      // Prevent duplicate calls
      if (loadingStates.isLoadingNext) return
      
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
      
      const result = await response.json()
      
      // Update current player immediately if provided
      if (result.player) {
        store.setCurrentPlayer(result.player)
        lastPlayerUpdateRef.current = result.player.id
      }
      
      // Invalidate caches
      auctionCache.invalidate(cacheKeys.currentPlayer(auctionId))
      auctionCache.invalidatePattern(`bids:${auctionId}`)
      
      // Fetch fresh data after a short delay to ensure database is updated
      setTimeout(() => {
        fetchAuctionData(true) // Skip cache
      }, 100)
      
      return result
    })
  }, [auctionId, queueAction, store, fetchAuctionData, loadingStates])
  
  // Navigate to previous player with loading state
  const previousPlayer = useCallback(async () => {
    return queueAction('isLoadingPrevious', async () => {
      const token = secureSessionManager.getToken()
      if (!token) throw new Error('Authentication required')
      
      // Prevent duplicate calls
      if (loadingStates.isLoadingPrevious) return
      
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
      
      const result = await response.json()
      
      // Update current player immediately if provided
      if (result.player) {
        store.setCurrentPlayer(result.player)
        lastPlayerUpdateRef.current = result.player.id
      }
      
      // Invalidate caches
      auctionCache.invalidate(cacheKeys.currentPlayer(auctionId))
      auctionCache.invalidatePattern(`bids:${auctionId}`)
      
      // Fetch fresh data after a short delay
      setTimeout(() => {
        fetchAuctionData(true) // Skip cache
      }, 100)
      
      return result
    })
  }, [auctionId, queueAction, store, fetchAuctionData, loadingStates])
  
  // Sell player with loading state
  const sellPlayer = useCallback(async (teamId: string, amount: number) => {
    return queueAction('isLoadingSell', async () => {
      const token = secureSessionManager.getToken()
      if (!token) throw new Error('Authentication required')
      
      const response = await fetch(`/api/auctions/${auctionId}/current-player`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          action: 'sell',
          team_id: teamId,
          sold_price: amount
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to sell player')
      }
      
      const result = await response.json()
      
      // Invalidate caches
      auctionCache.invalidate(cacheKeys.currentPlayer(auctionId))
      auctionCache.invalidatePattern(`bids:${auctionId}`)
      
      // Fetch fresh data
      setTimeout(() => {
        fetchAuctionData(true)
      }, 100)
      
      return result
    })
  }, [auctionId, queueAction, fetchAuctionData])
  
  // Start auction
  const startAuction = useCallback(async () => {
    return queueAction('isLoadingStart', async () => {
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
    })
  }, [auctionId, store, queueAction])
  
  // Complete auction
  const completeAuction = useCallback(async () => {
    return queueAction('isLoadingComplete', async () => {
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
    })
  }, [auctionId, store, queueAction])
  
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
      loadingStates.resetLoadingStates()
    }
  }, [auctionId, enableRealtime])
  
  return {
    // State
    auction: store.auction,
    teams: store.auctionTeams,
    players: store.auctionPlayers,
    playerDetails: store.players,
    currentPlayer: store.currentPlayer,
    recentBids: store.recentBids,
    error,
    
    // Loading states
    isLoading: loadingStates.isInitializing,
    isLoadingNext: loadingStates.isLoadingNext,
    isLoadingPrevious: loadingStates.isLoadingPrevious,
    isLoadingSell: loadingStates.isLoadingSell,
    isLoadingBid: loadingStates.isLoadingBid,
    isLoadingStart: loadingStates.isLoadingStart,
    isLoadingComplete: loadingStates.isLoadingComplete,
    isAnyActionLoading: loadingStates.isAnyActionLoading(),
    isNavigating: loadingStates.isNavigationLoading(),
    teamBidLoading: loadingStates.teamBidLoading,
    
    // Actions
    placeBid,
    nextPlayer,
    previousPlayer,
    sellPlayer,
    startAuction,
    completeAuction,
    
    // Utilities
    refetch: () => fetchAuctionData(true), // Skip cache on manual refetch
    clearCache: () => auctionCache.invalidatePattern(`.*:${auctionId}`)
  }
}
