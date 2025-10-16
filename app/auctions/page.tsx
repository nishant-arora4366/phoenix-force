'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { secureSessionManager } from '@/src/lib/secure-session'
import { getSupabaseClient } from '@/src/lib/supabaseClient'

interface Auction {
  id: string
  tournament_id: string
  status: string // draft, pending, live, paused, completed, cancelled
  current_player_id?: string
  current_player_index: number
  current_bid: number
  current_highest_bidder_team_id?: string
  max_tokens_per_captain: number
  min_bid_amount: number
  use_base_price: boolean
  min_increment: number
  use_fixed_increments: boolean
  custom_increments?: any
  timer_seconds: number
  player_order_type: string
  player_order?: any
  created_by: string
  created_at: string
  updated_at: string
  started_at?: string
  completed_at?: string
  // Tournament information (joined)
  tournament_name?: string
  tournament_format?: string
  tournament_date?: string
  // Computed fields
  total_players?: number
  current_bids?: number
  highest_bid?: number
}

interface User {
  id: string
  email: string
  username?: string
  firstname?: string
  lastname?: string
  role: string
}

const fetcher = async (url: string) => {
  const response = await fetch('/api/auctions')
  if (!response.ok) {
    throw new Error('Failed to fetch auctions')
  }
  const result = await response.json()
  const auctions = result.auctions || []
  
  // Define status priority: Live first, then Draft, then Past
  const getStatusPriority = (status: string) => {
    switch (status) {
      case 'live': return 1 // Live - highest priority
      case 'draft': return 2 // Draft
      case 'completed': return 3 // Past
      case 'cancelled': return 4
      default: return 5
    }
  }

  // Sort auctions by status priority first, then by start date
  return auctions.sort((a: any, b: any) => {
    const statusPriorityA = getStatusPriority(a.status)
    const statusPriorityB = getStatusPriority(b.status)
    
    // If status priorities are different, sort by status
    if (statusPriorityA !== statusPriorityB) {
      return statusPriorityA - statusPriorityB
    }
    
    // If same status, sort by created date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft':
      return 'bg-[#3E4E5A]/20 text-[#CEA17A] border border-[#CEA17A]/30'
    case 'live':
      return 'bg-green-500/20 text-green-300 border border-green-500/30'
    case 'paused':
      return 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
    case 'completed':
      return 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
    case 'cancelled':
      return 'bg-red-500/20 text-red-300 border border-red-500/30'
    default:
      return 'bg-[#3E4E5A]/20 text-[#CEA17A] border border-[#CEA17A]/30'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'draft':
      return 'Draft'
    case 'live':
      return 'Live'
    case 'paused':
      return 'Paused'
    case 'completed':
      return 'Completed'
    case 'cancelled':
      return 'Cancelled'
    default:
      return status
  }
}

// Component that uses useSearchParams - needs to be wrapped in Suspense
function AuctionsContent() {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [isHost, setIsHost] = useState(false)
  const [isUserLoading, setIsUserLoading] = useState(true)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [auctionToDelete, setAuctionToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageModal, setMessageModal] = useState({ type: '', message: '' })
  const [loadingAuctionId, setLoadingAuctionId] = useState<string | null>(null)
  
  // Filter states
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'draft' | 'completed'>('all')

  // Track component mount status to prevent state updates after unmount
  const isMountedRef = useRef(true)
  
  // Initialize Supabase client for realtime
  const supabase = getSupabaseClient()

  const { data: auctions, error, isLoading: auctionsLoading, mutate } = useSWR<Auction[]>('/api/auctions', fetcher)
  
  // Get URL search parameters for tournament filtering
  const searchParams = useSearchParams()
  const tournamentId = searchParams.get('tournament')

  // Filter auctions by tournament if tournament parameter is provided
  const filteredAuctions = tournamentId 
    ? auctions?.filter(auction => auction.tournament_id === tournamentId) || []
    : auctions || []

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

  // Cleanup effect to track component mount status
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Realtime subscriptions for auction updates
  useEffect(() => {
    let auctionsChannel: any = null

    try {
      // Subscribe to auction changes (status updates, etc.)
      auctionsChannel = supabase
        .channel('auctions-list-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'auctions'
          },
          (payload: any) => {
            if (isMountedRef.current) {
              console.log('Auction updated:', payload)
              // Refresh auctions list when any auction is updated
              mutate()
            }
          }
        )
        .subscribe((status: string, err: any) => {
          if (err) {
            console.warn('Auctions channel subscription error:', err)
          }
        })

    } catch (error) {
      console.warn('Error setting up realtime subscriptions:', error)
    }

    // Cleanup subscriptions on component unmount
    return () => {
      setTimeout(() => {
        try {
          if (auctionsChannel) {
            supabase.removeChannel(auctionsChannel)
          }
        } catch (error) {
          console.warn('Error cleaning up realtime subscriptions:', error)
        }
      }, 100)
    }
  }, [mutate])

  const handleDeleteAuction = async (auctionId: string) => {
    setIsDeleting(true)
    try {
      const token = secureSessionManager.getToken()
      if (!token) {
        setMessageModal({ type: 'error', message: 'Authentication required to delete auction' })
        setShowMessageModal(true)
        return
      }

      const response = await fetch(`/api/auctions/${auctionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setMessageModal({ type: 'success', message: 'Auction deleted successfully!' })
        setShowMessageModal(true)
        mutate() // Refresh the auctions list
        setShowDeleteModal(false)
        setAuctionToDelete(null)
        
        // Auto-close success message after 2 seconds
        setTimeout(() => {
          setShowMessageModal(false)
        }, 2000)
      } else {
        const error = await response.json()
        setMessageModal({ type: 'error', message: `Error deleting auction: ${error.message || error.error || 'Unknown error'}` })
        setShowMessageModal(true)
      }
    } catch (error) {
      setMessageModal({ type: 'error', message: 'Error deleting auction. Please try again.' })
      setShowMessageModal(true)
    } finally {
      setIsDeleting(false)
    }
  }

  const confirmDelete = (auctionId: string) => {
    setAuctionToDelete(auctionId)
    setShowDeleteModal(true)
  }

  const handleViewDetails = (auctionId: string) => {
    setLoadingAuctionId(auctionId)
    // The Link will handle navigation, we'll clear the loading state after a short delay
    setTimeout(() => {
      setLoadingAuctionId(null)
    }, 1000)
  }

  const handleEdit = (auctionId: string) => {
    setLoadingAuctionId(auctionId)
    // The Link will handle navigation, we'll clear the loading state after a short delay
    setTimeout(() => {
      setLoadingAuctionId(null)
    }, 1000)
  }

  // Filter auctions based on active filter
  const getFilteredAuctions = (): Auction[] => {
    if (!auctions) return []
    
    switch (activeFilter) {
      case 'live':
        return filteredAuctions.filter(auction => auction.status === 'live')
      case 'draft':
        return filteredAuctions.filter(auction => auction.status === 'draft')
      case 'completed':
        return filteredAuctions.filter(auction => auction.status === 'completed')
      default:
        return filteredAuctions
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center py-20 bg-[#19171b] min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto"></div>
          <p className="mt-4 text-[#DBD0C0]">Loading auctions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-[#19171b] min-h-screen">
        <div className="bg-red-500/20 text-red-300 border border-red-500/30 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Error loading auctions</h2>
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
            <h1 className="text-4xl font-bold text-[#DBD0C0]">Auctions</h1>
            <p className="text-[#CEA17A] mt-2">
              Manage and participate in player auctions
            </p>
            {tournamentId && (
              <div className="mt-4 p-3 bg-[#CEA17A]/10 border border-[#CEA17A]/20 rounded-lg">
                <p className="text-sm text-[#CEA17A]">
                  <span className="font-medium">Filtered by Tournament:</span> Showing auctions for this tournament only
                </p>
                <Link 
                  href="/auctions" 
                  className="text-xs text-[#CEA17A]/70 hover:text-[#CEA17A] underline mt-1 inline-block"
                >
                  View all auctions
                </Link>
              </div>
            )}
          </div>
          {isHost && (
            <Link
              href="/auctions/create"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 font-medium"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Auction
            </Link>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-150 ${
                activeFilter === 'all'
                  ? 'bg-[#CEA17A]/25 text-[#CEA17A] border border-[#CEA17A]/40 shadow-lg shadow-[#CEA17A]/10'
                  : 'bg-[#19171b]/50 text-[#DBD0C0] border border-[#CEA17A]/20 hover:bg-[#CEA17A]/15 hover:border-[#CEA17A]/30'
              }`}
            >
              All Auctions
            </button>
            <button
              onClick={() => setActiveFilter('live')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-150 ${
                activeFilter === 'live'
                  ? 'bg-green-500/25 text-green-300 border border-green-500/40 shadow-lg shadow-green-500/10'
                  : 'bg-[#19171b]/50 text-[#DBD0C0] border border-green-500/20 hover:bg-green-500/15 hover:border-green-500/30'
              }`}
            >
              Live Auctions
            </button>
            <button
              onClick={() => setActiveFilter('draft')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-150 ${
                activeFilter === 'draft'
                  ? 'bg-yellow-500/25 text-yellow-300 border border-yellow-500/40 shadow-lg shadow-yellow-500/10'
                  : 'bg-[#19171b]/50 text-[#DBD0C0] border border-yellow-500/20 hover:bg-yellow-500/15 hover:border-yellow-500/30'
              }`}
            >
              Drafts
            </button>
            <button
              onClick={() => setActiveFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-150 ${
                activeFilter === 'completed'
                  ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40 shadow-lg shadow-blue-500/10'
                  : 'bg-[#19171b]/50 text-[#DBD0C0] border border-blue-500/20 hover:bg-blue-500/15 hover:border-blue-500/30'
              }`}
            >
              Past Auctions
            </button>
          </div>
          
          {/* Filter Description */}
          <div className="mt-3 text-sm text-[#CEA17A]">
            {activeFilter === 'all' && 'Showing all auctions'}
            {activeFilter === 'live' && 'Showing currently active auctions'}
            {activeFilter === 'draft' && 'Showing draft auctions (Admin/Host only)'}
            {activeFilter === 'completed' && 'Showing completed auctions'}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d] rounded-xl p-6 shadow-xl border border-[#CEA17A]/20 hover:animate-border-glow transition-all duration-150">
            {/* Luxury Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#CEA17A]/10 via-transparent to-[#CEA17A]/5 rounded-xl"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#19171b]/60 via-transparent to-[#2b0307]/30 rounded-xl"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#CEA17A]/8 to-transparent rounded-xl"></div>
            
            <div className="relative z-10 flex items-center">
              <div className="p-2 sm:p-3 bg-[#CEA17A]/20 rounded-lg">
                <svg className="h-4 w-4 sm:h-6 sm:w-6 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#CEA17A]">Total</p>
                <p className="text-2xl font-bold text-[#DBD0C0]">{filteredAuctions?.length || 0}</p>
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
                <p className="text-sm font-medium text-[#CEA17A]">Live</p>
                <p className="text-2xl font-bold text-[#DBD0C0]">
                  {filteredAuctions?.filter(a => a.status === 'live').length || 0}
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
                <p className="text-sm font-medium text-[#CEA17A]">Drafts</p>
                <p className="text-2xl font-bold text-[#DBD0C0]">
                  {filteredAuctions?.filter(a => a.status === 'draft').length || 0}
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
                  {filteredAuctions?.filter(a => a.status === 'completed').length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Auctions Grid */}
        {auctionsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredAuctions().map((auction) => (
              <div key={auction.id} className={`bg-[#19171b]/50 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-150 border border-[#CEA17A]/10 hover:animate-border-glow flex flex-col h-full relative ${
                loadingAuctionId === auction.id ? 'opacity-75 pointer-events-none' : ''
              }`}>
                {/* Loading Overlay */}
                {loadingAuctionId === auction.id && (
                  <div className="absolute inset-0 bg-[#19171b]/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CEA17A] mx-auto mb-2"></div>
                      <p className="text-[#CEA17A] text-sm font-medium">Loading...</p>
                    </div>
                  </div>
                )}
                
                <div className="p-6 flex flex-col h-full">
                  {/* Auction Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-[#DBD0C0] line-clamp-2">
                        {auction.tournament_name || `Auction for Tournament`}
                      </h3>
                      {auction.tournament_format && (
                        <p className="text-sm text-[#CEA17A] mt-1">
                          {auction.tournament_format}
                        </p>
                      )}
                    </div>
                    <span className={`w-32 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm border text-center ${
                      auction.status === 'live' 
                        ? 'bg-green-500/15 text-green-300 border-green-500/25 shadow-lg shadow-green-500/10'
                        : auction.status === 'completed'
                        ? 'bg-blue-500/15 text-blue-300 border-blue-500/25 shadow-lg shadow-blue-500/10'
                        : auction.status === 'draft'
                        ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25 shadow-lg shadow-yellow-500/10'
                        : 'bg-[#3E4E5A]/20 text-[#CEA17A] border border-[#CEA17A]/30'
                    }`}>
                      {getStatusText(auction.status)}
                    </span>
                  </div>

                  {/* Auction Details */}
                  <div className="space-y-3 flex-grow">
                    {auction.tournament_date && (
                      <div className="flex justify-between items-center">
                        <span className="text-[#CEA17A]">Tournament Date:</span>
                        <span className="font-semibold text-[#DBD0C0]">
                          {new Date(auction.tournament_date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    )}
                    
                    {auction.started_at && (
                      <div className="flex justify-between items-center">
                        <span className="text-[#CEA17A]">Started:</span>
                        <span className="font-semibold text-[#DBD0C0]">
                          {new Date(auction.started_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })} at {new Date(auction.started_at).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
                      </div>
                    )}
                    
                    {auction.completed_at && (
                      <div className="flex justify-between items-center">
                        <span className="text-[#CEA17A]">Completed:</span>
                        <span className="font-semibold text-[#DBD0C0]">
                          {new Date(auction.completed_at).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })} at {new Date(auction.completed_at).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </span>
                      </div>
                    )}

                    {/* Auction Configuration */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[#CEA17A]">Max Tokens per Captain:</span>
                        <span className="font-semibold text-[#DBD0C0]">{auction.max_tokens_per_captain.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-[#CEA17A]">Min Bid Amount:</span>
                        <span className="font-semibold text-[#DBD0C0]">${auction.min_bid_amount}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-[#CEA17A]">Current Bid:</span>
                        <span className="font-semibold text-[#DBD0C0]">${auction.current_bid}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-[#CEA17A]">Timer:</span>
                        <span className="font-semibold text-[#DBD0C0]">{auction.timer_seconds}s</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-[#CEA17A]">Use Base Price:</span>
                        <span className="font-semibold text-[#DBD0C0]">{auction.use_base_price ? 'Yes' : 'No'}</span>
                      </div>
                    </div>

                    {/* Player Order Type */}
                    <div className="flex justify-between items-center">
                      <span className="text-[#CEA17A]">Player Order:</span>
                      <span className="font-semibold text-[#DBD0C0]">
                        {auction.player_order_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-[#CEA17A]">Created:</span>
                      <span className="font-semibold text-[#DBD0C0]">
                        {new Date(auction.created_at).toLocaleDateString('en-US', { 
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
                      href={`/auctions/${auction.id}`}
                      onClick={() => handleViewDetails(auction.id)}
                      className={`w-full px-4 py-2 border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg transition-all duration-150 font-medium text-center flex items-center justify-center ${
                        loadingAuctionId === auction.id
                          ? 'bg-[#CEA17A]/25 text-[#CEA17A]/70 cursor-wait'
                          : 'bg-[#CEA17A]/15 text-[#CEA17A] hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40'
                      }`}
                    >
                      {loadingAuctionId === auction.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#CEA17A] mr-2"></div>
                          Loading...
                        </>
                      ) : (
                        'View Details'
                      )}
                    </Link>
                    
                    {isHost && (auction.created_by === user?.id || userProfile?.role === 'admin') && (
                      <div className="flex space-x-2">
                        <Link
                          href={`/auctions/${auction.id}/edit`}
                          onClick={() => handleEdit(auction.id)}
                          className={`flex-1 px-3 py-2 border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg transition-all duration-150 text-sm font-medium text-center flex items-center justify-center ${
                            loadingAuctionId === auction.id
                              ? 'bg-[#CEA17A]/25 text-[#CEA17A]/70 cursor-wait'
                              : 'bg-[#CEA17A]/15 text-[#CEA17A] hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40'
                          }`}
                        >
                          {loadingAuctionId === auction.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-[#CEA17A] mr-1"></div>
                              Loading...
                            </>
                          ) : (
                            'Edit'
                          )}
                        </Link>
                        <button
                          onClick={() => confirmDelete(auction.id)}
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
        {!auctionsLoading && getFilteredAuctions().length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">💰</div>
            <h3 className="text-2xl font-semibold text-[#DBD0C0] mb-2">
              {activeFilter === 'all' && 'No auctions found'}
              {activeFilter === 'live' && 'No live auctions found'}
              {activeFilter === 'draft' && 'No draft auctions found'}
              {activeFilter === 'completed' && 'No completed auctions found'}
            </h3>
            <p className="text-[#CEA17A] mb-8 max-w-md mx-auto">
              {activeFilter === 'all' && (isHost ? 'Create your first auction to get started with managing player auctions.' : 'Check back later for new auctions to participate in.')}
              {activeFilter === 'live' && 'No auctions are currently live.'}
              {activeFilter === 'draft' && 'No draft auctions are available.'}
              {activeFilter === 'completed' && 'No completed auctions are available.'}
            </p>
            {isHost && (
              <Link
                href="/auctions/create"
                className="inline-flex items-center px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Auction
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#09171F]/50 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[#DBD0C0] mb-4">Delete Auction</h3>
            <p className="text-[#CEA17A] mb-6">
              Are you sure you want to delete this auction? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setAuctionToDelete(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => auctionToDelete && handleDeleteAuction(auctionToDelete)}
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

// Loading component for Suspense fallback
function AuctionsLoading() {
  return (
    <div className="min-h-screen bg-[#19171b]">
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto"></div>
          <p className="mt-4 text-[#DBD0C0]">Loading auctions...</p>
        </div>
      </div>
    </div>
  )
}

// Main page component with Suspense wrapper
export default function AuctionsPage() {
  return (
    <Suspense fallback={<AuctionsLoading />}>
      <AuctionsContent />
    </Suspense>
  )
}
