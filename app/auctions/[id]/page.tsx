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

  // Get current player from auction_players data
  const getCurrentPlayer = () => {
    if (!auctionPlayers || auctionPlayers.length === 0) {
      return null
    }
    
    // Find the current player from auction_players
    const currentAuctionPlayer = auctionPlayers.find(ap => ap.current_player === true)
    
    if (!currentAuctionPlayer) {
      // If no current player is set, get the first player by display_order
      const firstPlayer = auctionPlayers
        .filter(ap => ap.status === 'available')
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

  // Fetch bid history from database
  const fetchBidHistory = async () => {
    try {
      const response = await fetch(`/api/auctions/${auctionId}/bids`)
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
    const bid = currentBid || auction?.min_bid_amount || 0
    if (!auction) return bid

    if (auction.use_fixed_increments) {
      return bid + auction.min_increment
    } else {
      // Use custom increment ranges
      const customRanges = auction.auction_config?.custom_increment_ranges
      if (customRanges) {
        if (bid <= 200) {
          return bid + (customRanges.range_0_200 || 20)
        } else if (bid <= 500) {
          return bid + (customRanges.range_200_500 || 50)
        } else {
          return bid + (customRanges.range_500_plus || 100)
        }
      }
      return bid + auction.min_increment
    }
  }

  // Get base price from player skills
  const getPlayerBasePrice = (player: any) => {
    if (!player?.skills?.['Base Price']) return 0
    return parseInt(player.skills['Base Price']) || 0
  }

  // Get current bid from auction_bids table
  const getCurrentBid = () => {
    if (!recentBids || recentBids.length === 0) {
      // If no bids, return min bid or base price
      if (currentPlayer && auction?.use_base_price) {
        const basePrice = getPlayerBasePrice(currentPlayer)
        return Math.max(basePrice, auction.min_bid_amount)
      }
      return auction?.min_bid_amount || 0
    }
    
    // Find the latest winning bid
    const winningBid = recentBids.find(bid => bid.is_winning_bid && !bid.is_undone)
    return winningBid ? winningBid.bid_amount : (auction?.min_bid_amount || 0)
  }

  // Handle placing a bid
  const handlePlaceBid = async (teamId: string, bidAmount: number) => {
    if (!auction || !user) return
    
    setBidLoading(prev => ({ ...prev, [`bid_${teamId}`]: true }))
    
    try {
      const token = secureSessionManager.getToken()
      if (!token) {
        alert('Authentication required to place bid')
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

        // Update team's remaining purse locally
        setAuctionTeams(prev => prev.map(team => 
          team.id === teamId 
            ? { ...team, remaining_purse: team.remaining_purse - bidAmount }
            : team
        ))

        // Refresh bid history from database
        await fetchBidHistory()
      } else {
        const errorData = await response.json()
        alert(`Failed to place bid: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error placing bid:', error)
      alert('Failed to place bid. Please try again.')
    } finally {
      setBidLoading(prev => ({ ...prev, [`bid_${teamId}`]: false }))
    }
  }

  // Handle undoing the latest bid
  const handleUndoBid = async () => {
    if (!auction || !recentBids || recentBids.length === 0) return
    
    setBidLoading(prev => ({ ...prev, undo: true }))
    
    try {
      const token = secureSessionManager.getToken()
      if (!token) {
        alert('Authentication required to undo bid')
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
        // Refresh bid history and auction data
        await fetchBidHistory()
        
        // Refresh auction data to get updated current bid
        const auctionResponse = await fetch(`/api/auctions?id=${auctionId}`)
        if (auctionResponse.ok) {
          const auctionData = await auctionResponse.json()
          setAuction(auctionData.auction)
        }
        
        // Refresh team data to get updated remaining purse
        const teamsResponse = await fetch(`/api/auctions/${auctionId}/teams`)
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json()
          setAuctionTeams(teamsData.teams)
        }
      } else {
        const errorData = await response.json()
        alert(`Failed to undo bid: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error undoing bid:', error)
      alert('Failed to undo bid. Please try again.')
    } finally {
      setBidLoading(prev => ({ ...prev, undo: false }))
    }
  }

  // Handle selling player
  const handleSellPlayer = async () => {
    if (!auction || !currentPlayer || !recentBids || recentBids.length === 0) return
    
    setBidLoading(prev => ({ ...prev, sell: true }))
    
    try {
      const token = secureSessionManager.getToken()
      if (!token) {
        alert('Authentication required to sell player')
        return
      }

      const response = await fetch(`/api/auctions?id=${auctionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          // This would need to be implemented in the API to mark player as sold
          // For now, we'll just update the current player
        })
      })

      if (response.ok) {
        // Move to next player after selling
        const availablePlayers = auctionPlayers
          .filter(ap => ap.status === 'available')
          .sort((a, b) => a.display_order - b.display_order)
        
        const currentIndex = availablePlayers.findIndex(ap => ap.player_id === currentPlayer.player_id)
        
        if (currentIndex !== -1 && currentIndex < availablePlayers.length - 1) {
          const nextAuctionPlayer = availablePlayers[currentIndex + 1]
          const nextPlayerData = players.find(p => p.id === nextAuctionPlayer.player_id)
          
          if (nextPlayerData && nextAuctionPlayer) {
            setCurrentPlayer({
              ...nextPlayerData,
              ...nextAuctionPlayer
            })
          }
        }
        
        await fetchBidHistory()
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

      // Find current player index in the ordered list
      const availablePlayers = auctionPlayers
        .filter(ap => ap.status === 'available')
        .sort((a, b) => a.display_order - b.display_order)
      
      const currentIndex = availablePlayers.findIndex(ap => ap.player_id === currentPlayer.player_id)
      
      if (currentIndex === -1 || currentIndex >= availablePlayers.length - 1) {
        alert('No next player available')
        return
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
          
          // Refresh bid history
          await fetchBidHistory()
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

      // Find current player index in the ordered list
      const availablePlayers = auctionPlayers
        .filter(ap => ap.status === 'available')
        .sort((a, b) => a.display_order - b.display_order)
      
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
          
          // Refresh bid history
          await fetchBidHistory()
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
      } else {
        const errorData = await response.json()
        alert(`Failed to ${auction.status === 'draft' ? 'start' : 'pause/resume'} auction: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error controlling auction:', error)
      alert('Failed to control auction. Please try again.')
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

  if (isUserLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-[#19171b] min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
          <p className="text-[#DBD0C0]">Loading auction...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20 bg-[#19171b] min-h-screen">
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
    )
  }

  if (!auction) {
    return (
      <div className="flex items-center justify-center py-20 bg-[#19171b] min-h-screen">
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
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[#19171b]">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#CEA17A]/10 rotate-45 animate-pulse" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-1/3 right-1/3 w-4 h-4 bg-[#75020f]/8 rotate-12 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/3 left-1/5 w-3 h-3 bg-[#CEA17A]/6 rotate-45 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-2/3 right-1/4 w-2 h-2 bg-[#75020f]/10 rotate-12 animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-6 h-6 bg-[#CEA17A]/4 rotate-45 animate-pulse" style={{animationDelay: '3.5s'}}></div>
        <div className="absolute top-3/4 left-1/2 w-3 h-3 bg-[#75020f]/5 rotate-12 animate-pulse" style={{animationDelay: '1.2s'}}></div>
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
                {currentPlayer && auctionPlayers && (
                  <div className="text-sm text-[#DBD0C0]/70 mb-2">
                    Player {currentPlayer.display_order} of {auctionPlayers.filter(ap => ap.status === 'available').length}
                  </div>
                )}
                <button 
                  onClick={handlePreviousPlayer}
                  disabled={!currentPlayer || !auctionPlayers || auctionPlayers.filter(ap => ap.status === 'available').sort((a, b) => a.display_order - b.display_order).findIndex(ap => ap.player_id === currentPlayer.player_id) <= 0 || actionLoading.previousPlayer}
                  className={`w-full px-4 py-2 border rounded-lg transition-all duration-150 flex items-center justify-center ${
                    !currentPlayer || !auctionPlayers || auctionPlayers.filter(ap => ap.status === 'available').sort((a, b) => a.display_order - b.display_order).findIndex(ap => ap.player_id === currentPlayer.player_id) <= 0 || actionLoading.previousPlayer
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
                  disabled={!currentPlayer || !auctionPlayers || auctionPlayers.filter(ap => ap.status === 'available').sort((a, b) => a.display_order - b.display_order).findIndex(ap => ap.player_id === currentPlayer.player_id) >= auctionPlayers.filter(ap => ap.status === 'available').length - 1 || actionLoading.nextPlayer}
                  className={`w-full px-4 py-2 border rounded-lg transition-all duration-150 flex items-center justify-center ${
                    !currentPlayer || !auctionPlayers || auctionPlayers.filter(ap => ap.status === 'available').sort((a, b) => a.display_order - b.display_order).findIndex(ap => ap.player_id === currentPlayer.player_id) >= auctionPlayers.filter(ap => ap.status === 'available').length - 1 || actionLoading.nextPlayer
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
                      Next Player
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
                <button className="w-full px-4 py-2 bg-red-500/15 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/25 transition-all duration-150 flex items-center justify-center">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Undo Player Assignment
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
                    <span>Player #{currentPlayer.display_order}</span>
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
          <div className="xl:col-span-2 bg-[#1a1a1a]/50 rounded-xl p-6 border border-[#CEA17A]/10">
            <h2 className="text-2xl font-bold text-[#DBD0C0] mb-6">Live Bids</h2>
            
            {currentPlayer ? (
              <div className="space-y-6">
                {/* Current Bid Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#19171b]/50 rounded-lg p-4 border border-[#CEA17A]/10">
                    <h3 className="text-lg font-semibold text-[#CEA17A] mb-2">Current Bid</h3>
                    <div className="text-3xl font-bold text-[#DBD0C0]">₹{getCurrentBid()}</div>
                    {recentBids && recentBids.length > 0 && (
                      <div className="text-sm text-[#DBD0C0]/70 mt-1">
                        by {recentBids.find(bid => bid.is_winning_bid && !bid.is_undone)?.team_name || 'No bids yet'}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-[#19171b]/50 rounded-lg p-4 border border-[#CEA17A]/10">
                    <h3 className="text-lg font-semibold text-[#CEA17A] mb-2">Next Bid</h3>
                    <div className="text-3xl font-bold text-[#DBD0C0]">₹{calculateNextBid()}</div>
                    <div className="text-sm text-[#DBD0C0]/70 mt-1">
                      Min increment: ₹{auction?.min_increment || 20}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={handleSellPlayer}
                    className="px-6 py-3 bg-green-500/15 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/25 transition-all duration-150 flex items-center"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Sell Player
                  </button>
                  
                  <button 
                    onClick={handleUndoBid}
                    disabled={!recentBids || recentBids.length === 0}
                    className="px-6 py-3 bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/25 transition-all duration-150 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Undo Bid
                  </button>
                </div>

                {/* Captain Bid Buttons */}
                <div>
                  <h3 className="text-lg font-semibold text-[#CEA17A] mb-4">Captain Bids</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {auctionTeams.map((team) => {
                      const nextBid = calculateNextBid()
                      const canAfford = team.remaining_purse >= nextBid
                      const isWinning = recentBids?.find(bid => bid.is_winning_bid && !bid.is_undone)?.team_id === team.id
                      
                      return (
                        <button
                          key={team.id}
                          onClick={() => handlePlaceBid(team.id, nextBid)}
                          disabled={!canAfford || bidLoading[`bid_${team.id}`]}
                          className={`p-4 rounded-lg border transition-all duration-150 flex items-center justify-between ${
                            isWinning
                              ? 'bg-green-500/15 text-green-400 border-green-500/30'
                              : canAfford
                              ? 'bg-[#CEA17A]/15 text-[#CEA17A] border-[#CEA17A]/30 hover:bg-[#CEA17A]/25'
                              : 'bg-gray-500/10 text-gray-500 border-gray-500/20 cursor-not-allowed'
                          }`}
                        >
                          <div className="text-left">
                            <div className="font-semibold">{team.team_name}</div>
                            <div className="text-sm opacity-75">₹{team.remaining_purse} remaining</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">₹{nextBid}</div>
                            {bidLoading[`bid_${team.id}`] && (
                              <svg className="animate-spin h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Recent Bids Section */}
                <div>
                  <h3 className="text-lg font-semibold text-[#CEA17A] mb-4">Recent Bids</h3>
                  <div className="bg-[#19171b]/50 rounded-lg p-4 border border-[#CEA17A]/10 max-h-64 overflow-y-auto">
                    {recentBids && recentBids.length > 0 ? (
                      <div className="space-y-2">
                        {getLatestBidsByCaptain().map((bid, index) => (
                          <div
                            key={bid.id}
                            className={`p-3 rounded-lg border transition-all duration-150 ${
                              bid.is_winning_bid && !bid.is_undone
                                ? 'bg-green-500/15 text-green-400 border-green-500/30 border-l-4 border-l-green-500'
                                : 'bg-[#19171b]/30 border-[#CEA17A]/10'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="font-semibold">{bid.team_name}</div>
                                {bid.is_winning_bid && !bid.is_undone && (
                                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                                    WINNING
                                  </span>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-bold">₹{bid.bid_amount}</div>
                                <div className="text-xs opacity-75">
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
                      <div className="text-center py-8">
                        <div className="text-[#DBD0C0]/50 text-sm">No bids placed yet</div>
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
