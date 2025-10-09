'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sessionManager } from '@/src/lib/session'

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

export default function CreatePlayerPage() {
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
          
          // Check if user is admin or host
          if (currentUser.role === 'admin' || currentUser.role === 'host') {
            // User has permission to create players
          } else if (currentUser.status === 'pending') {
            setMessage('Your account is pending admin approval. You cannot create players until approved.')
          } else {
            setMessage('Only hosts and admins can create players. Your current role: ' + (currentUser.role || 'unknown'))
          }
        } else {
          setMessage('Please sign in to create players')
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
        setMessage('Please sign in to create players')
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
        
        console.log('Player skills API response:', result)
        
        if (result.success) {
          console.log('Setting player skills:', result.skills)
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

      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(currentUser)
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create player')
      }

      setMessage('Player created successfully!')
      
      // Redirect to player details page
      setTimeout(() => {
        router.push(`/players/${result.data.id}`)
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
      <div className="min-h-screen bg-[#19171b] py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#09171F]/50 rounded-xl shadow-sm border border-[#CEA17A]/20 p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-[#DBD0C0] mb-2">
                Checking Access...
              </h2>
              <p className="text-[#CEA17A]">
                Verifying your permissions to create players
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
      <div className="min-h-screen bg-[#19171b] py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#09171F]/50 rounded-xl shadow-sm border border-[#CEA17A]/20 p-8">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-[#DBD0C0] mb-4">
                Access Denied
              </h2>
              <p className="text-[#CEA17A] mb-6">
                {message || 'You need to be a host or admin to create players.'}
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
    <div className="min-h-screen bg-[#19171b] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-[#DBD0C0] mb-4">Add New Player</h1>
          <p className="text-xl text-[#CEA17A] max-w-2xl mx-auto">
            Create a new player profile with detailed information and ratings
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#09171F]/50 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gray-700 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Player Information</h2>
            <p className="text-gray-200 mt-2">Fill in the player details below</p>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="display_name" className="block text-sm font-semibold text-[#CEA17A]">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    id="display_name"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-[#19171b]"
                    placeholder="Enter player's display name"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="mobile_number" className="block text-sm font-semibold text-[#CEA17A]">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    id="mobile_number"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-[#19171b]"
                    placeholder="Enter mobile number (optional)"
                  />
                </div>
              </div>

              {/* Profile Picture */}
              <div className="space-y-2">
                <label htmlFor="profile_pic_url" className="block text-sm font-semibold text-[#CEA17A]">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  id="profile_pic_url"
                  name="profile_pic_url"
                  value={formData.profile_pic_url}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-[#19171b]"
                  placeholder="Enter profile picture URL (optional)"
                />
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <label htmlFor="bio" className="block text-sm font-semibold text-[#CEA17A]">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-[#19171b] resize-none"
                  placeholder="Enter player bio (optional)"
                />
              </div>

              {/* Dynamic Player Skills */}
              {isLoadingSkills ? (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="text-[#CEA17A] mt-2">Loading player skills...</p>
                  </div>
                </div>
              ) : playerSkills.length === 0 ? (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="text-gray-500 text-4xl mb-4">⚠️</div>
                    <p className="text-[#CEA17A]">No player skills configured yet.</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Please configure player skills in the admin panel first.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <label className="block text-sm font-semibold text-[#CEA17A]">
                    Player Skills & Attributes
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {playerSkills.map((skill) => {
                      // Add safety checks
                      if (!skill || !skill.skill_name) {
                        console.error('Invalid skill object:', skill)
                        return null
                      }

                      const skillKey = skill.skill_name.toLowerCase().replace(' ', '_')
                      const isMultiSelect = skill.skill_type === 'multiselect'
                      const currentValue = formData.skills[skillKey] || (isMultiSelect ? [] : '')

                      return (
                        <div key={skill.id} className="space-y-2">
                          <label htmlFor={skillKey} className="block text-sm font-medium text-[#CEA17A]">
                            {skill.skill_name} {skill.is_required && '*'}
                          </label>
                          
                          {isMultiSelect ? (
                            // Multi-select with checkboxes
                            <div className="space-y-2 max-h-32 overflow-y-auto border-2 border-[#CEA17A]/20 rounded-xl p-3 bg-[#19171b]">
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
                                  <span className="text-sm text-[#CEA17A]">{value.value_name}</span>
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
                              className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-[#19171b]"
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
                    <span className="font-medium">{message}</span>
                  </div>
                </div>
              )}

              {/* Submit Section */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-[#CEA17A]/20">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-semibold text-[#DBD0C0]">Ready to Add Player?</h3>
                    <p className="text-sm text-[#CEA17A]">Review the information and create the player profile</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-6 py-3 text-[#CEA17A] hover:text-gray-800 font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Player...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Create Player
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
