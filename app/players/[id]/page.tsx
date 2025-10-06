'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sessionManager } from '@/lib/session'

interface Player {
  id: string
  display_name: string
  bio?: string
  profile_pic_url?: string
  mobile_number?: string
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

        const player = result.data
        console.log('Player data received:', player)
        console.log('Player skills:', player.skills)
        setPlayer(player)
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

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:gap-8">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {player.profile_pic_url ? (
                <img 
                  src={player.profile_pic_url} 
                  alt={player.display_name}
                  className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full object-cover shadow-lg border-4 border-white"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full bg-white shadow-lg border-4 border-white flex items-center justify-center">
                  <svg className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{player.display_name}</h1>
              
              {/* Player Roles */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 mb-4 sm:mb-6">
                {player.skills?.Role && (
                  <span className="bg-green-100 text-green-800 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 rounded-full font-semibold shadow-sm">
                    🏏 {player.skills.Role}
                  </span>
                )}
                {player.skills?.['Batting Style'] && (
                  <span className="bg-blue-100 text-blue-800 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 rounded-full font-semibold shadow-sm">
                    ⚾ {player.skills['Batting Style']}
                  </span>
                )}
                {player.skills?.['Bowling Style'] && (
                  <span className="bg-purple-100 text-purple-800 text-xs sm:text-sm px-3 sm:px-4 py-1 sm:py-2 rounded-full font-semibold shadow-sm">
                    🎯 {player.skills['Bowling Style']}
                  </span>
                )}
              </div>

              {/* Base Price */}
              {player.skills?.['Base Price'] && (
                <div className="inline-flex items-center bg-white rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg">
                  <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">₹{player.skills['Base Price']}</span>
                  <span className="text-xs sm:text-sm text-gray-500 ml-2">Base Price</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {(userRole === 'admin' || userRole === 'host') && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => router.push(`/players/${player.id}/edit`)}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-lg font-semibold text-sm sm:text-base"
                >
                  ✏️ Edit Player
                </button>
                {userRole === 'admin' && (
                  <button
                    onClick={handleDelete}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors shadow-lg font-semibold text-sm sm:text-base"
                  >
                    🗑️ Delete Player
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Basic Information */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Bio Section */}
            {player.bio && (
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                  <span className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 text-sm sm:text-base">
                    📝
                  </span>
                  About
                </h3>
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{player.bio}</p>
              </div>
            )}

            {/* Skills & Attributes */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
                <span className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 text-sm sm:text-base">
                  ⚡
                </span>
                Skills & Attributes
              </h3>
              {player.skills && Object.keys(player.skills).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {Object.entries(player.skills).map(([skillName, skillValue]) => (
                    <div key={skillName} className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                      <div className="text-xs sm:text-sm font-semibold text-gray-600 mb-1">{skillName}</div>
                      <div className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">
                        {Array.isArray(skillValue) ? skillValue.join(', ') : skillValue}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-3">⚡</div>
                  <p className="text-gray-500 text-sm sm:text-base">No skills and attributes configured yet</p>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">Skills will appear here once configured</p>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <span className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded-lg flex items-center justify-center mr-2 text-xs sm:text-sm">
                  📊
                </span>
                Quick Stats
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {player.skills?.['Base Price'] && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs sm:text-sm text-gray-600">Base Price</span>
                    <span className="font-bold text-gray-900 text-sm sm:text-base">₹{player.skills['Base Price']}</span>
                  </div>
                )}
                {player.skills?.Group && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-xs sm:text-sm text-gray-600">Group</span>
                    <span className="font-bold text-gray-900 text-sm sm:text-base">{player.skills.Group}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-xs sm:text-sm text-gray-600">Created</span>
                  <span className="font-bold text-gray-900 text-sm sm:text-base">
                    {new Date(player.created_at).toLocaleDateString()}
                  </span>
                </div>
                {player.updated_at && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-xs sm:text-sm text-gray-600">Updated</span>
                    <span className="font-bold text-gray-900 text-sm sm:text-base">
                      {new Date(player.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <span className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-100 rounded-lg flex items-center justify-center mr-2 text-xs sm:text-sm">
                  ⚙️
                </span>
                Actions
              </h3>
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => router.push('/players')}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-600 text-white rounded-lg sm:rounded-xl hover:bg-gray-700 transition-colors font-semibold text-sm sm:text-base"
                >
                  ← Back to Players
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
