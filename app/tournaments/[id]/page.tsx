'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

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
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isHost, setIsHost] = useState(false)

  useEffect(() => {
    const fetchTournamentAndUser = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)

        if (user) {
          // Fetch user profile
          const response = await fetch(`/api/user-profile?userId=${user.id}`)
          const result = await response.json()
          if (result.success) {
            setUserProfile(result.data)
            setIsHost(result.data.role === 'host' || result.data.role === 'admin')
          }
        }

        // Fetch tournament data
        const { data: tournamentData, error: tournamentError } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', tournamentId)
          .single()

        if (tournamentError) {
          setError('Tournament not found')
          return
        }

        setTournament(tournamentData)
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading tournament...</p>
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tournament Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The tournament you are looking for does not exist.'}</p>
          <Link
            href="/tournaments"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/tournaments"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">{tournament.name}</h1>
                <p className="text-gray-600 mt-2">Tournament Details</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(tournament.status)}`}>
                {getStatusText(tournament.status)}
              </span>
              {isHost && (
                <Link
                  href={`/tournaments/${tournament.id}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Tournament
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tournament Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white">Tournament Information</h2>
                <p className="text-blue-100 mt-2">Complete tournament details and configuration</p>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>
    </div>
  )
}
