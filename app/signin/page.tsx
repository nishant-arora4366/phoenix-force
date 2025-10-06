'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import AuthFormExtended from '@/components/AuthFormExtended'
import PlayerProfilePrompt from '@/components/PlayerProfilePrompt'
import { sessionManager } from '@/lib/session'

export default function SignIn() {
  const [user, setUser] = useState<any>(null)
  const [showPlayerProfilePrompt, setShowPlayerProfilePrompt] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already logged in
    const getUser = async () => {
      const currentUser = sessionManager.getUser()
      setUser(currentUser)
    }
    getUser()

    // Listen for auth changes
    const unsubscribe = sessionManager.subscribe((userData) => {
      setUser(userData)
    })

    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    sessionManager.clearUser()
    setUser(null)
  }

  const handleAuthChange = (user: any) => {
    setUser(user)
    if (user) {
      // Check for player profile after sign in
      checkPlayerProfile(user)
    }
  }

  const checkPlayerProfile = async (userData: any) => {
    try {
      const response = await fetch('/api/player-profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${JSON.stringify(userData)}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Show prompt if user doesn't have a player profile
        if (!data.success || !data.profile) {
          setShowPlayerProfilePrompt(true)
        } else {
          // Redirect to homepage if user has profile
          router.push('/')
        }
      } else {
        // If API fails, show prompt
        setShowPlayerProfilePrompt(true)
      }
    } catch (error) {
      console.error('Error checking player profile:', error)
      // On error, show prompt to be safe
      setShowPlayerProfilePrompt(true)
    }
  }

  return (
    <div>
      {/* Player Profile Prompt */}
      {showPlayerProfilePrompt && (
        <PlayerProfilePrompt onClose={() => setShowPlayerProfilePrompt(false)} />
      )}
      
      {/* Sign In Form */}
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/"
              className="font-medium text-gray-600 hover:text-gray-900"
            >
              return to homepage
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
            <AuthFormExtended onAuthChange={handleAuthChange} />
          </div>
        </div>
      </div>
    </div>
  )
}
