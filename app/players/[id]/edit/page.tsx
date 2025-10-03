'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface PlayerFormData {
  display_name: string
  stage_name: string
  bio: string
  profile_pic_url: string
  base_price: number
  group_name: string
  is_bowler: boolean
  is_batter: boolean
  is_wicket_keeper: boolean
  bowling_rating: number
  batting_rating: number
  wicket_keeping_rating: number
}

export default function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [formData, setFormData] = useState<PlayerFormData>({
    display_name: '',
    stage_name: '',
    bio: '',
    profile_pic_url: '',
    base_price: 0,
    group_name: '',
    is_bowler: false,
    is_batter: false,
    is_wicket_keeper: false,
    bowling_rating: 0,
    batting_rating: 0,
    wicket_keeping_rating: 0
  })

  // Check if user is authenticated and has permission
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
          
          setUserRole(userData?.role || null)
          
          if (userData?.role === 'host' || userData?.role === 'admin') {
            setUser(user)
          } else {
            setMessage('Only hosts and admins can edit players. Your current role: ' + (userData?.role || 'unknown'))
          }
        } else {
          setMessage('Please sign in to edit players')
        }
      } catch (error) {
        console.error('Error checking user:', error)
        setMessage('Error checking authentication status')
      } finally {
        setIsLoadingUser(false)
      }
    }
    checkUser()
  }, [])

  // Fetch player data
  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const { id } = await params
        const { data: { session } } = await supabase.auth.getSession()
        const response = await fetch(`/api/players/${id}`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        })
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch player')
        }

        const player = result.data
        setFormData({
          display_name: player.display_name || '',
          stage_name: player.stage_name || '',
          bio: player.bio || '',
          profile_pic_url: player.profile_pic_url || '',
          base_price: player.base_price || 0,
          group_name: player.group_name || '',
          is_bowler: player.is_bowler || false,
          is_batter: player.is_batter || false,
          is_wicket_keeper: player.is_wicket_keeper || false,
          bowling_rating: player.bowling_rating || 0,
          batting_rating: player.batting_rating || 0,
          wicket_keeping_rating: player.wicket_keeping_rating || 0
        })
      } catch (error: any) {
        console.error('Error fetching player:', error)
        setMessage(`Error: ${error.message}`)
      }
    }

    if (user) {
      fetchPlayer()
    }
  }, [user, params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { id } = await params
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch(`/api/players/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update player')
      }

      setMessage('Player updated successfully!')
      
      // Redirect to player details
      setTimeout(() => {
        router.push(`/players/${id}`)
      }, 2000)

    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }))
    } else if (name.includes('rating') || name === 'base_price') {
      setFormData(prev => ({
        ...prev,
        [name]: Number(value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  // Show loading state while checking authentication
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Checking Access...
              </h2>
              <p className="text-gray-600 text-sm sm:text-base">
                Verifying your permissions to edit players
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show access denied if user is not authenticated or doesn't have permission
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-8">
            <div className="text-center">
              <div className="text-gray-500 text-4xl sm:text-6xl mb-4">🚫</div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Access Denied
              </h2>
              <p className="text-gray-600 mb-6">
                {message || 'You need to be a host or admin to edit players.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push('/signin')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full mb-4 sm:mb-6">
            <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">Edit Player</h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            Update player information and ratings
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-4 sm:px-8 py-4 sm:py-6">
            <h2 className="text-lg sm:text-2xl font-bold text-white">Player Information</h2>
            <p className="text-gray-200 mt-1 sm:mt-2 text-sm sm:text-base">Update the player details below</p>
          </div>
          
          <div className="p-4 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {/* Basic Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label htmlFor="display_name" className="block text-sm font-semibold text-gray-700">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    id="display_name"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-gray-100 focus:border-gray-500 transition-all duration-200 bg-gray-50 text-sm sm:text-base"
                    placeholder="Enter player's display name"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="stage_name" className="block text-sm font-semibold text-gray-700">
                    Stage Name
                  </label>
                  <input
                    type="text"
                    id="stage_name"
                    name="stage_name"
                    value={formData.stage_name}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-gray-100 focus:border-gray-500 transition-all duration-200 bg-gray-50 text-sm sm:text-base"
                    placeholder="Enter stage name (optional)"
                  />
                </div>
              </div>

              {/* Price and Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="base_price" className="block text-sm font-semibold text-gray-700">
                    Base Price (₹) *
                  </label>
                  <input
                    type="number"
                    id="base_price"
                    name="base_price"
                    value={formData.base_price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-gray-100 focus:border-gray-500 transition-all duration-200 bg-gray-50 text-sm sm:text-base"
                    placeholder="Enter base price"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="group_name" className="block text-sm font-semibold text-gray-700">
                    Group Name
                  </label>
                  <input
                    type="text"
                    id="group_name"
                    name="group_name"
                    value={formData.group_name}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-gray-100 focus:border-gray-500 transition-all duration-200 bg-gray-50 text-sm sm:text-base"
                    placeholder="Enter group name (optional)"
                  />
                </div>
              </div>

              {/* Profile Picture */}
              <div className="space-y-2">
                <label htmlFor="profile_pic_url" className="block text-sm font-semibold text-gray-700">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  id="profile_pic_url"
                  name="profile_pic_url"
                  value={formData.profile_pic_url}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-gray-50"
                  placeholder="Enter profile picture URL (optional)"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label htmlFor="bio" className="block text-sm font-semibold text-gray-700">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 transition-all duration-200 bg-gray-50 resize-none"
                  placeholder="Enter player bio (optional)"
                />
              </div>

              {/* Roles */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  Player Roles
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      name="is_batter"
                      checked={formData.is_batter}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Batter</div>
                      <div className="text-sm text-gray-500">Can bat in matches</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      name="is_bowler"
                      checked={formData.is_bowler}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Bowler</div>
                      <div className="text-sm text-gray-500">Can bowl in matches</div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      name="is_wicket_keeper"
                      checked={formData.is_wicket_keeper}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Wicket Keeper</div>
                      <div className="text-sm text-gray-500">Can keep wickets</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Ratings */}
              <div className="space-y-6">
                <label className="block text-sm font-semibold text-gray-700">
                  Player Ratings (1-10)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="batting_rating" className="block text-sm font-medium text-gray-700">
                      Batting Rating
                    </label>
                    <input
                      type="number"
                      id="batting_rating"
                      name="batting_rating"
                      value={formData.batting_rating}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-gray-100 focus:border-gray-500 transition-all duration-200 bg-gray-50 text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="bowling_rating" className="block text-sm font-medium text-gray-700">
                      Bowling Rating
                    </label>
                    <input
                      type="number"
                      id="bowling_rating"
                      name="bowling_rating"
                      value={formData.bowling_rating}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-gray-100 focus:border-gray-500 transition-all duration-200 bg-gray-50 text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="wicket_keeping_rating" className="block text-sm font-medium text-gray-700">
                      Wicket Keeping Rating
                    </label>
                    <input
                      type="number"
                      id="wicket_keeping_rating"
                      name="wicket_keeping_rating"
                      value={formData.wicket_keeping_rating}
                      onChange={handleInputChange}
                      min="0"
                      max="10"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 sm:focus:ring-4 focus:ring-gray-100 focus:border-gray-500 transition-all duration-200 bg-gray-50 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-xl border-2 ${
                  message.includes('Error') 
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-green-50 border-green-200 text-green-800'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-5 h-5 mr-3 ${
                      message.includes('Error') ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {message.includes('Error') ? (
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">{message}</span>
                  </div>
                </div>
              )}

              {/* Submit Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-semibold text-gray-900">Ready to Update?</h3>
                    <p className="text-sm text-gray-600">Review the changes and update the player profile</p>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="w-full sm:w-auto px-6 py-3 text-gray-600 hover:text-gray-800 font-medium transition-colors duration-200 text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-lg sm:rounded-xl hover:from-gray-700 hover:to-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Updating Player...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Update Player
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
