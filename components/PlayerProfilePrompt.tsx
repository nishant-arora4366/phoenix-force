'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { sessionManager } from '@/lib/session'

interface PlayerProfilePromptProps {
  onClose: () => void
}

export default function PlayerProfilePrompt({ onClose }: PlayerProfilePromptProps) {
  const [user, setUser] = useState<any>(null)
  const [hasPlayerProfile, setHasPlayerProfile] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkUserAndProfile = async () => {
      try {
        const currentUser = sessionManager.getUser()
        setUser(currentUser)

        if (currentUser) {
          // Check if user has a player profile
          const response = await fetch('/api/player-profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${JSON.stringify(currentUser)}`
            }
          })

          if (response.ok) {
            const data = await response.json()
            setHasPlayerProfile(data.success && data.profile)
          } else {
            setHasPlayerProfile(false)
          }
        }
      } catch (error) {
        console.error('Error checking player profile:', error)
        setHasPlayerProfile(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkUserAndProfile()
  }, [])

  // Don't show prompt if user has a player profile or is still loading
  if (isLoading || hasPlayerProfile) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Complete Your Profile
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900">Player Profile Required</h4>
                <p className="text-sm text-gray-500">Create your player profile to participate in tournaments</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              To participate in tournaments and auctions, you need to create a player profile with your skills, ratings, and preferences.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/player-profile"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-center text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Create Player Profile
            </Link>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-center text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Maybe Later
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-3 text-center">
            You can create your player profile anytime from your profile page
          </p>
        </div>
      </div>
    </div>
  )
}
