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
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading profile...</p>
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
                Please sign in to access your profile.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/signin"
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">User Profile</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your account information and settings
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gray-700 px-8 py-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Profile Information</h2>
              <div className="flex space-x-3">
                <Link
                  href="/player-profile"
                  className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  Player Profile
                </Link>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            {isEditing ? (
              /* Edit Form */
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-semibold text-gray-700">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      value={profile?.username || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, username: e.target.value } : null)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-gray-50"
                      placeholder="Enter username"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={profile?.email || ''}
                      disabled
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-500"
                      placeholder="Email cannot be changed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="firstname" className="block text-sm font-semibold text-gray-700">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstname"
                      value={profile?.firstname || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, firstname: e.target.value } : null)}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-gray-50"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="middlename" className="block text-sm font-semibold text-gray-700">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      id="middlename"
                      value={profile?.middlename || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, middlename: e.target.value } : null)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-gray-50"
                      placeholder="Enter middle name (optional)"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="lastname" className="block text-sm font-semibold text-gray-700">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastname"
                      value={profile?.lastname || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, lastname: e.target.value } : null)}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-gray-50"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="photo" className="block text-sm font-semibold text-gray-700">
                      Photo URL
                    </label>
                    <input
                      type="url"
                      id="photo"
                      value={profile?.photo || ''}
                      onChange={(e) => setProfile(prev => prev ? { ...prev, photo: e.target.value } : null)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-gray-50"
                      placeholder="Enter photo URL (optional)"
                    />
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
                      <p className="text-sm font-medium">{message}</p>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-green-100"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              /* View Mode */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Username
                    </label>
                    <p className="text-lg text-gray-900">{profile?.username || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <p className="text-lg text-gray-900">{profile?.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name
                    </label>
                    <p className="text-lg text-gray-900">{profile?.firstname}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Middle Name
                    </label>
                    <p className="text-lg text-gray-900">{profile?.middlename || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name
                    </label>
                    <p className="text-lg text-gray-900">{profile?.lastname}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Role
                    </label>
                    <p className="text-lg text-gray-900 capitalize">{profile?.role}</p>
                  </div>
                </div>

                {/* Profile Picture */}
                {profile?.photo && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Profile Picture
                    </label>
                    <img 
                      src={profile.photo} 
                      alt="Profile" 
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Password Change Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gray-700 px-8 py-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Security</h2>
              <button
                onClick={() => setIsChangingPassword(!isChangingPassword)}
                className="px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 transition-colors"
              >
                {isChangingPassword ? 'Cancel' : 'Change Password'}
              </button>
            </div>
          </div>

          <div className="p-8">
            {isChangingPassword ? (
              <form onSubmit={(e) => { e.preventDefault(); handlePasswordChange(); }} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                      Current Password *
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-gray-50"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                      New Password *
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-gray-50"
                      placeholder="Enter new password"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 bg-gray-50"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                {/* Password Message */}
                {passwordMessage && (
                  <div className={`p-4 rounded-xl border-2 ${
                    passwordMessage.includes('Error')
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-green-50 border-green-200 text-green-800'
                  }`}>
                    <div className="flex items-center">
                      <div className={`w-5 h-5 mr-3 ${
                        passwordMessage.includes('Error') ? 'text-red-500' : 'text-green-500'
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

                {/* Change Password Button */}
                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 text-4xl mb-4">🔒</div>
                <p className="text-gray-600">Click "Change Password" to update your password</p>
              </div>
            )}
          </div>
        </div>

        {/* Sign Out Section */}
        <div className="mt-8 text-center">
          <button
            onClick={handleSignOut}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}