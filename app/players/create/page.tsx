'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { secureSessionManager } from '@/src/lib/secure-session'

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
        const currentUser = secureSessionManager.getUser()
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
    const unsubscribe = secureSessionManager.subscribe((userData) => {
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
        const response = await fetch('/api/player-skills', {
          headers: {
            'Authorization': `Bearer ${secureSessionManager.getToken()}`
          }
        })
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

      const currentUser = secureSessionManager.getUser()
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${secureSessionManager.getToken()}`
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Hero Section Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#19171b] via-[#2b0307] to-[#51080d]"></div>
      <div className="absolute inset-0" 
           style={{
             background: 'linear-gradient(135deg, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.4) 100%)'
           }}></div>
      {/* Enhanced Background Patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(117,2,15,0.1)_1px,transparent_0)] bg-[length:20px_20px] opacity-30"></div>
      <div className="absolute inset-0 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(117,2,15,0.05)_60deg,transparent_120deg)] opacity-60"></div>
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(117,2,15,0.02)_50%,transparent_75%)] bg-[length:40px_40px] opacity-20"></div>
      
      {/* Sharp Geometric Patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_40%,rgba(206,161,122,0.03)_50%,transparent_60%)] bg-[length:60px_60px] opacity-25"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(117,2,15,0.04)_0%,transparent_70%)] opacity-30"></div>
      <div className="absolute inset-0 bg-[conic-gradient(from_45deg_at_25%_25%,transparent_0deg,rgba(206,161,122,0.02)_90deg,transparent_180deg)] opacity-20"></div>
      
      {/* Animated Grid Lines */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#CEA17A] to-transparent animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>
      
      {/* Background Glowing Orbs - Behind Content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#75020f]/3 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-[#51080d]/4 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-[#2b0307]/5 rounded-full blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-[#CEA17A]/2 rounded-full blur-lg animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-1/2 left-1/2 w-56 h-56 bg-[#75020f]/3 rounded-full blur-md animate-pulse" style={{animationDelay: '3s'}}></div>
      </div>
      
      {/* Sharp Geometric Elements - Behind Content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-4 h-4 bg-[#CEA17A]/6 rotate-45 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-6 h-6 bg-[#75020f]/8 rotate-12 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-3 h-3 bg-[#51080d]/7 rotate-45 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-5 h-5 bg-[#2b0307]/9 rotate-12 animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute bottom-20 right-10 w-4 h-4 bg-[#CEA17A]/5 rotate-45 animate-pulse" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-2/3 left-1/5 w-3 h-3 bg-[#75020f]/6 rotate-12 animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-1/3 right-1/5 w-5 h-5 bg-[#51080d]/8 rotate-45 animate-pulse" style={{animationDelay: '2.5s'}}></div>
        <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-[#2b0307]/7 rotate-12 animate-pulse" style={{animationDelay: '0.8s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-6 h-6 bg-[#CEA17A]/4 rotate-45 animate-pulse" style={{animationDelay: '3.5s'}}></div>
        <div className="absolute top-3/4 left-1/2 w-3 h-3 bg-[#75020f]/5 rotate-12 animate-pulse" style={{animationDelay: '1.2s'}}></div>
      </div>
      
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="text-left mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-[#DBD0C0] mb-2 sm:mb-4">Add New Player</h1>
        </div>

        {/* Form */}
        <div className="bg-[#19171b]/50 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden border border-[#CEA17A]/10 hover:animate-border-glow transition-all duration-150">
          <div className="bg-gradient-to-r from-[#CEA17A]/20 to-[#CEA17A]/10 px-4 sm:px-8 py-4 sm:py-6 border-b border-[#CEA17A]/20">
            <h2 className="text-lg sm:text-2xl font-bold text-[#DBD0C0]">Player Information</h2>
          </div>
          
          <div className="p-4 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
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
                    className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
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
                    className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
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
                  className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
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
                  className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0] resize-none"
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
                            <div className="space-y-2 max-h-32 overflow-y-auto border-2 border-[#CEA17A]/20 rounded-xl p-3 bg-[#19171b]/50 backdrop-blur-sm">
                              {skill.values && skill.values.map((value) => (
                                <label key={value.id} className="flex items-center space-x-2 cursor-pointer hover:bg-[#CEA17A]/10 p-1 rounded transition-colors duration-200">
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
                                    className="h-4 w-4 text-[#CEA17A] focus:ring-[#CEA17A]/20 border-[#CEA17A]/30 rounded bg-[#19171b]/50"
                                  />
                                  <span className="text-sm text-[#CEA17A]">{value.value_name}</span>
                                </label>
                              ))}
                              {Array.isArray(currentValue) && currentValue.length > 0 && (
                                <div className="text-xs text-[#CEA17A]/70 mt-2">
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
                              className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
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
              <div className="bg-gradient-to-r from-[#CEA17A]/10 to-[#CEA17A]/5 rounded-xl p-4 sm:p-6 border-2 border-[#CEA17A]/20 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg font-semibold text-[#DBD0C0]">Ready to Add Player?</h3>
                    <p className="text-sm text-[#CEA17A]">Review the information and create the player profile</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-6 py-3 text-[#CEA17A] hover:text-[#DBD0C0] font-medium transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-[#CEA17A] to-[#CEA17A]/80 text-[#09171F] font-semibold rounded-xl hover:from-[#CEA17A]/90 hover:to-[#CEA17A]/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#09171F]" fill="none" viewBox="0 0 24 24">
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
