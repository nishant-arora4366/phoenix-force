import { useEffect, useRef } from 'react'
import { showPlayerSoldDialog } from '@/components/common/PlayerSoldDialog'
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

interface UsePlayerSoldNotificationOptions {
  players?: any[]
  teams?: any[]
}

/**
 * Hook to listen for player sold events and show notifications
 */
export function usePlayerSoldNotification(
  auctionId: string | null,
  options?: UsePlayerSoldNotificationOptions
) {
  const notifiedPlayers = useRef<Set<string>>(new Set())
  const initialSoldPlayers = useRef<Set<string>>(new Set())
  const supabase = getSupabaseClient()
  const { players = [], teams = [] } = options || {}
  
  // Use refs to avoid re-subscribing when players/teams change
  const playersRef = useRef(players)
  const teamsRef = useRef(teams)
  
  // Update refs when data changes
  useEffect(() => {
    playersRef.current = players
    teamsRef.current = teams
  }, [players, teams])

  useEffect(() => {
    if (!auctionId) return
    
    // Fetch all currently sold players to avoid showing notifications for them
    const initializeSoldPlayers = async () => {
      try {
        const { data: soldPlayers } = await supabase
          .from('auction_players')
          .select('player_id, sold_to, sold_price')
          .eq('auction_id', auctionId)
          .eq('status', 'sold')
        
        if (soldPlayers) {
          soldPlayers.forEach((ap: any) => {
            const key = `${ap.player_id}-${ap.sold_to}-${ap.sold_price}`
            initialSoldPlayers.current.add(key)
            notifiedPlayers.current.add(key)
          })
        }
      } catch (error) {
        logger.error('Error initializing sold players list', error)
      }
    }
    
    initializeSoldPlayers()

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
              
              // Skip notification for replacement players (sold_price = 0)
              if (soldPrice === 0) {
                return
              }
              
              // Prevent duplicate notifications
              const notificationKey = `${playerId}-${soldTo}-${soldPrice}`
              if (notifiedPlayers.current.has(notificationKey)) {
                return
              }
              notifiedPlayers.current.add(notificationKey)
              
              // Find player and team from passed data or fetch if needed
              let playerData = playersRef.current.find((p: any) => p.id === playerId)
              let teamData = teamsRef.current.find((t: any) => t.id === soldTo)
              
              // If data not available in props, try fetching (with error handling)
              if (!playerData || !teamData) {
                try {
                  const [playerResult, teamResult] = await Promise.all([
                    !playerData ? supabase
                      .from('players')
                      .select('id, display_name, profile_pic_url')
                      .eq('id', playerId)
                      .maybeSingle() : Promise.resolve({ data: playerData }),
                    !teamData ? supabase
                      .from('auction_teams')
                      .select('id, team_name')
                      .eq('id', soldTo)
                      .maybeSingle() : Promise.resolve({ data: teamData })
                  ])
                  
                  playerData = playerResult.data
                  teamData = teamResult.data
                } catch (error) {
                  logger.error('Error fetching player/team data for notification', error)
                  return
                }
              }
              
              if (playerData && teamData) {
                // Show the dialog
                showPlayerSoldDialog(
                  playerData.display_name,
                  soldPrice,
                  teamData.team_name,
                  playerData.profile_pic_url
                )
                
                logger.info('Player sold dialog shown', {
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
              
              // Find player and team from passed data or fetch if needed
              let playerData = playersRef.current.find((p: any) => p.id === playerId)
              let teamData = teamsRef.current.find((t: any) => t.id === teamId)
              
              // If data not available in props, try fetching (with error handling)
              if (!playerData || !teamData) {
                try {
                  const [playerResult, teamResult] = await Promise.all([
                    !playerData ? supabase
                      .from('players')
                      .select('id, display_name, profile_pic_url')
                      .eq('id', playerId)
                      .maybeSingle() : Promise.resolve({ data: playerData }),
                    !teamData ? supabase
                      .from('auction_teams')
                      .select('id, team_name')
                      .eq('id', teamId)
                      .maybeSingle() : Promise.resolve({ data: teamData })
                  ])
                  
                  playerData = playerResult.data
                  teamData = teamResult.data
                } catch (error) {
                  logger.error('Error fetching player/team data for bid notification', error)
                  return
                }
              }
              
              if (playerData && teamData) {
                showPlayerSoldDialog(
                  playerData.display_name,
                  amount,
                  teamData.team_name,
                  playerData.profile_pic_url
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
      // Don't clear notification history on cleanup to prevent duplicate notifications
      // notifiedPlayers.current.clear()
    }
  }, [auctionId, supabase])
}

/**
 * Manual trigger for player sold dialog
 * Useful for testing or manual triggers
 */
export function triggerPlayerSoldNotification(
  playerName: string,
  amount: number,
  teamName: string,
  playerImage?: string
) {
  showPlayerSoldDialog(playerName, amount, teamName, playerImage)
}
