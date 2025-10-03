'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface AuthFormProps {
  onAuthChange?: (user: any) => void
}

export default function AuthForm({ onAuthChange }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [user, setUser] = useState<any>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      let authData
      
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        
        if (error) throw error
        
        authData = data
        setMessage('Check your email for the confirmation link!')
        setUser(data.user)
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
          const { error: syncError } = await supabase
            .from('users')
            .upsert({
              id: authData.user.id,
              email: authData.user.email || '',
              role: 'viewer'
            }, { onConflict: 'id' })
          
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
            Email
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
            Password
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
