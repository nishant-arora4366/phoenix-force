'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { sessionManager } from '@/src/lib/session'

interface Player {
  id: string
  display_name: string
  bio?: string
  profile_pic_url?: string
  mobile_number?: string
  created_at: string
  updated_at?: string
  skills?: { [key: string]: string | string[] }
}

export default function PlayerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { id } = await params
        
        // Get user info
        const currentUser = sessionManager.getUser()
        if (currentUser) {
          setUser(currentUser)
          setUserRole(currentUser.role || null)
        }

        // Fetch player data with user role for skill filtering
        const response = await fetch(`/api/players/${id}`, {
          headers: {
            'Authorization': JSON.stringify(currentUser || { role: 'viewer' })
          }
        })
        const result = await response.json()

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch player')
        }

        const player = result.data
        console.log('Player data received:', player)
        console.log('Player skills:', player.skills)
        setPlayer(player)
      } catch (error: any) {
        console.error('Error fetching player:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Listen for auth changes
    const unsubscribe = sessionManager.subscribe((userData) => {
      if (userData) {
        setUser(userData)
        setUserRole(userData.role || null)
      } else {
        setUser(null)
        setUserRole(null)
      }
    })

    return () => unsubscribe()
  }, [params])

  const handleDelete = async () => {
    if (!player || !confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
      return
    }

    try {
      const currentUser = sessionManager.getUser()
      if (!currentUser) {
        throw new Error('User not authenticated')
      }

      const response = await fetch(`/api/players/${player.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': JSON.stringify(currentUser)
        }
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete player')
      }

      // Redirect to players list
      router.push('/players')
    } catch (error: any) {
      console.error('Error deleting player:', error)
      alert(`Error: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#19171b] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CEA17A] mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-[#DBD0C0] mb-2">
                Loading Player...
              </h2>
              <p className="text-[#CEA17A]">
                Fetching player information
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-[#19171b] py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#09171F]/50 backdrop-blur-sm rounded-xl shadow-lg border border-[#CEA17A]/20 p-8">
            <div className="text-center">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-[#DBD0C0] mb-4">
                Player Not Found
              </h2>
              <p className="text-[#CEA17A] mb-6">
                {error || 'The requested player could not be found.'}
              </p>
              <button
                onClick={() => router.push('/players')}
                className="px-6 py-3 bg-[#CEA17A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#CEA17A]/10 backdrop-blur-sm rounded-lg hover:bg-[#CEA17A]/25 hover:border-[#CEA17A]/40 transition-all duration-150 font-medium"
              >
                Back to Players
              </button>
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
          <h1 className="text-2xl sm:text-4xl font-bold text-[#DBD0C0] mb-2 sm:mb-4">{player.display_name}</h1>
          <p className="text-[#CEA17A] text-sm sm:text-base">
            Player Details & Information
          </p>
        </div>

        {/* Player Details Card */}
        <div className="bg-[#19171b]/50 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl overflow-hidden border border-[#CEA17A]/10 hover:animate-border-glow transition-all duration-150 mb-6 sm:mb-8">
          <div className="bg-gradient-to-r from-[#CEA17A]/20 to-[#CEA17A]/10 px-4 sm:px-8 py-4 sm:py-6 border-b border-[#CEA17A]/20">
            <h2 className="text-lg sm:text-2xl font-bold text-[#DBD0C0]">Player Information</h2>
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
                    {player.profile_pic_url ? (
                      <img
                        src={player.profile_pic_url}
                        alt={player.display_name}
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
                {player.mobile_number && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#CEA17A]">
                      Mobile Number
                    </label>
                    <div className="px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0]">
                      {player.mobile_number}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {player.bio && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#CEA17A]">
                      Bio
                    </label>
                    <div className="px-4 py-3 border-2 border-[#CEA17A]/20 rounded-xl bg-[#19171b]/50 backdrop-blur-sm text-[#DBD0C0] leading-relaxed">
                      {player.bio}
                    </div>
                  </div>
                )}

                {/* Player Skills & Attributes */}
                {player.skills && Object.keys(player.skills).length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#CEA17A]">
                      Skills & Attributes
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(player.skills).map(([skillName, skillValue]) => (
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
                {(userRole === 'admin' || userRole === 'host') && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#CEA17A]/20">
                    <button
                      onClick={() => router.push(`/players/${player.id}/edit`)}
                      className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium text-sm sm:text-base"
                    >
                      Edit Player
                    </button>
                    {userRole === 'admin' && (
                      <button
                        onClick={handleDelete}
                        className="px-6 py-3 bg-[#75020f]/15 text-[#75020f] border border-[#75020f]/25 shadow-lg shadow-[#75020f]/10 backdrop-blur-sm rounded-lg hover:bg-[#75020f]/25 hover:border-[#75020f]/40 transition-all duration-200 font-medium text-sm sm:text-base"
                      >
                        Delete Player
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Card */}
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
                  Created
                </label>
                <div className="px-3 py-2 border border-[#CEA17A]/20 rounded-lg bg-[#19171b]/30 backdrop-blur-sm text-[#DBD0C0] text-sm">
                  {new Date(player.created_at).toLocaleDateString()}
                </div>
              </div>
              {player.updated_at && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#CEA17A]/80">
                    Updated
                  </label>
                  <div className="px-3 py-2 border border-[#CEA17A]/20 rounded-lg bg-[#19171b]/30 backdrop-blur-sm text-[#DBD0C0] text-sm">
                    {new Date(player.updated_at).toLocaleDateString()}
                  </div>
                </div>
              )}
              {player.skills?.['Base Price'] && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#CEA17A]/80">
                    Base Price
                  </label>
                  <div className="px-3 py-2 border border-[#CEA17A]/20 rounded-lg bg-[#19171b]/30 backdrop-blur-sm text-[#DBD0C0] text-sm font-medium">
                    ₹{player.skills['Base Price']}
                  </div>
                </div>
              )}
              {player.skills?.Group && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-[#CEA17A]/80">
                    Group
                  </label>
                  <div className="px-3 py-2 border border-[#CEA17A]/20 rounded-lg bg-[#19171b]/30 backdrop-blur-sm text-[#DBD0C0] text-sm">
                    {player.skills.Group}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back to Players Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/players')}
            className="px-6 py-3 bg-[#3E4E5A]/15 text-[#CEA17A] border border-[#CEA17A]/25 shadow-lg shadow-[#3E4E5A]/10 backdrop-blur-sm rounded-lg hover:bg-[#3E4E5A]/25 hover:border-[#CEA17A]/40 transition-all duration-200 font-medium"
          >
            ← Back to Players
          </button>
        </div>
      </div>
    </div>
  )
}
