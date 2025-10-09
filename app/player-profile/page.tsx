'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

function PlayerProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/'
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
      
      // If this was a new profile creation, redirect to the return URL
      if (!playerProfile) {
        setTimeout(() => {
          router.push(returnUrl)
        }, 2000) // Give user time to see the success message
      }

    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (isLoadingUser || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-[#19171b] py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-[#CEA17A] text-lg">Loading player profile...</p>
        </div>
      </div>
    )
  }

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
        <div className="absolute top-0 left-0 h-full w-px bg-gradient-to-b from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-0 right-0 h-full w-px bg-gradient-to-b from-transparent via-[#CEA17A] to-transparent animate-pulse" style={{animationDelay: '1.5s'}}></div>
      </div>
      
      {/* Background Glowing Orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#CEA17A]/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0s'}}></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-[#75020f]/8 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-[#2b0307]/6 rounded-full blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-[#CEA17A]/4 rounded-full blur-2xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>
      
      {/* Sharp Geometric Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/5 w-2 h-2 bg-[#CEA17A]/3 rotate-45 animate-pulse" style={{animationDelay: '0.3s'}}></div>
        <div className="absolute top-2/3 right-1/4 w-3 h-3 bg-[#75020f]/4 rotate-12 animate-pulse" style={{animationDelay: '2.5s'}}></div>
        <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-[#2b0307]/7 rotate-12 animate-pulse" style={{animationDelay: '0.8s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-6 h-6 bg-[#CEA17A]/4 rotate-45 animate-pulse" style={{animationDelay: '3.5s'}}></div>
        <div className="absolute top-3/4 left-1/2 w-3 h-3 bg-[#75020f]/5 rotate-12 animate-pulse" style={{animationDelay: '1.2s'}}></div>
      </div>
      
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="text-left mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-[#DBD0C0] mb-2 sm:mb-4">
            {playerProfile ? 'My Player Profile' : 'Create Player Profile'}
          </h1>
          <p className="text-[#CEA17A] text-sm sm:text-base">
            {playerProfile 
              ? 'View and manage your cricket player profile'
              : 'Create your cricket player profile to participate in tournaments'
            }
          </p>
        </div>

        {/* Player Profile Status */}
        {playerProfile && (
          <div className="mb-8">
            <div className={`p-4 rounded-lg border-2 ${
              playerProfile.status === 'approved' 
                ? 'bg-[#CEA17A]/20 border-[#CEA17A]/30 text-[#DBD0C0]'
                : playerProfile.status === 'pending'
                ? 'bg-[#CEA17A]/20 border-[#CEA17A]/30 text-[#DBD0C0]'
                : 'bg-[#75020f]/20 border-[#75020f]/30 text-[#DBD0C0]'
            }`}>
              <div className="flex items-center">
                <div className={`w-5 h-5 mr-3 ${
                  playerProfile.status === 'approved' ? 'text-[#CEA17A]' : 
                  playerProfile.status === 'pending' ? 'text-[#CEA17A]' : 'text-[#75020f]'
                }`}>
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
          <div className="group bg-[#19171b]/50 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden border border-[#CEA17A]/10 hover:animate-border-glow transition-all duration-150 mb-6 sm:mb-8">
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
            <div className="p-4 sm:p-6">
              <div className="mb-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-[#DBD0C0] group-hover:text-[#CEA17A] transition-colors mb-2">
                  {playerProfile.display_name}
                </h1>
              </div>

              {/* Bio */}
              {playerProfile.bio && (
                <p className="text-[#CEA17A] text-sm leading-relaxed mb-4">{playerProfile.bio}</p>
              )}

              {/* Skills and Attributes */}
              {Object.keys(formData.skills).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {Object.entries(formData.skills).map(([skillName, skillValue]) => (
                    <span key={skillName} className="bg-[#CEA17A]/20 text-[#CEA17A] border border-[#CEA17A]/30 text-xs px-3 py-1 rounded-full font-medium">
                      {skillName}: {Array.isArray(skillValue) ? skillValue.join(', ') : skillValue}
                    </span>
                  ))}
                </div>
              )}

              {/* Mobile Number */}
              {playerProfile.mobile_number && (
                <div className="text-sm text-[#CEA17A] mb-4">
                  📱 {playerProfile.mobile_number}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-[#CEA17A]/20">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium text-sm sm:text-base"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Profile State */}
        {!isEditing && !playerProfile && (
          <div className="group bg-[#19171b]/50 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden border border-[#CEA17A]/10 hover:animate-border-glow transition-all duration-150 mb-6 sm:mb-8">
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🏏</div>
              <h2 className="text-2xl font-bold text-[#DBD0C0] mb-4">No Player Profile</h2>
              <p className="text-[#CEA17A] mb-6">Create your cricket player profile to participate in tournaments</p>
              <button
                onClick={() => setIsEditing(true)}
                className="px-8 py-3 bg-gradient-to-r from-[#CEA17A] to-[#CEA17A]/80 text-[#09171F] font-semibold rounded-xl hover:from-[#CEA17A]/90 hover:to-[#CEA17A]/70 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Create Profile
              </button>
            </div>
          </div>
        )}

        {/* Edit Form */}
        {isEditing && (
          <div className="bg-[#19171b]/50 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden border border-[#CEA17A]/10 hover:animate-border-glow transition-all duration-150">
            <div className="bg-gradient-to-r from-[#CEA17A]/20 to-[#CEA17A]/10 px-4 sm:px-8 py-4 sm:py-6 border-b border-[#CEA17A]/20">
              <h2 className="text-lg sm:text-2xl font-bold text-[#DBD0C0]">
                {playerProfile ? 'Edit Player Profile' : 'Create Player Profile'}
              </h2>
              <p className="text-[#CEA17A] text-sm sm:text-base mt-1">
                {playerProfile 
                  ? 'Update your player information and skills'
                  : 'Fill in your player information to create your profile'
                }
              </p>
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
                      placeholder="Enter your display name"
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
                    placeholder="Tell us about yourself (optional)"
                  />
                </div>

                {/* Dynamic Player Skills */}
                {isLoadingSkills ? (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#CEA17A] mx-auto"></div>
                      <p className="text-[#CEA17A] mt-2">Loading player skills...</p>
                    </div>
                  </div>
                ) : playerSkills.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <div className="text-[#CEA17A] text-4xl mb-4">⚠️</div>
                      <p className="text-[#CEA17A]">No player skills configured yet.</p>
                      <p className="text-sm text-[#CEA17A]/70 mt-2">
                        Please contact an admin to configure player skills.
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
                      ? 'bg-[#75020f]/20 border-[#75020f]/30 text-[#DBD0C0]'
                      : 'bg-[#CEA17A]/20 border-[#CEA17A]/30 text-[#DBD0C0]'
                  }`}>
                    <div className="flex items-center">
                      <div className={`w-5 h-5 mr-3 ${
                        message.includes('Error') ? 'text-[#75020f]' : 'text-[#CEA17A]'
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

                {/* Submit Section */}
                <div className="bg-gradient-to-r from-[#CEA17A]/10 to-[#CEA17A]/5 rounded-xl p-4 sm:p-6 border-2 border-[#CEA17A]/20 backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <div className="text-center sm:text-left">
                      <h3 className="text-lg font-semibold text-[#DBD0C0]">Ready to {playerProfile ? 'Update' : 'Create'}?</h3>
                      <p className="text-sm text-[#CEA17A]">Review your information and {playerProfile ? 'update' : 'create'} your profile</p>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="w-full sm:w-auto px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#CEA17A] to-[#CEA17A]/80 text-[#09171F] font-semibold rounded-xl hover:from-[#CEA17A]/90 hover:to-[#CEA17A]/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                        disabled={loading}
                      >
                        {loading 
                          ? (playerProfile ? 'Updating Profile...' : 'Creating Profile...') 
                          : (playerProfile ? 'Update Profile' : 'Create Profile')
                        }
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Additional Information - Similar to Players Details Page */}
        {!isEditing && playerProfile && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills & Attributes */}
            <div className="bg-[#19171b]/50 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden border border-[#CEA17A]/10 hover:animate-border-glow transition-all duration-150">
              <div className="bg-gradient-to-r from-[#CEA17A]/20 to-[#CEA17A]/10 px-4 sm:px-6 py-3 sm:py-4 border-b border-[#CEA17A]/20">
                <h3 className="text-lg font-bold text-[#DBD0C0] flex items-center">
                  <span className="w-6 h-6 bg-[#CEA17A]/20 rounded-lg flex items-center justify-center mr-3 text-sm">
                    ⚡
                  </span>
                  Skills & Attributes
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                {Object.keys(formData.skills).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(formData.skills).map(([skillName, skillValue]) => (
                      <div key={skillName} className="flex justify-between items-center py-2 border-b border-[#CEA17A]/20 last:border-b-0">
                        <span className="text-sm font-medium text-[#CEA17A]">{skillName}</span>
                        <span className="text-sm font-bold text-[#DBD0C0]">
                          {Array.isArray(skillValue) ? skillValue.join(', ') : skillValue}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-[#CEA17A]/50 text-4xl mb-3">⚡</div>
                    <p className="text-[#CEA17A]/70 text-sm">No skills and attributes configured yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="bg-[#19171b]/50 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden border border-[#CEA17A]/10 hover:animate-border-glow transition-all duration-150">
              <div className="bg-gradient-to-r from-[#CEA17A]/20 to-[#CEA17A]/10 px-4 sm:px-6 py-3 sm:py-4 border-b border-[#CEA17A]/20">
                <h3 className="text-lg font-bold text-[#DBD0C0] flex items-center">
                  <span className="w-6 h-6 bg-[#CEA17A]/20 rounded-lg flex items-center justify-center mr-3 text-sm">
                    📊
                  </span>
                  Profile Info
                </h3>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-[#CEA17A]/20">
                    <span className="text-sm text-[#CEA17A]">Status</span>
                    <span className={`font-bold text-sm px-2 py-1 rounded-full ${
                      playerProfile.status === 'approved' 
                        ? 'bg-[#CEA17A]/20 text-[#CEA17A] border border-[#CEA17A]/30'
                        : playerProfile.status === 'pending'
                        ? 'bg-[#CEA17A]/20 text-[#CEA17A] border border-[#CEA17A]/30'
                        : 'bg-[#75020f]/20 text-[#75020f] border border-[#75020f]/30'
                    }`}>
                      {playerProfile.status.charAt(0).toUpperCase() + playerProfile.status.slice(1)}
                    </span>
                  </div>
                  {formData.skills?.['Base Price'] && (
                    <div className="flex justify-between items-center py-2 border-b border-[#CEA17A]/20">
                      <span className="text-sm text-[#CEA17A]">Base Price</span>
                      <span className="font-bold text-[#DBD0C0]">₹{formData.skills['Base Price']}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-[#CEA17A]/20">
                    <span className="text-sm text-[#CEA17A]">Created</span>
                    <span className="font-bold text-[#DBD0C0]">
                      {new Date(playerProfile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {playerProfile.updated_at && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-[#CEA17A]">Updated</span>
                      <span className="font-bold text-[#DBD0C0]">
                        {new Date(playerProfile.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Back to Home Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PlayerProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#19171b]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-[#CEA17A]">Loading...</p>
        </div>
      </div>
    }>
      <PlayerProfileContent />
    </Suspense>
  )
}
