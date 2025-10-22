import { useEffect, useRef } from 'react'
import { showPlayerSoldNotification } from '@/components/common/ToastNotification'
import { getSupabaseClient } from '@/src/lib/supabaseClient'
import { logger } from '@/lib/logger'

interface PlayerSoldData {
  player_id: string
  player_name: string
  player_image?: string
  sold_to_team_id: string
  team_name: string
  sold_amount: number
  auction_id: string
}

/**
 * Hook to listen for player sold events and show notifications
 */
export function usePlayerSoldNotification(auctionId: string | null) {
  const notifiedPlayers = useRef<Set<string>>(new Set())
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (!auctionId) return

    // Subscribe to auction_players table for sold status updates
    const channel = supabase
      .channel(`player-sold-${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auction_players',
          filter: `auction_id=eq.${auctionId}`
        },
        async (payload: any) => {
          try {
            // Check if player was just sold
            if (payload.new?.status === 'sold' && payload.old?.status !== 'sold') {
              const playerId = payload.new.player_id
              const soldTo = payload.new.sold_to
              const soldPrice = payload.new.sold_price
              
              // Prevent duplicate notifications
              const notificationKey = `${playerId}-${soldTo}-${soldPrice}`
              if (notifiedPlayers.current.has(notificationKey)) {
                return
              }
              notifiedPlayers.current.add(notificationKey)
              
              // Fetch player details
              const { data: playerData } = await supabase
                .from('players')
                .select('display_name, profile_pic_url')
                .eq('id', playerId)
                .single()
              
              // Fetch team details
              const { data: teamData } = await supabase
                .from('auction_teams')
                .select('team_name')
                .eq('id', soldTo)
                .single()
              
              if (playerData && teamData) {
                // Show the notification
                showPlayerSoldNotification(
                  playerData.display_name,
                  soldPrice,
                  teamData.team_name,
                  playerData.profile_pic_url
                )
                
                logger.info('Player sold notification shown', {
                  player: playerData.display_name,
                  team: teamData.team_name,
                  amount: soldPrice
                })
              }
            }
          } catch (error) {
            logger.error('Error processing player sold notification', error)
          }
        }
      )
      .subscribe()

    // Also listen for direct auction_bids that result in a sale
    const bidsChannel = supabase
      .channel(`player-sold-bids-${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auction_bids',
          filter: `auction_id=eq.${auctionId}`
        },
        async (payload: any) => {
          try {
            // Check if this bid resulted in a sale (is_sold flag or similar)
            if (payload.new?.is_winning_bid && payload.new?.is_final) {
              const playerId = payload.new.player_id
              const teamId = payload.new.team_id
              const amount = payload.new.bid_amount
              
              // Prevent duplicate notifications
              const notificationKey = `${playerId}-${teamId}-${amount}-bid`
              if (notifiedPlayers.current.has(notificationKey)) {
                return
              }
              notifiedPlayers.current.add(notificationKey)
              
              // Fetch player and team details in parallel
              const [playerResult, teamResult] = await Promise.all([
                supabase
                  .from('players')
                  .select('display_name, profile_pic_url')
                  .eq('id', playerId)
                  .single(),
                supabase
                  .from('auction_teams')
                  .select('team_name')
                  .eq('id', teamId)
                  .single()
              ])
              
              if (playerResult.data && teamResult.data) {
                showPlayerSoldNotification(
                  playerResult.data.display_name,
                  amount,
                  teamResult.data.team_name,
                  playerResult.data.profile_pic_url
                )
              }
            }
          } catch (error) {
            logger.error('Error processing bid-based sold notification', error)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(bidsChannel)
      // Clear notification history on cleanup
      notifiedPlayers.current.clear()
    }
  }, [auctionId])
}

/**
 * Manual trigger for player sold notification
 * Useful for testing or manual triggers
 */
export function triggerPlayerSoldNotification(
  playerName: string,
  amount: number,
  teamName: string,
  playerImage?: string
) {
  showPlayerSoldNotification(playerName, amount, teamName, playerImage)
}
