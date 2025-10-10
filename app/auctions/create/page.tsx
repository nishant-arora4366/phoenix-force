'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRoleValidation } from '@/src/hooks/useRoleValidation'
import { secureSessionManager } from '@/src/lib/secure-session'

type AuctionStep = 'select-type' | 'select-tournament' | 'confirm-players' | 'validate-teams' | 'select-captains'

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
  
  // Captains
  const [captains, setCaptains] = useState<Captain[]>([])

  const { user } = useRoleValidation()

  useEffect(() => {
    setLoading(false)
  }, [user])

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
      if (result.success && result.slots) {
        // Only get players in playing slots (not waitlist)
        // Filter slots where slot_number <= tournament total_slots
        const playingSlots = result.slots
          .filter((slot: any) => 
            slot.players && 
            slot.slot_number <= tournament.total_slots
          )
          .map((slot: any) => slot.players)
        
        setPlayers(playingSlots)
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
      default:
        return renderSelectType()
    }
  }

  const renderSelectType = () => (
    <div className="max-w-4xl mx-auto">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
    <div className="max-w-4xl mx-auto">
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
        )}
      </div>
    </div>
  )

  const renderConfirmPlayers = () => (
    <div className="max-w-4xl mx-auto">
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
          Step 2: Confirm Tournament Players
        </h1>
        <p className="text-lg text-[#CEA17A]">
          Review the player list for {selectedTournament?.name}
        </p>
      </div>

      <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#DBD0C0]">
            Registered Players ({players.length})
          </h2>
          <div className="text-sm text-[#CEA17A]">
            Required Teams: {selectedTournament?.selected_teams}
          </div>
        </div>

        {players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-[#CEA17A]">
              No players registered for this tournament
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="bg-[#3E4E5A]/15 backdrop-blur-sm rounded-lg border border-[#CEA17A]/25 p-4"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-[#CEA17A]/20 rounded-full flex items-center justify-center mr-3">
                    <span className="text-[#CEA17A] font-semibold">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-[#DBD0C0] font-semibold">{player.name}</p>
                    {player.position && (
                      <p className="text-sm text-[#CEA17A]">{player.position}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleConfirmPlayers}
            className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
          >
            Continue
          </button>
        </div>
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
      <div className="max-w-4xl mx-auto">
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
            Step 3: Validate Team Players
          </h1>
          <p className="text-lg text-[#CEA17A]">
            Player count must be a multiple of {requiredTeams}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tempPlayers.map((tempPlayer) => (
                  <div
                    key={tempPlayer.id}
                    className="bg-[#3E4E5A]/15 backdrop-blur-sm rounded-lg border border-yellow-500/30 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mr-3">
                          <span className="text-yellow-500 font-semibold">T</span>
                        </div>
                        <p className="text-[#DBD0C0] font-semibold">{tempPlayer.name}</p>
                      </div>
                      <button
                        onClick={() => setTempPlayers(tempPlayers.filter(p => p.id !== tempPlayer.id))}
                        className="text-red-400 hover:text-red-300"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
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
        setCaptains([...captains, { playerId, playerName, teamName: '' }])
      }
    }

    const handleTeamNameChange = (playerId: string, teamName: string) => {
      setCaptains(captains.map(c => 
        c.playerId === playerId ? { ...c, teamName } : c
      ))
    }

    const canContinue = captains.length === requiredCaptains && 
      captains.every(c => c.teamName.trim() !== '')

    return (
      <div className="max-w-4xl mx-auto">
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
            Step 4: Select Captains
          </h1>
          <p className="text-lg text-[#CEA17A]">
            Choose {requiredCaptains} captain{requiredCaptains > 1 ? 's' : ''} and name their team{requiredCaptains > 1 ? 's' : ''}
          </p>
        </div>

        {/* Selected Captains */}
        {captains.length > 0 && (
          <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-6 mb-6">
            <h2 className="text-xl font-bold text-[#DBD0C0] mb-4">
              Selected Captains ({captains.length}/{requiredCaptains})
            </h2>
            <div className="space-y-4">
              {captains.map((captain) => (
                <div
                  key={captain.playerId}
                  className="bg-[#3E4E5A]/15 backdrop-blur-sm rounded-lg border border-[#CEA17A]/25 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-[#DBD0C0] font-semibold mb-2">{captain.playerName}</p>
                      <input
                        type="text"
                        placeholder="Enter team name..."
                        value={captain.teamName}
                        onChange={(e) => handleTeamNameChange(captain.playerId, e.target.value)}
                        className="w-full px-4 py-2 bg-[#3E4E5A]/15 text-[#DBD0C0] border border-[#CEA17A]/25 rounded-lg focus:ring-2 focus:ring-[#CEA17A]/50 focus:border-[#CEA17A]/50 placeholder-[#CEA17A]/60"
                      />
                    </div>
                    <button
                      onClick={() => handleCaptainSelect(captain.playerId, captain.playerName)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Player List */}
        <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8 mb-6">
          <h2 className="text-xl font-bold text-[#DBD0C0] mb-4">
            Select from Players
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allPlayers.map((player) => {
              const isSelected = captains.find(c => c.playerId === player.id)
              const isTemp = 'isTemp' in player
              
              return (
                <button
                  key={player.id}
                  onClick={() => handleCaptainSelect(player.id, player.name)}
                  disabled={!isSelected && captains.length >= requiredCaptains}
                  className={`bg-[#3E4E5A]/15 backdrop-blur-sm rounded-lg border p-4 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isSelected 
                      ? 'border-[#CEA17A] bg-[#CEA17A]/10' 
                      : 'border-[#CEA17A]/25 hover:border-[#CEA17A]/40 hover:bg-[#3E4E5A]/25'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                      isTemp ? 'bg-yellow-500/20' : 'bg-[#CEA17A]/20'
                    }`}>
                      <span className={`font-semibold ${
                        isTemp ? 'text-yellow-500' : 'text-[#CEA17A]'
                      }`}>
                        {isSelected ? '✓' : player.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-[#DBD0C0] font-semibold">{player.name}</p>
                      {isTemp && (
                        <p className="text-sm text-yellow-500">Temporary</p>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
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
