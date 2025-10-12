'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { secureSessionManager } from '@/src/lib/secure-session'

interface Tournament {
  id: string
  name: string
  format: string
  selected_teams: number
  tournament_date: string
  description?: string
  host_id: string
  status: string
  total_slots: number
  venue?: string
  google_maps_link?: string
  community_restrictions?: string[]
  base_price_restrictions?: string[]
  min_base_price?: number
  max_base_price?: number
  created_at: string
  updated_at: string
  filled_slots?: number
  waitlist_count?: number
  available_slots?: number
}

interface User {
  id: string
  email: string
  username?: string
  firstname?: string
  lastname?: string
  role: string
}

interface Player {
  id: string
  display_name: string
  profile_pic_url?: string
  user_id?: string
  skills?: { [skillName: string]: string | string[] }
}

const fetcher = async (url: string) => {
  const response = await fetch('/api/tournaments')
  if (!response.ok) {
    throw new Error('Failed to fetch tournaments')
  }
  const result = await response.json()
  return result.tournaments || []
}

export default function TournamentAuctionCreatePage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [isUserLoading, setIsUserLoading] = useState(true)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageModal, setMessageModal] = useState({ type: '', message: '' })
  const [creatingAuction, setCreatingAuction] = useState<string | null>(null)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [auctionConfig, setAuctionConfig] = useState<any>({
    tournament_id: '',
    max_tokens_per_captain: 2000,
    min_bid_amount: 40,
    use_base_price: false,
    min_increment: 20,
    use_fixed_increments: true,
    timer_seconds: 20,
    player_order_type: 'base_price_desc',
    selected_players: [],
    captains: []
  })
  const [tournamentPlayers, setTournamentPlayers] = useState<Player[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [isRestoringState, setIsRestoringState] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const playersPerPage = 10

  const { data: tournaments, error, isLoading: tournamentsLoading, mutate } = useSWR<Tournament[]>('/api/tournaments', fetcher)

  // Load saved state from localStorage on component mount
  useEffect(() => {
    const savedState = localStorage.getItem('auction-config-state')
    if (savedState) {
      setIsRestoringState(true)
      try {
        const parsedState = JSON.parse(savedState)
        
        // Check if this is old data format (missing display_name in captains)
        const hasOldCaptainFormat = parsedState.auctionConfig?.captains?.some((captain: any) => 
          !captain.display_name && captain.player_name
        )
        
        // Check if this is old default values
        const hasOldDefaults = parsedState.auctionConfig?.min_bid_amount === 100 || 
                              parsedState.auctionConfig?.min_increment === 50 || 
                              parsedState.auctionConfig?.timer_seconds === 30 ||
                              parsedState.auctionConfig?.use_base_price === true
        
        if (hasOldCaptainFormat || hasOldDefaults) {
          console.log('Clearing old localStorage data due to format changes')
          localStorage.removeItem('auction-config-state')
          setIsRestoringState(false)
          return
        }
        
        if (parsedState.selectedTournament) {
          setSelectedTournament(parsedState.selectedTournament)
          setCurrentStep(parsedState.currentStep || 1)
          setAuctionConfig(parsedState.auctionConfig || {
            tournament_id: '',
            max_tokens_per_captain: 2000,
            min_bid_amount: 40,
            use_base_price: false,
            min_increment: 20,
            use_fixed_increments: true,
            timer_seconds: 20,
            player_order_type: 'base_price_desc',
            selected_players: [],
            captains: []
          })
          setTournamentPlayers(parsedState.tournamentPlayers || [])
          setCurrentPage(parsedState.currentPage || 1)
        }
      } catch (error) {
        console.error('Error loading saved state:', error)
        // Clear invalid state
        localStorage.removeItem('auction-config-state')
      } finally {
        setIsRestoringState(false)
      }
    }
  }, [])

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (selectedTournament) {
      const stateToSave = {
        selectedTournament,
        currentStep,
        auctionConfig,
        tournamentPlayers,
        currentPage
      }
      localStorage.setItem('auction-config-state', JSON.stringify(stateToSave))
    }
  }, [selectedTournament, currentStep, auctionConfig, tournamentPlayers, currentPage])

  // Cleanup effect - clear saved state when component unmounts
  useEffect(() => {
    return () => {
      // Only clear if we're not in the middle of a successful creation
      const savedState = localStorage.getItem('auction-config-state')
      if (savedState) {
        // Check if we're about to redirect (success case)
        const isRedirecting = window.location.href.includes('/auctions/')
        if (!isRedirecting) {
          // Clear state after a delay to allow for navigation
          setTimeout(() => {
            localStorage.removeItem('auction-config-state')
          }, 1000)
        }
      }
    }
  }, [])

  // Check user authentication and role
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get user from session manager
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
            setIsHost(result.data.role === 'host' || result.data.role === 'admin')
          }
        }
      } catch (error) {
        // Error handling
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
              setIsHost(result.data.role === 'host' || result.data.role === 'admin')
            }
          })
          .catch(error => {
            // Error handling
          })
      } else {
        setUserProfile(null)
        setIsHost(false)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleSelectTournament = async (tournament: Tournament) => {
    setSelectedTournament(tournament)
    setAuctionConfig((prev: any) => ({ ...prev, tournament_id: tournament.id }))
    setCurrentStep(1)
    setCurrentPage(1)
    
    // Fetch tournament players with skills
    setLoadingPlayers(true)
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/players`)
      if (response.ok) {
        const result = await response.json()
        // Sort players alphabetically by display_name
        const sortedPlayers = (result.players || []).sort((a: Player, b: Player) => 
          a.display_name.localeCompare(b.display_name)
        )
        setTournamentPlayers(sortedPlayers)
      } else {
        setMessageModal({ type: 'error', message: 'Failed to fetch tournament players' })
        setShowMessageModal(true)
      }
    } catch (error) {
      setMessageModal({ type: 'error', message: 'Error fetching tournament players' })
      setShowMessageModal(true)
    } finally {
      setLoadingPlayers(false)
    }
  }

  // Pagination functions
  const getCurrentPagePlayers = () => {
    const startIndex = (currentPage - 1) * playersPerPage
    const endIndex = startIndex + playersPerPage
    return tournamentPlayers.slice(startIndex, endIndex)
  }

  const getTotalPages = () => {
    return Math.ceil(tournamentPlayers.length / playersPerPage)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleStep1Next = () => {
    const playerCount = tournamentPlayers.length
    const teamCount = selectedTournament?.selected_teams || 0
    
    // Validate player count is multiple of team count
    if (playerCount % teamCount !== 0) {
      setMessageModal({ 
        type: 'error', 
        message: `Player count (${playerCount}) must be a multiple of team count (${teamCount}). Please adjust the player selection.` 
      })
      setShowMessageModal(true)
      return
    }
    
    setAuctionConfig((prev: any) => ({ ...prev, selected_players: tournamentPlayers }))
    setCurrentStep(2)
  }

  const handleStep2Next = () => {
    // Validate all captains are selected
    const teamCount = selectedTournament?.selected_teams || 0
    if (auctionConfig.captains.length !== teamCount) {
      setMessageModal({ 
        type: 'error', 
        message: `Please select ${teamCount} captains for ${teamCount} teams.` 
      })
      setShowMessageModal(true)
      return
    }
    
    // Validate all team names are provided
    const missingTeamNames = auctionConfig.captains.filter((captain: any) => !captain.team_name)
    if (missingTeamNames.length > 0) {
      setMessageModal({ 
        type: 'error', 
        message: 'Please provide team names for all selected captains.' 
      })
      setShowMessageModal(true)
      return
    }
    
    // Proceed to Step 3
    setCurrentStep(3)
  }

  const handleStep3Next = () => {
    // Proceed to Step 4 (Review)
    setCurrentStep(4)
  }

  const saveAuctionDraft = async () => {
    setCreatingAuction(selectedTournament?.id || '')
    try {
      const token = secureSessionManager.getToken()
      if (!token) {
        setMessageModal({ type: 'error', message: 'Authentication required to create auction' })
        setShowMessageModal(true)
        return
      }

      // Create auction with current configuration
      const response = await fetch('/api/auctions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tournament_id: auctionConfig.tournament_id,
          max_tokens_per_captain: auctionConfig.max_tokens_per_captain,
          min_bid_amount: auctionConfig.min_bid_amount,
          timer_seconds: auctionConfig.timer_seconds,
          use_base_price: auctionConfig.use_base_price,
          min_increment: auctionConfig.min_increment,
          use_fixed_increments: auctionConfig.use_fixed_increments,
          player_order_type: auctionConfig.player_order_type,
          captains: auctionConfig.captains,
          selected_players: tournamentPlayers
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setMessageModal({ type: 'success', message: 'Auction draft created successfully!' })
        setShowMessageModal(true)
        
        // Clear saved state on successful creation
        clearSavedState()
        
        // Auto-close success message after 2 seconds and redirect
        setTimeout(() => {
          setShowMessageModal(false)
          // Redirect to the created auction
          window.location.href = `/auctions/${result.auction.id}`
        }, 2000)
      } else {
        const error = await response.json()
        setMessageModal({ type: 'error', message: `Error creating auction: ${error.error || 'Unknown error'}` })
        setShowMessageModal(true)
      }
    } catch (error) {
      setMessageModal({ type: 'error', message: 'Error creating auction. Please try again.' })
      setShowMessageModal(true)
    } finally {
      setCreatingAuction(null)
    }
  }

  const handleCaptainSelection = (playerId: string, isSelected: boolean) => {
    if (isSelected) {
      // Check if we can add more captains
      if (auctionConfig.captains.length >= (selectedTournament?.selected_teams || 0)) {
        setMessageModal({ 
          type: 'error', 
          message: `You can only select ${selectedTournament?.selected_teams || 0} captains for this tournament.` 
        })
        setShowMessageModal(true)
        return
      }
      
      // Add captain
      const player = tournamentPlayers.find(p => p.id === playerId)
      if (player) {
        const newCaptain = { 
          id: playerId,
          player_id: playerId, 
          display_name: player.display_name,
          player_name: player.display_name, 
          profile_pic_url: player.profile_pic_url,
          team_name: `${player.display_name}'s Team` 
        }
        setAuctionConfig((prev: any) => ({
          ...prev,
          captains: [...prev.captains, newCaptain]
        }))
      }
    } else {
      // Remove captain
      setAuctionConfig((prev: any) => ({
        ...prev,
        captains: prev.captains.filter((captain: any) => captain.player_id !== playerId)
      }))
    }
  }

  const handleTeamNameChange = (playerId: string, teamName: string) => {
    setAuctionConfig((prev: any) => ({
      ...prev,
      captains: prev.captains.map((captain: any) => 
        captain.player_id === playerId ? { ...captain, team_name: teamName } : captain
      )
    }))
  }

  const goBack = () => {
    if (currentStep === 1) {
      // Go back to tournament selection
      setSelectedTournament(null)
      setCurrentStep(1)
      setAuctionConfig({
        tournament_id: '',
        max_tokens_per_captain: 2000,
        min_bid_amount: 40,
        use_base_price: false,
        min_increment: 20,
        use_fixed_increments: true,
        timer_seconds: 20,
        player_order_type: 'base_price_desc',
        selected_players: [],
        captains: []
      })
      setTournamentPlayers([])
      // Clear saved state
      localStorage.removeItem('auction-config-state')
    } else {
      setCurrentStep(currentStep - 1)
    }
  }

  const clearSavedState = () => {
    localStorage.removeItem('auction-config-state')
    setSelectedTournament(null)
    setCurrentStep(1)
    setAuctionConfig({
      tournament_id: '',
      max_tokens_per_captain: 2000,
      min_bid_amount: 40,
      use_base_price: false,
      min_increment: 20,
      use_fixed_increments: true,
      timer_seconds: 20,
      player_order_type: 'base_price_desc',
      selected_players: [],
      captains: []
    })
    setTournamentPlayers([])
    setCurrentPage(1)
  }

  if (isUserLoading || isRestoringState) {
    return (
      <div className="flex items-center justify-center py-20 bg-[#19171b] min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto"></div>
          <p className="mt-4 text-[#DBD0C0]">
            {isRestoringState ? 'Restoring your progress...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  // Check if user has permission to create auctions
  if (!isHost) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Section Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
        <div className="absolute inset-0" 
             style={{
               background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
             }}></div>
        {/* Enhanced Background Patterns */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(117,2,15,0.1)_1px,transparent_0)] bg-[length:20px_20px] opacity-30"></div>
        <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(117,2,15,0.05)_60deg,transparent_120deg)] opacity-60"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(117,2,15,0.02)_50%,transparent_75%)] bg-[length:40px_40px] opacity-20"></div>
        
        <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-red-400 text-6xl mb-4">🚫</div>
            <h1 className="text-4xl font-bold text-[#DBD0C0] mb-4">Access Denied</h1>
            <p className="text-[#CEA17A] mb-8 max-w-md mx-auto">
              You need to be a Host or Admin to create auctions. Please contact an administrator if you believe this is an error.
            </p>
            <Link
              href="/auctions"
              className="inline-flex items-center px-6 py-3 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 font-medium"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Auctions
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-[#19171b] min-h-screen">
        <div className="bg-red-500/20 text-red-300 border border-red-500/30 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Error loading tournaments</h2>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Section Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
      <div className="absolute inset-0" 
           style={{
             background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
           }}></div>
      {/* Enhanced Background Patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(117,2,15,0.1)_1px,transparent_0)] bg-[length:20px_20px] opacity-30"></div>
      <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(117,2,15,0.05)_60deg,transparent_120deg)] opacity-60"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(117,2,15,0.02)_50%,transparent_75%)] bg-[length:40px_40px] opacity-20"></div>
      
      {/* Sharp Geometric Patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(206,161,122,0.03)_50%,transparent_60%)] bg-[length:60px_60px] opacity-25"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(117,2,15,0.04)_0%,transparent_70%)] opacity-30"></div>
      <div className="absolute inset-0 bg-[conic-gradient(from_45deg_at_25%_25%,transparent_0deg,rgba(206,161,122,0.02)_90deg,transparent_180deg)] opacity-20"></div>
      
      {/* Animated Grid Lines */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#CEA17A] to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>
      
      {/* Background Glowing Orbs - Behind Content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#75020f]/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-[#51080d]/4 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-[#2b0307]/5 rounded-full blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-[#CEA17A]/2 rounded-full blur-lg animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/2 left-1/2 w-56 h-56 bg-[#75020f]/3 rounded-full blur-md animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>
      
      {/* Sharp Geometric Elements - Behind Content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-[#CEA17A]/6 rotate-45 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-[#75020f]/8 rotate-12 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-[#51080d]/7 rotate-45 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-5 h-5 bg-[#2b0307]/9 rotate-12 animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 right-10 w-4 h-4 bg-[#CEA17A]/5 rotate-45 animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-2/3 left-1/5 w-3 h-3 bg-[#75020f]/6 rotate-12 animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-1/3 right-1/5 w-5 h-5 bg-[#51080d]/8 rotate-45 animate-pulse" style={{animationDelay: '2.5s'}}></div>
        <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-[#2b0307]/7 rotate-12 animate-pulse" style={{animationDelay: '0.8s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-6 h-6 bg-[#CEA17A]/4 rotate-45 animate-pulse" style={{animationDelay: '3.5s'}}></div>
        <div className="absolute top-3/4 left-1/2 w-3 h-3 bg-[#75020f]/5 rotate-12 animate-pulse" style={{animationDelay: '1.2s'}}></div>
      </div>
      
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 min-h-screen flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0 flex-shrink-0">
          <div>
            <h1 className="text-4xl font-bold text-[#DBD0C0]">Create Tournament Auction</h1>
            <p className="text-[#CEA17A] mt-2">
              Select a tournament to create an auction for player selection
            </p>
          </div>
          <div className="flex space-x-3">
            {selectedTournament ? (
              <button
                onClick={goBack}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-[#19171b]/50 text-[#DBD0C0] border border-[#CEA17A]/20 shadow-lg shadow-[#CEA17A]/5 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/10 hover:border-[#CEA17A]/30 transition-all duration-150 font-medium text-sm sm:text-base"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">{currentStep === 1 ? 'Back to Tournament Selection' : 'Previous Step'}</span>
                <span className="sm:hidden">{currentStep === 1 ? 'Back' : 'Previous'}</span>
              </button>
            ) : (
              <Link
                href="/auctions/create"
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-[#19171b]/50 text-[#DBD0C0] border border-[#CEA17A]/20 shadow-lg shadow-[#CEA17A]/5 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/10 hover:border-[#CEA17A]/30 transition-all duration-150 font-medium text-sm sm:text-base"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Back to Create Auction</span>
                <span className="sm:hidden">Back</span>
              </Link>
            )}
            
            {/* Debug: Clear localStorage button - only in development */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={clearSavedState}
                className="px-3 py-1 text-xs bg-red-600/20 text-red-400 border border-red-600/30 rounded hover:bg-red-600/30 transition-all duration-150"
              >
                Clear Data
              </button>
            )}
            
            {/* Next Button - Only show when in steps */}
            {selectedTournament && currentStep === 1 && (
              <button
                onClick={handleStep1Next}
                disabled={tournamentPlayers.length % (selectedTournament.selected_teams || 1) !== 0}
                className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg transition-all duration-150 font-medium text-sm sm:text-base ${
                  tournamentPlayers.length % (selectedTournament.selected_teams || 1) !== 0
                    ? 'bg-[#CEA17A]/10 text-[#CEA17A]/50 cursor-not-allowed'
                    : 'bg-[#CEA17A]/15 text-[#CEA17A] hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40'
                }`}
              >
                <span className="hidden sm:inline">Next: Select Captains</span>
                <span className="sm:hidden">Next</span>
                <svg className="h-4 w-4 sm:h-5 sm:w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
            
            {selectedTournament && currentStep === 2 && (
              <button
                onClick={handleStep2Next}
                disabled={auctionConfig.captains.length !== selectedTournament.selected_teams}
                className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg transition-all duration-150 font-medium text-sm sm:text-base ${
                  auctionConfig.captains.length !== selectedTournament.selected_teams
                    ? 'bg-[#CEA17A]/10 text-[#CEA17A]/50 cursor-not-allowed'
                    : 'bg-[#CEA17A]/15 text-[#CEA17A] hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40'
                }`}
              >
                <span className="hidden sm:inline">Next: Auction Config</span>
                <span className="sm:hidden">Next</span>
                <svg className="h-4 w-4 sm:h-5 sm:w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
            
            {selectedTournament && currentStep === 3 && (
              <button
                onClick={handleStep3Next}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg transition-all duration-150 font-medium text-sm sm:text-base bg-[#CEA17A]/15 text-[#CEA17A] hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40"
              >
                <span className="hidden sm:inline">Next: Review & Begin</span>
                <span className="sm:hidden">Next</span>
                <svg className="h-4 w-4 sm:h-5 sm:w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
            
            {selectedTournament && currentStep === 4 && (
              <button
                onClick={saveAuctionDraft}
                disabled={creatingAuction === selectedTournament.id}
                className={`w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg transition-all duration-150 font-medium text-sm sm:text-base ${
                  creatingAuction === selectedTournament.id
                    ? 'bg-[#CEA17A]/25 text-[#CEA17A]/70 cursor-wait'
                    : 'bg-[#CEA17A]/15 text-[#CEA17A] hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40'
                }`}
              >
                {creatingAuction === selectedTournament.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#CEA17A] mr-2"></div>
                    <span className="hidden sm:inline">Creating Auction...</span>
                    <span className="sm:hidden">Creating...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Begin Auction</span>
                    <span className="sm:hidden">Begin</span>
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Multi-Step Form or Tournament Selection */}
        <div className="flex-grow flex flex-col">
        {!selectedTournament ? (
          /* Tournament Selection */
          tournamentsLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A]"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto">
              {tournaments?.map((tournament) => (
                <div key={tournament.id} className="bg-[#19171b]/50 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-150 border border-[#CEA17A]/10 hover:animate-border-glow flex flex-col h-full">
                  <div className="p-6 flex flex-col h-full">
                    {/* Tournament Header */}
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-[#DBD0C0] line-clamp-2">
                        {tournament.name}
                      </h3>
                      <span className={`w-24 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm border text-center ${
                        tournament.status === 'registration_open' 
                          ? 'bg-green-500/15 text-green-300 border-green-500/25 shadow-lg shadow-green-500/10'
                          : tournament.status === 'completed'
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/25 shadow-lg shadow-blue-500/10'
                          : tournament.status === 'in_progress'
                          ? 'bg-orange-500/15 text-orange-300 border-orange-500/25 shadow-lg shadow-orange-500/10'
                          : tournament.status === 'draft'
                          ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25 shadow-lg shadow-yellow-500/10'
                          : 'bg-[#3E4E5A]/20 text-[#CEA17A] border border-[#CEA17A]/30'
                      }`}>
                        {tournament.status === 'registration_open' ? 'Open' : 
                         tournament.status === 'completed' ? 'Completed' :
                         tournament.status === 'in_progress' ? 'In Progress' : 
                         tournament.status === 'draft' ? 'Draft' : tournament.status}
                      </span>
                    </div>

                    {/* Tournament Details */}
                    <div className="space-y-3 flex-grow">
                      <div className="flex justify-between items-center">
                        <span className="text-[#CEA17A]">Format:</span>
                        <span className="font-semibold text-[#DBD0C0]">{tournament.format}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-[#CEA17A]">Teams:</span>
                        <span className="font-semibold text-[#DBD0C0]">{tournament.selected_teams}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-[#CEA17A]">Total Slots:</span>
                        <span className="font-semibold text-[#DBD0C0]">{tournament.total_slots}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-[#CEA17A]">Filled Slots:</span>
                        <span className="font-semibold text-[#DBD0C0]">{tournament.filled_slots || 0}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-[#CEA17A]">Date:</span>
                        <span className="font-semibold text-[#DBD0C0]">
                          {new Date(tournament.tournament_date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>

                      {/* Venue Information */}
                      {tournament.venue && (
                        <div className="space-y-1">
                          <span className="text-[#CEA17A] text-sm">Venue:</span>
                          <p className="text-sm text-[#DBD0C0] font-medium">{tournament.venue}</p>
                        </div>
                      )}

                      {/* Description */}
                      {tournament.description && (
                        <div className="space-y-1">
                          <span className="text-[#CEA17A] text-sm">Description:</span>
                          <p className="text-sm text-[#DBD0C0] line-clamp-2">{tournament.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-6">
                      <button
                        onClick={() => handleSelectTournament(tournament)}
                        className="w-full px-4 py-3 border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg transition-all duration-150 font-medium text-center flex items-center justify-center bg-[#CEA17A]/15 text-[#CEA17A] hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40"
                      >
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Configure Auction
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Multi-Step Configuration Form */
          <div className="w-full">
            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-center space-x-4">
                <div className={`flex items-center ${currentStep >= 1 ? 'text-[#CEA17A]' : 'text-[#3E4E5A]'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 1 ? 'border-[#CEA17A] bg-[#CEA17A]/20' : 'border-[#3E4E5A]'
                  }`}>
                    {currentStep > 1 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-sm font-bold">1</span>
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium">Players</span>
                </div>
                <div className={`w-8 h-px ${currentStep >= 2 ? 'bg-[#CEA17A]' : 'bg-[#3E4E5A]'}`}></div>
                <div className={`flex items-center ${currentStep >= 2 ? 'text-[#CEA17A]' : 'text-[#3E4E5A]'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 2 ? 'border-[#CEA17A] bg-[#CEA17A]/20' : 'border-[#3E4E5A]'
                  }`}>
                    {currentStep > 2 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-sm font-bold">2</span>
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium">Captains</span>
                </div>
                <div className={`w-8 h-px ${currentStep >= 3 ? 'bg-[#CEA17A]' : 'bg-[#3E4E5A]'}`}></div>
                <div className={`flex items-center ${currentStep >= 3 ? 'text-[#CEA17A]' : 'text-[#3E4E5A]'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 3 ? 'border-[#CEA17A] bg-[#CEA17A]/20' : 'border-[#3E4E5A]'
                  }`}>
                    {currentStep > 3 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-sm font-bold">3</span>
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium">Config</span>
                </div>
                <div className={`w-8 h-px ${currentStep >= 4 ? 'bg-[#CEA17A]' : 'bg-[#3E4E5A]'}`}></div>
                <div className={`flex items-center ${currentStep >= 4 ? 'text-[#CEA17A]' : 'text-[#3E4E5A]'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 4 ? 'border-[#CEA17A] bg-[#CEA17A]/20' : 'border-[#3E4E5A]'
                  }`}>
                    <span className="text-sm font-bold">4</span>
                  </div>
                  <span className="ml-2 text-sm font-medium">Review</span>
                </div>
              </div>
            </div>

            {/* Step Content */}
            {currentStep === 1 && (
              <div className="bg-[#19171b]/50 rounded-xl p-4 sm:p-6 lg:p-8 border border-[#CEA17A]/10 w-full flex flex-col" style={{maxHeight: 'calc(100vh - 200px)'}}>
                <h2 className="text-2xl font-bold text-[#DBD0C0] mb-4 sm:mb-6 flex-shrink-0">Step 1: Tournament Players</h2>
                
                {loadingPlayers ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CEA17A]"></div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 sm:mb-6 flex-shrink-0">
                      <h3 className="text-lg font-semibold text-[#DBD0C0] mb-2">{selectedTournament.name}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                        <div className="bg-[#19171b]/30 rounded-lg p-3">
                          <span className="text-[#CEA17A]">Teams:</span>
                          <span className="ml-2 font-semibold text-[#DBD0C0]">{selectedTournament.selected_teams}</span>
                        </div>
                        <div className="bg-[#19171b]/30 rounded-lg p-3">
                          <span className="text-[#CEA17A]">Players:</span>
                          <span className="ml-2 font-semibold text-[#DBD0C0]">{tournamentPlayers.length}</span>
                        </div>
                        <div className="bg-[#19171b]/30 rounded-lg p-3">
                          <span className="text-[#CEA17A]">Per Team:</span>
                          <span className="ml-2 font-semibold text-[#DBD0C0]">
                            {selectedTournament.selected_teams > 0 ? Math.floor(tournamentPlayers.length / selectedTournament.selected_teams) : 0}
                          </span>
                        </div>
                        <div className="bg-[#19171b]/30 rounded-lg p-3">
                          <span className="text-[#CEA17A]">Valid:</span>
                          <span className={`ml-2 font-semibold ${
                            tournamentPlayers.length % (selectedTournament.selected_teams || 1) === 0 
                              ? 'text-green-300' 
                              : 'text-red-300'
                          }`}>
                            {tournamentPlayers.length % (selectedTournament.selected_teams || 1) === 0 ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4 sm:mb-6 flex-grow flex flex-col" style={{minHeight: '300px'}}>
                      <div className="flex justify-between items-center mb-3 flex-shrink-0">
                        <h4 className="text-md font-semibold text-[#DBD0C0]">Registered Players ({tournamentPlayers.length})</h4>
                        <div className="text-sm text-[#CEA17A]">
                          Page {currentPage} of {getTotalPages()}
                        </div>
                      </div>
                      
                      {/* Players Table */}
                      <div className="flex-grow overflow-auto" style={{maxHeight: '400px'}}>
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-[#19171b] z-10">
                            <tr className="border-b border-[#CEA17A]/20">
                              <th className="text-left py-3 px-4 text-[#CEA17A] font-semibold">#</th>
                              <th className="text-left py-3 px-4 text-[#CEA17A] font-semibold">Photo</th>
                              <th className="text-left py-3 px-4 text-[#CEA17A] font-semibold">Player Name</th>
                              <th className="text-left py-3 px-4 text-[#CEA17A] font-semibold">Role</th>
                              <th className="text-left py-3 px-4 text-[#CEA17A] font-semibold">Base Price</th>
                              <th className="text-left py-3 px-4 text-[#CEA17A] font-semibold">Batting Style</th>
                              <th className="text-left py-3 px-4 text-[#CEA17A] font-semibold">Bowling Style</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getCurrentPagePlayers().map((player, index) => {
                              const globalIndex = (currentPage - 1) * playersPerPage + index + 1;
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
                                return "🏏";
                              };
                              
                              return (
                                <tr key={player.id} className="border-b border-[#CEA17A]/10 hover:bg-[#19171b]/30 transition-colors">
                                  <td className="py-3 px-4 text-[#DBD0C0] font-medium">{globalIndex}</td>
                                  <td className="py-3 px-4">
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
                                              parent.innerHTML = `
                                                <div class="w-full h-full bg-[#CEA17A]/20 flex items-center justify-center">
                                                  <span class="text-[#CEA17A] text-sm font-bold">
                                                    ${player.display_name.charAt(0).toUpperCase()}
                                                  </span>
                                                </div>
                                              `;
                                            }
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-[#CEA17A]/20 flex items-center justify-center">
                                          <span className="text-[#CEA17A] text-sm font-bold">
                                            {player.display_name.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-[#DBD0C0] font-medium">{player.display_name}</td>
                                  <td className="py-3 px-4 text-[#DBD0C0] text-lg">{getRoleEmoji(role)}</td>
                                  <td className="py-3 px-4 text-[#DBD0C0]">{basePrice || "N/A"}</td>
                                  <td className="py-3 px-4 text-[#DBD0C0]">{battingStyle || "N/A"}</td>
                                  <td className="py-3 px-4 text-[#DBD0C0]">{bowlingStyle || "N/A"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Pagination */}
                      {getTotalPages() > 1 && (
                        <div className="flex justify-center items-center space-x-2 mt-4 pt-4 border-t border-[#CEA17A]/20">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-2 text-sm bg-[#19171b]/50 text-[#DBD0C0] border border-[#CEA17A]/20 rounded-lg hover:bg-[#CEA17A]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                          >
                            Previous
                          </button>
                          
                          {/* Page Numbers */}
                          <div className="flex space-x-1">
                            {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
                                  currentPage === page
                                    ? 'bg-[#CEA17A]/25 text-[#CEA17A] border border-[#CEA17A]/40'
                                    : 'bg-[#19171b]/50 text-[#DBD0C0] border border-[#CEA17A]/20 hover:bg-[#CEA17A]/10'
                                }`}
                              >
                                {page}
                              </button>
                            ))}
                          </div>
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === getTotalPages()}
                            className="px-3 py-2 text-sm bg-[#19171b]/50 text-[#DBD0C0] border border-[#CEA17A]/20 rounded-lg hover:bg-[#CEA17A]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>

                  </>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-[#19171b]/50 rounded-xl p-4 sm:p-6 lg:p-8 border border-[#CEA17A]/10 w-full flex flex-col" style={{maxHeight: 'calc(100vh - 200px)'}}>
                <h2 className="text-2xl font-bold text-[#DBD0C0] mb-4 sm:mb-6 flex-shrink-0">Step 3: Auction Configuration</h2>
                
                <div className="flex-grow overflow-y-auto space-y-6">
                  {/* Max Tokens */}
                  <div className="bg-[#19171b]/30 rounded-lg p-4 border border-[#CEA17A]/10">
                    <label className="block text-lg font-semibold text-[#CEA17A] mb-2">
                      1. Max Tokens per Captain
                    </label>
                    <p className="text-sm text-[#DBD0C0]/70 mb-3">
                      Maximum tokens each captain can use for bidding
                    </p>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      value={auctionConfig.max_tokens_per_captain}
                      onChange={(e) => setAuctionConfig((prev: any) => ({ ...prev, max_tokens_per_captain: parseInt(e.target.value) || 2000 }))}
                      className="w-full px-4 py-3 bg-[#19171b] border border-[#CEA17A]/30 rounded-lg text-[#DBD0C0] focus:outline-none focus:border-[#CEA17A]/50"
                      placeholder="2000"
                    />
                  </div>

                  {/* Minimum Bid */}
                  <div className="bg-[#19171b]/30 rounded-lg p-4 border border-[#CEA17A]/10">
                    <label className="block text-lg font-semibold text-[#CEA17A] mb-2">
                      2. Minimum Bid Amount
                    </label>
                    <p className="text-sm text-[#DBD0C0]/70 mb-3">
                      Minimum bid required for any player in the auction
                    </p>
                    <input
                      type="number"
                      min="10"
                      step="10"
                      value={auctionConfig.min_bid_amount}
                      onChange={(e) => setAuctionConfig((prev: any) => ({ ...prev, min_bid_amount: parseInt(e.target.value) || 40 }))}
                      className="w-full px-4 py-3 bg-[#19171b] border border-[#CEA17A]/30 rounded-lg text-[#DBD0C0] focus:outline-none focus:border-[#CEA17A]/50"
                      placeholder="40"
                    />
                  </div>

                  {/* Use Base Price */}
                  <div className="bg-[#19171b]/30 rounded-lg p-4 border border-[#CEA17A]/10">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="use_base_price"
                        checked={auctionConfig.use_base_price}
                        onChange={(e) => setAuctionConfig((prev: any) => ({ ...prev, use_base_price: e.target.checked }))}
                        className="w-5 h-5 text-[#CEA17A] bg-[#19171b] border-[#CEA17A]/30 rounded focus:ring-[#CEA17A]/50 mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="use_base_price" className="block text-lg font-semibold text-[#CEA17A] mb-2">
                          Use Base Price for Bidding
                        </label>
                        <p className="text-sm text-[#DBD0C0]/70 mb-2">
                          If enabled, players with base price higher than minimum bid will start at their base price
                        </p>
                        <div className="text-xs text-[#CEA17A]/70 space-y-1">
                          <p>• If base price &gt; minimum bid → first bid = base price</p>
                          <p>• If no base price → first bid = minimum bid</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Minimum Increments */}
                  <div className="bg-[#19171b]/30 rounded-lg p-4 border border-[#CEA17A]/10">
                    <label className="block text-lg font-semibold text-[#CEA17A] mb-2">
                      3. Minimum Bid Increment
                    </label>
                    <p className="text-sm text-[#DBD0C0]/70 mb-3">
                      Minimum amount by which bids must increase
                    </p>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={auctionConfig.min_increment}
                      onChange={(e) => setAuctionConfig((prev: any) => ({ ...prev, min_increment: parseInt(e.target.value) || 20 }))}
                      className="w-full px-4 py-3 bg-[#19171b] border border-[#CEA17A]/30 rounded-lg text-[#DBD0C0] focus:outline-none focus:border-[#CEA17A]/50"
                      placeholder="20"
                    />
                  </div>

                  {/* Fixed vs Custom Increments */}
                  <div className="bg-[#19171b]/30 rounded-lg p-4 border border-[#CEA17A]/10">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="use_fixed_increments"
                        checked={auctionConfig.use_fixed_increments}
                        onChange={(e) => setAuctionConfig((prev: any) => ({ ...prev, use_fixed_increments: e.target.checked }))}
                        className="w-5 h-5 text-[#CEA17A] bg-[#19171b] border-[#CEA17A]/30 rounded focus:ring-[#CEA17A]/50 mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="use_fixed_increments" className="block text-lg font-semibold text-[#CEA17A] mb-2">
                          Use Fixed Increments
                        </label>
                        <p className="text-sm text-[#DBD0C0]/70 mb-2">
                          If unchecked, you can set custom increment ranges
                        </p>
                        {!auctionConfig.use_fixed_increments && (
                          <div className="mt-3 space-y-3">
                            <div className="text-sm text-[#CEA17A] font-medium">Custom Increment Ranges:</div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-[#DBD0C0] text-sm">0 - 200:</span>
                                <input
                                  type="number"
                                  min="5"
                                  step="5"
                                  placeholder="20"
                                  className="w-20 px-2 py-1 bg-[#19171b] border border-[#CEA17A]/30 rounded text-[#DBD0C0] text-sm focus:outline-none focus:border-[#CEA17A]/50"
                                />
                                <span className="text-[#DBD0C0] text-sm">tokens</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-[#DBD0C0] text-sm">200 - 500:</span>
                                <input
                                  type="number"
                                  min="5"
                                  step="5"
                                  placeholder="50"
                                  className="w-20 px-2 py-1 bg-[#19171b] border border-[#CEA17A]/30 rounded text-[#DBD0C0] text-sm focus:outline-none focus:border-[#CEA17A]/50"
                                />
                                <span className="text-[#DBD0C0] text-sm">tokens</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-[#DBD0C0] text-sm">500+:</span>
                                <input
                                  type="number"
                                  min="5"
                                  step="5"
                                  placeholder="100"
                                  className="w-20 px-2 py-1 bg-[#19171b] border border-[#CEA17A]/30 rounded text-[#DBD0C0] text-sm focus:outline-none focus:border-[#CEA17A]/50"
                                />
                                <span className="text-[#DBD0C0] text-sm">tokens</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timer */}
                  <div className="bg-[#19171b]/30 rounded-lg p-4 border border-[#CEA17A]/10">
                    <label className="block text-lg font-semibold text-[#CEA17A] mb-2">
                      4. Timer per Action (seconds)
                    </label>
                    <p className="text-sm text-[#DBD0C0]/70 mb-3">
                      Time limit for each bidding action (will be explained later)
                    </p>
                    <input
                      type="number"
                      min="10"
                      step="5"
                      value={auctionConfig.timer_seconds}
                      onChange={(e) => setAuctionConfig((prev: any) => ({ ...prev, timer_seconds: parseInt(e.target.value) || 20 }))}
                      className="w-full px-4 py-3 bg-[#19171b] border border-[#CEA17A]/30 rounded-lg text-[#DBD0C0] focus:outline-none focus:border-[#CEA17A]/50"
                      placeholder="20"
                    />
                  </div>

                  {/* Player Order */}
                  <div className="bg-[#19171b]/30 rounded-lg p-4 border border-[#CEA17A]/10">
                    <label className="block text-lg font-semibold text-[#CEA17A] mb-2">
                      5. Player Order
                    </label>
                    <p className="text-sm text-[#DBD0C0]/70 mb-3">
                      Order in which players will be auctioned
                    </p>
                    <select
                      value={auctionConfig.player_order_type}
                      onChange={(e) => setAuctionConfig((prev: any) => ({ ...prev, player_order_type: e.target.value }))}
                      className="w-full px-4 py-3 bg-[#19171b] border border-[#CEA17A]/30 rounded-lg text-[#DBD0C0] focus:outline-none focus:border-[#CEA17A]/50"
                    >
                      <option value="base_price_desc">Base Price (High to Low)</option>
                      <option value="base_price_asc">Base Price (Low to High)</option>
                      <option value="alphabetical">Alphabetical (A to Z)</option>
                      <option value="alphabetical_desc">Alphabetical (Z to A)</option>
                      <option value="random">Random Order</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="bg-[#19171b]/50 rounded-xl p-4 sm:p-6 lg:p-8 border border-[#CEA17A]/10 w-full flex flex-col" style={{maxHeight: 'calc(100vh - 200px)'}}>
                <h2 className="text-2xl font-bold text-[#DBD0C0] mb-4 sm:mb-6 flex-shrink-0">Step 4: Review and Begin Auction</h2>
                
                <div className="flex-grow overflow-y-auto space-y-6">
                  {/* Tournament Information */}
                  <div className="bg-[#19171b]/30 rounded-lg p-4 border border-[#CEA17A]/10">
                    <h3 className="text-lg font-semibold text-[#CEA17A] mb-3">Tournament Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[#DBD0C0]/70">Tournament:</span>
                        <span className="text-[#DBD0C0] ml-2 font-medium">{selectedTournament?.name}</span>
                      </div>
                      <div>
                        <span className="text-[#DBD0C0]/70">Format:</span>
                        <span className="text-[#DBD0C0] ml-2 font-medium">{selectedTournament?.format}</span>
                      </div>
                      <div>
                        <span className="text-[#DBD0C0]/70">Date:</span>
                        <span className="text-[#DBD0C0] ml-2 font-medium">{selectedTournament?.tournament_date}</span>
                      </div>
                      <div>
                        <span className="text-[#DBD0C0]/70">Teams:</span>
                        <span className="text-[#DBD0C0] ml-2 font-medium">{selectedTournament?.selected_teams}</span>
                      </div>
                      <div>
                        <span className="text-[#DBD0C0]/70">Total Players:</span>
                        <span className="text-[#DBD0C0] ml-2 font-medium">{tournamentPlayers.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Auction Configuration */}
                  <div className="bg-[#19171b]/30 rounded-lg p-4 border border-[#CEA17A]/10">
                    <h3 className="text-lg font-semibold text-[#CEA17A] mb-3">Auction Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-[#DBD0C0]/70">Max Tokens per Captain:</span>
                        <span className="text-[#DBD0C0] ml-2 font-medium">{auctionConfig.max_tokens_per_captain}</span>
                      </div>
                      <div>
                        <span className="text-[#DBD0C0]/70">Minimum Bid:</span>
                        <span className="text-[#DBD0C0] ml-2 font-medium">{auctionConfig.min_bid_amount}</span>
                      </div>
                      <div>
                        <span className="text-[#DBD0C0]/70">Use Base Price:</span>
                        <span className="text-[#DBD0C0] ml-2 font-medium">{auctionConfig.use_base_price ? 'Yes' : 'No'}</span>
                      </div>
                      <div>
                        <span className="text-[#DBD0C0]/70">Min Increment:</span>
                        <span className="text-[#DBD0C0] ml-2 font-medium">{auctionConfig.min_increment}</span>
                      </div>
                      <div>
                        <span className="text-[#DBD0C0]/70">Fixed Increments:</span>
                        <span className="text-[#DBD0C0] ml-2 font-medium">{auctionConfig.use_fixed_increments ? 'Yes' : 'No'}</span>
                      </div>
                      <div>
                        <span className="text-[#DBD0C0]/70">Timer (seconds):</span>
                        <span className="text-[#DBD0C0] ml-2 font-medium">{auctionConfig.timer_seconds}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-[#DBD0C0]/70">Player Order:</span>
                        <span className="text-[#DBD0C0] ml-2 font-medium">
                          {auctionConfig.player_order_type === 'base_price_desc' && 'Base Price (High to Low)'}
                          {auctionConfig.player_order_type === 'base_price_asc' && 'Base Price (Low to High)'}
                          {auctionConfig.player_order_type === 'alphabetical' && 'Alphabetical (A to Z)'}
                          {auctionConfig.player_order_type === 'alphabetical_desc' && 'Alphabetical (Z to A)'}
                          {auctionConfig.player_order_type === 'random' && 'Random Order'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Selected Captains */}
                  <div className="bg-[#19171b]/30 rounded-lg p-4 border border-[#CEA17A]/10">
                    <h3 className="text-lg font-semibold text-[#CEA17A] mb-3">Selected Captains & Teams</h3>
                    <div className="space-y-3">
                      {auctionConfig.captains.map((captain: any, index: number) => (
                        <div key={captain.id || captain.player_id || index} className="flex items-center justify-between p-3 bg-[#19171b]/50 rounded-lg border border-[#CEA17A]/10">
                          <div className="flex items-center space-x-3">
                            {captain.profile_pic_url ? (
                              <img 
                                src={captain.profile_pic_url} 
                                alt={captain.display_name || 'Captain'}
                                className="w-10 h-10 rounded-full object-cover border-2 border-[#CEA17A]/30"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#CEA17A]/20 flex items-center justify-center border-2 border-[#CEA17A]/30">
                                <span className="text-[#CEA17A] font-bold text-sm">
                                  {captain.display_name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="text-[#DBD0C0] font-medium">{captain.display_name || 'Unknown Player'}</div>
                              <div className="text-[#DBD0C0]/70 text-sm">Team: {captain.team_name || 'Unnamed Team'}</div>
                            </div>
                          </div>
                          <div className="text-[#CEA17A] font-semibold">
                            {auctionConfig.max_tokens_per_captain} tokens
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected Players */}
                  <div className="bg-[#19171b]/30 rounded-lg p-4 border border-[#CEA17A]/10">
                    <h3 className="text-lg font-semibold text-[#CEA17A] mb-3">Selected Players ({tournamentPlayers.length})</h3>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tournamentPlayers.map((player, index) => {
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
                            <div key={player.id} className="flex items-center space-x-3 p-3 bg-[#19171b]/50 rounded-lg border border-[#CEA17A]/10">
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
                                <div className="text-[#DBD0C0] font-medium text-sm truncate">{player.display_name}</div>
                                <div className="flex items-center space-x-2 text-xs text-[#DBD0C0]/70">
                                  <span>{getRoleEmoji(role)}</span>
                                  {basePrice && <span>₹{basePrice}</span>}
                                  {battingStyle && <span>• {battingStyle}</span>}
                                  {bowlingStyle && <span>• {bowlingStyle}</span>}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Player Summary */}
                  <div className="bg-[#19171b]/30 rounded-lg p-4 border border-[#CEA17A]/10">
                    <h3 className="text-lg font-semibold text-[#CEA17A] mb-3">Auction Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-3 bg-[#19171b]/50 rounded-lg">
                        <div className="text-2xl font-bold text-[#CEA17A]">{tournamentPlayers.length}</div>
                        <div className="text-[#DBD0C0]/70">Total Players</div>
                      </div>
                      <div className="text-center p-3 bg-[#19171b]/50 rounded-lg">
                        <div className="text-2xl font-bold text-[#CEA17A]">{selectedTournament?.selected_teams}</div>
                        <div className="text-[#DBD0C0]/70">Teams</div>
                      </div>
                      <div className="text-center p-3 bg-[#19171b]/50 rounded-lg">
                        <div className="text-2xl font-bold text-[#CEA17A]">{Math.floor(tournamentPlayers.length / (selectedTournament?.selected_teams || 1))}</div>
                        <div className="text-[#DBD0C0]/70">Players per Team</div>
                      </div>
                      <div className="text-center p-3 bg-[#19171b]/50 rounded-lg">
                        <div className="text-2xl font-bold text-[#CEA17A]">{auctionConfig.captains.length}</div>
                        <div className="text-[#DBD0C0]/70">Captains Selected</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-[#19171b]/50 rounded-xl p-4 sm:p-6 lg:p-8 border border-[#CEA17A]/10 w-full flex flex-col" style={{maxHeight: 'calc(100vh - 200px)'}}>
                <h2 className="text-2xl font-bold text-[#DBD0C0] mb-4 sm:mb-6 flex-shrink-0">Step 2: Select Captains</h2>
                
                <div className="mb-4 sm:mb-6 flex-grow flex flex-col" style={{minHeight: '300px'}}>
                  <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <div>
                      <p className="text-[#CEA17A]">
                        Select {selectedTournament.selected_teams} captains from the registered players. Each captain will lead a team.
                      </p>
                      <div className="mt-2 flex items-center space-x-4">
                        <div className="text-sm text-[#DBD0C0]">
                          Selected: <span className={`font-semibold ${auctionConfig.captains.length === selectedTournament.selected_teams ? 'text-green-400' : 'text-yellow-400'}`}>
                            {auctionConfig.captains.length}
                          </span> / {selectedTournament.selected_teams}
                        </div>
                        {auctionConfig.captains.length !== selectedTournament.selected_teams && (
                          <div className="text-sm text-yellow-400">
                            {auctionConfig.captains.length < selectedTournament.selected_teams 
                              ? `Select ${selectedTournament.selected_teams - auctionConfig.captains.length} more captain${selectedTournament.selected_teams - auctionConfig.captains.length > 1 ? 's' : ''}`
                              : `Remove ${auctionConfig.captains.length - selectedTournament.selected_teams} captain${auctionConfig.captains.length - selectedTournament.selected_teams > 1 ? 's' : ''}`
                            }
                          </div>
                        )}
                        {auctionConfig.captains.length === selectedTournament.selected_teams && (
                          <div className="text-sm text-green-400 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Ready to proceed
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-[#CEA17A]">
                      Page {currentPage} of {getTotalPages()}
                    </div>
                  </div>
                  
                  {/* Captains Table */}
                  <div className="flex-grow overflow-auto" style={{maxHeight: '400px'}}>
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-[#19171b] z-10">
                        <tr className="border-b border-[#CEA17A]/20">
                          <th className="text-left py-3 px-4 text-[#CEA17A] font-semibold">#</th>
                          <th className="text-left py-3 px-4 text-[#CEA17A] font-semibold">Photo</th>
                          <th className="text-left py-3 px-4 text-[#CEA17A] font-semibold">Player Name</th>
                          <th className="text-left py-3 px-4 text-[#CEA17A] font-semibold">Role</th>
                          <th className="text-left py-3 px-4 text-[#CEA17A] font-semibold">Base Price</th>
                          <th className="text-left py-3 px-4 text-[#CEA17A] font-semibold">Batting Style</th>
                          <th className="text-left py-3 px-4 text-[#CEA17A] font-semibold">Bowling Style</th>
                          <th className="text-left py-3 px-4 text-[#CEA17A] font-semibold">Team Name</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getCurrentPagePlayers().map((player, index) => {
                          const globalIndex = (currentPage - 1) * playersPerPage + index + 1;
                          const isSelected = auctionConfig.captains.some((captain: any) => captain.player_id === player.id);
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
                            return "🏏";
                          };
                          
                          const isMaxCaptainsReached = auctionConfig.captains.length >= (selectedTournament?.selected_teams || 0)
                          const canSelect = !isSelected && !isMaxCaptainsReached
                          
                          return (
                            <tr 
                              key={player.id} 
                              className={`border-b border-[#CEA17A]/10 transition-colors ${
                                isSelected 
                                  ? 'bg-[#CEA17A]/10 cursor-pointer hover:bg-[#CEA17A]/15' 
                                  : canSelect
                                    ? 'cursor-pointer hover:bg-[#19171b]/30'
                                    : 'cursor-not-allowed opacity-50'
                              }`}
                              onClick={() => canSelect || isSelected ? handleCaptainSelection(player.id, !isSelected) : null}
                            >
                              <td className="py-3 px-4 text-[#DBD0C0] font-medium">{globalIndex}</td>
                              <td className="py-3 px-4">
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
                                          parent.innerHTML = `
                                            <div class="w-full h-full bg-[#CEA17A]/20 flex items-center justify-center">
                                              <span class="text-[#CEA17A] text-sm font-bold">
                                                ${player.display_name.charAt(0).toUpperCase()}
                                              </span>
                                            </div>
                                          `;
                                        }
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-[#CEA17A]/20 flex items-center justify-center">
                                      <span className="text-[#CEA17A] text-sm font-bold">
                                        {player.display_name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 text-[#DBD0C0] font-medium">{player.display_name}</td>
                              <td className="py-3 px-4 text-[#DBD0C0] text-lg">{getRoleEmoji(role)}</td>
                              <td className="py-3 px-4 text-[#DBD0C0]">{basePrice || "N/A"}</td>
                              <td className="py-3 px-4 text-[#DBD0C0]">{battingStyle || "N/A"}</td>
                              <td className="py-3 px-4 text-[#DBD0C0]">{bowlingStyle || "N/A"}</td>
                              <td className="py-3 px-4">
                                {isSelected ? (
                                  <input
                                    type="text"
                                    placeholder="Team name"
                                    value={auctionConfig.captains.find((captain: any) => captain.player_id === player.id)?.team_name || `${player.display_name}'s Team`}
                                    onChange={(e) => handleTeamNameChange(player.id, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full px-2 py-1 bg-[#19171b] border border-[#CEA17A]/30 rounded text-[#DBD0C0] placeholder-[#CEA17A]/50 focus:outline-none focus:border-[#CEA17A]/50 text-xs"
                                  />
                                ) : (
                                  <span className={`text-xs ${canSelect ? 'text-[#CEA17A]/50' : 'text-[#CEA17A]/30'}`}>
                                    {canSelect ? 'Click to select' : 'Max captains reached'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {getTotalPages() > 1 && (
                    <div className="flex justify-center items-center space-x-2 mt-4 pt-4 border-t border-[#CEA17A]/20">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm bg-[#19171b]/50 text-[#DBD0C0] border border-[#CEA17A]/20 rounded-lg hover:bg-[#CEA17A]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                      >
                        Previous
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex space-x-1">
                        {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm rounded-lg transition-all duration-150 ${
                              currentPage === page
                                ? 'bg-[#CEA17A]/25 text-[#CEA17A] border border-[#CEA17A]/40'
                                : 'bg-[#19171b]/50 text-[#DBD0C0] border border-[#CEA17A]/20 hover:bg-[#CEA17A]/10'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === getTotalPages()}
                        className="px-3 py-2 text-sm bg-[#19171b]/50 text-[#DBD0C0] border border-[#CEA17A]/20 rounded-lg hover:bg-[#CEA17A]/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
        </div>

        {/* Empty State */}
        {!tournamentsLoading && (!tournaments || tournaments.length === 0) && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-semibold text-[#DBD0C0] mb-2">No tournaments found</h3>
            <p className="text-[#CEA17A] mb-8 max-w-md mx-auto">
              There are no tournaments available to create auctions for. Create a tournament first, then come back to create an auction.
            </p>
            <Link
              href="/tournaments/create"
              className="inline-flex items-center px-6 py-3 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 font-medium"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Tournament
            </Link>
          </div>
        )}
      </div>

      {/* Success/Error Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                messageModal.type === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {messageModal.type === 'success' ? (
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <h3 className={`text-lg font-semibold ${
                messageModal.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {messageModal.type === 'success' ? 'Success!' : 'Error'}
              </h3>
            </div>
            <p className={`mb-4 ${
              messageModal.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {messageModal.message}
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowMessageModal(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  messageModal.type === 'success' 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
