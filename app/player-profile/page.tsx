'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sessionManager } from '@/lib/session'

interface PlayerFormData {
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
          setPlayerSkills(result.skills || [])
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
  }, [])

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {playerProfile ? 'My Player Profile' : 'Create Player Profile'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {playerProfile 
              ? 'Manage your cricket player profile and skills'
              : 'Create your cricket player profile to participate in tournaments'
            }
          </p>
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

        {/* Profile Display or Edit Form */}
        {!isEditing && playerProfile ? (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gray-700 px-8 py-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Player Profile</h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  Edit Profile
                </button>
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
                    <p className="text-lg text-gray-900">{playerProfile.display_name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mobile Number
                    </label>
                    <p className="text-lg text-gray-900">{playerProfile.mobile_number || 'Not provided'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Bio
                    </label>
                    <p className="text-lg text-gray-900">{playerProfile.bio || 'No bio provided'}</p>
                  </div>

                </div>

                {/* Profile Picture */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Profile Picture
                  </label>
                  {playerProfile.profile_pic_url ? (
                    <img 
                      src={playerProfile.profile_pic_url} 
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
              </div>
            </div>
          </div>
        ) : (
          /* Edit Form */
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gray-700 px-8 py-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">
                  {playerProfile ? 'Edit Player Profile' : 'Create Player Profile'}
                </h2>
                {playerProfile && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
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

                        const skillKey = skill.skill_name.toLowerCase().replace(' ', '_')
                        const isMultiSelect = skill.skill_type === 'multiselect'
                        const currentValue = formData.skills[skillKey] || (isMultiSelect ? [] : '')

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
          </div>
        )}
      </div>
    </div>
  )
}
