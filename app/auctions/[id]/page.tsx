'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { getSupabaseClient } from '@/src/lib/supabaseClient'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { secureSessionManager } from '@/src/lib/secure-session'
import { interpretError } from '@/src/lib/error-codes'

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
  bio?: string
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
  const [isGlobalBidLoading, setIsGlobalBidLoading] = useState(false)
  const [isPlayerTransitioning, setIsPlayerTransitioning] = useState(false)
  // Central interaction lock: when true, all critical actions (navigation, sell, undo, bidding) should be disabled.
  const isInteractionLocked = isPlayerTransitioning || isGlobalBidLoading || Object.values(actionLoading).some(v => v)

  // Helpers to begin/end a guarded player transition (avoid duplicate spinners & racey unlocks)
  const transitionTokenRef = useRef<number | null>(null)
  const beginPlayerTransition = (reason?: string) => {
    // Only set if not already transitioning; keep a token to ensure end matches begin
    if (!isPlayerTransitioning) {
      transitionTokenRef.current = Date.now()
      setIsPlayerTransitioning(true)
    }
  }
  const endPlayerTransition = (token?: number) => {
    // If a token is supplied ensure it matches; else allow unconditional end after a short debounce to smooth UI
    if (token && transitionTokenRef.current && token !== transitionTokenRef.current) return
    transitionTokenRef.current = null
    // Small timeout to let inbound realtime updates settle before hiding overlay
    setTimeout(() => setIsPlayerTransitioning(false), 120)
  }
  // Per-team transient bid input (no prefilled ladder). null means unopened.
  const [selectedBidAmounts, setSelectedBidAmounts] = useState<Record<string, number | null>>({})
  const [openBidPopover, setOpenBidPopover] = useState<string | null>(null)
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
  const [uiNotice, setUiNotice] = useState<{ type: 'error' | 'info' | 'warning'; message: string } | null>(null)
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message: string; severity: 'info'|'warning'|'error'; actions?: Array<{label: string; onClick: () => void}> }>>([])
  const addToast = useCallback((t: Omit<(typeof toasts)[number], 'id'>) => { setToasts(prev => [...prev, { id: Math.random().toString(36).slice(2), ...t }]) }, [])
  const autoRetryRef = useRef<number>(0)
  const removeToast = useCallback((id: string) => setToasts(prev => prev.filter(to => to.id !== id)), [])
  const bidPerfRef = useRef<{ send?: number; optimistic?: number; confirm?: number; player_id?: string }>({})
  const inFlightBidRef = useRef(false)
  const lastConflictRef = useRef<number | null>(null)
  const [lastLatencySample, setLastLatencySample] = useState<{ optimistic: number; confirm: number } | null>(null)
  const [viewingUnsoldPlayers, setViewingUnsoldPlayers] = useState(false)
  const [showHostActions, setShowHostActions] = useState(false)
  // Mobile-specific UI state
  const [mobilePurseTeamId, setMobilePurseTeamId] = useState<string | null>(null)
  const [showHostActionsMobile, setShowHostActionsMobile] = useState(false)
  // Extended modal / mobile UI state
  const [formationTeamModalId, setFormationTeamModalId] = useState<string | null>(null)
  const [showRemainingPlayersMobile, setShowRemainingPlayersMobile] = useState(false)

  // Auto-dismiss UI notice after a short delay
  useEffect(() => {
    if (!uiNotice) return
    const timeoutId = setTimeout(() => setUiNotice(null), 3500)
    return () => clearTimeout(timeoutId)
  }, [uiNotice])

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

  // Fetch bid history stabilized against player switch / race conditions
  const fetchBidHistory = async (explicitPlayerId?: string) => {
    const activePlayerId = explicitPlayerId || currentPlayerRef.current?.player_id
    if (!activePlayerId) {
      setRecentBids([])
      return
    }
    const requestMarker = activePlayerId + ':' + Date.now()
    try {
      const response = await fetch(`/api/auctions/${auctionId}/bids?player_id=${activePlayerId}`)
      if (!response.ok) return
      const data = await response.json()
      // If current player changed during fetch, discard stale result
      if (currentPlayerRef.current?.player_id !== activePlayerId) return
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
      setRecentBids(prev => {
        // If we already optimistically inserted bids for same player, merge instead of blunt replace to avoid flicker
        if (prev.length && prev[0].player_id === activePlayerId) {
          const existingIds = new Set(formattedBids.map((b: any)=>b.id))
          const merged = formattedBids.concat(prev.filter((b: any)=> !existingIds.has(b.id)))
          return merged.sort((a: any,b: any)=> new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        }
        return formattedBids
      })
    } catch (error) {
      console.error('Error fetching bid history:', error)
    }
  }

  // Get latest bids by each captain
  const getLatestBidsByCaptain = useCallback(() => {
    if (!recentBids.length) return []
    const latestBidsByTeam = recentBids.reduce((acc, bid) => {
      if (!acc[bid.team_id] || new Date(bid.timestamp) > new Date(acc[bid.team_id].timestamp)) {
        acc[bid.team_id] = bid
      }
      return acc
    }, {} as Record<string, typeof recentBids[0]>)
    return Object.values(latestBidsByTeam).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [recentBids])
  const latestBidsMemo = useMemo(() => getLatestBidsByCaptain(), [getLatestBidsByCaptain])

  // Refs to hold latest collections for stable realtime subscription closures
  const playersRef = useRef(players)
  useEffect(() => { playersRef.current = players }, [players])
  const auctionPlayersRef = useRef(auctionPlayers)
  useEffect(() => { auctionPlayersRef.current = auctionPlayers }, [auctionPlayers])
  const currentPlayerRef = useRef(currentPlayer)
  useEffect(() => { currentPlayerRef.current = currentPlayer }, [currentPlayer])

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

  // Get increment for a given bid (used for generating multiple future options respecting ranges)
  const getIncrementForBid = (bidAmount: number) => {
    if (!auction) return 0
    if (auction.use_fixed_increments) return auction.min_increment
    const customRanges = auction.auction_config?.custom_increment_ranges
    if (customRanges) {
      if (bidAmount <= 200) return customRanges.range_0_200 || 20
      if (bidAmount <= 500) return customRanges.range_200_500 || 50
      return customRanges.range_500_plus || 100
    }
    return auction.min_increment
  }

  // Validate a user-entered bid for a team against increments, affordability and slot reservation.
  const validateCustomBid = (team: AuctionTeam, rawAmount: number | null) => {
    if (!auction || !currentPlayer) return { valid: false, reason: 'Auction/player unavailable' }
    if (rawAmount == null || isNaN(rawAmount)) return { valid: false, reason: 'Enter amount' }
    const amount = Math.floor(rawAmount)
    if (amount <= 0) return { valid: false, reason: 'Bid must be > 0' }
    // Determine reference (current winning bid or starting).
    const current = getCurrentBid()
    const startingBid = calculateNextBid(current == null ? undefined : current) // next required bid
    if (amount < startingBid) return { valid: false, reason: `Min allowed ₹${startingBid}` }
    // Increment chain validation: ensure difference from base matches dynamic increments progression.
    // We simulate stepping from startingBid until >= amount.
    let probe = startingBid
    while (probe < amount) {
      probe += getIncrementForBid(probe)
      if (probe > amount) return { valid: false, reason: 'Invalid increment' }
    }
    // Slots & reserve constraint
    const totalSlotsIncludingCaptain = team.required_players
    const filledSlotsIncludingCaptain = (team.players_count || 0) + 1
    const remainingSlotsExcludingCurrent = Math.max(0, totalSlotsIncludingCaptain - filledSlotsIncludingCaptain)
    if (remainingSlotsExcludingCurrent <= 0) return { valid: false, reason: 'No slots left' }
    const remainingSlotsAfterPurchase = Math.max(0, remainingSlotsExcludingCurrent - 1)
    const minPerSlot = auction.min_bid_amount || 40
    const reserveNeeded = remainingSlotsAfterPurchase * minPerSlot
    const maxPossibleBid = team.remaining_purse - reserveNeeded
    if (amount > maxPossibleBid) return { valid: false, reason: `Exceeds max possible ₹${maxPossibleBid}` }
    if (amount > team.remaining_purse) return { valid: false, reason: 'Insufficient purse' }
    return { valid: true, reason: '' }
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

  // Handle placing a bid (with retry + perf instrumentation)
  const handlePlaceBid = async (teamId: string, bidAmount: number) => {
    if (isInteractionLocked) return
    if (!auction || !user) return
    if (auction.status !== 'live') {
      setUiNotice({ type: 'error', message: `Cannot place bids. Auction is currently ${auction.status}. Start the auction to enable bidding.` })
      return
    }
    // Prevent overlapping submissions which can cascade 409s
    if (inFlightBidRef.current) return
    inFlightBidRef.current = true
    setIsGlobalBidLoading(true)
    setBidLoading(prev => ({ ...prev, [`bid_${teamId}`]: true }))
    try {
      const token = secureSessionManager.getToken()
      if (!token) { addToast({ title: 'Auth', message: 'Authentication required to place bid', severity: 'error' }); return }
      bidPerfRef.current = { send: performance.now(), player_id: currentPlayer?.player_id }
      const response = await fetch(`/api/auctions/${auctionId}/bids`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_id: teamId, bid_amount: bidAmount, player_id: currentPlayer?.player_id })
      })
      if (response.ok) {
        const data = await response.json()
        setRecentBids(prev => [
          { id: data.bid.id, team_id: teamId, team_name: auctionTeams.find(t=>t.id===teamId)?.team_name || 'Unknown', bid_amount: bidAmount, timestamp: new Date().toISOString(), player_id: currentPlayer?.player_id, is_winning_bid: true, is_undone: false },
          ...prev.map(b=> b.player_id===currentPlayer?.player_id ? { ...b, is_winning_bid: false } : b)
        ])
        bidPerfRef.current.optimistic = performance.now()
        // Reset conflict tracking on success
        lastConflictRef.current = null
      } else {
        const errorData = await response.json().catch(()=>({}))
        const code = errorData.code as string | undefined
        const meta = interpretError(code)
        if (code === 'BID_OUTDATED') {
          // Immediately fetch the latest bid history to update the UI for all users.
          await fetchBidHistory()
          // After fetching, get the new current bid to inform the user.
          const latestBid = getCurrentBid()
          addToast({
            title: meta.title,
            message: meta.message({ latestAmount: latestBid }),
            severity: meta.severity,
            actions: [
              { 
                label: 'Bid Next', 
                onClick: () => { 
                  // Re-calculate the next valid bid based on the fresh state and place it.
                  const current = getCurrentBid(); 
                  const next = calculateNextBid(current ?? undefined); 
                  handlePlaceBid(teamId, next) 
                } 
              },
              { label: 'Dismiss', onClick: () => {} }
            ]
          })
        } else {
          addToast({ title: meta.title, message: meta.message({ raw: errorData.error }), severity: meta.severity })
        }
      }
    } catch (error) {
      console.error('Error placing bid:', error)
      addToast({ title: 'Network', message: 'Failed to place bid. Please try again.', severity: 'error' })
    } finally {
      setBidLoading(prev => ({ ...prev, [`bid_${teamId}`]: false }))
      setIsGlobalBidLoading(false)
      inFlightBidRef.current = false
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
    
    setActionLoading(prev => ({ ...prev, undoBid: true }))
    
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
      setActionLoading(prev => ({ ...prev, undoBid: false }))
    }
  }

  const handleUndoPlayerAssignment = async () => {
    if (isInteractionLocked) return
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
  beginPlayerTransition('undo-player-assignment')
    
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
        const json = await response.json().catch(()=>null)
        const undoneName = json?.data?.player_name || 'Player'
        setUiNotice({ type: 'info', message: `${undoneName} is now available again` })
        // The realtime subscription will handle updating player, team, and bid state.
        // No manual refetch is needed here.
      } else {
        const errorData = await response.json()
        setUiNotice({ type: 'error', message: `Failed to undo player assignment: ${errorData.error || 'Unknown error'}` })
      }
    } catch (error) {
      console.error('Error undoing player assignment:', error)
      setUiNotice({ type: 'error', message: 'Failed to undo player assignment. Please try again.' })
    } finally {
      setActionLoading(prev => ({ ...prev, undoPlayerAssignment: false }))
      endPlayerTransition()
    }
  }

  // Handle selling player
  const handleSellPlayer = async () => {
    if (isInteractionLocked) return
    if (!auction || !currentPlayer || !recentBids || recentBids.length === 0) return
    
    // Check if auction is in live status
    if (auction.status !== 'live') {
      setUiNotice({ type: 'error', message: `Cannot sell player. Auction is currently ${auction.status}. Start the auction to enable actions.` })
      return
    }
    
  setActionLoading(prev => ({ ...prev, sellPlayer: true }))
  beginPlayerTransition('sell-player')
    
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

            // Update auction players state to mark next player as current
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
      setActionLoading(prev => ({ ...prev, sellPlayer: false }))
      endPlayerTransition()
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
    if (isInteractionLocked) return
    if (!auction || !user || !currentPlayer) return
    
    setActionLoading(prev => ({ ...prev, nextPlayer: true }))
    beginPlayerTransition('next-player')
    
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
              // State will be updated by the realtime subscription.
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
          // State will be updated by the realtime subscription.
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
    if (isInteractionLocked) return
    if (!auction || !user || !currentPlayer) return
    
    setActionLoading(prev => ({ ...prev, previousPlayer: true }))
    beginPlayerTransition('previous-player')
    
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
          // State will be updated by the realtime subscription.
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
    if (isInteractionLocked) return
    if (!auction || !user) return
    
    setActionLoading(prev => ({ ...prev, startPause: true }))
    beginPlayerTransition('start-pause')
    
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
      endPlayerTransition()
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

  // Set / update current player when underlying collections change.
  // Avoid flashing to the first available player during the brief window between
  // clearing the old current_player flag and setting the new one (sell/undo/navigation).
  useEffect(() => {
    if (!auction) return
    if (players.length === 0 || auctionPlayers.length === 0) return
    const captainIds = (auctionTeams || []).map(t => t.captain_id)
    const cpRow = auctionPlayers.find(ap => ap.current_player && !captainIds.includes(ap.player_id))
    if (cpRow) {
      // Found an authoritative current player row
      const pl = players.find(p => p.id === cpRow.player_id)
      if (pl) {
        // Only update if different to avoid unnecessary re-renders
        if (!currentPlayer || currentPlayer.player_id !== cpRow.player_id || currentPlayer.current_player !== cpRow.current_player) {
          setCurrentPlayer({ ...pl, ...cpRow })
        }
      }
    } else if (!currentPlayer) {
      // Initial load fallback ONLY (do not override during transitions)
      const first = auctionPlayers
        .filter(ap => ap.status === 'available' && !captainIds.includes(ap.player_id))
        .sort((a, b) => a.display_order - b.display_order)[0]
      if (first) {
        const pl = players.find(p => p.id === first.player_id)
        if (pl) setCurrentPlayer({ ...pl, ...first })
      }
    }
  }, [auction, players, auctionPlayers, auctionTeams, currentPlayer])

  // Fetch bid history when current player changes
  useEffect(() => {
    if (currentPlayer) fetchBidHistory(currentPlayer.player_id)
  }, [currentPlayer])

  // Realtime subscription (with latency confirmation metrics) - stable deps to avoid resubscribe thrash
  useEffect(() => {
    if (!auction?.id) return
    const supabase = getSupabaseClient()

    const bidsChannel = supabase.channel(`auction-bids-${auction.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_bids', filter: `auction_id=eq.${auction.id}` }, (payload: any) => {
        const cp = currentPlayerRef.current
        if (cp && payload.new.player_id === cp.player_id) {
          fetchBidHistory().then(() => {
            if (bidPerfRef.current.player_id === cp.player_id && bidPerfRef.current.optimistic) {
              bidPerfRef.current.confirm = performance.now()
              const optimistic = bidPerfRef.current.optimistic - (bidPerfRef.current.send || bidPerfRef.current.optimistic)
              const confirm = bidPerfRef.current.confirm - (bidPerfRef.current.send || bidPerfRef.current.confirm)
              setLastLatencySample({ optimistic: Math.round(optimistic), confirm: Math.round(confirm) })
            }
          })
        }
      })
      .subscribe()

    const auctionChannel = supabase.channel(`auction-status-${auction.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auctions', filter: `id=eq.${auction.id}` }, (payload: any) => {
        if (payload.new) {
          setAuction((prev:any) => prev ? { ...prev, ...payload.new } : payload.new)
        }
      })
      .subscribe()

    const playersChannel = supabase.channel(`auction-players-${auction.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_players', filter: `auction_id=eq.${auction.id}` }, (payload: any) => {
        setAuctionPlayers(prev => {
          const idx = prev.findIndex(p => p.id === payload.new.id)
          if (idx === -1) {
            // Defensive: unseen row (shouldn't happen on update) -> ignore
            return prev
          }
            const updated = [...prev]
            updated[idx] = { ...updated[idx], ...payload.new }
            return updated
        })
        if (payload.new.current_player) {
          const pl = playersRef.current.find(p => p.id === payload.new.player_id)
          if (pl) {
            setCurrentPlayer({ ...pl, ...payload.new })
            endPlayerTransition()
            fetchBidHistory()
          }
        } else {
          const cpRef = currentPlayerRef.current
          if (cpRef && payload.new.player_id === cpRef.player_id && !payload.new.current_player) {
            // Previous current cleared; wait briefly for next current flag update
            beginPlayerTransition('await-next-current')
            setTimeout(() => {
              const apList = auctionPlayersRef.current
              const nextCp = apList.find(ap => ap.current_player)
              if (nextCp) {
                const pl = playersRef.current.find(p => p.id === nextCp.player_id)
                if (pl) {
                  setCurrentPlayer({ ...pl, ...nextCp })
                  endPlayerTransition()
                  fetchBidHistory()
                }
              }
            }, 120)
          }
        }
      })
      .subscribe()

    const teamsChannel = supabase.channel(`auction-teams-${auction.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_teams', filter: `auction_id=eq.${auction.id}` }, (payload: any) => {
        setAuctionTeams(prev => {
          const idx = prev.findIndex(t => t.id === payload.new.id)
          if (idx === -1) return prev
          const updated = [...prev]
          updated[idx] = { ...updated[idx], ...payload.new }
          return updated
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(bidsChannel)
      supabase.removeChannel(auctionChannel)
      supabase.removeChannel(playersChannel)
      supabase.removeChannel(teamsChannel)
    }
  }, [auction?.id])

  // Auto-dismiss toasts
  useEffect(() => {
    if (!toasts.length) return
    const timers = toasts.map(t => setTimeout(() => removeToast(t.id), 5000))
    return () => { timers.forEach(clearTimeout) }
  }, [toasts, removeToast])

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

  // Helper: unified role -> emoji mapping
  const mapRoleToEmoji = (role: string) => {
    const r = role.toLowerCase()
    if (r.includes('batter') || r.includes('batsman')) return '🏏'
    if (r.includes('bowler')) return '🎾'
    if (r.includes('wicket')) return '🧤'
    if (r.includes('all')) return '🎯'
    return '👤'
  }

  const getPlayerRoleEmojis = (player: any): string => {
    if (!player?.skills?.Role) return ''
    const val = player.skills.Role
    if (Array.isArray(val)) return val.map(mapRoleToEmoji).join('')
    return mapRoleToEmoji(String(val))
  }

  // Authorization helpers (computed once per render after auction & user are known)
  const isAdmin = userProfile?.role === 'admin'
  const isHostCreator = userProfile?.role === 'host' && auction?.created_by === user?.id
  const isAuctionController = !!(isAdmin || isHostCreator)

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
  <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#CEA17A] to-transparent motion-safe:animate-pulse"></div>
  <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#CEA17A] to-transparent motion-safe:animate-pulse" style={{animationDelay: '1s'}}></div>
  <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-[#CEA17A] to-transparent motion-safe:animate-pulse" style={{animationDelay: '0.5s'}}></div>
  <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[#CEA17A] to-transparent motion-safe:animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>
      
      {/* Background Glowing Orbs - Behind Content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
  <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#CEA17A]/5 rounded-full blur-3xl motion-safe:animate-pulse" style={{animationDelay: '0s'}}></div>
  <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#75020f]/5 rounded-full blur-3xl motion-safe:animate-pulse" style={{animationDelay: '2s'}}></div>
  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#CEA17A]/3 rounded-full blur-3xl motion-safe:animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>
      
  {/* Desktop / Tablet layout (md and up) */}
  <div className="hidden md:flex relative z-10 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 min-h-screen flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0 flex-shrink-0">
          <div className="flex items-center space-x-4">
            
            <div className="pb-6">
              <h1 className="text-4xl font-bold text-[#DBD0C0]">
                {auction.tournament_name || 'Auction'}
              </h1>
            </div>
            <div className="h-6 w-px bg-[#CEA17A]/20"></div>
            <Link 
              href="/auctions"
              className="inline-flex items-center px-3 py-2 text-[#CEA17A] hover:text-[#CEA17A]/80 transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Auctions
            </Link>
          </div>
          
          
          <div className="flex items-center space-x-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(auction.status)}`}>
              {getStatusText(auction.status)}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow w-full">
        {/* Host / Admin Actions - only if user is auction controller (admin or creating host) */}
        {isAuctionController && (
          <div className="bg-[#1a1a1a]/50 rounded-xl p-6 border border-[#CEA17A]/10 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#DBD0C0]">Auction Controls</h2>
                <button 
                onClick={() => setShowHostActions(v => !v)}
                className="px-3 py-1 rounded-md border border-[#CEA17A]/30 text-[#CEA17A] bg-[#CEA17A]/10 hover:bg-[#CEA17A]/20 transition"
                aria-expanded={showHostActions}
                aria-controls="host-actions-body"
              >
                {showHostActions ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/></svg>
                  
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                    
                  </span>
                  )}
                </button>
              </div>
            {/* Single-row horizontal scroll container for action buttons */}
            {showHostActions && (
            <div id="host-actions-body" className="space-y-3">
              {/* Responsive grid ensures equal-sized buttons spanning full card width */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {(auction.status === 'draft' || auction.status === 'live' || auction.status === 'paused') && (
                  <button 
                    onClick={handleStartPauseAuction}
                    disabled={isInteractionLocked || actionLoading.startPause}
                    className={`w-full px-4 py-2 border rounded-lg transition-all duration-150 flex items-center justify-center ${
                      isInteractionLocked || actionLoading.startPause
                        ? 'bg-gray-500/10 text-gray-500 border-gray-500/20 cursor-not-allowed'
                        : 'bg-[#CEA17A]/15 text-[#CEA17A] border-[#CEA17A]/30 hover:bg-[#CEA17A]/25'
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

                {/* Change Auction Config (moved up, nav-style) */}
                <button className="w-full px-4 py-2 border rounded-lg transition-all duration-150 flex items-center justify-center bg-[#CEA17A]/15 text-[#CEA17A] border-[#CEA17A]/30 hover:bg-[#CEA17A]/25">
                  <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7zm7.94-2a1 1 0 0 0 .09-2l-2.12-.18a7.07 7.07 0 0 0-.39-1l1.51-1.53a1 1 0 0 0-1.42-1.42l-1.53 1.51c-.32-.18-.66-.32-1-.39l-.18-2.12a1 1 0 0 0-2-.09l-.18 2.12c-.34.07-.68.21-1 .39l-1.53-1.51a1 1 0 1 0-1.42 1.42l1.51 1.53c-.18.32-.32.66-.39 1l-2.12.18a1 1 0 0 0-.09 2l2.12.18c.07.34.21.68.39 1l-1.51 1.53a1 1 0 1 0 1.42 1.42l1.53-1.51c.32.18.66.32 1 .39l.18 2.12a1 1 0 0 0 2 .09l.18-2.12c.34-.07.68-.21 1-.39l1.53 1.51a1 1 0 0 0 1.42-1.42l-1.51-1.53c.18-.32.32-.66.39-1l2.12-.18z" />
                  </svg>
                  Change Config
                </button>

                {/* Reset Auction */}
                <button className="w-full px-4 py-2 bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/25 transition-all duration-150 flex items-center justify-center">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Auction
                </button>

                {/* Mark as Complete (moved before cancel) */}
                <button className="w-full px-4 py-2 bg-green-500/15 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/25 transition-all duration-150 flex items-center justify-center">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mark as Complete
                </button>

                {/* Cancel Auction */}
                <button className="w-full px-4 py-2 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/25 transition-all duration-150 flex items-center justify-center">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel Auction
                </button>
              </div>
            </div>
            )}
          </div>
        )}

        {/* Current Player and Live Bids Section */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
          {/* Current Player Card */}
          <div className="xl:col-span-1 bg-[#1a1a1a]/50 rounded-xl p-6 border border-[#CEA17A]/10">
            {!isAuctionLive && (
              <div className="text-center py-12">
                <div className="text-[#CEA17A] text-6xl mb-4">🕒</div>
                <h3 className="text-xl font-semibold text-[#DBD0C0] mb-2">Auction Not Live</h3>
                <p className="text-[#DBD0C0]/70">Waiting for host to start the auction</p>
              </div>
            )}
            {isAuctionLive && currentPlayer ? (
            <div className="space-y-6">
              

              {/* Player Navigation moved to Live Bids */}

                {/* Player Photo - Increased Size */}
                <div className="flex justify-center">
                  <div 
                    className="relative w-64 h-64 rounded-xl overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-105 shadow-lg"
                    onClick={() => handlePhotoClick(currentPlayer.profile_pic_url || '', currentPlayer.display_name)}
                  >
                    {(isPlayerTransitioning) ? (
                      <div className="w-full h-full bg-gradient-to-br from-[#CEA17A]/20 to-[#CEA17A]/10 flex items-center justify-center">
                        <div className="animate-pulse w-full h-full flex items-center justify-center">
                          <div className="w-20 h-20 rounded-full bg-[#CEA17A]/30" />
                        </div>
                      </div>
                    ) : currentPlayer.profile_pic_url ? (
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
                    {!(actionLoading.nextPlayer || actionLoading.previousPlayer) && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                    )}
                  </div>
                </div>

                {/* Player Name and Info */}
                <div className="text-center">
                  {isPlayerTransitioning ? (
                    <div className="flex flex-col items-center justify-center gap-2 animate-pulse">
                      <div className="h-6 w-40 bg-[#CEA17A]/20 rounded" />
                      <div className="h-3 w-28 bg-[#CEA17A]/10 rounded" />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-bold text-[#DBD0C0]">{currentPlayer.display_name}</h3>
                      <div className="text-sm text-[#DBD0C0]/70 mt-1 text-center">
                        {(() => {
                          const availablePlayers = getAvailablePlayers()
                          const currentPlayerIndex = availablePlayers.findIndex(ap => ap.player_id === currentPlayer.player_id)
                          const currentPosition = currentPlayerIndex + 1
                          const totalAvailable = availablePlayers.length
                          return `Player ${currentPosition} of ${totalAvailable}`
                        })()}
                        {viewingUnsoldPlayers && (
                          <div className="text-xs text-orange-400 mt-1">Viewing Unsold Players</div>
                    )}
                  </div>
                      {currentPlayer.sold_price && (
                        <div className="text-center text-sm text-[#CEA17A] font-semibold mt-2">
                          Sold for ₹{currentPlayer.sold_price}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Player Profile */}
                  <div>
                  <div className="bg-[#19171b]/50 rounded-lg p-4 border border-[#CEA17A]/10">
                    {isPlayerTransitioning ? (
                      <div className="space-y-4 animate-pulse">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="flex items-center justify-between">
                            <div className="h-3 w-20 bg-[#CEA17A]/20 rounded" />
                            <div className="h-3 w-32 bg-[#CEA17A]/10 rounded" />
                          </div>
                        ))}
                        <div className="flex items-center justify-between">
                          <div className="h-3 w-14 bg-[#CEA17A]/20 rounded" />
                          <div className="h-3 w-40 bg-[#CEA17A]/10 rounded" />
                        </div>
                      </div>
                    ) : (
                    <div className="space-y-3">
                      {[
                        'Role',
                        'Batting Style', 
                        'Bowling Style',
                        'Base Price'
                      ].map((skillName) => {
                        const skillValue = currentPlayer.skills?.[skillName]
                        return (
                          <div key={skillName} className="flex items-start justify-between">
                            <div className="text-sm font-medium text-[#CEA17A] flex-shrink-0">{skillName}:</div>
                            <div className="text-[#DBD0C0] text-sm text-right flex-1 ml-3">
                              {skillValue ? (
                                Array.isArray(skillValue) ? (
                                  <div className="flex flex-wrap gap-1 justify-end">
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
                                  <span>{String(skillValue)}</span>
                                )
                              ) : (
                                <span className="text-[#DBD0C0]/40 italic">—</span>
                            )}
                          </div>
                        </div>
                        )
                      })}
                      
                      {/* Bio field from player object */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-[#CEA17A] flex-shrink-0">Bio:</div>
                        <div className="text-[#DBD0C0] text-sm text-right flex-1 ml-3 overflow-hidden">
                          {currentPlayer.bio ? (
                            <div className="whitespace-nowrap overflow-x-auto scrollbar-hide">
                              <span className="inline-block animate-scroll">{currentPlayer.bio}</span>
                  </div>
                ) : (
                            <span className="text-[#DBD0C0]/40 italic">—</span>
                )}
                        </div>
                      </div>
                  </div>
                )}
                  </div>
                </div>
              </div>
            ) : null}
            {isAuctionLive && !currentPlayer && (
              <div className="text-center py-12">
                <div className="text-[#CEA17A] text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-[#DBD0C0] mb-2">No Current Player</h3>
                <p className="text-[#DBD0C0]/70">Host hasn't selected a player yet</p>
              </div>
            )}
          </div>

          {/* Live Bids Card */}
          <div className="xl:col-span-3 bg-gradient-to-br from-[#1a1a1a]/80 to-[#0f0f0f]/80 rounded-xl p-6 border-2 border-[#CEA17A]/20 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <h2 className="text-2xl font-bold text-[#DBD0C0] flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                Live Bids
              </h2>
              </div>
            {/* Container that evenly spaces the bidding controls block and captain bids table */}
            <div className="flex-1 flex flex-col justify-between min-h-0">
            
            {currentPlayer ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                  {/* Left: Current/Next Bid cards side by side (span 2) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-full md:col-span-2">
                    <div className="bg-gradient-to-br from-[#2a2a2a]/80 to-[#1a1a1a]/80 rounded-lg p-3 border border-[#CEA17A]/20 shadow">
                      <h3 className="text-base font-semibold text-[#CEA17A] mb-2 flex items-center gap-2">
                        <span className="inline-block text-base leading-none">🔨</span>
                        Current Bid
                      </h3>
                      {getCurrentBid() === null ? (
                        <div className="text-xs text-[#DBD0C0]/70 italic">No bids yet</div>
                      ) : (
                        <>
                          <div className="text-2xl font-extrabold text-[#DBD0C0] mb-0.5">₹{getCurrentBid()}</div>
                          <div className="text-xs text-[#DBD0C0]/80 font-medium">
                            by {recentBids.find(bid => bid.is_winning_bid && !bid.is_undone)?.team_name || '—'}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="bg-gradient-to-br from-[#2a2a2a]/80 to-[#1a1a1a]/80 rounded-lg p-3 border border-[#CEA17A]/20 shadow">
                      <h3 className="text-base font-semibold text-[#CEA17A] mb-2 flex items-center gap-2">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Next Bid
                      </h3>
                      <div className="text-2xl font-extrabold text-[#DBD0C0] mb-0.5">₹{calculateNextBid(getCurrentBid() ?? undefined)}</div>
                      <div className="text-[10px] text-[#DBD0C0]/70 font-medium">Min increment: ₹{auction?.min_increment || 20}</div>
                    </div>
                  </div>
                  {/* Right: Action buttons (only if controller) */}
                  {isAuctionController && (
                    <div className="h-full flex flex-col justify-between">
                      {/* Row 1: primary actions */}
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={handleSellPlayer}
                          disabled={isInteractionLocked || !isAuctionLive || actionLoading.sellPlayer || !recentBids || recentBids.length === 0 || !recentBids.some(bid => bid.is_winning_bid && !bid.is_undone)}
                          className={`px-6 h-12 rounded-lg transition-all duration-150 flex items-center justify-center ${isInteractionLocked || !isAuctionLive || actionLoading.sellPlayer || !recentBids || recentBids.length === 0 || !recentBids.some(bid => bid.is_winning_bid && !bid.is_undone)
                            ? 'bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed'
                            : 'bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25'}`}
                        >
                          {actionLoading.sellPlayer ? (
                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V2C5.373 2 2 5.373 2 12h2zm2 5.291A7.962 7.962 0 014 12H2c0 3.042 1.135 5.824 3 7.938l1-0.647z" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {actionLoading.sellPlayer ? 'Selling...' : 'Sell Player'}
                        </button>
                        <button
                          onClick={handleUndoBid}
                          disabled={isInteractionLocked || !isAuctionLive || !recentBids || recentBids.length === 0 || actionLoading.undoBid}
                          className={`px-6 h-12 rounded-lg transition-all duration-150 flex items-center justify-center ${isInteractionLocked || !isAuctionLive || !recentBids || recentBids.length === 0 || actionLoading.undoBid
                            ? 'bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed'
                            : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/25'}`}
                        >
                          {actionLoading.undoBid ? (
                            <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V2C5.373 2 2 5.373 2 12h2zm2 5.291A7.962 7.962 0 014 12H2c0 3.042 1.135 5.824 3 7.938l1-0.647z" />
                            </svg>
                          ) : (
                            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          )}
                          {actionLoading.undoBid ? 'Undoing...' : 'Undo Bid'}
                        </button>
                        <button
                          onClick={handleUndoPlayerAssignment}
                          disabled={isInteractionLocked || !auctionTeams || auctionTeams.length === 0 || !auctionTeams.some(team => team.players_count > 0) || actionLoading.undoPlayerAssignment}
                          className={`px-6 h-12 rounded-lg transition-all duration-150 flex items-center justify-center ${isInteractionLocked || !auctionTeams || auctionTeams.length === 0 || !auctionTeams.some(team => team.players_count > 0) || actionLoading.undoPlayerAssignment
                            ? 'bg-gray-500/10 text-gray-500 border border-gray-500/20 cursor-not-allowed'
                            : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/25'}`}
                        >
                          {actionLoading.undoPlayerAssignment ? (
                            <>
                              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Undoing...
                            </>
                          ) : (
                            <>
                              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Undo Sell
                            </>
                          )}
                        </button>
                      </div>
                      {/* Row 2: navigation */}
                      <div className="grid grid-cols-2 gap-0 mt-3">
                        <button
                          onClick={handlePreviousPlayer}
                          disabled={isInteractionLocked || !currentPlayer || !auctionPlayers || (() => { const availablePlayers = getAvailablePlayers(); return availablePlayers.findIndex(ap => ap.player_id === currentPlayer.player_id) <= 0 })() || actionLoading.previousPlayer}
                          className={`w-full h-12 border rounded-l-lg transition-all duration-150 flex items-center justify-center ${isInteractionLocked || !currentPlayer || !auctionPlayers || (() => { const availablePlayers = getAvailablePlayers(); return availablePlayers.findIndex(ap => ap.player_id === currentPlayer.player_id) <= 0 })() || actionLoading.previousPlayer
                            ? 'bg-gray-500/10 text-gray-500 border-gray-500/20 cursor-not-allowed'
                            : 'bg-[#CEA17A]/15 text-[#CEA17A] border-[#CEA17A]/30 hover:bg-[#CEA17A]/25'}`}
                        >
                          {actionLoading.previousPlayer ? (
                            <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V2C5.373 2 2 5.373 2 12h2zm2 5.291A7.962 7.962 0 014 12H2c0 3.042 1.135 5.824 3 7.938l1-0.647z" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          )}
                          {actionLoading.previousPlayer ? 'Loading...' : 'Previous'}
                        </button>
                        <button
                          onClick={handleNextPlayer}
                          disabled={isInteractionLocked || !currentPlayer || !auctionPlayers || (() => { const availablePlayers = getAvailablePlayers(); return availablePlayers.length === 0 })() || actionLoading.nextPlayer}
                          className={`w-full h-12 border rounded-r-lg transition-all duration-150 flex items-center justify-center ${isInteractionLocked || !currentPlayer || !auctionPlayers || (() => { const availablePlayers = getAvailablePlayers(); return availablePlayers.length === 0 })() || actionLoading.nextPlayer
                            ? 'bg-gray-500/10 text-gray-500 border-gray-500/20 cursor-not-allowed'
                            : 'bg-[#CEA17A]/15 text-[#CEA17A] border-[#CEA17A]/30 hover:bg-[#CEA17A]/25'}`}
                        >
                          {actionLoading.nextPlayer ? 'Loading...' : 'Next'}
                          {actionLoading.nextPlayer ? (
                            <svg className="animate-spin h-4 w-4 ml-2" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V2C5.373 2 2 5.373 2 12h2zm2 5.291A7.962 7.962 0 014 12H2c0 3.042 1.135 5.824 3 7.938l1-0.647z" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-[#CEA17A] text-6xl mb-4">💰</div>
                <h3 className="text-xl font-semibold text-[#DBD0C0] mb-2">No Active Bidding</h3>
                <p className="text-[#DBD0C0]/70">Start the auction to begin bidding on players</p>
                </div>
            )}

            {/* Captain Bids section - bottom area */}
            <div className="mt-6 flex-shrink-0">
              <h3 className="text-2xl font-bold text-[#DBD0C0] mb-4 flex items-center gap-3">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                Captain Bids
                    </h3>
              <div className="relative rounded-xl border-2 border-[#CEA17A]/20 shadow-lg bg-gradient-to-br from-[#2a2a2a]/80 to-[#1a1a1a]/80">
                {/* Horizontal scroll container */}
                <div className="overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-[#CEA17A]/30 scrollbar-track-transparent">
                  {/* Min width ensures columns don't squeeze and cause overflow outside parent */}
                  <div className="min-w-[960px]">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 bg-[#1a1a1a]/50 border-b border-[#CEA17A]/20 text-base font-semibold text-[#CEA17A] sticky top-0 z-10">
                      <div className="col-span-3">Team</div>
                      <div className="col-span-2">Place Bid</div>
                      <div className="col-span-2 text-center">Remaining</div>
                      <div className="col-span-2 text-center">Max Possible</div>
                      <div className="col-span-2 text-center">Balance After</div>
                      <div className="col-span-1 text-center">Status</div>
                    </div>
                    {/* Body with its own vertical scroll */}
                    <div className="max-h-72 overflow-y-auto overflow-x-hidden">
                      {auctionTeams.map((team, index) => {
                        const nextBid = calculateNextBid()
                        const canAfford = team.remaining_purse >= nextBid
                        const isWinning = recentBids?.find(bid => bid.is_winning_bid && !bid.is_undone)?.team_id === team.id
                        // players_count already includes captain (set to 1 at creation). required_players includes captain.
                        const totalSlotsIncludingCaptain = team.required_players
                        const filledSlotsIncludingCaptain = (team.players_count || 0)
                        const remainingSlotsExcludingCurrent = Math.max(0, totalSlotsIncludingCaptain - filledSlotsIncludingCaptain)
                        // If we win current player, slots after purchase reduce by 1
                        const remainingSlotsAfterPurchase = Math.max(0, remainingSlotsExcludingCurrent - 1)
                        const minPerSlot = auction?.min_bid_amount || 40
                        const reserveNeeded = remainingSlotsAfterPurchase * minPerSlot
                        const maxPossibleBid = team.remaining_purse - reserveNeeded
                        const balanceAfterBid = team.remaining_purse - nextBid
                        const hasOpenSlot = remainingSlotsExcludingCurrent > 0
                        const withinMaxPossible = nextBid <= maxPossibleBid
                        const auctionCreatorId = auction?.created_by
                        const isAdmin = userProfile?.role === 'admin'
                        const isHostController = userProfile?.role === 'host' && auctionCreatorId === user?.id
                        const isAuctionController = !!(isAdmin || isHostController)
                        const captainPlayerRecord = players.find(p => p.id === team.captain_id)
                        const isUserCaptainForTeam = !!captainPlayerRecord && captainPlayerRecord.user_id && captainPlayerRecord.user_id === user?.id
                        const canUserBidOnThisTeam = isAuctionController || isUserCaptainForTeam
                        const entered = selectedBidAmounts[team.id]
                        // Treat absence of a custom bid as "valid" so the quick bid button still functions.
                        // Only enforce custom validation when a custom value is actually provided.
                        const { valid: customValid, reason: customReason } = validateCustomBid(team, entered ?? null)
                        const hasCustom = entered != null
                        const customIsOk = !hasCustom || customValid
                        const effectiveBid = customValid && hasCustom ? entered : nextBid
                        const validationOk = withinMaxPossible && canAfford && hasOpenSlot && customIsOk
                        const isEligible = isAuctionLive && validationOk && canUserBidOnThisTeam && !isGlobalBidLoading
                        const captainPlayer = players.find(p => p.id === team.captain_id)
                        const captainName = captainPlayer?.display_name || 'Unknown Captain'
                        return (
                          <div key={team.id} className={`grid grid-cols-12 gap-4 p-3 items-center text-sm md:text-base ${index % 2 === 0 ? 'bg-[#1a1a1a]/20' : 'bg-[#1a1a1a]/10'}`}>
                            <div className="col-span-3">
                              <div className="font-semibold text-[#DBD0C0] text-base md:text-lg leading-snug">{captainName}</div>
                              <div className="text-[11px] md:text-xs text-[#DBD0C0]/70 font-medium">{team.players_count}/{team.required_players} • {remainingSlotsExcludingCurrent} left</div>
                  </div>
                            <div className="col-span-2 relative">
                              { (isAuctionController || isUserCaptainForTeam) ? (
                                <div className="flex flex-col gap-2">
                                  <div className="flex w-full divide-x divide-[#CEA17A]/30 rounded-lg overflow-hidden border border-[#CEA17A]/30">
                                    <button
                                      onClick={() => {
                                        if (!canUserBidOnThisTeam || !isAuctionLive || isGlobalBidLoading) return
                                        const current = getCurrentBid()
                                        const next = calculateNextBid(current ?? undefined)
                                        const toBid = (entered && customValid) ? entered : next
                                        if (isEligible) handlePlaceBid(team.id, toBid)
                                      }}
                                      disabled={!canUserBidOnThisTeam || !isAuctionLive || isGlobalBidLoading || !hasOpenSlot || !canAfford || !withinMaxPossible}
                                      className={`flex-1 py-1.5 px-2 text-[11px] font-semibold transition-all ${
                                        !canUserBidOnThisTeam || !isAuctionLive || isGlobalBidLoading || !hasOpenSlot || !canAfford || !withinMaxPossible
                                          ? 'bg-gray-500/10 text-gray-500 cursor-not-allowed'
                                          : 'bg-[#CEA17A]/20 text-[#CEA17A] hover:bg-[#CEA17A]/30'
                                      }`}
                                    >
                                      {(bidLoading[`bid_${team.id}`] || isGlobalBidLoading)
                                        ? 'Placing...'
                                        : `Bid ₹${(entered && customValid) ? entered : calculateNextBid(getCurrentBid() ?? undefined)}`}
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (!canUserBidOnThisTeam || !isAuctionLive || isGlobalBidLoading) return
                                        setOpenBidPopover(prev => prev === team.id ? null : team.id)
                                      }}
                                      disabled={!canUserBidOnThisTeam || !isAuctionLive || isGlobalBidLoading}
                                      className={`w-8 flex items-center justify-center py-1.5 text-[#CEA17A] text-xs transition-all ${
                                        !canUserBidOnThisTeam || !isAuctionLive || isGlobalBidLoading
                                          ? 'bg-gray-500/10 text-gray-500'
                                          : 'bg-[#CEA17A]/10 hover:bg-[#CEA17A]/20'
                                      }`}
                                      aria-label="Custom bid"
                                    >
                                      <svg className={`h-3 w-3 transition-transform ${openBidPopover===team.id?'rotate-180':''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"/></svg>
                                    </button>
                                  </div>
                                  {openBidPopover === team.id && (
                                    <div className="absolute z-20 mt-1 w-60 rounded-md bg-[#1a1a1a] border border-[#CEA17A]/30 shadow-xl p-3 animate-fade-in">
                                      <div className="flex flex-col gap-2">
                                        <input
                                          type="number"
                                          min={0}
                                          placeholder={`Min ₹${calculateNextBid(getCurrentBid() ?? undefined)}`}
                                          value={entered ?? ''}
                                          onChange={(e)=>{
                                            const val = e.target.value === '' ? null : parseInt(e.target.value)
                                            setSelectedBidAmounts(prev=>({...prev,[team.id]: val}))
                                          }}
                                          className="w-full bg-[#0f0f0f]/60 border border-[#CEA17A]/30 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#CEA17A]"
                                        />
                                        <div className="flex items-center justify-between text-[10px] text-[#DBD0C0]/60">
                                          <span>Max Possible:</span>
                                          <span className="text-[#CEA17A]">₹{Math.max(0, team.remaining_purse - Math.max(0, (team.required_players - (team.players_count||0) -1)) * (auction?.min_bid_amount||40))}</span>
                                        </div>
                                        {!customValid && entered!=null && (
                                          <div className="text-[10px] text-red-400 font-medium">{customReason}</div>
                                        )}
                                        <div className="flex gap-2">
                                          <button
                                            onClick={()=>{setOpenBidPopover(null); setSelectedBidAmounts(prev=>({...prev,[team.id]: null}))}}
                                            className="flex-1 py-1.5 text-[11px] rounded border border-gray-500/30 text-gray-300 hover:bg-gray-600/10"
                                          >Clear</button>
                                          <button
                                            onClick={()=>{ if (isEligible && entered) { setOpenBidPopover(null); handlePlaceBid(team.id, entered) }}}
                                            disabled={!isEligible || !entered}
                                            className={`flex-1 py-1.5 text-[11px] rounded font-semibold border ${isEligible && entered ? 'bg-green-500/20 text-green-300 border-green-400/40 hover:bg-green-500/30' : 'bg-gray-600/10 text-gray-500 border-gray-600/20 cursor-not-allowed'}`}
                                          >Place</button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center text-[11px] text-[#DBD0C0]/30">—</div>
                              ) }
                            </div>
                            <div className="col-span-2 text-[#DBD0C0] text-base font-semibold text-center">₹{team.remaining_purse}</div>
                            <div className="col-span-2 text-[#DBD0C0] text-base font-semibold text-center" title={`Max possible bid preserves min ₹${minPerSlot} for each remaining slot`}>₹{Math.max(0, maxPossibleBid)}</div>
                            <div className={`col-span-2 text-base font-semibold text-center ${balanceAfterBid >= 0 ? 'text-[#DBD0C0]' : 'text-red-400'}`}>₹{balanceAfterBid}</div>
                            <div className="col-span-1 flex justify-center">
                              {isWinning ? <div className="w-3 h-3 bg-green-500 rounded-full"/> : canAfford ? <div className="w-3 h-3 bg-[#CEA17A] rounded-full"/> : <div className="w-3 h-3 bg-gray-500 rounded-full"/>}
                                </div>
                          </div>
                        )
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                      </div>

                      </div>
          </div>
        </div>

        {/* Team Formation */}
        <div className="bg-gradient-to-br from-[#1a1a1a]/80 to-[#0f0f0f]/80 rounded-xl p-6 border-2 border-[#CEA17A]/20 shadow-2xl mb-8">
          <h2 className="text-2xl font-bold text-[#DBD0C0] mb-6 flex items-center gap-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Team Formation
            </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {auctionTeams.map((team) => {
              // Get players for this team (both sold players and captain)
              const soldPlayers = auctionPlayers?.filter(ap => ap.sold_to === team.id) || []
              const captainPlayer = auctionPlayers?.find(ap => ap.player_id === team.captain_id) || null
              
              // Combine captain and sold players
              const teamPlayers = captainPlayer ? [captainPlayer, ...soldPlayers] : soldPlayers
              
              return (
                <div key={team.id} className="bg-gradient-to-br from-[#2a2a2a]/80 to-[#1a1a1a]/80 rounded-xl border-2 border-[#CEA17A]/20 shadow-lg overflow-hidden">
                  {/* Team Header */}
                  <div className="p-3 bg-[#1a1a1a]/50 border-b border-[#CEA17A]/20">
                    <h4 className="text-lg font-bold text-[#CEA17A]">{team.team_name}</h4>
                    </div>
                  
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-2 p-2 bg-[#1a1a1a]/30 border-b border-[#CEA17A]/10 text-sm font-semibold text-[#CEA17A]">
                    <div className="col-span-6">Player</div>
                    <div className="col-span-2 text-center">Role</div>
                    <div className="col-span-4 text-center">Price</div>
                  </div>
                  
                  {/* Player Rows - Fixed slots based on team size */}
                  <div>
                    {Array.from({ length: team.required_players }, (_, index) => {
                      // Find if there's a player for this slot
                      const auctionPlayer = teamPlayers[index]
                      const player = auctionPlayer ? players.find(p => p.id === auctionPlayer.player_id) : null
                      const isCaptain = auctionPlayer && auctionPlayer.player_id === team.captain_id
                        
                        return (
                        <div key={index} className={`grid grid-cols-12 gap-2 p-2 items-center ${index % 2 === 0 ? 'bg-[#1a1a1a]/10' : 'bg-[#1a1a1a]/5'}`}>
                          <div className="col-span-6">
                            <div className="flex items-center gap-1">
                              {player ? (
                                <>
                                  <div className="w-6 h-6 rounded-full overflow-hidden border border-[#CEA17A]/30 flex-shrink-0">
                              {player.profile_pic_url ? (
                                <img 
                                  src={player.profile_pic_url} 
                                  alt={player.display_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#CEA17A]/20 to-[#CEA17A]/10 flex items-center justify-center">
                                        <div className="text-[10px] text-[#CEA17A]">
                                    {player.display_name?.charAt(0)?.toUpperCase() || '👤'}
                                  </div>
                                </div>
                              )}
                            </div>
                                  <div className="font-semibold text-[#DBD0C0] text-sm md:text-base truncate leading-snug">
                                    {player.display_name}
                                    {isCaptain && <span className="text-[#CEA17A] ml-1">(C)</span>}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="w-6 h-6 rounded-full border border-[#CEA17A]/20 flex-shrink-0 bg-[#1a1a1a]/30 flex items-center justify-center">
                                    <div className="text-[8px] text-[#CEA17A]/40">—</div>
                                  </div>
                                  <div className="text-[#DBD0C0]/40 text-xs italic">
                                    Slot {index + 1}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2 text-center">
                            {player ? (
                              <div className="text-lg">
                                  {player.skills?.Role && (
                                  Array.isArray(player.skills.Role) ? (
                                    player.skills.Role.map((role, roleIndex) => (
                                      <span key={roleIndex}>
                                            {role === 'Batsman' || role === 'Batter' ? '🏏' : 
                                         role === 'Bowler' ? '🎾' : 
                                             role === 'All Rounder' ? '🎯' : 
                                             role === 'Wicket Keeper' ? '🧤' : '👤'}
                                          </span>
                                        ))
                                      ) : (
                                    <span>
                                          {player.skills.Role === 'Batsman' || player.skills.Role === 'Batter' ? '🏏' : 
                                       player.skills.Role === 'Bowler' ? '🎾' : 
                                           player.skills.Role === 'All Rounder' ? '🎯' : 
                                           player.skills.Role === 'Wicket Keeper' ? '🧤' : '👤'}
                                        </span>
                                  )
                                      )}
                                    </div>
                            ) : (
                              <div className="text-[#CEA17A]/20 text-lg">—</div>
                            )}
                          </div>
                          <div className="col-span-4 text-center text-[#CEA17A] font-bold text-sm md:text-base">
                            {player ? (
                              `₹${isCaptain ? 0 : (auctionPlayer.sold_price || 0)}`
                            ) : (
                              <span className="text-[#CEA17A]/20">—</span>
                                  )}
                                </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
                              </div>
                            </div>
                            
        {/* Recent Bids */}
        <div className="bg-gradient-to-br from-[#1a1a1a]/80 to-[#0f0f0f]/80 rounded-xl p-6 border-2 border-[#CEA17A]/20 shadow-2xl mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#DBD0C0] flex items-center gap-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Recent Bids
            </h2>
            <div className="text-sm text-[#DBD0C0]/70 bg-[#19171b]/50 px-3 py-1 rounded-full border border-[#CEA17A]/20">
              {recentBids?.length || 0} bids {lastLatencySample && <span className="ml-2 text-xs text-[#CEA17A]/60">lat: opt {lastLatencySample.optimistic}ms / conf {lastLatencySample.confirm}ms</span>}
            </div>
                              </div>
          
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl border-2 border-[#CEA17A]/20 shadow-2xl overflow-hidden max-h-80">
            {recentBids && recentBids.length > 0 ? (
              <div className="overflow-y-auto">
                <div className="grid grid-cols-12 gap-4 p-4 bg-[#1a1a1a]/60 border-b border-[#CEA17A]/20 text-sm font-semibold text-[#CEA17A]">
                  <div className="col-span-5">Team</div>
                  <div className="col-span-3">Amount</div>
                  <div className="col-span-3">Time</div>
                  <div className="col-span-1 text-center">Win</div>
                            </div>
                {latestBidsMemo.map((bid, index) => (
                  <div key={bid.id} className={`grid grid-cols-12 gap-4 p-4 items-center ${index % 2 === 0 ? 'bg-[#2a2a2a]/30' : 'bg-[#1a1a1a]/30'} hover:bg-[#CEA17A]/5 transition-colors`}>
                    <div className="col-span-5 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#CEA17A]"></div>
                      <div className="font-semibold text-[#DBD0C0] truncate">{bid.team_name}</div>
                          </div>
                    <div className="col-span-3 text-[#CEA17A] font-bold">₹{bid.bid_amount}</div>
                    <div className="col-span-3 text-xs text-[#DBD0C0]/60 font-mono">
                      {new Date(bid.timestamp).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                      </div>
                    <div className="col-span-1 flex justify-center">
                      {bid.is_winning_bid && !bid.is_undone ? (
                        <span className="px-2 py-0.5 bg-green-600/30 text-green-300 rounded text-[10px] font-bold">WIN</span>
                      ) : (
                        <span className="text-[10px] text-[#DBD0C0]/40">—</span>
                    )}
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




        {/* Players */}
        <div className="bg-[#1a1a1a]/50 rounded-xl p-6 border border-[#CEA17A]/10 mb-8">
          <h2 className="text-2xl font-bold text-[#DBD0C0] mb-6">Players ({auctionPlayers.length})</h2>
          
          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-xl border-2 border-[#CEA17A]/20 shadow-2xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 p-4 bg-[#1a1a1a]/60 border-b border-[#CEA17A]/20 text-sm font-semibold text-[#CEA17A]">
              <div className="col-span-4">Player</div>
              <div className="col-span-2 text-center">Role</div>
              <div className="col-span-2 text-center">Base Price</div>
              <div className="col-span-2 text-center">Status</div>
              <div className="col-span-2 text-center">Sold Price</div>
            </div>
            
            {/* Table Body */}
            <div className="max-h-96 overflow-y-auto">
              {(() => {
                // Sort players: unsold first, then alphabetically
                const sortedPlayers = [...players].sort((a, b) => {
                  const auctionPlayerA = auctionPlayers.find(ap => ap.player_id === a.id)
                  const auctionPlayerB = auctionPlayers.find(ap => ap.player_id === b.id)
                  
                  // First sort by status: available first, then sold
                  const statusA = auctionPlayerA?.status || 'unknown'
                  const statusB = auctionPlayerB?.status || 'unknown'
                  
                  if (statusA === 'available' && statusB !== 'available') return -1
                  if (statusA !== 'available' && statusB === 'available') return 1
                  
                  // Then sort alphabetically by display name
                  return a.display_name.localeCompare(b.display_name)
                })
                
                return sortedPlayers.map((player, index) => {
                  const auctionPlayer = auctionPlayers.find(ap => ap.player_id === player.id)
                  const role = player.skills?.Role;
                  const basePrice = player.skills?.["Base Price"];
                  
                  // Get role emoji
                  const getRoleEmoji = (role: string | string[] | undefined) => {
                    if (!role) return "❓";
                    const roleStr = Array.isArray(role) ? role.join(', ') : role;
                    if (roleStr.toLowerCase().includes('batter') && roleStr.toLowerCase().includes('bowler')) return "🎯";
                    if (roleStr.toLowerCase().includes('batter')) return "🏏";
                    if (roleStr.toLowerCase().includes('bowler')) return "🎾";
                    if (roleStr.toLowerCase().includes('wicket')) return "🧤";
                    if (roleStr.toLowerCase().includes('all')) return "🎯";
                    return "❓";
                  };

                  return (
                    <div key={player.id} className={`grid grid-cols-12 gap-4 p-4 items-center ${index % 2 === 0 ? 'bg-[#1a1a1a]/20' : 'bg-[#1a1a1a]/10'}`}>
                      {/* Player */}
                      <div className="col-span-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
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
                                    parent.innerHTML = `<div class="w-full h-full bg-[#CEA17A]/20 flex items-center justify-center"><span class="text-[#CEA17A] font-bold text-xs">${player.display_name.charAt(0).toUpperCase()}</span></div>`;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-[#CEA17A]/20 flex items-center justify-center">
                                <span className="text-[#CEA17A] font-bold text-xs">
                                  {player.display_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <h3 className="text-[#DBD0C0] font-medium truncate text-sm">{player.display_name}</h3>
                          </div>
                        </div>
                      </div>
                      
                      {/* Role */}
                      <div className="col-span-2 text-center">
                        <div className="text-lg">
                          {getRoleEmoji(role)}
                        </div>
                      </div>
                      
                      {/* Base Price */}
                      <div className="col-span-2 text-center text-[#CEA17A] font-semibold text-sm">
                        {basePrice ? `₹${basePrice}` : '—'}
                      </div>
                      
                      {/* Status */}
                      <div className="col-span-2 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          auctionPlayer?.status === 'available' ? 'bg-green-400/10 text-green-400' :
                          auctionPlayer?.status === 'sold' ? 'bg-blue-400/10 text-blue-400' :
                          'bg-gray-400/10 text-gray-400'
                        }`}>
                          {auctionPlayer?.status || 'Unknown'}
                        </span>
                      </div>
                      
                      {/* Sold Price */}
                      <div className="col-span-2 text-center text-[#CEA17A] font-semibold text-sm">
                        {auctionPlayer?.sold_price ? `₹${auctionPlayer.sold_price}` : '—'}
                      </div>
                    </div>
                  );
                })
              })()}
            </div>
          </div>
        </div>

        {/* Auction Configuration */}
        <div className="bg-[#1a1a1a]/50 rounded-xl p-6 border border-[#CEA17A]/10">
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
        </div>
      </div>

      {/* Mobile layout (below md) */}
      <div className="md:hidden relative z-10 w-full px-3 pt-4 pb-24 min-h-screen flex flex-col">
        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <Link href="/auctions" className="p-2 rounded-lg bg-[#CEA17A]/10 text-[#CEA17A] flex-shrink-0" aria-label="Back">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </Link>
            <h1 className="text-lg font-bold text-[#DBD0C0] truncate">{auction.tournament_name || 'Auction'}</h1>
          </div>
          <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${getStatusColor(auction.status)}`}>{getStatusText(auction.status)}</span>
        </div>

        {/* Mobile Player & Bid snapshot (compressed height) */}
        <div className="bg-[#1a1a1a]/60 border border-[#CEA17A]/20 rounded-xl p-3 mb-3 flex gap-3">
          <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-[#CEA17A]/20" onClick={() => currentPlayer && handlePhotoClick(currentPlayer.profile_pic_url || '', currentPlayer.display_name)}>
            {currentPlayer?.profile_pic_url ? (
              <img src={currentPlayer.profile_pic_url} alt={currentPlayer.display_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#CEA17A]/10 text-2xl font-bold text-[#CEA17A]">{currentPlayer?.display_name?.charAt(0) || '👤'}</div>
            )}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-[#DBD0C0] leading-tight truncate">{currentPlayer?.display_name || 'No Player'}</h2>
            {currentPlayer && <div className="text-[10px] text-[#DBD0C0]/60 mb-1">Base ₹{getPlayerBasePrice(currentPlayer)} • {recentBids?.length || 0} bids</div>}
            <div className="grid grid-cols-2 gap-1 mt-auto">
              <div className="bg-[#2a2a2a]/60 rounded-md p-1.5 border border-[#CEA17A]/10 flex flex-col justify-center">
                <div className="text-[9px] text-[#CEA17A] font-medium">Current</div>
                <div className="text-[#DBD0C0] text-sm font-bold leading-none">{getCurrentBid() === null ? '—' : `₹${getCurrentBid()}`}</div>
              </div>
              <div className="bg-[#2a2a2a]/60 rounded-md p-1.5 border border-[#CEA17A]/10 flex flex-col justify-center">
                <div className="text-[9px] text-[#CEA17A] font-medium">Next</div>
                <div className="text-[#DBD0C0] text-sm font-bold leading-none">₹{calculateNextBid(getCurrentBid() ?? undefined)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Removed separate navigation row to consolidate controls at bottom */}

        {/* Captain Bid Buttons (compact list) */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-[#DBD0C0] mb-2">Captain Bids</h3>
          <div className="space-y-1.5">
            {auctionTeams.map((team, index) => {
              const nextBid = calculateNextBid()
              const canAfford = team.remaining_purse >= nextBid
              const isWinning = recentBids?.find(b => b.is_winning_bid && !b.is_undone)?.team_id === team.id
              const captainPlayer = players.find(p => p.id === team.captain_id)
              const captainName = captainPlayer?.display_name || 'Unknown Captain'
              const totalSlotsIncludingCaptain = team.required_players
              const filledSlotsIncludingCaptain = (team.players_count || 0) + 1
              const remainingSlotsExcludingCurrent = Math.max(0, totalSlotsIncludingCaptain - filledSlotsIncludingCaptain)
              const remainingSlotsAfterPurchase = Math.max(0, remainingSlotsExcludingCurrent - 1)
              const minPerSlot = auction?.min_bid_amount || 40
              const reserveNeeded = remainingSlotsAfterPurchase * minPerSlot
              const maxPossibleBid = team.remaining_purse - reserveNeeded
              const balanceAfter = team.remaining_purse - nextBid
              const hasOpenSlot = remainingSlotsExcludingCurrent > 0
              const withinMaxPossible = nextBid <= maxPossibleBid
              const isEligible = isAuctionLive && hasOpenSlot && canAfford && withinMaxPossible
              const auctionCreatorId = auction?.created_by
              const isAdmin = userProfile?.role === 'admin'
              const isHostController = userProfile?.role === 'host' && auctionCreatorId === user?.id
              const isAuctionController = !!(isAdmin || isHostController)
              const captainPlayerRecord = players.find(p => p.id === team.captain_id)
              const isUserCaptainForTeam = !!captainPlayerRecord && captainPlayerRecord.user_id && captainPlayerRecord.user_id === user?.id
              const canUserBidOnThisTeam = isAuctionController || isUserCaptainForTeam
              const selected = selectedBidAmounts[team.id]
              const finalEligible = isAuctionLive && hasOpenSlot && canAfford && withinMaxPossible && canUserBidOnThisTeam && !isGlobalBidLoading
              return (
                <div key={team.id} className="flex items-center gap-2 bg-[#1a1a1a]/60 border border-[#CEA17A]/15 rounded-md px-2 py-1.5">
                  <div className="flex flex-col flex-1 min-w-0 leading-tight">
                    <div className="text-[#DBD0C0] text-[13px] font-semibold truncate flex items-center gap-1">{captainName}{isWinning && <span className='w-1.5 h-1.5 bg-green-500 rounded-full' />}</div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                      <button onClick={() => setMobilePurseTeamId(team.id)} className="text-[9px] font-medium text-[#CEA17A] hover:text-[#CEA17A]/80 transition-colors">Purse</button>
                      <span className="w-1 h-1 rounded-full bg-[#CEA17A]/40" />
                      <span className="text-[9px] text-[#DBD0C0]/70">Remaining <span className="text-[#DBD0C0] font-semibold">₹{team.remaining_purse}</span></span>
                      <span className="w-1 h-1 rounded-full bg-[#CEA17A]/40" />
                      <span className="text-[9px] text-[#DBD0C0]/70">Slots <span className="text-[#DBD0C0] font-semibold">{remainingSlotsExcludingCurrent}</span></span>
                      <span className="w-1 h-1 rounded-full bg-[#CEA17A]/40" />
                      <span className="text-[9px] text-[#DBD0C0]/70">Max <span className="text-[#DBD0C0] font-semibold">₹{Math.max(0, maxPossibleBid)}</span></span>
                      <span className="w-1 h-1 rounded-full bg-[#CEA17A]/40" />
                      <span className={`text-[9px] font-medium ${balanceAfter >= 0 ? 'text-green-400' : 'text-red-400'}`}>After ₹{balanceAfter}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 relative">
                    <div className="flex divide-x divide-[#CEA17A]/30 rounded-md overflow-hidden border border-[#CEA17A]/30">
                      <button
                        onClick={() => {
                          if (!canUserBidOnThisTeam || !isAuctionLive || isGlobalBidLoading) return
                          const current = getCurrentBid()
                          const next = calculateNextBid(current ?? undefined)
                          const toBid = (selected && finalEligible) ? selected : next
                          if (finalEligible) handlePlaceBid(team.id, toBid)
                        }}
                        disabled={!canUserBidOnThisTeam || !isAuctionLive || isGlobalBidLoading || !hasOpenSlot || !canAfford || !withinMaxPossible}
                        className={`px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                          !canUserBidOnThisTeam || !isAuctionLive || isGlobalBidLoading || !hasOpenSlot || !canAfford || !withinMaxPossible
                            ? 'bg-gray-500/10 text-gray-500'
                            : 'bg-[#CEA17A]/20 text-[#CEA17A] active:scale-95'
                        }`}
                      >
                        {(bidLoading[`bid_${team.id}`] || isGlobalBidLoading) ? 'Placing...' : `Bid ₹${(selected && finalEligible) ? selected : calculateNextBid(getCurrentBid() ?? undefined)}`}
                      </button>
                      <button
                        onClick={() => {
                          if (!canUserBidOnThisTeam || !isAuctionLive || isGlobalBidLoading) return
                          setOpenBidPopover(prev => prev === `m-${team.id}` ? null : `m-${team.id}`)
                        }}
                        disabled={!canUserBidOnThisTeam || !isAuctionLive || isGlobalBidLoading}
                        className={`w-8 flex items-center justify-center py-1.5 text-[#CEA17A] text-xs transition-all ${
                          !canUserBidOnThisTeam || !isAuctionLive || isGlobalBidLoading
                            ? 'bg-gray-500/10 text-gray-500'
                            : 'bg-[#CEA17A]/10 hover:bg-[#CEA17A]/20'
                        }`}
                        aria-label="Custom bid"
                      >
                        <svg className={`h-3 w-3 transition-transform ${openBidPopover===`m-${team.id}`?'rotate-180':''}`} viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"/></svg>
                      </button>
                    </div>
                    {openBidPopover === `m-${team.id}` && (
                      <div className="absolute z-30 top-full right-0 mt-1 w-48 bg-[#1a1a1a] border border-[#CEA17A]/30 rounded-md p-2 shadow-xl">
                        <input
                          type="number"
                          min={0}
                          value={selected ?? ''}
                          placeholder={`Min ₹${calculateNextBid(getCurrentBid() ?? undefined)}`}
                          onChange={(e)=>{
                            const val = e.target.value === '' ? null : parseInt(e.target.value)
                            setSelectedBidAmounts(prev=>({...prev,[team.id]: val}))
                          }}
                          className="w-full mb-2 bg-[#0f0f0f]/60 border border-[#CEA17A]/30 rounded px-2 py-1 text-[10px] focus:outline-none focus:ring-1 focus:ring-[#CEA17A]"
                        />
                        <div className="flex gap-1">
                          <button onClick={()=>{setOpenBidPopover(null); setSelectedBidAmounts(p=>({...p,[team.id]: null}))}} className="flex-1 py-1 text-[10px] rounded border border-gray-600 text-gray-400">Clear</button>
                          <button onClick={()=>{ if (finalEligible && selected) { setOpenBidPopover(null); handlePlaceBid(team.id, selected) } }} disabled={!finalEligible || !selected} className={`flex-1 py-1 text-[10px] rounded border font-semibold ${finalEligible && selected ? 'bg-green-500/20 text-green-300 border-green-400/40' : 'border-gray-600 text-gray-500'}`}>Place</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Teams horizontal carousel (restored) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-semibold text-[#DBD0C0]">Teams</h3>
            <button type="button" onClick={() => setShowRemainingPlayersMobile(true)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[#CEA17A]/30 bg-[#CEA17A]/10 text-[#CEA17A] text-[10px] font-medium">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              Remaining Players
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
            {auctionTeams.map(team => {
              const teamPlayers = auctionPlayers.filter(ap => ap.sold_to === team.id || ap.player_id === team.captain_id)
              return (
                <button type="button" onClick={() => setFormationTeamModalId(team.id)} key={team.id} className="snap-start min-w-[150px] bg-[#1a1a1a]/60 border border-[#CEA17A]/15 rounded-lg p-2 flex flex-col text-left active:scale-95 transition">
                  <div className="text-[#CEA17A] font-semibold text-[11px] mb-0.5 truncate">{team.team_name}</div>
                  <div className="text-[9px] text-[#DBD0C0]/60 mb-1">{teamPlayers.length}/{team.required_players} • ₹{team.remaining_purse}</div>
                  <div className="flex -space-x-2 overflow-hidden">
                    {teamPlayers.slice(0,4).map(tp => {
                      const pl = players.find(p => p.id === tp.player_id)
                      return (
                        <div key={tp.id} className="w-7 h-7 rounded-full border border-[#CEA17A]/40 overflow-hidden bg-[#CEA17A]/10 flex items-center justify-center text-[8px] text-[#CEA17A]">
                          {pl?.profile_pic_url ? <img src={pl.profile_pic_url} className="w-full h-full object-cover" /> : (pl?.display_name?.charAt(0) || '•')}
                        </div>
                      )
                    })}
                    {teamPlayers.length > 4 && <div className="w-7 h-7 rounded-full border border-[#CEA17A]/40 flex items-center justify-center bg-[#1a1a1a]/70 text-[8px] text-[#CEA17A]">+{teamPlayers.length - 4}</div>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Floating consolidated actions (only for auction controller) */}
        {isAuctionController && currentPlayer && (
          <div className="fixed bottom-3 left-3 right-3 grid grid-cols-4 gap-2 z-40">
            <button onClick={handlePreviousPlayer} disabled={!currentPlayer || getAvailablePlayers().findIndex(ap => ap.player_id === currentPlayer?.player_id) <= 0} className="py-3 rounded-xl bg-[#CEA17A]/10 text-[#CEA17A] border border-[#CEA17A]/30 text-xs font-medium disabled:opacity-30">Prev</button>
            <button onClick={handleNextPlayer} disabled={!currentPlayer || getAvailablePlayers().length === 0} className="py-3 rounded-xl bg-[#CEA17A]/10 text-[#CEA17A] border border-[#CEA17A]/30 text-xs font-medium disabled:opacity-30">Next</button>
            <button onClick={handleSellPlayer} disabled={!isAuctionLive || !recentBids?.some(b => b.is_winning_bid && !b.is_undone)} className="py-3 rounded-xl bg-green-600/20 text-green-300 border border-green-400/30 text-xs font-medium disabled:opacity-30">Sell</button>
            <button onClick={handleUndoBid} disabled={!isAuctionLive || !recentBids?.length} className="py-3 rounded-xl bg-yellow-600/20 text-yellow-300 border border-yellow-400/30 text-xs font-medium disabled:opacity-30">Undo</button>
          </div>
        )}
        {isAuctionController && !showHostActionsMobile && (
          <button
            type="button"
            aria-label="Auction Controls"
            onClick={() => setShowHostActionsMobile(true)}
            className="fixed bottom-[70px] left-3 z-40 w-11 h-11 rounded-full bg-[#CEA17A] text-[#1a1a1a] shadow-lg shadow-black/40 flex items-center justify-center active:scale-95 transition"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg>
          </button>
        )}

        {/* Purse modal */}
        {mobilePurseTeamId && (() => {
          const team = auctionTeams.find(t => t.id === mobilePurseTeamId)
          if (!team) return null
          const remainingSlots = Math.max(0, team.required_players - team.players_count)
          const maxPossibleBid = team.remaining_purse - ((remainingSlots - 1) * (auction?.min_bid_amount || 40))
          return (
            <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
              <div className="absolute inset-0 bg-black/70" onClick={() => setMobilePurseTeamId(null)} />
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-[#121212] border-t border-[#CEA17A]/20 rounded-t-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[#CEA17A] font-semibold text-sm">Team Purse</h4>
                  <button onClick={() => setMobilePurseTeamId(null)} className="text-[#CEA17A] p-2" aria-label="Close"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <div className="bg-[#1a1a1a]/60 border border-[#CEA17A]/20 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-[#DBD0C0]/60">Team</span><span className="text-[#DBD0C0] font-medium">{team.team_name}</span></div>
                  <div className="flex justify-between"><span className="text-[#DBD0C0]/60">Remaining</span><span className="text-[#CEA17A] font-semibold">₹{team.remaining_purse}</span></div>
                  <div className="flex justify-between"><span className="text-[#DBD0C0]/60">Players</span><span className="text-[#DBD0C0]">{team.players_count}/{team.required_players}</span></div>
                  <div className="flex justify-between"><span className="text-[#DBD0C0]/60">Max Bid</span><span className="text-[#DBD0C0] font-medium">₹{Math.max(0, maxPossibleBid)}</span></div>
                </div>
                <button onClick={() => setMobilePurseTeamId(null)} className="w-full py-3 rounded-lg bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/30 text-sm font-medium">Close</button>
              </div>
            </div>
          )
        })()}

        {/* Host actions sheet */}
        {isAuctionController && showHostActionsMobile && (
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={() => setShowHostActionsMobile(false)} />
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#121212] border-t border-[#CEA17A]/20 rounded-t-2xl space-y-3 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-[#DBD0C0] font-semibold">Host Controls</h4>
                <button onClick={() => setShowHostActionsMobile(false)} className="text-[#CEA17A] p-2" aria-label="Close"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
              </div>
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                {(auction.status === 'draft' || auction.status === 'live' || auction.status === 'paused') && (
                  <button onClick={handleStartPauseAuction} className="px-3 py-3 rounded-lg bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/30">{auction.status === 'draft' ? 'Start Auction' : auction.status === 'live' ? 'Pause Auction' : 'Resume Auction'}</button>
                )}
                <button className="px-3 py-3 rounded-lg bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/30">Change Config</button>
                <button className="px-3 py-3 rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">Reset Auction</button>
                <button className="px-3 py-3 rounded-lg bg-green-500/15 text-green-400 border border-green-500/30">Mark Complete</button>
                <button className="px-3 py-3 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30">Cancel Auction</button>
                <button onClick={handleUndoPlayerAssignment} disabled={!auctionTeams.some(t => t.players_count > 0)} className="px-3 py-3 rounded-lg bg-yellow-600/15 text-yellow-400 border border-yellow-600/30 disabled:opacity-30">Undo Sell</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Photo Preview Dialog */}
      {/* Team Formation Modal (mobile & desktop) */}
      {formationTeamModalId && (() => {
        const team = auctionTeams.find(t => t.id === formationTeamModalId)
        if (!team) return null
        const teamPlayers = auctionPlayers.filter(ap => ap.sold_to === team.id || ap.player_id === team.captain_id)
        return (
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/70" onClick={() => setFormationTeamModalId(null)} />
            <div className="absolute top-10 bottom-10 left-4 right-4 bg-[#121212] border border-[#CEA17A]/30 rounded-2xl p-5 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#CEA17A] font-semibold text-lg">{team.team_name} Players</h3>
                <button onClick={() => setFormationTeamModalId(null)} className="text-[#CEA17A] p-2" aria-label="Close"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
              </div>
              <div className="grid grid-cols-12 gap-3 px-3 py-2 bg-[#1a1a1a]/60 border border-[#CEA17A]/20 rounded-lg text-xs font-semibold text-[#CEA17A] mb-3">
                <div className="col-span-6">Player</div>
                <div className="col-span-3 text-center">Role</div>
                <div className="col-span-3 text-center">Price</div>
              </div>
              <div className="flex-1 overflow-y-auto rounded-lg border border-[#CEA17A]/20">
                {teamPlayers.length ? teamPlayers.map((ap, idx) => {
                  const pl = players.find(p => p.id === ap.player_id)
                  if (!pl) return null
                  const isCaptain = ap.player_id === team.captain_id
                  return (
                    <div key={ap.id} className={`grid grid-cols-12 gap-3 px-3 py-2 items-center text-sm ${idx % 2 === 0 ? 'bg-[#1a1a1a]/40' : 'bg-[#1a1a1a]/20'}`}> 
                      <div className="col-span-6 flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-[#CEA17A]/30 flex-shrink-0 bg-[#CEA17A]/10 flex items-center justify-center text-[10px] text-[#CEA17A]">{pl.profile_pic_url ? <img src={pl.profile_pic_url} className="w-full h-full object-cover"/> : pl.display_name.charAt(0)}</div>
                        <div className="truncate text-[#DBD0C0] text-xs font-medium">{pl.display_name}{isCaptain && <span className="text-[#CEA17A] ml-1">(C)</span>}</div>
                      </div>
                      <div className="col-span-3 text-center text-lg">{getPlayerRoleEmojis(pl)}</div>
                      <div className="col-span-3 text-center text-[#CEA17A] text-xs font-semibold">₹{isCaptain ? 0 : (ap.sold_price || 0)}</div>
                    </div>
                  )
                }) : (
                  <div className="p-6 text-center text-[#DBD0C0]/60 text-sm">No players yet</div>
                )}
              </div>
              <button onClick={() => setFormationTeamModalId(null)} className="mt-4 w-full py-3 rounded-lg bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/30 text-sm font-medium">Close</button>
            </div>
          </div>
        )
      })()}

      {/* Remaining Players Modal (mobile) */}
      {showRemainingPlayersMobile && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowRemainingPlayersMobile(false)} />
          <div className="absolute top-14 bottom-14 left-4 right-4 bg-[#121212] border border-[#CEA17A]/30 rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#CEA17A] font-semibold text-lg">Remaining Players</h3>
              <button onClick={() => setShowRemainingPlayersMobile(false)} className="text-[#CEA17A] p-2" aria-label="Close"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="grid grid-cols-12 gap-3 px-3 py-2 bg-[#1a1a1a]/60 border border-[#CEA17A]/20 rounded-lg text-xs font-semibold text-[#CEA17A] mb-3">
              <div className="col-span-6">Player</div>
              <div className="col-span-3 text-center">Role</div>
              <div className="col-span-3 text-center">Base</div>
            </div>
            <div className="flex-1 overflow-y-auto rounded-lg border border-[#CEA17A]/20">
              {getAvailablePlayers().length ? getAvailablePlayers().map((ap, idx) => {
                const pl = players.find(p => p.id === ap.player_id)
                if (!pl) return null
                return (
                  <div key={ap.id} className={`grid grid-cols-12 gap-3 px-3 py-2 items-center text-sm ${idx % 2 === 0 ? 'bg-[#1a1a1a]/40' : 'bg-[#1a1a1a]/20'}`}>
                    <div className="col-span-6 flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full overflow-hidden border border-[#CEA17A]/30 flex-shrink-0 bg-[#CEA17A]/10 flex items-center justify-center text-[10px] text-[#CEA17A]">{pl.profile_pic_url ? <img src={pl.profile_pic_url} className="w-full h-full object-cover"/> : pl.display_name.charAt(0)}</div>
                      <div className="truncate text-[#DBD0C0] text-xs font-medium">{pl.display_name}</div>
                    </div>
                    <div className="col-span-3 text-center text-lg">{getPlayerRoleEmojis(pl)}</div>
                    <div className="col-span-3 text-center text-[#CEA17A] text-xs font-semibold">₹{pl.skills?.['Base Price'] || 0}</div>
                  </div>
                )
              }) : (
                <div className="p-6 text-center text-[#DBD0C0]/60 text-sm">No remaining players</div>
              )}
            </div>
            <button onClick={() => setShowRemainingPlayersMobile(false)} className="mt-4 w-full py-3 rounded-lg bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/30 text-sm font-medium">Close</button>
          </div>
        </div>
      )}
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

      {/* Global toast notification */}
      {uiNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className={`pointer-events-auto min-w-[260px] max-w-sm rounded-lg px-5 py-4 border shadow-2xl backdrop-blur bg-[#121212]/90 ${
            uiNotice.type === 'error'
              ? 'border-red-400/30 text-red-200'
              : 'border-blue-400/30 text-blue-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {uiNotice.type === 'error' ? (
                  <svg className="h-5 w-5 text-red-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 2a10 10 0 100 20 10 10 0 000-20z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                  </svg>
                )}
              </div>
              <div className="text-sm leading-5 flex-1">{uiNotice.message}</div>
              <button
                onClick={() => setUiNotice(null)}
                className="ml-2 inline-flex items-center justify-center rounded-md p-1 hover:bg-white/10 transition-colors"
                aria-label="Dismiss notification"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      {toasts.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[60] space-y-3">
          {toasts.map(t => (
            <div key={t.id} className={`pointer-events-auto w-72 rounded-lg px-4 py-3 border shadow-lg backdrop-blur bg-[#121212]/90 transition-all ${t.severity==='error'?'border-red-400/30 text-red-200': t.severity==='warning'?'border-yellow-400/30 text-yellow-200':'border-blue-400/30 text-blue-200'}`}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm leading-tight mb-0.5 truncate">{t.title}</div>
                  <div className="text-xs leading-snug opacity-90 break-words">{t.message}</div>
                  {t.actions && t.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {t.actions.map((a,i)=>(
                        <button key={i} onClick={()=>{ a.onClick(); removeToast(t.id) }} className="px-2 py-1 rounded-md text-[11px] font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={()=>removeToast(t.id)} className="p-1 rounded hover:bg-white/10" aria-label="Dismiss">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
