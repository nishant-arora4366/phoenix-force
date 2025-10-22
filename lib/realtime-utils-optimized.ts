/**
 * Optimized utility functions for realtime subscriptions
 * Removes redundancy and uses constants
 */

import { realtimeManager } from './realtime-manager'
import { useEffect } from 'react'
import { DB_TABLES, REALTIME_CONFIG } from './constants'
import { logger } from './logger'

// Generic subscription configuration builder
const createSubscriptionConfig = (
  tables: Array<{
    table: string
    filter?: string
    events?: ('INSERT' | 'UPDATE' | 'DELETE' | '*')[]
  }>,
  debounceMs: number = REALTIME_CONFIG.DEBOUNCE_MS
) => ({
  tables,
  debounceMs,
  onError: (error: any) => {
    logger.error('Realtime subscription error', error)
  }
})

// Generic update handler
const createUpdateHandler = (handlers: Record<string, (payload: any) => void>) => {
  return (updates: any[]) => {
    updates.forEach(({ table, type, payload }) => {
      const handler = handlers[table]
      if (handler) {
        handler({ type, ...payload })
      }
    })
  }
}

/**
 * Universal realtime subscription hook
 */
export function useRealtimeSubscription(
  channelId: string,
  tables: Array<{
    table: string
    filter?: string
    events?: ('INSERT' | 'UPDATE' | 'DELETE' | '*')[]
  }>,
  handlers: Record<string, (payload: any) => void>,
  options: {
    enabled?: boolean
    debounceMs?: number
    deps?: any[]
  } = {}
) {
  const { enabled = true, debounceMs = REALTIME_CONFIG.DEBOUNCE_MS, deps = [] } = options

  useEffect(() => {
    if (!enabled || !channelId) return

    const config = createSubscriptionConfig(tables, debounceMs)
    const unsubscribe = realtimeManager.subscribe(channelId, {
      ...config,
      onUpdate: createUpdateHandler(handlers)
    })

    return unsubscribe
  }, [channelId, enabled, ...deps])
}

/**
 * Auction realtime subscription hook
 */
export function useAuctionRealtime(
  auctionId: string,
  handlers: {
    onBidUpdate?: (payload: any) => void
    onAuctionUpdate?: (payload: any) => void
    onPlayerUpdate?: (payload: any) => void
    onTeamUpdate?: (payload: any) => void
  },
  enabled: boolean = true
) {
  useRealtimeSubscription(
    `auction-${auctionId}`,
    [
      { 
        table: DB_TABLES.AUCTION_BIDS, 
        filter: `auction_id=eq.${auctionId}`, 
        events: ['INSERT', 'UPDATE', 'DELETE'] 
      },
      { 
        table: DB_TABLES.AUCTIONS, 
        filter: `id=eq.${auctionId}`, 
        events: ['UPDATE'] 
      },
      { 
        table: DB_TABLES.AUCTION_PLAYERS, 
        filter: `auction_id=eq.${auctionId}`, 
        events: ['*'] 
      },
      { 
        table: DB_TABLES.AUCTION_TEAMS, 
        filter: `auction_id=eq.${auctionId}`, 
        events: ['*'] 
      }
    ],
    {
      [DB_TABLES.AUCTION_BIDS]: handlers.onBidUpdate || (() => {}),
      [DB_TABLES.AUCTIONS]: handlers.onAuctionUpdate || (() => {}),
      [DB_TABLES.AUCTION_PLAYERS]: handlers.onPlayerUpdate || (() => {}),
      [DB_TABLES.AUCTION_TEAMS]: handlers.onTeamUpdate || (() => {})
    },
    { enabled }
  )
}

/**
 * Tournament realtime subscription hook
 */
export function useTournamentRealtime(
  tournamentId: string,
  handlers: {
    onTournamentUpdate?: (payload: any) => void
    onSlotUpdate?: (payload: any) => void
  },
  enabled: boolean = true
) {
  useRealtimeSubscription(
    `tournament-${tournamentId}`,
    [
      { 
        table: DB_TABLES.TOURNAMENTS, 
        filter: `id=eq.${tournamentId}`, 
        events: ['UPDATE'] 
      },
      { 
        table: DB_TABLES.TOURNAMENT_SLOTS, 
        filter: `tournament_id=eq.${tournamentId}`, 
        events: ['*'] 
      }
    ],
    {
      [DB_TABLES.TOURNAMENTS]: handlers.onTournamentUpdate || (() => {}),
      [DB_TABLES.TOURNAMENT_SLOTS]: handlers.onSlotUpdate || (() => {})
    },
    { enabled }
  )
}

/**
 * User notifications subscription hook
 */
export function useUserNotifications(
  userId: string,
  onNotification: (notification: any) => void,
  enabled: boolean = true
) {
  useRealtimeSubscription(
    `notifications-${userId}`,
    [
      { 
        table: DB_TABLES.NOTIFICATIONS, 
        filter: `user_id=eq.${userId}`, 
        events: ['INSERT', 'UPDATE'] 
      }
    ],
    {
      [DB_TABLES.NOTIFICATIONS]: onNotification
    },
    { 
      enabled, 
      debounceMs: REALTIME_CONFIG.NOTIFICATION_DEBOUNCE_MS 
    }
  )
}

/**
 * Analytics realtime subscription hook
 */
export function useAnalyticsRealtime(
  onAnalyticsUpdate: (analytics: any) => void,
  enabled: boolean = true
) {
  useRealtimeSubscription(
    'analytics',
    [
      { 
        table: DB_TABLES.API_USAGE_ANALYTICS, 
        events: ['INSERT'] 
      }
    ],
    {
      [DB_TABLES.API_USAGE_ANALYTICS]: onAnalyticsUpdate
    },
    { 
      enabled, 
      debounceMs: REALTIME_CONFIG.ANALYTICS_DEBOUNCE_MS 
    }
  )
}

/**
 * Cleanup all realtime subscriptions
 */
export function cleanupAllSubscriptions() {
  realtimeManager.unsubscribeAll()
  logger.info('All realtime subscriptions cleaned up')
}
