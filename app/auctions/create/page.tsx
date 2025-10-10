'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRoleValidation } from '@/src/hooks/useRoleValidation'
import { secureSessionManager } from '@/src/lib/secure-session'

type AuctionStep = 'select-type' | 'select-tournament' | 'confirm-players' | 'validate-teams' | 'select-captains' | 'enter-team-names'

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
  created_at: string
  updated_at: string
}

interface Player {
  id: string
  name: string
  user_id?: string
  position?: string
  base_price?: number
  profile_pic_url?: string
  skills?: {
    Role?: string | string[]
    [key: string]: any
  }
}

interface TempPlayer {
  id: string
  name: string
  isTemp: true
}

interface Captain {
  playerId: string
  playerName: string
  teamName: string
  profile_pic_url?: string
}

export default function CreateAuctionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState<AuctionStep>('select-type')
  
  // Tournament selection
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  
  // Players
  const [players, setPlayers] = useState<Player[]>([])
  const [tempPlayers, setTempPlayers] = useState<TempPlayer[]>([])
  const [sortBy, setSortBy] = useState<'alphabetical' | 'base_price'>('alphabetical')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  
  // Captains
  const [captains, setCaptains] = useState<Captain[]>([])

  const { user } = useRoleValidation()

  // Load saved state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem('auction_creation_state')
      if (savedState) {
        try {
          const state = JSON.parse(savedState)
          setCurrentStep(state.currentStep || 'select-type')
          setSelectedTournament(state.selectedTournament || null)
          setPlayers(state.players || [])
          setTempPlayers(state.tempPlayers || [])
          setCaptains(state.captains || [])
        } catch (error) {
          console.error('Error loading saved state:', error)
        }
      }
    }
    setLoading(false)
  }, [user])

  // Save state whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && !loading) {
      const state = {
        currentStep,
        selectedTournament,
        players,
        tempPlayers,
        captains
      }
      sessionStorage.setItem('auction_creation_state', JSON.stringify(state))
    }
  }, [currentStep, selectedTournament, players, tempPlayers, captains, loading])

  const handleTournamentAuction = () => {
    setCurrentStep('select-tournament')
    fetchTournaments()
  }

  const handleQuickAuction = () => {
    // TODO: Navigate to quick auction setup
    console.log('Quick Auction selected')
  }

  const fetchTournaments = async () => {
    try {
      const token = secureSessionManager.getToken()
      if (!token) return

      const response = await fetch('/api/tournaments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      if (result.tournaments) {
        // Filter tournaments where registration is closed
        const closedTournaments = result.tournaments.filter((t: Tournament) => 
          t.status === 'registration_closed' || t.status === 'completed'
        )
        setTournaments(closedTournaments)
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error)
    }
  }

  const handleTournamentSelect = async (tournament: Tournament) => {
    setSelectedTournament(tournament)
    await fetchTournamentPlayers(tournament)
    setCurrentStep('confirm-players')
  }

  const fetchTournamentPlayers = async (tournament: Tournament) => {
    try {
      const token = secureSessionManager.getToken()
      if (!token) return

      const response = await fetch(`/api/tournaments/${tournament.id}/slots`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      console.log('Slots API Response:', result)
      console.log('Tournament total_slots:', tournament.total_slots)
      console.log('First 3 slots raw:', result.slots?.slice(0, 3))
      
      if (result.success && result.slots) {
        // The slots array contains slot objects with nested player data
        // First N slots (up to total_slots) are playing slots, rest are waitlist
        const playingPlayers = result.slots
          .slice(0, tournament.total_slots) // Take only first total_slots slots
          .filter((slot: any) => slot && slot.player_id && slot.players) // Filter out empty slots
          .map((slot: any) => ({
            id: slot.player_id,
            name: slot.players.display_name || slot.players.name || 'Unknown Player',
            user_id: slot.players.user_id,
            profile_pic_url: slot.players.profile_pic_url,
            skills: slot.players.skills
          }))
        
        console.log('Playing players filtered:', playingPlayers)
        console.log('First player skills:', playingPlayers[0]?.skills)
        setPlayers(playingPlayers)
      }
    } catch (error) {
      console.error('Error fetching tournament players:', error)
    }
  }

  const handleConfirmPlayers = () => {
    if (!selectedTournament) return
    
    const totalPlayers = players.length + tempPlayers.length
    const requiredTeams = selectedTournament.selected_teams
    
    if (totalPlayers % requiredTeams !== 0) {
      setCurrentStep('validate-teams')
    } else {
      setCurrentStep('select-captains')
    }
  }

  const generateTempPlayers = (count: number) => {
    const newTempPlayers: TempPlayer[] = []
    for (let i = 0; i < count; i++) {
      newTempPlayers.push({
        id: `temp-${Date.now()}-${i}`,
        name: `Temporary Player ${tempPlayers.length + i + 1}`,
        isTemp: true
      })
    }
    setTempPlayers([...tempPlayers, ...newTempPlayers])
  }

  const handleBackToSelectType = () => {
    setCurrentStep('select-type')
    setSelectedTournament(null)
    setPlayers([])
    setTempPlayers([])
    setCaptains([])
    // Clear session storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('auction_creation_state')
    }
  }

  // Helper function to get role emoji based on player role
  const getRoleEmoji = (role: string | string[] | undefined): string[] => {
    if (!role) return ['🏏'] // Default
    
    const roles = Array.isArray(role) ? role : [role]
    return roles.map((r: string) => {
      const lowerRole = r.toLowerCase()
      if (lowerRole.includes('batter')) return '🏏'
      if (lowerRole.includes('bowler')) return '🎾'
      if (lowerRole.includes('wicket') || lowerRole.includes('wk')) return '🧤'
      return '🏏' // Default
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Section Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
        <div className="absolute inset-0" 
             style={{
               background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
             }}></div>
        
        {/* Content */}
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-[#DBD0C0]">Loading...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Section Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
        <div className="absolute inset-0" 
             style={{
               background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
             }}></div>
        
        {/* Content */}
        <div className="relative z-10 py-8">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-[#DBD0C0] mb-6">
                  Please Sign In
                </h1>
                <p className="text-xl text-[#CEA17A] mb-8">
                  You need to be signed in to create auctions.
                </p>
                <button
                  onClick={() => window.location.href = '/signin'}
                  className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show unauthorized message if user doesn't have host or admin access
  if (user.role !== 'host' && user.role !== 'admin') {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Hero Section Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
        <div className="absolute inset-0" 
             style={{
               background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
             }}></div>
        
        {/* Content */}
        <div className="relative z-10 py-8">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8 max-w-2xl mx-auto">
                <div className="text-red-400 mb-6">
                  <svg className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#DBD0C0] mb-4">
                  Access Denied
                </h2>
                <p className="text-[#CEA17A] mb-6">
                  You don't have permission to create auctions. Only hosts and admins can access this feature.
                </p>
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center">
                  <button
                    onClick={() => router.push('/auctions')}
                    className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                  >
                    Back to Auctions
                  </button>
                  <button
                    onClick={() => router.push('/')}
                    className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render different content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 'select-type':
        return renderSelectType()
      case 'select-tournament':
        return renderSelectTournament()
      case 'confirm-players':
        return renderConfirmPlayers()
      case 'validate-teams':
        return renderValidateTeams()
      case 'select-captains':
        return renderSelectCaptains()
      case 'enter-team-names':
        return renderEnterTeamNames()
      default:
        return renderSelectType()
    }
  }

  const renderSelectType = () => (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#DBD0C0] mb-4">
          Create New Auction
        </h1>
        <p className="text-lg text-[#CEA17A]">
          Choose how you want to start your auction
        </p>
      </div>

      {/* Two Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Option 1: Select Tournament */}
              <button
                onClick={handleTournamentAuction}
                className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8 hover:border-[#CEA17A]/40 hover:bg-[#09171F]/70 transition-all duration-200 text-left group"
              >
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-[#3E4E5A]/15 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#3E4E5A]/25 transition-all duration-200">
                      <svg className="w-8 h-8 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-[#DBD0C0] mb-3">
                      Select Tournament
                    </h2>
                    <p className="text-[#CEA17A] leading-relaxed">
                      Create an auction linked to an existing tournament with all player and tournament details
                    </p>
                  </div>
                  <div className="mt-auto">
                    <span className="inline-flex items-center text-[#CEA17A] group-hover:text-[#DBD0C0] transition-colors duration-200">
                      Get Started
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </button>

              {/* Option 2: Quick Auction */}
              <button
                onClick={handleQuickAuction}
                className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8 hover:border-[#CEA17A]/40 hover:bg-[#09171F]/70 transition-all duration-200 text-left group"
              >
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div className="w-16 h-16 bg-[#3E4E5A]/15 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#3E4E5A]/25 transition-all duration-200">
                      <svg className="w-8 h-8 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-[#DBD0C0] mb-3">
                      Start Quick Auction
                    </h2>
                    <p className="text-[#CEA17A] leading-relaxed">
                      Start a standalone auction without tournament data. Configure details later as needed
                    </p>
                  </div>
                  <div className="mt-auto">
                    <span className="inline-flex items-center text-[#CEA17A] group-hover:text-[#DBD0C0] transition-colors duration-200">
                      Get Started
                      <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </button>
      </div>
    </div>
  )

  const renderSelectTournament = () => (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleBackToSelectType}
          className="flex items-center text-[#CEA17A] hover:text-[#DBD0C0] transition-colors duration-200 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-3xl font-bold text-[#DBD0C0] mb-2">
          Step 1: Select Tournament
        </h1>
        <p className="text-lg text-[#CEA17A]">
          Choose a tournament with closed registration
        </p>
      </div>

      <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
        {tournaments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-[#CEA17A]">
              No tournaments with closed registration found
            </p>
          </div>
        ) : (
          <div className="max-h-[600px] overflow-y-auto pr-2">
            <div className="space-y-4">
            {tournaments.map((tournament) => (
              <button
                key={tournament.id}
                onClick={() => handleTournamentSelect(tournament)}
                className="w-full bg-[#3E4E5A]/15 backdrop-blur-sm rounded-xl border border-[#CEA17A]/25 p-6 hover:border-[#CEA17A]/40 hover:bg-[#3E4E5A]/25 transition-all duration-200 text-left"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-[#DBD0C0] mb-1">
                      {tournament.name}
                    </h3>
                    <p className="text-sm text-[#CEA17A]">
                      {tournament.format} • {tournament.selected_teams} Teams
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-semibold">
                    Registration Closed
                  </span>
                </div>
                <div className="flex items-center text-sm text-[#CEA17A]">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {tournament.total_slots} Slots
                </div>
              </button>
            ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderConfirmPlayers = () => (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => setCurrentStep('select-tournament')}
          className="flex items-center text-[#CEA17A] hover:text-[#DBD0C0] transition-colors duration-200 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-3xl font-bold text-[#DBD0C0] mb-2">
          Confirm Players
        </h1>
        <p className="text-lg text-[#CEA17A]">
          Review the player list for {selectedTournament?.name}
        </p>
      </div>

      {/* Player List */}
      <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-4 md:p-8 mb-6">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg md:text-xl font-bold text-[#DBD0C0]">
              Registered Players ({players.length})
            </h2>
            <div className="text-sm text-[#CEA17A] hidden sm:block">
              Required Teams: {selectedTournament?.selected_teams}
            </div>
          </div>
          
          {/* Sort Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="text-sm text-[#CEA17A] sm:hidden">
              Required Teams: {selectedTournament?.selected_teams}
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm text-[#CEA17A] whitespace-nowrap">Sort by:</label>
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'alphabetical' | 'base_price')}
                  className="w-full appearance-none px-3 py-2.5 pr-10 bg-[#3E4E5A]/25 text-[#DBD0C0] border border-[#CEA17A]/30 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 text-sm font-medium cursor-pointer transition-all hover:bg-[#3E4E5A]/35"
                  style={{
                    backgroundImage: 'none'
                  }}
                >
                  <option value="alphabetical" className="bg-[#19171b] text-[#DBD0C0]">Alphabetical</option>
                  <option value="base_price" className="bg-[#19171b] text-[#DBD0C0]">Base Price</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#CEA17A] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2.5 bg-[#3E4E5A]/25 text-[#CEA17A] border border-[#CEA17A]/30 rounded-lg hover:bg-[#3E4E5A]/35 hover:border-[#CEA17A]/40 transition-all flex-shrink-0"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-[#CEA17A]">
              No players registered for this tournament
            </p>
          </div>
        ) : (
          <div className="max-h-[40vh] md:max-h-[500px] overflow-y-auto pr-2">
            {/* Mobile List View */}
            <div className="block md:hidden space-y-2">
            {[...players].sort((a, b) => {
              let comparison = 0
              if (sortBy === 'alphabetical') {
                comparison = a.name.localeCompare(b.name)
              } else {
                comparison = (b.base_price || 0) - (a.base_price || 0)
              }
              return sortOrder === 'asc' ? comparison : -comparison
            }).map((player, index) => (
              <div
                key={player.id}
                className="bg-[#3E4E5A]/15 backdrop-blur-sm rounded-lg border border-[#CEA17A]/25 p-2 hover:border-[#CEA17A]/40 transition-all"
              >
                <div className="flex items-center gap-2">
                  {/* Profile Picture */}
                  {player.profile_pic_url ? (
                    <img
                      src={player.profile_pic_url}
                      alt={player.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-[#CEA17A]/30 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement
                        if (fallback) fallback.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className={`w-10 h-10 bg-[#CEA17A]/20 rounded-full flex items-center justify-center flex-shrink-0 ${player.profile_pic_url ? 'hidden' : ''}`}>
                    <span className="text-[#CEA17A] font-semibold text-base">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#DBD0C0] font-semibold text-sm truncate">{player.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-[#CEA17A]/80">Player #{index + 1}</p>
                      {player.skills?.Role && (
                        <div className="flex gap-1 flex-shrink-0">
                          {getRoleEmoji(player.skills.Role).map((emoji, idx) => (
                            <span key={idx} className="text-sm">{emoji}</span>
                          ))}
                        </div>
                      )}
                      {player.base_price && (
                        <span className="text-xs text-[#CEA17A] font-semibold">₹{player.base_price}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            </div>
            
            {/* Desktop Card View */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[...players].sort((a, b) => {
              let comparison = 0
              if (sortBy === 'alphabetical') {
                comparison = a.name.localeCompare(b.name)
              } else {
                comparison = (b.base_price || 0) - (a.base_price || 0)
              }
              return sortOrder === 'asc' ? comparison : -comparison
            }).map((player, index) => (
              <div
                key={player.id}
                className="bg-[#3E4E5A]/15 backdrop-blur-sm rounded-lg border border-[#CEA17A]/25 p-4 transition-all duration-200"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Profile Picture */}
                  <div className="relative mb-3">
                    {player.profile_pic_url ? (
                      <>
                        <img
                          src={player.profile_pic_url}
                          alt={player.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-[#CEA17A]/30"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement
                            if (fallback) fallback.classList.remove('hidden')
                          }}
                        />
                        <div className="hidden w-16 h-16 rounded-full flex items-center justify-center bg-[#CEA17A]/20">
                          <span className="font-semibold text-2xl text-[#CEA17A]">
                            {player.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#CEA17A]/20">
                        <span className="font-semibold text-2xl text-[#CEA17A]">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Player Name */}
                  <p className="text-[#DBD0C0] font-semibold text-sm mb-1 line-clamp-2 min-h-[2.5rem] flex items-center">
                    {player.name}
                  </p>
                  
                  {/* Role Emojis */}
                  {player.skills?.Role && (
                    <div className="flex gap-1 mb-2">
                      {getRoleEmoji(player.skills.Role).map((emoji, idx) => (
                        <span key={idx} className="text-lg">{emoji}</span>
                      ))}
                    </div>
                  )}
                  
                  {/* Player Number and Base Price */}
                  <div className="flex flex-col gap-1 items-center">
                    <p className="text-xs text-[#CEA17A]/80">Player #{index + 1}</p>
                    {player.base_price && (
                      <p className="text-xs text-[#CEA17A] font-semibold">₹{player.base_price}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleConfirmPlayers}
          className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  )

  const renderValidateTeams = () => {
    if (!selectedTournament) return null

    const totalPlayers = players.length + tempPlayers.length
    const requiredTeams = selectedTournament.selected_teams
    const remainder = totalPlayers % requiredTeams
    const playersNeeded = remainder === 0 ? 0 : requiredTeams - remainder

    return (
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setCurrentStep('confirm-players')}
            className="flex items-center text-[#CEA17A] hover:text-[#DBD0C0] transition-colors duration-200 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-[#DBD0C0] mb-2">
            Validate Team Players
          </h1>
          <p className="text-lg text-[#CEA17A]">
            Player count must be a multiple of {requiredTeams} teams
          </p>
        </div>

        <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8 mb-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-yellow-500 mr-3 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-yellow-500 mb-2">
                  Player Count Mismatch
                </h3>
                <p className="text-[#DBD0C0] mb-4">
                  You need {playersNeeded} more player(s) to make teams even.
                </p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-[#CEA17A]">Current Players:</p>
                    <p className="text-[#DBD0C0] font-semibold">{players.length}</p>
                  </div>
                  <div>
                    <p className="text-[#CEA17A]">Temp Players:</p>
                    <p className="text-[#DBD0C0] font-semibold">{tempPlayers.length}</p>
                  </div>
                  <div>
                    <p className="text-[#CEA17A]">Required Teams:</p>
                    <p className="text-[#DBD0C0] font-semibold">{requiredTeams}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {tempPlayers.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#DBD0C0] mb-4">Temporary Players</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {tempPlayers.map((tempPlayer) => (
                  <div
                    key={tempPlayer.id}
                    className="bg-[#3E4E5A]/15 backdrop-blur-sm rounded-lg border border-yellow-500/30 p-4 hover:border-yellow-500/50 transition-all relative group"
                  >
                    {/* Delete Button */}
                    <button
                      onClick={() => setTempPlayers(tempPlayers.filter(p => p.id !== tempPlayer.id))}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove temporary player"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    
                    <div className="flex flex-col items-center text-center">
                      {/* Profile Picture */}
                      <div className="relative mb-3">
                        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
                          <span className="text-yellow-500 font-semibold text-2xl">T</span>
                        </div>
                      </div>
                      
                      {/* Player Name */}
                      <p className="text-[#DBD0C0] font-semibold text-sm mb-1 line-clamp-2 min-h-[2.5rem] flex items-center">
                        {tempPlayer.name}
                      </p>
                      
                      {/* Temporary Label */}
                      <p className="text-xs text-yellow-500">Temporary</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => generateTempPlayers(playersNeeded)}
              disabled={playersNeeded === 0}
              className="px-6 py-3 bg-yellow-500/15 text-yellow-500 border border-yellow-500/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-yellow-500/25 hover:border-yellow-500/40 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate {playersNeeded} Temp Player{playersNeeded !== 1 ? 's' : ''}
            </button>
            <button
              onClick={() => setCurrentStep('select-captains')}
              disabled={playersNeeded > 0}
              className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderSelectCaptains = () => {
    if (!selectedTournament) return null

    const allPlayers = [...players, ...tempPlayers]
    const requiredCaptains = selectedTournament.selected_teams

    const handleCaptainSelect = (playerId: string, playerName: string) => {
      if (captains.find(c => c.playerId === playerId)) {
        setCaptains(captains.filter(c => c.playerId !== playerId))
      } else if (captains.length < requiredCaptains) {
        // Find the player to get their profile picture
        const player = allPlayers.find(p => p.id === playerId)
        if (!player) return
        
        // Set default team name as "<Name>'s Team"
        setCaptains([...captains, { 
          playerId, 
          playerName, 
          teamName: `${playerName}'s Team`,
          profile_pic_url: 'profile_pic_url' in player ? player.profile_pic_url : undefined
        }])
      }
    }

    const handleTeamNameChange = (playerId: string, teamName: string) => {
      setCaptains(captains.map(c => 
        c.playerId === playerId ? { ...c, teamName } : c
      ))
    }

    const canSelectCaptains = captains.length === requiredCaptains

    return (
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setCurrentStep(tempPlayers.length > 0 ? 'validate-teams' : 'confirm-players')}
            className="flex items-center text-[#CEA17A] hover:text-[#DBD0C0] transition-colors duration-200 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        <h1 className="text-3xl font-bold text-[#DBD0C0] mb-2">
          Step 3: Select Captains
        </h1>
        <p className="text-lg text-[#CEA17A]">
          Choose {requiredCaptains} captain{requiredCaptains > 1 ? 's' : ''} from the players below ({captains.length}/{requiredCaptains} selected)
        </p>
        </div>

        {/* Player List */}
        <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-4 md:p-8 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg md:text-xl font-bold text-[#DBD0C0]">
              Select from Players
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-sm text-[#CEA17A] whitespace-nowrap">Sort by:</label>
              <div className="relative flex-1 sm:flex-none">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'alphabetical' | 'base_price')}
                  className="w-full appearance-none px-3 py-2.5 pr-10 bg-[#3E4E5A]/25 text-[#DBD0C0] border border-[#CEA17A]/30 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 text-sm font-medium cursor-pointer transition-all hover:bg-[#3E4E5A]/35"
                  style={{
                    backgroundImage: 'none'
                  }}
                >
                  <option value="alphabetical" className="bg-[#19171b] text-[#DBD0C0]">Alphabetical</option>
                  <option value="base_price" className="bg-[#19171b] text-[#DBD0C0]">Base Price</option>
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#CEA17A] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2.5 bg-[#3E4E5A]/25 text-[#CEA17A] border border-[#CEA17A]/30 rounded-lg hover:bg-[#3E4E5A]/35 hover:border-[#CEA17A]/40 transition-all flex-shrink-0"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="max-h-[40vh] md:max-h-[500px] overflow-y-auto pr-2">
            {/* Mobile List View */}
            <div className="block md:hidden space-y-2">
            {[...allPlayers].sort((a, b) => {
              if (sortBy === 'alphabetical') {
                return a.name.localeCompare(b.name)
              } else {
                const priceA = 'base_price' in a ? (a.base_price || 0) : 0
                const priceB = 'base_price' in b ? (b.base_price || 0) : 0
                return priceB - priceA
              }
            }).map((player) => {
              const isSelected = captains.find(c => c.playerId === player.id)
              const isTemp = 'isTemp' in player
              const hasProfilePic = !isTemp && 'profile_pic_url' in player && player.profile_pic_url
              
              return (
                <button
                  key={player.id}
                  onClick={() => handleCaptainSelect(player.id, player.name)}
                  disabled={!isSelected && captains.length >= requiredCaptains}
                  className={`w-full bg-[#3E4E5A]/15 backdrop-blur-sm rounded-lg border p-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected 
                      ? 'border-[#CEA17A] bg-[#CEA17A]/10' 
                      : 'border-[#CEA17A]/25 hover:border-[#CEA17A]/40 hover:bg-[#3E4E5A]/25'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {/* Profile Picture */}
                    <div className="relative flex-shrink-0">
                      {hasProfilePic ? (
                        <>
                          <img
                            src={(player as Player).profile_pic_url}
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-[#CEA17A]/30"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement
                              if (fallback) fallback.classList.remove('hidden')
                            }}
                          />
                          <div className={`hidden w-10 h-10 rounded-full flex items-center justify-center ${
                            isTemp ? 'bg-yellow-500/20' : 'bg-[#CEA17A]/20'
                          }`}>
                            <span className={`font-semibold text-base ${
                              isTemp ? 'text-yellow-500' : 'text-[#CEA17A]'
                            }`}>
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isTemp ? 'bg-yellow-500/20' : 'bg-[#CEA17A]/20'
                        }`}>
                          <span className={`font-semibold text-base ${
                            isTemp ? 'text-yellow-500' : 'text-[#CEA17A]'
                          }`}>
                            {player.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#CEA17A] rounded-full flex items-center justify-center border border-[#09171F]">
                          <span className="text-[#09171F] text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Player Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-[#DBD0C0] font-semibold text-sm truncate">{player.name}</p>
                        {!isTemp && 'skills' in player && player.skills?.Role && (
                          <div className="flex gap-1 flex-shrink-0">
                            {getRoleEmoji(player.skills.Role).map((emoji, idx) => (
                              <span key={idx} className="text-sm">{emoji}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-[#CEA17A]/80">
                          {isTemp ? 'Temporary' : (
                            (() => {
                              const role = (player as Player).skills?.Role
                              return Array.isArray(role) ? role.join(', ') : role
                            })()
                          )}
                        </p>
                        {'base_price' in player && player.base_price && (
                          <span className="text-xs text-[#CEA17A] font-semibold">₹{player.base_price}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
            </div>
            
            {/* Desktop Card View */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {[...allPlayers].sort((a, b) => {
              let comparison = 0
              if (sortBy === 'alphabetical') {
                comparison = a.name.localeCompare(b.name)
              } else {
                const priceA = 'base_price' in a ? (a.base_price || 0) : 0
                const priceB = 'base_price' in b ? (b.base_price || 0) : 0
                comparison = priceB - priceA
              }
              return sortOrder === 'asc' ? comparison : -comparison
            }).map((player) => {
              const isSelected = captains.find(c => c.playerId === player.id)
              const isTemp = 'isTemp' in player
              const hasProfilePic = !isTemp && 'profile_pic_url' in player && player.profile_pic_url
              
              return (
                <button
                  key={player.id}
                  onClick={() => handleCaptainSelect(player.id, player.name)}
                  disabled={!isSelected && captains.length >= requiredCaptains}
                  className={`bg-[#3E4E5A]/15 backdrop-blur-sm rounded-lg border p-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected 
                      ? 'border-[#CEA17A] bg-[#CEA17A]/10' 
                      : 'border-[#CEA17A]/25 hover:border-[#CEA17A]/40 hover:bg-[#3E4E5A]/25'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Profile Picture with Selection Badge */}
                    <div className="relative mb-3">
                      {hasProfilePic ? (
                        <>
                          <img
                            src={(player as Player).profile_pic_url}
                            alt={player.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-[#CEA17A]/30"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement
                              if (fallback) fallback.classList.remove('hidden')
                            }}
                          />
                          <div className={`hidden w-16 h-16 rounded-full flex items-center justify-center ${
                            isTemp ? 'bg-yellow-500/20' : 'bg-[#CEA17A]/20'
                          }`}>
                            <span className={`font-semibold text-2xl ${
                              isTemp ? 'text-yellow-500' : 'text-[#CEA17A]'
                            }`}>
                              {player.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          isTemp ? 'bg-yellow-500/20' : 'bg-[#CEA17A]/20'
                        }`}>
                          <span className={`font-semibold text-2xl ${
                            isTemp ? 'text-yellow-500' : 'text-[#CEA17A]'
                          }`}>
                            {player.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#CEA17A] rounded-full flex items-center justify-center border-2 border-[#09171F]">
                          <span className="text-[#09171F] text-xs font-bold">✓</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Player Name */}
                    <p className="text-[#DBD0C0] font-semibold text-sm mb-1 line-clamp-2 min-h-[2.5rem] flex items-center">
                      {player.name}
                    </p>
                    
                    {/* Role Emojis */}
                    {!isTemp && 'skills' in player && player.skills?.Role && (
                      <div className="flex gap-1 mb-2">
                        {getRoleEmoji(player.skills.Role).map((emoji, idx) => (
                          <span key={idx} className="text-lg">{emoji}</span>
                        ))}
                      </div>
                    )}
                    
                    {/* Player Status */}
                    {isTemp && (
                      <p className="text-xs text-yellow-500">Temporary</p>
                    )}
                  </div>
                </button>
              )
            })}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setCurrentStep('enter-team-names')}
            disabled={!canSelectCaptains}
            className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      </div>
    )
  }

  const renderEnterTeamNames = () => {
    if (!selectedTournament) return null

    const requiredCaptains = selectedTournament.selected_teams

    const handleTeamNameChange = (playerId: string, teamName: string) => {
      setCaptains(captains.map(c => 
        c.playerId === playerId ? { ...c, teamName } : c
      ))
    }

    const canContinue = captains.length === requiredCaptains && 
      captains.every(c => c.teamName.trim() !== '')

    return (
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => setCurrentStep('select-captains')}
            className="flex items-center text-[#CEA17A] hover:text-[#DBD0C0] transition-colors duration-200 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-[#DBD0C0] mb-2">
            Step 4: Enter Team
          </h1>
          <p className="text-lg text-[#CEA17A]">
            Name your {requiredCaptains} team{requiredCaptains > 1 ? 's' : ''}
          </p>
        </div>

        {/* Team Name Inputs */}
        <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-4 md:p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg md:text-xl font-bold text-[#DBD0C0]">
              Team
            </h2>
          </div>

          <div className="max-h-[50vh] md:max-h-[600px] overflow-y-auto pr-2">
            <div className="grid gap-3">
              {captains.map((captain, index) => (
                  <div
                    key={captain.playerId}
                    className="bg-[#3E4E5A]/15 backdrop-blur-sm rounded-lg border border-[#CEA17A]/25 p-3 transition-all duration-200 hover:border-[#CEA17A]/40 hover:bg-[#3E4E5A]/25"
                  >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      {/* Profile Picture */}
                      {captain.profile_pic_url ? (
                        <img
                          src={captain.profile_pic_url}
                          alt={captain.playerName}
                          className="w-8 h-8 rounded-full object-cover border border-[#CEA17A]/30 flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement
                            if (fallback) fallback.classList.remove('hidden')
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 bg-[#3E4E5A]/25 rounded-full flex items-center justify-center border border-[#CEA17A]/30 flex-shrink-0">
                          <span className="text-[#CEA17A] font-semibold text-sm">
                            {captain.playerName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="text-left min-w-0">
                        <p className="text-[#DBD0C0] font-semibold text-sm leading-snug truncate">{captain.playerName}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="text"
                        placeholder="Enter team name..."
                        value={captain.teamName}
                        onChange={(e) => handleTeamNameChange(captain.playerId, e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-[#3E4E5A]/25 text-[#DBD0C0] border border-[#CEA17A]/30 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60 text-sm hover:bg-[#3E4E5A]/35 hover:border-[#CEA17A]/40 transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => {
              // TODO: Create auction with selected data
              console.log('Creating auction with:', { selectedTournament, players, tempPlayers, captains })
            }}
            disabled={!canContinue}
            className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Auction
          </button>
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
      
      {/* Content */}
      <div className="relative z-10 py-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          {renderStepContent()}
        </div>
      </div>
    </div>
  )
}
