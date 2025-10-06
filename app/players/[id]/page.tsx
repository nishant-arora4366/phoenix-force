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
  skills?: { [key: string]: string | string[] }
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
        const response = await fetch(`/api/players/${id}`)
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

        {/* Player Details Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gray-700 px-8 py-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Player Details</h2>
              {(userRole === 'admin' || userRole === 'host') && (
                <div className="flex space-x-3">
                  <button
                    onClick={() => router.push(`/players/${player.id}/edit`)}
                    className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                  >
                    Edit Player
                  </button>
                  {userRole === 'admin' && (
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 bg-red-600 bg-opacity-80 text-white rounded-lg hover:bg-opacity-100 transition-colors"
                    >
                      Delete Player
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Display Name
                  </label>
                  <p className="text-lg text-gray-900">{player.display_name}</p>
                </div>

                {player.stage_name && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stage Name
                    </label>
                    <p className="text-lg text-gray-900 italic">"{player.stage_name}"</p>
                  </div>
                )}

                {player.group_name && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Group
                    </label>
                    <p className="text-lg text-gray-900">{player.group_name}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Base Price
                  </label>
                  <p className="text-lg text-gray-900">₹{player.base_price}</p>
                </div>

                {player.bio && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bio
                    </label>
                    <p className="text-lg text-gray-900">{player.bio}</p>
                  </div>
                )}

                {/* Skills Display */}
                {player.skills && Object.keys(player.skills).length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Skills & Attributes
                    </label>
                    <div className="space-y-2">
                      {Object.entries(player.skills).map(([skillName, skillValue]) => (
                        <div key={skillName} className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">{skillName}:</span>
                          <span className="text-sm text-gray-900">
                            {Array.isArray(skillValue) ? skillValue.join(', ') : skillValue}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Picture and Roles */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Profile Picture
                  </label>
                  {player.profile_pic_url ? (
                    <img 
                      src={player.profile_pic_url} 
                      alt="Profile" 
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Player Roles */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Player Roles
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {player.is_batter && (
                      <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full font-medium">
                        ⚾ Batter
                      </span>
                    )}
                    {player.is_bowler && (
                      <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full font-medium">
                        🏏 Bowler
                      </span>
                    )}
                    {player.is_wicket_keeper && (
                      <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full font-medium">
                        🧤 Wicket Keeper
                      </span>
                    )}
                  </div>
                </div>

                {/* Player Ratings */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Player Ratings
                  </label>
                  <div className="space-y-3">
                    {player.batting_rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Batting</span>
                        <span className="text-sm font-semibold text-gray-900">{player.batting_rating}/10</span>
                      </div>
                    )}
                    {player.bowling_rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Bowling</span>
                        <span className="text-sm font-semibold text-gray-900">{player.bowling_rating}/10</span>
                      </div>
                    )}
                    {player.wicket_keeping_rating && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Wicket Keeping</span>
                        <span className="text-sm font-semibold text-gray-900">{player.wicket_keeping_rating}/10</span>
                      </div>
                    )}
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
