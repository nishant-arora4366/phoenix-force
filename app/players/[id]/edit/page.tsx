'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sessionManager } from '@/lib/session'

interface PlayerFormData {
  display_name: string
  bio: string
  profile_pic_url: string
  mobile_number: string
  base_price: number
  skills: { [key: string]: string | string[] }
}

interface PlayerSkill {
  id: string
  skill_name: string
  skill_type: string
  is_required: boolean
  display_order: number
  values: Array<{
    id: string
    value_name: string
    display_order: number
  }>
}

export default function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [playerSkills, setPlayerSkills] = useState<PlayerSkill[]>([])
  const [isLoadingSkills, setIsLoadingSkills] = useState(true)
  const [formData, setFormData] = useState<PlayerFormData>({
    display_name: '',
    bio: '',
    profile_pic_url: '',
    mobile_number: '',
    base_price: 0,
    skills: {}
  })

  // Check if user is authenticated and has permission
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = sessionManager.getUser()
        if (currentUser) {
          setUser(currentUser)
          setUserRole(currentUser.role || null)
          
          if (currentUser.role === 'host' || currentUser.role === 'admin') {
            // User has permission to edit players
          } else {
            setMessage('Only hosts and admins can edit players. Your current role: ' + (currentUser.role || 'unknown'))
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

    // Listen for auth changes
    const unsubscribe = sessionManager.subscribe((userData) => {
      if (userData) {
        setUser(userData)
        setUserRole(userData.role || null)
      } else {
        setUser(null)
        setUserRole(null)
        setMessage('Please sign in to edit players')
      }
      setIsLoadingUser(false)
    })

    return () => unsubscribe()
  }, [])

  // Fetch player skills
  useEffect(() => {
    const fetchPlayerSkills = async () => {
      try {
        const response = await fetch('/api/player-skills')
        const result = await response.json()

        if (result.success) {
          // Filter skills based on user role and visibility settings
          const filteredSkills = result.skills?.filter((skill: any) => {
            // If user is admin or host, show all skills
            if (userRole === 'admin' || userRole === 'host') {
              return true
            }
            // If user is viewer, only show skills that viewers can see
            return skill.viewer_can_see === true
          }) || []
          
          console.log('All skills from API:', result.skills)
          console.log('Filtered skills for user:', filteredSkills)
          setPlayerSkills(filteredSkills)
        } else {
          console.error('Failed to fetch player skills:', result.error)
        }
      } catch (error) {
        console.error('Error fetching player skills:', error)
      } finally {
        setIsLoadingSkills(false)
      }
    }

    if (userRole) {
      fetchPlayerSkills()
    }
  }, [userRole])

  // Fetch player data
  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const { id } = await params
        const response = await fetch(`/api/players/${id}`)
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch player')
        }

        const player = result.data
        console.log('Player data from API:', player)
        setFormData({
          display_name: player.display_name || '',
          bio: player.bio || '',
          profile_pic_url: player.profile_pic_url || '',
          mobile_number: player.mobile_number || '',
          base_price: player.base_price || 0,
          skills: player.skills || {}
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
      const currentUser = sessionManager.getUser()
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(`/api/players/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(currentUser)
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
    const { name, value } = e.target
    
    if (name === 'base_price') {
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
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">
                Edit Player
              </h1>
              <p className="text-gray-600 mt-1">
                Update player information and skills
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Player Information
            </h2>
            <p className="text-gray-600">
              Update the player details and skills below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-gray-50"
                  placeholder="Enter player's display name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="mobile_number" className="block text-sm font-semibold text-gray-700">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  id="mobile_number"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-gray-50"
                  placeholder="Enter mobile number (optional)"
                />
              </div>
            </div>

            {/* Base Price */}
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-gray-50"
                placeholder="Enter base price"
              />
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-gray-50"
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-gray-50 resize-none"
                placeholder="Enter player bio (optional)"
              />
            </div>

            {/* Dynamic Player Skills */}
            {isLoadingSkills ? (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading player skills...</p>
                </div>
              </div>
            ) : playerSkills.length === 0 ? (
              <div className="space-y-4">
                <div className="text-center py-8">
                  <div className="text-gray-500 text-4xl mb-4">⚠️</div>
                  <p className="text-gray-600">No player skills configured yet.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Please contact an admin to configure player skills.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <label className="block text-sm font-semibold text-gray-700">
                  Player Skills & Attributes
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {playerSkills.map((skill) => {
                    if (!skill || !skill.skill_name) {
                      console.error('Invalid skill object:', skill)
                      return null
                    }

                    const skillKey = skill.skill_name
                    const isMultiSelect = skill.skill_type === 'multiselect'
                    const currentValue = formData.skills[skillKey] || (isMultiSelect ? [] : '')
                    
                    console.log('Rendering skill:', skill.skill_name, 'Current value:', currentValue, 'Form data skills:', formData.skills)

                    return (
                      <div key={skill.id} className="space-y-2">
                        <label htmlFor={skillKey} className="block text-sm font-medium text-gray-700">
                          {skill.skill_name} {skill.is_required && '*'}
                        </label>
                        
                        {isMultiSelect ? (
                          // Multi-select with checkboxes
                          <div className="space-y-2 max-h-32 overflow-y-auto border-2 border-gray-200 rounded-xl p-3 bg-gray-50">
                            {skill.values && skill.values.map((value) => (
                              <label key={value.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                <input
                                  type="checkbox"
                                  checked={Array.isArray(currentValue) && currentValue.includes(value.value_name)}
                                  onChange={(e) => {
                                    const newSkills = { ...formData.skills }
                                    const currentArray = Array.isArray(currentValue) ? currentValue : []
                                    
                                    if (e.target.checked) {
                                      newSkills[skillKey] = [...currentArray, value.value_name]
                                    } else {
                                      newSkills[skillKey] = currentArray.filter(v => v !== value.value_name)
                                    }
                                    setFormData({ ...formData, skills: newSkills })
                                  }}
                                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">{value.value_name}</span>
                              </label>
                            ))}
                            {Array.isArray(currentValue) && currentValue.length > 0 && (
                              <div className="text-xs text-gray-500 mt-2">
                                Selected: {currentValue.join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          // Single select dropdown
                          <select
                            id={skillKey}
                            name={skillKey}
                            value={currentValue}
                            onChange={(e) => {
                              const newSkills = { ...formData.skills }
                              newSkills[skillKey] = e.target.value
                              setFormData({ ...formData, skills: newSkills })
                            }}
                            required={skill.is_required}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-gray-50"
                          >
                            <option value="">Select {skill.skill_name}</option>
                            {skill.values && skill.values.map((value) => (
                              <option key={value.id} value={value.value_name}>
                                {value.value_name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

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
                  <p className="text-sm font-medium">{message}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-green-100"
                disabled={loading}
              >
                {loading 
                  ? 'Updating Player...' 
                  : 'Update Player'
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
