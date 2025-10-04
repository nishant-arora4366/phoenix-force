'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { sessionManager } from '@/lib/session'

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

interface PlayerProfile {
  id?: string
  user_id: string
  name: string
  bio?: string
  batting_style?: string
  bowling_style?: string
  role?: string
  price?: number
  group?: string
  photo?: string
  status?: string
  created_at?: string
  updated_at?: string
}

interface PlayerSkill {
  id: string
  name: string
  type: string
  required: boolean
  displayOrder: number
  values: PlayerSkillValue[]
}

interface PlayerSkillValue {
  id: string
  name: string
  displayOrder: number
}

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null)
  const [playerSkills, setPlayerSkills] = useState<PlayerSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isEditingPlayer, setIsEditingPlayer] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordMessage, setPasswordMessage] = useState('')
  const [playerMessage, setPlayerMessage] = useState('')

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

        // Fetch player profile
        const playerResponse = await fetch(`/api/players/user/${sessionUser.id}`)
        const playerResult = await playerResponse.json()
        
        if (playerResult.success && playerResult.data) {
          setPlayerProfile(playerResult.data)
        } else {
          // Initialize empty player profile if none exists
          setPlayerProfile({
            user_id: sessionUser.id,
            name: '',
            bio: '',
            batting_style: '',
            bowling_style: '',
            role: '',
            price: 0,
            group: '',
            photo: '',
            status: 'pending'
          })
        }

        // Fetch player skills
        const skillsResponse = await fetch('/api/player-skills')
        const skillsResult = await skillsResponse.json()
        
        if (skillsResult.success) {
          setPlayerSkills(skillsResult.skills)
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
        setProfile(result.data)
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

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    if (!profile) return
    setProfile(prev => ({
      ...prev!,
      [field]: value
    }))
  }

  const handlePasswordChange = async () => {
    if (!user) return

    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMessage('New password must be at least 6 characters long')
      return
    }

    setSaving(true)
    setPasswordMessage('')

    try {
      const response = await fetch('/api/auth/change-password', {
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
    } finally {
      setSaving(false)
    }
  }

  const handlePlayerProfileChange = (field: keyof PlayerProfile, value: string | number) => {
    if (!playerProfile) return
    setPlayerProfile(prev => ({
      ...prev!,
      [field]: value
    }))
  }

  const handlePlayerProfileSave = async () => {
    if (!user || !playerProfile) return

    setSaving(true)
    setPlayerMessage('')

    try {
      const response = await fetch('/api/players', {
        method: playerProfile.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': JSON.stringify(user),
        },
        body: JSON.stringify({
          ...playerProfile,
          user_id: user.id
        })
      })

      const result = await response.json()

      if (result.success) {
        setPlayerProfile(result.data)
        setPlayerMessage('Player profile saved successfully! It will be reviewed by an admin.')
        setIsEditingPlayer(false)
      } else {
        setPlayerMessage(`Error: ${result.error}`)
      }
    } catch (error: any) {
      setPlayerMessage(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <nav className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="text-2xl font-bold text-gray-900">
                  Phoenix Force Cricket
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/signin"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Please Sign In
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              You need to be signed in to view your profile.
            </p>
            <Link
              href="/signin"
              className="inline-block px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('Error') 
                ? 'bg-red-100 text-red-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {message}
            </div>
          )}

          {profile && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={profile.role}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profile.username || ''}
                    onChange={(e) => handleProfileChange('username', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      isEditing ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                    }`}
                    placeholder="Choose a username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={profile.firstname}
                    onChange={(e) => handleProfileChange('firstname', e.target.value)}
                    disabled={!isEditing}
                    required
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      isEditing ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={profile.middlename || ''}
                    onChange={(e) => handleProfileChange('middlename', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      isEditing ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={profile.lastname}
                    onChange={(e) => handleProfileChange('lastname', e.target.value)}
                    disabled={!isEditing}
                    required
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      isEditing ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                    }`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photo URL
                  </label>
                  <input
                    type="url"
                    value={profile.photo || ''}
                    onChange={(e) => handleProfileChange('photo', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                      isEditing ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                    }`}
                    placeholder="Profile photo URL"
                  />
                </div>
              </div>

              {profile.photo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Photo Preview
                  </label>
                  <img
                    src={profile.photo}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}

              {isEditing && (
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setMessage('')
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !profile.firstname || !profile.lastname}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Password Change Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
              <button
                onClick={() => {
                  setIsChangingPassword(!isChangingPassword)
                  setPasswordMessage('')
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  })
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {isChangingPassword ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {isChangingPassword && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Enter your current password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Enter your new password"
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Confirm your new password"
                    minLength={6}
                  />
                </div>

                {passwordMessage && (
                  <div className={`p-3 rounded-lg ${
                    passwordMessage.includes('successfully') 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}>
                    {passwordMessage}
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    onClick={() => {
                      setIsChangingPassword(false)
                      setPasswordMessage('')
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      })
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Player Profile Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Player Profile</h2>
              <button
                onClick={() => {
                  setIsEditingPlayer(!isEditingPlayer)
                  setPlayerMessage('')
                }}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {isEditingPlayer ? 'Cancel' : (playerProfile?.id ? 'Edit Player Profile' : 'Create Player Profile')}
              </button>
            </div>

            {playerMessage && (
              <div className={`mb-6 p-4 rounded-lg ${
                playerMessage.includes('successfully') 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {playerMessage}
              </div>
            )}

            {playerProfile && (
              <div className="space-y-6">
                {playerProfile.id && (
                  <div className="mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      playerProfile.status === 'approved' 
                        ? 'bg-green-100 text-green-800'
                        : playerProfile.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      Status: {playerProfile.status ? playerProfile.status.charAt(0).toUpperCase() + playerProfile.status.slice(1) : 'Unknown'}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Player Name *
                    </label>
                    <input
                      type="text"
                      value={playerProfile.name}
                      onChange={(e) => handlePlayerProfileChange('name', e.target.value)}
                      disabled={!isEditingPlayer}
                      required
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                        isEditingPlayer ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                      }`}
                      placeholder="Enter your player name"
                    />
                  </div>

                  {/* Dynamic skill fields */}
                  {playerSkills.map((skill) => (
                    <div key={skill.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {skill.name} {skill.required && '*'}
                      </label>
                      {skill.type === 'select' ? (
                        <select
                          value={playerProfile[skill.name.toLowerCase().replace(' ', '_') as keyof PlayerProfile] as string || ''}
                          onChange={(e) => handlePlayerProfileChange(skill.name.toLowerCase().replace(' ', '_') as keyof PlayerProfile, e.target.value)}
                          disabled={!isEditingPlayer}
                          required={skill.required}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                            isEditingPlayer ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <option value="">Select {skill.name}</option>
                          {skill.values.map((value) => (
                            <option key={value.id} value={value.name}>
                              {value.name}
                            </option>
                          ))}
                        </select>
                      ) : skill.type === 'number' ? (
                        <input
                          type="number"
                          value={playerProfile[skill.name.toLowerCase().replace(' ', '_') as keyof PlayerProfile] as number || ''}
                          onChange={(e) => handlePlayerProfileChange(skill.name.toLowerCase().replace(' ', '_') as keyof PlayerProfile, parseInt(e.target.value) || 0)}
                          disabled={!isEditingPlayer}
                          required={skill.required}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                            isEditingPlayer ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                          }`}
                          placeholder={`Enter your ${skill.name.toLowerCase()}`}
                          min="0"
                        />
                      ) : (
                        <input
                          type="text"
                          value={playerProfile[skill.name.toLowerCase().replace(' ', '_') as keyof PlayerProfile] as string || ''}
                          onChange={(e) => handlePlayerProfileChange(skill.name.toLowerCase().replace(' ', '_') as keyof PlayerProfile, e.target.value)}
                          disabled={!isEditingPlayer}
                          required={skill.required}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                            isEditingPlayer ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                          }`}
                          placeholder={`Enter your ${skill.name.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={playerProfile.bio || ''}
                      onChange={(e) => handlePlayerProfileChange('bio', e.target.value)}
                      disabled={!isEditingPlayer}
                      rows={4}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                        isEditingPlayer ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                      }`}
                      placeholder="Tell us about your cricket experience, achievements, etc."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Player Photo URL
                    </label>
                    <input
                      type="url"
                      value={playerProfile.photo || ''}
                      onChange={(e) => handlePlayerProfileChange('photo', e.target.value)}
                      disabled={!isEditingPlayer}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg ${
                        isEditingPlayer ? 'bg-white text-gray-900' : 'bg-gray-100 text-gray-600'
                      }`}
                      placeholder="Player photo URL"
                    />
                  </div>
                </div>

                {playerProfile.photo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Player Photo Preview
                    </label>
                    <img
                      src={playerProfile.photo}
                      alt="Player"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}

                {isEditingPlayer && (
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setIsEditingPlayer(false)
                        setPlayerMessage('')
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePlayerProfileSave}
                      disabled={saving || !playerProfile.name}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? 'Saving...' : (playerProfile.id ? 'Update Player Profile' : 'Create Player Profile')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
