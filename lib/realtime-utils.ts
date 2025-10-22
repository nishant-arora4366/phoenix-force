/**
 * Utility functions for common realtime subscription patterns
 */

import { realtimeManager } from './realtime-manager'
import { useEffect, useCallback } from 'react'
import { showPlayerSoldNotification } from '@/components/common/ToastNotification'
import { getSupabaseClient } from '@/src/lib/supabaseClient'
import { logger } from './logger'

// Helper function to handle player sold notifications
async function handlePlayerSoldNotification(auctionPlayer: any) {
  try {
    const supabase = getSupabaseClient()
    
    // Fetch player details
    const { data: playerData } = await supabase
      .from('players')
      .select('display_name, profile_pic_url')
      .eq('id', auctionPlayer.player_id)
      .single()
    
    // Fetch team details
    const { data: teamData } = await supabase
      .from('auction_teams')
      .select('team_name')
      .eq('id', auctionPlayer.sold_to)
      .single()
    
    if (playerData && teamData) {
      showPlayerSoldNotification(
        playerData.display_name,
        auctionPlayer.sold_price || 0,
        teamData.team_name,
        playerData.profile_pic_url
      )
    }
  } catch (error) {
    logger.error('Error showing player sold notification', error)
  }
}

/**
 * Hook for auction realtime subscriptions
 */
export function useAuctionRealtime(
  auctionId: string,
  handlers: {
    onBidUpdate?: (bid: any) => void
    onAuctionUpdate?: (auction: any) => void
    onPlayerUpdate?: (player: any) => void
    onTeamUpdate?: (team: any) => void
  },
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || !auctionId) return

    const unsubscribe = realtimeManager.subscribe(
      `auction-${auctionId}`,
      {
        tables: [
          { table: 'auction_bids', filter: `auction_id=eq.${auctionId}`, events: ['INSERT', 'UPDATE', 'DELETE'] },
          { table: 'auctions', filter: `id=eq.${auctionId}`, events: ['UPDATE'] },
          { table: 'auction_players', filter: `auction_id=eq.${auctionId}`, events: ['*'] },
          { table: 'auction_teams', filter: `auction_id=eq.${auctionId}`, events: ['*'] }
        ],
        debounceMs: 100,
        onUpdate: (updates) => {
          updates.forEach(({ table, type, payload }) => {
            switch (table) {
              case 'auction_bids':
                handlers.onBidUpdate?.(payload)
                break
              case 'auctions':
                handlers.onAuctionUpdate?.(payload)
                break
              case 'auction_players':
                handlers.onPlayerUpdate?.(payload)
                // Check for player sold event
                if (payload.eventType === 'UPDATE' && 
                    payload.new?.status === 'sold' && 
                    payload.old?.status !== 'sold') {
                  // Fetch additional data and show notification
                  handlePlayerSoldNotification(payload.new)
                }
                break
              case 'auction_teams':
                handlers.onTeamUpdate?.(payload)
                break
            }
          })
        }
      }
    )

    return unsubscribe
  }, [auctionId, enabled])
}

/**
 * Hook for tournament realtime subscriptions
 */
export function useTournamentRealtime(
  tournamentId: string,
  handlers: {
    onTournamentUpdate?: (tournament: any) => void
    onSlotUpdate?: (slot: any) => void
    onNotification?: (notification: any) => void
  },
  userId?: string,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || !tournamentId) return

    // Tournament and slots subscription
    const unsubscribe = realtimeManager.subscribe(
      `tournament-${tournamentId}`,
      {
        tables: [
          { table: 'tournaments', filter: `id=eq.${tournamentId}`, events: ['UPDATE'] },
          { table: 'tournament_slots', filter: `tournament_id=eq.${tournamentId}`, events: ['*'] }
        ],
        debounceMs: 100,
        onUpdate: (updates) => {
          updates.forEach(({ table, type, payload }) => {
            switch (table) {
              case 'tournaments':
                handlers.onTournamentUpdate?.(payload)
                break
              case 'tournament_slots':
                handlers.onSlotUpdate?.(payload)
                break
            }
          })
        }
      }
    )

    // User notifications subscription
    let notificationUnsub: (() => void) | undefined
    if (userId) {
      notificationUnsub = realtimeManager.subscribe(
        `notifications-${userId}`,
        {
          tables: [
            { table: 'notifications', filter: `user_id=eq.${userId}`, events: ['INSERT', 'UPDATE'] }
          ],
          debounceMs: 200,
          onUpdate: (updates) => {
            updates.forEach(({ type, payload }) => {
              handlers.onNotification?.(payload)
            })
          }
        }
      )
    }

    return () => {
      unsubscribe()
      notificationUnsub?.()
    }
  }, [tournamentId, userId, enabled])
}

/**
 * Hook for player list realtime subscriptions
 */
export function usePlayersRealtime(
  handlers: {
    onPlayerUpdate?: (player: any) => void
    onPlayerCreate?: (player: any) => void
    onPlayerDelete?: (player: any) => void
  },
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return

    const unsubscribe = realtimeManager.subscribe(
      'players-list',
      {
        tables: [
          { table: 'players', events: ['*'] }
        ],
        debounceMs: 200,
        onUpdate: (updates) => {
          updates.forEach(({ type, payload }) => {
            switch (type) {
              case 'INSERT':
                handlers.onPlayerCreate?.(payload.new)
                break
              case 'UPDATE':
                handlers.onPlayerUpdate?.(payload)
                break
              case 'DELETE':
                handlers.onPlayerDelete?.(payload.old)
                break
            }
          })
        }
      }
    )

    return unsubscribe
  }, [enabled])
}

/**
 * Hook for user-specific realtime subscriptions
 */
export function useUserRealtime(
  userId: string,
  handlers: {
    onNotification?: (notification: any) => void
    onProfileUpdate?: (profile: any) => void
  },
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || !userId) return

    const unsubscribe = realtimeManager.subscribe(
      `user-${userId}`,
      {
        tables: [
          { table: 'notifications', filter: `user_id=eq.${userId}`, events: ['INSERT', 'UPDATE'] },
          { table: 'users', filter: `id=eq.${userId}`, events: ['UPDATE'] }
        ],
        debounceMs: 200,
        onUpdate: (updates) => {
          updates.forEach(({ table, type, payload }) => {
            switch (table) {
              case 'notifications':
                handlers.onNotification?.(payload)
                break
              case 'users':
                if (type === 'UPDATE') {
                  handlers.onProfileUpdate?.(payload.new)
                }
                break
            }
          })
        }
      }
    )

    return unsubscribe
  }, [userId, enabled])
}

/**
 * Hook for analytics realtime subscriptions
 */
export function useAnalyticsRealtime(
  handlers: {
    onAnalyticsUpdate?: (analytics: any) => void
  },
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return

    const unsubscribe = realtimeManager.subscribe(
      'analytics',
      {
        tables: [
          { table: 'api_usage_analytics', events: ['INSERT'] }
        ],
        debounceMs: 500, // Less frequent for analytics
        onUpdate: (updates) => {
          updates.forEach(({ type, payload }) => {
            if (type === 'INSERT') {
              handlers.onAnalyticsUpdate?.(payload.new)
            }
          })
        }
      }
    )

    return unsubscribe
  }, [enabled])
}

/**
 * Cleanup all realtime subscriptions (useful for logout)
 */
export function cleanupAllSubscriptions() {
  realtimeManager.unsubscribeAll()
}
