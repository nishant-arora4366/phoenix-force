'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sessionManager } from '@/src/lib/session'

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

        // Fetch player data with user role for skill filtering
        const response = await fetch(`/api/players/${id}`, {
          headers: {
            'Authorization': JSON.stringify(currentUser || { role: 'viewer' })
          }
        })
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

        {/* Player Card - Similar to Players Page */}
        <div className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 mb-6 sm:mb-8">
          {/* Player Image Header */}
          <div className="relative h-64 sm:h-80 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
            {player.profile_pic_url ? (
              <img
                src={player.profile_pic_url}
                alt={player.display_name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <div className="text-8xl text-gray-400">🏏</div>
              </div>
            )}
            
            {/* Price Badge */}
            {player.skills?.['Base Price'] && (
              <div className="absolute top-4 right-4 bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                ₹{player.skills['Base Price']}
              </div>
            )}
            
            {/* Group Badge */}
            {player.skills?.Group && (
              <div className="absolute top-4 left-4 bg-gray-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                {player.skills.Group}
              </div>
            )}
          </div>

          {/* Player Info */}
          <div className="p-6">
            <div className="mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 group-hover:text-gray-600 transition-colors mb-2">
                {player.display_name}
              </h1>
            </div>

            {/* Roles and Skills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {player.skills?.Role && (
                <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                  🏏 {player.skills.Role}
                </span>
              )}
              {player.skills?.['Batting Style'] && (
                <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                  ⚾ {player.skills['Batting Style']}
                </span>
              )}
              {player.skills?.['Bowling Style'] && (
                <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                  🎯 {player.skills['Bowling Style']}
                </span>
              )}
              {/* Display additional skills */}
              {player.skills && Object.entries(player.skills).map(([skillName, skillValue]) => {
                // Skip if it's already displayed as a role above
                if (['Role', 'Base Price', 'Batting Style', 'Bowling Style', 'Group'].includes(skillName)) return null;
                
                return (
                  <span key={skillName} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                    {skillName}: {Array.isArray(skillValue) ? skillValue.join(', ') : skillValue}
                  </span>
                );
              })}
            </div>

            {/* Bio */}
            {player.bio && (
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{player.bio}</p>
            )}

            {/* Action Buttons */}
            {(userRole === 'admin' || userRole === 'host') && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => router.push(`/players/${player.id}/edit`)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold"
                >
                  Edit Player
                </button>
                {userRole === 'admin' && (
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-semibold"
                  >
                    Delete Player
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Additional Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skills & Attributes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-3 text-sm">
                ⚡
              </span>
              Skills & Attributes
            </h3>
            {player.skills && Object.keys(player.skills).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(player.skills).map(([skillName, skillValue]) => (
                  <div key={skillName} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-sm font-medium text-gray-600">{skillName}</span>
                    <span className="text-sm font-bold text-gray-900">
                      {Array.isArray(skillValue) ? skillValue.join(', ') : skillValue}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-3">⚡</div>
                <p className="text-gray-500 text-sm">No skills and attributes configured yet</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center mr-3 text-sm">
                📊
              </span>
              Quick Stats
            </h3>
            <div className="space-y-3">
              {player.skills?.['Base Price'] && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Base Price</span>
                  <span className="font-bold text-gray-900">₹{player.skills['Base Price']}</span>
                </div>
              )}
              {player.skills?.Group && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Group</span>
                  <span className="font-bold text-gray-900">{player.skills.Group}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Created</span>
                <span className="font-bold text-gray-900">
                  {new Date(player.created_at).toLocaleDateString()}
                </span>
              </div>
              {player.updated_at && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Updated</span>
                  <span className="font-bold text-gray-900">
                    {new Date(player.updated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back to Players Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/players')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            ← Back to Players
          </button>
        </div>
      </div>
    </div>
  )
}
