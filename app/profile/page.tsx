'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { sessionManager } from '@/src/lib/session'

interface UserProfile {
  id: string
  email: string
  username?: string
  firstname: string
  middlename?: string
  lastname: string
  photo?: string
  role: string
  created_at: string
  updated_at: string
}

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordMessage, setPasswordMessage] = useState('')

  useEffect(() => {
    const getUser = async () => {
      // Get user from session manager
      const sessionUser = sessionManager.getUser()
      setUser(sessionUser)
      
      if (sessionUser) {
        // Fetch user profile from users table
        const response = await fetch(`/api/user-profile?userId=${sessionUser.id}`)
        const result = await response.json()
        
        if (result.success) {
          setProfile(result.data)
        }
      }
      
      setLoading(false)
    }

    getUser()

    // Subscribe to session changes
    const unsubscribe = sessionManager.subscribe((sessionUser) => {
      setUser(sessionUser)
      
      if (sessionUser) {
        // Fetch user profile when user changes
        fetch(`/api/user-profile?userId=${sessionUser.id}`)
          .then(response => response.json())
          .then(result => {
            if (result.success) {
              setProfile(result.data)
            }
          })
          .catch(error => {
            console.error('Error fetching user profile:', error)
          })
      } else {
        setProfile(null)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    // Clear session using session manager
    sessionManager.clearUser()
    setUser(null)
    setProfile(null)
  }

  const handleSave = async () => {
    if (!user || !profile) return

    setSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          profile: {
            username: profile.username,
            firstname: profile.firstname,
            middlename: profile.middlename,
            lastname: profile.lastname,
            photo: profile.photo
          }
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage('Profile updated successfully!')
        setIsEditing(false)
      } else {
        setMessage(`Error: ${result.error}`)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!user) return

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage('New password must be at least 6 characters')
      return
    }

    setPasswordMessage('')

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const result = await response.json()

      if (result.success) {
        setPasswordMessage('Password changed successfully!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setIsChangingPassword(false)
      } else {
        setPasswordMessage(`Error: ${result.error}`)
      }
    } catch (error: any) {
      setPasswordMessage(`Error: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#19171b] py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
          <p className="text-[#CEA17A] text-lg">Loading profile...</p>
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
                Please sign in to access your profile.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/signin?returnUrl=/profile"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/"
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Go Home
                </Link>
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
          <h1 className="text-2xl sm:text-4xl font-bold text-[#DBD0C0] mb-2 sm:mb-4">User Profile</h1>
          <p className="text-[#CEA17A] text-sm sm:text-base">
            Manage your account information and settings
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-[#19171b]/50 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden border border-[#CEA17A]/10 hover:animate-border-glow transition-all duration-150 mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-[#CEA17A]/20 to-[#CEA17A]/10 px-4 sm:px-8 py-4 sm:py-6 border-b border-[#CEA17A]/20">
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-2xl font-bold text-[#DBD0C0]">Profile Information</h2>
              <div className="flex space-x-3">
                <Link
                  href="/player-profile"
                  className="px-4 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium text-sm"
                >
                  Player Profile
                </Link>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium text-sm"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            {isEditing ? (
              /* Edit Form */
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-semibold text-[#CEA17A]">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={profile?.username || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, username: e.target.value } : null)}
                      className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
                      placeholder="Enter username"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-[#CEA17A]">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl bg-[#19171b]/30 text-[#CEA17A]/70"
                      placeholder="Email cannot be changed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="firstname" className="block text-sm font-semibold text-[#CEA17A]">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstname"
                      value={profile?.firstname || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, firstname: e.target.value } : null)}
                      required
                      className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="middlename" className="block text-sm font-semibold text-[#CEA17A]">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      id="middlename"
                      value={profile?.middlename || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, middlename: e.target.value } : null)}
                      className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
                      placeholder="Enter middle name (optional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastname" className="block text-sm font-semibold text-[#CEA17A]">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastname"
                      value={profile?.lastname || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, lastname: e.target.value } : null)}
                      required
                      className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="photo" className="block text-sm font-semibold text-[#CEA17A]">
                      Photo URL
                    </label>
                    <input
                      type="url"
                      id="photo"
                      value={profile?.photo || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, photo: e.target.value } : null)}
                      className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
                      placeholder="Enter photo URL (optional)"
                    />
                  </div>
                </div>

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
                      <h3 className="text-lg font-semibold text-[#DBD0C0]">Ready to Update?</h3>
                      <p className="text-sm text-[#CEA17A]">Review your information and save your changes</p>
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
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              /* View Mode */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                {/* Profile Photo - Square on the side */}
                <div className="lg:col-span-1">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#CEA17A]">
                      Profile Picture
                    </label>
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden border-2 border-[#CEA17A]/20">
                      {profile?.photo ? (
                        <img
                          src={profile.photo}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <div className="text-6xl text-[#CEA17A]/60">👤</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Details - Label-Value Format */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#CEA17A]">
                        Username
                      </label>
                      <div className="px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]">
                        {profile?.username || 'Not set'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#CEA17A]">
                        Email
                      </label>
                      <div className="px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]">
                        {profile?.email}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#CEA17A]">
                        First Name
                      </label>
                      <div className="px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]">
                        {profile?.firstname}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#CEA17A]">
                        Middle Name
                      </label>
                      <div className="px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]">
                        {profile?.middlename || 'Not set'}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#CEA17A]">
                        Last Name
                      </label>
                      <div className="px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]">
                        {profile?.lastname}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-[#CEA17A]">
                        Role
                      </label>
                      <div className="px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0] capitalize">
                        {profile?.role}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Password Change Section */}
        <div className="bg-[#19171b]/50 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden border border-[#CEA17A]/10 hover:animate-border-glow transition-all duration-150 mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-[#CEA17A]/20 to-[#CEA17A]/10 px-4 sm:px-8 py-4 sm:py-6 border-b border-[#CEA17A]/20">
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-2xl font-bold text-[#DBD0C0]">Security</h2>
              <button
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="px-4 py-2 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium text-sm"
              >
                {isChangingPassword ? 'Cancel' : 'Change Password'}
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            {isChangingPassword ? (
              <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} className="space-y-6 sm:space-y-8">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-semibold text-[#CEA17A] mb-2">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                      className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-semibold text-[#CEA17A] mb-2">
                      New Password *
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                      className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#CEA17A] mb-2">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      className="w-full px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl focus:ring-4 focus:ring-[#CEA17A]/20 focus:border-[#CEA17A] transition-all duration-200 bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                {/* Password Message */}
                {passwordMessage && (
                  <div className={`p-4 rounded-xl border-2 ${
                    passwordMessage.includes('Error')
                      ? 'bg-[#75020f]/20 border-[#75020f]/30 text-[#DBD0C0]'
                      : 'bg-[#CEA17A]/20 border-[#CEA17A]/30 text-[#DBD0C0]'
                  }`}>
                    <div className="flex items-center">
                      <div className={`w-5 h-5 mr-3 ${
                        passwordMessage.includes('Error') ? 'text-[#75020f]' : 'text-[#CEA17A]'
                      }`}>
                        {passwordMessage.includes('Error') ? (
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-sm font-medium">{passwordMessage}</p>
                    </div>
                  </div>
                )}

                {/* Submit Section */}
                <div className="bg-gradient-to-r from-[#CEA17A]/10 to-[#CEA17A]/5 rounded-xl p-4 sm:p-6 border-2 border-[#CEA17A]/20 backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                    <div className="text-center sm:text-left">
                      <h3 className="text-lg font-semibold text-[#DBD0C0]">Ready to Change Password?</h3>
                      <p className="text-sm text-[#CEA17A]">Review your information and update your password</p>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsChangingPassword(false)}
                        className="w-full sm:w-auto px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium text-sm sm:text-base"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#CEA17A] to-[#CEA17A]/80 text-[#09171F] font-semibold rounded-xl hover:from-[#CEA17A]/90 hover:to-[#CEA17A]/70 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
                      >
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="text-[#CEA17A]/50 text-4xl mb-4">🔒</div>
                <p className="text-[#CEA17A]">Click "Change Password" to update your password</p>
              </div>
            )}
          </div>
        </div>

        {/* Sign Out Section */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSignOut}
            className="px-6 py-3 bg-[#75020f]/15 text-[#75020f] border border-[#75020f]/25 shadow-lg shadow-[#75020f]/10 backdrop-blur-sm rounded-lg hover:bg-[#75020f]/25 hover:border-[#75020f]/40 transition-all duration-200 font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}