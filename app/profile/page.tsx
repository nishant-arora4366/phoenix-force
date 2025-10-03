'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

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

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Fetch user profile from users table
        const response = await fetch(`/api/user-profile?userId=${user.id}`)
        const result = await response.json()
        
        if (result.success) {
          setProfile(result.data)
        }
      }
      
      setLoading(false)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
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
        </div>
      </div>
    </div>
  )
}
