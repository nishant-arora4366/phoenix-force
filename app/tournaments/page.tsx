'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { sessionManager } from '@/src/lib/session'

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

const fetcher = async (url: string) => {
  const response = await fetch('/api/tournaments')
  if (!response.ok) {
    throw new Error('Failed to fetch tournaments')
  }
  const result = await response.json()
  return result.tournaments || []
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

  const { data: tournaments, error, isLoading: tournamentsLoading, mutate } = useSWR<Tournament[]>('/api/tournaments', fetcher)

  // Check user authentication and role
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Get user from session manager
        const sessionUser = sessionManager.getUser()
        setUser(sessionUser)
        
        if (sessionUser) {
          // Fetch user profile
          const response = await fetch(`/api/user-profile?userId=${sessionUser.id}`)
          const result = await response.json()
          if (result.success) {
            setUserProfile(result.data)
            setIsHost(result.data.role === 'host' || result.data.role === 'admin')
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
    const unsubscribe = sessionManager.subscribe((sessionUser) => {
      setUser(sessionUser)
      
      if (sessionUser) {
        // Fetch user profile when user changes
        fetch(`/api/user-profile?userId=${sessionUser.id}`)
          .then(response => response.json())
          .then(result => {
            if (result.success) {
              setUserProfile(result.data)
              setIsHost(result.data.role === 'host' || result.data.role === 'admin')
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
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        mutate() // Refresh the tournaments list
        setShowDeleteModal(false)
        setTournamentToDelete(null)
      } else {
        const error = await response.json()
        alert(`Error deleting tournament: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deleting tournament:', error)
      alert('Error deleting tournament')
    }
  }

  const confirmDelete = (tournamentId: string) => {
    setTournamentToDelete(tournamentId)
    setShowDeleteModal(true)
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
              className="inline-flex items-center px-6 py-3 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 font-medium"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Tournament
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#19171b]/50 rounded-lg shadow-lg p-6 border border-[#CEA17A]/10 hover:animate-border-glow transition-all duration-150">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="h-6 w-6 text-[#CEA17A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-[#CEA17A]">Total Tournaments</p>
                <p className="text-2xl font-bold text-[#DBD0C0]">{tournaments?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-[#19171b]/50 rounded-lg shadow-lg p-6 border border-[#CEA17A]/10 hover:animate-border-glow transition-all duration-150">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

          <div className="bg-[#19171b]/50 rounded-lg shadow-lg p-6 border border-[#CEA17A]/10 hover:animate-border-glow transition-all duration-150">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

          <div className="bg-[#19171b]/50 rounded-lg shadow-lg p-6 border border-[#CEA17A]/10 hover:animate-border-glow transition-all duration-150">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
            {tournaments?.map((tournament) => (
              <div key={tournament.id} className="bg-[#19171b]/50 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-150 border border-[#CEA17A]/10 hover:animate-border-glow">
                <div className="p-6">
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

                  {/* Tournament Details */}
                  <div className="space-y-3 mb-6">
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
                      <span className="text-[#CEA17A]">Date:</span>
                      <span className="font-semibold text-[#DBD0C0]">
                        {new Date(tournament.tournament_date).toLocaleDateString()}
                      </span>
                    </div>

                    {tournament.description && (
                      <div className="mt-3">
                        <span className="text-[#CEA17A] text-sm">Description:</span>
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">{tournament.description}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-[#CEA17A]">Created:</span>
                      <span className="font-semibold text-[#DBD0C0]">
                        {new Date(tournament.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2">
                    <Link
                      href={`/tournaments/${tournament.id}`}
                      className="w-full px-4 py-2 bg-blue-500/15 text-blue-300 border border-blue-500/25 shadow-lg shadow-blue-500/10 backdrop-blur-sm rounded-lg hover:bg-blue-500/25 hover:border-blue-500/40 transition-all duration-150 font-medium text-center"
                    >
                      View Details
                    </Link>
                    
                    {isHost && (tournament.host_id === user?.id || userProfile?.role === 'admin') && (
                      <div className="flex space-x-2">
                        <Link
                          href={`/tournaments/${tournament.id}/edit`}
                          className="flex-1 px-3 py-2 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 text-sm font-medium text-center"
                        >
                          Edit
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
        {!tournamentsLoading && tournaments?.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-semibold text-[#DBD0C0] mb-2">
              No tournaments found
            </h3>
            <p className="text-[#CEA17A] mb-8 max-w-md mx-auto">
              {isHost ? 'Create your first tournament to get started with managing cricket tournaments.' : 'Check back later for new tournaments to participate in.'}
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
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}