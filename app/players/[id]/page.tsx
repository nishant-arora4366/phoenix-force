'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sessionManager } from '@/lib/session'

interface Player {
  id: string
  display_name: string
  stage_name?: string
  bio?: string
  profile_pic_url?: string
  base_price: number
  group_name?: string
  is_bowler: boolean
  is_batter: boolean
  is_wicket_keeper: boolean
  bowling_rating?: number
  batting_rating?: number
  wicket_keeping_rating?: number
  created_at: string
  updated_at?: string
}

export default function PlayerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { id } = await params
        
        // Get user info
        const currentUser = sessionManager.getUser()
        if (currentUser) {
          setUser(currentUser)
          setUserRole(currentUser.role || null)
        }

        // Fetch player data
        const currentUser = sessionManager.getUser()
        const response = await fetch(`/api/players/${id}`, {
          headers: currentUser ? {
            'Authorization': JSON.stringify(currentUser)
          } : {}
        })
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch player')
        }

        setPlayer(result.data)
      } catch (error: any) {
        console.error('Error fetching player:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Listen for auth changes
    const unsubscribe = sessionManager.subscribe((userData) => {
      if (userData) {
        setUser(userData)
        setUserRole(userData.role || null)
      } else {
        setUser(null)
        setUserRole(null)
      }
    })

    return () => unsubscribe()
  }, [params])

  const handleDelete = async () => {
    if (!player || !confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
      return
    }

    try {
      const currentUser = sessionManager.getUser()
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(`/api/players/${player.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': JSON.stringify(currentUser)
        }
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete player')
      }

      // Redirect to players list
      router.push('/players')
    } catch (error: any) {
      console.error('Error deleting player:', error)
      alert(`Error: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Loading Player...
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Fetching player information
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
            <div className="text-center">
              <div className="text-gray-500 text-4xl sm:text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Player Not Found
              </h2>
              <p className="text-gray-600 mb-6">
                {error || 'The requested player could not be found.'}
              </p>
              <button
                onClick={() => router.push('/players')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Players
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">{player.display_name}</h1>
              {player.stage_name && (
                <p className="text-base sm:text-xl text-gray-600 italic">"{player.stage_name}"</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {(userRole === 'admin' || userRole === 'host') && (
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => router.push(`/players/${player.id}/edit`)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
              >
                Edit Player
              </button>
              {userRole === 'admin' && (
                <button
                  onClick={handleDelete}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                >
                  Delete Player
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Player Info Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Player Image */}
              <div className="relative h-48 sm:h-64 bg-gradient-to-br from-gray-100 to-gray-200">
                {player.profile_pic_url ? (
                  <img
                    src={player.profile_pic_url}
                    alt={player.display_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <div className="text-6xl sm:text-8xl text-gray-400">🏏</div>
                  </div>
                )}
                
                {/* Price Badge */}
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-gray-700 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-sm sm:text-lg font-bold shadow-lg">
                  ₹{player.base_price}
                </div>
                
                {/* Group Badge */}
                {player.group_name && (
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-gray-600 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-lg">
                    {player.group_name}
                  </div>
                )}
              </div>

              {/* Player Details */}
              <div className="p-4 sm:p-8">
                {/* Bio */}
                {player.bio && (
                  <div className="mb-6 sm:mb-8">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">About</h3>
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{player.bio}</p>
                  </div>
                )}

                {/* Roles */}
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Player Roles</h3>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {player.is_batter && (
                      <span className="bg-gray-100 text-gray-700 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 rounded-full font-medium">
                        ⚾ Batter
                      </span>
                    )}
                    {player.is_bowler && (
                      <span className="bg-gray-100 text-gray-700 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 rounded-full font-medium">
                        🏏 Bowler
                      </span>
                    )}
                    {player.is_wicket_keeper && (
                      <span className="bg-gray-100 text-gray-700 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 rounded-full font-medium">
                        🧤 Wicket Keeper
                      </span>
                    )}
                  </div>
                </div>

                {/* Ratings */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Player Ratings</h3>
                  <div className="space-y-3 sm:space-y-4">
                    {player.batting_rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium text-sm sm:text-base">Batting</span>
                        <div className="flex items-center">
                          <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2 sm:h-3 mr-2 sm:mr-3">
                            <div 
                              className="bg-gray-600 h-2 sm:h-3 rounded-full" 
                              style={{ width: `${(player.batting_rating / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm sm:text-lg font-bold text-gray-900">{player.batting_rating}/10</span>
                        </div>
                      </div>
                    )}
                    {player.bowling_rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium text-sm sm:text-base">Bowling</span>
                        <div className="flex items-center">
                          <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2 sm:h-3 mr-2 sm:mr-3">
                            <div 
                              className="bg-gray-600 h-2 sm:h-3 rounded-full" 
                              style={{ width: `${(player.bowling_rating / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm sm:text-lg font-bold text-gray-900">{player.bowling_rating}/10</span>
                        </div>
                      </div>
                    )}
                    {player.wicket_keeping_rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium text-sm sm:text-base">Wicket Keeping</span>
                        <div className="flex items-center">
                          <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2 sm:h-3 mr-2 sm:mr-3">
                            <div 
                              className="bg-gray-600 h-2 sm:h-3 rounded-full" 
                              style={{ width: `${(player.wicket_keeping_rating / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm sm:text-lg font-bold text-gray-900">{player.wicket_keeping_rating}/10</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Stats</h3>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm sm:text-base">Base Price</span>
                  <span className="font-semibold text-gray-700 text-sm sm:text-base">₹{player.base_price}</span>
                </div>
                {player.group_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">Group</span>
                    <span className="font-semibold text-gray-900 text-sm sm:text-base">{player.group_name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 text-sm sm:text-base">Created</span>
                  <span className="font-semibold text-gray-900 text-sm sm:text-base">
                    {new Date(player.created_at).toLocaleDateString()}
                  </span>
                </div>
                {player.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 text-sm sm:text-base">Updated</span>
                    <span className="font-semibold text-gray-900 text-sm sm:text-base">
                      {new Date(player.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Actions</h3>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => router.push('/players')}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
                >
                  Back to Players
                </button>
                {(userRole === 'admin' || userRole === 'host') && (
                  <button
                    onClick={() => router.push(`/players/${player.id}/edit`)}
                    className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
                  >
                    Edit Player
                  </button>
                )}
                {userRole === 'admin' && (
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors text-sm sm:text-base"
                  >
                    Delete Player
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
