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

interface PlayerSkills {
  [key: string]: string | string[]
}

const fetcher = async (url: string) => {
  const response = await fetch('/api/tournaments')
  if (!response.ok) {
    throw new Error('Failed to fetch tournaments')
  }
  const result = await response.json()
  const tournaments = result.tournaments || []
  
  // Define status priority: Open first, then Opening Soon, then Closed
  const getStatusPriority = (status: string) => {
    switch (status) {
      case 'registration_open': return 1 // Open - highest priority
      case 'draft': return 2 // Opening Soon
      case 'registration_closed': return 3
      case 'auction_started': return 4
      case 'auction_completed': return 5
      case 'teams_formed': return 6
      case 'completed': return 7 // Closed
      case 'in_progress': return 8 // Closed
      default: return 9
    }
  }

  // Sort tournaments by status priority first, then by date
  return tournaments.sort((a: any, b: any) => {
    const statusPriorityA = getStatusPriority(a.status)
    const statusPriorityB = getStatusPriority(b.status)
    
    // If status priorities are different, sort by status
    if (statusPriorityA !== statusPriorityB) {
      return statusPriorityA - statusPriorityB
    }
    
    // If same status, sort by date (earliest first)
    return new Date(a.tournament_date).getTime() - new Date(b.tournament_date).getTime()
  })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-[#3E4E5A]/20 text-[#CEA17A] border border-[#CEA17A]/30'
    case 'registration_open':
      return 'bg-green-500/20 text-green-300 border border-green-500/30'
    case 'registration_closed':
      return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
    case 'auction_started':
      return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    case 'auction_completed':
      return 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
    case 'teams_formed':
      return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
    case 'completed':
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    case 'in_progress':
      return 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
    default:
      return 'bg-[#3E4E5A]/20 text-[#CEA17A] border border-[#CEA17A]/30'
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
    case 'teams_formed':
      return 'Teams Formed'
    case 'completed':
      return 'Completed'
    case 'in_progress':
      return 'In Progress'
    default:
      return status
  }
}

export default function TournamentsPage() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [isUserLoading, setIsUserLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [tournamentToDelete, setTournamentToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageModal, setMessageModal] = useState({ type: '', message: '' })
  const [loadingTournamentId, setLoadingTournamentId] = useState<string | null>(null)
  
  // Filter states
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'restricted' | 'eligible'>('all')
  const [playerSkills, setPlayerSkills] = useState<PlayerSkills>({})
  const [isLoadingSkills, setIsLoadingSkills] = useState(false)

  const { data: tournaments, error, isLoading: tournamentsLoading, mutate } = useSWR<Tournament[]>('/api/tournaments', fetcher)

  // Function to fetch player skills for eligibility checking
  const fetchPlayerSkills = async (userToCheck?: any) => {
    const currentUser = userToCheck || user
    if (!currentUser) {
      console.log('🔍 No user found, skipping player skills fetch')
      return
    }
    
    console.log('🔍 Fetching player skills for user:', currentUser.id)
    setIsLoadingSkills(true)
    try {
      const token = secureSessionManager.getToken()
      const response = await fetch('/api/player-profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      console.log('🔍 Player profile response status:', response.status)
      
      if (response.ok) {
        const result = await response.json()
        console.log('🔍 Player profile result:', result)
        
        if (result.success && result.skills) {
          console.log('🔍 Setting player skills:', result.skills)
          setPlayerSkills(result.skills)
        } else {
          console.log('🔍 No skills found in result')
        }
      } else {
        console.log('🔍 Failed to fetch player profile:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching player skills:', error)
    } finally {
      setIsLoadingSkills(false)
    }
  }

  // Function to check if user is eligible for a tournament
  const isUserEligibleForTournament = (tournament: Tournament): boolean => {
    console.log('🔍 Checking eligibility for tournament:', tournament.name)
    console.log('   Player skills:', playerSkills)
    
    // If tournament has no restrictions, everyone is eligible
    if (!hasRestrictions(tournament)) {
      console.log('   ✅ Tournament has no restrictions - eligible for everyone')
      return true
    }
    
    // If user has no player skills, they can't be eligible for restricted tournaments
    if (!playerSkills || Object.keys(playerSkills).length === 0) {
      console.log('   ❌ No player skills found - not eligible for restricted tournaments')
      return false
    }
    
    // Check community restrictions
    if (tournament.community_restrictions && tournament.community_restrictions.length > 0) {
      const userCommunities = playerSkills['Community'] as string[] || []
      console.log('   Community restrictions:', tournament.community_restrictions)
      console.log('   User communities:', userCommunities)
      
      const hasMatchingCommunity = tournament.community_restrictions.some(restriction => 
        userCommunities.includes(restriction)
      )
      console.log('   Has matching community:', hasMatchingCommunity)
      if (!hasMatchingCommunity) {
        console.log('   ❌ No matching community found')
        return false
      }
    }
    
    // Check base price restrictions
    if (tournament.base_price_restrictions && tournament.base_price_restrictions.length > 0) {
      const userBasePrice = playerSkills['Base Price'] as string || ''
      console.log('   Base price restrictions:', tournament.base_price_restrictions)
      console.log('   User base price:', userBasePrice)
      
      const hasMatchingBasePrice = tournament.base_price_restrictions.includes(userBasePrice)
      console.log('   Has matching base price:', hasMatchingBasePrice)
      if (!hasMatchingBasePrice) {
        console.log('   ❌ No matching base price found')
        return false
      }
    }
    
    // Check base price range
    if (tournament.min_base_price !== null && tournament.min_base_price !== undefined) {
      const userBasePrice = playerSkills['Base Price'] as string || ''
      const userBasePriceValue = parseFloat(userBasePrice.replace(/[^\d.]/g, '')) || 0
      console.log('   Min base price:', tournament.min_base_price)
      console.log('   User base price value:', userBasePriceValue)
      
      if (userBasePriceValue < tournament.min_base_price) {
        console.log('   ❌ User base price below minimum')
        return false
      }
    }
    
    if (tournament.max_base_price !== null && tournament.max_base_price !== undefined) {
      const userBasePrice = playerSkills['Base Price'] as string || ''
      const userBasePriceValue = parseFloat(userBasePrice.replace(/[^\d.]/g, '')) || 0
      console.log('   Max base price:', tournament.max_base_price)
      console.log('   User base price value:', userBasePriceValue)
      
      if (userBasePriceValue > tournament.max_base_price) {
        console.log('   ❌ User base price above maximum')
        return false
      }
    }
    
    console.log('   ✅ Tournament is eligible')
    return true
  }

  // Function to check if tournament has restrictions
  const hasRestrictions = (tournament: Tournament): boolean => {
    return (
      (tournament.community_restrictions && tournament.community_restrictions.length > 0) ||
      (tournament.base_price_restrictions && tournament.base_price_restrictions.length > 0) ||
      (tournament.min_base_price !== null && tournament.min_base_price !== undefined) ||
      (tournament.max_base_price !== null && tournament.max_base_price !== undefined)
    )
  }

  // Filter tournaments based on active filter
  const getFilteredTournaments = (): Tournament[] => {
    if (!tournaments) return []
    
    switch (activeFilter) {
      case 'open':
        return tournaments.filter(tournament => !hasRestrictions(tournament))
      case 'restricted':
        return tournaments.filter(tournament => hasRestrictions(tournament))
      case 'eligible':
        return tournaments.filter(tournament => isUserEligibleForTournament(tournament))
      default:
        return tournaments
    }
  }

  // Check user authentication and role
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get user from session manager
        const sessionUser = secureSessionManager.getUser()
        console.log('🔍 Session user found:', sessionUser)
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
            // Fetch player skills for eligibility checking
            console.log('🔍 About to call fetchPlayerSkills from checkUser')
            fetchPlayerSkills(sessionUser)
          }
        } else {
          console.log('🔍 No session user found')
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
              setIsHost(result.data.role === 'host' || result.data.role === 'admin')
              // Fetch player skills for eligibility checking
              fetchPlayerSkills(sessionUser)
            }
          })
          .catch(error => {
            console.error('Error fetching user profile:', error)
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

  const handleDeleteTournament = async (tournamentId: string) => {
    setIsDeleting(true)
    try {
      const token = secureSessionManager.getToken()
      if (!token) {
        setMessageModal({ type: 'error', message: 'Authentication required to delete tournament' })
        setShowMessageModal(true)
        return
      }

      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setMessageModal({ type: 'success', message: 'Tournament deleted successfully!' })
        setShowMessageModal(true)
        mutate() // Refresh the tournaments list
        setShowDeleteModal(false)
        setTournamentToDelete(null)
        
        // Auto-close success message after 2 seconds
        setTimeout(() => {
          setShowMessageModal(false)
        }, 2000)
      } else {
        const error = await response.json()
        setMessageModal({ type: 'error', message: `Error deleting tournament: ${error.message || error.error || 'Unknown error'}` })
        setShowMessageModal(true)
      }
    } catch (error) {
      console.error('Error deleting tournament:', error)
      setMessageModal({ type: 'error', message: 'Error deleting tournament. Please try again.' })
      setShowMessageModal(true)
    } finally {
      setIsDeleting(false)
    }
  }

  const confirmDelete = (tournamentId: string) => {
    setTournamentToDelete(tournamentId)
    setShowDeleteModal(true)
  }

  const handleViewDetails = (tournamentId: string) => {
    setLoadingTournamentId(tournamentId)
    // The Link will handle navigation, we'll clear the loading state after a short delay
    setTimeout(() => {
      setLoadingTournamentId(null)
    }, 1000)
  }

  const handleEdit = (tournamentId: string) => {
    setLoadingTournamentId(tournamentId)
    // The Link will handle navigation, we'll clear the loading state after a short delay
    setTimeout(() => {
      setLoadingTournamentId(null)
    }, 1000)
  }

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center py-20 bg-[#19171b] min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto"></div>
          <p className="mt-4 text-[#DBD0C0]">Loading tournaments...</p>
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
      
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-4xl font-bold text-[#DBD0C0]">Tournaments</h1>
            <p className="text-[#CEA17A] mt-2">
              Manage and participate in cricket tournaments
            </p>
          </div>
          {isHost && (
            <Link
              href="/tournaments/create"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 font-medium"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Tournament
            </Link>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-150 ${
                activeFilter === 'all'
                  ? 'bg-[#CEA17A]/25 text-[#CEA17A] border border-[#CEA17A]/40 shadow-lg shadow-[#CEA17A]/10'
                  : 'bg-[#19171b]/50 text-[#DBD0C0] border border-[#CEA17A]/20 hover:bg-[#CEA17A]/15 hover:border-[#CEA17A]/30'
              }`}
            >
              All Tournaments
            </button>
            <button
              onClick={() => setActiveFilter('open')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-150 ${
                activeFilter === 'open'
                  ? 'bg-green-500/25 text-green-300 border border-green-500/40 shadow-lg shadow-green-500/10'
                  : 'bg-[#19171b]/50 text-[#DBD0C0] border border-green-500/20 hover:bg-green-500/15 hover:border-green-500/30'
              }`}
            >
              Open Access
            </button>
            <button
              onClick={() => setActiveFilter('restricted')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-150 ${
                activeFilter === 'restricted'
                  ? 'bg-yellow-500/25 text-yellow-300 border border-yellow-500/40 shadow-lg shadow-yellow-500/10'
                  : 'bg-[#19171b]/50 text-[#DBD0C0] border border-yellow-500/20 hover:bg-yellow-500/15 hover:border-yellow-500/30'
              }`}
            >
              Restricted Access
            </button>
            {user && (
              <button
                onClick={() => setActiveFilter('eligible')}
                disabled={isLoadingSkills}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-150 ${
                  activeFilter === 'eligible'
                    ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/10'
                    : 'bg-[#19171b]/50 text-[#DBD0C0] border border-blue-500/20 hover:bg-blue-500/15 hover:border-blue-500/30'
                } ${isLoadingSkills ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoadingSkills ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300 mr-2 inline-block"></div>
                    Loading...
                  </>
                ) : (
                  'Eligible for Me'
                )}
              </button>
            )}
          </div>
          
          {/* Filter Description */}
          <div className="mt-3 text-sm text-[#CEA17A]">
            {activeFilter === 'all' && 'Showing all tournaments'}
            {activeFilter === 'open' && 'Showing tournaments with no restrictions - anyone can register'}
            {activeFilter === 'restricted' && 'Showing tournaments with community, base price, or other restrictions'}
            {activeFilter === 'eligible' && user && 'Showing tournaments where you meet all requirements'}
            {activeFilter === 'eligible' && !user && 'Please sign in to see eligible tournaments'}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl p-6 shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150">
            {/* Luxury Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
            
            <div className="relative z-10 flex items-center">
              <div className="p-2 sm:p-3 bg-[#CEA17A]/20 rounded-lg">
                <svg className="h-4 w-4 sm:h-6 sm:w-6 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#CEA17A]">Total</p>
                <p className="text-2xl font-bold text-[#DBD0C0]">{tournaments?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl p-6 shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150">
            {/* Luxury Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
            
            <div className="relative z-10 flex items-center">
              <div className="p-2 sm:p-3 bg-[#CEA17A]/20 rounded-lg">
                <svg className="h-4 w-4 sm:h-6 sm:w-6 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#CEA17A]">Active</p>
                <p className="text-2xl font-bold text-[#DBD0C0]">
                  {tournaments?.filter(t => t.status === 'registration_open' || t.status === 'auction_started').length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl p-6 shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150">
            {/* Luxury Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
            
            <div className="relative z-10 flex items-center">
              <div className="p-2 sm:p-3 bg-[#CEA17A]/20 rounded-lg">
                <svg className="h-4 w-4 sm:h-6 sm:w-6 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#CEA17A]">Draft</p>
                <p className="text-2xl font-bold text-[#DBD0C0]">
                  {tournaments?.filter(t => t.status === 'draft').length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl p-6 shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150">
            {/* Luxury Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
            
            <div className="relative z-10 flex items-center">
              <div className="p-2 sm:p-3 bg-[#CEA17A]/20 rounded-lg">
                <svg className="h-4 w-4 sm:h-6 sm:w-6 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#CEA17A]">Completed</p>
                <p className="text-2xl font-bold text-[#DBD0C0]">
                  {tournaments?.filter(t => t.status === 'auction_completed').length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tournaments Grid */}
        {tournamentsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredTournaments().map((tournament) => (
              <div key={tournament.id} className={`bg-[#19171b]/50 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-150 border border-[#CEA17A]/10 hover:animate-border-glow flex flex-col h-full relative ${
                loadingTournamentId === tournament.id ? 'opacity-75 pointer-events-none' : ''
              }`}>
                {/* Loading Overlay */}
                {loadingTournamentId === tournament.id && (
                  <div className="absolute inset-0 bg-[#19171b]/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CEA17A] mx-auto mb-2"></div>
                      <p className="text-[#CEA17A] text-sm font-medium">Loading...</p>
                    </div>
                  </div>
                )}
                
                <div className="p-6 flex flex-col h-full">
                  {/* Tournament Header */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-[#DBD0C0] line-clamp-2">
                      {tournament.name}
                    </h3>
                    <span className={`w-32 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm border text-center ${
                      tournament.status === 'registration_open' 
                        ? 'bg-green-500/15 text-green-300 border-green-500/25 shadow-lg shadow-green-500/10'
                        : tournament.status === 'completed'
                        ? 'bg-red-500/15 text-red-300 border-red-500/25 shadow-lg shadow-red-500/10'
                        : tournament.status === 'in_progress'
                        ? 'bg-red-500/15 text-red-300 border-red-500/25 shadow-lg shadow-red-500/10'
                        : tournament.status === 'draft'
                        ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25 shadow-lg shadow-yellow-500/10'
                        : 'bg-[#3E4E5A]/20 text-[#CEA17A] border border-[#CEA17A]/30'
                    }`}>
                      {tournament.status === 'registration_open' ? 'Open' : 
                       tournament.status === 'completed' ? 'Closed' :
                       tournament.status === 'in_progress' ? 'Closed' : 
                       tournament.status === 'draft' ? 'Opening Soon' : getStatusText(tournament.status)}
                    </span>
                  </div>

                  {/* Restriction Indicator */}
                  {hasRestrictions(tournament) && (
                    <div className="mb-4">
                      <div className="flex items-center text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span className="font-medium">Restricted Access</span>
                      </div>
                    </div>
                  )}

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
                    
                    {/* Enhanced Slot Information with Progress Bars */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[#CEA17A]">Total Slots:</span>
                        <span className="font-semibold text-[#DBD0C0]">{tournament.total_slots}</span>
                      </div>
                      
                      {/* Main Slots Progress Bar */}
                      <div>
                        <div className="flex justify-between text-xs text-[#DBD0C0] mb-1">
                          <span>Slots filled</span>
                          <span>{Math.round(((tournament.filled_slots || 0) / (tournament.total_slots || 1)) * 100)}%</span>
                        </div>
                        <div className="w-full bg-[#19171b] rounded-full h-1.5">
                          <div 
                            className="bg-gradient-to-r from-[#CEA17A] to-[#3E4E5A] h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${((tournament.filled_slots || 0) / (tournament.total_slots || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-[#CEA17A] mt-1">
                          <span>{tournament.filled_slots || 0} filled</span>
                          <span>{tournament.available_slots || tournament.total_slots} available</span>
                        </div>
                      </div>
                      
                      {/* Waitlist Progress Bar */}
                      {(tournament.waitlist_count || 0) > 0 && (
                        <div>
                          <div className="flex justify-between text-xs text-[#DBD0C0] mb-1">
                            <span>Waitlist</span>
                            <span>{tournament.waitlist_count} players</span>
                          </div>
                          <div className="w-full bg-[#19171b] rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-[#CEA17A] to-[#DBD0C0] h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min(((tournament.waitlist_count || 0) / 10) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-[#CEA17A]">Date & Time:</span>
                      <span className="font-semibold text-[#DBD0C0]">
                        {new Date(tournament.tournament_date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })} at {new Date(tournament.tournament_date).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
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

                    {/* Google Maps Link */}
                    {tournament.google_maps_link && (
                      <div className="space-y-1">
                        <a 
                          href={tournament.google_maps_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          View on Google Maps
                        </a>
                      </div>
                    )}

                    {/* Description */}
                    {tournament.description && (
                      <div className="space-y-1">
                        <span className="text-[#CEA17A] text-sm">Description:</span>
                        <p className="text-sm text-[#DBD0C0] line-clamp-2">{tournament.description}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-[#CEA17A]">Created:</span>
                      <span className="font-semibold text-[#DBD0C0]">
                        {new Date(tournament.created_at).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons - Bottom Aligned */}
                  <div className="flex flex-col space-y-2 mt-6">
                    <Link
                      href={`/tournaments/${tournament.id}`}
                      onClick={() => handleViewDetails(tournament.id)}
                      className={`w-full px-4 py-2 border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg transition-all duration-150 font-medium text-center flex items-center justify-center ${
                        loadingTournamentId === tournament.id
                          ? 'bg-[#CEA17A]/25 text-[#CEA17A]/70 cursor-wait'
                          : 'bg-[#CEA17A]/15 text-[#CEA17A] hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40'
                      }`}
                    >
                      {loadingTournamentId === tournament.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#CEA17A] mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        'View Details'
                      )}
                    </Link>
                    
                    {isHost && (tournament.host_id === user?.id || userProfile?.role === 'admin') && (
                      <div className="flex space-x-2">
                        <Link
                          href={`/tournaments/${tournament.id}/edit`}
                          onClick={() => handleEdit(tournament.id)}
                          className={`flex-1 px-3 py-2 border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg transition-all duration-150 text-sm font-medium text-center flex items-center justify-center ${
                            loadingTournamentId === tournament.id
                              ? 'bg-[#CEA17A]/25 text-[#CEA17A]/70 cursor-wait'
                              : 'bg-[#CEA17A]/15 text-[#CEA17A] hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40'
                          }`}
                        >
                          {loadingTournamentId === tournament.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#CEA17A] mr-1"></div>
                              Loading...
                            </>
                          ) : (
                            'Edit'
                          )}
                        </Link>
                        <button
                          onClick={() => confirmDelete(tournament.id)}
                          className="flex-1 px-3 py-2 bg-red-500/15 text-red-300 border border-red-500/25 shadow-lg shadow-red-500/10 backdrop-blur-sm rounded-lg hover:bg-red-500/25 hover:border-red-500/40 transition-all duration-150 text-sm font-medium text-center"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!tournamentsLoading && getFilteredTournaments().length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-semibold text-[#DBD0C0] mb-2">
              {activeFilter === 'all' && 'No tournaments found'}
              {activeFilter === 'open' && 'No open tournaments found'}
              {activeFilter === 'restricted' && 'No restricted tournaments found'}
              {activeFilter === 'eligible' && 'No eligible tournaments found'}
            </h3>
            <p className="text-[#CEA17A] mb-8 max-w-md mx-auto">
              {activeFilter === 'all' && (isHost ? 'Create your first tournament to get started with managing cricket tournaments.' : 'Check back later for new tournaments to participate in.')}
              {activeFilter === 'open' && 'No tournaments with open access are currently available.'}
              {activeFilter === 'restricted' && 'No tournaments with restrictions are currently available.'}
              {activeFilter === 'eligible' && (user ? 'No tournaments match your current player profile requirements.' : 'Please sign in to see eligible tournaments.')}
            </p>
            {isHost && (
              <Link
                href="/tournaments/create"
                className="inline-flex items-center px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Tournament
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#09171F]/50 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[#DBD0C0] mb-4">Delete Tournament</h3>
            <p className="text-[#CEA17A] mb-6">
              Are you sure you want to delete this tournament? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setTournamentToDelete(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => tournamentToDelete && handleDeleteTournament(tournamentToDelete)}
                disabled={isDeleting}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                  isDeleting 
                    ? 'bg-red-400 text-white cursor-not-allowed' 
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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