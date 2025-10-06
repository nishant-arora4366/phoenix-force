'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { sessionManager } from '@/lib/session'
import { getSupabaseClient } from '@/lib/supabaseClient'

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
  created_at: string
  updated_at: string
}

interface User {
  id: string
  email: string
  username?: string
  firstname?: string
  lastname?: string
  role: string
}

export default function TournamentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const tournamentId = params.id as string

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [hostInfo, setHostInfo] = useState<User | null>(null)
  const [slots, setSlots] = useState<any[]>([])
  const [slotsStats, setSlotsStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationMessage, setRegistrationMessage] = useState('')
  const [userRegistration, setUserRegistration] = useState<any>(null)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [waitlistStatus, setWaitlistStatus] = useState<any>(null)

  // Initialize Supabase client for realtime (singleton to avoid multiple instances)
  const supabase = getSupabaseClient()

  useEffect(() => {
    const fetchTournamentAndUser = async () => {
      try {
        // Get current user from session manager
        const sessionUser = sessionManager.getUser()
        setUser(sessionUser)

        // Fetch tournament data via API
        const response = await fetch(`/api/tournaments/${tournamentId}`)
        if (!response.ok) {
          setError('Tournament not found')
          return
        }
        
        const result = await response.json()
        if (!result.success) {
          setError('Tournament not found')
          return
        }
        
        const tournamentData = result.tournament
        setTournament(tournamentData)

        // Fetch host information
        const hostResponse = await fetch(`/api/user-profile?userId=${tournamentData.host_id}`)
        if (hostResponse.ok) {
          const hostResult = await hostResponse.json()
          if (hostResult.success) {
            setHostInfo(hostResult.data)
          }
        }

        if (sessionUser) {
          // Fetch user profile
          const response = await fetch(`/api/user-profile?userId=${sessionUser.id}`)
          const result = await response.json()
          if (result.success) {
            setUserProfile(result.data)
            // Check if user is admin or the tournament host
            const isAdmin = result.data.role === 'admin'
            const isTournamentHost = sessionUser.id === tournamentData.host_id
            setIsHost(isAdmin || isTournamentHost)
          }
        }

        // Fetch tournament slots for all authenticated users
        if (sessionUser) {
          const userResponse = await fetch(`/api/user-profile?userId=${sessionUser.id}`)
          const userResult = await userResponse.json()
          if (userResult.success) {
            const isAdmin = userResult.data.role === 'admin'
            const isTournamentHost = sessionUser.id === tournamentData.host_id
            const isViewer = userResult.data.role === 'viewer'
            // Load slots for all authenticated users
            if (true) {
              const slotsResponse = await fetch(`/api/tournaments/${tournamentId}/slots`, {
                headers: {
                  'Authorization': JSON.stringify(sessionUser),
                },
              })
              if (slotsResponse.ok) {
                const slotsResult = await slotsResponse.json()
                if (slotsResult.success) {
                  setSlots(slotsResult.slots)
                  setSlotsStats(slotsResult.stats)
                } else {
                  console.error('Slots API returned error:', slotsResult.error)
                }
              } else {
                console.error('Slots API request failed:', slotsResponse.status, slotsResponse.statusText)
              }
              
              // Check if user is already registered for this tournament
              await checkUserRegistration()
              
              // Fetch waitlist status
              await fetchWaitlistStatus()
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Error loading tournament')
      } finally {
        setIsLoading(false)
      }
    }

    if (tournamentId) {
      fetchTournamentAndUser()
    }
  }, [tournamentId])

  // Realtime subscription for tournament slots and notifications
  useEffect(() => {
    if (!tournamentId || !user) return

    console.log('Setting up realtime subscription for tournament:', tournamentId)

    // Subscribe to changes in tournament_slots table for this tournament
    const slotsChannel = supabase
      .channel(`tournament-slots-${tournamentId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'tournament_slots',
          filter: `tournament_id=eq.${tournamentId}`
        },
        (payload: any) => {
          console.log('Realtime update received:', payload)
          
          // Refresh slots data when any slot changes
          fetchSlots()
          
          // Also refresh user registration status in case it was affected
          checkUserRegistration()
          
          // Check for waitlist promotions
          checkWaitlistPromotion(payload)
        }
      )
      .subscribe((status: any) => {
        console.log('Slots subscription status:', status)
        setIsRealtimeConnected(status === 'SUBSCRIBED')
      })

    // Subscribe to notifications for the current user
    const notificationsChannel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload: any) => {
          console.log('New notification received:', payload)
          setNotifications(prev => [payload.new, ...prev])
          
          // Show notification to user
          if (payload.new.type === 'waitlist_promotion') {
            setRegistrationMessage(`🎉 You have been promoted from the waitlist to position ${payload.new.data.new_slot_number}!`)
            setTimeout(() => setRegistrationMessage(''), 10000)
          }
        }
      )
      .subscribe()

    // Cleanup subscriptions on component unmount
    return () => {
      console.log('Cleaning up realtime subscriptions')
      supabase.removeChannel(slotsChannel)
      supabase.removeChannel(notificationsChannel)
    }
  }, [tournamentId, user])


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'registration_open':
        return 'bg-green-100 text-green-800'
      case 'registration_closed':
        return 'bg-yellow-100 text-yellow-800'
      case 'auction_started':
        return 'bg-blue-100 text-blue-800'
      case 'auction_completed':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Draft'
      case 'registration_open':
        return 'Registration Open'
      case 'registration_closed':
        return 'Registration Closed'
      case 'auction_started':
        return 'Auction Started'
      case 'auction_completed':
        return 'Auction Completed'
      default:
        return status
    }
  }

  const updateTournamentStatus = async (newStatus: string) => {
    if (!tournament) return
    
    setIsUpdatingStatus(true)
    setStatusMessage('')
    
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update tournament status')
      }
      
      // Update local state
      setTournament(prev => prev ? { ...prev, status: newStatus } : null)
      setStatusMessage(`Tournament status updated to ${getStatusText(newStatus)}`)
      
      // Clear message after 3 seconds
      setTimeout(() => setStatusMessage(''), 3000)
      
    } catch (error: any) {
      setStatusMessage(`Error: ${error.message}`)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const getNextStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'draft':
        return [
          { value: 'registration_open', label: 'Open Registration', color: 'bg-green-600 hover:bg-green-700' }
        ]
      case 'registration_open':
        return [
          { value: 'registration_closed', label: 'Close Registration', color: 'bg-orange-600 hover:bg-orange-700' }
        ]
      case 'registration_closed':
        return [
          { value: 'auction_started', label: 'Start Auction', color: 'bg-blue-600 hover:bg-blue-700' }
        ]
      case 'auction_started':
        return [
          { value: 'auction_completed', label: 'Complete Auction', color: 'bg-purple-600 hover:bg-purple-700' }
        ]
      default:
        return []
    }
  }

  const fetchSlots = async () => {
    try {
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) return

      const slotsResponse = await fetch(`/api/tournaments/${tournamentId}/slots`, {
        headers: {
          'Authorization': JSON.stringify(sessionUser),
        },
      })
      if (slotsResponse.ok) {
        const slotsResult = await slotsResponse.json()
        if (slotsResult.success) {
          setSlots(slotsResult.slots)
          setSlotsStats(slotsResult.stats)
          
          // Temporarily disabled automatic promotion to prevent infinite loop
          // TODO: Re-enable once the promotion logic is fixed
          console.log('Automatic promotion check disabled to prevent infinite loop')
        }
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
    }
  }

  const checkUserRegistration = async () => {
    try {
      const sessionUser = sessionManager.getUser()
      if (!sessionUser) return

      // First check if user has a player profile
      const playerResponse = await fetch(`/api/player-profile`, {
        headers: {
          'Authorization': JSON.stringify(sessionUser),
        },
      })

      const playerResult = await playerResponse.json()
      if (!playerResult.success || !playerResult.profile) {
        // User doesn't have a player profile, no need to check registration
        setUserRegistration(null)
        return
      }

      // User has a player profile, now check registration status
      const response = await fetch(`/api/tournaments/${tournamentId}/user-registration`, {
        headers: {
          'Authorization': JSON.stringify(sessionUser),
        },
      })

      const result = await response.json()
      if (result.success && result.registration) {
        setUserRegistration(result.registration)
      } else {
        setUserRegistration(null)
      }
    } catch (error) {
      console.error('Error checking user registration:', error)
      setUserRegistration(null)
    }
  }

  const checkWaitlistPromotion = async (payload: any) => {
    // Check if a main slot became empty and trigger auto-promotion
    if (payload.eventType === 'UPDATE' && payload.old.player_id && !payload.new.player_id) {
      console.log('Main slot became empty, checking for waitlist promotion')
      
      // The database trigger will handle the auto-promotion
      // We just need to refresh the data to show the updated state
      setTimeout(() => {
        fetchSlots()
        checkUserRegistration()
      }, 1000) // Small delay to allow database trigger to complete
    }
  }

  const fetchWaitlistStatus = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/promote-waitlist`, {
        method: 'GET',
        headers: {
          'Authorization': JSON.stringify(user)
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWaitlistStatus(data.waitlist)
      }
    } catch (error) {
      console.error('Error fetching waitlist status:', error)
    }
  }

  const promoteWaitlistManually = async () => {
    if (!user) return

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/promote-waitlist`, {
        method: 'POST',
        headers: {
          'Authorization': JSON.stringify(user)
        }
      })

      if (response.ok) {
        const data = await response.json()
        setRegistrationMessage(`✅ ${data.message}`)
        setTimeout(() => setRegistrationMessage(''), 5000)
        
        // Refresh data
        fetchSlots()
        fetchWaitlistStatus()
      } else {
        const error = await response.json()
        setRegistrationMessage(`❌ ${error.error}`)
        setTimeout(() => setRegistrationMessage(''), 5000)
      }
    } catch (error) {
      console.error('Error promoting waitlist:', error)
      setRegistrationMessage('❌ Failed to promote waitlist player')
      setTimeout(() => setRegistrationMessage(''), 5000)
    }
  }

  const registerForTournament = async () => {
    setIsRegistering(true)
    setRegistrationMessage('')
    
    const maxRetries = 3
    const baseDelay = 1000 // Base delay in milliseconds
    let lastError = null

    try {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Registration attempt ${attempt}/${maxRetries}`)
          
          if (attempt > 1) {
            setRegistrationMessage(`Retrying registration (attempt ${attempt}/${maxRetries})...`)
          }
          
          const sessionUser = sessionManager.getUser()
          const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': JSON.stringify(sessionUser),
            },
          })

          const result = await response.json()
          
          if (!result.success) {
            if (result.error.includes('Player profile not found')) {
              setRegistrationMessage('Please create a player profile first before registering for tournaments.')
              return
            } else if (result.error.includes('Slot number already taken') || result.error.includes('already registered')) {
              // These are not retryable errors
              throw new Error(result.error)
            } else if (result.error.includes('Failed to register after multiple attempts')) {
              // Server-side retry failed, but we can try again
              if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
                console.log(`Server retry failed, client retrying in ${delay}ms...`)
                setRegistrationMessage(`Registration failed, retrying in ${Math.ceil(delay/1000)}s...`)
                await new Promise(resolve => setTimeout(resolve, delay))
                continue
              } else {
                throw new Error(result.error)
              }
            } else {
              throw new Error(result.error)
            }
          }

          // Success!
          console.log('Registration successful:', result)
          setRegistrationMessage(result.message)
          
          // Refresh slots data and user registration status
          await Promise.all([
            fetchSlots(),
            checkUserRegistration()
          ])
          
          return // Exit the retry loop on success
          
        } catch (err: any) {
          console.error(`Registration attempt ${attempt} failed:`, err)
          lastError = err
          
          if (attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
            console.log(`Registration failed, retrying in ${delay}ms...`)
            setRegistrationMessage(`Registration failed, retrying in ${Math.ceil(delay/1000)}s...`)
            await new Promise(resolve => setTimeout(resolve, delay))
          }
        }
      }

      // If we get here, all retries failed
      console.error('All registration attempts failed')
      setRegistrationMessage(`Registration failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`)
    } finally {
      setIsRegistering(false);
      setTimeout(() => setRegistrationMessage(''), 10000); // Clear message after 10 seconds for retry messages
    }
  }

  const withdrawFromTournament = async () => {
    setIsWithdrawing(true)
    setRegistrationMessage('')
    try {
      const sessionUser = sessionManager.getUser()
      const response = await fetch(`/api/tournaments/${tournamentId}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(sessionUser),
        },
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }

      setRegistrationMessage(result.message)
      // Refresh slots data and user registration status
      await Promise.all([
        fetchSlots(),
        checkUserRegistration()
      ])
    } catch (err: any) {
      console.error('Error withdrawing from tournament:', err)
      setRegistrationMessage(`Error: ${err.message}`)
    } finally {
      setIsWithdrawing(false)
      setTimeout(() => setRegistrationMessage(''), 5000) // Clear message after 5 seconds
    }
  }

  const removePlayerFromSlot = async (slotId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to remove ${playerName} from this tournament slot?`)) {
      return
    }

    try {
      const sessionUser = sessionManager.getUser()
      const response = await fetch(`/api/tournaments/${tournamentId}/remove-player`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(sessionUser),
        },
        body: JSON.stringify({ slotId })
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }

      setRegistrationMessage(`Successfully removed ${playerName} from tournament`)
      // Refresh slots
      await fetchSlots()
    } catch (error: any) {
      console.error('Error removing player from tournament:', error)
      setRegistrationMessage(`Error: ${error.message}`)
    } finally {
      setTimeout(() => setRegistrationMessage(''), 5000) // Clear message after 5 seconds
    }
  }

  const cancelRegistration = async () => {
    setIsRegistering(true)
    setRegistrationMessage('')
    try {
      const sessionUser = sessionManager.getUser()
      const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(sessionUser),
        },
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }

      setRegistrationMessage(result.message)
      // Refresh slots data
      const slotsResponse = await fetch(`/api/tournaments/${tournamentId}/slots`, {
        headers: {
          'Authorization': JSON.stringify(sessionUser),
        },
      })
      if (slotsResponse.ok) {
        const slotsResult = await slotsResponse.json()
        if (slotsResult.success) {
          setSlots(slotsResult.slots)
          setSlotsStats(slotsResult.stats)
        }
      }
    } catch (err: any) {
      console.error('Error cancelling registration:', err)
      setRegistrationMessage(`Error: ${err.message}`)
    } finally {
      setIsRegistering(false)
      setTimeout(() => setRegistrationMessage(''), 5000) // Clear message after 5 seconds
    }
  }

  const approveSlot = async (slotId: string) => {
    try {
      const sessionUser = sessionManager.getUser()
      const response = await fetch(`/api/tournaments/${tournamentId}/slots`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(sessionUser),
        },
        body: JSON.stringify({ slotId, action: 'approve' }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }

      // Refresh slots data
      const slotsResponse = await fetch(`/api/tournaments/${tournamentId}/slots`, {
        headers: {
          'Authorization': JSON.stringify(sessionUser),
        },
      })
      if (slotsResponse.ok) {
        const slotsResult = await slotsResponse.json()
        if (slotsResult.success) {
          setSlots(slotsResult.slots)
          setSlotsStats(slotsResult.stats)
        }
      }
    } catch (err: any) {
      console.error('Error approving slot:', err)
    }
  }

  const rejectSlot = async (slotId: string) => {
    try {
      const sessionUser = sessionManager.getUser()
      const response = await fetch(`/api/tournaments/${tournamentId}/slots`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(sessionUser),
        },
        body: JSON.stringify({ slotId, action: 'reject' }),
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error)
      }

      // Refresh slots data
      const slotsResponse = await fetch(`/api/tournaments/${tournamentId}/slots`, {
        headers: {
          'Authorization': JSON.stringify(sessionUser),
        },
      })
      if (slotsResponse.ok) {
        const slotsResult = await slotsResponse.json()
        if (slotsResult.success) {
          setSlots(slotsResult.slots)
          setSlotsStats(slotsResult.stats)
        }
      }
    } catch (err: any) {
      console.error('Error rejecting slot:', err)
    }
  }

  // Component render logic
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-4 sm:py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-gray-600 mx-auto mb-4"></div>
          <p className="text-lg sm:text-xl text-gray-600">Loading tournament...</p>
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-4 sm:py-8">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Tournament Not Found</h1>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">{error || 'The tournament you are looking for does not exist.'}</p>
          <Link
            href="/tournaments"
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tournaments
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                href="/tournaments"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">{tournament.name}</h1>
                <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Tournament Details</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <span className={`px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(tournament.status)}`}>
                {getStatusText(tournament.status)}
              </span>
              {isHost && (
                <Link
                  href={`/tournaments/${tournament.id}/edit`}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
                >
                  Edit Tournament
                </Link>
              )}
            </div>
            
            {/* Status Management */}
            {isHost && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {getNextStatusOptions(tournament.status).map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateTournamentStatus(option.value)}
                      disabled={isUpdatingStatus}
                      className={`px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium ${option.color} ${
                        isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isUpdatingStatus ? 'Updating...' : option.label}
                    </button>
                  ))}
                </div>
                
                {statusMessage && (
                  <div className={`p-3 rounded-lg text-sm ${
                    statusMessage.includes('Error') 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {statusMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Tournament Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-4 sm:px-8 py-4 sm:py-6">
                <h2 className="text-lg sm:text-2xl font-bold text-white">Tournament Information</h2>
                <p className="text-gray-200 mt-1 sm:mt-2 text-sm sm:text-base">Complete tournament details and configuration</p>
              </div>
              
              <div className="p-4 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">Tournament Format</label>
                    <div className="text-lg font-semibold text-gray-900">{tournament.format}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">Number of Teams</label>
                    <div className="text-lg font-semibold text-gray-900">{tournament.selected_teams}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">Total Player Slots</label>
                    <div className="text-lg font-semibold text-gray-900">{tournament.total_slots}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">Tournament Date</label>
                    <div className="text-lg font-semibold text-gray-900">
                      {new Date(tournament.tournament_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">Tournament Host</label>
                    <div className="text-lg font-semibold text-gray-900">
                      {hostInfo ? (
                        hostInfo.firstname && hostInfo.lastname 
                          ? `${hostInfo.firstname} ${hostInfo.lastname}`
                          : hostInfo.username || hostInfo.email
                      ) : (
                        <span className="text-gray-500">Loading...</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <div className="text-lg font-semibold text-gray-900">
                      {new Date(tournament.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <div className="text-lg font-semibold text-gray-900">
                      {new Date(tournament.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {tournament.description && (
                  <div className="mt-8">
                    <label className="text-sm font-medium text-gray-500">Description</label>
                    <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-900">{tournament.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Teams</span>
                  <span className="font-semibold text-gray-900">{tournament.selected_teams}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Player Slots</span>
                  <span className="font-semibold text-gray-900">{tournament.total_slots}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Format</span>
                  <span className="font-semibold text-gray-900">{tournament.format}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                    {getStatusText(tournament.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/tournaments"
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Tournaments
                </Link>
                
                {isHost && (
                  <>
                    <Link
                      href={`/tournaments/${tournament.id}/edit`}
                      className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Tournament
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Tournament Timeline */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Tournament Created</div>
                    <div className="text-xs text-gray-500">
                      {new Date(tournament.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    tournament.status === 'registration_open' || 
                    tournament.status === 'registration_closed' || 
                    tournament.status === 'auction_started' || 
                    tournament.status === 'auction_completed' 
                      ? 'bg-blue-500' : 'bg-gray-300'
                  }`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Registration Opens</div>
                    <div className="text-xs text-gray-500">When ready</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    tournament.status === 'auction_started' || 
                    tournament.status === 'auction_completed' 
                      ? 'bg-blue-500' : 'bg-gray-300'
                  }`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Auction Begins</div>
                    <div className="text-xs text-gray-500">After registration</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    tournament.status === 'auction_completed' 
                      ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Tournament Complete</div>
                    <div className="text-xs text-gray-500">Final results</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tournament Slots Section */}
        {tournament && (
          <div className="mt-8">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-4 sm:px-8 py-4 sm:py-6">
                <h2 className="text-lg sm:text-2xl font-bold text-white">Tournament Slots</h2>
                <p className="text-gray-200 mt-1 sm:mt-2 text-sm sm:text-base">Player registrations and slot management</p>
                {/* Realtime connection indicator */}
                <div className="flex items-center mt-2">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isRealtimeConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-xs text-gray-300">
                    {isRealtimeConnected ? 'Live updates enabled' : 'Connecting...'}
                  </span>
                </div>
              </div>
              
              <div className="p-4 sm:p-8">
                {/* Registration Messages */}
                {registrationMessage && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${
                    registrationMessage.includes('Error') 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {registrationMessage}
                  </div>
                )}

                {/* Notifications Display */}
                {notifications.length > 0 && (
                  <div className="mb-6 space-y-3">
                    {notifications.slice(0, 3).map((notification, index) => (
                      <div key={notification.id || index} className={`p-4 rounded-lg border ${
                        notification.type === 'waitlist_promotion' 
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : 'bg-blue-50 border-blue-200 text-blue-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{notification.title}</div>
                            <div className="text-sm mt-1">{notification.message}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(notification.created_at).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                            className="ml-4 text-gray-500 hover:text-gray-700"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}


                {/* Player Registration Section - Moved to Top */}
                {user && tournament.status === 'registration_open' && !isHost && (
                  <div className="mb-6 p-4 rounded-lg border">
                    {userRegistration ? (
                      // User is already registered
                      <div className="bg-green-50 border-green-200">
                        <h3 className="text-lg font-semibold text-green-900 mb-2">Registration Status</h3>
                        <div className="text-green-700 text-sm mb-4">
                          <p>You are registered for this tournament!</p>
                          <p className="mt-1">
                            <strong>Slot:</strong> {userRegistration.slot_number} | 
                            <strong> Status:</strong> {userRegistration.status} | 
                            <strong> Requested:</strong> {new Date(userRegistration.requested_at).toLocaleDateString()}
                          </p>
                          {userRegistration.confirmed_at && (
                            <p><strong>Confirmed:</strong> {new Date(userRegistration.confirmed_at).toLocaleDateString()}</p>
                          )}
                        </div>
                        <button
                          onClick={withdrawFromTournament}
                          disabled={isWithdrawing}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isWithdrawing ? 'Withdrawing...' : 'Withdraw from Tournament'}
                        </button>
                      </div>
                    ) : (
                      // User is not registered
                      <div className="bg-blue-50 border-blue-200">
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">Register for Tournament</h3>
                        <p className="text-blue-700 text-sm mb-4">
                          Registration is open! Click below to register for a tournament slot.
                        </p>
                        <button
                          onClick={registerForTournament}
                          disabled={isRegistering}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isRegistering ? 'Registering...' : 'Register for Tournament'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Slots Display */}
                {tournament && (
                  <div className="space-y-4">
                    {/* Stats */}
                    {slotsStats && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-lg font-bold text-gray-900">{slotsStats.filled_main_slots}</div>
                          <div className="text-sm text-gray-600">Main Slots Filled</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-lg font-bold text-gray-900">{slotsStats.filled_waitlist_slots}</div>
                          <div className="text-sm text-gray-600">Waitlist Filled</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-lg font-bold text-gray-900">{slotsStats.pending_approvals}</div>
                          <div className="text-sm text-gray-600">Pending Approval</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg text-center">
                          <div className="text-lg font-bold text-gray-900">{slotsStats.total_slots}</div>
                          <div className="text-sm text-gray-600">Total Slots</div>
                        </div>
                      </div>
                    )}

                    {/* Generate slots if not loaded from API */}
                    {slots.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-gray-600 mb-4">Loading tournament slots...</p>
                        <button
                          onClick={async () => {
                            try {
                              const sessionUser = sessionManager.getUser()
                              const slotsResponse = await fetch(`/api/tournaments/${tournamentId}/slots`, {
                                headers: {
                                  'Authorization': JSON.stringify(sessionUser),
                                },
                              })
                              if (slotsResponse.ok) {
                                const slotsResult = await slotsResponse.json()
                                if (slotsResult.success) {
                                  setSlots(slotsResult.slots)
                                  setSlotsStats(slotsResult.stats)
                                } else {
                                  console.error('Slots API returned error:', slotsResult.error)
                                  alert(`Error loading slots: ${slotsResult.error}`)
                                }
                              } else {
                                console.error('Slots API request failed:', slotsResponse.status, slotsResponse.statusText)
                                alert(`Failed to load slots: ${slotsResponse.status} ${slotsResponse.statusText}`)
                              }
                            } catch (error) {
                              console.error('Error loading slots:', error)
                              alert(`Error loading slots: ${error}`)
                            }
                          }}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Load Slots
                        </button>
                      </div>
                    )}

                    {/* Main Tournament Slots - Status Based Grouping */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Main Tournament Slots</h3>
                      
                      {slots.length > 0 ? (
                        <div className="space-y-6">
                          {/* Confirmed Players */}
                          {(() => {
                            const confirmedSlots = slots.filter(slot => slot.is_main_slot && slot.status === 'confirmed' && slot.players)
                            return confirmedSlots.length > 0 && (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-lg font-semibold text-green-800">Confirmed Players ({confirmedSlots.length})</h4>
                                  <span className="px-3 py-1 bg-green-200 text-green-800 text-sm font-medium rounded-full">
                                    {confirmedSlots.length}/{tournament.total_slots}
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {confirmedSlots.map((slot) => (
                                    <div key={slot.slot_number} className="bg-white border border-green-200 rounded-lg p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-900">Position {confirmedSlots.indexOf(slot) + 1}</span>
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                                          Confirmed
                                        </span>
                                      </div>
                                      <div className="text-sm">
                                        <div className="font-medium text-gray-900">
                                          {slot.players.users?.firstname && slot.players.users?.lastname 
                                            ? `${slot.players.users.firstname} ${slot.players.users.lastname}`
                                            : slot.players.users?.username || slot.players.users?.email || slot.players.name
                                          }
                                        </div>
                                        <div className="text-gray-600 text-xs">{slot.players.display_name}</div>
                                        {slot.confirmed_at && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            Confirmed: {new Date(slot.confirmed_at).toLocaleDateString()}
                                          </div>
                                        )}
                                      </div>
                                      {isHost && (
                                        <div className="mt-2">
                                          <button
                                            onClick={() => removePlayerFromSlot(slot.id, slot.players?.display_name || 'Player')}
                                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                          >
                                            Remove Player
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}

                          {/* Pending Approval */}
                          {(() => {
                            const pendingSlots = slots.filter(slot => slot.is_main_slot && slot.status === 'pending' && slot.players)
                            return pendingSlots.length > 0 && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-lg font-semibold text-yellow-800">Pending Approval ({pendingSlots.length})</h4>
                                  <span className="px-3 py-1 bg-yellow-200 text-yellow-800 text-sm font-medium rounded-full">
                                    Awaiting Host Action
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {pendingSlots.map((slot) => (
                                    <div key={slot.slot_number} className="bg-white border border-yellow-200 rounded-lg p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-900">Position {pendingSlots.indexOf(slot) + 1}</span>
                                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                                          Pending
                                        </span>
                                      </div>
                                      <div className="text-sm">
                                        <div className="font-medium text-gray-900">
                                          {slot.players.users?.firstname && slot.players.users?.lastname 
                                            ? `${slot.players.users.firstname} ${slot.players.users.lastname}`
                                            : slot.players.users?.username || slot.players.users?.email || slot.players.name
                                          }
                                        </div>
                                        <div className="text-gray-600 text-xs">{slot.players.display_name}</div>
                                        {slot.requested_at && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            Requested: {new Date(slot.requested_at).toLocaleDateString()}
                                          </div>
                                        )}
                                      </div>
                                      {isHost && (
                                        <div className="flex space-x-2 mt-2">
                                          <button
                                            onClick={() => approveSlot(slot.id)}
                                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            onClick={() => rejectSlot(slot.id)}
                                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}

                          {/* Available Slots */}
                          {(() => {
                            const filledSlots = slots.filter(slot => slot.is_main_slot && slot.players).length
                            const availableSlots = tournament.total_slots - filledSlots
                            return availableSlots > 0 && (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-lg font-semibold text-gray-800">Available Slots ({availableSlots})</h4>
                                  <span className="px-3 py-1 bg-gray-200 text-gray-800 text-sm font-medium rounded-full">
                                    Open for Registration
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {availableSlots} main tournament slots are available for registration.
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-lg font-medium mb-2">Loading tournament slots...</div>
                          <div className="text-sm">Please wait while we fetch the latest information.</div>
                        </div>
                      )}
                    </div>

                    {/* Waitlist Slots - Status Based Grouping */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Waitlist</h3>
                      
                      {slots.length > 0 ? (
                        <div className="space-y-6">
                          {/* Waitlisted Players */}
                          {(() => {
                            const waitlistSlots = slots.filter(slot => !slot.is_main_slot && slot.players)
                            return waitlistSlots.length > 0 && (
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-lg font-semibold text-blue-800">Waitlisted Players ({waitlistSlots.length})</h4>
                                  <span className="px-3 py-1 bg-blue-200 text-blue-800 text-sm font-medium rounded-full">
                                    First Come, First Served
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {waitlistSlots.map((slot) => (
                                    <div key={slot.slot_number} className="bg-white border border-blue-200 rounded-lg p-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-gray-900">Position {waitlistSlots.indexOf(slot) + 1}</span>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                                          Waitlist
                                        </span>
                                      </div>
                                      <div className="text-sm">
                                        <div className="font-medium text-gray-900">
                                          {slot.players.users?.firstname && slot.players.users?.lastname 
                                            ? `${slot.players.users.firstname} ${slot.players.users.lastname}`
                                            : slot.players.users?.username || slot.players.users?.email || slot.players.name
                                          }
                                        </div>
                                        <div className="text-gray-600 text-xs">{slot.players.display_name}</div>
                                        {slot.requested_at && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            Joined: {new Date(slot.requested_at).toLocaleDateString()}
                                          </div>
                                        )}
                                      </div>
                                      {isHost && (
                                        <div className="mt-2">
                                          <button
                                            onClick={() => removePlayerFromSlot(slot.id, slot.players?.display_name || 'Player')}
                                            className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                          >
                                            Remove from Waitlist
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3 text-sm text-blue-700">
                                  <div className="font-medium">How it works:</div>
                                  <div className="text-xs mt-1">
                                    When a main slot becomes available, the first person on the waitlist will be automatically promoted.
                                  </div>
                                </div>
                                
                                {/* Host Controls for Waitlist Management */}
                                {isHost && waitlistSlots.length > 0 && (
                                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                                    <div className="flex items-center justify-between">
                                      <div className="text-sm text-blue-800">
                                        <div className="font-medium">Host Controls</div>
                                        <div className="text-xs">Manually promote waitlist players</div>
                                      </div>
                                      <button
                                        onClick={promoteWaitlistManually}
                                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                      >
                                        Promote Next Player
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })()}

                          {/* No Waitlist */}
                          {(() => {
                            const waitlistSlots = slots.filter(slot => !slot.is_main_slot && slot.players)
                            return waitlistSlots.length === 0 && (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-lg font-semibold text-gray-800">No Waitlist</h4>
                                  <span className="px-3 py-1 bg-gray-200 text-gray-800 text-sm font-medium rounded-full">
                                    Main Slots Available
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  All main tournament slots are available. No waitlist needed.
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-lg font-medium mb-2">Loading waitlist...</div>
                          <div className="text-sm">Please wait while we fetch the latest information.</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
