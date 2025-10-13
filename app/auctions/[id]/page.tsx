'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { secureSessionManager } from '@/src/lib/secure-session'

interface Auction {
  id: string
  tournament_id: string
  status: string
  timer_seconds: number
  total_purse: number
  max_tokens_per_captain: number
  min_bid_amount: number
  use_base_price: boolean
  min_increment: number
  use_fixed_increments: boolean
  player_order_type: string
  created_by: string
  auction_config: any
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  tournament_name?: string
  tournament_format?: string
  tournament_date?: string
}

interface AuctionTeam {
  id: string
  auction_id: string
  captain_id: string
  team_name: string
  total_spent: number
  remaining_purse: number
  players_count: number
  required_players: number
  created_at: string
  updated_at: string
}

interface AuctionPlayer {
  id: string
  auction_id: string
  player_id: string
  status: string
  sold_to?: string
  sold_price?: number
  display_order: number
  times_skipped: number
  current_player: boolean
  created_at: string
  updated_at: string
}

interface Player {
  id: string
  display_name: string
  profile_pic_url?: string
  user_id?: string
  skills?: { [skillName: string]: string | string[] }
}

interface User {
  id: string
  email: string
  username?: string
  firstname?: string
  lastname?: string
  role: string
}

export default function AuctionPage() {
  const params = useParams()
  const auctionId = params.id as string
  
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isUserLoading, setIsUserLoading] = useState(true)
  const [auction, setAuction] = useState<Auction | null>(null)
  const [auctionTeams, setAuctionTeams] = useState<AuctionTeam[]>([])
  const [auctionPlayers, setAuctionPlayers] = useState<AuctionPlayer[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<{[key: string]: boolean}>({})
  const [photoPreview, setPhotoPreview] = useState<{isOpen: boolean, src: string, alt: string}>({
    isOpen: false,
    src: '',
    alt: ''
  })
  const [bidLoading, setBidLoading] = useState<{[key: string]: boolean}>({})
  const [recentBids, setRecentBids] = useState<Array<{
    id: string
    team_id: string
    team_name: string
    bid_amount: number
    timestamp: string
    player_id: string
    is_winning_bid: boolean
    is_undone: boolean
  }>>([])
  const [currentPlayer, setCurrentPlayer] = useState<any>(null)
  const [uiNotice, setUiNotice] = useState<{ type: 'error' | 'info'; message: string } | null>(null)
  const [viewingUnsoldPlayers, setViewingUnsoldPlayers] = useState(false)

  // Helper function to get available players (excluding captains)
  const getAvailablePlayers = () => {
    const captainIds = (auctionTeams || []).map(t => t.captain_id)
    return auctionPlayers
      .filter(ap => ap.status === 'available' && !captainIds.includes(ap.player_id))
      .sort((a, b) => a.display_order - b.display_order)
  }

  // Helper function to check if we're at the end of the player list
  const isAtEndOfPlayerList = () => {
    if (!currentPlayer) return false
    const availablePlayers = getAvailablePlayers()
    const currentIndex = availablePlayers.findIndex(ap => ap.player_id === currentPlayer.player_id)
    return currentIndex >= availablePlayers.length - 1
  }

  // Get current player from auction_players data (exclude captains)
  const getCurrentPlayer = () => {
    if (!auctionPlayers || auctionPlayers.length === 0) {
      return null
    }
    const captainIds = (auctionTeams || []).map(t => t.captain_id)
    
    // Find the current player from auction_players
    const currentAuctionPlayer = auctionPlayers.find(ap => ap.current_player === true && !captainIds.includes(ap.player_id))
    
    if (!currentAuctionPlayer) {
      // If no current player is set, get the first player by display_order
      const firstPlayer = auctionPlayers
        .filter(ap => ap.status === 'available' && !captainIds.includes(ap.player_id))
        .sort((a, b) => a.display_order - b.display_order)[0]
      
      if (!firstPlayer) return null
      
      const currentPlayerData = players.find(p => p.id === firstPlayer.player_id)
      if (!currentPlayerData) return null
      
      return {
        ...currentPlayerData,
        ...firstPlayer
      }
    }
    
    const currentPlayerData = players.find(p => p.id === currentAuctionPlayer.player_id)
    if (!currentPlayerData) return null
    
    return {
      ...currentPlayerData,
      ...currentAuctionPlayer
    }
  }

  // Fetch bid history from database for current player only
  const fetchBidHistory = async () => {
    if (!currentPlayer) {
      setRecentBids([])
      return
    }
    
    try {
      const response = await fetch(`/api/auctions/${auctionId}/bids?player_id=${currentPlayer.player_id}`)
      if (response.ok) {
        const data = await response.json()
        // The API returns the bids array directly, not wrapped in a 'bids' property
        const formattedBids = data.map((bid: any) => ({
          id: bid.id,
          team_id: bid.team_id,
          team_name: bid.team_name || 'Unknown Team',
          bid_amount: bid.bid_amount,
          timestamp: bid.timestamp,
          player_id: bid.player_id,
          is_winning_bid: bid.is_winning_bid,
          is_undone: bid.is_undone
        }))
        setRecentBids(formattedBids)
      }
    } catch (error) {
      console.error('Error fetching bid history:', error)
    }
  }

  // Get latest bids by each captain
  const getLatestBidsByCaptain = () => {
    if (!recentBids.length) return []
    
    // Group bids by team_id and get the latest one for each team
    const latestBidsByTeam = recentBids.reduce((acc, bid) => {
      if (!acc[bid.team_id] || new Date(bid.timestamp) > new Date(acc[bid.team_id].timestamp)) {
        acc[bid.team_id] = bid
      }
      return acc
    }, {} as Record<string, typeof recentBids[0]>)
    
    // Convert to array and sort by timestamp (most recent first)
    return Object.values(latestBidsByTeam).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }

  // Calculate next bid amount based on auction configuration
  const calculateNextBid = (currentBid?: number) => {
    // If there's no current bid yet, first bid should equal starting bid
    // starting bid = max(base price, min bid) when use_base_price; else = min bid
    const minBid = auction?.min_bid_amount || 0
    const startingBid = currentPlayer && auction?.use_base_price
      ? Math.max(getPlayerBasePrice(currentPlayer), minBid)
      : minBid

    // Resolve current bid: prefer provided, else from recent winning bid
    let bid: number | undefined = currentBid
    if (bid == null) {
      const winningBid = recentBids?.find(b => b.is_winning_bid && !b.is_undone)
      bid = winningBid ? winningBid.bid_amount : undefined
    }

    // If still no bid, return starting bid (no increment applied)
    if (bid == null) return startingBid

    if (!auction) return bid

    // Otherwise compute incremented next bid
    if (auction.use_fixed_increments) {
      return bid + auction.min_increment
    }

    const customRanges = auction.auction_config?.custom_increment_ranges
    if (customRanges) {
      if (bid <= 200) return bid + (customRanges.range_0_200 || 20)
      if (bid <= 500) return bid + (customRanges.range_200_500 || 50)
      return bid + (customRanges.range_500_plus || 100)
    }
    return bid + auction.min_increment
  }

  // Get base price from player skills
  const getPlayerBasePrice = (player: any) => {
    if (!player?.skills?.['Base Price']) return 0
    return parseInt(player.skills['Base Price']) || 0
  }

  // Get current bid from auction_bids table
  const getCurrentBid = () => {
    // If no bids yet for this player, intentionally return null so UI can show "No bids yet"
    if (!recentBids || recentBids.length === 0) return null
    
    const winningBid = recentBids.find(bid => bid.is_winning_bid && !bid.is_undone)
    return winningBid ? winningBid.bid_amount : null
  }

  const isAuctionLive = auction?.status === 'live'

  // Handle placing a bid
  const handlePlaceBid = async (teamId: string, bidAmount: number) => {
    if (!auction || !user) return
    
    // Check if auction is in live status
    if (auction.status !== 'live') {
      setUiNotice({ type: 'error', message: `Cannot place bids. Auction is currently ${auction.status}. Start the auction to enable bidding.` })
      return
    }
    
    setBidLoading(prev => ({ ...prev, [`bid_${teamId}`]: true }))
    
    try {
      const token = secureSessionManager.getToken()
      if (!token) {
        setUiNotice({ type: 'error', message: 'Authentication required to place bid' })
        return
      }

      const response = await fetch(`/api/auctions/${auctionId}/bids`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          team_id: teamId,
          bid_amount: bidAmount,
          player_id: currentPlayer?.player_id
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update auction state locally
        // Update local state - current bid is now managed by auction_bids table

        // Note: Team purse is not updated during bidding - only when player is sold

        // Refresh bid history from database
        await fetchBidHistory()
      } else {
        const errorData = await response.json()
        setUiNotice({ type: 'error', message: `Failed to place bid: ${errorData.error || 'Unknown error'}` })
      }
    } catch (error) {
      console.error('Error placing bid:', error)
      setUiNotice({ type: 'error', message: 'Failed to place bid. Please try again.' })
    } finally {
      setBidLoading(prev => ({ ...prev, [`bid_${teamId}`]: false }))
    }
  }

  // Handle undoing the latest bid
  const handleUndoBid = async () => {
    if (!auction || !recentBids || recentBids.length === 0) return
    
    // Check if auction is in live status
    if (auction.status !== 'live') {
      alert(`Cannot undo bid. Auction is currently ${auction.status}. Please start the auction first.`)
      return
    }
    
    setBidLoading(prev => ({ ...prev, undo: true }))
    
    try {
      const token = secureSessionManager.getToken()
      if (!token) {
        setUiNotice({ type: 'error', message: 'Authentication required to undo bid' })
        return
      }

      // Find the latest winning bid
      const latestBids = getLatestBidsByCaptain()
      const winningBid = latestBids.find(bid => bid.is_winning_bid && !bid.is_undone)
      
      if (!winningBid) {
        alert('No bid to undo')
        return
      }

      const response = await fetch(`/api/auctions/${auctionId}/bids?bidId=${winningBid.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Refresh bid history for current player
        await fetchBidHistory()
        
        // Note: Team purse is not affected by bid operations - only when players are sold
      } else {
        const errorData = await response.json()
        setUiNotice({ type: 'error', message: `Failed to undo bid: ${errorData.error || 'Unknown error'}` })
      }
    } catch (error) {
      console.error('Error undoing bid:', error)
      setUiNotice({ type: 'error', message: 'Failed to undo bid. Please try again.' })
    } finally {
      setBidLoading(prev => ({ ...prev, undo: false }))
    }
  }

  const handleUndoPlayerAssignment = async () => {
    if (!auction || !auctionTeams || auctionTeams.length === 0) return
    
    // Check if auction is in live status
    if (auction.status !== 'live') {
      alert(`Cannot undo player assignment. Auction is currently ${auction.status}. Please start the auction first.`)
      return
    }
    
    // Check if any team has players assigned
    const teamsWithPlayers = auctionTeams.filter(team => team.players_count > 0)
    if (teamsWithPlayers.length === 0) {
      alert('No player assignments to undo')
      return
    }
    
    setActionLoading(prev => ({ ...prev, undoPlayerAssignment: true }))
    
    try {
      const token = secureSessionManager.getToken()
      if (!token) {
        setUiNotice({ type: 'error', message: 'Authentication required to undo player assignment' })
        return
      }

      const response = await fetch(`/api/auctions/${auctionId}/undo-player-assignment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Refresh all data by refetching auction data and bid history
        const auctionResponse = await fetch(`/api/auctions/${auctionId}`)
        if (auctionResponse.ok) {
          const auctionResult = await auctionResponse.json()
          if (auctionResult.success) {
            setAuction(auctionResult.auction)
            setAuctionTeams(auctionResult.teams || [])
            setAuctionPlayers(auctionResult.players || [])
            setPlayers(auctionResult.playerDetails || [])
          }
        }
        await fetchBidHistory()
        
        setUiNotice({ type: 'info', message: 'Player assignment undone successfully' })
      } else {
        const errorData = await response.json()
        setUiNotice({ type: 'error', message: `Failed to undo player assignment: ${errorData.error || 'Unknown error'}` })
      }
    } catch (error) {
      console.error('Error undoing player assignment:', error)
      setUiNotice({ type: 'error', message: 'Failed to undo player assignment. Please try again.' })
    } finally {
      setActionLoading(prev => ({ ...prev, undoPlayerAssignment: false }))
    }
  }

  // Handle selling player
  const handleSellPlayer = async () => {
    if (!auction || !currentPlayer || !recentBids || recentBids.length === 0) return
    
    // Check if auction is in live status
    if (auction.status !== 'live') {
      setUiNotice({ type: 'error', message: `Cannot sell player. Auction is currently ${auction.status}. Start the auction to enable actions.` })
      return
    }
    
    setBidLoading(prev => ({ ...prev, sell: true }))
    
    try {
      const token = secureSessionManager.getToken()
      if (!token) {
        setUiNotice({ type: 'error', message: 'Authentication required to sell player' })
        return
      }

      // Get the winning bid details
      const winningBid = recentBids.find(bid => bid.is_winning_bid && !bid.is_undone)
      if (!winningBid) {
        alert('No winning bid found')
        return
      }

      const response = await fetch(`/api/auctions?id=${auctionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'sell_player',
          player_id: currentPlayer.player_id,
          team_id: winningBid.team_id,
          sold_price: winningBid.bid_amount
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Update auction players state to mark current player as sold
        setAuctionPlayers(prev => prev.map(ap => 
          ap.player_id === currentPlayer.player_id 
            ? { ...ap, status: 'sold', sold_to: winningBid.team_id, sold_price: winningBid.bid_amount, current_player: false }
            : ap
        ))

        // Reset viewing unsold players state when a player is sold
        setViewingUnsoldPlayers(false)

        // Update team statistics in local state
        setAuctionTeams(prev => prev.map(team => 
          team.id === winningBid.team_id 
            ? { 
                ...team, 
                players_count: (team.players_count || 0) + 1,
                total_spent: (team.total_spent || 0) + winningBid.bid_amount,
                remaining_purse: (team.remaining_purse || 0) - winningBid.bid_amount
              }
            : team
        ))

        // Bid history will be fetched automatically by useEffect when currentPlayer changes

        // Handle next player if available
        if (data.next_player) {
          const nextPlayerData = players.find(p => p.id === data.next_player.player_id)
          
          if (nextPlayerData) {
            // Set the next player as current
            setCurrentPlayer({
              ...nextPlayerData,
              ...data.next_player
            })

            // Update auction players to mark next player as current
            setAuctionPlayers(prev => prev.map(ap => ({
              ...ap,
              current_player: ap.player_id === data.next_player.player_id
            })))
          }
        } else {
          // No more players available
          setCurrentPlayer(null)
        }
        
        // State has been updated locally, no need to refetch
      } else {
        const errorData = await response.json()
        alert(`Failed to sell player: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error selling player:', error)
      alert('Failed to sell player. Please try again.')
    } finally {
      setBidLoading(prev => ({ ...prev, sell: false }))
    }
  }

  // Handle photo preview
  const handlePhotoClick = (src: string, alt: string) => {
    setPhotoPreview({
      isOpen: true,
      src,
      alt
    })
  }

  const handleClosePhotoPreview = () => {
    setPhotoPreview({
      isOpen: false,
      src: '',
      alt: ''
    })
  }

  // Handle ESC key to close photo preview
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && photoPreview.isOpen) {
        handleClosePhotoPreview()
      }
    }

    if (photoPreview.isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [photoPreview.isOpen])

  // Handle next player navigation
  const handleNextPlayer = async () => {
    if (!auction || !user || !currentPlayer) return
    
    setActionLoading(prev => ({ ...prev, nextPlayer: true }))
    
    try {
      const token = secureSessionManager.getToken()
      if (!token) {
        alert('Authentication required to control auction')
        return
      }

      // Find current player index in the ordered list (excluding captains)
      const availablePlayers = getAvailablePlayers()
      const currentIndex = availablePlayers.findIndex(ap => ap.player_id === currentPlayer.player_id)
      
      if (currentIndex === -1) {
        alert('Current player not found in available players list')
        return
      }

      // Check if we're at the end of the list
      if (currentIndex >= availablePlayers.length - 1) {
        // If we're at the end and not already viewing unsold players, start viewing unsold players
        if (!viewingUnsoldPlayers) {
          setViewingUnsoldPlayers(true)
          // Move to the first available player
          const firstAuctionPlayer = availablePlayers[0]
          const firstPlayerData = players.find(p => p.id === firstAuctionPlayer.player_id)
          
          if (firstPlayerData && firstAuctionPlayer) {
            // Update database to set new current player
            const response = await fetch(`/api/auctions/${auctionId}/current-player`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                action: 'set_current',
                player_id: firstAuctionPlayer.player_id
              })
            })

            if (response.ok) {
              // Update local state
              setCurrentPlayer({
                ...firstPlayerData,
                ...firstAuctionPlayer
              })
              
              // Update auction players state to reflect current player change
              setAuctionPlayers(prev => prev.map(ap => ({
                ...ap,
                current_player: ap.player_id === firstAuctionPlayer.player_id
              })))
            } else {
              const errorData = await response.json()
              alert(`Failed to move to first unsold player: ${errorData.error || 'Unknown error'}`)
            }
          }
          return
        } else {
          alert('No more unsold players available')
          return
        }
      }

      // Move to next player in the order
      const nextAuctionPlayer = availablePlayers[currentIndex + 1]
      const nextPlayerData = players.find(p => p.id === nextAuctionPlayer.player_id)
      
      if (nextPlayerData && nextAuctionPlayer) {
        // Update database to set new current player
        const response = await fetch(`/api/auctions/${auctionId}/current-player`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'set_current',
            player_id: nextAuctionPlayer.player_id
          })
        })

        if (response.ok) {
          // Update local state
          setCurrentPlayer({
            ...nextPlayerData,
            ...nextAuctionPlayer
          })
          
          // Update auction players state to reflect current player change
          setAuctionPlayers(prev => prev.map(ap => ({
            ...ap,
            current_player: ap.player_id === nextAuctionPlayer.player_id
          })))
          
          // Bid history will be fetched automatically by useEffect when currentPlayer changes
        } else {
          const errorData = await response.json()
          alert(`Failed to move to next player: ${errorData.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Error moving to next player:', error)
      alert('Failed to move to next player. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, nextPlayer: false }))
    }
  }

  // Handle previous player navigation
  const handlePreviousPlayer = async () => {
    if (!auction || !user || !currentPlayer) return
    
    setActionLoading(prev => ({ ...prev, previousPlayer: true }))
    
    try {
      const token = secureSessionManager.getToken()
      if (!token) {
        alert('Authentication required to control auction')
        return
      }

      // Find current player index in the ordered list (excluding captains)
      const availablePlayers = getAvailablePlayers()
      
      const currentIndex = availablePlayers.findIndex(ap => ap.player_id === currentPlayer.player_id)
      
      if (currentIndex <= 0) {
        alert('No previous player available')
        return
      }

      // Move to previous player in the order
      const previousAuctionPlayer = availablePlayers[currentIndex - 1]
      const previousPlayerData = players.find(p => p.id === previousAuctionPlayer.player_id)
      
      if (previousPlayerData && previousAuctionPlayer) {
        // Update database to set new current player
        const response = await fetch(`/api/auctions/${auctionId}/current-player`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'set_current',
            player_id: previousAuctionPlayer.player_id
          })
        })

        if (response.ok) {
          // Update local state
          setCurrentPlayer({
            ...previousPlayerData,
            ...previousAuctionPlayer
          })
          
          // Update auction players state to reflect current player change
          setAuctionPlayers(prev => prev.map(ap => ({
            ...ap,
            current_player: ap.player_id === previousAuctionPlayer.player_id
          })))
          
          // Bid history will be fetched automatically by useEffect when currentPlayer changes
        } else {
          const errorData = await response.json()
          alert(`Failed to move to previous player: ${errorData.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Error moving to previous player:', error)
      alert('Failed to move to previous player. Please try again.')
    } finally {
      setActionLoading(prev => ({ ...prev, previousPlayer: false }))
    }
  }

  // Handle starting/pausing the auction
  const handleStartPauseAuction = async () => {
    if (!auction || !user) return
    
    setActionLoading(prev => ({ ...prev, startPause: true }))
    
    try {
      const token = secureSessionManager.getToken()
      if (!token) {
        alert('Authentication required to control auction')
        return
      }

      // Determine the new status based on current status
      let newStatus: string
      let updateData: any = {}

      if (auction.status === 'draft') {
        newStatus = 'live'
        updateData = {
          status: newStatus,
          started_at: new Date().toISOString()
        }
      } else if (auction.status === 'live') {
        newStatus = 'paused'
        updateData = {
          status: newStatus
        }
      } else if (auction.status === 'paused') {
        newStatus = 'live'
        updateData = {
          status: newStatus
        }
      } else {
        alert('Cannot change status from current state')
        return
      }

      const response = await fetch(`/api/auctions?id=${auctionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        // Update auction state locally instead of refreshing page
        setAuction(prev => prev ? {
          ...prev,
          status: newStatus,
          started_at: newStatus === 'live' ? new Date().toISOString() : prev.started_at
        } : null)
        
        // If starting the auction, compute/set the current player locally
        if (newStatus === 'live') {
          const next = getCurrentPlayer()
          setCurrentPlayer(next)
          setUiNotice(null)
        }
      } else {
        const errorData = await response.json()
        setUiNotice({ type: 'error', message: `Failed to ${auction.status === 'draft' ? 'start' : 'pause/resume'} auction: ${errorData.error || 'Unknown error'}` })
      }
    } catch (error) {
      console.error('Error controlling auction:', error)
      setUiNotice({ type: 'error', message: 'Failed to control auction. Please try again.' })
    } finally {
      setActionLoading(prev => ({ ...prev, startPause: false }))
    }
  }

  // Check user authentication and role
  useEffect(() => {
    const checkUser = async () => {
      try {
        const sessionUser = secureSessionManager.getUser()
        setUser(sessionUser)
        
        if (sessionUser) {
          // Fetch user profile with JWT token
          const token = secureSessionManager.getToken()
          const response = await fetch(`/api/user-profile?userId=${sessionUser.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const result = await response.json()
          if (result.success) {
            setUserProfile(result.data)
          }
        }
      } catch (error) {
        console.error('Error checking user:', error)
      } finally {
        setIsUserLoading(false)
      }
    }
    checkUser()

    // Subscribe to session changes
    const unsubscribe = secureSessionManager.subscribe((sessionUser) => {
      setUser(sessionUser)
      
      if (sessionUser) {
        // Fetch user profile when user changes
        const token = secureSessionManager.getToken()
        fetch(`/api/user-profile?userId=${sessionUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
          .then(response => response.json())
          .then(result => {
            if (result.success) {
              setUserProfile(result.data)
            }
          })
          .catch(error => {
            console.error('Error fetching user profile:', error)
          })
      } else {
        setUserProfile(null)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Fetch auction data
  useEffect(() => {
    const fetchAuctionData = async () => {
      if (!auctionId) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Fetch auction details
        const auctionResponse = await fetch(`/api/auctions/${auctionId}`)
        if (!auctionResponse.ok) {
          throw new Error('Failed to fetch auction')
        }
        
        const auctionResult = await auctionResponse.json()
        if (!auctionResult.success) {
          throw new Error(auctionResult.error || 'Failed to fetch auction')
        }
        
        setAuction(auctionResult.auction)
        setAuctionTeams(auctionResult.teams || [])
        setAuctionPlayers(auctionResult.players || [])
        setPlayers(auctionResult.playerDetails || [])
        
      } catch (error) {
        console.error('Error fetching auction data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load auction')
      } finally {
        setLoading(false)
      }
    }

    fetchAuctionData()
    fetchBidHistory()
  }, [auctionId])

  // Set current player when auction data is loaded
  useEffect(() => {
    if (auction && players.length > 0 && auctionPlayers.length > 0) {
      const currentPlayerData = getCurrentPlayer()
      setCurrentPlayer(currentPlayerData)
    }
  }, [auction, players, auctionPlayers])

  // Fetch bid history when current player changes
  useEffect(() => {
    if (currentPlayer) {
      fetchBidHistory()
    }
  }, [currentPlayer])

  if (isUserLoading || loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Section Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
        <div className="absolute inset-0" 
             style={{
               background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
             }}></div>
        
        <div className="relative z-10 flex items-center justify-center py-20 min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
            <p className="text-[#DBD0C0]">Loading auction...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Section Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
        <div className="absolute inset-0" 
             style={{
               background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
             }}></div>
        
        <div className="relative z-10 flex items-center justify-center py-20 min-h-screen">
          <div className="text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-[#DBD0C0] mb-2">Error Loading Auction</h1>
            <p className="text-[#DBD0C0]/70 mb-6">{error}</p>
            <Link 
              href="/auctions"
              className="inline-flex items-center px-4 py-2 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/30 rounded-lg hover:bg-[#CEA17A]/25 transition-all duration-150"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Auctions
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Section Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
        <div className="absolute inset-0" 
             style={{
               background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
             }}></div>
        
        <div className="relative z-10 flex items-center justify-center py-20 min-h-screen">
          <div className="text-center">
            <div className="text-[#CEA17A] text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-[#DBD0C0] mb-2">Auction Not Found</h1>
            <p className="text-[#DBD0C0]/70 mb-6">The auction you're looking for doesn't exist.</p>
            <Link 
              href="/auctions"
              className="inline-flex items-center px-4 py-2 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/30 rounded-lg hover:bg-[#CEA17A]/25 transition-all duration-150"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Auctions
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'text-yellow-400 bg-yellow-400/10'
      case 'pending': return 'text-blue-400 bg-blue-400/10'
      case 'live': return 'text-green-400 bg-green-400/10'
      case 'paused': return 'text-orange-400 bg-orange-400/10'
      case 'completed': return 'text-gray-400 bg-gray-400/10'
      case 'cancelled': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Draft'
      case 'pending': return 'Pending'
      case 'live': return 'Live'
      case 'paused': return 'Paused'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Section Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
      <div className="absolute inset-0" 
           style={{
             background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
           }}></div>
      
      {/* Animated Grid Lines */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#CEA17A] to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>
      
      {/* Background Glowing Orbs - Behind Content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#CEA17A]/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0s'}}></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#75020f]/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#CEA17A]/3 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>
      
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <Link 
              href="/auctions"
              className="inline-flex items-center px-3 py-2 text-[#CEA17A] hover:text-[#CEA17A]/80 transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Auctions
            </Link>
            <div className="h-6 w-px bg-[#CEA17A]/20"></div>
            <div>
              <h1 className="text-4xl font-bold text-[#DBD0C0]">
                {auction.tournament_name || 'Auction'}
              </h1>
              <p className="text-[#CEA17A] mt-2">
                Auction Details and Management
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(auction.status)}`}>
              {getStatusText(auction.status)}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow w-full">
        {/* Host Actions - Only show for hosts and admins */}
        {userProfile && (userProfile.role === 'host' || userProfile.role === 'admin') && (
          <div className="bg-[#1a1a1a]/50 rounded-xl p-6 border border-[#CEA17A]/10 mb-8">
            <h2 className="text-2xl font-bold text-[#DBD0C0] mb-6">Host Actions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Player Navigation */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-[#CEA17A] mb-3">Player Navigation</h3>
                {currentPlayer && auctionPlayers && (() => {
                  const availablePlayers = getAvailablePlayers()
                  const currentPlayerIndex = availablePlayers.findIndex(ap => ap.player_id === currentPlayer.player_id)
                  const currentPosition = currentPlayerIndex + 1
                  const totalAvailable = availablePlayers.length
                  
                  return (
                    <div className="text-sm text-[#DBD0C0]/70 mb-2">
                      Player {currentPosition} of {totalAvailable}
                      {viewingUnsoldPlayers && (
                        <div className="text-xs text-orange-400 mt-1">
                          Viewing Unsold Players
                        </div>
                      )}
                    </div>
                  )
                })()}
                <button 
                  onClick={handlePreviousPlayer}
                  disabled={!currentPlayer || !auctionPlayers || (() => {
                    const availablePlayers = getAvailablePlayers()
                    return availablePlayers.findIndex(ap => ap.player_id === currentPlayer.player_id) <= 0
                  })() || actionLoading.previousPlayer}
                  className={`w-full px-4 py-2 border rounded-lg transition-all duration-150 flex items-center justify-center ${
                    !currentPlayer || !auctionPlayers || (() => {
                      const availablePlayers = getAvailablePlayers()
                      return availablePlayers.findIndex(ap => ap.player_id === currentPlayer.player_id) <= 0
                    })() || actionLoading.previousPlayer
                      ? 'bg-gray-500/10 text-gray-500 border-gray-500/20 cursor-not-allowed'
                      : 'bg-[#CEA17A]/15 text-[#CEA17A] border-[#CEA17A]/30 hover:bg-[#CEA17A]/25'
                  }`}
                >
                  {actionLoading.previousPlayer ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous Player
                    </>
                  )}
                </button>
                <button 
                  onClick={handleNextPlayer}
                  disabled={!currentPlayer || !auctionPlayers || (() => {
                    const availablePlayers = getAvailablePlayers()
                    // Only disable if there are no available players left (all players sold)
                    return availablePlayers.length === 0
                  })() || actionLoading.nextPlayer}
                  className={`w-full px-4 py-2 border rounded-lg transition-all duration-150 flex items-center justify-center ${
                    !currentPlayer || !auctionPlayers || (() => {
                      const availablePlayers = getAvailablePlayers()
                      return availablePlayers.length === 0
                    })() || actionLoading.nextPlayer
                      ? 'bg-gray-500/10 text-gray-500 border-gray-500/20 cursor-not-allowed'
                      : 'bg-[#CEA17A]/15 text-[#CEA17A] border-[#CEA17A]/30 hover:bg-[#CEA17A]/25'
                  }`}
                >
                  {actionLoading.nextPlayer ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      {(() => {
                        if (!currentPlayer) return 'Next Player'
                        
                        const availablePlayers = getAvailablePlayers()
                        const currentIndex = availablePlayers.findIndex(ap => ap.player_id === currentPlayer.player_id)
                        const isAtEnd = currentIndex >= availablePlayers.length - 1
                        
                        if (isAtEnd && !viewingUnsoldPlayers) {
                          return 'View Unsold Players'
                        } else if (viewingUnsoldPlayers) {
                          return 'Next'
                        } else {
                          return 'Next Player'
                        }
                      })()}
                      <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Bid Management */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-[#CEA17A] mb-3">Bid Management</h3>
                <button 
                  onClick={handleUndoBid}
                  disabled={!recentBids || recentBids.length === 0 || !recentBids.some(bid => bid.is_winning_bid && !bid.is_undone) || bidLoading.undo}
                  className={`w-full px-4 py-2 rounded-lg transition-all duration-150 flex items-center justify-center ${
                    !recentBids || recentBids.length === 0 || !recentBids.some(bid => bid.is_winning_bid && !bid.is_undone) || bidLoading.undo
                      ? 'bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed'
                      : 'bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25'
                  }`}
                >
                  {bidLoading.undo ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Undoing...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Undo Bid
                    </>
                  )}
                </button>
                <button 
                  onClick={handleUndoPlayerAssignment}
                  disabled={!auctionTeams || auctionTeams.length === 0 || !auctionTeams.some(team => team.players_count > 0) || actionLoading.undoPlayerAssignment}
                  className={`w-full px-4 py-2 rounded-lg transition-all duration-150 flex items-center justify-center ${
                    !auctionTeams || auctionTeams.length === 0 || !auctionTeams.some(team => team.players_count > 0) || actionLoading.undoPlayerAssignment
                      ? 'bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25'
                  }`}
                >
                  {actionLoading.undoPlayerAssignment ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Undoing...
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Undo Player Assignment
                    </>
                  )}
                </button>
              </div>

              {/* Timer Control */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-[#CEA17A] mb-3">Timer Control</h3>
                <button className="w-full px-4 py-2 bg-green-500/15 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/25 transition-all duration-150 flex items-center justify-center">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Play/Pause Timer
                </button>
                <button className="w-full px-4 py-2 bg-blue-500/15 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/25 transition-all duration-150 flex items-center justify-center">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Change Auction Config
                </button>
              </div>

              {/* Auction Controls */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-[#CEA17A] mb-3">Auction Controls</h3>
                {(auction.status === 'draft' || auction.status === 'live' || auction.status === 'paused') && (
                  <button 
                    onClick={handleStartPauseAuction}
                    disabled={actionLoading.startPause}
                    className={`w-full px-4 py-2 border rounded-lg transition-all duration-150 flex items-center justify-center ${
                      actionLoading.startPause
                        ? 'bg-gray-500/10 text-gray-500 border-gray-500/20 cursor-not-allowed'
                        : auction.status === 'draft' 
                        ? 'bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25'
                        : auction.status === 'live'
                        ? 'bg-orange-500/15 text-orange-400 border-orange-500/30 hover:bg-orange-500/25'
                        : 'bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25'
                    }`}
                  >
                    {actionLoading.startPause ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : auction.status === 'draft' ? (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Start Auction
                      </>
                    ) : auction.status === 'live' ? (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pause Auction
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-6a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Resume Auction
                      </>
                    )}
                  </button>
                )}
                <button className="w-full px-4 py-2 bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/25 transition-all duration-150 flex items-center justify-center">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Auction
                </button>
                <button className="w-full px-4 py-2 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/25 transition-all duration-150 flex items-center justify-center">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel Auction
                </button>
                <button className="w-full px-4 py-2 bg-green-500/15 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/25 transition-all duration-150 flex items-center justify-center">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mark as Complete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current Player and Live Bids Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Current Player Card */}
          <div className="xl:col-span-1 bg-[#1a1a1a]/50 rounded-xl p-6 border border-[#CEA17A]/10">
            <h2 className="text-2xl font-bold text-[#DBD0C0] mb-6">Current Player</h2>
            
            {currentPlayer ? (
            <div className="space-y-6">
              {/* Inline notice for non-live or errors */}
              {uiNotice && (
                <div className={`rounded-lg px-4 py-3 border text-sm ${
                  uiNotice.type === 'error' 
                    ? 'bg-red-500/10 border-red-400/30 text-red-300' 
                    : 'bg-blue-500/10 border-blue-400/30 text-blue-300'
                }`}>
                  {uiNotice.message}
                </div>
              )}
                {/* Player Photo - Increased Size */}
                <div className="flex justify-center">
                  <div 
                    className="relative w-64 h-64 rounded-xl overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-105 shadow-lg"
                    onClick={() => handlePhotoClick(currentPlayer.profile_pic_url || '', currentPlayer.display_name)}
                  >
                    {currentPlayer.profile_pic_url ? (
                      <img
                        src={currentPlayer.profile_pic_url}
                        alt={currentPlayer.display_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#CEA17A]/20 to-[#CEA17A]/10 flex items-center justify-center">
                        <div className="text-8xl text-[#CEA17A]">
                          {currentPlayer.display_name?.charAt(0)?.toUpperCase() || '👤'}
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Player Info */}
                <div>
                  <h3 className="text-2xl font-bold text-[#DBD0C0] mb-2 text-center">{currentPlayer.display_name}</h3>
                  <div className="flex items-center justify-center gap-4 text-sm text-[#DBD0C0]/70">
                    <span>Player #{(() => {
                      // Calculate position among available players (excluding captains)
                      const availablePlayers = getAvailablePlayers()
                      const currentPlayerIndex = availablePlayers.findIndex(ap => ap.player_id === currentPlayer.player_id)
                      return currentPlayerIndex + 1
                    })()}</span>
                    <span>•</span>
                    <span className="capitalize">{currentPlayer.status}</span>
                    {currentPlayer.sold_price && (
                      <>
                        <span>•</span>
                        <span className="text-[#CEA17A] font-semibold">Sold for ₹{currentPlayer.sold_price}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Player Skills */}
                {currentPlayer.skills && Object.keys(currentPlayer.skills).length > 0 ? (
                  <div>
                    <h4 className="text-lg font-semibold text-[#CEA17A] mb-4">Player Skills</h4>
                    <div className="space-y-3">
                      {Object.entries(currentPlayer.skills).map(([skillName, skillValue]) => (
                        <div key={skillName} className="bg-[#19171b]/50 rounded-lg p-3 border border-[#CEA17A]/10">
                          <div className="text-sm font-medium text-[#CEA17A] mb-1">{skillName}</div>
                          <div className="text-[#DBD0C0]">
                            {Array.isArray(skillValue) ? (
                              <div className="flex flex-wrap gap-1">
                                {skillValue.map((value, index) => (
                                  <span 
                                    key={index}
                                    className="px-2 py-1 bg-[#CEA17A]/10 text-[#CEA17A] rounded text-xs"
                                  >
                                    {value}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm">{String(skillValue)}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-[#DBD0C0]/50 text-sm">No skills information available</div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-[#CEA17A] text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-[#DBD0C0] mb-2">No Current Player</h3>
                <p className="text-[#DBD0C0]/70">Auction hasn't started yet or no player is currently being auctioned</p>
              </div>
            )}
          </div>

          {/* Live Bids Card */}
          <div className="xl:col-span-2 bg-gradient-to-br from-[#1a1a1a]/80 to-[#0f0f0f]/80 rounded-xl p-6 border-2 border-[#CEA17A]/20 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#DBD0C0] flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                Live Bids
              </h2>
              <div className="text-sm text-[#DBD0C0]/70 bg-[#19171b]/50 px-3 py-1 rounded-full border border-[#CEA17A]/20">
                Real-time
              </div>
            </div>
            
            {currentPlayer ? (
              <div className="space-y-6">
                {/* Current Bid Info */}
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-gradient-to-br from-[#2a2a2a]/80 to-[#1a1a1a]/80 rounded-xl p-4 border-2 border-[#CEA17A]/20 shadow-lg">
                    <h3 className="text-lg font-semibold text-[#CEA17A] mb-3 flex items-center gap-2">
                      <span className="inline-block text-base leading-none">🔨</span>
                      Current Bid
                    </h3>
                    {getCurrentBid() === null ? (
                      <div className="text-sm text-[#DBD0C0]/70 italic">No bids yet</div>
                    ) : (
                      <>
                        <div className="text-3xl font-extrabold text-[#DBD0C0] mb-1">₹{getCurrentBid()}</div>
                        <div className="text-sm text-[#DBD0C0]/80 font-medium">
                          by {recentBids.find(bid => bid.is_winning_bid && !bid.is_undone)?.team_name || '—'}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#2a2a2a]/80 to-[#1a1a1a]/80 rounded-xl p-4 border-2 border-[#CEA17A]/20 shadow-lg">
                    <h3 className="text-lg font-semibold text-[#CEA17A] mb-3 flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Next Bid
                    </h3>
                    <div className="text-3xl font-extrabold text-[#DBD0C0] mb-1">₹{calculateNextBid(getCurrentBid() ?? undefined)}</div>
                    <div className="text-xs text-[#DBD0C0]/70 font-medium">
                      Min increment: ₹{auction?.min_increment || 20}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={handleSellPlayer}
                    disabled={!isAuctionLive || bidLoading.sell || !recentBids || recentBids.length === 0 || !recentBids.some(bid => bid.is_winning_bid && !bid.is_undone)}
                    className={`px-6 py-3 rounded-lg transition-all duration-150 flex items-center ${
                      !isAuctionLive || bidLoading.sell || !recentBids || recentBids.length === 0 || !recentBids.some(bid => bid.is_winning_bid && !bid.is_undone)
                        ? 'bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed'
                        : 'bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25'
                    }`}
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sell Player
                  </button>
                  
                  <button 
                    onClick={handleUndoBid}
                    disabled={!isAuctionLive || !recentBids || recentBids.length === 0 || bidLoading.undo}
                    className={`px-6 py-3 rounded-lg transition-all duration-150 flex items-center ${
                      !isAuctionLive || !recentBids || recentBids.length === 0 || bidLoading.undo
                        ? 'bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed'
                        : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/25'
                    }`}
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Undo Bid
                  </button>
                </div>

                {/* Captain Bids Section */}
                <div>
                  <h3 className="text-xl font-bold text-[#CEA17A] mb-6 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Captain Bids
                  </h3>
                  {auctionTeams.length === 0 && (
                    <div className="text-sm text-[#DBD0C0]/70 mb-3">No teams found for this auction.</div>
                  )}
                  <div className="grid grid-cols-1 gap-4">
                    {auctionTeams.map((team) => {
                      const nextBid = calculateNextBid()
                      const canAfford = team.remaining_purse >= nextBid
                      const isWinning = recentBids?.find(bid => bid.is_winning_bid && !bid.is_undone)?.team_id === team.id
                      
                      // Calculate remaining slots (required players + 1 captain - current players)
                      const remainingSlots = Math.max(0, (team.required_players) - team.players_count)
                      
                      // Calculate max possible bid (remaining purse - remaining slots * min bid)
                      const maxPossibleBid = team.remaining_purse - ((remainingSlots -1) * (auction?.min_bid_amount || 40))
                      
                      // Calculate balance after current bid
                      const balanceAfterBid = team.remaining_purse - nextBid
                      
                      return (
                        <div key={team.id} className="bg-gradient-to-br from-[#2a2a2a]/80 to-[#1a1a1a]/80 rounded-xl p-6 border-2 border-[#CEA17A]/20 shadow-lg">
                          <div className="mb-4">
                            <h4 className="text-lg font-bold text-[#CEA17A] mb-2">{team.team_name}</h4>
                            <div className="text-sm text-[#DBD0C0]/70">
                              Players: {team.players_count}/{team.required_players} • Remaining slots: {remainingSlots}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            {/* Card 1: Place Bid Button */}
                            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-lg p-4 border border-[#CEA17A]/20">
                              <h5 className="text-sm font-semibold text-[#CEA17A] mb-2">Place Bid</h5>
                              <button
                                onClick={() => handlePlaceBid(team.id, nextBid)}
                                disabled={!isAuctionLive || !canAfford || bidLoading[`bid_${team.id}`]}
                                className={`w-full py-3 px-4 rounded-lg font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                                  !isAuctionLive
                                    ? 'bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed'
                                    : isWinning
                                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-300 border border-green-400/40'
                                    : canAfford
                                    ? 'bg-gradient-to-r from-[#CEA17A]/20 to-[#CEA17A]/10 text-[#CEA17A] border border-[#CEA17A]/30 hover:bg-gradient-to-r hover:from-[#CEA17A]/30 hover:to-[#CEA17A]/20'
                                    : 'bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed'
                                }`}
                              >
                                ₹{nextBid}
                                {bidLoading[`bid_${team.id}`] && (
                                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                )}
                              </button>
                            </div>
                            
                            {/* Card 2: Remaining Purse */}
                            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-lg p-4 border border-[#CEA17A]/20">
                              <h5 className="text-sm font-semibold text-[#CEA17A] mb-2">Remaining Purse</h5>
                              <div className="text-2xl font-bold text-[#DBD0C0]">₹{team.remaining_purse}</div>
                              <div className="text-xs text-[#DBD0C0]/70 mt-1">
                                Total: ₹{team.remaining_purse + team.total_spent} • Spent: ₹{team.total_spent}
                              </div>
                            </div>
                            
                            {/* Card 3: Max Possible Bid */}
                            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-lg p-4 border border-[#CEA17A]/20">
                              <h5 className="text-sm font-semibold text-[#CEA17A] mb-2">Max Possible Bid</h5>
                              <div className="text-2xl font-bold text-[#DBD0C0]">₹{Math.max(0, maxPossibleBid)}</div>
                              <div className="text-xs text-[#DBD0C0]/70 mt-1">
                                Reserve: ₹{(remainingSlots -1) * (auction?.min_bid_amount || 40)} for {remainingSlots -1} slots
                              </div>
                            </div>
                            
                            {/* Card 4: Balance After Current Bid */}
                            <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-lg p-4 border border-[#CEA17A]/20">
                              <h5 className="text-sm font-semibold text-[#CEA17A] mb-2">Balance After Bid</h5>
                              <div className={`text-2xl font-bold ${balanceAfterBid >= 0 ? 'text-[#DBD0C0]' : 'text-red-400'}`}>
                                ₹{balanceAfterBid}
                              </div>
                              <div className="text-xs text-[#DBD0C0]/70 mt-1">
                                After bidding ₹{nextBid}
                              </div>
                            </div>
                          </div>
                          
                          {isWinning && (
                            <div className="mt-3 p-3 bg-gradient-to-r from-green-500/20 to-emerald-500/10 rounded-lg border border-green-400/40">
                              <div className="flex items-center gap-2 text-green-300">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-semibold">Currently Winning</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Recent Bids Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-[#CEA17A] flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Recent Bids
                    </h3>
                    <div className="text-sm text-[#DBD0C0]/70">
                      {recentBids?.length || 0} bids
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl p-6 border-2 border-[#CEA17A]/20 shadow-2xl max-h-80 overflow-y-auto">
                    {recentBids && recentBids.length > 0 ? (
                      <div className="space-y-3">
                        {getLatestBidsByCaptain().map((bid, index) => (
                          <div
                            key={bid.id}
                            className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-[1.02] ${
                              bid.is_winning_bid && !bid.is_undone
                                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-300 border-green-400/40 shadow-lg shadow-green-500/10'
                                : 'bg-gradient-to-r from-[#2a2a2a]/60 to-[#1a1a1a]/60 text-[#DBD0C0] border-[#CEA17A]/20 hover:border-[#CEA17A]/40'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-[#CEA17A]"></div>
                                  <div className="font-bold text-lg">{bid.team_name}</div>
                                </div>
                                {bid.is_winning_bid && !bid.is_undone && (
                                  <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-xs font-bold shadow-lg animate-pulse">
                                    🏆 WINNING
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-black text-[#CEA17A] mb-1">
                                  ₹{bid.bid_amount}
                                </div>
                                <div className="text-xs text-[#DBD0C0]/60 font-mono">
                                  {new Date(bid.timestamp).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit',
                                    hour12: true
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎯</div>
                        <div className="text-[#DBD0C0]/60 text-lg font-medium">No bids placed yet</div>
                        <div className="text-[#DBD0C0]/40 text-sm mt-2">Be the first to place a bid!</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-[#CEA17A] text-6xl mb-4">💰</div>
                <h3 className="text-xl font-semibold text-[#DBD0C0] mb-2">No Active Bidding</h3>
                <p className="text-[#DBD0C0]/70">Start the auction to begin bidding on players</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Formation */}
        <div className="bg-gradient-to-br from-[#1a1a1a]/80 to-[#0f0f0f]/80 rounded-xl p-6 border-2 border-[#CEA17A]/20 shadow-2xl mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#DBD0C0] flex items-center gap-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Team Formation
            </h2>
            <div className="text-sm text-[#DBD0C0]/70 bg-[#19171b]/50 px-3 py-1 rounded-full border border-[#CEA17A]/20">
              {auctionTeams.length} Teams
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {auctionTeams.map((team) => {
              // Get players for this team (both sold players and captain)
              // Note: sold_to field contains team_id (even though schema suggests it should be player_id)
              const soldPlayers = auctionPlayers?.filter(ap => ap.sold_to === team.id) || []
              const captainPlayer = auctionPlayers?.find(ap => ap.player_id === team.captain_id) || null
              
              // Combine captain and sold players
              const teamPlayers = captainPlayer ? [captainPlayer, ...soldPlayers] : soldPlayers
              
              return (
                <div key={team.id} className="bg-gradient-to-br from-[#2a2a2a]/80 to-[#1a1a1a]/80 rounded-xl p-6 border-2 border-[#CEA17A]/20 shadow-lg">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-[#CEA17A] mb-2">{team.team_name}</h3>
                    <div className="text-sm text-[#DBD0C0]/70">
                      Players: {teamPlayers.length}/{team.required_players} • Purse: ₹{team.remaining_purse}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {teamPlayers.length > 0 ? (
                      teamPlayers.map((auctionPlayer) => {
                        const player = players.find(p => p.id === auctionPlayer.player_id)
                        if (!player) return null
                        
                        return (
                          <div key={auctionPlayer.player_id} className="bg-gradient-to-r from-[#1a1a1a] to-[#0f0f0f] rounded-lg p-4 border border-[#CEA17A]/20 flex items-center gap-4">
                            {/* Player Photo */}
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[#CEA17A]/30 flex-shrink-0">
                              {player.profile_pic_url ? (
                                <img 
                                  src={player.profile_pic_url} 
                                  alt={player.display_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#CEA17A]/20 to-[#CEA17A]/10 flex items-center justify-center">
                                  <div className="text-lg text-[#CEA17A] font-bold">
                                    {player.display_name?.charAt(0)?.toUpperCase() || '👤'}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Player Info */}
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-[#DBD0C0] text-sm truncate">{player.display_name}</div>
                              <div className="flex items-center gap-2 mt-1">
                                {/* Role Emojis */}
                                <div className="flex items-center gap-1">
                                  {player.skills?.Role && (
                                    <div className="flex items-center gap-1">
                                      {Array.isArray(player.skills.Role) ? (
                                        player.skills.Role.map((role, index) => (
                                          <span key={index} className="text-xs bg-[#CEA17A]/20 text-[#CEA17A] px-2 py-1 rounded">
                                            {role === 'Batsman' || role === 'Batter' ? '🏏' : 
                                             role === 'Bowler' ? '⚾' : 
                                             role === 'All Rounder' ? '🎯' : 
                                             role === 'Wicket Keeper' ? '🧤' : '👤'}
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-xs bg-[#CEA17A]/20 text-[#CEA17A] px-2 py-1 rounded">
                                          {player.skills.Role === 'Batsman' || player.skills.Role === 'Batter' ? '🏏' : 
                                           player.skills.Role === 'Bowler' ? '⚾' : 
                                           player.skills.Role === 'All Rounder' ? '🎯' : 
                                           player.skills.Role === 'Wicket Keeper' ? '🧤' : '👤'}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                  {player.skills?.["Batting Style"] && (
                                    <span className="text-xs bg-[#CEA17A]/10 text-[#CEA17A]/80 px-2 py-1 rounded">
                                      {player.skills["Batting Style"]}
                                    </span>
                                  )}
                                  {player.skills?.["Bowling Style"] && (
                                    <span className="text-xs bg-[#CEA17A]/10 text-[#CEA17A]/80 px-2 py-1 rounded">
                                      {player.skills["Bowling Style"]}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Price */}
                            <div className="text-right flex-shrink-0">
                              <div className="text-lg font-bold text-[#CEA17A]">
                                ₹{auctionPlayer.player_id === team.captain_id ? 0 : (auctionPlayer.sold_price || 0)}
                              </div>
                              <div className="text-xs text-[#DBD0C0]/60">
                                {auctionPlayer.player_id === team.captain_id ? 'Captain' : 'Purchased'}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">👥</div>
                        <div className="text-[#DBD0C0]/60 text-sm">No players yet</div>
                        <div className="text-[#DBD0C0]/40 text-xs mt-1">Waiting for auction to start</div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Auction Overview */}
        <div className="bg-[#1a1a1a]/50 rounded-xl p-6 border border-[#CEA17A]/10 mb-8">
          <h2 className="text-2xl font-bold text-[#DBD0C0] mb-6">Auction Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#19171b]/50 rounded-lg p-4 border border-[#CEA17A]/10">
              <h3 className="text-sm font-medium text-[#CEA17A] mb-2">Tournament</h3>
              <p className="text-lg font-semibold text-[#DBD0C0]">{auction.tournament_name}</p>
              <p className="text-sm text-[#DBD0C0]/70">{auction.tournament_format}</p>
            </div>
            
            <div className="bg-[#19171b]/50 rounded-lg p-4 border border-[#CEA17A]/10">
              <h3 className="text-sm font-medium text-[#CEA17A] mb-2">Teams</h3>
              <p className="text-2xl font-bold text-[#DBD0C0]">{auctionTeams.length}</p>
              <p className="text-sm text-[#DBD0C0]/70">Participating</p>
            </div>
            
            <div className="bg-[#19171b]/50 rounded-lg p-4 border border-[#CEA17A]/10">
              <h3 className="text-sm font-medium text-[#CEA17A] mb-2">Players</h3>
              <p className="text-2xl font-bold text-[#DBD0C0]">{auctionPlayers.length}</p>
              <p className="text-sm text-[#DBD0C0]/70">Available</p>
            </div>
            
            <div className="bg-[#19171b]/50 rounded-lg p-4 border border-[#CEA17A]/10">
              <h3 className="text-sm font-medium text-[#CEA17A] mb-2">Min Bid</h3>
              <p className="text-2xl font-bold text-[#DBD0C0]">₹{auction.min_bid_amount}</p>
              <p className="text-sm text-[#DBD0C0]/70">Starting Price</p>
            </div>
          </div>
        </div>

        {/* Auction Configuration */}
        <div className="bg-[#1a1a1a]/50 rounded-xl p-6 border border-[#CEA17A]/10 mb-8">
          <h2 className="text-2xl font-bold text-[#DBD0C0] mb-6">Auction Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-[#19171b]/50 rounded-lg p-4 border border-[#CEA17A]/10">
              <h3 className="text-sm font-medium text-[#CEA17A] mb-2">Max Tokens per Captain</h3>
              <p className="text-lg font-semibold text-[#DBD0C0]">₹{auction.max_tokens_per_captain}</p>
            </div>
            
            <div className="bg-[#19171b]/50 rounded-lg p-4 border border-[#CEA17A]/10">
              <h3 className="text-sm font-medium text-[#CEA17A] mb-2">Use Base Price</h3>
              <p className="text-lg font-semibold text-[#DBD0C0]">{auction.use_base_price ? 'Yes' : 'No'}</p>
            </div>
            
            <div className="bg-[#19171b]/50 rounded-lg p-4 border border-[#CEA17A]/10">
              <h3 className="text-sm font-medium text-[#CEA17A] mb-2">Min Increment</h3>
              <p className="text-lg font-semibold text-[#DBD0C0]">₹{auction.min_increment}</p>
            </div>
            
            <div className="bg-[#19171b]/50 rounded-lg p-4 border border-[#CEA17A]/10">
              <h3 className="text-sm font-medium text-[#CEA17A] mb-2">Fixed Increments</h3>
              <p className="text-lg font-semibold text-[#DBD0C0]">{auction.use_fixed_increments ? 'Yes' : 'No'}</p>
            </div>
            
            <div className="bg-[#19171b]/50 rounded-lg p-4 border border-[#CEA17A]/10">
              <h3 className="text-sm font-medium text-[#CEA17A] mb-2">Timer</h3>
              <p className="text-lg font-semibold text-[#DBD0C0]">{auction.timer_seconds}s</p>
            </div>
            
            <div className="bg-[#19171b]/50 rounded-lg p-4 border border-[#CEA17A]/10">
              <h3 className="text-sm font-medium text-[#CEA17A] mb-2">Player Order</h3>
              <p className="text-lg font-semibold text-[#DBD0C0]">
                {auction.player_order_type === 'base_price_desc' && 'Base Price (High to Low)'}
                {auction.player_order_type === 'base_price_asc' && 'Base Price (Low to High)'}
                {auction.player_order_type === 'alphabetical' && 'Alphabetical (A to Z)'}
                {auction.player_order_type === 'alphabetical_desc' && 'Alphabetical (Z to A)'}
                {auction.player_order_type === 'random' && 'Random Order'}
              </p>
            </div>
          </div>
        </div>

        {/* Teams */}
        <div className="bg-[#1a1a1a]/50 rounded-xl p-6 border border-[#CEA17A]/10 mb-8">
          <h2 className="text-2xl font-bold text-[#DBD0C0] mb-6">Teams ({auctionTeams.length})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {auctionTeams.map((team) => (
              <div key={team.id} className="bg-[#19171b]/50 rounded-lg p-4 border border-[#CEA17A]/10">
                <h3 className="text-lg font-semibold text-[#DBD0C0] mb-2">{team.team_name}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#DBD0C0]/70">Remaining Purse:</span>
                    <span className="text-[#CEA17A] font-semibold">₹{team.remaining_purse}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#DBD0C0]/70">Total Spent:</span>
                    <span className="text-[#DBD0C0]">₹{team.total_spent}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Players */}
        <div className="bg-[#1a1a1a]/50 rounded-xl p-6 border border-[#CEA17A]/10">
          <h2 className="text-2xl font-bold text-[#DBD0C0] mb-6">Players ({auctionPlayers.length})</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {players.map((player) => {
              const auctionPlayer = auctionPlayers.find(ap => ap.player_id === player.id)
              const role = player.skills?.Role;
              const basePrice = player.skills?.["Base Price"];
              const battingStyle = player.skills?.["Batting Style"];
              const bowlingStyle = player.skills?.["Bowling Style"];
              
              // Get role emoji
              const getRoleEmoji = (role: string | string[] | undefined) => {
                if (!role) return "❓";
                const roleStr = Array.isArray(role) ? role.join(', ') : role;
                if (roleStr.toLowerCase().includes('batter') && roleStr.toLowerCase().includes('bowler')) return "🏏⚾";
                if (roleStr.toLowerCase().includes('batter')) return "🏏";
                if (roleStr.toLowerCase().includes('bowler')) return "⚾";
                if (roleStr.toLowerCase().includes('wicket')) return "🧤";
                if (roleStr.toLowerCase().includes('all')) return "🌟";
                return "❓";
              };

              return (
                <div key={player.id} className="bg-[#19171b]/50 rounded-lg p-4 border border-[#CEA17A]/10">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      {player.profile_pic_url ? (
                        <img
                          src={player.profile_pic_url}
                          alt={player.display_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `<div class="w-full h-full bg-[#CEA17A]/20 flex items-center justify-center"><span class="text-[#CEA17A] font-bold text-sm">${player.display_name.charAt(0).toUpperCase()}</span></div>`;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-[#CEA17A]/20 flex items-center justify-center">
                          <span className="text-[#CEA17A] font-bold text-sm">
                            {player.display_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="text-[#DBD0C0] font-medium truncate">{player.display_name}</h3>
                      <div className="flex items-center space-x-2 text-xs text-[#DBD0C0]/70">
                        <span>{getRoleEmoji(role)}</span>
                        {basePrice && <span>₹{basePrice}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-xs text-[#DBD0C0]/70">
                    {battingStyle && <div>Bat: {battingStyle}</div>}
                    {bowlingStyle && <div>Bowl: {bowlingStyle}</div>}
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-[#CEA17A]/10">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#DBD0C0]/70">Status:</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        auctionPlayer?.status === 'available' ? 'bg-green-400/10 text-green-400' :
                        auctionPlayer?.status === 'sold' ? 'bg-blue-400/10 text-blue-400' :
                        'bg-gray-400/10 text-gray-400'
                      }`}>
                        {auctionPlayer?.status || 'Unknown'}
                      </span>
                    </div>
                    {auctionPlayer?.sold_price && (
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-[#DBD0C0]/70">Sold for:</span>
                        <span className="text-xs text-[#CEA17A] font-semibold">₹{auctionPlayer.sold_price}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        </div>
      </div>

      {/* Photo Preview Dialog */}
      {photoPreview.isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={handleClosePhotoPreview}
        >
          <div 
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleClosePhotoPreview}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors duration-200"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Photo */}
            <img
              src={photoPreview.src}
              alt={photoPreview.alt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            
            {/* Player name overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 rounded-b-lg">
              <h3 className="text-white text-xl font-semibold text-center">
                {photoPreview.alt}
              </h3>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
