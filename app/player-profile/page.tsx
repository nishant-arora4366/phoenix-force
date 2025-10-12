'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { secureSessionManager } from '@/src/lib/secure-session'

interface PlayerFormData {
  id?: string // Optional for new profiles, required for updates
  display_name: string
  bio: string
  profile_pic_url: string
  mobile_number: string
  skills: { [key: string]: string | string[] }
}

interface FormErrors {
  display_name?: string
  mobile_number?: string
  profile_pic_url?: string
  bio?: string
  [key: string]: string | undefined
}

interface PlayerSkill {
  id: string
  skill_name: string
  skill_type: string
  is_required: boolean
  display_order: number
  is_admin_managed?: boolean
  viewer_can_see?: boolean
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
  skills?: { [key: string]: any }
}

function PlayerProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/'
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
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
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  // Validation functions
  const validateIndianMobileNumber = (mobile: string): boolean => {
    // Indian mobile number: 10 digits, starting with 6, 7, 8, or 9
    const indianMobileRegex = /^[6-9]\d{9}$/
    return indianMobileRegex.test(mobile)
  }

  const validateFieldLength = (value: string, maxLength: number): boolean => {
    return value.length <= maxLength
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    let isValid = true

    // Validate display name
    if (!formData.display_name || !formData.display_name.trim()) {
      errors.display_name = 'Player display name is required'
      isValid = false
    }

    // Validate mobile number
    if (!formData.mobile_number.trim()) {
      errors.mobile_number = 'Mobile number is required'
      isValid = false
    } else if (!validateIndianMobileNumber(formData.mobile_number)) {
      errors.mobile_number = 'Please enter a valid Indian mobile number (10 digits starting with 6-9)'
      isValid = false
    }

    // Validate profile URL length
    if (formData.profile_pic_url && !validateFieldLength(formData.profile_pic_url, 4096)) {
      errors.profile_pic_url = 'Profile URL must be 4096 characters or less'
      isValid = false
    }

    // Validate bio length
    if (formData.bio && !validateFieldLength(formData.bio, 4096)) {
      errors.bio = 'Bio must be 4096 characters or less'
      isValid = false
    }

    // Validate required skills (Community and Role are always mandatory)
    const communitySkill = playerSkills.find(skill => skill.skill_name === 'Community')
    const roleSkill = playerSkills.find(skill => skill.skill_name === 'Role')
    
    if (communitySkill) {
      const communityValue = formData.skills['Community']
      if (!communityValue || (Array.isArray(communityValue) && communityValue.length === 0)) {
        errors['Community'] = 'Community is required'
        isValid = false
      }
    }

    if (roleSkill) {
      const roleValue = formData.skills['Role']
      if (!roleValue || (Array.isArray(roleValue) && roleValue.length === 0)) {
        errors['Role'] = 'Role is required'
        isValid = false
      }
    }

    // Validate Batting Style
    const battingStyleValue = formData.skills['Batting Style']
    if (!battingStyleValue || battingStyleValue === 'Select Batting Style') {
      errors['Batting Style'] = 'Batting Style is required'
      isValid = false
    }

    // Validate Bowling Style
    const bowlingStyleValue = formData.skills['Bowling Style']
    if (!bowlingStyleValue || bowlingStyleValue === 'Select Bowling Style') {
      errors['Bowling Style'] = 'Bowling Style is required'
      isValid = false
    }

    setFormErrors(errors)
    return isValid
  }

  // Check if user is authenticated
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = secureSessionManager.getUser()
        if (currentUser) {
          setUser(currentUser)
          setUserRole(currentUser.role || null)
          
          // Fetch user profile data (includes firstname, lastname)
          const token = secureSessionManager.getToken()
          if (token) {
            try {
              const userProfileResponse = await fetch('/api/user-profile', {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              })
              const userProfileResult = await userProfileResponse.json()
              if (userProfileResult.success && userProfileResult.data) {
                setUserProfile(userProfileResult.data)
              } else {
                // Fallback: use current user data if user profile fetch fails
                console.warn('Failed to fetch user profile, using current user data')
                setUserProfile({
                  firstname: currentUser.firstname || '',
                  lastname: currentUser.lastname || ''
                })
              }
            } catch (error) {
              // Fallback: use current user data if user profile fetch fails
              console.warn('Error fetching user profile, using current user data:', error)
              setUserProfile({
                firstname: currentUser.firstname || '',
                lastname: currentUser.lastname || ''
              })
            }
          }
          
          await fetchPlayerProfile()
        } else {
          setMessage('Please sign in to access your player profile')
        }
      } catch (error) {
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
        
        const token = secureSessionManager.getToken()
        if (!token) {
          return
        }

        const response = await fetch('/api/player-skills', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
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
        }
      } catch (error) {
      } finally {
        setIsLoadingSkills(false)
      }
    }

    fetchPlayerSkills()
  }, [userRole])

  // Refetch player profile when userProfile is loaded
  useEffect(() => {
    if (userProfile) {
      fetchPlayerProfile()
    }
  }, [userProfile])

  // Update display name when userProfile changes
  useEffect(() => {
    if (userProfile && !playerProfile) {
      // Generate display name from user profile (firstname + lastname)
      const displayName = `${userProfile.firstname || ''} ${userProfile.lastname || ''}`.trim()
      
      setFormData(prev => ({
        ...prev,
        display_name: displayName
      }))
    }
  }, [userProfile, playerProfile])

  const fetchPlayerProfile = async () => {
    try {
      
      setIsLoadingProfile(true)
      const currentUser = secureSessionManager.getUser()
      const token = secureSessionManager.getToken()
      
      if (!currentUser || !token) return

      const response = await fetch('/api/player-profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const result = await response.json()
      
      if (result.success) {
        // Generate display name from user profile (firstname + lastname)
        const displayName = userProfile 
          ? `${userProfile.firstname || ''} ${userProfile.lastname || ''}`.trim()
          : '';
        
        if (result.profile) {
          // User has a player profile
          setPlayerProfile(result.profile)
          setFormData({
            id: result.profile.id, // Include player ID for updates
            display_name: displayName || result.profile.display_name || '',
            bio: result.profile.bio || '',
            profile_pic_url: result.profile.profile_pic_url || '',
            mobile_number: result.profile.mobile_number || '',
            skills: result.skills || {}
          })
        } else {
          // User doesn't have a player profile yet
          setPlayerProfile(null)
          setFormData(prev => ({
            ...prev,
            display_name: displayName || prev.display_name,
            bio: '',
            profile_pic_url: '',
            mobile_number: '',
            skills: {}
          }))
        }
      } else {
        setPlayerProfile(null)
      }
    } catch (error) {
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

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validate form before submission
    if (!validateForm()) {
      setLoading(false)
      setMessage('Please fix the validation errors before submitting')
      return
    }

    try {
      if (!user) {
        throw new Error('User not authenticated')
      }

      const currentUser = secureSessionManager.getUser()
      const token = secureSessionManager.getToken()
      
      if (!currentUser || !token) {
        throw new Error('User not authenticated')
      }

      if (playerProfile) {
        // For updates, use PATCH and only send changed fields
        const changedFields: any = { id: playerProfile.id }
        
        // Check which basic fields have changed
        if (formData.display_name !== playerProfile.display_name) {
          changedFields.display_name = formData.display_name
        }
        if (formData.mobile_number !== playerProfile.mobile_number) {
          changedFields.mobile_number = formData.mobile_number
        }
        if (formData.profile_pic_url !== playerProfile.profile_pic_url) {
          changedFields.profile_pic_url = formData.profile_pic_url
        }
        if (formData.bio !== playerProfile.bio) {
          changedFields.bio = formData.bio
        }

        // Check which skills have changed
        const changedSkills: any = {}
        Object.keys(formData.skills).forEach(skillName => {
          const currentValue = playerProfile.skills?.[skillName]
          const newValue = formData.skills[skillName]
          
          // Skip admin-managed skills for regular users
          const skill = playerSkills.find(s => s.skill_name === skillName)
          if (skill?.is_admin_managed && userRole !== 'admin' && userRole !== 'host') {
            return
          }
          
          // Compare values (handle arrays and strings)
          const currentValueStr = Array.isArray(currentValue) ? currentValue.sort().join(',') : (currentValue || '')
          const newValueStr = Array.isArray(newValue) ? newValue.sort().join(',') : (newValue || '')
          
          if (currentValueStr !== newValueStr) {
            changedSkills[skillName] = newValue
          }
        })

        if (Object.keys(changedSkills).length > 0) {
          changedFields.skills = changedSkills
        }

        // Only make API call if there are actual changes
        if (Object.keys(changedFields).length > 1) { // More than just the ID
          const response = await fetch('/api/player-profile', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(changedFields),
          })

          const result = await response.json()

          if (!result.success) {
            throw new Error(result.error || 'Failed to update player profile')
          }
        }
      } else {
        // For creation, use POST with all data (filtered for admin-managed skills)
        const filteredSkills = { ...formData.skills }
        if (userRole !== 'admin' && userRole !== 'host') {
          playerSkills.forEach(skill => {
            if (skill.is_admin_managed) {
              delete filteredSkills[skill.skill_name]
            }
          })
        }

        const response = await fetch('/api/player-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            skills: filteredSkills
          }),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to create player profile')
        }
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
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


        {/* Player Profile Details Card */}
        {!isEditing && playerProfile && (
          <div className="bg-[#19171b]/50 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden border border-[#CEA17A]/10 hover:animate-border-glow transition-all duration-150 mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-[#CEA17A]/20 to-[#CEA17A]/10 px-4 sm:px-8 py-4 sm:py-6 border-b border-[#CEA17A]/20">
              <h2 className="text-lg sm:text-2xl font-bold text-[#DBD0C0]">Player Profile Information</h2>
            </div>
            
            <div className="p-4 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Player Photo - Square on the side */}
                <div className="lg:col-span-1">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#CEA17A]">
                      Profile Picture
                    </label>
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden border-2 border-[#CEA17A]/20">
                      {playerProfile.profile_pic_url ? (
                        <img
                          src={playerProfile.profile_pic_url}
                          alt={playerProfile.display_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <div className="text-6xl text-[#CEA17A]/60">🏏</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Player Details - Label-Value Format */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information */}
                  {playerProfile.mobile_number && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#CEA17A]">
                        CricHeroes Mobile Number
                      </label>
                      <div className="px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]">
                        {playerProfile.mobile_number}
                      </div>
                    </div>
                  )}

                  {/* Display Name */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#CEA17A]">
                      Display Name
                    </label>
                    <div className="px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0] font-medium">
                      {playerProfile.display_name}
                    </div>
                  </div>

                  {/* Profile Status */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#CEA17A]">
                      Profile Status
                    </label>
                    <div className={`px-4 py-3 border-2 rounded-xl backdrop-blur-sm font-medium ${
                      playerProfile.status === 'approved' 
                        ? 'border-[#CEA17A]/30 bg-[#CEA17A]/20 text-[#CEA17A]'
                        : playerProfile.status === 'pending'
                        ? 'border-[#CEA17A]/30 bg-[#CEA17A]/20 text-[#CEA17A]'
                        : 'border-[#75020f]/30 bg-[#75020f]/20 text-[#75020f]'
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
                          <div className="font-semibold">
                            {playerProfile.status.charAt(0).toUpperCase() + playerProfile.status.slice(1)}
                          </div>
                          <div className="text-sm mt-1">
                            {playerProfile.status === 'approved' 
                              ? 'Your profile is approved and visible to all users.'
                              : playerProfile.status === 'pending'
                              ? 'Your profile is under review by an admin.'
                              : 'Your profile was rejected. Please update and resubmit.'
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {playerProfile.bio && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#CEA17A]">
                        Bio
                      </label>
                      <div className="px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0] leading-relaxed">
                        {playerProfile.bio}
                      </div>
                    </div>
                  )}

                  {/* Player Skills & Attributes */}
                  {Object.keys(formData.skills).length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#CEA17A]">
                        Skills & Attributes
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(formData.skills).map(([skillName, skillValue]) => (
                          <div key={skillName} className="space-y-1">
                            <label className="block text-xs font-medium text-[#CEA17A]/80">
                              {skillName}
                            </label>
                            <div className="px-3 py-2 border border-[#CEA17A]/20 rounded-lg bg-[#19171b]/30 backdrop-blur-sm text-[#DBD0C0] text-sm">
                              {Array.isArray(skillValue) ? skillValue.join(', ') : skillValue}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#CEA17A]/20">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium text-sm sm:text-base"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
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
                {playerProfile ? 'Edit Profile' : 'Profile Details'}
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
                      disabled
                      readOnly
                      className={`w-full px-4 py-3 border-2 rounded-xl bg-[#19171b]/30 backdrop-blur-sm text-[#CEA17A]/70 cursor-not-allowed ${
                        formErrors.display_name ? 'border-red-500' : 'border-[#CEA17A]/20'
                      }`}
                      placeholder="Auto-filled from user profile"
                    />
                    <p className="text-xs text-[#CEA17A]/60">
                      Display name is automatically generated from your first and last name
                    </p>
                    {formErrors.display_name && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.display_name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="mobile_number" className="block text-sm font-semibold text-[#CEA17A]">
                      CricHeroes Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="mobile_number"
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handleInputChange}
                      required
                      maxLength={10}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0] ${
                        formErrors.mobile_number ? 'border-red-500' : 'border-[#CEA17A]/20'
                      }`}
                      placeholder="Enter your CricHeroes Mobile Number (10 digits)"
                    />
                    {formErrors.mobile_number && (
                      <p className="text-red-500 text-sm">{formErrors.mobile_number}</p>
                    )}
                    <p className="text-xs text-[#CEA17A]/60">
                      Indian mobile number: 10 digits starting with 6, 7, 8, or 9
                    </p>
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
                    maxLength={4096}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0] ${
                      formErrors.profile_pic_url ? 'border-red-500' : 'border-[#CEA17A]/20'
                    }`}
                    placeholder="Enter profile picture URL (optional)"
                  />
                  {formErrors.profile_pic_url && (
                    <p className="text-red-500 text-sm">{formErrors.profile_pic_url}</p>
                  )}
                  <p className="text-xs text-[#CEA17A]/60">
                    {formData.profile_pic_url.length}/4096 characters
                  </p>
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
                    maxLength={4096}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0] resize-none ${
                      formErrors.bio ? 'border-red-500' : 'border-[#CEA17A]/20'
                    }`}
                    placeholder="Tell us about yourself (optional)"
                  />
                  {formErrors.bio && (
                    <p className="text-red-500 text-sm">{formErrors.bio}</p>
                  )}
                  <p className="text-xs text-[#CEA17A]/60">
                    {formData.bio.length}/4096 characters
                  </p>
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
                        return null
                      }

                      const skillKey = skill.skill_name
                      const isMultiSelect = skill.skill_type === 'multiselect'
                      const currentValue = formData.skills[skillKey] || (isMultiSelect ? [] : '')

                      // Check if this skill should be read-only for regular users
                      const isReadOnly = skill.is_admin_managed && (userRole !== 'admin' && userRole !== 'host')

                      return (
                        <div key={skill.id} className="space-y-2">
                          <label htmlFor={skillKey} className="block text-sm font-medium text-[#CEA17A]">
                            {skill.skill_name === 'Base Price' 
                              ? 'Base Price (Admin will set the Base Price)' 
                              : skill.skill_name
                            } {(skill.is_required || skill.skill_name === 'Community' || skill.skill_name === 'Role' || skill.skill_name === 'Batting Style' || skill.skill_name === 'Bowling Style') && <span className="text-red-500">*</span>}
                          </label>
                          
                          {isMultiSelect ? (
                            // Multi-select with checkboxes
                            <div className="space-y-2">
                              <div className={`max-h-32 overflow-y-auto border-2 rounded-xl p-3 bg-[#19171b]/50 backdrop-blur-sm ${
                                formErrors[skillKey] ? 'border-red-500' : 'border-[#CEA17A]/20'
                              } ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                {skill.values && skill.values.map((value) => (
                                  <label key={value.id} className={`flex items-center space-x-2 p-1 rounded transition-colors duration-200 ${
                                    isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-[#CEA17A]/10'
                                  }`}>
                                    <input
                                      type="checkbox"
                                      checked={Array.isArray(currentValue) && currentValue.includes(value.value_name)}
                                      disabled={isReadOnly}
                                      onChange={(e) => {
                                        if (isReadOnly) return
                                        
                                        const newSkills = { ...formData.skills }
                                        const currentArray = Array.isArray(currentValue) ? currentValue : []
                                        
                                        if (e.target.checked) {
                                          newSkills[skillKey] = [...currentArray, value.value_name]
                                        } else {
                                          newSkills[skillKey] = currentArray.filter(v => v !== value.value_name)
                                        }
                                        setFormData({ ...formData, skills: newSkills })
                                        
                                        // Clear error when user makes a selection
                                        if (formErrors[skillKey]) {
                                          setFormErrors(prev => ({
                                            ...prev,
                                            [skillKey]: undefined
                                          }))
                                        }
                                      }}
                                      className={`h-4 w-4 text-[#CEA17A] focus:ring-[#CEA17A]/20 border-[#CEA17A]/30 rounded bg-[#19171b]/50 ${
                                        isReadOnly ? 'cursor-not-allowed' : ''
                                      }`}
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
                              {formErrors[skillKey] && (
                                <p className="text-red-500 text-sm">{formErrors[skillKey]}</p>
                              )}
                            </div>
                          ) : (
                            // Single select dropdown
                            <div className="space-y-2">
                              <select
                                id={skillKey}
                                name={skillKey}
                                value={currentValue}
                                disabled={isReadOnly}
                                onChange={(e) => {
                                  if (isReadOnly) return
                                  
                                  const newSkills = { ...formData.skills }
                                  newSkills[skillKey] = e.target.value
                                  setFormData({ ...formData, skills: newSkills })
                                  
                                  // Clear error when user makes a selection
                                  if (formErrors[skillKey]) {
                                    setFormErrors(prev => ({
                                      ...prev,
                                      [skillKey]: undefined
                                    }))
                                  }
                                }}
                                required={skill.is_required || skill.skill_name === 'Community' || skill.skill_name === 'Role' || skill.skill_name === 'Batting Style' || skill.skill_name === 'Bowling Style'}
                                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0] ${
                                  formErrors[skillKey] ? 'border-red-500' : 'border-[#CEA17A]/20'
                                } ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                              >
                                <option value="">
                                  {skill.skill_name === 'Base Price' 
                                    ? 'Admin Managed' 
                                    : `Select ${skill.skill_name}`
                                  }
                                </option>
                                {skill.values && skill.values.map((value) => (
                                  <option key={value.id} value={value.value_name}>
                                    {value.value_name}
                                  </option>
                                ))}
                              </select>
                              {formErrors[skillKey] && (
                                <p className="text-red-500 text-sm">{formErrors[skillKey]}</p>
                              )}
                            </div>
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

        {/* Quick Stats Card */}
        {!isEditing && playerProfile && (
          <div className="bg-[#19171b]/50 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden border border-[#CEA17A]/10 hover:animate-border-glow transition-all duration-150">
            <div className="bg-gradient-to-r from-[#CEA17A]/20 to-[#CEA17A]/10 px-4 sm:px-6 py-3 sm:py-4 border-b border-[#CEA17A]/20">
              <h3 className="text-lg font-bold text-[#DBD0C0] flex items-center">
                <span className="w-6 h-6 bg-[#CEA17A]/20 rounded-lg flex items-center justify-center mr-3 text-sm">
                  📊
                </span>
                Quick Stats
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#CEA17A]/80">
                    Status
                  </label>
                  <div className={`px-3 py-2 border rounded-lg backdrop-blur-sm text-sm font-medium ${
                    playerProfile.status === 'approved' 
                      ? 'border-[#CEA17A]/20 bg-[#CEA17A]/20 text-[#CEA17A]'
                      : playerProfile.status === 'pending'
                      ? 'border-[#CEA17A]/20 bg-[#CEA17A]/20 text-[#CEA17A]'
                      : 'border-[#75020f]/20 bg-[#75020f]/20 text-[#75020f]'
                  }`}>
                    {playerProfile.status.charAt(0).toUpperCase() + playerProfile.status.slice(1)}
                  </div>
                </div>
                {formData.skills?.['Base Price'] && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#CEA17A]/80">
                      Base Price
                    </label>
                    <div className="px-3 py-2 border border-[#CEA17A]/20 rounded-lg bg-[#19171b]/30 backdrop-blur-sm text-[#DBD0C0] text-sm font-medium">
                      ₹{formData.skills['Base Price']}
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#CEA17A]/80">
                    Created
                  </label>
                  <div className="px-3 py-2 border border-[#CEA17A]/20 rounded-lg bg-[#19171b]/30 backdrop-blur-sm text-[#DBD0C0] text-sm">
                    {new Date(playerProfile.created_at).toLocaleDateString()}
                  </div>
                </div>
                {playerProfile.updated_at && (
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-[#CEA17A]/80">
                      Updated
                    </label>
                    <div className="px-3 py-2 border border-[#CEA17A]/20 rounded-lg bg-[#19171b]/30 backdrop-blur-sm text-[#DBD0C0] text-sm">
                      {new Date(playerProfile.updated_at).toLocaleDateString()}
                    </div>
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
