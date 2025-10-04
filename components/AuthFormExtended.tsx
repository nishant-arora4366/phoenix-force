'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface AuthFormProps {
  onAuthChange?: (user: any) => void
}

interface UserProfile {
  username: string
  firstname: string
  middlename?: string
  lastname: string
  photo?: string
}

export default function AuthFormExtended({ onAuthChange }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // New user profile fields
  const [profile, setProfile] = useState<UserProfile>({
    username: '',
    firstname: '',
    middlename: '',
    lastname: '',
    photo: ''
  })

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      let authData
      
      if (isSignUp) {
        // Validate required fields for signup
        if (!profile.firstname.trim() || !profile.lastname.trim()) {
          throw new Error('First name and last name are required')
        }

        // Use custom registration API
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            username: profile.username || email.split('@')[0],
            firstname: profile.firstname,
            lastname: profile.lastname
          }),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error)
        }
        
        setMessage('Registration successful! Your account is pending admin approval.')
        // Don't set user yet since they need approval
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        
        authData = data
        setMessage('Successfully signed in!')
        setUser(data.user)
      }
      
      if (onAuthChange && authData) {
        onAuthChange(authData.user)
      }
      
      // Sync user to public.users table after successful auth
      if (authData?.user) {
        try {
          // For sign up, use profile data; for sign in, use existing user data or defaults
          const userData = isSignUp ? {
            id: authData.user.id,
            email: authData.user.email || '',
            username: profile.username || email.split('@')[0],
            firstname: profile.firstname,
            middlename: profile.middlename || null,
            lastname: profile.lastname,
            photo: profile.photo || null,
            role: 'viewer'
          } : {
            id: authData.user.id,
            email: authData.user.email || '',
            // For sign in, don't overwrite existing user data
            updated_at: new Date().toISOString()
          }

          const { error: syncError } = await supabase
            .from('users')
            .upsert(userData, { onConflict: 'id' })
          
          if (syncError) {
            console.warn('Failed to sync user:', syncError.message)
          }
        } catch (syncErr) {
          console.warn('User sync error:', syncErr)
        }
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setMessage('Successfully signed out!')
      setUser(null)
      if (onAuthChange) {
        onAuthChange(null)
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (user) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto border border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">
          Welcome!
        </h2>
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 text-gray-800 rounded-lg">
            <p className="text-sm">
              <strong>Email:</strong> {user.email}
            </p>
            <p className="text-sm">
              <strong>ID:</strong> {user.id}
            </p>
          </div>
          
          {message && (
            <div className="p-3 bg-gray-100 text-gray-800 rounded-lg text-sm">
              {message}
            </div>
          )}
          
          <button
            onClick={handleSignOut}
            disabled={loading}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto border border-gray-200">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </h2>
      
      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-900"
            placeholder="Enter your email"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password *
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-900"
            placeholder="Enter your password"
          />
        </div>

        {isSignUp && (
          <>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={profile.username}
                onChange={(e) => handleProfileChange('username', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-900"
                placeholder="Choose a username (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstname" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  id="firstname"
                  type="text"
                  value={profile.firstname}
                  onChange={(e) => handleProfileChange('firstname', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="First name"
                />
              </div>

              <div>
                <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  id="lastname"
                  type="text"
                  value={profile.lastname}
                  onChange={(e) => handleProfileChange('lastname', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-900"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="middlename" className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name
              </label>
              <input
                id="middlename"
                type="text"
                value={profile.middlename}
                onChange={(e) => handleProfileChange('middlename', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-900"
                placeholder="Middle name (optional)"
              />
            </div>

            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
                Photo URL
              </label>
              <input
                id="photo"
                type="url"
                value={profile.photo}
                onChange={(e) => handleProfileChange('photo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent bg-white text-gray-900"
                placeholder="Profile photo URL (optional)"
              />
            </div>
          </>
        )}
        
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('Error') 
              ? 'bg-gray-100 text-gray-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {message}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-gray-600 hover:text-gray-900 text-sm"
        >
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  )
}
