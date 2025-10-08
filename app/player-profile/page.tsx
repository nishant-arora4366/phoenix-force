'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sessionManager } from '@/src/lib/session'

interface PlayerFormData {
  id?: string // Optional for new profiles, required for updates
  display_name: string
  bio: string
  profile_pic_url: string
  mobile_number: string
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

interface PlayerProfile {
  id: string
  display_name: string
  bio: string
  profile_pic_url: string
  mobile_number: string
  status: string
  user_id: string
  created_at: string
  updated_at: string
}

export default function PlayerProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [playerSkills, setPlayerSkills] = useState<PlayerSkill[]>([])
  const [isLoadingSkills, setIsLoadingSkills] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<PlayerFormData>({
    display_name: '',
    bio: '',
    profile_pic_url: '',
    mobile_number: '',
    skills: {}
  })

  // Check if user is authenticated
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = sessionManager.getUser()
        if (currentUser) {
          setUser(currentUser)
          setUserRole(currentUser.role || null)
          await fetchPlayerProfile()
        } else {
          setMessage('Please sign in to access your player profile')
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
            fetchPlayerProfile()
          } else {
            setUser(null)
            setUserRole(null)
            setMessage('Please sign in to access your player profile')
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

    fetchPlayerSkills()
  }, [userRole])

  const fetchPlayerProfile = async () => {
    try {
      setIsLoadingProfile(true)
      const currentUser = sessionManager.getUser()
      if (!currentUser) return

      const response = await fetch('/api/player-profile', {
        headers: {
          'Authorization': JSON.stringify(currentUser)
        }
      })

      const result = await response.json()
      
      if (result.success && result.profile) {
        setPlayerProfile(result.profile)
        setFormData({
          id: result.profile.id, // Include player ID for updates
          display_name: result.profile.display_name || '',
          bio: result.profile.bio || '',
          profile_pic_url: result.profile.profile_pic_url || '',
          mobile_number: result.profile.mobile_number || '',
          skills: result.skills || {}
        })
      } else {
        setPlayerProfile(null)
      }
    } catch (error) {
      console.error('Error fetching player profile:', error)
    } finally {
      setIsLoadingProfile(false)
    }
  }


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      const currentUser = sessionManager.getUser()
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/player-profile', {
        method: playerProfile ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(currentUser)
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to save player profile')
      }

      setMessage(playerProfile ? 'Player profile updated successfully!' : 'Player profile created successfully! It will be reviewed by an admin.')
      setIsEditing(false)
      await fetchPlayerProfile()

    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (isLoadingUser || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading player profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Access Denied
              </h2>
              <p className="text-gray-600 mb-6">
                {message || 'Please sign in to access your player profile.'}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">
                {playerProfile ? 'My Player Profile' : 'Create Player Profile'}
              </h1>
            </div>
          </div>

          {/* Action Buttons */}
          {playerProfile && !isEditing && (
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>

        {/* Player Profile Status */}
        {playerProfile && (
          <div className="mb-8">
            <div className={`p-4 rounded-lg border-2 ${
              playerProfile.status === 'approved' 
                ? 'bg-green-50 border-green-200 text-green-800'
                : playerProfile.status === 'pending'
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center">
                <div className="w-5 h-5 mr-3">
                  {playerProfile.status === 'approved' ? (
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : playerProfile.status === 'pending' ? (
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="font-semibold">
                    Profile Status: {playerProfile.status.charAt(0).toUpperCase() + playerProfile.status.slice(1)}
                  </p>
                  <p className="text-sm mt-1">
                    {playerProfile.status === 'approved' 
                      ? 'Your profile is approved and visible to all users.'
                      : playerProfile.status === 'pending'
                      ? 'Your profile is under review by an admin.'
                      : 'Your profile was rejected. Please update and resubmit.'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Player Card - Similar to Players Details Page */}
        {!isEditing && playerProfile && (
          <div className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 mb-6 sm:mb-8">
            {/* Player Image Header */}
            <div className="relative h-64 sm:h-80 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
              {playerProfile.profile_pic_url ? (
                <img
                  src={playerProfile.profile_pic_url}
                  alt={playerProfile.display_name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <div className="text-8xl text-gray-400">🏏</div>
                </div>
              )}
              
              {/* Price Badge */}
              {formData.skills?.['Base Price'] && (
                <div className="absolute top-4 right-4 bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                  ₹{formData.skills['Base Price']}
                </div>
              )}
              
              {/* Status Badge */}
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium shadow-lg ${
                playerProfile.status === 'approved' 
                  ? 'bg-green-600 text-white'
                  : playerProfile.status === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-red-600 text-white'
              }`}>
                {playerProfile.status.charAt(0).toUpperCase() + playerProfile.status.slice(1)}
              </div>
            </div>

            {/* Player Info */}
            <div className="p-6">
              <div className="mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 group-hover:text-gray-600 transition-colors mb-2">
                  {playerProfile.display_name}
                </h1>
              </div>

              {/* Bio */}
              {playerProfile.bio && (
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{playerProfile.bio}</p>
              )}

              {/* Skills and Attributes */}
              {Object.keys(formData.skills).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(formData.skills).map(([skillName, skillValue]) => (
                    <span key={skillName} className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
                      {skillName}: {Array.isArray(skillValue) ? skillValue.join(', ') : skillValue}
                    </span>
                  ))}
                </div>
              )}

              {/* Mobile Number */}
              {playerProfile.mobile_number && (
                <div className="text-sm text-gray-600 mb-4">
                  📱 {playerProfile.mobile_number}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-semibold"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Profile State */}
        {!isEditing && !playerProfile && (
          <div className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 mb-6 sm:mb-8">
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🏏</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Player Profile</h2>
              <p className="text-gray-600 mb-6">Create your cricket player profile to participate in tournaments</p>
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
              >
                Create Profile
              </button>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {playerProfile ? 'Edit Player Profile' : 'Create Player Profile'}
              </h2>
              <p className="text-gray-600">
                {playerProfile 
                  ? 'Update your player information and skills'
                  : 'Fill in your player information to create your profile'
                }
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
                    placeholder="Enter your display name"
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
                  placeholder="Tell us about yourself (optional)"
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
                    ? (playerProfile ? 'Updating Profile...' : 'Creating Profile...') 
                    : (playerProfile ? 'Update Profile' : 'Create Profile')
                  }
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Additional Information - Similar to Players Details Page */}
        {!isEditing && playerProfile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills & Attributes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center mr-3 text-sm">
                  ⚡
                </span>
                Skills & Attributes
              </h3>
              {Object.keys(formData.skills).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(formData.skills).map(([skillName, skillValue]) => (
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

            {/* Profile Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <span className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center mr-3 text-sm">
                  📊
                </span>
                Profile Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`font-bold text-sm px-2 py-1 rounded-full ${
                    playerProfile.status === 'approved' 
                      ? 'bg-green-100 text-green-800'
                      : playerProfile.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {playerProfile.status.charAt(0).toUpperCase() + playerProfile.status.slice(1)}
                  </span>
                </div>
                {formData.skills?.['Base Price'] && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Base Price</span>
                    <span className="font-bold text-gray-900">₹{formData.skills['Base Price']}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="font-bold text-gray-900">
                    {new Date(playerProfile.created_at).toLocaleDateString()}
                  </span>
                </div>
                {playerProfile.updated_at && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Updated</span>
                    <span className="font-bold text-gray-900">
                      {new Date(playerProfile.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Back to Home Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
