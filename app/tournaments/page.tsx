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
      return 'bg-gray-100 text-gray-700'
    case 'registration_open':
      return 'bg-green-100 text-green-700'
    case 'registration_closed':
      return 'bg-yellow-100 text-yellow-700'
    case 'auction_started':
      return 'bg-blue-100 text-blue-700'
    case 'auction_completed':
      return 'bg-purple-100 text-purple-700'
    case 'teams_formed':
      return 'bg-indigo-100 text-indigo-700'
    case 'completed':
      return 'bg-green-100 text-green-700'
    case 'in_progress':
      return 'bg-orange-100 text-orange-700'
    default:
      return 'bg-gray-100 text-gray-700'
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
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tournaments...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold">Error loading tournaments</h2>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Tournaments</h1>
            <p className="text-gray-600 mt-2">
              Manage and participate in cricket tournaments
            </p>
          </div>
          {isHost && (
            <Link
              href="/tournaments/create"
              className="inline-flex items-center px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Tournament
            </Link>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tournaments</p>
                <p className="text-2xl font-bold text-gray-900">{tournaments?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tournaments?.filter(t => t.status === 'registration_open' || t.status === 'auction_started').length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tournaments?.filter(t => t.status === 'draft').length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
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
              <div key={tournament.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow border border-gray-200">
                <div className="p-6">
                  {/* Tournament Header */}
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                      {tournament.name}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                      {getStatusText(tournament.status)}
                    </span>
                  </div>

                  {/* Tournament Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Format:</span>
                      <span className="font-semibold text-gray-900">{tournament.format}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Teams:</span>
                      <span className="font-semibold text-gray-900">{tournament.selected_teams}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Slots:</span>
                      <span className="font-semibold text-gray-900">{tournament.total_slots}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(tournament.tournament_date).toLocaleDateString()}
                      </span>
                    </div>

                    {tournament.description && (
                      <div className="mt-3">
                        <span className="text-gray-600 text-sm">Description:</span>
                        <p className="text-sm text-gray-700 mt-1 line-clamp-2">{tournament.description}</p>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(tournament.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2">
                    <Link
                      href={`/tournaments/${tournament.id}`}
                      className="w-full px-4 py-2 bg-gray-700 text-white text-center rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                      View Details
                    </Link>
                    
                    {isHost && (tournament.host_id === user?.id || userProfile?.role === 'admin') && (
                      <div className="flex space-x-2">
                        <Link
                          href={`/tournaments/${tournament.id}/edit`}
                          className="flex-1 px-3 py-2 bg-gray-700 text-white text-center rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => confirmDelete(tournament.id)}
                          className="flex-1 px-3 py-2 bg-red-600 text-white text-center rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
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
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No tournaments found
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Tournament</h3>
            <p className="text-gray-600 mb-6">
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